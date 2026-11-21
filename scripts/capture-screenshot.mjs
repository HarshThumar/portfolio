import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '@playwright/test';

const targetUrl = process.argv[2] || 'http://localhost:4321/?debug';
const outputPath = process.argv[3] || 'progress/M1.1.png';

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

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[page error]', msg.text());
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  // Wait for canvas and debug panel
  await page.waitForSelector('#tour-canvas');
  await page.waitForSelector('#perf-debug-panel', { state: 'visible', timeout: 5000 });

  // Allow frames and FPS calculation to settle
  await page.waitForTimeout(1000);

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
