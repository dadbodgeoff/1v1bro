"""
Admin Cosmetics API endpoints for Dynamic Shop CMS.
Requirements: 1.1, 1.2, 2.1-2.5, 3.1
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from app.api.deps import get_current_admin_user
from app.database.supabase_client import get_supabase_service_client as get_supabase_client
from app.database.repositories.cosmetics_repo import CosmeticsRepository
from app.database.repositories.asset_metadata_repo import AssetMetadataRepository
from app.services.asset_service import AssetManagementService
from app.schemas.admin_cosmetic import (
    CosmeticCreateRequest,
    CosmeticUpdateRequest,
    AssetUploadResponse,
    AdminCosmeticResponse,
    AdminCosmeticListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/cosmetics", tags=["admin-cosmetics"])


@router.get("", response_model=AdminCosmeticListResponse)
async def list_cosmetics(
    page: int = 1,
    page_size: int = 20,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """
    List all cosmetics for admin view.
    No availability filtering applied.
    """
    repo = CosmeticsRepository(client)
    offset = (page - 1) * page_size
    
    items = await repo.get_all_admin(limit=page_size, offset=offset)
    total = await repo.get_total_count()
    
    return AdminCosmeticListResponse(
        items=[AdminCosmeticResponse(**item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{cosmetic_id}", response_model=AdminCosmeticResponse)
async def get_cosmetic(
    cosmetic_id: str,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """Get a single cosmetic by ID."""
    repo = CosmeticsRepository(client)
    cosmetic = await repo.get_cosmetic(cosmetic_id)
    
    if not cosmetic:
        raise HTTPException(status_code=404, detail="Cosmetic not found")
    
    return AdminCosmeticResponse(**cosmetic)


@router.post("", response_model=AdminCosmeticResponse, status_code=201)
async def create_cosmetic(
    request: CosmeticCreateRequest,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """
    Create a new cosmetic.
    
    Property 5: Cosmetic creation stores all fields.
    Property 9: Required field validation.
    """
    repo = CosmeticsRepository(client)
    
    # Convert to dict, excluding None values
    data = request.model_dump(exclude_none=True)
    
    # Convert enums to values
    data["type"] = data["type"].value
    data["rarity"] = data["rarity"].value
    
    cosmetic = await repo.create_cosmetic(data)
    
    if not cosmetic:
        raise HTTPException(status_code=500, detail="Failed to create cosmetic")
    
    return AdminCosmeticResponse(**cosmetic)


@router.put("/{cosmetic_id}", response_model=AdminCosmeticResponse)
async def update_cosmetic(
    cosmetic_id: str,
    request: CosmeticUpdateRequest,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """
    Update a cosmetic.
    
    Property 6: Partial update preserves unchanged fields.
    """
    repo = CosmeticsRepository(client)
    
    # Check exists
    existing = await repo.get_cosmetic(cosmetic_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Cosmetic not found")
    
    # Convert to dict, excluding None values
    data = request.model_dump(exclude_none=True)
    
    cosmetic = await repo.update_cosmetic(cosmetic_id, data)
    
    if not cosmetic:
        raise HTTPException(status_code=500, detail="Failed to update cosmetic")
    
    return AdminCosmeticResponse(**cosmetic)


@router.delete("/{cosmetic_id}", status_code=204)
async def delete_cosmetic(
    cosmetic_id: str,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """
    Delete a cosmetic and its associated assets.
    
    Property 7: Delete cascades to assets.
    """
    repo = CosmeticsRepository(client)
    asset_repo = AssetMetadataRepository(client)
    asset_service = AssetManagementService(client)
    
    # Check exists
    existing = await repo.get_cosmetic(cosmetic_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Cosmetic not found")
    
    # Get and delete associated assets from storage
    assets = await asset_repo.get_by_cosmetic(cosmetic_id)
    for asset in assets:
        await asset_service.delete_asset(asset["storage_path"])
    
    # Delete cosmetic (cascades to asset_metadata via FK)
    deleted = await repo.delete_cosmetic(cosmetic_id)
    
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete cosmetic")
    
    return None



@router.post("/{cosmetic_id}/assets", response_model=AssetUploadResponse)
async def upload_asset(
    cosmetic_id: str,
    file: UploadFile = File(...),
    asset_type: str = Form(...),
    validate_sprite: bool = Form(False),
    frame_size: int = Form(64),
    client=Depends(get_supabase_client),
    admin=Depends(get_current_admin_user),
):
    """
    Upload an asset for a cosmetic.
    
    Property 1: Asset upload returns valid URL.
    Property 2: Sprite sheet dimension validation.
    Property 3: Upload error messages.
    Property 4: Unique filename generation.
    Property 19: Asset metadata completeness.
    
    Args:
        cosmetic_id: ID of the cosmetic
        file: The file to upload
        asset_type: Type of asset (image, sprite_sheet, sprite_meta, video)
        validate_sprite: Whether to validate as sprite sheet
        frame_size: Expected frame size for sprite validation
    """
    repo = CosmeticsRepository(client)
    asset_repo = AssetMetadataRepository(client)
    asset_service = AssetManagementService(client)
    
    # Check cosmetic exists
    cosmetic = await repo.get_cosmetic(cosmetic_id)
    if not cosmetic:
        raise HTTPException(status_code=404, detail="Cosmetic not found")
    
    # Read file data
    file_data = await file.read()
    
    # Upload asset
    result = await asset_service.upload_asset(
        file_data=file_data,
        filename=file.filename or "asset",
        content_type=file.content_type or "application/octet-stream",
        cosmetic_type=cosmetic["type"],
        cosmetic_id=cosmetic_id,
        validate_sprite=validate_sprite,
        expected_frame_size=frame_size,
    )
    
    if not result.success:
        return AssetUploadResponse(
            success=False,
            error_message=result.error_message,
        )
    
    # Store metadata
    await asset_repo.create(
        cosmetic_id=cosmetic_id,
        asset_type=asset_type,
        storage_path=result.storage_path,
        public_url=result.public_url,
        content_type=result.content_type,
        file_size=result.file_size,
        width=result.width,
        height=result.height,
        frame_count=result.frame_count,
        uploaded_by=admin.get("id") if admin else None,
    )
    
    # Update cosmetic with asset URL based on type
    url_field_map = {
        "image": "image_url",
        "sprite_sheet": "sprite_sheet_url",
        "sprite_meta": "sprite_meta_url",
        "video": "preview_video_url",
    }
    
    url_field = url_field_map.get(asset_type)
    if url_field:
        await repo.update_cosmetic(cosmetic_id, {url_field: result.public_url})
    
    return AssetUploadResponse(
        success=True,
        public_url=result.public_url,
        storage_path=result.storage_path,
        asset_type=asset_type,
        content_type=result.content_type,
        file_size=result.file_size,
        width=result.width,
        height=result.height,
        frame_count=result.frame_count,
    )


@router.post("/{cosmetic_id}/featured")
async def set_featured(
    cosmetic_id: str,
    is_featured: bool = True,
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """
    Set or unset a cosmetic as featured.
    
    Property 10: Featured flag behavior.
    """
    repo = CosmeticsRepository(client)
    
    cosmetic = await repo.set_featured(cosmetic_id, is_featured)
    if not cosmetic:
        raise HTTPException(status_code=404, detail="Cosmetic not found")
    
    return {"success": True, "is_featured": is_featured}


@router.get("/featured/list", response_model=AdminCosmeticListResponse)
async def list_featured(
    client=Depends(get_supabase_client),
    _admin=Depends(get_current_admin_user),
):
    """Get all currently featured cosmetics."""
    repo = CosmeticsRepository(client)
    items = await repo.get_featured()
    
    return AdminCosmeticListResponse(
        items=[AdminCosmeticResponse(**item) for item in items],
        total=len(items),
        page=1,
        page_size=len(items),
    )
