# hsynCAD arayüz düzeni

Güncelleme: 28 Ekim 2026. Hedef masaüstü web; rota `/kategori/araclar/hsyncad`. Yerel adres `http://127.0.0.1:3142/kategori/araclar/hsyncad`.

Üst arayüz artık `ribbon-layout.ts` içindeki, REA ile yeniden doğrulanmış 25955 semantik manifestini gerçekten kullanır. 12 sekme sırası: Betonarme, Çelik, Birleşim, Objeler, Değiştir, Araçlar, Ayarlar, Görüntü, Analiz ve Tasarım, Analiz ve Tasarım Görüntüleme, Raporlar, Çizimler. HIDDEN sekme görünmez. Başlangıçtaki beş ana düğmeli `command-bar.tsx` bu devamda değiştirildi.

21 px başlık/hızlı erişim + 25 px sekmeler + 76 px gerçek gruplu Ribbon = 122 px. Altında gerekirse etkin çizim seçenekleri ve 27 px tek ikon/kat/birim şeridi vardır. Büyük düğmelerin yanında üç sıraya dizilen küçük düğmeler ve ayrı açılır oklar bulunur. Açılır menüler gerçek ebeveyn/çocuk ilişkisini izler; örneğin Daire/Poligon Kolon, Kolon'un alt menüsü yerine küçük kardeş komutlardır. 1920 px'de Betonarme grupları sığar; dar masaüstünde Ribbon kendi içinde yatay kayar. Ürün arayüzü özgün SVG ikonlar kullanır; native ikonlar/kod alınmaz.

`Dosya` menüsünde Yeni, Model aç, JSON kaydet ve üç örnek bulunur. Kolon/Kiriş/Perde/Döşeme ayarları kendi düğmelerinin alt okundadır. Aks Ayarları aks çizim seçeneklerini açar; native Kontur Hesapla/Etiketi Taşı gibi henüz karşılığı olmayan alt komutlar açıkça pasiftir. Gri komutlar `Uygulanmadı` açıklaması taşır. Sekmelerin görünmesi hesap motorlarının varlığı anlamına gelmez.

Görüntü sekmesindeki sekiz kamera yönü gerçek Three kamerasına bağlıdır; sürükleyerek döndürme, tekerlek zoom, pan ve sığdırma korunur. Solda 27 px çizim araçları, sağda panel erişim şeridi vardır. Plan ve perspektif varsayılan yaklaşık %52/%48 paylaşılır. İlk yapı elemanı paneli kendiliğinden açmaz; kullanıcı sağ şeritten Metraj/Özellikler'i açar veya eleman seçer. İlk ölçüm kaydı kendi sonuç panelini açar. Yeniden açılan eski model kayıtları korunur.

Koordinat kutusu 220 × 114 px civarında, sürüklenebilir X/Y/Z/L/A biçimindedir. Enter geçerli değeri kilitler, tekrarlanan Enter kilidi çözmez veya eleman eklemez; küçük ↵ düğmesi sayısal noktayı yerleştirir. X/Y ile L/A tam kilit çiftleri birbirini dışlar. L/A global X'e göre; Z kat tavanı referansıdır ve eleman kot ayarlarının yerine geçmez. Mutlak/göreli/kutupsal/lokal giriş ve m/cm dönüşümü vardır. Birim değişimi koordinat ve uzunluk kilitlerinin fiziksel ölçüsünü korur. X/Y alanları elle girilen değerleri tutar; L/A imleci canlı izler. Native'deki her tuş/otomatik odak davranışının eşliği iddia edilmez.

Güncel [model düzeltmeleri ve metraj sınırları](hsyncad-model-devam-2026-10-28.md), [REA ve Help kaynak ayrımı](hsyncad-rea-devam-2026-10-28.md), [test kayıtları](hsyncad-test.md). Görsel kayıtlar `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\devam-2026-10-28` altında korunur. Mobil için yeni tasarım veya kabul çalışması yapılmadı; eski mobil testler tarihsel uyumluluk kaydıdır ve bu masaüstü tesliminin kabul ölçütü değildir.

## Kalıcı kullanıcı tercihi — 28 Ekim 2026

Kullanıcı çelik yapılarla ve çelik birleşim işleriyle ilgilenmiyor. Çelik modelleme, çelik tasarım, çelik birleşim ve çelik detay/metraj geliştirmeleri hsynCAD ürün kapsamı dışındadır. Açık yeni talep olmadıkça bunlara zaman ayrılmayacak ve üstte Çelik/Birleşim sekmeleri yeniden eklenmeyecektir. Görünür ürün 10 sekmedir; diğer sekmelerde açıkça Çelik/STEEL olarak etiketlenen komutlar da süzülür. Arama ve klavye sekme geçişi aynı ürün kapsamını kullanır. REA'nın 12 sekmeli ham kaynak manifesti araştırma kanıtı olarak değiştirilmeden korunur; ürün görünümü `product-ribbon.ts` ile ayrılır.
