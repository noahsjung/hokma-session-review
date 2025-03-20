-- Fix the error with comments table already being in the realtime publication
-- First check if comments is already in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'comments'
  ) THEN
    -- Only add if it's not already there
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END
$$;

-- Make sure we have the proper policies for storage objects
DROP POLICY IF EXISTS "Allow authenticated users to upload feedback recordings" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload feedback recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback-recordings');

DROP POLICY IF EXISTS "Allow users to read feedback recordings" ON storage.objects;
CREATE POLICY "Allow users to read feedback recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'feedback-recordings');
