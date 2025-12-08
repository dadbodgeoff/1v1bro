"""
Cosmetics API endpoints.
Requirements: 3.3-3.6, 5.5 (coin balance integration)
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, status, Query

from app.api.deps import CurrentUser, CosmeticsServiceDep, BalanceServiceDep
from app.core.responses import APIResponse
from app.schemas.cosmetic import (
    Cosmetic,
    CosmeticType,
    Rarity,
    InventoryItem,
    InventoryResponse,
    Loadout,
    ShopFilters,
    ShopResponse,
    EquipRequest,
    UnequipRequest,
)
from app.schemas.coin import InsufficientFundsError


router = APIRouter(prefix="/cosmetics", tags=["Cosmetics"])


# ============================================
# Shop Endpoints
# ============================================

@router.get(
    "/shop",
    response_model=APIResponse[ShopResponse],
)
async def get_shop(
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
    type: Optional[CosmeticType] = Query(None, description="Filter by cosmetic type"),
    rarity: Optional[Rarity] = Query(None, description="Filter by rarity"),
    event: Optional[str] = Query(None, description="Filter by event"),
    is_limited: Optional[bool] = Query(None, description="Filter limited items"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Get all available cosmetics in the shop.
    
    Supports filtering by type, rarity, event, and price range.
    Results are cached for 24 hours.
    """
    filters = ShopFilters(
        type=type,
        rarity=rarity,
        event=event,
        is_limited=is_limited,
        min_price=min_price,
        max_price=max_price,
    ) if any([type, rarity, event, is_limited, min_price, max_price]) else None
    
    shop = await cosmetics_service.get_shop(
        filters=filters,
        page=page,
        page_size=page_size,
    )
    
    return APIResponse.ok(shop)


@router.get(
    "/shop/{cosmetic_type}",
    response_model=APIResponse[list[Cosmetic]],
)
async def get_cosmetics_by_type(
    cosmetic_type: CosmeticType,
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
):
    """
    Get all cosmetics of a specific type.
    
    Returns all skins, emotes, banners, etc.
    """
    cosmetics = await cosmetics_service.get_cosmetics_by_type(cosmetic_type)
    return APIResponse.ok(cosmetics)


@router.get(
    "/{cosmetic_id}",
    response_model=APIResponse[Cosmetic],
)
async def get_cosmetic(
    cosmetic_id: str,
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
):
    """
    Get a single cosmetic by ID.
    
    Returns detailed information about a specific cosmetic item.
    """
    cosmetic = await cosmetics_service.get_cosmetic(cosmetic_id)
    
    if not cosmetic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cosmetic not found",
        )
    
    return APIResponse.ok(cosmetic)


# ============================================
# Inventory Endpoints
# ============================================

@router.get(
    "/me/inventory",
    response_model=APIResponse[InventoryResponse],
)
async def get_my_inventory(
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
):
    """
    Get the current user's inventory.
    
    Returns all owned cosmetics with equipped status.
    Results are cached for 5 minutes.
    """
    inventory = await cosmetics_service.get_inventory(current_user.id)
    return APIResponse.ok(inventory)


@router.post(
    "/{cosmetic_id}/purchase",
    response_model=APIResponse[InventoryItem],
)
async def purchase_cosmetic(
    cosmetic_id: str,
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
    balance_service: BalanceServiceDep,
):
    """
    Purchase a cosmetic and add to inventory.
    
    Checks coin balance and debits the price before adding to inventory.
    The cosmetic will be added to the user's inventory with the current timestamp.
    Returns error if already owned, not found, or insufficient funds.
    
    Requirements: 3.4, 5.5
    """
    # Get cosmetic to check price
    cosmetic = await cosmetics_service.get_cosmetic(cosmetic_id)
    if not cosmetic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cosmetic not found",
        )
    
    # Check if already owned
    inventory = await cosmetics_service.get_inventory(current_user.id)
    owned_ids = {item.cosmetic_id for item in inventory.items}
    if cosmetic_id in owned_ids:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cosmetic already owned",
        )
    
    # Check and debit balance (Requirements: 5.5)
    price = cosmetic.price_coins or 0
    if price > 0:
        try:
            await balance_service.debit_coins(
                user_id=current_user.id,
                amount=price,
                source="cosmetic_purchase",
            )
        except InsufficientFundsError as e:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "message": "Insufficient coin balance",
                    "current_balance": e.current_balance,
                    "required": e.required,
                    "shortfall": e.required - e.current_balance,
                },
            )
    
    # Add to inventory
    item = await cosmetics_service.purchase_cosmetic(
        user_id=current_user.id,
        cosmetic_id=cosmetic_id,
    )
    
    if not item:
        # Refund if purchase failed (shouldn't happen after checks above)
        if price > 0:
            await balance_service.credit_coins(
                user_id=current_user.id,
                amount=price,
                transaction_id=f"refund_{cosmetic_id}_{current_user.id}",
                source="refund",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add cosmetic to inventory",
        )
    
    return APIResponse.ok(item)


# ============================================
# Loadout Endpoints
# ============================================

@router.get(
    "/me/equipped",
    response_model=APIResponse[Loadout],
)
async def get_equipped(
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
):
    """
    Get currently equipped cosmetics.
    
    Returns the user's current loadout with all equipped items.
    """
    loadout = await cosmetics_service.get_loadout(current_user.id)
    
    if not loadout:
        # Return empty loadout
        loadout = Loadout(user_id=current_user.id)
    
    return APIResponse.ok(loadout)


@router.post(
    "/{cosmetic_id}/equip",
    response_model=APIResponse[Loadout],
)
async def equip_cosmetic(
    cosmetic_id: str,
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
):
    """
    Equip a cosmetic to the appropriate loadout slot.
    
    The cosmetic must be owned by the user.
    Automatically determines the correct slot based on cosmetic type.
    """
    loadout = await cosmetics_service.equip_cosmetic(
        user_id=current_user.id,
        cosmetic_id=cosmetic_id,
    )
    
    if not loadout:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cosmetic not owned or not found",
        )
    
    return APIResponse.ok(loadout)


@router.post(
    "/me/unequip",
    response_model=APIResponse[Loadout],
)
async def unequip_cosmetic(
    request: UnequipRequest,
    current_user: CurrentUser,
    cosmetics_service: CosmeticsServiceDep,
):
    """
    Unequip a cosmetic from a slot.
    
    Clears the specified slot in the user's loadout.
    """
    loadout = await cosmetics_service.unequip_cosmetic(
        user_id=current_user.id,
        slot=request.slot,
    )
    
    if not loadout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loadout not found or slot already empty",
        )
    
    return APIResponse.ok(loadout)
