#!/usr/bin/env python3
"""
Cosmetics & Battle Pass Seed Script - Enterprise Edition

Seeds the database with:
- Character skins with sprite sheet references
- Matching banners for skin collections
- Battle pass seasons and tier rewards
- Bundle definitions for discounted sets

Run with: python scripts/seed_cosmetics_battlepass.py

Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
"""

import os
import sys
from datetime import datetime, timedelta
from typing import TypedDict, Optional
from enum import Enum

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================
# Type Definitions
# ============================================
class Rarity(str, Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class CosmeticType(str, Enum):
    SKIN = "skin"
    BANNER = "banner"
    EMOTE = "emote"
    NAMEPLATE = "nameplate"
    EFFECT = "effect"
    TRAIL = "trail"


class CosmeticItem(TypedDict, total=False):
    name: str
    type: str
    rarity: str
    description: str
    image_url: str
    price_coins: int
    skin_id: Optional[str]
    collection_id: Optional[str]
    is_limited: bool
    event: Optional[str]


# ============================================
# Asset Path Configuration
# ============================================
ASSET_BASE = "/assets/game"

def sprite_path(filename: str) -> str:
    return f"{ASSET_BASE}/sprites/{filename}"

def banner_path(filename: str) -> str:
    return f"{ASSET_BASE}/banners/{filename}"


# ============================================
# Collection Definitions
# ============================================
COLLECTIONS = {
    "soldier": {
        "id": "soldier-collection",
        "name": "Soldier Collection",
        "description": "Sci-fi soldier gear with purple accents",
    },
    "banana": {
        "id": "banana-collection",
        "name": "Tactical Banana Collection",
        "description": "When fruit goes tactical",
    },
    "knight": {
        "id": "knight-collection",
        "name": "Golden Knight Collection",
        "description": "Royal armor fit for champions",
    },
    "ninja": {
        "id": "ninja-collection",
        "name": "Cyber Ninja Collection",
        "description": "Stealth meets technology",
    },
    "wraith": {
        "id": "wraith-collection",
        "name": "Matrix Wraith Collection",
        "description": "Digital phantoms from the void",
    },
}
