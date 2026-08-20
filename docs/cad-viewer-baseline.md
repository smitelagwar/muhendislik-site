# DWG/DXF Baslangic Viewer - Asama 1 Baseline

Tarih: 20.08.2026

## Mevcut akis ve acilmama kaniti

- `src/lib/dokumantasyon/preview-capabilities.ts`, `.dwg` uzantisini
  `application/acad`, `.dxf` uzantisini `application/dxf` MIME tipiyle `cad`
  preview turune esler. Her ikisi de yonetici icin onizlenebilir, public
  paylasimda ise kapali ve 100 MB sinirindadir.
- `src/components/dokumantasyon/studio/document-studio-shell.tsx`, `cad`
  turunu `DokCadViewer` bileşenine yonlendirir ve kisa omurlu `accessUrl`
  degerini verir. `src/lib/dokumantasyon/file-access.ts` yerelde stream URL'si,
  production'da Private Blob signed GET URL'si olusturur. Dolayisiyla sorun
  uzanti eslemesi, MIME kaydi veya signed-Blob erisimi degildir.
- `src/components/dokumantasyon/preview/cad-viewer.tsx` bu `accessUrl` ile
  dosyayi okumaz. Yalnizca `/api/dokumantasyon/files/:id/cad` endpoint'inden
  APS durumunu ister; endpoint de
  `src/lib/dokumantasyon/cad-aps.ts` icindeki APS anahtar/koken durumunu
  doner. APS yapilandirilmadiginda ekranda indirme karti gorunur. Hazir
  durumda dahi ekranda yalnizca "Autodesk APS Model Goruntuleyici Yukleniyor"
  metni vardir; bir APS viewer baslatma, DXF parser, DWG parser, WebGL canvas
  veya WASM yukleyici yoktur.
- Yukleme katmani her iki formati da magic-byte ile kontrol eder:
  `AC10xx` DWG basligi ve `SECTION`/binary-DXF isareti. Bu kontrol
  `src/lib/dokumantasyon/file-validation.ts` ile finalize akisinda uygulanir.

Sonuc: gecerli ve yetkili bir DWG/DXF dosyasi bugun secilebilir ve indirilebilir,
fakat tarayici icinde gercek olarak render edilemez. Asama 1 kabulunun aranan
acilmama kaniti budur.

## Secilen sinir ve teknoloji karari

Hedef sinir, mevcut erisim akisini koruyarak asagidaki gibidir:

```text
DocumentStudioShell
  -> CadViewerShell
       -> CadFileLoader
            -> DxfLoader (DXF -> CadDocument)
            -> DwgWasmWorkerAdapter (DWG -> CadDocument)
       -> CAD viewport (WebGL, pan/zoom/fit)
```

- **DXF yolu secildi:** `dxf-viewer` (sabitlenecek surum: `1.0.48`) DXF'i
  tarayicida WebGL/three.js ile cizer; dosya alma, parse ve render-hazirlama
  adimlarini web worker'a tasimaya uygun yardimcilar sunar. Lisansi MPL-2.0'dir.
  Kaynaklar: [proje README'si](https://github.com/vagran/dxf-viewer) ve
  [package manifesti](https://github.com/vagran/dxf-viewer/blob/master/package.json).
- **DWG yolu secildi:** `CadFileLoader` arkasinda tarayici-yerel,
  worker-yalitimli bir `DwgWasmWorkerAdapter`. Bu adaptore ancak ticari,
  permissive veya kurum tarafindan yazili olarak onaylanmis bir decoder
  baglanabilir. Bu repoda GPL/AGPL uyumlulugu veya kaynak-yayinlama taahhudu
  bulunmadigindan Asama 1'de DWG icin uretim paketi kurulmayacaktir.
- `@mlightcad/libredwg-web` / LibreDWG GPL-3.0 tabanlidir; sadece lisans
  incelemesi icin adaydir, uretim bagimliligi olarak secilmemistir.
  [LibreDWG lisans beyanı](https://github.com/mlightcad/libredwg-web/blob/master/AGENTS.md).
- `@flyfish-dev/cad-viewer` DWG/DXF icin birlesik secenek olsa da
  AGPL-3.0-only oldugunu belirtir ve varsayilan DWG loader'inda LibreDWG WASM
  kullanir. Bu nedenle bu asamada uretim bagimliligi olarak reddedilmistir.
  [lisans ve runtime-varlik notu](https://github.com/flyfish-dev/cad-viewer/blob/main/README.md).

Bu karar hukuki tavsiye degildir. Asama 3'e gecmeden once DWG decoder'i icin
ticari/permissive lisans saglanmali veya GPL/AGPL yukumlulukleri proje sahibi
tarafindan yazili olarak kabul edilmelidir.

## Asama 2-3 icin hedeflenen degisiklik siniri

- `src/components/dokumantasyon/preview/cad-viewer.tsx`: APS durum karti
  yerine istemci tarafli `CadViewerShell` entegrasyonu.
- Yeni, dar kapsamli CAD dosyalari: loader arayuzu, DXF loader ve DWG worker
  adaptoru. Mevcut `DocumentStudioShell`, access lease ve Blob imzalama
  katmani korunur.
- Uygunsa runtime WASM/worker varliklari `public/cad-wasm/` altinda mutlak URL
  ile sunulur; ancak lisans karari olmadan bu asamada varlik veya paket eklenmez.
- CAD odakli birim ve Playwright testleri eklenecektir. Olcum, secim,
  annotasyon, server-side donusum ve public CAD preview kapsam disidir.

## Vercel, WASM ve worker riskleri

- Next SSR sirasinda browser/WASM API'leri calistirilamaz; viewer dinamik,
  istemci-yalitimli yuklenmelidir.
- Worker ve `.wasm` varliklari `public` altinda mutlak URL ile sunulmali;
  Vercel uzerinde `application/wasm` MIME ve Worker yuklemesi Preview ile
  Production'da smoke test edilmelidir.
- Private Blob signed URL'si cross-origin fetch ile okunacagi icin CORS,
  URL sona-erme ve hata/yenileme akisi CAD loader tarafinda kontrol edilmelidir.
- Buyuk cizimlerde ana is parcacigini bloke etmemek, worker sonlandirma ve
  WebGL kaynaklarini unmount'ta serbest birakmak zorunludur.

## Asama 1 dogrulama kaydi

- `npm run check:dokumantasyon:stage2`: basarili. DWG/DXF capability,
  magic-byte ve signed-stream veri duzlemi kontrolleri gecti.
- `npx tsc --noEmit`: basarili.
- Bu asamada uretim kodu, paket, WASM/worker varligi veya route davranisi
  degistirilmedi.
