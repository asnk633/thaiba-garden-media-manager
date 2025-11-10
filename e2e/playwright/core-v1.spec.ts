import { test, expect } from "@playwright/test";

test.describe("M1: Core v1 - Tasks & Events CRUD with RBAC", () => {
  test.use({ baseURL: "http://localhost:3000" });

  test("Admin sees all FAB options", async ({ page }) => {
    await page.goto("/home");
    await page.waitForSelector("button[aria-label='Open create menu']");
    await page.click("button[aria-label='Open create menu']");
    await expect(page.getByText("New Task")).toBeVisible();
    await expect(page.getByText("New Event")).toBeVisible();
    await expect(page.getByText("Notify")).toBeVisible();
  });

  test("Team can create a task", async ({ page }) => {
    await page.goto("/tasks/new");
    await page.fill('input[name="title"]', "Team test task");
    await page.fill('textarea[name="description"]', "Created via automated test");
    await page.click("text=Save");
    await expect(page.getByText("Task created")).toBeVisible();
  });

  test("Guest can submit a task request", async ({ page }) => {
    await page.goto("/tasks/new");
    await page.fill('input[name="title"]', "Guest request");
    await page.fill('textarea[name="description"]', "Created by guest");
    await page.click("text=Save");
    await expect(page.getByText("Task created")).toBeVisible();
  });
});
