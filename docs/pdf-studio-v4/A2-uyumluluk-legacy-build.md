# A2 — Uyumluluk: Legacy pdf.js Build + Cache Sürümleme

**Amaç:** pdf.js'i polyfill içeren **legacy** build'e geçirmek; eski Chrome/Safari/Firefox'ta "boş ekran"ı bitirmek. `pdfjs-dist` sürümü **6.3.289 sabit** kalır.
**Dokunulacak dosyalar (yalnız bunlar):**
- `scripts/sync-pdfjs-vendor.mjs` (yeni)
- `scripts/check-pdfjs-vendor.mjs` (yeni)
- `package.json` (yalnız iki yeni script satırı)
- `public/vendor/pdfjs/pdf.min.mjs`, `public/vendor/pdfjs/pdf.worker.mjs` (içerik değişir, ad aynı)
- `src/lib/pdfjs-client.ts`

`public/vendor/pdfjs/` altındaki `cmaps/`, `standard_fonts/`, `wasm/`, `iccs/`, `image_decoders/`, `LICENSE` **değişmez**.

## Önce oku
- `src/lib/pdfjs-client.ts` (33 satır), `src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts`.
- `next.config.ts` → `/vendor/pdfjs/(.*)` immutable başlığı (**dokunma**; sürümleme URL'den yapılacak).
- `scripts/check-dokumantasyon-studio-all.mjs` satır ≈117: `pdfjsClientContent.includes("/vendor/pdfjs/pdf.min.mjs")` — bu kontrol **geçmeye devam etmeli** (aşağıdaki kod bunu korur).

## Adım 1 — Senkron betiği
`scripts/sync-pdfjs-vendor.mjs`:

```js
// pdf.js legacy build'ini public/vendor/pdfjs altına senkronlar (polyfill'li, eski tarayıcı uyumlu).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DOSYALAR = [
  ["node_modules/pdfjs-dist/legacy/build/pdf.min.mjs", "public/vendor/pdfjs/pdf.min.mjs"],
  ["node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "public/vendor/pdfjs/pdf.worker.mjs"],
];

for (const [kaynak, hedef] of DOSYALAR) {
  if (!existsSync(kaynak)) {
    console.error(`HATA: kaynak yok: ${kaynak} (npm ci çalıştırıldı mı?)`);
    process.exit(1);
  }
  mkdirSync(dirname(hedef), { recursive: true });
  copyFileSync(kaynak, hedef);
  console.warn(`kopyalandı: ${kaynak} -> ${hedef}`);
}
```
(Betikte `console.warn` kullanımı build aracı çıktısıdır; `console.log` yasağı üretim kodu içindir.)

## Adım 2 — Doğrulama betiği
`scripts/check-pdfjs-vendor.mjs`: iki dosya için SHA-256 hesapla, `legacy/build/*` kaynakları ile **eşit** olmalı; ayrıca `public/vendor/pdfjs/pdf.min.mjs` içeriğinde `core-js` geçmeli. Kural ihlalinde `process.exit(1)` ve Türkçe hata. Hash için `node:crypto` kullan. `package.json` sürümünün `pdfjs-dist` için tam `"6.3.289"` (^ veya ~ yok) olduğunu da doğrula.

`package.json` scripts'e ekle (başka satıra dokunma):
```json
"sync:pdfjs-vendor": "node scripts/sync-pdfjs-vendor.mjs",
"check:pdfjs-vendor": "node scripts/check-pdfjs-vendor.mjs"
```

## Adım 3 — Çalıştır
```powershell
npm run sync:pdfjs-vendor
npm run check:pdfjs-vendor
```
`git diff --stat public/vendor/pdfjs` yalnız iki `.mjs` dosyasını göstermeli. Başka vendor alt klasörü değiştiyse geri al.
Ayrıca karşılaştır ve **yalnız rapora yaz** (düzeltme yapma): `public/vendor/pdfjs/image_decoders` içeriği ile `node_modules/pdfjs-dist/image_decoders` aynı mı?

## Adım 4 — URL sürümleme (cache tuzağı)
`next.config.ts` `/vendor/pdfjs/*` için **1 yıl immutable** veriyor; dosya adı aynı kaldığı için bu yapılmazsa eski ziyaretçiler eski build'i 1 yıl kullanır. `src/lib/pdfjs-client.ts` içinde:

```ts
/** Vendor dosyaları değiştiğinde artırılır; immutable önbelleği kırmak için URL'ye eklenir. */
export const PDFJS_ASSET_VERSION = "6.3.289-legacy-1";
```
ve:
```ts
const moduleUrl = `/vendor/pdfjs/pdf.min.mjs?v=${PDFJS_ASSET_VERSION}`;
// ...
pdfjs.GlobalWorkerOptions.workerSrc = `/vendor/pdfjs/pdf.worker.mjs?v=${PDFJS_ASSET_VERSION}`;
```
Başka hiçbir şey değişmez (`webpackIgnore` yorumu, `window.pdfjsLib` önbelleği, hata durumunda `pdfJsPromise = null` aynen kalır).

Kural: vendor dosyaları bir daha değişirse `PDFJS_ASSET_VERSION` **mutlaka** artırılır. Bunu `scripts/check-pdfjs-vendor.mjs` içine ekle: dosyada `PDFJS_ASSET_VERSION` sabiti var mı ve `legacy` içeriyor mu kontrol et.

## Adım 5 — Hata mesajı
`pdfjs-client.ts`'te `catch` içinde hata yeniden fırlatılırken mevcut davranışı bozma. Kullanıcıya görünen hata zaten `pdfjs-studio.tsx` içindeki `genericLoadError` ile geliyor; **burada değişiklik yok.**

## Test
1. A1'deki **T1** (eski tarayıcı taklidi) → **YEŞİL** olmalı.
2. `npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v2-faz-b.spec.ts --project=chromium` — Test 1 `/vendor/pdfjs/pdf.min.mjs` isteğinin `immutable` başlığını doğrular; sorgusuz URL için başlık hâlâ aynı olmalı.
3. `/belgeler` ortak yükleyici etkilendi: `npx playwright test --config=playwright.config.ts tests/site-audit/belgeler-mobile-studio.spec.ts` (config yolunu `package.json` içindeki `check:site-e2e` satırından al: `playwright.site.config.ts`).
4. `npm run check:pdf-v3:invariants` ve `npm run check:pdf-v3:unit` (kırmızıya dönen yok).
5. `npm run check:pdfjs-vendor` yeşil.

## Kapı
T1 yeşil + yukarıdaki 5 madde. T1 kırmızı kalırsa **dur**: pageerror çıktısını (hangi API) rapora kopyala; vendor dosyasına elle yama yapma, polyfill yazma.

## Geri alma
`git restore public/vendor/pdfjs/pdf.min.mjs public/vendor/pdfjs/pdf.worker.mjs src/lib/pdfjs-client.ts package.json`; yeni iki betiği sil.

## Rapor
Standart şablon + `git diff --stat` çıktısı + `image_decoders` karşılaştırma sonucu + yeni `.mjs` dosya boyutları.
