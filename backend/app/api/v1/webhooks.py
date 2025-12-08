"""
Webhook API endpoints for external service callbacks.
Requirements: 3.1, 7.3
"""

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, status, Request, Header, Depends
from stripe import SignatureVerificationError

from app.api.deps import get_supabase_client
from app.core.config import get_settings
from app.services.stripe_service import StripeService
from app.services.balance_service import BalanceService
from app.services.coin_webhook_handler import CoinWebhookHandler


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


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


async def get_balance_service() -> BalanceService:
    """Get balance service instance."""
    client = get_supabase_client()
    return BalanceService(client)


async def get_webhook_handler(
    stripe_service: Annotated[StripeService, Depends(get_stripe_service)],
    balance_service: Annotated[BalanceService, Depends(get_balance_service)],
) -> CoinWebhookHandler:
    """Get webhook handler instance."""
    return CoinWebhookHandler(
        stripe_service=stripe_service,
        balance_service=balance_service,
    )


WebhookHandlerDep = Annotated[CoinWebhookHandler, Depends(get_webhook_handler)]
StripeServiceDep = Annotated[StripeService, Depends(get_stripe_service)]


# ============================================
# Stripe Webhook Endpoint
# ============================================

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_service: StripeServiceDep,
    webhook_handler: WebhookHandlerDep,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
):
    """
    Handle Stripe webhook events.
    
    Verifies signature and routes to appropriate handler.
    Requirements: 3.1, 7.3
    """
    # Get raw body for signature verification
    payload = await request.body()
    
    # Verify signature
    if not stripe_signature:
        logger.warning("Stripe webhook received without signature")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header",
        )
    
    try:
        event = stripe_service.verify_webhook_signature(
            payload=payload,
            signature=stripe_signature,
        )
    except SignatureVerificationError as e:
        logger.warning(f"Stripe webhook signature verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook processing error",
        )
    
    # Handle the event
    logger.info(f"Processing Stripe webhook: {event.type}")
    
    result = await webhook_handler.handle_event(event)
    
    if not result.success:
        logger.error(f"Webhook handler failed: {result.message}")
        # Still return 200 to acknowledge receipt
        # Stripe will retry on non-2xx responses
    
    return {"received": True, "message": result.message}
