# 26 — Plan denetimi ve EXEC-2 karar revizyonu

[Dizin](README.md) · [Geçerli kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Kaynak araştırması](27_KAYNAK_KOD_VE_YENIDEN_KULLANIM.md) · [Uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md)

**06.09.2026 · Astra'nın plan denetimi. Motor denetimi değildir.** Kullanıcının temel özellikler için mevcut GitHub çalışmalarından yararlanma ve Gemini'ye seçim bırakmama talimatıyla EXEC-1 incelendi. Aşağıdaki düzeltmeler EXEC-2'de bağlayıcıdır. Gemini eski kararla yeni kararı karşılaştırıp seçim yapmaz.

Önceki 45 Markdown'ın içerikleri, byte uzunlukları ve SHA-256 kimlikleri [EXEC-1 arşivinde](arastirma/exec1-tam-belge-arsivi.json) saklandı. Arşiv tarihsel kanıttır, yürütülecek talimat değildir. Aktif 00/18/19 ve bunların teknik ekleri uygulanır.

## Bulgular ve kapatılan plan boşlukları

| ID / önem | Önceki eksik veya risk | EXEC-2 kararı / doğrulama |
|---|---|---|
| PA01 / yüksek | Ham WebGL2 altyapısını da yeniden yazmak shader/GPU state/cleanup yükünü büyütüyordu | Three.js 0.172.0 düşük seviyeli grafik altyapısı; kendi CAD compiler, render planı ve materyalleri. [29](29_RENDER_VE_YASAM_DONGUSU.md), R22 |
| PA02 / yüksek | Pan/zoom davranışı vardı ama hangi hazır kontrolün kullanılacağı belli değildi | d3-zoom 3.0.0 tek giriş sahibi; sabit 2D adapter. MapControls/OrbitControls kullanılmayacak. [28](28_PAN_ZOOM_FIT_SOZLESMESI.md), R23 |
| PA03 / yüksek | Temel etkileşim gerçek motorun geç aşamasında denetleniyordu | G04 içinde G04-B temel etkileşim kapısı; decoder'dan bağımsız. Bu kapı geçmeden G05 gerçek frame işi tamamlanamaz |
| PA04 / yüksek | Kaynak/font/image kimliği vardı, tarayıcıya kaynak byte teslimi yoktu | Kaynak parçaları aynı yetkili chunk endpoint'inden; metadata sayfaları ve payload sınıfları. [31](31_SOZLESME_TAMAMLAMALARI.md), R14/R17/R19 |
| PA05 / yüksek | Viewport/layer/style/diagnostic kimliklerinin tanımları belirsizdi | Tipli metadata sayfaları, viewport dönüşümü ve referans bütünlüğü. 31; G03/G09/G10 |
| PA06 / yüksek | DELETE gelmeyen kapanmış sekme ortak işi sonsuza kadar canlı tutabilirdi | Görüntüleme lease heartbeat/TTL, son izleyici yarışının transaction ile çözümü. 31; G11/G14 |
| PA07 / yüksek | Kamera değişimiyle yeni chunk gerektiğinde “pan fetch yapmaz” ifadesi aşırı kesindi | Kamera asla source parse/job başlatmaz; mevcut türevden gerekli görünür chunk fetch/refinement yapabilir. 28/29; R21/R23 |
| PA08 / yüksek | Bir kerelik server tessellation her zoom seviyesinde doğru kabul edilebilirdi | Analitik curve payload + bounded worker refinement; kaynak CAD decode yok. Desteklenen zoom aralığında 0,25 CSS px hata bütçesi. 29; R07/R45 |
| PA09 / orta | “En az %20 hızlı” eşiği ölçülmüş fizibiliteye dayanmıyordu | %20 mühendislik hedefi; karşılaştırma şartları ve hedef sonucu zorunlu, keyfî başarı garantisi değil. Hedef tutmazsa açık GAP; Gemini hedefi/ölçümü değiştiremez. G15 ve R46 |
| PA10 / orta | Coarse pointer doğrudan RAM sınıfı sayılıyordu | Bütün cihazlarda aynı muhafazakâr CPU/GPU başlangıç bütçesi. Pointer türü yalnız giriş/hedef boyutu içindir. Ölçüme dayalı artış Astra CR gerektirir |
| PA11 / orta | Görünür yakınlaştır/uzaklaştır ve ayarların tam listesi eksikti | Masaüstü ± araçları, mobil Görünüm içindeki ±, keyboard/fit ve ayar matrisi. 21/28/30 |
| PA12 / yüksek | Chunk sırası ile kaynak çizim sırası farklılaşabilirdi | Global painter order, clip/mask bariyerleri; materyale göre keyfî yeniden sıralama yok. 29; R11 |
| PA13 / yüksek | Belge çokluğu yapılmamış işin gözden kaçmasına yol açabilirdi | N01–N24, V01–V18, C01–C12 ve F01–F24 alt kabul kimlikleri; boş [alt kabul kaydı](uygulama/ALT_KABUL_DURUMLARI.md). R01–R48 ana paydası korunur |

## Kararın gerekçesi

“Sıfırdan motor”, olgun genel amaçlı grafik/gesture kütüphanelerini yeniden yazmak anlamına gelmeyecek. V2'nin kendi kaynak adapter'ı, canonical geometri modeli, compiler'ı, sahne aktarımı, doğruluk sözleşmeleri, cache/iş yönetimi ve arayüzü olacak. Three.js CAD okuyucusu olmayacak; D3 DOM'a her CAD entity'sini çizdirmeyecek. Mevcut MLightCAD/dxf-viewer viewer'ını gizleyip V2 adıyla sunmak hâlâ yasak.

MapControls r172'nin varsayılan sağ tuş/iki parmak davranışları 3D rotasyona açıktır. dxf-viewer'ın kendi kontrol fork'unda bulunan mouseZoomSpeedFactor, upstream Three OrbitControls API'si değildir. Bu iki kaynak inceleme bulgusu, hazır kodu ayarsız kopyalamanın neden riskli olduğunu gösterir; kaynak projelerin bütünüyle bozuk olduğu iddiası değildir. D3'ün varsayılan filtresi de orta tuşu kabul etmez; 28'de açık override vardır.

## Açık kalan gerçeklik sınırları

- Seçilmiş DWG/DXF okuyucularının Node uyumu, gerçek çizim kapsamı ve hata bildirimleri G02'de çalıştırılarak doğrulanacak. README/API incelemesi bunun yerine geçmez.
- DWG'nin yeni/özel nesneleri, eksik SHX/font/XREF ve underlay eksikleri salt UI kalitesiyle çözülmez. Görünür degraded/unsupported ve gerçek oracle zorunlu.
- D3 + Three entegrasyonu bu turda çalıştırılmadı. Seçim kaynak incelemesine dayanır; cihaz kabulüne değil. N/V/C/F kapıları bu nedenle vardır.
- Production compiler host'u, gerçek cihazlar ve lisans/referans dosyaları için mevcut açık bağımlılıklar sürüyor. Bilinmeyen şeyleri Gemini doldurup “tamam” yazamaz.

“Bütün özellikler” bu 2D ürün için [30'daki kapsam](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) anlamındadır. Sonsuz CAD uyumluluğu veya bütün cihazlarda kusursuzluk vaat edilmez. Uygulayıcının görevi kabul matrisini somut kanıtla doldurmak; bağımsız kabul Astra'nın sonraki işidir.
