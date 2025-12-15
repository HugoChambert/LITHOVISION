/*
  # Create Material Presets System with Pricing

  1. New Tables
    - `material_presets`
      - `id` (uuid, primary key)
      - `name` (text) - Display name of the material
      - `type` (text) - Material type (marble, granite, quartz, etc.)
      - `description` (text) - Detailed description for SDXL prompt
      - `color_family` (text) - Primary color (white, black, gray, beige, etc.)
      - `pattern` (text) - Pattern type (veined, speckled, solid, etc.)
      - `finish` (text) - Surface finish (polished, honed, leathered)
      - `texture_scale` (float) - Default texture scale
      - `preview_image_url` (text) - URL to preview image
      - `price_per_sqft` (numeric) - Price per square foot
      - `is_active` (boolean) - Whether preset is active
      - `metadata` (jsonb) - Additional properties
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `material_presets` table
    - Add policy for public read access to active materials
    - Add policy for authenticated users to manage materials
*/

CREATE TABLE IF NOT EXISTS material_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text NOT NULL DEFAULT '',
  color_family text NOT NULL,
  pattern text NOT NULL,
  finish text DEFAULT 'polished',
  texture_scale float DEFAULT 1.0,
  preview_image_url text,
  price_per_sqft numeric(10,2),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE material_presets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'material_presets' 
    AND policyname = 'Material presets are publicly readable'
  ) THEN
    CREATE POLICY "Material presets are publicly readable"
      ON material_presets FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'material_presets' 
    AND policyname = 'Authenticated users can insert material presets'
  ) THEN
    CREATE POLICY "Authenticated users can insert material presets"
      ON material_presets FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'material_presets' 
    AND policyname = 'Authenticated users can update material presets'
  ) THEN
    CREATE POLICY "Authenticated users can update material presets"
      ON material_presets FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'material_presets' 
    AND policyname = 'Authenticated users can delete material presets'
  ) THEN
    CREATE POLICY "Authenticated users can delete material presets"
      ON material_presets FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_material_presets_type ON material_presets(type);
CREATE INDEX IF NOT EXISTS idx_material_presets_color_family ON material_presets(color_family);
CREATE INDEX IF NOT EXISTS idx_material_presets_is_active ON material_presets(is_active);