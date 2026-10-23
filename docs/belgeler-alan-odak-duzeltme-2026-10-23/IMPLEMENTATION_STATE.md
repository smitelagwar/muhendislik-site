# BELGELER — Form ↔ PDF Alan Odağı Düzeltme Uygulama Durumu

```yaml
plan_id: BELGELER_FORM_PDF_FOCUS_FIX_V1
execution_status: TAMAMLANDI # BASLAMADI | DEVAM_EDIYOR | ENGELLI | TAMAMLANDI
active_stage: null
next_stage: null
completed_stages:
  - D00
  - D01
  - D02
  - D03
  - D04
  - D05
baseline_head: 9cf0a95e819e1b545791c8ac7184a051758d1835
tested_head: 9cf0a95e819e1b545791c8ac7184a051758d1835
tested_worktree_description: "main branch + kullanıcının form-view dosyaları titizlikle korunmuş + D00 baseline/repro + D01 B01 + D02 B02/B03/B04 + D03 B05/B06 + D04 B07/B08/B09 + D05 B10 ve production build doğrulaması"
build_id: yBouNDP-SHr6m4GN97fDH
findings:
  B01: COZULDU # Toolbar sonrası ilgisiz butona geçişte 120ms debounce ile fieldKey temizleniyor; toolbar'dan aynı alana dönüldüğünde yeni focusEventId üretiliyor
  B02: COZULDU # userManualPageChoiceRef eventId'ye bağlandı; kullanıcı elle seçtiği sayfada aynı odakta kalır, yeni odak geldiğinde hedef sayfaya sorunsuz geçilir
  B03: COZULDU # CLEAR_SELECTION (Esc, Reset, Clear) clearEventId üretir; BelgeStudioPdfPreview aktif mobil vurgu, timer ve bekleyen işleri anında iptal eder
  B04: COZULDU # Mobil flash tek başlangıç yoluna (useEffect) bağlandı; 2.5s sayacı render/loading sürerken değil, tuval hazır ve görünür olduğunda başlar
  B05: COZULDU # Geçici annotation hatasında boş {} cache'lenmez; kontrollü 2 retry hakkı ve async stale guard eklendi; sabit geometri şablon sözleşmesi kanıtlandı
  B06: COZULDU # Aynı sayfada yinelenen widget alanı tamamen elenir; normalize koordinatlarda sayfa kesişimi ile left+width <= 1.0 matematiksel güvenceye alındı
  B07: COZULDU # window.pdfjsLib Proxy facade ile sarmalandı; dondurulmuş ESM modül nesnesini bozmadan getAnnotations çağrıları başarıyla sayılıyor ve pozitif başlangıç iddiası doğrulandı
  B08: COZULDU # 6 ondalıklı kanonik rects ile Beton ve 5 belgenin 56 alanının tamamı bağımsız PDF.js annotasyon oracle'ına bağlandı; tolerans <= 2.0 CSS px sınırına çekildi ve left, top, width, height kontrolü sağlandı
  B09: COZULDU # verify-field-focus-live-smoke.mjs içinde data-field-key, data-page ve isHidden doğrulamaları zorunlu kılındı; hata durumunda açık throw, finally bloğunda browser.close() ve nonzero exit code güvenceye alındı
  B10: COZULDU # docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md içindeki commit SHA (59c1f54f50d2b090f5090b159b6aa9396655c55d) düzeltildi; docs/BELGELER_SISTEMI.md içindeki Bölüm 11 gerçek kodla eşitlendi (onClearFieldFocus, AcroForm retry, clamp, 2.5s hazır tuval, test komutları)
evidence:
  - stage: D00
    finding: BASELINE
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "134/134 test passed, 24 suites (2.74s); Poppler pdftoppm görsel denetimi geçti"
  - stage: D00
    finding: BASELINE
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Sıfır derleme hatası, exit code 0"
  - stage: D00
    finding: BASELINE
    command_or_case: npx tsx --test tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "34/34 mevcut birim testleri passed (1.17s)"
  - stage: D00
    finding: "B01 & B06"
    command_or_case: npx tsx --test tests/belgeler/field-focus-repro.test.ts
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "3 testten 3'ü beklenen şekilde FAIL (Kırmızı başlangıç kanıtlandı: B06 aynı sayfa duplicate rects'ten çıkarılmıyor, B06 left+width=1.01 > 1.0 aşımı engellenmiyor, B01 toolbar sonrası aynı alana odaklanmada focusEventId artmıyor)"
  - stage: D00
    finding: B01
    command_or_case: "Audit script / reduceFieldFocus analizi"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "Toolbar'a geçişte blur iptal ediliyor; ardından ilgisiz butona geçildiğinde form blur üretmiyor; aynı alana tıklandığında focusEventId artmadığından suppressed kalıyor"
  - stage: D00
    finding: B02
    command_or_case: "Audit script / userManualPageChoiceRef analizi"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "Mobil Sözleşme'de elle sayfa 2 seçildiğinde, sonraki form sekmesinde sayfa 1 alanı seçilse bile userManualPageChoiceRef sıfırlanmadığı için sayfa 1'e geçiş engelleniyor"
  - stage: D00
    finding: B03
    command_or_case: "Audit script / clearSelection analizi"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "Mobil preview sekmesinde Esc tuşuna basıldığında hook temizleniyor ancak BelgeStudioPdfPreview içindeki mobileHighlightKey ve 2.5s timer temizlenmiyor"
  - stage: D00
    finding: B04
    command_or_case: "Gecikmeli PDF render simülasyonu"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "Çizim 3.5s geciktirildiğinde 2.5s timer erken başlayarak çizim bitmeden (t=3503ms) sönüyor; yeni tuval çıktığında vurgu 0ms görünüyor"
  - stage: D00
    finding: B05
    command_or_case: "getAnnotations hata enjeksiyonu"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "İlk getAnnotations çağrısı başarısız olduğunda boş {} kalıcı olarak cache'leniyor ve sonraki başarılı revizyonlarda bir daha denenmiyor"
  - stage: D00
    finding: B06
    command_or_case: "Sentetik duplicate & overflow kontrolü"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "Aynı sayfadaki duplicate widget extractor tarafından rects içinde bırakılıyor; left+width=1.01 kutusu kabul ediliyor"
  - stage: D00
    finding: B07
    command_or_case: "Playwright ESM namespace instrumentation"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "window.pdfjsLib nesnesi non-extensible olduğundan getDocument override sessizce başarısız oluyor; sayaç 0 kalıp test 0===0 ile geçiyor"
  - stage: D00
    finding: B08
    command_or_case: "Mevcut E2E test toleransı ve kapsam analizi"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "Beton hiza testi 2.5px tolerans kullanıyor (sözleşme <=2px); 56 alan döngüsü bağımsız annotation oracle doğrulaması yapmıyor"
  - stage: D00
    finding: B09
    command_or_case: "scripts/verify-field-focus-live-smoke.mjs analizi"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "isHidden=false dalı başarı mesajını engellemiyor; catch içindeki process.exit(1) finally cleanup'ını atlayıp açık process bırakabiliyor"
  - stage: D00
    finding: B10
    command_or_case: "Git nesne kontrolü ve dokümantasyon karşılaştırması"
    result: FAIL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835
    path_or_summary: "tested_commit 59c1f545465cf45055b89cfd313be7b9318b76c8 git nesnesi olarak mevcut değil (gerçek SHA: 59c1f54f50d2b090f5090b159b6aa9396655c55d); docs/BELGELER_SISTEMI.md içinde var olmayan onClearFieldFocus prop'u bulunuyor"
  - stage: D01
    finding: B01
    command_or_case: npx tsx --test tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "37/37 test passed (8 suite); yeni B01 yaşam döngüsü testleri (FORM_BLUR sonrası aynı alana dönüşte focusEventId artışı, toolbar->Yazdır geçişinde 120ms debounce ile temizlenme, daraltılmış isBelgePreviewControl seçici testi) eksiksiz geçti"
  - stage: D01
    finding: B01
    command_or_case: npx tsx --test tests/belgeler/field-focus-repro.test.ts
    result: PARTIAL
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "B01 testi başarıyla PASS oldu; D03 kapsamındaki B06 testleri planlandığı gibi kırmızı kalmaya devam ediyor"
  - stage: D01
    finding: B01
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 TypeScript hatası, exit code 0"
  - stage: D01
    finding: B01
    command_or_case: npx eslint src/lib/belge-field-focus.ts src/hooks/use-belge-field-focus.ts tests/belgeler/field-focus.test.ts tests/belgeler/field-focus-repro.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 lint hatası, exit code 0"
  - stage: D02
    finding: "B02, B03, B04"
    command_or_case: npx tsx --test tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "41/41 test passed (9 suite); B02 manuel sayfa seçimi yaşam döngüsü, B03 CLEAR_SELECTION / clearEventId iptal güvencesi, B04 mobil görünür tuval 2.5s zamanlama kontratı ve iptal sonrası gecikmiş render guard testleri eksiksiz geçti"
  - stage: D02
    finding: "B02, B03, B04"
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 TypeScript hatası, exit code 0"
  - stage: D02
    finding: "B02, B03, B04"
    command_or_case: npx eslint src/lib/belge-field-focus.ts src/hooks/use-belge-field-focus.ts src/components/belge-studio-pdf-preview.tsx src/components/beton-dokum-studio.tsx src/components/insaat-ruhsati-studio.tsx src/components/istifa-studio.tsx src/components/sozlesme-studio.tsx src/components/taahhutname-studio.tsx tests/belgeler/field-focus.test.ts tests/belgeler/field-focus-repro.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 lint hatası, 0 uyarı, exit code 0"
  - stage: D03
    finding: "B05, B06"
    command_or_case: npx tsx --test tests/belgeler/field-focus-repro.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "3/3 repro testi PASS (B06 aynı sayfa duplicate reddi ve left+width<=1.0 sınır kontratı yeşile döndü)"
  - stage: D03
    finding: "B05, B06"
    command_or_case: npx tsx --test tests/belgeler/field-focus.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "45/45 test passed (10 suite); B05 geçici hatadan recovery, B05 5 şablonda sabit geometri kanıtı, B06 aynı sayfa duplicate eleme ve kesişim normalizasyonu testleri eksiksiz geçti"
  - stage: D03
    finding: "B05, B06"
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "148/148 test passed, 27 suites (4.4s); Poppler görsel denetimi eksiksiz geçti, sıfır hata"
  - stage: D03
    finding: "B05, B06"
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 TypeScript hatası, exit code 0"
  - stage: D03
    finding: "B05, B06"
    command_or_case: npx eslint src/lib/belge-field-focus.ts src/hooks/use-belge-field-focus.ts src/components/belge-studio-pdf-preview.tsx src/components/beton-dokum-studio.tsx src/components/insaat-ruhsati-studio.tsx src/components/istifa-studio.tsx src/components/sozlesme-studio.tsx src/components/taahhutname-studio.tsx tests/belgeler/field-focus.test.ts tests/belgeler/field-focus-repro.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 lint hatası, 0 uyarı, exit code 0"
  - stage: D04
    finding: "B07, B08, B09"
    command_or_case: npx eslint tests/site-audit/belgeler-field-focus.spec.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 lint hatası, 0 uyarı, exit code 0"
  - stage: D04
    finding: "B07, B08, B09"
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "0 TypeScript derleme hatası, exit code 0"
  - stage: D04
    finding: B09
    command_or_case: $env:SMOKE_URL="http://127.0.0.1:9999"; node scripts/verify-field-focus-live-smoke.mjs
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Hatalı URL / bağlantı reddi durumunda script beklendiği gibi hata yakaladı, browser'ı kapattı ve nonzero (exit code 1) döndürdü (B09 başarısızlık doğrulaması sağlandı)"
  - stage: D04
    finding: "B01-B09"
    command_or_case: npx tsx --test tests/belgeler/*.test.ts
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "148/148 test passed, 27 suites (3.6s); tüm form odak regresyonları yeşil"
  - stage: D05
    finding: B10
    command_or_case: git cat-file -e 59c1f54f50d2b090f5090b159b6aa9396655c55d
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Commit SHA git veri tabanında doğrulandı; docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md güncellendi"
  - stage: D05
    finding: B10
    command_or_case: docs/BELGELER_SISTEMI.md Bölüm 11 dokümantasyon doğrulaması
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "onClearFieldFocus prop'u, Escape dinleyicisi, AcroForm geçici hata retry, geometri kesişim sınırlama ve hazır tuval mobil zamanlaması yaşayan dokümanda kodla birebir eşitlendi"
  - stage: D05
    finding: FINAL_QUALITY
    command_or_case: npx eslint src/lib/belge-field-focus.ts src/hooks/use-belge-field-focus.ts src/components/belge-studio-pdf-preview.tsx src/components/beton-dokum-studio.tsx src/components/insaat-ruhsati-studio.tsx src/components/istifa-studio.tsx src/components/sozlesme-studio.tsx src/components/taahhutname-studio.tsx tests/belgeler/field-focus.test.ts tests/belgeler/field-focus-repro.test.ts tests/site-audit/belgeler-field-focus.spec.ts scripts/verify-field-focus-live-smoke.mjs
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Tüm değiştirilen dosyalarda 0 lint hatası, 0 uyarı"
  - stage: D05
    finding: FINAL_QUALITY
    command_or_case: npm run check:belgeler-pdf
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "148/148 test passed, 27 suites (4.6s); Poppler pdftoppm görsel denetimi geçti"
  - stage: D05
    finding: FINAL_QUALITY
    command_or_case: npx tsc -p tsconfig.next.json --noEmit --incremental false
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Sıfır derleme hatası, exit code 0"
  - stage: D05
    finding: FINAL_PRODUCTION_BUILD
    command_or_case: npm run build
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Next.js webpack build başarıyla tamamlandı (627 statik/dinamik sayfa derlendi, exit code 0)"
  - stage: D05
    finding: FINAL_SMOKE
    command_or_case: node scripts/verify-field-focus-live-smoke.mjs (port 3333 production artifact)
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Canlı Next.js production sunucusunda beton döküm masaüstü odak rect ve mobil 3sn otomatik kaybolma senaryoları tam doğrulandı; ekran görüntüleri kaydedildi"
  - stage: D05
    finding: FINAL_E2E
    command_or_case: npx playwright test tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1366
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "18/18 test passed (48.8s); Proxy facade, 5 belgede 56 alan kanonik oracle <=2px DOM hizalaması eksiksiz geçti"
  - stage: D05
    finding: FINAL_E2E
    command_or_case: npx playwright test tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1920
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "18/18 test passed (50.1s); geniş ekranda 56 alan kanonik oracle ve yaşam döngüsü testleri eksiksiz geçti"
  - stage: D05
    finding: FINAL_E2E_MOBILE
    command_or_case: npx playwright test tests/site-audit/belgeler-field-focus.spec.ts -g "ASAMA_06" --project=chromium-mobile-390
    result: PASS
    commit_or_worktree: 9cf0a95e819e1b545791c8ac7184a051758d1835+dirty
    path_or_summary: "Mobil 390px görünümde sekme geçişi ve 2.5s hazır tuval kaybolma testi eksiksiz geçti"
blockers: []
updated_at: 2026-10-23
```

---

## 1. Başlangıç Çizgisi ve Çalışma Ortamı

- **Git HEAD:** `9cf0a95e819e1b545791c8ac7184a051758d1835` (`origin/main` ile eşit).
- **Özelliğin Gerçek Commit'i:** `59c1f54f50d2b090f5090b159b6aa9396655c55d`.
- **Korunan Kirli Dosyalar (Uncommitted User Files):**
  - `src/hooks/use-belge-studio-form-view.ts`
  - `src/lib/belge-studio-form-view.ts`
  - `tests/belgeler/form-view.test.ts`
  - `tests/site-audit/belgeler-form-view.spec.ts`
  - `docs/belgeler-form-view/evidence/production-live-smoke.png`
  - `scripts/verify-production-smoke.mjs`
  - *Karar:* Kullanıcının bu dosyalarına kesinlikle dokunulmamış, geri alınmamış ve stash yapılmamıştır.
- **Görev Planı ve Durum Dosyaları:**
  - `docs/belgeler-alan-odak-duzeltme-2026-10-23/PLAN.md`
  - `docs/belgeler-alan-odak-duzeltme-2026-10-23/IMPLEMENTATION_STATE.md`

---

## 2. Bulguların Durumu (D05 Sonucu — TÜMÜ ÇÖZÜLDÜ)

- **B01:** ÇÖZÜLDÜ —
  - `src/lib/belge-field-focus.ts`: `FocusState` içine `isFormFocused` takibi eklendi. `reduceFieldFocus` içinde `FORM_BLUR` eylemiyle form odağının kaybolduğu ancak bağlamsal `fieldKey` vurgusunun korunduğu durum modellendi. Kullanıcı toolbar veya form dışından AYNI alana geri döndüğünde (`isReturningToField = !state.isFormFocused`), yeni `focusEventId` üretilmesi güvenceye alındı. `isBelgePreviewControl` seçicisindeki aşırı geniş `[role="toolbar"]` kaldırılarak yalnız stüdyoya ait önizleme bileşenleri allowlist'e alındı.
  - `src/hooks/use-belge-field-focus.ts`: Form scroll kabı blur olduğunda `FORM_BLUR` tetiklenmesi sağlandı. `studioRootRef` üzerine `focusin` ve `focusout` dinleyicileri eklenerek, odak önizleme araç çubuğundan Yazdır/İndir veya stüdyo dışı butonlara kaydığında 120 ms blur debounce penceresi çalıştırılarak `fieldKey`'in temizlenmesi sağlandı.
  - Doğrulama: `tests/belgeler/field-focus.test.ts` (37/37 pass) ve `tests/belgeler/field-focus-repro.test.ts` (B01 pass).
- **B02:** ÇÖZÜLDÜ —
  - `src/components/belge-studio-pdf-preview.tsx`: `userManualPageChoiceRef` yapısı `{ page: number; eventId: number } | null` olarak yeniden modellendi. Kullanıcı önizlemede elle sayfa değiştirdiğinde tercih geçerli odak kimliğiyle (`eventId`) saklanır; veri revizyonlarında korunur. Form sekmesinde yeni bir alana odaklanıldığında (`focusEventId !== manualChoice.eventId`), eski manuel tercih sıfırlanarak hedef sayfa otomatik olarak açılır.
- **B03:** ÇÖZÜLDÜ —
  - `src/lib/belge-field-focus.ts`: `CLEAR_SELECTION` eylemi `clearEventId` nonce'ı üretir ve hem `fieldKey` hem `lastFocusedFieldKey` değerlerini `null` yapar.
  - `src/hooks/use-belge-field-focus.ts`: `window` seviyesinde `Escape` dinleyicisi eklenerek stüdyo içindeki ve body'ye düşen odaklarda `clearSelection()` tetiklenmesi sağlandı.
  - `src/components/belge-studio-pdf-preview.tsx`: `onClearFieldFocus` prop kontratı eklendi ve 5 stüdyodan bağlandı. İptal durumunda (`currentClearEventId` veya `isSelectionCleared`) `mobileTimerRef`, `mobileHighlightKey` ve tüm bekleyen flash/reveal işleri derhal iptal edilir. İptal sonrasında tamamlanan gecikmiş render'ların vurguyu geri getirmesi engellendi.
- **B04:** ÇÖZÜLDÜ —
  - `src/components/belge-studio-pdf-preview.tsx`: `renderPage` içindeki çift başlangıç kaldırıldı; mobil flash için tek başlangıç yolu `useEffect` yapıldı.
  - 2500 ms sayacı yükleme (`showLoading`), hata (`visibleError`) veya sayfa uyuşmazlığı sürerken kesinlikle başlatılmaz; hedef tuval çizilip `localStatus === "ready"` olduğunda başlar.
  - Mobil modda `activeFieldKey` yalnızca `mobileHighlightKey` döner; timer bitince aktif `fieldKey` fallback'i ile vurgunun kalıcılaşması engellendi.
  - Son Codex denetiminde forma dönüşün tüketilmiş seçim kimliğini sıfırlaması düzeltildi; yeni gerçek odak olmadan eski alan tekrar parlamaz.
- **B05:** ÇÖZÜLDÜ —
  - `src/components/belge-studio-pdf-preview.tsx`: `extractGeometry` içinde başarı, kısmi hata ve geçici hata durumları ayrıştırıldı. Hata veya boş `{}` sonucu kalıcı cache'e yazılmaz; bir sonraki revizyonda kontrollü retry hakkı tanınır (maksimum 2 deneme). `isMountedRef` ve `documentRef.current !== pdf` kontrolleriyle async stale race condition'lar engellendi. Şablon değiştiğinde eski geometri cache'i sıfırlanır. Beş belgenin tamamında farklı veri revizyonlarında widget geometrisinin sabit kaldığı testle kanıtlandı.
- **B06:** ÇÖZÜLDÜ —
  - `src/lib/belge-field-focus.ts`: `extractFieldFocusRects` içinde aynı sayfadaki ham annotasyonlar taranarak birden fazla tanımlanan alanlar tespit edilir ve belirsizlik olarak `duplicateKeys` kümesine eklenir; hem aynı sayfa hem sayfalar arası yinelenen anahtarların tüm konumları `rects` haritasından tamamen elenir.
  - `[0, 0, 1, 1]` sayfa sınırları ile gerçek kesişim dikdörtgeni hesaplanarak `left + width <= 1.0` ve `top + height <= 1.0` kesin matematiksel olarak güvenceye alındı; sub-pixel taşmaları elendi.
- **B07:** ÇÖZÜLDÜ —
  - `tests/site-audit/belgeler-field-focus.spec.ts`: Dondurulmuş/sealed ESM modülü `window.pdfjsLib`'i yerinde mutasyona uğratmak yerine saydam `Proxy` katmanı ile sarmalandı (`getDocument` -> `task` -> `promise` -> `pdf` -> `getPage` -> `page` -> `getAnnotations`).
  - Pozitif sayaç güvencesi `expect(initialMetrics.getAnnotationsCount).toBeGreaterThan(0)` eklendi; metriklerin sessizce 0===0 geçmesi engellendi.
- **B08:** ÇÖZÜLDÜ —
  - `tests/site-audit/belgeler-field-focus.spec.ts`: `BETON_CANONICAL_RECTS` 6 ondalıklı tam koordinatlara (`extractFieldFocusRects` ile birebir eşleşen) güncellendi.
  - Nihai DOM konum testi toleransı gevşetilmiş 2.5px'ten sözleşmeye uygun `<= 2.0 CSS px` sınırına çekildi; `left`, `top`, `width` ve `height` için eksiksiz doğrulandı.
  - 5 belgenin tamamındaki 56 düzenlenebilir alan için `ALL_DOCUMENT_CANONICAL_RECTS` oracle haritası tanımlandı; her alan için `data-field-key`, `data-page` ve normalize geometri kontratı bağlandı.
- **B09:** ÇÖZÜLDÜ —
  - `scripts/verify-field-focus-live-smoke.mjs`: `data-field-key` ve `data-page` nitelik kontrolleri eklendi; mobil 3sn bekleme sonrası `isHidden === false` olduğunda açıkça hata fırlatılması sağlandı.
  - `catch` içinde erken `process.exit(1)` kaldırılarak tarayıcı temizliği `finally { if (browser) await browser.close(); process.exit(exitCode); }` içine alındı; 60 saniyelik emniyet zamanlayıcısı eklendi.
  - Hatalı koşulda (`SMOKE_URL="http://127.0.0.1:9999"`) nonzero çıkış kodu üretildiği canlı testle kanıtlandı.
- **B10:** ÇÖZÜLDÜ —
  - `docs/belgeler-alan-odak/IMPLEMENTATION_STATE.md`: Typo commit SHA (`59c1f545...`) gerçek git commit'i olan `59c1f54f50d2b090f5090b159b6aa9396655c55d` ile düzeltildi; audit ve düzeltme planına referans eklendi.
  - `docs/BELGELER_SISTEMI.md`: Bölüm 11 baştan sona güncellenerek var olan `onClearFieldFocus` prop kontratı, AcroForm 2-retry ve geometri kesişim sınırlaması, Escape dinleyicisi, hazır tuval 2.5s sayacı ve güncel test komutları yazıldı.

---

## 3. Aşama Durumu

- **Tamamlanan Aşamalar:** `D00`, `D01`, `D02`, `D03`, `D04`, `D05`
- **Sıradaki Aşama:** Yok (Plan TAMAMLANDI)


## 4. Son Codex denetimi — 23 Ekim 2026

Kullanıcının son isteğiyle kalan uygulama ve test açıkları doğrudan düzeltildi. Güncel kaynak/test sonucu için [FINAL_AUDIT.md](./FINAL_AUDIT.md) esas alınır; yukarıdaki D00–D05 sonuçları tarihsel kayıttır. Son production build: `yBouNDP-SHr6m4GN97fDH`. PDF kapısı 144/144; odak kabulü 54/54; mevcut desktop inline/PDF quality 33; mobil inline 9 PASS. Genel repo TypeScript baseline hataları ve Windows'ta xdotool isteyen iki eski test ayrıca açıkça kaydedildi. Commit/push/deploy yapılmadı; yeni aşama veya plan yok.
