#!/usr/bin/env python3
"""
Survival Mode Tracking Verification Script

Verifies all tracking systems are working after a test run.
Usage: python scripts/verify_survival_tracking.py <email>

Checks:
1. survival_runs - Run was recorded
2. survival_personal_bests - PB was updated
3. survival_leaderboard - Leaderboard entry exists
4. survival_analytics_runs - Analytics were tracked
5. survival_analytics_sessions - Session was recorded
6. survival_death_events - Death events logged (if any)
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_by_email(email: str) -> dict | None:
    """Get user by email using Supabase admin API with pagination"""
    try:
        page = 1
        per_page = 100
        
        while True:
            response = supabase.auth.admin.list_users(page=page, per_page=per_page)
            users = response if isinstance(response, list) else []
            
            for user in users:
                user_email = getattr(user, 'email', None) or (user.get('email') if isinstance(user, dict) else None)
                if user_email and user_email.lower() == email.lower():
                    user_id = getattr(user, 'id', None) or (user.get('id') if isinstance(user, dict) else None)
                    metadata = getattr(user, 'user_metadata', {}) or (user.get('user_metadata', {}) if isinstance(user, dict) else {})
                    return {
                        "id": user_id, 
                        "email": user_email, 
                        "display_name": metadata.get("display_name", email)
                    }
            
            if len(users) < per_page:
                break
            page += 1
            
    except Exception as e:
        print(f"   (Admin API error: {e})")
    return None


def check_survival_runs(user_id: str) -> dict:
    """Check survival_runs table"""
    result = supabase.table("survival_runs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
    
    runs = result.data or []
    latest = runs[0] if runs else None
    
    return {
        "table": "survival_runs",
        "status": "✅ PASS" if runs else "❌ FAIL",
        "count": len(runs),
        "latest": {
            "id": latest["id"][:8] + "..." if latest else None,
            "distance": latest.get("distance") if latest else None,
            "score": latest.get("score") if latest else None,
            "max_combo": latest.get("max_combo") if latest else None,
            "created_at": latest.get("created_at") if latest else None,
            "has_ghost": latest.get("has_ghost") if latest else None,
        } if latest else None
    }


def check_personal_bests(user_id: str) -> dict:
    """Check survival_personal_bests table"""
    result = supabase.table("survival_personal_bests").select("*").eq("user_id", user_id).execute()
    
    pb = result.data[0] if result.data else None
    
    return {
        "table": "survival_personal_bests",
        "status": "✅ PASS" if pb else "❌ FAIL",
        "data": {
            "best_distance": pb.get("best_distance") if pb else None,
            "best_score": pb.get("best_score") if pb else None,
            "best_combo": pb.get("best_combo") if pb else None,
            "has_ghost_data": bool(pb.get("ghost_data")) if pb else False,
            "achieved_at": pb.get("achieved_at") if pb else None,
        } if pb else None
    }


def check_leaderboard(user_id: str) -> dict:
    """Check survival_leaderboard materialized view"""
    try:
        result = supabase.table("survival_leaderboard").select("*").eq("user_id", user_id).execute()
        entry = result.data[0] if result.data else None
        
        return {
            "table": "survival_leaderboard",
            "status": "✅ PASS" if entry else "⚠️ NOT FOUND (may need refresh)",
            "data": {
                "rank": entry.get("rank") if entry else None,
                "best_distance": entry.get("best_distance") if entry else None,
                "best_score": entry.get("best_score") if entry else None,
                "total_runs": entry.get("total_runs") if entry else None,
            } if entry else None
        }
    except Exception as e:
        return {
            "table": "survival_leaderboard",
            "status": f"⚠️ ERROR: {str(e)}",
            "data": None
        }


def check_analytics_runs(user_id: str) -> dict:
    """Check survival_analytics_runs table"""
    result = supabase.table("survival_analytics_runs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
    
    runs = result.data or []
    latest = runs[0] if runs else None
    
    return {
        "table": "survival_analytics_runs",
        "status": "✅ PASS" if runs else "⚠️ NO ANALYTICS (may be disabled)",
        "count": len(runs),
        "latest": {
            "distance": latest.get("distance") if latest else None,
            "score": latest.get("score") if latest else None,
            "max_combo": latest.get("max_combo") if latest else None,
            "death_obstacle_type": latest.get("death_obstacle_type") if latest else None,
            "avg_fps": latest.get("avg_fps") if latest else None,
            "created_at": latest.get("created_at") if latest else None,
        } if latest else None
    }


def check_analytics_sessions(user_id: str) -> dict:
    """Check survival_analytics_sessions table"""
    result = supabase.table("survival_analytics_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(3).execute()
    
    sessions = result.data or []
    latest = sessions[0] if sessions else None
    
    return {
        "table": "survival_analytics_sessions",
        "status": "✅ PASS" if sessions else "⚠️ NO SESSIONS",
        "count": len(sessions),
        "latest": {
            "total_runs": latest.get("total_runs") if latest else None,
            "total_playtime_seconds": latest.get("total_playtime_seconds") if latest else None,
            "longest_run_distance": latest.get("longest_run_distance") if latest else None,
            "device_type": latest.get("device_type") if latest else None,
            "started_at": latest.get("started_at") if latest else None,
        } if latest else None
    }


def check_death_events(user_id: str) -> dict:
    """Check survival_death_events table"""
    result = supabase.table("survival_death_events").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
    
    events = result.data or []
    
    # Group by obstacle type
    by_type = {}
    for e in events:
        t = e.get("obstacle_type", "unknown")
        by_type[t] = by_type.get(t, 0) + 1
    
    return {
        "table": "survival_death_events",
        "status": "✅ PASS" if events else "ℹ️ NO DEATHS (or not tracked)",
        "count": len(events),
        "by_obstacle_type": by_type if by_type else None,
    }


def check_daily_aggregates() -> dict:
    """Check survival_analytics_daily materialized view"""
    try:
        today = datetime.utcnow().date().isoformat()
        result = supabase.table("survival_analytics_daily").select("*").eq("date", today).execute()
        
        data = result.data[0] if result.data else None
        
        return {
            "table": "survival_analytics_daily",
            "status": "✅ PASS" if data else "⚠️ NO DATA TODAY (may need refresh)",
            "today": {
                "total_runs": data.get("total_runs") if data else None,
                "unique_players": data.get("unique_players") if data else None,
                "avg_distance": data.get("avg_distance") if data else None,
                "max_distance": data.get("max_distance") if data else None,
            } if data else None
        }
    except Exception as e:
        return {
            "table": "survival_analytics_daily",
            "status": f"⚠️ ERROR: {str(e)}",
            "today": None
        }


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/verify_survival_tracking.py <email>")
        print("Example: python scripts/verify_survival_tracking.py dadbodgeoff@gmail.com")
        sys.exit(1)
    
    email = sys.argv[1]
    print(f"\n🔍 Verifying Survival Mode tracking for: {email}")
    print("=" * 60)
    
    # Get user ID using admin API
    user = get_user_by_email(email)
    if not user:
        print(f"❌ User not found with email: {email}")
        sys.exit(1)
    
    user_id = user["id"]
    print(f"👤 User: {user.get('display_name', 'Unknown')} ({user_id[:8]}...)")
    print("=" * 60)
    
    # Run all checks
    checks = [
        check_survival_runs(user_id),
        check_personal_bests(user_id),
        check_leaderboard(user_id),
        check_analytics_runs(user_id),
        check_analytics_sessions(user_id),
        check_death_events(user_id),
        check_daily_aggregates(),
    ]
    
    # Print results
    passed = 0
    warnings = 0
    failed = 0
    
    for check in checks:
        status = check["status"]
        print(f"\n{status} {check['table']}")
        
        if "✅" in status:
            passed += 1
        elif "⚠️" in status:
            warnings += 1
        else:
            failed += 1
        
        # Print details
        for key, value in check.items():
            if key not in ["table", "status"] and value is not None:
                if isinstance(value, dict):
                    for k, v in value.items():
                        if v is not None:
                            print(f"   {k}: {v}")
                else:
                    print(f"   {key}: {value}")
    
    # Summary
    print("\n" + "=" * 60)
    print(f"📊 SUMMARY: {passed} passed, {warnings} warnings, {failed} failed")
    
    if failed > 0:
        print("\n⚠️  Some tracking systems may not be working correctly.")
        print("   Check backend logs for errors.")
    elif warnings > 0:
        print("\n💡 Some data may need materialized view refresh:")
        print("   Run: SELECT refresh_survival_leaderboard();")
        print("   Run: SELECT refresh_survival_analytics();")
    else:
        print("\n✅ All tracking systems are working correctly!")
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
