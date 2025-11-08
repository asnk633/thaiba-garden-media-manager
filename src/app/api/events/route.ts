import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq, like, and, or, gte, lte, desc } from 'drizzle-orm';
import { getUserFromRequest, hasRole, isAdmin } from '../_lib/auth';

// --- GET Request Handler ---
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single event fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, parseInt(id)))
        .limit(1);

      if (event.length === 0) {
        return NextResponse.json(
          { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(event[0], { status: 200 });
    }

    // List events with filtering, search, and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const conditions = [eq(events.institutionId, user.institutionId)];

    // Non-admin users only see approved events
    if (!isAdmin(user)) {
      conditions.push(eq(events.approvalStatus, 'approved'));
    }

    // Search filter (title only to avoid nullable description issues)
    if (search) {
      conditions.push(like(events.title, `%${search}%`));
    }

    // Date range filters
    if (from) {
      conditions.push(gte(events.startTime, from));
    }

    if (to) {
      conditions.push(lte(events.endTime, to));
    }

    let query = db.select().from(events);

    if (conditions.length > 0) {
      // Avoid complex generic mismatch from drizzle select types by casting.
      query = (query.where(and(...conditions)) as unknown) as any;
    }

    const results = await query
      .orderBy(desc(events.startTime))
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

// --- POST Request Handler ---
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only team and admin can create events
    if (!hasRole(user, ['admin', 'team'])) {
      return NextResponse.json(
        { error: 'Only team members and admins can create events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startTime, endTime } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!startTime || typeof startTime !== 'string') {
      return NextResponse.json(
        { error: 'Start time (ISO format) is required' },
        { status: 400 }
      );
    }

    if (!endTime || typeof endTime !== 'string') {
      return NextResponse.json(
        { error: 'End time (ISO format) is required' },
        { status: 400 }
      );
    }
    
    // Validate timestamps
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);

    if (isNaN(startTimeDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start time format' },
        { status: 400 }
      );
    }

    if (isNaN(endTimeDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid end time format' },
        { status: 400 }
      );
    }

    // Validate end time is after start time
    if (endTimeDate <= startTimeDate) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Admin events are auto-approved, team events need approval
    const approvalStatus = isAdmin(user) ? 'approved' : 'pending';

    const newEvents = await db
      .insert(events)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        startTime: startTimeDate.toISOString(),
        endTime: endTimeDate.toISOString(),
        approvalStatus,
        createdById: user.id,
        institutionId: user.institutionId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ data: newEvents[0] }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- PUT Request Handler ---
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, startTime, endTime } = body;
    
    // Check if event exists
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(id)));

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only creator or admin can update
    if (existingEvent.createdById !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: any = { updatedAt: new Date().toISOString() };

    // Validate and prepare updates
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (startTime !== undefined) {
      const startTimeDate = new Date(startTime);
      if (isNaN(startTimeDate.getTime())) {
        return NextResponse.json({ error: 'Invalid start time format' }, { status: 400 });
      }
      updates.startTime = startTimeDate.toISOString();
    }

    if (endTime !== undefined) {
      const endTimeDate = new Date(endTime);
      if (isNaN(endTimeDate.getTime())) {
        return NextResponse.json({ error: 'Invalid end time format' }, { status: 400 });
      }
      updates.endTime = endTimeDate.toISOString();
    }

    if (Object.keys(updates).length === 1) { // Only updatedAt
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedEvents = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, parseInt(id)))
      .returning();

    return NextResponse.json({ data: updatedEvents[0] }, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler ---
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400 });
    }

    // Check if event exists
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(id)));

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only creator or admin can delete
    if (existingEvent.createdById !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(events).where(eq(events.id, parseInt(id)));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}