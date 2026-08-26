import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_MEVCUT_DAYANIM: DepremPhase4Override = {
  slug: "mevcut-bina-beklenen-dayanim-bilgi-katsayisi",
  description: "Legacy 'beklenen dayanım' ifadesini TBDY Bölüm 15'in doğru terimi olan mevcut malzeme dayanımıyla düzeltir; beton/çelik dayanımlarının ve 0.75–1.00 bilgi düzeyi katsayılarının eleman kapasitesine nasıl girdiğini açıklar.",
  seoTitle: "Mevcut Malzeme Dayanımı ve Bilgi Düzeyi Katsayısı | TBDY Bölüm 15",
  seoDescription: "TBDY 15.2.3 ve 15.2.12'ye göre mevcut beton/çelik dayanımı, sınırlı 0.75 ve kapsamlı 1.00 bilgi düzeyi katsayıları ve kapasite hesabı.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "dogru-terim",
      title: "Bölüm 15'in esas terimi: mevcut malzeme dayanımı",
      content: phase4Lines(
        "TBDY 15.2.3, taşıyıcı eleman kapasitelerinin hesabında kullanılacak malzeme dayanımlarını **mevcut malzeme dayanımı** olarak tanımlar. Mevcut bina değerlendirmesinde bu terim, yeni bina tasarımındaki karakteristik/tasarım dayanımı veya başka bölümlerde karşılaşılabilen 'beklenen dayanım' kavramlarıyla otomatik olarak eşitlenmemelidir.",
        "",
        "> [!warning] Terminoloji kontrolü",
        "> Yazılım arayüzünde 'beklenen', 'ortalama', 'mevcut' veya 'tasarım' dayanımı gibi farklı etiketler bulunabilir. Bölüm 15 hesabında hangi alanın yönetmelikteki **mevcut malzeme dayanımını** temsil ettiği yazılım dokümantasyonu ve hesap çıktısıyla doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "beton-dayanimi",
      title: "Mevcut beton dayanımı bilgi düzeyine uygun saha verisinden üretilir",
      content: phase4Lines(
        "Betonarme binalarda mevcut beton dayanımı 15.2.4.3 veya 15.2.5.3'teki karot programı ve değerlendirme kurallarıyla belirlenir. Sınırlı bilgi düzeyinde üç örnek varsa minimum sonuç; üçten fazla örnekte ise `ortalama − standart sapma` ile `0.85 × ortalama` değerlerinden büyük olanı kullanılır. Kapsamlı düzeyde de kapasite hesabındaki mevcut beton dayanımı bu iki istatistiksel değerden büyük olanıdır.",
        "",
        "Bu değer bir beton sınıfını tahmin etmek için değil, Bölüm 15 kapsamında eleman kapasitesine girecek **mevcut dayanımı** tanımlamak için kullanılır. Ham karot sonuçlarından hesap girdisine kadar dönüşüm izlenebilir tutulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "celik-dayanimi",
      title: "Mevcut çelik dayanımı da bilgi düzeyine göre farklı doğrulanır",
      content: phase4Lines(
        "Sınırlı bilgi düzeyinde donatı sınıfı sıyrılan yüzeylerde görsel incelemeyle belirlenir ve bu sınıfın **karakteristik akma gerilmesi** mevcut çelik dayanımı olarak alınır.",
        "",
        "Kapsamlı bilgi düzeyinde her çelik sınıfından örnekle akma gerilmesi, kopma dayanımı ve şekildeğiştirme özellikleri deneyle kontrol edilir. Projeye uygunluk doğrulanırsa projedeki karakteristik akma gerilmesi kullanılır; uygunluk sağlanamazsa en az üç ek örnek alınır ve elde edilen **en elverişsiz akma gerilmesi** mevcut çelik akma gerilmesi kabul edilir."
      ),
      subsections: [],
    },
    {
      id: "bilgi-katsayisi",
      title: "Tablo 15.1 bilgi düzeyi katsayısını eleman kapasitesine uygular",
      content: phase4Lines(
        "TBDY 15.2.12(a), incelenen binadan edinilen bilgi düzeyine göre **eleman kapasitelerine** uygulanacak katsayıları Tablo 15.1'de verir:",
        "",
        "| Bilgi düzeyi | Bilgi düzeyi katsayısı |",
        "|---|---:|",
        "| Sınırlı | **0.75** |",
        "| Kapsamlı | **1.00** |",
        "",
        "Katsayı, yalnız rapor kapağında belirtilen bir güven sınıfı değildir; kapasite hesabına girmesi gereken yönetmelik parametresidir. Aynı geometri ve mevcut dayanımlar için sınırlı bilgi düzeyi, kapasiteyi kapsamlı düzeye göre daha düşük güven düzeyiyle değerlendirir."
      ),
      subsections: [],
    },
    {
      id: "malzeme-katsayilari",
      title: "Yeni bina tasarımındaki malzeme güvenlik katsayıları otomatik taşınmaz",
      content: phase4Lines(
        "TBDY 15.2.12(b) açıkça, **özellikle belirtilmedikçe** malzeme dayanımlarının ilgili tasarım yönetmeliklerindeki malzeme katsayılarıyla bölünmeyeceğini söyler. Eleman kapasitesi hesabında mevcut malzeme dayanımları kullanılır.",
        "",
        "Bu nedenle mevcut bina hesabında aynı dayanımı önce tasarım dayanımına düşürüp sonra ayrıca bilgi düzeyi katsayısıyla azaltmak, yönetmelikte tarif edilmeyen bir çift indirgeme yaratabilir. Hesap yazılımının malzeme katsayısı ve bilgi düzeyi katsayısını nerede uyguladığı ayrı ayrı denetlenmelidir."
      ),
      subsections: [],
    },
    {
      id: "kapasite-ornek",
      title: "Bilgi düzeyi katsayısının etkisini basit kapasite kontrolüyle izleyin",
      content: phase4Lines(
        "Bir elemanın mevcut malzeme dayanımları ve mevcut donatısıyla hesaplanan nominal kapasitesi örneğin **1000 kN** ise, diğer tüm koşullar aynı kabul edildiğinde bilgi düzeyi katsayısının kapasiteye etkisi kontrol amaçlı şöyle okunabilir:",
        "",
        "| Bilgi düzeyi | Katsayı | Katsayı uygulanmış kapasite |",
        "|---|---:|---:|",
        "| Sınırlı | 0.75 | 750 kN |",
        "| Kapsamlı | 1.00 | 1000 kN |",
        "",
        "Bu tablo bir eleman tasarım örneği değil, yazılımın Tablo 15.1 katsayısını kapasiteye gerçekten uygulayıp uygulamadığını kontrol etmek için kullanılan basit bir muhasebe örneğidir."
      ),
      subsections: [],
    },
    {
      id: "model-zinciri",
      title: "Doğru veri zinciri deney raporundan performans kararına kadar kesintisiz olmalıdır",
      content: phase4Lines(
        "1. Bilgi düzeyi ve saha tespit kapsamı belirlenir.",
        "2. Karot ve çelik tespit/deneylerinden mevcut beton ve çelik dayanımları üretilir.",
        "3. Donatı gerçekleşme katsayısı ve korozyon/kenetlenme gibi kapasite etkileri belirlenir.",
        "4. Eleman kapasitesi mevcut geometri, mevcut donatı ve mevcut malzeme dayanımlarıyla hesaplanır.",
        "5. Tablo 15.1 bilgi düzeyi katsayısının kapasiteye doğru uygulandığı doğrulanır.",
        "6. Bu kapasite değerleri 15.5 veya 15.6'daki talep ve performans değerlendirmelerine aktarılır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Raporda 'beklenen dayanım' yerine Bölüm 15'in **mevcut malzeme dayanımı** kavramı doğru tanımlandı mı?",
        "- Mevcut beton dayanımı doğru bilgi düzeyi ve karot istatistiğinden geliyor mu?",
        "- Mevcut çelik dayanımı bilgi düzeyine uygun inceleme/deneyle belirlendi mi?",
        "- Sınırlı bilgi düzeyinde 0.75, kapsamlı düzeyde 1.00 katsayısı kullanıldı mı?",
        "- Bilgi düzeyi katsayısının eleman kapasitesine gerçekten uygulandığı çıktıdan doğrulandı mı?",
        "- Malzeme dayanımları yönetmelikte özel bir hüküm yokken ayrıca tasarım malzeme katsayılarına bölünmedi mi?",
        "- Donatı gerçekleşme ve korozyon gibi saha bulguları kapasite hesabına yansıtıldı mı?",
        "- Deney raporu → mevcut dayanım → eleman kapasitesi → performans sonucu zinciri izlenebilir mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.2.3, 15.2.4.3, 15.2.5.3 ve 15.2.12 — mevcut malzeme dayanımı ve bilgi düzeyi katsayıları"),
  keywords: ["mevcut malzeme dayanımı", "bilgi düzeyi katsayısı", "0.75", "1.00", "mevcut beton dayanımı", "mevcut çelik dayanımı", "TBDY 15.2.12"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Malzeme Dayanımı", "Bilgi Düzeyi", "Kapasite"],
};
