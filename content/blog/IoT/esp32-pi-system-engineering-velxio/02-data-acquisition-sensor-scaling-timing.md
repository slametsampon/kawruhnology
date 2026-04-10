---
title: Data Acquisition yang Benar - Sensor → drv* → svc* (Engineering Data Integrity)
date: '2026-04-08'
tags:
  [
    'esp32',
    'data-acquisition',
    'adc-filtering',
    'sampling-strategy',
    'embedded-system',
    'iot-industrial',
    'velxio-validation',
  ]
draft: false
summary: Artikel ini menunjukkan bahwa kualitas data merupakan fondasi utama dalam sistem embedded. Melalui eksperimen di Velxio, terbukti bahwa penggunaan data mentah dari ADC tanpa filtering, scaling, dan kontrol sampling menghasilkan sistem yang tidak stabil dan tidak dapat dipercaya. Dengan menerapkan data pipeline yang benar (raw → filtering → scaling → decision), serta memisahkan tanggung jawab melalui layering (`drv_`, `svc_`, `app_`), sistem menjadi lebih stabil, konsisten, dan dapat dianalisis. Artikel ini menegaskan bahwa banyak kegagalan control system bukan berasal dari logic, tetapi dari data yang tidak valid, sehingga data acquisition harus diperlakukan sebagai bagian kritikal dalam desain sistem.
---

# 📄 **_ARTIKEL 2: Data Acquisition yang Benar: Sensor → drv_ → svc* (Engineering Data Integrity)***

---

- [📄 \*_*ARTIKEL 2: Data Acquisition yang Benar: Sensor → drv* → svc_ (Engineering Data Integrity)\*\*\*](#-artikel-2-data-acquisition-yang-benar-sensor--drv--svc-engineering-data-integrity)
- [🧠 1. Opening — Masalah yang Sering Diremehkan](#-1-opening--masalah-yang-sering-diremehkan)
  - [🔬 Setup Velxio (LANJUT DARI ARTIKEL 1)](#-setup-velxio-lanjut-dari-artikel-1)
  - [❗ Eksperimen awal (WAJIB)](#-eksperimen-awal-wajib)
  - [🔍 Observasi di Velxio](#-observasi-di-velxio)
  - [❗ Problem nyata](#-problem-nyata)
  - [Reality di lapangan (terbukti dari eksperimen)](#reality-di-lapangan-terbukti-dari-eksperimen)
  - [Dampak](#dampak)
  - [Statement:](#statement)
- [🏭 2. System Context — Data di Dunia Industri](#-2-system-context--data-di-dunia-industri)
  - [Model industri:](#model-industri)
  - [Apa yang sering tidak disadari:](#apa-yang-sering-tidak-disadari)
  - [Ada proses:](#ada-proses)
  - [Mapping ke sistem kita:](#mapping-ke-sistem-kita)
  - [Validasi di Velxio](#validasi-di-velxio)
  - [Insight:](#insight)
- [⚠️ 3. Core Problem — Kesalahan Umum Data Acquisition](#️-3-core-problem--kesalahan-umum-data-acquisition)
  - [❌ Problem 1 — Raw Data dianggap “benar”](#-problem-1--raw-data-dianggap-benar)
  - [❌ Problem 2 — Tidak ada scaling](#-problem-2--tidak-ada-scaling)
  - [❌ Problem 3 — Noise diabaikan](#-problem-3--noise-diabaikan)
  - [❌ Problem 4 — Sampling tidak terkontrol](#-problem-4--sampling-tidak-terkontrol)
  - [❗ Dampak sistem (terbukti)](#-dampak-sistem-terbukti)
- [⚙️ 4. Engineering Model — Data Pipeline yang Benar](#️-4-engineering-model--data-pipeline-yang-benar)
  - [Reframe:](#reframe)
  - [Problem (terbukti di Response 1)](#problem-terbukti-di-response-1)
  - [Model ini harus diuji, bukan dipercaya](#model-ini-harus-diuji-bukan-dipercaya)
  - [🔬 Implementasi tahap demi tahap (Velxio)](#-implementasi-tahap-demi-tahap-velxio)
  - [Insight:](#insight-1)
- [🔧 5. Design — Implementasi Layered (OOP)](#-5-design--implementasi-layered-oop)
  - [`drv_` — hanya baca raw](#drv_--hanya-baca-raw)
  - [`svc_` — interpretasi data](#svc_--interpretasi-data)
  - [Integrasi di app\_](#integrasi-di-app_)
  - [🔬 Validasi di Velxio](#-validasi-di-velxio)
  - [❗ Rule (dibuktikan)](#-rule-dibuktikan)
  - [Insight:](#insight-2)
- [🔄 6. Runtime Behavior — Sampling Strategy](#-6-runtime-behavior--sampling-strategy)
  - [❌ Salah:](#-salah)
  - [🔬 Validasi](#-validasi)
  - [✅ Benar (non-blocking):](#-benar-non-blocking)
  - [🔬 Validasi di Velxio](#-validasi-di-velxio-1)
  - [Insight:](#insight-3)
  - [Konsep:](#konsep)
  - [Insight operasional:](#insight-operasional)
- [🧪 7. Filtering — Menghadapi Noise](#-7-filtering--menghadapi-noise)
  - [Problem:](#problem)
  - [🔬 Validasi awal (WAJIB DI VELXIO)](#-validasi-awal-wajib-di-velxio)
  - [Solusi sederhana:](#solusi-sederhana)
  - [Implementasi di svc\_](#implementasi-di-svc_)
  - [🔬 Validasi di Velxio](#-validasi-di-velxio-2)
  - [Insight (terbukti):](#insight-terbukti)
  - [⚠️ Trade-off (WAJIB DIPAHAMI)](#️-trade-off-wajib-dipahami)
  - [Insight:](#insight-4)
- [⚠️ 8. Failure Scenario — Data yang Salah = System Failure](#️-8-failure-scenario--data-yang-salah--system-failure)
  - [Case 1 — Sensor noise → control hunting](#case-1--sensor-noise--control-hunting)
  - [Case 2 — Scaling salah](#case-2--scaling-salah)
  - [Case 3 — Sampling tidak konsisten](#case-3--sampling-tidak-konsisten)
- [🧠 9. Engineering Insight (Yang Sering Terjadi)](#-9-engineering-insight-yang-sering-terjadi)
  - [Insight 1 — Engineer salah fokus (terbukti dari eksperimen)](#insight-1--engineer-salah-fokus-terbukti-dari-eksperimen)
  - [Reaksi umum:](#reaksi-umum)
  - [Kesimpulan:](#kesimpulan)
  - [Insight 2 — “angka berubah” ≠ “proses berubah”](#insight-2--angka-berubah--proses-berubah)
  - [Implikasi:](#implikasi)
  - [Insight 3 — Data acquisition adalah fondasi](#insight-3--data-acquisition-adalah-fondasi)
  - [Kesimpulan:](#kesimpulan-1)
  - [Implikasi engineering:](#implikasi-engineering)
- [🔍 10. Mini Flow (Menguatkan Model)](#-10-mini-flow-menguatkan-model)
  - [Validasi terhadap eksperimen](#validasi-terhadap-eksperimen)
  - [Insight:](#insight-5)
  - [Implikasi:](#implikasi-1)
  - [Validasi flow (WAJIB)](#validasi-flow-wajib)
- [🔚 11. Closing — Transisi ke Control System](#-11-closing--transisi-ke-control-system)
  - [Final conclusion Artikel 2](#final-conclusion-artikel-2)

---

# 🧠 1. Opening — Masalah yang Sering Diremehkan

## 🔬 Setup Velxio (LANJUT DARI ARTIKEL 1)

- ESP32 DevKit v1
- Potentiometer → **GPIO34**
- LED → **GPIO2**

---

## ❗ Eksperimen awal (WAJIB)

Gunakan code sederhana:

```cpp
const int PIN_SENSOR = 34;
const int PIN_LED = 2;

void setup() {
    pinMode(PIN_LED, OUTPUT);
}

void loop() {
    int val = analogRead(PIN_SENSOR);

    if (val > 2000) {
        digitalWrite(PIN_LED, HIGH);
    } else {
        digitalWrite(PIN_LED, LOW);
    }
}
```

---

## 🔍 Observasi di Velxio

Putar potentiometer perlahan di sekitar threshold (~2000):

➡️ LED akan:

- berkedip cepat
- ON/OFF tidak stabil
- terlihat “random”

---

## ❗ Problem nyata

Walaupun:

- tidak ada delay
- struktur sudah benar

---

➡️ sistem tetap:

> ❌ tidak stabil
> ❌ tidak bisa dipercaya

---

## Reality di lapangan (terbukti dari eksperimen)

- sensor noise
- nilai ADC fluktuatif
- perubahan kecil dianggap signifikan

---

## Dampak

- control salah
- interlock gagal
- sistem terlihat tidak deterministic

---

## Statement:

> **System tidak pernah lebih baik dari kualitas datanya**

---

# 🏭 2. System Context — Data di Dunia Industri

## Model industri:

```text
Sensor → Transmitter → PLC → Control Logic
```

---

## Apa yang sering tidak disadari:

Sensor **tidak langsung masuk ke control**.

---

## Ada proses:

- signal conditioning
- scaling
- filtering

---

## Mapping ke sistem kita:

```text
Sensor → drv_ → svc_ → decision
```

---

## Validasi di Velxio

Eksperimen sebelumnya menunjukkan:

- `analogRead()` langsung → tidak stabil

---

➡️ Artinya:

- `drv_` hanya memberi **raw data**
- raw data **belum layak dipakai**

---

## Insight:

- `drv_` = interface fisik
- `svc_` = interpretasi

---

> angka ADC ≠ nilai engineering

---

# ⚠️ 3. Core Problem — Kesalahan Umum Data Acquisition

---

## ❌ Problem 1 — Raw Data dianggap “benar”

```cpp
int value = analogRead(PIN_SENSOR);
```

➡️ langsung dipakai

---

✔ 🔬 Validasi

- putar potentiometer sedikit
  ➡️ nilai berubah drastis

---

➡️ LED langsung berubah

---

✔ Root cause:

- ADC sensitif terhadap noise

---

## ❌ Problem 2 — Tidak ada scaling

ADC ESP32:

```text
0 – 4095 (12-bit)
```

---

Namun:

- tidak ada arti fisik langsung

---

✔ 🔬 Validasi

- val = 2000 → apa artinya?
  ➡️ tidak jelas

---

➡️ tidak bisa:

- dibandingkan
- dikalibrasi

---

## ❌ Problem 3 — Noise diabaikan

---

✔ 🔬 Validasi

Tahan potentiometer di satu posisi:

➡️ nilai ADC tetap berubah:

- 1980
- 2010
- 1995
- 2025

---

➡️ LED:

- flicker
- tidak stabil

---

✔ Root cause:

- noise ADC
- variasi tegangan kecil

---

## ❌ Problem 4 — Sampling tidak terkontrol

---

Kode:

```cpp
void loop() {
    analogRead(...);
}
```

---

➡️ sampling terjadi:

- secepat CPU
- tidak konsisten

---

✔ 🔬 Validasi

Tambahkan print:

```cpp
Serial.println(val);
```

---

➡️ nilai:

- berubah sangat cepat
- tidak terfilter

---

## ❗ Dampak sistem (terbukti)

| Problem            | Dampak              |
| ------------------ | ------------------- |
| raw langsung pakai | unstable            |
| no scaling         | tidak meaningful    |
| no filtering       | noise masuk control |
| no sampling        | tidak deterministic |

---

# ⚙️ 4. Engineering Model — Data Pipeline yang Benar

## Reframe:

```text id="p0t3k9"
Raw Signal → Conditioning → Engineering Value → Decision Input
```

---

## Problem (terbukti di Response 1)

- raw ADC langsung dipakai
  ➡️ output tidak stabil

---

## Model ini harus diuji, bukan dipercaya

---

## 🔬 Implementasi tahap demi tahap (Velxio)

---

✔ Step 1 — Raw Signal (baseline)

```cpp id="b2q7cs"
int raw = analogRead(34);
```

---

➡️ observasi:

- nilai fluktuatif
- tidak stabil

---

✔ Step 2 — Conditioning (minimal filtering)

```cpp id="l1r4xw"
int filtered = (raw + prev) / 2;
prev = filtered;
```

---

➡️ observasi:

- fluktuasi berkurang
- LED lebih stabil

---

✔ Step 3 — Engineering Value (scaling sederhana)

```cpp id="k7s8z1"
float percent = (filtered / 4095.0) * 100.0;
```

---

➡️ observasi:

- nilai sekarang:

  - meaningful
  - bisa dibandingkan

---

✔ Step 4 — Decision Input

```cpp id="d0y7np"
bool on = percent > 50.0;
```

---

➡️ observasi:

- threshold menjadi jelas
- behaviour konsisten

---

## Insight:

> tanpa pipeline ini:

- control menerima data mentah
- hasil tidak bisa dipercaya

---

# 🔧 5. Design — Implementasi Layered (OOP)

Sekarang pipeline dimasukkan ke struktur sistem.

---

## `drv_` — hanya baca raw

```cpp id="x9t2lm"
class AnalogSensor {
public:
    int readRaw() {
        return analogRead(34);
    }
};
```

---

## `svc_` — interpretasi data

```cpp id="q1n8ra"
class LevelService {
private:
    int prev = 0;

public:
    float toEngineeringUnit(int raw) {
        return (raw / 4095.0) * 100.0;
    }

    float filter(int raw) {
        int filtered = (raw + prev) / 2;
        prev = filtered;
        return filtered;
    }
};
```

---

## Integrasi di app\_

```cpp id="m6f3pa"
class App {
private:
    AnalogSensor sensor;
    LevelService svc;

public:
    void run() {
        int raw = sensor.readRaw();
        float filtered = svc.filter(raw);
        float percent = svc.toEngineeringUnit(filtered);

        digitalWrite(2, percent > 50);
    }
};
```

---

## 🔬 Validasi di Velxio

Bandingkan:

| Tanpa filtering | Dengan filtering |
| --------------- | ---------------- |
| LED flicker     | stabil           |
| tidak konsisten | predictable      |

---

## ❗ Rule (dibuktikan)

---

✔ ✔ `drv_` tidak tahu unit

- hanya return raw

---

✔ ✔ `svc_` tidak tahu pin

- hanya menerima data

---

## Insight:

> pemisahan ini memungkinkan:

- test logic tanpa hardware
- modifikasi tanpa merusak sistem

---

# 🔄 6. Runtime Behavior — Sampling Strategy

---

## ❌ Salah:

```cpp id="4i3d8z"
void loop() {
    app.run();
}
```

---

➡️ masalah:

- sampling terlalu cepat
- noise masuk langsung

---

## 🔬 Validasi

Tambahkan print:

- nilai berubah sangat cepat
- tidak stabil

---

## ✅ Benar (non-blocking):

```cpp id="z7r2kj"
unsigned long lastSample = 0;
const unsigned long interval = 50;

void loop() {
    unsigned long now = millis();

    if (now - lastSample >= interval) {
        app.run();
        lastSample = now;
    }
}
```

---

## 🔬 Validasi di Velxio

Ubah interval:

| Interval | Behaviour |
| -------- | --------- |
| 5 ms     | noisy     |
| 50 ms    | stabil    |
| 200 ms   | lambat    |

---

## Insight:

- sampling terlalu cepat → noise dominan
- sampling terlalu lambat → kehilangan dinamika

---

## Konsep:

```text id="1gnwsl"
Sampling rate harus sesuai dinamika sistem
```

---

## Insight operasional:

> sampling adalah bagian dari desain control, bukan detail teknis

---

# 🧪 7. Filtering — Menghadapi Noise

---

## Problem:

Dari eksperimen sebelumnya:

- ADC berubah walaupun input tidak berubah
- nilai fluktuatif di sekitar threshold

---

## 🔬 Validasi awal (WAJIB DI VELXIO)

Tambahkan print:

```cpp id="c2x7k1"
Serial.println(analogRead(34));
```

---

➡️ Tahan potentiometer di posisi tetap

---

✔ Observasi:

Nilai tetap berubah:

```text id="1f4r0q"
1980
2015
1990
2022
```

---

➡️ Dampak langsung:

- LED flicker
- decision tidak stabil

---

## Solusi sederhana:

✔ Moving Average

```cpp id="g7m2kp"
value = (value + previous) / 2;
```

---

## Implementasi di svc\_

```cpp id="9l3xmf"
class LevelService {
private:
    int prev = 0;

public:
    int filter(int raw) {
        int filtered = (raw + prev) / 2;
        prev = filtered;
        return filtered;
    }
};
```

---

## 🔬 Validasi di Velxio

Bandingkan:

✔ ❌ Tanpa filtering

- LED berkedip cepat
- output tidak stabil

---

✔ ✅ Dengan filtering

- LED stabil
- perubahan lebih smooth

---

## Insight (terbukti):

Filtering bukan untuk “mempercantik data”, tetapi:

> **menghilangkan noise agar decision valid**

---

## ⚠️ Trade-off (WAJIB DIPAHAMI)

Ubah filter:

```cpp id="o1z9mc"
filtered = (raw + prev) / 2;
```

---

Jika diulang beberapa kali (lebih heavy smoothing):

➡️ observasi:

- stabil ✔
- tetapi respon lambat ❌

---

## Insight:

- filtering ≠ smoothing saja
- harus menjaga:

---

✔ ✔ stability

- tidak terpengaruh noise

---

✔ ✔ responsiveness

- tetap cepat merespon perubahan nyata

---

# ⚠️ 8. Failure Scenario — Data yang Salah = System Failure

Bagian ini adalah **validasi bahwa data error → system error**.

---

## Case 1 — Sensor noise → control hunting

---

✔ 🔬 Setup

Gunakan:

- tanpa filtering
- threshold di 2000

---

✔ Observasi:

- LED ON/OFF cepat
- tidak stabil

---

✔ Root cause:

- noise melewati threshold
- dianggap perubahan nyata

---

✔ Implikasi (real system):

```text id="q6y8wp"
Pump → ON/OFF terus
```

---

➡️ dampak:

- equipment stress
- umur equipment turun

---

## Case 2 — Scaling salah

---

✔ 🔬 Setup

Gunakan scaling salah:

```cpp id="6c8y2t"
float percent = raw / 100.0;
```

---

✔ Observasi:

- nilai tidak representatif
- threshold tidak sesuai

---

✔ Root cause:

- konversi tidak sesuai range ADC

---

✔ Implikasi:

```text id="1xw9zl"
Tank terlihat kosong padahal penuh
```

---

➡️ dampak:

- control salah total

---

## Case 3 — Sampling tidak konsisten

---

✔ 🔬 Setup

Hilangkan kontrol interval:

```cpp id="d4k8rm"
void loop() {
    app.run();
}
```

---

✔ Observasi:

- data berubah sangat cepat
- filtering tidak efektif

---

✔ Root cause:

- sampling rate tidak terkontrol

---

✔ Implikasi:

- control tidak deterministic
- behaviour berubah-ubah

---

# 🧠 9. Engineering Insight (Yang Sering Terjadi)

---

## Insight 1 — Engineer salah fokus (terbukti dari eksperimen)

Dari eksperimen sebelumnya:

- LED flicker
- output tidak stabil

---

## Reaksi umum:

- ubah threshold
- ubah logic
- tambah condition

---

➡️ tetapi hasil tetap tidak stabil

---

✔ Root cause (terbukti):

- masalah ada di:

  - raw data
  - noise
  - sampling

---

## Kesimpulan:

> engineer sering debug control
> ➡️ padahal problem di data

---

## Insight 2 — “angka berubah” ≠ “proses berubah”

---

✔ 🔬 Validasi di Velxio

Tahan potentiometer:

- posisi tetap
- tetapi nilai ADC berubah

---

➡️ observasi:

```text id="b4yq8d"
1995 → 2020 → 1988 → 2010
```

---

➡️ LED ikut berubah

---

✔ Root cause:

- noise elektrik
- resolusi ADC
- fluktuasi kecil

---

## Implikasi:

> perubahan angka tidak selalu berarti perubahan fisik

---

## Insight 3 — Data acquisition adalah fondasi

---

Dari seluruh eksperimen:

- tanpa filtering → unstable
- tanpa scaling → meaningless
- tanpa sampling → chaotic

---

## Kesimpulan:

> semua control logic bergantung pada kualitas data

---

## Implikasi engineering:

Jika data salah:

- control salah
- interlock salah
- sistem gagal

---

➡️ tanpa exception

---

# 🔍 10. Mini Flow (Menguatkan Model)

```text id="e1v7kp"
Sensor
  ↓
drv_ (raw)
  ↓
svc_ (scaling + filtering)
  ↓
clean data
  ↓
control logic
```

---

## Validasi terhadap eksperimen

---

✔ Tanpa svc\_ (langsung raw → control)

- LED flicker
- unstable

---

✔ Dengan svc\_ (filter + scaling)

- LED stabil
- behaviour predictable

---

## Insight:

- `drv_` hanya menyediakan data
- `svc_` membuat data bisa dipakai

---

## Implikasi:

> control logic hanya sebaik data yang diterimanya

---

## Validasi flow (WAJIB)

Engineer harus bisa menjawab:

- dimana noise dihilangkan?
- dimana data diubah menjadi meaningful?
- apakah control menerima clean data?

---

Jika tidak:

> sistem belum valid

---

# 🔚 11. Closing — Transisi ke Control System

Kita sudah membuktikan:

- struktur saja tidak cukup
- runtime saja tidak cukup

---

➡️ data harus:

- bersih
- stabil
- meaningful

---

## Final conclusion Artikel 2

Sistem dengan:

- control yang benar
- tetapi data yang salah

---

➡️ tetap menghasilkan:

> sistem yang salah

---

<small>
  **_Catatan Penyusunan_** Artikel ini disusun sebagai materi edukasi dan
  referensi umum berdasarkan berbagai sumber pustaka, praktik lapangan, serta
  bantuan alat penulisan. Pembaca disarankan untuk melakukan verifikasi lanjutan
  dan penyesuaian sesuai dengan kondisi serta kebutuhan masing-masing sistem.
</small>
