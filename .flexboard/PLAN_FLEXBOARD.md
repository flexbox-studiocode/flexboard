# PLAN_FLEXBOARD.md

## 1. Tujuan Dokumen

Dokumen ini menjadi rencana implementasi FlexBoard dari repository kosong hingga MVP siap dipakai tim FlexBox. Urutan kerja dibuat berdasarkan dependensi teknis agar fitur UI tidak mendahului aturan database dan otorisasi.

**PRD utama:** `PRD_FLEXBOARD.md`

## 2. Prinsip Pengerjaan

1. Kerjakan fondasi data dan keamanan sebelum fitur dashboard lengkap.
2. Jangan membuat UI yang hanya memakai data dummy lalu dianggap selesai.
3. Setiap fitur harus terhubung ke API dan PostgreSQL sebelum dinyatakan selesai.
4. Setiap perubahan skema harus memakai migration.
5. Setiap fitur memiliki acceptance criteria dan pengujian.
6. Jangan menyimpan secret di GitHub atau bundle frontend.
7. Gunakan pull request atau review perubahan sebelum menggabungkan perubahan besar.
8. Selesaikan MVP terlebih dahulu; fitur lanjutan tidak boleh menghambat fondasi utama.

## 3. Stack yang Disepakati

- React JS + Vite untuk frontend.
- JavaScript untuk implementasi awal, kecuali tim menyepakati TypeScript sebelum mulai.
- Tailwind CSS atau CSS modular — pilih satu dan konsisten.
- Node.js API yang kompatibel dengan runtime Vercel.
- PostgreSQL pada provider terkelola yang dipilih tim.
- Vercel untuk deployment frontend dan endpoint API yang kompatibel.
- GitHub untuk version control.
- Lucide untuk ikon.

**Catatan arsitektur:** React tidak boleh mengakses PostgreSQL menggunakan kredensial database dari browser. Semua operasi yang membutuhkan izin harus melewati API/backend yang memvalidasi sesi, role, dan kepemilikan data. Vercel bukan provider PostgreSQL otomatis; provider database dan strategi koneksi harus ditentukan.

## 4. Tahap Implementasi

### Tahap 0 — Persiapan dan keputusan teknis

**Tujuan:** memastikan repository dan keputusan arsitektur siap.

Pekerjaan:
- [ ] Tinjau repository dan tetapkan branch utama.
- [ ] Tambahkan `PRD_FLEXBOARD.md` dan `PLAN_FLEXBOARD.md`.
- [ ] Sepakati JavaScript atau TypeScript.
- [ ] Sepakati pendekatan CSS.
- [ ] Pilih provider PostgreSQL.
- [ ] Tentukan pendekatan autentikasi.
- [ ] Tentukan cara menjalankan API pada Vercel.
- [ ] Buat `.env.example` tanpa secret.
- [ ] Tambahkan `.gitignore` untuk `.env`, build output, dependency, dan file lokal.
- [ ] Dokumentasikan langkah setup lokal di `README.md`.

**Kriteria selesai:**
- Keputusan inti terdokumentasi.
- Anggota tim dapat menjalankan proyek lokal mengikuti README.
- Tidak ada kredensial rahasia di repository.

### Tahap 1 — Fondasi aplikasi

**Tujuan:** membangun kerangka React dan API yang dapat dijalankan lokal serta dideploy.

Pekerjaan:
- [ ] Buat aplikasi React dengan Vite.
- [ ] Susun struktur folder berdasarkan fitur.
- [ ] Tambahkan routing.
- [ ] Buat layout global, navigasi desktop, dan navigasi mobile.
- [ ] Siapkan design tokens: warna, tipografi, spacing, border, dan state.
- [ ] Buat komponen umum: Button, Input, Select, Modal, Badge, ProgressBar, LoadingState, EmptyState, dan ErrorState.
- [ ] Siapkan API Node.js sesuai pola runtime Vercel yang dipilih.
- [ ] Tambahkan validasi konfigurasi environment saat server berjalan.
- [ ] Buat endpoint health check yang tidak membocorkan informasi rahasia.
- [ ] Tambahkan linting dan script build/test yang disepakati.

**Kriteria selesai:**
- Frontend berjalan lokal.
- API merespons health check.
- Build produksi berhasil.
- Layout responsif dasar tersedia.

### Tahap 2 — PostgreSQL dan migration

**Tujuan:** membangun model data sebelum membuat fitur bisnis.

Pekerjaan:
- [ ] Siapkan database development PostgreSQL.
- [ ] Pilih driver atau ORM yang kompatibel dengan PostgreSQL dan runtime deployment.
- [ ] Buat migration untuk `profiles`.
- [ ] Buat migration untuk `projects` dan `project_members`.
- [ ] Buat migration untuk `tasks` dan `task_assignees`.
- [ ] Buat migration untuk `checklist_items`.
- [ ] Buat migration untuk `task_updates`.
- [ ] Buat migration untuk `activity_logs`.
- [ ] Tambahkan foreign key, unique constraint, check constraint, dan indeks.
- [ ] Tetapkan strategi archive/soft delete.
- [ ] Siapkan seed data khusus development, bukan akun contoh produksi.
- [ ] Dokumentasikan perintah migration dan reset database development.

**Kriteria selesai:**
- Migration dapat dijalankan dari database kosong.
- Relasi dan constraint utama bekerja.
- Seed data hanya dipakai pada development/test.
- Migration dapat diterapkan ulang pada lingkungan pengujian tanpa langkah manual tersembunyi.

### Tahap 3 — Autentikasi dan otorisasi

**Tujuan:** memastikan role dan kepemilikan data ditegakkan di server.

Pekerjaan:
- [ ] Implementasikan login dan logout.
- [ ] Buat mekanisme sesi yang aman.
- [ ] Hubungkan identitas autentikasi ke `profiles`.
- [ ] Terapkan role Leader dan Member.
- [ ] Buat middleware/helper untuk memvalidasi sesi.
- [ ] Terapkan pemeriksaan role dan akses proyek/tugas pada endpoint.
- [ ] Pastikan role tidak dapat ditentukan atau dinaikkan hanya dari request frontend.
- [ ] Tambahkan halaman login, loading sesi, dan error state.
- [ ] Uji akses tanpa login, akses URL langsung, dan manipulasi ID.

**Kriteria selesai:**
- Pengguna tanpa sesi ditolak dari endpoint privat.
- Member tidak dapat melakukan operasi khusus Leader.
- Mengganti ID proyek/tugas pada request tidak memberi akses ilegal.
- Secret tidak terekspos pada frontend.

### Tahap 4 — API dan alur tugas inti

**Tujuan:** membuat fitur bisnis berfungsi tanpa bergantung pada data statis.

Urutan pekerjaan:
- [ ] API profil dan anggota.
- [ ] API proyek dan keanggotaan proyek.
- [ ] API daftar/detail tugas.
- [ ] API membuat dan memperbarui tugas.
- [ ] API penugasan anggota.
- [ ] API membuat/memperbarui/mengarsipkan checklist.
- [ ] API mengubah status checklist.
- [ ] API laporan pekerjaan dan kendala.
- [ ] API aktivitas.
- [ ] Validasi payload dan penanganan error konsisten.
- [ ] Pagination/filter untuk daftar jika dibutuhkan.
- [ ] Buat integration test untuk operasi penting.

**Kriteria selesai:**
- CRUD inti bekerja melalui API.
- Semua perubahan tersimpan di PostgreSQL.
- Validasi dan izin dilakukan di backend.
- Error API tidak membocorkan stack trace atau secret.

### Tahap 5 — Mesin progres dan aturan bisnis

**Tujuan:** menjadikan progres otomatis sebagai sumber kebenaran.

Pekerjaan:
- [ ] Implementasikan progres tugas dari checklist aktif.
- [ ] Tetapkan perilaku tugas tanpa checklist.
- [ ] Implementasikan bobot tugas dan validasi bobot positif.
- [ ] Implementasikan progres anggota sesuai tugas yang ditugaskan dan cakupan yang disepakati.
- [ ] Implementasikan progres proyek berdasarkan bobot tugas, bukan rata-rata anggota.
- [ ] Tentukan status `todo`, `in_progress`, `in_review`, `done`, dan `archived` yang benar-benar dipakai.
- [ ] Tentukan apakah review Leader wajib.
- [ ] Pastikan deadline tidak mengubah progres.
- [ ] Catat aktivitas setelah operasi berhasil.
- [ ] Pastikan perubahan checklist, progres yang dihitung, dan log yang terkait konsisten.

**Pengujian wajib:**
- [ ] 0 dari 5 checklist selesai = 0%.
- [ ] 3 dari 5 checklist selesai = 60%.
- [ ] 5 dari 5 checklist selesai = 100%.
- [ ] Checklist selesai dibatalkan: progres turun sesuai keadaan baru.
- [ ] Checklist ditambahkan: progres dihitung ulang.
- [ ] Tugas tanpa checklist: bukan 100%.
- [ ] Tidak ada tugas dalam cakupan: tampilkan “Belum ada tugas”.
- [ ] Bobot nol/negatif ditolak.
- [ ] Deadline lewat tidak mengubah progres.
- [ ] Tugas dengan beberapa assignee dihitung satu kali pada progres proyek.
- [ ] Aktivitas sukses tidak dibuat jika perubahan gagal.

**Kriteria selesai:**
- Hasil perhitungan konsisten pada UI dan API.
- Pengguna tidak dapat memanipulasi persentase dengan mengirim angka dari browser.
- Pengujian aturan bisnis lulus.

### Tahap 6 — Implementasi UI utama

**Tujuan:** menghubungkan rancangan screenshot ke data asli.

#### Beranda
- [ ] Kartu ringkasan tugas aktif, selesai, dan terlambat.
- [ ] Progres proyek.
- [ ] Tugas mendekati deadline.
- [ ] Aktivitas terbaru.
- [ ] Tombol buat tugas hanya bagi Leader.

#### Tugas Kami
- [ ] Daftar tugas dari API.
- [ ] Informasi proyek, penanggung jawab, deadline, prioritas, status, dan progres.
- [ ] Pencarian dan filter.
- [ ] Form tambah/edit tugas untuk Leader.
- [ ] Arsip tugas dengan konfirmasi.

#### Detail Tugas
- [ ] Informasi lengkap tugas.
- [ ] Checklist interaktif sesuai izin.
- [ ] Progres otomatis.
- [ ] Form laporan pekerjaan dan kendala.
- [ ] Area lampiran disiapkan untuk tahap lanjutan bila belum masuk MVP.
- [ ] Riwayat aktivitas terkait.

#### Progres Tim
- [ ] Daftar progres anggota dari API.
- [ ] Filter proyek/anggota.
- [ ] Detail tugas pembentuk progres.
- [ ] Empty state untuk anggota tanpa tugas.

#### Anggota
- [ ] Daftar anggota.
- [ ] Role dan status.
- [ ] Ringkasan tugas/progres.
- [ ] Pengelolaan role hanya bagi Leader yang berwenang.

#### Aktivitas
- [ ] Daftar aktivitas dari database.
- [ ] Nama pelaku, tindakan, objek, dan waktu.
- [ ] Urutan waktu yang konsisten.
- [ ] Empty state.

**Kriteria selesai:**
- Tidak ada data dummy pada alur produksi.
- Semua tombol utama memiliki aksi yang berfungsi.
- Semua halaman menangani loading, error, dan data kosong.
- Layout diuji pada desktop dan viewport mobile.

### Tahap 7 — Fitur lanjutan terpilih

Dikerjakan setelah MVP lulus pengujian:
- [ ] Upload bukti kerja ke storage yang sesuai.
- [ ] Validasi tipe dan ukuran file.
- [ ] Komentar/catatan kendala yang lebih lengkap.
- [ ] Review dan approval Leader.
- [ ] Notifikasi deadline/tugas baru.
- [ ] Board Kanban.
- [ ] Kalender/timeline.

Prioritaskan berdasarkan kebutuhan nyata tim. Jangan mengerjakan semua fitur sekaligus.

### Tahap 8 — Pengujian akhir dan deployment

**Pengujian fungsional**
- [ ] Login/logout dan sesi.
- [ ] Leader membuat proyek/tugas.
- [ ] Leader menetapkan dan mengubah penanggung jawab.
- [ ] Member hanya mengubah pekerjaan yang diizinkan.
- [ ] Checklist tetap tersimpan setelah refresh.
- [ ] Progres tugas, anggota, dan proyek benar.
- [ ] Deadline dan status terlambat benar.
- [ ] Aktivitas akurat.
- [ ] Form invalid menghasilkan pesan yang jelas.
- [ ] Aksi arsip/penghapusan memerlukan konfirmasi.

**Pengujian keamanan**
- [ ] Akses tanpa login.
- [ ] Member mencoba endpoint Leader.
- [ ] Manipulasi ID proyek/tugas.
- [ ] Validasi input server-side.
- [ ] SQL injection dicegah oleh query terparameterisasi/ORM.
- [ ] Tidak ada secret di Git atau bundle frontend.
- [ ] Batas akses database dan file diperiksa.

**Pengujian teknis**
- [ ] Lint dan build lulus.
- [ ] Unit/integration test lulus.
- [ ] Migration production dapat diterapkan.
- [ ] Environment variables production lengkap.
- [ ] Koneksi PostgreSQL cocok dengan runtime Vercel dan pooling provider.
- [ ] Smoke test semua halaman setelah deployment.
- [ ] Error log tidak berisi kredensial atau data sensitif.

**Kriteria selesai:**
- Deployment Vercel dapat diakses.
- API terhubung ke database production yang benar.
- Login, tugas, checklist, dan progres berhasil diuji dari URL production.
- Tidak ada bug blocker yang diketahui pada alur MVP.

## 5. Usulan Struktur Folder

Struktur ini adalah titik awal dan dapat disesuaikan dengan runtime API yang dipilih.

```text
flexboard/
├── api/                       # Endpoint serverless yang kompatibel dengan Vercel
│   ├── health.js
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   ├── members/
│   └── activity/
├── src/
│   ├── app/                   # Route/page React
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── tasks/
│   ├── features/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── progress/
│   │   ├── members/
│   │   └── activity/
│   ├── lib/                   # Client API, helpers, constants
│   ├── hooks/
│   └── styles/
├── server/                    # Modul backend bersama jika sesuai pola deployment
│   ├── db/
│   ├── auth/
│   ├── validation/
│   ├── services/
│   └── repositories/
├── migrations/
├── tests/
├── public/
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── PRD_FLEXBOARD.md
└── PLAN_FLEXBOARD.md
```

Jangan memaksakan struktur `server/` jika platform deployment yang dipilih mengharuskan modul backend ditempatkan dengan pola berbeda. Yang wajib adalah pemisahan tanggung jawab frontend, endpoint, akses database, validasi, dan layanan bisnis.

## 6. Environment Variables

Nama variabel aktual bergantung pada driver/ORM dan provider yang dipilih. Pola umum:

```env
# Server-only: jangan gunakan prefix VITE_
DATABASE_URL=
AUTH_SECRET=
APP_URL=http://localhost:5173
NODE_ENV=development
```

- `DATABASE_URL` hanya boleh dibaca backend.
- `AUTH_SECRET` hanya diperlukan jika mekanisme autentikasi yang dipilih memerlukannya.
- Variabel dengan prefix `VITE_` dapat terekspos ke browser; jangan menaruh kredensial rahasia di dalamnya.
- Simpan nilai lokal pada `.env` yang diabaikan Git.
- Isi environment variables production melalui dashboard Vercel.
- Gunakan kredensial terpisah untuk development dan production.

## 7. Strategi Git dan Kolaborasi

- `main` harus selalu berada dalam kondisi yang dapat dibangun.
- Buat branch fitur, misalnya `feat/auth`, `feat/tasks`, atau `feat/progress`.
- Gunakan commit yang menjelaskan perubahan.
- Hindari dua developer mengubah file inti yang sama tanpa koordinasi.
- Setiap perubahan database menyertakan migration dan catatan dampaknya.
- Review perubahan yang menyentuh autentikasi, role, query database, atau kalkulasi progres.
- Jangan commit file `.env`, dump database yang berisi data pribadi, atau kredensial.
- Tag release setelah milestone yang penting lulus pengujian.

## 8. Urutan Prioritas

### P0 — Blocker
- Struktur proyek dan deployment dasar.
- PostgreSQL dan migration.
- Login, sesi, dan otorisasi.
- Proyek, tugas, assignee, dan checklist.
- Kalkulasi progres.
- Validasi server-side dan proteksi akses.

### P1 — Wajib untuk MVP
- Beranda.
- Tugas Kami dan detail tugas.
- Progres Tim.
- Anggota.
- Aktivitas.
- Filter/pencarian dasar.
- Responsive layout.
- Integration test dan smoke test deployment.

### P2 — Setelah MVP
- Lampiran.
- Review/approval.
- Notifikasi.
- Kanban.
- Kalender/timeline.
- Ekspor laporan dan analitik lanjutan.

## 9. Definition of Done

Sebuah fitur hanya boleh dinyatakan selesai jika:

1. Kebutuhan dan acceptance criteria-nya jelas.
2. UI selesai dan responsif.
3. API/backend menerapkan validasi dan otorisasi.
4. Data disimpan dan dibaca dari PostgreSQL.
5. Loading, error, dan empty state ditangani.
6. Pengujian yang relevan lulus.
7. Tidak ada secret atau data sensitif yang terekspos.
8. Dokumentasi terkait diperbarui.
9. Perubahan telah ditinjau dan berhasil di-build.

## 10. Risiko Teknis yang Perlu Dipantau

- **PostgreSQL pada serverless:** pilih driver dan pooling yang cocok dengan runtime Vercel serta provider.
- **Autentikasi custom:** lebih rawan salah konfigurasi; gunakan mekanisme teruji dan jangan membuat sistem password sendiri tanpa kebutuhan.
- **Progres ganda:** jangan menghitung progres berbeda-beda di banyak komponen frontend; tetapkan logika di backend/database.
- **Data antaranggota:** pastikan semua endpoint melakukan pemeriksaan izin.
- **Perubahan checklist serentak:** pertimbangkan transaksi dan penanganan konflik.
- **Scope creep:** jangan menambah fitur tahap lanjut sebelum alur inti stabil.
- **Provider belum dipilih:** jangan menulis kode koneksi produksi sebelum provider dan metode autentikasi diputuskan.

## 11. Keputusan Sebelum Mulai Coding

- [ ] Provider PostgreSQL dipilih.
- [ ] Pendekatan autentikasi dipilih.
- [ ] JavaScript atau TypeScript ditetapkan.
- [ ] CSS/styling ditetapkan.
- [ ] Kebijakan tugas bersama ditetapkan.
- [ ] Aturan review Leader ditetapkan.
- [ ] Kebijakan visibilitas tugas dan proyek ditetapkan.
- [ ] Migration dan environment development tersedia.

Setelah keputusan ini selesai, kerjakan Tahap 0 sampai Tahap 3 secara berurutan. Jangan membangun dashboard dengan data produksi sebelum autentikasi, otorisasi, dan model data dapat diuji.
