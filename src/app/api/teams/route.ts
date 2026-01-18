import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth/helpers';
import { canUserAdd, getLimitExceededMessage } from '@/lib/usage/limits';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/teams - Get user's teams
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teams where user is owner
    const { data: ownedTeams, error: ownedError } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        team_members(
          id,
          user_id,
          role,
          status,
          joined_at,
          users(id, github_username, avatar_url)
        )
      `)
      .eq('owner_id', user.id);

    // Get teams where user is a member
    const { data: memberTeams, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select(`
        role,
        status,
        joined_at,
        teams(
          id,
          name,
          slug,
          avatar_url,
          owner_id,
          users!teams_owner_id_fkey(github_username, avatar_url)
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .neq('role', 'owner');

    if (ownedError || memberError) {
      console.error('Error fetching teams:', ownedError || memberError);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        owned: ownedTeams || [],
        member: memberTeams || [],
      },
    });
  } catch (error) {
    console.error('Teams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Team name must be at least 2 characters' }, { status: 400 });
    }

    // Generate slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`;

    // Create team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        name: name.trim(),
        slug,
        owner_id: user.id,
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    // Add owner as team member
    await supabaseAdmin.from('team_members').insert({
      team_id: team.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
