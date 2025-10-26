-- Add can_view_photos column to users table
-- Existing users get TRUE (already have access)
-- New users will get FALSE via AuthService.register()
ALTER TABLE users ADD COLUMN can_view_photos BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing users to have view permissions
UPDATE users SET can_view_photos = TRUE WHERE can_view_photos IS NULL;

-- Create app_settings table for global configuration
CREATE TABLE app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on setting_key for faster lookups
CREATE INDEX idx_app_settings_key ON app_settings(setting_key);

-- Insert default admin contact email
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('admin_contact_email', 'admin@photomap.local');
