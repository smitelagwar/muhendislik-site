import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_DONATI_KOROZYON: DepremPhase4Override = {
  slug: "mevcut-bina-donati-tespiti-korozyon",
  description: "TBDY Bölüm 15'e göre mevcut betonarme binalarda donatı sıyırma, donatı tespit cihazı, donatı gerçekleşme katsayısı, çelik sınıfı ve korozyonun kapasite hesabına aktarılmasını açıklar.",
  seoTitle: "Mevcut Binada Donatı Tespiti, Sıyırma ve Korozyon | TBDY Bölüm 15",
  seoDescription: "TBDY 15.2.4.2, 15.2.5.2 ve malzeme hükümlerine göre donatı sıyırma oranları, cihaz ölçümleri, donatı gerçekleşme katsayısı ve korozyon değerlendirmesi.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "amac",
      title: "Donatı tespiti yalnız cihazla çap okumak değildir",
      content: phase4Lines(
        "TBDY Bölüm 15'te mevcut betonarme elemanların donatı bilgisi; **beton örtüsü sıyırma**, donatı tespit cihazı ölçümleri, varsa proje ile karşılaştırma ve malzeme incelemesinin birlikte değerlendirilmesiyle oluşturulur. Amaç yalnız boyuna donatı adedini bulmak değil, eleman kapasitesine girecek olası donatı miktarını ve çelik özelliklerini güvenilir biçimde belirlemektir.",
        "",
        "Sınırlı ve kapsamlı bilgi düzeylerinde tespit oranları farklıdır. Bu nedenle saha ekibi işe başlamadan önce bilgi düzeyi, proje/uygulama çizimlerinin varlığı ve eleman envanteri kesinleştirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "sinirli-bilgi",
      title: "Sınırlı bilgi düzeyinde sıyırma ve cihaz oranları",
      content: phase4Lines(
        "TBDY 15.2.4.2'ye göre betonarme elemanlardaki donatı miktarı ve detaylarının yapım tarihindeki minimum donatı koşullarını sağladığı varsayılır; bu varsayım saha tespitleriyle doğrulanır veya gerçekleşme oranı belirlenir.",
        "",
        "| Kontrol | Sınırlı bilgi düzeyi |",
        "|---|---|",
        "| Perde ve kolon sıyırma | Her katta en az birer adet olmak üzere perde ve kolonların **%5'i** |",
        "| Kiriş sıyırma | **Her kattan 1 adet kiriş** |",
        "| Sıyırma yeri | Kolon ve kiriş uzunluğunun açıklık ortasındaki **üçte birlik bölümü** |",
        "| Sıyırılmayan perde/kolonlarda cihaz | **%20**'sinde enine ve boyuna donatı sayısı/yerleşimi |",
        "| Sıyırma sonrası | Yüksek dayanımlı tamir harcı ile kapatma |"
      ),
      subsections: [],
    },
    {
      id: "sinirli-gerceklesme",
      title: "Donatı gerçekleşme katsayısı 1.00'i aşamaz",
      content: phase4Lines(
        "Sınırlı bilgi düzeyinde donatı tespiti yapılan perde ve kolonlarda bulunan mevcut donatının minimum donatıya oranı **donatı gerçekleşme katsayısı** olarak belirlenir. Perde ve kolon kapasitesinde kullanılan bu katsayı 1'den büyük alınamaz ve tespit yapılmayan diğer perde/kolonlara uygulanarak olası donatı miktarı belirlenir.",
        "",
        "Kirişler için ise 15.2.4.2, yalnız düşey tasarım yükleri altında gerekli olan donatının kullanılacağını belirtir. Bu nedenle sınırlı bilgi düzeyinde birkaç kiriş sıyırmasını tüm kiriş donatı düzenini temsil eden doğrudan bir envanter gibi kullanmak doğru değildir."
      ),
      subsections: [],
    },
    {
      id: "kapsamli-projeli",
      title: "Kapsamlı bilgi düzeyi — betonarme detay projesi mevcutsa",
      content: phase4Lines(
        "TBDY 15.2.5.2'ye göre betonarme detay projeleri mevcutsa donatının projeye uygunluğu için 15.2.4.2'deki sıyırma işlemleri aynı miktardaki elemanda uygulanır. Buna ek olarak beton örtüsü sıyrılmayan **perde ve kolonların %20'sinde**, **çerçeve kirişlerinin %10'unda** enine ve boyuna donatı sayısı ve yerleşimi cihazla belirlenir.",
        "",
        "Proje ile uygulama arasında uyumsuzluk varsa donatı gerçekleşme katsayısı **perde, kolon ve kirişler için ayrı ayrı** belirlenir. Bu katsayı yine 1'den büyük olamaz ve tespit yapılmayan ilgili elemanlara uygulanır."
      ),
      subsections: [],
    },
    {
      id: "kapsamli-projesiz",
      title: "Kapsamlı bilgi düzeyi — proje veya uygulama çizimi yoksa",
      content: phase4Lines(
        "Betonarme projeler veya inşaat/uygulama çizimleri mevcut değilse 15.2.5.2 daha geniş bir saha tespiti ister:",
        "",
        "- Her katta en az **ikişer adet** olmak üzere kolon ve perdelerin **%10'u** sıyrılır.",
        "- Sıyırılmayan kolon ve perdelerin **%30'unda** donatı tespit cihazı kullanılır.",
        "- Kirişlerin **%15'inde** enine ve boyuna donatı sayısı ve yerleşimi cihazla belirlenir.",
        "- Sıyrılan yüzeyler yüksek dayanımlı tamir harcı ile kapatılır.",
        "",
        "Bu oranlar eleman sayısı üzerinden planlanmalı; yalnız kolay erişilen tek katta yoğunlaştırılan ölçüm programı yönetmelikteki kat dağılımını karşılamaz."
      ),
      subsections: [],
    },
    {
      id: "celik-sinifi",
      title: "Çelik sınıfı bilgi düzeyine göre farklı güven düzeyinde belirlenir",
      content: phase4Lines(
        "Sınırlı bilgi düzeyinde 15.2.4.3, donatı sınıfının sıyrılan yüzeylerde **görsel inceleme** ile tespit edilmesini ve bu sınıftaki çeliğin karakteristik akma gerilmesinin mevcut çelik dayanımı olarak alınmasını öngörür.",
        "",
        "Kapsamlı bilgi düzeyinde 15.2.5.3 daha ileri bir doğrulama ister: sıyrılan yüzeylerde sınıf tespit edilir ve her çelik sınıfı için birer örnek deneyle akma gerilmesi, kopma dayanımı ve şekildeğiştirme özellikleri belirlenir. Projeye uygunsa projedeki karakteristik akma gerilmesi kullanılır; uygun değilse en az üç örnek daha alınır ve elde edilen **en elverişsiz akma gerilmesi** kapasite hesabında mevcut çelik akma gerilmesi kabul edilir."
      ),
      subsections: [],
    },
    {
      id: "korozyon",
      title: "Korozyon gözlemi rapor notu değil kapasite girdisidir",
      content: phase4Lines(
        "TBDY hem sınırlı hem kapsamlı bilgi düzeyi için, donatısında korozyon gözlenen elemanların **planda işaretlenmesini** ve bu durumun **eleman kapasite hesaplarında dikkate alınmasını** ister. Dolayısıyla 'pas görüldü' biçimindeki fotoğraf notu tek başına yeterli değildir.",
        "",
        "Saha kaydında korozyonun eleman kimliği, konumu ve yaygınlığı izlenebilir olmalı; mühendislik modelinde kesit/donatı kaybı veya aderans/kenetlenme etkisi için kullanılan kabul ayrıca belgelenmelidir. TBDY 15.4.13 ayrıca kenetlenme veya bindirme boyu yetersizliğinde ilgili donatının akma gerilmesinin eksiklik oranında azaltılmasını ister."
      ),
      subsections: [],
    },
    {
      id: "saha-akisi",
      title: "Saha ekibi için izlenebilir ölçüm akışı",
      content: phase4Lines(
        "1. Bilgi düzeyini ve proje/uygulama çizimi durumunu kesinleştirin.",
        "2. Kat ve eleman bazında gerekli sıyırma + cihaz adetlerini hesaplayın.",
        "3. Tespit noktalarını rölöve üzerinde kat–aks–eleman koduyla numaralandırın.",
        "4. Boyuna ve enine donatıyı, çap/adet/aralık/yön bilgileriyle ayrı kaydedin.",
        "5. Sıyırma sonuçları ile cihaz ölçümlerini karşılaştırarak cihaz yorumunu kalibre edin.",
        "6. Proje ile uygulama uyumsuzluğunda eleman türüne uygun donatı gerçekleşme katsayısını belirleyin.",
        "7. Çelik sınıfı ve gerekiyorsa deney sonuçlarını eleman kapasitesi girdisine bağlayın.",
        "8. Korozyon ve kenetlenme/bindirme yetersizliğini yalnız fotoğraf eki olarak bırakmayıp kapasite kabulüne yansıtın."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Sınırlı/kapsamlı bilgi düzeyi saha programından önce belirlendi mi?",
        "- Sınırlı düzeyde %5 sıyırma, her katta kiriş sıyırma ve %20 cihaz kontrolü sağlandı mı?",
        "- Kapsamlı düzeyde proje var/yok ayrımına göre doğru oranlar kullanıldı mı?",
        "- Donatı gerçekleşme katsayısı 1.00'i aşmadan doğru eleman grubuna uygulandı mı?",
        "- Sıyırma konumu 15.2.4.2'de tarif edilen bölgeyle uyumlu mu?",
        "- Çelik sınıfı ve gereken deneyler bilgi düzeyine uygun biçimde doğrulandı mı?",
        "- Korozyonlu elemanlar plan üzerinde işaretlendi ve kapasite hesabına yansıtıldı mı?",
        "- Tüm tespitler kat–aks–eleman koduyla rölöve ve hesap modeliyle eşleşiyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.2.4.2–15.2.5.3 ve 15.4.13 — donatı tespiti, çelik sınıfı, korozyon ve kapasite"),
  keywords: ["donatı tespiti", "donatı sıyırma", "korozyon", "donatı gerçekleşme katsayısı", "TBDY 15.2.4.2", "TBDY 15.2.5.2"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Donatı", "Korozyon", "Saha İncelemesi"],
};
