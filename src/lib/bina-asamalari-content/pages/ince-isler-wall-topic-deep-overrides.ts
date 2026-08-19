import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideSource, BinaGuideTool } from "../types";

const INCE_WALL_TOPIC_SOURCES = [...BRANCH_SOURCE_LEDGER["ince-isler"]];

const TS_EN_520_SOURCE: BinaGuideSource = {
  title: "TS EN 520 Alçı Levhalar - Tarifler, Ozellikler ve Deney Yontemleri",
  shortCode: "TS EN 520",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alçı levha siniflari, mahal uygunlugu ve temel urun tanimlari için referans standartlardan biridir.",
};

const TS_EN_13279_SOURCE: BinaGuideSource = {
  title: "TS EN 13279 Yapı Alicilari ve Alici Sivalar",
  shortCode: "TS EN 13279",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "Alçı esasli baglayicilar ve sıva sistemlerinde urun ailesini tanimlayan temel referanslardan biridir.",
};

const TS_EN_998_1_SOURCE: BinaGuideSource = {
  title: "TS EN 998-1 Kagir Harci - İç ve Dış Sıva Harclari",
  shortCode: "TS EN 998-1",
  type: "standard",
  url: "https://www.tse.org.tr/",
  note: "İç ve dış sıva sistemlerinde kullanilan harclarin performans ve urun tanimi için temel referanslardan biridir.",
};

const WALL_TOPIC_TOOLS: BinaGuideTool[] = [
  { category: "Detay", name: "Mahal bazli tip kesit, overlay ve numune paftası", purpose: "Sıva, alçıpan ve doğrama birlesimlerini kapatma öncesi netlestirmek." },
  { category: "Ölçüm", name: "Lazer nivo, mastar, nem olcer ve yan isik kontrol seti", purpose: "Yüzey duzlugu, kot ve kuruma durumunu sayisal hale getirmek." },
  { category: "Koordinasyon", name: "MEP servis matrisi ve bakım kapagi listesi", purpose: "Kapanan sistemlerin sonradan kesilmesini veya delinmesini onlemek." },
  { category: "Kalite", name: "Numune alan arşivi ve finish kabul cizelgesi", purpose: "Bitis katmanlari için mahal bazli kabul mantigi kurmak." },
];

const WALL_TOPIC_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Hazirlik", name: "Yüzey temizlik ekipmanlari, astarlar ve aderans kopruleri", purpose: "Alt yuzeyi yeni sisteme uygun hale getirmek.", phase: "Hazirlik" },
  { group: "Uygulama", name: "Metal karkas, levha, sıva harci, file ve yardimci profiller", purpose: "Duvar veya tavan sisteminin asil taşıyıcı ve bitis katmanlarini kurmak.", phase: "Montaj" },
  { group: "Kontrol", name: "Mastar, şakul, nem olcer ve isik kontrol ekipmanlari", purpose: "Bitis kalitesini olcerek kabul etmek.", phase: "Ara ve son kontrol" },
  { group: "Koruma", name: "Köşe koruma, zemin kapama ve teslim koruma malzemeleri", purpose: "Bitmis yuzeyi sonraki ekiplerin hasarindan korumak.", phase: "Teslim öncesi" },
];

export const inceIslerWallTopicDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "ince-isler/alcipan",
    kind: "topic",
    quote: "Alçıpan sistemlerinin gercek kalitesi levhada değil; karkas, servis koordinasyonu ve kapanmadan önce verilen kararlarin dogrulugunda saklidir.",
    tip: "Alcipani hafif iş diye gecmek, en pahali tekrar isleri bakım kapagi, kapı takviyesi, buat yeri ve derz catlagi olarak geri getirir.",
    intro: [
      "Alçıpan ve kuru yapı sistemleri, modern santiyelerde bölme duvar, asma tavan, şaft kapamasi, perde gizleme ve servis koordinasyonu acisindan merkezi bir rol oynar. Bu sistemler hızlı ve temiz uygulama vaat eder; ancak bu vaadin sahada gercege donusmesi, levhadan önce karkas ve servis kararlarinin doğru verilmesine baglidir.",
      "Sahada alcipanla ilgili sikayetlerin buyuk kismi levhanin kendisinden değil; kapanmadan önce unutulan detaylardan kaynaklanir. Kapı kasasi takviyesi yetersizse duvar calisir, bakım kapagi unutulduysa tavan kesilir, islak hacimde yanlış levha secildiyse kabarma ve deformasyon başlar. Yani alcipanin riski gorunen yuzeyde değil, gorunmeden önce saklanan kararlarindadir.",
      "Bir inşaat mühendisi için alçıpan yalnızca dekoratif bitis imalati degildir. Akustik, yangın, servis erisimi, ekipman askisi, tolerans ve mahal netleri bir arada yonetilir. Bu nedenle iyi alçıpan uygulamasi, mimari, elektrik, mekanik ve mobilya ekiplerinin kararlarini tek eksende toplar.",
      "Bu yazida alçıpan sistemlerini; teorik temel, standartlar, saha kabul mantigi, sayisal bir koordinasyon ornegi, yazilim-araç listesi ve sık yapilan hatalar uzerinden daha derin ve kullanışlı bir rehbere donusturuyoruz.",
    ],
    theory: [
      "Kuru yapı sistemlerinde performans levha kalinligi kadar metal karkas duzenine baglidir. Profil araligi, aski noktası, vida ritmi ve takviye detaylari sistemin hem sehim hem de çatlak davranisini belirler. Karkas zayifsa, ustteki en iyi levha ve boya bile uzun süre duz kalamaz. Bu nedenle alcipanin teorik temeli, kapatma mantigindan önce taşıyıcı alt sistemdir.",
      "Asma tavan ve bölme duvarlarda servis yoğunluğu belirleyici bir parametredir. Menfez, lineer aydinlatma, sprinkler, yangın algilama, kamera, hoparlor ve bakım kapagi gibi elemanlar aynı duzlemde toplandiginda aski ritmi ve kesit takviyesi yeniden okunmalidir. Kapanmadan önce cozulmeyen her servis, sistemin sonradan kesilmesine neden olur.",
      "Mahal kullanimi da kuru yapı secimini etkiler. Ofis bölme duvari ile islak hacim tavani, yangın kacis koridoru ile teknik hacim şaft kapamasi aynı levha ailesi veya aynı katman mantigi ile ele alinmaz. TS EN 520 levha ailelerini, TS EN 14195 ise karkas bilesenlerini tanimlarken, Yangın Yönetmeliği fonksiyon bazli performans ihtiyacini sahaya tasir.",
      "Bu nedenle alçıpan, yalnızca görünür bir kaplama değil; kapanan hacimlerde servis erisimi, performans hedefi ve deformasyon kontrolünü birlikte yoneten sistematik bir ince iş paketidir.",
    ],
    ruleTable: [
      {
        parameter: "Levha tipi ve mahal uygunlugu",
        limitOrRequirement: "Nemli, standart veya yangın beklentili hacimlerde uygun levha sinifi secilmelidir",
        reference: "TS EN 520 + Yangın Yönetmeliği",
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
        note: "Sonradan kesilen alçıpan, en çok burada kalite kaybeder.",
      },
      {
        parameter: "Derz ve yüzey hazirligi",
        limitOrRequirement: "Derz bandi, macun ve zemin hazirligi katmanli sekilde ve numune panel mantigiyla uygulanmalidir",
        reference: "Uretici sistem detaylari",
        note: "Tek katta hızlı bitirilen derzler son katta iz verir.",
      },
      {
        parameter: "Takviye gereken noktalar",
        limitOrRequirement: "Kapı kasasi, agir ekipman, rezervuar ve servis kutulari için ilave karkas veya destek elemanlari kapanmadan önce yerlestirilmelidir",
        reference: "Mahal detay paftalari",
        note: "Kritik yükler sonradan levha uzerinden tasinmaya zorlanmamalidir.",
      },
    ],
    designOrApplicationSteps: [
      "Bölme duvar, asma tavan ve şaft alanlarini mimari ve MEP overlay uzerinden cakismazlik acisindan bastan oku.",
      "Mahal fonksiyonuna göre levha tipi, katman sayisi, dolgu ve karkas ritmini standardize et.",
      "Kapı, cihaz, buat, rezervuar ve bakım kapagi gibi takviye isteyen tüm noktalar için kapatma öncesi numune detay olustur.",
      "Karkas montajinda şakul, aks, kot ve servis acikliklarini levha kapanmadan önce ayri ayri onayla.",
      "Derz, macun ve son kat boya öncesi yan isik ve yüzey kontrolünü bir kalite kapısı haline getir.",
      "Teslim öncesi bakım erisimi, kapı fonksiyonu, ses ve görünür yüzey kalitesini birlikte degerlendir.",
    ],
    criticalChecks: [
      "Levha tipi mahale uygun secilmis mi?",
      "Profil ve aski ritmi proje veya sistem detayiyla uyumlu mu?",
      "Bakım kapagi unutulan, sonradan kesilecek servis bolgesi var mi?",
      "Kapı, rezervuar veya agir ekipman cevresinde yeterli takviye kuruldu mu?",
      "Derz cizgileri ve macun kalitesi yan isikta iz veriyor mu?",
      "Bölme duvar ve asma tavanlarda servisler levhayi zayiflatacak sekilde cakisiyor mu?",
    ],
    numericalExample: {
      title: "6,00 m ofis bölme duvarinda kapı ve ekipman takviyesi yorumu",
      inputs: [
        { label: "Duvar uzunlugu", value: "6,00 m", note: "Acik ofis bolmesi" },
        { label: "Duvar yuksekligi", value: "3,00 m", note: "Net kat seviyesi" },
        { label: "Kapı boşluğu", value: "90 cm", note: "Tek kanat kapı" },
        { label: "Ek yük", value: "25 kg TV/ekran askisi", note: "Duvar ustunde ekipman talebi" },
      ],
      assumptions: [
        "Kapı bolgesinde jamb takviyesi uygulanacaktir.",
        "TV veya ekipman askisi için kapanmadan önce ilave alt destek kurulacaktir.",
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
          result: "Kapı, buat, priz, data çıkışı ve TV askisi aynı panelde toplaniyorsa kapanmadan önce detay çözülmelidir.",
          note: "Levha kapandiktan sonra yapilan her mudahale derz ve sehim riskini artirir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Alçıpan sistemlerde asil kalite, kritik bolgeleri bitis öncesi görmek ve takviye kararini o anda vermektir.",
          note: "Hafif sistemler, ancak doğru detayla agir hizmet verebilir.",
        },
      ],
      checks: [
        "Kapı ve ekipman alanlari standart panel gibi ele alinmamalidir.",
        "Servisler kapatma öncesi tek paftada kontrol edilmelidir.",
        "Takviye kararlarinin foto-kaydı tutulmalidir.",
        "Teslim öncesi yalnız boya gorunumu değil fonksiyon da test edilmelidir.",
      ],
      engineeringComment: "Alçıpan islerinde kalite, levha kapandigi gun değil; kapanmadan önce yapilan koordinasyon toplantisinda belirlenir.",
    },
    tools: WALL_TOPIC_TOOLS,
    equipmentAndMaterials: WALL_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Tüm mahallerde aynı levha tipini kullanmak.", correct: "Nem, yangın ve kullanım senaryosuna göre levha secimini ayirmak." },
      { wrong: "Bakım kapagi ve servisleri kapatma sonrasina birakmak.", correct: "Kapanmadan önce tüm servisleri overlay ile kilitlemek." },
      { wrong: "Kapı ve ekipman takviyesini standart profil ritmine birakmak.", correct: "Kritik bolgeleri ilave karkas veya destekle cozumlemek." },
      { wrong: "Derz kalitesini boya ekibinin duzeltecegini dusunmek.", correct: "Macun ve yan isik kontrolünü alçıpan asamasinda bitirmek." },
      { wrong: "Asma tavani yalnız estetige göre okumak.", correct: "Aski ritmi, menfez, armaturr ve bakım erisimini birlikte degerlendirmek." },
      { wrong: "Kapanan sistemlerde foto ve checklist tutmamak.", correct: "Gorunmeyecek detaylari teslim dosyasina kayda almak." },
    ],
    designVsField: [
      "Projede alçıpan cizgileri hafif görünür; sahada ise en yoğun koordinasyon bu cizgilerin icinde yasar.",
      "Kuru yapı sistemlerinin hizi ancak önceden çözülmüş detayla avantajdir; aksi halde hiz, tekrari da hizlandirir.",
      "Iyi alçıpan uygulamasi, estetikten önce servis erisimi ve geometri disiplinidir.",
    ],
    conclusion: [
      "Alçıpan sistemleri doğru karkas, doğru levha secimi ve kapanmadan önce çözülmüş servis detaylari ile uygulandiginda hem hızlı hem de uzun omurlu sonuc verir. Bu zincir koptugunda en buyuk kayip, sonradan acilan delikler ve tekrar eden yüzey tamirleri olarak geri doner.",
      "Bir inşaat mühendisi için en doğru bakis, alcipani hafif iş değil; koordinasyon yoğun, performans hedefli bir sistem uygulamasi olarak yonetmektir.",
    ],
    sources: [...INCE_WALL_TOPIC_SOURCES, SOURCE_LEDGER.yanginYonetmeligi, TS_EN_520_SOURCE],
    keywords: ["alçıpan", "kuru yapı", "TS EN 520", "asma tavan", "bölme duvar koordinasyonu"],
    relatedPaths: ["ince-isler", "ince-isler/alcipan/bolme-duvar", "ince-isler/alcipan/asma-tavan", "ince-isler/kapi-pencere"],
  },
  {
    slugPath: "ince-isler/siva",
    kind: "topic",
    quote: "Sıva, duvari kapatan bir tabaka değil; tüm ince isin görünür geometri ve yüzey kalitesini kuran ana referans duzlemidir.",
    tip: "Sivayi dekoratif on hazirlik gibi görmek, boya, duvar kagidi ve seramik altinda buyuyecek bir kusur biriktirmektir.",
    intro: [
      "Sıva sistemleri, duvar ve tavan yuzeylerini yalnız duz hale getirmez; aynı zamanda aderans, çatlak kontrolü, nem davranisi ve sonraki bitis katmanlarinin kalitesini belirler. Boya, duvar kagidi veya fayans ne kadar iyi secilirse secilsin, altindaki sıva duzlemi zayifsa sonuclar gecici olur.",
      "Sahada sıva ile ilgili en yaygin hata, harc surmeyi bir ustalik aliskanligina indirgemektir. Oysa iç ve dış sıva sistemleri alt yüzey tipi, emicilik, kalinlik, file kullanimi, kurumaya verilen süre ve son kat beklentisi ile birlikte okunur. Bu parametrelerden biri ihmal edildiginde sorun boya katinda veya ilk yagmurda ortaya cikabilir.",
      "Bir inşaat mühendisi için sıva yalnız finish kalemi degildir. Programlama, alt yüzey hazirligi, tesisat tamirleri, pencere köşe detaylari ve çatlak kontrolü burada birlesir. En basit gorunen duvar bile, sıva öncesi yanlış teslim edilirse sonraki tüm ekipleri zorlar.",
      "Bu yazida sıva basligini; teorik temel, standartlar, sayisal duzlem ornegi, yazilim-ve-araç listesi ve saha hatalarini bir araya getirerek uzun-form, akici ve uygulamada kullanilabilir bir blog yazisina donusturuyoruz.",
    ],
    theory: [
      "Sıva, alt yüzey ile üst bitis katmani arasindaki bag tabakasidir. Betonarme, tuğla, gazbeton veya briket gibi farkli yuzeylerin emiciligi ve hareket karakteri farkli oldugu için aynı sıva davranisini beklemek teknik olarak doğru degildir. Bu nedenle sıva sistemlerinde alt yüzey tanisi, uygulamanin ilk mühendislik adimidir.",
      "Kalinlik ve katman mantigi ikinci kritik basliktir. Lokal ceplerin tek katta kapatilmasi, kurumayi hizlandirmak için asiri su cekilen karisimlar veya file gerektiren bolgelerin atlanmasi; sıva duzlemi daha taze iken kusur tohumunu atar. Yüzey sonradan duz gorunse bile bu kusurlar çatlak, ayrilma veya boya izi olarak geri donebilir.",
      "Kritik birleşim hatlari her zaman ozel dikkat ister. Kolon-duvar siniri, pencere ustu ve koseleri, chase tamirleri, tavan-duvar birlesimleri ve islak hacim gecisleri sıva sisteminin sinandigi noktalardir. Tek tip uygulama refleksi burada yetersiz kalir; detay odakli yaklasim gerekir.",
      "TS EN 13914 ve TS EN 998-1 gibi standartlar sıva tasarımı ile urun davranisini cerceveler; fakat sahadaki asil kalite, mastar duzlemi ile kuruma disiplininin birlikte yonetildigi uygulama kulturuyle olusur.",
    ],
    ruleTable: [
      {
        parameter: "Alt yüzey hazirligi",
        limitOrRequirement: "Yüzey toz, gevsek parca, kalıp yagi ve aderansi azaltan tabakalardan arindirilmali; emicilik farklari kontrol edilmelidir",
        reference: "TS EN 13914",
        note: "Kirli veya parlak yuzeyde iyi sıva davranisi beklenmez.",
      },
      {
        parameter: "Harc secimi ve katman kalinligi",
        limitOrRequirement: "İç veya dış mekan ihtiyacina uygun sıva harci secilmeli, asiri kalin tek kat uygulamadan kacinilmalidir",
        reference: "TS EN 998-1 + TS EN 13279",
        note: "Kalinlik telafisi kontrolsuz yapildiginda ayrilma ve çatlak riski artar.",
      },
      {
        parameter: "Kritik birleşimler ve file",
        limitOrRequirement: "Malzeme degisim hatlari, pencere koseleri ve chase tamirlerinde uygun file veya yardimci detaylar uygulanmalidir",
        reference: "TS EN 13914 + saha detay paftası",
        note: "Çatlak en çok bu zayif cizgilerde dogar.",
      },
      {
        parameter: "Kuruma ve koruma",
        limitOrRequirement: "Yeni sıva ani gunes, rüzgar, don ve islak yüzey riskinden korunarak kurutulmalidir",
        reference: "Şantiye kalite plani",
        note: "Yeterli kur almayan sıva son kat altinda bozulur.",
      },
      {
        parameter: "Bitis öncesi kabul",
        limitOrRequirement: "Boya veya kaplama öncesi duzlem, nem, yama izi ve yan isik kontrolü yapilmalidir",
        reference: "Finish kabul cizelgesi",
        note: "Sıva kalitesi en son boyada değil, sıva tesliminde onaylanir.",
      },
    ],
    designOrApplicationSteps: [
      "Alt yuzeyi malzeme tipine göre siniflandir; betonarme, tuğla ve gazbeton için aynı hazirlik refleksini kullanma.",
      "Deneme paneli ile harc davranisini, aderansi ve hedef duzlem kalinligini uygulama öncesi teyit et.",
      "Mastar ve referans kotlarini duvar bazinda sabitle; duzlemi serbest el ile olusturmaya çalışma.",
      "Kolon-duvar siniri, pencere koseleri, chase tamirleri ve zayif gecisleri file veya uygun detay ile bastan cozumle.",
      "Kuruma suresini iş programi baskisina kurban etmeden, son kat ekipleri için sayisal kabul olcumu olustur.",
      "Boya veya kaplama öncesi yan isikta kontrol yapip lokal yama mantigi yerine butun yüzey mantigiyla teslim ver.",
    ],
    criticalChecks: [
      "Alt yüzey toz, yag ve gevsek parcadan tamamen arindirildi mi?",
      "Kalinlik ihtiyaci tek kat uygulamayi zorlayacak seviyede mi?",
      "Malzeme degisim hatlarinda file veya uygun birleşim detayi kullanildi mi?",
      "Kuruma tamamlanmadan boya veya kaplama ekibi alana girdi mi?",
      "Yan isik altinda dalga, yama izi veya mastar kacagi goruluyor mu?",
      "Islak hacim, pencere cevresi ve chase tamirleri ayri kontrol edildi mi?",
    ],
    numericalExample: {
      title: "5,20 m duvarda 18 mm yüzey sapmasi için sıva stratejisi",
      inputs: [
        { label: "Duvar boyu", value: "5,20 m", note: "Salon ana duvari" },
        { label: "Olculen maksimum sapma", value: "18 mm", note: "En yüksek ve en düşük nokta arasi" },
        { label: "Hedef ortalama sıva kalinligi", value: "15 mm", note: "Boya alti iç mekan ornegi" },
        { label: "Amac", value: "Duzlem ve çatlak kontrolünü birlikte saglamak", note: "Tekrar isciligi azaltmak" },
      ],
      assumptions: [
        "Alt yüzey saglam ve aderans acisindan uygun hale getirilmistir.",
        "Elektrik chase tamirleri sıva öncesi tamamlanmistir.",
        "Son kat boya oldugu için görünür dalga toleransi dusuktur.",
      ],
      steps: [
        {
          title: "Sapma ile hedef kalinligi karsilastir",
          formula: "18 mm > 15 mm",
          result: "Olculen sapma, hedef ortalama kalinligi asiyor; tek hamlede düzgün ve güvenli bitis zorlasir.",
          note: "Lokal cepler için katmanli yaklasim veya on tesviye dusunulmelidir.",
        },
        {
          title: "Mastar stratejisini kur",
          result: "Duzlem, önce referans mastarlarla kurulup aradaki boşluklar kontrollu doldurulmalidir.",
          note: "Serbest el uygulama boya altinda dalga ve yamayi buyutur.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Sıva kalitesi kalin harc yigmaktan değil; sapmayi okuyup uygun katman stratejisini kurmaktan gelir.",
          note: "Sıva, bozuk duvari gizleme değil, duzeltmeyi muhendislikle yapma isidir.",
        },
      ],
      checks: [
        "Kalinlik gereksinimi sayisal olarak okunmadan uygulama baslatilmamalidir.",
        "Tek katla cozulmeyecek lokal cepler ayri planda ele alinmalidir.",
        "Mastar ve yan isik kontrolleri sıva sirasinda yapilmalidir.",
        "Kuruma ve boya takvimi birbirine zorla bindirilmemelidir.",
      ],
      engineeringComment: "Sıva kalitesini boyaci değil, mastar cekerken karar veren ekip belirler.",
    },
    tools: WALL_TOPIC_TOOLS,
    equipmentAndMaterials: WALL_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Betonarme, tuğla ve gazbetona aynı hazirlikla sıva yapmak.", correct: "Alt yüzey tipine göre ayri aderans ve hazirlik stratejisi kurmak." },
      { wrong: "Tüm sapmayi tek katta kalin harcla kapatmaya çalışmak.", correct: "Sayisal sapmaya göre katmanli veya on tesviyeli yaklasim secmek." },
      { wrong: "Kolon-duvar ve pencere koselerinde file kullanmamak.", correct: "Kritik gecisleri çatlak riski olarak ozel cozumlemek." },
      { wrong: "Kur almadan sonraki ekiplere alani acmak.", correct: "Sıva kuruma ve koruma suresini kalite kapısı haline getirmek." },
      { wrong: "Boya alti kalitesini son katta duzeltmeye çalışmak.", correct: "Yan isik ve mastar kontrolünü sıva asamasinda bitirmek." },
      { wrong: "Lokal yama izlerini teslim öncesi gormezden gelmek.", correct: "Bitis kabulunde butun yüzey mantigiyla kontrol yapmak." },
    ],
    designVsField: [
      "Projede sıva tek satir metraj gibi görünür; sahada ise tüm görünür kaliteyi tasiyan ana referans tabakadir.",
      "Iyi sıva, boyayi guzellestirir; kötü sıva ise en kaliteli boyayi bile kusur gosteren bir filme cevirir.",
      "Bu nedenle sıva isleri, ustalik kadar programlama ve kalite muhendisligi gerektirir.",
    ],
    conclusion: [
      "Sıva sistemleri doğru alt yüzey tanisi, doğru katman stratejisi ve sabirli kuruma disiplini ile uygulandiginda sonraki tüm ince islerin kalitesini yukselten sessiz bir omurga kurar. Bu zincir bozuldugunda sorun, genellikle en görünür yuzeylerde ortaya çıkar.",
      "Bir inşaat mühendisi için sıva, dekoratif değil teknik bir iş kalemidir; duzlem, çatlak kontrolü ve bitis kalitesinin asil sahnesi burada kurulur.",
    ],
    sources: [...INCE_WALL_TOPIC_SOURCES, TS_EN_13279_SOURCE, TS_EN_998_1_SOURCE],
    keywords: ["sıva", "TS EN 13914", "TS EN 998-1", "yüzey duzlugu", "çatlak kontrolü"],
    relatedPaths: ["ince-isler", "ince-isler/siva/dis-siva", "ince-isler/siva/alci-siva", "ince-isler/duvar-kaplamalari/boya"],
  },
  {
    slugPath: "ince-isler/siva/dis-siva",
    kind: "topic",
    quote: "Dış sıva, cephenin sadece gorunen derisi değil; su, sıcaklık ve hareket etkilerini yoneten ilk savunma katmanidir.",
    tip: "Dış sivayi yalnız renk ve doku altligi gibi görmek, yağmur, gunes, rüzgar ve çatlak etkilerini daha ilk kis sezonunda cepheye davet etmektir.",
    intro: [
      "Dış sıva, binanin dış kabugu uzerindeki en kritik ara katmanlardan biridir. Cepheyi görünür olarak duzgunlestirir; fakat asil gorevi, suyun yuzeyde davranisini yonetmek, boya veya kaplama için dengeli bir zemin kurmak ve betonarme ile dolgu duvar arasindaki hareket farklarini kontrollu bir sekilde tasimaktir.",
      "Sahada dış sıva sorunlari cogu zaman ilk yağmur, ilk yaz sicagi veya ilk kis-don dongusu ile görünür hale gelir. Pencere ustlerinde damlalik yoksa lekelenme olur, file atlanan kolon-duvar sinirlarinda çatlak çıkar, denizlik altlari ve parapet cevresinde su yolu yanlış cozulduysa sıva kabarir veya kusar.",
      "Bir inşaat mühendisi için dış sıva, yalnız cephe estetigi meselesi degildir. TS 825 ve bina kabugu performansi ile birlikte okunmali; doğrama detaylari, mantolama veya isi yalitimi sistemi, iskele lojistigi ve hava kosullariyla beraber ele alinmalidir.",
      "Bu yazida dış sivayi; cephe fizigi, standart gereksinimleri, sayisal bir kalinlik-karar ornegi, saha ekipmanlari ve sık yapilan hatalarla birlikte daha derin bir blog yazisi olarak gelistiriyoruz.",
    ],
    theory: [
      "Dış sıva, iç sıva ile aynı mantikla okunamaz. Cephenin gunes gormesi, rüzgar almasi, yagis yükü, don riskleri ve yuzeyin sıcaklık farklari dış sivayi daha zorlayici hale getirir. Bu nedenle harc secimi, katman kalinligi, file detayi ve uygulama zamani daha kritik hale gelir. İç mekanda tolere edilen bir zayiflik, dış cephede hizla görünür kusura donusebilir.",
      "Dış cephede su davranisi, yalnız dik yuzeyden asagi akan yağmur ile sinirli degildir. Pencere ustu, denizlik, sokel, parapet, balkon kosesi, damlalik ve yatay-simli detaylar suyun ne kadar uzaklastirilacagini belirler. Yanlış detaylanan bir cephede en iyi sıva harci bile tek basina basarili olamaz. Yani dış sıvada geometri de harc kadar önemlidir.",
      "Malzeme gecisleri yine kritik bir rol oynar. Betonarme kolon, kiriş, perde ve dolgu duvarin farkli davranislari dış cephede çatlak olarak daha kolay okunur. Bu nedenle kolon-duvar sinirlarinda, pencere köşe diyagonallerinde ve tamir alanlarinda file veya uygun takviye detaylari vazgecilmezdir.",
      "Ayrıca dış sıva, boya veya dekoratif kaplama ile birlikte bir cephe sistemi gibi dusunulmelidir. Kuruma süresi, astar uyumu ve son kat zamanlamasi birbiriyle baglidir. Saha programi sikistirildiginda, kusur bir yuzeye değil butun cephe imajina yayilir.",
    ],
    ruleTable: [
      {
        parameter: "Harc sistemi ve çevre kosullari",
        limitOrRequirement: "Dış cepheye uygun sıva harci secilmeli; uygulama asiri sıcak, ruzgarli, yagisli veya don riski olan kosullarda korunarak yapilmalidir",
        reference: "TS EN 998-1 + TS EN 13914",
        note: "Dış cephe sıva hatasi hava kosullariyla katlanarak buyur.",
      },
      {
        parameter: "Cephe dugumleri ve su yonu",
        limitOrRequirement: "Denizlik, damlalik, parapet, sokel ve pencere ustleri suyu cepheden uzaklastiracak detayla tamamlanmalidir",
        reference: "Cephe detay paftalari + TS 825 mantigi",
        note: "Su yolu cozulmeden dış sıva tek basina yeterli olmaz.",
      },
      {
        parameter: "Malzeme gecisleri ve file",
        limitOrRequirement: "Kolon-duvar siniri, pencere köşe diyagonali ve tamir alanlarinda takviye detaylari eksiksiz uygulanmalidir",
        reference: "TS EN 13914 + saha detay disiplini",
        note: "Cephede çatlak ilk bu zayif cizgilerde gorulur.",
      },
      {
        parameter: "Kabuk performansi ve son kat uyumu",
        limitOrRequirement: "Dış sıva sistemi isi yalitimi, astar ve son kat boya/kaplama ile uyumlu kurgulanmalidir",
        reference: "TS 825 + BEP Yönetmeliği",
        note: "Cephe kalitesi katmanlar arasi uyumla saglanir.",
      },
      {
        parameter: "Iskele ve uygulama ritmi",
        limitOrRequirement: "Cephe panelleri soğuk derz, ton farki ve yama izi uretmeyecek sekilde planli sekansla uygulanmalidir",
        reference: "Cephe uygulama plani",
        note: "Dış sıva, parcali ve kopuk uygulamayi kolay affetmez.",
      },
    ],
    designOrApplicationSteps: [
      "Cepheyi panel bazinda, maruziyet yonu ve pencere detaylariyla birlikte analiz et; her yuzeyi aynı kosulda varsayma.",
      "Dış cepheye uygun harc sistemi, file detayi ve son kat uyumunu numune panelde önce test et.",
      "Denizlik, damlalik, parapet ve sokel gibi su davranisini belirleyen dugumleri saha uydurmasina birakmadan paftala.",
      "Kolon-duvar sinirlari, pencere koseleri ve tamir alanlarini file ve takviye mantigiyla önceden isaretle.",
      "Uygulamayi iskele akslari, hava kosullari ve cephe panel sekansi ile birlikte planla; parca parca ve kopuk bitislerden kacin.",
      "Son kat boya veya kaplama öncesi cepheyi hem görsel hem su davranisi acisindan butunsel bir turla tekrar kontrol et.",
    ],
    criticalChecks: [
      "Cephede uygulama gunundeki hava kosullari sıva için uygun mu?",
      "Pencere ustleri, denizlikler ve parapet detaylari suyu doğru yonlendiriyor mu?",
      "Kolon-duvar siniri ve pencere koselerinde file veya takviye eksigi var mi?",
      "Sokel ve suya çok maruz bolgelerde harc ve son kat secimi uygun mu?",
      "Panel gecislerinde ton, doku veya soğuk derz izi olusuyor mu?",
      "Son kat öncesi cephe yan isik ve yağmur suyu mantigiyla kontrol edildi mi?",
    ],
    numericalExample: {
      title: "8,00 m yukseklikte cephede 30 mm lokal sapma için katman karari",
      inputs: [
        { label: "Cephe yuksekligi", value: "8,00 m", note: "Iki katli yan cephe" },
        { label: "Lokal maksimum sapma", value: "30 mm", note: "Kolon-duvar gecisinde olculen cep" },
        { label: "Tek kat hedef kalinlik", value: "15 mm", note: "Dış sıva için kontrollu uygulama bandi" },
        { label: "Amac", value: "Çatlak ve sarkma riski yaratmadan duzlem kurmak", note: "Cephe omru için kritik" },
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
          result: "Lokal sapma tek kat hedefinin iki katidir; tek hamlede güvenli ve kontrollu bir bitis beklenmez.",
          note: "Cephede bu fark, sarkma ve ayrilma riskini buyutur.",
        },
        {
          title: "Katman stratejisini kur",
          result: "On tesviye veya iki kademeli uygulama ile sapma asamali olarak dusurulmelidir.",
          note: "Aynı noktada malzeme degisimi varsa file detayi de bu stratejiye dahil edilmelidir.",
        },
        {
          title: "Mühendislik sonucunu bagla",
          result: "Dış sıvada basari, cepteki bozuklugu daha kalin harcla ortmekten değil; sapmayi katman, detay ve hava kosuluyla birlikte yonetmekten gelir.",
          note: "Cephede gorunen kusur, cogu zaman daha önce okunmamis bir sayisal sapmanin sonucudur.",
        },
      ],
      checks: [
        "Lokal sapmalar cephe genelinin icinde kayboluyor varsayilmamalidir.",
        "Tek katla cozulmeyecek bozukluklar sayisal olarak ayrilmali ve asamali uygulanmalidir.",
        "Pencere, parapet ve sokel detaylari bu planin disinda tutulmamalidir.",
        "Hava kosullari uygun degilse uygulama ritmi yeniden planlanmalidir.",
      ],
      engineeringComment: "Dış sıvada her fazla milimetre, yağmur ve gunes altinda daha pahali bir riske donusebilir.",
    },
    tools: WALL_TOPIC_TOOLS,
    equipmentAndMaterials: WALL_TOPIC_EQUIPMENT,
    mistakes: [
      { wrong: "Dış sivayi iç sıva refleksiyle uygulamak.", correct: "Cephe maruziyetini ve hava kosullarini dış sıva için ayri okumak." },
      { wrong: "Denizlik, damlalik ve parapet detaylarini sonradan dusunmek.", correct: "Su davranisini belirleyen dugumleri uygulama öncesi paftalamak." },
      { wrong: "Kolon-duvar siniri ve pencere koselerinde fileyi atlamak.", correct: "Çatlak riski tasiyan tüm gecisleri takviye ile cozumlemek." },
      { wrong: "Cepheyi kopuk paneller halinde gelisi güzel bitirmek.", correct: "Ton ve soğuk derz kontrolü için panel sekansi planlamak." },
      { wrong: "Hava kosullarini göz ardi ederek uygulama yapmak.", correct: "Sıcak, ruzgarli veya yagisli gunlerde koruma ve takvim ayari yapmak." },
      { wrong: "Son kat öncesi su davranisini test etmeden teslim vermek.", correct: "Cepheyi görsel kalite kadar su yonu mantigiyla da denetlemek." },
    ],
    designVsField: [
      "Projede dış sıva cephe rengi altligi gibi algilanabilir; sahada ise su, gunes ve hareketle en çok muhatap olan savunma katmanidir.",
      "Cephedeki küçük detay hatalari iç mekana göre daha hızlı ve daha sert geri doner.",
      "Iyi dış sıva, yalnız güzel gorunen değil; yağmur altinda da sakin kalan cephedir.",
    ],
    conclusion: [
      "Dış sıva, doğru harc, doğru detay ve doğru hava kosulu yönetimi ile uygulandiginda cephe omrunu ve görünür kaliteyi ciddi bicimde yukselten bir kabuk katmani kurar. Ihmal edildiginde ise ilk yağmur ve ilk yaz sicaginda kusur vermeye başlar.",
      "Bir inşaat mühendisi için doğru bakis, dış sivayi finish değil; su yonu, çatlak kontrolü ve kabuk performansinin ana bileseni olarak gormektir.",
    ],
    sources: [...INCE_WALL_TOPIC_SOURCES, TS_EN_13279_SOURCE, TS_EN_998_1_SOURCE],
    keywords: ["dış sıva", "cephe sıva", "TS EN 998-1", "TS 825", "cephe su davranisi"],
    relatedPaths: ["ince-isler", "ince-isler/siva", "ince-isler/kapi-pencere/pencere", "ince-isler/duvar-kaplamalari/boya"],
  },
];
