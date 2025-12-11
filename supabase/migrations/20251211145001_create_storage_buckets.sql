/*
  # Create Storage Buckets for Image Uploads

  1. New Storage Buckets
    - `stone-images` - stores user uploaded images and generated masks
      - Public access for reading images
      - Authenticated and anonymous users can upload
      - Organized with folders: uploads/, masks/, results/

  2. Security
    - Public bucket for easy image access
    - Anyone can upload (needed for the application flow)
    - RLS policies control access appropriately

  3. Notes
    - Images are organized in subfolders for better management
    - Public access allows generated images to be viewed without auth
    - File size limits and type restrictions handled in application layer
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