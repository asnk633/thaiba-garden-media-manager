import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, institutions } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_ROLES = ['admin', 'team', 'guest'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Remove passwordHash from response
      const { passwordHash, ...userWithoutPassword } = user[0];
      return NextResponse.json(userWithoutPassword, { status: 200 });
    }

    // List users with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const institutionId = searchParams.get('institutionId');

    let query = db.select().from(users);

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    if (role) {
      if (!VALID_ROLES.includes(role as any)) {
        return NextResponse.json(
          { error: 'Invalid role filter', code: 'INVALID_ROLE_FILTER' },
          { status: 400 }
        );
      }
      conditions.push(eq(users.role, role));
    }

    if (institutionId) {
      if (isNaN(parseInt(institutionId))) {
        return NextResponse.json(
          { error: 'Invalid institution ID', code: 'INVALID_INSTITUTION_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(users.institutionId, parseInt(institutionId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Remove passwordHash from all results
    const usersWithoutPasswords = results.map(({ passwordHash, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords, { status: 200 });
  } catch (error: any) {
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
    const { email, passwordHash, fullName, avatarUrl, role, institutionId } = body;

    // Validation
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!passwordHash || typeof passwordHash !== 'string' || passwordHash.trim() === '') {
      return NextResponse.json(
        { error: 'Password hash is required', code: 'MISSING_PASSWORD_HASH' },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      return NextResponse.json(
        { error: 'Full name is required', code: 'MISSING_FULL_NAME' },
        { status: 400 }
      );
    }

    if (!role || !VALID_ROLES.includes(role as any)) {
      return NextResponse.json(
        { error: 'Role must be one of: admin, team, guest', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    if (!institutionId || isNaN(parseInt(institutionId))) {
      return NextResponse.json(
        { error: 'Valid institution ID is required', code: 'INVALID_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Validate institution exists
    const institution = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, parseInt(institutionId)))
      .limit(1);

    if (institution.length === 0) {
      return NextResponse.json(
        { error: 'Institution not found', code: 'INSTITUTION_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_ALREADY_EXISTS' },
        { status: 400 }
      );
    }

    // Prepare data
    const now = new Date().toISOString();
    const userData = {
      email: email.trim().toLowerCase(),
      passwordHash: passwordHash.trim(),
      fullName: fullName.trim(),
      avatarUrl: avatarUrl ? avatarUrl.trim() : null,
      role: role,
      institutionId: parseInt(institutionId),
      createdAt: now,
      updatedAt: now,
    };

    // Insert user
    const newUser = await db.insert(users).values(userData).returning();

    if (newUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create user', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser[0];
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
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

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, passwordHash, fullName, avatarUrl, role, institutionId } = body;

    // Validate fields if provided
    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim() === '') {
        return NextResponse.json(
          { error: 'Email must be a non-empty string', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      const emailCheck = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim().toLowerCase()))
        .limit(1);

      if (emailCheck.length > 0 && emailCheck[0].id !== parseInt(id)) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'EMAIL_ALREADY_EXISTS' },
          { status: 400 }
        );
      }
    }

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim() === '') {
        return NextResponse.json(
          { error: 'Full name must be a non-empty string', code: 'INVALID_FULL_NAME' },
          { status: 400 }
        );
      }
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role as any)) {
        return NextResponse.json(
          { error: 'Role must be one of: admin, team, guest', code: 'INVALID_ROLE' },
          { status: 400 }
        );
      }
    }

    if (institutionId !== undefined) {
      if (isNaN(parseInt(institutionId))) {
        return NextResponse.json(
          { error: 'Institution ID must be a valid integer', code: 'INVALID_INSTITUTION_ID' },
          { status: 400 }
        );
      }

      // Validate institution exists
      const institution = await db
        .select()
        .from(institutions)
        .where(eq(institutions.id, parseInt(institutionId)))
        .limit(1);

      if (institution.length === 0) {
        return NextResponse.json(
          { error: 'Institution not found', code: 'INSTITUTION_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (passwordHash !== undefined) updateData.passwordHash = passwordHash.trim();
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl ? avatarUrl.trim() : null;
    if (role !== undefined) updateData.role = role;
    if (institutionId !== undefined) updateData.institutionId = parseInt(institutionId);

    // Update user
    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = updated[0];
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error: any) {
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

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user
    const deleted = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = deleted[0];
    return NextResponse.json(
      {
        message: 'User deleted successfully',
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}