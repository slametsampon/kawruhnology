- [✅ SOP MIGRASI FINAL](#-sop-migrasi-final)
  - [🧭 TUJUAN MIGRASI](#-tujuan-migrasi)
- [🧩 FASE 0 — STRATEGI BRANCHING (WAJIB)](#-fase-0--strategi-branching-wajib)
  - [0.1 Buat Migration Branch](#01-buat-migration-branch)
  - [0.2 Pastikan `main` Tetap Production Stable](#02-pastikan-main-tetap-production-stable)
- [🧩 FASE 1 — PRA-MIGRASI (DI MIGRATION BRANCH)](#-fase-1--pra-migrasi-di-migration-branch)
  - [1. Backup \& Freeze](#1-backup--freeze)
  - [2. Identifikasi Konfigurasi GitHub Pages](#2-identifikasi-konfigurasi-github-pages)
- [🧩 FASE 2 — PENYESUAIAN NEXT.JS (INTI MIGRASI)](#-fase-2--penyesuaian-nextjs-inti-migrasi)
  - [3. Update `next.config.js` (KRITIS)](#3-update-nextconfigjs-kritis)
  - [4. Validasi Path Asset \& Image](#4-validasi-path-asset--image)
- [🧩 FASE 3 — CONTENTLAYER \& BUILD VALIDATION](#-fase-3--contentlayer--build-validation)
  - [5. Validasi Contentlayer](#5-validasi-contentlayer)
- [🧩 FASE 4 — DEPLOY PREVIEW DI VERCEL (BUKAN PRODUCTION)](#-fase-4--deploy-preview-di-vercel-bukan-production)
  - [6. Import Repository ke Vercel](#6-import-repository-ke-vercel)
  - [7. Preview Deployment Validation](#7-preview-deployment-validation)
- [🧩 FASE 5 — VALIDASI SEO (SEBELUM MERGE)](#-fase-5--validasi-seo-sebelum-merge)
  - [8. Validasi SEO Dasar](#8-validasi-seo-dasar)
  - [9. Redirect (Jika Dulu Pakai `basePath`)](#9-redirect-jika-dulu-pakai-basepath)
- [🧩 FASE 6 — MERGE KE `main` (SETELAH SEMUA LOLOS)](#-fase-6--merge-ke-main-setelah-semua-lolos)
  - [10. Merge Migration Branch](#10-merge-migration-branch)
- [🧩 FASE 7 — DOMAIN \& GOOGLE](#-fase-7--domain--google)
  - [11. Pasang Custom Domain](#11-pasang-custom-domain)
  - [12. Google Search Console](#12-google-search-console)
- [🧩 FASE 8 — POST-MIGRATION STABILIZATION](#-fase-8--post-migration-stabilization)
  - [13. Freeze 3–5 Hari](#13-freeze-35-hari)
  - [14. Rollback Plan (Jika Darurat)](#14-rollback-plan-jika-darurat)
- [🧠 KESIMPULAN FINAL](#-kesimpulan-final)
  - [LANGKAH BERIKUTNYA (REKOMENDASI LOGIS)](#langkah-berikutnya-rekomendasi-logis)

# ✅ SOP MIGRASI FINAL

**GitHub Pages → Vercel (Next.js App Router)**
_(Dengan strategi branch aman & SEO-safe)_

---

## 🧭 TUJUAN MIGRASI

- Menghilangkan static-only constraint GitHub Pages
- Mengaktifkan SSR / ISR / metadata dinamis
- Menyiapkan fondasi `/tools` & `/vendors`
- **Zero downtime, zero SEO shock**

---

# 🧩 FASE 0 — STRATEGI BRANCHING (WAJIB)

> ❗ **SEMUA migrasi dilakukan DI LUAR `main`**

---

## 0.1 Buat Migration Branch

```bash
git checkout -b migrate/vercel
```

Checklist:

- [ ] Branch `main` **tidak disentuh**
- [ ] Semua perubahan migrasi hanya di `migrate/vercel`
- [ ] Tidak ada perubahan konten (freeze content)

📌 **Alasan teknis:**
Vercel akan membuat **Preview Deployment otomatis** dari branch ini.

---

## 0.2 Pastikan `main` Tetap Production Stable

Checklist:

- [ ] GitHub Pages masih aktif
- [ ] `main` = source of truth
- [ ] Tidak ada redirect domain dulu

---

# 🧩 FASE 1 — PRA-MIGRASI (DI MIGRATION BRANCH)

## 1. Backup & Freeze

```bash
git status
git log -1
```

Checklist:

- [ ] Working tree clean
- [ ] Tidak ada eksperimen konten
- [ ] Commit terakhir jelas

---

## 2. Identifikasi Konfigurasi GitHub Pages

Cari & catat (jangan hapus dulu):

- [ ] `output: 'export'`
- [ ] `basePath`
- [ ] `assetPrefix`
- [ ] GitHub Actions deploy (`.github/workflows`)

📌 Semua ini **akan dinonaktifkan di branch migrasi**.

---

# 🧩 FASE 2 — PENYESUAIAN NEXT.JS (INTI MIGRASI)

## 3. Update `next.config.js` (KRITIS)

❌ **HAPUS / KOMENTARI:**

```js
output: 'export',
basePath: '/kawruhnology',
assetPrefix: '/kawruhnology/',
```

✅ **VERSI AMAN UNTUK VERCEL:**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

Checklist:

- [ ] Tidak ada `output: export`
- [ ] Tidak ada `basePath`
- [ ] Tidak ada `assetPrefix`

---

## 4. Validasi Path Asset & Image

Checklist:

- [ ] Semua asset di `/public`
- [ ] `<Image src="/..." />`
- [ ] Tidak ada path `/kawruhnology/...`

---

# 🧩 FASE 3 — CONTENTLAYER & BUILD VALIDATION

## 5. Validasi Contentlayer

Checklist:

- [ ] Tidak ada hardcoded path OS
- [ ] MDX import aman
- [ ] Contentlayer config portable

Test lokal:

```bash
npm run build
npm run start
```

➡️ **WAJIB sukses sebelum deploy ke Vercel**

---

# 🧩 FASE 4 — DEPLOY PREVIEW DI VERCEL (BUKAN PRODUCTION)

## 6. Import Repository ke Vercel

- Framework: **Next.js (auto)**
- Build command: `npm run build`
- Output dir: _(kosong / auto)_

📌 **Pastikan yang dideploy adalah branch `migrate/vercel`**

---

## 7. Preview Deployment Validation

Vercel akan memberi URL preview:

```text
https://kawruhnology-git-migrate-vercel.vercel.app
```

Checklist WAJIB:

- [ ] Homepage OK
- [ ] Blog list OK
- [ ] Post MDX OK
- [ ] Tags & Author OK
- [ ] Tidak ada 404
- [ ] Tidak ada error build

---

# 🧩 FASE 5 — VALIDASI SEO (SEBELUM MERGE)

## 8. Validasi SEO Dasar

Checklist:

- [ ] `<title>` muncul benar
- [ ] `<meta description>` ada
- [ ] Canonical URL benar
- [ ] Tidak ada `noindex`
- [ ] Robots aman

📌 Lakukan di **Preview URL**, bukan production.

---

## 9. Redirect (Jika Dulu Pakai `basePath`)

Buat `vercel.json` (jika perlu):

```json
{
  "redirects": [
    {
      "source": "/kawruhnology/:path*",
      "destination": "/:path*",
      "permanent": true
    }
  ]
}
```

Checklist:

- [ ] Redirect 301 aktif
- [ ] Tidak loop

---

# 🧩 FASE 6 — MERGE KE `main` (SETELAH SEMUA LOLOS)

## 10. Merge Migration Branch

```bash
git checkout main
git merge migrate/vercel
git push
```

📌 Setelah ini:

- Vercel **auto-deploy ke Production**
- **Belum pasang custom domain dulu**

---

# 🧩 FASE 7 — DOMAIN & GOOGLE

## 11. Pasang Custom Domain

Checklist:

- [ ] Domain ditambahkan di Vercel
- [ ] DNS diarahkan
- [ ] HTTPS aktif

---

## 12. Google Search Console

Checklist:

- [ ] Tambahkan properti domain baru
- [ ] Submit sitemap
- [ ] Jangan hapus properti lama dulu

---

# 🧩 FASE 8 — POST-MIGRATION STABILIZATION

## 13. Freeze 3–5 Hari

Checklist:

- [ ] Tidak ubah URL
- [ ] Tidak tambah fitur
- [ ] Monitor error & crawl

---

## 14. Rollback Plan (Jika Darurat)

- Revert commit di `main`, atau
- Rollback deployment di Vercel UI

📌 **Inilah alasan kita pakai migration branch.**

---

# 🧠 KESIMPULAN FINAL

✔ Migration branch **WAJIB**
✔ `main` tetap aman
✔ SEO shock **dihindari**
✔ Kawruhnology siap berevolusi

> **Ini bukan sekadar migrasi hosting,
> ini adalah upgrade arsitektur masa depan.**

---

## LANGKAH BERIKUTNYA (REKOMENDASI LOGIS)

Setelah SOP ini dijalankan, urutan **PALING AMAN**:

1️⃣ Aktifkan **ISR & metadata dinamis**
2️⃣ Tambahkan `/tools` & `/vendors`
3️⃣ Tambahkan disclosure afiliasi halus
4️⃣ Mulai affiliate network (low-risk)

👉 Jika Anda siap, saya sarankan lanjut ke:
**“Penyesuaian Next.js + Contentlayer khusus Vercel (ISR + SEO)”**
