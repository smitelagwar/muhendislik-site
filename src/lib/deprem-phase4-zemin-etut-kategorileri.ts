import { PHASE4_UPDATED_AT, TBDY_PAGE, TBDY_PDF, phase4Lines, type DepremPhase4Override } from "./deprem-phase4-shared";

const ZEMIN_TEBLIG_PAGE = "https://yapiisleri.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formati-haber-238674";
const ZEMIN_TEBLIG_2021 = "https://www.resmigazete.gov.tr/eskiler/2021/02/20210217-4.htm";

export const DEPREM_PHASE4_ZEMIN_ETUT_KATEGORILERI: DepremPhase4Override = {
  slug: "zemin-temel-etudu-rapor-kategorileri",
  description: "Zemin ve temel etüdünde kategori kararının yapı, zemin, komşuluk, yeraltı suyu ve çevre koşullarıyla nasıl verildiğini; kategori seçiminin arazi programı ile Veri ve Geoteknik Rapor kapsamına etkisini açıklar.",
  seoTitle: "Zemin ve Temel Etüdü Rapor Kategorileri | Kategori 1, 2 ve 3",
  seoDescription: "Zemin ve temel etüdünde Kategori 1, 2 ve 3 karar mantığı, 2021 değişiklikleri, Veri Raporu-Geoteknik Rapor ayrımı ve mühendislik kontrol listesi.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "kategori-karari",
      title: "Etüt kategorisi sondaj sayısından değil, proje ve saha riskinden başlar",
      content: phase4Lines(
        "Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı, etütleri çalışma içeriği bakımından **Kategori 1, Kategori 2 ve Kategori 3** olarak ayırır. Kategori seçimi etüt programı kurulmadan önce yapılır; saha bulguları ilk kabulleri değiştirirse kategori gerekçesi yazılarak yeniden değerlendirilir.",
        "",
        "Bu nedenle 'kaç sondaj yapılacak?' sorusu kategori kararının önüne geçirilmemelidir. Önce yapı ve bileşenleri, zemin/kaya koşulları, civar yapılar ve altyapı, yeraltı suyu ile çevresel-geoteknik riskler tanımlanır; sonra bu risk seviyesine uygun araştırma programı oluşturulur.",
        "",
        "| Karar katmanı | Mühendisin cevaplaması gereken soru |",
        "|---|---|",
        "| Yapı | Sistem, bodrum, yükseklik ve kullanım açısından olağan dışı bir durum var mı? |",
        "| Zemin | Problemli zemin, özel araştırma veya iyileştirme gereksinimi var mı? |",
        "| Komşuluk | Kazı ve temel çalışmaları komşu yapı/altyapıyı etkileyebilir mi? |",
        "| Su | Yeraltı suyu temel, kazı, dayanım veya drenaj kararını değiştiriyor mu? |",
        "| Çevre | Şev, kütle hareketi, yüzey suyu veya başka geoteknik tehlike var mı? |"
      ),
      subsections: [],
    },
    {
      id: "kategori-bir",
      title: "Kategori 1, basit projeler için dar bir istisnadır; tek bir koşul yeterli değildir",
      content: phase4Lines(
        "Kategori 1 yaklaşımı, 'küçük bina = otomatik Kategori 1' şeklinde okunmamalıdır. Tebliğde kategori kararı yalnız yapı geometrisine değil zemin, komşuluk, yeraltı suyu ve çevre koşullarına da bağlanır. Kategori 1 için öngörülen koşullar birlikte değerlendirilir; sahadaki bir bulgu daha kapsamlı araştırma gerektiriyorsa etüt kapsamı genişletilir.",
        "",
        "17 Şubat 2021 tarihli değişiklik özellikle Kategori 1 araştırmasının zemin sınıfı doğrulamasını sıkılaştırmıştır. Araştırma çukurlarında kaya gözlenemiyorsa, TBDY **16.4.3** kapsamındaki tahkik için sismik yöntemler, sondaj/sondalama veya arazi deneyleri kullanılmalıdır. Ayrıca birbirini çapraz kesen **en az 2 adet sismik ölçü** ile **VS30 > 360 m/s** olduğunun gösterilmesi istenir.",
        "",
        "Bu hüküm bir 'otomatik sınıflandırma kısayolu' değildir. Ölçüm programı, sahadaki birimleri ve yapı etki alanını temsil etmeli; ham veriler, koordinatlar, fotoğraf/video ve kabul tutanağı ile izlenebilir olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kategori-iki-uc",
      title: "Kategori 2 ve 3'te kapsamı büyüten şey araştırma ve tasarım karmaşıklığıdır",
      content: phase4Lines(
        "Kategori 2 ve Kategori 3 için amaç, aynı rapora yalnız daha fazla sayfa eklemek değildir. Etüt programı, geoteknik tasarımın güvenilir biçimde yapılmasını sağlayacak arazi ve laboratuvar verisini üretmelidir. Özel zemin davranışı, karmaşık temel/kazı sistemi, komşu yapı etkileşimi veya özel deprem değerlendirmesi gerektiren durumlarda daha kapsamlı kategori ve uzmanlık düzeyi gündeme gelir.",
        "",
        "2021 değişikliği, **Kategori 2 ve Kategori 3** kapsamındaki çalışmaların inşaat, jeoloji ve jeofizik mühendislerince yürütülmesini düzenler. Bu, raporun farklı disiplinlerde üretilen verilerinin tek geoteknik tasarım modelinde tutarlı hale getirilmesi gerektiğini gösterir.",
        "",
        "Pratik karar: proje kategorisini yalnız ruhsat otomasyonundaki bir seçim olarak görmeyin. Kategoriyi arazi programı, laboratuvar programı, geoteknik hesaplar ve raporu imzalayan disiplinlerle birlikte kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "veri-geoteknik-rapor",
      title: "TBDY 16.2.2: Veri Raporu ile Geoteknik Rapor aynı işlevi görmez",
      content: phase4Lines(
        "TBDY **16.2.2**, Zemin ve Temel Etüdü Raporlarının **Veri Raporu** ve tasarıma yönelik **Geoteknik Rapor** olmak üzere iki bileşenden oluşacağını belirtir.",
        "",
        "| Rapor | Temel işlev |",
        "|---|---|",
        "| Veri Raporu — 16.2.2.1 | Jeoloji, sondaj/muayene çukuru logları, kesitler, yeraltı suyu, arazi-laboratuvar deneyleri ve jeofizik bulguları gibi araştırma verilerini sunar. |",
        "| Geoteknik Rapor — 16.2.2.2 | Statik, dinamik ve deprem etkileri altında zemin modelini ve tasarım parametrelerini kurar; temel seçeneklerini, mühendislik analizlerini ve tasarım önerilerini verir. |",
        "",
        "Statik proje açısından kullanılacak tasarım parametresinin kaynağı bu ayrımla izlenmelidir. Ham deney sonucu ile Geoteknik Raporda seçilmiş tasarım değeri aynı şey değildir."
      ),
      subsections: [],
    },
    {
      id: "etut-programi",
      title: "Kategori kararını arazi programına dönüştürün",
      content: phase4Lines(
        "Etüt kategorisi belirlendikten sonra program; yapı oturumu ve temel etki alanını temsil edecek araştırma noktaları, hedef derinlikler, arazi deneyleri, jeofizik çalışmalar, laboratuvar deneyleri ve yeraltı suyu gözlemlerine dönüştürülür.",
        "",
        "2021 değişikliği, Kategori 2 tasarım etütlerindeki sondaj kurallarını da güncellemiştir. Örneğin temel taban alanı **300 m²'den az** tek blok yapılarda en az **3 sondaj** öngörülür; her 300 m² artışta ilave sondaj kuralı getirilir. Ancak aynı Tebliğ özel saha koşulları, çoklu bloklar ve büyük taban alanları için ayrıca hükümler içerdiğinden bu iki sayı tek başına etüt programı değildir.",
        "",
        "Sondaj derinliği de sabit bir metre değeri değildir. 2021 metni bina temellerinde temel tabanından itibaren yapı genişliğinin en az **1.5 katı** veya net temel taban basıncının oluşturduğu gerilme artışının düşey efektif gerilmenin **%10**'una indiği derinlik seçeneklerinden araştırmaya uygun olanının kullanılmasını düzenler."
      ),
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık yapılan hatalar",
      content: phase4Lines(
        "- Kategori kararını yalnız kat adedi veya bina alanından üretmek.",
        "- Kategori 1'i araştırma yapılmayan veya yalnız gözlemsel rapor hazırlanan sınıf sanmak.",
        "- Veri Raporundaki ham parametreyi Geoteknik Rapordaki tasarım parametresi yerine doğrudan statik modele girmek.",
        "- Yeraltı suyu, komşu temel/kazı ve şev koşullarını kategori kararından koparmak.",
        "- Etüt sırasında beklenmeyen problemli zemin çıkmasına rağmen başlangıç kategorisini gerekçesiz biçimde korumak.",
        "- Sondaj adedini sağladığı için araştırma programının temsil edici olduğunu varsaymak."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "1. Yapı, bodrum, kullanım ve temel sisteminin güncel proje verilerini etüt ekibine verin.",
        "2. Zemin, komşuluk, yeraltı suyu ve çevresel risklerin kategori kararında işlendiğini doğrulayın.",
        "3. Kategori 1 kullanılıyorsa 2021 değişikliğindeki zemin sınıfı doğrulama ve VS30 koşullarını kontrol edin.",
        "4. Araştırma noktası, sondaj derinliği ve deney programının kategori ile yapı etki alanını temsil ettiğini kontrol edin.",
        "5. Veri Raporu bulguları ile Geoteknik Raporda seçilen tasarım parametreleri arasında izlenebilirlik kurun.",
        "6. Etüt sırasında kategori değiştiren yeni bulgular varsa gerekçeyi rapora yazdırın.",
        "7. Statik proje başlamadan önce temel tipi, taşıma gücü, oturma, yeraltı suyu ve deprem-zemin girdilerinin Geoteknik Raporda açık olduğundan emin olun."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018, Bölüm 16", href: TBDY_PDF, note: "Zemin araştırmaları ile Veri Raporu ve Geoteknik Rapor ayrımı 16.2'den doğrulanmıştır." },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası", href: TBDY_PAGE },
    { label: "ÇŞİDB Yapı İşleri — Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı", href: ZEMIN_TEBLIG_PAGE, note: "2019 Tebliğinin yürürlüğe giriş ve kapsam bilgisi." },
    { label: "Resmî Gazete — 17.02.2021 tarihli Zemin ve Temel Etüdü Tebliği değişikliği", href: ZEMIN_TEBLIG_2021, note: "Kategori 1 zemin sınıfı doğrulaması, sondaj ve raporlama hükümlerindeki güncel değişiklikler." },
  ],
  keywords: ["zemin ve temel etüdü", "Kategori 1", "Kategori 2", "Kategori 3", "Veri Raporu", "Geoteknik Rapor", "VS30"],
  tags: ["Zemin ve Temel", "Etüt Kategorisi", "TBDY Bölüm 16"],
};
