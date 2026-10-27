# Status frontend FlexBoard

Tanggal: 27 Oktober 2026. Status: **fondasi dan pratinjau UI; bukan MVP end-to-end**.

## Yang tersedia

- React/JavaScript/Vite; CSS token, Lucide, React Router tetap dipakai.
- Struktur route, layout, UI bersama, dan fitur terpisah.
- Header horizontal, banner, logo Figma lokal, tipografi dan palet berdasarkan acuan.
- Menu mobile dialog native, penahanan fokus, Escape, pengembalian fokus, skip link.
- Beranda, Tugas Kami, detail tugas, form baru/edit, Progres Tim, Anggota, Aktivitas, Login.
- Pencarian/filter URL lokal, reset, navigasi antarrute; bukan pencarian API.
- Form baru menerima input lokal tanpa penyimpanan. Form edit tidak mengaku memuat tugas.
- ProjectDialog dan komponen TaskCard/ChecklistItem disiapkan; tidak mewakili integrasi selesai.
- Nilai ringkasan memakai tanda —, tidak ada angka/tugas/pengguna/aktivitas domain palsu.
- State layanan belum tersedia dibedakan dari loading, error, dan data kosong.
- Login dan mutasi server disabled. Semua route workspace saat ini pratinjau publik tanpa data privat, bukan route produksi yang telah terproteksi.

## Yang belum selesai

Semua integrasi domain, sesi, guard produksi, capability/role UI, penyimpanan checklist/laporan/proyek/tugas, profil, pengelolaan role/status, pagination data, refresh persistensi, konflik API, dan verifikasi keamanan end-to-end menunggu backend dan keputusan produk.
Komponen presentasional bukan bukti fitur domain selesai. Tidak ada backend/migration yang diubah, dan tidak ada mock yang dibuat.

## Acuan Figma dan deviasi

File: https://www.figma.com/design/6VJnow9ExBcHVvLQODUzLw/FlexBoard-MCP?node-id=0-1&m=dev

| Frame | Node |
|---|---|
| Beranda | 1:5 |
| Tugas kami | 1:148 |
| Progres team | 1:286 |
| aktivitas terbaru | 1:408 |
| Update Progres | 1:468 |
| Login | 1:544 |
| Menambahkan tugas | 1:573 |

Semua tujuh frame diperiksa melalui design context/render. Frame mobile, Anggota, profil, dan checklist lengkap belum tersedia. Code Connect tidak tersedia pada seat saat pemeriksaan.
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
- Validasi akhir kode: `npm run lint` lulus, `npm test` 16 tes lulus, `npm run test:browser` 9 tes lulus, dan `npm run build` lulus.
- Tes unit/komponen menggunakan props generik dan interaksi lokal; tidak memakai mock API/domain.
- Playwright Chromium memeriksa seluruh sembilan route pada 360/390/768/1024/1440 px: heading, logo terisi, tanpa overflow, tanpa exception browser, tanpa request /api domain.
- Tes menu: fokus tetap di dialog, Escape, kembali ke trigger, navigasi.
- Tes pencarian/reset URL dan kontrol login/simpan disabled.
- Desktop/mobile diperiksa melalui screenshot lokal. Tidak ada deployment Vercel atau pengujian PostgreSQL/akun nyata.
- Audit setelah pembaruan Vite 6.4.5 dan Router 6.30.6: 2 moderate, 0 high/critical. Keduanya terkait React Router; npm menyarankan major 7.18.4. Tidak dilakukan migrasi major sepihak. Route aplikasi tidak menerima tujuan eksternal dinamis, dan aplikasi tidak memakai SSR hydration; audit tetap belum bersih dan perlu evaluasi sebelum produksi.

## Git

Branch: feat/frontend-foundation. Identitas: Rainer <rainersimanjuntak59@gmail.com>; akun autentikasi disetujui: Constanvel.
Folder repository terpisah flexboard/ dipertahankan dan tidak distage. Commit per perubahan logis, tanpa push per commit.
Push ditunda karena lingkup seluruh MVP belum selesai; hanya dilakukan setelah lingkup yang disepakati selesai dan validasi akhir berhasil, atau setelah instruksi milestone terpisah.
