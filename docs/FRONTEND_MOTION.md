# Motion frontend FlexBoard

Tanggal: 29 Oktober 2026. Branch: `feat/frontend-motion`, baseline `origin/main` pada `7ced0be`. Lingkup frontend saja; bukan perubahan desain statis atau integrasi domain baru.

## Prinsip

- CSS-first tanpa dependency baru. `src/styles/tokens.css` menyimpan durasi/easing; `src/styles/motion.css` diimpor oleh stylesheet global.
- Default konten terlihat. Animasi tidak menjadi syarat fokus, interaksi, penutupan dialog, validasi, atau penggantian data.
- Tidak memakai `transition: all`, animasi dimensi, parallax, stagger daftar, count-up progres, exit presence, scroll listener, atau timer reveal.
- Provider auth, state sesi, backend/database, kontrak API, dan native select tidak diubah.

## Spesifikasi yang diterapkan

| Target | Trigger | Properti/durasi | Pembatalan dan batas |
|---|---|---|---|
| Tombol dan pencarian banner | Hover/pressed | Warna/background/border 120 ms; pressed translateY 1 px, 80 ms | Pressed hanya enabled dan bukan aria-disabled; hover tambahan hanya pointer fine/hover |
| Navigasi dan link tugas/kembali | Hover/route aktif | Warna 120 ms; indikator aktif fade 120 ms | Status aktif tidak ditunda; tidak mengubah lebar menu |
| Input/textarea | Fokus/interaksi | Border/background 120 ms | Outline langsung; invalid tidak ditransisikan dan border error tidak ditimpa |
| Konten route workspace | Mount pathname baru | Fade 220 ms, tanpa transform | Boundary hanya pathname; query/auth rerender tidak meresetnya; fokus kontrol membatalkan permanen; halaman lama langsung dilepas |
| Konten login (`.auth-main`) | Mount | Fade 220 ms | Tidak mengubah submit/session; fokus kontrol membatalkan permanen; animasi dipasang pada stacking context yang sudah ada, bukan kartu dengan dekorasi z-index negatif |
| Dialog native dan backdrop | Dialog dibuka | Panel fade/translateY 8 px 180 ms; backdrop fade 180 ms | Tutup/Escape langsung, tanpa exit delay; lifecycle Modal dan body lock tetap |
| Baris checklist draft | Mount ID baru | Fade/translateY 4 px 140 ms | Fokus membatalkan permanen, sehingga input yang langsung difokuskan tidak menunggu efek; blur tidak mengulang entrance; delete langsung |
| Panduan sekunder form tugas | Mendekati viewport | WAAPI fade/translateY 8 px 220 ms, sekali per mount | Hanya bila awalnya di bawah layar; tidak dipasang pada form, daftar, error, atau loading |
| Spinner | Loading yang sudah ada | Putar 1 detik linear | Tidak membuat loading palsu; reduced motion statis dengan teks status |

Easing bersama: `cubic-bezier(0.2, 0, 0, 1)`. Tidak menambahkan elevasi/scale pada kartu noninteraktif, animasi error shake, animasi progress dari nol, atau dropdown pengganti select native. Geometry filter tetap tinggi/font/line-height 48/16/24 px, chevron inset 16 px, ruang teks 48 px.

## Scroll reveal yang aman

`src/components/ui/ScrollReveal.jsx` membungkus hanya `<details>` panduan di bawah form tugas. Elemen tetap terlihat selama menunggu; IntersectionObserver memakai root margin bawah 48 px untuk memulai efek sebelum konten masuk layar. Tidak ada class pending dengan opacity nol. Konsekuensinya, ini enhancement ringan, bukan penyembunyian konten sebelum scroll.

- Konten yang sudah dalam viewport saat mount tidak dianimasikan.
- Fokus di dalam konten membatalkan efek/pending observer langsung.
- Observer diputus setelah pemicu pertama; perubahan draft tidak mengulang reveal.
- API browser tidak tersedia atau opsi animasi gagal: konten tetap statis dan dapat digunakan.
- Cleanup memutus observer, membatalkan animasi, dan melepas listener; diuji dengan React StrictMode.

## Reduced motion

Efek CSS baru hanya aktif pada `prefers-reduced-motion: no-preference`. `useEntryMotion` menandai entrance yang dilewati/dibatalkan oleh reduce sebagai settled, sehingga kembali ke no-preference tidak memudarkan ulang route/login/baris lama. Dialog tetap dapat memainkan entrance pada pembukaan berikutnya. Mode reduce tidak memasang entrance/pressed baru dan menonaktifkan transisi terkait serta spinner yang sudah ada. ScrollReveal mendengarkan perubahan preferensi dan membatalkan efek/pending observer ketika reduce diaktifkan. Mengaktifkan kembali motion tidak mengulang reveal yang telah dibatalkan.

## Validasi akhir

- Seluruh 178 tes unit dalam 21 file lulus dengan `npm test -- --maxWorkers=1` (101,15 detik), termasuk fallback listener media query lama. Timeout global tidak diubah.

- Seluruh 67 tes Chromium lulus (3,7 menit) pada server terisolasi port 5186, termasuk delapan tes motion dan regresi ukuran kontrol/font/geometri yang dipertahankan.
- Production build lulus; empat tes konfigurasi deployment lulus; lint tanpa error dengan satu warning baseline `AuthContext.jsx` yang tidak berubah.
- Screenshot login desktop 1440 px dan form tugas mobile 390 px diperiksa; lapisan dekorasi login dan komposisi form tetap terjaga. Bukan pixel-diff.
- Review memperbaiki replay setelah blur, stacking context kartu login, replay saat preferensi motion berubah, serta fallback listener media query lama. Tes motion memeriksa pembatalan CSS/WAAPI, fokus/delete langsung, reveal sekali, dan mode reduce pada 320/390/768/1440 px.

## Baseline terbaru dan batas pengujian

Baseline `7ced0be` sudah memuat autentikasi dan provider sesi. Pernyataan historis bahwa login disabled/tidak ada request API tidak berlaku pada baseline ini. Paket motion tidak mengubah autentikasi: login tetap memanggil endpoint yang sudah ada; provider tetap memeriksa `/api/auth/me`. Domain daftar/tugas/proyek tetap belum terintegrasi.

Tes routing/browser lama masih mengharapkan notice profil lama, login disabled, dan nol request API. Assertion diperbarui untuk kondisi sesi terbaru tanpa menghapus pemeriksaan keyboard, geometri, tanggal, checklist, atau larangan mutasi domain. Tes browser regresi lama memakai respons unavailable Vite yang nyata; tes motion mengendalikan respons `/api/auth/me` dengan 503 agar deterministik. Ini bukan fallback produksi dan bukan bukti login akun nyata.

Baseline unit awal: 143 lulus, tujuh assertion notice lama gagal. Lint baseline memiliki satu warning `react-refresh/only-export-components` pada `src/features/auth/AuthContext.jsx`; file auth tidak diubah untuk menutupi warning. Build awal yang berjalan bersamaan dengan pembuatan stylesheet gagal karena import motion sudah ditambahkan sebelum file tersedia; pengulangan setelah file lengkap lulus. Eksekusi penuh saat suite lain berjalan sempat mengalami satu timeout 5000 ms pada tes fokus checklist; suite satu worker meluluskan 175 tes saat itu, lalu pengulangan biasa setelah perbaikan berikutnya meluluskan 177 tes dalam 21 file. Tidak menaikkan timeout global. Validasi akhir dicatat setelah seluruh perubahan stabil.

Tes konfigurasi deployment baseline juga salah mencocokkan pola route sebagai substring: `/api/health` dapat cocok mulai slash kedua. Assertion diperbaiki dengan anchor awal/akhir untuk meniru pencocokan seluruh path; empat tes konfigurasi kemudian lulus. `vercel.json`, handler, dan routing produksi tidak diubah.

Server browser diuji melalui konfigurasi sementara di direktori Temp OpenCode: cwd `D:/Flexboard`, port 5186 dengan `--strictPort`, `reuseExistingServer: false`. Port default 5173 sedang dipakai workspace lain, sehingga hasil dari port tersebut tidak dipakai sebagai bukti. Konfigurasi Playwright repository tetap tidak berubah.

Vite melaporkan dependency backend `better-auth`, `better-auth/node`, dan `pg` belum teresolusi pada environment lokal. Tidak memasang dependency/backend untuk menutupi kondisi tersebut; sesi unavailable pada Vite bukan hasil verifikasi auth nyata. Tidak menjalankan migration/seed, mengganti `.env`, menambah dependency, atau mengubah repository bersarang `flexboard/`. Pengujian ini bukan verifikasi backend, database, produksi Vercel, lintas browser selain Chromium, audit performa terukur, atau screenshot-diff terhadap Figma.
