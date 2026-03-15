# Site Analizi

## Teknoloji Özeti
- Framework: Next.js 16 App Router
- UI: React 19, TypeScript, Tailwind CSS 4
- Giriş noktaları:
  - `src/app/layout.tsx`: global shell, metadata, navbar/footer
  - `src/app/page.tsx`: ana sayfa
  - `src/app/[slug]/page.tsx`: dinamik makale sayfası
  - `src/app/kategori/araclar/page.tsx`: araç merkezi
  - `src/app/api/articles/route.ts`: JSON içerik API'si
- Veri kaynağı: `src/lib/data.json`
- Global stil dosyası: `src/app/globals.css`

## App Router ve Route Haritası
- `/`: ana sayfa
- `/[slug]`: makale detay sayfaları
- `/kategori/[slug]`: kategori sayfaları
- `/kategori/araclar/*`: hesap araçları
- `/araclar/*`: eski bağlantılar; `next.config.ts` içindeki redirect kurallarıyla yeni araç URL'lerine yönleniyor
- `/admin` ve `/admin/editor`: yerel içerik yönetim yüzeyi
- `/api/articles`: içerik okuma/yazma endpoint'i
- `/robots.txt` ve `/sitemap.xml`: App Router metadata route'ları

## Public Asset Stratejisi
- Runtime asset'leri `public/` altında:
  - `public/logos/*`
  - `public/kalip-sokumu-hero.png`
  - `public/kalip-kesit-diagram.png`
- Bu projede `/logos/...` ve `/kalip-sokumu-hero.png` gibi root-relative yollar doğru kullanımdır; Next.js `public/` dosyaları için bunlar korunmalıdır.
- Favicon mevcut: `src/app/icon.svg`

## Deploy'a Girecek Çekirdek Alanlar
- `src/`
- `public/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `postcss.config.mjs`
- `next.config.ts`
- `eslint.config.mjs`
- `.env.example`
- `vercel.json`
- `README.md`
- `DEPLOY_REHBERI.md`
- `.github/workflows/vercel-preflight.yml`

## Deploy Dışı / Yardımcı Alanlar
- `.agent/`
- `get-shit-done/`
- `-EKLEDİKLERİM/`
- `.next/`
- `.tmp/`
- `output.html`
- `lint.txt`
- `lint_output.txt`
- `snapshot*.png`
- `puppeteer*.js`
- `test_scrollytelling.js`
- `.next-dev.err.log`
- `.next-dev.out.log`

## Üretim Riskleri ve Alınan Kararlar
- `src/app/api/articles/route.ts` dosyaya yazıyor.
  - Vercel serverless ortamında bu değişiklikler kalıcı değildir.
  - Karar: `GET` açık kalacak, `POST` ve `DELETE` production'da `403` dönecek.
- `/admin` ve `/admin/editor` localStorage + sabit şifre ile çalışıyor.
  - Karar: production ortamında redirect ile kapatılacak.
- Lint kapsamı gerçek uygulama dışındaki yardımcı klasörlere taşıyordu.
  - Karar: ESLint ignore listesi yalnızca deploy edilebilir kodu hedefleyecek şekilde daraltılacak.
- Repo henüz Git deposu değil.
  - Karar: çalışma sonunda `git init`, `main` branch ve ilk commit hazırlanacak.

## Domain, SEO ve UTF-8 Durumu
- Canonical/domain kaynağı tek noktaya alınacak: `src/lib/site-config.ts`
- `.env.example` örnek değeri Vercel formatına çevrilecek: `https://your-project-name.vercel.app`
- `layout.tsx`, `robots.ts`, `sitemap.ts` ve makale metadata'sı aynı domain helper'ını kullanacak.
- Türkçe metinlerde toplu encoding dönüşümü yapılmayacak.
  - Kaynak dosyalar UTF-8 olarak okunuyor.
  - Kullanıcıya görünen metinlerde hedefli düzeltme dışında global encoding migrasyonu yapılmayacak.

## Dosya Referansı Kontrolü
- `public/` altındaki kullanılan görseller ve logolar mevcut.
- `src/app/icon.svg` mevcut.
- Runtime kodunda kırık CSS/JS import'u tespit edilmedi.
- `console.log` tipi debug çıktısı bulunmadı; yalnızca hata durumlarında `console.error` kullanılıyor.
