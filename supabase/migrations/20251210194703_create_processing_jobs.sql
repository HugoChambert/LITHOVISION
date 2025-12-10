/*
  # Create processing jobs table

  1. New Tables
    - `processing_jobs`
      - `id` (uuid, primary key) - Job ID
      - `status` (text) - Job status: pending, processing, completed, failed
      - `image_id` (text) - Original image path in storage
      - `mask_id` (text) - Mask image path in storage
      - `stone_material` (jsonb) - Selected stone material data
      - `result_url` (text, nullable) - Final result image path
      - `progress` (integer, default 0) - Progress percentage
      - `error_message` (text, nullable) - Error details if failed
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `processing_jobs` table
    - Allow anyone to create and read jobs (public tool)
*/

CREATE TABLE IF NOT EXISTS processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  image_id text NOT NULL,
  mask_id text,
  stone_material jsonb,
  result_url text,
  progress integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON processing_jobs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read" ON processing_jobs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update" ON processing_jobs
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at DESC);
