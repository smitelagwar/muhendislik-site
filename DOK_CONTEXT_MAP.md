# Dokümantasyon bağlam haritası

Son güncelleme: 24 Ağustos 2026

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
- `file-manager.tsx`
- `drive-sidebar.tsx`
- `drive-details-drawer.tsx`
- `studio/document-studio-shell.tsx`
- `preview/file-preview-shell.tsx`

Responsive workspace; geniş ekranda sidebar/details, dar ekranda drawer/sheet yaklaşımını kullanır. File Manager seçim durumu `use-dok-selection.ts` ile ayrılmıştır.

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

Upload intent/finalize akışı idempotent olacak şekilde tasarlanmıştır. Silme sırasında Blob/disk tarafı başarısızsa metadata kaybını önleyen korumalar vardır. Reconciliation için `scripts/reconcile-dokumantasyon-storage.mjs` bulunur.

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
- `preview/cad-viewer.tsx` — primary değil, halen kullanılan fallback/cached-DXF viewer
- `preview/dwg-legacy-conversion-fallback.tsx`
- `preview/dwg-dxf-conversion-worker.ts`
- `preview/dxf-viewer-worker.ts`
- `preview/aps-only-dwg-viewer.tsx`
- `src/lib/dokumantasyon/cad-upstream/adapter.ts`

Eski `aps-dwg-viewer.tsx` migration sırasında kaldırılmıştır.

Ayrıntılı güncel mimari: `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`.

## CAD upstream snapshot

24 Ağustos 2026 production snapshot'ında doğrudan paketler:

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

Stage 8 migration kabul ayrıntıları ve tarihsel run/artifact kimlikleri `docs/cad-upstream-migration-stage8.md` içindedir.

## Yeni AI oturumu için okuma sırası

Dokümantasyon/CAD değişikliği yapılacaksa kısa sıra:

1. `PROJECT.md`
2. `DOK_CONTEXT_MAP.md`
3. `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md`
4. görevle ilgili kaynak dosyalar
5. gerekiyorsa tarihsel Stage/runbook/storage belgeleri

Markdown ile kaynak kod çelişirse güncel kaynak kod ve testler doğrulanmalı; ardından bağlam dosyası güncellenmelidir.
