# Kiandra-Backend-FlexBoard.md

## 1. Informasi Task

- **Proyek:** FlexBoard
- **Developer:** Kiandra
- **Role:** Backend Developer
- **Dokumen acuan:** `PRD_FLEXBOARD.md` dan `PLAN_FLEXBOARD.md`
- **Frontend:** React JS + Vite (Rainer)
- **Backend:** Node.js API yang kompatibel dengan runtime Vercel
- **Database:** PostgreSQL
- **Hosting:** Vercel untuk frontend/API; provider PostgreSQL ditetapkan sebelum koneksi production
- **Prioritas:** Keamanan, konsistensi data, dan MVP terlebih dahulu

## 2. Tujuan

Membangun backend FlexBoard sebagai sumber kebenaran untuk autentikasi, otorisasi, manajemen data, checklist, progres otomatis, dan aktivitas. Backend harus menolak akses yang tidak sah walaupun request dibuat di luar antarmuka frontend.

Kiandra bertanggung jawab atas desain arsitektur API, schema PostgreSQL, migration, autentikasi/sesi, otorisasi role dan kepemilikan data, validasi, kalkulasi progres, activity log, integrasi Vercel, pengujian backend, serta dokumentasi API untuk Rainer.

## 3. Batas Tanggung Jawab

### Termasuk pekerjaan Kiandra

- Memilih dan mendokumentasikan provider PostgreSQL, driver/ORM, dan strategi koneksi.
- Menyediakan API Node.js yang sesuai dengan runtime deployment Vercel yang dipilih.
- Mendesain dan memelihara migration database.
- Menerapkan login/logout dan validasi sesi.
- Memvalidasi role Leader/Admin dan Member pada setiap endpoint.
- CRUD proyek, anggota, tugas, penugasan, checklist, dan laporan pekerjaan.
- Menghitung progres tugas, anggota, dan proyek di backend/database.
- Membuat activity log setelah operasi berhasil.
- Menyediakan dokumentasi kontrak API untuk Rainer.
- Menyiapkan environment variables dan deployment backend.
- Menulis unit/integration test, menguji keamanan akses, dan memperbaiki bug.

### Bukan tanggung jawab utama Kiandra

- Membuat seluruh layout dan komponen visual React.
- Mengatur detail styling halaman frontend, selain membantu kebutuhan integrasi.
- Menyatakan fitur selesai hanya karena endpoint merespons sukses; data, akses, dan kasus tepi harus diuji.
- Menaruh kredensial database pada frontend atau repository.
- Mengunci provider/teknologi autentikasi sebelum keputusan tersebut disepakati tim.

## 4. Keputusan Teknis Awal yang Wajib

Sebelum koneksi produksi dibangun:

- [ ] Pilih provider PostgreSQL yang kompatibel dengan aplikasi di Vercel.
- [ ] Pilih driver atau ORM yang mendukung runtime dan strategi connection pooling yang dipakai.
- [ ] Pilih mekanisme autentikasi yang teruji.
- [ ] Tentukan cara membuat akun Leader awal secara aman.
- [ ] Tentukan apakah API memakai cookie sesi atau token; dokumentasikan kontrak untuk Rainer.
- [ ] Tetapkan format error API.
- [ ] Sepakati JavaScript atau TypeScript untuk backend.
- [ ] Sepakati migration tool dan perintah pengembangan lokal.
- [ ] Pisahkan konfigurasi development dan production.
- [ ] Tuliskan semua keputusan di README atau dokumen arsitektur.

**Rekomendasi keamanan:** bila menggunakan cookie sesi, gunakan cookie `HttpOnly`, `Secure` pada production, dan `SameSite` yang sesuai; tinjau CORS/CSRF jika frontend dan API berada pada origin berbeda. Jangan simpan token rahasia dalam `localStorage` tanpa analisis keamanan yang jelas. Gunakan mekanisme autentikasi teruji dan jangan menyimpan password sebagai teks biasa.

Vercel bukan database PostgreSQL secara otomatis. Pastikan provider dipilih, akses database dibatasi, dan koneksi cocok untuk serverless. Jangan membuat server proses panjang jika deployment memakai function runtime.

## 5. Tahap BE-0 — Audit repository dan kontrak integrasi

- [ ] Baca `PRD_FLEXBOARD.md` dan `PLAN_FLEXBOARD.md`.
- [ ] Periksa repository, branch, file yang sudah ada, dan script package.
- [ ] Jangan menghapus file pengguna atau konfigurasi yang belum dipahami.
- [ ] Sepakati dengan Rainer daftar endpoint, metode, payload, bentuk respons, dan perilaku error.
- [ ] Tetapkan field profil, role, proyek, tugas, assignee, checklist, dan progres.
- [ ] Dokumentasikan status yang valid: `todo`, `in_progress`, `in_review`, `done`, `archived` sesuai keputusan produk.
- [ ] Buat daftar keputusan terbuka dan tunjuk siapa yang mengonfirmasi.
- [ ] Buat `.env.example` berisi nama variabel saja, tanpa nilai rahasia.

**Kriteria selesai**
- Kontrak API versi awal tersedia.
- Stack backend, database, auth, dan migration tool didokumentasikan.
- Tidak ada secret yang masuk Git.

## 6. Tahap BE-1 — Setup API dan validasi konfigurasi

- [ ] Siapkan modul Node.js API yang kompatibel dengan pola function/runtime Vercel.
- [ ] Pisahkan route/handler, service bisnis, repository data, auth, dan validation.
- [ ] Siapkan modul koneksi PostgreSQL yang hanya berjalan di server.
- [ ] Validasi environment saat server/function berjalan dan berikan error konfigurasi yang aman.
- [ ] Tambahkan endpoint health check yang tidak memaparkan URL database, secret, atau detail internal.
- [ ] Tambahkan parser/validasi payload dan penanganan error global.
- [ ] Terapkan query terparameterisasi atau ORM yang aman.
- [ ] Tambahkan script lint, test, migration, dan build yang sesuai.
- [ ] Pastikan seluruh operasi tidak mengandalkan server memory sebagai penyimpanan permanen.

**Kriteria selesai**
- API dapat berjalan lokal dengan konfigurasi yang benar.
- Health check bekerja tanpa membuka informasi rahasia.
- Database hanya diakses dari server.
- Struktur kode cukup modular untuk diuji.

## 7. Tahap BE-2 — Schema PostgreSQL dan migration

Buat migration yang terurut untuk model data dari PRD.

### Tabel minimum

#### `profiles`
- ID identitas pengguna.
- `display_name`, role (`leader` atau `member`), status akun, timestamp.
- Relasi identitas auth mengikuti mekanisme autentikasi yang dipilih.

#### `projects`
- Nama, deskripsi, status, pembuat, timestamp, dan `archived_at`.

#### `project_members`
- Relasi proyek dan user, dengan unique constraint untuk pasangan proyek/user.

#### `tasks`
- Proyek, judul, deskripsi, status, prioritas, deadline, bobot, pembuat, timestamp, dan `archived_at`.

#### `task_assignees`
- Relasi tugas dengan anggota; unique constraint untuk pasangan tugas/anggota.

#### `checklist_items`
- Tugas, judul, status selesai, `completed_by`, `completed_at`, urutan, pembuat, timestamp, dan `archived_at`.

#### `task_updates`
- Tugas, user, ringkasan pekerjaan, kendala, dan timestamp.

#### `activity_logs`
- Pelaku, proyek/tugas terkait, action, metadata nonrahasia, timestamp.

#### `attachments` — dibuat saat fitur lampiran dimulai
- Task, pengunggah, storage key, nama file, MIME type, ukuran, timestamp.

### Pekerjaan migration

- [ ] Tambahkan primary key dan foreign key yang jelas.
- [ ] Tambahkan unique/check constraint yang relevan.
- [ ] Pastikan `weight > 0`.
- [ ] Tetapkan enum/check constraint untuk role dan status.
- [ ] Tambahkan indeks pada foreign key serta field yang sering dipakai filter.
- [ ] Tentukan kebijakan archive/soft delete dan relasi penghapusan.
- [ ] Buat seed development terpisah dan jangan membuat password default production.
- [ ] Dokumentasikan cara menerapkan, memeriksa, dan rollback migration bila didukung.
- [ ] Uji migration dari database development yang kosong.

**Kriteria selesai**
- Seluruh schema dibuat dari migration yang tercatat.
- Relasi, constraint, dan indeks bekerja.
- Tidak dibutuhkan perubahan manual tersembunyi untuk membuat database berjalan.

## 8. Tahap BE-3 — Autentikasi, sesi, dan role

- [ ] Implementasikan login dan logout sesuai mekanisme auth yang disepakati.
- [ ] Implementasikan `GET /api/auth/me` untuk mendapatkan profil dan role dari sesi tervalidasi.
- [ ] Hubungkan identitas autentikasi dengan `profiles`.
- [ ] Pastikan akun nonaktif ditolak.
- [ ] Buat helper/middleware untuk mewajibkan autentikasi.
- [ ] Buat helper/middleware untuk role Leader.
- [ ] Buat helper akses proyek/tugas berdasarkan keanggotaan atau penugasan sesuai kebijakan visibilitas.
- [ ] Jangan menerima role dari body request sebagai sumber kebenaran.
- [ ] Atur cara provisioning akun Leader pertama secara aman dan terdokumentasi.
- [ ] Tangani kegagalan login tanpa membocorkan apakah kredensial tertentu terdaftar, jika mekanismenya memungkinkan.
- [ ] Pastikan logout mengakhiri sesi, bukan hanya mengubah state frontend.

**Kriteria selesai**
- Request tanpa sesi ditolak pada semua endpoint privat.
- Member tidak dapat melakukan tindakan khusus Leader.
- ID proyek/tugas yang diganti tidak memberi akses ilegal.
- Cookie, token, dan secret tidak diekspos pada log.

## 9. Tahap BE-4 — API domain

Semua endpoint harus memakai validasi, otorisasi, format respons, dan penanganan error konsisten.

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Anggota dan proyek
- `GET /api/members`
- `GET /api/projects`
- Endpoint pembuatan/perubahan proyek untuk role yang berwenang.
- Endpoint pengelolaan keanggotaan proyek, jika dibutuhkan MVP.

### Tugas
- `GET /api/tasks` — daftar dengan filter yang disepakati.
- `GET /api/tasks/:id` — detail tugas beserta data terkait yang boleh diakses.
- `POST /api/tasks` — buat tugas oleh role berwenang.
- `PATCH /api/tasks/:id` — ubah field yang diizinkan.
- Endpoint penugasan anggota.
- Endpoint arsip tugas sesuai pola yang disepakati.

### Checklist
- Endpoint membuat checklist.
- Endpoint mengubah judul/urutan checklist.
- Endpoint mengubah status checklist.
- Endpoint mengarsipkan checklist bila kebijakan mendukung.
- Semua endpoint checklist memvalidasi akses ke tugas induk.

### Progres dan dashboard
- `GET /api/dashboard`
- `GET /api/progress/team`
- Endpoint ringkasan proyek atau tugas yang dibutuhkan UI.
- Nilai progres harus dihitung dari data server, bukan menerima angka progres dari frontend.

### Laporan dan aktivitas
- Endpoint membuat/memperbarui `task_updates`.
- `GET /api/activity` dengan filter/pagination jika dibutuhkan.
- Aktivitas dibuat setelah perubahan utama sukses.

**Kriteria selesai**
- CRUD penting tersimpan di PostgreSQL.
- Input invalid ditolak dengan respons yang konsisten.
- Endpoint tidak mengungkap stack trace atau pesan SQL internal.
- Dokumentasi API dapat langsung dipakai Rainer.

## 10. Tahap BE-5 — Mesin Progres Otomatis

Ini adalah bagian kritis FlexBoard.

### 10.1 Progres tugas

Untuk tugas dengan checklist aktif:

`progres_tugas = jumlah_checklist_selesai / jumlah_checklist_aktif * 100`

- [ ] Hitung dari status checklist pada backend/database.
- [ ] Bulatkan angka yang ditampilkan ke bilangan bulat terdekat.
- [ ] Checklist ditambahkan: hitung ulang.
- [ ] Checklist di-uncheck: hitung ulang dan progres dapat turun.
- [ ] Checklist yang diarsipkan tidak dihitung dalam daftar checklist aktif.
- [ ] Tugas tanpa checklist menampilkan status “Belum diatur” atau nilai kosong yang konsisten, bukan 100%.
- [ ] Jangan menerima persentase dari browser sebagai input otoritatif.

### 10.2 Progres anggota

`progres_anggota = jumlah(bobot_tugas * progres_tugas) / jumlah(bobot_tugas)`

- [ ] Sepakati cakupan tugas yang masuk hitungan.
- [ ] Hanya gunakan tugas yang ditugaskan kepada anggota dalam proyek/cakupan yang dipilih.
- [ ] Tentukan penanganan tugas tanpa checklist secara eksplisit agar tidak dianggap selesai.
- [ ] Jika tidak ada tugas dalam cakupan, API mengembalikan status “Belum ada tugas” atau representasi yang disepakati.
- [ ] Jangan menghitung dari angka progres yang ditulis bebas oleh member.

### 10.3 Progres proyek

`progres_proyek = jumlah(bobot_tugas * progres_tugas) / jumlah(bobot_tugas)`

- [ ] Gunakan tugas utama dalam proyek.
- [ ] Setiap tugas dihitung satu kali untuk progres proyek, walaupun mempunyai beberapa assignee.
- [ ] Validasi bobot tugas lebih besar dari nol.
- [ ] Jika tidak ada tugas yang bisa dihitung, kembalikan kondisi “Belum ada tugas”.
- [ ] Jangan menghitung progres proyek sebagai rata-rata progres anggota.

### 10.4 Status, deadline, dan review

- [ ] Tentukan transisi status yang valid.
- [ ] Tentukan apakah `in_review` dan persetujuan Leader masuk MVP atau tahap berikutnya.
- [ ] Deadline terlewat menentukan label terlambat, bukan perubahan progres otomatis.
- [ ] Semua waktu disimpan dan dibandingkan dengan kebijakan zona waktu yang disepakati.
- [ ] Bila review diwajibkan, checklist 100% tidak langsung menjadikan tugas `done`.

### Pengujian wajib

- [ ] 0/5 checklist = 0%.
- [ ] 3/5 checklist = 60%.
- [ ] 5/5 checklist = 100%.
- [ ] Checklist di-uncheck menurunkan progres.
- [ ] Menambah checklist menghitung ulang progres.
- [ ] Tugas tanpa checklist bukan 100%.
- [ ] Bobot 0 atau negatif ditolak.
- [ ] Tidak ada tugas dalam cakupan dikembalikan sebagai “Belum ada tugas”.
- [ ] Tugas multi-assignee hanya dihitung sekali pada progres proyek.
- [ ] Deadline tidak mengubah persentase.
- [ ] Request yang menyertakan field progres palsu diabaikan atau ditolak.
- [ ] Perubahan gagal tidak menghasilkan activity log sukses.

## 11. Tahap BE-6 — Activity Log dan konsistensi data

- [ ] Tentukan daftar action yang dicatat: proyek dibuat/diubah, tugas dibuat/diubah/diarsipkan, assignee berubah, checklist dibuat/selesai/dibatalkan, laporan diperbarui, review dilakukan jika ada.
- [ ] Simpan actor dari sesi tervalidasi, bukan `actor_id` bebas dari frontend.
- [ ] Simpan objek dan metadata yang aman.
- [ ] Jangan menyimpan password, token, secret, atau isi data sensitif ke metadata.
- [ ] Untuk perubahan yang perlu atomik, simpan perubahan bisnis dan log dalam transaksi yang sama.
- [ ] Endpoint aktivitas hanya menampilkan catatan yang boleh dilihat pengguna.
- [ ] Tambahkan pagination/limit agar log tidak membebani query.

**Kriteria selesai**
- Aktivitas mencerminkan perubahan yang benar-benar berhasil.
- Aktor, tindakan, objek, dan waktu jelas.
- Kegagalan operasi tidak meninggalkan log sukses palsu.

## 12. Kontrak API untuk Rainer

Dokumentasikan endpoint sebelum Rainer mengunci integrasi frontend.

### Respons sukses yang disarankan

```json
{
  "data": {},
  "meta": {}
}
```

### Respons error yang disarankan

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dimasukkan.",
    "details": {}
  }
}
```

### Kesepakatan endpoint minimum

| Endpoint | Method | Akses | Tujuan |
|---|---|---|---|
| `/api/auth/login` | POST | Publik | Login. |
| `/api/auth/logout` | POST | Sesi valid | Logout. |
| `/api/auth/me` | GET | Sesi valid | Profil dan role aktif. |
| `/api/dashboard` | GET | Sesi valid | Ringkasan dashboard sesuai akses. |
| `/api/members` | GET | Sesi valid | Daftar anggota yang boleh dilihat. |
| `/api/projects` | GET | Sesi valid | Daftar proyek yang boleh dilihat. |
| `/api/tasks` | GET | Sesi valid | Daftar tugas dan filter. |
| `/api/tasks/:id` | GET | Akses tugas | Detail tugas. |
| `/api/tasks` | POST | Leader/role berwenang | Buat tugas. |
| `/api/tasks/:id` | PATCH | Leader/role berwenang | Ubah tugas. |
| `/api/tasks/:id/archive` | POST | Leader/role berwenang | Arsipkan tugas. |
| `/api/tasks/:id/checklists` | POST | Sesuai izin | Tambah item checklist. |
| `/api/checklists/:id` | PATCH | Sesuai izin | Ubah item/checklist. |
| `/api/progress/team` | GET | Sesi valid | Ringkasan progres anggota. |
| `/api/activity` | GET | Sesi valid | Aktivitas sesuai akses. |

Boleh ada perubahan endpoint jika ada alasan teknis, tetapi perubahan harus didokumentasikan dan diberitahukan kepada Rainer sebelum UI bergantung pada endpoint itu.

## 13. Keamanan Wajib

- [ ] Semua endpoint sensitif memvalidasi sesi.
- [ ] Validasi role dilakukan di backend.
- [ ] Validasi akses dilakukan per proyek/tugas.
- [ ] Gunakan query terparameterisasi/ORM.
- [ ] Batasi field yang boleh diperbarui per endpoint.
- [ ] Tolak properti terlarang atau mass assignment.
- [ ] Validasi string, tanggal, status, bobot, dan ID.
- [ ] Terapkan limit dan pagination untuk daftar.
- [ ] Jangan mengekspos error internal.
- [ ] Jangan log credential atau token.
- [ ] Jangan mengekspos `DATABASE_URL` atau auth secret melalui endpoint.
- [ ] Pisahkan database development dan production.
- [ ] Pastikan migration production terkontrol.
- [ ] Pertimbangkan rate limit untuk login dan endpoint sensitif.
- [ ] Uji IDOR, akses tanpa login, serta akses member ke operasi Leader.

## 14. Tahap BE-7 — Testing

### Unit test
- [ ] Fungsi kalkulasi progres tugas.
- [ ] Progres proyek berdasarkan bobot.
- [ ] Progres anggota berdasarkan cakupan.
- [ ] Validasi bobot dan status.
- [ ] Validasi payload.

### Integration test
- [ ] Login/logout dan sesi.
- [ ] Leader membuat proyek/tugas.
- [ ] Penugasan anggota.
- [ ] Checklist berubah dan progres tersinkron.
- [ ] Activity log tersimpan setelah perubahan berhasil.
- [ ] Request invalid ditolak.
- [ ] Member tidak dapat melakukan operasi Leader.
- [ ] Pengguna tidak dapat memodifikasi tugas yang tidak diizinkan.
- [ ] Pengarsipan tidak menghancurkan riwayat yang harus dipertahankan.

### Deployment smoke test
- [ ] Health endpoint.
- [ ] Koneksi PostgreSQL.
- [ ] Login melalui URL deployment.
- [ ] Buat/lihat tugas pada lingkungan uji.
- [ ] Checklist tersimpan setelah refresh.
- [ ] Progres pada UI cocok dengan respons API.
- [ ] Error log tidak berisi secret.

## 15. Tahap BE-8 — Deployment Vercel dan dokumentasi

- [ ] Konfigurasikan proyek Vercel sesuai struktur frontend + API yang dipilih.
- [ ] Pastikan function backend sesuai batasan runtime Vercel.
- [ ] Atur `DATABASE_URL` dan auth secret sebagai environment variables server.
- [ ] Jangan mengawali secret dengan `VITE_`.
- [ ] Gunakan kredensial database terpisah untuk development dan production.
- [ ] Pilih koneksi/pooling yang cocok dengan function serverless dan batas koneksi provider.
- [ ] Terapkan migration production melalui langkah yang terdokumentasi dan terkontrol.
- [ ] Uji CORS/cookie bila frontend dan API berbeda origin.
- [ ] Pastikan `.env` diabaikan Git.
- [ ] Dokumentasikan langkah setup lokal, migration, seed development, test, dan deployment di README.
- [ ] Berikan endpoint, payload contoh, respons, dan status kesiapan integrasi kepada Rainer.

**Kriteria selesai**
- API dan database production terhubung.
- Endpoint inti teruji dari URL deployment.
- Secret tidak tersedia di bundle frontend atau repository.
- Rainer dapat mengintegrasikan UI tanpa menebak struktur respons.

## 16. Strategi Git dan Kolaborasi

- Kerjakan branch backend terpisah, misalnya `feat/backend-foundation`, `feat/auth-api`, `feat/tasks-api`, dan `feat/progress-engine`.
- Jangan menggabungkan perubahan besar ke `main` sebelum build dan test lulus.
- Setiap migration harus disertai catatan dan pengujian.
- Koordinasikan struktur payload dengan Rainer sebelum mengubah API.
- Jika endpoint berubah, perbarui dokumentasi dan informasikan dampak ke frontend.
- Hindari mengubah file styling/komponen milik Rainer kecuali untuk kebutuhan integrasi yang disepakati.
- Jangan commit `.env`, token, kredensial, dump produksi, atau data pribadi.
- Review khusus diperlukan untuk perubahan auth, otorisasi, migration, atau logika progres.

## 17. Definition of Done Backend

Fitur backend hanya dianggap selesai apabila:

1. Endpoint/API sesuai kontrak yang terdokumentasi.
2. Input divalidasi di server.
3. Sesi, role, dan akses proyek/tugas diperiksa.
4. Data disimpan dengan constraint yang tepat di PostgreSQL.
5. Perubahan data dan activity log konsisten.
6. Progres dihitung dari checklist dan bobot di server/database.
7. Error tidak mengekspos stack trace atau secret.
8. Unit/integration test relevan lulus.
9. Migration dan environment terdokumentasi.
10. Integrasi telah diuji bersama frontend Rainer.
11. Deployment preview/production diuji sesuai lingkungan.
12. Tidak ada secret yang masuk repository atau bundle browser.

## 18. Prioritas

### P0 — Blocker
- Keputusan provider PostgreSQL, auth, driver/ORM, runtime API.
- Setup API dan migration.
- Model data.
- Login, sesi, otorisasi.
- Tugas, assignee, checklist.
- Mesin progres otomatis.
- Test akses dan validasi.

### P1 — Wajib MVP
- Dashboard API.
- Profil/anggota.
- Laporan pekerjaan.
- Aktivitas.
- Filter/pencarian API.
- Dokumentasi kontrak.
- Deployment Vercel dan smoke test.

### P2 — Setelah MVP
- Upload file dan validasi akses.
- Review/approval.
- Notifikasi.
- Kanban/timeline API bila dibutuhkan.
- Analitik/ekspor lanjutan.

## 19. Checklist Akhir Kiandra

- [ ] Keputusan arsitektur ditulis dan disepakati.
- [ ] PostgreSQL terhubung melalui backend, bukan browser.
- [ ] Migration lengkap dan bisa dijalankan dari database kosong.
- [ ] Login/logout dan validasi sesi berjalan.
- [ ] Role Leader/Member ditegakkan di backend.
- [ ] Endpoint proyek, tugas, penugasan, checklist, progres, dan aktivitas tersedia.
- [ ] Progres tugas/anggota/proyek mengikuti rumus PRD.
- [ ] Tugas tanpa checklist bukan 100%.
- [ ] Deadline tidak mengubah progres.
- [ ] Activity log hanya dibuat saat operasi berhasil.
- [ ] Unit/integration test lulus.
- [ ] Kontrak API dan error response diberikan ke Rainer.
- [ ] Deployment dan koneksi production smoke-tested.
- [ ] README dan `.env.example` diperbarui tanpa secret.
