import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = ['index.html', 'src/styles.css', 'public/manifest.webmanifest', 'public/icon.svg'];
for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('src/styles.css', 'dist/src/styles.css');
await cp('public', 'dist', { recursive: true });

const html = await readFile('dist/index.html', 'utf8');
for (const path of ['/src/styles.css', '/manifest.webmanifest']) {
  if (!html.includes(path)) throw new Error(`index.html does not reference ${path}`);
}
for (const file of ['dist/index.html', 'dist/src/styles.css', 'dist/manifest.webmanifest', 'dist/icon.svg']) {
  const size = (await stat(join(process.cwd(), file))).size;
  if (size === 0) throw new Error(`Build output is empty: ${file}`);
}
console.log('Static PWA build complete: dist/ is ready for preview deployment.');
