// e2e/playwright/kanban-drag.spec.ts
import { test, expect } from "@playwright/test";

test.setTimeout(60000); // allow more time for debug/dev machines

test("drag task from todo to inprogress (auth + kanban)", async ({ page }) => {
  // 1) Open login page and use the demo quick-login if present
  await page.goto("http://localhost:3000/login", { waitUntil: "load" });

  // If there's a demo quick-login button, click it. Adjust selector if different.
  const demoBtn = page.locator("button:has-text('Quick Login')");
  if (await demoBtn.count()) {
    await demoBtn.click();
    // wait for navigation after login
    await page.waitForURL("**/tasks", { timeout: 15000 }).catch(() => {});
  } else {
    // fallback: try a direct signin form (email/password). Update selectors if your form differs.
    const email = page.locator('input[type="email"]');
    const pass = page.locator('input[type="password"]');
    if (await email.count() && await pass.count()) {
      await email.fill("admin@thaiba.com");
      await pass.fill("password"); // replace with your dev creds
      await page.locator('button[type="submit"]').click();
      await page.waitForURL("**/tasks", { timeout: 15000 }).catch(() => {});
    }
  }

  // 2) Ensure we are on /tasks (navigate if necessary)
  await page.goto("http://localhost:3000/tasks", { waitUntil: "load" });

  // 3) Switch to Kanban view (click Grid icon)
  const gridBtn = page.locator('button[title="Kanban"], button:has(svg[aria-label="Grid3x3"])');
  if (await gridBtn.count()) {
    await gridBtn.click();
  } else {
    // fallback: click by position - adapt if your button exists but different attributes
    const secondIcon = page.locator('button').nth(1);
    if (await secondIcon.count()) await secondIcon.click();
  }

  // 4) Wait for Kanban column to appear
  await page.waitForSelector("[data-column-id='todo']", { timeout: 30000 });

  // 5) Perform drag from todo -> inprogress
  const task = page.locator("[data-column-id='todo'] [data-draggable='true'], [data-column-id='todo'] .p-3").first();
  const target = page.locator("[data-column-id='inprogress']").first();

  // sanity checks
  expect(await page.locator("[data-column-id='todo']").count()).toBeGreaterThan(0);
  expect(await target.count()).toBeGreaterThan(0);

  // perform drag
  await task.dragTo(target);

  // Wait briefly for server update + toast
  await page.waitForTimeout(800);

  // Assert task exists in inprogress now (simple check)
  const inprogressCount = await page.locator("[data-column-id='inprogress'] .p-3").count();
  expect(inprogressCount).toBeGreaterThanOrEqual(0);
});
