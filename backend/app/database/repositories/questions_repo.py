"""
Questions repository - Database operations for trivia questions.
"""

from typing import Optional, List
from datetime import datetime, timedelta

from supabase import Client


class QuestionsRepository:
    """Repository for questions database operations."""

    def __init__(self, client: Client):
        self._client = client

    def _questions(self):
        return self._client.table("questions")

    def _categories(self):
        return self._client.table("question_categories")

    def _subcategories(self):
        return self._client.table("question_subcategories")

    def _history(self):
        return self._client.table("user_question_history")

    # ============================================
    # Category Operations
    # ============================================

    async def get_categories(self, active_only: bool = True) -> List[dict]:
        """Get all question categories."""
        query = self._categories().select("*").order("sort_order")
        if active_only:
            query = query.eq("is_active", True)
        result = query.execute()
        return result.data or []

    async def get_category_by_slug(self, slug: str) -> Optional[dict]:
        """Get a category by its slug."""
        result = (
            self._categories()
            .select("*")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def create_category(self, data: dict) -> Optional[dict]:
        """Create a new category."""
        result = self._categories().insert(data).execute()
        return result.data[0] if result.data else None

    # ============================================
    # Subcategory Operations
    # ============================================

    async def get_subcategories(
        self, category_id: str, active_only: bool = True
    ) -> List[dict]:
        """Get subcategories for a category."""
        query = (
            self._subcategories()
            .select("*")
            .eq("category_id", category_id)
        )
        if active_only:
            query = query.eq("is_active", True)
        result = query.execute()
        return result.data or []

    async def get_subcategory_by_slug(
        self, category_id: str, slug: str
    ) -> Optional[dict]:
        """Get a subcategory by slug within a category."""
        result = (
            self._subcategories()
            .select("*")
            .eq("category_id", category_id)
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    # ============================================
    # Question Operations
    # ============================================

    async def get_questions_for_match(
        self,
        category_slug: str,
        count: int = 15,
        user_ids: Optional[List[str]] = None,
        avoid_recent_days: int = 7,
        difficulty_mix: Optional[dict] = None,
    ) -> tuple[List[dict], dict]:
        """
        Get questions for a match with smart freshness selection.
        
        Requirements: 1.1, 1.2, 4.1, 4.2, 4.3
        
        Selection algorithm:
        1. Get all active questions for category
        2. Exclude questions seen by ANY user within lookback period
        3. If not enough fresh questions, include oldest-seen questions
        4. Shuffle and return requested count
        
        Args:
            category_slug: Category to pull from (e.g., 'fortnite')
            count: Number of questions needed
            user_ids: List of user IDs to avoid showing repeat questions
            avoid_recent_days: Days to look back for avoiding repeats
            difficulty_mix: Optional dict like {'easy': 5, 'medium': 7, 'hard': 3}
        
        Returns:
            Tuple of (List of question dicts, selection_stats dict)
            selection_stats contains: fresh_count, repeat_count, pool_size
        """
        import random
        import logging
        logger = logging.getLogger(__name__)
        
        # Get category ID
        category = await self.get_category_by_slug(category_slug)
        if not category:
            return [], {"fresh_count": 0, "repeat_count": 0, "pool_size": 0}
        
        category_id = category["id"]
        now = datetime.utcnow().isoformat()
        
        # Build base query for all active questions
        query = (
            self._questions()
            .select("*")
            .eq("category_id", category_id)
            .eq("is_active", True)
        )
        
        # Filter by validity window
        query = query.or_(f"valid_from.is.null,valid_from.lte.{now}")
        query = query.or_(f"valid_until.is.null,valid_until.gte.{now}")
        
        # Execute query
        result = query.execute()
        all_questions = result.data or []
        pool_size = len(all_questions)
        
        if pool_size == 0:
            return [], {"fresh_count": 0, "repeat_count": 0, "pool_size": 0}
        
        # Build question lookup by ID
        questions_by_id = {q["id"]: q for q in all_questions}
        all_question_ids = set(questions_by_id.keys())
        
        # Get seen question IDs if user_ids provided
        seen_ids = set()
        if user_ids and avoid_recent_days > 0:
            seen_ids = await self.get_seen_question_ids(
                user_ids=user_ids,
                category_id=category_id,
                since_days=avoid_recent_days,
            )
        
        # Separate fresh and seen questions
        fresh_ids = all_question_ids - seen_ids
        fresh_questions = [questions_by_id[q_id] for q_id in fresh_ids]
        
        # Selection stats
        fresh_count = 0
        repeat_count = 0
        selected = []
        
        # First, try to fill with fresh questions
        random.shuffle(fresh_questions)
        
        if difficulty_mix:
            # Handle difficulty mix for fresh questions
            remaining_fresh = list(fresh_questions)
            for diff, num in difficulty_mix.items():
                diff_questions = [q for q in remaining_fresh if q.get("difficulty") == diff]
                take = min(num, len(diff_questions))
                selected.extend(diff_questions[:take])
                for q in diff_questions[:take]:
                    remaining_fresh.remove(q)
            
            # Fill remaining with any fresh questions
            needed = count - len(selected)
            if needed > 0 and remaining_fresh:
                selected.extend(remaining_fresh[:needed])
        else:
            selected = fresh_questions[:count]
        
        fresh_count = len(selected)
        
        # If not enough fresh questions, get oldest-seen as fallback
        if len(selected) < count and seen_ids:
            needed = count - len(selected)
            
            # Get oldest-seen questions
            oldest_seen_ids = await self.get_oldest_seen_questions(
                user_ids=user_ids,
                category_id=category_id,
                question_ids=list(seen_ids),
                count=needed,
            )
            
            # Add oldest-seen questions
            for q_id in oldest_seen_ids:
                if q_id in questions_by_id and len(selected) < count:
                    selected.append(questions_by_id[q_id])
                    repeat_count += 1
            
            # Log warning if using many repeats
            if repeat_count > 0:
                exhaustion_pct = (len(seen_ids) / pool_size) * 100 if pool_size > 0 else 0
                logger.warning(
                    f"Question pool exhaustion: {exhaustion_pct:.1f}% seen. "
                    f"Using {repeat_count} repeat questions for match."
                )
        
        # Final shuffle
        random.shuffle(selected)
        
        selection_stats = {
            "fresh_count": fresh_count,
            "repeat_count": repeat_count,
            "pool_size": pool_size,
            "pool_exhaustion_pct": (len(seen_ids) / pool_size * 100) if pool_size > 0 else 0,
        }
        
        return selected[:count], selection_stats

    async def get_question(self, question_id: str) -> Optional[dict]:
        """Get a single question by ID."""
        result = (
            self._questions()
            .select("*")
            .eq("id", question_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def create_question(self, data: dict) -> Optional[dict]:
        """Create a new question."""
        data["created_at"] = datetime.utcnow().isoformat()
        data["updated_at"] = datetime.utcnow().isoformat()
        result = self._questions().insert(data).execute()
        return result.data[0] if result.data else None

    async def create_questions_bulk(self, questions: List[dict]) -> List[dict]:
        """Bulk insert questions."""
        now = datetime.utcnow().isoformat()
        for q in questions:
            q["created_at"] = now
            q["updated_at"] = now
        
        result = self._questions().insert(questions).execute()
        return result.data or []

    async def update_question(
        self, question_id: str, data: dict
    ) -> Optional[dict]:
        """Update a question."""
        data["updated_at"] = datetime.utcnow().isoformat()
        result = (
            self._questions()
            .update(data)
            .eq("id", question_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete_question(self, question_id: str) -> bool:
        """Delete a question."""
        result = (
            self._questions()
            .delete()
            .eq("id", question_id)
            .execute()
        )
        return bool(result.data)

    async def get_question_count(
        self, category_slug: Optional[str] = None
    ) -> int:
        """Get total question count, optionally filtered by category."""
        query = self._questions().select("id", count="exact").eq("is_active", True)
        
        if category_slug:
            category = await self.get_category_by_slug(category_slug)
            if category:
                query = query.eq("category_id", category["id"])
        
        result = query.execute()
        return result.count or 0

    # ============================================
    # User History Operations
    # ============================================

    async def record_question_shown(
        self,
        user_id: str,
        question_id: str,
        was_correct: Optional[bool] = None,
        answer_time_ms: Optional[int] = None,
        match_id: Optional[str] = None,
    ) -> None:
        """Record that a question was shown to a user."""
        data = {
            "user_id": user_id,
            "question_id": question_id,
            "shown_at": datetime.utcnow().isoformat(),
            "was_correct": was_correct,
            "answer_time_ms": answer_time_ms,
            "match_id": match_id,
        }
        
        # Upsert - update if exists, insert if not
        self._history().upsert(data).execute()

    async def get_user_history(
        self,
        user_id: str,
        limit: int = 100,
    ) -> List[dict]:
        """Get user's question history."""
        result = (
            self._history()
            .select("*, questions(*)")
            .eq("user_id", user_id)
            .order("shown_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def get_user_stats(self, user_id: str) -> dict:
        """Get user's question statistics."""
        result = (
            self._history()
            .select("was_correct, answer_time_ms")
            .eq("user_id", user_id)
            .execute()
        )
        
        history = result.data or []
        total = len(history)
        correct = sum(1 for h in history if h.get("was_correct"))
        times = [h["answer_time_ms"] for h in history if h.get("answer_time_ms")]
        
        return {
            "total_questions": total,
            "correct_answers": correct,
            "accuracy": correct / total if total > 0 else 0,
            "avg_answer_time_ms": sum(times) / len(times) if times else 0,
        }

    async def record_questions_batch(
        self,
        records: List[dict],
    ) -> int:
        """
        Batch insert question history records for efficient bulk recording.
        
        Requirements: 1.3, 1.4, 2.1, 2.2
        
        Args:
            records: List of dicts with keys:
                - user_id: str (required)
                - question_id: str (required)
                - shown_at: str ISO timestamp (optional, defaults to now)
                - was_correct: bool (optional)
                - answer_time_ms: int (optional)
                - match_id: str (optional)
        
        Returns:
            Number of records inserted/updated
        """
        if not records:
            return 0
        
        now = datetime.utcnow().isoformat()
        
        # Ensure all records have required fields and defaults
        prepared_records = []
        for record in records:
            prepared = {
                "user_id": record["user_id"],
                "question_id": record["question_id"],
                "shown_at": record.get("shown_at") or now,  # Default if None or missing
                "was_correct": record.get("was_correct"),
                "answer_time_ms": record.get("answer_time_ms"),
                "match_id": record.get("match_id"),
            }
            prepared_records.append(prepared)
        
        # Upsert all records - handles duplicates by updating existing
        # Primary key is (user_id, question_id) so duplicates update the record
        result = self._history().upsert(prepared_records).execute()
        
        return len(result.data) if result.data else 0

    async def update_question_analytics(
        self,
        question_id: str,
        was_correct: bool,
        answer_time_ms: Optional[int] = None,
    ) -> bool:
        """
        Update question analytics counters after an answer.
        
        Requirements: 5.1, 5.2, 5.3
        
        - Increments times_shown by 1
        - Increments times_correct by 1 if was_correct is True
        - Updates avg_answer_time_ms with rolling average
        
        Args:
            question_id: The question UUID
            was_correct: Whether the answer was correct
            answer_time_ms: Time taken to answer in milliseconds
            
        Returns:
            True if update succeeded, False otherwise
        """
        # First get current values
        question = await self.get_question(question_id)
        if not question:
            return False
        
        current_times_shown = question.get("times_shown", 0) or 0
        current_times_correct = question.get("times_correct", 0) or 0
        current_avg_time = question.get("avg_answer_time_ms")
        
        # Calculate new values
        new_times_shown = current_times_shown + 1
        new_times_correct = current_times_correct + (1 if was_correct else 0)
        
        # Calculate new rolling average for answer time
        new_avg_time = current_avg_time
        if answer_time_ms is not None:
            if current_avg_time is None or current_times_shown == 0:
                new_avg_time = answer_time_ms
            else:
                # Rolling average: (old_avg * old_count + new_value) / new_count
                new_avg_time = int(
                    (current_avg_time * current_times_shown + answer_time_ms)
                    / new_times_shown
                )
        
        # Update the question record
        update_data = {
            "times_shown": new_times_shown,
            "times_correct": new_times_correct,
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        if new_avg_time is not None:
            update_data["avg_answer_time_ms"] = new_avg_time
        
        result = (
            self._questions()
            .update(update_data)
            .eq("id", question_id)
            .execute()
        )
        
        return bool(result.data)

    async def get_seen_question_ids(
        self,
        user_ids: List[str],
        category_id: str,
        since_days: int = 7,
    ) -> set:
        """
        Get question IDs seen by any of the users within timeframe.
        
        Requirements: 1.1, 4.1
        
        Args:
            user_ids: List of user IDs to check history for
            category_id: Category UUID to filter questions
            since_days: Number of days to look back
            
        Returns:
            Set of question IDs seen by any user
        """
        if not user_ids:
            return set()
        
        cutoff = (datetime.utcnow() - timedelta(days=since_days)).isoformat()
        
        # Get question IDs from history for these users
        # Join with questions to filter by category
        history_result = (
            self._history()
            .select("question_id, questions!inner(category_id)")
            .in_("user_id", user_ids)
            .gte("shown_at", cutoff)
            .eq("questions.category_id", category_id)
            .execute()
        )
        
        seen_ids = {h["question_id"] for h in (history_result.data or [])}
        return seen_ids

    async def get_oldest_seen_questions(
        self,
        user_ids: List[str],
        category_id: str,
        question_ids: List[str],
        count: int,
    ) -> List[str]:
        """
        Get question IDs sorted by oldest seen first (for fallback selection).
        
        Requirements: 1.2, 4.2, 4.3
        
        When fresh questions are exhausted, we need to select questions
        that were seen longest ago.
        
        Args:
            user_ids: List of user IDs
            category_id: Category UUID
            question_ids: Pool of question IDs to consider
            count: Number of questions needed
            
        Returns:
            List of question IDs sorted by oldest shown_at
        """
        if not user_ids or not question_ids:
            return []
        
        # Get the most recent shown_at for each question across all users
        # We want questions where the MAX(shown_at) is oldest
        history_result = (
            self._history()
            .select("question_id, shown_at")
            .in_("user_id", user_ids)
            .in_("question_id", question_ids)
            .order("shown_at", desc=False)  # Oldest first
            .execute()
        )
        
        # Group by question_id and get the most recent shown_at for each
        question_last_seen = {}
        for h in (history_result.data or []):
            q_id = h["question_id"]
            shown_at = h["shown_at"]
            # Keep the most recent (max) shown_at for each question
            if q_id not in question_last_seen or shown_at > question_last_seen[q_id]:
                question_last_seen[q_id] = shown_at
        
        # Sort by oldest last-seen first
        sorted_questions = sorted(
            question_last_seen.items(),
            key=lambda x: x[1]  # Sort by shown_at ascending (oldest first)
        )
        
        return [q_id for q_id, _ in sorted_questions[:count]]
