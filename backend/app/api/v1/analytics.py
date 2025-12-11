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
        
        # Period unique visitors
        period_sessions_data = supabase.table("analytics_page_views").select(
            "session_id"
        ).gte("viewed_at", start_date).lt("viewed_at", end_date_inclusive).execute()
        unique_visitors = len(set(s.get("session_id") for s in (period_sessions_data.data or [])))
        
        # Total visitors all time
        total_sessions = supabase.table("analytics_sessions").select(
            "id", count="exact"
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
                "unique_visitors": unique_visitors,
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
