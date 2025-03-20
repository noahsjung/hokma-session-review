-- Add audio_url column to comments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'audio_url') THEN
    ALTER TABLE comments ADD COLUMN audio_url TEXT;
  END IF;
END$$;
