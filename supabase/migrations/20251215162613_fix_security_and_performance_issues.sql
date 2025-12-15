/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Foreign Key Indexes
    - Add index on `admin_users.created_by`
    - Add index on `user_projects.selected_stone_id`
    These improve query performance for foreign key lookups

  ## 2. Optimize RLS Policies
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation for each row and improves performance at scale
    - Affects policies on: stone_materials, user_projects, admin_users

  ## 3. Fix Function Search Path
    - Update `update_material_inventory_timestamp` function with stable search_path
    - Prevents potential security issues from search_path manipulation

  ## 4. Resolve Multiple Permissive Policies
    - Consolidate duplicate policies on admin_users and stone_materials
    - Ensures clear and efficient policy evaluation
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Index for admin_users.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by 
ON admin_users(created_by);

-- Index for user_projects.selected_stone_id foreign key
CREATE INDEX IF NOT EXISTS idx_user_projects_selected_stone_id 
ON user_projects(selected_stone_id);

-- ============================================================================
-- 2. FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Recreate the function with stable search_path
CREATE OR REPLACE FUNCTION update_material_inventory_timestamp()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.in_stock IS DISTINCT FROM OLD.in_stock) OR 
     (NEW.quantity_available IS DISTINCT FROM OLD.quantity_available) THEN
    NEW.last_inventory_update = now();
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. DROP AND RECREATE RLS POLICIES WITH OPTIMIZED AUTH CALLS
-- ============================================================================

-- Fix stone_materials policies
DROP POLICY IF EXISTS "Anyone can view active stone materials" ON stone_materials;
DROP POLICY IF EXISTS "Authenticated users can view all stone materials" ON stone_materials;
DROP POLICY IF EXISTS "Only admins can insert stone materials" ON stone_materials;
DROP POLICY IF EXISTS "Only admins can update stone materials" ON stone_materials;
DROP POLICY IF EXISTS "Only admins can delete stone materials" ON stone_materials;

-- Create optimized stone_materials policies
CREATE POLICY "Anyone can view active stone materials"
  ON stone_materials FOR SELECT
  TO public
  USING (is_active = true);

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

CREATE POLICY "Only admins can update stone materials"
  ON stone_materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

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

-- Fix user_projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON user_projects;
DROP POLICY IF EXISTS "Users can create own projects" ON user_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON user_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON user_projects;

CREATE POLICY "Users can view own projects"
  ON user_projects FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own projects"
  ON user_projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own projects"
  ON user_projects FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own projects"
  ON user_projects FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix admin_users policies
DROP POLICY IF EXISTS "Allow first admin creation" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Existing admins can create new admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can deactivate other admins" ON admin_users;

-- Create optimized admin_users policies
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

-- Single consolidated INSERT policy for admins
CREATE POLICY "Admins can create new admins"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can deactivate other admins"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

-- ============================================================================
-- 4. FIX MATERIAL_PRESETS POLICIES (same as stone_materials)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active materials" ON material_presets;
DROP POLICY IF EXISTS "Only admins can insert materials" ON material_presets;
DROP POLICY IF EXISTS "Only admins can update materials" ON material_presets;
DROP POLICY IF EXISTS "Only admins can delete materials" ON material_presets;

CREATE POLICY "Anyone can view active materials"
  ON material_presets FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Only admins can insert materials"
  ON material_presets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

CREATE POLICY "Only admins can update materials"
  ON material_presets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );

CREATE POLICY "Only admins can delete materials"
  ON material_presets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = (select auth.uid()) 
      AND is_active = true
    )
  );