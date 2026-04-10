---
title: ESP32 sebagai Edge System - Dari ‘Coding Device’ ke ‘System Node
date: '2026-04-08'
tags:
  [
    'esp32',
    'embedded-system',
    'system-engineering',
    'non-blocking-runtime',
    'layered-architecture',
    'iot-industrial',
    'velxio-simulation',
  ]
draft: false
summary: Artikel ini menunjukkan bahwa kegagalan sistem ESP32 bukan berasal dari hardware, tetapi dari model desain yang tidak terstruktur. Dengan eksperimen sederhana di Velxio, terlihat bahwa penggunaan `delay`, pencampuran logic dan IO, serta tidak adanya runtime control menyebabkan sistem tidak stabil dan sulit dipahami. Dengan menerapkan model sistem (input–processing–decision–output), layering (`app_`, `svc_`, `drv_`), serta runtime non-blocking, sistem menjadi deterministic, dapat dikontrol, dan mudah divalidasi. Prinsip ini merupakan fondasi untuk membangun sistem embedded yang scalable dan sesuai dengan praktik industri.
---

# 📄 **_ARTIKEL 1: ESP32 sebagai Edge System: Dari ‘Coding Device’ ke ‘System Node_**

_“ESP32 sebagai Edge System: Dari ‘Coding Device’ ke ‘System Node’”_

---

- [📄 **_ARTIKEL 1: ESP32 sebagai Edge System: Dari ‘Coding Device’ ke ‘System Node_**](#-artikel-1-esp32-sebagai-edge-system-dari-coding-device-ke-system-node)
- [🧠 1. Opening — Reality Check (Masalah Nyata)](#-1-opening--reality-check-masalah-nyata)
  - [Problem nyata (langsung ke inti)](#problem-nyata-langsung-ke-inti)
  - [Implementasi umum (yang salah):](#implementasi-umum-yang-salah)
  - [Observasi (WAJIB DILIHAT DI VELXIO)](#observasi-wajib-dilihat-di-velxio)
  - [Problem sebenarnya:](#problem-sebenarnya)
  - [Statement:](#statement)
- [🏭 2. System Context — ESP32 dalam Dunia Industri](#-2-system-context--esp32-dalam-dunia-industri)
  - [Reframe dari hasil eksperimen di atas](#reframe-dari-hasil-eksperimen-di-atas)
  - [Dalam dunia industri:](#dalam-dunia-industri)
  - [Mapping:](#mapping)
  - [Insight dari eksperimen:](#insight-dari-eksperimen)
  - [Implikasi:](#implikasi)
- [⚠️ 3. Core Problem — Kenapa Sistem ESP32 Gagal di Lapangan](#️-3-core-problem--kenapa-sistem-esp32-gagal-di-lapangan)
  - [Problem 1 — No Structure](#problem-1--no-structure)
  - [Dampak yang bisa diukur:](#dampak-yang-bisa-diukur)
  - [Problem 2 — Blocking System](#problem-2--blocking-system)
  - [Validasi di Velxio:](#validasi-di-velxio)
  - [Kesimpulan:](#kesimpulan)
  - [Problem 3 — Logic bercampur dengan IO](#problem-3--logic-bercampur-dengan-io)
  - [Dampak:](#dampak)
  - [Validasi:](#validasi)
  - [Problem 4 — No Runtime Thinking](#problem-4--no-runtime-thinking)
  - [Dampak:](#dampak-1)
  - [Ringkasan Problem (Terbukti dari eksperimen)](#ringkasan-problem-terbukti-dari-eksperimen)
- [🧩 4. Engineering Model — Cara Berpikir yang Benar](#-4-engineering-model--cara-berpikir-yang-benar)
  - [🔷 Reframe:](#-reframe)
  - [Problem (lanjutan dari Response 1)](#problem-lanjutan-dari-response-1)
  - [Model sistem:](#model-sistem)
  - [Implementasi ulang (minimal, masih sederhana)](#implementasi-ulang-minimal-masih-sederhana)
  - [Loop:](#loop)
  - [Validasi di Velxio](#validasi-di-velxio-1)
  - [Insight:](#insight)
  - [Ini harus:](#ini-harus)
  - [Insight:](#insight-1)
- [⚙️ 5. Arsitektur Dasar (Layering)](#️-5-arsitektur-dasar-layering)
  - [Introduksi struktur:](#introduksi-struktur)
  - [Problem sebelumnya:](#problem-sebelumnya)
  - [Implementasi Layering (versi minimal)](#implementasi-layering-versi-minimal)
  - [Validasi di Velxio](#validasi-di-velxio-2)
  - [Insight:](#insight-2)
  - [Insight tambahan (penting):](#insight-tambahan-penting)
- [🔄 6. Runtime Thinking — Loop Bukan Sekadar Loop](#-6-runtime-thinking--loop-bukan-sekadar-loop)
  - [Reframe:](#reframe)
  - [Problem sebelumnya:](#problem-sebelumnya-1)
  - [Model:](#model)
  - [Apa yang berubah?](#apa-yang-berubah)
  - [Tambahkan runtime minimal (non-blocking)](#tambahkan-runtime-minimal-non-blocking)
  - [Validasi di Velxio](#validasi-di-velxio-3)
  - [Insight:](#insight-3)
  - [Implikasi penting:](#implikasi-penting)
- [🧠 7. Konsekuensi Desain (Yang Akan Kita Pegang di Serial)](#-7-konsekuensi-desain-yang-akan-kita-pegang-di-serial)
  - [RULE:](#rule)
  - [WAJIB:](#wajib)
- [🔍 8. Mini Illustration (Tanpa Over-Engineering)](#-8-mini-illustration-tanpa-over-engineering)
  - [Flow:](#flow)
  - [Validasi langsung di Velxio:](#validasi-langsung-di-velxio)
  - [Runtime:](#runtime)
  - [Validasi runtime:](#validasi-runtime)
  - [Engineering Validation Checklist](#engineering-validation-checklist)
- [⚠️ 9. Failure Preview (Teaser untuk Artikel Lanjut)](#️-9-failure-preview-teaser-untuk-artikel-lanjut)
  - [Case 1 — Blocking System (delay)](#case-1--blocking-system-delay)
  - [Case 2 — Logic bercampur dengan IO](#case-2--logic-bercampur-dengan-io)
  - [Case 3 — Tidak ada runtime control](#case-3--tidak-ada-runtime-control)
  - [Case 4 — Chaos di loop](#case-4--chaos-di-loop)
- [🧠 10. Engineering Insight (Poin Kritis)](#-10-engineering-insight-poin-kritis)
  - [Insight 1 — “Berjalan” ≠ “Benar”](#insight-1--berjalan--benar)
  - [Insight 2 — Struktur Mengontrol Kompleksitas](#insight-2--struktur-mengontrol-kompleksitas)
  - [Insight 3 — Runtime adalah Fondasi](#insight-3--runtime-adalah-fondasi)
  - [Insight 4 — Layering = Debugging Tool](#insight-4--layering--debugging-tool)
  - [Insight 5 — Sistem Kecil = Miniatur Sistem Besar](#insight-5--sistem-kecil--miniatur-sistem-besar)
- [🔚 11. Closing — Positioning Serial](#-11-closing--positioning-serial)
  - [Posisi akhir Artikel 1](#posisi-akhir-artikel-1)

---

# 🧠 1. Opening — Reality Check (Masalah Nyata)

## Problem nyata (langsung ke inti)

Gunakan Velxio, buat sistem paling sederhana:

- 1 potentiometer → ADC
- 1 LED → output

---

## Implementasi umum (yang salah):

```cpp
void setup() {
    pinMode(2, OUTPUT);
}

void loop() {
    int val = analogRead(34);

    if (val > 2000) {
        digitalWrite(2, HIGH);
    } else {
        digitalWrite(2, LOW);
    }

    delay(100);
}
```

---

## Observasi (WAJIB DILIHAT DI VELXIO)

- respon LED terasa lambat
- perubahan tidak smooth
- jika input berubah cepat → output tertinggal

---

## Problem sebenarnya:

- sistem berhenti setiap `delay(100)`
- tidak ada kontrol terhadap:

  - kapan data dibaca
  - kapan keputusan dibuat

---

## Statement:

> Sistem terlihat berjalan, tetapi secara engineering **tidak valid**

---

# 🏭 2. System Context — ESP32 dalam Dunia Industri

## Reframe dari hasil eksperimen di atas

Sistem sederhana tadi menunjukkan:

- input → output
- tetapi tanpa kontrol flow

---

## Dalam dunia industri:

```text
Sensor → Controller → Actuator
```

---

## Mapping:

| Device       | Role                  |
| ------------ | --------------------- |
| ESP32        | field / edge          |
| Raspberry Pi | gateway / processing  |
| PLC          | deterministic control |

---

## Insight dari eksperimen:

Pada PLC:

- tidak ada `delay()`
- semua berjalan dalam **scan cycle**

---

## Implikasi:

Jika ESP32 dipakai sebagai edge controller:

> maka harus mengikuti prinsip yang sama:

- deterministic
- tidak blocking
- terstruktur

---

---

# ⚠️ 3. Core Problem — Kenapa Sistem ESP32 Gagal di Lapangan

Kembali ke eksperimen awal.

---

## Problem 1 — No Structure

Semua terjadi di:

```cpp
void loop()
```

---

## Dampak yang bisa diukur:

- tidak bisa dipisahkan:

  - sensor
  - logic
  - output

---

➡️ Engineer tidak bisa menjawab:

- apakah error dari sensor?
- atau dari logic?

---

## Problem 2 — Blocking System

```cpp
delay(100);
```

---

## Validasi di Velxio:

- ubah delay menjadi 500 ms
  ➡️ sistem makin lambat

---

## Kesimpulan:

> delay langsung mempengaruhi behaviour sistem

---

## Problem 3 — Logic bercampur dengan IO

```cpp
if (analogRead(34) > 2000)
```

---

## Dampak:

- tidak bisa test tanpa sensor
- tidak bisa reuse logic

---

## Validasi:

Coba:

- ganti sensor dengan nilai fixed
  ➡️ harus rewrite code

---

## Problem 4 — No Runtime Thinking

Pada contoh:

- tidak jelas:

  - kapan sensor dibaca
  - apakah konsisten
  - apakah urutan tetap

---

## Dampak:

- hasil berubah tergantung kondisi
- tidak deterministic

---

## Ringkasan Problem (Terbukti dari eksperimen)

| Problem      | Dampak nyata di Velxio |
| ------------ | ---------------------- |
| delay        | respon lambat          |
| no structure | sulit debug            |
| logic + IO   | tidak reusable         |
| no runtime   | behaviour tidak stabil |

---

# 🧩 4. Engineering Model — Cara Berpikir yang Benar

## 🔷 Reframe:

> ESP32 = **System Node**, bukan sekadar microcontroller

---

## Problem (lanjutan dari Response 1)

Pada sistem sebelumnya:

- tidak ada pemisahan:

  - input
  - decision
  - output

---

➡️ semua bercampur dalam satu blok eksekusi

---

## Model sistem:

```text id="nx0j3n"
Input → Processing → Decision → Output → Communication
```

---

## Implementasi ulang (minimal, masih sederhana)

Pisahkan fungsi tanpa mengubah behaviour:

```cpp id="r0y3q1"
int readInput() {
    return analogRead(34);
}

bool computeDecision(int val) {
    return val > 2000;
}

void writeOutput(bool on) {
    digitalWrite(2, on);
}
```

---

## Loop:

```cpp id="c3txv1"
void loop() {
    int val = readInput();
    bool on = computeDecision(val);
    writeOutput(on);
}
```

---

## Validasi di Velxio

Bandingkan dengan versi sebelumnya:

- behaviour: ✔ sama
- struktur: ✔ terpisah

---

## Insight:

> model tidak mengubah output
> tetapi membuat sistem bisa dikontrol

---

## Ini harus:

---

✔ deterministic

Validasi:

- input sama → output sama
- tidak tergantung urutan acak

---

✔ non-blocking

Hapus delay:

```cpp id="l1d7j0"
// delay(100); ← tidak digunakan
```

---

Validasi:

- respon LED lebih cepat
- tidak ada lag buatan

---

---

✔ structured

- setiap fungsi punya peran
- tidak overlap

---

---

## Insight:

> ini adalah langkah pertama dari “coding” ke “system modeling”

---

---

# ⚙️ 5. Arsitektur Dasar (Layering)

## Introduksi struktur:

```text id="7ptl8z"
app_  → orchestration + runtime
svc_  → logic
drv_  → IO boundary
sys_  → config
```

---

## Problem sebelumnya:

- fungsi sudah dipisah
- tapi masih belum punya **boundary layer**

---

---

## Implementasi Layering (versi minimal)

---

✔ 🔷 drv\_

```cpp id="3pt7hv"
class AnalogSensor {
public:
    int readRaw() {
        return analogRead(34);
    }
};
```

---

✔ 🔷 svc\_

```cpp id="a1xv3n"
class ThresholdService {
public:
    bool compute(int val) {
        return val > 2000;
    }
};
```

---

✔ 🔷 app\_

```cpp id="c0m5d2"
class App {
private:
    AnalogSensor sensor;
    ThresholdService svc;

public:
    void run() {
        int val = sensor.readRaw();
        bool on = svc.compute(val);
        digitalWrite(2, on);
    }
};
```

---

✔ loop:

```cpp id="z4t8kl"
App app;

void loop() {
    app.run();
}
```

---

## Validasi di Velxio

Bandingkan dengan versi sebelumnya:

| Aspek      | Tanpa Layer | Dengan Layer |
| ---------- | ----------- | ------------ |
| Behaviour  | sama        | sama         |
| Struktur   | tidak jelas | jelas        |
| Modifikasi | sulit       | mudah        |

---

## Insight:

> layering tidak mengubah hasil
> tetapi mengubah **kemampuan sistem untuk berkembang**

---

## Insight tambahan (penting):

> ini analog dengan PLC:

- `drv_` → IO
- `svc_` → Function Block
- `app_` → scan cycle (OB)

---

# 🔄 6. Runtime Thinking — Loop Bukan Sekadar Loop

## Reframe:

```cpp id="h5f0w1"
void loop()
```

---

➡️ bukan tempat menjalankan semua hal secara bebas

➡️ tapi:

> **entry point ke runtime engine**

---

## Problem sebelumnya:

- loop berisi:

  - logic
  - delay
  - IO

➡️ tidak terkontrol

---

## Model:

```cpp id="b4d7q2"
void loop() {
    app.run();
}
```

---

## Apa yang berubah?

- semua eksekusi masuk ke satu titik
- flow menjadi eksplisit

---

## Tambahkan runtime minimal (non-blocking)

```cpp id="8u7j5p"
unsigned long lastRun = 0;
unsigned long interval = 50;

void loop() {
    unsigned long now = millis();

    if (now - lastRun >= interval) {
        app.run();
        lastRun = now;
    }
}
```

---

## Validasi di Velxio

Uji:

- ubah interval:

  - 10 ms → cepat
  - 200 ms → lambat

---

➡️ Behaviour berubah secara **terkontrol**

---

## Insight:

> runtime sekarang bisa dikontrol, bukan kebetulan

---

## Implikasi penting:

Tanpa runtime:

- sistem tidak deterministic

Dengan runtime:

- sistem predictable
- behaviour bisa dianalisis

---

# 🧠 7. Konsekuensi Desain (Yang Akan Kita Pegang di Serial)

Bagian ini adalah **design constraint**.
Bukan guideline.
Jika dilanggar → sistem akan gagal saat complexity naik.

---

## RULE:

---

✔ ❌ tidak ada `delay`

---

**Implikasi teknis:**

- `delay()` menghentikan seluruh loop
- tidak ada concurrency
- semua proses:

  - sensor
  - control
  - komunikasi

→ berhenti total

---

**Validasi di Velxio:**

- set:

```cpp id="n8y8jk"
delay(200);
```

---

➡️ observasi:

- LED respon lambat
- perubahan input tidak langsung tercermin

---

➡️ ubah:

```cpp id="z0r9yq"
// tanpa delay
```

---

➡️ observasi:

- respon langsung
- sistem lebih “hidup”

---

**Kesimpulan operasional:**

> delay = global blocking → tidak boleh digunakan

---

✔ ❌ tidak ada logic di driver (`drv_`)

---

**Rule:**

```text id="y3d91m"
drv_ = IO only
```

---

**Jika dilanggar:**

```cpp id="7c7w0t"
int read() {
    int val = analogRead(34);
    if (val > 2000) return 1;
    return 0;
}
```

---

➡️ masalah:

- driver mengandung decision
- boundary hilang

---

**Validasi:**

- tidak bisa test logic tanpa hardware
- perubahan threshold → harus ubah driver

---

**Kesimpulan:**

> driver harus dumb → hanya read/write

---

✔ ❌ tidak ada IO di service (`svc_`)

---

**Rule:**

```text id="x1r4nb"
svc_ = pure logic
```

---

**Jika dilanggar:**

```cpp id="9k8d3n"
bool compute() {
    int val = analogRead(34);
    return val > 2000;
}
```

---

➡️ masalah:

- service tergantung hardware
- tidak bisa reuse
- tidak bisa unit test

---

**Validasi:**

- tidak bisa inject test value

---

**Kesimpulan:**

> svc\_ harus menerima input, bukan mengambil input

---

✔ ❌ tidak ada chaos di loop

---

**Anti-pattern:**

```cpp id="h2d6mn"
void loop() {
    if (...) { ... }
    if (...) { ... }
}
```

---

➡️ masalah:

- urutan tidak jelas
- tidak deterministic

---

**Validasi:**

- sulit menjelaskan:

  - mana dulu dieksekusi
  - kapan terjadi

---

**Correct pattern:**

```cpp id="u5k2az"
void loop() {
    app.run();
}
```

---

## WAJIB:

---

✔ OOP

---

**Tujuan operasional:**

- memisahkan:

  - sensor
  - logic
  - orchestration

---

**Validasi:**

- bisa mengganti sensor tanpa ubah logic
- bisa test logic tanpa hardware

---

✔ layering

---

```text id="h4xk2l"
app_ → svc_ → drv_
```

---

**Validasi:**

- arah dependency jelas
- tidak ada crossing

---

✔ non-blocking

---

**Implementasi minimal:**

```cpp id="u0d9rt"
if (now - last >= interval)
```

---

**Validasi:**

- semua proses tetap berjalan
- tidak ada starvation

---

# 🔍 8. Mini Illustration (Tanpa Over-Engineering)

Bagian ini adalah **uji validitas model**, bukan ilustrasi visual.

---

## Flow:

```text id="b9w3pf"
Sensor → drv_ → svc_ → decision → drv_ → actuator
```

---

## Validasi langsung di Velxio:

✔ Step 1 — Sensor

- ubah potentiometer
- cek:

  - apakah nilai berubah di `drv_`

---

✔ Step 2 — Service

- ubah threshold di `svc_`

```cpp id="f8y1t3"
return val > 2500;
```

---

➡️ observasi:

- behaviour berubah tanpa ubah driver

---

✔ Step 3 — Actuator

- LED hanya berubah jika:

  - svc\_ output berubah

---

## Runtime:

```text id="o3r9ld"
loop → app.run → orchestrate system
```

---

## Validasi runtime:

✔ Ubah interval:

```cpp id="z2k8w1"
interval = 20;
interval = 200;
```

---

➡️ observasi:

- sistem tetap stabil
- hanya respon yang berubah

---

## Engineering Validation Checklist

Sistem VALID jika:

- tidak ada `delay`
- `drv_` hanya read/write
- `svc_` tidak akses hardware
- `loop` hanya memanggil `app.run()`
- flow bisa dijelaskan

---

Jika salah satu gagal:

> sistem belum memenuhi standar engineering

---

# ⚠️ 9. Failure Preview (Teaser untuk Artikel Lanjut)

Bagian ini bukan teori — ini **failure yang bisa direproduksi langsung**.

---

## Case 1 — Blocking System (delay)

✔ Setup:

Tambahkan kembali:

```cpp
delay(200);
```

---

✔ Observasi di Velxio:

- perubahan potentiometer tidak langsung mempengaruhi LED
- sistem terasa “lagging”

---

✔ Root cause:

- loop berhenti selama delay
- tidak ada update selama periode tersebut

---

✔ Implikasi:

- control menggunakan data lama
- sistem tidak real-time

---

## Case 2 — Logic bercampur dengan IO

✔ Setup:

```cpp
bool compute() {
    return analogRead(34) > 2000;
}
```

---

✔ Observasi:

- logic tidak bisa diuji tanpa sensor
- perubahan hardware → merusak logic

---

✔ Root cause:

- boundary `svc_` dan `drv_` dilanggar

---

✔ Implikasi:

- sistem tidak modular
- debugging menjadi sulit

---

## Case 3 — Tidak ada runtime control

✔ Setup:

hapus interval control:

```cpp
app.run();
```

---

✔ Observasi:

- eksekusi terlalu cepat
- noise langsung mempengaruhi output

---

✔ Root cause:

- tidak ada kontrol frekuensi eksekusi

---

✔ Implikasi:

- sistem tidak stabil
- sulit dikontrol

---

## Case 4 — Chaos di loop

✔ Setup:

```cpp
void loop() {
    if (analogRead(34) > 2000)
        digitalWrite(2, HIGH);

    if (millis() % 2 == 0)
        digitalWrite(2, LOW);
}
```

---

✔ Observasi:

- LED tidak konsisten
- behaviour sulit dijelaskan

---

✔ Root cause:

- tidak ada flow deterministik

---

✔ Implikasi:

- sistem tidak bisa diprediksi

---

# 🧠 10. Engineering Insight (Poin Kritis)

---

## Insight 1 — “Berjalan” ≠ “Benar”

Sistem bisa:

- menyala
- merespon

---

Tetapi jika:

- tidak deterministic
- tidak bisa dijelaskan

---

➡️ maka:

> sistem tersebut tidak valid secara engineering

---

## Insight 2 — Struktur Mengontrol Kompleksitas

Semua constraint sebelumnya:

- bukan untuk “rapi”
- tetapi untuk:

> mengontrol kompleksitas saat sistem berkembang

---

## Insight 3 — Runtime adalah Fondasi

Tanpa runtime control:

- sistem berjalan berdasarkan:

  - kecepatan CPU
  - kondisi acak

---

Dengan runtime:

- sistem:

  - predictable
  - measurable

---

## Insight 4 — Layering = Debugging Tool

Jika struktur benar:

```text id="l3b5cs"
drv_ → svc_ → app_
```

---

Debugging menjadi:

- cek data (`drv_`)
- cek logic (`svc_`)
- cek flow (`app_`)

---

➡️ bukan trial-error

---

## Insight 5 — Sistem Kecil = Miniatur Sistem Besar

Kasus sederhana:

- 1 sensor
- 1 LED

---

Tetapi prinsipnya sama dengan:

- pump system
- reactor control
- plant monitoring

---

➡️ jika salah di sini:

> akan lebih buruk di sistem besar

---

# 🔚 11. Closing — Positioning Serial

Serial ini tidak bertujuan mengajarkan:

- cara membaca sensor
- cara menyalakan LED

---

Tetapi:

> **cara membangun sistem yang bisa dijelaskan, dikontrol, dan divalidasi**

---

## Posisi akhir Artikel 1

Setelah artikel ini, engineer harus mampu:

- menjelaskan flow sistem
- mengidentifikasi boundary layer
- memahami runtime sebagai scan cycle
- membedakan sistem valid vs tidak valid

---

<small>
  **_Catatan Penyusunan_** Artikel ini disusun sebagai materi edukasi dan
  referensi umum berdasarkan berbagai sumber pustaka, praktik lapangan, serta
  bantuan alat penulisan. Pembaca disarankan untuk melakukan verifikasi lanjutan
  dan penyesuaian sesuai dengan kondisi serta kebutuhan masing-masing sistem.
</small>
