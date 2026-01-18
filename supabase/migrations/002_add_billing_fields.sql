-- Migration: Add billing fields to users table
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Add Stripe and subscription fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Create billing_events table for tracking payment history
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  amount INTEGER,
  currency TEXT DEFAULT 'usd',
  invoice_id TEXT,
  subscription_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for billing events
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at DESC);

-- Enable RLS on billing_events
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own billing events
CREATE POLICY "Users can view own billing events" ON billing_events
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only service role can insert billing events (via webhook)
CREATE POLICY "Service role can insert billing events" ON billing_events
  FOR INSERT WITH CHECK (true);

-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE;

-- Create user_preferences table for additional settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create index for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add share_token to repositories if not exists
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS share_token TEXT;
CREATE INDEX IF NOT EXISTS idx_repositories_share_token ON repositories(share_token);

COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN users.subscription_status IS 'active, trialing, past_due, canceled, inactive';
COMMENT ON COLUMN users.subscription_plan IS 'free, pro, team';
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed onboarding flow';
