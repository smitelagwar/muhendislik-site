import {
  PHASE7_UPDATED_AT,
  bepPhase7References,
  phase7Lines,
  type DepremPhase7Override,
} from "./deprem-phase7-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const U_VALUE: DepremPhase7Override = {
  slug: "bep-isi-yalitim-katmanlari-u-degeri-hesabi",
  title: "TS 825 Isı Yalıtım Katmanları ve U Değeri: Kesitten Proje Kontrolüne",
  description: "Duvar, çatı ve döşeme katmanlarında ısıl direnç ve U değerinin nasıl kurulduğunu; TS 825 sınır kontrolü, yoğuşma ve uygulama sürekliliğinden ayırarak açıklar.",
  seoTitle: "TS 825 U Değeri Hesabı | Isı Yalıtım Katmanları ve Isıl Direnç",
  seoDescription: "R=d/λ ve U=1/RT mantığıyla katmanlı yapı elemanı U değeri, TS 825 iklim sınıfı, ısı köprüsü ve saha uygulama kontrolleri.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "15 dk okuma",
  relatedSlugs: ["bep-isi-koprusu-psi-degeri-ve-lineer-gecis", "bep-ts825-iklim-bolgeleri-turkiye-haritasi", "bep-enerji-kimlik-belgesi-siniflari-asgari"],
  sections: [
    section("mantik", "U değeri tek bir yalıtım kalınlığı değil, tüm kesitin ısı geçiş sonucudur", phase7Lines(
      "Bir yapı elemanının ısı geçiş katsayısı **U [W/(m²K)]**, iç ve dış ortam arasındaki sıcaklık farkında birim alan başına geçen ısı akısını temsil eder. Hesap, yalnız yalıtım levhasının kalınlığına değil; bütün katmanların ısıl dirençlerine ve yüzey dirençlerine dayanır.",
      "Düz ve homojen bir katman için temel ilişki `R_i = d_i / λ_i`; toplam direnç `R_T = R_si + ΣR_i + R_se`; sonuç ise `U = 1 / R_T` biçimindedir. Projede kullanılacak **λ tasarım değeri**, yüzey dirençleri ve özel katman kabulleri güncel TS 825 ve ilgili ürün verileriyle alınmalıdır.",
      "Yanlış yaklaşım, katalogdaki tek bir λ değerini bütün duvarın performansı sanmak veya sıva, betonarme kuşak, bağlantı ve kesintileri hiç dikkate almamaktır."
    )),
    section("ornek", "Bağımsız örnek: katman hesabını birimlerle kurun", phase7Lines(
      "Örnek yalnız hesap zincirini gösterir: 20 cm bir katmanın `λ=0,70 W/(mK)` ve 8 cm yalıtımın `λ=0,035 W/(mK)` olduğu varsayılsın. Katman dirençleri sırasıyla `0,20/0,70 = 0,286 m²K/W` ve `0,08/0,035 = 2,286 m²K/W` olur.",
      "Yüzey dirençleri ve diğer katmanlar eklenmeden bu iki değerden doğrudan nihai U değeri üretmek doğru değildir. Proje hesabında bütün kesit aynı birim sistemiyle tamamlanır ve `U=1/R_T` uygulanır.",
      "| Adım | Kontrol | Birim |\n|---|---|---:|\n| Katman direnci | d / λ | m²K/W |\n| Toplam direnç | Rsi + ΣR + Rse | m²K/W |\n| Isı geçiş katsayısı | 1 / RT | W/(m²K) |"
    )),
    section("ts825", "TS 825 kontrolü: hesaplanan U değerini proje yerinin güncel iklim sınıfıyla eşleştirin", phase7Lines(
      "20 Şubat 2025 tarihli Tebliğ, TSE'nin 3 Aralık 2024 tarihli TS 825 revizyonunu **1 Nisan 2025** itibarıyla zorunlu uygulamaya bağladı. Bakanlık açıklamasına göre iklim bölgesi sayısı **4'ten 6'ya** çıkarıldı ve soğutma ihtiyacının hesaba katılması güçlendirildi.",
      "Bu nedenle eski dört bölgeli tabloları yeni ruhsat projesinde otomatik kullanmak doğru değildir. Proje ili/ilçesi, yürürlük tarihi ve güncel TS 825 sınıflandırması doğrulanmadan bir `U sınırı` sabit sayı olarak koda veya paftaya gömülmemelidir.",
      "Standarttaki telifli tablo değerleri burada tekrar edilmez; uygulama projesi güncel, lisanslı standart ve resmî hesap yöntemiyle kapatılır."
    )),
    section("kopru", "Düz alan U hesabı, ısı köprüsünü tek başına çözmez", phase7Lines(
      "Kolon-kiriş dolgusu, döşeme alnı, balkon, parapet, pencere çevresi ve ankrajlar iki boyutlu veya üç boyutlu ısı akısı oluşturabilir. Düz alan için iyi bir U değeri elde edilmesi, birleşimlerin de aynı performansta olduğu anlamına gelmez.",
      "Enerji kaybı değerlendirmesinde alan bileşeni `Σ(U_i A_i)` ile lineer ısı köprüleri `Σ(ψ_k l_k)` ayrı izlenmelidir. Kesintisiz dış yalıtım ve doğru birleşim detayı çoğu projede yalnız kalınlığı artırmaktan daha kritik olabilir.",
      "Isı köprüsü hesabı bir sonraki makaledeki ψ yaklaşımıyla ayrıca kontrol edilmelidir."
    )),
    section("yogusma", "Isıl performans ile nem/yoğuşma kontrolünü birbirine karıştırmayın", phase7Lines(
      "U değeri ısı geçişini ifade eder; katman içi veya yüzey yoğuşması ise sıcaklık ve su buharı basıncı dağılımına bağlı ayrı bir fizik problemidir. Yüksek buhar dirençli katmanların yanlış sırada kurulması, düşük U değerine rağmen nem riski oluşturabilir.",
      "Malzeme seçimi yapılırken λ değerinin yanında su buharı davranışı, yangın, mekanik dayanım, cephe sistemi ve uygulama toleransı birlikte değerlendirilmelidir.",
      "Projede enerji hesabı ile detay çizimi kopuk yürütülürse teorik kesit sahada aynı performansı vermeyebilir."
    )),
    section("saha", "Paftadan şantiyeye: U değerinin saha karşılığını kontrol edin", phase7Lines(
      "Yalıtım kalınlığı, dübel/ankraj düzeni, şaşırtmalı derz, pencere-kasa dönüşleri, balkon/döşeme alnı ve tesisat geçişleri uygulama kontrol listesine taşınmalıdır. Özellikle kolon-kiriş yüzeylerinde projenin tarif ettiği yalıtımın kesilmesi enerji hesabını bozar.",
      "Malzeme sevkinde ürün etiketi ve beyan edilen teknik özellikler projedeki seçimle karşılaştırılmalı; sahada farklı λ sınıfında ürün kullanılması durumunda hesap yeniden doğrulanmalıdır.",
      "Kalite kontrol yalnız '8 cm levha var mı?' sorusuna indirgenmemelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Proje tarihi için TS 825'in 1 Nisan 2025 sonrası güncel sürümü esas alındı mı?",
      "- [ ] Yer için 6 iklim bölgesinden doğru sınıf doğrulandı mı?",
      "- [ ] Her katmanda d ve λ aynı birim sistemiyle kullanıldı mı?",
      "- [ ] Rsi, Rse ve tüm katmanlar toplam dirence dahil edildi mi?",
      "- [ ] Hesaplanan U değeri lisanslı güncel TS 825 sınırıyla kontrol edildi mi?",
      "- [ ] Kolon-kiriş, balkon ve açıklık çevrelerindeki ısı köprüleri ayrıca ele alındı mı?",
      "- [ ] Yoğuşma/nem kontrolü U hesabından ayrı yapıldı mı?",
      "- [ ] Projedeki malzeme özellikleri ile sahadaki ürün ve kalınlık doğrulandı mı?"
    )),
  ],
  references: bepPhase7References("U değeri, TS 825 ve BEP-TR koordinasyonu"),
  keywords: ["TS 825", "U değeri", "R=d/λ", "U=1/RT", "ısı yalıtımı", "6 iklim bölgesi"],
  tags: ["BEP", "TS 825", "Isı Yalıtımı", "U Değeri", "Bina Kabuğu"],
};

const THERMAL_BRIDGE: DepremPhase7Override = {
  slug: "bep-isi-koprusu-psi-degeri-ve-lineer-gecis",
  title: "Isı Köprüsü ve ψ Değeri: Lineer Geçişleri Enerji Hesabına Taşıma",
  description: "Kolon-kiriş, balkon, döşeme alnı ve açıklık çevrelerinde lineer ısı köprüsünü; U değeri, ψ değeri ve detay sürekliliği üzerinden mühendislik iş akışına dönüştürür.",
  seoTitle: "Isı Köprüsü ψ Değeri | Lineer Isı Kaybı ve Detay Kontrolü",
  seoDescription: "ΣUA + ΣψL yaklaşımı, lineer ısı köprüleri, balkon-döşeme alnı, kolon-kiriş ve pencere çevresi detaylarının enerji hesabı.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["bep-isi-yalitim-katmanlari-u-degeri-hesabi", "bep-ts825-iklim-bolgeleri-turkiye-haritasi", "bep-enerji-kimlik-belgesi-siniflari-asgari"],
  sections: [
    section("tanim", "Isı köprüsü, düz alan U hesabının bozulduğu birleşim bölgesidir", phase7Lines(
      "Geometrinin veya malzeme sürekliliğinin değiştiği birleşimlerde ısı akısı tek boyutlu kabulden sapar. Betonarme döşeme alnı, balkon plağı, kolon-kiriş çevresi, parapet, köşe ve pencere-kasa birleşimleri tipik **lineer ısı köprüsü** bölgeleridir.",
      "Lineer ısı geçirgenliği **ψ [W/(mK)]**, birleşimin düz alan U hesabına ek getirdiği ısı kaybını birim uzunluk başına ifade eder. Noktasal bağlantılarda ise `χ [W/K]` türü terimler gerekebilir.",
      "Yanlış yaklaşım, bütün cepheyi tek bir ortalama U değeriyle temsil edip birleşim etkilerini görünmez saymaktır."
    )),
    section("denklem", "Isı kaybı zincirini alan, lineer ve noktasal bileşenlere ayırın", phase7Lines(
      "Bina kabuğunun iletim bileşeni mühendislik kontrolünde sembolik olarak `H_T = Σ(U_i A_i) + Σ(ψ_k l_k) + Σχ_j` biçiminde izlenebilir. Burada U alan elemanını, ψ birleşim uzunluğunu ve χ noktasal geçişi temsil eder.",
      "Örnek: yalnız yöntemi göstermek için `ψ=0,08 W/(mK)` ve birleşim uzunluğu `l=12 m` kabul edilirse lineer katkı `ψ·l = 0,96 W/K` olur. Bu değer binanın toplam enerji hesabına, ilgili yöntem ve sınırlar çerçevesinde eklenir.",
      "| Bileşen | İfade | Birim |\n|---|---|---:|\n| Düz alan | U × A | W/K |\n| Lineer köprü | ψ × l | W/K |\n| Noktasal köprü | χ | W/K |"
    )),
    section("model", "ψ değerini katalog ezberiyle değil, geçerli hesap yöntemiyle belirleyin", phase7Lines(
      "ψ değeri birleşimin referans düzlemi, geometrisi, malzeme iletkenlikleri ve sınır şartlarına bağlıdır. Aynı 'balkon detayı' farklı kesitlerde farklı ψ üretebilir.",
      "Proje hesabında güncel TS 825/BEP-TR yaklaşımı ve atıf yapılan hesap standartları esas alınmalıdır. Ayrıntılı iki boyutlu model gereken durumda geometrinin gerçek katmanları ve süreklilikleri modele aktarılmalı; telifli standart tabloları kaynaksız kopyalanmamalıdır.",
      "Hesap modeli ile uygulama detayı aynı değilse sayısal ψ değeri anlamını kaybeder."
    )),
    section("kritik-detaylar", "Önce en uzun ve en iletken köprüleri bulun", phase7Lines(
      "Döşeme alnı ve balkon hatları uzunlukları nedeniyle; kolon-kiriş yüzleri yüksek iletkenlikleri nedeniyle; pencere çevreleri ise hem lineer uzunluk hem montaj boşlukları nedeniyle kritik olabilir.",
      "Detay taramasında `birleşim tipi — uzunluk — katman sürekliliği — olası ψ kaynağı — proje detayı — saha kontrolü` tablosu oluşturmak, enerji modelindeki varsayımları izlenebilir hale getirir.",
      "Isı köprüsünü yalnız son hesapta görmek yerine mimari ve statik detay kararına erken geri beslemek gerekir."
    )),
    section("cozum", "Çözüm önceliği: ısı yalıtım katmanının sürekliliğini korumak", phase7Lines(
      "Çoğu birleşimde ilk tasarım sorusu 'daha kalın levha' değil, yalıtım hattının kesintisiz devam edip etmediğidir. Balkon ve konsol gibi zorunlu geometrik geçişlerde sistem çözümü, taşıyıcılık, yangın ve su yalıtımıyla birlikte değerlendirilmelidir.",
      "Pencere kasasını yalıtım düzlemine yaklaştırmak, söve dönüşünü çözmek ve metal bağlantıların kesitini/sürekliliğini kontrol etmek lineer kayıpları azaltabilir.",
      "Teknik çözüm seçilirken yapı fiziği ile taşıyıcı sistem güvenliği birbirine karşı kullanılmamalıdır."
    )),
    section("saha", "Saha sapması ısı köprüsünü yeniden üretir", phase7Lines(
      "Projede kesintisiz çizilen yalıtım, şantiyede ankraj, tesisat, doğrama montajı veya betonarme toleransı nedeniyle kesilebilir. Bu bölgeler fotoğraflı kontrol ve kapatma öncesi kabul ile izlenmelidir.",
      "Özellikle sonradan eklenen metal konsol, cephe alt konstrüksiyonu ve mekanik bağlantıların enerji modelinde hiç bulunmaması yaygın bir koordinasyon hatasıdır.",
      "As-built detay değişmişse kritik birleşimin hesabı da güncellenmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] U alan hesabı ile ψ lineer hesabı ayrı izleniyor mu?",
      "- [ ] Kritik balkon, döşeme alnı, kolon-kiriş ve pencere çevreleri listelendi mi?",
      "- [ ] Her ψ için kullanılan geometri ve referans düzlemi proje detayıyla aynı mı?",
      "- [ ] `Σ(U A) + Σ(ψ l) + Σχ` bileşenleri çift sayılmadan kuruluyor mu?",
      "- [ ] Isı köprüsü çözümü taşıyıcılık, yangın ve su yalıtımıyla koordine edildi mi?",
      "- [ ] Sahadaki ankraj ve montaj değişiklikleri kapatma öncesi kontrol edildi mi?",
      "- [ ] Standart/tablo değerleri güncel ve yetkili kaynaktan doğrulandı mı?"
    )),
  ],
  references: bepPhase7References("ısı köprüsü, ψ değeri ve bina kabuğu enerji hesabı"),
  keywords: ["ısı köprüsü", "psi", "ψ değeri", "ΣUA", "ΣψL", "lineer ısı geçişi"],
  tags: ["BEP", "Isı Köprüsü", "Bina Kabuğu", "Detay", "Enerji"],
};

const CLIMATE: DepremPhase7Override = {
  slug: "bep-ts825-iklim-bolgeleri-turkiye-haritasi",
  title: "TS 825 İklim Bölgeleri: 2025 Sonrası 6 Bölgeli Sistemi Doğru Okuma",
  description: "Eski dört bölgeli TS 825 yaklaşımıyla güncel altı bölgeli sistemi ayırır; proje yerinin iklim sınıfının, U değeri ve BEP-TR hesabına nasıl bağlanacağını açıklar.",
  seoTitle: "TS 825 İklim Bölgeleri 2025 | Türkiye 6 Bölgeli Sistem",
  seoDescription: "1 Nisan 2025 sonrası TS 825'te 4'ten 6'ya çıkan iklim bölgeleri, proje yeri doğrulaması, U değerleri ve BEP-TR koordinasyonu.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "12 dk okuma",
  relatedSlugs: ["bep-isi-yalitim-katmanlari-u-degeri-hesabi", "bep-isi-koprusu-psi-degeri-ve-lineer-gecis", "bep-enerji-kimlik-belgesi-siniflari-asgari"],
  sections: [
    section("degisim", "Eski dört bölgeli ezberi bırakın: güncel TS 825 altı iklim bölgesi kullanıyor", phase7Lines(
      "ÇŞİDB'nin 20 Şubat 2025 tarihli açıklaması, Meteoroloji Genel Müdürlüğü verileriyle yapılan güncellemede TS 825 iklim bölgesi sayısının **4'ten 6'ya** çıkarıldığını açıkça belirtir. Yeni düzenleme **1 Nisan 2025** itibarıyla uygulamaya girdi.",
      "Bu değişiklik yalnız harita grafiği değildir; ısıtma yanında soğutma ihtiyacının daha gerçekçi değerlendirilmesine ve bina kabuğu kriterlerinin güncel iklim verileriyle kurulmasına hizmet eder.",
      "Yanlış yaklaşım, eski bir internet görselindeki dört bölgeli haritadan il rengini okuyup yeni ruhsat hesabına aynen taşımaktır."
    )),
    section("yer", "Proje yerini yalnız il adıyla değil, güncel resmî sınıflandırmayla doğrulayın", phase7Lines(
      "İklim sınıfı bina kabuğu kararlarını doğrudan etkilediğinden proje adresi ve yürürlük tarihi kayıt altına alınmalıdır. İl/ilçe ayrıntısı ve güncel standardın atadığı sınıf lisanslı TS 825 veya resmî hesap altyapısından doğrulanmalıdır.",
      "Sitede telifli standart haritasının kopyası veya tüm il/ilçe tablosu yayımlanmak yerine kullanıcıya doğrulama iş akışı gösterilmelidir.",
      "| Girdi | Doğrulama | Çıktı |\n|---|---|---|\n| Proje adresi | Güncel TS 825 / resmî yöntem | İklim bölgesi |\n| Ruhsat tarihi | Geçiş hükmü | Uygulanacak sürüm |\n| Bina kullanımı | BEP-TR | Enerji modeli |"
    )),
    section("u-degeri", "İklim bölgesi, U hedefini ve kabuk stratejisini değiştirir", phase7Lines(
      "Aynı duvar kesitinin U değeri her yerde aynıdır; fakat kabul edilebilir sınır ve yıllık enerji etkisi iklim koşullarına göre değişir. Bu nedenle `U hesapla → bölgeyi belirle → güncel sınırla karşılaştır` sırası korunmalıdır.",
      "Sıcak bölgelerde yalnız ısıtma kaybına odaklanmak; güneş kazancı, soğutma ve gölgeleme etkisini ihmal etmek güncel yaklaşımın amacına aykırıdır.",
      "Kesit optimizasyonu mekanik sistem ve mimari gölgeleme kararlarıyla birlikte ele alınmalıdır."
    )),
    section("beptr", "TS 825 ile BEP-TR aynı şey değildir; birbirine veri sağlar", phase7Lines(
      "TS 825 bina kabuğu ve ısı yalıtımına ilişkin temel kuralları sağlar. BEP-TR ise binanın enerji performansını; kabukla birlikte ısıtma, soğutma, havalandırma, sıcak su, aydınlatma ve ilgili sistem girdileri üzerinden hesaplar.",
      "25 Nisan 2025 tarihli ulusal hesap yöntemi değişikliği ve Bakanlığın açıklaması, BEP-TR referans değerlerinin yeni TS 825 gerekleriyle uyumlandırıldığını; meteoroloji altyapısının yaklaşık **84 istasyondan 730 civarına** genişletildiğini belirtir.",
      "Bu nedenle 'TS 825'i sağladım, EKB sonucu otomatik bellidir' çıkarımı yapılmamalıdır."
    )),
    section("gecis", "Yürürlük tarihini proje dosyasına yazın", phase7Lines(
      "TS 825 güncellemesi 1 Nisan 2025; güncellenen BEP-TR metodolojisi ise Bakanlık açıklamasına göre **30 Haziran 2025** itibarıyla yeni ruhsat alacak binalarda uygulanmaya başladı.",
      "Ruhsat, tadilat veya revizyon projesinde hangi sürümün uygulanacağını yalnız bugünkü tarih üzerinden değil, ilgili geçiş hükümleri ve idare süreci üzerinden doğrulamak gerekir.",
      "Eski bir hesap dosyasını yeni projeye kopyalamadan önce iklim, referans bina ve yazılım metodolojisi güncelliği kontrol edilmelidir."
    )),
    section("harita-kullanimi", "Haritayı karar aracı olarak kullanın, teknik tablonun yerine koymayın", phase7Lines(
      "İklim haritası ön sınıflandırma sağlar; nihai proje hesabı için standarttaki ilgili parametreler, ürün verileri ve BEP-TR girdileri gerekir. Harita görselinden yaklaşık renk okumak bir hesap girdisi doğrulaması değildir.",
      "Web aracında kullanıcı adres seçtiğinde çıktı 'bölge + kullanılan kaynak/sürüm + tarih' şeklinde gösterilmeli; kaynağı belirsiz sabit JSON tablosu sessizce kullanılmamalıdır.",
      "Standart revize olduğunda veri katmanı güncellenebilir olmalıdır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] 1 Nisan 2025 sonrası altı bölgeli TS 825 sistemi esas alındı mı?",
      "- [ ] Proje adresi güncel resmî/standart sınıflandırmasıyla doğrulandı mı?",
      "- [ ] Eski dört bölgeli harita veya tablo kullanılmadı mı?",
      "- [ ] Ruhsat tarihi ve uygulanacak TS 825/BEP-TR sürümü kaydedildi mi?",
      "- [ ] U değerleri doğru iklim bölgesinin güncel sınırlarıyla karşılaştırıldı mı?",
      "- [ ] 30 Haziran 2025 sonrası BEP-TR metodolojisi dikkate alındı mı?",
      "- [ ] Web/veri tabanında kaynak sürümü ve güncelleme tarihi izlenebilir mi?"
    )),
  ],
  references: bepPhase7References("iklim bölgeleri, TS 825 geçişi ve BEP-TR meteoroloji altyapısı"),
  keywords: ["TS 825", "6 iklim bölgesi", "1 Nisan 2025", "30 Haziran 2025", "BEP-TR", "iklim"],
  tags: ["BEP", "TS 825", "İklim", "BEP-TR", "Isı Yalıtımı"],
};

const EKB: DepremPhase7Override = {
  slug: "bep-enerji-kimlik-belgesi-siniflari-asgari",
  title: "Enerji Kimlik Belgesi: Sınıfı, Referans Binayı ve Asgari Uygunluğu Doğru Okuma",
  description: "Enerji Kimlik Belgesi sonucunu yalnız bir harf sınıfı olmaktan çıkarıp BEP-TR, referans bina, ruhsat/kullanma izni ve 2026 düşük karbon düzenlemeleriyle birlikte açıklar.",
  seoTitle: "Enerji Kimlik Belgesi EKB | BEP-TR Sınıfı ve Asgari Uygunluk",
  seoDescription: "EKB enerji performans sınıfı, sera gazı emisyon sınıfı, BEP-TR, referans bina, ruhsat ve 2026 Düşük Karbonlu Bina Belgesi ilişkisi.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["bep-yenilenebilir-enerji-zorunlulugu-ve-oranlari", "bep-ts825-iklim-bolgeleri-turkiye-haritasi", "bep-ilk-yatirim-ve-yasam-dongusu-maliyet-analizi"],
  sections: [
    section("nedir", "EKB, tek başına yalıtım belgesi değil bütün bina enerji performansı çıktısıdır", phase7Lines(
      "Enerji Kimlik Belgesi (EKB), Binalarda Enerji Performansı Yönetmeliği ve BEP-TR ulusal hesap yöntemi çerçevesinde binanın enerji performansını ve ilgili emisyon göstergelerini sınıflandıran resmî çıktıdır.",
      "Kabuk U değerleri önemli girdidir; ancak ısıtma, soğutma, havalandırma, sıhhi sıcak su, aydınlatma ve yenilenebilir enerji sistemleri de sonuca etki eder.",
      "Yanlış yaklaşım, 'duvara X cm yalıtım yaptım, bina kesin B sınıfı olur' gibi tek girdiden sınıf tahmini yapmaktır."
    )),
    section("referans", "Sınıfı mutlak tüketim sayısından değil referans bina metodolojisiyle okuyun", phase7Lines(
      "25 Nisan 2025 tarihli değişiklikle BEP-TR hesap yöntemi ve referans değerler güncellendi; Bakanlık, yeni referans bina kriterlerinin güncel TS 825 gerekleriyle uyumlu hale getirildiğini açıkladı.",
      "Bu nedenle farklı yıllarda veya farklı BEP-TR metodolojileriyle üretilmiş iki EKB'yi yalnız harf sınıfına bakarak kıyaslamak yanıltıcı olabilir. Hesap sürümü ve proje tarihi kayıt altına alınmalıdır.",
      "| Kontrol | Girdi | Belgeye etkisi |\n|---|---|---|\n| Bina kabuğu | U, gölgeleme, açıklıklar | Isıtma/soğutma talebi |\n| Sistemler | verim, yakıt/enerji | Birincil enerji |\n| Yenilenebilir | yerinde üretim | Net performans |"
    )),
    section("asgari", "Asgari sınıfı güncel yönetmelikten doğrulayın; eski internet özetini kodlamayın", phase7Lines(
      "Yürürlükteki konsolide Binalarda Enerji Performansı Yönetmeliği yeni ve mevcut binalar için EKB düzenleme ve asgari performans kurallarını içerir. Proje yazılımında sınıf eşiği sabitlenmeden önce güncel yönetmelik metni ve geçiş hükümleri okunmalıdır.",
      "30 Haziran 2025 sonrası yeni ruhsatlarda güncellenmiş BEP-TR metodolojisinin kullanılması, eski EKB hesap dosyalarının doğrudan yeni projeye kopyalanmamasını gerektirir.",
      "Bu makale telifli veya değişebilir sınıf eşik tablolarını yeniden yayımlamak yerine doğrulama sürecini esas alır."
    )),
    section("dusuk-karbon", "2026 düzenlemesi EKB'ye yeni bir bağlam ekledi: düşük karbon belgesi", phase7Lines(
      "ÇŞİDB'nin **16 Mayıs 2026** tarihli açıklamasına göre Düşük Karbonlu Bina Belgesi için EKB'de sera gazı emisyon sınıfının en az **B**, enerji performans sınıfının ise en az **C** olması öngörülüyor.",
      "Bu iki kriter birbirinden farklı göstergelerdir. Enerji performansı ile sera gazı emisyonu aynı harf veya aynı fiziksel büyüklük değildir.",
      "Düşük Karbonlu Bina Belgesi, sıradan EKB'nin adı değiştirilmiş hali olarak sunulmamalıdır."
    )),
    section("ruhsat", "EKB'yi proje sonunda doldurulan formalite değil tasarım kontrol noktası yapın", phase7Lines(
      "Kabuk ve sistem seçimleri tasarım ilerledikçe BEP-TR modeline beslenmeli; sonuç yapı kullanma izni aşamasına bırakılmamalıdır. Aksi halde hedef sınıf tutmadığında mimari, mekanik ve elektrik projelerinde pahalı geri dönüşler oluşabilir.",
      "Proje revizyonunda pencere oranı, cam türü, HVAC verimi veya yenilenebilir sistem değişirse EKB modelinin etkilenip etkilenmediği kontrol edilmelidir.",
      "As-built sistem ile belge girdileri arasında izlenebilirlik kurulmalıdır."
    )),
    section("veri", "EKB girdilerini kaynak ve sürüm bilgisiyle saklayın", phase7Lines(
      "BEP-TR modelinde kullanılan bina alanları, yönlenme, kabuk özellikleri, sistem verimleri ve yenilenebilir kapasite için kaynak pafta veya teknik föy referansı tutulmalıdır.",
      "Bir web aracı geliştiriliyorsa kullanıcıya yalnız sınıf tahmini göstermek yerine 'ön hesap / resmî EKB değildir' ayrımı açıkça belirtilmeli ve resmî BEP-TR çıktısının yerini aldığı izlenimi verilmemelidir.",
      "Hesap motorunun meteorolojik veri ve referans bina sürümü değişebilir; sürümleme zorunludur."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Proje için güncel Binalarda Enerji Performansı Yönetmeliği kontrol edildi mi?",
      "- [ ] 30 Haziran 2025 sonrası güncel BEP-TR metodolojisi kullanılıyor mu?",
      "- [ ] EKB girdileri mimari, mekanik ve elektrik projeleriyle tutarlı mı?",
      "- [ ] Enerji performans sınıfı ile sera gazı emisyon sınıfı birbirinden ayrıldı mı?",
      "- [ ] 2026 Düşük Karbonlu Bina Belgesi için B/C koşulları yalnız ilgili kapsamda kullanılıyor mu?",
      "- [ ] Proje revizyonları EKB modeline geri besleniyor mu?",
      "- [ ] Kullanılan hesap sürümü ve veri kaynakları dosyada izlenebilir mi?"
    )),
  ],
  references: bepPhase7References("Enerji Kimlik Belgesi, BEP-TR ve düşük karbon sınıflandırması"),
  keywords: ["Enerji Kimlik Belgesi", "EKB", "BEP-TR", "referans bina", "sera gazı emisyon sınıfı", "Düşük Karbonlu Bina Belgesi"],
  tags: ["BEP", "EKB", "BEP-TR", "Enerji Performansı", "Düşük Karbon"],
};

const RENEWABLE: DepremPhase7Override = {
  slug: "bep-yenilenebilir-enerji-zorunlulugu-ve-oranlari",
  title: "BEP'te Yenilenebilir Enerji: Zorunluluk, BEP-TR Etkisi ve Proje Boyutlandırması",
  description: "Yenilenebilir enerji koşullarını sabit bir yüzde ezberi yerine güncel Binalarda Enerji Performansı Yönetmeliği, BEP-TR ve proje kapsamı üzerinden kontrol eden iş akışını verir.",
  seoTitle: "BEP Yenilenebilir Enerji Zorunluluğu | BEP-TR ve Proje Kontrolü",
  seoDescription: "Binalarda Enerji Performansı Yönetmeliğinde yenilenebilir enerji, BEP-TR hesabı, çatı GES/rüzgâr/ısı pompası ve proje tarihine göre eşik kontrolü.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "13 dk okuma",
  relatedSlugs: ["bep-enerji-kimlik-belgesi-siniflari-asgari", "bep-ilk-yatirim-ve-yasam-dongusu-maliyet-analizi", "bep-isi-yalitim-katmanlari-u-degeri-hesabi"],
  sections: [
    section("once-kapsam", "Önce kapsamı belirleyin: tek bir yenilenebilir yüzdeyi bütün binalara uygulamayın", phase7Lines(
      "Binalarda Enerji Performansı Yönetmeliğinin yenilenebilir enerji hükümleri bina büyüklüğü, kullanım, ruhsat tarihi ve güncel değişiklik zinciriyle birlikte okunmalıdır. Geçmiş yıllara ait `5.000 m² / %5` veya `20.000 m² / %10` gibi özetleri bugünkü projeye otomatik kural olarak taşımak güvenli değildir.",
      "Proje kontrolünde `ruhsat tarihi → bina toplam alanı/kapsamı → yürürlükteki madde → BEP-TR etkisi` sırası izlenmelidir.",
      "Yanlış yaklaşım, arama motorundan bulunan eski bir yüzdeyi yazılıma hard-code edip mevzuat sürümünü kaybetmektir."
    )),
    section("enerji-hiyerarsisi", "Yenilenebilir sistem, kötü bina kabuğunun telafisi değildir", phase7Lines(
      "Enerji tasarımında önce talebi azaltmak; sonra verimli sistem seçmek; ardından uygun yenilenebilir kaynağı boyutlandırmak daha sağlam bir mühendislik hiyerarşisidir. Çatı GES eklemek, ısı köprülü kabuk veya verimsiz mekanik sistemi otomatik olarak iyi tasarım yapmaz.",
      "BEP-TR sonucu kabuk, sistem ve yerinde üretimin birlikte etkisini içerir. Yenilenebilir kapasite, mimari çatı alanı ve elektrik/mekanik proje kısıtlarıyla gerçekçi kurulmalıdır.",
      "| Adım | Mühendislik kararı |\n|---|---|\n| 1 | Enerji talebini azalt |\n| 2 | Sistem verimini yükselt |\n| 3 | Yenilenebilir kaynağı seç ve boyutlandır |"
    )),
    section("teknolojiler", "Kaynak seçimini bina ve saha koşuluna göre yapın", phase7Lines(
      "Fotovoltaik, güneş ısıl, ısı pompası, uygun koşullarda bina ölçeğinde rüzgâr ve diğer sistemler aynı fiziksel çıktıyı üretmez. Elektrik, ısı veya çevresel enerji katkısı BEP-TR'de ilgili yöntemle modellenmelidir.",
      "25 Nisan 2025 hesap yöntemi değişikliği sonrasında Bakanlık bina ölçeğinde rüzgâr enerji sistemlerinin de EKB hesabına dahil edilebildiğini açıkladı.",
      "Teknoloji seçimi yalnız yıllık kWh tahminiyle değil, gölgelenme, bakım, inverter/ekipman yeri, yangın, taşıyıcı kapasite ve şebeke bağlantısıyla koordine edilmelidir."
    )),
    section("boyut", "Boyutlandırmayı çatı alanından başlayıp gerçek üretim modeline taşıyın", phase7Lines(
      "Ön fizibilitede kullanılabilir çatı/cephe alanı, yönelim, gölgelenme ve ekipman yerleşimi belirlenir. Sonra sistem kayıpları ve yerel iklim verisiyle yıllık üretim hesabı yapılır.",
      "Örnek yöntem: 40 kWp PV sistemi için yıllık özgül üretim `1.350 kWh/kWp-yıl` varsayılırsa brüt yıllık üretim yaklaşık `54.000 kWh/yıl` olur. Bu yalnız fizibilite örneğidir; resmî BEP-TR girdisi ve gerçek proje üretim analizi yerine geçmez.",
      "Öz tüketim, şebekeye aktarım ve bina yük profili finansal değerlendirmede ayrıca ele alınmalıdır."
    )),
    section("mevzuat", "Mevzuat eşiğini kaynak ve tarih ile kayıt altına alın", phase7Lines(
      "Yenilenebilir enerji yükümlülüğü için kullanılan alan eşiği ve oran, projenin ruhsat tarihindeki konsolide yönetmelikten teyit edilmelidir. Bu değerler zaman içinde değiştiğinden içerikte tek bir 'sonsuz geçerli' sayı olarak sunulmamalıdır.",
      "Web aracı sonuç ekranında kullanılan yönetmelik sürümü ve kontrol tarihi görünür olmalı; kural veri tabanında sürümlenmelidir.",
      "BEP-TR veya EKB başarısı, diğer elektrik üretim/bağlantı mevzuatının sağlandığı anlamına gelmez."
    )),
    section("koordinasyon", "Mimari, statik, elektrik ve yangın koordinasyonunu erken yapın", phase7Lines(
      "Çatı PV yerleşimi parapet, kaçış, yangın erişimi, drenaj, mekanik cihazlar ve bakım koridorlarıyla çakışabilir. Taşıyıcı sistemde ilave sabit yük ve rüzgâr etkileri; elektrik projesinde DC/AC güzergâh, koruma ve pano yerleri değerlendirilmelidir.",
      "Isı pompasında dış ünite yerleşimi, akustik, elektrik gücü ve düşük dış sıcaklık performansı; güneş ısılda depo ve tesisat hacmi proje girdisidir.",
      "Enerji hedefi diğer disiplinlerin güvenlik gerekliliklerini ezmemelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Ruhsat tarihindeki konsolide BEP Yönetmeliği üzerinden yenilenebilir kapsamı doğrulandı mı?",
      "- [ ] Eski alan/yüzde eşikleri otomatik kullanılmadı mı?",
      "- [ ] Önce kabuk ve sistem verimliliği optimize edildi mi?",
      "- [ ] Seçilen yenilenebilir teknoloji BEP-TR'de doğru yöntemle modelleniyor mu?",
      "- [ ] Üretim tahmini yerel iklim, yönelim, gölge ve sistem kayıplarını içeriyor mu?",
      "- [ ] Statik, yangın, elektrik ve bakım erişimi koordinasyonu yapıldı mı?",
      "- [ ] Web/hesap aracında mevzuat sürümü ve kontrol tarihi görünür mü?"
    )),
  ],
  references: bepPhase7References("yenilenebilir enerji kapsamı, BEP-TR ve EKB"),
  keywords: ["yenilenebilir enerji", "BEP-TR", "EKB", "PV", "ısı pompası", "ruhsat tarihi"],
  tags: ["BEP", "Yenilenebilir Enerji", "BEP-TR", "PV", "Enerji"],
};

const LCC: DepremPhase7Override = {
  slug: "bep-ilk-yatirim-ve-yasam-dongusu-maliyet-analizi",
  title: "İlk Yatırım, Yaşam Döngüsü Maliyeti ve 2026 Bina Yaşam Döngüsü Analizi",
  description: "Finansal yaşam döngüsü maliyetini NPV/LCC yaklaşımıyla; 2026'da getirilen sera gazı odaklı Bina Yaşam Döngüsü Analizi Belgesinden açıkça ayırır.",
  seoTitle: "Bina Yaşam Döngüsü Maliyeti LCC | 2026 Yaşam Döngüsü Analizi",
  seoDescription: "İlk yatırım, enerji-bakım-yenileme maliyetleri, NPV/LCC ile 1 Ocak 2027 ve 10.000 m² Bina Yaşam Döngüsü Analizi Belgesi farkı.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "16 dk okuma",
  relatedSlugs: ["bep-enerji-kimlik-belgesi-siniflari-asgari", "bep-yenilenebilir-enerji-zorunlulugu-ve-oranlari", "bep-isi-yalitim-katmanlari-u-degeri-hesabi"],
  sections: [
    section("iki-kavram", "LCC ile 2026 düzenlemesindeki Yaşam Döngüsü Analizi aynı belge değildir", phase7Lines(
      "**Yaşam döngüsü maliyeti (LCC)**; ilk yatırım, enerji, bakım, yenileme ve ekonomik ömür sonu maliyetlerini bugünkü değere indirerek seçenekleri finansal açıdan karşılaştırır. **Bina Yaşam Döngüsü Analizi** ise 2026 düzenlemesinde binanın yaşam döngüsü boyunca sera gazı emisyonlarını hesaplayan çevresel analizdir.",
      "ÇŞİDB'nin 16 Mayıs 2026 açıklamasına göre **1 Ocak 2027** tarihinden itibaren yapı ruhsatı alacak, yapı inşaat alanı **10.000 m² ve üzeri** yeni binalarda yapı kullanma izin aşamasında EKB ile birlikte Bina Yaşam Döngüsü Analizi Belgesi sunulacak.",
      "Yanlış yaklaşım, 'yaşam döngüsü' kelimesi ortak diye maliyet tablosunu resmî karbon analiz belgesi yerine kullanmaktır."
    )),
    section("lcc", "Finansal LCC: seçenekleri aynı analiz dönemi ve iskonto mantığında karşılaştırın", phase7Lines(
      "Basit finansal modelde `LCC = C0 + Σ(C_t / (1+r)^t) - S_n/(1+r)^n` biçiminde ilk yatırım `C0`, dönemsel maliyetler `C_t`, iskonto oranı `r` ve dönem sonu değer `S_n` izlenebilir.",
      "Örnek: A seçeneği 100 birim daha pahalı fakat yılda 15 birim tasarruf sağlıyorsa basit geri ödeme yaklaşık `100/15 = 6,7 yıl` olur. Ancak LCC hesabı enerji fiyat artışı, bakım, yenileme ve iskonto etkisini de dikkate alır; basit geri ödeme LCC değildir.",
      "| Maliyet grubu | Örnek |\n|---|---|\n| İlk yatırım | yalıtım, cihaz, PV |\n| İşletme | enerji, su |\n| Bakım/yenileme | servis, ekipman değişimi |\n| Dönem sonu | söküm / artık değer |"
    )),
    section("lca", "2026 Bina Yaşam Döngüsü Analizi: emisyon zincirini bütün yaşam evrelerine yayar", phase7Lines(
      "Bakanlık açıklamasına göre analiz; ham madde temini ve nakliye, inşaat, kullanım/işletme, bakım-onarım, değişim-yenileme, yıkım, atık işleme/bertaraf ve varsa yeniden kullanım, geri kazanım ile enerji ihracı süreçlerini kapsayan sera gazı emisyonlarını değerlendirecek.",
      "Analizlerin **BEP-TR** üzerinden yürütüleceği ve belgenin yetkili Enerji Kimlik Belgesi Uzmanları tarafından hazırlanacağı açıklandı.",
      "Bu çevresel çıktı para birimiyle değil sera gazı etkisiyle ilgilidir; LCC ile yan yana karar desteği olarak kullanılabilir ancak birbirinin yerine geçmez."
    )),
    section("dusuk-karbon", "Düşük Karbonlu Bina Belgesi için enerji ve emisyon sınıflarını birlikte okuyun", phase7Lines(
      "2026 Bakanlık açıklaması, Düşük Karbonlu Bina Belgesi için EKB sera gazı emisyon sınıfının en az **B**, enerji performans sınıfının en az **C** olması koşulunu duyurdu.",
      "Bu hedef, yalnız malzeme gömülü karbonunu veya yalnız işletme enerjisini optimize etmenin yeterli olmadığını gösterir. Bina kabuğu, sistemler, enerji kaynağı ve malzeme kararları birlikte değerlendirilmelidir.",
      "Belge kapsamı ve uygulama tarihi proje tarihinde yürürlükteki resmî metin üzerinden tekrar doğrulanmalıdır."
    )),
    section("karar-matrisi", "Maliyeti ve karbonu aynı tabloda görünür kılın, tek puana gizlemeyin", phase7Lines(
      "Seçenek karşılaştırmasında ilk yatırım, 30 yıllık NPV, yıllık enerji, bakım sıklığı ve yaşam döngüsü sera gazı göstergeleri ayrı sütunlar halinde tutulabilir. Böylece pahalı fakat düşük işletme maliyetli veya düşük karbonlu seçenekler görünür olur.",
      "Karar ağırlıkları işveren hedefi ve mevzuat zorunluluklarına göre belirlenir. Mevzuat asgari koşulu maliyet optimizasyonuyla aşağı çekilemez.",
      "Mühendislik önerisi, kullanılan fiyat yılı, iskonto varsayımı ve enerji senaryosunu açıkça yazmalıdır."
    )),
    section("veri", "Girdi kalitesi sonucu belirler: ürün EPD'si, miktar ve enerji modeli izlenebilir olmalı", phase7Lines(
      "LCC için keşif miktarı, teklif/poz fiyatı, bakım periyodu ve enerji tüketimi; yaşam döngüsü emisyonu için ürün/malzeme miktarı, taşıma ve enerji verileri gerekir. Eksik veri varsayımla tamamlanıyorsa bu durum sonuçla birlikte raporlanmalıdır.",
      "BIM/metraj, BEP-TR ve maliyet verisini ortak eleman kimlikleriyle bağlamak ileride güncelleme maliyetini düşürür.",
      "Tek bir 'm² başına maliyet' veya 'm² başına karbon' değeri ayrıntılı proje analizinin yerine konmamalıdır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Finansal LCC ile çevresel Bina Yaşam Döngüsü Analizi birbirinden ayrıldı mı?",
      "- [ ] LCC analiz dönemi, iskonto oranı ve fiyat yılı açıkça yazıldı mı?",
      "- [ ] İlk yatırım dışında enerji, bakım, yenileme ve dönem sonu maliyetleri eklendi mi?",
      "- [ ] 1 Ocak 2027 ve 10.000 m² kapsamı proje tarihi için resmî metinden doğrulandı mı?",
      "- [ ] Yaşam döngüsü sera gazı analizi BEP-TR/yetkili uzman süreciyle ilişkilendirildi mi?",
      "- [ ] Düşük Karbonlu Bina Belgesi için B emisyon / C enerji koşulları doğru bağlamda kullanıldı mı?",
      "- [ ] Tüm önemli varsayımların kaynağı ve sürümü kayıt altına alındı mı?"
    )),
  ],
  references: bepPhase7References("LCC, Bina Yaşam Döngüsü Analizi ve Düşük Karbonlu Bina Belgesi"),
  keywords: ["LCC", "yaşam döngüsü maliyeti", "Bina Yaşam Döngüsü Analizi", "10.000 m²", "1 Ocak 2027", "Düşük Karbonlu Bina"],
  tags: ["BEP", "LCC", "Yaşam Döngüsü", "Düşük Karbon", "BEP-TR"],
};

export const DEPREM_PHASE7_BATCH_1_ARTICLES = [U_VALUE, THERMAL_BRIDGE, CLIMATE, EKB, RENEWABLE, LCC] as const;
