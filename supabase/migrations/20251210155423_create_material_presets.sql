/*
  # Create Material Presets System

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
      - `is_active` (boolean) - Whether preset is active
      - `metadata` (jsonb) - Additional properties
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `material_presets` table
    - Add policy for public read access
    - Add policy for authenticated insert/update

  3. Sample Data
    - Insert popular stone material presets
*/

CREATE TABLE IF NOT EXISTS material_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  color_family text NOT NULL,
  pattern text NOT NULL,
  finish text DEFAULT 'polished',
  texture_scale float DEFAULT 1.0,
  preview_image_url text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE material_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Material presets are publicly readable"
  ON material_presets FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert material presets"
  ON material_presets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update material presets"
  ON material_presets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO material_presets (name, type, description, color_family, pattern, finish, texture_scale, metadata) VALUES
(
  'Carrara Marble',
  'marble',
  'Classic white Carrara marble with delicate gray veining, soft subtle veins flowing naturally across pristine white background, elegant Italian marble texture',
  'white',
  'veined',
  'polished',
  1.0,
  '{"origin": "Italy", "hardness": "medium", "popular_use": "countertops", "vein_orientation": 0}'
),
(
  'Calacatta Gold',
  'marble',
  'Luxurious Calacatta marble with dramatic gold and gray veining on white background, bold distinctive veins, premium Italian marble with warm golden undertones',
  'white',
  'veined',
  'polished',
  1.2,
  '{"origin": "Italy", "hardness": "medium", "popular_use": "feature_walls", "vein_orientation": 45}'
),
(
  'Absolute Black Granite',
  'granite',
  'Pure solid black granite with uniform deep black color, minimal visible grains, highly polished mirror-like surface finish',
  'black',
  'solid',
  'polished',
  0.8,
  '{"origin": "India", "hardness": "high", "popular_use": "countertops"}'
),
(
  'Kashmir White Granite',
  'granite',
  'White granite with gray and burgundy speckles, consistent small grain pattern, soft neutral coloring with hints of red and brown',
  'white',
  'speckled',
  'polished',
  1.0,
  '{"origin": "India", "hardness": "high", "popular_use": "countertops"}'
),
(
  'Cambria Quartz - Brittanicca',
  'quartz',
  'Warm beige quartz with gold and cream tones, consistent engineered surface, subtle veining and movement throughout',
  'beige',
  'veined',
  'polished',
  1.0,
  '{"origin": "USA", "hardness": "high", "popular_use": "countertops", "stain_resistant": true}'
),
(
  'Caesarstone Statuario Nuvo',
  'quartz',
  'White quartz mimicking Statuario marble, dramatic gray veining on white background, consistent engineered pattern',
  'white',
  'veined',
  'polished',
  1.1,
  '{"origin": "Israel", "hardness": "high", "popular_use": "countertops", "stain_resistant": true}'
),
(
  'Emperador Dark',
  'marble',
  'Rich dark brown marble with white and light brown veining, chocolate brown base with dramatic white veins',
  'brown',
  'veined',
  'polished',
  1.0,
  '{"origin": "Spain", "hardness": "medium", "popular_use": "bathrooms", "vein_orientation": 90}'
),
(
  'Green Guatemala Granite',
  'granite',
  'Forest green granite with black and gray speckles, medium grain texture, rich emerald and hunter green tones',
  'green',
  'speckled',
  'polished',
  1.0,
  '{"origin": "Guatemala", "hardness": "high", "popular_use": "feature_walls"}'
),
(
  'Soapstone',
  'soapstone',
  'Charcoal gray soapstone with subtle veining, matte natural finish, soft gray with darker gray veining',
  'gray',
  'veined',
  'honed',
  0.9,
  '{"origin": "Brazil", "hardness": "soft", "popular_use": "countertops", "heat_resistant": true}'
),
(
  'Taj Mahal Quartzite',
  'quartzite',
  'Ivory and gold quartzite with soft veining, warm cream background with gold and gray movement',
  'beige',
  'veined',
  'polished',
  1.1,
  '{"origin": "Brazil", "hardness": "high", "popular_use": "countertops", "vein_orientation": 30}'
),
(
  'Blue Bahia Granite',
  'granite',
  'Vibrant blue granite with white and gray crystals, striking azure blue with silvery crystal formations',
  'blue',
  'crystalline',
  'polished',
  1.0,
  '{"origin": "Brazil", "hardness": "high", "popular_use": "feature_walls"}'
),
(
  'White Concrete',
  'concrete',
  'Modern white concrete with subtle texture, matte finish with organic imperfections, industrial minimal aesthetic',
  'white',
  'textured',
  'honed',
  1.5,
  '{"origin": "custom", "hardness": "medium", "popular_use": "modern_kitchens"}'
);

CREATE INDEX IF NOT EXISTS idx_material_presets_type ON material_presets(type);
CREATE INDEX IF NOT EXISTS idx_material_presets_color_family ON material_presets(color_family);
CREATE INDEX IF NOT EXISTS idx_material_presets_is_active ON material_presets(is_active);
