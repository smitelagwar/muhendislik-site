# 04 — Çoklu Senaryo Test Matrisi ve Kabul Kapıları

Bu belge, `/dokumantasyon` modülündeki **her tuşun, her filtrenin, her gruplamanın, her modalın, her kısayolun ve her kenar durumunun** gerçek tarayıcıda ve birim testlerinde eksiksiz doğrulanması için zorunlu test planını tanımlar.

> **Zorunlu Kural:** Tüm Playwright testleri `.agents/rules/test-ve-otomasyon-standardi.md` standardına uyar:
> - `waitUntil: "domcontentloaded"` (ASLA `"networkidle"` kullanma!)
> - Açık `data-testid` seçicileri (tahmini metin/aria yerine kesin seçiciler)
> - Aksiyon timeout'u ≤ 8.000 ms, test timeout'u ≤ 30.000 ms
> - Sıfır `console.error`, sıfır `pageerror`, sıfır 5xx cevabı (bilinçli hata simülasyonu testleri hariç).

---

## 1. Birim & Sözleşme Testleri (Hızlı, < 3 sn)

**Yeni dosya:** `tests/dok-drive-v3/explorer-derive.unit.test.ts` (`tsx --test` ile çalıştırılır)

Kapsanacak vakalar:
1. **Tür Filtre Paritesi (`file-categories.ts` + `explorer-derive.ts`):**
   - `cad`: `.dwg`, `.dxf`, `.dwf` (büyük/küçük harf dahil `.DWG`, `.DXF`) geçer; klasörler gizlenir.
   - `pdf`: yalnızca `.pdf`.
   - `image`: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.gif`.
   - `other`: `.md`, `.xlsx`, `.docx`, `.zip`, `.txt` geçer; `cad`/`pdf`/`image` ve klasörler ELENİR (**BUG-03 regresyonu**).
2. **Boyut Eşik Paritesi:**
   - `small`: 0 B, 4.99 MB geçer; 5 MB elenir.
   - `medium`: 5 MB, **75 MB**, 99.99 MB geçer; 4.99 MB ve 100 MB elenir (**BUG-04 regresyonu**).
   - `large`: 100 MB, 250 MB geçer; 99.99 MB elenir.
   - Boyut filtresi aktifken klasörler tutarlı biçimde gizlenir.
3. **Tarih & Sıralama Paritesi:**
   - `updated_at` yeni, `created_at` eski bir öğe `date: "today"` ve `groupBy: "date"` içinde `"Bugün"` grubuna girer ve `sortBy: "date", sortOrder: "desc"` sıralamasında en üstte yer alır (**BUG-05 regresyonu**).
   - `sortBy: "type"` uzantı sırası + eşit uzantıda Türkçe `localeCompare("tr")` ikincil sıralama.
   - Türkçe karakter sıralaması (`Ç`, `Ğ`, `İ`, `I`, `Ö`, `Ş`, `Ü`) ve Türkçe arama normalizasyonu (`"İNŞAAT"` ↔ `"inşaat"`, `"KISIM"` ↔ `"kısım"`) (**BUG-20 regresyonu**).
4. **Gruplama Doğruluğu:**
   - `groupBy: "none" | "type" | "date" | "size"` her biri için boş kovaların elenmesi, `visibleOrderedIds` sırasının görsel sırayla birebir eşleşmesi, `reconcileSelection` koruması.
5. **Komut Sözleşmesi (`command-registry.ts`):**
   - 27 komutun tamamı tanımlı; yalnızca klasör seçiliyken `share` artık `true` döner (**BUG-08 regresyonu**); pending öğede mutasyonlar kapalı; trash görünümünde `restore`/`delete-forever` açık.

---

## 2. Uçtan Uca Çoklu Senaryo Paketi (Playwright — `playwright.dok-drive.config.ts`)

### Senaryo Paketi S1 — Filtre, Kapsam, Sıralama & Gruplama Çapraz Matrisi
**Dosya:** `tests/dok-drive-v3/ux-v4-filters-grouping.spec.ts`
- **S1.1:** Sol menüden `AutoCAD`, `PDF`, `Görseller`, `Yıldızlılar`, `Son Açılanlar`, `Tüm Dosyalarım` tıklandığında doğru API parametrelerinin (`type`, `collection`, `scope`) gittiği ve sol menüde **gerçek toplamların (`summary`) sıfırlanmadığı** doğrulanır.
- **S1.2:** `Filtre` sheet'inden `Tür: Diğer`, `Boyut: 5–100 MB` (75 MB fixture dosyası görünür!), `Tarih: Son 7 gün`, `Kapsam: Tüm klasörler` (`?scope=all` isteği gittiği ve alt klasör dosyasının listelendiği) doğrulanır.
- **S1.3:** Çoklu filtre kombinasyonu (`PDF` + `5 MB altı` + `Yıldızlı`) → üst çip barında 3 ayrı çip görünür → tek bir çipin `×` tuşuna basıldığında yalnız o filtre kalkar, diğer 2 filtre ve sonuçlar anında güncellenir → `"Temizle"` tümünü sıfırlar.
- **S1.4:** Satır içi hızlı arama (`dok-inline-filter`) Türkçe karakterlerle (`"inşaat"`, `"KALIP"`, `"İ"`) anlık filtreler, sonuç yoksa bağlama duyarlı boş durum ve `"Filtreleri Temizle"` düğmesi çalışır.
- **S1.5:** Sıralama matrisi: `İsim A→Z`, `İsim Z→A`, `En Yeni`, `En Eski`, `Büyük→Küçük`, `Küçük→Büyük`, `Türe Göre` hem üst dropdown hem sütun başlıklarından test edilir; aktif sütun yön oku doğrulanır ve API'ye `order=desc|asc` gittiği teyit edilir.
- **S1.6:** Gruplama matrisi: Liste ve Grid modlarında `Türe Göre`, `Tarihe Göre`, `Boyuta Göre` açılır → her grup başlığı daraltılıp açılır (`aria-expanded`), `"Grubu Seç"` yalnız o grubun öğelerini seçer, gruplu görünümde duplike tablo başlığı olmadığı doğrulanır.
- **S1.7:** Breadcrumb `"Kök Dizin"` tıklaması hem klasörü köke döndürür hem çelişen koleksiyon filtresini temizler.

### Senaryo Paketi S2 — Sıfır Ölü Kontrol: Her Tuş, Hover Aksiyonu, Detay/Etkinlik & Çıkış
**Dosya:** `tests/dok-drive-v3/ux-v4-buttons-and-drawer.spec.ts`
- **S2.1:** Komut çubuğundaki her tekil buton (`Tümünü Seç`, `Sırala`, `Grupla`, `Ara...`, `Filtre`, `Yükle`, `Klasör`, `Yeni Klasör`, `Liste`, `Grid`, `Yenile`, `Bilgi/Detay`, `? Kısayollar`) tıklanıp beklenen yan etki doğrulanır; 0 konsol uyarısı (`Handler not registered` YASAK).
- **S2.2:** Satır hover hızlı eylemleri (`dok-row-quick-actions`): Önizle, İndir, Paylaş, Adlandır butonları satır seçimini bozmadan doğru aksiyonu/modalı açar.
- **S2.3:** Detay Çekmecesi (`i` butonu):
  - 0 öğe seçiliyken açılır ve **Klasör Özeti** gösterir (asla boş dönmez!).
  - 1 öğe seçiliyken öğe detayları + hızlı aksiyonlar görünür.
  - 3 öğe seçiliyken **Çoklu Seçim Özeti** (öğe sayısı + toplam boyut + toplu aksiyonlar) görünür.
  - **Etkinlik** sekmesine geçildiğinde `/api/dokumantasyon/activity` olayları listelenir.
- **S2.4:** Selection Dock: yalnızca klasör seçiliyken `Paylaş` butonu `CreateShareModal`'ı açar; çoklu dosya seçiliyken `İndir`, `Yıldızla`, `Taşı`, `Paylaş`, `Sil` ve `Temizle` hepsi çalışır ve Toast üretir.
- **S2.5:** Yıldızla/Kaldır düğmesi iyimser güncelleme + sunucu hata durumunda rollback + Toast.
- **S2.6:** Sağ üst kullanıcı menüsünden **Çıkış Yap** tıklandığında `POST /api/dokumantasyon/cikis` çağrıldığı doğrulanır.

### Senaryo Paketi S3 — Masaüstü Sağ Tık Menüsü, Klavye Kısayolları & Gerçek Pano (Kes/Kopyala/Yapıştır)
**Dosya:** `tests/dok-drive-v3/ux-v4-context-clipboard-shortcuts.spec.ts`
- **S3.1:** Tekil dosyaya mouse sağ tık → `role="menu"` açılır; tüm dosya eylemleri (CAD dosyada Motor V2 dahil) çalışır; viewport köşesinde sağ tıklandığında menü ekran dışına taşmaz.
- **S3.2:** 3 öğe seçiliyken seçili 2. öğeye sağ tık → 3'lü seçim KORUNUR, çoklu menü (`"3 öğe seçili"`) açılır. Seçimsiz 4. öğeye sağ tık → seçim yalnız 4. öğeye geçer.
- **S3.3:** Boş alana sağ tık → seçim temizlenir, boş alan menüsü (`Yeni Klasör`, `Dosya Yükle`, `Yapıştır`, `Tümünü Seç`, `Yenile`) açılır; `Escape` ve dış tıklama ile kapanır.
- **S3.4:** Touch/pen `contextmenu` olayı masaüstünde bile menü AÇMAZ ve seçim başlatmaz.
- **S3.5:** **Gerçek Kopyala + Yapıştır:** Dosya seç → `Ctrl+C` → `ClipboardBar` (`"1 öğe kopyalandı"`) belirir → alt klasöre gir → `Ctrl+V` (veya bar'daki `Buraya Yapıştır`) → `POST /api/dokumantasyon/bulk/copy` çağrılır → yeni kopya listede belirir + Toast görünür! Aynı klasöre yapıştırmada ` (Kopya)` çakışma çözümü doğrulanır.
- **S3.6:** **Gerçek Kes + Yapıştır:** Klasör/dosya seç → `Ctrl+X` → öğe soluklaşır (`data-clipboard-cut="true"`) + `ClipboardBar` belirir → hedef klasörde `Ctrl+V` → `bulk/move` çalışır, pano temizlenir, Toast görünür.
- **S3.7:** Klavye kısayolları: `Shift+N` (yeni klasör), `/` (arama), `V` (liste↔grid), `I` (detay çekmecesi), `S` (yıldızla), `F2` (adlandır), `M` (taşı), `Delete` (çöpe taşı), `Escape` (seçim temizle), `?` (kısayol rehberi), `Ctrl+A` (odak toolbar'dayken bile tümünü seçer); ve bir `input` içine yazı yazarken `V`/`I`/`S`/`M`/`?` tetiklenmez!

### Senaryo Paketi S4 — Modallar, Çöp Kutusu, Aktif Paylaşımlar & Yükleme Kuyruğu
**Dosya:** `tests/dok-drive-v3/ux-v4-modals-trash-shares-upload.spec.ts`
- **S4.1:** Açılan her modalda **tam olarak 1 adet kapatma (`×`) düğmesi** bulunduğu doğrulanır (**BUG-15 regresyonu**).
- **S4.2:** `NewFolderModal`: yeni klasör oluşturulunca pending→gerçek ID takası hatasız gerçekleşir (**BUG-09**); modal tekrar açıldığında input boştur (**BUG-19**).
- **S4.3:** `RenameModal`: açılışta dosya adının uzantı hariç gövdesi seçili gelir; kaydetme sonrası liste anında güncellenir ve Toast görünür.
- **S4.4:** `MoveModal`: hiyerarşik klasör ağacı girintili görünür; arama kutusu klasörleri filtreler; döngüsel hedef (kendi/alt klasör) listede yoktur.
- **S4.5:** `SearchModal`: hızlı art arda yazmada eski istek iptal edilir (AbortController); ok tuşlarıyla sonuç gezilir; dosya satırında hem `Önizle` hem `Klasöre Git` çalışır; tür çipleri sonuçları daraltır.
- **S4.6:** `TrashModal`: `window.confirm` tetiklenmez; dosya uzantısına uygun gerçek ikon görünür; satır içi 2 adımlı kalıcı silme onayı çalışır; 2+ öğe seçilip `Seçilenleri Geri Yükle` (`bulk/restore`) çalışır.
- **S4.7:** `CreateShareModal` + `ShareResultModal` + `ActiveSharesModal`: form her açılışta temiz başlar; paylaşım oluştur → link kopyala (Toast) + QR göster → `ActiveSharesModal` içinde durum sekmeleri (`Tümü/Aktif/İptal`) çalışır, QR açıkken `Escape` yalnız QR'ı kapatır, iptal işlemi `window.confirm` olmadan satır içi onayla yapılır.
- **S4.8:** `UploadProgressToast`: çoklu dosya kuyruğunda çalışan bir yükleme `İptal Et` ile durdurulur; hatalı yüklemede tekil `Tekrar dene` ve toplu `Tümünü Tekrar Dene` çalışır.

### Senaryo Paketi S5 — Sürükle-Bırak (Klasör + Breadcrumb + Döngü Koruması + Harici Dosya)
**Dosya:** `tests/dok-drive-v3/ux-v4-dnd-breadcrumb.spec.ts`
- **S5.1:** Bir dosya veya çoklu seçim satır/kart üzerinden hedef klasöre bırakıldığında taşınır ve Toast görünür.
- **S5.2:** Alt klasör içindeyken bir dosya üstteki Breadcrumb (`Kök Dizin` veya üst klasör) üzerine sürüklendiğinde drop vurgusu yanar ve bırakınca üst klasöre taşınır.
- **S5.3:** Klasör kendi içine veya alt klasörüne bırakılamaz (`canDrop: false`).
- **S5.4:** Harici dosya `dragover` → canlı dropzone overlay açılır; `drop` → yükleme kuyruğu tetiklenir.

### Senaryo Paketi S6 — Responsive Matris, Tema Eşliği (Light + Dark) & Hareket Azaltma
**Dosya:** `tests/dok-drive-v3/ux-v4-responsive-theme-motion.spec.ts`
- **S6.1:** Responsive yatay taşma (`scrollWidth <= clientWidth`) ve görünürlük doğrulaması: `320×568`, `390×844`, `768×1024`, `1024×768`, `1366×768`, `1920×1080`.
- **S6.2:** Hem **Dark** hem **Light** temada sayfa, kenar çubuğu, tablo, grid kartları, filtre çipleri, sağ tık menüsü ve detay çekmecesi kontrastlı ve okunaklıdır; 0 kırık renk.
- **S6.3:** `emulateMedia({ reducedMotion: "reduce" })` altında tüm CSS animasyon/geçişleri devre dışı kalır ve `MotionConfig` hareket azaltmaya uyar.
- **S6.4:** Telefon (`390×844` ve `320×568`) mevcut mobil sözleşme: normal modda checkbox yok, `Seç` ile açık seçim modu, filtre/gruplama/sıralama mobil `Görünüm ve düzen` panelinden tam çalışır.

### Senaryo Paketi S7 — Dayanıklılık, Hata Toleransı & Ölçek (5.000 Öğe + Kısmi Başarısızlık)
**Dosya:** `tests/dok-drive-v3/ux-v4-resilience-and-scale.spec.ts`
- **S7.1:** API `500` hatasında anlaşılır hata kartı + `"Tekrar dene"` düğmesi iyileşir; `401` hatasında `"Oturum gerekli"` görünür.
- **S7.2:** Toplu silme / taşıma / kopyalamada kısmi başarısızlık (ör. 3 öğeden 1'i başarısız): yalnızca başarısız 1 öğe seçili kalır ve kullanıcıya hata mesajı gösterilir.
- **S7.3:** 5.000 öğelik fixture'da Liste ve Grid sanallaştırma DOM bütçesi (`< 250` satır/kart düğümü) korunur, hızlı kaydırma ve filtre/sıralama geçişi takılmaz.
- **S7.4:** Hızlı klasör gezinmesinde (Klasör A → B → C → Geri) yarış durumu (stale response) yaşanmaz ve scroll konumu geri yüklenir.

### Senaryo Paketi S8 — Gerçek Backend Entegrasyon Testi (Mock'suz Yerel Depolama)
**Dosya:** `tests/dok-drive-v3/ux-v4-real-backend-e2e.spec.ts`
- `DOK_ALLOW_LOCAL_STORAGE=true` izole geçici klasörde gerçek API'lere karşı uçtan uca akış:
  1. Admin oturumu aç → Klasör oluştur → alt klasör oluştur → 3 farklı türde dosya yükle (`.dxf`, `.pdf`, `.md`)
  2. `scope=all` + `type=other` filtrele (`.md` alt klasörden gelir!)
  3. Dosyayı yıldızla → `Yıldızlı Dosyalar` görünümünde gör → Kopyala (`bulk/copy`) → kopyayı doğrula
  4. Yeniden adlandır → başka klasöre taşı → Süreli paylaşım linki oluştur → Aktif Paylaşımlar'da gör ve iptal et
  5. Çöpe at → Çöp Kutusu'ndan geri yükle → tekrar çöpe at ve kalıcı sil → temiz bırak.

---

## 3. Kesin Kabul ve Release Kapısı Komutları

F7 kapanışında aşağıdaki komutların **tamamı exit code 0** ile geçmek zorundadır:

```powershell
# 1. TypeScript kontrolleri
# Not (F0 taban kanıtı): tsconfig.next.json 0 hata ile geçmelidir. Genel `npx tsc --noEmit`
# içinde önceden var olan `docs/belgeler-paylasim-v3-uygulama/*` hataları kapsam dışıdır;
# dokümantasyon yollarında (`src/components/dokumantasyon`, `src/app/api/dokumantasyon`,
# `src/lib/dokumantasyon`, `tests/dok-drive-v3`) 0 TS hatası zorunludur.
npx tsc -p tsconfig.next.json --noEmit --incremental false

# 2. Birim & Statik Drive V3/V4 Sözleşme Kapıları
npx tsx --test tests/dok-drive-v3/explorer-derive.unit.test.ts
npm run check:dok-drive-v3:static

# 3. ESLint (değiştirilen dokümantasyon dosyaları)
npx eslint "src/components/dokumantasyon/**/*.{ts,tsx}" "src/app/api/dokumantasyon/**/*.ts" "src/lib/dokumantasyon/file-categories.ts"

# 4. Production Build
npm run build

# 5. Tüm Drive V3 + Yeni UX V4 Playwright Test Paketi (Desktop + Mobile)
npm run check:dok-drive-v3

# 6. Mevcut Site Sadeleştirme Aşama 6 Gerçek Kullanıcı Kabulü (Regresyon Koruması)
npm run check:simplification-stage6
```
