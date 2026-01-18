-- ContextFlow Initial Database Schema
-- This migration creates all necessary tables for the ContextFlow application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id TEXT UNIQUE NOT NULL,
  github_username TEXT NOT NULL,
  avatar_url TEXT,
  access_token TEXT NOT NULL, -- Encrypted in application layer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on github_id for faster lookups
CREATE INDEX idx_users_github_id ON users(github_id);

-- Repositories table
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id BIGINT UNIQUE NOT NULL,
  owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  full_name TEXT NOT NULL, -- e.g., "username/repo"
  webhook_id BIGINT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for repositories
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);

-- Microservices table
CREATE TABLE microservices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  manifest_path TEXT NOT NULL, -- Path to vibe.json in repo
  status TEXT NOT NULL CHECK (status IN ('Backlog', 'In Progress', 'Testing', 'Done')),
  current_task TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_steps JSONB DEFAULT '[]'::jsonb, -- Array of strings
  health_status TEXT NOT NULL DEFAULT 'Unknown' CHECK (health_status IN ('Healthy', 'Stale', 'Inactive', 'Unknown')),
  last_commit_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for microservices
CREATE INDEX idx_microservices_repository_id ON microservices(repository_id);
CREATE INDEX idx_microservices_status ON microservices(status);
CREATE INDEX idx_microservices_health_status ON microservices(health_status);

-- Create unique constraint on repository + manifest_path
CREATE UNIQUE INDEX idx_microservices_unique_manifest ON microservices(repository_id, manifest_path);

-- Commit suggestions table
CREATE TABLE commit_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  microservice_id UUID NOT NULL REFERENCES microservices(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  commit_message TEXT NOT NULL,
  parsed_status TEXT CHECK (parsed_status IN ('Backlog', 'In Progress', 'Testing', 'Done')),
  parsed_next_steps JSONB, -- Array of strings
  suggested_manifest JSONB NOT NULL, -- Full suggested manifest object
  is_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for commit_suggestions
CREATE INDEX idx_commit_suggestions_microservice_id ON commit_suggestions(microservice_id);
CREATE INDEX idx_commit_suggestions_is_applied ON commit_suggestions(is_applied);
CREATE INDEX idx_commit_suggestions_created_at ON commit_suggestions(created_at DESC);

-- Create unique constraint to prevent duplicate suggestions for same commit
CREATE UNIQUE INDEX idx_commit_suggestions_unique ON commit_suggestions(microservice_id, commit_sha);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on microservices
CREATE TRIGGER update_microservices_updated_at
  BEFORE UPDATE ON microservices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE microservices ENABLE ROW LEVEL SECURITY;
ALTER TABLE commit_suggestions ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can only see and update their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Repositories policies
-- Users can only see and manage their own repositories
CREATE POLICY "Users can view own repositories"
  ON repositories FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own repositories"
  ON repositories FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own repositories"
  ON repositories FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own repositories"
  ON repositories FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Microservices policies
-- Users can access microservices through their repositories
CREATE POLICY "Users can view microservices of their repositories"
  ON microservices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = microservices.repository_id
      AND repositories.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert microservices to their repositories"
  ON microservices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = microservices.repository_id
      AND repositories.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update microservices of their repositories"
  ON microservices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = microservices.repository_id
      AND repositories.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete microservices of their repositories"
  ON microservices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = microservices.repository_id
      AND repositories.user_id::text = auth.uid()::text
    )
  );

-- Commit suggestions policies
-- Users can access suggestions through their microservices
CREATE POLICY "Users can view suggestions for their microservices"
  ON commit_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM microservices
      JOIN repositories ON repositories.id = microservices.repository_id
      WHERE microservices.id = commit_suggestions.microservice_id
      AND repositories.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update suggestions for their microservices"
  ON commit_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM microservices
      JOIN repositories ON repositories.id = microservices.repository_id
      WHERE microservices.id = commit_suggestions.microservice_id
      AND repositories.user_id::text = auth.uid()::text
    )
  );

-- Service role bypass (for webhook endpoints)
-- These policies allow the service role to insert/update without user context

CREATE POLICY "Service role can insert commit_suggestions"
  ON commit_suggestions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert microservices"
  ON microservices FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update microservices"
  ON microservices FOR UPDATE
  USING (auth.role() = 'service_role');

-- Helper function to get days since last commit
CREATE OR REPLACE FUNCTION days_since_last_commit(last_commit TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
BEGIN
  IF last_commit IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(DAY FROM NOW() - last_commit)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to calculate health status
CREATE OR REPLACE FUNCTION calculate_health_status(last_commit TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
DECLARE
  days_since INTEGER;
BEGIN
  days_since := days_since_last_commit(last_commit);

  IF days_since IS NULL THEN
    RETURN 'Unknown';
  ELSIF days_since < 7 THEN
    RETURN 'Healthy';
  ELSIF days_since < 30 THEN
    RETURN 'Stale';
  ELSE
    RETURN 'Inactive';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View to get microservices with health calculations
CREATE OR REPLACE VIEW microservices_with_health AS
SELECT
  m.*,
  days_since_last_commit(m.last_commit_date) as days_since_commit,
  calculate_health_status(m.last_commit_date) as calculated_health_status,
  r.full_name as repository_full_name,
  r.owner as repository_owner,
  r.repo_name
FROM microservices m
JOIN repositories r ON r.id = m.repository_id;

-- Grant access to authenticated users
GRANT SELECT ON microservices_with_health TO authenticated;

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user information from GitHub OAuth';
COMMENT ON TABLE repositories IS 'Connected GitHub repositories';
COMMENT ON TABLE microservices IS 'Microservices tracked via vibe.json manifests';
COMMENT ON TABLE commit_suggestions IS 'Suggested manifest updates based on commit tags';
COMMENT ON FUNCTION calculate_health_status IS 'Calculates health status based on last commit date';
COMMENT ON VIEW microservices_with_health IS 'Microservices with calculated health metrics';
