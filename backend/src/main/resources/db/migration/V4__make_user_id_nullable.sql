-- Make user_id nullable in photos table to support batch uploads without owner
ALTER TABLE photos ALTER COLUMN user_id DROP NOT NULL;
