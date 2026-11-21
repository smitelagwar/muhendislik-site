# 03 — Güç-Kullanıcı Özellikleri ("Aklıma Gelmeyenler") & Modüler Mimari

> **Kapsanan Kalemler:** `V5-09`, `V5-10`, `V5-11`, `V5-12`, `V5-13`, `V5-14`, `V5-15`, `V5-17`, `V5-18`  
> **İlke:** Her özellik gerçek mühendislik/mimarlık dosya yönetimi akışından doğar; sıfır yeni npm paketi, mevcut API rotaları (`/files/[id]/stream`, `/bulk/restore`, `/bulk/move`, `/folders/tree`, `/files/[id]/versions`, `/search`) yeniden kullanılır; CAD altın motoruna 0 dokunuş.

---

## 1. Quick Look (`Space`) — Klasörden Çıkmadan Hızlı Önizleme & Galeri (`V5-09`)

### Yeni Bileşen: `src/components/dokumantasyon/drive-v3/quick-look-modal.tsx`
- **Tetikleme:**
  - Masaüstünde bir dosya seçili veya odaklıyken **`Space`** tuşu (input/textarea/modal açık değilse).
  - Satır hover hızlı eylemindeki **`Hızlı Bakış`** (`Eye`) ikonu veya sağ tık menüsünde **"Hızlı Bakış (Space)"**.
  - *(Tam sayfa Stüdyo geçişi: dosya adına çift tık / `Enter` veya Quick Look içindeki "Tam Stüdyoda Aç" butonuyla korunur!)*
- **Desteklenen Formatlar (Sıfır CAD Motor Dokunuşu):**
  1. **Görseller (`png`, `jpg`, `jpeg`, `webp`, `gif`, `svg`):**
     - `GET /api/dokumantasyon/files/${file.id}/stream` üzerinden doğrudan yüksek çözünürlüklü önizleme.
     - Araçlar: `+` Yakınlaştır (`25%` adım, max `300%`), `-` Uzaklaştır, `1:1` Sıfırla, `90°` Döndür, koyu/damalı arka plan (şeffaf PNG/SVG için).
  2. **Metin / Markdown / Kod / JSON / CSV (`md`, `txt`, `json`, `csv`, `xml`, `html`, `css`, `ts`, `js`):**
     - `AbortController` ile `stream` endpoint'inden ilk 256 KB'a kadar güvenli okuma (`Content-Type` / boyut korumalı).
     - Temiz okunaklı monospace/prose görünüm + tek tıkla **"İçeriği Kopyala"** butonu.
  3. **PDF (`pdf`):**
     - Hafif `<iframe src="/api/dokumantasyon/files/${file.id}/stream#view=FitH" title={file.display_name} />` hızlı görünüm + üstte **"PDF Stüdyo'da Aç"** CTA.
  4. **AutoCAD / DWG / DXF / DWF:**
     - **CAD altın motoruna dokunulmaz.** Büyük ikon sahnesi + boyut/tarih/uzantı teknik özeti + iki net buton: **"CAD Studio'da Aç"** (`/dokumantasyon/dosya/${file.id}`) ve **"V2 Motor ile Aç"** (`?cadEngine=v2`).
  5. **Diğer / Arşiv:**
     - Teknik metadata kartı + **"İndir"** ve **"Paylaş"** butonları.
- **Galeri Navigasyonu & Klavye:**
  - `←` / `→` (veya yan ok butonları): Mevcut dizindeki dosyalar arasında anında geçiş (`3 / 24` sayaç).
  - `Esc` veya `Space`: Hemen kapanır, odak eski satıra döner.
  - Üst çubukta hızlı aksiyonlar: **İndir**, **Paylaş**, **Yıldızla**, **Tam Stüdyoda Aç**, **Kapat (`Esc`)**.
  - `data-testid="dok-quick-look-modal"`, `data-testid="dok-quick-look-prev"`, `data-testid="dok-quick-look-next"`.

---

## 2. Satır İçi Uzantı-Korumalı Yeniden Adlandırma (`V5-10`)

- **Nerede:** `explorer-row-card.tsx` (Liste görünümü) + `file-manager.tsx` (`inlineRenameId` state).
- **Tetikleme:** Tek öğe seçili/odaklıyken **`F2`** (liste görünümünde) veya satır hızlı eylem çubuğundaki `Adlandır` butonu. *(Grid görünümünde veya mobil cihazlarda mevcut `RenameModal` açılır.)*
- **Uzantı Koruma Mühendisliği:**
  - Dosya adı `beton-dokum-tutanagi.pdf` ise, editör açıldığında `input.setSelectionRange(0, baseNameLength)` ile yalnız **`beton-dokum-tutanagi`** seçili gelir; kullanıcı yazmaya başladığında `.pdf` uzantısı yanlışlıkla silinmez!
  - Kullanıcı uzantısız bir ad yazarsa (örn. `yeni-rapor`), kayıt sırasında orijinal `.pdf` uzantısı otomatik korunur (klasörlerde olduğu gibi kaydedilir).
- **Etkileşim:**
  - `Enter` veya `blur`: `PATCH /api/dokumantasyon/files|folders/[id]` ile optimistik kaydet + Undo Toast!
  - `Esc`: Değişikliği iptal et, odağı satıra geri ver.
  - Boş veya aynı isimde sunucuya gereksiz istek atılmaz.
  - `data-testid="dok-inline-rename-input"`.

---

## 3. Geri Alınabilir Aksiyonlar — Undo Toast & `Ctrl+Z` (`V5-11`)

### Yeni Modül: `src/components/dokumantasyon/drive-v3/use-undo-toast.ts`
- **Altyapı:** Projede zaten kurulu ve `SiteShell`'de mount edilmiş olan **`sonner`** (`toast(message, { action: { label: "Geri Al", onClick }, duration: 7000 })`) veya genişletilmiş `ToastProvider` kullanılır.
  - **Öneri:** `src/components/toast-provider.tsx` içinde `showToast(message, type, options?: { actionLabel?: string; onAction?: () => void; durationMs?: number })` geriye dönük tam uyumlu opsiyonel 3. parametre ile genişletilir — böylece tüm uygulama tek toast tasarım dilini (Warm Glass + Light/Dark uyumu) korur ve ek çakışan toast katmanı oluşmaz!
- **Desteklenen Geri Alma İşlemleri (`UndoEntry` yığını — son işlem 10 sn aktif):**
  1. **Çöpe Taşıma (Tekil veya Çoklu):**
     - Toast: `"3 öğe çöp kutusuna taşındı"` + `[Geri Al]`
     - Geri Al: `POST /api/dokumantasyon/bulk/restore` `{ items: [...] }` → `fetchItems()` → `"3 öğe geri yüklendi"`
  2. **Taşıma (MoveModal, DnD veya Kes+Yapıştır):**
     - Toast: `"2 öğe '1_kisim' klasörüne taşındı"` + `[Geri Al]`
     - Geri Al: Öğeleri orijinal `parentId` gruplarına göre `POST /api/dokumantasyon/bulk/move` ile eski klasörlerine döndür → `fetchItems()`
  3. **Yeniden Adlandırma (Inline veya Modal):**
     - Toast: `"Ad güncellendi"` + `[Geri Al]`
     - Geri Al: Eski isimle `PATCH` → `fetchItems()`
- **Klavye:** Input odaklanmamışken **`Ctrl+Z` / `Cmd+Z`** son aktif geri alınabilir aksiyonu çalıştırır (`data-testid="dok-toast-undo"`).

---

## 4. Komut Paleti (`Ctrl+K` / `Cmd+K`) (`V5-12`)

### Yeni Bileşen: `src/components/dokumantasyon/drive-v3/command-palette.tsx`
- **Kısayol:** `Ctrl+K` / `Cmd+K` (ve araç çubuğundaki birleşik arama kutusunun sağındaki `⌘K` düğmesi). `/` kısayolu da Komut Paleti'ni arama modunda açabilir (mevcut `SearchModal` davranışını koruyarak veya birleştirerek).
- **3 Bölümlü Canlı Liste:**
  1. **Dosyalar & Klasörler:** `GET /api/dokumantasyon/search?q=...` (`AbortController` + 180ms debounce) — dosya ikonu, ad, uzantı rozeti, boyut + iki aksiyon: `Enter` → Aç/Klasöre Git, `Space` veya ikon → Quick Look.
  2. **Hızlı Komutlar (Anında Yerel Süzgeç — Türkçe `normalizeTrSearch`):**
     - Yeni Klasör Oluştur (`N`), Dosya Yükle (`U`), Liste / Kart Görünümü (`V`), Yoğunluk Değiştir, Türe Göre Grupla, Tarihe Göre Grupla, Gruplamayı Kaldır, Çöp Kutusunu Aç, Aktif Paylaşımlar, Detay Çekmecesini Aç/Kapat (`I`), Tümünü Seç (`Ctrl+A`), Klavye Kısayolları (`?`).
  3. **Son Açılanlar (Sorgu Boşken):** İlk 5 son açılan öğe — tek dokunuşla açılış.
- **Klavye:** `↑`/`↓` seçim hareketi, `Enter` çalıştır, `Esc` kapat, `data-testid="dok-command-palette"`.

---

## 5. Grid Lazy Image Thumbnails & Zenginleştirilmiş Liste Sütunları (`V5-13`)

### 5.1 Grid Görsel Küçük Resimleri (`explorer-row-card.tsx`)
- `fileKind === "image"` (`png`, `jpg`, `jpeg`, `webp`, `gif`) dosyalarında `.cardIconStage` içinde:
  - `<img src={`/api/dokumantasyon/files/${file.id}/stream`} alt={file.display_name} loading="lazy" decoding="async" onError={() => setThumbFailed(true)} className="h-full w-full object-cover" />`
  - Yüklenene kadar arka planda mevcut ikon görünür; hata/mock ortamda (`thumbFailed === true`) kesintisiz `FileTypeIcon` kalır.
  - `.virtualCard` yüksekliği `h-[260px]` ve `cardIconStage` geometrisi (`file-card-visual.spec.ts` uyumu) korunur.

### 5.2 Liste Sütunları & Tipografik Hizalama
- **Masaüstü 12-Kolon Dengeli Dağılım:**
  - `col-span-6` (**İsim**): `<DriveCheckbox />` + `<Star />` + `<FileTypeIcon />` + Dosya adı (truncate) + **renkli mikro uzantı rozeti** (`DWG`, `DXF`, `PDF`, `MD`, `PNG` — yalnızca dosya satırlarında, sade `text-[10px] font-mono`).
  - `col-span-2` (**Boyut**): Sağa hizalı (`text-right tabular-nums font-mono`) — sayısal sütunlar dikeyde hizalı görünür! Klasörlerde sakin `—`.
  - `col-span-2` (**Değiştirilme**): Göreli okunaklı tarih (örn. *"2 sa önce"*, *"3 gün önce"*, 7 günden eskiyse `12.10.2026`), `title` özniteliğinde tam tarih-saat (`12.10.2026 11:27`).
  - `col-span-2` (**İşlem**): Hover/focus'ta yumuşak beliren hızlı eylemler (`Hızlı Bakış`, `İndir`, `Paylaş`, `Adlandır`) + sabit `⋮` menü butonu.

---

## 6. Yoğunluk Modu, `localStorage` Kalıcılık & URL Deep-Link (`V5-14`)

1. **Liste Yoğunluğu (`density: "comfortable" | "compact"`):**
   - `comfortable` (varsayılan): `56px` satır yüksekliği (tüm mevcut testlerle %100 uyumlu).
   - `compact`: `44px` masaüstü satır yüksekliği — aynı ekranda **%27 daha fazla dosya** görünür! (Mobilde `<=1023px` dokunma sözleşmesi gereği her zaman `56px` kalır.)
   - `listVirtualizer` `estimateSize` yoğunluğa göre dinamik güncellenir + `measure()` çağrılır.
2. **Tercih Kalıcılığı (`localStorage` key: `dok_workspace_prefs_v5`):**
   - Hydration-safe `useEffect` okumasıyla kaydedilenler: `viewMode`, `density`, `detailsOpen`, `sidebarTreeOpen`.
3. **URL Deep-Link Senkronu:**
   - Mevcut klasör ve temel görünüm state'i URL query parametreleriyle senkronize edilir: `?folder=<id>&filter=<f>&sort=<by:order>&group=<g>&view=<v>`.
   - Sayfa yenilendiğinde (`F5`) veya tarayıcı `Geri`/`İleri` tuşlarına basıldığında (`popstate`) kullanıcı **Kök Dizin'e atılmaz**, olduğu klasör ve filtrede kalır!
   - `useWorkspaceHistory` (mobil overlay geçmişi) ile çakışmadan `window.history.replaceState` / `pushState` yalnız URL query katmanında güvenli çalışır.

---

## 7. Sistem Panosundan `Ctrl+V` Ekran Görüntüsü / Dosya Yükleme (`V5-15`)

- `file-manager.tsx` üzerinde global `paste` dinleyicisi:
  - Şartlar: Input/textarea/contentEditable odaklanmamış, modal açık değil, **iç uygulama panosu (`clipboardState`) boş**.
  - `e.clipboardData?.files` içinde dosya varsa (`length > 0`):
    - Dosya adı boş veya `image.png` ise zaman damgalı Türkçe ad verilir: `ekran-goruntusu-20261121-141530.png`.
    - Mevcut `uploadFiles(files)` kuyruğuna aktarılır ve `"Panodan 1 dosya yükleniyor..."` toast gösterilir.

---

## 8. Detay Çekmecesi Zenginleştirmesi (`V5-17`)

- `drive-details-drawer.tsx`:
  1. **Görsel Mini Önizleme:** Tek seçili dosya görselse üstte `aspect-video` yuvarlatılmış canlı önizleme (hata fallback ikonlu) + üzerine tıklayınca Quick Look açılır.
  2. **Tek Tık Link Kopyala:** `"Stüdyo Linkini Kopyala"` (`navigator.clipboard.writeText(origin + "/dokumantasyon/dosya/" + file.id)` + `"Link kopyalandı"` anlık geri bildirimi).
  3. **Sürüm Bilgisi:** Tek dosyada `GET /api/dokumantasyon/files/[id]/versions` çağrısı ile sürüm sayısı rozeti (`v3 · 3 sürüm`) — hata/404 olursa sessizce gizlenir.
  4. **Çoklu Seçim Tür Dağılımı:** Çoklu seçim panelinde CAD / PDF / Görsel / Belge / Klasör renkli mini dağılım çubuğu.
  5. **Tıklanabilir Etkinlik Öğeleri:** Etkinlik sekmesindeki dosya kayıtlarına tıklanınca hızlı önizleme / açılış.

---

## 9. `file-manager.tsx` Modüler Ayrıştırma Haritası (`V5-18`)

Mevcut **3.664 satırlık** monolitik `file-manager.tsx` aşağıdaki temiz parçalara ayrılır:

| Yeni / Güncel Dosya | Sorumluluk | Tahmini Boyut |
|---|---|---|
| `drive-v3/drive-checkbox.tsx` *(yeni)* | 3-durumlu yüksek kontrastlı checkbox (`checked` / `indeterminate` / `subtle`) | ~95 satır |
| `drive-v3/selection-dock.tsx` *(yeni)* | Masaüstü yüzen kapsül dock (`Tersine Çevir`, `Kopyala`, `Kes`, vb.) + mobil 3-eylem bar | ~180 satır |
| `drive-v3/explorer-toolbar.tsx` *(yeni)* | 3 bölgeli temiz araç çubuğu, `←/→` geçmiş, tıklanabilir `…` breadcrumb, birleşik arama, `+ Yeni`, yoğunluk | ~320 satır |
| `drive-v3/explorer-row-card.tsx` *(yeni)* | Liste satırı + Grid kartı, lazy image thumbnail, inline rename, hover hızlı eylemler (saf CSS, Framer Motion YASAK!) | ~420 satır |
| `drive-v3/quick-look-modal.tsx` *(yeni)* | `Space` hızlı önizleme + `←/→` galeri + görsel zoom/döndürme + metin/PDF/CAD kartı | ~340 satır |
| `drive-v3/command-palette.tsx` *(yeni)* | `Ctrl+K` birleşik dosya arama + hızlı aksiyon komut paleti | ~280 satır |
| `drive-v3/use-undo-toast.ts` *(yeni)* | Geri alınabilir çöp/taşıma/adlandırma yığını + `Ctrl+Z` + Toast aksiyon bağlantısı | ~120 satır |
| `file-manager.tsx` *(sadeleşir)* | State, React Query, komut kayıtları, DnD, URL/prefs senkronu ve bileşen orkestrasyonu | ~1.400–1.600 satır |
