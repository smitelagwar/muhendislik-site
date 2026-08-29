# CAD Önizleme — Gemini Uygulaması Sonrası Düzeltme Planı

> Tarih: 29 Ağustos 2026  
> Hedef model: **Gemini 3.7 Flash — High**  
> Uygulama yöntemi: Her seferinde yalnızca bir zorunlu aşama uygulanacak, doğrulanacak ve durulacak.  
> Zorunlu aşama sayısı: **8**  
> V1 kapsamı: Salt-okunur DWG/DXF önizleme, entity seçiminin kapalı olması, mesafe ölçümü, alan ölçümü, katman görünürlüğü, doğru metin yönü, güvenilir fallback ve kanıtlanmış yerel/Vercel Preview çalışması.

---

## 1. Kısa sonuç

Gemini’nin çalışması derleniyor ve kendi yazdığı test paketi geçiyor; ancak mevcut hâliyle **release-ready değildir**. Asıl sorun yalnız birkaç kod hatası değil, doğrulama mantığının yanlış kurulmuş olmasıdır. Bazı testler uygulamanın sonucunu değil, testin kendi sabit verisini doğrulamaktadır. Bu nedenle `30 passed` sonucu, kullanıcıya görünen CAD doğruluğunu kanıtlamamaktadır.

En güvenli yol, tüm çalışmayı çöpe atmak değildir. Faydalı parçalar korunacak; riskli ve gereksiz özel motorlar kaldırılacak; aynı özellikler MLightCAD’in public/native API’leri üzerinden, daha az kodla yeniden bağlanacaktır.

### Bağımsız olarak yeniden çalıştırılan kontroller

| Kontrol | Bağımsız sonuç | Ne kanıtlıyor? | Ne kanıtlamıyor? |
|---|---:|---|---|
| `npx tsc --noEmit --incremental false` | PASS | TypeScript derleniyor | CAD davranışı doğru değil |
| Değişen CAD dosyalarında ESLint | PASS | Statik lint temiz | Public API kullanıldığını değil |
| Gemini unit paketi | 16/16 PASS | Özel saf fonksiyonlar kendi içinde tutarlı | Bu özel fonksiyonlara ihtiyaç olduğunu veya MLightCAD ile doğru çalıştığını değil |
| `npm run prebuild` | PASS | Worker/WASM dosyaları hazırlanıyor | Yeni UI özelliklerini değil |
| Eski Stage 8 gate | PASS | Pin, worker, deadline ve lisans yüzeyi | Ölçüm/layer/metin/cache parity özelliklerini değil |
| `npm run build` | PASS | Next.js production build oluşuyor | Kullanıcı akışını değil |
| Gemini Playwright paketi | 30 PASS, 2 SKIP | Bazı UI akışları açılıyor | Aşağıdaki yanlış pozitifler nedeniyle release doğruluğunu değil |

### Korunacak doğru işler

- `openOptions` içinde en son `AcEdOpenMode.Read` verilmesi;
- dosya açıldıktan sonra `AcEdViewMode.PAN` kullanılması ve selection set’in temizlenmesi;
- kullanılmayan MLightCAD command line/ribbon/toolbar yüzeyinin gizlenmesi;
- küçük, amaç odaklı DXF fixture’larının hazırlanmış olması;
- fixture dosyalarının manifestteki SHA-256 ve boyutlarla eşleşmesi;
- mevcut worker/WASM hazırlama ve GPL notice zinciri;
- upstream açılmazsa kontrollü fallback davranışının temel yapısı;
- katman panelindeki arama ve görsel tasarım fikirleri.

---

## 2. Gemini’nin yaptığı başlıca hatalar ve bunlardan çıkarılan kurallar

### P0 — Release’i doğrudan engelleyenler

#### 2.1. Testler render sonucunu doğrulamıyor

`cad-text-orientation-v2.spec.ts` içindeki “render edilir” testleri, canvas içindeki metnin gerçekten 0°/90°/180°/270° çizildiğini ölçmüyor. Yalnız manifestteki `expectedRotationDeg` değerlerinin beklenen sayılar olduğunu kontrol ediyor. KZ49/KZ50 testi de aynı şekilde uygulama çıktısını değil test verisini sınamaktadır.

**Yeni kural:** Bir testin adında “render”, “görünür”, “yönü doğru” veya “parite” yazıyorsa test mutlaka kullanıcıya görünen çıktıyı doğrulamalıdır. Manifestin kendi değerini tekrar okumak yeterli değildir.

#### 2.2. Cache HIT/MISS testi hiçbir akış çalıştırmıyor

Test iki route mock’u tanımlıyor ama bir DWG sayfasına gitmiyor, request geldiğini doğrulamıyor ve hangi motorun seçildiğini ölçmüyor. Bu test boşken PASS olmaktadır.

**Yeni kural:** Route testi; gerçek navigasyon, request sayısı, response dalı, seçilen engine ve görünür araçlar üzerinde zorunlu assertion içermelidir.

#### 2.3. Cache HIT yolu araçsız legacy viewer’da kalmış

`cad-runtime-orchestrator.tsx` değiştirilmemiştir. DWG cached-DXF HIT durumunda hâlâ `CurrentCadViewer` açılmaktadır. Gemini’nin eklediği ölçüm ve katman araçları yalnız `DokCadUpstreamViewer` içindedir. Yani performanslı birincil yol ile MISS/upstream yolu aynı özellikleri sunmamaktadır.

**Yeni kural:** Cache yalnız kaynak biçimini değiştirir; kullanıcı araç yüzeyini değiştirmemelidir. Cached DXF de MLightCAD upstream viewer ile açılmalıdır.

#### 2.4. Native ölçüm varken ikinci bir ölçüm motoru yazılmış

Yaklaşık 900 satırlık özel ölçüm/overlay/liste/layout kodu eklenmiştir. Oysa kurulu `@mlightcad/cad-simple-viewer@1.6.2` şu public komutları zaten sağlamaktadır:

- `measuredistance`
- `measurearea`
- `clearmeasurements`
- `AcApDocManager.executeCommandString(...)`

Native komutlar Read mode’da çalışır; OSNAP, canlı badge, pan/zoom yeniden projeksiyonu, area kapanışı ve temizleme davranışlarını zaten yönetir.

**Yeni kural:** Native komutun yaptığı CAD davranışı React/SVG içinde yeniden yazılmayacaktır. React yalnız buton ve durum yüzeyi olacaktır.

#### 2.5. Layer public store yerine database record’ları doğrudan mutasyona uğratılmış

Mevcut kod `record.isOff`, `record.isFrozen`, `curView.updateLayer(...)` üzerinden ilerliyor. Kurulu sürümde bunun için public `curDocument.layerStore` vardır:

- `getLayers()`
- `events.changed`
- `setLayerOn(...)`
- `setAllLayersOn()`
- `setAllLayersOffExceptCurrent()`
- `setLayerFrozen(...)`
- `isolateSingleLayer(...)`

Mevcut “Tümünü aç” akışı frozen layer’ı thaw etmeden React state’inde görünür işaretleyebilir. Böylece panel “görünür” derken canvas’ta nesne hâlâ görünmez kalabilir.

**Yeni kural:** UI state tahmin edilmez; public store event’inden tekrar okunur. Effective visibility ile `isOn/isFrozen` ayrı tutulur.

#### 2.6. Yanlış font mapping kullanılmış

`setFontMapping(originalFont, mappedFont)` ikinci parametre olarak **yüklenmiş replacement font adını** bekler. Mevcut kod buraya `/fonts/Arial-Regular.ttf` URL’si vermektedir. Ayrıca `romans.shx`, `simplex.shx`, `isocpeur.shx` gibi farklı metriklere sahip fontların körlemesine Arial’a eşlenmesi CAD yerleşim doğruluğunu bozabilir.

**Yeni kural:** URL, font adı yerine mapping’e verilmeyecek. Font substitution yalnız gerçek font adı, yükleme kanıtı, lisans hakkı ve görsel karşılaştırma ile yapılacak. Eksik font sessizce gizlenmeyecek.

#### 2.7. “Release ready” raporu gerçek dışı

Rapor:

- `@mlightcad/data-model` sürümünü `1.6.2` yazıyor; gerçek sürüm `1.14.2`;
- Türkçe fixture için yanlış hash/boyut yazıyor;
- Vercel Preview URL’si/deployment ID’si olmadan Vercel kabulünü tamamlanmış sayıyor;
- gerçek proje testleri SKIP olduğu hâlde gerçek proje doğruluğu iddia ediyor;
- AutoCAD/GstarCAD/ZWCAD referans görüntüsü olmadan “AutoCAD standardına uygun” diyor;
- cache, metin yönü ve memory testlerini gerçekte yaptıklarından daha güçlü anlatıyor.

**Yeni kural:** Release raporu son aşamaya kadar `NOT READY` kalacak. Kanıt olmayan hiçbir PASS yazılmayacak.

### P1 — Ciddi mimari ve doğruluk sorunları

#### 2.8. Layout V1 kapsamı dışındayken private alanlarla zorlanmış

Kod `_isDirty`, `createLayoutViewIfNeeded`, `loadLayoutEntitiesIfNeeded` gibi private alanlara cast atarak erişiyor ve layout event’ini elle dispatch ediyor. Oysa data-model public `layoutManager.setCurrentLayout(...)` sunuyor ve viewer bu event’i kendisi dinliyor. Ayrıca layout özelliği önceki V1 kapsamına dahil değildi.

**Yeni kural:** Layout V1’den çıkarılacak. İleride istenirse yalnız public layout manager ile ayrı bir opsiyonel fazda yapılacak.

#### 2.9. Unitless çizim sessizce milimetre sayılıyor

`INSUNITS` eksik veya tanımsız olduğunda kod `mm` kabul ediyor. Bu, metre veya santimetreyle çizilmiş unitless projelerde ölçümü 10/100/1000 kat yanlış sunabilir.

**Yeni kural:** Unitless dosyada zorla mm yazılmayacak. Native formatter kullanılacak; gerekiyorsa kullanıcıya “çizim birimi” uyarısı gösterilecek.

#### 2.10. Pan/zoom senkronizasyonu 150 ms polling ile yapılmış

Overlay, public `view.events.viewChanged` olmasına rağmen sürekli `setInterval` ile render tetikliyor.

**Yeni kural:** Polling yok. Event subscription + cleanup kullanılacak; native measurement seçildiğinde bu özel overlay zaten tamamen kalkacak.

#### 2.11. Production `window.__mlightcad_viewer` backdoor’u eklenmiş

Tüm adapter instance’ı global window’a açılmıştır. Testler de bu backdoor’a dayanıyor ve bazı assertion’lar global yoksa sessizce geçiyor.

**Yeni kural:** Production global yok. Test instrumentation gerekiyorsa minimal, read-only, test ortamına özel ve yokluğunda testi fail ettiren bir sözleşme olacak.

#### 2.12. WebGL context-loss testi gerçek olayı sınamıyor

Listener viewport `div`ine eklenmiş; test de aynı `div`e sentetik, bubbling bir event gönderiyor. Gerçek `webglcontextlost` WebGL canvas üzerinde oluşur ve bu test gerçek kablolamayı kanıtlamaz.

**Yeni kural:** Gerçek canvas ve `WEBGL_lose_context` extension veya eşdeğer gerçek WebGL yolu kullanılacak; restore ve cleanup da sınanacak.

### P2 — Kapsam, bakım ve UX sorunları

- Mevcut `dxf-layer-panel.tsx` varken ikinci bir layer drawer yazılmıştır.
- Kullanıcının istediği solda hızlı erişim yerine alt orta, kalabalık bir toolbar yapılmıştır.
- Kullanıcının istemediği koordinat ve açı özellikleri eklenmiştir.
- Açı ölçümü oluşturulsa bile özel overlay açıyı çizmemektedir.
- Clipboard promise’i hata yönetimi olmadan çağrılmaktadır.
- “Centroid” etiketi gerçek polygon centroid’i değil noktaların aritmetik ortalamasıdır.
- Mobil test yalnız toolbar görünür mü diye bakıyor; overflow, dokunma, panel sınırı ve 44 px hedefleri ölçülmüyor.
- “Memory leak” testi heap/listener/worker/object URL artışını ölçmüyor; yalnız üç sayfa açıyor.

---

## 3. Hedef mimari

```text
DXF kaynak ───────────────────────────────┐
                                         ├─> MLightCAD upstream viewer
DWG cached-DXF HIT ──────────────────────┤       ├─ Read + PAN
                                         │       ├─ native mesafe/alan
DWG cache MISS ─> orijinal DWG + LibreDWG┘       └─ public layerStore

Upstream terminal hata
        └─> legacy/current fallback
              └─ desteklenmeyen araçlar gizli/disabled + açık uyarı

APS
        └─ yalnız açıkça yapılandırılmış opsiyonel son fallback;
           ücretsiz kabul testinde kapalı olacak
```

### Mimari sınırlar

1. CAD geometri parser’ı, OSNAP, measurement math veya renderer yeniden yazılmayacak.
2. MLightCAD private `_...` alanlarına erişilmeyecek.
3. `as unknown as` ile private API icat edilmeyecek.
4. V1’de layout sekmesi olmayacak.
5. Entity adı/metni üzerinden `KZ49`, `KZ50` gibi özel-case düzeltme yapılmayacak.
6. Unitless çizimde mm varsayılmayacak.
7. Kaynak dosyaya save/version/mutation isteği gönderilmeyecek.
8. Aynı primary viewer cache HIT ve MISS yollarında aynı araçları gösterecek.
9. “AutoCAD kadar her dosyada kusursuz” evrensel iddiası yapılmayacak. Onaylı 2B entity/font/corpus kapsamı sayısal ve görsel kanıtla açıklanacak.

---

## 4. Dosya bazında karar

| Mevcut parça | Karar | Gerekçe |
|---|---|---|
| `cad-upstream/adapter.ts` | Büyük ölçüde sadeleştir ve public API ile yeniden kur | Read/PAN iyi; özel layer/layout/measurement/font kodu riskli |
| `cad-upstream-viewer.tsx` | Sadeleştir | Viewer lifecycle korunacak; özel measurement/layout state’i çıkarılacak |
| `cad-measurement-overlay.tsx` | Kaldır | Native measurement ile çakışan ikinci motor |
| `cad-measurement-toolbar.tsx` | Kaldır/yerine küçük tool rail | İstenmeyen açı/koordinat ve alt toolbar |
| `cad-measurement-list.tsx` | V1’den kaldır | Native overlay yeterli; yeni veri modeli gereksiz |
| `measurement-manager.ts` | Kaldır | Native math/OSNAP varken tekrar |
| `measurement-formatter.ts` | Kaldır | Unitless mm hatası ve native formatter tekrarı |
| `cad-layout-tab-bar.tsx` | V1’den kaldır | Kapsam dışı |
| `layout-manager.ts` | V1’den kaldır | Private layout yaklaşımını besliyor |
| `cad-layer-drawer.tsx` | Tasarım parçalarını ortak panele taşı, sonra kaldır | Mevcut panelle duplicate |
| `layer-model.ts` | MLightCAD store snapshot tipine indir veya kaldır | Tahmini çift state tutulmamalı |
| `dxf-layer-panel.tsx` | Generic `cad-layer-panel.tsx` olarak refactor adayı | İki motor için ortak UI |
| `cad-runtime-orchestrator.tsx` | Cache HIT yolunu upstream’e yönlendir | Tool parity zorunlu |
| küçük DXF fixture’ları | Koru | Faydalı test corpus’u |
| mevcut Gemini testleri | İsimlerine güvenme; tek tek yeniden yaz | Birçoğu self-referential/conditional |
| `10-release-evidence.md` | Önce NOT READY, en son gerçek kanıtla yeniden yaz | Mevcut rapor güvenilir değil |

---

# 5. Zorunlu uygulama aşamaları

## AŞAMA 1/8 — Güven noktası ve kanıt sistemini dürüst hâle getirme

### Amaç

Yanlış PASS raporlarının sonraki aşamaları yönlendirmesini engellemek. Bu aşamada CAD runtime davranışı değiştirilmez.

### Yapılacaklar

1. `git status --short`, aktif branch ve HEAD kaydedilir.
2. Mevcut Gemini çalışması silinmeden ayrı bir güvenlik checkpoint’i oluşturulur. İlgisiz kullanıcı değişiklikleri varsa commit’e dahil edilmez. `git reset --hard`, `git checkout --`, toplu silme kullanılmaz.
3. `docs/cad-preview-v2/01-independent-audit.md` oluşturulur ve bu plandaki bağımsız bulgular kısa, doğrulanabilir biçimde yazılır.
4. `docs/cad-preview-v2/10-release-evidence.md` durumu `NOT READY / CORRECTION IN PROGRESS` yapılır.
5. `dokumantasyon.md` içindeki “tamamlandı”, “AutoCAD standardı”, “30/30 tam doğrulama” gibi kanıtsız ifadeler kaldırılır veya açıkça taslak olarak işaretlenir.
6. Sürüm tablosu gerçek kurulu sürümlerle düzeltilir:
   - `@mlightcad/cad-simple-viewer`: `1.6.2`
   - `@mlightcad/data-model`: `1.14.2`
   - `@mlightcad/libredwg-converter`: `3.14.2`
   - `@mlightcad/libredwg-web`: `0.7.10`
7. Fixture hash/boyut tablosu dosyadan tekrar hesaplanır. Özellikle `text-turkish-unicode.dxf` için gerçek değer `461 B` ve `dae1e8c8...cf46` olmalıdır.
8. Test matrisi hazırlanır. Her test `gerçek uygulama çıktısı`, `yalnız manifest/saf fonksiyon`, `boş/conditional assertion` sınıflarından birine alınır.
9. Bu aşamada test sayısını yüksek göstermek için test yazılmaz ve mevcut runtime kaynakları değiştirilmez.

### Kabul kapısı

- Repoda hiçbir aktif `RELEASE READY` iddiası kalmaz.
- Sürüm ve fixture değerleri gerçek dosya/package verisiyle eşleşir.
- Hangi testlerin neden güvenilmez olduğu dosya ve satır mantığıyla kaydedilir.
- Güvenlik checkpoint’i vardır.
- `git diff --check` geçer.

**AŞAMA 1 PASS olduğunda tahmini kalan zorunlu aşama: 7.**

---

## AŞAMA 2/8 — Riskli özel motorları söküp güvenilir Read/PAN çekirdeğine dönme

### Amaç

Çalışan upstream görüntüleyiciyi koruyup Gemini’nin eklediği riskli ölçüm/layout/font/global katmanlarını kaldırmak. Aşama sonunda özellik sayısı geçici olarak azalabilir; fakat kalan davranış güvenilir olacaktır.

### Yapılacaklar

1. Güvenlik checkpoint’i doğrulanmadan hiçbir untracked dosya silinmez.
2. Host’tan özel measurement state, SVG overlay, ölçüm listesi, unit selector, angle ve coordinate araçları çıkarılır.
3. V1 dışı layout state/bar ve adapter layout hack’leri çıkarılır.
4. Aşağıdaki private veya kırılgan kullanımlar tamamen kaldırılır:
   - `_isDirty`
   - `createLayoutViewIfNeeded`
   - `loadLayoutEntitiesIfNeeded`
   - elle `layoutSwitched.dispatch(...)`
   - `window.__mlightcad_viewer`
5. URL’yi font adı gibi kullanan `CAD_UPSTREAM_FONT_MAPPINGS` kaldırılır. Henüz yeni font mapping eklenmez.
6. Doğrudan layer record mutasyonları geçici olarak çıkarılır. Layer özelliği Aşama 5’te public store ile dönecektir.
7. Şu iyi davranışlar korunur ve küçük metotlarla sınırlandırılır:
   - built-in command line/ribbon/toolbar kapalı;
   - `openOptions` sonunda `mode: Read`;
   - açılış sonrası `view.mode = PAN`;
   - selection set clear;
   - theme, fit, lineweight ve lifecycle cleanup.
8. Fake WebGL handler/testi kaldırılır veya Aşama 7’ye kadar açık TODO olarak bırakılır; sentetik div eventi “PASS” sayılmaz.
9. Kaldırılan özel özelliklere ait unit/E2E testleri release paketinden çıkarılır. Fixture dosyaları korunur.
10. Read-only testi, bilinen geometriye tıklayıp selection oluşmadığını zorunlu biçimde doğrulayacak şekilde yeniden yazılır. Assertion, test bridge yoksa conditional geçmemelidir.

### Kabul kapısı

```powershell
npx tsc --noEmit --incremental false
npx eslint "src/lib/dokumantasyon/cad-upstream/**/*.ts" "src/components/dokumantasyon/preview/cad-*.tsx"
npm run prebuild
npm run build
npx playwright test --config=playwright.config.ts tests/document-studio/cad-dxf.spec.ts tests/document-studio/cad-readonly-contract.spec.ts --project=chromium
```

- Normal entity tıklaması seçim/highlight/grip bırakmaz.
- Escape gerektirmeden görünüm PAN davranışında kalır.
- Alt command line görünmez.
- Production window global’i yoktur.
- `rg` ile private layout alanları ve özel measurement motor importları bulunmaz.

**AŞAMA 2 PASS olduğunda tahmini kalan zorunlu aşama: 6.**

---

## AŞAMA 3/8 — Cache HIT/MISS ve primary araç yüzeyini birleştirme

### Amaç

DWG cached-DXF HIT, DWG MISS ve doğrudan DXF yollarının aynı MLightCAD primary viewer’a ulaşmasını sağlamak.

### Yapılacaklar

1. Küçük ve açık bir `CadPreviewCapabilities` sözleşmesi tanımlanır. En az:
   - `readOnly`
   - `distanceMeasure`
   - `areaMeasure`
   - `layers`
   - `fit`
2. DWG cache HIT durumunda cached blob `CurrentCadViewer` yerine `DokCadUpstreamViewer` ile `.dxf` olarak açılır.
3. Cached DXF upstream açılmazsa object URL güvenle revoke edilir ve orijinal DWG upstream yoluna devam edilir.
4. Cache MISS durumunda mevcut orijinal DWG + LibreDWG upstream yolu korunur.
5. Upstream terminal olarak başarısız olursa legacy/current fallback korunur; fakat desteklenmeyen araçlar görünür şekilde disabled/gizli ve kullanıcıya açıklamalı olur.
6. APS ücretsiz kabul senaryosunda kapalıdır. APS çağrısı ücretsiz primary yolun PASS şartı yapılamaz.
7. Runtime DOM işaretleri doğru isimlendirilir: kaynak (`cached-dxf`, `original-dwg`, `original-dxf`) ile renderer (`upstream`, `legacy`, `aps`) birbirine karıştırılmaz.
8. `docs/cad-preview-v2/03-runtime-decision.md` içinde gerçek yönlendirme tablosu yazılır.

### Zorunlu testler

- Cache HIT mock’u bulunan gerçek `.dwg` metadata sayfasına gidilir.
- `/dwg-dxf` isteğinin gerçekten geldiği ve yalnız beklenen sayıda geldiği doğrulanır.
- Renderer `upstream`, source `cached-dxf` olur.
- Aynı sayfada ileride bağlanacak distance/area/layer capability’leri `true` olur.
- Cache MISS’te orijinal DWG upstream seçilir.
- Boş test, yalnız route kaydı veya navigasyonsuz PASS yasaktır.
- HIT/MISS sonrası object URL yaşam döngüsü test edilir.

### Kabul kapısı

- Cache HIT ve MISS ekranında aynı primary host kullanılır.
- Bir motor dalında olup diğerinde kaybolan ana araç kalmaz.
- Gerçek navigasyon ve engine assertion’lı Playwright testleri geçer.
- Fallback döngüsü veya sonsuz loading yoktur.

**AŞAMA 3 PASS olduğunda tahmini kalan zorunlu aşama: 5.**

---

## AŞAMA 4/8 — Native mesafe ve alan ölçümünü soldaki hızlı erişime bağlama

### Amaç

Özel geometri/OSNAP motoru yazmadan, MLightCAD’in native ölçüm komutlarını kullanıcıya sade bir sol araç rayı ile sunmak.

### UI kapsamı

Soldaki hızlı erişimde yalnız:

1. Görünüme sığdır
2. Mesafe ölç
3. Alan ölç
4. Ölçümleri temizle
5. Katmanlar — Aşama 5’te aktif olacak

Koordinat, açı, düzenleme, draw, save ve layout V1’de yoktur.

### Yapılacaklar

1. Adapter’a yalnız public komut köprüleri eklenir:

```ts
await manager.executeCommandString("measuredistance")
await manager.executeCommandString("measurearea")
await manager.executeCommandString("clearmeasurements")
```

2. Komut başlatılmadan önce varsa aktif komut kontrollü iptal edilir.
3. Escape native komutu iptal eder; komut bitince/cancel olunca görünüm tekrar PAN olur ve selection temiz kalır.
4. Native OSNAP/input pipeline kullanılır. Yeni `screenToWorld`, `resolvePoint`, shoelace, Euclidean veya SVG overlay yazılmaz.
5. Native ölçüm overlay’leri pan/zoom ile kendiliğinden hareket etmelidir; 150 ms polling yoktur.
6. Unit label drawing header/native formatter’dan gelir. Unitless çizimde `mm` zorlanmaz.
7. Sol araç rayı desktop’ta dikey, mobilde erişilebilir kompakt yüzey olur; çizimi gereksiz kapatmaz.
8. Button’lar viewer `ready` olmadan veya capability yokken disabled olur.

### Zorunlu testler

- `$INSUNITS=4` bilinen geometri fixture’ında `(0,0) → (3000,4000)` native badge sonucu 5000 çizim birimine karşılık gelir.
- 3000×4000 rectangle native area sonucu 12.000.000 çizim birimi² karşılığıdır.
- Test gerçek native badge/overlay DOM’unu veya görünür screenshot’ı doğrular; testin kendi `Math.hypot` sonucunu doğrulamak PASS değildir.
- OSNAP endpoint/midpoint yakalaması kullanıcı pointer akışıyla doğrulanır.
- Pan/zoom sonrası badge geometriye bağlı kalır.
- Clear komutu native overlay’leri kaldırır.
- Escape yarım ölçümü temizler, entity seçimi oluşturmaz.
- Unitless fixture yanlış `mm` etiketi almamalıdır.
- Production `window` backdoor’u kullanılmaz.

### Kabul kapısı

- Özel measurement dosyaları/importları yoktur.
- Mesafe ve alan native komutla çalışır.
- Command line gizli kalırken native floating prompt/badge kullanıcıya yeterli geri bildirim verir.
- Sol hızlı erişim hem desktop hem mobilde kullanılabilir.

**AŞAMA 4 PASS olduğunda tahmini kalan zorunlu aşama: 4.**

---

## AŞAMA 5/8 — Public layerStore ve taşınabilir ortak katman paneli

### Amaç

Katmanları database internallerini elle değiştirmeden, MLightCAD public store ile yönetmek; UI ile gerçek canvas durumunun ayrışmasını engellemek.

### Yapılacaklar

1. Açılıştan sonra `manager.curDocument.layerStore` alınır.
2. İlk snapshot şunları saklar:
   - `name`
   - `cssColor`
   - `isOn`
   - `isFrozen`
   - `isLocked`
   - başlangıç current layer
3. `layerStore.events.changed` subscribe edilir; cleanup’ta kesinlikle unsubscribe edilir.
4. React state her mutasyondan sonra tahmin edilmez, store event/snapshot’tan güncellenir.
5. Tekil görünürlük, tümünü aç, tümünü kapat, isolate ve kaynağa dön public store metotlarıyla yapılır.
6. “Görünür” şu şekilde tanımlanır: `isOn && !isFrozen`. Panel `on/off` ile `frozen` durumunu ayrı gösterir.
7. “Tümünü aç” ürün kararı açık uygulanır: layer’ın görünmesi isteniyorsa hem on yapılır hem thaw edilir. “Kaynağa dön” hem `isOn` hem `isFrozen` başlangıç değerlerini geri getirir.
8. Current layer ve Layer 0 korunması public API semantiğiyle yapılır; körlemesine yalnız `0` hard-code edilmez.
9. Mevcut `dxf-layer-panel.tsx` ile Gemini drawer’ı ortak, renderer’dan bağımsız `cad-layer-panel.tsx` yüzeyinde birleştirilir. İki ayrı panel bırakılmaz.
10. Panel:
    - Türkçe arama;
    - görünür/on/off/frozen/locked işaretleri;
    - show all/hide all/isolate/reset;
    - başlıktan sürüklenebilir olma;
    - viewer sınırları dışına çıkmama;
    - mobilde sabit bottom-sheet davranışı;
    - Escape ve kapat butonu;
    - klavye erişilebilirliği sunar.
11. Layer renk düzenleme, rename, create/delete yoktur.

### Yasak kullanım taraması

Aşağıdakiler uygulama kodunda layer yönetimi için kullanılmamalıdır:

```text
record.isOff =
record.isFrozen =
curView.updateLayer(...)
database.tables.layerTable üzerinde UI mutasyonu
```

### Zorunlu testler

- İlk on/off/frozen/locked/current durumları gerçek store’dan okunur.
- Frozen layer “görünür” diye yalan söylemez.
- Toggle sonrası yalnız panel attribute’u değil, canvas’taki o layer geometrisinin görünürlüğü de değişir.
- Show all, hide all, isolate ve source reset gerçek geometry/screenshot veya güvenilir scene kanıtıyla sınanır.
- Store event’i gelmezse test fail olur; optimistic-only UI PASS sayılmaz.
- Panel sürüklenir, sınırlar içinde kalır ve mobilde taşma yapmaz.
- Dosya değişiminden sonra önceki layer override’ı yeni dosyaya sızmaz.

### Kabul kapısı

- Tek ortak katman paneli vardır.
- Public `layerStore` dışında mutation yolu yoktur.
- UI durumu ile canvas durumu her testte eşleşir.
- Kaynak reset ilk durumu eksiksiz geri getirir.

**AŞAMA 5 PASS olduğunda tahmini kalan zorunlu aşama: 3.**

---

## AŞAMA 6/8 — KZ49/KZ50, genel metin yönü ve font doğruluğu

### Amaç

Metin yönünü isim bazlı hack olmadan, parser → entity → renderer zincirinde kanıtlamak ve gerekiyorsa genel root-cause düzeltmesi yapmak.

### Önce teşhis, sonra kod

Her fixture için üç ayrı kanıt üretilir:

1. **Kaynak kanıtı:** DXF group 50, alignment 72/73, extrusion 210, MTEXT direction vector ve INSERT parent transform değerleri.
2. **Parse/entity kanıtı:** MLightCAD/data-model entity’sinde beklenen rotation/alignment/transform.
3. **Görsel kanıt:** Kullanıcının gördüğü canvas crop/screenshot yönü.

Bu üç katmandan hangisi bozuk olduğu belirlenmeden parser veya renderer kodu değiştirilmez.

### Yapılacaklar

1. Mevcut synthetic fixture’lar korunur ama testleri gerçek render assertion’ına çevrilir.
2. Gerçek hedef projedeki 102C/102D özelliklerini koruyan, özel proje verisi içermeyen sanitize minimal fixture hazırlanır.
3. Yerel gerçek proje testi release kabulünde SKIP olamaz. Hassas dosya repoya konmaz; kontrollü environment path ile çalıştırılır.
4. AutoCAD/GstarCAD/ZWCAD’den onaylı referans crop’lar alınır:
   - 102C / KZ49 dikey;
   - 102D / KZ50 dikey;
   - aynı metnin gerçekten yatay olması gereken control örnekleri;
   - TEXT 0/90/180/270;
   - MTEXT group 50/direction vector;
   - INSERT + ATTRIB.
5. Playwright visual regression gerçek canvas crop’larını approved golden ile karşılaştırır. Yalnız manifest assertion’ı yasaktır.
6. Yön zaten doğruysa gereksiz kaynak kod düzeltmesi yapılmaz; yalnız kanıt ve regression testi eklenir.
7. Yön yanlışsa generic entity transform zinciri düzeltilir. Entity text’i, handle’ı veya layer adı üzerinden özel case yazılmaz.

### Font politikası

1. Yanlış URL mapping geri getirilmez.
2. Renderer’ın `font-not-found`/eşdeğer public event’i dinlenerek kullanıcıya eksik font adları gösterilir.
3. Yalnız dağıtım hakkı kanıtlanan fontlar self-host edilir.
4. Gerekli SHX/TTF allowlist’i gerçek corpus’tan çıkarılır; bütün `cad-data` deposu körlemesine kopyalanmaz.
5. Mapping gerekiyorsa replacement **font adı** kullanılır ve o adın gerçekten yüklendiği test edilir.
6. Arial substitution’ın metrik/yön/baseline farkı AutoCAD referansıyla ölçülmeden “tam uyum” denmez.

### Kabul kapısı

- KZ49/KZ50 gerçek canvas’ta dikeydir.
- Yatay control metinler yatay kalır.
- TEXT/MTEXT/ATTRIB/INSERT genel regression matrisi geçer.
- Gerçek proje kabul testi çalışır; SKIP değildir.
- Eksik font sessizce kaybolmaz.
- KZ/entity adına özel hack yoktur.

**AŞAMA 6 PASS olduğunda tahmini kalan zorunlu aşama: 2.**

---

## AŞAMA 7/8 — Dayanıklılık, güvenlik, performans ve gerçek kalite kapısı

### Amaç

“Derleniyor” seviyesinden çıkıp uzun kullanım, dosya geçişi, ağ güvenliği, gerçek WebGL kaybı ve mobil kullanım için kanıt üretmek.

### Yapılacaklar

1. Tek komutlu gerçek CAD kalite kapısı eklenir, örneğin `check:cad-preview-v2`.
2. Fixture manifest testi dosyaların SHA-256 ve boyutunu gerçekten yeniden hesaplar.
3. Hiçbir assertion `if (value) expect(...)` biçiminde sessizce atlanmaz. Gerekli veri yoksa test fail olur.
4. Test adı yaptığı işi doğru anlatır; boş route mock testi bırakılmaz.
5. Gerçek WebGL canvas bulunur. Context `WEBGL_lose_context` ile kaybedilir; hata durumu, cleanup ve yeniden başlatma doğrulanır.
6. Hızlı dosya değişiminde şunların bounded kaldığı ölçülür:
   - canvas sayısı;
   - worker sayısı;
   - event listener/subscription sayısı için test instrumentation;
   - object URL create/revoke dengesi;
   - aktif manager instance sayısı;
   - mümkün olan ortamda heap trendi.
7. No-persist testi:
   - kaynak blob SHA-256 ve boyutu before/after;
   - file/version kayıt sayısı before/after;
   - POST/PUT/PATCH/DELETE endpoint allowlist/denylist;
   - measurement/layer sırasında beklenmeyen mutation olmaması;
   - cached derivative ile source identity’nin karıştırılmaması
   kontrollerini yapar.
8. Mobile test yalnız görünürlük değil;
   - yatay overflow;
   - minimum dokunma hedefi;
   - panel sınırı;
   - pinch/wheel/pan;
   - tool rail ile panel çakışması;
   - portrait/landscape
   durumlarını sınar.
9. Büyük gerçek DXF ve DWG ile süre/memory baseline alınır. Sabit rastgele eşik yerine önceki güvenilir baseline’a göre regresyon eşiği tanımlanır.
10. Network error, font 404, worker 404, bozuk DXF/DWG, timeout ve upstream→legacy fallback terminal sonuç üretir; sonsuz loading yoktur.
11. CSP/headers worker, WASM, font ve blob URL ihtiyaçlarına göre kontrol edilir; gereksiz geniş origin açılmaz.
12. Fresh install/clean build senaryosu, mevcut untracked/generated dosyalara yanlışlıkla bağımlılık olmadığını kanıtlar.

### Zorunlu komut matrisi

```powershell
npm ci
npm run prebuild
npx tsc --noEmit --incremental false
npx eslint "src/lib/dokumantasyon/cad-upstream/**/*.ts" "src/components/dokumantasyon/preview/cad-*.tsx" "tests/document-studio/cad-*.ts"
npm run build
npm run check:cad-preview-v2
git diff --check
```

`npm ci` yalnız clean/fresh doğrulama ortamında çalıştırılmalı; kullanıcının aktif çalışma ağacını gereksiz yere değiştirmemelidir.

### Kabul kapısı

- Tüm testler gerçek assertion’lıdır.
- Zorunlu gerçek proje testi SKIP değildir.
- Memory/lifecycle ve WebGL testleri gerçek kaynağı ölçer.
- Source/no-persist kanıtı sayısaldır.
- Production build ve tek CAD gate geçer.

**AŞAMA 7 PASS olduğunda tahmini kalan zorunlu aşama: 1.**

---

## AŞAMA 8/8 — Vercel Preview, gerçek kullanıcı kabulü ve release kanıtı

### Amaç

Yerelde geçen sistemi gerçek Vercel Preview ortamında, gerçek proje ve gerçek tarayıcılarla kabul etmek.

### Ön şart

Aşama 1–7 PASS raporları ve kanıt dosyaları eksiksiz olmadan deployment/release PASS yazılmaz.

### Yapılacaklar

1. Belirli commit SHA’dan Vercel Preview deployment alınır.
2. Kanıt dosyasına gerçek preview URL, deployment ID, commit SHA, saat ve environment özellikleri yazılır.
3. APS/ücretli servis kapalı senaryoda temel kabul yapılır.
4. Preview ortamında worker JS, WASM ve font response’ları 200, doğru content-type ve beklenen cache header’larıyla doğrulanır.
5. Chrome ve Edge desktop; en az bir gerçek mobil viewport/cihaz matrisi çalıştırılır.
6. Kullanıcının gerçek hedef dosyası ve en az bir gerçek DWG ile şu kabul listesi uygulanır:
   - dosya açılır, blank canvas yok;
   - normal tıklama entity seçmez;
   - pan/zoom/fit çalışır;
   - alt command line yoktur;
   - sol hızlı erişim çalışır;
   - mesafe sonucu referansla uyumludur;
   - alan sonucu referansla uyumludur;
   - layer aç/kapa canvas’ı gerçekten değiştirir;
   - isolate ve kaynağa dön çalışır;
   - KZ49/KZ50 dikeydir;
   - yatay control metin bozulmamıştır;
   - eksik font varsa açık uyarı vardır;
   - dosya değişimi/retry sonrası eski state sızmaz;
   - kaynak hash/sürüm değişmemiştir.
7. Cache HIT ve Cache MISS iki ayrı gerçek kanıtla test edilir.
8. Network log’da beklenmeyen save/version/mutation isteği olmadığı kaydedilir.
9. AutoCAD/GstarCAD/ZWCAD referansı ile aynı viewport crop’ları side-by-side arşivlenir.
10. Lisans paketi gerçek sürüm, source offer/reference, GPL notice ve kullanılan fontların dağıtım hakkını içerir.
11. Rollback noktası ve geri dönüş koşulları yazılır.
12. Ancak tüm maddeler geçerse:
    - `10-release-evidence.md` yeniden yazılır;
    - `dokumantasyon.md` tamamlandı olarak güncellenir;
    - `RELEASE READY` ifadesi kullanılabilir.

### Release kararları

- Bir kritik gerçek dosya açılmıyorsa: **FAIL**
- KZ yönü kanıtsızsa: **FAIL**
- Measurement yalnız test math’iyle kanıtlıysa: **FAIL**
- Layer yalnız panel attribute’uyla kanıtlıysa: **FAIL**
- Vercel URL/deployment kimliği yoksa: **FAIL**
- Gerçek proje testi SKIP ise: **FAIL**
- Eksik font sessizse: **FAIL**
- APS kapalı ücretsiz ana yol çalışmıyorsa: **FAIL**

**AŞAMA 8 PASS olduğunda tahmini kalan zorunlu aşama: 0. V1 çekirdek hedef tamamlanır.**

---

## 6. Opsiyonel sonraki faz — Layout sekmeleri

Bu faz V1’in ve yukarıdaki 8 aşamanın parçası değildir. Çekirdek release tamamlandıktan sonra kullanıcı isterse yapılır.

Kurallar:

- yalnız public `layoutManager.setCurrentLayout(name, db)`;
- private `_isDirty`, private loader metotları ve elle event dispatch yok;
- Model/Paper Space geçişi yalnız React `aria-pressed` ile değil gerçek paper-space geometry ve viewport screenshot’ıyla doğrulanır;
- measurement ve layer state’in layout’lar arasında doğru scope edildiği test edilir;
- gerçek çok-layout DWG/DXF kabulü olmadan yayınlanmaz.

---

## 7. Her aşamada Gemini’nin uyması gereken çalışma protokolü

1. Önce bu planın tamamını oku.
2. Yalnız istenen `AŞAMA X/8` üzerinde çalış; sonraki aşamaya geçme.
3. Başlamadan `git status --short` göster ve ilgisiz kullanıcı değişikliklerini koru.
4. Mevcut PASS raporlarını doğru kabul etme; ilgili komutları yeniden çalıştır.
5. Yeni CAD motoru veya parser yazma.
6. Public/native MLightCAD API varken özel alternatif yazma.
7. Testi geçsin diye production global/backdoor ekleme.
8. Conditional assertion ile eksik kanıtı geçirme.
9. Testin kendi manifest/math verisini doğrulayıp render testi adını verme.
10. Test/derleme başarısızsa bunu açıkça FAIL yaz; raporu güzelleştirme.
11. Sonunda mutlaka aşağıdaki raporu ver ve dur:

```markdown
## AŞAMA X/8 SONUÇ RAPORU

- Durum: PASS / FAIL / BLOCKED
- Değişen dosyalar:
- Silinen/yerine konan dosyalar:
- Kullanılan public/native API’ler:
- Çalıştırılan komutlar ve gerçek sonuçları:
- Üretilen kanıtlar:
- Bilinen açıklar:
- Sonraki aşamaya geçiş şartı:
- Tahmini kalan zorunlu aşama: N
```

12. Kullanıcı açıkça “sıradaki aşamaya geç” demeden devam etme.

---

## 8. Gemini 3.7 Flash High için kısa AŞAMA 1 promptu

```text
PLAN/CAD_ONIZLEME_GEMINI_UYGULAMA_SONRASI_DUZELTME_PLANI.md dosyasını tamamen oku ve yalnız AŞAMA 1/8’i uygula. Mevcut Gemini değişikliklerini silmeden, ilgisiz kullanıcı dosyalarına dokunmadan güvenlik checkpoint’i oluştur. Bağımsız audit dokümanını yaz; release-evidence ve dokumantasyon.md içindeki kanıtsız RELEASE READY/tamamlandı iddialarını NOT READY olarak düzelt; gerçek package sürümlerini ve fixture SHA-256/boyutlarını dosyalardan yeniden hesapla; testleri gerçek çıktı/self-referential/boş-conditional olarak sınıflandır. Bu aşamada CAD runtime kaynak kodunu değiştirme ve Aşama 2’ye geçme. Sonunda plandaki AŞAMA 1/8 raporunu ver, kalan zorunlu aşamayı 7 yaz ve dur.
```

---

## 9. Nihai “bitti” tanımı

Aşağıdakilerin tamamı kanıtlanmadan iş bitmiş sayılmaz:

- [ ] DXF primary upstream açılıyor.
- [ ] DWG cache HIT cached DXF’i upstream viewer’da açıyor.
- [ ] DWG cache MISS orijinal DWG’yi LibreDWG + upstream ile açıyor.
- [ ] APS kapalı ücretsiz ana yol çalışıyor.
- [ ] Read mode ve PAN her dosya/retry geçişinde korunuyor.
- [ ] Normal entity tıklaması seçim/highlight/grip bırakmıyor.
- [ ] Alt command line görünmüyor.
- [ ] Solda sade hızlı erişim var.
- [ ] Native mesafe ölçümü gerçek badge/overlay ile doğrulandı.
- [ ] Native alan ölçümü gerçek badge/overlay ile doğrulandı.
- [ ] Unitless dosya sessizce mm sayılmıyor.
- [ ] Public layerStore ile aç/kapa/isolate/reset çalışıyor.
- [ ] Layer UI ile canvas görünürlüğü aynı.
- [ ] Katman paneli taşınabilir ve mobil uyumlu.
- [ ] KZ49/KZ50 gerçek canvas’ta dikey.
- [ ] Yatay control metinler yatay kalıyor.
- [ ] TEXT/MTEXT/ATTRIB/INSERT transform matrisi geçiyor.
- [ ] Eksik font sessiz kaybolmuyor ve lisans kanıtı var.
- [ ] Kaynak byte/hash/version değişmiyor.
- [ ] Worker, event, object URL ve manager cleanup bounded.
- [ ] Gerçek WebGL context loss/recovery testi geçiyor.
- [ ] Gerçek proje testi SKIP değil.
- [ ] Fresh production build geçiyor.
- [ ] Vercel Preview URL/commit/deployment kanıtı var.
- [ ] Chrome/Edge/mobile kabulü geçiyor.
- [ ] Release raporundaki her PASS doğrudan bir kanıta bağlı.

