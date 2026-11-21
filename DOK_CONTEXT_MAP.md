# Dokümantasyon bağlam haritası

Son güncelleme: 21 Kasım 2026 (Dokümantasyon UX V5 modüler mimari, güç-UX özellikleri ve 8 görsel kanıt paketi)

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
- **Body-Level Overlay:** `OverlayPortal` artık Radix Dialog Portal kullanır; odak kapanı, modal semantiği ve scroll kilidi Radix'e aittir. `#dok-overlay-root` diğer overlay tüketicileri için korunur.
- **Toplu İşlemler & PDD:** `/api/dokumantasyon/bulk/*` (`trash`, `move`, `star`, `restore`, `copy`), tek request 100 item, max chunk 250, partial failure toleransı, Atlassian Pragmatic Drag & Drop auto-scroll (`pdd-integration.ts`, `bulk-operations.ts`).
- **UX V4 Canlı Arayüz & Komut/Pano Altyapısı (21 Kasım 2026):** `command-registry.ts` 27 komutu (`copy`, `cut`, `paste`, `open-cad-v2` dahil) yönetir. Masaüstü tekil/çoklu/boş alan sağ tık menüsü (`context-menu.tsx`), `POST /api/dokumantasyon/bulk/copy` destekli kopyala/kes/yapıştır pano çubuğu (`clipboard-bar.tsx`), `?` kısayol rehberi (`shortcuts-modal.tsx`), katlanabilir grup başlıkları/seçimi ve tek sticky başlık, filtre çip çubuğu (`filter-chips-bar.tsx`), durum çubuğu (`workspace-status-bar.tsx`), iskelet yükleyici (`explorer-skeleton.tsx`), 0-seçim/çoklu-seçim detay çekmecesi (`drive-details-drawer.tsx`) + etkinlik sekmesi, gerçek kenar çubuğu toplamları (`drive-sidebar.tsx`), Türkçe `İ/ı/I/i` arama/sıralama normalizasyonu ve `scope: "all"` / `order` / `sortBy: "type"` / `updated_at || created_at` birliği aktiftir.
- **UX V5 Modüler Mimari & Güç-Kullanıcı Katmanı (21 Kasım 2026):** `file-manager.tsx` 7 yeni `drive-v3/` modülüne ayrıştırılmıştır: `drive-checkbox.tsx` (3-durumlu checkbox), `selection-dock.tsx` (yüzen kapsül + `Tersine Çevir`), `explorer-toolbar.tsx` (3 bölgeli araç çubuğu, `←/→` geçmiş, `…` dropdown, birleşik `dok-inline-filter` + `⌘K`), `explorer-row-card.tsx` (saf CSS `56px`/`44px` liste + `260px` grid, lazy `<img>` thumbnail, `F2` uzantı-korumalı satır içi adlandırma), `quick-look-modal.tsx` (`Space` hızlı önizleme + `←/→` galeri + görsel zoom/döndürme; CAD dosyalarında altın motora 0 dokunuş), `command-palette.tsx` (`Ctrl+K` global arama + hızlı komutlar), `use-undo-toast.ts` (`Ctrl+Z` + Undo Toast). Ayrıca `file-categories.ts` & `drive-sidebar.tsx` içine `document` (`Belgeler & Tablolar`) kategorisi, katlanabilir Hızlı Klasör Ağacı (`dok-sidebar-folder-tree`) + Yıldızlı/Çöp DnD hedefleri, `dok_workspace_prefs_v5` `localStorage` kalıcılığı, `?folderId=` deep-link ve `Ctrl+V` sistem panosu ekran görüntüsü yükleme eklenmiştir.
- **Ortak Kategori & Boyut Sözleşmesi:** `src/lib/dokumantasyon/file-categories.ts` `.dwf` ve `document` (`.md`, `.txt`, `.docx`, `.xlsx`, `.csv`, `.json` vb.) dahil dosya kategorilerini ve `5–100 MB` / `>= 100 MB` boyut eşiklerini istemci ve backend için tek kaynak olarak tanımlar.
- **UX V4 & V5 Test Paketleri:** `tests/dok-drive-v3/ux-v4-*.spec.ts` (S1–S8), `tests/dok-drive-v3/ux-v5-*.spec.ts` (4 paket: `selection-visuals`, `toolbar-sidebar-tree`, `power-ux-quicklook-palette`, `undo-inline-rename-url` + 8 görsel kanıt karesi) ve `tests/dok-drive-v3/explorer-derive.unit.test.ts`.
- **Transfer Kuyruğu:** `app/dokumantasyon/layout.tsx` içindeki `DokWorkspaceSessionProvider`, gerçek yükleyiciyi `UploadQueueManager(3)` ile çalıştırır. Dosya yöneticisi/görüntüleyici geçişlerinde sürer; yenileme veya sekme kapanmasında kaldığı yerden devam garantisi yoktur. Başarı metadata doğrulamasından sonra gösterilir. Telefon görünümünde akış içi özet ve detay paneli kullanılır.
- **Sanallaştırma & Ölçek:** `@tanstack/react-virtual` 5.000+ item desteği, mounted DOM < 250 node, anchor-preserving resize (`use-virtual-explorer.ts`, `virtual-scroll.ts`).
- **Görsel & Mobil:** Sürekli `will-change` katmanları kullanılmaz. Merkezi explorer-activation policy, mouse-only double-click/contextmenu, callout suppression, `touch-action: pan-y`, `100dvh`, `viewportFit: cover` korunur.
- **Telefon sunumu:** `<640px` veya coarse pointer + `<1024px` + `<=500px` yükseklikte tek uygulama başlığı vardır. Liste varsayılandır; iki sütunlu kart, sıralama, gruplama ve filtreler Diğer → Görünüm ve düzen panelindedir. Seçim Diğer → Öğeleri seç ile başlar. `mobile-explorer.tsx` liste/kart/grupları ölçerek sanallaştırır. Panel, seçim ve arama durumları `use-workspace-history.ts` ile tarayıcı geçmişine bağlanır. Snapshot'lar oturum belleğindedir; URL/history state içine dosya içerikleri yazılmaz.
- **Mobil sertleştirme (10 Eylül 2026, yerel çalışma):** Dosya adı ve satır/kart aynı seçim sözleşmesini kullanır. Normal mobil görünümde checkbox/Tümünü Seç kapalıdır. Breakpoint değişimi seçimi temizler. Dock DOM sırasında viewport sonrasındadır; sabit site alt menüsü dokümantasyon rotalarında görünmez. Navbar yüksekliği ResizeObserver ile ölçülür; kısa yatay ekranda modül başlığı yalnız erişilebilir metin olarak kalır. Ayrıntı: `docs/DOK_MOBILE_HARDENING_2026-09-10.md`.
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
- `file-categories.ts`
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

Görsel önizleme `preview/image-viewer.tsx` içinde tek bir kamera (`scale`, `offsetX`, `offsetY`) kullanır; saf zoom/pan geometrisi `preview/image-viewer-geometry.ts` içindedir. Kamera ölçeği görüntünün doğal ölçüsüne göredir, toolbar yüzdesi ise fit seviyesini `%100` kabul eder. Fare tekerleği ve trackpad zoom'u imleç noktasına sabitler; mobil pinch iki pointer'ın midpoint'ini korur. Zoom sınırları fit ölçeğinin 1–8 katıdır (mutlak üst sınır 5); etkileşim hareketleri `requestAnimationFrame` ile kare başına bir kamera güncellemesine birleştirilir. Mobil ve tablet toolbar hedefleri en az 44 px'tir.

PDF Document Studio `studio/pdf/pdfjs-studio.tsx` içinde doğrudan PDF.js sayfa çizimi ve görünür sayfa penceresi kullanır; `react-pdf` katmanı değildir. Zoom ölçeği PDF.js'in 72 DPI ölçeğidir, toolbar yüzdesi CSS 96 DPI ile eşlenir (`%100` = `96/72`); böylece gerçek boyut tutarlı kalır. Sayfaya sığdırma etkin sayfanın ölçüsünü, dönüşünü, görünüm alanını ve mobil toolbar örtüsünü hesaba katar. Toolbar zoom'u, Ctrl/Cmd+tekerlek, trackpad pinch ve mobil iki parmak pinch sayfa-içi çıpayı korur; ardışık animasyonlu zoom istekleri son hedefi ve fit/gerçek-boyut modunu kaybetmeden sıraya alınır. `fit-width`, `fit-page`, `actual-size` ve özel zoom modu okuma konumuyla birlikte saklanır. Saf zoom/çıpa hesabı `src/lib/dokumantasyon/studio/pdf/pdf-zoom-math.ts` ve `use-zoom-gestures.ts` içindedir. Varsayılan v4 motoru (`src/lib/dokumantasyon/studio/pdf/engine/`) `setPageKeys` + `Governor` görünür tile koruması, sekme dönüşü `refresh` kurtarması, scroll-tabanlı tile seçimi, motoru yeniden yaratmadan döndürme (`setRotation`), dinamik DPR takibi (`useDpr`), sayfa bazlı `getPageSize` ile `fit-width`/`fit-page` uyumu ve mobil jest ayrımı (`data-chrome-hidden`, jest sırasında 400 ms kalkan, jest sonrası 250 ms programatik kaydırma koruması, pinch lastik bant) içerir. Hızlı doğrulamalar `npm run check:pdf-v4:unit`, `npm run check:pdf-v3:unit`, `npm run check:pdf-v2:unit` ve `npx tsc -p tsconfig.next.json --noEmit --incremental false`; tarayıcı kabul kontrolleri `tests/pdf-v4/v5*`, `npm run check:pdf-v4:gate`, `npm run check:pdf-v3:invariants` ve `npm run check:pdf-v3:real-docs` komutlarıdır.

Document Studio bir full-viewport shell'dir. CAD upstream host'u üst barın altında kalan içerik alanının **tam genişlik ve tam yüksekliğini** kullanır; sabit `vh` minimumlarıyla yarım ekran oluşturulmamalıdır. `Gerçek Renk`, `Siyah-Beyaz` ve `Lineweight` kontrolleri Document Studio üst barındaki `cad-studio-toolbar-slot` içine portal edilir ve çizim canvas'ını kapatmaz. Topbar olmayan CAD yüzeylerinde küçük floating fallback kontrolü kullanılabilir. Bu mevcut UX sözleşmesi ileride değiştirilebilir; değişirse bu bölüm de aynı görevde güncellenir.

Bu full-viewport/topbar düzeni PR `#22` ile kabul testlerinden geçirilerek `main`e alınmıştır. Squash merge SHA `da0b5eb5de1bf9798bd3f4668af9354dcbdfd8a9` tarihsel cutover referansıdır; ileride normal geliştirmelerle `main` SHA'nın değişmesi beklenir.

### V1 araç/ölçüm zorunlu çalışma standardı

V1 DWG/DXF review, OSNAP, ölçüm, pointer, toolbar, katman, undo ve export işlerinde `.agents/rules/cad-dxf-engine-koruma.md` ve **`.agents/rules/cad-v1-review-kurallari.md`** bağlayıcıdır. `docs/cad-review-tools.md` ile `docs/cad-review-architecture-decisions.md` ürün/ADR olup gerçek test kanıtı yerine geçmez. V1 source değişmez; ayrı V2 server engine/cutover otomatik etkilenmez.

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

### Ayrı CAD V2 sunucu derleyicisi (aday çalışma; production primary değildir)

- `src/lib/cad-v2/` ve `/api/dokumantasyon/cad-v2/*` bu ayrı planın sunucu taraflı compile/sahne teslim zinciridir.
- `PLAN/DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md` kapsamındaki kabul tamamlanana ve ayrıca cutover kararı verilene kadar mevcut upstream CAD zinciri ve V1 fallback korunur; V2 adayı production hazır sayılmaz.
- L00–L14 ilerlemesi ve açık kabuller ana çalışma alanındaki `DWG_PLAN_DURUMU.md` içinde planın tam yolu ile izlenir.
- Candidate worktree'deki L03 uygulaması `src/lib/cad-v2/db/` altındaki migration/repository ile durable job/session ve DB READY pointer'ı sağlar. PGlite yerel testleri Neon/Private Blob veya canlı public route kabulü yerine geçmez; production primary ya da cutover durumu değildir.

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
- `tests/dok-drive-v3/explorer-derive.unit.test.ts`
- `tests/dok-drive-v3/ux-v4-*.spec.ts`
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
