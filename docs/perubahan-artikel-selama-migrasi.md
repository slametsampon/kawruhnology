- [1️⃣ Validasi Alur yang Anda Usulkan (Apakah BENAR?)](#1️⃣-validasi-alur-yang-anda-usulkan-apakah-benar)
  - [🔁 Alur yang Anda pahami](#-alur-yang-anda-pahami)
  - [✅ Penilaian](#-penilaian)
- [2️⃣ Penyesuaian WAJIB (Ini Penting)](#2️⃣-penyesuaian-wajib-ini-penting)
  - [⚠️ Masalah Potensial](#️-masalah-potensial)
- [3️⃣ Skema yang BENAR (FINAL \& AMAN)](#3️⃣-skema-yang-benar-final--aman)
  - [🔷 Prinsip Kunci](#-prinsip-kunci)
- [4️⃣ Workflow FINAL yang Direkomendasikan](#4️⃣-workflow-final-yang-direkomendasikan)
  - [🧭 Struktur Branch](#-struktur-branch)
  - [✍️ Saat Artikel Baru Muncul](#️-saat-artikel-baru-muncul)
  - [🔁 WAJIB: Sinkronisasi ke `migrate/vercel`](#-wajib-sinkronisasi-ke-migratevercel)
- [5️⃣ Selama Migrasi (RULES OF ENGAGEMENT)](#5️⃣-selama-migrasi-rules-of-engagement)
  - [✅ BOLEH](#-boleh)
  - [❌ TIDAK BOLEH](#-tidak-boleh)
- [6️⃣ Saat Migrasi SELESAI](#6️⃣-saat-migrasi-selesai)
  - [🟢 Kondisi Ideal Sebelum Final Merge](#-kondisi-ideal-sebelum-final-merge)
  - [🔀 Final Merge (AMAN)](#-final-merge-aman)
- [7️⃣ Kapan POTENSI ISU Masih Bisa Muncul?](#7️⃣-kapan-potensi-isu-masih-bisa-muncul)
- [8️⃣ Kesimpulan Tegas (Jawaban Akhir)](#8️⃣-kesimpulan-tegas-jawaban-akhir)
- [9️⃣ Rekomendasi Tambahan (Opsional tapi Profesional)](#9️⃣-rekomendasi-tambahan-opsional-tapi-profesional)

## 1️⃣ Validasi Alur yang Anda Usulkan (Apakah BENAR?)

### 🔁 Alur yang Anda pahami

```text
main  →  GitHub Pages (LIVE)
migrate/vercel → Vercel Preview (TEST)

Artikel baru muncul
→ ditulis di main
→ deploy ke GitHub Pages

Migrasi selesai
→ merge migrate/vercel → main
→ deploy ke Vercel
```

### ✅ Penilaian

- **Logika benar**
- **Aman secara SEO**
- **Aman secara operasional**
- **Tidak mengganggu pembaca**

➡️ **Ini adalah pola “dual-track deployment” yang valid.**

---

## 2️⃣ Penyesuaian WAJIB (Ini Penting)

Tanpa ini, akan ada **konflik halus**.

---

### ⚠️ Masalah Potensial

Jika:

- Artikel baru hanya masuk ke `main`
- `migrate/vercel` tidak pernah di-sync

Maka saat merge:

- Artikel bisa **hilang**
- Atau muncul conflict MDX
- Atau build Vercel tidak mencakup konten terbaru

---

## 3️⃣ Skema yang BENAR (FINAL & AMAN)

### 🔷 Prinsip Kunci

> **Content = single source of truth** > **Infrastructure = branch terpisah**

---

## 4️⃣ Workflow FINAL yang Direkomendasikan

### 🧭 Struktur Branch

```text
main                → CONTENT + PROD (GitHub Pages)
migrate/vercel      → INFRASTRUCTURE + PREVIEW (Vercel)
```

---

### ✍️ Saat Artikel Baru Muncul

1️⃣ Tulis artikel di `main`

```bash
git checkout main
git add content/blog/xxx.mdx
git commit -m "content: new article"
git push
```

2️⃣ Deploy aman ke GitHub Pages
✔ Pembaca tidak terganggu
✔ SEO berjalan normal

---

### 🔁 WAJIB: Sinkronisasi ke `migrate/vercel`

Setelah itu:

```bash
git checkout migrate/vercel
git merge main
```

Checklist:

- [ ] Tidak ada conflict
- [ ] Build Vercel tetap hijau
- [ ] Konten terbaru ikut terbawa

📌 **Ini langkah KRITIS yang sering terlewat.**

---

## 5️⃣ Selama Migrasi (RULES OF ENGAGEMENT)

### ✅ BOLEH

- Menambah artikel baru di `main`
- Bugfix kecil di konten
- Deploy ke GitHub Pages

### ❌ TIDAK BOLEH

- Mengubah struktur URL di `main`
- Mengubah metadata global
- Menambah fitur baru
- Refactor folder besar

---

## 6️⃣ Saat Migrasi SELESAI

### 🟢 Kondisi Ideal Sebelum Final Merge

Checklist:

- `migrate/vercel` sudah:

  - Selalu merge dari `main`
  - Konten **100% sinkron**
  - Build Vercel stabil

---

### 🔀 Final Merge (AMAN)

```bash
git checkout main
git merge migrate/vercel
git push
```

➡️ Hasil:

- Semua artikel terbaru **tetap ada**
- Infrastruktur Vercel aktif
- Tidak ada lost content
- Tidak ada conflict

---

## 7️⃣ Kapan POTENSI ISU Masih Bisa Muncul?

| Risiko           | Mitigasi                      |
| ---------------- | ----------------------------- |
| Konflik MDX      | Disiplin merge main → migrate |
| Asset path rusak | Jangan ubah path di main      |
| SEO fluktuasi    | Freeze URL & slug             |
| Deployment ganda | Tegas: satu prod aktif        |

---

## 8️⃣ Kesimpulan Tegas (Jawaban Akhir)

> **YA, skema Anda BENAR.**
> Dengan satu syarat mutlak:
>
> 🔑 **Setiap ada konten baru di `main`, WAJIB di-merge ke `migrate/vercel`.**

Jika ini dijalankan:

- ❌ Tidak ada lost article
- ❌ Tidak ada conflict besar
- ❌ Tidak ada SEO shock
- ✅ Migrasi mulus

---

## 9️⃣ Rekomendasi Tambahan (Opsional tapi Profesional)

Tambahkan aturan internal:

```text
RULE:
- Content → main
- Infra → migrate/vercel
- main → migrate (sync rutin)
- migrate → main (sekali, final)
```
