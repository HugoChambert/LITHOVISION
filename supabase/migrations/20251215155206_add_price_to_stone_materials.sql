/*
  # Add Price Per Square Foot to Stone Materials

  1. Changes
    - Add `price_per_sqft` column to `stone_materials` table
    - Column type: numeric(10,2) to store price with 2 decimal places
    - Nullable: true (allows admins to optionally set prices)
    - Default: null

  2. Purpose
    - Allow admins to input and update stone slab pricing
    - Display price information to users for cost estimation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stone_materials' AND column_name = 'price_per_sqft'
  ) THEN
    ALTER TABLE stone_materials ADD COLUMN price_per_sqft numeric(10,2);
  END IF;
END $$;