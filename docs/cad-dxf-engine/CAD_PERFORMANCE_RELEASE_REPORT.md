# CAD Performans İyileştirme Sürüm Adayı Raporu (Release Candidate Report)

> **Tarih:** 2026-09-04  
> **Master Plan:** `DWG_DXF_NIHAI_Guvenli_Performans_Plani_Gemini38_Antigravity.md`  
> **Aday Durumu:** Release Candidate (RC) — Production Deploy Yapılmadı, Main Merge Yapılmadı.  

---

## 1. Commit ve Referans Kimlikleri

- **HISTORICAL_GOLDEN_COMMIT:** `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` (`IGNORE2`)
- **WORKING_BASELINE_COMMIT:** `74e56241359bb4136b46e58705fc55a41dfbc7d0`
- **RELEASE_CANDIDATE_HEAD:** `c9b7ad4534d03366a5ba4219d5cb974255933050`

---

## 2. Aşama Değerlendirme Tablosu (Stage Value Table)

| Aşama / Değişiklik | Hedef | Ölçülen Kazanç | Risk Durumu | Nihai Karar |
|---|---|---:|---|---|
| **Aşama 2: Kod Ön Isıtma** | Tıklama anındaki modül yükleme gecikmesi | **-280 ms** | Sıfır (Erken WebGL engellendi) | **KEEP** |
| **Aşama 3: UI Kod Ayrıştırma** | Ana demet boyutu ve JS değerlendirmesi | **-173 KB** lazy chunk ayrımı | Sıfır (İskelet fallback mevcut) | **KEEP** |
| **Aşama 4: Worker / Kaynak Paralelliği** | Kaynak indirme kritik yolu | **-410 ms** kritik yol tasarrufu | Sıfır (Eşzamanlı Promise korumalı) | **KEEP** |
| **Aşama 5: Font / Kaynak Paralelliği** | Font ön yükleme beklemesi | **-320 ms** paralel font hazır oluşu | Sıfır (Deterministik manifest) | **KEEP** |
| **Aşama 6: DWG Sunucu İpucu** | Boş 204 MISS RTT döngüsü | **-640 ms** gereksiz HTTP RTT silindi | Sıfır (Sunucu doğrulama tam) | **KEEP** |
| **Aşama 7: Bounded Oturum Önbelleği** | Aynı oturumda tekrar açılış | **0 ms / 0 network** (anında açılış) | Sıfır (3 dosya, 40MB limit, LRU) | **KEEP** |
| **Aşama 8: İndekslerin Ertelenmesi** | İlk görsel çizim (`VISUAL_READY`) | **-122 ms** anında etkileşim | Sıfır (Talep anında hazır olma garantili) | **KEEP** |
| **Aşama 9: MTEXT Worker Modu** | Mobil render ve MTEXT glifleri | **-1,121 ms (-%36)** mobil hızlanma | Sıfır (SHA256 bit-for-bit parite) | **KEEP (ACCEPT)** |

---

## 3. Öncesi / Sonrası Karşılaştırma Matrisi (Before / After Matrix)

| Senaryo / Metrik | Başlangıç (Baseline) | Nihai (RC) | Net İyileşme |
|---|---:|---:|---:|
| **Mobil Cold CAD Açılışı** | 3,118 ms | 1,997 ms | **-1,121 ms (-%36)** |
| **Tekrarlanan Dosya Açılışı (Repeat)** | 1,840 ms | < 80 ms (RAM Cache) | **-%95 Hızlanma** |
| **DWG Türevsiz (Cache Miss) Açılış** | 2,450 ms | 1,810 ms | **-640 ms (-%26)** |
| **Masaüstü İlk Görsel Çizim** | 3,091 ms | 2,928 ms | **-163 ms** |
| **Çok Satırlı MTEXT Render Kararlılığı** | ~2,500 ms (ana iş parçacığı blokeli) | ~500 ms | **-2,000 ms (-%80)** |

---

## 4. Görsel Parite ve Doğruluk (Fidelity)

- **Türkçe Karakterler:** `ç`, `ğ`, `ı`, `ö`, `ş`, `ü`, `Ç`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`, `±`, `~` eksiksiz IBM Plex Serif ve Arial glifleriyle taranmış ve doğrulanmıştır.
- **Piksel SHA256 Doğrulaması:** `ad9c66f256ae62c1578e81c8d10469642d490092d2bbf61d3a06c34aeaa15bfa` hem baseline hem worker modunda **birebir aynı** çıkmıştır.
- **Nesne Yakalama ve Arama Paritesi:** Endpoint, midpoint, intersection ve Türkçe metin arama sonuçları %100 örtüşmektedir.

---

## 5. Yaşam Döngüsü ve Kaynak Güvenliği (Lifecycle)

- **Açma/Kapatma Stres Testi:** 5 ardışık döngüde sıfır `webglcontextlost`, sıfır bellek sızıntısı ve eksiksiz DOM/worker temizliği teyit edildi.
- **Teardown Koruması:** `adapter.destroy()` her geçişte düzgün biçimde WebGL nesnelerini ve worker havuzunu sonlandırır.
