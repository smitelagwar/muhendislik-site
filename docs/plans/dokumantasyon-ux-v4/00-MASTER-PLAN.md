# Dokümantasyon Modülü UX V4 — Master Uygulama Planı

> **Hedef Uygulayıcı:** Alt ajanlı ve token tasarruflu sistem — **koordinator, tüm coder'lar, testçiler ve denetçi (`critic`) dahil TÜM ajanlar `Gemini 4 Hydrogen (Medium)`** (ayrıntı: `06-ALT-AJAN-ORKESTRASYON.md`)  
> **Kapsam:** `/dokumantasyon` çalışma alanı (Desktop + Tablet + Mobil), tüm butonlar/komutlar, filtre/gruplama/sıralama/kapsam motoru, sağ tık bağlam menüsü, pano (Kes/Kopyala/Yapıştır), sürükle-bırak, modallar, canlı mikro-etkileşimler/animasyonlar ve çoklu senaryo otomatik test paketi.  
> **Revizyon:** 2026-11-21 (F0 tamamlandı; F1–F7 için 5 çakışmasız paralel dalga ve token tasarruflu alt ajan orkestrasyonuna güncellendi)

---

## 1. Belge Haritası (Zorunlu Okuma Sırası)

Uygulamaya başlamadan önce aşağıdaki belgeler sırasıyla okunmalıdır:

1. `PROJECT.md`, `AGENTS.md`, `GEMINI.md` ve `.agents/rules/dokumantasyon-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`
2. **[00-MASTER-PLAN.md](./00-MASTER-PLAN.md)** — Faz yol haritası, mimari sınırlar, kırmızı çizgiler
3. **[06-ALT-AJAN-ORKESTRASYON.md](./06-ALT-AJAN-ORKESTRASYON.md)** — **ZORUNLU:** Tüm ajanlar `Gemini 4 Hydrogen (Medium)` olacak şekilde 5 çakışmasız dalga, token tasarrufu ve denetçi (`critic`) protokolü
4. **[01-BUG-VE-TUS-DENETIMI.md](./01-BUG-VE-TUS-DENETIMI.md)** — Mevcut kaynak kodda doğrulanan 22 gerçek hata, ölü kontrol ve tutarsızlık defteri
5. **[02-FILTRE-GRUPLAMA-KOMUT-MIMARISI.md](./02-FILTRE-GRUPLAMA-KOMUT-MIMARISI.md)** — Sunucu + istemci tek kaynak filtre/gruplama/sıralama sözleşmesi, 27 komut, gerçek sağ tık menüsü, gerçek Kopyala/Yapıştır, modallar ve detay/etkinlik çekmecesi
6. **[03-CANLI-ARAYUZ-VE-ANIMASYON-SPECI.md](./03-CANLI-ARAYUZ-VE-ANIMASYON-SPECI.md)** — Donuk arayüzü canlı, tepkisel ve akıcı hale getiren etkileşim, mikro-animasyon, iskelet yükleyici, hover hızlı eylemler ve görsel hiyerarşi tasarımı
7. **[04-COKLU-SENARYO-TEST-MATRISI.md](./04-COKLU-SENARYO-TEST-MATRISI.md)** — 8 ana senaryo paketi, 60+ uçtan uca test vakası, responsive/tema/a11y/edge-case matrisi ve kesin kabul kapıları
8. **[05-UYGULAMA-DURUMU.md](./05-UYGULAMA-DURUMU.md)** — Her dalga sonunda güncellenecek canlı durum ve kanıt defteri (F0 tamamlandı)

---

## 2. Kırmızı Çizgiler ve Koruma Kuralları (İHLAL YASAK)

### 2.1 CAD/DXF Altın Motor Koruması (`IGNORE2`)
Aşağıdaki dosyalara **ASLA DOKUNULMAZ** (görev kapsamı tamamen dosya yöneticisi ve dokümantasyon çalışma alanıdır):
- `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx`
- `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`
- `src/components/dokumantasyon/preview/cad-viewer.tsx`
- `src/components/dokumantasyon/preview/dxf-viewer-worker.ts`
- `src/lib/dokumantasyon/cad-upstream/**`
- `src/lib/dokumantasyon/cad-runtime/**`
- `src/lib/dokumantasyon/dxf-*`
- `src/lib/dokumantasyon/dwg/runtime-policy.ts`
- `scripts/sync-cad-upstream-assets.mjs`

### 2.2 Mevcut Drive V3.1 ve Mobil Sözleşme Koruması
- `npm run check:dok-drive-v3:static` ve `tests/dok-drive-v3/*.spec.ts` içindeki tüm mevcut testler yeşil kalmak zorundadır.
- **Sanal Liste/Kart Framer Motion Yasağı:** `scripts/check-dok-drive-v3-stage8-visuals.ts` gereği `.virtualRow` ve `.virtualCard` öğelerinde `framer-motion` kullanılmaz; sanal satır ve kartlar **yalnızca saf CSS GPU geçişleri** kullanır ve `will-change: transform, opacity;` yazılmaz.
- `framer-motion` (pakette `12.34.3` hazır kurulu) **yalnızca** sanal olmayan kabuk/chrome bileşenlerinde kullanılır: kenar çubuğu aktif göstergesi, görünüm seçici pill, detay çekmecesi, sağ tık menüsü, filtre çipleri, seçim dock'u, pano çubuğu, modallar, boş durumlar ve küçük mikro-tepkiler (`<MotionConfig reducedMotion="user">` altında).
- **Mobil Açık Seçim Modu Sözleşmesi (`DOK_DRIVE_V3_INTERACTION_CONTRACT.md`):** Mobilde (`<=1023px`) gizli long-press veya touch contextmenu ile seçim başlatılmaz; seçim yalnızca açık `Seç` düğmesiyle başlar. Minimum 44×44 CSS px dokunma hedefi korunur.
- **Tema Eşliği:** Dark Industrial + Light tema eşliği zorunludur. Tek taraflı sabit dark veya light renk kodu yazılamaz.
- **Türkçe Arayüz ve Kod Standardı:** Tüm UI metinleri doğal Türkçe (`latin-ext`), TypeScript `strict` (`any` yasak), `console.log` yasak, yeni npm paketi **eklenmeden** mevcut kurulu paketler (`framer-motion`, `lucide-react`, `radix-ui`, `@tanstack/react-query`, `@tanstack/react-virtual`, `@atlaskit/pragmatic-drag-and-drop`) kullanılır.
- **Git / Deploy Kuralı:** Kullanıcı açıkça istemeden `git push` veya Vercel deploy yapılmaz. Tüm doğrulamalar yerel makinede tamamlanır.
- **Takılma Önleme:** Windows PowerShell'de çıplak `curl` yasaktır; Playwright testlerinde `waitUntil: "networkidle"` kullanılmaz (`domcontentloaded` + açık `data-testid` beklemesi + max 8 sn aksiyon timeout).

---

## 3. Faz Yol Haritası (8 Kontrollü Faz: F0 → F7)

Her faz kendi içinde atomik, derlenebilir ve test edilebilir olmalıdır. Bir fazın doğrulaması geçmeden sonraki faza geçilmez.

| Faz | Adı | Temel Çıktılar | Zorunlu Faz Kapısı |
|---|---|---|---|
| **F0** | **Temel Çizgi & Güvenli Başlangıç** | Mevcut testlerin taban ölçümü (`tsc`, `check:dok-drive-v3:static`, mevcut Playwright duman koşusu), dokunulmayacak koruma listesinin teyidi | Taban rapor `05-UYGULAMA-DURUMU.md` içine yazılır |
| **F1** | **Filtre, Sıralama, Gruplama & Kapsam Tek Kaynak Motoru** | Sunucu (`items/route.ts`) + `query-client.ts` + `explorer-derive.ts` tam paritesi: `scope="all"` bağlantısı, `sortOrder→order` düzeltmesi, `sortBy="type"` backend desteği, `type="other"` & `.dwf` uyumu, `size` eşiği (5–100 MB / >100 MB) birliği, `updated_at \|\| created_at` tarih birliği, Türkçe `toLocaleLowerCase("tr")` arama, sidebar/filter-sheet/breadcrumb çift yönlü senkronu, gerçek workspace `summary` istatistikleri | `npx tsc --noEmit` + yeni birim/entegrasyon filtre-grup-sıra testleri PASS |
| **F2** | **Tüm Komutlar, Sağ Tık Menüsü, Kopyala/Yapıştır & Pano** | 27 komutun tamamının `CommandRegistry`'ye gerçek kayıtları, gerçek masaüstü Sağ Tık Bağlam Menüsü (tekil öğe, çoklu seçim, boş alan), `POST /api/dokumantasyon/bulk/copy` gerçek kopyalama API'si (local + Neon/Blob), görünür Pano Çubuğu (Kes/Kopyala + kesilen öğe soluklaştırma), tüm klavye kısayolları + `?` kısayol rehberi, `executeBulkStar` entegrasyonu, klasör paylaşım izni düzeltmesi | `npm run check:dok-drive-v3:static` + `command-contract` + gerçek UI context-menu & clipboard E2E testleri PASS |
| **F3** | **Gruplu Görünüm, Seçim Dock'u, Breadcrumb DnD & Detay/Etkinlik Çekmecesi** | Açılır-kapanır (collapsible) ve grup-bazlı seçim destekli Gruplu Liste & Grid görünümü (tek birleşik grid akışı, sanal uyumlu marquee/seçim), Breadcrumb üzerine sürükle-bırak ile üst klasöre taşıma, Detay Çekmecesi'nin 0-seçim (Klasör Özeti + Etkinlik Akışı `/api/dokumantasyon/activity`) ve çoklu-seçim (Toplu Özet) durumları, `admin-shell` çıkış yap düğmesi, Selection Dock çoklu İndir/Yıldızla/Kopyala/Kes aksiyonları | Typecheck + Gruplu görünüm, Detay/Etkinlik ve DnD E2E testleri PASS |
| **F4** | **Modallar, Arama, Çöp Kutusu, Paylaşım & Yükleme Kuyruğu Sertleştirme** | Çift `×` kapatma düğmesi hatasının giderilmesi, `WorkspaceFilterSheet`'in `OverlayPortal`'a taşınması, `window.confirm()`'lerin tamamen kaldırılıp erişilebilir içi onay UI'ına çevrilmesi, `NewFolderModal` pending `tempId` takas hatasının giderilmesi, `CreateShareModal`/`NewFolderModal` form sıfırlama, `MoveModal` hiyerarşik ağaç + arama, `SearchModal` AbortController + klavye ok navigasyonu + "Önizle" / "Klasöre Git" ikili aksiyon + tür çipleri, `TrashModal` gerçek dosya ikonları + toplu geri yükle/sil, `ActiveSharesModal` durum sekmeleri + QR Escape düzeltmesi, `UploadProgressToast` öğe bazlı İptal ve Tümünü Tekrar Dene | Modallar + Yükleme Kuyruğu + Çöp Kutusu + Paylaşım E2E testleri PASS |
| **F5** | **Canlı Arayüz, Mikro-Etkileşimler, İskeletler & Animasyon Sistemi** | `<MotionConfig reducedMotion="user">` sarmalayıcısı, canlı satır hover hızlı eylem barı (Önizle/İndir/Paylaş/Adlandır/Yıldızla), satır/kart üstü aktif sıralama okları, tek tek kapatılabilir animasyonlu filtre çipleri + hızlı satır içi arama filtresi, iskelet (skeleton) yükleyici, `layoutId` kenar çubuğu & görünüm geçişi, yıldız spring patlaması, kesintisiz araç çubuğu akışı (40px görünmez boşluğun giderilmesi), Toast bildirimleri (`useToast`) her mutasyonda, canlı durum çubuğu (status bar), sürükle-bırak rozet & ambiyans ışık hareketi | `check:dok-drive-v3:static` + Light/Dark görsel kontrol + Reduced-motion testi PASS |
| **F6** | **Çoklu Senaryo Kapsamlı Test Paketi & Edge-Case Avı** | `04-COKLU-SENARYO-TEST-MATRISI.md` içindeki 8 senaryo paketinin tamamının Playwright & birim testleriyle yazılıp koşulması (320/390/768/1024/1366/1920 px, Light/Dark, Türkçe karakterler, hata/offline/kısmi başarısızlık, 5000 öğe performans/DOM bütçesi, klavye+a11y) | Tüm yeni + mevcut `dok-drive-v3` testleri 0 fail, 0 console/page error |
| **F7** | **Final Kalite Kapısı, Living Docs Güncelleme & Teslim** | `npx tsc -p tsconfig.next.json --noEmit`, `npx tsc --noEmit`, `npm run lint` (değişen dosyalar), `npm run build`, `npm run check:dok-drive-v3`, `npm run check:simplification-stage6` doğrulaması; `PROJECT.md`, `DOK_CONTEXT_MAP.md`, `docs/DOK_DRIVE_V3_COMMAND_MATRIX.md` ve `05-UYGULAMA-DURUMU.md` güncellemesi | Tüm release kapıları %100 YEŞİL |

---

## 4. Dosya Etki Haritası (Planlanan Değişiklikler)

### Değiştirilecek Mevcut Dosyalar
- `src/app/api/dokumantasyon/items/route.ts` — `scope`, `order`, `sortBy="type"`, `.dwf`, `updated_at`, tam `summary` & `categoryCounts`
- `src/components/dokumantasyon/admin-shell.tsx` — canlı ambiyans katmanı (reduced-motion uyumlu), kullanıcı menüsü + Çıkış Yap (`/api/dokumantasyon/cikis`)
- `src/components/dokumantasyon/drive-sidebar.tsx` — gerçek toplamlar, kategori/çöp/paylaşım sayaç rozetleri, `layoutId` aktif geçiş göstergesi, canlı depolama barı
- `src/components/dokumantasyon/file-manager.tsx` — orkestrasyon, modüler alt bileşenlere ayırma (dosya 2857 satırdan daha temiz yönetilebilir parçalara bölünebilir), tam komut kayıtları, klavye kısayolları, toast bildirimleri, satır içi hızlı arama, hover hızlı eylemler, durum çubuğu
- `src/components/dokumantasyon/workspace-filter-sheet.tsx` — `OverlayPortal` entegrasyonu, birebir eşleşen eşikler, canlı sonuç önizleme sayısı
- `src/components/dokumantasyon/drive-details-drawer.tsx` — 0-seçim Klasör Özeti, çoklu-seçim Toplu Özet, Etkinlik Akışı sekmesi, animasyonlu geçiş
- `src/components/dokumantasyon/mobile-workspace-controls.tsx` — mobil filtre/sıralama/gruplama tam senkronu
- `src/components/dokumantasyon/mobile-explorer.tsx` — gruplu görünüm uyumu ve mikro-geri bildirim
- `src/components/dokumantasyon/upload-progress-toast.tsx` — öğe bazlı İptal, Tüm Hatalıları Tekrar Dene, canlı ilerleme animasyonu
- `src/components/dokumantasyon/dok-workspace.module.css` — GPU mikro-geçişler, skeleton shimmer, hover eylem görünürlüğü, ambiyans nefes animasyonu, drag ghost & breadcrumb drop stilleri (Stage 8 static assertion'ları koruyarak)
- `src/components/dokumantasyon/drive-v3/explorer-derive.ts` — `other` filtresi, `5–100 MB` / `>100 MB` uyumu, `updated_at || created_at`, Türkçe `toLocaleLowerCase("tr")`, hızlı filtreleme
- `src/components/dokumantasyon/drive-v3/query-client.ts` — `scope` anahtarı, `order` parametresi, genişletilmiş `summary` tipi
- `src/components/dokumantasyon/drive-v3/command-registry.ts` — klasör paylaşım izni, `bulk-copy` desteği, kısayol metadata tutarlılığı
- `src/components/dokumantasyon/drive-v3/overlay-portal.tsx` — tek kapatma düğmesi politikası (`hideDefaultClose` veya standart başlık) ve animasyonlu giriş
- `src/components/dokumantasyon/drive-v3/use-drive-selection.ts` — gruplu görünümde güvenli marquee / seçim davranışı
- `src/components/dokumantasyon/modals/*.tsx` — çift `×` temizliği, `window.confirm()` kaldırma, form sıfırlama, `MoveModal` ağaç/arama, `SearchModal` AbortController+klavye+ikili aksiyon, `TrashModal` ikon+toplu işlem, `ActiveSharesModal` filtre sekmeleri+QR Escape

### Yeni Eklenecek Odaklı Dosyalar
- `src/app/api/dokumantasyon/bulk/copy/route.ts` — Gerçek Kopyala/Yapıştır (dosya + klasör özyinelemeli kopyalama, local + Neon/Blob)
- `src/components/dokumantasyon/drive-v3/context-menu.tsx` — Masaüstü sağ tık bağlam menüsü (tekil, çoklu, boş alan, viewport taşma korumalı)
- `src/components/dokumantasyon/drive-v3/clipboard-bar.tsx` — Canlı Kes/Kopyala pano şeridi (Yapıştır / Temizle)
- `src/components/dokumantasyon/drive-v3/shortcuts-modal.tsx` — `?` ile açılan Türkçe klavye kısayolları rehberi
- `src/components/dokumantasyon/drive-v3/explorer-skeleton.tsx` — Liste & Grid moduna uyumlu shimmer iskelet yükleyici
- `src/components/dokumantasyon/drive-v3/workspace-status-bar.tsx` — Alt durum çubuğu (görünen/toplam öğe, seçili boyut, aktif sıralama/gruplama, kısayol ipucu `?`)
- `src/components/dokumantasyon/drive-v3/filter-chips-bar.tsx` — Tek tek kapatılabilir animasyonlu aktif filtre çipleri + hızlı temizleme
- `tests/dok-drive-v3/ux-v4-*.spec.ts` ve `tests/dok-drive-v3/explorer-derive.unit.test.ts` — Çoklu senaryo test paketi
