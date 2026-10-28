# TBDY arşivi — Aşama 4 kalite ve Preview raporu

Tarih: 2026-10-27

## Preview

- URL: https://muhendislik-site-9i8fc9npn-huseying5713-2819s-projects.vercel.app
- Deployment ID: `dpl_AbBkiGGb1E8bAyiNG2r1o7umYrv2`
- Test edilmiş Preview commit: `3b43841000b63289a19b0a7e2d13db70a0133a2d`
- Vercel durumu: **READY**, Next.js üretim derlemesi ve build TypeScript kontrolü geçti.
- Production üzerinde değişiklik yapılmadı.

## Test sonuçları

- **PASS** `node scripts/check-tbdy-archive.mjs`: 17 bölüm, 395 gövde sayfası.
- **PASS** `node scripts/check-tbdy-search-index.mjs`: arama veri bütünlüğü; 3.6.1 ve 4.7.2 örnek maddeleri.
- **PASS** `npm run check:deprem-infrastructure`: mevcut makale/figür/formül/route altyapısı.
- **PASS** Preview HTTP 200: Mevzuat sayfası, arşiv listesi, TBDY bölüm listesi, Bölüm 3 okuyucu ve Bölüm 4 ham Markdown.
- **PASS** Arama: 4.7.2 → `madde-4-7-2`, PDF sayfa 71. Burulma aramasında sonuç; sahte terimde boş sonuç.
- **PASS** Geçersiz bölüm `bolum-99` → HTTP 404.
- **DÜZELTİLDİ / TEKRAR TEST GEREKİYOR** Yeni arşiv kapsamındaki lint taraması altı adet `react/no-unescaped-entities` buldu. Bu commit JSX metnindeki apostrofları kaçırır.
- **YAPILAMADI** Gerçek 390px mobil, tablet, masaüstü Playwright testi. Ayrı sandbox oturumu sonlandı; gerçek görsel kalite kabulü verilmedi.
- **YAPILAMADI** Repo çapında tüm lint ve tüm site regresyon Playwright turları.
- **DOĞRULANMADI** PDF içindeki matematiksel formül/indis ve tablo hücrelerinin mühendislik doğruluğu; kaynak PDF'nin AFAD sunucusundaki dosya ile byte eşitliği.

## Yayın kapısı

Yönetmelik `manifest.json` içindeki `published:false`, `validatedEngineeringContent:false` durumlarını korur. Production'da doğrulanmamış kaynak Markdown görünür hâle getirilmeyecektir. Önce kalan gerçek tarayıcı, lint, sürüm ve içerik kontrolleri bitirilmeli; sonra tek üretim yayını yapılmalıdır.

**Not:** Bu QA raporu TBDY'den türetilen metnin normatif geçerlilik/doğruluk onayı değildir.
