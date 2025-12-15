/*
  # Add Password Hash to Admin Users

  1. Changes
    - Add `password_hash` column to `admin_users` table
    - Column stores SHA-256 hashed passwords for admin authentication
    - Required for custom admin authentication system

  2. Purpose
    - Enable password-based authentication for admin users
    - Store hashed passwords securely (never plain text)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN password_hash text NOT NULL DEFAULT '';
  END IF;
END $$;