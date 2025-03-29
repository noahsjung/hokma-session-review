-- Disable RLS for transcripts table
ALTER TABLE transcripts DISABLE ROW LEVEL SECURITY;

-- Disable RLS for transcript_segments table
ALTER TABLE transcript_segments DISABLE ROW LEVEL SECURITY;

-- Disable RLS for comments table
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
