import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuidePageSpec } from "../types";

const PROJE_HAZIRLIK_OVERRIDE_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

export const projeHazirlikTopicOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/mimari-proje",
    kind: "topic",
    quote: "Mimari proje, estetik kararlar listesi degil; tüm disiplinlerin oturacagi koordinat sistemini kuran ana omurgadir.",
    tip: "Mimari projeyi yalnız plan ve gorunus paketi gibi gormek, sonraki tüm disiplinlerde catisma ve sahada revizyon zinciri uretir.",
    intro: [
      "Mimari proje, yapinin kullanıcı deneyimini belirledigi kadar taşıyıcı sistem, tesisat, yangin kacisi ve ruhsat surecinin de ana referansidir. Bu nedenle mimari kararlar yalnız cephe ve plan tercihleri olarak degil, disiplinler arasi bir koordinasyon omurgasi olarak okunmalidir.",
      "Sahada yasanan bircok revizyonun kokeninde eksik veya gec olgunlasmis mimari kararlar vardir. Şaft boyutlari, merdiven kolu, mahaller arasi kot iliskisi, islak hacim modulasyonu ve doğrama akslari yeterince erken netlesmezse tüm proje ekibi ikinci kez üretim yapar.",
      "Bir insaat muhendisi için mimari proje, yalnız mimarin alanı degil; yapim senaryosunu, aplikasyon kolayligini ve detay okunabilirligini doğrudan etkileyen teknik girdidir.",
    ],
    theory: [
      "Mimari proje koordinasyonun ilk veri tabanidir. Taşıyıcı akslar, şaftlar, çekirdekler, ıslak hacimler ve cephe modulu bu projede doğru kurulmadiginda statik ve tesisat disiplinleri çözüm yerine uyarlama yapmak zorunda kalir.",
      "Mahal organizasyonu sadece kullanım akisini degil, aynı zamanda donati yogunlugu, tesisat gecisleri ve yangin guvenligi davranisini da belirler. Bu nedenle mimari kararlarda metrekaresel verim kadar teknik okunabilirlik de onemlidir.",
      "Sahada uygulama kalitesini artiran mimari proje, detaylara kadar çözulmus projedir. Plan düzeyinde güzel görünen ama köşe, esik, shaft ve doğrama birlesimini çözmeyen proje santiyede belirsizlik uretir.",
      "Bu nedenle mimari proje, estetik ve mevzuat kadar yapılabilirlik disiplini olarak degerlendirilmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Ruhsat ve mevzuat uyumu",
        limitOrRequirement: "Planli Alanlar Imar Yonetmeligi ve imar kararlarina tam uyum saglanmali",
        reference: "Planli Alanlar Imar Yonetmeligi + 3194 sayili Imar Kanunu",
        note: "Ruhsat surecini zorlayan eksikler genelde mimari karar setinden baslar.",
      },
      {
        parameter: "Disiplin koordinasyonu",
        limitOrRequirement: "Shaft, cekirdek, islak hacim ve cephe akslari diger disiplinlerle uyumlu kurulmalı",
        reference: "Koordinasyon paftasi ve BIM overlay",
        note: "Cakisma cozumleri sahaya birakilmamalidir.",
      },
      {
        parameter: "Yangin ve kacis",
        limitOrRequirement: "Kacis duzeni ve yangin zonlari mimari planda erken kurulmalı",
        reference: "Yangin guvenligi ve ruhsat disiplini",
        note: "Kacis cizgisi sonradan eklenebilen bir detay degildir.",
      },
      {
        parameter: "Yapılabilirlik",
        limitOrRequirement: "Detaylar sahada okunabilir olcek ve netlikle cozulmeli",
        reference: "Şantiye uygulama plani",
        note: "Olcusu belirsiz detay, sahada usta karari demektir.",
      },
    ],
    designOrApplicationSteps: [
      "Imar haklari ve fonksiyon programini netlestirerek plan iskeletini kur.",
      "Shaft, merdiven, asansor, islak hacim ve cekirdekleri diger disiplinlerle aynı anda yerlestir.",
      "Cephe akslari, doğrama modulasyonu ve kot iliskilerini taşıyıcı sistemle birlikte test et.",
      "Köşe, esik, balkon, parapet ve doğrama birlesim detaylarini erken paftala.",
      "Ruhsat paketi ile uygulama paketi arasindaki bosluklari şantiye cikmadan kapat.",
    ],
    criticalChecks: [
      "Shaft ve islak hacim kararları tesisatla uyumlu mu?",
      "Merdiven, asansor ve cekirdek duzeni ruhsat ve yangin kurgusunu karsiliyor mu?",
      "Doğrama akslari ve cephe modulu taşıyıcı sistemle cakisiyor mu?",
      "Detay paftalari santiyede okunabilir netlikte mi?",
      "Ruhsat mimarisi ile uygulama mimarisi arasinda acik fark var mi?",
    ],
    numericalExample: {
      title: "Shaft boyutu kararinin proje zincirine etkisi",
      inputs: [
        { label: "Planlanan shaft olcusu", value: "60 x 120 cm", note: "Ilk taslak" },
        { label: "Gecmesi gereken sistemler", value: "pis su + temiz su + havalik + elektrik tava", note: "Ornek apartman cekirdegi" },
        { label: "Hedef", value: "Tek seferde koordineli çözum", note: "Saha kirma riskini azaltmak" },
      ],
      assumptions: [
        "Shaft aynı anda mekanik ve elektrik sistemlerine hizmet etmektedir.",
        "Bakım erisimi gerektiren elemanlar mevcuttur.",
        "Mimari plan uygulama öncesi revize edilebilir durumdadir.",
      ],
      steps: [
        {
          title: "Yogunlugu yorumla",
          result: "Birden fazla sistem aynı shaftta toplandiginda ilk ölçü taslagi yetersiz kalabilir.",
          note: "Yetersiz shaft, sahada kirma ve duvar kalinligi oynama olarak geri doner.",
        },
        {
          title: "Detay kararini bagla",
          result: "Shaft boyutu yalnız boru gecisine göre degil, montaj ve bakım bosluguna göre de degerlendirilmelidir.",
          note: "Sadece geçen eleman sayisina bakmak eksik yaklasimdir.",
        },
        {
          title: "Mimari revizyonu oku",
          result: "Gec aşama revizyonundan once shaft boyutu buyutulursa sonraki disiplinlerde zincirleme duzeltme azalir.",
          note: "Erken revizyon ucuzdur; saha revizyonu pahali.",
        },
      ],
      checks: [
        "Shaft boyutu yalnız krokiye göre degil overlay uzerinden dogrulanmalidir.",
        "Bakım erisimi gerekli sistemler ayrıca sorgulanmalidir.",
        "Mimari karar tesisat ekibiyle birlikte kapanmalidir.",
        "Saha kirma riski ruhsat asamasinda olabildigince azaltılmalıdır.",
      ],
      engineeringComment: "Mimari projede 10 cm'lik eksik shaft, sahada metrelerce kirma ve ciddi zaman kaybi olarak geri dönebilir.",
    },
    tools: [
      { category: "Tasarim", name: "Revit / AutoCAD koordinasyon paftalari", purpose: "Plan, kesit ve disiplin overlay'lerini aynı referansta toplamak." },
      { category: "Kontrol", name: "Mahal listesi ve shaft matrisi", purpose: "Mahaller ile teknik hacimleri aynı tabloda izlemek." },
      { category: "Ruhsat", name: "Imar ve mevzuat kontrol listesi", purpose: "Ruhsat asamasinda tekrar revizyon riskini azaltmak." },
      { category: "Saha", name: "Detay okuma ve uygulama notlari", purpose: "Mimari projenin sahada belirsizlik uretmeden uygulanmasini saglamak." },
    ],
    equipmentAndMaterials: [
      { group: "Dokumantasyon", name: "Plan, kesit, gorunus ve detay pafta seti", purpose: "Mimari kararlarin disiplinlerce aynı sekilde okunmasini saglamak.", phase: "Proje" },
      { group: "Koordinasyon", name: "Overlay, clash ve mahal tabloları", purpose: "Mimari kararlarin statik ve tesisat ile uyumunu gostermek.", phase: "Koordinasyon" },
      { group: "Kontrol", name: "Revizyon ve onay kayıt sistemi", purpose: "Ruhsat ve uygulama cizimleri arasindaki farki izlemek.", phase: "Surekli" },
      { group: "Saha", name: "Uygulama detay ciktisi ve aplikasyon referanslari", purpose: "Projenin ofisten sahaya kayipsiz aktarilmasini saglamak.", phase: "Uygulama öncesi" },
    ],
    mistakes: [
      { wrong: "Mimari projeyi yalnız estetik paket gibi gormek.", correct: "Disiplin koordinasyonunun ana omurgasi olarak ele almak." },
      { wrong: "Shaft ve islak hacim kararlarini gec dondurmek.", correct: "Bu kararları erken aşamada overlay ile kapatmak." },
      { wrong: "Detay paftalarini uygulama oncesine birakmak.", correct: "Kritik dugumleri proje olgunlasirken çözmek." },
      { wrong: "Ruhsat paketiyle uygulama paketini aynı saymak.", correct: "Şantiye öncesi uygulama bosluklarini kapatmak." },
      { wrong: "Doğrama ve cephe modülunu taşıyıcı sistemden bagimsiz kurmak.", correct: "Aks ve kesit ilişkisini birlikte test etmek." },
    ],
    designVsField: [
      "Ofiste mimari proje plan ve kesitlerle anlatilir; sahada ise aynı proje uygulama sirasini, detay okunurlugunu ve disiplin kavgasini belirler.",
      "Iyi mimari proje yalnız güzel görünmez; sahada daha az kirma, daha az belirsizlik ve daha temiz detay uretir.",
    ],
    conclusion: [
      "Mimari proje doğru kuruldugunda tüm disiplinlerin uzerine oturdugu temiz bir koordinasyon zemini olusturur.",
      "Eksik olgunlastiginda ise sorun cepheden degil, tüm proje zincirinden geri doner.",
    ],
    sources: [...PROJE_HAZIRLIK_OVERRIDE_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.imarKanunu],
    keywords: ["mimari proje", "koordinasyon", "shaft", "uygulama detayi", "ruhsat"],
  },
  {
    slugPath: "proje-hazirlik/statik-proje",
    kind: "topic",
    quote: "Statik proje, hesap dosyasi degil; binanin sahada hangi duzen ve detayla ayakta kalacagini tarif eden ana teknik omurgadir.",
    tip: "Statik projeyi sadece program ciktilarina indirgemek, taşıyıcı sistem mantigini sahadan ve uygulama detayindan koparmak demektir.",
    intro: [
      "Statik proje, yuklerin zemine nasil aktigini, taşıyıcı sistemin deprem altinda nasil davrandigini ve betonarme veya diger taşıyıcı elemanlarin hangi detayla uygulanacagini tarif eder. Bu nedenle yalnız hesap raporu degil, uygulama ve denetim referansi olarak okunmalidir.",
      "Sahada en çok zorlayan projeler, hesap olarak tamam ama detay olarak eksik projelerdir. Aks uyumsuzluklari, okunmayan donati detaylari, perde-kolon süreksizlikleri ve temel baglantilarindaki belirsizlikler santiyede ikinci tasarim uretir.",
      "Bir insaat muhendisi için statik proje, bilgisayarda biten bir analiz ciktisi degil; kalip, donati, beton ve denetim ekiplerinin aynı yapisal mantigi okuyabildigi uygulama dilidir.",
    ],
    theory: [
      "Iyi statik proje, taşıyıcı sistem secimini ve deprem davranisini kavramsal olarak aciklar. Aks duzeni, perde yerlesimi, kolon-kiris iliskisi ve temel sistemi birbiriyle tutarli olmadiginda detay ne kadar güzel olsa da sistem kararsiz hissedilir.",
      "Deprem tasarımı yalnız kesit hesabina indirgenemez. TBDY 2018'in de vurguladigi uzere düzensizlikler, süneklik, perde sürekliligi ve katlar arasi davranis projenin ana omurgasidir.",
      "Sahada uygulanabilir statik proje, donati sıkışmasını, kalip kurulabilirligini ve beton dokulebilirligini de dikkate alir. Cizimde mümkün olan her detay, sahada ekonomik ve okunabilir olmayabilir.",
      "Bu nedenle statik proje hesap, detay ve yapılabilirlik denklemini aynı anda cozen bir tasarim paketidir.",
    ],
    ruleTable: [
      {
        parameter: "Deprem tasarim mantigi",
        limitOrRequirement: "Sistem secimi, düzensizlik kontrolu ve süneklik TBDY 2018 ile uyumlu olmalı",
        reference: "TBDY 2018",
        note: "Kesit hesabı kadar sistem davranisi da proje kararidir.",
      },
      {
        parameter: "Betonarme detaylar",
        limitOrRequirement: "Kesit, donati ve pas payi kararları TS 500 ve ilgili detaylarla tutarli olmali",
        reference: "TS 500",
        note: "Eksik detay sahada yorum farki yaratir.",
      },
      {
        parameter: "Mimari ve tesisat koordinasyonu",
        limitOrRequirement: "Perde, kolon, kiriş ve döşeme kararları mimari ve shaft düzeniyle uyumlu olmali",
        reference: "Disiplin overlay plani",
        note: "Statik proje tek basina okunamaz.",
      },
      {
        parameter: "Yapılabilirlik",
        limitOrRequirement: "Donati yogunlugu, kalip mantigi ve betonlanabilirlik uygulama öncesi kontrol edilmeli",
        reference: "Şantiye uygulama disiplini",
        note: "Asiri yoğun dügumler sahada kaliteyi dusurur.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari aks ve çekirdek duzenini net alip taşıyıcı sistem seklini buna göre kur.",
      "Perde, kolon ve kiriş davranisini deprem mantigi acisindan birlikte degerlendir.",
      "Temel sistemini zemin etudu ve üst yapı yükleri ile bir arada sec.",
      "Kritik dügumlerde donati okunurlugu, kalip kurulabilirligi ve beton yerlesimi kontrolu yap.",
      "Proje cizimleri ile hesap raporunun sahaya aynı mantigi aktarip aktarmadigini son kez test et.",
    ],
    criticalChecks: [
      "Taşıyıcı sistem secimi mimariyle tutarli mi?",
      "Perde ve kolon sürekliligi katlar boyunca korunuyor mu?",
      "Kritik dügumlerde donati sıkışması riski var mi?",
      "Temel sistemi zemin etudu ile aynı mantigi tasiyor mu?",
      "Kalip ve donati ekipleri cizimi yorumsuz okuyabiliyor mu?",
    ],
    numericalExample: {
      title: "Perde yogunlugunun davranis kararina etkisi",
      inputs: [
        { label: "Kat plani", value: "Düzenli aksli orta yükseklikte bina", note: "Ornek kurgu" },
        { label: "Cekirdek", value: "Merkezde perde duzeni", note: "Asansor + merdiven cevresi" },
        { label: "Hedef", value: "Yanal rijitligi ve uygulanabilirligi dengelemek", note: "Sistem karari" },
      ],
      assumptions: [
        "Mimari plan perde yerlesimine belli sinirlar koymaktadir.",
        "Kolon-kiris çerçeveleri perde ile birlikte çalışacaktır.",
        "Temel sistemi zemin verisiyle uyumlu secilecektir.",
      ],
      steps: [
        {
          title: "Perde yerlesimini oku",
          result: "Merkezde toplanan perdeler rijitlik sağlar ancak burulma ve saha donati yogunlugu birlikte kontrol edilmelidir.",
          note: "Yalnız analitik rijitlik yeterli karar degildir.",
        },
        {
          title: "Uygulanabilirligi ekle",
          result: "Perde uç bölgeleri ve kiriş birleşimlerinde donati okunurlugu kontrol edilmelidir.",
          note: "Sahada betonlanamayan dügum, kagit üzerinde doğru olsa da problem uretir.",
        },
        {
          title: "Temel etkisini bagla",
          result: "Perde yogunlugunun artmasi temel kararini ve donati dağılımını da etkiler.",
          note: "Üst yapı karari temel sistemiyle birlikte kapanmalidir.",
        },
      ],
      checks: [
        "Perde karari yalnız program ciktisina göre verilmemelidir.",
        "Donati sıkışması kritik dügumlerde saha gozuyle de okunmalidir.",
        "Temel ve üst yapı kararları aynı mantik zincirinde olmalidir.",
        "Statik proje, kalip ve donati ekiplerine yorum birakmamali.",
      ],
      engineeringComment: "Statik projede iyi karar, sadece daha guclu değil; sahada daha okunabilir ve uygulanabilir olandir.",
    },
    tools: [
      { category: "Analiz", name: "Idecad, ETABS veya benzeri statik analiz yazilimlari", purpose: "Taşıyıcı sistem davranisini deprem ve yuk etkileri altinda modellemek." },
      { category: "Kontrol", name: "Excel veya manuel hesap kontrol sayfalari", purpose: "Kritik kesit ve dügumleri bagimsiz olarak dogrulamak." },
      { category: "Koordinasyon", name: "Mimari-statik overlay paftalari", purpose: "Aks, perde ve shaft cakismalarini erken görmek." },
      { category: "Saha", name: "Donati okunurlugu ve kalip kurulabilirlik checklisti", purpose: "Cizimin santiyede yorum farki uretmesini onlemek." },
    ],
    equipmentAndMaterials: [
      { group: "Dokumantasyon", name: "Statik hesap raporu, kalip plani ve donati paftalari", purpose: "Taşıyıcı sistem mantigini ekiplere aynı dille aktarmak.", phase: "Proje" },
      { group: "Koordinasyon", name: "Aks ve çekirdek kontrol paftalari", purpose: "Mimari ve statik uyumu görünur kilmak.", phase: "Koordinasyon" },
      { group: "Saha", name: "Donati açılım ve dügum detay ciktıları", purpose: "Kritik bölgelerde uygulama hatasini azaltmak.", phase: "Uygulama öncesi" },
      { group: "Denetim", name: "Kontrol ve revizyon kayıt sistemi", purpose: "Proje kararlarinin sahaya degissiz aktarilmasini saglamak.", phase: "Surekli" },
    ],
    mistakes: [
      { wrong: "Statik projeyi yalnız program ciktilariyla tamamlamak.", correct: "Taşıyıcı sistem mantigini detay ve yapilabilirlikle birlikte kapatmak." },
      { wrong: "Mimari akslarla uyumsuz perde-kolon yerlesimi yapmak.", correct: "Disiplin overlay ile aks kurgusunu erken doğrulamak." },
      { wrong: "Kritik dügumlerde donati sıkışmasını göz ardı etmek.", correct: "Saha uygulanabilirligini proje asamasinda test etmek." },
      { wrong: "Temel kararini üst yapıdan ayri okumak.", correct: "Zemin etudu ve yuk dagilimini aynı zincirde degerlendirmek." },
      { wrong: "Cizim detayini saha yorumuna birakmak.", correct: "Kalip ve donati ekiplerinin yorumsuz okuyacagi net paftalar uretmek." },
    ],
    designVsField: [
      "Ofiste statik proje analiz modeli ve pafta setiyle anlatilir; sahada ise aynı proje kalip, donati ve beton siralamasini belirler.",
      "Iyi statik proje yalnız dayanmaz; daha az revizyon, daha temiz dügum ve daha kontrollu saha uretir.",
    ],
    conclusion: [
      "Statik proje doğru sistem secimi, doğru detay ve doğru yapılabilirlik kontrolu ile sahaya indigi zaman gercek degerini uretir.",
      "Yalnız hesap olarak kaldiginda ise şantiye ikinci tasarim alanina doner.",
    ],
    sources: [...PROJE_HAZIRLIK_OVERRIDE_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500],
    keywords: ["statik proje", "taşıyıcı sistem", "TBDY 2018", "TS 500", "uygulanabilir detay"],
  },
];
