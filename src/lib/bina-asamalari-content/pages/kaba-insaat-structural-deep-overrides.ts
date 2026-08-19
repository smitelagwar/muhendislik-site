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
  { category: "Analiz", name: "Idecad / ETABS döşeme ciktilari", purpose: "Aciklik davranisini ve donatı yogunlugunu pafta ile eslestirmek." },
  { category: "Cizim", name: "Shop drawing ve panel donatı plani", purpose: "Asal, dagitma ve ek bolgelerini sahada okunabilir hale getirmek." },
  { category: "Kontrol", name: "Sehpa ve rezervasyon checklisti", purpose: "Üst donatı kotunu ve tesisat bosluklarini beton öncesi dogrulamak." },
  { category: "Kayıt", name: "Panel bazli foto ve ölçü formu", purpose: "Genis yuzeylerde bolgesel değil tüm panel disiplini kurmak." },
];

const DONATI_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Imalat", name: "Kesme-bukme tezgahi ve panel etiketleme seti", purpose: "Döşeme donatisini cap ve boy bazinda duzenli hazirlamak.", phase: "Atolye" },
  { group: "Montaj", name: "Bag teli, pense, sehpa ve spacer", purpose: "Alt-üst donatıyı doğru kotta ve duzende tutmak.", phase: "Saha montaji" },
  { group: "Kontrol", name: "Lazer nivo, metre ve ag kontrol cizelgesi", purpose: "Genis panelde aralik ve kot surekliligini olcmek.", phase: "On kabul" },
  { group: "Koordinasyon", name: "Tesisat kutusu, rezervasyon kalıbı ve isaretleme seti", purpose: "Sonradan kesme ihtiyacini azaltmak için boşlukları planli birakmak.", phase: "Montaj öncesi" },
];

const ROOF_TOOLS: BinaGuideTool[] = [
  { category: "Cizim", name: "Çatı plani, mahya kesiti ve bağlantı paftaları", purpose: "Mertek, asik ve mahya davranisini sahaya net indirmek." },
  { category: "Ölçüm", name: "Lazer nivo, aci olcer ve rutubet olcer", purpose: "Egim, geometri ve ahşap kuruluk seviyesini montaj öncesi teyit etmek." },
  { category: "Kontrol", name: "Bağlantı ve havalandirma checklisti", purpose: "Rüzgar, buhar ve bağlantı detaylarini bir arada denetlemek." },
  { category: "Kayıt", name: "Numune düğüm ve montaj foyi", purpose: "Ahşap çatıda usta refleksi yerine tekrar edilebilir detay mantigi kurmak." },
];

const ROOF_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı", name: "Mertek, asik, makas ve yardimci kusaklar", purpose: "Ahşap çatının ana yük aktarimini ve geometrisini kurmak.", phase: "Montaj" },
  { group: "Bağlantı", name: "Civata, vida, saplama ve ankraj seti", purpose: "Dugumlerin rüzgar ve servis yukleri altinda acilmasini engellemek.", phase: "Birleşim" },
  { group: "Kabuk", name: "OSB, su yalitim altligi ve havalandirma detaylari", purpose: "Kaplama altinda kuru ve nefes alan bir çatı kabugu olusturmak.", phase: "Kaplama öncesi" },
  { group: "Güvenlik", name: "Iskele, yasam hatti ve gecici platform", purpose: "Egilimli yuzeyde güvenli montaj ve düzgün kontrol saglamak.", phase: "Tüm süreç" },
];

export const kabaInsaatStructuralDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/donati-isleri/doseme-donati",
    kind: "topic",
    quote: "Döşeme donatısı, genis yuzeyli elemanin yalnız moment kapasitesini değil, çatlak kontrolünü ve kat duzleminin servis kalitesini de belirler.",
    tip: "Döşeme donatisinda en sık hata, genis panel rahatligina aldanip asal yön, dagitma cubugu, üst donatı ve rezervasyon disiplinini sahada birbirine karistirmaktir.",
    intro: [
      "Döşeme donatısı, betonarme yapının en genis alanli ama en kolay hafife alinan imalatlarindan biridir. Yüzey buyudukce hata kuculuyor gibi görünür; gercekte ise küçük saha kaymalari butun panelin davranisini etkileyebilir. Bu nedenle döşeme, kiriş kadar dramatik düğümler gostermese de aynı olcude mühendislik dikkati ister.",
      "Sahada en yaygin sorun, panelin düz ve sakin gorunmesi nedeniyle donatı duzeninin detay seviyesinde kontrol edilmemesidir. Asal yonle dagitma yonunun karismasi, üst donatının sehpa yetersizligiyle asagi inmesi, rezervasyonlarin sonradan kesilmesi ve isci trafigiyle aralik bozulmasi uzun vadede çatlak ve sehim davranisina yazilir.",
      "Bir inşaat mühendisi için döşeme donatısı yalnız cap ve aralik sayimi degildir. Üst- alt katman iliskisi, tesisat kutulari, saft boşlukları, kalinlik toleransi ve beton dokumu sırasında panelin nasil korunacagi birlikte yonetilmelidir.",
      "Bu nedenle döşeme donatisini, genis alanli bir tekrar imalati değil; düzen, kot ve koordinasyon disiplini isteyen bir panel muhendisligi olarak ele almak gerekir.",
    ],
    theory: [
      "Dosemede asal donatı yükü ana çalışma yonunde tasir; dagitma donatısı ise çatlak kontrolünü, ikincil tasimayi ve panel davranisinin dengelenmesini sağlar. Bir yonun daha kritik olmasi, diger yonun gelişigüzel uygulanabilecegi anlamina gelmez. Genis panelde düzen kaybi, elemanin gercek davranisini projeden uzaklastirir.",
      "Üst donatı konumu, teorik olarak cizimde sabit gorunse de sahada sehpa kalitesi, yürüme trafigi ve pompa hortumu hareketiyle bozulmaya çok aciktir. Üst donatı asagi dustugunde panelin negatif moment ve çatlak kontrol performansi görünmez bicimde zayiflar. Bu hata beton dokumu sırasında fark edilmezse ancak servis davranisinda okunur.",
      "Dosemede rezervasyonlar ayri bir yapisal konudur. Elektrik kutusu, saft gecisi, mekanik boşluk veya merdiven agzi nedeniyle cubuklar kesilecekse bu telafi karari mutlaka proje mantigi icinde verilmelidir. Sonradan rastgele kesilen cubuk, genis panelde gizli zayiflik uretir.",
      "TS 500 mantigi geregi döşeme yalnız dayanımı değil servis performansini da yonetir. Bu nedenle donatı araligi, ek düzeni ve panel kalinligi birlikte okunmadan yapilan saha kabulu eksik kalir.",
    ],
    ruleTable: [
      {
        parameter: "Asal ve dagitma donatı düzeni",
        limitOrRequirement: "Donatı yonleri, araliklari ve panel mantigi proje duzenine göre korunmali",
        reference: "TS 500",
        note: "Genis panel rahatligi, yön bilgisinin kaybolmasina yol acmamalidir.",
      },
      {
        parameter: "Üst donatı kötü",
        limitOrRequirement: "Sehpa ve spacer sistemi üst donatının tasarim kotunda kalmasini saglamali",
        reference: "TS EN 13670 + saha uygulama disiplini",
        note: "Üst donatının asagi inmesi gorunmeyen ama etkili kalite kaybidir.",
      },
      {
        parameter: "Rezervasyon ve boşluklar",
        limitOrRequirement: "Tesisat kutusu ve boşluklar donatı surekliligini bozmayacak sekilde önceden cozulmeli",
        reference: "TS 500 + proje koordinasyonu",
        note: "Sonradan kesilen cubuklar ancak mühendislik karariyla telafi edilir.",
      },
      {
        parameter: "Panel bazli saha kabul",
        limitOrRequirement: "Genis yüzey tek nokta yerine ag mantigiyla kontrol edilmelidir",
        reference: "Saha kalite plani",
        note: "Bolgesel bakis tüm panelin doğru kuruldugu anlamina gelmez.",
      },
    ],
    designOrApplicationSteps: [
      "Döşeme panelinde asal ve dagitma yonlerini pafta ve saha isaretleriyle acikca belirle.",
      "Alt donatıyı aralik duzenini bozmadan ser, ardindan sehpalarla üst katman kotunu kür.",
      "Elektrik kutusu, saft ve diger rezervasyonlari cubuk kesmeden önce proje ile teyit et.",
      "Paneli tek merkezden değil ag seklinde gezerek sehpa zayifligi, aralik bozulmasi ve yön karismasini kontrol et.",
      "Beton dokumu sırasında hortum ve yürüme trafiginin üst donatıyı itmeyecegi bir geçiş düzeni kür.",
      "Beton öncesi son turda paneli bolgesel değil butun olarak okuyup foto ve kontrol formuyla kapat.",
    ],
    criticalChecks: [
      "Asal ve dagitma yonleri sahada karismis mi?",
      "Üst donatı sehpa üzerinde yeterince korunuyor mu?",
      "Isci trafigi bazi bolgelerde araligi ve kötü bozmus mu?",
      "Rezervasyonlar nedeniyle kesilen cubuklar projede telafi edilmis mi?",
      "Beton öncesi tüm panel için ag mantikli bir kabul yapildi mi?",
      "Pompa hortumu hareketi panelin zayif bolgelerini bozuyor mu?",
    ],
    numericalExample: {
      title: "5,0 x 8,0 m panelde cubuk adedi ve düzen yorumu",
      inputs: [
        { label: "Panel boyutu", value: "5,0 m x 8,0 m", note: "Tek döşeme paneli" },
        { label: "Donatı araligi", value: "phi12 / 15 cm", note: "Ana yön için ornek" },
        { label: "5,0 m yonunde adet", value: "34 cubuk", note: "(5,0 / 0,15) + 1" },
        { label: "8,0 m yonunde adet", value: "54 cubuk", note: "(8,0 / 0,15) + 1" },
      ],
      assumptions: [
        "Hesap ilk saha kontrolü icindir; bindirme ve fire ayri degerlendirilecektir.",
        "Panel icinde buyuk rezervasyon bulunmadigi kabul edilmistir.",
        "Üst ve alt donatı duzenleri ayri isaretlenmistir.",
      ],
      steps: [
        {
          title: "Adet kontrolünü yap",
          result: "Yaklasik adet hesabi, sahaya gelen demirin pafta ile kaba uyumunu hızlı dogrular.",
          note: "Bu kontrol eksik serim veya yanlış sayim riskini erken yakalar.",
        },
        {
          title: "Duzenin bozulup bozulmadigini sorgula",
          result: "Adet doğru olsa bile sehpa cokmesi veya yön karisikligi varsa panel davranisi bozulabilir.",
          note: "Genis yuzeyde nicelik kadar konum da önemlidir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Döşeme donatısı için sayim ilk adimdir; asil kalite panelin her noktasinda aynı kot ve aynı duzenin korunmasidir.",
          note: "Panel düzeni bozuldugunda hata beton altinda gizlenir.",
        },
      ],
      checks: [
        "Adet kontrolü sehpa ve yön kontrolü ile birlikte tamamlanmalidir.",
        "Rezervasyonlar panel duzenini bozuyorsa ayri olarak telafi edilmelidir.",
        "Üst donatı beton gunu yeniden gözden gecirilmelidir.",
        "Genis panelde tek bir bolgeye bakarak kabul verilmemelidir.",
      ],
      engineeringComment: "Döşeme donatisinda sorun cogu zaman eksik cubuktan değil, genis yuzeyde kaybolan kot ve düzen disiplininden dogar.",
    },
    tools: DONATI_TOOLS,
    equipmentAndMaterials: DONATI_EQUIPMENT,
    mistakes: [
      { wrong: "Donatı yonlerini sahada sozlu tarifle birakmak.", correct: "Yonu ve bolgeyi fiziksel isaretleme ile netlestirmek." },
      { wrong: "Üst donatıyı yetersiz sehpa ile yürüme trafigine birakmak.", correct: "Panel boyunca standart sehpa düzeni kurmak." },
      { wrong: "Rezervasyon için cubuklari sahada rastgele kesmek.", correct: "Kesinti ve telafiyi proje ile birlikte cozumlemek." },
      { wrong: "Genis panelde birkaç bolgeye bakip tüm paneli kabul etmek.", correct: "Ag mantigiyla tüm paneli kontrol etmek." },
      { wrong: "Dagitma donatisini ikincil gorup gevsek uygulamak.", correct: "Çatlak kontrolundeki rolunu dikkate alarak aynı disiplinle yerlestirmek." },
      { wrong: "Pompa ve yürüme yollarini panel zayifliklarini dusunmeden belirlemek.", correct: "Beton gunu lojistigini donatı korumasina göre kurmak." },
    ],
    designVsField: [
      "Projede döşeme donatısı tekrarlayan cizgiler gibi görünür; sahada ise bu cizgilerin yonunu, araligini ve kotunu korumak basli basina kalite isidir.",
      "Bu yuzden döşeme donatısı, genis alanli sistemlerde düzen koruma disiplininin en net testlerinden biridir.",
      "Iyi panel, yalnız yeterli demir tasidigi için değil tüm yuzeyde aynı mantikla kuruldugu için degerlidir.",
    ],
    conclusion: [
      "Döşeme donatısı doğru yonetildiginde yüzey çatlak kontrolü, servis davranisi ve genel kat kalitesi birlikte iyilesir.",
      "Duzen bozuldugunda ise hata beton altinda görünmez hale gelir ama etkisi sehim, çatlak ve rezervasyon kaynakli zayiflik olarak devam eder.",
    ],
    sources: [...KABA_STRUCTURAL_SOURCES, SOURCE_LEDGER.ts500],
    keywords: ["döşeme donatısı", "asal donatı", "dagitma donatısı", "sehpa", "rezervasyon"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/donati-isleri", "kaba-insaat/donati-isleri/kiris-donati"],
  },
  {
    slugPath: "kaba-insaat/cati-iskeleti/ahsap-cati",
    kind: "topic",
    quote: "Ahşap çatı hafif olabilir; ama bu hafiflik ancak kuruluk, bağlantı ve havalandirma disiplinleri birlikte kuruldugunda avantaja donusur.",
    tip: "Ahşap catiyi yalnız mertek dizme isi gibi görmek, malzemenin rutubet davranisini, rüzgar altindaki bağlantı ihtiyacini ve kaplama altindaki hava akis zorunlulugunu ihmal etmektir.",
    intro: [
      "Ahşap çatı, düşük katli yapilarda hızlı montaj, hafiflik ve islenebilirlik avantaji sayesinde yaygin kullanilir. Ancak sistemin gercek kalitesi yalnız çatının kurulmasinda değil, ahşabın kuruluk seviyesi, bağlantı dugumleri, havalandirma boşluğu ve kaplama alti davranisinda ortaya çıkar.",
      "Sahada en buyuk hata, ahşap elemanlarin metal sistemler kadar duyarsiz sanilmasidir. Oysa rutubeti yüksek malzeme zamanla doner, bağlantı noktalarinda acilma yapar veya kaplama altinda ses ve geometri bozuklugu uretir. Bu nedenle ahşap çatı, montaj hizinin ardina saklanmamasi gereken bir malzeme disiplinidir.",
      "Bir mühendis için ahşap çatı yalnız taşıyıcı kurgu degildir. Egim, mertek araligi, mahya sürekliliği, ankraj, rüzgar emmesi, buhar hareketi ve havalandirma boşluğu aynı sistemin farkli yuzleridir. Bu kararlar ayrildiginda çatı ilk bakista düzgün gorunse bile ilk mevsim dongulerinde sorun vermeye başlar.",
      "Dolayisiyla ahşap çatı, dogal malzemenin avantajini alirken onun davranisini da ciddiyetle yonetmek zorunda olan bir saha muhendisligi isidir.",
    ],
    theory: [
      "Ahşap anisotropik bir malzemedir; nem ve sıcaklık degisimlerine celikten farkli tepki verir. Bu nedenle eleman secimi ve montajdaki rutubet seviyesi, çatının sonraki aylardaki geometri kararliligini belirler. Duz elemanla kurulan çatı, nemli malzeme kullanildiginda zamanla sarili veya acilan bir sisteme donusebilir.",
      "Taşıyıcı davranis yalnız mertek boyuyla ilgili degildir. Mahya, asik, mertek, bağlantı levhasi ve ankraj birlikte calisir. Rüzgar emmesi, kar yükü ve bakım trafigi aynı çatı dugumlerinde toplanir. Bu nedenle bağlantı detaylari usta aliskanligiyla değil hesap ve tekrar edilebilir uygulama mantigiyla kurulmalidir.",
      "Ahşap çatı aynı zamanda bir kabuk sistemidir. TS 825 mantigina uygun isi yalitimi, buhar hareketi ve havalandirma boşluğu cozulmediginde ahşap eleman kuruluk dengesini kaybeder. Kaplama altinda biriken nem yalnız enerji kaybi değil malzeme omru problemi de uretir.",
      "Bu yuzden ahşap çatı projede sıcak ve yaln bir çözüm gibi gorunse de sahada en teknik basliklardan biridir: geometri, malzeme, bağlantı ve yapı fizigi aynı anda okunur.",
    ],
    ruleTable: [
      {
        parameter: "Ahşap malzeme kurulugu ve doğruluğu",
        limitOrRequirement: "Montaja girecek elemanlar düzgün, uygun kurulukta ve gozle kusurlari kontrol edilmis olmali",
        reference: "TS EN 1995-1-1 + saha kabul disiplini",
        note: "Rutubetli ve egri ahşap sistem davranisini baslangictan bozar.",
      },
      {
        parameter: "Bağlantı ve ankraj",
        limitOrRequirement: "Dugumler rüzgar ve dusay yük etkileri dusunulerek tekrar edilebilir detayla kurulmalidir",
        reference: "TS EN 1995-1-1",
        note: "Ahşap çatıda bağlantı, eleman kadar tasiyicidir.",
      },
      {
        parameter: "Havalandirma ve kabuk davranisi",
        limitOrRequirement: "Kaplama altinda hava akisi ve nem tahliyesi saglanmali, isi yalitimi kabukla uyumlu cozulmeli",
        reference: "TS 825",
        note: "Nefes almayan çatı, zamanla ahşapta servis omru sorunu uretir.",
      },
      {
        parameter: "Geometri ve egim",
        limitOrRequirement: "Mahya, sacak ve mertek hattinda sürekli egim korunmali",
        reference: "Planli Alanlar Imar Yönetmeliği + saha ölçüm disiplini",
        note: "Küçük geometri sapmalari kaplama altinda buyuk dalga yaratir.",
      },
    ],
    designOrApplicationSteps: [
      "Mertek, asik ve mahya kurgusunu aciklik, egim ve kaplama sistemi ile birlikte netlestir.",
      "Montaja girecek ahşap elemanlari kuruluk, dogruluk ve kusur acisindan ayikla.",
      "Ankraj, civata ve bağlantı levhalarini numune düğüm uzerinden önce test edip sonra seri uygula.",
      "Mahya, sacak ve kaplama alti havalandirma bosluklarini proje detayinda tarif ettigin gibi sahada da koru.",
      "Lazer nivo ve aci kontrolü ile tüm çatı boyunca egim ve dogrultu surekliligini olc.",
      "Kaplama öncesi çatı iskeletini butun olarak gezip rüzgar, nem ve bakım senaryosu acisindan son tur yap.",
    ],
    criticalChecks: [
      "Montaja giren ahşap elemanlarin rutubet ve dogruluk kontrolü yapildi mi?",
      "Mahya ve sacak hattinda tüm çatı boyunca aynı geometri korunuyor mu?",
      "Ankraj ve bağlantı levhalari her dugumde aynı mantikla uygulanmis mi?",
      "Kaplama altinda hava akisi ve buhar tahliyesi için sürekli boşluk var mi?",
      "Mertek araliklari kaplama sisteminin ihtiyaciyla uyumlu mu?",
      "Catiya sonradan gelecek cihaz ve baca gecisleri detayda dusunuldu mu?",
    ],
    numericalExample: {
      title: "8 m aciklikta %33 egimli ahşap çatı için mahya yüksekliği yorumu",
      inputs: [
        { label: "Toplam aciklik", value: "8,0 m", note: "Iki yana egimli çatı" },
        { label: "Yarim aciklik", value: "4,0 m", note: "Sacaktan mahyaya yatay mesafe" },
        { label: "Hedef egim", value: "%33", note: "Ornek uygulama degeri" },
        { label: "Hedef", value: "Mahya kotunu sahada somutlamak", note: "Montaj geometri kontrolü için" },
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
          note: "Ahşap çatıda küçük geometri sapmasi kaplama altinda buyuk dalga olarak okunur.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Geometri yalnız estetik konu degildir; bağlantı davranisi, su yonu ve havalandirma boşluğu da bu kot kararina baglidir.",
          note: "Egim cizimde yazili oldugu için değil sahada sürekli olculdugu için gerceklesir.",
        },
      ],
      checks: [
        "Mahya kötü tek noktadan değil tüm hat boyunca kontrol edilmelidir.",
        "Kaplama duzlemi ve havalandirma boşluğu aynı geometri mantigiyla ilerlemelidir.",
        "Ankraj ve bağlantı detaylari geometri kadar kritik kabul edilmelidir.",
        "Egim karari olcuyle teyit edilmeden kaplama asamasina gecilmemelidir.",
      ],
      engineeringComment: "Ahşap çatıda geometri, estetikten önce su, rüzgar ve malzeme omru davranisini belirleyen teknik bir karardir.",
    },
    tools: ROOF_TOOLS,
    equipmentAndMaterials: ROOF_EQUIPMENT,
    mistakes: [
      { wrong: "Rutubetli veya egri ahsabi montaja almak.", correct: "Elemanlari kuruluk ve dogruluk acisindan secerek kullanmak." },
      { wrong: "Bağlantı detaylarini usta refleksine birakmak.", correct: "Her düğümü tekrar edilebilir teknik detayla kurmak." },
      { wrong: "Kaplama altinda havalandirma boslugunu ihmal etmek.", correct: "Yapı fizigi ve malzeme omru için sürekli hava akisi saglamak." },
      { wrong: "Mahya ve sacak dogrultusunu birkaç noktadan doğru gormekle yetinmek.", correct: "Tüm hat boyunca sürekliliği olcmek." },
      { wrong: "Rüzgar ankrajini hafif sistem diye onemsiz saymak.", correct: "Ahşap çatıda bağlantı ve ankraji ana taşıyıcı karar saymak." },
      { wrong: "Cihaz ve baca gecislerini sonradan saha cozumune birakmak.", correct: "Çatı iskeleti kurulmadan önce detaylara dahil etmek." },
    ],
    designVsField: [
      "Projede ahşap çatı sıcak ve yaln bir sistem gibi gorunebilir; sahada ise rutubet, havalandirma ve bağlantı detaylari bu sadeligin gercek bedelini belirler.",
      "Iyi ahşap çatı, sadece hızlı kurulan değil mevsim donuslerinde de geometri ve kuruluk dengesini koruyan catidir.",
      "Bu nedenle ahşap çatı, dogal malzemenin cazibesini ancak disiplinli muhendislikle uzun omurlu çözüm haline getirir.",
    ],
    conclusion: [
      "Ahşap çatı doğru malzeme, doğru bağlantı ve doğru havalandirma ile kuruldugunda hafif, hızlı ve uzun omurlu bir sistem sunar.",
      "Bu disiplinler ihmal edildiginde ise ilk mevsim gecislerinde geometri bozuklugu, nem sorunu ve kaplama problemleriyle avantajini hizla kaybeder.",
    ],
    sources: [...KABA_STRUCTURAL_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.planliAlanlar, TS_EN_1995_SOURCE],
    keywords: ["ahşap çatı", "mertek", "mahya", "havalandirma boşluğu", "TS EN 1995"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/cati-iskeleti", "ince-isler/cati-kaplamasi/kiremit"],
  },
];
