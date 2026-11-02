# CAD Review Workspace V1 — Mimari Karar Kaydı (ADR)

> **Tarih:** 30 Ağustos 2026  
> **Konum:** `docs/cad-review-architecture-decisions.md`  
> **İlgili Görev:** CAD Review Workspace V1 (Aşama 1/10)  
> **Referans Belge:** `CAD_VIEWER_GEMINI_3_7_FLASH_NIHAI_UYGULAMA_PLANI.md`

---

## Yaşayan netleştirme — 2 Kasım 2026

Bu 30 Ağustos tarihli mimari karar kaydı güncel bütün V1 tuşlarının PASS olduğunu göstermez. Kullanıcı önce var olan ölçüm, OSNAP, markup ve inceleme tuşlarının iyileştirilmesini, gerçek CAD entity düzenlemesinin sonraya bırakılmasını istemektedir. Ham DWG/DXF review fazında değişmez. Bağlayıcı standart: **`.agents/rules/cad-v1-review-kurallari.md`**.

Kod incelemesinde `cad-upstream-viewer.tsx` yerel distance/area state'leri ile `CadReviewStore` farklı yollardan geçmektedir; markup/freehand/area denetleyicileri kendi pointer listener'larını bağlayabilmektedir. `CadPointerRouter` dosyasının bulunması tek event-owner'ın bugün çalıştığını kanıtlamaz. Aşağıdaki tek router ifadesi hedef mimaridir; **güncel runtime doğrulaması değil**. Bu bir hata hipotezidir, canlı testi yapılmış kesin kök neden değildir.

## 1. Bağlam ve Problem Tanımı

Doküman Studio içindeki CAD önizleyici, DWG ve DXF formatlarını yüksek doğruluk ve fallback güvencesiyle açmaktadır. Yeni hedef, çizimi düzenleyen tam bir CAD editörü inşa etmek değil; kullanıcıların çizim üzerinde arama yapabileceği, zincir ölçümler alabileceği, pin/ok/bulut/metin işaretlemeleri ve serbest el eskizleri ekleyebileceği, çıktısını güvenle alabileceği bir **CAD Review Workspace V1** oluşturmaktır.

Bu karar kaydı, Aşama 1 itibarıyla benimsenen temel mimari sınırları, reuse kararlarını ve anti-pattern yasaklarını kayıt altına alır.

---

## 2. Mimari İlkeler ve Kararlar

### Karar 1: Kaynak Çizim Değişmezliği (Source Immutability)
- Kaynak DWG veya DXF veritabanı review işlemleri sırasında **kesinlikle mutate edilmez**.
- Review verisi (ölçümler, işaretlemeler, yorumlar, eskizler) ayrı bir JSON modelinde tutulur ve dosyanın `fileId` + `versionNumber` + `sha256` parmak izine bağlanır.
- Kaynak çizimin yeni bir sürümü yüklendiğinde eski review verisi sessizce veya otomatik olarak yeni koordinatlara re-anchor edilmez.

### Karar 2: Tek Çizim Dönüşüm Otoritesi (Single Transform Authority)
- World transformları için ikinci bir bağımsız pan/zoom veya dönüşüm matrisi kurulmaz.
- `CadUpstreamAdapter` üzerindeki `screenToWorld` ve `worldToScreen` tek ve bağlayıcı koordinat otoritesidir.
- Bütün kalıcı review geometrileri CAD/world koordinatlarında saklanır; ekran pikseli (screen px) sadece geçici imleç girişi ve hit-test toleransı için kullanılır.

### Karar 3: Granüler Capability Modeli
- CAD motorunun yetenekleri engine adı (`upstream`, `legacy`, `aps`) üzerinden varsayımsal olarak açılıp kapatılamaz.
- Tanımlanan 15 granüler capability (`worldTransform`, `textExtraction`, `entityBounds`, `snap`, `reviewOverlay`, `composedRasterExport`, `reviewDxfExport` vb.) yalnızca test edilmiş kanıtla `true` olur.
- Desteklenmeyen bir motor durumunda sessiz hata yerine kullanıcıya gerekçeli disabled durumu gösterilir.

### Karar 4: Bounded Teardown ve Dayanıklılık (Resilience)
- `CadUpstreamAdapter.destroy()` ve komut iptalleri sınırsız beklemeye yol açamaz (`Promise.race` ile zaman sınırlı / bounded teardown).
- WebGL context loss durumlarında (`webglcontextlost`) ve sıfır boyutlu viewport resize senaryolarında tanı snapshot'ı (`CadRenderReadinessSnapshot`) üzerinden durum raporlanır.

### Karar 5: MLightCAD API Kullanımı ve Spike Sonucu
- MLightCAD 1.6.2 markup store ve komutları incelenmiştir: internal markup HTML transient katmanı kullanmakta olup base database'i doğrudan mutate etmemektedir.
- Ancak reaktif React state senkronizasyonu, dirty tracking, optimistic concurrency (409 conflict) ve test izolasyonu güvencesi için domain review logic'i saf TypeScript `CadReviewStore` çatısında konumlandırılmıştır.
- UI bileşenleri MLightCAD private nesnelerine erişmez; MLightCAD yalnız koordinat dönüşümü ve snap sorgusu otoritesidir.

### Karar 6: Renderer & Overlay Seçimi (SVG + Pointer Event Architecture)
- Yeni üçüncü taraf bir Canvas/WebGL kütüphanesi eklenmemiş; mevcut doğrulanmış SVG + Pointer Event overlay mimarisi seçilmiştir.
- SVG katmanı DPI/zoom değişimlerinde vektörel netlik sağlar, CSS animasyon ve GPU hızlandırmasıyla çalışır.
- **Hedef:** `CadPointerRouter` veya eşdeğer event-owner ile deterministik tek routing. Mevcut kontrolcüler bağımsız event listener bağlayabildiğinden bu madde bugün uygulanmış/kanıtlanmış davranış sayılamaz.

### Karar 7: 3-State Sınıflandırması ve Command Tabanlı History
- **Committed Document State**: Kalıcı, senkronize edilebilir review elemanları listesi.
- **Session UI State**: Aktif araç, seçim kümesi, hover ve görünürlük filtreleri (sunucuya kaydedilmez).
- **Transient Gesture Draft State**: Çizim sürükleme/tıklama esnasındaki anlık taslak (asla undo yığınına veya sunucuya girmez).
- Command tabanlı undo/redo: Her tamamlanan işlem tek atomic command üretir; yeni işlem Redo yığınını temizler; fare hareketi asla history üretmez.


---

## 3. Kabul Edilmeyen Yaklaşımlar (Anti-Patterns)

1. **Sahte DWG Üretimi Yasaktır**: DXF verisini veya metin çıktısını `.dwg` uzantısıyla kaydetmek kesinlikle yasaktır.
2. **Körlemesine Bağımlılık Eklemek Yasaktır**: `latest` etiketiyle yeni paket eklenemez. Paketler exact-pin ve lisans denetimi sonrası dahil edilir.
3. **Draft State ile Committed State Karıştırılamaz**: İmleç hareketi ve serbest el çizimi sırasında her fare hareketinde React küresel state'i güncellenmez. Draft verisi transient render katmanında tutulur, işlem bitince tek transaction ile commit edilir.
4. **Git Scratchpad Yaklaşımı Yasaktır**: Aşama bazlı gereksiz commit/push veya `git add .` yapılamaz.

---

## 4. Benchmark ve Fixture Kriterleri

- **Platformlar**: Desktop Chromium (1920x1080), Mobile Chromium (Pixel 7 Touch).
- **Corpus Bütünlüğü**: `tests/fixtures/cad-preview-v2/manifest.ts` içindeki SHA-256 ve dosya boyutu manifesti her test öncesinde ve sonrasında doğrulanır.
- **Veri İzolasyonu**: `.data/dok_db.json` içindeki 1133 dosya sayısı sabit kalmalıdır (0 sızıntı).

## ASAMA_11 mimari doğrulama eki — 2 Kasım 2026

Bu ek güncel kodun kanıtlanmış sınırlarını eski hedef mimariden ayırır. Nihai durum için `docs/cad-v1-review/FINAL_ACCEPTANCE.md` ve geri dönüş için `docs/cad-v1-review/ROLLBACK.md` esas alınır.

- **Store / source binding:** Review verisi `CadReviewStore` içinde ayrı tutulur; yerel cache `fileId + sourceVersionKey` ile ayrılır. Eski kaynak revizyonu sessizce yeniden eşleştirilmez.
- **Sunucu kaydı:** Sunucu senkronizasyonu gerçek source SHA-256 ve optimistic revision bekler; olmayan SHA veya çatışma durumunda yerel kopya korunur. Eski kayıtlarla gerçek iki-cihaz senkronizasyonu henüz kabul edilmedi.
- **Dışa aktarım:** JSON, native world-unit'li review-only DXF, PNG ve `pdf-lib` ile üretilmiş gerçek PDF'dir; kaynak DWG/DXF yeniden yazılmaz. Bağımsız CAD DXF import/piksel karşılaştırması hâlâ gerekli.
- **Engine ve etkileşim:** MLightCAD V1 adapter, CAD coordinate otoritesidir; renderer/parser/worker replacement yapılmadı. 375px mobil kontroller ve keyboard isolation hedefli testlerde geçse de gerçek pinch-zoom testinde kamera **kaydırıyor, zoom değişmiyor**.
- **Dağıtım:** Çalışma dalı izole, Production ve `main` üzerindeki mevcut sistem değiştirilmedi; bu ek yeni yayın onayı değildir. Eski `100% ready` beyanları yeni kodu otomatik onaylamaz.

## R2 ASAMA_03 pinch-camera doğrulama eki — 2 Kasım 2026

ASAMA_11'de kayıtlı pinch başarısızlığı, R2 Stage03 kapsamında tekrar üretildi ve dar host bridge ile düzeltildi. Kurulu OrbitControls renderer canvas'ında çalışırken review SVG sibling overlay'deki ikinci touch canvas'a ulaşmıyordu. Bridge pointerdown'ı OrbitControls canvas'ına iletiyor ve pointer capture alıyor; overlay'nin asıl olayı seçim/tap için kalıyor. İkinci parmak gelince review draft'ı commit edilmeden iptal edilir.

İki ayrı mobil Chromium emülasyonunda kamera zoom'u 1.5× büyüdü; ölçüm overlay uçları aynı `projectWorldPoint` ile 1 CSS px altında eşleşti. Sabit aralıklı iki-finger pan kamera merkezini değiştirdi, zoom'u sabit tuttu. Hedefli mouse/wheel ve cancel/double-click/stylus-controller sözleşmeleri geçti. Fiziksel cihaz, trackpad ve stylus donanımı denenmedi; Stage03 global TSC ve release kabulini geçirmiş sayılmaz. Kod/test ve test sonuçları `docs/cad-v1-r2-recovery/evidence/stage03.md` içinde tutulur.
