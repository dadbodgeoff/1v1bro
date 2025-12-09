"""
Storage proxy endpoint for static assets.
Redirects to Supabase Storage public URLs.
"""

import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/storage", tags=["storage"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")


@router.get("/{bucket}/{path:path}")
async def get_storage_asset(bucket: str, path: str):
    """
    Redirect to Supabase Storage public URL.
    
    This endpoint proxies requests to Supabase Storage, allowing the frontend
    to reference static assets without knowing the Supabase URL.
    
    Examples:
    - /api/v1/storage/cosmetics/coins.jpg -> Supabase cosmetics bucket
    - /api/v1/storage/cosmetics/default.jpg -> Default playercard image
    """
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Storage not configured")
    
    # Validate bucket name (only allow known buckets)
    allowed_buckets = {"cosmetics", "avatars", "banners"}
    if bucket not in allowed_buckets:
        raise HTTPException(status_code=404, detail="Bucket not found")
    
    # Construct Supabase Storage public URL
    storage_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
    
    # Redirect to the actual storage URL
    return RedirectResponse(url=storage_url, status_code=302)
