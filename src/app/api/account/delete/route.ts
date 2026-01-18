import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth/helpers';
import { stripe } from '@/lib/stripe/client';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/account/delete - Request account deletion
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, feedback, confirmEmail } = body;

    // Verify email confirmation
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    // Check for existing pending deletion request
    const { data: existingRequest } = await supabaseAdmin
      .from('deletion_requests')
      .select('id, status, scheduled_for')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({
        error: 'Deletion already scheduled',
        scheduledFor: existingRequest.scheduled_for,
      }, { status: 409 });
    }

    // Schedule deletion for 7 days from now (grace period)
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 7);

    // Create deletion request
    const { data: deletionRequest, error: requestError } = await supabaseAdmin
      .from('deletion_requests')
      .insert({
        user_id: user.id,
        reason,
        feedback,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating deletion request:', requestError);
      return NextResponse.json({ error: 'Failed to schedule deletion' }, { status: 500 });
    }

    // Cancel Stripe subscription if exists
    if (userData?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(userData.stripe_subscription_id);
      } catch (stripeError) {
        console.error('Error canceling subscription:', stripeError);
        // Continue with deletion request even if Stripe fails
      }
    }

    // TODO: Send confirmation email

    return NextResponse.json({
      success: true,
      data: {
        scheduledFor: scheduledFor.toISOString(),
        message: 'Account deletion scheduled. You have 7 days to cancel this request.',
      },
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/account/delete - Cancel deletion request
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('deletion_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error canceling deletion:', error);
      return NextResponse.json({ error: 'Failed to cancel deletion' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled',
    });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/account/delete - Get deletion status
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deletionRequest } = await supabaseAdmin
      .from('deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    return NextResponse.json({
      success: true,
      data: deletionRequest || null,
    });
  } catch (error) {
    console.error('Get deletion status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
