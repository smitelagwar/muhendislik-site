# 01 — Gerçek Kod Denetimi: Doğrulanan Hatalar, Ölü Kontroller ve Eksikler Defteri

Bu defter, `/dokumantasyon` kaynak kodunun satır satır incelenmesiyle **doğrudan kanıtlanmış** 22 gerçek sorunu ve kesin çözüm şartını listeler. Uygulayıcı ajan (Hydrogen Medium) hiçbirini atlamadan tek tek kapatır ve her kapanışı `05-UYGULAMA-DURUMU.md` dosyasına kanıtıyla işler.

---

## A. Kritik İşlevsel Hatalar (Çalışmayan / Yanlış Çalışan Özellikler)

### BUG-01 — "Kapsam: Tüm klasörler" (`scope: "all"`) Tamamen Ölü Kontrol
- **Kanıt:**
  - `src/components/dokumantasyon/workspace-filter-sheet.tsx` satır 87–91 kullanıcıya `"current"` ("Bu klasör") ve `"all"` ("Tüm klasörler") seçtirir.
  - `src/app/api/dokumantasyon/items/route.ts` satır 74 `searchParams.get("scope") === "all"` parametresini destekler.
  - **Ancak** `src/components/dokumantasyon/drive-v3/query-client.ts` (`DokItemsKeyParams`, `useDokItemsQuery`) ve `src/components/dokumantasyon/file-manager.tsx` satır 174–199 `workspaceFilters.scope` parametresini **ASLA API'ye ve queryKey'e göndermez!**
- **Sonuç:** "Tüm klasörler" seçildiğinde yalnızca ekranda çip görünür, alt klasörlerdeki dosyalar hiç gelmez.
- **Kesin Çözüm:** `scope` parametresi `DokItemsKeyParams`, `dokKeys.items`, `useDokItemsQuery` ve `fetchDokItems` içine eklenir (`scope="all"` ise `url.searchParams.set("scope", "all")` — dikkat: `fetchDokItems` satır 73'teki `v !== "all"` kontrolü `scope` için istisna yapılmalıdır, yoksa `"all"` yutulur!).

### BUG-02 — `sortOrder` vs `order` ve `sortBy="type"` API Parametre Uyuşmazlığı
- **Kanıt:**
  - `query-client.ts` satır 125 `queryParams.sortOrder = sortOrder` gönderir.
  - `items/route.ts` satır 68 `searchParams.get("order")` bekler (`sortOrder` yok sayılır, hep `ASC` döner!).
  - `items/route.ts` satır 67 `sortBy` enum'u yalnızca `["name", "date", "size"]` kabul eder; `"type"` sessizce `"name"`'e düşer.
- **Kesin Çözüm:** Client `order` gönderir, API hem `order` hem geriye dönük `sortOrder` okur; API `sortBy` enum'una `"type"` eklenir ve uzantıya göre sıralama desteklenir.

### BUG-03 — `type: "other"` ("Diğer") Filtresi İstemcide Bozuk ve `.dwf` Tutarsız
- **Kanıt:**
  - `workspace-filter-sheet.tsx` satır 71 `"other"` sunar; `items/route.ts` satır 29 `"other"` filtreler (ama `.dwf`'yi CAD saymaz!).
  - `explorer-derive.ts` satır 98–112 `"cad"`, `"pdf"`, `"image"` kontrol eder ama `"other"` kolu **hiç yoktur**! Ayrıca `.dwf` istemcide CAD sayılırken sunucuda `other` sayılır.
- **Kesin Çözüm:** Sunucu ve istemci için tek paylaşılan tür sınıflandırıcı yardımcı fonksiyon (`src/lib/dokumantasyon/file-categories.ts`) yazılır:
  - `cad`: `dwg`, `dxf`, `dwf`
  - `pdf`: `pdf`
  - `image`: `png`, `jpg`, `jpeg`, `webp`, `svg`, `gif`
  - `other`: yukarıdakilerin dışındaki tüm uzantılar (örn. `.md`, `.xlsx`, `.docx`, `.zip`, `.txt`).

### BUG-04 — Boyut Filtresi Eşik Uyuşmazlığı (50–100 MB Dosyalar Kayboluyor!)
- **Kanıt:**
  - `workspace-filter-sheet.tsx` satır 83 ve `items/route.ts` satır 43–45: `small < 5 MB`, `medium = 5–100 MB`, `large >= 100 MB`.
  - `explorer-derive.ts` satır 128–130: `medium = 5–50 MB`, `large > 50 MB`!
- **Sonuç:** 75 MB'lık bir dosya için sunucu `medium` cevabında dosyayı döner, istemci `deriveExplorerView` onu 50 MB üstü diye eler → dosya **hem Orta hem Büyük filtrede sıfır görünür!**
- **Kesin Çözüm:** Tek paylaşılan sabit (`FILE_SIZE_THRESHOLDS`: `SMALL_MAX = 5 MB`, `LARGE_MIN = 100 MB`) hem sunucuda hem istemcide kullanılır. Ayrıca boyut filtresi etkinken klasörlerin gizlenmesi (sunucuyla birebir uyum) garanti edilir.

### BUG-05 — Tarih Sıralama/Filtreleme `created_at` Kullanıyor ama Tablo `updated_at` ("Değiştirilme") Gösteriyor
- **Kanıt:**
  - `file-manager.tsx` satır 1184, 1325, 2431: `"Değiştirilme"` başlığı altında `formatDate(item.updated_at || item.created_at)` gösterir.
  - `explorer-derive.ts` satır 50, 67, 115, 202 ve `items/route.ts` satır 35, 54 yalnızca `created_at` kullanır!
- **Kesin Çözüm:** Tarih sıralama, filtreleme ve gruplamanın tamamı tutarlı biçimde `item.updated_at || item.created_at` (ve `recent` koleksiyonunda `last_opened_at`) kullanır.

### BUG-06 — Masaüstü Sağ Tık Bağlam Menüsü Hiç Açılmıyor
- **Kanıt:**
  - `file-manager.tsx` satır 1139, 1268, 1441, 1573 `onContextMenu` olayı yalnızca `handleItemContextMenu` (seçim güncelleme) çağırır ve `preventDefault()` yapar; ekranda **hiçbir bağlam menüsü bileşeni render edilmez!**
  - Boş alana sağ tıklandığında da hiçbir menü açılmaz.
- **Kesin Çözüm:** `src/components/dokumantasyon/drive-v3/context-menu.tsx` ile tekil öğe, çoklu seçim ve boş alan için eksiksiz, klavyeyle gezilebilir, viewport sınırlarına taşmayan, `CommandRegistry` güdümlü sağ tık menüsü eklenir. (Touch/pen contextmenu yasağı korunur.)

### BUG-07 — `Ctrl+C` + `Ctrl+V` (Kopyala/Yapıştır) Sahte No-Op Stub
- **Kanıt:**
  - `file-manager.tsx` satır 800–811: `mode === "cut"` taşıma yapar, ancak `else` (`mode === "copy"`) yalnızca `await refetchItems();` çağırır — hiçbir şey kopyalamaz, hiçbir mesaj göstermez!
  - Ayrıca kesilen/kopyalanan öğeler için ne görsel pano çubuğu ne de kesilmiş öğe soluklaştırması vardır.
- **Kesin Çözüm:** `POST /api/dokumantasyon/bulk/copy` gerçek API endpoint'i + `executeBulkCopy` istemci motoru + görünür `ClipboardBar` + kesilmiş öğelerde `opacity-60 border-dashed` görseli + Toast bildirimi.

### BUG-08 — Klasör Seçiliyken Selection Dock "Paylaş" Butonu Sessizce Çalışmıyor
- **Kanıt:**
  - `command-registry.ts` satır 213: `share` komutunun `canExecute` koşulu `ctx.selectedItems.some((i) => i.type === "file" && !i.pending)` şartını arar!
  - Oysa backend `/api/dokumantasyon/shares` klasör paylaşımını destekler (satır menüsündeki "Link Oluştur" çalışır).
- **Sonuç:** Yalnızca 1 veya daha fazla klasör seçip alt dock'taki **Paylaş** butonuna basınca hiçbir şey olmaz!
- **Kesin Çözüm:** `share` komutunun `canExecute` koşulu `ctx.selectedItems.length >= 1 && ctx.selectedItems.every((i) => !i.pending) && !ctx.isTrashView && !ctx.isPendingOperation` olarak düzeltilir.

### BUG-09 — `NewFolderModal` Pending Klasör Takasında Yanlış ID Hatası
- **Kanıt:**
  - `file-manager.tsx` satır 2740–2742: `replacePendingFolderInCache(dokQueryClient, currentQueryKey, serverFolder.id, serverFolder)` — `tempId` yerine `serverFolder.id` gönderildiği için `pending:...` geçici klasörü cache'de asla eşleşmez!
- **Kesin Çözüm:** `onCreatedFolder(tempId, serverFolder)` imzasıyla gerçek `tempId` geçirilir ve yeni oluşturulan klasöre kısa `.itemSuccessFlash` uygulanır.

### BUG-10 — 6 Komut `CommandRegistry`'ye Hiç Kaydedilmemiş + 10+ Klavye Kısayolu Eksik
- **Kanıt:**
  - `command-registry.ts` içinde tanımlı `upload-folder`, `restore`, `delete-forever`, `change-sort`, `open-trash`, `open-active-shares` komutları `file-manager.tsx` içinde `registry.register(...)` edilmemiştir.
  - `executeBulkStar` import edilmiş (satır 74) ama kullanılmamış; `star`/`unstar` komutları tek tek sıralı HTTP çağrısı yapan `for` döngüsü kullanıyor!
  - `DOK_DRIVE_V3_COMMAND_MATRIX.md` kısayollarından `Shift+N`, `Ctrl+U`, `Space`/`P`, `M`, `S`, `Alt+S`, `V`, `I`, `Ctrl+D`, `Ctrl+A` (global viewport dışı) ve `?` (kısayol yardımı) bağlı değildir.
- **Kesin Çözüm:** 27 komutun tamamı `CommandRegistry`'ye kaydedilir; `star`/`unstar` `executeBulkStar` kullanır; çakışmasız klavye kısayol haritası tek merkezi dinleyicide uygulanır.

---

## B. Arayüz, Senkronizasyon ve Modal Hataları

### BUG-11 — Bilgi Çekmecesi (`Info` / `i` Butonu) Seçim Yokken Boş/Bozuk Görünüyor
- **Kanıt:** `file-manager.tsx` satır 2206 `isDetailsOpen = true` yapar ve buton amber yanar; ama `drive-details-drawer.tsx` satır 40 `if (!selectedItem) return null;` döndürdüğü için ekranda hiçbir panel açılmaz!
- **Kesin Çözüm:** `isDetailsOpen` açıkken:
  - 0 öğe seçiliyse → **Mevcut Klasör Özeti** (klasör adı, öğe/boyut dağılımı, kategori pasta/barı) + **Son Etkinlikler** sekmesi (`/api/dokumantasyon/activity`) gösterilir.
  - 1 öğe seçiliyse → Öğe Detayları + hızlı aksiyonlar + versiyon/meta bilgileri.
  - >1 öğe seçiliyse → **Çoklu Seçim Özeti** (N dosya + M klasör, toplam boyut, toplu Paylaş/Taşı/Yıldızla/İndir/Sil düğmeleri).

### BUG-12 — Sol Kenar Çubuğu Sayaçları ve Depolama Kartı Filtrelerde Yanlış Sayı Gösteriyor
- **Kanıt:** `file-manager.tsx` satır 1782–1785 `files.length`, `folders.length`, `totalSizeBytes` o anki klasör/filtre sonucundan hesaplanır. Bir alt klasöre girince veya PDF filtresi seçince "Tüm Dosyalarım" ve "Depolama" rakamları yanlışça küçülür veya 0 olur.
- **Kesin Çözüm:** `GET /api/dokumantasyon/items` cevabındaki `summary` nesnesi tüm çalışma alanı toplamlarını döner (`totalFiles`, `totalFolders`, `totalSizeBytes`, `starredCount`, `trashCount`, `activeSharesCount`, `categoryCounts: { cad, pdf, image, other }`). Kenar çubuğu her zaman gerçek çalışma alanı özetini gösterir; mevcut klasör sayısı ise durum çubuğunda gösterilir.

### BUG-13 — Sol Menü Filtreleri, Filtre Sayfası ve "Kök Dizin" Breadcrumb Birbiriyle Çakışıyor
- **Kanıt:**
  - `handleNavigationFilter("recent")` eski `workspaceFilters.starredOnly` veya `type` değerini temizlemez.
  - `handleNavigationFilter("starred")` eski `type` filtresini gizlice korur.
  - Breadcrumb `"Kök Dizin"` tıklaması (`file-manager.tsx` satır 1850) yalnızca `setActiveFilter("all")` çağırır, `workspaceFilters`'ı sıfırlamaz.
  - `WorkspaceFilterSheet`'ten `type: "pdf"` seçildiğinde sol kenar çubuğu hâlâ `"Tüm Dosyalarım"` aktif gösterir.
- **Kesin Çözüm:** Tek normalize edilmiş filtre durum makinesi (`syncNavAndWorkspaceFilters`); sol menü, filtre penceresi, üst çip çubuğu ve mobil ayar paneli aynı tek kaynaktan türetilir.

### BUG-14 — `WorkspaceFilterSheet` `OverlayPortal` Kullanmıyor
- **Kanıt:** `workspace-filter-sheet.tsx` satır 47 ham `fixed inset-0` render ediyor; derin scroll ve `isolation: isolate` altında kırpılma ve odak tuzağı (focus trap) eksikliği riski taşır.
- **Kesin Çözüm:** `OverlayPortal` içine alınır (`presentation="dialog"` masaüstünde, `"sheet"` mobilde).

### BUG-15 — Tüm Modallarda Çift Kapatma (`×`) Düğmesi
- **Kanıt:** `OverlayPortal` satır 40 her modalın sağ üstüne `<Dialog.Close><X /></Dialog.Close>` eklerken, `NewFolderModal`, `RenameModal`, `MoveModal`, `DeleteConfirmModal`, `SearchModal`, `TrashModal`, `CreateShareModal`, `ShareResultModal`, `ActiveSharesModal` dosyalarının hepsi kendi başlık satırında İKİNCİ bir `<X />` butonu daha basar!
- **Kesin Çözüm:** `OverlayPortal` içindeki kapatma düğmesi tek yetkili yapılır (veya `showCloseButton?: boolean` prop'u ile modal başlığındaki hizalı kapatma korunur; hiçbir modalda 2 adet `×` düğmesi bulunmaz).

### BUG-16 — `TrashModal` ve `ActiveSharesModal` Tarayıcı `window.confirm()` Kullanıyor + İkon Hatası
- **Kanıt:**
  - `trash-modal.tsx` satır 79 `confirm(...)` çağırır; satır 211 her dosya için `getFileIcon("", "")` basar (yanlış jenerik ikon!).
  - `active-shares-modal.tsx` satır 124 `confirm(...)` çağırır; satır 288 QR alt modalı açıkken `Escape` tüm modalı kapatır.
- **Kesin Çözüm:** Satır içi 2 adımlı onay butonları ("Emin misiniz? Onayla / Vazgeç"), gerçek `FileTypeIcon` uzantı tespiti (`name`'den uzantı çıkarımı), QR alt katmanında katmanlı Escape yönetimi, `TrashModal`'da çoklu seçim + `executeBulkRestore` / toplu kalıcı silme.

### BUG-17 — `SearchModal` Yarış Durumu, Eksik Dosya Açma ve Klavye Navigasyonu
- **Kanıt:** `search-modal.tsx` satır 45 `AbortController` kullanmıyor; dosya sonucuna tıklamak dosyayı açmak yerine sadece klasörüne gidiyor; ok tuşları (`ArrowDown`/`ArrowUp`/`Enter`) desteklenmiyor.
- **Kesin Çözüm:** `AbortController`, klavye navigasyonu, her dosya satırında birincil "Önizle / Aç" + ikincil "Klasörüne Git" aksiyonu, arama içi tür filtre çipleri (Tümü / CAD / PDF / Görsel) ve Türkçe vurgulu eşleşme (highlight).

### BUG-18 — `MoveModal` Düz Liste Gösteriyor (Aynı İsimli Alt Klasörler Ayırt Edilemiyor)
- **Kanıt:** `move-modal.tsx` satır 169–183 tüm klasörleri girintisiz düz liste olarak basar; arama kutusu yoktur.
- **Kesin Çözüm:** Parent-child ağaç inşası (`depth` girintisi + üst yol ipucu, örn. `1_kisim / Statik`) + canlı klasör filtreleme arama kutusu.

### BUG-19 — `CreateShareModal` ve `NewFolderModal` Kapanınca Eski Form Verisini Sıfırlamıyor
- **Kanıt:** `create-share-modal.tsx` satır 39–47 `isOpen` false/true geçişinde `title`, `password`, `maxDownloads`, `duration`, `error` resetlemez; `new-folder-modal.tsx` de `name` ve `error` resetlemez.
- **Kesin Çözüm:** `useEffect` ile modal açılışında temiz state başlatılır.

### BUG-20 — Türkçe Karakterlerde Büyük/Küçük Harf Arama Bozulması (`İ/ı/I/i`)
- **Kanıt:** `explorer-derive.ts` satır 91–94 `.toLowerCase()` kullanır; `"İnşaat".toLowerCase()` ile `"insaat"` / `"İNŞAAT"` eşleşmez.
- **Kesin Çözüm:** `normalizeTrSearch()` yardımcı fonksiyonu (`toLocaleLowerCase("tr")` + combining dot temizliği).

### BUG-21 — Gruplu Görünüm Eksikleri (Katlanamaz, Duplike Başlık, Marquee Kayması, Bölünmüş Grid)
- **Kanıt:**
  - `file-manager.tsx` satır 2465–2534 her grup için tüm seçimi etkileyen sahte tablo başlığı basar, gruplar daraltılıp açılamaz, grup bazlı "Bu grubu seç" yoktur.
  - `file-manager.tsx` satır 2592–2612 aynı tarih grubunda klasörleri ve dosyaları iki ayrı grid'e böler.
  - `use-drive-selection.ts` satır 212–223 gruplu görünümde düz `hitTestList`/`hitTestGrid` çalıştırdığı için grup başlık yükseklikleri kadar kayma oluşur.
- **Kesin Çözüm:** Tek birleşik katlanabilir grup başlıkları (`Aç/Kapat` + grup içi öğe sayısı + grup boyutu + `Bu grubu seç`), gruplu modda DOM tabanlı kesin marquee kesişimi, tarih grubunda tek akışlı grid.

### BUG-22 — Üst Araç Çubuğunda Görünmez 40px Boşluk, Pasif Sıralama Okları, Çıkış Butonu Eksikliği & Sessiz Mutasyonlar
- **Kanıt:**
  - Ekran görüntüsünde de net görüldüğü gibi `file-manager.tsx` satır 1969 `invisible pointer-events-none` nedeniyle `Tümünü Seç` ile `Sırala` arasında boş bir delik oluşur.
  - Tablo sütun başlıkları (`İsim`, `Boyut`, `Değiştirilme`) hangi sütunun hangi yönde sıralı olduğunu göstermez.
  - `admin-shell.tsx` içinde `admin` rozeti statiktir; `/api/dokumantasyon/cikis` olmasına rağmen **Çıkış Yap** butonu yoktur.
  - Yıldızlama, taşıma, adlandırma, kopyalama, kesme, silme, paylaşım linki kopyalama işlemlerinde `useToast()` hiç kullanılmaz.
  - `UploadProgressToast` içinde çalışan yüklemeyi **İptal Et** ve toplu **Hatalıları Tekrar Dene** butonları eksiktir (oysa `UploadQueueManager.cancel` ve `retryFailed` zaten yazılmıştır!).
- **Kesin Çözüm:** Tüm bu eksikler F2, F4 ve F5 fazlarında sıfır pürüzle kapatılır.
