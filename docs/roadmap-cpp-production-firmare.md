# 📘 C++ FOR PRODUCTION FIRMWARE ON ESP32

**_Author Roadmap & Engineering Guideline_**

---

- [📘 C++ FOR PRODUCTION FIRMWARE ON ESP32](#-c-for-production-firmware-on-esp32)
- [1. Executive Summary](#1-executive-summary)
  - [🎯 Tujuan Seri](#-tujuan-seri)
  - [🧠 Filosofi Utama](#-filosofi-utama)
- [2. Struktur Artikel (Total 8 – Final)](#2-struktur-artikel-total-8--final)
  - [📘 Artikel 1](#-artikel-1)
  - [📘 Artikel 2](#-artikel-2)
  - [📘 Artikel 3](#-artikel-3)
  - [📘 Artikel 4](#-artikel-4)
  - [📘 Artikel 5](#-artikel-5)
  - [📘 Artikel 6](#-artikel-6)
  - [📘 Artikel 7](#-artikel-7)
  - [📘 Artikel 8](#-artikel-8)
- [3. Template Outline (WAJIB DIGUNAKAN)](#3-template-outline-wajib-digunakan)
- [\[JUDUL ARTIKEL\]](#judul-artikel)
  - [1. Problem Reality](#1-problem-reality)
  - [2. Root Cause Analysis](#2-root-cause-analysis)
  - [3. Design Principle (Rule yang Dikunci)](#3-design-principle-rule-yang-dikunci)
  - [4. Implementation Pattern (ESP32 Context)](#4-implementation-pattern-esp32-context)
  - [5. Constraint \& Embedded Impact](#5-constraint--embedded-impact)
  - [6. Failure Scenario (Minimal 2)](#6-failure-scenario-minimal-2)
  - [7. Anti-Pattern](#7-anti-pattern)
  - [8. Freeze Point](#8-freeze-point)
  - [9. Engineering Checklist](#9-engineering-checklist)
  - [10. Summary (5 Bullet Maksimal)](#10-summary-5-bullet-maksimal)
- [4. Writing Governance](#4-writing-governance)
  - [❌ Tidak Boleh](#-tidak-boleh)
  - [✅ Wajib](#-wajib)
- [5. Tone \& Style Guideline](#5-tone--style-guideline)
- [6. Scope Limitation (Agar Tidak Melebar)](#6-scope-limitation-agar-tidak-melebar)
- [7. Success Criteria Seri Ini](#7-success-criteria-seri-ini)
- [8. Estimated Execution Timeline](#8-estimated-execution-timeline)
- [9. Final Positioning](#9-final-positioning)

---

# 1. Executive Summary

Seri ini **bukan kursus C++**.
Seri ini bukan OOP textbook.
Seri ini bukan kumpulan design pattern generik.

Seri ini adalah:

> Panduan arsitektur firmware produksi menggunakan C++ sebagai alat kontrol kompleksitas.

Target pembaca:

- Embedded engineer aktif
- Firmware developer produksi
- Tim IoT yang firmware-nya mulai membesar
- Engineer yang sudah deploy ESP32

Bukan untuk:

- Pemula C++
- Mahasiswa semester awal
- Orang yang ingin belajar sintaks dari nol

---

## 🎯 Tujuan Seri

Setelah membaca 8 artikel ini, pembaca harus mampu:

- Mengontrol dependency firmware
- Mendisiplinkan memory allocation
- Membuat arsitektur class-based yang deterministik
- Menghindari OOP overengineering
- Mendesain firmware production-grade tanpa spaghetti code

---

## 🧠 Filosofi Utama

1. OOP adalah alat, bukan tujuan.
2. Determinism lebih penting dari elegance.
3. Memory discipline lebih penting dari pattern fancy.
4. Simplicity > abstraction berlebihan.
5. Setiap artikel mengunci satu domain keputusan desain.

---

# 2. Struktur Artikel (Total 8 – Final)

Semua artikel bersifat waterfall.
Keputusan yang dikunci tidak boleh diubah di artikel berikutnya.

---

## 📘 Artikel 1

> Kenapa Firmware C di ESP32 Jadi Spaghetti Setelah 6 Bulan?

- Global variable chaos
- ISR coupling
- Dependency liar
- Config scattered
- Reconnect logic tersebar

Output:

- Problem map
- Complexity source identification
- Target architecture goal

Ini harus membuka mata praktisi.

---

## 📘 Artikel 2

> OOP Sebagai Alat Mengontrol Dependency (Bukan Gaya-Gayaan)

- Encapsulation untuk hardware
- Private state vs global state
- Composition > inheritance
- Jangan pakai virtual dulu

Output:

- Rule of class design untuk embedded
- Anti-pattern list

---

## 📘 Artikel 3

> Object Lifecycle & Memory Discipline di Embedded

- Object di stack vs heap
- Kapan boleh dynamic allocation
- RAII untuk peripheral
- Destructor bahaya jika salah pakai

Output:

- Allocation policy final
- Heap usage rule
- Forbidden practice list

Ini mengunci memory baseline.

---

## 📘 Artikel 4

> Firmware Architecture Berbasis Class (Layered & Deterministic)

- Driver layer
- Service layer
- Application layer
- Dependency injection sederhana
- No circular dependency

Output:

- Final layering rule
- Include direction rule
- Dependency graph freeze

---

## 📘 Artikel 5

> OOP + FreeRTOS Tanpa Membunuh Determinism

- Task wrapper class
- ISR boundary
- Thread-safe class
- Queue encapsulation

Output:

- Task-per-class rule
- ISR interaction rule
- Concurrency guard policy

---

## 📘 Artikel 6

> Communication Module Design (WiFi, MQTT, OTA) yang Tidak Coupled

- Manager class
- State machine class
- Reconnect strategy inside class
- Separation transport vs logic

Output:

- Communication architecture pattern
- State machine baseline
- Interface rule

---

## 📘 Artikel 7

> Production Reliability Design dengan C++

- Watchdog encapsulation
- Fail-safe state handling
- Error propagation model
- Logging via interface

Output:

- Error handling strategy
- Recovery model
- Logging abstraction rule

---

## 📘 Artikel 8

> Anti-Pattern: Cara OOP Menghancurkan Embedded System

- Virtual abuse
- Heap fragmentation
- Singleton race condition
- Template overengineering
- Dynamic allocation di ISR

Output:

- Red flag checklist
- Code review checklist
- Production audit list

---

# 3. Template Outline (WAJIB DIGUNAKAN)

Semua artikel harus mengikuti struktur berikut.

---

# [JUDUL ARTIKEL]

**Posisi:** Artikel X dari 8
**Domain Keputusan:** [Dependency / Memory / Architecture / Concurrency / Communication / Reliability / Guardrail]

---

## 1. Problem Reality

- Masalah nyata firmware ESP32
- Dampak produksi
- Contoh konkret (bukan teori)

---

## 2. Root Cause Analysis

- Masalah struktural
- Dependency graph
- Lifecycle problem
- Diagram sederhana (jika perlu)

---

## 3. Design Principle (Rule yang Dikunci)

Tuliskan dalam bentuk tegas:

- Rule 1
- Rule 2
- Rule 3

Tidak ambigu.

---

## 4. Implementation Pattern (ESP32 Context)

- Contoh class minimal
- Layering contoh
- FreeRTOS integration jika relevan

Code harus:

- Ringkas
- Embedded-oriented
- Tidak fancy

---

## 5. Constraint & Embedded Impact

Wajib bahas:

- RAM impact
- Flash impact
- Stack impact
- Determinism impact

---

## 6. Failure Scenario (Minimal 2)

Format:

Scenario → Dampak → Bagaimana desain mencegahnya

---

## 7. Anti-Pattern

❌ Yang dilarang
❌ Kenapa berbahaya
❌ Dampaknya di produksi

---

## 8. Freeze Point

Tuliskan secara eksplisit:

> Setelah artikel ini, keputusan berikut dianggap final:

Daftar keputusan.

---

## 9. Engineering Checklist

Checklist langsung pakai.

---

## 10. Summary (5 Bullet Maksimal)

Ringkas dan tajam.

---

# 4. Writing Governance

## ❌ Tidak Boleh

- Menjelaskan sintaks C++ panjang
- Membahas semua design pattern
- Template metaprogramming
- Pembahasan STL terlalu dalam
- Membuat artikel seperti textbook

---

## ✅ Wajib

- Problem-driven
- Embedded-aware
- Ada constraint analysis
- Ada failure scenario
- Ada freeze point
- Ada checklist implementasi

---

# 5. Tone & Style Guideline

- Bahasa teknis, presisi
- Tidak motivasional
- Tidak filosofis panjang
- Tidak repetitif
- Fokus engineering

---

# 6. Scope Limitation (Agar Tidak Melebar)

Seri ini tidak membahas:

- Advanced template metaprogramming
- Modern C++ feature lengkap
- Desktop OOP theory
- STL heavy usage
- Generic design pattern catalog

Jika tidak langsung relevan ke firmware ESP32 → tidak dibahas.

---

# 7. Success Criteria Seri Ini

Seri dianggap berhasil jika:

- Firmware lebih terstruktur
- Dependency lebih jelas
- Heap usage terkendali
- Concurrency lebih aman
- Code review lebih cepat
- Tidak ada redesign besar setelah Artikel 4

---

# 8. Estimated Execution Timeline

- 1 artikel per minggu
- Total 8 minggu
- Review teknis tiap artikel
- No parallel writing (waterfall discipline)

---

# 9. Final Positioning

Seri ini bukan:

“Belajar OOP untuk ESP32”

Seri ini adalah:

> Cara menggunakan C++ untuk membuat firmware ESP32 yang bisa hidup 3–5 tahun tanpa jadi monster spaghetti.
