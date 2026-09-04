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
- **Değerlendirme:** Aşama 9 ve Repair Fazı kapsamında `useMainThreadDraw: false` modu, CAD-G Türkçe glifleri (`ç`, `ğ`, `ı`, `ö`, `ş`, `ü`, `Ç`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`, `±`, `~`) ve çok satırlı MTEXT üzerinde izole taze bağlamlarda (fresh contexts) test edilmiştir.
- **Bulgular:** Taze tarayıcı bağlamlarında worker başlatma yükü nedeniyle Worker modu ana iş parçacığından hızlı değildir (Baseline median 3805 ms vs Canary median 4049 ms). Ancak font ve Türkçe arama paritesi %100 eşittir.
- **Nihai Karar:** `MTEXT WORKER: VALIDATED CANARY — DEFAULT OFF`. Üretim ortamında `useMainThreadDraw: true` korunur. Worker modu deneysel bayrak (`?mtextWorker=1` veya `CAD_MTEXT_WORKER_EXPERIMENT`) ile sınırlı tutulmuştur.

---

## 3. Üç Kademeli Geri Alma (Rollback) Prosedürü

Herhangi bir beklenmeyen problem durumunda uygulanacak kademeli geri alma yolları:

### Kademe 1: Tekil Aşama Geri Alma (Single Stage Rollback)
Her aşama bağımsız bir özellik bayrağı veya izole bir commit ile ayrılmıştır.
- **Aşama 2 (Preload):** `preloadCadViewerCode()` çağrıları devre dışı bırakılabilir.
- **Aşama 6 (DWG Hint):** `dwgFastPreviewHint` prop'u `undefined` yapılarak eski ağ kontrolü moduna dönülebilir.
- **Aşama 7 (Session Cache):** `CAD_SESSION_CACHE_MAX_ENTRIES = 0` yapılarak önbellek baypas edilebilir.
- **Aşama 9 (MTEXT Worker):** Varsayılan zaten KAPALI (`useMainThreadDraw: true`).

### Kademe 2: Tüm Performans PR'ını Geri Alma (Full PR Rollback)
Tüm performans çalışmasını geri almak için yalnız 3 core dosya restore etmek YETERSİZDİR (çünkü `page.tsx`, `file-preview-shell.tsx`, drive selection ve DTO katmanları da etkilenmiştir).
Tam geri alma için dedike bir branch açılmalı ve PR merge commit'i temiz bir git revert ile geri alınmalıdır:
```bash
git checkout -b revert-cad-performance
git revert -m 1 <PR_MERGE_COMMIT_HASH>
# Yerel testleri çalıştır:
npm run build
npx playwright test tests/document-studio/cad-preview-v2-contract.spec.ts
```

### Kademe 3: Tarihsel Altın Motor Acil Durum Geri Dönüşü (Historical Golden Emergency Restore)
Çekirdek CAD motorunda beklenmeyen bir regresyon olursa dokunulmaz `IGNORE2` altın referansına dönülür:
```bash
GOLDEN=909c59cb9dcac8e722b3bda4c66fd9d8a25755c8
git restore --source="$GOLDEN" --worktree -- \
  src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx \
  src/components/dokumantasyon/preview/cad-upstream-viewer.tsx \
  src/components/dokumantasyon/preview/cad-viewer.tsx \
  src/components/dokumantasyon/preview/dxf-viewer-worker.ts
```
Geri dönüş sonrasında Git blob eşitliği `git diff` ile doğrulanmalıdır.

