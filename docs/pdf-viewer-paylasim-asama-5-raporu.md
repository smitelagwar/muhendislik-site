# PDF Viewer + Paylasim Sistemi - Asama 5 Raporu

Tarih: 20 Agustos 2026

## Uygulanan degisiklikler

- Public share URL uretimi `getPublicSiteOrigin()` ve
  `buildPublicShareUrl()` fonksiyonlarinda tek bir noktada toplandi.
- Origin sirasi `NEXT_PUBLIC_SITE_URL`, ardindan
  `VERCEL_PROJECT_PRODUCTION_URL` seklindedir. Gelistirme ortaminda bu iki
  deger yoksa `http://localhost:3000` kullanilir.
- Production ortaminda eksik, localhost veya HTTPS olmayan bir origin
  kontrollu `PublicSiteOriginError` ile reddedilir; localhost URL'si
  uretilemez.
- Share URL'leri string birlestirme yerine `new URL()` ile uretildi.
- Share olusturma API'si `shareUrl` dondurmeye devam eder; aktif paylasimlar
  API'si da her kayit icin canonical `shareUrl` dondurur.
- Aktif paylasim modalinin kopyalama ve QR eylemleri
  `window.location.origin` ile URL kurmak yerine API'den gelen `shareUrl`
  degerini kullanir.

## Degistirilen dosyalar

- `src/lib/site-config.ts`
- `src/lib/dokumantasyon/shares.ts`
- `src/app/api/dokumantasyon/shares/route.ts`
- `src/components/dokumantasyon/modals/active-shares-modal.tsx`
- `scripts/check-dokumantasyon-share-origin.ts`
- `package.json`

## Dogrulama

- `npm run check:document-studio:share-origin` - basarili
- `npm run check:dokumantasyon` - basarili (14/14)
- `npm run check:document-studio:e2e` - basarili (3/3)
- `npx tsc --noEmit` - basarili
- `npm run build` - basarili

Production canonical origin degiskeni Vercel'e daha once
`https://muhendislik-site.vercel.app` olarak eklenmistir. Bu asamadaki kaynak
kod degisiklikleri henuz yeni bir Production deployment'a alinmamistir; canli
gercek share smoke testi deploy sonrasinda, oturumlu bir admin ile
olusuturulmus gecerli token uzerinden yapilmalidir.
