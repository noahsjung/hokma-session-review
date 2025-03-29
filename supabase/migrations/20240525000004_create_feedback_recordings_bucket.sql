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
    
    -- Create policy to allow authenticated uploads
    INSERT INTO storage.policies (name, definition, bucket_id, operation)
    SELECT 'Allow authenticated uploads', 'auth.role() = ''authenticated''', 'feedback-recordings', 'INSERT'
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'policies');
    
    -- Create policy to allow public read access
    INSERT INTO storage.policies (name, definition, bucket_id, operation)
    SELECT 'Public read access', 'true', 'feedback-recordings', 'SELECT'
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'policies');
  END IF;
END$$;
