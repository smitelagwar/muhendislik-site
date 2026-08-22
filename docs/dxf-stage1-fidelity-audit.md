# DXF Viewer — Stage 1 Fidelity Audit

## Amaç

Bu aşamanın hedefi yeni CAD özellikleri eklemek değil, mevcut `/dokumantasyon` DXF hattında "dosya yüklendi" ile "mühendislik bilgisi doğru görüntülendi" durumlarını birbirinden ayırmak ve kaybolan entity'leri teşhis edilebilir hale getirmektir.

## Doğrulanmış kök nedenler

### 1. Fontlar `dxf-viewer` yüklemesine verilmemişti

`dxf-viewer` metin render etmek için `Load({ fonts: [...] })` bekliyor. Önceki entegrasyon `fonts` göndermediği için TEXT, MTEXT ve DIMENSION içindeki yazıların kaybolması mümkündü. Repo içinde zaten mevcut olan aşağıdaki fontlar DXF yüklemesine bağlandı:

- `/fonts/Arial-Regular.ttf`
- `/fonts/Arial-Bold.ttf`

Bu düzeltme harici CDN veya yeni font bağımlılığı eklemez.

### 2. `Load()` başarılı sonucu fidelity kanıtı değildi

Önceki akış `await viewer.Load()` tamamlandığında doğrudan `ready` durumuna geçiyordu. Yeni Stage 1 gate, DXF içinde entity bulunmasına rağmen geçerli/sonlu çizim sınırları üretilemiyorsa yüklemeyi başarılı saymıyor.

### 3. Desteklenmeyen entity tipleri sessiz kaybolabiliyordu

Ham DXF üzerinde entity census eklenmiştir. Mevcut `dxf-viewer` entegrasyonunda doğrudan işlenen ana tipler:

- LINE
- POLYLINE / LWPOLYLINE
- ARC / CIRCLE / ELLIPSE
- POINT / SPLINE
- INSERT
- TEXT / MTEXT
- 3DFACE / SOLID
- DIMENSION
- ATTRIB
- HATCH

Bunların dışındaki entity tipleri Stage 1 tanılamasında görünür uyarıya dönüşür. Özellikle LEADER ve MLEADER regression fixture ile bilinçli olarak izlenmektedir.

## Eklenen tanılama

`src/lib/dokumantasyon/dxf-fidelity-audit.ts` ham DXF group-code çiftlerini tarar ve aşağıdaki bilgileri çıkarır:

- `$ACADVER`
- `$DWGCODEPAGE`
- model/top-level entity sayısı
- block içi entity sayısı
- paper-space entity sayısı
- TEXT/MTEXT/ATTRIB/ATTDEF sayısı
- DIMENSION sayısı
- INSERT sayısı
- desteklenmeyen entity sayısı ve tipleri
- entity-type census

`VERTEX`, `SEQEND`, `BLOCK`, `ENDBLK` gibi yapısal DXF kayıtları yanlış biçimde unsupported entity olarak raporlanmaz.

## Viewer görünürlüğü

DXF başarıyla açıldığında üst barda minimum fidelity özeti gösterilir:

- entity sayısı
- yazı entity sayısı
- ölçü entity sayısı
- warning sayısı

Renderer'ın kendi `message` event uyarıları da yakalanır. Eksik font/glif, boş doküman veya unsupported entity gibi durumlarda kullanıcıya "DXF açıldı, her şey doğrudur" izlenimi verilmez.

## Regression corpus

Stage 1 için şu küçük ve deterministik fixture'lar eklendi:

- `geometry-basic.dxf`
- `text-turkish.dxf`
- `dimension-linear.dxf`
- `blocks-attrib.dxf`
- `unsupported-annotations.dxf`

`scripts/check-dxf-stage1-fidelity.mjs` fixture census beklentilerini ve viewer entegrasyonundaki kritik Stage 1 hook'larını kontrol eder.

## Bilinçli olarak çözülmeyen konular

Bunlar Stage 1 tamamlanma iddiasına dahil değildir ve sonraki aşamalarda ele alınmalıdır:

1. Eski DXF'lerde gerçek byte-level ANSI / `$DWGCODEPAGE` decoding. Mevcut istemci hattı `response.text()` ve viewer varsayılan UTF-8 davranışına dayanır.
2. Parsed entity ile render batch arasında birebir derin telemetry.
3. MTEXT ileri biçimlendirme uyumluluğu.
4. DIMSTYLE ve tüm DIMENSION varyantlarının AutoCAD seviyesinde doğrulanması.
5. LEADER / MLEADER gibi upstream tarafından doğrudan desteklenmeyen annotation tiplerinin render edilmesi.
6. SHX font substitution / mapping politikası.
7. OCS, paper-space/layout/viewports ve daha az yaygın entity tiplerinin tam fidelity kapsamı.

## Stage 1 kabul kapısı

Stage 1 şu koşullarla kabul edilir:

- DXF text render hattına gerçek font URL'leri veriliyor.
- Ham entity census yükleme öncesinde oluşuyor.
- Unsupported entity tipleri sessizce göz ardı edilmiyor; kullanıcıya/diagnostic katmana yansıyor.
- Viewer warning eventleri yakalanıyor.
- Entity bulunan dosyada null/NaN/Infinity bounds `ready` kabul edilmiyor.
- Temel geometry, Turkish text, linear dimension, block/attribute ve unsupported annotation fixture'ları repoda bulunuyor.
- Vercel preview build TypeScript/Next build kapısından geçiyor.

## Stage 1 sonrası karar

Stage 2'ye geçmeden önce gerçek mühendislik DXF örnekleri bu tanılama ile açılmalı ve her eksik bilgi şu üç sınıftan birine atanmalıdır:

1. yerel entegrasyon hatası,
2. upstream `dxf-viewer` sınırlaması,
3. kaynak DXF/export/encoding problemi.

Bu sınıflandırma yapılmadan renderer değiştirme, yeni UI özelliği ekleme veya geniş kapsamlı refactor yapılmamalıdır.
