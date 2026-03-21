import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const INCE_DEEP_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const FINISH_TOOLS: BinaGuideTool[] = [
  { category: "Olcum", name: "CM nem olcer, mastar ve lazer nivo", purpose: "Kaplama veya duvar kagidi oncesi alt yuzey nemi ve duzlemini sayisal olarak dogrulamak." },
  { category: "Detay", name: "Mahal bitis paftalari ve numune panel seti", purpose: "Esik, supurgelik, duvar bitisi ve desen kararlarini uygulama oncesi netlestirmek." },
  { category: "Kontrol", name: "Kuruma, deneme alani ve teslim cizelgesi", purpose: "Kaplama oncesi hazirlik ile teslim sonrasi korumayi veriyle izlemek." },
  { category: "Kayit", name: "Mahal bazli kalite ve kusur foyi", purpose: "Yuzey dalgasi, derz, desen ve koruma notlarini alan bazinda arsivlemek." },
];

const FINISH_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Astar, tesviye, macun ve yuzey duzeltme malzemeleri", purpose: "Alt sistemi kaplama veya duvar kagidi tasiyacak homojen seviyeye getirmek.", phase: "Hazirlik" },
  { group: "Kaplama", name: "Laminat/parke elemanlari, duvar kagidi rulolari ve yardimci yapistiricilar", purpose: "Mahal kullanimina uygun gorunur yuzeyi olusturmak.", phase: "Kaplama" },
  { group: "Birlesim", name: "Supurgelik, esik profili, derz ve kenar bitis elemanlari", purpose: "Gecisleri ve kenar detaylarini temiz ve bakim dostu tamamlamak.", phase: "Bitis" },
  { group: "Koruma", name: "Yuzey ortuleri, maskeleme ve gecici trafik koruma ekipmani", purpose: "Tamamlanan ince isi diger ekiplerden ve erken kullanimdan korumak.", phase: "Teslim oncesi" },
];

export const inceIslerDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/zemin-kaplamalari/parke-kaplama",
    kind: "topic",
    quote: "Parke, sicak ve sessiz bir yuzey hissi verir; ama bu konforun gercek kaynagi zeminin ona ne kadar dogru hazirlandigidir.",
    tip: "Parkeyi son kat estetik karari gibi gormek, nemli sap ve yanlis genlesme boslugu gibi hatalari teslimden sonra kullanicinin ayagi altina birakmak demektir.",
    intro: [
      "Parke kaplama, konut ve ofislerde en yaygin tercih edilen zemin cozumlerinden biridir. Kullanici tarafinda yarattigi sicaklik hissi, akustik konfor ve hizli montaj avantajlari onu cazip kilar. Ancak santiyede en cok sikayet uretebilen kaplamalardan biri olmasinin sebebi de tam olarak budur: hassas bir sistem olmasina ragmen basit gorulmesi.",
      "Bir insaat muhendisi icin parke isi yalniz urun secmek degildir. Sap nemi, mastar toleransi, altlik secimi, supurgelik ve esik detaylari, mekanik veya islak hacimlerle sinir iliskisi ve teslim sonrasi koruma bir arada dusunulmelidir. Bu halkalardan biri eksik kaldiginda, kaliteli urun dahi kisa surede gicirdama, kalkma, kabarma veya birlesim acilmasiyla sorun uretir.",
      "Sahada parke ile ilgili en yaygin hatalar; yeterince kurumamis sap uzerine montaj, duvar diplerinde yetersiz genlesme boslugu, gecis detaylarinin plansiz cozulmesi ve montaj biter bitmez yuzeyin agir ekip trafigine acilmasidir. Bu hatalar ilk gun zararsiz gibi gorunur; ama mevsim degisimleri ve gunluk kullanim basladiginda ortaya cikar.",
      "Bu nedenle parke kaplamayi, katalogdan renk secilen son dokunus degil; nem, geometri ve hareket yonetimi isteyen teknik bir zemin sistemi olarak ele almak gerekir.",
    ],
    theory: [
      "Parke sistemleri, ozellikle laminat ve ahsap esasli urunler, cevresel neme ve sicakliga duyarlidir. Bu nedenle kaplama tek basina rijit ve sabit bir katman gibi davranmaz; kontrollu genlesme ve buzulme hareketleri gosterir. Duvar diplerinde ve esik gecislerinde birakilan bosluklar, bu hareketin emniyetli bicimde yonetilmesini saglar.",
      "Alt zemin performansi burada belirleyicidir. Sap yeterince kuru degilse parkeye alttan nem yukler. Duzlemsizlik varsa parke altinda bosluk ve esneme olusur. Bu iki kosul birlikte oldugunda kaplama ilk basta duzgun gorunse bile kisa sure sonra birlesim acilir, yururken ses uretir veya lokalde yukselir. Yani parkedeki sorun cogu zaman parke yuzeyinde degil, alt sistemde baslar.",
      "Altlik ve buhar kesici secimi de yalniz aksesuar konusu degildir. Zeminle temas eden katmanda yanlis urun secildiginde hem akustik konfor hem de nem davranisi bozulur. Ozellikle doseme alti tesisat, zemin isitma veya yeni dokulmus sap bulunan alanlarda bu karar daha kritik hale gelir.",
      "Ayrica parke kaplamada is programi cok onemlidir. Boya, siva, mekanik duzeltme ve agir mobilya montaji bitmeden alana parke girdiginde yuzey ya kirlenir ya da darbe alir. Dolayisiyla parke isi, proje kapanis takviminde en sona yakin ama en disiplinli planlanmasi gereken imalatlardan biridir.",
    ],
    ruleTable: [
      {
        parameter: "Alt zemin nemi",
        limitOrRequirement: "Parke montaji oncesi sap nemi urun tipine uygun esik altinda olculerek dogrulanmali",
        reference: "TS EN 13329 + saha kabul disiplini",
        note: "Nem oculmeden montaj karari verilmemelidir.",
      },
      {
        parameter: "Duzlemsellik ve mastar toleransi",
        limitOrRequirement: "Zemin duzlemselligi kaplamanin bosluk ve ses uretmeyecegi seviyede olmali",
        reference: "Saha kalite plani",
        note: "Yapistirici veya altlik, buyuk yuzey bozuklugunu telafi araci degildir.",
      },
      {
        parameter: "Genlesme bosluklari",
        limitOrRequirement: "Duvar dibi, kolon, dograma ve esiklerde sistemin hareketine izin verecek bosluk birakilmali",
        reference: "Urun teknik dokumani + saha uygulama disiplini",
        note: "Sifir tolerans montaj, ileride kabarma riski dogurur.",
      },
      {
        parameter: "Altlik ve buhar kesici",
        limitOrRequirement: "Alt sistem, parke tipi ve zemin kosuluna uygun secilmeli",
        reference: "TS EN 13329 + uretim sistemi mantigi",
        note: "Akustik ve nem performansi ayni anda dusunulmelidir.",
      },
      {
        parameter: "Teslim sonrasi koruma",
        limitOrRequirement: "Tamamlanan yuzey erken trafik, islak temizlik ve agir yukten korunmali",
        reference: "Teslim kalite plani",
        note: "Yeni dosenen parke ilk gunlerde en kirilgan halindedir.",
      },
    ],
    designOrApplicationSteps: [
      "Parke tipini, mekan kullanim sinifini, zemin isisi durumunu ve bakim beklentisini birlikte degerlendirerek sec.",
      "Montajdan once sap nemini ve yuzey duzlemini sayisal olcumle kontrol et; yalniz gorsel kabul yapma.",
      "Altlik, buhar kesici ve genlesme bosluklarini sistemin ayrilmaz parcasi olarak planla.",
      "Esik, kapi alti, supurgelik ve farkli zemin gecis detaylarini montaj baslamadan netlestir.",
      "Parke montajini diger kirli islerden ve agir ekip trafiginden ayiran bir is sirasi kur.",
      "Teslim oncesi gicirdama, acilma, yuzey cizigi ve kenar sikismasi acisindan mahal bazinda son tur yap.",
    ],
    criticalChecks: [
      "Sap nemi olculdu mu ve urun icin uygun esigin altinda mi?",
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
        { label: "Ornek hedef esik", value: "%2,0", note: "Hassas parke montaji icin saha bandi" },
        { label: "Siparis fire payi", value: "%8", note: "Kesim ve secme payi" },
      ],
      assumptions: [
        "Parke urunu neme duyarli bir sistemdir.",
        "Mahal geometrisi cok fazla capraz kesim gerektirmemektedir.",
        "Montaj, tum kirli isler bittikten sonra yapilacaktir.",
      ],
      steps: [
        {
          title: "Nem durumunu degerlendir",
          formula: "2,3 > 2,0",
          result: "Mevcut zemin nemi, ornek kabul esiginin uzerindedir; montaj icin erken davranilmis olur.",
          note: "Bu fark kucuk gorunse de mevsimsel davranista onemli sonuc uretir.",
        },
        {
          title: "Montaj kararini kur",
          result: "Sap daha fazla kurutulmali ve olcum tekrarlanmalidir.",
          note: "Takvim baskisiyla montaj yapmak, yuzeyi kullaniciya riskli teslim etmek anlamina gelir.",
        },
        {
          title: "Malzeme siparis miktarini hesapla",
          formula: "36 x 1,08 = 38,88 m2",
          result: "Siparis icin yaklasik 39 m2 malzeme planlanmasi uygundur.",
          note: "Bu hesap nem uygun olduktan sonra anlamlidir; erken siparis montaj kararini dogrulamaz.",
        },
      ],
      checks: [
        "Nem verisi uygun olmadan urun siparisi veya montaj takvimi kesinlestirilmemelidir.",
        "Fire payi oda geometrisi ve doseme yonuyle birlikte degerlendirilmelidir.",
        "Alt zemin uygun degilse sorun parkede degil sahadaki hazirliktadir.",
        "Olcum ayni cihaz ve ayni yontemle tekrar edilerek teyit edilmelidir.",
      ],
      engineeringComment: "Parke kaplamada en kritik veri cogu zaman katalogdaki renk kodu degil, sap gercekten kuru mu sorusunun cevabidir.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Sap nemini olcmeden parke montajina baslamak.", correct: "Montaj kararini CM nem olcumu ve yuzey kabulu ile vermek." },
      { wrong: "Duvar diplerinde genlesme boslugu birakmamak.", correct: "Sistemin hareketini emniyetli yonetecek cevre bosluklarini tasarlamak." },
      { wrong: "Esik ve gecis detaylarini montaj sirasinda dogaclama cozmek.", correct: "Tum gecisleri onceden paftaya ve saha kararina baglamak." },
      { wrong: "Altlik secimini maliyet kalemi gibi gormek.", correct: "Akustik ve nem performansinin ana parcasi olarak degerlendirmek." },
      { wrong: "Parke bitince alani hemen diger ekiplere acmak.", correct: "Koruma plani olmadan yuzeyi teslim etmemek." },
      { wrong: "Gicirdama ve kucuk acilmalari kullanici sorunu gibi gormek.", correct: "Alt zemin ve montaj kalitesinin sonucu olarak erken safhada incelemek." },
    ],
    designVsField: [
      "Tasarim tarafinda parke, renk ve doku secimi gibi gorunur; sahada ise en kritik karar cogu zaman gorunmeyen alt zemin hazirligidir.",
      "Iyi parke uygulamasi sessizdir; kullanici yurudugunde dikkatini cekmez. Kotu uygulama ise ses, aciklik ve kabarma ile kendini kisa surede ele verir.",
      "Bu nedenle parke, ince isler icinde en cok 'guzel gorunmek' kadar 'dogru hazirlanmak' isteyen kaplamalardan biridir.",
    ],
    conclusion: [
      "Parke kaplama dogru nem, dogru duzlem ve dogru hareket detaylari ile yurutuldugunde uzun omurlu, konforlu ve temiz bir zemin sistemi olur. Bu uc baslik ihmal edildiginde sorun urun seciminden cok saha kararlarindan dogar.",
      "Saha tarafinda en saglam yaklasim, parkeyi son kat estetik isi degil, alt zemin kabulu ve teslim korumasi isteyen teknik bir sistem olarak yonetmektir. Bu bakis, teslim sonrasi en sik gorulen kullanici sikayetlerini belirgin bicimde azaltir.",
    ],
    sources: [...INCE_DEEP_SOURCES, SOURCE_LEDGER.tsEn13329, SOURCE_LEDGER.ts825],
    keywords: ["parke kaplama", "sap nemi", "TS EN 13329", "genlesme boslugu", "zemin kabulu"],
    relatedPaths: ["ince-isler", "ince-isler/zemin-kaplamalari", "ince-isler/zemin-kaplamalari/seramik-kaplama"],
  },
  {
    slugPath: "ince-isler/duvar-kaplamalari/duvar-kagidi",
    kind: "topic",
    quote: "Duvar kagidi, kusuru orten bir kaplama degil; alt yuzey kalitesini ve detay disiplinini daha rafine bicimde gorunur kilan bir testtir.",
    tip: "Duvar kagidini sadece desen secimi gibi gormek, en kritik iki konuyu kacirir: alt yuzey homojenligi ve ek yerlerinin isik altinda nasil gorunecegi.",
    intro: [
      "Duvar kagidi uygulamasi, konut, ofis ve ticari mekanlarda hizli karakter kazandiran bir duvar kaplama cozumudur. Doku, desen ve renk cesitliligi sayesinde mekani guclu bicimde tanimlar. Ancak santiyede en yanlis anlasilan ince islerden biri de yine duvar kagididir; cunku yuzey kusurlarini tamamen sakladigi sanilir.",
      "Oysa duvar kagidi, ozellikle isik alan yuzeylerde, alt yuzeyin homojenligini ve birlesim detaylarini son derece gorunur hale getirir. Macun adasi, zimpara izi, tam kurumamis siva, kotu astarlanmis yuzey veya sasmis ek yeri, boya uygulamasindan daha sert sekilde okunabilir.",
      "Bir insaat muhendisi icin duvar kagidi isi yalniz dekorasyon karari degildir. Yuzey nemi, siva ve macun kabulu, ek yeri plani, elektrik anahtari-priz cevresi, kose donusu ve teslim sonrasi koruma bir arada dusunulmelidir. Aksi halde uygulama ilk gun iyi gorunse bile kenar acilmasi, kabarma veya lekelenme ile sorun uretir.",
      "Bu nedenle duvar kagidini ince islerin estetik parcasi kadar, alt yuzey kalitesinin teknik dogrulama katmani olarak gormek gerekir.",
    ],
    theory: [
      "Duvar kagidi performansinda en temel konu alt yuzey emiciligi ve duzgunlugudur. Yuzey bir noktada fazla emici, baska bir noktada parlak veya tozlu ise yapistiricinin davranisi degisir. Bu da kagidin bazi bolgelerde iyi tutunup bazi bolgelerde zamanla ayrilmasina neden olabilir. Yani ayni duvarda bile esit davranis garanti degildir.",
      "Ek yerleri ve desen takibi ikinci ana konudur. Ozellikle desenli ya da dokulu urunlerde duseylik kaymasi, kose donusunde milimetrik kaciklik veya seritler arasi seviye farki hemen fark edilir. Bu nedenle duvar kagidi uygulamasi, kesintisiz el becerisinden cok, onceden kurulmus bir aks ve baslangic hatti ister.",
      "Nem ve sicaklik da kritik etkendir. Yeterince kurumamis siva veya yeni tamir edilmis yuzeye uygulanan kagit zamanla kabarabilir. Islak hacimlere yakin duvarlar, dis cepheye yakin soguk yuzeyler ya da pencere onu bolgeleri daha dikkatli degerlendirilmelidir. Duvar kagidi yalniz yuzeye yapismaz; arkasindaki yapi fizigi ile birlikte calisir.",
      "Ayrica elektrik anahtari, priz, supurgelik ustu ve tavan birlesimi gibi detaylar da duvar kagidinin algisini belirler. Uygulama yalniz duz duvar yuzeyinden degil, bu detaylarin nasil cozulddugunden de okunur. Bu nedenle duvar kagidi isi, detay odakli bir bitis muhendisligi olarak ele alinmalidir.",
    ],
    ruleTable: [
      {
        parameter: "Alt yuzey homojenligi",
        limitOrRequirement: "Siva, macun ve astar katmanlari kagidin davranisini bozmayacak homojenlikte olmali",
        reference: "TS EN 13914 + saha yuzey kabulu",
        note: "Dengesiz emicilik, kabarma ve ayrilma riskini buyutur.",
      },
      {
        parameter: "Kuruma ve nem durumu",
        limitOrRequirement: "Duvar kagidi oncesi yuzey kuru, tozsuz ve lokal kabarma gostermeyen durumda olmali",
        reference: "Saha kalite plani",
        note: "Nemli yuzeyde guzel baslangic, kisa omurlu sonuc demektir.",
      },
      {
        parameter: "Baslangic hatti ve ek yerleri",
        limitOrRequirement: "Uygulama dusey referans uzerinden baslamali, ek yerleri isik ve desen yonu dusunulerek planlanmali",
        reference: "Uygulama disiplini",
        note: "Ek yeri sasmasi kucuk alanda baslar, buyuk yuzde buyur.",
      },
      {
        parameter: "Detay ve kesim bolgeleri",
        limitOrRequirement: "Priz, anahtar, kose ve tavan birlesimlerinde temiz, tekrarlanabilir detay saglanmali",
        reference: "Mahal bitis paftasi",
        note: "Duvar kagidinde kalite cogu zaman duz yuzde degil detay cizgisinde okunur.",
      },
      {
        parameter: "Teslim sonrasi koruma",
        limitOrRequirement: "Yeni kaplanan yuzey darbe, kir ve asiri hava akimindan korunmali",
        reference: "Teslim kalite plani",
        note: "Ilk gunlerde kenar ve ek yerleri en hassas durumdadir.",
      },
    ],
    designOrApplicationSteps: [
      "Duvar kagidi uygulanacak mekanlarda siva, macun ve astar kabulunu boya standardindan da siki tut.",
      "Desen yonunu, baslangic hattini ve ek yerlerinin nerede bitecegini isik yonuyle birlikte planla.",
      "Priz, anahtar, nis, kose ve dograma yanlarindaki bitis detaylarini uygulama oncesi numune alanda test et.",
      "Yapistirici secimini urun tipi ve duvar kosuluna gore yap; her kagidi ayni receteyle ele alma.",
      "Uygulama sirasinda dusey referansi surekli kontrol et; bir seritteki kucuk kaymayi sonraki seritlere tasima.",
      "Teslim oncesi ek yeri, kenar acilmasi, leke, kabarma ve desen devamliligi acisindan mahal bazli kontrol yap.",
    ],
    criticalChecks: [
      "Alt yuzeyde emicilik veya macun kalitesi bakimindan farkli davranan adalar var mi?",
      "Duvar yeterince kuru ve tozsuz mu?",
      "Baslangic hatti dusey ve isik yonune gore uygun yerde mi secildi?",
      "Priz, anahtar ve kose detaylarinda duzensiz kesim veya yapisma kaybi var mi?",
      "Ek yerleri ozellikle pencere yanlarinda veya lineer isik altinda belirginlesiyor mu?",
      "Teslim oncesi yuzey baska ekiplerin darbe ve kir riskinden korundu mu?",
    ],
    numericalExample: {
      title: "4,80 m duvarda 53 cm rulolu duvar kagidi icin ek yeri plani",
      inputs: [
        { label: "Duvar genisligi", value: "4,80 m", note: "Salon ana duvari" },
        { label: "Rulo kaplama genisligi", value: "53 cm", note: "Net serit genisligi" },
        { label: "Pencere yonu", value: "Soldan dogal isik", note: "Ek yeri gorunurlugunu etkiler" },
        { label: "Hedef", value: "Dengeli ek yeri ve simetrik bitis", note: "Gorsel kalite icin" },
      ],
      assumptions: [
        "Desen tekrari dusuk veya hizalanabilir durumdadir.",
        "Kose donusleri ayri bitis kariyla cozulecektir.",
        "Duvarin iki ucunda cok dar serit birakmak istenmemektedir.",
      ],
      steps: [
        {
          title: "Tam serit sayisini hesapla",
          formula: "480 / 53 = 9,05",
          result: "Duvar icin 9 tam serit ve kucuk bir bakiye ihtiyaci gorunmektedir.",
          note: "Bu bakiye, rastgele sona birakilirsa bir kenarda cok dar parca olusabilir.",
        },
        {
          title: "9 seritli yerlestirimi yorumla",
          formula: "9 x 53 = 477 cm",
          result: "Toplam 9 serit 477 cm kaplar, yaklasik 3 cm fark kalir.",
          note: "3 cm'lik farki tek tarafa birakmak yerine baslangic hatti ve kenar kesimi dengeli kurulmalidir.",
        },
        {
          title: "Isik yonu etkisini ekle",
          result: "Dogal isik soldan geldigi icin ilk ek yeri ve desen hatti bu yonde daha dikkatli kurulmalidir.",
          note: "Ek yeri kagit ustunde ayni gorunse de isik altinda daha belirgin hale gelebilir.",
        },
      ],
      checks: [
        "Duvar kagidinde serit hesabi yalniz alan hesabi degil, bitis ve isik hesabidir.",
        "Dar kalan kenar parcasi, gorsel kaliteyi hizli bicimde dusurur.",
        "Baslangic hatti desen ve isik yonu ile birlikte degerlendirilmelidir.",
        "Pratikte numune yerlestim, nihai uygulamadan once kalite riskini azaltir.",
      ],
      engineeringComment: "Duvar kagidinde birkac santimetrelik bitis karari, butun duvarin duzenli mi amator mu gorunecegini belirleyebilir.",
    },
    tools: FINISH_TOOLS,
    equipmentAndMaterials: FINISH_EQUIPMENT,
    mistakes: [
      { wrong: "Duvar kagidini boyadan daha toleransli sanmak.", correct: "Alt yuzey kabulunu daha da siki yapmak." },
      { wrong: "Dusey baslangic hatti kurmadan uygulamaya baslamak.", correct: "Tum seritleri referanslayacak net bir aks olusturmak." },
      { wrong: "Nemli veya yeni tamir edilmis duvara kagit uygulamak.", correct: "Yuzey kurulugunu ve yapisma kosullarini onceden dogrulamak." },
      { wrong: "Priz, anahtar ve kose detaylarini usta refleksine birakmak.", correct: "Bu detaylari numune alanda test edip standardize etmek." },
      { wrong: "Ek yerlerini isik yonunden bagimsiz planlamak.", correct: "Dogal ve yapay isik etkisini bastan hesaba katmak." },
      { wrong: "Teslim sonrasi yuzeyi korumadan diger ekiplere alan acmak.", correct: "Kenar ve yuzey korumasini teslim planina baglamak." },
    ],
    designVsField: [
      "Tasarim tarafinda duvar kagidi doku ve desen karari gibi gorunur; sahada ise asil kaliteyi alt yuzey homojenligi ve ek yeri disiplini belirler.",
      "Iyi duvar kagidi uygulamasi kendini bagirarak degil, yuzeyin sessiz ve temiz gorunmesiyle belli eder.",
      "Bu nedenle duvar kagidi, dekoratif ama yuksek hassasiyet isteyen bir teslim katmanidir.",
    ],
    conclusion: [
      "Duvar kagidi dogru alt yuzey, dogru aks ve dogru detay cozumu ile uygulandiginda mekana hizli karakter kazandiran cok etkili bir kaplama olur. Ayni is hazirliksiz yurutuldugunde ek yeri, kabarma ve kenar acilmasi gibi kusurlari hemen gorunur hale getirir.",
      "Saha tarafinda en dogru yaklasim, duvar kagidini estetik secim kadar teknik yuzey kabulu olarak gormek ve uygulama oncesi hazirligi buna gore yurutmektir. Bu bakis, teslim sonrasi kullanici algisini dogrudan iyilestirir.",
    ],
    sources: [...INCE_DEEP_SOURCES, SOURCE_LEDGER.tsEn13914],
    keywords: ["duvar kagidi", "ek yeri", "alt yuzey hazirligi", "desen plani", "duvar kaplamasi"],
    relatedPaths: ["ince-isler", "ince-isler/duvar-kaplamalari", "ince-isler/duvar-kaplamalari/boya"],
  },
];
