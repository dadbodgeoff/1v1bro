-- 016_coin_purchase_system.sql
-- Coin purchase system: balances, packages, and transactions
-- Requirements: 3.5, 4.1, 5.3, 5.5

-- ============================================
-- User Coin Balances
-- ============================================
CREATE TABLE IF NOT EXISTS user_balances (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
    lifetime_purchased INTEGER NOT NULL DEFAULT 0,
    lifetime_spent INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Users can view their own balance
CREATE POLICY "Users can view own balance" ON user_balances
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Coin Packages (admin-configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS coin_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents > 0),
    base_coins INTEGER NOT NULL CHECK (base_coins > 0),
    bonus_coins INTEGER NOT NULL DEFAULT 0 CHECK (bonus_coins >= 0),
    total_coins INTEGER NOT NULL CHECK (total_coins > 0),
    bonus_percent INTEGER NOT NULL DEFAULT 0 CHECK (bonus_percent >= 0),
    badge VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    stripe_price_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active packages
CREATE POLICY "Authenticated users can view packages" ON coin_packages
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- ============================================
-- Coin Transactions (purchase history)
-- ============================================
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    source VARCHAR(50) NOT NULL,
    package_id VARCHAR(50) REFERENCES coin_packages(id),
    stripe_session_id VARCHAR(100) UNIQUE,
    stripe_payment_intent VARCHAR(100),
    amount_cents INTEGER,
    balance_after INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Indexes for Query Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_balances_user ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_stripe ON coin_transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_packages_active ON coin_packages(is_active, sort_order);

-- ============================================
-- Trigger to update user_balances.updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_user_balances_updated_at ON user_balances;
CREATE TRIGGER update_user_balances_updated_at
    BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Atomic Credit Function
-- Credits coins to user balance atomically
-- Returns new balance
-- ============================================
CREATE OR REPLACE FUNCTION credit_coins(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_id VARCHAR,
    p_source VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Upsert balance (create if not exists, increment if exists)
    INSERT INTO user_balances (user_id, coins, lifetime_purchased, updated_at)
    VALUES (p_user_id, p_amount, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        coins = user_balances.coins + p_amount,
        lifetime_purchased = user_balances.lifetime_purchased + p_amount,
        updated_at = NOW()
    RETURNING coins INTO v_new_balance;
    
    -- Record transaction (only if transaction_id provided and not duplicate)
    IF p_transaction_id IS NOT NULL THEN
        INSERT INTO coin_transactions (user_id, type, amount, source, balance_after, stripe_session_id)
        VALUES (p_user_id, 'credit', p_amount, p_source, v_new_balance, p_transaction_id)
        ON CONFLICT (stripe_session_id) DO NOTHING;
    END IF;
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Atomic Debit Function
-- Debits coins from user balance atomically
-- Returns new balance or NULL if insufficient funds
-- ============================================
CREATE OR REPLACE FUNCTION debit_coins(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_id VARCHAR,
    p_source VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Get current balance with row lock to prevent race conditions
    SELECT coins INTO v_current_balance
    FROM user_balances
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user has balance record and sufficient funds
    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN NULL; -- Insufficient funds
    END IF;
    
    v_new_balance := v_current_balance - p_amount;
    
    -- Update balance
    UPDATE user_balances SET
        coins = v_new_balance,
        lifetime_spent = lifetime_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO coin_transactions (user_id, type, amount, source, balance_after)
    VALUES (p_user_id, 'debit', p_amount, p_source, v_new_balance);
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Seed Initial Coin Packages
-- ============================================
INSERT INTO coin_packages (id, name, price_cents, base_coins, bonus_coins, total_coins, bonus_percent, badge, sort_order, is_active)
VALUES 
    ('pkg_starter', 'Starter', 99, 100, 0, 100, 0, NULL, 1, true),
    ('pkg_basic', 'Basic', 299, 300, 50, 350, 17, NULL, 2, true),
    ('pkg_popular', 'Popular', 499, 500, 150, 650, 30, 'Most Popular', 3, true),
    ('pkg_value', 'Value', 999, 1000, 500, 1500, 50, 'Best Value', 4, true),
    ('pkg_premium', 'Premium', 1999, 2000, 1500, 3500, 75, NULL, 5, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents,
    base_coins = EXCLUDED.base_coins,
    bonus_coins = EXCLUDED.bonus_coins,
    total_coins = EXCLUDED.total_coins,
    bonus_percent = EXCLUDED.bonus_percent,
    badge = EXCLUDED.badge,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- DROP FUNCTION IF EXISTS debit_coins(UUID, INTEGER, VARCHAR, VARCHAR);
-- DROP FUNCTION IF EXISTS credit_coins(UUID, INTEGER, VARCHAR, VARCHAR);
-- DROP TABLE IF EXISTS coin_transactions;
-- DROP TABLE IF EXISTS coin_packages;
-- DROP TABLE IF EXISTS user_balances;
