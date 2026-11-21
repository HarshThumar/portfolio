import { statSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MAX_TOTAL_SITE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_GROUND_BYTES = 3 * 1024 * 1024; // 3 MB

let errors = 0;

function getDirSize(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      total += getDirSize(fullPath);
    } else {
      total += stat.size;
    }
  }
  return total;
}

const distDir = 'site/dist';
if (existsSync(distDir)) {
  const distSize = getDirSize(distDir);
  const sizeMb = (distSize / (1024 * 1024)).toFixed(2);
  console.log(`[check-budgets] Dist build size: ${sizeMb} MB`);
  if (distSize > MAX_TOTAL_SITE_BYTES) {
    console.error(`[check-budgets] Total dist size ${sizeMb} MB exceeds 25 MB budget.`);
    errors++;
  }
} else {
  console.log('[check-budgets] site/dist not yet built; skipping dist size check.');
}

const assetsDir = 'assets';
if (existsSync(assetsDir)) {
  const assetsSize = getDirSize(assetsDir);
  const sizeMb = (assetsSize / (1024 * 1024)).toFixed(2);
  console.log(`[check-budgets] Assets size: ${sizeMb} MB`);
  if (assetsSize > MAX_TOTAL_SITE_BYTES) {
    console.error(`[check-budgets] Total assets size ${sizeMb} MB exceeds 25 MB budget.`);
    errors++;
  }

  // Check per-ground budget if individual ground directories exist
  const groundEntries = readdirSync(assetsDir);
  for (const entry of groundEntries) {
    const groundPath = join(assetsDir, entry);
    if (statSync(groundPath).isDirectory()) {
      const groundSize = getDirSize(groundPath);
      if (groundSize > MAX_GROUND_BYTES) {
        console.error(
          `[check-budgets] Ground "${entry}" size ${(groundSize / (1024 * 1024)).toFixed(2)} MB exceeds 3 MB budget.`
        );
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n[check-budgets] Budget validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('[check-budgets] Passed. All asset and build size budgets within limits.');
}
