import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_STRUCTURAL_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_1995_SOURCE: BinaGuideSource = {
  title: "TS EN 1995-1-1 Eurocode 5 - Ahsap Yapilarin Tasarimi",
  shortCode: "TS EN 1995-1-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Ahsap tasiyici elemanlar, baglanti detaylari ve servis kosullari icin temel referanslardan biridir.",
};

const DONATI_TOOLS: BinaGuideTool[] = [
  { category: "Analiz", name: "Idecad / ETABS doseme ciktilari", purpose: "Aciklik davranisini ve donati yogunlugunu pafta ile eslestirmek." },
  { category: "Cizim", name: "Shop drawing ve panel donati plani", purpose: "Asal, dagitma ve ek bolgelerini sahada okunabilir hale getirmek." },
  { category: "Kontrol", name: "Sehpa ve rezervasyon checklisti", purpose: "Ust donati kotunu ve tesisat bosluklarini beton oncesi dogrulamak." },
  { category: "Kayit", name: "Panel bazli foto ve olcu formu", purpose: "Genis yuzeylerde bolgesel degil tum panel disiplini kurmak." },
];

const DONATI_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Kesme-bukme tezgahi ve panel etiketleme seti", purpose: "Doseme donatisini cap ve boy bazinda duzenli hazirlamak.", phase: "Atolye" },
  { group: "Montaj", name: "Bag teli, pense, sehpa ve spacer", purpose: "Alt-ust donatiyi dogru kotta ve duzende tutmak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Lazer nivo, metre ve ag kontrol cizelgesi", purpose: "Genis panelde aralik ve kot surekliligini olcmek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Tesisat kutusu, rezervasyon kalibi ve isaretleme seti", purpose: "Sonradan kesme ihtiyacini azaltmak icin bosluklari planli birakmak.", phase: "Montaj oncesi" },
];

const ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Cati plani, mahya kesiti ve baglanti paftalari", purpose: "Mertek, asik ve mahya davranisini sahaya net indirmek." },
  { category: "Olcum", name: "Lazer nivo, aci olcer ve rutubet olcer", purpose: "Egim, geometri ve ahsap kuruluk seviyesini montaj oncesi teyit etmek." },
  { category: "Kontrol", name: "Baglanti ve havalandirma checklisti", purpose: "Ruzgar, buhar ve baglanti detaylarini bir arada denetlemek." },
  { category: "Kayit", name: "Numune dugum ve montaj foyi", purpose: "Ahsap catida usta refleksi yerine tekrar edilebilir detay mantigi kurmak." },
];

const ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Tasiyici", name: "Mertek, asik, makas ve yardimci kusaklar", purpose: "Ahsap catinin ana yuk aktarimini ve geometrisini kurmak.", phase: "Montaj" },
  { group: "Baglanti", name: "Civata, vida, saplama ve ankraj seti", purpose: "Dugumlerin ruzgar ve servis yukleri altinda acilmasini engellemek.", phase: "Birlesim" },
  { group: "Kabuk", name: "OSB, su yalitim altligi ve havalandirma detaylari", purpose: "Kaplama altinda kuru ve nefes alan bir cati kabugu olusturmak.", phase: "Kaplama oncesi" },
  { group: "Guvenlik", name: "Iskele, yasam hatti ve gecici platform", purpose: "Egilimli yuzeyde guvenli montaj ve duzgun kontrol saglamak.", phase: "Tum surec" },
];

export const kabaInsaatStructuralDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/doseme-donati",
    kind: "topic",
    quote: "Doseme donatisi, genis yuzeyli elemanin yalniz moment kapasitesini degil, catlak kontrolunu ve kat duzleminin servis kalitesini de belirler.",
    tip: "Doseme donatisinda en sik hata, genis panel rahatligina aldanip asal yon, dagitma cubugu, ust donati ve rezervasyon disiplinini sahada birbirine karistirmaktir.",
    intro: [
      "Doseme donatisi, betonarme yapinin en genis alanli ama en kolay hafife alinan imalatlarindan biridir. Yuzey buyudukce hata kuculuyor gibi gorunur; gercekte ise kucuk saha kaymalari butun panelin davranisini etkileyebilir. Bu nedenle doseme, kiris kadar dramatik dugumler gostermese de ayni olcude muhendislik dikkati ister.",
      "Sahada en yaygin sorun, panelin duz ve sakin gorunmesi nedeniyle donati duzeninin detay seviyesinde kontrol edilmemesidir. Asal yonle dagitma yonunun karismasi, ust donatinin sehpa yetersizligiyle asagi inmesi, rezervasyonlarin sonradan kesilmesi ve isci trafigiyle aralik bozulmasi uzun vadede catlak ve sehim davranisina yazilir.",
      "Bir insaat muhendisi icin doseme donatisi yalniz cap ve aralik sayimi degildir. Ust- alt katman iliskisi, tesisat kutulari, saft bosluklari, kalinlik toleransi ve beton dokumu sirasinda panelin nasil korunacagi birlikte yonetilmelidir.",
      "Bu nedenle doseme donatisini, genis alanli bir tekrar imalati degil; duzen, kot ve koordinasyon disiplini isteyen bir panel muhendisligi olarak ele almak gerekir.",
    ],
    theory: [
      "Dosemede asal donati yuku ana calisma yonunde tasir; dagitma donatisi ise catlak kontrolunu, ikincil tasimayi ve panel davranisinin dengelenmesini saglar. Bir yonun daha kritik olmasi, diger yonun gelisiguzel uygulanabilecegi anlamina gelmez. Genis panelde duzen kaybi, elemanin gercek davranisini projeden uzaklastirir.",
      "Ust donati konumu, teorik olarak cizimde sabit gorunse de sahada sehpa kalitesi, yurume trafigi ve pompa hortumu hareketiyle bozulmaya cok aciktir. Ust donati asagi dustugunde panelin negatif moment ve catlak kontrol performansi gorunmez bicimde zayiflar. Bu hata beton dokumu sirasinda fark edilmezse ancak servis davranisinda okunur.",
      "Dosemede rezervasyonlar ayri bir yapisal konudur. Elektrik kutusu, saft gecisi, mekanik bosluk veya merdiven agzi nedeniyle cubuklar kesilecekse bu telafi karari mutlaka proje mantigi icinde verilmelidir. Sonradan rastgele kesilen cubuk, genis panelde gizli zayiflik uretir.",
      "TS 500 mantigi geregi doseme yalniz dayanimi degil servis performansini da yonetir. Bu nedenle donati araligi, ek duzeni ve panel kalinligi birlikte okunmadan yapilan saha kabulu eksik kalir.",
    ],
    ruleTable: [
      {
        parameter: "Asal ve dagitma donati duzeni",
        limitOrRequirement: "Donati yonleri, araliklari ve panel mantigi proje duzenine gore korunmali",
        reference: "TS 500",
        note: "Genis panel rahatligi, yon bilgisinin kaybolmasina yol acmamalidir.",
      },
      {
        parameter: "Ust donati kotu",
        limitOrRequirement: "Sehpa ve spacer sistemi ust donatinin tasarim kotunda kalmasini saglamali",
        reference: "TS EN 13670 + saha uygulama disiplini",
        note: "Ust donatinin asagi inmesi gorunmeyen ama etkili kalite kaybidir.",
      },
      {
        parameter: "Rezervasyon ve bosluklar",
        limitOrRequirement: "Tesisat kutusu ve bosluklar donati surekliligini bozmayacak sekilde onceden cozulmeli",
        reference: "TS 500 + proje koordinasyonu",
        note: "Sonradan kesilen cubuklar ancak muhendislik karariyla telafi edilir.",
      },
      {
        parameter: "Panel bazli saha kabul",
        limitOrRequirement: "Genis yuzey tek nokta yerine ag mantigiyla kontrol edilmelidir",
        reference: "Saha kalite plani",
        note: "Bolgesel bakis tum panelin dogru kuruldugu anlamina gelmez.",
      },
    ],
    designOrApplicationSteps: [
      "Doseme panelinde asal ve dagitma yonlerini pafta ve saha isaretleriyle acikca belirle.",
      "Alt donatiyi aralik duzenini bozmadan ser, ardindan sehpalarla ust katman kotunu kur.",
      "Elektrik kutusu, saft ve diger rezervasyonlari cubuk kesmeden once proje ile teyit et.",
      "Paneli tek merkezden degil ag seklinde gezerek sehpa zayifligi, aralik bozulmasi ve yon karismasini kontrol et.",
      "Beton dokumu sirasinda hortum ve yurume trafiginin ust donatiyi itmeyecegi bir gecis duzeni kur.",
      "Beton oncesi son turda paneli bolgesel degil butun olarak okuyup foto ve kontrol formuyla kapat.",
    ],
    criticalChecks: [
      "Asal ve dagitma yonleri sahada karismis mi?",
      "Ust donati sehpa uzerinde yeterince korunuyor mu?",
      "Isci trafigi bazi bolgelerde araligi ve kotu bozmus mu?",
      "Rezervasyonlar nedeniyle kesilen cubuklar projede telafi edilmis mi?",
      "Beton oncesi tum panel icin ag mantikli bir kabul yapildi mi?",
      "Pompa hortumu hareketi panelin zayif bolgelerini bozuyor mu?",
    ],
    numericalExample: {
      title: "5,0 x 8,0 m panelde cubuk adedi ve duzen yorumu",
      inputs: [
        { label: "Panel boyutu", value: "5,0 m x 8,0 m", note: "Tek doseme paneli" },
        { label: "Donati araligi", value: "phi12 / 15 cm", note: "Ana yon icin ornek" },
        { label: "5,0 m yonunde adet", value: "34 cubuk", note: "(5,0 / 0,15) + 1" },
        { label: "8,0 m yonunde adet", value: "54 cubuk", note: "(8,0 / 0,15) + 1" },
      ],
      assumptions: [
        "Hesap ilk saha kontrolu icindir; bindirme ve fire ayri degerlendirilecektir.",
        "Panel icinde buyuk rezervasyon bulunmadigi kabul edilmistir.",
        "Ust ve alt donati duzenleri ayri isaretlenmistir.",
      ],
      steps: [
        {
          title: "Adet kontrolunu yap",
          result: "Yaklasik adet hesabi, sahaya gelen demirin pafta ile kaba uyumunu hizli dogrular.",
          note: "Bu kontrol eksik serim veya yanlis sayim riskini erken yakalar.",
        },
        {
          title: "Duzenin bozulup bozulmadigini sorgula",
          result: "Adet dogru olsa bile sehpa cokmesi veya yon karisikligi varsa panel davranisi bozulabilir.",
          note: "Genis yuzeyde nicelik kadar konum da onemlidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Doseme donatisi icin sayim ilk adimdir; asil kalite panelin her noktasinda ayni kot ve ayni duzenin korunmasidir.",
          note: "Panel duzeni bozuldugunda hata beton altinda gizlenir.",
        },
      ],
      checks: [
        "Adet kontrolu sehpa ve yon kontrolu ile birlikte tamamlanmalidir.",
        "Rezervasyonlar panel duzenini bozuyorsa ayri olarak telafi edilmelidir.",
        "Ust donati beton gunu yeniden gozden gecirilmelidir.",
        "Genis panelde tek bir bolgeye bakarak kabul verilmemelidir.",
      ],
      engineeringComment: "Doseme donatisinda sorun cogu zaman eksik cubuktan degil, genis yuzeyde kaybolan kot ve duzen disiplininden dogar.",
    },
    tools: DONATI_TOOLS,
    equipmentAndMaterials: DONATI_EQUIPMENT,
    mistakes: [
      { wrong: "Donati yonlerini sahada sozlu tarifle birakmak.", correct: "Yonu ve bolgeyi fiziksel isaretleme ile netlestirmek." },
      { wrong: "Ust donatiyi yetersiz sehpa ile yurume trafigine birakmak.", correct: "Panel boyunca standart sehpa duzeni kurmak." },
      { wrong: "Rezervasyon icin cubuklari sahada rastgele kesmek.", correct: "Kesinti ve telafiyi proje ile birlikte cozumlemek." },
      { wrong: "Genis panelde birkac bolgeye bakip tum paneli kabul etmek.", correct: "Ag mantigiyla tum paneli kontrol etmek." },
      { wrong: "Dagitma donatisini ikincil gorup gevsek uygulamak.", correct: "Catlak kontrolundeki rolunu dikkate alarak ayni disiplinle yerlestirmek." },
      { wrong: "Pompa ve yurume yollarini panel zayifliklarini dusunmeden belirlemek.", correct: "Beton gunu lojistigini donati korumasina gore kurmak." },
    ],
    designVsField: [
      "Projede doseme donatisi tekrarlayan cizgiler gibi gorunur; sahada ise bu cizgilerin yonunu, araligini ve kotunu korumak basli basina kalite isidir.",
      "Bu yuzden doseme donatisi, genis alanli sistemlerde duzen koruma disiplininin en net testlerinden biridir.",
      "Iyi panel, yalniz yeterli demir tasidigi icin degil tum yuzeyde ayni mantikla kuruldugu icin degerlidir.",
    ],
    conclusion: [
      "Doseme donatisi dogru yonetildiginde yuzey catlak kontrolu, servis davranisi ve genel kat kalitesi birlikte iyilesir.",
      "Duzen bozuldugunda ise hata beton altinda gorunmez hale gelir ama etkisi sehim, catlak ve rezervasyon kaynakli zayiflik olarak devam eder.",
    ],
    sources: [...KABA_STRUCTURAL_SOURCES, SOURCE_LEDGER.ts500],
    keywords: ["doseme donatisi", "asal donati", "dagitma donatisi", "sehpa", "rezervasyon"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/ahsap-cati",
    kind: "topic",
    quote: "Ahsap cati hafif olabilir; ama bu hafiflik ancak kuruluk, baglanti ve havalandirma disiplinleri birlikte kuruldugunda avantaja donusur.",
    tip: "Ahsap catiyi yalniz mertek dizme isi gibi gormek, malzemenin rutubet davranisini, ruzgar altindaki baglanti ihtiyacini ve kaplama altindaki hava akis zorunlulugunu ihmal etmektir.",
    intro: [
      "Ahsap cati, dusuk katli yapilarda hizli montaj, hafiflik ve islenebilirlik avantaji sayesinde yaygin kullanilir. Ancak sistemin gercek kalitesi yalniz catinin kurulmasinda degil, ahsabin kuruluk seviyesi, baglanti dugumleri, havalandirma boslugu ve kaplama alti davranisinda ortaya cikar.",
      "Sahada en buyuk hata, ahsap elemanlarin metal sistemler kadar duyarsiz sanilmasidir. Oysa rutubeti yuksek malzeme zamanla doner, baglanti noktalarinda acilma yapar veya kaplama altinda ses ve geometri bozuklugu uretir. Bu nedenle ahsap cati, montaj hizinin ardina saklanmamasi gereken bir malzeme disiplinidir.",
      "Bir muhendis icin ahsap cati yalniz tasiyici kurgu degildir. Egim, mertek araligi, mahya surekliligi, ankraj, ruzgar emmesi, buhar hareketi ve havalandirma boslugu ayni sistemin farkli yuzleridir. Bu kararlar ayrildiginda cati ilk bakista duzgun gorunse bile ilk mevsim dongulerinde sorun vermeye baslar.",
      "Dolayisiyla ahsap cati, dogal malzemenin avantajini alirken onun davranisini da ciddiyetle yonetmek zorunda olan bir saha muhendisligi isidir.",
    ],
    theory: [
      "Ahsap anisotropik bir malzemedir; nem ve sicaklik degisimlerine celikten farkli tepki verir. Bu nedenle eleman secimi ve montajdaki rutubet seviyesi, catinin sonraki aylardaki geometri kararliligini belirler. Duz elemanla kurulan cati, nemli malzeme kullanildiginda zamanla sarili veya acilan bir sisteme donusebilir.",
      "Tasiyici davranis yalniz mertek boyuyla ilgili degildir. Mahya, asik, mertek, baglanti levhasi ve ankraj birlikte calisir. Ruzgar emmesi, kar yuku ve bakim trafigi ayni cati dugumlerinde toplanir. Bu nedenle baglanti detaylari usta aliskanligiyla degil hesap ve tekrar edilebilir uygulama mantigiyla kurulmalidir.",
      "Ahsap cati ayni zamanda bir kabuk sistemidir. TS 825 mantigina uygun isi yalitimi, buhar hareketi ve havalandirma boslugu cozulmediginde ahsap eleman kuruluk dengesini kaybeder. Kaplama altinda biriken nem yalniz enerji kaybi degil malzeme omru problemi de uretir.",
      "Bu yuzden ahsap cati projede sicak ve yaln bir cozum gibi gorunse de sahada en teknik basliklardan biridir: geometri, malzeme, baglanti ve yapi fizigi ayni anda okunur.",
    ],
    ruleTable: [
      {
        parameter: "Ahsap malzeme kurulugu ve dogrulugu",
        limitOrRequirement: "Montaja girecek elemanlar duzgun, uygun kurulukta ve gozle kusurlari kontrol edilmis olmali",
        reference: "TS EN 1995-1-1 + saha kabul disiplini",
        note: "Rutubetli ve egri ahsap sistem davranisini baslangictan bozar.",
      },
      {
        parameter: "Baglanti ve ankraj",
        limitOrRequirement: "Dugumler ruzgar ve dusay yuk etkileri dusunulerek tekrar edilebilir detayla kurulmalidir",
        reference: "TS EN 1995-1-1",
        note: "Ahsap catida baglanti, eleman kadar tasiyicidir.",
      },
      {
        parameter: "Havalandirma ve kabuk davranisi",
        limitOrRequirement: "Kaplama altinda hava akisi ve nem tahliyesi saglanmali, isi yalitimi kabukla uyumlu cozulmeli",
        reference: "TS 825",
        note: "Nefes almayan cati, zamanla ahsapta servis omru sorunu uretir.",
      },
      {
        parameter: "Geometri ve egim",
        limitOrRequirement: "Mahya, sacak ve mertek hattinda surekli egim korunmali",
        reference: "Planli Alanlar Imar Yonetmeligi + saha olcum disiplini",
        note: "Kucuk geometri sapmalari kaplama altinda buyuk dalga yaratir.",
      },
    ],
    designOrApplicationSteps: [
      "Mertek, asik ve mahya kurgusunu aciklik, egim ve kaplama sistemi ile birlikte netlestir.",
      "Montaja girecek ahsap elemanlari kuruluk, dogruluk ve kusur acisindan ayikla.",
      "Ankraj, civata ve baglanti levhalarini numune dugum uzerinden once test edip sonra seri uygula.",
      "Mahya, sacak ve kaplama alti havalandirma bosluklarini proje detayinda tarif ettigin gibi sahada da koru.",
      "Lazer nivo ve aci kontrolu ile tum cati boyunca egim ve dogrultu surekliligini olc.",
      "Kaplama oncesi cati iskeletini butun olarak gezip ruzgar, nem ve bakim senaryosu acisindan son tur yap.",
    ],
    criticalChecks: [
      "Montaja giren ahsap elemanlarin rutubet ve dogruluk kontrolu yapildi mi?",
      "Mahya ve sacak hattinda tum cati boyunca ayni geometri korunuyor mu?",
      "Ankraj ve baglanti levhalari her dugumde ayni mantikla uygulanmis mi?",
      "Kaplama altinda hava akisi ve buhar tahliyesi icin surekli bosluk var mi?",
      "Mertek araliklari kaplama sisteminin ihtiyaciyla uyumlu mu?",
      "Catiya sonradan gelecek cihaz ve baca gecisleri detayda dusunuldu mu?",
    ],
    numericalExample: {
      title: "8 m aciklikta %33 egimli ahsap cati icin mahya yuksekligi yorumu",
      inputs: [
        { label: "Toplam aciklik", value: "8,0 m", note: "Iki yana egimli cati" },
        { label: "Yarim aciklik", value: "4,0 m", note: "Sacaktan mahyaya yatay mesafe" },
        { label: "Hedef egim", value: "%33", note: "Ornek uygulama degeri" },
        { label: "Hedef", value: "Mahya kotunu sahada somutlamak", note: "Montaj geometri kontrolu icin" },
      ],
      assumptions: [
        "Egim yatay izdusum uzerinden okunmaktadir.",
        "Mahya hatti tum boy boyunca ayni kotta kurulacaktir.",
        "Kaplama sistemi bu egim bandi ile uyumludur.",
      ],
      steps: [
        {
          title: "Kot farkini hesapla",
          formula: "4,0 x 0,33 = 1,32 m",
          result: "Sacak ile mahya arasinda yaklasik 1,32 m kot farki gerekir.",
          note: "Bu deger cati geometrisini sahada sayisal olarak netlestirir.",
        },
        {
          title: "Montaj etkisini yorumla",
          result: "Mahya hatti boyunca bu kot farki korunmazsa kaplama alti duzlem bozulur ve su tahliyesi zayiflar.",
          note: "Ahsap catida kucuk geometri sapmasi kaplama altinda buyuk dalga olarak okunur.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Geometri yalniz estetik konu degildir; baglanti davranisi, su yonu ve havalandirma boslugu da bu kot kararina baglidir.",
          note: "Egim cizimde yazili oldugu icin degil sahada surekli olculdugu icin gerceklesir.",
        },
      ],
      checks: [
        "Mahya kotu tek noktadan degil tum hat boyunca kontrol edilmelidir.",
        "Kaplama duzlemi ve havalandirma boslugu ayni geometri mantigiyla ilerlemelidir.",
        "Ankraj ve baglanti detaylari geometri kadar kritik kabul edilmelidir.",
        "Egim karari olcuyle teyit edilmeden kaplama asamasina gecilmemelidir.",
      ],
      engineeringComment: "Ahsap catida geometri, estetikten once su, ruzgar ve malzeme omru davranisini belirleyen teknik bir karardir.",
    },
    tools: ROOF_TOOLS,
    equipmentAndMaterials: ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Rutubetli veya egri ahsabi montaja almak.", correct: "Elemanlari kuruluk ve dogruluk acisindan secerek kullanmak." },
      { wrong: "Baglanti detaylarini usta refleksine birakmak.", correct: "Her dugumu tekrar edilebilir teknik detayla kurmak." },
      { wrong: "Kaplama altinda havalandirma boslugunu ihmal etmek.", correct: "Yapi fizigi ve malzeme omru icin surekli hava akisi saglamak." },
      { wrong: "Mahya ve sacak dogrultusunu birkac noktadan dogru gormekle yetinmek.", correct: "Tum hat boyunca surekliligi olcmek." },
      { wrong: "Ruzgar ankrajini hafif sistem diye onemsiz saymak.", correct: "Ahsap catida baglanti ve ankraji ana tasiyici karar saymak." },
      { wrong: "Cihaz ve baca gecislerini sonradan saha cozumune birakmak.", correct: "Cati iskeleti kurulmadan once detaylara dahil etmek." },
    ],
    designVsField: [
      "Projede ahsap cati sicak ve yaln bir sistem gibi gorunebilir; sahada ise rutubet, havalandirma ve baglanti detaylari bu sadeligin gercek bedelini belirler.",
      "Iyi ahsap cati, sadece hizli kurulan degil mevsim donuslerinde de geometri ve kuruluk dengesini koruyan catidir.",
      "Bu nedenle ahsap cati, dogal malzemenin cazibesini ancak disiplinli muhendislikle uzun omurlu cozum haline getirir.",
    ],
    conclusion: [
      "Ahsap cati dogru malzeme, dogru baglanti ve dogru havalandirma ile kuruldugunda hafif, hizli ve uzun omurlu bir sistem sunar.",
      "Bu disiplinler ihmal edildiginde ise ilk mevsim gecislerinde geometri bozuklugu, nem sorunu ve kaplama problemleriyle avantajini hizla kaybeder.",
    ],
    sources: [...KABA_STRUCTURAL_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar, TS_EN_1995_SOURCE],
    keywords: ["ahsap cati", "mertek", "mahya", "havalandirma boslugu", "TS EN 1995"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti", "ince-isler/cati-kaplamasi/kiremit"],
  },
];
