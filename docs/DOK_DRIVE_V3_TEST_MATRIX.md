# DÖKÜMANTASYON DRIVE V3.1 — TEST MATRİSİ VE DOĞRULAMA PAKETİ

Bu belge, Drive V3.1 dosya yöneticisi uygulamasının tüm otomatik ve statik testlerini, aşama kapsama oranlarını ve kalite kapılarını belgeler.

## 1. Otomatik Test Paketleri

| Test Komutu | Kapsam | Aşama | Durum |
|---|---|---|---|
| `scripts/check-dok-drive-v3-stage1-poc.ts` | Spike, TanStack 5K, PDD, Marquee Geometrisi | AŞAMA 1 | ✓ PASS (6/6) |
| `scripts/check-dok-drive-v3-stage2-server-state.ts` | Server-State, Sıfır-F5, deriveExplorerView, AbortSignal | AŞAMA 2 | ✓ PASS (7/7) |
| `scripts/check-dok-drive-v3-stage3-selection.ts` | Selection Reducer, Shift Range, Sağ Tık Koruma | AŞAMA 3 | ✓ PASS (9/9) |
| `scripts/check-dok-drive-v3-command-contract.ts` | 23 Komut Kayıt Defteri & 0 Ölü Kontrol | AŞAMA 4 | ✓ PASS (23/23) |
| `scripts/check-dok-drive-v3-stage5-overlay.ts` | `#dok-overlay-root`, Z-Index, 9 Modal OverlayPortal | AŞAMA 5 | ✓ PASS (14/14) |
| `scripts/check-dok-drive-v3-stage6-bulk-dnd.ts` | 100 Bulk Trash/Move, 97/3 Partial, Concurrency 3 | AŞAMA 6 | ✓ PASS (8/8) |
| `scripts/check-dok-drive-v3-stage7-virtualization.ts` | 5K DOM Budget, Anchor-Preserving Resize, Scroll Restore | AŞAMA 7 | ✓ PASS (12/12) |
| `scripts/check-dok-drive-v3-stage8-visuals.ts` | CSS GPU Transitions, Selection Glow, Reduced Motion | AŞAMA 8 | ✓ PASS (8/8) |
| `scripts/check-dok-drive-v3-stage9-mobile.ts` | 500ms Long-Press, Callout Suppression, Viewport Matrisi | AŞAMA 9 | ✓ PASS (7/7) |
| `npm run check:dok-drive-v3` | **Tüm Drive V3.1 Aşama Testlerinin Birleşik Çalıştırılması** | AŞAMA 1-9 | ✓ PASS |

## 2. Dökümantasyon Modülü Regresyon Testleri

- `npm run check:dokumantasyon` (14/14 PASS):
  - Robots.txt & Sitemap güvenliği
  - Bcrypt, Jose JWT admin oturumu
  - Raw Token & SHA-256 Lookup Hash
  - AES-256-GCM simetrik şifreleme/çözme
  - Döngüsel klasör taşıma engeli
  - Çakışma önleyici benzersiz isim türetme
  - JSZip hiyerarşili arşivleme
  - CSRF Same-Origin kontrolü
- `npm run check:dokumantasyon-ui:all` (39/39 PASS):
  - Faz 1: Rota ve eylem envanteri, istemci dairesel filtre
  - Faz 2: Warm Glass tokenları, ambient zemin ve z-index
  - Faz 3: Sidebar, breadcrumbs, command bar, empty states
  - Faz 4: Tüm modallar ve upload toast
  - Faz 5: Document studio, viewer araç çubukları
  - Faz 6: Adversarial QA, sıfır ölü kontrol, XSS denetimi

## 3. Mimari ve CAD Koruma Kapısı

- **CAD Motoru Koruma:** `git diff src/components/dokumantasyon/preview/ src/lib/dokumantasyon/cad-upstream/ ...` sonucu kesin olarak **0 diff**'tir.
- **TypeScript Kontrolü:** `npx tsc --project tsconfig.next.json --noEmit` sıfır hata (`0 errors`).
- **Build Bütünlüğü:** `npm run build` hatasız derlenir.
