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
    ) -> List[dict]:
        """
        Get questions for a match, avoiding recently seen questions.
        
        Args:
            category_slug: Category to pull from (e.g., 'fortnite')
            count: Number of questions needed
            user_ids: List of user IDs to avoid showing repeat questions
            avoid_recent_days: Days to look back for avoiding repeats
            difficulty_mix: Optional dict like {'easy': 5, 'medium': 7, 'hard': 3}
        
        Returns:
            List of question dicts
        """
        # Get category ID
        category = await self.get_category_by_slug(category_slug)
        if not category:
            return []
        
        category_id = category["id"]
        now = datetime.utcnow().isoformat()
        
        # Build base query
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
        
        # Filter out recently seen questions if user_ids provided
        if user_ids and avoid_recent_days > 0:
            cutoff = (datetime.utcnow() - timedelta(days=avoid_recent_days)).isoformat()
            
            # Get recently seen question IDs for these users
            history_result = (
                self._history()
                .select("question_id")
                .in_("user_id", user_ids)
                .gte("shown_at", cutoff)
                .execute()
            )
            
            seen_ids = {h["question_id"] for h in (history_result.data or [])}
            
            # Filter out seen questions
            fresh_questions = [q for q in all_questions if q["id"] not in seen_ids]
            
            # If not enough fresh questions, allow some repeats
            if len(fresh_questions) >= count:
                all_questions = fresh_questions
        
        # Shuffle and select
        import random
        random.shuffle(all_questions)
        
        # If difficulty mix specified, try to match it
        if difficulty_mix:
            selected = []
            remaining = list(all_questions)
            
            for diff, num in difficulty_mix.items():
                diff_questions = [q for q in remaining if q.get("difficulty") == diff]
                take = min(num, len(diff_questions))
                selected.extend(diff_questions[:take])
                for q in diff_questions[:take]:
                    remaining.remove(q)
            
            # Fill remaining slots with any questions
            needed = count - len(selected)
            if needed > 0:
                selected.extend(remaining[:needed])
            
            random.shuffle(selected)
            return selected[:count]
        
        return all_questions[:count]

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
