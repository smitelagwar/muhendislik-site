# DXF Viewer — Stage 1–2 Fidelity Hardening

## Amaç

Bu çalışma `/dokumantasyon` DXF hattında "dosya yüklendi" ile "mühendislik bilgisi doğru görüntülendi" durumlarını ayırır. Stage 1 görünürlük ve temel text düzeltmesini, Stage 2 ise byte-level encoding ile BLOCK/INSERT/OCS güvenlik katmanını kapsar. Yeni CAD özellikleri ve UI genişletmeleri bilinçli olarak kapsam dışındadır.

## Stage 1 — doğrulanmış düzeltmeler

### Font hattı

`dxf-viewer` metin render etmek için `Load({ fonts: [...] })` bekler. Önceki entegrasyon font göndermiyordu. Repo içindeki fontlar doğrudan DXF yüklemesine bağlandı:

- `/fonts/Arial-Regular.ttf`
- `/fonts/Arial-Bold.ttf`

### Fidelity audit

`src/lib/dokumantasyon/dxf-fidelity-audit.ts` ham DXF group-code çiftlerinden entity census üretir. TEXT/MTEXT/ATTRIB/ATTDEF, DIMENSION, INSERT, paper-space, block içi entity ve unsupported tipler görünür hale getirilir. `VERTEX`, `SEQEND`, `BLOCK`, `ENDBLK` gibi yapısal kayıtlar yanlışlıkla unsupported entity sayılmaz.

### Ready gate

`viewer.Load()` sonucunun tek başına başarı olmadığı kabul edilir. Entity bulunan dosyada sonlu/geçerli bounds oluşmazsa viewer `ready` durumuna geçmez. Renderer `message` event warning/error kayıtları da kullanıcıya yansıtılır.

## Stage 2 — byte-level encoding

Önceki akış `response.text()` kullanıyordu. Bu yaklaşım eski ANSI DXF'lerde byte'ları UTF-8 varsayımıyla erken çözdüğü için Türkçe karakterleri geri döndürülemez biçimde bozabiliyordu.

Yeni akış:

1. DXF `response.arrayBuffer()` ile ham byte olarak alınır.
2. İlk header bölgesi ASCII-safe biçimde taranır.
3. `$ACADVER` ve `$DWGCODEPAGE` okunur.
4. AutoCAD 2007 / `AC1021` ve üstünde UTF-8 seçilir.
5. Eski sürümlerde `ANSI_1250`–`ANSI_1258`, `ANSI_874`, `ANSI_932`, `ANSI_936`, `ANSI_949`, `ANSI_950` gibi codepage değerleri WHATWG `TextDecoder` etiketlerine eşlenir.
6. `ANSI_1254` doğrudan `windows-1254` olarak çözülür; `ÇĞİÖŞÜ çğıöşü` kaybı engellenir.
7. Aynı encoding hem fidelity audit hem `dxf-viewer` constructor `fileEncoding` seçeneğinde kullanılır.
8. Renderer'a tekrar encode edilmiş string değil, orijinal `ArrayBuffer` Blob'u verilir.

Binary DXF signature algılanırsa dosya sessizce yanlış parse edilmez; ASCII DXF gerektiğini söyleyen `unsupported` hatası üretilir.

İlgili modül: `src/lib/dokumantasyon/dxf-encoding.ts`.

## Stage 2 — BLOCK / INSERT / koordinat sistemi audit'i

Audit artık ayrıca şunları çıkarır:

- block definition sayısı
- nested INSERT sayısı
- rotation/scale içeren transformed INSERT sayısı
- mirrored INSERT
- non-uniform scale
- row/column array / MINSERT
- zero-scale INSERT
- tanımsız block referansları
- non-default extrusion / OCS kullanan entity sayısı
- non-default OCS kullanan INSERT sayısı
- indirect recursive block zincirleri

Bu bilgiler özellikle gerçek mühendislik dosyalarında nested block ve annotation kaybını kaynak dosya seviyesinde ayırmak için kullanılır.

## Bilinen upstream BLOCK sınırlamaları ve Stage 2 gate

Mevcut `dxf-viewer` kaynak kodunda:

- grid/block array instancing henüz desteklenmiyor,
- INSERT extrusion direction uygulanmıyor,
- indirect recursive block handling tamamlanmış değil.

Bu nedenle aşağıdaki durumlarda viewer eksik çizimi "başarılı" göstermeyi reddeder:

1. indirect recursive BLOCK/INSERT cycle,
2. grid/array INSERT,
3. non-default extrusion/OCS kullanan INSERT.

Bu dosyalarda `unsupported` hatası gösterilir ve indirme yolu korunur. Amaç kullanıcıya eksik mühendislik çizimini doğruymuş gibi sunmamaktır.

Missing block reference, nested INSERT, mirror/non-uniform transform ve genel non-default OCS durumları ayrıca diagnostic warning olarak raporlanır.

## Regression corpus

Stage 1 fixture'ları:

- `geometry-basic.dxf`
- `text-turkish.dxf`
- `dimension-linear.dxf`
- `blocks-attrib.dxf`
- `unsupported-annotations.dxf`

Stage 2 fixture/test kapsamı:

- `stage2-block-transforms.dxf`
- `stage2-ocs-insert.dxf`
- Windows-1254 byte fixture üretimi
- `AC1021` UTF-8 version precedence
- Binary DXF signature
- nested/transformed/mirrored/non-uniform/array INSERT census
- missing block reference
- entity ve INSERT OCS detection
- indirect block cycle detection
- viewer'ın `response.text()` kullanmadığının statik kontrolü
- `fileEncoding` ve raw Blob entegrasyonu

Kontrol komutları:

```bash
node scripts/check-dxf-stage1-fidelity.mjs
npx tsx scripts/check-dxf-stage2-hardening.ts
```

## Stage 2 karar kapısı

Şimdilik `dxf-viewer` korunuyor; çünkü temel geometry, block transform ve text hattının önemli kısmı kullanılabilir ve encoding sorunu uygulama adapter'ında düzeltilebiliyor. Ancak engine'in bilinen MINSERT/INSERT-OCS/ileri annotation sınırlamaları compatibility gate ile açıkça sınırlandı.

Gerçek proje corpus'unda P0 mühendislik bilgisi bu sınırlamalara sık sık çarpıyorsa sonraki adım kontrollü fork/patch veya alternatif renderer değerlendirmesidir. Kütüphane sırf "daha yeni olabilir" varsayımıyla değiştirilmemelidir.

## Stage 2 kabul kapısı

Stage 2 şu koşullarla kabul edilir:

- DXF byte'ları `response.text()` ile erken bozulmuyor.
- `$ACADVER` / `$DWGCODEPAGE` üzerinden deterministic encoding seçiliyor.
- `ANSI_1254` Türkçe karakterleri doğru decode ediliyor.
- Seçilen encoding `dxf-viewer.fileEncoding` ile renderer'a aktarılıyor.
- BLOCK/INSERT transform riskleri ve missing references sayılıyor.
- indirect recursive block cycle saptanıyor.
- upstream tarafından kesin eksik render edileceği bilinen INSERT topolojileri `ready` kabul edilmiyor.
- Stage 1 font/fidelity davranışı korunuyor.
- Auth, Blob/storage, share, PDF ve image viewer akışlarına dokunulmuyor.
- Vercel Preview Next/TypeScript build kapısı geçiliyor.

## Sonraki aşamaya kalanlar

- TEXT/MTEXT biçim ve alignment fidelity
- SHX substitution/mapping
- DIMSTYLE ve dimension varyantları
- LEADER/MLEADER
- daha geniş OCS entity coverage
- paper-space/layout/viewports
- visual golden tests ve gerçek mühendislik DXF corpus karşılaştırması
