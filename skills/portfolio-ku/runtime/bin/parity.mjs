#!/usr/bin/env node
// Uji kesetaraan server PHP (public/index.php via php -S) dan Node (bin/serve-node.mjs) untuk project yang sama.
//   node bin/parity.mjs [--project=DIR] [--php-port=8791] [--node-port=8792]
// Membandingkan: halaman /kerja (byte identik), header keamanan, /kerja/api/ping (kecuali "runtime"), aset
// (js/glb — isi & metadata), ETag + 304, 404 untuk path terlarang, 421 untuk Host asing, dan 405 untuk POST.
// Keluar 0 bila semua sama. Kedua server dimatikan di akhir.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNTIME = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const arg = (k, d) => process.argv.slice(2).filter((a) => a.startsWith(`--${k}=`)).map((a) => a.slice(k.length + 3)).pop() ?? d;
const PROJECT = fs.realpathSync(arg('project', process.cwd()));
const PHP_PORT = Number(arg('php-port', 8791));
const NODE_PORT = Number(arg('node-port', 8792));
const procs = [];
const problems = [];
const ok = [];
const cleanup = () => {
  for (const p of procs) {
    try {
      p.kill('SIGTERM');
    } catch {
      /* sudah berhenti */
    }
  }
};
process.on('exit', cleanup);
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => process.exit(130));

function start(cmd, args, env) {
  const p = spawn(cmd, args, { cwd: RUNTIME, env: { ...process.env, PORTFOLIO_PROJECT: PROJECT, ...env }, stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => {
    err += d;
  });
  p.on('error', (e) => problems.push(`${cmd} tidak bisa dijalankan: ${e.message}`));
  procs.push(p);
  return () => err;
}
async function waitUp(base, name, errOf) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base}/kerja/api/ping`)).ok) return true;
    } catch {
      /* belum siap */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  problems.push(`${name} tidak siap di ${base}: ${errOf().slice(0, 400)}`);
  return false;
}
const get = (base, p, h = {}) => fetch(base + p, { redirect: 'manual', headers: h });
// fetch() tidak bisa mengganti header Host → pakai node:http
const hostGet = (port, p, host) => new Promise((resolve) => {
  const req = http.request({ host: '127.0.0.1', port, path: p, headers: { Host: host } }, (res) => {
    res.resume();
    resolve(res.statusCode);
  });
  req.on('error', () => resolve(0));
  req.end();
});
function check(name, cond, detail = '') {
  if (cond) ok.push(name);
  else problems.push(`${name}${detail ? `: ${detail}` : ''}`);
}
function firstDiff(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return `byte ${i}: ${JSON.stringify(a.slice(i, i + 40))} ≠ ${JSON.stringify(b.slice(i, i + 40))}`;
  return `panjang ${a.length} ≠ ${b.length}`;
}

const phpErr = start('php', ['-S', `127.0.0.1:${PHP_PORT}`, '-t', 'public', 'public/index.php'], {});
const nodeErr = start(process.execPath, ['bin/serve-node.mjs'], { PORTFOLIO_PORT: String(NODE_PORT), PORTFOLIO_BIND: '127.0.0.1' });
const P = `http://127.0.0.1:${PHP_PORT}`;
const N = `http://127.0.0.1:${NODE_PORT}`;
const up = (await waitUp(P, 'PHP', phpErr)) & (await waitUp(N, 'Node', nodeErr));

if (up) {
  // ---- halaman
  const [hp, hn] = await Promise.all([get(P, '/kerja'), get(N, '/kerja')]);
  const [tp, tn] = [await hp.text(), await hn.text()];
  check('/kerja 200 di keduanya', hp.status === 200 && hn.status === 200, `${hp.status}/${hn.status}`);
  check('/kerja identik byte-per-byte', tp === tn, tp === tn ? '' : firstDiff(tp, tn));
  check('/kerja tanpa sisa konsep lama', !/office\.js|api\/state|\{\{/.test(tp));
  for (const h of ['x-robots-tag', 'referrer-policy', 'x-content-type-options', 'x-frame-options', 'content-security-policy']) {
    check(`header ${h}`, !!hp.headers.get(h) && hp.headers.get(h) === hn.headers.get(h), `${hp.headers.get(h)} / ${hn.headers.get(h)}`);
  }

  // ---- identitas server
  const [pp, pn] = await Promise.all([get(P, '/kerja/api/ping'), get(N, '/kerja/api/ping')]);
  const [jp, jn] = [await pp.json(), await pn.json()];
  check('/kerja/api/ping identik (kecuali runtime)', jp.app === 'portfolio-ku' && jp.project === jn.project && jp.runtime === 'php' && jn.runtime === 'node');

  // ---- aset teks
  for (const a of ['/kerja/assets/cv-data.js', '/kerja/assets/portfolio-tour.js', '/kerja/assets/office.js']) {
    const [ap, an] = await Promise.all([get(P, a), get(N, a)]);
    if (a.endsWith('office.js')) {
      check(`${a} → 404 (aset lama dihapus)`, ap.status === 404 && an.status === 404, `PHP ${ap.status} / Node ${an.status}`);
      continue;
    }
    const [cp, cn] = [await ap.text(), await an.text()];
    check(`${a} identik`, ap.status === 200 && an.status === 200 && cp === cn, `PHP ${ap.status} / Node ${an.status}${cp === cn ? '' : ` · ${firstDiff(cp, cn)}`}`);
    check(`${a} Content-Type sama`, ap.headers.get('content-type') === an.headers.get('content-type'), `${ap.headers.get('content-type')} / ${an.headers.get('content-type')}`);
    const etag = an.headers.get('etag');
    check(`${a} ETag sama + 304`, !!etag && etag === ap.headers.get('etag')
      && (await get(P, a, { 'If-None-Match': etag })).status === 304 && (await get(N, a, { 'If-None-Match': etag })).status === 304);
  }

  // ---- aset biner (model arsitektur) — cukup HEAD agar tidak mengunduh ±130 MB
  const glb = '/kerja/assets/models/architecture_voffice_v2.glb';
  const [gh, ghn] = await Promise.all([
    fetch(P + glb, { method: 'HEAD' }),
    fetch(N + glb, { method: 'HEAD' }),
  ]);
  check(`${glb} → GLB 200`, gh.status === 200 && ghn.status === 200, `PHP ${gh.status} / Node ${ghn.status}`);
  check('GLB Content-Type sama', gh.headers.get('content-type') === 'model/gltf-binary' && gh.headers.get('content-type') === ghn.headers.get('content-type'), `${gh.headers.get('content-type')} / ${ghn.headers.get('content-type')}`);
  check('GLB Content-Length sama', gh.headers.get('content-length') === ghn.headers.get('content-length'), `${gh.headers.get('content-length')} / ${ghn.headers.get('content-length')}`);
  check('GLB ETag sama', !!gh.headers.get('etag') && gh.headers.get('etag') === ghn.headers.get('etag'), `${gh.headers.get('etag')} / ${ghn.headers.get('etag')}`);

  // ---- penolakan
  for (const bad of [
    '/kerja/assets/..%2F..%2Flib%2Fphp%2FHttp.php', '/kerja/assets/..%2Fdefaults.json', '/kerja/assets/%2e%2e/%2e%2e/defaults.json',
    '/kerja/assets/../../bin/portfolio-ku.sh', '/kerja/assets/vendor/three/LICENSE', '/kerja/assets/%00.js', '/kerja/api/doc?path=README.md',
    '/kerja/evidence/x.png', '/kerja/tidak-ada', '/lib/php/Http.php', '/defaults.json', '/views/page.html', '/public/index.php',
  ]) {
    const [bp, bn] = await Promise.all([get(P, bad), get(N, bad)]);
    check(`404 ${bad}`, bp.status === 404 && bn.status === 404, `PHP ${bp.status} / Node ${bn.status}`);
  }
  for (const [host, want] of [['jahat.contoh.test', 421], ['jahat.contoh.test:8788', 421], ['abc-def.trycloudflare.com', 200], ['localhost:8788', 200], ['192.168.1.5:8788', 200]]) {
    const [xp, xn] = await Promise.all([hostGet(PHP_PORT, '/kerja/api/ping', host), hostGet(NODE_PORT, '/kerja/api/ping', host)]);
    check(`Host ${host} → ${want}`, xp === want && xn === want, `PHP ${xp} / Node ${xn}`);
  }
  const [mp, mn] = await Promise.all([fetch(`${P}/kerja`, { method: 'POST', redirect: 'manual' }), fetch(`${N}/kerja`, { method: 'POST', redirect: 'manual' })]);
  check('POST ditolak (405)', mp.status === 405 && mn.status === 405, `PHP ${mp.status} / Node ${mn.status}`);
  const [rp, rn] = await Promise.all([get(P, '/'), get(N, '/')]);
  check('/ → 302 /kerja', rp.status === 302 && rn.status === 302 && rp.headers.get('location') === '/kerja' && rn.headers.get('location') === '/kerja');
}

cleanup();
for (const o of ok) console.log(`  ok   ${o}`);
for (const p of problems) console.log(`  BEDA ${p}`);
console.log(problems.length ? `PARITY GAGAL (${problems.length} masalah, ${ok.length} ok)` : `PARITY OK (${ok.length} pemeriksaan)`);
process.exit(problems.length ? 1 : 0);
