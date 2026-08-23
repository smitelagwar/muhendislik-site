# Third-Party Notices — CAD Browser Runtime

Bu dosya, `muhendislik-site` içinde tarayıcıda dağıtılan CAD bileşenlerinin lisans ve kaynak referanslarını kaydeder. Hukuki görüş değildir; release artifact'ındaki üçüncü taraf bileşenlerin izlenebilirliğini sağlar.

## MLightCAD viewer / data model

- `@mlightcad/cad-simple-viewer` — `1.6.2`
- `@mlightcad/data-model` — `1.14.2`
- Upstream: `https://github.com/mlightcad/cad-viewer`
- Lisans: MIT

Bu paketler site içindeki upstream CAD viewer/host katmanını sağlar.

## LibreDWG browser DWG parser

- `@mlightcad/libredwg-converter` — `3.14.2`
- `@mlightcad/libredwg-web` — `0.7.10`
- Paket lisansı: GPL-3.0
- Upstream kaynak deposu: `https://github.com/mlightcad/realdwg-web`
- Bu release ile eşleştirilen upstream kaynak commit'i: `e3198a391b5c8599a94f1f1da285426443371451`
- Kaynak snapshot: `https://github.com/mlightcad/realdwg-web/tree/e3198a391b5c8599a94f1f1da285426443371451`
- GPL-3.0 lisans metni: `https://www.gnu.org/licenses/gpl-3.0.html`

Tarayıcıya dağıtılan GPL kapsamındaki DWG runtime asset'ları:

- `/cad-upstream/libredwg-parser-worker.js`
- `/cad-upstream/libredwg-web.wasm`
- `/cad-upstream/GPL-NOTICE.txt`

`GPL-NOTICE.txt` build öncesinde `scripts/sync-cad-upstream-assets.mjs` tarafından yukarıdaki exact sürüm ve corresponding-source referanslarıyla üretilir.

## Dağıtım sınırı

LibreDWG tabanlı DWG worker ana uygulama renderer kodundan ayrı Worker/WASM asset'ı olarak servis edilir. Bu ayrım lisans yükümlülüklerini ortadan kaldırmaz; bu notice yalnız dağıtılan bileşenleri, exact sürümleri ve karşılık gelen upstream kaynak referansını görünür kılar.
