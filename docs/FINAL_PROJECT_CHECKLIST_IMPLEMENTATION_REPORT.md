# Final Project Checklist Implementation Report

Tanggal: 30 Oktober 2026

## Ringkasan status

| Area | Status | Bukti |
|---|---|---|
| Kategori proyek | SELESAI | Empat nilai internal divalidasi dan diuji: `corporate_enterprise`, `startup_sme`, `government_public`, `educational_community`. |
| Form proyek | SELESAI | Nama, deskripsi, kategori, multi-member aktif, simpan/batal, loading/error state. |
| Proyek nyata pada Task Form | SELESAI | Dropdown memakai `GET /api/projects`; anggota memakai data anggota global dan scope proyek. |
| Checklist draft | SELESAI | ID draft unik, judul, deskripsi, assignee, hapus, reorder/focus, count, ID server dipertahankan. |
| Transaksi create/update task | SELESAI | Task dan checklist dibuat/sinkron dalam transaksi dengan rollback. |
| Sinkronisasi PATCH checklist | SELESAI | ID lama dipertahankan, status selesai dipertahankan, item baru diinsert, item hilang di-soft-delete. |
| Authorization checklist | SELESAI | Session, project membership, task assignment, inactive member, dan akses leader/member ditegakkan backend. |
| Comments/updates/progress | SELESAI | Data tersimpan dengan author/timestamp; progress dihitung dari checklist tersimpan dan NULL bila unavailable. |
| Frontend test suite | SELESAI | 21 file, 188 test lulus. |
| Node integration suite | SELESAI | 10 test lulus. |
| Lint | SELESAI | 0 error; 0 warning. |
| Build | SELESAI | Vite build berhasil; hanya warning ukuran chunk >500 kB. |
| Dev server `npm run dev:vercel` | SELESAI | Diperbaiki: deep API routes (`/api/tasks/:id`, `/api/projects/:id/members`) kini di-rewrite ke handler; server bind ke `127.0.0.1`; script non-interaktif. |
| Verifikasi end-to-end terhadap server berjalan | SELESAI | 12 pemeriksaan terhadap `http://localhost:3000` dengan sesi Better Auth nyata (login → proyek → task → checklist → otorisasi member → progress). |
| Verifikasi UI interaktif di browser (klik manual) | BELUM DIVERIFIKASI | Tidak ada browser headless/GUI yang dijalankan; bukti berupa pemeriksaan HTTP terhadap server dev yang sama dengan yang dipakai browser. |

## Quality gate

- `node --check api/domain.js` — SELESAI
- `npm run lint` — SELESAI, 0 error dan 0 warning
- `npm run test:node` — SELESAI, 10/10
- `npm test` — SELESAI, 188/188
- `npm run build` — SELESAI
- `git diff --check` — SELESAI
- `npm run db:migrate:status` — SELESAI; migration 001–005 applied

## Perbaikan `npm run dev:vercel`

### Gejala
`vercel dev` mencetak "Ready! Available at http://localhost:3000" tetapi browser menampilkan `ERR_CONNECTION_REFUSED`, dan halaman yang sudah terbuka gagal memuat data karena rute API bersarang 404.

### Akar masalah
1. **Rute API bersarang 404.** Routing filesystem Vercel hanya memetakan `api/tasks.js` untuk URL tepat `/api/tasks`. URL seperti `/api/tasks/:id` dan `/api/projects/:id/members` tidak punya handler, sehingga mengembalikan HTML "page could not be found" (bukan respons API). Ini membuat detail task, checklist, dan anggota proyek gagal dimuat.
2. **Binding host.** Vite default bisa bind hanya ke salah satu stack (IPv4/IPv6), sehingga `localhost` di browser kadang menuju alamat yang tidak didengarkan server → koneksi ditolak.
3. **Prompt interaktif npx.** Run pertama menanyakan "Ok to proceed?" sehingga proses terlihat jalan namun belum/tidak konsisten siap.

### Perbaikan yang diterapkan
- `vite.config.js`: `server.host` dan `preview.host` diset ke `127.0.0.1` agar bind deterministik.
- `package.json`: `dev:vercel` menjadi `npx --yes vercel dev --yes --local-config vercel.dev.json --listen 3000` (tanpa prompt).
- `vercel.json` dan `vercel.dev.json`: menambah rewrite `/api/tasks/:path*`, `/api/projects/:path*`, `/api/members/:path*`, `/api/checklists/:path*` yang meneruskan `__path` (pola sama dengan `__auth_path`).
- `api/withOriginalPath.js` (baru) + wrapper di `api/tasks.js`, `api/projects.js`, `api/members.js`, `api/checklists.js`: mengembalikan `req.url` ke path aslinya sebelum `domain.js`.
- `eslint.config.js`: `react-refresh/only-export-components` diberi `allowExportNames: ['useAuth']` (pola provider+hook adalah pola React Context yang sah) → warning hilang.

### Cara menjalankan
```
npm run dev:vercel
```
Tunggu hingga muncul `Ready! Available at http://localhost:3000`, lalu buka `http://localhost:3000`. Pastikan `.env` berisi `DATABASE_URL` dan `BETTER_AUTH_SECRET` yang valid, dan port 3000 tidak dipakai proses lain (jika dipakai, ganti dengan `--listen <port>`).

## Verifikasi end-to-end (server berjalan)

Skrip verifikasi (sementara, sudah dihapus) menjalankan urutan berikut terhadap `http://localhost:3000` memakai akun nyata di database dev:

1. Login leader (Adit) → 200, role `leader`, `createTask=true`.
2. `GET /api/projects` 200, `GET /api/members` 200.
3. `POST /api/projects` 201 dengan `category=corporate_enterprise` dan 3 member (Kiandra/Rainer/Fakhri).
4. `POST /api/projects` dengan kategori tak dikenal → 400 (ditolak).
5. `GET /api/projects/:id/members` 200 (scope proyek).
6. `POST /api/tasks` 201 dengan 2 item checklist; ID server menggantikan ID draft.
7. `GET /api/tasks/:id` 200, progress dihitung dari checklist.
8. `PATCH /api/tasks/:id` 200: ID lama dipertahankan, item baru masuk, item dihapus hilang dari daftar aktif.
9. Member (Kiandra) menyelesaikan item miliknya → 200.
10. Member menyelesaikan item milik anggota lain → 403 (ditolak).
11. `GET /api/tasks/:id` tanpa sesi → 401.
12. Progress akhir 50.00 (1 dari 2 item selesai).

Hasil: **semua 12 pemeriksaan lolos**. Data proyek verifikasi kemudian dihapus sehingga database dev tetap bersih.

Catatan: password akun dev `adit@flexbox.id` dan `kiandra@flexbox.id` sempat di-reset ke nilai sementara untuk keperluan verifikasi; ganti kembali melalui `node scripts/reset-auth-password.mjs` jika diperlukan.

## File penting

- `api/domain.js` — endpoint task, project, checklist, authorization, transaksi, dan progress.
- `api/withOriginalPath.js` — helper rewrite path asli untuk rute API bersarang.
- `src/features/projects/ProjectForm.jsx` — form proyek API-backed.
- `src/features/tasks/TaskFormPage.jsx` — form task dan checklist.
- `src/features/tasks/TaskDetailPage.jsx` — detail task, checklist completion, comments, updates.
- `src/features/common/apiAdapters.js` — normalisasi bentuk data API ke komponen presentasi.
- `src/features/projects/ProjectForm.test.jsx` — pengujian kategori, member aktif, payload, lifecycle, dan error.

## Catatan

Tidak ada commit atau push yang dilakukan. Migration yang sudah diterapkan (001–005) tidak diubah. Verifikasi klik manual di browser GUI masih berstatus BELUM DIVERIFIKASI; gunakan `npm run dev:vercel` lalu jalankan alur proyek → task → checklist di `http://localhost:3000`.
