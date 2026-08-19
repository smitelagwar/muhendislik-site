import { BRANCH_SOURCE_LEDGER, SOURCE_LEDGER } from "../source-ledger";
import type { BinaGuideEquipment, BinaGuidePageSpec, BinaGuideTool } from "../types";

const KABA_CURING_SOURCES = [...BRANCH_SOURCE_LEDGER["kaba-insaat"]];

const CURING_TOOLS: BinaGuideTool[] = [
  { category: "Planlama", name: "Dokum gunu hava senaryosu ve kür plani", purpose: "Rüzgar, gunes ve gece sicakligi değişimi gorulmeden kür karari vermemek." },
  { category: "Ölçüm", name: "Yüzey termometresi, higrometre ve rüzgar olcer", purpose: "Erken yas nem kaybi riskini göz karari yerine veriyle takip etmek." },
  { category: "Kontrol", name: "Kür başlangıç saati ve vardiya takip formu", purpose: "Kurun ertesi gune sarkmasini veya ekip degisiminde unutulmasini engellemek." },
  { category: "Kayıt", name: "Numune, kür fotografi ve hava logu", purpose: "Dayanım ve yüzey davranisini dokum kosullariyla birlikte yorumlamak." },
];

const CURING_EQUIPMENT: BinaGuideEquipment[] = [
  { group: "Koruma", name: "Kür ortusu, geotekstil, PE ortu ve golgeleme ekipmani", purpose: "Genis acik yuzeylerde ani su kaybini ve gunes etkisini sinirlamak.", phase: "Ilk saatler" },
  { group: "Nem kontrolü", name: "Kontrollu sulama seti ve su dağıtım hortumlari", purpose: "Yuzeyi darbelemeyen, duzenli ve yaygin nem koruma saglamak.", phase: "Kür süreci" },
  { group: "Kimyasal yöntem", name: "Kür kimyasali ve pulverizator seti", purpose: "Sulamanin zor oldugu veya programin hassas oldugu durumlarda yüzey buharlasmasini azaltmak.", phase: "Alternatif uygulama" },
  { group: "Takip", name: "Termometre, higrometre ve saha vardiya cizelgesi", purpose: "Kür planini insan hafizasina değil ölçü ve kayda baglamak.", phase: "Tüm süreç" },
];

export const kabaInsaatCuringDeepOverrides: BinaGuidePageSpec[] = [
  {
    slugPath: "kaba-insaat/beton-isleri/kur-islemi",
    kind: "topic",
    quote: "Kür islemi, beton dokumunun sonradan eklenen bir eki değil; betonun doğru dayanima ve dayanikliliga ulasmasi için dokumun ayrilmaz ikinci yarasidir.",
    tip: "Beton iyi yerlesti diye isin bittigini dusunmek, en kritik ilk saatleri rüzgar, gunes ve iş programi baskisina teslim etmek demektir.",
    intro: [
      "Kür islemi, beton dokumu sonrasinda nem ve sıcaklık kosullarinin kontrollu yonetilmesiyle hidratasyonun devamini saglayan temel uygulamadir. Şantiyede cogu kez yalnızca sulama olarak anlasilsa da, gercekte kür; ne zaman baslanacagi, hangi yontemin secilecegi, hangi yuzeyin nasil korunacagi ve ne kadar süre devam edecegi kararlarini birlikte icerir.",
      "Bir inşaat mühendisi için kür konusu teorik bir laboratuvar basligi değil, sahadaki en ucuz ve en etkili kalite yatirimlarindan biridir. Betonun ilk saatlerinde kaybettigi suyu ve yüzey dengesi bozulduktan sonra geri getirmek çok zordur. Bu nedenle iyi yerlestirilmis ama kötü korunmus bir beton, orta halli bir betondan bile daha problemli servis davranisi uretebilir.",
      "Ozellikle döşeme, radye, saha betonu, teras ve genis acik yuzeylerde kurun onemi artar. Cunku bu elemanlar gunes, rüzgar ve düşük bagil nem etkisine en acik alanlardir. Aynı zamanda program baskisi, uzeri yurunecek veya bir sonraki imalat gelecek dusuncesiyle kür suresinin kisaltilmasina yol acar. Sahadaki pek çok yüzey çatlağı, tozuma ve erken dayanım kaybi bu aceleden dogar.",
      "Bu yazida kür islemini sadece 'ne kadar sulayalim' sorusuna indirgemeden; erken yas beton davranisi, hava kosuluna göre yöntem secimi, vardiya ve ekip planlamasi, kalıp sokumu ile birlikte koruma zinciri ve sayisal bir saha ornegiyle birlikte ele aliyoruz.",
    ],
    theory: [
      "Betonda dayanım gelisimi cimento hidratasyonunun devamina baglidir. Hidratasyon için yeterli su ve uygun sıcaklık gerekir. Yuzeyden suyun hizla cekildigi durumlarda, ozellikle ilk saatlerde betonun üst bolgesi alt bolgeye göre farkli davranmaya başlar. Bu fark, plastik rötre, erken cekme çatlağı ve yüzey sertligi kaybi olarak okunabilir.",
      "Kurun amaci sadece su vermek degildir. Ana hedef, betonun yuzeyini ani buharlasma ve termal salinimlardan korumak, boylece iç gerilme dengesini ve hidratasyon devamini desteklemektir. Bu nedenle gunes altinda rastgele hortum tutmak bazen yeterli değil, bazen de zararlidir. Yuzeye suyu ne zaman, hangi ritimle ve hangi koruma katmanı ile verdiginiz sonucu belirler.",
      "Kür yöntemi eleman tipine göre degisir. Kolon ve perde gibi kalıp icinde kalan elemanlar bir süre dogal olarak korunur; ancak kalıp sokumu sonrasinda yüzey birden acikta kalabilir. Döşeme ve radye gibi acik yuzeylerde ise ilk mudahale çok daha kritik hale gelir. Bu nedenle kür planini sadece hava durumu değil, eleman tipi ve kalıp sokum takvimi ile birlikte okumak gerekir.",
      "Bir diger kritik konu da insan faktorudur. Kür cogu şantiyede net sahibi olmayan bir iş kalemi gibi gorulur. Betoncu dokumu bitirdiginde saha terk eder, sonraki ekip ise kurun ne zaman baslayacagini bilmez. Sonuc olarak en kritik ilk 2-4 saat boslukta kalir. Iyi şantiyede kür bir refleks değil, vardiya ve sorumluluk matrisi ile yonetilen yazili bir plandir.",
      "TS EN 13670 ve TS EN 206 mantigi, betonun yalnız taze halde teslimini değil, uygulanma ve koruma kosullarini da kalite zincirinin parçası olarak görür. Dolayisiyla kür disiplinini yok saymak, aslinda betonun uygun uygulanmasi kisminda standardin ruhundan uzaklasmak anlamina gelir.",
    ],
    ruleTable: [
      {
        parameter: "Erken yas koruma başlangıcı",
        limitOrRequirement: "Yüzey, dokum ve ilk bitirme operasyonlari biter bitmez uygun koruma altina alinmalidir",
        reference: "TS EN 13670",
        note: "Kür için ertesi gunu beklemek en degerli ilk zamani kaybetmektir.",
      },
      {
        parameter: "Yontem secimi",
        limitOrRequirement: "Sulama, ortu veya kimyasal kür yöntemi saha sicakligi, rüzgar ve yüzey tipine göre secilmelidir",
        reference: "TS EN 13670 + saha kalite plani",
        note: "Her hava ve her eleman için aynı yöntem aynı sonucu vermez.",
      },
      {
        parameter: "Kür süresi ve süreklilik",
        limitOrRequirement: "Kür süreci program baskisi ile değil beton gelisimi ve iklim kosullari ile birlikte belirlenmelidir",
        reference: "TS EN 13670 + TS EN 206",
        note: "Kısa tutulan kür süreci genelde gozle gorunmeyen dayanıklılık kaybi birakir.",
      },
      {
        parameter: "Kalıp sokumu ile bağlantı",
        limitOrRequirement: "Kalıp sokumu sonrasinda koruma kesintiye ugramadan devam etmelidir",
        reference: "TS EN 13670",
        note: "Kalıp korumasinin bittigi anda yüzey birden risk altina girebilir.",
      },
      {
        parameter: "Izleme ve kayıt",
        limitOrRequirement: "Hava verisi, kür başlangıcı, yöntem ve gozlenen yüzey davranisi saha kaydina bağlanmalıdır",
        reference: "Beton kalite guvence plani",
        note: "Olculmeyen ve kayda baglanmayan kür disiplini tekrarlanabilir kalite uretmez.",
      },
    ],
    designOrApplicationSteps: [
      "Dokumden önce hava durumu, eleman tipi ve sonraki imalat baskisina göre yazili bir kür plani hazirla.",
      "Kür ekipmanini dokum sahasinda beton gelmeden hazir bulundur; ortu, su, kimyasal malzeme ve vardiya sorumlusu sonradan aranmasin.",
      "Yüzey perdah ve ilk bitis kabulunu takiben, hava kosuluna uygun korumayi dakikalar seviyesinde devreye al.",
      "Genis acik yuzeylerde rüzgar ve gunes etkisini saatlik takip et; gerekiyorsa golgeleme, daha sık nemlendirme veya yöntem degisikligi yap.",
      "Kalıp sokumu yapilacak elemanlarda sokum aniyla birlikte yeni koruma zinciri kür; kalıbın sagladigi pasif korumayi bir anda kaybetme.",
      "Kür süreci boyunca yuzeyde çatlak, renk farki, tozuma veya kenar kurumasi gibi belirtileri izleyip plana geri besleme yap.",
    ],
    criticalChecks: [
      "Kür malzemesi ve ekip sorumlusu beton dokumunden önce netlesti mi?",
      "Yüzey korumasi dokumun bittigi gun ve uygun zamanda gercekten basladi mi?",
      "Rüzgar, gunes ve bagil nem riski saha verisi ile takip ediliyor mu?",
      "Kalıp sokumu sonrasinda koruma zincirinde boşluk olusuyor mu?",
      "Yuzeyde erken yas çatlağı, tozuma veya renklenme farki beliriyor mu?",
      "Kür süreci test numunesi, hava verisi ve saha kaydı ile birlikte okunuyor mu?",
    ],
    numericalExample: {
      title: "32 m x 18 m döşemede buharlasma riski ve vardiya plani yorumu",
      inputs: [
        { label: "Döşeme alani", value: "576 m2", note: "Genis acik yüzey" },
        { label: "Hava sicakligi", value: "31 C", note: "Yaz ogleden sonrasi senaryosu" },
        { label: "Rüzgar hizi", value: "18 km/sa", note: "Yüzey su kaybini artiran orta kuvvet" },
        { label: "Planlanan ilk aktif kür ekibi", value: "3 kisi", note: "Ortme ve nemlendirme için" },
      ],
      assumptions: [
        "Perdah ve son yüzey islemleri programli sekilde tamamlanmistir.",
        "Kür ortusu ve kontrollu sulama ekipmani sahada hazirdir.",
        "Bu hesap standarttaki ayrintili buharlasma formulunun yerine gecmez; saha karar mantigini gosterir.",
      ],
      steps: [
        {
          title: "Risk seviyesini yorumla",
          result: "31 C ve 18 km/sa rüzgar, genis döşemede ilk saatlerde yüksek buharlasma riski olusturur.",
          note: "Bu durumda kurun ertesi gune birakilmasi acik bir kalite zafiyetidir.",
        },
        {
          title: "Alan bazli ekip ihtiyacini dusun",
          formula: "576 / 3 = 192 m2/kisi",
          result: "Uc kisilik ekip için kisi basi yaklasik 192 m2 yüzey dusmektedir.",
          note: "Bu oran, ilk mudahalenin tek kisiye birakilamayacagini gosterir.",
        },
        {
          title: "Mühendislik kararini bagla",
          result: "Kür yöntemi ortu + kontrollu nem koruma olarak hemen baslamali, vardiya devri ve gece takibi daha dokum bitmeden planlanmalidir.",
          note: "Kür, sadece yöntem secimi değil ekip ve zamanlama problemidir.",
        },
      ],
      checks: [
        "Genis yuzeylerde kür kapasitesi ekip sayisi ile birlikte planlanmalidir.",
        "Rüzgar etkisi sadece hava sicakligi kadar belirleyici olabilir.",
        "Ilk aktif koruma dakikalar seviyesinde gecikirse daha sonraki sulama her kaybi telafi etmez.",
        "Yüzey davranisi ile test numunesi sonuclari birlikte izlenmelidir.",
      ],
      engineeringComment: "Kür kalitesi genellikle beton sinifindan değil, ilk saatlerdeki disiplin seviyesinden okunur.",
    },
    tools: CURING_TOOLS,
    equipmentAndMaterials: CURING_EQUIPMENT,
    mistakes: [
      { wrong: "Kurun ertesi gun sulama ile baslayabilecegini dusunmek.", correct: "Ilk korumayi dokum gunu ve uygun ilk anda devreye almak." },
      { wrong: "Her mevsim ve her eleman için aynı kür yontemini kullanmak.", correct: "Hava, yüzey tipi ve lojistige göre yöntemi ayarlamak." },
      { wrong: "Kalıp icinde kaldigi için elemanin tamamen guvende oldugunu varsaymak.", correct: "Kalıp sokumu sonrasindaki ani risk artisini planlamak." },
      { wrong: "Kür isini net sorumlusu olmayan genel şantiye gorevi gibi görmek.", correct: "Sorumlu ekip, vardiya ve kontrol formu ile yazili yonetmek." },
      { wrong: "Yuzeyde ilk çatlak gorulene kadar mudahale etmemek.", correct: "Çatlak cikmadan önce hava ve yüzey davranisina göre onleyici hareket etmek." },
      { wrong: "Kür surecini kayda baglamadan yalnızca tecrubeye dayali yurutmek.", correct: "Hava, saat, yöntem ve gozlemi kalite kaydina islemek." },
    ],
    designVsField: [
      "Ofiste beton sinifi ve kesit kapasitesi konusulur; sahada ise bu potansiyelin gercege donusmesi kür disiplini ile saglanir.",
      "Doğrudan gorunmeyen bir kalite kalemi oldugu için kür kolayca ihmal edilir; oysa uzun vadeli dayanıklılık sorunlarinin buyuk bolumu burada başlar.",
      "Iyi şantiyede kür, hortum tutma refleksi değil; beton dokum planinin yazili ve sahipli parçası olarak yurur.",
    ],
    conclusion: [
      "Kür islemi, betonun hem erken yas hem de uzun vadeli davranisini belirleyen kritik uygulama basligidir. Doğru sinifta beton kullanmak kadar, o betonu ilk saatlerde doğru kosullarda korumak da mühendislik sorumlulugudur.",
      "Bir inşaat mühendisi için en sağlam yaklasim, kuru tamamlayici küçük iş değil, beton dokum kararinin vazgecilmez parçası olarak yonetmektir. Bu bakis yüzey çatlağı, tozuma ve dayanıklılık kaybi riskini belirgin bicimde azaltir.",
    ],
    sources: [...KABA_CURING_SOURCES, SOURCE_LEDGER.tsEn13670, SOURCE_LEDGER.tsEn206],
    keywords: ["kür islemi", "beton kuru", "TS EN 13670", "erken yas beton", "nem kontrolü"],
    relatedPaths: ["kaba-insaat", "kaba-insaat/beton-isleri", "kaba-insaat/beton-isleri/beton-dokumu"],
  },
];
