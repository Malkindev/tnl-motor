import { test, expect } from '@playwright/test';

test('admin can upload vehicle image', async ({ page }) => {
  await page.goto('/login');
  await page.fill("input[name='email']", process.env.E2E_ADMIN_EMAIL || 'admin@example.com');
  await page.fill("input[name='password']", process.env.E2E_ADMIN_PASSWORD || 'TnlAdmin2026!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('/admin/vehicles');
  await page.setInputFiles('input[type=file]', 'server/test-image.png');
  await page.fill('input[name=make]', 'E2EMake');
  await page.fill('input[name=model]', 'E2EModel');
  await page.fill('input[name=year]', '2026');
  await page.click('button:has-text("Publish Vehicle")');
  await page.waitForTimeout(2000);
  const hasNew = await page.locator('text=E2EMake E2EModel').first().isVisible();
  expect(hasNew).toBeTruthy();
});
