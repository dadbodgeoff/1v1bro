"""
Analytics API endpoints for tracking page views, events, and sessions.

These endpoints accept anonymous requests (no auth required) to track
visitors before they sign up.
"""

from fastapi import APIRouter, Request, Query
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
    # Geolocation (from client-side or IP lookup)
    country: Optional[str] = None
    country_code: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None


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
            
            # Get country from IP if not provided by client
            country = data.country
            country_code = data.country_code
            region = data.region
            city = data.city
            
            if not country:
                # Try to get from request IP using free geolocation
                try:
                    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                    if not client_ip or client_ip in ("127.0.0.1", "localhost"):
                        client_ip = request.client.host if request.client else None
                    
                    if client_ip and client_ip not in ("127.0.0.1", "localhost", "::1"):
                        import httpx
                        async with httpx.AsyncClient(timeout=2.0) as client:
                            geo_resp = await client.get(f"http://ip-api.com/json/{client_ip}?fields=country,countryCode,regionName,city")
                            if geo_resp.status_code == 200:
                                geo_data = geo_resp.json()
                                country = geo_data.get("country")
                                country_code = geo_data.get("countryCode")
                                region = geo_data.get("regionName")
                                city = geo_data.get("city")
                except Exception:
                    pass  # Silent fail - geo is optional
            
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
                "country": country,
                "country_code": country_code,
                "region": region,
                "city": city,
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
            # Browser - handle null/empty values
            browser = s.get("browser") or "Unknown"
            if browser and browser.strip():
                browsers[browser] = browsers.get(browser, 0) + 1
            else:
                browsers["Unknown"] = browsers.get("Unknown", 0) + 1
            
            # OS - handle null/empty values
            os_name = s.get("os") or "Unknown"
            if os_name and os_name.strip():
                operating_systems[os_name] = operating_systems.get(os_name, 0) + 1
            else:
                operating_systems["Unknown"] = operating_systems.get("Unknown", 0) + 1
            
            # Screen size buckets - handle null/0 values
            width = s.get("screen_width") or 0
            if width > 0:
                if width < 768:
                    size = "Small (<768px)"
                elif width < 1024:
                    size = "Medium (768-1024px)"
                elif width < 1440:
                    size = "Large (1024-1440px)"
                else:
                    size = "XL (1440px+)"
                screen_sizes[size] = screen_sizes.get(size, 0) + 1
            else:
                screen_sizes["Unknown"] = screen_sizes.get("Unknown", 0) + 1
        
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
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    _admin=Depends(require_admin)
):
    """
    Get all session data for the admin dashboard.
    Transforms raw DB fields to frontend-expected format.
    """
    try:
        supabase = get_supabase_service_client()
        
        query = supabase.table("analytics_sessions").select("*", count="exact")
        
        if start_date:
            query = query.gte("first_seen", start_date)
        if end_date:
            end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
            query = query.lt("first_seen", end_date_inclusive)
        
        # Pagination
        offset = (page - 1) * per_page
        sessions_result = query.order("first_seen", desc=True).range(offset, offset + per_page - 1).execute()
        raw_sessions = sessions_result.data or []
        
        # Get page views for each session to calculate entry/exit pages and page count
        session_ids = [s.get("session_id") for s in raw_sessions if s.get("session_id")]
        
        pageviews_by_session = {}
        survival_by_session = {}
        trivia_by_session = {}
        
        if session_ids:
            # Fetch page views for these sessions
            pv_result = supabase.table("analytics_page_views").select(
                "session_id, page, viewed_at, time_on_page"
            ).in_("session_id", session_ids).order("viewed_at").execute()
            
            for pv in pv_result.data or []:
                sid = pv.get("session_id")
                if sid not in pageviews_by_session:
                    pageviews_by_session[sid] = []
                pageviews_by_session[sid].append(pv)
            
            # Fetch survival run data for these sessions
            survival_result = supabase.table("survival_analytics_runs").select(
                "session_id, distance, score, max_combo, death_obstacle_type"
            ).in_("session_id", session_ids).execute()
            
            for run in survival_result.data or []:
                sid = run.get("session_id")
                if sid not in survival_by_session:
                    survival_by_session[sid] = {
                        "runs": 0, 
                        "total_distance": 0, 
                        "best_distance": 0,
                        "best_score": 0,
                        "best_combo": 0,
                        "deaths": {}
                    }
                survival_by_session[sid]["runs"] += 1
                run_distance = run.get("distance", 0) or 0
                survival_by_session[sid]["total_distance"] += run_distance
                # Track best run metrics
                if run_distance > survival_by_session[sid]["best_distance"]:
                    survival_by_session[sid]["best_distance"] = run_distance
                run_score = run.get("score", 0) or 0
                if run_score > survival_by_session[sid]["best_score"]:
                    survival_by_session[sid]["best_score"] = run_score
                run_combo = run.get("max_combo", 0) or 0
                if run_combo > survival_by_session[sid]["best_combo"]:
                    survival_by_session[sid]["best_combo"] = run_combo
                death = run.get("death_obstacle_type")
                if death:
                    survival_by_session[sid]["deaths"][death] = survival_by_session[sid]["deaths"].get(death, 0) + 1
            
            # Fetch trivia data for these sessions
            trivia_result = supabase.table("survival_analytics_trivia").select(
                "session_id, correct"
            ).in_("session_id", session_ids).execute()
            
            for t in trivia_result.data or []:
                sid = t.get("session_id")
                if sid not in trivia_by_session:
                    trivia_by_session[sid] = {"total": 0, "correct": 0}
                trivia_by_session[sid]["total"] += 1
                if t.get("correct"):
                    trivia_by_session[sid]["correct"] += 1
        
        # Transform sessions to frontend format
        transformed = []
        for s in raw_sessions:
            sid = s.get("session_id")
            pvs = pageviews_by_session.get(sid, [])
            
            # Calculate duration - try multiple methods
            duration_seconds = 0
            
            # Method 1: Sum of time_on_page from page views (most accurate)
            total_time_on_pages = sum(pv.get("time_on_page", 0) or 0 for pv in pvs)
            if total_time_on_pages > 0:
                duration_seconds = total_time_on_pages
            
            # Method 2: Calculate from first_seen to last_seen
            elif s.get("first_seen") and s.get("last_seen"):
                try:
                    first = datetime.fromisoformat(s["first_seen"].replace("Z", "+00:00"))
                    last = datetime.fromisoformat(s["last_seen"].replace("Z", "+00:00"))
                    duration_seconds = max(0, (last - first).total_seconds())
                except:
                    pass
            
            # Method 3: Calculate from page view timestamps
            elif len(pvs) >= 2:
                try:
                    first_pv = datetime.fromisoformat(pvs[0].get("viewed_at", "").replace("Z", "+00:00"))
                    last_pv = datetime.fromisoformat(pvs[-1].get("viewed_at", "").replace("Z", "+00:00"))
                    duration_seconds = max(0, (last_pv - first_pv).total_seconds())
                except:
                    pass
            
            # Get entry/exit pages from page views
            entry_page = pvs[0].get("page", "/") if pvs else "/"
            exit_page = pvs[-1].get("page", "/") if pvs else "/"
            
            # Get survival data for this session
            survival_data = survival_by_session.get(sid, {})
            trivia_data = trivia_by_session.get(sid, {})
            
            # Find top death cause
            deaths = survival_data.get("deaths", {})
            top_death = max(deaths.items(), key=lambda x: x[1])[0] if deaths else None
            
            transformed.append({
                "session_id": sid,
                "user_id": s.get("user_id"),
                "started_at": s.get("first_seen"),
                "ended_at": s.get("last_seen"),
                "page_views": len(pvs),
                "duration_seconds": duration_seconds,
                "device_type": s.get("device_type", "desktop"),
                "browser": s.get("browser", "Unknown"),
                "os": s.get("os", "Unknown"),
                "entry_page": entry_page,
                "exit_page": exit_page,
                # Survival data
                "survival_runs": survival_data.get("runs", 0),
                "survival_distance": round(survival_data.get("total_distance", 0), 2),
                "survival_best_distance": round(survival_data.get("best_distance", 0), 2),
                "survival_best_score": survival_data.get("best_score", 0),
                "survival_best_combo": survival_data.get("best_combo", 0),
                "survival_top_death": top_death,
                "trivia_answered": trivia_data.get("total", 0),
                "trivia_correct": trivia_data.get("correct", 0),
            })
        
        total_count = sessions_result.count or len(transformed)
        return APIResponse.ok({
            "sessions": transformed,
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": ((total_count) + per_page - 1) // per_page,
        })
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


@router.get("/dashboard/session/{session_id}/survival")
async def get_session_survival_data(
    session_id: str,
    _admin=Depends(require_admin)
):
    """
    Get survival run data for a specific session.
    Tracks: distance traveled, questions answered, play again count, death causes.
    
    Used by the Session Explorer modal to show survival gameplay details.
    """
    try:
        supabase = get_supabase_service_client()
        
        # Get all survival runs for this session
        runs_result = supabase.table("survival_analytics_runs").select(
            "id, run_id, distance, score, duration_seconds, max_combo, "
            "obstacles_cleared, near_misses, jumps, slides, lane_changes, "
            "death_obstacle_type, death_lane, speed_at_death, "
            "created_at, ended_at"
        ).eq("session_id", session_id).order("created_at", desc=False).execute()
        
        runs = runs_result.data or []
        
        # Get trivia questions answered in this session
        trivia_result = supabase.table("survival_analytics_trivia").select(
            "id, category, difficulty, correct, timed_out, time_to_answer_ms, "
            "distance_at_question, streak_before, created_at"
        ).eq("session_id", session_id).order("created_at", desc=False).execute()
        
        trivia = trivia_result.data or []
        
        # Calculate summary stats
        total_runs = len(runs)
        total_distance = sum(r.get("distance", 0) or 0 for r in runs)
        max_distance = max((r.get("distance", 0) or 0 for r in runs), default=0)
        total_playtime = sum(r.get("duration_seconds", 0) or 0 for r in runs)
        
        # Questions answered
        total_questions = len(trivia)
        correct_answers = sum(1 for t in trivia if t.get("correct"))
        timed_out = sum(1 for t in trivia if t.get("timed_out"))
        
        # Death analysis
        death_causes = {}
        for run in runs:
            death_type = run.get("death_obstacle_type")
            if death_type:
                death_causes[death_type] = death_causes.get(death_type, 0) + 1
        
        # Sort death causes by frequency
        sorted_deaths = sorted(death_causes.items(), key=lambda x: x[1], reverse=True)
        
        # Play again tracking (runs after the first one)
        play_again_count = max(0, total_runs - 1)
        
        # Format runs for timeline
        formatted_runs = []
        for i, run in enumerate(runs):
            formatted_runs.append({
                "runNumber": i + 1,
                "distance": run.get("distance", 0),
                "score": run.get("score", 0),
                "duration": run.get("duration_seconds", 0),
                "maxCombo": run.get("max_combo", 0),
                "obstaclesCleared": run.get("obstacles_cleared", 0),
                "nearMisses": run.get("near_misses", 0),
                "jumps": run.get("jumps", 0),
                "slides": run.get("slides", 0),
                "laneChanges": run.get("lane_changes", 0),
                "deathCause": run.get("death_obstacle_type"),
                "deathLane": run.get("death_lane"),
                "speedAtDeath": run.get("speed_at_death"),
                "startedAt": run.get("created_at"),
                "endedAt": run.get("ended_at"),
            })
        
        # Format trivia for display
        formatted_trivia = []
        for t in trivia:
            formatted_trivia.append({
                "category": t.get("category"),
                "difficulty": t.get("difficulty"),
                "correct": t.get("correct"),
                "timedOut": t.get("timed_out"),
                "timeToAnswerMs": t.get("time_to_answer_ms"),
                "distanceAtQuestion": t.get("distance_at_question"),
                "streakBefore": t.get("streak_before"),
                "timestamp": t.get("created_at"),
            })
        
        return APIResponse.ok({
            "summary": {
                "totalRuns": total_runs,
                "playAgainCount": play_again_count,
                "totalDistance": round(total_distance, 2),
                "maxDistance": round(max_distance, 2),
                "totalPlaytimeSeconds": round(total_playtime, 2),
                "questionsAnswered": total_questions,
                "correctAnswers": correct_answers,
                "timedOutAnswers": timed_out,
                "correctRate": round(correct_answers / total_questions * 100, 2) if total_questions > 0 else 0,
                "deathCauses": sorted_deaths,
                "topDeathCause": sorted_deaths[0][0] if sorted_deaths else None,
            },
            "runs": formatted_runs,
            "trivia": formatted_trivia,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/engagement")
async def get_engagement_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """
    Get engagement metrics: DAU/MAU, stickiness, retention, session frequency.
    Key metrics for advertisers.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=30)).isoformat()
        
        today = datetime.utcnow().date().isoformat()
        thirty_days_ago = (datetime.utcnow().date() - __import__('datetime').timedelta(days=30)).isoformat()
        seven_days_ago = (datetime.utcnow().date() - __import__('datetime').timedelta(days=7)).isoformat()
        
        # DAU - unique visitors today
        dau_result = supabase.table("analytics_sessions").select(
            "visitor_id"
        ).gte("first_seen", today).execute()
        dau_visitors = set(s.get("visitor_id") for s in (dau_result.data or []) if s.get("visitor_id"))
        dau = len(dau_visitors)
        
        # WAU - unique visitors last 7 days
        wau_result = supabase.table("analytics_sessions").select(
            "visitor_id"
        ).gte("first_seen", seven_days_ago).execute()
        wau_visitors = set(s.get("visitor_id") for s in (wau_result.data or []) if s.get("visitor_id"))
        wau = len(wau_visitors)
        
        # MAU - unique visitors last 30 days
        mau_result = supabase.table("analytics_sessions").select(
            "visitor_id"
        ).gte("first_seen", thirty_days_ago).execute()
        mau_visitors = set(s.get("visitor_id") for s in (mau_result.data or []) if s.get("visitor_id"))
        mau = len(mau_visitors)
        
        # Stickiness (DAU/MAU ratio)
        stickiness = round((dau / mau * 100), 1) if mau > 0 else 0
        
        # Sessions per user (last 7 days)
        sessions_7d = supabase.table("analytics_sessions").select(
            "visitor_id", count="exact"
        ).gte("first_seen", seven_days_ago).execute()
        total_sessions_7d = sessions_7d.count or 0
        sessions_per_user = round(total_sessions_7d / wau, 2) if wau > 0 else 0
        
        # Average session duration (last 7 days)
        duration_result = supabase.table("analytics_sessions").select(
            "first_seen, last_seen"
        ).gte("first_seen", seven_days_ago).not_.is_("last_seen", "null").execute()
        
        total_duration = 0
        duration_count = 0
        for s in duration_result.data or []:
            try:
                first = datetime.fromisoformat(s["first_seen"].replace("Z", "+00:00"))
                last = datetime.fromisoformat(s["last_seen"].replace("Z", "+00:00"))
                duration = (last - first).total_seconds()
                if 0 < duration < 7200:  # Cap at 2 hours to filter outliers
                    total_duration += duration
                    duration_count += 1
            except:
                pass
        
        avg_session_duration = round(total_duration / duration_count) if duration_count > 0 else 0
        
        # Retention: D1, D7, D30
        # Get visitors from 1, 7, 30 days ago and check if they returned
        def calculate_retention(days_ago: int) -> float:
            target_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days_ago)).isoformat()
            next_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=days_ago - 1)).isoformat()
            
            # Visitors who first visited on target_date
            cohort = supabase.table("analytics_sessions").select(
                "visitor_id"
            ).gte("first_seen", target_date).lt("first_seen", next_date).execute()
            
            cohort_visitors = set(s.get("visitor_id") for s in (cohort.data or []) if s.get("visitor_id"))
            if not cohort_visitors:
                return 0
            
            # Check how many returned after target_date
            returned = supabase.table("analytics_sessions").select(
                "visitor_id"
            ).in_("visitor_id", list(cohort_visitors)).gt("first_seen", next_date).execute()
            
            returned_visitors = set(s.get("visitor_id") for s in (returned.data or []) if s.get("visitor_id"))
            
            return round(len(returned_visitors) / len(cohort_visitors) * 100, 1)
        
        d1_retention = calculate_retention(1) if datetime.utcnow().date() > datetime.fromisoformat(start_date).date() else 0
        d7_retention = calculate_retention(7) if (datetime.utcnow().date() - datetime.fromisoformat(start_date).date()).days >= 7 else 0
        d30_retention = calculate_retention(30) if (datetime.utcnow().date() - datetime.fromisoformat(start_date).date()).days >= 30 else 0
        
        # Bounce rate (single page sessions)
        single_page_sessions = 0
        total_sessions_for_bounce = 0
        
        bounce_sessions = supabase.table("analytics_sessions").select(
            "session_id"
        ).gte("first_seen", seven_days_ago).execute()
        
        for s in bounce_sessions.data or []:
            sid = s.get("session_id")
            pv_count = supabase.table("analytics_page_views").select(
                "id", count="exact"
            ).eq("session_id", sid).execute()
            total_sessions_for_bounce += 1
            if (pv_count.count or 0) <= 1:
                single_page_sessions += 1
        
        bounce_rate = round(single_page_sessions / total_sessions_for_bounce * 100, 1) if total_sessions_for_bounce > 0 else 0
        
        return APIResponse.ok({
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "stickiness": stickiness,
            "sessions_per_user_weekly": sessions_per_user,
            "avg_session_duration_seconds": avg_session_duration,
            "bounce_rate": bounce_rate,
            "retention": {
                "d1": d1_retention,
                "d7": d7_retention,
                "d30": d30_retention,
            },
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/countries")
async def get_country_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """
    Get geographic breakdown by country.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=7)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        sessions = supabase.table("analytics_sessions").select(
            "country, country_code, region, city, converted_to_signup"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
        countries = {}
        cities = {}
        
        for s in sessions.data or []:
            country = s.get("country") or "Unknown"
            country_code = s.get("country_code") or ""
            city = s.get("city")
            converted = s.get("converted_to_signup", False)
            
            if country not in countries:
                countries[country] = {"count": 0, "conversions": 0, "code": country_code}
            countries[country]["count"] += 1
            if converted:
                countries[country]["conversions"] += 1
            
            if city:
                if city not in cities:
                    cities[city] = {"count": 0, "country": country}
                cities[city]["count"] += 1
        
        # Sort by count
        sorted_countries = sorted(
            [{"name": k, "code": v["code"], "count": v["count"], "conversions": v["conversions"], 
              "conversion_rate": round(v["conversions"] / v["count"] * 100, 1) if v["count"] > 0 else 0}
             for k, v in countries.items()],
            key=lambda x: x["count"],
            reverse=True
        )
        
        sorted_cities = sorted(
            [{"name": k, "country": v["country"], "count": v["count"]} for k, v in cities.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:20]
        
        return APIResponse.ok({
            "countries": sorted_countries,
            "cities": sorted_cities,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/revenue")
async def get_revenue_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """
    Get revenue and monetization metrics from shop events.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=30)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        
        # Get shop events
        shop_events = supabase.table("analytics_shop_events").select(
            "event_type, item_id, item_type, item_rarity, price, currency, visitor_id, user_id, created_at"
        ).gte("created_at", start_date).lt("created_at", end_date_inclusive).execute()
        
        events = shop_events.data or []
        
        # Calculate metrics
        total_revenue = 0
        purchases = []
        paying_users = set()
        all_users = set()
        items_sold = {}
        daily_revenue = {}
        
        for e in events:
            visitor = e.get("visitor_id") or e.get("user_id")
            if visitor:
                all_users.add(visitor)
            
            if e.get("event_type") == "purchase_complete":
                price = e.get("price", 0) or 0
                total_revenue += price
                purchases.append(e)
                
                if visitor:
                    paying_users.add(visitor)
                
                item_id = e.get("item_id", "unknown")
                if item_id not in items_sold:
                    items_sold[item_id] = {"count": 0, "revenue": 0, "type": e.get("item_type"), "rarity": e.get("item_rarity")}
                items_sold[item_id]["count"] += 1
                items_sold[item_id]["revenue"] += price
                
                # Daily breakdown
                day = e.get("created_at", "")[:10]
                if day:
                    if day not in daily_revenue:
                        daily_revenue[day] = {"revenue": 0, "transactions": 0}
                    daily_revenue[day]["revenue"] += price
                    daily_revenue[day]["transactions"] += 1
        
        # Funnel metrics
        views = len([e for e in events if e.get("event_type") == "view"])
        item_views = len([e for e in events if e.get("event_type") == "item_view"])
        previews = len([e for e in events if e.get("event_type") == "preview"])
        purchase_starts = len([e for e in events if e.get("event_type") == "purchase_start"])
        purchase_completes = len(purchases)
        
        # Calculate rates
        arpu = round(total_revenue / len(all_users), 2) if all_users else 0
        arppu = round(total_revenue / len(paying_users), 2) if paying_users else 0
        conversion_rate = round(len(paying_users) / len(all_users) * 100, 2) if all_users else 0
        
        # Top items
        top_items = sorted(
            [{"item_id": k, **v} for k, v in items_sold.items()],
            key=lambda x: x["revenue"],
            reverse=True
        )[:10]
        
        # Daily data for chart
        daily_data = sorted(
            [{"date": k, **v} for k, v in daily_revenue.items()],
            key=lambda x: x["date"]
        )
        
        return APIResponse.ok({
            "total_revenue": total_revenue,
            "total_transactions": len(purchases),
            "unique_buyers": len(paying_users),
            "total_users": len(all_users),
            "arpu": arpu,
            "arppu": arppu,
            "conversion_rate": conversion_rate,
            "funnel": {
                "shop_views": views,
                "item_views": item_views,
                "previews": previews,
                "purchase_starts": purchase_starts,
                "purchase_completes": purchase_completes,
            },
            "top_items": top_items,
            "daily": daily_data,
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")


@router.get("/dashboard/advertiser-summary")
async def get_advertiser_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    _admin=Depends(require_admin)
):
    """
    Get a comprehensive summary for advertisers - all key metrics in one call.
    """
    try:
        supabase = get_supabase_service_client()
        
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - __import__('datetime').timedelta(days=30)).isoformat()
        
        end_date_inclusive = (datetime.fromisoformat(end_date) + __import__('datetime').timedelta(days=1)).isoformat()[:10]
        today = datetime.utcnow().date().isoformat()
        thirty_days_ago = (datetime.utcnow().date() - __import__('datetime').timedelta(days=30)).isoformat()
        
        # Reach metrics
        sessions = supabase.table("analytics_sessions").select(
            "visitor_id, device_type, country, converted_to_signup, first_seen"
        ).gte("first_seen", start_date).lt("first_seen", end_date_inclusive).execute()
        
        visitors = set()
        devices = {"mobile": 0, "tablet": 0, "desktop": 0}
        countries = {}
        conversions = 0
        
        for s in sessions.data or []:
            vid = s.get("visitor_id")
            if vid:
                visitors.add(vid)
            
            device = s.get("device_type", "desktop")
            if device in devices:
                devices[device] += 1
            
            country = s.get("country") or "Unknown"
            countries[country] = countries.get(country, 0) + 1
            
            if s.get("converted_to_signup"):
                conversions += 1
        
        total_visitors = len(visitors)
        total_sessions = len(sessions.data or [])
        
        # Page views
        page_views = supabase.table("analytics_page_views").select(
            "id", count="exact"
        ).gte("viewed_at", start_date).lt("viewed_at", end_date_inclusive).execute()
        
        # DAU/MAU
        dau_result = supabase.table("analytics_sessions").select(
            "visitor_id"
        ).gte("first_seen", today).execute()
        dau = len(set(s.get("visitor_id") for s in (dau_result.data or []) if s.get("visitor_id")))
        
        mau_result = supabase.table("analytics_sessions").select(
            "visitor_id"
        ).gte("first_seen", thirty_days_ago).execute()
        mau = len(set(s.get("visitor_id") for s in (mau_result.data or []) if s.get("visitor_id")))
        
        # Top countries
        top_countries = sorted(
            [{"name": k, "count": v} for k, v in countries.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:5]
        
        # Device percentages
        total_device = sum(devices.values())
        device_pct = {
            k: round(v / total_device * 100, 1) if total_device > 0 else 0
            for k, v in devices.items()
        }
        
        return APIResponse.ok({
            "period": {
                "start": start_date,
                "end": end_date,
            },
            "reach": {
                "unique_visitors": total_visitors,
                "total_sessions": total_sessions,
                "page_views": page_views.count or 0,
                "pages_per_session": round((page_views.count or 0) / total_sessions, 1) if total_sessions > 0 else 0,
            },
            "engagement": {
                "dau": dau,
                "mau": mau,
                "stickiness": round(dau / mau * 100, 1) if mau > 0 else 0,
            },
            "conversion": {
                "total_conversions": conversions,
                "conversion_rate": round(conversions / total_visitors * 100, 2) if total_visitors > 0 else 0,
            },
            "audience": {
                "devices": device_pct,
                "top_countries": top_countries,
            },
        })
    except Exception as e:
        return APIResponse.fail(str(e), "ANALYTICS_ERROR")
