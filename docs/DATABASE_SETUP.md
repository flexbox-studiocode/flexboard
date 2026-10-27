# PostgreSQL Tahap 2

Prasyarat: Node.js 22.13+ dan PostgreSQL 18+. `DATABASE_URL` hanya backend; jangan gunakan `VITE_`.

1. Salin `.env.example` menjadi `.env`.
2. Ganti placeholder `USER` dan `PASSWORD` secara lokal. Jangan commit `.env`.
3. Pastikan database development khusus tersedia, lalu jalankan:

```bash
npm run db:migrate
npm run db:migrate:status
npm run db:seed
```

Seed hanya boleh dijalankan secara eksplisit dengan `NODE_ENV=development` dan target database bernama `flexboard_db`, `flexboard_dev`, atau `flexboard_development`. Seed sintetis dan idempotent; tidak membuat akun login. Seed ditolak pada environment lain atau nama database lain.

Migration `001_initial_schema.sql` membuat `profiles`, `projects`, `project_members`, `tasks`, `task_assignees`, `checklist_items`, `task_updates`, dan `activity_logs`. ID internal memakai UUID; hubungan provider auth belum dikunci. Arsip memakai `archived_at`; data tidak dihapus cascade agar histori terjaga.

Troubleshooting: `ECONNREFUSED` berarti PostgreSQL belum berjalan atau host/port salah; password gagal berarti periksa kredensial lokal; database tidak ditemukan berarti buat database development dengan nama yang benar; permission denied berarti beri hak schema/database kepada user development. Jangan menjalankan seed pada production. Provider deployment PostgreSQL dan autentikasi belum dipilih.
