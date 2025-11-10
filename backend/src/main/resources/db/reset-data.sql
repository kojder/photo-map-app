-- ============================================================================
-- Photo Map MVP - Reset Data Script
-- ============================================================================
-- ⚠️  WARNING: This script DELETES ALL DATA from the database!
-- Use ONLY for:
--   - Development environment reset
--   - Initial production setup
--   - Testing scenarios
--
-- What this script does:
--   1. Truncates all tables (users, photos, ratings)
--   2. Resets app_settings to default values
--   3. Admin user will be re-created by backend on restart (AdminInitializer)
--
-- Usage:
--   psql -h localhost -U photomap_user -d photomap -f reset-data.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Truncate all tables (CASCADE removes dependent data)
-- ============================================================================
-- Order: Start with dependent tables to avoid FK constraint issues
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE photos CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================================================
-- Step 2: Reset app_settings to default values
-- ============================================================================
TRUNCATE TABLE app_settings CASCADE;

-- Re-insert default settings
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('admin_contact_email', 'admin@photomap.local');

-- ============================================================================
-- Step 3: Admin user will be created by backend on restart
-- ============================================================================
-- AdminInitializer (CommandLineRunner) will:
--   - Read admin.email and admin.password from application.properties (.env)
--   - Create admin user if no ADMIN role exists
--   - Hash password with BCrypt
--   - Set mustChangePassword=true

COMMIT;

-- ============================================================================
-- Post-reset verification queries (optional)
-- ============================================================================
-- Check table counts:
-- SELECT 'users' as table_name, COUNT(*) as count FROM users
-- UNION ALL
-- SELECT 'photos', COUNT(*) FROM photos
-- UNION ALL
-- SELECT 'ratings', COUNT(*) FROM ratings
-- UNION ALL
-- SELECT 'app_settings', COUNT(*) FROM app_settings;
