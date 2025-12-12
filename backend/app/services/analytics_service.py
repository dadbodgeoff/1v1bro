"""
Analytics Service - Background jobs and calculations
Handles cohort analysis, retention curves, funnel calculations
"""

from datetime import datetime, timedelta
from typing import Optional
from app.database.supabase_client import get_supabase_service_client


async def calculate_retention_curves(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Calculate retention curves for cohorts.
    Should be run daily as a background job.
    """
    supabase = get_supabase_service_client()
    
    if not end_date:
        end_date = datetime.utcnow().date().isoformat()
    if not start_date:
        start_date = (datetime.utcnow().date() - timedelta(days=90)).isoformat()
    
    # Get all sessions grouped by signup date
    sessions = supabase.table("analytics_sessions").select(
        "visitor_id, first_seen, utm_source"
    ).gte("first_seen", start_date).lte("first_seen", end_date).execute()
    
    # Group by cohort date
    cohorts = {}
    for s in sessions.data or []:
        cohort_date = s["first_seen"][:10]
        source = s.get("utm_source") or "direct"
        key = (cohort_date, source)
        
        if key not in cohorts:
            cohorts[key] = {"visitors": set(), "source": source}
        cohorts[key]["visitors"].add(s["visitor_id"])
    
    # Get retention data
    retention = supabase.table("analytics_retention").select(
        "visitor_id, cohort_date, days_since_cohort"
    ).gte("cohort_date", start_date).lte("cohort_date", end_date).execute()
    
    # Build retention map
    retention_map = {}
    for r in retention.data or []:
        key = (r["cohort_date"], r["visitor_id"])
        if key not in retention_map:
            retention_map[key] = set()
        retention_map[key].add(r["days_since_cohort"])
    
    # Calculate retention curves
    for (cohort_date, source), cohort_data in cohorts.items():
        cohort_size = len(cohort_data["visitors"])
        if cohort_size == 0:
            continue
        
        # Count retained at each interval
        intervals = [1, 3, 7, 14, 30, 60, 90]
        retained = {i: 0 for i in intervals}
        
        for visitor_id in cohort_data["visitors"]:
            key = (cohort_date, visitor_id)
            if key in retention_map:
                for interval in intervals:
                    if interval in retention_map[key]:
                        retained[interval] += 1
        
        # Upsert retention curve
        supabase.table("analytics_retention_curves").upsert({
            "cohort_date": cohort_date,
            "cohort_size": cohort_size,
            "acquisition_source": source,
            "day_1_retained": round(retained[1] / cohort_size * 100, 2) if cohort_size else 0,
            "day_1_count": retained[1],
            "day_3_retained": round(retained[3] / cohort_size * 100, 2) if cohort_size else 0,
            "day_7_retained": round(retained[7] / cohort_size * 100, 2) if cohort_size else 0,
            "day_7_count": retained[7],
            "day_14_retained": round(retained[14] / cohort_size * 100, 2) if cohort_size else 0,
            "day_30_retained": round(retained[30] / cohort_size * 100, 2) if cohort_size else 0,
            "day_30_count": retained[30],
            "day_60_retained": round(retained[60] / cohort_size * 100, 2) if cohort_size else 0,
            "day_90_retained": round(retained[90] / cohort_size * 100, 2) if cohort_size else 0,
            "updated_at": datetime.utcnow().isoformat(),
        }, on_conflict="cohort_date,acquisition_source").execute()


async def update_user_retention(visitor_id: str, cohort_date: str):
    """
    Update retention record for a user's activity.
    Called when a user visits the site.
    """
    supabase = get_supabase_service_client()
    
    today = datetime.utcnow().date()
    cohort = datetime.fromisoformat(cohort_date).date()
    days_since = (today - cohort).days
    
    # Upsert retention record
    supabase.table("analytics_retention").upsert({
        "visitor_id": visitor_id,
        "cohort_date": cohort_date,
        "activity_date": today.isoformat(),
        "days_since_cohort": days_since,
    }, on_conflict="visitor_id,activity_date").execute()


async def calculate_funnel_stats(funnel_id: str, date: str):
    """
    Calculate funnel completion stats for a specific date.
    """
    supabase = get_supabase_service_client()
    
    # Get funnel definition
    funnel = supabase.table("analytics_funnels").select("steps").eq("id", funnel_id).single().execute()
    if not funnel.data:
        return
    
    steps = funnel.data["steps"]
    
    # Get all journeys for the date
    journeys = supabase.table("analytics_user_journeys").select(
        "id"
    ).gte("journey_start", date).lt(
        "journey_start", (datetime.fromisoformat(date) + timedelta(days=1)).isoformat()[:10]
    ).execute()
    
    journey_ids = [j["id"] for j in journeys.data or []]
    if not journey_ids:
        return
    
    # Get all journey steps
    all_steps = supabase.table("analytics_journey_steps").select(
        "journey_id, step_type, page, event_name"
    ).in_("journey_id", journey_ids).execute()
    
    # Group steps by journey
    journey_steps = {}
    for step in all_steps.data or []:
        jid = step["journey_id"]
        if jid not in journey_steps:
            journey_steps[jid] = []
        journey_steps[jid].append(step)
    
    # Check funnel completion for each journey
    for step_num, funnel_step in enumerate(steps, 1):
        entered = 0
        completed = 0
        
        for jid, jsteps in journey_steps.items():
            # Check if journey reached this step
            step_reached = False
            for jstep in jsteps:
                if funnel_step.get("type") == "pageview" and jstep["step_type"] == "pageview":
                    if funnel_step.get("match") in (jstep.get("page") or ""):
                        step_reached = True
                        break
                elif funnel_step.get("type") == "event" and jstep["step_type"] == "event":
                    if funnel_step.get("match") == jstep.get("event_name"):
                        step_reached = True
                        break
            
            if step_reached:
                entered += 1
                # Check if completed (reached next step or is last step)
                if step_num == len(steps):
                    completed += 1
                else:
                    # Check next step
                    next_step = steps[step_num]
                    for jstep in jsteps:
                        if next_step.get("type") == jstep["step_type"]:
                            if next_step.get("match") in (jstep.get("page") or jstep.get("event_name") or ""):
                                completed += 1
                                break
        
        # Upsert funnel stats
        supabase.table("analytics_funnel_stats").upsert({
            "funnel_id": funnel_id,
            "date": date,
            "step_number": step_num,
            "entered_count": entered,
            "completed_count": completed,
            "drop_off_count": entered - completed,
        }, on_conflict="funnel_id,date,step_number").execute()


async def assign_experiment_variant(
    experiment_id: str,
    visitor_id: str,
    session_id: str = None,
    user_id: str = None
) -> str:
    """
    Assign a visitor to an experiment variant.
    Uses deterministic assignment based on visitor_id.
    """
    supabase = get_supabase_service_client()
    
    # Check existing assignment
    existing = supabase.table("analytics_experiment_assignments").select(
        "variant_id"
    ).eq("experiment_id", experiment_id).eq("visitor_id", visitor_id).execute()
    
    if existing.data:
        return existing.data[0]["variant_id"]
    
    # Get experiment
    exp = supabase.table("analytics_experiments").select(
        "variants, traffic_percent, status"
    ).eq("id", experiment_id).single().execute()
    
    if not exp.data or exp.data["status"] != "running":
        return "control"
    
    # Check traffic allocation
    hash_val = hash(f"{experiment_id}:{visitor_id}") % 100
    if hash_val >= exp.data["traffic_percent"]:
        return "control"  # Not in experiment
    
    # Assign variant based on weights
    variants = exp.data["variants"]
    total_weight = sum(v.get("weight", 1) for v in variants)
    variant_hash = hash(f"{experiment_id}:{visitor_id}:variant") % total_weight
    
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
        "visitor_id": visitor_id,
        "session_id": session_id,
        "user_id": user_id,
        "variant_id": assigned_variant,
    }).execute()
    
    return assigned_variant


async def record_experiment_conversion(
    experiment_id: str,
    visitor_id: str,
    conversion_value: float = None
):
    """
    Record a conversion for an experiment.
    """
    supabase = get_supabase_service_client()
    
    supabase.table("analytics_experiment_assignments").update({
        "converted": True,
        "conversion_value": conversion_value,
        "converted_at": datetime.utcnow().isoformat(),
    }).eq("experiment_id", experiment_id).eq("visitor_id", visitor_id).execute()
