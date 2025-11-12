import { test, expect, Request } from "@playwright/test";

/**
 * Playwright scaffold for M2: Task review happy path + error path.
 *
 * Drop this file into: e2e/playwright/core-m2.spec.ts
 *
 * Run:
 *   npx playwright test e2e/playwright/core-m2.spec.ts --project=chromium
 *
 * Notes:
 * - Adjust baseURL in playwright.config if needed (or use full URL in page.goto).
 * - The test uses content text "Test: visible task" (your dev seed). If your seed differs,
 *   change TASK_TITLE constant below.
 * - The selectors attempt to be tolerant to markup changes: they locate the task card by title,
 *   find the nearby <select> and "Save" button, then perform actions.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const TASK_TITLE = "Test: visible task"; // change if your test record differs

test.describe("M2 — Task review UI", () => {
  test("happy path: change reviewStatus -> server success -> show toast", async ({ page }) => {
    // Intercept PATCH and assert request body; respond 200
    let interceptedPayload: any = null;
    await page.route("**/api/tasks/*/review", async (route, request) => {
      if (request.method() === "PATCH") {
        try {
          interceptedPayload = JSON.parse(await request.text());
        } catch {
          interceptedPayload = null;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to tasks page
    await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });

    // Wait for the task title row to appear
    const taskTitleLocator = page.getByText(TASK_TITLE, { exact: true }).first();
    await expect(taskTitleLocator).toBeVisible({ timeout: 5000 });

    // Find the containing card for the title and then the select + save button inside it.
    // We try a resilient chain: ascend to nearest card element and query within.
    const card = taskTitleLocator.locator("xpath=ancestor::*[contains(@class,'card') or contains(@class,'task') or contains(@class,'rounded') or self::div][1]");
    // fallback if the above didn't find a special container: use parent element
    const cardExists = await card.count();
    const container = cardExists ? card : taskTitleLocator.locator("..");

    // locate the select (combobox) and Save button
    const reviewSelect = container.locator("select").first();
    const saveButton = container.getByRole("button", { name: /save/i }).first();

    // Ensure controls are visible
    await expect(reviewSelect).toBeVisible({ timeout: 3000 });
    await expect(saveButton).toBeVisible({ timeout: 3000 });

    // Change value to the canonical backend value. Backend expects: pending, approved, rejected
    // Here we choose 'approved'
    await reviewSelect.selectOption({ value: "approved" }).catch(async () => {
      // fallback: try selecting by label text
      await reviewSelect.selectOption({ label: "Approved" }).catch(() => {
        throw new Error("Could not set review select — update selector or option values");
      });
    });

    // Click Save and wait for network call to be intercepted
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes("/api/tasks/") && resp.request().method() === "PATCH"),
      saveButton.click(),
    ]);

    // Assert server request payload shape
    expect(interceptedPayload).toBeTruthy();
    expect(interceptedPayload.reviewStatus).toBe("approved");

    // Validate a success toast appears (toasting implementations vary).
    // Check for common toast text used in your UI; fallback to a generic presence check.
    const toast = page.locator("text=Review status updated").first();
    if (await toast.count()) {
      await expect(toast).toBeVisible({ timeout: 3000 });
    } else {
      // if library uses alert() or dialog, Playwright would capture that earlier — we check a generic toast class
      const genericToast = page.locator("[role='status'], .toast, .Toast__root").first();
      await expect(genericToast).toBeVisible({ timeout: 3000 });
    }
  });

  test("error path: server returns 500 -> show error toast", async ({ page }) => {
    // Intercept and return 500 for the PATCH
    await page.route("**/api/tasks/*/review", async (route, request) => {
      if (request.method() === "PATCH") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Failed to update reviewStatus" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });
    const taskTitleLocator = page.getByText(TASK_TITLE, { exact: true }).first();
    await expect(taskTitleLocator).toBeVisible({ timeout: 5000 });

    const card = taskTitleLocator.locator("xpath=ancestor::*[contains(@class,'card') or contains(@class,'task') or contains(@class,'rounded') or self::div][1]");
    const cardExists = await card.count();
    const container = cardExists ? card : taskTitleLocator.locator("..");

    const reviewSelect = container.locator("select").first();
    const saveButton = container.getByRole("button", { name: /save/i }).first();

    await expect(reviewSelect).toBeVisible();
    await expect(saveButton).toBeVisible();

    // Choose 'rejected' as an example canonical value
    await reviewSelect.selectOption({ value: "rejected" }).catch(async () => {
      await reviewSelect.selectOption({ label: "Rejected" }).catch(() => {});
    });

    // Click Save and wait for the failing response
    const resp = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/tasks/") && r.request().method() === "PATCH"),
      saveButton.click(),
    ]);

    // Check that error toast appears
    const errToast = page.locator("text=Failed to update reviewStatus").first();
    if (await errToast.count()) {
      await expect(errToast).toBeVisible();
    } else {
      const genericError = page.locator(".toast--error, .Toast__error, [role='alert']").first();
      await expect(genericError).toBeVisible({ timeout: 3000 });
    }
  });
});
