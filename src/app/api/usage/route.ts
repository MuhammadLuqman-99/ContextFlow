import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserUsage, canUserAdd, getLimitExceededMessage, UsageType } from '@/lib/usage/limits';
import { getUserFromRequest } from '@/lib/auth/helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/usage - Get all usage info for current user
export async function GET(request: NextRequest) {
  try {
    // Use proper authentication
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const usage = await getUserUsage(supabaseAdmin, user.id);

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage info' },
      { status: 500 }
    );
  }
}

// POST /api/usage/check - Check if user can add a specific resource
export async function POST(request: NextRequest) {
  try {
    // Use proper authentication
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type } = body as { type: UsageType };

    if (!type || !['repositories', 'microservices', 'teamMembers'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid usage type' },
        { status: 400 }
      );
    }

    const result = await canUserAdd(supabaseAdmin, user.id, type);

    if (!result.allowed) {
      return NextResponse.json({
        success: false,
        allowed: false,
        message: getLimitExceededMessage(type, result.usage.plan),
        usage: result.usage,
        upgradeRequired: result.upgradeRequired,
      });
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}
