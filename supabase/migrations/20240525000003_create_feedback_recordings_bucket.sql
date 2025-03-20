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
    
    -- Create policy to allow authenticated users to upload files
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Allow authenticated uploads',
      'auth.role() = ''authenticated''',
      'feedback-recordings'
    );
    
    -- Create policy to allow public read access
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Public read access',
      'true',
      'feedback-recordings'
    );
  END IF;
END$$;
