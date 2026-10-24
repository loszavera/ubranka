import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'artifacts/private-web');

if (process.argv[2] === 'serve') {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
  createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:4185').pathname);
      let target = resolve(output, `.${pathname}`);
      if (target !== output && !target.startsWith(output + sep)) { response.writeHead(403).end(); return; }
      if (!extname(pathname)) target = resolve(output, 'index.html');
      if (!(await stat(target)).isFile()) { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(await readFile(target));
    } catch { response.writeHead(404).end(); }
  }).listen(4185, '127.0.0.1', () => process.stdout.write('Private test export: http://127.0.0.1:4185\n'));
} else {
  // Do not load developer .env files or copy real public service configuration into this build.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('EXPO_PUBLIC_')));
  Object.assign(env, {
    EXPO_NO_DOTENV: '1', EXPO_NO_TELEMETRY: '1',
    EXPO_PUBLIC_SUPABASE_URL: 'https://ubranka-test.supabase.co',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ubranka_private_e2e_only',
  });
  for (const args of [
    [resolve(root, 'node_modules/expo/bin/cli'), 'export', '--platform', 'web', '--output-dir', output, '--clear'],
    [resolve(root, 'node_modules/@playwright/test/cli.js'), 'test', '--config', 'playwright.private.config.mjs', ...process.argv.slice(2)],
  ]) {
    const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
