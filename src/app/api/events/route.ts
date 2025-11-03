import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Assumes Drizzle ORM connection
import { events } from '@/db/schema'; // Assumes Drizzle schema definition
import { eq, like, and, or, gte, lte, desc } from 'drizzle-orm';

// --- GET Request Handler ---
export async function GET(request: NextRequest) {
  try {
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
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const institutionId = searchParams.get('institutionId');
    const createdById = searchParams.get('createdById');

    // Integrated filters from the second script, mapping 'from'/'to' to 'startDate'/'endDate' logic
    const from = searchParams.get('from'); // Maps to startDate
    const to = searchParams.get('to');     // Maps to endDate

    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(events.title, `%${search}%`),
          like(events.description, `%${search}%`)
        )
      );
    }

    // Institution filter
    if (institutionId && !isNaN(parseInt(institutionId))) {
      conditions.push(eq(events.institutionId, parseInt(institutionId)));
    }

    // Created by filter
    if (createdById && !isNaN(parseInt(createdById))) {
      conditions.push(eq(events.createdById, parseInt(createdById)));
    }

    // Date range filters (using 'from' and 'to' from the second script, applied to events.startTime)
    if (from) {
      conditions.push(gte(events.startTime, from));
    }

    if (to) {
      conditions.push(lte(events.endTime, to)); // Using endTime for the 'to' filter is more inclusive
    }

    let query = db.select().from(events);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
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
    const body = await request.json();
    // Combined properties, using Drizzle's 'startTime/endTime' but accommodating 'startAt/endAt' naming from the second script
    const { 
        title, 
        description, 
        startTime, 
        endTime, 
        startAt, // Alias from second script
        endAt,   // Alias from second script
        createdById, 
        institutionId,
        location, // Added from second script
        visibility // Added from second script
    } = body;

    const finalStartTime = startTime || startAt;
    const finalEndTime = endTime || endAt;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!finalStartTime || typeof finalStartTime !== 'string') {
      return NextResponse.json(
        { error: 'Start time (`startTime` or `startAt` ISO) is required', code: 'MISSING_START_TIME' },
        { status: 400 }
      );
    }

    // Note: The second script allowed endAt to be null. We'll make it optional here.
    
    // Validate timestamps
    const startTimeDate = new Date(finalStartTime);
    const endTimeDate = finalEndTime ? new Date(finalEndTime) : null;

    if (isNaN(startTimeDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start time format', code: 'INVALID_START_TIME' },
        { status: 400 }
      );
    }

    if (endTimeDate && isNaN(endTimeDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid end time format', code: 'INVALID_END_TIME' },
        { status: 400 }
      );
    }

    // Validate end time is after start time (if provided)
    if (endTimeDate && endTimeDate <= startTimeDate) {
      return NextResponse.json(
        { error: 'End time must be after start time', code: 'INVALID_TIME_RANGE' },
        { status: 400 }
      );
    }

    if (!createdById || isNaN(parseInt(createdById.toString()))) {
      return NextResponse.json(
        { error: 'Valid created by ID is required', code: 'MISSING_CREATED_BY_ID' },
        { status: 400 }
      );
    }

    if (!institutionId || isNaN(parseInt(institutionId.toString()))) {
      return NextResponse.json(
        { error: 'Valid institution ID is required', code: 'MISSING_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    const newEvent = await db
      .insert(events)
      .values({
        title: title.trim(),
        description: description ? description.trim() : null,
        startTime: startTimeDate.toISOString(),
        endTime: endTimeDate ? endTimeDate.toISOString() : null, // Allowing null end time
        createdById: parseInt(createdById.toString()),
        institutionId: parseInt(institutionId.toString()),
        // Integrating new fields from the second script
        location: location ?? '', // Default to empty string
        visibility: visibility ?? 'team', // Default to 'team'
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newEvent[0], { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
        title, 
        description, 
        startTime, 
        endTime, 
        startAt, 
        endAt, 
        createdById, 
        institutionId,
        location,
        visibility
    } = body;
    
    // Use aliases if primary names aren't present
    const updateStartTime = startTime || startAt;
    const updateEndTime = endTime || endAt;

    // Check if event exists
    const existingEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(id)))
      .limit(1);

    if (existingEvent.length === 0) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: any = {};

    // Validate and prepare updates
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (updateStartTime !== undefined) {
      const startTimeDate = new Date(updateStartTime);
      if (isNaN(startTimeDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start time format', code: 'INVALID_START_TIME' },
          { status: 400 }
        );
      }
      updates.startTime = startTimeDate.toISOString();
    }

    if (updateEndTime !== undefined) {
      const endTimeDate = updateEndTime ? new Date(updateEndTime) : null;
      if (updateEndTime !== null && endTimeDate && isNaN(endTimeDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end time format', code: 'INVALID_END_TIME' },
          { status: 400 }
        );
      }
      updates.endTime = endTimeDate ? endTimeDate.toISOString() : null;
    }
    
    // Integrate new fields
    if (location !== undefined) {
        updates.location = location ?? '';
    }
    
    if (visibility !== undefined) {
        updates.visibility = visibility ?? 'team';
    }


    // Validate time range if both times are being updated or one is being updated
    // Use the updated value or the existing one
    const finalStartTime = updates.startTime || existingEvent[0].startTime;
    const finalEndTime = updates.endTime || existingEvent[0].endTime;

    if (finalEndTime && new Date(finalEndTime) <= new Date(finalStartTime)) {
      return NextResponse.json(
        { error: 'End time must be after start time', code: 'INVALID_TIME_RANGE' },
        { status: 400 }
      );
    }

    if (createdById !== undefined) {
      if (isNaN(parseInt(createdById.toString()))) {
        return NextResponse.json(
          { error: 'Invalid created by ID', code: 'INVALID_CREATED_BY_ID' },
          { status: 400 }
        );
      }
      updates.createdById = parseInt(createdById.toString());
    }

    if (institutionId !== undefined) {
      if (isNaN(parseInt(institutionId.toString()))) {
        return NextResponse.json(
          { error: 'Invalid institution ID', code: 'INVALID_INSTITUTION_ID' },
          { status: 400 }
        );
      }
      updates.institutionId = parseInt(institutionId.toString());
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updatedEvent = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedEvent[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler ---
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

    // Check if event exists
    const existingEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(id)))
      .limit(1);

    if (existingEvent.length === 0) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(events)
      .where(eq(events.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Event deleted successfully',
        event: deleted[0],
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