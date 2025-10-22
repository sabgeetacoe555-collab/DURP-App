-- Add storage policies for attachments bucket
-- These policies allow authenticated users to upload, view, and delete their own files

-- Policy for uploading files (INSERT)
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'attachments' AND 
  auth.role() = 'authenticated'
);

-- Policy for viewing files (SELECT)
CREATE POLICY "Allow public view of attachments" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'attachments');

-- Policy for deleting files (DELETE)
CREATE POLICY "Allow authenticated delete own files" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'attachments' AND 
  auth.role() = 'authenticated'
);

-- Policy for updating files (UPDATE)
CREATE POLICY "Allow authenticated update own files" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'attachments' AND 
  auth.role() = 'authenticated'
);
