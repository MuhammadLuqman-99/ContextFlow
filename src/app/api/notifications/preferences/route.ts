import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth/helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications/preferences - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Return defaults if no preferences exist
    const preferences = data || {
      email_notifications: true,
      email_webhook_updates: true,
      email_suggestions: true,
      email_billing: true,
      email_marketing: false,
      push_notifications: true,
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email_notifications,
      email_webhook_updates,
      email_suggestions,
      email_billing,
      email_marketing,
      push_notifications,
    } = body;

    // Upsert preferences
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_notifications: email_notifications ?? true,
        email_webhook_updates: email_webhook_updates ?? true,
        email_suggestions: email_suggestions ?? true,
        email_billing: email_billing ?? true,
        email_marketing: email_marketing ?? false,
        push_notifications: push_notifications ?? true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
