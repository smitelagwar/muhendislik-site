import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_ROLOVE_HASAR: DepremPhase4Override = {
  slug: "mevcut-bina-tasiyici-rolove-hasar-belgeleme",
  description: "TBDY Bölüm 15 kapsamında mevcut binanın taşıyıcı sistem rölövesinin nasıl çıkarılacağını; temel, kısa kolon, komşu bina/derz ilişkisi, mevcut hasar ve sonradan yapılan değişikliklerin modele nasıl aktarılacağını açıklar.",
  seoTitle: "Mevcut Binada Taşıyıcı Sistem Rölövesi ve Hasar Belgeleme | TBDY 15",
  seoDescription: "TBDY 15.2.1, 15.2.4.1 ve 15.2.5.1'e göre taşıyıcı sistem rölövesi, temel tespiti, kısa kolon, derz, hasar ve proje-saha doğrulaması.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "rolove-modelin-girdisidir",
      title: "Taşıyıcı sistem rölövesi çizim işi değil, analiz modelinin saha girdisidir",
      content: phase4Lines(
        "TBDY 15.2.1.1–15.2.1.2, mevcut binanın kapasite ve deprem dayanımı değerlendirmesinde kullanılacak eleman boyutları, taşıyıcı sistem geometrisi ve malzeme özelliklerinin proje/raporlar, yerinde gözlem-ölçüm ve deneylerden elde edilmesini ister. Amaç mevcut binanın **gerçek durumunu** modele taşımaktır.",
        "",
        "Mimari plan yalnız mekân organizasyonunu gösterebilir; taşıyıcı sistem rölövesi ise kolon, perde, kiriş, döşeme, açıklık, kat yüksekliği, eleman boyutu, malzeme ve yük aktarım yolunu analiz kurulabilecek hassasiyette tanımlamalıdır."
      ),
      subsections: [],
    },
    {
      id: "toplanacak-bilgiler",
      title: "15.2.1.2 saha çalışmasının kapsamını açıkça listeler",
      content: phase4Lines(
        "| Saha başlığı | Model/rapor karşılığı |",
        "|---|---|",
        "| Yapısal sistemin tanımlanması | Taşıyıcı sistem türü, düşey ve yatay yük yolu |",
        "| Bina geometrisi | Kat planı, akslar, açıklıklar, kat yükseklikleri, eleman kesitleri |",
        "| Temel sistemi ve zemin | Temel türü/geometrisi, zemin raporu ve gerekiyorsa inceleme çukurları |",
        "| Mevcut hasar | Kat-aks-eleman bazında hasar kaydı ve kapasite/model etkisi |",
        "| Önceki değişiklik/onarım | Sonradan açılan boşluk, kaldırılan/eklenen eleman, güçlendirme veya tamir bilgisi |",
        "| Malzeme özellikleri | Karot, donatı sınıfı/tespiti ve ilgili deney sonuçları |",
        "| Proje-saha uygunluğu | Arşiv projesinin mevcut bina ile güvenilirlik kontrolü |"
      ),
      subsections: [],
    },
    {
      id: "betonarme-geometri",
      title: "Betonarme rölövede yalnız kolon-kiriş kesiti ölçmek yeterli değildir",
      content: phase4Lines(
        "Sınırlı bilgi düzeyinde 15.2.4.1, saha çalışmasıyla taşıyıcı sistem plan rölövesi elde edilmesini ister. Bilgiler tüm betonarme elemanların ve bölme duvarlarının her kattaki yerini ve malzemesini, eksen açıklıklarını, yükseklikleri ve boyutları kapsamalı ve hesap modelini kurmaya yeterli olmalıdır.",
        "",
        "Aynı maddede temel sisteminin bina içinde veya dışında açılacak **yeterli sayıda inceleme çukuru** ile belirlenmesi; kısa kolon ve benzeri olumsuzlukların plan ve kesitlere işlenmesi; komşu binalarla ilişkinin ayrık/bitişik ve derz var/yok olarak kaydedilmesi istenir."
      ),
      subsections: [],
    },
    {
      id: "proje-saha-dogrulamasi",
      title: "Kapsamlı bilgi düzeyinde proje sahada doğrulanmadan kabul edilmez",
      content: phase4Lines(
        "TBDY 15.2.5.1'e göre betonarme projeler mevcutsa, mevcut geometrinin projeye uygunluğu yerinde ölçümlerle kontrol edilir. Ölçümler ile proje arasında **önemli farklılıklar** varsa proje yok sayılır ve saha çalışmasıyla taşıyıcı sistem rölövesi çıkarılır.",
        "",
        "Kapsamlı düzeyde geometri bilgileri ayrıca bina kütlesinin hassas biçimde tanımlanmasına yetecek ayrıntıyı içermelidir. Bu nedenle cephe/kaba plan üzerinden yaklaşık alan üretmek yerine bölme duvarları, döşeme/kaplama etkileri ve gerçek taşıyıcı geometri model girdileriyle birlikte düşünülmelidir."
      ),
      subsections: [],
    },
    {
      id: "hasar-belgeleme",
      title: "Mevcut hasar ve önceki müdahaleler kat–aks–eleman koduyla izlenebilir olmalıdır",
      content: phase4Lines(
        "15.2.1.2, varsa mevcut hasarın ve önceden yapılmış değişiklik ve/veya onarımların belirlenmesini bilgi toplama kapsamına dahil eder. Sahada görülen çatlak, ezilme, korozyon, kesit kaybı veya onarım izi yalnız fotoğraf klasöründe bırakılmamalıdır.",
        "",
        "Pratik kayıt düzeni her bulguyu **kat + aks + eleman kodu + yüz/konum + ölçü + fotoğraf numarası** ile eşleştirmektir. Böylece aynı elemanın modeldeki kesiti, donatı bilgisi, malzeme sonucu ve hasar kaydı tek kimlik altında izlenebilir.",
        "",
        "> [!engineering] Mühendislik kararı",
        "> Hasarın dayanım/rijitlik hesabına nasıl yansıtılacağı yalnız görsel etiketle bırakılmamalı; analiz varsayımı ve gerekçesi hesap raporunda tanımlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "deprem-sonrasi-sinir",
      title: "Bölüm 15 rölövesi, deprem sonrası hızlı hasar tespitiyle karıştırılmamalıdır",
      content: phase4Lines(
        "TBDY 15.1.6, binada hasara neden olan bir deprem sonrasında hasarlı binanın deprem güvenliğinin Bölüm 15 yöntemleriyle belirlenemeyeceğini söyler. Bu nedenle afet sonrası 'girilebilir mi?', 'ağır hasarlı mı?' gibi acil kullanım/hasar tespit kararları ayrı prosedürdür.",
        "",
        "Bölüm 15 kapsamında mevcut hasarın belgelenmesi ise performans veya güçlendirme değerlendirmesinde mevcut durumun doğru temsil edilmesi içindir. Depremde hasar görmüş binanın güçlendirilmesi söz konusuysa 15.1.7 uyarınca mevcut hasarın eleman dayanım ve rijitliklerine ne ölçüde yansıtılacağı projeden sorumlu inşaat mühendisi tarafından belirlenir."
      ),
      subsections: [],
    },
    {
      id: "saha-model-eslestirme",
      title: "Saha verisinden modele geçişte çapraz kontrol yapılmalıdır",
      content: phase4Lines(
        "1. Her kat için saha planı ve eleman kod sistemi oluşturun.",
        "2. Kesit ölçülerini, aks kaçıklıklarını, perde yönlerini, döşeme boşluklarını ve kat kotlarını kaydedin.",
        "3. Temel sistemi, kısa kolonlar, bitişik yapı ve derz koşullarını ayrıca işaretleyin.",
        "4. Sonradan yapılan tadilatları ve mevcut hasarları eleman kimliğiyle fotoğraflara bağlayın.",
        "5. Statik/mimari projeyi saha ölçümüyle karşılaştırın; önemli uyumsuzlukları raporlayın.",
        "6. Analiz modelindeki eleman listesini rölöve eleman listesiyle birebir kontrol edin.",
        "7. Numune ve donatı tespit noktalarını aynı rölöve üzerine işleyerek modelde hangi elemana ait olduğunu izlenebilir tutun."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Tüm katlar için taşıyıcı sistem planı analiz kurmaya yeterli ayrıntıda mı?",
        "- Kolon, perde, kiriş, döşeme ve bölme duvar konum/ölçüleri kaydedildi mi?",
        "- Temel sistemi yeterli inceleme ile doğrulandı mı?",
        "- Kısa kolon ve benzeri olumsuzluklar plan/kesitlere işlendi mi?",
        "- Komşu bina ilişkisi ve derz durumu belgelendi mi?",
        "- Mevcut hasar, önceki onarım ve tadilatlar kat–aks–eleman koduyla izlenebiliyor mu?",
        "- Proje ile saha arasında önemli fark varsa proje güvenilirliği yeniden değerlendirildi mi?",
        "- Rölöve, malzeme/donatı tespitleri ve analiz modeli aynı eleman kodlarını kullanıyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.1.6–15.2.5 — bilgi toplama, rölöve, hasar ve betonarme bina geometrisi"),
  keywords: ["taşıyıcı sistem rölövesi", "mevcut bina", "hasar belgeleme", "inceleme çukuru", "kısa kolon", "derz", "proje saha uygunluğu"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Rölöve", "Saha İncelemesi", "Hasar"],
};
