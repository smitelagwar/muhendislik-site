import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_ZEMIN_YAPI_ETKILESIMI: DepremPhase4Override = {
  slug: "tbdy-bolum-16-zemin-yapi-etkilesimi",
  description: "TBDY 2018 Bölüm 16 ve EK 16C kapsamında serbest zemin davranışı, yüzeysel temelli yapılarda dinamik yapı-zemin etkileşimi, kazıklı temellerde kinematik/eylemsizlik etkileşimi ve statik zemin yayı modelinin bu kavramlardan farkını açıklar.",
  seoTitle: "TBDY Bölüm 16 Yapı-Zemin Etkileşimi | EK 16C Uygulama Rehberi",
  seoDescription: "Yüzeysel temel ve kazıklı yapılarda dinamik yapı-zemin etkileşimi; serbest zemin analizi, etkin temel hareketi, kinematik ve eylemsizlik etkileşimi ayrımı.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "kavramlari-ayirin",
      title: "Serbest zemin analizi, radye zemin yayı ve dinamik yapı-zemin etkileşimi aynı problem değildir",
      content: phase4Lines(
        "TBDY Bölüm 16'da birbirine yakın görünen üç farklı modelleme problemi vardır: **sahaya özel serbest zemin davranış analizi**, temel altında kullanılan statik/yarı statik **zemin rijitliği modeli** ve deprem dalgaları altında **dinamik yapı-zemin etkileşimi**.",
        "",
        "EK **16C.1.1**, yapı-zemin etkileşimini deprem etkisi altında zemin ortamı ile temel/kazıklar dahil üstyapının karşılıklı etkileşimi olarak tanımlar. Bu tanım, yalnız radye altına düşey yay atamaktan daha geniştir; dalga yayılımı, temel hareketi ve yapının zemine geri etkisini içerir.",
        "",
        "Hesap raporunda hangi problemi çözdüğünüzü açıkça adlandırın. 'Zemin yaylı model kullandım, dolayısıyla SSI yaptım' ifadesi otomatik olarak doğru değildir."
      ),
      subsections: [],
    },
    {
      id: "16-5-serbest-zemin",
      title: "16.5 sahaya özel serbest zemin davranışı temel-yapı sisteminden önce zemin yüzeyi hareketini üretir",
      content: phase4Lines(
        "TBDY **16.5.1.1**, sahaya özel zemin davranış analizinin amacını taban kayasında tanımlanan deprem yer hareketinin zemin tabakaları boyunca değişimini ve zemin yüzeyindeki deprem yer hareketini belirlemek olarak tarif eder.",
        "",
        "Yerel zemin sınıfı **ZF** olan zeminlerde sahaya özel zemin davranış analizi zorunludur. Yaklaşık yatay tabakalı zeminlerde tek boyutlu serbest zemin modeli kullanılabilir; aksi durumda iki veya üç boyutlu zemin modelleri gerekebilir.",
        "",
        "Bu analizde yapı henüz zemin yüzeyi hareketini belirleyen modele dahil değildir. Dolayısıyla 16.5 serbest zemin hesabı ile EK 16C yapı-zemin etkileşimi aynı analiz adımı değildir."
      ),
      subsections: [],
    },
    {
      id: "yuzeysel-temel-16c1-2",
      title: "Yüzeysel temelli binalarda EK 16C.1.2 güvenli tarafta ihmal seçeneğini açıkça tanımlar",
      content: phase4Lines(
        "EK **16C.1.2**, yüzeysel temelli bina türü yapılarda — bodrumlu binalar dahil — göreli yumuşak zemindeki dinamik yapı-zemin etkileşiminin genel olarak binayı elverişli yönde etkilediğini ve zeminden binaya geçen eşdeğer deprem yüklerini azaltabildiğini belirtir.",
        "",
        "Yönetmelik bu nedenle yüzeysel temelli binalarda dinamik yapı-zemin etkileşiminin **güvenli tarafta kalmak üzere ihmal edilebileceğini** ifade eder. Bu cümle, temel deformasyonlarının veya geoteknik oturma/taşıma gücü kontrollerinin yok sayılabileceği anlamına gelmez.",
        "",
        "Yüzeysel temel için radye/tekil temel iç kuvvetlerini üretmek amacıyla zemin yayları kullanılabilir; ancak bu statik temas modeli, 16C.1.2'deki dinamik etkileşim hesabının eşanlamlısı değildir."
      ),
      subsections: [],
    },
    {
      id: "kazikli-temel-etkilesimi",
      title: "Kazıklı temellerde etkileşim problemi kinematik ve eylemsizlik bileşenleriyle büyür",
      content: phase4Lines(
        "EK **16C.1.3**, göreli yumuşak zeminlerde kazıklı binalarda yapı–kazık–zemin etkileşiminin özellikle kazıkların deprem davranışını önemli ölçüde etkileyebileceğini vurgular. Zemin içinde yayılan deprem dalgaları kazıkları zorlar; kazık-temel sistemi de temel hareketinin genlik ve frekans içeriğini değiştirir.",
        "",
        "Bu nedenle kazıklı sistemde iki etkiyi ayırın: **kinematik etkileşim**, zemin deformasyonlarının kazığa ve temele dayattığı hareketleri; **eylemsizlik etkileşimi** ise üstyapı kütlesinden gelen deprem kuvvetlerinin temel-kazık-zemin sistemine geri aktarımını temsil eder.",
        "",
        "EK 16C, bu problem için Yöntem I ve Yöntem II başlıkları altında hesap akışları verir. Kullanılan yöntem proje raporunda açıkça belirtilmelidir."
      ),
      subsections: [],
    },
    {
      id: "serbest-zemin-kazik-girdisi",
      title: "Kazıklı temelde kinematik etkileşim girdisini 16.5 serbest zemin analizinden koparmayın",
      content: phase4Lines(
        "TBDY **16.5.1.4**, sahaya özel serbest zemin analizlerinin sonuçlarının kazıklı temellerde EK 16C'deki **kinematik etkileşim analizlerinde deprem verisi** olarak kullanılacağını açıkça belirtir.",
        "",
        "Bu bağlantı kritik bir veri zinciridir: taban kayası hareketi → serbest zemin profili → derinliğe bağlı zemin hareketleri → kazık kinematik talepleri → üstyapı/temel etkileşimi.",
        "",
        "Serbest zemin modelindeki tabaka kalınlığı, kayma dalgası hızı, doğrusal olmayan dinamik özellikler ve yeraltı suyu kabulleri ile kazık etkileşim modelindeki zemin profili aynı fiziksel sahayı temsil etmelidir."
      ),
      subsections: [],
    },
    {
      id: "model-secim-tablosu",
      title: "Önce hangi mühendislik sorusunu çözdüğünüzü seçin, sonra modeli kurun",
      content: phase4Lines(
        "| Mühendislik sorusu | Ana model / hüküm | Çıktı |",
        "|---|---|---|",
        "| Taban kayası hareketi yüzeyde nasıl değişir? | **TBDY 16.5** sahaya özel serbest zemin analizi | Zemin yüzeyi hareketi / spektrum |",
        "| Radye altındaki temas ve oturma dağılımı nedir? | Geoteknik rapor + yüzeysel temel modeli | Temas basıncı, oturma, temel iç kuvveti |",
        "| Yüzeysel temelde dinamik SSI dikkate alınacak mı? | **EK 16C.1.2** | İhmal / özel etkileşim kararı |",
        "| Kazıklar deprem dalgası ve üstyapı eylemsizliğinden nasıl etkilenir? | **EK 16C** yapı–kazık–zemin etkileşimi | Kazık kuvvet/deformasyonları ve etkin temel hareketi |",
        "",
        "Bu ayrım, aynı 'zemin yayı' kelimesinin farklı yazılımlarda farklı fiziksel anlamlarla kullanılmasından doğan modelleme hatalarını azaltır."
      ),
      subsections: [],
    },
    {
      id: "dogrulama-ve-raporlama",
      title: "Zemin modeli ile üstyapı modelinin ortak parametrelerini tek rapor zincirinde doğrulayın",
      content: phase4Lines(
        "Dinamik etkileşim hesabında zemin profili, taban kayası kabulü, deprem girdisi, sönüm/rijitlik davranışı ve temel geometrisi; üstyapı modelindeki kütle, rijitlik ve temel bağlantılarıyla tutarlı olmalıdır.",
        "",
        "Model sınırlarının yeterince uzakta olması, dalga yansımalarının kontrolü, zemin tabakalarının ağ çözünürlüğü ve kullanılan doğrusal olmayan davranış kabulleri yazılım özelinde ayrıca doğrulanmalıdır. TBDY'nin yöntem seçimi, sayısal model kalite kontrolünün yerine geçmez.",
        "",
        "Hesap raporunda en az şu ifadeler açık olmalıdır: serbest zemin analizi yapıldı mı, dinamik SSI ihmal edildi mi/edilmedi mi, kazıklı sistemde hangi EK 16C yöntemi kullanıldı ve temel hareketi üstyapıya nasıl aktarıldı."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] **16.5 serbest zemin analizi**, statik temel yayı ve **EK 16C dinamik etkileşim** kavramlarını birbirinden ayırdım.",
        "- [ ] ZF zeminlerde sahaya özel zemin davranış analizi gereğini kontrol ettim.",
        "- [ ] Yüzeysel temelde EK **16C.1.2** kapsamındaki güvenli tarafta ihmal kararını bilinçli verdim.",
        "- [ ] Kazıklı temelde kinematik ve eylemsizlik etkileşimini ayrı değerlendirdim.",
        "- [ ] 16.5 serbest zemin sonuçlarını kazık kinematik etkileşim girdileriyle tutarlı kullandım.",
        "- [ ] Geoteknik zemin profili ile üstyapı/temel modelindeki kot ve tabaka tanımlarını eşleştirdim.",
        "- [ ] Kullanılan EK 16C yöntemini ve model sınır koşullarını hesap raporunda belgeledim.",
        "- [ ] 'Zemin yaylı model = dinamik SSI' şeklinde otomatik eşdeğerlik kurmadım."
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 16.5, 16.10 ve EK 16C"),
  keywords: ["yapı-zemin etkileşimi", "EK 16C", "kinematik etkileşim", "eylemsizlik etkileşimi", "serbest zemin", "kazıklı temel"],
  tags: ["yapı-zemin etkileşimi", "kazıklı temel", "sahaya özel analiz", "TBDY Bölüm 16"],
};
