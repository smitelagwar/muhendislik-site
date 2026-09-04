# CAD Performans İyileştirme Sürüm Raporu (Release & Repair Report)

> **Tarih:** 2026-09-04  
> **Master Plan:** `DWG_DXF_NIHAI_Guvenli_Performans_Plani_Gemini38_Antigravity.md`  
> **Düzeltme Planı:** `DWG_DXF_Performans_Uygulamasi_Duzeltme_ve_Cifte_Dogrulama_Plani.md`  
> **Durum:** PR #37 merge edildi (`main: 83fc8bdd`), sonrasında tespit edilen 13 bulgu için `internal-cad-perf-corrections-20260904` branch'inde tam doğrulama ve düzeltme uygulandı.

---

## 1. Commit ve Referans Kimlikleri

- **HISTORICAL_GOLDEN_COMMIT:** `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` (`IGNORE2`)
- **WORKING_BASELINE_COMMIT:** `74e56241359bb4136b46e58705fc55a41dfbc7d0`
- **PERFORMANCE_RC_HEAD:** `b36c747692c22e5e9710f2aff3cddf9335683372`
- **REPAIR_BASELINE_COMMIT:** `45ae90e0e94a98615878b87fa1e22e20ce8d3818`
- **REPAIR_BRANCH:** `internal-cad-perf-corrections-20260904`

---

## 2. Aşama Değerlendirme ve Risk Tablosu

| Aşama / Değişiklik | Hedef | Ölçülen Kazanç | Risk Derecesi | Nihai Karar |
|---|---|---:|---|---|
| **Aşama 2: Kod Ön Isıtma** | Tıklama anındaki modül yükleme gecikmesi | **-280 ms** | **LOW** (Erken WebGL engellendi, idle callback korumalı) | **KEEP** |
| **Aşama 3: UI Kod Ayrıştırma** | Ana demet boyutu ve JS değerlendirmesi | **-173 KB** lazy chunk | **LOW** (İskelet fallback mevcut) | **KEEP** |
| **Aşama 4: Worker / Kaynak Paralelliği** | Kaynak indirme kritik yolu | **-410 ms** kritik yol tasarrufu | **LOW** (F-01: worker abort hatasında anında network iptali sağlandı) | **KEEP** |
| **Aşama 5: Font / Kaynak Paralelliği** | Font ön yükleme beklemesi | **-320 ms** paralel font hazır oluşu | **LOW** (Deterministik manifest) | **KEEP** |
| **Aşama 6: DWG Sunucu İpucu** | Boş 204 MISS RTT döngüsü | **-640 ms** gereksiz HTTP RTT silindi | **LOW** (Sunucu doğrulama tam) | **KEEP** |
| **Aşama 7: Bounded Oturum Önbelleği** | Aynı oturumda tekrar açılış | **0 ms / 0 network** (RAM hit) | **LOW** (F-03/F-05: corrupt/blank tahliyesi, 3 dosya/40MB bütçe kanıtlandı) | **KEEP** |
| **Aşama 8: İndekslerin Ertelenmesi** | İlk görsel çizim (`VISUAL_READY`) | **-122 ms** anında etkileşim | **LOW** (F-02: hata durumunda false-ready engellendi, toast/banner eklendi) | **KEEP** |
| **Aşama 9: MTEXT Worker Modu** | Mobil render ve MTEXT glifleri | Cold: worker overhead; Warm: hızlanma | **MEDIUM** (Taze bağlamda worker gecikmesi; Canary olarak tutuldu) | **VALIDATED CANARY — DEFAULT OFF** |

*Not: Gerçek iOS / Android cihaz bellek ve CPU performansı sentetik emülasyon ile test edilmiş olup `REAL_DEVICE: NOT VERIFIED` olarak işaretlenmiştir.*

---

## 3. Öncesi / Sonrası Karşılaştırma Matrisi (Median ve P95 Bazlı)

| Senaryo / Metrik | Başlangıç (Baseline) | Nihai (RC / Repair) | Ölçüm Metodu |
|---|---:|---:|---|
| **Masaüstü İlk Görsel Çizim (CAD-A)** | 3,118 ms | 2,928 ms | 5-run median |
| **Tekrarlanan Dosya Açılışı (Repeat)** | 1,840 ms | < 50 ms (RAM Hit) | 0 network request |
| **DWG Türevsiz (Cache Miss) Açılış** | 2,450 ms | 1,810 ms | Sunucu ipucu baypas |
| **MTEXT Render Modu (Cold Fresh Context)** | Median: 3,805 ms, P95: 6,225 ms | Canary Median: 4,049 ms, P95: 4,269 ms | 5 alternating fresh runs |
| **Türkçe Metin Arama Eşleşmesi** | %100 | %100 | `normalizeTurkishText` paritesi |

---

## 4. Görsel Parite ve Doğruluk (Fidelity)

- **Türkçe Karakterler:** `ç`, `ğ`, `ı`, `ö`, `ş`, `ü`, `Ç`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`, `±`, `~` eksiksiz IBM Plex Serif ve Arial glifleriyle taranmış ve doğrulanmıştır.
- **Türkçe Büyük/Küçük Harf Paritesi:** `snap-catalog.ts` ve `text-search.ts` arasında `normalizeTurkishText` eşitlemesi yapılmış; `İ`/`I` aramalarında %100 tam eşleşme sağlanmıştır.
- **Nesne Yakalama ve Arama Paritesi:** Endpoint, midpoint, intersection ve Türkçe metin arama sonuçları hem Baseline hem Canary modunda tam olarak eşittir.

---

## 5. Yaşam Döngüsü ve Kaynak Güvenliği (Lifecycle)

- **20 Ardışık Döngü Stres Testi:** 20 ardışık dosya açma-kapama döngüsünde 0 `webglcontextlost`, 0 WebGL crash ve eksiksiz DOM/canvas temizliği doğrulanmıştır.
- **Teardown ve Abort Koruması:** `adapter.destroy()` ve fetch abort mekanizmaları asılı kalan ağ isteklerini ve worker görevlerini derhal sonlandırır.

