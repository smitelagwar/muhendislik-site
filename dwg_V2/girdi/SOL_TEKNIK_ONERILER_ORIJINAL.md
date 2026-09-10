# 2D DWG/DXF VIEWER — ASTRA İÇİN TEKNİK FİKİR, MİMARİ VE ÖNERİ DOSYASI

> Bu doküman bir emir listesi, zorunlu mimari veya bağlayıcı uygulama planı değildir.
>
> Amaç; Astra’ya projenin hedefini, mevcut problemi, olası mimari yaklaşımları, performans fikirlerini, doğruluk problemlerini, riskleri ve kullanılabilecek teknik seçenekleri mümkün olduğunca iyi anlatmaktır.
>
> Astra repo gerçeklerini, mevcut çalışan sistemi, bağımlılıkları, lisansları, tarayıcı koşullarını ve kendi teknik değerlendirmesini inceleyerek burada anlatılan fikirlerden daha iyi bir yöntem bulursa onu seçebilir.
>
> Bu dosyadaki bütün teknoloji isimleri, katmanlar, optimizasyonlar, hedefler ve sıralamalar **öneridir**.

---

# 1. PROJENİN AMACI VE BEKLENEN SONUÇ

Amaç web sitesinde yalnızca **2D DWG ve DXF dosyalarını görüntülemek**.

3D bizim için önemli değil.

İstenen sonuç kabaca şu:

- DWG/DXF dosyası mümkün olduğunca hızlı açılsın.
- AutoCAD’de görülen 2D çizime mümkün olduğunca yakın görünsün.
- Büyük dosyalarda dahi tarayıcı gereksiz yere donmasın.
- Zoom ve pan çok akıcı olsun.
- Mobilde kullanılabilir olsun.
- Yazılar, SHX fontlar, bloklar, hatch, dimension, linetype ve lineweight gibi CAD’e özgü detaylarda kalite yüksek olsun.
- Aynı dosya tekrar açıldığında mümkünse çok daha hızlı açılsın.
- Hatalı veya desteklenmeyen bir nesne bütün görüntüleyiciyi çökertmesin.
- Mevcut çalışan sistemden daha hızlı ve daha kaliteli bir sistem oluşturmak hedeflensin.

Buradaki hedef AutoCAD’in tamamını yeniden yapmak değil.

Özellikle şu özelliklere ihtiyaç yok:

- 3D modeling
- solid modeling
- CAD editing
- command line
- LISP
- parametric constraints
- BIM authoring
- complex plotting
- full AutoCAD clone

Bunun büyük avantajı şu:

> Motor yalnızca 2D görüntüleme için optimize edilebilir.

Genel amaçlı CAD yazılımlarındaki çok sayıda özellik ve abstraction bizim viewer’ımız için gerekli olmayabilir.

---

# 2. ASTRA İÇİN ANA DÜŞÜNCE

Bu proje için en önemli fikirlerden biri, dosya formatını görüntüleme katmanından ayırmak olabilir.

Örneğin genel yaklaşım şöyle düşünülebilir:

```text
DWG ──→ DWG decode katmanı ──┐
                             │
                             ▼
                        ortak CAD modeli
                             │
                             ▼
DXF ──→ DXF decode katmanı ──┘
                             │
                             ▼
                         renderer
```

Buna örnek olarak dahili bir `CAD-IR` benzeri model kullanılabilir.

Fakat isminin CAD-IR olması gerekmiyor.

Astra daha iyi bir yapı görüyorsa:

- scene graph,
- ECS,
- compact geometry database,
- binary scene representation,
- WASM-native document model,
- GPU-oriented scene format

gibi başka bir yaklaşım kullanabilir.

Temel fikir şudur:

> Renderer mümkünse DWG ve DXF’in format ayrıntılarına fazla bağlı olmasın.

Bu sayede ileride:

- DWG decoder değiştirilebilir,
- DXF parser geliştirilebilir,
- renderer değiştirilebilir,
- WebGL/WebGPU backend değiştirilebilir,
- cache formatı geliştirilebilir.

---

## Muhtemel yüksek seviye sistem

Örnek bir mimari:

```text
                    DWG
                     │
                     ▼
              DWG Decoder Layer
                     │
                     │
DXF ─────────► DXF Parser
                     │
                     ▼
             Normalized CAD Model
                     │
          ┌──────────┼───────────┐
          │          │           │
          ▼          ▼           ▼
      Geometry     Text       CAD styles
          │          │           │
          ├────── Block / Insert ┤
          │          │           │
          ├──── Hatch / Dimension
          │
          ▼
       Spatial Index
          │
          ▼
    Render preparation
          │
          ▼
     GPU Renderer
          │
          ▼
       Browser
```

Bu sadece bir örnektir.

Astra daha verimli bir yapı seçebilir.

---

# 3. TEKNİK SEÇENEKLER VE PERFORMANS FİKİRLERİ

Aşağıdaki başlıklar özellikle değerlendirmeye değer.

Hiçbiri tek başına zorunlu değildir.

---

## 3.1 Rust + WebAssembly fikri

CAD parser ve geometry tarafında Rust + WebAssembly güçlü bir seçenek olabilir.

Olası avantajları:

- yoğun parsing için JavaScript’e göre daha kontrollü performans,
- daha kompakt veri yapıları,
- memory layout kontrolü,
- Float64 geometri hesaplarında iyi performans,
- worker içinde kullanım,
- tekrar kullanılabilir çekirdek,
- TypeScript tarafındaki milyonlarca object allocation’ı azaltma.

Alternatif olarak Astra şunları da değerlendirebilir:

- C++ → WASM
- Zig → WASM
- modern TypeScript + TypedArray
- mevcut yüksek performanslı WASM CAD kütüphaneleri
- hibrit native/WASM yapı

Astra benchmark sonucuna göre karar verebilir.

---

## 3.2 DWG decode konusu

DWG parser’ı tamamen sıfırdan yazmak teknik olarak mümkün olsa da projenin esas hedefi açısından çok büyük bir iş olabilir.

DWG:

- binary,
- karmaşık,
- versiyonlu,
- proprietary geçmişe sahip,
- özel nesneler ve proxy object’ler içerebilen

bir format.

Bu nedenle alternatifler değerlendirilebilir.

Örneğin:

- ODA Drawings / Drawings inWEB
- Autodesk RealDWG tabanlı server/native çözüm
- LibreDWG
- mevcut çalışan DWG pipeline’ı
- başka güvenilir DWG decoder’ları

Astra bunların:

- doğruluk,
- browser desteği,
- WASM performansı,
- lisans,
- bundle size,
- memory kullanımı

açısından karşılaştırmasını yapabilir.

Benim fikrim:

> İlk büyük hedef renderer ve viewer kalitesi ise, DWG binary formatının tamamını yeniden keşfetmek yerine güçlü bir decoder katmanının üzerine kendi görüntüleme motorunu kurmak daha hızlı sonuç verebilir.

Ama Astra bunun yerine gerçekten daha iyi bir raw decoder yaklaşımı bulursa bunu seçebilir.

---

## 3.3 DXF parser

DXF tarafında özel parser geliştirmek çok daha gerçekçi olabilir.

DXF’in group-code yapısı buna daha uygundur.

Muhtemel destek:

```text
HEADER
CLASSES
TABLES
BLOCKS
ENTITIES
OBJECTS
```

ve entity bazlı parse.

Parser’ın mümkünse:

- unknown group code nedeniyle çökmemesi,
- alanların her zaman aynı sırada olduğunu varsaymaması,
- bozuk veriyi mümkün olduğunca güvenli işlemesi,
- gereksiz JS object oluşturmaması

iyi olabilir.

ASCII DXF ile başlanıp Binary DXF daha sonra eklenebilir.

Ya da Astra mevcut iyi bir parser’ın daha mantıklı olduğunu düşünürse onu da kullanabilir.

---

## 3.4 Ana thread’i rahat bırakmak

Mevcut web viewer’larda en büyük problemlerden biri ağır CAD işlerinin browser main thread’de çalışması olabilir.

Örnek kötü senaryo:

```text
user opens DWG
→ parser starts on main thread
→ 2 seconds CPU
→ browser UI freezes
→ timeout callback bile geç çalışır
→ kullanıcı siyah ekran görür
```

Buna karşı değerlendirilebilecek yöntemler:

- Web Worker
- WASM worker
- OffscreenCanvas
- worker-side preprocessing
- worker-side tessellation
- worker-side spatial indexing
- mümkünse worker-side rendering

Main thread mümkün olduğunca:

```text
React UI
toolbar
input
small state
```

işlerini yapabilir.

---

## 3.5 Retained-mode renderer

En önemli performans fikirlerinden biri olabilir.

Dosyayı ilk açarken:

```text
parse
→ normalize
→ build geometry
→ build GPU buffers
```

yapılır.

Sonrasında zoom/pan:

```text
camera update
→ visible set
→ draw
```

olabilir.

Yani kullanıcı fareyi her hareket ettirdiğinde:

- DXF tekrar parse edilmemeli,
- geometri tekrar oluşturulmamalı,
- block tekrar çözülmemeli,
- text tekrar layout edilmemeli.

Bu fark büyük dosyalarda çok önemli olabilir.

---

## 3.6 WebGL2 / WebGPU / Canvas

Renderer için birkaç seçenek düşünülebilir.

### WebGL2

Güçlü avantajlar:

- yaygın browser desteği,
- mobil uyumluluğu,
- batching,
- instancing,
- GPU buffers,
- shader tabanlı render.

### WebGPU

Avantajları:

- modern API,
- compute,
- daha gelişmiş GPU model,
- ileride çok güçlü optimizasyon fırsatları.

Fakat browser/device uyumluluğu açısından Astra güncel durumu kontrol ederek karar verebilir.

### Canvas2D

Küçük veya orta çizimlerde oldukça iyi olabilir.

Basitlik avantajı vardır.

Fakat çok büyük çizimler ve on binlerce draw call için GPU renderer daha avantajlı olabilir.

Hibrit model de düşünülebilir:

```text
geometry → WebGL/WebGPU
UI overlay → Canvas/SVG
text → GPU atlas veya özel path
```

---

## 3.7 Float64 + local origin fikri

CAD çizimleri çok büyük world koordinatlarında olabilir.

Örneğin:

```text
X = 487234.3817
Y = 4548321.2391
```

GPU’ya doğrudan Float32 gönderildiğinde precision kaybı oluşabilir.

Bir çözüm:

```text
CPU geometry = Float64

GPU:
point - localOrigin
→ Float32
```

Örnek:

```text
world:
487234.3817
4548321.2391

origin:
487000
4548000

GPU:
234.3817
321.2391
```

Bu özellikle:

- civil drawings,
- site plans,
- survey drawings,
- map coordinates

için faydalı olabilir.

Astra double-double veya başka GPU precision tekniği tercih ederse onu da değerlendirebilir.

---

## 3.8 Spatial index

Her frame’de 500.000 entity’nin tamamını kontrol etmek yerine:

```text
viewport
→ spatial query
→ visible entities
```

yaklaşımı kullanılabilir.

Alternatif yapılar:

- packed R-tree
- BVH
- quadtree
- grid
- flatbush benzeri index
- custom spatial bins

Hangisinin CAD datasında daha iyi olduğunu Astra benchmark edebilir.

---

## 3.9 Block / INSERT optimizasyonu

CAD dosyalarında aynı block binlerce kez kullanılabilir.

Örnek:

```text
1 chair block
20,000 INSERT
```

Her INSERT için geometriyi tekrar kopyalamak çok pahalı olabilir.

Daha verimli fikir:

```text
block geometry once
+
instance transform N times
```

GPU instancing burada çok güçlü olabilir.

Astra WebGPU indirect draw, WebGL instancing veya kendi batching yöntemini seçebilir.

---

## 3.10 TypedArray / compact memory

JavaScript tarafında şu yapı:

```text
{
  x: ...,
  y: ...,
  color: ...,
  layer: ...
}
```

milyonlarca kez oluşursa:

- RAM,
- GC,
- allocation time

artabilir.

Bunun yerine:

```text
Float64Array
Float32Array
Uint32Array
Uint16Array
```

veya WASM-native memory layout kullanılabilir.

Örneğin:

```text
positions
entityOffsets
entityTypes
layerIds
styleIds
```

şeklinde ayrık diziler kullanılabilir.

Bu yaklaşım Structure-of-Arrays olarak düşünülebilir.

Ama Astra ECS veya farklı bir compact representation da seçebilir.

---

## 3.11 Progressive opening

Kullanıcının dosyanın %100 hazır olmasını beklemesi şart olmayabilir.

Örneğin:

```text
0.3 sec → extents
0.6 sec → ana çizgiler
1.0 sec → blocks
1.3 sec → text
1.8 sec → hatch
```

Bu durumda kullanıcı 1.8 saniye siyah ekran yerine 0.6 saniyede çizimi görmeye başlayabilir.

“First useful frame” metriği bu nedenle önemli olabilir.

Astra farklı bir progressive strategy tasarlayabilir.

---

## 3.12 Cache

Dosyanın ikinci açılışını çok hızlandırmak mümkün olabilir.

Fikir:

```text
file bytes
→ hash
→ cache lookup
```

Cache’de:

- normalized CAD model,
- compact geometry,
- block tables,
- text preparation,
- spatial index

gibi pahalı işlemlerin sonucu tutulabilir.

Browser tarafında:

- IndexedDB
- Cache API
- OPFS

değerlendirilebilir.

Astra güncel browser performanslarına göre en iyi seçeneği seçebilir.

---

# 4. GÖRSEL DOĞRULUKTA EN ZOR ALANLAR

Bu viewer’ın kaliteli görünmesini sağlayacak en önemli konular muhtemelen aşağıdakiler olacaktır.

---

## 4.1 TEXT / MTEXT

AutoCAD ile web viewer arasındaki en büyük farklardan biri genellikle yazılar olur.

Dikkate alınabilecek özellikler:

- font family
- SHX
- TTF
- width factor
- oblique
- rotation
- alignment
- baseline
- justification
- text height
- mirror flags
- codepage
- Unicode
- inline MTEXT formatting
- stacked fractions
- paragraph width
- line spacing

Sadece browser’ın default `fillText()` davranışı AutoCAD’e benzemeyebilir.

Daha gelişmiş seçenekler:

- TTF glyph atlas
- HarfBuzz benzeri shaping
- opentype font metrics
- custom text layout
- SHX stroke renderer

değerlendirilebilir.

---

## 4.2 SHX fontlar

Mühendislik çizimlerinde SHX önemli olabilir.

Muhtemel sistem:

```text
requested font
      │
      ├── exact TTF found
      │
      ├── exact SHX found
      │
      └── fallback mapping
```

SHX renderer:

- glyph stroke geometry,
- width,
- advance,
- scale,
- oblique,
- rotation

hesaplayabilir.

Astra SHX’i kendi parse etmek yerine güçlü bir mevcut çözüm bulursa onu da kullanabilir.

---

## 4.3 HATCH

HATCH hem doğruluk hem performans açısından zor.

Önemli noktalar:

- boundary loop
- islands
- nested boundaries
- pattern origin
- pattern angle
- pattern scale
- solid hatch
- clipping

Çok büyük hatch’ler açılış süresini ciddi artırabilir.

Bu nedenle LOD düşünülebilir:

```text
far zoom → simplified
near zoom → detailed
```

Ya da tile-based hatch, GPU shader hatch veya cached tessellation gibi başka yöntemler kullanılabilir.

---

## 4.4 DIMENSION

Dimension sadece birkaç çizgiden oluşmaz.

DimStyle çözümü gerekebilir:

- text height
- arrow
- extension lines
- precision
- unit formatting
- text placement
- scale
- suppress settings

Astra bunu semantic dimension olarak render edebilir veya decoder’ın oluşturduğu anonymous dimension block’larını kullanabilir.

İki yaklaşım da karşılaştırılabilir.

---

## 4.5 BLOCK ve INSERT

Desteklenmesi yararlı olabilecek durumlar:

- nested block
- rotation
- scale
- non-uniform scale
- mirrored insert
- attributes
- layer inheritance
- BYBLOCK
- BYLAYER

Block transform hataları çizimin büyük bölümünü yanlış gösterebilir.

---

## 4.6 Linetype

Desteklenebilecek konular:

- continuous
- dashed
- center
- hidden
- custom patterns
- entity scale
- global scale
- polyline linetype generation

Bunun GPU shader ile yapılması performanslı olabilir.

Ama CPU-generated dash geometry bazı durumlarda daha doğru olabilir.

Astra ikisini benchmark edebilir.

---

## 4.7 Lineweight

Lineweight için CAD world ölçüsü ile ekran pixel ölçüsü arasında dikkatli ilişki kurulabilir.

Aşırı zoom-out durumunda çizgilerin tamamen ekranı kaplamasını önlemek için screen-space clamp düşünülebilir.

Ancak AutoCAD’e benzer davranış hedefleniyorsa referans dosyalarla karşılaştırma yapılması daha doğru olur.

---

# 5. ENTITY KAPSAMI İÇİN ÖNERİ

Bu liste nihai kapsam değildir.

Astra dosyalardaki gerçek kullanımı analiz ederek öncelik sırasını değiştirebilir.

Yüksek öncelikli olabilecek entity’ler:

```text
LINE
POINT
ARC
CIRCLE
ELLIPSE
LWPOLYLINE
POLYLINE
VERTEX
SPLINE
SOLID
TRACE
TEXT
MTEXT
ATTRIB
ATTDEF
INSERT
BLOCK
HATCH
DIMENSION
LEADER
MLEADER
WIPEOUT
IMAGE
VIEWPORT
```

2D çizim için:

- OCS
- WCS
- ECS
- elevation
- extrusion

bilgilerinin yine de doğru ele alınması gerekebilir.

Bir çizim 2D görünse bile entity datası farklı coordinate system içinde olabilir.

---

# 6. CURVE VE GEOMETRİ YAKLAŞIMI

Canonical model mümkünse analitik geometriyi koruyabilir.

Örneğin circle:

```text
center
radius
```

şeklinde saklanabilir.

Renderer için tessellation ayrı yapılabilir.

Aynı şekilde:

- ARC
- ELLIPSE
- SPLINE
- bulge polyline

için adaptive tessellation düşünülebilir.

Zoom uzakken:

```text
fewer segments
```

Yakınken:

```text
more segments
```

Bu performansı ciddi iyileştirebilir.

Astra GPU curve rendering veya signed-distance field yaklaşımı bulursa o da değerlendirilebilir.

---

# 7. CAMERA VE INTERACTION

Pan/zoom performansı renderer’dan bağımsız tutulabilir.

Örneğin camera state:

```text
center
zoom
viewport
devicePixelRatio
```

React state her pointermove’da kullanılmak zorunda değil.

Renderer’ın kendi mutable camera state’i olabilir.

Bu sayede React component tree sürekli render olmayabilir.

Desteklenebilecek davranışlar:

- cursor-centered wheel zoom
- drag pan
- pinch zoom
- touch pan
- fit drawing
- zoom extents
- reset view

---

# 8. MOBİL İÇİN ÖNERİLER

Mobil cihazlar desktop kadar RAM/GPU bütçesine sahip olmayabilir.

Uyarlanabilecek şeyler:

- devicePixelRatio cap
- daha agresif LOD
- hatch detail azaltma
- çok küçük text’i uzakken göstermeme
- frame budget
- memory budget
- lazy refinement
- touch-optimized interaction

Örneğin DPR:

```text
renderDpr = min(deviceDpr, selectedCap)
```

gibi sınırlandırılabilir.

Ama Astra cihaz performansına göre dinamik quality scaling de yapabilir.

---

# 9. FRAME SCHEDULING

Viewer sürekli boş yere 60 FPS render etmek zorunda olmayabilir.

Frame gerektiğinde:

- camera değiştiğinde
- layer değiştiğinde
- viewport resize olduğunda
- progressive data geldiğinde
- selection değiştiğinde

çizilebilir.

Bu CPU ve mobil batarya kullanımını azaltabilir.

---

# 10. LOADING PIPELINE FİKRİ

Bir olası açılış sırası:

```text
file
↓
format detection
↓
hash/cache
↓
decode
↓
normalize
↓
document extents
↓
basic geometry
↓
first frame
↓
blocks/text
↓
hatch/dimension
↓
full ready
```

Astra daha paralel veya streaming bir pipeline tasarlayabilir.

Önemli hedef:

> Kullanıcı çizimin kullanılabilir kısmını mümkün olduğunca erken görsün.

---

# 11. ERROR HANDLING FİKİRLERİ

CAD dosyası güvenilmeyen input gibi düşünülebilir.

Karşılaşılabilecek durumlar:

- corrupted file
- invalid entity count
- recursive block
- huge hatch
- NaN
- Infinity
- invalid transform
- oversized text
- malformed strings
- unsupported proxy object

Mümkünse:

```text
one unsupported entity
≠
whole drawing fails
```

yaklaşımı tercih edilebilir.

Desteklenmeyen entity:

- skip,
- proxy bounds,
- diagnostic log

şeklinde ele alınabilir.

---

# 12. BLACK SCREEN PROBLEMİNE KARŞI DÜŞÜNCELER

Kullanıcı için en kötü sonuçlardan biri sonsuz siyah ekran.

Buna karşı düşünülebilecekler:

- open watchdog
- decoder timeout
- worker crash detection
- WebGL context loss detection
- abortable open request
- generation token
- fallback viewer
- partial render

Örnek:

```text
Nova tries
↓
critical failure
↓
clean teardown
↓
existing stable viewer
```

Mevcut sistemin fallback olarak tutulması çok mantıklı olabilir.

Fakat Astra farklı, daha güvenli bir rollout modeli tasarlayabilir.

---

# 13. REQUEST CANCELLATION

Örnek senaryo:

```text
user opens A
immediately opens B

A finishes later
```

A’nın sonucu B’nin ekranını bozmamalı.

Bunun için:

- request ID
- generation counter
- AbortController
- worker cancel command

gibi yapılar düşünülebilir.

---

# 14. TEARDOWN

Viewer kapandığında aşağıdakilerin temizlenmesi yararlı olur:

- worker
- RAF
- event listeners
- GPU buffers
- textures
- pending tasks
- cache transactions
- references

Özellikle tekrar tekrar dosya açıp kapatırken memory leak test edilebilir.

Test fikri:

```text
open / close same file ×20
```

Sonrasında heap ve GPU resource sayısının sürekli büyüyüp büyümediğine bakılabilir.

---

# 15. CACHE İÇİN DAHA GELİŞMİŞ FİKİRLER

Sadece source file değil, hazırlanmış render verisi bile cache edilebilir.

Örneğin:

```text
File hash
+
engine schema
+
renderer version
```

ile:

- parsed document
- scene binary
- spatial index
- tessellation
- font mapping

saklanabilir.

Fakat çok büyük cache RAM/storage tüketebilir.

LRU veya quota-aware cache mantıklı olabilir.

---

# 16. GPU BATCHING

Entity başına draw call pahalı olabilir.

Örneğin:

```text
100,000 LINE
→ 100,000 draw calls
```

yerine:

```text
line batch
→ few draw calls
```

düşünülebilir.

Batch kategorileri:

- lines
- polyline
- fills
- hatch
- text glyphs
- block instances

Astra material/style bucketing yapabilir.

---

# 17. TEXTURE / FONT ATLAS

On binlerce TEXT/MTEXT varsa her text için ayrı browser text call pahalı olabilir.

GPU atlas yaklaşımı:

```text
glyph atlas
+
glyph quads
```

şeklinde çalışabilir.

SHX için ise stroke geometry cache kullanılabilir.

Astra MSDF/SDF text kullanmayı da değerlendirebilir.

---

# 18. DRAW ORDER

AutoCAD’de entity draw order önemli olabilir.

Bu nedenle:

- source draw order
- sortents table
- hatch/text ordering
- wipeout
- images

gibi durumlar incelenebilir.

Renderer batching yaparken draw order tamamen bozulmamalı.

Astra order-preserving batching veya render passes tasarlayabilir.

---

# 19. CLIPPING

Düşünülebilecek clipping durumları:

- viewport clipping
- block clipping
- xclip
- image clipping
- wipeout

Bunların ilk sürüm kapsamına alınıp alınmayacağı Astra’nın gerçek çizim corpus’una göre belirlenebilir.

---

# 20. BACKGROUND VE AUTOCAD GÖRÜNÜMÜ

AutoCAD benzeri görünüm için sadece entity geometry yeterli değil.

Düşünülebilecekler:

- modelspace background
- ACI renkleri
- dark/light background mapping
- line anti-aliasing
- line caps
- line joins
- point display
- text smoothing

Astra AutoCAD ekran görüntüleriyle görsel kalibrasyon yapabilir.

---

# 21. GOLDEN TEST FİKRİ

Çok güçlü bir doğrulama yöntemi olabilir.

Her küçük CAD özelliği için örnek çizim:

```text
line.dwg
line.dxf

arc.dwg
arc.dxf

mtext.dwg
mtext.dxf

hatch.dwg
hatch.dxf
```

AutoCAD screenshot:

```text
reference.png
```

Nova screenshot:

```text
result.png
```

Sonra visual diff yapılabilir.

Ancak yalnız pixel diff yeterli olmayabilir.

Font anti-aliasing nedeniyle küçük farklar oluşabilir.

Bu nedenle numeric geometry testleri de iyi olur.

---

# 22. NUMERICAL TESTLER

Örnek:

```text
expected LINE endpoint
expected ARC center/radius
expected block matrix
expected extents
expected hatch bounds
expected text anchor
```

Bu, görüntünün tesadüfen doğru görünmesi yerine geometriyi doğrular.

---

# 23. TEST DOSYASI SINIFLARI

Benchmark için farklı çizim profilleri yararlı olabilir.

Örnek:

```text
Small
<5 MB

Medium
5–25 MB

Large
25–100 MB

Extreme
100 MB+
```

Ama dosya boyutundan daha önemli olarak:

- entity count
- block count
- block instance count
- text count
- hatch count
- spline complexity

ölçülebilir.

---

# 24. PERFORMANS METRİKLERİ

“Sistem hızlı” yerine ölçülebilir metrikler kullanılabilir.

Örneğin:

```text
decode time
normalize time
first useful frame
fully ready
peak memory
pan FPS
zoom FPS
draw calls
cache reopen
```

Örnek başlangıç hedefleri sadece yön gösterici olabilir:

| Ölçüm | İyi hedef örneği |
|---|---:|
| Küçük/orta DXF first useful frame | ~1 sn veya daha hızlı |
| Orta DWG first useful frame | ~2–3 sn veya daha hızlı |
| Pan/zoom desktop | ~60 FPS |
| Ağır çizim | mümkünse 30 FPS üzeri |
| Main-thread long tasks | mümkün olduğunca az |
| Cached reopen | ilk açılıştan belirgin hızlı |

Astra gerçek baseline’ı ölçerek daha doğru hedefler belirleyebilir.

---

# 25. FIRST USEFUL FRAME

Performans ölçümünde çok faydalı olabilir.

Tanım önerisi:

> Kullanıcı ana çizim geometrisini görebiliyor ve pan/zoom yapabiliyor.

Hatch veya bazı text refinement işleri henüz bitmemiş olabilir.

Bu kullanıcı algılanan hızını çok iyileştirebilir.

---

# 26. FULL READY

Ayrı bir metrik olarak tutulabilir.

Örneğin:

- text hazır
- hatch hazır
- dimension hazır
- fonts loaded
- spatial index hazır
- final render complete

---

# 27. BENCHMARK: MEVCUT SİSTEM VS YENİ MOTOR

En doğru yöntemlerden biri aynı dosyalarda iki viewer’ı ölçmek olabilir.

Örnek rapor:

```text
FILE: factory-plan.dwg

Stable
First frame: 4.8s
Ready: 7.2s
Pan: 32 FPS
Peak memory: 690 MB

New engine
First frame: 1.9s
Ready: 3.1s
Pan: 60 FPS
Peak memory: 340 MB
```

Bu şekilde hangi optimizasyonun gerçekten işe yaradığı görülebilir.

---

# 28. MEVCUT MOTORUN KORUNMASI KONUSUNDA ÖNERİ

Yeni motor geliştirilirken mevcut çalışan sistemin hemen üzerine yazmamak güvenli olabilir.

Örneğin:

```text
stable
nova
```

iki engine seçeneği tutulabilir.

Development sırasında:

```text
?cadEngine=nova
```

gibi bir flag kullanılabilir.

Yeni sistem yeterince başarılı olduğunda varsayılan yapılabilir.

Bu sadece risk azaltma önerisidir.

Astra mevcut repo mimarisine göre daha iyi bir rollout/canary sistemi tasarlayabilir.

---

# 29. PUBLIC ENGINE INTERFACE FİKRİ

Stable ve yeni engine aynı interface’e yaklaşabilirse geçiş kolay olabilir.

Örnek:

```ts
interface CadViewerEngine {
  open(...)
  resize(...)
  fitToView(...)
  setLayerVisibility(...)
  destroy(...)
}
```

Bu sayede UI hangi renderer’ın çalıştığını çok fazla bilmez.

Ancak mevcut mimari zaten daha iyi bir abstraction içeriyorsa Astra onu kullanabilir.

---

# 30. LAYER SİSTEMİ

CAD layer metadata parse edilip UI’ya verilebilir.

Visibility değişiminde:

```text
layer bitset update
→ redraw
```

yeterli olabilir.

Dosyanın yeniden parse edilmesi gerekmez.

---

# 31. COLOR RESOLUTION

AutoCAD renk sistemi için:

- ACI
- true color
- BYLAYER
- BYBLOCK

dikkate alınabilir.

Nested blocks içinde inheritance çözümü önemlidir.

Astra semantic style resolution’ı render öncesinde veya shader tarafında yapabilir.

---

# 32. LOD

Level of Detail büyük çizimlerde çok faydalı olabilir.

Örnek:

### Uzak text

Ekranda 1 pikselden küçük yazıyı çizmemek.

### Hatch

Uzak zoom’da yoğun hatch pattern yerine simplified görünüm.

### Spline

Uzak zoom’da daha az segment.

### Blocks

Çok küçük block instance’larda simplified bounds.

Bütün bunlarda canonical geometri bozulmamalı.

---

# 33. SAFE DEGRADED MODE

Aşırı ağır bir çizimde tamamen crash olmak yerine viewer kaliteyi geçici azaltabilir.

Örneğin:

- hatch refinement gecikir,
- minuscule text görünmez,
- image underlay lazy yüklenir,
- visible viewport önceliklendirilir.

Bu şekilde ana çizim kullanılabilir kalabilir.

---

# 34. VIEWPORT-FIRST SCHEDULING

Progressive worker işleri arasında kullanıcının gördüğü alan öncelikli olabilir.

Örneğin kullanıcı sağ tarafa zoom yaptıysa:

```text
visible tiles/entities
→ high priority

offscreen hatch
→ low priority
```

Astra task scheduler veya priority queue düşünebilir.

---

# 35. WEBGL CONTEXT LOSS

WebGL kullanılırsa browser context kaybı gerçek bir durumdur.

Desteklenebilecek event’ler:

```text
webglcontextlost
webglcontextrestored
```

CAD document CPU tarafında tutuluyorsa GPU bufferlar yeniden oluşturulabilir.

---

# 36. SHAREDARRAYBUFFER

COOP/COEP uygun olduğunda SharedArrayBuffer performansı artırabilir.

Ama her deployment’ta kullanılabilir olmayabilir.

Alternatif:

```text
Transferable ArrayBuffer
```

Astra mevcut site header/cross-origin ihtiyaçlarına göre karar verebilir.

---

# 37. OFFSCREENCANVAS

Worker rendering için faydalı olabilir.

Fakat browser compatibility kontrol edilmelidir.

Alternatif mimari:

```text
worker:
parse + geometry

main:
WebGL rendering
```

olabilir.

Yani motor OffscreenCanvas’a bağımlı olmak zorunda değil.

---

# 38. BROWSER SUPPORT

Astra projenin gerçek browser kullanıcılarını kontrol edebilir.

Muhtemel capability detection:

```text
WebAssembly
WebGL2
Worker
OffscreenCanvas
IndexedDB
WebGPU
SharedArrayBuffer
```

Ve capability’ye göre farklı fast path’ler oluşturabilir.

---

# 39. 2D OLMASINA RAĞMEN OCS/WCS/ECS

Bu kritik bir konu.

Bazı entity’ler 2D görünmesine rağmen extrusion normal veya entity coordinate system kullanabilir.

Bu nedenle:

```text
source entity
→ coordinate transform
→ final 2D plane
```

işlemi gerekebilir.

Astra bunun için kendi CAD math layer’ını veya decoder’ın transform fonksiyonlarını kullanabilir.

---

# 40. MALICIOUS / CORRUPTED FILE

Dosya parser’ında limitler düşünmek faydalı olabilir.

Örneğin:

- max recursion
- max hatch loops
- max entity count budget
- max string length
- max allocation
- malformed values

Bu sadece güvenlik değil stabilite için de önemlidir.

---

# 41. LISANS KONUSU

DWG konusunda teknik seçim yapılırken lisans da kontrol edilmeli.

Özellikle:

- ODA
- RealDWG
- LibreDWG
- diğer commercial SDK’lar

deployment şekline göre farklı koşullar içerebilir.

Astra teknik olarak en iyi çözümü seçerken lisans/dağıtım etkisini de raporlayabilir.

---

# 42. OLASI MODÜL AYRIMI

Sadece fikir olarak:

```text
cad-engine/
  decode/
  document/
  math/
  geometry/
  text/
  blocks/
  hatch/
  dimensions/
  spatial/
  render/
  worker/
  cache/
  diagnostics/
```

Astra repo yapısına göre başka klasörler seçebilir.

Önemli olan görev sınırlarının temiz olması.

---

# 43. DIAGNOSTICS

Development sırasında çok faydalı olabilir.

Örneğin küçük bir debug overlay:

```text
Engine
Decoder
File size
Entity count
Visible entities
FPS
Draw calls
Memory estimate
Cache hit
Unsupported entities
Missing fonts
```

Bu, performans sorunlarını bulmayı kolaylaştırır.

---

# 44. UNSUPPORTED ENTITY DAVRANIŞI

Viewer için en iyi davranış her şeyi yüzde yüz anlamadığı durumda bile çizimin geri kalanını göstermeye devam etmek olabilir.

Örnek seçenekler:

```text
unknown entity
→ ignore + warning

veya

unknown entity
→ draw proxy bounds
```

Astra decoder’ın proxy graphics sağlaması halinde onları kullanabilir.

---

# 45. DYNAMIC / PROXY OBJECTS

AutoCAD Mechanical, Architecture, Civil vb. özel nesneler bulunabilir.

Bu nedenle “dünyadaki her DWG dosyası birebir aynı açılacak” garantisi teknik olarak zordur.

Ama standart 2D:

- mekanik
- mimari
- statik
- elektrik
- üretim

çizimlerinde çok yüksek uyumluluk hedeflenebilir.

Astra gerçek kullanıcı dosyalarına bakarak en önemli custom object türlerini belirleyebilir.

---

# 46. ASTRA'NIN ÖZGÜRCE DEĞERLENDİRMESİ İSTENEN KONULAR

Bu dokümandaki önerileri inceleyip Astra özellikle şunları yeniden değerlendirebilir:

- Rust gerçekten gerekli mi?
- C++ WASM daha iyi mi?
- TypeScript + WASM hybrid daha iyi mi?
- ODA mı LibreDWG mi?
- mevcut decoder korunmalı mı?
- WebGL2 mi WebGPU mu?
- Canvas2D bazı layer’larda daha hızlı mı?
- CAD-IR nasıl olmalı?
- ECS daha iyi mi?
- spatial index hangisi?
- text renderer nasıl olmalı?
- SHX için mevcut kütüphane kullanılabilir mi?
- hatch GPU’da yapılabilir mi?
- dimension decoder’dan hazır geometry olarak mı alınmalı?
- IndexedDB yerine OPFS daha hızlı mı?
- scene streaming yapılabilir mi?
- multi-worker parse işe yarar mı?
- WebAssembly SIMD avantaj sağlar mı?
- WASM threads kullanılabilir mi?

Astra benchmark ve repo analiziyle bunları seçebilir.

---

# 47. ASTRA İÇİN TAVSİYE EDİLEN ÇALIŞMA ŞEKLİ

Bu da sadece çalışma önerisidir.

Tek seferde bütün viewer’ı yeniden yazmak yerine:

```text
inspect
→ benchmark
→ prototype
→ compare
→ improve
```

yaklaşımı daha güvenli olabilir.

Örneğin:

### Fikir 1

Önce sadece LINE/ARC/LWPOLYLINE ile yeni renderer prototipi.

### Fikir 2

Aynı DXF’i mevcut sistem ve prototipte karşılaştır.

### Fikir 3

100k / 500k entity benchmark.

### Fikir 4

Sonra BLOCK.

### Fikir 5

TEXT/SHX.

### Fikir 6

HATCH/DIMENSION.

Bu şekilde kötü bir mimari erken fark edilebilir.

Ancak Astra başka bir uygulama sırası daha iyi görürse onu seçebilir.

---

# 48. ÖRNEK ARAŞTIRMA SORULARI

Astra uygulamadan önce şu soruların cevaplarını araştırabilir:

1. Mevcut viewer’ın gerçek bottleneck’i nerede?
2. DWG decode mu yavaş?
3. DXF parse mı yavaş?
4. Render mı yavaş?
5. Main thread mi bloklanıyor?
6. Her pan/zoom’da geometry rebuild oluyor mu?
7. Text renderer ne kadar zaman alıyor?
8. Hatch ne kadar zaman alıyor?
9. Worker transferleri memory copy oluşturuyor mu?
10. GPU draw call sayısı ne?
11. React rerender oluyor mu?
12. Mobile’daki bottleneck CPU mu GPU mu RAM mi?
13. Aynı block geometry kaç kez kopyalanıyor?
14. Cache uygulanabilir mi?
15. Current decoder zaten yeterince doğru mu?

Bu ölçümler son mimari seçimlerinde çok değerli olabilir.

---

# 49. BAŞARI KRİTERİ İÇİN ÖNERİ

Astra en sonunda kendine şu soruyu sorabilir:

> Aynı gerçek DWG/DXF dosyasında yeni viewer gerçekten daha mı iyi?

Bunu şu eksenlerde değerlendirmek mantıklı olabilir:

```text
visual fidelity
initial load
first useful frame
pan performance
zoom performance
memory
mobile behavior
stability
font fidelity
hatch fidelity
dimension fidelity
```

Yeni sistem bunların çoğunda anlamlı avantaj sağlamıyorsa mimari yeniden değerlendirilebilir.

---

# 50. BENİM ÖNERDİĞİM GENEL YÖN

Eğer sıfırdan tasarlamak gerekirse benim teknik eğilimim aşağıdaki yönde olurdu:

```text
React / Next UI

        ↓

Worker runtime

        ↓

DWG decoder adapter
+
DXF parser

        ↓

compact normalized CAD model

        ↓

Float64 CAD geometry

        ↓

block/text/hatch/dimension processing

        ↓

spatial index

        ↓

GPU-friendly scene buffers

        ↓

WebGL2 renderer

        ↓

progressive refinement + cache
```

Ek olarak:

```text
local-origin coordinates
GPU block instancing
adaptive curve tessellation
text glyph cache
hatch LOD
viewport culling
IndexedDB/OPFS cache
abortable loading
```

özellikle faydalı olabilir.

Ama tekrar:

> Bu mimari Astra’nın uymak zorunda olduğu bir reçete değildir.

Astra daha yüksek performans, daha iyi doğruluk veya daha basit bakım sunan bir yaklaşım bulursa onu tercih etmesi istenir.

---

# 51. ASTRA'YA DOĞRUDAN VERİLEBİLECEK KISA TALİMAT

Bu dosyanın Astra’ya verilmesinin amacı aşağıdaki gibi ifade edilebilir:

> Amacım web sitem için yalnızca 2D DWG/DXF dosyalarını açan, mümkün olduğunca AutoCAD’e yakın görüntü veren, büyük dosyalarda hızlı çalışan, zoom/pan sırasında akıcı kalan, mobilde kullanılabilen ve mevcut viewer’dan daha güçlü bir CAD görüntüleme sistemi geliştirmek. Bu dokümanda çok sayıda mimari ve performans fikri var. Bunları zorunlu kurallar olarak görme. Önce repo ve mevcut viewer mimarisini incele, gerçek darboğazları ölç, mevcut çalışan bölümleri anlamaya çalış ve daha iyi bir çözüm görüyorsan dokümandaki önerilerden sap. Özellikle Rust/WASM, DWG decoder adapter, özel DXF parser, ortak CAD scene modeli, WebGL2/WebGPU renderer, worker, OffscreenCanvas, spatial index, GPU instancing, SHX/TTF text engine, hatch/dimension engine ve cache yaklaşımlarını değerlendir. Ama teknoloji seçimini benchmark, doğruluk, lisans, bakım kolaylığı ve gerçek repo koşullarına göre sen yap. Hedef teknoloji kullanmak değil; mümkün olan en hızlı, kaliteli, stabil ve doğru 2D DWG/DXF viewer’ını üretmek.

---

# 52. SON NOT

Bu projenin ana fikri şu olabilir:

```text
CAD file
→ decode once
→ prepare once
→ retain scene
→ draw only what is needed
```

ve kullanıcı pan/zoom yaptığında mümkünse:

```text
camera change
→ visibility change
→ GPU draw
```

olmalı.

Yani her kullanıcı hareketinde pahalı CAD işlemlerinin yeniden yapılmaması büyük performans kazancı sağlayabilir.

Yeni sistemin güçlü olacağı asıl yer de büyük ihtimalle burasıdır.

---

## ÖZET

Hedef:

> **AutoCAD’in tamamını yapmadan, sadece 2D DWG/DXF görüntüleme işini çok iyi yapan özel bir web motoru oluşturmak.**

Değerlendirilebilecek ana fikirler:

- güçlü DWG decoder kullanmak,
- DXF parser’ı optimize etmek,
- ortak compact scene representation,
- Worker/WASM,
- retained GPU rendering,
- spatial culling,
- block instancing,
- adaptive LOD,
- kaliteli SHX/TTF,
- hatch/dimension fidelity,
- progressive opening,
- persistent cache,
- golden AutoCAD karşılaştırmaları,
- gerçek dosyalarla benchmark.

Bunların hiçbiri tek başına zorunlu değildir.

**Astra’nın amacı bu önerilerin içinde kalmak değil, bu önerileri başlangıç bilgisi olarak kullanıp mümkün olan en iyi sistemi tasarlamaktır.**
