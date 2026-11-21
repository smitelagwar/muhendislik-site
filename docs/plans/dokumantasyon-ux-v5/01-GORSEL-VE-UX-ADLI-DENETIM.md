# 01 — Görsel, Ergonomik ve Mimari Adli Denetim (`V5-01` .. `V5-18`)

> **Kanıt Kaynağı:** Canlı üretim ekran görüntüsü (`https://muhendislik-site.vercel.app/dokumantasyon`, Dark tema, 28/28 öğe seçili) + `src/components/dokumantasyon/*` satır-satır kaynak kod incelemesi (2026-11-21).

---

## 1. Kritik Görsel & Seçim Kusurları (Ekran Görüntüsünde Doğrudan Yakalananlar)

### `V5-01` — Seçili Liste Satırlarının "Çift Turuncu Kafes" Görünümü (KRİTİK)
- **Mevcut Kod:**
  - `src/components/dokumantasyon/dok-workspace.module.css:585-590`: `.virtualCardSelected` ve `.virtualRowSelected` aynı kuralda birleşik: `border-color: rgba(245, 158, 11, 0.8) !important; background-color: rgba(245, 158, 11, 0.08) !important; box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4), inset 0 0 12px rgba(245, 158, 11, 0.06);`
  - `src/components/dokumantasyon/file-manager.tsx:1571, 1745`: Üstüne bir de `bg-amber-500/15 border-l-2 border-amber-500` ekleniyor.
- **Sorun:** Tüm satırlar seçildiğinde her satırın üstünde ve altında çift turuncu çizgi + parlama oluşuyor; dosya isimleri görsel gürültü içinde boğuluyor, seçili/odaklı ayrımı kayboluyor.
- **V5 Çözümü:** `.virtualRowSelected` kuralı `.virtualCardSelected`'dan ayrılır. Liste satırında 4 kenarlı turuncu çerçeve ve `box-shadow` kafesi tamamen kalkar; yerine sakin yarı saydam dolgu + sol kenarda `3px` net amber şerit (`inset 3px 0 0 0 #f59e0b`) + çok hafif alt ayraç gelir. `.virtualCardSelected` ise kartlar arası boşluk olduğu için zarif amber çerçevesini (`border-color: rgba(245, 158, 11, 0.8)`) korur (Stage 8 uyumlu).

### `V5-02` — İçi Boş, Düşük Kontrastlı Checkbox ve Eksik Kısmi Seçim (`Indeterminate`)
- **Mevcut Kod:** `file-manager.tsx:1582-1586, 1756-1760, 1974-1978, 2110-2114, 2996-3000`
- **Sorun:** Lucide `CheckSquare` içi boş turuncu çerçeveli çizgi ikonudur; koyu zeminde bir bakışta seçili olup olmadığı anlaşılmaz. Ayrıca 28 öğeden 5'i seçiliyken tablo başlığındaki ve grup başlığındaki kutu hâlâ boş `Square` gösterir (`indeterminate` / `—` durumu yoktur).
- **V5 Çözümü:** Özel `<DriveCheckbox checked indeterminate />` bileşeni: seçiliyken **dolu amber zemin (`bg-amber-500`) + yüksek kontrastlı koyu tik (`text-zinc-950`, kalın stroke)**; kısmi seçimde **dolu amber zemin + yatay çizgi (`Minus`)** ve `aria-checked="mixed"`. Hiçbir öğe seçili değilken satır checkbox'ları sakin (`opacity-40 group-hover:opacity-100`), ilk seçimle birlikte tüm satırlarda `%100` belirginleşir.

### `V5-03` — 4 Yerde Mükerrer Seçim Bilgisi ve Kafa Karıştıran "Kaldır / Temizle / Kırmızı Çöp 28"
- **Mevcut Kod:**
  - `file-manager.tsx:2474-2494` (`Seçimi Kaldır 28` üst çubukta)
  - `file-manager.tsx:2773-2787` (sağ üstte kırmızı `[Trash 28]` — ekran görüntüsünde Çöp Kutusu 58 sanılacak kadar kafa karıştırıcı!)
  - `file-manager.tsx:3340-3451` (alt dock'ta hem `Kaldır` hem `Temizle` yan yana, Kopyala/Kes eksik!)
  - `workspace-status-bar.tsx:85-98` (en altta tekrar `28 öğe seçili · 23.4 MB`!)
- **Sorun:** Kullanıcı hangi butona basacağını şaşırıyor; aynı bilgi 4 farklı stile bölünmüş, üst araç çubuğu gereksiz kırmızı tehlike ikonuyla kirlenmiş.
- **V5 Çözümü:**
  - Üst araç çubuğundaki tekrar eden kırmızı `[Trash N]` butonu kaldırılır.
  - Masaüstünde seçim yapıldığında zarif **Yüzen Seçim Kapsülü (`SelectionDock`)** açılır: `[×]` + `N seçili (MB)` + `Tümünü Seç` + `Tersine Çevir` | `İndir` · `Yıldızla` · `Kopyala` · `Kes` · `Taşı` · **`Paylaş`** · `Sil`. Çift `Kaldır`/`Temizle` karmaşası biter.
  - Seçim dock'u görünürken Status Bar'daki mükerrer seçim hapı gizlenir.
  - Mobilde (`<=1023px`) mevcut 3-eylemli statik `mobileSelectionBar` sözleşmesi birebir korunur.

### `V5-04` — Üst Başlık (`Dokümantasyon Modülü`) Kesilmesi ve Çift Scrollbar
- **Mevcut Kod:** `admin-shell.tsx:93, 112-117`, `file-manager.tsx:2260` (`lg:h-[calc(100dvh-10rem)]`)
- **Sorun:** Masaüstünde `DokumantasyonAdminShell` sabit ekran yüksekliğine oturtulmadığı için `SiteShell` üstündeki sticky `Navbar` + `Dokümantasyon Modülü` kartı + `100dvh-10rem` workspace toplamı `100dvh`'yi aşıyor; kullanıcı sayfayı birkaç piksel kaydırdığında `Dokümantasyon Modülü` kartının üst yarısı sticky navbar'ın altında kesiliyor (ekran görüntüsünde açıkça görülüyor!).
- **V5 Çözümü:** `admin-shell.tsx` masaüstünde kompakt tek satır üst şerit (`py-2 px-4`, ~50px) ve `lg:h-[calc(100dvh-var(--dok-app-header-height,4.5rem))] lg:overflow-hidden` cockpit kapsayıcısı kullanır; `managerSlot` `flex-1 min-h-0` ile kalan alanı tam doldurur. Sıfır çift scrollbar, sıfır kesik başlık!

---

## 2. Araç Çubuğu, Filtre ve Sol Kenar Çubuğu Kusurları

### `V5-05` — 14 Kontrollü Sıkışık Araç Çubuğu + İki Ayrı Arama Kutusu + Ölü `…` Breadcrumb
- **Mevcut Kod:** `file-manager.tsx:2359-2802`
- **Sorun:**
  - Tek satırda 14 buton/input birikiyor; 1280px–1440px ekranlarda sıkışıp iki satıra sarıyor.
  - `Listede süz...` ve `Ara... /` yan yana iki farklı arama kutusu gibi duruyor; kullanıcı farkını anlamıyor.
  - `Yükle`, `Klasör`, `Yeni Klasör` hem sol sidebar'da hem üst araç çubuğunda tekrar ediyor.
  - Uzun klasör yolunda (`breadcrumbs.length > 4`, satır 2433) ortadaki `…` tıklanamaz ölü `<span>`!
  - Klasör geçmişi için `← Geri` / `→ İleri` düğmeleri yok.
- **V5 Çözümü:**
  - Temiz 3 bölgeli `ExplorerToolbar`:
    1. Sol: `←` / `→` geçmiş butonları (`Alt+←/→`) + Breadcrumb (tıklanabilir `…` dropdown menüsü ile gizlenen tüm üst klasörlere tek tık erişim!).
    2. Orta: Birleşik akıllı süzgeç kutusu (`Listede süz...`) + içinde sağda `Ctrl+K` rozetli **"Tüm Drive'da Ara / Komutlar"** tetikleyicisi.
    3. Sağ: `Sırala`, `Grupla`, `Filtre` (rozetli), kompakt `+ Yeni` açılır/split eylemi (`Dosya Yükle` / `Klasör Yükle` / `Yeni Klasör`), Yoğunluk + `Liste/Grid` anahtarı, `Yenile`, `Bilgi (i)`.

### `V5-06` — `FilterChipsBar` Gerçek Bug'ı: `"week"` / `"month"` İngilizce Ham Anahtar Gösteriyor
- **Mevcut Kod:** `src/components/dokumantasyon/drive-v3/filter-chips-bar.tsx:42-46` vs `src/lib/dokumantasyon/file-categories.ts:125-127`
- **Sorun:** `DATE_LABELS` sözlüğünde anahtarlar `"7d"` ve `"30d"` yazılmış; oysa filtre state'i `"week"` ve `"month"` gönderiyor! Kullanıcı "Son 7 gün" seçtiğinde çipte `"Tarih: week"` yazıyor!
- **V5 Çözümü:** `DATE_LABELS` hem `"week"` / `"month"` (birincil) hem de geriye dönük `"7d"` / `"30d"` anahtarlarını destekler ve tek kaynak `file-categories.ts`'den beslenir.

### `V5-07` — Eksik "Belgeler & Tablolar" Kategorisi (`.md`, `.doc`, `.xls`, `.csv`)
- **Mevcut Kod:** `file-categories.ts:24`, `drive-sidebar.tsx:27, 236-300`, `items/route.ts`
- **Sorun:** Canlı ekranda 3 adet `.md` dosyası açıkça görünürken sol kenar çubuğunda yalnız AutoCAD, PDF ve Görseller var; belgeler/markdown/excel dosyaları için kategori filtresi yok (`other` içine kayboluyor).
- **V5 Çözümü:** `DokFileCategory` `"cad" | "pdf" | "image" | "document" | "other"` olarak genişletilir; `DriveSidebar`'da `Belgeler & Tablolar` (`.md/.txt/.docx/.xlsx/.csv/.json`) ve (varsa) `Diğer / Arşivler` kategori satırları sayaçlı görünür. Depolama barındaki her renk dilimine tıklayınca doğrudan ilgili kategori filtresi uygulanır!

### `V5-08` — Sidebar Hızlı Klasör Ağacı + Sürükle-Bırak Hedefleri + Canlı Çöp Rozeti
- **Mevcut Kod:** `drive-sidebar.tsx:303-346`, `src/app/api/dokumantasyon/folders/tree/route.ts` (API zaten mevcut!)
- **Sorun:** Alt klasörlere geçmek için sürekli ana listeden tek tek klasör açmak gerekiyor; ayrıca sürüklenen dosya sol kenar çubuğundaki `Çöp Kutusu`'na, `Yıldızlı Dosyalar`'a veya bir klasöre bırakılamıyor.
- **V5 Çözümü:**
  - Sol Sidebar'da açılıp kapanabilen kompakt **"Klasörler"** ağacı (`/api/dokumantasyon/folders/tree` ile beslenir, aktif klasör vurgulu).
  - Sidebar üzerindeki **Klasör düğümleri** (taşı), **`Yıldızlı Dosyalar`** (yıldızla) ve **`Çöp Kutusu`** (çöpe at) gerçek `@atlaskit/pragmatic-drag-and-drop` bırakma hedefleri (drop target) olur; üzerine sürüklenince canlı amber/kırmızı halka ile tepki verir!
  - `Çöp Kutusu` ve `Aktif Paylaşımlar` sayaç rozetleri `summary` API cevabıyla anlık güncellenir.

---

## 3. Kaçırılan Güç-Kullanıcı Özellikleri ("Aklıma Gelmeyen Kaliteli İşçilik")

### `V5-09` — Quick Look (`Space`) — Klasörden Çıkmadan Hızlı Önizleme & Galeri
- **Mevcut Durum:** Herhangi bir fotoğrafı, PDF'i veya `.md` notunu görmek için `/dokumantasyon/dosya/[id]` sayfasına gidip mevcut klasör, filtre, kaydırma ve seçim bağlamı kaybediliyor.
- **V5 Çözümü:** Seçili/odaklı öğede `Space` tuşuna basınca veya satırdaki `Hızlı Bakış` ikonuna tıklayınca açılan **Quick Look Overlay** (`quick-look-modal.tsx`):
  - Görseller: gerçek resim (`/api/dokumantasyon/files/[id]/stream`), `+`/`-`/sıfırla zoom, 90° döndür.
  - Markdown/Metin/JSON/CSV: temiz formatlı okuma + "İçeriği Kopyala".
  - PDF: hafif gömülü önizleme + "Tam Stüdyoda Aç" butonu.
  - CAD (DWG/DXF/DWF): **CAD altın motoruna dokunmadan** teknik özet kartı + "CAD Studio'da Aç" & "V2 Motor ile Aç" butonları.
  - `←` / `→` ok tuşlarıyla mevcut listedeki dosyalar arasında galeri gibi anında gezinme, `Esc` / `Space` ile kapanma.

### `V5-10` — Satır İçi Uzantı-Korumalı Yeniden Adlandırma (`F2` Inline Rename)
- **Mevcut Durum:** Her isim düzeltmesinde tam modal açılıyor ve tüm ad + uzantı seçildiği için kullanıcı yanlışlıkla `.pdf` / `.dwg` uzantısını silebiliyor.
- **V5 Çözümü:** Liste satırında `F2` basınca (veya satır hızlı eylemiyle) dosya adı yerinde `<input>`'a dönüşür; **yalnız uzantı öncesi taban ad seçilir** (örn. `beton-dokum-tutanagi` seçili, `.pdf` sabit korunur), `Enter` kaydeder, `Esc` iptal eder. (Grid görünümünde ve modal fallback'inde `RenameModal` çalışmaya devam eder.)

### `V5-11` — Geri Alınabilir İşlemler (Undo Toast + `Ctrl+Z`)
- **Mevcut Durum:** Yanlışlıkla çöpe gönderilen veya yanlış klasöre taşınan öğeyi geri almak için kullanıcının Çöp Kutusunu veya hedef klasörü elle bulması gerekiyor.
- **V5 Çözümü:** Çöpe atma, taşıma ve yeniden adlandırma işlemlerinden sonra 7 saniyelik **`[Geri Al]`** aksiyonlu bildirim gösterilir ve `Ctrl+Z` / `Cmd+Z` son geri alınabilir işlemi tetikler:
  - Çöp → `/api/dokumantasyon/bulk/restore`
  - Taşıma → `/api/dokumantasyon/bulk/move` (eski `parent_id`'lere dönüş)
  - Adlandırma → eski isme geri `PATCH`

### `V5-12` — Komut Paleti (`Ctrl+K` / `Cmd+K`)
- **Mevcut Durum:** Yalnız `SearchModal` (`/`) var; hızlı aksiyon ve navigasyon komutları klavyeden aranamıyor.
- **V5 Çözümü:** Linear / Raycast tarzı **`CommandPalette`** (`Ctrl+K`):
  - Tek arama çubuğunda **Dosyalar & Klasörler** + **Hızlı Komutlar** ("Yeni Klasör", "Dosya Yükle", "Liste / Kart Görünümü", "Türe Göre Grupla", "Çöp Kutusu", "Aktif Paylaşımlar", "Detay Çekmecesi", "Kısayollar") + **Son Açılanlar**.
  - `↑`/`↓` klavye gezintisi, `Enter` çalıştırma, `Esc` kapatma.

### `V5-13` — Grid Lazy Image Thumbnails & Zenginleştirilmiş Liste Sütunları
- **Mevcut Durum:** Grid'deki PNG/JPG/WEBP dosyaları gerçek görsel yerine yeşil generik ikon gösteriyor. Liste görünümünde `İsim` ile `Boyut` arasında büyük boşluk var, boyutlar sola yaslı düzensiz duruyor, dosya uzantı rozeti veya aktif paylaşım göstergesi yok.
- **V5 Çözümü:**
  - Grid'de görsel dosyalar (`png`, `jpg`, `jpeg`, `webp`, `gif`) için `cardIconStage` içinde zarif `loading="lazy"` gerçek küçük resim (`object-cover`, hata durumunda pürüzsüz `FileTypeIcon` fallback'i).
  - Liste satırında dengeli 12-kolon oranı: İsim + renkli mikro uzantı rozeti (`DWG`, `PDF`, `MD`, `PNG`), sağa hizalı `tabular-nums` Boyut, göreli zaman + tam tarih `title` tooltip'li Değiştirilme sütunu, yumuşak beliren İşlem hızlı eylemleri.

### `V5-14` — Liste Yoğunluğu (Sıkışık / Rahat) + `localStorage` Kalıcılık + URL Deep-Link
- **Mevcut Durum:** Alt klasördeyken sayfayı yenilemek (`F5`) kullanıcıyı Kök Dizin'e geri fırlatıyor! Görünüm/sıralama/gruplama tercihleri de yenilemede sıfırlanıyor.
- **V5 Çözümü:**
  - URL query senkronu (`?folder=<id>&filter=<f>&sort=<s:o>&group=<g>&view=<v>`) — F5 yenilemede ve tarayıcı Geri/İleri tuşlarında konum korunur.
  - Hydration-safe `localStorage` tercih deposu (`dok.prefs.v5`: `viewMode`, `density: "comfortable" | "compact"`, `detailsOpen`, `sidebarTreeOpen`).
  - Liste yoğunluğu: `Rahat (56px)` (varsayılan, mevcut testlerle uyumlu) ve `Sıkışık (44px)` — masaüstü `listVirtualizer` satır yüksekliği dinamik güncellenir.

### `V5-15` — Sistem Panosundan Ekran Görüntüsü / Dosya Yapıştırma (`Ctrl+V`)
- **Mevcut Durum:** İç pano boşken `Ctrl+V` hiçbir şey yapmıyor.
- **V5 Çözümü:** Kullanıcı ekran görüntüsü (Win+Shift+S) veya işletim sisteminden dosya kopyalayıp `/dokumantasyon` içinde `Ctrl+V` yaptığında (iç pano boşsa ve input odaklanmamışsa), `paste` olayından `clipboardData.files` yakalanır; isimsiz görseller `ekran-goruntusu-YYYYMMDD-HHmmss.png` adıyla mevcut klasöre otomatik yüklenir!

### `V5-16` — Warm Amber Glass Marquee & Canlı `+N Öğe` Sayacı
- **Mevcut Durum:** `file-manager.tsx:2878` Windows mavisi marquee (`border-blue-500/90 bg-blue-500/20`) Warm Engineering Amber temayla çelişiyor ve sürüklerken kaç öğe yakalandığını göstermiyor.
- **V5 Çözümü:** Tema uyumlu Warm Amber marquee (`border-amber-500/85 bg-amber-500/15`) + kutunun sağ alt köşesinde canlı **`N öğe`** rozeti.

### `V5-17` — Zenginleştirilmiş Detay Çekmecesi (`DriveDetailsDrawer`)
- **Mevcut Durum:** Görsel dosyalarda bile sadece ikon var; dosya yolu/iç link kopyalama yok; çoklu seçimde tür dağılımı yok; etkinlik sekmesindeki satırlar tıklanamıyor.
- **V5 Çözümü:**
  - Görsel dosyalarda canlı mini önizleme (`object-cover` + hata fallback).
  - Tek tıkla **"Stüdyo Linkini Kopyala"** + dosya MIME/uzantı & sürüm geçmişi bağlantısı (`/api/dokumantasyon/files/[id]/versions` özet sayısı varsa).
  - Çoklu seçimde tür bazlı dağılım barı (ör. `14 CAD · 10 PDF · 4 Klasör`).
  - Etkinlik sekmesinde öğeye tıklayınca ilgili dosyayı önizleme / klasöre odaklama aksiyonu.

### `V5-18` — `file-manager.tsx` Modüler Mimari Ayrıştırma
- **Mevcut Durum:** `file-manager.tsx` **3.664 satır** — tek dosyada toolbar, satır render, kart render, gruplu görünüm, selection dock, tüm modal bağlantıları ve 40+ state içiçe. Hem okunabilirlik düşük hem ajanların her okumada harcadığı token çok yüksek.
- **V5 Çözümü:** 7 temiz, tek sorumluluklu modül çıkarılır (`drive-checkbox.tsx`, `explorer-toolbar.tsx`, `explorer-row-card.tsx`, `selection-dock.tsx`, `quick-look-modal.tsx`, `command-palette.tsx`, `use-undo-toast.ts`); `file-manager.tsx` sade, okunabilir orkestratöre (~1.400 satır) iner.
