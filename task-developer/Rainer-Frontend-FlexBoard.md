# Rainer-Frontend-FlexBoard.md

## 1. Informasi Task

- **Proyek:** FlexBoard
- **Developer:** Rainer
- **Role:** Frontend Developer
- **Dokumen acuan:** `PRD_FLEXBOARD.md` dan `PLAN_FLEXBOARD.md`
- **Stack frontend:** React JS + Vite
- **Styling:** Gunakan pendekatan yang disepakati tim dan konsisten di seluruh aplikasi. Jika belum diputuskan, usulkan Tailwind CSS sebelum implementasi.
- **Backend:** Node.js API yang disediakan Kiandra
- **Deployment:** Vercel
- **Prioritas:** MVP terlebih dahulu

## 2. Tujuan

Membangun antarmuka FlexBoard yang responsif, mudah digunakan, dan terhubung ke API serta PostgreSQL melalui backend. Frontend tidak boleh bergantung pada data dummy untuk alur produksi dan tidak boleh mengakses database PostgreSQL secara langsung.

Rainer bertanggung jawab atas halaman, komponen UI, navigasi, interaksi pengguna, validasi pengalaman pengguna, pemanggilan API, serta tampilan loading/error/empty state. Aturan akses dan validasi otoritatif tetap dilakukan oleh backend.

## 3. Batas Tanggung Jawab

### Termasuk pekerjaan Rainer

- Struktur aplikasi React + Vite dan routing.
- Layout global, navigasi desktop dan mobile.
- Design tokens dan komponen UI bersama.
- Halaman Login, Beranda, Tugas Kami, Detail Tugas, Progres Tim, Anggota, dan Aktivitas.
- Form dan interaksi frontend untuk Leader maupun Member.
- Integrasi dengan API yang didokumentasikan Kiandra.
- State loading, error, empty, konfirmasi aksi, dan feedback sukses.
- Tampilan progres berdasarkan data API.
- Pengujian komponen, alur UI, dan responsive layout.
- Dokumentasi cara menjalankan frontend.

### Bukan tanggung jawab Rainer

- Mengakses PostgreSQL langsung dari browser.
- Menyimpan `DATABASE_URL`, auth secret, atau kredensial server di frontend.
- Menetapkan role atau menentukan izin akses hanya berdasarkan state frontend.
- Menghitung progres sebagai sumber kebenaran di UI.
- Mengubah schema database tanpa koordinasi Kiandra.
- Membuat data produksi statis untuk menutupi API yang belum tersedia.

Frontend boleh menampilkan/preview hasil hitung sementara untuk optimisme UI bila disepakati, tetapi setelah respons API diterima, data server menjadi sumber kebenaran.

## 4. Tahap Pengerjaan

### Tahap FE-0 — Setup dan koordinasi

- [ ] Baca `PRD_FLEXBOARD.md` dan `PLAN_FLEXBOARD.md`.
- [ ] Periksa struktur repository serta kondisi branch sebelum mengubah file.
- [ ] Sepakati JavaScript atau TypeScript bersama tim. Default PRD adalah JavaScript untuk MVP.
- [ ] Sepakati styling utama. Jangan mencampur beberapa pendekatan tanpa alasan.
- [ ] Konfirmasi pola API, URL base, format error, dan cara autentikasi dengan Kiandra.
- [ ] Buat/rapikan setup React + Vite jika belum tersedia, tanpa menghapus konfigurasi yang masih dipakai.
- [ ] Siapkan `.env.example` untuk variabel frontend yang memang boleh publik.
- [ ] Pastikan secret server tidak menggunakan prefix `VITE_`.
- [ ] Tambahkan atau rapikan script lint/build/test jika sesuai kondisi repository.

**Kriteria selesai**
- Aplikasi frontend berjalan lokal.
- Build berhasil.
- Konfigurasi frontend terdokumentasi.
- Tidak ada perubahan yang merusak file atau konfigurasi milik backend.

### Tahap FE-1 — Design system dan layout

- [ ] Tetapkan warna, tipografi, spacing, border, radius, bayangan, dan state interaksi berdasarkan referensi FlexBoard.
- [ ] Pertahankan identitas visual biru, putih, abu-abu muda, dan navy.
- [ ] Buat komponen reusable: `Button`, `Input`, `Select`, `Badge`, `Modal`, `ProgressBar`, `Avatar`, `PageHeader`, `LoadingState`, `ErrorState`, `EmptyState`, dan `ConfirmDialog`.
- [ ] Buat layout aplikasi dengan header/nav desktop dan menu mobile.
- [ ] Buat layout halaman login terpisah dari layout workspace.
- [ ] Pastikan fokus keyboard, label input, kontras, dan pesan validasi cukup jelas.
- [ ] Hindari layout yang terlalu lebar atau tabel yang sulit dipakai di mobile.

**Kriteria selesai**
- Komponen UI utama dapat digunakan ulang.
- Menu dan layout konsisten pada seluruh halaman.
- Navigasi tidak menutupi konten pada tampilan mobile.

### Tahap FE-2 — Login dan proteksi tampilan

- [ ] Buat halaman login dengan input dan validasi dasar.
- [ ] Hubungkan form dengan endpoint autentikasi yang disediakan Kiandra.
- [ ] Tampilkan pesan error aman yang dikembalikan API.
- [ ] Implementasikan pemuatan sesi saat aplikasi dibuka.
- [ ] Sediakan tombol logout dan feedback hasil.
- [ ] Buat guard tampilan untuk halaman privat berdasarkan sesi yang diketahui.
- [ ] Arahkan pengguna ke halaman yang sesuai setelah login.
- [ ] Jangan menyimpan password atau secret.
- [ ] Jika backend menggunakan cookie sesi, gunakan fetch/client yang mengirim credentials sesuai kontrak API.

**Penting:** guard frontend hanya untuk pengalaman pengguna. Backend tetap wajib memvalidasi sesi dan izin untuk semua endpoint.

**Kriteria selesai**
- Pengguna dapat login/logout melalui API.
- Status sesi ditangani saat reload.
- Kegagalan autentikasi menampilkan pesan yang jelas.
- Halaman privat tidak menampilkan data ketika sesi belum tervalidasi.

### Tahap FE-3 — Beranda

- [ ] Tampilkan jumlah tugas aktif, selesai, dan terlambat berdasarkan API.
- [ ] Tampilkan progres proyek.
- [ ] Tampilkan tugas yang mendekati deadline.
- [ ] Tampilkan aktivitas terbaru.
- [ ] Sediakan tombol menuju detail tugas.
- [ ] Tampilkan tombol “Tambah tugas” hanya untuk role yang sesuai, sebagai kontrol UI tambahan.
- [ ] Tambahkan loading, error, dan empty state.

**Kriteria selesai**
- Seluruh nilai ringkasan berasal dari API.
- Tidak ada angka progres atau aktivitas hard-coded pada alur produksi.
- Tombol yang terlihat mempunyai aksi yang berfungsi.

### Tahap FE-4 — Tugas Kami dan Detail Tugas

#### Daftar tugas
- [ ] Tampilkan judul tugas, proyek, penanggung jawab, deadline, prioritas, status, dan progres.
- [ ] Implementasikan pencarian dan filter yang didukung API.
- [ ] Tampilkan tugas yang sesuai dengan role/akses pengguna.
- [ ] Untuk Leader, sediakan form membuat dan mengedit tugas.
- [ ] Sediakan pengarsipan tugas dengan dialog konfirmasi.
- [ ] Tampilkan validasi pada form tanpa mengandalkan validasi frontend saja.

#### Detail tugas
- [ ] Tampilkan deskripsi dan metadata tugas.
- [ ] Tampilkan daftar checklist.
- [ ] Sediakan kontrol checklist sesuai kemampuan API dan role pengguna.
- [ ] Setelah checklist diubah, sinkronkan status dan progres dari respons API.
- [ ] Tampilkan laporan pekerjaan/kendala.
- [ ] Siapkan area lampiran sebagai tahap lanjutan bila belum masuk MVP.
- [ ] Tampilkan aktivitas terkait tugas bila endpoint tersedia.
- [ ] Cegah klik ganda yang dapat mengirim perubahan duplikat.
- [ ] Tangani konflik/error dengan mempertahankan informasi input yang belum tersimpan jika memungkinkan.

**Kriteria selesai**
- Pembuatan/pembaruan tugas dan checklist bekerja melalui API.
- Checklist tetap sesuai setelah refresh.
- Progres yang ditampilkan sama dengan hasil server.
- Kesalahan API ditampilkan secara aman dan informatif.

### Tahap FE-5 — Progres Tim, Anggota, dan Aktivitas

#### Progres Tim
- [ ] Tampilkan daftar anggota dan persentase progres dari API.
- [ ] Sediakan filter proyek/anggota sesuai endpoint.
- [ ] Tombol “Lihat progres” membuka detail tugas pembentuk persentase.
- [ ] Tampilkan “Belum ada tugas” untuk anggota tanpa tugas dalam cakupan.

#### Anggota
- [ ] Tampilkan nama, role, status, tugas aktif, dan ringkasan progres.
- [ ] Tampilkan aksi pengelolaan akun/role hanya bagi Leader yang berwenang dan bila endpoint tersedia.
- [ ] Jangan menganggap menyembunyikan tombol sebagai pengamanan backend.

#### Aktivitas
- [ ] Tampilkan aktor, tindakan, objek, dan waktu.
- [ ] Tampilkan urutan waktu sesuai respons server.
- [ ] Tambahkan filter/pagination jika didukung API.
- [ ] Jangan membuat aktivitas contoh pada build produksi.

**Kriteria selesai**
- Ketiga halaman menggunakan data API.
- Detail progres dapat ditelusuri ke tugas terkait.
- Loading/error/empty state tersedia.

### Tahap FE-6 — Responsif, aksesibilitas, dan penyempurnaan

- [ ] Uji lebar layar desktop, tablet, dan mobile.
- [ ] Pastikan form, modal, tabel/list, checklist, dan progress bar tetap dapat digunakan di layar kecil.
- [ ] Tambahkan label aksesibel pada form dan tombol ikon.
- [ ] Pastikan fokus keyboard terlihat.
- [ ] Pastikan tombol disabled/loading mencegah pengiriman duplikat.
- [ ] Periksa konsistensi tanggal dan zona waktu pada UI.
- [ ] Periksa konsistensi pesan Bahasa Indonesia.
- [ ] Hapus komponen, log debug, dan data dummy yang tidak digunakan.

### Tahap FE-7 — Integrasi dan deployment

- [ ] Integrasikan dengan API development.
- [ ] Uji alur dari login sampai membuat tugas, mencentang checklist, dan melihat progres.
- [ ] Uji role Leader dan Member menggunakan akun uji terpisah.
- [ ] Pastikan environment variable frontend yang dipakai sesuai konfigurasi Vercel.
- [ ] Jalankan lint/test/build.
- [ ] Lakukan smoke test setelah deploy preview.
- [ ] Catat endpoint yang belum tersedia atau keputusan produk yang belum final.

## 5. Kontrak Integrasi dengan Backend

Kontrak akhir harus disepakati dengan Kiandra sebelum integrasi. Usulan bentuk REST API:

| Kebutuhan | Endpoint usulan | Keterangan |
|---|---|---|
| Sesi pengguna | `GET /api/auth/me` | Mendapatkan identitas dan role aktif. |
| Login | `POST /api/auth/login` | Membuat sesi. |
| Logout | `POST /api/auth/logout` | Mengakhiri sesi. |
| Anggota | `GET /api/members` | Daftar anggota yang boleh dilihat. |
| Proyek | `GET /api/projects` | Daftar proyek yang boleh dilihat. |
| Ringkasan | `GET /api/dashboard` | Ringkasan sesuai role/akses. |
| Daftar tugas | `GET /api/tasks` | Mendukung filter/pencarian yang disepakati. |
| Detail tugas | `GET /api/tasks/:id` | Detail termasuk assignee/checklist. |
| Buat tugas | `POST /api/tasks` | Khusus role yang berwenang. |
| Ubah tugas | `PATCH /api/tasks/:id` | Hanya field yang diizinkan. |
| Arsip tugas | `POST /api/tasks/:id/archive` | Jika dipilih sebagai pola endpoint. |
| Checklist | `POST /api/tasks/:id/checklists` | Membuat item checklist sesuai izin. |
| Ubah checklist | `PATCH /api/checklists/:id` | Mengubah data/status sesuai izin. |
| Progres tim | `GET /api/progress/team` | Mengembalikan nilai hasil perhitungan server. |
| Aktivitas | `GET /api/activity` | Daftar aktivitas yang boleh diakses. |

### Bentuk respons yang disarankan

Sukses:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dimasukkan.",
    "details": {}
  }
}
```

Bentuk aktual boleh disesuaikan jika kontrak yang sudah ada berbeda. Jangan mengunci frontend pada endpoint yang belum disetujui. Kiandra perlu memberi tahu Rainer saat endpoint, nama field, atau bentuk respons berubah.

### Cara integrasi

- Gunakan satu modul API/client bersama, bukan fetch tersebar tanpa pola.
- Atur base URL melalui konfigurasi environment publik yang sesuai.
- Jika frontend dan API berada pada origin yang berbeda, sepakati CORS dan cookie settings.
- Tangani status `401`, `403`, `404`, `409`, `422`, dan `5xx` secara konsisten bila digunakan backend.
- Jangan menganggap data role dari browser sebagai bukti otorisasi.
- Jangan menampilkan stack trace/SQL error kepada pengguna.

## 6. Kolaborasi Git

- Gunakan branch fitur, contoh `feat/frontend-shell`, `feat/tasks-ui`, `feat/team-progress`.
- Jangan commit ke branch utama tanpa kesepakatan tim.
- Sebelum mengubah file bersama, cek perubahan terbaru dan sinkronkan dengan Kiandra.
- Jangan mengedit migration, akses database, atau modul otorisasi backend tanpa koordinasi.
- Beri tahu Kiandra tentang endpoint yang dibutuhkan lebih awal.
- Update task atau PR dengan daftar file berubah, cara uji, screenshot bila relevan, dan status build.

## 7. Definition of Done Frontend

Satu fitur frontend hanya dianggap selesai apabila:

1. UI memenuhi kebutuhan PRD dan responsif.
2. Data diambil dari API, bukan dummy dalam alur produksi.
3. State loading, error, empty, dan sukses ditangani.
4. Form memiliki validasi UX dan pesan kesalahan yang jelas.
5. Tombol/aksi yang ditampilkan benar-benar berfungsi.
6. Role-based UI sesuai kontrak, dengan pemahaman bahwa backend tetap otoritatif.
7. Tidak ada secret dalam bundle frontend.
8. Pengujian relevan dan build berhasil.
9. Integrasi dengan backend diuji, bukan hanya tampilan lokal.
10. Perubahan didokumentasikan dan siap direview.

## 8. Prioritas

### P0 — Wajib
- Setup React + Vite.
- Layout dan routing.
- Login/session UI.
- Integrasi API.
- Tugas dan checklist.
- Tampilan progres dari server.
- Loading/error/empty state.
- Responsif desktop/mobile.

### P1 — MVP
- Beranda lengkap.
- Progres Tim.
- Anggota.
- Aktivitas.
- Filter dan pencarian.
- Detail tugas dan laporan pekerjaan.
- Smoke test deployment.

### P2 — Setelah MVP
- Upload bukti dan preview file.
- Review/approval UI.
- Notifikasi.
- Kanban.
- Kalender/timeline.
- Ekspor laporan.

## 9. Checklist Akhir Rainer

- [ ] Tidak ada data dummy pada alur produksi.
- [ ] Tidak ada koneksi database langsung di browser.
- [ ] Tidak ada secret server di variabel `VITE_*`.
- [ ] Login dan logout terhubung dengan API.
- [ ] Semua halaman utama tersambung ke API.
- [ ] Progres menampilkan nilai dari backend.
- [ ] Hak akses UI sesuai role dan data pengguna.
- [ ] Layout responsif dan aksesibel.
- [ ] Lint/test/build lulus.
- [ ] Sudah diuji bersama Kiandra dan siap di-review.
