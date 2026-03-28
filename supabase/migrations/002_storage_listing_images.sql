-- Allow anon to upload and update objects in the listing-images bucket
-- (so npm run upload-images and control-panel image upload work)
-- Run this in Supabase SQL Editor after creating the bucket "listing-images" in Dashboard.

-- Drop policies if they exist so migration can be re-run safely
DROP POLICY IF EXISTS "Allow anon upload listing-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update listing-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read listing-images" ON storage.objects;

-- Policy: anon can INSERT into listing-images bucket
CREATE POLICY "Allow anon upload listing-images"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'listing-images');

-- Policy: anon can UPDATE (for upsert/overwrite) in listing-images
CREATE POLICY "Allow anon update listing-images"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'listing-images')
WITH CHECK (bucket_id = 'listing-images');

-- Policy: anon can SELECT (read) in listing-images (public bucket already allows read; this makes RLS explicit)
CREATE POLICY "Allow public read listing-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listing-images');
