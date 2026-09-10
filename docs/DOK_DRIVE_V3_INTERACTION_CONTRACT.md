# DÖKÜMANTASYON DRIVE V3.1 — ETKİLEŞİM SÖZLEŞMESİ (INTERACTION CONTRACT)

Bu belge, Drive V3.1 dosya yöneticisi arayüzündeki tüm kullanıcı etkileşimlerinin kesin ve kilitli davranış kurallarını tanımlar.

## 1. Tıklama ve Seçim Modeli

| Eylem | Davranış | Anchor & Focus |
|---|---|---|
| **Tek Tık (Sol Tık)** | Önceki tüm seçimi temizler, yalnızca tıklanan öğeyi seçer. | `anchorId = item.id`, `focusedId = item.id` |
| **Ctrl / Cmd + Sol Tık** | Önceki seçimi korur; tıklanan öğenin seçim durumunu tersine çevirir (additive toggle). | `focusedId = item.id`, anchor tıklanan öğeye güncellenir |
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

## 4. Mobil etkileşim — 10 Eylül 2026 yerel sertleştirme

Layout sınırı `(max-width: 1023px)`; touch/pen kökenli contextmenu koruması geniş ekranlarda da geçerlidir. `explorer-activation.ts` liste, kart, dosya adı, çift tıklama ve seçim kontrolünün ortak policy kaynağıdır.

| Durum / giriş | Sonuç |
|---|---|
| Normal mod: dosya adı veya gövde | Tek navigasyon ile aç |
| Normal mod: klasör | Klasöre gir |
| Seç düğmesi | Boş seçimle açık seçim moduna gir |
| Seçim modu: ad / gövde / checkbox | Tek kez toggle; navigasyon yok |
| Normal mod: checkbox / Tümünü Seç | Gizli; programatik handler da korumalı |
| Mobil çift tıklama | Ek açma işlemi yok |
| Touch/pen contextmenu, uzun basma | Gizli seçim / navigasyon yok |
| ⋮ veya alt işlem düğmesi | Yalnız ilgili çocuk eylemi |
| Çık / Escape | Seçim ve mod temizlenir; odak Seç düğmesine döner |
| 1024px sınırını iki yönden geçme | Eski seçim oturumu temizlenir |
| Aynı breakpoint içindeki döndürme | Seçim korunur, alan yeniden ölçülür |

Masaüstü marquee motoru ve native drag yolu korunur; dar görünümde kayıt edilmez. Mobil Ctrl+A normal modda seçim başlatmaz; seçim modunda mevcut görünümü seçer. Selection state `aria-pressed` ve kalıcı `aria-live` ile duyurulur. 44×44 CSS px, projenin geliştirilmiş dokunma hedefi standardıdır.

Timer/haptik long-press motoru ve üreticisi kalmamış synthetic click suppression kaldırılmıştır. Mobil CAD ön yükleme yalnız doğrulanmış açma niyetinde çalışır; kaydırma başlangıcı motoru ısıtmaz.

## 5. Görsel yerleşim

Mobil shell `100dvh` içinden ölçülen navbar yüksekliğini çıkarır. Liste satırı 56px kalır. Tek scroll viewport küçülebilir flex çocuğudur; dock bu viewport sonrasında normal DOM akışındadır. Global sabit alt gezinme / başa dön kontrolleri dokümantasyon alanında gizlidir. 500px ve altı ekran yüksekliğinde modül başlığı görsel olarak gizlenir, erişilebilir h1 korunur.

Masaüstü dock da viewport sonrasında normal akıştadır. Mouse sağ tık mevcut seçim semantiğini korur; açılır eylem menüsünün açık giriş noktası ⋮ düğmesidir.
