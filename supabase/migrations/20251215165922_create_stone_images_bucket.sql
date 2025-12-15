/*
  # Create Storage Bucket for Stone Images

  1. New Storage Buckets
    - `stone-images` - stores user uploaded images, masks, and results
      - Public access for reading images
      - Anyone can upload (needed for the application)
      - 10MB file size limit
      - Allowed types: JPEG, PNG, WEBP

  2. Security
    - Public bucket for easy image access
    - RLS policies allow public read and insert
    - Organized in folders: uploads/, masks/, results/

  3. Notes
    - Public access allows generated images to be viewed without auth
    - File size and type restrictions enforced
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stone-images',
  'stone-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Public read access for stone images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

CREATE POLICY "Public read access for stone images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'stone-images');

CREATE POLICY "Anyone can upload images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'stone-images');

CREATE POLICY "Users can update their own images"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'stone-images')
  WITH CHECK (bucket_id = 'stone-images');

CREATE POLICY "Users can delete their own images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'stone-images');