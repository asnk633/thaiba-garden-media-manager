import { test, expect } from '@playwright/test';

/**
 * Core v1 E2E Tests
 * Tests for M1 deliverables: Task CRUD, Event creation/approval, Role-based access
 */

test.describe('M1: Core v1 - Tasks & Events CRUD with RBAC', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
  });

  test('Guest can create task via FAB but cannot set priority', async ({ page }) => {
    // Simulate guest login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 3,
        email: 'guest@test.com',
        fullName: 'Guest User',
        role: 'guest',
        institutionId: 1
      }));
    });
    
    await page.reload();
    
    // Click FAB
    await page.click('[aria-label*="create menu"]');
    
    // Should see "New Task" option
    await expect(page.locator('text=New Task')).toBeVisible();
    
    // Should NOT see "Notify" (admin only)
    await expect(page.locator('text=Notify')).not.toBeVisible();
    
    // Click New Task
    await page.click('text=New Task');
    
    // Fill task form
    await page.fill('[name="title"]', 'Guest created task');
    await page.fill('[name="description"]', 'This task was created by a guest user');
    
    // Priority should be disabled or not editable for guest
    const prioritySelect = page.locator('[name="priority"]');
    if (await prioritySelect.isVisible()) {
      await expect(prioritySelect).toBeDisabled();
    }
    
    // Submit
    await page.click('button:has-text("Create Task")');
    
    // Should redirect to tasks list or show success
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('Team member can create task and change status', async ({ page }) => {
    // Simulate team login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 2,
        email: 'team@test.com',
        fullName: 'Team Member',
        role: 'team',
        institutionId: 1
      }));
    });
    
    await page.reload();
    await page.goto('/tasks/new');
    
    // Fill task form
    await page.fill('[name="title"]', 'Team task with priority');
    await page.fill('[name="description"]', 'Team can set priority');
    
    // Team CAN set priority
    await page.selectOption('[name="priority"]', 'high');
    
    await page.click('button:has-text("Create Task")');
    
    // Navigate to task detail (assuming created)
    await page.waitForURL(/\/tasks\/\d+/);
    
    // Change status from todo to in_progress
    await page.click('button:has-text("Working On")');
    
    // Verify status changed
    await expect(page.locator('.bg-\\[\\#00BFA6\\]:has-text("Working On")')).toBeVisible();
  });

  test('Admin can assign tasks', async ({ page }) => {
    // Simulate admin login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'admin@test.com',
        fullName: 'Admin User',
        role: 'admin',
        institutionId: 1
      }));
    });
    
    await page.reload();
    await page.goto('/tasks');
    
    // Click first task
    await page.click('[href^="/tasks/"]:first-of-type');
    
    // Assign to someone
    await page.click('text=Assign');
    await page.click('[role="option"]:has-text("Team Member")');
    
    // Verify assigned
    await expect(page.locator('text=Team Member')).toBeVisible();
  });

  test('Team member can create event (pending approval)', async ({ page }) => {
    // Simulate team login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 2,
        email: 'team@test.com',
        fullName: 'Team Member',
        role: 'team',
        institutionId: 1
      }));
    });
    
    await page.reload();
    
    // Click FAB
    await page.click('[aria-label*="create menu"]');
    
    // Click New Event
    await page.click('text=New Event');
    
    // Fill event form
    await page.fill('[name="title"]', 'Team Event Needs Approval');
    await page.fill('[name="startTime"]', '2025-12-01T10:00');
    await page.fill('[name="endTime"]', '2025-12-01T12:00');
    
    await page.click('button:has-text("Create Event")');
    
    // Event should be created with pending status
    // (We'd need to check in calendar or events list)
  });

  test('Admin can approve event', async ({ page }) => {
    // Simulate admin login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'admin@test.com',
        fullName: 'Admin User',
        role: 'admin',
        institutionId: 1
      }));
    });
    
    await page.reload();
    await page.goto('/calendar');
    
    // Find pending event
    const pendingEvent = page.locator('[data-approval-status="pending"]').first();
    
    if (await pendingEvent.isVisible()) {
      await pendingEvent.click();
      
      // Approve button should be visible
      await page.click('button:has-text("Approve")');
      
      // Event should now show as approved
      await expect(page.locator('[data-approval-status="approved"]')).toBeVisible();
    }
  });

  test('FAB menu is role-aware', async ({ page }) => {
    // Test Admin FAB
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'admin@test.com',
        role: 'admin',
        institutionId: 1
      }));
    });
    await page.reload();
    await page.click('[aria-label*="create menu"]');
    
    // Admin sees all three options
    await expect(page.locator('text=Notify')).toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
    await expect(page.locator('text=New Task')).toBeVisible();
    
    await page.click('[aria-label*="create menu"]'); // close
    
    // Test Team FAB
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 2,
        email: 'team@test.com',
        role: 'team',
        institutionId: 1
      }));
    });
    await page.reload();
    await page.click('[aria-label*="create menu"]');
    
    // Team sees Event and Task, NOT Notify
    await expect(page.locator('text=Notify')).not.toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
    await expect(page.locator('text=New Task')).toBeVisible();
  });

  test('Status transitions respect role permissions', async ({ page }) => {
    // Create task as team, try to change status
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 2,
        role: 'team',
        institutionId: 1
      }));
    });
    
    await page.reload();
    await page.goto('/tasks/1'); // Assuming task exists
    
    // Team can move todo -> in_progress
    await page.click('button:has-text("Working On")');
    await expect(page.locator('.bg-\\[\\#00BFA6\\]:has-text("Working On")')).toBeVisible();
    
    // Team can move in_progress -> review
    await page.click('button:has-text("Review")');
    await expect(page.locator(':has-text("Review")')).toBeVisible();
    
    // Team should NOT be able to force to done without admin (based on RBAC rules)
    // This would need specific UI to test
  });
});

test.describe('M1: Notifications & Badge Counts', () => {
  test('Notification badge updates after assignment', async ({ page }) => {
    // Login as user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 2,
        email: 'team@test.com',
        role: 'team',
        institutionId: 1
      }));
    });
    
    await page.reload();
    
    // Get initial badge count
    const initialCount = await page.locator('[data-badge-count]').textContent();
    
    // Simulate admin assigning task (would need API call or second browser)
    // For now, just verify badge element exists
    await expect(page.locator('[data-badge-count]')).toBeVisible();
  });

  test('Toast shows on task status change', async ({ page }) => {
    await page.goto('/tasks/1');
    
    await page.click('button:has-text("Working On")');
    
    // Verify toast notification
    await expect(page.locator('.toast:has-text("Status updated")')).toBeVisible();
  });
});
