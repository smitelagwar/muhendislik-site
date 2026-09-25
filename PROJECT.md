# PROJECT.md — muhendislik-site

> Bu dosya projenin tek gerçek kaynağıdır. CLAUDE.md, AGENTS.md ve GEMINI.md bu dosyayı referans alır.
> Herhangi bir tool (Claude Code, Codex, Gemini CLI) bu dosyayı session başında otomatik yükler.

---

## Proje Kimliği

| Alan | Değer |
|------|-------|
| **Site** | muhendislik-site.vercel.app |
| **Repo** | github.com/smitelagwar/muhendislik-site |
| **Framework** | Next.js 16 App Router, React 19, TypeScript |
| **Stil** | Tailwind CSS 4 |
| **Görselleştirme** | D3.js |
| **Deployment** | Vercel; main branch doğrulanmış tek atomic push ile otomatik production deploy, uzaktan/ChatGPT çalışmaları branch/[skip ci] korumalı |
| **Production build** | `npm run build` → `next build --webpack`; CAD worker/WASM/font senkronu `prebuild` ile çalışır. Tailwind utility taraması `src/` ile, Next production typecheck'i `tsconfig.next.json` üzerinden runtime kaynaklarıyla sınırlıdır; genel `tsconfig.json` script/test kalite kapılarını kapsamaya devam eder. |
| **Hedef kitle** | Türk inşaat / yapı mühendisleri |

---

## Kullanılan Tool'lar ve Sistemler

Bu proje aşağıdaki AI araçlarıyla birlikte yönetilmektedir:

| Tool | Wrapper | Rol |
|------|---------|-----|
| **Claude Code** | `CLAUDE.md` | Planlama, analiz, kod yazımı |
| **OpenAI Codex** | `AGENTS.md` | Otonom kod yazımı |
| **Gemini CLI** | `GEMINI.md` | Alternatif model, multimodal görevler |
| **GSD (get-shit-done)** | `.claude/commands/gsd/` | Proje yönetimi, faz planlaması |
| **Antigravity Skills** | `~/.gemini/antigravity/skills/` | Skill tabanlı görevler |

### GSD Workflow

Bu projede [GSD](https://github.com/gsd-build/get-shit-done) sistemi aktif olarak kullanılmaktadır.
Faz bazlı çalışma: `discuss-phase` → `plan-phase` → `execute-phase` → `verify-work`
Planlama dosyaları `.planning/` klasöründe tutulur.

### Antigravity Skills Referansı

Global skill deposu: [github.com/sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)
Kurulum yolu: `~/.gemini/antigravity/skills/`

**skiller ile ilgili bilmen gerekenler**

skillerin hepsi zaten githubtan alındı ve dosyalar arasında var. dolayısıyla internette aramana gerek yok.
skiller için muhendis-mimar-portali\.agent  ve muhendis-mimar-portali\get-shit-done  kısımlarından yararlan. Bunları tara ve ihtiyacın olabilecek şeyleri al.
skilleri otomatik olarak verdiğim işin konusuna ve ihtiyacına göre sen belirle.
---

## Mimari

```
muhendislik-site/
├── src/
│   ├── app/                # Next.js App Router ve global stiller
│   ├── components/         # Paylaşılan React componentleri
│   └── lib/                # Veri, utility ve hesap modülleri
├── docs/                   # Teknik karar ve uygulama kayıtları
├── public/                 # Statik dosyalar
├── scripts/                # Smoke ve doğrulama scriptleri
└── PROJECT.md              # Proje özeti
```

---

## Tasarım Sistemi

### Tema: Dark Industrial

```css
--bg-primary:     #0a0a0a   /* Ana arka plan */
--bg-secondary:   #111111   /* Kart / panel */
--bg-tertiary:    #1a1a1a   /* Hover / aktif */
--accent-primary: #f59e0b   /* Amber — ana vurgu */
--accent-secondary: #3b82f6 /* Mavi — ikincil vurgu */
--text-primary:   #f5f5f5
--text-secondary: #a3a3a3
--border:         #262626
```

**Kritik:** Dark Industrial görsel kimliği korunur; uygulama mevcut light/dark tema desteğiyle birlikte çalışır. Tema eşliğini bozan tek taraflı renk kullanımı yapılmaz.

### Tipografi
- Başlıklar: `font-bold` / `font-extrabold`
- Teknik değerler / sonuçlar: `font-mono`
- Türkçe subset zorunlu: `latin-ext` (ğ, ş, ç, ı, ö, ü için)

### Global Navigasyon — Sadeleştirme Aşama 4
- Mobil alt bar kesin sıra: **Ana Sayfa / Ara / Araçlar / Belgeler / Dokümantasyon**.
- Mobil hamburger sıra: **Ana Sayfa / Mevzuat / Hesaplamalar / Araçlar / Belgeler / Dokümantasyon / İletişim**.
- Masaüstü ana nav, hamburger ile aynı mühendislik bilgi mimarisini kullanır; **İletişim** yardımcı sayfa olarak drawer'da kalır.
- Masaüstü arama makale/rehber sayfalarında da header içinde erişilebilir kalır.
- Mobil alt bar `env(safe-area-inset-bottom)` kullanır; akış spacer'ı ve kayan kontrol ofseti içeriğin/barın üst üste binmesini önler.
- Navigasyon kaynakları `src/lib/navigation-config.ts` üzerinden türetilir; eski Konu Haritası, Kaydedilenler, Yapı/Şantiye/Bina Aşamaları ana yüzeyleri geri eklenmez.

### UX Sadeleştirme — Aşama 5
- Ana hero'daki hesaplama/araç/içerik sayaç rayı kaldırılmıştır; arama ve ana hesaplama CTA'sı korunur.
- Tekrarlayan `HomeWorkflowBand` kaldırılmıştır; aynı hedeflere hesap/araç alanı, ana navigasyon ve canonical rehber bağlantılarından erişilmeye devam edilir.
- Yalnız dekoratif geniş-ekran `HomeScrollLogo` runtime katmanı kaldırılmıştır; normal navbar logosu korunur.
- Hero ve ana bölüm dikey boşlukları azaltılmış, mobil hero görseli daha kısa oranla sunulmuştur.
- Geri navigasyonu bağlama göre tekilleştirilir: header güvenli geri hedefi sağlıyorsa içerik içi ikinci geri düğmesi gizlenir; düz makale URL'si doğrudan açıldığında sayfa içi geri yolu korunur.
- Breadcrumb desktop'ta tam yolu gösterir; mobilde parent + mevcut sayfa tutulur, daha eski atalar ellipsis ile sıkıştırılır.
- Makale etiketleri mobilde gizlenir; desktop'ta en fazla dört etiket gösterilir.

### UX Doğrulama — Aşama 6
- Gerçek görev kabul testi: hesaplama, Dokümantasyon, Belgeler, global arama ve Mevzuat akışları `tests/site-audit/simplification-stage6.spec.ts` içinde tanımlıdır.
- Responsive kabul matrisi: **320 / 390 / 430 / 768 / 1024 / 1366 / 1920 px**.
- Kaldırılmış Konu Haritası, Yapı/Şantiye/Bina Aşamaları ana yüzeyleri ve Kaydedilenler doğrudan 404; eski Bina çocuk URL'leri canonical `/rehber/...` yönlendirmesini korur.
- Aşama 6 runtime probu console error, React/hydration warning, pageerror, failed request ve HTTP >=400 cevaplarını gerçek görev akışlarında hata kabul eder.
- Dokümantasyon liste/kart seçim, yıldız ve işlem kontrolleri minimum 40 px dokunma alanı korur.
- Tema anahtarının sürekli RGB/gezegen animasyonları `prefers-reduced-motion: reduce` altında kapanır.
- Yerel kabul komutu: `npm run check:simplification-stage6`. Bu aşamada production veya preview deploy yapılmaz.
- Aşama 7 release gate komutu: `npm run check:simplification-stage7`; typecheck + lint + production build + site quality/navigation/homepage/smoke + genel a11y/e2e + Aşama 6 gerçek kullanıcı kabulü + 85/85 rehber ve final navigasyon statik gate zinciridir. Temiz kurulum doğrulaması için `npm run check:simplification-stage7:clean` önce `npm ci` çalıştırır.

---

## Aktif Workstream'ler

### 1. Yapım Rehberleri / Bina İçerik Ağı
- Değerli yapım rehberleri tek kaynak yapısıyla korunur; kullanıcıya açık canonical rehber rotası `/rehber/...` biçimindedir.
- Eski `/kategori/bina-asamalari/:path+` çocuk URL'leri kalıcı yönlendirmeyle yeni canonical rehber URL'lerine gider.
- Eski `/kategori/bina-asamalari` kök kullanıcı yüzeyi kaldırılmıştır ve 404 verir; Konu Haritası ile Kaydedilenler/Kaydetme kullanıcı yüzeyleri de kaldırılmıştır.
- Yapı Tasarımı ve Şantiye kategori veri tanımları ileride içerik eklenebilmesi için korunur ancak kullanıcıya açık navigasyon/route yüzeyi değildir.
- Rehberlerin veri, içerik ve `public/bina-asamalari/` görsel asset altyapısı korunur; eski D3 kök ekran bileşenleri runtime'dan çıkarılmıştır.
- Tarayıcıdaki eski `bookmarks` localStorage verisine migration uygulanmaz; artık tüketicisi olmadığı için kullanıcı deneyimine etkisi yoktur.
- Veri akışı: Temel → Kaba İnşaat → İnce İşler → Tesisat → Dış Cephe → Teslim
- Görsel Yenileme V3 Aşama 01–25 tamamlandı: 85 canonical konunun tamamı için 170 modern WebP PRIMARY/SECONDARY asseti publish edildi; bunların yeni üretilen 167 adedi 3840×2160, planda korunması istenen 3 PRIMARY ise 1920×1080 çözünürlüktedir. Tüm sayfalarda iki farklı görsel coverage değeri `true`, QC aralığı 92–95, hash duplicate ve kırık görsel sayısı 0'dır.

### 2. Hesap Araçları (Mevcut — Dokunmadan Güncelle)
Formülleri değiştirme. Sadece UI/UX iyileştirmesi kabul.

| Araç | Standart | Hesap Türü |
|------|----------|------------|
| Kolon Hesabı | TS 500 | Eksenel yük kapasitesi |
| Kiriş Hesabı | TS 500 | Eğilme momenti kapasitesi |
| Döşeme Hesabı | TS 500 | Tek/çift doğrultulu |
| Kalıp Söküm | TS 500 | Beton basınç dayanımına göre süre |
| Pas Payı | TS EN 1992-1-1 | Çevre koşuluna göre min. pas payı |

### 3. Teknik Blog
- Türkçe mühendislik makaleleri
- TBDY 2018 atıfları zorunlu
- Sayısal örnekler ve sık yapılan hatalar bölümü
- SEO: Türkçe başlık, kebab-case slug

### 4. Ruhsat Ön Fizibilite ve Daire Senaryoları
- Üretim rotası: `/hesaplamalar/tahmini-insaat-alani` (yerinde dönüşüm)
- Yeni domain sınırı: `src/lib/calculations/modules/ruhsat-on-fizibilite/`
- Aşama 5–8, `/hesaplamalar/tahmini-insaat-alani` rotasını yerinde Ruhsat Ön Fizibilite ürününe dönüştürür ve release denetimini tamamlar: progressive form, açık HEURISTIC varsayımlar, normalizasyon/motor bağlantısı, confidence/missing-data özeti, üç aday senaryo karşılaştırması, seçili darboğaz, isteğe bağlı teknik açıklanabilirlik, klavye erişimi, mobil sonuç önceliği, yerel PDF/print ve JSON dışa aktarımı sağlanır. PDF renderer kullanıcı eyleminde lazy yüklenir. URL veya `localStorage` ile proje verisi tutulmaz; otomatik taslak, backend ve JSON import V1 dışındadır.
- Domain doğrulaması: `npm run check:ruhsat-domain`
- Motor doğrulaması: `npm run check:ruhsat-engine`
- Test fortress: `npm run check:ruhsat-fortress` (tümü: `npm run check:ruhsat`)
- UI smoke: `npm run check:ruhsat-ui` (tümü: `npm run check:ruhsat-full`)
- Adversarial audit: `npm run check:ruhsat-audit`
- Tam release kapısı: `npm run check:ruhsat-release`
- Test matrisi: `docs/ruhsat-on-fizibilite/TEST_MATRIX.md`
- Uygulama durumu: `docs/ruhsat-on-fizibilite/IMPLEMENTATION_STATE.md`
- Release denetimi: `docs/ruhsat-on-fizibilite/RELEASE_AUDIT.md`

### 5. Dokümantasyon & CAD Preview V2 Modülü
- Rotalar: `/dokumantasyon`, `/dokumantasyon/dosya/[fileId]`, `/p/[token]`
- Mimari: MLightCAD doğrudan upstream motoru, LibreDWG WebWorker, akıllı fast-cache ve çok katmanlı fallback zinciri; full-viewport Document Studio entegrasyonu.
- CAD Preview V2 Hardening (Aşama 1–8 Tamamlandı — RELEASE READY):
  - **Aşama 1**: Test veri izolasyonu (`.data/dok_db.json` 1133 dosya sabit), SHA-256 fixture manifest doğrulaması.
  - **Aşama 2**: 60 FPS RAF throttle responsive büyüteç; global canvas monkeypatch kaldırıldı.
  - **Aşama 3**: Pan/zoom/fit salt-okunur UX sözleşmesi, `CadViewSettingsPanel` (renk modu, lineweight, arka plan) ve sıfır mutasyon.
  - **Aşama 4**: Telemetry loading fazları, saniye sayacı, güvenli iptal butonu, bozuk dosya sınıflandırması ve fast-cache.
  - **Aşama 5**: Hassas mesafe ölçümü (`CadPressHoldDistanceController`), 3-4-5 geometrisinde 5.000 fiziksel DOM oracle'ı, mobil tap/long-press.
  - **Aşama 6**: Türkçe Gauss çokgen alan ölçümü (`CadAreaMeasurementController`), 12.000.000,00 oracle'ı, SVG kılavuz ve mobil "Bitir" butonu.
  - **Aşama 7**: Mobil alt sheet katman çekmecesi, safe-area, 44×44 px touch target standardı, klavye focus trap & restore, screen reader etiketleri, bounded DOM (100'lük bloklar) ve CAD liste gezintisi.
  - **Aşama 8**: Birleşik gerçek release kapısı (`npm run check:cad-real-user-release`), browser matrisi doğrulaması ve yaşayan mimari hafıza.
- Dosya yöneticisi mobil sertleştirme (10 Eylül 2026, yerel): açık seçim modu bütün satır/kart/ad girişlerinde merkezi policy kullanır. Navbar ölçümlü viewport ve normal akış dock, 320px / Chromium / WebKit / yatay ekran regresyonlarıyla korunur. Ayrıntılar: `docs/DOK_MOBILE_HARDENING_2026-09-10.md`; hedefli typecheck: `npx tsc --noEmit --incremental false -p tsconfig.dok-mobile.json`.
- Telefon workspace güncellemesi (12 Eylül 2026): tek başlık, liste/iki sütunlu kart, ölçülen grup sanallaştırması, Radix paneller, geri/arama konumu ve layout içinde kalıcı yükleme kuyruğu. Yayın öncesi 214 Drive testi ve production bundle üzerinde 8 mobil kabul testi geçti. Fiziksel POCO kabulü ayrı ve beklemede; kapsam/kanıt: `docs/DOK_PHONE_WORKSPACE_2026-09-11.md`.
- Release Kapısı: `npm run check:cad-real-user-release`

---

## Mühendislik Standartları (Domain)

Tüm teknik içerik bu standartlara uymalıdır:

- **TS 500** — Betonarme yapı tasarım ve yapım kuralları
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği
- **TS EN 1992-1-1 (Eurocode 2)** — Beton yapılar
- **TS EN 206** — Beton spesifikasyonu

Formül yazarken kaynak belirt: `// TS 500 Denklem 7.1`
Birimler: `kN`, `kNm`, `MPa`, `cm²`, `mm`

---

## Kod Kuralları

### Genel
- **UI metinleri Türkçe** — kullanıcıya İngilizce görünmemeli
- **Kod yorumları Türkçe** — `// Kolon kapasitesi hesaplanıyor`
- TypeScript strict — `any` yasak
- Component isimleri: `PascalCase` (İngilizce) → `ColumnCalculator`
- Dosya isimleri: `kebab-case` → `column-calculator.tsx`

### Next.js
- Server Component default — sadece gerektiğinde `"use client"`
- `next/image` kullan, `<img>` yasak
- `next/link` kullan, `<a>` yasak

### Calculator Kuralları
- Sıfıra bölme ve negatif değer kontrolü zorunlu
- Hata mesajları Türkçe: `"Enkesit alanı pozitif olmalıdır"`
- Formül yanına kaynak: `// TS 500 Denklem 7.1`

### D3.js
- `viewBox` responsive
- Touch event'leri dahil et
- Animasyon max 300ms
- Tooltip metinleri Türkçe

---

## Türkçe Karakter — Kritik Kontrol

```tsx
// src/app/layout.tsx
<html lang="tr">
```

```ts
// Font tanımı
const font = localFont({
  src: '...',
  subsets: ['latin', 'latin-ext'],  // latin-ext ZORUNLU
})
```

---

## Yasaklar

- ❌ Mevcut calculator formüllerini değiştirme
- ❌ Tailwind dışında CSS-in-JS
- ❌ `console.log` production'da
- ❌ Hardcoded secret / API key
- ❌ TypeScript `any`
- ❌ Mobile kıran tasarım
- ❌ Light/dark tema eşliğini bozan tek taraflı renk kullanımı
- ❌ `latin-ext` olmadan font tanımı (Türkçe karakter bozulur)

---

## Görev Tamamlama Kontrol Listesi

1. Hangi dosyalar değişti?
2. Yeni bağımlılık var mı? (`npm install xyz`)
3. `npm run build` hatasız tamamlandı mı?
4. Mobile görünüm test edildi mi?
5. Türkçe karakterler bozulmadı mı?
6. Calculator'lardan biri etkilendiyse 3 input seti test edildi mi?

---

*Son güncelleme: Ağustos 2026*
*Bu dosyayı güncel tutmak senin sorumluluğun — değişiklik yapınca ilgili bölümü güncelle.*


### Sadeleştirme Release Candidate CI
- Release branch: `internal-site-release-gate-20260925`.
- GitHub Actions: `.github/workflows/simplification-release-gate.yml`.
- Bu branch yalnız final clean install/build/test doğrulaması içindir; tüm gate'ler yeşil olmadan main/production'a taşınmaz.
