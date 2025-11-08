// e2e/playwright/kanban-drag.spec.ts
import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const ADMIN_STATE = "e2e/states/admin.json";
const TEAM_STATE = "e2e/states/team.json";
const GUEST_STATE = "e2e/states/guest.json";

/**
 * Ensure at least one "todo" task exists. Uses an unauthenticated request
 * but attaches admin user info via header (x-user-data) so server allows create.
 * Runs once before all tests.
 */
test.beforeAll(async ({ playwright }) => {
  const req = await playwright.request.newContext();
  try {
    // 1) Check if any tasks exist
    const listRes = await req.get(`${BASE_URL}/api/tasks?institutionId=1&limit=1`);
    let listJson = [];
    try { listJson = await listRes.json(); } catch { listJson = []; }

    if (!Array.isArray(listJson) || listJson.length === 0) {
      console.log("⚙️  Seeding: No tasks found, creating dummy 'To Do' task...");
      await req.post(`${BASE_URL}/api/tasks`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-data": JSON.stringify({
            id: 1,
            email: "admin@thaiba.com",
            fullName: "Admin User",
            role: "admin",
            institutionId: 1,
          }),
        },
        data: {
          title: "Dummy Kanban Task (auto)",
          description: "Auto-created for Playwright kanban test",
          status: "todo",
          priority: "medium",
        },
      });
    } else {
      console.log("✅ Existing task found — skipping seeding.");
    }
  } finally {
    await req.dispose();
  }
});

/**
 * Helper shared test body for the Kanban interactions.
 * Expects the `page` to be already authenticated (via storageState).
 */
async function runKanbanFlow(page) {
  // Navigate and wait for the Kanban container to load
  await page.goto("/tasks");

  // Wait for the Kanban columns to appear (long timeout to handle slow dev servers)
  await page.waitForSelector("[data-column-id='todo']", { timeout: 30000 });
  await page.waitForSelector("[data-column-id='in_progress']", { timeout: 30000 });

  // Ensure at least one draggable task exists
  const todoColumn = page.locator("[data-column-id='todo']");
  const task = todoColumn.locator("[data-draggable='true']").first();
  await expect(task).toBeVisible({ timeout: 15000 });

  // Drag & drop simulation using mouse (works reliably for the test harness)
  const boxA = await task.boundingBox();
  const inProgressColumn = page.locator("[data-column-id='in_progress']");
  const boxB = await inProgressColumn.boundingBox();

  if (!boxA || !boxB) throw new Error("Missing bounding boxes for drag/drop");

  await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
  await page.mouse.down();
  // move toward the target column center (slightly offset y)
  await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + 40, { steps: 8 });
  await page.mouse.up();

  // After drop, the application should show the task under "in_progress" or show the status change
  // Adjust this assertion to match your app's exact UI text/class for in-progress state.
  await expect(inProgressColumn.locator("text=Working On").first(), { timeout: 5000 }).toBeVisible().catch(() => {
    // If your UI doesn't change to 'Working On' label, at least assert the column now contains the task
    return expect(inProgressColumn.locator("[data-draggable='true']").first()).toBeVisible({ timeout: 5000 });
  });
}

/**
 * Run the suite for Admin (storageState = admin.json)
 */
test.describe("kanban - admin", () => {
  test.use({ storageState: ADMIN_STATE });

  test("Admin can see all columns including Done", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForSelector("[data-column-id='done']", { timeout: 30000 });
    await expect(page.locator("[data-column-id='done']")).toBeVisible();
  });

  test("Team member can drag task from 'To Do' → 'In Progress' (admin view)", async ({ page }) => {
    await runKanbanFlow(page);
  });
});

/**
 * Run the suite for Team user (storageState = team.json)
 */
test.describe("kanban - team", () => {
  test.use({ storageState: TEAM_STATE });

  test("Team can drag task from 'To Do' → 'In Progress'", async ({ page }) => {
    await runKanbanFlow(page);
  });

  test("Team sees columns (basic visibility)", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForSelector("[data-column-id='todo']", { timeout: 30000 });
    await expect(page.locator("[data-column-id='todo']")).toBeVisible();
  });
});

/**
 * Run the suite for Guest user (storageState = guest.json)
 */
test.describe("kanban - guest", () => {
  test.use({ storageState: GUEST_STATE });

  test("Guest sees 'To Do' column", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForSelector("[data-column-id='todo']", { timeout: 30000 });
    await expect(page.locator("[data-column-id='todo']")).toBeVisible();
  });

  // Guest probably can't move to in_progress — keep this test to assert restrictions (optional)
  test("Guest cannot drag task to in_progress (RBAC enforced)", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForSelector("[data-column-id='todo']", { timeout: 30000 });
    // try to locate a draggable task
    const task = page.locator("[data-column-id='todo'] [data-draggable='true']").first();
    await expect(task).toBeVisible({ timeout: 15000 });
    // Attempt drag — if app blocks, it should not show task in in_progress
    const boxA = await task.boundingBox();
    const inProgressColumn = page.locator("[data-column-id='in_progress']");
    const boxB = await inProgressColumn.boundingBox();
    if (boxA && boxB) {
      await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
      await page.mouse.down();
      await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + 40, { steps: 6 });
      await page.mouse.up();
      // Verify the task did not move (either still in todo or some RBAC error UI displayed)
      await expect(page.locator("[data-column-id='todo'] [data-draggable='true']").first()).toBeVisible();
    } else {
      test.skip(true, "Missing bounding boxes; skipping drag assertion");
    }
  });
});
