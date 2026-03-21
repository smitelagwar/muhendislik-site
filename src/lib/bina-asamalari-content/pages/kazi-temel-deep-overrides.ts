import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KAZI_DEEP_SOURCES = [...BRANCH_SOURCE_LEDGER["kazi-temel"]];

const IKSA_TOOLS: BinaGuideTool[] = [
  { category: "Geoteknik", name: "Plaxis veya esdeger geoteknik analiz araci", purpose: "Iksa deformasyonu, kazı kademesi ve su etkisini analiz senaryosuyla okumak." },
  { category: "Olcum", name: "Inklinometre, total station ve oturma pimi takip seti", purpose: "Duvar deplasmanini, komsu yapı davranisini ve kademe ilerleyisini veriyle izlemek." },
  { category: "Kontrol", name: "Kazı kademesi ve ankraj yükleme matrisi", purpose: "Her kazı adimini, ankraj veya destek devreye alma sirasiyla birlikte yönetmek." },
  { category: "Kayit", name: "Günlük deformasyon ve su seviyesi raporu", purpose: "Sahadaki hareketi sayisal gözleme cevirip kararları belgelemek." },
];

const IKSA_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Tasiyici", name: "Fore kazik, diyafram duvar veya palplanş çevreleme elemanlari", purpose: "Kazı cephesini ve komsu etkisini kontrollu sekilde tutmak.", phase: "Iksa kurulumu" },
  { group: "Destek", name: "Ankraj, kuşak kirişi, iç destek veya payanda sistemleri", purpose: "Kazı derinligi arttikca yatay hereketi sinirlamak.", phase: "Kademeli kazı" },
  { group: "Su kontrolu", name: "Dewatering pompasi, drenaj ve gözlem kuyusu elemanlari", purpose: "Yeraltı suyu ve yagis etkisini iksa performansiyla birlikte yonetmek.", phase: "Kazı ve izleme" },
  { group: "Izleme", name: "Inklinometre borusu, oturma pimi ve deformasyon hedefleri", purpose: "Iksa davranisini sayisal olarak takip etmek.", phase: "Tüm süreç" },
];

export const kaziTemelDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kazi-temel/iksa-sistemi",
    kind: "topic",
    quote: "Iksa sistemi, kaziyi ayakta tutan gecici bir destekten daha fazlasidir; komsu yapilarin ve kazinin davranisini ayni anda yoneten aktif bir muhendislik paketidir.",
    tip: "Iksayi yalniz imalat kalemi gibi gormek, en kritik karari kacirmak demektir: sistemin gercek basarisi, her kademe kazida nasil davrandigini okuyabilmektir.",
    intro: [
      "Iksa sistemleri, derin kazilarda zemin hareketini sinirlamak, komsu yapilari korumak ve temel imalatina guvenli calisma hacmi saglamak icin kurulan ana geoteknik savunma katmanidir. Fore kazik, diyafram duvar, ankraj, ic destek veya palplans gibi cozumler farkli sahalarda farkli avantajlar uretir; ancak hepsinin ortak amaci kontrolsuz deformasyonu engellemektir.",
      "Sahada en sik yapilan hata, iksayi kazidan once kurulan ve sonra unutulan bir eleman gibi gormektir. Oysa iksa, kaziyla birlikte yasayan bir sistemdir. Her kademe ilerledikce yatay hareket, su etkisi, ankraj davranisi ve komsu parsellerin tepkisi yeniden okunmak zorundadir.",
      "Bir insaat muhendisi icin iksa sistemi, yalniz geoteknik hesabın sonucu degil; saha gozlemi, deformasyon izleme, su kontrolu ve lojistik kararlarin ortak cikisidir. Duvarin teorik olarak yeterli cikmasi tek basina yetmez; sahada olculen hareketler o hesabın gercekle uyumunu test eder.",
      "Bu nedenle iksa sistemi, proje rafinda kalan hesap seti degil, kazinin her gunu yeniden izlenmesi gereken canli bir emniyet mekanizmasi olarak ele alinmalidir.",
    ],
    theory: [
      "Iksa davranisini belirleyen ana değişkenler zemin cinsi, kazı derinligi, yeraltı suyu, komsu yapı yükleri ve seçilen destek sistemidir. Ayni derinlikte iki kazı, zemin ve su koşulu degiştiğinde tamamen farklı deformasyon davranışı gösterebilir. Bu nedenle tek tip saha refleksi yerine projeye özgü izleme kültürü gerekir.",
      "Fore kazik veya diyafram duvar gibi çevreleme elemanlari yalnız kesitte duran rijit duvarlar degildir; arkalarindaki zeminin, onlerindeki kazı derinliginin ve ankraj ya da ic destek sisteminin ortak davranisi ile calisirlar. Duvar tek basina guvenli görunurken su basincinin ya da yetersiz ankraj gerilmesinin etkisiyle beklenenden fazla hareket edebilir.",
      "Iksada su kontrolu her zaman ana parametrelerden biridir. Dewatering planinin eksik kurulmasi, yağış suyunun kazı tabanında birikmesi veya perde arkasi drenajın ihmal edilmesi, teorik hesapta olmayan ek yük ve yumuşama davranışı yaratır. Bu nedenle kazıdaki su, mekanik bir yardımcı konu degil yapisal bir tasarım girdisidir.",
      "Iksa sisteminin gerçek başarisi, hesap dosyasındaki moment diyagramindan çok sahadaki deplasman okumalarıyla görülür. Ölçülmeyen hareket, yönetilemeyen harekettir. Bu sebeple inklinometre, oturma pimi ve total station okumaları geoteknik projede yazan sayılar kadar değerlidir.",
    ],
    ruleTable: [
      {
        parameter: "Geoteknik veri ve sistem secimi",
        limitOrRequirement: "Iksa tipi zemin tabakasi, su seviyesi ve komsu yapı etkisiyle birlikte belirlenmeli",
        reference: "TBDY 2018 temel yaklasimi + geoteknik rapor",
        note: "Ayni derinlik her sahada ayni iksa tipini dogrulamaz.",
      },
      {
        parameter: "Ankraj ve destek dogrulamasi",
        limitOrRequirement: "Ankraj veya ic destekler kademe ilerleyisiyle senkron kurulup test edilmelidir",
        reference: "TS EN 1537",
        note: "Geciken veya test edilmeyen destek, iksanin butun davranisini bozar.",
      },
      {
        parameter: "Duvar ve panel kalite kontroli",
        limitOrRequirement: "Cevreleme elemaninin devamliligi, duseyliği ve imalat kalitesi sahada belgelenmeli",
        reference: "TS EN 1538 / TS EN 1536",
        note: "Zayif imalat, dogru tasarimi sahada deger kaybettirir.",
      },
      {
        parameter: "Deformasyon izleme",
        limitOrRequirement: "Kazı boyunca duvar deplasmani ve komsu oturmasi olculerek izlenmeli",
        reference: "Saha geoteknik izleme plani",
        note: "Iksa performansi tahmin edilmez, olculur.",
      },
      {
        parameter: "Su kontrolu",
        limitOrRequirement: "Yeraltı suyu ve yagis etkisi aktif drenaj veya dewatering sistemiyle yonetilmeli",
        reference: "Kazı ve su kontrol plani",
        note: "Suyu ikincil konu saymak, iksanin davranisini sansa birakir.",
      },
    ],
    designOrApplicationSteps: [
      "Kazı derinligi, komsu yapı durumu, su seviyesi ve zemin etudunu birlikte okuyarak iksa tipini netlestir.",
      "Cevreleme elemani imalatindan once aplikasyon, kot ve komsu yapı gözlem hedeflerini sahada kur.",
      "Kaziyi kademeli ilerlet; her kademe ile birlikte ankraj, kuşak ya da ic destek devreye alma sırasını yazılı şekilde uygula.",
      "Inklinometre, total station ve oturma pimi okumalarini kazı derinligiyle eş zamanlı yurut; veri gelmeden ilerleme karari verme.",
      "Su kontrolunu yağış günü planı dahil olmak uzere sürekli aktif tut; kazı tabanında su birikmesini olağan kabul etme.",
      "Olculen hareket alarm bantlarini veya saha beklentisini zorluyorsa kazıyı durdurup sistemi yeniden değerlendir.",
    ],
    criticalChecks: [
      "Iksa tipi, sahadaki gerçek zemin ve komsu durumuyla halen uyumlu mu?",
      "Her kazı kademesinde destek elemani zamaninda devreye girdi mi?",
      "Inklinometre ve oturma okumalari düzenli ve tutarlı biçimde aliniyor mu?",
      "Kazı tabaninda ya da duvar arkasinda su etkisi artiyor mu?",
      "Komsu yapılarda yeni catlak, kapı sıkışması veya oturma belirtisi var mi?",
      "Ölculen duvar hareketi, beklenen saha bandinin üzerine cikiyor mu?",
    ],
    numericalExample: {
      title: "8 m derinlikte kazida yatay hareket izleme bandi yorumu",
      inputs: [
        { label: "Kazı derinligi", value: "8,0 m", note: "Kentsel parselde derin kazı" },
        { label: "Ornek saha izleme bandi", value: "H/500", note: "Erken uyarı için kullanılan ornek yaklaşim" },
        { label: "Hesaplanan izleme değeri", value: "16 mm", note: "8,0 / 500 = 0,016 m" },
        { label: "Olculen deplasman", value: "11 mm", note: "Son kademe sonunda" },
      ],
      assumptions: [
        "Bu değer resmi sinir degil, proje ekibinin kullandigi ornek saha izleme bandidir.",
        "Inklinometre olcumu ayni referans sisteminde alinmistir.",
        "Kazı bir sonraki kademe oncesi teknik ekip tarafindan degerlendirilecektir.",
      ],
      steps: [
        {
          title: "Izleme bandini hesapla",
          formula: "8,0 / 500 = 0,016 m",
          result: "Ornek saha izleme bandi yaklasik 16 mm olur.",
          note: "Bu deger, hareketi anlamak icin kullanılan yonetsel eştir; mutlak mevzuat siniri gibi okunmamali.",
        },
        {
          title: "Olculen hareketi karsilastir",
          formula: "11 mm < 16 mm",
          result: "Olculen deplasman bu ornek izleme bandinin altindadir.",
          note: "Yine de trend yukari gidiyorsa olcum sıklığı azaltılmamalıdır.",
        },
        {
          title: "Bir sonraki kademe kararini yorumla",
          result: "Kazı devam edebilir; fakat komsu yapı gözlemi ve su kontrolü aynı disiplinle sürdürülmelidir.",
          note: "Tek bir olcum güvenliğin tamamini anlatmaz; önemli olan eğilimin izlenmesidir.",
        },
      ],
      checks: [
        "Saha izleme bandi ile resmi tasarım kriteri birbirine karıştırılmamalıdır.",
        "Tek bir olcum yerine zamana bağlı hareket eğrisi okunmalıdır.",
        "Hareket artışı varsa kazı hızı ve destek zamanlaması birlikte değerlendirilmelidir.",
        "Su seviyesi değişimi, deplasman yorumundan ayrı düşünülmemelidir.",
      ],
      engineeringComment: "Iksada en değerli veri, duvarın ne kadar güçlü tasarlandigindan çok sahada ne kadar hareket ettigini duzenli görebilmektir.",
    },
    tools: IKSA_TOOLS,
    equipmentAndMaterials: IKSA_EQUIPMENT,
    mistakes: [
      { wrong: "Iksayi kazidan once kurulan ve sonra unutulan sabit sistem gibi gormek.", correct: "Her kazı kademesinde yeniden izlenen aktif sistem olarak yönetmek." },
      { wrong: "Ankraj veya destekleri gecikmeli devreye almak.", correct: "Kazı kademesiyle es zamanli ve testli ilerlemek." },
      { wrong: "Su etkisini yalnız pompa işi saymak.", correct: "Iksa performansinin temel girdilerinden biri olarak ele almak." },
      { wrong: "Deformasyon olcumunu formaliteye çevirmek.", correct: "Kazı ilerleme kararını sayisal izleme ile baglamak." },
      { wrong: "Komsu yapilardaki kucuk belirtileri goz ardi etmek.", correct: "Catlak, oturma ve kapı-pencere davranisini erken uyarı olarak okumak." },
      { wrong: "Saha verisi ile proje hesabı çeliştiğinde ilerlemeye devam etmek.", correct: "Veri-gözlem farkinda kazıyı durdurup sistemi yeniden değerlendirmek." },
    ],
    designVsField: [
      "Tasarim ofisinde iksa kesit, moment ve ankraj kuvvetleriyle tanimlanir; sahada ise her gün alınan ölçü, su durumu ve kazı hızı sistemin gerçek kalitesini belirler.",
      "Iyi iksa sistemi hiç hareket etmeyen sistem değildir; hareketi ölçülen, yorumlanan ve kontrol altında tutulan sistemdir.",
      "Bu nedenle geoteknik tasarım ile saha yönetimi iksada ayrılmaz iki parçadır.",
    ],
    conclusion: [
      "Iksa sistemi dogru geoteknik veri, dogru kademelendirme ve düzenli izleme ile yürütüldüğünde derin kaziyi yönetilebilir bir mühendislik sürecine dönüştürür. Bu üç ayaktan biri eksik olduğunda risk hesap dosyasından sahaya taşar.",
      "Saha tarafinda en dogru yaklaşım, iksayi bitmiş bir ürün değil, kazı tamamlanana kadar davranışı izlenen bir güvenlik sistemi olarak görmek ve buna göre karar vermektir.",
    ],
    sources: [...KAZI_DEEP_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.tsEn1537, SOURCE_LEDGER.tsEn1538],
    keywords: ["iksa sistemi", "deformasyon izleme", "ankraj", "derin kazi", "geoteknik izleme"],
    relatedPaths: ["kazi-temel", "kazi-temel/hafriyat", "kazi-temel/ankrajli-iksa"],
  },
];
