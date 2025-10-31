import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Attendance record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const institutionId = searchParams.get('institutionId');
    const date = searchParams.get('date');

    let query = db.select().from(attendance);

    // Build filter conditions
    const conditions = [];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(attendance.userId, parseInt(userId)));
    }

    if (institutionId) {
      if (isNaN(parseInt(institutionId))) {
        return NextResponse.json(
          { error: 'Valid institutionId is required', code: 'INVALID_INSTITUTION_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(attendance.institutionId, parseInt(institutionId)));
    }

    if (date) {
      try {
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return NextResponse.json(
            { error: 'Valid ISO date is required', code: 'INVALID_DATE' },
            { status: 400 }
          );
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        conditions.push(gte(attendance.checkIn, startOfDay.toISOString()));
        conditions.push(lte(attendance.checkIn, endOfDay.toISOString()));
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date format', code: 'INVALID_DATE_FORMAT' },
          { status: 400 }
        );
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, institutionId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required', code: 'MISSING_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Validate field types
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(institutionId))) {
      return NextResponse.json(
        { error: 'Valid institutionId is required', code: 'INVALID_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Auto-generate timestamps
    const currentTimestamp = new Date().toISOString();

    const newAttendance = await db
      .insert(attendance)
      .values({
        userId: parseInt(userId),
        institutionId: parseInt(institutionId),
        checkIn: currentTimestamp,
        checkOut: null,
        createdAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(newAttendance[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
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

    // Check if record exists
    const existing = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Handle checkOut timestamp
    if (body.checkOut !== undefined) {
      if (body.checkOut === null) {
        updates.checkOut = null;
      } else {
        try {
          const checkOutDate = new Date(body.checkOut);
          if (isNaN(checkOutDate.getTime())) {
            return NextResponse.json(
              { error: 'Valid ISO timestamp required for checkOut', code: 'INVALID_CHECK_OUT' },
              { status: 400 }
            );
          }
          updates.checkOut = body.checkOut;
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid checkOut timestamp format', code: 'INVALID_CHECK_OUT_FORMAT' },
            { status: 400 }
          );
        }
      }
    }

    // Allow updating checkIn if provided
    if (body.checkIn !== undefined) {
      try {
        const checkInDate = new Date(body.checkIn);
        if (isNaN(checkInDate.getTime())) {
          return NextResponse.json(
            { error: 'Valid ISO timestamp required for checkIn', code: 'INVALID_CHECK_IN' },
            { status: 400 }
          );
        }
        updates.checkIn = body.checkIn;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid checkIn timestamp format', code: 'INVALID_CHECK_IN_FORMAT' },
          { status: 400 }
        );
      }
    }

    // Allow updating userId and institutionId if provided
    if (body.userId !== undefined) {
      if (isNaN(parseInt(body.userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      updates.userId = parseInt(body.userId);
    }

    if (body.institutionId !== undefined) {
      if (isNaN(parseInt(body.institutionId))) {
        return NextResponse.json(
          { error: 'Valid institutionId is required', code: 'INVALID_INSTITUTION_ID' },
          { status: 400 }
        );
      }
      updates.institutionId = parseInt(body.institutionId);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(attendance)
      .set(updates)
      .where(eq(attendance.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
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

    // Check if record exists
    const existing = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(attendance)
      .where(eq(attendance.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Attendance record deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}