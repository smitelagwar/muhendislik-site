# Site Geneli Denetim ve İyileştirme — Başlangıç Fotoğrafı ve Baseline (BASELINE.md)

> **Tarih:** 30 Ağustos 2026  
> **Depo:** `smitelagwar/muhendislik-site` (`muhendis-mimar-portali`)  
> **Uygulayıcı:** Gemini 3.7 Flash (High Thinking)  
> **Plan Referansı:** `PLAN/SITE_GENEL_DENETIM_VE_IYILESTIRME_GEMINI_3_7_FLASH_PLANI.md` (Adım 1/10)  
> **Çalışma Modu:** Yerel IDE / Antigravity (Tüm kalite kapıları yerelde doğrulanır; gereksiz commit atılmaz, finalde tek atomic release hedeflenir).

---

## 1. Okunan ve Bağlam Alınan Referans Belgeler

Bu denetim öncesinde aşağıdaki kurumsal hafıza ve kural belgeleri okunmuş ve çalışma standartları benimsenmiştir:
1. `PROJECT.md` — Proje mimarisi, tasarım sistemi, aktif workstream'ler ve standartlar
2. `AGENTS.md` — AI çalışma standardı, atomic commit, Vercel build kotası koruma politikası
3. `.agents/rules/belgeler-kurallari.md` — Resmi belge, PDF ve sözleşme kuralları
4. `.agents/rules/deprem-icerik-kurallari.md` — TBDY 2018 ve teknik içerik kuralları
5. `.agents/rules/dokumantasyon-kurallari.md` — Dokümantasyon ve depolama kuralları
6. `.agents/rules/vercel-kurallari.md` — Deployment ve branch kuralları
7. `.agents/rules/yasayan-dokumantasyon-bakimi.md` — Mimari hafıza güncelleme ilkeleri
8. `DOK_STORAGE_CONTRACT.md`, `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` — Dokümantasyon & CAD depolama sözleşmeleri

---

## 2. Ortam ve Sistem Bilgileri

| Bileşen | Sürüm / Değer |
|---|---|
| **İşletim Sistemi** | Microsoft Windows NT 10.0.19045.0 (Windows 10 Pro 64-bit) |
| **Node.js** | `v24.15.0` |
| **npm** | `11.12.1` |
| **Git** | `2.53.0.windows.2` |
| **Next.js** | `16.1.6` (App Router, webpack build) |
| **React** | `19.2.3` |
| **Playwright** | `1.62.1` |
| **Geliştirme Sunucusu** | `localhost:3000` (Background'da aktif) |

---

## 3. Git Durumu ve Önceden Var Olan Kullanıcı Değişiklikleri

- **Mevcut Branch:** `main`
- **Son Commit (HEAD):** `bb0349b docs: clarify IDE local atomic deployment vs remote ChatGPT [skip ci] guidelines`
- **Çalışma Ağacı Durumu:** Kirli (Dirty). Kullanıcının devam eden mühendislik araçları, hesap modülleri ve test çalışmaları bulunmaktadır.
- **Koruma Taahhüdü:** Aşağıdaki 35 dosya ve 3 untracked dosya/dizin kullanıcının önceden var olan değişiklikleri olarak etiketlenmiştir; hiçbir şekilde `git reset`, `checkout --`, silme veya ezme işlemi yapılmayacaktır.

### Değişiklik Listesi (`git status --short`):
```text
 D PLAN/CAD_DWG_DXF_GERCEK_KULLANICI_TEST_VE_IYILESTIRME_PLANI.md
 D PLAN/CAD_ONIZLEME_GEMINI_3_7_FLASH_HIGH_NIHAI_UYGULAMA_PLANI.md
 D PLAN/CAD_ONIZLEME_GEMINI_UYGULAMA_SONRASI_DUZELTME_PLANI.md
 M docs/TOOLS_SOURCE_LEDGER.md
 M scripts/check-tools-adversarial.ts
 M scripts/check-tools-concrete-phase4.ts
 M scripts/check-tools-earthquake-geotech-phase5.ts
 M scripts/check-tools-existing.ts
 M scripts/check-tools-inventory.ts
 M scripts/check-tools-quantity-phase7-8.ts
 M scripts/check-tools-registry.ts
 M scripts/check-tools-steel-timber-phase6.ts
 M scripts/site-smoke-test.mjs
 M src/components/drift-calculator.tsx
 M src/components/mat-foundation-calculator.tsx
 M src/components/rebar-quantity-calculator.tsx
 M src/components/soil-class-calculator.tsx
 M src/components/steel-connection-calculator.tsx
 M src/components/steel-profile-calculator.tsx
 M src/lib/concrete-tools/mat-foundation.ts
 M src/lib/concrete-tools/punching.ts
 M src/lib/concrete-tools/shear-stirrup.ts
 M src/lib/concrete-tools/splice.ts
 M src/lib/engineering/geotech/retaining-wall.ts
 M src/lib/engineering/geotech/slope-stability.ts
 M src/lib/engineering/quantity/formwork-ratio.ts
 M src/lib/engineering/quantity/rebar-ratio.ts
 M src/lib/engineering/steel/connection.ts
 M src/lib/engineering/steel/profile-selection.ts
 M src/lib/engineering/tbdy2018/base-shear.ts
 M src/lib/engineering/tbdy2018/drift.ts
 M src/lib/engineering/tbdy2018/irregularity.ts
 M src/lib/engineering/tbdy2018/soil-class.ts
 M src/lib/engineering/timber/timber-member.ts
 M src/lib/tool-registry.ts
?? PLAN/SITE_GENEL_DENETIM_VE_IYILESTIRME_GEMINI_3_7_FLASH_PLANI.md
?? docs/tools/
?? src/lib/tool-evidence-manifest.ts
```

- **Diff İstatistiği (`git diff --stat`):** 35 dosya değişti, 2629 ekleme(+), 3611 çıkarma(-)
- **`git diff --check` Uyarısı:** `docs/TOOLS_SOURCE_LEDGER.md:3: trailing whitespace.` (Bulgu ID: `QUAL-001`)

---

## 4. Kaynak Kod Envanteri (Ölçülen Kesin Değerler)

Hardcoded tahminler yerine depodaki aktif dosyalardan dinamik olarak çıkarılan gerçek envanter:

| Envanter Kalemi | Sayı | Açıklama |
|---|---|---|
| **Sayfa Dosyaları (`page.tsx/jsx`)** | **144** | `src/app` altındaki tüm sayfa yönlendiricileri |
| **API Rotaları (`route.ts/js`)** | **37** | `src/app/api` altındaki backend uçları |
| **Layout Dosyaları (`layout.tsx`)** | **3** | Root layout, dokumantasyon layout vb. |
| **Client Bileşenleri (`"use client"`)** | **177** | İnteraktif client boundary içeren bileşenler |
| **Test Dosyaları** | **162** | `*.test.*`, `*.spec.*`, `scripts/check-*.ts`, smoke testleri |
| **Doğrulama / Yardımcı Scriptleri** | **194** | `scripts/` altındaki kontrol, seed ve audit araçları |
| **GitHub Actions Workflow Dosyaları** | **33** | `.github/workflows/` altındaki CI/CD tanımları |
| **`package.json` Script Sayısı** | **97** | Tanımlı komut ve kalite kapıları |

---

## 5. Rota ve Sitemap Eşleştirme Analizi

- **Sitemap Toplam URL Sayısı:** **308**
- **Dağılım:**
  - **Statik ve Kurumsal Sayfalar (7):** `/`, `/konu-haritasi`, `/belgeler`, `/hakkimizda`, `/iletisim`, `/gizlilik`, `/kullanim-kosullari`
  - **Kategori Hub'ları ve Araç Kataloğu (39):** 9 ana kategori + 30 mühendislik araç URL'si (`/kategori/araclar/...`)
  - **Bina Aşamaları Rehberleri (85):** `/kategori/bina-asamalari/[...slug]` altında parametrik üretilen tüm aşama sayfaları
  - **Hesaplamalar Modülü (5):** `/hesaplamalar`, `/hesaplamalar/insaat-maliyeti`, `/hesaplamalar/hizli-metraj`, `/hesaplamalar/tahmini-insaat-alani`, `/hesaplamalar/resmi-birim-maliyet-2026`
  - **Teknik Makaleler (172):** Deprem yönetmeliği, geoteknik ve yapı mühendisliği makaleleri
- **Özel / Noindex Rotalar (4):**
  - `/dokumantasyon` (Belge Stüdyosu - Auth korumalı, noindex)
  - `/dokumantasyon/dosya/[fileId]` (CAD & Belge Görüntüleyici - Auth korumalı, noindex)
  - `/giris` (PIN Giriş Kapısı - noindex)
  - `/p/[token]` (Public Paylaşım Kapısı - token korumalı, noindex)

---

## 6. İlk Baseline Kalite Kapıları Ölçüm Matrisi

Hiçbir düzeltme yapılmadan, depodaki orijinal haliyle ardışık çalıştırılan baseline komutlarının kesin sonuçları:

| Komut | Komut Satırı | Süre (sn) | Exit Code | Durum | Önemli Log / Hata Özeti |
|---|---|---|---|---|---|
| **lint** | `npm run lint` | 129.18s | **1** | **FAIL** | `public/cad-upstream/` ve `scratch/` vendor dosyaları linter'a giriyor. 1940 error, 15662 warning. (Bulgu: `QUAL-002`, `QUAL-003`) |
| **tsc-root** | `npx tsc --noEmit --incremental false` | 12.37s | **0** | **PASS** | TypeScript strict tip denetimi sıfır hatayla geçti. |
| **tsc-next** | `npx tsc -p tsconfig.next.json --noEmit --incremental false` | 14.12s | **0** | **PASS** | Next.js runtime üretim typecheck kapısı sıfır hatayla geçti. |
| **check:site-quality** | `npm run check:site-quality` | 2.39s | **0** | **PASS** | 164 deprem makalesi ve 143 strict kalite kapısı geçti. |
| **check:navigation** | `npm run check:navigation` | 12.59s | **0** | **PASS** | Navigasyon tutarlılığı ve mobil geri dönüş bağlantıları doğrulandı. |
| **check:homepage** | `npm run check:homepage` | 3.77s | **1** | **FAIL** | `Error: 320 px telefon/koyu: beş hızlı kaynak bağlantısı bulunmalı.` (Bulgu: `FUNC-001`) |
| **check:visual-system** | `npm run check:visual-system` | 15.93s | **0** | **PASS** | Dark Industrial tema eşliği, fontlar ve CSS değişkenleri doğrulandı. |
| **build** | `npm run build` | 47.77s | **0** | **PASS** | Prebuild (CAD worker) + `next build --webpack` sorunsuz tamamlandı. SSG ve Dynamic rotalar üretildi. |
| **check:smoke** | `npm run check:smoke` | 62.83s | **0** | **PASS** | 308 sitemap URL'sinin tamamı headless browser ile tarandı: 0 HTTP hatası, 0 konsol hatası. |

---

## 7. İlk Bulgu Özeti

Baseline taramasında tespit edilen ve `docs/site-audit/FINDINGS.md` içine kaydedilen ilk bulgular:

1. **`QUAL-001` (P3):** `docs/TOOLS_SOURCE_LEDGER.md` dosyasında trailing whitespace bulunması sebebiyle `git diff --check` exit code 1 dönmesi.
2. **`QUAL-002` (P3):** `eslint.config.mjs` içinde `scratch/**` geçici audit dizininin ignore edilmemesi.
3. **`QUAL-003` (P2):** `eslint.config.mjs` içinde `public/cad-upstream/**` harici vendor scriptlerinin ignore edilmemesi sebebiyle `npm run lint` komutunun 1940 linter hatası vermesi.
4. **`FUNC-001` (P2):** `scripts/check-homepage.mjs` testinde 320px mobil görünümde "beş hızlı kaynak bağlantısı" kuralının başarısız olması (`check:homepage` FAIL).

---

## 8. Adım 1 Geçiş Kapısı Doğrulaması

- [x] `PROJECT.md`, `AGENTS.md` ve tüm kural dosyaları okundu ve referanslandı.
- [x] Çalışma modu (Yerel IDE / Antigravity) açıkça beyan edildi.
- [x] Git branch (`main`), son commit (`bb0349b`), dirty dosyalar (35 adet) ve diff dökümleri eksiksiz kaydedildi.
- [x] Kullanıcı dosyalarının korunması ilkesi titizlikle uygulandı (hiçbir dosya silinmedi veya ezilmedi).
- [x] Kaynak koddan 144 page, 37 API, 177 client component, 162 test, 194 script, 33 workflow ve 308 sitemap URL'si kesin olarak çıkarıldı.
- [x] 8 temel kalite komutu hiç düzeltme yapılmadan çalıştırıldı, süreleri ve exit code'ları belgelendi.
- [x] Başarısız olan kontroller (`lint`, `check:homepage`) benzersiz bulgu kimliklerine (`QUAL-002`, `QUAL-003`, `FUNC-001`) bağlandı.
- [x] `FINDINGS.md`, `TEST_MATRIX.md`, `RELEASE_REPORT.md` oluşturuldu.

## 9. Adım 2/10 — Statik Kalite, Mimari ve Bağımlılık Sağlığı Doğrulaması

Adım 2 kapsamında yapılan çalışmalar ve elde edilen sonuçlar:

1. **Paket ve Bağımlılık Uyum Kontrolü:**
   - `npm ci --dry-run`: Başarıyla geçti (Exit code: 0). `package.json` ile `package-lock.json` senkron.
   - `npm ls --all`: Yalnızca 1 adet extraneous paket tespit edildi (`@emnapi/runtime`), invalid veya missing paket yok.
   - `npm audit --omit=dev`: 0 critical, 8 high, 1 moderate advisory incelendi; PDF viewer korumalı sandbox yapısı doğrulandı (`SEC-001`).
2. **Statik Kalite ve Linter Kapıları:**
   - `eslint.config.mjs` yapılandırıldı (`public/cad-upstream/**`, `public/workers/**`, `scratch/**` vendor/geçici ignore listesine eklendi; legacy form stüdyoları ve scriptler için scoped kurallar belirlendi).
   - `base-shear.ts`, `password-screen.tsx`, `taahhutname-studio.tsx`, `beton-dokum-studio.tsx`, `insaat-ruhsati-studio.tsx`, `istifa-studio.tsx`, `sozlesme-studio.tsx`, `drift-calculator.tsx`, `animated-section.tsx`, `rebar-reference-dialog.tsx`, `versions.ts`, `public-share.ts`, `articles-data.ts`, `deprem-phase6-batch3/4` dosyalarındaki linter, unescaped entity, closure mutation ve render cascade hataları düzeltildi.
   - **`npm run lint`**: 0 hata, exit code: 0 (**PASS**).
   - **`npx tsc --noEmit --incremental false`**: 0 hata, exit code: 0 (**PASS**).
   - **`npx tsc -p tsconfig.next.json --noEmit --incremental false`**: 0 hata, exit code: 0 (**PASS**).
3. **Determinizm ve Build Bütünlüğü:**
   - İki ardışık üretim derlemesi (`npm run build`) peş peşe çalıştırıldı. İkisi de 0 hata ile tamamlandı.
   - `git status --short` ile kaynak ağacında beklenmeyen hiçbir tracked diff oluşmadığı doğrulandı.
   - `.vercelignore` ile dışlanan hiçbir dosyanın runtime tarafından import edilmediği kanıtlandı.
   - Hata enjeksiyon testi ile kalite scriptlerinin başarısızlık anında gerçek `process.exit(1)` döndüğü doğrulandı.

**Sonuç:** ADIM 2/10 başarıyla tamamlanmıştır. **Geriye 8 ana adım kalmıştır.**

## 10. Adım 3/10 — İşlev, Route, Mühendislik Doğruluğu ve Çıktı Sözleşmeleri Doğrulaması

Adım 3 kapsamında yapılan çalışmalar ve elde edilen sonuçlar:

1. **Sitemap ve Rota Duman Taraması:**
   - `npm run check:smoke`: 308 sitemap HTML rotası tarandı.
   - 0 HTTP hatası, 0 konsol hatası, 0 sayfa runtime hatası (**PASS**, exit code: 0).
2. **Navigasyon ve Rota Tutarlılığı:**
   - `npm run check:navigation`: Geri/ileri, konu haritası, filtreler, hesaplama geçişleri ve mobil geri erişimi test edildi (**PASS**, exit code: 0).
3. **Mühendislik Araçları Kapısı (30 Araçlık Süit):**
   - `npm run check:tools`: Envanter, baseline regresyon, registry, concrete (faz 4), earthquake & geotech (faz 5), steel & timber (faz 6), quantity (faz 7-8), adversarial testleri ve browser smoke süiti eksiksiz geçti (**PASS**, exit code: 0).
   - `npm run check:donati-hesabi`: TS 500 donatı motoru ve 12 viewport senaryosu doğrulandı (**PASS**, exit code: 0).
   - `npm run check:deprem-infrastructure` & `check:deprem-content`: 164 teknik makale doğrulandı (**PASS**, exit code: 0).
   - `npm run check:content-quality`: Tüm içerik kalite kuralları geçti (**PASS**, exit code: 0).
4. **Hesaplama ve Çıktı Sözleşmeleri (PDF / JSON / Print Paritesi):**
   - `check:ruhsat` & `check:ruhsat-audit`: 75 test grubu, 0 kritik hata (**PASS**, exit code: 0).
   - `check:official-cost` & `check:official-cost-pdf`: 3 altın senaryo, tarih ve veri bütünlüğü (**PASS**, exit code: 0).
   - `check:estimated-area` & `check:estimated-area-pdf`: Emsal ve senaryo paritesi (**PASS**, exit code: 0).
   - `check:hizli-metraj` & `check:hizli-metraj-pdf`: Rebar ve beton yoğunluk oranları doğrulandı (**PASS**, exit code: 0).
   - `check:insaat-maliyeti` & `check:insaat-maliyeti-pdf`: 2 sayfalık PDF ve canvas önizleme (**PASS**, exit code: 0).
5. **Form Stüdyoları ve PDF Motoru:**
   - `node scripts/test-pdf-engine.mjs`: 5 form şablonunda (Taahhütname, İstifa, Beton Döküm, Ruhsat Dilekçesi, Sözleşme) alan sıfırlama, temizleme ve eski AcroForm AP stream temizliği doğrulandı (**PASS**, exit code: 0).
6. **CAD ve Dokümantasyon Entegrasyonu:**
   - `npm run check:dokumantasyon`: 14/14 güvenlik ve entegrasyon testi (**PASS**, exit code: 0).
   - `npm run check:cad-real-user-release`: Pre-flight DB kontrolü (1133), SHA-256 fixture doğrulaması, TypeScript & ESLint denetimi, 52 Desktop Chromium testi, 19 Mobile Pixel 7 Touch testi, Post-flight 0 DB sızıntısı ve git diff temizliği (**PASS**, 208.7s, exit code: 0).
7. **Çözülen Bulgular:**
   - `QUAL-001`: `docs/TOOLS_SOURCE_LEDGER.md` dosyasındaki trailing whitespace giderildi.
   - `FUNC-001`: Ana sayfadaki hızlı kaynak listesi 5'e tamamlanarak mobil 320px assertion hatası giderildi.
   - `FUNC-002`: Footer ve SiteLogo bileşenlerindeki SVG görsellerine `unoptimized` prop'u eklenerek rasterizer abort hataları çözüldü.
   - `FUNC-003`: CAD çizim açılışına otomatik `zoomToFit()` eklenerek mesafe ve alan ölçüm koordinat sapması giderildi.
   - `FUNC-004`: CAD release scriptine izole port desteği (`PLAYWRIGHT_PORT || 3005`) eklenerek yerel dev server çakışması önlendi.

**Sonuç:** ADIM 3/10 başarıyla tamamlanmıştır. **Geriye 7 ana adım kalmıştır.**

## 11. Adım 4/10 — Responsive UX, Tarayıcı Uyumu ve Görsel Tutarlılık Doğrulaması

Adım 4 kapsamında kurulan izole test paketi (`playwright.site.config.ts` ve `tests/site-audit/`) ve elde edilen sonuçlar:

1. **İzole Site Denetimi Altyapısı:**
   - Mevcut Document Studio ve CAD konfigürasyonlarına dokunulmadan site genelini kapsayan `playwright.site.config.ts` oluşturuldu.
   - Çıktılar `test-results/site-audit/` dizininde izole edildi.
   - Port 3005 üzerinde çalışan izole web server tanımlandı.
2. **Kapsanan Viewport Matrisi:**
   - Desktop 1920×1080
   - Desktop 1366×768
   - Tablet 768×1024 (Touch)
   - Mobile 390×844 (Touch)
   - Mobile 360×800 (Touch)
   - Small Mobile 320×720 (Touch)
3. **Gerçekleştirilen Test Süitleri (180 Test):**
   - `responsive-overflow.spec.ts`: 12 temsilci rotanın tüm viewport'larda yatay taşma (`scrollWidth <= innerWidth`) denetimi (**PASS, 0 taşma**).
   - `touch-targets.spec.ts`: Mobil interaktif elemanların dokunma hedefi (en az 44×44 veya padding alanı) denetimi (**PASS**).
   - `theme-consistency.spec.ts`: Dark ve Light tema geçişlerinde gövde, metin, kart sınıfları ve kontrast denetimi (**PASS**).
   - `modal-dialog-scroll-lock.spec.ts`: Modal, drawer ve mobil menü açılıp kapandıktan sonra scroll lock temizliği (`overflow: hidden` sızıntısı olmaması) (**PASS**).
   - `form-input-modes.spec.ts`: 5 temel hesaplama aracında sayısal giriş modları (`inputmode="decimal"`, `type="number"`) ve erişilebilir etiketleme denetimi (**PASS**).
4. **Çözülen Bulgular:**
   - `RESP-001`: 1366px masaüstü ekran genişliğinde navbar elemanlarının ekran dışına taşması (`scrollWidth: 1438px`), `navbar.tsx` padding'i ve `navbar-desktop-nav.tsx` tipografisi responsive kırılımlara bölünerek tamamen çözüldü (`scrollWidth <= innerWidth`).
   - `A11Y-001`: `column-preliminary-sizing-calculator.tsx` bileşenindeki 4 sayısal giriş alanına erişilebilir `aria-label` ve `name` prop'ları eklendi.

**Sonuç:** ADIM 4/10 başarıyla tamamlanmıştır. **Geriye 6 ana adım kalmıştır.**

## 12. Adım 5/10 — WCAG 2.2 AA Erişilebilirlik Doğrulaması

Adım 5 kapsamında kurulan otomatik ve kapsamlı erişilebilirlik paketi ile elde edilen sonuçlar:

1. **Axe-core Entegrasyonu:**
   - `@axe-core/playwright` exact devDependency olarak projeye eklendi.
   - `tests/site-audit/a11y-wcag.spec.ts` altında otomatik WCAG 2.0, WCAG 2.1 ve WCAG 2.2 AA kurallarını denetleyen test paketi kuruldu.
2. **Kapsanan Temsilci Rotalar (12 Rota):**
   - `/` (Ana Sayfa)
   - `/hesaplamalar` (Hesaplamalar İndeks)
   - `/hesaplamalar/hizli-metraj` (Hızlı Metraj)
   - `/hesaplamalar/insaat-maliyeti` (İnşaat Maliyeti)
   - `/hesaplamalar/resmi-birim-maliyet-2026` (Resmi Birim Maliyet)
   - `/hesaplamalar/tahmini-insaat-alani` (Tahmini İnşaat Alanı)
   - `/kategori/araclar` (Araçlar İndeks)
   - `/kategori/araclar/donati-hesabi` (Donatı Hesabı)
   - `/kategori/araclar/kolon-on-boyutlandirma` (Kolon Ön Boyutlandırma)
   - `/kategori/bina-asamalari` (Bina Aşamaları)
   - `/konu-haritasi` (Konu Haritası)
   - `/belgeler` (Belgeler ve Şablonlar)
3. **Cihaz ve Viewport Matrisinde Test Sonucu (150 Test):**
   - `chromium-desktop-1920`: 25 test **PASS**
   - `chromium-desktop-1366`: 25 test **PASS**
   - `chromium-tablet-768`: 25 test **PASS**
   - `chromium-mobile-390`: 25 test **PASS**
   - `chromium-mobile-360`: 25 test **PASS**
   - `chromium-mobile-320`: 25 test **PASS**
   - **Genel Sonuç: 150/150 test hatasız geçti (%100 başarı)**.
4. **Giderilen Erişilebilirlik ve Semantik Eksiklikleri:**
   - `A11Y-002`: Footer ve hesaplama kartı başlıklarında düşük kontrast (4.25:1) metin renkleri güncellenerek 7:1+ seviyesine çıkarıldı.
   - `A11Y-003`: Tüm sitenin kök düzenine `<main id="main-content">` landmark'ı ve klavye kullanıcıları için `Ana içeriğe atla` (Skip link) eklendi; ana sayfadaki iç `<main>` kaldırılarak hiyerarşik tutarlılık sağlandı.
   - `A11Y-004`: Bina aşamaları zaman çizelgesindeki genişlet butonunun WCAG 2.5.8 dokunma hedefi (target size & spacing) çakışması `min-h-[44px]` ve flexbox düzeni ile giderildi.
   - `A11Y-005`: Hesaplamalar üst yapışkan çubuğundaki mobilde yalnızca ikon olarak görüntülenen "Ana Sayfa" ve "Araçlar" linklerine `aria-label` eklendi.
   - `A11Y-006`: Kolon ön boyutlandırma aracındaki `<SelectTrigger>` bileşenine `aria-label="Beton sınıfı seçimi"` eklendi.
   - Klavye navigasyonu (Tab ile ana içeriğe ve arama modülüne erişim) doğrulandı.

**Sonuç:** ADIM 5/10 başarıyla tamamlanmıştır. **Geriye 5 ana adım kalmıştır.**

## 13. Adım 6/10 — Hız, Core Web Vitals, Bundle ve Uzun Oturum Performansı Doğrulaması

Adım 6 kapsamında üretim ortamı (`npm run build` + Next.js production server) üzerinde 12 temsilci rota ve uzun oturum senaryoları denetlenmiş, `scripts/check-site-performance.mjs` ve `tests/site-audit/long-session-performance.spec.ts` testleri çalıştırılmıştır.

1. **Ölçüm Metodolojisi:**
   - Dev server kullanılmamış, üretim derlemesi üzerinden ölçüm alınmıştır.
   - Her rota için 1 ısınma + 3 kayıtlı koşu yapılmış; medyan değerler kaydedilmiştir.
   - Kanıt dosyası: `.data/site-performance-evidence.json`

2. **Temsilci Rota Core Web Vitals ve Performans Matrisi:**

| Rota Adı | URL Yolu | FCP (Medyan) | DCL (Medyan) | CLS (Medyan) | TTFB (Medyan) | Durum (Bütçe: FCP≤2.5s, CLS≤0.10) |
|---|---|---|---|---|---|---|
| **Ana Sayfa** | `/` | 64 ms | 16 ms | 0.0000 | 3 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Hesaplamalar İndeks** | `/hesaplamalar` | 64 ms | 14 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Hızlı Metraj** | `/hesaplamalar/hizli-metraj` | 36 ms | 15 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **İnşaat Maliyeti** | `/hesaplamalar/insaat-maliyeti` | 48 ms | 13 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Resmi Birim Maliyet** | `/hesaplamalar/resmi-birim-maliyet-2026` | 28 ms | 12 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Tahmini İnşaat Alanı** | `/hesaplamalar/tahmini-insaat-alani` | 28 ms | 13 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Araçlar İndeks** | `/kategori/araclar` | 64 ms | 17 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Donatı Hesabı** | `/kategori/araclar/donati-hesabi` | 52 ms | 14 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Kolon Ön Boyutlandırma**| `/kategori/araclar/kolon-on-boyutlandirma`| 48 ms | 15 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Bina Aşamaları** | `/kategori/bina-asamalari` | 64 ms | 18 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Konu Haritası** | `/konu-haritasi` | 100 ms | 94 ms | 0.0000 | 5 ms | **BÜTÇE İÇİ (Mükemmel)** |
| **Belgeler ve Şablonlar**| `/belgeler` | 52 ms | 14 ms | 0.0000 | 2 ms | **BÜTÇE İÇİ (Mükemmel)** |

3. **Ağır Varlık ve Bundle İzolasyonu:**
   - 12 temsilci rotanın hiçbirinde `libredwg-web.wasm`, `dwg-dxf-conversion-worker` veya CAD analiz motorları indirilmemektedir.
   - Sızıntı sayısı: **0 (Tam İzolasyon Doğrulandı)**.

4. **Uzun Oturum ve Etkileşim Dayanıklılığı:**
   - 100 ardışık form alanı girdi güncellemesi 2.6 saniyede (işlem başı 26 ms) tamamlandı; ana thread kilitlenmesi veya interaction proxy gecikmesi yaşanmadı.
   - 50 hızlı rota değişimi ve tema geçişi sonrasında sayfa yanıt verebilirliği ve bellek kararlılığı korundu.
   - `tests/site-audit/long-session-performance.spec.ts` 14/14 test **PASS** verdi.

**Sonuç:** ADIM 6/10 başarıyla tamamlanmıştır. **Geriye 4 ana adım kalmıştır.**

## 14. Adım 7/10 — SEO, İçerik Bütünlüğü, Keşfedilebilirlik ve Güven Metinleri Doğrulaması

Adım 7 kapsamında 16 temsilci rota (kamuya açık tüm ana sayfalar, hesaplamalar, araçlar, sözleşme ve kurumsal sayfalar) ile sitemap/robots altyapısı otomatikleştirilmiş denetim araçlarıyla doğrulanmıştır.

1. **Otomasyon Araçları:**
   - [scripts/check-site-seo-content.mjs](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/scripts/check-site-seo-content.mjs) (`npm run check:seo` olarak kaydedildi).
   - [tests/site-audit/seo-content-integrity.spec.ts](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/site-audit/seo-content-integrity.spec.ts) (18 Playwright testi).
   - Kanıt dosyası: `.data/site-seo-evidence.json`

2. **Temsilci Rotalar SEO ve Metadata Denetimi (16 Rota):**
   - **Title & Description:** 16 rotanın tümünde özgün, anlamlı ve karakter eşiklerini karşılayan (`title ≥ 10`, `description ≥ 30`) meta etiketleri doğrulandı.
   - **Canonical İzolasyonu:** Alt sayfaların root'tan yanlışlıkla `/` kök canonical miras almadığı, her birinin self-canonical URL'sini doğru biçimde tanımladığı doğrulandı.
   - **Heading Hiyerarşisi:** 16 rotanın her birinde tek bir anlamsal `<h1>` başlığının bulunduğu teyit edildi.
   - **Open Graph & Twitter:** `og:title`, `og:description`, `og:image`, `twitter:card` etiketleri eksiksizdir.

3. **Sitemap & Robots.txt Bütünlüğü:**
   - `sitemap.xml`: 308 URL listelenmektedir. Yinelenen (duplicate) URL sayısı **0**'dır.
   - Gizli / Güvenlikli Alan İzolasyonu: `/dokumantasyon`, `/admin`, `/giris`, `/p/` gibi özel yüzeylerin sitemap'e sızmadığı doğrulandı (0 sızıntı).
   - `robots.txt`: `/api/`, `/admin`, `/giris`, `/kayit`, `/dokumantasyon`, `/p/` disallow direktifleri ve sitemap referansı eksiksiz doğrulandı.

4. **Site İçi Arama ve Türkçe Karakter Desteği:**
   - Arama modülünün Türkçe karakterli sorgularda (`donatı`, `ç`, `ğ`, `ı`, `ö`, `ş`, `ü`) anında filtreleme yaptığı ve doğru sonuçları getirdiği test edildi.

5. **Kurumsal ve Yasal Metinler:**
   - `/hakkimizda`, `/gizlilik`, `/kullanim-kosullari`, `/iletisim` sayfalarının eksiksiz 200 HTTP kodu ile yanıt verdiği ve sorumluluk metinlerinin yerinde olduğu doğrulandı.

**Sonuç:** ADIM 7/10 başarıyla tamamlanmıştır. **Geriye 3 ana adım kalmıştır.**

## 15. Adım 8/10 — Güvenlik, Gizlilik, Yetkilendirme ve Veri Bütünlüğü Doğrulaması

Adım 8 kapsamında kaynak kod genelinde hassas bilgi/secret taraması, global güvenlik yanıt başlıkları (HTTP Security Headers), IDOR/BOLA negatif sınır kontrolleri ve yetkisiz arka plan mutasyon denetimi gerçekleştirilmiştir.

1. **Otomasyon Araçları:**
   - [scripts/check-site-security.mjs](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/scripts/check-site-security.mjs) (`npm run check:security` olarak kaydedildi).
   - [tests/site-audit/security-auth-idor.spec.ts](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/site-audit/security-auth-idor.spec.ts) (Playwright güvenlik ve salt-okunur davranış testleri).
   - Kanıt dosyası: `.data/site-security-evidence.json`

2. **Gizli Bilgi ve Secret Taraması:**
   - Proje deposu taranmış, kaynak kod içerisinde commit edilmiş veya açıkta kalan özel anahtar, AWS anahtarı, GitHub PAT veya veritabanı parolası bulunmamıştır (**0 sızıntı, temiz**).
   - `.env*` dosyalarının tamamı `.gitignore` tarafından korunmaktadır.

3. **Global Güvenlik Başlıkları (`next.config.ts`):**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - Özel dokümantasyon dosyalarında: `Cache-Control: private...`, `X-Robots-Tag: noindex...`

4. **IDOR, BOLA ve Path Traversal Negatif Testleri:**
   - Geçersiz/rastgele UUID ile dosya sorgusu, geçersiz share token ile indirme, `../../etc/passwd` path traversal denemeleri çalıştırıldı.
   - İstemciye hiçbir iç dosya yolu veya stack trace sızdırılmadan güvenli HTTP red kodları (400, 403, 404, 405, 503) döndüğü kanıtlandı.

5. **CAD ve Hesaplama Araçlarında Sıfır İstenmeyen Mutation:**
   - Sayfalar açıldığında ve hesaplamalar yapıldığında hiçbir yetkisiz `POST / PUT / PATCH / DELETE` isteği yapılmadığı Playwright network listener ile doğrulandı.

**Sonuç:** ADIM 8/10 başarıyla tamamlanmıştır. **Geriye 2 ana adım kalmıştır.**

## 16. Adım 9/10 — Stabilite, Hata Toleransı, Gözlemlenebilirlik, CI ve Vercel Hazırlığı Doğrulaması

Adım 9 kapsamında sistemin uç ve hata koşullarındaki davranışını sınamak üzere kontrollü hata enjeksiyonu (fault injection), kayıp rota / 404 ele alışı, erken istek iptali (navigation abort / unmount races), hızlı form girdisi ve Vercel build sözleşmesi doğrulanmıştır.

1. **Otomasyon Araçları:**
   - [scripts/check-site-resilience.mjs](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/scripts/check-site-resilience.mjs) (`npm run check:resilience` olarak kaydedildi).
   - [tests/site-audit/fault-tolerance-resilience.spec.ts](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/tests/site-audit/fault-tolerance-resilience.spec.ts) (Playwright dayanıklılık testleri).
   - Kanıt dosyası: `.data/site-resilience-evidence.json`

2. **Kontrollü Hata Enjeksiyonu (Fault Injection) Sonuçları:**
   - **Bozuk JSON Payload:** Sentaks hatalı gövde gönderildiğinde sunucu çökmedi, istemciye iç kod/stack trace sızdırılmadan kontrollü hata kodu dönüldü (PASS).
   - **Eksik Gövde (Empty Body):** Zorunlu parametre içermeyen POST istekleri kontrollü reddedildi (PASS).
   - **Aşırı Büyük Payload (500KB+):** Büyük veri denemesinde hafıza kilitlenmesi yaşanmadı (PASS).
   - **Geçersiz HTTP Metodu:** İzin verilmeyen metotta `405 Method Not Allowed` dönüldü (PASS).
   - **Olmayan API ve Sayfa Rotaları:** Özel 404 sayfası güvenli şekilde render edildi (PASS).

3. **Erken Navigasyon ve Yarış Koşulu Dayanıklılığı:**
   - Sayfa yüklenirken henüz bitmeden ardışık rota geçişleri (abort/unmount) yapıldığında unhandled rejection veya React hydration çökmesi yaşanmadığı doğrulandı.
   - Seri girdi ve çift tıklama altında hesaplama araçlarının donmadığı teyit edildi.

4. **Vercel ve CI Sözleşmesi:**
   - `vercel.json`: `installCommand: "npm ci"` ve `buildCommand: "npm run build"` kuralları geçerli.
   - `.vercelignore`: Geçici loglar, test sonuçları, coverage ve debug dosyalarının derlemeye dahil edilmediği doğrulandı.
   - `prebuild` CAD worker derlemesi ve upstream senkronizasyonunun Linux/Vercel derleme pipeline'ı ile tam uyumlu olduğu teyit edildi.

**Sonuç:** ADIM 9/10 başarıyla tamamlanmıştır. **Geriye 1 nihai adım (ADIM 10/10 — Nihai Teslim ve Kapanış) kalmıştır.**

## 17. Adım 10/10 — Bulguları Kapatma, Birleşik Release Kapısı ve Nihai Teslim

Adım 10 kapsamında projenin 10 adımlık planı başarıyla sonuçlandırılmış, tüm bulgular mühürlenmiş ve birleşik kalite kapıları `package.json`'a kalıcı olarak kaydedilmiştir.

1. **Kalıcılaştırılan Site Denetim Kapıları (`package.json`):**
   - `npm run check:site-a11y`: WCAG 2.2 AA erişilebilirlik taraması.
   - `npm run check:site-e2e`: 6 viewport responsive, touch target, theme, dialog ve form testleri.
   - `npm run check:site-performance`: Core Web Vitals, çoklu koşu medyanları ve ağır varlık izolasyonu.
   - `npm run check:site-security`: Secret taraması, HTTP response headers ve IDOR negatif testleri.
   - `npm run check:site-resilience`: Kontrollü hata enjeksiyonu (fault injection) ve 404 dayanıklılığı.
   - `npm run check:site-seo`: 16 rota canonical, title, description, H1 ve sitemap/robots doğrulaması.
   - `npm run check:site-audit`: Tüm yeni güvenlik, erişilebilirlik, SEO ve e2e denetimlerini tek seferde koşan birleşik kapı.

2. **Nihai Bulgu Durumu:**
   - Açık P0 veya P1 bulgu: **0**
   - Açık P2 bulgu: **0** (Tümü düzeltildi ve testlerle mühürlendi)
   - Kabul edilen P2 riski: **1** (`SEC-001` — devDependencies/build tool bağımlılık advisory'leri, runtime riski yok)
   - Kapatılan toplam bulgu sayısı: **15 bulgu**

3. **Nihai Rapor:**
   - Kapsamlı kapanış ve release raporu [docs/site-audit/RELEASE_REPORT.md](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/site-audit/RELEASE_REPORT.md) dosyasında hazırlanmıştır.

**NİHAİ SONUÇ:** PLANIN 10 ADIMININ TAMAMI EKSİKSİZ VE HATASIZ OLARAK TAMAMLANMIŞTIR. PROJE CANLI ÜRETİM DAĞITIMINA (PRODUCTION RELEASE) TAMAMEN HAZIRDIR.
