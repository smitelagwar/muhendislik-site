import {
  firePhase5References,
  phase5Lines,
  PHASE5_FIRE_ROUTE_VISUALS,
  PHASE5_UPDATED_AT,
  type DepremPhase5Override,
} from "./deprem-phase5-shared";

export const DEPREM_PHASE5_FIRE_ROUTE_COMPARTMENT: DepremPhase5Override = {
  slug: "yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma",
  title: "Yangın Bölmesi, Koridor ve Kaçış Yolu Boyutlandırma",
  description: "Yangın kompartımanı, koridor, kapı ve kaçış yolunu ayrı elemanlar yerine aynı tahliye ve yangın sınırlama zincirinin parçaları olarak ele alır; kullanıcı yükü, güzergâh sürekliliği, daralma noktaları, kompartıman dayanımı ve disiplinler arası geçiş detaylarını proje kontrol akışına dönüştürür.",
  seoTitle: "Yangın Bölmesi, Koridor ve Kaçış Yolu Boyutlandırma | BYKHY",
  seoDescription: "Yangın kompartımanı, kaçış koridoru ve çıkış yolunda kullanıcı yükü, 60 dakika kompartıman, 21,50/30,50 m yüksek bina koşulları, daralma ve süreklilik kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "16 dk",
  image: PHASE5_FIRE_ROUTE_VISUALS.cover,
  relatedSlugs: [
    "kacis-merdiveni-tasarim-kriterleri",
    "yangin-kapisi-dosleme-duvar-gecis-detaylari",
    "yuksek-binalarda-ozel-yangin-onlemleri-bolum-9",
  ],
  sections: [
    {
      id: "kompartiman-kacis-ayni-zincir",
      title: "Yangın kompartımanı ve kaçış yolu aynı güvenlik zincirinin iki farklı işlevidir",
      content: phase5Lines(
        "**Yangın kompartımanı** yangını, ısıyı ve dumanı belirli bir bölgede sınırlamaya; **kaçış yolu** ise kullanıcıyı bulunduğu noktadan güvenli alana kesintisiz ulaştırmaya çalışır. Birinin başarısı diğerinin hatasını otomatik olarak telafi etmez. Çok iyi ayrılmış bir kompartımanın çıkış koridoru daralıyorsa tahliye aksar; geniş bir koridorun kompartıman duvarı veya tesisat geçişi süreksizse duman ve ısı kaçış yoluna taşınabilir.",
        "",
        "Bu nedenle mimari yangın kontrolünde duvar, kapı, koridor, merdiven ve son çıkış tek pafta zinciri üzerinde izlenmelidir. Projede her kaçış güzergâhının başlangıç noktası, kat çıkışı, merdiven bağlantısı ve bina dışındaki güvenli alana ulaşımı kesintisiz okunabilmelidir.",
        "",
        `![Yangın bölmesi, koridor ve kaçış yolu teknik kontrol şeması](${PHASE5_FIRE_ROUTE_VISUALS.diagram})`,
        "*Kompartıman sınırı ile kullanıcı akışını aynı plan üzerinde ilişkilendiren deterministik teknik şema.*",
        "{figure:F1 | note:Şema, makaledeki kontrol zincirini görselleştirir; projeye özgü kullanıcı yükü hesabı ve yürürlükteki yönetmelik kontrolünün yerine geçmez. | source:Mühendislik Site — makale içeriğinden türetilmiş teknik şema | lightbox:true}"
      ),
      subsections: [],
    },
    {
      id: "kompartiman-madde24",
      title: "Kompartıman sınırında yalnız duvarı değil döşeme, kapı ve bütün geçişleri birlikte doğrulayın",
      content: phase5Lines(
        "BYKHY tanımında yangın kompartımanı; tavan ve taban döşemesi dâhil çevresini oluşturan yapı elemanlarıyla yangın, duman ve ısı geçişini sınırlandıran bölgedir. Yönetmelik tanımındaki temel dayanım seviyesi **en az 60 dakika**dır; ancak ilgili kullanım, eleman veya özel hüküm daha yüksek performans gerektirebilir.",
        "",
        "BYKHY **Madde 24** kapsamında yüksek katlı kullanımlarda düşey kompartımanlaşma ayrıca önem kazanır. Bina yüksekliği **21,50 m'den fazla konut dışı** binalarda ve bina yüksekliği **30,50 m'den fazla konutlarda**, belirtilen seviyelerin üzerindeki katlarda en çok **3 kat** bir yangın kompartımanı olarak düzenlenir. Proje tarihinde güncel konsolide metin ve ilgili dipnotlar ayrıca doğrulanmalıdır.",
        "",
        "| Kompartıman arayüzü | Projede kontrol | Hata sonucu |",
        "|---|---|---|",
        "| Duvar / döşeme | Gerekli yangın dayanımı ve süreklilik | Alev ve ısı komşu bölgeye geçebilir |",
        "| Yangın kapısı | Dayanım, duman kontrolü, kendiliğinden kapanma | Korunan sınır kapı açıklığında kaybolabilir |",
        "| Tesisat penetrasyonu | Uygun firestop ve servis detayının sürekliliği | Küçük açıklık bütün kompartımanı zayıflatabilir |",
        "| Cephe / şaft birleşimi | Döşeme kenarı ve düşey boşlukların yalıtımı | Katlar arası gizli yayılım oluşabilir |"
      ),
      subsections: [],
    },
    {
      id: "kullanici-yuku-kapasite",
      title: "Kaçış yolu genişliğini bina toplamından değil ilgili katın kullanıcı yükü ve güzergâhından çözün",
      content: phase5Lines(
        "Bakanlık kılavuzu, çok katlı bir binada kaçış yolu genişliklerinin bütün binanın toplam kullanıcı yüküne göre değil, **her kat için o kattaki kullanıcı yüküne göre** hesaplanması gerektiğini açıklar. Zemin seviyesinde güvenli alana açılan ortak koridor, hol veya merdiven ağzı ise kendisine bağlanan katlar içinde en büyük gerekli kapasitenin altında bırakılamaz.",
        "",
        "Bu yaklaşım, yalnız net koridor genişliğini ölçmekten daha kapsamlıdır. Kapı kanadı, turnike, dolap, kolon çıkıntısı, tesisat şaftı, yangın dolabı veya mimari niş nedeniyle oluşan **daralma noktaları** gerçek kaçış kapasitesini belirler. Kaçış yolundaki seri elemanlardan en dar olanı sistemin darboğazı hâline gelir.",
        "",
        "Asansör normal kaçış yolu olarak kabul edilmez. Kaçış yolu; oda veya bağımsız bölüm çıkışından koridora, kat çıkışına, merdivene, zemin kattaki son çıkışa ve bina dışındaki güvenli alana kadar devam eden bir güzergâh olarak okunmalıdır."
      ),
      subsections: [],
    },
    {
      id: "koridor-kapi-daralma",
      title: "Koridor ve kapı ölçüsünü tek noktada değil bütün rota boyunca net açıklık olarak kontrol edin",
      content: phase5Lines(
        "Kaçış rotasında çizimde yazan nominal ölçü ile kullanıcıya gerçekten kalan **net açıklık** aynı olmayabilir. Özellikle kapı kasası, açık kapı kanadı, korkuluk, tesisat kutusu veya dekoratif eleman koridoru daraltıyorsa paftadaki genel genişlik değeri güvenli kapasiteyi temsil etmez.",
        "",
        "Yangın kapısında Batch 2'de doğrulanan **80 cm net genişlik / 200 cm net yükseklik** asgari geometrisi yalnız başlangıç kontrolüdür. Kullanıcı yükü daha büyük açıklık gerektiriyorsa hesaplanan değer esas alınır. Kapı açılma yönü ve kapının açık konumda başka bir kaçış kolunu daraltıp daraltmadığı da birlikte kontrol edilir.",
        "",
        "Koridor geometrisini kontrol ederken plan üzerinde tek bir ölçü yazmak yerine; güzergâhın en dar üç-beş kesitini ölçülendirip kapı açılımı ve sabit ekipmanlarla birlikte net geçiş zarfını gösterin."
      ),
      subsections: [],
    },
    {
      id: "proje-koordinasyonu",
      title: "Yangın bölmesi mimari çizgide başlayıp mekanik ve elektrik penetrasyonlarında devam eder",
      content: phase5Lines(
        "Kompartıman duvarı üzerinden geçen havalandırma kanalı, kablo tavası, boru, busbar veya şaft ağzı proje koordinasyonunun kritik arayüzüdür. Mimari paftada kesintisiz görünen bir yangın bölmesi, mekanik veya elektrik projesindeki kontrolsüz bir geçiş nedeniyle sahada süreksiz hâle gelebilir.",
        "",
        "Pafta koordinasyonunda her kompartıman sınırına benzersiz bir kod verin ve bu kodu mimari, mekanik ve elektrik detaylarında kullanın. Kapı, damper, firestop, şaft kapaması ve döşeme kenarı bariyerleri aynı sınır koduna bağlandığında saha kabulü izlenebilir olur.",
        "",
        "Kaçış koridoruna açılan tesisat hacimleri ve kapılar da kullanıcı akışını bozmamalı; bakım sırasında açık bırakılan ekipmanların dahi kaçış genişliğini kapatmayacağı bir yerleşim kurulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "teknik-sorumluluk-yanlis-uygulama",
      title: "Teknik sorumluluk hesaplanan kaçış kapasitesinin sahadaki en dar noktaya kadar korunmasını doğrulamaktır",
      content: phase5Lines(
        "**Teknik sorumluluk**, kullanıcı yükünden çıkan kaçış kapasitesini mimari plan, yangın kapıları, kompartıman sınırları ve disiplinler arası geçiş detayları boyunca korumak; revizyon sonrasında yeni bir daralma veya süreksizlik oluşmadığını doğrulamaktır.",
        "",
        "Yanlış uygulamanın tipik örneği, ruhsat projesinde yeterli görülen koridora sonradan şaft, dolap veya kapı kanadı eklenmesidir. Benzer şekilde yangın duvarındaki küçük bir kablo geçişinin harçla gelişigüzel kapatılması, test edilmiş firestop sisteminin yerini tutmaz.",
        "",
        "Saha kabulünde rota boyunca net genişlik ölçümü, kapı fonksiyon testi ve kompartıman penetrasyon fotoğrafları aynı kontrol kaydında tutulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Her katın **kullanıcı yükünü** ve buna bağlı kaçış kapasitesini ayrı doğruladım.",
        "- [ ] Kompartıman sınırında duvar, döşeme, kapı, şaft ve penetrasyon sürekliliğini birlikte kontrol ettim.",
        "- [ ] **Madde 24** kapsamındaki **21,50 m / 30,50 m / 3 kat** kompartıman koşulunu proje için doğruladım.",
        "- [ ] Kaçış rotasındaki bütün **daralma** noktalarını net açıklık olarak ölçülendirdim.",
        "- [ ] Kapı açılımlarının koridor veya merdiven kapasitesini azaltmadığını kontrol ettim.",
        "- [ ] Asansörü normal kaçış yolu hesabına dâhil etmedim.",
        "- [ ] Mimari, mekanik ve elektrik penetrasyon detaylarını aynı kompartıman koduyla eşleştirdim.",
        "- [ ] Saha kabulünde net genişlik, kapı fonksiyonu ve firestop kayıtlarını izlenebilir tuttum."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 24 ve kaçış yolları/yangın kompartımanı hükümleri"),
  keywords: ["yangın kompartımanı", "kaçış yolu", "koridor", "kullanıcı yükü", "Madde 24", "60 dakika", "daralma"],
  tags: ["yangın", "kaçış", "kompartıman", "koridor", "BYKHY"],
};

export const DEPREM_PHASE5_FIRE_HIGH_RISE: DepremPhase5Override = {
  slug: "yuksek-binalarda-ozel-yangin-onlemleri-bolum-9",
  title: "Yüksek Binalarda Özel Yangın Önlemleri",
  description: "Yüksek bina tanımını tek bir eşik değil, kompartıman, kaçış, basınçlandırma, acil durum asansörü, aktif söndürme ve yangın otomasyonu kararlarının tetikleyicisi olarak ele alır; eski 'Bölüm 9' başlığını güncel konsolide BYKHY hükümleri üzerinden yeniden kurar.",
  seoTitle: "Yüksek Binalarda Yangın Güvenliği | BYKHY 21,50 m, 30,50 m ve 51,50 m",
  seoDescription: "Yüksek bina tanımı, 21,50/30,50 m eşikleri, açık kaçış merdiveni yasağı, 51,50 m acil durum asansörü, basınçlandırma ve kompartıman kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "17 dk",
  relatedSlugs: [
    "duman-tahliyesi-mekanik-ve-dogal-sistemler",
    "sprinkler-sistemi-zorunluluk-sinirlari",
    "yangin-algilama-ve-ihbar-sistemi-gereksinimleri",
  ],
  sections: [
    {
      id: "yuksek-bina-tanimi",
      title: "Yüksek bina tanımı, birden fazla yangın güvenliği kontrolünü aynı anda tetikler",
      content: phase5Lines(
        "BYKHY tanımına göre **yüksek bina**, bina yüksekliği **21,50 m'den** ve yapı yüksekliği **30,50 m'den** fazla olan binalardır. Buradaki iki yüksekliğin tanımı aynı değildir; proje raporunda hangi kotlardan ölçüldüğü açıkça gösterilmeden yalnız toplam kat adedinden karar verilmemelidir.",
        "",
        "Eski içerikteki 'Bölüm 9' ifadesi güncel konsolide metinde tek bir bölümden okunacak bağımsız bir yüksek bina kural seti gibi kullanılmamalıdır. Yüksek bina hükümleri; kompartıman, kaçış, merdiven, asansör, duman kontrolü, yangın dolabı, sprinkler ve algılama hükümlerine dağılmış durumdadır.",
        "",
        "Bu nedenle yüksek bina kontrolünü 'yüksekliği geçti/geçmedi' şeklinde tek satır değil, tetiklenen sistemlerin listesi olarak yönetin."
      ),
      subsections: [],
    },
    {
      id: "pasif-koruma-kompartiman",
      title: "Yükseklik arttıkça düşey kompartımanlaşma ve cephe-döşeme birleşimleri kritikleşir",
      content: phase5Lines(
        "Yüksek binada yangının bir katta tutulamaması, düşey şaftlar ve cephe boşlukları üzerinden çok sayıda kata yayılma riskini büyütür. BYKHY **Madde 24** kapsamında bina yüksekliği 21,50 m'den fazla konut dışı binalarda ve 30,50 m'den fazla konutlarda ilgili seviyelerin üzerindeki katlarda en çok **3 kat** bir yangın kompartımanı olarak düzenlenir.",
        "",
        "Giydirme cephe ile döşeme kenarının birleştiği noktalarda alevin kat atlamasını önleyecek bariyer ve yalıtım sürekliliği ayrıca çözülmelidir. Yangın kompartımanı yalnız iç duvar planı değildir; cephe, şaft ve döşeme arayüzleri de pasif koruma zinciridir.",
        "",
        "| Pasif koruma noktası | Yüksek binada özel risk | Kontrol |",
        "|---|---|---|",
        "| Döşeme-kompartıman | Düşey yayılım | Süreklilik ve penetrasyon |",
        "| Cephe-döşeme birleşimi | Kat atlayan alev/duman | Bariyer ve yalıtım |",
        "| Şaftlar | Baca etkisi | Şaft çevresi ve kapak/kapı dayanımı |",
        "| Yangın güvenlik holü | Dumanın merdiven/asansöre geçişi | Basınçlandırma ve duman sızdırmaz sınır |"
      ),
      subsections: [],
    },
    {
      id: "kacis-merdiveni",
      title: "Bina yüksekliği 21,50 m'yi geçtiğinde dış açık kaçış merdivenini çözüm olarak kullanamazsınız",
      content: phase5Lines(
        "Bakanlık kılavuzunda BYKHY **Madde 42** kapsamında bina yüksekliği **21,50 m'den fazla** olan binalarda bina dışında açık kaçış merdivenine izin verilmediği açıkça gösterilir. Yükseklik arttıkça duman, rüzgâr ve uzun düşey tahliye nedeniyle korunumlu kaçış merdiveni ve bağlantı holleri daha kritik hâle gelir.",
        "",
        "Kaçış merdiveni kapasitesi kullanıcı yüküne göre çözülür; merdivene ulaşan koridor ve kapılar aynı kapasiteyi korumalıdır. Merdiven kovası için gerekli basınçlandırma, duman kontrolü Batch 2'deki Madde 89 koşullarıyla birlikte değerlendirilmelidir.",
        "",
        "Yanlış uygulama, normal mimari merdiveni yalnız yangın kapısı ekleyerek otomatik olarak yüksek bina kaçış merdivenine dönüştürmektir. Merdiven yuvasının çevresel dayanımı, hol bağlantıları, çıkış sürekliliği ve duman kontrolü birlikte çözülmelidir."
      ),
      subsections: [],
    },
    {
      id: "acil-durum-asansoru",
      title: "Yapı yüksekliği 51,50 m'yi geçtiğinde en az bir acil durum asansörü gerekir",
      content: phase5Lines(
        "BYKHY **Madde 63** kapsamında yapı yüksekliği **51,50 m'den fazla** olan yapılarda en az **1 acil durum asansörü** düzenlenmesi gerekir. Bu asansör normal işletmede kullanılabilse de yangın veya acil durumda kontrolü acil durum ekiplerine geçer; amaç müdahale ekipmanını taşımak, kurtarmayı desteklemek ve engelli kullanıcı tahliyesine imkân sağlamaktır.",
        "",
        "Bakanlık kılavuzundaki tipik şemada acil durum asansörü kabin alanı en az **1,8 m²**, yangın güvenlik holü **6 m² ile 10 m²** arasında; hol çevresinde **120 dakika** yangına dayanıklı duvar ve **90 dakika** yangına dayanıklı duman sızdırmaz kapı gösterilir. Proje tarihi ve güncel konsolide hüküm ayrıca doğrulanmalıdır.",
        "",
        "Asansör kuyusu basınçlandırması, acil enerji, yangın paneli senaryosu ve itfaiye erişimi ayrı paftalarda kalmamalı; tek cause-effect matrisi üzerinde test edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "aktif-sistemler",
      title: "Yüksek binada aktif sistemler birbirinin alternatifi değil katmanlı savunmadır",
      content: phase5Lines(
        "Yüksek binalarda yangın dolabı, otomatik yağmurlama, algılama ve uyarı, duman kontrolü ve acil durum enerji sistemi aynı olay zincirinin farklı aşamalarına müdahale eder. Bir sistemin bulunması diğerinin gerekliliğini otomatik olarak ortadan kaldırmaz.",
        "",
        "Bakanlığın resmî görüşlerinde, bina yüksekliği **21,50 m'den** veya yapı yüksekliği **30,50 m'den** fazla olan yüksek binalarda yangın dolabı tesisatının kullanım sınıfından bağımsız olarak zorunlu olduğu açıklanmıştır. Sprinkler zorunluluğu ise Batch 1'de açıklandığı üzere kullanım ve yapı yüksekliği eşikleriyle ayrıca kontrol edilir.",
        "",
        "Aktif sistemlerin tasarımında pompa odası, su deposu, jeneratör, alarm paneli ve duman kontrol fanlarının yerleşimi erken mimari aşamada kilitlenmezse sonradan taşıyıcı ve mimari çakışmalar oluşur."
      ),
      subsections: [],
    },
    {
      id: "senaryo-kabul-bakim",
      title: "Yüksek bina güvenliği tek tek cihaz kabulü değil bütünleşik yangın senaryosu testidir",
      content: phase5Lines(
        "Yangın algılandığında kapı tutucuların serbest kalması, basınçlandırma ve duman kontrolünün devreye girmesi, asansörlerin yangın moduna geçmesi, acil durum aydınlatmasının ve alarmın çalışması gibi fonksiyonlar aynı cause-effect zincirinde tanımlanmalıdır.",
        "",
        "Kabul testinde yalnız ekipmanı elle çalıştırmak yerine gerçek senaryo adımlarıyla giriş-çıkış sinyalleri doğrulanmalıdır. Enerji kesintisi, fan arızası, kapı açık durumu ve jeneratöre geçiş gibi kritik hata senaryoları da test kapsamına alınmalıdır.",
        "",
        "Bakım planı aktif sistemler kadar yangın kapıları, firestoplar, şaft kapakları ve cephe bariyerleri gibi pasif bileşenleri de kapsamalıdır."
      ),
      subsections: [],
    },
    {
      id: "teknik-sorumluluk",
      title: "Teknik sorumluluk yüksekliği ölçmekten sonra başlayan sistem koordinasyonunu yönetmektir",
      content: phase5Lines(
        "**Teknik sorumluluk**, yüksek bina tanımını doğru kotlardan belirledikten sonra bu sınıfın tetiklediği kompartıman, kaçış, duman kontrolü, acil durum asansörü, söndürme ve algılama gereklerini disiplinler arasında aynı projeye yansıtmak; sahada kurulmuş sistemlerin bütünleşik testini doğrulamaktır.",
        "",
        "Yanlış uygulama; yüksekliği yalnız kat sayısından değerlendirmek, 51,50 m acil durum asansörü şartını normal asansörle karşılanmış saymak veya basınçlandırma sistemini jeneratör/algılama otomasyonundan bağımsız bırakmaktır.",
        "",
        "Proje kontrol raporunda her tetikleyici eşik için 'uygulanır/uygulanmaz' kararı, dayanak maddesi ve ilgili pafta numarası birlikte gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Bina yüksekliği **21,50 m** ve yapı yüksekliği **30,50 m** tanımlarını doğru kotlardan hesapladım.",
        "- [ ] Yüksek katlarda **3 kat** kompartıman kuralını ve pasif yangın sınırlarını kontrol ettim.",
        "- [ ] Bina yüksekliği 21,50 m üzerindeyse dış **açık kaçış merdiveni** kullanmadım.",
        "- [ ] Merdiven ve asansör basınçlandırma gereklerini yangın senaryosuyla eşleştirdim.",
        "- [ ] Yapı yüksekliği **51,50 m** üzerindeyse en az **1 acil durum asansörü** düzenledim.",
        "- [ ] Acil durum asansörü için **1,8 m²**, **6-10 m²**, **120/90 dakika** arayüz kontrollerini doğruladım.",
        "- [ ] Sprinkler, yangın dolabı, algılama, duman kontrolü ve acil enerji sistemlerinin birlikte çalışmasını test ettim.",
        "- [ ] Cephe, şaft ve penetrasyonlardaki pasif yangın sürekliliğini saha kayıtlarıyla doğruladım."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("yüksek bina tanımı, Madde 24, Madde 42, Madde 63 ve ilgili aktif/pasif sistem hükümleri"),
  keywords: ["yüksek bina", "21,50 m", "30,50 m", "51,50 m", "acil durum asansörü", "kompartıman", "basınçlandırma"],
  tags: ["yangın", "yüksek bina", "acil durum asansörü", "BYKHY", "pasif koruma"],
};

export const DEPREM_PHASE5_FIRE_SPECIAL_AREAS: DepremPhase5Override = {
  slug: "bodrum-otopark-mutfak-yangin-uygulamalari",
  title: "Bodrum, Otopark ve Mutfak Yangın Uygulamaları",
  description: "Bodrum kat, kapalı otopark ve profesyonel mutfakları tek bir 'özel mahal' etiketiyle değil, farklı duman hareketi, yakıt, havalandırma, söndürme ve kaçış riskleri üzerinden değerlendirir; Madde 57, 60 ve 88 hükümlerini proje-saha kontrol zincirine dönüştürür.",
  seoTitle: "Bodrum, Kapalı Otopark ve Mutfak Yangın Kontrolleri | BYKHY Madde 57, 60, 88",
  seoDescription: "Kapalı otoparkta 600 m² sprinkler, 2.000 m² duman tahliyesi ve 10 hava değişimi; mutfakta davlumbaz otomatik söndürme, gaz algılama/kesme ve bodrum kaçış kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "17 dk",
  relatedSlugs: [
    "duman-tahliyesi-mekanik-ve-dogal-sistemler",
    "sprinkler-sistemi-zorunluluk-sinirlari",
    "yangin-kapisi-dosleme-duvar-gecis-detaylari",
  ],
  sections: [
    {
      id: "uc-mahal-uc-risk",
      title: "Bodrum, otopark ve mutfak aynı binada olsa da yangın mekanizmaları farklıdır",
      content: phase5Lines(
        "Bodrum katta doğal duman tahliyesi ve güvenli çıkış kısıtlı olabilir; kapalı otoparkta araç yangını, geniş yatay hacim ve egzoz/duman hareketi öne çıkar; profesyonel mutfakta ise sıcak yüzey, yağ buharı, davlumbaz-kanal sistemi ve gaz yakıt birlikte risk oluşturur. Bu üç mahali tek bir genel 'yangın tesisatı var' kontrolüyle kabul etmek teknik olarak yetersizdir.",
        "",
        "| Mahal | Baskın risk | Projede ilk kontrol |",
        "|---|---|---|",
        "| Bodrum | Dumanın çıkış ve düşey boşluklara yayılması | Kaçış, merdiven/şaft ayrımı, duman kontrolü |",
        "| Kapalı otopark | Araç yangını ve geniş hacimde duman birikmesi | Açık/kapalı sınıfı, sprinkler, mekanik duman tahliyesi |",
        "| Profesyonel mutfak | Yağ ve gaz kaynaklı hızlı yangın | Davlumbaz söndürme, gaz algılama/kesme, egzoz kanalı |",
        "",
        "Her mahallin kullanım ve alan bilgisini yangın projesinin giriş verisi olarak ayrı kaydedin."
      ),
      subsections: [],
    },
    {
      id: "bodrum-kacis-duman",
      title: "Bodrum katta kaçış ve düşey boşluklar dumanın üst katlara taşınmasını engelleyecek şekilde çözülmelidir",
      content: phase5Lines(
        "Bodrum kata hizmet veren merdiven ve asansörler, dumanın üst katlara taşınabileceği düşey yollar oluşturur. Bakanlık kılavuzu, bodrum ve üst katlara hizmet veren aynı kaçış merdiveni yuvasında zemin seviyesinde yangına **120 dakika** dayanıklı ve duman sızdırmaz ayırma ile ayrı çıkış düzenlenmesi hâlinde üst kat yüksekliğinin ayrıca değerlendirilebildiğini gösterir.",
        "",
        "Bodruma da hizmet veren asansörlere bodrum katlarda **korunmuş koridordan veya yangın güvenlik holünden** ulaşılması gerekir; asansör kapılarının doğrudan kullanım alanına açılması uygun değildir. Bu bağlantı, bodrum otoparkı veya depo dumanının asansör kuyusuna taşınmasını sınırlayan pasif koruma zinciridir.",
        "",
        "Bodrumda yangın kapısı veya hol çizmek tek başına yeterli değildir; basınçlandırma, duman tahliyesi ve kaçış yönlendirmesi aynı senaryoda çalışmalıdır."
      ),
      subsections: [],
    },
    {
      id: "otopark-madde60",
      title: "Madde 60 kapalı otoparkı açıklık oranı, sprinkler ve duman tahliyesi açısından ayrı sınıflandırır",
      content: phase5Lines(
        "BYKHY **Madde 60** kapsamında bir otoparkın açık kabul edilebilmesi için dışarıya olan toplam açık alanının döşeme alanının **%5'inden fazla** olması ve açıklıkların düzenine ilişkin ek koşulların sağlanması gerekir; aksi durumda kapalı otopark olarak değerlendirilir.",
        "",
        "Alanlarının toplamı **600 m²'den büyük** kapalı otoparklarda otomatik yağmurlama, yangın dolabı ve itfaiye su alma ağızları gerekir. Toplam alanı **2.000 m²'yi aşan** kapalı otoparklarda ise binanın diğer bölümlerinden bağımsız mekanik duman tahliye sistemi ve saatte en az **10 hava değişimi** gerekir.",
        "",
        "Araçların asansörle alındığı kapalı otoparklarda doğal veya mekanik havalandırma ayrıca zorunludur. Alan hesabında aynı ruhsata esas otopark bölümlerini yapay biçimde parçalayarak eşik altına düşürmek doğru değildir."
      ),
      subsections: [],
    },
    {
      id: "otopark-madde88-aydinlatma",
      title: "Kapalı otoparkın duman sistemi, acil aydınlatma ve alarm senaryosundan bağımsız tasarlanamaz",
      content: phase5Lines(
        "BYKHY **Madde 88**, toplam alanı 2.000 m²'yi aşan kapalı otopark alanlarında mekanik duman tahliyesinin bağımsız olmasını ve en az 10 hava değişimi sağlamasını ister. Yangın alarmından gelen senaryo; fan, damper, giriş havası ve gerektiğinde diğer HVAC sistemlerinin çalışma durumlarını açıkça tarif etmelidir.",
        "",
        "Bakanlık kılavuzu kapalı otoparkları acil durum aydınlatmasının zorunlu olduğu alanlar arasında da sayar. Normal enerji kesildiğinde kaçış güzergâhı, yangın dolabı/uyarı elemanları ve yönlendirme görünür kalmalıdır.",
        "",
        "Otopark tavanındaki kirişler, tesisat tavaları ve jet-fan/kanal yerleşimi duman akışını ve sprinkler dağılımını etkileyebilir; mekanik sistem ile taşıyıcı/mimari geometri koordinasyonu sahaya bırakılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "mutfak-madde57",
      title: "Madde 57 profesyonel mutfakta davlumbaz söndürmesini ve gaz güvenliğini birlikte zorunlu kılar",
      content: phase5Lines(
        "BYKHY **Madde 57** kapsamında konutlar hariç olmak üzere alışveriş merkezlerindeki mutfaklarda, yüksek binalar içinde bulunan mutfaklarda, yemek fabrikalarında ve bir anda **100'den fazla kişiye** hizmet veren mutfaklarda davlumbaza **otomatik söndürme sistemi** yapılması gerekir.",
        "",
        "Aynı hüküm, ocakta kullanılan gazın özelliğine göre **gaz algılama, gaz kesme ve uyarı tesisatını** da sistemin parçası hâline getirir. Yangın söndürme tetiklendiği hâlde gaz akışı devam ediyorsa yangın yeniden büyüyebilir; bu nedenle söndürme, yakıt kesme ve alarm senaryosu birlikte test edilmelidir.",
        "",
        "Davlumbaz, filtre, pişirme cihazı, kanal, baca nozulu ve söndürücü tüpünün gerçek yerleşimi üretici sistem tasarımıyla eşleşmeli; nozulun sonradan dekoratif eleman veya ekipmanla kapatılmasına izin verilmemelidir."
      ),
      subsections: [],
    },
    {
      id: "mutfak-egzoz-madde88",
      title: "Mutfak egzoz kanalını normal havalandırma kanalı gibi kompartımanlardan geçirmeyin",
      content: phase5Lines(
        "BYKHY **Madde 88** kapsamındaki mutfak egzoz düzeninde, mutfak dışından geçen egzoz kanalının geçtiği bölümün veya mutfak bölümünün yapısal yangın dayanım süresi kadar korunması gerekir. Kanal bir şaft içerisinden geçiyorsa diğer servislerden ayrılması önemlidir.",
        "",
        "Mutfak egzoz kanalına **yangın damperi konulmaz**; yağ birikimi olan kanalın temizlenebilirliği ve servis erişimi proje başında çözülmelidir. Hava alma ve egzoz noktaları da dumanın tekrar binaya çekilmesini önleyecek biçimde yerleştirilmelidir.",
        "",
        "Yanlış uygulama, normal HVAC detayını mutfak egzozuna kopyalamak veya davlumbaz otomatik söndürme sistemi bulunduğu için kanal yangın dayanımını ve temizlik erişimini ihmal etmektir."
      ),
      subsections: [],
    },
    {
      id: "teknik-sorumluluk",
      title: "Teknik sorumluluk üç mahali ayrı risk hesabıyla çözüp ortak yangın senaryosunda birleştirmektir",
      content: phase5Lines(
        "**Teknik sorumluluk**, bodrumun kaçış ve düşey duman yollarını, otoparkın alan/sprinkler/duman tahliye eşiklerini ve mutfağın davlumbaz-gaz-egzoz zincirini ayrı ayrı doğruladıktan sonra bunları binanın algılama, acil enerji ve tahliye senaryosuyla birleştirmektir.",
        "",
        "Yanlış uygulama; otopark alanını bölümlere ayırarak 600 m² veya 2.000 m² eşiklerini atlamak, mutfakta yalnız portatif tüp bırakmak veya bodrum asansörünü korunumlu hol olmadan kullanım alanına açmaktır.",
        "",
        "Saha kabulünde fan debisi/hava değişimi, sprinkler ve yangın dolabı kapsamı, davlumbaz söndürme tetiklemesi, gaz kesme ve kapı/hol sürekliliği ayrı tutanaklarda değil aynı yangın senaryosu matrisiyle ilişkilendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Bodrum merdiveni/asansörü ile üst katlar arasındaki duman ve yangın ayrımını doğruladım.",
        "- [ ] Otoparkın açık/kapalı sınıfını **%5 açıklık** kriteri ve gerçek cephe geometrisiyle kontrol ettim.",
        "- [ ] Kapalı otopark toplamı **600 m²** üzerindeyse sprinkler/yangın dolabı/itfaiye bağlantılarını kontrol ettim.",
        "- [ ] Kapalı otopark toplamı **2.000 m²** üzerindeyse bağımsız mekanik duman tahliyesi ve **10 hava değişimi** şartını doğruladım.",
        "- [ ] Kapalı otoparkta acil durum aydınlatması ve yangın otomasyonu senaryosunu test ettim.",
        "- [ ] **Madde 57** kapsamındaki mutfakta davlumbaz otomatik söndürme ile gaz algılama/kesme/uyarı tesisatını birlikte kontrol ettim.",
        "- [ ] Mutfak egzoz kanalının yangın dayanımı, şaft ayrımı ve damper yasağını **Madde 88** üzerinden doğruladım.",
        "- [ ] Bodrum, otopark ve mutfak sistemlerini tek cause-effect ve saha kabul zincirinde ilişkilendirdim."
      ),
      subsections: [],
    },
  ],
  references: firePhase5References("Madde 57, Madde 60, Madde 88 ve bodrum/otopark/mutfak özel hükümleri"),
  keywords: ["bodrum", "otopark", "mutfak", "Madde 57", "Madde 60", "Madde 88", "600 m²", "2.000 m²", "davlumbaz"],
  tags: ["yangın", "otopark", "mutfak", "bodrum", "duman kontrolü"],
};

export const DEPREM_PHASE5_BATCH_3_ARTICLES = [
  DEPREM_PHASE5_FIRE_ROUTE_COMPARTMENT,
  DEPREM_PHASE5_FIRE_HIGH_RISE,
  DEPREM_PHASE5_FIRE_SPECIAL_AREAS,
] as const;
