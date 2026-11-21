# 02 — Seçim Sistemi, Araç Çubuğu, Cockpit ve Sidebar Yeniden Tasarımı

> **Kapsanan Kalemler:** `V5-01`, `V5-02`, `V5-03`, `V5-04`, `V5-05`, `V5-06`, `V5-07`, `V5-08`, `V5-16`  
> **Kırmızı Çizgiler:** `.virtualRow`/`.virtualCard` üzerinde `framer-motion` ve `will-change: transform, opacity;` YASAK; Stage 8 `.virtualCardSelected` `border-color: rgba(245, 158, 11, 0.8)` korunur; Mobil `<=1023px` 44×44px ve açık seçim modu korunur.

---

## 1. Seçim Görsel Sistemi (`V5-01` & `V5-02`)

### 1.1 Liste Satırı vs Grid Kartı CSS Ayrımı (`dok-workspace.module.css`)

Mevcut birleşik kural:
```css
/* KALDIRILACAK ESKİ KURAL (satırları turuncu kafese çeviriyor) */
.virtualCardSelected,
.virtualRowSelected {
  border-color: rgba(245, 158, 11, 0.8) !important;
  ...
}
```

**Yeni V5 Ayrık Kuralı (Light + Dark eşlikli & Stage 8 uyumlu):**
```css
/* Grid Kartı Seçimi — kartlar arası 12px boşluk olduğu için keskin çerçeve temiz görünür */
.virtualCardSelected {
  border-color: rgba(245, 158, 11, 0.8) !important;
  background-color: rgba(245, 158, 11, 0.08) !important;
  box-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.35),
    0 12px 28px -10px rgba(245, 158, 11, 0.28);
}

:global(.dark) .virtualCardSelected {
  background-color: rgba(245, 158, 11, 0.1) !important;
  box-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.4),
    0 16px 32px -12px rgba(245, 158, 11, 0.25);
}

/* Liste Satırı Seçimi — SIFIR 4-kenarlı kutu/kafes! Sakin dolgu + sol 3px accent rayı */
.virtualRowSelected {
  background-color: rgba(245, 158, 11, 0.1) !important;
  box-shadow: inset 3px 0 0 0 #d97706, inset 0 -1px 0 0 rgba(245, 158, 11, 0.14);
}

:global(.dark) .virtualRowSelected {
  background-color: rgba(245, 158, 11, 0.09) !important;
  box-shadow: inset 3px 0 0 0 #f59e0b, inset 0 -1px 0 0 rgba(245, 158, 11, 0.12);
}

@media (hover: hover) and (pointer: fine) {
  .virtualRowSelected:hover {
    background-color: rgba(245, 158, 11, 0.15) !important;
  }
  :global(.dark) .virtualRowSelected:hover {
    background-color: rgba(245, 158, 11, 0.14) !important;
  }
}
```
- `file-manager.tsx` / `explorer-row-card.tsx` satırlarında eskiden eklenen `bg-amber-500/15 border-l-2 border-amber-500` Tailwind fazlalıkları kaldırılır; tek kaynak `.virtualRowSelected` olur.
- Seçili olmayan normal satırlarda alt ayraç ince ve sakin (`border-b border-border/35 dark:border-white/[0.05]`).
- Klavye odağı (`.virtualRowFocused`) seçili satırda bile bozulmadan ayrışır: `outline: 2px solid rgba(245, 158, 11, 0.75); outline-offset: -2px;` (içeri doğru, taşma yok).

### 1.2 Özel 3-Durumlu Checkbox (`src/components/dokumantasyon/drive-v3/drive-checkbox.tsx`)

- **Props:**
  - `checked: boolean`
  - `indeterminate?: boolean`
  - `onClick: (e: React.MouseEvent<HTMLButtonElement>) => void`
  - `ariaLabel: string`
  - `subtle?: boolean` (seçim yokken masaüstü satırlarda hafif sönük, hover/focus'ta tam belirgin)
  - `dataTestId?: string`
- **Görsel Tasarım:**
  - Dış tıklama alanı: masaüstünde `h-8 w-8`, mobilde `min-h-[44px] min-w-[44px]` (`data-selection-control` korunur).
  - İç kutu: `h-[18px] w-[18px] rounded-[5px] flex items-center justify-center transition-colors duration-150`:
    - **Seçili (`checked && !indeterminate`):** `bg-amber-500 border border-amber-500 text-zinc-950 shadow-[0_1px_4px_rgba(245,158,11,0.4)]` içinde `<Check className="h-3 w-3" strokeWidth={3} />`
    - **Kısmi (`indeterminate`):** `bg-amber-500/90 border border-amber-500 text-zinc-950` içinde `<Minus className="h-3 w-3" strokeWidth={3} />`
    - **Seçisiz:** `border border-zinc-400/70 dark:border-zinc-500/80 bg-background/60 hover:border-amber-500`
  - **Erişilebilirlik:** `role="checkbox"`, `aria-checked={indeterminate ? "mixed" : checked}`, `aria-pressed={checked}` (mevcut test uyumluluğu için `data-selection-control` korunur).
- **Kullanım Yerleri:**
  1. Tablo başlığı ("Tümünü Seç" — 0 seçili = boş, `0 < N < total` = `indeterminate`, `N === total` = dolu tik!)
  2. Grup başlıkları (Gruplu Liste & Grid — kısmi grup seçiminde `indeterminate`!)
  3. Liste satırları & Grid kartları (Grid kartında seçiliyken kutu her zaman görünür, seçisizken hover'da belirginleşir; mobilde seçim modunda her zaman görünür).

---

## 2. Yüzen Masaüstü Seçim Kapsülü & Tekrar Temizliği (`V5-03`)

### Yeni Bileşen: `src/components/dokumantasyon/drive-v3/selection-dock.tsx`
- **Masaüstü (`lg+`, `selectedIds.size > 0`):**
  - Konum: Viewport'un hemen altında, merkezlenmiş zarif yüzen kapsül (`mx-auto my-2 max-w-[calc(100%-2rem)] rounded-2xl border border-amber-500/35 bg-card/95 px-3.5 py-2 shadow-2xl backdrop-blur-xl`), Framer Motion ile yumuşak `y: 12 → 0` girişi (`<MotionConfig reducedMotion="user">` altında).
  - `data-testid="dok-mobile-selection-dock"` korunur (mevcut E2E testleriyle %100 uyum!).
  - **İç Düzen (Tek Satır, Sıfır Tekrar):**
    - **Sol Grup:**
      - `[×]` (Seçimi Temizle — `Esc` tooltip, `aria-label="Seçimi Temizle"`)
      - Net amber rozet: **`28 seçili`** + `(23.4 MB)` (seçili boyut > 0 ise)
      - **`Tersine Çevir`** (ince ikincil buton, `data-testid="dok-invert-selection"` — mevcut dizinde seçili olanları bırakıp diğerlerini seçer!)
    - **Dikey Ayraç (`h-5 w-px bg-border/70`)**
    - **Sağ Eylem Grubu:**
      - `İndir` (yalnız seçili dosya varsa, `data-mobile-action="download"`)
      - `Yıldızla` / `Yıldızı Kaldır` (`data-mobile-action="star"`)
      - `Kopyala` (`Ctrl+C`, `data-testid="dok-dock-copy"`)
      - `Kes` (`Ctrl+X`, `data-testid="dok-dock-cut"`)
      - `Taşı` (`data-mobile-action="move"`)
      - **`Paylaş`** (birincil amber CTA, `data-mobile-action="share"`)
      - **`Sil`** (kırmızı tehlike aksiyonu, `data-mobile-action="trash"`)
  - **Kaldırılan Tekrarlar:**
    - Üst araç çubuğundaki kırmızı `[Trash N]` butonu kaldırılır.
    - Alt dock'taki kafa karıştıran çift `Kaldır` + `Temizle` düğmesi tek temiz `[×]` + başlık checkbox'ına iner.
    - Seçim dock'u açıkken `WorkspaceStatusBar` ortasındaki ikinci `N öğe seçili` hapı gizlenir (tek kaynak).
- **Mobil (`<=1023px`):**
  - Mevcut `mobileSelectionBar` CSS sözleşmesi %100 korunur: statik tam genişlik, 44×44 px, yalnız 3 ana eylem (`Taşı`, `Paylaş`, `Sil`).

---

## 3. Tek Ekran Cockpit Düzeni (`V5-04`)

- **Sorun:** `admin-shell.tsx` içinde `min-h-[calc(100vh-4.5rem)]` + büyük header kartı + `file-manager.tsx` içinde `lg:h-[calc(100dvh-10rem)]` birleşince toplam yükseklik `100dvh`'yi aşıyor ve üstteki `Dokümantasyon Modülü` kartı sticky navbar altında kesiliyor.
- **Çözüm:**
  - `admin-shell.tsx`:
    - Masaüstünde (`lg+`) kök kapsayıcı: `lg:h-[calc(100dvh-var(--dok-app-header-height,4.5rem))] lg:overflow-hidden lg:flex lg:flex-col`
    - İç kaplama: `flex flex-1 min-h-0 flex-col gap-2.5 px-2 py-2 sm:px-4 lg:px-5 lg:py-2.5`
    - `dok-admin-header`: masaüstünde kompakt tek satır şerit (`py-2 px-4`, ikon `h-8 w-8`, başlık `text-sm font-bold`, açıklama `hidden xl:inline text-xs text-muted-foreground`, depolama rozeti + `admin v` sağda) — toplam yükseklik `~48px`.
    - `managerSlot`: `flex-1 min-h-0 flex flex-col`.
  - `file-manager.tsx`:
    - `lg:h-[calc(100dvh-10rem)] lg:max-h-[calc(100dvh-10rem)]` yerine `lg:h-full lg:flex-1 lg:min-h-0`!
  - **Sonuç:** Masaüstü 1280×720, 1366×768, 1920×1080 ekranların tamamında **sıfır dış sayfa kaydırması**, **sıfır kesik başlık**, maksimum dosya listesi alanı (+80–110px dikey kazanç!).

---

## 4. Sadeleştirilmiş Araç Çubuğu (`V5-05` & `V5-06`)

### Yeni Bileşen: `src/components/dokumantasyon/drive-v3/explorer-toolbar.tsx`

| Bölge | Öğeler | Açıklama |
|---|---|---|
| **1. Sol — Gezinti & Geçmiş** | `←` `→` geçmiş butonları + Breadcrumb (`Kök Dizin > … > Alt Klasör`) | `Alt+←` / `Alt+→` klasör geçmişi (`backStack` / `forwardStack`). Uzun yolda `…` artık tıklanabilir `<DropdownMenu>` — gizlenen tüm üst klasörlere tek tıkla atlanır! Tüm breadcrumb segmentleri DnD drop hedefi olmaya devam eder. |
| **2. Orta — Birleşik Arama & Süzgeç** | Tek input: `[🔍 Listede süz... | ⌘K]` | Yazdıkça mevcut görünümü anlık (`normalizeTrSearch`) süzer; sağdaki `Ctrl+K` / `Tüm Drive` butonuna tıklayınca veya `/` / `Ctrl+K` basınca **Komut Paleti & Global Arama** açılır. İki ayrı arama kutusu karmaşası biter! |
| **3. Sağ — Görünüm & Eylem** | `Sırala`, `Grupla`, `Filtre` (aktif rozetli), **`+ Yeni`** (dropdown: Dosya Yükle / Klasör Yükle / Yeni Klasör), **Yoğunluk** (`Rahat`/`Sıkışık`), **`Liste / Grid`** `layoutId` pil, `Yenile (R)`, `Bilgi (i)` | Masaüstünde araç çubuğu 14 kontrolden **7–8 dengeli kontrole** iner; asla iki satıra taşmaz. Testlerin kullandığı `dok-select-all`, `dok-inline-filter`, `dok-refresh-btn` ve `aria-label` sözleşmeleri korunur (`dok-select-all` yalnız tablo/grid başlığı veya kompakt rozet olarak erişilebilir kalır). |

### `FilterChipsBar` Bug Fix (`V5-06`)
- `filter-chips-bar.tsx` içindeki `DATE_LABELS`:
  ```ts
  const DATE_LABELS: Record<string, string> = {
    today: "Tarih: Bugün",
    week: "Tarih: Son 7 gün",
    month: "Tarih: Son 30 gün",
    "7d": "Tarih: Son 7 gün",
    "30d": "Tarih: Son 30 gün",
  };
  ```
- `TYPE_LABELS` içine `document: "Tür: Belgeler & Tablolar"` eklenir.

---

## 5. Sidebar Kategorileri, Hızlı Klasör Ağacı ve Drop Hedefleri (`V5-07` & `V5-08`)

### 5.1 `file-categories.ts` & `items/route.ts` Genişlemesi
- `DokFileCategory = "cad" | "pdf" | "image" | "document" | "other"`
- `getFileCategory`:
  - `CAD_SET` → `"cad"` (`dwg`, `dxf`, `dwf`)
  - `PDF_SET` → `"pdf"` (`pdf`)
  - `IMAGE_SET` → `"image"` (`png`, `jpg`, `jpeg`, `webp`, `svg`, `gif`)
  - `DOCUMENT_SET` → `"document"` (`md`, `txt`, `doc`, `docx`, `xls`, `xlsx`, `csv`, `json`, `xml`, `html`, `css`, `ts`, `js`)
  - diğerleri → `"other"` (`zip`, `rar`, `7z`, vb.)
- `items/route.ts` içindeki `summary.categoryCounts`: `{ cad, pdf, image, document, other }`.

### 5.2 `DriveSidebar` Geliştirmeleri
1. **Kategori Filtresi:** `AutoCAD (DWG / DXF)`, `PDF Dokümanları`, `Görseller & Fotoğraflar`, **`Belgeler & Tablolar`**, ve (`otherCount > 0` ise) `Diğer / Arşivler`.
2. **Tıklanabilir Depolama Dağılım Çubuğu:** Çubuktaki her renk dilimi `<button>` olarak ilgili kategoriye tıklar (tooltip: `AutoCAD: 14 dosya · Tıklayarak filtrele`).
3. **Katlanabilir Hızlı Klasör Ağacı (`data-testid="dok-sidebar-folder-tree"`):**
   - `GET /api/dokumantasyon/folders/tree` (React Query ile önbellekli, mutasyonlarda invalidate edilir) verisinden maksimum 3 derinlikte girintili, açılır-kapanır klasör listesi.
   - Aktif klasör yumuşak amber vurgulu.
   - Her klasör düğümü **DnD Drop Target**: listeden dosya/klasör sürükleyip sidebar'daki herhangi bir klasöre bırakınca doğrudan oraya taşınır!
4. **Sidebar Akıllı Drop Hedefleri:**
   - **`Yıldızlı Dosyalar` düğmesi:** Üzerine sürüklenen dosya/klasör bırakılınca anında yıldızlanır + toast!
   - **`Çöp Kutusu` düğmesi:** Üzerine sürüklenen dosya/klasör bırakılınca çöpe gönderilir + **Geri Al (Undo)** toast!
   - Sürükleme sırasında ilgili sidebar düğmesi canlı halka (`ring-2 ring-amber-500 bg-amber-500/15` veya çöp için `ring-red-500 bg-red-500/15`) ile parlar.

---

## 6. Warm Amber Glass Marquee (`V5-16`)

- `file-manager.tsx` içindeki mavi marquee (`border-blue-500/90 bg-blue-500/20`) Warm Amber temasına alınır:
  - `border border-amber-500/85 bg-amber-500/15 shadow-[0_0_16px_rgba(245,158,11,0.18)] rounded-md`
- Sürükleme sırasında kutu ≥ 24px olduğunda sağ alt köşede küçük yüzen sayaç hapı: **`N öğe`** (`bg-amber-500 text-zinc-950 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full`).
