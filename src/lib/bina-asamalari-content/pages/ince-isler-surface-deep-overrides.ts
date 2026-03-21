import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const INCE_SURFACE_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_13707_SOURCE: BinaGuideSource = {
  title: "TS EN 13707 Cati Su Yalitiminda Kullanilan Takviyeli Bitumlu Levhalar",
  shortCode: "TS EN 13707",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Bitumlu membran cati sistemlerinde urun tipi, performans ve temel uygulama cercevesi icin referans standartlardan biridir.",
};

const TS_EN_12058_SOURCE: BinaGuideSource = {
  title: "TS EN 12058 Dogal Tas Mamulleri - Dosemeler ve Merdivenler Icin Levha ve Fayanslar",
  shortCode: "TS EN 12058",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Mermer ve granit gibi dogal tas kaplamalarda boyutsal tolerans, yuzey ve urun tanimi icin temel referanslardan biridir.",
};

const TS_EN_14195_SOURCE: BinaGuideSource = {
  title: "TS EN 14195 Alcili Levha Sistemleri Icin Metal Karkas Bilesenleri",
  shortCode: "TS EN 14195",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alcipan bolme duvarlarda kullanilan metal profil bilesenlerinin teknik cercevesi icin referans standartlardan biridir.",
};

const SURFACE_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Tip kesit, numune alan ve mahal bazli uygulama paftasi", purpose: "Yuzey islerinin en kritik dugumlerini seri uygulama oncesi netlestirmek." },
  { category: "Olcum", name: "Lazer nivo, mastar, sakul ve ara kot takip seti", purpose: "Yuzey duzlugu, egim ve aks kalitesini sayisal olarak kabul etmek." },
  { category: "Kontrol", name: "Yuzey kabul checklisti ve ses-drenaj formu", purpose: "Gorunur kalite ile teknik performansi tek turda denetlemek." },
  { category: "Kayit", name: "Numune foto arsivi ve parti takip cizelgesi", purpose: "Ton, detay ve saha kararlarini sonradan izlenebilir kilmak." },
];

const SURFACE_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Altlik", name: "Tesviye, karkas, egim veya tasiyici alt sistemler", purpose: "Kaplamanin veya levhanin teknik performansini tasiyacak dogru zemini kurmak.", phase: "Hazirlik" },
  { group: "Kaplama", name: "Levha, membran, dogal tas veya bitis malzemesi", purpose: "Mahal fonksiyonu ve dayaniklilik beklentisine uygun son yuzeyi olusturmak.", phase: "Montaj" },
  { group: "Birlesim", name: "Yapistirici, bindirme, profil, bant ve derz elemanlari", purpose: "Sistemin en zayif halkasi olan birlesim hatlarini guvenli kilmak.", phase: "Detay cozumleri" },
  { group: "Koruma", name: "Yuruyus, temizlik ve teslim koruma ekipmani", purpose: "Bitmis yuzeyi sonraki ekipler ve erken kullanim riskinden korumak.", phase: "Teslim oncesi" },
];

export const inceIslerSurfaceDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/alcipan/bolme-duvar",
    kind: "topic",
    quote: "Bolme duvar hafif olabilir; ama mekan organizasyonu, kapi dogrulugu, akustik ve sonraki tum bitislerin kalitesi buyuk olcude burada belirlenir.",
    tip: "Tasiyici degil diye gevsek kurulan bolme duvar, kapi kasasindan seramik derzine kadar tum ince isleri zincirleme bozar.",
    intro: [
      "Alcipan bolme duvar sistemleri hizli imalat, temiz saha ve esnek mekan kurgusu sagladigi icin yaygin kullanilir. Ancak bu hiz, yalnizca sistem mantigi dogru kuruldugunda avantaj yaratir. Aks hatasi, zayif profil secimi, kapi bolgesinde takviye eksigi veya tesisat gecislerinin plansiz acilmasi hafif sistemi bir anda sorun kaynagina donusturebilir.",
      "Bir insaat muhendisi acisindan bolme duvar yalniz tasiyici olmayan bir ayirici eleman degildir. Kapi dogrulugu, duvar duzlugu, akustik performans, yangin beklentisi, agir ekipman askisi ve tesisat kutularinin guvenli yerlestirilmesi bu duvarin dogru kurulmasina baglidir. Bu nedenle bolme duvar, ustaya birakilacak hafif is degil; detay ve koordinasyon gerektiren bir sistem uygulamasidir.",
      "Sahada en buyuk sorun, karkas kapanmadan once cozulmesi gereken takviye ve tesisat kararlarinin gec verilmesidir. Gomme rezervuar, TV aski noktasi, kapi kasasi, lavabo destekleri veya cift tarafli buatlar kapatma sonrasi dusunulurse hem levha kesilir hem sistem rijitligi bozulur.",
      "Bu yazida bolme duvari; profil sistemi, kapi bolgesi, akustik-yangin mantigi, saha koordinasyonu ve sayisal bir dikme yorumu ile uzun-form standarda uygun derinlikte ele aliyoruz.",
    ],
    theory: [
      "Bolme duvar performansi, metal karkas ritmi ile levha sisteminin birlikte calismasina dayanir. Profil araligi, levha kat adedi, vida disiplini ve kenar birlesimleri dogru kuruldugunda hafif sistem beklenenden daha duzgun ve dayanikli davranir. Profil araligi ve takviye mantigi zayifsa duvar titresir, kapi bolgesinde sehim yapar ve derzlerde catlak uretir.",
      "Kapi bolgesi bolme duvarin en kritik alanidir. Standart dikme ritmi burada yeterli degildir; jamb guclendirmesi, ust lento mantigi ve kasa ile karkas iliskisi birlikte cozulmelidir. Aksi halde kapi duvari her acilis kapanista calistirir ve zamanla derz, boya veya pervaz kusuru olarak geri doner.",
      "Akustik ve yangin beklentileri de sistemsel dusunmeyi gerektirir. Ayni profil ailesi ve tek levha mantigi her mahal icin uygun olmayabilir. Ofis, hasta odasi, servis hacmi veya islak hacimde dolgu, levha tipi ve katman sayisi farklilasabilir. Bu nedenle bolme duvarlarda mahal performans hedefi en bastan tanimlanmalidir.",
      "TS EN 14195 metal karkas bilesenlerinin teknik cercevesini verir; ancak sahadaki asil kalite, bu bilesenlerin aksa, kotlara ve gelecekteki kullanim yuklerine gore dogru organizasyonunda ortaya cikar.",
    ],
    ruleTable: [
      {
        parameter: "Profil sistemi ve duvar yuksekligi",
        limitOrRequirement: "Duvar yuksekligi ve kullanimina uygun metal karkas secilmeli, profil araliklari sistem mantigina gore korunmalidir",
        reference: "TS EN 14195 + sistem detaylari",
        note: "Her duvar ayni profil ve ayni ritimle cozulmez.",
      },
      {
        parameter: "Kapi ve noktasal yuk takviyesi",
        limitOrRequirement: "Kapi kasasi, agir ekipman ve tesisat odakli noktalarda ilave destekler levha kapanmadan once kurulmalidir",
        reference: "Uygulama detaylari",
        note: "Sonradan duzeltme, sistem rijitligini zayiflatir.",
      },
      {
        parameter: "Akustik ve yangin beklentisi",
        limitOrRequirement: "Dolgu, levha tipi ve katman sayisi mahal performans hedefiyle uyumlu secilmelidir",
        reference: "Yangin Yonetmeligi + mahal ihtiyac programi",
        note: "Gorunur olarak kapali olan her duvar ayni performansi vermez.",
      },
      {
        parameter: "Aks ve duzlem kalitesi",
        limitOrRequirement: "Duvar akslari, kapi acikliklari ve duseylik bitis islerini bozmayacak hassasiyette kurulmalidir",
        reference: "Saha aplikasyon plani",
        note: "Tasiyici olmayan duvarda bile aks kaybi tum mekani bozar.",
      },
    ],
    designOrApplicationSteps: [
      "Duvar akslarini ve kapi acikliklarini zeminde netlestirip karkas montajina ondan sonra gec.",
      "Kapi jamblari, agir ekipman noktalarini ve tesisat kutularini levha kapanmadan once takviyeli cozumle.",
      "Mahal gereksinimine gore dolgu, cift levha veya ozel levha tipini standardize et; duvari tek tip urun gibi gorme.",
      "Elektrik ve mekanik gecisleri levha ve profil sistemini zayiflatmayacak sekilde koordine et.",
      "Karkas asamasinda sakul, aks ve kapi duzlemini olcup kayda bagla; bitis katmanina birakma.",
      "Derz, macun ve boya oncesi tum duvarlari tek tek kapi fonksiyonu ve yuzey kalitesi acisindan tekrar dolas.",
    ],
    criticalChecks: [
      "Kapi bolgesinde jamb ve ust kayit takviyesi gercekten kuruldu mu?",
      "Duvar aksi ve kapi acikligi mimari plandaki olculerle tutarli mi?",
      "Agir ekipman veya tesisat kutulari karkasi zayiflatiyor mu?",
      "Dolgu ve levha katmani mahalin akustik-yangin ihtiyacina uygun mu?",
      "Karkas sakulu ve duvar duzlemi bitis katmanindan once kontrol edildi mi?",
      "Kapatma oncesi takviye ve tesisat foto-kaydi alindi mi?",
    ],
    numericalExample: {
      title: "5,40 m bolme duvarda profil ritmi ve kapi etkisi yorumu",
      inputs: [
        { label: "Duvar uzunlugu", value: "5,40 m", note: "Ofis bolme duvari" },
        { label: "Duvar yuksekligi", value: "3,00 m", note: "Net kat seviyesi" },
        { label: "Ornek profil aks araligi", value: "60 cm", note: "Tipik sistem mantigi" },
        { label: "Kapi boslugu", value: "90 cm", note: "Tek kanat kapi" },
      ],
      assumptions: [
        "Kapi boslugu icin ilave jamb profili kullanilacaktir.",
        "Kesin profil araligi sistem detayina gore teyit edilir.",
        "Agir ekipman aski noktasi ayrica takviyelendirilecektir.",
      ],
      steps: [
        {
          title: "Teorik araligi oku",
          formula: "5,40 / 0,60 = 9 aralik",
          result: "Kapi etkisi disinda yaklasik 10 ana dikme hatti mantigi olusur.",
          note: "Bu hesap duvari duz yuzey gibi okur; kapi bolgesi ayri ele alinmalidir.",
        },
        {
          title: "Kapi etkisini ekle",
          result: "90 cm kapi boslugu, standart ritmi keser ve takviyeli jamb-cozumunu zorunlu kilabilir.",
          note: "Kapi bolgesi diger duvar alanlari gibi davranmaz.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Bolme duvarlarda hizli metraj hesabindan once kapi, ekipman ve performans gereksinimleri okunmalidir.",
          note: "Hafif sistemin zayif halkasi genelde tam bu ozel bolgelerdir.",
        },
      ],
      checks: [
        "Kapi bolgesi standart profil ritmine birakilmamalidir.",
        "Takviye gerektiren tum noktalar levha kapanmadan once cozulmelidir.",
        "Duvar sakulu sadece finalde degil karkas asamasinda da kontrol edilmelidir.",
        "Akustik ve yangin performansi yalniz goruntu uzerinden anlasilamaz; sistem kararindan okunur.",
      ],
      engineeringComment: "Bolme duvar hafif sistemdir; ama kapi ve ekipman yukleri bu hafifligi kolayca zayif halkaya cevirebilir.",
    },
    tools: SURFACE_TOOLS,
    equipmentAndMaterials: SURFACE_EQUIPMENT,
    mistakes: [
      { wrong: "Kapi boslugunu duz duvar ritmi icinde cozmeye calismak.", correct: "Kapi bolgesini takviyeli ozel detay olarak ele almak." },
      { wrong: "Agir ekipman gelecegini sonradan dusunmek.", correct: "Karkas icinde takviye noktalarini onceden yerlestirmek." },
      { wrong: "Elektrik kutularini profil mantigini bozacak sekilde rastgele acmak.", correct: "Tesisat gecislerini karkasla koordine etmek." },
      { wrong: "Tum duvarlari ayni levha ve dolgu ile gecmek.", correct: "Mahal performansina gore sistem farklarini tanimlamak." },
      { wrong: "Karkas sakulunu bitis katmanina birakmak.", correct: "Levha kapanmadan once aks ve duzlem kontrolu yapmak." },
      { wrong: "Takviye ve tesisat kararlarini kayitsiz kapatmak.", correct: "Foto ve checklist ile kapanis oncesi belgelenmis kalite kurmak." },
    ],
    designVsField: [
      "Projede bolme duvar tek cizgi gibi gorunur; sahada ise kapi, akustik, yangin ve ekipman yuklerinin ayni anda yonettigi bir sistemdir.",
      "Hafiflik burada kolaylik kadar disiplin de ister; aksi halde kusurlar bitis katmanlarinda birer birer ortaya cikar.",
      "Iyi bolme duvar, yalnizca duz duran degil, sonraki tum ince islere temiz referans veren duvardir.",
    ],
    conclusion: [
      "Bolme duvarlar, hafif sistem olmalarina ragmen mekan kalitesini ve bitis islerinin dogrulugunu belirleyen kritik elemanlardir. Karkas, takviye, kapi ve performans hedefleri birlikte cozuldugunda sorun cikarmadan calisirlar.",
      "Bir insaat muhendisi icin dogru yaklasim, bolme duvari ikincil is degil; ince is zincirinin referans geometri sistemi olarak gormektir.",
    ],
    sources: [...INCE_SURFACE_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_14195_SOURCE],
    keywords: ["bolme duvar", "alcipan", "TS EN 14195", "kapi takviyesi", "akustik duvar"],
    relatedPaths: ["ince-isler", "ince-isler/alcipan", "ince-isler/kapi-pencere/ic-kapi"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi/membran-cati",
    kind: "topic",
    quote: "Membran cati, duz gorunen yuzeyde suyu gorunmez bicimde yoneten bir sistemdir; basarisi ruloda degil, egim ve detay surekliliginde saklidir.",
    tip: "Membrani tek basina su yalitimi sanmak, egim betonu, su yonu, parapet donusleri ve koruma katmanini ikinci plana atmak demektir.",
    intro: [
      "Membran cati sistemi, teras ve dusuk egimli catilarda su gecirimsizlik saglayan en kritik ince is sistemlerinden biridir. Disaridan bakildiginda yalin bir kaplama gibi gorunur; ancak gercekte alttaki egim, su tahliye noktasi, bindirme mantigi, parapet detaylari ve sonraki kullanim senaryosu ile birlikte calisan hassas bir katman zinciridir.",
      "Sahada en buyuk yanlis, su yalitimini yalniz membran rulosu ile ozdeslestirmektir. Oysa sistemin ariza verme potansiyeli ana yuzeyden cok detay dugumlerinde ortaya cikar. Suzgec cevresi, parapet dipleri, cihaz ayaklari, dilatasyon hatlari ve sonradan acilan gecisler membran catinin gercek sinav alanidir.",
      "Bir insaat muhendisi icin membran catiyi anlamak, sadece bindirme boyunu bilmek degil; suyu yuzeyde bekletmeden yonlendiren geometriyi, katman sirasini, koruma mantigini ve teslimden sonra gelecek bakim risklerini de gormek anlamina gelir. Membran yuzeye suyu tuttugu icin degil, dogru yere yonlendirdigi icin basarilidir.",
      "Bu yazida membran catiyi urun merkezli degil sistem merkezli bir bakisla; egim, detay, bindirme, koruma ve sayisal teras ornegi uzerinden daha derin bir rehber olarak ele aliyoruz.",
    ],
    theory: [
      "Membran catida teorik temel suyun beklememesi ve kritik dugumlerde kontrollu olarak uzaklastirilmasidir. Bu nedenle egim betonu, suzgec yerlesimi ve parapet donusleri sistemin kalbidir. Membran kaliteli olsa bile su ayni ceplerde uzun sure bekliyorsa yaslanma, bindirme zorlanmasi ve lokal sizinti riski hizla artar.",
      "Detay dugumleri sistemin zayif halkalaridir. Ana yuzeyde iki rulo arasindaki duz bindirme nispeten kolay kontrol edilirken; parapet dipleri, ic-dis koseler, suzgec cevresi, dilatasyon ve cihaz ayaklari daha yuksek teknik dikkat ister. Sahadaki pek cok sizinti burada, yani sistemin geometri degisen bolgelerinde baslar.",
      "Koruma ve sonraki kullanim da teorinin parcasidir. Membran uygulandiktan sonra ustunde dolasim olacaksa, cihaz montaji yapilacaksa veya mekanik bakim ekipleri duzenli cikacaksa membran tek basina korunamaz. Koruma katmani, yurutme yolu veya destek sistemi dusunulmezse iyi uygulanan su yalitimi sonraki kullanimla hasar gorebilir.",
      "TS EN 13707 bitumlu cati membranlarinin urun tarafini cerceveler; ancak sahadaki asil kalite, bu urunun egim ve detay sistemi icinde dogru yere oturtulmasiyla saglanir.",
    ],
    ruleTable: [
      {
        parameter: "Urun ve membran tipi",
        limitOrRequirement: "Cati kullanimina uygun takviyeli bitumlu membran tipi secilmelidir",
        reference: "TS EN 13707",
        note: "Her teras ve her maruziyet seviyesi ayni urunle cozulmez.",
      },
      {
        parameter: "Egim ve tahliye",
        limitOrRequirement: "Yuzey suyu belirlenen suzgec veya tahliye hattina kesintisiz egimle yonlendirilmelidir",
        reference: "TS 825 + cati detaylari",
        note: "Duz gorunen terasta bile su geometri ile yonetilir.",
      },
      {
        parameter: "Detay surekliligi",
        limitOrRequirement: "Parapet, kose, suzgec, dilatasyon ve gecis detaylari ozel detay olarak ele alinmalidir",
        reference: "Uygulama detay paftasi",
        note: "Arizalar cogu zaman duz yuzeyde degil dugumlerde baslar.",
      },
      {
        parameter: "Koruma ve sonraki kullanim",
        limitOrRequirement: "Membran, erken dolasim ve mekanik darbelere karsi uygun koruma ile teslim edilmelidir",
        reference: "Isletme ve bakim plani",
        note: "Korumasiz membran erken hasara aciktir.",
      },
    ],
    designOrApplicationSteps: [
      "Egim betonu, suzgec yeri ve parapet detaylarini membran uygulamasi oncesi sayisal olarak netlestir.",
      "Alt yuzeyi kuru, temiz, keskin cikintisiz ve bindirme icin uygun hale getir.",
      "Parapet, kose, suzgec ve cihaz ayagi gibi kritik dugumleri numune detayla once test et.",
      "Bindirme hatlarini ve katman sirasini uygulama boyunca ayni disiplinle surdur; yerde dogaclama cozum uretme.",
      "Membran tamamlandiktan sonra bakim-yuruyus ve koruma kararini da uygula; yuzeyi korumasiz kullanima acma.",
      "Teslim oncesi gollenme riski, detay zorlanmasi ve lokal ters egim icin butun terasi tekrar dolas.",
    ],
    criticalChecks: [
      "Suzgec kotu gercekten en dusuk nokta mi?",
      "Parapet dipleri ve koselerde acik kalan veya zorlanan bindirme var mi?",
      "Cihaz ayaklari ve gecisler sonradan yama gerektirecek sekilde mi cozulmus?",
      "Erken kullanima bagli darbe veya surtunme riski icin koruma yapildi mi?",
      "Teras yuzeyinde lokal ters egim veya su cebi olusturan dalga var mi?",
      "Detaylar ana yuzey kadar foto ve checklist ile denetlendi mi?",
    ],
    numericalExample: {
      title: "10 m terasta %2 egim icin kot ve detay yorumu",
      inputs: [
        { label: "Yuzey boyu", value: "10 m", note: "Tek yone suzgece akan hat" },
        { label: "Hedef egim", value: "%2", note: "Ornek saha kabul degeri" },
        { label: "Gerekli kot farki", value: "20 cm", note: "10 x 0,02" },
        { label: "Amac", value: "Gollenmesiz tahliye", note: "Membran omrunu korumak" },
      ],
      assumptions: [
        "Egim katmani membran oncesi uygulanmistir.",
        "Suzgec yeri sabittir ve parapet detaylari ayrica guclendirilecektir.",
        "Ara duzlem dalgalari lazer ile kontrol edilecektir.",
      ],
      steps: [
        {
          title: "Kot farkini hesapla",
          formula: "10 x 0,02 = 0,20 m",
          result: "Yaklasik 20 cm kot farki gerekir.",
          note: "Bu deger cati geometrisi icin minimum duzlem fikrini verir.",
        },
        {
          title: "Detay riskini ekle",
          result: "Ana yuzey egimi dogru olsa bile suzgec ve parapet detaylari hataliysa su yine lokal sorun cikarir.",
          note: "Membran catida ana yuzey kadar dugum noktasi da kritiktir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Membran basarisi, hesaplanan egimin detay dugumleriyle birlikte tum terasta kesintisiz calismasina baglidir.",
          note: "Yalniz ruloyu sermek degil, suyu yonetmek esastir.",
        },
      ],
      checks: [
        "Egim sahada nivo ile teyit edilmelidir.",
        "Suzgec cevresi lokal cukur veya ters egim birakmamalidir.",
        "Koruma ve bakim stratejisi membran uygulamasi kadar onemlidir.",
        "Detay noktalarinin testi ana yuzeyden ayri yapilmalidir.",
      ],
      engineeringComment: "Membran catida basari suyu durdurmakta degil, onu dogru yerden dogru hizla uzaklastirmaktadir.",
    },
    tools: SURFACE_TOOLS,
    equipmentAndMaterials: SURFACE_EQUIPMENT,
    mistakes: [
      { wrong: "Membrani tek basina cozum sanmak.", correct: "Egim, detay ve koruma katmaniyla birlikte degerlendirmek." },
      { wrong: "Suzgec kotunu saha sonunda ayarlamaya calismak.", correct: "En dusuk noktayi en bastan tanimlamak." },
      { wrong: "Parapet ve kose donuslerini ana yuzey kadar onemsememek.", correct: "Detay dugumlerini ayri numune ve ayri kontrol ile cozumlemek." },
      { wrong: "Membran tamamlanir tamamlanmaz korumasiz dolasima acmak.", correct: "Bakim ve kullanim senaryosuna uygun koruma uygulamak." },
      { wrong: "Sonradan gelen cihaz ayaklari icin yama cozumleri kabullenmek.", correct: "Gecis ve ayak rezervlerini bastan planlamak." },
      { wrong: "Teras kabulunu yalniz gorsel duzluk uzerinden yapmak.", correct: "Egim ve gollenme riskini sayisal olarak da denetlemek." },
    ],
    designVsField: [
      "Projede membran cati duz bir katman gibi gorunur; sahada ise suyun davranisini milimetrik detaylarla yoneten aktif bir sistemdir.",
      "Sorunlar cogu zaman ana yuzeyde degil detay dugumlerinde ortaya cikar; bu nedenle detay kalitesi ana metrajdan daha belirleyici olabilir.",
      "Iyi membran cati, uygulandigi gun degil ilk siddetli yagmur ve sonraki bakim donemlerinde kalitesini kanitlar.",
    ],
    conclusion: [
      "Membran cati sistemi, egim, detay, bindirme ve koruma zinciri birlikte kuruldugunda uzun omurlu su gecirimsizlik uretir. Bu zincirin herhangi bir halkasi zayiflarsa hata gec fark edilen ama pahali sonuclar veren bir sizinti senaryosuna donusebilir.",
      "Bir insaat muhendisi icin dogru bakis, membrani urun degil sistem olarak okumak ve en kritik kontrolu detay dugumlerinde yogunlastirmaktir.",
    ],
    sources: [...INCE_SURFACE_SOURCES, SOURCE_LEDGER.ts825, TS_EN_13707_SOURCE],
    keywords: ["membran cati", "TS EN 13707", "egim", "suzgec", "parapet detayi"],
    relatedPaths: ["ince-isler", "ince-isler/cati-kaplamasi", "kaba-insaat/cati-iskeleti"],
  },
  {
    slugPath: "ince-isler/zemin-kaplamalari/mermer-kaplama",
    kind: "topic",
    quote: "Mermer kaplama, pahali tasin kendisinden once alttaki geometri, parti secimi ve detay disiplini kadar iyi gorunur.",
    tip: "Dogal tas pahali diye sonuc da kendiliginden kaliteli olacak sanisi, ton farki, bosluklu yatak ve kose kirigi gibi pahali hatalar uretir.",
    intro: [
      "Mermer ve benzeri dogal tas kaplamalar; lobi, merdiven, sirkulasyon alani ve prestijli mekanlarda ilk bakista kalite hissi ureten bitislerdendir. Ancak bu kalite, tasin pahasindan veya parlakligindan once alt zeminin dogrulugu, parti seciminin bilincli yapilmasi ve detay dugumlerinin dikkatle kurulmasiyla saglanir.",
      "Dogal tas seramikten farkli olarak daha fazla varyasyon tasir. Damar yonu, ton, kalinlik ve yuzey dokusu ayni partide bile degisken olabilir. Bu nedenle mermer kaplamada metraj mantigi kadar secme-ayiklama ve yerde prova mantigi da vardir. Sahadaki iyi sonuc genellikle depoda veya numune alanda baslar.",
      "Bir insaat muhendisi icin mermer isi yalniz malzeme tedariki degildir. Alt yatak kalitesi, kose ve esik detaylari, merdiven burunlari, derz ritmi, kaymazlik gereksinimi ve sonradan olusabilecek ses veya kirik riski birlikte okunmalidir. Pahali malzeme, kotu altyapiyi gizleyemez.",
      "Bu yazida mermer kaplamayi; dogal tas mantigi, alt yuzey, parti yonetimi, detay dugumleri ve sayisal plaka planlama ornegi ile birlikte daha derin bir saha rehberi olarak ele aliyoruz.",
    ],
    theory: [
      "Dogal tas kaplamada performansin cekirdegi iki temel eksene dayanir: malzeme varyasyonu ve alt yatak surekliligi. Malzeme varyasyonu, her plakanin benzersiz oldugu anlamina gelir; bu nedenle ton ve damar devamliligi yerde prova olmadan guvence altina alinamaz. Alt yatak surekliligi ise tasin tamamiyla desteklenmesini ve noktasal bosluklarin olusmamasini gerektirir. Sert gorunen tas, bosluklu yatak uzerinde kirilgan hale gelir.",
      "Buyuk ebatli veya prestijli dogal taslarda geometri daha da kritik hale gelir. Alan boyunca aks kayarsa veya derz ritmi bozulursa goze ilk carpan kusur malzemenin kendisi degil yerlesim disiplini olur. Merdiven ve esik detaylari bu konuda ozellikle hassastir; cunku hem gorsel sureklilik hem kullanim guvenligi ayni anda beklenir.",
      "Yuzey islemi ve kullanim senaryosu da teorinin parcasi sayilir. Cilali yuzey lobide etkileyici gorunebilir; ancak islak, yogun trafik alaninda kaymazlik ve bakim acisindan baska kararlar gerekebilir. Bu nedenle dogal tas secimi yalniz mimari katalog kararina birakilmaz; mekan kullanimi ve temizlik-bakim gercegi ile birlikte degerlendirilir.",
      "TS EN 12058 dogal tas levhalarin doseme ve merdiven gibi uygulamalardaki teknik cercevesini verir. Sahadaki asil kalite ise bu urunlerin aks, parti, yatak ve detay disiplini ile birlestirilmesinde ortaya cikar.",
    ],
    ruleTable: [
      {
        parameter: "Urun ve boyutsal tolerans",
        limitOrRequirement: "Dogal tas plakalar uygulama oncesi ton, damar ve boyutsal tolerans acisindan ayiklanmalidir",
        reference: "TS EN 12058",
        note: "Dogal tas standart seramik gibi tamamen homojen kabul edilmez.",
      },
      {
        parameter: "Alt yatak ve destek",
        limitOrRequirement: "Tas alti yatak bosluksuz, duzgun ve tas ebatina uygun destek verecek sekilde kurulmalidir",
        reference: "Uygulama kalite plani",
        note: "Bosluklu yatak ses, kirik ve catlak riskini buyutur.",
      },
      {
        parameter: "Derz ve aks ritmi",
        limitOrRequirement: "Ana aks, derz ritmi, esik ve merdiven detaylari sistematik olarak planlanmalidir",
        reference: "Mahal detay paftasi",
        note: "Pahali tas kotu geometriyi gizlemez.",
      },
      {
        parameter: "Kullanim guvenligi ve yuzey secimi",
        limitOrRequirement: "Yuzey islemi ve burun detaylari mekanin trafik ve kaymazlik ihtiyacina uygun olmalidir",
        reference: "Planli Alanlar yaklasimi + mahal kullanim plani",
        note: "Gorsel karar ile kullanim karari ayni sey degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Malzeme partisini sahaya gelir gelmez ton, damar ve kalinlik farkina gore ayir; montaj sirasinda karar verme.",
      "Alt zemini mastar ve kot kontrolu ile dogal tas ebatina uygun hassasiyette hazirla.",
      "Lobi, koridor, esik ve merdiven gibi kritik alanlarda plakalari once yerde prova ederek aks ve damar ritmini test et.",
      "Yatak ve yapistirma cozumunu buyuk plakalarda bosluksuz destek saglayacak sekilde uygula; ses ve kirik riskini bastan azalt.",
      "Kose, esik, merdiven burunu ve duvar diplerini ana alandan ayri detay paketi olarak cozumle.",
      "Teslim oncesi ses, kot, derz ritmi ve yuzey surekliligini alan alan dolasarak kontrol et.",
    ],
    criticalChecks: [
      "Ton ve damar farklari istenmeyen yamali gorunum uretiyor mu?",
      "Tas altinda bosluk veya ses veren bolgeler var mi?",
      "Merdiven burunlari ve esik detaylari guvenli ve temiz mi?",
      "Derz ritmi ana aksa ve mekan simetrisine uygun mu?",
      "Parlatma veya yuzey islemi mekan kullanimina uygun secildi mi?",
      "Numune alanda gorulen kalite seri uygulamada korunabildi mi?",
    ],
    numericalExample: {
      title: "36 m2 lobi alaninda plaka planlama yorumu",
      inputs: [
        { label: "Alan", value: "36 m2", note: "6 m x 6 m kare lobi" },
        { label: "Ornek plaka olcusu", value: "60 x 60 cm", note: "Dogal tas modulu" },
        { label: "Teorik plaka adedi", value: "100 adet", note: "36 / 0,36" },
        { label: "Amac", value: "Kesim ve ton planini yonetmek", note: "Uygulama oncesi hazirlik" },
      ],
      assumptions: [
        "Alan simetrik ve ana aksa gore dosecektir.",
        "Taslar ayni partiden gelse de ton kontrolu yapilacaktir.",
        "Kesin adet secme ve fire payi ile artirilacaktir.",
      ],
      steps: [
        {
          title: "Teorik modulu hesapla",
          formula: "36 / 0,36 = 100",
          result: "Teorik olarak yaklasik 100 plaka gerekir.",
          note: "Dogal tas uygulamasinda teori kadar secme ve ayiklama payi da gereklidir.",
        },
        {
          title: "Parti ve dizim etkisini ekle",
          result: "100 plaka fiziksel olarak yeterli gorunse de yerde prova yapilmadan ton ve damar dagilimi dengeli kurulamaz.",
          note: "Dogal tas kaplamada sayi kadar dizim kalitesi de sonucu belirler.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Mermer kaplamada planlama, yalniz metraj degil; secme, aks ve detay disiplinini de kapsar.",
          note: "Prestijli gorunum, montaj oncesi organizasyon ile kazanilir.",
        },
      ],
      checks: [
        "Dogal tas fire ve secme payi standart kaplamalara gore daha dikkatli yonetilmelidir.",
        "Yerde prova yapilmadan kritik alan montajina gecilmemelidir.",
        "Merdiven ve esik gibi ozel bolgeler ana alandan ayri planlanmalidir.",
        "Alt yatak kalitesi numune alanda test edilmelidir.",
      ],
      engineeringComment: "Dogal tasin pahasi sonucu garanti etmez; onu degerli gosteren dogru dizim ve dogru tasiyici disiplinidir.",
    },
    tools: SURFACE_TOOLS,
    equipmentAndMaterials: SURFACE_EQUIPMENT,
    mistakes: [
      { wrong: "Taslari paketlerden gelisiguzel cikarip dosemek.", correct: "Ton ve damar kontrolu ile planli dizim yapmak." },
      { wrong: "Bosluklu yatagi kabul etmek.", correct: "Dogal tas altinda tam destek saglamak." },
      { wrong: "Merdiven ve esik detaylarini ana alan kadar onemsememek.", correct: "Bu bolgeleri ayri teknik detay olarak cozumlemek." },
      { wrong: "Yuzey islemine yalniz estetik acidan bakmak.", correct: "Kaymazlik ve kullanim yogunlugunu da secime dahil etmek." },
      { wrong: "Seri uygulamaya numune alan gormeden gecmek.", correct: "Temsil kabiliyeti yuksek numune alanla kaliteyi bastan gormek." },
      { wrong: "Teslimde sadece gorunur parlakliga bakmak.", correct: "Ses, kot, derz ritmi ve detay kalitesini birlikte kontrol etmek." },
    ],
    designVsField: [
      "Projede mermer kaplama bir malzeme kodu gibi durur; sahada ise parti secimi, aks ritmi, detay ve tasiyici altlik kararlarinin toplam sonucuna donusur.",
      "Pahali malzeme saha disiplini yerine gecmez; tersine hata yapildiginda maliyeti daha buyuk hale getirir.",
      "Iyi dogal tas uygulamasi, ilk bakista zengin gorundugu kadar aylar sonra ses yapmadigi ve kirik uretmedigi icin de degerlidir.",
    ],
    conclusion: [
      "Mermer kaplama, dogal tasin kendisinden once alt yatak, parti secimi, derz ritmi ve detay disiplini ile kalite ureten bir sistemdir. Bu halkalar dogru kuruldugunda prestijli ve uzun omurlu sonuc verir.",
      "Bir insaat muhendisi icin en saglam yaklasim, mermeri dekoratif kalem degil; geometri ve tasiyici kalite isteyen teknik bir bitis isciligi olarak gormektir.",
    ],
    sources: [...INCE_SURFACE_SOURCES, SOURCE_LEDGER.planliAlanlar, TS_EN_12058_SOURCE],
    keywords: ["mermer kaplama", "dogal tas", "TS EN 12058", "derz ritmi", "alt yatak"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
];
