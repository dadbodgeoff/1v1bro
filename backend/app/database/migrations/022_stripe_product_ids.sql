-- 022_stripe_product_ids.sql
-- Update coin packages with Stripe product IDs
-- These are live Stripe products created in the dashboard

-- Add stripe_product_id column if it doesn't exist
ALTER TABLE coin_packages 
ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(100);

-- Update packages with Stripe product IDs
UPDATE coin_packages SET 
    stripe_product_id = 'prod_TZNjx5QBvuQZ9j',
    updated_at = NOW()
WHERE id = 'pkg_starter';

UPDATE coin_packages SET 
    stripe_product_id = 'prod_TZNkFCXAIgIZsJ',
    updated_at = NOW()
WHERE id = 'pkg_basic';

UPDATE coin_packages SET 
    stripe_product_id = 'prod_TZNlfY4iAz49Io',
    updated_at = NOW()
WHERE id = 'pkg_popular';

UPDATE coin_packages SET 
    stripe_product_id = 'prod_TZNlX6xICBzIxE',
    updated_at = NOW()
WHERE id = 'pkg_value';

UPDATE coin_packages SET 
    stripe_product_id = 'prod_TZNmTLXf6mUj0t',
    updated_at = NOW()
WHERE id = 'pkg_premium';

-- Create index for product ID lookups
CREATE INDEX IF NOT EXISTS idx_coin_packages_stripe_product ON coin_packages(stripe_product_id);

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- ALTER TABLE coin_packages DROP COLUMN IF EXISTS stripe_product_id;
