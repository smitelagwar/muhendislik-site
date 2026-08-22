# DXF Viewer — Stage 3 TEXT / MTEXT / DIMENSION Fidelity

## Amaç

Stage 3 yeni CAD aracı eklemez. Öncelik DXF içindeki mühendislik bilgisinin, özellikle yazı ve ölçülerin sessizce kaybolmasını önlemektir.

## Doğrulanan upstream davranışları

### TEXT

`dxf-viewer` TEXT için insertion point, ikinci alignment point, text height, rotation, horizontal/vertical justification ve width factor alanlarını renderer'a taşır. Font style özelliklerinin birebir uygulanması ise tamamlanmış değildir; web TTF font zinciri kullanılır.

### MTEXT

Upstream MTEXT parser `\\P`, paragraph alignment ve renk gibi bazı formatları işler. Ancak `\\S...;` stacked fraction kodu long-format olarak atlanır; fraction içeriğinin kendisi görünmez hale gelebilir.

Stage 3 render kopyasında yalnız bu görünürlük kaybı normalize edilir:

- `\\S1^2;` → `1/2`
- `\\S1#2;` → `1/2`
- `\\S1/2;` → `1/2`

Bu işlem stored/original DXF'yi değiştirmez. Dosya indirme linki orijinal dosyayı vermeye devam eder.

### DIMENSION

Upstream engine doğrudan yalnız aşağıdaki dimension türlerini sentezler:

- type 0: linear / rotated
- type 1: aligned

Angular, diameter, radius, angular-3point ve ordinate türleri için DXF içinde önceden oluşturulmuş dimension block varsa engine block'u render edebilir. Hazır block yoksa bu tiplerin eksik çizilmesi mümkündür.

## Stage 3 audit

`src/lib/dokumantasyon/dxf-stage3-fidelity.ts` şu alanları denetler:

- TEXT / MTEXT / ATTRIB / ATTDEF sayısı
- rotation ve alignment kullanımı
- sıfır/negatif text height
- MTEXT stacked fraction sayısı
- STYLE tanımları
- SHX tabanlı STYLE tanımları
- tanımsız text style referansları
- DIMENSION tip dağılımı
- linear / aligned sayıları
- engine'in doğrudan sentezlemediği dimension tipleri
- dimension block referansı ve block'un gerçekten mevcut olup olmadığı
- linear/aligned dimension için zorunlu tanım noktaları
- DIMSTYLE tanımları ve tanımsız DIMSTYLE referansları

## Encoding + normalization zinciri

Stage 2'de kaynak DXF byte'ları `$ACADVER` / `$DWGCODEPAGE` ile doğru encoding kullanılarak Unicode'a çözülür.

Stage 3'te:

1. audit orijinal çözümlenmiş metin üzerinde yapılır,
2. yalnız render kopyasında görünürlük fallback'i uygulanır,
3. render kopyası UTF-8 Blob olarak oluşturulur,
4. `dxf-viewer` bu geçici Blob'u `fileEncoding: "utf-8"` ile parse eder,
5. stored/downloaded kaynak dosya değiştirilmez.

Bu sayede örneğin eski Windows-1254 bir DXF'deki `ÇĞİÖŞÜ çğıöşü` Unicode olarak korunur ve aynı dosyadaki stacked MTEXT fraction da görünür kalır.

## Warning / blocking politikası

### Warning, fakat render devam eder

- SHX text style
- tanımsız text style
- sıfır/negatif text height
- tanımsız DIMSTYLE
- MTEXT stacked fraction fallback uygulanması
- desteklenmeyen dimension tipi var fakat çözülmüş hazır dimension block mevcut

### Blocking — `ready` durumuna geçilmez

- angular/radius/diameter/ordinate sınıfı dimension var ve render edilebilir hazır dimension block yok
- linear/aligned dimension gerekli definition/extension noktalarını içermiyor ve hazır dimension block yok

Bu politika "ölçü görünmedi ama dosya açıldı" durumunu kabul etmez.

## Regression corpus

- `tests/fixtures/dxf/stage3-text-mtext.dxf`
  - Türkçe karakterler
  - TEXT rotation
  - TEXT alignment
  - MTEXT attachment
  - stacked fraction
  - SHX style
  - tanımsız text style
  - sıfır text height

- `tests/fixtures/dxf/stage3-dimensions.dxf`
  - valid linear
  - valid aligned
  - radius + resolved dimension block
  - diameter + no block
  - malformed linear
  - valid/missing DIMSTYLE referansları

Kontrol komutu:

```bash
npx tsx scripts/check-dxf-stage3-fidelity.ts
```

## Bilinçli sınırlar

Stage 3 AutoCAD ile piksel-piksel tipografi eşitliği iddia etmez. Aşağıdakiler sonraki aşamalarda ele alınmalıdır:

- gerçek SHX glyph rendering veya daha kapsamlı SHX→TTF mapping
- tüm MTEXT inline style kombinasyonlarının birebir tipografisi
- dimension tolerance / limits
- bütün DIMSTYLE değişkenlerinin görsel golden test ile doğrulanması
- angular/radius/diameter/ordinate için native synthesis veya kontrollü renderer fork'u
- dimension text extrusion altında rotation/mirroring doğruluğu

Stage 3 kabul ölçütü, P0 mühendislik bilgisinin sessiz kaybını önlemek ve mevcut engine'in kesin sınırlarını açık biçimde gate etmektir.
