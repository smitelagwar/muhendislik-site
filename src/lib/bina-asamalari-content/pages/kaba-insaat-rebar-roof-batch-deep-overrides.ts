import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_1993_1_1_SOURCE: BinaGuideSource = {
  title: "TS EN 1993-1-1 Eurocode 3 - Celik Yapilarin Tasarimi",
  shortCode: "TS EN 1993-1-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Celik tasiyici eleman davranisi ve genel tasarim mantigi icin temel referanslardan biridir.",
};

const TS_EN_1090_SOURCE: BinaGuideSource = {
  title: "TS EN 1090 Celik ve Aluminyum Tasiyici Yapilarin Uygulanmasi",
  shortCode: "TS EN 1090",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Atolye imalati, tolerans, montaj ve kalite kontrol zinciri icin uygulama ekseni sunar.",
};

const REBAR_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Shop drawing, bukum listesi ve deprem dugum checklisti", purpose: "Demir miktarini degil yerlesim mantigini sahaya temiz indirmek." },
  { category: "Saha", name: "Pas payi, bindirme ve spacer kontrol formu", purpose: "Donatinin dogru konumda kalmasini standartlastirmak." },
  { category: "Kontrol", name: "Foto arsiv ve dugum kabul foyi", purpose: "Kalip kapanmadan once kritik bolgeleri belgeli hale getirmek." },
  { category: "Koordinasyon", name: "Rezervasyon ve gomulu eleman matrisi", purpose: "Sonradan demir kesme ihtiyacini azaltmak." },
];

const STEEL_ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Montaj", name: "Aks, kot ve civata sIkma plani", purpose: "Atolyeden gelen elemanlari sahada ayni tasiyici mantikla toplamak." },
  { category: "Olcum", name: "Total station, lazer nivo ve diyagonal kontrol listesi", purpose: "Celik cati geometrisini sayisal olarak dogrulamak." },
  { category: "Kontrol", name: "Bulon, capraz ve boya tamir checklisti", purpose: "Montaj kalitesini yalniz gorunusle degil performansla kabul etmek." },
  { category: "Kayit", name: "Montaj sirasi ve gecici stabilite foyi", purpose: "Hizli kurulumun emniyet riskine donusmesini onlemek." },
];

const REBAR_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Kesme-bukme tezgahi, etiketli demet sistemi ve pafta seti", purpose: "Sahaya gelen demirin okunur ve sira duzenli olmasini saglamak.", phase: "Atolye ve stok" },
  { group: "Montaj", name: "Bag teli, pense, spacer, takoz ve sehpa", purpose: "Donatinin dogru pas payi ve kotta kalmasini saglamak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Olcu ekipmani ve foto arsivi", purpose: "Kalip kapanmadan once kritik dugumleri belgelemek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Rezervasyon kaliplari ve gomulu parca seti", purpose: "Diger disiplinleri donatiyi bozmadan sisteme dahil etmek.", phase: "Montaj oncesi" },
];

const STEEL_ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ana tasiyici", name: "Makas, asik, caprazlar ve baglanti levhalari", purpose: "Celik catinin aciklik ve ruzgar davranisini olusturmak.", phase: "Montaj" },
  { group: "Baglanti", name: "Bulon, somun, rondela ve ankrajlar", purpose: "Dugum davranisini sahada gercege donusturmek.", phase: "Birlesim" },
  { group: "Olcum", name: "Total station, lazer nivo ve montaj platformu", purpose: "Aks, kot ve diyagonal dogrulugunu olcmek.", phase: "Kurulum" },
  { group: "Koruma", name: "Korozyon boya tamir seti ve gecici emniyet elemanlari", purpose: "Montaj sonrasi servis omru ve saha guvenligini korumak.", phase: "Kapanis" },
];

export const kabaInsaatRebarRoofBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri",
    kind: "topic",
    quote: "Donati isleri, demirin miktarindan once dogru yerde, dogru sira ile ve betona yer birakarak durmasiyla guvence uretir.",
    tip: "Demir tamam gorunuyor diye kalite onayi vermek, bindirme, pas payi, dugum yogunlugu ve deprem detayini gormezden gelmektir.",
    intro: [
      "Donati isleri betonarme davranisin sahadaki en kritik karsiligidir. Kolonun, kirisin, perdenin veya dosemenin deprem ve dusay yukler altindaki performansi; yalniz hesap raporunda degil, demirin sahadaki gercek yerlesiminde belirlenir. Bu nedenle donati imalati, metraj veya cap sayisindan daha fazlasidir.",
      "Santiyede en sik hata, 'demir tamam' cumlesiyle kaliteyi bitmis sanmaktir. Oysa demirin var olmasi tek basina yeterli degildir. Bindirme yanlis bolgede toplanmissa, etriyeler dogru ritimde gitmiyorsa veya pas payi kaymissa metraj dursa bile tasiyici davranis zarar gorur.",
      "Bir insaat muhendisi icin donati isleri; shop drawing, saha montaj sirasi, spacer sistemi, beton akisi ve deprem dugum mantigini ayni anda okumayi gerektirir. Yogun dugumler ve kritik uclar bu nedenle ayri kalite kalemleri gibi yonetilmelidir.",
      "Bu yazida donati islerini teknik temel, yonetmelik ekseni, sayisal dugum yorumu, araclar ve saha hatalariyla birlikte derinlestiriyoruz.",
    ],
    theory: [
      "Betonarme davranista donati, beton ile birlikte calisir. Bu nedenle celigin yalniz kesit alani degil; konumu, ankraji, bindirme duzeni, etriye siklastirmasi ve pas payi bir butun olarak ele alinmalidir. Hesapta bulunan bir alanin sahada ayni davranisi uretmesi ancak bu geometrik ve detaysal kosullar saglandiginda mumkundur.",
      "Saha tarafinda ana sorunlardan biri yogun dugum bolgeleridir. Kolon-kiris birlesimi, perde ucu veya mesnet bolgesinde biriken demir yalniz isciligi zorlastirmaz; betonun akisini ve vibratorun etkinligini de sinirlar. Iyi donati duzeni, demirin sigmasi kadar betonun da bu kesitte ilerleyebilmesine izin vermelidir.",
      "Pas payi ve spacer sistemi cogu zaman ikincil gorulur; aslinda tam tersi dogrudur. Pas payi yalniz korozyondan korumaz; aderans davranisi, yangin dayanimi ve elemanin uzun omurlulugu uzerinde de etkilidir. Spacer yetersizliginde demir kaliba veya zemine yaslanir ve projedeki davranis bozulur.",
      "Deprem tasarimi acisindan kritik bolgelerde etriye kancasi, siklastirma adimi, bindirme bolgesi ve ankraj boylari kucuk detay gibi okunamaz. Tasarim ofisinin deprem guvenligi burada bag teli ve sehpa uzerinde gercege donusur.",
    ],
    ruleTable: [
      {
        parameter: "Boyuna ve enine donati duzeni",
        limitOrRequirement: "Kesit ve dugum detaylari proje, TS 500 ve deprem gerekleriyle uyumlu uygulanmalidir",
        reference: "TS 500 + TBDY 2018",
        note: "Miktar kadar detay duzeni de yapisal davranisi belirler.",
      },
      {
        parameter: "Pas payi ve koruma",
        limitOrRequirement: "Eleman ve cevre kosuluna uygun ortu betonu spacer sistemiyle korunmalidir",
        reference: "TS 500",
        note: "Pas payi goz karariyla degil standart takozla saglanmalidir.",
      },
      {
        parameter: "Bindirme ve ankraj",
        limitOrRequirement: "Bindirmeler ayni kesitte yigilmadan dagitilmali ve ankraj boylari korunmalidir",
        reference: "TS 500",
        note: "Yigilan bindirme sahada sikisiklik ve beton kalite kaybi uretir.",
      },
      {
        parameter: "Deprem kritik bolgeleri",
        limitOrRequirement: "Uclarda etriye siklastirmasi ve dugum detaylari ayri kontrol edilmelidir",
        reference: "TBDY 2018",
        note: "Bu bolgeler normal montaj ritmine karistirilmamalidir.",
      },
      {
        parameter: "Kalip kapanmadan on kabul",
        limitOrRequirement: "Kritik dugumler olcu, foto ve kontrol listesi ile belgelenmelidir",
        reference: "Saha kalite plani",
        note: "Kapanan imalat sonradan yalniz kayit ile teyit edilir.",
      },
    ],
    designOrApplicationSteps: [
      "Shop drawing ve bukum listesini saha montaj sirasina gore hazirla.",
      "Pas payi, bindirme ve kritik dugumler icin standart spacer ve kontrol adimlarini basindan tanimla.",
      "Kolon, kiris, perde ve doseme dugumlerinde beton akis yolunu da dusunerek yerlesimi yonet.",
      "Rezervasyon ve gomulu elemanlarin donatiyi sahada zorla kesmeyecegi sekilde koordinasyon kur.",
      "Kalip kapanmadan once deprem kritik bolgeleri ayri bir on kabul turu ile kontrol et.",
      "Foto ve olcu arsivini eleman bazli tutarak belgesiz imalat birakma.",
    ],
    criticalChecks: [
      "Bindirmeler ayni kesitte yigilarak beton akis yolunu daraltiyor mu?",
      "Pas payi spacer sistemi tum kritik yuzeylerde yeterli mi?",
      "Deprem kritik bolgelerinde etriye adimi ve kanca yonu net mi?",
      "Rezervasyonlar sahada dogaclama demir kesimine yol aciyor mu?",
      "Yogun dugumlerde vibratorun ve betonun ilerleyecegi bosluk kaldi mi?",
      "Kalip kapanmadan once kritik dugumler foto ve olcuyle belgelendi mi?",
    ],
    numericalExample: {
      title: "Yogun kolon dugumunde pas payi ve akis yolu yorumu",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Orta buyuklukte tasiyici eleman" },
        { label: "Boyuna donati", value: "8 phi 20", note: "Yogun donatili kolon ornegi" },
        { label: "Hedef pas payi", value: "40 mm", note: "Koruma ve aderans icin ornek deger" },
        { label: "Amac", value: "Yalniz demir sigmasi degil beton akis mantigini yorumlamak", note: "Ogretici saha kontrolu" },
      ],
      assumptions: [
        "Etriye ve bindirme bolgeleri ayni kesitte tam yigilmadan dagitilmistir.",
        "Spacer sistemi standart ve yeterli adette kullanilmistir.",
        "Hesap kavramsal saha kontrolune yoneliktir.",
      ],
      steps: [
        {
          title: "Kesit sigmasini ilk bakista kontrol et",
          result: "8 adet phi20 donati teorik olarak sigabilir, fakat bu tek basina yeterli kabul kriteri degildir.",
          note: "Etriye, bindirme ve vibrator boslugu birlikte okunmalidir.",
        },
        {
          title: "Pas payi ile akis yolunu birlikte yorumla",
          result: "40 mm pas payi korunurken betonun donatilar arasindan ilerleyebilecegi aciklik da kalmalidir.",
          note: "Kesit yalniz demirin varligiyla degil, betonun ilerleme imkaniyla kabul edilir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Yogun dugumde kalite, daha cok demir baglamak degil; detay duzenini beton yerlesimine izin verecek sekilde korumaktir.",
          note: "En buyuk hata genelde eksik metraj degil, yanlis yerlesimdir.",
        },
      ],
      checks: [
        "Kritik kesitlerde beton akisi ayrica dusunulmelidir.",
        "Pas payi ve bindirme kontrolleri yalniz gozle degil olcuyle dogrulanmalidir.",
        "Deprem kritik bolgeleri genel montaj listesinin icinde kaybolmamalidir.",
        "Foto arsiv dokum sonrasi sorulari cevaplayacak netlikte tutulmalidir.",
      ],
      engineeringComment: "Donati islerinde en tehlikeli yanlis, metraj tamam diye dugum davranisinin da tamam oldugunu varsaymaktir.",
    },
    tools: REBAR_TOOLS,
    equipmentAndMaterials: REBAR_EQUIPMENT,
    mistakes: [
      { wrong: "Demir miktarini kalite yerine koymak.", correct: "Yerlesim, pas payi ve dugum davranisini ana kabul kriteri yapmak." },
      { wrong: "Bindirmeleri kolay montaj icin ayni kesitte toplamak.", correct: "Yigilmeyi azaltacak sekilde dagitmak." },
      { wrong: "Spacer ve takozlari ikincil gormek.", correct: "Pas payinin sahadaki ana guvencesi olarak standartlastirmak." },
      { wrong: "Rezervasyon icin sahada rastgele cubuk kesmek.", correct: "Gomulu eleman ve bosluklari onceden koordine etmek." },
      { wrong: "Deprem kritik bolgelerini normal imalat ritmine karistirmak.", correct: "Bu bolgeleri ayri kalite kapisi gibi yonetmek." },
      { wrong: "Kalip kapanmadan once kritik dugumleri kayitsiz gecmek.", correct: "Foto ve olcu arsiviyle belgeli on kabul yapmak." },
    ],
    designVsField: [
      "Projede donati alanlari ve detay cagrilari gorulur; sahada ise ayni bilgi bag teli, spacer ve beton akis bosluguyla gercege donusur.",
      "Iyi donati duzeni yalniz tasiyici davranisi korumaz, beton ekibinin de kontrollu calismasina izin verir.",
      "Bu nedenle donati isleri, hesap dogrulugunun saha okunabilirligine cevrildigi en kritik noktadir.",
    ],
    conclusion: [
      "Donati isleri dogru yonetildiginde betonarme davranisin sahadaki omurgasi saglam kurulur. Bu omurga zayif kuruldugunda hata beton altinda gizlenir ama etkisi yapi boyunca devam eder.",
      "Bir insaat muhendisi icin en saglam yaklasim, donatinin varligini degil davranisini ve yerlesim kalitesini onaylamaktir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["donati isleri", "pas payi", "bindirme", "TBDY 2018", "betonarme dugum"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri/kolon-donati", "kaba-insaat/donati-isleri/kiris-donati", "kaba-insaat/donati-isleri/doseme-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/celik-cati",
    kind: "topic",
    quote: "Celik cati, acikligi hizla gecen hafif bir sistem gibi gorunur; gercek performansi aks, baglanti ve montaj toleransinin ayni anda korunmasiyla ortaya cikar.",
    tip: "Atolyeden gelen elemanlara guvenip sahadaki aks, civata ve gecici stabilite kontrolunu gevsetmek, hizli montaji riskli montaja donusturur.",
    intro: [
      "Celik cati sistemleri genis acikliklari hafiflikle ve hizla kapatabildigi icin sanayi yapilarinda ve buyuk hacimli ust ortulerde sik kullanilir. Makaslar, asiklar, caprazlar ve dugumler birlikte calisarak yukleri kolonlara aktarir. Bu nedenle celik cati, tek tek elemanlardan daha cok bir butun olarak davranan tasiyici organizasyondur.",
      "Sahadaki en buyuk yanlis, atolyeden duzgun gelen elemanlarin otomatik olarak dogru cati anlamina geldigini varsaymaktir. Oysa aks kaymasi, kolon basligi kot farki, gevsek bulon veya eksik capraz en cok bu sistemlerde hizla sorun uretir. Montaj ne kadar hizli ise kalite kontrolun o kadar disiplinli olmasi gerekir.",
      "Bir insaat muhendisi icin celik cati; aks aplikasyonu, gecici montaj guvenligi, bulon sIkma disiplini, diyagonal olcumu, korozyon korumasi ve kaplama ekibine birakilacak temiz geometriyi birlikte okumak demektir.",
      "Bu yazida celik catiyi teorik tasiyici mantik, standart ekseni, sayisal geometri yorumu ve saha hatalariyla birlikte derinlestiriyoruz.",
    ],
    theory: [
      "Celik cati davranisi, ana tasiyicilar ve ikincil elemanlarin birlikte calismasina dayanir. Makas ya da cerceve acikligi gecer, asiklar kaplama yuklerini dagitir, capraz sistem ise yatay stabiliteyi saglar. Bu nedenle tek bir elemanin dogru kesitte olmasi yetmez; tum sistemin aks, kot ve dugum surekliligi korunmalidir.",
      "Montaj toleransi bu sistemlerde kritik onemdedir. Bir makasin kucuk eksen kaymasi, uzun hat boyunca buyuyerek asik cizgisini bozar ve kaplama altinda dalgalanma yaratir. Daha onemlisi, baglanti levhalarinda zorlanma ve ikincil gerilme olusabilir. Geometrik temizlik yalniz estetik degil, yapisal davranis kriteridir.",
      "Bulonlu birlesimler ve caprazlar cati davranisinin omurgasidir. Civatayi takmak ile dogru torkta ve dogru sirayla sikmak ayni sey degildir. Caprazin cizimde bulunmasi ile montajda gercekten devrede olmasi da ayni sey degildir. Bu nedenle baglanti kontrolu var/yok sayimi ile bitmez.",
      "Gecici stabilite de ayrica dusunulmelidir. Cati tam kapanmadan once sistemin tum yatay rijitligi olusmaz. Bu ara asamada ruzgar, montaj yukleri ve vinc etkileri belirgin risk yaratir. Hiz baskisi altinda gecici destek unutuldugunda sistem kalici halinden once emniyetsiz hale gelebilir.",
    ],
    ruleTable: [
      {
        parameter: "Tasiyici sistem mantigi",
        limitOrRequirement: "Ana ve ikincil elemanlar tasarim mantigina uygun kesit, aks ve dugum surekliliginde kurulmalidir",
        reference: "TS EN 1993-1-1",
        note: "Tek tek dogru elemanlar, yanlis kurulan sistemde beklenen davranisi vermez.",
      },
      {
        parameter: "Imalat ve montaj kalitesi",
        limitOrRequirement: "Atolye ve saha toleranslari baglanti ve kurulum zinciriyle birlikte kontrol edilmelidir",
        reference: "TS EN 1090",
        note: "Atolye dogrulugu sahadaki montaj hatasini telafi etmez.",
      },
      {
        parameter: "Bulon ve dugum kontrolu",
        limitOrRequirement: "Bulonlu birlesimler dogru yerlestirme ve sIkma disipliniyle kabul edilmelidir",
        reference: "Montaj kalite plani",
        note: "Takili bulon, dogru calisan dugum anlamina gelmez.",
      },
      {
        parameter: "Gecici stabilite",
        limitOrRequirement: "Montaj asamalarinda capraz ve gecici destek sirasi onceden planlanmalidir",
        reference: "Saha montaj senaryosu",
        note: "Kalici sistem tamamlanmadan once gecici emniyet kritik hale gelir.",
      },
      {
        parameter: "Korozyon ve kapanis",
        limitOrRequirement: "Montaj sonrasi cizik ve kesimlerde koruyucu sistem tamir edilmelidir",
        reference: "Teslim kalite plani",
        note: "Kucuk boya hasari uzun vadeli servis sorunu olabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Kolon basligi, ankraj ve aks aplikasyonunu montaj baslamadan sayisal olarak dondur.",
      "Makas ve ana elemanlari gecici stabilite sirasina gore kur; caprazlari sona birakma.",
      "Asik ve ikincil elemanlarda hat dogrulugu ile diyagonalleri tum boy boyunca olc.",
      "Bulonlu birlesimleri tork, rondela ve temas kalitesiyle birlikte kontrol et.",
      "Kaplama ekibine gecmeden once geometri, boya tamiri ve baglanti butunlugunu ikinci kez tara.",
      "Teslim dosyasina montaj kaydi, olcu sonucu ve tamir noktalarini isle.",
    ],
    criticalChecks: [
      "Kolon basligi kotlari ve akslari cati montajina uygun netlikte mi?",
      "Makas, asik ve caprazlar boyunca diyagonal ve hat surekliligi korundu mu?",
      "Bulonlar dogru sIkma disipliniyle kabul edildi mi?",
      "Montaj sirasinda gecici stabilite yeterli ve belgeli mi?",
      "Kaplama oncesi boya tamirleri tamamlandi mi?",
      "Cati iskeleti sonraki kaplama paketi icin temiz geometri birakti mi?",
    ],
    numericalExample: {
      title: "24 m x 12 m catida diyagonal kontrol mantigi",
      inputs: [
        { label: "Plan boyutu", value: "24 m x 12 m", note: "Dikdortgen cati alani" },
        { label: "Teorik diyagonal", value: "26,83 m", note: "sqrt(24^2 + 12^2) ile bulunan hedef" },
        { label: "Olculen diyagonal farki", value: "35 mm", note: "Iki kose olcumu arasindaki saha farki" },
        { label: "Hedef", value: "Kaplama oncesi geometri sapmasini yorumlamak", note: "Ogretici saha degerlendirmesi" },
      ],
      assumptions: [
        "Olcum guvenilir cihazla alinmistir.",
        "Catida gecici caprazlar takili ve sistem kabaca tamamlanmistir.",
        "Deger nihai tolerans karari yerine saha mantigi anlatimi icindir.",
      ],
      steps: [
        {
          title: "Teorik diyagonali belirle",
          formula: "sqrt(24^2 + 12^2) = 26,83 m",
          result: "Planin teorik diyagonal olcusu yaklasik 26,83 m'dir.",
          note: "Bu cati geometri kontrolunun temel referansidir.",
        },
        {
          title: "Saha farkini yorumla",
          result: "35 mm'lik fark, uzun hatta capraz veya aks ayari gerektirebilecek bir geometri sapmasi oldugunu gosterir.",
          note: "Kucuk farklar uzun panel hatlarinda buyuyebilir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Celik catida geometri kontrolu kaplama sonrasi degil, kaplama oncesi ve caprazlar aktifken tamamlanmalidir.",
          note: "Makaslar kapandi diye sistem otomatik dogru kurulmus sayilmaz.",
        },
      ],
      checks: [
        "Diyagonal ve hat olcumleri tek noktada degil kritik akslarda tekrarlanmalidir.",
        "Bulon sIkma ve capraz aktivasyonu geometri kontrolunden ayrik dusunulmemelidir.",
        "Kaplama ekibi sahaya girmeden once ana geometri kapanmis olmalidir.",
        "Boya tamirleri geometri kadar teslim kriteridir.",
      ],
      engineeringComment: "Celik catida milimetre gibi gorunen sapmalar, uzun aciklikta panel ve dugum davranisi olarak buyuyebilir.",
    },
    tools: STEEL_ROOF_TOOLS,
    equipmentAndMaterials: STEEL_ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Atolyeden gelen elemanin otomatik olarak dogru montaj anlamina geldigini varsaymak.", correct: "Aks, kot ve diyagonal kontrolunu sahada yeniden yapmak." },
      { wrong: "Caprazlari montaj sonunda eklenir detay gibi gormek.", correct: "Gecici ve kalici stabilite icin caprazlari erken devreye almak." },
      { wrong: "Bulonlari takmakla yetinmek.", correct: "SIkma, temas ve baglanti kalitesini kayitli sekilde kontrol etmek." },
      { wrong: "Kaplama ekibini geometri kapanmadan sahaya sokmak.", correct: "Celik iskeleti olcuyle once kapatmak." },
      { wrong: "Montaj sonrasi boya hasarlarini onemsiz gormek.", correct: "Kesim ve cizik noktalarini teslimden once onarmak." },
      { wrong: "Hiz kazanmak icin gecici stabilite detaylarini gevsetmek.", correct: "Montaj senaryosunu emniyet ve rijitlik sirasina gore kurmak." },
    ],
    designVsField: [
      "Projede celik cati kesit ve dugumlerle anlatilir; sahada ise ayni bilgi aks aplikasyonu, bulon sIkma ve capraz surekliligi ile gercege donusur.",
      "Iyi celik cati hizli kurulur ama daha da onemlisi dogru geometri ve temiz dugum mantigiyla kapanir.",
      "Bu nedenle celik cati kalitesi, atolyedeki imalat kadar sahadaki montaj disiplininin de sonucudur.",
    ],
    conclusion: [
      "Celik cati dogru aks, dogru baglanti ve dogru montaj sirasi ile kuruldugunda hafif, hizli ve guvenilir bir ust ortu sistemi sunar. Bu zincirdeki bir zayiflik geometri ve servis omru sorunlarini ayni anda ortaya cikarir.",
      "Bir insaat muhendisi icin en saglam bakis, celik catiyi atolyeden gelen parcalarin birlesimi degil; sahada olcu, baglanti ve stabilite ile dogrulanan bir sistem olarak gormektir.",
    ],
    sources: [...KABA_BATCH_SOURCES, TS_EN_1993_1_1_SOURCE, TS_EN_1090_SOURCE],
    keywords: ["celik cati", "TS EN 1993-1-1", "TS EN 1090", "bulonlu birlesim", "cati montaji"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti", "ince-isler/cati-kaplamasi/metal-cati"],
  },
];
