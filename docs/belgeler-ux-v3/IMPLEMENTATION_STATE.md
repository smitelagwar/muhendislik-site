# IMPLEMENTATION STATE — BELGELER UX V3

```yaml
plan_id: BELGELER_UX_SECTION_DRAFT_FOCUS_2026_10_V3
plan_revision: 3
planning_status: PLAN_HAZIR
execution_status: YEREL_KABUL_GECTI
active_stage: null
next_stage: ASAMA_10
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
  - ASAMA_09
evidence:
  - stage: ASAMA_00
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "144/144 birim ve sözleşme testi başarılı; 6 sayfa PDF görsel koruma denetimi onaylandı."
  - stage: ASAMA_00
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Next.js üretim kaynakları için TypeScript tip denetimi sıfır hatayla geçti."
  - stage: ASAMA_00
    command_or_case: "tests/site-audit/belgeler-field-focus.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "18/18 E2E test başarılı (56 alan, zoom, toolbar odak, mobil geçiş, multi-page Sözleşme)."
  - stage: ASAMA_00
    command_or_case: "tests/site-audit/belgeler-form-view.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "8/8 E2E test başarılı (5 stüdyo form görünümü, reflow, mobil işlemler, tablet fit)."
  - stage: ASAMA_01
    command_or_case: "npx tsx --test tests/belgeler/belge-draft-storage.test.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "15/15 birim testi PASS: Türkçe/emoji/uzun metin, temiz/boş snapshot, 56 alan, wrong-doc, bad JSON, proto/constructor guard, missing/extra alan, invalid types, fingerprint mismatch, 64KiB±1B, 30gün±1ms age, storage errors & read-back mismatch, concurrency conflict, device vs session namespace ayrılığı, consent lifecycle."
  - stage: ASAMA_01
    command_or_case: "npx eslint src/lib/belge-ux-config.ts src/lib/belge-draft-storage.ts tests/belgeler/belge-draft-storage.test.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Sıfır hata ve sıfır uyarı ile lint başarılı."
  - stage: ASAMA_01
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Yeni yapılandırma ve depolama modülleri ile Next.js üretim tip denetimi sıfır hatayla geçti."
  - stage: ASAMA_01
    command_or_case: "npx tsx --test tests/belgeler/*.test.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Toplam 27 suite ve 159/159 test sıfır hatayla geçti."
  - stage: ASAMA_02
    command_or_case: "tests/site-audit/belgeler-auto-draft-pilot.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "6/6 E2E pilot testi PASS: sıfır PII başlangıç, ilk editle izin şeridi ve 'Kaydetme' hafızası, 800ms debounce ile tek snapshot kaydı, reload sonrası 'Taslağı Yükle' atomik kurtarma, 'Şimdilik Kapat' ile eski taslağı koruyup autosave duraklatma, 'Temizle'/'Sıfırla' sonrası yeni snapshot kaydı ve Undo doğrulaması."
  - stage: ASAMA_02
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "159/159 birim testi ve 6 sayfa PDF görsel doğrulaması sıfır regresyonla geçti."
  - stage: ASAMA_02
    command_or_case: "npx eslint src/hooks/use-belge-auto-draft.ts src/components/belge-studio-draft-controls.tsx src/components/beton-dokum-studio.tsx tests/site-audit/belgeler-auto-draft-pilot.spec.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "React 19 hooks kuralları dahil sıfır hata ve sıfır uyarı ile lint başarılı."
  - stage: ASAMA_02
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Tip denetimi temiz çıkış koduyla (0) geçti."
  - stage: ASAMA_03
    command_or_case: "tests/site-audit/belgeler-auto-draft-concurrency.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "4/4 E2E concurrency testi PASS: Tab A ve Tab B arasında çakışma tespiti ve 'Diğer Sekmedekini Yükle' akışı, Tab A 'Bu Sekmedekiyle Devam Et' (takeover) ile devralma, taslak silindikten sonra pagehide/ayrılmada silinen taslağın dirilmesini engelleme (resurrection guard), session modunda kaydedilen taslağın sekmeler arası ve localStorage izolasyonu."
  - stage: ASAMA_03
    command_or_case: "npx tsx --test tests/belgeler/belge-draft-storage.test.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "15/15 depolama çekirdek birim testi başarılı."
  - stage: ASAMA_03
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "159/159 birim testi ve 6 sayfa PDF görsel koruma kontrolü sıfır hatayla geçti."
  - stage: ASAMA_03
    command_or_case: "npx eslint src/hooks/use-belge-auto-draft.ts tests/site-audit/belgeler-auto-draft-concurrency.spec.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Sıfır hata ve sıfır uyarı ile ESLint doğrulaması başarılı."
  - stage: ASAMA_03
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "TypeScript tip kontrolü sıfır hatayla geçti."
  - stage: ASAMA_04
    command_or_case: "tests/site-audit/belgeler-auto-draft-rollout.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "5/5 E2E rollout testi PASS: İnşaat Ruhsatı izin/debounce/restore/Randomize; İstifa Dilekçesi taslak kurtarma ve PDF-only statik etiketlerin korunması; Sözleşme tek snapshot atomik restore ile manuel imza override koruması; Taahhütname unvan/unvan_imza override koruması; Belge A ve Belge B arasında tam taslak izolasyonu."
  - stage: ASAMA_04
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "159/159 birim testi ve 6 sayfa PDF görsel doğrulaması sıfır regresyonla geçti."
  - stage: ASAMA_04
    command_or_case: "tests/site-audit/belgeler-auto-draft-pilot.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "6/6 Beton pilot testi başarılı."
  - stage: ASAMA_04
    command_or_case: "tests/site-audit/belgeler-auto-draft-concurrency.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "4/4 Concurrency testi başarılı."
  - stage: ASAMA_04
    command_or_case: "npx eslint src/components/*-studio.tsx src/hooks/use-belge-auto-draft.ts tests/site-audit/belgeler-auto-draft-rollout.spec.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Tüm stüdyolar ve yeni testler ESLint kontrolünden sıfır hata ve sıfır uyarı ile geçti."
  - stage: ASAMA_04
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Next.js tip denetimi temiz çıkış koduyla (0) geçti."
  - stage: ASAMA_05
    command_or_case: "npx tsx --test tests/belgeler/belge-studio-sections.test.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "5/5 birim testi PASS: Beton Döküm 10/10 alan tekil haritalama, findSectionForField, dolu alan sayacı boşluk hassasiyeti, tercih motoru save/load, bozuk veride all-open fallback."
  - stage: ASAMA_05
    command_or_case: "tests/site-audit/belgeler-accordion-pilot.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "7/7 E2E pilot testi PASS: 1. Varsayılan 4 bölüm açık ve dolu sayaçları tam; 2. Tek bölüm açma/kapatma aria-expanded ve hidden sınıfı; 3. Dolu sayacı anlık güncelleme (3/3 -> 2/3 -> 3/3); 4. Tümünü Kapat / Tümünü Aç ana kontrolleri; 5. Kalıcılık: Bölüm kapatma tercihi reload sonrası korunur; 6. Veri Bütünlüğü: Bölüm kapalıyken form verileri ve PDF senkronu kaybolmaz; 7. Kapalı bölümdeki bir alana odaklanıldığında bölüm otomatik genişletilir (revealField)."
  - stage: ASAMA_05
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "164/164 birim ve sözleşme testi PASS, 6 sayfa PDF görsel doğrulaması sıfır regresyonla geçti."
  - stage: ASAMA_05
    command_or_case: "npx eslint src/components/beton-dokum-studio.tsx src/components/belge-studio-section.tsx src/hooks/use-belge-studio-sections.ts src/lib/belge-studio-sections.ts src/lib/belge-section-preferences.ts tests/belgeler/belge-studio-sections.test.ts tests/site-audit/belgeler-accordion-pilot.spec.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "ESLint kontrolü sıfır hata ve sıfır uyarı ile geçti."
  - stage: ASAMA_05
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Next.js tip denetimi temiz çıkış koduyla (0) geçti."
  - stage: ASAMA_06
    command_or_case: "npx tsx --test tests/belgeler/belge-studio-sections.test.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "8/8 birim testi PASS: 5 belgenin 56 düzenlenebilir alanının tamamı tekil, çakışmasız ve eksiksiz haritalandı (Beton 10, Ruhsat 8, İstifa 10, Sözleşme 14, Taahhütname 14); İstifa PDF-only etiketleri bölümlere sızmadı; belgeler arası tercih izolasyonu doğrulandı."
  - stage: ASAMA_06
    command_or_case: "tests/site-audit/belgeler-accordion-rollout.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "5/5 E2E rollout testi PASS: 1. İnşaat Ruhsatı (4 bölüm açık, sayaçlar tam, Tümünü Aç/Kapat, reload tercihi); 2. İstifa Dilekçesi (3 bölüm açık, sayaçlar, kapalı bölüm verisi ve revealField ile otomatik açılma); 3. Sözleşme (4 bölüm açık, 8 alanlı İşyeri Bilgileri kapatma & reload kalıcılığı); 4. Taahhütname (3 bölüm açık, sayaç tepkisi ve unvan senkronu); 5. Belgeler arası akordeon tercih izolasyonu."
  - stage: ASAMA_06
    command_or_case: "tests/site-audit/belgeler-accordion-pilot.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "7/7 E2E pilot regresyon testi PASS."
  - stage: ASAMA_06
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "167/167 birim/sözleşme testi PASS, 6 sayfa PDF görsel doğrulaması sıfır regresyonla geçti."
  - stage: ASAMA_06
    command_or_case: "npx eslint src/components/*-studio.tsx src/components/belge-studio-section.tsx src/hooks/use-belge-studio-sections.ts src/lib/belge-studio-sections.ts src/lib/belge-section-preferences.ts tests/belgeler/belge-studio-sections.test.ts tests/site-audit/belgeler-accordion-rollout.spec.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "ESLint sıfır hata ve sıfır uyarı ile geçti."
  - stage: ASAMA_06
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "TypeScript tip kontrolü sıfır hatayla geçti."
  - stage: ASAMA_07
    command_or_case: "tests/site-audit/belgeler-pdf-focus-mode.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "6/6 E2E odak modu testi PASS: 1. Masaüstü (1366px) PDF odak açma/kapatma, WAI-ARIA aria-pressed, Formu Göster/PDF'ye Odaklan etiketleri ve w-full genişleme; 2. Form scrollTop ve aktif input odağının saklanması ve mod çıkışında güvenle geri yüklenmesi; 3. Responsive boyut değişimi (1280 -> 900 -> 1280) ile odak modunun otomatik sıfırlanması ve yeniden açılmaması; 4. Sıfır PDF byte oluşturma (odak geçişinde blobUrl değişmezliği); 5. Sözleşme 2 sayfalı navigasyon ve odak uyumu; 6. 390px mobil ekranda odak butonunun gizlenmesi ve sekmeli düzen koruması."
  - stage: ASAMA_07
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "167/167 birim/sözleşme testi PASS, 6 sayfa PDF görsel doğrulaması sıfır regresyonla geçti."
  - stage: ASAMA_07
    command_or_case: "npx eslint src/hooks/use-belge-studio-pdf-focus.ts src/components/belge-studio-icons.tsx src/components/belge-studio-preview-toolbar.tsx src/components/belge-studio-pdf-preview.tsx src/components/*-studio.tsx tests/site-audit/belgeler-pdf-focus-mode.spec.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "ESLint kontrolü sıfır hata ve sıfır uyarı ile geçti."
  - stage: ASAMA_07
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Next.js tip denetimi temiz çıkış koduyla (0) geçti."
  - stage: ASAMA_08
    command_or_case: "tests/site-audit/belgeler-studio-ux.spec.ts (chromium-desktop-1366)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree, PLAYWRIGHT_PRODUCTION_SERVER=0)"
    summary: "8/8 entegre senaryo ve stres testi PASS: 1. Tam döngü (izin, Türkçe adres kaydı, akordeon aç/kapat, PDF odak modu, reload ve restore); 2. Varsayılan şablon, Temizle sonrası boş snapshot, reload'da hortlamama ve Undo; 3. Cihaz/Sekme mod ayrımı, gizlilik/PII engeli ve bozuk depolama toleransı; 4. Çoklu sekme çakışması ve Takeover akışı; 5. Özel alan senkronizasyonu: Sözleşme ve Taahhütname manuel imza/unvan override koruması, 2. sayfa PDF navigasyonu; 6. Klavye erişilebilirliği: Space/Enter/Tab akışı, WAI-ARIA dinamik güncellemesi ve 44px dokunma ergonomisi; 7. 320px-1920px 7 farklı viewportta sıfır yatay taşma (scrollWidth <= innerWidth) ve mobil/masaüstü kontrolleri; 8. Stres kararlılığı: 50 ardışık UI etkileşiminde sıfır gereksiz PDF derlemesi ve blobUrl değişmezliği."
  - stage: ASAMA_08
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "167/167 birim/sözleşme testi PASS, 6 sayfa PDF görsel doğrulaması sıfır regresyonla geçti."
  - stage: ASAMA_08
    command_or_case: "npx eslint tests/site-audit/belgeler-studio-ux.spec.ts"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "ESLint kontrolü sıfır hata ve sıfır uyarı ile geçti."
  - stage: ASAMA_08
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Next.js tip denetimi temiz çıkış koduyla (0) geçti."
  - stage: ASAMA_09
    command_or_case: "npm run check:belgeler-pdf"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "167/167 birim/sözleşme testi PASS, 6 sayfa PDF görsel doğrulaması sıfır regresyonla geçti."
  - stage: ASAMA_09
    command_or_case: "npm run check:belgeler-inline-mobile"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "9/9 mobil düzenleme ve sheet E2E testi sıfır regresyonla geçti."
  - stage: ASAMA_09
    command_or_case: "npx tsc -p tsconfig.next.json --noEmit --incremental false"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Next.js üretim kaynakları için TypeScript tip denetimi sıfır hatayla geçti."
  - stage: ASAMA_09
    command_or_case: "npm run build"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Next.js üretim derlemesi (webpack + prebuild) 26.8 saniyede 627 sayfa temiz şekilde tamamlandı."
  - stage: ASAMA_09
    command_or_case: "Production Server Playwright UX Suites ($env:PLAYWRIGHT_PRODUCTION_SERVER=1)"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Gerçek production sunucusu üzerinde 4 hedef Playwright suite (belgeler-studio-ux 8/8, belgeler-pdf-focus-mode 6/6, belgeler-accordion-rollout 5/5, belgeler-auto-draft-rollout 5/5) toplam 24/24 PASS."
  - stage: ASAMA_09
    command_or_case: "docs/BELGELER_SISTEMI.md Güncellemesi & git diff --check"
    result: PASS
    tested_head_or_worktree: "9cf0a95e819e1b545791c8ac7184a051758d1835 (dirty worktree)"
    summary: "Bölüm 12 yaşayan mimari dokümanına 3 yeni özellik, depolama anahtarları, PII uyarıları ve test matrisi işlendi; git diff --check temiz çıkış koduyla (0) geçti."
blockers: []
base_remote_head: 9cf0a95e819e1b545791c8ac7184a051758d1835
base_local_head: 9cf0a95e819e1b545791c8ac7184a051758d1835
tested_worktree: "main (with local working tree preserved)"
release_commit: null
deployment_url: null
verified_at: "2026-10-23T10:00:00+03:00"
updated_at: "2026-10-23T10:00:00+03:00"
```

---

## Aşama İlerleme Tablosu

| Aşama | Tanım | Durum | Doğrulama Özeti |
|---|---|---|---|
| `ASAMA_00` | Yerel keşif, 56 alan haritası, baseline testleri, durum dosyası | **TAMAMLANDI** | Baseline testler: PDF (144 PASS), TS (0 hata), E2E Focus (18 PASS), E2E FormView (8 PASS) |
| `ASAMA_01` | Saf, iki modlu taslak/storage çekirdeği | **TAMAMLANDI** | 15/15 unit test PASS, ESLint temiz, TS temiz, genel PDF suite 159/159 PASS |
| `ASAMA_02` | Beton taslak pilot: izin, kayıt, recovery, durum UI | **TAMAMLANDI** | 6/6 E2E pilot PASS, check:belgeler-pdf (159/159 PASS), ESLint temiz, TS temiz |
| `ASAMA_03` | Veri kaybı kapısı: çoklu sekme ve lifecycle yarışları | **TAMAMLANDI** | 4/4 E2E concurrency PASS (çakışma, reload, takeover, resurrection guard, session mod ayrımı), 15/15 unit PASS, check:belgeler-pdf (159/159 PASS), ESLint temiz, TS temiz |
| `ASAMA_04` | Taslak sistemini kalan 4 stüdyoya yay | **TAMAMLANDI** | 5/5 stüdyo E2E rollout PASS (Ruhsat, İstifa, Sözleşme, Taahhütname, İzolasyon), check:belgeler-pdf (159/159 PASS), pilot E2E (6/6 PASS), concurrency E2E (4/4 PASS), ESLint temiz, TS temiz |
| `ASAMA_05` | Akordeon pilot: Beton bölümleri + tercih + dolu sayacı | **TAMAMLANDI** | 5/5 unit PASS, 7/7 E2E pilot PASS, check:belgeler-pdf (164/164 PASS), ESLint temiz, TS temiz |
| `ASAMA_06` | Akordeon diğer 4 stüdyo, 56/56 alan | **TAMAMLANDI** | 8/8 unit PASS (56/56 alan), 5/5 E2E rollout PASS, 7/7 E2E pilot PASS, check:belgeler-pdf (167/167 PASS), ESLint temiz, TS temiz |
| `ASAMA_07` | PDF odak modu, desktop toolbar ve state koruma | **TAMAMLANDI** | 6/6 E2E PASS (Desktop aç/kapat, state/scroll/focus koruma, 1280->900->1280 sıfırlama, sıfır PDF byte derleme, 2 sayfalı Sözleşme uyumu, 390px mobil gizlilik), check:belgeler-pdf (167/167 PASS), ESLint temiz, TS temiz |
| `ASAMA_08` | Entegre senaryolar, erişilebilirlik, mobil ve stres | **TAMAMLANDI** | 8/8 E2E PASS (Tam döngü, varsayılan/Temizle/Undo, gizlilik/bozuk veri toleransı, çoklu sekme takeover, özel alan senkronları, klavye/WAI-ARIA/44px, 7 viewport sıfır taşma, stres sıfır PDF derlemesi), check:belgeler-pdf (167/167 PASS), ESLint temiz, TS temiz |
| `ASAMA_09` | Tam yerel kabul, production build ve mimari kayıt | **TAMAMLANDI** | check:belgeler-pdf (167 PASS), check:belgeler-inline-mobile (9 PASS), tsc temiz, production build PASS, production server 4 E2E suite (24 PASS), BELGELER_SISTEMI.md Bölüm 12 güncel |
| `ASAMA_10` | Tek kontrollü Production release ve canlı smoke | BEKLIYOR | - |
