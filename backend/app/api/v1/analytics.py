"""
Analytics API endpoints for tracking page views, events, and sessions.

These endpoints accept anonymous requests (no auth required) to track
visitors before they sign up.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.responses import APIResponse
from app.database.supabase_client import get_supabase_service_client

router = APIRouter(prefix="/analytics", tags=["analytics"])


class SessionData(BaseModel):
    session_id: str
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    locale: Optional[str] = None
    timezone: Optional[str] = None
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None


class PageViewData(BaseModel):
    session_id: str
    page: str
    referrer: Optional[str] = None
    load_time_ms: Optional[int] = None


class PageUpdateData(BaseModel):
    session_id: str
    page: str
    time_on_page: Optional[int] = None
    scroll_depth: Optional[int] = None


class EventData(BaseModel):
    session_id: str
    event_name: str
    page: Optional[str] = None
    metadata: Optional[dict] = None


class ConversionData(BaseModel):
    session_id: str
    user_id: str


@router.post("/session")
async def track_session(data: SessionData, request: Request):
    """
    Initialize or update an analytics session.
    Called once per visitor on first page load.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Check if session exists
        existing = supabase.table("analytics_sessions").select("id").eq(
            "session_id", data.session_id
        ).execute()
        
        if existing.data:
            # Update last_seen
            supabase.table("analytics_sessions").update({
                "last_seen": datetime.utcnow().isoformat()
            }).eq("session_id", data.session_id).execute()
        else:
            # Create new session
            supabase.table("analytics_sessions").insert({
                "session_id": data.session_id,
                "device_type": data.device_type,
                "browser": data.browser,
                "os": data.os,
                "screen_width": data.screen_width,
                "screen_height": data.screen_height,
                "locale": data.locale,
                "timezone": data.timezone,
                "first_referrer": data.referrer,
                "utm_source": data.utm_source,
                "utm_medium": data.utm_medium,
                "utm_campaign": data.utm_campaign,
            }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception as e:
        # Don't fail the request - analytics should be non-blocking
        return APIResponse.ok({"tracked": False, "error": str(e)})


@router.post("/pageview")
async def track_pageview(data: PageViewData):
    """
    Track a page view.
    Called on each route change.
    """
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_page_views").insert({
            "session_id": data.session_id,
            "page": data.page,
            "referrer": data.referrer,
            "load_time_ms": data.load_time_ms,
        }).execute()
        
        # Update session last_seen
        supabase.table("analytics_sessions").update({
            "last_seen": datetime.utcnow().isoformat()
        }).eq("session_id", data.session_id).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


@router.post("/page-update")
async def update_page_metrics(data: PageUpdateData):
    """
    Update page metrics (time on page, scroll depth).
    Called when user leaves a page or navigates away.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Find the most recent page view for this session/page
        result = supabase.table("analytics_page_views").select("id").eq(
            "session_id", data.session_id
        ).eq("page", data.page).order(
            "viewed_at", desc=True
        ).limit(1).execute()
        
        if result.data:
            supabase.table("analytics_page_views").update({
                "time_on_page": data.time_on_page,
                "scroll_depth": data.scroll_depth,
            }).eq("id", result.data[0]["id"]).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


@router.post("/event")
async def track_event(data: EventData):
    """
    Track a custom event (button click, demo play, etc).
    """
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_events").insert({
            "session_id": data.session_id,
            "event_name": data.event_name,
            "page": data.page,
            "metadata": data.metadata,
        }).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


@router.post("/conversion")
async def track_conversion(data: ConversionData):
    """
    Mark a session as converted (user signed up).
    """
    try:
        supabase = get_supabase_service_client()
        
        supabase.table("analytics_sessions").update({
            "converted_to_signup": True,
            "converted_at": datetime.utcnow().isoformat(),
            "user_id": data.user_id,
        }).eq("session_id", data.session_id).execute()
        
        return APIResponse.ok({"tracked": True})
    except Exception:
        return APIResponse.ok({"tracked": False})


# ============================================
# Admin Dashboard Endpoints (require auth + admin email)
# ============================================

from app.api.deps import CurrentUser
from fastapi import Depends, HTTPException

# Admin emails allowed to access analytics dashboard
ADMIN_EMAILS = ["dadbodgeoff@gmail.com"]


async def require_admin(user: CurrentUser) -> dict:
    """Verify user is an admin by email."""
    if user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"id": user.id, "email": user.email}


@router.get("/dashboard/overview")
async def get_analytics_overview(_admin=Depends(require_admin)):
    """
    Get analytics overview for admin dashboard.
    Returns today's stats, totals, and recent trends.
    """
    try:
        supabase = get_supabase_service_client()
        today = datetime.utcnow().date().isoformat()
        
        # Today's page views
        today_views = supabase.table("analytics_page_views").select(
            "id", count="exact"
        ).gte("viewed_at", today).execute()
        
        # Today's unique visitors
        today_sessions = supabase.rpc("count_distinct_sessions_today").execute()
        
        # Total visitors all time
        total_sessions = supabase.table("analytics_sessions").select(
            "id", count="exact"
        ).execute()
        
        # Total conversions
        total_conversions = supabase.table("analytics_sessions").select(
            "id", count="exact"
        ).eq("converted_to_signup", True).execute()
        
        # Today's events by type
        today_events = supabase.table("analytics_events").select(
            "event_name"
        ).gte("created_at", today).execute()
        
        event_counts = {}
        for event in today_events.data or []:
            name = event["event_name"]
            event_counts[name] = event_counts.get(name, 0) + 1
        
        # Device breakdown (last 7 days)
        devices = supabase.table("analytics_sessions").select(
            "device_type"
        ).gte("first_seen", (datetime.utcnow().date() - __import__('datetime').timedelta(days=7)).isoformat()).execute()
        
        device_counts = {"mobile": 0, "tablet": 0, "desktop": 0}
        for d in devices.data or []:
            dtype = d.get("device_type", "desktop")
            if dtype in device_counts:
                device_counts[dtype] += 1
        
        # Top referrers (last 7 days)
        referrers = supabase.table("analytics_sessions").select(
            "first_referrer"
        ).gte("first_seen", (datetime.utcnow().date() - __import__('datetime').timedelta(days=7)).isoformat()).not_.is_("first_referrer", "null").execute()
        
        referrer_counts = {}
        for r in referrers.data or []:
            ref = r.get("first_referrer", "direct")
            if ref:
                # Extract domain from referrer
                try:
                    from urllib.parse import urlparse
                    domain = urlparse(ref).netloc or "direct"
                except:
                    domain = ref[:50]
                referrer_counts[domain] = referrer_counts.get(domain, 0) + 1
        
        top_referrers = sorted(referrer_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return APIResponse.ok({
            "today": {
                "page_views": today_views.count or 0,
                "unique_visitors": today_sessions.data if isinstance(today_sessions.data, int) else len(set(s.get("session_id") for s in (supabase.table("analytics_page_views").select("session_id").gte("viewed_at", today).execute().data or []))),
                "events": event_counts,
            },
            "totals": {
                "visitors": total_sessions.count or 0,
                "conversions": total_conversions.count or 0,
                "conversion_rate": round((total_conversions.count or 0) / max(total_sessions.count or 1, 1) * 100, 2),
            },
            "devices": device_counts,
            "top_referrers": [{"source": r[0], "count": r[1]} for r in top_referrers],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/daily")
async def get_daily_stats(
    days: int = 7,
    _admin=Depends(require_admin)
):
    """
    Get daily stats for the last N days.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Get page views grouped by day
        from_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days)).isoformat()
        
        page_views = supabase.table("analytics_page_views").select(
            "viewed_at"
        ).gte("viewed_at", from_date).execute()
        
        sessions = supabase.table("analytics_sessions").select(
            "first_seen", "converted_to_signup"
        ).gte("first_seen", from_date).execute()
        
        # Aggregate by day
        daily_data = {}
        for pv in page_views.data or []:
            day = pv["viewed_at"][:10]
            if day not in daily_data:
                daily_data[day] = {"views": 0, "visitors": 0, "conversions": 0}
            daily_data[day]["views"] += 1
        
        for s in sessions.data or []:
            day = s["first_seen"][:10]
            if day not in daily_data:
                daily_data[day] = {"views": 0, "visitors": 0, "conversions": 0}
            daily_data[day]["visitors"] += 1
            if s.get("converted_to_signup"):
                daily_data[day]["conversions"] += 1
        
        # Sort by date
        sorted_days = sorted(daily_data.items())
        
        return APIResponse.ok({
            "days": [{"date": d[0], **d[1]} for d in sorted_days]
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/events")
async def get_recent_events(
    limit: int = 50,
    _admin=Depends(require_admin)
):
    """
    Get recent events for the admin dashboard.
    """
    try:
        supabase = get_supabase_service_client()
        
        events = supabase.table("analytics_events").select(
            "event_name, page, metadata, created_at"
        ).order("created_at", desc=True).limit(limit).execute()
        
        return APIResponse.ok({"events": events.data or []})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")
