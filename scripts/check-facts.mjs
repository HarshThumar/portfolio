import { readFileSync } from 'node:fs';
import { validate } from './lib/mini-schema.mjs';
import { buildFactsText, FACTS_PATH } from './generate-worker-facts.mjs';

const GROUNDS_PATH = 'site/src/content/grounds.json';
const PROFILE_PATH = 'site/src/content/profile.json';
const BIBLE_PATH = 'docs/02-content-bible.md';

// Keys whose values are identifiers, not claims.
const SKIP_KEYS = new Set(['id', 'slug', 'projectId', 'url', 'panelText']);

let errors = 0;
function report(message) {
  console.error(`[check-facts] ${message}`);
  errors++;
}

// "1,019" and "1019" are the same number; "2022–26" yields 2022 and 26.
function numberTokens(text) {
  return (text.match(/\d+(?:[.,]\d+)*/g) || []).map((token) => token.replace(/,/g, ''));
}

function collectClaims(value, key, out) {
  if (SKIP_KEYS.has(key)) return out;
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectClaims(item, '', out));
  else if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) collectClaims(child, childKey, out);
  }
  return out;
}

function checkNumbers(filePath, data, allowed) {
  for (const text of collectClaims(data, '', [])) {
    const stripped = text.replace(/\[\[[^\]]*\]\]/g, '');
    for (const token of numberTokens(stripped)) {
      if (!allowed.has(token)) report(`${filePath}: number ${token} in "${text}" is not in 02`);
    }
  }
}

const allowed = new Set(numberTokens(readFileSync(BIBLE_PATH, 'utf-8')));
const grounds = JSON.parse(readFileSync(GROUNDS_PATH, 'utf-8'));
const profile = JSON.parse(readFileSync(PROFILE_PATH, 'utf-8'));
const schema = JSON.parse(readFileSync('site/src/content/grounds.schema.json', 'utf-8'));

for (const problem of validate(schema, grounds)) report(`schema: ${problem}`);
checkNumbers(GROUNDS_PATH, grounds, allowed);
checkNumbers(PROFILE_PATH, profile, allowed);

if (readFileSync(FACTS_PATH, 'utf-8') !== buildFactsText(grounds, profile)) {
  report(`${FACTS_PATH} is stale. Run: node scripts/generate-worker-facts.mjs`);
}

if (errors > 0) {
  console.error(`\n[check-facts] Failed with ${errors} error(s).`);
  process.exit(1);
}
console.log('[check-facts] Passed. Schema valid, every number is in 02, facts file current.');
