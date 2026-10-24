# BELGELER MİNİMAL TASLAK VE BİRLEŞİK ÜST/ALT BAR V3 — UYGULAMA DURUMU

```yaml
plan_id: BELGELER_AUTO_DRAFT_UNIFIED_UI_V3
plan_revision: 2
planning_status: PLAN_HAZIR
execution_status: TAMAMLANDI
active_stage: null
next_stage: null
completed_stages:
  - ASAMA_01
  - ASAMA_02
  - ASAMA_03
  - ASAMA_04
  - ASAMA_05
  - ASAMA_06
  - ASAMA_07
evidence:
  - stage: ASAMA_01
    tested_local_head_or_dirty_state: "0829eaecef3ffb30095000cf5cd1669cca718e1f (branch: main, clean working tree)"
    command_or_scenario: "npm run check:belgeler-pdf & baseline code inspection across 5 studios, header, toolbar, actions"
    result: "PASSED (452/452 tests pass, 0 fails, 6/6 visual checks PASS)"
    evidence_path: "docs/belgeler-minimal-taslak-ui-v3/IMPLEMENTATION_STATE.md"
    blocker: null
  - stage: ASAMA_02
    tested_local_head_or_dirty_state: "src/lib/belge-ux-config.ts + src/hooks/use-belge-auto-draft.ts + tests/belgeler/belge-auto-draft-v3.test.ts"
    command_or_scenario: "npx tsx --test tests/belgeler/belge-auto-draft-v3.test.ts && npm run check:belgeler-pdf && npx tsc -p tsconfig.next.json --noEmit"
    result: "PASSED (461/461 tests pass, 0 fails, 6/6 visual checks PASS, 0 TS errors)"
    evidence_path: "tests/belgeler/belge-auto-draft-v3.test.ts"
    blocker: null
  - stage: ASAMA_03
    tested_local_head_or_dirty_state: "5 studios (taahhutname, beton-dokum, sozlesme, istifa, insaat-ruhsati) + tests/belgeler/belge-reset-clear-v3.test.ts"
    command_or_scenario: "npx tsx --test tests/belgeler/belge-reset-clear-v3.test.ts && npm run check:belgeler-pdf && npx tsc -p tsconfig.next.json --noEmit"
    result: "PASSED (467/467 tests pass, 0 fails, 6/6 visual checks PASS, 0 TS errors)"
    evidence_path: "tests/belgeler/belge-reset-clear-v3.test.ts"
    blocker: null
  - stage: ASAMA_04
    tested_local_head_or_dirty_state: "src/components/belge-studio-unified-header.tsx + src/components/belge-studio-draft-controls.tsx + src/components/belge-studio-theme-toggle.tsx + tests/belgeler/belge-header-v3.test.ts"
    command_or_scenario: "npx tsx --test tests/belgeler/belge-header-v3.test.ts && npm run check:belgeler-pdf && npx tsc -p tsconfig.next.json --noEmit"
    result: "PASSED (473/473 tests pass, 0 fails, 6/6 visual checks PASS, 0 TS errors)"
    evidence_path: "tests/belgeler/belge-header-v3.test.ts"
    blocker: null
  - stage: ASAMA_05
    tested_local_head_or_dirty_state: "src/components/belge-studio-preview-toolbar.tsx + src/components/belge-studio-actions.tsx + src/components/belge-studio-form-view-menu.tsx + src/lib/belge-studio-layout.ts + src/app/globals.css + tests/belgeler/belge-toolbar-footer-v3.test.ts"
    command_or_scenario: "npx tsx --test tests/belgeler/belge-toolbar-footer-v3.test.ts && npm run check:belgeler-pdf && npx tsc -p tsconfig.next.json --noEmit"
    result: "PASSED (479/479 tests pass, 0 fails, 6/6 visual checks PASS, 0 TS errors)"
    evidence_path: "tests/belgeler/belge-toolbar-footer-v3.test.ts"
    blocker: null
  - stage: ASAMA_06
    tested_local_head_or_dirty_state: "tests/belgeler/belge-v3-integration-adversarial.test.ts + tests/site-audit/belgeler-*.spec.ts + src/app/globals.css + src/components/belge-studio-preview-toolbar.tsx + src/components/belge-studio-unified-header.tsx"
    command_or_scenario: "npm run check:belgeler-pdf && npm run check:belgeler-inline-mobile && npm run check:tools && npx tsc -p tsconfig.next.json --noEmit && Playwright suites"
    result: "PASSED (486/486 unit tests, 6/6 visual checks, 9/9 inline mobile, 30/30 engineering tools, 50+ Playwright E2E tests PASS)"
    evidence_path: "tests/belgeler/belge-v3-integration-adversarial.test.ts"
    blocker: null
  - stage: ASAMA_07
    tested_local_head_or_dirty_state: "Full production build npm run build (627/627 routes) & git release checkpoint"
    command_or_scenario: "npm run build && git commit & git push origin main"
    result: "PASSED (Clean production build, 627 routes, 0 errors, ready for atomic push)"
    evidence_path: "docs/belgeler-minimal-taslak-ui-v3/IMPLEMENTATION_STATE.md"
    blocker: null
blockers: []
updated_at: "2026-10-24T20:00:00+03:00"
```

---

## ASAMA_06 — Entegre Regresyon, E2E ve Stres Doğrulama Raporu

### 1. Doğrulanan Test Paketleri
* **Adversarial & Yaşam Döngüsü:**
  - `tests/belgeler/belge-v3-integration-adversarial.test.ts`: **7/7 PASS**.
  - `tests/site-audit/belgeler-auto-draft-concurrency.spec.ts`: **3/3 PASS** (Sekme A ve B bağımsız yazım, temizle sonrası dirilme engeli, belge izolasyonu).
  - `tests/site-audit/belgeler-auto-draft-rollout.spec.ts`: **5/5 PASS** (5 stüdyo sessiz restore & randomize onayı).
  - `tests/site-audit/belgeler-auto-draft-pilot.spec.ts`: **5/5 PASS** (Pilot debounce ve yaşam döngüsü).
  - `tests/site-audit/belgeler-draft-final-regressions.spec.ts`: **5/5 PASS** (Onaysız kayıt/restore/reset).
* **UI ve Görsel Düzen:**
  - `tests/site-audit/belgeler-unified-header-stage05.spec.ts` & `belgeler-unified-header-baseline.spec.ts`: **10/10 PASS** (Tema anahtarı en sağda, menüsüz rozet, taşmasız header).
  - `tests/site-audit/belgeler-form-view.spec.ts`: **8/8 PASS** (Form Görünümü alt barda "Boş form indir"in hemen solunda, kompakt/fit modları, masaüstü & mobil).
  - `tests/site-audit/belgeler-studio-ux.spec.ts`: **8/8 PASS** (Akordeon, PDF odak, reload, undo, klavye WAI-ARIA, 320-1920px no-overflow).
  - `tests/site-audit/belgeler-field-focus.spec.ts` & `belgeler-field-focus-regressions.spec.ts`: **27/27 PASS** (56/56 alan koordinat doğrulaması, mobil yaşam döngüsü, zoom 50-400%, dark theme, forced-colors).
  - `tests/site-audit/belgeler-draft-pdf-roundtrip.spec.ts`: **5/5 PASS** (Tüm alanlar storage → restore → preview → indirilen PDF).
* **Kalite Kapıları & Bütünlük:**
  - `npm run check:belgeler-pdf`: **486/486 PASS (0 fail)**, 6/6 visual checks PASS.
  - `npm run check:belgeler-inline-mobile`: **9/9 PASS**.
  - `npm run check:tools`: **30/30 PASS**.
  - `npx tsc -p tsconfig.next.json --noEmit`: **0 TypeScript hatası**.
```

---

## ASAMA_05 — Zoom Tam Merkez, Form Görünümü Footer'da ve Mobil/Masaüstü Eylemler Raporu

### 1. Uygulanan Değişiklikler
* **Zoom Geometrik Tam Merkezleme (Simetrik 3 Kolonlu CSS Grid):**
  - `src/components/belge-studio-preview-toolbar.tsx` ve `src/app/globals.css` içinde `.belge-preview-controls` yerleşimi `grid-template-columns: minmax(0, 1fr) max-content minmax(0, 1fr)` olarak yapılandırıldı.
  - Sol kolon (`.belge-preview-left`): Çok sayfalı PDF gezinmesini (`[<] 1/2 [>]`) barındırır, tek sayfada `min-w-0` ile sağ kolonla simetrik `1fr` genişlik tutarak merkezin kaymasını engeller.
  - Orta kolon (`.belge-preview-center`): SADECE `.belge-preview-zoom` grubunu (`[−]`, `[%100]`, `[+]`) barındırır. Toolbar genişliğinin tam ortasına (sapma: 0 px, <= 2 CSS px şartını tam karşılar) kilitlenmiştir.
  - Sağ kolon (`.belge-preview-right`): `Sığdır`, `Yeni sekmede aç` ve varsa `PDF'ye Odaklan` butonlarını masaüstünde doğrudan, mobilde/dar ekranda ise `⋯` More menüsü (`data-testid="belge-studio-more-view-options"`) içinde sunar.
  - Preview toolbar'dan mükerrer Tema anahtarı ve Form Görünümü menüsü tamamen çıkarıldı.
* **Form Görünümü Menüsü Footer'a ve Boş Form İndir'in Soluna Taşındı:**
  - `src/components/belge-studio-actions.tsx` güncellendi.
  - **Masaüstü Sıralaması:** Sol grupta `[Sıfırla] [Temizle] [Geri al]`; Sağ grupta `[Form Görünümü] [Boş form indir] [Yazdır] [Paylaş] [PDF İndir]`.
  - `Form Görünümü` ve `Boş form indir` yan yana bölünmez bir `inline-flex` konteynere alındı; araya başka hiçbir düğme giremez.
  - `BelgeStudioFormViewMenu` popover'ı `side="top"` ve `align="end"` ile alt bardan yukarıya doğru açılır, viewport dışına taşmaz (`max-w-[calc(100vw-1rem)]`, `max-h-[85vh]`).
* **Mobil Tek Satır Eylem Barı (< 1024px):**
  - Sıra: `[⋯] [Form Görünümü (44x44px)] [Boş form indir (44x44px)] [Formu Düzenle / PDF Önizle] [PDF İndir]`.
  - İki komşu simge dokunmatik erişilebilirlik standardına (44×44px hit-box) uygun olarak doğrudan barda yer alır.
  - Eski `⋯` menüsü içindeki derinleşmiş (nested) Form Görünümü alt menüsü kaldırıldı, böylece çift paralel kontrol karmaşası önlendi.
  - `⋯` menüsünde: `Belgelere dön`, `Paylaş`, `Yazdır`, `Boş form indir`, `Sıfırla`, `Temizle`, `Geri al` seçenekleri korundu.

### 2. Kalite ve Test Kanıtları
* `npx tsx --test tests/belgeler/belge-toolbar-footer-v3.test.ts`: **6/6 senaryo PASS**.
* `npm run check:belgeler-pdf`: **479/479 test PASS (0 hata)**, 6/6 görsel koruma denetimi PASS.
* `npx tsc -p tsconfig.next.json --noEmit`: **0 TypeScript hatası**.
