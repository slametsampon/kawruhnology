# Rekomendasi Tegas

Kita desain sekarang:

> **ESP32 Production IoT Node – Industrial Grade Reference Firmware**

Dengan karakteristik:

- Sensor suhu (I2C)
- Relay control (GPIO + protection logic)
- Local control loop (deterministic)
- WiFi + MQTT
- OTA
- Watchdog
- Non-blocking logging
- Offline-safe behavior

Firmware ini akan:

- Mulai sebagai spaghetti di Artikel 1
- Direstruktur di Artikel 2–4
- Diperkeras di Artikel 5–7
- Diaudit di Artikel 8

---

# 1. Executive Summary

Kita tetapkan **Firmware Reference Case: Industrial IoT Node (ESP32)** sebagai baseline seri. Ini akan menjadi “satu sistem yang sama” yang dievolusi dari Artikel 1 sampai 8, sehingga semua rule (dependency, memory, layering, concurrency, comms, reliability) bisa diuji pada konteks nyata.

Output dari langkah ini:

- Spesifikasi sistem yang realistis (sensor–aktuator–kontrol–telemetri)
- Batas sistem per-layer dan per-domain
- Budget resource (RAM/Flash/stack/task)
- Failure scenarios baseline (≥3) + recovery
- Kontrak interface antar modul agar konsisten di 8 artikel

---

# 2. Architecture Overview

## 2.1 Target System: ESP32 Industrial IoT Node

Fungsi utama:

- **Local control** (tetap berjalan saat WAN putus)
- Telemetry upstream (MQTT)
- Command downstream terbatas (non-safety-critical)
- OTA aman dan terkontrol
- Watchdog & fail-safe

### Diagram blok (fungsi & boundary)

```id="s1pmdt"
                 ┌─────────────────────────── Cloud / DC ───────────────────────────┐
                 │  MQTT Broker + Device Registry + OTA Artifact + Observability     │
                 └───────────────▲──────────────────────▲────────────────────────────┘
                                 │ TLS/MQTT             │ HTTPS/TLS
                                 │                      │
┌───────────────────────────────┴───────────────────────┴───────────────────────────┐
│                                   Site Network (WAN)                               │
└───────────────────────────────▲───────────────────────▲───────────────────────────┘
                                │ WiFi                  │ Time (NTP optional)
                                │                      (may fail)
┌────────────────────────────────┴───────────────────────────────────────────────────┐
│                                     ESP32 Node                                     │
│                                                                                     │
│  Application Layer:                                                                │
│   - ControlApp (state machine: AUTO/MANUAL/FAILSAFE)                               │
│   - TelemetryPolicy (rate limit, offline buffering policy)                         │
│                                                                                     │
│  Service Layer:                                                                    │
│   - SensorService (filtering, validation)                                          │
│   - ActuatorService (relay safety interlock, wear limit)                           │
│   - CommManager (state machine: WIFI/MQTT/OTA)                                     │
│   - StorageService (NVS ring-buffer metadata)                                      │
│   - HealthService (watchdog, brownout, heap watermark)                             │
│                                                                                     │
│  Driver Layer:                                                                     │
│   - I2CDriver + TempSensorDriver                                                   │
│   - GPIODriver + RelayDriver                                                       │
│   - ADCDriver (optional: supply monitor)                                           │
│   - TimeDriver (monotonic + RTC/NTP adapter)                                       │
│                                                                                     │
│  Hardware: ESP-IDF, FreeRTOS, WiFi, TLS stack, NVS                                 │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. Technical Deep Dive

## 3.1 System Boundary & Behavior Rules

### Local control loop (non-negotiable)

- Loop kontrol lokal berjalan periodik (mis. 200ms–1s) **tanpa tergantung koneksi**
- Telemetry dan comms tidak boleh memblok loop kontrol
- Command dari cloud:

  - hanya ubah parameter non-safety (setpoint, mode), **tidak langsung men-drive relay tanpa interlock**

### Data model ringkas (agar konsisten di semua artikel)

- Telemetry:

  - temperature_c, relay_state, mode, uptime_s, rssi, error_code, heap_min_free, queue_depth

- Command:

  - set_mode (AUTO/MANUAL), set_setpoint, request_ota (flag), reboot (guarded)

## 3.2 Task & Scheduling Baseline (FreeRTOS)

Task minimal (agar deterministik dan realistis):

1. **ControlTask** (prioritas tinggi, periodik)
2. **CommTask** (prioritas menengah, event-driven)
3. **LogTask** (prioritas rendah, non-blocking)

ISR hanya untuk:

- GPIO interrupt jika ada input (optional)
- Timer tick (jika dipakai) → notify task

## 3.3 Memory & Storage Baseline

### Allocation policy (mengacu Master Rule Document)

- Object utama statik (composition di main)
- Heap hanya untuk:

  - TLS/WiFi internal
  - MQTT buffer terbatas
  - OTA buffer sementara

### Offline buffering (eventual consistency)

- Saat MQTT down:

  - data telemetry disampling
  - disimpan ring-buffer metadata di NVS (atau RAM ring buffer + flush periodik)
  - saat koneksi pulih → publish backlog dengan rate limit

Catatan produksi:

- NVS write harus dibatasi (wear). Gunakan batching / interval (mis. tiap 30–60s) atau hanya simpan agregat.

---

# 4. Trade-Off & Design Consideration

## Opsi 1 — Offline Buffer di RAM saja

**Benefit**

- Implementasi lebih simpel
- Tidak menambah wear flash
- Latensi publish backlog cepat

**Risiko**

- Data hilang saat reboot/brownout
- Tidak cocok untuk audit trail minimal

## Opsi 2 — Hybrid: RAM ring + NVS snapshot periodik (Rekomendasi)

**Benefit**

- Tetap ringan tapi survive reboot
- Wear bisa dikontrol dengan interval & batching
- Cocok untuk sistem multi-site yang sering power glitch

**Risiko**

- Perlu desain wear-aware
- Perlu mekanisme rekonsiliasi timestamp (time drift)

**Keputusan**

- Pilih **Hybrid**: RAM ring buffer + NVS snapshot interval + publish backlog rate-limited.

---

# 5. Production & Reliability Insight

## Constraint (baseline yang akan kita pegang di semua artikel)

- **RAM**: target budget aplikasi (non-IDF) ~ 120–200KB (realistis, tergantung TLS/MQTT)
- **Flash**: target firmware 1–1.5MB + OTA slot (partisi)
- **Stack**:

  - ControlTask: 3–4KB
  - CommTask: 6–10KB (TLS heavy, tetap dipantau)
  - LogTask: 2–3KB

- **Bandwidth**: telemetry rate-limited (mis. 1–5s) + burst backlog terkontrol
- **Determinism**: ControlTask tidak boleh jitter besar akibat logging/comms

## Minimal 3 failure scenarios + recovery

1. **WAN putus / WiFi down**

- Dampak: telemetry stop, command tertunda
- Pencegahan: CommManager state machine + offline buffering
- Recovery: exponential backoff reconnect; publish backlog saat pulih (rate limit)

2. **Broker overload / MQTT reject / auth fail**

- Dampak: publish gagal, queue menumpuk
- Pencegahan: bounded queue, drop policy (oldest drop), error code surfacing
- Recovery: degrade publish rate; keep local control; alarm local via status LED (optional)

3. **Time drift / NTP gagal**

- Dampak: timestamp telemetry kacau, rekonsiliasi backlog sulit
- Pencegahan: gunakan monotonic time untuk ordering; timestamp absolute hanya jika valid
- Recovery: saat time valid kembali, lakukan mapping offset; tandai data “time_untrusted”

4. **Brownout / power dip saat relay switching (inrush)**

- Dampak: reboot, state tak konsisten, relay chatter
- Pencegahan: interlock: minimum off-time/on-time, debounce command, brownout detect handling
- Recovery: boot loads last-known safe state; default FAILSAFE sampai sensor valid

(Ini 4 skenario; nanti tiap artikel akan ambil subset sesuai domain.)

## Monitoring terpusat & per-site

- Per-device: heap_min_free, reset_reason, wifi_rssi, mqtt_state, backlog_depth
- Per-site: device online ratio, publish latency, OTA success rate

---

# 6. Security Consideration

Baseline keamanan untuk reference case:

- MQTT over TLS
- Credential encapsulated (single module)
- OTA harus tervalidasi (signature/manifest) dan guarded (tidak auto tanpa flag)
- Secure boot awareness (minimal: desain tidak bergantung pada secrecy di firmware image)
- Key provisioning scalable (di seri: cukup rule & boundary, bukan implementasi PKI penuh)

---

# 7. Implementation Strategy

Urutan implementasi reference firmware (sebagai “kerangka” untuk 8 artikel):

1. **Artikel 1 (Spaghetti)**: contoh firmware “langsung” (global state, reconnect tersebar) sebagai problem map
2. **Artikel 2**: bungkus sensor/relay jadi class driver + hilangkan global state
3. **Artikel 3**: tetapkan allocation policy + object lifecycle (static composition)
4. **Artikel 4**: final layering + dependency graph freeze
5. **Artikel 5**: task wrapper + ISR boundary + queue encapsulation
6. **Artikel 6**: CommManager + state machine reconnect + OTA isolation
7. **Artikel 7**: watchdog + error propagation + fail-safe state + logging interface
8. **Artikel 8**: audit anti-pattern memakai reference firmware yang sama

Deliverable yang harus dijaga konsisten:

- Nama modul dan boundary (Driver/Service/App)
- Data model telemetry/command
- Task model 3 task (atau tetap bounded jika bertambah)

---

# 8. Engineering Recommendation

Keputusan final untuk seri ini:

1. Reference firmware = **Industrial IoT Node** dengan local control + telemetry + OTA.
2. Gunakan **3-layer architecture** sebagai backbone (Driver/Service/App).
3. Task baseline: **ControlTask + CommTask + LogTask**, bounded resources.
4. Offline buffering: **Hybrid RAM ring + NVS snapshot periodik** (wear-aware).
5. Failure scenarios baseline: WAN down, broker overload/auth fail, time drift, brownout/inrush.
6. Semua artikel akan “memperbaiki sistem yang sama”, bukan contoh berbeda-beda.

---

# 📘 Artikel 1

**Judul:** Kenapa Firmware C di ESP32 Jadi Spaghetti Setelah 6 Bulan?
**Posisi:** Artikel 1 dari 8
**Domain Keputusan:** Problem Mapping & Complexity Identification
**Status Lock:** Belum mengunci arsitektur final

---

## 1. Problem Reality

### Situasi nyata di produksi:

- Firmware awalnya 1 file main.c
- Bertambah fitur: sensor + WiFi + MQTT + OTA
- Global variable bertambah
- ISR mulai akses state global
- Reconnect logic tersebar
- Config tersebar di banyak file

### Gejala setelah 6 bulan:

- Bug muncul saat reconnect
- Deadlock tidak jelas sumbernya
- Heap fragmentation mulai terlihat
- Race condition sporadis
- Perubahan kecil memicu efek domino

Contoh konkret:

- Flag koneksi global diubah dari ISR
- MQTT callback mengubah state relay langsung
- Timer dan task memodifikasi variabel yang sama

---

## 2. Root Cause Analysis

### Akar masalah struktural:

1. Tidak ada boundary antar domain
2. Tidak ada kontrol dependency
3. Tidak ada ownership state yang jelas
4. Lifecycle object tidak terdefinisi
5. Communication logic bercampur control logic

### Dependency chaos diagram (konseptual)

```text
ISR → MQTT → Control → GPIO
  ↑          ↓
 Timer ← WiFi state
```

Semua bisa memanggil semua.

Masalah bukan C.
Masalahnya adalah **tidak ada arsitektur.**

---

## 3. Design Principle (Rule yang Dikunci)

Artikel 1 belum mengunci teknis detail, tetapi mengunci mindset:

**Rule 1**
Firmware harus diperlakukan sebagai sistem dengan boundary, bukan kumpulan fungsi.

**Rule 2**
Setiap state harus memiliki owner yang jelas.

**Rule 3**
Dependency harus dapat digambar dalam satu diagram.

Belum mengunci implementasi C++.

---

## 4. Implementation Pattern (ESP32 Context)

Di artikel ini belum memperkenalkan OOP penuh.

Hanya menunjukkan kontras:

### Firmware spaghetti (contoh kecil)

- global bool wifi_connected
- global int relay_state
- ISR ubah relay
- MQTT callback ubah relay
- main loop cek flag

Kemudian tampilkan problem surface, bukan solusi.

Belum ada refactor.

---

## 5. Constraint & Embedded Impact

Bahas dampak nyata di ESP32:

- RAM leak sulit dilacak
- Stack overflow sulit terdeteksi
- Watchdog reset tanpa root cause
- TLS handshake memperparah fragmentation
- Debugging via serial jadi noise

Tekankan:
Embedded tidak memaafkan chaos.

---

## 6. Failure Scenario (Minimal 2)

### Scenario 1

Reconnect WiFi saat relay switching
→ Race condition
→ Relay chatter
→ Potensi kerusakan mekanikal

### Scenario 2

MQTT callback blocking
→ Control loop delay
→ Watchdog reset

Artikel 1 menunjukkan dampak, bukan solusi.

---

## 7. Anti-Pattern

❌ Semua state global
❌ ISR akses logic layer
❌ Reconnect logic copy-paste
❌ Timer, task, ISR ubah variabel sama
❌ Tidak ada dependency graph

---

## 8. Freeze Point

Setelah Artikel 1:

Belum ada rule implementasi dikunci.

Yang dikunci hanya:

> Firmware tanpa boundary pasti menjadi spaghetti.

---

## 9. Engineering Checklist

- Apakah semua state global?
- Apakah ISR memanggil logic?
- Apakah reconnect logic tersebar?
- Apakah dependency bisa digambar?
- Apakah ada ownership state?

Jika 3+ jawaban “ya” → spaghetti.

---

## 10. Summary (5 Bullet Maksimal)

- Spaghetti bukan karena C, tapi karena tanpa boundary.
- Global state adalah akar kompleksitas.
- ISR + communication + control tanpa isolasi = chaos.
- Embedded memperbesar dampak kesalahan arsitektur.
- Kita butuh kontrol dependency, bukan sekadar refactor.

---

Baik.
Kita lanjut dengan disiplin yang sama: **outline terkunci, belum narasi penuh**.

---

# 📘 Artikel 2

**Judul:** OOP Sebagai Alat Mengontrol Dependency (Bukan Gaya-Gayaan)
**Posisi:** Artikel 2 dari 8
**Domain Keputusan:** Dependency Control
**Status Lock:** 🔒 Mengunci aturan dependency & global state

---

## 1. Problem Reality

Melanjutkan dari Artikel 1:

Masalah yang paling merusak:

- Global state lintas modul
- Fungsi saling panggil tanpa boundary
- ISR memanggil logic langsung
- Tidak ada ownership state

Dampak produksi:

- Perubahan kecil → efek domino
- Tidak bisa isolasi bug
- Refactor hampir mustahil tanpa risiko

Masalahnya bukan C atau C++.
Masalahnya: **tidak ada kontrol dependency.**

---

## 2. Root Cause Analysis

Akar struktural:

1. State tidak memiliki owner.
2. Modul bukan unit independen.
3. Dependency implicit (via global).
4. Tidak ada boundary antara domain hardware dan domain logic.

Dependency graph saat ini:

```text id="kz9wru"
MQTT callback → relay_set()
ISR → relay_set()
Main loop → relay_set()
```

Relay tidak punya “pemilik”.
Semua boleh mengubah.

---

## 3. Design Principle (Rule yang Dikunci)

Ini artikel pertama yang benar-benar mengunci rule.

### 🔒 Rule 1 — No Global Mutable State

Semua state runtime harus berada di dalam class.

Diperbolehkan:

- constexpr
- compile-time config

---

### 🔒 Rule 2 — Encapsulation Mandatory

Setiap peripheral dan domain logic harus berada dalam class dengan state private.

---

### 🔒 Rule 3 — Composition > Inheritance

Firmware dibangun dengan composition.
Inheritance hanya jika benar-benar perlu (jarang).

---

### 🔒 Rule 4 — No Singleton

Instance tunggal dibuat di main() dan di-inject via constructor.

---

### 🔒 Rule 5 — Explicit Dependency Injection

Jika A butuh B, dependency diberikan via constructor.

Tidak boleh ambil global.

---

Setelah artikel ini:
❌ Tidak boleh kembali ke global state
❌ Tidak boleh introduce singleton

---

## 4. Implementation Pattern (ESP32 Context)

Contoh minimal refactor dari spaghetti:

### Driver Layer

```cpp
class RelayDriver {
public:
    void set(bool on);
private:
    gpio_num_t pin_;
    bool state_;
};
```

State relay sekarang:

- Private
- Tidak bisa diubah sembarang tempat

---

### Service Layer

```cpp
class ActuatorService {
public:
    explicit ActuatorService(RelayDriver& relay)
        : relay_(relay) {}

    void setRelay(bool on);

private:
    RelayDriver& relay_;
};
```

Dependency jelas:

- Service tidak tahu GPIO detail.
- Relay tidak tahu MQTT.

---

### main()

```cpp
RelayDriver relay(GPIO_NUM_5);
ActuatorService actuator(relay);
```

Tidak ada singleton.
Tidak ada global mutable.

---

## 5. Constraint & Embedded Impact

### RAM Impact

- Class menambah overhead kecil (metadata + alignment)
- Lebih predictable dibanding global tersebar

### Flash Impact

- Sedikit naik karena struktur class
- Diterima untuk clarity

### Stack Impact

- Bergantung pada instantiation
- Static instantiation lebih aman

### Determinism Impact

- State owner jelas
- Race lebih mudah dianalisis

Kesimpulan:
OOP tidak mahal jika dikontrol.

---

## 6. Failure Scenario

### Scenario 1

ISR ubah relay langsung
→ Race condition
→ Sekarang tidak bisa, karena RelayDriver hanya expose API

---

### Scenario 2

MQTT callback ubah global mode
→ Tidak ada global
→ Harus lewat Service layer
→ Bisa tambahkan guard di satu tempat

Encapsulation membatasi blast radius.

---

## 7. Anti-Pattern

❌ Global object dengan external linkage
❌ Singleton logger / singleton WiFiManager
❌ Inheritance dalam untuk “future extensibility”
❌ Class hanya kumpulan fungsi static

Dampak:

- Hidden dependency
- Race condition
- Hard to test

---

## 8. Freeze Point

Setelah Artikel 2, keputusan berikut dianggap final:

- Tidak ada global mutable state.
- Tidak ada singleton.
- Semua dependency explicit via constructor.
- State hanya di dalam class.
- Composition adalah default approach.

Ini tidak boleh berubah di artikel berikutnya.

---

## 9. Engineering Checklist

- Apakah ada global bool/int runtime?
- Apakah ada static object global yang mutable?
- Apakah dependency diambil tanpa constructor?
- Apakah class expose state public?
- Apakah ada singleton?

Jika ya → melanggar Artikel 2.

---

## 10. Summary (5 Bullet Maksimal)

- Dependency chaos berasal dari global state.
- OOP dipakai untuk mengontrol ownership.
- Encapsulation adalah boundary, bukan gaya.
- Composition lebih aman untuk embedded.
- Setelah ini, global mutable state dilarang.

---

Baik.
Kita masuk ke domain paling kritikal secara teknis:

> **Memory Discipline & Object Lifecycle**

Ini artikel yang benar-benar menentukan apakah firmware ini production-grade atau tidak.

---

# 📘 Artikel 3

**Judul:** Object Lifecycle & Memory Discipline di Embedded
**Posisi:** Artikel 3 dari 8
**Domain Keputusan:** Memory & Allocation Policy
**Status Lock:** 🔒 Mengunci allocation baseline (tidak boleh berubah setelah ini)

---

## 1. Problem Reality

Setelah Artikel 2:

- Global sudah hilang
- Class sudah ada
- Dependency sudah jelas

Masalah baru muncul:

- new/delete mulai digunakan
- std::vector dipakai untuk buffer
- Callback MQTT buat object sementara
- Destructor dipakai untuk cleanup logic
- Heap fragmentation mulai muncul setelah TLS connect/disconnect

Gejala produksi:

- Reset acak setelah 2–3 minggu uptime
- Heap minimum terus turun
- TLS handshake gagal karena memori tidak cukup
- Stack overflow di task komunikasi

Masalah bukan lagi dependency.

Masalahnya: **lifecycle dan allocation tidak disiplin.**

---

## 2. Root Cause Analysis

Akar masalah:

1. Heap dipakai tanpa kebijakan.
2. Object dibuat dan dihancurkan di runtime loop.
3. ISR atau callback membuat alokasi dinamis.
4. Tidak ada batasan memory budget per domain.
5. Destructor dipakai sebagai “magic cleanup”.

Dependency sudah rapi,
tapi memory belum terkendali.

Diagram masalah tipikal:

```text
MQTT callback
   ↓
new PayloadObject
   ↓
push ke vector
   ↓
fragmentation
```

Embedded bukan desktop.
Fragmentation = time bomb.

---

## 3. Design Principle (Rule yang Dikunci)

Artikel ini mengunci kebijakan memory final.

---

### 🔒 Rule 1 — Static First Policy

Semua object utama firmware harus:

- Static
- Atau di-stack pada main()

Tidak dibuat/dihancurkan di runtime normal.

---

### 🔒 Rule 2 — Heap Restricted Zone

Heap hanya boleh digunakan untuk:

- TLS stack (karena IDF)
- Communication buffer terkontrol
- OTA buffer sementara

Selain itu → tidak boleh.

---

### 🔒 Rule 3 — No Dynamic Allocation in ISR

ISR tidak boleh:

- new
- delete
- std container growth
- String allocation

---

### 🔒 Rule 4 — No Exception

Exception:

- Tambah stack usage
- Tambah hidden control flow
- Sulit dianalisis determinism

Tidak dipakai.

---

### 🔒 Rule 5 — Destructor Discipline

Destructor tidak boleh:

- Blocking
- Call FreeRTOS API
- Publish MQTT
- Logging kompleks

Destructor hanya untuk trivial resource cleanup.

---

Setelah artikel ini:
❌ Tidak boleh ubah allocation policy
❌ Tidak boleh introduce heap di modul baru
❌ Tidak boleh pakai container dynamic growth

---

## 4. Implementation Pattern (ESP32 Context)

### Static Composition Pattern

```cpp
class ControlApp {
public:
    ControlApp(SensorService& sensor,
               ActuatorService& actuator,
               CommManager& comm)
        : sensor_(sensor),
          actuator_(actuator),
          comm_(comm) {}

    void run();

private:
    SensorService& sensor_;
    ActuatorService& actuator_;
    CommManager& comm_;
};
```

Instantiation di main:

```cpp
RelayDriver relay(GPIO_NUM_5);
SensorDriver sensorDriver(...);
SensorService sensor(sensorDriver);
ActuatorService actuator(relay);
CommManager comm(...);

ControlApp app(sensor, actuator, comm);
```

Tidak ada new.
Tidak ada delete.
Lifecycle = lifetime firmware.

---

### Controlled Buffer Example

```cpp
static uint8_t mqtt_buffer[1024];
```

Atau:

- Fixed ring buffer class dengan kapasitas compile-time.

Tidak pakai std::vector growable.

---

## 5. Constraint & Embedded Impact

### RAM Impact

- Lebih predictable
- Tidak ada fragmentation drift
- Heap watermark stabil

### Flash Impact

- Sedikit naik karena static object
- Diterima

### Stack Impact

- Harus definisikan stack size tiap task
- Tidak boleh ada object besar di stack task

### Determinism Impact

- Latency stabil
- Tidak ada unpredictable allocation spike

Kesimpulan:
Memory discipline meningkatkan uptime reliability.

---

## 6. Failure Scenario

### Scenario 1

Dynamic allocation di callback MQTT
→ Fragmentation
→ TLS handshake gagal
→ Device offline permanen

Dengan rule:
Tidak boleh.

---

### Scenario 2

Destructor melakukan logging saat shutdown task
→ FreeRTOS call dari destructor
→ Crash sporadis

Dengan rule:
Destructor trivial only.

---

### Scenario 3

Vector grow saat backlog spike
→ Heap exhaustion
→ Watchdog reset

Dengan rule:
Fixed-size ring buffer.

---

## 7. Anti-Pattern

❌ new/delete di loop
❌ std::vector tanpa reserve fixed
❌ std::string heavy usage
❌ Exception handling
❌ ISR allocate memory
❌ Destructor melakukan logic kompleks

Dampak:

- Fragmentation
- Non-deterministic latency
- Uptime tidak stabil

---

## 8. Freeze Point

Setelah Artikel 3, keputusan berikut dianggap final:

- Allocation policy static-first.
- Heap restricted zone hanya untuk TLS/Comm/OTA.
- No dynamic allocation di ISR.
- No exception.
- No growable container.

Memory baseline tidak boleh berubah.

---

## 9. Engineering Checklist

- Apakah ada new/delete?
- Apakah ada container growable?
- Apakah ISR pernah allocate?
- Apakah destructor memanggil API?
- Apakah heap watermark dimonitor?

Jika ya → melanggar Artikel 3.

---

## 10. Summary (5 Bullet Maksimal)

- Fragmentation adalah silent killer firmware.
- Static-first adalah default policy.
- Heap hanya untuk zona terbatas.
- Destructor harus trivial.
- Setelah ini, allocation baseline tidak boleh berubah.

---

Baik.
Ini adalah artikel paling kritikal secara struktural.

Setelah ini, arsitektur firmware dianggap **final secara bentuk**.

---

# 📘 Artikel 4

**Judul:** Firmware Architecture Berbasis Class (Layered & Deterministic)
**Posisi:** Artikel 4 dari 8
**Domain Keputusan:** Architecture & Layering
**Status Lock:** 🔒 Architectural Freeze (terbesar)

---

## 1. Problem Reality

Setelah Artikel 2 dan 3:

- Global sudah hilang
- Allocation sudah disiplin
- Class sudah ada

Masalah baru muncul:

- Class saling include tanpa aturan
- Service tahu detail hardware
- Driver tahu logic
- App bypass service
- Circular dependency mulai muncul

Contoh nyata:

- `CommManager` include `ControlApp`
- `SensorService` tahu GPIO detail
- Driver memanggil callback ke application

Walaupun sudah OOP dan static allocation,
tanpa layering → tetap spaghetti versi class.

---

## 2. Root Cause Analysis

Akar masalah:

1. Tidak ada direction rule dependency.
2. Tidak ada batas domain jelas.
3. Include graph tidak dikontrol.
4. Tidak ada boot sequence formal.
5. Layer tidak dipisah secara konseptual.

Dependency graph liar:

```text id="z3lxmp"
App ↔ Service ↔ Driver
 ↑         ↓        ↑
 └─────────┴────────┘
```

Circular dependency = redesign sulit.

---

## 3. Design Principle (Rule yang Dikunci)

Ini freeze terbesar dalam seri.

---

### 🔒 Rule 1 — 3 Layer Model Final

Struktur wajib:

```
Application Layer
      ↓
Service Layer
      ↓
Driver Layer
      ↓
ESP-IDF / HAL
```

Tidak boleh ada layer tambahan yang melanggar arah ini.

---

### 🔒 Rule 2 — Dependency Direction Strict

- Application boleh tahu Service.
- Service boleh tahu Driver.
- Driver tidak boleh tahu Service atau Application.
- Tidak boleh upward dependency.

---

### 🔒 Rule 3 — No Circular Dependency

Jika dependency graph tidak bisa digambar sebagai DAG → desain salah.

---

### 🔒 Rule 4 — Driver Is Pure Hardware Boundary

Driver:

- Tidak boleh tahu MQTT
- Tidak boleh tahu mode AUTO/MANUAL
- Tidak boleh tahu business logic

Driver hanya:

- Baca sensor
- Set GPIO
- Access peripheral

---

### 🔒 Rule 5 — Boot Sequence Fixed

Urutan init:

```
Init Driver
Init Service
Init Communication
Init Application
Start Tasks
Enter main control
```

Tidak boleh berubah di artikel berikutnya.

---

Setelah Artikel 4:
❌ Tidak boleh ubah layering
❌ Tidak boleh introduce cross-layer shortcut
❌ Tidak boleh circular dependency

Ini adalah structural freeze.

---

## 4. Implementation Pattern (ESP32 Context)

### Driver Layer Example

```cpp id="4m8csy"
class TempSensorDriver {
public:
    float readCelsius();
private:
    i2c_port_t port_;
};
```

Driver tidak tahu filtering.

---

### Service Layer Example

```cpp id="n4ik2o"
class SensorService {
public:
    explicit SensorService(TempSensorDriver& driver)
        : driver_(driver) {}

    float getFilteredTemperature();

private:
    TempSensorDriver& driver_;
};
```

Filtering logic di Service, bukan Driver.

---

### Application Layer Example

```cpp id="l2r1wt"
class ControlApp {
public:
    ControlApp(SensorService& sensor,
               ActuatorService& actuator,
               CommManager& comm);

    void run();

private:
    SensorService& sensor_;
    ActuatorService& actuator_;
    CommManager& comm_;
};
```

Application tidak tahu GPIO register.

---

### Include Direction Rule

Header rule:

- App include Service header.
- Service include Driver header.
- Driver include IDF header.

Tidak sebaliknya.

---

## 5. Constraint & Embedded Impact

### RAM Impact

- Layering tidak signifikan menambah RAM.
- Object tetap static.

### Flash Impact

- Struktur file lebih banyak.
- Compile time sedikit naik.

### Stack Impact

- Tidak berubah signifikan.
- Task boundary belum dibahas detail (Artikel 5).

### Determinism Impact

- Control flow lebih jelas.
- Dependency lebih bisa dianalisis.
- Failure domain lebih terisolasi.

Layering bukan untuk gaya.
Layering untuk isolasi dampak kegagalan.

---

## 6. Failure Scenario

### Scenario 1

Driver memanggil Service callback
→ Circular dependency
→ Deadlock saat concurrency masuk

Dengan rule:
Driver tidak tahu Service.

---

### Scenario 2

App langsung akses GPIO
→ Bypass interlock
→ Relay switching unsafe

Dengan rule:
App harus lewat Service → bisa enforce safety guard.

---

### Scenario 3

CommManager tahu ControlApp langsung
→ Tight coupling
→ Sulit ubah komunikasi tanpa ubah control

Dengan rule:
CommManager expose interface netral.

---

## 7. Anti-Pattern

❌ Service akses register langsung
❌ Driver publish MQTT
❌ App baca I2C langsung
❌ Header include silang
❌ Circular include

Dampak:

- Redesign mahal
- Refactor hampir mustahil
- Bug sulit diisolasi

---

## 8. Freeze Point

Setelah Artikel 4, keputusan berikut dianggap final:

- 3-layer architecture adalah final.
- Dependency direction tidak boleh berubah.
- Boot sequence fixed.
- Driver pure hardware boundary.
- Tidak boleh circular dependency.

Semua artikel berikutnya harus tunduk pada layering ini.

---

## 9. Engineering Checklist

- Apakah ada driver include service?
- Apakah ada upward call?
- Apakah dependency graph DAG?
- Apakah app bypass service?
- Apakah boot sequence konsisten?

Jika ada pelanggaran → melanggar Artikel 4.

---

## 10. Summary (5 Bullet Maksimal)

- OOP tanpa layering tetap spaghetti.
- 3-layer model adalah final.
- Dependency hanya boleh ke bawah.
- Driver harus pure hardware boundary.
- Setelah ini, arsitektur bentuk tidak boleh berubah.

---

Baik.
Sekarang kita masuk domain yang sering menghancurkan determinism:

> **Concurrency & FreeRTOS Boundary**

---

# 📘 Artikel 5

**Judul:** OOP + FreeRTOS Tanpa Membunuh Determinism
**Posisi:** Artikel 5 dari 8
**Domain Keputusan:** Concurrency Model
**Status Lock:** 🔒 Concurrency Boundary Freeze

---

## 1. Problem Reality

Setelah Artikel 4:

- Layering sudah rapi
- Allocation sudah disiplin
- Dependency sudah terkendali

Masalah berikutnya muncul saat:

- Tambah task komunikasi
- Tambah timer task
- ISR mulai notify task
- Logging berjalan paralel
- Queue dipakai lintas modul

Gejala produksi:

- Race condition sporadis
- Deadlock antar mutex
- Priority inversion
- Control loop jitter
- Watchdog reset saat traffic tinggi

Masalahnya bukan OOP.
Masalahnya: **boundary concurrency tidak jelas.**

---

## 2. Root Cause Analysis

Akar masalah:

1. Class tidak mendefinisikan domain thread-nya.
2. ISR memanggil service langsung.
3. Mutex diexpose keluar class.
4. Banyak task mengakses object yang sama.
5. Task dibuat tanpa prioritas sistemik.

Contoh dependency concurrency chaos:

```text id="uw3b8e"
ControlTask → ActuatorService
CommTask → ActuatorService
ISR → ActuatorService
```

Tiga domain akses object yang sama → race.

---

## 3. Design Principle (Rule yang Dikunci)

Artikel ini mengunci model concurrency final.

---

### 🔒 Rule 1 — Task Ownership Explicit

Jika class memiliki task:

- Task entry adalah static wrapper.
- run() method milik instance.
- Tidak boleh spawn task liar.

---

### 🔒 Rule 2 — Domain Thread Defined

Setiap class harus jelas:

- Dipakai hanya di ControlTask
  atau
- Dipakai di CommTask
  atau
- Thread-safe internal (dengan mutex tersembunyi)

Tidak boleh ambigu.

---

### 🔒 Rule 3 — ISR Boundary Strict

ISR hanya boleh:

- Set flag volatile
- xQueueSendFromISR
- xTaskNotifyFromISR

ISR tidak boleh:

- Panggil service
- Logging
- Publish MQTT
- Lock mutex

---

### 🔒 Rule 4 — Mutex Tidak Diexpose

Jika class perlu mutex:

- Mutex private
- Tidak boleh diberikan keluar

---

### 🔒 Rule 5 — Control Loop Highest Priority

ControlTask harus:

- Prioritas tertinggi (kecuali ISR)
- Tidak blocking
- Tidak bergantung komunikasi

---

Setelah Artikel 5:
❌ Tidak boleh ubah task boundary
❌ Tidak boleh ISR call service
❌ Tidak boleh expose mutex
❌ Tidak boleh class dipakai multi-task tanpa policy

Concurrency model final.

---

## 4. Implementation Pattern (ESP32 Context)

### Task Wrapper Pattern

```cpp id="h0z6ka"
class CommManager {
public:
    void start();
private:
    static void taskEntry(void* arg);
    void run();

    TaskHandle_t task_;
};
```

Static entry:

```cpp id="v3rx7m"
void CommManager::taskEntry(void* arg) {
    static_cast<CommManager*>(arg)->run();
}
```

Tidak ada global task function.

---

### ISR Boundary Example

```cpp id="5c9r1u"
void IRAM_ATTR gpio_isr_handler(void* arg) {
    BaseType_t higher_woken = pdFALSE;
    xTaskNotifyFromISR(control_task_handle, 0, eNoAction, &higher_woken);
    if (higher_woken) {
        portYIELD_FROM_ISR();
    }
}
```

ISR tidak tahu Service atau App.

---

### Thread Domain Definition

Misal:

- SensorService → hanya di ControlTask
- CommManager → hanya di CommTask
- LogService → queue based, diproses di LogTask

Akses lintas task → lewat queue, bukan direct call.

---

## 5. Constraint & Embedded Impact

### RAM Impact

- Task stack harus dihitung.
- Mutex menambah kecil overhead.

### Flash Impact

- Wrapper task kecil.

### Stack Impact

- CommTask harus lebih besar (TLS stack heavy).
- ControlTask minimal tapi stabil.

### Determinism Impact

- Control loop tidak boleh terganggu traffic MQTT.
- ISR harus konstan waktu eksekusi.

Kesimpulan:
Concurrency harus domain-isolated.

---

## 6. Failure Scenario

### Scenario 1

CommTask lock mutex saat TLS handshake
ControlTask menunggu mutex
→ Control jitter
→ Relay switching delay

Dengan rule:
ControlTask tidak share object tanpa domain jelas.

---

### Scenario 2

ISR panggil Service langsung
→ Mutex diambil dalam ISR
→ Deadlock

Dengan rule:
ISR hanya notify.

---

### Scenario 3

Object dipakai dua task tanpa proteksi
→ Race sporadis
→ Bug sulit direproduksi

Dengan rule:
Domain thread defined.

---

## 7. Anti-Pattern

❌ ISR call service
❌ Mutex public
❌ Task spawn di dalam callback
❌ Object shared tanpa policy
❌ Blocking call di ControlTask

Dampak:

- Jitter
- Deadlock
- Watchdog reset

---

## 8. Freeze Point

Setelah Artikel 5, keputusan berikut dianggap final:

- Task ownership explicit.
- ISR boundary strict.
- ControlTask domain terisolasi.
- Object tidak boleh multi-task tanpa policy.
- Mutex tidak diexpose.

Concurrency baseline tidak boleh berubah.

---

## 9. Engineering Checklist

- Apakah ISR memanggil service?
- Apakah object dipakai >1 task?
- Apakah mutex private?
- Apakah ControlTask blocking?
- Apakah task priority sudah sistemik?

Jika melanggar → tidak sesuai Artikel 5.

---

## 10. Summary (5 Bullet Maksimal)

- OOP tidak menyelesaikan race condition.
- Concurrency boundary harus eksplisit.
- ISR hanya notify, tidak logic.
- Control loop harus domain-terisolasi.
- Setelah ini, task model tidak boleh berubah.

---

Baik.
Sekarang kita masuk domain yang paling sering merusak layering dan determinism:

> **Communication Architecture (WiFi, MQTT, OTA)**

Ini titik di mana banyak firmware “bersih” tiba-tiba menjadi coupled lagi.

---

# 📘 Artikel 6

**Judul:** Communication Module Design (WiFi, MQTT, OTA) yang Tidak Coupled
**Posisi:** Artikel 6 dari 8
**Domain Keputusan:** Communication Architecture
**Status Lock:** 🔒 Communication Boundary & State Machine Freeze

---

## 1. Problem Reality

Setelah Artikel 5:

- Layering sudah rapi
- Allocation sudah disiplin
- Concurrency sudah terkunci

Masalah muncul ketika komunikasi ditambahkan:

- WiFi event handler mengubah state aplikasi langsung
- MQTT callback memanggil ActuatorService
- OTA logic tersebar
- Reconnect logic copy-paste di banyak tempat
- Credential literal tersebar di file berbeda

Gejala produksi:

- Device stuck di reconnect loop
- Control terganggu saat TLS handshake
- OTA gagal → device brick
- Bug hanya muncul saat broker restart

Masalahnya bukan MQTT.

Masalahnya: **communication tidak diperlakukan sebagai domain terisolasi.**

---

## 2. Root Cause Analysis

Akar masalah:

1. Transport layer bercampur business logic.
2. Tidak ada state machine formal.
3. Reconnect logic tidak terpusat.
4. Command dari cloud bypass control guard.
5. Credential tidak dienkapsulasi.

Dependency chaos tipikal:

```text id="y1smxo"
MQTT callback → ActuatorService
WiFi event → ControlApp
OTA event → global flag
```

Communication menjadi pusat coupling baru.

---

## 3. Design Principle (Rule yang Dikunci)

Artikel ini mengunci arsitektur komunikasi final.

---

### 🔒 Rule 1 — CommManager Mandatory

Semua komunikasi harus melalui:

> CommManager

Tidak boleh:

- App publish langsung MQTT
- Service subscribe langsung

---

### 🔒 Rule 2 — Transport ≠ Business Logic

Pisahkan:

- Transport layer (WiFi, MQTT client)
- Protocol handling
- Business command handling

CommManager hanya expose interface netral.

---

### 🔒 Rule 3 — State Machine Wajib

Reconnect dan connection state harus:

- Berbasis state machine eksplisit
- Bukan if-else tersebar

State minimal:

```text id="d3lq4r"
INIT
→ WIFI_CONNECTING
→ WIFI_CONNECTED
→ MQTT_CONNECTING
→ MQTT_CONNECTED
→ ERROR_BACKOFF
```

Tidak boleh implicit state.

---

### 🔒 Rule 4 — Offline-Safe Policy

Jika WAN down:

- Control loop tetap jalan
- Telemetry dibuffer (Hybrid RAM + snapshot)
- Tidak blocking control

---

### 🔒 Rule 5 — Credential Encapsulation

- Credential hanya ada di satu modul.
- Tidak literal tersebar.
- Tidak diakses langsung App.

---

### 🔒 Rule 6 — OTA Guarded Execution

OTA hanya boleh:

- Di-trigger melalui CommManager
- Diverifikasi
- Tidak langsung apply tanpa guard

---

Setelah Artikel 6:
❌ Tidak boleh reconnect tersebar
❌ Tidak boleh business logic tahu MQTT detail
❌ Tidak boleh bypass CommManager
❌ Tidak boleh credential tersebar

Communication boundary final.

---

## 4. Implementation Pattern (ESP32 Context)

### CommManager Skeleton

```cpp id="m4u8tz"
class CommManager {
public:
    void start();
    void publishTelemetry(const TelemetryData& data);
    void registerCommandHandler(ICommandHandler& handler);

private:
    void run();
    void handleStateMachine();
};
```

App tidak tahu MQTT topic detail.

---

### Command Handling Pattern

```cpp id="l5kr2a"
class ICommandHandler {
public:
    virtual void onCommand(const Command& cmd) = 0;
};
```

CommManager menerima MQTT payload → parse → kirim ke handler.

Handler berada di Application layer.

---

### Offline Buffer Policy

- Ring buffer fixed size
- Snapshot periodik ke NVS
- Publish backlog dengan rate limit saat reconnect

Tidak boleh publish burst tak terbatas.

---

## 5. Constraint & Embedded Impact

### RAM Impact

- MQTT buffer static/fixed
- Ring buffer bounded
- TLS stack tetap zona heap terbatas

### Flash Impact

- State machine logic menambah sedikit flash

### Stack Impact

- CommTask harus cukup besar untuk TLS
- ControlTask tidak boleh memanggil publish blocking

### Determinism Impact

- Reconnect exponential backoff
- Tidak ada blocking call di ControlTask

Communication tidak boleh merusak determinism.

---

## 6. Failure Scenario

### Scenario 1

Broker restart
→ MQTT disconnect
→ Reconnect logic tersebar
→ Device stuck

Dengan rule:
State machine tunggal.

---

### Scenario 2

MQTT callback ubah relay langsung
→ Bypass safety guard
→ Relay chatter

Dengan rule:
Callback → CommandHandler → Service → Guard.

---

### Scenario 3

WAN down lama
→ Telemetry hilang
→ Data gap audit

Dengan rule:
Hybrid buffer + snapshot.

---

### Scenario 4

OTA tanpa verifikasi
→ Firmware corrupt
→ Device brick

Dengan rule:
OTA guarded & verified.

---

## 7. Anti-Pattern

❌ App publish langsung via MQTT client
❌ Service subscribe topic langsung
❌ Reconnect logic copy-paste
❌ Credential literal di banyak file
❌ OTA dipanggil langsung dari callback

Dampak:

- Coupling tinggi
- Redesign mahal
- Security risk

---

## 8. Freeze Point

Setelah Artikel 6, keputusan berikut dianggap final:

- Semua komunikasi lewat CommManager.
- State machine eksplisit wajib.
- Offline buffering hybrid final.
- Credential encapsulated.
- OTA guarded via CommManager.

Communication architecture tidak boleh berubah.

---

## 9. Engineering Checklist

- Apakah ada publish langsung tanpa CommManager?
- Apakah reconnect tersebar?
- Apakah credential tersebar?
- Apakah control tahu MQTT detail?
- Apakah OTA bypass state machine?

Jika ya → melanggar Artikel 6.

---

## 10. Summary (5 Bullet Maksimal)

- Communication adalah domain terisolasi.
- CommManager adalah boundary wajib.
- State machine eksplisit, bukan implicit.
- Offline-safe adalah mandatory.
- Setelah ini, komunikasi tidak boleh mengubah layering.

---

Baik.
Sekarang kita masuk domain yang menentukan apakah firmware ini benar-benar **production-grade** atau hanya “rapi secara struktur”.

> **Reliability, Error Model, Fail-Safe, Observability**

---

# 📘 Artikel 7

**Judul:** Production Reliability Design dengan C++
**Posisi:** Artikel 7 dari 8
**Domain Keputusan:** Reliability & Error Model
**Status Lock:** 🔒 Reliability & Error Handling Freeze

---

## 1. Problem Reality

Setelah Artikel 6:

- Layering terkunci
- Memory terkendali
- Concurrency terkendali
- Communication terisolasi

Masalah produksi yang tersisa:

- Device hang tanpa log jelas
- Watchdog reset tanpa root cause
- Error hanya di-print ke serial
- Command gagal tapi tidak terpropagasi
- Device “fail-open” (relay tetap ON saat error)

Gejala lapangan:

- “Kadang mati sendiri”
- “Kadang tidak kirim data”
- “Kadang relay tidak sesuai status”

Masalahnya bukan arsitektur lagi.

Masalahnya: **tidak ada model reliability formal.**

---

## 2. Root Cause Analysis

Akar masalah:

1. Error tidak memiliki model propagation.
2. Tidak ada status sistem global yang terdefinisi.
3. Watchdog tidak memiliki owner.
4. Fail-safe state tidak eksplisit.
5. Logging tidak terstruktur.

Firmware bisa “rapi”, tapi tidak bisa diaudit.

---

## 3. Design Principle (Rule yang Dikunci)

Artikel ini mengunci reliability baseline final.

---

### 🔒 Rule 1 — Error Propagation via Explicit Status

Semua fungsi penting harus:

- Return enum status
  atau
- Update internal error state

Tidak boleh:
❌ Silent failure
❌ Exception

---

### 🔒 Rule 2 — No Exception

Exception dilarang (konsisten dengan Artikel 3).

Error flow harus eksplisit dan bisa dilacak.

---

### 🔒 Rule 3 — Watchdog Encapsulated

Watchdog:

- Dikelola satu class (HealthService)
- Clear owner
- Tidak tersebar feed di banyak tempat tanpa aturan

---

### 🔒 Rule 4 — Fail-Safe State Mandatory

Jika error kritikal terjadi:

- System masuk state FAILSAFE
- Relay ke default aman
- Control loop tetap jalan dalam mode terbatas

Tidak boleh fail-open.

---

### 🔒 Rule 5 — Logging via Interface Only

Tidak boleh:

- printf langsung di semua file
- Logging blocking di ControlTask

Harus:

- Logging interface
- Bisa redirect (Serial / MQTT / disable)
- Non-blocking via queue

---

### 🔒 Rule 6 — Health Telemetry Mandatory

Minimal health metrics:

- reset_reason
- heap_min_free
- backlog_depth
- wifi_state
- error_code

Harus masuk telemetry.

---

Setelah Artikel 7:
❌ Tidak boleh direct printf liar
❌ Tidak boleh exception
❌ Tidak boleh silent failure
❌ Tidak boleh fail-open control

Reliability baseline final.

---

## 4. Implementation Pattern (ESP32 Context)

### Error Enum Pattern

```cpp id="3pn7ty"
enum class Status {
    OK,
    SENSOR_ERROR,
    COMM_ERROR,
    STORAGE_ERROR,
    INTERNAL_ERROR
};
```

Service method:

```cpp id="7t9qsf"
Status SensorService::update() {
    if (!driver_.isReady()) {
        return Status::SENSOR_ERROR;
    }
    ...
    return Status::OK;
}
```

App memutuskan transisi state.

---

### HealthService Skeleton

```cpp id="b2k8yv"
class HealthService {
public:
    void feedWatchdog();
    void reportError(Status s);
    Status currentError() const;

private:
    Status last_error_;
};
```

Watchdog tidak di-feed sembarang tempat.

---

### Fail-Safe Pattern

```cpp id="x8l3dr"
if (health.currentError() != Status::OK) {
    actuator.enterFailSafe();
}
```

Fail-safe eksplisit, bukan implicit.

---

### Logging Abstraction

```cpp id="c6p4we"
class ILogger {
public:
    virtual void log(LogLevel level, const char* msg) = 0;
};
```

ControlTask tidak boleh blocking log.

---

## 5. Constraint & Embedded Impact

### RAM Impact

- Error enum kecil
- Logging queue bounded

### Flash Impact

- Logging abstraction tambah flash sedikit

### Stack Impact

- Logging via queue → minimal stack

### Determinism Impact

- Error flow eksplisit
- Control loop tetap berjalan walau komunikasi mati

Reliability meningkatkan observability tanpa merusak determinism.

---

## 6. Failure Scenario

### Scenario 1

Sensor gagal baca
→ Tanpa error model: relay tetap aktif
→ Potensi kerusakan

Dengan rule:
Error → FAILSAFE → relay safe state.

---

### Scenario 2

Heap hampir habis
→ TLS gagal
→ Device stuck

Dengan rule:
heap_min_free masuk telemetry → bisa dideteksi sebelum crash.

---

### Scenario 3

Watchdog di-feed sembarang tempat
→ Deadlock tidak terdeteksi
→ Device freeze permanen

Dengan rule:
Watchdog feed terkontrol.

---

### Scenario 4

Logging blocking di ControlTask
→ Jitter control
→ Watchdog reset

Dengan rule:
Logging via queue non-blocking.

---

## 7. Anti-Pattern

❌ printf liar di semua file
❌ Exception handling
❌ Silent catch-all
❌ Fail-open relay
❌ Watchdog feed di banyak tempat
❌ Tidak ada health telemetry

Dampak:

- Tidak bisa audit
- Tidak bisa diagnosa
- Uptime tidak terjamin

---

## 8. Freeze Point

Setelah Artikel 7, keputusan berikut dianggap final:

- Error propagation eksplisit via status.
- No exception.
- Watchdog encapsulated.
- Fail-safe mandatory.
- Logging via interface.
- Health telemetry wajib.

Reliability architecture tidak boleh berubah.

---

## 9. Engineering Checklist

- Apakah ada fungsi critical tanpa return status?
- Apakah ada silent failure?
- Apakah relay punya default safe state?
- Apakah watchdog di-feed sembarang?
- Apakah health metric masuk telemetry?

Jika ya → melanggar Artikel 7.

---

## 10. Summary (5 Bullet Maksimal)

- Firmware rapi belum tentu reliable.
- Error harus eksplisit, bukan tersembunyi.
- Fail-safe bukan opsional.
- Watchdog harus punya owner.
- Observability adalah bagian dari arsitektur.

---

Baik.
Ini artikel terakhir dan fungsinya bukan menambah fitur, tetapi:

> Menguji dan mengaudit semua keputusan yang sudah dikunci.

Artikel 8 adalah guardrail final.

---

# 📘 Artikel 8

**Judul:** Anti-Pattern: Cara OOP Menghancurkan Embedded System
**Posisi:** Artikel 8 dari 8
**Domain Keputusan:** Guardrail & Production Audit
**Status Lock:** Final Audit — Tidak Mengubah Arsitektur

---

## 1. Problem Reality

Setelah semua arsitektur dikunci (Artikel 2–7),
bahaya terbesar bukan lagi spaghetti procedural.

Bahaya terbesar adalah:

> OOP yang digunakan secara berlebihan atau tidak disiplin.

Gejala nyata di produksi:

- Firmware terlihat “modern”
- Banyak class, banyak interface
- Banyak template
- Banyak virtual
- Tapi:

  - Heap tidak stabil
  - Stack meledak
  - Latency tidak deterministik
  - OTA kadang gagal
  - Race condition sulit dilacak

Firmware menjadi kompleks bukan karena C,
tetapi karena **OOP tidak dikontrol.**

---

## 2. Root Cause Analysis

Akar kehancuran biasanya:

1. Abstraction berlebihan.
2. Dynamic polymorphism tidak perlu.
3. Template overengineering.
4. Hidden allocation (string, container).
5. Singleton global terselubung.
6. Exception flow tersembunyi.
7. Logging dan monitoring tidak konsisten.

OOP tanpa constraint → chaos versi baru.

---

## 3. Design Principle (Rule yang Dikunci)

Artikel 8 tidak menambah rule baru.
Artikel ini menguatkan guardrail final.

---

### 🔒 Rule 1 — Abstraction Must Justify Cost

Setiap abstraction harus menjawab:

- Apa problem nyata yang diselesaikan?
- Apa impact RAM?
- Apa impact stack?
- Apa impact determinism?

Jika tidak jelas → jangan pakai.

---

### 🔒 Rule 2 — No Virtual Abuse

Dynamic polymorphism hanya jika benar-benar perlu.

Tidak boleh:

- Virtual untuk “future extensibility”
- Virtual di hot path control loop

---

### 🔒 Rule 3 — No Template Overengineering

Tidak boleh:

- Template metaprogramming berat
- Generic container kompleks
- Policy-based design yang membingungkan tim

Firmware ≠ library generik.

---

### 🔒 Rule 4 — Hidden Heap is Forbidden

Waspada terhadap:

- std::string
- std::function
- std::vector growth
- Library yang alokasi diam-diam

Semua harus diaudit.

---

### 🔒 Rule 5 — Audit Before Feature

Sebelum menambah fitur baru:

- Cek layering
- Cek allocation
- Cek concurrency
- Cek communication boundary
- Cek fail-safe

Jika melanggar rule sebelumnya → redesign dulu.

---

## 4. Implementation Pattern (ESP32 Context)

### Contoh Virtual Abuse

```cpp
class IRelay {
public:
    virtual void set(bool on) = 0;
};
```

Jika hanya ada satu implementasi dan tidak pernah berubah →
virtual tidak memberi nilai, hanya cost.

Lebih baik concrete class langsung.

---

### Contoh Hidden Allocation

```cpp
std::string payload = buildJson();
```

Di embedded:

- Allocation tersembunyi
- Fragmentation
- Tidak deterministik

Lebih baik:

- Static buffer
- snprintf bounded

---

### Contoh Singleton Terselubung

```cpp
Logger::instance().log("...");
```

Hidden global state.

Melanggar Artikel 2.

---

## 5. Constraint & Embedded Impact

### RAM Impact

- Virtual table tambah RAM.
- Template instantiation tambah flash.

### Flash Impact

- Template heavy → bloat signifikan.
- Debug sulit.

### Stack Impact

- Exception + virtual chain → stack tidak terprediksi.

### Determinism Impact

- Dynamic dispatch tidak selalu masalah,
  tapi jika di control loop → latency tidak konsisten.

Embedded = environment dengan batas keras.

---

## 6. Failure Scenario

### Scenario 1

Template heavy logging
→ Flash penuh
→ OTA gagal karena tidak muat

---

### Scenario 2

Virtual dispatch di ControlTask
→ Latency spike saat traffic tinggi
→ Jitter control

---

### Scenario 3

std::string di MQTT payload
→ Fragmentation setelah 3 minggu
→ TLS handshake gagal

---

### Scenario 4

Singleton logger + multi-task
→ Race condition
→ Crash sporadis

---

## 7. Anti-Pattern (Red Flag List)

Ini daftar audit final:

❌ Virtual di hot path
❌ Template kompleks tanpa kebutuhan nyata
❌ std::string heavy
❌ std::function di callback kritikal
❌ Hidden allocation
❌ Singleton
❌ Circular dependency
❌ Exception
❌ Destructor logic kompleks
❌ Logging blocking

Jika 3+ muncul → firmware berisiko tinggi.

---

## 8. Freeze Point

Setelah Artikel 8:

Tidak ada rule baru.

Yang dianggap final:

- Dependency discipline (Artikel 2)
- Memory discipline (Artikel 3)
- Layering freeze (Artikel 4)
- Concurrency boundary (Artikel 5)
- Communication boundary (Artikel 6)
- Reliability model (Artikel 7)

Artikel 8 hanya mengaudit dan menjaga.

---

## 9. Engineering Checklist (Production Audit)

Gunakan ini sebelum release:

### Dependency

- Tidak ada global mutable.
- Tidak ada singleton.

### Memory

- Tidak ada new/delete liar.
- Heap watermark stabil.
- Tidak ada growable container.

### Architecture

- Dependency DAG.
- Tidak ada upward call.

### Concurrency

- ISR hanya notify.
- Task domain jelas.
- ControlTask tidak blocking.

### Communication

- Semua lewat CommManager.
- State machine eksplisit.
- Credential terisolasi.

### Reliability

- Error enum eksplisit.
- Fail-safe state ada.
- Health telemetry aktif.

Jika semua lulus → firmware siap produksi.

---

## 10. Summary (5 Bullet Maksimal)

- OOP bisa menyelamatkan firmware — atau menghancurkannya.
- Abstraction tanpa constraint adalah bahaya.
- Hidden allocation adalah silent killer.
- Audit lebih penting dari fitur.
- Disiplin arsitektur adalah kunci umur 3–5 tahun.

---

# Final Status Seri

Sekarang seri memiliki:

✔ Dependency Discipline
✔ Memory Discipline
✔ Layered Architecture
✔ Concurrency Boundary
✔ Communication Isolation
✔ Reliability Model
✔ Audit Guardrail

Semua konsisten dengan reference firmware.

---

Jika Anda mau, langkah terakhir yang sangat profesional adalah:

> Buat 1 halaman “Series Architecture Overview”
> yang merangkum seluruh 8 artikel dalam satu diagram final.

Itu akan membuat seri ini benar-benar level B.
