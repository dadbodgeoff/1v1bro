"""
Question schemas for trivia system.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import Field

from app.schemas.base import BaseSchema


class QuestionCategory(BaseSchema):
    """Question category schema."""
    
    id: str = Field(..., description="Category UUID")
    slug: str = Field(..., description="URL-friendly slug")
    name: str = Field(..., description="Display name")
    description: Optional[str] = None
    icon_url: Optional[str] = None
    is_active: bool = True
    question_count: int = 0
    sort_order: int = 0


class QuestionSubcategory(BaseSchema):
    """Question subcategory schema."""
    
    id: str = Field(..., description="Subcategory UUID")
    category_id: str = Field(..., description="Parent category UUID")
    slug: str = Field(..., description="URL-friendly slug")
    name: str = Field(..., description="Display name")
    is_active: bool = True
    question_count: int = 0


class QuestionCreate(BaseSchema):
    """Schema for creating a question."""
    
    category_id: str = Field(..., description="Category UUID")
    subcategory_id: Optional[str] = Field(None, description="Subcategory UUID")
    text: str = Field(..., min_length=10, description="Question text")
    options: List[str] = Field(..., min_length=4, max_length=4, description="Answer options")
    correct_index: int = Field(..., ge=0, le=3, description="Index of correct answer (0-3)")
    difficulty: str = Field(default="medium", description="easy, medium, or hard")
    explanation: Optional[str] = Field(None, description="Why this answer is correct")
    source_url: Optional[str] = Field(None, description="Source reference")
    image_url: Optional[str] = Field(None, description="Optional image")
    valid_from: Optional[datetime] = Field(None, description="When question becomes valid")
    valid_until: Optional[datetime] = Field(None, description="When question expires")


class QuestionUpdate(BaseSchema):
    """Schema for updating a question."""
    
    text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_index: Optional[int] = None
    difficulty: Optional[str] = None
    explanation: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class QuestionDB(BaseSchema):
    """Full question schema from database."""
    
    id: str = Field(..., description="Question UUID")
    category_id: str
    subcategory_id: Optional[str] = None
    text: str
    options: List[str]
    correct_index: int
    difficulty: str = "medium"
    explanation: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    times_shown: int = 0
    times_correct: int = 0
    avg_answer_time_ms: Optional[int] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class QuestionStats(BaseSchema):
    """Question statistics."""
    
    total_questions: int = 0
    by_category: dict = Field(default_factory=dict)
    by_difficulty: dict = Field(default_factory=dict)


class BulkImportRequest(BaseSchema):
    """Request for bulk importing questions."""
    
    category_slug: str = Field(..., description="Category to import into")
    questions: List[QuestionCreate] = Field(..., description="Questions to import")
    skip_duplicates: bool = Field(default=True, description="Skip questions with same text")


class BulkImportResult(BaseSchema):
    """Result of bulk import."""
    
    total_submitted: int
    inserted: int
    skipped_duplicates: int
    errors: List[str] = Field(default_factory=list)
