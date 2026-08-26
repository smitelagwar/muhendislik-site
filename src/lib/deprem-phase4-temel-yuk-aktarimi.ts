import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_TEMEL_YUK_AKTARIMI: DepremPhase4Override = {
  slug: "guclendirme-temel-sistemi-yuk-aktarimi",
  description: "Güçlendirme sonrası değişen üstyapı tepkilerinin mevcut temele ve zemine aktarılmasını; TBDY 15.9.3.2, 15.10.5 ile Bölüm 16.7–16.8'in taşıma gücü, kayma ve birlikte çalışma hükümleri üzerinden açıklar.",
  seoTitle: "Güçlendirmede Temel Sistemi ve Yük Aktarımı | TBDY 16.7–16.8",
  seoDescription: "Güçlendirme sonrası temel tepkileri, mevcut temel doğrulaması, yeni-eski temel birlikte çalışması, Et ≤ Rt, taşıma gücü ve yatay kayma kontrolleri için mühendislik rehberi.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "sistem-yuk-yolu",
      title: "Güçlendirme temelde biter; yeni kuvvet yolu zemine kadar izlenmelidir",
      content: phase4Lines(
        "TBDY 15.9.3.2, binaya yeni eleman eklenmesini, birleşim bölgelerinin güçlendirilmesini ve iç kuvvet dağılımında süreklilik sağlanmasını **sistem güçlendirmesi** kapsamında tanımlar. Bu nedenle perde ekleme, kolon kesiti büyütme veya dış çerçeve ekleme kararı yalnız üstyapı eleman kapasitesiyle tamamlanmış sayılmaz.",
        "",
        "Her müdahale önce/sonra modelde reaksiyon dağılımını değiştirir. Yeni yük yolu; güçlendirilen elemandan döşeme ve birleşimlere, oradan temele ve son olarak zemine kadar kesintisiz izlenmelidir. Temel sisteminin mevcut geometrisi, donatısı ve zeminle temas koşulları bu zincirin taşıyıcı bir parçasıdır.",
        "",
        "Tasarım başlangıcında iki tablo yan yana tutulmalıdır: **güçlendirme öncesi temel tepkileri** ve **güçlendirme sonrası temel tepkileri**. Sadece toplam düşey yük değil; eksenel kuvvet, eğilme momenti, yatay kesme, kaldırma/temas kaybı eğilimi ve reaksiyonların plandaki dağılımı karşılaştırılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "mevcut-temel-dogrulama",
      title: "Mevcut temel geometrisi ve malzemesi sahada doğrulanmadan yeni yük aktarımı kurulmaz",
      content: phase4Lines(
        "Güçlendirme projesinde eski temel paftasının bulunması tek başına yeterli veri değildir. Temel tipi, boyutları, kotu, kolon/perde ile bağlantısı ve erişilebildiği ölçüde donatı düzeni saha bulgularıyla doğrulanmalıdır. Zemin raporu ve yeraltı suyu koşulları da güncel proje kabulleriyle eşleştirilmelidir.",
        "",
        "Özellikle yeni perde temeli mevcut temele bağlanacaksa, 'mevcut temel yeterlidir' kabulü üç ayrı soruya cevap vermelidir: mevcut temel yeni kuvvetleri taşıyabiliyor mu, eski-yeni beton arayüzü bu kuvvetleri aktarabiliyor mu ve zemin tarafındaki taşıma gücü/kayma/oturma kontrolleri yeni reaksiyonlarla sağlanıyor mu?",
        "",
        "Belirsiz temel geometrisini analiz modelinde nominal bir kesitle temsil etmek, sonuç üretir fakat doğrulanmış kapasite üretmez. Belirsizliğin yüksek olduğu bölgeler saha inceleme planına alınmalı ve hesap kabulleri raporda açıkça izlenebilir olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "perde-temeli",
      title: "15.10.5 yeni perde temelini mevcut temel sistemiyle birlikte çalıştırır",
      content: phase4Lines(
        "TBDY 15.10.5, eklenen betonarme perdenin altına 16.7 ve 16.8 esaslarına göre temel yapılmasını; perde tabanındaki iç kuvvetlerin temel zeminine güvenle aktarılmasını ister. Perde temelinde oluşabilecek dışmerkezliği azaltmak için temel komşu kolonları içerecek şekilde genişletilebilir.",
        "",
        "Aynı hüküm, perde temelinin **mevcut temel sistemi ile birlikte çalışması için gerekli önlemlerin** alınmasını da ister. Bu ifade yalnız iki beton kütlesini birbirine değdirmek anlamına gelmez. Eski-yeni beton arayüzü, ankraj/donatı devamı, kesme aktarımı, farklı rijitlikler ve olası farklı oturma mekanizması tasarımın parçasıdır.",
        "",
        "Perde taban kuvvetleri büyüdüğünde temel kalınlığını artırmak tek başına çözüm olmayabilir; kuvvet bileşkesinin konumu, komşu kolonların katkısı, zemin basıncı dağılımı ve mevcut temel sisteminin rijitlik paylaşımı birlikte değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "tasima-gucu-ilkesi",
      title: "16.7.2 taşıma gücü kontrolünü Et ≤ Rt genel koşuluna bağlar",
      content: phase4Lines(
        "TBDY 16.7.2'de yüzeysel ve derin temellerin geoteknik tasarımında **taşıma gücü ilkesi** esas alınır ve genel yeterlilik **Et ≤ Rt** biçiminde ifade edilir. Burada Et statik ve depremi içeren yükleme durumlarına ait tasarım etkisini, Rt ise ilgili göçme mekanizmasına karşı gelen tasarım dayanımını temsil eder.",
        "",
        "Bu eşitsizlik, 'zemin emniyet gerilmesi' adıyla tek bir servis sayısını kullanmaktan farklı bir tasarım çerçevesidir. Güçlendirme sonrası değişen reaksiyonlar, ilgili tasarım etkileri ve dayanımlar aynı tasarım yaklaşımı içinde karşılaştırılmalıdır.",
        "",
        "16.7.3.1'e göre deprem etkisini içeren temel tasarım etkileri, düşey yük etkileriyle birlikte Bölüm 4.10.3'e göre depremde taşıyıcı sistemden temele aktarılan kuvvetler esas alınarak hesaplanır. Bu nedenle üstyapı modelinden temele aktarılan kuvvetlerin hangi tasarım durumuna ait olduğu raporda açık olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "yatay-kayma",
      title: "Temel yatay kesmesi için pasif direnç sınırsız bir yedek kapasite değildir",
      content: phase4Lines(
        "TBDY 16.7.3.3, tasarıma esas yatay kesme kuvvetinin temel tabanı ile zemin arasındaki sürtünme direnciyle birlikte, temel yan yüzünde oluşan pasif toprak basıncının **en çok %30'u** dikkate alınarak karşılanacağını belirtir.",
        "",
        "Güçlendirme ile yeni perde veya çerçeve eklendiğinde yatay temel reaksiyonu çoğu kez artar. Bu durumda kayma kontrolünü yalnız taban sürtünmesine veya hesap dışı kabul edilen tam pasif dirence bırakmak doğru değildir. Temel çevresindeki kazı, dolgu, bodrum geometrisi ve kalıcı olarak mevcut olup olmayacak zemin teması, pasif direncin gerçekten mobilize olabilmesi açısından ayrıca incelenmelidir.",
        "",
        "Üstyapıda daha rijit bir güçlendirme elemanı oluşturup temel-kayma mekanizmasını zayıf bırakmak, göçme mekanizmasını yalnızca başka bir seviyeye taşır."
      ),
      subsections: [],
    },
    {
      id: "yuzeysel-temel",
      title: "16.8 yüzeysel temelde taşıma gücü ve yatayda kaymayı ayrı kontroller olarak ister",
      content: phase4Lines(
        "TBDY 16.8.1.1, tekil, sürekli ve radye yüzeysel temellerde **taşıma gücü** ve **yatayda kaymaya karşı** tasarım dayanımlarının hesaplanarak statik ve depremli yükleme durumlarındaki tasarım etkilerini karşıladığının gösterilmesini ister.",
        "",
        "16.8.1.2 ayrıca depremde aşırı boşluk suyu basıncı artışı oluşabilecek zeminlerde drenajsız dayanım veya boşluk suyu basıncı etkilerinin uygun analiz yaklaşımı içinde dikkate alınmasını öngörür.",
        "",
        "Güçlendirme projesinde temel kontrol tablosu bu nedenle en az şu ayrımı korumalıdır:",
        "",
        "| Kontrol | Ana girdi | Güçlendirme sonrası değişebilen büyüklük |",
        "|---|---|---|",
        "| Düşey taşıma gücü | N–M bileşkesi, temel geometrisi, zemin dayanımı | Yeni perde/kolon reaksiyonları ve dışmerkezlik |",
        "| Yatayda kayma | H, taban sürtünmesi, sınırlı pasif direnç | Artan yatay sistem kuvveti |",
        "| Temas/oturma davranışı | Basınç dağılımı, temel rijitliği, zemin deformasyonu | Reaksiyonların planda yeniden dağılımı |",
        "| Eski-yeni birlikte çalışma | Arayüz kuvvetleri ve bağlantı | Yeni temel parçasının rijitliği ve yük paylaşımı |"
      ),
      subsections: [],
    },
    {
      id: "modelleme",
      title: "Temel modelinde yük paylaşımı bağlantı detayından bağımsız kabul edilemez",
      content: phase4Lines(
        "Yeni temel parçasını mevcut radye veya mütemadi temelle aynı kabuk/çubuk sisteminde monolitik modellemek, sahada gerçekten monolitik davranış sağlandığı kabulünü içerir. Bu kabul; arayüz hazırlığı, ankraj/donatı sürekliliği, kesme aktarımı ve yapım sırası ile uyumlu değilse model gereğinden fazla rijit ve iyimser olur.",
        "",
        "Aynı şekilde zemin yaylarını yeniden dağıtmadan yalnız üstyapı elemanı eklemek, temel reaksiyonlarının ve oturmaların güçlendirme sonrası durumunu doğru temsil etmeyebilir. Zemin modeli, temel geometrisi ve üstyapı rijitliği birlikte güncellenmelidir.",
        "",
        "Kontrol amacıyla en az bir hassasiyet karşılaştırması yapılması yararlıdır: eski-yeni temel bağlantısının daha esnek kabulü veya zemin rijitliği değişiminin temel momentleri ve reaksiyon dağılımı üzerindeki etkisi incelenmelidir."
      ),
      subsections: [],
    },
    {
      id: "hatalar",
      title: "Sık yapılan hatalar ve tasarım aksiyonu",
      content: phase4Lines(
        "| Hata | Bozduğu karar | Tasarım aksiyonu |",
        "|---|---|---|",
        "| Güçlendirme öncesi temel reaksiyonlarını arşivlememek | Müdahalenin yük yolunu ne kadar değiştirdiği görülemez | Önce/sonra N-M-H ve reaksiyon dağılımını aynı tabloda karşılaştır |",
        "| Mevcut temel ölçülerini projeden aynen almak | Gerçek kapasite ve bağlantı belirsiz kalır | Saha doğrulaması ve belirsizlik kaydı oluştur |",
        "| Yeni perde temelini eski temelden bağımsız çözmek | 15.10.5'teki birlikte çalışma şartı kaybolur | Arayüz, ankraj, rijitlik ve oturma uyumunu tasarla |",
        "| Pasif toprak basıncının tamamını kayma direnci saymak | 16.7.3.3 sınırı aşılır | Pasif katkıyı en çok %30 ile sınırla ve gerçek zemin temasını doğrula |",
        "| Sadece düşey taşıma gücünü kontrol etmek | Yatay kayma ve servis davranışı gözden kaçar | 16.8.1.1 kapsamındaki kontrolleri ayrı raporla |"
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Güçlendirme müdahalesi 15.9.3.2 kapsamında tüm kuvvet yolu ile birlikte değerlendirildi mi?",
        "- Güçlendirme öncesi ve sonrası temel N-M-H tepkileri aynı yükleme tanımlarıyla karşılaştırıldı mı?",
        "- Mevcut temel geometrisi, kotu, malzemesi ve bağlantıları sahada doğrulandı mı?",
        "- Perde/çerçeve eklendiyse 15.10.5 kapsamındaki mevcut temel sistemiyle birlikte çalışma detayı çözüldü mü?",
        "- 16.7.2'deki Et ≤ Rt taşıma gücü ilkesi ilgili tasarım durumları için sağlanıyor mu?",
        "- 16.7.3.1'e göre temele aktarılan depremli tasarım kuvvetleri doğru üstyapı modelinden alındı mı?",
        "- 16.7.3.3'e göre yatay kesmede pasif toprak basıncı katkısı en çok %30 ile sınırlandı mı?",
        "- 16.8.1.1 kapsamındaki taşıma gücü ve yatayda kayma kontrolleri ayrı ayrı yapıldı mı?",
        "- Yeraltı suyu/boşluk suyu basıncı koşulları güncel saha verisiyle değerlendirildi mi?",
        "- Eski-yeni temel arayüzü için kuvvet aktarımı, yapım sırası ve olası farklı oturma birlikte kontrol edildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.9.3, 15.10.5 ve 16.7–16.8 — sistem güçlendirmesi, temel tasarım etkileri ve yük aktarımı"),
  keywords: ["temel güçlendirme", "15.9.3.2", "15.10.5", "Et ≤ Rt", "16.7.3.1", "%30", "16.8.1.1", "yatayda kayma", "yük aktarımı"],
  tags: ["Mevcut Bina", "Güçlendirme", "Temel", "TBDY Bölüm 16", "Yük Aktarımı"],
};
