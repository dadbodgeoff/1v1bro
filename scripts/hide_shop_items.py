#!/usr/bin/env python3
"""
Hide specific items from the shop.

Sets shop_available = false for specified cosmetics so they don't appear in the shop.
The items remain in the database and in any user inventories.

Usage:
    python scripts/hide_shop_items.py
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv("backend/.env")

# Items to hide from shop
ITEMS_TO_HIDE = [
    "Frozen Valkyrie",
    "Tactical Banana",
]

def get_supabase_client() -> Client:
    """Create Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    
    return create_client(url, key)

def hide_items_from_shop():
    """Hide specified items from the shop."""
    print("🛒 Hiding items from shop...")
    print(f"   Items to hide: {', '.join(ITEMS_TO_HIDE)}\n")
    
    supabase = get_supabase_client()
    
    for item_name in ITEMS_TO_HIDE:
        # Find the item
        result = supabase.table("cosmetics_catalog").select("id, name, shop_available").eq("name", item_name).execute()
        
        if not result.data:
            print(f"   ⚠️  Not found: {item_name}")
            continue
        
        item = result.data[0]
        
        if item.get("shop_available") == False:
            print(f"   ✓ Already hidden: {item_name}")
            continue
        
        # Update shop_available to false
        update_result = supabase.table("cosmetics_catalog").update({
            "shop_available": False
        }).eq("id", item["id"]).execute()
        
        if update_result.data:
            print(f"   ✓ Hidden from shop: {item_name}")
        else:
            print(f"   ✗ Failed to hide: {item_name}")
    
    print("\n✅ Done!")

if __name__ == "__main__":
    hide_items_from_shop()
