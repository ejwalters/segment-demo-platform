-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create demos table
CREATE TABLE demos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  logo_url TEXT,
  segment_write_key TEXT NOT NULL,
  segment_profile_token TEXT NOT NULL,
  segment_unify_space_id TEXT NOT NULL,
  frontend_url TEXT,
  backend_url TEXT,
  github_repo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;

-- Create policy to only allow users to access their own demos
CREATE POLICY "Users can only access their own demos"
  ON demos
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_demos_user_id ON demos(user_id);
CREATE INDEX idx_demos_created_at ON demos(created_at DESC);

-- Grant necessary permissions
GRANT ALL ON demos TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 