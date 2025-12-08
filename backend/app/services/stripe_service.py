"""
Stripe service for payment processing.
Requirements: 2.1, 2.5, 3.1, 7.3
"""

import time
from typing import Optional

import stripe
from stripe import SignatureVerificationError

from app.schemas.coin import CoinPackage, CheckoutResponse


class StripeService:
    """Service for Stripe payment operations."""

    def __init__(self, secret_key: str, webhook_secret: str):
        """
        Initialize Stripe service.
        
        Args:
            secret_key: Stripe secret API key
            webhook_secret: Stripe webhook signing secret
        """
        self.secret_key = secret_key
        self.webhook_secret = webhook_secret
        stripe.api_key = secret_key

    def _generate_idempotency_key(self, user_id: str, package_id: str) -> str:
        """
        Generate unique idempotency key for checkout session.
        
        Requirements: 2.5
        """
        timestamp = int(time.time() * 1000)  # Milliseconds for uniqueness
        return f"{user_id}_{package_id}_{timestamp}"

    async def create_checkout_session(
        self,
        user_id: str,
        package: CoinPackage,
        success_url: str,
        cancel_url: str,
    ) -> CheckoutResponse:
        """
        Create a Stripe Checkout Session for coin purchase.
        
        Requirements: 2.1, 2.5
        
        Args:
            user_id: The purchasing user's ID
            package: The coin package being purchased
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled
            
        Returns:
            CheckoutResponse with session_id and checkout_url
        """
        # Build product description
        description = package.name
        if package.bonus_percent > 0:
            description = f"{package.name} - {package.bonus_percent}% bonus"
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"{package.total_coins} Coins",
                        "description": description,
                    },
                    "unit_amount": package.price_cents,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=cancel_url,
            metadata={
                "user_id": user_id,
                "package_id": package.id,
                "coin_amount": str(package.total_coins),
            },
            idempotency_key=self._generate_idempotency_key(user_id, package.id),
        )
        
        return CheckoutResponse(
            session_id=session.id,
            checkout_url=session.url,
        )

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str,
    ) -> stripe.Event:
        """
        Verify and parse a Stripe webhook event.
        
        Requirements: 3.1, 7.3
        
        Args:
            payload: Raw request body bytes
            signature: Stripe-Signature header value
            
        Returns:
            Parsed Stripe Event
            
        Raises:
            SignatureVerificationError: If signature is invalid
        """
        return stripe.Webhook.construct_event(
            payload,
            signature,
            self.webhook_secret,
        )

    async def get_session(self, session_id: str) -> Optional[stripe.checkout.Session]:
        """
        Retrieve a checkout session by ID.
        
        Args:
            session_id: Stripe Checkout Session ID
            
        Returns:
            Checkout Session or None if not found
        """
        try:
            return stripe.checkout.Session.retrieve(session_id)
        except stripe.error.InvalidRequestError:
            return None

    async def get_session_with_payment_intent(
        self,
        session_id: str,
    ) -> Optional[stripe.checkout.Session]:
        """
        Retrieve a checkout session with expanded payment intent.
        
        Args:
            session_id: Stripe Checkout Session ID
            
        Returns:
            Checkout Session with payment_intent expanded
        """
        try:
            return stripe.checkout.Session.retrieve(
                session_id,
                expand=["payment_intent"],
            )
        except stripe.error.InvalidRequestError:
            return None

    def is_session_paid(self, session: stripe.checkout.Session) -> bool:
        """Check if a checkout session has been paid."""
        return session.payment_status == "paid"
