/*
  # Create Standalone Admin Authentication

  1. Changes
    - Drop all existing policies first
    - Drop foreign key constraints from admin_users
    - Add password_hash column to admin_users
    - Recreate simpler RLS policies

  2. Security
    - Passwords stored as hashed values
    - Public access for authentication flow
    - Simple policy structure
*/

DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow first admin creation" ON admin_users;
DROP POLICY IF EXISTS "Existing admins can create new admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can deactivate other admins" ON admin_users;

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_id_fkey;
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_created_by_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN password_hash text;
  END IF;
END $$;

CREATE POLICY "Allow public access to admin_users"
  ON admin_users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);