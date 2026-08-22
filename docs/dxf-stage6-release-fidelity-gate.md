# DXF Stage 6 — Release / Fidelity Gate

Bu aşamanın amacı yeni DXF özelliği eklemek değil; Stage 1–5 boyunca elde edilen doğruluk garantilerini release edilebilir, tekrar çalıştırılabilir ve fail-closed bir kabul sistemine dönüştürmektir.

## 1. Release prensibi

Bir DXF yalnız şu üç durumdan biriyle sınıflandırılır:

- `clean`: bilinen renderer fidelity riski yok; viewer `ready` olabilir.
- `warning`: ana geometri render edilebilir ancak tipografi, linetype, width, layer/layout gibi belgelenmiş bir fidelity farkı vardır; kullanıcıya diagnostics gösterilir.
- `blocked`: mevcut engine'in eksik veya yanlış çizeceği doğrulanmış bir yapı vardır; viewer başarı durumu vermez ve orijinal dosya indirme yolu gösterilir.

`Dosya parse edildi` veya `canvas oluştu` tek başına release başarısı değildir.

## 2. Canonical fixture matrisi

| Fixture | Beklenen durum | Ana kanıt |
| --- | --- | --- |
| `geometry-basic.dxf` | clean | temel desteklenen geometri |
| `stage3-text-mtext.dxf` | warning | SHX/text fallback + MTEXT fraction görünürlüğü |
| `stage4-geometry-layers.dxf` | warning | off/frozen layer, non-continuous linetype, width, paper-space ayrımı |
| `stage2-block-transforms.dxf` | blocked | grid/array INSERT / block reliability sınırı |
| `stage2-ocs-insert.dxf` | blocked | INSERT OCS/extrusion |
| `stage3-dimensions.dxf` | blocked | hazır block'suz unsupported veya malformed dimension |
| `stage4-risky-geometry.dxf` | blocked | unsafe SPLINE / HATCH yolları |

Bu matris `scripts/check-dxf-stage6-release.ts` tarafından otomatik doğrulanır. Her fixture'ın statüsü veya teşhis kategorisi istemeden değişirse release gate başarısız olur.

## 3. Browser-level kabul

`tests/document-studio/dxf-release.spec.ts` gerçek uygulama akışını kullanır:

1. `/dokumantasyon` admin oturumu açılır.
2. `DOK_ALLOW_LOCAL_STORAGE=true` test ortamında gerçek local upload endpoint'i kullanılır.
3. DXF fixture gerçek dosya kaydı olarak yüklenir.
4. `/dokumantasyon/dosya/<id>` açılır.
5. Render edilebilir fixture için:
   - `cad-dxf-viewer` görünür olmalı,
   - WebGL canvas gerçek piksel boyutuna sahip olmalı,
   - error overlay görünmemeli,
   - clean/warning diagnostics doğru statü vermeli,
   - warning panelinde blocking item bulunmamalı.
6. Blocking fixture için:
   - `DXF açılamadı` görünmeli,
   - diagnostics panel otomatik görünmeli,
   - en az bir `data-severity="blocking"` item bulunmalı,
   - ilgili Ölçü / Geometri / Renderer kanıtı görünmeli,
   - `Orijinal dosyayı indir` aksiyonu korunmalı.
7. 390×844 mobil viewport'ta page-level horizontal overflow olmamalı.
8. Chromium koşusunda görsel kanıt screenshot'ları Playwright report artifact'ına eklenir.

Bu test render motorunu mock'lamaz; uygulamanın gerçek `dxf-viewer` + worker + upload + dosya sayfası zincirini kullanır.

## 4. CI release gate

`.github/workflows/dxf-fidelity-release.yml` yalnız DXF fidelity alanını etkileyen değişikliklerde çalışır.

Sıra:

```bash
node scripts/check-dxf-stage1-fidelity.mjs
npx tsx scripts/check-dxf-stage2-hardening.ts
npx tsx scripts/check-dxf-stage3-fidelity.ts
npx tsx scripts/check-dxf-stage4-fidelity.ts
npx tsx scripts/check-dxf-stage5-diagnostics.ts
npx tsx scripts/check-dxf-stage6-release.ts
npx playwright install --with-deps chromium
npx playwright test --config=playwright.config.ts tests/document-studio/dxf-release.spec.ts --project=chromium
```

Playwright raporu ve `test-results` klasörü `dxf-playwright-report` artifact'ı olarak 14 gün saklanır.

## 5. Stage 3 release cleanup

Stage 6 öncesi iki yanlış pozitif kapatıldı:

### BLOCK içindeki DIMENSION

Dimension fidelity gate yalnız top-level `ENTITIES` bölümündeki DIMENSION kayıtlarını sayar. BLOCK içindeki dimension kayıtları block implementasyon detayı olarak kalır ve ayrıca model-space ölçüsüymüş gibi ikinci kez gate edilmez.

TEXT/MTEXT/ATTRIB/ATTDEF audit'i BLOCKS içinde devam eder; çünkü block içindeki görünür metin halen fidelity açısından önemlidir.

### Escaped MTEXT `\\S`

Gerçek MTEXT stacked fraction kontrolü olan `\S...;` normalize edilir. Literal/escaped `\\S...;` dizisi artık yanlışlıkla stacked fraction kabul edilmez ve kaynak görünür metni değiştirilmez.

## 6. Gerçek mühendislik DXF corpus standardı

Fixture'lar sentetik minimum testlerdir. Release güvenini artırmak için gerçek proje dosyaları eklenirken aşağıdaki sınıflar ayrı corpus öğeleri olmalıdır:

- betonarme kalıp planı,
- kolon/perde aplikasyonu,
- kiriş açılımı,
- mimari kat planı,
- vaziyet / aplikasyon / büyük koordinatlı survey dosyası,
- yoğun TEXT/MTEXT/DIMENSION dosyası,
- nested BLOCK/INSERT ağırlıklı dosya,
- HATCH ağırlıklı mimari detay,
- layer sayısı yüksek disiplinler arası çizim.

Gerçek dosya repoya konamıyorsa anonimleştirilmiş/minimize edilmiş reproducer fixture oluşturulmalıdır. Her production bug'ı mümkünse yeni fixture + beklenen release statüsü ile kapatılmalıdır.

## 7. Visual golden politikası

Sentetik fixture'larda kör pixel-perfect golden kullanmak tek başına yeterli değildir; font rasterization, WebGL ve platform farklılıkları false-positive üretebilir.

Bu nedenle release politikası iki katmanlıdır:

1. Zorunlu yapısal/browser gate:
   - ready/blocked kararı,
   - canvas varlığı ve boyutu,
   - diagnostics kategorileri,
   - viewport overflow,
   - fail-closed davranışı.
2. Görsel kanıt:
   - Chromium screenshot'ları her CI koşusunda artifact olarak saklanır,
   - gerçek proje corpus'u stabilize olduğunda seçilmiş P0 dosyalar için toleranslı golden baseline ayrıca commit edilebilir.

Golden baseline yalnız gerçek görsel doğruluğu temsil eden, elle onaylanmış bir referans görüntüden üretilmelidir; ilk rastgele renderer çıktısı otomatik olarak “doğru” kabul edilmez.

## 8. Merge kriterleri

PR `main`e merge edilmeden önce aşağıdakilerin tamamı sağlanmalıdır:

- `vercel-preflight`: success
- `dxf-fidelity-release`: success
- Vercel Preview: READY
- PR: mergeable / conflict yok
- Stage 1–6 regression scripts: success
- Chromium DXF E2E: success
- clean fixture yanlışlıkla warning/blocked olmamalı
- warning fixture yanlışlıkla clean/blocked olmamalı
- known-incomplete fixture yanlışlıkla ready olmamalı
- auth/storage/share/PDF/image/DWG APS alanlarında kapsam dışı regression olmamalı

Bu kapılardan biri kırmızıysa production merge yapılmaz.

## 9. Bilinen ve açıkça ertelenen renderer özellikleri

Aşağıdakiler Stage 6 ile “desteklenmiş” sayılmaz:

- gerçek linetype pattern rendering,
- shaped polyline width mesh,
- full paper-space layout/viewports ve layout switch,
- native rational / fit-point-only / closed-periodic spline desteği,
- gradient hatch rendering,
- tam 3D OCS/UCS dönüşüm desteği.

Bu özellikler ileride uygulanırsa ilgili `blocked` veya `warning` policy yalnız yeni regression fixture ve browser kabul kanıtı ile gevşetilmelidir.

## 10. Release kararı

Stage 6'nın hedefi “her DXF'yi açmak” değildir. Hedef, desteklediğimiz DXF'yi güvenilir biçimde göstermek; güvenilir gösteremediğimiz DXF'yi ise kullanıcıya başarılıymış gibi sunmamaktır.
