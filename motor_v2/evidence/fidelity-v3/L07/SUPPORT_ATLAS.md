# L07 — Decode ve eksiksizlik destek atlası

Tarih: 17 Ekim 2026 UTC  
Plan: `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md`  
Candidate: `codex/srdr-dwg-motor-v2-fidelity` / `4b51ebe6b1470c6a247e03158dfe4b5359621c97`  
Compiler: `cad-v2-compiler-2026.09-v71`; pipeline `fidelity-v3-p08`; render ABI `three172-cad2d-v2`  
Durum: **LOCAL_PARTIAL — bağımsız AutoCAD parity NOT_RUN; L06 önkoşulu açık.**

Bu atlas adapter'ın canonical sahne girdisine ne taşıdığını ve hangi kayıpları diagnostic ile işaretlediğini kaydeder. “Canonical'a dönüştü” ifadesi render parity veya AutoCAD eşitliği anlamına gelmez. R001–R004 envanterleri aynı candidate decoder ailesiyle alınmıştır; bağımsız kaynak gerçeği değildir.

## Dönüşüm ve açık sınırlamalar

| Kaynak öğesi | Candidate davranışı | Kabul kanıtı ve sınır |
|---|---|---|
| LINE, CIRCLE, ARC, ELLIPSE, LWPOLYLINE | DWG ve DXF adapter'larında canonical geometri | `affine-ocs`, `decoder-field-contract`, `geometry-curves-hatch`; native çizim parity'si ayrıca NOT_RUN. |
| SPLINE | Kaynak kontrol noktası/knot/weight alanları canonical'a taşınır; periodic/rational profilleri testlidir | `dxf-periodic-spline.test.ts` bağımsız De Boor ölçümleriyle geçer. Bu, tüm spline türleri veya AutoCAD raster parity'si değildir. |
| HATCH, WIPEOUT | Canonical sınır/pattern verisi ve derleyiciye giriş | `decoder-field-contract`, `layout-viewport`, `hatch-topology`; invalid/empty boundary diagnostic üretir. Tüm pattern ve native görünüş profilleri kabul edilmiş değildir. |
| TEXT, MTEXT | Literal Türkçe ve DXF `\\U+` metinleri decode katmanından korunur; font aşaması kaçışları yorumlar | `l07-dxf-structure.test.ts`, `font-style-layout.test.ts`; SHX/TTF/platform kaynağı ve AutoCAD glyph parity'si bu L07 kanıtı değildir. |
| INSERT ve iç içe blok | Handle/yerleşim/ölçek/rotasyon/visibility, katman 0 ve reachable block semantiği için mevcut testler | `block-layer-semantics`, `visibility-units`, `affine-ocs`, `layout-viewport`; her dinamik blok durumu için oracle yok. |
| DIMENSION, ATTDEF, ATTRIB, LEADER | Canonical profil veya seçilmiş geometri sentezi; belirsiz source geometry, annotative ve MLEADER gibi desteklenmeyen alt profiller warning alır | `dimension-attribute.test.ts`; test sonunda R001 için LibreDWG error 68 görülür ve temiz DWG/native görsel kabulü açık kalır. |
| MINSERT array | DXF group 70/71 ile gelen column/row count ve group 44/45 spacing canonical INSERT üzerinde korunur. DWG adapter da aynı alanları taşır. Array hücreleri henüz derleyicide açılmadığından görünür/reachable array için `UNSUPPORTED_MINSERT_ARRAY` warning'i verilir; tek INSERT'in çizilmesi array'in doğru çizildiği anlamına gelmez. | `l07-dxf-minsert.test.ts`; `unsupported-entity-diagnostics.test.ts` visible root/reachable child, hidden ve unused block durumlarını ayırır. Gerçek DWG MINSERT dosyası ve AutoCAD ROI karşılaştırması yoktur. |
| POINT, SOLID, 3DFACE, TRACE, OLE2FRAME, XLINE, POLYLINE3D ve decoder'ın çeviremediği tipler | Canonical entity üretilmez; görünür model/paper varlığı handle'ı ve kaynak tipiyle `UNSUPPORTED_ENTITY_TYPE` warning alır. DXF top-level kimlik için `handle` veya `objectId` kullanılır; nested block çocukları sadece görünür ve root'tan erişilebilir ise diagnostic olur. | `unsupported-entity-diagnostics.test.ts` sentetik top-level POINT/SOLID/3DFACE/TRACE/OLE2FRAME/XLINE handle'larını; `l07-dxf-nested-unsupported.test.ts` reachable block kapsamını; raw census corpus'ta gözlenenleri sınar. Unused block içeriği görünür çizim sayılmaz ve tek başına scene'i degraded yapmaz. |
| MLEADER / MULTILEADER | Mevcut attribute-pair tarayıcısı unsupported tanı üretir; canonical geometri/leader eşliği iddia edilmez | `dimension-attribute.test.ts` Gate 6A. |
| XLINE, RAY, OLE2FRAME, IMAGE/PDF/DGN underlay, proxy/custom | Adapter tanıyabiliyorsa unsupported tip olarak atılır ve warning/degraded üretir. Decoded olmayan özel metadata veya proxy graphics için destek garantisi yoktur. | Corpus'ta gözlenen tiplerin envanteri raw census JSON'larında; dynamic/annotative object davranışı veya external underlay kaynakları tam oracle ile sınanmadı. |

## Girdi yapısı, kimlik ve envanter

- `dxf-adapter.ts` ASCII DXF için numeric group-code/value çiftlerini, dengeli SECTION/ENDSEC kayıtlarını ve son EOF kaydını denetler. Binary DXF için resmi sentinel, en az bir binary SECTION kaydı ve son binary EOF kaydını ister. Bu container kontrolüdür; bütün entity alanlarının semantik doğrulaması değildir.
- `$DWGCODEPAGE` açıkça `ANSI_1254` ise ASCII baytları Windows-1254'ten UTF-8'e çevrilir; canonical `codepage` alanı kaynak değerini korur. Tanınmayan bir non-ASCII codepage sessiz geçilmez, `UNSUPPORTED_DXF_CODEPAGE` warning'i kaliteyi degraded yapar. Header'sız UTF-8 fixture'ları olduğu gibi bırakılır.
- `l07-dxf-structure.test.ts` 6 bozuk/kesilmiş ASCII ve binary örneğinin sessiz boş sahneye dönüşmediğini; UTF-8 literal Türkçe, DXF `\\U+` kaçışı ve ANSI_1254 byte girdisinin korunmasını; bilinmeyen codepage'in diagnostic üretmesini doğrular. `layout-viewport.test.ts` gerçek AutoCAD üretimi binary DXF sentinel'li XCLIP fixture'larını okur. Kapsamlı malformed binary pair akışı ayrıca sınanmamıştır.
- `tests/cad-v2/fixtures-manifest.json`: R001–R003 DWG byte magic `AC1032`; R004 ASCII DXF `$ACADVER` sürümü `AC1021`. Census bu değeri, dosya uzunluğu ve SHA-256'yı manifest ile karşılaştırır. LibreDWG `header.version` R001–R003 için ham JSON'da null dönebildiğinden byte magic'i decoder'ın başarı kanıtı sayılmaz.
- `l07-raw-census.ts` filtreden önce kaynak tip/handle/owner block/layout/visibility kayıtlarını toplar; canonical lokasyon, diagnostic kodları ve olası block graph erişimini satır bazında ilişkilendirir. Canonical varlık diagnostic aldıysa sınıfı `converted_with_diagnostic` olur. Sınıflandırma aynı-decoder bookkeeping'tir; geometrik draw/clip kanıtı değildir.
- Yerel corpus census kabul eşiği: unexplained row=0, owner mismatch=0, duplicate raw handle=0, canonical-only handle=0 ve kırpılmamış graph traversal. Bunlar AutoCAD ile aynı içerik veya eksiksiz görüntü iddiası değildir.

## Kanıt ve doğrulama

Post-fix corpus run: `20261017T220448Z-l07-final`. Özetler `raw-census-20261017T220448Z-l07-final-r001.json` … `r004.json`; gzip satır envanterleri `.test-data/cad-v2-l07-raw-census/20261017T220448Z-l07-final/` altında. Her JSON kendi source SHA, raw toplam, row classification, warning, adapter/candidate dirty digest ve native-oracle sınırını taşır. Bu final-source koşusunda toplam **726,418** source row vardı. R001=39,273, R002=72,067, R003=384,189, R004=230,889. Dört dosyada da unexplained=0, owner mismatch=0, duplicate raw handle=0, canonical-only=0 ve graph walk truncated=false. R001–R003 magic `AC1032`, R004 `$ACADVER=AC1021`; R004 raw ve canonical DXF yolları `ANSI_1254` kullanarak aynı Türkçe block identity'sini korur. Tüm dört summary aynı candidate dirty source digest'ini `c3a7baab245aaf6143862832d23b98938ce974fc5985f3044a1aa55997f4ec42` olarak kaydeder.

Bu run'ın R004 tablosu: 229,969 `converted`, 9 `converted_with_diagnostic` (unresolved source geometry DIMENSION), 855 `unreferenced_block_content`, 56 `unsupported_diagnostic` (51 POINT, 4 SOLID, 1 OLE2FRAME). R003: 383,571 `converted`, 495 unreferenced block content, 123 unsupported diagnostic. R001: 26,588 converted, 3,527 converted source-invisible, 446 invisible without canonical entity, 8,712 unreferenced block content. R002: 72,067 converted. R001 LibreDWG error 68 and R003 error 64 remain in run output and prohibit clean-decoder claims.

İlk 22:00 census denemesi (`20261017T220000Z-l07-verified-r004.json`) R004'te 667 `canonicalOnlyHandle` buldu. Raw DXF reader CP1254'ü normalleştirmeden okuduğu için block owner adlarını `VAZÄ°YET` şeklinde çözüyor, adapter ise `VAZİYET` kullanıyordu. Bu deneme **kabul edilmedi**. Encoding normalizasyonu raw inventory ile paylaşıldı, `canonicalOnlyHandleCount` sıfırdan büyükse census PASS kapısı da kapatıldı. Nihai kabul edilen run `20261017T220448Z-l07-final`'dir.

Çalıştırılan L07 odaklı doğrulamalar:

- `npx tsx tests/cad-v2/l07-raw-census.test.ts` — 22 assertion; canonical-only satır PASS'i engelliyor.
- `npx tsx tests/cad-v2/l07-dxf-structure.test.ts` — 6 invalid/truncated case, UTF-8/Unicode escape, Windows-1254 Turkish bytes ve unsupported codepage warning.
- `npx tsx tests/cad-v2/l07-dxf-minsert.test.ts` — DXF MINSERT alanları ve açık unsupported array diagnostic'i.
- `npx tsx tests/cad-v2/l07-dxf-nested-unsupported.test.ts` — reachable nested SOLID handle `S101` diagnostic; unused control degrade olmaz.
- `npx tsx tests/cad-v2/unsupported-entity-diagnostics.test.ts` — DXF top-level raw handle koruması, reachable/hide/unused unsupported ve MINSERT kapsamı.
- İlgili mevcut testler: `decoder-field-contract`, `visibility-units`, `block-layer-semantics`, `affine-ocs`, `layout-viewport`, `font-style-layout`, `dxf-periodic-spline`, `dimension-attribute`.
- `npx tsc --noEmit --incremental false -p tsconfig.next.json` — final adapter/census source seti için PASS.

## Kapanmayan maddeler

1. L06 açık olduğundan bağımsız AutoCAD LT 2027 model/layout tam görünüşü, ≥10 ROI/dosya, ölçü/font/resource oracle'ları ve DWG↔AutoCAD-export DXF karşılaştırması **NOT_RUN**. Kurulu `acadlt.exe` önceki güvenlik kontrolünde Authenticode `HashMismatch` verdiği için çalıştırılmadı.
2. Ekran görüntülerindeki prepare `200` → chunk `404` ve `chunk_model_004` kaybı mevcut kanıttır; FAIL-404 DXF'nin tam bayt/SHA'sı, replay edilebilir gizli bilgileri çıkarılmış HAR ve deployment/source digest yoktur.
3. R001/R003 decode testleri LibreDWG error 68/64 uyarısı yazdırır. Yerel census içinde handle eşleşmesi sıfır kayıplı olsa da bu warning temiz DWG decode sayılmaz.
4. Dynamic block parameter/visibility-state, annotative object'lerin genel davranışı, proxy/custom graphics, companion underlay kaynakları ve MINSERT array render'i için destek/parity iddiası yoktur. Gerekli kaynak örnekleri ve native oracle olmadan bu maddeler OPEN kalır.

Bu nedenle L07'nin yerel muhasebe ve fail-closed işleri ilerlemiştir; **L07 ACCEPTANCE OPEN** kalır. L06 dış girdileri sağlanınca bağımsız referans kabulü tamamlanmalı, sonra bu atlas ve L07 corpus census'i native ROI sonucuyla yeniden değerlendirilmelidir.
