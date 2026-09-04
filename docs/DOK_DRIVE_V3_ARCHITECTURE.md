# DÖKÜMANTASYON DRIVE V3.1 — SİSTEM MİMARİSİ RAPORU

## 1. Genel Mimari Bakış

Dökümantasyon modülü Dosya Yöneticisi V3.1, modern masaüstü işletim sistemi dosya yöneticileri (Windows Explorer, macOS Finder) ve kurumsal bulut depolama deneyimini (Google Drive) web standartlarında bir araya getiren yüksek performanslı, dayanıklı ve ölçeklenebilir bir mimaridir.

### Temel Katmanlar

1. **Sunucu Durumu & Sıfır-F5 (Zero-F5 Cache Engine):**
   - `@tanstack/react-query` ile yönetilen deterministik `queryClient`.
   - İptal edilebilir `AbortController` sinyalleri ile hızlı gezinme sırasında asılı istek kalması önlenir.
   - İyimser (optimistic) klasör oluşturma ve dosya yüklemeleri: Sunucudan `201/200` dönene kadar geçici `pending: true` kaydı ile listeye eklenir, sunucu doğrulaması geldiğinde kimlikler atomik olarak takas edilir.
   - `unshift()` gibi yapay dizi manipülasyonları yasaktır; tüm sıralama, gruplama ve filtreleme tek bir saf `deriveExplorerView()` fonksiyonundan akar.

2. **Seçim Motoru & Sanal Marquee (Virtual Selection & Offscreen Hit-Testing):**
   - Saf matematiksel koordinat tabanlı seçim motoru (`selection-reducer.ts`, `marquee-geometry.ts`).
   - DOM sorgusu veya `getBoundingClientRect` gerektirmez. 5.000 öğelik devasa listelerde bile sanallaştırma nedeniyle DOM'da henüz var olmayan (offscreen) elemanlar matematiksel dünya koordinatları üzerinden seçilebilir.
   - Doğrusal satır-öncelikli (row-major) Grid Shift-tıklama seçimi.
   - Sağ tık koruması: Çoklu seçim varken seçili bir öğeye sağ tıklandığında mevcut seçim bozulmaz; seçimsiz öğeye sağ tıklandığında seçim o öğeye taşınır.

3. **Gövde Seviyesinde Overlay Katmanı (Body-Level Overlay Architecture):**
   - Modallar ve diyaloglar, çalışma alanı (`.workspace`) içindeki CSS `isolation: isolate` ve `backdrop-filter` içeren blokların içine sıkışmaz.
   - `src/components/global-overlays.tsx` içinde doğrudan `<body>` altına yerleştirilen `<div id="dok-overlay-root" />` içerisine React portal ile yansıtılır (`OverlayPortal`).
   - `#dok-overlay-root` üzerinde `transform: none !important; filter: none !important; perspective: none !important;` kilitlenerek 5.000px derinlikte kaydırılmış sayfalarda bile modalların görsel görünüm penceresinin (visual viewport) tam merkezinde açılması garanti edilir.

4. **Toplu İşlemler & Sürükle-Bırak (Bulk Engine & Pragmatic Drag & Drop):**
   - 100+ dosya işlemleri tek bir HTTP isteğinde (`/api/dokumantasyon/bulk/trash`, `/bulk/move`, `/bulk/star`, `/bulk/restore`) gönderilir.
   - Maksimum chunk boyutu 250 öğedir. Vercel timeout risklerini sıfıra indirir.
   - Kısmi başarısızlık (partial failure) desteği: 97 öğe başarılı, 3 öğe başarısız olduğunda sistem çökmek yerine yalnızca 3 başarısız öğeyi seçili bırakarak kullanıcıya özel "Yalnızca Başarısızları Tekrar Dene" aksiyonu sunar.
   - Atlassian Pragmatic Drag & Drop (PDD) entegrasyonu ve otomatik kaydırma (`autoScrollForElements`).
   - Klasör döngüsel taşıma (descendant / cycle) sunucu ve istemci düzeyinde kilitlidir.

5. **Sanallaştırma & Ölçeklenebilirlik (TanStack Virtual 5K+ Items):**
   - `@tanstack/react-virtual` ile liste ve grid modunda sabit satır geometrisi (`56px` liste satırı, `180px` grid satırı).
   - DOM Bütçesi: 5.000 öğelik dizinde aynı anda ekranda en fazla 40-70 düğüm çizilir (bütçe limiti < 250).
   - Anchor-Preserving Resize: Pencere genişliği değiştiğinde kolon sayısı değişse bile (ör. 4 kolondan 3 kolona) üstte görünen ilk öğe indeksi korunur ve görünüm kaymaz.
   - Scroll Pozisyonu Saklama: `folderId + filter + viewMode` bazlı anahtar ile klasörler arası gezinip geri dönüldüğünde kaydırma konumu tam olarak geri yüklenir.

6. **Mobil & iOS Erişilebilirliği:**
   - 500ms haptik titreşimli Long-Press durum makinesi.
   - 8px üzerinde parmak hareketi algılandığında doğal kaydırma serbest bırakılır ve long-press iptal edilir.
   - iOS Safari metin seçme baloncukları engellenmiştir (`-webkit-touch-callout: none; user-select: none;`).
   - `100dvh`, `viewportFit: cover` ve safe-area inset desteği.
   - Tüm dokunmatik etkileşim alanları WCAG 2.5.5 kriterine uygun olarak minimum 44x44 CSS pikseldir.
