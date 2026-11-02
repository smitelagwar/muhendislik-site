# ASAMA_03 — Mobil pinch-zoom ve camera/pointer sahipliği

**Sonuç:** Hedeflenen Stage03 etkileşim düzeltmesi ve seçilmiş yerel testler PASS. Fiziksel cihaz, tam repo TypeScript ve release kabulü PASS değildir. `npm run build` ve son diff kontrolü PASS oldu.

## Kök neden kanıtı

- Kurulu sürüm `@mlightcad/cad-simple-viewer@1.6.2`; kullandığı `three@0.172.0` OrbitControls, pointer input'u renderer canvas'ına bağlıyor. Dokunma eşlemesi `ONE: PAN`, `TWO: DOLLY_PAN`; adapter'ın mevcut mobil ayarı yalnız hız/zoom-to-cursor değerlerini değiştiriyor.
- Review mesafe/alan SVG katmanları renderer canvas'ının kardeşi. İncelenen CDP olay zincirinde birinci touch canvas'a, ikinci touch seçilebilir SVG `line` elemanına geldi. İkinci elemanın etkin `touch-action` değeri `auto` idi ve bu olay kamera canvas'ındaki OrbitControls'a ulaşmıyordu.
- Host'taki dar touch bridge overlay kaynaklı pointerdown'ı canvas'a iletip pointer capture alıyor; orijinal olay SVG seçim/tap davranışı için duruyor. İkinci temas review draft'ını iptal ediyor. Tamamlanmış selectable distance/area gruplarında `touch-action:none` tanımlandı.

## Sayısal doğrulama

| Profil/gesture | Kamera zoom | Review çizgisi | Dünya/ekran eşleşmesi |
|---|---:|---:|---|
| Pixel 7 emülasyonu, pinch | 0.374545 → 0.561818 (1.5×) | 90 → 135 CSS px | İki endpoint `projectWorldPoint` ile <1 CSS px farkta; pinch anchor drift <8 px |
| Ayrı iPhone 13 emülasyonu, pinch | 0.354545 → 0.531818 (1.5×) | 90 → 135 CSS px | İki endpoint `projectWorldPoint` ile <1 CSS px farkta; pinch anchor drift <8 px |
| Pixel 7 emülasyonu, sabit açıklıklı iki parmak pan (35×25 CSS px giriş) | 0.374545 → 0.374545 | Uygulanmaz | Kamera merkezi `(0,0) → (-93.4466, 66.7476)` |
| Desktop Chromium, sol/orta drag + mouse wheel | Pan merkezini değiştirdi; wheel zoom büyüttü | Uygulanmaz | E2E assertion PASS |

Pinch, kamera `zoom` değerini ve review çizgisini aynı kamera transformu üzerinden değiştirdi. Yalnız SVG boyut/translate değişikliğiyle PASS verilmedi.

## Gerçek testler

- `npx tsx --test tests/document-studio/cad-chain-stage03-contract.test.ts tests/document-studio/cad-markup-stage06-contract.test.ts tests/document-studio/cad-stage07-contract.test.ts` — **27/27 PASS**. Double-click/phantom vertex, ESC, pointercancel, lost capture, ikinci touch, tool switch ve stylus coalesced samples contract'ları dahil.
- `cad-mobile-stage8.spec.ts`, `mobile-chromium`: ikinci touch ile ölçüm/freehand draft iptali, sabit açıklıklı pan ve iki emülasyonlu pinch — **4/4 PASS**.
- `cad-stage3-view-navigation.spec.ts`, Chromium — sol/orta mouse pan, wheel zoom, fit/tool switching/source korunumu — **1/1 PASS**.
- Değişen 5 kaynak/test dosyası için hedefli ESLint — **0 error, 3 warning**. Viewer'daki hook dependency/unused handler uyarıları değiştirilen bölge dışındaki mevcut uyarılardır.
- `npx tsc --noEmit` — **FAIL**, güncel çalıştırmada 563 repo-geneli TypeScript diagnostics. Beş değişen Stage03 kaynak/test dosyası için tanı ayıklaması: **0**.
- İlk tek-touch CDP pan denemesi **FAIL/invalid oracle**: TouchEvent changed coordinates moved, but OrbitControls' observed pointer pan delta did not. Bu gözlem kod değişikliği için kullanılmadı; aynı trusted CDP yolunda span sabit iki-contact pan ile kamera hareketi doğrulandı.

## Kalan kabul

- Fiziksel iOS/Android: `NOT_RUN`; sadece iki ayrı Chromium device emülasyonu.
- Fiziksel trackpad/stylus: `NOT_RUN`; stylus için yalnız unit/controller coalesced-event contract'ı geçti.
- Tam repo TypeScript kapısı başarısız. `npm run build` yerelde **PASS** (Next.js üretim derlemesi ve sayfa üretimi tamamlandı). `git diff --check` **PASS**.
- CAD V1 renderer/parser/worker değişmedi. `main`, Production, merge ve deploy değişmedi. Stage03 tek başına final release onayı değildir.
