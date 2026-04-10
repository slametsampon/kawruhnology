---
title: Control Logic sebagai Decision Engine - Interlock & Hysteresis dalam svc\_
date: '2026-04-08'
tags:
  [
    'esp32',
    'control-system',
    'state-machine',
    'hysteresis-control',
    'interlock-safety',
    'deterministic-flow',
    'embedded-engineering',
    'velxio-simulation',
  ]
draft: false
summary: Artikel ini menunjukkan bahwa stabilitas sistem control tidak ditentukan oleh sensor atau hardware, tetapi oleh model decision yang digunakan. Melalui eksperimen di Velxio, terbukti bahwa penggunaan threshold sederhana tanpa state menyebabkan oscillation (hunting). Dengan pendekatan state-based, hysteresis, dan interlock dalam `svc_`, sistem menjadi stabil, deterministic, dan aman. Selain itu, urutan eksekusi (read → compute → actuate) harus dijaga untuk memastikan konsistensi behaviour. Artikel ini menegaskan bahwa control logic harus dirancang sebagai decision system yang memiliki memori, aturan transisi, dan validasi kondisi, bukan sekadar IF statement reaktif.
---

# 📄 **\_ARTIKEL 3: Control Logic sebagai Decision Engine: Interlock & Hysteresis dalam svc\_\_**

---

- [📄 **\_ARTIKEL 3: Control Logic sebagai Decision Engine: Interlock \& Hysteresis dalam svc\_\_**](#-_artikel-3-control-logic-sebagai-decision-engine-interlock--hysteresis-dalam-svc__)
- [🧠 1. Opening — Masalah Nyata di Lapangan](#-1-opening--masalah-nyata-di-lapangan)
  - [🔬 Setup Velxio (LANJUT DARI ARTIKEL 2)](#-setup-velxio-lanjut-dari-artikel-2)
  - [❗ Implementasi awal (yang terlihat benar)](#-implementasi-awal-yang-terlihat-benar)
  - [Integrasi:](#integrasi)
  - [🔍 Observasi di Velxio](#-observasi-di-velxio)
  - [❗ Problem nyata](#-problem-nyata)
  - [Reality (mapping ke dunia nyata)](#reality-mapping-ke-dunia-nyata)
  - [Root issue:](#root-issue)
  - [Statement:](#statement)
- [🏭 2. System Context — Control dalam Dunia Industri](#-2-system-context--control-dalam-dunia-industri)
  - [Model umum:](#model-umum)
  - [Yang sering disalahpahami:](#yang-sering-disalahpahami)
  - [Mapping ke sistem kita:](#mapping-ke-sistem-kita)
  - [Validasi dari eksperimen:](#validasi-dari-eksperimen)
  - [Insight:](#insight)
  - [Implikasi:](#implikasi)
- [⚠️ 3. Core Problem — Control Logic yang “Kelihatannya Benar”](#️-3-core-problem--control-logic-yang-kelihatannya-benar)
  - [❌ Problem 1 — Threshold naïve](#-problem-1--threshold-naïve)
  - [❌ Problem 2 — Tidak ada state](#-problem-2--tidak-ada-state)
  - [❌ Problem 3 — Logic bercampur dengan IO](#-problem-3--logic-bercampur-dengan-io)
  - [❌ Problem 4 — Tidak deterministic](#-problem-4--tidak-deterministic)
  - [❗ Dampak sistem (terbukti)](#-dampak-sistem-terbukti)
- [🧩 4. Engineering Model — Control sebagai Decision System](#-4-engineering-model--control-sebagai-decision-system)
  - [Reframe:](#reframe)
  - [🔬 Validasi dari eksperimen sebelumnya (Bab 1–3)](#-validasi-dari-eksperimen-sebelumnya-bab-13)
  - [Root cause (dibuktikan):](#root-cause-dibuktikan)
  - [Model dasar:](#model-dasar)
  - [🔬 Implementasi minimal state (VALIDASI)](#-implementasi-minimal-state-validasi)
  - [🔍 Observasi di Velxio](#-observasi-di-velxio-1)
  - [Insight:](#insight-1)
- [⚙️ 5. Design — svc\_ sebagai Decision Engine (OOP)](#️-5-design--svc_-sebagai-decision-engine-oop)
  - [Struktur:](#struktur)
  - [Implementasi lengkap:](#implementasi-lengkap)
  - [🔬 Validasi di Velxio](#-validasi-di-velxio)
  - [Insight:](#insight-2)
  - [Validasi tambahan (WAJIB)](#validasi-tambahan-wajib)
- [🔄 6. Deterministic Flow — “Mini PLC Cycle”](#-6-deterministic-flow--mini-plc-cycle)
  - [Model:](#model)
  - [Dalam sistem:](#dalam-sistem)
  - [🔬 Validasi di Velxio](#-validasi-di-velxio-1)
  - [Root cause:](#root-cause)
  - [Insight:](#insight-3)
  - [Implikasi engineering:](#implikasi-engineering)
- [🔁 7. Hysteresis — Solusi Fundamental Stability (UPGRADE)](#-7-hysteresis--solusi-fundamental-stability-upgrade)
  - [Problem:](#problem)
  - [sys\_ — konfigurasi (DITAMBAHKAN)](#sys_--konfigurasi-ditambahkan)
  - [svc\_ — decision engine (state + hysteresis)](#svc_--decision-engine-state--hysteresis)
  - [app\_ — runtime orchestration (DITAMBAHKAN)](#app_--runtime-orchestration-ditambahkan)
  - [🔬 Validasi (Velxio)](#-validasi-velxio)
  - [Insight (UPGRADE):](#insight-upgrade)
- [🛑 8. Interlock — Layer Safety dalam Logic (UPGRADE)](#-8-interlock--layer-safety-dalam-logic-upgrade)
  - [sys\_ — definisi kondisi](#sys_--definisi-kondisi)
  - [svc\_ — decision + safety](#svc_--decision--safety)
  - [app\_ — orchestration + runtime context](#app_--orchestration--runtime-context)
  - [🔬 Validasi](#-validasi)
  - [Insight (UPGRADE):](#insight-upgrade-1)
- [⚠️ 9. Failure Scenario — Control yang Salah](#️-9-failure-scenario--control-yang-salah)
  - [Case 1 — No hysteresis](#case-1--no-hysteresis)
  - [Case 2 — No interlock](#case-2--no-interlock)
  - [Case 3 — Non-deterministic flow](#case-3--non-deterministic-flow)
- [🧠 10. Engineering Insight (Poin Kritis)](#-10-engineering-insight-poin-kritis)
  - [Insight 1 — Control harus deterministic](#insight-1--control-harus-deterministic)
  - [Insight 2 — Control harus state-based](#insight-2--control-harus-state-based)
  - [Insight 3 — Control harus stabil](#insight-3--control-harus-stabil)
  - [Insight 4 — “berjalan” ≠ “benar”](#insight-4--berjalan--benar)
  - [Insight 5 — Root problem ada di decision model](#insight-5--root-problem-ada-di-decision-model)
- [🔍 11. Mini Flow (Menguatkan Model)](#-11-mini-flow-menguatkan-model)
  - [🔬 Validasi terhadap eksperimen](#-validasi-terhadap-eksperimen)
  - [Insight](#insight-4)
  - [Validasi (WAJIB)](#validasi-wajib)
- [🔚 12. Closing — Transisi ke System Integration](#-12-closing--transisi-ke-system-integration)
  - [Problem berikutnya:](#problem-berikutnya)

---

# 🧠 1. Opening — Masalah Nyata di Lapangan

---

## 🔬 Setup Velxio (LANJUT DARI ARTIKEL 2)

- ESP32 DevKit v1
- Potentiometer → **GPIO34**
- LED → **GPIO2**

Gunakan pipeline dari Artikel 2:

- ✔ filtering
- ✔ scaling (%)

---

## ❗ Implementasi awal (yang terlihat benar)

```cpp id="c3p1x9"
bool compute(float percent) {
    return percent < 50.0;
}
```

---

## Integrasi:

```cpp id="b6m2rt"
digitalWrite(2, compute(percent));
```

---

## 🔍 Observasi di Velxio

Putar potentiometer di sekitar 50%:

➡️ LED akan:

- ON
- OFF
- ON
- OFF

---

➡️ sangat cepat (flicker)

---

## ❗ Problem nyata

Walaupun:

- data sudah di-filter
- sampling sudah benar

---

➡️ sistem tetap:

> ❌ tidak stabil
> ❌ tidak bisa digunakan

---

## Reality (mapping ke dunia nyata)

Fenomena ini setara dengan:

- pump ON/OFF terus (hunting)
- valve buka-tutup cepat
- alarm muncul hilang

---

## Root issue:

> ❗ **control logic tidak stabil, bukan hardware yang salah**

---

## Statement:

> Control system gagal bukan karena sensor, tapi karena **decision model yang salah**

---

# 🏭 2. System Context — Control dalam Dunia Industri

---

## Model umum:

```text id="u1k3qm"
Measurement → Control Logic → Actuator
```

---

## Yang sering disalahpahami:

- engineer fokus ke:

  - sensor
  - hardware

---

➡️ padahal:

> behaviour sistem ditentukan oleh **control logic**

---

## Mapping ke sistem kita:

```text id="n9d4zk"
drv_ → svc_ → drv_
```

---

## Validasi dari eksperimen:

- `drv_` sudah benar (data stabil)
- masalah muncul di:

➡️ `svc_`

---

## Insight:

- `svc_` = **PLC Function Block**
- semua decision terjadi di sini

---

---

## Implikasi:

Jika `svc_` salah:

- seluruh sistem salah
- walaupun sensor benar

---

# ⚠️ 3. Core Problem — Control Logic yang “Kelihatannya Benar”

---

## ❌ Problem 1 — Threshold naïve

```cpp id="p9c2vy"
if (level < 50) pumpOn();
else pumpOff();
```

---

✔ 🔬 Validasi di Velxio

- set threshold = 50%
- putar input di sekitar titik tersebut

---

➡️ observasi:

- output flip terus
- tidak stabil

---

✔ Root cause:

- tidak ada tolerance
- perubahan kecil dianggap perubahan nyata

---

✔ Dampak:

- oscillation
- hunting

---

## ❌ Problem 2 — Tidak ada state

---

✔ Implementasi saat ini:

- setiap loop:

  - decision dihitung ulang

---

➡️ tidak ada memori:

- sistem tidak tahu:

  - sebelumnya ON atau OFF

---

✔ 🔬 Validasi

Tambahkan log:

```cpp id="y4q9tp"
Serial.println(digitalRead(2));
```

---

➡️ output berubah terus
➡️ tidak mempertahankan kondisi

---

✔ Root cause:

- sistem stateless

---

## ❌ Problem 3 — Logic bercampur dengan IO

---

✔ Contoh:

```cpp id="8u2r6n"
if (analogRead(34) < 2000)
    digitalWrite(2, HIGH);
```

---

✔ Dampak:

- tidak bisa diuji tanpa hardware
- sulit dimodifikasi

---

## ❌ Problem 4 — Tidak deterministic

---

✔ Setup:

- sampling cepat
- threshold langsung

---

✔ Observasi:

- behaviour berubah tergantung:

  - noise
  - timing

---

---

✔ Root cause:

- flow tidak terkontrol

---

## ❗ Dampak sistem (terbukti)

| Problem          | Dampak nyata   |
| ---------------- | -------------- |
| threshold naïve  | hunting        |
| no state         | unstable       |
| logic + IO       | tidak reusable |
| no deterministic | unpredictable  |

---

# 🧩 4. Engineering Model — Control sebagai Decision System

---

## Reframe:

> Control bukan IF statement
> tapi **state-based decision system**

---

## 🔬 Validasi dari eksperimen sebelumnya (Bab 1–3)

Implementasi naïve:

```cpp id="b2h9k1"
bool compute(float percent) {
    return percent < 50.0;
}
```

---

✔ Observasi di Velxio:

- LED flicker di sekitar threshold
- output berubah terus

---

➡️ walaupun:

- data sudah stabil
- sampling sudah benar

---

## Root cause (dibuktikan):

- keputusan hanya berbasis:

  - kondisi saat ini

---

➡️ tidak mempertimbangkan:

- kondisi sebelumnya

---

## Model dasar:

```text id="r8k2dp"
Input → State → Decision → Output
```

---

## 🔬 Implementasi minimal state (VALIDASI)

```cpp id="c9d4ls"
enum class PumpState {
    OFF,
    ON
};

PumpState state = PumpState::OFF;

bool compute(float percent) {
    if (state == PumpState::OFF && percent < 50.0) {
        state = PumpState::ON;
    }
    else if (state == PumpState::ON && percent > 50.0) {
        state = PumpState::OFF;
    }

    return state == PumpState::ON;
}
```

---

## 🔍 Observasi di Velxio

- LED tidak flicker lagi
- output lebih stabil

---

---

## Insight:

- sistem harus:

  - punya memori
  - punya state
  - punya aturan transisi

---

➡️ tanpa state:

- sistem hanya reaktif
  ➡️ dengan state:
- sistem menjadi stabil

---

# ⚙️ 5. Design — svc\_ sebagai Decision Engine (OOP)

---

## Struktur:

```cpp id="a3f8kp"
class PumpController {
public:
    bool compute(float level);
};
```

---

## Implementasi lengkap:

```cpp id="m7d2qz"
class PumpController {
private:
    enum class PumpState {
        OFF,
        ON
    };

    PumpState state = PumpState::OFF;

public:
    bool compute(float level) {
        if (state == PumpState::OFF && level < 50.0) {
            state = PumpState::ON;
        }
        else if (state == PumpState::ON && level > 50.0) {
            state = PumpState::OFF;
        }

        return state == PumpState::ON;
    }
};
```

---

## 🔬 Validasi di Velxio

Bandingkan:

| Model       | Behaviour |
| ----------- | --------- |
| IF biasa    | flicker   |
| state-based | stabil    |

---

## Insight:

- state bukan optional
  ➡️ **wajib untuk stability**

---

## Validasi tambahan (WAJIB)

Ubah:

```cpp id="o2k9rp"
state = PumpState::OFF;
```

(setiap loop reset)

---

➡️ observasi:

- sistem kembali flicker

---

➡️ membuktikan:

> state harus persistent

---

# 🔄 6. Deterministic Flow — “Mini PLC Cycle”

---

## Model:

```text id="g7x1kc"
read → compute → actuate
```

---

## Dalam sistem:

```cpp id="d1m9zs"
void run() {
    float level = readInputs();
    bool output = computeLogic(level);
    writeOutputs(output);
}
```

---

## 🔬 Validasi di Velxio

✔ Case 1 — urutan benar

- read → compute → write

➡️ hasil:

- stabil
- predictable

---

✔ Case 2 — urutan diacak

```cpp id="y5n2lh"
writeOutputs();
computeLogic();
readInputs();
```

---

➡️ observasi:

- output tidak konsisten
- sulit dijelaskan

---

## Root cause:

- data tidak sinkron dengan decision

---

## Insight:

- urutan tidak boleh berubah
- tidak boleh lompat

---

---

## Implikasi engineering:

> flow eksekusi adalah bagian dari desain control
> bukan detail implementasi

---

# 🔁 7. Hysteresis — Solusi Fundamental Stability (UPGRADE)

---

## Problem:

```text
level sekitar threshold → oscillation
```

---

## sys\_ — konfigurasi (DITAMBAHKAN)

```cpp
struct SystemConfig {
    static constexpr float LOW = 45.0;
    static constexpr float HIGH = 55.0;
};
```

---

## svc\_ — decision engine (state + hysteresis)

```cpp
class PumpController {
private:
    enum class PumpState { OFF, ON };
    PumpState state = PumpState::OFF;

public:
    bool compute(float level) {
        if (state == PumpState::OFF && level < SystemConfig::LOW) {
            state = PumpState::ON;
        }
        else if (state == PumpState::ON && level > SystemConfig::HIGH) {
            state = PumpState::OFF;
        }
        return state == PumpState::ON;
    }
};
```

---

## app\_ — runtime orchestration (DITAMBAHKAN)

```cpp
class App {
private:
    AnalogSensor sensor;
    LevelService svcData;
    PumpController controller;

public:
    void run() {
        int raw = sensor.readRaw();
        float filtered = svcData.filter(raw);
        float level = svcData.toEngineeringUnit(filtered);

        bool pump = controller.compute(level);

        digitalWrite(2, pump);
    }
};
```

---

## 🔬 Validasi (Velxio)

- tidak ada flicker
- perubahan hanya saat melewati LOW/HIGH
- behaviour stabil

---

## Insight (UPGRADE):

> stability bukan hanya karena hysteresis
> tapi karena:

- state (svc\_)
- config (sys\_)
- flow (app\_)

---

# 🛑 8. Interlock — Layer Safety dalam Logic (UPGRADE)

---

## sys\_ — definisi kondisi

```cpp
struct SafetyConfig {
    static constexpr bool REQUIRE_PRESSURE = true;
};
```

---

## svc\_ — decision + safety

```cpp
bool compute(float level, bool pressureOk, bool fault) {

    if (fault) return false;

    if (state == PumpState::OFF && level < SystemConfig::LOW && pressureOk) {
        state = PumpState::ON;
    }
    else if (state == PumpState::ON && level > SystemConfig::HIGH) {
        state = PumpState::OFF;
    }

    return state == PumpState::ON;
}
```

---

## app\_ — orchestration + runtime context

```cpp
void run() {
    float level = ...;          // dari svcData
    bool pressureOk = true;     // simulasi
    bool fault = false;

    bool pump = controller.compute(level, pressureOk, fault);

    digitalWrite(2, pump);
}
```

---

## 🔬 Validasi

- fault = true → pump OFF
- pressureOk = false → pump OFF
- level LOW saja → tidak cukup

---

## Insight (UPGRADE):

> interlock bukan hanya condition
> tapi bagian dari **decision system dalam runtime**

---

# ⚠️ 9. Failure Scenario — Control yang Salah

---

## Case 1 — No hysteresis

---

✔ 🔬 Setup (Velxio)

Gunakan state-based **tanpa hysteresis**:

```cpp
if (state == PumpState::OFF && level < 50.0) {
    state = PumpState::ON;
}
else if (state == PumpState::ON && level > 50.0) {
    state = PumpState::OFF;
}
```

---

✔ 🔍 Observasi

- level di sekitar 50%
  ➡️ pump ON/OFF terus

---

✔ Root cause

- tidak ada buffer zone
- noise kecil melewati threshold

---

✔ Dampak

```text
pump cycling cepat
→ mechanical stress
→ equipment damage
```

---

## Case 2 — No interlock

---

✔ 🔬 Setup

Hilangkan interlock:

```cpp
if (level < LOW) {
    pump = true;
}
```

---

✔ 🔍 Observasi (simulasi)

Walaupun:

- kondisi tidak aman

➡️ pump tetap ON

---

✔ Root cause

- decision hanya berdasarkan 1 parameter
- tidak ada validasi kondisi sistem

---

✔ Dampak

```text
pump jalan tanpa kondisi aman
→ risiko kerusakan
→ potensi unsafe operation
```

---

## Case 3 — Non-deterministic flow

---

✔ 🔬 Setup

Urutan tidak dijaga:

```cpp
writeOutputs();
computeLogic();
readInputs();
```

---

✔ 🔍 Observasi

- output berubah tidak konsisten
- behaviour sulit dijelaskan

---

✔ Root cause

- data tidak sinkron
- decision tidak berbasis input yang valid

---

✔ Dampak

```text
behaviour tidak bisa diprediksi
→ tidak bisa di-debug
→ tidak bisa diandalkan
```

---

# 🧠 10. Engineering Insight (Poin Kritis)

---

## Insight 1 — Control harus deterministic

Dari Case 3:

- urutan salah → output kacau

---

➡️ Kesimpulan:

> control logic harus memiliki urutan eksekusi yang tetap

---

## Insight 2 — Control harus state-based

Dari Case 1:

- tanpa state/hysteresis → oscillation

---

➡️ Kesimpulan:

> control bukan reaksi instan, tapi sistem dengan memori

---

## Insight 3 — Control harus stabil

Dari Case 1 & 2:

- noise kecil → efek besar
- kondisi tidak valid → tetap dieksekusi

---

➡️ Kesimpulan:

> stability adalah requirement, bukan optimasi

---

## Insight 4 — “berjalan” ≠ “benar”

Semua case:

- sistem tetap:

  - ON
  - OFF

---

➡️ terlihat normal

---

Namun:

- tidak stabil
- tidak aman
- tidak deterministic

---

➡️ Kesimpulan:

> sistem bisa berjalan tetapi tetap salah secara engineering

---

## Insight 5 — Root problem ada di decision model

Dari semua eksperimen:

- sensor benar
- hardware benar

---

➡️ masalah tetap muncul

---

➡️ Kesimpulan:

> sebagian besar masalah control:
> **bukan di hardware, tapi di model decision**

---

# 🔍 11. Mini Flow (Menguatkan Model)

```text
Sensor → drv_
       ↓
   svc_ (state + logic)
       ↓
   drv_ (actuator)
```

---

## 🔬 Validasi terhadap eksperimen

---

✔ Tanpa svc\_ (langsung IF)

- flicker
- unstable

---

✔ Dengan svc\_ (state + hysteresis + interlock)

- stabil
- predictable

---

## Insight

- `drv_` hanya membaca & menulis
- `svc_` menentukan behaviour sistem

---

## Validasi (WAJIB)

Engineer harus bisa menjawab:

- dimana state disimpan?
- dimana hysteresis diterapkan?
- dimana interlock dicek?

---

Jika tidak bisa:

> control system belum valid

---

# 🔚 12. Closing — Transisi ke System Integration

Kita sudah membuktikan:

- data sudah benar (Artikel 2)
- control sudah stabil (Artikel 3)

---

Namun sistem masih berdiri sendiri.

---

## Problem berikutnya:

> bagaimana sistem ini berinteraksi dengan sistem lain?

---

Karena dalam real system:

- data dikirim
- command diterima
- status dimonitor

---

<small>
  **_Catatan Penyusunan_** Artikel ini disusun sebagai materi edukasi dan
  referensi umum berdasarkan berbagai sumber pustaka, praktik lapangan, serta
  bantuan alat penulisan. Pembaca disarankan untuk melakukan verifikasi lanjutan
  dan penyesuaian sesuai dengan kondisi serta kebutuhan masing-masing sistem.
</small>
