#!/usr/bin/env python3
"""
Script to add coins to a user by email address.
Usage: python scripts/add_coins_to_user.py <email> <amount>
"""

import sys
import os
import uuid

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv

# Load backend .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from supabase import create_client


def add_coins_to_user(email: str, amount: int):
    """Add coins to a user by their email address."""
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_service_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env")
        sys.exit(1)
    
    # Create service client (bypasses RLS)
    client = create_client(supabase_url, supabase_service_key)
    
    # Look up user by email using Supabase Auth admin API
    print(f"Looking up user: {email}")
    
    try:
        # Get user from auth.users by email
        users_response = client.auth.admin.list_users()
        user = None
        for u in users_response:
            if hasattr(u, 'email') and u.email == email:
                user = u
                break
        
        if not user:
            print(f"Error: No user found with email {email}")
            sys.exit(1)
        
        user_id = user.id
        print(f"Found user ID: {user_id}")
        
        # Check current balance
        balance_result = client.table("user_balances").select("*").eq("user_id", user_id).execute()
        current_balance = balance_result.data[0]["coins"] if balance_result.data else 0
        print(f"Current balance: {current_balance} coins")
        
        # Credit coins using the RPC function
        transaction_id = f"admin_grant_{uuid.uuid4().hex[:12]}"
        
        result = client.rpc(
            "credit_coins",
            {
                "p_user_id": user_id,
                "p_amount": amount,
                "p_transaction_id": transaction_id,
                "p_source": "admin_grant",
            }
        ).execute()
        
        new_balance = result.data
        print(f"Successfully added {amount} coins!")
        print(f"New balance: {new_balance} coins")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scripts/add_coins_to_user.py <email> <amount>")
        print("Example: python scripts/add_coins_to_user.py user@example.com 10000")
        sys.exit(1)
    
    email = sys.argv[1]
    try:
        amount = int(sys.argv[2])
    except ValueError:
        print("Error: Amount must be a number")
        sys.exit(1)
    
    if amount <= 0:
        print("Error: Amount must be positive")
        sys.exit(1)
    
    add_coins_to_user(email, amount)
