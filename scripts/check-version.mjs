// The User-Agent is how the server identifies this client, and `SDK_VERSION` in
// src/http.ts is hardcoded (importing package.json would leak a JSON module into
// the dual ESM/CJS build). It drifted once already — 2.0.2 shipped announcing
// itself as 2.0.0 — so a bump that forgets it now fails the publish instead of
// going out quietly wrong.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const http = readFileSync(join(root, 'src', 'http.ts'), 'utf8');

const match = /export const SDK_VERSION = '([^']+)'/.exec(http);
if (!match) {
  console.error('check-version: could not find `export const SDK_VERSION` in src/http.ts');
  process.exit(1);
}
if (match[1] !== pkg.version) {
  console.error(
    `check-version: SDK_VERSION is ${match[1]} but package.json is ${pkg.version}.\n` +
    '  Update src/http.ts so the User-Agent reports the version actually being published.'
  );
  process.exit(1);
}
console.error(`check-version: ok (${pkg.version})`);
