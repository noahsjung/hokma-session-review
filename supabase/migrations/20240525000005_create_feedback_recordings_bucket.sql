-- Create the feedback-recordings bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'feedback-recordings'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('feedback-recordings', 'feedback-recordings', true);
  END IF;
END$$;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated uploads
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated uploads'
  ) THEN
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
  END IF;
  
  EXECUTE 'CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = ''feedback-recordings'');';
END$$;

-- Create policy to allow public read access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access'
  ) THEN
    DROP POLICY IF EXISTS "Public read access" ON storage.objects;
  END IF;
  
  EXECUTE 'CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = ''feedback-recordings'');';
END$$;
