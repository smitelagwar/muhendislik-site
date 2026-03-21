import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";
import { kaziTemelLeafSpecs } from "./kazi-temel-leaves";

const GEOTECH_TOOLS: BinaGuideTool[] = [
  { category: "Geoteknik", name: "PLAXIS / benzeri analiz araçları", purpose: "Derin kazı, deplasman ve temel-etkileşim senaryolarını ön değerlendirmek." },
  { category: "Çizim", name: "AutoCAD Civil 3D", purpose: "Kazı kotları, drenaj hatları ve aplikasyon planlarını düzenlemek." },
  { category: "Kontrol", name: "Excel / Python geoteknik şablonları", purpose: "SPT/N değerleri, oturma ve temel ön kontrollerini hızlı karşılaştırmak." },
  { category: "Harita", name: "Total station veri aktarımı", purpose: "Kazı tabanı, şev ve aplikasyon kontrolünü dijital kayda bağlamak." },
];

const getKaziExtraSpecs = (): BinaGuidePageSpec[] => [
  {
    slugPath: "kazi-temel/hafriyat",
    kind: "topic",
    quote: "Hafriyat, toprağı taşımak değil; temel için güvenli ve ölçülü bir çalışma düzlemi üretmektir.",
    tip: "Kazı planı yoksa ekskavatör ilerler ama şantiye teknik olarak ilerlemez; çünkü kot, su ve şev güvenliği aynı anda yönetilemez.",
    intro: [
      "Hafriyat, şantiyenin en hızlı görünen ama teknik hataya en açık işlerinden biridir. Birkaç saatlik kontrolsüz kazı, haftalar süren düzeltme ve iksa takviyesi ihtiyacı doğurabilir.",
      "Bu rehber; kazı sırası, taban temizliği, şev güvenliği, nakliye lojistiği ve geçici drenajın neden tek paket olarak yönetilmesi gerektiğini anlatır.",
    ],
    theory: [
      "Hafriyatın teknik hedefi, projedeki temel kotunu güvenli ve bozulmamış zemine ulaştırmaktır. Bunun için sadece ekskavatör yeterli değildir; kot kontrolü, su tahliyesi ve zeminin bozulmaması birlikte yönetilmelidir.",
      "Aşırı kazı, tabanı zayıflatır; eksik kazı ise temel kotunun bozulmasına yol açar. Her iki durumda da sonraki aşamalar temel geometrisini kaybeder.",
      "Bu nedenle hafriyat, hız kadar ölçü ve kayıt disiplinine bağlıdır.",
    ],
    ruleTable: [
      {
        parameter: "Kazı tabanı",
        limitOrRequirement: "Projede öngörülen kot ve sağlam zemin düzlemi korunmalı",
        reference: "Saha uygulama disiplini",
        note: "Son birkaç santimetrelik kazı, makine yerine kontrollü şekilde tamamlanabilir.",
      },
      {
        parameter: "Şev / iksa kararı",
        limitOrRequirement: "Kazı derinliği ve komşu etkisine göre güvenlik stratejisi seçilmeli",
        reference: "TS EN 1536 / TS EN 1538 ve geoteknik mühendisliği",
        note: "Şev açısı, zemine ve su durumuna göre yeniden değerlendirilir.",
      },
      {
        parameter: "Geçici drenaj",
        limitOrRequirement: "Su birikmesi kazı tabanında bırakılmamalı",
        reference: "Saha kontrol kriteri",
        note: "Kazı altı su altında kalan projelerde grobeton kalitesi düşer.",
      },
    ],
    designOrApplicationSteps: [
      "Kazı sınırını, kotları ve nakliye güzergahını uygulama öncesi işaretle.",
      "Kazıyı tabaka davranışına göre kademeli ilerlet ve son kotu ölçüyle kapat.",
      "Su çıkışı olan bölgelerde geçici drenaj ve pompa düzenini aynı gün kur.",
      "Kazı tabanını gevşek malzeme ve çamurdan temizleyerek grobeton öncesi teslim et.",
      "Komşu yapı veya yol etkisi varsa kazı ilerleyişini izleme noktalarıyla birlikte yönet.",
    ],
    criticalChecks: [
      "Kazı tabanı proje kotunda mı, aşırı kazı var mı?",
      "Şev veya iksa kararı saha koşuluna göre güncellendi mi?",
      "Kazı çukurunda su birikmesi kalıcı hale geldi mi?",
      "Nakliye ve depolama nedeniyle kazı kenarı aşırı yük aldı mı?",
      "Grobeton öncesi taban temizliği ve son ölçüm kaydı hazır mı?",
    ],
    numericalExample: {
      title: "Kazı tabanı aşırı kazı riskinin hızlı yorumu",
      inputs: [
        { label: "Proje taban kotu", value: "-3,80 m", note: "Temel altı hedef kot" },
        { label: "Ölçülen en düşük nokta", value: "-3,92 m", note: "Kazı sonrası tespit" },
        { label: "Kabul sınırı", value: "±2 cm", note: "Son teslim hedefi" },
        { label: "Sapma", value: "12 cm", note: "Aşırı kazı" },
      ],
      assumptions: [
        "Sapma tek noktada değil, yaklaşık 18 m² alanda gözlenmiştir.",
        "Zemin gevşetilmeden düzeltme yapılması hedeflenmektedir.",
        "Temel geometrisi statik projeye sadık kalacaktır.",
      ],
      steps: [
        {
          title: "Aşırı kazı büyüklüğünü kontrol et",
          formula: "12 cm > 2 cm kabul sınırı",
          result: "Kazı kabul edilemez düzeyde fazla yapılmıştır.",
          note: "Sorun grobeton kalınlığı artırılarak gizlenmemelidir.",
        },
        {
          title: "Düzeltme yaklaşımını belirle",
          result: "Mühendis onaylı tesviye ve zemin düzeltme çözümü gerekir.",
          note: "Temel davranışını etkileyen her düzeltme kayıt altına alınmalıdır.",
        },
      ],
      checks: [
        "Aşırı kazı alanı temel detayına işlenmeden kapatılmamalıdır.",
        "Tesviye malzemesi ve yöntem statik/geoteknik ekip tarafından onaylanmalıdır.",
        "Son kot, düzeltme sonrası yeniden ölçülmelidir.",
      ],
      engineeringComment: "Aşırı kazıyı gizlemek, sorunu çözmek değildir; problemi temel altına gömmektir.",
    },
    tools: GEOTECH_TOOLS,
    equipmentAndMaterials: GEOTECH_EQUIPMENT,
    mistakes: [
      { wrong: "Kazı son kotunu yalnızca makine operatörüne bırakmak.", correct: "Ölçü ekibi ile kademeli kot kontrolü yapmak." },
      { wrong: "Su çıkan bölgeleri sonraya bırakmak.", correct: "Geçici drenajı kazı akışının parçası yapmak." },
      { wrong: "Aşırı kazıyı grobeton kalınlığıyla kapatmak.", correct: "Mühendislik onaylı düzeltme yapıp kayda geçirmek." },
      { wrong: "Kazı kenarına fazla yük yığmak.", correct: "Nakliye ve stok alanını kenar güvenliğine göre planlamak." },
      { wrong: "Grobeton öncesi taban temizliğini ihmal etmek.", correct: "Çamur, gevşek zemin ve suyu tamamen uzaklaştırmak." },
    ],
    designVsField: [
      "Projede birkaç kot çizgisi gibi görünen hafriyat, sahada lojistik, yağış, su çıkışı ve komşu yapı etkileriyle değişken bir operasyondur.",
      "Bu yüzden hafriyat başarısı, kazı hızından çok tabanın kontrollü teslim edilmesiyle ölçülmelidir.",
    ],
    conclusion: [
      "Hafriyat doğru yürütüldüğünde temel için temiz, güvenli ve ölçülü bir başlangıç düzlemi bırakır. Yanlış yürütüldüğünde ise tüm üst fazlara düzeltilmesi zor geometri ve güvenlik sorunları taşır.",
    ],
    sources: KAZI_SOURCES,
    keywords: ["hafriyat", "kazı tabanı", "geçici drenaj", "şev güvenliği", "temel öncesi kazı kontrolü"],
  },
  {
    slugPath: "kazi-temel/iksa-sistemi",
    kind: "topic",
    quote: "İksa sistemi, kazıyı tutmak kadar komşu yapının huzurunu da koruyan görünmez güvenlik katmanıdır.",
    tip: "İksa seçimini kazı derinleştikten sonra değiştirmek, hem maliyeti hem deplasman riskini büyütür.",
    intro: [
      "İksa sistemi, derin veya riskli kazılarda zemini ve çevre yapıları güvenli sınırlar içinde tutmak için kurulan geçici destekleme çözümüdür. Ancak geçici olması, önemsiz olduğu anlamına gelmez.",
      "Fore kazık, diyafram, ankraj veya benzeri sistemlerin seçimi; zemin yapısı, kazı derinliği, su etkisi ve komşu yapı hassasiyeti birlikte değerlendirilerek yapılmalıdır.",
    ],
    theory: [
      "İksa tasarımı, zemin deformasyonunu sıfırlamaya değil; kabul edilebilir sınırlar içinde yönetmeye çalışır. Bu nedenle rijitlik, ankraj seviyesi, kazı kademesi ve izleme sistemi bir paket olarak düşünülür.",
      "Komşu yapı temelleri, yol yükleri ve yeraltı suyu varlığı iksa davranışını doğrudan etkiler. Bu yüzden aynı kazı derinliği farklı parsellerde farklı çözümler gerektirebilir.",
      "İyi bir iksa stratejisi, kazı sırasını da belirler; çünkü destekleme çoğu zaman kazı ile birlikte ardışık ilerler.",
    ],
    ruleTable: [
      {
        parameter: "Derin kazı destekleme",
        limitOrRequirement: "Kazı ilerleyişi ile uyumlu geçici destekleme planı olmalı",
        reference: "TS EN 1536 / TS EN 1538",
        note: "Kazı ve destekleme sırası birlikte tarif edilmeden güvenli davranış beklenemez.",
      },
      {
        parameter: "Komşu yapı etkisi",
        limitOrRequirement: "Deplasman ve oturma riski izleme planına bağlanmalı",
        reference: "Geoteknik mühendisliği uygulamaları",
        note: "Özellikle şehir içi parsellerde izleme zorunlu kabul edilmelidir.",
      },
      {
        parameter: "Su kontrolü",
        limitOrRequirement: "İksa sistemi su etkisi ve drenajla birlikte değerlendirilmelidir",
        reference: "TBDY 2018 + saha güvenliği",
        note: "Sadece taşıyıcı eleman seçimi yeterli değildir; su hareketi de kritik girdidir.",
      },
    ],
    designOrApplicationSteps: [
      "Kazı derinliği, komşu yapı ve yol etkilerini netleştir.",
      "Zemin ve su verisine göre uygun iksa ailesini seç.",
      "Kazı kademelerini, ankraj seviyelerini ve ölçüm noktalarını planla.",
      "İmalat sırasında deplasman ve saha davranışını düzenli izle.",
      "Kazı tamamlanana kadar iksa ve drenaj sisteminin performansını kayıt altında tut.",
    ],
    criticalChecks: [
      "İksa seçimi zemin ve komşu yapı koşuluna gerçekten uygun mu?",
      "Kazı kademeleri ile destekleme sırası tutarlı mı?",
      "Deplasman izleme noktaları ve eşik değerler tanımlı mı?",
      "Yeraltı suyu etkisi sistem davranışına dahil edildi mi?",
      "Ankraj veya perde imalatı kalite kontrol kayıtları tutuluyor mu?",
    ],
    numericalExample: {
      title: "Kademe bazlı kazı ilerleyişi için basit izleme mantığı",
      inputs: [
        { label: "Toplam kazı derinliği", value: "8,0 m", note: "Şehir içi parsel" },
        { label: "Planlanan kademe sayısı", value: "4 kademe", note: "Her biri yaklaşık 2,0 m" },
        { label: "İzleme noktası sayısı", value: "6 adet", note: "Komşu yapı ve yol tarafında" },
        { label: "Uyarı eşiği", value: "12 mm yatay deplasman", note: "Örnek yönetim eşiği" },
      ],
      assumptions: [
        "Her kademe sonrası ölçüm alınacaktır.",
        "Uyarı eşiği aşıldığında kazı hızı ve destekleme dizisi gözden geçirilecektir.",
        "Komşu yapı davranışı eş zamanlı izlenecektir.",
      ],
      steps: [
        {
          title: "Kademe başına ölçüm sıklığını belirle",
          formula: "4 kademe x 1 zorunlu ölçüm = minimum 4 ana okuma",
          result: "Kazı sonuna kadar en az 4 temel ölçüm turu gerekir.",
          note: "Ara risk artışlarında ek okuma yapılmalıdır.",
        },
        {
          title: "Uyarı eşiğini yorumla",
          result: "12 mm yaklaşılırsa kazı ve destekleme sırası teknik kurulda yeniden değerlendirilir.",
          note: "Ölçümün amacı kayıt tutmak değil, davranışı yönetmektir.",
        },
      ],
      checks: [
        "İzleme verisi günlük karar üretmiyorsa sistem amaç dışı kalır.",
        "Eşik aşıldığında teknik reaksiyon prosedürü hazır olmalıdır.",
        "Kazı hızı, ölçüm sonuçlarından bağımsız ilerletilmemelidir.",
      ],
      engineeringComment: "İksa başarısı, sadece perdenin ayakta kalmasıyla değil; komşu yapıya kontrollü davranış bırakmasıyla ölçülür.",
    },
    tools: GEOTECH_TOOLS,
    equipmentAndMaterials: [
      ...GEOTECH_EQUIPMENT,
      { group: "İzleme", name: "İnklinometre / deplasman takibi", purpose: "Kazı çevresindeki hareketleri izlemek.", phase: "Kazı süresince" },
      { group: "İmalat", name: "Ankraj germe ekipmanı", purpose: "Ankrajlı sistemlerde kontrollü yükleme yapmak.", phase: "İksa imalatı" },
    ],
    mistakes: [
      { wrong: "İksayı kazı başladıktan sonra seçmeye çalışmak.", correct: "Kazı derinliği ve komşu etkisine göre sistemi önceden tasarlamak." },
      { wrong: "Deplasman ölçümünü formalite gibi görmek.", correct: "Eşikler ve aksiyon planıyla birlikte izleme yapmak." },
      { wrong: "Yeraltı suyunu iksa kararından bağımsız değerlendirmek.", correct: "Su kontrolünü sistem davranışının parçası olarak görmek." },
      { wrong: "Kazı kademesini projedeki sıradan saparak hız baskısıyla büyütmek.", correct: "Destekleme dizisini bozmadan kademeli ilerlemek." },
      { wrong: "Komşu yapı çatlaklarını başta kayıt altına almamak.", correct: "Başlangıç durumunu dokümante edip sonra izlemek." },
    ],
    designVsField: [
      "Tasarım aşamasında iksa sistemi kesit üzerinde birkaç çizgi olarak görünür; sahada ise zamanlama, deplasman, yağış ve komşu baskısı altında sürekli karar üretir.",
      "Bu yüzden iksa projesi, imalat dizisi ve izleme planı olmadan eksik kabul edilmelidir.",
    ],
    conclusion: [
      "İksa sistemi doğru kurulduğunda kazı derinliğini güvenle yönetir ve komşu yapılara kontrollü davranış bırakır. Yanlış kurulduğunda ise sorun yalnızca kazı içinde değil, parsel dışında da büyür.",
    ],
    sources: [...KAZI_SOURCES, SOURCE_LEDGER.tsEn1536, SOURCE_LEDGER.tsEn1538],
    keywords: ["iksa sistemi", "derin kazı", "ankrajlı iksa", "deplasman takibi", "komşu yapı güvenliği"],
  },
  {
    slugPath: "kazi-temel/temel-turleri",
    kind: "topic",
    quote: "Temel türü seçimi, yapı yükünü zemine aktarmanın değil; oturma ve davranışı yönetmenin mühendisliğidir.",
    tip: "Tekil, sürekli, radye ya da kazıklı temel kararı; maliyet kıyasıyla değil zemin-yük-davranış birlikteliğiyle verilmelidir.",
    intro: [
      "Temel türleri, binanın yükünü zemine nasıl aktaracağını ve oturma davranışını nasıl yöneteceğini belirleyen ana kararlardır. Aynı bina için farklı temel tipleri teknik olarak mümkün olabilir; doğru seçim ise proje koşuluna göre yapılır.",
      "Bu rehber, temel sistemi seçiminin yalnızca taşıma gücü değil; oturma farkları, su etkisi, uygulama sırası ve çevre koşullarıyla birlikte değerlendirilmesi gerektiğini açıklar.",
    ],
    theory: [
      "Temel türü seçimi, yapının zemine uyguladığı gerilmeleri ve zeminin buna verdiği tepkiyi birlikte okur. Zemin tek tip değilse veya yapısal yükler düzensizse, en ucuz görünen çözüm her zaman en doğru çözüm değildir.",
      "Tekil veya sürekli temel, uygun zemin ve yük dağılımında verimli olabilir; radye temel zemin davranışını daha bütüncül okuyabilir; kazıklı sistem ise taşıma ve oturma koşullarının zorlaştığı alanlarda devreye girer.",
      "Bu nedenle temel tipi kararı, mimari ve statik disiplinle birlikte alınmalı; saha uygulama kapasitesi de göz önünde tutulmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Temel sistemi seçimi",
        limitOrRequirement: "Zemin taşıma gücü ve oturma kriterleri birlikte okunmalı",
        reference: "TS 500 + TBDY 2018",
        note: "Kesit hesabı kadar davranış farkı da seçimi belirler.",
      },
      {
        parameter: "Temel sürekliliği",
        limitOrRequirement: "Yük aktarımı ve diferansiyel oturma riski birlikte değerlendirilmeli",
        reference: "Geoteknik ve betonarme tasarım yaklaşımı",
        note: "Parçalı çözümler zayıf zeminde sorun büyütebilir.",
      },
      {
        parameter: "Su ve çevre etkisi",
        limitOrRequirement: "Yalıtım, drenaj ve imalat sırası temel tipine entegre edilmeli",
        reference: "Saha uygulama disiplini",
        note: "Temel seçimi, yapım kolaylığı ve koruma katmanlarını da etkiler.",
      },
    ],
    designOrApplicationSteps: [
      "Zemin raporundaki taşıma ve oturma verilerini yapı yükleriyle birlikte yorumla.",
      "Temel tiplerini yalnızca maliyet değil, davranış ve imalat kolaylığı açısından karşılaştır.",
      "Temel altı su etkisi, perde sürekliliği ve yalıtım kararlarını seçime dahil et.",
      "Seçilen temel sisteminin donatı yoğunluğu ve saha kapasitesini erkenden değerlendir.",
      "Temel tipi kararını detay, yalıtım ve drenaj paketiyle birlikte dondur.",
    ],
    criticalChecks: [
      "Taşıma gücü kadar diferansiyel oturma riski incelendi mi?",
      "Seçilen temel tipi saha ekipleri tarafından uygulanabilir yoğunlukta mı?",
      "Su etkisi ve yalıtım detayı temel kararına işlendi mi?",
      "Temel sistemi üst yapı aks düzeniyle uyumlu mu?",
      "Alternatif temel tipleri teknik gerekçeyle karşılaştırıldı mı?",
    ],
    numericalExample: {
      title: "Temel türü ön seçimi için yük-dağılım mantığı örneği",
      inputs: [
        { label: "Yapı oturum alanı", value: "420 m²", note: "Bodrumlu konut bloğu" },
        { label: "Ortalama kolon yükleri", value: "650-900 kN", note: "Düzensiz dağılım var" },
        { label: "Zemin davranışı", value: "Orta sıkı, heterojen tabaka", note: "Farklı oturma potansiyeli mevcut" },
        { label: "Yeraltı suyu", value: "Temel tabanına yakın", note: "Yalıtım ve drenaj etkili" },
      ],
      assumptions: [
        "Ön seçim amacıyla davranış kıyası yapılmaktadır.",
        "Kesin temel hesabı ayrıca yapılacaktır.",
        "Su etkisi ve bodrum çevre duvarı sürekliliği sistem tercihini etkilemektedir.",
      ],
      steps: [
        {
          title: "Yük düzensizliğini değerlendir",
          result: "650-900 kN aralığı, yüklerin tek tip dağılmadığını gösterir.",
          note: "Bu durum daha bütüncül davranan sistemlere avantaj sağlayabilir.",
        },
        {
          title: "Zemin heterojenliğini yorumla",
          result: "Heterojen ve su etkili zeminde diferansiyel oturma riski artar.",
          note: "Radye veya daha gelişmiş sistemler teknik açıdan öne çıkabilir.",
        },
      ],
      checks: [
        "Temel seçimi sadece ilk maliyetle yapılmamalıdır.",
        "Oturma davranışı ve su etkisi, seçimi teknik gerekçe ile yönlendirmelidir.",
        "Üst yapı ve bodrum detayları temel tipine uyarlanmalıdır.",
      ],
      engineeringComment: "En doğru temel türü, zemine en ucuz değil en kontrollü davranışı bırakan çözümdür.",
    },
    tools: GEOTECH_TOOLS,
    equipmentAndMaterials: GEOTECH_EQUIPMENT,
    mistakes: [
      { wrong: "Temel türünü yalnızca taşıma gücü tablosuna bakarak seçmek.", correct: "Oturma, su ve uygulama koşullarını birlikte değerlendirmek." },
      { wrong: "Radye temeli her zor zemin için otomatik çözüm görmek.", correct: "Davranış ve maliyet kıyasını teknik gerekçeyle yapmak." },
      { wrong: "Temel tipini yalıtım ve drenajdan bağımsız ele almak.", correct: "Koruma katmanlarını temel kararının parçası saymak." },
      { wrong: "Üst yapı aks düzeni ile temel kararını koparmak.", correct: "Yük aktarım sürekliliğini proje başında kurmak." },
      { wrong: "Donatı yoğunluğunu saha kapasitesiyle kıyaslamamak.", correct: "Seçilen sistemin uygulanabilirliğini erkenden doğrulamak." },
    ],
    designVsField: [
      "Tasarım aşamasında temel tipi bir mühendislik seçeneği gibi görünür; sahada ise donatı yoğunluğu, pompa erişimi, yalıtım detayı ve iş programı üzerinde belirleyici hale gelir.",
      "Bu nedenle temel seçimi masa başı hesapla başlar ama saha gerçekliğiyle tamamlanır.",
    ],
    conclusion: [
      "Temel türleri arasındaki seçim, yapının zemine nasıl davrandığını belirleyen stratejik karardır. Doğru seçim, üst yapının güvenliğini ve şantiyenin akışını birlikte iyileştirir.",
    ],
    sources: KAZI_SOURCES,
    keywords: ["temel türleri", "radye temel", "tekil temel", "temel seçimi", "diferansiyel oturma"],
  },
];

const GEOTECH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Saha", name: "Sondaj makinesi", purpose: "Zemin profilini ve yeraltı suyu durumunu belirlemek.", phase: "Etüt" },
  { group: "Saha", name: "SPT / numune alma ekipmanı", purpose: "Zemin tabakalarının mühendislik özellikleri için veri üretmek.", phase: "Etüt" },
  { group: "Ölçüm", name: "Lazer nivo ve total station", purpose: "Kazı tabanı kotunu ve temel aplikasyonunu doğrulamak.", phase: "Kazı ve temel öncesi" },
  { group: "Uygulama", name: "Dalgıç pompa ve geçici drenaj seti", purpose: "Kazı çukurunda su kontrolünü sağlamak.", phase: "Kazı" },
  { group: "Uygulama", name: "Membran koruma levhası ve bohçalama bileşenleri", purpose: "Temel su yalıtımını dolgu öncesi korumak.", phase: "Temel sonrası" },
];

const KAZI_SOURCES = [...BRANCH_SOURCE_LEDGER["kazi-temel"]];

export const kaziTemelSpecs: BinaGuidePageSpec[] = [
  ...getKaziExtraSpecs(),
  ...kaziTemelLeafSpecs,
  {
    slugPath: "kazi-temel",
    kind: "branch",
    quote: "Kazı ve temel kalitesi, üst yapının görünen doğruluğundan önce zemindeki disiplinle başlar.",
    tip: "Temel sistemine güvenmek için yalnızca hesap değil; taban kotu, su kontrolü ve ardışık kabul disiplininin de kurulmuş olması gerekir.",
    intro: [
      "Kazı ve temel fazı, binanın üstte görülen tüm doğruluğunun altta hangi koşullarda kurulduğunu belirler. Zemin verisi yanlış okunur, su kontrolü gecikir veya temel detayları sahada doğaçlanırsa üst yapı boyunca taşınacak kusurlar daha başlangıçta oluşur.",
      "Bu rehber, zemin etüdünden hafriyaya, iksadan temel tipi seçimine kadar ilk kritik kararların hangi teknik sırayla alınması gerektiğini ve hangi saha kayıtlarının zorunlu olduğunu anlatır.",
      "Amaç, geoteknik raporla saha gerçekliğini birleştiren, temel öncesi ardışık kabul zinciri kuran bir yaklaşım bırakmaktır.",
    ],
    theory: [
      "Kazı ve temel fazında ana problem, belirsizlik yönetimidir. Zemin tabakalarının değişkenliği, yeraltı suyu, komşu yapı etkisi ve kazı derinliği, tek bir çizimle yönetilemeyecek kadar çok etkileşim üretir.",
      "Bu yüzden zemin etüdü yalnızca rapor olarak okunmaz; hafriyat ilerledikçe saha gözlemiyle doğrulanır. Aynı mantık iksa, drenaj, grobeton, donatı ve yalıtım adımlarında da sürdürülmelidir.",
      "Temel sistemi seçimi de yalnızca taşıma gücü hesabı değildir. Yapı yükü, oturma davranışı, su etkisi, imalat sırası ve çevre yapılara etki birlikte değerlendirilir.",
    ],
    ruleTable: [
      {
        parameter: "Geoteknik veri kullanımı",
        limitOrRequirement: "Zemin raporu tasarım ve saha gözlemiyle birlikte teyit edilmeli",
        reference: "TBDY 2018, Bölüm 16",
        note: "Kazı sırasında karşılaşılan zemin koşulları rapordan sapıyorsa tasarım gözden geçirilir.",
      },
      {
        parameter: "Temel tasarımı",
        limitOrRequirement: "Taşıma gücü, oturma ve deprem etkileri birlikte değerlendirilmeli",
        reference: "TS 500 + TBDY 2018",
        note: "Yalnızca kesit hesabı yeterli değildir; zemin-yapı etkileşimi de okunmalıdır.",
      },
      {
        parameter: "Derin kazı güvenliği",
        limitOrRequirement: "Komşu yapı ve yol etkileri için iksa stratejisi tanımlanmalı",
        reference: "TS EN 1536 / TS EN 1538",
        note: "İksa seçimi kazı ilerlerken değişmeyecek kadar erken olgunlaştırılmalıdır.",
      },
      {
        parameter: "Su kontrolü",
        limitOrRequirement: "Kazı tabanında su birikmesine izin verilmemeli",
        reference: "Saha uygulama disiplini",
        note: "Temel tabanı su altında bırakılan projelerde grobeton ve yalıtım kalitesi zayıflar.",
      },
    ],
    designOrApplicationSteps: [
      "Zemin etüdünü yalnızca rapor olarak değil, temel sistemi seçiminin ana girdisi olarak oku.",
      "Kazı kotları, geçici drenaj ve su tahliye stratejisini saha akış planına bağla.",
      "Kazı derinliği komşu yapıyı etkiliyorsa iksa sistemini imalat sırasıyla birlikte tanımla.",
      "Temel altı platformunu grobeton, donatı ve su yalıtımı için temiz ve ölçülü şekilde hazırla.",
      "Temel betonuna geçmeden önce taban kotu, donatı, pas payı ve yalıtım ardışık kabullerini tamamla.",
      "Dolgu ve perde kapanışlarını yalnızca foto-kayıt ve testler tamamlandıktan sonra başlat.",
    ],
    criticalChecks: [
      "Zemin raporundaki tabaka bilgisi saha gözlemiyle uyumlu mu?",
      "Kazı tabanı kotu ve gevşek malzeme temizliği kayıt altına alındı mı?",
      "İksa ve drenaj sisteminin kazı derinliğine göre güncel kontrol planı var mı?",
      "Grobeton, pas payı ve temel altı su yalıtımı ardışık kabul mantığıyla kapandı mı?",
      "Komşu yapı ve yol etkisi için izleme noktaları belirlendi mi?",
    ],
    numericalExample: {
      title: "Temel tabanı kot ve grobeton hazırlığı için ön kontrol örneği",
      inputs: [
        { label: "Projede temel taban kotu", value: "-4,20 m", note: "Mimari ve statik ortak referansı" },
        { label: "Saha ölçülen ortalama kot", value: "-4,16 m", note: "Kazı sonrası ilk ölçüm" },
        { label: "Grobeton kalınlığı", value: "10 cm", note: "Tipik saha pratiği" },
        { label: "İzin verilen son kot farkı", value: "±2 cm", note: "Grobeton öncesi sıkı kontrol hedefi" },
      ],
      assumptions: [
        "Kazı tabanında gevşek malzeme tamamen temizlenmiştir.",
        "Su birikmesi kalıcı değildir ve geçici drenaj çalışmaktadır.",
        "Grobeton öncesi son ölçümler aynı aks sisteminden alınmıştır.",
      ],
      steps: [
        {
          title: "Kot sapmasını belirle",
          formula: "-4,16 - (-4,20) = +0,04 m",
          result: "Kazı tabanı proje kotundan 4 cm yukarıdadır.",
          note: "Bu sapma grobeton öncesi düzeltme gerektirir.",
        },
        {
          title: "Düzeltme ihtiyacını yorumla",
          formula: "4 cm > 2 cm kabul sınırı",
          result: "İlave tesviye ve yeniden ölçüm zorunludur.",
          note: "Grobeton kalınlığını keyfi artırarak kot sorunu gizlenmemelidir.",
        },
      ],
      checks: [
        "Kot sapması kabul sınırını aşıyorsa grobeton öncesi yeniden tesviye yapılmalıdır.",
        "Grobeton kalınlığı, temel geometrisini değiştirecek şekilde telafi aracı olarak kullanılmamalıdır.",
        "Son ölçüm kaydı, temel donatısına geçişten önce teknik ofis tarafından doğrulanmalıdır.",
      ],
      engineeringComment: "Temel altı kalite, çoğu zaman büyük hesap kararlarından değil; son birkaç santimetrelik disiplinli tesviyeden kazanılır.",
    },
    tools: GEOTECH_TOOLS,
    equipmentAndMaterials: GEOTECH_EQUIPMENT,
    mistakes: [
      { wrong: "Zemin raporunu sabit gerçek kabul edip saha gözlemini önemsememek.", correct: "Kazı ilerledikçe rapor verisini gözlem ve ölçüyle doğrulamak.", reference: "TBDY 2018, Bölüm 16" },
      { wrong: "Kazı tabanında gevşek malzeme ve su birikmesini görmezden gelmek.", correct: "Temel öncesi tabanı temiz, kuru ve ölçülü teslim almak." },
      { wrong: "İksa ihtiyacını kazı başladıktan sonra belirlemeye çalışmak.", correct: "Kazı derinliği ve komşu etkisini projede erken çözmek." },
      { wrong: "Grobeton ve yalıtımı kot düzeltme aracı gibi kullanmak.", correct: "Temel geometri ve kot disiplinini ayrı ayrı yönetmek." },
      { wrong: "Perde-radye birleşimindeki su yalıtımını dolgu öncesi foto-kayıtsız kapatmak.", correct: "Süreklilik detayını kayıt altına alıp sonra dolguya geçmek." },
    ],
    designVsField: [
      "Tasarım ofisinde temel sistemi tek bir şema gibi görünür; sahada ise su, taban temizliği, donatı yerleşimi, grobeton düzlemi ve dolgu sırası birlikte çalışan bir zincir vardır.",
      "Bu nedenle geoteknik kararlar yalnızca raporda değil, saha kayıt kültüründe de yaşamaya devam etmelidir.",
    ],
    conclusion: [
      "Kazı ve temel fazı, üst yapının güvenli başlangıç çizgisidir. Doğru zemin okuması, kontrollü kazı ve ölçülü temel hazırlığı olmadan üst yapıdaki iyi işçilik tek başına yeterli güvence üretmez.",
    ],
    sources: KAZI_SOURCES,
    keywords: ["kazı ve temel", "geoteknik kontrol", "temel tabanı kotu", "iksa sistemi", "zemin etüdü ve temel"],
  },
  {
    slugPath: "kazi-temel/zemin-etudu",
    kind: "topic",
    quote: "Zemin etüdü, temel çizimine veri sağlayan değil; binanın zemine nasıl oturacağını açıklayan ilk teknik karardır.",
    tip: "Zemin etüdü raporunu yalnızca sonuç sayfasıyla okumak, temel sistemini en kritik girdisinden mahrum bırakır.",
    intro: [
      "Zemin etüdü, temel tasarımının yanı sıra kazı güvenliği, yeraltı suyu riski, oturma davranışı ve komşu yapı etkisi için de ana veriyi üretir. Bu nedenle rapor yalnızca resmi zorunluluk olarak görülmemelidir.",
      "İyi bir zemin etüdü; sondaj yerleri, numune kalitesi, tabaka geçişleri ve laboratuvar verileriyle birlikte okunur. Sadece önerilen temel tipini ezberlemek, raporun asıl değerini kaçırmaktır.",
    ],
    theory: [
      "Zemin etüdü, zeminin homojen olmadığını kabul eden bir veri üretim sürecidir. Her sondaj noktası, arsanın tamamını değil; sadece temsil ettiği kesiti anlatır.",
      "Bu nedenle yorum yapılırken tabaka değişimi, yeraltı suyu seviyesi, taşıma gücü, şişme-oturma davranışı ve deprem büyütme etkisi birlikte değerlendirilir.",
      "Raporun değeri, temel seçimini otomatik yapmasında değil; mühendislik risklerini açık etmesindedir.",
    ],
    ruleTable: [
      {
        parameter: "Zemin sınıfı ve deprem girdileri",
        limitOrRequirement: "Resmi deprem tehlike verileri ve etüt sonuçları birlikte kullanılmalı",
        reference: "TBDY 2018, Bölüm 16",
        note: "Deprem yer hareketi parametreleri rapor ve AFAD verisiyle uyumlu olmalıdır.",
      },
      {
        parameter: "Sondaj ve laboratuvar verisi",
        limitOrRequirement: "Temsil gücü yeterli saha verisi bulunmalı",
        reference: "Geoteknik etüt uygulama disiplini",
        note: "Yetersiz sondaj, yanlış temel kararına yol açabilir.",
      },
      {
        parameter: "Yeraltı suyu etkisi",
        limitOrRequirement: "Kazı ve temel detayına etki edecek şekilde raporlanmalı",
        reference: "TBDY 2018 + saha mühendisliği",
        note: "Su bilgisi sadece not düşülerek geçilemez; temel ve iksayı doğrudan etkiler.",
      },
    ],
    designOrApplicationSteps: [
      "Sondaj yerlerinin yapı oturumunu temsil edip etmediğini kontrol et.",
      "Zemin tabakalarını, laboratuvar verilerini ve yeraltı suyu notlarını birlikte yorumla.",
      "Temel seçimi, oturma riski ve kazı emniyeti için ayrı ayrı mühendislik sonuçları çıkar.",
      "Rapordaki kritik riskleri mimari, statik ve saha ekipleriyle paylaş.",
      "Kazı başladığında rapor öngörülerini saha gözlemiyle yeniden teyit et.",
    ],
    criticalChecks: [
      "Sondaj noktaları bina oturumunu temsil ediyor mu?",
      "Raporda yeraltı suyu seviyesi ve mevsimsel etkiler açık mı?",
      "Temel önerisi taşıma gücü kadar oturma davranışını da yorumluyor mu?",
      "Komşu yapı ve derin kazı riski ayrıca belirtilmiş mi?",
      "Kazı sırasında rapordan sapma halinde izlenecek teknik prosedür tanımlı mı?",
    ],
    numericalExample: {
      title: "Sondaj verisi dağılımının yorumlanmasına dair basit örnek",
      inputs: [
        { label: "Sondaj sayısı", value: "3 adet", note: "Yaklaşık 900 m² arsa" },
        { label: "Temel taban derinliği", value: "3,80 m", note: "Ön tasarım kararı" },
        { label: "Bir sondajdaki yeraltı suyu", value: "2,60 m", note: "Diğerlerinde gözlenmedi" },
        { label: "SPT-N aralığı", value: "12-28", note: "Tabaka geçişine göre değişiyor" },
      ],
      assumptions: [
        "Sondaj yerleri yapıyı temsil edecek şekilde dağıtılmıştır.",
        "Su seviyesi mevsimsel olarak değişebilir ve tek ölçüm nihai gerçek kabul edilmez.",
        "Temel seçimi, en zayıf veri ile en riskli senaryoyu göz önüne almalıdır.",
      ],
      steps: [
        {
          title: "Tabaka değişimini yorumla",
          result: "N değerlerindeki 12-28 aralığı zeminin tek tip davranmadığını gösterir.",
          note: "Bu durumda temel sistemi ortalama veriye göre değil, değişkenliği de hesaba katarak seçilir.",
        },
        {
          title: "Su etkisini değerlendir",
          formula: "2,60 m < 3,80 m temel tabanı",
          result: "Temel kazısı sırasında su kontrolü ihtimali yüksektir.",
          note: "Geçici drenaj ve yalıtım yaklaşımı tasarımın parçası olmalıdır.",
        },
      ],
      checks: [
        "En zayıf zemin verisi temel kararından dışlanmamalıdır.",
        "Su seviyesi temel tabanından yukarıdaysa kazı stratejisi güncellenmelidir.",
        "Rapor özetinden çok, veri dağılımı ve yorum bölümü birlikte okunmalıdır.",
      ],
      engineeringComment: "Zemin etüdü, ortalamayı değil; değişkenliğin ürettiği riski okuma işidir.",
    },
    tools: GEOTECH_TOOLS,
    equipmentAndMaterials: GEOTECH_EQUIPMENT,
    mistakes: [
      { wrong: "Raporun sadece önerilen temel tipine bakmak.", correct: "Tabaka, su ve oturma yorumlarını birlikte okumak." },
      { wrong: "Sondaj dağılımını yeterli kabul edip temsil kabiliyetini sorgulamamak.", correct: "Yapı oturumu ve kritik köşeler açısından yeterliliği incelemek." },
      { wrong: "Yeraltı suyu bilgisini sabit ve değişmez kabul etmek.", correct: "Mevsimsel değişim ve saha gözlemiyle teyit etmek." },
      { wrong: "Kazı sırasında çıkan farklı zemin koşullarını rapora aykırı diye görmezden gelmek.", correct: "Sapma halinde tasarımı ve saha stratejisini yeniden değerlendirmek." },
      { wrong: "Zemin etüdünü sadece statik proje girdisi sanmak.", correct: "Kazı, iksa, drenaj ve yalıtım için de ana veri kaynağı olarak görmek." },
    ],
    designVsField: [
      "Masa başında rapor tek PDF dosyasıdır; sahada ise her tabaka geçişi, her su çıkışı ve her gevşek bölge o raporun yeniden okunmasını gerektirir.",
      "Zemin etüdü doğru kullanıldığında risk azaltır; yüzeysel okunursa yanlış güven hissi üretir.",
    ],
    conclusion: [
      "Zemin etüdü, binanın ilk görünmeyen projesidir. İyi okunmuş bir etüt; temel tipini, kazı stratejisini ve saha güvenliğini aynı anda iyileştirir.",
    ],
    sources: [...KAZI_SOURCES, SOURCE_LEDGER.tdth],
    keywords: ["zemin etüdü", "SPT", "yeraltı suyu", "geoteknik rapor", "temel tasarımı girdileri"],
  },
];
