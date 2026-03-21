import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TERRACE_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Teras cati katman kesiti ve su tahliye plani", purpose: "Yalitim, egim, gider ve parapet detaylarini ayni sistem olarak okumak." },
  { category: "Olcum", name: "Lazer nivo, egim kontrolu ve su testi checklisti", purpose: "Teras catida gorunmeyen su riskini teslim oncesi olculu bicimde yakalamak." },
  { category: "Kontrol", name: "Detay nodu ve gider kabul formu", purpose: "Parapet, gider, su basman ve cihaz ayaklarini ayri kalite kalemi gibi yonetmek." },
  { category: "Kayit", name: "Katman tamamlama ve kapanis fotograflari", purpose: "Ust uste kapanan teras cati katmanlarini izlenebilir tutmak." },
];

const TERRACE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Altlik", name: "Tasiyici doseme, egim sapi ve tesviye katmani", purpose: "Su tahliyesi ve yalitim icin dogru geometriyi kurmak.", phase: "Hazirlik" },
  { group: "Yalitim", name: "Su yalitimi katmanlari, pah bandi ve koruma katmani", purpose: "Teras catinin su gecirimsizlik omurgasini olusturmak.", phase: "Yalitim" },
  { group: "Tahliye", name: "Cati giderleri, su toplama detaylari ve tasma senaryosu", purpose: "Suyun kontrolsuz birikmesini onlemek.", phase: "Detay cozumu" },
  { group: "Kapanis", name: "Kaplama ve koruma sistemleri", purpose: "Yalitim katmanini son kullanim senaryosuna uygun korumak.", phase: "Teslim" },
];

export const terasCatiDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/cati-iskeleti/teras-cati",
    kind: "topic",
    quote: "Teras cati, ustte duz bir yuzey degil; suyu kontrol eden, yalitimi koruyan ve tum detaylarini milimetrelerle cozen teknik bir kabuktur.",
    tip: "Teras catiyi duz doseme ustune yalitim atilan basit bir cozum gibi gormek, suyu ve detay riskini gizli ama pahali bir probleme donusturur.",
    intro: [
      "Teras cati yapilarda estetik ve kullanim kolayligi saglayan bir ust ortu tipidir. Ancak bu avantaj yalniz duz bir cati yuzeyiyle degil; suyun kontrollu tahliyesi, dogru egim, saglam yalitim ve kritik dugumlerin temiz cozulmesi ile elde edilir. Bu nedenle teras cati yalniz ustte gezilen veya teknik ekipman konan bir platform degil, dikkatle kurulmasi gereken bir kabuk sistemidir.",
      "Sahadaki en buyuk yanlis, teras catiyi yassi doseme ustune eklenen birkac katmandan ibaret sanmaktir. Oysa gider kotu, parapet donusu, cihaz ayagi, derzler, su basma kotu ve egim yetersizligi gibi sorunlar catiyi kisa surede sizinti ve bakım problemine donusturur. Bu sistemde hata genelde ilk siddetli yagista veya birikme yapan su lekesinde ortaya cikar.",
      "Bir insaat muhendisi icin teras cati; doseme ustu geometri, egim sapi, su yalitimi, koruma katmani ve kullanima acma mantigini birlikte okumak demektir. Tasarim ile saha arasindaki en kritik kopma da burada yasanir: kagit uzerinde cizilen egim, sahada yeterince olculmezse sistem yalitim markasindan bagimsiz olarak sorun uretir.",
      "Bu rehberde teras catıyı; teknik teori, enerji ve yalitim ekseni, sayisal egim yorumu, ekipman, araclar ve saha hatalariyla birlikte uzun-form bir blog yazisi gibi ele aliyoruz.",
    ],
    theory: [
      "Teras cati davranisinin cekirdeginde su yer alir. Sistem ne kadar dayanikli malzemeden olusursa olussun, suyu bekletiyor veya detaylarda dogru yone aktaramiyorsa performansini kaybeder. Bu nedenle teras catinin ilk prensibi suyu iceri almamak kadar, suyu ust yuzeyde gereksiz yere tutmamaktir.",
      "Egim bu davranisin ana aracidir. Duvar, parapet, gider ve lokal cotuk detaylar dogru kurgulanmadiginda kagit uzerinde var olan egim bile sahada yetersiz kalabilir. Su toplama riskinin en cok arttigi noktalar genis alan ortalari, parapet dipleri ve gider cevreleridir. Bu nedenle teras cati olcumu genel yuzey ortalamasiyla degil kritik dugumler uzerinden yapilmalidir.",
      "Su yalitimi katmanlari yalniz malzeme secimiyle degerlendirilmez. Altligin temizligi, pah detaylari, bindirme duzeni, koruma tabakasi ve ust kaplama ile uyumu birlikte performans belirler. Yalitimin en zayif noktasi genelde genel yuzey degil; parapet donusu, gider bogazi, genlesme derzi veya cihaz ayagi gibi lokal dugumlerdir.",
      "Teras cati ayni zamanda enerji ve servis omru konusudur. TS 825 ve enerji performansi mantigina gore ust kabukta yapilan her eksik yalitim karari, isitma-sogutma yukunu etkiler. Yani teras cati yalniz su gecirmezlik konusu degil; enerji kaybi ve yuzey dayanikliligi konusudur.",
      "Bu bakisla teras cati, en cok detay disiplini isteyen sistemlerden biridir. Iyi uygulandiginda uzun omurlu ve sessiz calisir; kotu uygulandiginda ise tamir edilmesi en zor imalatlardan birine donusur.",
    ],
    ruleTable: [
      {
        parameter: "Egim ve su tahliyesi",
        limitOrRequirement: "Yuzey suyu giderlere yonlendirecek kesintisiz egim ve detay butunlugu kurulmalidir",
        reference: "Uygulama detay plani",
        note: "Su toplama yapan teras cati, yalitim kalitesinden bagimsiz risk tasir.",
      },
      {
        parameter: "Kabuk ve enerji davranisi",
        limitOrRequirement: "Teras cati isi yalitimi ve ust kabuk katmanlari enerji performansi mantigiyla uyumlu olmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Ust ortu enerji kabugunun en kritik yuzeylerinden biridir.",
      },
      {
        parameter: "Su yalitimi detaylari",
        limitOrRequirement: "Parapet, gider, derz ve donusler ana yuzey kadar dikkatle cozulmelidir",
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
        parameter: "Kullanim ve ekipman yukleri",
        limitOrRequirement: "Teknik cihaz, yaya trafigi veya kaplama gibi son kullanim kararlar yalitim ve koruma ile birlikte degerlendirilmelidir",
        reference: "Teras kullanim senaryosu",
        note: "Duz cati herkes icin ayni cozum degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Doseme ust kotlarini, gider yerlerini ve parapet detaylarini ayni geometri planiyla netlestir.",
      "Egim sapini genel yuzeyde oldugu kadar gider, parapet ve lokal dugumlerde de olcerek kur.",
      "Yalitim katmanlarini temiz altlik, pah detaylari ve bindirme disiplini ile uygula.",
      "Gider bogazi, cihaz ayagi ve derzleri genel yuzeyden ayri bir kalite kalemi gibi kontrol et.",
      "Yalitim ustu koruma ve son kullanim katmanini, sistemin delinmeyecegi ve suyu tutmayacagi mantikla tamamla.",
      "Teslim oncesi su testi ve kritik dugum turunu yaparak catiyi kapat.",
    ],
    criticalChecks: [
      "Giderler ve genel yuzey arasinda suyu dogru yonlendiren egim gercekten olustu mu?",
      "Parapet dipleri ve lokal kot dusuklukleri birikinti riski tasiyor mu?",
      "Yalitim donusleri ve bindirmeleri temiz ve eksiksiz mi?",
      "Teknik cihaz ayaklari veya gecisler yalitimi zayiflatiyor mu?",
      "Koruma katmani yalitimi sahada erken hasara karsi yeterince koruyor mu?",
      "Su testi yalniz genis yuzeyde degil, kritik dugumlerde de uygulandi mi?",
    ],
    numericalExample: {
      title: "12 m teras catida minimum kot farki yorumu",
      inputs: [
        { label: "Yatay mesafe", value: "12 m", note: "Gider yonune olan toplam mesafe" },
        { label: "Ornek egim", value: "%2", note: "Uygulama yorumunda sik kullanilan egim duzeyi" },
        { label: "Hedef", value: "Gerekli kot farkini okumak", note: "Su tahliyesini kontrol etmek" },
        { label: "Amac", value: "Kritik dugumlerde egim kaybi riskini gormek", note: "Saha kontrolu" },
      ],
      assumptions: [
        "Yuzey genel olarak tek yone tahliye verecektir.",
        "Lokal sehim veya beton dalgasi sonradan olusmayacaktir.",
        "Hesap saha yorumu icin kullanilmaktadir.",
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
          note: "Teras cati sorunu genelde genel egimin degil lokal detay kaybinin sonucudur.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Egim karari plan notu olarak degil, sahada olculen ve dugumlerde tekrar teyit edilen bir kalite kriteri olarak okunmalidir.",
          note: "Duz cati en fazla olcu isteyen cati tiplerinden biridir.",
        },
      ],
      checks: [
        "Genel egim degeri kritik dugumlerde yeniden okunmalidir.",
        "Suyun gidecegi yol parapet ve cihaz detaylariyla kesilmemelidir.",
        "Yalitim testleri egim kalitesinin yerine gecmez; ikisi birlikte degerlendirilmelidir.",
        "Kullanim karari teknik cati ile gezilebilir catiyi ayni sistem sanmamalidir.",
      ],
      engineeringComment: "Teras catida en buyuk sorun suyun varligi degil, onun nereye gidecegine sahada yeterince karar verilmemis olmasidir.",
    },
    tools: TERRACE_TOOLS,
    equipmentAndMaterials: TERRACE_EQUIPMENT,
    mistakes: [
      { wrong: "Teras catida genel yuzey egimi var diye dugum detaylarini onemsiz sanmak.", correct: "Gider, parapet ve cihaz ayaklarini ayri kalite kalemi gibi kontrol etmek." },
      { wrong: "Yalitim markasini cozumun tamami gibi gormek.", correct: "Altlik, egim, donus ve koruma katmanlarini birlikte ele almak." },
      { wrong: "Su testini teslim sonrasina birakmak.", correct: "Kaplama ve kapanis oncesi kontrollu test yapmak." },
      { wrong: "Teknik ekipman gecislerini sonradan delip gecmek.", correct: "Bu gecisleri sistem detayina onceden dahil etmek." },
      { wrong: "Teras catida enerji ve isi yalitim konusunu su yalitimindan ayri gormek.", correct: "Kabuk performansini ust ortu sistemi olarak birlikte okumak." },
      { wrong: "Duz catiyi kolay cati sanmak.", correct: "Su tahliye ve detay disiplini acisindan en hassas cati tiplerinden biri oldugunu kabul etmek." },
    ],
    designVsField: [
      "Projede teras cati birkac katman kesiti gibi gorunur; sahada ise suyun yolu, egim, gider ve detay disiplini ile yasayan bir kabuktur.",
      "Iyi teras cati sessiz calisir ve suyu bekletmeden uzaklastirir; kotu teras cati ise en kucuk yagista kendini belli eder.",
      "Bu nedenle teras cati kalitesi, en fazla lokal dugum kontrolunde ortaya cikar.",
    ],
    conclusion: [
      "Teras cati dogru egim, dogru yalitim ve dogru detaylarla kuruldugunda uzun omurlu ve guvenilir bir ust ortu cozumudur. Bu zincir zayif kuruldugunda ise su sorunu yapinin en zor tamir edilen kusurlarindan birine donusur.",
      "Bir insaat muhendisi icin en saglam yaklasim, teras catiyi duz bir yuzey degil; suyu milimetrik kararlarla yoneten teknik bir kabuk olarak gormektir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["teras cati", "su tahliyesi", "egim sapi", "TS 825", "cati yalitimi"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti", "ince-isler/cati-kaplamasi/membran-cati", "ince-isler/cati-kaplamasi/metal-cati"],
  },
];
