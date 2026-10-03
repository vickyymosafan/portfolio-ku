#!/usr/bin/env node
// Pemeriksaan cepat server Portfolio-ku yang sedang berjalan (Node ≥ 18, tanpa dependensi):
// halaman, header keamanan, aset (js/glb), ETag + 304, dan 404.
//   node bin/check.mjs http://127.0.0.1:8788      → keluar 0 bila semua lolos
const base = (process.argv[2] || `http://127.0.0.1:${process.env.PORTFOLIO_PORT || 8788}`).replace(/\/+$/, '').replace(/\/kerja$/, '');
const bad = [];
const good = [];
const t = (name, cond, extra = '') => (cond ? good : bad).push(extra ? `${name} (${extra})` : name);
const get = (p, opt) => fetch(base + p, { redirect: 'manual', ...opt });

try {
  const page = await get('/kerja');
  const html = await page.text();
  t('/kerja → 200', page.status === 200, String(page.status));
  t('header X-Robots-Tag noindex', /noindex/.test(page.headers.get('x-robots-tag') || ''));
  t('header Referrer-Policy no-referrer', page.headers.get('referrer-policy') === 'no-referrer');
  t('header Content-Security-Policy', /default-src 'self'/.test(page.headers.get('content-security-policy') || ''));
  t('judul Vicky VOffice', /<title>Vicky VOffice/.test(html));
  t('memuat portfolio-tour.js', /\/kerja\/assets\/portfolio-tour\.js/.test(html));
  t('tanpa sisa konsep lama (office.js / api/state / placeholder)', !/office\.js|api\/state|\{\{/.test(html));

  const cv = await get('/kerja/assets/cv-data.js');
  t('/kerja/assets/cv-data.js → JS', cv.status === 200 && /javascript/.test(cv.headers.get('content-type') || ''), String(cv.status));
  t('cv-data.js berisi CV_DATA', (await cv.text()).includes('CV_DATA'));

  const glb = await get('/kerja/assets/models/architecture_voffice_v2.glb', { method: 'HEAD' });
  t('model arsitektur → GLB', glb.status === 200 && glb.headers.get('content-type') === 'model/gltf-binary', `${glb.status} ${glb.headers.get('content-type')}`);

  const etag = cv.headers.get('etag');
  t('ETag ada + 304', !!etag && (await get('/kerja/assets/cv-data.js', { headers: { 'If-None-Match': etag } })).status === 304);

  for (const p of ['/kerja/assets/..%2F..%2Flib%2Fphp%2FHttp.php', '/defaults.json', '/kerja/tidak-ada']) t(`404 ${p}`, (await get(p)).status === 404);
} catch (e) {
  bad.push(`tidak bisa terhubung ke ${base}: ${e.cause?.code || e.message}`);
}
for (const g of good) console.log(`  ok    ${g}`);
for (const b of bad) console.log(`  GAGAL ${b}`);
console.log(bad.length ? `GAGAL (${bad.length})` : `OK (${good.length} pemeriksaan) — buka ${base}/kerja`);
process.exit(bad.length ? 1 : 0);
