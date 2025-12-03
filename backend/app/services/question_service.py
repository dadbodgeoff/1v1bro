"""
Question service.
Handles question loading and management.
"""

import random
from typing import List, Optional

from app.schemas.game import Question, QuestionPublic
from app.core.config import get_settings


settings = get_settings()

# Hardcoded Fortnite questions for MVP
FORTNITE_QUESTIONS: List[dict] = [
    {
        "id": 1,
        "text": "What year was Fortnite Battle Royale released?",
        "options": ["2016", "2017", "2018", "2019"],
        "correct_answer": "B",
        "category": "fortnite",
    },
    {
        "id": 2,
        "text": "What is the name of the main island in Fortnite?",
        "options": ["Apollo", "Athena", "Artemis", "Atlas"],
        "correct_answer": "A",
        "category": "fortnite",
    },
    {
        "id": 3,
        "text": "Which company developed Fortnite?",
        "options": ["Activision", "EA Games", "Epic Games", "Ubisoft"],
        "correct_answer": "C",
        "category": "fortnite",
    },
    {
        "id": 4,
        "text": "What is the maximum number of players in a standard Battle Royale match?",
        "options": ["50", "75", "100", "150"],
        "correct_answer": "C",
        "category": "fortnite",
    },
    {
        "id": 5,
        "text": "What material provides the most health when built?",
        "options": ["Wood", "Stone", "Metal", "All equal"],
        "correct_answer": "C",
        "category": "fortnite",
    },
    {
        "id": 6,
        "text": "What is the rarest weapon rarity color in Fortnite?",
        "options": ["Purple", "Gold", "Mythic", "Exotic"],
        "correct_answer": "C",
        "category": "fortnite",
    },
    {
        "id": 7,
        "text": "What is the name of the storm that closes in during a match?",
        "options": ["The Circle", "The Storm", "The Zone", "The Ring"],
        "correct_answer": "B",
        "category": "fortnite",
    },
    {
        "id": 8,
        "text": "Which vehicle was first added to Fortnite?",
        "options": ["Car", "Shopping Cart", "Golf Cart", "Plane"],
        "correct_answer": "B",
        "category": "fortnite",
    },
    {
        "id": 9,
        "text": "What is the name of the in-game currency?",
        "options": ["V-Coins", "V-Bucks", "F-Bucks", "Battle Coins"],
        "correct_answer": "B",
        "category": "fortnite",
    },
    {
        "id": 10,
        "text": "What is the default pickaxe called?",
        "options": ["Basic Axe", "Default Pickaxe", "Harvesting Tool", "Standard Issue"],
        "correct_answer": "B",
        "category": "fortnite",
    },
    {
        "id": 11,
        "text": "Which season introduced the first Battle Pass?",
        "options": ["Season 1", "Season 2", "Season 3", "Season 4"],
        "correct_answer": "B",
        "category": "fortnite",
    },
    {
        "id": 12,
        "text": "What is the name of the cube that appeared in Season 5?",
        "options": ["Kevin", "Steve", "Bob", "Carl"],
        "correct_answer": "A",
        "category": "fortnite",
    },
    {
        "id": 13,
        "text": "How many tiers are in a standard Battle Pass?",
        "options": ["50", "75", "100", "150"],
        "correct_answer": "C",
        "category": "fortnite",
    },
    {
        "id": 14,
        "text": "What is the name of the main antagonist organization?",
        "options": ["The Seven", "The Order", "IO (Imagined Order)", "The Last Reality"],
        "correct_answer": "C",
        "category": "fortnite",
    },
    {
        "id": 15,
        "text": "Which Marvel character had their own POI in Chapter 2?",
        "options": ["Iron Man", "Thor", "Spider-Man", "Wolverine"],
        "correct_answer": "A",
        "category": "fortnite",
    },
    {
        "id": 16,
        "text": "What is the maximum shield you can have?",
        "options": ["50", "100", "150", "200"],
        "correct_answer": "B",
        "category": "fortnite",
    },
    {
        "id": 17,
        "text": "Which emote became the most iconic Fortnite dance?",
        "options": ["Floss", "Orange Justice", "Take the L", "Default Dance"],
        "correct_answer": "D",
        "category": "fortnite",
    },
    {
        "id": 18,
        "text": "What is the name of the battle bus driver?",
        "options": ["Lars", "Dennis", "Ray", "Unknown"],
        "correct_answer": "D",
        "category": "fortnite",
    },
    {
        "id": 19,
        "text": "How much health does a player start with?",
        "options": ["50", "75", "100", "150"],
        "correct_answer": "C",
        "category": "fortnite",
    },
    {
        "id": 20,
        "text": "What color is a common rarity item?",
        "options": ["White", "Green", "Gray", "Blue"],
        "correct_answer": "C",
        "category": "fortnite",
    },
]


class QuestionService:
    """Service for question management."""

    def __init__(self):
        self.questions = FORTNITE_QUESTIONS

    def load_questions(
        self,
        count: int = None,
        game_mode: str = "fortnite",
        shuffle: bool = True,
    ) -> List[Question]:
        """
        Load questions for a game.
        
        Args:
            count: Number of questions (default from settings)
            game_mode: Game mode/category
            shuffle: Whether to shuffle questions
            
        Returns:
            List of Question objects
        """
        count = count or settings.QUESTIONS_PER_GAME
        
        # Get questions for game mode
        available = [q for q in self.questions if q.get("category") == game_mode]
        
        if shuffle:
            available = random.sample(available, min(count, len(available)))
        else:
            available = available[:count]
        
        # Pad with random questions if not enough
        while len(available) < count:
            available.append(random.choice(self.questions))
        
        return [Question(**q) for q in available[:count]]

    def get_public_question(
        self,
        question: Question,
        q_num: int,
        shuffle_options: bool = True,
        seed: Optional[int] = None,
    ) -> QuestionPublic:
        """
        Convert Question to QuestionPublic (without correct answer).
        
        Args:
            question: Full question object
            q_num: Question number (1-15)
            shuffle_options: Whether to shuffle answer options
            seed: Random seed for consistent shuffling
            
        Returns:
            QuestionPublic without correct answer
        """
        options = list(question.options)
        
        if shuffle_options and seed is not None:
            # Use seed for consistent shuffling across players
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
        index = ord(question.correct_answer.upper()) - ord('A')
        if 0 <= index < len(question.options):
            return question.options[index]
        return question.correct_answer
