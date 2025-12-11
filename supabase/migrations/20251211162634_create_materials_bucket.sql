/*
  # Create Materials Storage Bucket

  1. New Storage Bucket
    - `materials` - stores admin-uploaded stone slab images
      - Public access for reading
      - Anyone can upload (needed for admin functionality)
      - Used by AI to apply textures to user images

  2. Security
    - Public bucket for easy access to stone material images
    - Upload access for all users (admin panel requires this)
    - RLS policies control access

  3. Notes
    - Separate from stone-images bucket for organization
    - Contains reference images for AI processing
    - 10MB file size limit per image
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

CREATE POLICY "Public read access for materials"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'materials');

CREATE POLICY "Anyone can upload materials"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'materials');

CREATE POLICY "Anyone can update materials"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'materials')
  WITH CHECK (bucket_id = 'materials');

CREATE POLICY "Anyone can delete materials"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'materials');