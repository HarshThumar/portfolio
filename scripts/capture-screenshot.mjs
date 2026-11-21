import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '@playwright/test';

const targetUrl = process.argv[2] || 'http://localhost:4321/?debug';
const outputPath = process.argv[3] || 'progress/M1.5.png';
const action = process.argv[4];

const dir = dirname(outputPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

async function isServerUp(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  let serverProcess = null;
  const baseUrl = 'http://localhost:4321';

  if (!(await isServerUp(baseUrl))) {
    serverProcess = spawn('npx', ['astro', 'preview', '--port', '4321'], {
      cwd: 'site',
      shell: true,
      stdio: 'pipe'
    });

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isServerUp(baseUrl)) break;
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tour-canvas');
  await page.waitForSelector('#perf-debug-panel', { state: 'visible', timeout: 5000 });

  if (action === 'pavilion') {
    // Open the Honours Board dialog
    await page.evaluate(() => {
      const modal = document.getElementById('long-room-honours-board');
      if (modal) modal.style.display = 'block';
    });
    await page.waitForTimeout(500);

    // Expand the first rediscovered advisory story to show the interaction
    const advisoryRow = await page.$('.honours-row[data-idx="6"]');
    if (advisoryRow) {
      await advisoryRow.click();
      await page.waitForTimeout(500);
    }
  } else if (action === 'scoreboard') {
    // Turn left and drive towards the manual scoreboard at (-34, -10)
    await page.keyboard.down('KeyA');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(2800);
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(1200);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(1000);
  } else if (action === 'panel') {
    // Open project scorecard panel
    await page.evaluate(() => {
      const panel = document.getElementById('project-scorecard-panel');
      if (panel) panel.style.transform = 'translateX(-50%) translateY(0)';
    });
    await page.waitForTimeout(600);
  } else if (action === 'sound') {
    // Show HUD mute button and toggle state
    await page.waitForSelector('#hud-mute-btn', { state: 'visible' });
    await page.click('#hud-mute-btn');
    await page.waitForTimeout(500);
  } else if (action === 'crowd') {
    // Drive along the boundary to trigger the Mexican wave in the stands
    await page.keyboard.down('KeyD');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(3000);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(1000);
  } else {
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: outputPath });
  console.log(`Saved screenshot to ${outputPath}`);

  await browser.close();

  if (serverProcess?.pid) {
    try {
      execSync(`taskkill /pid ${serverProcess.pid} /T /F`);
    } catch {
      // Process already terminated
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
