#!/usr/bin/env python3
"""
Cleanup Localhost Analytics Data

Removes all analytics data that was generated from localhost testing.
This includes sessions, page views, events, journeys, clicks, etc.

Run with: python scripts/cleanup_localhost_analytics.py
"""

import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def cleanup_analytics():
    """Delete all analytics data (nuclear option for fresh start)."""
    
    print("=" * 60)
    print("ANALYTICS DATA CLEANUP")
    print("=" * 60)
    print()
    
    # Tables to clean (in order due to foreign keys)
    tables = [
        'analytics_journey_steps',
        'analytics_user_journeys', 
        'analytics_page_views',
        'analytics_events',
        'analytics_clicks',
        'analytics_scroll_depth',
        'analytics_performance',
        'analytics_errors',
        'analytics_active_sessions',
        'analytics_experiment_assignments',
        'analytics_experiment_results',
        'analytics_funnel_stats',
        'analytics_retention',
        'analytics_retention_curves',
        'analytics_sessions',
    ]

    # Get counts before cleanup
    print("Current data counts:")
    print("-" * 40)
    
    counts = {}
    for table in tables:
        try:
            result = supabase.table(table).select("id", count="exact").execute()
            counts[table] = result.count or 0
            print(f"  {table}: {counts[table]} rows")
        except Exception as e:
            print(f"  {table}: Error - {e}")
            counts[table] = 0
    
    total = sum(counts.values())
    print("-" * 40)
    print(f"  TOTAL: {total} rows")
    print()
    
    if total == 0:
        print("No data to clean up!")
        return
    
    # Confirm deletion
    print("⚠️  WARNING: This will DELETE ALL analytics data!")
    print("This action cannot be undone.")
    print()
    confirm = input("Type 'DELETE ALL' to confirm: ")
    
    if confirm != 'DELETE ALL':
        print("Aborted.")
        return
    
    print()
    print("Deleting data...")
    print("-" * 40)
    
    deleted = {}
    for table in tables:
        if counts[table] == 0:
            continue
        try:
            # Delete all rows (use a condition that matches everything)
            supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            deleted[table] = counts[table]
            print(f"  ✓ {table}: {counts[table]} rows deleted")
        except Exception as e:
            print(f"  ✗ {table}: Error - {e}")
    
    print("-" * 40)
    print(f"  TOTAL DELETED: {sum(deleted.values())} rows")
    print()
    print("✅ Cleanup complete!")
    print()
    print("Your analytics data is now clean.")
    print("New data will only be collected from non-localhost sources.")


if __name__ == '__main__':
    cleanup_analytics()
