import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const BANNED_FONTS = [
  'inter',
  'roboto',
  'arial',
  'helvetica',
  'open sans',
  'lato',
  'poppins',
  'montserrat',
  'space grotesk',
  'bebas neue',
  'system-ui'
];

const BANNED_STYLE_TOKENS = ['indigo', 'violet', 'purple', 'backdrop-filter', 'backdrop-blur'];

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.astro',
  'coverage',
  '.playwright-mcp',
  'docs',
  'scripts',
  '.tmp'
]);

const TOKENS_PATH = join('site', 'src', 'styles', 'tokens.css');
const HEX = /#[0-9a-f]{3,8}/gi;
const tokenColours = new Set(
  (readFileSync(TOKENS_PATH, 'utf-8').match(HEX) || []).map((hex) => hex.toLowerCase())
);

let errors = 0;

function walkFiles(rootPath) {
  const stack = [rootPath];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const children = readdirSync(current);

    for (const child of children) {
      if (IGNORE_DIRS.has(child)) continue;
      const target = join(current, child);
      const isDir = statSync(target).isDirectory();

      if (isDir) {
        stack.push(target);
      } else {
        const ext = extname(target);
        if (ext === '.css' || ext === '.astro' || ext === '.html') {
          files.push(target);
        }
      }
    }
  }

  return files;
}

function checkStyleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lower = content.toLowerCase();

  for (const font of BANNED_FONTS) {
    const fontRegex = new RegExp(`font-family[^;]*['"]?${font}['"]?`, 'i');
    if (fontRegex.test(content)) {
      console.error(`[check-style] Banned font "${font}" found in ${filePath}`);
      errors++;
    }
  }

  // Colours are defined once in tokens.css; everything else uses var(--token).
  if (filePath !== TOKENS_PATH) {
    for (const hex of content.match(HEX) || []) {
      if (!tokenColours.has(hex.toLowerCase())) {
        console.error(`[check-style] Colour ${hex} in ${filePath} is not a token in tokens.css`);
        errors++;
      }
    }
  }

  for (const token of BANNED_STYLE_TOKENS) {
    if (lower.includes(token)) {
      console.error(`[check-style] Banned style property or color "${token}" found in ${filePath}`);
      errors++;
    }
  }
}

const targetFiles = walkFiles('.');
for (const file of targetFiles) {
  checkStyleFile(file);
}

if (errors > 0) {
  console.error(`\n[check-style] Failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('[check-style] Passed. All styling rules verified.');
}
