// Genera `_redirects` en el directorio de publicación para Netlify.
// - Proxy /api/* -> backend (API_ORIGIN, ej. https://tu-api.onrender.com) sin el prefijo /api
// - Fallback SPA: cualquier ruta no coincidente -> /index.html
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const publishDir = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'frontend', 'browser');
const apiOrigin = (process.env.API_ORIGIN ?? '').replace(/\/+$/, '');

const lines = [];
if (apiOrigin) {
  lines.push(`/api/*  ${apiOrigin}/api/:splat  200`);
}
lines.push('/*  /index.html  200');

await mkdir(publishDir, { recursive: true });
await writeFile(join(publishDir, '_redirects'), lines.join('\n') + '\n', 'utf8');
console.log(`_redirects generado en ${publishDir}`);
if (!apiOrigin) {
  console.warn('ADVERTENCIA: API_ORIGIN no está definido; el proxy /api no se incluirá.');
}
