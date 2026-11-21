import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { findForbidden, loadForbiddenTerms } from './lib/forbidden-names.mjs';

// Banned list from docs/06. Kept in sync by hand; docs/ is excluded from the scan.
const BANNED_WORDS = [
  'delve',
  'tapestry',
  'pivotal',
  'underscore',
  'showcase',
  'intricate',
  'testament',
  'leverage',
  'seamless',
  'seamlessly',
  'robust',
  'elevate',
  'unlock',
  'harness',
  'realm',
  'unleash',
  'supercharge',
  'game-changer',
  'game changer',
  'cutting-edge',
  'state-of-the-art',
  'revolutionize',
  'empower',
  'synergy',
  'passionate about',
  "in today's fast-paced world",
  'stands as',
  'serves as',
  'boasts',
  'discover how',
  'unlock the power of',
  'dive into',
  'deep dive',
  'look no further',
  "whether you're",
  "it's not just",
  'not just'
];

// `placeholder` is only a smell as a word, not as the HTML attribute or DOM property.
const CODE_SMELLS = [/\bTODO\b/, /\bFIXME\b/, /\blorem\b/i, /(?<![.:-])\bplaceholder\b(?!\s*=)/];

const MARKERS = /\[\[(COPY|NEEDS FACT)/;

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.astro',
  'coverage',
  '.playwright-mcp',
  'test-results',
  '.tmp'
]);

// Files where visible copy can live: banned words and smells are checked here.
const COPY_EXTS = new Set(['.astro', '.json', '.ts', '.html', '.txt']);
// Every text file is checked for forbidden names, including docs-like files at the root.
const TEXT_EXTS = new Set([...COPY_EXTS, '.js', '.mjs', '.css', '.md', '.yml', '.jsonc']);
const SELF = new Set(['check-copy.mjs', 'package-lock.json']);

const releaseMode = process.argv.includes('--release');
const { names: forbiddenNames, phrases: forbiddenPhrases } = loadForbiddenTerms();
let errors = 0;

function report(message) {
  console.error(`[check-copy] ${message}`);
  errors++;
}

function checkCopy(filePath, content) {
  for (const phrase of findForbidden(content, forbiddenPhrases)) {
    report(`Forbidden wording "${phrase}" in ${filePath}`);
  }
  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(content)) {
      report(`Banned word "${word}" in ${filePath}`);
    }
  }
  for (const smell of CODE_SMELLS) {
    if (smell.test(content)) report(`Leftover ${smell} in ${filePath}`);
  }
  if (filePath.endsWith('.astro')) {
    const emDashes = (content.match(/—/g) || []).length;
    if (emDashes > 1) report(`Too many em dashes (${emDashes} > 1) in ${filePath}`);
  }
  if (releaseMode && MARKERS.test(content)) {
    report(`Unresolved [[COPY]] / [[NEEDS FACT]] marker in ${filePath}`);
  }
}

function checkFile(filePath) {
  const ext = extname(filePath);
  const nameHits = findForbidden(basename(filePath), forbiddenNames);
  if (nameHits.length > 0) report(`Forbidden term in file name ${filePath}`);
  if (!TEXT_EXTS.has(ext) || SELF.has(basename(filePath))) return;

  const content = readFileSync(filePath, 'utf-8');
  if (findForbidden(content, forbiddenNames).length > 0) {
    report(`Forbidden term in ${filePath}`);
  }
  // scripts/ and docs/ quote the banned lists, so they only get the forbidden-name check.
  const isRuleFile = /^(scripts|docs)[\\/]/.test(filePath);
  if (COPY_EXTS.has(ext) && !isRuleFile) checkCopy(filePath, content);
}

function scanDir(dir) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry) || entry === '.forbidden-names') continue;
    const fullPath = dir === '.' ? entry : join(dir, entry);
    if (statSync(fullPath).isDirectory()) scanDir(fullPath);
    else checkFile(fullPath);
  }
}

scanDir('.');

if (errors > 0) {
  console.error(`\n[check-copy] Failed with ${errors} error(s).`);
  process.exit(1);
}
console.log(`[check-copy] Passed${releaseMode ? ' (release mode)' : ''}.`);
