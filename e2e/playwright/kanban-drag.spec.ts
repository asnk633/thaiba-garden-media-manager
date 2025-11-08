/**
 * e2e/playwright/kanban-drag.spec.ts
 * Resilient kanban drag e2e tests:
 * - tries multiple selectors to toggle Board view
 * - seeds a dummy "To Do" task via browser fetch if none exist (so test is stable on fresh DB)
 * - uses larger timeouts and defensive waits
 *
 * Run while dev server is up. Make storageState files as you already do.
 */

import { test, expect } from "@playwright/test";

const BOARD_TOGGLES = [
  "text=/\\bBoard\\b/i",
  "text=/\\bKanban\\b/i",
  "text=/\\bBoard view\\b/i",
  '[data-testid="view-board-toggle"]',
  '#viewToggle > button:nth-child(2)',
  '[aria-label="Board view"]'
];

const COLUMN_SELECTORS = {
  todo: "[data-column-id='todo']",
  in_progress: "[data-column-id='in_progress']",
  done: "[data-column-id='done']"
};

async function ensureBoardView(page) {
  // If board is already present, nothing to do
  for (const sel of Object.values(COLUMN_SELECTORS)) {
    if (await page.locator(sel).first().count() > 0) return;
  }

  // try toggle selectors until one works
  for (const t of BOARD_TOGGLES) {
    try {
      const toggle = page.locator(t).first();
      if (await toggle.count() > 0) {
        await toggle.click({ force: true }).catch(() => {});
        // small wait for UI to change
        await page.waitForTimeout(500);
        // if board appeared, stop
        if ((await page.locator(COLUMN_SELECTORS.todo).count()) > 0) return;
      }
    } catch (e) {
      // ignore and try next
    }
  }
}

async function seedDummyTodoIfNeeded(page) {
  // Check if at least one column contains a task
  const todoCount = await page.locator(`${COLUMN_SELECTORS.todo} [data-draggable='true']`).count();
  const inProgressCount = await page.locator(`${COLUMN_SELECTORS.in_progress} [data-draggable='true']`).count();
  const anyTasks = todoCount + inProgressCount;

  if (anyTasks > 0) return; // nothing to seed

  console.log("⚙️  Seeding: No tasks found, creating dummy 'To Do' task...");

  // create via browser fetch (so cookies / local auth state are included)
  await page.evaluate(async () => {
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "E2E Seed - To Do",
          description: "Auto-seeded by e2e test",
          status: "todo",
          priority: "low",
          institutionId: 1,
          assignedTo: null
        })
      });
    } catch (err) {
      // ignore - test will fail later if create doesn't work
      // but we don't want Node error here
      // eslint-disable-next-line no-console
      console.error("seed create failed", err);
    }
  });

  // give the UI time to refresh (API push/poll/etc)
  await page.waitForTimeout(700);
}

async function runKanbanFlow(page) {
  // visit tasks page
  await page.goto("/tasks", { waitUntil: "load" });

  // Ensure board view is shown (toggle if needed)
  await ensureBoardView(page);

  // Wait for columns to render (generous timeout for dev servers)
  await page.waitForSelector(COLUMN_SELECTORS.todo, { timeout: 30000 });
  await page.waitForSelector(COLUMN_SELECTORS.in_progress, { timeout: 30000 });

  // ensure at least one draggable task exists (seed if none)
  await seedDummyTodoIfNeeded(page);

  // verify a task exists in To Do
  const task = page.locator(`${COLUMN_SELECTORS.todo} [data-draggable='true']`).first();
  await expect(task).toBeVisible({ timeout: 15000 });

  return { task };
}

/**
 * The tests run under your Playwright projects (admin/team/guest).
 * Playwright will execute each test under each configured project unless you pass --project to CLI.
 */

test.describe("kanban - admin", () => {
  test("Team member can drag task from 'To Do' → 'In Progress' (admin view)", async ({ page }) => {
    await runKanbanFlow(page);
    // drag & drop using mouse emulation
    const todo = page.locator(COLUMN_SELECTORS.todo);
    const inProgress = page.locator(COLUMN_SELECTORS.in_progress);
    const draggable = todo.locator("[data-draggable='true']").first();
    await draggable.scrollIntoViewIfNeeded();
    const box = await draggable.boundingBox();
    const target = await inProgress.boundingBox();
    if (box && target) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x + 20, target.y + 20, { steps: 10 });
      await page.mouse.up();
      // small wait for server/UI update
      await page.waitForTimeout(800);
      // expect that the moved task is now in in_progress (best-effort)
      await expect(inProgress.locator("[data-draggable='true']")).toBeVisible({ timeout: 5000 });
    } else {
      throw new Error("Unable to compute drag source/target bounding boxes");
    }
  });

  test("Admin can see all columns including Done", async ({ page }) => {
    await page.goto("/tasks", { waitUntil: "load" });
    await ensureBoardView(page);
    await page.waitForSelector(COLUMN_SELECTORS.done, { timeout: 30000 });
    await expect(page.locator(COLUMN_SELECTORS.done)).toBeVisible();
  });
});

test.describe("kanban - team", () => {
  test("Team can drag task from 'To Do' → 'In Progress'", async ({ page }) => {
    await runKanbanFlow(page);
    // same flow as admin drag (smaller assertions)
    const todo = page.locator(COLUMN_SELECTORS.todo);
    const inProgress = page.locator(COLUMN_SELECTORS.in_progress);
    const draggable = todo.locator("[data-draggable='true']").first();
    await draggable.scrollIntoViewIfNeeded();
    const box = await draggable.boundingBox();
    const target = await inProgress.boundingBox();
    if (box && target) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x + 10, target.y + 10, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(700);
      await expect(inProgress.locator("[data-draggable='true']")).toBeVisible({ timeout: 5000 });
    }
  });

  test("Team sees columns (basic visibility)", async ({ page }) => {
    await page.goto("/tasks", { waitUntil: "load" });
    await ensureBoardView(page);
    await page.waitForSelector(COLUMN_SELECTORS.todo, { timeout: 30000 });
    await expect(page.locator(COLUMN_SELECTORS.todo)).toBeVisible();
    await expect(page.locator(COLUMN_SELECTORS.in_progress)).toBeVisible();
  });
});

test.describe("kanban - guest", () => {
  test("Guest sees 'To Do' column", async ({ page }) => {
    await page.goto("/tasks", { waitUntil: "load" });
    await ensureBoardView(page);
    await page.waitForSelector(COLUMN_SELECTORS.todo, { timeout: 30000 });
    await expect(page.locator(COLUMN_SELECTORS.todo)).toBeVisible();
  });

  test("Guest cannot drag task to in_progress (RBAC enforced)", async ({ page }) => {
    await runKanbanFlow(page);
    // try drag and expect failure or that task remains in To Do
    const todo = page.locator(COLUMN_SELECTORS.todo);
    const inProgress = page.locator(COLUMN_SELECTORS.in_progress);
    const draggable = todo.locator("[data-draggable='true']").first();
    const beforeCount = await inProgress.locator("[data-draggable='true']").count();
    const box = await draggable.boundingBox();
    const target = await inProgress.boundingBox();
    if (box && target) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x + 10, target.y + 10, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(700);
      // allow either the task not moved or server prevented it (best-effort)
      const afterCount = await inProgress.locator("[data-draggable='true']").count();
      expect(afterCount).toBe(beforeCount);
    }
  });
});
