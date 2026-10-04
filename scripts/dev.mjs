// Servidor de desarrollo: sirve src/ tal cual (módulos ES nativos, sin empaquetar) y recarga la
// página sola cuando guardás un archivo.
//
//   npm run dev        → http://localhost:8000
//   PORT=9000 npm run dev
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const PORT = +process.env.PORT || 8000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
const RELOAD = '<script>new EventSource("/__reload").onmessage = () => location.reload();</script>';
const clients = new Set();

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  const file = normalize(join(SRC, url === '/' ? 'index.html' : url));
  if (!file.startsWith(SRC)) { res.writeHead(403).end(); return; }
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    let body = await readFile(file);
    if (file.endsWith('index.html')) body = body.toString().replace('</body>', RELOAD + '</body>');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404).end('No encontrado'); }
}).listen(PORT, () => console.log(`Cielo Cerrado (desarrollo) en http://localhost:${PORT}  —  Ctrl+C para salir`));

let t = null;
watch(SRC, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { for (const c of clients) c.write('data: reload\n\n'); }, 100); });
