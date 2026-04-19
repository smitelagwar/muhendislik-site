import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const FINISH_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_13964_SOURCE: BinaGuideSource = {
  title: "TS EN 13964 Asma Tavanlar - Gereklilikler ve Deney Yontemleri",
  shortCode: "TS EN 13964",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Asma tavan taşıyıcı sistemi, aski elemanlari ve performans cercevesi için temel referanslardan biridir.",
};

const TS_EN_14351_1_SOURCE: BinaGuideSource = {
  title: "TS EN 14351-1 Pencereler ve Dış Kapılar - Mamul Standardi",
  shortCode: "TS EN 14351-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Dış kapilarda hava, su, rüzgar ve genel performans ozellikleri için temel urun standardidir.",
};

const CEILING_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Reflected ceiling plan ve MEP overlay", purpose: "Asma tavani aydinlatma, sprinkler ve menfezlerle cakismadan kurgulamak." },
  { category: "Ölçüm", name: "Lazer nivo, hat ipi ve kot sabitleme cizelgesi", purpose: "Tavan duzlemini göz karariyla degil sayisal olarak kurmak." },
  { category: "Kontrol", name: "Askilik, profil ve kapak panel checklisti", purpose: "Tavanin taşıyıcı davranisini sadece panel duzlugune indirgememek." },
  { category: "Kayıt", name: "Tavan acilir kapak ve servis plani", purpose: "Bakım gereken cihazlarin tavanda kaybolmasini onlemek." },
];

const DOOR_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Kapı detayi, esik kesiti ve cephe bağlantı paftasi", purpose: "Dış kapının yalnız boslugu kapatmasini degil kabuga baglanmasini tanimlamak." },
  { category: "Ölçüm", name: "Lazer nivo, diyagonal metre ve su testi ekipmani", purpose: "Kasa geometri ve sızdırmazlık kalitesini sayisal olarak teyit etmek." },
  { category: "Kontrol", name: "Hava-su performansi ve donanim checklisti", purpose: "Kanat, kasa, fitil ve esik davranisini tek turda dogrulamak." },
  { category: "Kayıt", name: "Mahal bazli kapı teslim formu", purpose: "Her dış kapının yon, donanim ve eksiklerini ayri izlemek." },
];

const CEILING_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Taşıyıcı sistem", name: "Ana taşıyıcı profiller, tali profiller ve aski cubuklari", purpose: "Tavan panellerinin duz ve guvenli tasinacagi karkasi olusturmak.", phase: "Karkas montaji" },
  { group: "Kaplama", name: "Alcipan veya benzeri tavan levhalari, derz ve dolgu malzemeleri", purpose: "Bitmis yüzey duzlugunu ve estetik surekliligi saglamak.", phase: "Kaplama" },
  { group: "Detay", name: "Acilir kapaklar, kenar profilleri ve servis bosluklari", purpose: "Tavan icindeki tesisatin bakım erisimini korumak.", phase: "Detay cozumleri" },
  { group: "Kontrol", name: "Lazer kot ekipmani ve numune dugum seti", purpose: "Karkas ve panel davranisinin teslim öncesi kontrolunu yapmak.", phase: "Kabul" },
];

const DOOR_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kapı seti", name: "Dış kapı kasasi, kanat, esik, fitil ve aksesuarlar", purpose: "Aciklikta yalnız kapanis degil hava-su ve güvenlik performansi saglamak.", phase: "Montaj" },
  { group: "Bağlantı", name: "Mekanik ankrajlar, takozlar ve kontrollu dolgu malzemesi", purpose: "Kasayi kabuga saglam baglayip deformasyon riskini azaltmak.", phase: "Sabitleme" },
  { group: "Sızdırmazlık", name: "Bant, mastik, su yalitim veya fitil elemanlari", purpose: "Cephe ile kapı arasindaki en kritik sızıntı noktasini korumak.", phase: "Kapanis" },
  { group: "Test", name: "Su testi ekipmani ve ayar donanimi", purpose: "Montaji bitmis kapının yalnız gorunusunu degil performansini da dogrulamak.", phase: "Teslim" },
];

export const finishCeilingDoorDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/alcipan/asma-tavan",
    kind: "topic",
    quote: "Asma tavan, mekani gizleyen bir kapak degil; tavandaki tüm teknik kararlarin duzlem, erişim ve estetik disiplinle bir araya geldigi ortak saha ara yuzudur.",
    tip: "Asma tavani yalnız alcipan kapatma isi gibi gormek, ustundeki tesisat yogunlugunu, servis kapaklarini ve kot toleransini bir anda kontrolsuz bir karmasaya cevirir.",
    intro: [
      "Asma tavan santiyede cogu zaman sonlara doğru gelen, mekanin gorunusunu toparlayan bir ince iş kalemi gibi dusunulur. Oysa gercekte asma tavan; aydinlatma, sprinkler, menfez, kamera, hoparlor, kablo tavasi ve bazen yangin damperi gibi pek çok teknik kararin alt yuzde okunur hale geldigi ortak bir koordinasyon zonudur. Bu nedenle bir mekanda tavana bakildiginda ne kadar temiz gorunuyorsa, sahada o kadar çok koordinasyon ve disiplin doğru kurulmus demektir.",
      "Sahada en sık problem, tavan karkasinin mekanik ve elektrik disiplinlerinden once veya onlardan habersiz kurulmasidir. Bu durumda menfezler tavsiye edilen eksenini kaybeder, aydinlatma armaturlari raks eder, sprinkler rozetleri panel merkezini tutmaz, servis gerektiren ekipmanlar ise kapaksiz veya erisimsiz kalir. Sonuc; kes-boz, ek alci, ikinci montaj ve teslimde göz yoran asimetri olur.",
      "Bir insaat muhendisi için asma tavan yalnız estetik konu degildir. Tavan kötü, aski boyu, boslukta kalan ekipman agirliklari, yangin kacis elemanlari ve servis kapagi gereksinimi birlikte okunmalidir. Aksi halde tavan duz gorunse bile mekanik veya elektrik isletmesi için problemli hale gelebilir.",
      "Bu yazida asma tavani; teknik teorisi, standart gereksinimleri, sayisal kot ornegi, kullanilan araçlar ve saha hatalariyla birlikte derinlestiriyoruz. Hedef, asma tavani sadece panel kapatma isi degil; tavandaki tüm disiplinleri kullaniciya temiz bir duzlem olarak sunan muhendislik urunu olarak gostermektir.",
    ],
    theory: [
      "Asma tavanin teorik omurgasi, ustteki teknik yogunluk ile alttaki mekan kalitesi arasinda filtre gorevi gormesidir. Ustte kanallar, borular, kablo tavalar, askilar ve cihazlar yer alir; altta ise mekanin net tavan duzlemi, isik konforu ve akis hissi vardir. Bu iki katman arasindaki iliski plansiz kuruldugunda tavan ya gereksiz alcak olur ya da ustteki tesisata carpan sorunlu bir kapak sistemine donusur.",
      "Karkas davranisi burada kritik unsurlerden biridir. Asma tavan panelleri veya alcipan levhalar kendi basina tavanda asili durmaz; ana ve tali profiller ile aski cubuklari üzerinde tasinir. Profil araliklari, aski duzeni ve çevre kenar profilleri doğru kurulmazsa ilk bakista duz gorunen tavan zamanla sehim, derz catlagi veya ek yeri belirginlesmesi uretir.",
      "Servis erisimi diger temel konudur. Tavanda kalan yangin vanasi, VAV kutusu, elektrik ek kutusu veya kontrol modulu ileride bakım isteyecektir. Tavan kapandi diye bu ekipman yok olmaz. Bu nedenle her cihaz için teknik hacimde yeterli manevra ve gerekli yerde acilir kapak planlanmalidir. Servis kapagi unutulmus bir asma tavan, ileride delinen ve yamalanan bir yuzeye donusur.",
      "Asma tavan aynı zamanda mekan algisini belirler. Koridor, ofis, lobi veya islak hacimde tavan duzlemi farkli isik ve akustik kararlar tasir. Bu nedenle tavan kötü yalnız 'ne kadar yuksekte kalsin' sorusu degil; hangi ekipman nasil saklanacak, hangi aks vurgulanacak ve bakım nasil yapilacak sorulariyla birlikte ele alinmalidir.",
      "Bu bakisla asma tavan, ustteki kargasayi kapatan bir son katman degil; teknik duzeni kullaniciya hissettirmeden yoneten bir organizasyon sistemidir.",
    ],
    ruleTable: [
      {
        parameter: "Taşıyıcı karkas ve aski duzeni",
        limitOrRequirement: "Profil ve aski elemanlari duzlem, sehim ve tasima davranisini koruyacak sekilde kurulmalidir",
        reference: "TS EN 13964",
        note: "Asma tavan kalitesi yalnız yüzey panelinden degil taşıyıcı sistemden baslar.",
      },
      {
        parameter: "Tavan kötü ve koordinasyon boslugu",
        limitOrRequirement: "Net tavan kötü, ustteki MEP yogunlugu ve servis bosluklariyla uyumlu secilmelidir",
        reference: "Reflected ceiling plan + disiplin overlay",
        note: "Tavan yuksekligi teknik bosluk gormeden belirlenmemelidir.",
      },
      {
        parameter: "Servis kapaklari ve erişim",
        limitOrRequirement: "Bakım gerektiren ekipmanlar için erişim senaryosu korunmalidir",
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
        limitOrRequirement: "Ek yerleri, çevre donusleri ve bağlantı detayi boya öncesi numune kalite seviyesinde kapatilmalidir",
        reference: "Uygulama kalite plani",
        note: "Zayif derz disiplini teslimde en hızlı fark edilen kusurlardandir.",
      },
    ],
    designOrApplicationSteps: [
      "Reflected ceiling plan, aydinlatma, sprinkler ve mekanik overlay'i aynı kottan okuyup tavan modulasyonunu dondur.",
      "Net tavan kotunu, ustteki en kritik ekipman ve gerekli servis bosluguna göre belirle; yalnız mimari goruntuye göre secme.",
      "Karkas ve aski sistemini aks, profil araligi ve çevre kenarlariyla birlikte sayisal duzene bagla.",
      "Acilir kapaklari sonradan eklenen yama gibi degil, planli servis noktasi olarak tasarla ve sahaya isle.",
      "Levha kapatma öncesi tavan boslugunu bir kalite kapisi gibi kontrol et; eksik ekipman veya carpisan hat varken tavani kapatma.",
      "Derz, boya alti bitis ve cihaz cevresi detaylarini numune mahal mantigiyla tamamla.",
    ],
    criticalChecks: [
      "Net tavan kötü ustteki tesisat ve servis boslugu için gercekten yeterli mi?",
      "Sprinkler, dedektor ve aydinlatma akslari panel moduluyle uyumlu mu?",
      "Bakım gerektiren ekipmanlar için acilir kapak veya erişim penceresi unutulmus mu?",
      "Aski ve profil sistemi tüm yuzeyde aynı ritimle kurulmus mu?",
      "Derz ve levha eklerinde catlama riski gosteren zayif bolgeler var mi?",
      "Tavan kapatilmadan once ustteki hatlar son kontrol turunden gecti mi?",
    ],
    numericalExample: {
      title: "Asma tavanda net kot hesabina basit bir yaklasim",
      inputs: [
        { label: "Doseme alt kötü", value: "3,20 m", note: "Bitmis doseme ustunden olculen mevcut kot" },
        { label: "En derin mekanik kanal", value: "28 cm", note: "Askilar dahil kritik eleman" },
        { label: "Aydinlatma ve servis boslugu", value: "10 cm", note: "Bakım ve montaj payi" },
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
          result: "Asma tavan için gerekli toplam bosluk yaklasik 45 cm olur.",
          note: "Bu deger yalnız kanal derinligini degil servis ve karkas payini da icerir.",
        },
        {
          title: "Net tavan kotunu hesapla",
          formula: "3,20 - 0,45 = 2,75 m",
          result: "Mekanin net tavan kötü yaklasik 2,75 m seviyesinde olusur.",
          note: "Mimari beklenti ile teknik zorunluluk burada karsilasir.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Eger hedeflenen net kot daha yuksekse mekanik guzergahta, tavan tipinde veya mimari beklentide revizyon gerekir.",
          note: "Asma tavanda kötü sahada zorlayarak degil, disiplinler arasi koordinasyonla kazanirsiniz.",
        },
      ],
      checks: [
        "Asma tavan kötü tek bir ekipmana göre degil en kritik overlay aksina göre secilmelidir.",
        "Servis boslugu unutulursa tavan ilk bakimda kirilir veya acilir kapak eklenir.",
        "Karkas kalinligi ve aydinlatma payi genelde gözden kacirilan degerlerdir.",
        "Mimari yukseklik hedefi teknik overlay ile birlikte revize edilmelidir.",
      ],
      engineeringComment: "Asma tavanda kaybedilen her santimetre, genelde gec koordine edilmis bir teknik kararin bedelidir.",
    },
    tools: CEILING_TOOLS,
    equipmentAndMaterials: CEILING_EQUIPMENT,
    mistakes: [
      { wrong: "Tavan karkasini MEP ekipleriyle koordinasyon bitmeden kapatmak.", correct: "Kapatma öncesi ustteki tüm hatlari kalite kapisindan gecirmek." },
      { wrong: "Servis kapaklarini sonradan acilacak delik gibi gormek.", correct: "Bakım ihtiyacini taslakta belirleyip plana islemek." },
      { wrong: "Aydinlatma, sprinkler ve menfezi birbirinden bagimsiz yerlestirmek.", correct: "Reflected ceiling plan uzerinden aksli koordinasyon kurmak." },
      { wrong: "Aski sistemini yalnız panel duzlugune göre degerlendirmek.", correct: "Taşıyıcı davranisi ve sehim riskini de hesaba katmak." },
      { wrong: "Kot kararini mekanik overlay gormeden vermek.", correct: "En derin ekipman ve servis payina göre net kötü belirlemek." },
      { wrong: "Derz ve bitis kalitesini boyaya havale etmek.", correct: "Levha ve derz kalitesini boya öncesi numune seviyesinde tamamlamak." },
    ],
    designVsField: [
      "Projede asma tavan duz bir cizgi gibi görünür; sahada ise o cizginin ustunde onlarca teknik karar tasinmaktadir.",
      "Iyi asma tavan mekani sakinlestirir ve teknik ekipmani hissettirmez; kötü asma tavan ise kes-boz ve asimetriyi hemen ele verir.",
      "Bu nedenle tavan kalitesi, yüzey duzlugu kadar ustundeki koordinasyon kalitesinin de aynasidir.",
    ],
    conclusion: [
      "Asma tavan doğru koordinasyon, doğru karkas ve doğru servis mantigi ile kuruldugunda mekani hem teknik hem estetik olarak toparlayan guclu bir sistemdir. Koordinasyon zayif oldugunda ise tavandaki kusurlar tüm mekana yayilan bir kalite kaybi yaratir.",
      "Bir insaat muhendisi için en saglam yaklasim, asma tavani alci kapatma isi degil; tavandaki tüm disiplinlerin kullaniciya temiz bir duzlem olarak sunuldugu teknik arayuz olarak gormektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_13964_SOURCE],
    keywords: ["asma tavan", "TS EN 13964", "reflected ceiling plan", "servis kapagi", "tavan kötü"],
    relatedPaths: ["ince-isler", "ince-isler/alcipan", "ince-isler/alcipan/bolme-duvar"],
  },
  {
    slugPath: "ince-isler/kapi-pencere/dis-kapi",
    kind: "topic",
    quote: "Dış kapı, binaya girilen bir aciklik degil; güvenlik, hava-su kontrolu ve cephe butunlugunun ilk temas noktasi olarak calisir.",
    tip: "Dış kapida en sık hata, montaji iç kapı mantigiyla okumak ve esik, sızdırmazlık, ankraj ile cephe baglantisini ikinci plana atmaktir.",
    intro: [
      "Dış kapı bir yapida yalnız geçiş elemani degildir. Gunluk kullanicinin ilk dokundugu detaylardan biri oldugu gibi rüzgar, yagmur, toz, hava kacagi ve güvenlik etkileriyle de doğrudan karsilasan bir kabuk bilesenidir. Bu nedenle estetik algisi yuksek olsa da dış kapının gercek performansi kasa ile duvar arasindaki milimetrelik kararlar, esik detaylari ve donanim secimi tarafindan belirlenir.",
      "Sahada sık gorulen sorunlar genellikle montaj sonrasi hemen fark edilmez. Kapı güzel görünür, kanat acilip kapanir, teslim de yaklasmistir. Ancak ilk siddetli yagmurda esik altindan su gelir, kisin hava kacagi baslar, gunluk kullanimda kanat ayari bozulur ya da kasa çevre mastigi erken yaslanir. Bunun kok nedeni, dış kapının sadece marangozluk kalemi gibi okunmasidir.",
      "Bir insaat muhendisi için dış kapiyi tanimak, yalnız kanat agirligi veya kasa ebatini bilmek demek degildir. Kapı boslugunun duvarla baglantisi, cephe yalitim tabakasi, esik kötü, suyun yonelecegi detay, emniyet gereksinimi ve acil durumda kullanım senaryosu birlikte dusunulmelidir. Aksi halde iyi urun kötü detayda performansini kaybeder.",
      "Bu yazida dış kapiyi; urun standardi, enerji ve kabuk davranisi, sayisal esik kötü ornegi, kullanilan araçlar ve sık saha hatalariyla birlikte kapsamli bir blog yazisi biciminde ele aliyoruz. Hedef, dış kapının sadece gorunen kanat degil, cephe sisteminin zayif veya guclu halkasi oldugunu gostermektir.",
    ],
    theory: [
      "Dış kapının teorik davranisi uc ana eksende okunur: mekanik çalışma, kabuk performansi ve güvenlik. Mekanik çalışma; kasa, kanat, mentese ve kilit sisteminin defalarca acilip kapanmaya karsi stabil davranmasidir. Kabuk performansi; hava sizdirmazligi, su gecirimsizlik ve isi kaybi kontroludur. Güvenlik ise darbe, zorlanma ve bazen yangin ya da acil cikis gereksinimi gibi ek beklentileri kapsar.",
      "Kasa ile duvar arasindaki ara yuz burada en kritik bolgelerden biridir. Kapı kasasi ne kadar kaliteli olursa olsun, duvarla baglantisi doğru ankraj, uygun dolgu ve dış hava kosullarina dayanikli sızdırmazlık katmani ile cozulmemisse toplam performans zayiflar. Dış kapının en zayif noktasi cogu zaman urunun kendisi degil, urunun duvara baglandigi çevre detayidir.",
      "Esik ve alt detay da aynı derecede onemlidir. Kullanıcı acisindan konforlu ve guvenli geçiş saglarken suyu iceri almamali, temizlik ve bakimda sorun uretmemelidir. Yanlış esik detayi ilk bakista goze batmaz; fakat yagmur, yikama suyu ya da ruzgarla suruklenen su etkisinde hizla kendini belli eder. Bu nedenle dış kapı esigi mimari bitisle degil su davranisiyla birlikte okunmalidir.",
      "Ayrıca dış kapı enerji performansinin da parcasidir. Isitilan bir hacimde hava kacagi, yalıtımsız kasa cevresi veya zayif fitil sistemi konforu bozar ve enerji kaybini arttırır. Kapının yalnız güvenlik urunu gibi degerlendirilmesi bu nedenle eksiktir. Cephe sisteminin hava ve isi kontrol zincirine dahil olan aktif bir elemandir.",
      "Doğru dış kapı uygulamasi, urun secimi kadar montaj detayina baglidir. Iyi urun kötü montajla cabuk yipranir; orta seviye urun bile temiz detayla daha uzun omurlu davranabilir. Muhendislik bakisi bu nedenle kapının katalog degerinden çok saha ara yuzune odaklanir.",
    ],
    ruleTable: [
      {
        parameter: "Urun performans sinifi",
        limitOrRequirement: "Dış kapı hava, su, rüzgar ve kullanım senaryosuna uygun performans kriterleri ile secilmelidir",
        reference: "TS EN 14351-1",
        note: "Dış kapının urun standardi yalnız ebat degil performans beklentisi tarif eder.",
      },
      {
        parameter: "Esik ve su yonu detayi",
        limitOrRequirement: "Esik, yagmur suyu ve yikama suyu iceri yonlenmeyecek sekilde kot ve detayla cozulmelidir",
        reference: "Cephe ve bitis detay plani",
        note: "Dış kapida su davranisi genelde alt detayda belirginlesir.",
      },
      {
        parameter: "Kasa-duvar baglantisi",
        limitOrRequirement: "Kasa mekanik ankrajla sabitlenmeli, çevre dolgu ve sızdırmazlık katmanlari dış kosullara uygun uygulanmalidir",
        reference: "TS EN 14351-1 + uygulama kalite plani",
        note: "Kopuk tek basina uzun omurlu dış detay cozumune yetmez.",
      },
      {
        parameter: "Enerji ve hava sizdirmazligi",
        limitOrRequirement: "Kasa cevresi ve kanat fitil sistemi isi kaybini ve hava kacagini azaltacak butunlukte olmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Dış kapı konfor ve enerji zincirinin ilk zayif halkasi olabilir.",
      },
      {
        parameter: "Kullanım ve güvenlik",
        limitOrRequirement: "Donanim, kilit, panic acilim veya yoğun kullanım gereksinimi mahal fonksiyonuna göre secilmelidir",
        reference: "Mimari kullanıcı senaryosu + yangin gereksinimleri",
        note: "Ana giriş, teknik hacim ve cikis kapilari aynı beklentiye sahip degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Dış kapı tipini cephe maruziyeti, kullanım yogunlugu ve güvenlik ihtiyacina göre belirle; iç kapı mantigiyla urun secme.",
      "Kapı boslugunu kaba aciklik olarak degil, bitmis cephe ve zemin kotlariyla birlikte yeniden olc.",
      "Kasa ankrajlarini mekanik olarak kur, çevre dolgu ve sızdırmazlık detayini iç-dış ayrimina göre planla.",
      "Esik, denizlik ve cephe birlesimini suyun yonelecegi mantikla cozumle; yalnız güzel bitis arama.",
      "Kanat ayari, fitil baskisi ve kilit karsiligini fonksiyon testi kadar su ve hava davranisi acisindan da kontrol et.",
      "Teslim öncesi su testi ve detay kontrolu yaparak mastik ve fitil performansini kayda bagla.",
    ],
    criticalChecks: [
      "Esik kötü ve dış zemin egimi suyu kapidan uzaklastiriyor mu?",
      "Kasa cevresinde mekanik ankraj, dolgu ve dış hava kosuluna uygun sızdırmazlık birlikte var mi?",
      "Kanat-fitil baskisi tüm cevrede esit calisiyor mu?",
      "Kapı onunde veya arkasinda hareketi engelleyen mimari carpismalar var mi?",
      "Ana giriş gibi yoğun kullanimli noktalarda donanim kapasitesi uygun mu?",
      "Su testi veya duman kalemi benzeri kontrolle hava-su kacagi teyit edildi mi?",
    ],
    numericalExample: {
      title: "Dış kapı esik kotunda su guvenligi yorumu",
      inputs: [
        { label: "Dış zemin kötü", value: "+0,00", note: "Referans yaya giriş kötü" },
        { label: "İç bitmis doseme kötü", value: "+0,05 m", note: "İç mekanda 5 cm yukari seviye" },
        { label: "Esik üst kötü", value: "+0,03 m", note: "Mevcut montaj karari" },
        { label: "Hedef", value: "Yagmur suyuna karsi alt detay riskini yorumlamak", note: "Kavramsal saha kontrolu" },
      ],
      assumptions: [
        "Dış zeminde yagmur suyunu uzaklastiran ek bir oluk detayi bulunmadigi varsayilmistir.",
        "Kapının maruziyeti acik hava kosullarina yakindir.",
        "Hesap kesin detay yerine saha mantigini gostermek icindir.",
      ],
      steps: [
        {
          title: "Dış zemin ile esik arasindaki farki oku",
          formula: "+0,03 - +0,00 = 3 cm",
          result: "Esik dış zeminden yalnız 3 cm yukaridadir.",
          note: "Yuksek maruziyetli bir noktada bu fark tek basina her zaman yeterli olmayabilir.",
        },
        {
          title: "İç mekan kotuyla karsilastir",
          formula: "+0,05 - +0,03 = 2 cm",
          result: "İç bitmis doseme esikten 2 cm yuksektir; suyun iceri girmesi halinde tampon alan sinirlidir.",
          note: "Detay yalnız yürüme konforu degil su guvenligi acisindan da okunmalidir.",
        },
        {
          title: "Muhendislik kararini bagla",
          result: "Esik kötü, dış zemin egimi ve gerekirse oluk veya su kesici detayla birlikte yeniden cozulmelidir.",
          note: "Dış kapida alt detay sonradan mastikle kurtarilacak bir konu degildir.",
        },
      ],
      checks: [
        "Esik karari dış zemin egimi ve tahliye mantigiyla birlikte okunmalidir.",
        "Yagmur maruziyeti yuksek cephelerde küçük kot farklari yeterli olmayabilir.",
        "Kasa fitili ile esik detayi birbirini tamamlayan iki farkli koruma katmanidir.",
        "Su testini yalnız kanat cevresinde degil alt detayda yogunlastirmak gerekir.",
      ],
      engineeringComment: "Dış kapida en masrafli revizyonlardan biri, teslimden sonra anlasilan esik ve su yonu hatasidir.",
    },
    tools: DOOR_TOOLS,
    equipmentAndMaterials: DOOR_EQUIPMENT,
    mistakes: [
      { wrong: "Dış kapida iç kapı montaj aliskanligini uygulamak.", correct: "Esik, sızdırmazlık ve cephe baglantisini ayri bir teknik konu olarak ele almak." },
      { wrong: "Kasayi yalnız kopuk ve mastige guvenerek sabitlemek.", correct: "Mekanik ankraj ve katmanli sızdırmazlık mantigi kurmak." },
      { wrong: "Esik kotunu sadece rahat yürüme acisindan degerlendirmek.", correct: "Su davranisi ve iç-dış kot iliskisini birlikte okumak." },
      { wrong: "Su testini atlayip yalnız acilma-kapanma kontrolu yapmak.", correct: "Performansi hava ve su acisindan da dogrulamak." },
      { wrong: "Yoğun kullanimli ana girislerde zayif donanim secmek.", correct: "Kullanım senaryosuna göre mentese, kilit ve kol takimini belirlemek." },
      { wrong: "Cephe yalitim tabakasi ile kapı kasasi ara yuzunu bos birakmak.", correct: "Kasa cevresini kabuk butunlugunun parçası olarak cozumlemek." },
    ],
    designVsField: [
      "Projede dış kapı bir sembol ve ebat tablosudur; sahada ise rüzgar, yagmur, güvenlik ve gunluk kullanım aynı anda kapının uzerine biner.",
      "Iyi dış kapı sessiz kapanir, ruzgarli havada rahatsiz etmez ve yagmurda sorun cikarmaz; kötü detay ise ilk mevsimde kendini belli eder.",
      "Bu nedenle dış kapı kalitesi, katalog fotografindan çok esik ve kasa-çevre detayinda olculur.",
    ],
    conclusion: [
      "Dış kapı doğru urun secimi kadar doğru montaj detayiyla performans gosterir. Esik, kasa-duvar baglantisi ve sızdırmazlık katmanlari düzgün cozuldugunda kapı hem güvenlik hem de kabuk kalitesi için guclu bir eleman olur.",
      "Bir insaat muhendisi için en doğru bakis, dış kapının dekoratif bir tamamlayici degil; cephe butunlugunun ve kullanıcı guvenliginin aktif bir parçası oldugunu kabul etmektir.",
    ],
    sources: [...FINISH_BATCH_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi, SOURCE_LEDGER.planliAlanlar, TS_EN_14351_1_SOURCE],
    keywords: ["dış kapı", "TS EN 14351-1", "esik detayi", "hava sizdirmazligi", "su testi"],
    relatedPaths: ["ince-isler", "ince-isler/kapi-pencere", "ince-isler/kapi-pencere/ic-kapi"],
  },
];
