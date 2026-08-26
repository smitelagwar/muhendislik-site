import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const SU_YALITIM_MEVZUAT = "https://meslekihizmetler.csb.gov.tr/mevzuat-ve-tebligler-i-112709";
const PLANLI_ALANLAR_2025 = "https://meslekihizmetler.csb.gov.tr/haberler/planli-alanlar-imar-yonetmeligi-guncellendi-290883";
const YAGMUR_GRI_SU_KILAVUZU = "https://webdosya.csb.gov.tr/db/meslekihizmetler/menu/yagmur-gri-su-klavuz-05_20250312114534.pdf";

export const DEPREM_PHASE4_YAGMUR_SUYU: DepremPhase4Override = {
  slug: "yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi",
  description: "Çatı yağmur suyu tahliyesini, yağmur suyu hasadı/depolamasını ve sahada sızdırma kararını birbirinden ayırarak; Binalarda Su Yalıtımı Yönetmeliği, Planlı Alanlar İmar Yönetmeliği ve TS EN 12056-3 / TS EN 16941-1 çerçevesinde proje akışını açıklar.",
  seoTitle: "Yağmur Suyu Drenajı, Hasadı ve Sızdırma Kararı | 2026 Rehberi",
  seoDescription: "TS EN 12056-3 çatı tahliyesi, TS EN 16941-1 yağmur suyu hasadı, 7 m³-2000 m²-1000 m² zorunlulukları, %6 depo hacmi ve sızdırma tesisi karar akışı.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "uc-farkli-sistem",
      title: "Çatı tahliyesi, yağmur suyu hasadı ve sızdırma tesisi üç farklı mühendislik problemidir",
      content: phase4Lines(
        "Bir projede 'yağmur suyu hesabı' tek bir boru çapı veya depo hacmi değildir. Önce üç sistemi ayırın: **çatıdan güvenli tahliye**, kullanım amacıyla **yağmur suyu hasadı/depolaması** ve şebekeye verilmek yerine uygun sahada **sızdırma/infiltrasyon** kararı.",
        "",
        "Binalarda Su Yalıtımı Yönetmeliği **Madde 18**, çatı su tahliye sisteminin **TS EN 12056-3** standardına uygun tasarlanmasını ister. Planlı Alanlar İmar Yönetmeliğinin 2025 değişikliği ise belirli yapılarda yağmur suyunun çatıdan toplanıp tekrar kullanımını **TS EN 16941-1** çerçevesinde düzenler.",
        "",
        "Sızdırma tesisi ise bu iki standardın otomatik sonucu değildir. Zemin geçirgenliği, yeraltı suyu, temel/komşu yapı etkisi, kirlenme riski ve ilgili idarenin deşarj koşulları görülmeden 'artan suyu zemine ver' kararı alınmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "cati-tahliye",
      title: "Çatı drenajını önce taşkın ve su yalıtımı güvenliği açısından boyutlandırın",
      content: phase4Lines(
        "Binalarda Su Yalıtımı Yönetmeliği **Madde 14**, çatı ve balkon tahliye sisteminin yüzey eğimi, alan, kullanım amacı, çatı türü ve **yağış miktarı** dikkate alınarak tasarlanmasını; suyun birikmeden yapıdan uzaklaştırılmasını ister. Madde **18** ise çatı su tahliye sistemini TS EN 12056-3'e bağlar.",
        "",
        "Bu hesapta yağış şiddeti, etkin çatı alanı, oluk/dere geometrisi, süzgeç sayısı ve iniş borusu kapasitesi birlikte değerlendirilir. Depo hacminin büyük olması, çatı süzgeci veya iniş borusunun hidrolik kapasitesini artırmaz.",
        "",
        "Su yalıtım katmanı; oluk, dere, süzgeç ve diğer tahliye elemanlarıyla kesintisiz bütünleşmeli, süzgeç çevresinde sızdırmazlık sağlanmalıdır. Acil taşkın yolu/taşma senaryosu proje tipine göre ayrıca kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "2025-zorunluluk",
      title: "2025 Planlı Alanlar değişikliği yağmur suyu toplama sistemini belirli büyüklüklerde zorunlu hale getirdi",
      content: phase4Lines(
        "Bakanlığın 11 Mart 2025 değişikliğiyle, 1 Ocak 2026 sonrası uygulanmak üzere belirli özel ve kamu yapılarında yağmur suyu toplama sistemi zorunluluğu genişletildi. Sistem yapı ruhsatı eki **mekanik tesisat projesinde** gösterilir.",
        "",
        "| Koşul | Yağmur suyu toplama sistemi |",
        "|---|---|",
        "| Depo hacmi ihtiyacı **7 m³'ün üzerinde** ve parsel alanı **>2.000 m²** | Zorunlu |",
        "| Depo hacmi ihtiyacı **7 m³'ün üzerinde** ve toplam çatı izdüşüm alanı **>1.000 m²** | Zorunlu |",
        "| Kamu yapısında depo hacmi ihtiyacı **7 m³'ü geçiyor** | Zorunlu |",
        "",
        "Eşikler, çatı tahliye hesabının yerine geçmez. Zorunluluk kapsamı dışında kalan bir binada da ilgili idare/proje kararıyla yağmur suyu hasadı yapılabilir."
      ),
      subsections: [],
    },
    {
      id: "toplanabilir-yagmur",
      title: "Hasat hesabında yıllık toplanabilir yağmur suyunu çatı alanı ve yüzey özelliklerinden üretin",
      content: phase4Lines(
        "Bakanlığın Mart 2025 tarihli uygulama kılavuzu, TS EN 16941-1 yaklaşımını kullanarak yıllık toplanabilir yağmur suyu miktarını **YR,a = A × ha × e × η** ilişkisiyle gösterir.",
        "",
        "Burada `A` toplam çatı izdüşüm alanı (m²), `ha` Meteoroloji Genel Müdürlüğü verisine dayalı yıllık toplam yağış ortalaması (mm), `e` çatı yüzeyi akma katsayısı ve `η` hidrolik arıtma verimlilik katsayısıdır. Katsayılar proje tarihindeki TS EN 16941-1 verilerinden alınmalıdır.",
        "",
        "Yağmur suyu yalnız **çatı yüzeylerinden** elde edilir ve mevzuat kapsamındaki kullanım parsel bahçelerinin sulanması veya tuvalet rezervuarları/sifonlarıdır. Otopark yüzeyi gibi kirletici riski daha yüksek alanları aynı hasat hesabına otomatik dahil etmeyin."
      ),
      subsections: [],
    },
    {
      id: "depo-hacmi",
      title: "Depo hacmini yıllık hasadın yüzde 6 kuralı ile TS EN 16941-1 yöntemini birlikte kullanarak belirleyin",
      content: phase4Lines(
        "Planlı Alanlar İmar Yönetmeliği ve Bakanlık kılavuzuna göre depolama hacmi, ilin yıllık yağış ortalaması, çatı yüzey tipi ve izdüşüm alanına göre hesaplanan **yıllık toplanabilir yağmur suyunun en az %6'sını** karşılayacak şekilde TS EN 16941-1'in uygun yöntemiyle belirlenir.",
        "",
        "Bakanlığın örneğinde 1500 m² çatı için yıllık toplanabilir miktar hesaplandıktan sonra `0.06` katsayısı uygulanarak minimum depo hacmine geçilir. Bu örneğin yağış veya yüzey katsayıları başka bir şehir/çatı için aynen kopyalanmamalıdır.",
        "",
        "Depo hacmi ile günlük kullanım talebi, taşma sıklığı, bakım erişimi ve pompa/filtrasyon düzeni bir sistem olarak kontrol edilmelidir. Depo tahliye hattı varsa yağmur suyu şebekesine bağlanır."
      ),
      subsections: [],
    },
    {
      id: "sizdirma-karari",
      title: "Sızdırma tesisini ulusal bir sabit oranla değil, saha geçirgenliği ve güvenli yerleşimle kararlaştırın",
      content: phase4Lines(
        "Mevcut Bakanlık kaynakları yağmur suyu **hasadı ve şebeke tahliyesi** için açık kurallar verir; her parsel için tek bir ulusal 'sızdırma çukuru hacmi = çatı alanının şu kadarı' bağıntısı vermez. Bu nedenle böyle bir sabit oranı yönetmelik hükmü gibi kullanmayın.",
        "",
        "Sızdırma düşünülüyorsa en az şu veriler doğrulanmalıdır: zeminin geçirgenlik/infiltrasyon davranışı, mevsimsel yüksek yeraltı su seviyesi, dolgu veya kirlenmiş zemin varlığı, temel ve bodrumlara geri su etkisi, komşu parseller/yapılar, şev duraylılığı ve ilgili idarenin yağmur suyu/deşarj koşulları.",
        "",
        "Az geçirgen zeminde veya yüksek yeraltı suyunda sızdırma tesisi suyu yapı çevresinde biriktirerek tam tersine bodrum yalıtımı ve hidrostatik basınç problemini büyütebilir. Geoteknik rapor ile mekanik/altyapı projesi bu noktada birlikte karar vermelidir."
      ),
      subsections: [],
    },
    {
      id: "proje-koordinasyonu",
      title: "Taşkın, depo taşması ve temel drenajını aynı deşarj noktasında çakıştırmayın",
      content: phase4Lines(
        "Çatı tahliye hattı, depo giriş/taşma hattı, temel çevre drenajı ve saha yüzey suyu farklı debi ve kalite özelliklerine sahiptir. Hepsini tek boruya bağlamadan önce ilgili idarenin yağmur suyu/atıksu şebeke koşulları ve geri basma riski kontrol edilmelidir.",
        "",
        "Depo ve pompa sistemi enerji kesintisi veya arıza durumunda binayı su altında bırakmayacak taşma güzergâhına sahip olmalıdır. Taşma suyu bina temelinden uzağa ve kontrol edilen bir alıcıya yönlendirilmelidir.",
        "",
        "Statik projede tank konumu ve dolu ağırlığı; mekanik projede boru, filtre, pompa ve kullanım hattı; mimari/peyzaj projede tank erişimi ve taşkın güzergâhı; geoteknik tarafta sızdırma uygunluğu birlikte kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Çatı tahliye hesabını **TS EN 12056-3** kapsamında, depo hesabından ayrı yaptım.",
        "- [ ] 2026 itibarıyla **7 m³ / 2.000 m² / 1.000 m²** zorunluluk eşiklerini doğru uyguladım.",
        "- [ ] Yağmur suyu hasadına yalnız çatı yüzeylerini dahil ettim.",
        "- [ ] Yıllık hasadı **YR,a = A × ha × e × η** ilişkisiyle ve proje yerine ait yağış/katsayılarla hesapladım.",
        "- [ ] Depo hacmini yıllık toplanabilir miktarın **en az %6'sını** karşılayacak şekilde TS EN 16941-1 yöntemiyle belirledim.",
        "- [ ] Depo taşma hattının güvenli deşarjını ve geri basma riskini çözdüm.",
        "- [ ] Sızdırma tesisi için geçirgenlik, yeraltı suyu, temel/komşu yapı ve kirlenme riskini doğruladım.",
        "- [ ] Çatı drenajı, hasat tankı, temel drenajı ve saha yağmur suyu hatlarını proje disiplinleri arasında koordine ettim."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Binalarda Su Yalıtımı Yönetmeliği resmî mevzuat erişim sayfası",
      href: SU_YALITIM_MEVZUAT,
      note: "Çatı tahliyesi, drenaj ve su yalıtımı için yürürlükteki Bakanlık mevzuatına resmî erişim.",
    },
    {
      label: "ÇŞİDB — Planlı Alanlar İmar Yönetmeliği 2025 su verimliliği güncellemesi",
      href: PLANLI_ALANLAR_2025,
      note: "Yağmur suyu ve gri su sistemlerinin 2026'dan itibaren uygulanacak zorunluluk çerçevesi.",
    },
    {
      label: "ÇŞİDB — Binalarda Yerinde İçilemez Su Sistemlerinin Kullanımına Yönelik Kılavuz, Mart 2025",
      href: YAGMUR_GRI_SU_KILAVUZU,
      note: "TS EN 16941-1 yağmur suyu hasadı, yıllık toplanabilir miktar ve depo hacmi için resmî uygulama örneği.",
    },
  ],
  keywords: ["yağmur suyu", "drenaj", "yağmur suyu hasadı", "TS EN 12056-3", "TS EN 16941-1", "sızdırma", "depo hacmi"],
  tags: ["yağmur suyu", "drenaj", "su hasadı", "sızdırma"],
};
