import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, notifications, files } from '@/db/schema';

export async function GET(request: NextRequest) {
  const checks = {
    database: false,
    notifications: false,
    storage: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connectivity
    try {
      const dbCheck = await db.select().from(users).limit(1);
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check notifications system
    try {
      const notifCheck = await db.select().from(notifications).limit(1);
      checks.notifications = true;
    } catch (error) {
      console.error('Notifications health check failed:', error);
    }

    // Check storage/files system
    try {
      const storageCheck = await db.select().from(files).limit(1);
      checks.storage = true;
    } catch (error) {
      console.error('Storage health check failed:', error);
    }

    // Determine overall status
    const allHealthy = checks.database && checks.notifications && checks.storage;
    const status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(
      {
        status,
        checks,
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        checks,
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
