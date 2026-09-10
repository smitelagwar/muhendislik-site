# 04 — Karar çerçevesi: amaçtan teknolojiye

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Adaylar](03_ARASTIRMA_VE_ADAYLAR.md) · [Mimari](05_SISTEM_MIMARISI.md) · [Deneyler](13_IS_PAKETLERI.md)

Bu belgedeki tercihlerin tamamı başlangıç önerisidir. Yeni veriler geldikçe [karar kaydı](sablonlar/KARAR_KAYDI.md) ile değiştirilebilir. Kullanıcının korumak istediği mevcut motor, deney sonuçlarından bağımsız kalır.

## Ana öneri

**Decoder değiştirilebilir; 2D ürün ve sahne katmanı bize ait; cihazın kapasitesine göre tarayıcıda hazırlama veya hazır sahne okuma.** İlk uygulama iki modu aynı gün üretime almak zorunda değil. Önce tek bir sahne sözleşmesiyle bir gerçek paftanın doğruluğu ve uçtan uca yolu gösterilebilir.

Bu yaklaşımın gerekçesi, bütün parser/renderer katmanlarını aynı anda değiştirmenin hangi parçanın iyileştiğini veya bozduğunu ayırmayı zorlaştırması. Ortak sahne, “aynı decoder + yeni renderer” ve “yeni decoder + aynı renderer” deneylerini mümkün kılar. Bu bir tasarım çıkarımıdır; hazır sahne her çizimde daha küçük/hızlı çıkmayabilir.

## Üç ürün yolu ve bir araştırma yolu

| Yol | Tasarım | Güçlü olduğu koşul | Ana bedel / sınır |
|---|---|---|---|
| A — Browser V2 | Byte → worker decoder → sahne → GPU | İlk defa açılan küçük/orta çizim, işlem gizliliği, sunucusuz kullanım | Telefon RAM/CPU sınırı; her yeni cihazda ilk hazırlık |
| B — Hazır sahne | Yetkili server işi → bölümlü scene → browser renderer | Tek çizimin birçok cihazda açılması, ağır paftalar | İlk hazırlık/kuyruk, işletim ve türev saklama maliyeti |
| C — Hazır SDK viewer | Ticari/olgun viewer + sitemizin UI'si | En kısa yoldan yüksek uyumluluk | SDK maliyeti, renderer kontrolü ve vendor bağımlılığı |
| D — Ham DWG Ar-Ge | Binary decoder'ı kendimiz geliştirme | Stratejik format bağımsızlığı gerçekten değerliyse | En büyük format/uyumluluk/bakım belirsizliği |

**Uzun vadeli aday A+B**, kısa vadeli uygulama sırası ise deney sonucuna bağlı. C, başarısızlığı gizleyen son çare değil, ekonomik olarak daha iyi çıkabilecek gerçek bir alternatif. D, istenirse bağımsız decoder olarak A/B'ye sonradan bağlanabilir.

## Hız konusunda kanaat

Yeni sistemin **ağır çizim etkileşimi, tekrar açılış, farklı cihazda hazır projeye erişim ve bellek kontrolünde** anlamlı avantaj yaratabileceğine dair teknik gerekçeler var. Ancak mevcut motor zaten batching, worker ve cache içeriyor. Yalnız teknoloji değiştirmek hız kanıtı değildir.

Soğuk açılış kabaca ağ, decoder, anlamlandırma, geometri hazırlama ve GPU yüklemenin kritik yoludur. Decoder baskınsa yalnız renderer değişimi sınırlı kazanç verir. Sahne üretimi baskınsa iyi bir decoder'ı baştan yazmak yanlış yatırımla sonuçlanabilir. Ağ baskınsa daha hızlı CPU kodu beklemeyi çok az azaltır.

Örneğin toplam işin %70'i dokunulmayan bir katmandaysa, kalan %30'u sonsuz hızlandırmak teorik olarak en fazla yaklaşık `1 / 0,70 = 1,43×` toplam hızlanma verir. Bu örnek Amdahl mantığıdır; repo ölçümü değildir.

B yolunda upload sonrası ön hazırlık kullanıcı tıklamasından önce yapılabilir. Bu ilk tıklamayı hızlandırsa da toplam compute işi ortadan kalkmaz; maliyet ve hazırlık gecikmesi ayrıca raporlanır.

## Karar sırası

1. **Kapsam ve corpus:** Hangi paftalar ve cihazlar gerçekten önemli? R001–R004 + eksik özellik örnekleri.
2. **Uyumluluk:** Decoder çıktısı yazı/ölçü/layout/OCS/XREF bilgilerini yeterince taşıyor mu?
3. **Lisans ve dağıtım:** Seçilen kullanım ve mevcut motorla birlikte dağıtım uygun mu?
4. **Sahne yeterliliği:** Veri modelimiz gerçek çizimi doğru temsil ediyor mu?
5. **Performans:** Aynı doğruluk düzeyinde süre, bellek ve etkileşim iyileşiyor mu?
6. **İşletim:** Hata izolasyonu, sürümleme, cihaz ve maliyet dengesi kabul edilebilir mi?

Elenen adayın bütün sistemini geliştirmek gerekmez. Örneğin gerekli dimension görünüşünü veya XREF bilgisini hiç veremeyen decoder, hızlı olsa da hedef corpus için elenebilir. Güçlü decoder'ın aşırı büyük browser heap'i ise onu tamamen elemek yerine server kullanımına yöneltebilir.

## Ölçüme dayalı puanlama önerisi

Önce kritik engeller elenir: içerik kaybı, yetki açığı, lisans uyumsuzluğu, hedef cihazlarda crash. Kalanlar için örnek ağırlıklar: doğruluk %35, stabilite %20, mobil/bellek %15, açılış %15, işletim maliyeti %10, geliştirme kontrolü %5. Ağırlıklar ürün tercihi olup değiştirilebilir.

Henüz puanlar doldurulmaz. `bilinmiyor` alanına 0 veya 5 verip sahte kesinlik oluşturulmaz. Her puan dosya/cihaz/test kimliğine bağlanır. Toplam puan kritik bir yanlış ölçüyü telafi edemez.

## Başlangıç teknoloji tercihleri

- **TypeScript + TypedArray**, ilk ince prototip için düşük entegrasyon maliyetli seçenek. Sıcak geometri veya parse döngüsü ölçümde baskınsa C++/Rust WASM denenebilir.
- **WebGL2**, ilk renderer adayı. **WebGPU** sonradan aynı render planını kullanan backend olabilir. Güncel MDN WebGPU'yu tüm yaygın tarayıcılarda Baseline saymıyor; cihaz testi ve gerçek adapter açılışı gerekir. [WebGPU belgesi](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API).
- **Worker'da decode/hazırlık + main thread'de küçük GPU gönderimleri**, ilk uyumluluk seçeneği. OffscreenCanvas ikinci deney; kullanılabilirliği ve üretim davranışı ayrıca doğrulanabilir.
- **JSON kontrol bilgisi + binary sahne parçaları**, ilk aktarım biçimi. Dev entity JSON ağacı browser'a gönderilmez; küçük dosyalarda ekstra paketleme maliyeti ölçülür.
- **Hazır sahne cache'i**, kaynak byte cache'inden ayrı. Tarayıcı kalıcı cache'i ve sunucu türev deposu birbirinin yerine geçmez.

## Dur veya yön değiştir işaretleri

İlk gerçek paftada metin/pafta doğruluğu sağlanamıyorsa milyon çizgilik benchmark'ı büyütmek yerine semantik katmana dönülebilir. V2 aynı içerikte daha yavaşsa nedenleri ayrıştırılır; bir dil veya GPU API'sine yapılan yatırım savunulmak zorunda değil. Bütün telefona uygun bütçeler aşılıyorsa B yolu öne alınabilir. Ücretli SDK toplam mühendislik maliyetini ciddi düşürüyorsa C ekonomik olarak daha doğru seçim olabilir.

Bir modülün tamamlandığını dosya sayısı veya kod hacmi değil, [doğrulama programındaki](11_DOGRULAMA_PROGRAMI.md) gözlenebilir sonuç belirler.
