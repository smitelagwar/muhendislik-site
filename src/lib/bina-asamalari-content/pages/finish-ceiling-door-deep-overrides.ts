import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const FINISH_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_13964_SOURCE: BinaGuideSource = {
  title: "TS EN 13964 Asma Tavanlar - Gereklilikler ve Deney Yontemleri",
  shortCode: "TS EN 13964",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Asma tavan tasiyici sistemi, aski elemanlari ve performans cercevesi icin temel referanslardan biridir.",
};

const TS_EN_14351_1_SOURCE: BinaGuideSource = {
  title: "TS EN 14351-1 Pencereler ve Dis Kapilar - Mamul Standardi",
  shortCode: "TS EN 14351-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Dis kapilarda hava, su, ruzgar ve genel performans ozellikleri icin temel urun standardidir.",
};

const CEILING_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Reflected ceiling plan ve MEP overlay", purpose: "Asma tavani aydinlatma, sprinkler ve menfezlerle cakismadan kurgulamak." },
  { category: "Olcum", name: "Lazer nivo, hat ipi ve kot sabitleme cizelgesi", purpose: "Tavan duzlemini goz karariyla degil sayisal olarak kurmak." },
  { category: "Kontrol", name: "Askilik, profil ve kapak panel checklisti", purpose: "Tavanin tasiyici davranisini sadece panel duzlugune indirgememek." },
  { category: "Kayit", name: "Tavan acilir kapak ve servis plani", purpose: "Bakim gereken cihazlarin tavanda kaybolmasini onlemek." },
];

const DOOR_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Kapi detayi, esik kesiti ve cephe baglanti paftasi", purpose: "Dis kapinin yalniz boslugu kapatmasini degil kabuga baglanmasini tanimlamak." },
  { category: "Olcum", name: "Lazer nivo, diyagonal metre ve su testi ekipmani", purpose: "Kasa geometri ve sizdirmazlik kalitesini sayisal olarak teyit etmek." },
  { category: "Kontrol", name: "Hava-su performansi ve donanim checklisti", purpose: "Kanat, kasa, fitil ve esik davranisini tek turda dogrulamak." },
  { category: "Kayit", name: "Mahal bazli kapi teslim formu", purpose: "Her dis kapinin yon, donanim ve eksiklerini ayri izlemek." },
];

const CEILING_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Tasiyici sistem", name: "Ana tasiyici profiller, tali profiller ve aski cubuklari", purpose: "Tavan panellerinin duz ve guvenli tasinacagi karkasi olusturmak.", phase: "Karkas montaji" },
  { group: "Kaplama", name: "Alcipan veya benzeri tavan levhalari, derz ve dolgu malzemeleri", purpose: "Bitmis yuzey duzlugunu ve estetik surekliligi saglamak.", phase: "Kaplama" },
  { group: "Detay", name: "Acilir kapaklar, kenar profilleri ve servis bosluklari", purpose: "Tavan icindeki tesisatin bakim erisimini korumak.", phase: "Detay cozumleri" },
  { group: "Kontrol", name: "Lazer kot ekipmani ve numune dugum seti", purpose: "Karkas ve panel davranisinin teslim oncesi kontrolunu yapmak.", phase: "Kabul" },
];

const DOOR_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kapi seti", name: "Dis kapi kasasi, kanat, esik, fitil ve aksesuarlar", purpose: "Aciklikta yalniz kapanis degil hava-su ve guvenlik performansi saglamak.", phase: "Montaj" },
  { group: "Baglanti", name: "Mekanik ankrajlar, takozlar ve kontrollu dolgu malzemesi", purpose: "Kasayi kabuga saglam baglayip deformasyon riskini azaltmak.", phase: "Sabitleme" },
  { group: "Sizdirmazlik", name: "Bant, mastik, su yalitim veya fitil elemanlari", purpose: "Cephe ile kapi arasindaki en kritik sizinti noktasini korumak.", phase: "Kapanis" },
  { group: "Test", name: "Su testi ekipmani ve ayar donanimi", purpose: "Montaji bitmis kapinin yalniz gorunusunu degil performansini da dogrulamak.", phase: "Teslim" },
];

export const finishCeilingDoorDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/alcipan/asma-tavan",
    kind: "topic",
    quote: "Asma tavan, mekani gizleyen bir kapak degil; tavandaki tum teknik kararlarin duzlem, erisim ve estetik disiplinle bir araya geldigi ortak saha ara yuzudur.",
    tip: "Asma tavani yalniz alcipan kapatma isi gibi gormek, ustundeki tesisat yogunlugunu, servis kapaklarini ve kot toleransini bir anda kontrolsuz bir karmasaya cevirir.",
    intro: [
      "Asma tavan santiyede cogu zaman sonlara dogru gelen, mekanin gorunusunu toparlayan bir ince is kalemi gibi dusunulur. Oysa gercekte asma tavan; aydinlatma, sprinkler, menfez, kamera, hoparlor, kablo tavasi ve bazen yangin damperi gibi pek cok teknik kararin alt yuzde okunur hale geldigi ortak bir koordinasyon zonudur. Bu nedenle bir mekanda tavana bakildiginda ne kadar temiz gorunuyorsa, sahada o kadar cok koordinasyon ve disiplin dogru kurulmus demektir.",
      "Sahada en sik problem, tavan karkasinin mekanik ve elektrik disiplinlerinden once veya onlardan habersiz kurulmasidir. Bu durumda menfezler tavsiye edilen eksenini kaybeder, aydinlatma armaturlari raks eder, sprinkler rozetleri panel merkezini tutmaz, servis gerektiren ekipmanlar ise kapaksiz veya erisimsiz kalir. Sonuc; kes-boz, ek alci, ikinci montaj ve teslimde goz yoran asimetri olur.",
      "Bir insaat muhendisi icin asma tavan yalniz estetik konu degildir. Tavan kotu, aski boyu, boslukta kalan ekipman agirliklari, yangin kacis elemanlari ve servis kapagi gereksinimi birlikte okunmalidir. Aksi halde tavan duz gorunse bile mekanik veya elektrik isletmesi icin problemli hale gelebilir.",
      "Bu yazida asma tavani; teknik teorisi, standart gereksinimleri, sayisal kot ornegi, kullanilan araclar ve saha hatalariyla birlikte derinlestiriyoruz. Hedef, asma tavani sadece panel kapatma isi degil; tavandaki tum disiplinleri kullaniciya temiz bir duzlem olarak sunan muhendislik urunu olarak gostermektir.",
    ],
    theory: [
      "Asma tavanin teorik omurgasi, ustteki teknik yogunluk ile alttaki mekan kalitesi arasinda filtre gorevi gormesidir. Ustte kanallar, borular, kablo tavalar, askilar ve cihazlar yer alir; altta ise mekanin net tavan duzlemi, isik konforu ve akis hissi vardir. Bu iki katman arasindaki iliski plansiz kuruldugunda tavan ya gereksiz alcak olur ya da ustteki tesisata carpan sorunlu bir kapak sistemine donusur.",
      "Karkas davranisi burada kritik unsurlerden biridir. Asma tavan panelleri veya alcipan levhalar kendi basina tavanda asili durmaz; ana ve tali profiller ile aski cubuklari uzerinde tasinir. Profil araliklari, aski duzeni ve cevre kenar profilleri dogru kurulmazsa ilk bakista duz gorunen tavan zamanla sehim, derz catlagi veya ek yeri belirginlesmesi uretir.",
      "Servis erisimi diger temel konudur. Tavanda kalan yangin vanasi, VAV kutusu, elektrik ek kutusu veya kontrol modulu ileride bakim isteyecektir. Tavan kapandi diye bu ekipman yok olmaz. Bu nedenle her cihaz icin teknik hacimde yeterli manevra ve gerekli yerde acilir kapak planlanmalidir. Servis kapagi unutulmus bir asma tavan, ileride delinen ve yamalanan bir yuzeye donusur.",
      "Asma tavan ayni zamanda mekan algisini belirler. Koridor, ofis, lobi veya islak hacimde tavan duzlemi farkli isik ve akustik kararlar tasir. Bu nedenle tavan kotu yalniz 'ne kadar yuksekte kalsin' sorusu degil; hangi ekipman nasil saklanacak, hangi aks vurgulanacak ve bakim nasil yapilacak sorulariyla birlikte ele alinmalidir.",
      "Bu bakisla asma tavan, ustteki kargasayi kapatan bir son katman degil; teknik duzeni kullaniciya hissettirmeden yoneten bir organizasyon sistemidir.",
    ],
    ruleTable: [
      {
        parameter: "Tasiyici karkas ve aski duzeni",
        limitOrRequirement: "Profil ve aski elemanlari duzlem, sehim ve tasima davranisini koruyacak sekilde kurulmalidir",
        reference: "TS EN 13964",
        note: "Asma tavan kalitesi yalniz yuzey panelinden degil tasiyici sistemden baslar.",
      },
      {
        parameter: "Tavan kotu ve koordinasyon boslugu",
        limitOrRequirement: "Net tavan kotu, ustteki MEP yogunlugu ve servis bosluklariyla uyumlu secilmelidir",
        reference: "Reflected ceiling plan + disiplin overlay",
        note: "Tavan yuksekligi teknik bosluk gormeden belirlenmemelidir.",
      },
      {
        parameter: "Servis kapaklari ve erisim",
        limitOrRequirement: "Bakim gerektiren ekipmanlar icin erisim senaryosu korunmalidir",
        reference: "Saha koordinasyon plani",
        note: "Kapagi olmayan cihaz, ileride bozulan tavandir.",
      },
      {
        parameter: "Yangin ve aktif sistem koordinasyonu",
        limitOrRequirement: "Sprinkler, dedektor, armaturluk ve menfez yerleri panel modulasyonu ile uyumlu olmalidir",
        reference: "Yangin Yonetmeligi + MEP paftalari",
        note: "Tavandaki asimetri genelde gec koordinasyonun sonucudur.",
      },
      {
        parameter: "Derz ve bitis kalitesi",
        limitOrRequirement: "Ek yerleri, cevre donusleri ve baglanti detayi boya oncesi numune kalite seviyesinde kapatilmalidir",
        reference: "Uygulama kalite plani",
        note: "Zayif derz disiplini teslimde en hizli fark edilen kusurlardandir.",
      },
    ],
    designOrApplicationSteps: [
      "Reflected ceiling plan, aydinlatma, sprinkler ve mekanik overlay'i ayni kottan okuyup tavan modulasyonunu dondur.",
      "Net tavan kotunu, ustteki en kritik ekipman ve gerekli servis bosluguna gore belirle; yalniz mimari goruntuye gore secme.",
      "Karkas ve aski sistemini aks, profil araligi ve cevre kenarlariyla birlikte sayisal duzene bagla.",
      "Acilir kapaklari sonradan eklenen yama gibi degil, planli servis noktasi olarak tasarla ve sahaya isle.",
      "Levha kapatma oncesi tavan boslugunu bir kalite kapisi gibi kontrol et; eksik ekipman veya carpisan hat varken tavani kapatma.",
      "Derz, boya alti bitis ve cihaz cevresi detaylarini numune mahal mantigiyla tamamla.",
    ],
    criticalChecks: [
      "Net tavan kotu ustteki tesisat ve servis boslugu icin gercekten yeterli mi?",
      "Sprinkler, dedektor ve aydinlatma akslari panel moduluyle uyumlu mu?",
      "Bakim gerektiren ekipmanlar icin acilir kapak veya erisim penceresi unutulmus mu?",
      "Aski ve profil sistemi tum yuzeyde ayni ritimle kurulmus mu?",
      "Derz ve levha eklerinde catlama riski gosteren zayif bolgeler var mi?",
      "Tavan kapatilmadan once ustteki hatlar son kontrol turunden gecti mi?",
    ],
    numericalExample: {
      title: "Asma tavanda net kot hesabina basit bir yaklasim",
      inputs: [
        { label: "Doseme alt kotu", value: "3,20 m", note: "Bitmis doseme ustunden olculen mevcut kot" },
        { label: "En derin mekanik kanal", value: "28 cm", note: "Askilar dahil kritik eleman" },
        { label: "Aydinlatma ve servis boslugu", value: "10 cm", note: "Bakim ve montaj payi" },
        { label: "Tavan karkas + levha payi", value: "7 cm", note: "Profil ve levha sistemi" },
      ],
      assumptions: [
        "Kot hesabinda tek bir kritik aks uzerindeki en buyuk ekipman esas alinmistir.",
        "Mahal duz tavan olarak tasarlanmistir.",
        "Hesap sahada ilk karar icindir; nihai overlay ile teyit edilmelidir.",
      ],
      steps: [
        {
          title: "Toplam teknik boslugu bul",
          formula: "28 + 10 + 7 = 45 cm",
          result: "Asma tavan icin gerekli toplam bosluk yaklasik 45 cm olur.",
          note: "Bu deger yalniz kanal derinligini degil servis ve karkas payini da icerir.",
        },
        {
          title: "Net tavan kotunu hesapla",
          formula: "3,20 - 0,45 = 2,75 m",
          result: "Mekanin net tavan kotu yaklasik 2,75 m seviyesinde olusur.",
          note: "Mimari beklenti ile teknik zorunluluk burada karsilasir.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Eger hedeflenen net kot daha yuksekse mekanik guzergahta, tavan tipinde veya mimari beklentide revizyon gerekir.",
          note: "Asma tavanda kotu sahada zorlayarak degil, disiplinler arasi koordinasyonla kazanirsiniz.",
        },
      ],
      checks: [
        "Asma tavan kotu tek bir ekipmana gore degil en kritik overlay aksina gore secilmelidir.",
        "Servis boslugu unutulursa tavan ilk bakimda kirilir veya acilir kapak eklenir.",
        "Karkas kalinligi ve aydinlatma payi genelde gozden kacirilan degerlerdir.",
        "Mimari yukseklik hedefi teknik overlay ile birlikte revize edilmelidir.",
      ],
      engineeringComment: "Asma tavanda kaybedilen her santimetre, genelde gec koordine edilmis bir teknik kararin bedelidir.",
    },
    tools: CEILING_TOOLS,
    equipmentAndMaterials: CEILING_EQUIPMENT,
    mistakes: [
      { wrong: "Tavan karkasini MEP ekipleriyle koordinasyon bitmeden kapatmak.", correct: "Kapatma oncesi ustteki tum hatlari kalite kapisindan gecirmek." },
      { wrong: "Servis kapaklarini sonradan acilacak delik gibi gormek.", correct: "Bakim ihtiyacini taslakta belirleyip plana islemek." },
      { wrong: "Aydinlatma, sprinkler ve menfezi birbirinden bagimsiz yerlestirmek.", correct: "Reflected ceiling plan uzerinden aksli koordinasyon kurmak." },
      { wrong: "Aski sistemini yalniz panel duzlugune gore degerlendirmek.", correct: "Tasiyici davranisi ve sehim riskini de hesaba katmak." },
      { wrong: "Kot kararini mekanik overlay gormeden vermek.", correct: "En derin ekipman ve servis payina gore net kotu belirlemek." },
      { wrong: "Derz ve bitis kalitesini boyaya havale etmek.", correct: "Levha ve derz kalitesini boya oncesi numune seviyesinde tamamlamak." },
    ],
    designVsField: [
      "Projede asma tavan duz bir cizgi gibi gorunur; sahada ise o cizginin ustunde onlarca teknik karar tasinmaktadir.",
      "Iyi asma tavan mekani sakinlestirir ve teknik ekipmani hissettirmez; kotu asma tavan ise kes-boz ve asimetriyi hemen ele verir.",
      "Bu nedenle tavan kalitesi, yuzey duzlugu kadar ustundeki koordinasyon kalitesinin de aynasidir.",
    ],
    conclusion: [
      "Asma tavan dogru koordinasyon, dogru karkas ve dogru servis mantigi ile kuruldugunda mekani hem teknik hem estetik olarak toparlayan guclu bir sistemdir. Koordinasyon zayif oldugunda ise tavandaki kusurlar tum mekana yayilan bir kalite kaybi yaratir.",
      "Bir insaat muhendisi icin en saglam yaklasim, asma tavani alci kapatma isi degil; tavandaki tum disiplinlerin kullaniciya temiz bir duzlem olarak sunuldugu teknik arayuz olarak gormektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_13964_SOURCE],
    keywords: ["asma tavan", "TS EN 13964", "reflected ceiling plan", "servis kapagi", "tavan kotu"],
    relatedPaths: ["ince-isler", "ince-isler/alcipan", "ince-isler/alcipan/bolme-duvar"],
  },
  {
    slugPath: "ince-isler/kapi-pencere/dis-kapi",
    kind: "topic",
    quote: "Dis kapi, binaya girilen bir aciklik degil; guvenlik, hava-su kontrolu ve cephe butunlugunun ilk temas noktasi olarak calisir.",
    tip: "Dis kapida en sik hata, montaji ic kapi mantigiyla okumak ve esik, sizdirmazlik, ankraj ile cephe baglantisini ikinci plana atmaktir.",
    intro: [
      "Dis kapi bir yapida yalniz gecis elemani degildir. Gunluk kullanicinin ilk dokundugu detaylardan biri oldugu gibi ruzgar, yagmur, toz, hava kacagi ve guvenlik etkileriyle de dogrudan karsilasan bir kabuk bilesenidir. Bu nedenle estetik algisi yuksek olsa da dis kapinin gercek performansi kasa ile duvar arasindaki milimetrelik kararlar, esik detaylari ve donanim secimi tarafindan belirlenir.",
      "Sahada sik gorulen sorunlar genellikle montaj sonrasi hemen fark edilmez. Kapi guzel gorunur, kanat acilip kapanir, teslim de yaklasmistir. Ancak ilk siddetli yagmurda esik altindan su gelir, kisin hava kacagi baslar, gunluk kullanimda kanat ayari bozulur ya da kasa cevre mastigi erken yaslanir. Bunun kok nedeni, dis kapinin sadece marangozluk kalemi gibi okunmasidir.",
      "Bir insaat muhendisi icin dis kapiyi tanimak, yalniz kanat agirligi veya kasa ebatini bilmek demek degildir. Kapi boslugunun duvarla baglantisi, cephe yalitim tabakasi, esik kotu, suyun yonelecegi detay, emniyet gereksinimi ve acil durumda kullanim senaryosu birlikte dusunulmelidir. Aksi halde iyi urun kotu detayda performansini kaybeder.",
      "Bu yazida dis kapiyi; urun standardi, enerji ve kabuk davranisi, sayisal esik kotu ornegi, kullanilan araclar ve sik saha hatalariyla birlikte kapsamli bir blog yazisi biciminde ele aliyoruz. Hedef, dis kapinin sadece gorunen kanat degil, cephe sisteminin zayif veya guclu halkasi oldugunu gostermektir.",
    ],
    theory: [
      "Dis kapinin teorik davranisi uc ana eksende okunur: mekanik calisma, kabuk performansi ve guvenlik. Mekanik calisma; kasa, kanat, mentese ve kilit sisteminin defalarca acilip kapanmaya karsi stabil davranmasidir. Kabuk performansi; hava sizdirmazligi, su gecirimsizlik ve isi kaybi kontroludur. Guvenlik ise darbe, zorlanma ve bazen yangin ya da acil cikis gereksinimi gibi ek beklentileri kapsar.",
      "Kasa ile duvar arasindaki ara yuz burada en kritik bolgelerden biridir. Kapi kasasi ne kadar kaliteli olursa olsun, duvarla baglantisi dogru ankraj, uygun dolgu ve dis hava kosullarina dayanikli sizdirmazlik katmani ile cozulmemisse toplam performans zayiflar. Dis kapinin en zayif noktasi cogu zaman urunun kendisi degil, urunun duvara baglandigi cevre detayidir.",
      "Esik ve alt detay da ayni derecede onemlidir. Kullanici acisindan konforlu ve guvenli gecis saglarken suyu iceri almamali, temizlik ve bakimda sorun uretmemelidir. Yanlis esik detayi ilk bakista goze batmaz; fakat yagmur, yikama suyu ya da ruzgarla suruklenen su etkisinde hizla kendini belli eder. Bu nedenle dis kapi esigi mimari bitisle degil su davranisiyla birlikte okunmalidir.",
      "Ayrica dis kapi enerji performansinin da parcasidir. Isitilan bir hacimde hava kacagi, yalitimsiz kasa cevresi veya zayif fitil sistemi konforu bozar ve enerji kaybini arttirir. Kapinin yalniz guvenlik urunu gibi degerlendirilmesi bu nedenle eksiktir. Cephe sisteminin hava ve isi kontrol zincirine dahil olan aktif bir elemandir.",
      "Dogru dis kapi uygulamasi, urun secimi kadar montaj detayina baglidir. Iyi urun kotu montajla cabuk yipranir; orta seviye urun bile temiz detayla daha uzun omurlu davranabilir. Muhendislik bakisi bu nedenle kapinin katalog degerinden cok saha ara yuzune odaklanir.",
    ],
    ruleTable: [
      {
        parameter: "Urun performans sinifi",
        limitOrRequirement: "Dis kapi hava, su, ruzgar ve kullanim senaryosuna uygun performans kriterleri ile secilmelidir",
        reference: "TS EN 14351-1",
        note: "Dis kapinin urun standardi yalniz ebat degil performans beklentisi tarif eder.",
      },
      {
        parameter: "Esik ve su yonu detayi",
        limitOrRequirement: "Esik, yagmur suyu ve yikama suyu iceri yonlenmeyecek sekilde kot ve detayla cozulmelidir",
        reference: "Cephe ve bitis detay plani",
        note: "Dis kapida su davranisi genelde alt detayda belirginlesir.",
      },
      {
        parameter: "Kasa-duvar baglantisi",
        limitOrRequirement: "Kasa mekanik ankrajla sabitlenmeli, cevre dolgu ve sizdirmazlik katmanlari dis kosullara uygun uygulanmalidir",
        reference: "TS EN 14351-1 + uygulama kalite plani",
        note: "Kopuk tek basina uzun omurlu dis detay cozumune yetmez.",
      },
      {
        parameter: "Enerji ve hava sizdirmazligi",
        limitOrRequirement: "Kasa cevresi ve kanat fitil sistemi isi kaybini ve hava kacagini azaltacak butunlukte olmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Dis kapi konfor ve enerji zincirinin ilk zayif halkasi olabilir.",
      },
      {
        parameter: "Kullanim ve guvenlik",
        limitOrRequirement: "Donanim, kilit, panic acilim veya yogun kullanim gereksinimi mahal fonksiyonuna gore secilmelidir",
        reference: "Mimari kullanici senaryosu + yangin gereksinimleri",
        note: "Ana giris, teknik hacim ve cikis kapilari ayni beklentiye sahip degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Dis kapi tipini cephe maruziyeti, kullanim yogunlugu ve guvenlik ihtiyacina gore belirle; ic kapi mantigiyla urun secme.",
      "Kapi boslugunu kaba aciklik olarak degil, bitmis cephe ve zemin kotlariyla birlikte yeniden olc.",
      "Kasa ankrajlarini mekanik olarak kur, cevre dolgu ve sizdirmazlik detayini ic-dis ayrimina gore planla.",
      "Esik, denizlik ve cephe birlesimini suyun yonelecegi mantikla cozumle; yalniz guzel bitis arama.",
      "Kanat ayari, fitil baskisi ve kilit karsiligini fonksiyon testi kadar su ve hava davranisi acisindan da kontrol et.",
      "Teslim oncesi su testi ve detay kontrolu yaparak mastik ve fitil performansini kayda bagla.",
    ],
    criticalChecks: [
      "Esik kotu ve dis zemin egimi suyu kapidan uzaklastiriyor mu?",
      "Kasa cevresinde mekanik ankraj, dolgu ve dis hava kosuluna uygun sizdirmazlik birlikte var mi?",
      "Kanat-fitil baskisi tum cevrede esit calisiyor mu?",
      "Kapi onunde veya arkasinda hareketi engelleyen mimari carpismalar var mi?",
      "Ana giris gibi yogun kullanimli noktalarda donanim kapasitesi uygun mu?",
      "Su testi veya duman kalemi benzeri kontrolle hava-su kacagi teyit edildi mi?",
    ],
    numericalExample: {
      title: "Dis kapi esik kotunda su guvenligi yorumu",
      inputs: [
        { label: "Dis zemin kotu", value: "+0,00", note: "Referans yaya giris kotu" },
        { label: "Ic bitmis doseme kotu", value: "+0,05 m", note: "Ic mekanda 5 cm yukari seviye" },
        { label: "Esik ust kotu", value: "+0,03 m", note: "Mevcut montaj karari" },
        { label: "Hedef", value: "Yagmur suyuna karsi alt detay riskini yorumlamak", note: "Kavramsal saha kontrolu" },
      ],
      assumptions: [
        "Dis zeminde yagmur suyunu uzaklastiran ek bir oluk detayi bulunmadigi varsayilmistir.",
        "Kapinin maruziyeti acik hava kosullarina yakindir.",
        "Hesap kesin detay yerine saha mantigini gostermek icindir.",
      ],
      steps: [
        {
          title: "Dis zemin ile esik arasindaki farki oku",
          formula: "+0,03 - +0,00 = 3 cm",
          result: "Esik dis zeminden yalniz 3 cm yukaridadir.",
          note: "Yuksek maruziyetli bir noktada bu fark tek basina her zaman yeterli olmayabilir.",
        },
        {
          title: "Ic mekan kotuyla karsilastir",
          formula: "+0,05 - +0,03 = 2 cm",
          result: "Ic bitmis doseme esikten 2 cm yuksektir; suyun iceri girmesi halinde tampon alan sinirlidir.",
          note: "Detay yalniz yurume konforu degil su guvenligi acisindan da okunmalidir.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Esik kotu, dis zemin egimi ve gerekirse oluk veya su kesici detayla birlikte yeniden cozulmelidir.",
          note: "Dis kapida alt detay sonradan mastikle kurtarilacak bir konu degildir.",
        },
      ],
      checks: [
        "Esik karari dis zemin egimi ve tahliye mantigiyla birlikte okunmalidir.",
        "Yagmur maruziyeti yuksek cephelerde kucuk kot farklari yeterli olmayabilir.",
        "Kasa fitili ile esik detayi birbirini tamamlayan iki farkli koruma katmanidir.",
        "Su testini yalniz kanat cevresinde degil alt detayda yogunlastirmak gerekir.",
      ],
      engineeringComment: "Dis kapida en masrafli revizyonlardan biri, teslimden sonra anlasilan esik ve su yonu hatasidir.",
    },
    tools: DOOR_TOOLS,
    equipmentAndMaterials: DOOR_EQUIPMENT,
    mistakes: [
      { wrong: "Dis kapida ic kapi montaj aliskanligini uygulamak.", correct: "Esik, sizdirmazlik ve cephe baglantisini ayri bir teknik konu olarak ele almak." },
      { wrong: "Kasayi yalniz kopuk ve mastige guvenerek sabitlemek.", correct: "Mekanik ankraj ve katmanli sizdirmazlik mantigi kurmak." },
      { wrong: "Esik kotunu sadece rahat yurume acisindan degerlendirmek.", correct: "Su davranisi ve ic-dis kot iliskisini birlikte okumak." },
      { wrong: "Su testini atlayip yalniz acilma-kapanma kontrolu yapmak.", correct: "Performansi hava ve su acisindan da dogrulamak." },
      { wrong: "Yogun kullanimli ana girislerde zayif donanim secmek.", correct: "Kullanim senaryosuna gore mentese, kilit ve kol takimini belirlemek." },
      { wrong: "Cephe yalitim tabakasi ile kapi kasasi ara yuzunu bos birakmak.", correct: "Kasa cevresini kabuk butunlugunun parcasi olarak cozumlemek." },
    ],
    designVsField: [
      "Projede dis kapi bir sembol ve ebat tablosudur; sahada ise ruzgar, yagmur, guvenlik ve gunluk kullanim ayni anda kapinin uzerine biner.",
      "Iyi dis kapi sessiz kapanir, ruzgarli havada rahatsiz etmez ve yagmurda sorun cikarmaz; kotu detay ise ilk mevsimde kendini belli eder.",
      "Bu nedenle dis kapi kalitesi, katalog fotografindan cok esik ve kasa-cevre detayinda olculur.",
    ],
    conclusion: [
      "Dis kapi dogru urun secimi kadar dogru montaj detayiyla performans gosterir. Esik, kasa-duvar baglantisi ve sizdirmazlik katmanlari duzgun cozuldugunda kapi hem guvenlik hem de kabuk kalitesi icin guclu bir eleman olur.",
      "Bir insaat muhendisi icin en dogru bakis, dis kapinin dekoratif bir tamamlayici degil; cephe butunlugunun ve kullanici guvenliginin aktif bir parcasi oldugunu kabul etmektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, SOURCE_LEDGER.planliAlanlar, TS_EN_14351_1_SOURCE],
    keywords: ["dis kapi", "TS EN 14351-1", "esik detayi", "hava sizdirmazligi", "su testi"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere", "ince-isler/kapi-pencere/ic-kapi"],
  },
];
