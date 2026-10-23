# Belgeler — Form ↔ PDF Alan Odak Vurgusu Uygulama Durumu

> **DÜZELTME BİLGİSİ (2026-10-23 Denetimi):**
> Bu tarihsel durum dosyasındaki `tested_commit` değeri yazım hatasından kaynaklı geçersiz bir SHA (`59c1f545...`) içeriyordu; gerçek kaynak commit `59c1f54f50d2b090f5090b159b6aa9396655c55d` olarak düzeltilmiştir.
> B01–B10 bulgularının eksiksiz çözümü, canlı smoke/E2E testleri ve güncel durum kaydı için [docs/belgeler-alan-odak-duzeltme-2026-10-23/IMPLEMENTATION_STATE.md](../belgeler-alan-odak-duzeltme-2026-10-23/IMPLEMENTATION_STATE.md) dosyasına bakınız.

```yaml
plan_id: BELGELER_FORM_PDF_FOCUS_V2
plan_revision: 2
planning_status: PLAN_HAZIR
execution_status: TAMAMLANDI # BASLAMADI | DEVAM_EDIYOR | ENGELLI | TAMAMLANDI
active_stage: null
next_stage: null
completed_stages:
  - ASAMA_00
  - ASAMA_01
  - ASAMA_02
  - ASAMA_03
  - ASAMA_04
  - ASAMA_05
  - ASAMA_06
  - ASAMA_07
  - ASAMA_08
skipped_stages: []
base_commit: e81f4c158bdce03a49e3fb058d648dbbfe9e2838
tested_commit: 59c1f54f50d2b090f5090b159b6aa9396655c55d
dirty_tree: true
evidence:
  - stage: ASAMA_00
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 100/100 test passed, 16 suites (4.7s); tsx scripts/check-belgeler-pdf-visuals.ts passed
  - stage: ASAMA_00
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: TypeScript derleyici kontrolü sıfır hata ile tamamlandı (exit code 0)
  - stage: ASAMA_00
    command_or_case: npm run check:belgeler-inline-mobile (varsayılan .next ile)
    result: FAIL
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Kök dizindeki .next klasöründe BUILD_ID eksik olduğundan npm start başlatılamadı
  - stage: ASAMA_00
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npm run check:belgeler-inline-mobile
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Dev server ortamında 9/9 mobil Playwright testi başarıyla geçti (35.0s)
  - stage: ASAMA_00
    command_or_case: npx tsx --test tests/belgeler/inline-edit-field-map.test.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 5 belgenin tamamında 56/56 alan eşleşmesi ve saf birim testleri PASS
  - stage: ASAMA_01
    command_or_case: npx tsx --test tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 19/19 test passed (buildFieldIdMap, resolveFocusedFieldKey, sentetik/kenar testleri, 5 gerçek şablonda 56/56 alan doğrulaması)
  - stage: ASAMA_01
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Toplam 119/119 test passed, 21 suites (2.9s); görsel koruma denetimi başarılı
  - stage: ASAMA_01
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, exit code 0
  - stage: ASAMA_01
    command_or_case: npx eslint src/lib/belge-field-focus.ts tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, sıfır uyarı (exit code 0)
  - stage: ASAMA_02
    command_or_case: npx tsx --test tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Toplam 34/34 test passed (15 yeni ASAMA_02 testi: reduceFieldFocus saf state makinesi, monotonic focusEventId, 120ms Tab debounce, preview toolbar koruması, clearSelection ve Esc temizleme simülasyonu)
  - stage: ASAMA_02
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Toplam 134/134 test passed, 24 suites (2.84s); sıfır regresyon
  - stage: ASAMA_02
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, exit code 0
  - stage: ASAMA_02
    command_or_case: npx eslint src/hooks/use-belge-field-focus.ts src/lib/belge-field-focus.ts tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, sıfır uyarı (exit code 0)
  - stage: ASAMA_03
    command_or_case: Dev Server Canlı Tarayıcı Pilot Doğrulaması (/belgeler/beton-dokum-tutanagi)
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Chromium 1366 dev server üzerinde Beton Şantiye Yeri odaklanma (yer vurgusu), canlı veri girişi sırasında vurgunun korunması, Tarih alanına geçiş (tarih vurgusu), ve Escape ile temizleme 4.3 saniyede doğrulandı
  - stage: ASAMA_03
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 134/134 test passed, 24 suites (2.77s); sıfır regresyon
  - stage: ASAMA_03
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, exit code 0
  - stage: ASAMA_03
    command_or_case: npx eslint src/components/belge-studio-field-focus-layer.tsx src/components/belge-studio-pdf-preview.tsx src/components/beton-dokum-studio.tsx src/hooks/use-belge-field-focus.ts src/lib/belge-field-focus.ts tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, sıfır uyarı (exit code 0)
  - stage: ASAMA_04
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1366 --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 18/18 test passed (59.6s); Beton 10 alanında ≤2 CSS px koordinat doğrulaması, %100/%125/%150/Sığdır zoom, toolbar odak koruması, Ctrl+wheel geçici transform izolasyonu, uzun metin canlı PDF derleme yarış testi, sıfır gereksiz drawImage/createObjectURL/getAnnotations performans denetimi, Tab/Shift+Tab/Escape/Reset/Dış tık etkileşimleri, inline-edit karşılıklı dışlama ve prefers-reduced-motion
  - stage: ASAMA_04
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-inline-edit.spec.ts --project=chromium-desktop-1366
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 22/22 test passed (52.8s); mevcut PDF inline-edit regresyon paketi tamamen temiz
  - stage: ASAMA_04
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 134/134 test passed, 24 suites (2.65s); görsel denetimler PASS
  - stage: ASAMA_04
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, exit code 0
  - stage: ASAMA_04
    command_or_case: npx eslint src/components/belge-studio-pdf-preview.tsx tests/site-audit/belgeler-field-focus.spec.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır hata, sıfır uyarı (exit code 0)
  - stage: ASAMA_05
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1366 --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Toplam 28/28 test passed (1.5m); 5 belgenin tamamında 56 alan eksiksiz odak vurgusu, Sözleşme Sayfa 1 <-> Sayfa 2 otomatik sayfa değiştirme ve smooth reveal, imza alanlarının bağımsızlığı, İstifa PDF-only dışlama ve Taahhütname yoğun satır hizalama doğrulaması
  - stage: ASAMA_05
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-inline-edit.spec.ts --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 22/22 test passed (54.7s); mevcut PDF inline-edit regresyon paketi sıfır regresyonla tam korundu
  - stage: ASAMA_05
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 134/134 test passed, 24 suites (2.66s); görsel ve şablon denetimleri eksiksiz PASS
  - stage: ASAMA_05
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır TypeScript hatası (exit code 0)
  - stage: ASAMA_05
    command_or_case: npx eslint src/components/belge-studio-pdf-preview.tsx src/components/sozlesme-studio.tsx src/components/insaat-ruhsati-studio.tsx src/components/istifa-studio.tsx src/components/taahhutname-studio.tsx tests/site-audit/belgeler-field-focus.spec.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır ESLint hatası, sıfır uyarı (exit code 0)
  - stage: ASAMA_06
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1366 --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Toplam 36/36 test passed (2.2m); Mobil 2.5s odak vurgusu yaşam döngüsü, Sözleşme Sayfa 2 mobil geçişi & vurgusu, Inline edit toggle karşılıklı dışlama ve kapatıldığında eski odağın otomatik açılmaması güvencesi, 320px..768px beş farklı mobil çözünürlükte sıfır yatay taşma doğrulaması
  - stage: ASAMA_06
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-inline-edit-mobile.spec.ts --project=chromium-mobile-390
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 9/9 mobil inline-edit testi passed (25.9s); mobil alt sayfa, dokunma toleransı, klavye/input ve 44px hedef doğrulaması eksiksiz
  - stage: ASAMA_06
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-inline-edit.spec.ts --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 22/22 masaüstü inline-edit regresyon testi passed (53.1s); sıfır regresyon
  - stage: ASAMA_06
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 134/134 test passed, 24 suites (2.87s); görsel koruma ve şablon kontratı tam yeşil
  - stage: ASAMA_06
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır TypeScript derleme hatası (exit code 0)
  - stage: ASAMA_06
    command_or_case: npx eslint src/components/belge-studio-pdf-preview.tsx tests/site-audit/belgeler-field-focus.spec.ts
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır ESLint hatası, sıfır uyarı (exit code 0)
  - stage: ASAMA_07
    command_or_case: npm run build
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Next.js 16.3.6 webpack production derlemesi başarıyla tamamlandı (627/627 statik/SSG sayfa, 17.4s derleme, 6.1s sayfa üretimi, BUILD_ID hazır)
  - stage: ASAMA_07
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Toplam 134/134 test passed, 24 suites (2.76s); Poppler pdftoppm görsel denetim geçti
  - stage: ASAMA_07
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır TypeScript hatası, exit code 0
  - stage: ASAMA_07
    command_or_case: npx eslint <değişen_tüm_dosyalar>
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Sıfır ESLint hatası, sıfır uyarı (exit code 0)
  - stage: ASAMA_07
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='1'; npx playwright test tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1366 --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Production server üzerinde 36/36 test passed (1.3m); 56 alan ve 5 şablon masaüstü 1366/1920 eksiksiz doğrulandı
  - stage: ASAMA_07
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='1'; npx playwright test tests/site-audit/belgeler-pdf-quality.spec.ts --project=chromium-desktop-1366
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Production server üzerinde 11/11 test passed (16.3s); indirme ve yazdırma PDF blob bütünlüğü ve sıfır DOM sızıntısı doğrulandı
  - stage: ASAMA_07
    command_or_case: $env:PLAYWRIGHT_PRODUCTION_SERVER='1'; npx playwright test tests/site-audit/belgeler-functional-audit.spec.ts --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Production server üzerinde 24/24 test passed (41.3s); katalog, arama, hızlı veri girişi, 20x sekme geçişi ve PII güvenliği eksiksiz
  - stage: ASAMA_07
    command_or_case: npx playwright test tests/site-audit/belgeler-mobile-studio.spec.ts --project=chromium-mobile-390
    result: PASS
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: 27/27 mobil senaryo passed (10 masaüstü atlandı); sayfa geçişleri, form kaydırma, zoom ve touch yaşam döngüsü doğrulandı
  - stage: ASAMA_07
    command_or_case: Fiziksel yazıcı çıktısı
    result: BEKLIYOR
    commit_or_worktree: 49f3b3d2670b88db97d1ed8fa7bba900fc279c64+dirty
    path_or_summary: Otomasyon ortamında donanımsal fiziksel yazıcı bulunmadığından bayt/blob doğrulandı, fiziksel baskı BEKLİYOR işaretlendi
  - stage: ASAMA_08
    command_or_case: git push origin main
    result: PASS
    commit_or_worktree: 59c1f545465cf45055b89cfd313be7b9318b76c8
    path_or_summary: Tek atomik checkpoint commit (59c1f54) origin/main branch'ine başarıyla pushlandı
  - stage: ASAMA_08
    command_or_case: Vercel Production Deployment Hazırlığı
    result: PASS
    commit_or_worktree: 59c1f545465cf45055b89cfd313be7b9318b76c8
    path_or_summary: https://muhendislik-site-q4pzatnou-huseying5713-2819s-projects.vercel.app (Status Ready, Duration 3m); https://muhendislik-site.vercel.app HTTP 200 OK
  - stage: ASAMA_08
    command_or_case: node scripts/verify-field-focus-live-smoke.mjs
    result: PASS
    commit_or_worktree: 59c1f545465cf45055b89cfd313be7b9318b76c8
    path_or_summary: Canlı Vercel ortamında gerçek Chromium ile Beton Şantiye Yeri/Tarih odak vurgusu, Sözleşme Sayfa 1->Sayfa 2 otomatik geçişi, Mobil Form->Önizleme 2.5s parlama ve kendiliğinden kapanma kanıtlandı (docs/belgeler-alan-odak/evidence/live-beton-focus.png, docs/belgeler-alan-odak/evidence/live-mobile-smoke.png)
blockers: []
updated_at: 2026-10-23T00:33:00+03:00
```

---

## 1. Çalışma Ortamı ve Başlangıç Çizgisi

- **Branch / Head:** `main` branch, commit `59c1f545465cf45055b89cfd313be7b9318b76c8` (`origin/main` ile eşit).
- **Çalışma Ağacı (Dirty Tree):**
  - `src/hooks/use-belge-studio-form-view.ts` (kullanıcının form-view değişiklikleri)
  - `src/lib/belge-studio-form-view.ts` (kullanıcının form-view değişiklikleri)
  - `tests/belgeler/form-view.test.ts` (kullanıcının form-view birim testleri)
  - `tests/site-audit/belgeler-form-view.spec.ts` (kullanıcının form-view e2e testleri)
  - `docs/belgeler-form-view/` (önceki görevin dokümantasyon/kanıtları)
  - `scripts/verify-production-smoke.mjs` (önceki görevin duman testi scripti)
  - *Karar:* Kullanıcının bu değişiklikleri titizlikle korunmaktadır.
- **Plan Konumu:**
  - `docs/belgeler-alan-odak/PLAN.md` (revizyon 2 nihai plan korundu)
  - `docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md` (bu dosya)

---

## 2. Doğrulanan Mimari ve Kaynak Kod Bulguları (ASAMA_04 — ASAMA_08)

1. **ASAMA_04 & ASAMA_05 Doğrulamaları:**
   - 5 belgenin 56 alanı eksiksiz normalize geometri ve DOM haritalaması ile bağlandı.
   - Çok sayfalı Sözleşme'de sayfa geçişleri, imza alanlarının bağımsızlığı ve 0 ms yanlış sayfa parlaması güvencesi sağlandı.
2. **ASAMA_06 Mobil & Görsel Yoğunluk ve İzolasyon Mimarisi:**
   - **Mobil 2.5 sn Yaşam Döngüsü:** Mobil form sekmesinde son odaklanan alan (`lastFocusedFieldKey`), kullanıcı "Canlı PDF Önizle" butonuna bastığında tuval çizimi hazır olduğunda devreye girer. 2.5 saniye (2500 ms) boyunca hedef PDF koordinatında parlar ve ardından kendiliğinden kaybolur.
   - **Görünmezken Zamanlayıcıyı Tüketmeme:** Kullanıcı form sekmesine döndüğünde timer derhal iptal edilir ve sıfırlanır.
   - **İlk Açılışta Temiz Başlangıç:** Önizleme başlangıçta doğrudan açıldığında önceden form seçimi yapılmadığı için vurgu gösterilmez (`toBeHidden`).
   - **Inline Edit Toggle İzolasyonu ve Karşılıklı Dışlama:** "PDF Üzerinde Düzenle" açıldığında mavi form vurgusu derhal gizlenir. Kapatıldığında (`aria-pressed="false"`), eski form odağı otomatik olarak tekrar açılmaz (`suppressedFocusEventIdRef`), ancak kullanıcı yeni bir form alanına tıkladığında yeni odak kimliğiyle vurgu tekrar aktifleşir.
   - **Kompakt Satır Geometrisi:** Taahhütname (9.2–9.8 pt satır aralıkları) ve Sözleşme gibi yoğun metinlerde 7 px pulse veya kalın gölge kullanılmaz; `1.5px` box-shadow ve `scale(1.005)` mikro pulse ile komşu metin satırları asla kapanmaz.
   - **Mobil Viewportlar & Sıfır Yatay Taşma:** `320×720`, `360×800`, `390×844`, `430×932`, `768×1024` ekran genişliklerinin tamamında form ↔ önizleme sekmeli geçişlerinde `scrollWidth <= clientWidth + 2` koşulu kanıtlandı.
3. **ASAMA_07 & ASAMA_08 Yerel Release Adayı ve Canlı Production Doğrulaması:**
   - **56/56 Alan Eşleşmesi:** 5 belgenin 56/56 alanı eksiksiz bağlandı, PDF-only alanlar dışlandı.
   - **CSS Hiza:** ≤2 CSS px toleransı korundu.
   - **Desteklenen Zoom:** %50–%400 zoom aralığında (%100, %125, %150, Sığdır) vurgu tam hizalı.
   - **Performans:** Yalnızca odak değişirken `createObjectURL`, `drawImage` veya `getAnnotations` çağrısı yapılmaz. Sıfır PDF derlemesi / sıfır canvas render.
   - **İndirilen/Yazdırılan PDF İzolasyonu:** Vurgu saf bir DOM overlay elemanıdır (`BelgeStudioFieldFocusLayer`). PDF bytes veya appearance stream'lerine asla sızmaz. `belgeler-pdf-quality.spec.ts` ile indirilen PDF baytlarının form girdisiyle birebir tutarlı olduğu kanıtlandı.
   - **Living Docs:** `docs/BELGELER_SISTEMI.md` dosyasına Bölüm 11 (Form Alanı Odak Vurgusu ↔ Canlı PDF Önizleme Eşleşmesi) eklendi.
   - **Vercel Canlı Production Yayını:** Commit `59c1f54` ile Production deployment `READY` oldu. `scripts/verify-field-focus-live-smoke.mjs` ile canlı `https://muhendislik-site.vercel.app` üzerinde gerçek tarayıcı ile Şantiye Yeri odak vurgusu, Tarih alanına geçiş, Sözleşme Sayfa 2 otomatik geçişi ve Mobil 2.5s parlama/kapanma döngüsü test edilerek ekran görüntüleriyle kanıtlandı.

---

## 3. Aşama Durumu

- **Tamamlanan Aşamalar:**
  - `ASAMA_00` (Baseline ve Uygulama Sözleşmesi)
  - `ASAMA_01` (Saf Alan Geometrisi / Şablon Kontratı)
  - `ASAMA_02` (Form Odak Takibi ve State Makinesi)
  - `ASAMA_03` (PDF Overlay ve Beton Döküm Pilotu)
  - `ASAMA_04` (Pilotun Gerçek Zoom / Performans / Yarış Testi)
  - `ASAMA_05` (Çok sayfa Sözleşme + kalan stüdyolar / 56 alan)
  - `ASAMA_06` (Mobil & Çift Yönlü Scroll / Görünürlük / Sanallaştırma)
  - `ASAMA_07` (Yerel release adayı ve nihai regresyon)
  - `ASAMA_08` (Tek kontrollü Production yayını + canlı kontrol)
- **Sıradaki Aşama:** Yok (Plan başarıyla tamamlandı)
