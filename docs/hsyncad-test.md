# hsynCAD — kullanım ve doğrulama

**28 Ekim devamı:** [Gerçek Ribbon ve güncel kullanım](hsyncad-arayuz.md), [taze REA/Help kanıtı](hsyncad-rea-devam-2026-10-28.md), [bağlantı ve metraj düzeltmeleri](hsyncad-model-devam-2026-10-28.md). Eski Giriş/Görünüm/Proje/Katlar sekme tarifleri tarihsel kalmıştır: yapı elemanları Betonarme, görünüm Görüntü, kat ayarları Kat listesi/Kat Genel Ayarları, örnekler Dosya menüsündedir. Koordinat kutusunda Enter kilitler; ↵ noktayı ekler.

Rota: `/kategori/araclar/hsyncad`. Kaynak: `src/components/hsyncad`, `src/lib/hsyncad`.

**Güncel kullanım (27 Ekim):** [Çizim akışı, ölçüm ve referans](hsyncad-cizim-akisi.md). Kolon planda önce sabitlenip sonra onaylanır; döşemede varsayılan kapalı alan tanımadır. m/cm giriş birimi seçilebilir. Aşağıdaki eski test sonuçları tarihsel kayıttır.

**26 Ekim entegrasyonu:** [REA entegrasyonu](hsyncad-rea-entegrasyon.md). Proje → Gelişmiş örneği aç; eleman oluşturma ayarları, Ayrıntılı eleman ayarları, yakalama/katman pencereleri ve CSV metraj raporu burada açıklanır. Aşağıdaki 4×4 elle hesap örneği geçerlidir; yeni eğimli/daire/poligon/yay kontrolleri `src/lib/hsyncad/integration.test.ts` ve `tests/hsyncad/rea-integration.spec.ts` içindedir.

## Kullanım

1. Araçlar bölümünde **hsynCAD** kartını açın. Boş başlayın veya **Ölçülü örnekle başla** düğmesini kullanın.
2. Üst Ribbon’dan Aks/Kolon/Kiriş/Perde/Döşeme seçin; m/cm giriş birimini kontrol edin. Kolonda ilk tık tutma noktasını sabitler, ikinci tık/Enter oluşturur. Koordinat kutusundaki kesin giriş tek onay alternatifidir. Kiriş/perde sürekli iki noktalı segmentlerdir. Döşemede kapalı çevreye tıklayın; eksik çevre için Döşeme kenarı, serbest poligon için Köşelerle çiz kullanın. Yeni kolon/perdeler kat tavanına bağlıdır.
3. Noktaları planda tıklayın. Hassas mutlak konum için yüzen koordinat kutusuna X/Y girip **Nokta ekle** seçin; komut satırına `4 0` da yazılabilir. Ondalık ayırıcı olarak koordinatlarda nokta veya virgül kabul edilir.
4. **Seç** ile 2B/3B'den seçim yapın; Özellikler panelinden kesit, yükseklik, konum, kat veya malzemeyi değiştirip **Değişiklikleri uygula** seçin. **Taşı** için seçili elemanla başlangıç ve hedef koordinatını belirtin. **Sil**, Ctrl+Z/Geri al ve Yinele kullanılabilir.
5. **Katlar** sekmesinden kat ekleyin, kot/yüksekliği düzenleyin. Üstteki kat seçicisi yalnız 2B aktif katı değiştirir. **Görünüm** sekmesindeki katman kutuları hem 2B hem 3B görünürlüğünü kontrol eder; metraj tüm katları içerir.
6. 2B'de tekerlek yakınlaştırır; **Kaydır** ile sürükleyin. Dokunmatikte iki parmakla yakınlaştırma/kaydırma, 3B'de tek parmakla döndürme vardır. **JSON kaydet** yerel dosya indirir; **Model aç** bu dosyayı doğrulayarak yükler. Otomatik tarayıcı kaydı ayrı bir yedek yerine geçmez.

## Elle karşılaştırılan 4 × 4 m örnek

Zemin kotu 0, kat yüksekliği 3 m. Dört köşe kolon 0,40 × 0,40 × 3 m; dört çevre kirişi 4 × 0,25 × 0,50 m; ortada 4 × 0,20 × 3 m perde; 4 × 4 × 0,15 m döşeme. Kiriş/döşeme üstü 3 m. Akslar metraja dahil değildir.

| Eleman | Brüt beton m³ | Net beton m³ | Brüt kalıp m² |
| --- | ---: | ---: | ---: |
| 4 kolon | 4 × 0,40 × 0,40 × 3 = 1,9200 | 1,9200 | 4 × 1,60 × 3 = 19,20 |
| 4 kiriş | 4 × 4 × 0,25 × 0,50 = 2,0000 | 1,7750 | 4 × [(0,25 + 2 × 0,50) × 4 + 2 × 0,25 × 0,50] = 21,00 |
| 1 perde | 4 × 0,20 × 3 = 2,4000 | 2,4000 | 2 × (4 + 0,20) × 3 = 25,20 |
| 1 döşeme | 4 × 4 × 0,15 = 2,4000 | 1,9935 | 16 + 16 × 0,15 = 18,40 |
| **Toplam** | **8,7200** | **8,0885** | **83,80** |

Kiriş–kolon düşümü: `4 × (2 × 0,20 × 0,25 × 0,50) = 0,20 m³`.
Kiriş–perde ek düşümü: `2 × (0,125 × 0,20 × 0,50) = 0,025 m³`.
Döşeme üst katmanında kolon 0,16 m², perde 0,80 m², bu ikisi dışındaki kirişler 1,75 m² alan kaplar; `(0,16+0,80+1,75) × 0,15 = 0,4065 m³` düşülür.
Toplam düşüm `0,20+0,025+0,4065=0,6315 m³`; net `8,72−0,6315=8,0885 m³`. Arayüz üç ondalıkta **8,089 m³** gösterir. Kalıp birleşim temas alanları düşülmediği için **brüt** olarak etiketlidir.

## Tekrarlanabilir kontroller

```powershell
npx tsx --test src/lib/hsyncad/*.test.ts tests/hsyncad/editor-state.test.ts
npx tsc --noEmit --incremental false -p tsconfig.next.json
npx eslint src/components/hsyncad src/lib/hsyncad src/app/kategori/araclar/hsyncad tests/hsyncad playwright.hsyncad.config.ts
npx tsx scripts/check-tools-inventory.ts
npx tsx scripts/check-tools-metadata.ts
npx tsx scripts/check-tools-registry.ts
npm run build
```

Tarayıcı testi için ayrı terminalde `npm run dev -- --port 3127 --hostname 127.0.0.1`, ardından `npx playwright test --config=playwright.hsyncad.config.ts`. `HSYNCAD_TEST_URL` başka yerel porta veya production build önizlemesine yönlendirebilir. Testler Vercel'e bağlanmaz; Playwright context/browser temizliğini yönetir, tek worker ve 300 saniye üst sınır vardır.

Kontrol kapsamı: bütün elemanların yerleştirilmesi; aks kesişimine snap; 2B/gerçek Three.js sahnesinin sayım ve geometri senkronu; özellik güncelleme, taşıma, silme/geri al/yinele; kat kotu; katman gizleme; masaüstü zoom/pan ve 3B orbit; geçersiz poligon/JSON reddi; JSON indir/yükle ve sayfa yenilemede kayıt; 390 px mobil gerçek iki parmak pinch/pan ve dokunarak yerleştirme; açık/koyu tema; Araçlar kartı ve mevcut Donatı Hesabı rotası.

## Son doğrulama — 26 Ekim 2026

| Kontrol | Sonuç |
| --- | --- |
| Model, geometri, snap, metraj, doğrulama, geçmiş | **14/14 test geçti** |
| Next uygulama TypeScript (`tsconfig.next.json`) | **Geçti, 0 hata**; hsynCAD kaynakları kontrol kapsamındadır |
| hsynCAD kaynakları, rotası ve testlerinin ESLint kontrolü | **Geçti, 0 hata / 0 uyarı** |
| Değişen mevcut katalog/registry/denetim dosyalarının ESLint kontrolü | **0 hata**, kullanılmayan mevcut import/parametreler için 6 uyarı |
| Araç envanteri, metadata ve registry | **Üç kontrol geçti, 31 araç** |
| `npm run build`, ayrı `.next-hsyncad-build` dizini | **Geçti**; hsynCAD statik rota olarak derlendi |
| Yerel geliştirme sunucusunda Playwright | **3/3 senaryo geçti (32,0 sn)** |
| Derlenmiş üretim sürümünde Playwright (`127.0.0.1:3128`) | **3/3 senaryo geçti (10,9 sn)** |
| Masaüstü / mobil görsel inceleme | 1440 px masaüstü ve 390 px mobil; açık/koyu tema, taşma ve dokunmatik kullanım kontrol edildi |
| Elle metraj karşılaştırması | **8,0885 m³ net beton / 83,80 m² brüt kalıp**, beklenen değerlerle aynı |

Tarayıcı senaryoları aks → kolon → kiriş → perde → döşeme sırasını, kesişim yakalamayı, ızgara dışındaki dik çizim başlangıcının korunmasını, gerçek 3B geometrinin değişmesini, düzenleme/taşıma/silme/geri alma/yinelemeyi ve mobil iki parmak hareketlerini kapsar. Araçlar kartından giriş ve mevcut **Donatı Alanı Hesabı** sayfası da doğrulandı. Test çıktıları `test-results/hsyncad` altındadır; bu klasör Git'e alınmaz.

**Depo genelindeki mevcut kalite borcu:** Çıplak `npm run lint` başarılı değildir: `.test-data/l11-hardware/...` altındaki eski derleme arşivleri ile mevcut kaynak/test dosyalarında toplam 8.921 hata ve 38.395 uyarı raporladı. Kök `npx tsc --noEmit --incremental false` de örneğin `docs/belgeler-paylasim-v3-uygulama/cleanup-stage14-preview.ts` ve eski `tests/document-studio` dosyalarında hata verir. Bu geniş kontroller hsynCAD'de hata raporlamadı; bağımsız Next uygulama typecheck'i ve üretim derlemesi geçti. Mevcut sayfalara/testlere toplu düzeltme uygulanmadı veya hatalar gizlenmedi. Yerel ayrıntılar `.tmp/hsyncad-full-lint.log` ve `.tmp/hsyncad-global-typecheck.log` içindedir. Dolayısıyla tüm deponun lint/typecheck'inin temiz olduğu iddia edilmez.

Vercel deploy, Git push veya ideCAD kurulum dosyalarında değişiklik yapılmadı.

## Yerelde açma

PowerShell'de:

```powershell
Set-Location 'C:\Users\hsyn\Desktop\muhendis-mimar-portali'
$env:NEXT_DIST_DIR='.next-hsyncad'
npm run dev -- --port 3127 --hostname 127.0.0.1
```

Ardından `http://127.0.0.1:3127/kategori/araclar` içindeki **hsynCAD** kartını açın. Doğrudan adres: `http://127.0.0.1:3127/kategori/araclar/hsyncad`. Bu yerel sürümdür; canlı Vercel sitesi henüz değiştirilmedi.


## Son doğrulama — 27 Ekim 2026

Hedef kullanım kullanıcının son tercihiyle **masaüstü tarayıcı**. Yeni mobil çalışma kapsamı açılmadı; önce tamamlanan kontroller aşağıdaki tarihsel toplamda kalır.

| Kontrol | Sonuç |
| --- | --- |
| Model/geometri/bağlantı/ölçüm/geçmiş | **40/40 geçti** |
| Tam yerel tarayıcı paketi | **30/30 geçti (1,4 dk)** |
| Derlenmiş üretim sürümünde temel akışlar | **13/13 geçti (20,9 sn)** |
| Son derlenmiş sürümde masaüstü ölçüm/lokal referans | **2/2 geçti (3,5 sn)** |
| Son adlandırma/görsel düzeltmesi sonrası ilgili paket | **3/3 geçti** |
| hsynCAD kaynakları/rotası/testleri ESLint | **0 hata / 0 uyarı** |
| Uygulama TypeScript, `tsconfig.next.json` | **0 hata** |
| `npm run build`, `.next-hsyncad-final-build` | **Başarılı, 636 sayfa** |
| Üretim masaüstü görsel kontrolü | **1920×1080; boş model, bağlı model, ölçüm/referans; sayfa hatası yok** |
| Elle kontrol | **5 m, 90°, 12 m² / 14 m; iç döşeme 14,04 / 13,29 m²; net beton 8,0885 m³** |

Çizim sırası, canlı önizleme, Space/Shift kısayolları, aks ofseti, düğüm yayılımı, kapalı alan döşemesi ve açık sınır reddi, Ctrl ile yazı yerleştirme, silme/geri alma, kat kopyasında kimlik eşleme, ölçüm ve lokal/global koordinat dönüşümleri doğrulandı. Önceki sayfa/shell testleri geçti. Sonlu eleman/deprem hesabı veya ideCAD ile tüm komutlarda eşlik iddiası yoktur. Otomatik alan tanıma plan izdüşümüne dayanır; kotlar arası tam temas doğrulayıcısı değildir.

Araştırma, yeniden açılabilir JSON modelleri, ekran görüntüleri, kaynak hash’leri ve loglar: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\help-cizim-akisi-2026-10-27`. Eski REA haritasının SHA-256 değeri aynıdır. Vercel deploy veya Git push yapılmadı.

Son yerel önizleme: `http://127.0.0.1:3142/kategori/araclar/hsyncad`. Çalışan sunucu kapanırsa geliştirme için bu belgede belirtilen **muhendis-mimar-portali** klasöründen başlatın; **hsyncad** klasörü araştırma arşividir ve `package.json` içermez.


## REA Ribbon denetimi sonrası masaüstü kabulü

Araştırma 27 Ekim 2026 tarihinde başladı. [Araştırma, düzeltmeler ve sınırlar](hsyncad-rea-denetim.md). Gerçek REA kanıtı ve dört Ribbon şablonu kalıcı arşive alındı. **46/46 domain testi, 22/22 masaüstü tarayıcı testi (1,1 dk), derlenmiş sürümde 12/12 masaüstü temel akış (17,3 sn) geçti.** hsynCAD kaynak/rota/test ESLint kontrolü 0 hata/uyarı; uygulama TypeScript kontrolü başarılı; üretim derlemesi 636 sayfa ile tamamlandı. Yeni mobil çalışma/test yapılmadı.

Yeni senaryolar: yalnız ölçüm içeren modeli sığdırma, uzak referans ve aktif lokal orijini yapı ile birlikte sığdırma, fit sonrası orantılı zoom, geçersiz X/Y sonrası sağlam taslak, farklı kotta çerçevenin döşemeyi kapatmaması ve eşleşen kotta 14,04 m² tanıma; eğik elemanın band kesiti, yardımcı kenar kotları ve bağlı döşemede kot/topoloji değişiminin atomik reddi. Önceki yerleştirme, JSON, 2B–3B, düzenleme ve metraj kontrolleri korunmuştur.

Kalıcı sonuç: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\denetim-2026-10-27\dogrulama-sonuclari.json`. Çalışan yerel adres aynı kaldı: `http://127.0.0.1:3142/kategori/araclar/hsyncad`. Eski REA haritası ve EXE hash’leri aynı. Git push / Vercel deploy yapılmadı.

Son üretim önizlemesinde ek masaüstü kontrolü: bağlı D1/D2 varken K1 kotunu −1 m yapma reddedildi ve modelde kot 0 kaldı. Özellikler’den iki çevre bağı ayrılıp Uygula sonrasında düzenleme başarılı oldu; 0 sayfa/3B hatası ve 0 taşma. Kanıt `son-kot-akisi-kontrolu.json`, ekran `masaustu-kot-denetimi.png`.

## 28 Ekim 2026 — son masaüstü devam kabulü

Yerel sonuç `http://127.0.0.1:3142/kategori/araclar/hsyncad`. Uygulama kökü `C:\Users\hsyn\Desktop\muhendis-mimar-portali`; `hsyncad` klasörü araştırma arşividir. Yerel sunucu derlenmiş sürümü sunar; Vercel dağıtımı, Git commit veya push yapılmadı.

| Kontrol | Sonuç |
| --- | --- |
| Domain | 51 test başarılı; bağlı çevre/kot, kat kopyası, düğüm bağları, geometri ve tek hacim paylaşımı |
| Masaüstü production | Tek birleşik koşu 30/30 başarılı, 39,8 s; mobil/phone/touch testleri kapsam dışında |
| TypeScript | `npx tsc -p tsconfig.next.json --noEmit --incremental false` başarılı |
| Lint | `npx eslint src/components/hsyncad src/lib/hsyncad next.config.ts` ve değiştirilen testlerde başarılı |
| Production build | `NEXT_DIST_DIR=.next-hsyncad-devam-build npm run build`, 636/636 sayfa başarılı |
| Taze tarayıcı bağlamı | Boş → bağlı örnek → yenileme; pageErrors/consoleErrors boş, taşma yok |
| Diğer site sayfaları | `/`, `/kategori/araclar`, `/kategori/araclar/kiris-kesiti` HTTP200; site-shell testi normal araçların site başlığını koruduğunu doğrular |
| Mevcut model arşivi | 8 JSON modeli yeniden doğrulandı; kaynak dosyalar değiştirilmedi |

Masaüstü komutu (PowerShell):

```powershell
$env:HSYNCAD_TEST_URL='http://127.0.0.1:3142'
npx playwright test --config=playwright.hsyncad.config.ts command-bar.spec.ts coordinate-box.spec.ts desktop-audit.spec.ts help-workflow.spec.ts rea-integration.spec.ts reference-tools.spec.ts site-shell.spec.ts viewport-desktop.spec.ts workbench.spec.ts --grep-invert 'mobile|phone|touch' --output=test-results/hsyncad-production-final
```

Akış kapsamı: aks sistemi/adlandırma/ofset → kolon kesiti/tutma/yön → sürekli kiriş/perde → kapalı alan/döşeme kenarı; yakalama; ölçülü X/Y ve cm/L/A; göreli/kutupsal komut; seçme/taşıma/özellik/silme; undo/redo; kat/kot/katman; bağlı model kopyalama; 2B/gerçek3B;8kamera; JSON aç/kaydet/yenileme; net/brüt metraj. Son küçük erişim düzeltmesi, uygulanmamış komutla mevcut seçim/geçmiş nedeniyle kullanılamayan komutun açıklamasını ayırır; komut araması aynı etkinlik koşuluna uyar. Lokal orijin açıklaması gerçek tek nokta davranışını belirtir; dönük sistem referans doğrusuyla kurulur.

Elle kontrol: 4×4 örnekte brüt8,7200m³, net8,0885m³, ortak hacim düşümü0,6315m³; brüt kalıp83,80m². Net hacim uyarı mevcutken geçerli olabilir; arayüz artık uyarı sayısından brüt/net türü çıkarmıyor. Kalıp yüzeyleri ve sınırlar [model belgesinde](hsyncad-model-devam-2026-10-28.md).

Görsel karşılaştırma, kullanıcının iki yeni ve bir boş ideCAD ekranı açılarak yapıldı. Başlık+sekmeler+Ribbon122px; koordinat kutusu220×114px; kapalı sağ panelle plan/perspektif yaklaşık52/48. Özgün ikonlarla yoğun büyük/küçük/alt komut düzeni ve beyaz çalışma alanı sağlandı. Tam piksel/çalışma-anı eşliği iddia edilmez. Dar masaüstünde son gruplar Ribbon içinde yatay kayabilir.

Kalıcı loglar/görseller: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\devam-2026-10-28`. `desktop-production-tests.log`, `production-build-final.log`, `production-runtime-check.json`, `production-empty-1920.png`, `production-workflow-1920.png`, `production-ribbon-1920.png`, `production-goruntu-ribbon-1920.png`, `production-model-1440.png`. Önceki arşivler/araştırma JSON'ları korunur.

Geliştirme sırasında önceden mevcut `/_next/static` immutable başlığı eski istemci parçasını yeni HTML ile birleştirip hydration hatası üretebildi. Başlık geliştirme ortamında no-store oldu; üretim önbellek politikası değişmedi. Taze production bağlamında hata görülmedi. Build mevcut özel Cache-Control başlığına ilişkin Next uyarısını sürdürür; TypeScript/derleme hatası yok. Proje genelindeki bütün ESLint dosyaları taranmadı; temiz sonucu ilgili kapsam içindir.

Kalan somut sınırlar: net kalıp/imalat sırası hesabı yok; kalıp birleşim temaslarını düşmez. Düşey açıklık teşhisi kayıtlı düğüm bağlarını kapsar; tüm yatay temas/mesnet durumlarının yapısal doğrulaması yok. X/Y kutuları elle girilen değeri tutar; L/A imleci canlı izler. Native aks konturu/etiket taşıma, çelik/birleşim/tasarım/rapor/pafta ailelerinin büyük kısmı pasiftir. Native şablonun çalışma anı seçimi ve bütün handler davranışları gözlenmedi. FE/deprem/TBDY/DWG özellikleri eklenmedi.

Tekrar yerel sunucu açmak için uygulama kökünde:

```powershell
$env:NEXT_DIST_DIR='.next-hsyncad-devam-build'
node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3142
```

## Kullanıcı kapsamı ve uçtan uca denetim — 28 Ekim 2026

Çelik ve Birleşim sekmeleri kaldırıldı; çelik işleri kalıcı olarak kapsam dışı. Ham REA manifesti korunur, ürün10sekme kullanır. [Komut bağlantı envanteri](hsyncad-komut-baglanti-denetimi.md) kaynakta bağlı/kısmi/pasif komutları ayırır. [Boş modelden gerçek kullanıcı denemesi](hsyncad-gercek-kullanici-denetimi.md) iki katlı yapının yalnız arayüzle çizilip düzenlenmesini, metraj ve gerçek JSON/CSV indirmelerini ve yeniden açılmasını belgeler. Başarılı geometrik modelleme akışı bütün komutların veya tam statik proje tesliminin tamamlandığı anlamına gelmez.

Yanlış12572bağlantısı kaldırıldı: Kontur Seçerek Döşeme Oluştur artık elle poligon modunu başlatmaz. Köşelerle çiz gerçek web çizim bandında kullanılabilir. Kat listesi/ızgara/lokal orijin/düğüm yakalama/döşeme kenarı ayarlarının kısmi web karşılıkları yıldız ve açıklama taşır. Diğer pasif komutların durumu değişmedi.

Son kullanıcı denetimi doğrulaması: 31/31 masaüstü testi başarılı (1,9 dakika), ilgili ESLint ve uygulama TypeScript temiz; `.next-hsyncad-user-build` production derlemesi636/636sayfa başarılı. Yerel3142sunucusu bu yeni derlemeyle yeniden açıldı. Loglar `kullanici-denetimi/tests.log` ve `build.log`.

## 28 Ekim 2026 — TBDY 2018 Analiz, Temel, Merdiven, DXF ve Pafta Kabulü

Kullanıcının kişisel mühendislik kullanımı ve ideCAD masaüstü eşliği hedefiyle, ribbon komut bağlantıları 37'den 93 benzersiz komuta yükseltildi ve gerçek hesaplayıcılarla donatıldı:

| Kontrol | Sonuç |
| --- | --- |
| Birim Testler (`src/lib/hsyncad/*.test.ts`) | **65/65 test GEÇTİ (11 test paketi)** |
| Playwright E2E Paketi (`tests/hsyncad/`) | **45/45 test GEÇTİ (13 senaryo dosyası, 2,6 dk)** |
| Yeni Gelişmiş Özellikler Testi (`advanced-features.spec.ts`) | **GEÇTİ (TBDY Analiz modalı, moment/kesme/kapasite modları, tekil temel, merdiven, pafta modu, DXF indirme)** |
| TypeScript Kontrolü (`npx tsc -p tsconfig.next.json --noEmit`) | **0 hata (Temiz)** |
| ESLint Kontrolü (`src/components/hsyncad`, `src/lib/hsyncad`) | **0 hata / 0 uyarı (Temiz)** |
| Mobil & Masaüstü Uyumu | 320 px - 1920 px tüm ekranlar, tekil bölme/3B görünüm, koordinat kutusu |

Tüm 65 unit test ve 45 Playwright senaryosu yeşil olarak tamamlandı.
