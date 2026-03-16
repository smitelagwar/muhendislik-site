import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const MEP_TOOLS: BinaGuideTool[] = [
  { category: "Mekanik", name: "Revit MEP / MagiCAD", purpose: "Şaft, cihaz ve asma tavan çakışmalarını model üzerinde çözmek." },
  { category: "Elektrik", name: "Caneco / benzeri yük ve devre araçları", purpose: "Pano, kesit ve dağıtım kararlarını doğrulamak." },
  { category: "Kontrol", name: "Excel / Python test ve devreye alma tabloları", purpose: "Basınç, izolasyon, debi ve etiketleme kayıtlarını izlemek." },
  { category: "Çizim", name: "AutoCAD koordinasyon paftaları", purpose: "Şaft ve mahal bazlı saha uygulamasını okunabilir hale getirmek." },
];

const getTesisatExtraSpecs = (): BinaGuidePageSpec[] => [
  {
    slugPath: "tesisat-isleri/isitma-sogutma",
    kind: "topic",
    quote: "Isıtma-soğutma sistemlerinde konfor, cihaz kapasitesinden çok dağıtımın dengeli kurulmasıyla hissedilir.",
    tip: "Isıtma-soğutma hatları test edilmeden ve dengeleme düşünülmeden kapatılırsa sorun kullanıcıya dengesiz sıcaklık olarak döner.",
    intro: [
      "Isıtma-soğutma sistemleri, mekan konforunu sağlayan cihaz, borulama, dağıtım ve kontrol elemanlarını kapsar. Yerden ısıtma, radyatör, klima veya merkezi hatlar farklı çözümler sunsa da ortak ihtiyaç dengeli dağılımdır.",
      "Bu nedenle proje ve saha tarafında yalnızca cihaz seçimi değil; devre boyu, bakım erişimi, izolasyon ve devreye alma da birlikte ele alınmalıdır.",
    ],
    theory: [
      "Mekanik konfor sistemlerinde kullanıcı memnuniyetsizliği çoğu zaman cihaz eksikliğinden değil, dağıtımın dengesiz olmasından kaynaklanır. Uzak devreler ısınmaz, bazı hatlar aşırı çalışır veya sistem gürültü üretir.",
      "Boru güzergahı, kollektör yerleşimi, yoğuşma drenajı ve izolasyon kalınlığı saha performansını doğrudan etkiler.",
      "Bu yüzden ısıtma-soğutma işleri, enerji verimi kadar servis erişimi ve devre dengelemesi disipliniyle de yönetilmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Dağıtım ve hijyen",
        limitOrRequirement: "Hatlar, cihazlar ve kontrol elemanları bakım erişimli olmalı",
        reference: "MEP uygulama disiplini",
        note: "Bakım görmeyen sistem konfor sürekliliği sağlayamaz.",
      },
      {
        parameter: "Yalıtım ve enerji verimi",
        limitOrRequirement: "Hat ve cihaz izolasyonu enerji kaybını sınırlamalı",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Enerji kaybı kadar yoğuşma riski de göz önüne alınmalıdır.",
      },
      {
        parameter: "Devre boyu ve dengeleme",
        limitOrRequirement: "Dağıtım sistemi dengeli devre uzunluklarıyla kurulmalı",
        reference: "Sistem tasarım ilkeleri",
        note: "Özellikle yerden ısıtma ve kollektörlü sistemlerde kritiktir.",
      },
    ],
    designOrApplicationSteps: [
      "Sistem tipini mahal kullanımı ve enerji hedefiyle birlikte seç.",
      "Kollektör, cihaz ve boru güzergahlarını bakım erişimine göre yerleştir.",
      "Yerden ısıtma veya hidronik devrelerde boy ve dengeleme mantığını önceden kur.",
      "Basınç testi, izolasyon ve yoğuşma drenaj kontrollerini kapatma öncesi tamamla.",
      "Devreye alma sırasında sıcaklık dağılımı ve dengeleme ayarlarını kayda bağla.",
    ],
    criticalChecks: [
      "Kollektör ve cihazlar erişilebilir mi?",
      "Devre boyları ve dağıtım dengesi uygun mu?",
      "Basınç testi ve izolasyon tamamlandı mı?",
      "Yoğuşma drenajı ve tahliye kontrol edildi mi?",
      "Devreye alma sırasında sıcaklık dağılımı doğrulandı mı?",
    ],
    numericalExample: {
      title: "Yerden ısıtma devre boyu yorumu örneği",
      inputs: [
        { label: "Mahal alanı", value: "32 m²", note: "Salon" },
        { label: "Planlanan devre sayısı", value: "3 adet", note: "Kollektörlü sistem" },
        { label: "Devre başı uzunluk", value: "95-105 m", note: "Örnek saha planı" },
        { label: "Hedef", value: "Dengeli devre boyu", note: "Homojen ısı dağılımı için" },
      ],
      assumptions: [
        "Borular eşit aralıklı serilecektir.",
        "Kollektör konumu mahale uygundur.",
        "Şap öncesi basınç altında kayıt alınacaktır.",
      ],
      steps: [
        {
          title: "Devre dağılımını değerlendir",
          result: "95-105 m aralığı birbirine yakın olduğundan dengeleme daha kolaydır.",
          note: "Bir devre çok uzarsa basınç kaybı ve performans farkı oluşur.",
        },
        {
          title: "Şap öncesi kontrolü yorumla",
          result: "Devreler basınç altında foto-kayıt ve test ile teslim edilmelidir.",
          note: "Şap sonrası müdahale maliyeti çok yüksektir.",
        },
      ],
      checks: [
        "Devre boyları aşırı dengesiz bırakılmamalıdır.",
        "Kollektör erişimi ve etiketleme unutulmamalıdır.",
        "Şap öncesi test ve kayıt tamamlanmalıdır.",
      ],
      engineeringComment: "Isıtma-soğutma sistemlerinde kullanıcı en çok cihazı değil, dağıtımın dengesini hisseder.",
    },
    tools: MEP_TOOLS,
    equipmentAndMaterials: MEP_EQUIPMENT,
    mistakes: [
      { wrong: "Devre boylarını sahada rastgele ayırmak.", correct: "Dengeli dağıtım mantığıyla planlamak." },
      { wrong: "Kollektörü erişimsiz yere koymak.", correct: "Bakım ve dengeleme erişimini korumak." },
      { wrong: "Şap öncesi test yapmadan sistemi kapatmak.", correct: "Basınç ve foto-kayıtla teslim almak." },
      { wrong: "Yoğuşma drenajını ikincil görmek.", correct: "Soğutma sisteminde ana kontrol kalemi saymak." },
      { wrong: "Devreye alma ayarlarını kayıtsız bırakmak.", correct: "Dengeleme değerlerini teslim dokümanına işlemek." },
    ],
    designVsField: [
      "Tasarım tarafında ısıtma-soğutma şeması yeterli görünür; sahada ise boru boyu, izolasyon, drenaj ve bakım erişimi sistemi gerçekten çalıştırır.",
      "Bu yüzden konfor tesisatı, en çok devreye alma anında mühendislik niteliğini belli eder.",
    ],
    conclusion: [
      "Isıtma-soğutma işleri doğru dağıtım ve doğru kayıtla yürütüldüğünde enerji verimli ve dengeli konfor sağlar. Yanlış yürütüldüğünde cihaz kapasitesi yeterli olsa bile kullanıcı memnuniyetsizliği ortaya çıkar.",
    ],
    sources: [...TESISAT_SOURCES, SOURCE_LEDGER.ts825],
    keywords: ["ısıtma soğutma", "yerden ısıtma", "devre boyu", "mekanik dengeleme", "konfor tesisatı"],
  },
  {
    slugPath: "tesisat-isleri/yangin-tesisati",
    kind: "topic",
    quote: "Yangın tesisatı, yangın anında çalışması beklendiği için diğer sistemlerden daha fazla önceden doğrulanmak zorundadır.",
    tip: "Yangın hattında küçük ihmal, normal günde görünmeyebilir; ama kritik anda sistemin tamamını değersiz hale getirebilir.",
    intro: [
      "Yangın tesisatı; aktif söndürme, yangın suyu dağıtımı, alarm ve ekipman erişimini kapsayan, güvenlik odaklı bir sistemdir.",
      "Bu sistemin değeri günlük kullanımda değil, acil durumda ortaya çıktığı için tasarım, montaj ve test disiplininin diğer sistemlerden daha sıkı kurulması gerekir.",
    ],
    theory: [
      "Yangın tesisatında ana amaç, doğru debi ve basıncı doğru noktaya güvenle ulaştırmaktır. Ancak bu amaç yalnızca boru çapı seçimiyle değil; zonlama, vana düzeni, geçiş güvenliği ve bakım erişimiyle tamamlanır.",
      "Sistem çoğu zaman diğer mekanik ve elektrik sistemlerle aynı şaftları paylaşır. Bu nedenle yangın hattı, aktif koruma sistemi olduğu için koordinasyonda öncelikli düşünülmelidir.",
      "Yangın tesisatı ayrıca düzenli test ve kontrol gerektirir; testlenmeyen sistem güvence üretmez.",
    ],
    ruleTable: [
      {
        parameter: "Yangın koruma sistemi",
        limitOrRequirement: "Zonlama, ekipman ve kaçış stratejisiyle uyumlu olmalı",
        reference: "Yangın Yönetmeliği",
        note: "Sistem yalnızca boru hattı değildir; bütüncül güvenlik paketidir.",
      },
      {
        parameter: "Bakım ve erişim",
        limitOrRequirement: "Vana, dolap ve test noktaları erişilebilir kalmalı",
        reference: "Yangın Yönetmeliği + saha disiplini",
        note: "Kapatma arkasında bırakılan elemanlar bakım kabiliyetini yok eder.",
      },
      {
        parameter: "Test ve devreye alma",
        limitOrRequirement: "Fonksiyon ve basınç kontrolleri kayıtlı yapılmalı",
        reference: "Sistem kalite planı",
        note: "Acil durumda çalışacak sistem, normal günde doğrulanmalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Yangın senaryosu, zonlama ve ekipman yerleşimini proje başında netleştir.",
      "Hat güzergahı, vana odası ve dolap erişimini mimariyle birlikte çöz.",
      "Geçiş ve durdurucu detaylarını diğer tesisatlarla çakışmayacak şekilde planla.",
      "Basınç ve fonksiyon testlerini devreye alma öncesi tamamla.",
      "Bakım talimatı, etiketleme ve test kayıtlarını teslim dosyasına ekle.",
    ],
    criticalChecks: [
      "Dolap, vana ve test noktaları erişilebilir mi?",
      "Yangın hatları diğer sistemlerle çakışıyor mu?",
      "Geçiş detayları yangın güvenliğine uygun mu?",
      "Basınç ve fonksiyon testleri tamamlandı mı?",
      "Etiketleme ve bakım talimatı hazır mı?",
    ],
    numericalExample: {
      title: "Yangın dolabı hattı için erişim ve test mantığı örneği",
      inputs: [
        { label: "Kat sayısı", value: "5", note: "Orta yükseklikte yapı" },
        { label: "Yangın dolabı", value: "her katta 1 adet", note: "Örnek kurgu" },
        { label: "Test noktası", value: "ana hatta 1 + kat bazlı kontrol", note: "Teslim öncesi plan" },
        { label: "Hedef", value: "Erişilebilir ve testlenmiş sistem", note: "Bakım güvenliği için" },
      ],
      assumptions: [
        "Dolap yerleri kaçış ve kullanım senaryosuna göre seçilmiştir.",
        "Vana erişimi kapatılmayacaktır.",
        "Testler teslim öncesi kayıt altına alınacaktır.",
      ],
      steps: [
        {
          title: "Erişim ihtiyacını yorumla",
          result: "Her katta ekipman görünür ve erişilebilir olmalıdır.",
          note: "Dekoratif gizleme güvenlik performansını zayıflatır.",
        },
        {
          title: "Test mantığını kur",
          result: "Ana hat ve kat bazlı kontrol noktaları birlikte planlanmalıdır.",
          note: "Sistem sadece monte edilmekle güvenilir hale gelmez.",
        },
      ],
      checks: [
        "Yangın ekipmanı önünde depolama veya kapatma yapılmamalıdır.",
        "Test kayıtları teslim dosyasında yer almalıdır.",
        "Sistemin zon mantığı saha personeli tarafından anlaşılabilir olmalıdır.",
      ],
      engineeringComment: "Yangın tesisatında erişim ve test, boru çapı kadar hayati iki tasarım çıktısıdır.",
    },
    tools: MEP_TOOLS,
    equipmentAndMaterials: MEP_EQUIPMENT,
    mistakes: [
      { wrong: "Yangın hattını diğer sistemlerle aynı önemde görmek.", correct: "Güvenlik önceliği vererek koordinasyonu çözmek." },
      { wrong: "Dolap ve vana önlerini kapatmak.", correct: "Bakım erişimini sürekli açık bırakmak." },
      { wrong: "Testi teslim sonu formalitesi saymak.", correct: "Sistemin güvenilirlik kanıtı olarak görmek." },
      { wrong: "Geçişleri yangın durdurucusuz bırakmak.", correct: "Yangın güvenliği detayıyla tamamlamak." },
      { wrong: "Etiketleme yapmadan sistemi devretmek.", correct: "Ekipman ve zon bilgisini açık biçimde tanımlamak." },
    ],
    designVsField: [
      "Projede yangın hattı bir güvenlik çizgisi gibi görünür; sahada ise erişim, test ve bakım yapılabilirlik bu sistemin gerçek değerini belirler.",
      "Bu nedenle yangın tesisatı, yalnızca montaj kalemi değil, işletme güvenliği disiplini olarak görülmelidir.",
    ],
    conclusion: [
      "Yangın tesisatı doğru kurulduğunda acil durumda güven veren sistem haline gelir. Hatalı kurulduğunda ise fark edilmesi en geç, bedeli en ağır sorunlardan birini üretir.",
    ],
    sources: [...TESISAT_SOURCES, SOURCE_LEDGER.yanginYonetmeligi],
    keywords: ["yangın tesisatı", "yangın dolabı", "sprinkler", "yangın yönetmeliği", "aktif yangın güvenliği"],
  },
];

const MEP_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Test", name: "Basınç test pompası", purpose: "Temiz su, ısıtma ve bazı yangın hatlarında sızdırmazlık kontrolü yapmak.", phase: "Kapatma öncesi" },
  { group: "Test", name: "Megger ve multimetre", purpose: "Elektrik tesislerinde izolasyon ve devre sürekliliğini ölçmek.", phase: "Devreye alma" },
  { group: "Montaj", name: "Vana, kollektör ve etiketleme setleri", purpose: "Bakım erişimi ve hat tanımlamasını kalıcı hale getirmek.", phase: "Montaj" },
  { group: "Montaj", name: "Askı, kelepçe ve izolasyon malzemeleri", purpose: "Hatları titreşim, ses ve ısı kaybına karşı korumak.", phase: "Montaj" },
  { group: "Kontrol", name: "Termal kamera / debi ölçüm yardımcıları", purpose: "Devreye alma sırasında sıcaklık ve dağılım sorunlarını görmek.", phase: "Devreye alma" },
];

const TESISAT_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];

export const tesisatIsleriSpecs: BinaGuidePageSpec[] = [
  ...getTesisatExtraSpecs(),
  {
    slugPath: "tesisat-isleri",
    kind: "branch",
    quote: "Tesisat işleri görünmez olabilir; ama yapının günlük çalışmasını belirleyen asıl omurga çoğu zaman burada kurulur.",
    tip: "Montajın bitmiş görünmesi, sistemin teslime hazır olduğu anlamına gelmez; test, etiketleme ve bakım erişimi tamamlanmadıkça iş eksiktir.",
    intro: [
      "Tesisat işleri, binanın günlük kullanım kalitesini belirleyen mekanik, elektrik ve yangın sistemlerinin kurulduğu fazdır. Bu sistemler çoğu zaman görünmez hale geldiği için hatalar geç fark edilir ve düzeltme maliyeti yüksek olur.",
      "Bu rehber; sıhhi tesisat, elektrik tesisatı, ısıtma-soğutma ve yangın tesisatını tek tek değil, bakım erişimi ve devreye alma disiplini ortak paydasında ele alır.",
      "Amaç, kapatma öncesi testlenmiş, etiketlenmiş ve işletmeye hazır sistem mantığı kurmaktır.",
    ],
    theory: [
      "Tesisat işleri, geometri kadar işlev de yönetir. Bir hat doğru yerde olsa bile test edilemiyor veya bakım erişimi bırakılmamışsa sistem teknik olarak eksik kabul edilmelidir.",
      "MEP fazında en büyük sorun, sistemlerin ayrı ekiplerce kurulup aynı şaft ve asma tavanı paylaşmasıdır. Bu nedenle koordinasyon, sahadaki tüm görünmez imalatların ortak dilidir.",
      "Tesisat kalitesi ayrıca kayıt kültürüne bağlıdır. Basınç testi, izolasyon ölçümü, etiketleme ve as-built güncellemeleri olmadan teslim güvence üretmez.",
    ],
    ruleTable: [
      {
        parameter: "Temiz su ve atık su",
        limitOrRequirement: "Hijyen, eğim ve bakım erişimi sağlanmalı",
        reference: "TS EN 806 + TS EN 12056",
        note: "Kapama öncesi test ve gözlem zorunlu kabul edilmelidir.",
      },
      {
        parameter: "Elektrik güvenliği",
        limitOrRequirement: "Koruma, topraklama ve etiketleme sistemi tamamlanmalı",
        reference: "TS HD 60364",
        note: "Kurulum kadar devreye alma ve ölçüm de sistemin parçasıdır.",
      },
      {
        parameter: "Yangın performansı",
        limitOrRequirement: "Aktif ve pasif sistemler birlikte düşünülmeli",
        reference: "Yangın Yönetmeliği",
        note: "Borulama, zonlama ve geçişler ayrı ayrı bırakılmamalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Şaft, cihaz odası ve asma tavan koordinasyonunu saha başlamadan kilitle.",
      "Montaj sırasını test ve kapatma önceliğine göre planla.",
      "Her sistem için devreye alma ve etiketleme matrisi oluştur.",
      "Kapatma öncesi basınç, izolasyon ve fonksiyon testlerini tamamla.",
      "As-built ve işletme teslim dosyasını montajla eş zamanlı güncelle.",
    ],
    criticalChecks: [
      "Şaft ve tavan koordinasyonu kapatma öncesi çözüldü mü?",
      "Hatların test ve bakım erişimi var mı?",
      "Etiketleme devreye alma öncesi tamamlandı mı?",
      "As-built kayıtları montajla birlikte güncelleniyor mu?",
      "Yangın ve elektrik güvenlik sistemleri ortak kontrol gördü mü?",
    ],
    numericalExample: {
      title: "MEP teslim hazırlığı için test matrisi örneği",
      inputs: [
        { label: "Ana sistem sayısı", value: "4", note: "Sıhhi, elektrik, HVAC, yangın" },
        { label: "Kapatma öncesi test türü", value: "3 ana test grubu", note: "Basınç, izolasyon, fonksiyon" },
        { label: "Etiketlenecek ana ekipman", value: "85 adet", note: "Pano, vana, kollektör, cihaz" },
        { label: "Hedef", value: "Tamamı kayda bağlı teslim", note: "İşletme başlangıcı için" },
      ],
      assumptions: [
        "Sistemler ayrı ekipler tarafından kurulmuştur.",
        "Test sonuçları merkezi tabloda toplanacaktır.",
        "Kapatma öncesi eksikler aynı gün raporlanacaktır.",
      ],
      steps: [
        {
          title: "Test yükünü yorumla",
          result: "4 sistem için 3 ana test grubu, paralel ama tek kayıtta yürütülmelidir.",
          note: "Dağınık test kayıtları teslim kalitesini düşürür.",
        },
        {
          title: "Etiketleme hacmini planla",
          result: "85 ekipman için standart kodlama olmadan bakım takibi yapılamaz.",
          note: "Etiketleme teslim sonrası değil, montaj sonu işi olmalıdır.",
        },
      ],
      checks: [
        "Testler sistem bazlı değil, teslim bazlı tek matriste toplanmalıdır.",
        "Etiketleme yapılmamış ekipman işletmeye devredilmemelidir.",
        "As-built ve test kaydı aynı referans kodlarını kullanmalıdır.",
      ],
      engineeringComment: "Tesisat kalitesi, kapandığında değil; kapatılmadan önce ne kadar ölçülebildiğiyle anlaşılır.",
    },
    tools: MEP_TOOLS,
    equipmentAndMaterials: MEP_EQUIPMENT,
    mistakes: [
      { wrong: "Montaj bitince sistemi tamamlanmış saymak.", correct: "Test, etiket ve teslim kaydını da zorunlu görmek." },
      { wrong: "Şaft ve tavan çakışmalarını sahada çözmeye çalışmak.", correct: "Koordinasyonu önceden model veya overlay ile kapatmak." },
      { wrong: "Bakım erişimini dekoratif kapatma arkasında unutmak.", correct: "Erişim noktalarını tasarım aşamasında tanımlamak." },
      { wrong: "As-built çizimlerini iş sonuna bırakmak.", correct: "Montaj ilerledikçe güncellemek." },
      { wrong: "Etiketlemeyi işletme ekibine devretmek.", correct: "Kurulumun parçası olarak yapmak." },
    ],
    designVsField: [
      "Tasarım aşamasında hat ve cihaz yerleri öne çıkar; sahada ise sistemin gerçekten çalıştırılabilir ve bakım yapılabilir olması daha kritik hale gelir.",
      "Bu nedenle tesisat işleri, görünmeyen imalatın ölçülebilir kaliteye çevrildiği fazdır.",
    ],
    conclusion: [
      "Tesisat işleri doğru yönetildiğinde bina çalışır, bakımı yapılabilir ve güvenli hale gelir. Hatalı yönetildiğinde ise en pahalı sorunlar, görünmeyen hatların arkasında birikir.",
    ],
    sources: TESISAT_SOURCES,
    keywords: ["tesisat işleri", "MEP koordinasyonu", "devreye alma", "etiketleme", "kapatma öncesi test"],
  },
  {
    slugPath: "tesisat-isleri/sihhi-tesisat",
    kind: "topic",
    quote: "Sıhhi tesisat, boru döşemek değil; hijyen, eğim ve servis erişimini aynı sistemde yaşatmaktır.",
    tip: "Temiz su ve pis su sistemleri proje üzerinde çözülmeden kapatılırsa, problem kullanıcıya koku, gürültü ve kaçak olarak döner.",
    intro: [
      "Sıhhi tesisat; temiz su, sıcak su, pis su, havalık ve armatür bağlantılarının birlikte çalıştığı, bakım erişimi gerektiren bir sistem bütünüdür.",
      "Bu sistemin kalitesi sadece boru malzemesiyle değil; eğim, havalık, vana erişimi ve kapatma öncesi test disipliniyle belirlenir.",
    ],
    theory: [
      "Temiz su tarafında hijyen, basınç ve dengeleme önemlidir; atık su tarafında ise eğim, havalık ve geri tepme riskinin yönetimi öne çıkar.",
      "Sıhhi tesisat hatları çoğu zaman şaft, ıslak hacim ve tavan içinde gizlenir. Bu yüzden kapatma öncesi kayıtsız bırakılan bir hata sonradan en zor müdahale edilen kusurlardan biri haline gelir.",
      "İyi sıhhi tesisat tasarımı ve uygulaması, kullanıcı fark etmeden düzgün çalışan sistemdir.",
    ],
    ruleTable: [
      {
        parameter: "Temiz su hijyeni ve dağıtımı",
        limitOrRequirement: "Hatlar test edilebilir ve bakım erişimli olmalı",
        reference: "TS EN 806",
        note: "Vana ve kritik bağlantı noktaları erişilebilir kalmalıdır.",
      },
      {
        parameter: "Pis su eğimi ve havalık",
        limitOrRequirement: "Akışı bozmayacak eğim ve havalık düzeni kurulmalı",
        reference: "TS EN 12056",
        note: "Koku ve geri tepme riski çoğu zaman burada doğar.",
      },
      {
        parameter: "Kapatma öncesi test",
        limitOrRequirement: "Basınç ve sızdırmazlık kayıtları tamamlanmalı",
        reference: "Saha kalite planı",
        note: "Foto-kayıt ve test raporu birlikte tutulmalıdır.",
      },
    ],
    designOrApplicationSteps: [
      "Temiz su, sıcak su ve pis su güzergahlarını ıslak hacim planıyla birlikte çöz.",
      "Şaft, havalık ve düşey kolon yerlerini bakım erişimine göre belirle.",
      "Yatay pis su hatlarında eğim ve yön değişimlerini görünür şekilde planla.",
      "Kapatma öncesi basınç ve sızdırmazlık testlerini tamamla.",
      "Vana, sayaç ve temizleme noktalarını etiketleyerek teslim et.",
    ],
    criticalChecks: [
      "Pis su hattında gerekli eğim korunuyor mu?",
      "Havalık sistemi doğru bağlandı mı?",
      "Temiz su hatlarında basınç testi tamamlandı mı?",
      "Vana ve temizleme noktaları erişilebilir mi?",
      "Islak hacim kapatılmadan önce foto-kayıt alındı mı?",
    ],
    numericalExample: {
      title: "Pis su hattı eğim yorumu örneği",
      inputs: [
        { label: "Hat uzunluğu", value: "6,0 m", note: "Banyo çıkışı ile kolona kadar" },
        { label: "Hedef eğim", value: "%1,5", note: "Örnek proje yaklaşımı" },
        { label: "Gerekli kot farkı", value: "9 cm", note: "6,0 m boyunca" },
        { label: "Hat çapı", value: "Ø100", note: "Örnek atık su hattı" },
      ],
      assumptions: [
        "Hatta ters eğim yaratacak kot engeli yoktur.",
        "Dirsek sayısı minimumda tutulacaktır.",
        "Kolon bağlantısı doğru kotta hazırlanmıştır.",
      ],
      steps: [
        {
          title: "Kot farkını hesapla",
          formula: "6,0 m x %1,5 = 0,09 m",
          result: "Toplam 9 cm düşüş gerekir.",
          note: "Bu değer, şaft ve döşeme geçişleriyle birlikte okunmalıdır.",
        },
        {
          title: "Uygulanabilirliği yorumla",
          result: "Düşüş sağlanamıyorsa rota veya çözüm revize edilmelidir.",
          note: "Eğimi şantiyede rastgele azaltmak doğru değildir.",
        },
      ],
      checks: [
        "Gerekli kot farkı uygulamada korunmalıdır.",
        "Dirsek ve birleşimler akışı bozmayacak şekilde düzenlenmelidir.",
        "Kapama öncesi su testi veya gözlem yapılmalıdır.",
      ],
      engineeringComment: "Sıhhi tesisatta santimetre seviyesindeki kot kararı, kullanım konforunu yıllarca etkiler.",
    },
    tools: MEP_TOOLS,
    equipmentAndMaterials: MEP_EQUIPMENT,
    mistakes: [
      { wrong: "Pis su eğimini sahada göz kararı vermek.", correct: "Kot ve uzunlukla ölçülü ilerlemek." },
      { wrong: "Vana ve temizleme noktalarını kapatmak.", correct: "Bakım erişimini görünür bırakmak." },
      { wrong: "Basınç testini formalite görmek.", correct: "Kayıtlı ve sistematik yapmak." },
      { wrong: "Havalık sistemini önemsiz görmek.", correct: "Koku ve akış davranışı için zorunlu kabul etmek." },
      { wrong: "Islak hacmi test tamamlanmadan kapatmak.", correct: "Foto-kayıt ve testten sonra ilerlemek." },
    ],
    designVsField: [
      "Tasarım tarafında birkaç boru hattı gibi görünen sıhhi tesisat, sahada ses, koku, bakım ve sızdırmazlık davranışı üretir.",
      "Bu nedenle sıhhi tesisatın başarısı, kullanıcı hissetmeden düzgün çalışabilmesidir.",
    ],
    conclusion: [
      "Sıhhi tesisat doğru kurulduğunda yapı sessiz ve sorunsuz çalışır. Hatalı kurulduğunda ise kullanıcı şikayetleriyle en hızlı görünür hale gelen sistemlerden biri olur.",
    ],
    sources: [...TESISAT_SOURCES, SOURCE_LEDGER.tsEn806, SOURCE_LEDGER.tsEn12056],
    keywords: ["sıhhi tesisat", "pis su eğimi", "temiz su", "TS EN 806", "TS EN 12056"],
  },
  {
    slugPath: "tesisat-isleri/elektrik-tesisati",
    kind: "topic",
    quote: "Elektrik tesisatı, akımı taşımaktan önce güvenli koruma ve okunabilir devre mantığı kurmalıdır.",
    tip: "Kabloyu döşemek kolaydır; zor olan, yıllar sonra bakım ekibinin o kabloyu güvenle okuyup müdahale edebilmesidir.",
    intro: [
      "Elektrik tesisatı; enerji dağıtımı, priz-aydınlatma devreleri, pano sistemi, kablolama güzergahları ve topraklama düzenini kapsar.",
      "Bu sistemin kalitesi, devrelerin çalışması kadar güvenli kapanma, etiketleme ve erişilebilir bakım düzeniyle ölçülür.",
    ],
    theory: [
      "Elektrik tesisatında tasarım hedefi yalnızca enerji vermek değildir; kaçak akım, kısa devre, seçicilik ve bakım güvenliği gibi koruma ilkeleri de aynı derecede önemlidir.",
      "Kablo tavaları, borulama ve pano yerleşimi mimariden bağımsız düşünülemez. Fiziksel güzergah hataları, sonradan en çok kırma ve düzenleme gerektiren işlerden biridir.",
      "Bu nedenle elektrik tesisatı, çizimle başlayan ama ölçüm ve etiketlemeyle tamamlanan sistem işidir.",
    ],
    ruleTable: [
      {
        parameter: "Devre koruması ve topraklama",
        limitOrRequirement: "Koruma düzeni ve topraklama sürekliliği doğrulanmalı",
        reference: "TS HD 60364",
        note: "Devreye alma ölçümleri yapılmadan teslim tamamlanmış sayılmaz.",
      },
      {
        parameter: "Kablo güzergahı",
        limitOrRequirement: "Fiziksel taşıma sistemi bakım ve rezerv bırakmalı",
        reference: "TS HD 60364 + saha koordinasyonu",
        note: "Tava doluluğu ve erişim birlikte değerlendirilmelidir.",
      },
      {
        parameter: "Pano ve etiketleme",
        limitOrRequirement: "Devreler açıkça tanımlanmalı ve erişilebilir kalmalı",
        reference: "Elektrik uygulama disiplini",
        note: "Etiketsiz pano uzun vadede güvenlik riski üretir.",
      },
    ],
    designOrApplicationSteps: [
      "Pano ve devre şemasını yük listesiyle birlikte kesinleştir.",
      "Kablo güzergahlarını şaft ve tavan koordinasyonuna göre yerleştir.",
      "Topraklama ve eşpotansiyel bağlantıları montajın başından itibaren kur.",
      "İzolasyon, süreklilik ve fonksiyon testlerini devreye alma öncesi tamamla.",
      "Tüm devre ve ekipmanları etiketleyerek as-built setine işle.",
    ],
    criticalChecks: [
      "Pano önü ve bakım erişimi yeterli mi?",
      "Kablo tavaları aşırı dolu mu?",
      "Topraklama sürekliliği ölçüldü mü?",
      "İzolasyon testleri tamamlandı mı?",
      "Etiketleme sistemi as-built ile uyumlu mu?",
    ],
    numericalExample: {
      title: "Pano etiketleme ve devre sayısı için bakım örneği",
      inputs: [
        { label: "Pano devre sayısı", value: "36 adet", note: "Aydınlatma, priz ve özel yükler birlikte" },
        { label: "Etiketsiz devre adedi", value: "5 adet", note: "Devreye alma öncesi tespit" },
        { label: "Hedef", value: "0 etiketsiz devre", note: "Teslim kriteri" },
        { label: "Kritik risk", value: "Bakım sırasında yanlış müdahale", note: "İşletme güvenliği" },
      ],
      assumptions: [
        "Pano şeması güncel haldedir.",
        "Devre numaraları saha etiketleriyle eşleşecektir.",
        "Etiketsiz devreler teslim öncesi kapatılacaktır.",
      ],
      steps: [
        {
          title: "Uygunsuzluk oranını oku",
          formula: "5 / 36 ≈ %14",
          result: "Pano devrelerinin önemli bölümü bakım açısından belirsizdir.",
          note: "Çalışan sistem, tanımlı sistem demek değildir.",
        },
        {
          title: "Teslim kararını yorumla",
          result: "Etiketsiz devreler tamamlanmadan pano teslim edilmemelidir.",
          note: "Etiketleme güvenlik ekipmanının bir parçasıdır.",
        },
      ],
      checks: [
        "Her devre panoda ve saha ucunda aynı kodla tanımlanmalıdır.",
        "Etiketleme as-built çizimle uyumlu olmalıdır.",
        "İzolasyon ve fonksiyon testi etiketsiz devre bırakmadan tamamlanmalıdır.",
      ],
      engineeringComment: "Elektrik tesisatında görünmez kalite, çoğu zaman ölçüm ve etiketleme disiplininde saklıdır.",
    },
    tools: MEP_TOOLS,
    equipmentAndMaterials: MEP_EQUIPMENT,
    mistakes: [
      { wrong: "Kablo güzergahını boşluk buldukça değiştirmek.", correct: "Koordinasyon planına sadık kalmak." },
      { wrong: "Etiketlemeyi sonradan yapılacak iş saymak.", correct: "Montajın ayrılmaz parçası yapmak." },
      { wrong: "Topraklama ölçüsünü atlamak.", correct: "Teslim öncesi zorunlu test saymak." },
      { wrong: "Pano önünü farklı ekipmanlarla kapatmak.", correct: "Bakım alanını korumak." },
      { wrong: "İzolasyon testi olmadan devreye alma yapmak.", correct: "Ölçüm zincirini tamamlamak." },
    ],
    designVsField: [
      "Tasarımda tek hat şeması yeterli görünür; sahada ise kablo yolu, pano erişimi ve etiketleme olmadan güvenli işletme mümkün değildir.",
      "Bu nedenle elektrik tesisatının gerçek kalitesi, montaj tamamlandığında değil ölçüm kayıtları çıktığında görülür.",
    ],
    conclusion: [
      "Elektrik tesisatı doğru planlandığında hem güvenli hem okunabilir olur. Hatalı planlandığında ise yıllarca sürecek bakım ve güvenlik sorunları üretir.",
    ],
    sources: [...TESISAT_SOURCES, SOURCE_LEDGER.tsHd60364],
    keywords: ["elektrik tesisatı", "topraklama", "pano etiketleme", "TS HD 60364", "devreye alma"],
  },
];
