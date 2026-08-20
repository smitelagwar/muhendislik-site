# PDF Viewer + Paylasim Sistemi - Asama 4 Raporu

Tarih: 20 Agustos 2026

## Degistirilen dosyalar

- `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx`
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`
- `src/components/dokumantasyon/preview/pdf-viewer.tsx`
- `src/components/dokumantasyon/studio/document-studio-shell.tsx`
- `tests/document-studio/stage1.spec.ts`

## Uygulanan dayaniklilik iyilestirmeleri

- Canvas backing-store DPI degeri 2.5 ile sinirli kalir; ek olarak sayfa basina
  en fazla 16 milyon canvas pikseli uretilir. Mantiksal PDF boyutu degismez,
  yalnizca asiri DPR kombinasyonlarinda backing-store olcegi dusurulur.
- Her render effect'i kendi PDF.js render task'ini iptal eder. Eski task'in
  cleanup'i yeni task'i iptal edemez; beklenen cancellation hata olarak
  kullaniciya yansitilmaz.
- PDF link annotation'lari, canvas ile ayni `viewport` donusumuyle link
  hitbox'larina cevrilir. Fit ve 90 derece rotation sonrasi alanlar ayni
  geometriyi izler.
- Hand tool mouse eventlerinden Pointer Events'e tasindi. Pointer capture,
  move, up ve cancel akislari yatay/dikey pan icin tek akista yonetilir;
  hand modunda dokunmatik browser panning'i devre disidir.
- Admin signed access URL'si 401/403 ile reddedilirse PDF viewer bir kez yeni
  access lease ister. Parallel refresh istekleri tek promise ile birlestirilir;
  yenileme basarisizsa kontrollu PDF hata durumu gorunur. Signed URL kalici
  istemci depolamasina yazilmaz.
- Yukleme durumu, normal PDF yuklemesi ile access URL yenilemesini ayri metinle
  bildirir.

## Dogrulama

- `npx tsc --noEmit` - basarili
- `npm run check:document-studio:e2e` - basarili (3/3)
- `npm run build` - basarili

E2E, 320% zoomda canvas backing pixel alaninin 16 milyon sinirinin altinda
kaldigini ve PDF text katmaninin secilebilir oldugunu da dogrular.

## Kalan dis dogrulama

Gercek Private Blob URL TTL sonu senaryosu, Vercel uzerinde oturumlu bir PDF
ile 401/403 uretmeyi gerektirir. Kod yolu kontrollu tek-retry semantigiyle
uygulandi; canli expiry smoke, admin browser oturumu kullanilabilir oldugunda
ayrica calistirilmalidir.
