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

---

## Aktif Workstream'ler

### 1. Bina Aşamaları Mind Map
- D3.js SVG tabanlı interaktif mind map
- Tıklanabilir node'lar, zoom/pan
- Mobil uyumlu (touch event'leri dahil)
- Veri akışı: Temel → Kaba İnşaat → İnce İşler → Tesisat → Dış Cephe → Teslim
- Görsel Yenileme V3 Aşama 01–03: İlk 9 canonical konu için 18 adet 3840×2160 WebP PRIMARY/SECONDARY asseti QC 93–95 ile publish edildi; kalan aşamalar progressive legacy görünümle devam eder.

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
