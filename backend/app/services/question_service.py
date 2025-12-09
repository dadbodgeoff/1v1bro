"""
Question service.
Handles question loading and management from database.
"""

import random
import logging
from typing import List, Optional

from supabase import Client

from app.schemas.game import Question, QuestionPublic
from app.database.repositories.questions_repo import QuestionsRepository
from app.core.config import get_settings


settings = get_settings()
logger = logging.getLogger(__name__)

# Fallback hardcoded questions (used if database is empty)
FALLBACK_QUESTIONS: List[dict] = [
    {
        "id": "fallback-1",
        "text": "What year was Fortnite Battle Royale released?",
        "options": ["2016", "2017", "2018", "2019"],
        "correct_index": 1,
        "category": "fortnite",
    },
    {
        "id": "fallback-2",
        "text": "Which company developed Fortnite?",
        "options": ["Activision", "EA Games", "Epic Games", "Ubisoft"],
        "correct_index": 2,
        "category": "fortnite",
    },
    {
        "id": "fallback-3",
        "text": "What is the maximum number of players in a standard Battle Royale match?",
        "options": ["50", "75", "100", "150"],
        "correct_index": 2,
        "category": "fortnite",
    },
]


def _index_to_letter(index: int) -> str:
    """Convert 0-3 index to A-D letter."""
    return chr(ord('A') + index)


def _letter_to_index(letter: str) -> int:
    """Convert A-D letter to 0-3 index."""
    return ord(letter.upper()) - ord('A')


class QuestionService:
    """Service for question management with database support."""

    def __init__(self, client: Optional[Client] = None):
        self._client = client
        self._repo = QuestionsRepository(client) if client else None

    async def load_questions_async(
        self,
        count: int = None,
        category: str = "fortnite",
        user_ids: Optional[List[str]] = None,
        lookback_days: int = None,
    ) -> List[Question]:
        """
        Load questions from database for a game with smart freshness selection.
        
        Requirements: 1.1, 1.2, 4.1, 4.2, 4.3
        
        Args:
            count: Number of questions (default from settings)
            category: Category slug (e.g., 'fortnite', 'nfl')
            user_ids: User IDs to avoid showing repeat questions
            lookback_days: Days to look back for freshness (default: adaptive)
            
        Returns:
            List of Question objects
        """
        count = count or settings.QUESTIONS_PER_GAME
        
        if not self._repo:
            logger.warning("No database client, using fallback questions")
            return self._load_fallback(count)
        
        try:
            # Get pool size for adaptive lookback
            pool_size = await self._repo.get_question_count(category)
            
            # Calculate adaptive lookback if not specified
            if lookback_days is None:
                lookback_days = self.get_adaptive_lookback_days(pool_size)
            
            # Get questions from database with smart selection
            db_questions, selection_stats = await self._repo.get_questions_for_match(
                category_slug=category,
                count=count,
                user_ids=user_ids,
                avoid_recent_days=lookback_days,
            )
            
            if not db_questions:
                logger.warning(f"No questions found for category '{category}', using fallback")
                return self._load_fallback(count)
            
            # Log selection stats
            logger.info(
                f"Question selection for '{category}': "
                f"{selection_stats['fresh_count']} fresh, "
                f"{selection_stats['repeat_count']} repeats, "
                f"pool exhaustion: {selection_stats['pool_exhaustion_pct']:.1f}%"
            )
            
            # Convert to Question objects, storing original UUID for history tracking
            questions = []
            for q in db_questions:
                # Convert correct_index to correct_answer letter
                correct_letter = _index_to_letter(q["correct_index"])
                
                question = Question(
                    id=hash(q["id"]) % 10000,  # Convert UUID to int for compatibility
                    text=q["text"],
                    options=q["options"],
                    correct_answer=correct_letter,
                    category=category,
                    difficulty=q.get("difficulty"),
                )
                # Store original UUID for history tracking
                question._db_id = q["id"]
                questions.append(question)
            
            logger.info(f"Loaded {len(questions)} questions for category '{category}'")
            return questions
            
        except Exception as e:
            logger.error(f"Error loading questions from database: {e}")
            return self._load_fallback(count)

    def get_adaptive_lookback_days(
        self,
        pool_size: int,
        base_lookback: int = None,
        min_lookback: int = 1,
    ) -> int:
        """
        Calculate adaptive lookback period based on question pool size.
        
        Requirements: 3.1, 3.2
        
        For pools < 100 questions, scale proportionally to avoid
        running out of fresh questions too quickly.
        
        Args:
            pool_size: Total questions in the pool
            base_lookback: Default lookback in days (from config, default 7)
            min_lookback: Minimum lookback in days (1)
            
        Returns:
            Adjusted lookback period in days
        """
        # Use config value if not specified
        if base_lookback is None:
            base_lookback = settings.QUESTION_LOOKBACK_DAYS
        
        if pool_size >= 100:
            return base_lookback
        
        if pool_size <= 0:
            return min_lookback
        
        # Scale proportionally: pool_size / 100 * base_lookback
        scaled = int((pool_size / 100) * base_lookback)
        return max(min_lookback, scaled)

    def _load_fallback(self, count: int, shuffle: bool = True) -> List[Question]:
        """Load fallback hardcoded questions."""
        available = list(FALLBACK_QUESTIONS)
        if shuffle:
            random.shuffle(available)
        
        # Pad if needed
        while len(available) < count:
            available.append(random.choice(FALLBACK_QUESTIONS) if shuffle else FALLBACK_QUESTIONS[len(available) % len(FALLBACK_QUESTIONS)])
        
        questions = []
        for q in available[:count]:
            correct_letter = _index_to_letter(q["correct_index"])
            questions.append(Question(
                id=hash(q["id"]) % 10000,
                text=q["text"],
                options=q["options"],
                correct_answer=correct_letter,
                category=q.get("category", "general"),
            ))
        
        return questions

    def load_questions(
        self,
        count: int = None,
        game_mode: str = "fortnite",
        shuffle: bool = True,
    ) -> List[Question]:
        """
        Synchronous fallback for loading questions.
        
        DEPRECATED: Use load_questions_async for database support.
        This method uses fallback questions only.
        """
        count = count or settings.QUESTIONS_PER_GAME
        return self._load_fallback(count, shuffle=shuffle)

    def get_public_question(
        self,
        question: Question,
        q_num: int,
        shuffle_options: bool = False,
        seed: Optional[int] = None,
    ) -> QuestionPublic:
        """
        Convert Question to QuestionPublic (without correct answer).
        
        Args:
            question: Full question object
            q_num: Question number (1-15)
            shuffle_options: Whether to shuffle answer options (disabled by default)
            seed: Random seed for consistent shuffling
            
        Returns:
            QuestionPublic without correct answer
        """
        options = list(question.options)
        
        # Note: Shuffling is disabled because it breaks answer checking.
        # The correct_answer is stored as a letter (A-D) referring to original position.
        # If we shuffle, the letter no longer matches the displayed position.
        
        if shuffle_options and seed is not None:
            rng = random.Random(seed)
            rng.shuffle(options)
        elif shuffle_options:
            random.shuffle(options)
        
        return QuestionPublic(
            q_num=q_num,
            text=question.text,
            options=options,
        )

    def check_answer(self, question: Question, answer: str) -> bool:
        """
        Check if an answer is correct.
        
        Args:
            question: Question object
            answer: Player's answer (A, B, C, or D)
            
        Returns:
            True if correct, False otherwise
        """
        return answer.upper() == question.correct_answer.upper()

    def get_correct_answer_text(self, question: Question) -> str:
        """Get the text of the correct answer."""
        index = _letter_to_index(question.correct_answer)
        if 0 <= index < len(question.options):
            return question.options[index]
        return question.correct_answer

    async def record_match_questions(
        self,
        user_ids: List[str],
        questions: List[Question],
        answers: Optional[List[List[dict]]] = None,
        match_id: Optional[str] = None,
    ) -> int:
        """
        Record all questions shown in a match for history tracking.
        
        Requirements: 1.3, 1.4, 2.1, 2.2, 5.1, 5.2, 5.3
        
        Args:
            user_ids: List of user IDs who saw the questions
            questions: List of Question objects shown
            answers: Optional list of answer lists per user, each containing
                     dicts with 'was_correct' and 'time_ms' keys
            match_id: Match ID for audit purposes
            
        Returns:
            Number of history records created
        """
        if not self._repo:
            logger.warning("No database client, skipping question history recording")
            return 0
        
        if not user_ids or not questions:
            return 0
        
        try:
            # Build history records for each user-question pair
            records = []
            for user_idx, user_id in enumerate(user_ids):
                for q_idx, question in enumerate(questions):
                    # Get the original database UUID if available
                    question_id = getattr(question, '_db_id', None)
                    if not question_id:
                        # Skip if we don't have the original UUID
                        logger.warning(f"Question {question.id} missing _db_id, skipping history")
                        continue
                    
                    # Get answer data if available
                    was_correct = None
                    answer_time_ms = None
                    if answers and user_idx < len(answers) and q_idx < len(answers[user_idx]):
                        answer_data = answers[user_idx][q_idx]
                        was_correct = answer_data.get('was_correct')
                        answer_time_ms = answer_data.get('time_ms')
                    
                    records.append({
                        "user_id": user_id,
                        "question_id": question_id,
                        "was_correct": was_correct,
                        "answer_time_ms": answer_time_ms,
                        "match_id": match_id,
                    })
            
            # Batch insert all records
            count = await self._repo.record_questions_batch(records)
            
            # Update question analytics for answered questions
            if answers:
                for q_idx, question in enumerate(questions):
                    question_id = getattr(question, '_db_id', None)
                    if not question_id:
                        continue
                    
                    # Aggregate answers from all users for this question
                    for user_idx in range(len(user_ids)):
                        if user_idx < len(answers) and q_idx < len(answers[user_idx]):
                            answer_data = answers[user_idx][q_idx]
                            was_correct = answer_data.get('was_correct', False)
                            answer_time_ms = answer_data.get('time_ms')
                            
                            await self._repo.update_question_analytics(
                                question_id=question_id,
                                was_correct=was_correct,
                                answer_time_ms=answer_time_ms,
                            )
            
            logger.info(f"Recorded {count} question history entries for match {match_id}")
            return count
            
        except Exception as e:
            logger.error(f"Error recording match questions: {e}")
            return 0

    async def record_answers(
        self,
        user_id: str,
        questions: List[Question],
        answers: List[dict],
        match_id: Optional[str] = None,
    ) -> None:
        """
        Record user's answers for analytics and repeat prevention.
        
        DEPRECATED: Use record_match_questions() instead.
        
        Args:
            user_id: User ID
            questions: List of questions shown
            answers: List of answer dicts with was_correct, time_ms
            match_id: Optional match ID
        """
        # Delegate to new method
        await self.record_match_questions(
            user_ids=[user_id],
            questions=questions,
            answers=[answers],
            match_id=match_id,
        )

    async def get_categories(self) -> List[dict]:
        """Get all available question categories."""
        if not self._repo:
            return [{"slug": "fortnite", "name": "Fortnite", "question_count": 3}]
        
        try:
            return await self._repo.get_categories()
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []

    async def get_question_count(self, category: Optional[str] = None) -> int:
        """Get total question count."""
        if not self._repo:
            return len(FALLBACK_QUESTIONS)
        
        try:
            return await self._repo.get_question_count(category)
        except Exception as e:
            logger.error(f"Error getting question count: {e}")
            return 0
