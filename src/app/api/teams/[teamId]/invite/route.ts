import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth/helpers';
import { canUserAdd, getLimitExceededMessage } from '@/lib/usage/limits';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/teams/[teamId]/invite - Invite a user to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { user, supabase } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is team owner or admin
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('*, team_members(*)')
      .eq('id', teamId)
      .single();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner = team.owner_id === user.id;
    const isAdmin = team.team_members?.some(
      (m: { user_id: string; role: string }) => m.user_id === user.id && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check team member limit
    const limitCheck = await canUserAdd(supabase, team.owner_id, 'teamMembers');
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'Team member limit reached',
        message: getLimitExceededMessage('teamMembers', limitCheck.usage.plan),
        upgradeRequired: limitCheck.upgradeRequired,
      }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = 'member' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if already a member
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const { data: existingMember } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 409 });
      }
    }

    // Check for existing invite
    const { data: existingInvite } = await supabaseAdmin
      .from('team_invites')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 409 });
    }

    // Create invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .insert({
        team_id: teamId,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // TODO: Send invite email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        invite,
        inviteUrl,
      },
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/teams/[teamId]/invite - Get pending invites
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to team
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (!team || team.owner_id !== user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { data: invites, error } = await supabaseAdmin
      .from('team_invites')
      .select(`
        *,
        inviter:users!team_invites_invited_by_fkey(github_username, avatar_url)
      `)
      .eq('team_id', teamId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
