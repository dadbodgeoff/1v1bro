#!/usr/bin/env python3
"""Quick script to check database state for a user."""

from supabase import create_client

client = create_client(
    'https://ikbshpdvvkydbpirbahl.supabase.co/',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnNocGR2dmt5ZGJwaXJiYWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzc5MiwiZXhwIjoyMDgwMjg5NzkyfQ.mfEmm6fURTaP4iVZA1gfxkY5f9R0LdcORv7GCox05-k'
)

user_id = 'af86e86f-a09a-4ed6-a04e-4ab3b22e4c08'

# Check inventory
print('=== INVENTORY ===')
inv = client.table('inventory').select('*').eq('user_id', user_id).execute()
print(f'Items: {len(inv.data)}')
for item in inv.data:
    print(f'  - {item}')

# Check loadout
print('\n=== LOADOUT ===')
loadout = client.table('loadouts').select('*').eq('user_id', user_id).execute()
print(f'Loadouts: {len(loadout.data)}')
for l in loadout.data:
    print(f'  - {l}')

# Check cosmetics catalog (first 5 skins)
print('\n=== COSMETICS CATALOG (first 5 skins) ===')
cosmetics = client.table('cosmetics_catalog').select('id, name, type').eq('type', 'skin').limit(5).execute()
for c in cosmetics.data:
    print(f'  - {c}')
