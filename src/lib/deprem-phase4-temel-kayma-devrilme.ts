import { PHASE4_UPDATED_AT, TBDY_PAGE, TBDY_PDF, phase4Lines, type DepremPhase4Override } from "./deprem-phase4-shared";

const ZEMIN_TEBLIG_PAGE = "https://yapiisleri.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formati-haber-238674";

export const DEPREM_PHASE4_TEMEL_KAYMA_DEVRILME: DepremPhase4Override = {
  slug: "temel-kayma-devrilme-guvenligi",
  description: "Yüzeysel temellerde yatay kayma, pasif direnç, moment-eksantrisite ve temel taban basıncı kontrollerinin TBDY 16.7-16.8 kapsamında nasıl ayrıldığını; jenerik bir devrilme emniyet katsayısı varsaymadan açıklar.",
  seoTitle: "Temelde Kayma ve Devrilme Kontrolü | TBDY 16.7-16.8",
  seoDescription: "TBDY'ye göre temel yatay kayması, sürtünme ve pasif direnç, %30 sınırı, Vth ≤ Rth + 0.3 Rpt ve moment-temel taban basıncı kontrolü.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "kontrolleri-ayir",
      title: "Kayma ile devrilme/temas problemini tek bir emniyet katsayısında birleştirmeyin",
      content: phase4Lines(
        "Yüzeysel temelde yatay yük, eğilme momenti ve eksenel kuvvet aynı temel sisteminde oluşur; fakat TBDY bunların geoteknik karşılıklarını farklı mekanizmalarla ele alır.",
        "",
        "**16.7.3.2**, tasarıma esas eksenel kuvvet ve eğilme momentinin temel tabanındaki düşey taşıma gücü ile karşılanacağını belirtir. **16.7.3.3** ise yatay kesme kuvvetini taban sürtünmesi ve sınırlı pasif toprak direnciyle ilişkilendirir.",
        "",
        "Bu nedenle yönetmelikte verilmemiş tek bir 'devrilme emniyet katsayısı' uydurmak yerine momentin oluşturduğu eksantrisite/temas ve **temel taban basıncı** dağılımını taşıma gücü kontrolünde, yatay kaymayı ise ayrı kayma dayanımı kontrolünde izlemek gerekir.",
        "",
        "| Etki | Esas geoteknik kontrol |",
        "|---|---|",
        "| N + M | Düşey taşıma gücü, temas ve taban basıncı |",
        "| V | Taban sürtünmesi + izin verilen pasif direnç |"
      ),
      subsections: [],
    },
    {
      id: "yatay-kesme",
      title: "16.7.3.3: pasif toprak basıncının tamamı yatay dirence eklenemez",
      content: phase4Lines(
        "TBDY **16.7.3.3**, tasarıma esas yatay kesme kuvvetinin zemin ile temel tabanı arasındaki sürtünme direnciyle birlikte temel yan yüzündeki pasif toprak basıncının **en çok %30**'u dikkate alınarak karşılanmasını ister.",
        "",
        "Bu sınır, projede pasif direncin fiziksel olarak gerçekten mevcut olduğu varsayımını ayrıca ortadan kaldırmaz. Temel yanındaki zeminin kazıyla kaldırılması, tesisat hendeği, gevşek geri dolgu veya kalıcı drenaj detayı gibi durumlar pasif direncin sürekliliğini etkiliyorsa hesap kabulü saha detayıyla doğrulanmalıdır.",
        "",
        "Pratik kontrol tablosunda yatay tasarım kuvveti, sürtünme katkısı ve kullanılan pasif direnç ayrı sütunlarda gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kayma-denklemi",
      title: "16.8.4.1: yüzeysel temelin kayma denklemini yükleme durumu bazında uygulayın",
      content: phase4Lines(
        "TBDY **16.8.4.1**, statik ve depremi içeren her yükleme durumu için yatay kayma koşulunu **Vth ≤ Rth + 0.3 Rpt** olarak verir. Vth temel tabanındaki tasarım yatay kuvveti, Rth tasarım sürtünme direnci, Rpt ise tasarım pasif direncidir.",
        "",
        "Tablo 16.2'de yüzeysel temel için sürtünme direnci dayanım katsayısı **1.1**, pasif direnç dayanım katsayısı **1.4** olarak verilir. Yani karakteristik sürtünme ve pasif dirençleri doğrudan yatay kuvvetle karşılaştırmak yerine ilgili tasarım dirençlerine geçilir.",
        "",
        "**16.8.4.2-16.8.4.6** drenajlı/drenajsız koşul, taban-zemin sürtünmesi ve yeraltı suyu altındaki deprem durumu için ilave kurallar içerir. Sürtünme katsayısını yalnız genel bir 'beton-zemin' değeri seçerek raporun zemin ve su koşullarından koparmayın."
      ),
      subsections: [],
    },
    {
      id: "moment-temas",
      title: "Moment ve eksantrisiteyi temel taban basıncına geri taşıyın",
      content: phase4Lines(
        "TBDY **16.8.3.1**'deki qo, yalnız N/A değildir; temel seviyesindeki düşey yük, kesme ve **moment** etkilerinin oluşturduğu temel taban basıncıdır. Bu tanım, devrilme eğiliminin taşıma gücü ve temas dağılımından koparılamayacağını gösterir.",
        "",
        "Model momenti arttığında bileşke taban merkezinden uzaklaşır; basınç dağılımı değişir ve bazı model kabullerinde temas alanı küçülebilir. Bu durumda yalnız ortalama basınç raporlamak kritik kenar basıncını ve temel-zemin temasını gizler.",
        "",
        "TBDY bu bölümde tüm yüzeysel temeller için tek bir evrensel 'Mdirenç/Mdevrilme ≥ ...' oranı vermez. Proje raporu, N-M-V etkilerinin taban basıncı, taşıma gücü ve kayma kontrollerine nasıl dönüştürüldüğünü açıkça göstermelidir."
      ),
      subsections: [],
    },
    {
      id: "su-ve-pasif-direnc",
      title: "Yeraltı suyu ve saha detayı kayma direncinin bir parçasıdır",
      content: phase4Lines(
        "TBDY **16.8.4.6**, yeraltı su seviyesi altındaki temellerde deprem tasarım sürtünme direncinin zeminin drenajsız kayma dayanımı esas alınarak hesaplanmasını ister. Bu hüküm, su seviyesini yalnız bodrum yalıtımı konusu olarak görmemek gerektiğini gösterir.",
        "",
        "Pasif direncin kullanılabilmesi için temel yanındaki zeminin geometri, sıkılık ve kalıcılık bakımından proje ömrü boyunca bu mekanizmayı sağlayacağı gösterilmelidir. Hesapta pasif direnç yazıp uygulama paftasında temel yanını gevşek tesisat dolgusu olarak bırakmak aynı tasarım değildir.",
        "",
        "Saha kontrolünde temel kotu, yan dolgu malzemesi/sıkıştırması, drenaj hattı ve sonradan yapılabilecek kazılar geoteknik hesap kabulüyle eşleştirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık yapılan hatalar",
      content: phase4Lines(
        "- Kayma ve moment/temas kontrolünü tek bir 'devrilme emniyet katsayısı' ile kapatmak.",
        "- Pasif toprak direncinin %100'ünü yatay dayanım olarak almak.",
        "- Tablo 16.2'deki 1.1 ve 1.4 dayanım katsayılarını atlayarak karakteristik dirençleri kullanmak.",
        "- N-M etkisindeki taban basıncını ortalama N/A gerilmesine indirgemek.",
        "- Yeraltı suyu altındaki deprem kayma kontrolünde drenajsız davranışı dikkate almamak.",
        "- Pasif dirence güvenip temel yan dolgusu ve kalıcı kazı/tesisat koşullarını uygulama projesinde kontrol etmemek.",
        "- Kayma kontrolünü yalnız tek yönde yapıp iki yatay doğrultunun kritik yük birleşimlerini taramamak."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "1. Temel tabanındaki N, Mx, My, Vx ve Vy tasarım etkilerini yük birleşimi bazında çıkarın.",
        "2. 16.7.3.2 uyarınca N-M etkilerini taşıma gücü ve taban basıncı kontrolüne bağlayın.",
        "3. 16.7.3.3 uyarınca yatay dirençte pasif toprak basıncının en çok %30'unu kullandığınızı doğrulayın.",
        "4. 16.8.4.1 için her kritik durumda Vth ≤ Rth + 0.3 Rpt koşulunu kontrol edin.",
        "5. Sürtünme ve pasif direnç için 1.1 ve 1.4 dayanım katsayılarının doğru uygulandığını kontrol edin.",
        "6. Moment nedeniyle temel taban basıncı ve temas dağılımının kritik kenarlarda kontrol edildiğini doğrulayın.",
        "7. Yeraltı suyu, yan dolgu ve saha geometrisinin hesapta kullanılan sürtünme/pasif direnç mekanizmasıyla uyumlu olduğunu sahada doğrulayın."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018, 16.7 ve 16.8", href: TBDY_PDF, note: "Eksenel-moment etkileri, yatay kesme, dayanım katsayıları ve yüzeysel temel kayma denklemleri resmî metinden doğrulanmıştır." },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası", href: TBDY_PAGE },
    { label: "ÇŞİDB Yapı İşleri — Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı", href: ZEMIN_TEBLIG_PAGE },
  ],
  keywords: ["temel kayması", "devrilme", "Vth", "pasif direnç", "%30", "temel taban basıncı", "TBDY 16.8.4"],
  tags: ["Zemin ve Temel", "Kayma", "Temel Güvenliği"],
};
