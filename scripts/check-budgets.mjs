import { statSync, readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

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

// docs/05: first payload (code + styles + fonts the first ground needs, as sent over the
// wire) target 3 MB, hard limit 5 MB. Until grounds load their own GLBs, that is all of _astro.
const FIRST_PAYLOAD_TARGET = 3 * 1024 * 1024;
const FIRST_PAYLOAD_MAX = 5 * 1024 * 1024;
const codeDir = join(distDir, '_astro');
if (existsSync(codeDir)) {
  let wire = 0;
  for (const entry of readdirSync(codeDir)) {
    const bytes = readFileSync(join(codeDir, entry));
    // woff2 is already compressed; servers gzip JS and CSS.
    wire += extname(entry) === '.woff2' ? bytes.length : gzipSync(bytes).length;
  }
  const mb = (wire / (1024 * 1024)).toFixed(2);
  console.log(`[check-budgets] First payload over the wire: ${mb} MB (target 3, max 5)`);
  if (wire > FIRST_PAYLOAD_MAX) {
    console.error(`[check-budgets] First payload ${mb} MB is over the 5 MB limit.`);
    errors++;
  } else if (wire > FIRST_PAYLOAD_TARGET) {
    console.warn(`[check-budgets] First payload ${mb} MB is over the 3 MB target.`);
  }
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
