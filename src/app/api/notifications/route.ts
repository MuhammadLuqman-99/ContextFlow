import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth/helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications/read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
      }
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', notificationIds);

      if (error) {
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
      }
    } else if (notificationId) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('id', notificationId);

      if (error) {
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to create a notification (for use in other API routes)
export async function createNotification(
  userId: string,
  type: 'webhook' | 'suggestion' | 'subscription' | 'team' | 'system',
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    data: data || {},
  });

  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }

  return true;
}
