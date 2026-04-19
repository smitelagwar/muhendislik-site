import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TERRACE_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Teras çatı katman kesiti ve su tahliye plani", purpose: "Yalitim, egim, gider ve parapet detaylarini aynı sistem olarak okumak." },
  { category: "Ölçüm", name: "Lazer nivo, egim kontrolu ve su testi checklisti", purpose: "Teras catida gorunmeyen su riskini teslim öncesi olculu bicimde yakalamak." },
  { category: "Kontrol", name: "Detay nodu ve gider kabul formu", purpose: "Parapet, gider, su basman ve cihaz ayaklarini ayri kalite kalemi gibi yonetmek." },
  { category: "Kayıt", name: "Katman tamamlama ve kapanis fotograflari", purpose: "Üst uste kapanan teras çatı katmanlarini izlenebilir tutmak." },
];

const TERRACE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Altlik", name: "Taşıyıcı doseme, egim sapi ve tesviye katmani", purpose: "Su tahliyesi ve yalitim için doğru geometriyi kurmak.", phase: "Hazirlik" },
  { group: "Yalitim", name: "Su yalitimi katmanlari, pah bandi ve koruma katmani", purpose: "Teras catinin su gecirimsizlik omurgasini olusturmak.", phase: "Yalitim" },
  { group: "Tahliye", name: "Çatı giderleri, su toplama detaylari ve tasma senaryosu", purpose: "Suyun kontrolsuz birikmesini onlemek.", phase: "Detay cozumu" },
  { group: "Kapanis", name: "Kaplama ve koruma sistemleri", purpose: "Yalitim katmanini son kullanım senaryosuna uygun korumak.", phase: "Teslim" },
];

export const terasCatiDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/cati-iskeleti/teras-cati",
    kind: "topic",
    quote: "Teras çatı, ustte duz bir yüzey degil; suyu kontrol eden, yalitimi koruyan ve tüm detaylarini milimetrelerle cozen teknik bir kabuktur.",
    tip: "Teras catiyi duz doseme ustune yalitim atilan basit bir cozum gibi gormek, suyu ve detay riskini gizli ama pahali bir probleme donusturur.",
    intro: [
      "Teras çatı yapilarda estetik ve kullanım kolayligi saglayan bir üst ortu tipidir. Ancak bu avantaj yalnız duz bir çatı yuzeyiyle degil; suyun kontrollu tahliyesi, doğru egim, saglam yalitim ve kritik dugumlerin temiz cozulmesi ile elde edilir. Bu nedenle teras çatı yalnız ustte gezilen veya teknik ekipman konan bir platform degil, dikkatle kurulmasi gereken bir kabuk sistemidir.",
      "Sahadaki en buyuk yanlış, teras catiyi yassi doseme ustune eklenen birkaç katmandan ibaret sanmaktir. Oysa gider kötü, parapet donusu, cihaz ayagi, derzler, su basma kötü ve egim yetersizligi gibi sorunlar catiyi kısa surede sızıntı ve bakım problemine donusturur. Bu sistemde hata genelde ilk siddetli yagista veya birikme yapan su lekesinde ortaya cikar.",
      "Bir insaat muhendisi için teras çatı; doseme ustu geometri, egim sapi, su yalitimi, koruma katmani ve kullanima acma mantigini birlikte okumak demektir. Tasarim ile saha arasindaki en kritik kopma da burada yasanir: kagit üzerinde cizilen egim, sahada yeterince olculmezse sistem yalitim markasindan bagimsiz olarak sorun uretir.",
      "Bu rehberde teras catıyı; teknik teori, enerji ve yalitim ekseni, sayisal egim yorumu, ekipman, araçlar ve saha hatalariyla birlikte uzun-form bir blog yazisi gibi ele aliyoruz.",
    ],
    theory: [
      "Teras çatı davranisinin cekirdeginde su yer alir. Sistem ne kadar dayanikli malzemeden olusursa olussun, suyu bekletiyor veya detaylarda doğru yone aktaramiyorsa performansini kaybeder. Bu nedenle teras catinin ilk prensibi suyu iceri almamak kadar, suyu üst yuzeyde gereksiz yere tutmamaktir.",
      "Egim bu davranisin ana aracidir. Duvar, parapet, gider ve lokal cotuk detaylar doğru kurgulanmadiginda kagit üzerinde var olan egim bile sahada yetersiz kalabilir. Su toplama riskinin en çok arttigi noktalar genis alan ortalari, parapet dipleri ve gider cevreleridir. Bu nedenle teras çatı olcumu genel yüzey ortalamasiyla degil kritik dugumler uzerinden yapilmalidir.",
      "Su yalitimi katmanlari yalnız malzeme secimiyle degerlendirilmez. Altligin temizligi, pah detaylari, bindirme duzeni, koruma tabakasi ve üst kaplama ile uyumu birlikte performans belirler. Yalitimin en zayif noktasi genelde genel yüzey degil; parapet donusu, gider bogazi, genlesme derzi veya cihaz ayagi gibi lokal dugumlerdir.",
      "Teras çatı aynı zamanda enerji ve servis omru konusudur. TS 825 ve enerji performansi mantigina göre üst kabukta yapilan her eksik yalitim karari, isitma-sogutma yukunu etkiler. Yani teras çatı yalnız su gecirmezlik konusu degil; enerji kaybi ve yüzey dayanikliligi konusudur.",
      "Bu bakisla teras çatı, en çok detay disiplini isteyen sistemlerden biridir. Iyi uygulandiginda uzun omurlu ve sessiz calisir; kötü uygulandiginda ise tamir edilmesi en zor imalatlardan birine donusur.",
    ],
    ruleTable: [
      {
        parameter: "Egim ve su tahliyesi",
        limitOrRequirement: "Yüzey suyu giderlere yonlendirecek kesintisiz egim ve detay butunlugu kurulmalidir",
        reference: "Uygulama detay plani",
        note: "Su toplama yapan teras çatı, yalitim kalitesinden bagimsiz risk tasir.",
      },
      {
        parameter: "Kabuk ve enerji davranisi",
        limitOrRequirement: "Teras çatı isi yalitimi ve üst kabuk katmanlari enerji performansi mantigiyla uyumlu olmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Üst ortu enerji kabugunun en kritik yuzeylerinden biridir.",
      },
      {
        parameter: "Su yalitimi detaylari",
        limitOrRequirement: "Parapet, gider, derz ve donusler ana yüzey kadar dikkatle cozulmelidir",
        reference: "Yalitim sistem detaylari",
        note: "Sizintilarin buyuk kismi lokal dugumlerde baslar.",
      },
      {
        parameter: "Altlik ve koruma",
        limitOrRequirement: "Yalitim altligi temiz, duz ve koruma katmanlariyla uyumlu olmalidir",
        reference: "Saha kalite plani",
        note: "Kirli veya bozuk altlik iyi membrandan da verim almaz.",
      },
      {
        parameter: "Kullanım ve ekipman yukleri",
        limitOrRequirement: "Teknik cihaz, yaya trafigi veya kaplama gibi son kullanım kararlar yalitim ve koruma ile birlikte degerlendirilmelidir",
        reference: "Teras kullanım senaryosu",
        note: "Duz çatı herkes için aynı cozum degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Doseme üst kotlarini, gider yerlerini ve parapet detaylarini aynı geometri planiyla netlestir.",
      "Egim sapini genel yuzeyde oldugu kadar gider, parapet ve lokal dugumlerde de olcerek kur.",
      "Yalitim katmanlarini temiz altlik, pah detaylari ve bindirme disiplini ile uygula.",
      "Gider bogazi, cihaz ayagi ve derzleri genel yuzeyden ayri bir kalite kalemi gibi kontrol et.",
      "Yalitim ustu koruma ve son kullanım katmanini, sistemin delinmeyecegi ve suyu tutmayacagi mantikla tamamla.",
      "Teslim öncesi su testi ve kritik dugum turunu yaparak catiyi kapat.",
    ],
    criticalChecks: [
      "Giderler ve genel yüzey arasinda suyu doğru yonlendiren egim gercekten olustu mu?",
      "Parapet dipleri ve lokal kot dusuklukleri birikinti riski tasiyor mu?",
      "Yalitim donusleri ve bindirmeleri temiz ve eksiksiz mi?",
      "Teknik cihaz ayaklari veya gecisler yalitimi zayiflatiyor mu?",
      "Koruma katmani yalitimi sahada erken hasara karsi yeterince koruyor mu?",
      "Su testi yalnız genis yuzeyde degil, kritik dugumlerde de uygulandi mi?",
    ],
    numericalExample: {
      title: "12 m teras catida minimum kot farki yorumu",
      inputs: [
        { label: "Yatay mesafe", value: "12 m", note: "Gider yonune olan toplam mesafe" },
        { label: "Ornek egim", value: "%2", note: "Uygulama yorumunda sık kullanilan egim duzeyi" },
        { label: "Hedef", value: "Gerekli kot farkini okumak", note: "Su tahliyesini kontrol etmek" },
        { label: "Amac", value: "Kritik dugumlerde egim kaybi riskini gormek", note: "Saha kontrolu" },
      ],
      assumptions: [
        "Yüzey genel olarak tek yone tahliye verecektir.",
        "Lokal sehim veya beton dalgasi sonradan olusmayacaktir.",
        "Hesap saha yorumu için kullanilmaktadir.",
      ],
      steps: [
        {
          title: "Kot farkini hesapla",
          formula: "12 x 0,02 = 0,24 m",
          result: "12 m mesafede yaklasik 24 cm kot farki gerekir.",
          note: "Bu fark genel yuzeyde var olsa bile lokal dugumlerde kaybedilebilir.",
        },
        {
          title: "Dugum etkisini yorumla",
          result: "Parapet dipleri ve gider cevrelerinde bu egim lokal ters eğime donusurse su birikimi baslar.",
          note: "Teras çatı sorunu genelde genel egimin degil lokal detay kaybinin sonucudur.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Egim karari plan notu olarak degil, sahada olculen ve dugumlerde tekrar teyit edilen bir kalite kriteri olarak okunmalidir.",
          note: "Duz çatı en fazla ölçü isteyen çatı tiplerinden biridir.",
        },
      ],
      checks: [
        "Genel egim degeri kritik dugumlerde yeniden okunmalidir.",
        "Suyun gidecegi yol parapet ve cihaz detaylariyla kesilmemelidir.",
        "Yalitim testleri egim kalitesinin yerine gecmez; ikisi birlikte degerlendirilmelidir.",
        "Kullanım karari teknik çatı ile gezilebilir catiyi aynı sistem sanmamalidir.",
      ],
      engineeringComment: "Teras catida en buyuk sorun suyun varligi degil, onun nereye gidecegine sahada yeterince karar verilmemis olmasidir.",
    },
    tools: TERRACE_TOOLS,
    equipmentAndMaterials: TERRACE_EQUIPMENT,
    mistakes: [
      { wrong: "Teras catida genel yüzey egimi var diye dugum detaylarini onemsiz sanmak.", correct: "Gider, parapet ve cihaz ayaklarini ayri kalite kalemi gibi kontrol etmek." },
      { wrong: "Yalitim markasini cozumun tamami gibi gormek.", correct: "Altlik, egim, donus ve koruma katmanlarini birlikte ele almak." },
      { wrong: "Su testini teslim sonrasina birakmak.", correct: "Kaplama ve kapanis öncesi kontrollu test yapmak." },
      { wrong: "Teknik ekipman gecislerini sonradan delip gecmek.", correct: "Bu gecisleri sistem detayina önceden dahil etmek." },
      { wrong: "Teras catida enerji ve isi yalitim konusunu su yalitimindan ayri gormek.", correct: "Kabuk performansini üst ortu sistemi olarak birlikte okumak." },
      { wrong: "Duz catiyi kolay çatı sanmak.", correct: "Su tahliye ve detay disiplini acisindan en hassas çatı tiplerinden biri oldugunu kabul etmek." },
    ],
    designVsField: [
      "Projede teras çatı birkaç katman kesiti gibi görünür; sahada ise suyun yolu, egim, gider ve detay disiplini ile yasayan bir kabuktur.",
      "Iyi teras çatı sessiz calisir ve suyu bekletmeden uzaklastirir; kötü teras çatı ise en küçük yagista kendini belli eder.",
      "Bu nedenle teras çatı kalitesi, en fazla lokal dugum kontrolunde ortaya cikar.",
    ],
    conclusion: [
      "Teras çatı doğru egim, doğru yalitim ve doğru detaylarla kuruldugunda uzun omurlu ve guvenilir bir üst ortu cozumudur. Bu zincir zayif kuruldugunda ise su sorunu yapinin en zor tamir edilen kusurlarindan birine donusur.",
      "Bir insaat muhendisi için en saglam yaklasim, teras catiyi duz bir yüzey degil; suyu milimetrik kararlarla yoneten teknik bir kabuk olarak gormektir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["teras çatı", "su tahliyesi", "egim sapi", "TS 825", "çatı yalitimi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti", "ince-isler/cati-kaplamasi/membran-cati", "ince-isler/cati-kaplamasi/metal-cati"],
  },
];
