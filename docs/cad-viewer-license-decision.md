# CAD Viewer DWG Lisans Kararı

Tarih: 20.08.2026

## Karar

Bu repoda GPL-3.0 veya AGPL-3.0 uyumlulugunu kabul eden bir lisans politikasi,
kaynak-yayinlama taahhudu ya da ticari DWG decoder lisansi bulunmamaktadir.
Bu nedenle asagidaki paketler production dependency olarak **onaylanmamistir**:

- `@mlightcad/libredwg-web` / LibreDWG: GPL-3.0.
- `@flyfish-dev/cad-viewer`: AGPL-3.0-only; varsayilan DWG yolu LibreDWG
  WebAssembly kullanir.

Asama 3, iki gercek DWG dosyasini acma kabul kriterini bu karari ihlal etmeden
yerine getiremez. Uretim koduna GPL/AGPL paketi, WASM varligi veya worker'i
eklenmemistir.

## Devam kosulu

Asama 3'e devam etmek icin proje sahibi asagidakilerden birini yazili olarak
secerek onaylamalidir:

1. GPL-3.0/AGPL-3.0 yukumluluklerini kabul edip secilen paketin kaynak ve
   bildirim kosullarini yerine getirmek.
2. Kullanilacak ticari veya permissive lisansli browser-side DWG decoder'ini
   ve lisansini saglamak.

Bu belge hukuki tavsiye degildir.

## CodeCAD PoC lisans ve dagitim karari (20.08.2026)

`backkem/codecad` kaynak reposu MIT lisanslidir. Ancak DWG okuma yolu
`cadview-core -> acadrust 0.3.4` bagimliligini kullanir; `acadrust` MPL-2.0
lisanslidir. Bu GPL/AGPL degildir, fakat permissive lisans da degildir. Bu
nedenle, proje sahibinin sadece permissive DWG cozumleri sinirina uymaz.

CodeCAD ayri surumlenmis bir browser parser/render SDK'si dagitmaz: WASM
embed ciktisi kaynakta `wasm-bindgen-cli`, Rust, `pnpm` ve `just` ile uretilir.
Yayindaki embed paketi tek bir monolitik viewer'dir (`cadview-web_bg.wasm`:
yaklasik 23.5 MB); parser, renderer, oturum/CRDT ve editor katmanlarini
birlikte tasir. Bu repo icin minimum, tekrarlanabilir Next.js/Vercel
entegrasyonu olarak kabul edilmemistir.

Dolayisiyla CodeCAD PoC'u ve Aşama 3 kabul testi durduruldu. Uretim koduna,
NPM bagimliligina, WASM varligina veya worker'a CodeCAD ya da GPL/AGPL DWG
cozumu eklenmedi. PDF ve mevcut DXF akisi degismedi.

### Sonraki secenekler

1. ODA Drawings inWEB: ticari SDK ile browser-icinde DWG, 2D/3D goruntuleme,
   zoom/pan sunar; uygun ODA lisansi ve SDK teslimi gerekir.
2. Autodesk APS: DWG'yi sunucu tarafli upload/translation ile Viewer'a uygun
   SVF/SVF2 turevine cevirir; APS kimlik bilgileri, backend is akisi ve servis
   maliyeti gerektirir.
3. Browser-icinde, tum DWG zinciri permissive bir OSS secenegi bu incelemede
   dogrulanmadi. En mantikli sonraki yol, gizlilik ve browser-local gereksinimi
   korunacaksa ODA Drawings inWEB lisans degerlendirmesidir; bulut donusumu
   kabul edilecekse Autodesk APS ikinci secenektir.

## APS onayi ve Aşama 3 uygulamasi (20.08.2026)

Proje sahibi Autodesk APS tabanli server-side DWG donusumunu onayladi; ODA,
CodeCAD ve GPL/AGPL tabanli bir decoder production yolunda kullanilmiyor.
Akis `Private DWG -> uygulama backend'i -> APS OSS + Model Derivative -> APS
Viewer -> CadViewerShell` seklindedir.

- Yalnizca server-side ortam degiskenleri kullanilir:
  `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `APS_BUCKET_KEY` ve opsiyonel
  `APS_BUCKET_POLICY`. Client secret ve internal token DB'ye yazilmaz.
- `dok_cad_derivatives`, kaynak Blob surum anahtari/hash'i ile APS URN, object
  key ve gercek `pending/uploading/translating/ready/failed` durumunu iliskiler.
  Ayni surum tekrar upload/translate edilmez; atomic durum claim'i eszamanli
  job baslatmayi engeller. Silme veya yeni binary surumu kayitlari gecersiz
  kilir.
- Bu ortamda APS credentials tanimli degildir. Bu nedenle gercek DWG upload,
  APS translation, Viewer rendering ve Vercel Preview smoke kanitlanamadi;
  Aşama 3 kabul kapisi henuz gecilmemistir.
- APS-disindaki Preview smoke tamamlandi:
  `muhendislik-site-qp4fo0xyx-huseying5713-2819s-projects.vercel.app` Ready;
  kok ve `/dokumantasyon` rotalari 200, oturumsuz CAD endpoint'i 401 dondu.
  TypeScript/build, Document Studio E2E ve APS adaptorunun durum, dedupe,
  concurrency, token ve lifecycle kontrolleri basarilidir. Gercek DWG dosyalari
  mevcut olsa da APS kimlik bilgileri olmadigi icin gercek upload/translation/
  viewer testi baslatilmadi ve sahte basari uretilmedi.
