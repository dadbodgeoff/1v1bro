-- 027_fix_player_battlepass_trigger.sql
-- Fix: The player_battlepass table uses 'last_updated' column but the trigger
-- was referencing 'updated_at' which doesn't exist, causing all updates to fail.
-- Error: record "new" has no field "updated_at"

-- Create a proper function for last_updated column
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the broken trigger
DROP TRIGGER IF EXISTS update_player_battlepass_updated_at ON player_battlepass;

-- Create the correct trigger using the right function
CREATE TRIGGER update_player_battlepass_last_updated
    BEFORE UPDATE ON player_battlepass
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

-- Grant permissions for service role
GRANT EXECUTE ON FUNCTION update_last_updated_column TO service_role;
GRANT EXECUTE ON FUNCTION update_last_updated_column TO authenticated;
