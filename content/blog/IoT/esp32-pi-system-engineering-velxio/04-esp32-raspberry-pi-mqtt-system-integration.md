---
title: README - C++ Firmware Engineering Foundations for ESP32
date: '2026-04-08'
tags:
[
'esp32',
'firmware-foundation',
'embedded-systems',
'freertos-model',
'memory-discipline',
'layered-architecture',
'communication-state',
'reliability-thinking',
]
draft: false
summary: Foundation Track membangun mental model sistemik sebelum masuk disiplin firmware produksi pada ESP32 berbasis Arduino. Seri ini tidak mengajarkan sintaks C++, tetapi membedah realitas eksekusi FreeRTOS, stack per task, heap global, object lifetime, layering 3-level, state machine komunikasi, serta reliability thinking. Tujuannya adalah membentuk pola pikir engineer agar memahami interaksi concurrency, memory, dan komunikasi sebelum aturan produksi dikunci. Foundation menjawab “mengapa” di balik setiap keputusan arsitektur. Dengan pemahaman ini, transisi ke seri Production menjadi logis, terstruktur, dan tidak terasa sebagai pembatasan tanpa alasan teknis.

---

Baik — ini artikel yang paling rawan “keluar jalur”, jadi saya jaga dengan ketat:

- tetap **cohesive module di ESP32**
- **tidak pecah ke task-based decomposition**
- Raspberry Pi diposisikan **external system (bukan bagian runtime ESP32)**
- komunikasi = **layer boundary, bukan domain logic**

---

# 📄 **ARTIKEL 4 — OUTLINE (VERSION 1.0)**

## **“System Integration yang Benar: ESP32 ↔ Raspberry Pi tanpa Merusak Arsitektur”**

---

# 🧠 1. Opening — Masalah Klasik Integrasi

Begitu masuk tahap komunikasi (MQTT, cloud, dashboard):

- kode mulai:

  - bercampur
  - membesar
  - tidak terkontrol

---

## Gejala umum:

- MQTT logic masuk ke control logic
- sensor, control, dan komunikasi tercampur
- muncul pseudo-task:

  - `sensorTask`
  - `mqttTask`
  - `controlTask`

---

## Statement:

> ❗ Integrasi sering menjadi titik dimana arsitektur runtuh

---

---

# 🏭 2. System Context — Edge vs Gateway (Industrial Mapping)

---

## Model sistem:

```text
ESP32 (Edge) → Raspberry Pi (Gateway) → System luar
```

---

## Peran:

| Komponen     | Role                  |
| ------------ | --------------------- |
| ESP32        | acquisition + control |
| Raspberry Pi | gateway + processing  |
| MQTT         | communication layer   |

---

## Insight:

> ESP32 tetap **system node yang utuh**, bukan “client kecil”

---

---

# ⚠️ 3. Core Problem — Integrasi yang Merusak Sistem

---

## ❌ Problem 1 — Task-based decomposition

```cpp
sensorTask();
mqttTask();
controlTask();
```

➡️ kehilangan:

- domain cohesion
- system structure

---

---

## ❌ Problem 2 — Communication masuk ke svc\_

- MQTT dipanggil langsung dari logic

➡️ dampak:

- coupling tinggi
- sulit test

---

---

## ❌ Problem 3 — Raspberry Pi dianggap bagian internal

➡️ padahal:

- Pi adalah system eksternal

---

---

## ❌ Problem 4 — Flow tidak jelas

- komunikasi dilakukan kapan saja
- tidak terikat runtime

---

---

# 🧩 4. Engineering Model — System Boundary yang Benar

---

## Reframe:

```text
ESP32 = 1 cohesive system
Raspberry Pi = external system
MQTT = boundary interface
```

---

## Model:

```text
[ESP32]
  drv_ → svc_ → app_
        ↓
     communication (boundary)
        ↓
[Raspberry Pi]
```

---

## Insight:

> komunikasi adalah **interface**, bukan bagian dari logic inti

---

---

# ⚙️ 5. Design — Integrasi Tanpa Merusak Layering

---

## Posisi MQTT:

```text
drv_ atau boundary adapter (lebih tepat)
```

---

## Struktur:

### `drv_`

```cpp
class MqttClient {
public:
    void publish(float value);
    float subscribe();
};
```

---

### `svc_`

```cpp
class PumpController {
public:
    bool compute(float level);
};
```

➡️ tidak tahu MQTT

---

### `app_`

```cpp
void communicate(unsigned long now);
```

➡️ orchestration

---

---

# 🔄 6. Runtime Behavior — Komunikasi Harus Terkontrol

---

## ❌ Salah:

- publish setiap loop
- blocking communication

---

## ✅ Benar:

```cpp
if (now - lastPublish >= interval)
```

---

## Insight:

- komunikasi = periodic
- tidak boleh mengganggu control

---

---

# 🔗 7. Data Flow — Dari Control ke External System

---

## Model:

```text
Sensor → drv_
       ↓
     svc_
       ↓
     state / value
       ↓
     app_
       ↓
     drv_ (MQTT)
       ↓
Raspberry Pi
```

---

## Insight:

- data keluar dari sistem melalui `app_`
- bukan langsung dari `svc_`

---

---

# ⚠️ 8. Failure Scenario — Integrasi yang Salah

---

## Case 1 — MQTT blocking

➡️ control delay
➡️ sistem tidak responsif

---

## Case 2 — Logic tergantung komunikasi

➡️ jika MQTT down → system gagal

---

## Case 3 — Data tidak sinkron

➡️ Pi menerima data tidak valid

---

---

# 🧠 9. Engineering Insight (Poin Kritis)

---

- komunikasi harus:

  - non-blocking
  - tidak mengganggu control

---

- ESP32 harus tetap:

> **independent system**

---

- Pi adalah:

> **consumer / processor, bukan controller utama (dalam konteks ini)**

---

---

# 🔍 10. Mini Architecture View

```text
[ESP32]
  app_
   ├─ orchestrate
   ├─ schedule
   └─ communicate
        ↓
  svc_ (decision)
        ↓
  drv_ (sensor + mqtt)
        ↓
[External System]
```

---

---

# 🔚 11. Closing — Transisi ke Failure Analysis

> Setelah sistem terintegrasi, masalah berikutnya bukan lagi desain,
> tetapi **bagaimana sistem gagal dan bagaimana kita menganalisisnya**

---

## Teaser:

> Artikel berikutnya:
> **Failure Mode & Debugging berbasis layer dan runtime**

---

---

# 🧠 SELF-REVIEW (ENGINEERING CHECK)

## ✔ Tidak pecah ke task-based chaos

## ✔ Layering tetap utuh

## ✔ Boundary jelas (ESP32 vs Pi)

## ✔ Runtime tetap embedded di app\_

## ✔ Tidak jatuh ke tutorial MQTT

## ✔ Fokus ke arsitektur, bukan library

---

# 🔧 NEXT STEP

Silakan review:

- apakah boundary sudah cukup tegas?
- apakah perlu ditambahkan:

  - command flow (Pi → ESP32)?
  - atau cukup one-way dulu?

---

Jika OK:

👉 lanjut ke:

## **Outline Artikel 5 (Failure & Debugging — ini akan jadi artikel paling “thinking-heavy”)**

---

<small>
  **_Catatan Penyusunan_** Artikel ini disusun sebagai materi edukasi dan
  referensi umum berdasarkan berbagai sumber pustaka, praktik lapangan, serta
  bantuan alat penulisan. Pembaca disarankan untuk melakukan verifikasi lanjutan
  dan penyesuaian sesuai dengan kondisi serta kebutuhan masing-masing sistem.
</small>
