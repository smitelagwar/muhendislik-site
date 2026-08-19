import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const FINISH_FINAL_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];
const MEP_FINAL_SOURCES = [...BRANCH_SOURCE_LEDGER["tesisat-isleri"]];
const PROJECT_FINAL_SOURCES = [...BRANCH_SOURCE_LEDGER["proje-hazirlik"]];

const FINISH_FINAL_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Mahal bitis matrisi ve detay paftalari", purpose: "Sıva, zemin, duvar ve doğrama kararlarini aynı finish dilinde toplamak." },
  { category: "Ölçüm", name: "Nem olcer, mastar, lazer nivo ve yan isik kontrolü", purpose: "Kaplama öncesi yüzey hazirligini göz karari yerine veriyle yonetmek." },
  { category: "Kontrol", name: "Numune mahal ve teslim checklisti", purpose: "Bitis kalitesini ilk dairede tanimlayip tüm sahaya yaymak." },
  { category: "Kayıt", name: "Koruma ortuleri ve son kabul fotografi arşivi", purpose: "Ince iş tamamlandiktan sonra yuzeyin bozulmadan teslim edilmesini saglamak." },
];

const FINISH_FINAL_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Sıva, tesviye, astar ve tamir malzemeleri", purpose: "Bitis urunlerinden önce alt yuzeyi kabul seviyesine getirmek.", phase: "Altlik hazirligi" },
  { group: "Kaplama", name: "Zemin, duvar ve çatı bitis urunleri", purpose: "Mahal kullanimina uygun son kat performansini saglamak.", phase: "Son kat montaji" },
  { group: "Kontrol", name: "Mastar, derz aparatlari, nem olcer ve numune panel", purpose: "Kaplama kalitesini uygulama sirasinda dogrulamak.", phase: "Kalite kontrol" },
  { group: "Koruma", name: "Yüzey koruma ortuleri ve gecici teslim bariyerleri", purpose: "Tamamlanan ince isleri bir sonraki ekipten korumak.", phase: "Teslim öncesi" },
];

const MEP_FINAL_TOOLS: BinaGuideTool[] = [
  { category: "Koordinasyon", name: "Revit MEP, overlay pafta ve saft matrisi", purpose: "Mekanik ve elektrik hatlari mimariyla cakismadan çözülmüş halde sahaya cikarmak." },
  { category: "Test", name: "Basinc, izolasyon, sureklilik ve fonksiyon test planlari", purpose: "Kapatma öncesi tüm görünmez tesisati olculu sekilde dogrulamak." },
  { category: "Kayıt", name: "As-built, etiketleme ve devreye alma klasoru", purpose: "Sistemi yalnız monte edilmis değil isletmeye hazir hale getirmek." },
  { category: "Saha", name: "Lazer nivo, termal kamera ve debi-gerilim ölçüm seti", purpose: "Devreye alma sirasinda dengesizlik ve arizayi erken yakalamak." },
];

const MEP_FINAL_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dağıtım", name: "Boru, kanal, tava, aski ve kelepce sistemleri", purpose: "Tesisat guzergahlarini yapisal ve bakım acisindan güvenli tasimak.", phase: "Montaj" },
  { group: "Kontrol", name: "Test pompasi, megger, multimetre ve sureklilik ekipmani", purpose: "Mekanik ve elektrik testlerini kayitli hale getirmek.", phase: "Kapatma öncesi ve devreye alma" },
  { group: "Erişim", name: "Vana, kollektorluk, pano ve servis kapagi cozumleri", purpose: "Bakım gerektiren noktaları sonradan kırma ihtiyaci dogurmadan acik birakmak.", phase: "Son montaj" },
  { group: "Kayıt", name: "Etiketleme, devre listesi ve as-built arşivi", purpose: "Isletmeye devredilecek tesisati okunur hale getirmek.", phase: "Teslim" },
];

const PROJECT_FINAL_TOOLS: BinaGuideTool[] = [
  { category: "Dokuman", name: "Ruhsat takip matrisi ve revizyon cizelgesi", purpose: "Idareye giden set ile sahaya giden set arasindaki farki kontrollu sekilde izlemek." },
  { category: "Cizim", name: "AutoCAD, Revit ve PDF karsilastirma paketleri", purpose: "Ruhsat eki paftalar ile uygulama detaylarinin tutarliligini görmek." },
  { category: "Süreç", name: "Belge tamlik checklisti ve resmi not takip sistemi", purpose: "Basvuru eksigini son dakika krizine donusturmemek." },
  { category: "Saha", name: "Onayli klasor, dağıtım formu ve teknik ofis logu", purpose: "Gecerli pafta takimlarinin sahada karismasini onlemek." },
];

const PROJECT_FINAL_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Dokuman", name: "Onayli ruhsat eki arsiv seti", purpose: "Resmi olarak gecen pafta ve belgeleri tek klasorde sabitlemek.", phase: "Basvuru ve onay" },
  { group: "Dokuman", name: "Uygulama seti dağıtım formu", purpose: "Sahaya verilen guncel teknik takimi izlemek.", phase: "Saha başlangıcı" },
  { group: "Kontrol", name: "Revizyon foyu ve disiplin karsilastirma listesi", purpose: "Mimari, statik ve MEP farklarini resmi set sonrasinda kapatmak.", phase: "Detay projelendirme" },
  { group: "Kayıt", name: "Yapı denetim ve resmi not klasoru", purpose: "Onay, denetim ve saha geri bildirimlerini aynı zincirde tutmak.", phase: "Tüm süreç" },
];

export const finalQualityBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler",
    kind: "branch",
    quote: "Ince isler, yapının sadece güzel gorunen kismi değil; kullanicinin kaliteyi ilk kez doğrudan hissettigi mühendislik katmanidir.",
    tip: "Bitis kalemlerini yalnız estetik secim gibi yonetmek, tüm ince isi saha toleransi, nem ve koruma sorunlarina acik birakmaktir.",
    intro: [
      "Ince isler; sıva, duvar kaplamaları, zemin kaplamaları, alçıpan, çatı bitisleri, kapı-pencere ve boya gibi yapının görünür yuzunu belirleyen kalemlerden olusur. Ancak bu kalemlerin tamami yalnız son kat urun secimi olarak okunursa sahadaki asil kalite tetikleyicileri gözden kacar. Yüzey hazirligi, tolerans, nem durumu, teslim sırası ve bitis dugumleri bu fazin gercek omurgasidir.",
      "Sahadaki en yaygin yanlış, ince isleri kaba insaattan sonra baslayan dekoratif bir süreç sanmaktir. Oysa ince islerin basarisi, kaba insaattan devralinan duzlugu, tesisat koordinasyonunu ve koruma disiplinini doğrudan kullanir. Kötü bir altlik uzerine iyi urun koymak, kusuru pahali malzemeyle ortmeye çalışmak anlamina gelir.",
      "Bir inşaat mühendisi için ince isler; numune mahal kurmak, kabul kriteri tanimlamak, bir sonraki ekibin önceki ekibi bozmasini engellemek ve kullaniciya temiz bir teslim zinciri kurmaktir. Bu nedenle finish fazi, usta becerisinden ibaret değil; planlama ve saha kontrol kabiliyeti isteyen bir mühendislik paketidir.",
      "Bu rehberde ince isleri; teknik mantik, standart ekseni, sayisal mahal hazirlik yorumu, ekipmanlar, saha ipuclari ve sık hatalarla birlikte uzun-form bir bitis rehberi olarak ele aliyoruz.",
    ],
    theory: [
      "Ince islerin teorik cekirdegi, altlik ile son kat arasindaki uyumdur. Sıva, şap, kaba boşluk ve tesisat cikislari gibi önceki iş kalemleri ne kadar kontrollu tamamlandiysa, ince iş urunleri de o kadar sakin davranir. Ters durumda boya iz yapar, fayans derzi sasar, kapılar surtur ve zemin kaplamaları erken bozulur.",
      "Nem ve kuruma davranisi ikinci ana eksendir. Duvar ve zeminler yeterli kuruma seviyesine gelmeden montaja zorlandiginda, problem cogu zaman ilk gun değil birkaç hafta veya mevsim sonra ortaya çıkar. Parke siser, boya kabarir, derz kararir veya duvar kagidi ayrilir. Bu nedenle finish kalitesinin temelinde doğru zamanlama vardir.",
      "Ince isler aynı zamanda tolerans sanatidir. Milimetrik hata kaba insaatta fark edilmeyebilir; ama son katta yan isik, derz ritmi ve doğrama boşluğu uzerinden hemen görünür hale gelir. Bu nedenle finish fazinda kabul, tek bir genel bakisla değil mahal, eksen ve detay bazinda yapilmalidir.",
      "Koruma ve teslim sırası da kritik konudur. Tamamlanmis zemin, duvar veya doğrama bir sonraki ekibin malzeme indirip ciktigi serbest alan gibi kullanilamaz. Koruma ortusu, mahal kilidi, gecici teslim ve foto arşivi olmadan ince isler tekrar iş ureten bir donguye girer.",
      "Bu bakisla ince isler yapının en hassas ama en yanlış anlasilan fazidir. Basit gorundugu için hafife alinan bu kalemler, kullanicinin yapiya dair algisini asil belirleyen katmandir.",
    ],
    ruleTable: [
      {
        parameter: "Altlik ve tolerans kabulü",
        limitOrRequirement: "Son kat urun öncesi duzlem, nem ve detay kabulü yazili kriterle yapilmalidir",
        reference: "TS EN 13914 + saha kalite plani",
        note: "Altlik kabul edilmeden baslayan finish hizi sahte hiz uretir.",
      },
      {
        parameter: "Enerji ve kabuk butunlugu",
        limitOrRequirement: "Çatı, doğrama ve kaplama detaylari enerji kabuguyla birlikte okunmalidir",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Bitis kalitesi yalnız görsel değil, performans konusudur.",
      },
      {
        parameter: "Kaplama sistem uyumu",
        limitOrRequirement: "Yapıştırıcı, astar, derz ve altlik kararlari urun tipine uygun secilmelidir",
        reference: "TS EN 12004 + TS EN 13329",
        note: "Tüm malzemeler aynı refleksle uygulanamaz.",
      },
      {
        parameter: "Numune mahal ve tekrar edilebilir kalite",
        limitOrRequirement: "Ilk uygulama mahali tüm sahaya kalite referansi olmalidir",
        reference: "Teslim kalite plani",
        note: "Numune yapilmayan finish islerinde ekipler arasi kalite kopar.",
      },
      {
        parameter: "Koruma ve son teslim",
        limitOrRequirement: "Tamamlanan yuzeyler bir sonraki ekipten korunarak devredilmelidir",
        reference: "Saha koruma plani",
        note: "Korumasiz finish, tamamlanmis sayilamaz.",
      },
    ],
    designOrApplicationSteps: [
      "Mahal bazli finish matrisini olustur ve her hacmin duvar, zemin, tavan, doğrama ve islak hacim kararlarini tek listede birlestir.",
      "Sıva, şap, nem, boşluk ve tesisat cikislarini son kat öncesi olculu kabul ile kapat.",
      "Numune mahal kurarak boya, derz, köşe, süpürgelik ve doğrama bitis dilini sahada sabitle.",
      "Ince iş ekiplerini koruma planiyla birlikte sirala; bir sonraki ekibin önceki isi bozmasini engelle.",
      "Yan isik, nem, modul ve acilma-kapanma testleriyle son kabul turu yap.",
      "Teslim öncesi mahal bazli fotograf, eksik listesi ve koruma cikarma planini yonet.",
    ],
    criticalChecks: [
      "Kaplama öncesi tüm altliklar gercekten kabul edildi mi?",
      "Mahal bazli finish listesi ile sahadaki urunler aynı mi?",
      "Numune mahal kararlari tüm blokta aynı kalitede tekrarlandi mi?",
      "Tamamlanan yuzeyler bir sonraki ekipten korunuyor mu?",
      "Nem ve isik altinda bozulacak detaylar erken yakalandi mi?",
      "Son teslim turunda islev ve görsel kalite birlikte kontrol edildi mi?",
    ],
    numericalExample: {
      title: "24 mahalde ince iş başlangıç hazirlik oraninin yorumu",
      inputs: [
        { label: "Toplam mahal", value: "24 adet", note: "Ornek bir kat ve ortak alan grubu" },
        { label: "Altlik kabulunu gecen mahal", value: "18 adet", note: "Sıva, şap ve nem acisindan hazir" },
        { label: "Eksik kalan mahal", value: "6 adet", note: "Nem, doğrama veya tesisat sorunu var" },
        { label: "Hedef", value: "Saglikli finish başlangıcı", note: "Tekrar iş riskini azaltmak" },
      ],
      assumptions: [
        "Hazir mahal ile hazir olmayan mahal aynı ekip tarafindan yapilacaktir.",
        "Numune mahal kararlari tamamlanmistir.",
        "Hazir olmayan mahaller kritik geçiş noktalarina sahiptir.",
      ],
      steps: [
        {
          title: "Hazirlik oranini hesapla",
          formula: "18 / 24 = 0,75",
          result: "Toplam mahalin yaklasik %75'i finish için hazirdir.",
          note: "Yuzde yüksek gorunse de kalan %25, iş akisini ve kaliteyi bozabilir.",
        },
        {
          title: "Zincir etkisini yorumla",
          result: "Hazir olmayan 6 mahalin tesisat ve nem kaynakli eksikleri varsa finish ekibi parca parca calisarak ritmini kaybeder.",
          note: "Parcali başlangıç, teslimde ton ve kalite farki uretir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Ince isler, yalnız metraj uygunlugu değil hazirlik butunlugu yakalandiginda hızlı ilerler.",
          note: "Erken baslamak ile doğru baslamak aynı sey degildir.",
        },
      ],
      checks: [
        "Hazirlik oraninin icine kritik hacimler ayrıca dahil edilmelidir.",
        "Numune mahal karari olmadan toplu finish başlangıcı yapilmamalidir.",
        "Hazir olmayan mahallerin sebebi teknik ofis tarafindan kayıt altina alinmalidir.",
        "Bitis ekipleri blok blok veya mahal grup mantigiyla planlanmalidir.",
      ],
      engineeringComment: "Ince islerde takvimi gercekten koruyan sey erken baslamak değil, hazir olmayan mahal sayisini erken gormektir.",
    },
    tools: FINISH_FINAL_TOOLS,
    equipmentAndMaterials: FINISH_FINAL_EQUIPMENT,
    mistakes: [
      { wrong: "Ince isleri urun secimi ve metraj seviyesinde yonetmek.", correct: "Altlik kabul, numune mahal ve koruma planiyla birlikte yonetmek." },
      { wrong: "Nem, duzlem ve boşluk hatalarini finish ekibinin duzeltmesini beklemek.", correct: "Bu hatalari finish öncesi kapatmak." },
      { wrong: "Her ekibe kendi kabul kriterini sahada belirletmek.", correct: "Mahal bazli ortak kalite dili kurmak." },
      { wrong: "Koruma planini luks görmek.", correct: "Tamamlanan islerin korunmasini asli teslim kalemi saymak." },
      { wrong: "Görsel kabulu tek acidan yapmak.", correct: "Yan isik, islev ve detay butunlugu ile kontrol etmek." },
      { wrong: "Son kullanicinin en fazla bu fazi gordugunu unutmak.", correct: "Ince isi sahadaki en görünür kalite sinavi olarak ele almak." },
    ],
    designVsField: [
      "Projede ince isler malzeme kodlari gibi görünür; sahada ise aynı kodlar nem, tolerans ve koruma disiplini ister.",
      "Iyi ince isler dikkat cekmeden temiz görünür; kötü ince isler ise kullanıcı binaya girer girmez kendini belli eder.",
      "Bu nedenle finish fazi, yapının itibariyla doğrudan bağlantılı bir kalite alanidir.",
    ],
    conclusion: [
      "Ince isler doğru altlik, doğru zamanlama ve doğru teslim disipliniyle yurutuldugunde yapının algilanan kalitesini belirgin bicimde yukselten faz haline gelir.",
      "Yanlış yurutuldugunde ise en pahali malzeme bile daginik gorunen, tekrar iş isteyen ve kullaniciyi tatmin etmeyen bir sonuca donusur.",
    ],
    sources: [...FINISH_FINAL_SOURCES, SOURCE_LEDGER.tsEn13914, SOURCE_LEDGER.tsEn12004, SOURCE_LEDGER.tsEn13329],
    keywords: ["ince isler", "finish matrix", "numune mahal", "nem kontrolü", "saha teslim kalitesi"],
    relatedPaths: ["ince-isler/siva", "ince-isler/duvar-kaplamalari", "ince-isler/zemin-kaplamalari", "ince-isler/kapi-pencere", "ince-isler/cati-kaplamasi"],
  },
  {
    slugPath: "ince-isler/cati-kaplamasi",
    kind: "topic",
    quote: "Çatı kaplaması, üst ortuyu kapatmak değil; suyu, buhari ve ruzgari teknik bir rota ile yapidan uzaklastirmaktir.",
    tip: "Catiyi yalnız üst malzeme secimi gibi görmek, asil riski mahya, dere, baca dibi ve kenar detaylarinda biriktirir.",
    intro: [
      "Çatı kaplaması; membran, kiremit, metal panel veya benzeri sistemlerle yapının en kritik dış etki sinirini olusturur. Kullanıcı için gorunen sey bir üst ortu olsa da teknik gercekte bu paket su, buhar, rüzgar ve gunes davranisinin birlikte yonetildigi çok katmanli bir kabuktur.",
      "Sahadaki en pahali hatalardan biri, çatı sorunlarini genel yuzeyde arayip düğüm detaylarini ikinci plana atmaktir. Oysa kacaklarin buyuk kismi mahya, dere, baca dibi, parapet ve sakak bitislerinde ortaya çıkar. Genis alan temiz gorunse bile zayif tek bir detay tüm sistemi bozabilir.",
      "Bir inşaat mühendisi için çatı kaplaması; yalitim, bindirme, sabitleme, bakım erisimi ve tahliye dugumlerini birlikte okumak demektir. Uretici katalogu tek basina yetmez; sahadaki su akisi, egim gercegi ve rüzgar emmesi gibi etkiler yerinde kontrol ister.",
      "Bu rehberde çatı kaplamasini; teknik teori, enerji ve kabuk ekseni, sayisal tahliye yorumu, ekipmanlar ve saha hatalariyla birlikte uzun-form bir uygulama yazisi olarak ele aliyoruz.",
    ],
    theory: [
      "Çatı davranisinda ilk ilke, suyu yuzeyde tutmamak ve her katmanda ikinci bir savunma cizgisi olusturmaktir. Üst kaplama suyu atar, alt katmanlar ise beklenmeyen girisleri kontrol eder. Bu nedenle çatı kalitesi sadece kaplama malzemesiyle değil, katman surekliligiyle olculur.",
      "Egim ve tahliye, kaplama tipinden bağımsız temel mühendislik kararidir. Kiremitte egim yetersizligi suyu bindirme altina iter, metal çatı veya membranda ise lokal gol ve ters egim noktalarinda sızıntı başlar. Kagit uzerindeki egim notu, sahada nivoyla ve su testiyle dogrulanmiyorsa guvenilir sayilamaz.",
      "Rüzgar etkisi ozellikle kenar ve köşe bolgelerinde belirginlesir. Bu nedenle sabitleme ritmi, klips veya vida araligi ve bindirme yonu standarda uygun kurulmalidir. Kaplama kaybi genellikle kenarda başlar ama tüm yuzeyin emniyet algisini bozar.",
      "TS 825 ve enerji performansi mantigi catiyi yalnız su gecirmezlik konusu olmaktan cikarir. Isi kacagi, buhar kontrolü ve kabuk surekliligi çatı katmanlarinin uzun omurlu davranmasi için duvar kadar önemlidir.",
      "Çatı kaplamasinda saha ipucu olarak en kritik davranis, detay tamamlandikca fotograf ve kontrol notu biriktirmektir. Cunku mahya altindaki bindirme, baca dibi yukseltmesi veya gizli kalan vida plani kaplama kapandiktan sonra okunamaz hale gelir. Iyi ekipler sorunu yalnız cozen değil, çözümü kayıt altina alan ekiplerdir.",
      "Son olarak çatı, bakım isteyen bir sistemdir. Oluk temizligi, mahya gozlemi ve cihaz gecislerinin periyodik kontrolü dusunulmeden tamamlanan bir çatı, ilk sezonda sorun cikaracak sekilde yarim teslim edilmis olur.",
    ],
    ruleTable: [
      {
        parameter: "Katman surekliligi",
        limitOrRequirement: "Buhar, isi ve su katmanlari sistem butunlugu icinde kesintisiz kurulmalidir",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Bir katmandaki boşluk, tüm çatının davranisini zayiflatir.",
      },
      {
        parameter: "Egim ve tahliye",
        limitOrRequirement: "Kaplama tipine uygun egim ve tahliye yolu saha olcumu ile doğrulanmalıdır",
        reference: "Çatı detay paftası",
        note: "Yetersiz egim, suyu detaylara geri iter.",
      },
      {
        parameter: "Kritik düğüm detaylari",
        limitOrRequirement: "Mahya, dere, baca dibi, parapet ve sakak bitisleri sistem aksesuarlarina uygun çözülmelidir",
        reference: "Uretici sistem rehberi + saha kalite plani",
        note: "Kacaklarin buyuk bolumu bu alanlarda başlar.",
      },
      {
        parameter: "Rüzgar ve sabitleme",
        limitOrRequirement: "Kenar ve köşe bolgelerinde sabitleme düzeni emniyetli sekilde artirilmalidir",
        reference: "Uygulama rehberi",
        note: "Kenar bolgesi, genel alandan farkli davranir.",
      },
      {
        parameter: "Bakım erisimi",
        limitOrRequirement: "Oluk, cihaz gecisi ve kritik detaylar sonradan kontrol edilebilir kalmalidir",
        reference: "Isletme ve teslim plani",
        note: "Bakım dusunulmeyen çatı yarim teslimdir.",
      },
    ],
    designOrApplicationSteps: [
      "Çatı tipine göre su akisini, tahliye noktasini ve katman dizisini proje basinda sabitle.",
      "Alt taşıyıcı ve alt katman duzgunlugunu kaplama öncesi bağımsız kabul kalemi olarak degerlendir.",
      "Mahya, dere, baca dibi ve parapet donuslerini saha dogaclamasina birakmadan detay paftası ile coz.",
      "Kaplama montajinda bindirme yonu, sabitleme ritmi ve kenar guvenligini aks aks takip et.",
      "Kritik dugumlerde kontrollu su testi ve gozlemsel kabul turu yap.",
      "Bakım senaryosunu ve sonradan gizlenecek katman fotograflarini teslim dosyasina ekle.",
    ],
    criticalChecks: [
      "Genel egim gercekten tahliyeye yonlendiriyor mu?",
      "Alt katmanlarda yirtik, ters bindirme veya kopukluk var mi?",
      "Baca dibi, dere ve mahya detaylari sistematik sekilde tamamlandi mi?",
      "Kenar ve sakak bolgelerinde sabitleme sikligi yeterli mi?",
      "Su testi kritik dugumleri de kapsadi mi?",
      "Oluk ve bakım erisimi teslim dosyasina islendi mi?",
    ],
    numericalExample: {
      title: "600 m2 çatı yuzeyinde tahliye dagilimi yorumu",
      inputs: [
        { label: "Çatı alani", value: "600 m2", note: "Ornek tek hacim" },
        { label: "Tahliye noktası", value: "4 adet", note: "Es dagilim varsayimi" },
        { label: "Bir tahliyeye dusen alan", value: "150 m2", note: "Yaklasik dagilim" },
        { label: "Hedef", value: "Lokal gol riskini azaltmak", note: "Detay kabulunde kullanilacak" },
      ],
      assumptions: [
        "Tahliye konumlari egim planiyla uyumludur.",
        "Oluk ve inisler montaj sonrasi acik tutulacaktir.",
        "Su testi kritik dugumleri de kapsayacaktir.",
      ],
      steps: [
        {
          title: "Alan dagilimini oku",
          formula: "600 / 4 = 150 m2",
          result: "Her tahliye noktasina dusen alan dengeli gorunmektedir.",
          note: "Ancak bu tek basina yeterli degildir; dere boyu ve lokal gol riski ayrıca kontrol edilmelidir.",
        },
        {
          title: "Dugum riskini ekle",
          result: "Baca dibi ve parapet donusleri, genis yuzeyden daha yüksek kacak riski tasir.",
          note: "Bu nedenle kabul turunda yalnız yatay yuzeye bakmak eksik kalir.",
        },
        {
          title: "Bakım etkisini yorumla",
          result: "Oluk temizligi ve yaprak birikimi için erişim yoksa ilk kis mevsiminde sistem davranisi bozulabilir.",
          note: "Bakım plani çatı performansinin parcasidir.",
        },
      ],
      checks: [
        "Tahliye sayisi kadar konumu da sorgulanmalidir.",
        "Su testinde mahya, dere ve baca dibi ayrıca izlenmelidir.",
        "Bakım erisimi olmayan çatı uzun omurlu kabul edilmemelidir.",
        "Alt katman fotograflari teslim dosyasinda tutulmalidir.",
      ],
      engineeringComment: "Çatı kaplamasinda sorun genellikle ortada değil, detay cizgisinde başlar.",
    },
    tools: FINISH_FINAL_TOOLS,
    equipmentAndMaterials: [
      { group: "Alt katman", name: "Buhar kesici, isi yalitimi ve su yalitimi katmanlari", purpose: "Kaplama öncesi kabuk davranisini kontrol etmek.", phase: "Alt hazirlik" },
      { group: "Kaplama", name: "Kiremit, membran veya metal panel sistemi", purpose: "Ana su atma ve dış etki dayanimini saglamak.", phase: "Kaplama montaji" },
      { group: "Birleşim", name: "Mahya, dere, kenar ve baca dibi aksesuarlari", purpose: "Kritik çatı dugumlerini güvenli sekilde kapatmak.", phase: "Detay çözümü" },
      { group: "Sabitleme", name: "Vida, klips ve rüzgar güvenlik elemanlari", purpose: "Kaplamanin yerinde ve emniyetli kalmasini saglamak.", phase: "Sabitleme" },
    ],
    mistakes: [
      { wrong: "Çatı kalitesini yalnız üst malzemeyle degerlendirmek.", correct: "Alt katman ve düğüm detaylarini ana kalite kalemi saymak." },
      { wrong: "Egim planini sahada dogaclama cozumek.", correct: "Su yonunu uygulama öncesi netlestirip sahada olcmek." },
      { wrong: "Baca dibi ve dere cozumlerini usta inisiyatifine birakmak.", correct: "Sistem detaylariyla ilerlemek." },
      { wrong: "Su testini atlamak.", correct: "Kritik dugumlerde kontrollu test yapmak." },
      { wrong: "Bakım yolunu ve oluk temizligini dusunmemek.", correct: "Isletme senaryosunu teslim dosyasina dahil etmek." },
      { wrong: "Kenar ve köşe bolgelerinde genel sabitleme ritmiyle yetinmek.", correct: "Rüzgar etkisini yerel olarak degerlendirmek." },
    ],
    designVsField: [
      "Projede çatı bir kesit ve üst gorunusle anlatilir; sahada ise her düğüm ayri mühendislik karari ister.",
      "Iyi çatı sessiz calisir ve suyu yapidan uzaklastirir; kötü çatı ise ilk siddetli yagista kendini belli eder.",
      "Bu nedenle çatı kalitesi, malzemeden çok detay disiplininde ortaya çıkar.",
    ],
    conclusion: [
      "Çatı kaplaması doğru katman kurgusu, doğru tahliye ve doğru düğüm detaylari ile calistiginda yapının en guvenilir koruyucu katmani olur.",
      "Eksik detayla yurutuldugunde ise tamir maliyeti yüksek, ariza takibi zor ve itibar kaybi buyuk bir saha sorununa donusur.",
    ],
    sources: [...FINISH_FINAL_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["çatı kaplaması", "mahya", "dere", "su tahliyesi", "TS 825"],
    relatedPaths: ["ince-isler/cati-kaplamasi/kiremit", "ince-isler/cati-kaplamasi/membran-cati", "ince-isler/cati-kaplamasi/metal-cati", "kaba-insaat/cati-iskeleti"],
  },
  {
    slugPath: "tesisat-isleri/isitma-sogutma",
    kind: "topic",
    quote: "Isıtma-soğutma sistemlerinde konfor, cihaz kapasitesinden çok dagitimin dengeli kurulmasiyla hissedilir.",
    tip: "Hatlar test edilmeden, dengeleme yapilmadan ve kontrol senaryosu yazili hale getirilmeden kapatilan sistemler kullaniciya dengesiz sıcaklık ve yüksek enerji tuketimi olarak geri doner.",
    intro: [
      "Isıtma-soğutma sistemleri; ısıtma uretimi, soğutma, dağıtım hatlari, terminal cihazlar ve kontrol elemanlarindan olusan bir konfor zinciridir. Bu zincirin herhangi bir halkasi zayif kaldiginda en pahali cihaz dahi beklenen kullanıcı memnuniyetini uretemez.",
      "Sahada en sık gorulen yanlış, cihaz kapasitesini ana karar sanip dağıtım geometrisini ikinci plana atmaktir. Oysa devre boyu, kollektör konumu, vana ayari, yoğuşma drenaji, boru izolasyonu ve bakım erisimi gercek performansi belirler.",
      "Bir inşaat mühendisi için ısıtma-soğutma; mekanik ekiplerin cektigi borulari izlemekten daha fazlasidir. Kapatma sirasini, şap altinda kalacak devreleri, tavan ustu bakım bosluklarini ve otomasyonun gercek senaryo ile calisip calismadigini birlikte görmek gerekir.",
      "Bu rehberde ısıtma-soğutma sistemlerini; teknik teori, enerji ve devreye alma ekseni, sayisal devre boyu yorumu, ekipmanlar ve saha hatalariyla birlikte uzun-form bir mekanik blog yazisi gibi ele aliyoruz.",
    ],
    theory: [
      "Mekanik konfor sistemlerinde kullanıcı memnuniyetsizligi cogunlukla yetersiz kapasiteden değil, dengesiz dagitimdan kaynaklanir. Bir mahale fazla debi giderken baska mahalin yetersiz beslenmesi, teorik olarak doğru secilmis cihazi pratikte yetersiz hale getirir.",
      "Hidronik sistemlerde hat uzunlugu, basinc kaybi ve devre dengelemesi birlikte okunmalidir. Hava tarafinda ise menfez yerlesimi, kanal kacaklari ve kontrol algoritmasi doğrudan konfor davranisi uretir. Proje paftası bu iliskileri gosterir ama saha ancak test ile dogrular.",
      "Yoğuşma drenaji ve izolasyon kalinligi ozellikle soğutma çalışan sistemlerde kritik hale gelir. Sahada ihmal edilen küçük bir egim veya eksik izolasyon, tavanda leke, kuf ve su damlamasina donusebilir. Bu nedenle drenaj, cihaz aksesuari değil ana kalite kalemidir.",
      "Enerji performansi yaklasiminda cihaz verimi tek basina anlamli degildir. Dağıtım kaybi, dengesiz oda kontrolü ve izolasyon kopuklugu enerji etiketindeki avantaji sahada siler. Bu nedenle ısıtma-soğutma kalitesi, proje ve isletme arasindaki en belirgin kopma noktasidir.",
      "Sahadaki pratik ipucu, kapatilacak her mekanik zonu yalnız test raporuyla değil mahal bazli foto ve etiket listesiyle teslim etmektir. Kollektor devresi, vana yonu, drenaj çıkışı ve termostat mahali yazili olmadiginda ilk servis mudahalesi gereksiz zaman kaybi ve yeniden dengeleme masrafi uretir.",
      "Iyi mekanik montaj görünmez olabilir; ama kötü devreye alma her gun hissedilir. Sıcaklık farki, gürültü, yoğuşma ve dengesiz oda performansi kullanicinin ilk geri bildirimi olur.",
    ],
    ruleTable: [
      {
        parameter: "Yalitim ve enerji kaybi",
        limitOrRequirement: "Hat ve cihaz izolasyonu enerji kaybini ve yoğuşma riskini sinirlandirmalidir",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Eksik yalitim, cihaz verimini sahada dusurur.",
      },
      {
        parameter: "Bakım erisimi",
        limitOrRequirement: "Kollektor, vana, cihaz ve kontrol elemanlari mudahale edilebilir kalmalidir",
        reference: "MEP uygulama disiplini",
        note: "Bakım yapilamayan sistem teslim edilmis sayilmaz.",
      },
      {
        parameter: "Devre boyu ve dengeleme",
        limitOrRequirement: "Dağıtım sistemi dengeli devre boylari ve ayarlanabilir hat mantigiyla kurulmalidir",
        reference: "Sistem tasarim ilkeleri",
        note: "Ozellikle yerden ısıtma ve kollektorlu cozumlerde kritik kontroldur.",
      },
      {
        parameter: "Drenaj ve yoğuşma kontrolü",
        limitOrRequirement: "Soğutma hatlari ve cihazlar suyu kontrollu tahliye edecek sekilde kurgulanmalidir",
        reference: "Saha devreye alma plani",
        note: "Küçük bir ters egim, tavan lekesine donusur.",
      },
      {
        parameter: "Devreye alma ve kontrol",
        limitOrRequirement: "Termostat, vana ve otomasyon ayarlari kayitli dogrulamayla tamamlanmalidir",
        reference: "BEP Yönetmeliği + saha devreye alma disiplini",
        note: "Ayarsiz sistemler montaji tamamlanmis gorunse de isletmede sorun uretir.",
      },
    ],
    designOrApplicationSteps: [
      "Sistem tipini mahal kullanım, enerji hedefi ve bakım kurgusuyla birlikte sec.",
      "Kollektor, cihaz ve ana boru guzergahlarini erişim ve mudahale senaryosuna göre yerlestir.",
      "Devre uzunluklarini, basinc kaybini ve dengeleme ihtiyacini montaj başlamadan coz.",
      "Basinc testi, izolasyon, drenaj ve aski kontrollerini kapatma oncesinde tamamla.",
      "Devreye alma sirasinda sıcaklık dagilimi, debi dengesi ve kontrol ayarlarini kayıt altina al.",
      "Isletmeye teslim öncesi kullaniciya birakilan kontrol mantigini ve bakım noktalarini son kez doğrula.",
    ],
    criticalChecks: [
      "Kollektor ve cihazlar servis için erişilebilir mi?",
      "Devre boylari birbirinden asiri sapiyor mu?",
      "Basinc testi ve foto-kayıt kapatma öncesi tamamlandi mi?",
      "Yoğuşma drenaji, egim ve tahliye noktaları gercekten calisiyor mu?",
      "Izolasyon surekliligi kesintisiz mi?",
      "Termostat, vana ve otomasyon ayarlari teslim dosyasina islendi mi?",
    ],
    numericalExample: {
      title: "Yerden ısıtma devre boyu dengesi için saha yorumu",
      inputs: [
        { label: "Mahal alani", value: "32 m2", note: "Salon" },
        { label: "Devre sayisi", value: "3 adet", note: "Kollektorlu sistem" },
        { label: "Devre uzunluklari", value: "95 m, 100 m, 105 m", note: "Ornek saha plani" },
        { label: "Hedef", value: "Dengeli isi dagilimi", note: "Homojen konfor için" },
      ],
      assumptions: [
        "Boru araligi tüm mahalde benzer tutulacaktir.",
        "Kollektor konumu bu mahal için uygundur.",
        "Sap öncesi sistem basinc altinda teslim alinacaktir.",
      ],
      steps: [
        {
          title: "Uzunluk farkini oku",
          formula: "(105 - 95) / 100 ~= %10",
          result: "Yaklasik %10 boy farki, dengeleme acisindan yonetilebilir bandi isaret eder.",
          note: "Fark buyudukce bazi devreler daha zor dengelenir ve sıcaklık farki artar.",
        },
        {
          title: "Sap öncesi riski yorumla",
          result: "Basinc altindaki sistem foto ve test kaydı olmadan şap altina birakilmamalidir.",
          note: "Sap sonrasi mudahale maliyeti yüksek ve yikicidir.",
        },
        {
          title: "Isletme ayarini ekle",
          result: "Kollektor uzerindeki dengeleme degerleri teslim klasorune yazilmalidir.",
          note: "Aksi halde ilk bakimda ayarlar kaybolur ve sistem tekrar dengesizlesir.",
        },
      ],
      checks: [
        "Devre boylari asiri dengesiz birakilmamalidir.",
        "Kollektor etiketi ve mahal karsiligi net olmalidir.",
        "Sap öncesi test ve kayıt tamamlanmalidir.",
        "Devreye alma sonucu yalnız sozlu değil yazili birakilmalidir.",
      ],
      engineeringComment: "Isıtma-soğutma sistemlerinde kullanıcı en çok cihazi değil, dagitimin dengesini hisseder.",
    },
    tools: MEP_FINAL_TOOLS,
    equipmentAndMaterials: MEP_FINAL_EQUIPMENT,
    mistakes: [
      { wrong: "Devre boylarini sahada rastgele ayirmak.", correct: "Dengeli dağıtım mantigiyla planlamak." },
      { wrong: "Kollektoru erisimsiz yere koymak.", correct: "Bakım ve dengeleme erisimini korumak." },
      { wrong: "Sap öncesi test yapmadan sistemi kapatmak.", correct: "Basinc ve foto-kayitla teslim almak." },
      { wrong: "Yoğuşma drenajini ikincil görmek.", correct: "Soğutma sisteminde ana kontrol kalemi saymak." },
      { wrong: "Devreye alma ayarlarini kayitsiz birakmak.", correct: "Dengeleme degerlerini teslim dokumanina islemek." },
      { wrong: "Otomasyon ve termostat konumlarini kullanım senaryosundan kopuk birakmak.", correct: "Kontrol stratejisini saha isletmesiyle birlikte dogrulamak." },
    ],
    designVsField: [
      "Tasarim tarafinda ısıtma-soğutma semasi yeterli gorunebilir; sahada ise boru boyu, izolasyon, drenaj ve bakım erisimi sistemi gercekten calistirir.",
      "Bu yuzden konfor tesisati, en çok devreye alma aninda mühendislik niteligini belli eder.",
      "Iyi mekanik montaj görünmez olabilir; kötü devreye alma ise sıcaklık farki, gürültü ve yüksek enerji tuketimi olarak hissedilir.",
    ],
    conclusion: [
      "Isıtma-soğutma isleri doğru dağıtım ve doğru kayitla yurutuldugunde enerji verimli ve dengeli konfor sağlar.",
      "Yanlış yurutuldugunde cihaz kapasitesi yeterli olsa bile kullanıcı memnuniyetsizligi ve yüksek isletme gideri ortaya çıkar.",
    ],
    sources: [...MEP_FINAL_SOURCES, SOURCE_LEDGER.ts825, SOURCE_LEDGER.enerjiPerformansi],
    keywords: ["ısıtma soğutma", "yerden ısıtma", "mekanik dengeleme", "yoğuşma drenaji", "konfor tesisati"],
    relatedPaths: ["tesisat-isleri/isitma-sogutma/yerden-isitma", "tesisat-isleri/isitma-sogutma/klima-tesisat", "tesisat-isleri", "proje-hazirlik/tesisat-projesi"],
  },
  {
    slugPath: "proje-hazirlik/yapi-ruhsati",
    kind: "topic",
    quote: "Yapı ruhsatı, cizimin resmilesmesi değil; sahadaki imalatin hukuki ve teknik sorumluluk cercevesine girmesidir.",
    tip: "Ruhsat surecini sadece evrak toplama olarak görmek, saha baslangicinda onayli set ile uygulama seti arasinda tehlikeli bir kopukluk uretir.",
    intro: [
      "Yapı ruhsatı, bir binanin imar mevzuatina, proje disiplinine ve idari onay zincirine uygun sekilde sahaya cikabilmesi için zorunlu esiktir. Bu asama yalnız belediye onayi almak değil; hangi pafta takimiyla, hangi sorumluluk zinciriyle ve hangi hukuki cercevede imalata baslandigini kayda baglamaktir.",
      "Sahada ruhsat süreci genellikle teknik ofisin kapali dosya isi gibi gorulur. Oysa ruhsat eki paftalar, sonraki uygulama detaylari ve yapı denetim akisi arasindaki kopma iyi yonetilmezse saha baslangicinda herkes farkli set uzerinden iş yapmaya başlar. Bu da revizyon karmasasi, durdurma ve tekrar uretir.",
      "Bir inşaat mühendisi için yapı ruhsatı; evrak sirasindan çok set yönetimi, resmi not takibi, disiplinler arasi tutarlilik ve sahaya gidecek guncel referans takimini kurma problemidir. Ruhsat alindigi an iş bitmez; tam tersine kontrollu saha baslangicinin en kritik esigi gecilmis olur.",
      "Bu rehberde yapı ruhsatini; resmi mevzuat ekseni, sayisal süre yorumu, dokuman akisi, saha ipuclari ve sık hatalarla birlikte uzun-form bir teknik ofis yazisi olarak ele aliyoruz.",
    ],
    theory: [
      "Ruhsat, tasarim olgunlugu ile idari uygunlugun kesistigi noktadir. Mimari, statik, mekanik ve elektrik setlerinin birbirini desteklemesi gerekir; aksi halde idareden donen notlar tek bir disiplini değil tüm süreci etkiler. Bu nedenle ruhsat kalitesi, proje setleri arasindaki en temel tutarlilik testidir.",
      "Uygulamadaki en kritik yanlış, ruhsat setini sahadaki detay seviyesi için yeterli saymaktir. Ruhsat paftalari genellikle ana kararlar icindir; uygulama detaylari ve saha toleranslari sonradan ayrıca derinlestirilmelidir. Bu fark yazili ve kontrollu yonetilmiyorsa, sahada ruhsatta boyle degildi catismasi dogar.",
      "Yapı denetim ve sorumluluk zinciri ruhsat surecinin ayrilmaz parcasidir. Onay, denetim, revizyon ve saha kabul adimlari ayri klasorlerde daginik tutulursa kimin hangi degisikligi ne zaman onayladigi izlenemez hale gelir.",
      "Ruhsat takvimi de teknik gerceklikten kopuk planlanmamalidir. Idari geri donus, teknik ofis revizyonu, denetim koordinasyonu ve sahaya guncel set dagitimi birbirini izleyen asamalardir. Ruhsatin alindigi gun ile sağlıklı saha başlangıcı aynı gun olmak zorunda degildir.",
      "Bu nedenle ruhsat süreci hukuki formalite değil, teknik bir transfer operasyonudur. Onayli set, sahadaki uygulama diline kontrollu bicimde cevrilmedikce ruhsat alinmis olmasi tek basina kalite uretmez.",
    ],
    ruleTable: [
      {
        parameter: "Ruhsat basvurusu ve uygunluk",
        limitOrRequirement: "Onayi gerektiren proje ve belgeler eksiksiz ve tutarli olmalidir",
        reference: "3194 sayili Imar Kanunu",
        note: "Eksik veya tutarsiz setler ruhsat takvimini bozar.",
      },
      {
        parameter: "Proje muellifi ve denetim zinciri",
        limitOrRequirement: "Sorumluluklar kayitli ve izlenebilir bicimde kurulmalidir",
        reference: "4708 sayili Yapı Denetimi Hakkinda Kanun",
        note: "Saha kontrol süreci ruhsat eki belgelerden kopuk yuruyemez.",
      },
      {
        parameter: "Proje seti ve idari kararlar",
        limitOrRequirement: "Planli alan kararlari, cekme mesafeleri ve bağımsız bölüm mantigi setlerde tutarli olmalidir",
        reference: "Planli Alanlar Imar Yönetmeliği",
        note: "Idari tutarsizlik, saha revizyonuna donusen resmi risktir.",
      },
      {
        parameter: "Ruhsat seti ile uygulama seti ayrimi",
        limitOrRequirement: "Onayli set ve saha uygulama seti fark takibiyle yonetilmelidir",
        reference: "Teknik ofis revizyon disiplini",
        note: "Tek klasor mantigi sahada karisiklik uretir.",
      },
      {
        parameter: "Resmi not ve revizyon kaydı",
        limitOrRequirement: "Idareden donen notlar pafta revizyon sistemine islenmelidir",
        reference: "Belge takip plani",
        note: "Mail kutusunda kalan not, teknik karar sayilmaz.",
      },
    ],
    designOrApplicationSteps: [
      "Imar durumu, aplikasyon ve arsa verilerini guncel resmi girdilerle netlestir.",
      "Mimari, statik ve tesisat setlerini ruhsat basvurusu seviyesinde tutarli hale getir.",
      "Muelliflik, denetim ve basvuru evrak zincirini eksiksiz dosyala.",
      "Onay sonrasinda ruhsat eki set ile sahaya gidecek uygulama seti arasindaki farki teknik ofis kaydina al.",
      "Idare ve yapı denetim notlarini revizyon matrisine isleyerek guncel tek referans takimi sahaya dagit.",
      "Saha baslangicinda eski pafta riskini sifirlayacak dağıtım ve arsiv disiplinini kur.",
    ],
    criticalChecks: [
      "Ruhsat eki paftalar ile saha uygulama paftalari arasindaki fark yazili mi?",
      "Muellif ve denetim sorumluluk zinciri eksiksiz mi?",
      "Belediye veya idareden donen notlar teknik ofise akti mi?",
      "Ruhsat setinde cozulmeyen detaylar uygulama setinde kapatildi mi?",
      "Saha baslangicinda gecerli tek referans takimi belli mi?",
      "Eski pafta ve yeni revizyonun aynı anda sahada bulunma riski kapatildi mi?",
    ],
    numericalExample: {
      title: "Ruhsat başlangıcı için belge akis süresi yorumu",
      inputs: [
        { label: "Disiplin proje seti", value: "4 ana set", note: "Mimari, statik, mekanik, elektrik" },
        { label: "Resmi kontrol turu", value: "2 tur", note: "Ilk basvuru + not kapanisi" },
        { label: "Teknik ofis iç revizyon süresi", value: "5 iş gunu", note: "Donen notlarin guncellenmesi" },
        { label: "Hedef saha başlangıç tamponu", value: "7 gun", note: "Onay sonrasi dağıtım için" },
      ],
      assumptions: [
        "Resmi kontrol notlari aynı gun teknik ofise aktarilacaktir.",
        "Ruhsat eki set ile saha uygulama seti ayri klasorlerde izlenecektir.",
        "Detay eksikleri ruhsat sonrasinda programa bilincli olarak yazilacaktir.",
      ],
      steps: [
        {
          title: "Resmi kontrol cevrimini tanimla",
          formula: "2 tur x ortalama 5 iş gunu = 10 iş gunu",
          result: "Yaklasik 10 iş gunu resmi geri donus etkisi olusur.",
          note: "Idare yogunluguna göre bu süre artabilir; bu nedenle tampon gerekir.",
        },
        {
          title: "Icler revizyon ve saha dagitimini ekle",
          formula: "10 + 5 + 7 = 22 iş gunu",
          result: "Saglikli saha başlangıcı için en az 22 iş gunu planlama bandi gerekir.",
          note: "Ruhsatı almak ile sahaya doğru setle cikmak aynı sey degildir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Takvim sifir tamponla kurgulanirsa ruhsat sonrasi en buyuk risk eski pafta ile imalata baslamaktir.",
          note: "Süre planina teknik ofis dagitimi de dahil edilmelidir.",
        },
      ],
      checks: [
        "Ruhsat takvimi sifir tamponla kurgulanmamalidir.",
        "Onay sonrasi uygulama seti dagitimi için ayri zaman birakilmalidir.",
        "Donen resmi notlarin pafta ve detay setine islendigi kayıt altinda olmalidir.",
        "Sahaya giden son set numara ve tarih bazinda izlenmelidir.",
      ],
      engineeringComment: "Ruhsatin gecikmesi kadar, ruhsat alindiktan sonra sahaya eksik veya eski setle cikmak da projeyi bozar.",
    },
    tools: PROJECT_FINAL_TOOLS,
    equipmentAndMaterials: PROJECT_FINAL_EQUIPMENT,
    mistakes: [
      { wrong: "Ruhsatı proje gelisiminin sonu kabul etmek.", correct: "Ruhsat sonrasinda uygulama detaylarini ayri programla tamamlamak." },
      { wrong: "Ruhsat eki set ile saha setini aynı klasorde karisik tutmak.", correct: "Resmi ve uygulama takimlarini fark takibiyle ayirmak." },
      { wrong: "Idareden donen notlari sadece mail kutusunda birakmak.", correct: "Tüm teknik notlari pafta revizyon sistemine islemek." },
      { wrong: "Yapı denetim ve saha kontrol zincirini birbirinden koparmak.", correct: "Denetim, ruhsat eki belge ve saha kabulunu aynı kayitta izlemek." },
      { wrong: "Ruhsat alinir alinmaz uygulama hazirligi olmadan imalata baslamak.", correct: "Sahaya cikacak guncel teknik seti hazirlamadan başlangıç yapmamak." },
      { wrong: "Teknik ofis dagitimini idari surecin disinda görmek.", correct: "Ruhsat surecinin parçası olarak planlamak." },
    ],
    designVsField: [
      "Ofiste ruhsat dosya kapanisi gibi gorunebilir; sahada ise hangi paftayla hangi sorumluluk altinda baslandigini gosteren ana kayittir.",
      "Iyi ruhsat yönetimi, sahadaki tartismalari daha başlamadan azaltir; kötü yönetim ise revizyon karmasasini şantiyenin gunluk dili yapar.",
      "Bu nedenle ruhsat süreci hukuki prosedur kadar teknik bir transfer süreci olarak da ele alinmalidir.",
    ],
    conclusion: [
      "Yapı ruhsatı, projenin resmilesmis ilk esigidir; ama sağlıklı saha başlangıcı ancak bu setin kontrollu sekilde uygulama setine cevrilmesiyle mumkun olur.",
      "En doğru strateji, ruhsat ekini disiplinli sekilde arsivleyip uygulama setini bunun uzerine bilincli ve kayitli bicimde insa etmektir.",
    ],
    sources: [...PROJECT_FINAL_SOURCES, SOURCE_LEDGER.imarKanunu, SOURCE_LEDGER.planliAlanlar, SOURCE_LEDGER.yapiDenetim],
    keywords: ["yapı ruhsatı", "ruhsat süreci", "imar mevzuati", "uygulama seti", "teknik ofis"],
    relatedPaths: ["proje-hazirlik/mimari-proje", "proje-hazirlik/statik-proje", "proje-hazirlik/elektrik-projesi", "proje-hazirlik/tesisat-projesi"],
  },
];
