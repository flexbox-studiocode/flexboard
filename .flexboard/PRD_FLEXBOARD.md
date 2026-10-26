# PRD_FLEXBOARD.md

## 1. Informasi Dokumen

- **Nama produk:** FlexBoard
- **Jenis produk:** Website manajemen tugas dan pemantauan progres tim
- **Pemilik/pengguna awal:** Tim FlexBox
- **Versi dokumen:** 1.0
- **Status:** Draft acuan implementasi
- **Bahasa:** Indonesia

## 2. Ringkasan Produk

FlexBoard adalah aplikasi web internal untuk membantu tim FlexBox mengelola proyek, membagikan tugas, memantau progres, dan melihat riwayat pekerjaan anggota. Konsepnya terinspirasi oleh aplikasi Kanban seperti Trello, tetapi fokus utama FlexBoard adalah **checklist pekerjaan dan progres yang dihitung secara otomatis**.

Leader/Admin dapat mengatur proyek dan tugas, menentukan penanggung jawab serta deadline, dan meninjau hasil pekerjaan. Member dapat melihat tugas yang menjadi tanggung jawabnya, menyelesaikan checklist, memperbarui catatan pekerjaan, melaporkan kendala, dan melampirkan bukti kerja bila fitur lampiran sudah tersedia.

FlexBoard tidak boleh hanya menjadi tampilan statis. Data tugas, checklist, progres, akun, dan aktivitas harus tersimpan di PostgreSQL dan ditampilkan berdasarkan hak akses pengguna.

## 3. Masalah yang Ingin Diselesaikan

1. Progres kerja anggota sulit dipantau apabila hanya dilaporkan melalui chat.
2. Leader membutuhkan cara terpusat untuk membuat tugas, membagikan tanggung jawab, dan menetapkan deadline.
3. Angka progres dapat tidak konsisten jika diubah manual dan tidak mengikuti checklist.
4. Riwayat perubahan tugas dan penyelesaian pekerjaan perlu dapat ditelusuri.
5. Anggota membutuhkan tampilan yang jelas tentang pekerjaan yang harus dilakukan, tenggat, dan statusnya.

## 4. Tujuan dan Ukuran Keberhasilan

### Tujuan

- Menyatukan data proyek dan tugas tim dalam satu website.
- Menghitung progres tugas, anggota, dan proyek berdasarkan aturan yang konsisten.
- Memisahkan izin Leader/Admin dan Member.
- Menyediakan riwayat aktivitas yang berasal dari perubahan nyata di database.
- Memberikan pengalaman responsif pada desktop dan perangkat mobile.

### Kriteria keberhasilan MVP

- Pengguna dapat login dan hanya memperoleh akses sesuai role-nya.
- Leader dapat membuat, membaca, memperbarui, dan mengarsipkan proyek/tugas sesuai izin.
- Member dapat melihat tugas yang relevan dan mengubah checklist yang menjadi kewenangannya.
- Perubahan checklist tersimpan di PostgreSQL dan menghasilkan progres terbaru tanpa input angka progres manual.
- Pengguna tidak dapat membaca atau mengubah data yang bukan haknya dengan memanipulasi request.
- Aktivitas penting tercatat dan dapat ditampilkan pada halaman Aktivitas.
- Aplikasi dapat dibangun dan dijalankan pada lingkungan deployment yang disepakati.

## 5. Pengguna dan Role

### 5.1 Leader/Admin

Leader adalah pengelola workspace tim. Hak akses yang direncanakan:

- Melihat ringkasan proyek, tugas, progres, deadline, dan aktivitas.
- Membuat dan memperbarui proyek.
- Membuat, memperbarui, menetapkan penanggung jawab, dan mengarsipkan tugas.
- Mengelola checklist tugas.
- Menentukan deadline, prioritas, deskripsi, dan bobot tugas.
- Melihat progres setiap anggota dan detail pekerjaan yang membentuk progres tersebut.
- Meninjau hasil tugas dan menyetujui penyelesaian jika alur review diaktifkan.
- Mengelola akun/role anggota sesuai kebijakan tim.
- Melihat riwayat aktivitas.

### 5.2 Member

Member adalah anggota yang mengerjakan tugas. Hak akses yang direncanakan:

- Melihat proyek dan tugas yang boleh diaksesnya.
- Melihat deskripsi, deadline, prioritas, penanggung jawab, dan checklist.
- Menandai checklist miliknya sebagai selesai atau belum selesai.
- Menambahkan atau memperbarui laporan pekerjaan dan kendala pada tugas yang diizinkan.
- Mengunggah bukti kerja jika fitur lampiran tersedia.
- Melihat progres pribadi, progres proyek, dan aktivitas yang boleh diaksesnya.
- Tidak dapat mengubah role, menetapkan ulang anggota lain, mengubah pengaturan proyek, atau mengubah checklist yang bukan kewenangannya kecuali izin eksplisit diberikan.

### 5.3 Prinsip autentikasi dan otorisasi

- Setiap anggota menggunakan akun sendiri; akun bersama tidak dianjurkan.
- Role harus divalidasi oleh backend, bukan dipercaya dari nilai yang dikirim frontend.
- Semua endpoint yang mengubah data harus memeriksa sesi, role, dan hubungan pengguna dengan proyek/tugas.
- Kredensial database dan secret hanya disimpan pada environment variables server.
- Password tidak boleh disimpan sebagai teks biasa. Gunakan mekanisme autentikasi yang aman atau hashing yang sesuai jika autentikasi dikelola sendiri.
- Jangan pernah menaruh password database, token rahasia, atau kredensial server di kode frontend.

## 6. Ruang Lingkup Produk

### 6.1 MVP — wajib

1. Login dan logout.
2. Role Leader/Admin dan Member.
3. Profil serta daftar anggota.
4. Proyek dan status proyek.
5. CRUD tugas: judul, deskripsi, proyek, penanggung jawab, deadline, prioritas, status, dan bobot.
6. Checklist di dalam tugas.
7. Perhitungan progres tugas otomatis.
8. Ringkasan progres anggota dan proyek.
9. Halaman Beranda, Tugas Kami, Progres Tim, Anggota, Aktivitas, dan detail tugas.
10. Filter dan pencarian dasar.
11. Riwayat aktivitas penting.
12. Validasi input, penanganan error, loading state, dan empty state.
13. Proteksi endpoint dan pengujian hak akses.
14. Tampilan responsif untuk desktop dan mobile.

### 6.2 Tahap lanjutan

- Upload screenshot/dokumen hasil kerja.
- Catatan kendala dan komentar per tugas.
- Review/approval penyelesaian oleh Leader.
- Notifikasi tugas baru dan deadline.
- Subtask bertingkat jika kebutuhan terbukti.
- Board Kanban dengan kolom status.
- Kalender/timeline proyek.
- Ekspor laporan.
- Analitik kontribusi yang lebih mendalam.
- PWA jika dibutuhkan.

Fitur lanjutan tidak boleh menunda selesainya fondasi MVP.

## 7. Struktur Halaman dan Perilaku

### 7.1 Login

- Form login dengan validasi.
- Pesan error yang aman dan mudah dipahami.
- Redirect berdasarkan sesi dan izin.
- Logout mengakhiri sesi dengan benar.
- Halaman internal tidak boleh dapat dibuka hanya dengan mengetik URL tanpa sesi yang valid.

### 7.2 Beranda

Menampilkan:
- Jumlah tugas aktif, selesai, dan terlambat.
- Ringkasan progres proyek.
- Tugas yang mendekati deadline.
- Aktivitas terbaru.
- Tombol menuju detail tugas.
- Tombol membuat tugas hanya untuk Leader.

### 7.3 Tugas Kami

- Menampilkan tugas sesuai akses pengguna.
- Informasi minimum: judul, proyek, penanggung jawab, deadline, prioritas, status, dan progres.
- Filter berdasarkan proyek, anggota (untuk Leader), status, prioritas, dan tenggat.
- Pencarian berdasarkan judul atau deskripsi.
- Leader dapat membuat/mengedit/mengarsipkan tugas.
- Member membuka detail tugas dan mengerjakan checklist yang diizinkan.

### 7.4 Detail Tugas

- Deskripsi dan informasi tugas.
- Penanggung jawab.
- Deadline dan prioritas.
- Daftar checklist.
- Progres otomatis.
- Laporan pekerjaan/kendala.
- Lampiran jika fitur sudah tersedia.
- Riwayat aktivitas terkait tugas.
- Tombol review Leader jika fitur approval diaktifkan.

### 7.5 Progres Tim

- Menampilkan ringkasan progres setiap anggota.
- Filter berdasarkan proyek dan anggota.
- Tombol detail yang menunjukkan tugas-tugas pembentuk progres.
- Persentase harus berasal dari perhitungan database/API, bukan angka contoh statis.

### 7.6 Anggota

- Daftar anggota, nama tampilan, role, dan status akun.
- Ringkasan tugas aktif dan progres.
- Pengelolaan role/status hanya untuk Leader yang berwenang.

### 7.7 Aktivitas

- Menampilkan aktor, tindakan, objek terkait, dan waktu.
- Contoh: “Kiandra menyelesaikan checklist Validasi endpoint pada tugas Backend API.”
- Data berasal dari catatan aktivitas yang tersimpan di database.
- Jangan mencatat password, token, atau informasi rahasia ke log.

## 8. Aturan Bisnis dan Perhitungan Progres

### 8.1 Progres tugas

Untuk tugas yang memiliki checklist aktif:

`progres_tugas = jumlah_checklist_selesai / jumlah_checklist_aktif * 100`

Persentase yang ditampilkan dibulatkan ke bilangan bulat terdekat. Nilai yang disimpan sebagai sumber kebenaran adalah status checklist; jangan mengandalkan kolom persentase yang dapat diubah bebas oleh pengguna.

- Jika checklist ditambahkan, progres dihitung ulang.
- Jika checklist belum selesai dibatalkan, progres turun sesuai keadaan aktual.
- Checklist yang diarsipkan/dihapus secara logis tidak dihitung dalam total aktif.
- Jika tugas tidak memiliki checklist, tampilkan “Belum diatur” atau status yang setara; jangan otomatis menandainya 100%.
- Perubahan checklist harus divalidasi dan disimpan di backend.

### 8.2 Progres anggota

Progres anggota dihitung dari tugas yang benar-benar ditugaskan kepada anggota tersebut:

`progres_anggota = jumlah(bobot_tugas * progres_tugas) / jumlah(bobot_tugas)`

Rumus hanya berlaku pada tugas yang termasuk cakupan progres yang telah ditetapkan. Tentukan satu kebijakan secara konsisten, misalnya menghitung semua tugas aktif yang ditugaskan kepada anggota dalam proyek terpilih. Tugas tanpa checklist tidak boleh dianggap selesai; kebijakan untuk mengecualikannya dari penyebut harus konsisten dan dijelaskan di UI.

Jika anggota tidak memiliki tugas dalam cakupan yang dipilih, tampilkan “Belum ada tugas”, bukan 0% yang dapat disalahartikan sebagai tidak bekerja.

### 8.3 Progres proyek

Progres proyek dihitung dari tugas utama dalam proyek:

`progres_proyek = jumlah(bobot_tugas * progres_tugas) / jumlah(bobot_tugas)`

- Bobot tugas ditetapkan Leader, dengan nilai default yang disepakati (misalnya 1 untuk bobot sama).
- Bobot harus lebih besar dari nol.
- Jika tidak ada tugas yang dapat dihitung, tampilkan “Belum ada tugas”.
- Jangan merata-ratakan progres anggota untuk mendapatkan progres proyek.
- Jika sebuah tugas memiliki beberapa penanggung jawab, progres proyek tetap menghitung tugas tersebut satu kali. Progres anggota boleh menghitung tugas itu pada setiap anggota yang ditugaskan, sesuai kebijakan produk.

### 8.4 Status tugas

Status yang disarankan:
- `todo` — belum dimulai.
- `in_progress` — sedang dikerjakan.
- `in_review` — menunggu review, jika alur review diaktifkan.
- `done` — selesai dan, bila diwajibkan, telah disetujui Leader.
- `archived` — diarsipkan dan tidak termasuk pekerjaan aktif.

Status bukan pengganti checklist. Perubahan status harus mengikuti aturan yang ditetapkan backend. Checklist 100% tidak otomatis berarti tugas berstatus `done` jika review diwajibkan.

### 8.5 Deadline

- Status terlambat ditentukan dari deadline, zona waktu yang disepakati, dan status tugas.
- Tugas yang lewat deadline tidak otomatis kehilangan atau mendapat progres.
- Deadline dan waktu pencatatan disimpan dengan format timestamp yang konsisten.
- UI menampilkan tanggal dengan format yang mudah dipahami pengguna Indonesia.

### 8.6 Aktivitas

Aktivitas dibuat oleh backend setelah operasi berhasil. Jika operasi utama gagal, jangan membuat log sukses palsu. Untuk perubahan yang harus atomik, simpan perubahan dan log dalam satu transaksi.

## 9. Model Data Awal PostgreSQL

Skema final mengikuti implementasi, tetapi entitas minimum yang direkomendasikan:

### `profiles`
- `id` — primary key, terhubung ke identitas autentikasi.
- `display_name`
- `email` atau referensi identitas autentikasi.
- `role` — `leader` atau `member`.
- `is_active`
- `created_at`, `updated_at`

### `projects`
- `id`
- `name`
- `description`
- `status`
- `created_by`
- `created_at`, `updated_at`, `archived_at`

### `project_members`
- `project_id`
- `user_id`
- `project_role` bila diperlukan
- `joined_at`
- Unique constraint untuk pasangan proyek/anggota.

### `tasks`
- `id`
- `project_id`
- `title`
- `description`
- `status`
- `priority`
- `due_at`
- `weight`
- `created_by`
- `created_at`, `updated_at`, `archived_at`

### `task_assignees`
- `task_id`
- `user_id`
- `assigned_at`
- Unique constraint untuk pasangan tugas/anggota.

### `checklist_items`
- `id`
- `task_id`
- `title`
- `is_completed`
- `completed_by`
- `completed_at`
- `sort_order`
- `created_by`
- `created_at`, `updated_at`, `archived_at`

### `task_updates`
- `id`
- `task_id`
- `user_id`
- `work_summary`
- `blockers`
- `created_at`, `updated_at`

### `attachments` — tahap lanjutan
- `id`
- `task_id`
- `uploaded_by`
- `storage_key`
- `original_filename`
- `mime_type`
- `size_bytes`
- `created_at`

### `activity_logs`
- `id`
- `actor_id`
- `project_id`
- `task_id` bila relevan
- `action`
- `metadata` yang tidak mengandung rahasia
- `created_at`

Tambahkan foreign key, indeks untuk kolom pencarian/filter, constraint, dan strategi penghapusan yang jelas. Gunakan soft delete/archive untuk data proyek/tugas bila riwayatnya perlu dipertahankan. Jangan menyimpan persentase sebagai sumber kebenaran apabila nilainya dapat dihitung dari checklist dan bobot.

## 10. Arsitektur Teknis yang Disepakati

### Stack inti

- **Frontend:** React JS.
- **Build tool:** Vite.
- **Bahasa:** JavaScript pada MVP; TypeScript boleh dipilih jika seluruh tim menyepakatinya sebelum implementasi.
- **Styling:** Tailwind CSS atau CSS modular; pilih satu pendekatan utama.
- **Ikon:** Lucide.
- **Database:** PostgreSQL.
- **Backend/API:** Node.js dengan endpoint API yang berjalan pada lingkungan yang kompatibel dengan deployment Vercel.
- **Hosting frontend/API:** Vercel.
- **Database hosting:** layanan PostgreSQL terkelola yang kompatibel dengan koneksi dari Vercel (pilihan provider ditetapkan tim).
- **Version control:** GitHub.

### Prinsip arsitektur

- React berjalan di browser dan tidak boleh menyimpan kredensial database.
- Semua operasi yang membutuhkan otorisasi dilakukan melalui API/backend atau mekanisme aman yang setara.
- Gunakan connection pooling atau koneksi yang sesuai dengan runtime serverless dan batas koneksi provider PostgreSQL.
- Gunakan migration untuk perubahan skema; jangan mengubah database produksi secara manual tanpa migration yang tercatat.
- Pisahkan environment development dan production.
- Secret disimpan melalui environment variables Vercel dan file lokal yang tidak masuk Git.
- Pastikan API kompatibel dengan batasan runtime Vercel. Jika membutuhkan server Node yang selalu hidup, worker, atau proses panjang, tinjau kebutuhan hosting sebelum memilih desain.
- Jangan menganggap Vercel menyediakan database PostgreSQL secara otomatis; pilih dan konfigurasi provider database secara eksplisit.

## 11. Persyaratan Nonfungsional

### Keamanan
- Validasi semua input di backend.
- Otorisasi diperiksa pada setiap operasi baca/tulis yang sensitif.
- Cegah IDOR: mengganti ID tugas di URL tidak boleh memberi akses ke tugas orang lain.
- Gunakan query terparameterisasi/ORM yang aman untuk mencegah SQL injection.
- Batasi ukuran dan tipe file apabila upload diterapkan.
- Terapkan rate limiting pada endpoint sensitif jika sesuai.
- Jangan mengekspos stack trace atau secret kepada pengguna.

### Keandalan
- Tangani loading, error, empty state, dan retry dengan jelas.
- Hindari pembaruan UI yang menampilkan sukses sebelum server mengonfirmasi perubahan.
- Operasi checklist, progres, dan aktivitas harus konsisten.
- Sediakan backup sesuai kemampuan provider PostgreSQL.

### Kegunaan
- Tampilan responsif untuk desktop dan HP.
- Kontras teks dan fokus keyboard memadai.
- Form memiliki label, validasi, dan pesan kesalahan yang jelas.
- Aksi penting seperti mengarsipkan tugas memerlukan konfirmasi.

### Performa
- Gunakan pagination atau limit untuk daftar yang bertambah.
- Tambahkan indeks pada foreign key dan kolom filter yang sering dipakai.
- Hindari query berulang per anggota/tugas jika satu query agregasi dapat digunakan.
- Target performa awal harus diukur melalui pengujian, bukan dijanjikan tanpa data.

## 12. Acceptance Criteria MVP

MVP dinyatakan siap untuk digunakan tim jika:

1. Login dan logout berfungsi dan sesi diproteksi.
2. Leader dapat membuat proyek dan tugas dengan data valid.
3. Leader dapat menetapkan satu atau beberapa anggota pada tugas.
4. Member hanya dapat mengubah checklist dan laporan yang sesuai izinnya.
5. Checklist tersimpan ke PostgreSQL dan tetap benar setelah halaman dimuat ulang.
6. Progres tugas dihitung sesuai jumlah checklist aktif.
7. Progres anggota dan proyek mengikuti bobot serta cakupan yang ditetapkan.
8. Tugas tanpa checklist tidak ditampilkan sebagai selesai.
9. Deadline tidak mengubah progres secara otomatis.
10. Aktivitas hanya tercatat setelah operasi berhasil.
11. API menolak pengguna tanpa sesi atau tanpa izin.
12. Build produksi berhasil dan aplikasi dapat digunakan melalui URL deployment.
13. Tidak ada secret dalam bundle frontend atau repository.
14. Pengujian utama untuk role, checklist, agregasi progres, dan deadline lulus.

## 13. Di Luar Ruang Lingkup MVP

- Chat real-time lengkap.
- Integrasi AI.
- Integrasi kalender pihak ketiga.
- Penagihan atau pembayaran.
- Aplikasi native Android/iOS.
- Workspace multi-organisasi yang kompleks.
- Automasi tingkat lanjut.

## 14. Risiko dan Mitigasi

- **Progres tidak konsisten:** hitung dari checklist dan bobot di backend/database.
- **Akses data tidak sah:** otorisasi pada setiap endpoint dan pengujian role.
- **Koneksi PostgreSQL habis pada serverless:** gunakan provider/pooling yang sesuai.
- **Scope membesar:** prioritaskan MVP dan simpan fitur lanjutan ke backlog.
- **Perubahan skema merusak deployment:** gunakan migration dan uji pada development terlebih dahulu.
- **Aktivitas tidak akurat:** buat log dari backend setelah operasi berhasil.
- **Bukti kerja tidak aman:** validasi file, batasi akses, dan gunakan URL bertanda tangan bila diperlukan.

## 15. Keputusan yang Masih Harus Disepakati Tim

Sebelum deployment produksi, tetapkan:
1. Provider PostgreSQL yang digunakan.
2. Apakah autentikasi menggunakan provider eksternal atau backend sendiri.
3. Apakah tugas 100% harus menunggu persetujuan Leader.
4. Apakah progres anggota menghitung tugas yang dibagikan kepada beberapa anggota secara penuh untuk setiap anggota.
5. Apakah semua anggota dapat melihat seluruh tugas tim atau hanya tugas yang relevan.
6. Kebijakan pengarsipan/penghapusan data.
7. Format dan batas upload bukti kerja.
8. Siapa yang memiliki akses admin produksi dan pengaturan environment.

Keputusan tersebut harus ditulis dalam dokumentasi dan diterapkan konsisten pada frontend, API, dan database.
