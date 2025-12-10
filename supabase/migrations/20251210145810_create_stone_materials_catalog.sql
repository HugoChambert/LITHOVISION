/*
  # Stone Materials Catalog Schema

  ## Overview
  This migration creates the database structure for storing stone material catalog entries
  used in the AI stone-replacement tool.

  ## New Tables
  
  ### `stone_materials`
  Stores all available stone materials that users can select for replacement
  
  - `id` (uuid, primary key): Unique identifier for each stone material
  - `name` (text): Display name of the stone material (e.g., "Carrara Marble")
  - `type` (text): Category of stone (granite, marble, quartz)
  - `description` (text): Detailed description of the material
  - `image_url` (text): URL to the stone texture/pattern image
  - `thumbnail_url` (text): URL to thumbnail version for catalog display
  - `texture_scale` (numeric): Scale factor for texture mapping (default 1.0)
  - `metadata` (jsonb): Additional properties for ML pipeline (color profiles, finish type, etc.)
  - `is_active` (boolean): Whether this material is available for selection
  - `sort_order` (integer): Display order in catalog (lower numbers first)
  - `created_at` (timestamptz): Record creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `user_projects`
  Stores user's stone replacement projects
  
  - `id` (uuid, primary key): Unique identifier for each project
  - `user_id` (uuid): Reference to authenticated user
  - `name` (text): Project name
  - `original_image_url` (text): URL to uploaded original photo
  - `mask_data` (text): Base64 or URL to selection mask
  - `selected_stone_id` (uuid): Reference to chosen stone material
  - `result_image_url` (text): URL to generated preview image
  - `processing_status` (text): Status (pending, processing, completed, failed)
  - `created_at` (timestamptz): Project creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ## Security
  
  ### stone_materials table
  - Enable RLS
  - Allow public read access (anyone can view catalog)
  - Restrict write access to authenticated admin users only
  
  ### user_projects table
  - Enable RLS
  - Users can only access their own projects
  - Authenticated users can create new projects

  ## Indexes
  - Index on stone_materials.type for filtering by stone category
  - Index on stone_materials.is_active for quick catalog queries
  - Index on user_projects.user_id for user project lookups
*/

-- Create stone_materials table
CREATE TABLE IF NOT EXISTS stone_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('granite', 'marble', 'quartz')),
  description text DEFAULT '',
  image_url text NOT NULL,
  thumbnail_url text,
  texture_scale numeric DEFAULT 1.0,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_projects table
CREATE TABLE IF NOT EXISTS user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Project',
  original_image_url text NOT NULL,
  mask_data text,
  selected_stone_id uuid REFERENCES stone_materials(id) ON DELETE SET NULL,
  result_image_url text,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stone_materials_type ON stone_materials(type);
CREATE INDEX IF NOT EXISTS idx_stone_materials_active ON stone_materials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(processing_status);

-- Enable Row Level Security
ALTER TABLE stone_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stone_materials
CREATE POLICY "Anyone can view active stone materials"
  ON stone_materials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all stone materials"
  ON stone_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert stone materials"
  ON stone_materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Only admins can update stone materials"
  ON stone_materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Only admins can delete stone materials"
  ON stone_materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
    )
  );

-- RLS Policies for user_projects
CREATE POLICY "Users can view own projects"
  ON user_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON user_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON user_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON user_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample stone materials
INSERT INTO stone_materials (name, type, description, image_url, thumbnail_url, sort_order) VALUES
  ('Carrara Marble', 'marble', 'Classic white marble with subtle gray veining, perfect for elegant kitchens and bathrooms', 'https://images.pexels.com/photos/1139317/pexels-photo-1139317.jpeg', 'https://images.pexels.com/photos/1139317/pexels-photo-1139317.jpeg?auto=compress&cs=tinysrgb&w=200', 1),
  ('Black Galaxy Granite', 'granite', 'Deep black granite with golden speckles, adds dramatic sophistication', 'https://images.pexels.com/photos/1106900/pexels-photo-1106900.jpeg', 'https://images.pexels.com/photos/1106900/pexels-photo-1106900.jpeg?auto=compress&cs=tinysrgb&w=200', 2),
  ('Calacatta Gold Marble', 'marble', 'Luxurious white marble with bold gold and gray veining', 'https://images.pexels.com/photos/3965543/pexels-photo-3965543.jpeg', 'https://images.pexels.com/photos/3965543/pexels-photo-3965543.jpeg?auto=compress&cs=tinysrgb&w=200', 3),
  ('White Quartz', 'quartz', 'Pure white engineered quartz with consistent pattern, low maintenance', 'https://images.pexels.com/photos/534151/pexels-photo-534151.jpeg', 'https://images.pexels.com/photos/534151/pexels-photo-534151.jpeg?auto=compress&cs=tinysrgb&w=200', 4),
  ('Absolute Black Granite', 'granite', 'Solid black granite with minimal variation, modern and sleek', 'https://images.pexels.com/photos/235985/pexels-photo-235985.jpeg', 'https://images.pexels.com/photos/235985/pexels-photo-235985.jpeg?auto=compress&cs=tinysrgb&w=200', 5),
  ('Gray Quartz', 'quartz', 'Contemporary gray quartz with subtle white veining', 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg', 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=200', 6)
ON CONFLICT DO NOTHING;