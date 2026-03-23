# PROJECT.md — muhendislik-site

> Bu dosya projenin tek gerçek kaynağıdır. CLAUDE.md, AGENTS.md ve GEMINI.md bu dosyayı referans alır.
> Herhangi bir tool (Claude Code, Codex, Gemini CLI) bu dosyayı session başında otomatik yükler.

---

## Proje Kimliği

| Alan | Değer |
|------|-------|
| **Site** | muhendislik-site.vercel.app |
| **Repo** | github.com/smitelagwar/muhendislik-site |
| **Framework** | Next.js 14 App Router, TypeScript |
| **Stil** | Tailwind CSS |
| **Görselleştirme** | D3.js |
| **Deployment** | Vercel (main push → otomatik deploy) |
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
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (lang="tr", charset)
│   ├── page.tsx            # Ana sayfa
│   └── [section]/          # Dinamik bölümler
├── components/             # Paylaşılan React componentleri
│   ├── calculators/        # Hesap araçları
│   └── visualizations/     # D3.js bileşenleri
├── public/                 # Static dosyalar
├── styles/                 # Global CSS
├── lib/                    # Utility fonksiyonlar
├── PROJECT.md              # ← Bu dosya (proje gerçek kaynağı)
├── CLAUDE.md               # Claude Code wrapper
├── AGENTS.md               # Codex wrapper
└── GEMINI.md               # Gemini CLI wrapper
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

**Kritik:** Dark tema korunacak. Açık arka plan (`bg-white`, `bg-gray-100`) **yasak**.

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
// app/layout.tsx
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
- ❌ Dark theme'i bozan açık arka planlar (`bg-white` vb.)
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

*Son güncelleme: Mart 2026*
*Bu dosyayı güncel tutmak senin sorumluluğun — değişiklik yapınca ilgili bölümü güncelle.*
