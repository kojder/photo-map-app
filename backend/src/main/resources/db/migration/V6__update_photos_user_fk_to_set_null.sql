-- Change photos.user_id FK constraint from CASCADE DELETE to SET NULL
-- Reason: When user is deactivated, preserve their photos as orphaned (user_id = NULL)
-- This allows admin to manage orphaned photos separately

ALTER TABLE photos DROP CONSTRAINT photos_user_fk;

ALTER TABLE photos
ADD CONSTRAINT photos_user_fk
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
