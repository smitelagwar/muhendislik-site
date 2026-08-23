# CAD Upstream Migration — Aşama 6 Gerçek DWG Fidelity Kabulü

Tarih: 23 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

Durum: **TAMAMLANDI / PASS**

## Amaç

Gerçek mühendislik DWG dosyalarında upstream MLightCAD/LibreDWG hattını ölçmek; kanıtlanmış regression çıkarsa önce upstream sürüm/config/plugin/issue/PR yolunu kullanmak ve custom CAD parser/renderer yazmadan çözmek.

## Gizlilik

Gerçek proje DWG dosyaları public GitHub repository'sine veya CI artifact'larına yüklenmedi. Private corpus yalnız bağlı Library/Drive ve izole test çalışma alanında tutuldu. Public kayıtta yalnız anonim SHA-256 prefix, boyut ve teknik sonuç bulunur.

## Private golden corpus — 13/13 PASS

SHA-256 duplicate elemesi sonrası **13 benzersiz gerçek DWG** kullanıldı. Corpus yaklaşık `0.47 MB`–`21.2 MB` aralığındadır ve statik, mimari, elektrik, kalıp/iskele, döşeme ve kiriş çizimlerini kapsar.

| ID | Boyut (byte) | Güncel parser sonucu | Süre |
|---|---:|---|---:|
| `2d543a2b6369` | 21,213,015 | PASS, unknown=0 | 22.515 s |
| `0f37c9d18ec7` | 13,727,908 | PASS, unknown=0 | 16.274 s |
| `12c07eb244e0` | 3,032,220 | PASS, unknown=0 | 3.2–3.5 s |
| `b7861ad1bd04` | 1,310,331 | PASS, unknown=0 | 1.667 s |
| `4ae2087cc7c0` | 4,532,584 | PASS, unknown=0 | 4.557 s |
| `616fd6bca471` | 11,011,761 | PASS, unknown=0 | 10.975 s |
| `2cdaf77d21a4` | 6,255,546 | PASS, unknown=0 | 5.578 s |
| `988fb4867de5` | 2,057,097 | PASS, unknown=0 | 1.978 s |
| `6a0e58fb6b05` | 9,149,880 | PASS, unknown=0 | 5.743 s |
| `7cfddd3df3a3` | 8,479,790 | PASS, unknown=0 | 5.017 s |
| `3609bb4b6a28` | 470,897 | PASS, unknown=0 | 0.888 s |
| `5a2c5b67856e` | 2,120,170 | PASS, unknown=0 | 2.277 s |
| `752493fd89ab` | 4,424,553 | PASS, unknown=0 | 2.889 s |

Tüm 13 dosya production upstream terminal deadline'ı olan `35 s` altında parse edildi ve `unknownEntityCount=0` verdi.

Corpus; TEXT/MTEXT, DIMENSION, BLOCK/INSERT, HATCH, polyline/arc/circle/line ve mühendislik paftalarında yüksek entity yoğunluğunu gerçek dosyalar üzerinden içerir. Bu parser kanıtı tek başına piksel-perfect görsel oracle olarak yorumlanmaz.

## Kanıtlanmış parser regression'ı ve upstream çözümü

İlk pinler:

- `@mlightcad/cad-simple-viewer 1.6.0`
- `@mlightcad/data-model 1.13.0`
- `@mlightcad/libredwg-converter 3.13.0`

ile corpus `12/13` terminal oldu. `12c07eb244e0` yaklaşık 3 MB olmasına rağmen 40 s sınırında tamamlanmadı; aynı eski parser 21.2 MB başka bir dosyayı yaklaşık 24.3 s'de açabildi. Sorun dosya boyutuna indirgenmedi.

Custom parser yazılmadı. Güncel upstream ayrı A/B test edildi ve regression upstream sürüm yükseltmesiyle çözüldü.

Corpus-doğrulanmış exact production seti:

- `@mlightcad/cad-simple-viewer 1.6.2`
- `@mlightcad/data-model 1.14.2`
- `@mlightcad/libredwg-converter 3.14.2`
- transitive `@mlightcad/libredwg-web 0.7.10`

Failing fixture güncel worker/WASM ile yaklaşık `3.2–3.5 s` içinde PASS verdi. Ardından tüm private corpus bağımsız deadline'larla tekrar çalıştırıldı: **13/13 PASS**.

## Gerçek Chromium render matrisi — PASS

Workflow: `CAD upstream Stage 6 Chromium render probe`

Kabul run'ı: `32668143921`

Job: `97264711022`

Artifact: `cad-upstream-stage6-public-render`, ID `9500636533`

Artifact SHA-256: `3ed19abe9da06c655e8739b757ec0f0a8370f2e7a72baffb48659145d9b81483`

Exact `@mlightcad/cad-simple-viewer-cli@1.6.2` ile gerçek Chromium'da beş public upstream DWG render edildi:

| Fixture | Sonuç | PNG |
|---|---|---:|
| `baseline-sample.dwg` | PASS | 1951×2048 |
| `canteen.dwg` | PASS | 2048×1235 |
| `lockers.dwg` | PASS | 2048×1107 |
| `map-of-uae.dwg` | PASS | 2048×1532 |
| `patient-chairs.dwg` | PASS | 2048×1384 |

`canteen.dwg` kaynak-renk piksel kontrolü PASS verdi; aynı dosyadan yaklaşık 10.96 MB offline HTML üretimi de PASS verdi.

Aynı gerçek DWG browser oturumunda aşağıdaki davranışlar screenshot hash farkıyla doğrulandı:

- first render / fit: PASS,
- gerçek mouse drag ile native PAN: PASS,
- native ZOOM Scale `2x`: PASS,
- native `-LAYER OFF *`: PASS,
- native `-LAYER ON *`: PASS,
- native `LWDISPLAY 0 → 1`: PASS ve gerçek görsel fark oluştu.

Bu test upstream renderer, layer mekanizması ve lineweight yolunu custom geometry kodu olmadan doğrular.

## Kanıtlanmış fidelity entegrasyon açığı

Upstream kaynak-renk, layer ve lineweight davranışlarını sağlıyor; fakat production host için hazır bir `Gerçek Renk / Siyah-Beyaz` seçici bulunmuyordu.

Bu açık geniş bir custom renderer ile kapatılmadı. Adapter yalnız upstream public view/renderer yüzeyini kullanır:

- `manager.curView`,
- `renderer.domElement`,
- `renderer.clearAlpha`,
- `view.isDirty`.

`Siyah-Beyaz` görünüm CAD database/entity renklerini değiştirmez. Yalnız WebGL canvas görüntü katmanına grayscale/black-or-white display filtresi uygular; dark/light temada çizgi kontrastı korunur. `Gerçek Renk` seçildiğinde upstream görüntüsü geri yüklenir.

Lineweight kontrolü ayrıca özel renderer yazmaz; `AcDbSysVarManager` üzerinden upstream `LWDISPLAY` değişkenini kullanır. Upstream kendi `clear + regen` mekanizmasıyla sahneyi yeniden üretir.

Stage 6 static contract gate şu anti-fork koşullarını zorunlu tutar:

- exact upstream sürümler,
- public renderer/view API kullanımı,
- `LWDISPLAY` native yolu,
- `Gerçek Renk / Siyah-Beyaz / Lineweight` host kontrolleri,
- adapter içinde `dxf-viewer`, DWG worker conversion hot-path veya private `_scene` erişimi olmaması,
- Stage 5 Fast → Upstream → Current → APS sırasının korunması.

## Build ve runtime regresyon kapısı

Fidelity kontrolleri eklendikten sonraki Stage 5 runtime gate:

- run `32668358408`,
- job `97265240798`,
- exact root lock install: PASS,
- upstream worker asset sync: PASS,
- Stage 3 adapter contract: PASS,
- Stage 5 orchestration contract: PASS,
- targeted ESLint: PASS,
- site-wide TypeScript: PASS,
- production `next build`: PASS,
- production selector + rollback engines: PASS.

Terminal error/fallback davranışı Stage 5'in bounded orchestration kapısında korunmuştur; Aşama 6 fidelity katmanı fallback sırasını değiştirmez.

## Dürüst fidelity sınırı

Private mühendislik corpusunda parser/entity kapsamı gerçek dosyalarla doğrulandı; public gerçek DWG browser matrisi renderer ve temel etkileşimleri doğruladı. Her bir TEXT/MTEXT/BLOCK/INSERT/DIMENSION/HATCH/linetype/wide-polyline öğesi için ayrı piksel-perfect referans oracle oluşturulmadı. Bu nedenle bu alt özellikler için “AutoCAD ile piksel birebir eşleşme kanıtlandı” iddiası yapılmaz.

Aşama 6 kabulü; gerçek corpus parser kapsamı + gerçek Chromium full-drawing render matrisi + upstream-native interaction kontrolleri + bounded fallback/build kapılarının birleşimine dayanır.

## Aşama 6 kabul kapısı

1. corpus-doğrulanmış exact upstream package + lock: **PASS**,
2. upstream worker/WASM asset sync: **PASS**,
3. Stage 5 runtime gate: **PASS**,
4. site-wide typecheck: **PASS**,
5. production `next build`: **PASS**,
6. 13/13 private parser corpus: **PASS**,
7. representative real DWG Chromium render matrisi: **PASS**,
8. kanıtlanmamış fidelity için custom CAD parser/renderer eklenmemesi: **PASS**.

**Aşama 6 tamamlandı. Aşama 7'ye geçilebilir.**
