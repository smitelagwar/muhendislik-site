# 02 — Filtre, Gruplama, Sıralama, Komut ve Çalışma Alanı Mimarisi

Bu belge; `/dokumantasyon` çalışma alanındaki tüm veri akışı, filtreleme, gruplama, sıralama, komutlar, sağ tık menüsü, pano ve modal sözleşmelerini tanımlar.

---

## 1. Tek Kaynaklı Filtre, Sıralama ve Gruplama Motoru

### 1.1 Ortak Sınıflandırma Modülü (`src/lib/dokumantasyon/file-categories.ts`)
Hem sunucu (`src/app/api/dokumantasyon/items/route.ts`) hem istemci (`src/components/dokumantasyon/drive-v3/explorer-derive.ts`) **birebir aynı kuralları** bu dosyadan import eder:

| Kategori | Uzantılar (noktasız, küçük harf) |
|---|---|
| `cad` | `dwg`, `dxf`, `dwf` |
| `pdf` | `pdf` |
| `image` | `png`, `jpg`, `jpeg`, `webp`, `svg`, `gif` |
| `document` (gruplamada alt kova) | `md`, `txt`, `doc`, `docx`, `xls`, `xlsx`, `csv`, `json`, `xml`, `html`, `css`, `ts`, `js` |
| `other` (filtrede) | `cad`, `pdf`, `image` dışındaki tüm dosyalar |

Boyut eşikleri tek sabitte birleşir:
- `small`: `< 5 MB` (`< 5 * 1024 * 1024`)
- `medium`: `5 MB <= boyut < 100 MB`
- `large`: `>= 100 MB`

Tarih alanı tek yardımcıda birleşir:
- `getEffectiveItemTimestamp(item)`: `new Date(item.updated_at || item.created_at || 0).getTime()`
- `collection === "recent"` durumunda sıralama önceliği `last_opened_at` (azalan) olur; kullanıcı manuel sıralama seçerse o sıralama uygulanır.

Türkçe metin normalizasyonu:
- `normalizeTrSearch(value: string)`: `value.trim().toLocaleLowerCase("tr-TR").replace(/\u0307/g, "")` — `"İNŞAAT"`, `"İnşaat"`, `"inşaat"` ve `"KISIM"`/`"kısım"` sorunsuz eşleşir.

### 1.2 Sunucu `GET /api/dokumantasyon/items` Sözleşmesi
Query parametreleri:
- `folderId`: `string | null`
- `collection`: `"none" | "recent" | "starred"`
- `type`: `"all" | "cad" | "pdf" | "image" | "other"`
- `date`: `"all" | "today" | "week" | "month"`
- `size`: `"all" | "small" | "medium" | "large"`
- `scope`: `"current" | "all"` (`collection !== "none"` iken otomatik `"all"`)
- `sortBy`: `"name" | "date" | "size" | "type"`
- `order`: `"asc" | "desc"` (geriye dönük `sortOrder` gelirse fallback okunur)

Dönen `summary` nesnesi (filtreden bağımsız **gerçek çalışma alanı** toplamları):
```ts
summary: {
  totalFiles: number;
  totalFolders: number;
  totalSizeBytes: number;
  starredCount: number;
  trashCount: number;
  activeSharesCount: number;
  categoryCounts: {
    cad: number;
    pdf: number;
    image: number;
    other: number;
  };
}
```
> **Not:** `query-client.ts` içindeki `fetchDokItems` fonksiyonu `scope: "all"` parametresini **silmeden** query string'e yazmalıdır (eski `v !== "all"` filtresi yalnızca `type`/`date`/`size` içindir; `scope === "all"` mutlaka `?scope=all` olarak iletilir!).

### 1.3 Tek Yönlü Filtre Senkronizasyonu (Sidebar ↔ FilterSheet ↔ QuickSearch ↔ Chips ↔ Mobile)
Tek yardımcı fonksiyon `reconcileWorkspaceFilters`:
- Sol menüde:
  - `"all"` → `type: "all"`, `starredOnly: false`, `date: "all"`, `size: "all"`, `scope: "current"`, `quickQuery: ""`
  - `"recent"` → `activeFilter = "recent"`, `starredOnly: false`, `type: "all"`, `scope: "all"` (son açılanlar tüm klasörlerden gelir)
  - `"starred"` → `activeFilter = "starred"`, `starredOnly: true`, `type: "all"`, `scope: "all"`
  - `"cad" | "pdf" | "image"` → `activeFilter = filter`, `workspaceFilters.type = filter`, `starredOnly: false`
- `WorkspaceFilterSheet`'te değişiklik yapıldığında:
  - `starredOnly: true` ise sidebar `"starred"` vurgulanır (veya başka türle birlikteyse ikisi de çip olarak görünür).
  - `type: "cad" | "pdf" | "image"` ve `!starredOnly` ise sidebar ilgili kategoriyle senkronize vurgulanır.
  - `type: "other"` veya tarih/boyut/kapsam seçiliyse sidebar `"all"` kalır ama Üst Filtre butonu aktif rozet sayısı gösterir ve Çip Çubuğu her aktif filtreyi **tek tek kapatılabilir (`×`)** buton olarak listeler.
- Breadcrumb `"Kök Dizin"` tıklandığında: `currentFolderId = null` yapılır; eğer aktif bir koleksiyon (`recent`/`starred`) varsa `"all"`'a dönülür ve çelişen koleksiyon filtreleri temizlenir.
- **Satır İçi Hızlı Filtre (`quickQuery`):** Komut çubuğunda kompakt bir hızlı süzgeç (veya `Ara...` yanında anlık mevcut görünüm süzgeci) ile kullanıcı mevcut klasörde/filtrelenmiş listede anlık daraltma yapabilir; global sunucu araması (`SearchModal`, `/` veya `Ctrl+K`) tüm klasörlerde derin arama yapmaya devam eder.

### 1.4 Gruplama Motoru (Katlanabilir + Grup Seçimli + Birleşik Grid)
Desteklenen gruplar (`groupBy`):
1. `"none"` — Klasik sanallaştırılmış Liste (56px) / Grid (dinamik kolon)
2. `"type"` — Klasörler, AutoCAD/CAD (DWG/DXF/DWF), PDF, Görseller, Metin/Belge, Diğer
3. `"date"` — Bugün (Son 24s), Bu Hafta (Son 7g), Bu Ay (Son 30g), Daha Eski (her biri `updated_at || created_at` bazlı)
4. `"size"` — Klasörler, Çok Büyük (≥100 MB), Büyük (25–100 MB), Orta (5–25 MB), Küçük (<5 MB)

Gruplu görünüm kuralları:
- Her grup başlığı (`data-testid="dok-group-header"`, `data-group-key={bucket.key}`):
  - Solunda aç/kapa chevron butonu (`aria-expanded`), grup etiketi, öğe sayısı ve grup toplam boyutu (dosyalar için).
  - Sağında **"Grubu Seç / Kaldır"** butonu (yalnız o gruptaki öğeleri seçime ekler/çıkarır; tüm listeyi yanlışlıkla seçmez!).
- Gruplu Liste görünümünde tek bir üst sütun başlığı (sticky) bulunur; her grup altında tekrarlanan 5 adet sahte tablo başlığı kaldırılır.
- Gruplu Grid görünümünde aynı grup içindeki klasörler ve dosyalar tek ortak CSS grid konteynerinde (klasörler önce, sonra dosyalar) akıtılır; kırık yarım satırlar oluşmaz.
- Gruplu görünüm açıkken `useDriveSelection` marquee hit-testing işlemi `renderedElements` (DOM bounding box kesişimi) bazlı çalışır, böylece grup başlık yüksekliği nedeniyle seçim kutusu asla kaymaz.

---

## 2. Tam 27 Komut Sözleşmesi & Klavye Kısayolları

`CommandRegistry` içinde tanımlı **27 komutun tamamı** (`file-manager.tsx` içinde) gerçek handler'a bağlanır; sıfır `Handler not registered` uyarısı!

| Komut ID | Kısayol (Masaüstü) | Çalışma Sözleşmesi |
|---|---|---|
| `new-folder` | `Shift+N` | `NewFolderModal` açar |
| `upload-files` | `Ctrl+U` | Gizli dosya seçiciyi tetikler |
| `upload-folder` | — | `openFolderPicker()` çağırır |
| `open` | `Enter` / Çift Tık | Tek klasör → içine girer; tek dosya → `/dokumantasyon/dosya/[id]` |
| `preview` | `Space` / `P` | Tek dosyada önizleme/studio rotasına gider (focus input değilken) |
| `open-cad-v2` | — | `.dwg`/`.dxf` dosyada `?cadEngine=v2` açar |
| `download` | `Ctrl+D` | Seçili 1+ dosyayı indirir (tarayıcı varsayılan bookmark'ı `preventDefault` edilir); yalnızca klasör seçiliyse bilgilendirici Toast gösterir |
| `rename` | `F2` | Seçili tek öğe için `RenameModal` açar |
| `move` | `M` | Seçili 1..250 öğe için `MoveModal` açar |
| `trash` | `Delete` | Tek öğede tekil, çoklu seçimde `isMultiDeleteOpen` açar |
| `restore` | `Alt+R` | `TrashModal` açıkken seçili/hedef öğeyi geri yükler |
| `delete-forever` | `Shift+Delete` | `TrashModal` açıkken satır içi kalıcı silme onayını açar |
| `star` / `unstar` | `S` (toggle) | Tekil veya toplu `executeBulkStar` ile yıldızlar/kaldırır + iyimser güncelleme + Toast |
| `share` | `Alt+S` | Tekil veya çoklu **dosya VE klasör** için `CreateShareModal` açar |
| `details` | `I` | Sağ Detay/Etkinlik Çekmecesini açar/kapatır |
| `search` | `/` veya `Ctrl+Shift+F` | `SearchModal` açar (`Ctrl+K` global site aramasıyla çakışmaması için `/` birincil, `?` kısayol yardımı) |
| `select-all` | `Ctrl+A` | Masaüstünde odak nerede olursa olsun (input/modal hariç) görünür tüm öğeleri seçer; mobilde yalnızca `isMobileSelectionMode` açıkken |
| `clear-selection` | `Escape` | Önce açık context menüyü, sonra panoyu/seçimi temizler |
| `refresh` | `R` (modifiersız) | Query cache yeniler + kısa dönen yenileme animasyonu + Toast |
| `change-view` | `V` | Liste ↔ Grid geçişi yapar |
| `change-sort` | — | Payload `{ sortBy, sortOrder }` ile sıralamayı günceller |
| `open-trash` | — | `TrashModal` açar |
| `open-active-shares` | — | `ActiveSharesModal` açar |
| `copy` | `Ctrl+C` | Seçili öğeleri panoya `mode: "copy"` koyar + Toast |
| `cut` | `Ctrl+X` | Seçili öğeleri panoya `mode: "cut"` koyar + Toast |
| `paste` | `Ctrl+V` | `cut` → `executeBulkMove`; `copy` → `executeBulkCopy` (`/api/dokumantasyon/bulk/copy`) + Toast |
| *(Yardım)* | `?` | `ShortcutsModal` (Klavye Kısayolları Rehberi) açar |

> **Önemli Kısayol Koruma Kuralı:** `input`, `textarea`, `select`, `[contenteditable="true"]` içinde veya herhangi bir modal/dialog açıkken tek harfli kısayollar (`V`, `I`, `M`, `S`, `P`, `R`, `/`, `?`) **ASLA** tetiklenmez!

---

## 3. Gerçek Masaüstü Sağ Tık Bağlam Menüsü (`context-menu.tsx`)

- **Tetikleme:** Yalnızca masaüstünde (`!isMobileExplorer`) ve `pointerType === "mouse"` ile `contextmenu` olayında açılır. Touch ve pen asla açmaz (`explorer-activation.ts` sözleşmesi korunur).
- **Konumlandırma:** Portal (`document.body` / yüksek z-index) üzerinde render edilir; açıldığı `(x, y)` noktası `window.innerWidth` / `window.innerHeight` sınırlarını aşarsa otomatik içeri kıvrılır (viewport clamping).
- **3 Bağlam Modu:**
  1. **Tekil Öğe Menüsü** (seçili tek dosya/klasör): Aç / Önizle, (CAD ise) Motor V2 ile Aç, İndir (dosya), Süreli Link Oluştur, Yeniden Adlandır (`F2`), Taşı (`M`), Kes (`Ctrl+X`), Kopyala (`Ctrl+C`), Yıldızla / Kaldır (`S`), Detaylar (`I`), Ayırıcı, Çöp Kutusuna At (`Del`).
  2. **Çoklu Seçim Menüsü** (seçili öğelerden birine sağ tıklandığında seçim BOZULMADAN): `"N öğe seçili"` başlığı, İndir (dosya varsa), Süreli Link Oluştur, Taşı, Kes, Kopyala, Yıldızla / Yıldızı Kaldır, Çöp Kutusuna At.
  3. **Boş Alan Menüsü** (boş alana sağ tık): Yeni Klasör (`Shift+N`), Dosya Yükle (`Ctrl+U`), Klasör Yükle (destekliyorsa), Yapıştır (`Ctrl+V` — pano doluysa aktif), Tümünü Seç (`Ctrl+A`), Görünüm Değiştir (`V`), Yenile (`R`).
- **Kapanma & Erişilebilirlik:** `role="menu"`, öğelerde `role="menuitem"`, `ArrowUp`/`ArrowDown`/`Enter`/`Escape` desteği, dışarı tıklayınca veya scroll başlayınca kapanır.

---

## 4. Gerçek Kopyala / Yapıştır (`POST /api/dokumantasyon/bulk/copy`)

- **Endpoint:** `src/app/api/dokumantasyon/bulk/copy/route.ts`
- **Güvenlik:** `requireDokumantasyonAdmin()`, `assertSameOriginForMutation(request)`, `assertDurableDokumantasyonRuntime(true)`.
- **Girdi:** `{ items: Array<{ id: string; type: "file" | "folder" }>, targetFolderId: string | null }` (max 250 öğe).
- **Davranış:**
  - **Dosya kopyalama:**
    - Hedef klasörde aynı isim varsa akıllı çakışma çözümü uygular: `plan.dwg` → `plan (Kopya).dwg` → `plan (Kopya 2).dwg`.
    - Local modda (`.data` / `DOK_LOCAL_DATA_DIR`) fiziksel dosya kopyalanır ve yeni UUID ile DB kaydı oluşturulur.
    - Durable modda (`Neon + Vercel Blob`) `@vercel/blob` `copy()` (veya yeni pathname'e kopya) + yeni `dok_files` satırı oluşturulur.
  - **Klasör kopyalama:**
    - Döngüsel kopyalama (bir klasörü kendi içine veya alt klasörüne kopyalama) reddedilir (`CIRCULAR_COPY`).
    - Alt klasörler ve içindeki dosyalar özyinelemeli olarak (maksimum derinlik/öğe korumasıyla) klonlanır.
- **Sonuç Formatı:** `BulkResult` ile birebir uyumlu `{ succeeded: string[], failed: BulkFailureItem[] }`.
- **İstemci Pano Çubuğu (`clipboard-bar.tsx`):** Pano doluyken çalışma alanının üstünde/altında ince animasyonlu şerit görünür: `"2 öğe kesildi — Hedef klasöre gidip Yapıştır'a basın"` + `[Buraya Yapıştır (Ctrl+V)]` + `[İptal]`. Kesilmiş öğeler listede/kartta `opacity-60 border-dashed` görünür.

---

## 5. Breadcrumb Sürükle-Bırak & Detay/Etkinlik Çekmecesi

- **Breadcrumb Drop Hedefi:** Her breadcrumb öğesi (`Kök Dizin` dahil, mevcut klasör hariç) `registerFolderDropTarget` ile bırakma hedefi yapılır. Kullanıcı bir dosyayı veya seçili öğeleri yukarıdaki bir üst klasör adına sürükleyip bırakarak anında üst klasöre taşıyabilir!
- **Detay Çekmecesi (`drive-details-drawer.tsx`):**
  - 2 sekme: **Bilgi** ve **Etkinlik** (`/api/dokumantasyon/activity`).
  - **Bilgi sekmesi durumları:**
    - 0 seçim → Mevcut klasör adı, toplam öğe/boyut, dosya tür dağılım çubuğu (CAD/PDF/Görsel/Diğer).
    - 1 seçim → İkon, tam ad, uzantı, boyut, oluşturulma/değiştirilme, son açılma, yıldız durumu + hızlı eylemler (Önizle, İndir, Paylaş, Adlandır, Taşı, Sil).
    - >1 seçim → Seçili N öğe (X klasör, Y dosya), toplam boyut + toplu aksiyon butonları.
  - **Etkinlik sekmesi:** Son yükleme, adlandırma, taşıma, çöp, geri yükleme ve paylaşım olaylarını ikon + göreli zamanla listeler; yenileme butonu içerir.
- **Oturum Çıkışı (`admin-shell.tsx`):** Sağ üstteki `admin` kullanıcı rozeti küçük bir `DropdownMenu`'ye dönüştürülür (veya yanında zarif **Çıkış** ikonu bulunur) → `POST /api/dokumantasyon/cikis` çağırıp sayfayı yeniler (`router.refresh()`).

---

## 6. Modal Sertleştirme Özeti

| Modal | Kesin Düzeltmeler |
|---|---|
| `OverlayPortal` | Tek kapatma düğmesi kuralı; modalların içindeki duplike `<X />` düğmeleri temizlenir. |
| `WorkspaceFilterSheet` | `OverlayPortal` içine taşınır; `medium` = `5–100 MB`, `large` = `100 MB üstü`; `scope` gerçek çalışır; canlı eşleşen öğe bilgisi veya anlık uygulama. |
| `NewFolderModal` | Kapanışta `name` & `error` sıfırlanır; `onCreatedFolder(tempId, folder)` doğru `tempId` ile takas yapar; Toast + `.itemSuccessFlash`. |
| `RenameModal` | Açılışta dosya adında uzantı hariç gövde otomatik seçilir (`setSelectionRange(0, dotIndex)`). |
| `MoveModal` | Hiyerarşik girintili klasör ağacı + klasör arama kutusu + Toast. |
| `SearchModal` | `AbortController`, `ArrowUp/Down/Enter` klavye seçimi, dosya için ikili buton (`Önizle` + `Klasöre Git`), tür filtre çipleri, eşleşme vurgusu. |
| `TrashModal` | `window.confirm` kaldırılır → satır içi 2 adımlı onay; gerçek `FileTypeIcon` (uzantı `item.name`'den çözülür); çoklu checkbox seçimi + `Seçilenleri Geri Yükle` (`executeBulkRestore`) + `Seçilenleri Kalıcı Sil`; Toast. |
| `CreateShareModal` | Açılışta tüm form alanları sıfırlanır; özel tarih geçmiş tarihse Türkçe doğrulama uyarısı. |
| `ActiveSharesModal` | `window.confirm` kaldırılır → satır içi 2 adımlı iptal onayı; durum filtre sekmeleri (`Tümü / Aktif / Süresi Doldu / İptal`); QR açıkken `Escape` yalnız QR'ı kapatır. |
| `UploadProgressToast` | Aktif öğelerde `İptal Et` (`uploadManager.cancel(id)`), hatalı öğelerde `Tümünü Tekrar Dene` (`uploadManager.retryFailed()`); tamamlandığında Toast bildirimi. |
