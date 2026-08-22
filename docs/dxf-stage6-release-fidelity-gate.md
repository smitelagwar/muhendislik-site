# DXF Stage 6 — Release / Fidelity Gate

Bu aşamanın amacı yeni CAD özelliği eklemek değil; DXF içindeki mühendislik bilgisinin sessizce kaybolmasını engelleyen kuralları release edilebilir, tekrar çalıştırılabilir ve fail-closed bir kabul sistemine dönüştürmektir.

## 1. Release prensibi

Bir DXF yalnız şu üç durumdan biriyle sınıflandırılır:

- `clean`: bilinen renderer fidelity riski yok; viewer `ready` olabilir.
- `warning`: ana geometri render edilebilir ancak tipografi, linetype, width veya benzeri belgelenmiş bir fidelity farkı vardır; kullanıcı diagnostics görür.
- `blocked`: mevcut engine'in eksik/yanlış çizeceği veya çizim bilgisini sessizce atacağı doğrulanmış bir yapı vardır; viewer başarı durumu vermez ve orijinal dosya indirme yolu gösterilir.

`Dosya parse edildi`, `worker tamamlandı` veya `canvas oluştu` tek başına release başarısı değildir.

## 2. Fail-closed release hardening

`src/lib/dokumantasyon/dxf-release-hardening.ts` Stage 1–4 audit'lerinin üstüne kaynak bağlamını dikkate alan son güvenlik kapısını ekler.

### Unsupported entity

Renderer dispatch listesinde bulunmayan bir entity:

- görünür model-space içindeyse blocking,
- gerçekten kullanılan bir BLOCK zincirinin içindeyse blocking,
- paper-space içindeyse model viewer için bloke etmez,
- `hidden` ise bloke etmez,
- source-off/frozen layer içindeyse bloke etmez,
- erişilmeyen BLOCK tanımındaysa bloke etmez.

Bu sayede `LEADER` / `MLEADER` gibi renderer'ın sessizce atacağı annotation kayıtları görünür çizimde `ready` olamaz; ancak model görünümüne zaten dahil edilmemesi gereken kaynak veriler false-positive üretmez.

### Missing BLOCK

Sadece dosyada bir yerde eksik referans bulunması değil, görünür/erişilebilir INSERT yolu esas alınır. Model-space veya kullanılan nested BLOCK zincirindeki INSERT tanımsız BLOCK'a gidiyorsa blocking uygulanır.

### OCS / extrusion

Upstream renderer arbitrary OCS için tam dönüşüm uygulamaz ve yalnız sınırlı ±Z davranışları içerir. Bu nedenle mevcut release politikası konservatiftir:

- varsayılan `0,0,+1` kabul edilir,
- diğer extrusion/OCS yönleri görünür/erişilebilir entity için blocking,
- `-Z` dahil bir özel yön ancak entity-bazlı fixture + browser kabul kanıtı ile ileride gevşetilebilir.

Bu politika INSERT dışında ARC/CIRCLE/ELLIPSE/TEXT/POLYLINE vb. entity sınıflarına da uygulanır.

## 3. Canonical fixture matrisi

| Fixture | Beklenen durum | Ana kanıt |
| --- | --- | --- |
| `geometry-basic.dxf` | clean | temel desteklenen geometri |
| `stage7-large-coordinate-bulge.dxf` | clean | aktif survey ölçeği koordinatlar + pozitif/negatif/closed bulge |
| `stage7-color-hatch.dxf` | clean | BYLAYER/BYBLOCK/true-color kaynak yolları + iki halkalı solid HATCH |
| `suppressed-unsupported.dxf` | clean | off/paper/hidden unsupported kayıtlar model görünümünü bloke etmez |
| `stage3-text-mtext.dxf` | warning | SHX/text fallback + MTEXT fraction görünürlüğü |
| `stage4-geometry-layers.dxf` | warning | off/frozen layer, non-continuous linetype, width, paper-space ayrımı |
| `unsupported-annotations.dxf` | blocked | görünür LEADER/MLEADER renderer dispatch dışında |
| `missing-block-only.dxf` | blocked | görünür INSERT için BLOCK tanımı yok |
| `ocs-arc-circle.dxf` | blocked | arbitrary OCS ARC/CIRCLE |
| `stage2-block-transforms.dxf` | blocked | grid/array INSERT / block reliability sınırı |
| `stage2-ocs-insert.dxf` | blocked | INSERT OCS/extrusion |
| `stage3-dimensions.dxf` | blocked | hazır block'suz unsupported veya malformed dimension |
| `stage4-risky-geometry.dxf` | blocked | unsafe SPLINE / HATCH yolları |

Bu matris `scripts/check-dxf-stage6-release.ts` tarafından otomatik doğrulanır. Her fixture'ın statüsü veya gerekli diagnostic kategorisi istemeden değişirse release gate başarısız olur.

## 4. Büyük koordinat / bulge / color / HATCH regresyonu

`scripts/check-dxf-stage7-extended-fidelity.ts` şu kaynak sözleşmelerini ayrıca kilitler:

- aktif model geometrisinde milyon mertebesi koordinatlar,
- pozitif bulge,
- negatif bulge,
- closed polyline son→ilk bulge segmenti,
- BYLAYER (`62=256`) renk yolu,
- BYBLOCK (`62=0`) block rengi yolu,
- layer true-color (`420`) kaydı,
- entity true-color (`420`) kaydı,
- çok halkalı solid HATCH boundary.

Bunlar yalnız source census olarak bırakılmaz; ilgili clean fixture'lar gerçek Chromium viewer zincirinden de geçirilir.

## 5. Browser-level kabul

`tests/document-studio/dxf-release.spec.ts` gerçek uygulama akışını kullanır:

1. `/dokumantasyon` admin oturumu açılır.
2. `DOK_ALLOW_LOCAL_STORAGE=true` test ortamında gerçek local upload endpoint'i kullanılır.
3. DXF fixture gerçek dosya kaydı olarak yüklenir.
4. `/dokumantasyon/dosya/<id>` açılır.
5. Render edilebilir fixture için:
   - `cad-dxf-viewer` görünür olmalı,
   - WebGL canvas gerçek piksel boyutuna sahip olmalı,
   - error overlay görünmemeli,
   - `cad-dxf-runtime-snapshot` oluşmalı,
   - bounds/origin/camera/layer snapshot'ı alınabilmeli,
   - WebGL framebuffer'da arka plandan farklı foreground pixel sinyali bulunmalı,
   - clean/warning diagnostics doğru statü vermeli,
   - warning panelinde blocking item bulunmamalı.
6. Büyük koordinat fixture'ında:
   - origin gerçekten büyük dünya koordinatında olmalı,
   - renderer bounds span'i çizimin lokal boyutunda kalmalı,
   - FitView doğrulaması Stage 4 kapısından geçmeli.
7. Blocking fixture için:
   - `DXF açılamadı` görünmeli,
   - diagnostics panel otomatik görünmeli,
   - en az bir `data-severity="blocking"` item bulunmalı,
   - ilgili entity/BLOCK/OCS/Ölçü/Geometri kanıtı görünmeli,
   - `Orijinal dosyayı indir` aksiyonu korunmalı,
   - pre-render blocking durumunda runtime snapshot oluşmamalı.
8. 390×844 mobil viewport'ta page-level horizontal overflow olmamalı ve blocking ekranda `Tekrar dene` / `Orijinal dosyayı indir` aksiyonları scroll ile erişilebilir olmalı.
9. Chromium koşusunda görsel kanıt screenshot'ları Playwright report artifact'ına eklenir.

Bu test render motorunu mock'lamaz; uygulamanın gerçek `dxf-viewer` + worker + upload + dosya sayfası zincirini kullanır.

## 6. CI release gate

`.github/workflows/dxf-fidelity-release.yml` DXF fidelity alanını etkileyen değişikliklerde çalışır.

Zorunlu sıra:

```bash
npx eslint <DXF-scoped files>
npx tsc --noEmit --incremental false
node scripts/check-dxf-stage1-fidelity.mjs
npx tsx scripts/check-dxf-stage2-hardening.ts
npx tsx scripts/check-dxf-stage3-fidelity.ts
npx tsx scripts/check-dxf-stage4-fidelity.ts
npx tsx scripts/check-dxf-stage5-diagnostics.ts
npx tsx scripts/check-dxf-release-hardening.ts
npx tsx scripts/check-dxf-stage7-extended-fidelity.ts
npx tsx scripts/check-dxf-stage6-release.ts
npx playwright install --with-deps chromium
npx playwright test --config=playwright.config.ts tests/document-studio/dxf-release.spec.ts --project=chromium
```

Playwright raporu ve `test-results` klasörü `dxf-playwright-report` artifact'ı olarak 14 gün saklanır.

## 7. Vercel preflight lint politikası

Repo geçmişten gelen global lint borcu taşımaktadır. Bu nedenle `vercel-preflight` şu ayrımı yapar:

- PR/push ile değişen JS/TS dosyaları: ESLint zorunlu ve sıfır yeni error,
- tüm repository: TypeScript `--noEmit` zorunlu,
- tüm repository: production `next build` zorunlu.

Böylece mevcut legacy lint hataları yeni PR'ın hatasıymış gibi release'i bloke etmez; yeni veya dokunulan dosyada lint regresyonuna da izin verilmez.

## 8. Stage 3 release cleanup

### BLOCK içindeki DIMENSION

Dimension fidelity gate yalnız top-level `ENTITIES` bölümündeki DIMENSION kayıtlarını sayar. BLOCK içindeki dimension kayıtları block implementasyon detayı olarak kalır ve ayrıca model-space ölçüsüymüş gibi ikinci kez gate edilmez.

TEXT/MTEXT/ATTRIB/ATTDEF audit'i BLOCKS içinde devam eder; block içindeki görünür metin fidelity açısından önemlidir.

### Escaped MTEXT `\\S`

Gerçek MTEXT stacked fraction kontrolü olan `\S...;` normalize edilir. Literal/escaped `\\S...;` dizisi yanlışlıkla stacked fraction kabul edilmez ve kaynak görünür metni değiştirilmez.

## 9. Gerçek mühendislik DXF corpus standardı

Public fixture'lar sentetik/minimize edilmiş regresyon dosyalarıdır. Gerçek müşteri/proje paftalarının public GitHub reposuna yüklenmesi yasaktır.

Gerçek corpus için:

- `tests/private-dxf-corpus/README.md` kullanım standardını açıklar,
- `.gitignore` README dışındaki private corpus içeriğini dışarıda tutar,
- lokal `manifest.local.json` her gerçek dosyanın beklenen `clean/warning/blocked` durumunu tanımlar,
- `npx tsx scripts/check-dxf-private-corpus.ts` aynı audit/diagnostics motoruyla gerçek dosyaları doğrular.

Önerilen corpus sınıfları:

- betonarme kalıp planı,
- kolon/perde aplikasyonu,
- kiriş açılımı,
- mimari kat planı,
- vaziyet / aplikasyon / büyük koordinatlı survey,
- yoğun TEXT/MTEXT/DIMENSION,
- nested BLOCK/INSERT ağırlıklı pafta,
- HATCH ağırlıklı mimari detay,
- yüksek layer sayılı disiplinler arası çizim.

Bu private corpus altyapısı hazırdır; fakat kullanıcı tarafından anonimleştirilmiş/onaylı gerçek dosya sağlanmadığı sürece public CI gerçek proje verisi varmış gibi başarı iddiasında bulunmaz. Production'da bulunan yeni bir bug mümkünse anonimleştirilmiş/minimize edilmiş public reproducer fixture ile kalıcı regresyona dönüştürülmelidir.

## 10. Visual golden politikası

Kör pixel-perfect golden tek başına doğru kabul edilmez; font rasterization, WebGL ve platform farkları false-positive üretebilir.

Zorunlu katmanlar:

1. Yapısal/compatibility gate:
   - clean/warning/blocked kararı,
   - unsupported/missing BLOCK/OCS fail-closed,
   - source visibility ve reachability.
2. Renderer/runtime gate:
   - canvas boyutu,
   - runtime bounds/origin/camera/layers,
   - FitView kapsaması,
   - framebuffer foreground sinyali,
   - viewport overflow.
3. Görsel kanıt:
   - Chromium screenshot'ları CI artifact'ında saklanır,
   - gerçek corpus stabilize olduğunda seçilmiş P0 çizimler için yalnız elle doğrulanmış referanstan toleranslı golden baseline üretilebilir.

İlk rastgele renderer çıktısı otomatik olarak “doğru” golden kabul edilmez.

## 11. Merge kriterleri

PR `main`e merge edilmeden önce aşağıdakilerin tamamı aynı head üzerinde sağlanmalıdır:

- `vercel-preflight`: success,
- `dxf-fidelity-release`: success,
- Vercel Preview: READY,
- PR: mergeable / conflict yok,
- targeted DXF lint: success,
- full TypeScript: success,
- Stage 1–6 + release-hardening + extended-fidelity scriptleri: success,
- Chromium DXF E2E: success,
- clean fixture yanlışlıkla warning/blocked olmamalı,
- warning fixture yanlışlıkla clean/blocked olmamalı,
- known-incomplete fixture yanlışlıkla ready olmamalı,
- görünür LEADER/MLEADER ready olamamalı,
- görünür missing BLOCK ready olamamalı,
- non-default görünür OCS ready olamamalı,
- auth/storage/share/PDF/image/DWG APS alanlarında kapsam dışı regression olmamalı.

Bu kapılardan biri kırmızıysa production merge yapılmaz.

## 12. Bilinen ve açıkça ertelenen renderer özellikleri

Aşağıdakiler bu release ile “desteklenmiş” sayılmaz:

- gerçek linetype pattern rendering,
- shaped polyline width mesh,
- full paper-space layout/viewports ve layout switch,
- native rational / fit-point-only / closed-periodic spline desteği,
- gradient hatch rendering,
- tam 3D OCS/UCS dönüşüm desteği.

Bu özellikler ileride uygulanırsa ilgili `blocked` veya `warning` policy yalnız yeni regression fixture + gerçek browser kabul kanıtı ile gevşetilmelidir.

## 13. Release kararı

Hedef “her DXF'yi açmak” değildir. Hedef desteklediğimiz DXF'yi güvenilir biçimde göstermek; güvenilir gösteremediğimiz DXF'yi ise kullanıcıya başarılıymış gibi sunmamaktır.
