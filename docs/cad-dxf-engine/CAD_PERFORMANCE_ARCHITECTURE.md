# CAD Performance Architecture Contract

> **Durum:** Dondurulmuş / Release Candidate Referansı  
> **Tarih:** 2026-09-04  
> **Kapsam:** Mobil Öncelikli ve Sıfır Regresyonlu CAD Önizleme Performans Mimarisi  

---

## 1. Temel Taahhütler ve Çekirdek Referanslar

| Parametre | Değer / Karşılık | Rasyonel |
|---|---|---|
| **HISTORICAL_GOLDEN_COMMIT** | `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` (`IGNORE2`) | Repo geçmişindeki dokunulmaz altın motor standardı. |
| **WORKING_BASELINE_COMMIT** | `74e56241359bb4136b46e58705fc55a41dfbc7d0` | Bu performans çalışmasının başlatıldığı çalışan doğrulanmış durum. |
| **RELEASE_CANDIDATE_BRANCH** | `internal-cad-perf-20260904` | 10 aşamalı planın tüm adımlarının tamamlandığı aday branch. |

---

## 2. Mimari Sözleşmeler ve Yaşam Döngüsü

### 2.1. Önceden Isıtma (Preload) Sözleşmesi
- **Eager WebGL Yasağı:** Dosya listesinde gezinirken veya imleç CAD dosyası üzerine geldiğinde **asla** WebGL bağlamı, canvas veya `AcApDocManager` oluşturulmaz.
- **Güvenli Isıtma:** Yalnızca JS kod blokları (`import("./cad-runtime-orchestrator")` ve `preloadCadViewerCode()`) rölantide (`requestIdleCallback`) belleğe alınır.
- **Sıfır Kaydırma Takılması:** Liste kaydırması sırasında CPU/GPU kilitlenmesi yaşanmaz.

### 2.2. Eşzamanlı Worker ve Font Hazırlık Sözleşmesi
- **Worker & Kaynak İndirme Örtüşmesi:** Worker dosyaları (`mtext-renderer-worker.js`, `libredwg-parser-worker.js`, `libredwg-web.wasm`) ağdan doğrulanırken, CAD kaynak dosyası eşzamanlı (`Promise.all`) indirilir; seri bekleme ortadan kaldırılmıştır.
- **Font & Akış Örtüşmesi:** Belirlenmiş font manifestosu (`Arial-Regular`, `Arial-Bold`, `IBMPlexSerif-Regular`, `IBMPlexSerif-Bold`), kaynak akışı ile paralel olarak hazırlanır.

### 2.3. Sunucu Taraflı Türev (Derivative) Hazırlık İpucu
- Sunucu tarafında (`page.tsx`) dosyanın hazır DXF türevi olup olmadığı (`findReadyDwgDxfDerivativeForFile`) tespit edilir ve `hasReadyDerivative: true` olarak iletilir.
- İstemci, hazır türevi olmayan dosyalar için `/dwg-dxf` uç noktasına gereksiz boş 204 MISS gidiş-dönüşü (RTT) yapmaz; doğrudan DWG upstream akışına geçer (500–1200 ms tasarruf).

### 2.4. Bounded In-Memory Kaynak Önbelleği (Session Cache)
- **Sahiplik:** `src/lib/dokumantasyon/cad-runtime/session-cache.ts`
- **Revizyon Anahtarı:** `sourceVersionKey` (dosya ID'si + versiyon hash/timestamp). Dosya güncellendiğinde eski önbellek otomatik geçersiz kılınır (stale cache riski sıfır).
- **Kapasite ve Bütçe:**
  - Maksimum girdi sayısı: 3 dosya.
  - Maksimum toplam bellek: 40 MB.
  - Tekil dosya tavanı: 20 MB.
- **Tahliye (Eviction):** Monotonik sayaçlı katı LRU (Least Recently Used) mekanizması.

### 2.5. Görsel Hazır Olma ve Yardımcı İndeksler (Deferred Indexes)
- **Ayrım:** İlk çizim pikseli ve etkileşimi (`VISUAL_READY`), nesne yakalama (snap) ve metin arama indekslerinden ayrılmıştır.
- **Erken Etkileşim:** Kullanıcı çizimi anında kaydırabilir/yakınlaştırabilir.
- **Talep Doğrultusunda Hazır Olma:** Mesafe/alan ölçüm araçları tıklandığında `ensureSnapReady()` ile indeks derhal tamamlanır; kullanıcı tıklaması kaybolmaz.
- **Yarış Durumu Koruması:** `documentGeneration` monotonically artan token ile dosya geçişlerinde eski dosyanın indeksinin yeni dosyaya yazması engellenir.

### 2.6. MTEXT Worker Render Modu Kararı
- **Değerlendirme:** Aşama 9 kapsamında `useMainThreadDraw: false` modu, CAD-G Türkçe glifleri (`ç`, `ğ`, `ı`, `ö`, `ş`, `ü`, `Ç`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`, `±`, `~`) ve çok satırlı MTEXT üzerinde test edilmiştir.
- **Sonuç:** SHA256 piksel hash düzeyinde **birebir 100% eşitlik** (`ad9c66f...bfa`) ve mobilde **1,121 ms (%36) hızlanma** kanıtlanmıştır.
- **Karar:** `MTEXT WORKER: ACCEPT`. Varsayılan `options.useMainThreadDraw ?? !isCadMtextWorkerExperimentEnabled()` üzerinden güvenli geçişe izin verilmiştir.

---

## 3. Geri Alma (Rollback) Prosedürü

Herhangi bir beklenmeyen davranış durumunda aşama geri alma:

```bash
# Aşama 1 başlangıç referansına dönmek için:
git restore --source=74e56241359bb4136b46e58705fc55a41dfbc7d0 --staged --worktree -- \
  src/lib/dokumantasyon/cad-upstream/adapter.ts \
  src/components/dokumantasyon/preview/cad-upstream-viewer.tsx \
  src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx
```

Çekirdek motor altın referansına dönmek için:
```bash
git restore --source=909c59cb9dcac8e722b3bda4c66fd9d8a25755c8 --worktree -- \
  src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx \
  src/components/dokumantasyon/preview/cad-upstream-viewer.tsx \
  src/components/dokumantasyon/preview/cad-viewer.tsx \
  src/components/dokumantasyon/preview/dxf-viewer-worker.ts
```
