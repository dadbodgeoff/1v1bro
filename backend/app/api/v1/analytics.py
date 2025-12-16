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
    visitor_id: Optional[str] = None  # Persistent ID across visits (same device)
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
    
    Uses visitor_id (localStorage) to identify returning users on same device.
    Uses session_id (sessionStorage) to track individual browsing sessions.
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
            # Check if this is a returning visitor (same visitor_id, different session)
            is_returning = False
            if data.visitor_id:
                prev_visits = supabase.table("analytics_sessions").select(
                    "id", count="exact"
                ).eq("visitor_id", data.visitor_id).execute()
                is_returning = (prev_visits.count or 0) > 0
            
            # Create new session
            supabase.table("analytics_sessions").insert({
                "session_id": data.session_id,
                "visitor_id": data.visitor_id,
                "is_returning_visitor": is_returning,
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


class PageDurationData(BaseModel):
    session_id: str
    page: str
    duration_ms: int


@router.post("/pageview/duration")
async def track_page_duration(data: PageDurationData):
    """
    Update page view duration when user navigates away.
    Called on route change or page unload.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Convert ms to seconds for the existing time_on_page column
        duration_seconds = data.duration_ms // 1000
        
        # Find the most recent page view for this session/page
        result = supabase.table("analytics_page_views").select("id, time_on_page").eq(
            "session_id", data.session_id
        ).eq("page", data.page).order(
            "viewed_at", desc=True
        ).limit(1).execute()
        
        if result.data:
            # Only update if new duration is longer (in case of multiple calls)
            existing_duration = result.data[0].get("time_on_page") or 0
            if duration_seconds > existing_duration:
                supabase.table("analytics_page_views").update({
                    "time_on_page": duration_seconds,
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
async def get_analytics_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """
    Get analytics overview for admin dashboard with date range filtering.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Default to last 7 days if no dates provided
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=7)).isoformat()
        
        # Add one day to end_date for inclusive range
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        # Period page views
        period_views = supabase.table("analytics_page_views").select(
            "id", count="exact"
        ).gte("viewed_at", start_date).lt("viewed_at", end_date_inclusive).execute()
        
        # Period unique visitors (by visitor_id for true unique count)
        period_sessions_data = supabase.table("analytics_sessions").select(
            "session_id, visitor_id"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
        # Count unique visitor_ids (true unique users on same device)
        visitor_ids = set()
        session_ids = set()
        for s in (period_sessions_data.data or []):
            session_ids.add(s.get("session_id"))
            if s.get("visitor_id"):
                visitor_ids.add(s.get("visitor_id"))
        
        unique_visitors = len(visitor_ids) if visitor_ids else len(session_ids)
        total_sessions_period = len(session_ids)
        
        # Total unique visitors all time (by visitor_id)
        all_visitors = supabase.table("analytics_sessions").select(
            "visitor_id"
        ).not_.is_("visitor_id", "null").execute()
        total_unique_visitors = len(set(v.get("visitor_id") for v in (all_visitors.data or [])))
        
        # Total sessions all time
        total_sessions = supabase.table("analytics_sessions").select(
            "id", count="exact"
        ).execute()
        
        # Returning visitors in period
        returning_in_period = supabase.table("analytics_sessions").select(
            "id", count="exact"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).eq(
            "is_returning_visitor", True
        ).execute()
        
        # Total conversions
        total_conversions = supabase.table("analytics_sessions").select(
            "id", count="exact"
        ).eq("converted_to_signup", True).execute()
        
        # Period events by type
        period_events = supabase.table("analytics_events").select(
            "event_name"
        ).gte("created_at", start_date).lt("created_at", end_date_inclusive).execute()
        
        event_counts = {}
        for event in period_events.data or []:
            name = event["event_name"]
            event_counts[name] = event_counts.get(name, 0) + 1
        
        # Device breakdown for period
        devices = supabase.table("analytics_sessions").select(
            "device_type"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
        device_counts = {"mobile": 0, "tablet": 0, "desktop": 0}
        for d in devices.data or []:
            dtype = d.get("device_type", "desktop")
            if dtype in device_counts:
                device_counts[dtype] += 1
        
        # Top referrers for period
        referrers = supabase.table("analytics_sessions").select(
            "first_referrer"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).not_.is_("first_referrer", "null").execute()
        
        referrer_counts = {}
        for r in referrers.data or []:
            ref = r.get("first_referrer", "direct")
            if ref:
                try:
                    from urllib.parse import urlparse
                    domain = urlparse(ref).netloc or "direct"
                except:
                    domain = ref[:50]
                referrer_counts[domain] = referrer_counts.get(domain, 0) + 1
        
        top_referrers = sorted(referrer_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return APIResponse.ok({
            "period": {
                "page_views": period_views.count or 0,
                "unique_visitors": unique_visitors,  # True unique users (by visitor_id)
                "sessions": total_sessions_period,   # Total sessions (may include repeat visits)
                "returning_visitors": returning_in_period.count or 0,
                "events": event_counts,
            },
            "totals": {
                "unique_visitors": total_unique_visitors,  # True unique users all time
                "sessions": total_sessions.count or 0,     # Total sessions all time
                "conversions": total_conversions.count or 0,
                "conversion_rate": round((total_conversions.count or 0) / max(total_unique_visitors, 1) * 100, 2),
            },
            "devices": device_counts,
            "top_referrers": [{"source": r[0], "count": r[1]} for r in top_referrers],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/daily")
async def get_daily_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    days: int = 7,
    _admin=Depends(require_admin)
):
    """
    Get daily stats for a date range.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Use date range if provided, otherwise fall back to days
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        page_views = supabase.table("analytics_page_views").select(
            "viewed_at"
        ).gte("viewed_at", start_date).lt("viewed_at", end_date_inclusive).execute()
        
        sessions = supabase.table("analytics_sessions").select(
            "first_seen", "converted_to_signup"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
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
        
        sorted_days = sorted(daily_data.items())
        
        return APIResponse.ok({
            "days": [{"date": d[0], **d[1]} for d in sorted_days]
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/events")
async def get_recent_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50,
    _admin=Depends(require_admin)
):
    """
    Get events for the admin dashboard with date filtering.
    """
    try:
        supabase = get_supabase_service_client()
        
        query = supabase.table("analytics_events").select(
            "event_name, page, metadata, created_at, session_id"
        )
        
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
            query = query.lt("created_at", end_date_inclusive)
        
        events = query.order("created_at", desc=True).limit(limit).execute()
        
        return APIResponse.ok({"events": events.data or []})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/pages")
async def get_page_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    days: int = 7,
    _admin=Depends(require_admin)
):
    """
    Get page-level analytics: views, avg time on page, avg scroll depth.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        page_views = supabase.table("analytics_page_views").select(
            "page, time_on_page, scroll_depth"
        ).gte("viewed_at", start_date).lt("viewed_at", end_date_inclusive).execute()
        
        # Aggregate by page
        page_stats = {}
        for pv in page_views.data or []:
            page = pv.get("page", "/")
            if page not in page_stats:
                page_stats[page] = {"views": 0, "total_time": 0, "time_count": 0, "total_scroll": 0, "scroll_count": 0}
            page_stats[page]["views"] += 1
            if pv.get("time_on_page"):
                page_stats[page]["total_time"] += pv["time_on_page"]
                page_stats[page]["time_count"] += 1
            if pv.get("scroll_depth"):
                page_stats[page]["total_scroll"] += pv["scroll_depth"]
                page_stats[page]["scroll_count"] += 1
        
        # Calculate averages
        pages = []
        for page, stats in page_stats.items():
            pages.append({
                "page": page,
                "views": stats["views"],
                "avg_time_on_page": round(stats["total_time"] / max(stats["time_count"], 1), 1),
                "avg_scroll_depth": round(stats["total_scroll"] / max(stats["scroll_count"], 1), 1),
            })
        
        # Sort by views
        pages.sort(key=lambda x: x["views"], reverse=True)
        
        return APIResponse.ok({"pages": pages[:20]})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/tech")
async def get_tech_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    days: int = 7,
    _admin=Depends(require_admin)
):
    """
    Get browser, OS, and screen size breakdown.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        sessions = supabase.table("analytics_sessions").select(
            "browser, os, screen_width, screen_height"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
        browsers = {}
        operating_systems = {}
        screen_sizes = {}
        
        for s in sessions.data or []:
            # Browser
            browser = s.get("browser", "Unknown")
            browsers[browser] = browsers.get(browser, 0) + 1
            
            # OS
            os_name = s.get("os", "Unknown")
            operating_systems[os_name] = operating_systems.get(os_name, 0) + 1
            
            # Screen size buckets
            width = s.get("screen_width", 0)
            if width < 768:
                size = "Small (<768px)"
            elif width < 1024:
                size = "Medium (768-1024px)"
            elif width < 1440:
                size = "Large (1024-1440px)"
            else:
                size = "XL (1440px+)"
            screen_sizes[size] = screen_sizes.get(size, 0) + 1
        
        return APIResponse.ok({
            "browsers": [{"name": k, "count": v} for k, v in sorted(browsers.items(), key=lambda x: x[1], reverse=True)],
            "operating_systems": [{"name": k, "count": v} for k, v in sorted(operating_systems.items(), key=lambda x: x[1], reverse=True)],
            "screen_sizes": [{"name": k, "count": v} for k, v in sorted(screen_sizes.items(), key=lambda x: x[1], reverse=True)],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/utm")
async def get_utm_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    days: int = 7,
    _admin=Depends(require_admin)
):
    """
    Get UTM campaign performance breakdown.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        sessions = supabase.table("analytics_sessions").select(
            "utm_source, utm_medium, utm_campaign, converted_to_signup"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
        # Group by source
        sources = {}
        campaigns = {}
        
        for s in sessions.data or []:
            source = s.get("utm_source")
            if source:
                if source not in sources:
                    sources[source] = {"visitors": 0, "conversions": 0}
                sources[source]["visitors"] += 1
                if s.get("converted_to_signup"):
                    sources[source]["conversions"] += 1
            
            campaign = s.get("utm_campaign")
            if campaign:
                if campaign not in campaigns:
                    campaigns[campaign] = {"visitors": 0, "conversions": 0}
                campaigns[campaign]["visitors"] += 1
                if s.get("converted_to_signup"):
                    campaigns[campaign]["conversions"] += 1
        
        return APIResponse.ok({
            "sources": [{"name": k, **v, "conversion_rate": round(v["conversions"] / max(v["visitors"], 1) * 100, 1)} for k, v in sorted(sources.items(), key=lambda x: x[1]["visitors"], reverse=True)],
            "campaigns": [{"name": k, **v, "conversion_rate": round(v["conversions"] / max(v["visitors"], 1) * 100, 1)} for k, v in sorted(campaigns.items(), key=lambda x: x[1]["visitors"], reverse=True)],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/geo")
async def get_geo_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    days: int = 7,
    _admin=Depends(require_admin)
):
    """
    Get geographic breakdown by timezone and locale.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        sessions = supabase.table("analytics_sessions").select(
            "timezone, locale"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
        timezones = {}
        locales = {}
        
        for s in sessions.data or []:
            tz = s.get("timezone", "Unknown")
            timezones[tz] = timezones.get(tz, 0) + 1
            
            locale = s.get("locale", "Unknown")
            # Just get language part (en-US -> en)
            lang = locale.split("-")[0] if locale else "Unknown"
            locales[lang] = locales.get(lang, 0) + 1
        
        return APIResponse.ok({
            "timezones": [{"name": k, "count": v} for k, v in sorted(timezones.items(), key=lambda x: x[1], reverse=True)][:15],
            "languages": [{"name": k, "count": v} for k, v in sorted(locales.items(), key=lambda x: x[1], reverse=True)],
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")



@router.get("/dashboard/sessions")
async def get_sessions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    _admin=Depends(require_admin)
):
    """
    Get all session data for the admin dashboard.
    """
    try:
        supabase = get_supabase_service_client()
        
        query = supabase.table("analytics_sessions").select("*")
        
        if start_date:
            query = query.gte("first_seen", start_date)
        if end_date:
            end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
            query = query.lt("first_seen", end_date_inclusive)
        
        sessions = query.order("first_seen", desc=True).limit(limit).execute()
        
        return APIResponse.ok({"sessions": sessions.data or []})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/pageviews")
async def get_pageviews(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    _admin=Depends(require_admin)
):
    """
    Get all page view data for the admin dashboard.
    """
    try:
        supabase = get_supabase_service_client()
        
        query = supabase.table("analytics_page_views").select("*")
        
        if start_date:
            query = query.gte("viewed_at", start_date)
        if end_date:
            end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
            query = query.lt("viewed_at", end_date_inclusive)
        
        pageviews = query.order("viewed_at", desc=True).limit(limit).execute()
        
        return APIResponse.ok({"pageviews": pageviews.data or []})
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/session/{session_id}/events")
async def get_session_events(
    session_id: str,
    _admin=Depends(require_admin)
):
    """
    Get all events and details for a specific session.
    Used by the Session Explorer modal.
    
    Requirements: 2.2, 2.3 - Display session context and chronological event timeline
    """
    try:
        supabase = get_supabase_service_client()
        
        # Get session details
        session_result = supabase.table("analytics_sessions").select(
            "session_id, visitor_id, device_type, browser, os, "
            "screen_width, screen_height, locale, timezone, "
            "utm_source, utm_medium, utm_campaign, first_referrer, "
            "first_seen, last_seen, converted_to_signup, converted_at"
        ).eq("session_id", session_id).single().execute()
        
        if not session_result.data:
            return APIResponse.fail("Session not found", "NOT_FOUND")
        
        session_data = session_result.data
        
        # Format session details for frontend
        session_details = {
            "sessionId": session_data.get("session_id"),
            "visitorId": session_data.get("visitor_id"),
            "deviceType": session_data.get("device_type", "desktop"),
            "browser": session_data.get("browser", "Unknown"),
            "os": session_data.get("os", "Unknown"),
            "screenSize": f"{session_data.get('screen_width', 0)}x{session_data.get('screen_height', 0)}",
            "locale": session_data.get("locale", "Unknown"),
            "timezone": session_data.get("timezone", "Unknown"),
            "utmSource": session_data.get("utm_source"),
            "utmMedium": session_data.get("utm_medium"),
            "utmCampaign": session_data.get("utm_campaign"),
            "firstReferrer": session_data.get("first_referrer"),
            "startedAt": session_data.get("first_seen"),
            "endedAt": session_data.get("last_seen"),
            "converted": session_data.get("converted_to_signup", False),
            "convertedAt": session_data.get("converted_at"),
        }
        
        # Get all events for this session
        events_result = supabase.table("analytics_events").select(
            "id, event_name, page, metadata, created_at"
        ).eq("session_id", session_id).order("created_at", desc=False).execute()
        
        # Get all page views for this session
        pageviews_result = supabase.table("analytics_page_views").select(
            "id, page, viewed_at, time_on_page, scroll_depth, load_time_ms"
        ).eq("session_id", session_id).order("viewed_at", desc=False).execute()
        
        # Determine conversion events (signup, purchase, etc.)
        conversion_event_names = {"signup", "purchase", "subscribe", "conversion", "register"}
        
        # Format events for frontend - combine events and pageviews into timeline
        events = []
        
        # Add page views as events
        for pv in pageviews_result.data or []:
            events.append({
                "id": f"pv-{pv.get('id')}",
                "type": "pageview",
                "timestamp": pv.get("viewed_at"),
                "page": pv.get("page", "/"),
                "eventName": None,
                "metadata": {
                    "loadTimeMs": pv.get("load_time_ms"),
                    "scrollDepth": pv.get("scroll_depth"),
                },
                "duration": pv.get("time_on_page"),
                "isConversion": False,
            })
        
        # Add custom events
        for ev in events_result.data or []:
            event_name = ev.get("event_name", "")
            is_conversion = event_name.lower() in conversion_event_names
            events.append({
                "id": f"ev-{ev.get('id')}",
                "type": "conversion" if is_conversion else "event",
                "timestamp": ev.get("created_at"),
                "page": ev.get("page", "/"),
                "eventName": event_name,
                "metadata": ev.get("metadata"),
                "duration": None,
                "isConversion": is_conversion,
            })
        
        # Sort all events chronologically (ascending by timestamp)
        events.sort(key=lambda x: x.get("timestamp", ""))
        
        # Format page journey from pageviews
        pageviews = []
        pv_list = pageviews_result.data or []
        for i, pv in enumerate(pv_list):
            # Calculate exit time from next pageview or session end
            exit_time = None
            if i + 1 < len(pv_list):
                exit_time = pv_list[i + 1].get("viewed_at")
            elif session_data.get("last_seen"):
                exit_time = session_data.get("last_seen")
            
            pageviews.append({
                "page": pv.get("page", "/"),
                "enteredAt": pv.get("viewed_at"),
                "exitedAt": exit_time,
                "duration": pv.get("time_on_page", 0),
                "scrollDepth": pv.get("scroll_depth"),
            })
        
        return APIResponse.ok({
            "session": session_details,
            "events": events,
            "pageviews": pageviews,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")
