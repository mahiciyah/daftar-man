import { build } from 'esbuild';
import { copyFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('www', { recursive: true });
await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  minify: true,
  outfile: 'www/app.js',
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  target: ['chrome90']
});
copyFileSync('src/styles.css', 'www/styles.css');

// pick the variable Vazirmatn woff2 from the npm package
const find = (dir) => readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? find(p) : [p];
});
const fonts = find('node_modules/vazirmatn').filter(p => p.endsWith('.woff2'));
const pick = fonts.find(p => /wght/i.test(p) && !/farsi|fd/i.test(p)) || fonts.find(p => /Regular/i.test(p)) || fonts[0];
if (pick) copyFileSync(pick, 'www/vazir.woff2');
else console.warn('Vazirmatn font not found; system font will be used.');
console.log('Built -> www/ (font:', pick, ')');
