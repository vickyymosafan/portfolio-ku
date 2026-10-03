---
name: portfolio-ku
description: Jalankan "Vicky VOffice" — portfolio virtual 3D (three.js) milik M. Vicky Mosafan di http://127.0.0.1:8788/kerja. Pengunjung berjalan di paviliun arsitektural: disambut Aria (virtual concierge) di lobby, bertemu Vicky di Dev Lab, menelusuri studi kasus proyek di Showcase, dan bersantai di Lounge & Cafe. Isi CV bersumber dari cv-data.js. Pakai saat user ingin membuka, memeriksa, atau menghentikan portfolio-ku, atau membuka URL publiknya. Node ≥ 18 (atau PHP ≥ 8.1).
argument-hint: "[start|stop|status|publik|tutup-publik] [--node|--php] [--port N]"
---

Runtime siap pakai ada di `${CLAUDE_SKILL_DIR}/runtime/` — **tidak ada yang disalin ke project**. Semua perintah memakai
`bash "${CLAUDE_SKILL_DIR}/runtime/bin/portfolio-ku.sh" <perintah>` dan dijalankan di **root project saat ini** (folder
tempat Claude Code dibuka); server menyajikan halaman portfolio + asetnya secara read-only.

Argumen user: $ARGUMENTS

## Langkah
1. **Pilih perintah dari argumen** (tanpa argumen = `start`):
   - `start` / kosong → `bash "${CLAUDE_SKILL_DIR}/runtime/bin/portfolio-ku.sh" start` (teruskan `--node`, `--php`, `--port N` bila ada).
   - `stop` → `… portfolio-ku.sh stop` · `status` → `… portfolio-ku.sh status` · `restart` → `… portfolio-ku.sh restart`.
   - `publik` / `tunnel` / `--publik` → jalankan `start` dulu, lalu `… portfolio-ku.sh tunnel` (butuh `cloudflared`).
   - `tutup-publik` / `tunnel-stop` → `… portfolio-ku.sh tunnel-stop`.
2. Skrip bersifat idempoten: bila server sudah berjalan untuk folder ini ia hanya mencetak URL; port sibuk → otomatis
   pindah ke port bebas berikutnya; Node ≥ 18 dipakai bila ada, selain itu PHP ≥ 8.1. Bila keduanya tidak ada, sampaikan
   pesan error skrip apa adanya (cara memasang Node/PHP) lalu berhenti.
3. **Laporkan singkat** (Bahasa Indonesia): URL lokal (baris `URL :`), runtime, dan cara menghentikan
   (`/portfolio-ku stop` atau perintah `Hentikan` yang dicetak).
4. **Tawarkan URL publik dalam satu kalimat** (jangan dijalankan tanpa persetujuan eksplisit): "Ingin dibuka dari ponsel
   di luar jaringan? Jalankan `/portfolio-ku publik`." Saat user memintanya, setelah `tunnel` berhasil sampaikan
   peringatannya: siapa pun yang tahu link bisa membuka halaman portfolio (read-only), bagikan hanya ke orang
   tepercaya, dan matikan dengan `/portfolio-ku tutup-publik`.

## Isi portfolio (untuk menjawab pertanyaan user)
- **Lima area** — Exterior (driveway & kolam), Lobby (Aria di meja resepsionis), Dev Lab (workstation Vicky),
  Showcase (kiosk studi kasus proyek), dan Lounge & Cafe (kepemimpinan & sertifikasi). Dock navigasi ada di bawah layar.
- **Aria** = virtual concierge di lobby; **Vicky** = avatar pemilik di Dev Lab. Dekati objek lalu tekan `E` untuk
  dialog atau modal (kiosk proyek, hologram Neural AI Core).
- **Misi terpandu** di kartu kanan atas; tombol **CV Teks** membuka CV lengkap; kamera **Follow/Bebas**; tema
  **Malam/Siang**; di ponsel ada joystick + tombol **AKSI**.
- Seluruh konten (profil, proyek, tech stack, kepemimpinan, sertifikasi) hanya dari
  `skills/portfolio-ku/runtime/public/assets/cv-data.js`.
- Port bisa diganti lewat `<project>/.claude/portfolio-ku.json` (`{"port": 8790}`) atau `--port N`.

## Aturan
- Read-only; jangan membuat atau mengubah file di project kecuali user meminta `.claude/portfolio-ku.json`
  (kunci `port` / `autostart`).
- Jangan pernah membuka tunnel publik tanpa persetujuan user.
- Verifikasi opsional: `node "${CLAUDE_SKILL_DIR}/runtime/bin/check.mjs" <url-dasar>`; bila Node **dan** PHP ada:
  `node "${CLAUDE_SKILL_DIR}/runtime/bin/parity.mjs" --project="$PWD"` (harus "PARITY OK").
