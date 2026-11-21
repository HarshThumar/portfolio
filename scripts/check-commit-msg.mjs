import { readFileSync } from 'node:fs';
import { findForbidden, loadForbiddenTerms } from './lib/forbidden-names.mjs';

// Called by .githooks/commit-msg with the path of the message file.
const messagePath = process.argv[2];
if (!messagePath) {
  console.error('[check-commit-msg] Usage: node scripts/check-commit-msg.mjs <message-file>');
  process.exit(1);
}

const { names, phrases } = loadForbiddenTerms();
const hits = findForbidden(readFileSync(messagePath, 'utf-8'), [...names, ...phrases]);
if (hits.length > 0) {
  console.error('[check-commit-msg] Commit message contains a forbidden term. Reword it.');
  process.exit(1);
}
