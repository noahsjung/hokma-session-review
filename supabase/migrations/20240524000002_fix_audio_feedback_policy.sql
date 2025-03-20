-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "public"."comments";

-- Create proper policy for comments table that works with audio feedback
CREATE POLICY "Allow insert for authenticated users"
ON "public"."comments"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Make sure comments table has the audio columns
ALTER TABLE "public"."comments"
ADD COLUMN IF NOT EXISTS "has_audio" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "audio_url" text;

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
