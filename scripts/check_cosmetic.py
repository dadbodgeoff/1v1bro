#!/usr/bin/env python3
"""Check a specific cosmetic."""

from supabase import create_client

client = create_client(
    'https://ikbshpdvvkydbpirbahl.supabase.co/',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnNocGR2dmt5ZGJwaXJiYWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzc5MiwiZXhwIjoyMDgwMjg5NzkyfQ.mfEmm6fURTaP4iVZA1gfxkY5f9R0LdcORv7GCox05-k'
)

cosmetic_id = '788f4c02-0936-4f2a-81fb-cd32429a7c90'

print(f'=== COSMETIC {cosmetic_id} ===')
cosmetic = client.table('cosmetics_catalog').select('*').eq('id', cosmetic_id).execute()
for c in cosmetic.data:
    for k, v in c.items():
        print(f'  {k}: {v}')
