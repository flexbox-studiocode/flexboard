# Status frontend FlexBoard

Tanggal: 27 Oktober 2026. Status: **fondasi dan pratinjau UI; bukan MVP end-to-end**.

## Yang tersedia

- React/JavaScript/Vite; CSS token, Lucide, React Router tetap dipakai.
- Struktur route, layout, UI bersama, dan fitur terpisah.
- Header horizontal, banner, logo Figma lokal, tipografi dan palet berdasarkan acuan.
- Menu mobile dialog native, penahanan fokus, Escape, pengembalian fokus, skip link.
- Beranda, Tugas Kami, detail tugas, form baru/edit, Progres Tim, Anggota, Aktivitas, Login.
- Pencarian/filter URL lokal, reset, navigasi antarrute; bukan pencarian API.
- Form baru menerima input lokal dan rancangan checklist tanpa penyimpanan/status selesai/progres. State direset ketika referensi route berubah. Form edit tidak mengaku memuat tugas.
- Komponen feedback aksesibel dan pagination terkontrol tersedia, belum dipasang pada daftar tanpa metadata API.
- Profil pratinjau dapat dibuka melalui tombol akun desktop/mobile; identitas/role/status/progres tetap — dan aksi akun disabled.
- Rentang tanggal terbalik diberi error aksesibel tanpa membuang nilai input atau parameter URL.
- Klik padding dialog tidak lagi menutup dialog; backdrop dan Escape tetap menutup.
- Detail tugas disusun dari TaskMetadata, TaskChecklistSection, dan ActivityList; metadata/progres/riwayat tetap belum tersedia tanpa data terverifikasi. Aksi edit, arsip, dan tambah checklist disabled.
- Beranda memasang ProjectPicker dengan pratinjau tambah/edit/konfirmasi arsip. Form baru menerima input lokal; rancangan dibuang saat ditutup atau mode berubah. Edit kosong/nonaktif, status belum dipilih, simpan dan konfirmasi arsip disabled.
- Anggota menyediakan pratinjau pengelolaan role/status dengan pilihan kosong dan simpan disabled. MemberCard disiapkan sebagai komponen presentasi, tidak dipasang dengan daftar akun palsu.
- Komponen TaskCard/ChecklistItem disiapkan; tidak mewakili integrasi selesai.
- Nilai ringkasan memakai tanda —, tidak ada angka/tugas/pengguna/aktivitas domain palsu.
- State layanan belum tersedia dibedakan dari loading, error, dan data kosong.
- Login dan mutasi server disabled. Semua route workspace saat ini pratinjau publik tanpa data privat, bukan route produksi yang telah terproteksi.

## Yang belum selesai

Semua integrasi domain, sesi, guard produksi, capability/role UI, penyimpanan checklist/laporan/proyek/tugas, profil, pengelolaan role/status, pagination data, refresh persistensi, konflik API, dan verifikasi keamanan end-to-end menunggu backend dan keputusan produk.
Komponen presentasional bukan bukti fitur domain selesai. Tidak ada backend/migration yang diubah, dan tidak ada mock yang dibuat.

## Acuan Figma dan deviasi

File: https://www.figma.com/design/6VJnow9ExBcHVvLQODUzLw/FlexBoard-MCP?node-id=0-1&m=dev

| Frame | Node | Visual/UI tersedia | Deviasi dan batas integrasi |
|---|---|---|---|
| Beranda | 1:5 | Kartu tugas bersama navy, panel Tim FlexBox biru, aktivitas ringkas; statistik generik dihapus | Form Feedback diganti aktivitas sesuai persetujuan; pratinjau proyek tetap bagian tambahan; data menunggu API |
| Tugas kami | 1:148 | Banner, kartu ringkasan navy, panel progres anggota putih, filter diringkas; TaskCard reusable | Filter mengikuti PRD; tanpa kartu contoh/pagination palsu; data anggota dan tugas belum dimuat |
| Progres team | 1:286 | Satu panel putih progres anggota/filter; statistik dominan dihapus; MemberProgressList reusable | Tidak menyalin persentase contoh; agregasi/checklist/bobot menunggu server dan kebijakan produk |
| aktivitas terbaru | 1:408 | Satu panel putih Update pekerjaan, filter ringkas, baris avatar; ActivityList reusable | Tidak ada aktor/waktu/peristiwa buatan; filter tanggal ditambahkan sesuai PRD |
| Update Progres | 1:468 | Pola panel diadaptasi ke detail tugas: checklist/progres, riwayat, laporan/kendala unavailable | Tidak ada route tambahan, persentase manual, atau upload; cakupan laporan belum disepakati |
| Login | 1:544 | Kartu, watermark, lapisan navy, ukuran form desktop dan tautan pratinjau | Akun/password contoh tidak disalin; input dan login disabled, kontrak identitas/sesi belum tersedia |
| Menambahkan tugas | 1:573 | Banner, panel form putih full-width, input navy/aksen biru, panduan lipat, rancangan checklist lokal | Proyek/multi-assignee/bobot/checklist mengikuti PRD; enum belum ditetapkan, simpan disabled |

Semua tujuh frame diperiksa melalui design context/render dan screenshot referensi. Proporsi header/banner/login, dekorasi sudut pencarian, panel/radius, dan warna navy diperhalus. Screenshot implementasi desktop serta dialog proyek mobile diperiksa; ini pemeriksaan manual, bukan tes kesamaan piksel.
Detail tugas, proyek, Anggota, profil, checklist lengkap, dan mobile merupakan perluasan pola visual karena frame khusus belum tersedia. Code Connect tidak tersedia pada seat saat pemeriksaan. Tidak ada klaim pixel-perfect atau seluruh MVP selesai.
Logo diekspor dari Figma ke src/assets/brand/flexbox.png; aset asal .flexboard tidak diubah. Foto akun contoh tidak dipakai karena profil harus dinamis. Tampilan tidak menyalin data contoh, tanggal, password, persentase manual, atau upload lokal sementara dari Figma.
Figma menunjukkan input progres manual dan persentase rata-rata; PRD tetap otoritatif: progres berasal dari checklist/bobot server. Upload tetap tahap lanjutan. Panel dan layout ditambah untuk field PRD; bukan klaim pixel-perfect terhadap layar berdata contoh.
Font melalui Google Fonts dengan fallback sistem; hosting font lokal belum diterapkan. Footer mengikuti teks Figma dan perlu konfirmasi kepemilikan.

## Usulan keputusan produk — belum AGREED

Ketentuan dasar PRD tetap berlaku, termasuk progres checklist/agregasi berbobot, bobot positif, tugas dihitung sekali per proyek, dan laporan/kendala pada tugas yang diizinkan. Tabel berikut memuat usulan rincian yang belum disepakati; bukan penundaan kewajiban PRD.

| Topik | Rekomendasi | Dampak |
|---|---|---|
| Visibilitas Member | Baca proyek yang diikuti; mutasi tugas sesuai assignment/izin server | Daftar/filter/aktivitas dan endpoint authorization |
| Checklist | Izin per tugas/item dikirim backend | Jangan asumsi semua member boleh mengubah item bersama |
| Review | Tunda approval ke tahap lanjutan | in_review dan transisi done belum dipilih |
| Cakupan progres | Tugas nonarsip dalam proyek terpilih, termasuk selesai | Label cakupan dan agregasi |
| Tanpa checklist | Progres null; usulan dikecualikan agregasi dengan jumlah pengecualian | Seluruh tugas belum diatur perlu state eksplisit |
| Multi-assignee | Usulan hitung penuh per anggota; sekali per proyek sudah diwajibkan PRD | Penjelasan kontribusi |
| Bobot | Usulan default 1; bobot positif sudah diwajibkan PRD | Form saat ini tidak mengasumsikan default |
| Waktu | Usulan UTC server, Asia/Jakarta untuk UI | Input/display/overdue belum final |
| Laporan/kendala | Usulan bentuk satu ringkasan per anggota per tugas; kebutuhan laporan/kendala mengikuti PRD | Struktur/history/ownership menunggu kontrak; komentar diskusi/upload ditunda |
| Arsip | Soft archive, tidak delete permanen | Konfirmasi dan histori |
| Akun/profil | Provisioning admin, capabilities server | Login identifier, role/status dan profil |

Kontrak endpoint dan payload: lihat FRONTEND_API_PROPOSAL.md. Matriks kebutuhan setiap halaman dan pertanyaan untuk backend: [FRONTEND_INTEGRATION_MATRIX.md](FRONTEND_INTEGRATION_MATRIX.md). Implementasi integrasi harus menunggu persetujuan, tidak mengunci usulan menjadi keputusan.

### Batas tanggung jawab frontend

Pekerjaan berikutnya hanya frontend: komponen/halaman/CSS, validasi UX, client/adapter setelah kontrak disetujui, state sesi/navigasi, feedback dan tes. Endpoint server, middleware, migration, skema, seed, isi database, serta dependency backend tidak diubah untuk menutup blocker integrasi. Route guard frontend hanya mengatur navigasi, bukan pengganti otorisasi server. Setup `.env`/`pg` dan suite database dilaporkan terpisah, bukan target penyelesaian frontend.

## Validasi dan batasannya

- Baseline sebelum perubahan: lint/build lulus, 0 tes.
- Validasi akhir penyelarasan Figma: `npm run lint` lulus, `npm test` 78 tes lulus, `npm run test:browser` 30 tes lulus, `npm run test:node` 3 tes konfigurasi lulus, dan `npm run build` lulus.
- `tests/browser/alignment.spec.js` merekam 10 route (termasuk 404/edit) pada 390 dan 1440 px ke `test-results/`, memeriksa aset lokal, urutan bagian Beranda, warna panel navy/biru, dan navigasi aktif. Ini screenshot capture dan assertion geometri/warna, bukan screenshot-diff otomatis terhadap Figma.
- Screenshot desktop/mobile diperiksa terhadap komposisi Figma. Koreksi specificity menjaga kartu Beranda tetap navy saat CSS semua route dimuat. Status pengembangan dipindahkan ke bawah konten agar tidak mengubah posisi banner. Spesifikasi/deviansi: `FIGMA_ALIGNMENT.md`.
- Tes unit/komponen menggunakan props generik dan interaksi lokal; tidak memakai mock API/domain.
- Playwright Chromium memeriksa seluruh sembilan route pada 320/360/390/601/768/1001/1024/1440/1920 px: heading, logo terisi, tanpa overflow, tanpa exception browser, tanpa request /api domain.
- Tes menu: fokus tetap di dialog, Escape, kembali ke trigger, navigasi.
- Tes pencarian/reset URL dan kontrol login/simpan disabled.
- Tes pratinjau proyek/akun memeriksa kontrol nonaktif, fokus/Escape, dan rancangan yang dibuang. Dialog proyek pada 360×640 dapat digulir hingga tombol penutup; teks lokal panjang tidak meluapkan dialog.
- Referensi URL detail yang panjang tetap membungkus pada 360 px; tidak ada checkbox/progres atau izin mutasi buatan. Tes geometri memastikan ikon pencarian tidak menimpa area teks input di Tugas, Progres Tim, Anggota, dan Aktivitas pada 320/360/390/768/1024/1440/1920 px, dengan input kosong dan teks panjang. Posisi ikon mengikuti kontrol input, bukan label/petunjuk/error; toolbar memakai SearchField bersama. Ruang teks banner mengikuti lebar tombol melalui satu variabel CSS. Label/ikon ringkasan dan overflow input datetime juga diperiksa pada sembilan ukuran layar.
- Desktop/mobile diperiksa melalui screenshot lokal, termasuk tujuh halaman implementasi, Anggota, form checklist, dialog profil, dan dialog proyek. Tidak ada screenshot-diff otomatis atau pengujian lintas browser selain Chromium.
- vercel.json menyiapkan filesystem-first routing: function/file yang tersedia diprioritaskan, /api yang tidak tersedia menghasilkan 404, lalu deep link frontend diarahkan ke index.html. Tes Node memeriksa konfigurasi, bukan runtime Vercel. Tidak ada deployment Vercel atau pengujian PostgreSQL/akun nyata.
- Audit setelah pembaruan Vite 6.4.5 dan Router 6.30.6: 2 moderate, 0 high/critical. Keduanya terkait React Router; npm menyarankan major 7.18.4. Tidak dilakukan migrasi major sepihak. Route aplikasi tidak menerima tujuan eksternal dinamis, dan aplikasi tidak memakai SSR hydration; audit tetap belum bersih dan perlu evaluasi sebelum produksi.

## Matriks tahapan dan dependensi

| Tahap | Status | Batas |
|---|---|---|
| 0–2 Fondasi, visual, komponen bersama | Tersedia dan diuji lokal | Feedback/pagination belum dikonsumsi API |
| 3 UI halaman | Struktur pratinjau diperluas | Detail/checklist/riwayat, form proyek dan akun tersedia sebagai UI; tampilan berdata nyata, laporan aktif, dan izin server belum tersedia |
| 4 API dan autentikasi | Blocked | Kontrak auth, URL development, payload, dan sesi belum disepakati |
| 5 Proyek/tugas/checklist | Blocked untuk integrasi | Menunggu endpoint, permissions, enum, transisi, dan kebijakan arsip |
| 6 Ringkasan/anggota/aktivitas | UI unavailable tersedia; integrasi blocked | Membutuhkan data/progres server dan keputusan visibilitas |
| 7 Pengujian/deployment | Lokal parsial | Tes akun nyata, persistensi, authorization, dan runtime Vercel belum dilakukan |

Keputusan produk pada tabel di atas tetap proposed, bukan agreed. Penanggung jawab keputusan: pemilik produk; kontrak teknis: Kiandra bersama frontend. Tanggal pencatatan: 27 Oktober 2026; tanggal persetujuan belum ada.

## Perapian visual lanjutan

Branch `feat/visual-refinement` mempertahankan baseline lokal `ae939fa`, termasuk merge/database work yang sudah ada sebelum tahap ini. Perubahan tahap ini hanya frontend, aset pencarian lokal, tes dan dokumentasi.

- Tipografi heading/navigation/search, spacing banner, ikon pencarian Figma lokal, padding panel, dekorasi tim, proporsi form/detail, serta baris progres/aktivitas dirapikan berdasarkan ukuran tujuh frame.
- Penyesuaian PRD tetap: checklist sebagai sumber progres, tanpa upload/persentase manual, tanpa data contoh produksi, aktivitas ringkas di Beranda, field/filter dan dialog pratinjau dipertahankan.
- Validasi terbaru: lint lulus; 78 tes komponen; 38 tes Chromium; 3 tes konfigurasi deployment; build lulus. Tambahan delapan tes browser mengukur font, geometri dan area klik. Rincian/pengecualian: `VISUAL_REFINEMENT.md`.
- Suite Node keseluruhan belum lulus pada environment ini: modul `pg` belum terpasang dan `.env` tidak tersedia untuk tes database/seed warisan. Tidak ada perubahan backend/dependensi untuk menutupi blocker tersebut.
- Screenshot sebelum/sesudah tersedia lokal di direktori Temp `opencode/visual-refinement-before` dan `opencode/visual-refinement-after`; bukan hasil pixel-diff seluruh halaman.

## Konsistensi kontrol filter

Perbaikan `fix/consistent-field-controls` menyamakan tinggi/font/padding select dan tanggal pada Tugas, Progres Tim, Aktivitas dan Anggota. Chevron single-select diposisikan 16 px dari tepi dengan ruang teks 48 px; multiple/listbox tetap tanpa chevron. Perilaku native, disabled, label, validasi dan reset dipertahankan. Rincian: `FIELD_CONTROLS.md`.

## Aksesibilitas dan ketahanan pratinjau

Paket `fix/frontend-preview-accessibility` berangkat dari `b5a736b` (merge PR #6 yang sudah ada; isi file sama dengan `3f03a3e`). Working tree awal bersih. Tidak membuat merge baru atau mengubah backend/database/dependensi.

- Draft checklist mengatur fokus setelah tambah/hapus: input baru, item berikutnya, sebelumnya, atau tombol tambah bila kosong. State tetap lokal dan dibuang saat keluar/referensi route berubah.
- Login memfokuskan konten utama tanpa memaksa scroll; skip link dan navigasi desktop/mobile diuji. Login tetap disabled tanpa simulasi sesi.
- Filter tanggal memvalidasi format kalender lokal, leap year, dan parameter berulang. URL rusak dipertahankan sampai pengguna memperbaiki atau reset; input tanggal invalid tampil kosong dengan error aksesibel, bukan hasil kosong atau tanggal yang dinormalisasi diam-diam. `min` hanya memakai tanggal mulai valid. Ini bukan kontrak query API atau keputusan timezone.
- Tes presentasi checklist mencakup read-only, callback, saving per item/tambah, dan progres yang hanya berubah melalui props; tidak menghitung progres domain.
- Tidak ada perubahan CSS/aset/desain, endpoint domain, mutasi aktif, akun demo, mock jaringan, atau data produksi buatan. Matriks integrasi mencatat kebutuhan, bukan kontrak baru.
- Lint lulus; `npm test` 111 tes frontend dalam 15 file lulus (komponen dan helper tanggal); tiga tes konfigurasi deployment lulus; production build lulus. Suite database tidak dijalankan dan bukan bukti penerimaan frontend.
- Pengujian browser awal berhenti pada batas waktu proses 120 detik, bukan assertion gagal; pengulangan dengan batas lebih panjang meluluskan 53 tes. Dua tes tambahan native date-input pada 320 px juga lulus terpisah. Validasi akhir seluruh suite setelah tambahan tes: **55 tes Chromium lulus** (4,2 menit), termasuk regresi 43 tes sebelumnya dan 12 tes baru.
- Screenshot Login pada 390/1440 px dan form tugas mobile diperiksa; tidak ada perubahan CSS/layout. Tes geometri/warna/font/regresi tetap dipertahankan, bukan screenshot-diff Figma atau verifikasi API/runtime Vercel.

## Git

Branch penyelarasan: `feat/figma-alignment`, dari `feat/frontend-foundation`. Identitas: Rainer <rainersimanjuntak59@gmail.com>; autentikasi `Constanvel` diverifikasi sebelum implementasi.
Folder repository terpisah `flexboard/` dipertahankan dan tidak distage. Commit per perubahan logis, tanpa push per commit.
Commit penyelarasan: 8f4c218 (spesifikasi), 12af29b (layout bersama), 55526ff (Beranda), 6458b0e (progres), e0c1aaa (aktivitas), d35695b (login), 9b5dfd3 (anggota), e192b2d (tugas/form/detail), 32aa8ee (warna panel), 3a60747 (filter/kontras), 3d9d335 (tes visual). Commit dokumentasi mengikuti daftar ini.
Paket penyelarasan visual diselesaikan sesuai instruksi milestone, bukan seluruh integrasi MVP. Push dijadwalkan satu kali setelah commit dokumentasi dan validasi akhir; hasil push dilaporkan pada ringkasan pelaksanaan. Tidak ada merge ke main, force push, atau deployment manual.
