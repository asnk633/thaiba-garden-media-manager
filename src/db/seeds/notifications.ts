import { db } from '@/db';
import { notifications } from '@/db/schema';

async function main() {
    const sampleNotifications = [
        {
            userId: 3,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: 'You have been assigned to \'Design new social media campaign\'',
            read: 0,
            metadata: JSON.stringify({ taskId: 1 }),
            createdAt: new Date().toISOString(),
        },
        {
            userId: 4,
            type: 'task_due',
            title: 'Task Due Soon',
            message: 'Task \'Update website content\' is due in 2 days',
            read: 0,
            metadata: JSON.stringify({ taskId: 2 }),
            createdAt: new Date().toISOString(),
        },
        {
            userId: 5,
            type: 'task_urgent',
            title: 'Urgent Task',
            message: 'Urgent task \'Create video content for Instagram\' needs attention',
            read: 1,
            metadata: JSON.stringify({ taskId: 3 }),
            createdAt: new Date().toISOString(),
        },
        {
            userId: 1,
            type: 'guest_task_created',
            title: 'Guest Created Task',
            message: 'Guest One created a new task \'Photography for new products\'',
            read: 0,
            metadata: JSON.stringify({ taskId: 8, guestId: 6 }),
            createdAt: new Date().toISOString(),
        },
        {
            userId: 2,
            type: 'task_completed',
            title: 'Task Completed',
            message: 'Task \'Social media audit\' has been completed',
            read: 1,
            metadata: JSON.stringify({ taskId: 10 }),
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(notifications).values(sampleNotifications);
    
    console.log('✅ Notifications seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});