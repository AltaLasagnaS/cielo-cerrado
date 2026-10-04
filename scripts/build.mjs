// Genera index.html en la raíz: un único archivo autocontenido (HTML + CSS + JS + relieves) que se
// abre con doble clic, sin servidor ni conexión, incluidas las tipografías y sus licencias OFL.
//
//   npm run build
//
// Toma src/index.html como plantilla, empaqueta src/main.js con esbuild (formato IIFE, sin
// minificar para que siga siendo legible) e inserta el CSS y el JS en línea.
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = p => join(root, 'src', p);
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

export async function bundle() {
  const res = await build({
    entryPoints: [src('main.js')], bundle: true, format: 'iife', write: false,
    target: 'es2020', charset: 'utf8', legalComments: 'none', minify: false
  });
  const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const fonts = src('assets/fonts');
  const manifest = JSON.parse(await readFile(join(fonts, 'manifest.json'), 'utf8'));
  let css = await readFile(src('styles/app.css'), 'utf8');
  for (const { file } of manifest.fonts) {
    const marker = `url("../assets/fonts/${file}")`;
    if (!css.includes(marker)) throw new Error(`Falta la fuente ${file} en styles/app.css.`);
    const bytes = await readFile(join(fonts, file));
    css = css.replaceAll(marker, `url("data:font/ttf;base64,${bytes.toString('base64')}")`);
  }
  if (/url\([^)]*assets\/fonts\//.test(css)) throw new Error('Quedó una fuente sin embeber.');
  css = css.replace(/<\/style/gi, '<\\/style');
  // Los avisos acompañan también al HTML que se distribuye solo. No son contenido ejecutable.
  const notices = [];
  for (const { family, file } of manifest.licenses) {
    notices.push(`${family}\n${await readFile(join(fonts, file), 'utf8')}`);
  }
  const licenses = `<script id="font-licenses" type="text/plain">\n${notices.join('\n\n').replace(/<\/script/gi, '<\\/script')}</script>`;
  let html = await readFile(src('index.html'), 'utf8');
  const banner = `<!-- ARCHIVO GENERADO por scripts/build.mjs (Cielo Cerrado v${pkg.version}). No lo edites a mano:\n     el código fuente está en src/. Para regenerarlo: npm run build -->\n`;
  html = html
    .replace('<!doctype html>\n', '<!doctype html>\n' + banner)
    .replace('<link rel="stylesheet" href="./styles/app.css">', () => `${licenses}\n<style>\n${css}</style>`)
    .replace('<script type="module" src="./main.js"></script>', () => `<script>\n${js}</script>`);
  if (html.includes('./main.js') || html.includes('./styles/app.css')) throw new Error('La plantilla src/index.html no tiene los marcadores esperados.');
  return html;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = await bundle();
  await writeFile(join(root, 'index.html'), html);
  const bytes = Buffer.byteLength(html, 'utf8');
  console.log(`index.html generado (${bytes} bytes, ${(bytes / 1024 / 1024).toFixed(2)} MiB)`);
}
