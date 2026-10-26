# FlexBoard

FlexBoard adalah fondasi aplikasi internal FlexBox untuk mengelola tugas dan memantau progres tim. Tahap 1 menyediakan shell React, routing, layout responsif, komponen UI dasar, dan endpoint health check Vercel.

## Teknologi
- React JS + Vite
- React Router
- CSS modular global dengan design tokens
- Lucide React
- Node.js serverless function kompatibel Vercel

## Prasyarat
Node.js 22+ dan npm 10+.

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

## Script
- `npm run dev` — development server
- `npm run build` — build produksi
- `npm run preview` — preview hasil build
- `npm run lint` — pemeriksaan ESLint
- `npm test` — Node test runner; belum ada test domain pada Tahap 1

## Struktur utama
```text
api/health.js          # Vercel serverless health endpoint
src/App.jsx            # shell, routing, halaman placeholder
src/main.jsx           # entry React
src/styles/global.css  # design tokens dan styling responsif
.flexboard/            # PRD, PLAN, dan aset logo
```

## Environment
Salin `.env.example` menjadi `.env` untuk konfigurasi lokal. `DATABASE_URL` dan `AUTH_SECRET` hanya untuk backend dan belum digunakan pada Tahap 1. Jangan memakai prefix `VITE_` untuk secret.

## Status Tahap 1
PostgreSQL, autentikasi, sesi, role, migration, API domain, dan data produksi belum selesai. Halaman internal saat ini adalah placeholder terarah tanpa data palsu produksi. Provider PostgreSQL dan strategi autentikasi ditetapkan sebelum Tahap 2/3.
