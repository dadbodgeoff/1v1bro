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
    ) -> List[Question]:
        """
        Load questions from database for a game.
        
        Args:
            count: Number of questions (default from settings)
            category: Category slug (e.g., 'fortnite', 'nfl')
            user_ids: User IDs to avoid showing repeat questions
            
        Returns:
            List of Question objects
        """
        count = count or settings.QUESTIONS_PER_GAME
        
        if not self._repo:
            logger.warning("No database client, using fallback questions")
            return self._load_fallback(count)
        
        try:
            # Get questions from database
            db_questions = await self._repo.get_questions_for_match(
                category_slug=category,
                count=count,
                user_ids=user_ids,
                avoid_recent_days=7,
            )
            
            if not db_questions:
                logger.warning(f"No questions found for category '{category}', using fallback")
                return self._load_fallback(count)
            
            # Convert to Question objects
            questions = []
            for q in db_questions:
                # Convert correct_index to correct_answer letter
                correct_letter = _index_to_letter(q["correct_index"])
                
                questions.append(Question(
                    id=hash(q["id"]) % 10000,  # Convert UUID to int for compatibility
                    text=q["text"],
                    options=q["options"],
                    correct_answer=correct_letter,
                    category=category,
                    difficulty=q.get("difficulty"),
                ))
            
            logger.info(f"Loaded {len(questions)} questions for category '{category}'")
            return questions
            
        except Exception as e:
            logger.error(f"Error loading questions from database: {e}")
            return self._load_fallback(count)

    def _load_fallback(self, count: int) -> List[Question]:
        """Load fallback hardcoded questions."""
        available = list(FALLBACK_QUESTIONS)
        random.shuffle(available)
        
        # Pad if needed
        while len(available) < count:
            available.append(random.choice(FALLBACK_QUESTIONS))
        
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
        return self._load_fallback(count)

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

    async def record_answers(
        self,
        user_id: str,
        questions: List[Question],
        answers: List[dict],
        match_id: Optional[str] = None,
    ) -> None:
        """
        Record user's answers for analytics and repeat prevention.
        
        Args:
            user_id: User ID
            questions: List of questions shown
            answers: List of answer dicts with was_correct, time_ms
            match_id: Optional match ID
        """
        if not self._repo:
            return
        
        try:
            for q, a in zip(questions, answers):
                # We need the original UUID, but we only have the hash
                # This is a limitation - for full tracking, we'd need to store UUIDs
                pass
        except Exception as e:
            logger.error(f"Error recording answers: {e}")

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
