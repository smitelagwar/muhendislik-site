# Belgeler — Paylaşım Nihai V2 Uygulama Durumu

```yaml
plan_id: INSA-BELGELER-LINK-V2-20261023
plan_revision: 2
plan_file: PLAN/BELGELER_PAYLASIM_NIHAI_V2_PLAN.md
planning_status: PLAN_HAZIR
execution_status: DEVAM_EDIYOR
source_branch: main
source_commit_at_planning: 323b064960bbdc9cbab0b4fbc55f74ca7f6fdf47
active_stage: null
next_stage: ASAMA_10
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
stages:
  ASAMA_01: { title: "Baseline ve Node flatten POC", status: PASS }
  ASAMA_02: { title: "Akıllı dosya adı ve PDF İndir", status: PASS }
  ASAMA_03: { title: "Paylaş arayüzü, backend kapalı", status: PASS }
  ASAMA_04: { title: "Şema, private Blob, token ve kota", status: PASS }
  ASAMA_05: { title: "Sunucuda PDF üretimi ve API", status: PASS }
  ASAMA_06: { title: "Salt-okunur PDF viewer ve /b", status: PASS }
  ASAMA_07: { title: "Bağlantı oluşturma, kopyalama, iptal", status: PASS }
  ASAMA_08: { title: "Cron, purge ve retention", status: PASS }
  ASAMA_09: { title: "Entegre kabul, güvenlik ve performans", status: PASS }
  ASAMA_10: { title: "Tek Production release", status: PENDING }
decisions_locked:
  - "WhatsApp/native PDF paylaşımı, wa.me, navigator.share, QR, e-posta linki yok"
  - "Yalnız Paylaş > Bağlantı oluştur > Kopyala; 90 gun sabit"
  - "İndir editable kalır; link PDF'si sunucuda flatten:true oluşturulur"
  - "Anonim PDF byte upload yok; sunucu yalnız allowlist form JSON kabul eder"
  - "Ayrı belge_paylasim_links tablosu ve private belge_paylasim/ prefix"
  - "Görüntüleyici /b/[token]; dokumantasyon /p/[token] korunur"
  - "Önce DB revoke, sonra Blob sil; expire anında HTTP 410"
  - "Production DB/kota/Blob/secret yoksa fail-closed"
  - "ASAMA_10 öncesinde push veya Vercel deploy yok"
open_checks:
  - "ASAMA_01: yerel HEAD/worktree ile plan sürümü eşleştir [TAMAMLANDI]"
  - "ASAMA_01: beş Node flatten POC görsel/metinsel ve boyut ölçümü [TAMAMLANDI]"
  - "ASAMA_01: migration dizisi ve private Blob/Neon varlık kontrolü [TAMAMLANDI]"
  - "ASAMA_02: 5 belge akıllı dosya adı sözleşmesi ve birim testleri [TAMAMLANDI]"
  - "ASAMA_03: 5 stüdyo Paylaş modal/diyalog ve responsive giriş noktası [TAMAMLANDI]"
  - "ASAMA_10: BELGE_SHARE_SECRET ve CRON_SECRET üretimde var mı"
  - "ASAMA_10: Vercel Production READY ve canlı smoke"
evidence:
  - stage: ASAMA_01
    date: '2026-10-23T16:21:00+03:00'
    checks:
      git_head: "323b064960bbdc9cbab0b4fbc55f74ca7f6fdf47 (main, eşleşiyor)"
      node_version: "v24.15.0"
      npm_version: "11.12.1"
      dirty_worktree: "Kullanıcı akordeon/taslak/alan odak değişiklikleri korundu, çakışma yok"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      check_belgeler_pdf: "PASS (195 test, 32 suite, 0 fail)"
      eslint_belgeler: "PASS (src/lib/pdf-engine.ts, src/lib/belgeler*, 0 hata)"
      global_tsc_eslint_baseline: "KNOWN_FAIL (diğer alanlar: test-data, ecc, cad-v2, docs vb.)"
      migration_sequence: "db/migrations içinde 001, 002, 004 mevcut. Yeni sıra: 005_belge_paylasim.sql. dok_schema_migrations ve LATEST_REQUIRED_SCHEMA_VERSION=008 izole tutulacak."
      root_layout_chrome: "src/app/layout.tsx doğrudan Navbar, Footer, GlobalOverlays render ediyor. /b/[token] için route-aware veya route-group izolasyonu ASAMA_06'da uygulanacak."
      flatten_poc_results:
        beton_dokum_tutanagi: { page: 1, unflat_kb: 1204.6, flat_kb: 1200.0, unflat_fields: 10, flat_fields: 0, status: PASS }
        santiye_sefi_taahhutnamesi: { page: 1, unflat_kb: 1258.7, flat_kb: 1253.8, unflat_fields: 14, flat_fields: 0, status: PASS }
        santiye_sefi_istifa_dilekcesi: { page: 1, unflat_kb: 1224.7, flat_kb: 1219.9, unflat_fields: 13, flat_fields: 0, status: PASS }
        insaat-ruhsati_dilekcesi: { page: 1, unflat_kb: 1155.9, flat_kb: 1152.3, unflat_fields: 8, flat_fields: 0, status: PASS }
        santiye_sefi_sozlesmesi: { page: 2, unflat_kb: 1256.9, flat_kb: 1252.1, unflat_fields: 14, flat_fields: 0, status: PASS }
        pdf_header_verified: true
        size_ceiling_assessment: "En büyük çıktı 1253.8 KB (~1.22 MiB); 3.0 MiB tavanı güvenli ve yeterli."
  - stage: ASAMA_02
    date: '2026-10-23T16:28:00+03:00'
    checks:
      files_created:
        - src/lib/belge-filename.ts
        - tests/belgeler/belge-filename.test.ts
      files_updated:
        - src/lib/pdf-engine.ts
        - tests/site-audit/belgeler-functional-audit.spec.ts
      unit_tests: "PASS (tests/belgeler/belge-filename.test.ts, 18/18 test passed)"
      check_belgeler_pdf: "PASS (213/213 test passed, 38 suite, 0 failure)"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      eslint_modified: "PASS (src/lib/belge-filename.ts, src/lib/pdf-engine.ts, tests/belgeler/belge-filename.test.ts, 0 hata, 0 uyarı)"
      naming_contract:
        taahhutname: "Taahhutname_Ad-Soyad_YYYY-MM-DD.pdf (örnek ad Hüseyin GÜNAYDIN atlanır -> Taahhutname_YYYY-MM-DD.pdf)"
        istifa: "Istifa-Dilekcesi_Ad-Soyad_YYYY-MM-DD.pdf (örnek ad atlanır)"
        ruhsat: "Ruhsat-Dilekcesi_Ad-Soyad_YYYY-MM-DD.pdf (örnek ad atlanır)"
        sozlesme: "Hizmet-Sozlesmesi_Ad-Soyad_YYYY-MM-DD.pdf (sozlesme_tarihi ISO formatında)"
        beton_dokum: "Beton-Tutanagi_YIBF-1234567_YYYY-MM-DD.pdf"
      security_and_edge_cases:
        path_traversal: "PASS (../../etc/passwd -> etc-passwd)"
        emoji_and_special: "PASS (temizlendi, güvenli ASCII Latin)"
        max_length: "PASS (isim azami 40 karakter, toplam dosya adı azami 100 karakter)"
        double_pdf_prevention: "PASS (asla .pdf.pdf üretilmez)"
        calendar_validation: "PASS (31.02.2026 ve 31.04.2026 gibi geçersiz takvim tarihleri Europe/Istanbul now tarihine düşer)"
        download_editable: "PASS (indirilen filled PDF düzenlenebilir kalır, boş şablonlar *_BOS.pdf etkilenmez)"
  - stage: ASAMA_03
    date: '2026-10-23T16:39:00+03:00'
    checks:
      files_created:
        - src/components/belge-paylasim/belge-share-dialog.tsx
        - src/hooks/use-belge-share.ts
        - tests/belgeler/belge-share-ui.test.ts
      files_updated:
        - src/components/belge-studio-actions.tsx
        - src/components/belge-studio-icons.tsx
        - src/components/beton-dokum-studio.tsx
        - src/components/taahhutname-studio.tsx
        - src/components/istifa-studio.tsx
        - src/components/insaat-ruhsati-studio.tsx
        - src/components/sozlesme-studio.tsx
      ui_contract:
        dialog_title: "PDF görüntüleme bağlantısı"
        dialog_description: "Bağlantıya sahip herkes bu belgeyi 90 gün görüntüleyebilir. PDF düzenlenemez; bağlantıyı bu cihazdan iptal edebilirsin."
        whatsapp_share_removed: "KESİN DOĞRULAMA: WhatsApp, wa.me, navigator.share, QR veya e-posta paylaşımı arayüzde bulunmaz."
        sensitive_data_warning: "Formda örnek veya kişisel veriler varken uyarı kutusu gösterilir."
        backend_offline_flag: "backendReady=false iken buton güvenle devredışı kalır, kullanıcıya servisin hazırlandığı bildirilir."
        responsive_entrypoint:
          desktop: "Yazdır yanında 'Paylaş' butonu (min-h-11)"
          mobile_320px: "⋯ menüsü içinde 'Paylaş' menü öğesi (taşma sıfır)"
          mobile_390px: "Alt eylem barında 44x44 dokunma alanlı ikon butonu + ⋯ menüsü"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      check_belgeler_pdf: "PASS (218/218 test passed, 39 suite, 0 failure)"
      eslint_modified: "PASS (tüm yeni ve güncellenen bileşenlerde 0 hata, 0 uyarı)"
  - stage: ASAMA_04
    date: '2026-10-23T16:51:00+03:00'
    checks:
      files_created:
        - db/migrations/005_belge_paylasim.sql
        - src/lib/belge-paylasim/types.ts
        - src/lib/belge-paylasim/config.ts
        - src/lib/belge-paylasim/tokens.ts
        - src/lib/belge-paylasim/blob-store.ts
        - src/lib/belge-paylasim/repository.ts
        - src/lib/belge-paylasim/service-core.ts
        - tests/belgeler/belge-share-server.test.ts
      unit_tests: "PASS (tests/belgeler/belge-share-server.test.ts, 23/23 test passed, 8 suite, 0 fail)"
      check_belgeler_pdf: "PASS (241/241 test passed, 47 suite, 0 failure)"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      eslint_modified: "PASS (src/lib/belge-paylasim/*, tests/belgeler/belge-share-server.test.ts, 0 hata, 0 uyarı)"
      security_and_contracts:
        token_derivation: "HMAC-SHA256 ile domain-separated (view:v1:, manage:v1:), 256-bit entropi, ham tokenlar asla DB'ye yazılmaz; yalnız SHA-256 hash saklanır."
        payload_digest: "Kanonik sıralı JSON ile HMAC-SHA256 form özeti; aynı requestId ile farklı veri 409 IDEMPOTENCY_CONFLICT verir."
        idempotency: "Aynı requestId ve veriyle gelen tekrarlarda mevcut kayıt ve token çifti idempotent döndürülür; pending iken 409 OPERATION_IN_FLIGHT."
        ip_privacy: "Tuzlanmış/pseudonymous IP HMAC kullanılır; veritabanında düz IP adresi ASLA saklanmaz."
        quota_enforcement:
          ip_15min: "Azami 3 deneme (4. istek 429 QUOTA_EXCEEDED, Retry-After: 900)"
          ip_24hr: "Azami 10 deneme (11. istek 429 QUOTA_EXCEEDED, Retry-After: 3600)"
          ip_active: "IP başına azami 20 aktif bağlantı"
          global_daily: "Sitede 24 saatte azami 200 bağlantı"
          global_storage: "Azami 1 GiB toplam aktif Blob depolama bütçesi"
        revocation_order: "Önce DB'de revoked işaretlenir (anında 410); ardından private Blob del çağrılır. del başarısız olsa bile DB kapalı kalır, hata kodlanır."
        race_conditions: "Eşzamanlı 20 paralel istekte DB UNIQUE constraint sayesinde yalnız tek kayıt açılır."
        fail_closed: "Production'da BELGE_SHARE_SECRET (< 32 karakter veya eksik) ya da DATABASE_URL eksikse doğrudan güvenlik istisnası fırlatılır."
  - stage: ASAMA_05
    date: '2026-10-23T16:58:00+03:00'
    checks:
      files_created:
        - src/app/api/belgeler/paylasim/route.ts
        - src/app/api/belgeler/paylasim/[token]/route.ts
        - src/lib/belge-paylasim/request-validation.ts
        - src/lib/belge-paylasim/server-pdf.ts
        - tests/belgeler/belge-share-api.test.ts
      files_updated:
        - src/lib/site-config.ts
        - src/lib/belge-paylasim/blob-store.ts
      unit_tests: "PASS (tests/belgeler/belge-share-api.test.ts, 23/23 test passed, 7 suite, 0 fail)"
      check_belgeler_pdf: "PASS (264/264 test passed, 54 suite, 0 failure)"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      eslint_modified: "PASS (tüm API ve yardımcı dosyalarda 0 hata, 0 uyarı)"
      api_and_security_contracts:
        post_share:
          route: "/api/belgeler/paylasim (POST)"
          payload_limit: "Azami 64 KiB JSON (65536 bayt üzeri 413 PAYLOAD_TOO_LARGE)"
          same_origin: "Cross-site istekleri 403 CROSS_SITE_FORBIDDEN; uyuşmayan Origin 403 INVALID_ORIGIN"
          content_type: "application/json zorunlu (aksi halde 415 UNSUPPORTED_MEDIA_TYPE)"
          document_allowlist: "Yalnız izin verilen 5 belge tipi ve belgeye özel 56 düzenlenebilir alan (bilinmeyen alanlar 400 UNKNOWN_FIELD)"
          field_length_limit: "Azami 2000 karakter/alan (aşılırsa 400 FIELD_TOO_LONG)"
          idempotency: "Aynı clientRequestId ve payload ile tekrar çağrıldığında 200 OK + mevcut token/URL; farklı veride 409 IDEMPOTENCY_CONFLICT"
          server_flatten_pdf: "5 belgenin tamamı sunucuda flatten:true olarak üretilir, AcroForm alan sayısı tam 0, %PDF-1.4 geçerli, boyut < 3 MiB"
          rate_limit_headers: "Kota aşımında 429 QUOTA_EXCEEDED ve Retry-After: 900 başlığı"
        delete_share:
          route: "/api/belgeler/paylasim/[token] (DELETE)"
          auth_header: "x-manage-token başlığı zorunlu (eksikse 400 MISSING_MANAGE_TOKEN)"
          token_verification: "viewToken kaydının manageTokenHash değeri ile sabit süreli (constant-time) eşleştirilir (uyuşmazsa 403 FORBIDDEN)"
          unknown_token: "Bilinmeyen token 404 NOT_FOUND"
          revocation_order: "Önce DB revoked (anında 410) -> private Blob del silinir -> 200 revoked döner"
          idempotency: "Daha önce iptal edilmiş bağlantıya tekrar DELETE geldiğinde 200 revoked döner"
          post_revocation_replay: "İptal edilen bağlantının clientRequestId'si ile tekrar POST yapılırsa 410 LINK_REVOKED döner"
        disallowed_methods:
          get_create: "GET /api/belgeler/paylasim -> 405 Method Not Allowed (Allow: POST)"
          get_revoke: "GET /api/belgeler/paylasim/[token] -> 405 Method Not Allowed (Allow: DELETE)"
  - stage: ASAMA_06
    date: '2026-10-23T17:06:00+03:00'
    checks:
      files_created:
        - src/app/b/[token]/page.tsx
        - src/components/belge-paylasim/belge-share-viewer.tsx
        - src/app/api/belgeler/paylasim/[token]/pdf/route.ts
        - src/middleware.ts
        - tests/belgeler/belge-share-viewer.test.ts
      files_updated:
        - src/app/layout.tsx
        - src/app/robots.ts
        - src/lib/belge-paylasim/blob-store.ts
      unit_tests: "PASS (tests/belgeler/belge-share-viewer.test.ts, 12/12 test passed, 3 suite, 0 fail)"
      check_belgeler_pdf: "PASS (276/276 test passed, 57 suite, 0 failure)"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      eslint_modified: "PASS (tüm yeni ve güncellenen dosyalarda 0 hata, 0 uyarı)"
      viewer_and_security_contracts:
        pdf_stream_route:
          route: "/api/belgeler/paylasim/[token]/pdf (GET, HEAD)"
          content_type: "application/pdf"
          content_disposition: "inline; filename=\"paylasilan-belge.pdf\" (kişi adı veya hassas veri sızıntısı sıfır)"
          headers: "Cache-Control: private, no-store, no-cache, must-revalidate; X-Robots-Tag: noindex, nofollow, noarchive; X-Content-Type-Options: nosniff"
          lifecycle_enforcement: "viewToken sorgulanır; expired veya revoked durumlarında anında 410 Gone döner"
        root_chrome_isolation:
          middleware: "src/middleware.ts x-pathname başlığı ile gelen yolu işaretler"
          layout: "src/app/layout.tsx /b/ rotasında Navbar, Footer ve GlobalOverlays bileşenlerini DOM'a dahi basmaz; tam ekran izole görüntüleme sağlanır"
          noindex_metadata: "Sayfa meta verisinde noindex, nofollow, nocache tanımlı; title genel ve kişisel veri içermez"
          robots_disallow: "src/app/robots.ts disallow kuralına /b/ eklendi"
        viewer_controls:
          allowed: "Sadece okuma, zoom in (+), zoom out (-), sığdır, sayfa 1/2 ileri-geri ve yeniden dene"
          forbidden_omitted: "İndir, yazdır, form düzenleme, harici sekmede açma veya WhatsApp/cihaz paylaşımı arayüzde KESİNLİKLE bulunmaz"
          shortcuts_intercepted: "Ctrl+P ve Ctrl+S klavye kısayolları engellendi"
  - stage: ASAMA_07
    date: '2026-10-23T17:13:00+03:00'
    checks:
      files_created:
        - src/lib/belge-paylasim/local-link-registry.ts
        - tests/belgeler/belge-share-client.test.ts
      files_updated:
        - src/hooks/use-belge-share.ts
        - src/components/belge-paylasim/belge-share-dialog.tsx
        - src/components/beton-dokum-studio.tsx
        - src/components/taahhutname-studio.tsx
        - src/components/istifa-studio.tsx
        - src/components/insaat-ruhsati-studio.tsx
        - src/components/sozlesme-studio.tsx
      unit_tests:
        - "PASS (tests/belgeler/belge-share-client.test.ts, 9/9 test passed, 3 suite, 0 fail)"
        - "PASS (tests/belgeler/belge-share-ui.test.ts, 5/5 test passed, 1 suite, 0 fail)"
      check_belgeler_pdf: "PASS (285/285 test passed, 60 suite, 0 failure)"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      eslint_modified: "PASS (tüm yeni ve güncellenen dosyalarda 0 hata, 0 uyarı)"
      client_contracts:
        frozen_form_snapshot: "Bağlantı oluştur tıklandığında form o anki alanlarıyla dondurulur; sonradan yapılan form düzenlemeleri oluşturulan bağlantıyı etkilemez."
        local_registry_cap: "localStorage üzerinde azami 20 bağlantı sınırı korunur (FIFO); kişisel ad/veri tutulmaz, yalnız teknik anahtarlar saklanır."
        clipboard_copy: "Panoya kopyalama ve 3 saniyelik görsel 'Kopyalandı' geri bildirimi."
        in_app_cancellation: "Kullanıcı onayı sonrası DELETE /api/belgeler/paylasim/[token] ile anında 410 iptal; hem yerelde hem sunucuda durum güncellenir."
        device_history_accordion: "'Bu Cihazdaki Bağlantılarım' akordeon listesiyle önceki bağlantıları görüntüleme, kopyalama veya iptal etme."
        strict_scope: "WhatsApp, wa.me, navigator.share, QR veya mailto KESİNLİKLE YOKTUR."
  - stage: ASAMA_08
    date: '2026-10-23T17:22:00+03:00'
    checks:
      files_created:
        - src/lib/belge-paylasim/cleanup.ts
        - src/app/api/cron/belge-paylasim-temizlik/route.ts
        - tests/belgeler/belge-share-cleanup.test.ts
      files_updated:
        - src/lib/belge-paylasim/blob-store.ts
        - src/lib/belge-paylasim/repository.ts
        - vercel.json
        - .env.example
        - DOK_STORAGE_CONTRACT.md
      unit_tests:
        - "PASS (tests/belgeler/belge-share-cleanup.test.ts, 18/18 test passed, 9 suite, 0 fail)"
      check_belgeler_pdf: "PASS (303/303 test passed, 69 suite, 0 fail)"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      eslint_modified: "PASS (0 hata, 0 uyarı)"
      retention_and_purge_contracts:
        batch_lease_purge: "Süresi dolan (90 gün) veya iptal edilen bağlantıların Blob nesneleri batch-lease ile kilitlenip silinir; ardından DB kaydı 'purged' durumuna geçirilir."
        stale_pending_reconciliation: "24 saati aşan ve 'ready' durumuna geçememiş 'pending' rezervasyonlar uzlaştırılarak Blob ve kayıtları temizlenir."
        orphan_blob_grace_purge: "'belge_paylasim/' öneki altındaki, DB'de kaydı bulunmayan ve 24 saati geçmiş yetim Blob'lar taranıp temizlenir. Dokümantasyon ('dok_storage/') ve CAD öneklerine kesinlikle dokunulmaz."
        tombstone_gc: "30 günden eski 'purged' kayıtları veritabanından tamamen silinir; 30 günden yeni purged kayıtlar mezar taşı olarak korunur."
        cron_route_authorization: "Vercel Cron rotası /api/cron/belge-paylasim-temizlik yalnızca geçerli CRON_SECRET ile Bearer yetkilendirmesi kabul eder. Eksik/yanlış secret durumunda 401 fail-closed davranır. Yalnızca GET kabul edilir, diğer metodlar 405 döner."
        instant_expiry_contract: "Cron henüz çalışmasa bile süresi geçen link /api/belgeler/paylasim/[token]/pdf rotasından anında 410 Gone döner."
        vercel_cron_config: "vercel.json dosyasına '0 3 * * *' günlük cron işi eklendi; mevcut yapılandırma korundu."
  - stage: ASAMA_09
    date: '2026-10-23T17:47:00+03:00'
    checks:
      files_created:
        - tests/site-audit/belgeler-share-e2e.spec.ts
      files_updated:
        - src/hooks/use-belge-share.ts
        - src/lib/belge-paylasim/request-validation.ts
        - docs/BELGELER_SISTEMI.md
        - .agents/rules/belgeler-kurallari.md
      playwright_e2e:
        - "PASS (tests/site-audit/belgeler-share-e2e.spec.ts, 5/5 test passed, 15.0s, 0 failure)"
        - "5 stüdyo için: Paylaş modalı açıldı, WhatsApp/wa.me/QR/mailto kesin yokluğu doğrulandı, link üretildi, kopyalandı, /b/[token] salt-okunur canvas doğrulandı, site header/nav/footer izolasyonu doğrulandı, bağlantı iptal edildi ve anında 410 Bağlantı İptal Edildi ekranı doğrulandı."
      check_belgeler_pdf: "PASS (303/303 test passed, 69 suite, 0 failure)"
      next_build: "PASS (next build --webpack, 0 hata, 627 sayfa başarıyla derlendi)"
      tsc_runtime: "PASS (npx tsc -p tsconfig.next.json --noEmit, 0 hata)"
      eslint_modified: "PASS (0 hata, 0 uyarı)"
      security_audit_gate:
        form_allowlist: "Sadece bilinen 56 form alanı kabul edilir; keyfî alanlar veya 64 KiB üstü yükler reddedilir."
        zero_arbitrary_upload: "Anonim keyfî PDF baytı yükleme rotası kesinlikle bulunmaz."
        zero_pii_leakage: "TC, ad, soyad veya adres verileri URL'lerde, loglarda veya OpenGraph meta etiketlerinde sızdırılmaz."
        private_blob_stream: "Private Blob doğrudan genel erişime kapalıdır; akış yalnızca doğrulanmış /api rotası üzerinden 'private, no-store' ile sunulur."
        crypto_tokens: "256-bit entropili HMAC-SHA256 viewToken ve manageToken; veritabanında sadece SHA-256 hash saklanır."
        idor_protection: "İptal eylemi x-manage-token gerektirir ve timingSafeEqual ile sabit-zamanlı doğrulanır."
        layout_isolation: "/b/[token] rotasında root layout Navbar, Footer ve GlobalOverlays DOM'dan tamamen çıkarılmıştır."
        living_docs_updated: "docs/BELGELER_SISTEMI.md ve .agents/rules/belgeler-kurallari.md akıllı dosya adı ve paylaşım mimarisiyle güncellendi."
blockers: []
updated_at: '2026-10-23T17:47:00+03:00'
```

**ASAMA_09 başarıyla tamamlandı.** Kural gereği bir mesajda yalnız bir aşama tamamlanır ve durulur. Sıradaki ve son aşama `ASAMA_10` (Tek Production release, Vercel canlı smoke).
