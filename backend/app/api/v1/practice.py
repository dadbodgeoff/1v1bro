"""
Practice Mode API endpoints for personal bests, sessions, and daily tracking.

**Feature: single-player-enhancement**
**Validates: Requirements 4.5, 7.1, 7.4**
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from app.core.responses import APIResponse
from app.api.deps import CurrentUser
from app.database.supabase_client import get_supabase_service_client

router = APIRouter(prefix="/practice", tags=["practice"])


# ============================================
# Request/Response Models
# ============================================

class PersonalBestCreate(BaseModel):
    category: str
    difficulty: str  # 'easy', 'medium', 'hard'
    practice_type: str  # 'quiz_only', 'combat_only', 'full_game'
    score: int
    accuracy: Optional[float] = None


class PersonalBestResponse(BaseModel):
    category: str
    difficulty: str
    practice_type: str
    score: int
    accuracy: Optional[float]
    achieved_at: str


class SessionCreate(BaseModel):
    category: str
    difficulty: str
    practice_type: str
    final_score: int
    bot_score: int
    accuracy: Optional[float] = None
    average_answer_time: Optional[float] = None
    longest_streak: Optional[int] = None
    kills: int = 0
    deaths: int = 0
    damage_dealt: int = 0
    duration_seconds: int
    effective_difficulty: Optional[float] = None


class SessionResponse(BaseModel):
    id: str
    is_personal_best: bool
    xp_awarded: int
    daily_bonus_awarded: bool
    daily_session_count: int


class TutorialStatusUpdate(BaseModel):
    completed: bool


# ============================================
# Personal Best Endpoints
# ============================================

@router.get("/personal-bests")
async def get_personal_bests(user: CurrentUser):
    """
    Get all personal bests for the authenticated user.
    **Validates: Requirements 4.5**
    """
    try:
        supabase = get_supabase_service_client()
        
        result = supabase.table("practice_personal_bests").select(
            "category, difficulty, practice_type, score, accuracy, achieved_at"
        ).eq("user_id", str(user.id)).execute()
        
        return APIResponse.ok({
            "personal_bests": result.data or []
        })
    except Exception as e:
        return APIResponse.fail(str(e), "PRACTICE_ERROR")


@router.get("/personal-best/{category}/{difficulty}/{practice_type}")
async def get_personal_best(
    category: str,
    difficulty: str,
    practice_type: str,
    user: CurrentUser
):
    """
    Get a specific personal best.
    **Validates: Requirements 4.2**
    """
    try:
        supabase = get_supabase_service_client()
        
        result = supabase.table("practice_personal_bests").select(
            "category, difficulty, practice_type, score, accuracy, achieved_at"
        ).eq("user_id", str(user.id)).eq(
            "category", category
        ).eq("difficulty", difficulty).eq(
            "practice_type", practice_type
        ).execute()
        
        if not result.data:
            return APIResponse.ok({"personal_best": None})
        
        return APIResponse.ok({
            "personal_best": result.data[0]
        })
    except Exception as e:
        return APIResponse.fail(str(e), "PRACTICE_ERROR")


@router.post("/personal-best")
async def create_or_update_personal_best(
    data: PersonalBestCreate,
    user: CurrentUser
):
    """
    Create or update a personal best.
    Only updates if the new score is higher.
    **Validates: Requirements 4.1, 4.5**
    """
    try:
        supabase = get_supabase_service_client()
        
        # Check existing personal best
        existing = supabase.table("practice_personal_bests").select(
            "id, score"
        ).eq("user_id", str(user.id)).eq(
            "category", data.category
        ).eq("difficulty", data.difficulty).eq(
            "practice_type", data.practice_type
        ).execute()
        
        is_new_best = False
        
        if existing.data:
            # Only update if new score is higher
            if data.score > existing.data[0]["score"]:
                supabase.table("practice_personal_bests").update({
                    "score": data.score,
                    "accuracy": data.accuracy,
                    "achieved_at": datetime.utcnow().isoformat()
                }).eq("id", existing.data[0]["id"]).execute()
                is_new_best = True
        else:
            # Create new record
            supabase.table("practice_personal_bests").insert({
                "user_id": str(user.id),
                "category": data.category,
                "difficulty": data.difficulty,
                "practice_type": data.practice_type,
                "score": data.score,
                "accuracy": data.accuracy,
                "achieved_at": datetime.utcnow().isoformat()
            }).execute()
            is_new_best = True
        
        return APIResponse.ok({
            "is_new_best": is_new_best
        })
    except Exception as e:
        return APIResponse.fail(str(e), "PRACTICE_ERROR")


# ============================================
# Session Recording Endpoints
# ============================================

@router.post("/session")
async def record_session(
    data: SessionCreate,
    user: CurrentUser
):
    """
    Record a practice session and calculate XP rewards.
    **Validates: Requirements 7.1, 7.4**
    """
    try:
        supabase = get_supabase_service_client()
        today = date.today().isoformat()
        
        # Check if this is a personal best
        existing_pb = supabase.table("practice_personal_bests").select(
            "score"
        ).eq("user_id", str(user.id)).eq(
            "category", data.category
        ).eq("difficulty", data.difficulty).eq(
            "practice_type", data.practice_type
        ).execute()
        
        is_personal_best = False
        if not existing_pb.data or data.final_score > existing_pb.data[0]["score"]:
            is_personal_best = True
            # Update personal best
            if existing_pb.data:
                supabase.table("practice_personal_bests").update({
                    "score": data.final_score,
                    "accuracy": data.accuracy,
                    "achieved_at": datetime.utcnow().isoformat()
                }).eq("user_id", str(user.id)).eq(
                    "category", data.category
                ).eq("difficulty", data.difficulty).eq(
                    "practice_type", data.practice_type
                ).execute()
            else:
                supabase.table("practice_personal_bests").insert({
                    "user_id": str(user.id),
                    "category": data.category,
                    "difficulty": data.difficulty,
                    "practice_type": data.practice_type,
                    "score": data.final_score,
                    "accuracy": data.accuracy
                }).execute()
        
        # Calculate XP (25% of multiplayer equivalent)
        # Base XP is roughly score / 10 for multiplayer
        base_xp = data.final_score // 10
        practice_xp = base_xp // 4  # 25% of multiplayer
        
        # Personal best bonus (50 XP)
        if is_personal_best:
            practice_xp += 50
        
        # Check daily session count for bonus
        daily_record = supabase.table("practice_daily_counts").select(
            "session_count, daily_bonus_claimed"
        ).eq("user_id", str(user.id)).eq("date", today).execute()
        
        daily_bonus_awarded = False
        current_count = 0
        
        if daily_record.data:
            current_count = daily_record.data[0]["session_count"]
            daily_bonus_claimed = daily_record.data[0]["daily_bonus_claimed"]
            
            # Increment count
            new_count = current_count + 1
            
            # Award daily bonus if reaching 5 sessions and not already claimed
            if new_count >= 5 and not daily_bonus_claimed:
                practice_xp += 75
                daily_bonus_awarded = True
                supabase.table("practice_daily_counts").update({
                    "session_count": new_count,
                    "daily_bonus_claimed": True
                }).eq("user_id", str(user.id)).eq("date", today).execute()
            else:
                supabase.table("practice_daily_counts").update({
                    "session_count": new_count
                }).eq("user_id", str(user.id)).eq("date", today).execute()
            
            current_count = new_count
        else:
            # First session today
            current_count = 1
            supabase.table("practice_daily_counts").insert({
                "user_id": str(user.id),
                "date": today,
                "session_count": 1,
                "daily_bonus_claimed": False
            }).execute()
        
        # Record the session
        session_result = supabase.table("practice_sessions").insert({
            "user_id": str(user.id),
            "category": data.category,
            "difficulty": data.difficulty,
            "practice_type": data.practice_type,
            "final_score": data.final_score,
            "bot_score": data.bot_score,
            "accuracy": data.accuracy,
            "average_answer_time": data.average_answer_time,
            "longest_streak": data.longest_streak,
            "kills": data.kills,
            "deaths": data.deaths,
            "damage_dealt": data.damage_dealt,
            "duration_seconds": data.duration_seconds,
            "effective_difficulty": data.effective_difficulty,
            "is_personal_best": is_personal_best,
            "xp_awarded": practice_xp
        }).execute()
        
        # Award XP to user (update player_stats)
        if practice_xp > 0:
            try:
                supabase.rpc("increment_xp", {
                    "p_user_id": str(user.id),
                    "p_xp_amount": practice_xp
                }).execute()
            except Exception:
                # XP award failed but session was recorded
                pass
        
        return APIResponse.ok({
            "id": session_result.data[0]["id"] if session_result.data else None,
            "is_personal_best": is_personal_best,
            "xp_awarded": practice_xp,
            "daily_bonus_awarded": daily_bonus_awarded,
            "daily_session_count": current_count
        })
    except Exception as e:
        return APIResponse.fail(str(e), "PRACTICE_ERROR")


# ============================================
# Daily Count Endpoints
# ============================================

@router.get("/daily-count")
async def get_daily_count(user: CurrentUser):
    """
    Get today's practice session count.
    **Validates: Requirements 7.4**
    """
    try:
        supabase = get_supabase_service_client()
        today = date.today().isoformat()
        
        result = supabase.table("practice_daily_counts").select(
            "session_count, daily_bonus_claimed"
        ).eq("user_id", str(user.id)).eq("date", today).execute()
        
        if not result.data:
            return APIResponse.ok({
                "session_count": 0,
                "daily_bonus_claimed": False,
                "sessions_until_bonus": 5
            })
        
        data = result.data[0]
        sessions_until_bonus = max(0, 5 - data["session_count"])
        
        return APIResponse.ok({
            "session_count": data["session_count"],
            "daily_bonus_claimed": data["daily_bonus_claimed"],
            "sessions_until_bonus": sessions_until_bonus
        })
    except Exception as e:
        return APIResponse.fail(str(e), "PRACTICE_ERROR")


# ============================================
# Tutorial Status Endpoints
# ============================================

@router.get("/tutorial-status")
async def get_tutorial_status(user: CurrentUser):
    """
    Get tutorial completion status.
    **Validates: Requirements 6.5**
    """
    try:
        supabase = get_supabase_service_client()
        
        result = supabase.table("user_tutorial_status").select(
            "practice_tutorial_completed, completed_at"
        ).eq("user_id", str(user.id)).execute()
        
        if not result.data:
            return APIResponse.ok({
                "completed": False,
                "completed_at": None
            })
        
        return APIResponse.ok({
            "completed": result.data[0]["practice_tutorial_completed"],
            "completed_at": result.data[0]["completed_at"]
        })
    except Exception as e:
        return APIResponse.fail(str(e), "PRACTICE_ERROR")


@router.post("/tutorial-status")
async def update_tutorial_status(
    data: TutorialStatusUpdate,
    user: CurrentUser
):
    """
    Update tutorial completion status.
    Awards 100 XP on first completion.
    **Validates: Requirements 6.5, 7.3**
    """
    try:
        supabase = get_supabase_service_client()
        
        # Check existing status
        existing = supabase.table("user_tutorial_status").select(
            "practice_tutorial_completed"
        ).eq("user_id", str(user.id)).execute()
        
        xp_awarded = 0
        
        if existing.data:
            # Only award XP if completing for the first time
            if data.completed and not existing.data[0]["practice_tutorial_completed"]:
                xp_awarded = 100
                supabase.table("user_tutorial_status").update({
                    "practice_tutorial_completed": True,
                    "completed_at": datetime.utcnow().isoformat()
                }).eq("user_id", str(user.id)).execute()
        else:
            # Create new record
            if data.completed:
                xp_awarded = 100
            supabase.table("user_tutorial_status").insert({
                "user_id": str(user.id),
                "practice_tutorial_completed": data.completed,
                "completed_at": datetime.utcnow().isoformat() if data.completed else None
            }).execute()
        
        # Award XP
        if xp_awarded > 0:
            try:
                supabase.rpc("increment_xp", {
                    "p_user_id": str(user.id),
                    "p_xp_amount": xp_awarded
                }).execute()
            except Exception:
                pass
        
        return APIResponse.ok({
            "completed": data.completed,
            "xp_awarded": xp_awarded
        })
    except Exception as e:
        return APIResponse.fail(str(e), "PRACTICE_ERROR")
