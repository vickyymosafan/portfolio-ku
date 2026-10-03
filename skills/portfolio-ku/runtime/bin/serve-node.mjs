#!/usr/bin/env node
// Server Portfolio-ku untuk Node ≥ 18 (tanpa dependensi npm). Setara dengan public/index.php (PHP) — dicek bin/parity.mjs.
//   /kerja  /kerja/api/ping  /kerja/assets/<berkas>
// Menyajikan halaman Vicky VOffice + asetnya (read-only, tidak menulis apa pun ke project).
// Biasanya dijalankan lewat bin/portfolio-ku.sh start. Variabel lingkungan:
//   PORTFOLIO_PROJECT  folder project (default: folder kerja saat ini)   PORTFOLIO_PORT  port (default 8788)
//   PORTFOLIO_BIND     alamat bind (default 127.0.0.1)                   PORTFOLIO_ALLOWED_HOSTS  host tambahan
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostAllowed, SECURITY_HEADERS } from '../lib/node/http.mjs';

const major = Number(process.versions.node.split('.')[0]);
if (major < 18) {
  console.error(`Butuh Node ≥ 18 (terpasang ${process.versions.node}).`);
  process.exit(1);
}

const RUNTIME = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const PUBLIC = path.join(RUNTIME, 'public');
let PROJECT;
try {
  PROJECT = fs.realpathSync(process.env.PORTFOLIO_PROJECT || process.cwd());
} catch {
  console.error(`[portfolio] folder project tidak ditemukan: ${process.env.PORTFOLIO_PROJECT}`);
  process.exit(1);
}
const PROJECT_ID = crypto.createHash('md5').update(PROJECT).digest('hex').slice(0, 12);
const extraHosts = String(process.env.PORTFOLIO_ALLOWED_HOSTS || '');

const rawurldecode = (s) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, '%2B'));
  } catch {
    return null;
  }
};

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }, 'Metode tidak didukung');
  if (!hostAllowed(req.headers.host, extraHosts)) return send(res, 421, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Host tidak dikenal');
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Permintaan tidak valid');
  }
  const p = url.pathname.replace(/\/+$/, '');
  if (p === '' || p === '/index.php') return send(res, 302, { Location: '/kerja' }, '');
  if (p === '/kerja/api/ping') {
    return send(res, 200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      JSON.stringify({ app: 'portfolio-ku', project: PROJECT_ID, runtime: 'node' }));
  }
  if (p === '/kerja') {
    const page = fs.readFileSync(path.join(RUNTIME, 'views', 'page.html'), 'utf8');
    return send(res, 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }, page);
  }
  if (p.startsWith('/kerja/assets/')) {
    const rel = rawurldecode(p.slice('/kerja/assets/'.length));
    if (rel === null || rel.includes('\0')) return send(res, 404, {}, '');
    let base;
    let f;
    let st;
    try {
      base = fs.realpathSync(path.join(PUBLIC, 'assets'));
      f = fs.realpathSync(path.join(PUBLIC, 'assets', rel));
      st = fs.statSync(f);
    } catch {
      return send(res, 404, {}, '');
    }
    const ext = path.extname(f).toLowerCase();
    const MIME_TYPES = {
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.glb': 'model/gltf-binary',
      '.gltf': 'model/gltf+json',
      '.bin': 'application/octet-stream',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    if (!f.startsWith(base + path.sep) || !st.isFile() || !MIME_TYPES[ext]) return send(res, 404, {}, '');
    const etag = `"${Math.floor(st.mtimeMs / 1000).toString(16)}-${st.size.toString(16)}"`;
    const h = { 'Content-Type': MIME_TYPES[ext], 'Cache-Control': 'public, max-age=3600', ETag: etag };
    if (req.headers['if-none-match'] === etag) return send(res, 304, h, '');
    return send(res, 200, { ...h, 'Content-Length': String(st.size) }, req.method === 'HEAD' ? '' : fs.readFileSync(f));
  }
  return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Tidak ditemukan');
}

const port = Number(process.env.PORTFOLIO_PORT || 8788);
const bind = process.env.PORTFOLIO_BIND || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`[portfolio] port tidak valid: ${process.env.PORTFOLIO_PORT}`);
  process.exit(1);
}
const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(`[portfolio] ${req.method} ${req.url}: ${e && e.stack ? e.stack : e}`);
    if (!res.headersSent) send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Kesalahan server');
    else res.end();
  });
});
server.on('error', (e) => {
  console.error(`[portfolio] server gagal: ${e.code === 'EADDRINUSE' ? `port ${port} sudah dipakai` : e.message}`);
  process.exit(e.code === 'EADDRINUSE' ? 3 : 1);
});
server.listen(port, bind, () => console.log(`Portfolio-ku: http://${bind === '0.0.0.0' ? '127.0.0.1' : bind}:${port}/kerja  (Node ${process.versions.node})`));
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    server.closeAllConnections?.(); // koneksi keep-alive dari browser
    setTimeout(() => process.exit(0), 800).unref();
  });
}
