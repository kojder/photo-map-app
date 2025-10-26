-- Add user permissions columns
ALTER TABLE users ADD COLUMN can_upload BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN can_rate BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Set default permissions for existing users
UPDATE users SET can_upload = TRUE, can_rate = TRUE, is_active = TRUE WHERE can_upload IS NULL;
