# CAD V1 — Profesyonel DWG/DXF Görüntüleme, Ölçüm ve İnceleme
## Claude eleştirisiyle çapraz denetlenmiş nihai, aşamalı uygulama planı · Revizyon 2.0

**Plan ID:** `CADV1-PRO-REVIEW-20261102`  
**Plan revizyonu:** `2` · **Tarih:** 02.11.2026 · **Saat dilimi:** Europe/Istanbul  
**Plan durumu:** `PLAN_HAZIR` · **Uygulama durumu:** `BASLAMADI`  
**Repo:** https://github.com/smitelagwar/muhendislik-site  
**İncelenen `main` HEAD (plan anı):** `3df5e45924c6f83e2d5cbbdb81e5d02c3fe07dc4`  
**Zorunlu CAD kurallarının bulunduğu dal:** `internal-cad-v1-review-standard-20261102`, HEAD `32a1c818d06c5b191cdc5bd4efdeaf71407e6559`  
**Uygulayıcı:** Bu sohbet içinde ChatGPT; bağlı GitHub araçları, gerçekten erişilebilen test/tarayıcı/CI araçları. **Yerel Windows makinesi veya bağlı olmayan tarayıcıya kendiliğinden erişimi varmış gibi davranmayacak.**  
**Uygulama başlangıcı:** Kullanıcının `ilk aşamadan başla` komutu. Her `devam` **en fazla bir aşamayı** ilerletir.  
**Yayın:** Bu planın kapsamına **Production/Preview deploy veya `main` merge dahil değil**; son kabul sonrası ayrıca açık komut gerekir. Ara branch üzerinde Vercel Preview hedefi sıfırdır.

---

## 1. Ürün hedefi ve kapsam

**Birinci ve zorunlu hedef:** Bugünkü V1 DWG/DXF görüntüleme doğruluğunu koruyarak **mevcut** düz mesafe, zincir mesafe, alan/çevre, nesne yakalama (OSNAP), seçim, dikdörtgen, daire, revizyon bulutu, callout, pin, metin, serbest çizim, silgi, undo/redo, katman, metin arama, kayıt ve mevcut dışa aktarma araçlarını gerçek mühendislik kullanımına uygun hale getirmek.

**Hedef deneyim:** Bir mühendisin çizime tıklayıp doğru noktayı seçtiğini anlaması; doğru birimde ölçebilmesi; zoom/pan sırasında ölçüsünün kaymaması; işini yeniden açıp sürdürmesi; mobilde rahat nişan alması; bütün bunları hızlı, sade ve öngörülebilir bir arayüzde yapması.

**Kapsam dışı, sonraki ürün dönemi:** Orijinal DWG/DXF entity değiştirme, TRIM/OFFSET/EXTEND, native DWG kaydetme, yeni renderer veya parser, ayrı server CAD V2'ye geçiş. Claude'un önerdiği **kapalı entity'ye tıklayarak alan/çevre**, **açı ve yay ölçümü**, **ölçüm CSV**, **entity özellikleri**, **ortho/polar kısayolları** yararlı bir *sonraki geliştirme sırası* olarak kaydedilir; mevcut araçların düzeltmesini geciktiren zorunlu aşamalar yapılmaz. Mevcut bir araçta aynı yetenek zaten varsa korunur, regresyona sokulmaz.

### HARD_RULES — bütün aşamalar için değişmez kurallar

1. **V1 görüntüleyici korunur:** Parser, renderer, worker, MLightCAD runtime, mevcut DWG/DXF cache/routing/fallback, font/hatch/layer, source/monochrome, lineweight, fit/pan/zoom, loading/error/retry bozulmaz. Sırf review işi için engine rewrite, dependency upgrade, second renderer, CAD V2 cutover veya global monkeypatch yapılmaz.
2. **Kaynak çizim immutable:** Ölçüm/markup yalnız ayrı review/overlay veri katmanındadır. Gerçek DWG/DXF entity, dosya byte'ı ve kaynak fingerprint'i değişmez. Review-only DXF, DWG diye kaydedilemez.
3. **Kanıt önce gelir:** Belirli bir hata için tekrarlanabilir belirti + kod/olay akışı + sayısal test; kök neden kanıtlanmadan yeni `interaction-coordinator` yazılmaz. Eski çalışan düz mesafe hareketi özellikle korunur.
4. **Tek world↔screen otoritesi:** Adapter'ın gerçekten var olan dönüşüm API'leri kullanılır; CSS pixel, canvas backing pixel, DPR ve world koordinatları karıştırılmaz. Kalıcı geometri world koordinatındadır, snap/hit-test toleransı ekran piksellerinde değerlendirilir.
5. **Küçük geri alınabilir değişiklik:** Protected path'te zorunlu müdahale varsa minimum diff + gerekçe + hedefli render/fallback testi + rollback. Kullanıcının başka branch/çalışmasındaki değişikliği silme; force push/hard reset yok.
6. **Dürüst test statüleri:** `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`; ayrıca testin **nerede** çalıştığı ve hangi SHA'yı test ettiği belirtilir. Sadece kodu okumuş olmak veya test yazmak PASS değildir; simüle edilmiş mobil testi fiziksel cihaz kanıtı olarak gösterme.
7. **Kayıt ve tarihçe:** Ölçüm/markup, undo/redo, kayıt, seçim, panel, reload ve export aynı anlaşılır modelden türesin. Yıkıcı migration veya sessiz veri silinmesi yok.
8. **Dış kaynak disiplini:** Önce mevcut API; sonra minimum uyarlanmış kaynak; exact upstream commit/lisans/NOTICE ve bağımsız test. Tüm projeleri repoya kopyalamak zorunlu ya da varsayılan değildir.
9. **Yayın disiplini:** ChatGPT uzaktan yalnız `internal-*` çalışma dalına anlamlı **aşama başına en fazla bir normal checkpoint commit** yazar. Her dosya/ara deneme için commit, `main` push, anlamsız retry, Preview veya Production yok. `vercel.json` koruması ayrıca doğrulanır; `[skip ci]` tek güvence sayılmaz.
10. **Bir aşama bir komut:** Bir aşama o turda bitmezse aynı aşamanın `DEVAM_EDIYOR` durumu korunur. Bir sonraki `devam`, **yalnız o aşamayı sürdürür**. Test çalıştırılamıyorsa sonuç ve gereken dış doğrulama açıkça yazılır; gizli biçimde sonraki aşamaya geçilmez.

### Mimaride uygulanacak kod standardı

- Hesap çekirdeği mümkün olduğunca **saf TypeScript**: mesafe, alan, birim, snap geometrisi ve tolerans hesapları React/DOM'dan bağımsız, mevcut `tsx`/Node testleriyle çalışabilir. Mevcut dosyaları yalnız bu amaçla toptan taşıma; gerekiyorsa saf işlevleri yan modüle ayır. Repo geneline yeni ESLint kuralı ancak yararı ve riskleri somutlaşırsa.
- **Koordinat tipi ayrımı** yeni facade sınırında `WorldPoint`/`ScreenPoint` benzeri ayrık TypeScript tipleriyle güçlendirilebilir; eski API'lerin tamamını kıracak kapsamlı branding zorunlu değil. Her conversion'ın girişi/çıkışı test edilir.
- Araç akışı `idle / armed / placing veya dragging / editing / completed veya cancelled` gibi **açık olay/durum tablosuyla** tanımlanır. Reducer/event arbitration yalnız gerçek çakışmayı azalttığı kanıtlanırsa kurulur. Pan ve pinch hiçbir zaman gizli kamera kilidi altında kalmaz.
- Canlı pointer preview, yalnız gerçekten ölçülmüş render sorunu varsa `requestAnimationFrame` ile toplu güncellenir; gereksiz `useSyncExternalStore`, yeni canvas katmanı veya toplu render dönüşümü şart koşulmaz.
- Sayı sunumu `tr-TR` locale ve seçilmiş çizim birimi/precision ile tutarlı; **sabit `m` ve 2 ondalık** bütün çizimlere zorlanamaz. Etiket ve ölçüm listesi aynı kaynak değerini gösterir.
- Kullanıcı görünümünde: snap türüyle eşleşen marker, kontrast/halo, canlı ölçüm, net önizleme/commit/seçim ayrımı, Escape/Enter/Backspace, mobil açık Bitir/İptal. UX kararları **ilk aşamada** sözleşmeye girer; süsleme son aşamaya bırakılmaz.

---

## 2. Girdi/kanıt ayrımı ve gerçek repo bulguları

### Doğrulananlar (GitHub kaynak incelemesi)

- `package.json`: `@mlightcad/cad-simple-viewer=1.6.2`, `@mlightcad/data-model=1.14.2`, `@mlightcad/libredwg-converter=3.14.2`, `@mlightcad/libredwg-web=0.7.10`, `dxf-viewer=^1.0.48` (çözülmüş lock sürümleri başlangıçta kontrol edilecek).
- V1 host `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`, köprü `src/lib/dokumantasyon/cad-upstream/adapter.ts`, snap `snap-engine.ts`, ölçüm `distance-measurement.ts`, `chain-distance.ts`, `area-measurement.ts`.
- İnceleme katmanı `src/lib/dokumantasyon/cad-review/{schema,store,pointer-router,markup-controller,freehand-controller,units,repository,export-json,export-dxf,export-image}.ts` ve `cad-review-overlay.tsx`. `schema.ts` zaten **versiyon 1**; `store.ts` zaten undo/redo içeriyor. **Sıfırdan yeni şema ve history motoru icat edilmeyecek.**
- V1 host'ta local distance/area state; review item'larda ayrı `CadReviewStore` bulunuyor. Kontrolcülerin bir kısmı ayrı pointer listener bağlıyor; bu **mimari gözlem**, somut bug'ın kök nedeni henüz değil.
- `cad-review-overlay.tsx` bazı ölçümleri sabit `"m"` birimi ve 2 ondalıkla formatlıyor; doğru unit source ile karşılaştırılmalı.
- `tests/document-studio/` altında ilgili Playwright dosyaları ve `tests/fixtures/cad-preview-v2/` altında bilinen geometri, alan 20 m², birimsiz kalibrasyon, nested INSERT, layer ve DWG/DXF fixture'ları mevcut. Mevcut E2E'nin bazı bölümleri yalnız buton aktivasyonunu doğruluyor.
- `THIRD_PARTY_NOTICES.md` **zaten** `@mlightcad/libredwg-converter` ve `@mlightcad/libredwg-web` için GPL-3.0 ve tarayıcıya dağıtılan worker/WASM asset'larını kaydediyor. `docs/cad-viewer-license-decision.md` içindeki **20 Ağustos 2026 tarihli** bazı “production'da GPL yok” ifadeleri bununla çelişiyor; tarihsel metin otomatik olarak silinmeden **güncel ek karar/not** gerekir.
- Kamuya açık MLightCAD repo yollarında `command/measure/AcApMeasure{Distance,Continuous,Area,Angle,Arc}Cmd.ts`, `AcApMeasurementGeometry.ts`, `command/markup/AcApMarkup{Rect,Circle,Cloud,Arrow,Callout,Text}Cmd.ts`, `AcApMarkupGeometry.ts`, `AcApMeasurementStore.ts`, `AcApMarkupHistory.ts` ve `docs/development/object-snap.md` dosyaları bulunuyor. Bunların **mevcut kurulu 1.6.2 public API** üzerinden erişilebildiği ayrıca kanıtlanmalı.
- CADCraft'ta `crates/engine/src/snap.rs` ve `crates/engine/src/cmd/inquiry.rs` mevcut ve Rust kaynak kodudur. **CADCraft pre-alpha/erken geliştirme** olduğundan tek başına doğruluk oracle'ı değildir; kendi test vektörleriyle doğrulanır.

### Uygulama sırasında doğrulanacaklar

Yerel Windows çalışma ağacı/başka ajan diff'leri, canlı V1 hangi route/flag ile açılıyor, hangi paylaşımlı/readonly fonksiyon gerçekten aktif, çözülmüş lock sürümleri, gerçek browser/ci/test olanakları, grafik ve mobil hissiyat, hangi review alanının kalıcı olduğu. Uzaktan GitHub kaynağı **yerel bilgisayardaki son değişikliklerin garantisi değildir**.

### Zorunlu belge okuması

`PROJECT.md` → `AGENTS.md` → `.agents/rules/cad-dxf-engine-koruma.md` → `.agents/rules/cad-v1-review-kurallari.md` → `docs/cad-dxf-engine/{README,BASELINE_MANIFEST,ARCHITECTURE,VISUAL_INTERACTION_CONTRACT,AI_CHANGE_PROTOCOL}.md` → `DOK_CONTEXT_MAP.md` → `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` → `docs/cad-review-architecture-decisions.md` → `docs/cad-review-tools.md` → `.agents/rules/test-ve-otomasyon-standardi.md`, `.agents/rules/vercel-kurallari.md` → güncel kod ve testler.

**Geri dönüş:** IGNORE2 golden kimliği `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` korunur, ancak aktif bir aşamanın normal geri dönüşü **önceki doğrulanmış çalışma commit'i** üzerinden yalnız ilgili diff'tir. Tüm repo golden'a resetlenmez.

---

## 3. Claude eleştirisinin karar tablosu

| Eleştiri | Nihai karar ve gerekçe |
|---|---|
| Şema/birim/undo ASAMA_05'te çok geç | **ALINDI.** ASAMA_02'ye alındı; mevcut v1 schema/store korunarak eksik contract tamamlanır. |
| Kök neden kanıtlanmadan yeni coordinator | **ALINDI.** ASAMA_01 kök neden/kanıt matrisi; ASAMA_03'te **yalnız zorunluysa** minimum event arbitration. |
| Uzaktan test imkânı, `NOT_RUN` çelişkisi | **ALINDI.** Otomatik/gerçek tarayıcı/fiziksel cihaz kanıtları ayrıldı; çalıştırılamayan zorunlu kabul geçilmiş sayılmaz. |
| “Tek final commit” / checkpoint çelişkisi | **ALINDI.** Kabul edilmiş **aşama başına bir anlamlı atomic commit**; ayrı tag şart değil, SHA checkpoint. |
| Mevcut GPL riskinin atlanması | **ALINDI.** ASAMA_01'de dependency + served WASM/worker lisans envanteri ve tarihsel belge düzeltmesi. Hukuki uyumluluk onayını varsayma. |
| Aşamaların çok büyük olması | **ALINDI.** 7 yerine **11 küçük, doğrulanabilir aşama**. Alt görevler aynı aşamada kalır; yarım işi PASS yazma. |
| UX'in en sona kalması | **ALINDI.** UX/keyboard/touch davranış sözleşmesi ASAMA_01'den itibaren, uygulama her ilgili araç aşamasında. |
| Saf TS geometri, önceden sabit oracle, kırmızı test | **ALINDI/UYARLANDI.** Mevcut yapıyla uyumlu saf test; hata onarımında önce kırmızı kanıt, mevcut iyi çalışan işlev için önce yeşil koruma testi. |
| Branded types, `useSyncExternalStore`, merkezi reducer, her durumda yeni coordinator | **KOŞULLU.** Yalnız ölçülmüş/kanıtlı ihtiyaç ve küçük etki alanı ile; otomatik büyük refactor yok. |
| İkinci canvas overlay önerisi | **ŞİMDİLİK ALINMADI.** SVG overlay korunur; ancak profil belirgin darboğaz gösterirse gelecekte ayrı tasarım/onay. |
| Entity alanı + açı/yay + CSV'yi hemen ekle | **SONRAKİ DÖNEME ALINDI.** Değerli, fakat kullanıcının önce mevcut tuşlar talebini büyütüyor. Öncelik sırası ayrıca verildi. |
| CADCraft snap'i direkt MLightCAD'in yerine koy | **KOŞULLU.** Önce mevcut altı snap'in matematiği; perpendicular için CADCraft geometrisi referansı, ama portun doğruluğu kendi testleriyle sınanır. |
| Her alt aşamaya ayrı commit + tag | **UYARLANDI.** Bir anlamlı kabul edilmiş **aşamaya** tek commit, otomatik tag/Preview yok. |
| MIT seçimi Apache'den her durumda daha avantajlı | **KOŞULLU.** CADCraft dual lisanslıysa uygun kullanım koşulları seçilir; kopya kodun alt bağımlılık/NOTICE ve diğer hakları ayrı incelenir. Patent/hukuk gerekçesi bir cümleyle varsayılamaz. |
| `Intl.NumberFormat('tr-TR')`, mobil hedefle-onayla, farklı marker, gerçek oracle | **ALINDI.** Mevcut UI ile uyumlu, küçük ve test edilebilir biçimde. |

---

## 4. Açık kaynak kullanma haritası

**Öncelik:** Kurulu MLightCAD'in public API'si → MLightCAD kaynak mimarisi/algoritması (uygun lisans + test) → CADCraft'tan belirli matematik/komut algoritması → mevcut kodun hedefli düzeltmesi. **Bütün GitHub repolarını proje içine kopyalama, fork açma veya yeni WASM runtime ekleme gerekmez.** Gerekiyorsa salt araştırma için geçici checkout/sparse checkout yapılabilir; üretime dökülmez.

| Kendi modül / sorun | İncelenecek somut upstream kaynak | Alınacak fikir / sınır |
|---|---|---|
| Düz mesafe ve zincir | MLightCAD `packages/cad-simple-viewer/src/command/measure/AcApMeasureDistanceCmd.ts`, `AcApMeasureContinuousCmd.ts` | Event/preview/finish/cancel, segment ve toplam, ölçüm history; çalışan mevcut distance jestini bozma |
| Alan/çevre, dejenere poligon | MLightCAD `.../measure/AcApMeasureAreaCmd.ts`, `AcApMeasurementGeometry.ts` | Polygon preview, validation, hesap yöntemi; kendi saf TS oracle ile karşılaştır |
| Snap türleri, tolerans, marker | MLightCAD `docs/development/object-snap.md`, `AcApScreenHitTest.ts`; CADCraft `crates/engine/src/snap.rs`, `crates/engine/src/snap/{curves,viewport,tracking}.rs` | Ekran→world eşlemesi; endpoint/midpoint/center/intersection; perpendicular matematiği için CADCraft referansı; existing six modes first |
| Nesne seçim ve hit test | MLightCAD `.../command/AcApSelectCmd.ts`, `.../util/AcApScreenHitTest.ts` | Ekran toleransı, selection lifecycle; kaynak entity silme/mutate etme yok |
| Şekiller, pin/metin/ok/bulut | MLightCAD `.../command/markup/AcApMarkup{Rect,Circle,Cloud,Arrow,Callout,Text}Cmd.ts`, `AcApMarkupGeometry.ts`, `AcApMarkupTextEdit.ts` | Live preview, hit/edit, cloud geometry; review overlay ve mevcut tasarım dili korunur |
| Kayıt, undo/redo | MLightCAD `.../markup/{AcApMarkupHistory,AcApMarkupStore,AcApMarkupSidecar}.ts`; `.../measure/{AcApMeasurementHistory,AcApMeasurementStore}.ts` | Transaction/serialization yaklaşımı; mevcut `CadReviewStore` varsayılan otoritedir |
| Referans CAD komutları | CADCraft `crates/engine/src/cmd/inquiry.rs`, `crates/geom/src/**` | DIST/AREA ve sınır durumları için davranış referansı; kör Rust→TS copy yok |

**Lisans kapısı (erken/P0):** `package.json`, `package-lock.json`, `THIRD_PARTY_NOTICES.md`, `docs/cad-viewer-license-decision.md`, `public/cad-upstream` üretim çıktısı ve `scripts/sync-cad-upstream-assets.mjs` ilişkilendirilecek. Zaten dağıtılan GPL-3.0 worker/WASM bileşenleri sadece “yeni GPL eklemeyelim” diye görmezden gelinmez. Mevcut kullanımın koşulları, corresponding source/NOTICE sunumu ve uygulamanın dağıtım mimarisi belgelenir; hukuki kesinlik iddia edilmez. Şüpheli mevcut bileşen **izinsiz kaldırılarak** DWG kırılmaz; kullanıcıya ayrı karar/engel raporlanır. Yeni GPL/AGPL/proprietary kod eklenmez. Kopya kodda exact URL+commit+lisans ve uygun atıf tutulur.

---

## 5. Test, kabul ve ilerleme sistemi

### 5.1 Önce bağımsız test vektörleri

Daha kod değiştirmeden veya değişikliğin ilk aşamasında, kaynak geometri oracle'larını sabitle:

| Senaryo | Beklenen | Önemi |
|---|---|---|
| (0,0)→(3,4) | Uzunluk 5 source-unit | Temel doğruluk |
| 3×4 dikdörtgen | Alan 12 unit², çevre 14 unit | Alan + çevre |
| 37° döndürülmüş 3×4 dikdörtgen | Alan 12 unit², çevre 14 unit | Rotasyon |
| (+4 000 000,+4 000 000) çevresinde 3×4 dörtgen | Alan 12 unit² | Kayan nokta iptali; referans köşeye göre shoelace |
| 3 doğrusal nokta / tekrar eden köşe / self-intersection | Açık hata/ret; sahte kesin alan yok | Bozuk geometri |
| `INSUNITS`: mm, cm, m, birimsiz | Doğru dönüşüm / birimsiz uyarısı | Birim güvenilirliği |
| Ölçek 2× | Uzunluk 2×, alan 4× | Kalibrasyon |
| INSERT nested/37°/mirror/nonuniform scale | Geometrinin gerçek world koordinatına snap | Transform edge case |
| Polyline bulge/arc | Kiriş yerine yay olarak iddia edilmez; destek yoksa gerekçeli sınırlama | Yanlış ölçü engeli |
| DPR 1/2 ve destekli zoom uçları | world→screen→world ekran sapması nominal ≤0,5 CSS px; fixture toleransı kayıtlı | Koordinat karışması |
| Çok yakın iki nokta / double-click / cancel | En fazla bir doğru commit; hayalet vertex yok | Event ownership |

**Tolerans:** Saf aritmetikte beklenen büyüklüğe ve input aralığına bağlı önceden sabitlenmiş mutlak+bağıl tolerans (ör. normal koordinatlarda yaklaşık `1e-9` relatif), zoom dönüşümünde desteklenen görünüm aralığı için hedef `≤0,5 CSS px`. Bunlar başlangıç **test hedefidir**, doğrulanmış mevcut performans iddiası değildir. Büyük ofset ve geometri yakınlığı için toleransı keyfî yükseltme; doğru sayısal yöntemi seç. Test/fixture adlarını `package.json` ve gerçek dosya üzerinden kontrol et.

**Geometri:** Saf hesaplar düzlemdir. Alan için ilk tepeye göre ötelenmiş shoelace; signed area yön bilgisi gerektiğinde saklanır, gösterilen alan büyüklüğü pozitiftir. Self-intersection tespit edilmeden “doğru oda alanı” sunulmaz. Arc/bulge için düz kenar hesabı kesin gerçek eğri alanı diye etiketlenmez. Ölçümlerde raw world geometry kalır; görüntü birimi kaynak metadata veya açık kalibrasyondur. **Kalibrasyon revizyonunun ölçüme etkisi:** Her tamamlanmış ölçüm birim/kalibrasyon bağlamının sürümünü korur; kullanıcı açıkça “yeniden hesapla” demedikçe eski kayıt sessizce değişmez; gerekiyorsa sürüm geçişi ayrı deterministik migration ile yapılır.

### 5.2 Yürütülebilir test ile manuel/ortam testi farkı

- **GitHub bağlayıcısı:** Kod, diff, fixture, test kaynakları, dal, commit, CI kayıtları ve uygun repo işlemleri incelenebilir. **Salt bağlayıcıdan** Playwright, tip kontrolü, `npm run build`, fiziksel dokunmatik veya FPS testi çalışmış sayılmaz.
- **Gerçek yürütme kanıtı:** Erişilebilir CI runner, cloud/yerel test aracı veya kullanıcının sağladığı komut çıktısı varsa `SHA + komut + fixture + browser/device + sonuç` kaydıyla PASS olur. Uygulayıcı gerçekten kullanabildiği araçları önce doğrular. GitHub Actions/Vercel Preview sırf test ortamı olsun diye otomatik tetiklenmez.
- **Manuel/gerçek cihaz kanıtı:** Uzak ortamdan doğrulanamıyorsa kullanıcı için **iki dakikalık doğrulama adımı** bırakılır. `NOT_RUN (owner=user/CI)` yazılır; test geçti diye aktarılmaz. Kritik test eksikse final durum `KOD_HAZIR_DOGRULAMA_BEKLIYOR` olur, **`TAMAMLANDI`/`RELEASE_READY` olmaz**. Kod geliştirme aşamaları şartlı sürdürülse bile final yayın kapısı açık kalır.
- **Hata testleri:** Bir bug düzeltmesinde **önce onu gösteren kırmızı test**, sonrasında yeşil test. Mevcut çalışan düz mesafede önce koruma testi. Temel oracle'lar bağımsız hesaplanır; en az bir sayısal testin kasıtlı yanlış sonuçta kırıldığı (geçici, commit edilmeyen test mutasyonu) doğrulanırsa kanıt kaydedilir. İlgisiz bütün testler her aşamada tekrar edilmez.
- **Test scriptleri:** `npm run check:cad-review:release`, `npm run check:cad-real-user-release`, `npm run check:cad-preview-v2` gerçekten `package.json` içinde var. Bunlar bazen geniş kompozit testlerdir; ilgili dar Playwright/TSX testleri önce çalıştırılır. Testte timeout, browser close ve cleanup `.agents/rules/test-ve-otomasyon-standardi.md` uyarınca yapılır.

### 5.3 Branch ve kabul protokolü

**Başlangıç:** Kural dalından yeni korumalı uygulama dalı (öneri: `internal-cad-v1-pro-review-r2-20261102`) aç; önce `main` ile HEAD/drift ve yetkisiz değişiklik çatışmasını kontrol et. GitHub tek tree/tek atomic commit tercih edilir; dal başına değil **kabul edilen anlamlı aşama başına** tek commit. Commit `[...] [skip ci]` veya `[skip vercel]` içersin; çalışan branch'e `main` force merge yok. Her commit SHA aşama rollback/checkpoint kaydıdır. `git tag` zorunlu değil ve sırf tag olsun diye network/yayın işlemi üretilmez.

**Kalıcı dosyalar (yalnız ASAMA_01 başlayınca):** `docs/cad-v1-review/PLAN.md` ve `docs/cad-v1-review/IMPLEMENTATION_STATE.md`. Geçmiş plan rev 1 saklanabilir ama **uygulanacak tek aktif plan rev 2**; belgenin yeniden okunması her aşamada sıfırdan araştırma anlamına gelmez.

İlerleme örneği:

```yaml
plan_id: CADV1-PRO-REVIEW-20261102
plan_revision: 2
planning_status: PLAN_HAZIR
execution_status: BASLAMADI  # BASLAMADI | DEVAM_EDIYOR | ENGELLI | KOD_HAZIR_DOGRULAMA_BEKLIYOR | TAMAMLANDI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
checkpoints: []     # ASAMA_XX, commit SHA, changed paths
verification: []    # auto / CI / manual / NOT_RUN, owner, SHA, fixture, result
blockers: []
updated_at: null
```

**Aşama rapor şablonu:** Aşama kimliği, gerçek değişen dosyalar/izin sınırı, root-cause kanıtı, verilen test komutları ve sonucu, kısa iki dakikalık kullanıcı testi (çizim, tuş, beklenen değer), V1 renderer/fallback hash/değişiklik durumu, commit SHA, kalan NOT_RUN/BLOCKED, sıradaki aşama. Gerek yoksa ekran görüntüsü/video uydurulmaz. `ASAMA_01` dışında bütün keşif yeniden yapılmaz.

---

## 6. Aşama haritası

| Kimlik | Tamamlanan somut sonuç | Neden bu sıra |
|---|---|---|
| **ASAMA_01** | Mevcut tuş + kök neden envanteri, Oracle/baseline, GPL durumu, çalışma dalı | Varsayımla rewrite engeli |
| **ASAMA_02** | Mevcut schema/unit/undo sözleşmesinin güvenli hâle gelmesi, araç UX durum tablosu | Sonraki araçlar aynı veriye yazar |
| **ASAMA_03** | Birinci uçtan uca dikey dilim: **zincir mesafe + ihtiyaç kadar OSNAP/event düzeltmesi** | Erken gerçek kullanıcı kazanımı |
| **ASAMA_04** | Mevcut **düz mesafe**nin korunarak profesyonelleştirilmesi | İyi davranışı bozmama |
| **ASAMA_05** | Manuel **alan/çevre** hesabı ve gesture doğruluğu | Sayısal güven |
| **ASAMA_06** | Seçim, dikdörtgen, daire, revizyon bulutu, callout | Geometrik markup |
| **ASAMA_07** | Pin/metin, serbest çizim, silgi ve tarihçe | Kalan mevcut araçlar |
| **ASAMA_08** | Kayıt/reload, backward compatibility, JSON/DXF/PNG/PDF export | Verinin ömrü |
| **ASAMA_09** | Katman, arama, desktop/mobil CAD UX | Bulunan ölçülerin kullanışlılığı |
| **ASAMA_10** | Büyük dosya performansı, gerçek çizim regresyonları, dayanıklılık | Ölçülen darboğazları gider |
| **ASAMA_11** | Bağımsız final kabul, lisans/doküman/rollback, yayınlanmamış teslim | Sahici kabul kapısı |

---

## 7. Ayrıntılı uygulama aşamaları

### ASAMA_01 — Gerçek envanter, kök neden kanıtı, kaynak ve lisans başlangıcı

**Giriş:** Kullanıcı `ilk aşamadan başla` dedi. Mevcut plan/kural dalı ve `main` kontrol edilir.

**ALLOWED_PATHS:** Yeni `docs/cad-v1-review/{PLAN,IMPLEMENTATION_STATE}.md`, gerekli araştırma kayıtları aynı state dosyasında, **mevcut** lisans belgesine yalnız gerçek durum ek notu; gerekli saf oracle test dosyaları. **FORBIDDEN_PATHS:** Parser/renderer/worker/fallback, dependency/lock, V2, production ayarı, kullanıcı DB/fixtures.

**Yapılacaklar:**
1. Kuralları oku; HEAD/branch/şimdiki kullanıcı değişiklikleri, gerçek V1 route ve flags, mevcut fixture/test dosyalarının adı, resolved paket sürümlerini kaydet. Yeni çalışma dalını güvenli aç. Plan rev 2'yi ve state başlangıcını kaydet.
2. Her buton için **görünen etiket → callback → controller → snap/adapter → overlay/store → save/export** tablosu. Her şüpheli sorun için `belirti | tekrar adımları | kod/gerçek olay kanıtı | kök neden (kanıtlı/hipotez) | düzeltme önerisi | test durumu`. **Kanıtlanmamış kök nedeni gerçekmiş gibi yazma.**
3. Var olan düz mesafenin davranışını korumak için mevcut test ve fixture haritası; bağımsız sayısal oracle değerleri **kod değişmeden** sabitlenir. Erişilen çalışma ortamında mümkünse kırmızı reproducer; çalıştırılamayanlar NOT_RUN ve sahip/talimatıyla.
4. MLightCAD 1.6.2 API ile upstream `main` farklarını ve CADCraft kaynak yollarını kontrol et. İşlev bazlı `kullan / referans al / alma` ve exact lisans kayıtları çıkar.
5. **GPL P0:** `THIRD_PARTY_NOTICES.md`, GPL worker/WASM, mevcut lisans kararı ve dağıtım manifesti arasındaki farkları tespit et; tarihi belgeyi silme, güncel ek durum ve hukuki belirsizliği yaz. Kullanıcı kararı gerektiren risk varsa ayrı engel belirt; çalışan DWG'yi izinsiz kapatma.
6. Desktop/mobil **2 dakikalık baseline kontrol listesi** hazırla: mevcut `known-geometry-measurements.dxf`, mesafe/zincir/alan, ESC, zoom ve yenileme; ekran görüntüsü ancak gerçekten yakalanırsa iliştir.

**Doğrulama:** Kaynak/fixture/path varlığı; plan ve state tutarlılığı; mevcut hedefli testlerin kapsam analizi; veri/renderer diff'inin sıfır olması. Erişilebilir test varsa çıktı+SHA kaydı.

**Kabul:** Tam buton envanteri, sorunların kanıt derecesi, önceden sabit oracle, lisans risk raporu, tek çalışma dalı/checkpoint; `NOT_RUN` testlerin sahipleri belirtilmiş. **Geri dönüş:** Sadece bu aşamanın doküman/test notları geri alınır. **Dur:** ASAMA_02 için `devam` bekle.

### ASAMA_02 — Önce veri, birim, tarihçe ve etkileşim sözleşmesi

**Giriş:** ASAMA_01 kaynak haritası ve kod gerçekleri kabul edilmiş.

**ALLOWED_PATHS:** `src/lib/dokumantasyon/cad-review/{schema,store,units,measurement-facade}.ts`, yalnız gerekli saf TS yardımcıları, hedefli Node/TSX testleri; dar UI birim açıklaması. **FORBIDDEN_PATHS:** Renderer/parser/worker/routing, V2, dependency, yıkıcı DB migration.

**Yapılacaklar:**
1. Mevcut **v1 Zod schema ve `CadReviewStore` undo/redo** ile başlayıp mevcut item/units davranışını envanterle. Yeni şema gerekiyorsa geriye dönük okunabilir, sürümlü, zod doğrulamalı adaptasyon yap; baştan paralel ikinci store kurma.
2. Tek committed transaction/undo, session UI ve transient draft ayrımını uygula; ölçüm sonucu bir kez commit, tek undo step, reddedilen işlem sıfır commit. Eski item'ların round-trip fixture'ı önce koruma testi olur.
3. Source-unit, display-unit, `INSUNITS`/metadata, bilinmeyen birim ve kalibrasyon sürümü ayrımını tanımla. **Raw world geometri + ölçümün kullanıldığı scale snapshot** korunur; eski kayıtlar açık yeniden hesaplama olmadan sessizce değişmez. Alan scale².
4. State machine davranış sözleşmesi ve input tablosu yaz: seçili araç, imleç/snap marker, ESC (ilk iptal, sonra araç kapatma), Enter/Bitir, Backspace son nokta, double-click, focus/gesture/pointercancel, tool switch, pan/pinch. **Henüz gerekçesiz merkezi coordinator yazma.**
5. Saf geometri/units testlerini `tsx`/Node mevcut test yaklaşımıyla gerçekleştir; test için ham sayısal snapshot erişimi üretimde gizli debug API açmadan mümkünse store/test adapter üzerinden sağlanır. Kopya React render snapshot'ı değer oracle'ı değildir.

**Doğrulama:** Schema invalid/legacy/round-trip, unit conversion 2×→4×, history atomicity, source unit unknown, 3-4-5 oracle; ilgili types/lint. **Kabul:** ASAMA_03–08 artık tek veri/units/undo contract'ına yazabilir; eski review kaydı okunur; yeni veri kaybı yok. **Geri dönüş:** Versiyonlu compatibility, minimal diff; eski kayıtlar bozulursa engel. **Dur:** ASAMA_03 için `devam`.

### ASAMA_03 — İlk dikey dilim: zincir mesafe, doğru OSNAP ve input ownership

**Giriş:** ASAMA_02 contract, ASAMA_01 kök neden tablosu.

**ALLOWED_PATHS:** `cad-upstream/{chain-distance,snap-engine,snap-catalog,snap-settings,precision-ux}.ts`, `cad-review/{pointer-router,measurement-facade}.ts`, ilgili overlay ve testler; `adapter.ts`/`cad-upstream-viewer.tsx` **yalnız zorunlu dar bridge, gerekçeli**. **FORBIDDEN_PATHS:** Parser/renderer/worker/fallback, MLightCAD dependency upgrade, V2.

**Yapılacaklar:**
1. Zincirin `click → resolved world point → segment preview → commit → undo → reload → export` dikey akışını mevcut kodla tekrar üret. Kanıtlanan event çakışmasını önce mevcut `CadPointerRouter` veya dar listener sahibi üzerinde çöz. Yeni coordinator **ancak hiçbir mevcut düşük riskli çözüm yeterli değilse** ve testle gerekli olduğu gösterilirse.
2. Aktif altı snap türünü (endpoint/midpoint/intersection/center/nearest/perpendicular) test et. Mouse hover ile aynı seçilen target commit edilmeli. Gizli/frozen layer, nested/mirrored/rotated INSERT, arc/bulge ve CSS px↔world toleransı için negatif ve pozitif testler. Perpendicular hesabında CADCraft math referansı kullanılabilir; copy/port yalnız bağımsız oracle+license ile.
3. Snap performansı için başlangıç `pointermove` sorgu sayısı/latency örnekle. O(n) tarama gerçekten darboğazsa mevcut index/API veya bounded spatial candidates kullan; baştan grid/quadtree bağımlılığı kurma. Katman değişiminde cache invalidation.
4. Zincirde segment toplamları, Backspace, Enter/Bitir, çift tık fazladan vertex yok, Escape ve pointercancel doğru; tek committed item ve undo. Mobil doğrudan parmakla belirsiz commit yerine gerektiğinde nişan al–onayla akışı bu araçta küçük kapsamlı uygulanır.

**Doğrulama:** `cad-chain-measurement`, `cad-native-measurements`, snap numeric fixtures, nested insert/layer; mevcut düz mesafe smoke, world↔screen ve pan/zoom korunumu. **Kabul:** Zincir başlangıçtan export/reopen'a tekil ve doğru; snap güvenilir; mevcut düz mesafe regresyonu yok. **Geri dönüş:** Sadece yeni snap/ownership diff; host/adapter değiştiyse ayrı gerekçeli revert. **Dur:** ASAMA_04 için `devam`.

### ASAMA_04 — Düz mesafenin hassas ve tutarlı tamamlanması

**Giriş:** Zincir/OSNAP contract doğrulandı.

**ALLOWED_PATHS:** `cad-upstream/distance-measurement.ts`, `cad-distance-overlay.tsx`, ilgili measurement bridge/store ve testler. Korunan adapter/host yalnız gerekli dar hook. **FORBIDDEN_PATHS:** Core renderer/parser/fallback, yeni distance renderer, V2.

**Yapılacaklar:**
1. Kullanıcının kısmen düzelen düz mesafe jestini baseline ile karşılaştır: tıklama, press-hold, drag, ikinci nokta, ESC, pan, tool switch.
2. MLightCAD DistanceCmd live-jig ve output davranışıyla sadece eksikleri kıyasla; mevcut iyi gesture sıfırdan değiştirilmez.
3. İki world noktası, canlı ölçüm, seçim/snap marker, görüntü birimi, tek item, tek history ve görünür etiket/panel eşleşmesi. Artık local distance + review store **ikili committed** kayıt üretmemeli; geçiş geçici olacaksa tek owner ve bitiş koşulu açık.
4. Kaynak koordinat yüksekliği, sıfır uzunluk, pan/zoom/DPR ve double click ile geç kalan async commit testleri.

**Doğrulama:** `cad-stage5-distance-measurement`, `cad-measurement-units`, saf 3-4-5 ve mevcut mesafe jest regresyonu. **Kabul:** Önceki deneyim bozulmaz; doğru birim, tek overlay item, reload/undo/export consistent. **Geri dönüş:** Sadece bu ölçüm köprüsüne ait diff. **Dur:** ASAMA_05 için `devam`.

### ASAMA_05 — Manuel alan ve çevre ölçümü, kararlı geometri

**Giriş:** Veri/OSNAP/distance contract PASS.

**ALLOWED_PATHS:** `cad-upstream/area-measurement.ts`, `cad-area-overlay.tsx`, saf polygon/units yardımcıları, measurement store/bridge ve testler. **FORBIDDEN_PATHS:** Source DWG entity mutation, parser/renderer, yeni topolojik entity engine.

**Yapılacaklar:**
1. En az üç ayrı noktalı gerçek polygon; canlı kapatma önizlemesi, bitir/iptal, Esc/Backspace/double-click kontrolü. Yanlışlıkla kendini kesen, dejenere, sıfıra yakın kenarlı polygon reddedilir veya açık, ölçümsüz uyarıyla sınırlandırılır; sessiz yanlış alan yok.
2. UTM benzeri büyük offsetlerde referans köşeye göre ötelenmiş shoelace, kapalı çevre, CW/CCW/signed area, rotasyon ve negative scale testleri; birim ve kalibrasyon scale².
3. Doğru yüzey/kenar tanımı olmadan arc/bulge alanını “kesin eğrili alan” sunma; bu aşamada **kullanıcı nokta-nokta düz polygon** ölçümü olduğuna dair etiket ve gerekirse sınır uyarısı.
4. Alanı tek world review item olarak kaydet; seçim, silme, history, reload/export ve mobil Bitir ile tek komut.

**Doğrulama:** `cad-stage6-area-measurement`, `cad-measurement-units`, `stage9-area-20m2.dxf`, `stage9-unitless-calibration.dxf`, 37° rotasyon/4e6 offset/self-intersect fixture. **Kabul:** Doğru alan/çevre + birim, geçersiz geometrilere yanlış başarı yok; V1 motor korunur. **Geri dönüş:** Alanı etkileyen dar saf geometri+UI diff. **Dur:** ASAMA_06 için `devam`.

### ASAMA_06 — Seçim, dikdörtgen, daire, revizyon bulutu ve callout

**Giriş:** Ölçüm/units/undo ve input lifecycle oturdu.

**ALLOWED_PATHS:** `cad-review/{markup-controller,markup-facade,hit-test,cloud-generator}.ts`, `cad-review-overlay.tsx`, ilgili toolbar/shape testleri. **FORBIDDEN_PATHS:** Source entity erase/move/copy, renderer, yeni unrelated editor tool.

**Yapılacaklar:**
1. Overlay öğesi hit-test, tek seçim/uygun durumda çoklu seçim, hover/selected/handles ayrımı; readonly/gizli öğe ve layer davranışı. CAD source entity seçimi ile review item seçimi ayrı anlaşılır.
2. Rect/circle/cloud/arrow/callout: drag preview doğru geometri, zoom'dan bağımsız etiket/stroke görünümü, tamamlandığında tek commit; ters yön, küçük boyut, zoom sırasında hareket, Escape/lostcapture testleri.
3. MLightCAD markup geometry/jig kaynaklarını kıyasla, yalnız lisans/versiyon doğrulanmış küçük algoritmayı kullan; source URL+SHA+attribution ve kendi test.
4. Delete/undo/redo ve taşınabilir seçili review geometri; desteklenmeyen resize/edit butonu sahte çalışıyor görünmesin.

**Doğrulama:** `cad-markup-tools`, `cad-review-core`, `cad-stage3-review-tools` ve hedefli yeni shape/pick testleri. **Kabul:** Var olan şekil/seçim tuşları doğru ve kalıcı; DWG source untouched. **Geri dönüş:** Yalnız markup/hit-test katmanı. **Dur:** ASAMA_07 için `devam`.

### ASAMA_07 — Pin, metin, serbest çizim, silgi ve tekil history

**Giriş:** Seçim ve şekiller PASS.

**ALLOWED_PATHS:** `cad-review/{markup-controller,freehand-controller,stroke-simplifier,store,security}.ts`, review overlay, sınırlı in-app edit UI ve testleri. **FORBIDDEN_PATHS:** Source entity mutation, worker/parser/fallback, yeni kütüphane gerekçesiz.

**Yapılacaklar:**
1. Pin/text için `window.prompt` yerine mevcut tasarım diline uygun küçük klavye/dokunmatik formu; kaydet/iptal/boş değer, `textarea`, fokus geri verme, güvenli metin/sanitizasyon. Alt sistemde `window.prompt` başka amaçla varsa yalnız ilgili çağrıyı değiştir.
2. Mouse/stylus/touch serbest çizim, destekli `getCoalescedEvents()`, sakin hat, bounded simplification, dev stroke ve zoom/pan sonrası kararlılık. Ölçülmüş ihtiyaca göre rAF batching; gereksiz global React rerender yok.
3. Silgi yalnız review item'ını siler; yanlışlıkla tüm CAD source entity/çizim değişmez. Silinen item undo ile tek adımda geri gelir.
4. Tek committed transaction, hızlı tool switching, Escape, pointercancel ve double-click; dokunmatik nişan/zoom çakışmaları.

**Doğrulama:** `cad-freehand-stroke`, `cad-markup-tools`, `cad-review-security-qa`, history testleri ve ilgili mobil testler. **Kabul:** Pin, metin, serbest çizim, silgi gerçek kullanımla kalıcı ve geri alınabilir. **Geri dönüş:** Sadece etkilenen controller/UI. **Dur:** ASAMA_08 için `devam`.

### ASAMA_08 — Kayıt, yeniden açma, eski veriler ve mevcut dışa aktarma

**Giriş:** Tüm mevcut ölçüm/markup item'ları aynı committed data contract'ına uyuyor.

**ALLOWED_PATHS:** `cad-review/{repository,export-json,export-dxf,export-image,schema,security}.ts`, ilgili export UI ve testleri; yalnız gerçek zorunluluk varsa ilgili backend persistence bridge. **FORBIDDEN_PATHS:** Source DWG rewrite, yıkıcı veri migration, unrelated auth/storage refactor.

**Yapılacaklar:**
1. Gerçek fileId+version/fingerprint'e bağlanan review JSON ve mevcut schema versiyonu için backward compatibility. Reload/reopen/feature-flag disable/enable/readonly/share koşulları; eski veri sessizce yeni çizim sürümüne reanchor edilmez.
2. Her item için `create → save → reload → select → undo/redo → export` tutarlılığı. Başarısız save/409 conflict/çoklu sekme işlevi **mevcut storage davranışı incelendikten sonra**; yeni genel senkronizasyon alt sistemi kurma.
3. JSON round-trip, review-only DXF, mevcut PNG/PDF görüntü export'u test: source+overlay koordinat ve görünürlük, geçici hover/draft UI dışarıda, Türkçe font ve renk okunurluğu. Export çalışmayan formatı gerçek kaydedilmiş gibi gösterme.
4. Kaynak CAD fingerprint önce/sonra aynı. Refactor sırasında eski item'lar kaybolmaz, tekrar görünmez; gerektiğinde non-destructive lazy compatibility ve dar rollback.

**Doğrulama:** `cad-review-export`, `cad-review-rollback`, `cad-readonly-contract`, mevcut file reload ve JSON fixture testleri. **Kabul:** Review lifecycle ve halihazırda sunulan export formatları kanıtlı; dosya bozulmadı. **Geri dönüş:** Eski serialization okuyucu korunur; yalnız yeni writer/adapter diff geri alınır. **Dur:** ASAMA_09 için `devam`.

### ASAMA_09 — CAD UX: katman, arama, snap geri bildirimi ve mobil kullanım

**Giriş:** Mevcut araçlar işlevsel ve kaydedilebilir.

**ALLOWED_PATHS:** `cad-studio-ribbon.tsx`, `cad-review-side-panel.tsx`, `cad-layer-panel.tsx`, snap settings/marker, text search, review overlay, responsive UI testleri. **FORBIDDEN_PATHS:** Yeni renderer/parsing/worker/dependency, büyük stil redesign ve izinsiz toolbar yeniden tasarımı.

**Yapılacaklar:**
1. Tek satırlı anlaşılır durum: hangi araç, hangi birim, snap açık/kapalı, hangi nokta türü; imleç yanı canlı uzunluk/alan; seçili/hover/draft/committed ayrı çizgi/ikon/halo. Açık-koyu-beyaz CAD zemininde ve renk görme farklılıklarında okunabilirlik.
2. Masaüstünde Esc/Enter/Backspace, input odak izolasyonu, araç tooltip/kısayol tutarlılığı; `tr-TR` format, kısa hata ve ipuçları. Yeni F3/F8/ortho/polar işlevleri ancak mevcut sistemde varsa doğrulanır; yeni ürün gereksinimi olarak zorlanmaz.
3. Mobilde parmak ölçüm noktasını kapatıyorsa **hedefle–onayla** / mevcut loupe/offscreen cursor çözümünü dar biçimde kullan; alt Bitir/İptal/Geri, 44×44 hedef, safe-area, pinch sırasında yanlış vertex yok. Dokunmatik snap toleransını ölçerek ayarla; mouse toleransına körce eşitleme.
4. Katman visibility/locked/frozen ve snap seçimi aynı renderer state'i; metin arama ve `zoomToBounds` gerçek çizimden sonuç verir, desteklenmiyorsa gerekçeli disabled. Pan/fit/fullscreen korunur.

**Doğrulama:** `cad-a11y-responsive-ux`, `cad-mobile-*`, `cad-text-search`, `cad-public-layer-store`, ilgili toolbar/keyboard testleri; erişilebilirse screenshots ve kullanıcı kontrol listesi. **Kabul:** Şekil/ölçü şeffaf, erişilebilir, yanlış commit olmadan kullanılır; layer/search gerçek çalışır. **Geri dönüş:** Dar UI/test diff. **Dur:** ASAMA_10 için `devam`.

### ASAMA_10 — Performans, gerçek DWG/DXF ve dayanıklılık kapısı

**Giriş:** Bütün mevcut tuşlar akış ve veri olarak kabul edilmiş.

**ALLOWED_PATHS:** Yalnız profilin sorun gösterdiği review/snap/overlay ve test kodu; gereken küçük cache/invalidation. **FORBIDDEN_PATHS:** Yeni Canvas/WebGL renderer, full parser/worker replacement, V2; profiling olmadan gereksiz optimization.

**Yapılacaklar:**
1. Aynı fixture/ekran/ölçüm yöntemiyle önce/sonra karşılaştır: input → preview latency, snap candidate query count, render/frame jank, heap/teardown, dosya değiştirme, büyük DWG/DXF ve yoğun review. Sonuç olmayan “60 FPS”, “sıfır gecikme” iddiası yok.
2. Kanıtlı darboğaz varsa mevcut MLightCAD spatial API veya bounded geometry index/cache; layer/viewport/file switch invalidation. React render döngüsü ölçülmüşse rAF/coalescing. Aşırı geniş indeks ve yeni vendor renderer yok.
3. Gerçek DWG/DXF fixture'larda nested INSERT/mirror/nonuniform scale, büyük koordinat, hatch, fonts, layer, model/paper space, DXF fallback ve status/teardown. Fiziksel mobil/stylus varsa ayrı gerçek cihaz kabulü; yoksa açık `NOT_RUN`.
4. Renderer host hash/diff, cached/full/fallback yolları ve original file hash karşılaştır; WebGL context loss, re-open/refresh ve read-only/export yanlış başarıları test.

**Doğrulama:** `npm run check:cad-real-user-release`, ilgili hedefli perf/mobile/render/fallback testleri; erişilebilirse controlled `npm run build` ve ölçülmüş browser smoke. **Kabul:** Sayısal correctness ve mevcut engine/fallback korunmuş; performans geri gidişi yok veya gerekçeli ölçülmüş; zorunlu erişilemeyen testler finalde açık. **Geri dönüş:** Yalnız sorunlu cache/perf diff. **Dur:** ASAMA_11 için `devam`.

### ASAMA_11 — Bağımsız nihai kabul, belge/attribution ve kontrollü teslim

**Giriş:** Önceki aşamalar gerçek uygulanmış ve kaynak değişiklikleri checkpoint'lenmiş; kritik konular için kabul kanıtı var veya açık engel olarak ayrılmış.

**ALLOWED_PATHS:** `docs/cad-review-tools.md`, `docs/cad-review-architecture-decisions.md`, `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`, `THIRD_PARTY_NOTICES.md`, mevcut kurallara gerekirse minimal güncelleme, plan/state ve ilgili son test düzeltmeleri. **FORBIDDEN_PATHS:** `main` merge/force-push, Vercel Preview/Production deploy, keyfi yeni özellik, parser/renderer rewrite.

**Yapılacaklar:**
1. V1 mevcut her buton için tek kabul matrisi: `PASS / FAIL / NOT_RUN / BLOCKED`, kim test etti, hangi commit/fixture/cihaz, beklenti/gerçek, ilgili ekran/sayısal oracle ve kalan risk. Sadece aynı ajanın kendi testi değil; mümkün olduğunda bağımsız fixture/ikinci göz/manuel karşılaştırma.
2. Uygun hedefli TypeScript, ESLint, saf TS testleri, `npm run check:cad-review:release`, `npm run check:cad-preview-v2`, gerekliyse `npm run build` bir kez ve test maliyetine uygun sırada yürütülür. Erişim yoksa çalıştırılmış gibi yazılmaz. Zorunlu araç/ekran kabulü `NOT_RUN` veya `BLOCKED` ise **release-ready değil**, `KOD_HAZIR_DOGRULAMA_BEKLIYOR` veya `ENGELLI`.
3. Güncel çalışma koduyla yaşayan mimari/araç belge eşleştirmesi. İlgili upstream SHA/lisans/telif/NOTICE, GPL karar belgesindeki güncel durum, protected core diff, fallback ve restore yolu tek raporda.
4. Son kabul verilirse state `TAMAMLANDI`, `next_stage=null`, `active_stage=null`; doğrulanmış dal/son checkpoint SHA ve değişen dosyalar bildir. Kabul yoksa nedeni ve gerekli dış test tam listesi raporlanır, otomatik bitmiş görünmez.
5. **Deployment yok.** Kullanıcı daha sonra yayın isterse mevcut kurallar uyarınca bir kez kontrollü release ve Vercel doğrulaması ayrı açık komutla yapılır. `main`e merge veya Preview bu aşamanın ödülü değildir.

**Doğrulama:** Final diff, kaynak/fixture hash, test logları ve manuel/otomatik kabul matrisi. **Kabul:** Zorunlu mevcut araçlarda FAIL/BLOCKED/NOT_RUN kalmamış, release testleri kanıtlı, lisans/rollback belgeleri tamam, kaynak DWG/DXF değişmemiş. **Geri dönüş:** Final belge değişikliği scope'a göre geri alınır; başarısız kabulde release engellenir. **Dur:** Plan tamamlandıysa salt `devam` üzerine hiçbir işlem yapma.

---

## 8. Sonraki sürüm için öncelikli backlog — otomatik uygulanmayacak

1. **Kapalı entity üzerinden tek seçimle alan/çevre:** Kapalı polyline/circle ve bulge'lu kenarlarda gerçek eğri topolojisi; kaynak metadata ve nested block transform doğruluğu şart. Hatch sınırı ayrı kabul.
2. **Açı, yay uzunluğu, yay açıları:** MLightCAD `AcApMeasureAngleCmd.ts`, `AcApMeasureArcCmd.ts` uygun sürüm/API testleriyle.
3. **Ölçüm listesi → CSV** (Excel'in okuyacağı doğru UTF-8/Türkçe sayı/ayraç sözleşmesi) ve entity özellikleri/handle/katman/uzunluk/alan sorguları.
4. **Profesyonel komut ilerlemesi:** Ortho/polar, F3/F8 ve dinamik sayısal giriş, seçili eleman özellikleri ve sonra gerçek DWG entity editing. Hiçbiri V1 mevcut buton kabulünü geciktirmemeli.

---

## 9. Kaynak bağlantıları

**Kendi repo ve belgeler**
- https://github.com/smitelagwar/muhendislik-site
- https://github.com/smitelagwar/muhendislik-site/blob/internal-cad-v1-review-standard-20261102/.agents/rules/cad-v1-review-kurallari.md
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/dokumantasyon/cad-review/schema.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/dokumantasyon/cad-review/store.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/THIRD_PARTY_NOTICES.md
- https://github.com/smitelagwar/muhendislik-site/blob/main/docs/cad-viewer-license-decision.md

**MLightCAD**
- https://github.com/mlightcad/cad-viewer
- https://github.com/mlightcad/cad-viewer/tree/main/packages/cad-simple-viewer/src/command/measure
- https://github.com/mlightcad/cad-viewer/tree/main/packages/cad-simple-viewer/src/command/markup
- https://github.com/mlightcad/cad-viewer/blob/main/docs/development/object-snap.md
- https://github.com/mlightcad/cad-viewer/blob/main/docs/development/entity-modification-best-practices.md

**CADCraft**
- https://github.com/storytold/cadcraft
- https://github.com/storytold/cadcraft/blob/main/crates/engine/src/snap.rs
- https://github.com/storytold/cadcraft/blob/main/crates/engine/src/cmd/inquiry.rs
- https://github.com/storytold/cadcraft/tree/main/crates/geom/src
- https://github.com/storytold/cadcraft/blob/main/ROADMAP.md

**Karşılaştırılan Claude raporu:** `CAD_V1_PLAN_ELESTIRI_RAPORU (1).md` (02.11.2026). Bu planda raporun önerileri eleştirel biçimde değerlendirilmiş; tümü otomatik kabul edilmemiştir.

---

## 10. Uygulama komutu ve kesin durma protokolü

> **İlk komut:** “Bu revizyon 2 CAD V1 planında `ASAMA_01`e başla. Önce zorunlu repo kurallarını, `main` ve çalışma dalı HEAD'lerini ve mevcut ilerleme durumunu oku. Yalnız ilk aşamayı uygula; kabulünü gerçek kanıtlarla doğrula, tek checkpoint ile ilerleme kaydını güncelle ve dur. `main`e yazma; Preview/Production deploy yapma.”

- `ilk aşamadan başla` → `ASAMA_01`. Sonraki her `devam` → **en fazla tek aşama**; aktif aşama yarım kaldıysa **yalnız onu sürdür**.
- Aşama kabulü eksikse `DEVAM_EDIYOR` veya `ENGELLI`; tamamlandı gibi işaretleme yok. Bu durumda bir sonraki `devam` da aynı aşamayı sürdürür. Kullanıcıdan her ufak değişiklik için soru sorma; gerçek erişim/izin engelinde dürüst dur.
- Aşama bitince yalnız kısa özet, SHA, test/NOT_RUN ve **iki dakikalık kontrol**; arka planda kendiliğinden çalışma veya gereksiz push/deploy yok.
- Tüm zorunlu testler ve araçlar kabul edilirse `execution_status=TAMAMLANDI`; o andan sonra salt `devam` → **“Plan tamamlandı; uygulanacak başka aşama yok.”** Herhangi bir kod, test, commit veya deploy başlatma.
- Salt `plan yap` mevcut içerikten kod uygulanması veya GitHub yazılması yetkisi değildir. Plan rev 2'nin oluşturulması tek başına bir aşamanın tamamlandığı anlamına gelmez.