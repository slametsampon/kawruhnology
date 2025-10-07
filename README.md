# 🧩 mx-core

Repositori ini merupakan proyek berbasis **Next.js (App Router)** yang ditujukan sebagai antarmuka web modern, ringan, dan modular. Cocok untuk keperluan dashboard, antarmuka IoT, atau sistem manajemen berbasis web lainnya.

Repositori: [https://github.com/slametsampon/mx-core](https://github.com/slametsampon/mx-core)

---

## ✨ Fitur Utama

- ⚡ Next.js dengan App Router (`app/` directory)
- 🎨 Tailwind CSS untuk styling
- 📦 Contentlayer untuk manajemen konten Markdown
- 🧠 Ditulis dalam TypeScript
- 🌐 Siap deploy ke **GitHub Pages**
- ✅ Dokumentasi pemula, mudah diikuti

---

## 🛠️ Persyaratan Sistem

Sebelum memulai, pastikan Anda sudah menginstall:

- **Node.js** versi 18 atau lebih baru  
  👉 Unduh dari: [https://nodejs.org](https://nodejs.org)
- **Git**  
  👉 Unduh dari: [https://git-scm.com](https://git-scm.com)

---

## 🚀 Setup Proyek (Jalankan di Lokal)

Ikuti langkah-langkah di bawah ini:

### 1. Clone repositori

```bash
git clone https://github.com/slametsampon/mx-core.git
cd mx-core
```

### 2. Install dependensi

Menggunakan **npm**:

```bash
npm install
```

Atau menggunakan **yarn**:

```bash
yarn install
```

### 3. Menjalankan secara lokal

```bash
npm run dev
```

Lalu buka browser:

```
http://localhost:3000
```

### 4. Build untuk produksi

```bash
npm run build
npm run start
```

---

## 🚢 Deploy ke GitHub Pages

### 🧱 1. Update `next.config.js`

Edit file `next.config.js` menjadi seperti berikut:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/mx-core',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

> Pastikan `basePath` disesuaikan dengan nama repositori GitHub Anda (`/mx-core`).

### 📜 2. Tambahkan script deploy ke `package.json`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build && next export",
  "start": "next start",
  "deploy": "npm run build && npx gh-pages -d out"
}
```

### 📦 3. Install `gh-pages`

```bash
npm install gh-pages --save-dev
```

### 🚀 4. Jalankan Deploy

```bash
npm run deploy
```

### 🛠️ 5. Atur GitHub Pages

- Buka halaman repositori di GitHub
- Masuk ke tab **Settings → Pages**
- Pilih:

  - **Source**: `gh-pages`
  - **Folder**: `/ (root)`

- Simpan

Setelah beberapa menit, situs Anda akan muncul di:

```
https://slametsampon.github.io/mx-core
```

---

## 📁 Struktur Direktori

Berikut adalah struktur direktori sesuai proyek Anda:

```
mx-core/
├── .contentlayer/            # Cache & output contentlayer
├── .next/                    # Output build Next.js
├── .vscode/                  # Konfigurasi editor
├── app/                      # Folder utama untuk App Router (routing)
├── components/               # Komponen UI yang dapat digunakan ulang
├── content/                  # Konten statis seperti Markdown
├── css/                      # File Tailwind dan custom CSS
├── data/                     # Data statis / konfigurasi
├── layouts/                  # Layout halaman global
├── node_modules/             # Dependensi proyek
├── out/                      # Output setelah export (untuk GitHub Pages)
├── public/                   # File statis seperti gambar, favicon
├── .eslintrc.{js,json}       # Konfigurasi linting
├── .gitignore
├── contentlayer.config.ts    # Konfigurasi Contentlayer
├── next.config.js            # Konfigurasi Next.js
├── package.json              # Dependensi & script npm
├── postcss.config.js         # Konfigurasi PostCSS
├── tailwind.config.js        # Konfigurasi Tailwind CSS
├── tsconfig.json             # Konfigurasi TypeScript
└── README.md                 # Dokumentasi proyek (file ini)
```

---

## 📦 Daftar Perintah Penting

| Perintah         | Deskripsi                              |
| ---------------- | -------------------------------------- |
| `npm install`    | Menginstall semua dependensi proyek    |
| `npm run dev`    | Menjalankan proyek di `localhost:3000` |
| `npm run build`  | Build untuk produksi                   |
| `npm run start`  | Menjalankan hasil build                |
| `npm run deploy` | Deploy ke GitHub Pages                 |

---

## ❓ FAQ

### 🔹 Apakah proyek ini cocok untuk antarmuka IoT?

Sangat cocok. Struktur modular dan support konten statis memungkinkan integrasi mudah dengan backend MQTT, REST API, atau WebSocket untuk sistem IoT.

### 🔹 Apakah Contentlayer wajib?

Tidak wajib, tapi sangat direkomendasikan jika Anda menggunakan banyak konten berbasis Markdown. Jika tidak dibutuhkan, bisa dinonaktifkan.

---

## 🙏 Kontribusi

Kontribusi terbuka lebar!
Silakan:

1. Fork repositori
2. Buat branch baru (`feature/nama-fitur`)
3. Commit perubahan
4. Buat Pull Request

---

## 🧑‍💻 Lisensi

Lisensi proyek ini belum ditentukan.
Silakan tambahkan file `LICENSE` jika ingin menetapkan lisensi terbuka seperti MIT.

---

## 📬 Kontak

Pemilik repo: [@slametsampon](https://github.com/slametsampon)
Jika Anda mengalami kendala, silakan buka **Issue** atau diskusi di repositori ini.

---

Terima kasih telah menggunakan proyek ini 🙌
Selamat berkarya dan semoga bermanfaat!
