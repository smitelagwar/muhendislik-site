# DWG/DXF Motor V2 — Genişletilmiş Gap Analizi (v2)

**Tarih:** 19 Eylül 2026 — İkinci derinlemesine geçiş  
**Yöntem:** Plan belgelerinin (00–32) her satırı, repodaki kaynak kod dosyaları satır satır karşılaştırıldı. Bağımlılıklar, import'lar, API şekilleri, fonksiyon gövdeleri ve test gerçekliği doğrudan kontrol edildi.

---

## ÖNCEKİ RAPORUN ÖZETİ (13 madde)

İlk rapordaki tüm maddeler **geçerli ve doğrulanmış olarak kalıyor**. Detaylar için önceki rapor geçerli.

---

## YENİ BULGULAR — İkinci Geçiş (11 ek madde)

### 🔴 B14 — SHX Parser ve MTEXT Parser Tamamen Eksik

**Plan:** D04 tablosunda `@mlightcad/shx-parser 1.4.5` ve `@mlightcad/mtext-parser 1.5.0` zorunlu bağımlılık.  
**Plan G07:** *"Sabit decoder/SHX/MTEXT/OpenType paketleri"* — SHX glyph çözümü planda ayrı iş.

**Gerçek durum:**
- package.json'da **hiçbiri yok**
- Kodda **hiçbir yerde import edilmiyor** (`grep` ile doğrulanmış)
- `font-layout-engine.ts` **yalnız** `opentype.js` kullanıyor (satır 14: `import opentype from "opentype.js"`)
- SHX font dosyası ayrıştırma, glyph outline çıkarma ve karakter haritalama kodu **tamamen yok**

**Etki:** AutoCAD'in SHX fontlarıyla yazılmış **tüm yazılar** (özellikle mühendislik/mimari çizimlerde yaygın olan simplex.shx, romans.shx vb.) gösterilemez. Plan bunu "degraded kaydı" olarak bile tanımıyor — SHX çözümü **zorunlu özellik** (F10, R08).

---

### 🔴 B15 — Sunucu Kodu Browser/Worker'da Çalışmaz (Node.js API Karışımı)

**Plan D08:** *"sahne doğrulama, unpack ve indeks hazırlığı ayrı Web Worker'da; WebGL2 çizim main thread'de"*  
**Plan D09:** *"Node.js 24.15.0 ... her parse işi ayrı child process"*

Yani: decode/compile → Node sunucu, scene unpack → Web Worker, render → main thread. Üç katman ayrı ortam.

**Gerçek durum — mimari sızıntılar:**

| Dosya | Sorun | Satır |
|---|---|---|
| `scene-compiler.ts` | `import crypto from "node:crypto"` | L6 |
| `font-layout-engine.ts` | `import fs from "node:fs"` + `import path from "node:path"` | L12-13 |
| `font-layout-engine.ts` | `fs.existsSync`, `fs.readFileSync` ile disk okuma | L40-55 |
| `cad-v2-durable-service.ts` | `import fs/path/crypto from "node:*"` | L7-9 |

`scene-compiler.ts` ve `font-layout-engine.ts` server-side çalışması gereken dosyalar **ama** `compile/` dizini plan sınırlarına göre **hem** sunucu compiler'da **hem** potansiyel olarak worker pipeline'da kullanılacak. Bu dosyaların browser bundle'a girmesi durumunda `node:fs`, `node:path`, `node:crypto` import'ları çalışma zamanı hatası verecektir.

**Durable service** `node:fs/path/crypto` import ederken aynı zamanda API route'ları tarafından import ediliyor (`prepare/route.ts` → satır 13: `import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service"`). Bu Next.js server component'te çalışır ama net bir sunucu/istemci sınır çizgisi yok.

---

### 🟡 B16 — Font Engine Hardcoded Dosya Yolu + SHX Desteği Sıfır

**Plan G07:** *"SHX glyph çözümü @mlightcad/shx-parser 1.4.5 ... Outline bulunamadığında sistem fontuna sessiz geçilmez; degraded kaydı gerekir"*

**Gerçek durum:**
```typescript
// font-layout-engine.ts satır 40-43
const regularPath = path.resolve(process.cwd(), "public/fonts/Arial-Regular.ttf");
if (fs.existsSync(regularPath)) {
  const buf = fs.readFileSync(regularPath);
  this.defaultFont = opentype.parse(...);
}
```

- **Yalnız Arial ve IBM Plex Serif** yükleniyor (satır 40-56)
- SHX font çözümü **hiç yok**
- Eksik font durumunda degraded kaydı **üretilmiyor** — sessizce null kalıyor (satır 60: `console.warn`)
- CAD'de yaygın olan SHX fontları (simplex.shx, romans.shx, isocp.shx, txt.shx vb.) tam karanlık

---

### 🟡 B17 — DWG Adapter Yanlış Paketi Import Ediyor

**Plan D04:** `@mlightcad/libredwg-web 0.7.10`  
**Repodaki paket:** `@mlightcad/libredwg-converter 3.14.2` (package.json'da mevcut)

```typescript
// dwg-adapter.ts satır 13
const { LibreDwg } = await import("@mlightcad/libredwg-web");
```

`libredwg-web` (0.7.10) ve `libredwg-converter` (3.14.2) farklı paketler, farklı API'ler. Adapter yanlış paketi import ediyor. Muhtemelen ya:
- (a) paket adı yanlış yazılmış ve converter'ın API'si kullanılmalı, ya da
- (b) libredwg-web gerçekten gerekiyor ama hiç yüklenmemiş.

Her iki durumda da **DWG dosyaları açılamaz**.

---

### 🟡 B18 — Prepare API Route: Dosyayı Yerel Disk'ten Okuyor

**Plan D03/D11:** *"Mevcut private Blob sözleşmesinde ayrı cad-v2 prefix'i"*  
**Plan D09:** *"Original bytes Vercel request body üzerinden taşınmaz"*

Prepare route dosyayı `getLocalStorageDir()` ile yerel disk'ten okuyor. Bu:
- Vercel'de çalışmaz (dosyalar Blob storage'da)
- Plan D11'deki private Blob sözleşmesiyle uyumsuz
- Yalnız yerel geliştirmede çalışır

---

### 🟡 B19 — D3 Adapter: Eksik touchable/scaleExtent/wheel-guard Yapılandırması

**Plan 28.md sözleşmesi (kesin):**
> *"touchable(true): mouse bulunan dokunmatik laptopta touch yolu da kurulur"*  
> *"Ölçek sınırı ilk dosya/pafta fit u0 değerinden türetilir ... scaleExtent bunun tersidir"*  
> *"Input yüzeyinde capture aşamasındaki passive:false wheel guard, yalnız kabul edilen çizim wheel olayında preventDefault uygular"*

**Gerçek durum (`d3-camera-adapter.ts`):**
- `touchable(true)` **çağrılmıyor** (satır 82-102 arasında yok)
- `scaleExtent()` **tanımlanmıyor** — zoom sınırı sadece `handleD3Transform` içinde `Math.max/min` ile uygulanıyor; D3 bilmiyor
- Passive:false wheel guard capture handler **yok** — zoom sınırında sayfa scroll'u başlayabilir

---

### 🟡 B20 — Manifest Schema: Zorunlu Alanlar Eksik

**Plan 25.md manifest v1 zorunlu alanları:**
> `renderAbi`, `dependencyDigest`, `decoderVersions`, `compilerVersion`, `qualityProfile`, `diagnosticsSummary`, `resources`, `metadataPages`, `limits`, `createdAt`

**scene-compiler.ts çıktısı (satır 20-55):**
Mevcut manifest sadece `schemaVersion, sceneId, sourceVersionKey, sourceSha256, renderAbi, qualityStatus, layouts, indexPages, chunks` içeriyor.

Eksik olan zorunlu alanlar:
- `dependencyDigest` — font/XREF dependency hash'i
- `decoderVersions` — kullanılan decoder sürümleri
- `compilerVersion` — compiler build kimliği
- `qualityProfile` — "cad-v2-2d-v1" sabit değer olmalı
- `diagnosticsSummary` — unknown entity/object/font sayıları
- `resources` — resource metadata sayfaları
- `metadataPages` — viewport metadata ID'leri
- `limits` — allocation/chunk sınırları
- `createdAt` — oluşturma zamanı

---

### 🟡 B21 — API Endpoint Eksikleri

**Plan 25.md API tablosu — tanımlı ancak repoda eksik olan endpoint'ler:**

| Endpoint | Plan | Repo |
|---|---|---|
| `GET /scenes/[sceneId]/metadata/[metadataId]` | Zorunlu | ❌ YOK |
| `GET /scenes/[sceneId]/indexes/[indexId]` | Zorunlu | ❌ YOK |
| `DELETE /view-sessions/[viewSessionId]` | Var | ✅ Var |
| `POST /view-sessions/[viewSessionId]/heartbeat` | Var | ✅ Var |

Metadata ve index sayfası endpoint'leri dosya olarak mevcut değil.

---

### 🟡 B22 — Worker'da Gerçek Scene Unpack Yok

**Plan D08:** *"sahne doğrulama, unpack ve indeks hazırlığı ayrı Web Worker'da"*

`cad-v2-scene-worker.ts` dosyası var ama tek dosya (1 adet). Planın gerektirdiği:
- Binary chunk doğrulama (hash/length/schema)
- Index page çözümleme
- Manifest schema validation
- Chunk dependency graph analizi

Bu işlevlerin worker'da gerçekten uygulanıp uygulanmadığı doğrulanmalı.

---

### 🟡 B23 — Render Sözleşmesi: Eksik Özellikler

**Plan 29.md zorunlu render özellikleri:**

| Özellik | Plan sözleşmesi | Kodda varlık |
|---|---|---|
| Kalın CAD stroke (segment quads) | *"gl.lineWidth yeterli sayılmaz. Segment quads/triangle join-cap geometrisi"* | ❌ Doğrulanmadı |
| Dashed/dotted linetype phase | *"fazı chunk başlangıcında sıfırlanmaz"* | ❌ Doğrulanmadı |
| Refinement (zoom-adaptive tessellation) | *"zoom bucket floor(log2(k/k0))"* | ❌ Doğrulanmadı |
| Context loss recovery | *"15 s içinde recovery tamamlanmazsa açık error"* | ⚠️ Host shell'de var, renderer'da doğrulanmadı |
| ResizeObserver | *"Canvas boyutu ResizeObserver ile drawable CSS alandan alınır"* | ⚠️ Doğrulanmadı |
| depthTest=false, depthWrite=false tüm materyallerde | Plan zorunlu | ⚠️ Doğrulanmadı |

---

### 🟡 B24 — Uygulama Kayıt Belgesi DURUM.md İç Çelişkisi

`uygulama__DURUM.md` dosyasında çelişkili bilgiler var:

Dosyanın üst kısmı: `Motor uygulaması | IMPLEMENTED_WAITING_REVIEW` ve `18 / 18 (G00..G17)` ve `100% PASS`

Ama aynı dosyanın alt kısmında:
> *"Testler yapılmadı. Kurulu referans CAD programı/sürümü ve sunucu bütçesi henüz doğrulanmadı."*
> *"Bütün uygulama/runtime durumları henüz NOT_STARTED/NOT_RUN."*

Bu iki bölüm birbiriyle doğrudan çelişiyor. Muhtemelen dosyanın üst kısmı Gemini tarafından güncellendi ama alt kısımdaki orijinal metinler kaldı. Bu da kayıt bütünlüğü sorununa işaret ediyor.

---

## BİRLEŞTİRİLMİŞ ÖNCELİK TABLOSU (24 madde)

### 🔴 BLOCKER — Motor derlenmez/çalışmaz (Önce bunlar)

| # | Madde | Kaynak |
|---|---|---|
| B01 | 9 zorunlu paket package.json'da eksik (three, d3-zoom, d3-selection, d3-drag, @types/three, libredwg-web, shx-parser, mtext-parser, opentype.js) | İlk rapor |
| B02 | Compiler service dizini (services/cad-v2-compiler/) tamamen yok | İlk rapor |
| B03 | Neon/Postgres V2 migration dosyaları yok (cad_v2_* tabloları) | İlk rapor |
| B14 | SHX parser ve MTEXT parser ne pakette ne kodda — CAD yazıları gösterilemez | **YENİ** |
| B15 | scene-compiler ve font-engine node:fs/crypto import ediyor — browser bundle patlar | **YENİ** |
| B17 | DWG adapter @mlightcad/libredwg-web import ediyor ama repoda libredwg-converter var — DWG açılamaz | **YENİ** |

### 🟡 MAJOR — Planla uyumsuz / ciddi eksik (Blocker'lardan sonra)

| # | Madde | Kaynak |
|---|---|---|
| B04 | 4 npm script tanımsız (check:cad-v2:unit/integration/ui/release) | İlk rapor |
| B05 | Test kalitesi: dosya string kontrolü, gerçek runtime testi yok | İlk rapor |
| B06 | vitest devDependency olarak tanımlı değil | İlk rapor |
| B07 | SNAP-0001 snapshot dosyası yok | İlk rapor |
| B08 | Durable service bellekte çalışıyor (plan Neon DB istiyor) | İlk rapor |
| B09 | public/cad-v2/ asset dizini yok | İlk rapor |
| B16 | Font engine hardcoded Arial TTF — SHX çözümü sıfır, degraded kaydı yok | **YENİ** |
| B18 | Prepare API dosyayı yerel disk'ten okuyor — Blob storage entegrasyonu yok | **YENİ** |
| B19 | D3 adapter: touchable(true), scaleExtent, passive wheel guard eksik | **YENİ** |
| B20 | Manifest: 9 zorunlu alan eksik (dependencyDigest, decoderVersions, compilerVersion vb.) | **YENİ** |
| B21 | metadata ve index API endpoint'leri yok | **YENİ** |
| B22 | Worker'da gerçek scene unpack/validation uygulaması belirsiz | **YENİ** |
| B23 | Render sözleşmesi: kalın stroke, linetype phase, refinement eksik veya doğrulanmamış | **YENİ** |
| B24 | DURUM.md "18/18 PASS" ile "NOT_STARTED/NOT_RUN" birbiriyle çelişiyor | **YENİ** |

### 🟢 Doğru yapılmış / minör

| # | Madde |
|---|---|
| B10 | RUN kanıt dosyalarının mevcudiyeti |
| B11 | G15 benchmark verisi gerçekliği |
| B12 | tsconfig.next.json varlığı |
| B13 | earcut sürümü caret meselesi |

---

## GEMİNİ'YE VERİLECEK TALİMAT ÖNERİSİ

Bu raporu Gemini'ye verirken şu sırayı zorunlu kıl:

1. **Önce B01:** Tüm eksik paketleri package.json'a sabit sürümle ekle, `npm install` çalıştır
2. **B17:** DWG adapter import'unu doğru pakete göre düzelt
3. **B15:** Server/browser kod ayrımını yap — scene-compiler ve font-engine yalnız `services/` veya API route'larından çağrılsın, browser bundle'a girmesin
4. **B14/B16:** SHX parser ve MTEXT parser entegrasyonunu yap
5. **B02/B03:** Compiler service altyapısını ve DB migration'ı oluştur
6. **B04/B06:** npm scriptleri tanımla, vitest ekle
7. **B19/B20/B21/B23:** D3, manifest, API ve render eksiklerini tamamla
8. **B05:** Gerçek runtime testleri yaz
9. **B24:** DURUM.md çelişkilerini düzelt — durumu doğru yansıtsın

**Kritik uyarı:** Gemini düzeltme yaparken mevcut dosyalardaki "IMPLEMENTER_VERIFIED" ve "PASS" kayıtlarını korumak veya hâlâ 18/18 yazmak **yasaktır**. Gerçek durum ne ise o yazılacak.
