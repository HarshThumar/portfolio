import { readFileSync, existsSync } from 'node:fs';

const decisionsPath = 'DECISIONS.md';
if (!existsSync(decisionsPath)) {
  console.error('[check-deps] DECISIONS.md not found.');
  process.exit(1);
}

const decisions = readFileSync(decisionsPath, 'utf-8');
const packageFiles = ['package.json', 'game/package.json', 'site/package.json'];

let errors = 0;

for (const pkgFile of packageFiles) {
  if (!existsSync(pkgFile)) continue;
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };

  for (const dep of Object.keys(allDeps)) {
    // Local workspace packages don't need external logging
    if (dep === 'game' || dep === 'site') continue;

    // Check if dep is mentioned in DECISIONS.md
    if (!decisions.includes(dep)) {
      console.error(
        `[check-deps] Dependency "${dep}" in ${pkgFile} is missing an entry in DECISIONS.md`
      );
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n[check-deps] Failed with ${errors} unrecorded dependency error(s).`);
  process.exit(1);
} else {
  console.log('[check-deps] Passed. All dependencies documented in DECISIONS.md.');
}
