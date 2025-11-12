// scripts/make-storage.js
// Usage: node scripts/make-storage.js <role> <outPath>
// Examples:
//   node scripts/make-storage.js admin e2e/states/admin.json
//   node scripts/make-storage.js team  e2e/states/team.json
//   node scripts/make-storage.js guest e2e/states/guest.json

const fs = require('fs');
const { chromium } = require('playwright');

const ROLE = process.argv[2] || 'admin';
const OUT = process.argv[3] || `e2e/states/${ROLE}.json`;

// Modify these user objects to match your app's localStorage 'user' shape.
const USERS = {
  admin: {
    id: 1,
    email: 'admin@thaiba.com',
    fullName: 'Admin User',
    avatarUrl: null,
    role: 'admin',
    institutionId: 1
  },
  team: {
    id: 3,
    email: 'john@thaiba.com',
    fullName: 'John Doe',
    avatarUrl: null,
    role: 'team',
    institutionId: 1
  },
  guest: {
    id: 6,
    email: 'guest1@thaiba.com',
    fullName: 'Guest One',
    avatarUrl: null,
    role: 'guest',
    institutionId: 1
  }
};

(async () => {
  const user = USERS[ROLE];
  if (!user) {
    console.error('Unknown role', ROLE, 'choose admin|team|guest');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to the app origin (you said always http://localhost:3000)
  await page.goto('http://localhost:3000');

  // Set localStorage 'user' key (your app stores user there according to earlier logs)
  await page.evaluate(([k, v]) => {
    localStorage.setItem(k, JSON.stringify(v));
  }, ['user', user]);

  // You may also want to set theme or other dev keys if your app checks them
  // await page.evaluate(() => localStorage.setItem('theme', 'dark'));

  // Save storage (cookies + localStorage) to file
  await context.storageState({ path: OUT });
  console.log('Saved storageState to', OUT);

  await browser.close();
})();
