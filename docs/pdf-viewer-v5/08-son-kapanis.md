# PDF Studio V5 — Son Kapanış Planı (A8)

> Bu dosya V5 planının **son** dosyasıdır. A8 bitince V5 kapanır; yeni aşama açılmaz.
> Ön koşul: A1–A7 çalışma ağacında duruyor (commit yok). Codex 11.10.2026 doğrulamasında gate 79/79, mobile-slow 30/30 sonucunu aldı.

## 0. Kurallar (özet; ayrıntısı `00-OKU-ONCE.md`)
- Önce oku: `PROJECT.md`, `AGENTS.md`, `.agents/rules/dokumantasyon-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, `docs/pdf-viewer-v5/00-OKU-ONCE.md`, `07-acik-maddeler.md`, bu dosya.
- CAD/DXF, `pdfjs-dist` sürümü, `public/vendor/**`, `tests/pdf-v4/budgets.json` → **dokunma**.
- `pdfjs-studio.tsx` (~2670 satır) baştan sona okunmaz: `Select-String` + ±40 satır.
- Uzun çıktıyı `Select-Object -Last 60` ile kes. Exit code 0 ama hata yazıyorsa PASS deme.
- UI metni/yorumlar Türkçe, yeni kodda `any` yok, `console.log` yok, var olan yorumlar silinmez.
- Commit **yalnız A8.7'de**, tek atomik commit. Push kullanıcı onayıyla (AGENTS.md: IDE modunda `main` push → Production deploy normaldir).
- Bir madde 2 denemede kapanmazsa: yalnız o maddenin değişikliğini geri al, `08-son-kapanis.md` §3'e "blokaj + neden" yaz, sonraki maddeye geç.

## 1. İncelemede bulunan eksikler

| # | Eksik | Neden önemli |
|---|-------|--------------|
| E1 | S10 (`s10-compat.spec.ts`) ilk tam gate koşusunda 1 kez kırmızı oldu, tek başına tekrar üretilemedi. Kök neden yok. | Flaky test = güvenilmez kapı. "İkinci koşuda geçti" kapanış değildir. |
| E2 | A7.2'deki yeni davranışların **birim testi yok**: (a) `engine.setInteraction/onScroll` 250 ms jest-sonrası kaydırma koruması, (b) `updateRange` geri dönüşü (strict±2 kaldırıldı), (c) `PdfPageHost` görünür sayfa hemen / overscan 25 ms `getPage`. | Yalnız E2E bütçe testleri koruyor; regresyon sessiz geri gelebilir. |
| E3 | V5 dosyalarında 42 lint uyarısı. Bunların bir kısmı V5'in **kendi eklediği** kod: kullanılmayan import/değişken (`tileRect`, `gridSize`, `mode`, `pageAtY`, `pointFromAnchor`, `kind`), `react-hooks/exhaustive-deps` (pdf-page-host ~605: karmaşık bağımlılık ifadesi). | Kural: yeni kodda any yok, temiz diff. Ölü kod ve yanlış deps gizli hata kaynağı. |
| E4 | Doküman tutarsızlıkları: `07` A7.3 `window.__failPdfRenderCount = 3` diyor, test gerçekte `__failDraw` kullanıyor. `06-sonuc.md` §2.1 "lint 0 hata" diyor, `07` O5 "42 uyarı + repo geneli 333 hata" diyor. `06` §2.2 79/79 ve S10 flaky notu yok. | Rapor kanıtla birebir olmalı. |
| E5 | `pdf-viewer-v2.spec.ts` 3 kırmızı test (eski, `75dbf79`'da da kırmızı). Durumu "biliniyor" ama ne düzeltildi ne işaretlendi. | Kırmızı test paketi kalıcı gürültü üretir. |
| E6 | O6 elle cihaz kontrolleri (Android, iPhone Safari, yazdırma önizleme, ikinci monitör) yapılmadı. | Otomatikleştirilemez; kullanıcıya net liste lazım. |
| E7 | Commit/push yapılmadı; `PROJECT.md` / `DOK_CONTEXT_MAP.md` değişiklikleri V5'i yansıtıyor mu doğrulanmadı. | Kapanış = tek doğrulanmış checkpoint. |

## 2. Uygulama adımları

### A8.1 — E1: S10 flaky kök nedeni
1. `npm run build` (gate production sunucu ister) bir kez.
2. ```powershell
   $env:PLAYWRIGHT_PRODUCTION_SERVER="1"; npx playwright test -c playwright.pdf-v4.config.ts --project=compat tests/pdf-v4/s10-compat.spec.ts --repeat-each=15 --reporter=line 2>&1 | Select-Object -Last 30
   ```
3. Kırmızı çıkarsa `test-results/pdf-v4/results.jsonl` içindeki `firstError` (Codex'in eklediği `openError`) alanını oku. Olası nedenler (yalnız bunlara bak): worker başlatma zaman aşımı (`expect.poll` 4 s), `openPdf` beklemesi, önceki testten kalan sunucu ısınması.
4. Düzeltme **testte** yapılır (beklemeyi koşula bağla, sabit `waitForTimeout` ekleme). Bütçe/eşik gevşetme yok. Ürün kodunda gerçek hata çıkarsa cerrahi düzelt.
5. Kapanış ölçütü: `--repeat-each=15` → 15/15 yeşil. 15/15 ilk denemede yeşilse kod değiştirme; "15/15, tekrar üretilemedi" diye kanıtla kapat.

### A8.2 — E2: eksik birim testleri (`tests/pdf-v4/unit/engine.test.ts`)
Mevcut test stilini (`nowFn` enjeksiyonu, sahte scroller) kopyala. Ekle:
- (a) `gesture` → `settleScale()` → 100 ms sonra `scroll` olayı → `scheduler` durumu `"scrolling"` **olmamalı**; 300 ms sonra `scroll` → `"scrolling"` olmalı.
- (b) `updateRange`: `overscanFn` küçükken aralık `wide` sınırını aşmamalı (strict±2 genişlemesi geri gelmesin).
- (c) Gerekirse `PdfPageHost` 25 ms davranışı için ayrı E2E değil, mevcut `v5-a5-uyum.spec.ts`'e tek kontrol: `scrollToPage(N)` sonrası görünür sayfanın `data-page-state` değeri overscan sayfadan önce `empty` dışına çıkar. Kırılgan olursa (2 deneme) atla ve §3'e yaz.
- Önce testleri yaz, mevcut kodla **geçtiğini** gör (bunlar regresyon kilidi). Sonra koruma satırını geçici yorumla → (a) kırmızı olmalı → geri al. Bu doğrulamayı raporda yaz.
- Koş: `npm run check:pdf-v4:unit 2>&1 | Select-Object -Last 20`

### A8.3 — E3: V5 lint temizliği (yalnız V5'in dokunduğu dosyalar)
```powershell
npx eslint src/components/dokumantasyon/studio/pdf/engine/pdf-page-host.tsx src/lib/dokumantasyon/studio/pdf/engine/engine.ts src/lib/dokumantasyon/studio/pdf/engine/input-controller.ts src/lib/dokumantasyon/studio/pdf/engine/use-pdf-engine.ts src/lib/dokumantasyon/studio/pdf/pdf-navigation.ts src/lib/dokumantasyon/studio/pdf/pdf-print.ts src/components/dokumantasyon/studio/pdf/pdf-highlight-layer.tsx src/components/dokumantasyon/studio/pdf/pdf-shortcuts-modal.tsx tests/pdf-v4/helpers/v5.ts tests/pdf-v4/helpers/gestures.ts tests/pdf-v4/v5-*.spec.ts tests/pdf-v4/v5m-*.spec.ts tests/pdf-v4/unit/engine.test.ts 2>&1 | Select-Object -Last 60
```
- Kaldır: kullanılmayan import/değişkenler.
- Timer tipleri: `any` → `ReturnType<typeof setTimeout> | null`.
- `pdf-page-host.tsx` ~605 exhaustive-deps: karmaşık ifadeyi `useMemo`/değişkene çıkar. Davranış değişikliği riskli görünürse `// eslint-disable-next-line react-hooks/exhaustive-deps` + Türkçe gerekçe yorumu (bilinçli tercih). Bağımlılık listesine körü körüne `generations` **ekleme** (render döngüsü/H5 riski).
- `pdfjs-studio.tsx` içindeki eski `any`'ler (`__pdfEngine`, `dest: any` vb.) **V5 öncesi borçtur, dokunma**.
- Hedef: bu dosyalarda **0 hata, yalnız V5 öncesinden kalan uyarılar**. Sayıyı önce/sonra raporla.
- Her düzenlemeden sonra: `npx tsc -p tsconfig.next.json --noEmit --incremental false`.

### A8.4 — E5: v2 eski kırmızı testleri
Kod düzeltme yok (v2 eski görüntüleyici, V5 kapsamı dışı). `tests/document-studio/pdf-viewer-v2.spec.ts` içinde yalnız bu 3 teste `test.fixme(...)` ve Türkçe yorum ekle: `// Bilinen eski hata (75dbf79'da da kırmızı, kanıt: docs/pdf-viewer-v5/07-acik-maddeler.md A7.1). V5 kapsamı dışı.`
Koş: `npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v2.spec.ts --project=chromium --reporter=line 2>&1 | Select-Object -Last 15` → 4 passed, 3 fixme (skipped), 0 failed.

### A8.5 — Tam regresyon (bir kez, sırayla)
```powershell
npx tsc -p tsconfig.next.json --noEmit --incremental false
npm run check:pdf-v2:unit; npm run check:pdf-v3:unit; npm run check:pdf-v4:unit
npm run build 2>&1 | Select-Object -Last 15
npm run check:pdf-v4:gate 2>&1 | Select-Object -Last 45
npm run check:pdf-v4:gate:mobile-slow 2>&1 | Select-Object -Last 45
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v3-invariants.spec.ts tests/document-studio/pdf-viewer-toolbar-parity.spec.ts tests/document-studio/pdf-viewer-v2.spec.ts --project=chromium --reporter=line 2>&1 | Select-Object -Last 20
```
Beklenen: gate 79/79, mobile-slow 30/30, v3+parity 11/11, v2 4 passed + 3 fixme. Biri kırmızıysa yalnız o testi 1 kez tekrar koş; yine kırmızıysa A8.7'ye geçme, §3'e yaz ve DUR.

### A8.6 — E4 + E6: doküman düzeltme
- `07-acik-maddeler.md`: A7.3'te `__failPdfRenderCount` → gerçek mekanizma (`__failDraw` bayrağı, `v5-a1-bellek.spec.ts` ~76–94). O1/O5 satırlarını A8 sonuçlarıyla güncelle.
- `06-sonuc.md` §2.1 lint cümlesi: "V5 dosyaları 0 hata, N uyarı (V5 öncesi borç); repo geneli eski borç kapsam dışı". §2.2'ye S10 flaky sonucu (A8.1). §2.3'e v2 `fixme` notu.
- `06-sonuc.md` §4 elle kontrol listesini koru; başına "Kullanıcı tarafından yapılacak, push sonrası Production'da" notu ekle.
- `PROJECT.md` ve `DOK_CONTEXT_MAP.md` diff'ini oku (`git diff PROJECT.md DOK_CONTEXT_MAP.md`): V5 bilgisi doğru ve kısa mı? Yanlışsa düzelt, gereksiz uzunsa kısalt.
- Bu dosyanın §3'ünü doldur.

### A8.7 — Commit (push yok, kullanıcı onayı bekle)
1. `test-results/`, `scratch-*`, `.next-playwright-*` gibi geçici çıktılar git'e girmesin: `git status --short` ile kontrol, varsa sil.
2. Kontrol: `git diff --name-only` listesinde CAD/DXF, `public/vendor`, `package.json` (pdfjs-dist), `budgets.json` **olmamalı**.
3. Tek commit:
   ```powershell
   git add -A src tests docs/pdf-viewer-v5 PROJECT.md DOK_CONTEXT_MAP.md playwright.pdf-v4.config.ts
   git commit -m "fix(pdf-v5): V5 hata giderme planı (H1-H24) + mobile-slow S5 ve kapanış (A1-A8)"
   ```
4. **Push etme.** Kullanıcıya: commit hash, `git show --stat HEAD | Select-Object -First 40`, ve "push için onay" sorusu.

## 3. Sonuç (A8 sonunda doldurulur)

| # | Durum | Kanıt (komut → sonuç) |
|---|-------|------------------------|
| E1 | Kapatıldı; 15/15 koşuda yeniden üretilemedi | `npm run build` → exit 0; S10 `--repeat-each=15` → 15 passed (27.0s), `openError` `firstError` alanına bağlı. Ürün/test kodu değiştirilmedi. |
| E2 | (a) ve (b) kapatıldı; (c) iki denemede kırılgan bulundu, kontrol geri alındı | `npm run check:pdf-v4:unit` → geçti; 250 ms koruması geçici kaldırılınca `setInteraction` assertion'ı kırmızı oldu. (c) E2E denemesi iki kez `overscanStates=["backdrop"]` verdi; yalnız opsiyonel test değişikliği geri alındı. |
| E3 | 0 hata; 4 uyarı kaldı (75dbf79 öncesi) | A8.3 lint önce: 0 hata / 17 uyarı; sonra: 0 hata / 4 uyarı. Kalan uyarılar için `git blame` eski kaynak satırlarını doğruladı. `tsconfig.next` typecheck geçti. |
| E4 | Kapatıldı | `07-acik-maddeler.md` A7.3 gerçek `__failDraw` mekanizmasına göre düzeltildi; `06-sonuc.md` lint, S10, v2 ve manuel kontrol notları A8 sonuçlarıyla güncellendi. `PROJECT.md` ve `DOK_CONTEXT_MAP.md` v4 motor/jest korumalarını yansıtıyor. |
| E5 | Kapatıldı; eski v2 kırmızıları gürültü üretmiyor | `npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-v2.spec.ts --project=chromium --reporter=line` → 4 passed, 3 skipped/fixme, 0 failed. |
| E6 | Kullanıcıda | `06-sonuc.md` §4; push sonrası Production'da yapılacak. |
| E7 | Tek yerel atomik checkpoint; push yapılmadı | A8.7 commit hash'i son raporda verilecek; commit `internal-pdf-v5-completion` dalında. |

Blokajlar: E2(c) görünür `data-page-state` ile overscan sayfası sırası iki denemede kanıtlanamadı; opsiyonel E2E kontrolü plana göre geri alındı. Görünür/overscan `getPage` önceliği otomatik olarak ayrıca doğrulanmadı.
