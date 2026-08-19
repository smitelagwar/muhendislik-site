import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuidePageSpec } from "../types";

const PROJE_HAZIRLIK_OVERRIDE_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

export const projeHazirlikTopicOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "proje-hazirlik/mimari-proje",
    kind: "topic",
    quote: "Mimari proje, estetik kararlar listesi değil; tüm disiplinlerin oturacagi koordinat sistemini kuran ana omurgadir.",
    tip: "Mimari projeyi yalnız plan ve görünüş paketi gibi görmek, sonraki tüm disiplinlerde catisma ve sahada revizyon zinciri uretir.",
    intro: [
      "Mimari proje, yapının kullanıcı deneyimini belirledigi kadar taşıyıcı sistem, tesisat, yangin kacisi ve ruhsat surecinin de ana referansidir. Bu nedenle mimari kararlar yalnız cephe ve plan tercihleri olarak değil, disiplinler arasi bir koordinasyon omurgasi olarak okunmalidir.",
      "Sahada yasanan bircok revizyonun kokeninde eksik veya gec olgunlasmis mimari kararlar vardir. Şaft boyutlari, merdiven kolu, mahaller arasi kot iliskisi, islak hacim modulasyonu ve doğrama akslari yeterince erken netlesmezse tüm proje ekibi ikinci kez üretim yapar.",
      "Bir inşaat mühendisi için mimari proje, yalnız mimarin alanı değil; yapim senaryosunu, aplikasyon kolayligini ve detay okunabilirligini doğrudan etkileyen teknik girdidir.",
    ],
    theory: [
      "Mimari proje koordinasyonun ilk veri tabanidir. Taşıyıcı akslar, şaftlar, çekirdekler, ıslak hacimler ve cephe modulu bu projede doğru kurulmadiginda statik ve tesisat disiplinleri çözüm yerine uyarlama yapmak zorunda kalir.",
      "Mahal organizasyonu sadece kullanım akisini değil, aynı zamanda donatı yoğunluğu, tesisat gecisleri ve yangin güvenliği davranisini da belirler. Bu nedenle mimari kararlarda metrekaresel verim kadar teknik okunabilirlik de önemlidir.",
      "Sahada uygulama kalitesini artiran mimari proje, detaylara kadar çözulmus projedir. Plan düzeyinde güzel görünen ama köşe, esik, şaft ve doğrama birlesimini çözmeyen proje şantiyede belirsizlik uretir.",
      "Bu nedenle mimari proje, estetik ve mevzuat kadar yapılabilirlik disiplini olarak degerlendirilmelidir.",
    ],
    ruleTable: [
      {
        parameter: "Ruhsat ve mevzuat uyumu",
        limitOrRequirement: "Planli Alanlar Imar Yönetmeliği ve imar kararlarina tam uyum saglanmali",
        reference: "Planli Alanlar Imar Yönetmeliği + 3194 sayili Imar Kanunu",
        note: "Ruhsat surecini zorlayan eksikler genelde mimari karar setinden başlar.",
      },
      {
        parameter: "Disiplin koordinasyonu",
        limitOrRequirement: "Shaft, cekirdek, islak hacim ve cephe akslari diger disiplinlerle uyumlu kurulmalı",
        reference: "Koordinasyon paftası ve BIM overlay",
        note: "Cakisma cozumleri sahaya birakilmamalidir.",
      },
      {
        parameter: "Yangin ve kacis",
        limitOrRequirement: "Kacis düzeni ve yangin zonlari mimari planda erken kurulmalı",
        reference: "Yangin güvenliği ve ruhsat disiplini",
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
      "Imar haklari ve fonksiyon programini netlestirerek plan iskeletini kür.",
      "Shaft, merdiven, asansor, islak hacim ve cekirdekleri diger disiplinlerle aynı anda yerlestir.",
      "Cephe akslari, doğrama modulasyonu ve kot iliskilerini taşıyıcı sistemle birlikte test et.",
      "Köşe, esik, balkon, parapet ve doğrama birleşim detaylarini erken paftala.",
      "Ruhsat paketi ile uygulama paketi arasindaki boşlukları şantiye cikmadan kapat.",
    ],
    criticalChecks: [
      "Shaft ve islak hacim kararları tesisatla uyumlu mu?",
      "Merdiven, asansor ve cekirdek düzeni ruhsat ve yangin kurgusunu karsiliyor mu?",
      "Doğrama akslari ve cephe modulu taşıyıcı sistemle cakisiyor mu?",
      "Detay paftaları şantiyede okunabilir netlikte mi?",
      "Ruhsat mimarisi ile uygulama mimarisi arasinda acik fark var mi?",
    ],
    numericalExample: {
      title: "Shaft boyutu kararinin proje zincirine etkisi",
      inputs: [
        { label: "Planlanan şaft ölçüsü", value: "60 x 120 cm", note: "Ilk taslak" },
        { label: "Gecmesi gereken sistemler", value: "pis su + temiz su + havalik + elektrik tava", note: "Ornek apartman cekirdegi" },
        { label: "Hedef", value: "Tek seferde koordineli çözum", note: "Saha kırma riskini azaltmak" },
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
          note: "Yetersiz şaft, sahada kırma ve duvar kalinligi oynama olarak geri doner.",
        },
        {
          title: "Detay kararini bagla",
          result: "Shaft boyutu yalnız boru gecisine göre değil, montaj ve bakım bosluguna göre de degerlendirilmelidir.",
          note: "Sadece geçen eleman sayisina bakmak eksik yaklasimdir.",
        },
        {
          title: "Mimari revizyonu oku",
          result: "Gec aşama revizyonundan önce şaft boyutu buyutulursa sonraki disiplinlerde zincirleme duzeltme azalir.",
          note: "Erken revizyon ucuzdur; saha revizyonu pahali.",
        },
      ],
      checks: [
        "Shaft boyutu yalnız krokiye göre değil overlay uzerinden doğrulanmalıdır.",
        "Bakım erisimi gerekli sistemler ayrıca sorgulanmalidir.",
        "Mimari karar tesisat ekibiyle birlikte kapanmalidir.",
        "Saha kırma riski ruhsat asamasinda olabildigince azaltılmalıdır.",
      ],
      engineeringComment: "Mimari projede 10 cm'lik eksik şaft, sahada metrelerce kırma ve ciddi zaman kaybi olarak geri dönebilir.",
    },
    tools: [
      { category: "Tasarim", name: "Revit / AutoCAD koordinasyon paftaları", purpose: "Plan, kesit ve disiplin overlay'lerini aynı referansta toplamak." },
      { category: "Kontrol", name: "Mahal listesi ve şaft matrisi", purpose: "Mahaller ile teknik hacimleri aynı tabloda izlemek." },
      { category: "Ruhsat", name: "Imar ve mevzuat kontrol listesi", purpose: "Ruhsat asamasinda tekrar revizyon riskini azaltmak." },
      { category: "Saha", name: "Detay okuma ve uygulama notlari", purpose: "Mimari projenin sahada belirsizlik uretmeden uygulanmasini saglamak." },
    ],
    equipmentAndMaterials: [
      { group: "Dokumantasyon", name: "Plan, kesit, görünüş ve detay pafta seti", purpose: "Mimari kararlarin disiplinlerce aynı sekilde okunmasini saglamak.", phase: "Proje" },
      { group: "Koordinasyon", name: "Overlay, clash ve mahal tabloları", purpose: "Mimari kararlarin statik ve tesisat ile uyumunu gostermek.", phase: "Koordinasyon" },
      { group: "Kontrol", name: "Revizyon ve onay kayıt sistemi", purpose: "Ruhsat ve uygulama cizimleri arasindaki farki izlemek.", phase: "Sürekli" },
      { group: "Saha", name: "Uygulama detay ciktisi ve aplikasyon referanslari", purpose: "Projenin ofisten sahaya kayipsiz aktarilmasini saglamak.", phase: "Uygulama öncesi" },
    ],
    mistakes: [
      { wrong: "Mimari projeyi yalnız estetik paket gibi görmek.", correct: "Disiplin koordinasyonunun ana omurgasi olarak ele almak." },
      { wrong: "Shaft ve islak hacim kararlarini gec dondurmek.", correct: "Bu kararları erken aşamada overlay ile kapatmak." },
      { wrong: "Detay paftalarini uygulama oncesine birakmak.", correct: "Kritik dugumleri proje olgunlasirken çözmek." },
      { wrong: "Ruhsat paketiyle uygulama paketini aynı saymak.", correct: "Şantiye öncesi uygulama bosluklarini kapatmak." },
      { wrong: "Doğrama ve cephe modülunu taşıyıcı sistemden bağımsız kurmak.", correct: "Aks ve kesit ilişkisini birlikte test etmek." },
    ],
    designVsField: [
      "Ofiste mimari proje plan ve kesitlerle anlatilir; sahada ise aynı proje uygulama sırasını, detay okunurlugunu ve disiplin kavgasini belirler.",
      "Iyi mimari proje yalnız güzel görünmez; sahada daha az kırma, daha az belirsizlik ve daha temiz detay uretir.",
    ],
    conclusion: [
      "Mimari proje doğru kuruldugunda tüm disiplinlerin uzerine oturdugu temiz bir koordinasyon zemini olusturur.",
      "Eksik olgunlastiginda ise sorun cepheden değil, tüm proje zincirinden geri doner.",
    ],
    sources: [...PROJE_HAZIRLIK_OVERRIDE_SOURCES, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.imarKanunu],
    keywords: ["mimari proje", "koordinasyon", "şaft", "uygulama detayi", "ruhsat"],
  },
  {
    slugPath: "proje-hazirlik/statik-proje",
    kind: "topic",
    quote: "Statik proje, hesap dosyasi değil; binanin sahada hangi düzen ve detayla ayakta kalacagini tarif eden ana teknik omurgadir.",
    tip: "Statik projeyi sadece program ciktilarina indirgemek, taşıyıcı sistem mantigini sahadan ve uygulama detayindan koparmak demektir.",
    intro: [
      "Statik proje, yüklerin zemine nasil aktigini, taşıyıcı sistemin deprem altinda nasil davrandigini ve betonarme veya diger taşıyıcı elemanlarin hangi detayla uygulanacagini tarif eder. Bu nedenle yalnız hesap raporu değil, uygulama ve denetim referansi olarak okunmalidir.",
      "Sahada en çok zorlayan projeler, hesap olarak tamam ama detay olarak eksik projelerdir. Aks uyumsuzluklari, okunmayan donatı detaylari, perde-kolon süreksizlikleri ve temel baglantilarindaki belirsizlikler şantiyede ikinci tasarim uretir.",
      "Bir inşaat mühendisi için statik proje, bilgisayarda biten bir analiz ciktisi değil; kalıp, donatı, beton ve denetim ekiplerinin aynı yapisal mantigi okuyabildigi uygulama dilidir.",
    ],
    theory: [
      "Iyi statik proje, taşıyıcı sistem secimini ve deprem davranisini kavramsal olarak aciklar. Aks düzeni, perde yerlesimi, kolon-kiriş iliskisi ve temel sistemi birbiriyle tutarli olmadiginda detay ne kadar güzel olsa da sistem kararsiz hissedilir.",
      "Deprem tasarımı yalnız kesit hesabina indirgenemez. TBDY 2018'in de vurguladigi uzere düzensizlikler, süneklik, perde sürekliligi ve katlar arasi davranis projenin ana omurgasidir.",
      "Sahada uygulanabilir statik proje, donatı sıkışmasını, kalıp kurulabilirligini ve beton dokulebilirligini de dikkate alir. Cizimde mümkün olan her detay, sahada ekonomik ve okunabilir olmayabilir.",
      "Bu nedenle statik proje hesap, detay ve yapılabilirlik denklemini aynı anda cozen bir tasarim paketidir.",
    ],
    ruleTable: [
      {
        parameter: "Deprem tasarim mantigi",
        limitOrRequirement: "Sistem secimi, düzensizlik kontrolü ve süneklik TBDY 2018 ile uyumlu olmalı",
        reference: "TBDY 2018",
        note: "Kesit hesabı kadar sistem davranisi da proje kararidir.",
      },
      {
        parameter: "Betonarme detaylar",
        limitOrRequirement: "Kesit, donatı ve paspayı kararları TS 500 ve ilgili detaylarla tutarli olmali",
        reference: "TS 500",
        note: "Eksik detay sahada yorum farki yaratir.",
      },
      {
        parameter: "Mimari ve tesisat koordinasyonu",
        limitOrRequirement: "Perde, kolon, kiriş ve döşeme kararları mimari ve şaft düzeniyle uyumlu olmali",
        reference: "Disiplin overlay plani",
        note: "Statik proje tek basina okunamaz.",
      },
      {
        parameter: "Yapılabilirlik",
        limitOrRequirement: "Donatı yoğunluğu, kalıp mantigi ve betonlanabilirlik uygulama öncesi kontrol edilmeli",
        reference: "Şantiye uygulama disiplini",
        note: "Asiri yoğun dügumler sahada kaliteyi düşürür.",
      },
    ],
    designOrApplicationSteps: [
      "Mimari aks ve çekirdek duzenini net alip taşıyıcı sistem seklini buna göre kür.",
      "Perde, kolon ve kiriş davranisini deprem mantigi acisindan birlikte degerlendir.",
      "Temel sistemini zemin etudu ve üst yapı yükleri ile bir arada sec.",
      "Kritik dügumlerde donatı okunurlugu, kalıp kurulabilirligi ve beton yerlesimi kontrolü yap.",
      "Proje cizimleri ile hesap raporunun sahaya aynı mantigi aktarip aktarmadigini son kez test et.",
    ],
    criticalChecks: [
      "Taşıyıcı sistem secimi mimariyle tutarli mi?",
      "Perde ve kolon sürekliligi katlar boyunca korunuyor mu?",
      "Kritik dügumlerde donatı sıkışması riski var mi?",
      "Temel sistemi zemin etudu ile aynı mantigi tasiyor mu?",
      "Kalıp ve donatı ekipleri cizimi yorumsuz okuyabiliyor mu?",
    ],
    numericalExample: {
      title: "Perde yogunlugunun davranis kararina etkisi",
      inputs: [
        { label: "Kat plani", value: "Düzenli aksli orta yükseklikte bina", note: "Ornek kurgu" },
        { label: "Cekirdek", value: "Merkezde perde düzeni", note: "Asansor + merdiven cevresi" },
        { label: "Hedef", value: "Yanal rijitligi ve uygulanabilirligi dengelemek", note: "Sistem karari" },
      ],
      assumptions: [
        "Mimari plan perde yerlesimine belli sinirlar koymaktadir.",
        "Kolon-kiriş çerçeveleri perde ile birlikte çalışacaktır.",
        "Temel sistemi zemin verisiyle uyumlu secilecektir.",
      ],
      steps: [
        {
          title: "Perde yerlesimini oku",
          result: "Merkezde toplanan perdeler rijitlik sağlar ancak burulma ve saha donatı yoğunluğu birlikte kontrol edilmelidir.",
          note: "Yalnız analitik rijitlik yeterli karar degildir.",
        },
        {
          title: "Uygulanabilirligi ekle",
          result: "Perde uç bölgeleri ve kiriş birleşimlerinde donatı okunurlugu kontrol edilmelidir.",
          note: "Sahada betonlanamayan dügum, kagit üzerinde doğru olsa da problem uretir.",
        },
        {
          title: "Temel etkisini bagla",
          result: "Perde yogunlugunun artmasi temel kararini ve donatı dağılımını da etkiler.",
          note: "Üst yapı karari temel sistemiyle birlikte kapanmalidir.",
        },
      ],
      checks: [
        "Perde karari yalnız program ciktisina göre verilmemelidir.",
        "Donatı sıkışması kritik dügumlerde saha gozuyle de okunmalidir.",
        "Temel ve üst yapı kararları aynı mantik zincirinde olmalidir.",
        "Statik proje, kalıp ve donatı ekiplerine yorum birakmamali.",
      ],
      engineeringComment: "Statik projede iyi karar, sadece daha güçlü değil; sahada daha okunabilir ve uygulanabilir olandir.",
    },
    tools: [
      { category: "Analiz", name: "Idecad, ETABS veya benzeri statik analiz yazilimlari", purpose: "Taşıyıcı sistem davranisini deprem ve yük etkileri altinda modellemek." },
      { category: "Kontrol", name: "Excel veya manuel hesap kontrol sayfalari", purpose: "Kritik kesit ve dügumleri bağımsız olarak dogrulamak." },
      { category: "Koordinasyon", name: "Mimari-statik overlay paftaları", purpose: "Aks, perde ve şaft cakismalarini erken görmek." },
      { category: "Saha", name: "Donatı okunurlugu ve kalıp kurulabilirlik checklisti", purpose: "Cizimin şantiyede yorum farki uretmesini onlemek." },
    ],
    equipmentAndMaterials: [
      { group: "Dokumantasyon", name: "Statik hesap raporu, kalıp plani ve donatı paftaları", purpose: "Taşıyıcı sistem mantigini ekiplere aynı dille aktarmak.", phase: "Proje" },
      { group: "Koordinasyon", name: "Aks ve çekirdek kontrol paftaları", purpose: "Mimari ve statik uyumu görünur kilmak.", phase: "Koordinasyon" },
      { group: "Saha", name: "Donatı açılım ve dügum detay ciktıları", purpose: "Kritik bölgelerde uygulama hatasini azaltmak.", phase: "Uygulama öncesi" },
      { group: "Denetim", name: "Kontrol ve revizyon kayıt sistemi", purpose: "Proje kararlarinin sahaya degissiz aktarilmasini saglamak.", phase: "Sürekli" },
    ],
    mistakes: [
      { wrong: "Statik projeyi yalnız program ciktilariyla tamamlamak.", correct: "Taşıyıcı sistem mantigini detay ve yapilabilirlikle birlikte kapatmak." },
      { wrong: "Mimari akslarla uyumsuz perde-kolon yerlesimi yapmak.", correct: "Disiplin overlay ile aks kurgusunu erken doğrulamak." },
      { wrong: "Kritik dügumlerde donatı sıkışmasını göz ardı etmek.", correct: "Saha uygulanabilirligini proje asamasinda test etmek." },
      { wrong: "Temel kararini üst yapıdan ayri okumak.", correct: "Zemin etudu ve yük dagilimini aynı zincirde degerlendirmek." },
      { wrong: "Cizim detayini saha yorumuna birakmak.", correct: "Kalıp ve donatı ekiplerinin yorumsuz okuyacagi net paftalar uretmek." },
    ],
    designVsField: [
      "Ofiste statik proje analiz modeli ve pafta setiyle anlatilir; sahada ise aynı proje kalıp, donatı ve beton siralamasini belirler.",
      "Iyi statik proje yalnız dayanmaz; daha az revizyon, daha temiz dügum ve daha kontrollu saha uretir.",
    ],
    conclusion: [
      "Statik proje doğru sistem secimi, doğru detay ve doğru yapılabilirlik kontrolü ile sahaya indigi zaman gercek degerini uretir.",
      "Yalnız hesap olarak kaldiginda ise şantiye ikinci tasarim alanina doner.",
    ],
    sources: [...PROJE_HAZIRLIK_OVERRIDE_SOURCES, SOURCE_LEDGER.tbdy2018, SOURCE_LEDGER.ts500],
    keywords: ["statik proje", "taşıyıcı sistem", "TBDY 2018", "TS 500", "uygulanabilir detay"],
  },
];
