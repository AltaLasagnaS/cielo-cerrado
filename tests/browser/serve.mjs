import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';

// Sólo src/, sin watcher ni archivos privados. Puerto efímero para no pisar npm run dev.
export async function startSourceServer(repoRoot) {
  const sourceRoot = join(repoRoot, 'src');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      // Endpoint único para comprobar el bundle cuando el Chromium local prohíbe file://.
      const bundle = pathname === '/__bundle__.html';
      const file = bundle ? join(repoRoot, 'index.html') : resolve(sourceRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!bundle && !file.startsWith(sourceRoot + sep)) { response.writeHead(403).end(); return; }
      if (!(await stat(file)).isFile()) { response.writeHead(404).end(); return; }
      const body = await readFile(file);
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
