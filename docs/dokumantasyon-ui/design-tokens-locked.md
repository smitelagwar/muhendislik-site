# Warm Engineering Glass — Kilitli Tasarım Tokenları (Locked Design Tokens)

Bu doküman, `/dokumantasyon` modülü ve Document Studio için **UI-Faz 2** kapsamında oluşturulan ve kilitlenen resmi tasarım tokenları sözleşmesidir (Source of Truth).

Global tema (`src/app/globals.css`) değişkenleri ezilmez; `src/components/dokumantasyon/dok-workspace.module.css` içerisinde `color-mix()` ve CSS modülleri üzerinden harmonize edilir.

---

## 1. Yüzey ve Cam Hiyerarşisi (G0 – G3)

| Katman Kodu | Semantik Seviye | Değer / Formül | Blur Derinliği | Kullanım Alanı |
|---|---|---|---|---|
| **G0** | İçerik (Opaque Content) | `var(--card)` / Katı Yüzey | `0px` | PDF render yüzeyi, CAD/DXF canvas, görsel piksel alanı, saf doküman içeriği |
| **G1** | Utility / Alt Yüzey | `color-mix(in srgb, var(--card) 60%, transparent)` | `8px` | Tablo satırları, grid kartları, durum çubukları, kompakt kontroller |
| **G2** | Ana Cam (Main Shell) | `color-mix(in srgb, var(--card) 78%, transparent)` | `16px` | Çalışma alanı kabuğu, sol gezinti çubuğu (sidebar), üst komut çubuğu (command bar), detay çekmecesi |
| **G3** | Overlay Cam (Modal / Sheet) | `color-mix(in srgb, var(--card) 92%, transparent)` | `24px` | Modal diyalogları, mobil alt sayfalar (sheets), dropdown menüler, toast bildirimleri |

---

## 2. Renk ve Vurgu (Accent) Skalası

| Token Adı | Değer / Hex | Açıklama | WCAG Kuralları |
|---|---|---|---|
| `--dok-accent-solid` | `#f59e0b` (Amber 500) | Ana eylem butonu (CTA), aktif seçim göstergeleri, yıldızlama | Yalnızca buton, ikon ve rozetlerde kullanılır. Uzun gövde metninde kullanılmaz. |
| `--dok-accent-soft` | `color-mix(in srgb, #f59e0b 12%, transparent)` | Seçili satır/kart arka planı, aktif menü hapı (pill) | Arka plan vurgusu olarak kullanılır. |
| `--dok-accent-hover` | `#d97706` (Amber 600) | Primary buton ve interaktif öğelerin hover durumu | — |
| `--dok-border-soft` | `color-mix(in srgb, var(--border) 60%, transparent)` | Standart panel ve kart sınırları | İnce, düşük kontrastlı ayrım. |
| `--dok-border-strong` | `color-mix(in srgb, var(--border) 90%, transparent)` | Odaklanmış veya aktif kart sınırları | — |
| `--dok-border-glow` | `color-mix(in srgb, #f59e0b 22%, transparent)` | Hover edilen kartlar ve aktif elemanların ışıma sınırı | — |
| `--dok-inner-highlight` | `inset 0 1px 0 0 color-mix(in srgb, #ffffff 18%, transparent)` | Üst kenar iç ışık yansıması (rim light) | Cam panellerin üst sınırına derinlik katar. |

---

## 3. Ambiyans Zemin ve Gölgeler (Ambient Lighting)

### 3.1 Zemin Gradyanları
```css
background:
  radial-gradient(circle at 10% 4%, color-mix(in srgb, #f59e0b 8%, transparent), transparent 30rem),
  radial-gradient(circle at 92% 95%, color-mix(in srgb, #38bdf8 6%, transparent), transparent 32rem),
  var(--background);
```

### 3.2 Gölgeler
- **`--dok-shadow-ambient`:** `0 24px 70px -15px color-mix(in srgb, #09090b 14%, transparent), 0 0 0 1px var(--dok-border-soft)`
- **`--dok-shadow-card`:** `0 10px 30px -8px color-mix(in srgb, #09090b 9%, transparent), 0 0 0 1px var(--dok-border-soft)`
- **`--dok-shadow-overlay`:** `0 30px 90px -20px color-mix(in srgb, #000000 45%, transparent)`

---

## 4. Standart Z-Index Skalası

| Token | Z-Index | Kapsadığı Katman |
|---|---|---|
| `--dok-z-base` | `1` | Normal akış, kartlar ve içerik listeleri |
| `--dok-z-sticky` | `20` | Yapışkan üst başlıklar, tablo başlıkları |
| `--dok-z-dropdown` | `40` | 3-nokta menüleri, context menüler, autocomplete listeleri |
| `--dok-z-floating-bar` | `50` | Seçim aksiyon çubuğu (floating bar) |
| `--dok-z-drawer` | `60` | Masaüstü sağ detay çekmecesi |
| `--dok-z-mobile-sheet` | `70` | Mobil sol menü ve alt detay sayfası |
| `--dok-z-modal` | `90` | Modal diyalog pencereleri ve arama modalı |
| `--dok-z-toast` | `100` | Yükleme sırası ve floating toast bildirimleri |

---

## 5. Erişilebilirlik ve Performans Garantileri

1. **Backdrop-Filter Fallback:**
   - `backdrop-filter` desteklemeyen eski tarayıcılarda paneller katı `var(--card)` arka planına düşer.
2. **Reduced Motion:**
   - `prefers-reduced-motion: reduce` ayarında tüm kart hover çevrimleri anlık çalışır.
3. **Dokunmatik Hedefler:**
   - Mobilde tüm interaktif butonlar minimum 44×44 CSS px alanına sahiptir.
4. **Kontrast:**
   - Light temada metin rengi koyu gri/siyah (`--foreground`), dark temada açık gri/beyaz (`#f5f5f5`) olarak kilitlenmiştir.
