// scripts/playwright-debug-tasks.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const state = path.join(process.cwd(), 'e2e', 'states', 'admin.json');
  if (!fs.existsSync(state)) {
    console.error('storageState not found:', state);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false }); // headed so you can watch
  const context = await browser.newContext({ storageState: state });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', text: String(err) });
  });

  try {
    console.log('-> Navigating to /tasks');
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // wait briefly for any client JS to render UI
    await page.waitForTimeout(1500);

    // try multiple fallback selectors to find a column
    const selectorsToCheck = [
      "[data-column-id='todo']",
      "[data-column-id='in_progress']",
      "[data-column-id='done']",
      "[data-kanban-root]",
      ".kanban",
      ".kanban-column",
      "[role='region'][aria-label='Kanban']"
    ];

    const found = [];
    for (const sel of selectorsToCheck) {
      const exists = await page.$(sel);
      found.push({ sel, exists: !!exists });
    }

    // dump HTML and screenshot
    const html = await page.content();
    fs.writeFileSync('debug-tasks-page.html', html, 'utf8');
    await page.screenshot({ path: 'debug-tasks-screenshot.png', fullPage: true });

    // collect network responses for /api/tasks (helpful to see 401)
    const responses = [];
    page.on('response', r => {
      const url = r.url();
      if (url.includes('/api/tasks') || url.includes('/api/events') || url.includes('/api/notifications')) {
        responses.push({ url, status: r.status(), ok: r.ok() });
      }
    });

    // wait a little for possible background calls
    await page.waitForTimeout(1500);

    // write logs & findings
    fs.writeFileSync('debug-console.json', JSON.stringify(logs, null, 2), 'utf8');
    fs.writeFileSync('debug-selectors.json', JSON.stringify(found, null, 2), 'utf8');
    fs.writeFileSync('debug-api-responses.json', JSON.stringify(responses, null, 2), 'utf8');

    console.log('Saved debug-tasks-page.html, debug-tasks-screenshot.png, debug-console.json, debug-selectors.json, debug-api-responses.json');
  } catch (err) {
    console.error('Error during debug run:', err && err.message || err);
  } finally {
    // keep browser open for you to inspect if you launched headed; comment out close if you want it open
    // await browser.close();
  }
})();
