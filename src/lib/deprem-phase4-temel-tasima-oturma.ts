import { PHASE4_UPDATED_AT, TBDY_PAGE, TBDY_PDF, phase4Lines, type DepremPhase4Override } from "./deprem-phase4-shared";

const ZEMIN_TEBLIG_PAGE = "https://yapiisleri.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formati-haber-238674";

export const DEPREM_PHASE4_TEMEL_TASIMA_OTURMA: DepremPhase4Override = {
  slug: "temel-tasima-gucu-oturma-kontrolu",
  description: "Yüzeysel temellerde taşıma gücü sınır durumu ile oturma ve yerdeğiştirme kontrollerinin neden ayrı yapıldığını; TBDY 16.7-16.8 tasarım etkileri, dayanım katsayıları ve deprem durumlarıyla açıklar.",
  seoTitle: "Temel Taşıma Gücü ve Oturma Kontrolü | TBDY 16.7-16.8",
  seoDescription: "Yüzeysel temelde Et ≤ Rt, qo ≤ qt, dayanım katsayıları, oturma-yerdeğiştirme ve depremde zemin davranışı kontrollerinin profesyonel mühendislik akışı.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "iki-ayri-kabul",
      title: "Taşıma gücü yeterli olması, oturmanın kabul edilebilir olduğu anlamına gelmez",
      content: phase4Lines(
        "TBDY **16.7.1.1**, deprem etkisi altında temel tasarımının iki amacı olduğunu açıkça ayırır: **temel taşıma gücünün aşılmaması** ve **zemin yerdeğiştirmelerinin izin verilebilir sınırlar altında kalması**.",
        "",
        "Bu ayrım yüzeysel temel hesabının ana karar ağacıdır. Zemin göçmesine karşı yeterli dayanımı olan bir radye veya sürekli temel, servis koşullarında yapının toleransını aşan toplam/farklı oturma üretebilir. Tersi durumda oturma küçük görünürken taşıma gücü sınır durumu yetersiz olabilir.",
        "",
        "| Kontrol | Cevap verdiği soru | Tipik sonuç |",
        "|---|---|---|",
        "| Taşıma gücü | Olası göçme mekanizmasına karşı tasarım dayanımı yeterli mi? | Dayanım sınır durumu |",
        "| Oturma/yerdeğiştirme | Temel ve üstyapı deformasyonu kabul edilebilir mi? | Kullanılabilirlik/performans kontrolü |"
      ),
      subsections: [],
    },
    {
      id: "tasima-gucu-ilkesi",
      title: "16.7.2 taşıma gücü ilkesi: her göçme mekanizmasında tasarım etkisini tasarım dayanımıyla karşılaştırın",
      content: phase4Lines(
        "TBDY **16.7.2**, yüzeysel ve derin temellerin geoteknik tasarımında taşıma gücü ilkesini esas alır ve genel koşulu **Et ≤ Rt** olarak verir. Et, statik veya depremi içeren yükleme durumuna ait tasarım etkisini; Rt ise ilgili göçme mekanizmasına karşı tasarım dayanımını ifade eder.",
        "",
        "TBDY **16.7.3.1** uyarınca depremli temel etkileri, düşey yüklerle birlikte taşıyıcı sistemden temele aktarılan deprem kuvvetleri esas alınarak hesaplanır. Bu nedenle Geoteknik Rapordaki dayanım değeri ile yapısal modelden alınan etki aynı tasarım durumuna ait olmalıdır.",
        "",
        "Karakteristik dayanım doğrudan Et ile karşılaştırılmaz. **16.7.4**, tasarım dayanımı Rt'nin karakteristik dayanımın ilgili dayanım katsayısına bölünmesiyle elde edildiğini tanımlar."
      ),
      subsections: [],
    },
    {
      id: "yuzeysel-temel-dayanim",
      title: "16.8 yüzeysel temel kontrolünde taban basıncı; düşey yük, kesme ve moment etkisini birlikte taşır",
      content: phase4Lines(
        "TBDY **16.8.1.1**, tekil, sürekli ve radye temellerde taşıma gücü ile yatayda kaymaya karşı tasarım dayanımlarının statik ve depremli yükleme durumlarını karşılamasını ister.",
        "",
        "**16.8.3.1** için temel taşıma gücü kontrolü **qo ≤ qt** koşuluyla ifade edilir. Buradaki qo, temel seviyesinde düşey yük, kesme ve moment etkilerinin oluşturduğu **temel taban basıncıdır**; qt ise taşıma gücüne karşılık gelen tasarım dayanımıdır.",
        "",
        "| Tablo 16.2 dayanım türü | Dayanım katsayısı |",
        "|---|---:|",
        "| Temel taşıma gücü | **1.4** |",
        "| Sürtünme direnci | **1.1** |",
        "| Pasif direnç | **1.4** |",
        "",
        "Bu katsayılar 'emniyet gerilmesi' ile karıştırılmamalıdır; TBDY'nin taşıma gücü yaklaşımındaki karakteristik dayanımdan tasarım dayanımına geçiş içindir."
      ),
      subsections: [],
    },
    {
      id: "oturma-yerdegistirme",
      title: "16.8.3.4: yerdeğiştirme kontrolünü depremdeki dayanım ve rijitlik kaybından koparmayın",
      content: phase4Lines(
        "TBDY **16.8.3.4**, temel altındaki yerdeğiştirmelerin izin verilebilir sınırlar içinde kalmasını ister. Deprem etkisinde yumuşak killerde ve suya doygun gevşek-orta sıkı kohezyonsuz zeminlerde çevrimsel yükler altında boşluk suyu basıncı artışı ile olası dayanım ve rijitlik kaybı dikkate alınarak temel altı yerdeğiştirmeleri hesaplanır.",
        "",
        "Aynı madde, belirli yüksek bina ve DTS/zemin sınıfı koşullarında yüzeysel temeller altındaki doğrusal olmayan zemin davranışı hesaba katılarak kalıcı şekildeğiştirmelerin hesaplanmasını da düzenler.",
        "",
        "Bu nedenle rapordaki 'tahmini oturma' tablosunu tek başına kopyalamak yeterli değildir. Toplam oturma, farklı oturma ve gerekiyorsa deprem sonrası kalıcı deformasyonun üstyapının taşıyıcı ve taşıyıcı olmayan eleman toleranslarıyla birlikte değerlendirilmesi gerekir."
      ),
      subsections: [],
    },
    {
      id: "hesap-akisi",
      title: "Proje hesabını yük seviyesi ve kontrol türüne göre ayırın",
      content: phase4Lines(
        "Profesyonel temel kontrol tablosunda aynı kolon/perde reaksiyonlarını tek bir 'zemin gerilmesi' satırında eritmeyin. En az aşağıdaki akışı ayırın:",
        "",
        "1. Statik ve depremli tasarım birleşimlerinden temel etkilerini üretin.",
        "2. N-M-V etkilerinden temel taban basıncı ve temas durumunu belirleyin.",
        "3. Taşıma gücü için karakteristik dayanımdan ilgili dayanım katsayısıyla tasarım dayanımına geçin.",
        "4. Her yükleme durumunda qo ≤ qt kontrolünü yapın.",
        "5. Servis/performans durumları için toplam ve farklı oturma hesabını ayrı yürütün.",
        "6. Yeraltı suyu, çevrimsel yumuşama veya sıvılaşma gibi koşullar varsa deprem deformasyon senaryosunu ayrıca değerlendirin.",
        "",
        "Bu ayrım, 'zemin emniyet gerilmesi kaç?' sorusunu tek sayıdan oluşan bir temel tasarımına dönüştürmeyi engeller."
      ),
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık yapılan hatalar",
      content: phase4Lines(
        "- Taşıma gücü yeterliyse oturma kontrolünü atlamak.",
        "- Geoteknik Rapordaki karakteristik dayanımı doğrudan tasarım etkisiyle karşılaştırmak.",
        "- Statik ve depremli yükleme durumlarını tek bir ortalama taban basıncında birleştirmek.",
        "- Moment ve eksantrisite etkisini ortalama N/A gerilmesine indirgemek.",
        "- Yeraltı suyu ve çevrimsel boşluk suyu basıncı artışını yerdeğiştirme hesabından çıkarmak.",
        "- Toplam oturmayı kontrol edip farklı oturma/üst yapı hassasiyetini incelememek.",
        "- Geoteknik rapordaki yük seviyesi ile statik model reaksiyonlarının yük seviyesini eşleştirmemek."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "1. Temel tipini ve Geoteknik Rapordaki tasarım parametrelerini güncel proje geometrisiyle eşleştirin.",
        "2. 16.7.1.1'e göre taşıma gücü ile yerdeğiştirme kontrollerinin ikisinin de yapıldığını doğrulayın.",
        "3. Et ≤ Rt karşılaştırmasında etki ve dayanımın aynı tasarım durumuna ait olduğunu kontrol edin.",
        "4. 16.8.3.1 kapsamında qo hesabında N, M ve V etkilerinin temsil edildiğini doğrulayın.",
        "5. Tablo 16.2 dayanım katsayılarının doğru dayanım bileşenine uygulandığını kontrol edin.",
        "6. Oturma hesabında toplam, farklı ve gerekiyorsa depremde kalıcı yerdeğiştirme sonuçlarını ayırın.",
        "7. Yeraltı suyu ve problemli zemin davranışlarının taşıma gücü ve yerdeğiştirme senaryolarında tutarlı olduğunu belgeleyin."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018, 16.7 ve 16.8", href: TBDY_PDF, note: "Temel tasarım amacı, taşıma gücü ilkesi, yüzeysel temel dayanım katsayıları ve yerdeğiştirme hükümleri resmî metinden doğrulanmıştır." },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası", href: TBDY_PAGE },
    { label: "ÇŞİDB Yapı İşleri — Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı", href: ZEMIN_TEBLIG_PAGE },
  ],
  keywords: ["temel taşıma gücü", "oturma", "Et ≤ Rt", "qo ≤ qt", "TBDY 16.8", "temel taban basıncı"],
  tags: ["Zemin ve Temel", "Taşıma Gücü", "Oturma"],
};
