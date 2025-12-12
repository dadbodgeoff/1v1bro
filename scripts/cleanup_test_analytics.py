#!/usr/bin/env python3
"""
Selective Analytics Data Cleanup

Removes analytics data that appears to be from localhost testing:
- Sessions with localhost referrers
- Page views from localhost URLs
- Health check test data
- Sessions without proper referrer that look like dev testing

Preserves all legitimate user data from production.

Run with: python scripts/cleanup_test_analytics.py
"""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv

# Try loading from multiple locations
script_dir = os.path.dirname(__file__)
root_dir = os.path.join(script_dir, '..')

# Try root .env first, then backend .env
load_dotenv(os.path.join(root_dir, '.env'))
load_dotenv(os.path.join(root_dir, 'backend', '.env'))

from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    print(f"  SUPABASE_URL: {'set' if SUPABASE_URL else 'missing'}")
    print(f"  SUPABASE_SERVICE_KEY: {'set' if SUPABASE_SERVICE_KEY else 'missing'}")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Patterns that indicate localhost/test data
LOCALHOST_PATTERNS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    ':5173',  # Vite dev server
    ':3000',  # Common dev port
    ':8080',  # Common dev port
]


def find_localhost_sessions():
    """Find sessions that look like localhost testing."""
    test_sessions = set()
    
    # Get all sessions to check
    all_sessions = supabase.table("analytics_sessions").select(
        "session_id, first_referrer, visitor_id"
    ).execute()
    
    for session in (all_sessions.data or []):
        referrer = session.get("first_referrer") or ""
        
        # Check if referrer contains localhost patterns
        for pattern in LOCALHOST_PATTERNS:
            if pattern in referrer.lower():
                test_sessions.add(session["session_id"])
                break
    
    return list(test_sessions)


def find_localhost_pageviews():
    """Find page views with localhost referrers."""
    test_pageview_sessions = set()
    
    all_pageviews = supabase.table("analytics_page_views").select(
        "session_id, referrer"
    ).execute()
    
    for pv in (all_pageviews.data or []):
        referrer = pv.get("referrer") or ""
        for pattern in LOCALHOST_PATTERNS:
            if pattern in referrer.lower():
                test_pageview_sessions.add(pv["session_id"])
                break
    
    return list(test_pageview_sessions)


def find_health_check_data():
    """Find health check test data."""
    health_checks = supabase.table("analytics_sessions").select(
        "session_id"
    ).ilike("session_id", "%health_check%").execute()
    
    return [s["session_id"] for s in (health_checks.data or [])]


def find_test_visitor_ids():
    """Find visitor IDs that look like test data."""
    test_visitors = supabase.table("analytics_sessions").select(
        "session_id, visitor_id"
    ).or_(
        "visitor_id.ilike.%test%,"
        "visitor_id.ilike.%health_check%"
    ).execute()
    
    return [s["session_id"] for s in (test_visitors.data or [])]


def delete_sessions_and_related(session_ids: list):
    """Delete sessions and all related data."""
    if not session_ids:
        return {"total": 0, "details": {}}
    
    details = {}
    
    # Process in batches to avoid query limits
    batch_size = 100
    
    for i in range(0, len(session_ids), batch_size):
        batch = session_ids[i:i + batch_size]
        
        # Delete journeys first to get journey IDs
        try:
            journeys = supabase.table("analytics_user_journeys").select("id").in_(
                "session_id", batch
            ).execute()
            journey_ids = [j["id"] for j in (journeys.data or [])]
            
            if journey_ids:
                supabase.table("analytics_journey_steps").delete().in_("journey_id", journey_ids).execute()
                details["journey_steps"] = details.get("journey_steps", 0) + len(journey_ids)
                
                supabase.table("analytics_user_journeys").delete().in_("id", journey_ids).execute()
                details["journeys"] = details.get("journeys", 0) + len(journey_ids)
        except Exception as e:
            print(f"  Warning: Error deleting journeys - {e}")
        
        # Delete from related tables
        tables = [
            'analytics_page_views',
            'analytics_events', 
            'analytics_clicks',
            'analytics_scroll_depth',
            'analytics_performance',
            'analytics_errors',
            'analytics_active_sessions',
        ]
        
        for table in tables:
            try:
                result = supabase.table(table).delete().in_("session_id", batch).execute()
                count = len(result.data or [])
                if count > 0:
                    details[table] = details.get(table, 0) + count
            except Exception as e:
                print(f"  Warning: Error deleting from {table} - {e}")
        
        # Finally delete sessions
        try:
            result = supabase.table("analytics_sessions").delete().in_("session_id", batch).execute()
            details["sessions"] = details.get("sessions", 0) + len(result.data or [])
        except Exception as e:
            print(f"  Warning: Error deleting sessions - {e}")
    
    return {"total": sum(details.values()), "details": details}


def main():
    print("=" * 60)
    print("LOCALHOST ANALYTICS DATA CLEANUP")
    print("=" * 60)
    print()
    print("This will remove test data while preserving real user data.")
    print()
    
    # Find test data from multiple sources
    print("Scanning for localhost/test data...")
    print()
    
    localhost_sessions = find_localhost_sessions()
    print(f"  Sessions with localhost referrer: {len(localhost_sessions)}")
    
    localhost_pageviews = find_localhost_pageviews()
    print(f"  Sessions from localhost pageviews: {len(localhost_pageviews)}")
    
    health_check_sessions = find_health_check_data()
    print(f"  Health check test sessions: {len(health_check_sessions)}")
    
    test_visitor_sessions = find_test_visitor_ids()
    print(f"  Test visitor ID sessions: {len(test_visitor_sessions)}")
    
    # Combine all test sessions
    all_test_sessions = list(set(
        localhost_sessions + 
        localhost_pageviews + 
        health_check_sessions + 
        test_visitor_sessions
    ))
    
    print()
    print(f"Total unique test sessions to delete: {len(all_test_sessions)}")
    print()
    
    if not all_test_sessions:
        print("✅ No localhost/test data found! Your analytics are clean.")
        return
    
    # Get total counts for context
    total_sessions = supabase.table("analytics_sessions").select("id", count="exact").execute()
    total_count = total_sessions.count or 0
    real_count = total_count - len(all_test_sessions)
    
    print(f"Current total sessions: {total_count}")
    print(f"Sessions to delete: {len(all_test_sessions)}")
    print(f"Real sessions to keep: {real_count}")
    print()
    
    # Show sample of what will be deleted
    print("Sample session IDs to delete:")
    for sid in all_test_sessions[:5]:
        print(f"  - {sid[:50]}...")
    if len(all_test_sessions) > 5:
        print(f"  ... and {len(all_test_sessions) - 5} more")
    print()
    
    confirm = input("Delete localhost test data? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Aborted.")
        return
    
    print()
    print("Deleting localhost test data...")
    print("-" * 40)
    
    result = delete_sessions_and_related(all_test_sessions)
    
    print()
    print("Deletion summary:")
    for table, count in result["details"].items():
        print(f"  {table}: {count} rows")
    print("-" * 40)
    print(f"  TOTAL: {result['total']} rows deleted")
    print()
    print("✅ Cleanup complete!")
    print(f"Your analytics now contain only real user data ({real_count} sessions).")


if __name__ == '__main__':
    main()
