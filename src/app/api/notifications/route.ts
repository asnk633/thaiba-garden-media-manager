import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

    // List notifications with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const readParam = searchParams.get('read');

    let query = db.select().from(notifications);

    // Build filter conditions
    const conditions = [];
    
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(notifications.userId, parseInt(userId)));
    }

    if (readParam !== null) {
      const readValue = readParam === 'true' || readParam === '1';
      conditions.push(eq(notifications.read, readValue));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, read, metadata } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!type || typeof type !== 'string' || type.trim() === '') {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    // Validate metadata if provided
    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata === 'string') {
        try {
          JSON.parse(metadata);
        } catch {
          return NextResponse.json(
            { error: 'metadata must be valid JSON', code: 'INVALID_METADATA' },
            { status: 400 }
          );
        }
      } else if (typeof metadata !== 'object') {
        return NextResponse.json(
          { error: 'metadata must be valid JSON', code: 'INVALID_METADATA' },
          { status: 400 }
        );
      }
    }

    // Prepare data for insertion
    const notificationData: any = {
      userId: parseInt(userId),
      type: type.trim(),
      title: title.trim(),
      message: message.trim(),
      read: read === true || read === 1 ? true : false,
      createdAt: new Date().toISOString(),
    };

    if (metadata !== undefined && metadata !== null) {
      notificationData.metadata = typeof metadata === 'string' 
        ? JSON.parse(metadata) 
        : metadata;
    }

    const newNotification = await db
      .insert(notifications)
      .values(notificationData)
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { userId, type, title, message, read, metadata } = body;

    // Validate fields if provided
    if (userId !== undefined) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
    }

    if (type !== undefined && (typeof type !== 'string' || type.trim() === '')) {
      return NextResponse.json(
        { error: 'type must be a non-empty string', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return NextResponse.json(
        { error: 'title must be a non-empty string', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    if (message !== undefined && (typeof message !== 'string' || message.trim() === '')) {
      return NextResponse.json(
        { error: 'message must be a non-empty string', code: 'INVALID_MESSAGE' },
        { status: 400 }
      );
    }

    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata === 'string') {
        try {
          JSON.parse(metadata);
        } catch {
          return NextResponse.json(
            { error: 'metadata must be valid JSON', code: 'INVALID_METADATA' },
            { status: 400 }
          );
        }
      } else if (typeof metadata !== 'object') {
        return NextResponse.json(
          { error: 'metadata must be valid JSON', code: 'INVALID_METADATA' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (userId !== undefined) {
      updateData.userId = parseInt(userId);
    }
    if (type !== undefined) {
      updateData.type = type.trim();
    }
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (message !== undefined) {
      updateData.message = message.trim();
    }
    if (read !== undefined) {
      updateData.read = read === true || read === 1 ? true : false;
    }
    if (metadata !== undefined) {
      if (metadata === null) {
        updateData.metadata = null;
      } else {
        updateData.metadata = typeof metadata === 'string' 
          ? JSON.parse(metadata) 
          : metadata;
      }
    }

    const updated = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const readParam = searchParams.get('read');

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

    // Determine read value
    const readValue = readParam === 'true' || readParam === '1' ? true : false;

    const updated = await db
      .update(notifications)
      .set({ read: readValue })
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
        notification: deleted[0],
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