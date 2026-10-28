# hsynCAD — çizim akışı, ölçüm ve referans

**28 Ekim devamı:** [Gerçek Ribbon ve güncel kullanım](hsyncad-arayuz.md), [taze REA/Help kanıtı](hsyncad-rea-devam-2026-10-28.md), [bağlantı ve metraj düzeltmeleri](hsyncad-model-devam-2026-10-28.md). Eski Giriş/Görünüm/Proje/Katlar sekme tarifleri tarihsel kalmıştır: yapı elemanları Betonarme, görünüm Görüntü, kat ayarları Kat listesi/Kat Genel Ayarları, örnekler Dosya menüsündedir. Koordinat kutusunda Enter kilitler; ↵ noktayı ekler.

Güncelleme: 27 Ekim 2026. **Hedef kullanım masaüstü tarayıcıdır.** Kullanıcının son tercihiyle mobil için ek geliştirme/test kapsamı açılmaz; daha önce tamamlanan uyumluluk çalışması korunur. Rota: `/kategori/araclar/hsyncad`. Bu belge mevcut çizim davranışını açıklar; önceki 26 Ekim arayüz kayıtları tarihsel karşılaştırmadır.

**Sonraki REA denetimi:** [Gerçek Ribbon hiyerarşisi ve kot/ölçüm düzeltmeleri](hsyncad-rea-denetim.md). Dört RT_RIBBON XML şablonu ayrıca çözüldü; aşağıdaki önceki statik diyalog araştırmasına ek kanıttır. Otomatik döşeme artık yatay kot bandını dikkate alır.

## Kaynağın söylediği ve söylemediği

Önceki gerçek REA incelemesinden saklanan `rea-ui-resource-map.json` ve `calisma-akisi-2026-10-26/tam-bulgular.json` tekrar incelendi. Kaynak kimliği `ev_5756763f7757b0a2a78bc84b5bdb5416294438729a347abee48618669981910b`. Özellikle 127, 132, 137, 170, 174 ve 604 numaralı diyaloglar; aks, kolon, kiriş/perde, döşeme ve yakalama kontrolleri için başvurudur. Tam çözümde 743 diyalog, 5 menü, 8.600 metin bulunur.

Bu JSON'lar statik Windows diyalog şablonlarını ve metinlerini gösterir. Tıklama sırası, olay kodu, hesap formülü, snap önceliği ve Boolean birleşim algoritması bunlardan doğrulanamaz. Bu çalışma yeni bir ideCAD canlı kullanım kaydı değildir. İşlem sıraları aşağıdaki resmî Help sayfalarından araştırıldı; web uygulaması özgün TypeScript ile yazıldı. ideCAD dosyaları değiştirilmedi; ikon, proje formatı veya iç kod kopyalanmadı.

## Resmî ideCAD Help bulguları

| Kaynak | Gözlenen kullanım ilkesi |
| --- | --- |
| [Aks çizimi](https://help.idecad.com.tr/ideCAD/aks-cizimi) | İmleçle önizleme; yatay/düşey için tek, serbest aks için iki nokta. Space çizim yönünü değiştirir. |
| [Aks ofset](https://help.idecad.com.tr/ideCAD/aks-ofset) | Son veya seçili akstan ölçülü paralel türetme. |
| [Aks ayarları](https://help.idecad.com.tr/ideCAD/aks-ayarlari) | Uç deltaları pozitifken uzatma, negatifken kısaltma. İki başlık da kapatılabilir. Tali aks, kalıp/aplikasyon planındaki görünürlük sınıflamasıdır. |
| [Kolon oluşturma](https://help.idecad.com.tr/ideCAD/betonarme-kolon-olusturma) | Önce tutma noktası sabitlenir, sonra kesit canlı düzenlenir ve döndürülür; ikinci tıklamada oluşturulur. 1–4 tutma noktası, Space lokal simetri, Shift dik yönler içindir. |
| [Kolon ayarları](https://help.idecad.com.tr/ideCAD/betonarme-kolon-ayarlari) | Dikdörtgen, daire ve poligon kesitler. Yeni daire için 40 parçalı varsayılan örnek alınmıştır; daire geometrisi çokgen yaklaşımıdır. |
| [Kiriş oluşturma](https://help.idecad.com.tr/ideCAD/betonarme-kiris-olusturma), [perde çizimi](https://help.idecad.com.tr/ideCAD/perde-cizimi) | Başlangıç düğümünden gerçek genişlikli önizleme; hizalama/kaçıklık ve ölçüler çizim sırasında değişir. İkinci düğümden sonraki eleman sürdürülebilir, Esc komuttan çıkar. |
| [Döşeme oluşturma](https://help.idecad.com.tr/ideCAD/doeseme-olusturma), [döşeme kenarı](https://help.idecad.com.tr/ideCAD/doeseme-kenari-cizimi) | Çevrenin kapalı olması gerekir. Alanın üzerine gelince sınır gösterilir, içine tıklanır. Ctrl ile yazı konumu ayrıca seçilir. Yardımcı döşeme kenarı eksik sınırı kapatır. |
| [Koordinat / dinamik giriş](https://help.idecad.com.tr/ideCAD/koordinat-kutusu-ve-dinamik-bilgi-girisi) | X/Y, uzunluk ve açı farklı giriş yöntemleridir. hsynCAD bu yöntemlerin web kontrollerini sunar; bütün native tuş/kilit davranışlarının eşliği iddia edilmez. |
| [Uzaklık](https://help.idecad.com.tr/ideCAD/uzaklik) | İki nokta arasındaki toplam uzaklık, X/Y farkları ve doğrultu açısı hesaplanır. |
| [Alan ve çevre](https://help.idecad.com.tr/ideCAD/alan-ve-cevre) | Köşeleri tanımlanan kapalı poligon için alan ve çevre. hsynCAD'de düz kenarlı poligon kullanılır. |
| [Lokal koordinat sistemi](https://help.idecad.com.tr/ideCAD/lokal-koordinat-sistemi-tanimlama), [paralel referans](https://help.idecad.com.tr/ideCAD/paralel-referans) | Başka orijin ve açı tanımlamak, global sisteme dönmek; bir doğruyu çizim doğrultusuna referans almak. |

Üç noktalı açı ölçümü hsynCAD'in kendi etkileşim tercihidir: kol üzerindeki nokta → tepe noktası → ikinci kol üzerindeki nokta. Native açı aracının olay uygulaması REA JSON'undan çıkarılmamıştır.

## Çalışan kullanım

1. **Aks:** Yatay/düşey seçip tıklayın. Mesafe yazıp Enter ile son veya seçili akstan devam edin. Space ile yatay → düşey → serbest değişir. Serbest aks iki nokta ister. Ölçülü ağda açıklıkları `4;4,5;3` biçiminde girin. Yeni akslar otomatik adlandırılır; aynı doğru ve aynı ad tekrarı reddedilir.
2. **Kolon:** Kesit ve tutma noktasını seçin. İlk tık noktayı sabitler; fareyle döndürün, b/h değiştirin, Space ile simetri alın. İkinci tık, Enter veya **Kolonu onayla** ile modele ekleyin. Önizleme beton/metraj üretmez. Koordinat kutusundaki **Kolonu yerleştir**, gösterilen açıda doğrudan kesin giriş alternatifidir.
3. **Kiriş / perde:** Başlangıç ve bitişi verin. Space merkez/sol/sağ hizalamayı değiştirir; Shift geçici dik çizimdir. Sürekli çizim varsayılan açıktır; her onaylanan segment ayrı, geri alınabilir elemandır. Esc kalan taslağı bırakır. Uzunluk/açı kilidi fare ve sayısal nokta girişlerinde uygulanır.
4. **Döşeme:** Varsayılan **Kapalı alana yerleştir** modunda çevrenin içine gelin; kırmızı sınırı kontrol edip tıklayın. Açık çevre reddedilir. Eksik sınır için **Döşeme kenarı** çizin. Ctrl+tık sonrası yazı yerini ayrıca seçin. **Köşelerle çiz** bağımsız poligon alternatifidir; Enter/ilk köşeye dönüş/tamamlama düğmesi ile kapanır.
5. **Ölçüm:** Üstteki Uzaklık iki nokta ister ve uzaklık/ΔX/ΔY/açı verir. Açı kol–tepe–kol sırasıyla üç nokta ister. Alan köşeleri Enter veya ilk noktaya dönüşle kapanır; m² ve çevre gösterilir. Kayıtlar sağ panelden silinebilir, geri alınabilir, JSON ile saklanır. Alan değeri m², uzunluk değeri seçili m/cm birimindedir.
6. **Referans:** İki noktayla sınırsız yardımcı doğru oluşturun. Uç/orta/kesişim ve doğru üzerine izdüşüm yakalaması çalışır. Çizimler sekmesinde referans doğrusunu seçip **Paralel** veya **Dik** kullanın; kiriş/perde doğrultusu ya da kolon açısı kilitlenir. **Lokal sistem yap** doğrunun ilk noktasını orijin, doğrultusunu X′ yapar. Koordinat kutusunda Lokal X′/Y′ ile girin. **Global sistem** geri döner. Tek noktalı **Orijin** aracı da lokal başlangıç tanımlar.
7. **Düzen:** Masaüstünde başlık → sekmeler → eleman/ölçüm Ribbon'u → bağlamsal seçenekler → ince ikon şeridi bulunur. Plan/perspektif açık zeminlidir. Sağ dikey şerit paneli açar/kapatır; ilk eleman/ölçüm eklenince panel açılır. Koordinat kutusunu başlığından sürükleyebilirsiniz. Görünüm sekmesinde açık/koyu çalışma alanı ve ızgara görünürlüğü vardır. Telefonda ana komutlar üstte, ölçüm ikonları kaydırılabilir şeritte, 2B/3B geçişi ve sağ panel çekmecededir.

## Web için kendi mimarimiz

- `use-drawing-session.ts`: geçici önizleme ve aşamalı oluşturma oturumu. Kesin onaydan önce modele eleman yazılmaz.
- `regions.ts`: elemanların gerçek plan dış sınırları ile döşeme kenarlarından düzlemsel grafik; kesişimlerde parçalama, açık kuyrukları eleme ve kapalı yüz bulma. İçbükey poligonların otomatik yazısı gerçek bir iç noktaya yerleştirilir. En fazla 2.000 giriş kenarı; aşımda kullanıcıya açık hata ve manuel poligon alternatifi gösterilir.
- `relationships.ts`: kolonun aks kesişimine, eleman uçlarının kolon/aks/düz kiriş veya perde düğümüne bağlantısı. Aks değişikliği bağımlılık sırasıyla kolon → kiriş/perde → bağlı döşeme sınırına yayılır. Çevreyi açan düzenleme atomik reddedilir. Sınır kirişi/perdesi/kenarı silinince bağlı döşeme aynı geri alma işlemiyle kaldırılır.
- Bağlantı noktası elle değiştirilirse eski bağı çözülür; çocuk elemanları yeni konumu izler. Bir üst kata kopyalarken kimlikler ve bağlantılar yeniden eşlenir. Eski içe aktarılan bağlantısız çizimlere otomatik, tahmini bağ eklenmez.
- `drafting.ts`, `use-reference-tools.ts`, `reference-tools.tsx`, `drafting-overlay.tsx`: ölçüm ve yardımcı referanslar ayrı `model.drafting` alanındadır. Her kayıt katını ve metre koordinatlarını saklar; lokal dönüşümler yalnız giriş/okuma sistemidir, yapıyı döndürmez. Beton veya kalıp üretmez. Kayıtlar, kat kopyası/silme, geçmiş ve JSON ile birlikte yönetilir.
- Ölçüm sonuçları sabit seçilmiş koordinatlara aittir; sonradan eleman hareketine kendiliğinden bağlanan ölçülendirme değildir. Referansla yapılan yerleştirme o andaki koordinatı saklar; referans çizgisinin değişmesi yapıyı otomatik taşımaz.
- Kot, katı birleşim ve metraj için mevcut `geometry.ts`, `junctions.ts`, `polyhedra.ts` kullanılır. Aynı ayrık katı parçalar hem 3B'ye hem net beton hacmine gider; ortak hacim iki kez sayılmaz. Öncelik kolon → perde → kiriş → döşeme. Kalıp hâlâ açıkça **brüt** gösterilir.

## Ölçülü kontrol ve kapsam

4×4 m merkez çizgili çevrede 0,25 m kiriş ve 0,40×0,40 m köşe kolonlarıyla döşeme iç alanı: `3,75² − 4×0,075² = 14,04 m²`. Ortadan geçen 0,20 m perde iki yüz oluşturur ve toplam alanı `14,04 − 3,75×0,20 = 13,29 m²` yapar. Sadece 4×3 m yardımcı kenar çevresi alanı 12 m²'dir; yardımcı kenarların beton/kalıp miktarı sıfırdır.

Proje → **Çizim akışı örneği**: 4 aks, 4 kolon, 4 kiriş, 1 perde ve 2 bağlı döşeme. Sağ düşey aksı X=4'ten X=5'e taşıma deneyi kolonları, uçları, orta perdeyi ve iki döşemeyi günceller. İki döşemenin toplam yeni alanı 16,84 m²'dir. Eski 4×4 brüt örnekle aynı birleşim toplamı olan 8,0885 m³ beton kontrolü korunur; iki ayrı döşemenin brüt kalıp yaklaşımı farklı olduğundan eski 83,80 m² kalıp sonucu bu yeni örneğe doğrudan taşınmaz.

Otomatik döşeme tanıma artık yatay döşemenin gerçek kot bandında kalan hacimlerin plan izdüşümlerini kullanır; farklı kottaki çerçeveler ayrılır. Eğimli döşeme otomatik modda kabul edilmez, Köşelerle çiz kullanılır. Bu tüm bağlantılar için BIM/statik temas denetimi değildir. Eğik/yaylı elemanlar görüntülenip metrajlanabilir; eğri elemanın parametrik düğümüne otomatik bağlantı yapılmaz. Manuel poligon döşeme otomatik sınır takibi almaz. Yay aks, boşluklu/nervürlü/kaset döşeme, sınır nesnelerini tek tek seçerek kontur yöntemi, pafta/DWG ve analiz/tasarım motoru bu sürümde uygulanmadı. UI'da varmış gibi çalışmayan düğmeler eklenmedi.

## Kalıcı inceleme arşivi

`C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\help-cizim-akisi-2026-10-27`

Bu klasör özgün haritaya bağlantıları, seçilmiş REA diyalog kimliklerini, Help kaynak eşlemesini, yeniden açılabilir örnek modeli, ekran görüntülerini ve doğrulama sonuçlarını saklar. Önceki büyük REA JSON'ları korunmuştur; uygulamanın istemci paketine eklenmez. Güncel test sonuçları: [hsyncad-test.md](hsyncad-test.md).
