-- Create user_roles enum type if it doesn't exist
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('counselor', 'supervisor');
    END IF;
END $;

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'counselor';

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  counselor_id UUID NOT NULL REFERENCES users(id),
  supervisor_id UUID REFERENCES users(id),
  recording_url TEXT,
  duration INTEGER,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'transcribing', 'ready', 'reviewed'))
);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  full_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transcript_segments table for timestamped segments
CREATE TABLE IF NOT EXISTS transcript_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  text TEXT NOT NULL,
  speaker TEXT,
  segment_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES transcript_segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  start_time FLOAT,
  end_time FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies

-- Sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
CREATE POLICY "Users can view their own sessions"
ON sessions
FOR SELECT
TO authenticated
USING (auth.uid() = counselor_id OR auth.uid() = supervisor_id);

DROP POLICY IF EXISTS "Counselors can insert their own sessions" ON sessions;
CREATE POLICY "Counselors can insert their own sessions"
ON sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = counselor_id);

DROP POLICY IF EXISTS "Counselors can update their own sessions" ON sessions;
CREATE POLICY "Counselors can update their own sessions"
ON sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = counselor_id)
WITH CHECK (auth.uid() = counselor_id);

-- Transcripts policies
DROP POLICY IF EXISTS "Users can view transcripts of their sessions" ON transcripts;
CREATE POLICY "Users can view transcripts of their sessions"
ON transcripts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = transcripts.session_id
    AND (sessions.counselor_id = auth.uid() OR sessions.supervisor_id = auth.uid())
  )
);

-- Transcript segments policies
DROP POLICY IF EXISTS "Users can view transcript segments of their sessions" ON transcript_segments;
CREATE POLICY "Users can view transcript segments of their sessions"
ON transcript_segments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM transcripts
    JOIN sessions ON sessions.id = transcripts.session_id
    WHERE transcripts.id = transcript_segments.transcript_id
    AND (sessions.counselor_id = auth.uid() OR sessions.supervisor_id = auth.uid())
  )
);

-- Comments policies
DROP POLICY IF EXISTS "Users can view comments on their sessions" ON comments;
CREATE POLICY "Users can view comments on their sessions"
ON comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = comments.session_id
    AND (sessions.counselor_id = auth.uid() OR sessions.supervisor_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert comments" ON comments;
CREATE POLICY "Users can insert comments"
ON comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments"
ON comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments"
ON comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Add to realtime publication
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table transcripts;
alter publication supabase_realtime add table transcript_segments;
alter publication supabase_realtime add table comments;