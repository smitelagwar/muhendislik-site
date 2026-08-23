# CAD Upstream Migration — Aşama 6 Gerçek DWG Corpus Kabulü

Tarih: 23 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

## Amaç

Gerçek mühendislik DWG dosyalarında upstream MLightCAD/LibreDWG hattını ölçmek; proven regression çıkarsa önce upstream sürüm/config/plugin/issue/PR yolunu kullanmak ve custom CAD parser/renderer yazmadan çözmek.

Bu aşama **henüz tamamlanmış sayılmaz**. Parser corpus kapısı geçmiştir; gerçek browser render kabulü ayrıca tamamlanmalıdır.

## Gizlilik

Gerçek proje DWG dosyaları public GitHub repository'sine yüklenmez. Corpus dosyaları yalnız private Library/Drive ve izole test çalışma alanında tutulur. Public kayıtta yalnız anonim corpus kimliği, boyut ve teknik sonuç bulunur.

## Golden corpus

SHA-256 ile duplicate elemesi sonrası **13 benzersiz gerçek DWG** kullanıldı. Corpus yaklaşık `0.47 MB`–`21.2 MB` aralığındadır ve statik, mimari, elektrik, kalıp/iskele, döşeme ve kiriş çizimlerini kapsar.

Anonim corpus kimlikleri SHA-256 prefix'idir:

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

Tüm 13 dosya site upstream terminal deadline'ı olan `35 s` altında parse edilmiştir.

## Kanıtlanmış regression ve çözümü

İlk production pinleri:

- `@mlightcad/cad-simple-viewer 1.6.0`
- `@mlightcad/data-model 1.13.0`
- `@mlightcad/libredwg-converter 3.13.0`

ile corpusun `12/13` dosyası terminal oldu. `12c07eb244e0` kimlikli yaklaşık 3 MB fixture `40 s` sınırında tamamlanmadı. Aynı eski parser yaklaşık 21.2 MB başka bir fixture'ı yaklaşık 24.3 s'de açabildi; dolayısıyla sorun salt dosya boyutu değildir.

Planın çözüm sırasına uyularak custom parser yazılmadı. Upstream güncel paketleri araştırıldı ve ayrı artifact ile A/B test edildi.

Corpus-doğrulanmış yeni exact set:

- `@mlightcad/cad-simple-viewer 1.6.2`
- `@mlightcad/data-model 1.14.2`
- `@mlightcad/libredwg-converter 3.14.2`
- transitive `@mlightcad/libredwg-web 0.7.10`

GitHub Actions `CAD upstream Stage 6 latest parser probe` exact `libredwg-converter 3.14.2` worker + WASM artifact'ını public npm paketinden üretir; private DWG CI'ya yüklenmez. Failing fixture yalnız private test ortamında bu artifact ile çalıştırıldı ve yaklaşık `3.2–3.5 s` içinde `unknownEntityCount=0` ile PASS verdi.

Ardından aynı güncel parser 13 benzersiz fixture'ın tamamında bağımsız terminal sınırlarıyla çalıştırıldı: **13/13 PASS**.

## Sürüm yükseltme politikası

Aşama 3'ün ilk pinleri tarihsel kabul kaydıdır. Aşama 6 real-corpus kanıtı yeni exact seti supersede eder. Root package ve lock bu corpus-doğrulanmış sürümlere sabitlenir; `latest` kullanılmaz.

## Parser kabulü

PASS:

- 13 benzersiz gerçek DWG,
- small/medium/large dağılım,
- bütün fixture'lar 35 s altında,
- bütün fixture'larda `unknownEntityCount=0`,
- eski parser timeout regression'ı güncel upstream ile çözüldü,
- private DWG public repo/CI artifact'ına konmadı,
- custom DWG parser veya yeni CAD subsystem yazılmadı.

## Render kabulü — açık kapı

Aşama 6'nın parser sonucu tek başına görsel fidelity kanıtı değildir. Cutover öncesinde gerçek browser üzerinde en az representative corpus ile şu davranışlar doğrulanmalıdır:

- first render,
- zoom,
- pan,
- fit,
- upstream layer manager,
- source colors,
- black/white view mode,
- lineweight,
- linetype,
- wide polyline,
- TEXT / MTEXT,
- BLOCK / INSERT,
- DIMENSION,
- HATCH,
- terminal error/fallback davranışı.

Yerel headless Chromium bu çalışma ortamında localhost ve `file://` navigasyonunu yönetim politikasıyla engellediğinden bu kontrol sahte PASS olarak yazılmaz. Vercel Preview/browser kabulü ayrıca gözlenmelidir.

## Aşama 6 kabul kapısı

Aşama 7'ye geçmek için:

1. corpus-doğrulanmış exact upstream package + lock branch'te kalıcı olmalı,
2. upstream worker/WASM asset sync PASS olmalı,
3. Stage 5 runtime gate PASS olmalı,
4. site-wide typecheck PASS olmalı,
5. production `next build` PASS olmalı,
6. 13/13 parser corpus PASS olmalı,
7. representative real DWG browser render matrisi kabul seviyesinde PASS olmalı,
8. kanıtlanmamış fidelity için custom CAD parser/renderer eklenmemiş olmalı.

Bu kriterlerin 7. maddesi tamamlanmadan Aşama 6 **tamamlandı** sayılmaz.
