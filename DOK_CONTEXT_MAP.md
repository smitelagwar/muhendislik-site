# Dokümantasyon bağlam haritası

Son güncelleme: 30 Ağustos 2026 (CAD Preview V2 Hardening — Aşama 1–8)

Bu dosya `/dokumantasyon` modülünün hızlı başlangıç haritasıdır. Ayrıntılı CAD geçmişi için `docs/cad-upstream-migration-stage*.md`, **güncel CAD çalışma mimarisi** için `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` okunur.

> Buradaki maddeler mevcut production yapısını tarif eder; değişmez mimari kurallar değildir. Yeni bir görev mevcut yapıyı hızlandırabilir, sadeleştirebilir veya değiştirebilir. Kaynak kod ve güncel testler her zaman son doğrulama noktasıdır.

## Ana route'lar

- `/dokumantasyon`
- `/dokumantasyon/dosya/[fileId]`
- `/p/[token]`
- `/giris`

## UI / workspace

Ana bileşenler `src/components/dokumantasyon/` ağacındadır. Özellikle:

- `admin-shell.tsx`
- `file-manager.tsx` — Drive V3.1 Sanallaştırılmış Dosya Yöneticisi (TanStack Virtual, Zero-F5, PDD Drag & Drop, Virtual Marquee)
- `drive-sidebar.tsx`
- `drive-details-drawer.tsx`
- `studio/document-studio-shell.tsx`
- `preview/file-preview-shell.tsx`

Responsive workspace; geniş ekranda sidebar/details, dar ekranda drawer/sheet yaklaşımını kullanır.

## Drive V3.1 Mimarisi (Nihai Standart)

Dosya yöneticisi (`/dokumantasyon`) V3.1 sürümüyle aşağıdaki modern işletim sistemi ve bulut depolama standartlarına yükseltilmiştir:

- **Sıfır-F5 & Server-State:** `@tanstack/react-query`, tek `deriveExplorerView` comparator'ı, optimistic pending updates, abort controller request cancellation.
- **Sanal Marquee:** Matematiksel offscreen hit-testing, row-major Grid Shift seçimi, sağ tık çoklu seçim koruması (`src/components/dokumantasyon/drive-v3/selection-reducer.ts`).
- **Body-Level Overlay:** `#dok-overlay-root` ve `OverlayPortal` ile scroll konumundan bağımsız viewport-centered modallar (`--dok-z` tokenleri).
- **Toplu İşlemler & PDD:** `/api/dokumantasyon/bulk/*` (trash, move, star, restore), tek request 100 item, max chunk 250, partial failure toleransı, Atlassian Pragmatic Drag & Drop auto-scroll (`pdd-integration.ts`, `bulk-operations.ts`).
- **Transfer Kuyruğu:** Eşzamanlılık (concurrency: 3) limitli, iptal ve yeniden deneme destekli `UploadQueueManager`.
- **Sanallaştırma & Ölçek:** `@tanstack/react-virtual` 5.000+ item desteği, mounted DOM < 250 node, anchor-preserving resize (`use-virtual-explorer.ts`, `virtual-scroll.ts`).
- **Görsel & Mobil:** CSS GPU transitions (will-change, virtual row/card üzerinde framer-motion yasağı), 500ms long-press state machine, callout suppression, `touch-action: pan-y`, `100dvh`, `viewportFit: cover`.
- **Birleşik Test Paketi:** `npm run check:dok-drive-v3` (tüm aşamalar 1-9 tek komutla test edilir).
- **Ayrıntılı Belgeler:** `docs/DOK_DRIVE_V3_ARCHITECTURE.md`, `docs/DOK_DRIVE_V3_INTERACTION_CONTRACT.md`, `docs/DOK_DRIVE_V3_COMMAND_MATRIX.md`, `docs/DOK_DRIVE_V3_TEST_MATRIX.md`, `docs/DOK_DRIVE_V3_PERFORMANCE_BUDGET.md`.


## API / veri / storage

API route'ları `src/app/api/dokumantasyon/` altındadır. Auth, klasör, dosya, çöp kutusu, paylaşım, upload, download ve preview tüketicileri burada aranır.

DB/veri helper'ları ağırlıklı olarak `src/lib/dokumantasyon/` altındadır:

- `db.ts`
- `files.ts`
- `folders.ts`
- `trash.ts`
- `shares.ts`
- `auth.ts`
- `file-access.ts`
- `storage-lifecycle.ts`

Kalıcı storage yaşam döngüsü için `DOK_STORAGE_CONTRACT.md`, operasyonel notlar için `docs/DOKUMANTASYON_RUNBOOK.md` kullanılır.

Upload intent/finalize akışı idempotent olacak şekilde tasarlanmıştır. Silme sırasında Blob/disk tarafı başarısızsa metadata kaybını önleyen korumalar vardır. Reconciliation için `scripts/reconcile-dokumantasyon-storage.mjs` bulunur. Test veri izolasyonu `DOK_LOCAL_DATA_DIR` ve run-level Playwright izolasyonu ile korunur (kullanıcı `.data/dok_db.json` deposu 1133 dosyada sabittir).

## Metadata / collection davranışı

Mevcut sistemde:

- `starred_at` dosya/klasör favori durumunu,
- spam-korumalı `last_opened_at` son açılma bilgisini,
- `items/route.ts` koleksiyon/filtre sorgularını,
- `activity.ts` ve `/api/dokumantasyon/activity` minimal upload/rename/move/trash/restore/share aktivitelerini

taşır.

Bulk move item bazlı partial-failure sözleşmesini kullanır. Klasör yükleme destekleyen tarayıcıda dinamik picker ile çalışır; relative path sanitize edilir ve kurulum yarıda kalırsa yeni boş klasörler rollback edilebilir. Queue item gerçek `File` referansını tutarak retry sağlar.

## Preview sistemi

Aktif dosya görüntüleme route'u `DocumentStudioShell` kullanır. PDF, image, CAD ve diğer preview bileşenleri `src/components/dokumantasyon/studio/` ve `src/components/dokumantasyon/preview/` altında bulunur.

Document Studio bir full-viewport shell'dir. CAD upstream host'u üst barın altında kalan içerik alanının **tam genişlik ve tam yüksekliğini** kullanır; sabit `vh` minimumlarıyla yarım ekran oluşturulmamalıdır. `Gerçek Renk`, `Siyah-Beyaz` ve `Lineweight` kontrolleri Document Studio üst barındaki `cad-studio-toolbar-slot` içine portal edilir ve çizim canvas'ını kapatmaz. Topbar olmayan CAD yüzeylerinde küçük floating fallback kontrolü kullanılabilir. Bu mevcut UX sözleşmesi ileride değiştirilebilir; değişirse bu bölüm de aynı görevde güncellenir.

Bu full-viewport/topbar düzeni PR `#22` ile kabul testlerinden geçirilerek `main`e alınmıştır. Squash merge SHA `da0b5eb5de1bf9798bd3f4668af9354dcbdfd8a9` tarihsel cutover referansıdır; ileride normal geliştirmelerle `main` SHA'nın değişmesi beklenir.

### CAD ownership — güncel production

CAD'nin primary sahibi:

- `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx`

Hem `DocumentStudioShell` hem `FilePreviewShell` CAD dosyalarını orchestrator'a yönlendirir.

DWG sırası:

```text
Fast cached DXF
→ direct upstream MLightCAD/LibreDWG
→ legacy browser DWG→DXF + current DXF viewer
→ APS-only final fallback
```

DXF sırası:

```text
direct upstream MLightCAD
→ current/legacy DXF viewer fallback
```

DWF ayrı `preview/dwf-local-viewer.tsx` yolundadır.

Önemli dosyalar:

- `preview/cad-runtime-orchestrator.tsx`
- `preview/cad-upstream-viewer.tsx`
- `preview/cad-distance-overlay.tsx` — Mesafe ölçümü SVG overlay ve dinamik rozet
- `preview/cad-area-overlay.tsx` — Çokgen alan ölçümü SVG overlay, kılavuz ve 'Bitir' butonu
- `preview/cad-layer-panel.tsx` — Mobil alt sheet, safe area, focus trap & restore, 44x44 touch target
- `preview/cad-view-settings-panel.tsx` — Renk modu, lineweight ve 3 arka plan rengi
- `src/lib/dokumantasyon/cad-upstream/adapter.ts` — Upstream adapter köprüsü
- `src/lib/dokumantasyon/cad-upstream/distance-measurement.ts` — Mesafe ölçüm state machine & controller
- `src/lib/dokumantasyon/cad-upstream/area-measurement.ts` — Gauss alan, çevre, centroid & controller
- `preview/cad-viewer.tsx` — primary değil, halen kullanılan fallback/cached-DXF viewer
- `preview/dwg-legacy-conversion-fallback.tsx`
- `preview/dwg-dxf-conversion-worker.ts`
- `preview/dxf-viewer-worker.ts`
- `preview/aps-only-dwg-viewer.tsx`

Eski `aps-dwg-viewer.tsx` migration sırasında kaldırılmıştır.

Ayrıntılı güncel mimari: `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`.

## CAD upstream snapshot

30 Ağustos 2026 production snapshot'ında doğrudan paketler:

- `@mlightcad/cad-simple-viewer` `1.6.2`
- `@mlightcad/data-model` `1.14.2`
- `@mlightcad/libredwg-converter` `3.14.2`

Worker/WASM asset senkronizasyonu `scripts/sync-cad-upstream-assets.mjs` üzerinden `/public/cad-upstream/` altına yapılır. Lisans/kaynak izi `THIRD_PARTY_NOTICES.md` içinde tutulur.

Bu sürümler ve fallback sırası gelecekte değiştirilebilir; bunlar mevcut sistemin fotoğrafıdır.

## Test / doğrulama

Dokümantasyon için ilgili test alanları:

- `scripts/check-dokumantasyon-*.mjs`
- `scripts/check-dokumantasyon-*.ts`
- `tests/document-studio/`
- `tests/document-studio/release.spec.ts`
- `tests/document-studio/cad-dxf.spec.ts`

CAD için ayrıca:

- `scripts/check-cad-upstream-stage*.mjs`
- `.github/workflows/cad-runtime-production.yml`
- CAD Stage 5/6/7/8 workflow'ları
- DXF fidelity ve gerçek fixture acceptance workflow'ları

PR `#22` final head'i `9f386132eeff18e3264e3bef6a85dc7fdbb47ef7` üzerinde Stage 4/5/6/7/8, `vercel-preflight`, `dxf-fidelity-release`, `cad-runtime-production` ve gerçek DWG/DXF/DWF fixture acceptance kapılarının tamamı PASS olmuştur. Full-height regresyon testi CAD host'un Document Studio içerik alanının en az %98 genişlik ve yüksekliğini doldurmasını ve üç görüntü kontrolünün canvas yerine üst barda görünmesini doğrular.

Stage 8 migration kabul ayrıntıları ve tarihsel run/artifact kimlikleri `docs/cad-upstream-migration-stage8.md` içindedir.

## Yeni AI oturumu için okuma sırası

Dokümantasyon/CAD değişikliği yapılacaksa kısa sıra:

1. `PROJECT.md`
2. `DOK_CONTEXT_MAP.md`
3. `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`
4. görevle ilgili kaynak dosyalar
5. gerekiyorsa tarihsel Stage/runbook/storage belgeleri

Markdown ile kaynak kod çelişirse güncel kaynak kod ve testler doğrulanmalı; ardından bağlam dosyası güncellenmelidir.
