<p align="center">
  <img src="server/public/STSLogo.png" alt="SuperTinyServer Logo" width="180">
</p>

<h1 align="center">SuperTinyServer (STS)</h1>

<p align="center">
  <b>Mini Server Portable Berbasis Android & Termux</b>

---

## 1. Tentang Projek

**SuperTinyServer (STS)** adalah solusi mini server portable berbasis Android dan Termux yang dirancang untuk mengubah perangkat smartphone/tablet Android menjadi server jaringan lokal yang hemat daya, ringan, dan mudah dinavigasi dari perangkat apa pun.

### Fitur Utama
- **Live System Monitoring Dashboard**: Pemantauan penggunaan CPU, RAM, Storage, Uptime, dan informasi sistem secara *real-time*.
- **Interactive Web Terminal**: Akses shell server (bash) langsung dari peramban web dengan dukungan PTY sungguhan (*powered by node-pty*), auto-completion, warna ANSI, dan editor terminal (`nano`/`vim`).
- **File Sharing (File Drop) & Preview**: Berbagi file antar perangkat lokal, upload/download batch, buat folder, serta *inline preview* langsung untuk gambar, teks/kode, video, audio, dan dokumen PDF tanpa perlu mengunduh.
- **SSH Remote Access**: Server SSH bawaan (`port 8022`) melalui OpenSSH untuk akses command line jarak jauh.
- **Automatic IP Detection & Startup**: Otomatis mendeteksi IP jaringan lokal dan langsung menjalankan seluruh layanan begitu Termux dibuka.
- **100% Offline Capable**: Seluruh dependensi web frontend (`xterm.js`, CSS, gambar) tersimpan secara lokal tanpa ketergantungan CDN internet.

### Arsitektur Sistem
```text
Perangkat Android (Smartphone / Tablet)
 └── Termux Environment
      ├── OpenSSH Server ─────── Port 8022 (Remote Shell)
      └── Node.js + Express ──── Port 3000 (Web Server)
           ├── Web Dashboard (System Monitoring & Info)
           ├── Interactive Web Terminal (PTY WebSocket)
           └── File Sharing (File Drop & Inline Preview)
```

---

## 2. Cara Instalasi & Penggunaan

Panduan lengkap mulai dari mendapatkan aplikasi Termux di Android hingga SuperTinyServer online dan dapat diakses melalui jaringan lokal (Wi-Fi).

### Langkah 1: Mendapatkan & Menginstal Termux
> [!IMPORTANT]
> **Jangan mengunduh Termux dari Google Play Store** karena versi Play Store sudah tidak diperbarui lagi. Unduh versi resmi terbaru dari F-Droid.

1. Buka browser di perangkat Android Anda dan akses [Termux-app/releases](https://github.com/termux/termux-app/releases).
2. Unduh dan instal APK Termux versi terbaru.
3. Buka aplikasi Termux yang telah terinstal.
4. *(Opsional)* Berikan izin akses penyimpanan untuk mempermudah berbagi folder unduhan:
   ```bash
   termux-setup-storage
   ```

### Langkah 2: Mengunduh SuperTinyServer
Di dalam aplikasi Termux, perbarui package dan instal Git:
```bash
pkg update && pkg upgrade -y
pkg install git -y
```

Kemudian clone repository SuperTinyServer dan masuk ke foldernya:
```bash
git clone https://github.com/Amrlwcksn/SuperTinyServer.git
cd SuperTinyServer
```

### Langkah 3: Menjalankan Skrip Instalasi
Jalankan skrip instalasi yang sudah disediakan:
```bash
./install.sh
```

Proses instalasi otomatis akan:
1. Memasang paket dependensi sistem (`Node.js`, `OpenSSH`, `curl`, `build-essential`).
2. Mengunduh dependensi Node.js (`express`, `multer`, `ws`, `node-pty`, `xterm`).
3. Menyiapkan konfigurasi *automatic startup* pada `.bashrc` Termux.
4. Menjalankan layanan SuperTinyServer.

### Langkah 4: Mengakses Server di Jaringan Lokal
Setelah proses instalasi selesai (atau setiap kali aplikasi Termux dibuka kembali), layar Termux akan menampilkan banner informasi server:

```text
╔══════════════════════════════════════════════════╗
║              SUPERTINYSERVER ONLINE              ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  DASHBOARD                                       ║
║  http://192.168.1.15:3000                        ║
║                                                  ║
║  SSH CONNECTION                                  ║
║  ssh -p 8022 username@192.168.1.15               ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

1. **Akses Dashboard dari Browser (Laptop / HP / Tablet di Wi-Fi yang sama)**:
   Buka peramban web dan ketik URL IP yang tertera, contohnya:
   ```text
   http://192.168.1.15:3000
   ```
2. **Akses Remote SSH dari Laptop**:
   Buka Terminal atau PowerShell di laptop/komputer Anda, lalu jalankan:
   ```bash
   ssh -p 8022 username@192.168.1.15
   ```

---

## 3. Lisensi

Proyek ini dirilis di bawah lisensi **[MIT License](LICENSE)**.

```text
MIT License

Copyright (c) 2026 SuperTinyServer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
