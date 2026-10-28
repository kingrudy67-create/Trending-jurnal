# TradeFlow Cent Journal

Jurnal dan kalkulator trading akun cent berbasis HTML, Tailwind CSS, JavaScript, Chart.js, dan PWA.

## Fitur
- Konversi berjenjang USC → USD (USC / 100) → IDR (USD × kurs kerja).
- Modal awal dalam USC, equity, net PnL, ROI kumulatif.
- Jurnal multi-posisi dengan tanggal, waktu, instrumen, BUY/SELL, lot, PnL cent, dan catatan.
- Instrumen Forex, komoditas, indeks, crypto, dan lainnya.
- Grafik equity, distribusi win/loss, win rate, rata-rata PnL, hari profit/loss.
- Catatan evaluasi dan psikologi trading terpisah.
- Ekspor CSV dengan kolom tanggal, jam, instrumen, tipe, lot, PnL USC/USD/IDR, ROI per posisi, dan catatan.
- Profil pengguna, foto profil, pengaturan modal, dan kurs USD/IDR.
- Penyimpanan lokal di browser dan service worker dasar.

## Menjalankan di Android
PWA perlu diakses melalui HTTPS atau localhost. Jangan membuka `index.html` langsung dari file manager karena service worker tidak akan aktif.

### Opsi GitHub Pages
1. Ekstrak ZIP ini.
2. Unggah semua isi folder (termasuk `app.js`, `manifest.json`, `sw.js`, dan folder `icons`) ke root repositori GitHub.
3. Aktifkan GitHub Pages pada repositori.
4. Buka URL HTTPS dari Chrome Android dan tunggu sampai aset inti tersimpan.
5. Buka menu Chrome (⋮) lalu pilih **Instal aplikasi** atau **Tambahkan ke layar utama**.

### APK Android
PWA bukan file APK secara otomatis. Untuk APK, bungkus situs HTTPS dengan Android Studio/TWA (Trusted Web Activity) atau WebView wrapper, lalu build APK/AAB. Proses itu membutuhkan toolchain Android terpisah.

## Batasan dan catatan
- Data disimpan lokal di browser/perangkat ini; belum ada sinkronisasi cloud atau login.
- Kurs online adalah kurs referensi USD/IDR, bukan kurs broker; jika offline, masukkan kurs manual atau gunakan nilai tersimpan.
- Tailwind CDN, Chart.js, Lucide, dan font eksternal memerlukan internet pada pemuatan awal. Aplikasi shell dan data lokal tetap bisa dibuka offline setelah cache tersedia, tetapi grafik/ikon eksternal mungkin tidak tersedia bila belum pernah diunduh.
- Ekspor CSV menggunakan pemisah titik koma agar lebih cocok dibuka pada sejumlah pengaturan regional spreadsheet. Jika aplikasi spreadsheet mengharapkan koma, ubah pemisah pada kode `exportCSV()`.
- Ini alat pencatatan, bukan koneksi broker, bukan sinyal trading, dan bukan saran investasi.
