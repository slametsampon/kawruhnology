```markdown
# 📘 Article Template

## ESP32 Distributed Systems Engineering Handbook Series (EDSEH - Series)

> Template ini WAJIB digunakan untuk semua artikel dalam seri.  
> Tidak boleh menghapus bagian.  
> Tidak boleh mengubah urutan utama.  
> Semua section harus terisi secara eksplisit.

---

# [ARTICLE TITLE]

**Module:** [Module Name]  
**Level:** [Device / Reliability / Site / Global / DevOps / Failure Engineering]  
**Layer Focus:** [Node / Site / Global / Lifecycle]  
**Related Modules:** [List referensi silang]

---

# 1. Context & System Boundary

## 1.1 Problem Statement

- Apa masalah teknis yang dibahas?
- Di kondisi produksi seperti apa masalah ini muncul?
- Kenapa topik ini penting dalam sistem multi-site?

---

## 1.2 System Boundary

- Layer yang dibahas
- Node → Site → Global interaction
- Dependency upstream
- Dependency downstream

Contoh format:
```

Node Layer → [Komponen]
Site Layer → [Komponen]
Global Layer → [Komponen]
External → ISP / CA / NTP / Cloud Provider

```

---

## 1.3 Posisi dalam Arsitektur Global

- Apakah ini bagian dari:
  - Reliability chain?
  - Security chain?
  - OTA lifecycle?
  - Observability stack?
  - Data consistency model?

Jelaskan hubungan lintas modul.

---

## 1.4 Diagram Arsitektur (WAJIB jika >2 komponen)

Deskripsikan:

- Komponen utama
- Alur data
- Boundary site vs global
- Dependency eksternal

---

# 2. Technical Core

## 2.1 Konsep Teknis

- Penjelasan detail mekanisme
- Flow sequence (step-by-step)
- Trade-off desain

---

## 2.2 Dependency Chain

- Komponen yang terpengaruh
- Konsekuensi jika konfigurasi berubah
- Dampak ke modul lain

---

## 2.3 Constraint Teknis Eksplisit

- Memory overhead
- CPU load
- TLS handshake impact
- Flash usage
- Task scheduling impact

Semua constraint harus kuantitatif jika memungkinkan.

---

## 2.4 Opsi Desain & Trade-Off

### Opsi A
- Benefit:
- Risiko:
- Cocok untuk kondisi:

### Opsi B
- Benefit:
- Risiko:
- Cocok untuk kondisi:

Jelaskan keputusan desain yang direkomendasikan.

---

# 3. Resource Constraint Analysis

Wajib bahas:

## 3.1 RAM
- Estimasi penggunaan
- Peak scenario
- Fragmentation risk

## 3.2 Flash
- Partition impact
- Log storage
- OTA slot impact

## 3.3 Bandwidth
- Per message size
- Per device estimate
- Per site estimate

## 3.4 Latency
- Normal WAN
- High latency scenario
- Jitter impact

## 3.5 Power
- Impact pada deep sleep
- Brownout risk
- Recovery behavior

---

# 4. Failure Scenario (Minimal 3)

## Scenario 1 – [Nama]

- Trigger
- Dampak langsung
- Dampak sistemik (Node / Site / Global)
- Risiko propagation

---

## Scenario 2 – [Nama]

- Trigger
- Dampak langsung
- Dampak sistemik
- Risiko propagation

---

## Scenario 3 – [Nama]

- Trigger
- Dampak langsung
- Dampak sistemik
- Risiko propagation

---

## (Opsional) Scenario Tambahan

- WAN down 8 jam
- TLS expire
- Broker overload
- Memory leak
- NTP drift
- OTA corrupt
- Partition mismatch
- Certificate revocation

---

# 5. Recovery Strategy

## 5.1 Recovery Mode

- Automatic?
- Manual intervention?
- Hybrid?

---

## 5.2 Idempotency Strategy

- Duplicate message handling?
- Replay protection?
- Safe command execution?

---

## 5.3 Safe-State Design

- Apa kondisi aman saat sistem gagal?
- Apakah local control tetap berjalan?
- Apakah site tetap autonomous?

---

## 5.4 Rollback Strategy

- Firmware rollback?
- Config rollback?
- Certificate rollback?

---

# 6. Monitoring Signal

## 6.1 Metrics

- Metric name
- Threshold
- Per-node atau per-site?

Contoh:
- reconnect_count
- heap_minimum
- tls_handshake_fail
- buffer_usage_percent

---

## 6.2 Logs

- Structured log format?
- Severity level?
- Centralized atau local?

---

## 6.3 Alerting

- Threshold
- Escalation path
- Blast radius impact

---

## 6.4 Observability Scope

- Node-level
- Site-level
- Global-level

---

# 7. Security Consideration (WAJIB jika relevan)

- Impact terhadap identity
- Impact terhadap TLS
- Impact terhadap certificate lifecycle
- Impact terhadap OTA signing
- Attack surface change

---

# 8. Production Deployment Note

## 8.1 Rollout Strategy

- Canary site?
- Batch size?
- Gradual scaling?

---

## 8.2 Backward Compatibility

- Compatible dengan versi sebelumnya?
- Breaking change?

---

## 8.3 Blast Radius Impact

- Node-level
- Site-level
- Global-level

---

## 8.4 Risk Level

- Low
- Medium
- High

Jelaskan alasan klasifikasi.

---

# 9. Cross-Reference

Artikel ini berhubungan dengan:

- [Module X – Topic]
- [Module Y – Topic]
- [Module Z – Topic]

---

# 10. Key Engineering Takeaway

Ringkasan dalam 5–10 poin:

- Apa insight produksi terpenting?
- Apa kesalahan umum?
- Apa batas sistem yang paling sering dilupakan?

---

# Writing Governance Reminder

## ❌ Tidak Boleh

- Artikel tutorial basic tanpa konteks sistem
- Contoh hanya single-node
- Tanpa minimal 3 failure scenario
- Tanpa constraint analysis
- Mengabaikan security lifecycle
- Mengasumsikan network ideal

---

## ✅ Wajib

- Gunakan studi kasus global (5 site, 150–300 node/site)
- Jelaskan dampak lintas boundary
- Cantumkan mode degradasi
- Hubungkan ke modul lain
- Bahas security chain jika relevan
- Berorientasi produksi, bukan demo

---

**Template Version:** v1.0
**Series:** esp32-distributed-systems-engineering-handbook
```
