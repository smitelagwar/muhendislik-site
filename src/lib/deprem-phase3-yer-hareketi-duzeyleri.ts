import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

const TDTH_PORTAL = "https://tdth.afad.gov.tr/";

export const DEPREM_PHASE3_YER_HAREKETI_DUZEYLERI: DepremPhase3Override = {
  slug: "tbdy-deprem-yer-hareketi-duzeyleri",
  description: "TBDY 2018 Bölüm 2'ye göre DD-1, DD-2, DD-3 ve DD-4 deprem yer hareketi düzeylerinin aşılma olasılıklarını, tekerrür periyotlarını ve tasarım zincirindeki yerini açıklar.",
  seoTitle: "TBDY 2018 DD-1, DD-2, DD-3, DD-4 | Deprem Yer Hareketi Düzeyleri",
  seoDescription: "DD-1–DD-4 için 50 yılda aşılma olasılığı, tekerrür periyodu, standart tasarım depremi ve servis depremi tanımlarının TBDY 2018 Bölüm 2'ye göre proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "dd-duzeyi-tanim",
      title: "2.2: DD-1–DD-4 büyüklük sınıfı değil, olasılıksal deprem yer hareketi düzeyidir",
      content: phase3Lines(
        "TBDY 2018 Madde 2.2, deprem etkisini tek bir 'tasarım depremi' ile sınırlamaz. **DD-1, DD-2, DD-3 ve DD-4**, belirli bir zaman aralığında aşılma olasılığı ve buna karşılık gelen yaklaşık tekerrür periyodu ile tanımlanan dört ayrı deprem yer hareketi düzeyidir.",
        "",
        "Bu sınıflar deprem magnitüdü değildir. Aynı proje noktası için seçilen DD düzeyi değiştiğinde Türkiye Deprem Tehlike Haritası'ndan alınan spektral tehlike değerleri de değişir; dolayısıyla daha sonraki `Ss`, `S1`, `SDS`, `SD1` ve tasarım spektrumu zinciri baştan kurulmalıdır.",
        "",
        "> [!warning] DD etiketi ile deprem büyüklüğünü karıştırmayın",
        "> `DD-1` ifadesi '1. derece deprem' veya belirli bir magnitüd anlamına gelmez. Yönetmelikteki tanım olasılıksal yer hareketi tehlikesidir."
      ),
      subsections: [],
    },
    {
      id: "dd-dort-duzey",
      title: "DD-1–DD-4 için aşılma olasılığı ve tekerrür periyodu birlikte okunur",
      content: phase3Lines(
        "Yönetmelikteki SOURCE_VALUE tanımlar aşağıdaki gibidir:",
        "",
        "| Düzey | Olasılıksal tanım | Yaklaşık tekerrür periyodu | TBDY tanımı |",
        "|---|---|---:|---|",
        "| DD-1 | 50 yılda aşılma olasılığı %2 | 2475 yıl | Çok seyrek deprem yer hareketi; göz önüne alınan en büyük deprem yer hareketi |",
        "| DD-2 | 50 yılda aşılma olasılığı %10 | 475 yıl | Seyrek deprem yer hareketi; **standart tasarım deprem yer hareketi** |",
        "| DD-3 | 50 yılda aşılma olasılığı %50 | 72 yıl | Sık deprem yer hareketi |",
        "| DD-4 | 50 yılda aşılma olasılığı %68; 30 yılda %50 | 43 yıl | Çok sık deprem yer hareketi; **servis deprem yer hareketi** |",
        "",
        "DD-1 daha seyrek ve daha yüksek tehlike düzeyini, DD-4 ise daha sık oluşan servis düzeyini temsil eder. Bu sıralama doğrudan 'hangi performans hedefinin her bina için zorunlu olduğu' sonucuna dönüştürülmemelidir; performans hedefleri bina kullanım sınıfı ve değerlendirme/tasarım yaklaşımıyla birlikte Bölüm 3'te belirlenir."
      ),
      subsections: [],
    },
    {
      id: "tehlike-haritasi-baglantisi",
      title: "2.1.2: Her DD düzeyi için tehlike haritası verisi proje konumunda ayrı okunur",
      content: phase3Lines(
        "TBDY 2.1.2, dört deprem yer hareketi düzeyine ait deprem tehlikesi verilerinin **Türkiye Deprem Tehlike Haritaları** ile tanımlandığını ve AFAD'ın `tdth.afad.gov.tr` adresindeki harita üzerinden erişildiğini belirtir.",
        "",
        "Proje akışı `proje konumu → DD düzeyi → harita spektral katsayıları → yerel zemin etkisi → tasarım spektrumu` şeklinde kurulmalıdır. Başka bir projeden veya başka DD düzeyinden alınmış `Ss/S1` değerleri aynı il/ilçe içinde dahi otomatik olarak taşınamaz.",
        "",
        "> [!engineering] Konum verisini hesap girdisi olarak arşivleyin",
        "> Hesap raporunda koordinat/proje noktası, kullanılan DD düzeyi, harita sorgu tarihi ve alınan harita değerleri birlikte izlenebilir olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "performans-hedefi-ayrimi",
      title: "DD düzeyi ile bina performans hedefi aynı kavram değildir",
      content: phase3Lines(
        "DD düzeyi **yer hareketi talebini**, SH/KH/GÖ/KK gibi performans tanımları ise **bina cevabına ilişkin hedefi** ifade eder. TBDY Tablo 3.4 ve 3.5 bu iki katmanı bina kullanım sınıfı ve tasarım/değerlendirme yaklaşımıyla eşleştirir.",
        "",
        "Bu nedenle 'DD-2 her zaman tek başına yeterlidir' veya 'DD-1 her binada otomatik olarak GÖ kontrolüdür' gibi genellemeler yapılmamalıdır. Önce ilgili bina için Bölüm 3 performans hedefi seçilir, sonra o hedefin gerektirdiği DD düzeyi ve analiz yaklaşımı uygulanır.",
        "",
        "> [!check] İki kararı ayrı raporlayın",
        "> Hesap raporunda `kullanılan deprem yer hareketi düzeyi` ile `hedeflenen bina performansı` ayrı satırlar olarak gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "standart-spektrum-baglantisi",
      title: "2.3: Seçilen DD düzeyi, %5 sönümlü standart elastik spektrumun başlangıç verisidir",
      content: phase3Lines(
        "Madde 2.3'e göre standart deprem yer hareketi spektrumları, **%5 sönüm oranı** esas alınarak her bir DD düzeyi için ayrı tanımlanır. Haritadan alınan `Ss` ve `S1` değerleri yerel zemin etki katsayılarıyla dönüştürülerek `SDS` ve `SD1` tasarım spektral ivme katsayılarına ulaşılır.",
        "",
        "ZF yerel zemin sınıfında tablo katsayılarıyla standartlaştırılmış yol kullanılmaz; Bölüm 16.5'e göre sahaya özel zemin davranış analizi gerekir. Dolayısıyla DD seçimi yalnız makale başındaki bir etiket değil, bütün spektrum hesabının veri anahtarıdır.",
        "",
        "> [!warning] Eski spektrum dosyasını yeni DD düzeyine kopyalamayın",
        "> DD düzeyi değiştiyse harita değerlerini, yerel zemin dönüşümünü ve spektrum kırılma periyotlarını yeniden üretin."
      ),
      subsections: [],
    },
    {
      id: "proje-akisi",
      title: "Proje akışı: DD düzeyini erken kilitleyin, fakat performans hedefinden bağımsız seçmeyin",
      content: phase3Lines(
        "Pratik kontrol sırası şu şekilde tutulabilir:",
        "",
        "1. Bina kullanım sınıfı ve proje amacı belirlenir.",
        "2. Bölüm 3'ten uygulanacak performans hedefi ve buna bağlı DD düzeyi belirlenir.",
        "3. 2.1.2'deki Türkiye Deprem Tehlike Haritası'ndan tam proje noktası için ilgili DD verisi alınır.",
        "4. `Ss/S1` değerleri yerel zemin sınıfı ile `SDS/SD1` değerlerine dönüştürülür.",
        "5. Yatay/düşey elastik tasarım spektrumları ve analiz girdileri aynı DD düzeyiyle tutarlı kurulur.",
        "",
        "> [!engineering] Revizyon kontrolü",
        "> Proje konumu, zemin sınıfı, kullanım sınıfı veya performans hedefi değiştiğinde DD ve spektrum girdileri de revizyon kapsamına alınmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- DD-1, DD-2, DD-3 ve DD-4 deprem magnitüdü değil olasılıksal yer hareketi düzeyi olarak mı yorumlandı?",
        "- DD-1 için `%2 / 50 yıl` ve `2475 yıl` tanımı doğru mu?",
        "- DD-2 için `%10 / 50 yıl` ve `475 yıl` standart tasarım deprem yer hareketi tanımı doğru mu?",
        "- DD-3 için `%50 / 50 yıl` ve `72 yıl` tanımı doğru mu?",
        "- DD-4 için `%68 / 50 yıl` (`%50 / 30 yıl`) ve `43 yıl` servis deprem yer hareketi tanımı doğru mu?",
        "- Kullanılan DD düzeyi Bölüm 3 performans hedefiyle birlikte belirlendi mi?",
        "- Harita sorgusu 2.1.2'deki AFAD Türkiye Deprem Tehlike Haritası üzerinden tam proje noktasında mı yapıldı?",
        "- DD düzeyi değiştiğinde Ss/S1 ve devamındaki bütün spektrum zinciri yeniden üretildi mi?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase3References("Bölüm 2; Madde 2.1.2, 2.2 ve 2.3"),
    {
      label: "AFAD — Türkiye Deprem Tehlike Haritaları",
      href: TDTH_PORTAL,
      note: "TBDY 2.1.2'nin yönlendirdiği resmî tehlike haritası sorgu portalıdır; proje noktası ve seçilen DD düzeyi için harita verileri buradan alınır.",
    },
  ],
  keywords: ["TBDY 2018", "DD-1", "DD-2", "DD-3", "DD-4", "deprem yer hareketi düzeyi", "tekerrür periyodu", "Türkiye Deprem Tehlike Haritası"],
  tags: ["TBDY 2018", "Deprem Tehlikesi", "DD-1", "DD-2", "DD-3", "DD-4"],
};
