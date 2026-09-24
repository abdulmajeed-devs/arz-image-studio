import { cp, mkdir, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of ['index.html', 'styles.css', 'app.js', 'arzhost-logo-white-2048x431.png', '_headers']) {
  await cp(new URL(`../${file}`, import.meta.url), new URL(file, output));
}

console.log('Cloudflare bundle created in dist/');
