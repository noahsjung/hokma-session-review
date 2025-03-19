-- Create a policy to allow inserting users from the auth.signUp function
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "public"."users";
CREATE POLICY "Allow insert for authenticated users"
ON "public"."users"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a policy to allow inserting users during signup
DROP POLICY IF EXISTS "Allow insert during signup" ON "public"."users";
CREATE POLICY "Allow insert during signup"
ON "public"."users"
FOR INSERT
TO anon
WITH CHECK (true);

-- Create a policy to allow users to read their own data
DROP POLICY IF EXISTS "Users can view own data" ON "public"."users";
CREATE POLICY "Users can view own data"
ON "public"."users"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy to allow public read access to users
DROP POLICY IF EXISTS "Public read access" ON "public"."users";
CREATE POLICY "Public read access"
ON "public"."users"
FOR SELECT
TO anon
USING (true);

alter publication supabase_realtime add table users;