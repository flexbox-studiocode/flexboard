# Kepadatan layout frontend FlexBoard

Tanggal: 29 Oktober 2026. Branch: `fix/frontend-desktop-density`; baseline `origin/main` pada `68d75bf`. Permintaan: mengatasi tampilan yang terasa terlalu zoom-in tanpa mengubah backend atau perilaku integrasi tugas/autentikasi.

## Diagnosis

- Meta viewport lokal dan deployment diperiksa: `width=device-width,initial-scale=1.0`, bukan penyebab pembesaran.
- Resolusi fisik layar berbeda dari viewport CSS. Skala OS/DPR dan zoom browser dapat memperbesar hasil raster; screenshot tidak cukup untuk menyimpulkan zoom pengguna salah.
- Sumber kepadatan rendah yang terkonfirmasi pada CSS desktop: judul sampai 64 px, banner minimal 214 px, jarak bawah banner 80 px, header sekitar 100 px, padding panel daftar 52/40 px, serta kartu login selebar 915 px dengan min-height 962 px.
- Solusi memakai ukuran komponen, tipografi, dan spacing responsif. Tidak memakai CSS `zoom`, transform scale seluruh aplikasi, manipulasi viewport, penguncian zoom pengguna, atau pengecilan root font.

## Ukuran yang diterapkan

Penyesuaian kepadatan utama berlaku mulai viewport 851 CSS px, mengikuti batas desktop navigasi yang sudah ada. Aturan kepadatan mobile sampai 850 px dipertahankan; koreksi alignment/wrapping tombol dari review screenshot dijelaskan terpisah di bawah.

| Elemen | Baseline desktop | Ukuran baru desktop |
|---|---:|---:|
| Header | Min 99 px, ditambah border | Min 80 px, ditambah border |
| Logo header | 72 × 76 px | 52 × 54 px |
| Padding atas konten | 37 px | 24 px |
| Gutter konten | 48 px | 32 px |
| Banner | Min 214 px | Min 164 px, tumbuh bila konten perlu |
| Jarak banner ke halaman | 80 px | 32 px |
| Judul banner | 52–64 px | `clamp(32px, 3vw, 44px)` |
| Judul halaman | Sampai 64 px | Sampai 40 px |
| Judul section dashboard | Sampai 40 px | Sampai 28 px |
| Pencarian banner | Input 61 px, tombol 82 × 75 px | Input 48 px, tombol 52 × 48 px |
| Padding panel daftar | Sampai 52/40 px | Sampai 28/28 px |
| Padding panel tugas | Sampai 40 px | Sampai 28 px |
| Baris aktivitas/progres terisi | Min 178 px, padding blok 40 px | Min 112 px, padding blok 20 px; tumbuh untuk teks panjang |
| Label/input form tugas | 20 px / min 65 px | 16 px / min 52 px |
| Login desktop | Lebar 915 px, min-height 962 px | Lebar maksimum 650 px, tinggi alami |
| Input/tombol login | Min 74 px, font 24 px | Min 52/48 px, font 16 px |

Lebar maksimum workspace 1440 px dan identitas visual dipertahankan: font, warna, panel navy, dekorasi banner/login, aksen dan stripe. Ringkas bukan berarti seluruh teks diperkecil: root font, teks tombol/navigasi, serta token ikon dan kontrol tidak berubah. Filter native tetap tinggi/font/line-height 48/16/24 px, chevron inset 16 px dan ruang teks 48 px; select multiple tetap punya ruang daftar.

## Batas perubahan

- Penyesuaian kepadatan memakai CSS. Koreksi tombol proyek juga memindahkan teks bantuan ke luar baris kontrol melalui JSX dan menghubungkannya kembali dengan `aria-describedby`/`useId`, sehingga tombol sejajar dengan select, bukan dasar teks bantuan. Tidak mengubah request API, submit, permission, provider auth, state domain, atau perilaku checklist.
- Baseline terbaru sudah memiliki integrasi end-to-end tugas dan form. Tes historis yang masih menyatakan semua kontrol preview/disabled atau melarang pembacaan domain perlu diselaraskan; bukan alasan mengembalikan fungsi produksi lama.
- Tidak mengubah `api/`, `server/`, database, migration, seed, dependency/lockfile, `.env`, konfigurasi deployment, atau repository bersarang `flexboard/`.
- Tidak mengubah file Figma; metadata referensi dibaca. Ukuran besar historis sengaja diganti karena permintaan kepadatan baru, bukan klaim pixel-perfect.

## Koreksi tombol dari review screenshot

- `ProjectPicker`: teks bantuan dipindah ke bawah seluruh baris, tetap terhubung ke select melalui `aria-describedby`. Select dan tombol pratinjau memakai tinggi minimum 48 px, font 16 px dan line-height 24 px. Pada layar sempit tombol boleh pindah baris tanpa menimpa teks.
- Checklist form tugas: tombol hapus mengikuti tinggi input (65 px mobile, 52 px desktop), tetap lebar 44 px; pusat ikon tidak lagi lebih rendah dari pusat input.
- Toolbar mobile: tombol reset mendapat satu baris penuh tanpa margin atas 29 px yang sebelumnya mengasumsikan label di atasnya.
- Form tugas pada layar sampai 360 px: aksi ditumpuk agar label simpan tidak memaksa satu tombol lebih tinggi dari tombol kembali.
- Konfirmasi dialog pada layar sampai 480 px: aksi ditumpuk lebar penuh agar label arsip tidak terbungkus dan membesarkan tombol batal. Pada layar lain action row dapat membungkus.
- Tidak mengganti label/izin/handler/mutasi tombol. Pengujian menambahkan alignment, wrapping, tinggi kontrol, bantuan aksesibel, Escape dan pengembalian fokus.

## Validasi

- `tests/browser/buttons.spec.js`: **17 tes Chromium lulus** pada server terisolasi port 5193 (1,6 menit). Select/tombol proyek diukur pada 320/390/768/850/851/1024/1440 px; checklist pada 320/390/851/1024/1440 px; reset dan konfirmasi pada 320/390 px. Pemeriksaan tambahan mencakup tombol tujuh halaman pada 390 px.
- Screenshot hasil koreksi proyek pada 390 dan 1440 px diperiksa. Pada 1440 px, select dan tombol sama-sama tinggi 48 px dan koordinat atas sama. Pada 390 px, tombol pindah baris dengan gap 12 px; bantuan berada di bawah keduanya. Tidak ada klaim screenshot-diff atau pixel-perfect.
- Capture desktop 1440 px: header 81 px termasuk border, banner 164 px, panel tugas pertama mulai sekitar y=439 px. Screenshot dashboard/login diperiksa; browser desktop interaktif tidak terhubung sehingga pemeriksaan memakai Playwright lokal.
- Production build dan empat tes konfigurasi deployment lulus. Lint tanpa error dengan satu warning baseline `react-refresh/only-export-components` di `src/features/auth/AuthContext.jsx:31:17`.
- Baseline unit sebelum penyelarasan tes: 160 lulus / 18 gagal (178 tes). Tes lama untuk payload/permission/read API diselaraskan dan lima tes ditambahkan, tanpa menghapus assertion regresi sebenarnya.
- Eksekusi unit penuh saat beberapa suite browser paralel aktif: 175 lulus / 8 gagal (183 tes), termasuk tiga timeout 5000 ms. Pengulangan terarah empat file meluluskan 19 tes dan menyisakan lima assertion baseline yang sama, tanpa menaikkan timeout: dua di `TaskFormPage.test.jsx`, tiga di `TasksPage.test.jsx`. Tes proyek dan aktivitas pada pengulangan tersebut lulus.

### Regresi baseline yang tidak ditutup oleh paket visual

1. `TaskFormPage.jsx` tidak lagi memberi nama region `Form informasi tugas`.
2. `key={id || 'new'}` membenturkan form create dengan edit ID `new`; draft edit masih muncul saat kembali ke form baru.
3. `TasksPage.jsx` menyalin resource props ke state hanya saat mount; pembaruan loading, query scope dan missing scope tidak mengganti resource lama (tiga assertion).

Assertion tetap aktif dan gagal; paket visual tidak mengubah state/domain agar suite tampak hijau. Integrasi auth/domain nyata, database, runtime deployment, browser selain Chromium, dan zoom browser sungguhan belum diverifikasi. DPR 1/1.25/2 menguji kestabilan ukuran CSS, bukan simulasi zoom browser. Pengujian browser memakai server terisolasi dengan port eksplisit dan `--strictPort`, tanpa menggunakan server workspace lain pada port default. Saat persiapan push, suite Chromium penuh belum selesai: log telah mencatat 17 tes tombol, 20 tes density/DPR dan lima tes filter lulus; empat tes `collection-states.spec.js` gagal. Tidak diklaim seluruh suite hijau. Kegagalan harness koleksi tetap perlu ditindaklanjuti bersama regresi resource props baseline. Assertion pencarian URL pada `foundation.spec.js` memakai state unavailable, karena scope resource `/tasks` tidak cocok dengan URL berquery; respons gagal API tidak melewati pengaman scope tersebut.
