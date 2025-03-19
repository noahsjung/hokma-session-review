-- Create the session-recordings bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-recordings', 'session-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'session-recordings');

CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'session-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'session-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'session-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
