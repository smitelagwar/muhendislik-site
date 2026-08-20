# DWG/DXF Baslangic Viewer - Asama 2 DXF Raporu

Tarih: 20.08.2026

## Uygulanan degisiklik

- `dxf-viewer@1.0.48` MPL-2.0 lisansi ile eklendi. `DokCadViewer`, `.dxf`
  icin istemci-tarafli ve lazy-loaded DXF renderer'i baslatir; PDF kullanicisi
  CAD paketini ilk yuklemede almaz.
- Yetkili `accessUrl` once `fetch` ile metin olarak okunur. HTTP hatasi ve bos
  dosya kontrollu hata ekranina duser; parser'a sadece gecici object URL verilir
  ve yukleme/route temizliginde iptal edilir veya serbest birakilir.
- `dxf-viewer-worker.ts`, parse ve geometri-hazirlama adimini web worker'a
  tasir. Renderer `Destroy()` ile worker, WebGL kaynaklari, ResizeObserver ve
  event listener'larini route degisiminde temizler.
- DXF viewport `min-h-0`, `min-w-0` ve `overflow-hidden` sinirindadir;
  kütüphanenin `autoResize` secenegi parent boyutunu izler. Ilk yuklemede,
  Sığdır ve Sıfırla eylemlerinde cizim bounds'una fit uygulanir. Kütüphanenin
  yerlesik OrbitControls'u mouse-wheel zoom ve surukleyerek pan davranisini
  saglar.
- Hata ekrani dosya adi, boyut, `fetch`/`parse` sebebi, Tekrar dene ve
  Dosyayı indir eylemlerini verir. DWG yolu degistirilmedi: lisans karari
  bekleyen kontrollu indirme fallback'i devam eder.

## Kabul dogrulamasi

- Playwright DXF smoke testi; kucuk cizim, proje-benzeri cizim ve 750 hucreli
  buyuk/karma cizimi worker ile acarak canvas mount, wheel zoom, drag-pan ve
  fit eylemini denetler.
- Ayni test, bu makinedeki `1_kisim_tum_kalip_planlari_LAYERLI_NIHAI.dxf`
  (8.4 MB) gercek proje dosyasini mevcut yerel/private stream akisi uzerinden
  basariyla acmistir.
- Bozuk DXF testinde uncontrolled exception yerine kontrollu hata fallback'i
  gorunur.

## Kapsam notu

Bu asama yalnizca DXF referans implementasyonudur. DWG WASM decoder'i,
lisans onayi olmadan eklenmeyecek ve Asama 3'e aktarilmistir.
