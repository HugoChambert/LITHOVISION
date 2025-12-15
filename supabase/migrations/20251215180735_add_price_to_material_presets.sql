/*
  # Add price field to material presets

  1. Changes
    - Add `price_per_sqft` column to `material_presets` table
    - Set default value to 0 for existing records
    - Allow null values for materials without pricing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material_presets' AND column_name = 'price_per_sqft'
  ) THEN
    ALTER TABLE material_presets ADD COLUMN price_per_sqft numeric(10,2);
  END IF;
END $$;
