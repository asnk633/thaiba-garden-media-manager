-- migrations/2025xxxx_add_avatar_and_filepath.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatarUrl TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS storagePath TEXT;
