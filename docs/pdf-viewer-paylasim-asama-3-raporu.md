# PDF Viewer + Paylasim Sistemi - Asama 3 Raporu

Tarih: 20 Agustos 2026

## Degistirilen dosyalar

- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`
- `tests/document-studio/stage1.spec.ts`

## Uygulanan zoom modeli

- Tek bir `ZoomState` kaynagi eklendi: `custom`, `actual-size`, `fit-width`
  ve `fit-page` modlari ile bunlarin tek `scale` degeri birlikte tutuluyor.
- Tum manuel zoom girisleri (toolbar, klavye ve Ctrl/Cmd + wheel) ayni
  `adjustCustomZoom` hattini kullanir. Olcek araligi 25% ile 500% arasinda
  sinirlanir.
- Ctrl/Cmd + wheel native ve `passive: false` listener ile yalnizca
  `pdf-scroll-viewport` uzerinde dinlenir. `preventDefault()` event aninda
  uygulanir; normal wheel scrollu ve viewer disindaki wheel davranisi
  degistirilmez.
- Hizli wheel/pinch akisi bir animation frame icinde biriktirilir. Boylece
  browser zoomu aninda engellenirken React state guncellemesi frame basina en
  fazla bir kez yapilir.
- Wheel zoomunda imlecin altindaki belge noktasi, eski/yeni olcek oraniyla
  scroll koordinati duzeltilerek ayni viewport konumunda tutulur.
- Fit Width ve Fit Page, gercek scroll viewport olculeri, sayfa boyutu ve
  rotasyonu kullanir. `ResizeObserver` sadece aktif fit modunu yeniden hesaplar;
  kullanicinin custom zoomu viewport resize sonrasinda korunur.

## Regresyon kaniti

E2E senaryosu su davranislari dogrular:

- Ctrl-wheel PDF viewportunda `defaultPrevented` olur ve 300% -> 320% zoom
  uygular.
- Normal wheel ile viewer disindaki Ctrl-wheel eventleri engellenmez.
- Imlec altindaki belge koordinatinin zoom sonrasi sapmasi 20 PDF pikselinin
  altinda kalir.
- Fit Width resize ile yeniden olceklenir; sonrasindaki manual zoom `custom`
  moda gecer ve daha sonraki resize olcegi degistirmez.

Calistirilan kontroller:

- `npx tsc --noEmit` - basarili
- `npx playwright test --config=playwright.config.ts tests/document-studio/stage1.spec.ts -g "Ctrl-wheel zoom"` - basarili
- `npm run check:document-studio:e2e` - basarili (3/3)
- `npm run build` - basarili

Asama 3 icin ek bir bilinen risk kalmadi.
