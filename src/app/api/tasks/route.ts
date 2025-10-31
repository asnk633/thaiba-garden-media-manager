import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, notifications, users } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single task by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, parseInt(id)))
        .limit(1);

      if (task.length === 0) {
        return NextResponse.json(
          { error: 'Task not found', code: 'TASK_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(task[0], { status: 200 });
    }

    // List tasks with filtering, search, and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedToId = searchParams.get('assignedToId');
    const institutionId = searchParams.get('institutionId');
    const sortField = searchParams.get('sort') ?? 'createdAt';
    const sortOrder = searchParams.get('order') ?? 'desc';

    let query = db.select().from(tasks);

    const conditions = [];

    // Search condition
    if (search) {
      conditions.push(
        or(
          like(tasks.title, `%${search}%`),
          like(tasks.description, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(tasks.status, status));
    }

    // Priority filter
    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return NextResponse.json(
          { 
            error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`, 
            code: 'INVALID_PRIORITY' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(tasks.priority, priority));
    }

    // AssignedToId filter
    if (assignedToId) {
      if (isNaN(parseInt(assignedToId))) {
        return NextResponse.json(
          { error: 'Valid assignedToId is required', code: 'INVALID_ASSIGNED_TO_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(tasks.assignedToId, parseInt(assignedToId)));
    }

    // InstitutionId filter
    if (institutionId) {
      if (isNaN(parseInt(institutionId))) {
        return NextResponse.json(
          { error: 'Valid institutionId is required', code: 'INVALID_INSTITUTION_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(tasks.institutionId, parseInt(institutionId)));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderBy = sortOrder === 'asc' ? tasks[sortField] : desc(tasks[sortField]);
    query = query.orderBy(orderBy);

    // Apply pagination
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
    const { 
      title, 
      description, 
      status, 
      priority, 
      assignedToId, 
      createdById, 
      institutionId, 
      dueDate 
    } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    if (!priority) {
      return NextResponse.json(
        { error: 'Priority is required', code: 'MISSING_PRIORITY' },
        { status: 400 }
      );
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { 
          error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`, 
          code: 'INVALID_PRIORITY' 
        },
        { status: 400 }
      );
    }

    if (!createdById || isNaN(parseInt(createdById))) {
      return NextResponse.json(
        { error: 'Valid createdById is required', code: 'MISSING_CREATED_BY_ID' },
        { status: 400 }
      );
    }

    if (!institutionId || isNaN(parseInt(institutionId))) {
      return NextResponse.json(
        { error: 'Valid institutionId is required', code: 'MISSING_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (assignedToId !== undefined && assignedToId !== null && isNaN(parseInt(assignedToId))) {
      return NextResponse.json(
        { error: 'Valid assignedToId must be an integer if provided', code: 'INVALID_ASSIGNED_TO_ID' },
        { status: 400 }
      );
    }

    // Validate dueDate format if provided
    if (dueDate && dueDate !== null) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid dueDate format. Must be a valid ISO timestamp', code: 'INVALID_DUE_DATE' },
          { status: 400 }
        );
      }
    }

    // Prepare task data
    const now = new Date().toISOString();
    const taskData = {
      title: title.trim(),
      description: description?.trim() || null,
      status,
      priority,
      assignedToId: assignedToId ? parseInt(assignedToId) : null,
      createdById: parseInt(createdById),
      institutionId: parseInt(institutionId),
      dueDate: dueDate || null,
      createdAt: now,
      updatedAt: now,
    };

    // Insert task
    const newTask = await db.insert(tasks).values(taskData).returning();

    // Check if creator is a guest - if so, notify all admins
    const creator = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(createdById)))
      .limit(1);

    if (creator.length > 0 && creator[0].role === 'guest') {
      // Find all admin users in the same institution
      const admins = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, 'admin'),
            eq(users.institutionId, parseInt(institutionId))
          )
        );

      // Create notification for each admin
      const notificationPromises = admins.map((admin) =>
        db.insert(notifications).values({
          userId: admin.id,
          type: 'GUEST_TASK_CREATED',
          title: 'New Guest Task Request',
          message: `${creator[0].fullName} created a task: "${title.trim()}"`,
          metadata: JSON.stringify({
            taskId: newTask[0].id,
            createdBy: creator[0].fullName,
            createdById: creator[0].id,
          }),
          isRead: false,
          createdAt: now,
        }).returning()
      );

      await Promise.all(notificationPromises);
    }

    return NextResponse.json(newTask[0], { status: 201 });
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
    const { searchParams } = new URL(request.url);
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
      status, 
      priority, 
      assignedToId, 
      createdById, 
      institutionId, 
      dueDate 
    } = body;

    // Check if task exists
    const existingTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, parseInt(id)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate fields if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return NextResponse.json(
        { error: 'Title must be a non-empty string if provided', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { 
          error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`, 
          code: 'INVALID_PRIORITY' 
        },
        { status: 400 }
      );
    }

    if (assignedToId !== undefined && assignedToId !== null && isNaN(parseInt(assignedToId))) {
      return NextResponse.json(
        { error: 'Valid assignedToId must be an integer if provided', code: 'INVALID_ASSIGNED_TO_ID' },
        { status: 400 }
      );
    }

    if (createdById !== undefined && isNaN(parseInt(createdById))) {
      return NextResponse.json(
        { error: 'Valid createdById must be an integer if provided', code: 'INVALID_CREATED_BY_ID' },
        { status: 400 }
      );
    }

    if (institutionId !== undefined && isNaN(parseInt(institutionId))) {
      return NextResponse.json(
        { error: 'Valid institutionId must be an integer if provided', code: 'INVALID_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    if (dueDate !== undefined && dueDate !== null) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid dueDate format. Must be a valid ISO timestamp', code: 'INVALID_DUE_DATE' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId ? parseInt(assignedToId) : null;
    if (createdById !== undefined) updateData.createdById = parseInt(createdById);
    if (institutionId !== undefined) updateData.institutionId = parseInt(institutionId);
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;

    // Update task
    const updatedTask = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedTask[0], { status: 200 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, parseInt(id)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete task
    const deletedTask = await db
      .delete(tasks)
      .where(eq(tasks.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Task deleted successfully',
        task: deletedTask[0],
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