# Aşama 02 — Sonuç ve rapor dürüstlüğü

5 Kasım 2026. Bu aşama sabit/uydurulmuş çıktı yollarını kapatır. Yeni bağımsız hesap motorunun veya kurum raporunun kabulü değildir. Son komut, kaynak hashleri, test ve kapanış sonucu [TASKS.json](TASKS.json) içindedir.

## Ürün davranışı

- `quantities.ts` içindeki proje adı/kat adlarıyla seçilen sertifikalı referans dalı kaldırıldı. Beton mevcut net geometri motorundan gelir; başarısız net hesap brüt değerle doldurulmaz. Kalıp hâlâ **brüt geometri** olarak adlandırılır; temas yüzeyleri düşülmüş gerçek kalıp metrajı değildir.
- Donatı alanı, varsayılan çap/adet/uzunluk, kg/m² veya eleman adıyla tonaj üretilmez. Yalnız açık `rebarMass` beyanı gösterilir. Eksik/negatif/sonlu olmayan değer `null`; açık sıfır `0` kalır. Bir eleman eksikse genel beyan toplamı bilinmiyor, bilinen ara toplam ve eksik kimlikler ayrıdır. İnce/kalın/çap dağılımı ve kesim listesi bilinmiyor.
- `ComprehensiveTakeoffResult.integrityVersion=2`; miktar tüketicileri `number | null` kabul eder. `cutListVerified=false`, `status=partial|empty`. Beyan kütlesi gerçek yerleşimden hesaplanmış donatı değildir; eski önbellek miktarı PDF üretiminde yeniden hesaplanır.
- `getReportReadiness` her çağrıda güncel kapsam kapısını uygular. Eski `overallPass=true` nihai uygunluk vermez. Eksik elemanlar gösterilir; eleman/birleşim/zımbalama/güçlü kolon/öteleme/zemin veya özet başarısızlığı korunur. `calculationComplete=false`, mühendis incelemesi yapılmadı; başarısızlık varsa `fail`, aksi durumda eksik veri veya doğrulama gerekli durumu vardır.
- Eski FEM'in X doğrultusunda indirgenmiş çözümünden belirlenmeyen Y/dönme modal katılım sabitleri kaldırıldı; iki alanın tipi artık `number | null`, üretilen değer `null`. 3B modal yöntem kabul edilmedi. Eski kayıtta sayısal yer tutucular olsa bile PDF katılım sayıları basmaz. Ham ön periyot/mod kimlikleri açık doğrulama notuyla korunur.
- Eski örnek eleman/sayı, sabit kişi/zemin/sistem sınıfı ve imza/onay bölümleri kaldırıldı. PDF mevcut girdileri, tüm fiziksel elemanları, eksik veriyi ve başarısız kontrolleri **taslak** olarak gösterir. Pozitif ön kontrol nihai UYGUN olarak sunulmaz. Birleşim için eksik alt kontrol olumlu varsayılmaz.
- Yeni PDF tablosu satır yüksekliğini ölçer, taşan hücre/satırı sonraki sayfaya geçirir, başlığı tekrarlar. İlk 9/10 eleman/mod kısıtlaması yoktur. Kapak aynı statik taslak dosyadadır; nihai içindekiler ve veri güdümlü bölüm planlayıcı P16 işidir.
- Metraj ve analiz UI'sı taslak/eksik kapsamı gösterir, PDF hatasını kullanıcıya iletir. Beyaz/koyu/mobil kontrolü tarayıcı kanıtında bulunur. İlk tarayıcı denemelerinde `Görüntü` sekmesinin içeride `Görünüm` durumuna çevrildiği gözden kaçırıldı; hatalı ara değişiklik geri alındı, mevcut tema bağı korundu.
- `verify-metraj-idecad.mjs` artık açık kaynak dosyası ister; native dosyayı gerçek import adaptörüyle açar, kaynak hashini korur, mevcut gözlemi raporlar. Gerekli fiziksel model/kesim listesi kabulü eksikken **exit 2/incomplete** döner. `--expected` dosyasını okumak eşdeğerlik kabulü değildir. Yardımcı metraj/engine scriptleri yeni API ve bilinmeyen miktarlarla uyumlandı; sabit SON çıktıları/özgün kaynaklara yazma kaldırıldı.

## Test kapsamı değişikliği

Üretim sabitini, tahmini donatıyı veya sahte 19 bölümün varlığını bekleyen eski test kabulleri emekliye ayrıldı. Dört eski test dosyasının tamamı, değişiklik öncesi SHA-256 ve içerikleriyle `asama-02/before/tests/e2e-rc/` altında korunur. M5 suite de yeniden yazıldı. Bu değişim önceki test sayısının veya eski geniş iddiaların aynı kapsamda karşılandığı anlamına gelmez.

Yeni bağımsız geometri örnekleri 4×4 döşeme, kalınlık değişimi, aynı proje/eleman adı, üst üste katı hacimler ve aynı adlı katları sınar. Donatı bilinmezliği, açık sıfır, son elemandaki eksiklik, başarısız net hesap ve eski önbellek negatifleri vardır. Renderer testleri tüm 100 elemanı, son başarısız kimliği, 15 modu, uzun künye ve Türkçe karakterleri yeniden açılan PDF metninden denetler. Bunlar solver oracle'ı değildir; sentetik ön kayıtlar yalnız çizici girdisidir. Sekiz mevcut diyagram geometrisi testi korunmuştur.

25 kat, 1000 sayfa, gerçek donatı yerleşimi, kabuk/temas/merdiven doğruluğu veya üç gerçek projeyle nihai referans eşdeğerliği bu aşamada doğrulanmadı. P01 normatif/native açık kapıları devam eder. REA'nın somut repo/MCP kanıtı P01'dedir; P02'de yeni native doğrulama yapılmadı. Ayrıntılı sonuçlar [TEST_MATRIX.md](TEST_MATRIX.md), kalan engeller [BLOCKERS.md](BLOCKERS.md).
