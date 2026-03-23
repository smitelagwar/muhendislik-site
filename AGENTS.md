# AGENTS.md — muhendislik-site Agent Context

You are an AI coding agent working on a Turkish civil engineering website. Read this file completely before writing any code or making any decisions.

---

## Project Overview

**Site:** muhendislik-site.vercel.app  
**Repo:** github.com/smitelagwar/muhendislik-site  
**Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS  
**Deployment:** Vercel (auto-deploy on push to main)  
**Purpose:** Turkish civil/structural engineers için hesap araçları, teknik blog içerikleri ve interaktif eğitim materyalleri sunan profesyonel mühendislik sitesi.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14 App Router |
| Dil | TypeScript |
| Stil | Tailwind CSS |
| Görselleştirme | D3.js |
| Deployment | Vercel |
| Package manager | npm |

---

## Proje Yapısı

```
muhendislik-site/
├── app/                    # Next.js App Router sayfaları
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Ana sayfa
│   └── [section]/          # Dinamik bölümler
├── components/             # Paylaşılan React componentleri
├── public/                 # Static dosyalar
├── styles/                 # Global CSS
└── lib/                    # Yardımcı fonksiyonlar / utils
```

**skiller ile ilgili bilmen gerekenler**

skillerin hepsi zaten githubtan alındı ve dosyalar arasında var. dolayısıyla internette aramana gerek yok.
skiller için muhendis-mimar-portali\.agent  ve muhendis-mimar-portali\get-shit-done  kısımlarından yararlan. Bunları tara ve ihtiyacın olabilecek şeyleri al.
skilleri otomatik olarak verdiğim işin konusuna ve ihtiyacına göre sen belirle.




---

## Domain Bilgisi — Türk İnşaat Mühendisliği

Bu site Türk mühendislik standartlarına göre çalışır. Aşağıdaki standartlara uymak zorunludur:

- **TS 500** — Betonarme yapıların tasarım ve yapım kuralları
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği
- **TS EN 1992-1-1 (Eurocode 2)** — Beton yapılar için Avrupa standardı
- **TS EN 206** — Beton spesifikasyonu, performans, üretim ve uygunluk

Hesap araçlarında kullanılan formüller bu standartlara dayanmalı, referans notları içermeli (örn. "TS 500 Md. 7.4").

---

## Aktif Workstream'ler

### 1. Bina Aşamaları Mind Map (D3.js)
- Bir binanın inşaat sürecini aşama aşama gösteren interaktif mind map
- D3.js ile SVG tabanlı, tıklanabilir node'lar
- Mobil uyumlu, zoom/pan destekli
- Türkçe etiketler: Temel → Kaba İnşaat → İnce İşler → Teslim

### 2. Hesap Araçları (Calculators)
Mevcut 5 hesap aracı vardır — bunlara dokunurken dikkatli ol, input/output davranışlarını bozmadan güncelle:
- **Kolon Hesabı** — Eksenel yük kapasitesi (TS 500)
- **Kiriş Hesabı** — Eğilme momenti kapasitesi
- **Döşeme Hesabı** — Tek/çift doğrultulu döşeme
- **Kalıp Söküm** — Beton basınç dayanımına göre süre
- **Pas Payı** — Çevre koşullarına göre minimum pas payı (TS EN 1992)

### 3. Teknik Blog
- Türkçe, mühendislik teknik blog yazıları
- TBDY 2018 atıfları, sayısal örnekler, sık yapılan hatalar içermeli
- SEO için başlıklar Türkçe, URL slug'ları kebab-case Türkçe

---

## Tasarım Sistemi

### Renk Paleti (Dark Industrial)
```css
--bg-primary: #0a0a0a        /* Ana arka plan */
--bg-secondary: #111111      /* Kart/panel arka planı */
--bg-tertiary: #1a1a1a       /* Hover/aktif arka plan */
--accent-primary: #f59e0b    /* Amber — ana vurgu rengi */
--accent-secondary: #3b82f6  /* Mavi — ikincil vurgu */
--text-primary: #f5f5f5      /* Ana metin */
--text-secondary: #a3a3a3    /* İkincil metin */
--border: #262626            /* Kenar çizgileri */
```

### Tipografi
- Başlıklar: ağırlıklı (font-bold / font-extrabold)
- Teknik değerler: monospace font (`font-mono`)
- Türkçe karakter desteği zorunlu (ğ, ş, ç, ı, ö, ü)

### Component Kuralları
- Tüm butonlar: `rounded-md` border radius, Amber hover state
- Input alanları: dark background, Amber focus ring
- Hesap sonuçları: `font-mono`, sarı/amber ile vurgula
- Hata mesajları: kırmızı (`text-red-400`), form validasyonu Türkçe

---

## Kod Yazım Kuralları

### Genel
- **Tüm UI metinleri Türkçe** — İngilizce kullanıcıya görünmemeli
- **Kod içi yorumlar Türkçe** — `// Kolon kapasitesi hesaplanıyor`
- TypeScript strict mode — `any` kullanma, tipler tanımla
- Component isimleri İngilizce PascalCase: `ColumnCalculator`, `BeamForm`
- Dosya isimleri kebab-case: `column-calculator.tsx`

### Next.js App Router
- Server Component default — sadece gerektiğinde `"use client"` ekle
- `next/image` kullan, `<img>` tag'i kullanma
- `next/link` kullan, `<a>` tag'i kullanma
- Server Action kullanacaksan önce `vercel.json` kontrol et

### Hesap Araçları için Özel Kurallar
- Formüllerin yanına kaynak yaz: `// TS 500 Denklem 7.1`
- Birimleri belirt: kN, kNm, MPa, cm², mm
- Sıfıra bölme ve negatif değer kontrolü yap
- Kullanıcıya anlamlı Türkçe hata mesajı ver: `"Enkesit alanı pozitif olmalıdır"`

### D3.js
- SVG viewBox responsive olmalı
- Touch event'leri ekle (mobile zoom/pan)
- Animasyon süresi max 300ms (performans)
- Türkçe tooltip metinleri

---

## Yasaklar — Bunları Asla Yapma

- ❌ Mevcut hesap aracı formüllerini değiştirme (standart referanslar sabit)
- ❌ Tailwind dışında CSS-in-JS kütüphanesi ekleme
- ❌ `console.log` production kodunda bırakma
- ❌ Hardcoded API key veya secret
- ❌ `any` TypeScript tipi
- ❌ Türkçe karakter bozulmasına yol açacak encoding hatası
- ❌ Mobil kırmayan tasarım — her component mobile-first olmalı
- ❌ Dark theme'i bozan beyaz/açık arka planlar

---

## Sık Yapılan Türkçe Karakter Hatası

Next.js ve Tailwind'de Türkçe karakter sorunu çıkarsa:

```tsx
// next.config.js içinde charset ayarı
const nextConfig = {
  experimental: {
    // ...
  },
}
```

```html
<!-- layout.tsx <html> tag'i -->
<html lang="tr">
```

Font kullanıyorsan `subset: ['latin', 'latin-ext']` ekle — `latin-ext` olmadan ğ, ş, ç bozulur.

---

## Test & Kalite

- Yeni component eklerken mevcut sayfaların layout'unu kır mı diye kontrol et
- Calculator güncellemelerinde: 3 farklı input seti ile manuel doğrula
- `npm run build` hata vermeden tamamlanmalı — deploy öncesi kontrol et
- Vercel preview URL'i üzerinden mobile görünümü test et

---

## Görev Teslim Formatı

Bir görevi tamamladığında şunu yap:
1. Hangi dosyaları değiştirdiğini listele
2. Varsa yeni bağımlılıkları belirt (`npm install xyz`)
3. Test edilmesi gereken edge case'leri yaz
4. Türkçe karakter içeren alanlarda test yaptıysan belirt

---

*Bu dosya proje genelinde geçerlidir. Çelişkili talimat gelirse bu dosyadaki kurallar önceliklidir.*

## Repo Gerçekliği ile Senkronizasyon
Bu dosyadaki kurallar uygulanırken önce mevcut repo yapısı kontrol edilmelidir.
- Gerçek route yapısı öncelikle `src/app/` altında aranmalıdır.
- Paylaşılan bileşenler `src/components/` altında tutulmalıdır.
- İçerik kaynağı `src/lib/data.json` dosyasıdır.
- Site ayarları ve URL yardımcıları `src/lib/site-config.ts` içinde aranmalıdır.
- Bu projede mevcut dosya yapısı ile çelişen yeni klasör organizasyonu önerilmemelidir.
- Yeni dosya eklemeden önce mevcut pattern incelenmelidir.

## İçerik Şeması Kuralları
Teknik blog ve rehber içerikleri aşağıdaki alanları mümkün olduğunca içermelidir:
- title
- slug
- summary
- category
- tags
- publishedAt
- updatedAt
- seoTitle
- seoDescription
- keywords
- references

Kurallar:
- Başlıklar teknik ve açık olmalı
- URL slug kısa, okunabilir ve kebab-case olmalı
- Yönetmelik referansı olmayan teknik iddia yazılmamalı
- Sayısal örnek varsa birimlerle birlikte verilmelidir
- Her teknik yazıda “sık yapılan hatalar” veya “uygulama notları” bölümü bulunması tercih edilir

## SEO ve Metadata Kuralları
- Her sayfada benzersiz title ve meta description olmalı
- Makale sayfalarında canonical URL tanımlanmalı
- Open Graph ve Twitter metadata eklenmeli
- Uygun sayfalarda JSON-LD kullanılmalı
- Türkçe karakter içeren başlıklardan slug üretirken normalize edilmiş URL kullanılmalı
- Hesap araçları için kısa açıklama, kullanım amacı ve ilgili standart referansları gösterilmeli

## Erişilebilirlik Kuralları
- Tüm input alanlarının görünür bir etiketi olmalı
- Hata mesajları screen reader tarafından okunabilir olmalı
- Klavye ile gezilebilirlik bozulmamalı
- Tooltip içerikleri sadece hover ile değil focus ile de erişilebilir olmalı
- SVG ve grafiklerde açıklayıcı başlık/aria bilgileri bulunmalı

## Performans Kuralları
- Gereksiz `use client` kullanımından kaçınılmalı
- D3.js ve ağır etkileşimli bileşenler mümkünse lazy-load edilmelidir
- Büyük veri yapıları tekrar tekrar parse edilmemelidir
- Animasyonlar performansı bozmayacak kadar kısa tutulmalıdır
- Layout shift oluşturan tasarımlardan kaçınılmalıdır

## Hesap Araçları Sayısal Güvenilirlik
- Tüm girişler birim bazında doğrulanmalı
- Sonuç yuvarlama standardı her araçta tutarlı olmalı
- Ara hesaplar ile nihai sonuçlar ayrıştırılmalı
- Negatif, sıfır veya anlamsız girişlerde sonuç yerine açıklayıcı hata gösterilmeli
- Gerekirse “ön boyutlandırma amaçlıdır” uyarısı verilmelidir
- Yönetmelik sınırlarını aşan durumlar uyarı olarak belirtilmelidir

## Güvenlik ve Production Sınırları
- Production için localStorage tabanlı admin veya sabit şifreli çözüm önerilmemeli
- Secret veya private yapılandırmalar client tarafına taşınmamalı
- Public API yüzeyi gereksiz yere genişletilmemeli
- Dosyaya yazma mantığı gerektiren çözümler Vercel production ortamına uygun kabul edilmemelidir

## Test Matrisi
Her yeni özellikte mümkünse şu kontroller yapılmalı:
- normal giriş
- sınır değer
- boş değer
- negatif değer
- sıfır değeri
- çok büyük değer
- ondalıklı değer
- mobil görünüm
- Türkçe karakterli metinler
- dark mode görünümü
- build/lint/typecheck kontrolü

## Ajan Karar Öncelikleri
Karar verirken şu öncelik sırası izlenmelidir:
1. Yönetmelik doğruluğu
2. Mevcut repo mimarisiyle uyum
3. Mobil uyumluluk
4. Erişilebilirlik
5. Performans
6. Görsel estetik
7. Yeni bağımlılık eklememe
``