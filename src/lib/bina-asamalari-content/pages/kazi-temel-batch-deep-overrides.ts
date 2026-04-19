import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const KAZI_BATCH_SOURCES = [...BRANCH_SOURCE_LEDGER["kazi-temel"]];

const YAPI_ISLERI_ISG_SOURCE: BinaGuideSource = {
  title: "Yapı Islerinde İş Sagligi ve Guvenligi Yonetmeligi",
  shortCode: "Yapı Islerinde ISG Yonetmeligi",
  type: "regulation",
  url: "https://www.mevzuat.gov.tr/",
  note: "Kaz, hafriyat, gecici destekleme ve şantiye guvenligi için resmi mevzuat eksenlerinden biridir.",
};

const EARTHWORK_TOOLS: BinaGuideTool[] = [
  { category: "Ölçüm", name: "Total station, GPS kot kontrolu ve kamyon sevk matrisi", purpose: "Hafriyati yalnız kazilan toprak miktariyla degil kot ve rota disipliniyle yonetmek." },
  { category: "Güvenlik", name: "Kaz cephesi kontrol listesi ve yagis/zemin takip formu", purpose: "Saha riskini yalnız makine uretimine birakmamak." },
  { category: "Planlama", name: "Kaz etap plani ve hafriyat lojistik akisi", purpose: "Kompakt bir sahada kaz, nakliye ve iksa ritmini birlikte kurmak." },
  { category: "Kayıt", name: "Gunluk kaz raporu ve komsu yapı gozlem formu", purpose: "Kaz ilerlemesini geoteknik ve operasyonel veriyle izlemek." },
];

const FOUNDATION_TOOLS: BinaGuideTool[] = [
  { category: "Kontrol", name: "Kot, tesviye ve taban kabul checklisti", purpose: "Grobetonu yalnız ince bir beton tabakasi degil temel tabani kabul adimi olarak yonetmek." },
  { category: "Ölçüm", name: "Lazer nivo, mastar ve kot referans cizelgesi", purpose: "Grobeton duzlugu ve temel akslarini sonraki isler için netlestirmek." },
  { category: "Koordinasyon", name: "Temel aks, radye ve su yalitimi geçiş plani", purpose: "Grobeton sonrasi gelecek donati ve yalitim islerini temiz zemine oturtmak." },
  { category: "Kayıt", name: "Taban fotografi ve grobeton kabul arşivi", purpose: "Kaz tabani ile temel imalati arasindaki gecisi belgeli hale getirmek." },
];

const EARTHWORK_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Kaz ekipmani", name: "Ekskavator, mini ekskavator, loader ve nakliye kamyonlari", purpose: "Kaziyi etapli ve kontrollu sekilde ilerletmek.", phase: "Kaz ve nakliye" },
  { group: "Ölçüm", name: "Total station, nivo ve kot referans kaziklari", purpose: "Kaz tabanini ve cevreyi surekli kontrol etmek.", phase: "Surekli" },
  { group: "Güvenlik", name: "Bariyer, ikaz, yagis koruma ve gecici destek ekipmani", purpose: "Kaz cephesini yalnız üretim degil emniyet acisindan da yonetmek.", phase: "Aktif kaz" },
  { group: "Dokumantasyon", name: "Gunluk saha formu ve komsu yapı gozlem kayitlari", purpose: "Kaz ilerlemesini teknik veriyle izlemek.", phase: "Surekli" },
];

const FOUNDATION_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Tesviye ekipmani, sikistirma araci ve taban temizleme seti", purpose: "Grobeton öncesi temel tabanini kabul seviyesine getirmek.", phase: "Taban hazirligi" },
  { group: "Beton", name: "Pompa, hortum, mastar ve yüzey duzeltme ekipmani", purpose: "Grobetonu temiz, duz ve aksa uygun sererek temel altligini olusturmak.", phase: "Dokum" },
  { group: "Ölçüm", name: "Lazer nivo, aks cizelgesi ve referans ipler", purpose: "Grobeton ustunde sonraki temel islerinin referansini kurmak.", phase: "Kabul" },
  { group: "Koruma", name: "Yüzey koruma ortusu ve saha temizlik ekipmani", purpose: "Grobetonun ustunu sonraki imalatlar için temiz tutmak.", phase: "Dokum sonrasi" },
];

export const kaziTemelBatchDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kazi-temel/hafriyat",
    kind: "topic",
    quote: "Hafriyat, topragi kaldirmak degil; zemini, komsu yapilari, suyu ve santiyenin lojistigini aynı anda kontrol ederek proje kotuna inmektir.",
    tip: "Hafriyati yalnız ekskavator verimi gibi okumak, kaz tabani kalitesini ve komsu etkisini programa kurban etmek demektir.",
    intro: [
      "Hafriyat santiyenin ilk buyuk saha operasyonudur. Ancak bu faz yalnız toprak cikarmak veya kamyon doldurmak anlamina gelmez. Hafriyat; proje kotuna kontrollu inmek, kaz cephesini emniyetli tutmak, komsu yapilari ve altyapi hatlarini korumak, yagis ve su etkisini yonetmek ve sonraki temel imalatina temiz bir taban birakmak anlamina gelir.",
      "Sahadaki en yaygin hata, hafriyati yalnız hacim ve gun hesabina indirgemektir. Oysa hiz baskisi altinda fazla kazilan taban, ezilen zemin, dengesiz kaz cephesi veya plansiz kamyon trafigi daha temel öncesi maliyetli sorunlar uretir. Komsu yol, istinat, mevcut bina veya altyapi varsa bu risk daha da artar.",
      "Bir insaat muhendisi için hafriyat, geoteknik veri ile saha operasyonunun tam kesistigi yerdir. Zemin etudundeki bilgi, iksa karari, pompaj gereksinimi, taban kötü ve makine lojistigi birlikte okunmadikca kaz yalnız ilerlemis görünür; teknik olarak olgunlasmis sayilmaz.",
      "Bu rehberde hafriyati; teorik temel, resmi güvenlik cercevesi, sayisal kot yorumu, ekipman, saha kaydi ve sık yapilan hatalarla birlikte uzun-form bir şantiye yazisi halinde ele aliyoruz.",
    ],
    theory: [
      "Hafriyat davranisinin cekirdeginde zemin ve su yer alir. Aynı kaz derinligi, sert ve kuru zeminde farkli; gevsek, tabakali veya su etkisindeki zeminde farkli riskler uretir. Bu nedenle hafriyat metrajdan once geoteknik yorumdur. Zemin sinifi, tabaka gecisleri, su seviyesi ve komsu etkisi bilinmeden yapılan hiz planlamasi eksik kalir.",
      "Kaz asamalari etapli okunmalidir. Üst kotlarda makine rahat calisabilirken, derinlik arttikca cephe dikligi, iksa gereksinimi, malzeme stok alanlari ve kamyon manevrasi yeniden degerlendirilir. Bu nedenle aynı saha için tek bir hafriyat refleksi yoktur; derinlesme arttikca operasyon mantigi da degisir.",
      "Hafriyat aynı zamanda geometri disiplinidir. Proje kotuna inmek yalnız belirli metreyi kazmak degil, taban duzlugu, aks acikligi, saha su akisi ve temel altligi için gerekli temiz kötü korumaktir. Fazla kazmak ne kadar sorunluysa, yetersiz kotta kalmak da sonraki temel işlerini bozar.",
      "Su ve yagis etkisi ayri bir basliktir. Kaz alanina giren yagmur suyu veya yeralt suyu tabani yumusatabilir, sikismis zemini bozabilir ve makine çalışma kalitesini dusurebilir. Bu nedenle hendek, pompaj, gecici tahliye ve yagis senaryosu hafriyat planinin bir parçası olmalidir.",
      "Son olarak hafriyat bir güvenlik fazidir. Kaz cephesi, kenar emniyeti, makine-calısan ayrimi ve komsu gozlemi yalnız iş guvenligi biriminin isi olarak gorulemez. Teknik ekip bu kontrolu gunluk uretimin parçası gibi ele almak zorundadir.",
    ],
    ruleTable: [
      {
        parameter: "Kaz guvenligi ve cephe kontrolu",
        limitOrRequirement: "Kaz cephesi, derinlik ve zemin kosullarina uygun güvenlik tedbiriyle yonetilmelidir",
        reference: "Yapı Islerinde ISG Yonetmeligi",
        note: "Üretim hizi emniyet kosullarinin yerine gecemez.",
      },
      {
        parameter: "Geoteknik ve iksa uyumu",
        limitOrRequirement: "Kaz derinligi ve zemin davranisi iksa veya etap karariyla uyumlu ilerlemelidir",
        reference: "Geoteknik tasarim plani",
        note: "Hafriyat, iksadan bagimsiz okunamaz.",
      },
      {
        parameter: "Proje kotuna inis",
        limitOrRequirement: "Kaz tabani proje kotunda, düzgün ve bozulmamis bir zemin kalitesiyle teslim edilmelidir",
        reference: "Temel uygulama plani",
        note: "Fazla kazim teknik olarak hiz degil hata uretir.",
      },
      {
        parameter: "Yagis ve su etkisi",
        limitOrRequirement: "Su tahliyesi, pompaj ve taban koruma senaryosu kaz ilerlerken aktif tutulmalidir",
        reference: "Saha drenaj plani",
        note: "Bozulan taban, temel kalitesini daha baslamadan zayiflatir.",
      },
      {
        parameter: "Komsu etki ve altyapi",
        limitOrRequirement: "Komsu yapilar, yol ve hatlar kaz ilerledikce gozlem altinda tutulmalidir",
        reference: "Gunluk saha gozlem plani",
        note: "Kaz yalnız parsel ici bir faaliyet degildir.",
      },
    ],
    designOrApplicationSteps: [
      "Zemin etudu, kot ihtiyaci ve iksa gereksinimini okuyarak hafriyati etapli planla.",
      "Kaz baslamadan once kot referanslarini, kamyon rotalarini ve stok alanlarini netlestir.",
      "Her etapta cephe guvenligi, su kontrolu ve makine manevrasini birlikte kontrol et.",
      "Proje kotuna yaklastikca kaba kaz refleksinden cik; taban duzlugu ve fazla kaz riskine odaklan.",
      "Kaz tabanini bozacak yagis veya su etkisinde gecici koruma ve pompaj tedbirlerini devreye al.",
      "Temel imalatina gecmeden once taban kötü, temizlik ve zemin kalitesini belgeli kabul ile kapat.",
    ],
    criticalChecks: [
      "Kaz cephesi derinlik ve zemin kosuluna göre guvenli mi?",
      "Kot kontrolu gunluk olarak ve yeterli sayida noktadan yapiliyor mu?",
      "Yagis veya su etkisi tabani yumusatmaya basladi mi?",
      "Makine ve kamyon trafigi saha guvenligi ile uyumlu mu?",
      "Komsu yapilar veya yol cevresinde yeni bir hareket ya da risk belirtisi var mi?",
      "Temel öncesi taban bozulmadan ve fazla kaz olmadan teslim edildi mi?",
    ],
    numericalExample: {
      title: "4,80 m kaz derinliginde kot kontrol yorumu",
      inputs: [
        { label: "Mevcut saha kötü", value: "+102,30", note: "Referans saha kötü" },
        { label: "Proje kaz taban kötü", value: "+97,50", note: "Temel alt kot hedefi" },
        { label: "Gereken kaz derinligi", value: "4,80 m", note: "Mevcut kot ile hedef kot farki" },
        { label: "Olculen fazla kaz", value: "12 cm", note: "Bir köşe noktada ortaya cikan sapma" },
      ],
      assumptions: [
        "Kaz tabani temel öncesi lokal duzeltme ile toparlanabilir durumdadir.",
        "Zemin tabani gevseklesmeden kontrol fark edilmiştir.",
        "Olcumler total station veya benzeri güvenilir sistemle alinmistir.",
      ],
      steps: [
        {
          title: "Derinlik ihtiyacini belirle",
          formula: "102,30 - 97,50 = 4,80 m",
          result: "Kazinin hedef derinligi yaklasik 4,80 m'dir.",
          note: "Bu sayi yalnız metraj bilgisi degil taban kontrol referansidir.",
        },
        {
          title: "Fazla kazi yorumla",
          result: "Bir köşe noktada 12 cm fazla kaz ortaya cikmasi, taban duzlugu ve temel altligi için duzeltme ihtiyaci dogurur.",
          note: "Fazla kaz, hiz kazanimi degil sonraki asamada telafi maliyetidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Proje kotuna yaklastikca makine hizi azaltılmali ve ölçü sıklığı artirilmalidir.",
          note: "Hafriyatin en pahali hatasi, son 20-30 cm'de olusan dikkatsizliktir.",
        },
      ],
      checks: [
        "Kot kontrolu kaba kaz ve son tesviye asamalarinda aynı siklikta yapilmamalidir.",
        "Fazla kaz fark edilir edilmez taban kalitesi gözden gecirilmelidir.",
        "Duzeltme karari temel altligi mantigiyla birlikte degerlendirilmelidir.",
        "Kaz tabani teslimi gunluk rapora islenmelidir.",
      ],
      engineeringComment: "Hafriyatta son santimetreler, ilk metrelerden daha onemlidir; temel kalitesi o bolgede belirlenir.",
    },
    tools: EARTHWORK_TOOLS,
    equipmentAndMaterials: EARTHWORK_EQUIPMENT,
    mistakes: [
      { wrong: "Hafriyati yalnız ekskavator verimi ve kamyon sayisi ile yonetmek.", correct: "Kot, cephe guvenligi ve zemin kalitesini aynı anda izlemek." },
      { wrong: "Proje kotuna yaklasirken aynı hizla devam etmek.", correct: "Son kotlara inerken ölçü sikligini arttirip kaziyi hassaslastirmak." },
      { wrong: "Yagis ve suyu gecici ama onemsiz risk sanmak.", correct: "Taban bozulmasini onleyecek aktif drenaj ve koruma kurmak." },
      { wrong: "Komsu yapı ve yol etkisini hafriyat disi bir konu gibi gormek.", correct: "Gozlem ve kaydi gunluk kaz operasyonunun parçası yapmak." },
      { wrong: "Fazla kaziyi sonradan duzeltiriz diye onemsizlestirmek.", correct: "Fazla kazinin temel altligi ve maliyet riski oldugunu kabul etmek." },
      { wrong: "Kaz tabanini temel ekibine kayitsiz devretmek.", correct: "Temel öncesi belgeli kot ve kalite kabulu yapmak." },
    ],
    designVsField: [
      "Projede hafriyat bir kot farki gibi görünür; sahada ise aynı fark zemin, su, güvenlik ve lojistik davranisi uretir.",
      "Iyi hafriyat daha az toprak cikarmaktan çok, doğru kotta ve bozulmamis taban birakmaktan anlasilir.",
      "Bu nedenle hafriyat, santiyenin ilk buyuk kalite ve disiplin sinavidir.",
    ],
    conclusion: [
      "Hafriyat doğru yonetildiginde sonraki temel imalatlari temiz, guvenli ve hızlı ilerler. Bu fazda yapilan dikkatsizlik ise temel öncesi telafi, gecikme ve risk olarak geri doner.",
      "Bir insaat muhendisi için en saglam bakis, hafriyati yalnız kazi degil; zemini ve santiyeyi bir sonraki faza hazirlayan teknik geçiş olarak gormektir.",
    ],
    sources: [...KAZI_BATCH_SOURCES, YAPI_ISLERI_ISG_SOURCE, SOURCE_LEDGER.afadHazard],
    keywords: ["hafriyat", "kaz tabani", "kaz guvenligi", "kot kontrolu", "ikza ve hafriyat"],
    relatedPaths: ["kazi-temel", "kazi-temel/zemin-etudu", "kazi-temel/iksa-sistemi", "kazi-temel/temel-turleri"],
  },
  {
    slugPath: "kazi-temel/temel-turleri/grobeton",
    kind: "topic",
    quote: "Grobeton, ince bir beton tabakasi degil; temel tabanini temiz, duz ve okunur hale getirerek asil taşıyıcı imalata referans veren geçiş katmanidir.",
    tip: "Grobetonu ucuz dolgu veya formalite gibi gormek, temel donatisi ve su yalitiminin oturacagi zemini zayiflatmaktir.",
    intro: [
      "Grobeton santiyede cogu zaman ince, yardimci ve ikincil bir tabaka gibi algilanir. Oysa temel imalatinin kalitesi acisindan bu tabaka son derece belirleyicidir. Kaz tabaninin üzerinde temiz ve duz bir ara yuz olusturarak temel donatisi, radye kalibi, aks isaretleri ve su yalitimi için saglikli bir çalışma zemini hazirlar.",
      "Sahadaki en yaygin hata, grobetonu yalnız zemin kirlenmesin diye atilan bir beton gibi gormektir. Bu bakis taban tesviyesi, kot kontrolu, beton duzlugu ve sonraki imalatlara birakacagi referans kalitesini zayiflatir. Oysa kötü serilmis veya bozulan grobeton, temelin ilk adiminda geometri sorunu uretir.",
      "Bir insaat muhendisi için grobeton; kaz tabani kabulunun somut hale geldigi, temel akslarinin okunur hale geldigi ve yalitim ile donati islerinin daha temiz ilerledigi teknik geçiş tabakasidir. Yani gorevi yalnız beton olmak degil; tabani temel imalatina hazir hale getirmektir.",
      "Bu yazida grobetonu; teorik amaci, standart ekseni, sayisal bir kot yorumu, saha ekipmanlari ve sık yapilan hatalarla birlikte tam bir saha rehberi gibi ele aliyoruz.",
    ],
    theory: [
      "Grobetonun teorik gorevi taşıyıcı dayanim uretmekten once bir ara yuz olusturmaktir. Kaz tabanindaki lokal gevşeklikleri, ince tesviye ihtiyacini ve temel islerine uygun çalışma zemini gereksinimini karsilar. Donatinin doğrudan toprağa veya bozulabilir tabana oturmasini onlemek, aks ve kalip islerini netlestirmek bu tabakanin ana katkisidir.",
      "Bu tabaka aynı zamanda temizlik ve korunabilirlik saglar. Kaz tabani ne kadar iyi teslim edilmis olsa da üzerinde calisildikca bozulabilir, kirlenebilir veya yagsa yumuşayabilir. Grobeton bu riski azaltarak sonraki imalatlar için kontrollu bir platform olusturur. Bu nedenle grobeton yokmus gibi davranmak, temel islerini zemin belirsizligine geri itmek anlamina gelir.",
      "Kot ve duzlugu burada çok onemlidir. Grobeton düzgün serilmediginde temel alt kotlari, donati sehpa duzeni ve hatta su yalitimi uygulamasi etkilenir. Yani ince bir tabaka olmasi, geometri etkisinin küçük oldugu anlamina gelmez. Tam tersine, temel imalatina referans olmasi nedeniyle milimetrik kalite gerektirir.",
      "Grobeton, su yalitimi ve koruma mantigi ile de baglantilidir. Yalitimin hangi duzlemde oturacagi, bohcalama veya perde donusu gibi kararlar temiz bir altlik gerektirir. Bozuk veya kirli grobeton, bu detaylarda gereksiz tamir ve yama ihtiyaci dogurur.",
      "Bu nedenle grobeton, maliyeti düşük ama etkisi yuksek bir tabakadir. Doğru yapildiginda temel imalatini sakinlestirir; yanlış yapildiginda ise en basit gorunen yerde dahi tekrar iş uretir.",
    ],
    ruleTable: [
      {
        parameter: "Taban kabulunden sonra serim",
        limitOrRequirement: "Grobeton, kabul edilmis ve bozulmamis temel tabani uzerine serilmelidir",
        reference: "Temel uygulama plani",
        note: "Bozuk taban ustune serilen grobeton sorunu gizler, cozmez.",
      },
      {
        parameter: "Duzluk ve kot disiplini",
        limitOrRequirement: "Grobeton kötü temel altligini ve aks referanslarini bozmayacak duzlukte olmalidir",
        reference: "Saha ölçüm ve kalite plani",
        note: "Bu tabaka sonraki tüm temel islerine referans verir.",
      },
      {
        parameter: "Beton sinifi ve uygulama",
        limitOrRequirement: "Grobeton dayanimi ve serim sekli saha amacina uygun, kontrollu uygulanmalidir",
        reference: "TS EN 206 + saha uygulama pratiği",
        note: "Yardimci tabaka olmasi disiplinsiz uygulama gerekcesi degildir.",
      },
      {
        parameter: "Yalitima altlik olma",
        limitOrRequirement: "Grobeton ustu temiz, hasarsiz ve sonraki su yalitimi için uygun olmalidir",
        reference: "Temel su yalitimi plani",
        note: "Yalitimin kalitesi buyuk olcude altligin temizligine baglidir.",
      },
      {
        parameter: "Aks ve temel gecisi",
        limitOrRequirement: "Aks isaretleri ve temel referanslari grobeton üzerinde okunur bicimde tasinabilmelidir",
        reference: "Aplikasyon plani",
        note: "Grobeton temel geometri hafizasini da tasir.",
      },
    ],
    designOrApplicationSteps: [
      "Kaz tabanini kot, duzlugu ve gevşek bolgeler acisindan kabul etmeden grobetona gecme.",
      "Grobeton serim alanini temizle ve aks referanslarini kaybetmeyecek sekilde planla.",
      "Dokum sirasinda kot ve duzlugu mastar ve nivo ile kontrol et; kabaca serip gecme.",
      "Grobeton ustunu sonraki donati ve yalitim isleri için temiz ve hasarsiz koru.",
      "Aks, temel siniri ve kritik referanslari grobeton üzerinde yeniden sabitle.",
      "Radye, temel donatisi ve yalitim ekiplerine grobetonu belgeli kabul ile devret.",
    ],
    criticalChecks: [
      "Kaz tabani grobeton öncesi gercekten kabul edildi mi?",
      "Grobeton kötü ve duzlugu temel imalatina uygun mu?",
      "Uzerindeki yüzey yalitim ve donati ekipleri için temiz mi?",
      "Aks referanslari ve temel sinirlari yeniden okunur hale getirildi mi?",
      "Lokal catlak, ayrisma veya bosluk olustu mu?",
      "Grobeton sonrasi alan, saha trafigi ile bozulmadan korunuyor mu?",
    ],
    numericalExample: {
      title: "15 cm grobetonda kot sapmasi yorumu",
      inputs: [
        { label: "Hedef grobeton kalinligi", value: "15 cm", note: "Ornek saha karari" },
        { label: "Olculen lokal sapma", value: "2,5 cm", note: "Bir köşe bolgede fazla kalinlik" },
        { label: "Hedef", value: "Temel altligi duzlugunu korumak", note: "Donati ve yalitim için" },
        { label: "Alan", value: "Radye temel altligi", note: "Genis taban senaryosu" },
      ],
      assumptions: [
        "Grobeton genel olarak kabul edilebilir, ancak lokal sapma belirgindir.",
        "Aks ve temel referanslari yeniden tasinacaktir.",
        "Sapma temel donatisi ve yalitimi etkileyecek buyukluge ulasabilir.",
      ],
      steps: [
        {
          title: "Sapma oranini yorumla",
          formula: "2,5 / 15 = %16,7",
          result: "Lokal sapma grobeton kalinliginin anlamli bir kismina denk gelmektedir.",
          note: "Bu fark yalnız beton tuketimi degil geometri sorunudur.",
        },
        {
          title: "Sonraki islere etkisini oku",
          result: "Bu sapma donati kötü, sehpa duzeni ve yalitim duzlugu üzerinde zincirleme etki yaratabilir.",
          note: "Grobetondaki hata temel imalatina doğrudan tasinir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Grobeton ince yardimci tabaka olsa da kot ve duzlugu temel imalatina uygun hassaslikta tutulmalidir.",
          note: "Kabaca serilip duzeltilir varsayimi teknik olarak zayif bir yaklasimdir.",
        },
      ],
      checks: [
        "Grobeton sapmasi yalnız kalinlik olarak degil geometri olarak degerlendirilmelidir.",
        "Lokal bozukluklar sonraki islerden once duzeltilmelidir.",
        "Aks ve referanslar sapmadan etkilenmeyecek netlikte yeniden kurulmalidir.",
        "Yalitima altlik olma kalitesi ayri kontrol edilmelidir.",
      ],
      engineeringComment: "Grobetonun en buyuk degeri dayanimi degil, temel imalatina biraktigi temiz ve duz referanstir.",
    },
    tools: FOUNDATION_TOOLS,
    equipmentAndMaterials: FOUNDATION_EQUIPMENT,
    mistakes: [
      { wrong: "Grobetonu formalite gibi gormek.", correct: "Temel tabani kabulunun teknik geçiş tabakasi olarak ele almak." },
      { wrong: "Kaz tabani bozukken grobetonla sorunu kapatmaya çalışmak.", correct: "Taban kalitesini once duzeltip sonra grobetona gecmek." },
      { wrong: "Kot ve duzlugu kabaca kabul etmek.", correct: "Nivo ve mastarla referans duzlem kurmak." },
      { wrong: "Grobeton ustunu saha trafigiyle bozdurmak.", correct: "Sonraki donati ve yalitim islerine kadar temiz korumak." },
      { wrong: "Aks referanslarini grobeton üzerinde yeniden sabitlememek.", correct: "Temel geometri hafizasini bu tabakada netlestirmek." },
      { wrong: "Yalitima altlik kalitesini ikincil gormek.", correct: "Grobeton ustunu su yalitimi acisindan da kabul etmek." },
    ],
    designVsField: [
      "Projede grobeton ince bir cizgi gibi görünür; sahada ise temel donatisi ve yalitimin oturacagi ilk temiz duzlemi kurar.",
      "Iyi grobeton sakin ve duz bir saha birakir; kötü grobeton ise temelin ilk adiminda yama ve telafi uretir.",
      "Bu nedenle grobeton, basit gorunen ama temel kalitesini doğrudan etkileyen bir ara tabakadir.",
    ],
    conclusion: [
      "Grobeton doğru yapildiginda temel imalatinin duzlugu, temizligi ve geometri disiplinini belirgin bicimde iyilestirir. Bu tabaka zayif yapildiginda ise temel isleri daha baslamadan tekrar iş ve belirsizlikle karsilasir.",
      "Bir insaat muhendisi için en doğru bakis, grobetonu ucuz bir beton degil; temel imalatina referans veren teknik altlik olarak gormektir.",
    ],
    sources: [...KAZI_BATCH_SOURCES, SOURCE_LEDGER.ts500, SOURCE_LEDGER.tsEn206],
    keywords: ["grobeton", "temel tabani", "radye altligi", "kot kontrolu", "temel hazirligi"],
    relatedPaths: ["kazi-temel", "kazi-temel/temel-turleri", "kazi-temel/temel-turleri/radye-temel", "kazi-temel/temel-betonlama"],
  },
];
