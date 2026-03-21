import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuidePageSpec } from "../types";

const KAZI_TEMEL_OVERRIDE_SOURCES = [...BRANCH_SOURCE_LEDGER["kazi-temel"]];

export const kaziTemelTopicOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kazi-temel/hafriyat",
    kind: "topic",
    quote: "Hafriyat, topragi kazmak degil; zemini, suyu ve komsu yapilari birlikte yoneterek temel icin guvenli platform olusturmaktir.",
    tip: "Kaziyi yalniz makine hizi ve kamyon sayisi olarak okumak, sahadaki en pahali hatalari kot kaybi, su baskisi ve iksa ihlali olarak geri getirir.",
    intro: [
      "Hafriyat isleri, yapinin gorunmeyen ama en riskli baslangic fazidir. Bu fazda verilen kot, egim, su ve tahkimat kararlarinin tamami sonraki temel imalatinin kalitesini ve komsu parsellerin guvenligini etkiler.",
      "Sahada en sik gorulen hata, kaziyi yalniz kazi makinesinin ilerleme hiziyle yonetmektir. Oysa hafriyat; aplikasyon, kademe plani, tasima rotasi, gecici drenaj ve guvenli calisma sinirlarinin birlikte ele alindigi bir operasyon zinciridir.",
      "Bir insaat muhendisi icin hafriyat, 'zemin cikarma' degil; geoteknik veri ile saha lojistigini ayni anda yonetme isidir.",
    ],
    theory: [
      "Kazinin davranisi zeminin cinsi, yeraltı suyu, komsu temel derinlikleri ve hava kosullariyla birlikte okunur. Ayni kot farki, sert kilde baska, gevek kumda baska risk davranisi üretir.",
      "Kazi cephesinde en buyuk riskler; kotun fazla kacmasi, geoteknik varsayimin sahada dogrulanmamasi ve suyun kontrolsuz sekilde kazıya girmesidir. Bu uc hata, dolgu ve grobeton asamasinda dahi kendini maliyet olarak hissettirir.",
      "Hafriyatta makine hareketi de teknik kararın parcasi olmalidir. Agir ekipmanin cevreye verdigi titreşim, kazı kenarına fazla yaklaşması veya dar alanda ters manevra zorlaması kaza riskini buyutur.",
      "Bu nedenle hafriyat, geoteknik okumayla saha lojistigini ayni plan uzerinde birlestiren disiplinli bir uygulamadir.",
    ],
    ruleTable: [
      {
        parameter: "Kazı kotu",
        limitOrRequirement: "Proje kotu aplikasyon ile surekli dogrulanmali, fazla kazı aninda raporlanmali",
        reference: "TBDY 2018 temel yaklasimi + saha aplikasyon disiplini",
        note: "Asiri kazı, dolgu ve zemin iyilestirme ihtiyacini buyutur.",
      },
      {
        parameter: "Gecici su kontrolu",
        limitOrRequirement: "Yagis ve yeraltı suyu için pompaj ve drenaj senaryosu sahada hazir olmali",
        reference: "Geoteknik saha kalite plani",
        note: "Suyu sonra dusunmek, kazinin dayanma kosulunu tesadufe birakir.",
      },
      {
        parameter: "Kazi kenari guvenligi",
        limitOrRequirement: "Kademe, iksa veya emniyet mesafesi geoteknik karara gore korunmali",
        reference: "TBDY 2018 Bolum 16 ve saha guvenlik disiplini",
        note: "Kazi kenarini lojistik alani gibi kullanmak cok risklidir.",
      },
      {
        parameter: "Zemin gozlemi",
        limitOrRequirement: "Etut raporuyla saha gorunumu uyumsuzsa kazi durdurulup muhendislik degerlendirmesi yapilmali",
        reference: "Zemin etudu ve saha gozlem zinciri",
        note: "Sahadaki farkli tabaka davranisi proje varsayimini bozabilir.",
      },
    ],
    designOrApplicationSteps: [
      "Kazı oncesi aplikasyon, komsu parsel siniri ve gecici trafik planini netlestir.",
      "Etut raporundaki tabaka beklentisini saha gozlem formuna cevir ve her kademede kontrol et.",
      "Kazı kotunu total station veya nivo ile surekli izle; makine gozuyle karar verme.",
      "Gecici su toplama, pompaj ve yagis senaryosunu kazı başlamadan kur.",
      "Kazi dibi kabulunu temel ekibine devretmeden once gevsek zon, su ve fazla kazi acisindan tutanakla tamamla.",
    ],
    criticalChecks: [
      "Kazı kotu proje kotuyla surekli dogrulaniyor mu?",
      "Kazi kenarina fazla yaklaşan ekipman veya stok var mi?",
      "Yeraltı suyu veya yagis icin aktif pompaj plani hazir mi?",
      "Kazı dibinde gevsek veya yumusamis zonlar goruldu mu?",
      "Komşu yapılarda yeni çatlak veya deplasman belirtisi var mi?",
    ],
    numericalExample: {
      title: "3.20 m derinlikte kazida fazla kazi yorumu",
      inputs: [
        { label: "Proje kazi derinligi", value: "3.20 m", note: "Temel alt kotu" },
        { label: "Olculen fiili kazi", value: "3.35 m", note: "Bir kot aksinda tespit" },
        { label: "Fazla kazi", value: "0.15 m", note: "Yerel bolgede" },
        { label: "Hedef", value: "Temel tabanini dogru platforma getirmek", note: "Ek maliyeti azaltmak" },
      ],
      assumptions: [
        "Zemin raporunda bu kotta benzer tabaka beklenmektedir.",
        "Fazla kazi lokal bir aksla sinirlidir.",
        "Dolgu malzemesi ve sikistirma karari muhendis onayi ile verilecektir.",
      ],
      steps: [
        {
          title: "Farki oku",
          formula: "3.35 - 3.20 = 0.15 m",
          result: "15 cm fazla kazi temel platformunu bozmustur.",
          note: "Bu fark kucuk gorunse de temel davranisinda homojenligi bozar.",
        },
        {
          title: "Saha kararini kur",
          result: "Lokal bolge rastgele toprakla doldurulmamalidir; uygun dolgu veya zayif beton karari muhendislik kontroluyle verilmelidir.",
          note: "Kazida geri gelmek, kazmak kadar teknik bir islemdir.",
        },
        {
          title: "Takvime etkisini yorumla",
          result: "Fazla kazi grobeton ve donati takvimini dogrudan etkiler; aninda raporlanmalidir.",
          note: "Gecikmis raporlama, hatayi butun temele yayar.",
        },
      ],
      checks: [
        "Fazla kazi lokal ise alan siniri netlestirilmelidir.",
        "Geri dolgu karari kontrollu malzeme ve sikistirma ile verilmelidir.",
        "Rastgele dolgu veya moloz kesinlikle kabul edilmemelidir.",
        "Kazı dibi yeniden aplikasyonla kontrol edilmelidir.",
      ],
      engineeringComment: "Hafriyatta 10-15 cm'lik hata, grobetonda santimetreler ve betonda tonlar olarak geri döner.",
    },
    tools: [
      { category: "Olcum", name: "Total station, nivo ve kot kontrol cizelgesi", purpose: "Kazı derinligi ve platform dogrulugunu surekli izlemek." },
      { category: "Geoteknik", name: "Saha gozlem formu ve zemin logu", purpose: "Etut raporu ile sahadaki tabaka davranisini karsilastirmak." },
      { category: "Kontrol", name: "Pompaj ve yagis aksiyon plani", purpose: "Gecici su riskini onceden yonetmek." },
      { category: "Kayit", name: "Kazı dibi kabul tutanagi ve foto arsivi", purpose: "Temel oncesi platformun teknik olarak devrini belgelemek." },
    ],
    equipmentAndMaterials: [
      { group: "Makine", name: "Ekskavator, mini ekskavator ve yukleme ekipmani", purpose: "Kazıyı kademeli ve kontrollu sekilde ilerletmek.", phase: "Kazı" },
      { group: "Olcum", name: "Aplikasyon kaziklari, kot isaretleri ve olcum ekipmani", purpose: "Kazı sınırlarını ve derinligini surekli dogrulamak.", phase: "Takip" },
      { group: "Su kontrolu", name: "Pompalar, hortumlar ve gecici drenaj elemanlari", purpose: "Yagis ve yeraltı suyunu kazi platformundan uzaklastirmak.", phase: "Kazı ve koruma" },
      { group: "Guvenlik", name: "Bariyer, ikaz elemanlari ve kenar koruma ekipmani", purpose: "Kazı cevresinde insan ve ekipman guvenligini saglamak.", phase: "Surekli" },
    ],
    mistakes: [
      { wrong: "Kazı kotunu yalnız makine operatörü gozuyle takip etmek.", correct: "Aplikasyon ve kot kontrolunu vardiya boyunca olcerek yonetmek." },
      { wrong: "Yagmur ve su riskini kazi acildiktan sonra dusunmek.", correct: "Gecici drenaj ve pompaj planini once kurmak." },
      { wrong: "Kazi kenarina malzeme stoklamak.", correct: "Kenari yukten arindirip emniyet mesafesini korumak." },
      { wrong: "Etut raporuyla sahadaki farki gormezden gelmek.", correct: "Tabaka uyumsuzlugunda muhendislik degerlendirmesi istemek." },
      { wrong: "Fazla kaziyi rastgele dolguyla kapatmak.", correct: "Uygun malzeme ve kontrollu geri kazanım karari vermek." },
    ],
    designVsField: [
      "Projede hafriyat bir kot ve sinir olarak gorunur; sahada ise su, lojistik ve geoteknik davranis ayni anda yonetilir.",
      "Iyi hafriyat sonraki ekibe sessiz bir platform birakir; kotu hafriyat temel imalatini daha baslamadan savunmada birakir.",
    ],
    conclusion: [
      "Hafriyat isleri dogru aplikasyon, dogru su kontrolu ve dogru saha gozlemi ile yonetildiginde temel fazinin guvenli baslangicini olusturur.",
      "Yanlis yonetildiginde ise kot, su ve komsu etki problemleri tum projeye yayilan kayip uretir.",
    ],
    sources: [...KAZI_TEMEL_OVERRIDE_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.afadHazard],
    keywords: ["hafriyat", "kazı kontrolu", "kazi dibi kabul", "gecici drenaj", "zemin gozlemi"],
  },
  {
    slugPath: "kazi-temel/temel-turleri",
    kind: "topic",
    quote: "Temel tipi secimi, katalog tercihi degil; zemin kapasitesi, oturma davranisi ve tasiyici sistemin birlikte verdigi bir muhendislik cevabidir.",
    tip: "Temel turunu sadece ust yapinin agirligina bakarak secmek, oturma farklarini ve saha uygulanabilirligini ikinci plana itmek demektir.",
    intro: [
      "Temel turleri; münferit, sürekli, radye veya kazikli sistemler gibi farkli cozumlerle ust yapidan gelen yukleri zemine aktaran ana ara yüzdür. Bu nedenle temel karari yalniz tasiyici sistem konusu degil, ayni zamanda geoteknik bir uyum karari olarak okunmalidir.",
      "Sahada cok gorulen yanlis yaklasim, temel secimini yalniz metraj ve kalinlik tartismasina indirgemektir. Oysa asıl mesele zeminin bu yukleri hangi oturma davranisi ile karsilayacagi ve temelin sahada ne kadar kontrollu uygulanabilecegidir.",
      "Bir insaat muhendisi icin temel tipi, zemin etudu, su seviyesi, komsu yapilar, kazı derinligi ve deprem davranisi ile birlikte karar verilen temel proje kararıdır.",
    ],
    theory: [
      "Temel seciminde ana soru, zeminin yalniz tasima gucu degil; toplam ve diferansiyel oturma davranisidir. Tasima gucu saglanmis görünen bir zeminde bile oturma farki ust yapida ciddi catlak ve servis problemi yaratabilir.",
      "Münferit ve sürekli temeller daha yalın ve ekonomik gorunse de zemin sürekliliği ve kolon-perde duzeni buna uygun olmalidir. Radye temel, yukleri daha yaygin dagitır; ancak bu karar oturma, donati yogunlugu ve saha lojistigi ile birlikte ele alinmalidir.",
      "Yeraltı suyu, zayif tabaka derinligi veya komsu yapı etkisi arttiginda kazikli cozumler ya da zemin iyilestirme ile desteklenen temeller gündeme gelir. Bu noktada proje karari yalniz statik degil, geoteknik ve ekonomik optimizasyon olur.",
      "Deprem etkisi altinda da temel sistemi ust yapinin davranisini etkiler. TBDY 2018, temel ve zemin davranisinin birlikte ele alinmasini bu nedenle ister.",
    ],
    ruleTable: [
      {
        parameter: "Temel secim kriteri",
        limitOrRequirement: "Tasima gucu, oturma, su seviyesi ve ust yapi duzeni birlikte degerlendirilmeli",
        reference: "TBDY 2018 + TS 500",
        note: "Tek parametreyle verilen temel karari sahada yetersiz kalir.",
      },
      {
        parameter: "Zemin surekliligi",
        limitOrRequirement: "Zemin tabakalari ve zayif zonlar temel tipine gore dikkate alinmali",
        reference: "Zemin etudu + geoteknik yorum",
        note: "Lokal zayif tabaka, tum temel secimini degistirebilir.",
      },
      {
        parameter: "Su ve kazi etkisi",
        limitOrRequirement: "Temel sistemi, kazı ve yeraltı suyu davranisiyla uyumlu olmali",
        reference: "Saha uygulama plani",
        note: "Kağıt uzerinde uygun görünen temel, sahada uygulanamaz hale gelebilir.",
      },
      {
        parameter: "Deprem davranisi",
        limitOrRequirement: "Temel-zemin etkilesimi deprem tasarim mantigi icinde okunmali",
        reference: "TBDY 2018 Bolum 16",
        note: "Temel sadece dusey yuk elemani gibi gorulmemelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Zemin etudundeki tabaka, su ve oturma verilerini temel seciminin ana girdisi olarak oku.",
      "Kolon-perde duzeni ve ust yapi yuk dagilimini temel planı ile birlikte incele.",
      "Münferit, sürekli, radye veya kazikli alternatifleri saha uygulanabilirligi ve maliyet acisindan karsilastir.",
      "Seçilen temelin kazi, drenaj, donati yogunlugu ve betonlama senaryosunu erkenden kur.",
      "Temel tipini sahada dogrulayan kontrol planini grobeton oncesi hazirla.",
    ],
    criticalChecks: [
      "Temel secimi yalniz tasima gucune mi yoksa oturma davranisina da dayanıyor mu?",
      "Lokal zayif tabakalar temel planinda ayrica degerlendirildi mi?",
      "Yeraltı suyu, kazi ve betonlama lojistigi temel tipiyle uyumlu mu?",
      "Radye veya münferit secimi donati ve saha isciligi acisindan test edildi mi?",
      "Temel tipinin deprem davranisina etkisi proje ekibi tarafindan tartisildi mi?",
    ],
    numericalExample: {
      title: "Iki alternatif temel sisteminin saha yorumu",
      inputs: [
        { label: "Kolon aks duzeni", value: "5 x 5 m", note: "Duzenli aks araligi" },
        { label: "Izin verilen zemin gerilmesi", value: "180 kPa", note: "Etut raporu ornegi" },
        { label: "Yuk karakteri", value: "Perde + kolonlu orta yuk", note: "Cok katli konut varsayimi" },
        { label: "Alternatifler", value: "Surekli temel / radye temel", note: "On degerlendirme" },
      ],
      assumptions: [
        "Zemin tabakasi genel olarak sureklidir ancak lokal farklar mevcuttur.",
        "Yeraltı suyu kazi tabanina yakin degildir.",
        "Ust yapi duzenli akslarla calismaktadir.",
      ],
      steps: [
        {
          title: "Zemin surekliligini oku",
          result: "Duzensiz oturma riski dusukse surekli temel ekonomik bir aday olabilir.",
          note: "Ancak perde yogunlugu ve kesisen temeller saha karmasikligi yaratabilir.",
        },
        {
          title: "Yuk dagilimini yorumla",
          result: "Perde ve kolon yukleri birlikte yogunlasiyorsa radye temel yuk dagitimini daha homojen hale getirebilir.",
          note: "Bu karar beton ve donati maliyetine karsi oturma performansi ile tartilmalidir.",
        },
        {
          title: "Saha uygulanabilirligini ekle",
          result: "Dar akslarda temel kesisimleri ve grobeton duzeni zorsa radye saha hizi acisindan avantaj yaratabilir.",
          note: "Ekonomik gorunen temel her zaman daha uygulanabilir olmayabilir.",
        },
      ],
      checks: [
        "Temel karari tasima ve oturma birlikte okunarak verilmelidir.",
        "Perde yogunlugu saha imalatini zorlastiriyorsa alternatif tekrar karsilastirilmalidir.",
        "Kazı ve betonlama lojistigi temel seciminin parcasi olmalidir.",
        "Grobeton oncesi aplikasyon planı temel tipiyle uyumlu olmalıdır.",
      ],
      engineeringComment: "Temel tipi secimi, hesap sayfasinda biten degil; sahada oturan ve betonlanan karardir.",
    },
    tools: [
      { category: "Geoteknik", name: "Zemin etudu ve oturma karsilastirma tabloları", purpose: "Temel alternatiflerini geoteknik veriyle tartmak." },
      { category: "Analiz", name: "Statik model ve temel on boyut kontrol sayfalari", purpose: "Yuk dagilimini ve temele inen kuvvetleri karsilastirmak." },
      { category: "Kontrol", name: "Temel secim matrisi", purpose: "Zemin, su, kazi ve maliyet kriterlerini ayni tabloda gormek." },
      { category: "Saha", name: "Grobeton ve aplikasyon kontrol listesi", purpose: "Secilen temel tipinin sahada dogru kurulmasini saglamak." },
    ],
    equipmentAndMaterials: [
      { group: "Hazirlik", name: "Grobeton, aplikasyon kaziklari ve olcum ekipmani", purpose: "Temel eksenlerini ve platformunu netlestirmek.", phase: "Hazirlik" },
      { group: "Imalat", name: "Temel donatisi, kalip ve beton ekipmani", purpose: "Secilen temel tipini projeye uygun imal etmek.", phase: "Temel uygulamasi" },
      { group: "Kontrol", name: "Zemin ve beton kabul tutanaklari", purpose: "Temel altini ve ustunde gelen imalati teknik olarak devralmak.", phase: "Kabul" },
      { group: "Destek", name: "Pompaj ve gecici drenaj ekipmani", purpose: "Su etkisinin temel altinda sorun yaratmasini onlemek.", phase: "Uygulama" },
    ],
    mistakes: [
      { wrong: "Temel tipini yalniz maliyetle secmek.", correct: "Oturma, su ve saha uygulanabilirligini ayni anda degerlendirmek." },
      { wrong: "Zemin surekliligini varsaymak.", correct: "Lokal zayif zonlari secime dahil etmek." },
      { wrong: "Perde ve kolon yuk yogunlugunu ihmal etmek.", correct: "Yuk dagilimini temel planinda birlikte okumak." },
      { wrong: "Saha lojistigini temel seciminden ayirmak.", correct: "Kazı, donati ve betonlama akisini secimin parcasi yapmak." },
      { wrong: "Temeli sadece dusey yuk elemani gibi gormek.", correct: "Deprem davranisi ve temel-zemin etkilesimini de hesaba katmak." },
    ],
    designVsField: [
      "Projede temel tipi satirlar ve kesitlerle secilir; sahada ise kazı, grobeton, donati yogunlugu ve betonlama akisi bu secimin gercek karsiligini verir.",
      "Dogru temel secimi sadece daha guvenli degil, daha okunabilir ve uygulanabilir bir santiye uretir.",
    ],
    conclusion: [
      "Temel turleri arasinda dogru secim, zemin verisi, oturma davranisi ve saha uygulanabilirliginin birlikte degerlendirilmesiyle yapilir.",
      "Bu denge kurulmadiginda hesapta uygun gorunen temel, sahada sorun ve tekrar is uretir.",
    ],
    sources: [...KAZI_TEMEL_OVERRIDE_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500],
    keywords: ["temel turleri", "radye temel", "surekli temel", "münferit temel", "oturma davranisi"],
  },
  {
    slugPath: "kazi-temel/zemin-etudu",
    kind: "topic",
    quote: "Zemin etudu, ruhsat eki bir rapor degil; yapinin altindaki belirsizligi hesaplanabilir veriye ceviren ana muhendislik dokumanidir.",
    tip: "Zemin etudunu sadece rapor teslim evraki gibi gormek, sahadaki en pahali surprizleri kazi ve temel asamasina tasimak demektir.",
    intro: [
      "Zemin etudu, yapinin zemine oturan tum kararlarini besleyen temel veri setidir. Tasima gucu, tabaka siralamasi, yeraltı suyu, sikisma davranisi ve deprem parametreleri bu rapordan okunur; dolayisiyla raporun kalitesi tum temel stratejisini belirler.",
      "Sahada en sik hata, raporu bir kez alip rafa kaldirmaktir. Oysa kazi sirasinda görülen tabaka farklari, su cikislari veya beklenmeyen gevsek zonlar raporla birlikte yeniden okunmali ve gerekirse proje karari guncellenmelidir.",
      "Bir insaat muhendisi icin zemin etudu, sadece jeoloji verisi degil; tasarim, saha gozlemi ve risk yonetimi arasinda kurulan teknik dildir.",
    ],
    theory: [
      "Iyi bir zemin etudu yalniz tablo ve sondaj logu sunmaz; bu verilerin temel sistemi icin ne anlama geldigini de yorumlar. Tasima gucu, oturma, su seviyesi ve deprem parametreleri birlikte ele alinmadiginda rapor eksik kalir.",
      "Sondaj sayisi ve derinligi tek basina yeterlilik gostergesi değildir. Önemli olan, elde edilen verinin yapı oturma alanını temsil edip etmedigi ve kritik tabakalarin dogru yakalanip yakalanmadigidir.",
      "Deprem tasariminda da zemin etudu ana girdidir. TBDY 2018 kapsamindaki yerel zemin sinifi ve saha parametreleri, ust yapi hesabini oldugu kadar temel kararini da etkiler.",
      "Bu nedenle zemin etudu, okunup arşive kaldırilan değil; kazi boyunca sahadaki gozlemle birlikte yaşayan bir dokuman olmalıdır.",
    ],
    ruleTable: [
      {
        parameter: "Temsil yeterliligi",
        limitOrRequirement: "Sondaj ve deneyler yapı oturum alanini ve kritik zayif zonlari temsil etmeli",
        reference: "Geoteknik etut disiplini",
        note: "Yetersiz temsil, tasarim kararini lokal veriye mahkum eder.",
      },
      {
        parameter: "Deprem ve zemin sinifi",
        limitOrRequirement: "Yerel zemin sinifi ve deprem girdileri TBDY 2018 mantigiyla tutarli olmali",
        reference: "TBDY 2018 + TDTH",
        note: "Yanlis zemin sinifi ust yapi ve temel kararlarini birlikte bozar.",
      },
      {
        parameter: "Yeraltı suyu",
        limitOrRequirement: "Su seviyesi mevsimsel etkilerle birlikte yorumlanmali",
        reference: "Geoteknik rapor + saha gozlemi",
        note: "Sabit bir deger gibi alinan su seviyesi santiyede farkli davranabilir.",
      },
      {
        parameter: "Saha dogrulamasi",
        limitOrRequirement: "Kazi sirasinda rapor verileri saha logu ile karsilastirilmali",
        reference: "Muhendislik saha kontrolu",
        note: "Raporla saha uyusmazligi gorulurse proje ekibi bilgilendirilmelidir.",
      },
    ],
    designOrApplicationSteps: [
      "Raporu sadece sonuc sayfasi ile degil sondaj loglari, deneyler ve yorum bolumuyle birlikte oku.",
      "Tasima gucu, oturma, su seviyesi ve deprem parametrelerini temel secim matrisine aktar.",
      "Kritik tabakalari kazi planina ve saha kontrol formuna cevir.",
      "Kazı basladiginda saha gorunumunu raporla karsilastir ve uyumsuzluklari kayda al.",
      "Temel alti kabulden once geoteknik varsayimlarin sahada gecerli kaldigini tekrar dogrula.",
    ],
    criticalChecks: [
      "Sondaj ve deneyler yapi oturum alanini yeterince temsil ediyor mu?",
      "Raporun onerileri temel tipine ve kazi senaryosuna dogrudan baglandi mi?",
      "Yeraltı suyu mevsimsel risk olarak ele alindi mi?",
      "Kazı sirasinda tabaka davranisi raporla uyumlu mu?",
      "Deprem ve zemin sinifi verileri statik ekiple ayni yorumda mi?",
    ],
    numericalExample: {
      title: "Iki sondaj verisinin temel kararina etkisi",
      inputs: [
        { label: "Sondaj S1 tasima davranisi", value: "Daha siki tabaka", note: "Parselin bir kenari" },
        { label: "Sondaj S2 tasima davranisi", value: "Daha yumusak tabaka", note: "Diger kenar" },
        { label: "Sondaj araligi", value: "20 m", note: "Ornek saha kurgusu" },
        { label: "Hedef", value: "Diferansiyel oturma riskini okumak", note: "Temel tipi karari icin" },
      ],
      assumptions: [
        "Iki sondaj arasinda yapi oturum alani yer almaktadir.",
        "Parselde lokal tabaka degisimi ihtimali vardir.",
        "Ust yapi düzenli kolon-perde sistemiyle calismaktadir.",
      ],
      steps: [
        {
          title: "Veri farkini yorumla",
          result: "S1 ve S2 arasindaki davranis farki, zeminin tamamen homojen olmadigini gosterir.",
          note: "Bu durumda temel tipi yalniz ortalama degerle secilmemelidir.",
        },
        {
          title: "Oturma riskini ekle",
          result: "Lokal yumusak zon, diferansiyel oturma riskini artirabilir.",
          note: "Bu yorum radye temel veya ek geoteknik calisma ihtiyacini guclendirebilir.",
        },
        {
          title: "Saha kontrolune cevir",
          result: "Kazı sirasinda bu iki zon arasindaki gecis mutlaka gozlenmeli ve tutanaklanmalidir.",
          note: "Rapor verisi kazi ile birlikte dogrulanmadiginda belirsizlik devam eder.",
        },
      ],
      checks: [
        "Farkli sondaj davranislari ortalama alinarak gecistirilmemelidir.",
        "Temel karari oturma farkina gore yeniden tartilmalidir.",
        "Kazı sirasinda tabaka gecisleri loglanmalidir.",
        "Gerekirse ilave geoteknik calisma istenmelidir.",
      ],
      engineeringComment: "Zemin etudundeki en kritik veri, bazen tek bir buyukluk degil; iki nokta arasindaki farktir.",
    },
    tools: [
      { category: "Geoteknik", name: "Sondaj loglari ve laboratuvar ozet tablosu", purpose: "Tabaka davranisini ve deney sonuclarini bir arada okumak." },
      { category: "Deprem", name: "TDTH ve zemin sinifi kontrol listesi", purpose: "Deprem girdileri ile rapor yorumunu tutarli hale getirmek." },
      { category: "Kontrol", name: "Saha tabaka gozlem formu", purpose: "Kazı sirasinda rapor-saha uyumunu belgelemek." },
      { category: "Kayit", name: "Geoteknik karar matrisi", purpose: "Temel tipi, su ve oturma etkilerini aynı tabloda toplamak." },
    ],
    equipmentAndMaterials: [
      { group: "Arastirma", name: "Sondaj ve numune alma ekipmanlari", purpose: "Temel altindaki tabaka davranisini temsil edecek veri uretmek.", phase: "Etut" },
      { group: "Laboratuvar", name: "Zemin deney ve siniflandirma setleri", purpose: "Zeminin mekanik ve fiziksel ozelliklerini belirlemek.", phase: "Deney" },
      { group: "Saha", name: "Kazı sirasinda tabaka gozlem ve olcum ekipmani", purpose: "Rapor verisini sahada tekrar dogrulamak.", phase: "Kazı" },
      { group: "Dokumantasyon", name: "Log, rapor ve foto arsiv sistemi", purpose: "Geoteknik bilginin proje boyunca izlenebilir kalmasini saglamak.", phase: "Surekli" },
    ],
    mistakes: [
      { wrong: "Zemin etudunu ruhsat eki belge gibi gormek.", correct: "Temel ve kazi kararlarinin ana girdisi olarak okumak." },
      { wrong: "Raporu sadece sonuc sayfasi ile değerlendirmek.", correct: "Sondaj logu, deney ve yorum bolumunu birlikte incelemek." },
      { wrong: "Yeraltı suyunu sabit kabul etmek.", correct: "Mevsimsel ve saha kosullarina gore yorumlamak." },
      { wrong: "Kazı sirasinda rapor-saha farkini kayitsiz gecmek.", correct: "Uyumsuzlugu teknik degerlendirme konusu yapmak." },
      { wrong: "Farkli sondaj davranislarini ortalama alarak gecistirmek.", correct: "Lokal zayif zon ve diferansiyel oturma riskini ayri okumak." },
    ],
    designVsField: [
      "Ofiste zemin etudu tablo ve loglarla okunur; sahada ise ayni rapor, kazı cephesindeki renk, nem ve tabaka davranisi ile yeniden anlam kazanir.",
      "Dogru rapor kadar dogru saha dogrulamasi da gereklidir; aksi halde geoteknik veri tek seferlik varsayim olarak kalir.",
    ],
    conclusion: [
      "Zemin etudu dogru okunup kazi boyunca sahada dogrulandiginda temel seciminin belirsizligini ciddi sekilde azaltir.",
      "Yuzeysel okundugunda ise en kritik kararlar eksik veriyle verilmis olur.",
    ],
    sources: [...KAZI_TEMEL_OVERRIDE_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.tdth, SOURCE_LEDGER.afadHazard],
    keywords: ["zemin etudu", "sondaj logu", "yerel zemin sinifi", "oturma riski", "geoteknik veri"],
  },
];
