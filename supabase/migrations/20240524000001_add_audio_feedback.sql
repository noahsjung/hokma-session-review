-- Add audio feedback columns to comments table
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create feedback-recordings bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'feedback-recordings', 'feedback-recordings'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'feedback-recordings');

-- Allow authenticated users to upload to the feedback-recordings bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload feedback recordings" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload feedback recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback-recordings');

-- Allow users to read their own feedback recordings
DROP POLICY IF EXISTS "Allow users to read feedback recordings" ON storage.objects;
CREATE POLICY "Allow users to read feedback recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'feedback-recordings');

-- Enable realtime for comments table
alter publication supabase_realtime add table comments;
