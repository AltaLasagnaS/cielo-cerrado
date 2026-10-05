import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';

// Sólo src/ (y experimentos/, que importa la campaña), sin watcher ni archivos privados. Puerto efímero
// para no pisar npm run dev.
export async function startSourceServer(repoRoot) {
  const sourceRoot = join(repoRoot, 'src'), expRoot = join(repoRoot, 'experimentos');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      // Endpoint único para comprobar el bundle cuando el Chromium local prohíbe file://.
      const bundle = pathname === '/__bundle__.html';
      const exp = pathname.startsWith('/experimentos/');
      const file = bundle ? join(repoRoot, 'index.html') : resolve(exp ? repoRoot : sourceRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!bundle && !file.startsWith((exp ? expRoot : sourceRoot) + sep)) { response.writeHead(403).end(); return; }
      if (!(await stat(file)).isFile()) { response.writeHead(404).end(); return; }
      let body = await readFile(file);
      // como en scripts/dev.mjs: '../../../src/…' de los módulos experimentales apunta a la misma copia del motor
      if (exp && /\.m?js$/.test(file)) body = Buffer.from(body.toString().replace(/(['"])(?:\.\.\/)+src\//g, '$1/'));
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { server.off('error', reject); accept(); });
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((accept, reject) => {
      server.closeAllConnections();
      server.close(error => error ? reject(error) : accept());
    })
  };
}
