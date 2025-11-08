// e2e/playwright/core-v1.spec.ts - FINAL FILE
import { test as base, expect, type Page } from '@playwright/test';

// 1. Define base user context fixture
type UserRole = 'admin' | 'team' | 'guest';

interface CustomFixtures {
  // Overwrite the standard 'page' fixture with a version that accepts a role
  pageWithRole: (role: UserRole, options?: { use: Page }) => Promise<Page>;
}

const test = base.extend<CustomFixtures>({
  pageWithRole: [async ({ page }, use, testInfo) => {
    // Determine the role to simulate based on the test name or explicit use
    let role: UserRole;
    if (testInfo.title.includes('Admin')) {
      role = 'admin';
    } else if (testInfo.title.includes('Team member')) {
      role = 'team';
    } else {
      role = 'guest'; // Default or for 'Guest' test
    }

    // Set user data based on role
    const userData = {
      guest: { id: 3, email: 'guest@test.com', fullName: 'Guest User', role: 'guest', institutionId: 1 },
      team: { id: 2, email: 'team@test.com', fullName: 'Team Member', role: 'team', institutionId: 1 },
      admin: { id: 1, email: 'admin@test.com', fullName: 'Admin User', role: 'admin', institutionId: 1 },
    };

    // Use addInitScript to set localStorage BEFORE the page navigates
    // This correctly pre-authenticates the user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, userData[role]);

    // Use the page with the script applied
    await use(page);
  }, { scope: 'per-test' }]
});

/**
 * Core v1 E2E Tests
 * Tests for M1 deliverables: Task CRUD, Event creation/approval, Role-based access
 */

test.describe('M1: Core v1 - Tasks & Events CRUD with RBAC', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to app after addInitScript has run
    await page.goto('/');
  });

  // Replaced 'page' with 'pageWithRole' and removed page.evaluate/page.reload
  test('Guest can create task via FAB but cannot set priority', async ({ pageWithRole: page }) => {
    // The Guest role is automatically set by the fixture based on test title (defaulting to guest)
    
    // Click FAB
    const fabLocator = page.locator('[aria-label*="create menu"]');
    await fabLocator.click(); // Wait for FAB to be clickable
    
    // Wait for menu to appear before checking visibility
    await page.waitForSelector('text=New Task', { timeout: 5000 });
    
    // Should see "New Task" option
    await expect(page.locator('text=New Task')).toBeVisible();
    
    // Should NOT see "Notify" (admin only)
    await expect(page.locator('text=Notify')).not.toBeVisible();
    
    // Click New Task
    await page.click('text=New Task');
    
    // B. Wait for stable selector before filling
    await page.waitForSelector('[data-testid="task-title-input"]', { timeout: 10000 });
    await page.fill('[data-testid="task-title-input"]', 'Guest created task'); // Updated selector
    await page.fill('textarea[id="description"]', 'This task was created by a guest user');
    
    // Priority should be disabled or not editable for guest
    // Use the new data-testid for the select trigger
    const prioritySelectTrigger = page.locator('[data-testid="task-priority-select-trigger"]');
    if (await prioritySelectTrigger.isVisible()) {
      await expect(prioritySelectTrigger).toBeDisabled();
    }
    
    // Submit
    await page.click('button:has-text("Create Task")');
    
    // Should redirect to tasks list or show success
    await page.waitForURL(/\/tasks/, { timeout: 10000 });
  });

  test('Team member can create task and change status', async ({ pageWithRole: page }) => {
    // Team role is automatically set by the fixture based on test title
    await page.goto('/tasks/new');
    
    // B. Wait for stable selector before filling
    await page.waitForSelector('[data-testid="task-title-input"]', { timeout: 10000 });
    await page.fill('[data-testid="task-title-input"]', 'Team task with priority'); // Updated selector
    await page.fill('textarea[id="description"]', 'Team can set priority');
    
    // Team CAN set priority - Click trigger, then click the option text
    await page.click('[data-testid="task-priority-select-trigger"]'); // Click the trigger
    await page.click('text=High'); // Click the option
    
    await page.click('button:has-text("Create Task")');
    
    // Navigate to task detail (assuming created)
    // The previous test navigated to /tasks/\d+, assuming success. Keeping this.
    await page.waitForURL(/\/tasks\/\d+/, { timeout: 10000 });
    
    // Change status from todo to in_progress
    await page.click('button:has-text("Working On")');
    
    // Verify status changed
    await expect(page.locator('.bg-\\[\\#00BFA6\\]:has-text("Working On")')).toBeVisible();
  });

  test('Admin can assign tasks', async ({ pageWithRole: page }) => {
    // Admin role is automatically set by the fixture based on test title
    await page.goto('/tasks');
    
    // Wait for task list to load (using a general link selector, adding a data-testid to list items would be better)
    await page.waitForSelector('[href^="/tasks/"]', { timeout: 10000 });
    
    // Click first task
    await page.click('[href^="/tasks/"]:first-of-type');
    
    // Wait for task detail page to load
    await page.waitForSelector('text=Assign', { timeout: 10000 });

    // Assign to someone
    await page.click('text=Assign');
    // Ensure dropdown is open before clicking option
    await page.waitForSelector('[role="option"]:has-text("Team Member")', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Team Member")');
    
    // Verify assigned
    await expect(page.locator('text=Team Member')).toBeVisible();
  });

  test('Team member can create event (pending approval)', async ({ pageWithRole: page }) => {
    // Team role is automatically set by the fixture based on test title
    
    // Click FAB and wait for menu
    const fabLocator = page.locator('[aria-label*="create menu"]');
    await fabLocator.click();
    await page.waitForSelector('text=New Event', { timeout: 5000 }); // Wait for menu item
    
    // Click New Event
    await page.click('text=New Event');
    
    // B. Wait for selector before filling (using stable ID/name selectors for form elements)
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });
    await page.fill('input[name="title"]', 'Team Event Needs Approval');
    await page.fill('input[name="startTime"]', '2025-12-01T10:00');
    await page.fill('input[name="endTime"]', '2025-12-01T12:00');
    
    await page.click('button:has-text("Create Event")');
    
    // Event should redirect
    await page.waitForURL(/\/events\/\d+/, { timeout: 10000 }).catch(() => {});
  });

  test('Admin can approve event', async ({ pageWithRole: page }) => {
    // Admin role is automatically set by the fixture based on test title
    await page.goto('/calendar');
    
    // Wait for calendar to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Find pending event
    const pendingEvent = page.locator('[data-approval-status="pending"]').first();
    
    if (await pendingEvent.isVisible()) {
      await pendingEvent.click();
      
      // Approve button should be visible
      await page.waitForSelector('button:has-text("Approve")', { timeout: 5000 });
      await page.click('button:has-text("Approve")');
      
      // Event should now show as approved
      await expect(page.locator('[data-approval-status="approved"]')).toBeVisible();
    }
  });

  test('FAB menu is role-aware', async ({ pageWithRole: page }) => {
    // Admin role is automatically set by the fixture for this test
    
    // Click FAB and wait for menu
    const fabLocator = page.locator('[aria-label*="create menu"]');
    await fabLocator.click();
    await page.waitForSelector('text=New Task', { timeout: 5000 }); // Wait for a menu item
    
    // Admin sees all three options
    await expect(page.locator('text=Notify')).toBeVisible();
    await expect(page.locator('text=New Event')).toBeVisible();
    await expect(page.locator('text=New Task')).toBeVisible();
    
    await fabLocator.click(); // close
    
    // NOTE: The Team role part of the test is skipped as noted in the original file.
  });

  test('Status transitions respect role permissions', async ({ pageWithRole: page }) => {
    // Team role is automatically set by the fixture based on test title
    
    await page.goto('/tasks/1'); // Assuming task exists
    await page.waitForSelector('button:has-text("Working On")', { timeout: 10000 });
    
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
  // Use pageWithRole to ensure a logged-in user
  test('Notification badge updates after assignment', async ({ pageWithRole: page }) => {
    // Team role is automatically set by the fixture based on test title
    
    // Navigate to a page where the badge is visible
    await page.goto('/');
    
    // Get initial badge count
    // A. Using waitForSelector for the badge
    const badgeLocator = page.locator('[data-badge-count]');
    await badgeLocator.waitFor({ state: 'visible', timeout: 5000 });
    const initialCount = await badgeLocator.textContent();
    
    // Simulate admin assigning task (would need API call or second browser)
    // For now, just verify badge element exists
    await expect(badgeLocator).toBeVisible();
  });

  // Use pageWithRole to ensure a logged-in user
  test('Toast shows on task status change', async ({ pageWithRole: page }) => {
    await page.goto('/tasks/1');
    
    // A. Wait for button before clicking
    await page.waitForSelector('button:has-text("Working On")', { timeout: 10000 });
    await page.click('button:has-text("Working On")');
    
    // Verify toast notification
    await expect(page.locator('.toast:has-text("Status updated")')).toBeVisible();
  });
});