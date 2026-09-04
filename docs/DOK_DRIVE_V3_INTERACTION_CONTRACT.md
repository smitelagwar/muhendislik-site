# DÖKÜMANTASYON DRIVE V3.1 — ETKİLEŞİM SÖZLEŞMESİ (INTERACTION CONTRACT)

Bu belge, Drive V3.1 dosya yöneticisi arayüzündeki tüm kullanıcı etkileşimlerinin kesin ve kilitli davranış kurallarını tanımlar.

## 1. Tıklama ve Seçim Modeli

| Eylem | Davranış | Anchor & Focus |
|---|---|---|
| **Tek Tık (Sol Tık)** | Önceki tüm seçimi temizler, yalnızca tıklanan öğeyi seçer. | `anchorId = item.id`, `focusedId = item.id` |
| **Ctrl / Cmd + Sol Tık** | Önceki seçimi korur; tıklanan öğenin seçim durumunu tersine çevirir (additive toggle). | `focusedId = item.id`, anchor korunur |
| **Shift + Sol Tık** | `anchorId` ile tıklanan öğe arasındaki tüm öğeleri doğrusal (linear row-major) aralık olarak seçer. | Anchor sabit kalır, `focusedId = item.id` |
| **Boş Alana Tıklama** | Tüm seçimi temizler. | Anchor ve focus temizlenir |
| **Sağ Tık (Seçili Öğeye)** | Mevcut çoklu seçimi korur; bağlam menüsünü tüm seçili öğeler için açar. | Seçim değişmez |
| **Sağ Tık (Seçimsiz Öğeye)** | Önceki seçimi temizler, sadece sağ tıklanan öğeyi seçer ve bağlam menüsünü açar. | `anchorId = item.id`, `focusedId = item.id` |
| **Ctrl + A** | Mevcut görünümde filtrelenmiş tüm öğeleri seçer. | Anchor ilk öğe, focus son öğe |
| **Escape** | Seçili öğeler varsa seçimi temizler; açık diyalog/menü varsa kapatır. | - |

## 2. Sanal Marquee (Kutuyla Sürükleyerek Seçim)

- **Başlangıç Eşiği:** Pointer boş alanda en az `6px` hareket ettiğinde marquee seçimi başlar.
- **Tıklama ile Ayrım:** 6px'den küçük hareketler normal boş alan tıklaması (seçim temizleme) sayılır.
- **Tuş Değiştiriciler:**
  - Normal Marquee: Yalnızca kutu içindeki öğeleri seçer.
  - Ctrl / Cmd + Marquee: Kutu içindeki öğeleri mevcut seçime ekler/tersine çevirir.
- **Otomatik Kaydırma (Auto-Scroll):** Marquee kutusu viewport sınırının 36px yakınına geldiğinde liste otomatik olarak kaydırılır.
- **Matematiksel Koordinat Modeli:** Sanallaştırılmış öğelerin DOM'da bulunup bulunmadığına bakılmaksızın dünya koordinatları (`y = row * rowHeight`) üzerinden matematiksel kesişim hesaplanır.

## 3. Masaüstü Sürükle ve Bırak (Pragmatic Drag & Drop)

- **Seçili Öğeyi Sürükleme:** Sürüklenen öğe zaten seçiliyse, tüm seçili öğeler tek bir paket halinde taşınır.
- **Seçimsiz Öğeyi Sürükleme:** Sürüklenen öğe seçili değilse, mevcut seçim temizlenir, yalnızca o öğe seçilir ve sürüklenir.
- **Klasöre Bırakma:** Sürüklenen öğeler hedef klasörün içine taşınır (`executeBulkMove`).
- **Döngüsel Koruma (Circular Move Prevention):**
  - Bir klasör kendi içine veya kendi alt klasörlerinin (descendants) içine sürüklenip bırakılamaz (`canDrop: false`).

## 4. Mobil ve Dokunmatik Etkileşim (Touch & Gestures)

- **500ms Long-Press:** Dokunmatik cihazlarda karta 500ms basılı tutulduğunda haptik titreşim verilir ve çoklu seçim moduna girilir.
- **8px Kayma Toleransı:** Kullanıcı parmağını basılı tutarken 8px'den fazla kaydırırsa long-press iptal edilir ve doğal dikey sayfa kaydırma serbest bırakılır.
- **Erken Bırakma:** 500ms dolmadan parmak kaldırılırsa normal tekil dokunma (dosya önizleme veya klasöre girme) çalışır.
- **Mobil Seçim Modu:** Seçili en az 1 öğe varken mobil seçim çubuğu altta belirir; bu moddayken kartlara dokunmak dosyayı açmak yerine seçimi toggle eder.
