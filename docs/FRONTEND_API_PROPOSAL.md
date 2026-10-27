# Usulan kontrak API frontend FlexBoard

Status: **AUTH TERSEDIA — kontrak domain lain tetap proposed**.
Endpoint auth di bawah telah dibuat sebagai Vercel serverless handler. Endpoint domain lainnya belum tersedia.
Dokumen ini bukan bukti endpoint domain tersedia. Implementasi frontend saat ini tidak memanggil endpoint domain di bawah.
Matriks halaman/aksi, kebutuhan payload, dan pertanyaan handoff backend: [FRONTEND_INTEGRATION_MATRIX.md](FRONTEND_INTEGRATION_MATRIX.md).

## Kontrak yang tersedia

`GET /api/health` mengembalikan `{ "status": "ok", "service": "flexboard-api" }`.

Auth menggunakan Better Auth `1.7.14` pada origin yang sama:

- `POST /api/auth/sign-in/email` — body `{ "email": string, "password": string }`; membuat session cookie HttpOnly.
- `POST /api/auth/sign-out` — mencabut session aktif dan menghapus cookie.
- `GET /api/auth/get-session` — session Better Auth mentah untuk client library.
- `GET /api/auth/me` — profil FlexBoard tervalidasi dan capabilities.

Login gagal mengembalikan error 4xx dari Better Auth tanpa detail credential. `/api/auth/me` mengembalikan 401 untuk guest, session expired/revoked, atau profile inactive. Cookie tidak boleh dibaca JavaScript dan tidak disimpan localStorage. Signup publik dinonaktifkan.

Contoh `/api/auth/me` sukses:

```json
{
  "data": {
    "user": { "id": "profile-uuid", "authSubject": "auth-user-id", "email": "member@example.com", "displayName": "Member", "role": "member" },
    "capabilities": { "readProgress": true, "readTasks": true, "checklist": true, "comment": true, "createTask": false, "archiveTask": false, "manageAssignments": false, "manageMembers": false }
  }
}
```

Frontend harus mengirim `credentials: 'same-origin'`. API dan frontend lokal memakai same-origin Vercel dev/proxy; `BETTER_AUTH_URL` dan `BETTER_AUTH_SECRET` hanya backend. Tidak ada deployment production yang diverifikasi.

## Usulan endpoint

| Kebutuhan | Metode dan path usulan | Catatan |
|---|---|---|
| Sesi | GET /api/auth/me | Profil tervalidasi, role, capabilities |
| Login | POST /api/auth/login | Identifier/payload dan mekanisme sesi belum dipilih |
| Logout | POST /api/auth/logout | Mengakhiri sesi server |
| Dashboard | GET /api/dashboard | Ringkasan sesuai akses |
| Proyek | GET/POST /api/projects | List/create |
| Ubah proyek | PATCH /api/projects/:id | Field yang diizinkan |
| Arsip proyek | POST /api/projects/:id/archive | Soft archive, perlu keputusan |
| Anggota proyek | Belum ditentukan | Baca/ubah membership sesuai izin |
| Anggota/profil | GET /api/members, GET /api/members/:id | Role, status, ringkasan tugas/progres |
| Profil/role/status | Belum ditentukan | Kebijakan provisioning dan kemampuan admin belum diputuskan |
| Tugas | GET/POST /api/tasks | List/create |
| Detail/update | GET/PATCH /api/tasks/:id | Multi-assignee, metadata, checklist, izin |
| Arsip tugas | POST /api/tasks/:id/archive | Konfirmasi sebelum mutasi |
| Checklist | POST /api/tasks/:id/checklists | Item aktif |
| Update checklist | PATCH /api/checklists/:id | Status/judul/urutan menurut izin |
| Arsip checklist | Belum ditentukan | Jangan menebak penghapusan permanen |
| Laporan | GET/POST /api/tasks/:id/updates | Kebutuhan laporan/kendala mengikuti PRD; bentuk, histori, dan kontrak belum final |
| Update laporan | PATCH /api/task-updates/:id | Ownership ditentukan server |
| Progres tim | GET /api/progress/team | Nilai, cakupan, status agregasi |
| Tugas pembentuk progres | GET /api/tasks dengan filter anggota/proyek atau endpoint khusus | Pilih satu kontrak bersama |
| Aktivitas | GET /api/activity | Actor, action, object, timestamp; pagination |

## Bentuk respons yang diusulkan

- Sukses: `{ data, meta }`.
- Error: `{ error: { code, message, details } }`.
- Daftar: metadata pagination, limit, urutan, dan filter yang diterapkan.
- Waktu: ISO 8601 dengan offset eksplisit; UTC server merupakan usulan.
- Progres: angka nullable, alasan nilai tidak tersedia, cakupan, jumlah tugas dihitung/dikecualikan. `null` bukan `0`.
- Tugas: id, project, title, description, status, priority, due_at, weight, assignees, checklist/progress, timestamps, permissions.
- Izin per objek: kemampuan baca/edit/archive/checklist/update; frontend tidak menyimpulkan semua dari role.
- Mutasi checklist: respons mengandung kondisi tersimpan dan progres terbaru, atau kontrak mewajibkan refetch.
- Konflik: version/updated_at dan 409 merupakan usulan; bentuk final belum disepakati.

## Hal yang harus ditetapkan sebelum integrasi

1. Username/email/provider, payload login, sesi cookie/token, logout, expiry, CSRF dan CORS.
2. URL development serta apakah API same-origin. Jangan memasukkan secret ke VITE_*.
3. Enum prioritas/status, transisi status, batas panjang, ID, dan field error.
4. Query pencarian, proyek/anggota/status/prioritas/deadline, pagination, sorting. Parameter URL pratinjau belum merupakan kontrak query API.
5. Visibilitas Member dan kewenangan checklist bersama.
6. Semantik agregasi, tugas tanpa checklist, multi-assignee, bobot, dan review.
7. Kebijakan timezone/input deadline dan nilai nullable.
8. Endpoint laporan, profil, pengelolaan anggota, arsip, dan membership proyek.

## Rekomendasi teknis, bukan keputusan

Sesi cookie HttpOnly, Secure produksi, same-origin bila memungkinkan. Backend menentukan CSRF/SameSite dan validasi izin. Jangan simpan kredensial/token rahasia dalam localStorage.
Client API terpusat setelah kontrak final: cancellation, error aman, 401/403/404/409/422/429/5xx. Tidak ada retry mutasi otomatis tanpa idempotensi.
Tidak ada mock jaringan, domain fixture, seed, atau login simulasi yang dibuat oleh pekerjaan ini.
