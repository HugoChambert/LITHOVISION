/*
  # Add Inventory Tracking to Stone Materials

  1. Changes to material_presets table
    - Add `in_stock` (boolean) - Indicates if material is currently available
    - Add `quantity_available` (integer, nullable) - Number of slabs available (null = unlimited/not tracked)
    - Add `low_stock_threshold` (integer, nullable) - Alert threshold for low inventory
    - Add `last_inventory_update` (timestamptz) - Tracks when inventory was last modified
  
  2. Purpose
    - Enable admins to manage inventory and stock levels
    - Allow users to see real-time availability
    - Support automatic low-stock alerts
  
  3. Default Values
    - `in_stock` defaults to true for existing materials
    - `quantity_available` defaults to null (unlimited)
    - `low_stock_threshold` defaults to 5 slabs
    - `last_inventory_update` defaults to now()
*/

-- Add inventory tracking columns to material_presets
DO $$
BEGIN
  -- Add in_stock column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material_presets' AND column_name = 'in_stock'
  ) THEN
    ALTER TABLE material_presets ADD COLUMN in_stock boolean DEFAULT true NOT NULL;
  END IF;

  -- Add quantity_available column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material_presets' AND column_name = 'quantity_available'
  ) THEN
    ALTER TABLE material_presets ADD COLUMN quantity_available integer DEFAULT NULL;
  END IF;

  -- Add low_stock_threshold column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material_presets' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE material_presets ADD COLUMN low_stock_threshold integer DEFAULT 5;
  END IF;

  -- Add last_inventory_update column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material_presets' AND column_name = 'last_inventory_update'
  ) THEN
    ALTER TABLE material_presets ADD COLUMN last_inventory_update timestamptz DEFAULT now();
  END IF;
END $$;

-- Add check constraint to ensure quantity_available is non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'material_presets_quantity_check'
  ) THEN
    ALTER TABLE material_presets 
    ADD CONSTRAINT material_presets_quantity_check 
    CHECK (quantity_available IS NULL OR quantity_available >= 0);
  END IF;
END $$;

-- Add check constraint to ensure low_stock_threshold is positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'material_presets_threshold_check'
  ) THEN
    ALTER TABLE material_presets 
    ADD CONSTRAINT material_presets_threshold_check 
    CHECK (low_stock_threshold IS NULL OR low_stock_threshold > 0);
  END IF;
END $$;

-- Create index on in_stock for faster filtering
CREATE INDEX IF NOT EXISTS idx_material_presets_in_stock 
ON material_presets(in_stock) 
WHERE in_stock = true;

-- Create function to automatically update last_inventory_update timestamp
CREATE OR REPLACE FUNCTION update_material_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.in_stock IS DISTINCT FROM OLD.in_stock) OR 
     (NEW.quantity_available IS DISTINCT FROM OLD.quantity_available) THEN
    NEW.last_inventory_update = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp on inventory changes
DROP TRIGGER IF EXISTS trigger_update_material_inventory_timestamp ON material_presets;
CREATE TRIGGER trigger_update_material_inventory_timestamp
  BEFORE UPDATE ON material_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_material_inventory_timestamp();