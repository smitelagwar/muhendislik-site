# 05 — Görsel Kanıt ve Çoklu Senaryo Test Matrisi (UX V5)

> **Temel İlke:** UX V4'te yalnız fonksiyonel DOM testleri koşulduğu için "turuncu kafes seçim" ve "kesik üst başlık" gözden kaçtı. UX V5'te hem **otomatik çoklu senaryo Playwright testleri** hem de **`critic-ux` (`Gemini 4 Hydrogen High`) tarafından gözle incelenen 8 zorunlu ekran görüntüsü** geçiş şartıdır.

---

## 1. Regresyon Koruması (Sıfır Kırık Şartı)

Aşağıdaki tüm mevcut kontroller %100 yeşil kalmak zorundadır:
- `npx tsc -p tsconfig.next.json --noEmit --incremental false` → exit 0
- `npx tsx --test tests/dok-drive-v3/explorer-derive.unit.test.ts` → exit 0 (genişletilmiş `document` ve `week/month` testleriyle)
- `npm run check:dok-drive-v3:static` → exit 0 (Aşama 1–9 + `check:dok-file-icons`)
- `npm run check:dok-drive-v3` içindeki tüm mevcut V3 + V4 testleri (247+ test) → 0 fail

---

## 2. Yeni UX V5 Playwright Test Paketleri (4 Paket)

Her testte `waitUntil: "domcontentloaded"`, açık `data-testid`, ≤8 sn aksiyon timeout kullanılır; `networkidle` YASAK, boş/sahte assertion YASAK.

### Paket 1 — `tests/dok-drive-v3/ux-v5-selection-visuals.spec.ts`
1. **S1.1 — Seçili Satır Stil Doğrulaması:** Tümü seçildiğinde `.virtualRowSelected` öğesinde `borderTopColor` / `borderBottomColor` parlak turuncu kafes (`rgba(245, 158, 11, 0.8)`) OLMADIĞI, `boxShadow` içinde sol accent rayı (`inset 3px 0`) bulunduğu doğrulanır.
2. **S1.2 — 3-Durumlu `DriveCheckbox`:** 0 seçili → `aria-checked="false"`; 1 öğe seçili → tablo başlığı `aria-checked="mixed"` (indeterminate); tümü seçili → `aria-checked="true"`.
3. **S1.3 — Yüzen Masaüstü Seçim Kapsülü & Tersine Çevir:** 2 öğe seçilince `dok-mobile-selection-dock` açılır; üst çubukta tekrar eden kırmızı `[Trash N]` butonu YOKTUR; `dok-invert-selection` tıklandığında tam olarak kalan `N-2` öğe seçili olur; dock açıkken `dok-status-selection` gizlidir; `Esc` ile temizlenir.
4. **S1.4 — Cockpit Başlık Kırpılmama Testi (1280×720 & 1920×1080):** `dok-admin-header` üst koordinatı (`boundingBox().y`) site navbar'ının altından küçük DEĞİLDİR (`headerRect.y >= navbarRect.bottom - 1`); sayfa dış dikey taşması yoktur.
5. **S1.5 — Warm Amber Marquee + Canlı Sayaç:** Boş alanda sürükleme yapıldığında `dok-marquee-box` görünür ve içinde canlı öğe sayacı bulunur.

### Paket 2 — `tests/dok-drive-v3/ux-v5-toolbar-sidebar-tree.spec.ts`
1. **S2.1 — Sadeleştirilmiş Araç Çubuğu & Breadcrumb Geçmişi:** 1366px ekranda araç çubuğu tek satırda kalır; 2 alt klasöre girilip `←` Geri ve `→` İleri geçmiş butonlarıyla doğru klasörlere dönülür (`Alt+←` / `Alt+→` dahil); 4+ derinlikte `…` düğmesine tıklanınca gizli üst klasör dropdown menüsü açılır ve tıklandığında o klasöre gidilir.
2. **S2.2 — `FilterChipsBar` `"week"` / `"month"` Fix:** Filtre panelinden "Son 7 gün" seçildiğinde çipte `"Tarih: Son 7 gün"` yazar (`"Tarih: week"` asla görünmez!).
3. **S2.3 — `Belgeler & Tablolar` Kategorisi & Tıklanabilir Depolama Barı:** Sol kenar çubuğunda `Belgeler & Tablolar` tıklanınca `.md`/`.txt`/`.docx` dosyaları süzülür; depolama barındaki `PDF` dilimine tıklanınca PDF filtresi aktifleşir.
4. **S2.4 — Katlanabilir Sidebar Klasör Ağacı & Drop Hedefleri:** Sidebar klasör ağacı açılır/kapanır, bir klasöre tıklayınca o klasöre gider; bir dosya sürüklenip sidebar'daki `Yıldızlı Dosyalar` üzerine bırakıldığında yıldızlanır, `Çöp Kutusu` üzerine bırakıldığında çöpe taşınır.

### Paket 3 — `tests/dok-drive-v3/ux-v5-power-ux-quicklook-palette.spec.ts`
1. **S3.1 — `Space` Quick Look & Galeri Gezintisi:** Dosya seçiliyken `Space` basınca `dok-quick-look-modal` açılır (URL `/dokumantasyon` kalır, klasör terk edilmez!); `ArrowRight` / `ArrowLeft` ile sonraki/önceki dosyaya geçer; görselde zoom `+`/`-` çalışır; DWG/DXF dosyasında CAD altın motoruna dokunmadan "CAD Studio'da Aç" CTA görünür; `Esc` kapatır.
2. **S3.2 — `Ctrl+K` Komut Paleti:** `Control+k` basınca `dok-command-palette` açılır; `"Kart"` yazılıp `Enter` basılınca Grid görünümüne geçer; dosya adı yazılınca arama sonuçları listelenir ve klavye oklarıyla seçilir.
3. **S3.3 — Grid Lazy Image Thumbnails & Liste Sütunları:** Grid modunda `.png`/`.jpg` kartında `<img>` küçük resmi render olur (hata halinde güvenli ikon fallback); liste modunda uzantı rozeti ve göreli zaman + tam tarih tooltip görünür.
4. **S3.4 — Detay Çekmecesi Zenginleştirmesi:** Çoklu seçimde tür dağılımı görünür; tek seçimde "Stüdyo Linkini Kopyala" aksiyonu çalışır.

### Paket 4 — `tests/dok-drive-v3/ux-v5-undo-inline-rename-url.spec.ts`
1. **S4.1 — `F2` Uzantı-Korumalı Satır İçi Adlandırma:** Liste satırında `F2` basınca `dok-inline-rename-input` açılır; yalnız uzantı öncesi taban ad seçilidir (`selectionStart === 0`, `selectionEnd === baseName.length`); yeni ad yazılıp `Enter` basılınca `.pdf` uzantısı korunarak güncellenir; `Esc` iptal eder.
2. **S4.2 — Geri Al (Undo Toast + `Ctrl+Z`):** Öğe çöpe atılınca toast içinde `dok-toast-undo` ("Geri Al") görünür; tıklandığında `/api/dokumantasyon/bulk/restore` çağrılır ve öğe listeye geri döner. Taşıma sonrası `Ctrl+Z` eski klasöre geri taşır.
3. **S4.3 — URL Deep-Link & `localStorage` Tercih Kalıcılığı:** Alt klasöre girilip yoğunluk `Sıkışık` yapıldığında URL `?folder=...` güncellenir; `page.reload()` sonrasında kullanıcı hâlâ aynı alt klasörde ve aynı yoğunlukta kalır!
4. **S4.4 — `Ctrl+V` Sistem Panosu Dosya Yapıştırma:** İç pano boşken synthetic `ClipboardEvent("paste")` ile PNG dosyası yapıştırıldığında yükleme kuyruğu tetiklenir.
5. **S4.5 — Mobil 390px Regresyon Koruması:** Mobilde gizli seçim yok, açık `Seç` modu + 44×44px dokunma hedefleri + 3 eylemli statik alt bar bozulmamış.

---

## 3. Zorunlu 8 Görsel Kanıt Karesi (`critic-ux` Gözle Onay Matrisi)

W4 aşamasında `coder-2` (veya Playwright yardımcı koşusu) aşağıdaki 8 tam pencere ekran görüntüsünü kendi `<appDataDir>\brain\<conv-id>\` klasörüne kaydedip `Screenshot: <path> | <açıklama>` satırıyla board'a bırakır. **`critic-ux` (`gemini-4-hydrogen-high`) her 8 görseli `read_file` ile tek tek açıp incelemeden `ONAY` veremez!**

| # | Kare Adı | Viewport & Tema | Kontrol Edilecek Görsel Kriter |
|---|---|---|---|
| **G1** | `v5-01-dark-all-selected.png` | 1440×900 · Dark | 28/28 öğe seçili — **turuncu ızgara kafesi YOK**, sakin dolgu + 3px sol şerit, dolu amber tikler, üst başlık kesilmemiş, tek yüzen seçim kapsülü, mükerrer sayaç yok |
| **G2** | `v5-02-light-partial-selected.png` | 1440×900 · Light | 3 öğe seçili — Light temada yüksek kontrast, tablo başlığında `—` (indeterminate) kutu, seçili/seçisiz net ayrımı |
| **G3** | `v5-03-dark-grid-thumbs.png` | 1440×900 · Dark | Grid görünümü — görsellerde gerçek thumbnail, kart yüksekliği eşit (260px), seçili kartlarda zarif çerçeve + köşe tik |
| **G4** | `v5-04-dark-quick-look.png` | 1440×900 · Dark | `Space` Quick Look modalı açık — okunaklı önizleme, galeri okları, üst aksiyon çubuğu, arka planda klasör korunmuş |
| **G5** | `v5-05-dark-command-palette.png` | 1440×900 · Dark | `Ctrl+K` Komut Paleti açık — dosya sonuçları + hızlı komutlar net, klavye ipuçları hizalı |
| **G6** | `v5-06-dark-sidebar-tree-filters.png` | 1440×900 · Dark | Sidebar'da `Belgeler & Tablolar` kategorisi + açık Klasör Ağacı + Türkçe `"Tarih: Son 7 gün"` filtre çipi |
| **G7** | `v5-07-dark-details-multi.png` | 1440×900 · Dark | Detay Çekmecesi açık (çoklu seçim tür dağılımı veya tekil görsel mini önizleme), araç çubuğu taşmıyor |
| **G8** | `v5-08-mobile-390-selection.png` | 390×844 · Dark | Mobil açık seçim modu — 44×44px dokunma hedefleri, 3 eylemli temiz alt bar, yatay taşma (`scrollWidth <= innerWidth`) yok |
