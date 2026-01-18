-- Migration: Add is_admin column to users table
-- Run this in your Supabase SQL editor

-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Set yourself as admin (replace 'your-github-username' with your actual GitHub username)
-- UPDATE users SET is_admin = true WHERE github_username = 'your-github-username';

-- Example: Make a specific user admin by their GitHub ID
-- UPDATE users SET is_admin = true WHERE github_id = '12345678';
