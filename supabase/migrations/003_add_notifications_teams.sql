-- Migration: Add notifications and team management tables
-- Run this in your Supabase SQL editor

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'webhook', 'suggestion', 'subscription', 'team', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  email_webhook_updates BOOLEAN DEFAULT true,
  email_suggestions BOOLEAN DEFAULT true,
  email_billing BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'removed'
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- ============================================
-- TEAM INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);

-- ============================================
-- ACCOUNT DELETION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  feedback TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);

-- ============================================
-- DATA EXPORT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'expired', 'failed'
  format TEXT DEFAULT 'json', -- 'json', 'csv'
  file_url TEXT,
  file_size BIGINT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Notifications: Users can only see their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Notification Preferences: Users can only manage their own
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_prefs_all ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Teams: Members can view, owners can modify
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_select ON teams
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY teams_insert ON teams
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY teams_update ON teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY teams_delete ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- Team Members: Team members can view, admins can modify
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_select ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND owner_id = auth.uid())
  );

-- Data Exports: Users can only see their own
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_exports_all ON data_exports
  FOR ALL USING (auth.uid() = user_id);

-- Deletion Requests: Users can only see their own
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY deletion_requests_all ON deletion_requests
  FOR ALL USING (auth.uid() = user_id);
