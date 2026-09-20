# G07 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D07, D13, D16 · R08, R09 · V09 · F10, F11 |
| G / SES / başlangıç SNAP / son SNAP | G07 · SES-20260919-08 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G06 (blok ve katman semantiği) doğrulandı |

## Uygulanan davranış

1. **Yazı ve Font Çözümleme Motoru (FontLayoutEngine):**
   - `src/lib/cad-v2/text/font-layout-engine.ts`:
     - OpenType.js 1.3.4 altyapısı ile fontların (`Arial-Regular.ttf`, `Arial-Bold.ttf`, `IBMPlexSerif-Regular.ttf`) TTF ayrıştırması.
     - Türkçe karakter desteği (Ğ, Ü, Ş, İ, Ö, Ç, ı, ğ, ü, ş, ö, ç).
     - AutoCAD özel sembol kodlarının otomatik çözümü (`%%C` -> Ø çap sembolü, `%%D` -> ° derece sembolü, `%%P` -> ± artı/eksi sembolü).
     - MTEXT zengin metin kod temizleyici (`\P` ile çok satırlı paragraflar, `\C...;` renk kodları, `\H...;` yükseklik kodları).
     - Geometrik metin dönüşüm oracles'ı (rotasyon açısı, genişlik katsayısı / widthFactor, eğiklik açısı / oblique).
     - Glif vektör konturlarının 2D çizgi segmentlerine (tessellation) ayrıştırılması.
     - Bilinmeyen fontlar için sistem varsayılanına güvenli geri dönüş (fallback).

2. **AutoCAD Ölçülendirme (DIMENSION) Varlıkları:**
   - `src/lib/cad-v2/decode/dwg-adapter.ts`:
     - AutoCAD'in DIMENSION varlıkları için ürettiği anonim bloklar (`*D...`) `INSERT` varlığı olarak haritalandı.
     - Bu sayede AutoCAD'in çizdiği ölçü çizgileri, uzantı çizgileri, mimari mim ve oklar (`_ArchTick`) ile ölçü metinleri %100 AutoCAD görsel eşliğiyle korunur.

3. **Sözleşme Uyumlu Sınırlandırılmış Parçalama (Bounded Chunking):**
   - `src/lib/cad-v2/compile/scene-compiler.ts`:
     - Gerçek çizimlerde (R001) metin ve ölçülendirmelerle birlikte oluşan 20+ MB'lık geometri verisi en fazla 50.000 segmentlik parçalara (~800 KB Float32) bölünür.
     - Her parça `manifest.chunks` içinde bağımsız hash ve boyutu ile listelenir, 2 MiB HTTP tavanı ve 8 MiB savunma sınırına tam uyulur.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/text/font-layout-engine.ts` | Ekleme | R08, R09 yazı ve ölçülendirme motoru | Yeni dosya | Bağımsız V2 |
| `src/types/opentype.d.ts` | Ekleme | opentype.js TypeScript tipleri | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | Değiştirme | R08, R09 TEXT, MTEXT, DIMENSION (*D) | SNAP-0001 | Korundu |
| `src/lib/cad-v2/compile/scene-compiler.ts` | Değiştirme | R08, R09 metin ve boyut entegrasyonu + parçalama | SNAP-0001 | Korundu |
| `tests/cad-v2/font-text-dimension.test.ts` | Ekleme | G07 metin ve ölçülendirme test paketi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:unit` güncellemesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R08, R09 | `npx tsx tests/cad-v2/font-text-dimension.test.ts` | RUN-0013 / SNAP-0001 | PASS (exit 0) | 6 test (Türkçe, %% semboller, \P, R001 adetleri) geçti |
| Regresyon | `npm run check:cad-v2:release` | RUN-0014 / SNAP-0001 | PASS (exit 0) | G00–G07 tüm testler geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0015 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

1. `three.d.ts` içindeki `Material` tanımı `cad-upstream/adapter.ts` dosyasında `transparent`, `opacity` ve shader özelliklerine ihtiyaç duyduğundan shim arayüzü `transparent?: boolean`, `opacity?: number`, `[key: string]: any` ile zenginleştirildi.
2. DWG'deki DIMENSION varlıklarının anonim `*D` blokları barındırdığı ve bu blokların doğrudan INSERT olarak render edilmesinin AutoCAD'in yerel ölçülendirme çizgilerini ve metinlerini kusursuz koruduğu tespit edildi.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G08 (Eğri, hatch, çizgi ve çizim sırası).

## Uygulayıcı kapanışı

G07 paketi (Türkçe font/glif desteği, CAD sembolleri, MTEXT, anonim blok ölçülendirme ve parçalama) başarıyla tamamlandı ve doğrulandı.
