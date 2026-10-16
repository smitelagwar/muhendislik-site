# Belgeler modülü kapsamlı denetimi — 16 Ekim 2026

Başlangıç commit'i: `488f1b8`. Kapsam: `/belgeler`, beş belge stüdyosu, şablon API'si ve bunların testleri. Kullanıcının ek geri bildirimi: telefonda tema düğmesinin tek başına satır açıp PDF alanını daraltması.

## Düzeltilen sorunlar

1. **Mobil önizleme alanı:** Tema switch'i yalnız `lg+` masaüstü görünümünde kaldı. Telefon ve tablette tema geçişi mevcut `Diğer belge işlemleri` menüsündedir; hem form hem PDF sekmesinde kullanılabilir. Tek sayfalı mobil belgelerde araç çubuğu 91 px yerine 44 px tek satırdır. Zoom grubu panelin gerçek merkezinde, dokunma hedefleri en az 44×44 px kalır. Çok sayfalı belgelerde dar panelin sayfa geçişleri için gereken iki satır korunur.
2. **Eski geri alma kaydı:** Alan bazlı sıfırlama ve ruhsat örnek veri seçimi artık önceki genel sıfırlama/temizleme kaydını geçersiz kılar. Böylece yeni değişiklikten sonra eski bir form snapshot'ı yanlışlıkla geri getirilemez.
3. **Bağlı imza alanı:** Sözleşmede taraf adı/unvanı ve Taahhütname'de meslek/unvan alanını yerel sıfırlama, normal alan değişikliği akışından geçer. Kaynakla birlikte güncellenen imza da eşleşir; kullanıcının elle özelleştirdiği imza korunur.
4. **Katalog semantiği:** Layout'un ana içerik alanının içindeki ikinci `main` kaldırıldı. Belge kartları h1 altındaki h2 başlıklarıdır; görünüm değişmedi.
5. **Geçersiz şablon adresi:** `toString`, `constructor` ve `__proto__` gibi miras alınan nesne anahtarları şablon olarak kabul edilmiyor; 500 yerine 404 dönüyor. Tanımlı şablonların erişimi korunuyor.
6. **Yanlış stres testi beklentisi:** Sözleşme adresi hem UI hem PDF şablonunda tek satırlıdır. Stres verisindeki satır sonu kaldırıldı; üretim motorunun mevcut tek satır normalizasyonu değiştirilmedi. Diğer belgelerin çok satırlı uzun metin testleri korunuyor.

İlk dört olumsuz kabul testi eski build üzerinde gerçekten başarısız oldu: geri alma enabled kaldı, imza eski değerde kaldı, iki main bulundu ve `toString` 500 döndü. Düzeltmelerden sonra aynı davranışlar geçti.

## Doğrulama sonuçları

| Kontrol | Sonuç |
| --- | --- |
| Production build | PASS; 627 statik sayfa |
| Runtime + ilgili belge testlerinin dar kapsamlı TypeScript kontrolü | PASS |
| Değiştirilen TS/TSX dosyalarında ESLint ve `git diff --check` | PASS |
| `tests/belgeler/viewer-helpers.test.ts` | PASS |
| `tests/belgeler/document-field-contract.test.ts` | PASS |
| `tests/belgeler/pdf-generation-regression.test.ts` | PASS |
| `tests/belgeler/pdf-long-text-stress.test.ts` | PASS |
| Belge işlev + mevcut mobil/masaüstü/WebKit paketi | Tek koşuda 50 PASS, 50 proje bazlı skip, 0 FAIL |
| Ek mobil erişilebilirlik kontrolü | 1 PASS; katalog + beş stüdyonun form/PDF sekmeleri |
| `npm run check:tools` | PASS; domain/statik kapılar ve 30/30 araç browser smoke |

Yeni işlev paketi: `tests/site-audit/belgeler-functional-audit.spec.ts`. Türkçe alan düzenlemesi → indirilen PDF'in gerçek alan değerinin okunması, temizleme/geri alma/yerel sıfırlama, bağlı/özel imza ayrımı, örnek veri, katalog semantiği, geçersiz API kimlikleri, axe ciddi/kritik ihlaller, API kesintisinde yedek PDF ve kesinti sonrası veri kaybetmeden yeniden deneme doğrulanır.

Tema/yerleşim matrisi: 320×720, 360×800, 390×844, 414×896, 844×390, 768×1024, 1920×1080, 1366×768 ve 1024×768. Merkez toleransı en çok 2 px; tek sayfalı mobil araç çubuğu en çok 44 px; kontroller arası çakışma ve yatay taşma kabul edilmez. Mobil tema menüsü, masaüstü switch'i, tema kalıcılığı, zoom/sığdır ve PDF içeriği kontrol edilir.

Beş uzun metin PDF'inin altı sayfası Poppler ile çizdirilip incelendi. pypdf ile 59 canonical AcroForm alanı ve 59 widget'ın alan değerleri, ilişkileri ve dolu appearance stream'leri doğrulandı. Uzun değerler kesilmeden korunur; tek satırlı dar kutularda punto küçülmesi ve arayüzdeki uzunluk uyarısı mevcut davranıştır. Poppler'in kaynak PDF'deki Symbol display font uyarısı üretim kodu hatası değildir; çizim çıktıları ayrıca kontrol edildi.

## Sınırlar ve yayın

- Değişiklikler belge modülündeki kanıtlanmış sorunlarla sınırlıdır. PDF üretim motoru, PDF.js yükleyicisi, Dokümantasyon/CAD, hesaplama formülleri, navigasyon veya build sözleşmesi değiştirilmedi. Yeni bağımlılık yoktur.
- Genel repo TypeScript borcu önceki tema denetim raporunda kayıtlıdır; bu çalışma onu yeşil olarak raporlamaz veya tsconfig kapsamını daraltarak gizlemez.
- Ara remote write ve Preview oluşturulmaz. Yerel doğrulama sonrasında tek release checkpoint'i ve Production deployment kullanılır; canlı adreste aynı kabul senaryoları yeniden çalıştırılır.

### Canlı doğrulama sonucu

`fa22584` Production deployment'ı `READY` oldu ve ana alan adı aynı commit'e geçti. Canlıda 19 işlev/tema/yerleşim testi geçti. Ek mobil erişilebilirlik kontrolü, Next.js geçişinde gizli eski form ile yeni formun birlikte bulunduğu anda kapsamı geniş bir test seçicisine takıldı. Uygulama değişikliği gerekmedi; seçici mevcut test paketindeki gibi görünür stüdyo ile sınırlandırıldı ve mobil erişilebilirlik kontrolü yeniden 1/1 geçti. Toplam 20 canlı senaryo doğrulandı.

Bu son test sağlamlaştırması ve yayın kanıtı `7e305c8` test checkpoint'inde `[skip vercel] [skip ci]` işaretleriyle saklandı. Ancak Vercel bu işaretlere rağmen ek Production build'i başlattı. Gereksiz `dpl_HgFKNFo28A9FGpu4yJ1eB5TfUMu2` deployment'ı hemen iptal edildi ve `CANCELED` doğrulandı; ana alan adı doğrulanmış `fa22584` / `READY` sürümünde kaldı. Runtime ağacı iki commit'te aynıdır. Bu projede main üzerindeki commit mesajı işaretleri deployment koruması sayılmamalıdır; test/rapor değişiklikleri release öncesinde toplanmalı, gerekli uzak ara kayıtlar `deploymentEnabled=false` olan `internal-*` veya `chatgpt-*` branch'inde yapılmalıdır.
