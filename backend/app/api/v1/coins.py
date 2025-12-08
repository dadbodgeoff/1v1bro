"""
Coin purchase API endpoints.
Requirements: 1.4, 2.1, 3.2, 4.1, 5.1
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, status, Query, Depends

from app.api.deps import CurrentUser, BalanceServiceDep
from app.database.supabase_client import get_supabase_service_client
from app.core.responses import APIResponse
from app.core.config import get_settings
from app.services.balance_service import BalanceService
from app.services.stripe_service import StripeService
from app.schemas.coin import (
    CoinPackage,
    CoinPackageList,
    BalanceResponse,
    TransactionListResponse,
    CheckoutRequest,
    CheckoutResponse,
    PurchaseVerifyResponse,
)


router = APIRouter(prefix="/coins", tags=["Coins"])


# ============================================
# Dependencies
# ============================================

async def get_stripe_service() -> StripeService:
    """Get stripe service instance."""
    settings = get_settings()
    return StripeService(
        secret_key=settings.STRIPE_SECRET_KEY,
        webhook_secret=settings.STRIPE_WEBHOOK_SECRET,
    )


StripeServiceDep = Annotated[StripeService, Depends(get_stripe_service)]


# ============================================
# Package Endpoints
# ============================================

@router.get(
    "/packages",
    response_model=APIResponse[CoinPackageList],
)
async def get_packages(
    balance_service: BalanceServiceDep,
):
    """
    Get all available coin packages.
    
    Returns list of active packages with pricing and bonus info.
    Requirements: 1.4
    """
    packages = await balance_service.get_packages()
    return APIResponse.ok(CoinPackageList(packages=packages))


# ============================================
# Balance Endpoints
# ============================================

@router.get(
    "/balance",
    response_model=APIResponse[BalanceResponse],
)
async def get_balance(
    current_user: CurrentUser,
    balance_service: BalanceServiceDep,
):
    """
    Get current user's coin balance.
    
    Requirements: 5.1
    """
    coins = await balance_service.get_balance(current_user.id)
    return APIResponse.ok(BalanceResponse(coins=coins))


@router.get(
    "/transactions",
    response_model=APIResponse[TransactionListResponse],
)
async def get_transactions(
    current_user: CurrentUser,
    balance_service: BalanceServiceDep,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Get user's transaction history.
    
    Returns paginated list of coin transactions.
    Requirements: 4.1
    """
    transactions = await balance_service.get_transaction_history(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )
    return APIResponse.ok(transactions)


# ============================================
# Checkout Endpoints
# ============================================

@router.post(
    "/checkout",
    response_model=APIResponse[CheckoutResponse],
)
async def create_checkout(
    request: CheckoutRequest,
    current_user: CurrentUser,
    balance_service: BalanceServiceDep,
    stripe_service: StripeServiceDep,
):
    """
    Create a Stripe Checkout Session for coin purchase.
    
    Returns session ID and checkout URL to redirect user.
    Requirements: 2.1
    """
    # Get package
    package = await balance_service.get_package(request.package_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found",
        )
    
    if not package.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Package is not available",
        )
    
    # Build URLs
    settings = get_settings()
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    success_url = f"{base_url}/coins/success"
    cancel_url = f"{base_url}/coins"
    
    # Create checkout session
    try:
        checkout = await stripe_service.create_checkout_session(
            user_id=current_user.id,
            package=package,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return APIResponse.ok(checkout)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}",
        )


@router.get(
    "/verify",
    response_model=APIResponse[PurchaseVerifyResponse],
)
async def verify_purchase(
    session_id: str,
    current_user: CurrentUser,
    balance_service: BalanceServiceDep,
    stripe_service: StripeServiceDep,
):
    """
    Verify a purchase completion after Stripe redirect.
    
    Checks if the session was paid and coins were credited.
    Requirements: 3.2
    """
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="session_id is required",
        )
    
    # Get session from Stripe
    session = await stripe_service.get_session(session_id)
    if not session:
        return APIResponse.ok(PurchaseVerifyResponse(
            success=False,
            message="Session not found",
        ))
    
    # Verify session belongs to this user
    metadata = session.metadata or {}
    if metadata.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session does not belong to this user",
        )
    
    # Check payment status
    if not stripe_service.is_session_paid(session):
        return APIResponse.ok(PurchaseVerifyResponse(
            success=False,
            message="Payment not completed",
        ))
    
    # Check if already fulfilled
    already_fulfilled = await balance_service.check_fulfillment(session_id)
    
    # Get coin amount from metadata
    coin_amount = int(metadata.get("coin_amount", 0))
    
    # Get current balance
    new_balance = await balance_service.get_balance(current_user.id)
    
    return APIResponse.ok(PurchaseVerifyResponse(
        success=True,
        coins_credited=coin_amount,
        new_balance=new_balance,
        message="Purchase verified",
        already_fulfilled=already_fulfilled,
    ))
