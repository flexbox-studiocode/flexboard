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
| Beranda | 1:5 | Header/logo, banner, pencarian, ringkasan, panel tugas/aktivitas; pratinjau proyek sebagai perluasan | Nilai — dan layanan belum tersedia menggantikan contoh; ringkasan serta daftar menunggu API |
| Tugas kami | 1:148 | Banner, hierarki judul, toolbar, panel daftar; TaskCard siap menerima props | Filter mengikuti field PRD; pilihan enum disabled dan tanpa kartu contoh/pagination palsu |
| Progres team | 1:286 | Banner, ringkasan, panel perkembangan/filter dan pemberitahuan sumber progres | Tidak menyalin persentase contoh; agregasi/checklist/bobot menunggu server dan kebijakan produk |
| aktivitas terbaru | 1:408 | Header, toolbar, panel riwayat, catatan sumber aktivitas; ActivityList reusable | Tidak ada aktor/waktu/peristiwa buatan; filter tanggal ditambahkan sesuai PRD |
| Update Progres | 1:468 | Pola panel diadaptasi ke detail tugas: checklist/progres, riwayat, laporan/kendala unavailable | Tidak ada route tambahan, persentase manual, atau upload; cakupan laporan belum disepakati |
| Login | 1:544 | Kartu, watermark, lapisan navy, ukuran form desktop dan tautan pratinjau | Akun/password contoh tidak disalin; input dan login disabled, kontrak identitas/sesi belum tersedia |
| Menambahkan tugas | 1:573 | Form, kelompok field, panduan, rancangan checklist lokal dan tombol simpan disabled | Proyek/multi-assignee/bobot/checklist mengikuti PRD; enum belum ditetapkan, tidak ada penyimpanan |

Semua tujuh frame diperiksa melalui design context/render dan screenshot referensi. Proporsi header/banner/login, dekorasi sudut pencarian, panel/radius, dan warna navy diperhalus. Screenshot implementasi desktop serta dialog proyek mobile diperiksa; ini pemeriksaan manual, bukan tes kesamaan piksel.
Detail tugas, proyek, Anggota, profil, checklist lengkap, dan mobile merupakan perluasan pola visual karena frame khusus belum tersedia. Code Connect tidak tersedia pada seat saat pemeriksaan. Tidak ada klaim pixel-perfect atau seluruh MVP selesai.
Logo diekspor dari Figma ke src/assets/brand/flexbox.png; aset asal .flexboard tidak diubah. Foto akun contoh tidak dipakai karena profil harus dinamis. Tampilan tidak menyalin data contoh, tanggal, password, persentase manual, atau upload lokal sementara dari Figma.
Figma menunjukkan input progres manual dan persentase rata-rata; PRD tetap otoritatif: progres berasal dari checklist/bobot server. Upload tetap tahap lanjutan. Panel dan layout ditambah untuk field PRD; bukan klaim pixel-perfect terhadap layar berdata contoh.
Font melalui Google Fonts dengan fallback sistem; hosting font lokal belum diterapkan. Footer mengikuti teks Figma dan perlu konfirmasi kepemilikan.

## Keputusan produk — semua PROPOSED, belum AGREED

| Topik | Rekomendasi | Dampak |
|---|---|---|
| Visibilitas Member | Baca proyek yang diikuti; mutasi tugas sesuai assignment/izin server | Daftar/filter/aktivitas dan endpoint authorization |
| Checklist | Izin per tugas/item dikirim backend | Jangan asumsi semua member boleh mengubah item bersama |
| Review | Tunda approval ke tahap lanjutan | in_review dan transisi done belum dipilih |
| Cakupan progres | Tugas nonarsip dalam proyek terpilih, termasuk selesai | Label cakupan dan agregasi |
| Tanpa checklist | Progres null; usulan dikecualikan agregasi dengan jumlah pengecualian | Seluruh tugas belum diatur perlu state eksplisit |
| Multi-assignee | Hitung penuh per anggota, sekali per proyek | Penjelasan kontribusi |
| Bobot | Usulan default 1, wajib positif | Form saat ini tidak mengasumsikan default |
| Waktu | Usulan UTC server, Asia/Jakarta untuk UI | Input/display/overdue belum final |
| Laporan/kendala | Ringkasan per anggota per tugas dalam MVP | Komentar diskusi/upload ditunda |
| Arsip | Soft archive, tidak delete permanen | Konfirmasi dan histori |
| Akun/profil | Provisioning admin, capabilities server | Login identifier, role/status dan profil |

Kontrak endpoint dan payload: lihat FRONTEND_API_PROPOSAL.md. Implementasi integrasi harus menunggu persetujuan, tidak mengunci usulan menjadi keputusan.

## Validasi dan batasannya

- Baseline sebelum perubahan: lint/build lulus, 0 tes.
- Validasi akhir kode: `npm run lint` lulus, `npm test` 65 tes lulus, `npm run test:browser` 17 tes lulus, `npm run test:node` 3 tes konfigurasi lulus, dan `npm run build` lulus.
- Tes unit/komponen menggunakan props generik dan interaksi lokal; tidak memakai mock API/domain.
- Playwright Chromium memeriksa seluruh sembilan route pada 360/390/768/1024/1440 px: heading, logo terisi, tanpa overflow, tanpa exception browser, tanpa request /api domain.
- Tes menu: fokus tetap di dialog, Escape, kembali ke trigger, navigasi.
- Tes pencarian/reset URL dan kontrol login/simpan disabled.
- Tes pratinjau proyek/akun memeriksa kontrol nonaktif, fokus/Escape, dan rancangan yang dibuang. Dialog proyek pada 360×640 dapat digulir hingga tombol penutup; teks lokal panjang tidak meluapkan dialog.
- Referensi URL detail yang panjang tetap membungkus pada 360 px; tidak ada checkbox/progres atau izin mutasi buatan. Tes geometri memastikan ikon pencarian tidak menimpa area teks input.
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

## Git

Branch: feat/frontend-foundation. Identitas: Rainer <rainersimanjuntak59@gmail.com>; akun autentikasi disetujui: Constanvel.
Folder repository terpisah flexboard/ dipertahankan dan tidak distage. Commit per perubahan logis, tanpa push per commit.
Commit tahap pelengkapan UI: 0d328f6 (detail tugas), bf5ad0a (proyek), f96cfc0 (anggota/akun), d193d72 (visual/padding input), 6fce5ca (tes browser). Commit dokumentasi mengikuti daftar ini.
Remote-tracking lokal saat pemeriksaan menunjuk origin/feat/frontend-foundation pada a386054; tahap pelengkapan UI ini belum dipush. Tidak dilakukan merge atau deployment.
Push ditunda karena lingkup seluruh MVP belum selesai; hanya dilakukan setelah lingkup yang disepakati selesai dan validasi akhir berhasil, atau setelah instruksi milestone terpisah.
