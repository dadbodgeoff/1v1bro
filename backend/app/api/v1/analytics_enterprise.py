"""
Enterprise Analytics API - Full Suite
Handles: User Journeys, Performance, Cohorts, Heatmaps, A/B Tests, Real-time
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import hashlib

from app.core.responses import APIResponse
from app.database.supabase_client import get_supabase_service_client
from app.api.deps import CurrentUser

router = APIRouter(prefix="/analytics/enterprise", tags=["analytics-enterprise"])

# Admin emails
ADMIN_EMAILS = ["dadbodgeoff@gmail.com"]


async def require_admin(user: CurrentUser) -> dict:
    if user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"id": user.id, "email": user.email}


# ============================================
# TRACKING ENDPOINTS (No Auth Required)
# ============================================

class JourneyStepData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    step_type: str  # 'pageview', 'event', 'click'
    page: Optional[str] = None
    event_name: Optional[str] = None
    element_id: Optional[str] = None
    duration_ms: Optional[int] = None
    metadata: Optional[dict] = None


class PerformanceData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    page: str
    lcp_ms: Optional[int] = None
    fid_ms: Optional[int] = None
    cls: Optional[float] = None
    ttfb_ms: Optional[int] = None
    fcp_ms: Optional[int] = None
    dom_interactive_ms: Optional[int] = None
    dom_complete_ms: Optional[int] = None
    load_time_ms: Optional[int] = None
    resource_count: Optional[int] = None
    total_transfer_kb: Optional[int] = None
    js_heap_mb: Optional[float] = None
    connection_type: Optional[str] = None
    effective_bandwidth_mbps: Optional[float] = None
    rtt_ms: Optional[int] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None


class ErrorData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    user_id: Optional[str] = None
    error_type: str
    error_message: str
    error_stack: Optional[str] = None
    error_source: Optional[str] = None
    error_line: Optional[int] = None
    error_column: Optional[int] = None
    page: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    component: Optional[str] = None
    action: Optional[str] = None
    is_fatal: bool = False
    metadata: Optional[dict] = None


class ClickData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    page: str
    x_percent: float
    y_percent: float
    x_px: Optional[int] = None
    y_px: Optional[int] = None
    viewport_width: Optional[int] = None
    viewport_height: Optional[int] = None
    scroll_y: Optional[int] = None
    element_tag: Optional[str] = None
    element_id: Optional[str] = None
    element_class: Optional[str] = None
    element_text: Optional[str] = None
    element_href: Optional[str] = None
    click_type: str = "click"
    is_rage_click: bool = False
    is_dead_click: bool = False


class ScrollData(BaseModel):
    session_id: str
    page: str
    max_scroll_percent: int
    scroll_milestones: Optional[dict] = None
    total_scroll_distance_px: Optional[int] = None
    scroll_ups: int = 0
    time_to_50_percent_ms: Optional[int] = None
    time_to_100_percent_ms: Optional[int] = None


class HeartbeatData(BaseModel):
    session_id: str
    visitor_id: Optional[str] = None
    user_id: Optional[str] = None
    current_page: str
    device_type: Optional[str] = None


@router.post("/track/journey-step")
async def track_journey_step(data: JourneyStepData):
    """Track a step in the user journey."""
    try:
        supabase = get_supabase_service_client()
        
        # Find or create journey for this session
        journey = supabase.table("analytics_user_journeys").select("id, total_pages, total_events").eq(
            "session_id", data.session_id
        ).execute()
        
        if journey.data:
            journey_id = journey.data[0]["id"]
            # Update journey stats
            updates = {"journey_end": datetime.utcnow().isoformat()}
            if data.step_type == "pageview":
                updates["total_pages"] = journey.data[0]["total_pages"] + 1
                updates["exit_page"] = data.page
            else:
                updates["total_events"] = journey.data[0]["total_events"] + 1
            
            supabase.table("analytics_user_journeys").update(updates).eq("id", journey_id).execute()
        else:
            # Create new journey
            result = supabase.table("analytics_user_journeys").insert({
                "visitor_id": data.visitor_id,
                "session_id": data.session_id,
                "entry_page": data.page or "/",
                "exit_page": data.page,
            }).execute()
            journey_id = result.data[0]["id"]
        
        # Get step number
        steps = supabase.table("analytics_journey_steps").select("step_number").eq(
            "journey_id", journey_id
        ).order("step_number", desc=True).limit(1).execute()
        
        step_number = (steps.data[0]["step_number"] + 1) if steps.data else 1
        
        # Insert step
        supabase.table("analytics_journey_steps").insert({
            "journey_id": journey_id,
            "step_number": step_number,
            "step_type": data.step_type,
            "page": data.page,
            "event_name": data.event_name,
            "element_id": data.element_id,
            "duration_ms": data.duration_ms,
            "metadata": data.metadata,
        }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/track/performance")
async def track_performance(data: PerformanceData):
    """Track Core Web Vitals and performance metrics."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_performance").insert({
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "page": data.page,
            "lcp_ms": data.lcp_ms,
            "fid_ms": data.fid_ms,
            "cls": data.cls,
            "ttfb_ms": data.ttfb_ms,
            "fcp_ms": data.fcp_ms,
            "dom_interactive_ms": data.dom_interactive_ms,
            "dom_complete_ms": data.dom_complete_ms,
            "load_time_ms": data.load_time_ms,
            "resource_count": data.resource_count,
            "total_transfer_kb": data.total_transfer_kb,
            "js_heap_mb": data.js_heap_mb,
            "connection_type": data.connection_type,
            "effective_bandwidth_mbps": data.effective_bandwidth_mbps,
            "rtt_ms": data.rtt_ms,
            "device_type": data.device_type,
            "browser": data.browser,
        }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


@router.post("/track/error")
async def track_error(data: ErrorData):
    """Track JS errors with deduplication."""
    try:
        supabase = get_supabase_service_client()
        
        # Create error fingerprint for deduplication
        fingerprint = hashlib.md5(
            f"{data.error_type}:{data.error_message}:{data.error_source}:{data.error_line}".encode()
        ).hexdigest()[:16]
        
        # Check for existing error
        existing = supabase.table("analytics_errors").select("id, occurrence_count").eq(
            "error_message", data.error_message
        ).eq("error_source", data.error_source).eq("error_line", data.error_line).eq(
            "resolved", False
        ).limit(1).execute()
        
        if existing.data:
            # Update occurrence count
            supabase.table("analytics_errors").update({
                "occurrence_count": existing.data[0]["occurrence_count"] + 1,
                "last_seen": datetime.utcnow().isoformat(),
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            # Insert new error
            supabase.table("analytics_errors").insert({
                "session_id": data.session_id,
                "visitor_id": data.visitor_id,
                "user_id": data.user_id,
                "error_type": data.error_type,
                "error_message": data.error_message,
                "error_stack": data.error_stack,
                "error_source": data.error_source,
                "error_line": data.error_line,
                "error_column": data.error_column,
                "page": data.page,
                "browser": data.browser,
                "os": data.os,
                "component": data.component,
                "action": data.action,
                "is_fatal": data.is_fatal,
                "metadata": data.metadata,
            }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


@router.post("/track/click")
async def track_click(data: ClickData):
    """Track click for heatmap."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_clicks").insert({
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "page": data.page,
            "x_percent": data.x_percent,
            "y_percent": data.y_percent,
            "x_px": data.x_px,
            "y_px": data.y_px,
            "viewport_width": data.viewport_width,
            "viewport_height": data.viewport_height,
            "scroll_y": data.scroll_y,
            "element_tag": data.element_tag,
            "element_id": data.element_id,
            "element_class": data.element_class[:512] if data.element_class else None,
            "element_text": data.element_text[:256] if data.element_text else None,
            "element_href": data.element_href,
            "click_type": data.click_type,
            "is_rage_click": data.is_rage_click,
            "is_dead_click": data.is_dead_click,
        }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


@router.post("/track/scroll")
async def track_scroll(data: ScrollData):
    """Track scroll depth."""
    try:
        supabase = get_supabase_service_client()
        
        # Upsert - update if exists for this session/page
        existing = supabase.table("analytics_scroll_depth").select("id, max_scroll_percent").eq(
            "session_id", data.session_id
        ).eq("page", data.page).limit(1).execute()
        
        if existing.data:
            if data.max_scroll_percent > existing.data[0]["max_scroll_percent"]:
                supabase.table("analytics_scroll_depth").update({
                    "max_scroll_percent": data.max_scroll_percent,
                    "scroll_milestones": data.scroll_milestones,
                    "total_scroll_distance_px": data.total_scroll_distance_px,
                    "scroll_ups": data.scroll_ups,
                    "time_to_50_percent_ms": data.time_to_50_percent_ms,
                    "time_to_100_percent_ms": data.time_to_100_percent_ms,
                }).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("analytics_scroll_depth").insert({
                "session_id": data.session_id,
                "page": data.page,
                "max_scroll_percent": data.max_scroll_percent,
                "scroll_milestones": data.scroll_milestones,
                "total_scroll_distance_px": data.total_scroll_distance_px,
                "scroll_ups": data.scroll_ups,
                "time_to_50_percent_ms": data.time_to_50_percent_ms,
                "time_to_100_percent_ms": data.time_to_100_percent_ms,
            }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


@router.post("/track/heartbeat")
async def track_heartbeat(data: HeartbeatData):
    """Update real-time active session."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_active_sessions").upsert({
            "session_id": data.session_id,
            "visitor_id": data.visitor_id,
            "user_id": data.user_id,
            "current_page": data.current_page,
            "last_activity": datetime.utcnow().isoformat(),
            "device_type": data.device_type,
        }, on_conflict="session_id").execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


# ============================================
# ADMIN DASHBOARD ENDPOINTS
# ============================================

@router.get("/dashboard/journeys")
async def get_journeys(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    converted_only: bool = False,
    search: Optional[str] = None,
    sort_by: str = "journey_start",
    sort_order: str = "desc",
    _admin=Depends(require_admin)
):
    """Get user journeys with pagination and filtering."""
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=7)).isoformat()
        
        end_inclusive = (datetime.fromisoformat(end_date) + timedelta(days=1)).isoformat()[:10]
        
        # Build query
        query = supabase.table("analytics_user_journeys").select(
            "*", count="exact"
        ).gte("journey_start", start_date).lt("journey_start", end_inclusive)
        
        if converted_only:
            query = query.eq("converted", True)
        
        if search:
            query = query.or_(f"visitor_id.ilike.%{search}%,entry_page.ilike.%{search}%,exit_page.ilike.%{search}%")
        
        # Sorting
        query = query.order(sort_by, desc=(sort_order == "desc"))
        
        # Pagination
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)
        
        result = query.execute()
        
        return APIResponse.ok({
            "journeys": result.data or [],
            "total": result.count or 0,
            "page": page,
            "per_page": per_page,
            "total_pages": ((result.count or 0) + per_page - 1) // per_page,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/journey/{journey_id}/steps")
async def get_journey_steps(journey_id: str, _admin=Depends(require_admin)):
    """Get all steps for a specific journey."""
    try:
        supabase = get_supabase_service_client()
        
        steps = supabase.table("analytics_journey_steps").select("*").eq(
            "journey_id", journey_id
        ).order("step_number").execute()
        
        return APIResponse.ok({"steps": steps.data or []})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")



@router.get("/dashboard/performance")
async def get_performance_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    page_filter: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """Get Core Web Vitals and performance data."""
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=7)).isoformat()
        
        end_inclusive = (datetime.fromisoformat(end_date) + timedelta(days=1)).isoformat()[:10]
        
        query = supabase.table("analytics_performance").select(
            "*", count="exact"
        ).gte("created_at", start_date).lt("created_at", end_inclusive)
        
        if page_filter:
            query = query.ilike("page", f"%{page_filter}%")
        
        offset = (page - 1) * per_page
        result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()
        
        # Calculate aggregates
        all_data = supabase.table("analytics_performance").select(
            "lcp_ms, fid_ms, cls, ttfb_ms, fcp_ms, load_time_ms"
        ).gte("created_at", start_date).lt("created_at", end_inclusive).execute()
        
        data = all_data.data or []
        
        def avg(field):
            vals = [d[field] for d in data if d.get(field) is not None]
            return round(sum(vals) / len(vals), 2) if vals else None
        
        def percentile(field, p):
            vals = sorted([d[field] for d in data if d.get(field) is not None])
            if not vals:
                return None
            idx = int(len(vals) * p / 100)
            return vals[min(idx, len(vals) - 1)]
        
        aggregates = {
            "lcp": {"avg": avg("lcp_ms"), "p75": percentile("lcp_ms", 75), "p95": percentile("lcp_ms", 95)},
            "fid": {"avg": avg("fid_ms"), "p75": percentile("fid_ms", 75), "p95": percentile("fid_ms", 95)},
            "cls": {"avg": avg("cls"), "p75": percentile("cls", 75), "p95": percentile("cls", 95)},
            "ttfb": {"avg": avg("ttfb_ms"), "p75": percentile("ttfb_ms", 75), "p95": percentile("ttfb_ms", 95)},
            "fcp": {"avg": avg("fcp_ms"), "p75": percentile("fcp_ms", 75), "p95": percentile("fcp_ms", 95)},
            "load_time": {"avg": avg("load_time_ms"), "p75": percentile("load_time_ms", 75), "p95": percentile("load_time_ms", 95)},
        }
        
        # Web Vitals grades
        def grade_lcp(val):
            if val is None: return "N/A"
            if val <= 2500: return "Good"
            if val <= 4000: return "Needs Improvement"
            return "Poor"
        
        def grade_fid(val):
            if val is None: return "N/A"
            if val <= 100: return "Good"
            if val <= 300: return "Needs Improvement"
            return "Poor"
        
        def grade_cls(val):
            if val is None: return "N/A"
            if val <= 0.1: return "Good"
            if val <= 0.25: return "Needs Improvement"
            return "Poor"
        
        grades = {
            "lcp": grade_lcp(aggregates["lcp"]["p75"]),
            "fid": grade_fid(aggregates["fid"]["p75"]),
            "cls": grade_cls(aggregates["cls"]["p75"]),
        }
        
        return APIResponse.ok({
            "records": result.data or [],
            "total": result.count or 0,
            "page": page,
            "per_page": per_page,
            "aggregates": aggregates,
            "grades": grades,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/errors")
async def get_errors(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    error_type: Optional[str] = None,
    resolved: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "last_seen",
    _admin=Depends(require_admin)
):
    """Get JS errors with filtering and pagination."""
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=30)).isoformat()
        
        end_inclusive = (datetime.fromisoformat(end_date) + timedelta(days=1)).isoformat()[:10]
        
        query = supabase.table("analytics_errors").select(
            "*", count="exact"
        ).gte("created_at", start_date).lt("created_at", end_inclusive)
        
        if error_type:
            query = query.eq("error_type", error_type)
        if resolved is not None:
            query = query.eq("resolved", resolved)
        if search:
            query = query.or_(f"error_message.ilike.%{search}%,error_source.ilike.%{search}%,component.ilike.%{search}%")
        
        offset = (page - 1) * per_page
        result = query.order(sort_by, desc=True).range(offset, offset + per_page - 1).execute()
        
        # Get summary stats
        summary = supabase.table("analytics_errors").select(
            "error_type, resolved", count="exact"
        ).gte("created_at", start_date).lt("created_at", end_inclusive).execute()
        
        type_counts = {}
        unresolved_count = 0
        for err in summary.data or []:
            t = err.get("error_type", "unknown")
            type_counts[t] = type_counts.get(t, 0) + 1
            if not err.get("resolved"):
                unresolved_count += 1
        
        return APIResponse.ok({
            "errors": result.data or [],
            "total": result.count or 0,
            "page": page,
            "per_page": per_page,
            "summary": {
                "by_type": type_counts,
                "unresolved": unresolved_count,
            },
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.post("/dashboard/errors/{error_id}/resolve")
async def resolve_error(error_id: str, _admin=Depends(require_admin)):
    """Mark an error as resolved."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_errors").update({
            "resolved": True,
            "resolved_at": datetime.utcnow().isoformat(),
        }).eq("id", error_id).execute()
        
        return APIResponse.ok({"resolved": True})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/heatmap")
async def get_heatmap_data(
    page_path: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    click_type: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """Get click heatmap data for a specific page."""
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=7)).isoformat()
        
        end_inclusive = (datetime.fromisoformat(end_date) + timedelta(days=1)).isoformat()[:10]
        
        query = supabase.table("analytics_clicks").select(
            "x_percent, y_percent, element_tag, element_id, element_text, click_type, is_rage_click, is_dead_click"
        ).eq("page", page_path).gte("created_at", start_date).lt("created_at", end_inclusive)
        
        if click_type:
            query = query.eq("click_type", click_type)
        
        result = query.limit(5000).execute()
        
        # Aggregate clicks into grid cells for heatmap
        grid_size = 5  # 5% cells
        heatmap = {}
        rage_clicks = []
        dead_clicks = []
        
        for click in result.data or []:
            # Grid cell
            cell_x = int(click["x_percent"] // grid_size) * grid_size
            cell_y = int(click["y_percent"] // grid_size) * grid_size
            key = f"{cell_x},{cell_y}"
            heatmap[key] = heatmap.get(key, 0) + 1
            
            if click.get("is_rage_click"):
                rage_clicks.append(click)
            if click.get("is_dead_click"):
                dead_clicks.append(click)
        
        # Convert to array format
        heatmap_data = [
            {"x": int(k.split(",")[0]), "y": int(k.split(",")[1]), "count": v}
            for k, v in heatmap.items()
        ]
        
        return APIResponse.ok({
            "heatmap": sorted(heatmap_data, key=lambda x: x["count"], reverse=True),
            "total_clicks": len(result.data or []),
            "rage_clicks": rage_clicks[:50],
            "dead_clicks": dead_clicks[:50],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/scroll-depth")
async def get_scroll_depth(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page_filter: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """Get scroll depth analytics by page."""
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=7)).isoformat()
        
        end_inclusive = (datetime.fromisoformat(end_date) + timedelta(days=1)).isoformat()[:10]
        
        query = supabase.table("analytics_scroll_depth").select("*").gte(
            "created_at", start_date
        ).lt("created_at", end_inclusive)
        
        if page_filter:
            query = query.ilike("page", f"%{page_filter}%")
        
        result = query.execute()
        
        # Aggregate by page
        page_stats = {}
        for row in result.data or []:
            page = row.get("page", "/")
            if page not in page_stats:
                page_stats[page] = {
                    "views": 0,
                    "total_scroll": 0,
                    "reached_25": 0,
                    "reached_50": 0,
                    "reached_75": 0,
                    "reached_100": 0,
                }
            stats = page_stats[page]
            stats["views"] += 1
            stats["total_scroll"] += row.get("max_scroll_percent", 0)
            
            max_scroll = row.get("max_scroll_percent", 0)
            if max_scroll >= 25: stats["reached_25"] += 1
            if max_scroll >= 50: stats["reached_50"] += 1
            if max_scroll >= 75: stats["reached_75"] += 1
            if max_scroll >= 100: stats["reached_100"] += 1
        
        # Calculate percentages
        pages = []
        for page, stats in page_stats.items():
            views = stats["views"]
            pages.append({
                "page": page,
                "views": views,
                "avg_scroll_depth": round(stats["total_scroll"] / views, 1) if views else 0,
                "reached_25_pct": round(stats["reached_25"] / views * 100, 1) if views else 0,
                "reached_50_pct": round(stats["reached_50"] / views * 100, 1) if views else 0,
                "reached_75_pct": round(stats["reached_75"] / views * 100, 1) if views else 0,
                "reached_100_pct": round(stats["reached_100"] / views * 100, 1) if views else 0,
            })
        
        pages.sort(key=lambda x: x["views"], reverse=True)
        
        return APIResponse.ok({"pages": pages[:50]})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/cohorts")
async def get_cohort_analysis(
    cohort_type: str = "week",  # 'day', 'week', 'month'
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    acquisition_source: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """Get cohort retention analysis."""
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=90)).isoformat()
        
        query = supabase.table("analytics_retention_curves").select("*").gte(
            "cohort_date", start_date
        ).lte("cohort_date", end_date)
        
        if acquisition_source:
            query = query.eq("acquisition_source", acquisition_source)
        
        result = query.order("cohort_date", desc=True).execute()
        
        return APIResponse.ok({
            "cohorts": result.data or [],
            "retention_intervals": ["day_1", "day_3", "day_7", "day_14", "day_30", "day_60", "day_90"],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/experiments")
async def get_experiments(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _admin=Depends(require_admin)
):
    """Get A/B experiments with pagination."""
    try:
        supabase = get_supabase_service_client()
        
        query = supabase.table("analytics_experiments").select("*", count="exact")
        
        if status:
            query = query.eq("status", status)
        
        offset = (page - 1) * per_page
        result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()
        
        return APIResponse.ok({
            "experiments": result.data or [],
            "total": result.count or 0,
            "page": page,
            "per_page": per_page,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/experiments/{experiment_id}")
async def get_experiment_details(experiment_id: str, _admin=Depends(require_admin)):
    """Get detailed experiment results."""
    try:
        supabase = get_supabase_service_client()
        
        # Get experiment
        exp = supabase.table("analytics_experiments").select("*").eq("id", experiment_id).single().execute()
        
        if not exp.data:
            return APIResponse.fail("Experiment not found", "NOT_FOUND")
        
        # Get daily results
        results = supabase.table("analytics_experiment_results").select("*").eq(
            "experiment_id", experiment_id
        ).order("date").execute()
        
        # Get assignment counts
        assignments = supabase.table("analytics_experiment_assignments").select(
            "variant_id, converted"
        ).eq("experiment_id", experiment_id).execute()
        
        variant_stats = {}
        for a in assignments.data or []:
            vid = a["variant_id"]
            if vid not in variant_stats:
                variant_stats[vid] = {"total": 0, "converted": 0}
            variant_stats[vid]["total"] += 1
            if a.get("converted"):
                variant_stats[vid]["converted"] += 1
        
        # Calculate conversion rates
        for vid, stats in variant_stats.items():
            stats["conversion_rate"] = round(stats["converted"] / stats["total"] * 100, 2) if stats["total"] else 0
        
        return APIResponse.ok({
            "experiment": exp.data,
            "daily_results": results.data or [],
            "variant_stats": variant_stats,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


class ExperimentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    hypothesis: Optional[str] = None
    variants: List[dict]
    primary_metric: str
    secondary_metrics: Optional[List[str]] = None
    traffic_percent: int = 100


@router.post("/dashboard/experiments")
async def create_experiment(data: ExperimentCreate, _admin=Depends(require_admin)):
    """Create a new A/B experiment."""
    try:
        supabase = get_supabase_service_client()
        
        result = supabase.table("analytics_experiments").insert({
            "name": data.name,
            "description": data.description,
            "hypothesis": data.hypothesis,
            "variants": data.variants,
            "primary_metric": data.primary_metric,
            "secondary_metrics": data.secondary_metrics,
            "traffic_percent": data.traffic_percent,
            "status": "draft",
        }).execute()
        
        return APIResponse.ok({"experiment": result.data[0] if result.data else None})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.post("/dashboard/experiments/{experiment_id}/start")
async def start_experiment(experiment_id: str, _admin=Depends(require_admin)):
    """Start an experiment."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_experiments").update({
            "status": "running",
            "start_date": datetime.utcnow().isoformat(),
        }).eq("id", experiment_id).execute()
        
        return APIResponse.ok({"started": True})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.post("/dashboard/experiments/{experiment_id}/stop")
async def stop_experiment(experiment_id: str, winner_variant: Optional[str] = None, _admin=Depends(require_admin)):
    """Stop an experiment."""
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_experiments").update({
            "status": "completed",
            "end_date": datetime.utcnow().isoformat(),
            "winner_variant": winner_variant,
        }).eq("id", experiment_id).execute()
        
        return APIResponse.ok({"stopped": True})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/realtime")
async def get_realtime_stats(_admin=Depends(require_admin)):
    """Get real-time active sessions."""
    try:
        supabase = get_supabase_service_client()
        
        # Clean up stale sessions (inactive > 5 minutes)
        cutoff = (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        supabase.table("analytics_active_sessions").delete().lt("last_activity", cutoff).execute()
        
        # Get active sessions
        sessions = supabase.table("analytics_active_sessions").select("*").execute()
        
        # Aggregate
        page_counts = {}
        device_counts = {"mobile": 0, "tablet": 0, "desktop": 0}
        
        for s in sessions.data or []:
            page = s.get("current_page", "/")
            page_counts[page] = page_counts.get(page, 0) + 1
            
            device = s.get("device_type", "desktop")
            if device in device_counts:
                device_counts[device] += 1
        
        return APIResponse.ok({
            "active_users": len(sessions.data or []),
            "sessions": sessions.data or [],
            "pages": [{"page": k, "count": v} for k, v in sorted(page_counts.items(), key=lambda x: x[1], reverse=True)],
            "devices": device_counts,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/funnels")
async def get_funnels(_admin=Depends(require_admin)):
    """Get all funnel definitions."""
    try:
        supabase = get_supabase_service_client()
        
        result = supabase.table("analytics_funnels").select("*").eq("is_active", True).execute()
        
        return APIResponse.ok({"funnels": result.data or []})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


class FunnelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[dict]  # [{step: 1, type: 'pageview', match: '/landing'}, ...]


@router.post("/dashboard/funnels")
async def create_funnel(data: FunnelCreate, _admin=Depends(require_admin)):
    """Create a new funnel definition."""
    try:
        supabase = get_supabase_service_client()
        
        result = supabase.table("analytics_funnels").insert({
            "name": data.name,
            "description": data.description,
            "steps": data.steps,
        }).execute()
        
        return APIResponse.ok({"funnel": result.data[0] if result.data else None})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/funnels/{funnel_id}/stats")
async def get_funnel_stats(
    funnel_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """Get funnel conversion stats."""
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=7)).isoformat()
        
        result = supabase.table("analytics_funnel_stats").select("*").eq(
            "funnel_id", funnel_id
        ).gte("date", start_date).lte("date", end_date).order("step_number").execute()
        
        return APIResponse.ok({"stats": result.data or []})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")



# ============================================
# EXPERIMENT ASSIGNMENT (No Auth)
# ============================================

class ExperimentAssignmentRequest(BaseModel):
    experiment_name: str
    visitor_id: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None


@router.post("/experiment/assign")
async def assign_to_experiment(data: ExperimentAssignmentRequest):
    """
    Get experiment variant assignment for a visitor.
    Returns the assigned variant (deterministic based on visitor_id).
    """
    try:
        supabase = get_supabase_service_client()
        
        # Find experiment by name
        exp = supabase.table("analytics_experiments").select(
            "id, variants, traffic_percent, status"
        ).eq("name", data.experiment_name).eq("status", "running").execute()
        
        if not exp.data:
            return APIResponse.ok({"variant": "control", "in_experiment": False})
        
        experiment = exp.data[0]
        experiment_id = experiment["id"]
        
        # Check existing assignment
        existing = supabase.table("analytics_experiment_assignments").select(
            "variant_id"
        ).eq("experiment_id", experiment_id).eq("visitor_id", data.visitor_id).execute()
        
        if existing.data:
            return APIResponse.ok({
                "variant": existing.data[0]["variant_id"],
                "in_experiment": True,
            })
        
        # Check traffic allocation
        hash_val = hash(f"{experiment_id}:{data.visitor_id}") % 100
        if hash_val >= experiment["traffic_percent"]:
            return APIResponse.ok({"variant": "control", "in_experiment": False})
        
        # Assign variant based on weights
        variants = experiment["variants"]
        total_weight = sum(v.get("weight", 1) for v in variants)
        variant_hash = hash(f"{experiment_id}:{data.visitor_id}:variant") % total_weight
        
        cumulative = 0
        assigned_variant = variants[0]["id"]
        for v in variants:
            cumulative += v.get("weight", 1)
            if variant_hash < cumulative:
                assigned_variant = v["id"]
                break
        
        # Record assignment
        supabase.table("analytics_experiment_assignments").insert({
            "experiment_id": experiment_id,
            "visitor_id": data.visitor_id,
            "session_id": data.session_id,
            "user_id": data.user_id,
            "variant_id": assigned_variant,
        }).execute()
        
        return APIResponse.ok({
            "variant": assigned_variant,
            "in_experiment": True,
        })
    except Exception as e:
        return APIResponse.ok({"variant": "control", "in_experiment": False, "error": str(e)})


class ExperimentConversionRequest(BaseModel):
    experiment_name: str
    visitor_id: str
    conversion_value: Optional[float] = None


@router.post("/experiment/convert")
async def record_conversion(data: ExperimentConversionRequest):
    """
    Record a conversion for an experiment.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Find experiment
        exp = supabase.table("analytics_experiments").select("id").eq(
            "name", data.experiment_name
        ).execute()
        
        if not exp.data:
            return APIResponse.ok({"recorded": False})
        
        experiment_id = exp.data[0]["id"]
        
        supabase.table("analytics_experiment_assignments").update({
            "converted": True,
            "conversion_value": data.conversion_value,
            "converted_at": datetime.utcnow().isoformat(),
        }).eq("experiment_id", experiment_id).eq("visitor_id", data.visitor_id).execute()
        
        return APIResponse.ok({"recorded": True})
    except Exception:
        return APIResponse.ok({"recorded": False})
