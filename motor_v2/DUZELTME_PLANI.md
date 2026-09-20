# DWG/DXF Motor V2 — Düzeltme Planı (Gemini 3.8 Flash High)

**Tarih:** 19 Eylül 2026  
**Kaynak:** `motor_v2/GAP_ANALIZI.md` (24 madde)  
**Kural:** Her adımı sırasıyla yap. Bir adımı atlamadan diğerine geçme. Her adımın sonundaki doğrulama komutunu çalıştır.

---

## GENEL KURALLAR

1. **Mevcut legacy motora (cad-upstream, cad-runtime, preview/) DOKUNMA.**
2. **`main` branch'e push yapma.** Tüm değişiklikler yerelde kalacak.
3. Her adımda yalnız o adımın dosyalarını değiştir.
4. `uygulama__DURUM.md`, `uygulama__PAKET_DURUMLARI.md` ve `uygulama__ALT_KABUL_DURUMLARI.md` dosyalarındaki sahte "18/18 PASS" ve "IMPLEMENTER_VERIFIED" kayıtlarını **düzeltme**. Gerçek durumu yansıtacak şekilde güncelle.
5. Yeni dosya oluştururken plan belgelerindeki (00–32) sözleşmelere uy.

---

## ADIM 1 — Eksik Bağımlılıkları Ekle (B01)

### Yap

`package.json` dosyasının `dependencies` bölümüne şu paketleri **tam sürümle (caret olmadan)** ekle:

```json
"three": "0.172.0",
"d3-zoom": "3.0.0",
"d3-selection": "3.0.0",
"d3-drag": "3.0.0",
"opentype.js": "1.3.4",
"@mlightcad/shx-parser": "1.4.5",
"@mlightcad/mtext-parser": "1.5.0"
```

`devDependencies` bölümüne ekle:

```json
"@types/three": "0.172.0",
"@types/d3-zoom": "3.0.8",
"@types/d3-selection": "3.0.11",
"@types/d3-drag": "3.0.7",
"vitest": "3.2.1"
```

### DWG Paketi Hakkında Önemli Not

`@mlightcad/libredwg-web` paketi plan D04'te belirtiliyor ama repoda `@mlightcad/libredwg-converter` (3.14.2) zaten mevcut. Bu ikisi farklı paketler. Şu iki seçenekten birini uygula:

- Eğer `@mlightcad/libredwg-web` npm'de mevcutsa: `"@mlightcad/libredwg-web": "0.7.10"` ekle.
- Eğer mevcut değilse veya yüklenemiyorsa: `dwg-adapter.ts`'deki import'u `@mlightcad/libredwg-converter`'a göre güncelle ve CR kaydı aç.

### `earcut` sürümünü sabitle

Mevcut `"earcut": "3.2.3"` doğru sürüm ama caret olmamalı. Caret varsa kaldır.

### Doğrulama

```bash
npm install
# Hata yoksa ADIM 1 tamamdır.
# Eğer @mlightcad/libredwg-web bulunamadıysa bunu not et ve ADIM 2'ye geç.
```

---

## ADIM 2 — DWG Adapter Import Düzeltmesi (B17)

### Dosya: `src/lib/cad-v2/decode/dwg-adapter.ts`

Satır 13'teki import'u kontrol et:

```typescript
const { LibreDwg } = await import("@mlightcad/libredwg-web");
```

**Durum A — `@mlightcad/libredwg-web` yüklendiyse:** Import doğru, değiştirme.

**Durum B — Yüklenmediyse:** `@mlightcad/libredwg-converter` paketinin API'sini oku ve adapter'ı bu pakete göre yeniden yaz. Kritik noktalar:
- `dwg_read_data` yerine converter'ın gerçek metod adını kullan
- `dwg_free` ile pointer temizliğini koru
- `convert` metodunun gerçek dönüş yapısını kontrol et
- Hata durumunda `finally` bloğunda temizlik yap

### Doğrulama

```bash
# dwg-adapter.ts'in import ettiği paketin node_modules'da olduğunu kontrol et:
node -e "require.resolve('@mlightcad/libredwg-web')" 2>&1 || node -e "require.resolve('@mlightcad/libredwg-converter')"
```

---

## ADIM 3 — npm Test Scriptlerini Tanımla (B04, B06)

### Dosya: `package.json`

`scripts` bölümüne ekle:

```json
"check:cad-v2:unit": "vitest run tests/cad-v2/ --reporter=verbose",
"check:cad-v2:integration": "tsx scripts/cad-v2/corpus-validator.ts",
"check:cad-v2:ui": "vitest run tests/cad-v2/*acceptance* tests/cad-v2/*routing* --reporter=verbose",
"check:cad-v2:release": "npm run check:cad-v2:unit && npm run check:cad-v2:integration"
```

### Doğrulama

```bash
npm run check:cad-v2:unit
# Testler çalışmalı (PASS veya FAIL fark etmez, çalışması yeterli).
```

---

## ADIM 4 — Server/Browser Kod Ayrımı (B15)

### Sorun

`src/lib/cad-v2/compile/scene-compiler.ts` ve `src/lib/cad-v2/text/font-layout-engine.ts` dosyaları `node:fs`, `node:path`, `node:crypto` import ediyor. Bu dosyalar browser bundle'a girerse çalışma zamanı hatası verir.

### Yap

Bu dosyalar yalnızca sunucu tarafında (API route'ları ve compiler service) kullanılmalı. Kontrol et:

1. `src/components/dokumantasyon/cad-v2/` altındaki hiçbir bileşen `scene-compiler.ts` veya `font-layout-engine.ts`'i doğrudan import **etmemeli**.
2. `src/workers/cad-v2/cad-v2-scene-worker.ts` bu dosyaları import **etmemeli**.
3. Bu dosyalar yalnızca şu yerlerden import edilmeli:
   - `src/app/api/dokumantasyon/cad-v2/*/route.ts`
   - `src/app/api/public/cad-v2/*/route.ts`
   - `src/lib/cad-v2/service/cad-v2-durable-service.ts`

Eğer worker veya component bu dosyaları import ediyorsa, import zincirini kır. Worker yalnız binary protocol (unpacker) ve tipler kullanmalı.

### Doğrulama

```bash
# Browser-side dosyalarda node: import'u olmamalı:
npx grep -r "from \"node:" src/components/dokumantasyon/cad-v2/ src/workers/cad-v2/ --include="*.ts" --include="*.tsx"
# Sonuç boş olmalı.
```

---

## ADIM 5 — SHX Parser Entegrasyonu (B14, B16)

### Dosya: `src/lib/cad-v2/text/font-layout-engine.ts`

Mevcut dosya sadece `opentype.js` ile TTF font kullanıyor. SHX desteği ekle:

1. `@mlightcad/shx-parser` paketini import et
2. `@mlightcad/mtext-parser` paketini import et
3. Font çözüm sırasını uygula:
   - Önce kaynak çizimin belirttiği font dosya adını ara
   - SHX ise `shx-parser` ile glyph outline'ları çıkar
   - TTF/OTF ise `opentype.js` ile ayrıştır
   - Bulunamazsa **degraded** kaydı üret (sessizce null dönme!)
4. MTEXT format kodlarını `mtext-parser` ile ayrıştır (`\P`, `\S`, stack fraction, renk kodları vb.)
5. Türkçe karakter desteğini koru (Ğ, Ü, Ş, İ, Ö, Ç, ı)
6. CAD sembollerini koru (`%%C` → Ø, `%%D` → °, `%%P` → ±)

### Ayrıca

Font dosyaları `public/fonts/` dizininden yükleniyor ama bu yol hardcoded. Font çözümü sunucu compiler'da çalışacağı için `process.cwd()` yaklaşımı yerel geliştirmede çalışır ama dosya yolunu yapılandırılabilir yap.

### Doğrulama

```bash
npx tsc --noEmit --pretty src/lib/cad-v2/text/font-layout-engine.ts
```

---

## ADIM 6 — D3 Camera Adapter Düzeltmeleri (B19)

### Dosya: `src/lib/cad-v2/interaction/d3-camera-adapter.ts`

Plan `28_PAN_ZOOM_FIT_SOZLESMESI.md`'deki sözleşmeye göre şu eksikleri düzelt:

### 6a — `touchable(true)` ekle

Constructor'da `this.zoomBehavior` tanımından sonra ekle:

```typescript
this.zoomBehavior.touchable(() => true);
```

Bu, mouse bulunan dokunmatik dizüstü bilgisayarlarda touch yolunun da kurulmasını sağlar.

### 6b — `scaleExtent` tanımla

Constructor'da zoom behavior yapılandırmasına ekle:

```typescript
const kMin = 1 / this.uMax;
const kMax = 1 / this.uMin;
this.zoomBehavior.scaleExtent([kMin, kMax]);
```

Bu olmadan D3 kendi zoom sınırını uygulamaz ve `handleD3Transform` içindeki manuel clamp yeterli olmaz.

### 6c — Passive:false wheel guard ekle

Input yüzeyine capture fazında passive:false wheel event listener ekle:

```typescript
this.inputElement.addEventListener("wheel", (e: WheelEvent) => {
  if (this.isDisposed) return;
  // Çizim üzerindeki wheel olayında sayfa scroll'unu engelle
  e.preventDefault();
}, { capture: true, passive: false });
```

Bu listener'ı dispose'da kaldırmayı unutma (AbortController veya kayıtlı referans ile).

### Doğrulama

```bash
npx tsc --noEmit --pretty src/lib/cad-v2/interaction/d3-camera-adapter.ts
```

---

## ADIM 7 — Manifest Schema Tamamlama (B20)

### Dosya: `src/lib/cad-v2/compile/scene-compiler.ts`

`CompiledSceneOutput.manifest` arayüzüne ve `compileCanonicalToScene` fonksiyonunun çıktısına şu alanları ekle:

```typescript
manifest: {
  schemaVersion: 1,
  sceneId: string,
  sourceVersionKey: string,
  sourceSha256: string,
  dependencyDigest: string,        // EKSİK — font/XREF dependency hash
  decoderVersions: Record<string, string>, // EKSİK — {dwg: "0.7.10", dxf: "1.14.2"}
  compilerVersion: string,          // EKSİK — runtime compiler build kimliği
  renderAbi: string,
  qualityProfile: "cad-v2-2d-v1",   // EKSİK — sabit değer
  qualityStatus: "exact" | "degraded",
  diagnosticsSummary: {             // EKSİK
    unknownEntityCount: number | null,
    unknownObjectCount: number | null,
    missingFontCount: number | null,
    missingDependencyCount: number | null,
    diagnosticCodes: string[],
  },
  layouts: [...],
  resources: { metadataIds: string[] }, // EKSİK
  indexPages: [...],
  metadataPages: [],                // EKSİK
  limits: {                         // EKSİK
    maxChunkBytes: 2097152,
    maxDecodedBytes: 8388608,
    maxManifestBytes: 1048576,
  },
  createdAt: string,                // EKSİK — ISO 8601
}
```

`compileCanonicalToScene` fonksiyonunda bu alanları gerçek değerlerle doldur. `dependencyDigest` için font dosyalarının SHA-256 hash'ini kullan. `decoderVersions` için kullanılan paket sürümlerini yaz. `createdAt` için `new Date().toISOString()` kullan.

### Doğrulama

```bash
npx tsc --noEmit --pretty src/lib/cad-v2/compile/scene-compiler.ts
```

---

## ADIM 8 — Eksik API Endpoint'leri (B21)

### Oluştur: `src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/metadata/[metadataId]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sceneId: string; metadataId: string }> }
) {
  try {
    await requireDokumantasyonAdmin();
    const { sceneId, metadataId } = await params;
    const service = CadV2DurableService.getInstance();
    const metadata = await service.getSceneMetadata(sceneId, metadataId);
    if (!metadata) {
      return NextResponse.json(
        { code: "METADATA_NOT_FOUND", message: "Metadata bulunamadı." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    return NextResponse.json(metadata, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err.message || "Sunucu hatası" },
      { status: 500 }
    );
  }
}
```

### Oluştur: `src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/indexes/[indexId]/route.ts`

Aynı yapıda, `service.getSceneIndex(sceneId, indexId)` çağıran bir GET handler yaz.

### Ayrıca

Public taraftaki (`src/app/api/public/cad-v2/`) karşılık gelen endpoint'leri de oluştur. Public endpoint'ler `requireDokumantasyonAdmin()` yerine public token doğrulaması kullanmalı (`src/lib/cad-v2/service/public-auth.ts`).

### `CadV2DurableService`'e metodları ekle

`cad-v2-durable-service.ts` dosyasına `getSceneMetadata(sceneId, metadataId)` ve `getSceneIndex(sceneId, indexId)` metodlarını ekle.

### Doğrulama

```bash
# Dosyaların varlığını kontrol et:
ls src/app/api/dokumantasyon/cad-v2/scenes/*/metadata/*/route.ts
ls src/app/api/dokumantasyon/cad-v2/scenes/*/indexes/*/route.ts
```

---

## ADIM 9 — Compiler Service İskeleti (B02)

### Oluştur: `services/cad-v2-compiler/` dizini

```
services/cad-v2-compiler/
├── Dockerfile
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          # Ana giriş noktası
    ├── supervisor.ts     # Tek concurrent job yönetimi
    └── compiler-child.ts # Child process içinde decode + compile
```

### `services/cad-v2-compiler/package.json`

```json
{
  "name": "cad-v2-compiler",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node24 --outdir=dist",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@mlightcad/libredwg-web": "0.7.10",
    "@mlightcad/data-model": "1.14.2",
    "@mlightcad/shx-parser": "1.4.5",
    "@mlightcad/mtext-parser": "1.5.0",
    "opentype.js": "1.3.4",
    "earcut": "3.2.3"
  },
  "devDependencies": {
    "esbuild": "0.25.0",
    "@types/node": "24.0.0"
  }
}
```

**Not:** `@mlightcad/libredwg-web` bulunamadıysa ADIM 2'deki kararı burada da uygula.

### `services/cad-v2-compiler/Dockerfile`

```dockerfile
FROM node:24.15.0-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist/ ./dist/
USER node
CMD ["node", "dist/index.js"]
```

### `services/cad-v2-compiler/src/supervisor.ts`

Tek concurrent job yöneten supervisor:
- Gelen isteği kuyruğa al
- Bir seferde bir child process çalıştır
- 300s outer timeout
- Child process ölürse temizle ve retry (max 2)

### `services/cad-v2-compiler/src/compiler-child.ts`

Child process:
- stdin veya argümanlardan dosya yolunu al
- DWG/DXF adapter ile decode et
- scene-compiler ile compile et
- Sonucu stdout veya dosya olarak yaz
- Hata durumunda exit code 1

### Doğrulama

```bash
ls services/cad-v2-compiler/package.json services/cad-v2-compiler/Dockerfile services/cad-v2-compiler/src/index.ts
```

---

## ADIM 10 — Veritabanı Migration İskeleti (B03)

### Oluştur: `src/lib/cad-v2/db/` dizini

Plan D10'a göre Neon/Postgres V2 tabloları:

### `src/lib/cad-v2/db/schema.sql`

```sql
-- DWG/DXF Motor V2 Tablolar

CREATE TABLE IF NOT EXISTS cad_v2_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  source_version_key TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  artifact_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  phase TEXT NOT NULL DEFAULT 'source',
  progress REAL,
  scene_id UUID,
  fence INTEGER NOT NULL DEFAULT 1,
  attempt INTEGER NOT NULL DEFAULT 0,
  client_request_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(artifact_key, status) -- idempotence
);

CREATE TABLE IF NOT EXISTS cad_v2_job_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES cad_v2_jobs(id),
  attempt INTEGER NOT NULL,
  fence INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(job_id, attempt)
);

CREATE TABLE IF NOT EXISTS cad_v2_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_key TEXT NOT NULL UNIQUE,
  source_version_key TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  manifest_sha256 TEXT,
  quality_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cad_v2_scene_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES cad_v2_scenes(id),
  object_id TEXT NOT NULL,
  object_type TEXT NOT NULL,
  byte_length INTEGER,
  sha256 TEXT,
  blob_path TEXT,
  UNIQUE(scene_id, object_id)
);

CREATE TABLE IF NOT EXISTS cad_v2_view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  job_id UUID REFERENCES cad_v2_jobs(id),
  scene_id UUID REFERENCES cad_v2_scenes(id),
  lease_expires_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Not

Bu migration'ı gerçek Neon DB'ye uygulamak üretim aşamasında yapılacak. Şimdilik şema dosyasını oluşturmak ve durable service'i bu şemaya geçişe hazırlamak yeterli. `cad-v2-durable-service.ts`'in şu anki bellek-içi (Map) implementasyonu yerel geliştirme ve test için kalabilir ama gerçek DB bağlantısı için migration hazır olmalı.

### Doğrulama

```bash
ls src/lib/cad-v2/db/schema.sql
```

---

## ADIM 11 — public/cad-v2/ Asset Dizini (B09)

### Oluştur

```bash
mkdir -p public/cad-v2
```

Bu dizin ileride SHX font dosyaları ve diğer V2 asset'leri için kullanılacak. Şimdilik boş bir `.gitkeep` dosyası koy.

### Doğrulama

```bash
ls public/cad-v2/
```

---

## ADIM 12 — Render Sözleşmesi Eksikleri (B23)

### Dosya: `src/lib/cad-v2/render/cad-v2-renderer.ts`

Plan 29.md'ye göre doğrula ve eksikleri tamamla:

1. **depthTest/depthWrite:** Oluşturulan tüm `THREE.Material` nesnelerinde `depthTest: false` ve `depthWrite: false` olmalı. Kontrol et, eksikse ekle.

2. **ResizeObserver:** Constructor'da veya mount sonrasında `ResizeObserver` ile canvas boyutunu izle. `clientWidth/clientHeight` yerine observer callback'inden gelen boyutları kullan.

3. **Context loss/restore:** `webglcontextlost` ve `webglcontextrestored` event listener'larını canvas'a ekle. Context kaybında çizimi durdur, geri geldiğinde GPU kaynakları yeniden kur. 15s recovery timeout uygula.

4. **NoToneMapping:** Constructor'da `this.renderer.toneMapping = THREE.NoToneMapping;` ekle (eğer yoksa).

### Doğrulama

```bash
npx tsc --noEmit --pretty src/lib/cad-v2/render/cad-v2-renderer.ts
```

---

## ADIM 13 — Worker Scene Unpack Doğrulaması (B22)

### Dosya: `src/workers/cad-v2/cad-v2-scene-worker.ts`

Bu dosyada şu işlevlerin var olduğunu kontrol et, yoksa ekle:

1. Binary chunk header doğrulaması (magic `DV2SCN01`, schemaVersion, byteLength)
2. SHA-256 hash doğrulaması (chunk verisi ile manifest'teki hash karşılaştırması)
3. Decoded allocation sınırı kontrolü (8 MiB)
4. `Transferable` ArrayBuffer kullanımı (`postMessage` ile transfer)
5. Manifest schema validation

### Doğrulama

```bash
npx tsc --noEmit --pretty src/workers/cad-v2/cad-v2-scene-worker.ts
```

---

## ADIM 14 — Uygulama Kayıtlarını Düzelt (B24)

### Dosyalar

- `motor_v2/uygulama__DURUM.md`
- `motor_v2/uygulama__PAKET_DURUMLARI.md`
- `motor_v2/uygulama__ALT_KABUL_DURUMLARI.md`
- `motor_v2/uygulama__DENETIM_DEVRI.md`

### Yap

1. `uygulama__DURUM.md` dosyasındaki çelişkiyi düzelt:
   - Üst kısımdaki "18/18 IMPLEMENTER_VERIFIED" ve "100% PASS" ifadelerini kaldır
   - Gerçek durumu yaz: hangi paketler kısmen tamamlandı, hangileri eksik
   - Alt kısımdaki "NOT_STARTED/NOT_RUN" ifadelerini tutarlı hale getir

2. `uygulama__PAKET_DURUMLARI.md` dosyasında:
   - Her G paketinin gerçek durumunu yaz
   - Eksik bağımlılıklar nedeniyle çalıştırılamamış testleri FAIL veya NOT_RUN olarak işaretle

3. `uygulama__ALT_KABUL_DURUMLARI.md` dosyasında:
   - 77/78 IMPLEMENTER_VERIFIED ifadesini düzelt
   - Gerçek test sonuçlarını yansıt

4. `uygulama__DENETIM_DEVRI.md` dosyasında:
   - "TESLİM HAZIR" ifadesini "DÜZELTME DEVAM EDİYOR" olarak değiştir

### Doğrulama

Bu adımda doğrulama komutu yok. Dosyaların tutarlılığını gözle kontrol et.

---

## ADIM 15 — Genel TypeScript Derleme Kontrolü

### Yap

Tüm değişikliklerden sonra tam derleme kontrolü:

```bash
npx tsc --noEmit
```

V2 kodlarından kaynaklanan hata olmamalı. Eski test/script dosyalarındaki hatalar (cad-stage3, cad-snap vb.) V2 ile ilgili değil; onları yok say.

### Eğer V2 hatası varsa

Hata mesajını oku, ilgili dosyayı düzelt, tekrar dene. Hataları mock/any/ignore ile kapatma.

---

## ADIM 16 — Testleri Çalıştır

```bash
npm run check:cad-v2:unit
```

Test sonuçlarını oku. Gerçek FAIL varsa not et. String kontrolü yapan testler (dosyada "X" string'i var mı?) gerçek runtime testi değil — bunları zaman içinde gerçek testlerle değiştirmek gerekecek ama şimdilik geçen testler yeterli.

---

## ÖZET — Adım Sırası ve Bağımlılıklar

```
ADIM 1  → npm install (tüm adımların önkoşulu)
ADIM 2  → DWG adapter (ADIM 1'e bağlı)
ADIM 3  → npm scriptleri (ADIM 1'e bağlı)
ADIM 4  → server/browser ayrımı (bağımsız)
ADIM 5  → SHX/MTEXT (ADIM 1'e bağlı)
ADIM 6  → D3 adapter (ADIM 1'e bağlı)
ADIM 7  → manifest schema (bağımsız)
ADIM 8  → API endpoint'leri (bağımsız)
ADIM 9  → compiler service (bağımsız)
ADIM 10 → DB migration (bağımsız)
ADIM 11 → public dizini (bağımsız)
ADIM 12 → render düzeltmeleri (ADIM 1'e bağlı)
ADIM 13 → worker doğrulama (bağımsız)
ADIM 14 → kayıt düzeltmeleri (en son)
ADIM 15 → TypeScript derleme (en son)
ADIM 16 → testler (en son)
```

**Bağımsız adımlar (4, 7, 8, 9, 10, 11, 13) paralel yapılabilir.**  
**Sıralı adımlar: 1 → 2 → 5 → 6 → 12 → 15 → 16 → 14**
