-- Add must_change_password flag to users table
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for admin queries
CREATE INDEX users_role_idx ON users(role);

COMMENT ON COLUMN users.must_change_password IS 'Force user to change password on next login';
