# Dokümantasyon / CAD — Yaşayan Mimari Hafıza

Son bağlam güncellemesi: 24 Ağustos 2026

Bu dosyanın amacı, yeni bir AI oturumunun `/dokumantasyon` ve CAD görüntüleme sisteminin bugün nasıl çalıştığını hızlıca anlamasını sağlamaktır.

> **Bu belge bir değişmez kurallar listesi değildir.** Aşağıdaki yapı mevcut production mimarisinin fotoğrafıdır. Performans, kalite, bakım maliyeti veya yeni ihtiyaçlar için mimari daha sonra bilinçli biçimde değiştirilebilir. Bir değişiklik yapılırken önce mevcut davranışın neden var olduğu anlaşılmalı, sonra kaynak kod ve testlerle yeni yaklaşım doğrulanmalıdır.
>
> **Yaşayan belge kuralı:** Bu mimari anlamlı biçimde değiştirildiğinde, değişiklik hangi bölümü etkiliyorsa bu dosyanın o bölümü de aynı çalışma kapsamında güncellenmelidir. Amaç sistemi dondurmak değil, sonraki AI oturumuna yanlış hafıza bırakmamaktır.

## 1. Production durumu

CAD upstream migration 24 Ağustos 2026'da production'a alınmıştır.

- Migration PR: `#21`
- Production merge commit'i: `ca3f1e4a324a0be23126bcab7454781baa00114c`
- Production deployment kaydı: `dpl_8mbxa3Do3CaffaAjnauApWRGBXqF`
- Site: `https://muhendislik-site.vercel.app/`

Bu SHA/deployment değerleri tarihsel snapshot'tır; sonraki normal geliştirmelerde değişmeleri beklenir. Mimariyi sabitleyen kimlikler olarak kullanılmamalıdır.

## 2. Sistem nasıl bu hale geldi?

İlk sistemde DWG/DXF desteği ağırlıklı olarak proje içinde büyüyen custom viewer, browser DWG→DXF dönüşümü ve APS fallback çevresinde gelişti. Gerçek dosyalarda doğruluk, format kapsamı, bakım maliyeti ve sürekli özel parser/renderer geliştirme ihtiyacı büyüdüğü için yaklaşım değiştirildi.

2026 Ağustos'unda 8 aşamalı bir migration ile `mlightcad/cad-simple-viewer-example` yaklaşımı incelendi ve MLightCAD + LibreDWG tabanlı upstream runtime siteye adapte edildi. Amaç eski çalışan parçaları bir anda silmek değil; upstream motoru birincil hale getirirken doğrulanmış fallback'leri korumaktı.

Migration geçmişi `docs/cad-upstream-migration-stage1.md` ... `docs/cad-upstream-migration-stage8.md` dosyalarındadır. Bu Stage dosyaları **tarihsel karar/kabul kayıtlarıdır**; güncel mimari için bu dosya ve `DOK_CONTEXT_MAP.md` daha öncelikli okunmalıdır.

## 3. Aktif CAD giriş noktaları

Canlı CAD sahipliği:

- `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx`

CAD kullanan iki ana preview shell de doğrudan eski viewer'a değil orchestrator'a yönlenir:

- `src/components/dokumantasyon/preview/file-preview-shell.tsx`
- `src/components/dokumantasyon/studio/document-studio-shell.tsx`

Yeni bir değişiklikte önce bu zincir doğrulanmalıdır. Eski `cad-viewer.tsx` hâlâ canlıdır ancak primary owner değildir; fallback ve cached-DXF render rollerini taşır.

## 4. Mevcut DWG çalışma zinciri

Bugünkü sıralama:

```text
DWG
  ↓
1. Fast cached DXF kontrolü
   /api/dokumantasyon/files/:fileId/dwg-dxf
  ↓ miss/fail
2. Direct upstream MLightCAD + LibreDWG
  ↓ fail/blank/timeout
3. Legacy browser DWG → DXF worker
   + mevcut DXF viewer
  ↓ terminal fail
4. APS-only final fallback
```

### 4.1 Fast cached DXF

Orchestrator önce daha önce üretilmiş/uygun cached DXF olup olmadığını kısa süreli bir istekle kontrol eder. Cache hit olursa object URL oluşturulur ve mevcut `DokCadViewer` DXF olarak render eder. Object URL unmount/geçiş sırasında revoke edilir.

Bu katmanın amacı açılışı hızlandırmaktır; sistemin tek doğruluk kaynağı değildir.

### 4.2 Upstream primary runtime

Ana modern yol:

- UI host: `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`
- adapter: `src/lib/dokumantasyon/cad-upstream/adapter.ts`
- runtime policy/helper'lar: `src/lib/dokumantasyon/cad-upstream/` ve `src/lib/dokumantasyon/cad-runtime/`

Adapter MLightCAD document manager'ı başlatır, Worker erişilebilirliğini kontrol eder ve DWG için LibreDWG converter'ı register eder.

Güncel doğrudan paketler:

- `@mlightcad/cad-simple-viewer` `1.6.2`
- `@mlightcad/data-model` `1.14.2`
- `@mlightcad/libredwg-converter` `3.14.2`
- transitive `@mlightcad/libredwg-web` `0.7.10`

Bu sürümler **mevcut production snapshot'ıdır**. Gelecekte yükseltilebilir; yükseltme yapılırken gerçek DWG/DXF corpus'u ve browser testleri yeniden çalıştırılmalıdır.

### 4.3 Blank-success koruması

Upstream `openDocument()` bazı bozuk/uyumsuz dosyalarda teknik olarak success döndürüp boş sahne bırakabildiği için adapter'da ek bir koruma vardır:

- `waitUntilIdle(2500)`
- idle durumunda `stats.summary.entityCount === 0` ise `blank-document`

Bu kontrol custom DWG parser değildir. Upstream'ın kendi scene istatistiğini kullanarak boş başarıyı fallback'e dönüştürür. Büyük progressive çizimler hâlâ işleniyorsa sırf entityCount o anda sıfır diye kesilmez.

### 4.4 Legacy browser fallback

Dosyalar:

- `src/components/dokumantasyon/preview/dwg-legacy-conversion-fallback.tsx`
- `src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts`
- `src/components/dokumantasyon/preview/cad-viewer.tsx`
- `src/components/dokumantasyon/preview/dxf-viewer-worker.ts`

Bu parçalar migration sonrası yanlışlıkla unutulmuş ölü kod değildir. Upstream açılamadığında ikinci güvenlik hattıdır. İleride daha iyi/ölçülmüş bir mimari ile kaldırılabilir; kaldırma kararı gerçek fallback ihtiyacı ve test kanıtına göre verilmelidir.

### 4.5 APS final fallback

- `src/components/dokumantasyon/preview/aps-only-dwg-viewer.tsx`

APS artık primary viewer değildir. Yalnız DWG zincirinin son terminal fallback'idir.

Eski `aps-dwg-viewer.tsx` migration sırasında kaldırılmıştır. Yeni kodun yanlışlıkla bu eski dosya adına bağlanmaması gerekir.

## 5. DXF çalışma zinciri

```text
DXF
  ↓
1. Direct upstream MLightCAD
  ↓ fail
2. Current/legacy DXF viewer
```

DXF'de browser DWG dönüşüm katmanı veya APS kullanılmaz.

## 6. DWF

DWF ayrı yerel yol kullanır:

- `src/components/dokumantasyon/preview/dwf-local-viewer.tsx`

DWF'yi DWG/DXF zincirine zorla sokmamak gerekir; ileride daha iyi bir DWF motoru gelirse bu bağımsız sınır değiştirilebilir.

## 7. Görsel kontroller

Upstream adapter bugün şunları destekler:

- kaynak/gerçek renk görünümü
- siyah-beyaz (`monochrome`) görünüm
- native `LWDISPLAY` üzerinden lineweight aç/kapat
- light/dark theme uyumu
- progressive rendering

Siyah-beyaz görünüm kaynak entity verisini yeniden yazmak yerine render/canvas katmanında uygulanır.

## 8. Worker / WASM dağıtımı

Build öncesi upstream browser asset'ları senkronlanır:

- `scripts/sync-cad-upstream-assets.mjs`
- `/public/cad-upstream/mtext-renderer-worker.js`
- `/public/cad-upstream/libredwg-parser-worker.js`
- ilgili LibreDWG WASM asset'ı
- `/public/cad-upstream/GPL-NOTICE.txt`

Adapter worker URL'lerini `/cad-upstream/...` üzerinden bekler. Worker/WASM path değişirse build ve browser readiness testleri birlikte güncellenmelidir.

Lisans/kaynak izlenebilirliği için ayrıca `THIRD_PARTY_NOTICES.md` bulunur. Bu dosya hukuki görüş değil, dağıtılan üçüncü taraf bileşenlerin teknik kaydıdır.

## 9. Mevcut süre bütçeleri

Bugünkü runtime yaklaşık olarak şu bounded süreleri kullanır:

- fast cache: 5 s
- legacy source fetch: 15 s
- legacy conversion worker: 25 s
- upstream küçük/default: 35 s
- upstream > 8 MiB: 120 s
- upstream > 32 MiB: 180 s
- APS request: 15 s
- APS translation total: 180 s
- APS viewer load: 45 s

Bunlar sonsuza kadar korunması gereken ürün kuralları değildir. Performans çalışmasında ölçülerek azaltılabilir/artırılabilir veya mimari tamamen değiştirilebilir. Değişiklikte önemli olan kullanıcıyı sınırsız bekletmemek ve fallback/geçiş davranışını kontrollü tutmaktır.

## 10. Dokümantasyon modülünün CAD dışındaki sınırları

CAD migration, Dokümantasyon'un veri düzlemini yeniden tasarlamadı. Mevcut sistemde hâlâ:

- auth/session
- Neon/veri erişimi
- Vercel Blob upload/storage
- dosya/klasör metadata'sı
- share/public token akışı
- trash/restore
- search
- download/new-tab/preview davranışları
- PDF ve image preview

aynı Dokümantasyon ürünü içinde çalışır.

Bu alanlarda değişiklik yapılabilir; fakat CAD performans problemi çözülürken gereksiz yere storage/auth davranışını değiştirmek çoğu zaman problemi büyütür. Önce sorunun hangi katmanda olduğu ölçülmelidir.

Kalıcı storage yaşam döngüsü için `DOK_STORAGE_CONTRACT.md`, operasyonel notlar için `docs/DOKUMANTASYON_RUNBOOK.md` kullanılabilir.

## 11. Test ve release hafızası

CAD migration sırasında gerçek DWG/DXF dosyalarıyla acceptance oluşturuldu. İlgili test/CI alanları arasında şunlar bulunur:

- `scripts/check-cad-upstream-stage*.mjs`
- `tests/document-studio/cad-dxf.spec.ts`
- gerçek repo fixture acceptance testleri
- `.github/workflows/cad-runtime-production.yml`
- Stage 5/6/7/8 CAD workflow'ları
- DXF fidelity workflow'u

Stage 8 kabulünde gerçek DWG/DXF render, Chromium, production build, Worker/WASM readiness ve fallback davranışları PASS olmuştur. Ayrıntılı run/artifact kimlikleri `docs/cad-upstream-migration-stage8.md` içindedir.
30 Ağustos 2026'da test veri düzlemi izole edilmiş (`DOK_LOCAL_DATA_DIR`, Playwright worker run-level isolation), test fixture yüklemelerinin kullanıcı `.data/dok_db.json` deposuna yazması ve kalıcı kayıt bırakması engellenmiştir.
Aşama 2 hardening'i kapsamında: global `HTMLCanvasElement.prototype.getContext` monkeypatch'i ve `any` cast'leri bütünüyle kaldırılmış; büyüteç güncellemesi `requestAnimationFrame` ile throttle edilmiş; lens boyutu viewport'un %20 genişliği ve %35 yüksekliğiyle responsive sınırlandırılmış; 4,44 MB gerçek DXF üzerinde 10 saniyelik tracking'de ~16,6 ms (60 FPS) sabit frame hızı doğrulanmıştır.
Aşama 3 pan, zoom, fit ve görünüm sözleşmesi kapsamında: salt-okunur modda fare sol drag ve orta drag pan, wheel zoom ve dokunmatik tek parmak pan / iki parmak pinch standartlaştırılmış; sol hızlı araç rayına açık Kaydır (Pan) ve Görünüm Ayarları araçları eklenmiş; mobilde erişilebilir `CadViewSettingsPanel` ile Gerçek Renk, Siyah-Beyaz, Lineweight ve 3 arka plan rengi seçimi sağlanmış; pan sırasında zero mutation doğrulanmıştır.
Aşama 4 açılış, cache, loading ve terminal hata UX'i kapsamında: telemetry loading fazları (`verify-workers`, `fetch-source`, `parse-convert`, `build-scene`, `render-ready`) netleştirilmiş; determinate olmayan gerçek saniye sayacı ve güvenli "İptal Et" butonu eklenmiş; kullanıcı iptali ve sayfa geçişlerindeki `AbortError`ların fallback döngüsü ve konsol hatası üretmesi engellenmiş; 27 B bozuk DXF için sınıflandırılmış hata (`CAD_CORRUPT_TRUNCATED`, `CAD_PARSE_ERROR`, `CAD_NETWORK_ERROR`) ile "Tekrar dene" ve "Dosyayı indir" sunulmuş; MLightCAD istemci tarafında DWG'yi LibreDWG WebWorker ile doğrudan bellek içi sahneye dönüştürdüğü (sunucuya gereksiz ek DXF türevi kaydetmediği) ve /dwg-dxf fast-cache HIT/MISS davranışı doğrulanmıştır.
Aşama 5 mesafe ölçümü (keşfedilebilir, hassas ve doğrulanmış UX) kapsamında: kod ve testlerdeki yanıltıcı `native measuredistance` ifadesi yerine `CadPressHoldDistanceController` gerçeği konumlandırılmış; masaüstü için iki tıklama ile ölçüm, mobil için hem hızlı kısa tap hem de büyüteçli long-press hassas seçim desteklenmiş; Türkçe yönergeler (Esc: İptal yönlendirmesi dahil) eklenmiş; sağ panel açıkken büyütecin sol üste (`fixed-top-left`) otomatik kaçması sağlanmış; `Intl.NumberFormat("tr-TR")` ile 3-4-5 bilinen geometrisi üzerinde overlay'de `5.000` / `5000` sonucu fiziksel DOM olarak doğrulanmış; Escape, buton tekrarı, pinch ve Temizle (`cad-tool-clear`) eylemlerinin kaynak çizim/katman durumunu bozmadan temiz iptal/sıfırlama sağladığı onaylanmıştır.
Aşama 6 alan ölçümü (Türkçe komut akışı ve gerçek sayısal oracle) kapsamında: İngilizce/native komut metinleri tamamen kaldırılarak `CadAreaMeasurementController` ve `CadAreaOverlay` mimarisi kurulmuş; durum çubuğunda anlık Türkçe adım yönergeleri (`1. noktayı seçin (Esc: İptal)`, `2. noktayı seçin (Esc: İptal | Backspace: Geri al)`, `Alan: ... çizim birimi² (...)`) sunulmuş; çift tıklama, Enter tuşu, ilk noktaya tıklayarak poligonu kapatma (<20px) ve mobil için doğrudan "Bitir" butonu eklenmiş; Backspace ile son noktayı geri alma ve Escape/araç değişimi ile yarım poligonu hayalet nesne bırakmadan sıfırlama sağlanmış; tamamlanan ölçümler kamera değişiminde geometriye sabitlenmiş (`projectWorldPoint`); `Intl.NumberFormat("tr-TR")` ile `known-geometry-measurements.dxf` (3000x4000) üzerinde `Alan: 12.000.000,00 çizim birimi²` oracle'ı hem desktop hem mobil testlerinde doğrulanmıştır.

## 12. Hızlandırma veya yeniden tasarım yapılacaksa

Gelecekte amaç daha hızlı açmaksa mevcut mimariyi kutsal kabul etmeyin. Önce ölçün:

1. gecikme fast-cache fetch'te mi?
2. DWG byte fetch'te mi?
3. LibreDWG parse/convert'te mi?
4. MLightCAD scene oluşturma/render'da mı?
5. büyük MTEXT/HATCH/BLOCK içeriğinde mi?
6. eski fallback'e gereksiz geçişte mi?
7. server-side ön dönüşüm/caching gerçekten fayda sağlayacak mı?

Daha iyi bir upstream sürümü, farklı parser, server-side hazırlama, kalıcı cache veya başka bir mimari gerçek dosyalarda daha iyi sonuç veriyorsa kullanılabilir. Bu dokümanın amacı değişimi engellemek değil; yeni değişikliğin mevcut sistemin hangi parçasını değiştirdiğinin bilinmesini sağlamaktır.

## 13. Yeni AI oturumu için kısa okuma sırası

Dokümantasyon/CAD işi yapılıyorsa en verimli sıra:

1. `PROJECT.md` — proje genel bağlamı
2. `DOK_CONTEXT_MAP.md` — aktif dosya/route haritası
3. `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` — bu dosya, güncel CAD mimarisi
4. yalnız gerekiyorsa `docs/cad-upstream-migration-stage*.md` — geçmiş karar/kabul ayrıntıları
5. ilgili kaynak dosyalar — her zaman son gerçek kaynak

Bir Markdown dosyası ile kaynak kod çelişirse kaynak kod ve güncel testler doğrulanmalı; ardından Markdown güncellenmelidir.

## 14. Bu hafıza ne zaman güncellenmeli?

Aşağıdakilerden biri değişirse **bu belgenin ilgili bölümü aynı değişiklik kapsamında güncellenmelidir**:

- primary CAD engine
- fallback sırası
- worker/WASM dağıtımı
- CAD package ailesi veya önemli sürüm değişikliği
- cache/dönüşüm stratejisi
- Document Studio/preview giriş noktası
- timeout/performance yaklaşımı
- gerçek dosya kabul/test stratejisi
- production'a geçen önemli CAD mimari değişikliği

Örneğin primary engine MLightCAD'den başka bir motora geçerse yalnız kod değiştirilip bu dosyada hâlâ MLightCAD primary yazması kabul edilmez. Aynı şekilde fallback kaldırılırsa, timeout modeli değiştirilirse veya server-side cache eklenirse ilgili açıklama güncellenir.

Küçük UI metni, renk, spacing veya mimariyi etkilemeyen lokal stil değişikliğinde bu dosyayı güncellemek gerekmez.

Bu bakım şartı **mimariyi değiştirmeme zorunluluğu değildir**. Tam tersine, sistem daha iyi bir yaklaşımla değiştirilebilir; yalnızca belge de yeni sistemi doğru anlatacak şekilde birlikte taşınmalıdır.
