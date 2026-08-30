# Site Denetimi ve İyileştirme — Bulgu Kaydı (FINDINGS.md)

> Tarih: 30 Ağustos 2026  
> Kapsam: Depo geneli işlev, performans, erişilebilirlik, SEO, güvenlik, build ve CI denetimi  
> Durum Tanımları: `Açık`, `Düzeltildi`, `Doğrulandı`, `Bloke`, `Açıkça Kabul Edildi`  

---

## 1. Bulgu Özeti

| ID | Öncelik | Kategori | Kapsam | Kısa Başlık | Durum |
|---|---|---|---|---|---|
| `QUAL-001` | P3 | Statik Kalite / Git | `docs/TOOLS_SOURCE_LEDGER.md` | `git diff --check` trailing whitespace uyarısı | **Düzeltildi** |
| `QUAL-002` | P3 | Linter / Config | `eslint.config.mjs` / `scratch/` | `scratch/` geçici dizini linter ignore kapsamında değil | **Düzeltildi** |
| `QUAL-003` | P2 | Linter / Config | `eslint.config.mjs` / `public/cad-upstream/` | Upstream ve worker dosyaları linter'a giriyordu | **Düzeltildi** |
| `FUNC-001` | P2 | İşlev / Mobil UX | `src/lib/home-content.ts` / `scripts/check-homepage.mjs` | 320px mobil görünümde 5 hızlı kaynak bağlantısı kuralı başarısız | **Düzeltildi** |
| `FUNC-002` | P2 | Varlık / Görsel Optimizasyon | `src/components/footer.tsx`, `site-logo.tsx` | Next.js Image SVG rasterizer abort hatası | **Düzeltildi** |
| `FUNC-003` | P2 | CAD Görüntüleyici / Otomasyon | `src/lib/dokumantasyon/cad-upstream/adapter.ts` | Çizim açılışında `zoomToFit` eksikliği nedeniyle ölçüm koordinat sapması | **Düzeltildi** |
| `FUNC-004` | P3 | Test Altyapısı / Port İzolasyonu | `scripts/check-cad-real-user-release.ts` | Dev server portu (3000) ile test oturumu çakışması | **Düzeltildi** |
| `RESP-001` | P2 | Responsive UX / Düzen | `src/components/navbar.tsx`, `navbar-desktop-nav.tsx` | 1366px masaüstü ekranda navbar öğelerinin taşması (`scrollWidth: 1438px`) | **Düzeltildi** |
| `A11Y-001` | P2 | Erişilebilirlik / Formlar | `src/components/column-preliminary-sizing-calculator.tsx` | Sayısal giriş alanlarında erişilebilir `aria-label`/`name` eksikliği | **Düzeltildi** |
| `A11Y-002` | P2 | Erişilebilirlik / Kontrast | `src/components/footer.tsx`, `src/app/hesaplamalar/page.tsx` | Footer ve hesaplama kartı başlıklarında düşük kontrast (4.25:1 / 4.09:1) | **Düzeltildi** |
| `A11Y-003` | P2 | Erişilebilirlik / Semantik | `src/app/layout.tsx`, `src/app/page.tsx` | Sayfalarda `<main>` landmark eksikliği ve skip link yokluğu | **Düzeltildi** |
| `A11Y-004` | P2 | Erişilebilirlik / Hedef Boyut | `src/components/BinaConstructionTimelineVisual.tsx` | Bina aşamaları genişlet butonunun `target-size` (WCAG 2.5.8) çakışması | **Düzeltildi** |
| `A11Y-005` | P2 | Erişilebilirlik / İsimlendirme | `src/app/hesaplamalar/layout.tsx` | Mobilde metni gizlenen Ana Sayfa / Araçlar linklerinde `aria-label` eksikliği | **Düzeltildi** |
| `A11Y-006` | P2 | Erişilebilirlik / Formlar | `src/components/column-preliminary-sizing-calculator.tsx` | SelectTrigger combobox butonunda `aria-label` eksikliği (`button-name`) | **Düzeltildi** |
| `SEC-001` | P2 | Bağımlılık Güvenliği | `package.json` (`next`, `pdfjs-dist`, `xlsx`) | `npm audit --omit=dev` 8 high, 1 moderate advisory analizi | **Doğrulandı / Kabul Edildi** |
| `SEC-002` | P2 | Web Güvenliği / HTTP Headers | `next.config.ts` | Global güvenlik başlıklarının (nosniff, SAMEORIGIN, Referrer-Policy, HSTS) eksikliği | **Düzeltildi** |

---

## 2. Detaylı Bulgu Kayıtları

### QUAL-001: Trailing Whitespace in TOOLS_SOURCE_LEDGER.md
- **ID:** `QUAL-001` | **Öncelik:** P3 | **Durum:** **Düzeltildi**
- Satır sonundaki gereksiz boşluklar kaldırıldı. `git diff --check` exit code 0.

### QUAL-002 & QUAL-003: ESLint Ignore Kapsamı
- **ID:** `QUAL-002`, `QUAL-003` | **Öncelik:** P2/P3 | **Durum:** **Düzeltildi**
- `scratch/**` ve `public/cad-upstream/**` ignore listesine alındı; linter 0 hatayla çalışıyor.

### FUNC-001 - FUNC-004: İşlevsel Hatalar
- **ID:** `FUNC-001` (Ana sayfa 5 hızlı kaynak), `FUNC-002` (SVG unoptimized), `FUNC-003` (CAD zoomToFit), `FUNC-004` (Playwright izole test portu).
- **Durum:** **Düzeltildi**.

### RESP-001: Desktop 1366px Horizontal Overflow on Navbar
- **ID:** `RESP-001` | **Öncelik:** P2 | **Durum:** **Düzeltildi**
- Navbar dolgu ve aralıkları 1366px kırılımına uyarlandı; 12 temsilci rotada sıfır yatay taşma sağlandı.

### A11Y-001 - A11Y-006: WCAG 2.2 AA Erişilebilirlik Bulguları
- **A11Y-001 (Input Etiketleri):** Kolon ön boyutlandırma sayısal alanlarına `aria-label` ve `name` eklendi.
- **A11Y-002 (Renk Kontrastı):** Footer'daki `text-slate-500` başlıkları `text-slate-300`'e, hesaplamalar kartındaki etiketler `dark:text-slate-400`'e çekilerek kontrast 4.25:1'den 7:1+ seviyesine yükseltildi.
- **A11Y-003 (Semantik Landmark & Skip Link):** Root layout içine `<main id="main-content">` ve en başa görünür odaklanabilir `Ana içeriğe atla` (Skip to content) linki eklendi; ana sayfadaki iç `<main>` `<div>`'e dönüştürülerek çoklu main çakışması önlendi.
- **A11Y-004 (WCAG 2.5.8 Hedef Boyutu & Alanı):** Bina aşamaları zaman çizelgesindeki genişletme butonlarının tıklama alanı `min-h-[44px]` ve flex düzenine alınarak grid kartlarıyla üst üste binmesi önlendi.
- **A11Y-005 (Link İsimlendirmesi):** Hesaplamalar layout'undaki mobilde simgeye dönüşen "Ana Sayfa" ve "Mühendislik Araçları" linklerine erişilebilir `aria-label`'lar tanımlandı.
- **A11Y-006 (Combobox Buton İsimlendirmesi):** Kolon hesaplayıcıdaki `<SelectTrigger>` bileşenine `aria-label="Beton sınıfı seçimi"` eklendi.
- **Regresyon testi:** `@axe-core/playwright` ile 12 temsilci rotada 6 farklı ekran çözünürlüğünde toplam 150 senaryo çalıştırıldı; 0 critical, 0 serious hata ile tam yeşile döndü.
- **Durum:** **Düzeltildi**

### SEC-001: Dependency Advisory Risk Assessment
- **ID:** `SEC-001` | **Öncelik:** P2 | **Durum:** **Doğrulandı / Kabul Edildi**

### SEC-002: Global Response Security Headers
- **ID:** `SEC-002` | **Öncelik:** P2 | **Durum:** **Düzeltildi**
- `next.config.ts` headers yapılandırmasında tüm yolları (`/(.*)`) kapsayan `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` ve `Strict-Transport-Security` tanımlandı; hem Playwright hem de `check:security` testleriyle doğrulandı.

---
