# 08 — Bilgisayar, tablet ve telefonda kullanım

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Performans](07_PERFORMANS_VE_BELLEK.md) · [Entegrasyon](09_SITE_ENTEGRASYONU.md)

“Her bilgisayarda ve telefonda” hedefi, desteklenen güncel browser/cihaz matrisi ve cihaz sınırında anlaşılır davranış olarak ürünleştirilebilir. İşletim sistemi yılına veya user-agent adına bakıp GPU/RAM yeterli varsaymak yerine capability kontrolü ve gerçek cihaz deneyi önerilir.

## Capability kademeleri

| Kademe | Durum | Önerilen davranış |
|---|---|---|
| A | WebGL2 + Worker + yeterli bütçe | Browser decode veya hazır scene, tam desteklenen etkileşim |
| B | WebGL2 var, parse bütçesi zayıf | Hazır scene/parça ağırlıklı yol, sınırlı resident bellek |
| C | GPU context açılamıyor veya kararsız | Hazırlanmış raster/pafta önizlemesi varsa göster; katman/ölçüm yeteneklerini kapat ve sınırı belirt |
| D | Dosya/browser yolu desteklenmiyor | Açık hata, mevcut motor seçeneği ve orijinal dosya indirme |

Raster önizleme detay yakınlaştırma, gerçek layer veya hassas ölçüm bakımından vektör V2'nin eşdeğeri değildir. C/D de “bütün cihazlarda tam destek” başarısı olarak sayılmaz. Canvas2D'nin başlı başına eksiksiz üçüncü CAD motoruna dönüşmesi ilk sürümün hedefi olmayabilir.

WebGPU ileri optimizasyon adayıdır; `navigator.gpu` varlığı yeterli değil, adapter/device isteği başarısız olabilir. WebGL2'de de gerçek context creation, temel shader, texture limitleri ve context-loss davranışı denenir. [WebGPU erişim modeli](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API).

OffscreenCanvas ile worker rendering mümkün; desteklenen context ve transfer davranışı hedef browser sürümünde ayrıca test edilir. İlk uyumlu yolun worker hazırlığı + main-thread render olması makul adaydır. [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas).

SharedArrayBuffer/threads ilk günden gereklilik yapılmayabilir. COOP/COEP/crossOriginIsolated şartları font, blob kaynağı, embed ve dış viewer entegrasyonlarını etkileyebilir. Yalnız V2 hızlansın diye sitenin bütün header davranışı değiştirilmez; transferable buffer yolu korunabilir. [Cross-origin isolation](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated).

## Gerçek cihaz matrisi önerisi

| Grup | Minimum örneklem | Önemli test |
|---|---|---|
| Windows dizüstü | Entegre GPU, 8 GB RAM sınıfı; Chrome ve Edge | R003/R004 cold load, multi-open, zoom |
| macOS | Safari + Chromium; en az bir gerçek Mac | Text/GPU, gesture, font lifetime |
| iPhone | Desteklenen eski/orta model + yakın dönem model | Safari, tab suspend/resume, memory pressure |
| iPad | En az bir gerçek tablet | Portre/yatay, split view, pencil/touch ayrımı |
| Android telefon | 4–6 GB sınıfı + güçlü cihaz | Chrome, termal yavaşlama ve büyük pafta |
| Firefox | Masaüstünde destek hedefleniyorsa | WebGL/worker/font davranışı |

Cihaz sahibi bilgisi henüz yok; modeller seçilince OS/browser tam sürümü, RAM/GPU biliniyorsa değerleri, pil/termal koşul ve network kaydedilir. Desktop'ta Pixel/iPhone viewport emülasyonu gerçek telefon performansı değildir. Playwright WebKit de fiziksel iPhone Safari bellek davranışını kanıtlamaz.

## Etkileşim önerisi

Masaüstünde wheel zoom imleçteki world noktayı sabit tutabilir; trackpad hassas hareketlerde delta normalizasyonu ve line/page delta modları göz önünde bulundurulur. Pan için orta tuş ve seçilebilir “Kaydır” modu düşünülebilir. Yeni motor kendi okunabilir davranışını tasarlayabilir; mevcut motorun mouse binding'i değiştirilmez.

Telefonda tek parmak pan, iki parmak pinch; pinch merkezi aynı world noktaya bağlıdır. Tool aktifse kısa tap ile drag ayrımı hareket eşiğiyle yapılır. Pointer capture, `pointercancel`, ikinci parmağın gelişi ve browser gesture iptali state machine'de tanımlanır. Canvas üzerindeki `touch-action` yalnız çizim alanına uygulanır; menü ve katman listesi kaydırması çalışmaya devam eder.

Double tap fit/zoom seçimi tutarlı olabilir; uygulama erişilebilir browser zoom'unu site genelinde engellemez. Ölçüm sonraki fazda eklenirse parmak altında kalan noktayı gösteren büyüteç ve seçili snap tipi görünür olur. Touch pan yanlışlıkla ölçüm noktası eklemez.

## Responsive yüzey

Tam viewport alanı mevcut Studio üst barı, safe-area inset ve mobil browser adres çubuğu değişimiyle uyumlu olur. `ResizeObserver`/viewport değişimi kamera ve çizim boyutunu günceller; portre-yatay geçişi dosyayı yeniden parse etmez.

Kontroller en az repo standardındaki 44×44 CSS px dokunma alanına yakın tutulabilir. Telefon: kısa üst bar + alttan katman/pafta paneli; tablet: dar yan panel veya sheet; masaüstü: daha görünür araç grupları. Panel açılması çizim alanını sıfırlamaz, katman binlerceyse DOM sanallaştırılır.

Görünüş mevcut Dark Industrial, light/dark tema tokenları ve Türkçe UI ile bütünleşir. Motor/decoder/heap gibi teknik alanlar kullanıcının ana akışına yerleştirilmez. “Pafta hazırlanıyor”, “Bazı yazı tipleri eksik”, “Mevcut görüntüleyiciyle aç” gibi kararını etkileyen ifadeler gösterilir.

## Kesinti ve toparlanma

- Sekme background'a alındığında pahalı refinement/RAF yavaşlatılır; foreground'a dönünce viewport ve context kontrol edilir.
- WebGL context kaybında sonsuz retry yapılmaz. CPU/cache'deki scene kullanılarak kontrollü rebuild denenir; tekrarlarsa destekli düşük kademe veya hata önerilir.
- Telefonda OS sekmeyi tamamen sonlandırırsa JavaScript cleanup çalışmayabilir. Kalıcı iş ve cache doğruluğu `beforeunload` callback'ine dayanmaz.
- Ağ kesilince indirilmiş parçalar görüntülenebilir; henüz gelmemiş bölgeler eksik diye işaretlenir. Yenileme aynı source revision'a bağlanır.
- Cache eviction/private mode durumunda dosya yeniden açılabilir; “önbelleğe alındı, her zaman çevrimdışı açılır” sözü verilmez.

## Erişilebilirlik ve düşük hareket

Canvas dışındaki araçlar klavye, odak ve ekran okuyucu etiketi taşır. Motor seçimi, loading/progress, hata ve missing-content özeti erişilebilir metindir. Katman ve pafta seçimi yalnız ikon/rengin anlamına bağlı değildir. Reduced motion tercihi loading animasyonlarını azaltabilir. Çizim canvas'ının görsel içeriğinin tamamının ekran okuyucuyla okunabildiği iddiası ayrıca bir erişilebilirlik projesi olmadan yapılmaz.
