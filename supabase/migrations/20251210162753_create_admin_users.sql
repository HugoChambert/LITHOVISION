/*
  # Create Admin Users System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key) - references auth.users
      - `email` (text) - admin email address
      - `created_at` (timestamptz) - when admin was added
      - `created_by` (uuid) - which admin created this user
      - `is_active` (boolean) - whether admin account is active

  2. Security
    - Enable RLS on `admin_users` table
    - Only authenticated admins can read admin_users table
    - First admin can be created without restriction (bootstrap)
    - Subsequent admins must be created by existing admins

  3. Notes
    - Uses Supabase Auth for authentication
    - Admin status is tracked separately from auth.users
    - Allows for admin management and revocation
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id),
  is_active boolean DEFAULT true
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Allow first admin creation"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM admin_users)
  );

CREATE POLICY "Existing admins can create new admins"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can deactivate other admins"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
