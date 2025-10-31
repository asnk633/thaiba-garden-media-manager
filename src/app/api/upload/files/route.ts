import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { files } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedById = formData.get('uploadedById') as string;
    const institutionId = formData.get('institutionId') as string;
    const folder = formData.get('folder') as string | null;
    const visibility = formData.get('visibility') as string;

    if (!file || !uploadedById || !institutionId || !visibility) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate visibility
    if (!['all', 'team', 'guest'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Convert file to base64 data URL (fallback storage)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Insert file record
    const newFile = await db.insert(files).values({
      name: file.name,
      fileUrl: dataUrl,
      fileType: file.type,
      fileSize: file.size,
      folder: folder || null,
      visibility,
      uploadedById: parseInt(uploadedById),
      institutionId: parseInt(institutionId),
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newFile[0], { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
