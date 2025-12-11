/*
  # Fix Security and Performance Issues

  This migration addresses multiple security and performance concerns identified in the database audit:

  ## 1. Performance Improvements
  
  ### Foreign Key Indexes
  - Add index on `user_projects.selected_stone_id` (foreign key to stone_materials)
  - Add index on `user_projects.stone_material_id` (foreign key to stone_materials)
  
  ### RLS Policy Optimization
  Optimize all RLS policies to prevent re-evaluation of `auth.uid()` for each row by wrapping in subquery:
  - Update all policies on `stone_materials` table (insert, update, delete)
  - Update all policies on `user_projects` table (select, insert, update, delete)
  
  ## 2. Security Improvements
  
  ### Consolidate Duplicate Policies
  - Remove duplicate SELECT policies on `stone_materials` (keeping only one comprehensive policy)
  - Consolidate SELECT policies on `user_projects` (merge into single optimized policy)
  
  ### Fix Function Security
  - Set explicit search_path for `generate_share_token()` function
  - Set explicit search_path for `clean_expired_sessions()` function
  
  ## 3. Index Cleanup Note
  Unused indexes are being kept as they will be used as the application scales and query patterns evolve.
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Index for user_projects.selected_stone_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_projects_selected_stone_id') THEN
    CREATE INDEX idx_user_projects_selected_stone_id ON user_projects(selected_stone_id);
  END IF;
END $$;

-- Index for user_projects.stone_material_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_projects_stone_material_id') THEN
    CREATE INDEX idx_user_projects_stone_material_id ON user_projects(stone_material_id);
  END IF;
END $$;

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - STONE_MATERIALS TABLE
-- =====================================================

-- Drop and recreate admin policies with optimized auth checks
DROP POLICY IF EXISTS "Only admins can insert stone materials" ON stone_materials;
CREATE POLICY "Only admins can insert stone materials"
  ON stone_materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Only admins can update stone materials" ON stone_materials;
CREATE POLICY "Only admins can update stone materials"
  ON stone_materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Only admins can delete stone materials" ON stone_materials;
CREATE POLICY "Only admins can delete stone materials"
  ON stone_materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

-- Consolidate duplicate SELECT policies into single optimized policy
DROP POLICY IF EXISTS "Anyone can view active stone materials" ON stone_materials;
DROP POLICY IF EXISTS "Authenticated users can view all stone materials" ON stone_materials;

CREATE POLICY "Users can view stone materials"
  ON stone_materials FOR SELECT
  TO anon, authenticated
  USING (
    -- Anonymous users can only see active materials
    (auth.role() = 'anon' AND is_active = true)
    OR
    -- Authenticated users can see all materials
    (auth.role() = 'authenticated')
  );

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - USER_PROJECTS TABLE
-- =====================================================

-- Drop and recreate user project policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own projects" ON user_projects;
DROP POLICY IF EXISTS "Public projects viewable by share token" ON user_projects;

-- Consolidated SELECT policy
CREATE POLICY "Users can view projects"
  ON user_projects FOR SELECT
  TO anon, authenticated
  USING (
    -- Own projects (authenticated users)
    (user_id = (select auth.uid()))
    OR
    -- Public projects viewable by anyone
    (is_public = true AND share_token IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can create own projects" ON user_projects;
CREATE POLICY "Users can create own projects"
  ON user_projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own projects" ON user_projects;
CREATE POLICY "Users can update own projects"
  ON user_projects FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own projects" ON user_projects;
CREATE POLICY "Users can delete own projects"
  ON user_projects FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 4. FIX FUNCTION SECURITY - SET EXPLICIT SEARCH PATHS
-- =====================================================

-- Recreate generate_share_token with explicit search_path
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Recreate clean_expired_sessions with explicit search_path
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM project_sessions WHERE expires_at < now();
END;
$$;