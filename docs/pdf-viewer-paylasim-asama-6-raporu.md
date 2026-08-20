# PDF Viewer + Paylasim Sistemi - Asama 6 Raporu

Tarih: 20 Agustos 2026

## Uygulanan son regresyon duzeltmesi

- PDF toolbar acilir menusu Studio'nun `z-[200]` katmaninin altinda kaldigi
  icin menu ogelerinin PDF text layer tarafindan tiklanmasi engelleniyordu.
  Menu portali `z-[210]` katmanina alindi.
- Playwright paketi; normal wheel ile PDF-local scroll, sidebar + Fit Width,
  0/90/180/270 derece rotate dongusu, pointer-events ile hand/pan ve
  fullscreen giris/cikis akisini kapsayacak sekilde genisletildi.

## Yerel dogrulama

- `npm run check:document-studio:e2e` - basarili (4/4)
- `npm run check:document-studio:all` - basarili (5/5)
- `npm run check:dokumantasyon` - basarili (14/14)
- `npm run check:document-studio:share-origin` - basarili
- `npx tsc --noEmit` - basarili
- `npm run build` - basarili
- `npx eslint src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx tests/document-studio/stage1.spec.ts` - basarili
- `git diff --check` - basarili

`npm run lint` tum repo icin 113 hata ve 160 uyariyla basarisizdir. Bu
mevcut genis repo lint baseline'idir; Asama 6'da degistirilen toolbar ve E2E
dosyalari hedefli lint kontrolunden gecer.

## Vercel dogrulamasi

- Preview deployment Ready:
  `https://muhendislik-site-mmsgvj30i-huseying5713-2819s-projects.vercel.app`
- Production deployment Ready ve canonical alias'a bagli:
  `https://muhendislik-site-n49aphsrj-huseying5713-2819s-projects.vercel.app`
  -> `https://muhendislik-site.vercel.app`
- Production `GET /`, `GET /dokumantasyon` ve oturumsuz rastgele
  `GET /p/<opaque-token>` 200 dondu. Public route, kontrollu invalid-link
  gorunumu uretti; response'ta `localhost:3000` veya raw runtime hata kodu
  bulunmadi.
- Preview deployment Vercel SSO korumasina yonlendirildigi icin Preview'de
  oturumsuz public-share smoke calistirilamadi.

## Kalan dis dogrulama

Bu ortamda oturumlu bir Production admin browser session'i ve bagli gercek
PDF olmadigindan, asagidaki canli senaryolar yapilamadi:

- yeni gecerli share olusturma ve canonical URL'nin UI'da kopyalanmasi,
- ayni URL'nin incognito/ayri cihazda acilmasi,
- gercek Private Blob TTL 401/403 recovery,
- viewer'in Production'da Ctrl+wheel, print, download ve fullscreen gorsel
  smoke'u.

Kod, unit/integration ve deployment seviyesinde dogrulandi; bu son dort
senaryo oturumlu tarayici mevcut oldugunda ayrica calistirilmalidir.
