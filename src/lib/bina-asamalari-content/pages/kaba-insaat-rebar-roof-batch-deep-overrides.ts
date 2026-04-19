import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KABA_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const TS_EN_1993_1_1_SOURCE: BinaGuideSource = {
  title: "TS EN 1993-1-1 Eurocode 3 - Çelik Yapilarin Tasarımı",
  shortCode: "TS EN 1993-1-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Çelik taşıyıcı eleman davranisi ve genel tasarim mantigi için temel referanslardan biridir.",
};

const TS_EN_1090_SOURCE: BinaGuideSource = {
  title: "TS EN 1090 Çelik ve Aluminyum Taşıyıcı Yapilarin Uygulanmasi",
  shortCode: "TS EN 1090",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Atolye imalati, tolerans, montaj ve kalite kontrol zinciri için uygulama ekseni sunar.",
};

const REBAR_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Shop drawing, bukum listesi ve deprem dugum checklisti", purpose: "Demir miktarini degil yerlesim mantigini sahaya temiz indirmek." },
  { category: "Saha", name: "Pas payi, bindirme ve spacer kontrol formu", purpose: "Donatinin doğru konumda kalmasini standartlastirmak." },
  { category: "Kontrol", name: "Foto arsiv ve dugum kabul foyi", purpose: "Kalip kapanmadan once kritik bolgeleri belgeli hale getirmek." },
  { category: "Koordinasyon", name: "Rezervasyon ve gomulu eleman matrisi", purpose: "Sonradan demir kesme ihtiyacini azaltmak." },
];

const STEEL_ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Montaj", name: "Aks, kot ve civata sIkma plani", purpose: "Atolyeden gelen elemanlari sahada aynı taşıyıcı mantikla toplamak." },
  { category: "Ölçüm", name: "Total station, lazer nivo ve diyagonal kontrol listesi", purpose: "Çelik çatı geometrisini sayisal olarak dogrulamak." },
  { category: "Kontrol", name: "Bulon, capraz ve boya tamir checklisti", purpose: "Montaj kalitesini yalnız gorunusle degil performansla kabul etmek." },
  { category: "Kayıt", name: "Montaj sirasi ve gecici stabilite foyi", purpose: "Hızlı kurulumun emniyet riskine donusmesini onlemek." },
];

const REBAR_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Kesme-bukme tezgahi, etiketli demet sistemi ve pafta seti", purpose: "Sahaya gelen demirin okunur ve sira duzenli olmasini saglamak.", phase: "Atolye ve stok" },
  { group: "Montaj", name: "Bag teli, pense, spacer, takoz ve sehpa", purpose: "Donatinin doğru pas payi ve kotta kalmasini saglamak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Ölçü ekipmani ve foto arşivi", purpose: "Kalip kapanmadan once kritik dugumleri belgelemek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Rezervasyon kaliplari ve gomulu parca seti", purpose: "Diger disiplinleri donatiyi bozmadan sisteme dahil etmek.", phase: "Montaj öncesi" },
];

const STEEL_ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Ana taşıyıcı", name: "Makas, asik, caprazlar ve bağlantı levhalari", purpose: "Çelik catinin aciklik ve rüzgar davranisini olusturmak.", phase: "Montaj" },
  { group: "Bağlantı", name: "Bulon, somun, rondela ve ankrajlar", purpose: "Dugum davranisini sahada gercege donusturmek.", phase: "Birlesim" },
  { group: "Ölçüm", name: "Total station, lazer nivo ve montaj platformu", purpose: "Aks, kot ve diyagonal dogrulugunu olcmek.", phase: "Kurulum" },
  { group: "Koruma", name: "Korozyon boya tamir seti ve gecici emniyet elemanlari", purpose: "Montaj sonrasi servis omru ve saha guvenligini korumak.", phase: "Kapanis" },
];

export const kabaInsaatRebarRoofBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri",
    kind: "topic",
    quote: "Donati isleri, demirin miktarindan once doğru yerde, doğru sira ile ve betona yer birakarak durmasiyla guvence uretir.",
    tip: "Demir tamam gorunuyor diye kalite onayi vermek, bindirme, pas payi, dugum yogunlugu ve deprem detayini gormezden gelmektir.",
    intro: [
      "Donati isleri betonarme davranisin sahadaki en kritik karsiligidir. Kolonun, kirisin, perdenin veya dosemenin deprem ve dusay yukler altindaki performansi; yalnız hesap raporunda degil, demirin sahadaki gercek yerlesiminde belirlenir. Bu nedenle donati imalati, metraj veya cap sayisindan daha fazlasidir.",
      "Santiyede en sık hata, 'demir tamam' cumlesiyle kaliteyi bitmis sanmaktir. Oysa demirin var olmasi tek basina yeterli degildir. Bindirme yanlış bolgede toplanmissa, etriyeler doğru ritimde gitmiyorsa veya pas payi kaymissa metraj dursa bile taşıyıcı davranis zarar gorur.",
      "Bir insaat muhendisi için donati isleri; shop drawing, saha montaj sirasi, spacer sistemi, beton akisi ve deprem dugum mantigini aynı anda okumayi gerektirir. Yoğun dugumler ve kritik uclar bu nedenle ayri kalite kalemleri gibi yonetilmelidir.",
      "Bu yazida donati islerini teknik temel, yonetmelik ekseni, sayisal dugum yorumu, araçlar ve saha hatalariyla birlikte derinlestiriyoruz.",
    ],
    theory: [
      "Betonarme davranista donati, beton ile birlikte calisir. Bu nedenle celigin yalnız kesit alani degil; konumu, ankraji, bindirme duzeni, etriye siklastirmasi ve pas payi bir butun olarak ele alinmalidir. Hesapta bulunan bir alanin sahada aynı davranisi uretmesi ancak bu geometrik ve detaysal kosullar saglandiginda mumkundur.",
      "Saha tarafinda ana sorunlardan biri yoğun dugum bolgeleridir. Kolon-kiris birlesimi, perde ucu veya mesnet bolgesinde biriken demir yalnız isciligi zorlastirmaz; betonun akisini ve vibratorun etkinligini de sinirlar. Iyi donati duzeni, demirin sigmasi kadar betonun da bu kesitte ilerleyebilmesine izin vermelidir.",
      "Pas payi ve spacer sistemi cogu zaman ikincil gorulur; aslinda tam tersi dogrudur. Pas payi yalnız korozyondan korumaz; aderans davranisi, yangin dayanimi ve elemanin uzun omurlulugu üzerinde de etkilidir. Spacer yetersizliginde demir kaliba veya zemine yaslanir ve projedeki davranis bozulur.",
      "Deprem tasarımı acisindan kritik bolgelerde etriye kancasi, siklastirma adimi, bindirme bolgesi ve ankraj boylari küçük detay gibi okunamaz. Tasarim ofisinin deprem guvenligi burada bag teli ve sehpa üzerinde gercege donusur.",
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
        limitOrRequirement: "Eleman ve çevre kosuluna uygun ortu betonu spacer sistemiyle korunmalidir",
        reference: "TS 500",
        note: "Pas payi göz karariyla degil standart takozla saglanmalidir.",
      },
      {
        parameter: "Bindirme ve ankraj",
        limitOrRequirement: "Bindirmeler aynı kesitte yigilmadan dagitilmali ve ankraj boylari korunmalidir",
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
        limitOrRequirement: "Kritik dugumler ölçü, foto ve kontrol listesi ile belgelenmelidir",
        reference: "Saha kalite plani",
        note: "Kapanan imalat sonradan yalnız kayıt ile teyit edilir.",
      },
    ],
    designOrApplicationSteps: [
      "Shop drawing ve bukum listesini saha montaj sirasina göre hazirla.",
      "Pas payi, bindirme ve kritik dugumler için standart spacer ve kontrol adimlarini basindan tanimla.",
      "Kolon, kiris, perde ve doseme dugumlerinde beton akis yolunu da dusunerek yerlesimi yonet.",
      "Rezervasyon ve gomulu elemanlarin donatiyi sahada zorla kesmeyecegi sekilde koordinasyon kur.",
      "Kalip kapanmadan once deprem kritik bolgeleri ayri bir on kabul turu ile kontrol et.",
      "Foto ve ölçü arsivini eleman bazli tutarak belgesiz imalat birakma.",
    ],
    criticalChecks: [
      "Bindirmeler aynı kesitte yigilarak beton akis yolunu daraltiyor mu?",
      "Pas payi spacer sistemi tüm kritik yuzeylerde yeterli mi?",
      "Deprem kritik bolgelerinde etriye adimi ve kanca yonu net mi?",
      "Rezervasyonlar sahada dogaclama demir kesimine yol aciyor mu?",
      "Yoğun dugumlerde vibratorun ve betonun ilerleyecegi bosluk kaldi mi?",
      "Kalip kapanmadan once kritik dugumler foto ve olcuyle belgelendi mi?",
    ],
    numericalExample: {
      title: "Yoğun kolon dugumunde pas payi ve akis yolu yorumu",
      inputs: [
        { label: "Kolon kesiti", value: "40 x 60 cm", note: "Orta buyuklukte taşıyıcı eleman" },
        { label: "Boyuna donati", value: "8 phi 20", note: "Yoğun donatili kolon ornegi" },
        { label: "Hedef pas payi", value: "40 mm", note: "Koruma ve aderans için ornek deger" },
        { label: "Amac", value: "Yalnız demir sigmasi degil beton akis mantigini yorumlamak", note: "Ogretici saha kontrolu" },
      ],
      assumptions: [
        "Etriye ve bindirme bolgeleri aynı kesitte tam yigilmadan dagitilmistir.",
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
          note: "Kesit yalnız demirin varligiyla degil, betonun ilerleme imkaniyla kabul edilir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Yoğun dugumde kalite, daha çok demir baglamak degil; detay duzenini beton yerlesimine izin verecek sekilde korumaktir.",
          note: "En buyuk hata genelde eksik metraj degil, yanlış yerlesimdir.",
        },
      ],
      checks: [
        "Kritik kesitlerde beton akisi ayrıca dusunulmelidir.",
        "Pas payi ve bindirme kontrolleri yalnız gozle degil olcuyle dogrulanmalidir.",
        "Deprem kritik bolgeleri genel montaj listesinin icinde kaybolmamalidir.",
        "Foto arsiv dokum sonrasi sorulari cevaplayacak netlikte tutulmalidir.",
      ],
      engineeringComment: "Donati islerinde en tehlikeli yanlış, metraj tamam diye dugum davranisinin da tamam oldugunu varsaymaktir.",
    },
    tools: REBAR_TOOLS,
    equipmentAndMaterials: REBAR_EQUIPMENT,
    mistakes: [
      { wrong: "Demir miktarini kalite yerine koymak.", correct: "Yerlesim, pas payi ve dugum davranisini ana kabul kriteri yapmak." },
      { wrong: "Bindirmeleri kolay montaj için aynı kesitte toplamak.", correct: "Yigilmeyi azaltacak sekilde dagitmak." },
      { wrong: "Spacer ve takozlari ikincil gormek.", correct: "Pas payinin sahadaki ana guvencesi olarak standartlastirmak." },
      { wrong: "Rezervasyon için sahada rastgele cubuk kesmek.", correct: "Gomulu eleman ve bosluklari önceden koordine etmek." },
      { wrong: "Deprem kritik bolgelerini normal imalat ritmine karistirmak.", correct: "Bu bolgeleri ayri kalite kapisi gibi yonetmek." },
      { wrong: "Kalip kapanmadan once kritik dugumleri kayitsiz gecmek.", correct: "Foto ve ölçü arsiviyle belgeli on kabul yapmak." },
    ],
    designVsField: [
      "Projede donati alanlari ve detay cagrilari gorulur; sahada ise aynı bilgi bag teli, spacer ve beton akis bosluguyla gercege donusur.",
      "Iyi donati duzeni yalnız taşıyıcı davranisi korumaz, beton ekibinin de kontrollu calismasina izin verir.",
      "Bu nedenle donati isleri, hesap dogrulugunun saha okunabilirligine cevrildigi en kritik noktadir.",
    ],
    conclusion: [
      "Donati isleri doğru yonetildiginde betonarme davranisin sahadaki omurgasi saglam kurulur. Bu omurga zayif kuruldugunda hata beton altinda gizlenir ama etkisi yapı boyunca devam eder.",
      "Bir insaat muhendisi için en saglam yaklasim, donatinin varligini degil davranisini ve yerlesim kalitesini onaylamaktir.",
    ],
    sources: [...KABA_BATCH_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tbdy2018],
    keywords: ["donati isleri", "pas payi", "bindirme", "TBDY 2018", "betonarme dugum"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri/kolon-donati", "kaba-insaat/donati-isleri/kiris-donati", "kaba-insaat/donati-isleri/doseme-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/celik-cati",
    kind: "topic",
    quote: "Çelik çatı, acikligi hizla gecen hafif bir sistem gibi görünür; gercek performansi aks, bağlantı ve montaj toleransinin aynı anda korunmasiyla ortaya cikar.",
    tip: "Atolyeden gelen elemanlara guvenip sahadaki aks, civata ve gecici stabilite kontrolunu gevsetmek, hızlı montaji riskli montaja donusturur.",
    intro: [
      "Çelik çatı sistemleri genis acikliklari hafiflikle ve hizla kapatabildigi için sanayi yapilarinda ve buyuk hacimli üst ortulerde sık kullanilir. Makaslar, asiklar, caprazlar ve dugumler birlikte calisarak yukleri kolonlara aktarir. Bu nedenle çelik çatı, tek tek elemanlardan daha çok bir butun olarak davranan taşıyıcı organizasyondur.",
      "Sahadaki en buyuk yanlış, atolyeden düzgün gelen elemanlarin otomatik olarak doğru çatı anlamina geldigini varsaymaktir. Oysa aks kaymasi, kolon basligi kot farki, gevsek bulon veya eksik capraz en çok bu sistemlerde hizla sorun uretir. Montaj ne kadar hızlı ise kalite kontrolun o kadar disiplinli olmasi gerekir.",
      "Bir insaat muhendisi için çelik çatı; aks aplikasyonu, gecici montaj guvenligi, bulon sIkma disiplini, diyagonal olcumu, korozyon korumasi ve kaplama ekibine birakilacak temiz geometriyi birlikte okumak demektir.",
      "Bu yazida çelik catiyi teorik taşıyıcı mantik, standart ekseni, sayisal geometri yorumu ve saha hatalariyla birlikte derinlestiriyoruz.",
    ],
    theory: [
      "Çelik çatı davranisi, ana tasiyicilar ve ikincil elemanlarin birlikte calismasina dayanir. Makas ya da cerceve acikligi gecer, asiklar kaplama yuklerini dagitir, capraz sistem ise yatay stabiliteyi saglar. Bu nedenle tek bir elemanin doğru kesitte olmasi yetmez; tüm sistemin aks, kot ve dugum surekliligi korunmalidir.",
      "Montaj toleransi bu sistemlerde kritik onemdedir. Bir makasin küçük eksen kaymasi, uzun hat boyunca buyuyerek asik cizgisini bozar ve kaplama altinda dalgalanma yaratir. Daha onemlisi, bağlantı levhalarinda zorlanma ve ikincil gerilme olusabilir. Geometrik temizlik yalnız estetik degil, yapisal davranis kriteridir.",
      "Bulonlu birlesimler ve caprazlar çatı davranisinin omurgasidir. Civatayi takmak ile doğru torkta ve doğru sirayla sikmak aynı sey degildir. Caprazin cizimde bulunmasi ile montajda gercekten devrede olmasi da aynı sey degildir. Bu nedenle bağlantı kontrolu var/yok sayimi ile bitmez.",
      "Gecici stabilite de ayrıca dusunulmelidir. Çatı tam kapanmadan once sistemin tüm yatay rijitligi olusmaz. Bu ara asamada rüzgar, montaj yukleri ve vinc etkileri belirgin risk yaratir. Hiz baskisi altinda gecici destek unutuldugunda sistem kalici halinden once emniyetsiz hale gelebilir.",
    ],
    ruleTable: [
      {
        parameter: "Taşıyıcı sistem mantigi",
        limitOrRequirement: "Ana ve ikincil elemanlar tasarim mantigina uygun kesit, aks ve dugum surekliliginde kurulmalidir",
        reference: "TS EN 1993-1-1",
        note: "Tek tek doğru elemanlar, yanlış kurulan sistemde beklenen davranisi vermez.",
      },
      {
        parameter: "Imalat ve montaj kalitesi",
        limitOrRequirement: "Atolye ve saha toleranslari bağlantı ve kurulum zinciriyle birlikte kontrol edilmelidir",
        reference: "TS EN 1090",
        note: "Atolye dogrulugu sahadaki montaj hatasini telafi etmez.",
      },
      {
        parameter: "Bulon ve dugum kontrolu",
        limitOrRequirement: "Bulonlu birlesimler doğru yerlestirme ve sIkma disipliniyle kabul edilmelidir",
        reference: "Montaj kalite plani",
        note: "Takili bulon, doğru çalışan dugum anlamina gelmez.",
      },
      {
        parameter: "Gecici stabilite",
        limitOrRequirement: "Montaj asamalarinda capraz ve gecici destek sirasi önceden planlanmalidir",
        reference: "Saha montaj senaryosu",
        note: "Kalici sistem tamamlanmadan once gecici emniyet kritik hale gelir.",
      },
      {
        parameter: "Korozyon ve kapanis",
        limitOrRequirement: "Montaj sonrasi cizik ve kesimlerde koruyucu sistem tamir edilmelidir",
        reference: "Teslim kalite plani",
        note: "Küçük boya hasari uzun vadeli servis sorunu olabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Kolon basligi, ankraj ve aks aplikasyonunu montaj baslamadan sayisal olarak dondur.",
      "Makas ve ana elemanlari gecici stabilite sirasina göre kur; caprazlari sona birakma.",
      "Asik ve ikincil elemanlarda hat dogrulugu ile diyagonalleri tüm boy boyunca olc.",
      "Bulonlu birlesimleri tork, rondela ve temas kalitesiyle birlikte kontrol et.",
      "Kaplama ekibine gecmeden once geometri, boya tamiri ve bağlantı butunlugunu ikinci kez tara.",
      "Teslim dosyasina montaj kaydi, ölçü sonucu ve tamir noktalarini isle.",
    ],
    criticalChecks: [
      "Kolon basligi kotlari ve akslari çatı montajina uygun netlikte mi?",
      "Makas, asik ve caprazlar boyunca diyagonal ve hat surekliligi korundu mu?",
      "Bulonlar doğru sIkma disipliniyle kabul edildi mi?",
      "Montaj sirasinda gecici stabilite yeterli ve belgeli mi?",
      "Kaplama öncesi boya tamirleri tamamlandi mi?",
      "Çatı iskeleti sonraki kaplama paketi için temiz geometri birakti mi?",
    ],
    numericalExample: {
      title: "24 m x 12 m catida diyagonal kontrol mantigi",
      inputs: [
        { label: "Plan boyutu", value: "24 m x 12 m", note: "Dikdortgen çatı alani" },
        { label: "Teorik diyagonal", value: "26,83 m", note: "sqrt(24^2 + 12^2) ile bulunan hedef" },
        { label: "Olculen diyagonal farki", value: "35 mm", note: "Iki köşe olcumu arasindaki saha farki" },
        { label: "Hedef", value: "Kaplama öncesi geometri sapmasini yorumlamak", note: "Ogretici saha degerlendirmesi" },
      ],
      assumptions: [
        "Ölçüm guvenilir cihazla alinmistir.",
        "Catida gecici caprazlar takili ve sistem kabaca tamamlanmistir.",
        "Deger nihai tolerans karari yerine saha mantigi anlatimi icindir.",
      ],
      steps: [
        {
          title: "Teorik diyagonali belirle",
          formula: "sqrt(24^2 + 12^2) = 26,83 m",
          result: "Planin teorik diyagonal olcusu yaklasik 26,83 m'dir.",
          note: "Bu çatı geometri kontrolunun temel referansidir.",
        },
        {
          title: "Saha farkini yorumla",
          result: "35 mm'lik fark, uzun hatta capraz veya aks ayari gerektirebilecek bir geometri sapmasi oldugunu gosterir.",
          note: "Küçük farklar uzun panel hatlarinda buyuyebilir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Çelik catida geometri kontrolu kaplama sonrasi degil, kaplama öncesi ve caprazlar aktifken tamamlanmalidir.",
          note: "Makaslar kapandi diye sistem otomatik doğru kurulmus sayilmaz.",
        },
      ],
      checks: [
        "Diyagonal ve hat olcumleri tek noktada degil kritik akslarda tekrarlanmalidir.",
        "Bulon sIkma ve capraz aktivasyonu geometri kontrolunden ayrik dusunulmemelidir.",
        "Kaplama ekibi sahaya girmeden once ana geometri kapanmis olmalidir.",
        "Boya tamirleri geometri kadar teslim kriteridir.",
      ],
      engineeringComment: "Çelik catida milimetre gibi gorunen sapmalar, uzun aciklikta panel ve dugum davranisi olarak buyuyebilir.",
    },
    tools: STEEL_ROOF_TOOLS,
    equipmentAndMaterials: STEEL_ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Atolyeden gelen elemanin otomatik olarak doğru montaj anlamina geldigini varsaymak.", correct: "Aks, kot ve diyagonal kontrolunu sahada yeniden yapmak." },
      { wrong: "Caprazlari montaj sonunda eklenir detay gibi gormek.", correct: "Gecici ve kalici stabilite için caprazlari erken devreye almak." },
      { wrong: "Bulonlari takmakla yetinmek.", correct: "SIkma, temas ve bağlantı kalitesini kayitli sekilde kontrol etmek." },
      { wrong: "Kaplama ekibini geometri kapanmadan sahaya sokmak.", correct: "Çelik iskeleti olcuyle once kapatmak." },
      { wrong: "Montaj sonrasi boya hasarlarini onemsiz gormek.", correct: "Kesim ve cizik noktalarini teslimden once onarmak." },
      { wrong: "Hiz kazanmak için gecici stabilite detaylarini gevsetmek.", correct: "Montaj senaryosunu emniyet ve rijitlik sirasina göre kurmak." },
    ],
    designVsField: [
      "Projede çelik çatı kesit ve dugumlerle anlatilir; sahada ise aynı bilgi aks aplikasyonu, bulon sIkma ve capraz surekliligi ile gercege donusur.",
      "Iyi çelik çatı hızlı kurulur ama daha da onemlisi doğru geometri ve temiz dugum mantigiyla kapanir.",
      "Bu nedenle çelik çatı kalitesi, atolyedeki imalat kadar sahadaki montaj disiplininin de sonucudur.",
    ],
    conclusion: [
      "Çelik çatı doğru aks, doğru bağlantı ve doğru montaj sirasi ile kuruldugunda hafif, hızlı ve guvenilir bir üst ortu sistemi sunar. Bu zincirdeki bir zayiflik geometri ve servis omru sorunlarini aynı anda ortaya cikarir.",
      "Bir insaat muhendisi için en saglam bakis, çelik catiyi atolyeden gelen parcalarin birlesimi degil; sahada ölçü, bağlantı ve stabilite ile dogrulanan bir sistem olarak gormektir.",
    ],
    sources: [...KABA_BATCH_SOURCES, TS_EN_1993_1_1_SOURCE, TS_EN_1090_SOURCE],
    keywords: ["çelik çatı", "TS EN 1993-1-1", "TS EN 1090", "bulonlu birlesim", "çatı montaji"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti", "ince-isler/cati-kaplamasi/metal-cati"],
  },
];
