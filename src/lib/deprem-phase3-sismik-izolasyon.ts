import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_SISMIK_IZOLASYON: DepremPhase3Override = {
  slug: "tbdy-2018-sismik-izolasyon",
  description: "TBDY 2018 Bölüm 14'e göre deprem yalıtımlı binalarda yalıtım sistemi özellikleri, analiz yöntemi seçim koşulları, DD-1/DD-2 deplasman talepleri, modal alt sınırlar ve zaman tanım alanı doğrulamasını açıklar.",
  seoTitle: "TBDY 2018 Deprem Yalıtımı | Bölüm 14 Analiz ve Kontrol Rehberi",
  seoDescription: "Deprem yalıtımlı binalar için TBDY Bölüm 14: eşdeğer deprem yükü koşulları, modal analiz, zaman tanım alanı, %80/%90 alt sınırlar ve 11 kayıt çifti.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "deprem-yalitimi-sistem-karari",
      title: "Bölüm 14: Deprem yalıtımı yalnız izolatör seçimi değil, yalıtım arayüzü ile alt ve üst yapının birlikte tasarımıdır",
      content: phase3Lines(
        "TBDY'nin resmî terminolojisi **Deprem Yalıtımlı Binalar**dır. Bölüm 14, yalıtım birimlerinin mekanik özelliklerinden analiz yöntemine, yalıtım arayüzündeki deplasman boşluğundan alt/üst yapı kuvvetlerine ve uygulama sonrası denetime kadar bütün sistemi birlikte ele alır.",
        "",
        "| Tasarım katmanı | Kritik karar | Yönetmelik bağlantısı |",
        "|---|---|---|",
        "| Yalıtım sistemi | Etkin rijitlik, etkin sönüm, alt/üst sınır özellikleri | Bölüm 14 genel hükümler |",
        "| Kullanılabilirlik ve dayanıklılık | Rüzgâr, yangın, yaşlanma ve çevresel etkiler | 14.6 |",
        "| Analiz yöntemi | Eşdeğer yük / modal / zaman tanım alanı | 14.14.1 |",
        "| Deplasman ve kuvvet | DD-2 tasarım ve DD-1 maksimum talepler | 14.14 |",
        "| Uygulama sonrası | Uygunluk, gözlem ve bakım | 14.7 |",
        "",
        "> [!warning] İzolatör eklemek modeli otomatik olarak güvenli yapmaz",
        "> Yalıtım periyodu uzatılırken arayüz deplasmanı büyüyebilir. Üst yapı kuvvetlerinin azalması, yalıtım katındaki deplasman kapasitesi ve çevresel boşluk kontrolünün yerine geçmez."
      ),
      subsections: [],
    },
    {
      id: "ruzgar-yangin-zaman-etkisi",
      title: "14.6–14.7: Rüzgâr, yangın, özellik değişimi ve kullanım ömrü boyunca denetim tasarımın parçasıdır",
      content: phase3Lines(
        "14.6 kapsamında rüzgâr etkisi altında yalıtım arayüzündeki göreli yerdeğiştirme, DD-2 için izin verilen göreli kat ötelenmesi sınırıyla uyumlu olmalıdır. Gerektiğinde yalnız rüzgâr etkisi altında çalışan kilitleme mekanizmaları kullanılabilir. Yalıtım sisteminin yangına dayanım süresi, diğer düşey yük taşıyan elemanların yangın dayanımıyla uyumlu olmalıdır.",
        "",
        "Üretim, montaj, çevre, sıcaklık, yaşlanma ve benzeri etkilerin mekanik özellikleri zaman içinde değiştirebileceği tasarımda hesaba katılır. 14.7 ise montaj sonrası saha uygunluk incelemesi ile kullanım süresince izleme, inceleme ve bakımın sürdürülmesini ister.",
        "",
        "> [!engineering] Tasarım raporuna bakım senaryosu ekleyin",
        "> İzolatöre fiziksel erişim, korozyon/yangın koruması, çevresel boşluğun sonradan kapatılmaması ve periyodik inceleme koşulları uygulama paftası ile işletme dokümanında birlikte tanımlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "analiz-yontemi-secimi",
      title: "14.14.1: Eşdeğer deprem yükü, modal ve zaman tanım alanı yöntemlerinin izin koşulları farklıdır",
      content: phase3Lines(
        "Deprem yalıtımlı bir binada en basit yöntemi doğrudan seçmek mümkün değildir. 14.14.1, üç analiz yolunu ayrı koşullarla tanımlar.",
        "",
        "| Yöntem | Kullanım çerçevesi |",
        "|---|---|",
        "| Etkin/Eşdeğer Deprem Yükü Yöntemi | **14.14.1.1**'deki tüm geometrik, zemin, periyot, sönüm ve düzensizlik koşulları birlikte sağlanmalı |",
        "| Mod Birleştirme Yöntemi | 14.14.1.2'de belirtilen temel zemin/periyot/çekme koşulları sağlanmalı |",
        "| Zaman Tanım Alanında Doğrusal Olmayan Hesap | **14.14.1.3** uyarınca bütün deprem yalıtımlı binalarda kullanılabilir |",
        "",
        "> [!check] Yöntem seçimini raporlayın",
        "> Seçilen yöntemin yalnız adını değil, kullanılmasına izin veren her koşulun proje değeri ve madde numarasıyla sağlandığını gösterin."
      ),
      subsections: [],
    },
    {
      id: "esdeger-yuk-kosullari",
      title: "14.14.1.1: Eşdeğer deprem yükü yönteminin kullanılabilmesi için yedi temel koşulun tamamı sağlanmalıdır",
      content: phase3Lines(
        "Etkin/Eşdeğer Deprem Yükü Yöntemi için yönetmelik kapsamı dar tutulmuştur. Proje aynı anda şu koşulları sağlamalıdır:",
        "",
        "- Yerel zemin sınıfı **ZA, ZB, ZC veya ZD** olmalıdır.",
        "- DD-1 düzeyindeki etkin periyot **4.0 saniye**'den küçük olmalıdır.",
        "- Yalıtım arayüzü üzerindeki kat sayısı **en fazla 4**, toplam bina yüksekliği **20 metre** veya daha az olmalıdır.",
        "- Yalıtım birimlerinde yönetmelikte tariflenen çekme/kalkma durumu oluşmamalıdır.",
        "- Etkin sönüm oranı **%30**'dan küçük olmalıdır.",
        "- Her katta burulma düzensizliği **ηbi < 2.0** olmalı ve **B2** düzensizliği bulunmamalıdır.",
        "- Düşey doğrultudaki doğal titreşim periyodu **Tv ≤ 0.1 s** olmalıdır.",
        "",
        "> [!warning] Tek bir koşulun aşılması yöntem değiştirir",
        "> Örneğin kat sayısı beşe çıktığında veya etkin sönüm %30 sınırını aştığında diğer koşullar sağlansa bile 14.14.1.1 yöntemi otomatik olarak geçerli kalmaz."
      ),
      subsections: [],
    },
    {
      id: "dd1-dd2-deplasman",
      title: "DD-2 tasarım deplasmanı ile DD-1 maksimum deplasman aynı kontrol değildir; yalıtım boşluğu en olumsuz talebe göre doğrulanır",
      content: phase3Lines(
        "Bölüm 14.14, yalıtım sisteminin DD-2 düzeyindeki tasarım yerdeğiştirmesi ile DD-1 düzeyindeki maksimum yerdeğiştirmesini farklı performans amaçları için tanımlar. Yönetmelikte bunlar sırasıyla tasarım deplasmanı **DD** ve maksimum deplasman **DM** büyüklükleriyle ifade edilir.",
        "",
        "Etkin sönümün spektral talebe etkisi yönetmelikte `η = √(10 / (5 + ξ))` biçimindeki sönüm ölçekleme ilişkisiyle ele alınır. Ancak yüksek sönüm oranı, yöntem uygunluğu ve analiz alt sınırları için ayrıca sınırlandırılmıştır; tek başına kuvvet azaltma aracı gibi kullanılmamalıdır.",
        "",
        "> [!engineering] Mimari boşluk statik sonuçtur",
        "> Yalıtım derzi, tesisat esnek bağlantıları, merdiven/asansör detayları ve cephe birleşimleri DM talebiyle çakışmayacak serbest hareket kapasitesine sahip olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "modal-alt-sinirlar",
      title: "14.14.3: Modal analiz sonuçları referans çözümün belirli yüzdelerinin altına indirilemez",
      content: phase3Lines(
        "Mod Birleştirme Yöntemi kullanıldığında hesaplanan yalıtım sistemi yerdeğiştirmeleri ve ilgili tasarım kuvvetleri mutlak olarak serbest bırakılmaz. 14.14.3.3–14.14.3.4 kapsamında, yönetmelikte tanımlanan düzensizliklerin bulunmadığı durumda sonuçlar referans değerlerin **%80**'inden; A1, B2 veya B3 düzensizliklerinin bulunduğu durumda ise **%90**'ından daha küçük alınamaz.",
        "",
        "Modal çözümde kullanılan etkin sönüm oranının da **%30** üst sınırı vardır. Bu alt sınırlar, ayrıntılı modal modelin basit referans çözümden fiziksel olarak aşırı düşük talep üretmesini engelleyen kalibrasyon kapılarıdır.",
        "",
        "> [!check] Ölçekleme görünür olsun",
        "> Ham modal sonuç ile %80/%90 alt sınırı sonrası tasarım değerini raporda ayrı sütunlarda gösterin; hangi düzensizliğin %90 sınırını tetiklediği açık olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "zaman-tanim-alani",
      title: "14.14.4: Zaman tanım alanında doğrusal olmayan çözüm kayıt takımı, yön ve alt sınır kontrolleriyle birlikte yürütülür",
      content: phase3Lines(
        "14.14.4 kapsamında zaman tanım alanında doğrusal olmayan analiz, yalıtım sisteminin gerçek doğrusal olmayan kuvvet-deplasman davranışını modele taşır. İlgili her deprem yer hareketi düzeyi ve doğrultusu için **en az onbir kayıt çifti** kullanılır; tasarım değerleri maksimum cevapların yönetmelikte tanımlanan istatistiksel işlemiyle elde edilir.",
        "",
        "Düşey titreşim periyodu için yönetmelik koşulu sağlanmıyorsa iki yatay bileşene ek olarak düşey deprem bileşeni de hesaba katılır. Zaman tanım alanı sonuçları da 14.14.4'teki referans alt sınır kontrollerinden bağımsız değildir; örneğin ilgili deplasman talepleri **%80** alt sınırıyla denetlenir.",
        "",
        "> [!engineering] İzolatör modeli kayıt kadar önemlidir",
        "> Alt/üst sınır mekanik özellikleri, çevrimsel davranış, hız/sıcaklık etkileri ve üretici test verileri doğrulanmadan çok sayıda kayıt çalıştırmak güvenilir sonuç üretmez."
      ),
      subsections: [],
    },
    {
      id: "uygulama-denetim",
      title: "Tasarımın son adımı analiz değil, yalıtım arayüzünün uygulanabilirliği ve kullanım süresince korunmasıdır",
      content: phase3Lines(
        "Deprem yalıtım sisteminde hesap sonucu ile saha detayı arasında doğrudan bağ kurulmalıdır. Yalıtım biriminin yönü, bağlantı plakaları, ankrajlar, çevresel hareket boşluğu, tesisat geçişleri ve erişim alanları uygulama projesinde gösterilmelidir.",
        "",
        "14.7 kapsamında montaj sonrasında uygunluk incelemesi yapılması ve sistemin kullanım süresince izlenmesi/bakımının sürdürülmesi, deprem yalıtımını tek seferlik ürün kabulünden ayırır.",
        "",
        "> [!check] Teslim dosyası",
        "> Tasarım değerleri, prototip/üretim testleri, seri numaraları, montaj tutanakları, fotoğraflar ve bakım planını aynı izlenebilir dosyada birleştirin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Yalıtım sistemi için alt/üst sınır mekanik özellikleri ve zaman/çevre etkileri tanımlandı mı?",
        "- Rüzgâr, yangın ve kullanım ömrü kontrolleri 14.6–14.7 ile uyumlu mu?",
        "- Eşdeğer deprem yükü yöntemi seçildiyse **14.14.1.1** kapsamındaki **ZA, ZB, ZC veya ZD**, **4.0 saniye**, **en fazla 4 kat**, **20 metre**, **%30**, **ηbi < 2.0**, **B2 yok** ve **Tv ≤ 0.1 s** koşullarının tamamı sağlanıyor mu?",
        "- Modal yöntem kullanılıyorsa 14.14.1.2 uygunluk şartları ve **%80 / %90** alt sınırları uygulandı mı?",
        "- Zaman tanım alanında çözüm kullanılıyorsa **14.14.1.3** ve 14.14.4 hükümlerine göre en az onbir kayıt çifti ve gerekli bileşenler tanımlandı mı?",
        "- DD-2 tasarım deplasmanı DD ile DD-1 maksimum deplasmanı DM ayrı raporlandı mı?",
        "- Yalıtım boşluğu, tesisat bağlantıları ve mimari detaylar maksimum hareket kapasitesiyle uyumlu mu?",
        "- Montaj sonrası saha uygunluk incelemesi ve uzun dönem bakım/izleme planı proje teslimine dahil mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 14; özellikle Madde 14.6, 14.7 ve 14.14"),
  keywords: ["TBDY 2018", "deprem yalıtımı", "sismik izolasyon", "Bölüm 14", "izolatör", "yalıtım deplasmanı", "zaman tanım alanı"],
  tags: ["TBDY 2018", "Deprem Yalıtımı", "Bölüm 14", "Sismik İzolasyon"],
};
