import { existsSync, readFileSync } from 'node:fs';

// Wording that must never be used, per docs/02. Safe to commit.
const FORBIDDEN_PHRASES = ['found a vulnerability', 'IETF contributor'];

// The earlier employer's name must never be committed, not even inside this checker,
// because the repo becomes public at launch. Locally it lives in the gitignored
// .forbidden-names file; in CI it comes from the FORBIDDEN_NAMES secret (comma separated).
function loadPrivateNames() {
  if (existsSync('.forbidden-names')) {
    return readFileSync('.forbidden-names', 'utf-8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  }
  if (process.env.FORBIDDEN_NAMES) {
    return process.env.FORBIDDEN_NAMES.split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }
  return null;
}

// Private names are checked in every file; phrases only in visible copy, because the
// docs have to quote them to ban them.
export function loadForbiddenTerms() {
  const privateNames = loadPrivateNames();
  if (privateNames === null) {
    console.warn(
      '[forbidden-names] No .forbidden-names file and no FORBIDDEN_NAMES env var; private names are NOT being checked.'
    );
  }
  // A very short entry (a typo in the secret, say) would match half the repo and block
  // every deploy, so it is ignored with a warning instead.
  const names = (privateNames ?? []).filter((name) => {
    if (name.length >= 5) return true;
    console.warn(`[forbidden-names] Ignoring a ${name.length}-character entry; it is too short.`);
    return false;
  });
  return { names, phrases: FORBIDDEN_PHRASES };
}

export function findForbidden(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term.toLowerCase()));
}
