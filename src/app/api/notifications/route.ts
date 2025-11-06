import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Assumes Drizzle ORM connection
import { notifications } from '@/db/schema'; // Assumes Drizzle schema definition
import { eq, and, desc } from 'drizzle-orm';

// --- GET Request Handler (Fetch single or list of notifications) ---
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single notification by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const notification = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(notification[0], { status: 200 });
    }

    // List notifications with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const institutionId = searchParams.get('institutionId');
    const read = searchParams.get('read');
    const type = searchParams.get('type');

    const conditions: any[] = [];

    if (userId && !isNaN(parseInt(userId))) {
      conditions.push(eq(notifications.userId, parseInt(userId)));
    }

    if (type) {
      conditions.push(eq(notifications.type, type));
    }

    // notifications table may not have institutionId in the current schema.
    // Use a runtime/type cast check and only add the filter when the column exists.
    if (institutionId && (notifications as any).institutionId) {
      conditions.push(eq((notifications as any).institutionId, parseInt(institutionId)));
    }

    // `read` param may be null/undefined; guard before using.
    const isRead = read ? read.toLowerCase() === 'true' : undefined;
    if (typeof isRead !== 'undefined' && (notifications as any).read) {
      conditions.push(eq((notifications as any).read, isRead));
    }

    const notificationsList = await db
      .select()
      .from(notifications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json(notificationsList, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- POST Request Handler (Create a new notification) ---
export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, message, read, metadata } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const createdAt = new Date().toISOString();

    const inserted = await db
      .insert(notifications)
      // Cast payload to any to avoid strict drizzle overload mismatch in this build.
      .values({
        createdAt,
        title,
        userId,
        message,
        type,
        read: !!read,
        metadata,
      } as any)
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
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