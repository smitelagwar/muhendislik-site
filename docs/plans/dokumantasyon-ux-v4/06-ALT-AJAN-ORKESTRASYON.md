# 06 — Alt Ajanlı ve Token Tasarruflu Orkestrasyon Protokolü (Tüm Ajanlar: Gemini 4 Hydrogen Medium)

> **Durum:** F0 tamamlanmıştır (`05-UYGULAMA-DURUMU.md`). Bu protokol **F1 → F7** fazlarını en düşük token/kota tüketimiyle, çakışmasız paralel iş paketleri ve bağımsız denetimle tamamlamak için hazırlanmıştır.  
> **Kesin Model Kuralı:** Ana koordinatör, tüm kodlayıcılar (`coder-*`), test yazıcılar ve denetçi (`critic`) dahil **TÜM AJANLAR `Gemini 4 Hydrogen (Medium)`** olarak çalışır. `High`, `XHigh` veya `Argon` kullanılmaz.

---

## 1. Rol ve Araç Sözleşmesi

| Rol | Model | Yetki | Görev Sınırı |
|---|---|---|---|
| **Koordinatör** *(Mevcut ana sohbet)* | `Gemini 4 Hydrogen (Medium)` | Orkestrasyon | **Kaynak kod yazmaz, uzun dosya/ham log okumaz.** Yalnız `05-UYGULAMA-DURUMU.md` ve `06-ALT-AJAN-ORKESTRASYON.md` ile dalga yönetir, kısa brifing gönderir, kapı özetini kullanıcıya raporlar. |
| **`coder-1` / `coder-2`** *(Uygulayıcı & Testçi)* | `Gemini 4 Hydrogen (Medium)` (`Model: "inherit"` / `model: "gemini-4-hydrogen-medium"`) | Okuma + Yazma + Komut | Yalnız kendine atanan **ayrık dosya kümesinde** çalışır. Kendi dalga doğrulamasını koşar ve max 12 satır özet rapor döner. |
| **`critic`** *(Bağımsız Denetçi)* | `Gemini 4 Hydrogen (Medium)` (`Model: "inherit"` / salt-okunur) | **Yalnız Salt-Okunur** | **Kod yazmaz.** Yalnız `git diff --stat`, değişen satırlar ve gerçek komut çıktılarını denetler. `ONAY` veya `RED (en fazla 5 somut düzeltme)` döner. |

> **Antigravity Araç Seçimi:**
> - Oturum zaten `Gemini 4 Hydrogen (Medium)` üzerinde çalıştığından:
>   - `define_subagent` + `invoke_subagent(..., Model: "inherit")` (veya `swarm` açıksa `model: "gemini-4-hydrogen-medium"`) kullanılır.
>   - `coder` tipi: `EnableWriteTools: true`.
>   - `critic` tipi: `EnableWriteTools: false` (salt-okunur, hızlı, ucuz).
> - Paralel çalışan `coder-1` ve `coder-2` **kesinlikle sıfır ortak dosya** (disjoint ownership) üzerinde çalışır; böylece aynı `inherit` çalışma dizininde bile 0 merge çatışması ve 0 ekstra worktree/clone maliyeti oluşur.

---

## 2. Token ve Kota Tasarrufu Kuralları (ZORUNLU)

1. **İnce Koordinatör:** Ana sohbet `file-manager.tsx`, `items/route.ts` veya uzun terminal çıktısı okumaz. Yalnız alt ajanların döndüğü 10–12 satırlık yapılandırılmış özetlerle karar verir.
2. **Hedefli Okuma (Zero Full-Dump):** Alt ajanlar yalnız atanan dosyaları okur; `file-manager.tsx` (2.857 satır) gibi büyük dosyalarda tümünü tekrar tekrar okumak yerine `StartLine`/`EndLine` ve arama (`Select-String`/`rg`) ile yalnız ilgili blokları okur.
3. **Kısa Brifing (≤ 15 Satır):** Her alt ajana verilen görev emri şu 4 satır şablonuna sığar:
   - `Paket / Dalga:`
   - `Sahiplik (Yalnız bu dosyalara dokun):`
   - `Plan referansı (yalnız ilgili bölüm):`
   - `Doğrulama komutu & çıktı formatı (max 12 satır):`
4. **Ucuz Kapı Önce, Ağır Build En Sonda:**
   - Dalga 1 ve Dalga 2'de `npm run build` ve tam Playwright paketi **KOŞULMAZ** — yalnız `npx tsc -p tsconfig.next.json --noEmit --incremental false`, hedefli `tsx --test` ve `npm run check:dok-drive-v3:static` koşulur.
   - `npm run build` ve tam `npm run check:dok-drive-v3` yalnızca Dalga 3 (duman) ve Dalga 5 (final) kapısında koşulur.
5. **Ping-Pong Freni (Max 2 Tur):** `coder` ↔ `critic` düzeltme turu dalga başına en fazla **2 tur** sürer. Aynı hata için 3. deneme yapılmaz; 2. tur sonunda küçük kozmetik itirazlar ertelenir, gerçek kırık varsa koordinatör kesin çözüm seçer.
6. **`@all` ve Gereksiz Tekrar Yasak:** Aynı anda en fazla 2 paralel `coder` açılır; her mesaj tek hedef ajana gider.
7. **Mevcut `tsc --noEmit` Gerçeği (F0 Kanıtı):** `docs/belgeler-paylasim-v3-uygulama/*` dosyalarındaki önceden var olan TS hataları kapsam dışıdır ve dokunulmaz. Kapı: `npx tsc -p tsconfig.next.json --noEmit --incremental false` → `exit 0` ve dokümantasyon yollarında `0` TS hatası.

---

## 3. Çakışmasız Dalga Planı (F1 → F7)

Her dalgada paralel çalışan alt ajanların dosya kümeleri **matematiksel olarak ayrıktır**.

### Dalga 1 — Çekirdek Motorlar & Bağımsız Bileşenler (F1 + F2 Altyapı) · *2 Paralel Coder + Critic*
- **`coder-1` (F1 — Filtre/Sıra/Grup/Kapsam Tek Kaynak):**
  - Dosyalar:
    - `src/lib/dokumantasyon/file-categories.ts` *(yeni)*
    - `src/app/api/dokumantasyon/items/route.ts`
    - `src/components/dokumantasyon/drive-v3/query-client.ts`
    - `src/components/dokumantasyon/drive-v3/explorer-derive.ts`
    - `tests/dok-drive-v3/explorer-derive.unit.test.ts` *(yeni)*
  - Kapsam: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-12 (API `summary` & `categoryCounts`), BUG-20.
  - Referans: `01-BUG-VE-TUS-DENETIMI.md` (BUG-01..05, 12, 20), `02-FILTRE-GRUPLAMA-KOMUT-MIMARISI.md` §1, `04-COKLU-SENARYO-TEST-MATRISI.md` §1.
  - Doğrulama: `npx tsx --test tests/dok-drive-v3/explorer-derive.unit.test.ts`
- **`coder-2` (F2 — Kopyala API, Komut Sözleşmesi & Yeni Saf UI Bileşenleri):**
  - Dosyalar:
    - `src/app/api/dokumantasyon/bulk/copy/route.ts` *(yeni)*
    - `src/components/dokumantasyon/drive-v3/bulk-operations.ts` (`executeBulkCopy`)
    - `src/components/dokumantasyon/drive-v3/command-registry.ts` (BUG-08 klasör paylaşım + copy uyumu)
    - `src/components/dokumantasyon/drive-v3/context-menu.tsx` *(yeni)*
    - `src/components/dokumantasyon/drive-v3/clipboard-bar.tsx` *(yeni)*
    - `src/components/dokumantasyon/drive-v3/shortcuts-modal.tsx` *(yeni)*
  - Kapsam: BUG-06, BUG-07, BUG-08, BUG-10 altyapısı.
  - Referans: `02-FILTRE-GRUPLAMA-KOMUT-MIMARISI.md` §2–§4, `03-CANLI-ARAYUZ-VE-ANIMASYON-SPECI.md` §2 (Katman 9).
- **Dalga 1 Kapısı (`critic`):** `npx tsc -p tsconfig.next.json --noEmit --incremental false` + `npx tsx --test tests/dok-drive-v3/explorer-derive.unit.test.ts` + `npm run check:dok-drive-v3:static` + diff denetimi.

---

### Dalga 2 — Modallar + Canlı Kabuk/Sidebar/Çekmece/CSS (F3/F4/F5 Bileşenleri) · *2 Paralel Coder + Critic*
- **`coder-1` (F4 — Modallar, Overlay & Yükleme Kuyruğu Sertleştirme):**
  - Dosyalar:
    - `src/components/dokumantasyon/drive-v3/overlay-portal.tsx`
    - `src/components/dokumantasyon/workspace-filter-sheet.tsx`
    - `src/components/dokumantasyon/upload-progress-toast.tsx`
    - `src/components/dokumantasyon/modals/new-folder-modal.tsx`
    - `src/components/dokumantasyon/modals/rename-modal.tsx`
    - `src/components/dokumantasyon/modals/move-modal.tsx`
    - `src/components/dokumantasyon/modals/search-modal.tsx`
    - `src/components/dokumantasyon/modals/trash-modal.tsx`
    - `src/components/dokumantasyon/modals/create-share-modal.tsx`
    - `src/components/dokumantasyon/modals/share-result-modal.tsx`
    - `src/components/dokumantasyon/modals/active-shares-modal.tsx`
  - Kapsam: BUG-09 (modal imzası), BUG-14, BUG-15 (tek `×`), BUG-16 (`window.confirm` kaldır, gerçek ikon, toplu geri yükle), BUG-17, BUG-18, BUG-19, BUG-22 (Upload İptal/Tekrar Dene).
  - Referans: `02-FILTRE-GRUPLAMA-KOMUT-MIMARISI.md` §6.
- **`coder-2` (F3 + F5 — Canlı Kabuk, Sidebar, Detay/Etkinlik Çekmecesi, Yeni Canlı Parçalar & CSS):**
  - Dosyalar:
    - `src/components/dokumantasyon/admin-shell.tsx` (canlı ambiyans + Çıkış Yap)
    - `src/components/dokumantasyon/drive-sidebar.tsx` (`layoutId` aktif pil + gerçek sayaçlar + depolama dağılım çubuğu)
    - `src/components/dokumantasyon/drive-details-drawer.tsx` (0-seçim Klasör Özeti, çoklu seçim, Etkinlik sekmesi)
    - `src/components/dokumantasyon/drive-v3/explorer-skeleton.tsx` *(yeni)*
    - `src/components/dokumantasyon/drive-v3/workspace-status-bar.tsx` *(yeni)*
    - `src/components/dokumantasyon/drive-v3/filter-chips-bar.tsx` *(yeni)*
    - `src/components/dokumantasyon/dok-workspace.module.css` (**Stage 8 kuralları kesin korunur:** `.virtualRow`/`.virtualCard` saf CSS, `will-change: transform, opacity;` YASAK!)
  - Kapsam: BUG-11, BUG-12 (UI), BUG-22 (çıkış + canlılık).
  - Referans: `02-FILTRE-GRUPLAMA-KOMUT-MIMARISI.md` §5, `03-CANLI-ARAYUZ-VE-ANIMASYON-SPECI.md` (Katman 1–2, 5–8, 12).
- **Dalga 2 Kapısı (`critic`):** `npx tsc -p tsconfig.next.json --noEmit --incremental false` + `npm run check:dok-drive-v3:static` + sıfır `window.confirm`, sıfır çift `×`, sıfır CAD dokunuşu denetimi.

---

### Dalga 3 — Ana Çalışma Alanı Entegrasyonu (F1–F5 Birleştirme) · *Tek Coder (`coder-1`) + Critic*
> **`file-manager.tsx` Tek Sahip Kuralı:** Çakışma ve token israfını önlemek için bu dalgada **yalnız tek `coder-1`** çalışır.
- **`coder-1` Dosyaları:**
  - `src/components/dokumantasyon/file-manager.tsx`
  - `src/components/dokumantasyon/drive-v3/use-drive-selection.ts` (gruplu görünümde güvenli marquee)
  - `src/components/dokumantasyon/mobile-workspace-controls.tsx`
  - `src/components/dokumantasyon/mobile-explorer.tsx`
- **Kapsam:**
  - Dalga 1 ve Dalga 2'deki tüm bileşen/API'lerin bağlanması: `scope=all`, `summary` ile sidebar besleme, tek yönlü filtre senkronu (BUG-13), 27 komut kaydı + `executeBulkStar` + tüm klavye kısayolları + `?` (BUG-10), gerçek sağ tık menüsü + pano çubuğu + kesme soluklaştırma (BUG-06, BUG-07), `NewFolderModal` doğru `tempId` takası (BUG-09), katlanabilir + grup-seçimli + tek sticky başlıklı gruplu görünüm (BUG-21), Breadcrumb DnD, Detay/Etkinlik çekmecesi + çoklu seçim özeti (BUG-11), Selection Dock çoklu İndir/Yıldızla/Paylaş (BUG-08), `<MotionConfig reducedMotion="user">`, satır hover hızlı eylemleri, aktif sıralama okları, 40px boşluğun giderilmesi, satır içi hızlı süzgeç, `ExplorerSkeleton`, `FilterChipsBar`, `WorkspaceStatusBar`, her mutasyonda `useToast`, Upload İptal/Tekrar Dene (BUG-22).
- **Dalga 3 Kapısı (`critic`):** `npx tsc -p tsconfig.next.json --noEmit --incremental false` + `npm run check:dok-drive-v3:static` + `npm run build` + `command-contract.spec.ts` ve `desktop-real-explorer.spec.ts` duman koşusu.

---

### Dalga 4 — Çoklu Senaryo Test Paketi (F6: S1–S8) · *2 Paralel Test Coder + Critic*
- **`coder-1` (S1–S4):**
  - `tests/dok-drive-v3/ux-v4-filters-grouping.spec.ts`
  - `tests/dok-drive-v3/ux-v4-buttons-and-drawer.spec.ts`
  - `tests/dok-drive-v3/ux-v4-context-clipboard-shortcuts.spec.ts`
  - `tests/dok-drive-v3/ux-v4-modals-trash-shares-upload.spec.ts`
- **`coder-2` (S5–S8):**
  - `tests/dok-drive-v3/ux-v4-dnd-breadcrumb.spec.ts`
  - `tests/dok-drive-v3/ux-v4-responsive-theme-motion.spec.ts`
  - `tests/dok-drive-v3/ux-v4-resilience-and-scale.spec.ts`
  - `tests/dok-drive-v3/ux-v4-real-backend-e2e.spec.ts`
- **Kural:** Her test `domcontentloaded`, açık `data-testid`, ≤8 sn aksiyon timeout kullanır; sahte/boş assertion YASAK.
- **Dalga 4 Kapısı (`critic`):** Tüm S1–S8 testleri + mevcut `dok-drive-v3` testleri çalıştırılır; başarısızlar en fazla 2 düzeltme turunda kapatılır; `critic` test gerçekliğini onaylar.

---

### Dalga 5 — Final Kalite Kapısı & Living Docs (F7) · *Tek Coder (`coder-1`) + Final Critic*
- **`coder-1`:**
  1. Final doğrulama zincirini çalıştırır:
     - `npx tsc -p tsconfig.next.json --noEmit --incremental false`
     - `npx tsx --test tests/dok-drive-v3/explorer-derive.unit.test.ts`
     - `npm run check:dok-drive-v3:static`
     - `npx eslint "src/components/dokumantasyon/**/*.{ts,tsx}" "src/app/api/dokumantasyon/**/*.ts" "src/lib/dokumantasyon/file-categories.ts"`
     - `npm run build`
     - `npm run check:dok-drive-v3`
     - `npm run check:simplification-stage6`
  2. Yaşayan dokümanları günceller: `PROJECT.md`, `DOK_CONTEXT_MAP.md`, `docs/DOK_DRIVE_V3_COMMAND_MATRIX.md` ve `docs/plans/dokumantasyon-ux-v4/05-UYGULAMA-DURUMU.md` (BUG-01..BUG-22 tüm kutucuklar + gerçek komut çıktıları).
- **`critic` (Final Onay):** CAD korunan dosyalarında `git status`/`git diff` sıfır değişiklik teyidi + tüm komut exit 0 teyidi → `FINAL ONAY`.

---

## 4. Denetçi (`critic`) 5 Maddelik Hızlı Kontrol Listesi

Her dalga sonunda `critic` yalnızca şu 5 kontrolü yapar ve max 10 satır rapor verir:
1. **CAD Koruma:** `00-MASTER-PLAN.md` §2.1 dosyalarına 0 satır dokunuldu mu?
2. **Kod Hijyeni:** `any`, `console.log`, `window.confirm`, `networkidle`, çıplak `curl`, `.virtualRow`/`.virtualCard` üzerinde `framer-motion` veya `will-change: transform, opacity;` var mı?
3. **Sözleşme Uyumu:** İlgili dalganın tüm `BUG-XX` maddeleri gerçekten kapandı mı (sahte stub yok mu)?
4. **Tema / Mobil / A11y:** Light+Dark renk eşliği, `prefers-reduced-motion`, mobil 44px & açık seçim modu korunuyor mu?
5. **Gerçek Kanıt:** Komutlar gerçekten çalıştırılıp exit code 0 alındı mı, test assert'leri gerçek davranışı mı ölçüyor?
