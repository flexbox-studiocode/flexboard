# FlexBoard

FlexBoard adalah fondasi aplikasi internal FlexBox untuk mengelola tugas dan memantau progres tim. Frontend saat ini menyediakan pratinjau UI berdasarkan Figma, routing, komponen bersama, dan layout responsif. **Belum ada autentikasi atau integrasi domain: ini bukan MVP yang berfungsi end-to-end.**

Status fitur, keputusan terbuka, dan deviasi Figma: [docs/FRONTEND_STATUS.md](docs/FRONTEND_STATUS.md).
Usulan kontrak API yang belum disepakati: [docs/FRONTEND_API_PROPOSAL.md](docs/FRONTEND_API_PROPOSAL.md).

## Teknologi
- React JS + Vite
- React Router
- CSS modular global dengan design tokens
- Lucide React
- Node.js serverless function kompatibel Vercel

## Prasyarat
Node.js 22.13+ atau 24+ dan npm 10+. Pengujian pekerjaan ini menggunakan Node.js 24.16.0.

## Instalasi dan frontend
```bash
npm install
npm run dev
```
Buka `http://localhost:5173`.

Build dan preview produksi:
```bash
npm run build
npm run preview
```

## API health check
Endpoint tersedia pada `GET /api/health` dan mengembalikan:
```json
{"status":"ok","service":"flexboard-api"}
```
Untuk pengujian lokal, jalankan melalui Vercel CLI (`npx vercel dev`), lalu:
```powershell
Invoke-RestMethod http://localhost:3000/api/health
```
Atau deploy ke Vercel dan panggil URL `/api/health`. Vite dev server tidak menjalankan function `api/` secara langsung.

`vercel.json` memprioritaskan file/function yang tersedia, mengembalikan 404 untuk API yang tidak tersedia, lalu mengarahkan deep link frontend ke `index.html`. Konfigurasi diuji lokal; deployment nyata belum diverifikasi.

## Script
- `npm run dev` — development server
- `npm run build` — build produksi
- `npm run preview` — preview hasil build
- `npm run lint` — pemeriksaan ESLint
- `npm test` — Vitest dan React Testing Library untuk komponen/routing tanpa mock API
- `npm run test:watch` — mode pengembangan tes komponen
- `npm run test:browser` — Playwright Chromium; jalankan `npx playwright install chromium` terlebih dahulu
- `npm run test:node` — 3 tes konfigurasi routing deployment, terpisah dari Vitest/Playwright; bukan pengujian runtime Vercel

Tes browser menjalankan Vite lokal otomatis atau memakai server yang sudah aktif pada `127.0.0.1:5173`. Tidak membuat akun/sesi/tugas palsu dan tidak menguji backend yang belum tersedia.

## Struktur utama
```text
api/health.js          # Vercel serverless health endpoint
src/App.jsx            # entry aplikasi
src/main.jsx           # entry React + BrowserRouter
src/app/               # deklarasi route dan tes routing
src/components/        # komponen UI dan layout bersama
src/features/          # halaman dan tampilan per fitur, belum terintegrasi
src/assets/brand/      # logo lokal dari Figma
src/styles/            # CSS tokens, UI, global, dan layout
tests/browser/         # smoke test UI Chromium tanpa backend
.flexboard/            # PRD, PLAN, dan aset logo
```

## Environment
Salin `.env.example` menjadi `.env` untuk konfigurasi lokal. `DATABASE_URL` dan `AUTH_SECRET` hanya untuk backend dan belum digunakan pada Tahap 1. Jangan memakai prefix `VITE_` untuk secret.

## PostgreSQL Tahap 2

Setup, migration, status, dan seed development: [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md). Migration memakai `pg`, transaksi per file, dan advisory lock. Belum ada API domain, autentikasi, atau integrasi frontend.

## Status Tahap 1
PostgreSQL, autentikasi, sesi, role, migration, API domain, dan data produksi belum tersedia. Halaman workspace merupakan pratinjau publik tanpa data privat dan dengan pengungkapan status integrasi. Aksi penyimpanan dan login nonaktif; input form baru dan rancangan checklist hanya state lokal yang hilang saat keluar halaman. Profil pratinjau tidak menampilkan identitas atau role sebelum sesi tersedia. Jangan memasukkan data sensitif pada pratinjau. Provider PostgreSQL, strategi autentikasi, kontrak API, serta aturan bisnis terbuka harus disepakati sebelum integrasi.

Audit dependensi masih melaporkan 2 temuan moderate React Router yang memerlukan evaluasi migrasi major; tidak ada high/critical pada audit terakhir. Jangan menganggap fondasi ini siap produksi.
