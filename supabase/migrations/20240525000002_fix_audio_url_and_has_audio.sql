-- Add has_audio column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'has_audio') THEN
    ALTER TABLE comments ADD COLUMN has_audio BOOLEAN DEFAULT FALSE;
  END IF;

  -- Ensure audio_url column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'audio_url') THEN
    ALTER TABLE comments ADD COLUMN audio_url TEXT;
  END IF;
END$$;

-- Add to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;
END$$;
