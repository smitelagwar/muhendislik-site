# Site Geneli Denetim ve İyileştirme — Gemini 3.7 Flash uygulama planı

> Tarih: 30 Ağustos 2026  
> Hedef depo: `muhendis-mimar-portali`  
> Uygulayıcı: Gemini 3.7 Flash, tercihen High düşünme seviyesi  
> Kapsam: Hız, stabilite, işlev doğruluğu, kullanıcı deneyimi, responsive tasarım, erişilebilirlik, SEO, içerik, güvenlik, veri bütünlüğü, bağımlılıklar, build, CI ve Vercel release süreci  
> Plan büyüklüğü: Tam olarak 10 ana adım  
> Çalışma biçimi: Bir adım uygulanır, kanıtı üretilir, kapısı geçmeden sonraki adıma geçilmez

## 1. Amaç ve başarı tanımı

Bu planın amacı yalnız “site açılıyor” sonucunu almak değildir. Amaç; sitenin gerçek kullanıcı akışlarını, mühendislik hesaplarını, içeriklerini, belge/PDF üretimini, Dokümantasyon ve CAD modüllerini, API ve veri yaşam döngüsünü ölçülebilir kanıtlarla denetlemek; bulunan sorunları kök nedenleriyle düzeltmek; aynı sorunların geri gelmesini otomatik kalite kapılarıyla önlemektir.

Plan sonunda aşağıdaki sorular kanıtla cevaplanabilmelidir:

- Tüm public ve private route sınıfları doğru HTTP davranışı gösteriyor mu?
- Kullanıcı ana görevlerini masaüstü ve mobilde tamamlayabiliyor mu?
- Mühendislik hesapları sınır değerlerde güvenli ve açıklanabilir mi?
- Üretim build'i temiz ve tekrarlanabilir mi?
- Site yavaş cihaz ve ağlarda kabul edilebilir sürede kullanılabilir hâle geliyor mu?
- Tema, responsive düzen, klavye ve ekran okuyucu kullanımı tutarlı mı?
- Arama motorlarına yalnız doğru ve canonical sayfalar sunuluyor mu?
- Auth, paylaşım, upload, indirme ve dosya erişimi yetki sınırlarını koruyor mu?
- Hata, timeout, bozuk veri ve servis kesintileri veri kaybı oluşturmadan yönetiliyor mu?
- Final release tek bir doğrulanmış checkpoint olarak güvenle yayınlanabilir mi?

“PASS” yalnız komutun exit code `0` dönmesi değildir. Loglarda hata yazıp `0` dönen, testi atlayan, fixture bulamadığı için sessizce geçen veya yalnız mock ile doğrulanan bir kapı PASS sayılmaz.

## 2. İnceleme anındaki depo gerçeği

Plan hazırlanırken doğrulanan başlangıç fotoğrafı:

- Next.js `16.1.6` App Router, React `19.2.3` ve TypeScript strict kullanılmaktadır.
- Üretim build sözleşmesi `npm run build -> next build --webpack` biçimindedir.
- `prebuild`, CAD worker/WASM/font varlıklarını senkronlar; atlanamaz.
- Next production typecheck'i `tsconfig.next.json`, genel kalite kapıları `tsconfig.json` kullanır.
- Yaklaşık 144 page dosyası ve 36 API route dosyası vardır. Dinamik içerik nedeniyle gerçek URL sayısı kaynak dosya sayısından büyüktür.
- Yaklaşık 249 test/check/smoke dosyası vardır. Yeni test yazmadan önce mevcut kapıların kapsamı incelenmelidir.
- Playwright altyapısında Chromium, mobil Chromium, WebKit ve mobil WebKit projeleri vardır; mevcut test dizini ağırlıklı olarak Document Studio kapsamındadır.
- `sitemap.ts`, `robots.ts`, Open Graph image, global loading/error/not-found yüzeyleri ve route metadata altyapısı vardır.
- Dokümantasyon; auth, DB, Blob/local storage, upload/finalize, paylaşım, çöp kutusu, sürümleme, PDF/görsel/CAD preview ve public token akışları içerir.
- CAD primary zinciri MLightCAD/LibreDWG ve kontrollü fallback katmanları kullanır.
- Çalışma ağacı plan yazıldığı anda temiz değildir. Kullanıcıya ait mühendislik araçları ve test değişiklikleri vardır. Bunlar silinemez, resetlenemez, checkout ile geri alınamaz veya izinsiz stash edilemez.

Bu sayılar sabit kabul kriteri değildir. Adım 1'de güncel koddan yeniden üretilir.

## 3. Değiştirilemez çalışma kuralları

Gemini bütün adımlarda aşağıdaki kurallara uymalıdır:

1. Her oturum başında `PROJECT.md`, `AGENTS.md` ve görevle ilgili `.agents/rules/*.md` dosyalarını UTF-8 olarak oku.
2. Dokümantasyon/CAD işi öncesinde `DOK_CONTEXT_MAP.md`, `DOK_STORAGE_CONTRACT.md` ve `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` dosyalarını oku.
3. Mevcut kullanıcı değişikliklerini koru. `git reset --hard`, `git checkout --`, geniş kapsamlı silme, izinsiz stash veya force push kullanma.
4. Bir adımdaki baseline ile düzeltmeyi aynı anda karıştırma. Önce hatayı yeniden üret ve kanıtla, sonra kök nedeni düzelt.
5. Testi, lint kuralını, TypeScript strictliğini veya güvenlik kontrolünü sırf yeşil sonuç almak için gevşetme.
6. `any`, toplu `eslint-disable`, gereksiz `@ts-ignore`, rastgele timeout artırımı veya koşulsuz retry ile hata saklama.
7. Mevcut hesap formüllerini kanıtsız değiştirme. TS 500, TBDY 2018, TS EN 1992-1-1 ve TS EN 206 sonuçları yalnız kaynak, birim ve oracle ile doğrulanır.
8. Production verisi üzerinde destructive test yapma. Upload/delete/restore/backup testlerini izole fixture ve ayrı test veri diziniyle çalıştır.
9. Secret, token, bağlantı dizesi, kişisel veri veya özel CAD fixture'ını loga, Markdown'a, ekran görüntüsüne ya da Git'e yazma.
10. Yeni bağımlılık ancak mevcut araçla güvenilir biçimde çözülemeyen açık bir ihtiyaç varsa eklenir; tam sürüm lockfile'a yazılır ve lisans/güvenlik etkisi kaydedilir.
11. Dev server üzerinde alınan performans sonucu production performansı sayılmaz. Performans ölçümü `npm run build` sonrası production server üzerinde yapılır.
12. Yerel IDE akışında bütün adımlar bitmeden push yapılmaz. Finalde kullanıcı onayıyla tek anlamlı atomic checkpoint hazırlanır. Uzak AI akışında `internal-*`/`chatgpt-*` branch ve `[skip ci]`/`[skip vercel]` kuralları uygulanır.
13. Bu plan için hedef 0–1 Vercel Preview ve en fazla 1 final Production deploy'dur. Aynı problemi denemek için tekrar tekrar deploy üretilmez.
14. Bir mimari, lifecycle, cache, engine, API contract veya release kapısı değişirse ilgili yaşayan doküman aynı adımda güncellenir.

## 4. Kanıt ve raporlama sözleşmesi

Adım 1'de şu kalıcı özet dosyaları oluşturulur:

- `docs/site-audit/BASELINE.md` — ortam, route/test envanteri ve ilk ölçümler
- `docs/site-audit/FINDINGS.md` — tek bulgu kaydı
- `docs/site-audit/TEST_MATRIX.md` — route, cihaz, tarayıcı ve senaryo matrisi
- `docs/site-audit/RELEASE_REPORT.md` — final kanıt, kalan risk ve release/rollback özeti

Ham log, trace, video, Lighthouse JSON/HTML, HAR ve ekran görüntüleri Git'e eklenmez. Bunlar mevcut ignore kapsamındaki `test-results/site-audit/<run-id>/` altında tutulur. Kalıcı Markdown raporlarında yalnız özet, ölçüm, komut, ilgili dosya ve artifact yolu yazılır.

Her bulgu şu şemayı kullanır:

| Alan | Zorunlu içerik |
| --- | --- |
| ID | `FUNC-001`, `PERF-001`, `A11Y-001`, `SEO-001`, `SEC-001` gibi sabit kimlik |
| Öncelik | P0, P1, P2 veya P3 |
| Kapsam | Route, bileşen, API, cihaz ve tarayıcı |
| Yeniden üretim | Tam ve kısa adımlar |
| Beklenen / mevcut | Gözlenebilir fark |
| Kanıt | Log, ölçüm, trace, screenshot veya test |
| Kök neden | Tahmin değil, doğrulanmış neden |
| Düzeltme | Değişen dosyalar ve karar |
| Regresyon testi | Otomatik test veya neden otomatikleştirilemediği |
| Durum | Açık, düzeltildi, doğrulandı, bloke veya açıkça kabul edildi |

Öncelik anlamları:

- **P0:** Yanlış mühendislik sonucu, veri kaybı, yetki atlama, secret sızıntısı, production'ın açılamaması veya kritik kullanıcı akışının tamamen çalışmaması. İlerleme durur.
- **P1:** Yaygın işlev bozukluğu, ciddi erişilebilirlik engeli, güvenlik açığı, Core Web Vitals ana hedefinin ağır ihlali veya kalıcı veri tutarsızlığı. Release bloklanır.
- **P2:** Sınırlı kapsamlı hata, önemli UX/SEO/performans borcu. Mümkünse bu plan içinde kapanır; ertelenecekse açık kullanıcı kararı gerekir.
- **P3:** Kozmetik veya düşük etkili iyileştirme. Ölçüsü ve gerekçesiyle backlog'a alınabilir.

## 5. Zorunlu temsilci route matrisi

Tüm sitemap URL'leri smoke ve link kontrolünden geçer. Derin tarayıcı testi ise her sınıftan en az aşağıdaki temsilcileri kapsar:

| Sınıf | Temsilci |
| --- | --- |
| Ana yüzey | `/` |
| Kategori | `/kategori/deprem-yonetmelik`, `/kategori/bina-asamalari`, `/kategori/araclar` |
| Dinamik makale | Sitemap'ten en uzun ve en görsel ağırlıklı en az iki makale |
| Bina rehberi | Bir kısa, bir görsel/etkileşim yoğun rehber |
| Basit araç | `/araclar/pas-payi` |
| Mühendislik araçları | `/araclar/donati-hesabi`, `/araclar/taban-kesme-kuvveti` ve registry'den her domain ailesinden en az bir araç |
| Hesaplamalar | `/hesaplamalar/tahmini-insaat-alani`, `/hesaplamalar/insaat-maliyeti`, `/hesaplamalar/hizli-metraj`, `/hesaplamalar/resmi-birim-maliyet-2026` |
| Belgeler/PDF | `/belgeler` ve en az iki form stüdyosu |
| Dokümantasyon | `/giris`, `/dokumantasyon`, `/dokumantasyon/dosya/[fixture]` |
| Public paylaşım | `/p/[izole-test-token]` |
| Sistem yüzeyleri | 404, error, loading, redirect, `robots.txt`, `sitemap.xml`, Open Graph image |
| API | Auth, items/search, upload intent/finalize, file access/stream, share/revoke, trash/restore ve readiness |

Matrise ek olarak sitemap dışında bilerek tutulan private/noindex route'lar da ayrı listelenir. “Sitemap'te yok” ile “test edilmedi” aynı şey değildir.

# 6. Uygulama adımları

## ADIM 1/10 — Güvenli başlangıç, envanter ve değiştirilemez baseline

### Hedef

Mevcut çalışma ağacını bozmadan, sonraki bütün karşılaştırmaların dayanacağı tekrarlanabilir başlangıç fotoğrafını üretmek.

### Yapılacaklar

1. `PROJECT.md`, `AGENTS.md` ve bütün görev kurallarını oku; okunan dosyaları `BASELINE.md` içinde kaydet.
2. Çalışma modunu açıkça yaz:
   - yerel IDE/Antigravity;
   - uzak ChatGPT/API;
   - yalnız read-only audit.
3. Şunları kaydet:
   - `git branch --show-current`
   - `git log -1 --oneline`
   - `git status --short`
   - `git diff --stat`
   - `git diff --check`
   - Node, npm, Git, işletim sistemi ve kullanılacak tarayıcı sürümleri
4. Dirty dosyaları “önceden var olan kullanıcı değişikliği” olarak etiketle. Gemini'nin değiştireceği dosyalarla çakışma varsa önce diff'i incele; kullanıcı değişikliğini kaybetmeden minimal patch uygula.
5. Kaynak koddan route, API, page, client component, test, script ve workflow envanteri üret. Hardcoded sayı kullanma.
6. Sitemap ile dosya sistemi route'larını karşılaştır:
   - indexable;
   - private/noindex;
   - redirect;
   - yanlışlıkla yetim;
   - dinamik veriyle üretilen.
7. Mevcut kalite kapılarını package scriptleri ve GitHub workflow'larıyla eşleştir. Aynı kontrolü tekrar eden, yalnız mock kullanan veya gerçek failure'ı yutmaktan şüphelenilen kapıları işaretle.
8. Hiç düzeltme yapmadan ilk baseline'ı çalıştır:

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm run check:site-quality
npm run check:navigation
npm run check:homepage
npm run check:visual-system
npm run build
npm run check:smoke
```

1. Her komut için süre, exit code, PASS/FAIL/SKIP sayısı ve önemli log satırlarını yaz. Bir komut çalışamıyorsa “SKIP” değil “BLOCKED” yaz ve eksik ön koşulu belirt.
2. P0 secret/veri kaybı dışında bu adımda ürün kodunu düzeltme.

### Zorunlu kanıt

- Güncel branch ve dirty-file listesi
- Route/test/workflow envanteri
- İlk build boyut/route çıktısı
- Baseline komut matrisi
- İlk `FINDINGS.md` kayıtları

### Geçiş kapısı

Baseline yeniden üretilebilir, önceki kullanıcı değişiklikleri korunmuş ve her başarısızlık benzersiz bir bulguya bağlanmış olmalıdır. Baseline'ın yeşil olması şart değildir; belirsiz olması yasaktır.

**Bu adım bitince 9 ana adım kalır.**

## ADIM 2/10 — Kurulum, statik kalite, mimari ve bağımlılık sağlığı

### Hedef

Temiz kurulumdan üretim build'ine kadar kod tabanının deterministik, strict, bakımı yapılabilir ve gereksiz client yükünden arındırılmış olduğunu doğrulamak.

### Yapılacaklar

1. Lockfile ile manifest uyumunu temiz bir kopya/worktree veya mevcut dosyaları bozmayan kontrollü ortamda `npm ci` ile doğrula. `npm install` ile lockfile'ı sebepsiz yenileme.
2. `npm ls --all` sonucundaki invalid, extraneous, peer conflict ve beklenmeyen duplicate paketleri sınıflandır.
3. `npm audit --omit=dev` ve tam dependency audit çalıştır. `npm audit fix --force` kullanma. Her advisory için:
   - production'a erişiyor mu;
   - exploit yolu var mı;
   - doğrudan mı transitif mi;
   - güvenli upgrade build/CAD/PDF uyumluluğunu etkiliyor mu
   sorularını cevapla.
4. ESLint ve iki TypeScript sözleşmesini ayrı doğrula:

```powershell
npm run lint
npx tsc --noEmit --incremental false
npx tsc -p tsconfig.next.json --noEmit --incremental false
```

1. Aşağıdaki kaynak sinyallerini dosya bazında incele; ham adetleri otomatik hata sayma:
   - `any`, `@ts-ignore`, `eslint-disable`;
   - raw `<img>` ve `<a>`;
   - `dangerouslySetInnerHTML`;
   - client component sınırları;
   - büyük browser-only paketlerin static import'u;
   - yinelenen veri kayıtları ve route metadata;
   - server-only kodun client bundle'a sızması;
   - kullanılmayan export, dead fallback ve dairesel bağımlılık şüphesi.
2. Her `"use client"` dosyası için zorunluluk arama; fakat page/layout seviyesinde gereksiz geniş client boundary varsa daralt ve davranışı test et.
3. `next/image`, font `latin-ext`, dynamic import, Server Component ve cache kullanımını route sınıfına göre denetle.
4. Üretim build'ini art arda iki kez çalıştır. İkinci build'in kaynak tree'de beklenmeyen diff üretmediğini, CAD prebuild varlıklarının doğru oluştuğunu ve route manifestinin değişmediğini doğrula.
5. `.vercelignore` ile dışlanan hiçbir dosyanın production build/typecheck/runtime tarafından import edilmediğini doğrula.
6. Build ve kalite scriptlerinin stderr'de hata yazıp `0` dönmediğini hata enjeksiyonuyla denetle. Test scriptini bilerek bozulan geçici fixture ile sınayıp sonra yalnız kendi geçici dosyanı kaldır.
7. Kanıtsız büyük refactor yapma. Her düzeltmeye küçük ve hedefli regresyon testi ekle.

### Kabul kriterleri

- Temiz kurulum ve iki ardışık build deterministiktir.
- ESLint ve iki TypeScript kapısı gerçek PASS verir.
- Production dependency ağacında açıklanmamış critical/high açık kalmaz.
- Generated varlıklar veya build çıktısı tracked source diff'i üretmez.
- Yeni `any`, toplu disable veya kalite kapısı gevşetmesi yoktur.
- Build sözleşmesi `next build --webpack` ve `npm run build` olarak korunur.

**Bu adım bitince 8 ana adım kalır.**

## ADIM 3/10 — İşlev, route, mühendislik doğruluğu ve çıktı sözleşmeleri

### Hedef

Kullanıcıya görünen bütün ana işlerin doğru sonuç verdiğini; invalid, sınır ve tekrarlı kullanımda bozulmadığını doğrulamak.

### Yapılacaklar

1. Production server üzerinde sitemap'teki bütün HTML URL'lerini tara:
   - doğru status;
   - redirect zinciri ve loop;
   - console error;
   - page error;
   - failed request;
   - hydration mismatch;
   - bozuk asset;
   - beklenmeyen empty state.
2. Tüm internal linkleri crawl et. Her link için target'ın mevcut, doğru canonical ve doğru auth/noindex sınıfında olduğunu doğrula.
3. Navigation, arama, kategori filtreleri, konu haritası, kaydedilenler, tema, geri/ileri ve refresh davranışlarını test et.
4. Her araç domain ailesinde en az şu veri sınıflarını kullan:
   - bilinen normal oracle;
   - sıfır ve negatif;
   - minimum/maksimum sınır;
   - sınırın hemen altı/üstü;
   - çok büyük sayı;
   - boş, NaN ve Infinity üretmeye çalışan girdi;
   - Türkçe ondalık virgül/nokta;
   - hızlı ardışık değişiklik ve reset;
   - birim dönüşümü.
5. Mühendislik sonuçlarında kaynak, birim, rounding ve hata mesajını doğrula. Formül değişikliği gerekirse yönetmelik maddesi/denklem numarası, bağımsız elle hesap ve en az üç oracle olmadan uygulama yapma.
6. Mevcut araç kapılarını çalıştır:

```powershell
npm run check:donati-hesabi
npm run check:tools
npm run check:deprem-infrastructure
npm run check:deprem-content
npm run check:content-quality
npm run check:ruhsat
npm run check:ruhsat-audit
npm run check:official-cost
npm run check:official-cost-pdf
npm run check:estimated-area
npm run check:estimated-area-pdf
npm run check:hizli-metraj
npm run check:hizli-metraj-pdf
npm run check:insaat-maliyeti
npm run check:insaat-maliyeti-pdf
```

1. Belgeler form stüdyolarında:
   - doldur, alan bazlı sıfırla, tümünü temizle;
   - Türkçe karakter/font;
   - regular/bold alan eşlemesi;
   - PDF oluşturma ve yeniden açma;
   - zoom sırasında yeniden derleme olmaması;
   - print/download dosya adı ve içerik;
   - eski AcroForm appearance izi kalmaması
   senaryolarını doğrula.
2. Ruhsat, maliyet ve metraj çıktılarında PDF/JSON/print ile ekrandaki sonuçların aynı snapshot'tan üretildiğini doğrula.
3. Dokümantasyon için izole test verisinde giriş, upload, finalize, retry, rename, move, star, search, share, revoke, public view/download, version restore, trash/restore ve empty-trash akışlarını uçtan uca çalıştır.
4. CAD için DXF/DWG/DWF, cached hit/miss, corrupt/unsupported, fallback, pan/zoom/fit, mesafe, alan, katman ve salt-okunur/no-mutation sözleşmesini mevcut corpus ile doğrula.
5. Her gerçek hata için önce failing test ekle; testin eski kodda FAIL, düzeltmede PASS olduğunu gör.

### Kabul kriterleri

- Sitemap smoke testinde status/console/request/page error yoktur.
- P0/P1 işlev veya hesap doğruluğu bulgusu kalmamıştır.
- Hesap sonuçları birim ve kaynakla doğrulanmıştır.
- Ekran, PDF, JSON ve print sonuçları birbirinden sapmaz.
- Dokümantasyon test verisi production verisinden tamamen izoledir.
- CAD testleri gerçek byte/fixture ve görünür çıktı kanıtı içerir; yalnız “viewer ready” sinyali yeterli değildir.

**Bu adım bitince 7 ana adım kalır.**

## ADIM 4/10 — Responsive UX, tarayıcı uyumu ve görsel tutarlılık

### Hedef

Ana görevlerin küçük telefon, tablet, masaüstü, touch ve farklı browser motorlarında aynı anlam ve kullanılabilirlikle tamamlanmasını sağlamak.

### Yapılacaklar

1. Genel site testleri için mevcut Document Studio config'ini bozmayan ayrı bir `playwright.site.config.ts` ve `tests/site-audit/` paketi oluştur. Test artifact'larını `test-results/site-audit` altında tut.
2. Tarayıcılar sistemde yoksa yalnız gereken Chromium, Firefox ve WebKit binary'lerini Playwright ile kur. Paket dosyalarını gereksiz değiştirme.
3. Zorunlu viewport matrisi:
   - 360×800;
   - 390×844;
   - 768×1024;
   - 1366×768;
   - 1920×1080.
4. Her temsilci route'u Chromium, Firefox ve WebKit'te; kritik akışları en az Chromium mobil ve WebKit mobilde test et.
5. Şunları otomatik ölç:
   - yatay taşma;
   - viewport dışı dialog/sheet;
   - header/footer çakışması;
   - sabit elementlerin içeriği kapatması;
   - touch target boyutu;
   - scroll lock'un kapanışta kalması;
   - responsive resim kırpılması;
   - layout shift;
   - odak göstergesinin görünür yüzey dışında kalması.
6. Dark/light tema eşliğini bütün ana route sınıflarında karşılaştır. Hardcoded tek tema rengi, okunmayan border/text, bozuk chart/CAD/PDF yüzeyi ve tema geçişi flash'ını düzelt.
7. 200% browser zoom, dar pencere, büyük sistem fontu, `prefers-reduced-motion` ve yüksek kontrast/forced-colors koşullarını test et.
8. Formlarda mobil klavye tipi, autocomplete, input mode, sticky sonuç, hata görünürlüğü ve klavyenin butonları kapatmaması kontrol edilir.
9. D3/SVG, chart, PDF ve CAD yüzeylerinde resize, orientation change, pinch, wheel, drag ve hızlı route değişimini test et.
10. Screenshot karşılaştırmasını yalnız stabil, deterministik yüzeylerde kullan. Rastgele tarih/veri/animasyonu gizleyerek gerçek bozukluğu maskeleme.

### Kabul kriterleri

- Kritik kullanıcı akışları hedef browser/viewport matrisinde tamamlanır.
- 320 CSS px'e kadar içerik kaybına yol açan yatay taşma yoktur.
- Light/dark temada okunabilirlik ve anlam eşliği vardır.
- Etkileşimli hedefler mobilde en az 44×44 CSS px'tir veya erişilebilir eşdeğeri açıkça gerekçelendirilmiştir.
- P0/P1 browser veya responsive bulgusu kalmamıştır.

**Bu adım bitince 6 ana adım kalır.**

## ADIM 5/10 — WCAG 2.2 AA erişilebilirlik

### Hedef

Siteyi yalnız mouse ile değil; klavye, ekran okuyucu, büyütme, reduced motion ve yüksek kontrast kullanan kişiler için de görev tamamlanabilir hâle getirmek.

### Yapılacaklar

1. Mevcut araçlarla güvenilir otomasyon yoksa `@axe-core/playwright` paketini yalnız kalıcı testlerde kullanılmak üzere exact dev dependency olarak ekle.
2. Route matrisinde otomatik axe taraması çalıştır; sonuçları component/route bazında grupla. Otomasyonun yakalamadığı kontrolleri manuel matrise ekle.
3. Sayfa dili, landmark, tek ve anlamlı `h1`, heading sırası, skip link, main region, nav label ve footer semantiğini kontrol et.
4. Bütün interaktif öğeleri yalnız klavyeyle kullan:
   - Tab/Shift+Tab sırası;
   - Enter/Space;
   - Escape;
   - dialog/sheet focus trap;
   - kapanışta focus restore;
   - route geçişinde focus yönetimi;
   - görünür focus ring.
5. Formlarda programatik label, açıklama, required, error association, Türkçe hata metni, sonuç için uygun live region ve yalnız renge dayanmayan durum gösterimi sağla.
6. Renk kontrastını normal metin, büyük metin, ikon, border, disabled/focus ve chart serileri için dark/light temada ölç.
7. D3/SVG/chart için metinsel özet veya erişilebilir tablo; anlamlı görsel için alt/caption; dekoratif görsel için boş alt yaklaşımını doğrula.
8. CAD/PDF/canvas yüzeyinde toolbar adları, `aria-pressed` durumları, klavye alternatifi, ölçüm sonuçlarının okunabilir DOM karşılığı ve panel focus davranışını doğrula.
9. Toast, loading, error, progress, upload ve uzun süren CAD dönüşüm durumlarının ekran okuyucuya gürültü oluşturmadan bildirildiğini kontrol et.
10. Animasyonları reduced-motion'da azalt; içerik veya kontrolü tamamen kaybetme.
11. 200% zoom ve 400% reflow testinde ana görevlerin tamamlanabildiğini doğrula.

### Kabul kriterleri

- Temsilci matriste otomatik critical/serious axe ihlali yoktur.
- Kritik görevlerin tamamı yalnız klavyeyle bitirilebilir.
- Focus kaybolmaz, dialog/sheet arkasına kaçmaz ve kapanışta doğru tetikleyiciye döner.
- Metin/ikon/etkileşim kontrastı WCAG 2.2 AA'yı karşılar.
- Canvas/SVG tabanlı teknik bilgi için erişilebilir alternatif vardır.

**Bu adım bitince 5 ana adım kalır.**

## ADIM 6/10 — Hız, Core Web Vitals, bundle ve uzun oturum performansı

### Hedef

Performansı hisle değil; production build, tekrarlı ölçüm, route sınıfı ve açık bütçelerle iyileştirmek.

### Ölçüm kuralları

- Dev server sonucu kullanılmaz.
- Her route için en az 1 ısınma + 3 kayıtlı koşu yapılır; medyan ve en kötü koşu raporlanır.
- Cold cache ile warm cache ayrı tutulur.
- Yerel Lighthouse sonucu field p75 sonucu gibi sunulmaz.
- INP için gerçek kullanıcı verisi yoksa “field doğrulandı” denmez; Event Timing/Playwright ölçümü yalnız lab proxy olarak etiketlenir.
- Ölçüm koşulları, cihaz emülasyonu, CPU/ağ profili ve browser sürümü rapora yazılır.

### Public route bütçesi

| Metrik | Hedef |
| --- | ---: |
| Lighthouse Performance medyanı | ≥ 90 |
| Tek koşu alt sınırı | ≥ 85 |
| LCP | ≤ 2,5 s |
| CLS | ≤ 0,10 |
| TBT | ≤ 200 ms |
| Lab interaction proxy | ≤ 200 ms |
| Lighthouse Accessibility / Best Practices / SEO | Her biri ≥ 95 |
| Mevcut baseline'a göre route JS/artifact regresyonu | Gerekçesiz en fazla %5 |

Dokümantasyon/CAD gibi ağır uygulama yüzeylerinde public landing bütçesi ile viewer “kullanılabilir olma” bütçesi ayrılır. CAD'nin mevcut bounded timeout'ları ve gerçek fixture sınıfları `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` `9'dan alınır; eşik değişirse ölçümle ve aynı yaşayan belge güncellenerek değiştirilir.

### Yapılacaklar

1. Otomatik ve tekrar üretilebilir performans kapısı için mevcut araç yeterli değilse Lighthouse'ı exact dev dependency olarak ekle ve `scripts/check-site-performance.mjs` oluştur.
2. Temsilci route matrisi için Lighthouse JSON/HTML, navigation timing, resource timing ve build route boyutlarını kaydet.
3. LCP elementini, layout shift kaynaklarını, long task'ları ve ana thread bloklayan paketleri route bazında belirle.
4. Client boundary ve bundle analizi yap. CAD/WASM, PDF.js, jsPDF, html2canvas, xlsx, D3 ve ağır chart paketleri onları kullanmayan route'ların ilk bundle'ına girmemelidir.
5. Görsellerde doğru `sizes`, width/height veya aspect ratio, AVIF/WebP, lazy/eager önceliği ve gereksiz Unsplash transferini kontrol et.
6. Fontlarda `latin-ext`, `display: swap`, gereksiz weight ve preload davranışını doğrula.
7. API/SSR TTFB, cache-control, private/public cache ayrımı, request waterfall ve yinelenen fetchleri incele.
8. Arama, form input, chart, D3, PDF zoom ve CAD pointer hareketinde re-render, event listener, RAF, worker ve memory profilini ölç.
9. Uzun oturum testleri:
   - 50 hızlı route değişimi;
   - 100 form güncellemesi;
   - tema geçişleri;
   - PDF zoom;
   - art arda CAD dosyası aç/kapat;
   - 800+ öğeli Dokümantasyon listesi.
10. Slow 4G ve CPU throttling altında loading/cancel/progress davranışını doğrula.
11. En büyük problemi önce düzelt. Mikro optimizasyon için mimariyi karmaşıklaştırma.
12. Her performans düzeltmesine bütçe veya regresyon testi ekle; snapshot'ı yeni kötü değere güncelleyerek gate'i kandırma.

### Kabul kriterleri

- Public route matrisi bütçeleri karşılar veya teknik olarak ulaşılamayan tekil eşik için açık ölçüm, kök neden ve kullanıcı onaylı istisna vardır.
- Unrelated public route ilk yükünde CAD/PDF/export motorları yoktur.
- Uzun kullanımda sürekli büyüyen listener, worker, timer, object URL veya memory paterni yoktur.
- Cache davranışı private veriyi public cache'e açmaz.
- Performans iyileştirmesi işlev, erişilebilirlik veya görsel doğruluğu bozmaz.

**Bu adım bitince 4 ana adım kalır.**

## ADIM 7/10 — SEO, içerik bütünlüğü, keşfedilebilirlik ve güven metinleri

### Hedef

Arama motorlarına doğru sayfayı doğru metadata ile sunmak; kullanıcıya güncel, Türkçe, kaynaklı ve bozuk linksiz içerik vermek.

### Yapılacaklar

1. Indexable route'larda unique ve anlamlı title, description, canonical, Open Graph ve Twitter metadata'yı doğrula.
2. Root metadata'dan yanlışlıkla `/` canonical'ı miras alan alt sayfaları tespit et. Her canonical gerçek, 200 dönen ve tercih edilen URL olmalıdır.
3. Sitemap için:
   - yalnız 200 dönen canonical/indexable URL;
   - duplicate URL olmaması;
   - private Dokümantasyon/public-token route'larının dışlanması;
   - `lastModified` değerinin gerçek kaynakla uyumu;
   - dinamik makale/araç/bina rehberi kapsaması
   kontrollerini otomatikleştir.
4. Robots kurallarını `/api/`, auth, Dokümantasyon ve share token yüzeyleri için doğrula. Robots'un güvenlik kontrolü olmadığını; auth'ın ayrıca zorunlu olduğunu test et.
5. Redirect, trailing slash, eski `/araclar` yolu, 404 ve canonical zincirlerinde loop/çoklu hop olmadığını kontrol et.
6. Structured data varsa schema tipini, required alanları ve görünür içerikle tutarlılığını denetle. Olmayan schema'yı sırf skor için ekleme.
7. Open Graph görselini 1200×630, Türkçe karakter, tema ve okunabilirlik açısından doğrula.
8. İçerik kalite kontrolleri:
   - `<html lang="tr">`;
   - `latin-ext`;
   - mojibake/bozuk Türkçe karakter;
   - heading düzeni;
   - image alt/caption;
   - teknik referans ve tarih;
   - placeholder/duplicate;
   - yanlış/ölü related-tool CTA;
   - görünür İngilizce teknik hata metni.
9. Deprem içeriklerinde canonical author, formula fence, sembol/birim, callout, figure ve TBDY/TS 500 sınırlarını mevcut kurala göre denetle.
10. Bütün internal linkleri, kritik external resmi kaynakları ve download linklerini doğrula. External link ağ hatası ile gerçek 404'ü ayır.
11. Site içi aramada Türkçe büyük/küçük harf, `ı/i`, `ş/s`, boş sonuç, özel karakter ve klavye kullanımını test et.
12. Gizlilik, kullanım koşulları, iletişim ve mühendislik hesabı sorumluluk/uyarı metinlerinin ürün davranışıyla çelişmediğini kontrol et. Hukuki görüş iddiasında bulunma.
13. PWA hedefi yoksa manifest eksikliğini otomatik hata sayma; hedef varsa ayrı kabul kriteri oluştur.

### Kabul kriterleri

- Indexable URL'ler unique ve self-canonical metadata taşır.
- Sitemap/robots/private route sınıfları birbiriyle tutarlıdır.
- Broken internal link ve redirect loop yoktur.
- Kullanıcıya görünen metinlerde mojibake veya beklenmeyen İngilizce hata yoktur.
- Teknik içerik kaynak/birim ve proje içerik kurallarını karşılar.
- P0/P1 SEO veya içerik güven bulgusu kalmamıştır.

**Bu adım bitince 3 ana adım kalır.**

## ADIM 8/10 — Güvenlik, gizlilik, yetkilendirme ve veri bütünlüğü

### Hedef

Public içerik, hesap araçları ve özellikle Dokümantasyon dosya yaşam döngüsünde yetkisiz erişim, veri sızıntısı, zararlı dosya, abuse ve supply-chain risklerini kapatmak.

### Güvenli test sınırı

Aktif exploit/fuzz yalnız yerel veya açıkça ayrılmış test ortamında yapılır. Production'a yük bindiren tarama, brute force, destructive delete veya gerçek kullanıcı verisiyle test yapılmaz.

### Yapılacaklar

1. Secret taraması yap; eşleşme değerlerini rapora kopyalama. Gerçek secret şüphesinde çalışma durur, kullanıcıya dosya/konum redacted biçimde bildirilir ve rotation planı hazırlanır.
2. `.env.example`, runtime env validation ve Vercel env ayrımını kontrol et. Secret hiçbir `NEXT_PUBLIC_*` değişkenine veya client bundle'a girmemelidir.
3. Global response header matrisi oluştur:
   - Content-Security-Policy;
   - Strict-Transport-Security;
   - X-Content-Type-Options;
   - Referrer-Policy;
   - Permissions-Policy;
   - frame-ancestors/X-Frame-Options;
   - private route cache-control.
4. CSP'yi uygulamanın gerçek font, image, worker/WASM, Blob ve PDF/CAD ihtiyaçlarına göre en dar çalışan politika olarak test et. `unsafe-eval` veya geniş wildcard'ı kanıtsız ekleme.
5. Auth/session:
   - cookie Secure/HttpOnly/SameSite;
   - session expiry/version;
   - login/logout;
   - brute-force/rate limit;
   - session fixation;
   - CSRF gerektiren mutation'lar;
   - auth olmayan doğrudan API çağrısı
   senaryolarını test et.
6. BOLA/IDOR matrisi kur. Kullanıcı/token A'nın file/folder/share/version kimliğiyle kullanıcı/token B erişim elde edememelidir.
7. Public share token için entropy, expiry, password doğrulama, revoke, download scope, zip kapsamı, cache ve referrer sızıntısını kontrol et.
8. Upload/download güvenliği:
   - path traversal ve normalize;
   - dosya adı XSS/control character;
   - MIME/extension uyuşmazlığı;
   - boyut ve adet limiti;
   - bozuk/şüpheli PDF, SVG, archive ve CAD;
   - zip bomb/çok büyük açılım;
   - content-disposition;
   - partial upload/orphan cleanup;
   - idempotent finalize.
9. API route'larında Zod/input validation, payload limiti, doğru status, hata mesajında stack/secret olmaması, SQL injection, open redirect, SSRF ve request timeout davranışını test et.
10. `dangerouslySetInnerHTML`, Markdown/HTML render, SVG, PDF ve kullanıcı kontrollü metadata akışlarını XSS açısından tek tek doğrula.
11. CAD preview araçlarının hiçbir POST/PUT/PATCH/DELETE/save/version isteği üretmediğini network assertion ile kanıtla.
12. Rate limit'in yalnız process memory varsayımına dayanıp production dağıtık ortamında etkisiz kalmadığını değerlendir.
13. DB/Blob/local storage verilerinde tenant/scope, retention, trash, restore, backup ve permanent delete tutarlılığını test et.
14. Dependency advisory, license ve `THIRD_PARTY_NOTICES.md` uyumunu tamamla. Blind major upgrade yapma; PDF/CAD gerçek fixture regresyonu olmadan motor yükseltme.
15. Güvenlik testlerini kalıcı `check:site-security` kapısında topla; gerçek secret veya özel fixture içermediğini doğrula.

### Kabul kriterleri

- Açık P0/P1 güvenlik veya veri bütünlüğü bulgusu yoktur.
- Auth ve object-level authorization negatif testleri geçer.
- Private yanıtlar public cache'e düşmez ve arama motorunca indexlenmez.
- Upload/share/download sınırları zararlı girdide güvenli terminal sonuç verir.
- Secret client bundle, log, rapor veya Git diff'inde yoktur.
- Supply-chain bulguları exploitability ve upgrade kanıtıyla kapatılmış veya açıkça bloke olarak raporlanmıştır; sessizce yok sayılmamıştır.

**Bu adım bitince 2 ana adım kalır.**

## ADIM 9/10 — Stabilite, hata toleransı, gözlemlenebilirlik, CI ve Vercel hazırlığı

### Hedef

Normal akış dışındaki hata koşullarında sistemin kontrollü davranmasını; operasyon, CI ve deployment süreçlerinin false-green üretmemesini sağlamak.

### Yapılacaklar

1. Kontrollü fault injection ile şu durumları test et:
   - DB bağlantısı yok/yavaş;
   - Blob/storage hata veya timeout;
   - upload yarıda kesilmesi;
   - finalize iki kez çağrılması;
   - dosya silme sırasında storage başarısızlığı;
   - bozuk JSON/PDF/CAD;
   - worker/WASM yüklenememesi;
   - network offline/online;
   - route değişiminde request abort;
   - hızlı tekrar tıklama.
2. Her beklenen hata için bounded timeout, cancel, retry/backoff, idempotency ve kullanıcıya Türkçe actionable mesaj doğrula. Sonsuz spinner yasaktır.
3. Global ve route-level error/loading/not-found sınırlarını incele. Bir modül hatası tüm site shell'ini gereksiz yere düşürmemelidir; fakat kritik hata sessiz empty state'e çevrilmemelidir.
4. React hydration, unhandled rejection, worker leak, object URL leak, timer/listener cleanup ve hızlı unmount yarışlarını test et.
5. Dokümantasyon için test veri kopyası üzerinde backup, restore ve reconciliation dry-run yap. Gerçek `.data/dok_db.json` dosyasını değiştirme; dosya sayısı/hash snapshot'ını önce ve sonra karşılaştır.
6. Gözlemlenebilirlik sözleşmesi:
   - yapılandırılmış ve seviyeli server log;
   - request/correlation kimliği;
   - secret/PII redaction;
   - auth/upload/storage/CAD hata sınıfları;
   - readiness anlamı;
   - Web Vitals ve kritik iş akışı ölçümleri;
   - alarm/inceleme için yeterli bağlam.
7. Production `console.log` ekleme. Gerekli telemetry sağlayıcısı yoksa vendor eklemek yerine önce vendor-agnostic ölçüm ve log sözleşmesini kur.
8. Tüm GitHub workflow'larını amaç, trigger, branch, secret, artifact ve deployment etkisine göre envanterle. Tarihsel CAD workflow'larını kanıtsız silme; aktif gate ile gereksiz probe'u ayır.
9. CI scriptlerinde false-positive/false-negative test yap. Hata olduğunda non-zero, fixture/precondition eksikken BLOCKED davranışı üret.
10. Self-commit workflow, noop deployment ve gereksiz preview olmadığını doğrula.
11. Vercel sözleşmesini kontrol et:

- `vercel.json installCommand = npm ci`;
- `buildCommand = npm run build`;
- `next build --webpack`;
- `prebuild` CAD sync;
- `tsconfig.next.json`;
- `.vercelignore`;
- runtime env;
- Node sürümü;
- route/function limitleri.
 1. Local bütün kapılar yeşil olmadan Preview oluşturma. Gerekirse planın tek Preview'ında:

- READY build;
- public smoke;
- auth/private cache header;
- bir hesap;
- bir PDF;
- bir Dokümantasyon upload/share;
- gerçek CAD fixture;
- performans sanity
   kontrolü yap.
 1. Rollback koşullarını yaz: hangi metrik/hata rollback tetikler, son doğrulanmış deployment hangisi, veri migrasyonu varsa geriye uyumu nedir.

### Kabul kriterleri

- Fault injection veri kaybı, sonsuz bekleme veya yetki sızıntısı üretmez.
- Backup/reconcile testi yalnız izole kopyada başarılıdır.
- Gerekli loglar tanı koydurur; secret/PII içermez.
- CI gerçek hatada kırmızı, eksik ön koşulda BLOCKED olur.
- Yerel build ile Vercel build sözleşmesi aynıdır.
- Preview kullanıldıysa tek doğrulanmış commit READY olur ve yeni P0/P1 bulgu üretmez.

**Bu adım bitince 1 ana adım kalır.**

## ADIM 10/10 — Bulguları kapatma, birleşik release kapısı ve nihai teslim

### Hedef

Önceki dokuz adımdaki tüm kanıtları birleştirmek, regresyonları kapatmak ve tek atomic release için doğrulanmış paket üretmek.

### Yapılacaklar

1. `FINDINGS.md` kayıtlarını tek tek denetle:
   - P0/P1 açık kalamaz;
   - P2 mümkünse kapanır; ertelenirse açık kullanıcı onayı, ölçü ve hedef tarih gerekir;
   - P3 backlog'a gerekçeyle taşınabilir;
   - “düzeltildi” olup regresyon testi olmayan kayıt kapanmaz.
2. Yeni genel kalite kapılarını package scriptlerinde kalıcılaştır:
   - `check:site-a11y`;
   - `check:site-performance`;
   - `check:site-security`;
   - `check:site-e2e`;
   - tekrar build etmeyen, mevcut domain kapılarını kullanan `check:site-release`.
3. Birleşik kapı mevcut testleri kaldırmaz veya zayıflatmaz. Aynı pahalı build'i gereksiz tekrar çalıştırmak yerine sıralamayı optimize eder.
4. Temiz ve kontrollü final doğrulama sırası:

```powershell
git diff --check
npm run lint
npx tsc --noEmit --incremental false
npx tsc -p tsconfig.next.json --noEmit --incremental false
npm run check:site-quality
npm run check:navigation
npm run check:homepage
npm run check:visual-system
npm run check:content-quality
npm run check:deprem-infrastructure
npm run check:deprem-content
npm run check:tools
npm run check:ruhsat
npm run check:ruhsat-audit
npm run check:dokumantasyon:auth
npm run check:dokumantasyon:persistence
npm run check:dokumantasyon:readiness
npm run check:document-studio:all
npm run check:site-security
npm run build
npm run check:smoke
npm run check:site-e2e
npm run check:site-a11y
npm run check:site-performance
npm run check:document-studio:e2e
npm run check:cad-real-user-release
```

1. Komutlardan biri diğerini kapsıyorsa birleşik runner aynı testi tekrar çalıştırmayabilir; fakat `RELEASE_REPORT.md` hangi alt kapının hangi komutla karşılandığını açıkça göstermelidir.
2. Final production build sonrası hiçbir source/lockfile diff'i kendiliğinden oluşmamalıdır.
3. Baseline ile finali karşılaştır:
   - test sayısı;
   - route/smoke sonucu;
   - bundle boyutları;
   - Lighthouse/CWV lab metrikleri;
   - memory/long task;
   - axe;
   - dependency advisory;
   - açık bulgu sayıları.
4. Güncellenmesi gereken `PROJECT.md` ve modül yaşayan dokümanlarını güncelle. Tarihsel planı yeni production gerçeği gibi kullanma.
5. Geçici debug, probe, fixture, secret, video, screenshot, Lighthouse HTML/JSON ve özel kullanıcı verisinin Git diff'ine sızmadığını kontrol et.
6. `RELEASE_REPORT.md` içine:
    - değişen dosyalar;
    - davranış değişiklikleri;
    - yeni bağımlılıklar;
    - tüm kapı sonuçları;
    - performans önce/sonra;
    - güvenlik ve erişilebilirlik özeti;
    - bilinen kalan riskler;
    - env/migration gereksinimi;
    - Preview URL/commit varsa;
    - rollback adımları
    yaz.
7. Kullanıcı final diff ve raporu onaylamadan push/deploy yapma.
8. Yerel IDE akışında onaydan sonra tek anlamlı atomic commit ile `main` push yapılabilir; bu tek final Production deploy'u üretir. Uzak AI akışında doğrudan `main` yazılmaz ve repo branch/[skip ci] kuralları uygulanır.
9. Production oluştuysa aynı doğrulanmış artifact üzerinde kısa post-deploy smoke ve Web Vitals/header sanity yap. Hata varsa noop commit değil rollback veya gerçek düzeltme kullan.

### Nihai Definition of Done

| Alan | Zorunlu final durum |
| --- | --- |
| Build/type | Temiz kurulum, lint, iki typecheck ve production build PASS |
| İşlev | Tüm sitemap smoke temiz; kritik görev matrisi PASS |
| Hesap doğruluğu | Oracle, birim ve kaynak doğrulandı; P0/P1 yok |
| Responsive/browser | Kritik akışlar hedef matrisinde PASS |
| Erişilebilirlik | Critical/serious axe yok; klavye görevleri tamam |
| Performans | Bütçeler PASS veya açık kullanıcı onaylı tekil istisna |
| SEO/içerik | Canonical/sitemap/robots/link/Türkçe kalite PASS |
| Güvenlik | P0/P1 yok; auth/IDOR/upload/share negatif testleri PASS |
| Stabilite | Fault injection bounded ve veri kayıpsız |
| CI/deploy | False-green yok; gereksiz Preview yok; rollback hazır |
| Repo hijyeni | Secret, debug artifact, özel fixture ve kullanıcı verisi diff'te yok |
| Rapor | Baseline, findings, test matrix ve release report güncel |

**Bu adım bitince plan tamamlanır; 0 ana adım kalır.**

# 7. Başlıca durma koşulları

Gemini aşağıdaki durumlarda varsayım yapıp devam etmemeli, kanıtı kaydedip kullanıcıya dönmelidir:

- Gerçek secret veya kişisel veri sızıntısı şüphesi
- Production veri kaybı veya destructive migration ihtimali
- Mühendislik formülü değişikliği için güvenilir standart/oracle bulunmaması
- Kullanıcının mevcut dirty değişikliğiyle çözülemeyen edit çakışması
- Preview/Production deploy veya dış sistemde yazma için yeni yetki gereksinimi
- Testin özel/proprietary fixture olmadan anlamlı çalışamaması
- Güvenlik testi için production'a aktif saldırı benzeri trafik gerekmesi
- Dependency major upgrade'inin CAD/PDF lisans veya fidelity sözleşmesini belirsizleştirmesi
- Aynı hata üç kez farklı yüzeyde semptom düzeltmesiyle geri geliyorsa kök nedenin hâlâ bilinmemesi

# 8. Gemini 3.7 Flash'a verilecek başlangıç komutu

Aşağıdaki komut yeni Gemini oturumuna doğrudan verilebilir:

> `PLAN/SITE_GENEL_DENETIM_VE_IYILESTIRME_GEMINI_3_7_FLASH_PLANI.md` dosyasını, ardından `PROJECT.md`, `AGENTS.md` ve ilgili `.agents/rules/*.md` dosyalarını UTF-8 olarak tamamen oku. Şimdilik yalnız ADIM 1/10'u uygula. Mevcut dirty çalışma ağacındaki kullanıcı değişikliklerini resetleme, silme, checkout/stash yapma ve push/deploy etme. Önce baseline kanıtını üret; ürün kodunu P0 secret/veri kaybı dışında düzeltme. Adım sonunda değişen dosyaları, çalıştırılan komutları, PASS/FAIL/BLOCKED sonuçlarını, açılan bulgu kimliklerini ve 9 adım kaldığını raporla. ADIM 1 geçiş kapısı sağlanmadan ADIM 2'ye başlama.

Sonraki her oturumda aynı çalışma biçimi korunur: yalnız sıradaki tek adım, hedefli değişiklik, kanıt, ilgili yaşayan doküman ve açık kalan adım sayısı.

# 9. Son kalite ilkesi

Bu planın başarısı eklenen kod satırı veya çalıştırılan komut sayısıyla ölçülmez. Başarı; gerçek bir kullanıcı görevinin, doğru mühendislik sonucu ve doğru yetki sınırıyla, kabul edilebilir sürede, farklı cihaz ve erişim yöntemlerinde tamamlandığının yeniden üretilebilir kanıtıdır.
