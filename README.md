# Undangan Pawiwahan Sarmita & Reni

Flipbook undangan digital berbasis HTML, PDF.js, dan StPageFlip. Paket ini berisi versi V4 yang telah diuji secara lokal, termasuk musik latar.

## Fitur
- Flipbook PDF 4 halaman dengan navigasi Sebelumnya/Berikutnya.
- Tombol layar penuh.
- Nama penerima personal melalui parameter URL `?to=`.
- Ukuran nama menyesuaikan panjang teks pada area sampul.
- Musik latar MP3, Play/Pause, dan loop; pemutaran dimulai setelah interaksi pengguna.
- Tampilan responsif untuk desktop dan ponsel.

## Struktur utama
- `index.html` — halaman utama.
- `css/style.css` — tampilan dan layout.
- `js/app.js` — Flipbook, personalisasi nama, navigasi, dan audio.
- `documents/undangan-master.pdf` — PDF undangan utama.
- `assets/background-music.mp3` — musik latar.

## Repository dan alamat website
Paket ini ditujukan untuk repository yang sudah digunakan:

- Akun GitHub: `pirstudiobali`
- Repository: `Undangan-Pawiwahan-SR`
- Alamat GitHub Pages: <https://pirstudiobali.github.io/Undangan-Pawiwahan-SR/>

Jangan membuat repository baru dan jangan memindahkan `index.html` ke subfolder. Unggah isi ZIP ini ke root repository yang sama.

## Tautan personal
Tambahkan parameter `to` pada alamat website, misalnya:

- <https://pirstudiobali.github.io/Undangan-Pawiwahan-SR/?to=Bapak%20Andi>
- <https://pirstudiobali.github.io/Undangan-Pawiwahan-SR/?to=Ibu%20Siti>

Gunakan file generator Excel secara lokal untuk membuat daftar tautan. **Jangan unggah Excel daftar tamu ke repository publik.**

## Catatan audio
Browser biasanya memblokir autoplay tanpa interaksi pengguna. Musik mulai setelah pengunjung menyentuh/mengeklik area pembaca atau kontrol navigasi. Pengunjung dapat menjeda dan melanjutkan musik melalui tombol musik di toolbar.

## Catatan privasi dan publikasi
- Repository dan seluruh berkas di GitHub Pages bersifat publik.
- Pastikan PDF memang dimaksudkan untuk dibagikan kepada publik.
- Parameter `?to=` hanya mempersonalisasi teks nama pada sampul. Parameter ini bukan autentikasi atau tautan rahasia; penerima dapat mengubah nama di URL.
- PDF.js dan StPageFlip dimuat melalui CDN, sehingga pengunjung memerlukan koneksi internet.
