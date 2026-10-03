# Portfolio-ku — Vicky VOffice

> **English summary.** Portfolio-ku is the source of **Vicky VOffice**, an interactive 3D portfolio (three.js r170,
> WebGL) for **M. Vicky Mosafan** — Full Stack Developer & AI Augmented Engineer. Walk through a modern architectural
> pavilion: meet **Aria**, the virtual concierge, in the lobby; visit Vicky at the **Dev Lab**; browse project case
> studies in the **Showcase**; and relax in the **Lounge & Cafe**. All CV content comes from one data file
> (`cv-data.js`). A zero-dependency local server (Node ≥ 18 **or** PHP ≥ 8.1 — no npm/composer packages) serves it at
> `http://127.0.0.1:8788/kerja`; an optional cloudflared tunnel gives a temporary public URL. It can also be launched
> from Claude Code through the bundled skill. UI and docs are in Bahasa Indonesia. MIT licensed.

**Vicky VOffice** adalah portfolio virtual 3D interaktif milik **M. Vicky Mosafan**. Alih-alih halaman web biasa,
pengunjung berjalan di dalam paviliun arsitektural: disambut **Aria** di lobby, menemui Vicky di **Dev Lab**,
menjelajahi studi kasus proyek di **Showcase**, lalu bersantai di **Lounge & Cafe**. Seluruh isi CV — profil, filosofi,
proyek, tech stack, kepemimpinan, sertifikasi — bersumber dari satu berkas data.

Tanpa build step, tanpa dependensi npm/composer, tanpa layanan pihak ketiga: runtime kecil (Node atau PHP) menyajikan
halaman + aset 3D langsung dari folder repo ini.

## Daftar isi
- [Fitur](#fitur) · [Kebutuhan](#kebutuhan) · [Menjalankan](#menjalankan) · [Kontrol](#kontrol)
- [Mengubah konten](#mengubah-konten--pengaturan) · [Struktur repo](#struktur-repo) · [URL publik](#url-publik-tunnel)
- [Privasi & keamanan](#privasi--keamanan) · [FAQ](#masalah-umum--faq) · [Kontribusi](#kontribusi) · [Lisensi](#lisensi)

## Fitur
- **Room tour 3D** — lima area: **Exterior** (driveway & kolam reflektif), **Lobby** (resepsionis), **Dev Lab**
  (workstation tiga monitor Vicky), **Showcase** (galeri proyek dengan kiosk kesehatan, perbankan, dan museum), serta
  **Lounge & Cafe**. Lompat cepat antar ruangan lewat dock navigasi di bawah layar.
- **Aria, virtual concierge** — menyapa pengunjung di meja resepsionis lewat dialog kontekstual.
- **Misi gamified** — alur kunjungan terpandu (sapa Aria → temui Vicky → jelajahi galeri → lounge) dengan kartu misi
  dan progress bar di kanan atas.
- **Studi kasus proyek** — dekati kiosk (atau hologram Neural AI Core) lalu tekan **E** untuk membuka ringkasan
  arsitektur, daftar kontribusi, tech stack, dan tautan GitHub.
- **CV teks lengkap** — tombol **📄 CV Teks** membuka dokumen CV (pendidikan, pengalaman, proyek) di dalam modal.
- **Kamera & tema** — mode **Follow** (orang ketiga, bawaan) atau **Bebas** (orbit); pencahayaan **Malam** (bawaan)
  atau **Siang**.
- **Ponsel** — joystick sentuh + tombol **AKSI**, layout responsif; kamera dan tema tetap bisa diganti dari header.
- **Aksesibilitas & performa** — menghormati `prefers-reduced-motion`, fokus keyboard terlihat, pixel ratio dibatasi
  sadar-fps, dan model arsitektur dimuat dengan progress bar.
- **Kontak** — tombol **Hubungi** (email) di header.

## Kebutuhan
| Komponen | Keterangan |
|---|---|
| **Node ≥ 18** *(disarankan)* **atau PHP ≥ 8.1** (+ `mbstring`) | Salah satu cukup untuk menyajikan halaman; tanpa dependensi. |
| **bash + curl** | Untuk launcher `portfolio-ku.sh` (macOS/Linux/WSL). Di Windows tanpa WSL, jalankan server Node langsung. |
| **Browser dengan WebGL** | Chrome, Edge, Firefox, Safari modern (desktop & ponsel). |
| **Claude Code** *(opsional)* | Hanya bila ingin menjalankan lewat skill `/portfolio-ku`. |
| [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) | Opsional — hanya untuk URL publik sementara. |
| **Git LFS** | Model 3D `.glb` (±130 MB) disimpan lewat [Git LFS](https://git-lfs.com) — pasang lalu `git lfs install` sebelum clone/pull; tanpa itu model arsitektur tidak ikut terunduh. |

## Menjalankan
Dari root repo ini (atau folder mana pun yang ingin disajikan):
```bash
bash skills/portfolio-ku/runtime/bin/portfolio-ku.sh start
```
Keluaran kira-kira:
```text
Portfolio-ku berjalan (node)
  URL      : http://127.0.0.1:8788/kerja
  Hentikan : bash "…/skills/portfolio-ku/runtime/bin/portfolio-ku.sh" stop
```
Buka URL itu di browser. Perintah lain: `… status`, `… stop`, `… restart`, `… url`, `… tunnel` (URL publik),
`… tunnel-stop`, `… detect` (cek Node/PHP/cloudflared). Flag: `--node`, `--php`, `--port N`, `--project DIR`,
`--bind ADDR`. `start` idempoten: bila server sudah berjalan untuk folder ini, hanya URL yang dicetak; port sibuk
otomatis pindah ke port bebas berikutnya (hingga +20).

### Lewat Claude Code (skill)
```bash
git clone https://github.com/vickyymosafan/portfolio-ku.git
mkdir -p ~/.claude/skills
ln -s "$PWD/portfolio-ku/skills/portfolio-ku" ~/.claude/skills/portfolio-ku   # atau: cp -R … ~/.claude/skills/
```
Buka sesi Claude Code baru lalu jalankan `/portfolio-ku` (perintah lain: `/portfolio-ku stop|status|publik|tutup-publik`).
Mencopot: `rm ~/.claude/skills/portfolio-ku` lalu `rm -rf ~/.cache/portfolio-ku`.

### Windows (tanpa WSL)
Launcher `portfolio-ku.sh` butuh bash; sebagai alternatif jalankan server Node langsung:
```powershell
$env:PORTFOLIO_PROJECT='D:\Project\portfolio-ku'
node skills\portfolio-ku\runtime\bin\serve-node.mjs
```
Server berjalan di latar depan; hentikan dengan `Ctrl+C`.

## Kontrol
| Aksi | Desktop | Ponsel |
|---|---|---|
| Berjalan | `W` `A` `S` `D` / tombol panah | joystick kiri bawah |
| Interaksi | `E` saat prompt muncul | tombol **AKSI** |
| Lihat sekitar | drag mouse | drag layar |
| Lompat ruangan | dock bawah (Exterior / Lobby / Dev Lab / Showcase / Lounge) | idem |
| Tutup modal | `Esc` | tombol ✕ |
| Kamera / tema | tombol header (Follow/Bebas, Malam/Siang) | idem |

## Mengubah konten & pengaturan
- **Konten CV** — sunting `skills/portfolio-ku/runtime/public/assets/cv-data.js` (profil, filosofi, zona, proyek,
  tech stack, kepemimpinan, sertifikasi). Berkas ini satu-satunya sumber data untuk galeri, modal proyek, dan CV teks.
  Brand di header (nama, IPK) ada di `views/page.html`.
- **Port** — `… start --port 9000`, env `PORTFOLIO_PORT`, atau berkas `<project>/.claude/portfolio-ku.json`:
```json
{ "port": 8790 }
```
| Variabel lingkungan | Arti |
|---|---|
| `PORTFOLIO_PORT` | Port awal (default `8788`; bila sibuk dicoba port bebas berikutnya). |
| `PORTFOLIO_RUNTIME` | `node` atau `php`. |
| `PORTFOLIO_BIND` | Alamat bind (default `127.0.0.1`; pakai `0.0.0.0` untuk jaringan lokal). |
| `PORTFOLIO_STATE_DIR` | Lokasi cache/PID/log (default `~/.cache/portfolio-ku/<slug-project>/`). |
| `PORTFOLIO_ALLOWED_HOSTS` | Host tambahan bila di belakang reverse proxy. |
| `PORTFOLIO_AUTOSTART=1` | Untuk hook SessionStart (lihat di bawah). |

### Autostart (opsional, mati bawaan)
Tambahkan ke `.claude/settings.json` project agar server menyala saat sesi dimulai (hook senyap, selesai dalam
milidetik, dan tidak melakukan apa pun tanpa `PORTFOLIO_AUTOSTART=1`):
```json
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
  "command": "PORTFOLIO_AUTOSTART=1 bash ~/.claude/skills/portfolio-ku/runtime/bin/portfolio-ku.sh autostart" } ] } ] } }
```

## Struktur repo
```text
skills/portfolio-ku/
  SKILL.md                  # definisi skill Claude Code (/portfolio-ku)
  runtime/
    bin/portfolio-ku.sh     # launcher: start|stop|status|restart|url|tunnel|tunnel-stop|detect
    bin/serve-node.mjs      # server Node ≥ 18 (tanpa dependensi)
    bin/check.mjs           # uji cepat endpoint, header, dan aset: node bin/check.mjs <url>
    bin/parity.mjs          # parity Node vs PHP (harus identik)
    lib/node/ · lib/php/    # modul HTTP bersama (header keamanan & host allowlist)
    public/index.php        # entry PHP
    public/assets/
      cv-data.js            # ← sumber konten CV
      portfolio-tour.js     # scene 3D, avatar, misi, dialog, modal
      vendor/three/         # three.js r170 (vendored, MIT)
      models/               # architecture_voffice_v2.glb (arsitektur, ±130 MB)
    views/page.html         # kerangka UI (topbar, kartu misi, dialog, modal)
docs/                       # tangkapan layar
hooks/hooks.json            # hook SessionStart (opsional, opt-in)
THIRD_PARTY_NOTICES.md      # lisensi pihak ketiga (three.js)
```
Sumber 3D mentah (`.blend`, model Meshy, tekstur bake) tidak disertakan di repo — hanya GLB hasil ekspor yang
dipakai runtime.

## URL publik (tunnel)
```bash
bash skills/portfolio-ku/runtime/bin/portfolio-ku.sh tunnel
```
Membuka quick tunnel cloudflared → `https://<acak>.trycloudflare.com/kerja`. Matikan dengan `… tunnel-stop`
(`stop` juga mematikannya). URL berganti setiap kali dibuka ulang.

> ⚠️ **Halaman ini tidak punya login.** Siapa pun yang tahu URL bisa melihat isinya (read-only). Bagikan hanya ke
> orang yang dipercaya dan matikan tunnel setelah selesai.

## Privasi & keamanan
- **Sepenuhnya lokal.** Halaman tidak memuat font, analitik, atau sumber daya eksternal apa pun (font sistem +
  three.js yang di-vendor). Tidak ada data yang dikirim ke mana pun kecuali lewat tunnel yang kamu nyalakan sendiri.
- **Read-only & tanpa file di project.** Server hanya menyajikan halaman + aset statis; PID, log, dan data tunnel ada
  di `~/.cache/portfolio-ku/`.
- **Bawaan hanya loopback** (`127.0.0.1`), hanya `GET`/`HEAD`, header `noindex` + CSP ketat, `X-Frame-Options: DENY`,
  whitelist tipe aset, dan penolakan Host asing (perlindungan DNS rebinding).
- Kontak yang tampil (email) memang data publik portofolio; tidak ada data lain yang dibaca atau diproses.

## Masalah umum / FAQ
**Loading bar lama di muat pertama.** `architecture_voffice_v2.glb` berukuran ±130 MB. Muat pertama memang lambat;
setelah itu di-cache browser ±1 jam. Semua aset lokal — tidak ada CDN.

**Port sudah dipakai.** Otomatis pindah ke port bebas berikutnya; pilih sendiri dengan `--port 9000` atau `"port"`
di `.claude/portfolio-ku.json`.

**Layar gelap / 3D tidak tampil.** Browser butuh WebGL; coba browser lain atau aktifkan akselerasi grafis.

**"Butuh Node ≥ 18 atau PHP ≥ 8.1".** Pasang salah satu (Node: https://nodejs.org). PHP butuh ekstensi `mbstring`.

**Membuka dari ponsel.** Satu jaringan: `PORTFOLIO_BIND=0.0.0.0 … restart` lalu buka `http://<ip-komputer>:8788/kerja`
(siapa pun di jaringan itu bisa membukanya). Beda jaringan: pakai [tunnel](#url-publik-tunnel).

**Di belakang reverse proxy / domain sendiri.** Teruskan prefiks `/kerja` ke `127.0.0.1:<port>` dan set
`PORTFOLIO_ALLOWED_HOSTS=portfolio.domainmu.com` (tanpa itu Host asing ditolak 421). Pasang autentikasi di proxy.

**Windows.** Jalankan lewat WSL, atau server Node langsung seperti di [Menjalankan](#menjalankan).

**URL publik belum bisa dibuka.** Alamat `trycloudflare.com` yang baru butuh ±30 detik sampai dikenal DNS.

## Kontribusi
Issue dan pull request dipersilakan di [github.com/vickyymosafan/portfolio-ku](https://github.com/vickyymosafan/portfolio-ku).
- Logika server ada di **dua** runtime: ubah `lib/node/*.mjs` **dan** `lib/php/*.php`, lalu jalankan
  `node skills/portfolio-ku/runtime/bin/parity.mjs --project=<project-uji>` (harus `PARITY OK`).
- Uji cepat saat server berjalan: `node skills/portfolio-ku/runtime/bin/check.mjs http://127.0.0.1:8788`.
- Konten CV hanya di `cv-data.js`; jangan menyertakan berkas 3D mentah berukuran besar (`.blend`, model Meshy) ke repo.

## Lisensi
[MIT](LICENSE) © 2026 vickyymosafan. Komponen pihak ketiga yang disertakan (three.js r170 — MIT) tercantum di
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

**Kontak:** [mvickymosafan@gmail.com](mailto:mvickymosafan@gmail.com) · [LinkedIn](https://www.linkedin.com/in/vickymosafan/) · [GitHub](https://github.com/vickyymosafan)
