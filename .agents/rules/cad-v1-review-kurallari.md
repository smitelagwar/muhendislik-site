# CAD V1 — Gerçek Web CAD Deneyimi: Ölçüm, İnceleme ve Etkileşim Sözleşmesi

> **ZORUNLU AJAN KURALI · 2 Kasım 2026.** ChatGPT, Codex, Gemini, Claude, Antigravity ve diğer yerel/uzak AI ajanları DWG/DXF **V1** görüntüleyici, toolbar, OSNAP, mesafe/alan/zincir ölçümü, review/markup, seçim, katman, yorum, pointer, undo, kayıt veya export işini araştırmadan, planlamadan ya da kodlamadan **önce** bu dosyayı okur. Bu belge uygulanmış bir özellik, hazır plan veya tamamlanmış release beyanı değildir.

## 1. Ürün vizyonu ve değişmez öncelikler

**Hedef:** Web ve mobilde mühendislere gerçek CAD hissi veren, DWG/DXF dosyalarını güvenilir biçimde açan, hassas ölçüm ve işaretleme yaptıran, giderek zenginleşen bir çalışma alanı. **Önce mevcut tuşlar** doğru, akıcı ve güvenilir hale getirilecek; daha sonra yeni ölçüm/inceleme işlevleri, ancak ayrı kapsam ve izinle **gerçek CAD entity düzenleme** eklenecek. “Dünyada ilk” gibi iddialar yerine nesnel kalite ve kullanıcı deneyimi kanıtı aranır.

**Asla riske atılmayacaklar:** Çalışan DWG/DXF V1 dosya açma ve çizim fidelitesi, parser/renderer/worker, cache ve WASM, font ve metin, layer görünürlüğü, source/monochrome ve lineweight, model/paper space, kamera/pan/zoom/fit, loading/error/retry/download, source dosya bütünlüğü ve fallback. Sırf düzenleme aracı sorunlu diye bütün motor yeniden yazılmaz. Ayrı V2 (ör. `src/lib/cad-v2/**`, `motor_v2/**`, `dwg_V2/**`) otomatik değiştirilmez veya production primary yapılmaz.

**Review değişmezliği:** Ölçü, şekil, metin, pin, bulut, stroke, yorum ve seçili nesne düzenlemeleri ayrı overlay/review verisidir; orijinal DWG/DXF entity tablosuna veya ham dosya byte'larına dokunmaz. Review-only JSON/DXF ile gerçek DWG/DXF yazma farklı yeteneklerdir; başka formatı `.dwg` uzantısıyla sahte biçimde kaydetme. Gerçek CAD entity değişikliği ayrı tasarım, format, lisans, undo ve veri kurtarma kabulü gerektirir.

## 2. Zorunlu okuma ve kapsam sınıflandırma

Kod/plan öncesi sırayla:
1. `PROJECT.md` → `AGENTS.md` → `.agents/rules/cad-dxf-engine-koruma.md` → **bu dosya**. İlgili `.agents/rules/*.md` dosyalarını, özellikle test için `test-ve-otomasyon-standardi.md` ve GitHub/deploy için `vercel-kurallari.md` oku.
2. `docs/cad-dxf-engine/README.md`, `BASELINE_MANIFEST.md`, `ARCHITECTURE.md`, `VISUAL_INTERACTION_CONTRACT.md`, `AI_CHANGE_PROTOCOL.md`.
3. `DOK_CONTEXT_MAP.md`, `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`, `docs/cad-review-architecture-decisions.md`, `docs/cad-review-tools.md`.
4. Güncel branch/HEAD/dirty state, gerçek route, aktif engine/feature flag, source ve testleri incele. Tarihsel golden, RELEASE READY veya PASS notları **bugünkü tüm tuşların çalıştığı kanıtı değildir**. Belgeler kod/gerçek testle çelişirse eski belgeye uymak için çalışan kodu geri götürme; önce doğru durumu belirle, yaşayan belgeyi aynı işte güncelle.
5. Çalışmayı `V1 REVIEW/TOOL`, `V1 ADAPTER/INTERACTION`, `V1 CORE PARSER/RENDER/WORKER/ROUTING` veya `V2 SERVER ENGINE` olarak ayır. Bir alanda değişiklik yetkisi diğerine izin sayılmaz.

## 3. İlk kaynak incelemesinin bulguları (test edilmemiş riskler)

V1 host: `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`. Köprü: `src/lib/dokumantasyon/cad-upstream/adapter.ts` ve kurulu `@mlightcad/cad-simple-viewer`. Mevcut kodda `snap-engine.ts`, `distance-measurement.ts`, `chain-distance.ts`, `area-measurement.ts`; ayrıca `cad-review/store.ts`, `markup-controller.ts`, `freehand-controller.ts`, `pointer-router.ts`, `hit-test.ts` ve SVG overlay'ler var.

Distance/area için host'ta yerel state listeleri, diğer review öğeleri için `CadReviewStore` yolları bulunuyor. Markup, freehand ve area kontrolcüleri ayrı DOM pointer/keyboard listener'ları ekleyebiliyor. `CadPointerRouter` sınıfının varlığı **bütün etkileşimin tek router'da birleştiğini kanıtlamaz**. Bu yalnız mimari bir araştırma hipotezidir; gerçek dosya/browser testi olmadan kök neden veya başarısızlık kararı verme. Kullanıcının “düz mesafe biraz düzeldi, diğer araçlar tatmin edici değil” değerlendirmesi test önceliğidir.

**İlk teknik iş:** Var olan her butonu gerçek UI event → controller → adapter/snap → world↔screen → overlay → store/history → save/export zinciriyle envanterle. Çakışan listener, tıklama yakalama, pan kilidi, CSS pointer-events, async yarış ve state uyumsuzluklarını tek tek doğrula.

## 4. Ortak profesyonel etkileşim standardı

- **Aktif araç sahipliği:** Aynı anda tek mantıksal araç ve net event-owner. Canvas/overlay/panel aynı pointer event'i iki kez işlememeli. Mouse down/move/up, drag/click, hover, çift tık, right-click, pan, touch, stylus ve pointer capture/lostcapture deterministik çalışmalı.
- **Tek koordinat otoritesi:** Mevcut adapter'ın fiilî `screenToWorldPoint` / `projectWorldPoint` API'si; ikinci bağımsız kamera matrisi yok. Client CSS px, canvas backing px, DPR ve world koordinatları karıştırılmayacak. Kalıcı geometri world coordinates; ekran pikseli sadece giriş/hit tolerance. Pan/zoom/resize/fullscreen/DPR değişince işaretler kaymaz.
- **Gerçek OSNAP:** Endpoint, midpoint, center, intersection, nearest, perpendicular ve desteklenen quadrant/tangent/insertion modları; görsel marker doğru adayla eşleşir. Hover ve commit aynı yakalanan noktayı kullanır. Tolerans CSS pikselinde sabit hissedilir. Katman görünürlüğü, geometry bounds, arc/bulge, polyline, spline, rotated/nested INSERT, OCS/UCS, paper/model viewport, gizli layer ve invalid koordinatlar kontrol edilir. Sırf hatch doldurmak için üretilmiş üçgen kenarlarını gerçek CAD snap geometrisi sayma.
- **Araç durum makinesi:** idle → armed → preview → commit/cancel. ESC/Enter/Bitir/Backspace/undo, çift tıklamada fazladan vertex olmaması, araç değiştirme, dosya değiştirme, unmount, blur, pointercancel ve geciken async callback için açık kurallar. Yarısı bitmiş draft, kaydedilmiş belge veya undo stack'e girmez.
- **Tek review tutarlılığı:** Committed document, session UI ve transient draft ayrıdır. Tamamlanan anlamlı eylem tek atomik undo entry; yeni eylem redo'yu temizler. Mesafe/alan/zincir ve markup aynı kayıt/yükleme, seçme/silme, export ve eski veri round-trip kurallarına uyar; mevcut veriler migrationsız kaybolmaz.
- **Performans ve lifecycle:** Her pointermove'da tüm drawing'i tarama veya her değişimi global React render'a bağlama; sınırlı spatial index, incremental preview/cache ve kontrollü teardown. Pan/zoom'da fetch/reparse, ikinci genel renderer, global monkeypatch, limitsiz CPU/WASM/heap veya WebGL context sızıntısı yok.
- **Güvenilir yetenek beyanı:** Motor/fallback desteklemiyorsa sessiz hatalı ölçüm üretme; capability/disabled açıklaması veya kanıtlı alternatif sun.

## 5. Önce mevcut tuşlar: kalite kabulü

| Grup | Mutlaka karşılanacak davranış |
|---|---|
| Düz mesafe | Mevcut kazanılmış işleyişe regresyon yok; iki gerçek world point, hassas snap, live rubber-band, doğru birim ve uzunluk |
| Zincir mesafe | Segment + kümülatif uzunluk, canlı preview, son vertex geri alma, bitir/iptal, doğru çift-tık kapanış |
| Alan/çevre | Minimum üç benzersiz nokta, doğru shoelace/ilgili eğri geometrisi hesabı, dejenere/self-intersect/çakışma politikası, kapat/bitir, doğru birim² |
| OSNAP | Ekran işaretiyle aynı gerçek geometri, çoklu aday önceliği, ölçek/tolerans, nested block, layer ve arc testleri |
| Seçim / şekiller / ok / bulut | Vektör geometri, canlı drag, stabil anchor, isabetli hit-test, gerçekten desteklenen taşıma/yeniden boyutlandırma |
| Pin / metin | Kullanılabilir giriş ve iptal, sanitizasyon, metin düzenleme/konum, kalıcılık ve okunurluk |
| Serbest çizim / silgi | Akıcı örnekleme, coalesced pointer desteği uygun yerde, kontrollü simplification, sadece review nesnesinin silinmesi |
| Undo/redo / katman / arama / export | Birden fazla araç arasında tutarlı işlem geçmişi, layer/readonly davranışı, reload/JSON/DXF ve görüntü export round-trip |

**Ölçü birimi güvencesi:** DXF/DWG `INSUNITS`/metadata varlığı ve güvenilirliğini test et. Birimsiz çizimi kesin “metre” diye gösterme; kullanıcıya kalibrasyon/ölçek açıklaması. Kalibrasyon alan ölçeğine kare olarak yansır. Çizimden hesaplanan 2D projeksiyon ile 3D gerçek uzaklık karıştırılmaz; overflow, NaN/Infinity, yüksek/negatif koordinatlar ve çok küçük/büyük mesafelerde sayısal kararlılık kontrol edilir.

## 6. Açık kaynak kullanım kararı: MLightCAD → CADCraft → gerekirse diğerleri

1. Önce mevcut kurulu MLightCAD paketinin **gerçek sürümünde bulunan public API'ler** değerlendirilir. `mlightcad/cad-viewer` güncel main'de bulunan komut/jig/measurement/OSNAP/selection/transaction kodu sitedeki sürümde otomatik var kabul edilmez.
2. `storytold/cadcraft` Rust `crates/engine/src/snap.rs`, `crates/engine/src/cmd/inquiry.rs` ve `crates/geom/src/**` geometri, snapping, command state ve test oracle'ı için örnektir. Rust kaynak TypeScript'e birebir yapıştırılamaz; WASM entegrasyonu ayrı performans/asset/uyumluluk kararıdır. Erken geliştirme özellikleri kalite garantisi değildir.
3. Her özellik için `hazır public API`, `doğrudan lisanslı kopya`, `algoritmadan kontrollü uyarlama`, `yerel uygulama` veya `alma` kararı; exact upstream commit/sürüm, neden, test, etkiler ve rollback ile kaydedilir. Rastgele yeni kütüphane eklenmez.
4. **Lisans:** MIT/Apache repo lisansı tüm alt bağımlılıkların lisansı değildir; LibreDWG/GPL, diğer DWG decoder, font, ikon, asset, marka/trademark ve ticari/kaynak-yayımlama koşulları kontrol edilir. GPL/AGPL veya proprietary kod, uyumluluk kararı olmadan kopyalanmaz/production'a eklenmez. `THIRD_PARTY_NOTICES.md` ve gereken lisans metin/atıfları doğru kaynak ve sürüme göre korunur. Başka uygulamanın markası/logosu veya tasarım varlıkları otomatik kopyalanmaz.

## 7. Değişiklik sınırı, test ve yayın disiplini

- V1 review/overlay/interaction kodu hedeflenir. Korunan `cad-upstream-viewer.tsx` veya `cad-upstream/adapter.ts` içindeki **gerekli dar etkileşim köprüsü** ancak public API alternatifi yoksa, küçük diff, açık gerekçe, eski davranış regresyonu ve rollback ile ele alınır. Bu, parser/renderer/worker/fallback veya dependency upgrade izni **değildir**; onlar için kullanıcının ayrıca açık isteği ve `AI_CHANGE_PROTOCOL.md` gerekir.
- Feature flag, veri/araç geçmişi ve eski JSON bütünlüğü korunur. Bozuk testleri toleransı gevşeterek yeşile çevirmek, başarısız destek yolunu gizlemek, sahte başarılı export, sırf test geçsin diye eksik geometriyi silmek yasaktır.
- **Sayısal test:** World↔screen round-trip, snap aday seçimi, mesafe/zincir/alan/çevre/birim/kalibrasyon, dejenere geometri, yüksek koordinat, expected vs. actual oracle.
- **Gerçek çizim testi:** DWG/DXF, farklı format/birim/boyutlar, LINE/LWPOLYLINE/ARC/CIRCLE/SPLINE/INSERT/nested INSERT, arc/bulge, görünür/gizli layer, model/paper space, font/hatch; uygun CAD referansıyla karşılaştırma.
- **Kullanıcı testi:** Desktop mouse/trackpad, mobil/tablet touch+pinch, stylus; tık, drag, dblclick, esc, enter, backspace, hızlı araç değişimi, dosya aç/kapat/reload, DPR/zoom/pan/resize/fullscreen, pointer kaybı, uzun oturum, WebGL context-loss.
- **Regresyon:** Mevcut rendering/fidelity/fallback/loading/error/worker, feature flag, history, selection, gerçek kullanıcı verisi, review export ve asıl DWG/DXF değişmezliği. İlgili `tests/document-studio/cad-*.spec.ts`, `npm run check:cad-review:release`, `npm run check:cad-preview-v2` seçilerek çalıştırılır; yeni davranışın eski testte kapsanmadığı durumlarda yeni test ve doğrulama gerekir.
- **Kanıtlı rapor:** Her tuş için `PASS / FAIL / NOT_RUN / BLOCKED`, fixture, sayısal sonuç, tarayıcı aksiyonu, değişiklik, performans, fallback, upstream kaynak/lisans ve geri dönüş verilir. Çalıştırılmamış testlere PASS denmez; “tamamlandı” veya “AutoCAD eşdeğeri” iddiası üretilmez.
- **GitHub/deploy:** `AGENTS.md` zorunlu. Remote AI doğrudan `main`e ara commit atmaz; `internal-*` branch ve anlamlı tek checkpoint, `[skip ci]`/`[skip vercel]`. Kullanıcı açıkça istemedikçe Preview/Production **deploy yapılmaz**, gereksiz deploy kuyruğu oluşturulmaz.
- **Yaşayan doküman:** Gerçek V1 davranışı değişince `docs/cad-review-tools.md`, `docs/cad-review-architecture-decisions.md` ve gerekiyorsa `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` aynı çalışma kapsamında güncellenir. `BASELINE_MANIFEST.md` tarihsel golden kaydı silinmez; yeni accepted baseline ancak kullanıcı onayıyla eklenir.

**Bu dosya yalnız zorunlu standarttır.** Sonraki kullanıcı komutuyla plan yapılacak; şu an herhangi bir CAD kodu değiştirme, ürün release'i veya deploy yetkisi vermez.
