import { test, expect } from '@playwright/test';

// Smoke check on every device profile: the page loads, the canvas fills the screen,
// nothing scrolls sideways and the console stays clean. Screenshots go to progress/devices/.
test('home page fits the screen', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  const canvas = page.locator('#tour-canvas');
  await expect(canvas).toBeVisible();

  const viewport = page.viewportSize();
  const box = await canvas.boundingBox();
  expect(box?.width).toBe(viewport?.width);

  const scrollsSideways = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(scrollsSideways).toBe(false);
  expect(errors).toEqual([]);

  const file = testInfo.project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await page.screenshot({ path: `progress/devices/${file}.png` });
  await page.close();
});
