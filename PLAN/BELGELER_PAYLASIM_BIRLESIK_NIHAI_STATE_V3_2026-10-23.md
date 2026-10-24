# Belgeler paylaşımı — birleşik V3 uygulama durumu

Bu dosya **yalnız V3 uygulamasını** izler. ASAMA_13 yerel release kapısı tamamlandı; sonraki aşama ASAMA_14’tür. Önceki V2 state'lerini değiştirme.

```yaml
plan_id: BELGELER-SHARE-MERGED-V3-20261023
plan_revision: 3
workspace: C:\Users\hsyn\Desktop\muhendis-mimar-portali
plan_file: C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_PLAN_V3_2026-10-23.md
state_file: C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
audit_file: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-bagimsiz-denetim-2026-10-23\DENETIM_VE_KARSILASTIRMA.md
evidence_root: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama
planning_status: PLAN_HAZIR
execution_status: YAYINLANDI
source_branch_at_audit: main
source_commit_at_audit: 04048e50fd02e50c1c9ea783acec2d7383f516b4
remote_head_fetched: false
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
  - ASAMA_08
  - ASAMA_09
  - ASAMA_10
  - ASAMA_11
  - ASAMA_12
  - ASAMA_13
  - ASAMA_14
  - ASAMA_15
release_authorized: true
release_authorization_note: User explicitly requested completion and publication with available resources after prior blocker/device disclosure; no paid upgrade is authorized or performed.
release_command: yayinla
deployment:
  id: dpl_7bp9YK6ppxjUwtciN4P8qgG1oiJo
  state: READY
  target: production
  url: https://muhendislik-site-5da69lg4f-huseying5713-2819s-projects.vercel.app
  sourceCommit: 39e801a6cb85fe1594e44ce11e496120f17d1594
  sourceBranch: internal-belgeler-paylasim-v3-20261023
  canonicalUrl: https://muhendislik-site.vercel.app
  aliases:
    - muhendislik-site.vercel.app
    - muhendislik-site-huseying5713-2819s-projects.vercel.app
  promotedSameProductionArtifact: true
  productionDeploymentsThisRelease: 1
  mainBranchUpdated: false
decisions_locked:
  - 50 basarili benzersiz yeni link / anonim tarayici / Istanbul takvim gunu
  - 'Gorseldeki ilk linkten sonra engel: K01/K02 zorunlu kabul'
  - IP 3/15dk, 10/24s, 20 aktif normal kullanici kotasindan cikar
  - Basarisiz/replay/kopya hak yemez; basarili link iptali hak iade etmez
  - Reserved ile used ayrilir; reset DB saatine gore Europe/Istanbul
  - 90x24 saat, editable indir, server flatten paylas, eski link uyumu
  - Yeni token v2 reservation nonce; tombstone GC eski URLyi diriltmez
  - Aktif yonetim anahtari 20/100 siniriyla sessizce atilmaz
  - WhatsApp, QR, native share, hesap, OCR, e-imza eklenmez
  - Bir devam en fazla bir asama; 15 yalniz acik yayinla komutuyla
audit_evidence_historical:
  date: 2026-10-23
  selected_unit_tests:
    result: PASS
    passed: 108
    failed: 0
    skipped: 0
    suites: 37
  diagnostic_probes:
    count: 13
    scope: memory_and_local_functions
    meaning: Kusur gozlemi; duzeltme PASS degil
  browser_probes:
    count: 3
    scope: canonical UI + mocked share mutations
    result: 3 UI kusuru tekrar uretildi
  live_mutations: 0
  source_changes: 0
  production_deployments: 0
  F32: NOT_A_BUG_CURRENT_CODE; revokedAt onceligi koruyor
  F07: NOT_REPRODUCED_IN_THIS_AUDIT; uygulamada kontrol edilecek
stages:
  ASAMA_01:
    title: Baseline ve izole test altyapisi
    status: PASS
  ASAMA_02:
    title: Uyumlu migration ve runtime adaptoru
    status: PASS
  ASAMA_03:
    title: Tarayici kimligi ve kota bootstrap
    status: PASS
  ASAMA_04:
    title: Idempotency, token ve attempt yasam dongusu
    status: PASS
  ASAMA_05:
    title: Atomik 50/gun ve fiziksel byte muhasebesi
    status: PASS
  ASAMA_06:
    title: HTTP dogrulama, hata ve canonical host
    status: PASS
  ASAMA_07:
    title: Revision, dialog, kota UX ve gorunur hatalar
    status: PASS
  ASAMA_08:
    title: Kalici yonetim gecmisi ve storage migration
    status: PASS
  ASAMA_09:
    title: Cleanup throughput, lease, cursor ve metrik
    status: PASS
  ASAMA_10:
    title: Salt-okunur viewer ve mobil zoom
    status: PASS
  ASAMA_11:
    title: Izole kabuk, header, HEAD ve durumlar
    status: PASS
  ASAMA_12:
    title: Bes PDF parity ve dosya adi
    status: PASS
  ASAMA_13:
    title: Butunlesik yerel release gate
    status: PASS
  ASAMA_14:
    title: Kapasite, RC ve yayin hazirligi
    status: PASS
  ASAMA_15:
    title: Acik yayin komutuyla tek production release
    status: PASS
external_gates_to_verify:
  - 'Physical Android/iOS NOT_RUN: disclosed manual risk under the user''s available-resources completion/publication direction'
  - Future real cron invocation NOT_YET_OBSERVED; no Production load or bulk cleanup test
  - 'Hobby capacity tier: 600 MB liability guard; sustained quota-maximum storage demand returns 503 rather than shortening retention'
blockers: []
findings: []
implementation_evidence:
  - stage: ASAMA_01
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_01.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_01_baseline.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_01_baseline.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_01_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_01_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_01_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_01_lint.json
      - docs/belgeler-paylasim-v3-uygulama/run-stage01-tests.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage01-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage01-lint.mjs
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      local_main: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      origin_main_ref: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_fetch: NOT_RUN
      tracked_changed_files: 0
      remote_writes: 0
      deployments: 0
    inventory:
      node: v24.15.0
      npm: 11.12.1
      next: 16.4.2
      typescript: 5.9.3
      tsx: 4.23.15
      neon_serverless: 1.1.0
      vercel_blob: 2.8.0
      playwright: 1.62.1
      migrations:
        - 001_dokumantasyon_base.sql
        - 002_upload_integrity.sql
        - 004_cad_aps_derivatives.sql
        - 005_belge_paylasim.sql
    env_inventory:
      values_inspected_displayed_or_logged: false
      env_local_relevant_present_names:
        - VERCEL_OIDC_TOKEN
      env_local_absent_names:
        - DATABASE_URL
        - POSTGRES_URL
        - BLOB_READ_WRITE_TOKEN
        - BELGE_SHARE_SECRET
        - CRON_SECRET
      process_environment_cloud_secret_names: []
      test_child_cloud_secret_names_removed: true
      dotenv_loaded_by_target_test_path: false
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage01-tests.mjs
        environment: NODE_ENV=test; cloud/secret process variables removed; explicit Memory repository/blob adapters and client mocks
        result: PASS
        exit_code: 0
        test_count: 108
        pass: 108
        fail: 0
        skip: 0
        duration_ms: 1963
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_01_baseline.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage01-runtime-tsc.mjs
        environment: NODE_ENV=test; cloud/secret process variables removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 20257
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_01_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage01-lint.mjs
        environment: NODE_ENV=test; cloud/secret process variables removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 3487
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_01_lint.log
    historical_evidence:
      audit_108_tests_37_suites: tarihsel denetim kaniti; asama sonucu olarak tekrar etiketlenmedi
      diagnostic_probes: 13 adet; yeniden calistirilmadi, tarihsel bug gozlemi olarak korundu
      browser_probes: 3 adet; yeniden calistirilmadi; UI + mocked API, production E2E degil
    not_run:
      - 'Production build: plan geregi gerekli degil; ASAMA_13 release gate''ine birakildi'
      - 'Product-file lint: degisen urun dosyasi yok'
      - 'Gercek PostgreSQL concurrency ve private Blob/Vercel runtime: test altyapisi/credential yok, acik dis release kapisi'
      - 'Fiziksel cihaz: adb mevcut, bagli Android sayisi 0; idevice_id araci yok'
    acceptance_ids: []
    findings_closed: []
    findings_open:
      - F01-F31 (F07 NOT_REPRODUCED/NOT_RUN)
      - N01-N18
      - B01-B03
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunacak
    external_gate: PostgreSQL/Blob concurrency ve fiziksel cihaz kaniti release asamalarina acik birakildi
    next_stage: ASAMA_02
  - stage: ASAMA_02
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - .env.example
      - docs/BELGELER_SISTEMI.md
      - db/migrations/006_belge_paylasim_v3_runtime.sql
      - src/app/api/belgeler/paylasim/route.ts
      - src/app/api/belgeler/paylasim/[token]/route.ts
      - src/app/api/belgeler/paylasim/[token]/pdf/route.ts
      - src/app/api/cron/belge-paylasim-temizlik/route.ts
      - src/lib/belge-paylasim/blob-store.ts
      - src/lib/belge-paylasim/config.ts
      - src/lib/belge-paylasim/repository.ts
      - src/lib/belge-paylasim/types.ts
      - tests/belgeler/belge-share-stage02.test.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_changes.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_02_project-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/run-stage02-tests.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage02-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage02-lint.mjs
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_writes: 0
      deployments: 0
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage02-tests.mjs
        environment: NODE_ENV=test; external DB/Blob/secret variable names removed; PGlite PostgreSQL 18.6 in memory; legacy fixtures and explicit Memory adapter tests
        result: PASS
        exit_code: 0
        test_count: 116
        pass: 116
        fail: 0
        skip: 0
        duration_ms: 7122
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_02_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage02-runtime-tsc.mjs
        environment: NODE_ENV=test; cloud/secret variable names removed; tsconfig.next.json runtime scope
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 19890
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_02_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage02-lint.mjs
        environment: Changed source files, migration test and evidence runners; cloud/secret variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 3563
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_02_lint.log
      - command: node node_modules/typescript/bin/tsc --noEmit --incremental false
        environment: Full repository TypeScript scope
        result: FAIL
        exit_code: 2
        diagnostics: 606
        changed_area_diagnostics: 0
        gate: NOT_REQUIRED_FOR_ASAMA_02
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_02_project-tsc.log
      - command: git diff --check
        environment: Local working tree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: null
    acceptance_ids:
      - N13
      - N14
    findings_closed:
      - N13
      - N14
    findings_open:
      - F01-F31 (F07 NOT_REPRODUCED/NOT_RUN)
      - N01-N12
      - N15-N18
      - B01-B03
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunacak
    not_run:
      - Production/Preview Neon DB migration; PGlite isolated PostgreSQL was used for all repository migrations
      - Separate-connection Neon concurrency, private Vercel Blob lifecycle, and real deployment environment isolation
      - Production build; plan requires it at ASAMA_13
      - Full-repository typecheck command was run but failed with 606 diagnostics outside changed ASAMA_02 files; ASAMA_01 did not run this wider command
    external_gate: PGlite fresh DB and 005 legacy fixture gates passed; remote DB/Blob configuration was not inspected or mutated. Separate Neon concurrency and environment isolation remain later release gates.
    next_stage: ASAMA_03
  - stage: ASAMA_03
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - src/lib/belge-paylasim/browser-identity.ts
      - src/lib/belge-paylasim/browser-bootstrap.ts
      - src/lib/belge-paylasim/repository.ts
      - src/lib/belge-paylasim/types.ts
      - src/app/api/belgeler/paylasim/route.ts
      - src/app/api/belgeler/paylasim/kota/route.ts
      - tests/belgeler/belge-share-api.test.ts
      - tests/belgeler/belge-share-stage02.test.ts
      - tests/belgeler/belge-share-stage03.test.ts
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03_changes.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_03_lint.json
      - docs/belgeler-paylasim-v3-uygulama/run-stage03-tests.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage03-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage03-lint.mjs
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_writes: 0
      deployments: 0
    implementation_contract:
      browser_identity_module: src/lib/belge-paylasim/browser-identity.ts
      quota_route: src/app/api/belgeler/paylasim/kota/route.ts
      browser_bootstrap_module: src/lib/belge-paylasim/browser-bootstrap.ts
      details: 256-bit server CSPRNG; versioned HMAC cookie; host/environment owner scope; same-id renewal; DB NOW() Europe/Istanbul quota-day read; create POST missing/invalid cookie => 428 without mint; Web Locks/BroadcastChannel coordination, bounded two-attempt echo, and failed-leader no-remint behavior.
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage03-tests.mjs
        environment: NODE_ENV=test; database/blob/secret/cloud variable names removed; PGlite PostgreSQL 18.6; explicit Memory adapter route fixtures; BroadcastChannel coordination simulated with two tabs
        result: PASS
        exit_code: 0
        test_count: 128
        pass: 128
        fail: 0
        skip: 0
        duration_ms: 15115
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_03_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage03-runtime-tsc.mjs
        environment: NODE_ENV=test; cloud/database/blob/secret variable names removed; tsconfig.next.json runtime scope
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 20670
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_03_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage03-lint.mjs
        environment: ESLint changed ASAMA_03 runtime/API/test/evidence runners; external DB/blob/secret/cloud variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 4209
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_03_lint.log
      - command: git diff --check
        environment: Local worktree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: null
    acceptance_ids:
      - F26
      - F30
    findings_closed:
      - F26
      - F30
    findings_open:
      - F01-F25
      - F27-F29
      - F31
      - N01-N12
      - N15-N18
      - B01-B03
      - F02/N03 replay proof remains ASAMA_04
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunacak
    not_run:
      - Gerçek Chromium/Firefox/WebKit browser contextleri; iki sekme akışı sahte BroadcastChannel hub ve izole route istekleriyle sınandı
      - Gerçek Neon/Preview/Production DB, Vercel Blob, deploy ve canlı veri erişimi
      - Stüdyo UI entegrasyonu; ASAMA_07 kapsamı
      - Production build; plan gereği ASAMA_13
    external_gate: PGlite 18.6 quota SELECT ve DB clock hesabı geçti. Gerçek Neon concurrency/environment isolation ve gerçek browser motoru sonraki release kapılarıdır; owner/proof replay ASAMA_04 ve 50/gün atomik enforcement ASAMA_05 bekliyor.
    next_stage: ASAMA_04
  - stage: ASAMA_04
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - .env.example
      - db/migrations/007_belge_paylasim_token_key_version.sql
      - docs/BELGELER_SISTEMI.md
      - src/app/api/belgeler/paylasim/route.ts
      - src/app/api/belgeler/paylasim/[token]/route.ts
      - src/app/api/belgeler/paylasim/islem/[requestId]/route.ts
      - src/lib/belge-paylasim/config.ts
      - src/lib/belge-paylasim/repository.ts
      - src/lib/belge-paylasim/service-core.ts
      - src/lib/belge-paylasim/tokens.ts
      - src/lib/belge-paylasim/types.ts
      - tests/belgeler/belge-share-api.test.ts
      - tests/belgeler/belge-share-server.test.ts
      - tests/belgeler/belge-share-stage02.test.ts
      - tests/belgeler/belge-share-stage03.test.ts
      - tests/belgeler/belge-share-stage04.test.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04_changes.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_04_lint.json
      - docs/belgeler-paylasim-v3-uygulama/run-stage04-tests.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage04-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage04-lint.mjs
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_writes: 0
      deployments: 0
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage04-tests.mjs
        environment: NODE_ENV=test; database/blob/secret/cloud variable names removed; Memory adapters and PGlite 18.6 isolated PostgreSQL
        result: PASS
        exit_code: 0
        test_count: 139
        pass: 139
        fail: 0
        skip: 0
        duration_ms: 18804
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_04_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage04-runtime-tsc.mjs
        environment: NODE_ENV=test; cloud/database/blob/secret variable names removed; tsconfig.next.json runtime scope
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 21293
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_04_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage04-lint.mjs
        environment: ESLint over changed runtime/API/test/evidence runners; cloud/database/blob/secret variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 4558
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_04_lint.log
      - command: git diff --check
        environment: Local worktree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: null
    acceptance_ids:
      - F02
      - N02
      - N03
      - N04
      - N11
    findings_closed:
      - F02
      - N02
      - N03
      - N04
      - N11
    findings_open:
      - F01
      - F03-F25
      - F27-F29
      - F31
      - N01
      - N05-N10
      - N12
      - N15-N18
      - B01-B03
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunuyor
    not_run:
      - Ayrı Neon/PostgreSQL instance veya bağlantılarda gerçek concurrency; PGlite concurrency tek izole instance üzerindedir
      - Vercel Private Blob, Preview/Production runtime, deploy ve canlı veri erişimi
      - Gerçek Chromium/Firefox/WebKit browser contextleri
      - Production build; plan gereği ASAMA_13
    external_gate: PUT sonrası DB finalize hatasında kalan eski Blob orphan byte yükümlülüğü ve cleanup ASAMA_05/09 kapsamındadır. Owner başına atomik 50/gün kota ASAMA_05 bekliyor. Remote write/deploy yapılmadı.
    next_stage: ASAMA_05
  - stage: ASAMA_05
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - .env.example
      - db/migrations/008_belge_paylasim_atomic_quota.sql
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05_changes.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_05_lint.json
      - docs/belgeler-paylasim-v3-uygulama/run-stage05-tests.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage05-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage05-lint.mjs
      - src/app/api/belgeler/paylasim/route.ts
      - src/lib/belge-paylasim/config.ts
      - src/lib/belge-paylasim/quota.ts
      - src/lib/belge-paylasim/repository.ts
      - src/lib/belge-paylasim/service-core.ts
      - tests/belgeler/belge-share-api.test.ts
      - tests/belgeler/belge-share-server.test.ts
      - tests/belgeler/belge-share-stage02.test.ts
      - tests/belgeler/belge-share-stage03.test.ts
      - tests/belgeler/belge-share-stage04.test.ts
      - tests/belgeler/belge-share-stage05.test.ts
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_writes: 0
      deployments: 0
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage05-tests.mjs
        environment: NODE_ENV=test; database/blob/secret/cloud variable names removed; Memory and PGlite isolated PostgreSQL adapters
        result: PASS
        exit_code: 0
        test_count: 148
        pass: 148
        fail: 0
        skip: 0
        duration_ms: 21325
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_05_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage05-runtime-tsc.mjs
        environment: NODE_ENV=test; cloud/database/blob/secret variable names removed; tsconfig.next.json runtime scope
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 19713
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_05_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage05-lint.mjs
        environment: ESLint over ASAMA_05 runtime/API/regression tests/evidence runners; cloud/database/blob/secret variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 4285
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_05_lint.log
      - command: git diff --check
        environment: Local worktree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: null
    acceptance_ids:
      - F03
      - N01 local SQL enforcement
      - N05
      - N18
    findings_closed:
      - F03
      - N05
      - N18
    findings_open:
      - F01
      - F04-F25
      - F27-F29
      - F31
      - N01 real PostgreSQL concurrency verification
      - N06-N10
      - N12
      - N15-N17
      - B01-B03
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunuyor
    not_run:
      - Ayrı Neon/PostgreSQL bağlantılarında gerçek 100 istek yarış testi; PGlite ve Memory sonuçları Neon concurrency PASS iddiası değildir
      - Vercel Private Blob/Preview/Production runtime, legacy Blob/env reconciliation ve gerçek kapasite/fiyat hedefi
      - Gerçek Chromium/Firefox/WebKit browser contextleri
      - Production build; plan gereği ASAMA_13
    external_gate: Gerçek PostgreSQL/Neon ayrı bağlantı atomikliği ve üretim kapasite/fiyat ölçümü ASAMA_13/14 öncesi kapanmalıdır. Production global kota değerleri kapasite onayı olmadan ayarlanmadı. Remote write/deploy yapılmadı.
    next_stage: ASAMA_07
  - stage: ASAMA_06
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - .env.example
      - next.config.ts
      - src/app/api/belgeler/paylasim/route.ts
      - src/app/api/belgeler/paylasim/[token]/route.ts
      - src/app/api/belgeler/paylasim/[token]/pdf/route.ts
      - src/app/api/belgeler/paylasim/islem/[requestId]/route.ts
      - src/hooks/use-belge-share.ts
      - src/lib/belge-paylasim/browser-bootstrap.ts
      - src/lib/belge-paylasim/http.ts
      - src/lib/belge-paylasim/request-validation.ts
      - src/lib/belge-paylasim/server-pdf.ts
      - src/lib/belge-paylasim/service-core.ts
      - src/lib/belge-paylasim/tokens.ts
      - src/lib/site-config.ts
      - tests/belgeler/belge-share-api.test.ts
      - tests/belgeler/belge-share-cleanup.test.ts
      - tests/belgeler/belge-share-client.test.ts
      - tests/belgeler/belge-share-ui.test.ts
      - tests/belgeler/belge-share-viewer.test.ts
      - tests/belgeler/belge-share-stage02.test.ts
      - tests/belgeler/belge-share-stage03.test.ts
      - tests/belgeler/belge-share-stage04.test.ts
      - tests/belgeler/belge-share-stage06.test.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_changes.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_prod-build.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_prod-trace.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_prod-route.js.nft.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_diff-check.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt01_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt01_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt01_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt01_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt01_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt01_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt02_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt02_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt02_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt02_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt02_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_06_attempt02_lint.json
      - docs/belgeler-paylasim-v3-uygulama/run-stage06-tests.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage06-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage06-lint.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage06-prod-trace.mjs
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_fetch: NOT_RUN
      remote_writes: 0
      commits: 0
      deployments: 0
    implementation_contract:
      request_validation: Origin/Host/content-type, exact schema/document field allowlist, canonical request/token IDs; bounded 64 KiB UTF-8 stream with timeout/cancel.
      error_contract: No-store/no-referrer/nosniff/noindex headers; safe {code,message,requestCorrelationId}; logs expose only category/duration/correlation ID.
      retry_contract: Dynamic Retry-After from quota resetAt/serverNow; reserved quota is 409, not exhausted-quota 429; client distinguishes WAF HTML, malformed response, 503, abort and offline.
      share_origin: Production canonical origin; Preview requires exact HTTPS isolated allowlist URL; client does not rewrite with window.location.origin.
      pdf_head_and_trace: HEAD reads metadata without Blob.get; production trace contains all 5 templates and 4 fonts.
      fixed_pdf_labels: Generated PDF AcroForm retains profile fixedValue values when hostile client label strings are supplied.
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage06-tests.mjs
        environment: NODE_ENV=test; database/blob/secret/cloud env names removed; isolated Memory/PGlite fixtures
        result: PASS
        exit_code: 0
        test_count: 160
        pass: 160
        fail: 0
        skip: 0
        duration_ms: 23843
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_06_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage06-runtime-tsc.mjs
        environment: NODE_ENV=test; cloud/database/blob/secret env names removed; tsconfig.next.json runtime scope
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 21017
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_06_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage06-lint.mjs
        environment: ESLint changed runtime/API/regression tests/evidence runners; cloud/database/blob/secret env names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 4763
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs/belgeler-paylasim-v3-uygulama/ASAMA_06_lint.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage06-prod-trace.mjs
        environment: Local production build with cloud/database/blob/secret values removed or dummy-overridden; no deployment/live API
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 24577
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs/belgeler-paylasim-v3-uygulama/ASAMA_06_prod-build.log
        traced_assets: 9
        missing_assets: 0
      - command: git diff --check
        environment: Local worktree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs/belgeler-paylasim-v3-uygulama/ASAMA_06_diff-check.log
    acceptance_ids:
      - F04
      - F12
      - F14
      - F15 API header portion
      - F20 local IP-policy portion
      - F27
      - F29
      - N08
      - N09
      - N12
      - N15 safe error portion
    findings_closed:
      - F04
      - F12
      - F14
      - F27
      - F29
      - N08
      - N09
      - N12
    findings_open:
      - F01
      - F05
      - F06
      - F07
      - F08
      - F09
      - F10
      - F11
      - F13
      - F15
      - F16
      - F17
      - F18
      - F19
      - F20
      - F21
      - F22
      - F23
      - F24
      - F25
      - F28
      - F31
      - N01
      - N06
      - N07
      - N10
      - N15
      - N16
      - N17
      - B01
      - B02
      - B03
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunuyor
    not_run:
      - Real Chromium/Firefox/WebKit browser engines and browser context tests
      - Real Vercel Preview/Production runtime, private Blob, WAF edge behavior, deployed canonical origin
      - Vercel production trusted forwarded-header chain for F20
      - Separate-connection Neon/PostgreSQL concurrency; capacity and pricing approval
      - Old deployed writer/cron access and rollout compatibility
      - N15 PDF parse/page/AcroForm runtime validation; planned for ASAMA_12
    external_gate: Gerçek Neon concurrency, Vercel Blob/runtime/environment, kapasite/fiyat, eski deployment writer/cron ve fiziksel Android/iOS doğrulaması ASAMA_13/14 öncesi açık kalır.
    next_stage: ASAMA_07
  - stage: ASAMA_07
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - src/hooks/use-belge-share.ts
      - src/components/belge-paylasim/belge-share-dialog.tsx
      - src/components/beton-dokum-studio.tsx
      - src/components/istifa-studio.tsx
      - src/components/insaat-ruhsati-studio.tsx
      - src/components/taahhutname-studio.tsx
      - src/components/sozlesme-studio.tsx
      - tests/belgeler/belge-share-stage07.test.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_changes.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_browser.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_dev-server.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_diff-check.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_07_lint.json
      - docs/belgeler-paylasim-v3-uygulama/run-stage07-tests.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage07-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage07-lint.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage07-browser.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage07-manifest.mjs
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_fetch: NOT_RUN
      remote_writes: 0
      commits: 0
      deployments: 0
    implementation_contract:
      snapshot_binding: Create payload freezes only allowlisted form values at click time and records PDF revision plus one-way fingerprint.
      recovery: Single-flight lock, bounded request/status polling, same-proof recovery, no form payload in recovery storage, changed form gets a fresh request ID after prior status is resolved.
      quota_ui: Server aggregate only; used/reserved separate from local history; WAF HTML, browser cookie failure, daily quota, capacity 503 and reset refresh are distinct.
      dialog_accessibility: Shared assertive live error, manual clipboard fallback, 320px no-overflow layout, 44x44 controls, focus trap/Escape/focus restoration, dark and reduced-motion checks.
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage07-tests.mjs
        environment: NODE_ENV=test; DB/Blob/secret/cloud variable names removed; isolated Memory/PGlite fixtures; no production data
        result: PASS
        exit_code: 0
        test_count: 165
        pass: 165
        fail: 0
        skip: 0
        suites: 42
        duration_ms: 24380
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage07-runtime-tsc.mjs
        environment: tsconfig.next.json runtime scope; NODE_ENV=test; DB/Blob/secret/cloud variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 21641
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage07-lint.mjs
        environment: ESLint over changed hook/dialog/five studios/regression test and evidence runners; cloud/secret variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 5528
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07_lint.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage07-browser.mjs
        environment: Local Next dev + Chromium/Playwright; every share/quota/status/revoke API response intercepted by route mocks; no live backend or production data
        result: PASS
        exit_code: 0
        test_count: 36
        pass: 36
        fail: 0
        skip: 0
        duration_ms: 19333
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07_browser.json
      - command: git diff --check
        environment: Local worktree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07_diff-check.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage07-manifest.mjs
        environment: SHA-256 manifest over 23 sorted stage files; excludes STATE and self-referential manifest
        result: PASS
        exit_code: 0
        test_count: 23
        pass: 23
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07_changes.json
    acceptance_ids:
      - F01
      - F09 warning-text portion
      - F13
      - F24 UI aggregate/history distinction
      - B01
      - B02
      - B03
      - K14 dialog-error portion
      - K15 320px portion
    findings_closed:
      - F01
      - F13
      - F24
      - B01
      - B02
      - B03
    findings_open:
      - F05
      - F06
      - F07
      - F08
      - F09 full cross-document review
      - F10
      - F11
      - F15
      - F16
      - F17
      - F18
      - F19
      - F20
      - F21
      - F22
      - F23
      - F25
      - F28
      - F31
      - N01 real PostgreSQL concurrency verification
      - N06
      - N07
      - N10
      - N15
      - N16
      - N17
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunuyor
    not_run:
      - Gerçek Vercel Preview/Production API, private Blob, platform WAF ve gerçek İstanbul takvim günü reseti; browser API çağrıları Playwright mock ile sınandı
      - Ayrı PostgreSQL/Neon bağlantılarında gerçek concurrency, kapasite/fiyat ve eski deployment writer/cron uyumu
      - Firefox/WebKit ve fiziksel Android/iOS kabulü; 320px yerel Chromium görünümü çalıştırıldı
      - Production build; V3 planı gereği ASAMA_13
    external_gate: Gerçek Neon concurrency, Vercel Blob/runtime/environment, platform WAF, kapasite/fiyat, eski deployment writer/cron ve fiziksel cihaz doğrulaması release aşamalarına açık kalır. K01/K02 ürün kabulü release kapısında ayrıca teyit edilecek.
    next_stage: ASAMA_08
  - stage: ASAMA_08
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08_diff-check.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_08_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/run-stage08-lint.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage08-manifest.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage08-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage08-tests.mjs
      - src/components/belge-paylasim/belge-share-dialog.tsx
      - src/hooks/use-belge-share.ts
      - src/lib/belge-paylasim/local-link-registry.ts
      - tests/belgeler/belge-share-client.test.ts
      - tests/belgeler/belge-share-stage08.test.ts
    git:
      branch: main
      local_main: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      origin_main_ref: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_fetch: NOT_RUN
      tracked_changed_files: 5
      remote_writes: 0
      deployments: 0
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage08-tests.mjs
        environment: NODE_ENV=test; DB/Blob/secret/cloud variable names removed; isolated Memory/PGlite fixtures; no production data
        result: PASS
        exit_code: 0
        test_count: 176
        pass: 176
        fail: 0
        skip: 0
        suites: 48
        duration_ms: 23661
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_08_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage08-runtime-tsc.mjs
        environment: tsconfig.next.json runtime scope; NODE_ENV=test; DB/Blob/secret/cloud variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 22900
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_08_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage08-lint.mjs
        environment: ESLint over changed registry, hook, dialog, unit tests and evidence runners; cloud/secret variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 5405
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_08_lint.log
      - command: git diff --check
        environment: Local worktree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_08_diff-check.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage08-manifest.mjs
        environment: SHA-256 manifest over 18 sorted stage files; excludes STATE and self-referential manifest
        result: PASS
        exit_code: 0
        test_count: 18
        pass: 18
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_08_changes.json
    acceptance_ids:
      - F10
      - F31
      - N06
    findings_closed:
      - F10
      - F31
      - N06
    findings_open:
      - F05
      - F06
      - F07
      - F08
      - F09 full cross-document review
      - F11
      - F15
      - F16
      - F17
      - F18
      - F19
      - F20
      - F21
      - F22
      - F23
      - F25
      - F28
      - N01 real PostgreSQL concurrency verification
      - N05
      - N07
      - N10
      - N15
      - N16
      - N17
    not_run:
      - Gerçek PostgreSQL ayrı bağlantı concurrency, private Vercel Blob ve platform WAF
      - Firefox/WebKit ve fiziksel Android/iOS cihaz kabulü
      - Production build (ASAMA_13)
    external_gate: Gerçek Neon concurrency, Vercel Blob/runtime/environment, platform WAF, kapasite/fiyat, eski deployment writer/cron ve fiziksel cihaz doğrulaması release aşamalarına açık kalır.
    next_stage: ASAMA_09
  - stage: ASAMA_09
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - db/migrations/009_belge_paylasim_cleanup_queue.sql
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09_diff-check.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_09_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/run-stage09-diff-check.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage09-lint.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage09-manifest.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage09-runtime-tsc.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage09-tests.mjs
      - src/app/api/cron/belge-paylasim-temizlik/route.ts
      - src/lib/belge-paylasim/blob-store.ts
      - src/lib/belge-paylasim/cleanup.ts
      - src/lib/belge-paylasim/repository.ts
      - src/lib/belge-paylasim/types.ts
      - tests/belgeler/belge-share-cleanup.test.ts
      - tests/belgeler/belge-share-stage02.test.ts
      - tests/belgeler/belge-share-stage03.test.ts
      - tests/belgeler/belge-share-stage04.test.ts
      - tests/belgeler/belge-share-stage05.test.ts
      - tests/belgeler/belge-share-stage09.test.ts
    git:
      branch: main
      local_main: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      origin_main_ref: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_fetch: NOT_RUN
      tracked_changed_files: 31
      remote_writes: 0
      deployments: 0
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage09-tests.mjs
        environment: NODE_ENV=test; DB/Blob/secret/cloud variable names removed; isolated Memory/PGlite fixtures; no production data
        result: PASS
        exit_code: 0
        test_count: 191
        pass: 191
        fail: 0
        skip: 0
        suites: 49
        duration_ms: 38017
        benchmark: 'PGlite + Memory Blob: 1,000 orphan / 51 pages / 1,105 ms; 30,000 ms limit'
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_09_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage09-runtime-tsc.mjs
        environment: tsconfig.next.json runtime scope; NODE_ENV=test; DB/Blob/secret/cloud variable names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 22795
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_09_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage09-lint.mjs
        environment: ESLint over cleanup sources, migration schema harness tests, cleanup regressions and evidence runners; secret/cloud names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        warnings: 2
        duration_ms: 4368
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_09_lint.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage09-diff-check.mjs
        environment: Local tracked git diff check plus trailing-whitespace check over 20 stage/worktree files
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        duration_ms: 386
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_09_diff-check.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage09-manifest.mjs
        environment: SHA-256 manifest over 26 sorted stage files; excludes STATE and self-referential manifest
        result: PASS
        exit_code: 0
        test_count: 26
        pass: 26
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_09_changes.json
    acceptance_ids:
      - F05
      - N05
      - N07
      - N10 local backlog cap
      - F21
      - N11 late finalize fence
    findings_closed:
      - F05
      - N05
      - N07
      - N10 local backlog cap
      - F21
      - N11 late finalize fence
    findings_open:
      - F06
      - F07
      - F08
      - F09 full cross-document review
      - F11
      - F15
      - F16
      - F17
      - F18
      - F19
      - F20
      - F22
      - F23
      - F25
      - F28
      - N01 real PostgreSQL concurrency verification
      - N10 measured production volume/capacity (ASAMA_14)
      - N15
      - N16
      - N17
    not_run:
      - Gerçek Neon ayrı bağlantı/instance concurrency
      - Özel Vercel Blob ve Vercel runtime davranışı
      - Gerçek günlük production üretim hacmi, ölçülen kapasite hedefi ve fiyat/bütçe
      - Eski deployment writer/cron rollout uyumu ve platform WAF
      - Firefox/WebKit ve fiziksel Android/iOS kabulü
      - Production build (ASAMA_13)
    external_gate: Sentetik PGlite + Memory Blob throughput gerçek Neon/Vercel Blob kapasitesi değildir. Neon concurrency, production trafik/kota/bütçe, private Blob/runtime, eski deployment uyumu ve cihaz doğrulaması sonraki release kapılarında kalır.
    next_stage: ASAMA_10
  - stage: ASAMA_10
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 37f04965c958d364480b8e096911069edc5fed1c620e655fb238261fbf2d20ec (21 files; excludes STATE and manifest itself)
    changed_files:
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_320_dark.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_320_light.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_390_light.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_browser.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_diff-check.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_10_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/run-stage10-browser.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage10-checks.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage10-manifest.mjs
      - src/components/belge-paylasim/belge-share-viewer.tsx
      - src/lib/belge-paylasim/viewer-geometry.ts
      - src/lib/belge-paylasim/viewer-session.ts
      - tests/belgeler/belge-share-stage10.test.ts
      - tests/belgeler/fixtures/share-viewer-harness.tsx
    git:
      branch: main
      local_main: 04048e50fd02e50c1c9ea783acec2d7383f516b4
      remote_fetch: NOT_RUN
      remote_writes: 0
      deployments: 0
    commands:
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage10-checks.mjs tests
        environment: isolated local test/runtime/lint; cloud/secret names removed
        result: PASS
        exit_code: 0
        test_count: 23
        pass: 23
        fail: 0
        skip: 0
        suites: 4
        duration_ms: 1928
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_10_tests.tap
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage10-checks.mjs runtime-tsc
        environment: isolated local test/runtime/lint; cloud/secret names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        suites: 0
        duration_ms: 25820
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_10_runtime-tsc.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage10-checks.mjs lint
        environment: isolated local test/runtime/lint; cloud/secret names removed
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        suites: 0
        duration_ms: 4270
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_10_lint.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage10-browser.mjs
        environment: isolated esbuild React harness using actual component, shared PDF.js 6.3.289 and synthetic local PDFs; no backend/DB/Blob calls
        result: PASS
        exit_code: 0
        test_count: 21
        pass: 21
        fail: 0
        skip: 0
        duration_ms: 18006
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_10_browser.json
      - command: git diff --check + explicit stage/state whitespace scan
        environment: Local tracked diff plus 11 explicit stage/state text files
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_10_diff-check.log
      - command: node docs/belgeler-paylasim-v3-uygulama/run-stage10-manifest.mjs
        environment: SHA-256 sorted file paths/hashes; excludes STATE and manifest itself
        result: PASS
        exit_code: 0
        test_count: 21
        pass: 21
        fail: 0
        skip: 0
        log_path: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_10_changes.json
    acceptance_ids:
      - F06
      - F08
      - F19
      - K16 local Chromium lifecycle/geometry
    findings_closed:
      - F06
      - F08
      - F19
    findings_open:
      - F07
      - F09 full cross-document review
      - F11
      - F15
      - F16
      - F17
      - F18
      - F20
      - F22
      - F23
      - F25
      - F28
      - N01 real PostgreSQL concurrency verification
      - N10 measured production volume/capacity (ASAMA_14)
      - N15
      - N16
      - N17
    not_run:
      - Fiziksel Android/iOS ve Firefox/WebKit
      - Next /b shell integration (ASAMA_11), full production build/E2E (ASAMA_13)
      - Real private Vercel Blob/Neon/runtime, capacity/budget and old deployment writer/cron rollout
    external_gate: Isolated actual-PDF.js browser harness is not backend or deployment evidence. Physical devices, separate-connection Neon races, private Blob/runtime and production capacity remain release gates.
    next_stage: ASAMA_11
  - stage: ASAMA_11
    status: PASS
    date: 2026-10-23 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: eaf5f471155864c2893b84fd81542e64edd25cf506b468b3430ebe066bbb3bfb
    changed_files:
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_development-probe.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_development-probe.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_diff-check.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_error_boundary.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_middleware-before.txt
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_next-after-production.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_next-after-production.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_next-before-build.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_next-before-build.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_next-before.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_next-before.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_root-before.txt
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_11_unavailable_mobile.png
      - docs/belgeler-paylasim-v3-uygulama/run-stage11-checks.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage11-manifest.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage11-next.mjs
      - next.config.ts
      - src/app/api/belgeler/paylasim/[token]/pdf/route.ts
      - src/app/b/[token]/error.tsx
      - src/app/b/[token]/layout.tsx
      - src/app/b/[token]/page.tsx
      - src/app/layout.tsx
      - src/components/belge-paylasim/share-access-state.tsx
      - src/components/site-shell.tsx
      - src/lib/belge-paylasim/config.ts
      - src/lib/belge-paylasim/service-core.ts
      - tests/belgeler/belge-share-stage11.test.ts
      - tests/belgeler/belge-share-viewer.test.ts
      - tests/belgeler/fixtures/stage11-data.ts
      - src/middleware.ts
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
    git:
      branch: main
      remote_fetch: NOT_RUN
      remote_writes: 0
      deployments: 0
    tests:
      unit_routes:
        result: PASS
        tests: 24
        passed: 24
        failed: 0
        skipped: 0
        suites: 4
        duration_ms: 2061
      next_production:
        result: PASS
        checks: 39
        failed: 0
        skipped: 0
        duration_ms: 28897
        scope: real Next HTTP/router + copied product sources, isolated memory read/Blob adapters; no real DB/Blob
      F07_baseline:
        result: REPRODUCED_AND_FIXED_LOCAL
        expected_observations: 3
      root_headers_build:
        result: PASS
        scope: representative isolated Next build; normal routes dynamic before, static after
        full_project_release_build: NOT_RUN_ASAMA_13
      runtime_typecheck:
        result: PASS
        exit_code: 0
        duration_ms: 22539
      lint:
        result: PASS
        errors: 0
        warnings: 0
        duration_ms: 3841
      diff_whitespace: PASS
      manifest: ASAMA_11_changes.json
    findings:
      F07: FIXED_LOCAL
      F14: FIXED_LOCAL_HEAD_NO_BLOB
      F15: FIXED_LOCAL_HEADERS_METADATA
      F16: FIXED_LOCAL_MINIMAL_SHELL
      F32: NOT_A_BUG_REVOKED_AT_PRECEDENCE_PROTECTED
      N08: FIXED_LOCAL_HEAD_NO_BLOB
    not_run:
      - Real Neon/private Blob and Vercel runtime
      - Full project release build (ASAMA_13)
      - Physical Android/iOS, Firefox/WebKit
      - Platform access log settings
    blockers: []
    report: docs/belgeler-paylasim-v3-uygulama/ASAMA_11.md
    next_stage: ASAMA_12
  - stage: ASAMA_12
    status: PASS
    date: 2026-10-24 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_browser-initial-failure.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_browser.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_changes.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_dev-server.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_diff-check.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_lint.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_lint.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_parity-detail.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_parity-initial.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_parity.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_blank_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_blank_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_blank_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_blank_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_sample_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_sample_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_sample_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_sample_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_turkish-long_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_turkish-long_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_turkish-long_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/beton_turkish-long_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_blank_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_blank_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_blank_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_blank_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_sample_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_sample_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_sample_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_sample_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_turkish-long_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_turkish-long_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_turkish-long_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/istifa_turkish-long_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_blank_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_blank_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_blank_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_blank_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_sample_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_sample_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_sample_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_sample_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_turkish-long_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_turkish-long_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_turkish-long_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/ruhsat_turkish-long_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_blank_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_blank_editable-2.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_blank_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_blank_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_blank_shared-2.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_blank_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_sample_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_sample_editable-2.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_sample_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_sample_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_sample_shared-2.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_sample_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_turkish-long_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_turkish-long_editable-2.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_turkish-long_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_turkish-long_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_turkish-long_shared-2.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/sozlesme_turkish-long_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_blank_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_blank_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_blank_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_blank_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_sample_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_sample_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_sample_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_sample_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_turkish-long_editable-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_turkish-long_editable.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_turkish-long_shared-1.png
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_pdfs/taahhutname_turkish-long_shared.pdf
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_runtime-tsc.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_runtime-tsc.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_tests.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_tests.tap
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_12_visual-sheet.png
      - docs/belgeler-paylasim-v3-uygulama/run-stage12-browser.ts
      - docs/belgeler-paylasim-v3-uygulama/run-stage12-checks.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage12-manifest.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage12-parity.ts
      - src/lib/belge-filename.ts
      - src/lib/belge-paylasim/server-pdf.ts
      - src/lib/pdf-engine.ts
      - tests/belgeler/belge-share-stage12.test.ts
      - tests/belgeler/fixtures/stage12-cases.ts
      - tests/belgeler/fixtures/stage12-rejected-upload.ts
    git:
      branch: main
      remote_fetch: NOT_RUN
      remote_writes: 0
      deployments: 0
    tests:
      unit_pdf_filename:
        result: PASS
        tests: 55
        passed: 55
        failed: 0
        skipped: 0
        suites: 9
        duration_ms: 8126
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_12_tests.tap
      browser_studios:
        result: PASS
        checks: 40
        failed: 0
        skipped: 0
        duration_ms: 104802
        scope: Next development UI with Playwright transport bridge; actual create/quota/PDF functions, isolated Memory DB/Blob; no real Neon/Blob; controlled print window
        initial_attempt: waitForFunction timeout before first assertion; preserved separately, excluded from PASS counts; bounded rerun passed
      pdf_parity:
        result: PASS
        fixture_pairs: 15
        page_pairs: 18
        generated_pdfs: 30
        rendered_pages: 36
        approved_golden_pages: 6
        ghost_pages: 6
        failed: 0
        skipped: 0
        max_changed_pixels: 52
        max_changed_ratio: 0.000025926834473116863
        minimum_field_font_pt: 1.6632786159033297
        text_equal: true
      runtime_typecheck:
        result: PASS
        exit_code: 0
        duration_ms: 22326
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_12_runtime-tsc.log
      lint:
        result: PASS
        errors: 0
        warnings: 0
        duration_ms: 43672
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_12_lint.log
      diff_whitespace: PASS
      manifest: ASAMA_12_changes.json
    acceptance_ids:
      - F11
      - F18_LOCAL
      - N15_LOCAL
      - K17
    findings:
      F11: CLOSED_LOCAL_FILENAME_YIBF_EXACTLY_7_DIGITS
      F18: CLOSED_LOCAL_RENDERED_PARITY
      N15: CLOSED_LOCAL_PARSE_PAGES_FORM_AND_UPLOAD_GUARD
      F09: OPEN_READABILITY_WARNING_CLASSIFICATION
    not_run:
      - Full project release build and integrated release matrix (ASAMA_13)
      - Real Neon/PostgreSQL separate-connection concurrency
      - Private Vercel Blob and deployed runtime
      - Physical Android/iOS and Firefox/WebKit
      - Production capacity/budget and previous-deployment writer/cron rollout
    blockers: []
    report: docs/belgeler-paylasim-v3-uygulama/ASAMA_12.md
    external_gate: Local stage passed. Full release build, real Neon/private Blob/runtime, device/browser matrix, capacity and rollout remain later-stage gates.
    next_stage: ASAMA_13
  - stage: ASAMA_13
    status: PASS
    date: 2026-10-24 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: 4474d099972c533f6bc5119d9490988e3fd445347751f3c2c873fa6fbabfe12d
    changed_files:
      - tests/site-audit/belgeler-share-e2e.spec.ts
      - tests/site-audit/belgeler-share-live-acceptance.spec.ts
      - tests/site-audit/belgeler-stage13-shell-smoke.spec.ts
      - tests/belgeler/belge-share-stage03.test.ts
      - src/lib/belge-paylasim/request-validation.ts
      - src/app/api/belgeler/paylasim/kota/route.ts
      - playwright.site.config.ts
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/run-stage13-checks.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage13-manifest.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage13-postgres-live.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_13.md
      - docs/belgeler-paylasim-v3-uygulama/FINAL_AUDIT.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_13_share_live_summary.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_13_changes.json
    commands:
      - command: npm run check:belgeler-pdf
        environment: local Node tests and isolated PDF fixtures
        result: PASS
        exit_code: 0
        test_count: 432
        pass: 432
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_pdf.log
      - command: npx tsc -p tsconfig.next.json --noEmit --incremental false
        environment: local runtime project typecheck
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_live_tsc.log
      - command: npx eslint <ASAMA_13 changed runtime, tests and harness files>
        environment: local targeted lint; 0 errors and 0 warnings
        result: PASS
        exit_code: 0
        test_count: 0
        files_checked: 8
        pass: 0
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_live_lint.log
      - command: npm run check:tools
        environment: local; tool/browser fixtures isolated; sensitive runtime values blank
        result: PASS
        exit_code: 0
        test_count: 30
        pass: 30
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_tools.log
      - command: npm run build
        environment: fresh .next-stage13-isolated production build; test-only development Neon/Blob settings; OIDC and store ID blank
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        build_id: TANJ6q1sDUCaKkaVKq3i9
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_live_build.log
      - command: 'playwright: belge taslak, odak/inline ve form-view regresyonlari'
        environment: fresh production build; local browser; no share API mock
        result: PASS
        exit_code: 0
        test_count: 25
        pass: 25
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_regressions.log
      - command: npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-share-e2e.spec.ts --project=chromium-desktop-1366 --project=chromium-mobile-320 --project=chromium-mobile-390
        environment: fresh production build; actual local HTTP, isolated real Neon and private Vercel Blob; five documents per viewport
        result: PASS
        exit_code: 0
        test_count: 15
        pass: 15
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_share_live_all.log
      - command: npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-share-live-acceptance.spec.ts --project=chromium-desktop-1366
        environment: fresh production build; real Neon/Blob; two Chromium processes, identical synthetic NAT address
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        acceptance_ids:
          - K01
          - K02
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_live_k01k02.log
      - command: npx tsx docs/belgeler-paylasim-v3-uygulama/run-stage13-postgres-live.ts
        environment: isolated Neon development database schema 9; two independent PostgreSQL backends; private test Blob; test rows cleaned
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        acceptance_ids:
          - K02
          - K03
          - K05
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_postgres_live.log
      - command: npx tsx --test tests/belgeler/belge-share-stage03.test.ts tests/belgeler/belge-share-stage06.test.ts tests/belgeler/belge-share-api.test.ts
        environment: local HTTP route tests with isolated Memory adapters; new read-only same-host no-Origin regression
        result: PASS
        exit_code: 0
        test_count: 48
        pass: 48
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_origin_and_api_tests.log
      - command: 'playwright: pdf-viewer-v2.spec.ts'
        environment: fresh production build; isolated synthetic local docs store
        result: PASS
        exit_code: 0
        test_count: 7
        pass: 4
        fail: 0
        skip: 3
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_pdfViewer.log
      - command: 'playwright: belge site shell and legacy /p missing-link smoke'
        environment: fresh production build; separate .test-data local docs store
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_shell.log
      - command: 'playwright: mobile studio navigation shell smoke'
        environment: fresh production build; chromium-mobile-390
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_mobileShell.log
      - command: git diff --check
        environment: local working tree
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: null
    acceptance_ids:
      - K01
      - K02
      - K03
      - K05
      - K17
      - K19
    findings_closed:
      - N01
      - F23
    findings_open:
      - F09
    findings_special:
      - F32 NOT_A_BUG_CURRENT_CODE; revokedAt precedence korunuyor
    not_run:
      - Firefox/WebKit and physical Android/iOS acceptance
      - Production capacity, plan and budget measurement; ASAMA_14
      - Vercel Production/Preview runtime and Linux artifact verification
      - Previous deployment writer/cron restrictions and rollback/release flow
      - Production release; requires explicit yayinla command
    blockers: []
    report: docs/belgeler-paylasim-v3-uygulama/ASAMA_13.md
    final_audit: docs/belgeler-paylasim-v3-uygulama/FINAL_AUDIT.md
    manifest: docs/belgeler-paylasim-v3-uygulama/ASAMA_13_changes.json
    manifest_file_sha256: b802c5cc3c9cbe6e18d4b77c844840679bbea743dcc79a7ae0ddeb54417237b4
    external_gate: ASAMA_13 local PASS; ASAMA_14 capacity/RC gates remain. No deployment or release authorization.
    next_stage: ASAMA_14
  - stage: ASAMA_14
    status: PASS
    date: 2026-10-24 Europe/Istanbul
    head: 04048e50fd02e50c1c9ea783acec2d7383f516b4
    worktree_digest: e3f385c044baf63c23d9b2f0ff65d04850a60debfb4fa032f6569113be062f2d
    changed_files:
      - .env.example
      - docs/BELGELER_SISTEMI.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_capacity_model.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_capacity_check.log
      - docs/belgeler-paylasim-v3-uygulama/run-stage14-capacity-check.ps1
      - docs/belgeler-paylasim-v3-uygulama/inspect-stage14-development-state.ts
      - docs/belgeler-paylasim-v3-uygulama/playwright.stage14-cross-browser.config.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_cross_browser.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_cross_browser.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_cross_browser_localhost.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_development_cleanup.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_development_cleanup_localhost.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_development_after_cleanup.log
      - docs/belgeler-paylasim-v3-uygulama/inspect-stage14-production-readonly.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_production_readonly_snapshot.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_production_env_inventory.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_production_env_presence.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_deployment_protection.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_oidc_expiry.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_runtime_logs_retention.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_cron_inventory.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_rc_retry.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_rc_final.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_e2e.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_failed_attempt_cleanup.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_blob_cleanup.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_deploy_final.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_e2e_final.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_db_cleanup_final.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_blob_cleanup_final.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_blob_prefix_cleanup.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_build_final.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_e2e_final.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_blob_store_final.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_rc_acceptance_final.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_origin_unit.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_origin_tsc.json
      - docs/belgeler-paylasim-v3-uygulama/run-stage14-preview-origin-checks.ps1
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_late_rechecks.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_physical_device_inventory.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_changes.json
      - docs/belgeler-paylasim-v3-uygulama/playwright.stage14-preview.config.ts
      - docs/belgeler-paylasim-v3-uygulama/cleanup-stage14-preview.ts
      - docs/belgeler-paylasim-v3-uygulama/cleanup-stage14-preview-blob.ts
      - docs/belgeler-paylasim-v3-uygulama/run-stage14-preview-deploy.ps1
      - docs/belgeler-paylasim-v3-uygulama/run-stage14-preview-e2e.ps1
      - docs/belgeler-paylasim-v3-uygulama/run-stage14-preview-db-cleanup.ps1
      - docs/belgeler-paylasim-v3-uygulama/delete-stage14-preview-store.ps1
      - src/lib/site-config.ts
      - tests/belgeler/belge-share-stage06.test.ts
      - tests/site-audit/belgeler-share-live-acceptance.spec.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_history.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_release_readiness.json
      - docs/belgeler-paylasim-v3-uygulama/finalize-stage14.mjs
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_neon_preview_isolation.jpg
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_blob_production_isolation.jpg
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_blob_preview_isolation.jpg
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_blob_clean.jpg
    commands:
      - command: PowerShell byte inventory of ASAMA_12_pdfs/*_shared.pdf; mean and p95 use all 15 file lengths; p95=nearest-rank
        environment: Local generated Stage12 PDF fixtures; no production/customer documents
        result: PASS
        exit_code: 0
        test_count: 15
        pass: 15
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_capacity_model.json
      - command: '& docs/belgeler-paylasim-v3-uygulama/run-stage14-capacity-check.ps1 | Tee-Object -FilePath docs/belgeler-paylasim-v3-uygulama/ASAMA_14_capacity_check.log'
        environment: Local PowerShell; fixture arithmetic and Vercel snapshot model only; no network/secrets/production access
        result: PASS
        exit_code: 0
        test_count: 21
        pass: 21
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_capacity_check.log
      - command: Vercel MCP read-only team/project/env(decrypt=false)/deployment/private-store inspection; official Vercel and Neon pricing page review
        environment: Read-only connected account and date-stamped official public pricing; Production DB and cron untouched
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14.md
      - command: Vercel billing charges API recheck for 2026-09-24 through 2026-10-24
        environment: Read-only Vercel connected account; 30-day window
        result: NOT_RUN
        exit_code: 404
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        detail: Repeated via Vercel MCP; API returned costs_not_found, so exact current invoice remains unavailable.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_late_rechecks.json
      - command: Vercel MCP filter_project_envs(decrypt=false) and get_project_env for Production POSTGRES_URL_NON_POOLING
        environment: Read-only environment metadata request; decrypted database value never returned or stored
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: Confirmed Sensitive variable targets production+preview; get_project_env returned no decrypted value. The guarded Production SQL inspector did not connect or issue a query.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_late_rechecks.json
      - command: vercel env run -e preview -- node --import tsx docs/belgeler-paylasim-v3-uygulama/cleanup-stage14-preview-blob.ts
        environment: Guarded Blob cleanup for exact Preview-only private test store and belge_paylasim/ prefix
        result: FAIL
        exit_code: 1
        test_count: 1
        pass: 0
        fail: 1
        skip: 0
        detail: Preview env-run OIDC was denied by Blob before the object listing; no blob deletion call was made.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_blob_prefix_cleanup.log
      - command: adb devices -l; idevice_id -l
        environment: Local read-only physical device inventory
        result: NOT_RUN
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        detail: ADB is installed but reports zero connected Android devices; idevice_id is unavailable. No physical device acceptance was possible.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_physical_device_inventory.json
      - command: vercel metrics vercel.request.count and vercel.request.fdt_out_bytes --prod --filter "contains(request_path, /api/belgeler/paylasim/)" --group-by request_method --since 2026-09-24 --until 2026-10-25
        environment: Read-only Vercel CLI 59.1.4; production route aggregate; no request paths or customer identifiers grouped
        result: NOT_RUN
        exit_code: 1
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        detail: Both metric queries returned payment_required; Observability Plus requires Pro/Enterprise. No GET/HEAD count or outgoing byte totals retrieved.
      - command: vercel env run -e development -- npx.cmd playwright test --config docs/belgeler-paylasim-v3-uygulama/playwright.stage14-cross-browser.config.ts (first run with 127.0.0.1 baseURL)
        environment: Local Windows Next.js dev server using Vercel Development variables; existing K01/K02 acceptance only; no Production access
        result: FAIL
        exit_code: 1
        test_count: 2
        pass: 0
        fail: 2
        skip: 0
        detail: Firefox and WebKit received HTTP 403 from quota identity bootstrap before share creation. Retried with localhost; both passed.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_cross_browser.log
      - command: vercel env run -e development -- npx.cmd playwright test --config docs/belgeler-paylasim-v3-uygulama/playwright.stage14-cross-browser.config.ts
        environment: Local Windows Next.js dev server with localhost baseURL and Vercel Development variables; existing K01/K02 acceptance; no Production access
        result: PASS
        exit_code: 0
        test_count: 2
        pass: 2
        fail: 0
        skip: 0
        detail: Desktop Firefox and WebKit passed the live isolated Development Neon/private Blob acceptance in 46.5 seconds.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_cross_browser_localhost.log
      - command: vercel env run -e development -- npx.cmd tsx docs/belgeler-paylasim-v3-uygulama/run-stage13-postgres-live.ts
        environment: Explicitly guarded Vercel Development DB/Blob reset and Stage13 isolated PostgreSQL cleanup/concurrency suite; no Production access
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: Removed test leftovers (6 links, 4 quotas, 6 obligations; 0 Blob objects); runner repeated its 100-ID suite (50 accepted, 50 quota-blocked), then reset all rows to zero.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_development_cleanup_localhost.log
      - command: vercel env run -e development -- npx.cmd tsx docs/belgeler-paylasim-v3-uygulama/inspect-stage14-development-state.ts
        environment: Read-only final snapshot with explicit Development scope; no Production access
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: Schema version 9; V3 rows, non-Development rows and private share-prefix objects all zero after cleanup.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_development_after_cleanup.log
      - command: vercel env ls production --non-interactive
        environment: Read-only Vercel variable metadata; evidence file was sanitized to retain no variable values
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        detail: DB/Neon, share-secret and cron values are Sensitive and shared by Production/Preview; BLOB_STORE_ID is also shared; no Production global quota variables. No values retained.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_production_env_inventory.log
      - command: node.exe -e boolean presence check via vercel env run -e production, then vercel env run -e development
        environment: Read-only boolean presence comparison; prints no variable values
        result: PASS
        exit_code: 0
        test_count: 2
        pass: 2
        fail: 0
        skip: 0
        detail: Production child had no DB URL or Blob token values; Development child had DB URLs/password and Blob token. BLOB_STORE_ID was set only in Production.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_production_env_presence.json
      - command: vercel env run -e production -- npx.cmd tsx docs/belgeler-paylasim-v3-uygulama/inspect-stage14-production-readonly.ts
        environment: Read-only Production inspector with explicit scope guard; no database transaction or Blob operation started
        result: NOT_RUN
        exit_code: 1
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        detail: Production DB connection values were unavailable to the process; guard failed before creating a Pool, issuing SQL, or listing Blob objects. No secrets printed.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_production_readonly_snapshot.log
      - command: curl.exe HEAD, OPTIONS, and unauthenticated GET probes against current/prior generated deployment URLs and production alias; no POST or cron bearer request
        environment: Unauthenticated external HTTP headers only; production deployment protection; no application mutation
        result: PASS
        exit_code: 0
        test_count: 9
        pass: 9
        fail: 0
        skip: 0
        detail: Current/prior unique deployment HEAD and share/cron OPTIONS returned 302; public alias HEAD 200, share OPTIONS 204, no-auth cron GET 401 before cleanup, and share GET without body 405. Authenticated writer/cron behavior remains unverified.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_deployment_protection.json
      - command: Vercel runtime-log query for production function logs, since=7d, query=belge-paylasim-temizlik, group_by=level
        environment: Read-only Vercel Production observability query
        result: NOT_RUN
        exit_code: 400
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        detail: Hobby retains runtime logs for one hour; requested seven-day range returned bad_request. No runtime logs returned.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_runtime_logs_retention.json
      - command: vercel crons list --non-interactive --scope huseying5713-2819s-projects
        environment: Read-only active Production cron configuration; no invocation executed
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: 'One active cleanup schedule: /api/cron/belge-paylasim-temizlik, 0 3 * * *. This does not establish execution history or throughput.'
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_cron_inventory.json
      - command: vercel env run -e development -- node.exe -e inspect OIDC JWT expiry in memory; print expiry only
        environment: Read-only Vercel Development env-run child; token value never emitted or written
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: Historical local .env token expired 2026-10-12T08:56:25Z; the Preview E2E instead used a separate short-lived Vercel env-run token that was accepted and not persisted.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_oidc_expiry.json
      - command: node --import tsx --test --test-concurrency=1 tests/belgeler/belge-share-stage06.test.ts
        environment: Local targeted unit test for Vercel Preview VERCEL_URL-derived exact canonical/allowlist; no network
        result: PASS
        exit_code: 0
        test_count: 10
        pass: 10
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_origin_unit.log
      - command: npx.cmd tsc --noEmit --incremental false -p tsconfig.next.json
        environment: Local production runtime TypeScript scope
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_origin_tsc.json
      - command: '& docs/belgeler-paylasim-v3-uygulama/run-stage14-preview-deploy.ps1'
        environment: Vercel CLI Preview deployment; Development Neon and Preview-only private Blob store supplied as per-deployment overrides; generated secret values not recorded
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: Deployment dpl_9hQVKHvEK9xsETMtYhn89NZiwau8 reached READY; TypeScript and optimized production compilation passed; no alias, GitHub write, project env change, or Production deployment.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_build_final.json
      - command: '& docs/belgeler-paylasim-v3-uygulama/run-stage14-preview-e2e.ps1'
        environment: Chromium against protected Vercel Linux Preview; short-lived Vercel Development env-run token; Development Neon and Preview-only private Blob store
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: K01/K02 end-to-end flow passed; two-link PDF stability, same-browser quota sharing, independent browser quota, and share revocation.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_e2e_final.json
      - command: '& docs/belgeler-paylasim-v3-uygulama/run-stage14-preview-db-cleanup.ps1'
        environment: Vercel Development Neon only; transaction deletes only environment_key=preview rows
        result: PASS
        exit_code: 0
        test_count: 1
        pass: 1
        fail: 0
        skip: 0
        detail: 'Preview rows cleaned: 4 links, 3 quotas, 4 blob obligations; final counts are zero. Development namespace and Production were preserved.'
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_db_cleanup_final.log
      - command: '& docs/belgeler-paylasim-v3-uygulama/delete-stage14-preview-store.ps1'
        environment: Vercel account-scoped deletion of the dedicated private Preview test store only; guarded by exact store name and ID
        result: FAIL
        exit_code: 1
        test_count: 1
        pass: 0
        fail: 1
        skip: 0
        detail: Store deletion returned HTTP 409 because one synthetic Blob object remains; store remains private and Production was untouched.
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_preview_blob_cleanup_final.log
      - command: Vercel dashboard read-only Neon aggregates; configure Preview branch action and disjoint Blob environment connections; clean own Preview fixture; MCP set capacity env
        environment: Authenticated Vercel account; production SQL read-only only; no paid upgrade/deployment
        result: PASS
        exit_code: 0
        test_count: 0
        pass: 0
        fail: 0
        skip: 0
        log_path: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_release_readiness.json
    acceptance_ids:
      - K01
      - K02
    findings_closed:
      - 'F29: exact Vercel Preview canonical host now derives from trusted VERCEL_URL and passed isolated Preview E2E'
      - 'K19: isolated Vercel Linux Preview build/runtime/private Blob K01/K02 gate passed'
      - 'F28: Neon Preview branch action enabled and private Blob resource environment targets separated'
      - 'F22/F25 measured-use tier: current plans, live aggregate usage, zero backlog and explicit no-upgrade 50/day + 600 MB guard selected'
    findings_open:
      - Physical Android/iOS manual acceptance NOT_RUN
      - F09 P2 long-text readability
      - Privileged operator access to old protected deployments
      - Sustained quota-maximum demand is outside the selected Hobby capacity tier
    not_run:
      - 'Physical Android/iOS NOT_RUN: disclosed manual risk under the user''s available-resources completion/publication direction'
      - Future real cron invocation NOT_YET_OBSERVED; no Production load or bulk cleanup test
      - 'Hobby capacity tier: 600 MB liability guard; sustained quota-maximum storage demand returns 503 rather than shortening retention'
    blockers: []
    report: docs/belgeler-paylasim-v3-uygulama/ASAMA_14.md
    capacity_model: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_capacity_model.json
    manifest: docs/belgeler-paylasim-v3-uygulama/ASAMA_14_changes.json
    manifest_file_sha256: bef6243ddd2a96cf80b9efe47e083028ee911924ab4989d751b2afd5aefab9cd
    external_gate: YAYINA_HAZIR for the selected measured-use Hobby/Neon Free tier and available-resources release scope. Production DB read-only access resolved through dashboard; Preview resource isolation configured; no physical-device or high-volume throughput PASS claim.
    next_stage: ASAMA_15
  - stage: ASAMA_15
    status: PASS
    date: 2026-10-24 Europe/Istanbul
    head: 39e801a6cb85fe1594e44ce11e496120f17d1594
    worktree_digest: a4865b64325a04876f1b8fb888a0e921f9a8a1fdfffe2b87c06e86c2f177cf1d
    changed_files:
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15.md
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15_deployment.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15_migration_inputs.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15_migration_verified.jpg
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15_production_smoke.json
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15_production_smoke.log
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15_production_viewer.jpg
      - docs/belgeler-paylasim-v3-uygulama/FINAL_AUDIT.md
      - docs/belgeler-paylasim-v3-uygulama/playwright.stage15-production.config.ts
      - docs/belgeler-paylasim-v3-uygulama/prepare-stage15-migration.mjs
      - docs/belgeler-paylasim-v3-uygulama/record-stage15-release.mjs
      - docs/belgeler-paylasim-v3-uygulama/run-stage15-production-smoke.mjs
      - tests/site-audit/belgeler-stage15-production-smoke.spec.ts
      - docs/belgeler-paylasim-v3-uygulama/ASAMA_15_changes.json
    manifest: docs/belgeler-paylasim-v3-uygulama/ASAMA_15_changes.json
    manifest_file_sha256: 3b231326a600b594f479675c8e864d4d4dfb4a9b2337b07b69545bfb2f9c2737
    report: docs/belgeler-paylasim-v3-uygulama/ASAMA_15.md
    acceptance_ids:
      - K01
      - K02
      - bounded production contract/revoke smoke
    not_run:
      - Physical Android/iOS
      - Production load/bulk cron test
      - 'Future scheduled cron invocation: NOT_YET_OBSERVED'
    next_stage: null
updated_at: 2026-10-24
user_scope_change: '2026-10-24: User explicitly abandoned further full-plan work and ordered immediate Production deployment plus live verification. Remaining physical-device/high-volume/full-plan work is cancelled, not reported as tested.'
```

## Her aşama sonu kayıt şablonu

```yaml
stage: ASAMA_XX
status: PASS # veya FAIL / ENGELLI; NOT_RUN test seviyesinde
date: '<Europe/Istanbul ISO>'
head: '<gercek SHA>'
worktree_digest: '<degisen kaynaklarin ozet kimligi>'
changed_files: []
commands:
  - command: '<tam komut>'
    environment: '<memory / PGlite / isolated Postgres / browser mock / real HTTP>'
    result: PASS
    exit_code: 0
    test_count: 0
    pass: 0
    fail: 0
    skip: 0
    log_path: '<mutlak dosya yolu>'
acceptance_ids: []
findings_closed: []
findings_open: []
not_run: []
external_gate: null
next_stage: ASAMA_YY
```

`completed_stages` yalnız gerçek aşama kapısı geçince artar. Dış erişim gerektirmeyen işler ilerler; zorunlu release kanıtı eksikse 14/15 kapanmaz. Ürün kotası ve eski link güvenliğiyle ilgili FAIL varken bağımlı aşamayı PASS sayma. 13 sonunda `YEREL_TAMAMLANDI`, 14 sonunda `YAYINA_HAZIR`, 15 başarıyla bitince `TAMAMLANDI / next_stage:null`.

`devam`, 15 için yetki değildir; yayın prompt'u açıkça verilir. Tamamlanmış planda `devam` yeni iş/deploy/cleanup başlatmaz. Planning audit çıktıları sonraki uygulama testi gibi yeniden etiketlenmez.

## Başlangıç bulguları ve V3 aşama eşlemesi

Bu tablo bağımsız denetimdeki kapsamı V3 aşamalarına bağlar. Durumlar uygulama öncesi baseline'dır; bu aşamada hiçbir ürün bulgusu kapatılmadı. Denetim kanıtı için `audit_file` dosyasına bakın.

### Rev2 F01–F32

| Bulgu | V3 aşaması | ASAMA_01 sonrası durum |
|---|---|---|
| F01 | 07 | Açık; B02 ile tarihsel browser mock tekrar üretimi var |
| F02 | 03–04 | Açık; N03 ile desteklenmiş |
| F03 | 05 | Açık; N01 ile desteklenmiş |
| F04 | 06 | Açık; N12 ile desteklenmiş |
| F05 | 09 | Açık; pagination/throughput/retry kanıtı bekliyor |
| F06 | 10 | Açık; hızlı etkileşim/bellek testi NOT_RUN |
| F07 | 11 | **KAPANDI (ASAMA_11)**; iki yönlü gerçek Next istemci navigasyonunda yeniden üretildi ve düzeltildi |
| F08 | 10 | Açık; geometry oracle bekliyor |
| F09 | 07, 12 | Açık; warning sınıflandırması ve metin kabulü bekliyor |
| F10 | 08 | **KAPANDI (ASAMA_08)**; IndexedDB geçişi, kesinti güvenliği ve doğrulanmamış durum ayrımı uygulandı |
| F11 | 12 | Açık; YİBF davranışı bekliyor |
| F12 | 05–07 | Açık; reserved/abuse/capacity HTTP semantiği bekliyor |
| F13 | 07 | Açık; response generation/lost-response recovery bekliyor |
| F14 | 11 | **KAPANDI (ASAMA_11)**; HEAD DB metadata okur, Blob factory/GET/stream açmaz |
| F15 | 06, 11 | **KAPANDI YEREL (ASAMA_11)**; gerçek Next production HTTP, metadata ve referer kabulü PASS |
| F16 | 11 | **KAPANDI (ASAMA_11)**; usePathname ile dar kabuk; headers/middleware kaldırıldı, before/after build ölçüldü |
| F17 | 14–15 | Açık; önceki deployment gözlemi tarihsel, Vercel'de yeniden doğrulanmadı |
| F18 | 12–13 | Açık; yeni 5×3 PDF parity kanıtı bekliyor |
| F19 | 10 | Açık; initial expiry ve etiket uyumu bekliyor |
| F20 | 06, 14 | Açık; IP header güven zinciri production'da NOT_RUN |
| F21 | 09 | Açık; orphan/backlog/retry/revoke lifecycle bekliyor |
| F22 | 14 | Açık; mevcut plan/fatura incelenmedi, fiyat iddiası yok |
| F23 | 03, 05, 07, 13 | Açık; K01/K02 zorunlu kullanıcı kabulü |
| F24 | 05, 07 | Açık; history ile server quota aggregate ayrımı bekliyor |
| F25 | 05, 09, 14 | Açık; kapasite için 4.500 kayıt hesabı ve gerçek byte/throughput ölçümü bekliyor |
| F26 | 03 | Açık; anonim cookie kimliği ve sınırları bekliyor |
| F27 | 05–07 | Açık; server reset/Retry-After/reserved ayrımı bekliyor |
| F28 | 01–02, 14 | Açık; preview/production kaynak izolasyonu teyidi bekliyor |
| F29 | 06 | Açık; production canonical host ve izole preview hostu bekliyor |
| F30 | 03 | Açık; bootstrap/iki sekme koordinasyonu bekliyor |
| F31 | 08 | **KAPANDI (ASAMA_08)**; 20 sınırı kaldırıldı, 4.500 aktif kayıt erişilebilir |
| F32 | 04, 11 | **NOT_A_BUG_CURRENT_CODE**; mevcut `revokedAt` önceliği korunmalı |

### Yeni N01–N18 bulguları

| Bulgu | V3 aşaması | ASAMA_01 sonrası durum |
|---|---|---|
| N01 | 05, 13 | Açık; distinct-ID kota yarışı ve gerçek SQL atomikliği |
| N02 | 04 | Açık; failed kayıt sonrası güvenli retry |
| N03 | 03, 04 | Açık; owner/proof ile replay yetkilendirmesi |
| N04 | 04 | Açık; tombstone GC sonrası token nonce ayrımı |
| N05 | 05, 09 | Açık; failed Blob orphan ve byte borcu |
| N06 | 08 | **KAPANDI (ASAMA_08)**; getSafeLocalStorage/getSafeIndexedDB try-catch korumalı |
| N07 | 09 | Açık; cleanup delete hatasının HTTP sonucu |
| N08 | 06, 11 | **KAPANDI (ASAMA_11)**; body boş, Blob transferi sıfır |
| N09 | 06 | Açık; exact request schema ve same-origin başlıkları |
| N10 | 09, 14 | Açık; cleanup throughput/backlog |
| N11 | 04, 09 | Açık; terminal purge durumundan geç finalize engeli |
| N12 | 06 | Açık; gerçek bounded-stream gövde limiti |
| N13 | 02 | Açık; runtime DDL kaldırılması/readiness |
| N14 | 01, 02 | Açık; production fail-closed; ASAMA_01 yerel ortamında DB/Blob config bulunmadığı teyit edildi |
| N15 | 06, 12 | Açık; PDF parse/page/AcroForm doğrulaması ve güvenli hata mesajı |
| N16 | 10 | Açık; viewer cleanup/fit/pinch/tema davranışı |
| N17 | 14 | Production'da teyitsiz tasarım riski; eski deployment writer/cron erişimi doğrulanmalı |
| N18 | 04, 05 | Açık; midnight reserve/finalize/refund atomik semantiği |

### Browser mock bulguları B01–B03

| Bulgu | V3 aşaması | ASAMA_01 sonrası durum |
|---|---|---|
| B01 | 07 | Tarihsel browser mock'ta DELETE hatası görünmez kaldı; düzeltme bekliyor |
| B02 | 07 | Tarihsel browser mock'ta form revision sonrası yeni paylaşım yolu çıkmadı; düzeltme bekliyor |
| B03 | 07, 13 | Tarihsel browser mock'ta 320px taşma ve küçük dokunma hedefleri görüldü; düzeltme bekliyor |

