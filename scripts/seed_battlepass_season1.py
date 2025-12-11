#!/usr/bin/env python3
"""
Battle Pass Season 1 Seed Script

Creates Season 1 with 35 tiers featuring:
- 6 Skins: Frostborne Valkyrie, Plasma Ranger, Abyssal Leviathan, Void Sovereign, Solar Champion, Molten Warlord
- 6 Player Cards: Matching cards for each skin
- 8 Emotes: Abyssal Terror, Crown Flex, Cyber Glitch, Ethereal Bloom, Fire Dragon, Frost Sparkle, Lava Burst, Void Laugh

Total: 20 cosmetic rewards + 15 static rewards (coins, XP boosts) = 35 tiers

Run with: python scripts/seed_battlepass_season1.py
"""

import os
import random
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def storage_url(bucket: str, path: str) -> str:
    """Build public URL for Supabase Storage asset."""
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


# ============================================
# New Battle Pass Skins
# ============================================
# File names from your Supabase bucket (cosmetics/skins/)
# Based on screenshot: Abyssal Leviathan.jpg, Molten Warlord.jpg, Plasma Ranger.jpg, 
# Solar Champion.jpg, Void Sovereign.jpg
# Note: Frozen Valkyrie needs to be uploaded - using placeholder for now

# ============================================
# Player Cards - Full-art lobby banners
# ============================================
BATTLEPASS_PLAYERCARDS = [
    {
        "name": "Frostborne Valkyrie Card",
        "type": "playercard",
        "rarity": "rare",
        "description": "A warrior of ice and frost. Display your frozen might.",
        "image_url": storage_url("cosmetics", "playercard/FrostBorne Valkyrie Playercard.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 200,
    },
    {
        "name": "Plasma Ranger Card",
        "type": "playercard",
        "rarity": "rare",
        "description": "High-tech combat suit. Show your precision.",
        "image_url": storage_url("cosmetics", "playercard/plasmarangerplayercard.jpg"),
        "price_coins": 400,
        "is_featured": False,
        "sort_order": 201,
    },
    {
        "name": "Abyssal Leviathan Card",
        "type": "playercard",
        "rarity": "epic",
        "description": "Rise from the depths. Intimidate your opponents.",
        "image_url": storage_url("cosmetics", "playercard/Abyssal Leviathan Playercard.jpg"),
        "price_coins": 600,
        "is_featured": False,
        "sort_order": 202,
    },
    {
        "name": "Void Sovereign Card",
        "type": "playercard",
        "rarity": "epic",
        "description": "Command the darkness. Rule the void.",
        "image_url": storage_url("cosmetics", "playercard/Void soverign playercard.jpg"),
        "price_coins": 600,
        "is_featured": False,
        "sort_order": 203,
    },
    {
        "name": "Solar Champion Card",
        "type": "playercard",
        "rarity": "epic",
        "description": "Blessed by the sun. Shine in battle.",
        "image_url": storage_url("cosmetics", "playercard/solarchampion player card.jpg"),
        "price_coins": 600,
        "is_featured": False,
        "sort_order": 204,
    },
    {
        "name": "Molten Warlord Card",
        "type": "playercard",
        "rarity": "legendary",
        "description": "Forged in volcanic fire. The ultimate player card.",
        "image_url": storage_url("cosmetics", "playercard/Molten Warlord Playercard.jpg"),
        "price_coins": 1000,
        "is_featured": True,
        "sort_order": 205,
    },
]

BATTLEPASS_SKINS = [
    {
        "name": "Frostborne Valkyrie",
        "type": "skin",
        "rarity": "rare",
        "description": "A warrior of ice and frost. The default skin for all new players.",
        "image_url": storage_url("cosmetics", "skins/Frostborne Valkyrie.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Frostborne Valkyrie.jpg"),
        "price_coins": 0,  # Free starter skin
        "is_featured": False,
        "sort_order": 100,
    },
    {
        "name": "Plasma Ranger",
        "type": "skin",
        "rarity": "rare",
        "description": "High-tech combat suit with plasma weaponry. Strike with precision.",
        "image_url": storage_url("cosmetics", "skins/Plasma Ranger.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Plasma Ranger.jpg"),
        "price_coins": 800,
        "is_featured": False,
        "sort_order": 101,
    },
    {
        "name": "Abyssal Leviathan",
        "type": "skin",
        "rarity": "epic",
        "description": "Rise from the depths. A creature of the deep ocean abyss.",
        "image_url": storage_url("cosmetics", "skins/Abyssal Leviathan.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Abyssal Leviathan.jpg"),
        "price_coins": 1200,
        "is_featured": False,
        "sort_order": 102,
    },
    {
        "name": "Void Sovereign",
        "type": "skin",
        "rarity": "epic",
        "description": "Ruler of the void dimension. Command the darkness itself.",
        "image_url": storage_url("cosmetics", "skins/Void Sovereign.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Void Sovereign.jpg"),
        "price_coins": 1200,
        "is_featured": True,
        "sort_order": 103,
    },
    {
        "name": "Solar Champion",
        "type": "skin",
        "rarity": "epic",
        "description": "Blessed by the sun. A holy warrior clad in golden light.",
        "image_url": storage_url("cosmetics", "skins/Solar Champion.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Solar Champion.jpg"),
        "price_coins": 1200,
        "is_featured": False,
        "sort_order": 104,
    },
    {
        "name": "Molten Warlord",
        "type": "skin",
        "rarity": "legendary",
        "description": "Forged in volcanic fire. The ultimate Battle Pass reward.",
        "image_url": storage_url("cosmetics", "skins/Molten Warlord.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Molten Warlord.jpg"),
        "price_coins": 2000,
        "is_featured": True,
        "sort_order": 105,
    },
]

# ============================================
# Emotes - Expressive animations for players
# ============================================
# File names from Supabase bucket (cosmetics/emotes/)
# 8 emotes distributed across battle pass tiers
BATTLEPASS_EMOTES = [
    {
        "name": "Frost Sparkle",
        "type": "emote",
        "rarity": "rare",
        "description": "A dazzling display of icy crystals. Show your cool side.",
        "image_url": storage_url("cosmetics", "emotes/frost sparkle.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 300,
    },
    {
        "name": "Crown Flex",
        "type": "emote",
        "rarity": "rare",
        "description": "Celebrate your victory with royal flair.",
        "image_url": storage_url("cosmetics", "emotes/crown flex.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 301,
    },
    {
        "name": "Cyber Glitch",
        "type": "emote",
        "rarity": "rare",
        "description": "Glitch through reality with digital style.",
        "image_url": storage_url("cosmetics", "emotes/cyber glitch.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 302,
    },
    {
        "name": "Ethereal Bloom",
        "type": "emote",
        "rarity": "epic",
        "description": "Mystical flowers bloom around you in ethereal beauty.",
        "image_url": storage_url("cosmetics", "emotes/ethereal bloom.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 303,
    },
    {
        "name": "Fire Dragon",
        "type": "emote",
        "rarity": "epic",
        "description": "Summon the spirit of a fire dragon. Unleash your inner flame.",
        "image_url": storage_url("cosmetics", "emotes/fire dragon.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 304,
    },
    {
        "name": "Lava Burst",
        "type": "emote",
        "rarity": "epic",
        "description": "Erupt with volcanic power. Feel the heat.",
        "image_url": storage_url("cosmetics", "emotes/lava burst.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 305,
    },
    {
        "name": "Abyssal Terror",
        "type": "emote",
        "rarity": "epic",
        "description": "Unleash the terror of the deep. Strike fear into your opponents.",
        "image_url": storage_url("cosmetics", "emotes/abyssal terror.jpg"),
        "price_coins": 0,
        "is_featured": False,
        "sort_order": 306,
    },
    {
        "name": "Void Laugh",
        "type": "emote",
        "rarity": "legendary",
        "description": "A haunting laugh echoes from the void. The ultimate taunt.",
        "image_url": storage_url("cosmetics", "emotes/void laugh.jpg"),
        "price_coins": 0,
        "is_featured": True,
        "sort_order": 307,
    },
]


def seed_battlepass_skins():
    """Insert or update the battle pass skins in the catalog."""
    print("🎨 Seeding Battle Pass skins...")
    
    cosmetic_ids = {}
    
    for skin in BATTLEPASS_SKINS:
        # Check if skin already exists
        existing = supabase.table("cosmetics_catalog").select("id").eq("name", skin["name"]).execute()
        
        if existing.data:
            # Update existing
            result = supabase.table("cosmetics_catalog").update(skin).eq("name", skin["name"]).execute()
            cosmetic_ids[skin["name"]] = existing.data[0]["id"]
            print(f"  ✓ Updated: {skin['name']} ({skin['rarity']})")
        else:
            # Insert new
            result = supabase.table("cosmetics_catalog").insert(skin).execute()
            cosmetic_ids[skin["name"]] = result.data[0]["id"]
            print(f"  + Inserted: {skin['name']} ({skin['rarity']})")
    
    return cosmetic_ids


def seed_battlepass_playercards():
    """Insert or update the battle pass player cards in the catalog."""
    print("\n🃏 Seeding Battle Pass player cards...")
    
    cosmetic_ids = {}
    
    for card in BATTLEPASS_PLAYERCARDS:
        # Check if card already exists
        existing = supabase.table("cosmetics_catalog").select("id").eq("name", card["name"]).execute()
        
        if existing.data:
            # Update existing
            result = supabase.table("cosmetics_catalog").update(card).eq("name", card["name"]).execute()
            cosmetic_ids[card["name"]] = existing.data[0]["id"]
            print(f"  ✓ Updated: {card['name']} ({card['rarity']})")
        else:
            # Insert new
            result = supabase.table("cosmetics_catalog").insert(card).execute()
            cosmetic_ids[card["name"]] = result.data[0]["id"]
            print(f"  + Inserted: {card['name']} ({card['rarity']})")
    
    return cosmetic_ids


def seed_battlepass_emotes():
    """Insert or update the battle pass emotes in the catalog."""
    print("\n😄 Seeding Battle Pass emotes...")
    
    cosmetic_ids = {}
    
    for emote in BATTLEPASS_EMOTES:
        # Check if emote already exists
        existing = supabase.table("cosmetics_catalog").select("id").eq("name", emote["name"]).execute()
        
        if existing.data:
            # Update existing
            result = supabase.table("cosmetics_catalog").update(emote).eq("name", emote["name"]).execute()
            cosmetic_ids[emote["name"]] = existing.data[0]["id"]
            print(f"  ✓ Updated: {emote['name']} ({emote['rarity']})")
        else:
            # Insert new
            result = supabase.table("cosmetics_catalog").insert(emote).execute()
            cosmetic_ids[emote["name"]] = result.data[0]["id"]
            print(f"  + Inserted: {emote['name']} ({emote['rarity']})")
    
    return cosmetic_ids


def get_emote_tiers() -> dict:
    """
    Select 8 random tiers for emotes using a fixed seed for reproducibility.
    Avoids reserved tiers for skins and player cards.
    
    Returns:
        Dict mapping tier numbers to (emote_name, track) tuples
    """
    # Reserved tiers for skins and player cards
    skin_tiers = {1, 8, 15, 22, 29, 35}
    playercard_tiers = {2, 9, 16, 23, 30, 34}
    reserved_tiers = skin_tiers | playercard_tiers
    
    # Available tiers for emotes
    available_tiers = [t for t in range(1, 36) if t not in reserved_tiers]
    
    # Use fixed seed for reproducibility
    random.seed(42)
    selected_tiers = sorted(random.sample(available_tiers, 8))
    
    # Map emotes to selected tiers
    # Distribute between free and premium tracks
    emote_names = [e["name"] for e in BATTLEPASS_EMOTES]
    emote_tiers = {}
    
    for i, tier in enumerate(selected_tiers):
        emote_name = emote_names[i]
        # First 2 emotes on free track, rest on premium
        track = "free" if i < 2 else "premium"
        emote_tiers[tier] = (emote_name, track)
    
    return emote_tiers


def create_season():
    """Create or update Season 1."""
    print("\n🎮 Creating Battle Pass Season 1...")
    
    now = datetime.now(timezone.utc)
    season_data = {
        "season_number": 1,
        "name": "Season 1: Elemental Warriors",
        "theme": "Master the elements and claim legendary rewards",
        "start_date": now.isoformat(),
        "end_date": (now + timedelta(days=90)).isoformat(),
        "is_active": True,
        "xp_per_tier": 400,  # ~3-4 games per tier
        "max_tier": 35,  # 35 tiers in this season
    }
    
    # Check if season exists
    existing = supabase.table("seasons").select("id").eq("season_number", 1).execute()
    
    if existing.data:
        # Update existing season
        supabase.table("seasons").update(season_data).eq("season_number", 1).execute()
        season_id = existing.data[0]["id"]
        print(f"  ✓ Updated Season 1: {season_id}")
    else:
        # Create new season
        result = supabase.table("seasons").insert(season_data).execute()
        season_id = result.data[0]["id"]
        print(f"  + Created Season 1: {season_id}")
    
    return season_id


def create_tier_rewards(season_id: str, cosmetic_ids: dict, playercard_ids: dict, emote_ids: dict):
    """Create 35 tier rewards for the season with 20 cosmetics and 15 static rewards."""
    print("\n🏆 Creating 35 Tier Rewards...")
    
    # Delete existing tiers for this season
    supabase.table("battlepass_tiers").delete().eq("season_id", season_id).execute()
    print("  - Cleared existing tiers")
    
    # Skin distribution across tiers:
    # Tier 1: Frostborne Valkyrie (FREE track - auto-unlocked for all players)
    # Tier 8: Plasma Ranger (premium track)
    # Tier 15: Abyssal Leviathan (premium track)
    # Tier 22: Void Sovereign (premium track)
    # Tier 29: Solar Champion (premium track)
    # Tier 35: Molten Warlord (premium track - LEGENDARY finale)
    
    skin_tiers = {
        1: ("Frostborne Valkyrie", "free"),   # Starter skin for everyone - auto unlocks
        8: ("Plasma Ranger", "premium"),       # Early premium reward
        15: ("Abyssal Leviathan", "premium"),  # Mid-early premium reward
        22: ("Void Sovereign", "premium"),     # Mid premium reward
        29: ("Solar Champion", "premium"),     # Late premium reward
        35: ("Molten Warlord", "premium"),     # Final legendary reward
    }
    
    # Player card distribution - paired with skins at +1 tier
    # Each player card unlocks right after its matching skin
    playercard_tiers = {
        2: ("Frostborne Valkyrie Card", "free"),    # Right after Frostborne skin
        9: ("Plasma Ranger Card", "premium"),        # Right after Plasma skin
        16: ("Abyssal Leviathan Card", "premium"),   # Right after Abyssal skin
        23: ("Void Sovereign Card", "premium"),      # Right after Void skin
        30: ("Solar Champion Card", "premium"),      # Right after Solar skin (replaces XP boost)
        34: ("Molten Warlord Card", "premium"),      # Just before final skin
    }
    
    # Get emote tier distribution (uses fixed seed for reproducibility)
    emote_tiers = get_emote_tiers()
    
    # Merge all cosmetic IDs
    all_cosmetic_ids = {**cosmetic_ids, **playercard_ids, **emote_ids}
    
    tiers = []
    for tier in range(1, 36):  # 35 tiers
        free_reward = None
        premium_reward = None
        
        # Check if this tier has a skin reward
        if tier in skin_tiers:
            skin_name, track = skin_tiers[tier]
            skin_id = all_cosmetic_ids.get(skin_name)
            if skin_id:
                reward = {"type": "cosmetic", "value": skin_id}
                if track == "free":
                    free_reward = reward
                else:
                    premium_reward = reward
        
        # Check if this tier has a player card reward
        elif tier in playercard_tiers:
            card_name, track = playercard_tiers[tier]
            card_id = all_cosmetic_ids.get(card_name)
            if card_id:
                reward = {"type": "cosmetic", "value": card_id}
                if track == "free":
                    free_reward = reward
                else:
                    premium_reward = reward
        
        # Check if this tier has an emote reward
        elif tier in emote_tiers:
            emote_name, track = emote_tiers[tier]
            emote_id = all_cosmetic_ids.get(emote_name)
            if emote_id:
                reward = {"type": "cosmetic", "value": emote_id}
                if track == "free":
                    free_reward = reward
                else:
                    premium_reward = reward
        
        # Fill in coin rewards for remaining tiers (static rewards)
        else:
            # Free track: coins every 5 tiers
            if tier % 5 == 0:
                free_reward = {"type": "coins", "value": tier * 10}
            elif tier % 3 == 0:
                free_reward = {"type": "coins", "value": tier * 5}
            
            # Premium track: better coin rewards
            if tier % 5 == 0:
                premium_reward = {"type": "coins", "value": tier * 25}
            elif tier % 2 == 0:
                premium_reward = {"type": "coins", "value": tier * 15}
        
        # XP boosts at certain tiers (only if not already assigned)
        if tier == 10 and premium_reward is None:
            premium_reward = {"type": "xp_boost", "value": "2x for 3 matches"}
        elif tier == 20 and premium_reward is None:
            premium_reward = {"type": "xp_boost", "value": "2x for 5 matches"}
        
        tiers.append({
            "season_id": season_id,
            "tier_number": tier,
            "free_reward": free_reward,
            "premium_reward": premium_reward,
        })
    
    # Insert all tiers
    supabase.table("battlepass_tiers").insert(tiers).execute()
    
    # Print tier summary
    print("\n  📋 Tier Reward Summary:")
    cosmetic_count = 0
    static_count = 0
    
    for tier in tiers:
        tier_num = tier["tier_number"]
        free = tier["free_reward"]
        premium = tier["premium_reward"]
        
        free_str = "—"
        premium_str = "—"
        tier_has_cosmetic = False
        
        if free:
            if free["type"] == "cosmetic":
                # Find cosmetic name
                for name, cid in all_cosmetic_ids.items():
                    if cid == free["value"]:
                        # Determine icon based on cosmetic type
                        if name in emote_ids:
                            free_str = f"😄 {name}"
                        elif name in playercard_ids:
                            free_str = f"🃏 {name}"
                        else:
                            free_str = f"🎭 {name}"
                        tier_has_cosmetic = True
                        break
            else:
                free_str = f"💰 {free['value']}"
        
        if premium:
            if premium["type"] == "cosmetic":
                for name, cid in all_cosmetic_ids.items():
                    if cid == premium["value"]:
                        # Determine icon based on cosmetic type
                        if name in emote_ids:
                            premium_str = f"😄 {name}"
                        elif name in playercard_ids:
                            premium_str = f"🃏 {name}"
                        else:
                            premium_str = f"🎭 {name}"
                        tier_has_cosmetic = True
                        break
            elif premium["type"] == "xp_boost":
                premium_str = f"⚡ {premium['value']}"
            else:
                premium_str = f"💰 {premium['value']}"
        
        if tier_has_cosmetic:
            cosmetic_count += 1
        elif free or premium:
            static_count += 1
        
        # Only print tiers with rewards
        if free_str != "—" or premium_str != "—":
            print(f"    Tier {tier_num:2d}: Free: {free_str:30s} | Premium: {premium_str}")
    
    print(f"\n  ✓ Created {len(tiers)} tier rewards")
    print(f"  ✓ Cosmetic rewards: {cosmetic_count} (6 skins + 6 playercards + 8 emotes)")
    print(f"  ✓ Static rewards: {static_count} (coins, XP boosts)")
    
    # Print emote tier assignments
    print("\n  😄 Emote Distribution:")
    for tier_num, (emote_name, track) in sorted(emote_tiers.items()):
        track_label = "FREE" if track == "free" else "Premium"
        print(f"    Tier {tier_num:2d}: {emote_name} ({track_label})")


def main():
    print("=" * 60)
    print("Battle Pass Season 1 Seed Script")
    print("=" * 60)
    print(f"Supabase URL: {SUPABASE_URL}")
    print()
    
    # Step 1: Seed the skins
    cosmetic_ids = seed_battlepass_skins()
    
    # Step 2: Seed the player cards
    playercard_ids = seed_battlepass_playercards()
    
    # Step 3: Seed the emotes
    emote_ids = seed_battlepass_emotes()
    
    # Step 4: Create the season
    season_id = create_season()
    
    # Step 5: Create tier rewards
    create_tier_rewards(season_id, cosmetic_ids, playercard_ids, emote_ids)
    
    # Get emote tiers for summary
    emote_tiers = get_emote_tiers()
    
    print("\n" + "=" * 60)
    print("🎉 Battle Pass Season 1 Setup Complete!")
    print()
    print("Skin Distribution (6 skins):")
    print("  • Tier 1:  Frostborne Valkyrie (FREE)")
    print("  • Tier 8:  Plasma Ranger (Premium)")
    print("  • Tier 15: Abyssal Leviathan (Premium)")
    print("  • Tier 22: Void Sovereign (Premium)")
    print("  • Tier 29: Solar Champion (Premium)")
    print("  • Tier 35: Molten Warlord (Premium - LEGENDARY)")
    print()
    print("Player Card Distribution (6 cards):")
    print("  • Tier 2:  Frostborne Valkyrie Card (FREE)")
    print("  • Tier 9:  Plasma Ranger Card (Premium)")
    print("  • Tier 16: Abyssal Leviathan Card (Premium)")
    print("  • Tier 23: Void Sovereign Card (Premium)")
    print("  • Tier 30: Solar Champion Card (Premium)")
    print("  • Tier 34: Molten Warlord Card (Premium)")
    print()
    print("Emote Distribution (8 emotes):")
    for tier_num, (emote_name, track) in sorted(emote_tiers.items()):
        track_label = "FREE" if track == "free" else "Premium"
        print(f"  • Tier {tier_num}: {emote_name} ({track_label})")
    print()
    print("Summary:")
    print("  • Total Cosmetics: 20 (6 skins + 6 playercards + 8 emotes)")
    print("  • Static Rewards: 15 (coins, XP boosts)")
    print("  • Total Tiers: 35")
    print("  • XP per Tier: 400 (~3-4 games per tier)")
    print("  • Season Duration: 90 days")
    print("=" * 60)


if __name__ == "__main__":
    main()
