import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const INCE_DEEP_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const FINISH_TOOLS: BinaGuideTool[] = [
  { category: "Ölçüm", name: "CM nem olcer, mastar ve lazer nivo", purpose: "Kaplama veya duvar kagidi öncesi alt yüzey nemi ve duzlemini sayisal olarak dogrulamak." },
  { category: "Detay", name: "Mahal bitis paftalari ve numune panel seti", purpose: "Esik, süpürgelik, duvar bitisi ve desen kararlarini uygulama öncesi netlestirmek." },
  { category: "Kontrol", name: "Kuruma, deneme alani ve teslim cizelgesi", purpose: "Kaplama öncesi hazirlik ile teslim sonrasi korumayi veriyle izlemek." },
  { category: "Kayıt", name: "Mahal bazli kalite ve kusur foyi", purpose: "Yüzey dalgasi, derz, desen ve koruma notlarini alan bazinda arsivlemek." },
];

const FINISH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Astar, tesviye, macun ve yüzey duzeltme malzemeleri", purpose: "Alt sistemi kaplama veya duvar kagidi tasiyacak homojen seviyeye getirmek.", phase: "Hazirlik" },
  { group: "Kaplama", name: "Laminat/parke elemanlari, duvar kagidi rulolari ve yardimci yapistiricilar", purpose: "Mahal kullanimina uygun görünür yuzeyi olusturmak.", phase: "Kaplama" },
  { group: "Birlesim", name: "Süpürgelik, esik profili, derz ve kenar bitis elemanlari", purpose: "Gecisleri ve kenar detaylarini temiz ve bakım dostu tamamlamak.", phase: "Bitis" },
  { group: "Koruma", name: "Yüzey ortuleri, maskeleme ve gecici trafik koruma ekipmani", purpose: "Tamamlanan ince isi diger ekiplerden ve erken kullanimdan korumak.", phase: "Teslim öncesi" },
];

export const inceIslerDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/zemin-kaplamalari/parke-kaplama",
    kind: "topic",
    quote: "Parke, sıcak ve sessiz bir yüzey hissi verir; ama bu konforun gercek kaynagi zeminin ona ne kadar doğru hazirlandigidir.",
    tip: "Parkeyi son kat estetik karari gibi gormek, nemli sap ve yanlış genlesme boslugu gibi hatalari teslimden sonra kullanicinin ayagi altina birakmak demektir.",
    intro: [
      "Parke kaplama, konut ve ofislerde en yaygin tercih edilen zemin cozumlerinden biridir. Kullanıcı tarafinda yarattigi sıcaklık hissi, akustik konfor ve hızlı montaj avantajlari onu cazip kilar. Ancak santiyede en çok sikayet uretebilen kaplamalardan biri olmasinin sebebi de tam olarak budur: hassas bir sistem olmasina ragmen basit gorulmesi.",
      "Bir insaat muhendisi için parke isi yalnız urun secmek degildir. Sap nemi, mastar toleransi, altlik secimi, süpürgelik ve esik detaylari, mekanik veya islak hacimlerle sinir iliskisi ve teslim sonrasi koruma bir arada dusunulmelidir. Bu halkalardan biri eksik kaldiginda, kaliteli urun dahi kısa surede gicirdama, kalkma, kabarma veya birlesim acilmasiyla sorun uretir.",
      "Sahada parke ile ilgili en yaygin hatalar; yeterince kurumamis sap uzerine montaj, duvar diplerinde yetersiz genlesme boslugu, geçiş detaylarinin plansiz cozulmesi ve montaj biter bitmez yuzeyin agir ekip trafigine acilmasidir. Bu hatalar ilk gun zararsiz gibi görünür; ama mevsim degisimleri ve gunluk kullanım basladiginda ortaya cikar.",
      "Bu nedenle parke kaplamayi, katalogdan renk secilen son dokunus degil; nem, geometri ve hareket yonetimi isteyen teknik bir zemin sistemi olarak ele almak gerekir.",
    ],
    theory: [
      "Parke sistemleri, ozellikle laminat ve ahşap esasli urunler, cevresel neme ve sicakliga duyarlidir. Bu nedenle kaplama tek basina rijit ve sabit bir katman gibi davranmaz; kontrollu genlesme ve buzulme hareketleri gosterir. Duvar diplerinde ve esik gecislerinde birakilan bosluklar, bu hareketin emniyetli bicimde yonetilmesini saglar.",
      "Alt zemin performansi burada belirleyicidir. Sap yeterince kuru degilse parkeye alttan nem yukler. Duzlemsizlik varsa parke altinda bosluk ve esneme olusur. Bu iki kosul birlikte oldugunda kaplama ilk basta düzgün gorunse bile kısa sure sonra birlesim acilir, yururken ses uretir veya lokalde yukselir. Yani parkedeki sorun cogu zaman parke yuzeyinde degil, alt sistemde baslar.",
      "Altlik ve buhar kesici secimi de yalnız aksesuar konusu degildir. Zeminle temas eden katmanda yanlış urun secildiginde hem akustik konfor hem de nem davranisi bozulur. Ozellikle doseme alti tesisat, zemin isitma veya yeni dokulmus sap bulunan alanlarda bu karar daha kritik hale gelir.",
      "Ayrıca parke kaplamada iş programi çok onemlidir. Boya, siva, mekanik duzeltme ve agir mobilya montaji bitmeden alana parke girdiginde yüzey ya kirlenir ya da darbe alir. Dolayisiyla parke isi, proje kapanis takviminde en sona yakin ama en disiplinli planlanmasi gereken imalatlardan biridir.",
    ],
    ruleTable: [
      {
        parameter: "Alt zemin nemi",
        limitOrRequirement: "Parke montaji öncesi sap nemi urun tipine uygun esik altinda olculerek dogrulanmali",
        reference: "TS EN 13329 + saha kabul disiplini",
        note: "Nem oculmeden montaj karari verilmemelidir.",
      },
      {
        parameter: "Duzlemsellik ve mastar toleransi",
        limitOrRequirement: "Zemin duzlemselligi kaplamanin bosluk ve ses uretmeyecegi seviyede olmali",
        reference: "Saha kalite plani",
        note: "Yapıştırıcı veya altlik, buyuk yüzey bozuklugunu telafi araci degildir.",
      },
      {
        parameter: "Genlesme bosluklari",
        limitOrRequirement: "Duvar dibi, kolon, doğrama ve esiklerde sistemin hareketine izin verecek bosluk birakilmali",
        reference: "Urun teknik dokumani + saha uygulama disiplini",
        note: "Sifir tolerans montaj, ileride kabarma riski dogurur.",
      },
      {
        parameter: "Altlik ve buhar kesici",
        limitOrRequirement: "Alt sistem, parke tipi ve zemin kosuluna uygun secilmeli",
        reference: "TS EN 13329 + üretim sistemi mantigi",
        note: "Akustik ve nem performansi aynı anda dusunulmelidir.",
      },
      {
        parameter: "Teslim sonrasi koruma",
        limitOrRequirement: "Tamamlanan yüzey erken trafik, islak temizlik ve agir yukten korunmali",
        reference: "Teslim kalite plani",
        note: "Yeni dosenen parke ilk gunlerde en kirilgan halindedir.",
      },
    ],
    designOrApplicationSteps: [
      "Parke tipini, mekan kullanım sinifini, zemin isisi durumunu ve bakım beklentisini birlikte degerlendirerek sec.",
      "Montajdan once sap nemini ve yüzey duzlemini sayisal olcumle kontrol et; yalnız görsel kabul yapma.",
      "Altlik, buhar kesici ve genlesme bosluklarini sistemin ayrilmaz parçası olarak planla.",
      "Esik, kapı alti, süpürgelik ve farkli zemin geçiş detaylarini montaj baslamadan netlestir.",
      "Parke montajini diger kirli islerden ve agir ekip trafiginden ayiran bir iş sirasi kur.",
      "Teslim öncesi gicirdama, acilma, yüzey cizigi ve kenar sikismasi acisindan mahal bazinda son tur yap.",
    ],
    criticalChecks: [
      "Sap nemi olculdu mu ve urun için uygun esigin altinda mi?",
      "2 m mastarda duzlemsizlik ses veya esneme yaratacak seviyede mi?",
      "Duvar dipleri, kolon cevresi ve esiklerde yeterli genlesme boslugu birakildi mi?",
      "Altlik ve buhar kesici zeminin gercek kosuluyla uyumlu mu?",
      "Montaj sonrasi alan hemen agir ekip veya temizlik ekibine acildi mi?",
      "Yuzeyde erken acilma, gicirdama veya kilit hatti bozulmasi tespit edildi mi?",
    ],
    numericalExample: {
      title: "36 m2 odada sap nemi ve malzeme hesabi yorumu",
      inputs: [
        { label: "Mahal alani", value: "36 m2", note: "Salon ornegi" },
        { label: "Olculen CM nemi", value: "%2,3", note: "Uc noktada benzer sonuc" },
        { label: "Ornek hedef esik", value: "%2,0", note: "Hassas parke montaji için saha bandi" },
        { label: "Siparis fire payi", value: "%8", note: "Kesim ve secme payi" },
      ],
      assumptions: [
        "Parke urunu neme duyarli bir sistemdir.",
        "Mahal geometrisi çok fazla capraz kesim gerektirmemektedir.",
        "Montaj, tüm kirli isler bittikten sonra yapilacaktir.",
      ],
      steps: [
        {
          title: "Nem durumunu degerlendir",
          formula: "2,3 > 2,0",
          result: "Mevcut zemin nemi, ornek kabul esiginin uzerindedir; montaj için erken davranilmis olur.",
          note: "Bu fark küçük gorunse de mevsimsel davranista onemli sonuc uretir.",
        },
        {
          title: "Montaj kararini kur",
          result: "Sap daha fazla kurutulmali ve ölçüm tekrarlanmalidir.",
          note: "Takvim baskisiyla montaj yapmak, yuzeyi kullaniciya riskli teslim etmek anlamina gelir.",
        },
        {
          title: "Malzeme siparis miktarini hesapla",
          formula: "36 x 1,08 = 38,88 m2",
          result: "Siparis için yaklasik 39 m2 malzeme planlanmasi uygundur.",
          note: "Bu hesap nem uygun olduktan sonra anlamlidir; erken siparis montaj kararini dogrulamaz.",
        },
      ],
      checks: [
        "Nem verisi uygun olmadan urun siparisi veya montaj takvimi kesinlestirilmemelidir.",
        "Fire payi oda geometrisi ve doseme yonuyle birlikte degerlendirilmelidir.",
        "Alt zemin uygun degilse sorun parkede degil sahadaki hazirliktadir.",
        "Ölçüm aynı cihaz ve aynı yontemle tekrar edilerek teyit edilmelidir.",
      ],
      engineeringComment: "Parke kaplamada en kritik veri cogu zaman katalogdaki renk kodu degil, sap gercekten kuru mu sorusunun cevabidir.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Sap nemini olcmeden parke montajina baslamak.", correct: "Montaj kararini CM nem olcumu ve yüzey kabulu ile vermek." },
      { wrong: "Duvar diplerinde genlesme boslugu birakmamak.", correct: "Sistemin hareketini emniyetli yonetecek çevre bosluklarini tasarlamak." },
      { wrong: "Esik ve geçiş detaylarini montaj sirasinda dogaclama cozmek.", correct: "Tüm gecisleri önceden paftaya ve saha kararina baglamak." },
      { wrong: "Altlik secimini maliyet kalemi gibi gormek.", correct: "Akustik ve nem performansinin ana parçası olarak degerlendirmek." },
      { wrong: "Parke bitince alani hemen diger ekiplere acmak.", correct: "Koruma plani olmadan yuzeyi teslim etmemek." },
      { wrong: "Gicirdama ve küçük acilmalari kullanıcı sorunu gibi gormek.", correct: "Alt zemin ve montaj kalitesinin sonucu olarak erken safhada incelemek." },
    ],
    designVsField: [
      "Tasarim tarafinda parke, renk ve doku secimi gibi görünür; sahada ise en kritik karar cogu zaman gorunmeyen alt zemin hazirligidir.",
      "Iyi parke uygulamasi sessizdir; kullanıcı yurudugunde dikkatini cekmez. Kötü uygulama ise ses, aciklik ve kabarma ile kendini kısa surede ele verir.",
      "Bu nedenle parke, ince isler icinde en çok 'güzel gorunmek' kadar 'doğru hazirlanmak' isteyen kaplamalardan biridir.",
    ],
    conclusion: [
      "Parke kaplama doğru nem, doğru duzlem ve doğru hareket detaylari ile yurutuldugunde uzun omurlu, konforlu ve temiz bir zemin sistemi olur. Bu uc baslik ihmal edildiginde sorun urun seciminden çok saha kararlarindan dogar.",
      "Saha tarafinda en saglam yaklasim, parkeyi son kat estetik isi degil, alt zemin kabulu ve teslim korumasi isteyen teknik bir sistem olarak yonetmektir. Bu bakis, teslim sonrasi en sık gorulen kullanıcı sikayetlerini belirgin bicimde azaltir.",
    ],
    sources: [...INCE_DEEP_SOURCES, SOURCE_LEDGER.tsEn13329, SOURCE_LEDGER.ts825],
    keywords: ["parke kaplama", "sap nemi", "TS EN 13329", "genlesme boslugu", "zemin kabulu"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
  {
    slugPath: "ince-isler/duvar-kaplamalari/duvar-kagidi",
    kind: "topic",
    quote: "Duvar kagidi, kusuru orten bir kaplama degil; alt yüzey kalitesini ve detay disiplinini daha rafine bicimde görünür kilan bir testtir.",
    tip: "Duvar kagidini sadece desen secimi gibi gormek, en kritik iki konuyu kacirir: alt yüzey homojenligi ve ek yerlerinin isik altinda nasil gorunecegi.",
    intro: [
      "Duvar kagidi uygulamasi, konut, ofis ve ticari mekanlarda hızlı karakter kazandiran bir duvar kaplama cozumudur. Doku, desen ve renk cesitliligi sayesinde mekani guclu bicimde tanimlar. Ancak santiyede en yanlış anlasilan ince islerden biri de yine duvar kagididir; cunku yüzey kusurlarini tamamen sakladigi sanilir.",
      "Oysa duvar kagidi, ozellikle isik alan yuzeylerde, alt yuzeyin homojenligini ve birlesim detaylarini son derece görünür hale getirir. Macun adasi, zimpara izi, tam kurumamis siva, kötü astarlanmis yüzey veya sasmis ek yeri, boya uygulamasindan daha sert sekilde okunabilir.",
      "Bir insaat muhendisi için duvar kagidi isi yalnız dekorasyon karari degildir. Yüzey nemi, siva ve macun kabulu, ek yeri plani, elektrik anahtari-priz cevresi, köşe donusu ve teslim sonrasi koruma bir arada dusunulmelidir. Aksi halde uygulama ilk gun iyi gorunse bile kenar acilmasi, kabarma veya lekelenme ile sorun uretir.",
      "Bu nedenle duvar kagidini ince islerin estetik parçası kadar, alt yüzey kalitesinin teknik dogrulama katmani olarak gormek gerekir.",
    ],
    theory: [
      "Duvar kagidi performansinda en temel konu alt yüzey emiciligi ve duzgunlugudur. Yüzey bir noktada fazla emici, baska bir noktada parlak veya tozlu ise yapıştırıcının davranisi degisir. Bu da kagidin bazi bolgelerde iyi tutunup bazi bolgelerde zamanla ayrilmasina neden olabilir. Yani aynı duvarda bile esit davranis garanti degildir.",
      "Ek yerleri ve desen takibi ikinci ana konudur. Ozellikle desenli ya da dokulu urunlerde duseylik kaymasi, köşe donusunde milimetrik kaciklik veya seritler arasi seviye farki hemen fark edilir. Bu nedenle duvar kagidi uygulamasi, kesintisiz el becerisinden çok, önceden kurulmus bir aks ve başlangıç hatti ister.",
      "Nem ve sıcaklık da kritik etkendir. Yeterince kurumamis siva veya yeni tamir edilmis yuzeye uygulanan kagit zamanla kabarabilir. Islak hacimlere yakin duvarlar, dış cepheye yakin soğuk yuzeyler ya da pencere onu bolgeleri daha dikkatli degerlendirilmelidir. Duvar kagidi yalnız yuzeye yapismaz; arkasindaki yapı fizigi ile birlikte calisir.",
      "Ayrıca elektrik anahtari, priz, süpürgelik ustu ve tavan birlesimi gibi detaylar da duvar kagidinin algisini belirler. Uygulama yalnız duz duvar yuzeyinden degil, bu detaylarin nasil cozulddugunden de okunur. Bu nedenle duvar kagidi isi, detay odakli bir bitis muhendisligi olarak ele alinmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey homojenligi",
        limitOrRequirement: "Siva, macun ve astar katmanlari kagidin davranisini bozmayacak homojenlikte olmali",
        reference: "TS EN 13914 + saha yüzey kabulu",
        note: "Dengesiz emicilik, kabarma ve ayrilma riskini buyutur.",
      },
      {
        parameter: "Kuruma ve nem durumu",
        limitOrRequirement: "Duvar kagidi öncesi yüzey kuru, tozsuz ve lokal kabarma gostermeyen durumda olmali",
        reference: "Saha kalite plani",
        note: "Nemli yuzeyde güzel başlangıç, kısa omurlu sonuc demektir.",
      },
      {
        parameter: "Başlangıç hatti ve ek yerleri",
        limitOrRequirement: "Uygulama düşey referans uzerinden baslamali, ek yerleri isik ve desen yonu dusunulerek planlanmali",
        reference: "Uygulama disiplini",
        note: "Ek yeri sasmasi küçük alanda baslar, buyuk yuzde buyur.",
      },
      {
        parameter: "Detay ve kesim bolgeleri",
        limitOrRequirement: "Priz, anahtar, köşe ve tavan birlesimlerinde temiz, tekrarlanabilir detay saglanmali",
        reference: "Mahal bitis paftasi",
        note: "Duvar kagidinde kalite cogu zaman duz yuzde degil detay cizgisinde okunur.",
      },
      {
        parameter: "Teslim sonrasi koruma",
        limitOrRequirement: "Yeni kaplanan yüzey darbe, kir ve asiri hava akimindan korunmali",
        reference: "Teslim kalite plani",
        note: "Ilk gunlerde kenar ve ek yerleri en hassas durumdadir.",
      },
    ],
    designOrApplicationSteps: [
      "Duvar kagidi uygulanacak mekanlarda siva, macun ve astar kabulunu boya standardindan da siki tut.",
      "Desen yonunu, başlangıç hattini ve ek yerlerinin nerede bitecegini isik yonuyle birlikte planla.",
      "Priz, anahtar, niş, köşe ve doğrama yanlarindaki bitis detaylarini uygulama öncesi numune alanda test et.",
      "Yapıştırıcı secimini urun tipi ve duvar kosuluna göre yap; her kagidi aynı receteyle ele alma.",
      "Uygulama sirasinda düşey referansi surekli kontrol et; bir seritteki küçük kaymayi sonraki seritlere tasima.",
      "Teslim öncesi ek yeri, kenar acilmasi, leke, kabarma ve desen devamliligi acisindan mahal bazli kontrol yap.",
    ],
    criticalChecks: [
      "Alt yuzeyde emicilik veya macun kalitesi bakimindan farkli davranan adalar var mi?",
      "Duvar yeterince kuru ve tozsuz mu?",
      "Başlangıç hatti düşey ve isik yonune göre uygun yerde mi secildi?",
      "Priz, anahtar ve köşe detaylarinda duzensiz kesim veya yapisma kaybi var mi?",
      "Ek yerleri ozellikle pencere yanlarinda veya lineer isik altinda belirginlesiyor mu?",
      "Teslim öncesi yüzey baska ekiplerin darbe ve kir riskinden korundu mu?",
    ],
    numericalExample: {
      title: "4,80 m duvarda 53 cm rulolu duvar kagidi için ek yeri plani",
      inputs: [
        { label: "Duvar genisligi", value: "4,80 m", note: "Salon ana duvari" },
        { label: "Rulo kaplama genisligi", value: "53 cm", note: "Net serit genisligi" },
        { label: "Pencere yonu", value: "Soldan dogal isik", note: "Ek yeri gorunurlugunu etkiler" },
        { label: "Hedef", value: "Dengeli ek yeri ve simetrik bitis", note: "Görsel kalite için" },
      ],
      assumptions: [
        "Desen tekrari düşük veya hizalanabilir durumdadir.",
        "Köşe donusleri ayri bitis kariyla cozulecektir.",
        "Duvarin iki ucunda çok dar serit birakmak istenmemektedir.",
      ],
      steps: [
        {
          title: "Tam serit sayisini hesapla",
          formula: "480 / 53 = 9,05",
          result: "Duvar için 9 tam serit ve küçük bir bakiye ihtiyaci gorunmektedir.",
          note: "Bu bakiye, rastgele sona birakilirsa bir kenarda çok dar parca olusabilir.",
        },
        {
          title: "9 seritli yerlestirimi yorumla",
          formula: "9 x 53 = 477 cm",
          result: "Toplam 9 serit 477 cm kaplar, yaklasik 3 cm fark kalir.",
          note: "3 cm'lik farki tek tarafa birakmak yerine başlangıç hatti ve kenar kesimi dengeli kurulmalidir.",
        },
        {
          title: "Isik yonu etkisini ekle",
          result: "Dogal isik soldan geldigi için ilk ek yeri ve desen hatti bu yonde daha dikkatli kurulmalidir.",
          note: "Ek yeri kagit ustunde aynı gorunse de isik altinda daha belirgin hale gelebilir.",
        },
      ],
      checks: [
        "Duvar kagidinde serit hesabi yalnız alan hesabi degil, bitis ve isik hesabidir.",
        "Dar kalan kenar parçası, görsel kaliteyi hızlı bicimde dusurur.",
        "Başlangıç hatti desen ve isik yonu ile birlikte degerlendirilmelidir.",
        "Pratikte numune yerlestim, nihai uygulamadan once kalite riskini azaltir.",
      ],
      engineeringComment: "Duvar kagidinde birkaç santimetrelik bitis karari, butun duvarin duzenli mi amator mu gorunecegini belirleyebilir.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Duvar kagidini boyadan daha toleransli sanmak.", correct: "Alt yüzey kabulunu daha da siki yapmak." },
      { wrong: "Düşey başlangıç hatti kurmadan uygulamaya baslamak.", correct: "Tüm seritleri referanslayacak net bir aks olusturmak." },
      { wrong: "Nemli veya yeni tamir edilmis duvara kagit uygulamak.", correct: "Yüzey kurulugunu ve yapisma kosullarini önceden dogrulamak." },
      { wrong: "Priz, anahtar ve köşe detaylarini usta refleksine birakmak.", correct: "Bu detaylari numune alanda test edip standardize etmek." },
      { wrong: "Ek yerlerini isik yonunden bagimsiz planlamak.", correct: "Dogal ve yapay isik etkisini bastan hesaba katmak." },
      { wrong: "Teslim sonrasi yuzeyi korumadan diger ekiplere alan acmak.", correct: "Kenar ve yüzey korumasini teslim planina baglamak." },
    ],
    designVsField: [
      "Tasarim tarafinda duvar kagidi doku ve desen karari gibi görünür; sahada ise asil kaliteyi alt yüzey homojenligi ve ek yeri disiplini belirler.",
      "Iyi duvar kagidi uygulamasi kendini bagirarak degil, yuzeyin sessiz ve temiz gorunmesiyle belli eder.",
      "Bu nedenle duvar kagidi, dekoratif ama yuksek hassasiyet isteyen bir teslim katmanidir.",
    ],
    conclusion: [
      "Duvar kagidi doğru alt yüzey, doğru aks ve doğru detay cozumu ile uygulandiginda mekana hızlı karakter kazandiran çok etkili bir kaplama olur. Aynı iş hazirliksiz yurutuldugunde ek yeri, kabarma ve kenar acilmasi gibi kusurlari hemen görünür hale getirir.",
      "Saha tarafinda en doğru yaklasim, duvar kagidini estetik secim kadar teknik yüzey kabulu olarak gormek ve uygulama öncesi hazirligi buna göre yurutmektir. Bu bakis, teslim sonrasi kullanıcı algisini doğrudan iyilestirir.",
    ],
    sources: [...INCE_DEEP_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["duvar kagidi", "ek yeri", "alt yüzey hazirligi", "desen plani", "duvar kaplamasi"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari", "ince-isler/duvar-kaplamalari/boya"],
  },
];
