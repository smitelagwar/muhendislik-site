import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";
import { inceIslerLeafSpecs } from "./ince-isler-leaves";
import { inceIslerMoreLeafSpecs } from "./ince-isler-more-leaves";
import { inceIslerTopicOverrides } from "./ince-isler-topic-overrides";

const FINISH_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "AutoCAD / Revit detay paftaları", purpose: "Bitiş, profil ve doğrama detaylarını saha ile eşlemek." },
  { category: "Kontrol", name: "Excel bitiş matrisi", purpose: "Mahal listesi, kaplama ve ürün teslimlerini aynı tabloda izlemek." },
  { category: "Ölçüm", name: "Nem ve yüzey kontrol şablonları", purpose: "Kaplama öncesi yüzey hazırlığını ölçülebilir hale getirmek." },
  { category: "Enerji", name: "Isı köprüsü / U-değer kontrol araçları", purpose: "Doğrama ve kabuk detaylarında performans kararlarını karşılaştırmak." },
];

const getInceExtraSpecs = (): BinaGuidePageSpec[] => [
  {
    slugPath: "ince-isler/zemin-kaplamalari",
    kind: "topic",
    quote: "Zemin kaplaması, malzeme seçiminden önce yüzeyin bu malzemeyi taşımaya hazır olup olmadığıyla başlar.",
    tip: "Seramik, parke veya taş seçimi doğru olsa bile alt zemin nemli ve dalgalıysa şikayet kaçınılmaz hale gelir.",
    intro: [
      "Zemin kaplamaları, mekanın kullanım yoğunluğu, bakım beklentisi, ıslaklık riski ve akustik konforuna göre seçilen nihai yüzey sistemleridir.",
      "Seramik, parke, epoksi ya da mermer gibi farklı ürünler ortak bir şeye ihtiyaç duyar: kontrollü nem, düzgün alt yüzey ve temiz bitiş detayları.",
    ],
    theory: [
      "Zemin kaplaması performansı yalnızca üst malzemenin dayanım sınıfıyla açıklanamaz. Alt yüzey düzlemselliği, nem durumu, yapıştırıcı uyumu ve derz detayı asıl sonucu belirler.",
      "Kaplama tipleri farklı davranır; örneğin parke neme, seramik derz toleransına, epoksi ise yüzey hazırlığına çok hassastır.",
      "Bu nedenle zemin kaplamaları, mahal bazlı teknik karar matrisiyle yönetilmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey düzgünlüğü",
        limitOrRequirement: "Ürün gereksinimine uygun mastar toleransı sağlanmalı",
        reference: "Saha kalite planı",
        note: "Düzgün olmayan yüzey, kaplama hatasını doğrudan görünür hale getirir.",
      },
      {
        parameter: "Nem durumu",
        limitOrRequirement: "Kaplama tipine uygun nem eşiği doğrulanmalı",
        reference: "Ürün teknik föyü + uygulama disiplini",
        note: "Hassas kaplamalarda nem ölçümü zorunlu kabul edilmelidir.",
      },
      {
        parameter: "Yapıştırıcı ve derz sistemi",
        limitOrRequirement: "Kaplama ve mahal kullanımına uygun seçilmeli",
        reference: "TS EN 12004 / TS EN 13329",
        note: "Aynı mahalde farklı sistemleri karıştırmak risk üretir.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal kullanımına göre kaplama tipini ve bitiş detayını netleştir.",
      "Şap nemi ve yüzey düzgünlüğünü ürün öncesi ölç.",
      "Astar, yapıştırıcı veya altlık sistemini kaplamaya uygun seç.",
      "Derz, süpürgelik ve eşik kararlarını montaj öncesi sabitle.",
      "Tamamlanan yüzeyi koruma planına al ve ağır ekip girişini sınırla.",
    ],
    criticalChecks: [
      "Alt zemin ürüne uygun düzlemsellikte mi?",
      "Nem ölçümü kayıt altına alındı mı?",
      "Eşik ve süpürgelik bitişleri önceden çözüldü mü?",
      "Aynı mahalde farklı ürün birleşimleri detaylandırıldı mı?",
      "Kaplama sonrası yüzey koruması hazır mı?",
    ],
    numericalExample: {
      title: "Parke öncesi nem değerlendirmesi örneği",
      inputs: [
        { label: "Mahal alanı", value: "28 m²", note: "Yatak odası" },
        { label: "Ölçülen CM nemi", value: "%2,4", note: "Üç farklı noktada benzer değer" },
        { label: "Hedef eşik", value: "<%2,0", note: "Hassas parke uygulaması için örnek sınır" },
        { label: "Mastar sapması", value: "2 mm / 2 m", note: "Düzlemsellik uygun" },
      ],
      assumptions: [
        "Kaplama tipi neme duyarlıdır.",
        "Nem ölçümü aynı gün ve aynı cihazla alınmıştır.",
        "Ek kuruma için mahal havalandırması sağlanacaktır.",
      ],
      steps: [
        {
          title: "Nem verisini yorumla",
          formula: "2,4 > 2,0",
          result: "Kaplama için erken davranılmaktadır.",
          note: "Düz yüzey yeterli olsa bile nem kriteri geçilmeden montaj yapılmamalıdır.",
        },
        {
          title: "Takvim kararını ver",
          result: "Kuruma süresi uzatılmalı ve ölçüm tekrarlanmalıdır.",
          note: "Takvim sıkışması ürün garantisini ortadan kaldırabilir.",
        },
      ],
      checks: [
        "Nem verisi eşik altına düşmeden montaj başlatılmamalıdır.",
        "Yüzey düzgünlüğü uygun olsa da tek kriter değildir.",
        "Kaplama takvimi mahal bazında yeniden planlanmalıdır.",
      ],
      engineeringComment: "Zemin kaplamasında doğru zamanlama, doğru ürün seçiminden daha değerlidir.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Nem ölçmeden montaja başlamak.", correct: "Kaplama tipine göre nem eşiğini doğrulamak." },
      { wrong: "Mastar bozukluğunu yapıştırıcıyla telafi etmek.", correct: "Alt yüzeyi önceden tesviye etmek." },
      { wrong: "Eşik ve bitiş detaylarını sonradan çözmek.", correct: "Montaj öncesi tüm birleşimleri planlamak." },
      { wrong: "Aynı mahalde ürün birleşimlerini rastgele yapmak.", correct: "Süpürgelik ve eşik detaylarını paftalamak." },
      { wrong: "Kaplama sonrası korumayı ihmal etmek.", correct: "Tamamlanan yüzeyi hemen korumaya almak." },
    ],
    designVsField: [
      "Mağazada seçilen ürün estetik kararın başlangıcıdır; sahada ise alt zemin ve bitiş detayı ürünün gerçek performansını belirler.",
      "Bu yüzden zemin kaplamaları, ürün kataloğundan çok mahal bazlı uygulama şartnamesiyle yönetilmelidir.",
    ],
    conclusion: [
      "Zemin kaplamaları doğru alt yüzey ve doğru zamanlama ile birleştiğinde uzun ömürlü olur. En pahalı ürün bile nemli ve bozuk yüzey üzerinde başarısız görünür.",
    ],
    sources: [...INCE_SOURCES, SOURCE_LEDGER.tsEn12004, SOURCE_LEDGER.tsEn13329],
    keywords: ["zemin kaplamaları", "parke", "seramik", "şap nemi", "alt yüzey kontrolü"],
  },
  {
    slugPath: "ince-isler/duvar-kaplamalari",
    kind: "topic",
    quote: "Duvar kaplaması, rengin veya desenin değil; yüzey hazırlığının görünür hale gelmiş sonucudur.",
    tip: "Boya, fayans veya duvar kağıdı seçimini yüzey hazırlığından ayırmak, kusuru üst katmanda saklamaya çalışmaktır.",
    intro: [
      "Duvar kaplamaları; boya, fayans, dekoratif kaplama veya duvar kağıdı gibi farklı sistemlerle mekanın görünüşünü ve temizlenebilirliğini belirler.",
      "Bu kalemde asıl başarı, ürün seçiminden önce yüzeyin emicilik, düzgünlük ve nem açısından hazır hale getirilmesidir.",
    ],
    theory: [
      "Duvar kaplamasında yüzeyin emiciliği, pürüzlülüğü ve düzlemselliği ürün performansını doğrudan etkiler. Boya iz yapar, duvar kağıdı kabarır veya fayans derzleri kaçar; çoğu zaman sebep kaplamanın kendisi değil, alt yüzeydir.",
      "Islak hacimlerde ise duvar kaplaması suyla doğrudan temas eden bir sistem olduğu için su yalıtımı ve yapıştırıcı uyumu ayrı önem kazanır.",
      "Bu nedenle duvar kaplamaları mahal bazlı, ürün bazlı ve yüzey bazlı birlikte düşünülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey hazırlığı",
        limitOrRequirement: "Macun, astar ve temizlik işlemleri ürüne uygun yapılmalı",
        reference: "Ürün teknik föyleri + saha kalite planı",
        note: "Aynı hazırlık tüm kaplamalar için geçerli değildir.",
      },
      {
        parameter: "Islak hacim kaplaması",
        limitOrRequirement: "Su yalıtımı ve yapıştırıcı sistemi birlikte seçilmeli",
        reference: "TS EN 12004",
        note: "Fayans altında kalan katmanlar da sistemin parçasıdır.",
      },
      {
        parameter: "Görsel süreklilik",
        limitOrRequirement: "Köşe, bitiş ve derz çizgileri ölçülü olmalı",
        reference: "Saha kabul disiplini",
        note: "Özellikle ışık alan duvarlarda dalga ve şaşıklık daha görünür hale gelir.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal kullanımına göre kaplama tipini ve temizlenebilirlik ihtiyacını belirle.",
      "Alt yüzeyi ürün tipine göre astar, macun veya tesviye ile hazırla.",
      "Köşe, derz ve bitiş çizgilerini lazer veya ip hattı ile kur.",
      "Islak hacimlerde su yalıtımı ve kaplama sistemini birlikte uygula.",
      "Son kat sonrası yüzeyi çizik, iz ve renk sürekliliği açısından kontrol et.",
    ],
    criticalChecks: [
      "Alt yüzey ürüne uygun hazırlandı mı?",
      "Islak hacimlerde su yalıtımı kontrol edildi mi?",
      "Köşe ve bitiş çizgileri düzgün mü?",
      "Fayans veya duvar kağıdı birleşimleri şaşmadan ilerliyor mu?",
      "Işık altında dalga ve iz kontrolü yapıldı mı?",
    ],
    numericalExample: {
      title: "Banyo duvar kaplamasında derz modülü örneği",
      inputs: [
        { label: "Duvar genişliği", value: "240 cm", note: "Banyo ana duvarı" },
        { label: "Karo ölçüsü", value: "60 x 120 cm", note: "Düşey yerleşim" },
        { label: "Derz aralığı", value: "2 mm", note: "Örnek tasarım kararı" },
        { label: "Hedef", value: "Simetrik bitiş", note: "Köşelerde dar parça bırakmamak" },
      ],
      assumptions: [
        "Kaplama merkez aksa göre yerleştirilecektir.",
        "Armatür ve niş konumları modüle dahil edilmiştir.",
        "Köşe dönüşleri önceden çözülecektir.",
      ],
      steps: [
        {
          title: "Modül planını yorumla",
          result: "240 cm genişlikte tam modül ve derz çizgileri simetrik planlanabilir.",
          note: "Ön plan yapılmazsa köşede çok dar parça kalabilir.",
        },
        {
          title: "Niş ve armatür etkisini ekle",
          result: "Görünür merkez çizgisi ile tesisat çıkışları birlikte hizalanmalıdır.",
          note: "Aksi halde ürün pahalı olsa da sonuç zayıf görünür.",
        },
      ],
      checks: [
        "Modül planı, tesisat çıkışlarıyla çakışmamalıdır.",
        "Dar parça riskleri montaj öncesi çözülmelidir.",
        "Derz çizgileri mahal boyunca görsel süreklilik taşımalıdır.",
      ],
      engineeringComment: "Duvar kaplamasında iyi sonuç, ürün kutusu açılmadan önce modül planı yapıldığında alınır.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Yüzey hazırlığını ürün ne olursa olsun aynı yapmak.", correct: "Kaplama tipine göre hazırlık sistemini değiştirmek." },
      { wrong: "Islak hacimde su yalıtımını kaplamadan ayrı düşünmek.", correct: "Tek sistem olarak ele almak." },
      { wrong: "Modül planı yapmadan fayans veya kağıt uygulamak.", correct: "Önce aks ve parça planını çözmek." },
      { wrong: "Işık yönünü dikkate almadan son kat kontrolü yapmak.", correct: "Yan ışık altında da yüzeyi değerlendirmek." },
      { wrong: "Köşe bitişlerini saha kararına bırakmak.", correct: "Profil veya dönüş detayını önceden belirlemek." },
    ],
    designVsField: [
      "Tasarım aşamasında duvar kaplaması renk ve doku olarak seçilir; sahada ise modül, derz, köşe ve su yalıtımı detayları sonucu belirler.",
      "Bu nedenle duvar kaplamaları estetik karar kadar teknik yüzey yönetimidir.",
    ],
    conclusion: [
      "Duvar kaplamaları doğru yüzey ve doğru modül planıyla birleştiğinde uzun ömürlü ve temiz görünür. Yanlış hazırlandığında ise kusur, en görünür yüzeylerde ortaya çıkar.",
    ],
    sources: [...INCE_SOURCES, SOURCE_LEDGER.tsEn12004],
    keywords: ["duvar kaplamaları", "boya", "fayans", "duvar kağıdı", "modül planı"],
  },
  {
    slugPath: "ince-isler/kapi-pencere",
    kind: "topic",
    quote: "Kapı ve pencere sistemleri, boşluğu kapatan eleman değil; ısı, su, hava ve kullanım performansını belirleyen birleşim paketidir.",
    tip: "Doğrama montajını yalnızca kasa yerleştirme işi gibi görmek, sızdırmazlık ve kullanım sorunlarını kaçınılmaz hale getirir.",
    intro: [
      "Kapı ve pencere sistemleri, iç ve dış mekan arasında sadece geçiş sağlamaz; ısı kontrolü, su sızdırmazlığı, akustik ve güvenlik performansını da belirler.",
      "Bu nedenle doğrama montajı, duvar boşluğu, köpük-mastik detayı, denizlik ve eşik çözümü ile birlikte değerlendirilmelidir.",
    ],
    theory: [
      "Doğrama performansı, profil sınıfı veya cam paketi kadar montaj detayına da bağlıdır. Kasa çevresi boşlukları, montaj ankrajı ve dış su yönetimi doğru kurulmazsa ürün performansı kağıt üzerinde kalır.",
      "İç kapılarda kullanım konforu ve akustik; dış doğramalarda ise ısı, hava ve su geçirimsizliği öne çıkar. Her iki durumda da duvarla doğrama arasındaki birleşim kritik bölgedir.",
      "Bu yüzden kapı ve pencere işleri, ürün montajından çok birleşim mühendisliği olarak ele alınmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Montaj boşluğu",
        limitOrRequirement: "Kasa çevresinde kontrollü montaj ve sızdırmazlık payı bırakılmalı",
        reference: "Ürün sistemi + saha detayı",
        note: "Sıfır tolerans montaj, sonradan kırma ve eğrilme üretir.",
      },
      {
        parameter: "Dış su yönetimi",
        limitOrRequirement: "Denizlik, damlalık ve dış mastik sürekliliği sağlanmalı",
        reference: "Cephe ve doğrama uygulama disiplini",
        note: "Su kesilmeyen birleşimlerde performans hızla düşer.",
      },
      {
        parameter: "Isı ve hava performansı",
        limitOrRequirement: "Kabuk detayı TS 825 hedefleriyle uyumlu olmalı",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Doğrama seçimi duvar detayıyla birlikte değerlendirilmelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Doğrama tipini mahal kullanımına ve kabuk performansına göre seç.",
      "Kaba boşluk ölçülerini montaj toleransıyla birlikte doğrula.",
      "Kasa ankraj, köpük, bant ve mastik sistemini detay paftasıyla sabitle.",
      "Dış doğramalarda denizlik ve su tahliye detayını montajla birlikte çöz.",
      "Açılma-kanat, kilit ve sızdırmazlık kontrollerini teslim öncesi yap.",
    ],
    criticalChecks: [
      "Kaba boşluk ölçüleri kasa için yeterli tolerans bırakıyor mu?",
      "Ankraj noktaları ve montaj doğruluğu kontrol edildi mi?",
      "Dış doğramalarda denizlik ve damlalık çözüldü mü?",
      "Kasa çevresi sızdırmazlık sistemi eksiksiz mi?",
      "Açılma-kapanma ve kilit kontrolü yapıldı mı?",
    ],
    numericalExample: {
      title: "Pencere montaj boşluğu için örnek yorum",
      inputs: [
        { label: "Kasa net ölçüsü", value: "140 x 150 cm", note: "PVC pencere" },
        { label: "Hedef kaba boşluk", value: "142-144 x 152-154 cm", note: "Montaj ve sızdırmazlık payı için" },
        { label: "Duvar kalınlığı", value: "20 cm", note: "Isı yalıtımlı dış duvar" },
        { label: "Hedef", value: "Su ve hava geçirimsiz birleşim", note: "Cephe performansı için" },
      ],
      assumptions: [
        "Montaj bandı ve mastik sistemi birlikte kullanılacaktır.",
        "Denizlik detayı önceden çözülmüştür.",
        "Pencere duvar içinde doğru aksa oturtulacaktır.",
      ],
      steps: [
        {
          title: "Boşluk payını yorumla",
          result: "Kasa için yeterli montaj ve köpük/mastik boşluğu bırakılmalıdır.",
          note: "Aşırı dar boşluk, kasayı zorlayarak deformasyon yaratır.",
        },
        {
          title: "Su yönetimini değerlendir",
          result: "Dış birleşimde denizlik ve damlalık yoksa su performansı zayıflar.",
          note: "İyi profil detayı kötü montajı telafi edemez.",
        },
      ],
      checks: [
        "Kasa çevresinde dengeli boşluk bırakılmalıdır.",
        "Pencere montajı sadece köpükle taşınmamalıdır.",
        "Su tahliye detayı montaj tamamlandığında görünür şekilde doğrulanmalıdır.",
      ],
      engineeringComment: "Doğrama kalitesi, ürün katalog değeri kadar montaj detayının doğruluğuyla ölçülür.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Kaba boşluğu sıfır toleransla bırakmak.", correct: "Montaj payını önceden planlamak." },
      { wrong: "Sızdırmazlığı yalnızca silikonla çözmek.", correct: "Bant, köpük ve mastik sistemini birlikte kullanmak." },
      { wrong: "Denizlik detayını sonradan düşünmek.", correct: "Montaj öncesi çözmek." },
      { wrong: "Doğramayı duvarla ilişkisiz görmek.", correct: "Kabuk performansının parçası olarak ele almak." },
      { wrong: "Teslim öncesi açılma-kapanma kontrolünü atlamak.", correct: "Her doğramayı fonksiyonel testten geçirmek." },
    ],
    designVsField: [
      "Projede bir pencere boşluğu çizgisel görünür; sahada ise kasa, ankraj, su tahliyesi, ısı köprüsü ve kullanım konforu aynı birleşimde toplanır.",
      "Bu nedenle kapı-pencere işleri, cephe ve iç mekan performansının eşik kalemidir.",
    ],
    conclusion: [
      "Kapı ve pencere sistemleri doğru montajla birleştiğinde yapı kabuğu güvenle çalışır. Hatalı birleşim ise şikayetleri ilk doğuran ve en görünür sorunlardan biri haline gelir.",
    ],
    sources: [...INCE_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["kapı pencere", "doğrama montajı", "sızdırmazlık", "TS 825", "denizlik detayı"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi",
    kind: "topic",
    quote: "Çatı kaplaması, malzeme seçiminin değil; suyu yöneten katman kurgusunun başarısıdır.",
    tip: "Kiremit, membran veya metal sistem fark etmez; eğim, alt katman ve geçiş detayları çözülmeden kaplama güven vermez.",
    intro: [
      "Çatı kaplaması, üst yapı iskeleti üzerine su geçirmezlik, rüzgar güvenliği ve bakım sürekliliği sağlayan nihai koruma katmanıdır.",
      "Kiremit, membran veya metal kaplama gibi sistemler farklı detaylar istese de ortak hedef aynıdır: suyu güvenle tahliye etmek ve geçiş noktalarını kontrol altında tutmak.",
    ],
    theory: [
      "Çatı kaplamasının ömrü, yalnızca ürün dayanımına değil; eğim, alt katman sürekliliği, sabitleme biçimi ve detay çözümüne bağlıdır.",
      "En zayıf noktalar çoğu zaman geniş düz yüzeyler değil; baca dipleri, parapet birleşimleri, süzgeç çevresi ve mahya/kenar detaylarıdır.",
      "Bu nedenle çatı kaplaması, tek bir ürün montajı değil, bir sistem katmanlaması olarak değerlendirilmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Eğim ve tahliye",
        limitOrRequirement: "Kaplama tipine uygun minimum eğim sağlanmalı",
        reference: "Üretici sistemi + uygulama disiplini",
        note: "Yanlış eğim, suyu malzemeye karşı zorlar.",
      },
      {
        parameter: "Geçiş ve birleşim detayları",
        limitOrRequirement: "Baca, parapet, süzgeç ve mahya detayları sistematik çözülmeli",
        reference: "Çatı detayı ve saha kontrolü",
        note: "Arıza çoğu zaman ana yüzeyde değil birleşim noktasında başlar.",
      },
      {
        parameter: "Sabitleme ve koruma",
        limitOrRequirement: "Rüzgar ve bakım etkileri dikkate alınmalı",
        reference: "Üretici sistemi",
        note: "Özellikle hafif metal sistemlerde sabitleme kritik hale gelir.",
      },
    ],
    designOrApplicationSteps: [
      "Kaplama tipini eğim ve kullanım senaryosuna göre netleştir.",
      "Alt katmanları, buhar kesici veya su yalıtım sistemini kaplamayla uyumlu kur.",
      "Süzgeç, baca ve parapet gibi tüm geçişleri kaplama öncesi detaylandır.",
      "Sabitleme, bindirme ve yön detaylarını üretici sistemiyle uyumlu uygula.",
      "Yağmur suyu tahliyesi ve kritik birleşimleri teslim öncesi test et veya gözlemle doğrula.",
    ],
    criticalChecks: [
      "Çatı eğimi kaplama tipine uygun mu?",
      "Geçiş detayları kaplama öncesi çözülmüş mü?",
      "Süzgeç ve inişler açık ve doğru kotta mı?",
      "Rüzgar ve sabitleme detayları yeterli mi?",
      "Bakım erişimi ve güvenliği düşünülmüş mü?",
    ],
    numericalExample: {
      title: "Teras çatı tahliye eğimi için hızlı hesap örneği",
      inputs: [
        { label: "Yatay mesafe", value: "8,0 m", note: "Süzgece yönlenen yüzey" },
        { label: "Hedef eğim", value: "%2", note: "Örnek tahliye eğimi" },
        { label: "Gerekli kot farkı", value: "16 cm", note: "8,0 m boyunca" },
        { label: "Kaplama", value: "Membran üstü koruma", note: "Teras çatı sistemi" },
      ],
      assumptions: [
        "Süzgeç konumu netleştirilmiştir.",
        "Eğim betonu veya taşıyıcı geometri bu farkı sağlayacaktır.",
        "Parapet ve dönüş detayları ayrıca çözülecektir.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "8,0 m x %2 = 0,16 m",
          result: "En az 16 cm kot farkı gerekir.",
          note: "Suyun bir noktada göllenmeden ilerlemesi hedeflenir.",
        },
        {
          title: "Detay etkisini yorumla",
          result: "Parapet ve süzgeç çevresi bu geometriyi bozmamalıdır.",
          note: "Ana yüzey eğimi doğru olsa da detay kusuru arıza üretir.",
        },
      ],
      checks: [
        "Kot farkı şantiye ölçüsüyle doğrulanmalıdır.",
        "Süzgeç çevresi göllenme yapmayacak şekilde kontrol edilmelidir.",
        "Parapet ve baca dipleri kaplama sistemiyle uyumlu kapatılmalıdır.",
      ],
      engineeringComment: "Çatı kaplaması suyu durdurmaz; onu güvenli biçimde yönlendirir.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Kaplama tipini eğimden bağımsız seçmek.", correct: "Geometriye uygun sistem belirlemek." },
      { wrong: "Baca ve parapet detaylarını sonradan çözmek.", correct: "Kaplama öncesi detaylandırmak." },
      { wrong: "Süzgeç konumunu rastgele belirlemek.", correct: "Tahliye geometrisiyle birlikte planlamak." },
      { wrong: "Sabitleme detaylarını ikinci plana atmak.", correct: "Rüzgar ve bakım koşullarına göre uygulamak." },
      { wrong: "Çatıyı teslim etmeden kritik noktaları kontrol etmemek.", correct: "Birleşim ve tahliye odaklı son kontrol yapmak." },
    ],
    designVsField: [
      "Projede çatı kaplaması tek tarama alanı gibi görünür; sahada ise her süzgeç, parapet ve baca dibi ayrı bir mühendislik düğümüdür.",
      "Bu nedenle çatı kaplamasında asıl kalite, birleşim noktalarında okunur.",
    ],
    conclusion: [
      "Çatı kaplaması doğru sistem kurgusuyla uygulandığında binayı uzun süre korur. Yanlış detaylandırıldığında ise arıza genellikle suyla ve en pahalı noktadan başlar.",
    ],
    sources: [...INCE_SOURCES, SOURCE_LEDGER.ts825],
    keywords: ["çatı kaplaması", "membran", "kiremit", "teras çatı", "su tahliye detayı"],
  },
];

const FINISH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ölçüm", name: "Mastar ve lazer nivo", purpose: "Yüzey düzgünlüğü ve kot kontrolü yapmak.", phase: "Alt yüzey hazırlığı" },
  { group: "Ölçüm", name: "Higrometre / CM nem ölçer", purpose: "Şap ve duvar nemini kaplama öncesi doğrulamak.", phase: "Kaplama öncesi" },
  { group: "Uygulama", name: "Astar, yapıştırıcı ve derz sistemleri", purpose: "Kaplama tipine uygun katman bütünlüğü sağlamak.", phase: "İnce işler" },
  { group: "Uygulama", name: "Profil, köşe çıtası ve bitiş elemanları", purpose: "Görünür köşe ve birleşim kalitesini korumak.", phase: "İnce işler" },
  { group: "Koruma", name: "Yüzey koruma örtüsü", purpose: "Tamamlanan imalatları sonraki ekiplerden korumak.", phase: "Teslim öncesi" },
];

const INCE_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

export const inceIslerSpecs: BinaGuidePageSpec[] = [
  ...getInceExtraSpecs(),
  ...inceIslerLeafSpecs,
  ...inceIslerMoreLeafSpecs,
  ...inceIslerTopicOverrides.filter(
    (spec) => spec.slugPath !== "ince-isler/siva" && spec.slugPath !== "ince-isler/alcipan",
  ),
  {
    slugPath: "ince-isler",
    kind: "branch",
    quote: "İnce işlerde kalite, pahalı malzemeyle değil; doğru hazırlanmış yüzey ve temiz detay kararıyla görünür olur.",
    tip: "Nem, yüzey toleransı ve bitiş kararı çözülmeden malzeme seçmek, sorunu yalnızca üst katmanda gizler.",
    intro: [
      "İnce işler fazı, kullanıcının doğrudan gördüğü kaliteyi üretir. Ancak bu kalite, yalnızca seçilen kaplama veya boya markasından değil; alt yüzey hazırlığı, nem kontrolü ve bitiş detaylarının doğruluğundan doğar.",
      "Sıva, alçıpan, zemin ve duvar kaplamaları, kapı-pencere sistemleri ve çatı kaplaması bu fazın ana halkalarıdır. Her biri bir diğerine tolerans ve bitiş şartı bırakır.",
      "Bu rehber, ince iş kararlarını estetik seçimler değil; mühendislik ve uygulama disiplini olarak ele alır.",
    ],
    theory: [
      "İnce işler, kaba inşaatın bıraktığı geometriyi ve tesisat fazının bıraktığı görünmez doğruluğu devralır. Bu nedenle önceki fazlardan gelen bozukluklar burada maliyetli düzeltmeye dönüşür.",
      "İyi bir ince iş planı; yüzey hazırlığı, nem eşikleri, ürün uyumluluğu ve koruma planını aynı akışta yönetir. Aksi halde en iyi ürün bile zayıf alt yüzey üzerinde beklenen performansı vermez.",
      "Bu yüzden ince işler, görünür kalite kadar bakım ve kullanım performansı için de kritik fazdır.",
    ],
    ruleTable: [
      {
        parameter: "Isı ve yüzey performansı",
        limitOrRequirement: "Kabuk ve iç yüzey kararları TS 825 ve ürün standardıyla uyumlu olmalı",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Doğrama ve kaplama kararları enerji davranışını da etkiler.",
      },
      {
        parameter: "Sıva ve kaplama sistemi",
        limitOrRequirement: "Alt yüzey ve ürün uyumu birlikte sağlanmalı",
        reference: "TS EN 13914 / TS EN 12004 / TS EN 13329",
        note: "Yanlış alt yüzey, kaplamanın ömrünü hızla kısaltır.",
      },
      {
        parameter: "Teslim kalitesi",
        limitOrRequirement: "Yüzey düzgünlüğü, derz ve bitiş detayları ölçülü olmalı",
        reference: "Saha kalite planı",
        note: "İnce işlerin başarısı görsel kontrol kadar ölçülebilir toleranslara bağlıdır.",
      },
    ],
    designOrApplicationSteps: [
      "İnce işlere geçmeden önce nem, yüzey düzgünlüğü ve tesisat kapanışlarını doğrula.",
      "Mahal bazlı bitiş matrisi oluştur ve tüm ekipleri aynı karar setine bağla.",
      "Alt yüzey hazırlığı ile ürün seçimini aynı teslim paketi içinde yönet.",
      "Bitiş, profil ve doğrama detaylarını büyük ölçekte çöz ve sahaya indir.",
      "Tamamlanan yüzeyleri koruma planına al ve sonraki ekip girişini buna göre yönet.",
    ],
    criticalChecks: [
      "Şap ve duvar nemi kaplama öncesi ölçüldü mü?",
      "Mastar toleransları ürün gereksinimini karşılıyor mu?",
      "Mahal listesi ile bitiş ürünleri aynı revizyonda mı?",
      "Doğrama ve kaplama birleşimleri detaylı mı?",
      "Tamamlanan yüzeylerin koruma planı hazır mı?",
    ],
    numericalExample: {
      title: "Zemin kaplaması öncesi nem ve düzlemsellik kontrolü örneği",
      inputs: [
        { label: "Şap alanı", value: "120 m²", note: "Aynı mahal grubu" },
        { label: "Hedef mastar toleransı", value: "≤3 mm / 2 m", note: "Kaplama kalitesini korumak için" },
        { label: "Hedef nem", value: "<%2 CM", note: "Parke benzeri hassas kaplamalar için örnek eşik" },
        { label: "Kontrol noktası", value: "12 nokta", note: "Mahal bazlı örnekleme" },
      ],
      assumptions: [
        "Alt yüzey kaplama öncesi son kez tesviye edilmiş olacaktır.",
        "Nem ölçümü aynı cihaz ve yöntemle yapılacaktır.",
        "Kaplama tipi neme hassastır.",
      ],
      steps: [
        {
          title: "Düzlemsellik dağılımını oku",
          result: "12 kontrol noktasında birkaç yerde 4-5 mm sapma görülüyorsa tesviye tekrarlanmalıdır.",
          note: "Ürün kalitesini alt zemindeki bozuklukla düzeltmek mümkün değildir.",
        },
        {
          title: "Nem verisini karar kriterine bağla",
          result: "Hedef nem aşılmışsa kaplama takvimi ertelenir.",
          note: "İnce işlerde doğru takvim, hızlı takvimden daha değerlidir.",
        },
      ],
      checks: [
        "Nem ve düzlemsellik kayıtları mahal bazında arşivlenmelidir.",
        "Yüzey şartı sağlanmadan ürün montajına geçilmemelidir.",
        "Alt yüzey düzeltmesi ile ürün değiştirme kararı karıştırılmamalıdır.",
      ],
      engineeringComment: "İnce işlerde başarısız görünen malzemenin büyük kısmı, aslında başarısız hazırlanmış alt yüzeyin sonucudur.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Ürünü seçip alt yüzeyi sonra düşünmek.", correct: "Ürün ve yüzey hazırlığını birlikte planlamak." },
      { wrong: "Nem ölçmeden kaplamaya başlamak.", correct: "Mahal bazlı nem kaydı almak." },
      { wrong: "Mastar bozukluğunu yapıştırıcıyla düzeltmeye çalışmak.", correct: "Yüzey tesviyesini önceden tamamlamak." },
      { wrong: "Bitiş detaylarını ustaya bırakmak.", correct: "Profil ve birleşim detaylarını paftada tanımlamak." },
      { wrong: "Tamamlanan ince işleri korumasız bırakmak.", correct: "Yüzey koruma planını zorunlu hale getirmek." },
    ],
    designVsField: [
      "Tasarım aşamasında renk ve doku seçimi öne çıkar; sahada ise nem, profil, derz ve birleşim kalitesi asıl sonucu belirler.",
      "Bu nedenle ince işler, estetik kararların mühendislik disipliniyle ayakta kaldığı fazdır.",
    ],
    conclusion: [
      "İnce işler doğru yönetildiğinde yapının görünen kalitesi güçlü ve sürdürülebilir olur. Hatalı yönetildiğinde ise en pahalı malzeme bile kısa sürede kusur üretir.",
    ],
    sources: INCE_SOURCES,
    keywords: ["ince işler", "yüzey hazırlığı", "nem kontrolü", "mahal bitiş matrisi", "kaplama kalite rehberi"],
  },
  {
    slugPath: "ince-isler/siva",
    kind: "topic",
    quote: "Sıva, yüzeyi kapatmaz; sonraki tüm kaplamalar için referans düzlem üretir.",
    tip: "Sıvayı yalnızca duvarı düzleştirme işi gibi görmek, nem ve aderans problemlerini sonraki katmanlara taşır.",
    intro: [
      "Sıva, iç ve dış yüzeylerde düzlemsellik, aderans, köşe doğruluğu ve boya/kaplama altı hazırlığı sağlayan temel ince iş kalemidir.",
      "İç sıva, dış sıva veya alçı sıva farklı ürünler olabilir; ancak ortak hedef, bir sonraki katman için kontrollü ve çatlak riski azaltılmış yüzey bırakmaktır.",
    ],
    theory: [
      "Sıva sistemi, alt yüzey emiciliği, karışım suyu, katman kalınlığı ve ortam koşullarıyla birlikte değerlendirilir. Uygulama başarısı yalnızca harç kalitesiyle açıklanamaz.",
      "Dış sıvalarda su, sıcaklık farkı ve rüzgar etkisi; iç sıvalarda ise yüzey düzgünlüğü ve boya altı kalite daha belirleyici hale gelir.",
      "Bu nedenle sıva uygulaması, kaba duvar ve ince bitiş arasında teknik bir ara tabaka olarak görülmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey hazırlığı",
        limitOrRequirement: "Alt yüzey temiz, sağlam ve uygun emicilikte olmalı",
        reference: "TS EN 13914",
        note: "Kirli veya gevşek yüzeyde aderans beklenmez.",
      },
      {
        parameter: "Katman kalınlığı",
        limitOrRequirement: "Tek katta aşırı kalınlık yapılmamalı",
        reference: "TS EN 13914",
        note: "Kalınlık arttıkça rötre ve çatlak riski büyür.",
      },
      {
        parameter: "Köşe ve bitiş doğruluğu",
        limitOrRequirement: "Mastar ve köşe profilleri ile kontrol edilmeli",
        reference: "Saha kalite disiplini",
        note: "Boya altı kalite burada belirlenir.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yüzeyi temizle, gevşek bölgeleri ve emicilik farklarını gider.",
      "Gerekli astar veya serpme köprü katmanını uygulayıp yüzeyi hazırlık seviyesine getir.",
      "Mastar çizgilerini ve köşe doğruluğunu kur.",
      "Katman kalınlığını kontrollü uygulayıp ani kuruma riskini yönet.",
      "Boyaya veya kaplamaya geçmeden önce yüzey düzgünlüğünü son kez doğrula.",
    ],
    criticalChecks: [
      "Alt yüzey temiz ve sağlam mı?",
      "Katman kalınlığı uygun aralıkta mı?",
      "Köşe ve dikey hatlarda sapma var mı?",
      "Ani kuruma veya rötre çatlağı riski gözlendi mi?",
      "Sonraki boya/kaplama ekibi için yüzey hazır mı?",
    ],
    numericalExample: {
      title: "Sıva kalınlığı ve mastar toleransı için örnek yorum",
      inputs: [
        { label: "Duvar uzunluğu", value: "4,5 m", note: "Salon duvarı" },
        { label: "Ortalama yüzey bozukluğu", value: "12 mm", note: "Kaba yüzey ölçümü" },
        { label: "Hedef sıva kalınlığı", value: "10-15 mm", note: "İç sıva için örnek aralık" },
        { label: "Mastar toleransı", value: "≤3 mm / 2 m", note: "Boya altı kalite hedefi" },
      ],
      assumptions: [
        "Duvar yüzeyi büyük kırma gerektirmeyecek kadar düzgündür.",
        "Uygulama uygun ortam koşulunda yapılacaktır.",
        "Son kat boya planlanmaktadır.",
      ],
      steps: [
        {
          title: "Yüzey bozukluğunu yorumla",
          result: "12 mm bozukluk, hedef sıva kalınlığı içinde yönetilebilir görünür.",
          note: "Daha büyük sapmalarda alt yüzey düzeltmesi ayrıca gerekebilir.",
        },
        {
          title: "Boya altı kaliteyi kontrol et",
          result: "2 m mastarda 3 mm üstü sapmalar son katta dalga üretir.",
          note: "Bu nedenle mastar kontrolü sonradan değil sıva sırasında yapılmalıdır.",
        },
      ],
      checks: [
        "Aşırı kalın tek kat uygulamadan kaçınılmalıdır.",
        "Köşe ve bitiş çizgileri mastar kadar önemlidir.",
        "Kuruma tamamlanmadan son kat işlere geçilmemelidir.",
      ],
      engineeringComment: "Sıva kalitesi çoğu zaman boya geldiğinde değil, mastar daha duvardayken anlaşılır.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Gevşek yüzeye sıva atmak.", correct: "Alt yüzeyi önce sağlamlaştırmak." },
      { wrong: "Kalınlığı tek katta artırmak.", correct: "Gerekirse katmanlı yaklaşım kullanmak." },
      { wrong: "Köşe doğruluğunu sonradan düzeltmeye çalışmak.", correct: "Başta profil ve mastarla kurmak." },
      { wrong: "Kuruma tamamlanmadan boya altına geçmek.", correct: "Nem ve dayanımı beklemek." },
      { wrong: "Yüzey dalgalarını boya ekibine bırakmak.", correct: "Sıva aşamasında kaliteyi tamamlamak." },
    ],
    designVsField: [
      "Sıva projede nadiren detaylandırılır; sahada ise tüm görünür yüzeyin düzlem kalitesini fiilen belirler.",
      "Bu yüzden sıva, ince işlerin sessiz ama belirleyici tabakasıdır.",
    ],
    conclusion: [
      "Sıva doğru yapıldığında boya, fayans veya dekoratif katmanların performansı yükselir. Hatalı yapıldığında ise ince iş bütçesi görünmeyen düzeltmelere harcanır.",
    ],
    sources: [...INCE_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["sıva", "alçı sıva", "dış sıva", "yüzey düzgünlüğü", "TS EN 13914"],
  },
  inceIslerTopicOverrides.find((spec) => spec.slugPath === "ince-isler/siva")!,
  {
    slugPath: "ince-isler/alcipan",
    kind: "topic",
    quote: "Alçıpan ve asma tavan sistemleri, hafif görünür ama servis ve detay yükü ağır imalatlardır.",
    tip: "Kuru duvar sistemlerinde profil düzeni ve tesisat koordinasyonu çözülmeden levha montajına geçmek, çatlak ve sök-tak döngüsü üretir.",
    intro: [
      "Alçıpan ve asma tavan sistemleri; bölme duvar, tesisat gizleme, akustik düzenleme ve aydınlatma koordinasyonu için tercih edilen hafif yapı çözümleridir.",
      "Bu sistemlerin başarısı, levha kapatıldıktan sonra değil; karkas dizilimi, askı düzeni ve servis geçişleri doğru kurulduğunda anlaşılır.",
    ],
    theory: [
      "Kuru yapı sistemlerinde profil aralığı, askı noktası, levha yönü ve derz bandı davranışı birlikte önem taşır. Hafif sistemler toleranssız değildir; aksine küçük montaj hatalarına daha görünür tepki verir.",
      "Özellikle asma tavanlarda menfez, sprinkler, aydınlatma ve bakım kapağı koordinasyonu çözülmeden kapatma yapmak büyük tekrar üretir.",
      "Bu nedenle alçıpan işi, hafif ama yoğun koordinasyon isteyen bir ince iş paketidir.",
    ],
    ruleTable: [
      {
        parameter: "Karkas düzeni",
        limitOrRequirement: "Profil aralıkları sistem detayına uygun olmalı",
        reference: "Üretici sistemi + saha kalite planı",
        note: "Levha taşıma ve derz davranışı buna bağlıdır.",
      },
      {
        parameter: "Tesisat koordinasyonu",
        limitOrRequirement: "Aydınlatma, menfez ve bakım boşlukları kapatma öncesi çözülmeli",
        reference: "Şantiye koordinasyon disiplini",
        note: "Sonradan kesilen levha yüzey bütünlüğünü zayıflatır.",
      },
      {
        parameter: "Derz ve yüzey işlemi",
        limitOrRequirement: "Bant, macun ve zımpara düzeni katmanlı yapılmalı",
        reference: "Üretici uygulama rehberi",
        note: "Hız baskısı derz çatlaklarını artırır.",
      },
    ],
    designOrApplicationSteps: [
      "Bölme duvar veya tavan aksını mahal ve tesisat planıyla birlikte kur.",
      "Profil ve askı sistemini açıklık ile yük durumuna göre yerleştir.",
      "Tüm servis geçişleri ve bakım kapaklarını kapatma öncesi işaretle.",
      "Levha montajını derz şaşırtmalı ve üretici yönüne uygun tamamla.",
      "Derz, macun ve zımpara işlemlerini tek seferde değil kontrollü katmanlarla yürüt.",
    ],
    criticalChecks: [
      "Profil aralıkları ve askı düzeni doğru mu?",
      "Aydınlatma, menfez ve sprinkler yerleri sabitlendi mi?",
      "Bakım kapağı gerektiren tesisatlar unutuldu mu?",
      "Levha birleşimleri ve derz şaşırtması uygun mu?",
      "Son kat boya öncesi yüzey izleri tamamen giderildi mi?",
    ],
    numericalExample: {
      title: "Asma tavan servis yoğunluğu için ön koordinasyon örneği",
      inputs: [
        { label: "Koridor genişliği", value: "2,0 m", note: "Uzun lineer mahal" },
        { label: "Tavan düşüşü", value: "35 cm", note: "Mekanik ve elektrik servisleri için" },
        { label: "Servis elemanı", value: "menfez + lineer aydınlatma + sprinkler", note: "Yoğun tavan" },
        { label: "Hedef", value: "Bakım kapaklı ve çakışmasız düzen", note: "Tek kapatma ile bitiş" },
      ],
      assumptions: [
        "Servis planları kapatma öncesi dondurulacaktır.",
        "Aydınlatma ve menfez modülü mahal aksına göre hizalanacaktır.",
        "Bakım kapağı kritik vana veya ekipman önünde bırakılacaktır.",
      ],
      steps: [
        {
          title: "Servis yoğunluğunu yorumla",
          result: "2,0 m koridorda eleman dizilimi tek eksende kontrol edilmelidir.",
          note: "Rasgele yerleşim görsel kirlilik ve bakım sorunu doğurur.",
        },
        {
          title: "Bakım erişimini ekle",
          result: "Sadece görünür elemanlar değil, erişilecek gizli noktalar da plana işlenmelidir.",
          note: "Bakım kapağı unutulursa tavan tekrar açılır.",
        },
      ],
      checks: [
        "Servisler çakışmayan ortak eksende çözülmelidir.",
        "Bakım kapağı konumu saha kararına bırakılmamalıdır.",
        "Levha kapatma, tüm servis teyitlerinden sonra yapılmalıdır.",
      ],
      engineeringComment: "Asma tavanın başarısı, gizlediği tesisatı bakım yapılabilir halde bırakabilmesidir.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Profil aralığını göz kararı belirlemek.", correct: "Sistem detayına uygun düzen kurmak." },
      { wrong: "Servis geçişlerini levha kapandıktan sonra açmak.", correct: "Tüm delik ve modülleri önce çözmek." },
      { wrong: "Bakım kapağını unutmak.", correct: "Tesisat ekipleriyle birlikte bakım noktalarını işaretlemek." },
      { wrong: "Derz işlemini tek kat macunla bitirmeye çalışmak.", correct: "Bant ve katmanlı yüzey işlemi uygulamak." },
      { wrong: "Asma tavanı sadece estetik eleman görmek.", correct: "Servis ve bakım sisteminin parçası olarak ele almak." },
    ],
    designVsField: [
      "Projede birkaç kesit çizgisiyle anlatılan alçıpan sistemi, sahada profil, askı, delik, kapak ve servis yoğunluğunun birlikte yönetildiği hassas bir pakettir.",
      "Bu nedenle kuru yapı sistemleri hafif ama yoğun mühendislik koordinasyonu isteyen çözümlerdir.",
    ],
    conclusion: [
      "Alçıpan ve asma tavan doğru yönetildiğinde mekan netliği artar, servisler gizlenir ve bakım erişimi korunur. Yanlış yönetildiğinde ise en çok sökülüp tekrar yapılan ince iş kalemlerinden biri haline gelir.",
    ],
    sources: INCE_SOURCES,
    keywords: ["alçıpan", "asma tavan", "kuru duvar", "bakım kapağı", "servis koordinasyonu"],
  },
];
