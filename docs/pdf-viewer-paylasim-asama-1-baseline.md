# PDF Viewer + Paylaşım Sistemi — Aşama 1 Baseline

Tarih: 20 Ağustos 2026

Bu rapor, production koduna dokunmadan önce yapılan repo keşfini ve
tekrarlanabilir yerel ölçümleri kaydeder.

## Etki haritası

```text
/dokumantasyon/dosya/[fileId]
  -> src/app/dokumantasyon/dosya/[fileId]/page.tsx
  -> DocumentStudioShell
     -> StudioTopbar
        -> CreateShareModal
           -> POST /api/dokumantasyon/shares
              -> createShareLink
                 -> local store / Neon persistence
                 -> public share URL builder
     -> DokPdfViewer
        -> PdfJsStudio
           -> PdfViewerToolbar
           -> PdfThumbnailSidebar
           -> PDF scroll viewport
              -> PdfPageView
                 -> PDF.js canvas, text layer, search highlights

/p/[token]
  -> src/app/p/[token]/page.tsx
  -> getPublicShareInfo
     -> token hash, revocation, expiry and download-limit validation
     -> public file/download routes
        -> short-lived private Blob access (or local stream)
```

## Doğrulanan uygulama parçaları

- PDF motoru `pdfjs-dist` 3.11.174; istemci yükleyicisi yerel PDF.js vendor
  dosyalarını kullanıyor.
- PDF sayfa ölçüleri `PdfPageView` içinde `page.getViewport({ scale, rotation
  })` üzerinden üretiliyor; zoom yalnızca CSS `transform` ile yapılmıyor.
- Paylaşım tokenı 32 byte base64url üretiliyor, veritabanında hash'i tutuluyor
  ve public route sunucu tarafında token, süre, iptal ve indirme sınırını
  doğruluyor.

## Kök nedenler

### Ctrl/Cmd + mouse wheel

`src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx` içindeki effect,
boş bağımlılık dizisi ile ilk render'da çalışıyor. Bu sırada PDF scroll
viewport'u loading koşulu nedeniyle DOM'da yok. Effect `container` bulunamadığı
için döndüğünden, daha sonra viewport mount edildiğinde wheel listener'ı
eklenmiyor. Bu nedenle `{ passive: false }` ve `preventDefault()` kodu mevcut
olmasına rağmen gerçek event hiç yakalanmıyor.

Yerel runtime doğrulamasında viewport bulundu fakat Ctrl+wheel ile gönderilen
iptal edilebilir event için `defaultPrevented` değeri `false` kaldı; zoom etiketi
değişmedi.

### Mobil toolbar ve yatay minimum boyut

`PdfViewerToolbar` `flex-wrap` kullanıyor. 390 × 844 viewport'unda toolbar
98 px yüksekliğe sarıyor. Aynı ölçümde studio shell `scrollWidth` değeri 472 px
oldu; dış shell bunu `overflow-hidden` ile kırpıyor. PDF viewport yatay/dikey
scrollu doğru sahipleniyor olsa da workspace zincirinde eksik `min-w-0` ve
toolbar wrap'i Stage 2 için açık düzeltme hedefleri.

### Paylaşım URL'sinin localhost olması

`src/lib/dokumantasyon/shares.ts` paylaşım linkini şu ayrı resolver ile
oluşturuyor:

```ts
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const shareUrl = `${siteUrl}/p/${rawToken}`;
```

Bu, mevcut `src/lib/site-config.ts` içindeki canonical URL resolver'ını
bypass eder. Production environment değişkeni eksik olduğunda kullanıcıya
paylaşılabilir olmayan localhost linki döndürür. Bu, localhost sorununun
doğrulanmış kök nedenidir.

## Runtime ölçüm özeti

Yerel PDF fixture'ı ile 1366 × 768 viewport'ta ölçüldü:

| Zoom | `html/body` yüksekliği | Shell | PDF viewport |
|---|---:|---|---|
| %100 | 768 px | 1366 × 768, fixed, hidden | 1366 × 663, `overflow:auto`, 663 px scroll height |
| %300 | 768 px | değişmedi | 704 px scroll height |
| %500 | 768 px | değişmedi | 1104 px scroll height |

Dolayısıyla masaüstünde PDF'in dikey overflow'u dış belge yerine PDF viewport'ta
kalıyor. 390 × 844 viewport ve %500 zoomda PDF viewport `390 × 693` iken
`scrollWidth: 1032`, `scrollHeight: 1072`; `html/body` yine 390 × 844 kaldı.

## Paylaşım baseline

| Ortam | Share oluşturma | Üretilen origin | `/p/token` | Oturumsuz |
|---|---|---|---|---|
| Local | Başarılı (HTTP 200) | `http://localhost:3000` | Başarılı (HTTP 200) | Başarılı; login inputu yok |
| Vercel Preview | Ölçülemedi | — | — | Vercel preview erişimi yok |
| Production | Ölçülemedi | — | — | Production admin erişimi yok |

Yerel API'nin ürettiği örnek URL:

```text
http://localhost:3000/p/2oztDPXhbqbeLIGNcVyDNFDxezIlYxR-2JvZBDyvtp8
```

## Başlangıç kalite durumu

- `npm ci`: başarılı; audit 30 bilinen bağımlılık açığı raporladı.
- `npm run lint`: başlangıçta başarısız (111 error, 163 warning). İlgili
  mevcut hatalardan bazıları PDF loader/search dosyalarındaki `any` kullanımı
  ve file page'deki JSX-in-try/catch kuralı.
- `npx tsc --noEmit`: başarılı.
- `npm run build`: başarılı.
- `npm run check:document-studio:e2e`: başarılı (1/1).

## Aşama 1 kapısı

Kod ve runtime kök nedenleri bulundu, etki haritası çıkarıldı ve local baseline
kaydedildi. Preview ile production share matrisi, bu ortamda Vercel admin
yetkisi olmadığı için tamamlanamadı. Bu nedenle Aşama 2'ye geçmeden önce bu iki
ortamda yetkili smoke test yapılmalıdır.

## Vercel follow-up (20 August 2026)

- Vercel CLI access is now authenticated for project `muhendislik-site`. The
  canonical production alias resolves to a Ready production deployment.
- Production environment variables include the admin, database and Blob
  configuration, but **do not include `NEXT_PUBLIC_SITE_URL`**. The deployed
  `createShareLink` implementation therefore follows its current fallback and
  will create `http://localhost:3000/p/<token>` for new production shares.
  This is a confirmed failing production baseline, not merely an untested risk.
- An anonymous HTTP request to a random `/p/<token>` is served by the public
  route with a controlled 200 response and no raw database/server error. This
  verifies public-route reachability only; it does not validate a real share.
- The available Preview deployment is in `Error` status. No Ready Preview
  deployment is available for a valid-share smoke test.
- A real production token could not be created because there is no inherited
  browser admin session and Vercel correctly masks sensitive credentials from
  CLI environment export. The remaining smoke needs either an existing valid
  share URL supplied by an authenticated admin, or a user-performed admin login
  while an accessible browser session is available.

### Updated share baseline

| Environment | Deployment status | Origin outcome | Valid anonymous share |
|---|---|---|---|
| Local | Available | `http://localhost:3000` (local-only) | Verified earlier |
| Vercel Preview | Error | Not testable | Not testable |
| Production | Ready | **Fails:** `NEXT_PUBLIC_SITE_URL` missing, so current code falls back to localhost | Needs an authenticated valid-token smoke after the origin configuration and deployment are corrected |

### Production origin remediation (20 August 2026)

- Added the non-sensitive Production environment variable:
  `NEXT_PUBLIC_SITE_URL=https://muhendislik-site.vercel.app`.
- Redeployed the existing Ready Production deployment (rather than deploying the
  local working tree). The production alias now resolves to
  `muhendislik-site-bsusz0gpd-huseying5713-2819s-projects.vercel.app`, status
  Ready.
- The current deployed share builder now receives the canonical origin, so a
  newly created production share resolves to
  `https://muhendislik-site.vercel.app/p/<token>` instead of the localhost
  fallback.
- Still pending: create one real, passwordless share through an authenticated
  Production admin session and request it without cookies. That final check is
  needed to prove token lookup and anonymous file rendering end-to-end.
