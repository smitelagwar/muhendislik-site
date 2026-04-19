import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_STRUCTURAL_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_1995_SOURCE: BinaGuideSource = {
  title: "TS EN 1995-1-1 Eurocode 5 - Ahşap Yapilarin Tasarımı",
  shortCode: "TS EN 1995-1-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Ahşap taşıyıcı elemanlar, bağlantı detaylari ve servis kosullari için temel referanslardan biridir.",
};

const DONATI_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Idecad / ETABS doseme ciktilari", purpose: "Aciklik davranisini ve donati yogunlugunu pafta ile eslestirmek." },
  { category: "Cizim", name: "Shop drawing ve panel donati plani", purpose: "Asal, dagitma ve ek bolgelerini sahada okunabilir hale getirmek." },
  { category: "Kontrol", name: "Sehpa ve rezervasyon checklisti", purpose: "Üst donati kotunu ve tesisat bosluklarini beton öncesi dogrulamak." },
  { category: "Kayıt", name: "Panel bazli foto ve ölçü formu", purpose: "Genis yuzeylerde bolgesel degil tüm panel disiplini kurmak." },
];

const DONATI_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Kesme-bukme tezgahi ve panel etiketleme seti", purpose: "Doseme donatisini cap ve boy bazinda duzenli hazirlamak.", phase: "Atolye" },
  { group: "Montaj", name: "Bag teli, pense, sehpa ve spacer", purpose: "Alt-üst donatiyi doğru kotta ve duzende tutmak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Lazer nivo, metre ve ag kontrol cizelgesi", purpose: "Genis panelde aralik ve kot surekliligini olcmek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Tesisat kutusu, rezervasyon kalibi ve isaretleme seti", purpose: "Sonradan kesme ihtiyacini azaltmak için bosluklari planli birakmak.", phase: "Montaj öncesi" },
];

const ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Çatı plani, mahya kesiti ve bağlantı paftalari", purpose: "Mertek, asik ve mahya davranisini sahaya net indirmek." },
  { category: "Ölçüm", name: "Lazer nivo, aci olcer ve rutubet olcer", purpose: "Egim, geometri ve ahşap kuruluk seviyesini montaj öncesi teyit etmek." },
  { category: "Kontrol", name: "Bağlantı ve havalandirma checklisti", purpose: "Rüzgar, buhar ve bağlantı detaylarini bir arada denetlemek." },
  { category: "Kayıt", name: "Numune dugum ve montaj foyi", purpose: "Ahşap catida usta refleksi yerine tekrar edilebilir detay mantigi kurmak." },
];

const ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Mertek, asik, makas ve yardimci kusaklar", purpose: "Ahşap catinin ana yuk aktarimini ve geometrisini kurmak.", phase: "Montaj" },
  { group: "Bağlantı", name: "Civata, vida, saplama ve ankraj seti", purpose: "Dugumlerin rüzgar ve servis yukleri altinda acilmasini engellemek.", phase: "Birlesim" },
  { group: "Kabuk", name: "OSB, su yalitim altligi ve havalandirma detaylari", purpose: "Kaplama altinda kuru ve nefes alan bir çatı kabugu olusturmak.", phase: "Kaplama öncesi" },
  { group: "Güvenlik", name: "Iskele, yasam hatti ve gecici platform", purpose: "Egilimli yuzeyde guvenli montaj ve düzgün kontrol saglamak.", phase: "Tüm süreç" },
];

export const kabaInsaatStructuralDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/doseme-donati",
    kind: "topic",
    quote: "Doseme donatisi, genis yuzeyli elemanin yalnız moment kapasitesini degil, catlak kontrolunu ve kat duzleminin servis kalitesini de belirler.",
    tip: "Doseme donatisinda en sık hata, genis panel rahatligina aldanip asal yon, dagitma cubugu, üst donati ve rezervasyon disiplinini sahada birbirine karistirmaktir.",
    intro: [
      "Doseme donatisi, betonarme yapinin en genis alanli ama en kolay hafife alinan imalatlarindan biridir. Yüzey buyudukce hata kuculuyor gibi görünür; gercekte ise küçük saha kaymalari butun panelin davranisini etkileyebilir. Bu nedenle doseme, kiris kadar dramatik dugumler gostermese de aynı olcude muhendislik dikkati ister.",
      "Sahada en yaygin sorun, panelin duz ve sakin gorunmesi nedeniyle donati duzeninin detay seviyesinde kontrol edilmemesidir. Asal yonle dagitma yonunun karismasi, üst donatinin sehpa yetersizligiyle asagi inmesi, rezervasyonlarin sonradan kesilmesi ve isci trafigiyle aralik bozulmasi uzun vadede catlak ve sehim davranisina yazilir.",
      "Bir insaat muhendisi için doseme donatisi yalnız cap ve aralik sayimi degildir. Üst- alt katman iliskisi, tesisat kutulari, saft bosluklari, kalinlik toleransi ve beton dokumu sirasinda panelin nasil korunacagi birlikte yonetilmelidir.",
      "Bu nedenle doseme donatisini, genis alanli bir tekrar imalati degil; duzen, kot ve koordinasyon disiplini isteyen bir panel muhendisligi olarak ele almak gerekir.",
    ],
    theory: [
      "Dosemede asal donati yuku ana çalışma yonunde tasir; dagitma donatisi ise catlak kontrolunu, ikincil tasimayi ve panel davranisinin dengelenmesini saglar. Bir yonun daha kritik olmasi, diger yonun gelişigüzel uygulanabilecegi anlamina gelmez. Genis panelde duzen kaybi, elemanin gercek davranisini projeden uzaklastirir.",
      "Üst donati konumu, teorik olarak cizimde sabit gorunse de sahada sehpa kalitesi, yürüme trafigi ve pompa hortumu hareketiyle bozulmaya çok aciktir. Üst donati asagi dustugunde panelin negatif moment ve catlak kontrol performansi görünmez bicimde zayiflar. Bu hata beton dokumu sirasinda fark edilmezse ancak servis davranisinda okunur.",
      "Dosemede rezervasyonlar ayri bir yapisal konudur. Elektrik kutusu, saft gecisi, mekanik bosluk veya merdiven agzi nedeniyle cubuklar kesilecekse bu telafi karari mutlaka proje mantigi icinde verilmelidir. Sonradan rastgele kesilen cubuk, genis panelde gizli zayiflik uretir.",
      "TS 500 mantigi geregi doseme yalnız dayanimi degil servis performansini da yonetir. Bu nedenle donati araligi, ek duzeni ve panel kalinligi birlikte okunmadan yapilan saha kabulu eksik kalir.",
    ],
    ruleTable: [
      {
        parameter: "Asal ve dagitma donati duzeni",
        limitOrRequirement: "Donati yonleri, araliklari ve panel mantigi proje duzenine göre korunmali",
        reference: "TS 500",
        note: "Genis panel rahatligi, yon bilgisinin kaybolmasina yol acmamalidir.",
      },
      {
        parameter: "Üst donati kötü",
        limitOrRequirement: "Sehpa ve spacer sistemi üst donatinin tasarim kotunda kalmasini saglamali",
        reference: "TS EN 13670 + saha uygulama disiplini",
        note: "Üst donatinin asagi inmesi gorunmeyen ama etkili kalite kaybidir.",
      },
      {
        parameter: "Rezervasyon ve bosluklar",
        limitOrRequirement: "Tesisat kutusu ve bosluklar donati surekliligini bozmayacak sekilde önceden cozulmeli",
        reference: "TS 500 + proje koordinasyonu",
        note: "Sonradan kesilen cubuklar ancak muhendislik karariyla telafi edilir.",
      },
      {
        parameter: "Panel bazli saha kabul",
        limitOrRequirement: "Genis yüzey tek nokta yerine ag mantigiyla kontrol edilmelidir",
        reference: "Saha kalite plani",
        note: "Bolgesel bakis tüm panelin doğru kuruldugu anlamina gelmez.",
      },
    ],
    designOrApplicationSteps: [
      "Doseme panelinde asal ve dagitma yonlerini pafta ve saha isaretleriyle acikca belirle.",
      "Alt donatiyi aralik duzenini bozmadan ser, ardindan sehpalarla üst katman kotunu kur.",
      "Elektrik kutusu, saft ve diger rezervasyonlari cubuk kesmeden once proje ile teyit et.",
      "Paneli tek merkezden degil ag seklinde gezerek sehpa zayifligi, aralik bozulmasi ve yon karismasini kontrol et.",
      "Beton dokumu sirasinda hortum ve yürüme trafiginin üst donatiyi itmeyecegi bir geçiş duzeni kur.",
      "Beton öncesi son turda paneli bolgesel degil butun olarak okuyup foto ve kontrol formuyla kapat.",
    ],
    criticalChecks: [
      "Asal ve dagitma yonleri sahada karismis mi?",
      "Üst donati sehpa üzerinde yeterince korunuyor mu?",
      "Isci trafigi bazi bolgelerde araligi ve kötü bozmus mu?",
      "Rezervasyonlar nedeniyle kesilen cubuklar projede telafi edilmis mi?",
      "Beton öncesi tüm panel için ag mantikli bir kabul yapildi mi?",
      "Pompa hortumu hareketi panelin zayif bolgelerini bozuyor mu?",
    ],
    numericalExample: {
      title: "5,0 x 8,0 m panelde cubuk adedi ve duzen yorumu",
      inputs: [
        { label: "Panel boyutu", value: "5,0 m x 8,0 m", note: "Tek doseme paneli" },
        { label: "Donati araligi", value: "phi12 / 15 cm", note: "Ana yon için ornek" },
        { label: "5,0 m yonunde adet", value: "34 cubuk", note: "(5,0 / 0,15) + 1" },
        { label: "8,0 m yonunde adet", value: "54 cubuk", note: "(8,0 / 0,15) + 1" },
      ],
      assumptions: [
        "Hesap ilk saha kontrolu icindir; bindirme ve fire ayri degerlendirilecektir.",
        "Panel icinde buyuk rezervasyon bulunmadigi kabul edilmistir.",
        "Üst ve alt donati duzenleri ayri isaretlenmistir.",
      ],
      steps: [
        {
          title: "Adet kontrolunu yap",
          result: "Yaklasik adet hesabi, sahaya gelen demirin pafta ile kaba uyumunu hızlı dogrular.",
          note: "Bu kontrol eksik serim veya yanlış sayim riskini erken yakalar.",
        },
        {
          title: "Duzenin bozulup bozulmadigini sorgula",
          result: "Adet doğru olsa bile sehpa cokmesi veya yon karisikligi varsa panel davranisi bozulabilir.",
          note: "Genis yuzeyde nicelik kadar konum da onemlidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Doseme donatisi için sayim ilk adimdir; asil kalite panelin her noktasinda aynı kot ve aynı duzenin korunmasidir.",
          note: "Panel duzeni bozuldugunda hata beton altinda gizlenir.",
        },
      ],
      checks: [
        "Adet kontrolu sehpa ve yon kontrolu ile birlikte tamamlanmalidir.",
        "Rezervasyonlar panel duzenini bozuyorsa ayri olarak telafi edilmelidir.",
        "Üst donati beton gunu yeniden gözden gecirilmelidir.",
        "Genis panelde tek bir bolgeye bakarak kabul verilmemelidir.",
      ],
      engineeringComment: "Doseme donatisinda sorun cogu zaman eksik cubuktan degil, genis yuzeyde kaybolan kot ve duzen disiplininden dogar.",
    },
    tools: DONATI_TOOLS,
    equipmentAndMaterials: DONATI_EQUIPMENT,
    mistakes: [
      { wrong: "Donati yonlerini sahada sozlu tarifle birakmak.", correct: "Yonu ve bolgeyi fiziksel isaretleme ile netlestirmek." },
      { wrong: "Üst donatiyi yetersiz sehpa ile yürüme trafigine birakmak.", correct: "Panel boyunca standart sehpa duzeni kurmak." },
      { wrong: "Rezervasyon için cubuklari sahada rastgele kesmek.", correct: "Kesinti ve telafiyi proje ile birlikte cozumlemek." },
      { wrong: "Genis panelde birkaç bolgeye bakip tüm paneli kabul etmek.", correct: "Ag mantigiyla tüm paneli kontrol etmek." },
      { wrong: "Dagitma donatisini ikincil gorup gevsek uygulamak.", correct: "Catlak kontrolundeki rolunu dikkate alarak aynı disiplinle yerlestirmek." },
      { wrong: "Pompa ve yürüme yollarini panel zayifliklarini dusunmeden belirlemek.", correct: "Beton gunu lojistigini donati korumasina göre kurmak." },
    ],
    designVsField: [
      "Projede doseme donatisi tekrarlayan cizgiler gibi görünür; sahada ise bu cizgilerin yonunu, araligini ve kotunu korumak basli basina kalite isidir.",
      "Bu yuzden doseme donatisi, genis alanli sistemlerde duzen koruma disiplininin en net testlerinden biridir.",
      "Iyi panel, yalnız yeterli demir tasidigi için degil tüm yuzeyde aynı mantikla kuruldugu için degerlidir.",
    ],
    conclusion: [
      "Doseme donatisi doğru yonetildiginde yüzey catlak kontrolu, servis davranisi ve genel kat kalitesi birlikte iyilesir.",
      "Duzen bozuldugunda ise hata beton altinda görünmez hale gelir ama etkisi sehim, catlak ve rezervasyon kaynakli zayiflik olarak devam eder.",
    ],
    sources: [...KABA_STRUCTURAL_SOURCES, SOURCE_LEDGER.ts500],
    keywords: ["doseme donatisi", "asal donati", "dagitma donatisi", "sehpa", "rezervasyon"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/ahsap-cati",
    kind: "topic",
    quote: "Ahşap çatı hafif olabilir; ama bu hafiflik ancak kuruluk, bağlantı ve havalandirma disiplinleri birlikte kuruldugunda avantaja donusur.",
    tip: "Ahşap catiyi yalnız mertek dizme isi gibi gormek, malzemenin rutubet davranisini, rüzgar altindaki bağlantı ihtiyacini ve kaplama altindaki hava akis zorunlulugunu ihmal etmektir.",
    intro: [
      "Ahşap çatı, düşük katli yapilarda hızlı montaj, hafiflik ve islenebilirlik avantaji sayesinde yaygin kullanilir. Ancak sistemin gercek kalitesi yalnız catinin kurulmasinda degil, ahsabin kuruluk seviyesi, bağlantı dugumleri, havalandirma boslugu ve kaplama alti davranisinda ortaya cikar.",
      "Sahada en buyuk hata, ahşap elemanlarin metal sistemler kadar duyarsiz sanilmasidir. Oysa rutubeti yuksek malzeme zamanla doner, bağlantı noktalarinda acilma yapar veya kaplama altinda ses ve geometri bozuklugu uretir. Bu nedenle ahşap çatı, montaj hizinin ardina saklanmamasi gereken bir malzeme disiplinidir.",
      "Bir muhendis için ahşap çatı yalnız taşıyıcı kurgu degildir. Egim, mertek araligi, mahya surekliligi, ankraj, rüzgar emmesi, buhar hareketi ve havalandirma boslugu aynı sistemin farkli yuzleridir. Bu kararlar ayrildiginda çatı ilk bakista düzgün gorunse bile ilk mevsim dongulerinde sorun vermeye baslar.",
      "Dolayisiyla ahşap çatı, dogal malzemenin avantajini alirken onun davranisini da ciddiyetle yonetmek zorunda olan bir saha muhendisligi isidir.",
    ],
    theory: [
      "Ahşap anisotropik bir malzemedir; nem ve sıcaklık degisimlerine celikten farkli tepki verir. Bu nedenle eleman secimi ve montajdaki rutubet seviyesi, catinin sonraki aylardaki geometri kararliligini belirler. Duz elemanla kurulan çatı, nemli malzeme kullanildiginda zamanla sarili veya acilan bir sisteme donusebilir.",
      "Taşıyıcı davranis yalnız mertek boyuyla ilgili degildir. Mahya, asik, mertek, bağlantı levhasi ve ankraj birlikte calisir. Rüzgar emmesi, kar yuku ve bakım trafigi aynı çatı dugumlerinde toplanir. Bu nedenle bağlantı detaylari usta aliskanligiyla degil hesap ve tekrar edilebilir uygulama mantigiyla kurulmalidir.",
      "Ahşap çatı aynı zamanda bir kabuk sistemidir. TS 825 mantigina uygun isi yalitimi, buhar hareketi ve havalandirma boslugu cozulmediginde ahşap eleman kuruluk dengesini kaybeder. Kaplama altinda biriken nem yalnız enerji kaybi degil malzeme omru problemi de uretir.",
      "Bu yuzden ahşap çatı projede sıcak ve yaln bir cozum gibi gorunse de sahada en teknik basliklardan biridir: geometri, malzeme, bağlantı ve yapı fizigi aynı anda okunur.",
    ],
    ruleTable: [
      {
        parameter: "Ahşap malzeme kurulugu ve dogrulugu",
        limitOrRequirement: "Montaja girecek elemanlar düzgün, uygun kurulukta ve gozle kusurlari kontrol edilmis olmali",
        reference: "TS EN 1995-1-1 + saha kabul disiplini",
        note: "Rutubetli ve egri ahşap sistem davranisini baslangictan bozar.",
      },
      {
        parameter: "Bağlantı ve ankraj",
        limitOrRequirement: "Dugumler rüzgar ve dusay yuk etkileri dusunulerek tekrar edilebilir detayla kurulmalidir",
        reference: "TS EN 1995-1-1",
        note: "Ahşap catida bağlantı, eleman kadar tasiyicidir.",
      },
      {
        parameter: "Havalandirma ve kabuk davranisi",
        limitOrRequirement: "Kaplama altinda hava akisi ve nem tahliyesi saglanmali, isi yalitimi kabukla uyumlu cozulmeli",
        reference: "TS 825",
        note: "Nefes almayan çatı, zamanla ahsapta servis omru sorunu uretir.",
      },
      {
        parameter: "Geometri ve egim",
        limitOrRequirement: "Mahya, sacak ve mertek hattinda surekli egim korunmali",
        reference: "Planli Alanlar Imar Yonetmeligi + saha ölçüm disiplini",
        note: "Küçük geometri sapmalari kaplama altinda buyuk dalga yaratir.",
      },
    ],
    designOrApplicationSteps: [
      "Mertek, asik ve mahya kurgusunu aciklik, egim ve kaplama sistemi ile birlikte netlestir.",
      "Montaja girecek ahşap elemanlari kuruluk, dogruluk ve kusur acisindan ayikla.",
      "Ankraj, civata ve bağlantı levhalarini numune dugum uzerinden once test edip sonra seri uygula.",
      "Mahya, sacak ve kaplama alti havalandirma bosluklarini proje detayinda tarif ettigin gibi sahada da koru.",
      "Lazer nivo ve aci kontrolu ile tüm çatı boyunca egim ve dogrultu surekliligini olc.",
      "Kaplama öncesi çatı iskeletini butun olarak gezip rüzgar, nem ve bakım senaryosu acisindan son tur yap.",
    ],
    criticalChecks: [
      "Montaja giren ahşap elemanlarin rutubet ve dogruluk kontrolu yapildi mi?",
      "Mahya ve sacak hattinda tüm çatı boyunca aynı geometri korunuyor mu?",
      "Ankraj ve bağlantı levhalari her dugumde aynı mantikla uygulanmis mi?",
      "Kaplama altinda hava akisi ve buhar tahliyesi için surekli bosluk var mi?",
      "Mertek araliklari kaplama sisteminin ihtiyaciyla uyumlu mu?",
      "Catiya sonradan gelecek cihaz ve baca gecisleri detayda dusunuldu mu?",
    ],
    numericalExample: {
      title: "8 m aciklikta %33 egimli ahşap çatı için mahya yuksekligi yorumu",
      inputs: [
        { label: "Toplam aciklik", value: "8,0 m", note: "Iki yana egimli çatı" },
        { label: "Yarim aciklik", value: "4,0 m", note: "Sacaktan mahyaya yatay mesafe" },
        { label: "Hedef egim", value: "%33", note: "Ornek uygulama degeri" },
        { label: "Hedef", value: "Mahya kotunu sahada somutlamak", note: "Montaj geometri kontrolu için" },
      ],
      assumptions: [
        "Egim yatay izdusum uzerinden okunmaktadir.",
        "Mahya hatti tüm boy boyunca aynı kotta kurulacaktir.",
        "Kaplama sistemi bu egim bandi ile uyumludur.",
      ],
      steps: [
        {
          title: "Kot farkini hesapla",
          formula: "4,0 x 0,33 = 1,32 m",
          result: "Sacak ile mahya arasinda yaklasik 1,32 m kot farki gerekir.",
          note: "Bu deger çatı geometrisini sahada sayisal olarak netlestirir.",
        },
        {
          title: "Montaj etkisini yorumla",
          result: "Mahya hatti boyunca bu kot farki korunmazsa kaplama alti duzlem bozulur ve su tahliyesi zayiflar.",
          note: "Ahşap catida küçük geometri sapmasi kaplama altinda buyuk dalga olarak okunur.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Geometri yalnız estetik konu degildir; bağlantı davranisi, su yonu ve havalandirma boslugu da bu kot kararina baglidir.",
          note: "Egim cizimde yazili oldugu için degil sahada surekli olculdugu için gerceklesir.",
        },
      ],
      checks: [
        "Mahya kötü tek noktadan degil tüm hat boyunca kontrol edilmelidir.",
        "Kaplama duzlemi ve havalandirma boslugu aynı geometri mantigiyla ilerlemelidir.",
        "Ankraj ve bağlantı detaylari geometri kadar kritik kabul edilmelidir.",
        "Egim karari olcuyle teyit edilmeden kaplama asamasina gecilmemelidir.",
      ],
      engineeringComment: "Ahşap catida geometri, estetikten once su, rüzgar ve malzeme omru davranisini belirleyen teknik bir karardir.",
    },
    tools: ROOF_TOOLS,
    equipmentAndMaterials: ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Rutubetli veya egri ahsabi montaja almak.", correct: "Elemanlari kuruluk ve dogruluk acisindan secerek kullanmak." },
      { wrong: "Bağlantı detaylarini usta refleksine birakmak.", correct: "Her dugumu tekrar edilebilir teknik detayla kurmak." },
      { wrong: "Kaplama altinda havalandirma boslugunu ihmal etmek.", correct: "Yapı fizigi ve malzeme omru için surekli hava akisi saglamak." },
      { wrong: "Mahya ve sacak dogrultusunu birkaç noktadan doğru gormekle yetinmek.", correct: "Tüm hat boyunca surekliligi olcmek." },
      { wrong: "Rüzgar ankrajini hafif sistem diye onemsiz saymak.", correct: "Ahşap catida bağlantı ve ankraji ana taşıyıcı karar saymak." },
      { wrong: "Cihaz ve baca gecislerini sonradan saha cozumune birakmak.", correct: "Çatı iskeleti kurulmadan once detaylara dahil etmek." },
    ],
    designVsField: [
      "Projede ahşap çatı sıcak ve yaln bir sistem gibi gorunebilir; sahada ise rutubet, havalandirma ve bağlantı detaylari bu sadeligin gercek bedelini belirler.",
      "Iyi ahşap çatı, sadece hızlı kurulan degil mevsim donuslerinde de geometri ve kuruluk dengesini koruyan catidir.",
      "Bu nedenle ahşap çatı, dogal malzemenin cazibesini ancak disiplinli muhendislikle uzun omurlu cozum haline getirir.",
    ],
    conclusion: [
      "Ahşap çatı doğru malzeme, doğru bağlantı ve doğru havalandirma ile kuruldugunda hafif, hızlı ve uzun omurlu bir sistem sunar.",
      "Bu disiplinler ihmal edildiginde ise ilk mevsim gecislerinde geometri bozuklugu, nem sorunu ve kaplama problemleriyle avantajini hizla kaybeder.",
    ],
    sources: [...KABA_STRUCTURAL_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar, TS_EN_1995_SOURCE],
    keywords: ["ahşap çatı", "mertek", "mahya", "havalandirma boslugu", "TS EN 1995"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti", "ince-isler/cati-kaplamasi/kiremit"],
  },
];
