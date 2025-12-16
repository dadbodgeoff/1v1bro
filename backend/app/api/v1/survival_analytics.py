"""
Survival Analytics API - Enterprise-grade game analytics
Tracks: gameplay metrics, player behavior, difficulty tuning, funnel analysis
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.responses import APIResponse
from app.database.supabase_client import get_supabase_service_client
from app.api.deps import CurrentUser

router = APIRouter(prefix="/analytics/survival", tags=["survival-analytics"])

# Admin emails for dashboard access
ADMIN_EMAILS = ["dadbodgeoff@gmail.com"]


async def require_admin(user: CurrentUser) -> dict:
    """Require admin access for dashboard endpoints."""
    if user.email not in ADMIN_EMAILS:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"id": user.id, "email": user.email}


# ============================================
# TRACKING MODELS
# ============================================

class SessionStartData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None


class SessionEndData(BaseModel):
    session_id: str
    total_runs: int
    total_playtime_seconds: float
    longest_run_distance: float
    highest_score: int
    highest_combo: int
    avg_fps: Optional[float] = None
    min_fps: Optional[float] = None
    performance_grade: Optional[str] = None


class RunAnalyticsData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    run_id: Optional[str] = None
    
    # Core metrics
    distance: float
    score: int
    duration_seconds: float
    seed: Optional[int] = None
    
    # Performance metrics
    max_speed: Optional[float] = None
    avg_speed: Optional[float] = None
    max_combo: Optional[int] = None
    total_combos: Optional[int] = None
    
    # Skill metrics
    obstacles_cleared: int = 0
    near_misses: int = 0
    perfect_dodges: int = 0
    lane_changes: int = 0
    jumps: int = 0
    slides: int = 0
    
    # Death analysis
    death_obstacle_type: Optional[str] = None
    death_position_x: Optional[float] = None
    death_position_z: Optional[float] = None
    death_lane: Optional[int] = None
    death_during_combo: bool = False
    death_combo_count: Optional[int] = None
    time_since_last_input_ms: Optional[int] = None
    
    # Difficulty context
    difficulty_at_death: Optional[float] = None
    speed_at_death: Optional[float] = None
    pattern_at_death: Optional[str] = None
    
    # Performance context
    avg_fps: Optional[float] = None
    min_fps: Optional[float] = None
    frame_drops: int = 0
    input_latency_avg_ms: Optional[float] = None


class InputAnalyticsData(BaseModel):
    run_id: str
    total_inputs: int = 0
    inputs_per_second: Optional[float] = None
    jump_count: int = 0
    slide_count: int = 0
    lane_left_count: int = 0
    lane_right_count: int = 0
    avg_reaction_time_ms: Optional[float] = None
    min_reaction_time_ms: Optional[float] = None
    max_reaction_time_ms: Optional[float] = None
    double_tap_count: int = 0
    input_spam_count: int = 0
    buffered_input_count: int = 0
    coyote_jumps: int = 0
    buffered_jumps: int = 0


class ComboAnalyticsData(BaseModel):
    run_id: str
    combo_count: int
    multiplier: float
    score_earned: int
    duration_ms: int
    start_distance: Optional[float] = None
    end_distance: Optional[float] = None
    obstacles_in_combo: int = 0
    near_misses_in_combo: int = 0
    ended_by_death: bool = False
    ended_by_timeout: bool = False
    ended_by_hit: bool = False


class FunnelEventData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    event_type: str  # page_visit, game_load, run_start, run_complete, etc.
    distance: Optional[float] = None


class TriviaAnalyticsData(BaseModel):
    """Track trivia question interactions for game balance."""
    session_id: str
    visitor_id: Optional[str] = None
    run_id: Optional[str] = None
    question_id: Optional[str] = None
    category: str
    difficulty: Optional[str] = None
    answer_given: Optional[str] = None
    correct: bool
    time_to_answer_ms: Optional[int] = None
    timed_out: bool = False
    distance_at_question: Optional[float] = None
    speed_at_question: Optional[float] = None
    streak_before: int = 0


class MilestoneData(BaseModel):
    """Track milestone events (PB, rank changes, achievements)."""
    session_id: str
    visitor_id: Optional[str] = None
    run_id: Optional[str] = None
    milestone_type: str  # distance, personal_best, rank_change, achievement
    milestone_value: Optional[float] = None
    previous_value: Optional[float] = None
    old_rank: Optional[int] = None
    new_rank: Optional[int] = None
    achievement_id: Optional[str] = None
    achievement_name: Optional[str] = None
    metadata: Optional[dict] = None


class ShopEventData(BaseModel):
    """Track shop interactions for monetization funnel."""
    session_id: str
    visitor_id: Optional[str] = None
    event_type: str  # view, item_view, preview, purchase_start, purchase_complete, purchase_failed
    item_id: Optional[str] = None
    item_type: Optional[str] = None
    item_rarity: Optional[str] = None
    price: Optional[int] = None
    currency: Optional[str] = None
    error_type: Optional[str] = None
    metadata: Optional[dict] = None


class LeaderboardEventData(BaseModel):
    """Track leaderboard engagement."""
    session_id: str
    visitor_id: Optional[str] = None
    event_type: str  # view, scroll, player_click, filter_change, refresh
    user_rank: Optional[int] = None
    max_rank_viewed: Optional[int] = None
    target_user_id: Optional[str] = None
    filter_type: Optional[str] = None
    filter_value: Optional[str] = None


class BattlePassEventData(BaseModel):
    """Track battle pass progression and purchases."""
    session_id: str
    event_type: str  # view, level_up, reward_claim, purchase, tier_skip
    current_level: Optional[int] = None
    new_level: Optional[int] = None
    xp_earned: Optional[int] = None
    reward_type: Optional[str] = None
    reward_id: Optional[str] = None
    tiers_skipped: Optional[int] = None
    cost: Optional[int] = None


class AuthEventData(BaseModel):
    """Track authentication events for conversion analysis."""
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None
    event_type: str  # login_success, login_failure, logout, signup_complete, password_reset
    method: Optional[str] = None  # email, google, discord
    error_type: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    metadata: Optional[dict] = None


# ============================================
# TRACKING ENDPOINTS (No Auth Required)
# ============================================

@router.post("/track/session-start")
async def track_session_start(data: SessionStartData):
    """Track survival game session start."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("survival_analytics_sessions").insert({
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "device_type": data.device_type,
            "browser": data.browser,
        }).execute()
        
        # Update funnel
        _update_funnel("game_loads")
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/session-end")
async def track_session_end(data: SessionEndData):
    """Track survival game session end with aggregated metrics."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("survival_analytics_sessions").update({
            "ended_at": datetime.utcnow().isoformat(),
            "total_runs": data.total_runs,
            "total_playtime_seconds": data.total_playtime_seconds,
            "longest_run_distance": data.longest_run_distance,
            "highest_score": data.highest_score,
            "highest_combo": data.highest_combo,
            "avg_fps": data.avg_fps,
            "min_fps": data.min_fps,
            "performance_grade": data.performance_grade,
        }).eq("session_id", data.session_id).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/run")
async def track_run(data: RunAnalyticsData, user: Optional[CurrentUser] = None):
    """Track completed survival run with full analytics."""
    try:
        supabase = get_supabase_service_client()
        
        insert_data = {
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "run_id": data.run_id,
            "distance": data.distance,
            "score": data.score,
            "duration_seconds": data.duration_seconds,
            "seed": data.seed,
            "max_speed": data.max_speed,
            "avg_speed": data.avg_speed,
            "max_combo": data.max_combo,
            "total_combos": data.total_combos,
            "obstacles_cleared": data.obstacles_cleared,
            "near_misses": data.near_misses,
            "perfect_dodges": data.perfect_dodges,
            "lane_changes": data.lane_changes,
            "jumps": data.jumps,
            "slides": data.slides,
            "death_obstacle_type": data.death_obstacle_type,
            "death_position_x": data.death_position_x,
            "death_position_z": data.death_position_z,
            "death_lane": data.death_lane,
            "death_during_combo": data.death_during_combo,
            "death_combo_count": data.death_combo_count,
            "time_since_last_input_ms": data.time_since_last_input_ms,
            "difficulty_at_death": data.difficulty_at_death,
            "speed_at_death": data.speed_at_death,
            "pattern_at_death": data.pattern_at_death,
            "avg_fps": data.avg_fps,
            "min_fps": data.min_fps,
            "frame_drops": data.frame_drops,
            "input_latency_avg_ms": data.input_latency_avg_ms,
            "ended_at": datetime.utcnow().isoformat(),
        }
        
        if user:
            insert_data["user_id"] = user.id
        
        result = supabase.table("survival_analytics_runs").insert(insert_data).execute()
        
        # Update funnels based on distance milestones
        if data.distance >= 100:
            _update_funnel("reached_100m")
        if data.distance >= 500:
            _update_funnel("reached_500m")
        if data.distance >= 1000:
            _update_funnel("reached_1000m")
        
        return APIResponse.ok({"tracked": True, "id": result.data[0]["id"] if result.data else None})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/inputs")
async def track_inputs(data: InputAnalyticsData):
    """Track input analytics for a run."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("survival_analytics_inputs").insert({
            "run_id": data.run_id,
            "total_inputs": data.total_inputs,
            "inputs_per_second": data.inputs_per_second,
            "jump_count": data.jump_count,
            "slide_count": data.slide_count,
            "lane_left_count": data.lane_left_count,
            "lane_right_count": data.lane_right_count,
            "avg_reaction_time_ms": data.avg_reaction_time_ms,
            "min_reaction_time_ms": data.min_reaction_time_ms,
            "max_reaction_time_ms": data.max_reaction_time_ms,
            "double_tap_count": data.double_tap_count,
            "input_spam_count": data.input_spam_count,
            "buffered_input_count": data.buffered_input_count,
            "coyote_jumps": data.coyote_jumps,
            "buffered_jumps": data.buffered_jumps,
        }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/combo")
async def track_combo(data: ComboAnalyticsData):
    """Track significant combo for analytics."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("survival_analytics_combos").insert({
            "run_id": data.run_id,
            "combo_count": data.combo_count,
            "multiplier": data.multiplier,
            "score_earned": data.score_earned,
            "duration_ms": data.duration_ms,
            "start_distance": data.start_distance,
            "end_distance": data.end_distance,
            "obstacles_in_combo": data.obstacles_in_combo,
            "near_misses_in_combo": data.near_misses_in_combo,
            "ended_by_death": data.ended_by_death,
            "ended_by_timeout": data.ended_by_timeout,
            "ended_by_hit": data.ended_by_hit,
        }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/funnel")
async def track_funnel_event(data: FunnelEventData):
    """Track funnel event."""
    try:
        _update_funnel(data.event_type)
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/trivia")
async def track_trivia(data: TriviaAnalyticsData, user: Optional[CurrentUser] = None):
    """Track trivia question interaction for game balance analysis."""
    try:
        supabase = get_supabase_service_client()
        
        insert_data = {
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "run_id": data.run_id,
            "question_id": data.question_id,
            "category": data.category,
            "difficulty": data.difficulty,
            "answer_given": data.answer_given,
            "correct": data.correct,
            "time_to_answer_ms": data.time_to_answer_ms,
            "timed_out": data.timed_out,
            "distance_at_question": data.distance_at_question,
            "speed_at_question": data.speed_at_question,
            "streak_before": data.streak_before,
        }
        
        if user:
            insert_data["user_id"] = user.id
        
        supabase.table("survival_analytics_trivia").insert(insert_data).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/milestone")
async def track_milestone(data: MilestoneData, user: Optional[CurrentUser] = None):
    """Track milestone events (personal best, rank change, achievement)."""
    try:
        supabase = get_supabase_service_client()
        
        insert_data = {
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "run_id": data.run_id,
            "milestone_type": data.milestone_type,
            "milestone_value": data.milestone_value,
            "previous_value": data.previous_value,
            "old_rank": data.old_rank,
            "new_rank": data.new_rank,
            "achievement_id": data.achievement_id,
            "achievement_name": data.achievement_name,
            "metadata": data.metadata,
        }
        
        if user:
            insert_data["user_id"] = user.id
        
        supabase.table("survival_analytics_milestones").insert(insert_data).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/shop")
async def track_shop_event(data: ShopEventData, user: Optional[CurrentUser] = None):
    """Track shop interactions for monetization funnel."""
    try:
        supabase = get_supabase_service_client()
        
        insert_data = {
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "event_type": data.event_type,
            "item_id": data.item_id,
            "item_type": data.item_type,
            "item_rarity": data.item_rarity,
            "price": data.price,
            "currency": data.currency,
            "error_type": data.error_type,
            "metadata": data.metadata,
        }
        
        if user:
            insert_data["user_id"] = user.id
        
        supabase.table("analytics_shop_events").insert(insert_data).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/leaderboard")
async def track_leaderboard_event(data: LeaderboardEventData, user: Optional[CurrentUser] = None):
    """Track leaderboard engagement."""
    try:
        supabase = get_supabase_service_client()
        
        insert_data = {
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "event_type": data.event_type,
            "user_rank": data.user_rank,
            "max_rank_viewed": data.max_rank_viewed,
            "target_user_id": data.target_user_id,
            "filter_type": data.filter_type,
            "filter_value": data.filter_value,
        }
        
        if user:
            insert_data["user_id"] = user.id
        
        supabase.table("analytics_leaderboard_events").insert(insert_data).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/battlepass")
async def track_battlepass_event(data: BattlePassEventData, user: Optional[CurrentUser] = None):
    """Track battle pass progression and purchases."""
    try:
        supabase = get_supabase_service_client()
        
        insert_data = {
            "session_id": data.session_id,
            "event_type": data.event_type,
            "current_level": data.current_level,
            "new_level": data.new_level,
            "xp_earned": data.xp_earned,
            "reward_type": data.reward_type,
            "reward_id": data.reward_id,
            "tiers_skipped": data.tiers_skipped,
            "cost": data.cost,
        }
        
        if user:
            insert_data["user_id"] = user.id
        
        supabase.table("analytics_battlepass_events").insert(insert_data).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/auth")
async def track_auth_event(data: AuthEventData, user: Optional[CurrentUser] = None):
    """Track authentication events for conversion analysis."""
    try:
        supabase = get_supabase_service_client()
        
        insert_data = {
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "event_type": data.event_type,
            "method": data.method,
            "error_type": data.error_type,
            "device_type": data.device_type,
            "browser": data.browser,
            "metadata": data.metadata,
        }
        
        if user:
            insert_data["user_id"] = user.id
        
        supabase.table("analytics_auth_events").insert(insert_data).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


def _update_funnel(event_type: str):
    """Helper to update daily funnel counts."""
    try:
        supabase = get_supabase_service_client()
        today = datetime.utcnow().date().isoformat()
        
        # Map event types to columns
        column_map = {
            "page_visit": "page_visits",
            "game_load": "game_loads",
            "game_loads": "game_loads",
            "first_run_start": "first_run_starts",
            "first_run_complete": "first_run_completes",
            "second_run_start": "second_run_starts",
            "reached_100m": "reached_100m",
            "reached_500m": "reached_500m",
            "reached_1000m": "reached_1000m",
            "submitted_score": "submitted_score",
            "viewed_leaderboard": "viewed_leaderboard",
        }
        
        column = column_map.get(event_type)
        if not column:
            return
        
        # Upsert funnel record
        existing = supabase.table("survival_analytics_funnels").select("id", column).eq("date", today).execute()
        
        if existing.data:
            current = existing.data[0].get(column, 0) or 0
            supabase.table("survival_analytics_funnels").update({
                column: current + 1
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("survival_analytics_funnels").insert({
                "date": today,
                column: 1
            }).execute()
    except Exception:
        pass  # Silent fail for funnel updates


# ============================================
# DASHBOARD ENDPOINTS (Admin Only)
# ============================================

@router.get("/dashboard/overview")
async def get_overview(
    days: int = Query(default=7, ge=1, le=90),
    _admin=Depends(require_admin)
):
    """Get survival analytics overview - queries directly from runs table."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        # Query runs directly instead of relying on materialized view
        runs_result = supabase.table("survival_analytics_runs").select(
            "id, distance, score, max_combo, user_id, visitor_id, created_at, duration_seconds, obstacles_cleared, near_misses, avg_fps, death_obstacle_type"
        ).gte("created_at", start_date).execute()
        
        all_runs = runs_result.data or []
        
        # Group by date for daily stats
        daily_map = {}
        for run in all_runs:
            date = run.get("created_at", "")[:10]  # Extract date part
            if date not in daily_map:
                daily_map[date] = {
                    "date": date,
                    "runs": [],
                    "user_ids": set(),
                    "visitor_ids": set(),
                }
            daily_map[date]["runs"].append(run)
            if run.get("user_id"):
                daily_map[date]["user_ids"].add(run["user_id"])
            if run.get("visitor_id"):
                daily_map[date]["visitor_ids"].add(run["visitor_id"])
        
        # Calculate daily aggregates
        daily = []
        for date, data in sorted(daily_map.items(), reverse=True):
            runs_list = data["runs"]
            daily.append({
                "date": date,
                "total_runs": len(runs_list),
                "unique_players": len(data["user_ids"]),
                "unique_visitors": len(data["visitor_ids"]) or len(data["user_ids"]),
                "avg_distance": round(sum(r.get("distance", 0) or 0 for r in runs_list) / len(runs_list), 2) if runs_list else 0,
                "avg_score": round(sum(r.get("score", 0) or 0 for r in runs_list) / len(runs_list), 2) if runs_list else 0,
                "max_distance": max((r.get("distance", 0) or 0 for r in runs_list), default=0),
                "max_score": max((r.get("score", 0) or 0 for r in runs_list), default=0),
                "max_combo": max((r.get("max_combo", 0) or 0 for r in runs_list), default=0),
            })
        
        # Calculate totals across all runs
        all_user_ids = set()
        all_visitor_ids = set()
        for run in all_runs:
            if run.get("user_id"):
                all_user_ids.add(run["user_id"])
            if run.get("visitor_id"):
                all_visitor_ids.add(run["visitor_id"])
        
        totals = {
            "total_runs": len(all_runs),
            "unique_players": len(all_user_ids),
            "unique_visitors": len(all_visitor_ids) or len(all_user_ids),
            "avg_distance": round(sum(r.get("distance", 0) or 0 for r in all_runs) / len(all_runs), 2) if all_runs else 0,
            "avg_score": round(sum(r.get("score", 0) or 0 for r in all_runs) / len(all_runs), 2) if all_runs else 0,
            "max_distance": max((r.get("distance", 0) or 0 for r in all_runs), default=0),
            "max_score": max((r.get("score", 0) or 0 for r in all_runs), default=0),
            "max_combo": max((r.get("max_combo", 0) or 0 for r in all_runs), default=0),
        }
        
        return APIResponse.ok({
            "daily": daily,
            "totals": totals,
            "period_days": days,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/difficulty-curve")
async def get_difficulty_curve(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get difficulty curve analysis - survival rate by distance."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        result = supabase.table("survival_analytics_difficulty").select("*").gte(
            "date", start_date
        ).order("distance_bucket").execute()
        
        # Aggregate by bucket
        buckets = {}
        for row in result.data or []:
            bucket = row["distance_bucket"]
            if bucket not in buckets:
                buckets[bucket] = {
                    "distance_bucket": bucket,
                    "total_runs_reached": 0,
                    "total_deaths": 0,
                    "avg_speed_sum": 0,
                    "count": 0,
                }
            b = buckets[bucket]
            b["total_runs_reached"] += row.get("total_runs_reached", 0)
            b["total_deaths"] += row.get("total_deaths", 0)
            b["avg_speed_sum"] += (row.get("avg_speed", 0) or 0)
            b["count"] += 1
        
        # Calculate survival rates
        curve = []
        for bucket, data in sorted(buckets.items()):
            reached = data["total_runs_reached"]
            deaths = data["total_deaths"]
            curve.append({
                "distance_bucket": bucket,
                "distance_label": f"{bucket}-{bucket + 100}m",
                "total_reached": reached,
                "total_deaths": deaths,
                "survival_rate": round((reached - deaths) / reached * 100, 2) if reached > 0 else 100,
                "avg_speed": round(data["avg_speed_sum"] / data["count"], 2) if data["count"] > 0 else 0,
            })
        
        return APIResponse.ok({"curve": curve})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/obstacle-analysis")
async def get_obstacle_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get obstacle death rate analysis - queries from runs if obstacles table is empty."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        # Try obstacles table first
        result = supabase.table("survival_analytics_obstacles").select("*").gte(
            "date", start_date
        ).execute()
        
        obstacles = {}
        
        if result.data:
            # Aggregate by obstacle type from obstacles table
            for row in result.data:
                otype = row["obstacle_type"]
                if otype not in obstacles:
                    obstacles[otype] = {
                        "obstacle_type": otype,
                        "total_encounters": 0,
                        "total_deaths": 0,
                        "avg_distance_sum": 0,
                        "avg_speed_sum": 0,
                        "count": 0,
                    }
                o = obstacles[otype]
                o["total_encounters"] += row.get("total_encounters", 0)
                o["total_deaths"] += row.get("total_deaths", 0)
                o["avg_distance_sum"] += (row.get("avg_distance_at_encounter", 0) or 0)
                o["avg_speed_sum"] += (row.get("avg_speed_at_encounter", 0) or 0)
                o["count"] += 1
        else:
            # Fallback: derive from runs table
            runs_result = supabase.table("survival_analytics_runs").select(
                "death_obstacle_type, distance, speed_at_death"
            ).gte("created_at", start_date).not_.is_("death_obstacle_type", "null").execute()
            
            for run in runs_result.data or []:
                otype = run.get("death_obstacle_type")
                if not otype:
                    continue
                if otype not in obstacles:
                    obstacles[otype] = {
                        "obstacle_type": otype,
                        "total_encounters": 0,
                        "total_deaths": 0,
                        "avg_distance_sum": 0,
                        "avg_speed_sum": 0,
                        "count": 0,
                    }
                o = obstacles[otype]
                o["total_encounters"] += 1  # Each death is an encounter
                o["total_deaths"] += 1
                o["avg_distance_sum"] += run.get("distance", 0) or 0
                o["avg_speed_sum"] += run.get("speed_at_death", 0) or 0
                o["count"] += 1
        
        # Calculate death rates
        analysis = []
        for otype, data in obstacles.items():
            encounters = data["total_encounters"]
            deaths = data["total_deaths"]
            analysis.append({
                "obstacle_type": otype,
                "total_encounters": encounters,
                "total_deaths": deaths,
                "death_rate": round(deaths / encounters * 100, 2) if encounters > 0 else 0,
                "avg_distance": round(data["avg_distance_sum"] / data["count"], 2) if data["count"] > 0 else 0,
                "avg_speed": round(data["avg_speed_sum"] / data["count"], 2) if data["count"] > 0 else 0,
            })
        
        # Sort by death rate descending
        analysis.sort(key=lambda x: x["death_rate"], reverse=True)
        
        return APIResponse.ok({"obstacles": analysis})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/funnel")
async def get_funnel_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get conversion funnel analysis - derives distance milestones from actual runs."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        # Get funnel events (page visits, game loads, etc.)
        funnel_result = supabase.table("survival_analytics_funnels").select("*").gte(
            "date", start_date
        ).execute()
        
        # Aggregate funnel totals
        funnel_totals = {
            "page_visits": 0,
            "game_loads": 0,
            "first_run_starts": 0,
            "first_run_completes": 0,
            "second_run_starts": 0,
        }
        
        for row in funnel_result.data or []:
            for key in funnel_totals:
                funnel_totals[key] += row.get(key, 0) or 0
        
        # Get actual run data to derive distance milestones accurately
        runs_result = supabase.table("survival_analytics_runs").select(
            "distance, visitor_id, user_id"
        ).gte("created_at", start_date).execute()
        
        all_runs = runs_result.data or []
        
        # Count unique players who reached each milestone
        # Use visitor_id or user_id to track unique players
        players_100m = set()
        players_500m = set()
        players_1000m = set()
        
        for run in all_runs:
            player_id = run.get("user_id") or run.get("visitor_id") or str(id(run))
            distance = run.get("distance", 0) or 0
            
            if distance >= 100:
                players_100m.add(player_id)
            if distance >= 500:
                players_500m.add(player_id)
            if distance >= 1000:
                players_1000m.add(player_id)
        
        # Total runs is a better metric for distance milestones
        runs_100m = sum(1 for r in all_runs if (r.get("distance", 0) or 0) >= 100)
        runs_500m = sum(1 for r in all_runs if (r.get("distance", 0) or 0) >= 500)
        runs_1000m = sum(1 for r in all_runs if (r.get("distance", 0) or 0) >= 1000)
        
        # Use total runs as the base for distance milestones
        total_runs = len(all_runs)
        
        # Build funnel - ensure monotonically decreasing by using runs for distance steps
        steps_data = [
            ("page_visits", "Page Visits", funnel_totals["page_visits"]),
            ("game_loads", "Game Loads", funnel_totals["game_loads"]),
            ("first_run_starts", "First Run Started", funnel_totals["first_run_starts"] or total_runs),
            ("first_run_completes", "First Run Completed", funnel_totals["first_run_completes"] or total_runs),
            ("second_run_starts", "Second Run Started", funnel_totals["second_run_starts"]),
            ("reached_100m", "Reached 100m", runs_100m),
            ("reached_500m", "Reached 500m", runs_500m),
            ("reached_1000m", "Reached 1000m", runs_1000m),
        ]
        
        # Calculate conversion rates
        funnel = []
        prev_count = None
        for key, label, count in steps_data:
            # Ensure funnel is monotonically decreasing (cap at previous step)
            if prev_count is not None and count > prev_count:
                count = prev_count
            
            conversion = round(count / prev_count * 100, 2) if prev_count and prev_count > 0 else 100
            funnel.append({
                "step": key,
                "label": label,
                "count": count,
                "conversion_rate": conversion,
                "drop_off": round(100 - conversion, 2) if prev_count else 0,
            })
            prev_count = count if count > 0 else prev_count  # Don't let 0 break the chain
        
        return APIResponse.ok({
            "funnel": funnel,
            "daily": funnel_result.data or [],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/input-analysis")
async def get_input_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get input pattern analysis for game feel tuning."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        result = supabase.table("survival_analytics_inputs").select("*").gte(
            "created_at", start_date
        ).execute()
        
        data = result.data or []
        if not data:
            return APIResponse.ok({"analysis": None, "sample_size": 0})
        
        # Calculate averages
        def avg(field):
            vals = [d.get(field) for d in data if d.get(field) is not None]
            return round(sum(vals) / len(vals), 2) if vals else 0
        
        def total(field):
            return sum(d.get(field, 0) or 0 for d in data)
        
        analysis = {
            "sample_size": len(data),
            "avg_inputs_per_second": avg("inputs_per_second"),
            "avg_reaction_time_ms": avg("avg_reaction_time_ms"),
            "min_reaction_time_ms": min((d.get("min_reaction_time_ms") for d in data if d.get("min_reaction_time_ms")), default=0),
            "input_breakdown": {
                "jumps": total("jump_count"),
                "slides": total("slide_count"),
                "lane_left": total("lane_left_count"),
                "lane_right": total("lane_right_count"),
            },
            "advanced_inputs": {
                "coyote_jumps": total("coyote_jumps"),
                "buffered_jumps": total("buffered_jumps"),
                "buffered_inputs": total("buffered_input_count"),
                "double_taps": total("double_tap_count"),
                "input_spam": total("input_spam_count"),
            },
        }
        
        return APIResponse.ok({"analysis": analysis})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/combo-analysis")
async def get_combo_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get combo pattern analysis."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        result = supabase.table("survival_analytics_combos").select("*").gte(
            "created_at", start_date
        ).order("combo_count", desc=True).limit(1000).execute()
        
        data = result.data or []
        if not data:
            return APIResponse.ok({"analysis": None, "top_combos": []})
        
        # Analyze combo distribution
        combo_buckets = {
            "1-5": 0,
            "6-10": 0,
            "11-20": 0,
            "21-50": 0,
            "50+": 0,
        }
        
        end_reasons = {
            "death": 0,
            "timeout": 0,
            "hit": 0,
            "other": 0,
        }
        
        total_score = 0
        total_duration = 0
        
        for combo in data:
            count = combo.get("combo_count", 0)
            if count <= 5:
                combo_buckets["1-5"] += 1
            elif count <= 10:
                combo_buckets["6-10"] += 1
            elif count <= 20:
                combo_buckets["11-20"] += 1
            elif count <= 50:
                combo_buckets["21-50"] += 1
            else:
                combo_buckets["50+"] += 1
            
            if combo.get("ended_by_death"):
                end_reasons["death"] += 1
            elif combo.get("ended_by_timeout"):
                end_reasons["timeout"] += 1
            elif combo.get("ended_by_hit"):
                end_reasons["hit"] += 1
            else:
                end_reasons["other"] += 1
            
            total_score += combo.get("score_earned", 0)
            total_duration += combo.get("duration_ms", 0)
        
        analysis = {
            "total_combos": len(data),
            "distribution": combo_buckets,
            "end_reasons": end_reasons,
            "avg_score_per_combo": round(total_score / len(data), 2) if data else 0,
            "avg_duration_ms": round(total_duration / len(data), 2) if data else 0,
            "max_combo": max((c.get("combo_count", 0) for c in data), default=0),
        }
        
        # Top 10 combos
        top_combos = sorted(data, key=lambda x: x.get("combo_count", 0), reverse=True)[:10]
        
        return APIResponse.ok({
            "analysis": analysis,
            "top_combos": top_combos,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.post("/dashboard/refresh")
async def refresh_analytics(_admin=Depends(require_admin)):
    """Manually refresh materialized views."""
    try:
        supabase = get_supabase_service_client()
        supabase.rpc("refresh_survival_analytics").execute()
        return APIResponse.ok({"refreshed": True})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


# ============================================
# NEW DASHBOARD ENDPOINTS
# ============================================

@router.get("/dashboard/trivia-analysis")
async def get_trivia_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get trivia performance analysis for game balance tuning."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        # Get trivia data
        result = supabase.table("survival_analytics_trivia").select("*").gte(
            "created_at", start_date
        ).execute()
        
        data = result.data or []
        if not data:
            return APIResponse.ok({"analysis": None, "sample_size": 0})
        
        # Aggregate by category
        by_category = {}
        by_difficulty = {}
        total_correct = 0
        total_wrong = 0
        total_timeout = 0
        time_to_answer = []
        streaks = []
        
        for row in data:
            cat = row.get("category", "unknown")
            diff = row.get("difficulty", "unknown")
            
            # Category stats
            if cat not in by_category:
                by_category[cat] = {"total": 0, "correct": 0, "wrong": 0, "timeout": 0, "times": []}
            by_category[cat]["total"] += 1
            if row.get("correct"):
                by_category[cat]["correct"] += 1
                total_correct += 1
            elif row.get("timed_out"):
                by_category[cat]["timeout"] += 1
                total_timeout += 1
            else:
                by_category[cat]["wrong"] += 1
                total_wrong += 1
            
            if row.get("time_to_answer_ms"):
                by_category[cat]["times"].append(row["time_to_answer_ms"])
                time_to_answer.append(row["time_to_answer_ms"])
            
            # Difficulty stats
            if diff not in by_difficulty:
                by_difficulty[diff] = {"total": 0, "correct": 0}
            by_difficulty[diff]["total"] += 1
            if row.get("correct"):
                by_difficulty[diff]["correct"] += 1
            
            # Track streaks
            if row.get("streak_before"):
                streaks.append(row["streak_before"])
        
        # Calculate rates
        category_analysis = []
        for cat, stats in by_category.items():
            category_analysis.append({
                "category": cat,
                "total": stats["total"],
                "correct": stats["correct"],
                "wrong": stats["wrong"],
                "timeout": stats["timeout"],
                "correct_rate": round(stats["correct"] / stats["total"] * 100, 2) if stats["total"] > 0 else 0,
                "timeout_rate": round(stats["timeout"] / stats["total"] * 100, 2) if stats["total"] > 0 else 0,
                "avg_time_ms": round(sum(stats["times"]) / len(stats["times"]), 0) if stats["times"] else None,
            })
        
        difficulty_analysis = []
        for diff, stats in by_difficulty.items():
            difficulty_analysis.append({
                "difficulty": diff,
                "total": stats["total"],
                "correct": stats["correct"],
                "correct_rate": round(stats["correct"] / stats["total"] * 100, 2) if stats["total"] > 0 else 0,
            })
        
        analysis = {
            "sample_size": len(data),
            "total_correct": total_correct,
            "total_wrong": total_wrong,
            "total_timeout": total_timeout,
            "overall_correct_rate": round(total_correct / len(data) * 100, 2) if data else 0,
            "overall_timeout_rate": round(total_timeout / len(data) * 100, 2) if data else 0,
            "avg_time_to_answer_ms": round(sum(time_to_answer) / len(time_to_answer), 0) if time_to_answer else None,
            "max_streak_seen": max(streaks) if streaks else 0,
            "by_category": sorted(category_analysis, key=lambda x: x["total"], reverse=True),
            "by_difficulty": sorted(difficulty_analysis, key=lambda x: x["total"], reverse=True),
        }
        
        return APIResponse.ok({"analysis": analysis})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/milestone-analysis")
async def get_milestone_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get milestone achievement analysis."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        result = supabase.table("survival_analytics_milestones").select("*").gte(
            "created_at", start_date
        ).execute()
        
        data = result.data or []
        if not data:
            return APIResponse.ok({"analysis": None, "sample_size": 0})
        
        # Aggregate by type
        by_type = {}
        pb_improvements = []
        rank_changes = []
        achievements = {}
        
        for row in data:
            mtype = row.get("milestone_type", "unknown")
            
            if mtype not in by_type:
                by_type[mtype] = 0
            by_type[mtype] += 1
            
            if mtype == "personal_best" and row.get("milestone_value") and row.get("previous_value"):
                improvement = row["milestone_value"] - row["previous_value"]
                pb_improvements.append(improvement)
            
            if mtype == "rank_change" and row.get("old_rank") and row.get("new_rank"):
                change = row["old_rank"] - row["new_rank"]  # Positive = improved
                rank_changes.append(change)
            
            if mtype == "achievement" and row.get("achievement_id"):
                aid = row["achievement_id"]
                if aid not in achievements:
                    achievements[aid] = {"id": aid, "name": row.get("achievement_name"), "count": 0}
                achievements[aid]["count"] += 1
        
        analysis = {
            "sample_size": len(data),
            "by_type": by_type,
            "personal_bests": {
                "count": by_type.get("personal_best", 0),
                "avg_improvement": round(sum(pb_improvements) / len(pb_improvements), 2) if pb_improvements else 0,
                "max_improvement": max(pb_improvements) if pb_improvements else 0,
            },
            "rank_changes": {
                "count": by_type.get("rank_change", 0),
                "avg_improvement": round(sum(rank_changes) / len(rank_changes), 2) if rank_changes else 0,
                "max_improvement": max(rank_changes) if rank_changes else 0,
            },
            "achievements": sorted(achievements.values(), key=lambda x: x["count"], reverse=True)[:20],
        }
        
        return APIResponse.ok({"analysis": analysis})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/shop-funnel")
async def get_shop_funnel(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get shop conversion funnel analysis."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        result = supabase.table("analytics_shop_events").select("*").gte(
            "created_at", start_date
        ).execute()
        
        data = result.data or []
        if not data:
            return APIResponse.ok({"funnel": None, "sample_size": 0})
        
        # Count by event type
        event_counts = {}
        item_views = {}
        purchases = {}
        revenue = 0
        
        for row in data:
            etype = row.get("event_type", "unknown")
            event_counts[etype] = event_counts.get(etype, 0) + 1
            
            if etype == "item_view" and row.get("item_id"):
                iid = row["item_id"]
                if iid not in item_views:
                    item_views[iid] = {"id": iid, "type": row.get("item_type"), "views": 0}
                item_views[iid]["views"] += 1
            
            if etype == "purchase_complete" and row.get("item_id"):
                iid = row["item_id"]
                if iid not in purchases:
                    purchases[iid] = {"id": iid, "type": row.get("item_type"), "count": 0, "revenue": 0}
                purchases[iid]["count"] += 1
                purchases[iid]["revenue"] += row.get("price", 0)
                revenue += row.get("price", 0)
        
        # Build funnel
        funnel_steps = [
            ("view", "Shop Views"),
            ("item_view", "Item Views"),
            ("preview", "Previews"),
            ("purchase_start", "Purchase Started"),
            ("purchase_complete", "Purchase Complete"),
        ]
        
        funnel = []
        prev_count = None
        for key, label in funnel_steps:
            count = event_counts.get(key, 0)
            conversion = round(count / prev_count * 100, 2) if prev_count and prev_count > 0 else 100
            funnel.append({
                "step": key,
                "label": label,
                "count": count,
                "conversion_rate": conversion,
            })
            prev_count = count if count > 0 else prev_count
        
        analysis = {
            "sample_size": len(data),
            "funnel": funnel,
            "total_revenue": revenue,
            "purchase_count": event_counts.get("purchase_complete", 0),
            "failed_purchases": event_counts.get("purchase_failed", 0),
            "popular_items": sorted(item_views.values(), key=lambda x: x["views"], reverse=True)[:10],
            "top_sellers": sorted(purchases.values(), key=lambda x: x["count"], reverse=True)[:10],
        }
        
        return APIResponse.ok({"analysis": analysis})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/auth-analysis")
async def get_auth_analysis(
    days: int = Query(default=7, ge=1, le=30),
    _admin=Depends(require_admin)
):
    """Get authentication analytics for conversion analysis."""
    try:
        supabase = get_supabase_service_client()
        start_date = (datetime.utcnow().date() - timedelta(days=days)).isoformat()
        
        result = supabase.table("analytics_auth_events").select("*").gte(
            "created_at", start_date
        ).execute()
        
        data = result.data or []
        if not data:
            return APIResponse.ok({"analysis": None, "sample_size": 0})
        
        # Count by event type and method
        by_type = {}
        by_method = {}
        errors = {}
        
        for row in data:
            etype = row.get("event_type", "unknown")
            method = row.get("method", "unknown")
            
            by_type[etype] = by_type.get(etype, 0) + 1
            
            if method and method != "unknown":
                if method not in by_method:
                    by_method[method] = {"total": 0, "success": 0, "failure": 0}
                by_method[method]["total"] += 1
                if etype == "login_success" or etype == "signup_complete":
                    by_method[method]["success"] += 1
                elif etype == "login_failure":
                    by_method[method]["failure"] += 1
            
            if etype == "login_failure" and row.get("error_type"):
                err = row["error_type"]
                errors[err] = errors.get(err, 0) + 1
        
        # Calculate rates
        method_analysis = []
        for method, stats in by_method.items():
            method_analysis.append({
                "method": method,
                "total": stats["total"],
                "success": stats["success"],
                "failure": stats["failure"],
                "success_rate": round(stats["success"] / stats["total"] * 100, 2) if stats["total"] > 0 else 0,
            })
        
        analysis = {
            "sample_size": len(data),
            "by_event_type": by_type,
            "by_method": sorted(method_analysis, key=lambda x: x["total"], reverse=True),
            "login_success_count": by_type.get("login_success", 0),
            "login_failure_count": by_type.get("login_failure", 0),
            "signup_count": by_type.get("signup_complete", 0),
            "logout_count": by_type.get("logout", 0),
            "error_breakdown": sorted(errors.items(), key=lambda x: x[1], reverse=True)[:10],
        }
        
        return APIResponse.ok({"analysis": analysis})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")
