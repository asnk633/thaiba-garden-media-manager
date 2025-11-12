import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest, isAdmin } from '../_lib/auth';

// --- GET Request Handler (Fetch notifications for current user) ---
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const read = searchParams.get('read');

    const conditions: any[] = [eq(notifications.userId, user.id)];

    // Filter by read status if provided
    if (read !== null) {
      const isRead = read === 'true';
      conditions.push(eq(notifications.read, isRead));
    }

    const notificationsList = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json({ data: notificationsList }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- POST Request Handler (Create notification - admin only) ---
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can create notifications
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only admins can create notifications' },
        { status: 403 }
      );
    }

    const { userId, type, title, message, metadata } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const createdAt = new Date().toISOString();

    const inserted = await db
      .insert(notifications)
      .values({
        createdAt,
        title,
        userId,
        message,
        type,
        read: false,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- PATCH Request Handler (Update an existing notification) ---
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only allow specific updates
    const safeUpdates: any = {};
    if (updates.read !== undefined) safeUpdates.read = !!updates.read;
    if (updates.title) safeUpdates.title = updates.title;
    if (updates.message) safeUpdates.message = updates.message;
    if (updates.type) safeUpdates.type = updates.type;
    if (updates.metadata) safeUpdates.metadata = updates.metadata;

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_VALID_FIELDS' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(notifications)
      .set({ ...safeUpdates, updatedAt: new Date().toISOString() })
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler (Delete an existing notification) ---
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Notification deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}