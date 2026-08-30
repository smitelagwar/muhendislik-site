# Site Denetimi ve İyileştirme — Test Matrisi (TEST_MATRIX.md)

> Tarih: 30 Ağustos 2026  
> Kapsam: Temsilci rotalar, cihazlar, tarayıcı motorları, senaryolar ve kalite kapıları  

---

## 1. Temsilci Rotalar Matrisi

| Sınıf | Rota (URL) | HTTP Türü | Doğrulama Amacı | Temsil Ettiği Kapsam |
|---|---|---|---|---|
| **Ana Yüzey** | `/` | Static (SSG) | İlk yükleme, LCP, responsive layout, dark/light tema, navigation | Ana vitrin, CTA linkleri |
| **Kategori Hub'ları** | `/kategori/deprem-yonetmelik` | Static (SSG) | Makale listeleme, etiket filtreleri, grid yerleşimi | Deprem yönetmelik içerikleri |
| | `/kategori/bina-asamalari` | Static (SSG) | D3.js mind map, interaktif rehber ağacı, touch events | İnteraktif aşama rehberleri |
| | `/kategori/araclar` | Static (SSG) | 30 araç kartı, domain aile filtreleri, arama | Tüm mühendislik araç kataloğu |
| **Dinamik Makale** | `/deprem-yonetmeligi-ozeti` | Static (SSG) | Uzun teknik içerik, formül gösterimi, içindekiler, SEO | 172 adet teknik makale |
| | `/fore-kazik-uygulamasi` | Static (SSG) | Görsel ağırlıklı zemin mühendisliği makalesi, lazy load | Görsel yoğun içerik |
| **Bina Rehberi** | `/kategori/bina-asamalari/proje-hazirlik/yapi-ruhsati` | Static (SSG) | Süreç akışı, resmi mevzuat maddeleri, checklist | 85 rehber sayfası |
| **Basit Hesap Aracı** | `/araclar/pas-payi` | Static (SSG) | TS EN 1992-1-1 pas payı oracle hesabı, anlık DOM reaktivitesi | Temel tekil form araçları |
| **Mühendislik Araçları** | `/araclar/donati-hesabi` | Static (SSG) | TS 500 donatı optimizasyonu, oracle doğrulama | Betonarme hesap araçları |
| | `/araclar/taban-kesme-kuvveti` | Static (SSG) | TBDY 2018 eşdeğer deprem yükü hesabı, mod spektrumu | Deprem/dinamik araçları |
| | `/araclar/zemin-sinifi` | Static (SSG) | TBDY 2018 Tablo 16.1 zemin sınıflandırma, kayma dalgası hızı | Geoteknik araçları |
| | `/araclar/celik-profil-secimi` | Static (SSG) | Çelik profil kütüphanesi (HEA/IPE/UPN), mukavemet | Çelik/ahşap araçları |
| **Hesaplamalar** | `/hesaplamalar/tahmini-insaat-alani` | Dynamic (Client) | Ruhsat Ön Fizibilite motoru, senaryo karşılaştırma, PDF | Kompleks fizibilite modülü |
| | `/hesaplamalar/insaat-maliyeti` | Dynamic (Client) | Yaklaşık maliyet matrisi, bölgesel katsayılar, print | Maliyet simülasyonu |
| | `/hesaplamalar/hizli-metraj` | Dynamic (Client) | Beton, kalıp, demir metraj oranları, interaktif tablo | Metraj araçları |
| | `/hesaplamalar/resmi-birim-maliyet-2026` | Static (SSG) | 2026 Çevre Şehircilik tebliği yapı yaklaşık birim maliyetleri | Resmi birim maliyetler |
| **Belgeler & PDF** | `/belgeler` | Static (SSG) | Şablon seçimi, arama, kategori filtreleri | Resmi matbu belgeler |
| | `/belgeler/insaat-sozlesmesi` | Dynamic (Client) | İnteraktif sözleşme editörü, form validation, client PDF | Belge stüdyosu |
| **Dokümantasyon (Özel)** | `/giris` | Dynamic (Client) | PIN / Auth doğrulama yüzeyi, hata durumları, session | Giriş kapısı |
| | `/dokumantasyon` | Dynamic (Auth) | Belge yönetim stüdyosu, filtreleme, upload, çöp kutusu | Doküman yönetim arayüzü |
| | `/dokumantasyon/dosya/[fileId]` | Dynamic (Auth) | MLightCAD/LibreDWG tam ekran CAD görüntüleyici, ölçüm, PDF | CAD & Belge Stüdyosu |
| **Public Paylaşım** | `/p/[token]` | Dynamic (Token) | Salt okunur token ile CAD ve PDF önizleme, fast cache | Dış paylaşım |
| **Sistem Yüzeyleri** | `/404` (Not Found) | Error Surface | Özel 404 sayfası, ana sayfaya dönüş butonu | Hata kurtarma |
| | `/sitemap.xml` | XML Feed | 308 URL'lik güncel dizin, canonical doğruluğu | Arama motoru haritası |
| | `/robots.txt` | Text Feed | Crawl kuralları, sitemap referansı, private path engeli | Robot yönergeleri |
| | `/api/health` (Readiness) | API (JSON) | Depo ve servis sağlık kontrolü | Sistem izleme |
| **API Uçları** | `/api/dokumantasyon/items` | API (JSON) | Doküman listeleme, arama ve filtreleme | Dokümantasyon veri katmanı |
| | `/api/dokumantasyon/upload` | API (JSON) | İki aşamalı güvenli upload intent ve finalize | Dosya yükleme |
| | `/api/dokumantasyon/file/[id]` | API (Stream) | Güvenli dosya akışı, MIME kontrolü, Range header | Dosya sunumu |
| | `/api/dokumantasyon/share` | API (JSON) | Paylaşım tokeni üretme ve iptal (revoke) | Paylaşım servisi |

---

## 2. Ortam, Cihaz ve Tarayıcı Matrisi

| Ortam / Cihaz | Viewport | Tarayıcı Motoru | Proje Adı (Playwright) | Test Odak Noktası |
|---|---|---|---|---|
| **Desktop High-DPI** | 1920x1080 | Chromium (Blink) | `desktop-chromium` | Tam ekran düzen, CAD stüdyosu, performans, LCP |
| **Desktop Standart** | 1366x768 | WebKit (Safari) | `desktop-webkit` | Safari rendering uyumluluğu, font fallback |
| **Tablet / Fold** | 820x1180 | Chromium Mobile | `tablet-chromium` | Responsive kırılma noktaları, dokunmatik kontroller |
| **Mobil Standart** | 390x844 (iPhone 14) | WebKit Mobile | `mobile-webkit` | Mobil navigasyon, dokunmatik ölçüm, 44px touch target |
| **Mobil Giriş Seviyesi** | 360x800 (Android) | Chromium Mobile | `mobile-chromium` | Düşük CPU/RAM performansı, lazy loading, safe-area |

---

## 3. Test Senaryoları ve Seviyeleri

1. **Seviye 1: Statik & Sözleşme Doğrulaması**
   - Linter (`npm run lint`)
   - Typecheck (`npx tsc --noEmit`, `npx tsc -p tsconfig.next.json --noEmit`)
   - Kodlama standartları (Türkçe karakter UTF-8, trailing whitespace, imports)

2. **Seviye 2: Mühendislik & Hesap Oracle Doğrulaması**
   - 30 araç formül ve sınır değer kontrolleri (`npm run check:tools`)
   - TS 500, TBDY 2018, TS EN 1992-1-1 oracle doğruluk testleri
   - Ruhsat ön fizibilite motor hesapları (`npm run check:ruhsat`)

3. **Seviye 3: CAD & Dokümantasyon Yaşam Döngüsü**
   - MLightCAD / LibreDWG rendering, 60 FPS ölçüm oracle'ı (`npm run check:cad-real-user-release`)
   - Güvenli upload, token paylaşım ve çöp kutusu izolasyonu

4. **Seviye 4: Üretim Derlemesi ve Route Smoke**
   - Üretim build'i (`npm run build` → `next build --webpack`)
   - 308 sitemap URL'sinin taranması ve HTTP durum kodları (`npm run check:smoke`)
   - Kırık link, loop ve konsol hatası denetimi

5. **Seviye 5: UX, Responsive ve Erişilebilirlik (A11y)**
   - Klavye navigasyonu, focus trap ve visible focus göstergesi
   - Renk kontrastı (WCAG 2.1 AA) ve Dark Industrial tema uyumu
   - Ekran okuyucu `aria-*` etiketleri ve dokunmatik hedef boyutları (min 44x44px)
