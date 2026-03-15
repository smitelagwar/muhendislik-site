# İnşa Blog

İnşa Blog, inşaat mühendisleri ve mimarlar için teknik içerik, hesap araçları ve saha rehberleri sunan Next.js tabanlı bir içerik sitesidir. Bu repo Vercel Free yayını için production-safe hale getirilmiştir.

## Teknoloji
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4

## Proje Yapısı
- `src/app/`: App Router route'ları, metadata route'ları ve sayfalar
- `src/components/`: UI bileşenleri ve araç ekranları
- `src/lib/data.json`: makale/veri kaynağı
- `src/lib/site-config.ts`: site adı, description, canonical domain ve URL helper'ları
- `public/`: logo ve statik görseller
- `docs/site-analizi.md`: deploy kapsamı ve production risk analizi
- `DEPLOY_REHBERI.md`: teknik olmayan kullanıcı için adım adım yayın rehberi

## Yerel Çalıştırma
```bash
npm ci
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## Environment
Bu proje tek bir public environment değişkeni kullanır:

```bash
NEXT_PUBLIC_SITE_URL=https://your-project-name.vercel.app
```

Notlar:
- Bu değişken secret değildir; canonical URL, sitemap ve metadata için kullanılır.
- İlk Vercel deploy'undan sonra gerçek `.vercel.app` adresinizle güncellenmelidir.

## İçerik Yönetimi
- İçerik kaynağı `src/lib/data.json` dosyasıdır.
- `GET /api/articles` public okuma akışları için açıktır.
- `POST /api/articles` ve `DELETE /api/articles` Vercel production ortamında kapatılmıştır.
- Canlı sitede içerik güncelleme yöntemi: dosyayı değiştir, commit et, GitHub'a push et, yeniden deploy et.

## Admin Davranışı
- `/admin` ve `/admin/editor` local geliştirme için bırakılmıştır.
- Vercel production ortamında bu route'lar root sayfaya redirect edilir.
- Sebep: mevcut admin yüzeyi localStorage + sabit şifre + dosyaya yazma mantığıyla çalışıyor; bu yapı Vercel'de kalıcı yönetim paneli olarak güvenli değildir.

## Kalite Kontrolleri
```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Vercel Deploy Özeti
1. Repo'yu GitHub'a yükleyin.
2. Vercel'de `Import Project` ile bağlayın.
3. İlk deploy tamamlanınca verilen `.vercel.app` domainini alın.
4. Vercel project settings içine `NEXT_PUBLIC_SITE_URL` olarak bu domaini girin.
5. Yeniden deploy ederek canonical, robots ve sitemap URL'lerini kalıcı hale getirin.

Detaylı anlatım için `DEPLOY_REHBERI.md` dosyasını kullanın.
