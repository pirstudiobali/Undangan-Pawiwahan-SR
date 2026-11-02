# Undangan Digital Sarmita & Reni

Flipbook undangan digital berbasis HTML, PDF.js, dan StPageFlip.

## Fitur
- Tampilan buku digital dengan navigasi halaman dan layar penuh.
- Nama penerima personal melalui parameter URL `?to=`.
- Nama panjang menyesuaikan ukuran agar tetap berada dalam area sampul.
- Tampilan responsif untuk desktop dan ponsel.
- PDF utama disimpan pada `documents/undangan-master.pdf`.

## Publikasi GitHub Pages
1. Buat repository GitHub bernama `undangan-sarmita-reni` dan pilih **Public**.
2. Unggah isi folder ini ke **root** repository (file `index.html` harus terlihat langsung di halaman utama repository).
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main`, folder `/(root)`, lalu klik **Save**.
6. Setelah deployment selesai, alamat website akan berbentuk `https://NAMA-AKUN.github.io/undangan-sarmita-reni/`.

## Tautan personal
Tambahkan `?to=` di belakang alamat website. Contoh:
- `https://NAMA-AKUN.github.io/undangan-sarmita-reni/?to=Bapak%20Andi`
- `https://NAMA-AKUN.github.io/undangan-sarmita-reni/?to=Ibu%20Siti`

Gunakan Excel template secara lokal untuk menghasilkan tautan. Jangan unggah Excel yang berisi daftar nama tamu ke repository publik.

## Catatan publikasi dan privasi
- Website GitHub Pages dan PDF di repository ini dapat diakses publik.
- Parameter `?to=` hanya mengganti nama tampilan. Penerima dapat mengubahnya; ini bukan login, verifikasi, atau tautan undangan rahasia.
- PDF harus memang ditujukan untuk dibagikan secara publik sebelum diterbitkan.
- PDF.js dan StPageFlip dimuat dari jsDelivr CDN, sehingga browser memerlukan koneksi internet.
