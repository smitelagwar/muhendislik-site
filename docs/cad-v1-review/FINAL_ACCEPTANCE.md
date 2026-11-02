# CAD V1 R2 — ASAMA_11 Bağımsız Nihai Kabul Raporu

**İncelenen dal:** `internal-cad-v1-pro-review-r2-20261102`  
**İncelenen temel commit:** `96f1a4cacd93c6381cf6b16f916d9878ff99dd13`  
**Ana dal kontrolü:** `main=3df5e45924c6f83e2d5cbbdb81e5d02c3fe07dc4`; çalışma dalı +19 commit, -0 commit (audit başlangıcı).  
**Karar:** **YAYIN KABULÜ ENGELLİ — RELEASE_READY=NO**. Bu rapor deploy veya merge değildir.  
**Denetleyen:** ChatGPT GPT-6; ayrı, temiz Vercel Sandbox + bağımsız Node/Playwright koşumları. Bu insan tarafından bağımsız mimari onay, fiziksel mobil cihaz veya üçüncü taraf CAD sertifikasyonu değildir.

## 1. Kalite kapısı ve bağlayıcı karar

- **PASS:** Temiz checkout, 65/65 saf sözleşme testi (ASAMA_02–10), TypeScript, ESLint, `npm run build`.
- **BLOCKED:** `npm run check:cad-review:release`, test ortamında gerekli `.data/dok_db.json` (minimum 50 gerçek kullanıcı dosyası) bulunmadığından ön kontrolde duruyor. Kullanıcı verilerini taklit edip bu kapıyı geçirmenin hiçbir geçerliliği yok.
- **FAIL:** Gerçek Chromium/CDP iki parmak pinch hareketi zoom değiştirmiyor, yatay pan üretiyor (ASAMA_10).
- **FAIL / ARAŞTIR:** Geniş V2 regresyonunda DWG cache/fallback testleri ve güncel olmayan toolbar seçicisi; test 11 dakika sonunda durduruldu. Fail'leri gizlemedik.
- **BLOCKED:** Büyük gerçek DWG/DXF matrisinin tarayıcı tamamlanma/bağımsız görsel karşılaştırması. Önceki koşuda `net::ERR_ABORTED / Channel closed` var.
- **NOT_RUN:** Fiziksel telefon/tablet, stylus, uzun süreli heap/teardown, bağımsız CAD programında review DXF reimport, eski kaynak SHA'sı eksikken çapraz cihaz sunucu kaydı.
- **ASAMA_11 temiz Chromium E2E:** İlk geniş 5-spec bağımsız koşu uzadı ve durduruldu; eski ASAMA_07 testi ASAMA_08 sonrası kaldırılan `dok_cad_review_v1_${fileId}` anahtarını okuyordu. Test-only beklenti sürüme özel `dok_cad_review_v1_${fileId}__...` anahtarına düzeltildi. Ayrı 3013 portunda düzeltilmiş ASAMA_07 testlerinin yeniden koşumu: **1/2 PASS** (serbest çizim/silgi/Undo/Redo), **1/2 FAIL (100 saniye timeout, Pin/Text/F5)**. Bu sonuç uygulama sorunu mu test ortamı mı henüz ayrıştırılamadı. Tümüyle PASS ilan edilmedi.

`PASS (hedefli)` bir aracın ilgili testte çalıştığını söyler; bütün çözünürlük/fixture/gerçek cihaz kabulü anlamına gelmez. Cihazı yazılmayan ölçüm ve başarılar üretilmemiştir.

## 2. Tek kontrol matrisi

| Gerçek V1 araç/davranışı | Durum | Fixture, test ve sınır |
|---|---|---|
| Seç/gez / kaynak üzerine tıklama | PASS (hedefli) | ASAMA_06/07 seçim, kaynak değişmezliği; tam manuel cihaz kabulü yok |
| Kamera / görünüme sığdır | NOT_RUN | Güncel UI ile bağımsız uçtan uca test eksik; mobil pinch ayrı FAIL |
| Görünüm modu, renk, çizgi kalınlığı | BLOCKED | Eski toolbar testinde seçim elemanı bulunmadı; güncel UI sözleşmesi yeniden karşılaştırılmalı |
| İki nokta mesafe | PASS (hedefli) | 3-4-5 oracle, 5000 mm = 5,00 m; `cad-distance-stage04-contract.test.ts` |
| Zincir mesafe / Geri / Bitir | PASS (hedefli) | 3+4=7 birim, tek commit, ESC; `cad-chain-stage03-contract.test.ts` |
| Alan ve çevre / Geri / Bitir | PASS (hedefli) | 5000×4000 mm = 20 m², 18 m; self-intersect reddi; `cad-area-stage05-contract.test.ts` |
| Ölçümleri temizle | NOT_RUN | Mevcut düğmenin kapsamlı gerçek DXF/undo kabulü ayrıca gerekli |
| Birim ayarı / kalibrasyon | PASS (saf oracle) | 2× uzunluk ve 4× alan; fiziksel UI gözlemi NOT_RUN |
| OSNAP paneli / mod seçimi | PASS (hedefli) | Endpoint, midpoint, intersection, center, nearest, perpendicular; Pixel 7 emülatör ve saf test |
| Katman görünürlük / kilit / dondurma | PASS (hedefli) | ASAMA_09 gerçek fixture panel doğrulaması; tam DWG ve fallback NOT_RUN |
| Metin arama / sonuca odaklanma | PASS (hedefli) | Türkçe metin ve dört TEXT entity; `cad-text-search.spec.ts`; gerçek DWG corpus eksik |
| Yorum paneli / durum değiştirme | NOT_RUN | Pin backend/store var, her durumun yeni tarayıcı kabulü yok |
| Yorum pini | BLOCKED (nihai uçtan uca) | Önceki hedefli testte PASS; ASAMA_11 bağımsız Pin/Text/F5 koşusu 100s timeout, tam kabul yok |
| Metin notu | BLOCKED (nihai uçtan uca) | Önceki hedefli testte PASS; ASAMA_11 birleşik Pin/Text/F5 testi tamamlanmadı |
| Callout / ok | PASS (saf test) | Markup store/draft testleri; fiziksel mobil ve son görsel kontrol NOT_RUN |
| Dikdörtgen | PASS (hedefli) | Ters yönde sürükleme, tek undo; `cad-markup-stage06-contract.test.ts` |
| Daire | PASS (saf oracle) | Preview, hit-test ve committed geometri eşitliği |
| Revizyon bulutu | PASS (saf oracle) | Büyük koordinat, ters yön, bounded curve |
| Serbest çizim | PASS (hedefli) | RDP/tek gesture ve kaynak immutability, ASAMA_07 tarayıcı |
| Silgi | PASS (hedefli) | Yalnız overlay siler, kaynak entity değişmez |
| Undo / Redo | PASS (hedefli) | Transaction/history ve tarayıcı testleri, 300 yoğun notla undo-redo |
| ESC / Enter / Delete ve giriş odağı | PASS (saf + UI) | Klavye input izolasyonu ve cancel state machine; tüm masaüstü tarayıcıları NOT_RUN |
| Mobil 44×44 kontroller | PASS (emülatör) | 375 px Chromium; area/chain cancel, finish ve back testleri |
| Mobil uzun basma / ikinci parmak iptali | PASS (emülatör) | Pixel 7 Chromium, ASAMA_09: 3/3; fiziksel Android/iOS NOT_RUN |
| İki parmak pinch-zoom | FAIL | CDP: dokunma 80→120 px; camera zoom değişmedi, pan oldu; ASAMA_10 teşhis |
| F5 sonrası yerel review kaydı | BLOCKED (genel kabul) | ASAMA_08 ayrı test PASS; ASAMA_11 Pin/Text/F5 birleşik 100s timeout, tam matris geçmedi |
| Sunucu GET/PUT / optimistic 409 | PASS (test ortamı) | `cad-review-core.spec.ts`; test API ve revizyon çakışması |
| Gerçek cihazlar arası senkronizasyon | BLOCKED | Bazı eski kaynaklarda gerçek SHA-256 eksik, güvenli çapraz cihaz kabulü yok |
| Review JSON dışa/içe aktarma | PASS (hedefli) | Unicode ve 300 not round-trip |
| Review-only DXF | PASS (hedefli) | Gerçek DXF indirme, INSUNITS, Review layers; bağımsız AutoCAD reimport NOT_RUN |
| Görsel PNG | PASS (hedefli) | İndirilen dosyanın PNG magic bytes'ı doğrulandı |
| Gerçek PDF | PASS (hedefli) | %PDF- imzası, pdf-lib ile açma ve 1 sayfa |
| Orijinal DWG/DXF indirme | NOT_RUN | Farklı oturum/erişim haklarıyla indirme kabulü yok |
| DWG fast-cache HIT/MISS ve fallback | FAIL / INCELE | ASAMA_10 geniş V2 browser paketinde en az iki routing/fallback beklentisi bozuldu; kök neden net değil |
| Büyük gerçek DWG/DXF render corpus | BLOCKED | 2,14/3,44/16,08 MB DWG ve 55,26 MB DXF: browser Channel closed / ERR_ABORTED; tam render kanıtı yok |
| 10 defa aç/kapat, WebGL context | PASS (sınırlı) | Sandbox 10 döngü 3,2 dk; uzun süreli leak ve fiziksel cihaz NOT_RUN |
| Kaynak CAD byte bütünlüğü | PASS (dosya SHA) | 4 gerçek fixture SHA-256 önce ve sonra aynı; her entity görsel/piksel eşliği NOT_RUN |
| Production / gerçek mobil / tablet | NOT_RUN | ASAMA_11'de deploy yok, fiziksel iOS/Android/stylus yok |
## 3. Kaynak ve görüntüleyici koruma denetimi

- `main` ile diff kontrolünde V2, DWG/DXF parser çekirdeği, dağıtılan renderer/worker/WASM asset'ları ve vendor bağımlılık sürümleri üzerinde Stage01–11 kapsamında değişiklik yok. `cad-upstream/adapter.ts`, snap ve measurement controller'larda review odaklı kod değişiklikleri **vardır**; bunları sıfır core diff gibi gösterme.
- Gerçek fixture SHA-256 (ASAMA_10 ve ASAMA_11 kontrolü):
  - 2.139.550 B DWG: `9a59ff9e5496e2a3c62b378f062e5f0f3cfa707b9bd4b5a0bf6749cd8bf52459`
  - 16.084.252 B DWG: `8ff5680fa4f9d570fed738def92bc6ca8149fde1b5aed9e0a495dd2baaf521e6`
  - 3.440.087 B DWG: `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`
  - 55.259.742 B DXF: `36f87f826fe4dd9a8f03f8c83bafeeddfc84f1e0efada5c0fded8014a2ef7cf1`
- Önceki ASAMA_08 eksik GitHub blob aktarımı `f3bc898` ile restore edildi. ASAMA_09/10 commit'leri SHA-kontrollü aktarıldı. Bu denetimde V1 source değiştirilmedi.
- `NEXT_PUBLIC_CAD_REVIEW_V1=false` ve `NEXT_PUBLIC_CAD_REVIEW_EXPORT_V1=false` flag'leri `src/lib/dokumantasyon/cad-review/feature-flags.ts` içinde tanımlı, **varsayılan true**. Bunlar `NEXT_PUBLIC` olduğundan env değişikliği yeni build/deploy olmaksızın çalışan istemcilerde anlık etki olarak varsayılamaz.

## 4. Çözülmeden yayınlanmayacak minimum işler

1. ASAMA_11 birleşik Pin/Text/F5 uçtan uca timeout nedenini doğrula, sürüme özel yerel cache ile tekrar PASS kanıtı al.
2. Mobil pinch-zoom: kamera zoom artışını ve mesafe çizgisinin projeksiyonunu aynı gerçek gesture ile karşılaştır, pan davranışının kaynak nedenini doğrula; tekrar test et.
3. DWG cache/fallback: orijinal DWG/cached DXF ayrımını ve feature flags/response fixture'ı test et; V1 motoru/APS fallback değiştirmeden beklenen sonucu netleştir.
4. Büyük DWG/DXF: 4 dosya tamamlanmış açılış, model/paper space, hatch, font ve gerçek CAD karşılaştırması; yükleme ve source SHA değişmezliğini sayısal raporla.
5. Güvenilir server review sync: gerçek kaynak sürümü SHA-256 gerektiren kayıtların mümkün olduğu kontrollü ortamda 2 cihaz/oturum, revizyon çakışması, eski kayıt kurtarma.
6. Gerçek mobil iOS ve Android'de uzun basma, iptal, pan/pinch, yakınlaştırma, zoom sonrası overlay, F5 ve export.
7. Gerçek kullanıcı verilerini kopyalamadan yetkili kontrollü DB izolasyonu olan ortamda `check:cad-review:release` kapısını geç. Kullanıcı veritabanını test geçsin diye uydurma.
8. Yukarıdaki engeller kalkınca tam Chromium/mobil/yerleşim matrisi ve bağımsız gözle nihai kabul.

## 5. Dış bağlantı ve izlenebilirlik

- Testler: `tests/document-studio/cad-*-contract.test.ts`, `cad-stage07-browser.spec.ts`, `cad-stage08-browser.spec.ts`, `cad-stage09-browser.spec.ts`, `cad-mobile-stage8.spec.ts`, `cad-text-search.spec.ts`.
- Performans ve gerçek dosya bulguları: `docs/cad-v1-review/IMPLEMENTATION_STATE.md` ASAMA_10.
- Mimari / kullanıcı rehberi: `docs/cad-review-architecture-decisions.md` ve `docs/cad-review-tools.md`.
- Güvenli geri dönüş: `docs/cad-v1-review/ROLLBACK.md`.

**Kapsam dışı:** Kullanıcı isteğiyle ASAMA_11'de lisans değerlendirmesi yapılmadı; mevcut notices/dependency belgelerine dokunulmadı. Bu doküman lisans uygunluğu onayı değildir.

**Teslim sonucu:** Final teknik audit belgelendi, **kabul ENGELLİ**, Production deploy = **0**, `main` merge = **0**. Açık fail'leri gizlemek için test silinmedi veya tolerans gevşetilmedi.
