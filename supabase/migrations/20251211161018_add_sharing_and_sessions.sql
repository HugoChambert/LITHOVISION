/*
  # Add Sharing and Session Features

  1. Modifications to existing tables
    - `user_projects`
      - Add `share_token` (text, unique, nullable) - for public sharing
      - Add `is_public` (boolean, default false)
      - Add `mask_image_url` (text, nullable)
      - Add `stone_material_id` reference
    
  2. New Tables
    - `project_sessions`
      - `id` (uuid, primary key)
      - `session_key` (text, unique) - for anonymous users
      - `project_data` (jsonb) - stores work in progress
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
  
  3. Security
    - Public projects can be read by anyone with share token
    - Session data can be accessed by anyone

  4. Functions
    - Generate unique share tokens
    - Clean expired sessions
*/

-- Add columns to user_projects if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_projects' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE user_projects ADD COLUMN share_token text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_projects' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE user_projects ADD COLUMN is_public boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_projects' AND column_name = 'mask_image_url'
  ) THEN
    ALTER TABLE user_projects ADD COLUMN mask_image_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_projects' AND column_name = 'stone_material_id'
  ) THEN
    ALTER TABLE user_projects ADD COLUMN stone_material_id uuid REFERENCES stone_materials(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create project_sessions table for anonymous users
CREATE TABLE IF NOT EXISTS project_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text UNIQUE NOT NULL,
  project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_projects_share_token') THEN
    CREATE INDEX idx_user_projects_share_token ON user_projects(share_token) WHERE share_token IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_sessions_key') THEN
    CREATE INDEX idx_project_sessions_key ON project_sessions(session_key);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_sessions_expires') THEN
    CREATE INDEX idx_project_sessions_expires ON project_sessions(expires_at);
  END IF;
END $$;

-- Enable RLS on project_sessions
ALTER TABLE project_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing public project policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_projects' AND policyname = 'Public projects viewable by share token'
  ) THEN
    DROP POLICY "Public projects viewable by share token" ON user_projects;
  END IF;
END $$;

-- Create new policy for public project viewing
CREATE POLICY "Public projects viewable by share token"
  ON user_projects FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND share_token IS NOT NULL);

-- RLS Policies for project_sessions

CREATE POLICY "Anyone can read sessions"
  ON project_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create sessions"
  ON project_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON project_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sessions"
  ON project_sessions FOR DELETE
  TO anon, authenticated
  USING (true);

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Generate 12 character random string
    token := encode(gen_random_bytes(9), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := substring(token, 1, 12);
    
    -- Check if token exists
    SELECT EXISTS(SELECT 1 FROM user_projects WHERE share_token = token) INTO token_exists;
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM project_sessions WHERE expires_at < now();
END;
$$;