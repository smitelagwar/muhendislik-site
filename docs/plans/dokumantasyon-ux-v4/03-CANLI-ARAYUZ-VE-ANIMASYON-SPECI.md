# 03 — Canlı Arayüz, Mikro-Etkileşimler ve Animasyon Tasarım Şartnamesi

Kullanıcı geri bildirimi: *"biraz da canlı olsun arayüz. bu arayüz çok donuk ve etkileşimi az. animasyonlar vs. de eklemene izin veriyorum. her şeye izin veriyorum ama çalışacak her şey."*

Bu belge, **Dark Industrial + Warm Engineering Glass** kimliğini koruyarak (Light/Dark tam eşlik) arayüzü statik bir tablo görünümünden **canlı, dokunsal (tactile), anında geri bildirim veren, modern mühendislik çalışma alanına** dönüştürür.

---

## 1. Hareket İlkeleri ve Performans Koruması (Altın Kurallar)

1. **Tek Global Hareket Koruması:** `DokumantasyonFileManager` kökü `framer-motion` içinden `<MotionConfig reducedMotion="user">` ile sarılır. Kullanıcı işletim sisteminde hareket azaltma açtıysa tüm animasyonlar anında sıfır gecikmeli duruma geçer.
2. **Sanal Liste / Kart Kuralı (Stage 8 Static Gate Uyumu):**
   - `.virtualRow` ve `.virtualCard` üzerinde **ASLA** `framer-motion` (`motion.div`) kullanılmaz ve `will-change: transform, opacity;` yazılmaz.
   - Sanal satır ve kartların canlılığı **saf CSS GPU geçişleri** (`transform`, `opacity`, `background-color`, `border-color`, `box-shadow`, 150–200ms `cubic-bezier(0.22, 1, 0.36, 1)`) ile sağlanır. Bu sayede 5.000 öğede dahi 60 FPS sabit kalır ve `npm run check:dok-drive-v3:static` yeşil kalır.
3. **Kısa ve Amaca Yönelik Süreler:**
   - Mikro-tepkiler (buton press, yıldız pop, checkbox): `120–180ms`
   - Panel / menü / çekmece / dock geçişleri: `180–260ms` (spring: `stiffness: 420, damping: 32`)
   - Ambiyans ışık hareketi: `18–26s` çok yumuşak nefes/süzülme (yalnız masaüstü, `prefers-reduced-motion: reduce` altında `animation: none`).
4. **Sıfır Layout Shift (CLS = 0):** Hover aksiyonları, sıralama okları veya seçim dock'u açılırken satır yüksekliği (`56px`) veya sütun hizaları asla zıplamaz.

---

## 2. Somut Görsel ve Etkileşim İyileştirmeleri (12 Canlılık Katmanı)

### Katman 1 — Ambiyans ve Canlı Başlık (`admin-shell.tsx`)
- Masaüstündeki 3 sıcak amber/turuncu ambiyans ışık küresine çok hafif CSS `@keyframes dokOrbFloat` (18–26sn, `translate3d` + `scale(1 → 1.06)`) eklenir; sayfa cansız siyah/beyaz blok gibi durmaz, derinlik hissi kazanır.
- `Kalıcı Depolama (Neon + Blob)` veya `Yerel Geliştirme` rozetinin yanına canlı nefes alan minik yeşil/amber durum noktası (`animate-pulse` değil, özel yumuşak ring pulse — reduced-motion'da sabit nokta) eklenir.
- Modül ikonu (`FolderArchive`) hover'da hafif 3D tilt/parlama tepkisi verir.
- Sağ üst `admin` kullanıcı rozeti etkileşimli menüye dönüşür (`admin ▾` → Oturum bilgisi + **Çıkış Yap**).

### Katman 2 — Akıcı Sol Kenar Çubuğu (`drive-sidebar.tsx`)
- **Kayan Aktif Göstergesi (`layoutId="dok-sidebar-active-pill"`):** Gezinti öğeleri arasında geçiş yaparken (örn. *Tüm Dosyalarım* → *AutoCAD* → *PDF*) sıcak amber cam arka plan ve sol kenar parlama çubuğu zıplamak yerine akıcı biçimde kayar.
- **Canlı Kategori ve Yönetim Sayaçları:**
  - *AutoCAD (DWG / DXF)*, *PDF Dokümanları*, *Görseller & Fotoğraflar* yanında gerçek dosya sayısı rozetleri (`categoryCounts`).
  - *Aktif Paylaşımlar* yanında aktif link sayısı rozeti (0'dan büyükse canlı zümrüt/amber nokta).
  - *Çöp Kutusu* yanında silinmiş öğe sayısı rozeti (0'dan büyükse kırmızımsı küçük sayaç).
- **Görsel Depolama Dağılım Çubuğu:** Alt kısımdaki *Depolama* kartına kategori bazlı çok renkli ince ilerleme barı eklenir (Cyan = CAD, Kırmızı = PDF, Yeşil = Görsel, Gri/Amber = Diğer) — hover'da araç ipucuyla dağılım görünür.
- **CTA Mikro-Etkileşim:** *Yeni Dosya Yükle* butonunda hafif ışık süpürmesi (hover sheen) + `active:scale-[0.98]` dokunma tepkisi.

### Katman 3 — Akıllı, Boşluksuz Komut Çubuğu & Hızlı Süzgeç (`file-manager.tsx`)
- **40px Ölü Boşluğun Giderilmesi:** Seçim yokken görünmez yer kaplayan (`invisible`) kırmızı çöp butonu yerine, seçim yapıldığında `AnimatePresence` ile akıcı beliren veya üst barı sıkıştırmadan sağ tarafta tek bir temiz grup oluşturan düzen kurulur (çift tıklama koruması korunur: satır dikey konumu değişmez, çünkü üst bar yüksekliği sabit tutulur!).
- **Anlık Satır İçi Hızlı Filtre (`data-testid="dok-inline-filter"`):** Komut çubuğunda kompakt bir hızlı süzgeç girişi (yazdıkça mevcut klasör/görünümü 0ms gecikmeyle filtreler, temizleme `×` butonu içerir); yanında global derin arama (`Ara... /`) butonu korunur.
- **Görünüm Geçişi (`layoutId="dok-view-mode-pill"`):** Liste ↔ Kart (Grid) anahtarı aktif sekmeyi yay animasyonuyla kaydırır.
- **Yenile Düğmesi (`data-testid="dok-refresh-btn"`):** Komut çubuğunda kompakt yenile ikonu; basıldığında veya `isFetching` iken akıcı döner, tamamlandığında kısa başarı geri bildirimi verir.
- **Kısayol Yardım Butonu (`?`):** Araç çubuğunda veya alt durum çubuğunda tek tıkla Klavye Kısayolları modalını açar.

### Katman 4 — Aktif Sütun Sıralama Göstergeleri & Canlı Satır Hover Aksiyonları
- **Sütun Başlıkları (`İsim`, `Boyut`, `Değiştirilme`):**
  - Aktif sıralı sütun amber vurgulu görünür; yön oku (`ArrowUp` / `ArrowDown`) `transition-transform duration-200` ile 180° döner.
  - Pasif sütunlarda `ArrowUpDown` hover'da belirginleşir.
- **Liste Satırlarında Hover Hızlı Eylem Barı (`data-testid="dok-row-quick-actions"`):**
  - Masaüstünde (`@media (hover: hover) and (pointer: fine)`) bir satırın üzerine gelindiğinde (veya satır focus-within olduğunda), tarih/işlem alanının solunda `opacity-0 → opacity-100 translate-x-1 → translate-x-0` ile yumuşakça beliren 3–4 kompakt ikon butonu:
    - Dosya için: **Önizle** (`Eye`), **İndir** (`Download`), **Paylaş** (`Share2`), **Adlandır** (`Edit3`)
    - Klasör için: **Aç** (`FolderOpen`), **Paylaş** (`Share2`), **Adlandır** (`Edit3`), **Taşı** (`Move`)
  - Her buton `e.stopPropagation()` ile satır seçimini bozmaz, `title` + `aria-label` taşır ve klavye odaklanmasında görünür olur.
  - Mobilde ve dokunmatik cihazlarda gizlidir (44px dokunma ve açık seçim modu kurallarını bozmaz).
- **Grid Kartlarında Canlılık:**
  - Hover'da kart ikonu hafifçe yukarı süzülür (`translateY(-2px) scale(1.04)`), dosya türüne özgü ince renkli üst kenar ışıması (DWG mavi, DXF turkuaz, PDF kırmızı, Görsel yeşil, Klasör amber) belirir.
  - Kart altbilgisi yanında hover'da hızlı **Önizle** / **İndir** mini aksiyon şeridi görünür.

### Katman 5 — Yıldızlama ve Seçim Mikro-Animasyonları
- **Yıldız Spring Pop:** Yıldız butonuna tıklandığında yıldız ikonu kısa CSS `@keyframes dokStarPop` (`scale(1) → scale(1.32) → scale(0.92) → scale(1)`) ile patlar ve sıcak altın parıltı bırakır.
- **Seçim Sol Vurgu Çizgisi:** Seçili satırlarda sol kenarda sıcak amber vurgu + hafif sıcak cam tonlaması; seçim değiştiğinde alt Selection Dock yaylı girişle (`y: 16 → 0, opacity: 0 → 1`) açılır ve içindeki sayaç numarası animasyonlu güncellenir.

### Katman 6 — Tek Tek Kapatılabilir Animasyonlu Filtre Çipleri (`filter-chips-bar.tsx`)
- Aktif filtreler (`CAD`, `Son 7 gün`, `5–100 MB`, `Tüm klasörler`, `Yıldızlı`, `"kalip"`) artık donuk düz yazı etiketleri değil, her birinin sağında **`×` tekil kaldırma butonu** olan renkli cam çiplerdir!
- `AnimatePresence` ile çip eklendiğinde hafif büyüyerek (`scale: 0.9 → 1`), kaldırıldığında kayarak yok olur.
- Yanında eşleşen sonuç sayısı (`"6 sonuç"`) ve `"Tümünü Temizle"` düğmesi yer alır.

### Katman 7 — Katlanabilir Gruplar & Akıcı Grup Başlıkları
- Gruplu görünümde (`groupBy !== "none"`) her grup başlığı sticky cam şerit olarak görünür; tıklandığında chevron 90° yumuşak döner ve grup içeriği akıcı açılır/kapanır.
- Grup başlığı üzerinde **grup dosya sayısı**, **grup toplam boyutu** ve **"Grubu Seç"** hızlı düğmesi bulunur.

### Katman 8 — İskelet Yükleyici (`explorer-skeleton.tsx`) & Canlı Boş Durumlar
- İlk yüklemede tek bir dönen çember yerine:
  - Liste modunda 8 adet shimmer efektli satır iskeleti (checkbox + ikon + 2 metin barı + boyut + tarih).
  - Grid modunda responsive 8 adet shimmer efektli kart iskeleti.
- **Arka Plan Yenilemesi (`isFetching && !isLoading`):** Mevcut liste kaybolmadan üst kenarda ince 2px amber kayan ilerleme çizgisi (progress shimmer) akar — sıfır beyaz ekran, sıfır titreme!
- **Boş Durumlar:** Hafif yüzen ikon rozeti, bağlama göre net Türkçe başlık + açıklama + doğrudan aksiyon butonları (örn. filtreden boşsa `"Filtreleri Temizle"`, klasör boşsa `"Dosya Yükle"` + `"Yeni Klasör"` + `"Dosyaları buraya sürükleyip bırakabilirsiniz"`).

### Katman 9 — Sağ Tık Bağlam Menüsü, Pano Çubuğu & Detay Çekmecesi Animasyonları
- **Sağ Tık Menüsü:** İmleç noktasından `scale: 0.95 → 1, opacity: 0 → 1` (140ms) ile açılır; kısayol rozetleri (`F2`, `Del`, `Ctrl+C`) sağda `font-mono` hizalanır.
- **Pano Çubuğu (`clipboard-bar.tsx`):** `AnimatePresence` ile üstten/alttan kayarak girer; `"3 öğe kesildi"` / `"2 öğe kopyalandı"` rozeti + `[Buraya Yapıştır]` + `[İptal]`.
- **Detay & Etkinlik Çekmecesi (`drive-details-drawer.tsx`):** Sağdan akıcı kayma (`x: 24 → 0, opacity: 0 → 1`), içinde *Bilgi / Etkinlik* sekme geçişi ve dosya dağılım barı.

### Katman 10 — Canlı Sürükle-Bırak Geri Bildirimi
- Harici dosya sürüklerken (`isDraggingOver`): tüm çalışma alanı üzerinde animasyonlu kesikli amber çerçeve, parlayan bulut ikonu ve hedef klasör adı göstergesi (`"1_kisim klasörüne bırakın"`).
- Klasör veya Breadcrumb üzerine öğe sürüklerken: hedef klasör/breadcrumb sıcak amber halo ile vurgulanır + `"Buraya taşı"` mikro rozeti belirir.

### Katman 11 — Her İşlemde Net Toast Bildirimi (`useToast`)
Mevcut `src/components/toast-provider.tsx` (`useToast().showToast`) kullanılarak her kullanıcı eylemi net, kısa Türkçe geri bildirim verir:
- Klasör oluşturuldu → `"Yeni klasör oluşturuldu: <ad>"` (`success`)
- Yeniden adlandırıldı → `"Ad güncellendi: <yeniAd>"` (`success`)
- Yıldızlandı / kaldırıldı → `"Yıldızlılara eklendi"` / `"Yıldız kaldırıldı"` (`info`)
- Taşındı → `"N öğe taşındı"` (`success`)
- Kopyalandı / Kesildi / Yapıştırıldı → `"N öğe panoya kopyalandı"`, `"N öğe kesildi"`, `"N öğe yapıştırıldı"` (`info`/`success`)
- Çöpe atıldı / Geri yüklendi → `"N öğe çöp kutusuna taşındı"`, `"Öğe geri yüklendi"` (`info`/`success`)
- Paylaşım linki kopyalandı → `"Paylaşım bağlantısı panoya kopyalandı"` (`share`)
- Yükleme tamamlandı / iptal edildi → `"N dosya yüklendi"`, `"Yükleme iptal edildi"` (`success`/`info`)
- Kısmi başarısızlık → `"N öğeden M tanesi başarısız oldu — seçili bırakıldı"` (`error`)

### Katman 12 — Alt Durum Çubuğu (`workspace-status-bar.tsx`)
Masaüstünde çalışma alanının en altında ince `32px` cam şerit:
- Sol: `"4 klasör · 24 dosya · 73.4 MB"` (filtre aktifse `"6 / 28 öğe gösteriliyor"`)
- Orta (seçim varsa): `"3 öğe seçili · 11.2 MB"`
- Sağ: aktif sıralama/gruplama özeti (`"İsim A→Z · Gruplama yok"`) + `[? Kısayollar]` tıklanabilir düğme.

---

## 3. Tema Eşliği Kontrol Listesi (Light + Dark)

- Tüm yeni bileşenler `bg-card`, `bg-background`, `bg-secondary`, `text-foreground`, `text-muted-foreground`, `border-border` ve `dark:*` çiftleriyle yazılır.
- Amber CTA butonları her iki temada yüksek kontrast korur (`bg-amber-500 text-zinc-950`).
- Açık temada cam yüzeyleri okunaklı ve yumuşak gölgeli, koyu temada derinlikli ve yüksek kontrastlıdır; hiçbir metin `4.5:1` kontrastın altına düşmez.
