import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_PERDE_KRITIK_YUKSEKLIK: DepremPhase3Override = {
  slug: "tbdy-betonarme-perde-kritik-yukseklik-uc-bolge",
  description: "TBDY 2018 Madde 7.6.2'ye göre narin perdelerde uç bölgesi gereksinimini, kritik perde yüksekliği Hcr'yi ve kritik bölge içi/dışı uç bölgesi boyutlarını açıklar.",
  seoTitle: "TBDY Perde Kritik Yüksekliği ve Uç Bölgeleri | Denklem 7.15",
  seoDescription: "Hw/ℓw > 2, Denklem 7.15 kritik perde yüksekliği, %20/%10 uç bölgesi uzunlukları ve 300 mm birleşen perde koşullarının proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "uc-bolgesi-gereksinimi",
      title: "7.6.2.1: Hw/ℓw > 2.0 ise perdenin iki ucunda uç bölgeleri oluşturulur",
      content: phase3Lines(
        "TBDY 7.6.2.1, `Hw/ℓw > 2.0` olan perdelerde planda her iki uçta **perde uç bölgeleri** oluşturulmasını ister. Uç bölgesi perde kesitinin kendi kalınlığı içinde düzenlenebileceği gibi perdeye birleşen başka bir perdenin içinde de oluşturulabilir.",
        "",
        "| Geometri | Yönetmelik sonucu |",
        "|---|---|",
        "| Hw/ℓw > 2.0 | Her iki uçta perde uç bölgesi gerekir |",
        "| Hw/ℓw ≤ 2.0 | 7.6.2.1'deki bu uç bölgesi tanımı devreye girmez; diğer perde hükümleri ayrıca uygulanır |",
        "",
        "> [!engineering] Eşik bir yazılım seçeneği değildir",
        "> Uç bölgesi gereksinimini programın otomatik 'boundary element' seçeneğine bırakmayın. `Hw` ve `ℓw` tanımlarının model geometrisiyle uyumunu ve oranı hesap raporunda doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-15",
      title: "Denklem 7.15: Kritik perde yüksekliği iki alt sınır ve bir üst sınır arasında seçilir",
      content: phase3Lines(
        "7.6.2.2'ye göre kritik perde yüksekliği `Hcr`, temel üstünden veya perdenin plandaki uzunluğunun `%20`'den daha fazla küçüldüğü seviyeden itibaren belirlenir ve Denklem (7.15)'in elverişsiz koşulunu sağlar.",
        "",
        "```formula",
        "@label: TBDY Denklem (7.15) — kritik perde yüksekliği",
        "H_cr <= 2ℓ_w ve H_cr >= max(ℓ_w, H_w / 6)",
        "@symbol: H_cr | Kritik perde yüksekliği | m",
        "@symbol: ℓ_w | Perdenin plandaki toplam uzunluğu | m",
        "@symbol: H_w | Temel üstünden veya brüt eğilme rijitliğinin yarıya indiği seviyeden itibaren ölçülen perde yüksekliği | m",
        "```",
        "",
        "Başka bir ifadeyle `Hcr`, en az `max(ℓw, Hw/6)` olmalı ve `2ℓw` değerini aşmamalıdır. Bu sınırlar bir 'öneri aralığı' değil, kritik bölgenin yönetmelik tanımını belirleyen SOURCE_VALUE koşullarıdır.",
        "",
        "> [!warning] Hcr'yi yalnız kat adediyle seçmeyin",
        "> Kritik yükseklik, perdenin gerçek uzunluğu ve yönetmelikte tanımlanan Hw üzerinden kurulmalıdır; sabit iki veya üç kat varsayımı Denklem (7.15)'in yerine geçmez."
      ),
      subsections: [],
    },
    {
      id: "hw-referans-seviyesi",
      title: "Hw ve Hcr için başlangıç seviyesi bodrum rijitlik düzenine göre değişebilir",
      content: phase3Lines(
        "TBDY, `Hw`'yi temel üstünden veya perdenin brüt kesit eğilme rijitliğinin yarıya indiği seviyeden itibaren ölçülen perde yüksekliği olarak tanımlar. Plandaki uzunluğun `%20`'den fazla küçülmesi veya kesit genişliğinin yarıdan fazla küçülmesi bu rijitlik değişimine örnek oluşturur.",
        "",
        "Bodrum katlarında rijitliği üst katlara göre çok büyük betonarme çevre perdelerinin bulunduğu ve bodrum döşemelerinin yatay düzlemde rijit diyafram çalıştığı binalarda `Hw` ve `Hcr`, zemin kat döşemesinden yukarı doğru dikkate alınır. Bu durumda kritik perde bölgesi, zemin katın altındaki ilk bodrum kat yüksekliği boyunca aşağıya da uzatılır.",
        "",
        "> [!engineering] Kot referansını raporlayın",
        "> Aynı Hcr sayısı farklı başlangıç kotlarından ölçülürse farklı katları kapsar. Hesap raporu ve donatı paftasında kritik bölgenin başlangıç/bitiş kotu açık olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "uc-bolgesi-boyutlari",
      title: "Kritik yükseklik içinde uç bölgesi daha uzun tutulur",
      content: phase3Lines(
        "Dikdörtgen kesitli perdelerde 7.6.2.3, uç bölgesi plan uzunluğunu kritik yükseklik içinde ve üstünde farklı alt sınırlarla tanımlar:",
        "",
        "| Konum | Her bir uç bölgesinin plan uzunluğu |",
        "|---|---:|",
        "| Kritik perde yüksekliği Hcr boyunca | ≥ max(0.2ℓw, 2bw) |",
        "| Hcr'nin üstünde kalan perde kesimi | ≥ max(0.1ℓw, bw) |",
        "",
        "Dolayısıyla uç bölgesi yalnız 'uçtaki yoğun donatı alanı' olarak çizilemez; sınırın hangi katlarda `0.2ℓw / 2bw`, hangi katlarda `0.1ℓw / bw` ile belirlendiği kat kotlarıyla izlenmelidir.",
        "",
        "> [!check] Geçiş kotu",
        "> Hcr sonunda uç bölgesi geometrisi değişiyorsa paftada geçiş katını ve yeni uç bölgesi uzunluğunu açıkça gösterin."
      ),
      subsections: [],
    },
    {
      id: "birlesen-perde-icinde-uc-bolgesi",
      title: "Birleşen perde içinde düzenlenen uç bölgesi için 300 mm ve alan koşulu birlikte aranır",
      content: phase3Lines(
        "7.6.2.4'e göre uç bölgesi, perdeye birleşen başka bir perdenin içinde düzenleniyorsa her bir uç bölgesi perde gövdesi içine doğru **en az perde kalınlığı kadar ve en az 300 mm** uzatılır.",
        "",
        "Ayrıca bu uç bölgesinin enkesit alanı, dikdörtgen kesitli perdeler için 7.6.2.3'te tanımlanan alanın altında olamaz. Bu nedenle T, L veya U birleşiminde yalnız 300 mm ölçüsünü işaretlemek yeterli bir alan kontrolü değildir.",
        "",
        "> [!warning] Tek boyut kontrolü yeterli değildir",
        "> Birleşen perdedeki uç bölgesini hem gövde içine uzanma mesafesi hem de gerekli enkesit alanı açısından doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "pafta-model-koordinasyonu",
      title: "Kritik bölge kararı analiz zarfı ve donatı detayının ortak girdisidir",
      content: phase3Lines(
        "`Hcr`, yalnız uç bölgesi donatısının sıklaştırıldığı bir yükseklik değildir. 7.6.5'teki uç bölgesi donatı koşulları ve 7.6.6'daki tasarım momenti zarfı da kritik perde yüksekliğiyle ilişkilidir.",
        "",
        "Bu nedenle modelden elde edilen `Hw/ℓw` oranı, Hcr hesabı, uç bölgesi plan boyutları ve katlara göre donatı detayları aynı revizyonda tutulmalıdır. Perde boyu değişiyorsa `%20` uzunluk azalması ve başlangıç seviyesi yeniden kontrol edilmelidir.",
        "",
        "> [!engineering] Tek kaynaklı geometri",
        "> Analiz modeli, kalıp planı ve donatı paftası farklı ℓw değerleri kullanıyorsa Hcr ve uç bölgesi boyutları güvenilir biçimde doğrulanamaz."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Her perde için `Hw/ℓw` oranı gerçek geometriyle hesaplandı mı?",
        "- `Hw/ℓw > 2.0` perdelerde iki uç bölgesi de tanımlandı mı?",
        "- Hcr, Denklem (7.15) ile `Hcr ≤ 2ℓw` ve `Hcr ≥ max(ℓw, Hw / 6)` koşullarını sağlıyor mu?",
        "- Perde uzunluğunda %20'den fazla küçülme varsa Hcr başlangıç seviyesi yeniden değerlendirildi mi?",
        "- Rijit bodrum koşulu varsa zemin kat referansı ve aşağı doğru ilk bodrum kat uzatması dikkate alındı mı?",
        "- Hcr içinde her uç bölgesi en az `max(0.2ℓw, 2bw)` uzunluğunda mı?",
        "- Hcr üstünde her uç bölgesi en az `max(0.1ℓw, bw)` uzunluğunda mı?",
        "- Uç bölgesi birleşen perdede ise gövde içine en az bw ve 300 mm uzanma ile alan koşulu birlikte sağlanıyor mu?",
        "- Hcr başlangıç/bitiş kotları analiz raporu ve donatı paftasında aynı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.6.2.1–7.6.2.4 ve Denklem (7.15)"),
  keywords: ["TBDY 2018", "perde kritik yüksekliği", "Hcr", "Hw/ℓw", "uç bölgesi", "7.6.2", "Denklem 7.15"],
  tags: ["TBDY 2018", "Betonarme", "Perde", "Kritik Yükseklik", "Uç Bölgesi"],
};
