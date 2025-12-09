"""
Questions API endpoints.

Provides endpoints for:
- Fetching available trivia categories
- Getting category statistics
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database.supabase_client import get_supabase_client
from app.services.question_service import QuestionService

router = APIRouter(prefix="/questions", tags=["questions"])


class CategoryResponse(BaseModel):
    """Response model for a trivia category."""
    slug: str
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    question_count: int
    is_active: bool = True


class CategoriesResponse(BaseModel):
    """Response model for list of categories."""
    categories: List[CategoryResponse]


@router.get("/categories", response_model=CategoriesResponse)
async def get_categories(
    client=Depends(get_supabase_client),
) -> CategoriesResponse:
    """
    Get all available trivia categories.
    
    Returns list of categories with their question counts.
    Used by frontend to display category selection before matchmaking.
    
    Requirements: 6.1, 8.1
    """
    question_service = QuestionService(client)
    
    try:
        categories = await question_service.get_categories()
        
        return CategoriesResponse(
            categories=[
                CategoryResponse(
                    slug=cat.get("slug", ""),
                    name=cat.get("name", ""),
                    description=cat.get("description"),
                    icon_url=cat.get("icon_url"),
                    question_count=cat.get("question_count", 0),
                    is_active=cat.get("is_active", True),
                )
                for cat in categories
                if cat.get("is_active", True)
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")


class QuestionResponse(BaseModel):
    """Response model for a single question (without correct answer for client)."""
    id: int
    text: str
    options: List[str]
    category: str


class QuestionsResponse(BaseModel):
    """Response model for list of questions."""
    questions: List[QuestionResponse]


class QuestionWithAnswer(BaseModel):
    """Response model for a question with correct answer (for practice mode)."""
    id: int
    text: str
    options: List[str]
    correct_answer: str  # A, B, C, or D
    category: str


class PracticeQuestionsResponse(BaseModel):
    """Response model for practice mode questions (includes answers)."""
    questions: List[QuestionWithAnswer]


@router.get("/practice/{category}", response_model=PracticeQuestionsResponse)
async def get_practice_questions(
    category: str,
    count: int = 10,
    client=Depends(get_supabase_client),
) -> PracticeQuestionsResponse:
    """
    Get random questions for practice mode (includes correct answers).
    
    This endpoint is for single-player practice against bots.
    Questions include the correct answer since there's no competitive advantage.
    
    Args:
        category: Category slug (e.g., 'fortnite', 'nfl')
        count: Number of questions (default 10, max 20)
        
    Returns:
        List of questions with correct answers
    """
    count = min(count, 20)  # Cap at 20 questions
    
    question_service = QuestionService(client)
    
    try:
        questions = await question_service.load_questions_async(
            count=count,
            category=category,
        )
        
        return PracticeQuestionsResponse(
            questions=[
                QuestionWithAnswer(
                    id=q.id,
                    text=q.text,
                    options=q.options,
                    correct_answer=q.correct_answer,
                    category=q.category or category,
                )
                for q in questions
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(e)}")


@router.get("/categories/{slug}", response_model=CategoryResponse)
async def get_category(
    slug: str,
    client=Depends(get_supabase_client),
) -> CategoryResponse:
    """
    Get a specific trivia category by slug.
    
    Requirements: 6.1
    """
    try:
        result = (
            client.table("question_categories")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", True)
            .single()
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Category '{slug}' not found")
        
        cat = result.data
        return CategoryResponse(
            slug=cat.get("slug", ""),
            name=cat.get("name", ""),
            description=cat.get("description"),
            icon_url=cat.get("icon_url"),
            question_count=cat.get("question_count", 0),
            is_active=cat.get("is_active", True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch category: {str(e)}")
