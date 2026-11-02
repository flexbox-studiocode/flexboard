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

---

## Provisioning Production (Neon PostgreSQL)

Setelah migrasi `001` sampai `006` berhasil diterapkan ke database production Neon (`flexboard_prod`), akun pengguna dibuat secara eksplisit melalui script terminal `scripts/provision-production-users.mjs`. Pendaftaran mandiri (sign-up) memang dinonaktifkan di Better Auth (`disableSignUp: true`), jadi satu-satunya cara membuat akun production adalah provisioning oleh operator.

### Tujuan Script

Membuat **satu** akun Better Auth (Leader atau Member) per eksekusi pada database production `flexboard_prod` yang di-host Neon. Script memanggil `provisionAuthUser()` yang sudah ada, sehingga:

- Password di-hash oleh Better Auth (`better-auth/crypto`), bukan oleh script ini.
- Pembuatan `"user"` + `account` (providerId `credential`) + pengaitan `profiles` terjadi dalam **satu transaksi** (`BEGIN`/`COMMIT`/`ROLLBACK`).
- Email dinormalisasi ke lowercase dan ditolak jika sudah terdaftar.

### Prasyarat

- File `.env.neon` (lokal, **tidak di-commit ke Git** — sudah tercakup `.env*` di `.gitignore`) berisi `DATABASE_URL` ke Neon `flexboard_prod`.
- Hanya dapat dijalankan di terminal lokal; script menolak dijalankan di runtime Vercel (`VERCEL` env).

### Pengaman yang Diterapkan

| Pemeriksaan | Perilaku |
| --- | --- |
| `DATABASE_URL` tidak ada / tidak valid / bukan PostgreSQL | Berhenti sebelum prompt |
| Hostname bukan `*.neon.tech` (localhost, 127.0.0.1, host lain) | Ditolak |
| Nama database bukan tepat `flexboard_prod` | Ditolak |
| Berjalan di Vercel | Ditolak |
| Password | Masked (`*`), minimal 8 karakter |
| Email | Divalidasi format & di-lowercase; email duplikat ditolak |
| Role | Hanya `leader` atau `member` |
| Konfirmasi | Wajib konfirmasi `y` sebelum menulis ke DB |
| Output | Hanya role, email, user ID, profile ID — **tanpa** connection string, password, atau hash |

Script **tidak** menjalankan migrasi, seed, `DROP`, `TRUNCATE`, atau reset, dan tidak mengubah akun existing.

### Cara Menjalankan

```bash
npm run auth:provision:production
```

Perintah ini setara dengan `node --env-file=.env.neon scripts/provision-production-users.mjs`. Untuk memeriksa input tanpa menulis ke database, tambahkan `--dry-run`:

```bash
node --env-file=.env.neon scripts/provision-production-users.mjs --dry-run
```

### Membuat Akun Leader

```bash
npm run auth:provision:production
```

Ikuti instruksi:
1. Periksa ringkasan host & database yang ditampilkan (password DB tidak ditampilkan).
2. Masukkan nama tampilan.
3. Masukkan email.
4. Pilih role `leader`.
5. Masukkan password (minimal 8 karakter, tersamar saat diketik).
6. Konfirmasi pembuatan akun.

### Membuat Akun Member

Setelah Leader dibuat, jalankan lagi perintah yang sama dan pilih role `member`:

```bash
npm run auth:provision:production
```

Satu eksekusi = satu akun. Ulangi untuk setiap Member.

### Verifikasi Setelah Provisioning

1. Catat `User ID` dan `Profile ID` yang dicetak (jangan bagikan password).
2. Opsional, cek di Neon SQL Editor (read-only):
   ```sql
   SELECT p.display_name, p.role, p.auth_subject, u.email
   FROM profiles p LEFT JOIN "user" u ON u.id = p.auth_subject
   ORDER BY p.created_at;
   ```
3. Buka website production, login dengan email & password tersebut.
4. Pastikan sesi terbentuk dan dashboard/board tampil sesuai role.

### Peringatan

> Provisioning production **hanya boleh dilakukan oleh operator berwenang**. Tidak ada endpoint HTTP publik untuk membuat akun. Jangan pernah mengirim `.env.neon`, `DATABASE_URL`, atau `AUTH_SECRET` melalui chat/issue/tiket.

### Menjalankan Pengujian Aman

```bash
node --test tests/node/production-provisioning.test.js
```

Test ini hanya memvalidasi logika target/input dan tidak menghubungi database production.
