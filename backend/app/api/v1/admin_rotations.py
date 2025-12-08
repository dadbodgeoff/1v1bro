"""
Admin Rotations API endpoints for shop rotation management.
Requirements: 3.3, 3.4
"""

import logging
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_admin_user
from app.database.supabase_client import get_supabase_service_client as get_supabase_client
from app.services.rotation_service import ShopRotationService
from app.database.repositories.rotation_repo import ShopRotationRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/rotations", tags=["admin-rotations"])


class RotationCreateRequest(BaseModel):
    """Request to create a shop rotation."""
    name: str = Field(..., min_length=1, max_length=100)
    rotation_type: str = Field(..., pattern="^(daily|weekly|event|manual)$")
    starts_at: datetime
    ends_at: Optional[datetime] = None
    rotation_rules: Optional[dict] = None


class RotationResponse(BaseModel):
    """Shop rotation response."""
    id: str
    name: str
    rotation_type: str
    starts_at: datetime
    ends_at: Optional[datetime] = None
    featured_cosmetic_ids: List[str] = []
    rotation_rules: dict = {}
    is_active: bool = False
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None


class RotationListResponse(BaseModel):
    """List of rotations."""
    items: List[RotationResponse] = []
    total: int = 0


@router.get("", response_model=RotationListResponse)
async def list_rotations(
    page: int = 1,
    page_size: int = 20,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """List all shop rotations."""
    repo = ShopRotationRepository(client)
    offset = (page - 1) * page_size
    
    items = await repo.get_all(limit=page_size, offset=offset)
    
    return RotationListResponse(
        items=[RotationResponse(**item) for item in items],
        total=len(items),
    )


@router.get("/current", response_model=Optional[RotationResponse])
async def get_current_rotation(
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """Get the currently active rotation."""
    service = ShopRotationService(client)
    rotation = await service.get_current_rotation()
    
    if not rotation:
        return None
    
    return RotationResponse(**rotation)


@router.post("", response_model=RotationResponse, status_code=201)
async def create_rotation(
    request: RotationCreateRequest,
    client=Depends(get_supabase_client),
    admin=Depends(get_current_admin_user),
):
    """Create a new shop rotation."""
    service = ShopRotationService(client)
    
    rotation = await service.schedule_rotation(
        name=request.name,
        rotation_type=request.rotation_type,
        starts_at=request.starts_at,
        ends_at=request.ends_at,
        rotation_rules=request.rotation_rules,
        created_by=admin.get("id") if admin else None,
    )
    
    if not rotation:
        raise HTTPException(status_code=500, detail="Failed to create rotation")
    
    return RotationResponse(**rotation)


@router.post("/{rotation_id}/execute")
async def execute_rotation(
    rotation_id: str,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """
    Execute a rotation immediately.
    
    This will:
    1. Select items based on rotation rules
    2. Clear current featured items
    3. Set new featured items
    4. Activate the rotation
    """
    service = ShopRotationService(client)
    
    success = await service.execute_rotation(rotation_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to execute rotation")
    
    return {"success": True, "message": "Rotation executed successfully"}


@router.delete("/{rotation_id}", status_code=204)
async def delete_rotation(
    rotation_id: str,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """Delete a rotation."""
    repo = ShopRotationRepository(client)
    
    deleted = await repo.delete(rotation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rotation not found")
    
    return None
