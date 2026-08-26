import { phase5Lines, PHASE5_UPDATED_AT, type DepremPhase5Override } from "./deprem-phase5-shared";

const LAW_6331 = "https://www.csgb.gov.tr/Media/fldk2co0/6331_isgkanunu_tr.pdf";
const ISG_FAQ = "https://www.csgb.gov.tr/tr/sikca-sorulan-sorular/is-sagligi-ve-guvenligi-genel-mudurlugu/";
const PLAN_PAGE = "https://guvenliinsaat.csgb.gov.tr/isg-konulari/saglik-ve-guvenlik-plani/";
const PLAN_GUIDE = "https://guvenliinsaat.csgb.gov.tr/media/ky2jdtc0/yapi_i%C5%9Flerindesaglik.pdf";
const HEIGHT_PAGE = "https://guvenliinsaat.csgb.gov.tr/isg-konulari/yuksekte-calisma";
const SCAFFOLD_2026 = "https://guvenliinsaat.csgb.gov.tr/haberler/cephe-iskelelerinde-tip-proje-kullanimi-ve-statik-hesap-gerekliligi/";
const EXCAVATION_PAGE = "https://guvenliinsaat.csgb.gov.tr/isg-konulari/kazi-isleri";
const ELECTRIC_PAGE = "https://guvenliinsaat.csgb.gov.tr/isg-konulari/elektrik-isleri/";
const EQUIPMENT_PAGE = "https://guvenliinsaat.csgb.gov.tr/isg-konulari/is-ekipmanlari/";
const CONSTRUCTION_GUIDE = "https://www.csgb.gov.tr/Media/trmjogsz/in%C5%9Faat-sekt%C3%B6r%C3%BC-isg-rehberi.pdf";

export const DEPREM_PHASE5_ISG_PLAN: DepremPhase5Override = {
  slug: "isg-santiye-guvenlik-plani-zorunlu-icerik",
  title: "Şantiye Sağlık ve Güvenlik Planı: Zorunlu İçerik ve Uygulama",
  description: "Yapı işlerinde sağlık ve güvenlik planını salt dosya teslimi değil, proje hazırlık safhasından şantiye kapanışına kadar güncellenen yönetim ve koordinasyon sistemi olarak açıklar; altı ana başlığı, bildirim/koordinasyon ayrımını ve saha kontrol zincirini gösterir.",
  seoTitle: "Şantiye Sağlık ve Güvenlik Planı | Zorunlu İçerik ve Kontrol",
  seoDescription: "Yapı işlerinde sağlık ve güvenlik planının 6 ana başlığı, proje hazırlık safhası, risk değerlendirmesi ilişkisi, koordinasyon, bildirim ve saha güncelleme kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "15 dk",
  relatedSlugs: ["isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi", "isg-yuksekte-calisma-ve-iskele-guvenligi", "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol"],
  sections: [
    {
      id: "plan-zorunlulugu",
      title: "Sağlık ve güvenlik planı bütün yapı işlerinde proje hazırlık safhasında kurulmalıdır",
      content: phase5Lines(
        "ÇSGB'nin güncel Güvenli İnşaat kaynağı, **sağlık ve güvenlik planını** yapı işinin çalışma yöntemlerini, organizasyonunu, koordinasyonunu ve tedbirlerini bir araya getiren temel doküman olarak ele alır. Plan, yalnız büyük şantiyelerde hazırlanan bir formalite değildir; yapı işinin proje hazırlık safhasında kurulup uygulama boyunca güncellenmesi gereken canlı bir yönetim aracıdır.",
        "",
        "Plan ile risk değerlendirmesi aynı belge değildir. Risk değerlendirmesi tehlike-risk-kontrol ilişkisini sistematik olarak inceler; sağlık ve güvenlik planı ise bu risklerin proje organizasyonu, iş sıralaması, alt işveren koordinasyonu, saha kuralları ve acil durum yönetimi içinde **nasıl uygulanacağını** tarif eder.",
        "",
        "Yanlış uygulama, ruhsat veya işe başlama dosyasına genel bir şablon koyup iş programı, ekipman, alt işveren veya yöntem değiştiğinde planı değiştirmemektir."
      ),
      subsections: [],
    },
    {
      id: "alti-ana-baslik",
      title: "ÇSGB rehberindeki 6 ana başlık planın asgari omurgasını oluşturur",
      content: phase5Lines(
        "Bakanlığın güncel rehberinde plan aşağıdaki **6 ana başlık** üzerine kuruludur. Başlıkların yalnız adını yazmak yeterli değildir; her biri proje verisi, sorumlu kişi, kontrol yöntemi ve kayıtla doldurulmalıdır.",
        "",
        "| No | Ana başlık | Şantiyede beklenen karşılığı |",
        "|---:|---|---|",
        "| 1 | Yönetimin Taahhüdü | Politika, hedef, kaynak ve takip sorumluluğu |",
        "| 2 | Proje Bilgileri | İşin kapsamı, taraflar, takvim ve saha özellikleri |",
        "| 3 | Sağlık ve Güvenlik Organizasyonu | İşveren, alt işveren, uzman, hekim, koordinatör ve temsilci ilişkileri |",
        "| 4 | İşlerin Yönetimi | İş sırası, yöntem, ekipman, erişim ve lojistik |",
        "| 5 | Risklerin ve Kontrol Tedbirlerinin Belirlenmesi | İş paketine özgü risk ve kontrol hiyerarşisi |",
        "| 6 | Şantiye Kuralları | Giriş, trafik, KKD, izinler, acil durum ve disiplin |"
      ),
      subsections: [],
    },
    {
      id: "bildirim-koordinasyon-ayrimi",
      title: "Plan zorunluluğunu ön bildirim ve sağlık-güvenlik koordinatörü şartlarıyla karıştırmayın",
      content: phase5Lines(
        "Sağlık ve güvenlik planının hazırlanması ile **ön bildirim** ve **sağlık ve güvenlik koordinatörü** görevlendirme koşulları farklı kontrol başlıklarıdır. Bakanlık rehberi, işin süresi/çalışan yoğunluğu ve toplam yevmiye gibi eşiklere bağlı ön bildirim şartlarını ayrıca ele alır; planın varlığı bu eşiklere bağlanmaz.",
        "",
        "Rehberde ön bildirim için kullanılan kontrol, işin **30 iş gününden fazla sürmesi ve aynı anda 20'den fazla çalışan bulunması** veya toplam iş büyüklüğünün **500 yevmiyeyi aşması** eksenindedir. Uygulanacak güncel hüküm proje başlangıç tarihinde yürürlükteki yönetmelik metninden doğrulanmalıdır.",
        "",
        "Birden fazla işveren veya alt işverenin aynı yapı alanında çalışması, arayüz risklerini büyüttüğü için koordinasyon görevlerini ayrıca tetikleyebilir. Sorumluluğu yalnız İSG uzmanına bırakmak, işveren ve proje sorumlusunun mevzuat yükümlülüklerini ortadan kaldırmaz."
      ),
      subsections: [],
    },
    {
      id: "is-programi-ile-entegrasyon",
      title: "Planı iş programına bağlayın: risk kontrolü işe başlamadan önce hazır olmalıdır",
      content: phase5Lines(
        "İş programındaki her kritik imalat için 'hangi risk, hangi toplu koruma, hangi ekipman, hangi sorumlu, hangi kontrol kaydı?' soruları cevaplanmalıdır. Kazı, kalıp, iskele, kaldırma, beton dökümü, geçici elektrik ve çatı işleri plana yalnız başlık olarak değil, **başlama ön koşulu** olarak bağlanmalıdır.",
        "",
        "Örneğin iskele kurulumu başlamadan ankraj ve hesap uygunluğu; kazıdan önce yeraltı hatları ve iksa/şev kararı; beton dökümünden önce geçici elektrik ve pompa güzergâhı doğrulanmalıdır. İş programı öne çekildiğinde güvenlik tedbirinin geriden gelmesine izin verilmemelidir.",
        "",
        "Saha toplantısında plan revizyon numarası ile güncel iş programı aynı tarihe bağlanırsa eski dokümanın kullanım riski azalır."
      ),
      subsections: [],
    },
    {
      id: "revizyon-kayit",
      title: "Alt işveren, yöntem veya saha koşulu değiştiğinde plan revizyonu izlenebilir olmalıdır",
      content: phase5Lines(
        "Sağlık ve güvenlik planı tek seferlik imzalanıp arşivlenen bir belge değildir. Yeni alt işveren, yeni ekipman, çalışma alanı değişikliği, tasarım revizyonu, kaza/ramak kala, hava koşulu veya iş sırası değişikliği risk profilini etkiliyorsa plan da gözden geçirilmelidir.",
        "",
        "Her revizyonda değişiklik nedeni, etkilenen iş paketi, yeni kontrol tedbiri, sorumlu kişi ve sahaya duyuru/eğitim kaydı tutulmalıdır. Böylece bir uygunsuzlukta 'hangi kurala göre çalışılıyordu?' sorusu cevaplanabilir.",
        "",
        "Teknik sorumluluk, belgeyi kalınlaştırmak değil, sahadaki güncel yöntemin plandaki yönteme eşleşmesini sağlamaktır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Sağlık ve güvenlik planını işe başlamadan önce proje hazırlık safhasında oluşturdum.",
        "- [ ] Bakanlık rehberindeki **6 ana başlığın** her birini proje verileriyle doldurdum.",
        "- [ ] Plan, risk değerlendirmesi ve iş programının birbirini desteklediğini kontrol ettim.",
        "- [ ] Ön bildirim için **30 iş günü / 20 çalışan / 500 yevmiye** kontrollerini ayrı yaptım.",
        "- [ ] İşveren, alt işveren, uzman, hekim ve gerekiyorsa sağlık ve güvenlik koordinatörü sorumluluklarını yazılı tanımladım.",
        "- [ ] Kazı, iskele, kaldırma, beton ve geçici elektrik işlerini başlama ön koşullarına bağladım.",
        "- [ ] Değişen yöntem/ekipman/alt işveren sonrasında plan revizyonunu kayıt altına aldım.",
        "- [ ] Saha ekibinin güncel revizyona eriştiğini ve kritik değişiklikler için bilgilendirildiğini doğruladım."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "ÇSGB Güvenli İnşaat — Sağlık ve Güvenlik Planı", href: PLAN_PAGE },
    { label: "ÇSGB — Yapı İşlerinde Sağlık ve Güvenlik Planı Rehberi", href: PLAN_GUIDE },
    { label: "ÇSGB — 6331 sayılı İş Sağlığı ve Güvenliği Kanunu", href: LAW_6331 },
  ],
  keywords: ["sağlık ve güvenlik planı", "şantiye", "6 ana başlık", "ön bildirim", "500 yevmiye", "koordinatör"],
  tags: ["İSG", "şantiye", "sağlık ve güvenlik planı", "6331"],
};

export const DEPREM_PHASE5_ISG_EXPERT: DepremPhase5Override = {
  slug: "isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi",
  title: "İş Güvenliği Uzmanı Görevlendirme: Tehlike Sınıfı, Çalışan Sayısı ve Süre",
  description: "İş güvenliği uzmanı görevlendirmesini yalnız çalışan sayısı eşiği olarak değil; 6331 kapsamı, doğru NACE tehlike sınıfı, çalışan başına aylık süre, tam süreli uzman eşiği, iç kaynak/OSGB ve İSG organizasyonu üzerinden açıklar.",
  seoTitle: "İş Güvenliği Uzmanı Görevlendirme | 10-20-40 Dakika ve Tam Süre Eşikleri",
  seoDescription: "Az tehlikeli, tehlikeli ve çok tehlikeli işyerlerinde iş güvenliği uzmanı süreleri; çalışan başına 10/20/40 dakika, 1000/500/250 çalışan tam süre eşikleri ve NACE kontrolü.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "15 dk",
  relatedSlugs: ["isg-santiye-guvenlik-plani-zorunlu-icerik", "isg-yuksekte-calisma-ve-iskele-guvenligi", "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi"],
  sections: [
    {
      id: "6331-gorevlendirme",
      title: "Görevlendirme kararı 6331 kapsamı, tehlike sınıfı ve çalışan sayısıyla birlikte verilir",
      content: phase5Lines(
        "6331 sayılı Kanun işverene iş sağlığı ve güvenliği hizmetlerini organize etme yükümlülüğü verir. İşyerinde gerekli niteliğe sahip personel bulunmuyorsa hizmetin tamamı veya bir kısmı yetkili **OSGB** üzerinden alınabilir; hizmet satın alınması işverenin sorumluluğunu ortadan kaldırmaz.",
        "",
        "Şantiyede 'kaç kişi olunca uzman gerekir?' sorusu tek başına yeterli değildir. Önce işyerinin 6 haneli **NACE** kodu ve buna bağlı tehlike sınıfı doğrulanmalı, sonra çalışan sayısı ve ilgili yönetmelikteki hizmet süresi uygulanmalıdır.",
        "",
        "İnşaat faaliyetlerinde tehlike sınıfını işin gündelik tanımından tahmin etmek yerine güncel İş Sağlığı ve Güvenliğine İlişkin İşyeri Tehlike Sınıfları Tebliği üzerinden gerçek NACE koduyla kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "dakika-hesabi",
      title: "Güncel hizmet süresi çalışan başına ayda 10, 20 veya 40 dakikadır",
      content: phase5Lines(
        "ÇSGB'nin güncel Sıkça Sorulan Sorular sayfası, iş güvenliği uzmanı hizmet süresinin çalışan sayısı ve tehlike sınıfına göre belirlendiğini; çalışan başına aylık sürelerin **10 dakika, 20 dakika ve 40 dakika** olduğunu açıkça belirtir.",
        "",
        "| Tehlike sınıfı | Uzman süresi | Örnek: 30 çalışan |",
        "|---|---:|---:|",
        "| Az tehlikeli | 10 dk/çalışan-ay | 300 dk/ay |",
        "| Tehlikeli | 20 dk/çalışan-ay | 600 dk/ay |",
        "| Çok tehlikeli | 40 dk/çalışan-ay | 1.200 dk/ay |",
        "",
        "Örnek yalnız süre hesabını gösterir. İşyerinin tehlike sınıfı, çalışan sayımı, vardiya yapısı ve görevlendirme şekli güncel mevzuat üzerinden ayrıca doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "tam-sure-esikleri",
      title: "Tam süreli uzman gereği 1000, 500 ve 250 çalışan eşikleriyle ilişkilidir",
      content: phase5Lines(
        "İlgili uzman yönetmeliğindeki tam süreli görevlendirme kurgusunda eşikler tehlike sınıfına göre azalır: az tehlikeli işyerlerinde **1000**, tehlikeli işyerlerinde **500**, çok tehlikeli işyerlerinde **250 çalışan** seviyesinde tam süreli uzman organizasyonu gündeme gelir.",
        "",
        "Çalışan sayısı eşik altında olsa bile aylık hizmet süresi ortadan kalkmaz. Bir şantiyede iş programı büyürken çalışan sayısının periyodik takip edilmemesi, gerekli uzman süresinin fiilen eksik kalmasına yol açabilir.",
        "",
        "Alt işverenlerin kendi işyeri sicilleri ve görevlendirmeleri ayrıca değerlendirilmelidir; ana işveren-alt işveren koordinasyonu, herkesin sorumluluğunu tek bir uzmana devretmek anlamına gelmez."
      ),
      subsections: [],
    },
    {
      id: "calisan-sayimi",
      title: "Çalışan sayısını bordro görüntüsünden değil görevlendirme hesabına esas kayıtlarla izleyin",
      content: phase5Lines(
        "Görevlendirme süresini hesaplarken hangi kişilerin mevzuata göre çalışan sayısına dâhil olduğu, işe giriş-çıkış tarihleri ve işyeri sicili dikkate alınmalıdır. ÇSGB açıklamalarında bazı çırak ve stajyerlerin görevlendirme sürelerinin hesabında özel hükümler bulunduğu da hatırlatılır.",
        "",
        "Aylık kontrol tablosunda en az işyeri sicili, NACE kodu, tehlike sınıfı, çalışan sayısı, uzman sınıfı, hesaplanan dakika ve fiili görevlendirme süresi yer almalıdır.",
        "",
        "Yanlış uygulama, şantiyenin yoğunlaştığı aylarda çalışan sayısı arttığı hâlde İSG-KATİP/görevlendirme sürelerini eski sayı üzerinden sürdürmektir."
      ),
      subsections: [],
    },
    {
      id: "uzman-rolu",
      title: "Uzmanın görevlendirilmesi işverenin riskleri yönetme sorumluluğunu devretmez",
      content: phase5Lines(
        "İş güvenliği uzmanı risk değerlendirmesi, saha gözetimi, eğitim, çalışma yöntemleri ve mevzuata uygun tedbirlerin geliştirilmesinde profesyonel görev üstlenir. Ancak ekipman temini, organizasyon, kaynak, uygunsuzluğun giderilmesi ve güvenli çalışmanın sağlanması işveren yükümlülüğünün parçasıdır.",
        "",
        "Uzmanın yazılı bildirimlerinin kayıt altına alınması ve işveren tarafından aksiyona dönüştürülmesi gerekir. Sadece sözleşme varlığı veya aylık dakika hesabının dolması güvenli şantiye anlamına gelmez.",
        "",
        "Teknik sorumluluk, görevlendirme hesabını sahadaki gerçek risk yoğunluğu ve iş programıyla birlikte izlemektir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] İşyerinin gerçek **NACE** kodunu ve güncel tehlike sınıfını doğruladım.",
        "- [ ] 6331 kapsamındaki iş güvenliği uzmanı görevlendirme yükümlülüğünü kontrol ettim.",
        "- [ ] Aylık süreyi az/tehlikeli/çok tehlikeli için **10 / 20 / 40 dakika** üzerinden hesapladım.",
        "- [ ] Tam süreli uzman için **1000 / 500 / 250 çalışan** eşiklerini kontrol ettim.",
        "- [ ] Çalışan sayısındaki aylık değişimi görevlendirme süresine yansıttım.",
        "- [ ] İç kaynak veya **OSGB** görevlendirmesinin geçerli ve güncel olduğunu doğruladım.",
        "- [ ] Alt işverenlerin kendi İSG organizasyonu ile ana şantiye koordinasyonunu eşleştirdim.",
        "- [ ] Uzman bildirimlerinin işveren aksiyonları ve kapanış kayıtlarıyla izlenebilir olduğunu kontrol ettim."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "ÇSGB — İş Sağlığı ve Güvenliği Genel Müdürlüğü Sıkça Sorulan Sorular", href: ISG_FAQ },
    { label: "ÇSGB — 6331 sayılı İş Sağlığı ve Güvenliği Kanunu", href: LAW_6331 },
    { label: "ÇSGB — İnşaat Sektörü İş Sağlığı ve Güvenliği Rehberi", href: CONSTRUCTION_GUIDE },
  ],
  keywords: ["iş güvenliği uzmanı", "10 dakika", "20 dakika", "40 dakika", "NACE", "OSGB", "250 çalışan"],
  tags: ["İSG", "iş güvenliği uzmanı", "6331", "NACE"],
};

export const DEPREM_PHASE5_ISG_HEIGHT: DepremPhase5Override = {
  slug: "isg-yuksekte-calisma-ve-iskele-guvenligi",
  title: "Yüksekte Çalışma ve İskele Güvenliği: Düşmeyi Önleme ve Statik Uygunluk",
  description: "Yüksekte çalışmayı metre eşiğiyle değil düşme riskiyle tanımlar; toplu koruma önceliği, korkuluk geometrisi, iskele hesap uygunluğu, 2026 tip proje açıklaması, ankraj-rüzgâr-yük sapmaları ve saha kontrolünü birlikte ele alır.",
  seoTitle: "Yüksekte Çalışma ve İskele Güvenliği | Korkuluk ve Statik Hesap Kontrolü",
  seoDescription: "Yüksekte çalışma tanımı, toplu korunma önceliği, 1 m korkuluk, 125 kg yük, 15 cm topuk levhası, 47 cm açıklık, TS EN 12810-1 ve 25,5 m iskele hesabı.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "16 dk",
  relatedSlugs: ["isg-santiye-guvenlik-plani-zorunlu-icerik", "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol", "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi"],
  sections: [
    {
      id: "tanimin-dogru-okunmasi",
      title: "Yüksekte çalışma için sabit bir metre eşiği aramayın; düşme sonucu yaralanma ihtimali yeterlidir",
      content: phase5Lines(
        "Güncel ÇSGB kaynağı yüksekte çalışmayı, **seviye farkı bulunan ve düşme sonucu yaralanma ihtimalinin söz konusu olduğu her türlü alanda yapılan çalışma** olarak tanımlar. Dolayısıyla '2 metrenin altı yüksekte çalışma değildir' gibi genel bir kabul mevzuat tanımının yerine kullanılamaz.",
        "",
        "Döşeme kenarı, merdiven boşluğu, kalıp üstü, çatı, iskele, platform ve geçici erişim yolları ayrı ayrı değerlendirilmelidir. Düşme yüksekliği küçük olsa bile altta donatı filizi, makine, sivri malzeme veya başka seviye bulunması sonucu ağırlaştırabilir.",
        "",
        "İlk tasarım kararı mümkünse işi zeminde yaparak yüksekte çalışmayı ortadan kaldırmaktır. Ardından **toplu korunma**; kişisel düşüş durdurma sistemlerinden önce düşünülmelidir."
      ),
      subsections: [],
    },
    {
      id: "korkuluk-kriterleri",
      title: "Korkulukta geometrik süreklilik ve dayanım birlikte doğrulanmalıdır",
      content: phase5Lines(
        "Bakanlığın güncel inşaat güvenliği içeriklerinde korkuluk sisteminin ana elemanları ve asgari performans değerleri açıkça verilir. Korkuluk yalnız üst borudan ibaret değildir; topuk levhası ve ara elemanlarla düşme ve cisim düşmesi birlikte kontrol edilir.",
        "",
        "| Kontrol | Asgari / azami değer |",
        "|---|---:|",
        "| Ana korkuluk yüksekliği | en az **1 metre** |",
        "| Sistemin dayanması gereken yük | en az **125 kilogram** |",
        "| Topuk levhası yüksekliği | en az **15 santimetre** |",
        "| Ara açıklık | en fazla **47 santimetre** |",
        "",
        "Sahada boru aralıkları, bağlantı noktaları ve taban sabitlemesi gerçek kurulum üzerinde kontrol edilmelidir. Doğru ölçüde fakat gevşek bağlanmış korkuluk güvenli değildir."
      ),
      subsections: [],
    },
    {
      id: "iskele-hesabi-2026",
      title: "2026 Bakanlık açıklaması: asıl soru statik hesabın kurulum biçimine uygun olup olmadığıdır",
      content: phase5Lines(
        "ÇSGB'nin **11 Mart 2026** tarihli cephe iskelesi açıklaması, hesap zorunluluğunun bulunduğunu ve hesabın gerçek kurulum şekline uygun olması gerektiğini vurgular. TS EN **12810-1** kapsamında belgeli bir sistemin varlığı, her saha koşulunda hesap yapılmadan kullanılabileceği anlamına gelmez.",
        "",
        "Bakanlık açıklamasında, üretici tip konfigürasyonuna birebir uyan ve standartta öngörülen **25,5 metre** kurulum yüksekliğindeki sistemlerde üreticinin hesapları proje müellifinin uygun görüşüyle kullanılabilir. Ancak ankraj, rüzgâr etkisi, cephe geometrisi, yükleme veya konfigürasyonda sapma varsa **projeye özgü mühendislik hesabı** gerekir.",
        "",
        "Bu nedenle şantiyede TSE belgesi görmekle yetinmeyin; kurulan iskelenin o belge ve hesabın geometrisiyle aynı olup olmadığını kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "ankraj-kurulum-kontrol",
      title: "İskele güvenliğinde ankraj, taban, erişim ve yük sınıfı aynı kontrol kaydında olmalıdır",
      content: phase5Lines(
        "İskele taban plakaları ve ayar milleri taşıyıcı ve düzgün zemine oturmalı, ankrajlar projedeki düzene uygun yerleştirilmeli, çalışma platformları boşluksuz ve güvenli erişimli olmalıdır. Malzeme istifi hesabın yük sınıfını aşmamalıdır.",
        "",
        "Cephe açıklıkları, konsol çıkmaları, kaplama filesi/branda ve yapı geometrisi rüzgâr yükünü veya ankraj davranışını değiştirebilir. Bu değişiklikler 'sahada halledilir' notuyla geçiştirilemez.",
        "",
        "Kurulum, önemli değişiklik, olumsuz hava veya çarpma sonrası uygun kontrol yetkin kişilerce tekrar yapılmalı; uygunsuz bölüm kullanıma açılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "dusme-durdurma",
      title: "Kişisel düşüş durdurma sistemi toplu korumanın yerine otomatik olarak geçmez",
      content: phase5Lines(
        "Korkuluk, platform veya güvenlik ağı gibi toplu tedbirlerin uygulanamadığı ya da riski tamamen gideremediği durumlarda yaşam hattı, bağlantı noktası ve tam vücut kemeri gibi kişisel sistemler devreye girer. Sistemin yalnız ekipman sertifikası değil, ankraj kapasitesi, düşüş mesafesi ve kurtarma planı da çözülmelidir.",
        "",
        "Çalışana kemer verip bağlanacağı güvenli noktayı tanımlamamak yanlış uygulamadır. Düşüş durdurulsa bile askıda kalan çalışanın güvenli sürede kurtarılması için senaryo gerekir.",
        "",
        "Teknik sorumluluk, düşmeyi önce önleyen; önlenemeyen durumda durduran ve sonrasında kurtarmayı mümkün kılan bütün zinciri kurmaktır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Yüksekte çalışmayı metre ezberiyle değil **seviye farkı + yaralanma ihtimali** tanımıyla belirledim.",
        "- [ ] Önce işi zemine alma ve **toplu korunma** seçeneklerini değerlendirdim.",
        "- [ ] Korkulukta **1 m / 125 kg / 15 cm / 47 cm** kriterlerini sahada kontrol ettim.",
        "- [ ] İskele sisteminin **TS EN 12810-1** belgesi ile gerçek kurulumunun aynı konfigürasyonda olduğunu doğruladım.",
        "- [ ] **25,5 m** tip konfigürasyon şartlarından sapma varsa projeye özgü statik hesap yaptırdım.",
        "- [ ] Ankraj, taban, platform, erişim, yük sınıfı ve rüzgâr etkisini birlikte kontrol ettim.",
        "- [ ] Kişisel düşüş durdurma kullanılıyorsa ankraj ve kurtarma planını tanımladım.",
        "- [ ] Kurulum/değişiklik/olumsuz olay sonrası kontrol kayıtlarını sakladım."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "ÇSGB Güvenli İnşaat — Yüksekte Çalışma", href: HEIGHT_PAGE },
    { label: "ÇSGB — Cephe İskelelerinde Tip Proje Kullanımı ve Statik Hesap Gerekliliği (11.03.2026)", href: SCAFFOLD_2026 },
    { label: "ÇSGB — İnşaat Sektörü İş Sağlığı ve Güvenliği Rehberi", href: CONSTRUCTION_GUIDE },
  ],
  keywords: ["yüksekte çalışma", "iskele", "1 metre", "125 kilogram", "TS EN 12810-1", "25,5 metre", "statik hesap"],
  tags: ["İSG", "yüksekte çalışma", "iskele", "düşme"],
};

export const DEPREM_PHASE5_ISG_EXCAVATION: DepremPhase5Override = {
  slug: "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol",
  title: "Kazı Güvenliği, İksa Tasarımı ve Saha Kontrolü",
  description: "Kazı güvenliğini tek bir derinlik eşiğine indirgemeden; zemin-su-titreşim-sürşarj-komşu yapı ve yeraltı hizmetlerini birlikte değerlendirir, şev/iksa kararını statik hesap ve saha izleme zincirine bağlar.",
  seoTitle: "Kazı Güvenliği ve İksa Tasarımı | Şev, Statik Hesap ve Saha Kontrolü",
  seoDescription: "Kazıda göçük riskini belirleyen zemin, su, titreşim, fazla yük ve komşu yapı etkileri; uygun şev veya statik hesabı yapılmış iksa, yeraltı hatları ve yağış sonrası kontrol.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "16 dk",
  relatedSlugs: ["isg-santiye-guvenlik-plani-zorunlu-icerik", "isg-yuksekte-calisma-ve-iskele-guvenligi", "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi"],
  sections: [
    {
      id: "derinlik-ezberi-yok",
      title: "Kazı güvenliğini tek bir derinlik sayısıyla çözmeyin; göçük mekanizmasını saha koşulları belirler",
      content: phase5Lines(
        "ÇSGB'nin güncel kazı güvenliği kaynağı, göçük riskinin yalnız kazı derinliğine bağlı olmadığını açıkça gösterir. **Zemin türü, nem/su, titreşim, ağır yükler, yakındaki yapılar, önceki kazılar, hava koşulları ve kazının açık kaldığı süre** stabiliteyi değiştirebilir.",
        "",
        "Bu nedenle 'şu derinliğe kadar iksa gerekmez' biçiminde bağlamdan kopuk bir saha kuralı kullanılmamalıdır. Aynı derinlikte iki kazıdan biri kendini taşıyan kayada, diğeri suya doygun gevşek dolguda olabilir ve riskleri tamamen farklıdır.",
        "",
        "Kazı planı başlamadan önce geoteknik veri, çevre yapılar, yeraltı hatları, ekipman güzergâhı ve hafriyat depolama alanı tek plan üzerinde değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "sev-ve-iksa-karari",
      title: "Yönetmelik yaklaşımı uygun şev ve/veya statik hesabı yapılmış destek sistemidir",
      content: phase5Lines(
        "Bakanlık kaynağı, kazılarda zemin yapısı, iklim, sarsıntı, su ve fazla yük kuvvetleri göz önüne alınarak uygun şev açılarının belirlenmesini ve/veya **statik hesabı yapılmış uygun destek ve setlerin** kullanılmasını vurgular.",
        "",
        "| Girdi | Şev/iksa kararına etkisi | Saha kontrolü |",
        "|---|---|---|",
        "| Zemin ve tabakalanma | Kayma yüzeyi ve deformasyon | Kazı yüzü gözlemi + geoteknik veri |",
        "| Yeraltı/yüzey suyu | Dayanım kaybı, taban kabarması, erozyon | Drenaj ve su seviyesi |",
        "| Sürşarj / hafriyat / araç | Kenar gerilmesini artırır | Kenar mesafesi ve trafik bariyeri |",
        "| Titreşim | Gevşemeyi ve deformasyonu büyütebilir | Ekipman/komşu faaliyet takibi |",
        "| Komşu yapı | Oturma/deplasman hassasiyeti | Ölçüm ve deformasyon izleme |",
        "",
        "İksa hesabındaki yükleme ve saha kullanım biçimi aynı olmalıdır; projede olmayan hafriyat yığını veya vinç ayağı kazı kenarına konulmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "yeraltı-hizmetleri",
      title: "Kazıya başlamadan yeraltı ve üstten geçen hizmetler doğrulanmalıdır",
      content: phase5Lines(
        "Elektrik, doğalgaz, su, kanalizasyon, haberleşme ve diğer hatlar kazıdan önce yetkili kurum bilgileri ve uygun tespit yöntemleriyle belirlenmelidir. Çizimdeki güzergâh sahadaki gerçek konumun tek kanıtı kabul edilmemelidir.",
        "",
        "Yeraltı elektrik veya gaz hattına temas yalnız çalışanı değil çevreyi de etkileyebilir. Su hattı hasarı ise kazıyı hızla doldurarak hem boğulma hem de zemin dayanım kaybı/göçük riski oluşturabilir.",
        "",
        "Hat yakınında mekanik kazı sınırı, elle kontrollü açma, işaretleme ve acil durum prosedürü işe başlamadan tanımlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "giris-cikis-ve-kenar",
      title: "Kazı içine güvenli erişim, kenar koruması ve araç ayrımı ayrı kontrol başlıklarıdır",
      content: phase5Lines(
        "Kazıya güvenli giriş-çıkış olmadan çalışanı hendeğe indirmek kabul edilemez. Merdiven veya erişim sistemi kaymaya karşı sabitlenmeli; kazı kenarında çalışan ve üçüncü kişilerin düşmesi önlenmeli; araçlar bariyer, uyarı ve gerektiğinde takozlarla güvenli bölgede tutulmalıdır.",
        "",
        "Hafriyat, boru, ekipman ve kaldırılmış yüklerin kazıya yuvarlanması veya kenar sürşarjını artırması engellenmelidir. Kazı kenarının 'boş alan' olarak görülüp malzeme deposuna dönüştürülmesi yaygın yanlış uygulamadır.",
        "",
        "Çalışma alanı gece veya düşük görüş koşullarında da sınırları ve erişimi okunabilir olacak şekilde düzenlenmelidir."
      ),
      subsections: [],
    },
    {
      id: "su-yagis-izleme",
      title: "Su ve hava koşulları değiştiğinde önceki günün güvenli kabulü otomatik olarak geçerli değildir",
      content: phase5Lines(
        "Yağış, su sızıntısı, boru patlağı veya drenaj arızası kazı yüzünü kısa sürede zayıflatabilir. Bakanlık içeriği, yağış sonrası ve çalışanlar tekrar kazıya girmeden önce kazının uygun kişi tarafından kontrol edilmesini; gerektiğinde suyun uzman gözetiminde tahliye edilmesini vurgular.",
        "",
        "İksada ötelenme, çatlak, ankraj/bağlantı gevşemesi, tabanda kabarma veya komşu yapıda deformasyon belirtileri varsa iş durdurma kriteri önceden tanımlanmış olmalıdır.",
        "",
        "Teknik sorumluluk, tasarım hesabını saha gözlemi ve ölçümle doğrulamak; saha koşulu hesabın dışında kalıyorsa yeniden mühendislik değerlendirmesi istemektir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Zemin, su, titreşim, fazla yük ve komşu yapı koşullarını kazı öncesinde belirledim.",
        "- [ ] Kazıyı keyfî derinlik eşiğiyle değil gerçek göçük riskiyle sınıflandırdım.",
        "- [ ] Uygun **şev** veya **statik hesabı yapılmış iksa/destek** çözümünü doğruladım.",
        "- [ ] Hafriyat, araç ve ekipman sürşarjlarının tasarım hesabıyla uyumunu kontrol ettim.",
        "- [ ] **Yeraltı hizmetleri** ve üstten geçen enerji hatlarını kazıdan önce tespit ettim.",
        "- [ ] Kazıya güvenli giriş-çıkış, kenar koruması ve araç ayrımını sağladım.",
        "- [ ] Su tahliyesi ve yağış sonrası yeniden kontrol prosedürünü tanımladım.",
        "- [ ] Deformasyon veya beklenmeyen saha koşulu için iş durdurma/yeniden değerlendirme kriterini belirledim."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "ÇSGB Güvenli İnşaat — Kazı İşlerinde Tehlike ve Riskler", href: EXCAVATION_PAGE },
    { label: "ÇSGB — Yapı İşlerinde Sağlık ve Güvenlik Planı Rehberi", href: PLAN_GUIDE },
    { label: "ÇSGB — 6331 sayılı İş Sağlığı ve Güvenliği Kanunu", href: LAW_6331 },
  ],
  keywords: ["kazı güvenliği", "iksa", "statik hesap", "şev", "yeraltı hizmetleri", "sürşarj", "göçük"],
  tags: ["İSG", "kazı", "iksa", "geoteknik"],
};

export const DEPREM_PHASE5_ISG_ELECTRIC: DepremPhase5Override = {
  slug: "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi",
  title: "Beton Dökümünde Geçici Elektrik, Topraklama ve Güvenli Çalışma",
  description: "Beton dökümünü ıslak ortam, vibratör/pompa, geçici pano ve kablo, kaçak akım, topraklama, enerji izolasyonu ve havai hat etkileşimi üzerinden ele alır; 300 mA/30 mA koruma ve döküm öncesi saha kontrolünü açıklar.",
  seoTitle: "Beton Dökümünde Elektrik Güvenliği | 300 mA, 30 mA ve Topraklama",
  seoDescription: "Beton dökümünde geçici elektrik tesisatı, topraklama, ana panoda 300 mA ve tali panoda 30 mA kaçak akım koruması, LOTO, vibratör ve beton pompası kontrolleri.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "15 dk",
  relatedSlugs: ["isg-santiye-guvenlik-plani-zorunlu-icerik", "isg-yuksekte-calisma-ve-iskele-guvenligi", "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol"],
  sections: [
    {
      id: "islak-ortam-riski",
      title: "Beton dökümü geçici elektrik açısından yüksek dikkat gerektiren ıslak ve hareketli bir çalışma ortamıdır",
      content: phase5Lines(
        "Taze beton, yıkama suyu, yağış, ıslak zemin, metal kalıp/donatı, uzatma kabloları, vibratörler ve pompalar aynı alanda bulunduğunda elektrik çarpması riski büyür. ÇSGB elektrik güvenliği kaynağı özellikle **nemli ortamları**, hasarlı taşınabilir ekipmanları ve korumasız kabloları riskli durumlar arasında sayar.",
        "",
        "Döküm başlamadan geçici pano, priz, fiş, kablo, vibratör, aydınlatma ve pompa beslemeleri kontrol edilmelidir. Yalıtımı hasarlı uzatma kablosunu bantla geçici onarıp ıslak döşeme üzerinde kullanmak güvenli çalışma yöntemi değildir.",
        "",
        "Donatı veya kalıbın metal olması, elektrik tesisatının tasarlanmış koruyucu **topraklama** düzeninin yerine geçmez."
      ),
      subsections: [],
    },
    {
      id: "kacak-akim-koruma",
      title: "Ana dağıtımda 300 mA, tali dağıtımda 30 mA kaçak akım korumasını doğrulayın",
      content: phase5Lines(
        "ÇSGB'nin güncel Elektrik İşleri sayfası, yapı işyerinde ana dağıtım noktalarında yangından korunma amacıyla **300 mA**, tali dağıtım noktalarında çalışanların elektrik çarpmasına karşı korunması için **30 mA** anma değerinde kaçak akım rölesi kullanılmasını açıkça belirtir.",
        "",
        "| Koruma noktası | Anma değeri | Ana amaç |",
        "|---|---:|---|",
        "| Ana dağıtım | **300 mA** | Yangın riskine karşı koruma |",
        "| Tali dağıtım | **30 mA** | İnsanların elektrik çarpmasına karşı korunması |",
        "",
        "Rölenin panoda bulunması tek başına yeterli değildir. Bakanlık kaynağı, kaçak akım rölelerinin yapı işyerinde görevli yetkili elektrikçi tarafından düzenli kontrol edilmesini ve uygunsuzlukta yenilenmesini ister."
      ),
      subsections: [],
    },
    {
      id: "topraklama-ve-pano",
      title: "Topraklama, pano muhafazası ve kablo güzergâhı aynı koruma sisteminin parçalarıdır",
      content: phase5Lines(
        "Elektrikli ekipman ve tesislerin uygun şekilde topraklanması, hata akımının güvenli bir yol üzerinden uzaklaştırılması için temel koruma katmanıdır. Panolar su, darbe ve yetkisiz erişime karşı korunmalı; enerji altındaki kısımlar açıkta bırakılmamalıdır.",
        "",
        "Kablolar araç tekeri, demir donatı, kalıp kenarı veya keskin yüzey altında ezilmeyecek biçimde taşınmalıdır. Priz/fiş bağlantıları zemindeki su birikintisine bırakılmamalı; taşınabilir ekipmanın koruma sınıfı gerçek çalışma ortamına uygun olmalıdır.",
        "",
        "Döküm ekibinin kabloyu üretim akışına göre sürekli yer değiştirmesi bekleniyorsa güzergâh daha işe başlamadan planlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "enerji-izolasyonu",
      title: "Arıza veya bakımda enerjiyi yalnız düğmeden kapatmak yerine güvenli izolasyon uygulayın",
      content: phase5Lines(
        "ÇSGB güvenli çalışma yöntemleri arasında elektrikli ekipman ve sistemlerde akımın kesilmesini, **etiketleme-kilitleme (LOTO)** uygulanmasını ve ekipmanın bakımlı tutulmasını sayar. Vibratör, pompa veya pano arızasında yetkisiz kişinin enerjili ekipmana müdahalesi engellenmelidir.",
        "",
        "Arıza giderilmeden önce enerji kaynağı izole edilmeli, yeniden enerjilenme kontrol altına alınmalı ve müdahale yetkili kişi tarafından yapılmalıdır. 'Şalteri kapattım' ifadesi, enerjisizliğin doğrulanması ve kilitleme prosedürünün yerine geçmez.",
        "",
        "Saha prosedüründe arızalı ekipmanın işaretlenmesi, kullanım dışına alınması ve tekrar devreye alma yetkisi açık olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "beton-pompasi-hatlar",
      title: "Beton pompası bomu ve mobil ekipmanlarda havai enerji hattı etkileşimini döküm planına ekleyin",
      content: phase5Lines(
        "Beton pompası bomu geniş bir çalışma zarfına sahiptir ve havai enerji hatlarına yaklaşma riski taşıyabilir. ÇSGB, enerji hatları yakınındaki güvenli çalışma mesafelerinin Elektrik Kuvvetli Akım Tesisleri Yönetmeliği hükümlerine göre belirlenmesini ister; tek bir ezber metre değeri bütün gerilim seviyeleri için kullanılmamalıdır.",
        "",
        "Pompa kurulmadan önce bomun bütün olası hareket zarfı, zemin taşıma durumu, ayakların yerleşimi, trafik ve enerji hatları kontrol edilmelidir. Gerekirse hat işletmecisiyle koordinasyon veya enerjisiz çalışma çözümü planlanmalıdır.",
        "",
        "Teknik sorumluluk, elektrik güvenliğini yalnız elektrikçinin konusu görmeden döküm yöntemi, pompa yerleşimi ve saha lojistiğiyle birlikte çözmektir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Döküm öncesi geçici elektrik panosu, priz, fiş, kablo ve vibratörleri kontrol ettim.",
        "- [ ] Ana dağıtımda **300 mA**, tali dağıtımda **30 mA** kaçak akım korumasını doğruladım.",
        "- [ ] Tesis ve ekipmanların koruyucu **topraklama** bağlantılarını kontrol ettim.",
        "- [ ] Islak zeminde hasarlı veya uygun olmayan uzatma kablosu/bağlantı kullanılmasını engelledim.",
        "- [ ] Arıza ve bakım için **etiketleme-kilitleme (LOTO)** prosedürünü uyguladım.",
        "- [ ] Beton pompası bomunun havai enerji hatlarına yaklaşma riskini döküm planında değerlendirdim.",
        "- [ ] Kaçak akım rölelerinin yetkili elektrikçi kontrol kayıtlarını doğruladım.",
        "- [ ] Döküm boyunca kablo güzergâhı, su birikmesi ve ekipman hasarını saha gözetimiyle takip ettim."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "ÇSGB Güvenli İnşaat — Elektrik İşlerinde İş Sağlığı ve Güvenliği", href: ELECTRIC_PAGE },
    { label: "ÇSGB Güvenli İnşaat — İş Ekipmanlarında İş Sağlığı ve Güvenliği", href: EQUIPMENT_PAGE },
    { label: "ÇSGB — 6331 sayılı İş Sağlığı ve Güvenliği Kanunu", href: LAW_6331 },
  ],
  keywords: ["beton dökümü", "elektrik güvenliği", "300 mA", "30 mA", "topraklama", "LOTO", "beton pompası"],
  tags: ["İSG", "beton dökümü", "elektrik", "topraklama"],
};

export const DEPREM_PHASE5_BATCH_4_ARTICLES = [
  DEPREM_PHASE5_ISG_PLAN,
  DEPREM_PHASE5_ISG_EXPERT,
  DEPREM_PHASE5_ISG_HEIGHT,
  DEPREM_PHASE5_ISG_EXCAVATION,
  DEPREM_PHASE5_ISG_ELECTRIC,
] as const;
