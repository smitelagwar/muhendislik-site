# Belgeler — kapsamlı denetim, sağlamlaştırma ve kabul planı

**Hazırlanma tarihi:** 16 Ekim 2026  
**Uygulayıcı:** Kullanıcının seçtiği Gemini 3.8 Flash, High ayarı  
**Proje:** `C:\Users\hsyn\Desktop\muhendis-mimar-portali`  
**Kapsam:** `/belgeler`, beş form stüdyosu, belge üretimi, PDF önizleme/indirme/yazdırma ve bunların doğrulaması.  
**Çalışma biçimi:** Küçük aşamalar; önce kanıt, gerekirse dar düzeltme, sonra aynı davranışın tekrar doğrulanması.

> Bu belge bir uygulama planıdır; aşağıdaki yeni aşamaların tamamlanmış olduğu anlamına gelmez. Önceden doğrulanmış sonuçlar Bölüm 1'de, bu turdaki yerel düzeltme Bölüm 2'de ayrıdır. Bir inceleme aşamasında sorun bulunmazsa kod değiştirmeden kanıtla kapatmak doğru sonuçtur.

## 1. Başlangıç durumu: neyi biliyoruz, neyi henüz bilmiyoruz?

Planın kaynak incelemesi `7e305c8359aef50c990b6d3b1f7bc83263642839` üzerinde yapıldı. Önceki doğrulanmış Production uygulama commit'i `fa22584091afea3005e8c6be7441232e710b6c28`; iki commit'in runtime kaynakları aynıdır. Uygulamaya başlarken HEAD ve canlı deployment yeniden kontrol edilmelidir; bu hash'lere körü körüne dönülmemelidir.

### 1.1 Daha önce düzeltilen ve test edilen davranışlar

- Mobil tema eylemi alt çubuktaki `⋯ / Diğer belge işlemleri` menüsündedir. Önizlemede ayrı tema satırı yoktur. Masaüstünde tema switch'i vardır.
- Normal metin ölçeğinde tek sayfalı mobil PDF araç çubuğu 44 px'tir; önceki 91 px yüksekliğe göre 47 px alan kazanılmıştır. İki sayfalı Sözleşme'de dar panelin sayfa kontrolleri ikinci satır gerektirebilir.
- Zoom grubu önizleme panelinin merkezinde kalır; tema değişimi ve zoom yeni PDF üretmez.
- Genel temizle/sıfırla işlemi tek adım geri alınır. Sonraki düzenleme, alan sıfırlama ve Ruhsat örnek veri işlemi eski geri alma kaydını geçersiz kılar.
- Sözleşme ve Taahhütname'de bağlı imza alanları kaynak değerle birlikte güncellenir; elle farklılaştırılmış imza korunur.
- Katalogda iç içe `main` kaldırılmıştır; kart başlıkları `h2`'dir.
- Şablon API'si `toString`, `constructor`, `__proto__` gibi geçersiz kimliklerde 404 verir.
- PDF.js yerel ve sürümlü varlıklardan yüklenir. CDN fallback yoktur.

Önceki doğrulama: 51 yerel browser senaryosu, 20 canlı senaryo; dört belge statik/PDF testi; production build; ilgili lint/typecheck; `check:tools` içindeki 30/30 araç smoke kontrolü geçti. Beş uzun metin çıktısının altı PDF sayfası görsel olarak incelendi; 59 PDF alanı/widget için değer ve appearance kontrol edildi. Ayrıntılı kayıt: [önceki denetim](BELGELER_FULL_REVIEW_2026-10-16.md).

**Bu rakamları yeni çalışmanın sonucu olarak kopyalama.** Yeni HEAD, yeni test komutu ve yeni çıktıyı ayrı kaydet. Proje bazlı `skip` sayısı başarı sayısı değildir.

### 1.2 Doğrulama sınırları

| Alan | Mevcut kanıt | Bu planla tamamlanacak kısım |
| --- | --- | --- |
| Mobil yerleşim | Chromium viewport matrisi ve temel WebKit kontrolü | Fiziksel Android/iOS, adres çubuğu, gerçek ekran klavyesi, kesinti/dönüş |
| PDF indirme | Masaüstü browser indirmesi ve gerçek AcroForm değeri | Mobil dosyaya kaydetme, farklı PDF okuyucuları, tüm alanların eşleşmesi |
| Yazdırma | `window.open`/`print` çağrısını taklit eden otomatik test | Gerçek tarayıcı PDF penceresi, print preview, A4 çıktı |
| Erişilebilirlik | Axe ciddi/kritik taraması ve bazı klavye testleri | İki tema, gerçek odak sırası, ekran okuyucu ve hata geri bildirimi |
| Yarış koşulları | Hızlı düzenleme ve sekme geçişi | Geciken kaynak, eski isteğin geç bitmesi, üretim/çizim hatalarının birleşmesi |
| Kaynak kullanımı | Canvas sınırı ve blob temizleme kontrolü | Uzun oturum, ısınmış önbellek, arka plandan dönüş, düşük kaynaklı cihaz |
| Genel TypeScript | Önceki genel taramada kapsam dışı hatalar var | Başlangıç karşılaştırması; Belgeler değişikliğinin yeni hata eklemediğinin kanıtı |

Playwright cihaz ayarları viewport, dokunma ve benzeri özellikleri taklit eder; fiziksel telefon kabulünü ayrı tutma kararı bu projenin test yaklaşımıdır. [Playwright emülasyon açıklaması](https://playwright.dev/docs/emulation).

### 1.3 Kod incelemesinde izlenmesi gereken adaylar — henüz doğrulanmış hata değildir

1. `BelgeStudioPdfPreview` içindeki PDF.js modül yükleme / `loadingTask.promise` / render bekleme yollarında üretim hook'undaki gibi açık bir toplam süre sınırı görünmüyor. Ağda uzun bekleme senaryosu üret; sonsuz yüklenme doğrulanırsa Aşama 06'da düzelt.
2. `handlePreviewRetry`, mevcut snapshot ve yerel preview hatasında önce yeniden çizim yolunu seçiyor. Aynı anda üretim hatası da varsa doğru hata kaynağının yeniden denenmesini Aşama 06'da test et.
3. Yazdırma/yeni sekme, snapshot'ın blob URL ömrüne bağlı. Ana form düzenlenince veya stüdyo kapanınca yeni sekmedeki PDF'nin kullanılabilirliğini gerçek browser ile ölç; varsayımla URL'leri süresiz saklama.
4. Uzun alan uyarıları üstte birikebilir. Birden fazla alan uzunken 320 px ve klavyeli görünümde formun kullanılabilir kalmasını ölç.
5. Katalog kartlarında bazı hareket azaltma sınıfları var; kart gövdesi ve ikon hareketlerinin tamamını kapsadığı ayrıca kontrol edilmeli.
6. Mevcut WebKit testi kendi browser'ını açıyor ve localhost portunu doğrudan kullanıyor. `baseURL` ile canlıya yönlendirildiğinde bu testin de canlıya gittiğini varsayma; Aşama 01'de test altyapısını açık hedefli hale getir.
7. Uzun metnin AcroForm değerinde saklanması, baskıda rahat okunabildiği anlamına gelmez. Dar tek satır alanlarında küçülen punto ayrı değerlendirilmelidir.

Bu maddeler için otomatik olarak geniş refactor yapma. Önce tekrar üretim ve gözlenen sonuç gerekir.

## 2. Plan hazırlanırken yapılan yerel düzeltme

**B-001 — Sözleşme YİBF girdisi sessizce değişiyordu.**

- Dosya: `src/components/sozlesme-studio.tsx`, YİBF input `onChange`.
- Önce: `AB-123/45` → `12345`. Kullanıcıya uyarı göstermenin yanında harf ve ayraçlar siliniyordu.
- Sonra: Ham girdi `handleFieldChange`'e aktarılır; mevcut format uyarısı ve `inputMode="numeric"` korunur. Bu bir formatın geçerli kabul edilmesi değildir; kullanıcı metni kaybolmadan düzeltme yapabilir.
- Regresyon: `tests/site-audit/belgeler-functional-audit.spec.ts` içindeki `Sözleşme YİBF uyarısı kullanıcı girdisini silmeden PDF'e aktarmalı` testi.
- Test eski production build'inde gerçekten başarısız oldu: beklenen `AB-123/45`, alınan `12345`.
- Test sonrasında gerçek indirilen PDF'in `yibf` değerini de okur; ayrıca `1234567` ve `-` için mevcut uyarısız davranışı kontrol eder.
- Bu değişiklik planla birlikte **yerel çalışma ağacında** teslim edilir. Yeni bir push/deployment yapılmış varsayma; Aşama 00'da mevcut diff'i koru.

Önceki denetim raporundaki deployment notu da düzeltildi: `[skip ci] [skip vercel]` bu projede main build'ini engellemedi. Ek build iptal edilmişti. Gemini yanlış deploy varsayımıyla ilerlememelidir.

Bu turun son doğrulama sonucu belgenin sonundaki teslim kaydına yazılacaktır.

## 3. Uygulayıcı için çalışma sözleşmesi

### 3.1 Her aşamada uygulanacak kısa döngü

1. İlgili aşamayı, belirtilen dosyaları ve güncel durum kaydını oku.
2. Başlangıçta `git status --short --branch` ve diff'i incele. Önceki ajan/kullanıcı değişikliklerini silme.
3. En fazla bir davranış sorununu ele al. Hangi kullanıcı adımı bozuk, beklenen ne, kanıt nerede: önce bunları yaz.
4. Hata varsa, uygun olduğunda önce onu yakalayan test ekle ve eski davranışta başarısız olduğunu göster.
5. En küçük düzeltmeyi yap. İlk düzeltme çalışmıyorsa rastgele ikinci/üçüncü mimari deneme yapma; hata kaynağını yeniden incele.
6. İlgili testi, gerekli statik kontrolleri ve görsel kontrolü tamamla.
7. Durum kaydına dosyalar, komut, sonuç, kanıt yolu ve sonraki aşamayı ekle.
8. Aşama kabul koşulları karşılanmadan bağımlı aşamayı tamamlandı işaretleme. Bir aşama bitince kısa rapor ver; aşama aşama çalıştırılıyorsan yeni kullanıcı komutunu bekle.

### 3.2 Kapasiteyi koruyan uygulama sınırları

- Her ajan turunda yalnız bir aşama veya tek bir alt adım. Bütün planı tek cevapta uygulamaya çalışma.
- Normal düzeltmede 1–3 runtime dosyası hedefle. Beş stüdyoyu ilgilendiren değişikliği önce birinde doğrula, sonra aynı sözleşmeyi diğerlerine aktar.
- Tam dosyayı yeniden yazma; dar patch kullan. Formatlama/import sıralama bahanesiyle yüzlerce ilgisiz satır değiştirme.
- Satır numaraları zamanla değişir; fonksiyon/component adıyla bul. Var olmayan hook, test scripti veya API icat etme.
- Testi geçsin diye assertion silme, timeout'u sınırsız büyütme, hatayı catch edip yutma, a11y kuralını kapatma.
- Ölçülmeyen performans iddiası yazma. Çalıştırılmayan test `BEKLİYOR` olarak kalır.
- Sorunsuz kodu sırf plan uzun diye değiştirme. Büyük mimari yeniden yazım, yeni paket, PDF.js yükseltmesi ve genel tasarım yenilemesi bu planın varsayılan çözümü değildir.
- Başarılı bir aşamadan sonra sonraki aşamada regresyon oluşursa en yakın sorumlu değişikliği ayır; tüm repoyu eski commit'e döndürme.
- Komutlar PowerShell içindir. `$HOME`, `$home`, `$CODEX_HOME` gibi sistem değişkenlerini yeniden tanımlama.

### 3.3 Kapsam dışı alanlar

`/dokumantasyon` ve `src/lib/dokumantasyon/studio/pdf/engine/` ayrı PDF/CAD sistemidir. Belgeler önizlemesini o motorla karıştırma. CAD/DWG/DXF, hesaplama formülleri, site navigasyonunun sırası, kimlik doğrulama, Drive verileri ve genel build altyapısı bu işte yeniden tasarlanmaz.

Paylaşılan dosyaya dokunmak zorunluysa import tüketicilerini `rg` ile çıkar, etkisini yaz ve ilgili diğer modül smoke testini ekle. `globals.css` değişikliklerini `.belge-*` veya mevcut stüdyo scope'u içinde tut. Global `button`, `input`, `body` davranışını Belgeler adına değiştirip diğer sayfaları bozma.

### 3.4 Değişmeyecek ürün sözleşmeleri

- Beş belge rotası ve PDF şablonlarının alan adları korunur.
- PDF form alanları düzenlenebilir kalır; varsayılan `flatten: false` korunur.
- Kullanıcı girdisini sessiz kesme/filtreleme yoktur. Format/uzunluk uyarısı yazmayı ve indirmeyi gereksiz yere engellemez.
- Örnek veriler, şablon alanları ve belge metinleri gelişigüzel değiştirilmez. Yeni hukuki geçerlilik/onay iddiası eklenmez.
- PDF kâğıdı light/dark temada beyaz kalır; tema arayüze uygulanır.
- Mobilde ek bir tema satırı geri gelmez. Genel site header'ı stüdyo içinde geri getirilmez.
- Form/önizleme sekmesi arasında geçiş veri kaybettirmez. Stüdyodan çıkış/yenilemede kalıcılık ayrı üründür; sessizce localStorage taslağı ekleme.
- Üretim sürerken eski PDF indirilmez/yazdırılmaz. Geçerli byte'lar hazırken yalnız önizleme çizim hatası oluşması, indirilebilir PDF'nin de bozuk olduğunu kanıtlamaz; durumları ayır.
- Zoom %50–%400; düğme adımı %25. `%100`, mevcut görüntüleyicide sayfayı alana sığdıran ölçeğe göredir; fiziksel baskı ölçeği değildir.
- Canvas en fazla 8 milyon raster piksel ve kenar başına 4096 piksel sınırını korur.

## 4. Dosya ve veri akışı haritası

### 4.1 Belge envanteri

| Belge | `/belgeler/` altındaki rota | Component | Düzenlenebilir alan | PDF sayfası |
| --- | --- | --- | ---: | ---: |
| Beton Döküm Tutanağı | `beton-dokum-tutanagi` | `src/components/beton-dokum-studio.tsx` | 10 | 1 |
| İnşaat Ruhsatı Dilekçesi | `insaat-ruhsati-dilekcesi` | `src/components/insaat-ruhsati-studio.tsx` | 8 | 1 |
| Şantiye Şefi İstifa Dilekçesi | `santiye-sefi-istifa-dilekcesi` | `src/components/istifa-studio.tsx` | 10 | 1 |
| Şantiye Şefi Sözleşmesi | `santiye-sefi-sozlesmesi` | `src/components/sozlesme-studio.tsx` | 14 | 2 |
| Şantiye Şefi Taahhütnamesi | `santiye-sefi-taahhutnamesi` | `src/components/taahhutname-studio.tsx` | 14 | 1 |

Toplam 56 düzenlenebilir alan vardır. İstifa PDF'inde ayrıca üç PDF-only etiket alanı bulunduğundan PDF alan toplamı 59'dur. Bu sayıları değiştirmek bu planın amacı değildir.

### 4.2 Sorumluluk haritası

| Dosya / alan | Görev |
| --- | --- |
| `src/app/belgeler/page.tsx`, beş alt rota `page.tsx` | Katalog ve stüdyo girişleri, metadata |
| `src/components/belgeler-hub.tsx` | Arama, kartlar, boş sonuç, katalog semantiği |
| `src/lib/documents-data.ts` | Katalog metadata'sı ve alan tanımları; çalışan PDF motorunun yerine geçmez |
| `src/lib/document-field-contracts.ts` | Düzenlenebilir ve PDF-only alanların sözleşmesi |
| `src/lib/belgeler-search.ts` | Türkçe arama normalizasyonu |
| `src/components/belge-studio-page-shell.tsx` | Başlık, geri dönüş ve stüdyo dış kabuğu |
| `src/lib/belge-studio-routes.ts` | Stüdyo rotası tespiti |
| `src/lib/belge-studio-layout.ts`, `src/app/globals.css` içindeki belge kuralları | Scroll, breakpoint, toolbar ve viewport |
| `src/hooks/use-belge-studio-mobile-viewport.ts` | VisualViewport ve ekran klavyesi uyumu |
| Beş `*-studio.tsx` | Form state, örnek/temizle/undo, bağlı alanlar, eylem bağlantıları |
| `src/components/belge-field-length-warnings.tsx` | Engelleyici olmayan uzunluk uyarıları |
| `src/hooks/use-belge-studio-document.ts` | 150 ms debounce, 20 sn üretim timeout, en yeni revision, blob sahipliği |
| `src/lib/pdf-engine.ts` | Şablon/font yükleme, AcroForm doldurma, AP/DV temizleme, isimlendirme/indirme |
| `src/app/api/document-template/[id]/route.ts` | İzinli şablon eşlemesi ve byte yanıtı |
| `public/belgeler/*.pdf`, `public/fonts/` | Kaynak şablonlar ve gömülen fontlar |
| `src/components/belge-studio-pdf-preview.tsx` | PDF.js yükleme, canvas, sayfa, jest, render lifecycle |
| `src/components/belge-studio-preview-toolbar.tsx` | Sayfa/zoom/sığdır/yeni sekme/masaüstü tema |
| `src/components/belge-studio-actions.tsx` | Mobil menü, sekme geçişi, boş form, indir, yazdır, undo |
| `src/components/belge-studio-icons.tsx` | Mevcut özel SVG ikonları |
| `src/lib/belge-studio-zoom.ts` | Zoom sınırı, çıpa geometrisi, raster bütçesi |
| `src/lib/belge-studio-pdf-actions.ts` | Popup açma ve yazdırmayı başlatma |
| `src/lib/pdfjs-client.ts`, `src/lib/pdfjs-paths.ts` | Ortak yerel PDF.js yükleyicisi ve sürümlü yollar |
| `scripts/sync-pdfjs-vendor.mjs`, `public/vendor/pdfjs/` | Üretilen vendor dağıtımı; elle gelişi güzel değiştirilmez |

### 4.3 İncelenecek gerçek çalışma zinciri

`Katalog → stüdyo → form state → debounce → şablon/font byte'ları → pdf-lib ile PDF → revision/snapshot → PDF.js canvas`

Aynı snapshot'ın byte'ları indirmeye, blob URL'si yeni sekme/yazdırmaya gider. Şablon istemcide önce API'den, başarısızlıkta statik PDF yolundan alınır. API'nin `application/octet-stream` kullanması IDM benzeri yakalayıcıları önlemeye yönelik mevcut karardır; “PDF ise MIME mutlaka değişsin” diye düzeltme yapma. İndirilen Blob `application/pdf` olmalıdır.

## 5. Aşamaların sırası

| Aşama | Amaç | Çıktı |
| --- | --- | --- |
| 00 | Çalışma ağacı ve doğrulanmış başlangıç | Başlangıç kaydı ve korunacak diff |
| 01 | Tekrarlanabilir test/kanıt altyapısı | Hedefi açık test komutları, durum kaydı |
| 02 | Katalog ve giriş/çıkış UX | Arama/navigasyon kabulü |
| 03 | Mobil/masaüstü yerleşim | Ölçümlü ekran matrisi |
| 04 | Form alanları, uyarı ve veri bütünlüğü | 56 alan sözleşmesi |
| 05 | Üretim, revision ve geri alma | Son veri = indirilen PDF kanıtı |
| 06 | Ağ/worker/hata/yeniden deneme | Sınırlı bekleme ve veri koruma |
| 07 | PDF görünümü, zoom, sayfa ve jest | Gerçek canvas ve gezinme kabulü |
| 08 | PDF içerik ve baskı kalitesi | 59 alan, altı sayfa ve okuyucu karşılaştırması |
| 09 | İndirme, yeni sekme ve yazdırma | Gerçek dosya ve print akışı |
| 10 | Erişilebilirlik ve iki tema | Axe + klavye + ekran okuyucu kaydı |
| 11 | Performans, bellek ve mahremiyet | Ölçüm ve lifecycle raporu |
| 12 | Tarayıcı ve fiziksel telefon kabulü | Cihaz bazlı PASS/FAIL/BEKLİYOR |
| 13 | Regresyon ve yerel release kapısı | Birleşik doğrulama raporu |
| 14 | Tek yayın ve canlı kabul | Commit/deployment eşleşmesi |
| 15 | Son devir ve yaşayan dokümanlar | Açık konu listesi, kesin durum |

Aşamalar sırayla yürütülür. Aşama 12 için cihaz erişimi yoksa bağımsız yerel kontroller sürdürülebilir; fiziksel cihaz satırı PASS olmaz. Tam kabul ve yayın kararı açık bekleyen maddelerle birlikte değerlendirilir.

## Aşama 00 — Başlangıcı sabitle ve mevcut çalışmayı koru

**Oku:** `PROJECT.md`, `AGENTS.md`, `.agents/rules/belgeler-kurallari.md`, `test-ve-otomasyon-standardi.md`, `vercel-kurallari.md`, `yasayan-dokumantasyon-bakimi.md`, `docs/BELGELER_SISTEMI.md`, bu planın 1–4. bölümleri.

**Adımlar:**

1. Branch, HEAD, remote ve çalışma ağacını kaydet; `.env` içeriğini rapora kopyalama.
2. Bu planla teslim edilen YİBF düzeltmesini ve testini bul. Eksikse otomatik yeniden yazmadan önce diff ve commit geçmişini incele.
3. Kullanıcıya ait farklı değişiklik varsa ayrı listele. `git reset --hard`, `git clean -fd`, toplu restore/stash kullanma.
4. `package.json`, lockfile, `next.config.ts`, `vercel.json`, `.vercelignore`, `tsconfig.next.json` sözleşmesini oku.
5. Test/build'i hangi dizinde çalıştıracağını kesinleştir. Yeni çalışma kopyası kullanılırsa mevcut uncommitted düzeltmenin oraya aktarılması gerektiğini unutma.
6. İlk genel typecheck sonucunu bir kez kaydet; önceki 335 tanı sayısını güncel sonuç sanma. Kapsam dışı borcu ayrı listele.

**Kabul:** Başlangıç hash'i, diff listesi, çalışma dizini ve test hedefi belli; hiçbir kaynak değişiklik kaybolmamış. Remote write yok.

**Dur:** Başka ajan aynı dosyaları değiştiriyorsa çakışmayı çözmeden overwrite yapma.

## Aşama 01 — Testleri doğru hedefe bağla ve kanıt kaydı oluştur

**Oku:** `playwright.site.config.ts`, iki `tests/site-audit/belgeler-*.spec.ts`, dört `tests/belgeler/*.test.ts`, ilgili yerel Next.js kılavuzu. Kılavuz yolu: `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`; sürüm değişmişse `rg --files` ile bul.

**Adımlar:**

1. `docs/BELGELER_UYGULAMA_DURUMU.md` oluştur. Bu dosya önerilen yeni dosyadır; mevcut raporları silme.
2. Her aşama için `BEKLİYOR / DEVAM / PASS / FAIL / CİHAZ BEKLİYOR` sütunu, komut, kanıt yolu ve kısa bulgu ekle.
3. Mevcut testlerin `test.skip` koşullarını oku. Masaüstü işlev testleri yalnız `chromium-desktop-1920`; mobil a11y ayrıca `chromium-mobile-390` ile çalışır. Proje adını değiştirip her şeyin skip olmasını başarı sanma.
4. WebKit alt testindeki sabit localhost hedefini belirle. Canlı koşu için ya gerçek `baseURL`'yi kullanacak şekilde test altyapısını düzelt ya bu testi açıkça yerel pakette bırakıp canlıya ayrı smoke yaz. Hedef URL'yi logla; sessiz hedef değiştirme yok.
5. Kanıtları `test-output/belgeler-final-audit/` altında; Playwright çıktısını `test-results/` altında tut. PDF/PNG/video/log dosyalarını gereksiz Git commit'ine ekleme.
6. Önce mevcut hızlı kontrolleri çalıştır. Testin “başarısız” çıktısı ile exit code çelişirse kalite scripti sorunu olarak kaydet.
7. Standalone browser scripti gerekiyorsa bounded süre, `try/finally`, `browser.close()` ve hata exit code'u zorunlu. Playwright runner'da fixture temizliğini kullan; testin içinde `process.exit()` ile runner'ı öldürme.

**Kabul:** Sıfır test çalışan koşu PASS değildir. Test adı/projesi/hedefi/sonucu izlenebilir. Sonuçlar birbirinin üzerine yazılıp kanıt kaybolmaz.

## Aşama 02 — Katalog ve belgeye giriş/çıkış

**Dosyalar:** `belgeler-hub.tsx`, `documents-data.ts`, `belgeler-search.ts`, belge rota sayfaları ve shell. Değişiklik gerekmezse dosyaları olduğu gibi bırak.

**Adımlar:**

1. 320, 390, 768, 1366 px'te iki temada katalog aç. Beş kartın adı, açıklaması ve CTA'sı anlaşılır mı incele.
2. `şantiye`, `SANTIYE`, `ŞANTİYE`, `insaat`, `ruhsat`, `beton`, baş/son boşluk ve eşleşmeyen metinle ara. Sonuçlar ilgili belgeye gitmeli.
3. Hem input temizleme ikonu hem boş sonuç CTA'sı aramayı temizlemeli ve odağı input'a döndürmeli.
4. Her kartı CTA ve başlık bağlantısından aç. Doğrudan URL ve yenileme aynı belgeyi açmalı.
5. Masaüstü geri bağlantısı, mobil `⋯ → Belgelere dön`, browser geri/ileri çalışmalı. Dönüşte katalog/site scroll'u kilitli kalmamalı.
6. Son kart CTA'sını alt navigasyonun üstüne kadar kaydır. Kesilme/örtüşme olmamalı.
7. Başlık ve açıklama mevcut şablonu anlatmalı; örneğin sistem onay sorunu tutanağını başka bir beton kalite formu gibi vaat etmemeli. Metin uyumsuzluğu bulunursa yalnız ürün açıklamasını düzelt; şablon/metin maddelerini yeniden yazma.
8. Mobilde hangi belgenin düzenlendiği anlaşılır mı incele. Eksikse mevcut form/menü içinde kısa bağlam çöz; PDF alanını daraltan yeni sabit üst bar ekleme.

**Kabul:** Beş doğru rota; bir `main`; katalog başlığı altında mantıklı başlık sırası; arama temizlenir; geri dönüş scroll-lock bırakmaz; görünür CTA'lar kullanılabilir.

## Aşama 03 — Mobil ve masaüstü yerleşimi ölç

**Dosyalar:** shell, actions, toolbar, `belge-studio-layout.ts`, mobile viewport hook, yalnız belge CSS kuralları.

**Adımlar:**

1. Bölüm 6'daki geometri matrisini çalıştır. 1023/1024 sınırında mobil sekmelerin masaüstü çift panele doğru geçmesini kontrol et.
2. Dört tek sayfalı stüdyoda normal metin ölçeğinde mobil toolbar 44 px tek satır olmalı. Kontrolü küçülterek satıra sığdırma.
3. Sözleşme'de dar panelde sayfa/zoom grupları çakışmamalı; iki satır meşrudur. Sayfa kontrollerini gizleyerek testi geçirme.
4. Zoom grubunun yatay merkezi panel merkeziyle en fazla 2 CSS px farklı olmalı. Düğme bounding box'ları kesişmemeli.
5. Masaüstünde dış sayfa yerine form paneli ve büyütülmüş PDF paneli bağımsız kaymalı. Her formun son alanı ve footer eylemleri erişilebilir olmalı.
6. Normal metin ölçeğinde dokunma hedeflerini ölç: toolbar/aksiyon/input en az 44 px. Mevcut mobil tab sınıfı `h-10` kullanıyor; gerçek hitbox'ı ölç. 40 px kalırsa 52 px tablist içinde 44 px'e çıkar; ayrı satır oluşturma.
7. %200 metin ve browser zoom durumlarında toolbar'ın 44 px sabit kalmasını zorunlu tutma. Yazı kesilmeden erişim önceliklidir; normal geometri hedefini bu erişilebilirlik durumuna yanlış uygulama.
8. Dikey/yatay ekran, daralan yükseklik ve safe-area'yı kontrol et. Klavye simülasyonunu fiziksel cihaz testi olarak raporlama.
9. Form↔PDF geçişinde gizli panel odak alıyor mu ve canvas formun üzerine çıkıyor mu kontrol et.

**Kabul:** Normal viewport'ta yatay dış taşma ≤2 px; kontrol çakışması yok; son alan erişilir; tek sayfalı mobilde bağımsız tema satırı yok; %200 metinde eylemler erişilebilir. Önce/sonra aynı viewport ekran görüntüleri kaydedilir.

## Aşama 04 — Form alanları, yumuşak doğrulama ve veri bütünlüğü

**Dosyalar:** Beş stüdyo, alan sözleşmeleri, uzunluk uyarısı, ilgili testler. İlk örnek Sözleşme; sonra kalan dört belgeyi ayrı kontrol et.

**Adımlar:**

1. Envanterdeki 56 alan için label/input bağlantısı, görünürlük, sayaç ve PDF alan adı eşleşmesini doğrula. İstifa'nın üç PDF-only etiketini editable sayaca katma.
2. Türkçe karakter, başta sıfır, boşluk, satır sonu, uzun metin ve kopyala/yapıştırı dene. Sayısal görünümlü kimlikleri `number`'a çevirip baştaki sıfırları kaybetme.
3. B-001 testini tekrar çalıştır. `AB-123/45` korunmalı, format uyarısı görünmeli; `1234567` ve `-` mevcut sözleşmeye göre uyarısız kalmalı.
4. Diğer alanlarda `.replace`, `.slice`, `maxLength`, keydown engeli veya gizli dönüştürme ara. PDF'nin açık tek satır normalizasyonuyla kullanıcı girdisini sessiz kesmeyi ayır.
5. Her alanı değiştir → yerel sıfırla → varsayılan değer ve düğmenin kaybolmasını kontrol et. Diğer alanlar değişmemeli; bağlı imza istisnası Aşama 05'te doğrulanır.
6. Tüm alanları boşalt. PDF şablonunun sabit gövde/başlıkları kalırken kullanıcı değerleri boşalmalı. `Temizle` tamamen boş beyaz PDF sayfası demek değildir.
7. Birden çok uzun alanla uyarı bloğunu aç. Kullanıcının yazması ve son alana erişmesi mümkün olmalı. Uyarı yanlışsa limitin kaynağını incele; testi susturmak için limitleri büyütme.
8. Ruhsat `Örnek Veri` eylemini, tarih/telefon/TC/ücret alanlarını ve yerel sıfırlamayı kontrol et. Türkçe metni otomatik büyük harfe çevirme veya tarih formatını yeni bir standarda zorla dönüştürme.

**Kabul:** 56 alan eşleşir; girişler sessiz kaybolmaz; uyarılar açıklayıcıdır; varsayılan değerler gereksiz uzunluk uyarısı üretmez; tüm temizlenen kullanıcı alanları PDF'de de boşalır.

## Aşama 05 — Üretim state'i, güncellik ve geri alma

**Dosyalar:** `use-belge-studio-document.ts`, stüdyolardaki state/handler'lar, actions ve mevcut işlev testleri.

**Adımlar:**

1. Bir alanı A→B→C olarak hızla değiştir. Sonuçta form, indirilen PDF ve hazır durum C'ye ait olmalı.
2. Değişiklikten hemen sonra indirme/yazdırma devre dışı olmalı; debounce süresinde eski snapshot'ın kullanılmasına izin verme.
3. Gecikmiş önceki üretimi yeni üretimden sonra bitir. Eski yanıt formu/PDF'yi geri almamalı. Bunu test için kontrollü gecikmeyle kur; production'a debug gecikmesi ekleme.
4. Hızlı çift tıklama tek indirme başlatmalı. Başarısız indirmeden sonra buton kilitli kalmamalı.
5. `düzenle → temizle → geri al`, `düzenle → sıfırla → geri al`, `temizle → alan değiştir → eski geri al kapalı` dizilerini beş belgede kontrol et.
6. Yerel sıfırlama ve Ruhsat örnek veri seçimi eski undo kaydını geçersiz kılmalı.
7. Sözleşme yüklenici/şef adı ve Taahhütname unvanı için: imza kaynakla aynıysa güncellenmeli; özel imza varsa korunmalı. Kaynak alanı yerel sıfırlamada da aynı kural geçerli.
8. Sözleşme sayfa 2 açıkken alan düzenle. Güncel PDF sayfa 2'de kalmalı; sayfa sayısı değişirse geçerli aralığa alınmalı.
9. Tema/zoom değişikliğinde snapshot revision/blob değişmemeli. Görüntüleyici yeniden çizimi ile PDF üretimini karıştırma.

**Kabul:** En son girdi kazanır; eski PDF dışa aktarılmaz; undo kapsamı nettir; bağlı alanlar özel metni ezmez; test gerçek indirilen PDF'i okur.

## Aşama 06 — Ağ, font, worker ve hata sonrası toparlanma

**Dosyalar:** PDF motorunun kaynak yükleme bölümü, document hook, PDF preview, PDF.js client; yalnız kanıtlanan hata sınırına müdahale et.

**Her senaryoyu temiz browser context'inde kur:** önbellek başarısız isteği gizlememelidir.

1. API 503, statik PDF sağlam → fallback ile doğru belge hazır.
2. API ve statik PDF 503 → hata görünür, girilmiş form değerleri korunur; ağ düzeldikten sonra `Tekrar dene` doğru PDF üretir.
3. API 200 ama HTML/bozuk byte → geçersiz içerik başarı sayılmaz; güvenli fallback/hata yolu incelenir.
4. Bold veya Regular font isteği başarısız → anlaşılır hata; düzeldikten sonra retry. Türkçe karakteri bozacak sistem font fallback'i ekleme.
5. PDF.js core/worker isteği başarısız veya uzun süre cevapsız → önizleme hata/retry durumuna ulaşmalı. Geçerli PDF byte'ı varsa indirme imkânını koru.
6. Üretim timeout'u ve preview timeout'unu ayrı test et. Mevcut üretim bütçesi 20 sn, kaynak fetch bütçesi 10 sn. Preview için açık bütçe yoksa önce beklemeyi tekrar üret; gerekiyorsa yerel yaklaşık 20 sn bütçe ekle ve gerekçesini yaz.
7. Timeout/rota değişimi sonrası geç gelen sonuç eski component'e state yazmamalı. Timer, render task, loading task ve listener temizlenmeli. `Promise.race` tek başına alttaki işi iptal etmez.
8. Preview hatası + yeni form üretim hatası birlikteyken retry doğru kaynağı yenilemeli. Eski snapshot'ı yeniden çizip üretim hatasını kalıcı bırakmamalı.
9. Kesinti sırasında yazılan özel metin retry sonrasında hem input'ta hem PDF'de aynı olmalı. Mevcut testin yalnız başlangıç değerini koruması bu genişletilmiş kontrolün yerine geçmez.
10. Offline açılış ve hazır oturumda offline geçişi ayrı incele. Offline ürün desteği vaat etme; cache'ten çalışıyorsa hangi kaynakların mevcut olduğunu kaydet.

**Kabul:** Sınırsız spinner yok; hata yanında ulaşılabilir retry var; beklenen test kesintileri dışında console/pageerror yok; retry kullanıcı verisini temizlemez. Hata mesajları kullanıcıya teknik stack trace veya iç dosya yolu göstermemeli.

## Aşama 07 — Önizleme, sayfa, zoom ve dokunmatik davranış

**Dosyalar:** PDF preview, toolbar, zoom helper, ilgili belge CSS; motoru değiştirmek bu aşamanın varsayılanı değildir.

1. Beş belge için ilk açılışta gerçek canvas mürekkebini/çizimini bekle. Sadece canvas elementinin bulunması yeterli değildir.
2. %50, %100, %125, %200, %400; alt/üst sınır düğme durumları; Sığdır sonrası %100 ve kaydırma konumu.
3. Masaüstünde Ctrl/Cmd+wheel yalnız PDF yüzeyini zoom etmeli; normal wheel iç kaydırma yapmalı. Form üzerinde browser davranışını gereksiz engelleme.
4. Preview odaktayken Ctrl/Cmd `+`, `-`, `0` çalışmalı. Input'ta yazı düzenleme kısayollarını yakalama.
5. İki parmak pinch, tek parmak büyütülmüş PDF pan, bir parmağı önce kaldırma, `pointercancel` ve dokunma sonrası toolbar tıklamasını dene.
6. Pinch/wheel çıpası korunmalı; hedef nokta görüntüden sıçramamalı. Pixel toleransını kontrollü test geometrisinde belirle; kaba “zoom sayısı değişti” kontrolüyle yetinme.
7. Sözleşme sayfa 1/2 ileri/geri; ilk/son düğme disabled; ikinci sayfanın canvas içeriği birinciyle aynı olmamalı. Düzenleme/tema/resize sonrası sayfa doğru kalmalı.
8. PDF/form sekmesini en az 20 kez değiştir; sonrasında canvas görünür, form erişilebilir, gizli canvas önde değil.
9. 1023→1024→768 resize, yatay/dikey geçiş ve DPR 1/2/3'te fit yeniden hesaplanmalı; raster bütçesi aşılmamalı.
10. Sekmeyi arka plana alıp geri dön. Ekran boş veya eski içerikte kalırsa lifecycle'ı kanıtla düzelt; Dokümantasyon motorunun yöntemlerini körü körüne kopyalama.

**Kabul:** Başarılı durum gerçek çizimle eşleşir; sayfa/zoom erişilebilir; tema/zoom yeni PDF üretmez; pinch sayfanın genel viewport ölçeğini değiştirmez; hareket sonrası net raster geri gelir.
