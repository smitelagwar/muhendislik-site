import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_BILGI_DUZEYLERI: DepremPhase4Override = {
  slug: "mevcut-bina-bilgi-duzeyleri",
  description: "TBDY Bölüm 15'te sınırlı ve kapsamlı bilgi düzeylerinin hangi koşullarda seçildiğini, veri toplama kapsamını ve 0.75/1.00 bilgi düzeyi katsayılarının kapasite hesabındaki rolünü açıklar.",
  seoTitle: "TBDY Bölüm 15 Bilgi Düzeyleri: Sınırlı ve Kapsamlı | Mevcut Bina",
  seoDescription: "TBDY 15.2.2 ve Tablo 15.1'e göre sınırlı/kapsamlı bilgi düzeyi, BKS=3 sınırı, saha doğrulaması ve bilgi düzeyi katsayıları.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "bilgi-duzeyi-ne-demek",
      title: "Bilgi düzeyi, dosyada proje bulunup bulunmamasından daha geniş bir kavramdır",
      content: phase4Lines(
        "TBDY 15.2.2, mevcut durum bilgilerinin kapsamına göre bilgi düzeylerini **sınırlı** ve **kapsamlı** olarak tanımlar. Bu sınıflandırma; geometri, eleman detayları, malzeme özellikleri ve sahada yapılan doğrulamanın ne kadar kapsamlı olduğunu temsil eder.",
        "",
        "Dolayısıyla arşivde statik proje bulunması tek başına 'kapsamlı bilgi düzeyi' demek değildir. Projenin mevcut bina ile sahada doğrulanması, donatı ve malzeme tespitlerinin ilgili kapsamda yapılması gerekir."
      ),
      subsections: [],
    },
    {
      id: "sinirli-kapsamli",
      title: "Sınırlı ve kapsamlı bilgi düzeyinin temel farkı",
      content: phase4Lines(
        "| Başlık | Sınırlı bilgi düzeyi | Kapsamlı bilgi düzeyi |",
        "|---|---|---|",
        "| Yönetmelik tanımı | Taşıyıcı sistem özellikleri binada yapılacak ölçümlerle belirlenir | Sınırlı düzeye göre daha fazla ölçüm ve doğrulama yapılır |",
        "| Kullanım sınırı | Yalnız Tablo 3.1'deki **Diğer Binalar (BKS=3)** için uygulanabilir | Bina türü ve değerlendirme amacı çerçevesinde uygulanır |",
        "| Betonarme proje varsa | Mimari proje rölöveye yardımcı olabilir; eleman detaylarında yönetmelik varsayım ve tespit kapsamı uygulanır | Betonarme projeler saha ölçümleriyle doğrulanır; önemli farklılık varsa proje yok sayılır |",
        "| Bilgi düzeyi katsayısı | **0.75** | **1.00** |"
      ),
      subsections: [],
    },
    {
      id: "bks-siniri",
      title: "Sınırlı bilgi düzeyi yalnız BKS=3 için kullanılabilir",
      content: phase4Lines(
        "TBDY 15.2.2.1'in en kritik şartlarından biri, sınırlı bilgi düzeyinin yalnız Tablo 3.1'de tanımlanan **Diğer Binalar (BKS=3)** için uygulanabilmesidir. Bu nedenle bilgi düzeyi seçimine doğrudan 'kaç karot alacağız?' sorusuyla başlanmamalıdır; önce bina kullanım sınıfı ve değerlendirme kapsamı doğrulanmalıdır.",
        "",
        "> [!warning] Sık hata",
        "> Projesi olmayan her binayı otomatik olarak sınırlı bilgi düzeyine almak doğru değildir. BKS koşulu ve ilgili Bölüm 15 hükümleri birlikte kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "bilgi-duzeyi-katsayisi",
      title: "Tablo 15.1: bilgi düzeyi katsayısı kapasiteye doğrudan girer",
      content: phase4Lines(
        "TBDY 15.2.12 ve Tablo 15.1'e göre sınırlı bilgi düzeyi katsayısı **0.75**, kapsamlı bilgi düzeyi katsayısı **1.00**'dır. Bu katsayılar incelenen binadan edinilen bilgi düzeyine göre eleman kapasitelerine uygulanır.",
        "",
        "Aynı maddede ayrıca, özellikle belirtilmedikçe mevcut malzeme dayanımlarının ilgili tasarım yönetmeliklerindeki malzeme katsayıları ile bölünmeyeceği ve kapasite hesabında **mevcut malzeme dayanımlarının** kullanılacağı belirtilir.",
        "",
        "> [!engineering] Model kontrolü",
        "> Yazılımda bilgi düzeyi katsayısını yalnız rapor metninde bırakmayın. Eleman kapasitesi hesabına nerede ve nasıl uygulandığını hesap çıktısından doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "betonarme-geometri",
      title: "Betonarme binada kapsamlı düzey proje-saha uyumunu doğrulamayı gerektirir",
      content: phase4Lines(
        "TBDY 15.2.5.1'e göre betonarme projeler mevcutsa geometri sahada yapılacak ölçümlerle projeye karşı kontrol edilir. Projeler ölçümlerle **önemli farklılıklar** gösteriyorsa proje yok sayılır ve saha çalışmasıyla taşıyıcı sistem rölövesi elde edilir.",
        "",
        "Rölöve; betonarme elemanların ve bölme duvarların her kattaki yerini, açıklıkları, kat yüksekliklerini, eleman boyutlarını ve malzemeyi; ayrıca kısa kolon benzeri olumsuzlukları ve komşu bina/derz ilişkisini kapsamalıdır. Temel sistemi de yeterli sayıda inceleme çukuru ile belirlenir."
      ),
      subsections: [],
    },
    {
      id: "eleman-detaylari",
      title: "Donatı tespit kapsamı bilgi düzeyine göre değişir",
      content: phase4Lines(
        "Sınırlı bilgi düzeyinde 15.2.4.2, betonarme eleman donatılarının yapım tarihindeki minimum koşulları sağladığı varsayımını saha tespitleriyle doğrulamaya yönelik belirli oran ve minimumları tanımlar. Kapsamlı bilgi düzeyinde 15.2.5.2 daha geniş doğrulama oranları öngörür; proje ile uygulama arasında uyumsuzluk bulunması halinde **donatı gerçekleşme katsayısı** eleman türlerine göre belirlenir ve 1'den büyük alınamaz.",
        "",
        "Bu nedenle bilgi düzeyi, yalnız karot sayısını değil; donatı sıyırma, donatı tespit cihazı ölçümleri ve proje-uygulama uygunluğunun kapsamını da değiştirir."
      ),
      subsections: [],
    },
    {
      id: "dogru-is-akisi",
      title: "Doğru seçim için karar sırası",
      content: phase4Lines(
        "1. Binanın kullanım amacı ve BKS'si doğrulanır.",
        "2. Mevcut proje/raporların varlığı ve sahadaki güvenilirliği incelenir.",
        "3. Geometri, temel, donatı ve malzeme için yapılacak saha çalışması kapsamı belirlenir.",
        "4. Sınırlı veya kapsamlı bilgi düzeyi seçilir ve seçimin dayanağı rapora yazılır.",
        "5. Bilgi düzeyi katsayısı, mevcut malzeme dayanımları ve model kabulleri hesapta izlenebilir şekilde belgelenir.",
        "6. Saha bulguları projeyle çelişiyorsa kapsam/varsayımlar yeniden değerlendirilir; yalnız arşiv projesine dayanılarak analiz sürdürülmez."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- BKS belirlenmeden sınırlı bilgi düzeyi seçilmedi mi?",
        "- Sınırlı düzeyin yalnız BKS=3 için kullanılabildiği kontrol edildi mi?",
        "- Proje-saha uygunluğu yerinde ölçümlerle doğrulandı mı?",
        "- Bilgi düzeyine uygun geometri, donatı ve malzeme tespit kapsamı sağlandı mı?",
        "- Tablo 15.1 katsayısı sınırlı için 0.75, kapsamlı için 1.00 olarak doğru uygulandı mı?",
        "- Mevcut malzeme dayanımlarının kapasite hesabındaki kullanımı 15.2.12(b) ile uyumlu mu?",
        "- Önemli proje-saha uyumsuzluğunda projenin güvenilirliği yeniden değerlendirildi mi?",
        "- Seçilen bilgi düzeyinin gerekçesi hesap raporunda açıkça yazıyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.2.2, 15.2.4, 15.2.5 ve 15.2.12 — bilgi düzeyleri ve katsayıları"),
  keywords: ["bilgi düzeyi", "sınırlı bilgi düzeyi", "kapsamlı bilgi düzeyi", "Tablo 15.1", "0.75", "BKS=3", "mevcut bina"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Bilgi Düzeyi", "Rölöve", "Performans Analizi"],
};
