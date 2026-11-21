// Re-bakes the opening's kit flight with Blender (assets-src/opening/kit_flight.py).
// Blender is found through the BLENDER env var, then PATH, then the default Windows install.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const candidates = [
  process.env.BLENDER,
  join(homedir(), 'AppData/Local/Programs/blender-4.2.16-windows-x64/blender.exe'),
  'blender'
].filter(Boolean);
const blender = candidates.find((c) => c === 'blender' || existsSync(c));
const result = spawnSync(blender, ['-b', '--python', 'assets-src/opening/kit_flight.py'], {
  stdio: 'inherit'
});
process.exit(result.status ?? 1);
