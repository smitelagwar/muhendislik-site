# DXF Text Fidelity — Aşama 1: Kaynak → Parser → Font Teşhisi

Bu aşamanın amacı yazıyı tahmine dayalı olarak düzeltmek değil; gerçek mühendislik DXF'sindeki text/annotation kaybının hangi katmanda başladığını kanıtlamaktır.

## Problem sınıfı

Bir DXF'nin çizgi geometrisinin hızlı görünmesi, dosyanın doğru render edildiği anlamına gelmez. Özellikle betonarme/mimari paftalarda aşağıdaki içerikler mühendislik bilgisidir:

- `TEXT`
- `MTEXT`
- `ATTRIB`
- `ATTDEF`
- DIMENSION text
- BLOCK içindeki annotation

Kaynakta bulunan görünür yazının sessizce kaybolması release başarısı değildir.

## Yeni kaynak audit'i

`src/lib/dokumantasyon/dxf-text-render-audit.ts` ham DXF üzerinde aşağıdakileri ayırır:

- toplam text record sayısı,
- top-level ve BLOCK içi text sayısı,
- görünür model-space text,
- gerçekten erişilen BLOCK zincirindeki text,
- hidden / paper-space / off-frozen layer text,
- erişilmeyen BLOCK içindeki text,
- TEXT / MTEXT / ATTRIB / ATTDEF dağılımı,
- text layer ve style adları,
- attribute tag adları,
- boş text,
- eksik veya sıfır/negatif text height,
- minimum / maksimum pozitif text height.

Bu sayede “dosyada 500 text var” ile “model viewer'ın göstermesi gereken 420 text var” birbirinden ayrılır.

## Kaynak → dxf-viewer parser karşılaştırması

Text render adayı varsa viewer geçici olarak `retainParsedDxf` kullanır. `viewer.Load()` sonrasında upstream parser çıktısı tekrar sayılır ve ham kaynak sayısıyla karşılaştırılır.

- kaynakta olup parser'da kaybolan text => `blocking`
- eşleşme tamamlandıktan sonra retained parsed DXF hemen bırakılır; büyük dosyada ikinci tam DXF temsili oturum boyunca bellekte tutulmaz.

Bu kontrol normalized render kopyası üzerinde çalışır; indirme/kaynak dosya değiştirilmez.

## Font veri düzlemi

Text render adayı varsa kullanılan fallback font URL'leri render öncesinde ayrıca kontrol edilir:

- HTTP başarısı,
- dosya boyutu,
- content-type,
- fetch hatası.

Mevcut fallback seti:

- `/fonts/Arial-Regular.ttf`
- `/fonts/Arial-Bold.ttf`

İki font da erişilemiyorsa text geometri üretilemeyebileceği için text fidelity gate blocking olur. Bir font eksikse warning üretilir.

Upstream worker fontları `opentype.js` ile parse eder. Viewer'ın `hasMissingChars` sinyali de final evidence içine alınır.

## ATTDEF bulgusu

Upstream `DxfScene` font taramasında `ATTDEF` kayıtlarını text entity kabul eder; ancak `_ProcessDxfEntity` render dispatch listesinde `ATTDEF` için doğrudan bir branch yoktur. Bu nedenle görünür/reachable ATTDEF kayıtları Aşama 1'de özellikle raporlanır.

Bu tek başına her ATTDEF'in ekranda görünmesi gerektiğini kanıtlamaz: normal INSERT akışında gerçek değer `ATTRIB` üzerinden gelebilir. Ancak constant/default attribute gibi senaryolarda ATTDEF kaybı gerçek yazı kaybına dönüşebilir. Aşama 2 bu ilişkiyi tag/INSERT bazında çözmelidir.

## Viewer kanıtı

Viewer aşağıdaki test hedeflerini üretir:

- `cad-dxf-text-evidence`: kullanıcıya kısa kaynak/parser/font özeti,
- `cad-dxf-text-render-evidence`: E2E için tam JSON evidence.

Örnek kısa çıktı:

`Metin denetimi: kaynak 312 · parser 312 · font 2/2`

Bir sorun bulunursa ilk neden aynı satırda gösterilir.

## Fail-closed kuralları — Aşama 1

Aşağıdaki durumlar artık `ready` kabul edilmez:

1. Kaynak text sayısı upstream parser'da azalır.
2. Görünür text adayı varken fallback font setinin tamamı erişilemez.

Aşağıdakiler Aşama 1'de warning/diagnostic olarak kalır ve Aşama 2'de çözülür:

- renderer missing-glyph sinyali,
- görünür/reachable ATTDEF,
- sıfır/negatif text height,
- boş text kayıtları,
- SHX/style fidelity farkı.

## Regression gate

`npx tsx scripts/check-dxf-text-render-audit.ts`

Bu script:

- `stage3-text-mtext.dxf`,
- `blocks-attrib.dxf`,
- parser mock kanıtı,
- parser-loss senaryosu,
- font-failure senaryosu,
- viewer entegrasyon sözleşmesini

otomatik doğrular.

Ayrıca mevcut Chromium DXF release testi `stage3-text-mtext.dxf` dosyasını gerçek login/upload/viewer zincirinden geçirdiği için yeni text evidence hattı browser seviyesinde de çalışmak zorundadır.

## Aşama 1 kabul kriteri

Aşama 1 tamamlandı sayılabilmesi için:

- targeted lint yeşil,
- full TypeScript yeşil,
- text audit script yeşil,
- mevcut Stage 1–6 regression zinciri bozulmamış,
- Chromium DXF E2E yeşil,
- Vercel Preview build READY,
- gerçek problemli DXF sağlandığında `cad-dxf-text-render-evidence` üzerinden kaynak/parser/font sayıları okunabilir olmalıdır.

Gerçek 4.2 MB problemli dosya henüz repo veya private corpus'a sağlanmadığı için bu aşama onun spesifik root-cause'unu uydurmaz. Altyapı, dosya sağlandığı anda root-cause'u ölçmek üzere hazırlanmıştır.
