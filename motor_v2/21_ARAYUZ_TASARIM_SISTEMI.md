# 21 — DWG Motor V2 arayüz tasarım sistemi

[Dizin](README.md) · [Bağlayıcı kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Ekran/kabul matrisi](22_ARAYUZ_SENARYOLARI_VE_KABUL.md)

**EXEC-2 tasarım kararıdır. Gemini görsel yön seçmeyecek.** Hedef, çizimin kendisini öne çıkaran, modern ve pahalı bir profesyonel yazılım hissi veren sakin bir çalışma alanıdır. Bu hedef az kontrol, iyi hizalama, okunabilir yazı, tutarlı yüzeyler, kaliteli çizim ve eksiksiz etkileşimle karşılanacak. Neon, yoğun cam efekti, altın gradyan veya büyük “premium” yazıları eklenmeyecek.

## Görsel kimlik ve mevcut siteye bağ

Mevcut [globals.css](../src/app/globals.css) içindeki gerçek site tokenları temel alınacak. PROJECT.md'deki Dark Industrial kimliği açık/koyu tema ile birlikte korunacak. V2 için ayrı bir marka/landing page/navbar kurulmayacak. Mevcut Document Studio yerleşimiyle aynı sayfada bir V2 çalışma yüzeyi oluşacak.

| Rol | Koyu tema mevcut değer | Açık tema mevcut değer | Kullanım |
|---|---|---|---|
| site-bg | #0a0a0a | #f4f2ec | Çalışma alanının dış kabuğu |
| site-surface | #111111 | #ffffff | Üst bar, yan panel, menü |
| site-surface-raised | #1a1a1a | #ebe8e0 | Hover/sekonder yüzey |
| site-fg | #f5f5f5 | #171a19 | Ana yazılar |
| site-muted | #a3a3a3 | #5f6965 | Yardımcı ama okunabilir bilgiler |
| site-border | #262626 | #d6d8d2 | İnce ayırıcılar |
| site-accent | #f59e0b | #b45309 | Aktif araç/odak ve sınırlı vurgu |
| site-accent-solid | #f59e0b | #f59e0b | Yüksek öncelikli eylem yüzeyi; koyu yazıyla |

Bu tablo kaynakta gözlenen değerlerdir. Runtime kodu renkleri kopyalayıp dağıtmayacak; token kullanacak. Global tokenlar değiştirilmez. Gerekli V2 alias'ları yalnız V2 kökünde tanımlanır. Açık temada amber metin için açık amber500 kullanılıp kontrast düşürülmez; site-accent kullanılır. Mevcut site sınıflarında küçük hedefler bulunması V2'nin hedefini düşürme gerekçesi değildir.

**CAD çizgisinin rengi UI teması değildir.** Tema düğmesi kaynak entity renklerini, lineweight'i, linetype'ı ve kaynak ölçüleri değiştirmeyecek. Çizim zemini ayrı görünüm ayarıdır: “Koyu zemin” ve “Açık zemin”. İlk kurulumda site temasını izler; kullanıcı seçtikten sonra seçim korunur. ACI 7'nin zeminle ilişkisi kaynak görüntüleme kuralıyla ele alınır; bütün çizim CSS invert/filter ile ters çevrilmez. Kurumsal amber rengini kaynak donatı/aks geometrisine basmak yok.

## Ana yerleşim

Masaüstünde çalışma alanı tek bir kabuktur:

```text
┌ Geri   Dosya adı / Sürüm     [2D Motor V2]    Tema  Tam ekran  ⋮ ┐
├ Pafta: Model ▾    [Kaydır] [−] [+] [Sığdır]     [Katmanlar] [Görünüm]   ┤
│                                                              │
│                    GERÇEK CAD ÇİZİMİ                 ┌───────┤
│                                                      │ Aktif │
│                                                      │ panel │
│                                                      │       │
├ Açılış/kalite durumu     Aktif pafta          Yakınlık bilgisi ┤
└──────────────────────────────────────────────────────────────┘
```

Bu şema mekânsal sözleşmedir; sahte CAD resmi değildir. Boş alanları dekoratif kartlarla doldurma. Kalıcı sol navigation rail, ikinci site header'ı, welcome card, istatistik dashboard'u veya 3D view cube ekleme. Kullanıcının ekranının büyük çoğunluğu çizime ayrılacak.

### Üst bar

- Yükseklik desktop/tablet 56 CSS px; telefon 52 px + üst safe area. Sol geri düğmesi, tam adı ayrıntıda erişilebilir dosya adı, gerçek kaynak sürümü; küçük nötr “2D Motor V2” kimliği.
- Dosya adı tek satır ellipsis; dosya başlığına basınca tam ad ve sürüm bilgisi açılır ayrıntıda gösterilecek. Mobilde sadece hover title'a güvenilmez. Rozet yüzünden dosya adı tamamen kaybolmaz.
- Sağda tema, desteklenen tam ekran ve “Daha fazla” menüsü. İndir/paylaş ve “Mevcut görüntüleyiciyle aç” menüde; yalnız yetkili eylemler gösterilir. Üst barı reklam/upgrade/AI düğmeleriyle doldurma.
- Tarayıcı gerçek Fullscreen API'yi desteklemiyorsa “Odak görünümü” kendi açık adıyla kullanılır; tam ekran başarısı taklit edilmez. Geri/menü/odaktan çıkış her durumda erişilebilir.
- “Kaydet”, “Düzenle”, “3D”, “Ölç” ve çalışmayan placeholder düğmeleri yok. Dosya sürüm rozetine engine sürümü yazılmaz.

### Araç satırı

- Masaüstünde 48 px; pafta seçimi solda; Kaydır/−/+/Sığdır araç grubu; sağda Katmanlar/Görünüm. Gruplar 16 px aralıkla, grup içi 4 px ile ayrılır.
- Yalnız aktif araç amber yüzey/vurgu taşır. Birden fazla ana CTA görünüşü olmaz. Tooltip kısa Türkçe açıklama verir; çalışır kısayol varsa gösterir.
- Açılan Katmanlar ve Görünüm aynı sağ paneli paylaşır. Aynı anda iki panel çizimi sıkıştırmaz. Paneli açmak/kapatmak kamera merkezini veya pafta seçimini sıfırlamaz.
- Sığdır düğmesi dosyayı tekrar decode etmez. Zoom yüzdesi varsa kamera yakınlığıdır, paftanın yazdırma ölçeği gibi sunulmaz. İlk sürümde alt satır “Görünüm: …” ve belirli birim bilgisiyle sınırlı tutulur; uydurma koordinat gösterilmez.

### Sağ panel

Desktop genişliği 288 px; tablet 272 px overlay; mobil sheet. Başlık 16 px/600, kapatma hedefi 44 px. Panel açılış süresi 160 ms, opacity + en fazla 8 px hareket. Çizime sürekli backdrop blur uygulanmaz.

Katman paneli: “Katmanlar” başlığı → arama → görünür/ toplam sayısı → sanallaştırılmış liste → filtrelenmiş sonucun açıklaması. Her satır görünürlük checkbox'ı, kaynak renk swatch'ı, katman adı ve gerekiyorsa durum metni taşır. Katman adı kesilirse tam ad erişilebilir; renk tek anlam kaynağı olmaz. Kilitli layer “görünmez” sayılmaz. “Tümünü göster” işlemi bütün çizimin visibility'sine uygulanır; arama yalnız listeyi süzer. Davranış etikette açık kalır.

Görünüm paneli yalnız çalışan ayarlar: çizim zemini, kaynak çizgi kalınlıklarını göster, kaynak renkleri/tek renk görüntüleme. Ayarlar görüntüleme katmanında kalır; canonical koordinat veya kaynak dosya mutasyona uğramaz. Varsayılan “Kaynak renkleri” ve “Kaynak çizgi kalınlıkları açık”. Kullanıcı ayarı değişince yeniden parse edilmez.

Pafta seçimi masaüstünde combobox; telefonda aynı control açılır sheet listesine dönüşür. Model ve layout adları kaynakla aynıdır; yapay “Kat 1 / Kat 2” çıkarımı yapılmaz. Çok sayıda pafta için arama ve keyboard dolaşımı; kullanılmayan 3D layout araçları yok.

## Tipografi ve ölçüler

Site layout'undaki mevcut sans ve mono font değişkenleri kullanılacak. Yeni ücretli font veya dış Google Fonts isteği eklenmez. UI fontu ile çizim SHX/TTF fontu ayrı sorumluluktur. Türkçe büyük/küçük harf, İ/ı, ş/ğ ve sayılar gerçek metinle kontrol edilir.

| Eleman | Sabit ölçek |
|---|---|
| Üst dosya adı | Desktop 14 px/600; mobil 14 px/600 |
| Panel başlığı | 16 px/600 |
| Kontrol/katman satırı | 14 px/400–500 |
| Yardımcı durum | 12 px/400; önemli hata açıklaması 14 px |
| Sayısal teknik değer | Mono + tabular numbers; UI adı mono yapılmaz |
| İç boşluk | 4, 8, 12, 16, 24 px ölçeği |
| Radius | Kontrol 8 px; panel/menu 12 px; büyük dış çerçeve kartı yok |
| İkon | Lucide 18 px; stroke mevcut aileyle tutarlı |
| Kontrol hedefi | Fine pointer en az 36×36; coarse pointer en az 44×44 CSS px |

Etkileşim metnini dar ekrana sığdırmak için 10 px'e indirme. Telefon editable input'ları 16 px. Boşluklar rastgele 7/13/19 px ile çoğaltılmaz. Çok ince gri yazıyla “lüks” görünüm aranmaz. 1 px ayırıcılar kullanılır; her panel içinde kart üstüne kart yığılmaz. Gölge yalnız overlay/menu'nun katmanını belli edecek kadar kullanılır.

## Telefon ve tablet

Breakpoints: <640 px telefon; 640–1023 tablet/dar ekran; ≥1024 desktop. Coarse pointer ayrıca kontrol hedeflerini büyütür; büyük ekranlı tablet desktop mouse kabul edilmez.

Telefon üst barı kısa; alt sabit araç dock'u 56 px + safe area: Kaydır, Sığdır, Katmanlar, Görünüm. Her ikonun kısa görünür etiketi var. Pafta seçimi üstte tek satır control içinde. Katman/Görünüm alttan sheet açar; sheet normalde kullanılabilir yüksekliğin %60'ı, arama klavyesi açılınca kalan görsel viewport'a sığar. Sheet başlık/kapatma/arama sabit, liste kendi içinde kayar. Çizim üzerinde pan, sheet içinde scroll olur.

320 px genişlikte dört dock hedefi taşmadan yerleşir. Uzun dosya adı ve arama metni gövdeyi yatay kaydırmaz. Telefon yatay modunda iki kalıcı geniş barla çizim boğulmaz: odak görünümüyle yalnız geri çağırılabilir küçük üst kontrol ve araç erişimi kalır. Bu moddan çıkış kaybolmaz. Ortam görünür yüksekliği ResizeObserver/visualViewport ile doğru hesaplanır; 100vh varsayımına bağlı kesilme yok.

Tablet portrede yan panel overlay, landscape'de yeterli genişlikte docked panel kullanılır. Panel değişiminde world anchor korunur. Portre/yatay dönüşte parse tekrar başlamaz. Dokunmayla eylem, yalnız hover üzerine saklanmaz.

## Çizim ve hareket kalitesi

Çizgi titremesi, yazı kesilmesi ve hatch'in yakınlaşınca kalıcı kaybolması estetik kusurdan önce CAD doğruluk kusurudur. Pan sırasında LOD kullanılırsa hareket bitiminde exact kaliteye dönülür; çizimde kaldığı halde “Hazır” görünmesi engellenir. UI gölgeleri/refinement animasyonu pan/zoom frame bütçesini tüketmez.

UI transition 120–180 ms; panel 160 ms; hiçbir UI hareketi 300 ms'yi aşmaz. Reduced motion'da kayma ve sürekli pulse kaldırılır. İlk ekrana dramatik fade/zoom giriş animasyonu yok. Kamera hareketine gereksiz easing uygulanıp teknik kontrol hissi geciktirilmez. Spinner kullanılabilir ama ne iş yapıldığını açıklayan gerçek faz metniyle birlikte olmalıdır.

## Erişilebilirlik kabulü

Normal metin 4.5:1; büyük metin ve anlam taşıyan kontrol/odak işaretleri en az 3:1 hedefiyle gerçek arka plan üzerinde ölçülür. Bu eşikler bu planın kabul koşuludur; bütün ürünün WCAG sertifikası olduğu iddia edilmez. Tüm kontrollerde erişilebilir Türkçe ad, görünür keyboard focus, mantıklı Tab sırası ve renk dışı durum işareti bulunur.

Escape en üstteki menü/dialog/sheet'i kapatır, sonra odağı tetikleyiciye döndürür; açık panel varken çizimi resetlemez. Modal sheet focus trap taşır; desktop docked panel modal değildir. Loading/error durumu aria-live ile faz değişiminde duyurulur; her yüzde/frame'de okunmaz. Ekran okuyucunun bütün CAD geometrisini anlamlandırdığı iddiası yoktur.

Overlay portal'ı mevcut Studio/fullscreen ve dok-overlay-root sözleşmesini korur. Rastgele z-index 99999 eklenmez. Menü/sheet/dialog için mevcut --dok-z-* tokenları kullanılır. Global overflow/scroll lock kapanışta geri alınır; başka sayfa bozulmaz.

## Tasarımın bitişi

Gemini G04'te tüm durumların sentetik arayüz prototipini, G16'da gerçek motor bağlı son ekranları inceler. Bu iki görüntü grubu birbirine karıştırılmaz. Görsel kalite yalnız otomatik testle tamamlanmaz; [22](22_ARAYUZ_SENARYOLARI_VE_KABUL.md)'deki her zorunlu ekran açılır ve kusur kaydı tutulur. Astra G17 sonrası aynı ekranları bağımsız inceler.

## EXEC-2 kontrol tamamlaması

Masaüstünde Yakınlaştır ve Uzaklaştır erişilebilir adlarıyla ± düğmeleri zorunludur; yalnız wheel bilen kullanıcıya göre tasarlanmaz. Mobil dört dock öğesi korunur; Görünüm sheet içinde yan yana büyük ± ve Sığdır kontrolleri bulunur. Düğmeler [28](28_PAN_ZOOM_FIT_SOZLESMESI.md) aynı kamera köprüsüne bağlıdır. [30](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) ayar/kalıcılık tablosu eksiksiz uygulanır. Sınıra gelen ± devre dışı ve açıklanmış; no-op handler değildir.
