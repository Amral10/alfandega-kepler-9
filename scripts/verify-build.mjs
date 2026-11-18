import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
assert(html.includes('lang="pt-BR"'));
for (const [,path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  assert(!/^https?:/.test(path), 'O build deve servir seus assets localmente.');
  await readFile(new URL(path.replace(/^\//,''),root));
}
const assets=await readdir(new URL('assets/',root));
assert(assets.some(name=>/^worker-.*\.js$/.test(name)),'Worker ausente.');
const wasm=assets.find(name=>name.endsWith('.wasm'));assert(wasm,'SQLite WASM ausente.');
const bytes=await readFile(new URL('assets/'+wasm,root));
assert.deepEqual([...bytes.subarray(0,4)],[0,97,115,109]);
await readFile(new URL('sqljs-license.txt',root));
console.log('Build verificado: HTML, assets locais, worker, SQLite WASM e licença presentes.');
