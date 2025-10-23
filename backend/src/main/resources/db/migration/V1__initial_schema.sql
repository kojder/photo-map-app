-- Photo Map MVP - Initial Database Schema
-- PostgreSQL 15

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN'))
);

CREATE UNIQUE INDEX users_email_idx ON users(email);

-- ============================================================================
-- TABLE: photos
-- ============================================================================
CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    thumbnail_filename VARCHAR(500),
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    taken_at TIMESTAMP,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT photos_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT photos_gps_latitude_check CHECK (gps_latitude BETWEEN -90 AND 90),
    CONSTRAINT photos_gps_longitude_check CHECK (gps_longitude BETWEEN -180 AND 180)
);

CREATE INDEX photos_user_id_idx ON photos(user_id);
CREATE INDEX photos_gps_idx ON photos(gps_latitude, gps_longitude);
CREATE INDEX photos_taken_at_idx ON photos(taken_at);
CREATE INDEX photos_uploaded_at_idx ON photos(uploaded_at);

-- ============================================================================
-- TABLE: ratings
-- ============================================================================
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    photo_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ratings_photo_fk FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    CONSTRAINT ratings_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ratings_rating_check CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT ratings_photo_user_unique UNIQUE (photo_id, user_id)
);

CREATE INDEX ratings_photo_id_idx ON ratings(photo_id);
CREATE INDEX ratings_user_id_idx ON ratings(user_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at column
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON photos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
