# Laporan Tahap 3 — Remediasi Auth

## Implementasi final
Better Auth `1.7.14` sekarang digunakan oleh runtime melalui `server/better-auth.config.js` dan `server/auth.js`. Implementasi custom SHA-256 sebelumnya telah dihapus. Better Auth menangani email/password, scrypt password hashing default, session server-side, dan cookie session.

Konfigurasi:
- PostgreSQL server-side melalui `pg.Pool`.
- `emailAndPassword.enabled: true`.
- `emailAndPassword.disableSignUp: true`; tidak ada signup publik.
- Session 7 hari, refresh harian.
- Secure cookie di production.
- `trustedOrigins` allowlist, bukan wildcard.
- Handler serverless catch-all: `api/auth/[[...all]].js`.

## Endpoint aktual
Better Auth menyediakan route standar di bawah `/api/auth/*`, termasuk login email/password, logout, dan session. `GET /api/auth/me` adalah endpoint aplikasi yang menggabungkan session Better Auth dengan profile FlexBoard.

Payload login Better Auth: `{ email, password }`. Cookie dikelola library, HttpOnly dan tidak disimpan di localStorage. Logout menghapus/mencabut session library.

`GET /api/auth/me` sukses:
```json
{"data":{"user":{"id":"profile-uuid","authSubject":"auth-user-id","email":"user@example.com","displayName":"Name","role":"member"},"capabilities":{"readProgress":true,"readTasks":true,"checklist":true,"comment":true,"createTask":false,"archiveTask":false,"manageAssignments":false,"manageMembers":false}}}
```

Guest atau session expired/revoked: `401 UNAUTHENTICATED`. Profile inactive juga ditolak walaupun session Better Auth masih valid.

## Migration
`migrations/002_authentication_schema.sql` sekarang mengikuti schema yang dihasilkan Better Auth `1.7.14`: `user`, `session`, `account`, `verification`, serta indeks terkait. Migration 001 tidak diubah. `profiles.auth_subject` menyimpan ID Better Auth sebagai `text`; tidak ada password di `profiles`.

Migration generator resmi dijalankan untuk inspeksi SQL. SQL hasil inspeksi dipindahkan ke migration runner proyek; Better Auth CLI tidak dijalankan terhadap `flexboard_db`.

## Profile linking dan provisioning
Signup publik nonaktif. Provisioning harus dilakukan melalui maintenance script terkontrol memakai Better Auth API/library untuk membuat user, lalu transaksi idempotent menghubungkan `profiles.auth_subject` berdasarkan ID user. Role berasal dari row profile yang sudah dipersiapkan, bukan request login. Tidak ada akun default atau credential di repository.

Provisioning Leader CLI belum tersedia; ini masih blocker operasional sebelum deployment.

## Otorisasi
`server/authorization.js` menyediakan `requireUser`, `requireLeader`, `canReadProject`, `canReadTask`, `canUpdateChecklist`, dan `canCommentOnTask`. Semua helper memvalidasi session Better Auth dan profile aktif. Domain CRUD belum dibuat pada Tahap 3, sehingga enforcement endpoint task/checklist/comment lengkap menunggu Tahap API domain.

## CSRF, CORS, dan rate limit
Same-origin direkomendasikan. Better Auth trusted origin memakai allowlist. Tidak ada wildcard credentials. Rate limiting terdistribusi belum tersedia dan harus memakai layanan eksternal/runtime store sebelum production. Cross-origin mutation belum didukung sebagai kontrak.

## Audit dependency
`npm audit` menemukan 2 moderate pada `react-router`/`react-router-dom`, terkait open redirect dan SSR hydration deserialization; fix yang tersedia adalah major upgrade ke `react-router-dom 7.18.4`. Tidak menjalankan `npm audit fix --force`.

## Status pengujian terbaru
- `npm run test:node`: 8 lulus, 0 gagal pada eksekusi terbaru; warning Better Auth `Invalid password` berasal dari kasus password salah yang memang diuji.
- `npm test`: 78 lulus pada eksekusi terbaru.
- `npm run lint`: lulus pada eksekusi terbaru.
- `npm run build`: lulus dengan warning bundle JavaScript sekitar 587 kB.
- `git diff --check`: lulus pada eksekusi terbaru.
- `npm run db:migrate:status`: migration 001 dan 002 berstatus applied pada database development lokal `flexboard_db`.
- Migration 002 diuji melalui database test sementara hanya setelah test suite dijalankan ulang.
- Tidak ada deployment production yang diverifikasi.

## Belum siap production
Provisioning Leader CLI, integration test Better Auth login/logout, domain endpoint authorization, CSRF policy lintas origin, rate limiting terdistribusi, dan keputusan upgrade React Router masih terbuka. Jangan menerapkan migration ke `flexboard_db` atau deploy sebelum item tersebut diverifikasi.
