import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FACTS_PATH = 'worker/src/facts.txt';
const MAX_BYTES = 20 * 1024; // docs/05: the chatbot facts file stays under 20 KB

function profileLines(profile) {
  const lines = [
    'PERSON',
    `Name: ${profile.name}`,
    `City: ${profile.city}`,
    `In his words: ${profile.positioning}`,
    `Education: ${profile.education}`,
    'Roles:'
  ];
  for (const role of profile.roles) {
    const note = role.note ? ` (${role.note})` : '';
    lines.push(`- ${role.title}, ${role.org}${note}, ${role.dates}`);
  }
  lines.push(`Interests: ${profile.interests}`, `Community: ${profile.community}`, 'Links:');
  for (const link of profile.links) lines.push(`- ${link.label}: ${link.url}`);
  return lines;
}

function groundLines(ground) {
  const org = ground.org ? ` (at ${ground.org})` : ' (personal project)';
  const lines = [`GROUND ${ground.id}: ${ground.name}`, `Project: ${ground.projectTitle}${org}`];
  lines.push(`Facts: ${ground.facts}`);
  for (const num of ground.numbers) lines.push(`- ${num.label}: ${num.value} (${num.source})`);
  for (const link of ground.links) {
    if (!link.url.startsWith('[[')) lines.push(`Link, ${link.label}: ${link.url}`);
  }
  return lines;
}

export function buildFactsText(grounds, profile) {
  const lines = [...profileLines(profile), '', 'PROJECTS, ONE PER CRICKET GROUND'];
  for (const ground of grounds) lines.push('', ...groundLines(ground));
  lines.push('', 'SMALLER WORK');
  for (const item of profile.smallerWork) {
    const org = item.org ? ` (at ${item.org})` : '';
    const url = item.url ? ` Live: ${item.url}` : '';
    lines.push(`- ${item.title}${org}: ${item.facts}${url}`);
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const grounds = JSON.parse(readFileSync('site/src/content/grounds.json', 'utf-8'));
  const profile = JSON.parse(readFileSync('site/src/content/profile.json', 'utf-8'));
  const text = buildFactsText(grounds, profile);
  const bytes = Buffer.byteLength(text);
  if (bytes > MAX_BYTES) {
    console.error(`[generate-worker-facts] ${bytes} bytes is over the 20 KB limit.`);
    process.exit(1);
  }
  mkdirSync('worker/src', { recursive: true });
  writeFileSync(FACTS_PATH, text, 'utf-8');
  console.log(`[generate-worker-facts] Wrote ${FACTS_PATH} (${bytes} bytes)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
