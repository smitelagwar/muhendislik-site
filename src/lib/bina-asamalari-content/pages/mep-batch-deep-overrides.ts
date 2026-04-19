import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const MEP_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];

const ELEKTRIK_IC_TESISLERI_SOURCE: BinaGuideSource = {
  title: "Elektrik İç Tesisleri Yonetmeligi",
  shortCode: "Elektrik İç Tesisleri Yonetmeligi",
  type: "regulation",
  url: "https://www.mevzuat.gov.tr/",
  note: "Pano, dağıtım duzeni, koruma ve iç tesislerde temel emniyet kurallari için resmi mevzuat eksenidir.",
};

const TS_EN_1264_SOURCE: BinaGuideSource = {
  title: "TS EN 1264 Su Bazli Yerden Isitma ve Serinletme Sistemleri",
  shortCode: "TS EN 1264",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Yerden isitma devreleri, yüzey sicakligi, boru araligi ve performans yorumlari için temel standartlardan biridir.",
};

const ELECTRICAL_TOOLS: BinaGuideTool[] = [
  { category: "Proje", name: "Tek hat semasi, yuk listesi ve pano etiket plani", purpose: "Panoyu yalnız kutu olarak degil, butun elektrik dağıtım omurgasi olarak okumak." },
  { category: "Ölçüm", name: "Multimetre, izolasyon test cihazi ve termal kamera", purpose: "Gerilim, izolasyon ve dengesiz isinma risklerini teslim öncesi yakalamak." },
  { category: "Kontrol", name: "Kablo numaralandirma ve koruma koordinasyon cizelgesi", purpose: "Sigorta, kesit ve hat isimlerinin sahada karismasini onlemek." },
  { category: "Kayıt", name: "Devreye alma formu ve as-built pano listesi", purpose: "Sahadaki nihai panoyu isletme ekibi için okunabilir hale getirmek." },
];

const FLOOR_HEATING_TOOLS: BinaGuideTool[] = [
  { category: "Tasarim", name: "Devre boyu ve mahal isi kaybi tablosu", purpose: "Yerden isitma boru araligini ve devre dagilimini kullanım senaryosuna göre kurmak." },
  { category: "Saha", name: "Kollektor plani, boru serim krokisi ve devre etiketleri", purpose: "Sahada devrelerin birbirine karismadan izlenmesini saglamak." },
  { category: "Test", name: "Basinc test pompasi, manometre ve debi ayar seti", purpose: "Sap, serap ve kaplama öncesi sistemin sızdırmazlık ve dengelemesini teyit etmek." },
  { category: "Kayıt", name: "Termal kamera ve devre devre teslim formu", purpose: "Zemin kaplamasi altinda kalan sistemin sonradan okunabilirligini korumak." },
];

const ELECTRICAL_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Pano govdesi", name: "Sac pano, bara sistemi, DIN ray ve klemensler", purpose: "Dağıtım elemanlarini bosluksuz ve servis verilebilir bir kabin icinde toplamak.", phase: "Montaj" },
  { group: "Koruma", name: "Sigorta, kacis koruma roleleri, parafudr ve ana kesici", purpose: "Yuku sadece dagitmak degil, ariza ve insan emniyetine karsi korumak.", phase: "Enerjilendirme öncesi" },
  { group: "Kablolama", name: "Pabuclu iletkenler, kablo kanali, kablo baglari ve etiketler", purpose: "Hatlari karisik demet yerine izlenebilir devreler halinde tutmak.", phase: "İç baglantilar" },
  { group: "Kontrol", name: "Ölçüm cihazlari ve devreye alma dokumani", purpose: "Panonun yalnız kapatilmis degil test edilmis olmasini saglamak.", phase: "Teslim" },
];

const FLOOR_HEATING_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dağıtım", name: "Kollektor, debimetre, vana ve dolap seti", purpose: "Devreleri dengelemek ve ileride mudahale edilebilir bir merkez olusturmak.", phase: "Kollektor montaji" },
  { group: "Hat", name: "PEX veya benzeri isitma borusu, kenar bandi ve tespit elemanlari", purpose: "Boru geometri ve termal hareketini sap alti icinde kontrollu tutmak.", phase: "Serim" },
  { group: "Alt katman", name: "Isi yalitimi, folyo veya sistem paneli", purpose: "Isinin asagi kacmasini azaltip yukari yonlu performansi desteklemek.", phase: "Hazirlik" },
  { group: "Test", name: "Basinc test pompasi, manometre ve dengeleme anahtarlari", purpose: "Kaplama altinda kalacak devrelerin sızdırmazlık ve denge kontrolunu yapmak.", phase: "Sap öncesi ve teslim" },
];

export const mepBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "tesisat-isleri/elektrik-tesisati/pano-montaj",
    kind: "topic",
    quote: "Pano montaji, bir kutuya sigorta dizmek degil; yapinin elektrik dağıtım mantigini okunur, guvenli ve servis verilebilir hale getirmektir.",
    tip: "Panoyu duvara sabitlenmis bir dolap gibi gormek, kablo girisleri, termal davranis, etiketleme ve koruma koordinasyonu gibi asil muhendislik katmanlarini bos birakir.",
    intro: [
      "Elektrik panosu binanin sinir sistemi gibidir. Kablolar duvarlarda kaybolur, aydinlatma armaturlari tavanda asili durur, prizler ve cihazlar kullanım yuzeyine dagilir; fakat tüm bu dagitimin anlamli ve guvenli bicimde yonetildigi merkez panodur. Bu nedenle pano montaji santiyede yalnız elektrik ustasinin isi gibi okunmamali, insaat muhendisinin de genel koordinasyon, yangin, erişim ve teslim kalitesi acisindan tanimasi gereken temel bir imalat olarak gorulmelidir.",
      "Sahada pano ile ilgili tipik problemler estetikten once emniyet uretir. Yanlış kotta monte edilen pano, acil durumda erisimi zorlastirir. Yetersiz bukme yaricapiyla giren kablolar terminal zorlanmasi yaratir. Etiketsiz bir devre, ariza aninda doğru hattin bulunmasini geciktirir. Faz dagilimi dengesiz veya gevsek torklu baglantilar ise sessizce isinip daha buyuk arizalara zemin hazirlar.",
      "Bir insaat muhendisi için pano montajini bilmek, butun koruma hesabini tek basina yapmak anlamina gelmez. Ancak pano yerinin niye o noktaya kondugunu, kapaigin neden engelsiz acilmasi gerektigini, neden kablo tavasi ile pano girisinin once koordine edilmesi gerektigini ve neden teslim öncesi termal kontrol yapildigini kavramak anlamina gelir. Bu bilgi, sahadaki disiplinler arasi aksakliklari çok daha erken yakalatir.",
      "Bu yazida pano montajini; teorik dağıtım mantigi, mevzuat cercevesi, sayisal faz yuk yorumu, kullanilan araçlar ve sahadaki sık hatalarla birlikte tam bir blog yazisi niteliginde ele aliyoruz. Hedef, yalnız pano takmayi degil; panoyu bina isletmesinin guvenli merkezi olarak okumayi gostermektir.",
    ],
    theory: [
      "Pano montajinin teorik temeli, dağıtım ve korumayi aynı kabin icinde bir araya getirmektir. Ana besleme panoya gelir, burada ana kesici, koruma elemanlari ve dağıtım bilesenleri araciligiyla alt devrelere ayrilir. Fakat bu ayrim yalnız elektriksel bir konu degildir; kablo bukulme yaricapi, isletme için bosluk, isi birikimi, mekanik koruma ve erişim kalitesi de aynı tasarimin parçası olur. Dolayisiyla pano montaji yalnız bağlantı degil, kabin icindeki davranisin duzenlenmesidir.",
      "Koruma koordinasyonu pano için kritik bir kavramdir. Bir ariza oldugunda sadece ilgili devrenin devreden cikmasi, tüm yapinin kararmamasindan daha degerlidir. Bunun için ana kesici, alt devre sigortalari, kacis akim koruma roleri ve parafudr gibi elemanlar yalnız listede bulunmamalidir; birbirini tamamlayan hiyerarsiyle kurgulanmalidir. Sahada rastgele eklenen bir sigorta, bu koordinasyonu bozabilir.",
      "Pano montajinda fiziksel geometri de en az elektriksel kurgu kadar onemlidir. Kablo tavalarinin giriş yonu, pano alt veya üst rezerv bosluklari, bakım sirasinda kapaigin tam acilabilmesi, onunde minumum çalışma alani bulunmasi ve nemli mahallerle iliskisi teslim kalitesini doğrudan etkiler. Bir pano teknik olarak doğru elemanlari tasisa bile yanlış yerde veya sikisik montajla kurulursa ariza ve servis sureclerinde ciddi zaman kaybi yaratir.",
      "Ayrıca pano bir defalik montaj urunu degildir. Isletme boyunca yeni devre ekleme, ariza tespiti, termal kontrol, sigorta degisimi ve etiket takibi gibi sureclerde tekrar tekrar acilir. Bu nedenle duzenli kablo baglama, okunur numaralandirma ve temiz iç yerlesim yalnız estetik degil; isletme muhendisliginin temel gerekliligidir.",
      "Bu bakisla pano montaji; duvara asilan bir ekipman degil, binanin elektrik altyapisini acikca okunur hale getiren teknik bir arayuzdur. Iyi pano montaji sessiz calisir, kolay okunur, acil durumda hızlı mudahale edilir ve teslimden sonra binanin teknik ekibine sorun degil kolaylik uretir.",
    ],
    ruleTable: [
      {
        parameter: "Koruma ve devre duzeni",
        limitOrRequirement: "Pano icindeki koruma elemanlari, devre ayrimi ve etiketleme hiyerarsik ve okunur olmalidir",
        reference: "TS HD 60364",
        note: "Ariza halinde tüm yapinin degil ilgili devrenin devreden cikmasi hedeflenir.",
      },
      {
        parameter: "Pano yeri ve erişim",
        limitOrRequirement: "Pano onunde çalışma ve mudahale için engelsiz alan birakilmali, kapak tam acilabilmelidir",
        reference: "Elektrik İç Tesisleri Yonetmeligi",
        note: "Pano onune sabit dolap, tesisat veya dekoratif panel gelmesi servis kalitesini bozar.",
      },
      {
        parameter: "Kablo girisi ve mekanik koruma",
        limitOrRequirement: "Kablo girisleri duzenli, keskin kenarlardan korunmus ve bukme yaricapina uygun olmalidir",
        reference: "TS HD 60364",
        note: "Mekanik zorlanan kablo sonradan ariza ve isinma riski uretir.",
      },
      {
        parameter: "Topraklama ve espotansiyel bağlantı",
        limitOrRequirement: "Pano govdesi, baralar ve ilgili metal kisimlar koruma sistemine uygun baglanmalidir",
        reference: "TS HD 60364 + Elektrik İç Tesisleri Yonetmeligi",
        note: "Pano metal bir kutu degil, koruma zincirinin aktif bir elemanidir.",
      },
      {
        parameter: "Devreye alma ve test",
        limitOrRequirement: "Montaj sonrasi izolasyon, sureklilik, faz sirasi ve termal davranis kontrol edilmelidir",
        reference: "Teslim kalite plani",
        note: "Kapanmis kapak test edilmis pano anlamina gelmez.",
      },
    ],
    designOrApplicationSteps: [
      "Tek hat semasi, yuk listesi ve pano etiket planini saha montajindan once netlestir; panoyu son anda devre eklenen bir kutuya donusturme.",
      "Pano yerini mimari, yangin ve mekanik disiplinlerle birlikte kontrol et; kapak acilimi, on bosluk ve kablo giriş yonlerini sahada isaretle.",
      "Govde montajini duseylik ve kot kontroluyle yap; panonun yamuk ya da darbe altinda montaji iç duzeni de zorlar.",
      "Kablo girislerini numarali ve gruplu ilerlet; faz, nortr, PE ve kontrol kablolarini karismayacak duzende ayir.",
      "Koruma elemanlarini tek hat mantigina göre yerlestirip tork, etiket ve terminal kontrolunu yap.",
      "Enerjilendirme öncesi izolasyon, fonksiyon ve termal testleri uygulayip sonucu as-built pano listesine isle.",
    ],
    criticalChecks: [
      "Pano onunde acil durumda rahat mudahale edilecek engelsiz alan var mi?",
      "Kablo girisleri keskin kenar, asiri bukulme veya fazladan gerginlik uretir durumda mi?",
      "Sigorta, role ve kesicilerin etiketleri devreleri sahada net bicimde tarif ediyor mu?",
      "Pano icinde faz dagilimi dengesiz veya belirgin isitma riski gosteren bir duzen var mi?",
      "Topraklama ve PE iletkenleri okunur ve surekli bağlantı sunuyor mu?",
      "Enerjilendirme sonrasi termal kamera veya benzeri olcumle gevs eklem kontrol edildi mi?",
    ],
    numericalExample: {
      title: "Uc fazli bir panoda faz dagilimi yorumu",
      inputs: [
        { label: "Faz L1 yuk toplami", value: "18 kW", note: "Aydinlatma ve bir kisim priz devreleri" },
        { label: "Faz L2 yuk toplami", value: "12 kW", note: "Mekanik destek ve genel guc devreleri" },
        { label: "Faz L3 yuk toplami", value: "10 kW", note: "Kalan priz ve yardimci devreler" },
        { label: "Amac", value: "Faz dengesizligini erken yorumlamak", note: "Nihai elektrik projesi hesabinin yerine gecmez" },
      ],
      assumptions: [
        "Yukler karakter olarak benzer kabul edilmis, guc faktor farklari hesaba katilmamistir.",
        "Pano anahtarlama ve koruma elemanlari doğru secilmis kabul edilmistir.",
        "Bu hesap saha yorumuna yonelik basit bir denge kontroludur.",
      ],
      steps: [
        {
          title: "Toplam ve ortalama yukleri bul",
          formula: "(18 + 12 + 10) / 3 = 13,3 kW",
          result: "Uc faz için ortalama yuk yaklasik 13,3 kW olmalidir.",
          note: "Her fazin buna yakin olmasi dağıtım kalitesini artirir.",
        },
        {
          title: "En yuksek sapmayi yorumla",
          formula: "18 - 13,3 = 4,7 kW",
          result: "L1 fazi ortalamadan yaklasik 4,7 kW yuksektir ve belirgin dengesizlik gostermektedir.",
          note: "Bu fark panoda asimetrik isinma ve daha zor koruma koordinasyonu yaratabilir.",
        },
        {
          title: "Saha kararini bagla",
          result: "Devrelerin fazlara yeniden dagitilmasi veya buyuk tuketicilerin farkli fazla eslestirilmesi gerekir.",
          note: "Pano iç duzeni yalnız sirali sigorta dizmek degil, yuk mantigini da dengeli kurmaktir.",
        },
      ],
      checks: [
        "Faz dagilimi kontrolu yalnız tasarim tablosunda degil enerjilendirme sonrasi da gözden gecirilmelidir.",
        "Dengesiz yukler bara ve terminallerde farkli isinma uretir; termal kontrol bu nedenle onemlidir.",
        "Buyuk tekil tuketiciler sonradan eklendi ise pano etiket ve as-built listesi guncellenmelidir.",
        "Kagit uzerindeki doğru dağıtım, sahadaki yanlış bağlantı ile bozulabilir.",
      ],
      engineeringComment: "Pano montajinda en pahali hata, arizayi cagiracak dengesizligi kapagin arkasinda saklamaktir.",
    },
    tools: ELECTRICAL_TOOLS,
    equipmentAndMaterials: ELECTRICAL_EQUIPMENT,
    mistakes: [
      { wrong: "Panoyu mimari bosluk kaldi diye rastgele bir noktaya yerlestirmek.", correct: "Erişim, yangin ve kablo lojistigini birlikte degerlendirerek yer secmek." },
      { wrong: "Kablo girislerini etiketlemeden ve gruplanmadan panoya doldurmak.", correct: "Hatlari numarali, kategorili ve servis verilebilir duzende toplamak." },
      { wrong: "Tork ve terminal kontrolunu göz karariyla gecmek.", correct: "Baglantilari test ve termal kontrol ile teyit etmek." },
      { wrong: "Pano icini estetik gorunsun diye fazladan sikistirmak.", correct: "Bakım ve havalanma boslugunu koruyan yerlesim yapmak." },
      { wrong: "Faz dagilimini sadece proje onayi asamasinda dusunmek.", correct: "Sahadaki nihai devre baglantilarina göre tekrar kontrol etmek." },
      { wrong: "As-built pano listesi ve etiketlemeyi teslim sonrasina birakmak.", correct: "Devreye alma ile aynı anda guncel kayıt olusturmak." },
    ],
    designVsField: [
      "Projede pano tek hat semasi olarak görünür; sahada ise bu sema kablo girisi, mekanik bosluk, tork ve etiket kalitesiyle gercege donusur.",
      "Iyi pano montaji sessiz calisir ve ariza aninda teknisyene zaman kazandirir; kötü pano montaji ise her mudahaleyi riskli hale getirir.",
      "Bu nedenle pano kalitesi, kutunun duz durmasindan çok, icerideki dağıtım mantiginin okunabilir olmasiyla olculur.",
    ],
    conclusion: [
      "Pano montaji doğru yapildiginda binanin elektrik dagitimini guvenli, okunur ve servis verilebilir hale getirir. Bu sayede ariza aninda mudahale hizlanir, teslim kalitesi artar ve isletme boyunca sessiz bir güvenlik zemini olusur.",
      "Bir insaat muhendisi için en doğru bakis, panoyu elektrikcinin kapak arkasi isi degil; koordinasyon, emniyet ve isletme kalitesinin merkezi olarak gormektir.",
    ],
    sources: [...MEP_BATCH_SOURCES, SOURCE_LEDGER.tsHd60364, SOURCE_LEDGER.yanginYonetmeligi, ELEKTRIK_IC_TESISLERI_SOURCE],
    keywords: ["pano montaji", "elektrik panosu", "TS HD 60364", "koruma koordinasyonu", "faz dengesi"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/elektrik-tesisati", "proje-hazirlik/elektrik-projesi"],
  },
  {
    slugPath: "tesisat-isleri/isitma-sogutma/yerden-isitma",
    kind: "topic",
    quote: "Yerden isitma, zeminin altina boru gommek degil; konforu, enerji verimini ve zemin kaplamasi davranisini aynı anda yoneten düşük sicaklikli bir sistem kurmaktir.",
    tip: "Yerden isitmada en sık hata, boru serimini tesisat isi sanip sap, yalitim, devre boyu ve zemin kaplamasi kararlarini birbirinden koparmaktir.",
    intro: [
      "Yerden isitma sistemleri son yillarda konut, ofis ve nitelikli ticari yapilarda daha sık tercih edilir hale geldi. Bunun temel nedeni yalnız ayak altinda sıcaklık hissi degil; düşük kazan sicakliginda calisabilmesi, hacim icinde daha homojen sıcaklık dagilimi saglamasi ve doğru kuruldugunda enerji verimliligine katkida bulunmasidir. Ancak sistemin iyi calismasi boru makarasinin santiyeye gelmesiyle degil, altyapi katmanlarinin birlikte doğru kurulmasiyla mumkundur.",
      "Sahadaki tipik sorunlar, sistemin gorunmeyen bir imalat olmasindan kaynaklanir. Boru serimi biter, sap atilir, kaplama kapanir ve artik hata gormek zorlasir. Yetersiz yalitim, asiri uzun devre, etiketsiz kollektor, basincsiz sap dokumu veya zemin kaplamasina uygun olmayan devre araligi gibi hatalar teslimden sonra gec isinan odalar, dengesiz konfor ya da gereksiz enerji tuketimi olarak ortaya cikar.",
      "Bir insaat muhendisi için yerden isitma yalnız mekanik ekipman montaji degildir. Sap kalinligi, dilatasyon, kenar bandi, zemin kaplamasi, kollektor yeri ve mahal bazli kullanım farklari birlikte ele alinmalidir. Cunku sistemin en iyi borusu bile yanlış sap ve yanlış kaplama altinda potansiyelini kullanamaz.",
      "Bu yazida yerden isitmayi; teorik isitma mantigi, standart ve enerji ekseni, sayisal devre boyu yorumu, saha araclari ve sık yapilan hatalarla birlikte daha derin bir blog yazisi olarak ele aliyoruz. Hedef, sistemi yalnız boru serimi olarak degil, zemin icindeki koordineli bir muhendislik paketi olarak gormektir.",
    ],
    theory: [
      "Yerden isitmanin teorik temeli, düşük sicaklikli suyun genis yuzeye yayilmis borular araciligiyla sap ve zemin kaplamasi uzerinden mekana isi vermesidir. Radyatorde oldugu gibi noktasal yuksek sıcaklık yerine, buyuk alanli daha yumusak bir isi yayilimi soz konusudur. Bu nedenle konu yalnız kazan cikis sicakligi degil; boru araligi, sap iletkenligi, kaplama direnci ve mahal isi kaybinin birlikte yorumlanmasidir.",
      "Devre boyu bu sistemde kritik rol oynar. Çok uzun devreler basinc kaybini ve devrenin sonundaki sıcaklık dususunu artirir. Çok kısa ve dengesiz devreler ise kollektor üzerinde ayar zorlugu uretir. Bu nedenle her mahali tek parca gecmek pratik gibi gorunse de her zaman doğru olmaz. Odalarin alani, cephe maruziyeti ve mobilya yerlesimi dikkate alinmadan serilen boru, konforu homojen dagitamaz.",
      "Alt katmandaki isi yalitimi ve kenar bandi da performans için belirleyicidir. Yalitim olmadiginda isi asagi ve yanal yone kacar, sistemin verimi duser. Kenar bandi ve dilatasyon cozulmediginde ise sap genlesme davranisi sorun uretir; kaplama ustunde catlak veya ayrisma olarak geri donebilir. Dolayisiyla yerden isitma sadece mekanik degil, ince iş ve sap disipliniyle de ortak imalattir.",
      "Zemin kaplamasi secimi de isi geçiş performansini etkiler. Seramik, dogal tas, lamine parke veya vinyl kaplamalarin isi direnci farklidir. Bu nedenle aynı boru araligi ve aynı su sicakligi her mahalde aynı sonucu vermez. Iyi tasarlanmis yerden isitma, kaplama kararini mekanik dosyadan ayri dusunmez.",
      "Son olarak devreye alma ve dengeleme asamasi unutulmamalidir. Serilen borular ne kadar iyi olursa olsun kollektor ayari ve basinc testi doğru yapilmadan sistem teslim edilirse odalar arasinda ciddi konfor farklari kalabilir. Bu nedenle yerden isitma, kaplama altinda kaybolan bir imalat degil; teslim sonrasi performansi ancak doğru test ile teyit edilen bir konfor sistemidir.",
    ],
    ruleTable: [
      {
        parameter: "Yüzey sicakligi ve performans mantigi",
        limitOrRequirement: "Sistem konfor ve performans gereksinimlerini mahal kullanimina uygun yüzey davranisiyla saglamalidir",
        reference: "TS EN 1264",
        note: "Yerden isitma konforu yalnız kazan sicakligi ile degil, zemin yüzey davranisiyla degerlendirilir.",
      },
      {
        parameter: "Isi yalitimi ve alt katman",
        limitOrRequirement: "Boru alti yalitim ve çevre bantlari isi kaybini azaltacak sureklilikte kurulmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Asagi kacan isi, sistem veriminden doğrudan kayip demektir.",
      },
      {
        parameter: "Devre boyu ve dengeleme",
        limitOrRequirement: "Devreler benzer hidrolik davranis gosterecek sekilde planlanmali ve kollektorde dengelenmelidir",
        reference: "TS EN 1264",
        note: "Aynı kattaki odalarin farkli isinmasi genelde burada baslar.",
      },
      {
        parameter: "Sap ve dilatasyon uyumu",
        limitOrRequirement: "Sap kalinligi, dilatasyon detaylari ve kenar bantlari termal hareketi absorbe edecek sekilde korunmalidir",
        reference: "Uygulama kalite plani",
        note: "Mekanik sistem kaplama catlagi olarak geri donebilir.",
      },
      {
        parameter: "Basinc testi ve teslim",
        limitOrRequirement: "Boru serimi sonrasi ve sap öncesi sistem basinc altinda test edilmelidir",
        reference: "Teslim ve test disiplini",
        note: "Kaplama altinda kalacak bir hattin sonradan bulunmasi pahali ve yikici olur.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal bazli isi kaybi, zemin kaplamasi ve kullanım senaryosuna göre boru araligi ile devre sayisini belirle.",
      "Kollektor yerini ulasilabilir, dengeli dağıtım sunan ve dolapla kapanmayacak bir noktada kilitle.",
      "Boru alti yalitim, folyo veya sistem panelini kesintisiz ser; kenar bandini tüm çevre boyunca surdur.",
      "Devreleri etiketli ve planli ser; donus ve gidis hatlarini sap dokumu öncesi tekrar kontrol et.",
      "Basinc testini devreler dolu ve izlenebilir durumdayken uygula; sap dokumunu basincsiz hatta yaptirma.",
      "Kaplama öncesi dengeleme ve ilk calistirma senaryosunu yazili kayda baglayarak isletmeye devret.",
    ],
    criticalChecks: [
      "Boru alti yalitim ve kenar bantlari tüm yuzeyde kopuksuz devam ediyor mu?",
      "Kollektordeki devreler etiketli ve hangi mahali besledigi net mi?",
      "Asiri uzun veya dengesiz devreler aynı kollektorde toplanmis mi?",
      "Sap öncesi sistem basinc altinda tutulup sızdırmazlık gozlemlenmis mi?",
      "Dilatasyon detaylari genis alanlarda unutulmus mu?",
      "Zemin kaplamasi secimi mekanik performansla birlikte tekrar degerlendirilmis mi?",
    ],
    numericalExample: {
      title: "24 m2 bir mahal için devre sayisi yorumu",
      inputs: [
        { label: "Mahal alani", value: "24 m2", note: "Salon veya genis oda ornegi" },
        { label: "Boru araligi", value: "15 cm", note: "Ornek konfor araligi" },
        { label: "Tahmini boru ihtiyaci", value: "yaklasik 160 m", note: "Alan, donusler ve çevre etkisiyle kabaca yorum" },
        { label: "Hedef devre boyu", value: "80 m civari", note: "Dengelemeyi kolaylastiran ogretici deger" },
      ],
      assumptions: [
        "Mahalin isi kaybi ve cephe maruziyeti olagan kabul edilmistir.",
        "Mobilya sabit alanlari sinirli oldugu varsayilmistir.",
        "Hesap kavramsal devre sayisi yorumudur; nihai proje hesabinin yerine gecmez.",
      ],
      steps: [
        {
          title: "Toplam boru ihtiyacini devre boyuyla karsilastir",
          formula: "160 / 80 = 2",
          result: "Bu mahali iki devreye bolmek hidrolik denge acisindan daha okunur bir başlangıç sunar.",
          note: "Tek devre ile gecmek basinc kaybi ve son kisimda isi dususu riski yaratabilir.",
        },
        {
          title: "Kollektor etkisini yorumla",
          result: "Iki yakin uzunluktaki devre, kollektorde debi ayarini ve oda konforunu daha kolay dengeler.",
          note: "Çok farkli boydaki devreler aynı mahalde homojenlik sorununa yol acabilir.",
        },
        {
          title: "Saha sonucunu bagla",
          result: "Yerden isitmada oda buyudukce yalnız daha uzun boru degil, daha dengeli devre organizasyonu dusunulmelidir.",
          note: "Boru makarasini tek parcada serip cikmak hızlı gorunse de doğru cozum olmayabilir.",
        },
      ],
      checks: [
        "Devre boyu yorumu mahal isi kaybi ve kaplama tipine göre revize edilmelidir.",
        "Kollektor kapasitesi ve dolap yeri devre sayisi ile birlikte degerlendirilmelidir.",
        "Basinc testi devreler ayrik izlenebilirken yapilmalidir.",
        "Sap ve kaplama ekipleri mekanik devre planini okuyabilecek netlige sahip olmalidir.",
      ],
      engineeringComment: "Yerden isitmada konfor, zemine ne kadar boru koydugunuzla degil o boruyu ne kadar dengeli yonettiginizle olculur.",
    },
    tools: FLOOR_HEATING_TOOLS,
    equipmentAndMaterials: FLOOR_HEATING_EQUIPMENT,
    mistakes: [
      { wrong: "Boru serimini yalitim ve sap ekiplerinden kopuk yurutmek.", correct: "Alt katman, boru, sap ve kaplamayi tek sistem olarak koordine etmek." },
      { wrong: "Devreleri etiketsiz ve plansiz birakmak.", correct: "Her devreyi kollektorde mahal bazli tanimlayip kayda baglamak." },
      { wrong: "Basinc testini yuzeysel yapip sap dokumunu hizlandirmak.", correct: "Kaplama altinda kalacak hattin testini ciddiyetle uygulamak." },
      { wrong: "Kollektor dolabini mobilya veya dar dolasim icinde gizlemek.", correct: "Bakım ve dengeleme için erişilebilir bir noktada konumlandirmak." },
      { wrong: "Tüm mahallerde aynı boru araligini varsaymak.", correct: "Cephe, kullanım ve kaplama farkina göre mahal bazli yorum yapmak." },
      { wrong: "Dilatasyon ve kenar bantlarini ikincil gormek.", correct: "Termal hareketin kaplama ustunde sorun yaratmamasini saglamak." },
    ],
    designVsField: [
      "Projede yerden isitma duz serpantinler gibi görünür; sahada ise bu serpantinlerin altindaki yalitim, ustundeki sap ve nihai kaplama performansi belirler.",
      "Iyi kurulan sistem görünmez ama hissedilir; kötü kurulan sistem ise gec isinma, dengesiz oda sicakligi ve kaplama sikayeti olarak geri doner.",
      "Bu nedenle yerden isitma, tesisat ile ince islerin tam ortasinda duran koordinasyon yoğun bir muhendislik sistemidir.",
    ],
    conclusion: [
      "Yerden isitma doğru devre boyu, doğru yalitim, doğru sap ve doğru dengeleme ile kuruldugunda yuksek konforu düşük sicaklikta sunan verimli bir sistem haline gelir. Bu halkalardan biri eksik oldugunda hata kaplama altinda gizlenir ama kullanıcı deneyiminde hemen ortaya cikar.",
      "Bir insaat muhendisi için en saglam yaklasim, yerden isitmayi yalnız boru serimi degil; zemin altinda çalışan, mekanik ve ince isi aynı cizgide bulusturan teknik bir paket olarak gormektir.",
    ],
    sources: [...MEP_BATCH_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, TS_EN_1264_SOURCE],
    keywords: ["yerden isitma", "TS EN 1264", "kollektor", "sap alti boru", "devre dengeleme"],
    relatedPaths: ["tesisat-isleri", "tesisat-isleri/isitma-sogutma", "tesisat-isleri/klima-tesisat"],
  },
];
