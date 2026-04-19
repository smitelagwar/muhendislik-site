import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const INCE_WALL_TOPIC_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_520_SOURCE: BinaGuideSource = {
  title: "TS EN 520 Alci Levhalar - Tarifler, Ozellikler ve Deney Yontemleri",
  shortCode: "TS EN 520",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alci levha siniflari, mahal uygunlugu ve temel urun tanimlari için referans standartlardan biridir.",
};

const TS_EN_13279_SOURCE: BinaGuideSource = {
  title: "TS EN 13279 Yapı Alicilari ve Alici Sivalar",
  shortCode: "TS EN 13279",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alci esasli baglayicilar ve siva sistemlerinde urun ailesini tanimlayan temel referanslardan biridir.",
};

const TS_EN_998_1_SOURCE: BinaGuideSource = {
  title: "TS EN 998-1 Kagir Harci - İç ve Dış Siva Harclari",
  shortCode: "TS EN 998-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "İç ve dış siva sistemlerinde kullanilan harclarin performans ve urun tanimi için temel referanslardan biridir.",
};

const WALL_TOPIC_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Mahal bazli tip kesit, overlay ve numune paftasi", purpose: "Siva, alcipan ve doğrama birlesimlerini kapatma öncesi netlestirmek." },
  { category: "Ölçüm", name: "Lazer nivo, mastar, nem olcer ve yan isik kontrol seti", purpose: "Yüzey duzlugu, kot ve kuruma durumunu sayisal hale getirmek." },
  { category: "Koordinasyon", name: "MEP servis matrisi ve bakım kapagi listesi", purpose: "Kapanan sistemlerin sonradan kesilmesini veya delinmesini onlemek." },
  { category: "Kalite", name: "Numune alan arşivi ve finish kabul cizelgesi", purpose: "Bitis katmanlari için mahal bazli kabul mantigi kurmak." },
];

const WALL_TOPIC_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Yüzey temizlik ekipmanlari, astarlar ve aderans kopruleri", purpose: "Alt yuzeyi yeni sisteme uygun hale getirmek.", phase: "Hazirlik" },
  { group: "Uygulama", name: "Metal karkas, levha, siva harci, file ve yardimci profiller", purpose: "Duvar veya tavan sisteminin asil taşıyıcı ve bitis katmanlarini kurmak.", phase: "Montaj" },
  { group: "Kontrol", name: "Mastar, şakul, nem olcer ve isik kontrol ekipmanlari", purpose: "Bitis kalitesini olcerek kabul etmek.", phase: "Ara ve son kontrol" },
  { group: "Koruma", name: "Köşe koruma, zemin kapama ve teslim koruma malzemeleri", purpose: "Bitmis yuzeyi sonraki ekiplerin hasarindan korumak.", phase: "Teslim öncesi" },
];

export const inceIslerWallTopicDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/alcipan",
    kind: "topic",
    quote: "Alcipan sistemlerinin gercek kalitesi levhada degil; karkas, servis koordinasyonu ve kapanmadan once verilen kararlarin dogrulugunda saklidir.",
    tip: "Alcipani hafif iş diye gecmek, en pahali tekrar isleri bakım kapagi, kapı takviyesi, buat yeri ve derz catlagi olarak geri getirir.",
    intro: [
      "Alcipan ve kuru yapı sistemleri, modern santiyelerde bolme duvar, asma tavan, shaft kapamasi, perde gizleme ve servis koordinasyonu acisindan merkezi bir rol oynar. Bu sistemler hızlı ve temiz uygulama vaat eder; ancak bu vaadin sahada gercege donusmesi, levhadan once karkas ve servis kararlarinin doğru verilmesine baglidir.",
      "Sahada alcipanla ilgili sikayetlerin buyuk kismi levhanin kendisinden degil; kapanmadan once unutulan detaylardan kaynaklanir. Kapı kasasi takviyesi yetersizse duvar calisir, bakım kapagi unutulduysa tavan kesilir, islak hacimde yanlış levha secildiyse kabarma ve deformasyon baslar. Yani alcipanin riski gorunen yuzeyde degil, gorunmeden once saklanan kararlarindadir.",
      "Bir insaat muhendisi için alcipan yalnizca dekoratif bitis imalati degildir. Akustik, yangin, servis erisimi, ekipman askisi, tolerans ve mahal netleri bir arada yonetilir. Bu nedenle iyi alcipan uygulamasi, mimari, elektrik, mekanik ve mobilya ekiplerinin kararlarini tek eksende toplar.",
      "Bu yazida alcipan sistemlerini; teorik temel, standartlar, saha kabul mantigi, sayisal bir koordinasyon ornegi, yazilim-araç listesi ve sık yapilan hatalar uzerinden daha derin ve kullanışlı bir rehbere donusturuyoruz.",
    ],
    theory: [
      "Kuru yapı sistemlerinde performans levha kalinligi kadar metal karkas duzenine baglidir. Profil araligi, aski noktasi, vida ritmi ve takviye detaylari sistemin hem sehim hem de catlak davranisini belirler. Karkas zayifsa, ustteki en iyi levha ve boya bile uzun sure duz kalamaz. Bu nedenle alcipanin teorik temeli, kapatma mantigindan once taşıyıcı alt sistemdir.",
      "Asma tavan ve bolme duvarlarda servis yogunlugu belirleyici bir parametredir. Menfez, lineer aydinlatma, sprinkler, yangin algilama, kamera, hoparlor ve bakım kapagi gibi elemanlar aynı duzlemde toplandiginda aski ritmi ve kesit takviyesi yeniden okunmalidir. Kapanmadan once cozulmeyen her servis, sistemin sonradan kesilmesine neden olur.",
      "Mahal kullanimi da kuru yapı secimini etkiler. Ofis bolme duvari ile islak hacim tavani, yangin kacis koridoru ile teknik hacim shaft kapamasi aynı levha ailesi veya aynı katman mantigi ile ele alinmaz. TS EN 520 levha ailelerini, TS EN 14195 ise karkas bilesenlerini tanimlarken, Yangin Yonetmeligi fonksiyon bazli performans ihtiyacini sahaya tasir.",
      "Bu nedenle alcipan, yalnizca görünür bir kaplama degil; kapanan hacimlerde servis erisimi, performans hedefi ve deformasyon kontrolunu birlikte yoneten sistematik bir ince iş paketidir.",
    ],
    ruleTable: [
      {
        parameter: "Levha tipi ve mahal uygunlugu",
        limitOrRequirement: "Nemli, standart veya yangin beklentili hacimlerde uygun levha sinifi secilmelidir",
        reference: "TS EN 520 + Yangin Yonetmeligi",
        note: "Her mahal için aynı levha secimi teknik olarak doğru degildir.",
      },
      {
        parameter: "Metal karkas ve bağlantı bilesenleri",
        limitOrRequirement: "Profil, aski ve yardimci bilesenler sistem detayina uygun secilmeli ve kurulmalidir",
        reference: "TS EN 14195",
        note: "Levha kalitesi, zayif karkasi telafi etmez.",
      },
      {
        parameter: "Servis koordinasyonu",
        limitOrRequirement: "Bakım kapagi, armaturr, menfez, buat ve ekipman takviyeleri kapatma öncesi netlestirilmelidir",
        reference: "MEP overlay + uygulama checklisti",
        note: "Sonradan kesilen alcipan, en çok burada kalite kaybeder.",
      },
      {
        parameter: "Derz ve yüzey hazirligi",
        limitOrRequirement: "Derz bandi, macun ve zemin hazirligi katmanli sekilde ve numune panel mantigiyla uygulanmalidir",
        reference: "Uretici sistem detaylari",
        note: "Tek katta hızlı bitirilen derzler son katta iz verir.",
      },
      {
        parameter: "Takviye gereken noktalar",
        limitOrRequirement: "Kapı kasasi, agir ekipman, rezervuar ve servis kutulari için ilave karkas veya destek elemanlari kapanmadan once yerlestirilmelidir",
        reference: "Mahal detay paftalari",
        note: "Kritik yukler sonradan levha uzerinden tasinmaya zorlanmamalidir.",
      },
    ],
    designOrApplicationSteps: [
      "Bolme duvar, asma tavan ve shaft alanlarini mimari ve MEP overlay uzerinden cakismazlik acisindan bastan oku.",
      "Mahal fonksiyonuna göre levha tipi, katman sayisi, dolgu ve karkas ritmini standardize et.",
      "Kapı, cihaz, buat, rezervuar ve bakım kapagi gibi takviye isteyen tüm noktalar için kapatma öncesi numune detay olustur.",
      "Karkas montajinda şakul, aks, kot ve servis acikliklarini levha kapanmadan once ayri ayri onayla.",
      "Derz, macun ve son kat boya öncesi yan isik ve yüzey kontrolunu bir kalite kapisi haline getir.",
      "Teslim öncesi bakım erisimi, kapı fonksiyonu, ses ve görünür yüzey kalitesini birlikte degerlendir.",
    ],
    criticalChecks: [
      "Levha tipi mahale uygun secilmis mi?",
      "Profil ve aski ritmi proje veya sistem detayiyla uyumlu mu?",
      "Bakım kapagi unutulan, sonradan kesilecek servis bolgesi var mi?",
      "Kapı, rezervuar veya agir ekipman cevresinde yeterli takviye kuruldu mu?",
      "Derz cizgileri ve macun kalitesi yan isikta iz veriyor mu?",
      "Bolme duvar ve asma tavanlarda servisler levhayi zayiflatacak sekilde cakisiyor mu?",
    ],
    numericalExample: {
      title: "6,00 m ofis bolme duvarinda kapı ve ekipman takviyesi yorumu",
      inputs: [
        { label: "Duvar uzunlugu", value: "6,00 m", note: "Acik ofis bolmesi" },
        { label: "Duvar yuksekligi", value: "3,00 m", note: "Net kat seviyesi" },
        { label: "Kapı boslugu", value: "90 cm", note: "Tek kanat kapı" },
        { label: "Ek yuk", value: "25 kg TV/ekran askisi", note: "Duvar ustunde ekipman talebi" },
      ],
      assumptions: [
        "Kapı bolgesinde jamb takviyesi uygulanacaktir.",
        "TV veya ekipman askisi için kapanmadan once ilave alt destek kurulacaktir.",
        "Kesin profil ritmi sistem detayina göre teyit edilecektir.",
      ],
      steps: [
        {
          title: "Kritik bolgeleri ayristir",
          result: "Duvar tek bir duzlem gibi gorunse de kapı acikligi ve ekipman askisi farkli rijitlik ihtiyaclari uretir.",
          note: "Standart karkas ritmi bu iki bölge için tek basina yeterli olmayabilir.",
        },
        {
          title: "Koordinasyon etkisini oku",
          result: "Kapı, buat, priz, data cikisi ve TV askisi aynı panelde toplaniyorsa kapanmadan once detay cozulmelidir.",
          note: "Levha kapandiktan sonra yapilan her mudahale derz ve sehim riskini artirir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Alcipan sistemlerde asil kalite, kritik bolgeleri bitis öncesi gormek ve takviye kararini o anda vermektir.",
          note: "Hafif sistemler, ancak doğru detayla agir hizmet verebilir.",
        },
      ],
      checks: [
        "Kapı ve ekipman alanlari standart panel gibi ele alinmamalidir.",
        "Servisler kapatma öncesi tek paftada kontrol edilmelidir.",
        "Takviye kararlarinin foto-kaydi tutulmalidir.",
        "Teslim öncesi yalnız boya gorunumu degil fonksiyon da test edilmelidir.",
      ],
      engineeringComment: "Alcipan islerinde kalite, levha kapandigi gun degil; kapanmadan once yapilan koordinasyon toplantisinda belirlenir.",
    },
    tools: WALL_TOPIC_TOOLS,
    equipmentAndMaterials: WALL_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Tüm mahallerde aynı levha tipini kullanmak.", correct: "Nem, yangin ve kullanım senaryosuna göre levha secimini ayirmak." },
      { wrong: "Bakım kapagi ve servisleri kapatma sonrasina birakmak.", correct: "Kapanmadan once tüm servisleri overlay ile kilitlemek." },
      { wrong: "Kapı ve ekipman takviyesini standart profil ritmine birakmak.", correct: "Kritik bolgeleri ilave karkas veya destekle cozumlemek." },
      { wrong: "Derz kalitesini boya ekibinin duzeltecegini dusunmek.", correct: "Macun ve yan isik kontrolunu alcipan asamasinda bitirmek." },
      { wrong: "Asma tavani yalnız estetige göre okumak.", correct: "Aski ritmi, menfez, armaturr ve bakım erisimini birlikte degerlendirmek." },
      { wrong: "Kapanan sistemlerde foto ve checklist tutmamak.", correct: "Gorunmeyecek detaylari teslim dosyasina kayda almak." },
    ],
    designVsField: [
      "Projede alcipan cizgileri hafif görünür; sahada ise en yoğun koordinasyon bu cizgilerin icinde yasar.",
      "Kuru yapı sistemlerinin hizi ancak önceden cozulmus detayla avantajdir; aksi halde hiz, tekrari da hizlandirir.",
      "Iyi alcipan uygulamasi, estetikten once servis erisimi ve geometri disiplinidir.",
    ],
    conclusion: [
      "Alcipan sistemleri doğru karkas, doğru levha secimi ve kapanmadan once cozulmus servis detaylari ile uygulandiginda hem hızlı hem de uzun omurlu sonuc verir. Bu zincir koptugunda en buyuk kayip, sonradan acilan delikler ve tekrar eden yüzey tamirleri olarak geri doner.",
      "Bir insaat muhendisi için en doğru bakis, alcipani hafif iş degil; koordinasyon yoğun, performans hedefli bir sistem uygulamasi olarak yonetmektir.",
    ],
    sources: [...INCE_WALL_TOPIC_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_520_SOURCE],
    keywords: ["alcipan", "kuru yapı", "TS EN 520", "asma tavan", "bolme duvar koordinasyonu"],
    relatedPaths: ["ince-isler", "ince-isler/alcipan/bolme-duvar", "ince-isler/alcipan/asma-tavan", "ince-isler/kapi-pencere"],
  },
  {
    slugPath: "ince-isler/siva",
    kind: "topic",
    quote: "Siva, duvari kapatan bir tabaka degil; tüm ince isin görünür geometri ve yüzey kalitesini kuran ana referans duzlemidir.",
    tip: "Sivayi dekoratif on hazirlik gibi gormek, boya, duvar kagidi ve seramik altinda buyuyecek bir kusur biriktirmektir.",
    intro: [
      "Siva sistemleri, duvar ve tavan yuzeylerini yalnız duz hale getirmez; aynı zamanda aderans, catlak kontrolu, nem davranisi ve sonraki bitis katmanlarinin kalitesini belirler. Boya, duvar kagidi veya fayans ne kadar iyi secilirse secilsin, altindaki siva duzlemi zayifsa sonuclar gecici olur.",
      "Sahada siva ile ilgili en yaygin hata, harc surmeyi bir ustalik aliskanligina indirgemektir. Oysa iç ve dış siva sistemleri alt yüzey tipi, emicilik, kalinlik, file kullanimi, kurumaya verilen sure ve son kat beklentisi ile birlikte okunur. Bu parametrelerden biri ihmal edildiginde sorun boya katinda veya ilk yagmurda ortaya cikabilir.",
      "Bir insaat muhendisi için siva yalnız finish kalemi degildir. Programlama, alt yüzey hazirligi, tesisat tamirleri, pencere köşe detaylari ve catlak kontrolu burada birlesir. En basit gorunen duvar bile, siva öncesi yanlış teslim edilirse sonraki tüm ekipleri zorlar.",
      "Bu yazida siva basligini; teorik temel, standartlar, sayisal duzlem ornegi, yazilim-ve-araç listesi ve saha hatalarini bir araya getirerek uzun-form, akici ve uygulamada kullanilabilir bir blog yazisina donusturuyoruz.",
    ],
    theory: [
      "Siva, alt yüzey ile üst bitis katmani arasindaki bag tabakasidir. Betonarme, tugla, gazbeton veya briket gibi farkli yuzeylerin emiciligi ve hareket karakteri farkli oldugu için aynı siva davranisini beklemek teknik olarak doğru degildir. Bu nedenle siva sistemlerinde alt yüzey tanisi, uygulamanin ilk muhendislik adimidir.",
      "Kalinlik ve katman mantigi ikinci kritik basliktir. Lokal ceplerin tek katta kapatilmasi, kurumayi hizlandirmak için asiri su cekilen karisimlar veya file gerektiren bolgelerin atlanmasi; siva duzlemi daha taze iken kusur tohumunu atar. Yüzey sonradan duz gorunse bile bu kusurlar catlak, ayrilma veya boya izi olarak geri donebilir.",
      "Kritik birlesim hatlari her zaman ozel dikkat ister. Kolon-duvar siniri, pencere ustu ve koseleri, chase tamirleri, tavan-duvar birlesimleri ve islak hacim gecisleri siva sisteminin sinandigi noktalardir. Tek tip uygulama refleksi burada yetersiz kalir; detay odakli yaklasim gerekir.",
      "TS EN 13914 ve TS EN 998-1 gibi standartlar siva tasarımı ile urun davranisini cerceveler; fakat sahadaki asil kalite, mastar duzlemi ile kuruma disiplininin birlikte yonetildigi uygulama kulturuyle olusur.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey hazirligi",
        limitOrRequirement: "Yüzey toz, gevsek parca, kalip yagi ve aderansi azaltan tabakalardan arindirilmali; emicilik farklari kontrol edilmelidir",
        reference: "TS EN 13914",
        note: "Kirli veya parlak yuzeyde iyi siva davranisi beklenmez.",
      },
      {
        parameter: "Harc secimi ve katman kalinligi",
        limitOrRequirement: "İç veya dış mekan ihtiyacina uygun siva harci secilmeli, asiri kalin tek kat uygulamadan kacinilmalidir",
        reference: "TS EN 998-1 + TS EN 13279",
        note: "Kalinlik telafisi kontrolsuz yapildiginda ayrilma ve catlak riski artar.",
      },
      {
        parameter: "Kritik birlesimler ve file",
        limitOrRequirement: "Malzeme degisim hatlari, pencere koseleri ve chase tamirlerinde uygun file veya yardimci detaylar uygulanmalidir",
        reference: "TS EN 13914 + saha detay paftasi",
        note: "Catlak en çok bu zayif cizgilerde dogar.",
      },
      {
        parameter: "Kuruma ve koruma",
        limitOrRequirement: "Yeni siva ani gunes, rüzgar, don ve islak yüzey riskinden korunarak kurutulmalidir",
        reference: "Şantiye kalite plani",
        note: "Yeterli kur almayan siva son kat altinda bozulur.",
      },
      {
        parameter: "Bitis öncesi kabul",
        limitOrRequirement: "Boya veya kaplama öncesi duzlem, nem, yama izi ve yan isik kontrolu yapilmalidir",
        reference: "Finish kabul cizelgesi",
        note: "Siva kalitesi en son boyada degil, siva tesliminde onaylanir.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yuzeyi malzeme tipine göre siniflandir; betonarme, tugla ve gazbeton için aynı hazirlik refleksini kullanma.",
      "Deneme paneli ile harc davranisini, aderansi ve hedef duzlem kalinligini uygulama öncesi teyit et.",
      "Mastar ve referans kotlarini duvar bazinda sabitle; duzlemi serbest el ile olusturmaya çalışma.",
      "Kolon-duvar siniri, pencere koseleri, chase tamirleri ve zayif gecisleri file veya uygun detay ile bastan cozumle.",
      "Kuruma suresini iş programi baskisina kurban etmeden, son kat ekipleri için sayisal kabul olcumu olustur.",
      "Boya veya kaplama öncesi yan isikta kontrol yapip lokal yama mantigi yerine butun yüzey mantigiyla teslim ver.",
    ],
    criticalChecks: [
      "Alt yüzey toz, yag ve gevsek parcadan tamamen arindirildi mi?",
      "Kalinlik ihtiyaci tek kat uygulamayi zorlayacak seviyede mi?",
      "Malzeme degisim hatlarinda file veya uygun birlesim detayi kullanildi mi?",
      "Kuruma tamamlanmadan boya veya kaplama ekibi alana girdi mi?",
      "Yan isik altinda dalga, yama izi veya mastar kacagi goruluyor mu?",
      "Islak hacim, pencere cevresi ve chase tamirleri ayri kontrol edildi mi?",
    ],
    numericalExample: {
      title: "5,20 m duvarda 18 mm yüzey sapmasi için siva stratejisi",
      inputs: [
        { label: "Duvar boyu", value: "5,20 m", note: "Salon ana duvari" },
        { label: "Olculen maksimum sapma", value: "18 mm", note: "En yuksek ve en düşük nokta arasi" },
        { label: "Hedef ortalama siva kalinligi", value: "15 mm", note: "Boya alti iç mekan ornegi" },
        { label: "Amac", value: "Duzlem ve catlak kontrolunu birlikte saglamak", note: "Tekrar isciligi azaltmak" },
      ],
      assumptions: [
        "Alt yüzey saglam ve aderans acisindan uygun hale getirilmistir.",
        "Elektrik chase tamirleri siva öncesi tamamlanmistir.",
        "Son kat boya oldugu için görünür dalga toleransi dusuktur.",
      ],
      steps: [
        {
          title: "Sapma ile hedef kalinligi karsilastir",
          formula: "18 mm > 15 mm",
          result: "Olculen sapma, hedef ortalama kalinligi asiyor; tek hamlede düzgün ve guvenli bitis zorlasir.",
          note: "Lokal cepler için katmanli yaklasim veya on tesviye dusunulmelidir.",
        },
        {
          title: "Mastar stratejisini kur",
          result: "Duzlem, once referans mastarlarla kurulup aradaki bosluklar kontrollu doldurulmalidir.",
          note: "Serbest el uygulama boya altinda dalga ve yamayi buyutur.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Siva kalitesi kalin harc yigmaktan degil; sapmayi okuyup uygun katman stratejisini kurmaktan gelir.",
          note: "Siva, bozuk duvari gizleme degil, duzeltmeyi muhendislikle yapma isidir.",
        },
      ],
      checks: [
        "Kalinlik gereksinimi sayisal olarak okunmadan uygulama baslatilmamalidir.",
        "Tek katla cozulmeyecek lokal cepler ayri planda ele alinmalidir.",
        "Mastar ve yan isik kontrolleri siva sirasinda yapilmalidir.",
        "Kuruma ve boya takvimi birbirine zorla bindirilmemelidir.",
      ],
      engineeringComment: "Siva kalitesini boyaci degil, mastar cekerken karar veren ekip belirler.",
    },
    tools: WALL_TOPIC_TOOLS,
    equipmentAndMaterials: WALL_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Betonarme, tugla ve gazbetona aynı hazirlikla siva yapmak.", correct: "Alt yüzey tipine göre ayri aderans ve hazirlik stratejisi kurmak." },
      { wrong: "Tüm sapmayi tek katta kalin harcla kapatmaya çalışmak.", correct: "Sayisal sapmaya göre katmanli veya on tesviyeli yaklasim secmek." },
      { wrong: "Kolon-duvar ve pencere koselerinde file kullanmamak.", correct: "Kritik gecisleri catlak riski olarak ozel cozumlemek." },
      { wrong: "Kur almadan sonraki ekiplere alani acmak.", correct: "Siva kuruma ve koruma suresini kalite kapisi haline getirmek." },
      { wrong: "Boya alti kalitesini son katta duzeltmeye çalışmak.", correct: "Yan isik ve mastar kontrolunu siva asamasinda bitirmek." },
      { wrong: "Lokal yama izlerini teslim öncesi gormezden gelmek.", correct: "Bitis kabulunde butun yüzey mantigiyla kontrol yapmak." },
    ],
    designVsField: [
      "Projede siva tek satir metraj gibi görünür; sahada ise tüm görünür kaliteyi tasiyan ana referans tabakadir.",
      "Iyi siva, boyayi guzellestirir; kötü siva ise en kaliteli boyayi bile kusur gosteren bir filme cevirir.",
      "Bu nedenle siva isleri, ustalik kadar programlama ve kalite muhendisligi gerektirir.",
    ],
    conclusion: [
      "Siva sistemleri doğru alt yüzey tanisi, doğru katman stratejisi ve sabirli kuruma disiplini ile uygulandiginda sonraki tüm ince islerin kalitesini yukselten sessiz bir omurga kurar. Bu zincir bozuldugunda sorun, genellikle en görünür yuzeylerde ortaya cikar.",
      "Bir insaat muhendisi için siva, dekoratif degil teknik bir iş kalemidir; duzlem, catlak kontrolu ve bitis kalitesinin asil sahnesi burada kurulur.",
    ],
    sources: [...INCE_WALL_TOPIC_SOURCES, TS_EN_13279_SOURCE, TS_EN_998_1_SOURCE],
    keywords: ["siva", "TS EN 13914", "TS EN 998-1", "yüzey duzlugu", "catlak kontrolu"],
    relatedPaths: ["ince-isler", "ince-isler/siva/dis-siva", "ince-isler/siva/alci-siva", "ince-isler/duvar-kaplamalari/boya"],
  },
  {
    slugPath: "ince-isler/siva/dis-siva",
    kind: "topic",
    quote: "Dış siva, cephenin sadece gorunen derisi degil; su, sıcaklık ve hareket etkilerini yoneten ilk savunma katmanidir.",
    tip: "Dış sivayi yalnız renk ve doku altligi gibi gormek, yagmur, gunes, rüzgar ve catlak etkilerini daha ilk kis sezonunda cepheye davet etmektir.",
    intro: [
      "Dış siva, binanin dış kabugu uzerindeki en kritik ara katmanlardan biridir. Cepheyi görünür olarak duzgunlestirir; fakat asil gorevi, suyun yuzeyde davranisini yonetmek, boya veya kaplama için dengeli bir zemin kurmak ve betonarme ile dolgu duvar arasindaki hareket farklarini kontrollu bir sekilde tasimaktir.",
      "Sahada dış siva sorunlari cogu zaman ilk yagmur, ilk yaz sicagi veya ilk kis-don dongusu ile görünür hale gelir. Pencere ustlerinde damlalik yoksa lekelenme olur, file atlanan kolon-duvar sinirlarinda catlak cikar, denizlik altlari ve parapet cevresinde su yolu yanlış cozulduysa siva kabarir veya kusar.",
      "Bir insaat muhendisi için dış siva, yalnız cephe estetigi meselesi degildir. TS 825 ve bina kabugu performansi ile birlikte okunmali; doğrama detaylari, mantolama veya isi yalitimi sistemi, iskele lojistigi ve hava kosullariyla beraber ele alinmalidir.",
      "Bu yazida dış sivayi; cephe fizigi, standart gereksinimleri, sayisal bir kalinlik-karar ornegi, saha ekipmanlari ve sık yapilan hatalarla birlikte daha derin bir blog yazisi olarak gelistiriyoruz.",
    ],
    theory: [
      "Dış siva, iç siva ile aynı mantikla okunamaz. Cephenin gunes gormesi, rüzgar almasi, yagis yuku, don riskleri ve yuzeyin sıcaklık farklari dış sivayi daha zorlayici hale getirir. Bu nedenle harc secimi, katman kalinligi, file detayi ve uygulama zamani daha kritik hale gelir. İç mekanda tolere edilen bir zayiflik, dış cephede hizla görünür kusura donusebilir.",
      "Dış cephede su davranisi, yalnız dik yuzeyden asagi akan yagmur ile sinirli degildir. Pencere ustu, denizlik, sokel, parapet, balkon kosesi, damlalik ve yatay-simli detaylar suyun ne kadar uzaklastirilacagini belirler. Yanlış detaylanan bir cephede en iyi siva harci bile tek basina basarili olamaz. Yani dış sivada geometri de harc kadar onemlidir.",
      "Malzeme gecisleri yine kritik bir rol oynar. Betonarme kolon, kiris, perde ve dolgu duvarin farkli davranislari dış cephede catlak olarak daha kolay okunur. Bu nedenle kolon-duvar sinirlarinda, pencere köşe diyagonallerinde ve tamir alanlarinda file veya uygun takviye detaylari vazgecilmezdir.",
      "Ayrıca dış siva, boya veya dekoratif kaplama ile birlikte bir cephe sistemi gibi dusunulmelidir. Kuruma suresi, astar uyumu ve son kat zamanlamasi birbiriyle baglidir. Saha programi sikistirildiginda, kusur bir yuzeye degil butun cephe imajina yayilir.",
    ],
    ruleTable: [
      {
        parameter: "Harc sistemi ve çevre kosullari",
        limitOrRequirement: "Dış cepheye uygun siva harci secilmeli; uygulama asiri sıcak, ruzgarli, yagisli veya don riski olan kosullarda korunarak yapilmalidir",
        reference: "TS EN 998-1 + TS EN 13914",
        note: "Dış cephe siva hatasi hava kosullariyla katlanarak buyur.",
      },
      {
        parameter: "Cephe dugumleri ve su yonu",
        limitOrRequirement: "Denizlik, damlalik, parapet, sokel ve pencere ustleri suyu cepheden uzaklastiracak detayla tamamlanmalidir",
        reference: "Cephe detay paftalari + TS 825 mantigi",
        note: "Su yolu cozulmeden dış siva tek basina yeterli olmaz.",
      },
      {
        parameter: "Malzeme gecisleri ve file",
        limitOrRequirement: "Kolon-duvar siniri, pencere köşe diyagonali ve tamir alanlarinda takviye detaylari eksiksiz uygulanmalidir",
        reference: "TS EN 13914 + saha detay disiplini",
        note: "Cephede catlak ilk bu zayif cizgilerde gorulur.",
      },
      {
        parameter: "Kabuk performansi ve son kat uyumu",
        limitOrRequirement: "Dış siva sistemi isi yalitimi, astar ve son kat boya/kaplama ile uyumlu kurgulanmalidir",
        reference: "TS 825 + BEP Yonetmeligi",
        note: "Cephe kalitesi katmanlar arasi uyumla saglanir.",
      },
      {
        parameter: "Iskele ve uygulama ritmi",
        limitOrRequirement: "Cephe panelleri soğuk derz, ton farki ve yama izi uretmeyecek sekilde planli sekansla uygulanmalidir",
        reference: "Cephe uygulama plani",
        note: "Dış siva, parcali ve kopuk uygulamayi kolay affetmez.",
      },
    ],
    designOrApplicationSteps: [
      "Cepheyi panel bazinda, maruziyet yonu ve pencere detaylariyla birlikte analiz et; her yuzeyi aynı kosulda varsayma.",
      "Dış cepheye uygun harc sistemi, file detayi ve son kat uyumunu numune panelde once test et.",
      "Denizlik, damlalik, parapet ve sokel gibi su davranisini belirleyen dugumleri saha uydurmasina birakmadan paftala.",
      "Kolon-duvar sinirlari, pencere koseleri ve tamir alanlarini file ve takviye mantigiyla önceden isaretle.",
      "Uygulamayi iskele akslari, hava kosullari ve cephe panel sekansi ile birlikte planla; parca parca ve kopuk bitislerden kacin.",
      "Son kat boya veya kaplama öncesi cepheyi hem görsel hem su davranisi acisindan butunsel bir turla tekrar kontrol et.",
    ],
    criticalChecks: [
      "Cephede uygulama gunundeki hava kosullari siva için uygun mu?",
      "Pencere ustleri, denizlikler ve parapet detaylari suyu doğru yonlendiriyor mu?",
      "Kolon-duvar siniri ve pencere koselerinde file veya takviye eksigi var mi?",
      "Sokel ve suya çok maruz bolgelerde harc ve son kat secimi uygun mu?",
      "Panel gecislerinde ton, doku veya soğuk derz izi olusuyor mu?",
      "Son kat öncesi cephe yan isik ve yagmur suyu mantigiyla kontrol edildi mi?",
    ],
    numericalExample: {
      title: "8,00 m yukseklikte cephede 30 mm lokal sapma için katman karari",
      inputs: [
        { label: "Cephe yuksekligi", value: "8,00 m", note: "Iki katli yan cephe" },
        { label: "Lokal maksimum sapma", value: "30 mm", note: "Kolon-duvar gecisinde olculen cep" },
        { label: "Tek kat hedef kalinlik", value: "15 mm", note: "Dış siva için kontrollu uygulama bandi" },
        { label: "Amac", value: "Catlak ve sarkma riski yaratmadan duzlem kurmak", note: "Cephe omru için kritik" },
      ],
      assumptions: [
        "Alt yüzey temiz ve aderans için uygun hale getirilmistir.",
        "Takviye gereken gecislerde file uygulanacaktir.",
        "Uygulama hava kosullari koruma ile yonetilecektir.",
      ],
      steps: [
        {
          title: "Sapmayi tek kat hedefi ile karsilastir",
          formula: "30 mm > 15 mm",
          result: "Lokal sapma tek kat hedefinin iki katidir; tek hamlede guvenli ve kontrollu bir bitis beklenmez.",
          note: "Cephede bu fark, sarkma ve ayrilma riskini buyutur.",
        },
        {
          title: "Katman stratejisini kur",
          result: "On tesviye veya iki kademeli uygulama ile sapma asamali olarak dusurulmelidir.",
          note: "Aynı noktada malzeme degisimi varsa file detayi de bu stratejiye dahil edilmelidir.",
        },
        {
          title: "Muhendislik sonucunu bagla",
          result: "Dış sivada basari, cepteki bozuklugu daha kalin harcla ortmekten degil; sapmayi katman, detay ve hava kosuluyla birlikte yonetmekten gelir.",
          note: "Cephede gorunen kusur, cogu zaman daha once okunmamis bir sayisal sapmanin sonucudur.",
        },
      ],
      checks: [
        "Lokal sapmalar cephe genelinin icinde kayboluyor varsayilmamalidir.",
        "Tek katla cozulmeyecek bozukluklar sayisal olarak ayrilmali ve asamali uygulanmalidir.",
        "Pencere, parapet ve sokel detaylari bu planin disinda tutulmamalidir.",
        "Hava kosullari uygun degilse uygulama ritmi yeniden planlanmalidir.",
      ],
      engineeringComment: "Dış sivada her fazla milimetre, yagmur ve gunes altinda daha pahali bir riske donusebilir.",
    },
    tools: WALL_TOPIC_TOOLS,
    equipmentAndMaterials: WALL_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Dış sivayi iç siva refleksiyle uygulamak.", correct: "Cephe maruziyetini ve hava kosullarini dış siva için ayri okumak." },
      { wrong: "Denizlik, damlalik ve parapet detaylarini sonradan dusunmek.", correct: "Su davranisini belirleyen dugumleri uygulama öncesi paftalamak." },
      { wrong: "Kolon-duvar siniri ve pencere koselerinde fileyi atlamak.", correct: "Catlak riski tasiyan tüm gecisleri takviye ile cozumlemek." },
      { wrong: "Cepheyi kopuk paneller halinde gelisi güzel bitirmek.", correct: "Ton ve soğuk derz kontrolu için panel sekansi planlamak." },
      { wrong: "Hava kosullarini göz ardi ederek uygulama yapmak.", correct: "Sıcak, ruzgarli veya yagisli gunlerde koruma ve takvim ayari yapmak." },
      { wrong: "Son kat öncesi su davranisini test etmeden teslim vermek.", correct: "Cepheyi görsel kalite kadar su yonu mantigiyla da denetlemek." },
    ],
    designVsField: [
      "Projede dış siva cephe rengi altligi gibi algilanabilir; sahada ise su, gunes ve hareketle en çok muhatap olan savunma katmanidir.",
      "Cephedeki küçük detay hatalari iç mekana göre daha hızlı ve daha sert geri doner.",
      "Iyi dış siva, yalnız güzel gorunen degil; yagmur altinda da sakin kalan cephedir.",
    ],
    conclusion: [
      "Dış siva, doğru harc, doğru detay ve doğru hava kosulu yonetimi ile uygulandiginda cephe omrunu ve görünür kaliteyi ciddi bicimde yukselten bir kabuk katmani kurar. Ihmal edildiginde ise ilk yagmur ve ilk yaz sicaginda kusur vermeye baslar.",
      "Bir insaat muhendisi için doğru bakis, dış sivayi finish degil; su yonu, catlak kontrolu ve kabuk performansinin ana bileseni olarak gormektir.",
    ],
    sources: [...INCE_WALL_TOPIC_SOURCES, TS_EN_13279_SOURCE, TS_EN_998_1_SOURCE],
    keywords: ["dış siva", "cephe siva", "TS EN 998-1", "TS 825", "cephe su davranisi"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/kapi-pencere/pencere", "ince-isler/duvar-kaplamalari/boya"],
  },
];
