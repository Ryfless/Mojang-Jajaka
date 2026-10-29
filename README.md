# Paket Dokumentasi Desain MOKA

## Isi paket

- `prompt-ai-agent.md`: instruksi pembuatan dokumentasi sebagai satu file `index.html`.
- `dokumentasi-desain-moka.md`: isi dokumentasi berdasarkan urutan yang dimulai dari Login, proses registrasi peserta baru, lalu ruang kerja panitia dari dashboard hingga pengaturan jadwal, disusul pemantauan status dan hasil dari sisi peserta.
- `referensi-gaya-dokumentasi.html`: contoh visual untuk struktur dokumen, hierarki heading, panel informasi, tabel, daftar langkah, galeri gambar, dan caption. Gunakan sebagai referensi gaya saja.
- `media/`: screenshot desain MOKA yang digunakan di dokumentasi.

## Cara menggunakan

Berikan seluruh folder ini kepada AI agent. Minta agent membaca `prompt-ai-agent.md` terlebih dahulu, lalu menggunakan dua file Markdown dan folder `media/` sebagai sumber. File referensi HTML hanya menjadi acuan layout dan penyajian isi. Identitas visual akhir tetap mengikuti sistem warna dan tipografi MOKA.

Hasil yang diminta dari agent adalah satu file `index.html` dengan CSS dan JavaScript di dalam file itu. Screenshot tetap dibaca dari folder `media/` dengan path relatif.
