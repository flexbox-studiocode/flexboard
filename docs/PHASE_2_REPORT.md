# Laporan Tahap 2

Status laporan ini diperbarui setelah integration test PostgreSQL ditambahkan. Test memakai database sementara bernama `flexboard_test_<random>`, dibuat dari koneksi maintenance ke database `postgres`, lalu dihapus hanya setelah test selesai. Database `flexboard_db` tidak di-drop, tidak di-reset, dan tidak dipakai sebagai target destruktif.

## Cakupan test

- Migration dari database kosong.
- Migration kedua kali tanpa perubahan atau duplicate error.
- Delapan tabel domain.
- Foreign key invalid.
- Unique project-member dan task-assignee.
- Bobot task harus positif.
- Migration gagal di dalam transaksi dan tidak tercatat pada `schema_migrations`.
- Pool dan database test dibersihkan pada `finally`.

Test dilewati secara eksplisit jika `DATABASE_URL` tidak tersedia. Seed lokal hanya berjalan saat `NODE_ENV=development` dan target database bernama `flexboard_db`, `flexboard_dev`, atau `flexboard_development`; seed ditolak pada production dan target lain. Seed menggunakan `ON CONFLICT (id) DO NOTHING` dan diverifikasi dengan query jumlah fixture. Integration test memakai nama migration sementara berbasis UUID, menghapus hanya file miliknya, serta melaporkan kegagalan cleanup tanpa menutupi error utama.

## Perintah

```bash
npm run test:node
npm run db:migrate
npm run db:migrate:status
npm run db:seed
npm run lint
npm test
npm run build
```

Migration runner memakai urutan filename numerik, transaksi per file, advisory lock, dan cleanup connection pool dari CLI. Migration baru tidak boleh mengubah migration yang telah diterapkan.

## Asumsi yang masih proposed

UUID adalah ID internal sampai provider autentikasi dipilih. `auth_subject` nullable dan tidak mengunci provider. Status, role, visibilitas, progres, review, dan timezone mengikuti keputusan produk yang masih proposed; Tahap 2 hanya menyediakan constraint dasar schema.
