// e2e/playwright/kanban-drag.spec.ts
import { test, expect } from "@playwright/test";

test("drag task from todo to inprogress", async ({ page }) => {
  await page.goto("http://localhost:3000/tasks");
  // wait for task list
  await page.waitForSelector("[data-column-id='todo']");
  const task = await page.locator("[data-column-id='todo'] .p-3").first();
  const target = await page.locator("[data-column-id='inprogress']").first();
  await task.dragTo(target);
  // assert some toast or UI change
  await page.waitForTimeout(800); // replace with better assertion if available
  expect(await page.locator("[data-column-id='inprogress'] .p-3").count()).toBeGreaterThan(0);
});
