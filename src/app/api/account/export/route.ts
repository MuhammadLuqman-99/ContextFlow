import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth/helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/account/export - Request data export
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format = 'json' } = body;

    // Check for recent export request (limit to 1 per day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentExport } = await supabaseAdmin
      .from('data_exports')
      .select('id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneDayAgo.toISOString())
      .single();

    if (recentExport) {
      return NextResponse.json({
        error: 'Export limit reached',
        message: 'You can only request one export per day',
      }, { status: 429 });
    }

    // Collect all user data
    const exportData = await collectUserData(user.id);

    // Create export record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours expiry

    const { data: exportRecord, error: exportError } = await supabaseAdmin
      .from('data_exports')
      .insert({
        user_id: user.id,
        format,
        status: 'ready',
        expires_at: expiresAt.toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (exportError) {
      console.error('Error creating export record:', exportError);
      return NextResponse.json({ error: 'Failed to create export' }, { status: 500 });
    }

    // Return data directly for immediate download
    return NextResponse.json({
      success: true,
      data: {
        export_id: exportRecord.id,
        format,
        expires_at: expiresAt.toISOString(),
        content: exportData,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/account/export - Get export status/list
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: exports, error } = await supabaseAdmin
      .from('data_exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch exports' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: exports,
    });
  } catch (error) {
    console.error('Get exports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function collectUserData(userId: string) {
  // Get user profile
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, github_id, github_username, avatar_url, email, created_at, subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  // Get repositories
  const { data: repositories } = await supabaseAdmin
    .from('repositories')
    .select('id, github_repo_id, owner, repo_name, full_name, is_active, created_at')
    .eq('user_id', userId);

  // Get microservices
  const repoIds = (repositories || []).map((r) => r.id);
  const { data: microservices } = repoIds.length > 0
    ? await supabaseAdmin
        .from('microservices')
        .select('*')
        .in('repository_id', repoIds)
    : { data: [] };

  // Get notifications
  const { data: notifications } = await supabaseAdmin
    .from('notifications')
    .select('id, type, title, message, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  // Get notification preferences
  const { data: notificationPrefs } = await supabaseAdmin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get teams
  const { data: ownedTeams } = await supabaseAdmin
    .from('teams')
    .select('id, name, slug, created_at')
    .eq('owner_id', userId);

  const { data: teamMemberships } = await supabaseAdmin
    .from('team_members')
    .select('team_id, role, status, joined_at')
    .eq('user_id', userId);

  // Get billing events
  const { data: billingEvents } = await supabaseAdmin
    .from('billing_events')
    .select('id, event_type, amount, currency, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Get commit suggestions
  const { data: suggestions } = microservices && microservices.length > 0
    ? await supabaseAdmin
        .from('commit_suggestions')
        .select('id, commit_sha, commit_message, parsed_status, is_applied, created_at')
        .in('microservice_id', microservices.map((m) => m.id))
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] };

  return {
    exported_at: new Date().toISOString(),
    user: {
      ...user,
      // Remove sensitive fields
      access_token: '[REDACTED]',
    },
    repositories: repositories || [],
    microservices: microservices || [],
    notifications: notifications || [],
    notification_preferences: notificationPrefs || null,
    teams: {
      owned: ownedTeams || [],
      memberships: teamMemberships || [],
    },
    billing_history: billingEvents || [],
    commit_suggestions: suggestions || [],
  };
}
