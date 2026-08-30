import {
  ASANSOR_KONTROL_2025,
  PHASE6_UPDATED_AT,
  TBDY_PAGE,
  asansorPhase6References,
  phase6Lines,
  type DepremPhase6Override,
} from "./deprem-phase6-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const ASANSOR_SHAFT: DepremPhase6Override = {
  slug: "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu",
  title: "Asansör Kuyusu Boyutlandırması: Kabin, Kapı, Sahanlık ve Taşıyıcı Sistem Koordinasyonu",
  description: "Planlı Alanlar İmar Yönetmeliği Madde 34'teki güncel minimum kabin, kapı ve sahanlık ölçülerini; kapasite, kuyu, çukur, üst boşluk ve taşıyıcı sistem koordinasyonundan ayırarak açıklar.",
  seoTitle: "Asansör Kuyusu Boyutlandırma | Madde 34, 1,20 m ve 1,80 m²",
  seoDescription: "2026 Madde 34'e göre asansör zorunluluğu, 1,20 m kabin dar kenarı, 1,80 m² alan, 0,90 m kapı ve 10+ kat sedye asansörü kontrolleri.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["asansor-makine-daireli-ve-dairesiz-sistemler", "engelsiz-wc-asansor-kapi-boyutlari", "imar-kat-yuksekligi-bina-yuksekligi-farki"],
  sections: [
    section("madde34-zorunluluk", "Madde 34: önce binada asansör zorunluluğunu ve hizmet edeceği katları belirle", phase6Lines(
      "1 Temmuz 2026 tarihli değişiklikle Planlı Alanlar İmar Yönetmeliği **Madde 34** güncellendi. Tek bağımsız bölümlü konutlar hariç; teknik hacimler dışındaki bağımsız bölüm, ortak alan veya eklenti bulunan bodrum kat da hesaba katılarak **kat adedi 3** olan binalarda asansör yeri bırakılması, **4 ve daha fazla** katlı binalarda asansör tesisi zorunludur.",
      "Asansör zorunluluğu bulunan binalarda asansörlerin bodrum katlar dâhil tüm katlara hizmet vermesi temel kuraldır. Ancak bağımsız bölüm, ortak alan veya eklenti bulunmayan bodruma ulaştırılması zorunlu değildir. Bu nedenle kuyu düşey sürekliliği mimari avan projede, temel/perde çözümü tamamlanmadan kilitlenmelidir.",
      "Yanlış yaklaşım, yalnız zemin üstü kat sayısına bakıp kullanılan bodrumu göz ardı etmektir."
    )),
    section("minimum-boyutlar", "Kabin ve kapı minimumlarını kuyu ölçüsü sanmayın", phase6Lines(
      "Tek asansörlü binalarda Madde 34'e göre kabinin dar kenarı **1,20 m**, kabin alanı **1,80 m²**, kapı net geçiş genişliği **0,90 m** değerlerinden az olamaz. Kapının açıldığı sahanlık sürgülü kapıda en az **1,20 m**, dışa açılan kapıda en az **1,50 m** genişlikte olmalıdır.",
      "| Kontrol | Madde 34 minimumu |\n|---|---:|\n| Kabin dar kenarı | 1,20 m |\n| Kabin alanı | 1,80 m² |\n| Kapı net geçişi | 0,90 m |\n| Sürgülü kapı önü sahanlık | 1,20 m |\n| Dışa açılan kapı önü sahanlık | 1,50 m |",
      "Bu değerler **kuyu net ölçüsü değildir**. Kuyu; kabin karkası, karşı ağırlık, raylar, kapı mekanizması, güvenlik boşlukları, montaj toleransları ve seçilen tahrik sistemine göre daha büyük olur. Evrensel bir `1,20 × ? = kuyu` tablosu üretmek teknik olarak yanlış olur."
    )),
    section("coklu-asansor", "Birden fazla asansör ve 10 kat üzeri kullanım senaryosu", phase6Lines(
      "Birden fazla asansör bulunan binalarda asansör sayısının yarısı kadar asansörün Madde 34'teki 1,20 m / 1,80 m² / 0,90 m erişilebilir ölçülerini sağlaması gerekir; asansör sayısı tekse sayı bir alta yuvarlanır. Özellik arz eden binalarda ilgili idare, kullanım ve yoğunluğa göre sayı ve asgari ölçüleri artırabilir.",
      "**10 kat ve üzeri** binalarda asansörlerden en az birinin yük, eşya ve sedye taşımaya uygun olarak dar kenarı en az **1,20 m**, alanı en az **2,52 m²**, kapı net genişliği en az **1,10 m** olacak şekilde yapılması gerekir.",
      "Bu kontrol yalnız kabin seçimi değildir: sedye dönüşü, sahanlık, yangın holü, kapı yaklaşımı ve koridor genişliği aynı plan üzerinde çözülmelidir."
    )),
    section("kapasite-kuyu", "Kapasite ve kuyu boyutu üretici sistem verisiyle kapatılır", phase6Lines(
      "Asansör kapasitesi; bina kullanımı, kişi/yük trafiği, hız, durak sayısı, erişilebilirlik ve gerektiğinde sedye/itfaiyeci kullanım senaryosuyla seçilir. Sonrasında seçilen **2014/33/AB uyumlu sistemin** kabin-kuyu yerleşim paftası, TS EN 81-20/50 kapsamındaki güvenlik boşlukları ve üretici teknik dosyasıyla kuyu ölçüsü kesinleştirilir.",
      "Ön projede şu veri tablosu kilitlenmelidir: `beyan yükü — beyan hızı — durak sayısı — seyir mesafesi — kapı tipi/genişliği — tahrik tipi — kuyu neti — çukur — üst boşluk — makine/pano erişimi`. Bu değerlerin son dördü marka/sistem seçilmeden tahmini tek sayı olarak ruhsat paftasına yazılmamalıdır.",
      "Standarttaki kapasite veya kuyu tablolarını kaynaksız kopyalamak yerine seçilen sistemin onaylı yerleşim çizimi projeye eklenmelidir."
    )),
    section("statik-koordinasyon", "Kuyu, çukur ve üst boşluğu betonarme projeyle birlikte çöz", phase6Lines(
      "Kuyu perde/duvarları, ray konsolu bağlantıları, makine veya taşıyıcı kiriş reaksiyonları, kapı lentoları ve kuyu dibi çukuru statik proje girdisidir. Özellikle temel içinde oluşan çukur; radye üst kotu, su yalıtımı ve yeraltı suyu detayını etkileyebilir.",
      "Makine dairesiz sistemde makine kuyu içinde olsa bile reaksiyonlar yok olmaz; yüklerin raylara, konsollara veya taşıyıcı mesnetlere nasıl aktarıldığı üretici projesinden statik projeye taşınmalıdır. Makine daireli sistemde ise makine kaidesi ve döşeme reaksiyonları ayrıca çözülür.",
      "Kuyu ölçüsünü mimari proje sonunda değiştirip statik perde aksını daraltmak, kritik bir koordinasyon hatasıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** 1,20 m kabin dar kenarını kuyu dar kenarı kabul etmek. **Sonuç:** ray, karşı ağırlık ve güvenlik boşluğu sığmaz.\n2. **Yanlış:** Kullanılan bodrumu kat sayısında dikkate almamak. **Sonuç:** asansör zorunluluğu/hizmet katı yanlış yorumlanır.\n3. **Yanlış:** 10+ katlı binada 2,52 m² sedye/yük asansörü koşulunu geç fark etmek. **Sonuç:** çekirdek ve koridor yeniden tasarlanır.\n4. **Yanlış:** Üretici yerleşim paftası olmadan çukur ve üst boşluğu betonarme projede kesinleştirmek. **Sonuç:** saha kotu ve kiriş çakışması çıkar.\n5. **Yanlış:** Asansör yapılınca merdiven şartının kalktığını varsaymak. **Sonuç:** Madde 34'ün açık hükmüyle çelişilir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] **1 Temmuz 2026 / 33297** sonrası Madde 34 metni proje tarihine göre kontrol edildi mi?",
      "- [ ] Bodrum dâhil kat sayısı doğru sınıflandırıldı mı?",
      "- [ ] Tek asansörde **1,20 m / 1,80 m² / 0,90 m** minimumları sağlandı mı?",
      "- [ ] Sahanlıkta 1,20 m veya kapı tipine göre 1,50 m net alan korunuyor mu?",
      "- [ ] 10 kat ve üzeri binada **2,52 m² / 1,10 m** sedye-yük asansörü kontrol edildi mi?",
      "- [ ] Kapasite, hız ve durak sayısı bina kullanımına göre belirlendi mi?",
      "- [ ] Kuyu/çukur/üst boşluk seçilen sistemin onaylı yerleşim projesiyle doğrulandı mı?",
      "- [ ] Ray, konsol, makine ve ankraj reaksiyonları betonarme projeye taşındı mı?"
    )),
  ],
  references: asansorPhase6References("Madde 34, kabin-kapı-sahanlık ve sistem uygunluğu"),
  keywords: ["asansör kuyusu", "Madde 34", "1,20 m", "1,80 m²", "0,90 m", "2,52 m²", "1,10 m"],
  tags: ["Asansör", "Kuyu", "Kabin", "Madde 34", "Proje Koordinasyonu"],
};

const ASANSOR_MR_MRL: DepremPhase6Override = {
  slug: "asansor-makine-daireli-ve-dairesiz-sistemler",
  title: "Makine Daireli ve Makine Dairesiz Asansörler: Sistem Seçimi ve Proje Koordinasyonu",
  description: "MR ve MRL asansörleri alan, bakım erişimi, ekipman yerleşimi, taşıyıcı reaksiyon, elektrik-mekanik koordinasyon ve kurtarma senaryosu açısından karşılaştırır.",
  seoTitle: "Makine Daireli vs Makine Dairesiz Asansör | MR–MRL Seçimi",
  seoDescription: "Makine daireli ve MRL asansörlerin kuyu, üst boşluk, bakım erişimi, pano, gürültü-titreşim, kurtarma ve betonarme reaksiyon farkları için mühendislik rehberi.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk okuma",
  relatedSlugs: ["asansor-boslugu-boyutlandirma-kapasite-alan-tablosu", "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu", "asansor-deprem-sirasinda-otomatik-park-ozelligi"],
  sections: [
    section("sistem-tanimi", "MR ve MRL birer mimari pazarlama etiketi değil, ekipman yerleşim kararıdır", phase6Lines(
      "Makine daireli (**MR**) sistemde tahrik makinesi ve ilgili ekipman için kuyu dışında ayrı bir makine hacmi bulunur. Makine dairesiz (**MRL**) sistemde ise tahrik makinesi ve birçok ana bileşen kuyu/üst kuyu bölgesine entegre edilir; kumanda ekipmanı uygun erişim noktasında çözülür.",
      "Her iki sistem de uygun tasarlandığında Asansör Yönetmeliği (2014/33/AB) ve ilgili TS EN 81 serisi gereklilikleri çerçevesinde kullanılabilir. MRL'nin otomatik olarak 'daha güvenli', MR'nin otomatik olarak 'eski teknoloji' olduğunu söylemek yanlış olur.",
      "Seçim; bina yüksekliği, kapasite, hız, trafik, kuyu geometrisi, bakım erişimi, kurtarma yaklaşımı, akustik ve ilk/ömür boyu maliyet üzerinden yapılmalıdır."
    )),
    section("karsilastirma", "Karşılaştırma: hacim tasarrufu kadar servis edilebilirliği de puanlayın", phase6Lines(
      "| Karar başlığı | Makine daireli (MR) | Makine dairesiz (MRL) |\n|---|---|---|\n| Ana makine yerleşimi | Ayrı makine hacmi | Kuyu/üst kuyu içinde |\n| Mimari üst hacim | Ek makine hacmi gerekir | Ayrı oda ihtiyacı azalabilir |\n| Bakım erişimi | Ekipman odada daha doğrudan erişilebilir olabilir | Kuyu içi ekipmana güvenli erişim prosedürü kritik |\n| Yapısal reaksiyon | Makine kaidesi/döşeme ile koordine edilir | Ray/konsol/kuşak veya sistem mesnetlerine aktarılabilir |\n| Gürültü-titreşim | Makine odası izolasyonu tasarlanır | Kuyuya komşu hacimler özellikle kontrol edilir |\n| Kurtarma/kumanda | Oda erişimi senaryoya dâhil | Kuyu/pano erişimi ve uzaktan işlem çözümü önemlidir |",
      "Tablo bir tercih hükmü değil kontrol matrisidir. Kesin çözüm üreticinin sertifikalı sistem yerleşimiyle doğrulanır."
    )),
    section("kuyu-ust-bosluk", "MRL ayrı oda azaltabilir; kuyu ve üst boşluk gereksinimini ortadan kaldırmaz", phase6Lines(
      "MRL seçiminde en sık hata, makine dairesi kalktığı için üst kuyu geometrisinin serbest kaldığını düşünmektir. Makine, askı düzeni, regülatör, pano/erişim ve güvenlik hacimleri kuyu geometrisine yerleşir; çukur ve üst boşluk seçilen hız, kapasite ve ekipman sistemine göre onaylı yerleşim çiziminde tanımlanır.",
      "MR sistemde de makine dairesinin yüksekliği, erişim yolu, havalandırma/ısı yükü, kaide ve ekipman sökme-takma güzergâhı ihmal edilmemelidir. Çatı mimarisi ve yangın bölmeleriyle koordinasyon gerekir.",
      "Bu nedenle avan proje aşamasında marka bağımsız bir 'rezerv hacim', uygulama aşamasında ise seçilen sistemin kesin kuyu/üst boşluk verisi kullanılmalıdır."
    )),
    section("bakim-kurtarma", "Bakım ve kurtarma erişimini proje çiziminde göster", phase6Lines(
      "Asansör İşletme ve Bakım Yönetmeliği bakımın yetkili servis tarafından **ayda en az bir defa** yürütülmesini öngörür. Sistemin her ay güvenli erişilebilir olması bu nedenle yalnız montaj kolaylığı değil işletme gereğidir.",
      "MRL sistemde kuyu içindeki makine, hız regülatörü ve diğer bileşenlere erişim için servis prosedürü, çalışma platformu/erişim çözümü ve uzaktan test-kurtarma fonksiyonları seçilen sistemin teknik dosyasına göre tanımlanmalıdır. MR sistemde makine odasının kilitli ama yetkili erişime uygun olması, aydınlatma ve çalışma alanının korunması gerekir.",
      "Kurtarma senaryosu elektrik kesintisi, arıza ve acil durum için montaj firması/yetkili servis talimatıyla bina yönetimine teslim edilmelidir."
    )),
    section("statik-akustik", "Taşıyıcı reaksiyon ve akustik komşuluğu sistem seçimine geri besle", phase6Lines(
      "Tahrik makinesi, raylar ve konsolların yatay/düşey reaksiyonları sistem tipine göre farklı noktalardan yapıya aktarılabilir. Betonarme projede 'asansör boşluğu' çizmek tek başına yeterli değildir; üretici reaksiyon tablosu, ankraj konumu ve taşıyıcı eleman kalınlığı kontrol edilmelidir.",
      "MRL'de kuyuya komşu yatak odası/ofis gibi hassas hacimler varsa yapı kaynaklı ses ve titreşim riski ayrıca incelenmelidir. MR sistemde de makine dairesi altındaki/yanındaki hacimler için titreşim izolasyonu ve kaide detayı gerekir.",
      "Mekanik havalandırma, elektrik beslemesi, yangın algılama ve yedek güç/kurtarma altyapısı sistem seçiminden sonra yeniden koordine edilmelidir."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** MRL seçildi diye kuyu üst boşluğunu küçültmek. **Sonuç:** makine ve güvenlik boşlukları sığmayabilir.\n2. **Yanlış:** MR sistemde makine odasını artık kullanılmayan boş hacim gibi görmek. **Sonuç:** bakım erişimi ve ekipman çalışma alanı ihlal edilir.\n3. **Yanlış:** Sistem seçimini yalnız ilk yatırım fiyatıyla yapmak. **Sonuç:** bakım, kurtarma, enerji ve parça erişimi gözden kaçar.\n4. **Yanlış:** Makine/ra y reaksiyonlarını statik projeye aktarmamak. **Sonuç:** ankraj ve taşıyıcı eleman sonradan çözülür.\n5. **Yanlış:** Gürültü-titreşim komşuluğunu cihaz montajından sonra düşünmek. **Sonuç:** bitmiş yapıda pahalı akustik düzeltme gerekir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Bina trafiği, kapasite, hız ve durak sayısı sistem seçiminden önce belirlendi mi?",
      "- [ ] MR/MRL seçenekleri alan, bakım, kurtarma ve ömür boyu işletme açısından karşılaştırıldı mı?",
      "- [ ] Kesin kuyu, çukur ve üst boşluk onaylı sistem yerleşimiyle doğrulandı mı?",
      "- [ ] Ayda en az bir bakım için güvenli ekipman erişimi çizimde çözüldü mü?",
      "- [ ] Makine, ray ve konsol reaksiyonları betonarme projeye aktarıldı mı?",
      "- [ ] Pano, güç, havalandırma ve acil kurtarma altyapısı elektrik/mekanik projeyle uyumlu mu?",
      "- [ ] Gürültü ve titreşim açısından hassas komşu hacimler kontrol edildi mi?",
      "- [ ] Seçilen çözüm 2014/33/AB uygunluk/teknik dosya zincirine bağlandı mı?"
    )),
  ],
  references: asansorPhase6References("makine yerleşimi, işletme-bakım ve sistem uygunluğu"),
  keywords: ["makine daireli", "makine dairesiz", "MRL", "MR", "TS EN 81-20", "ayda en az bir", "bakım"],
  tags: ["Asansör", "MRL", "Makine Dairesi", "Bakım", "Proje Koordinasyonu"],
};

const ASANSOR_SAFETY: DepremPhase6Override = {
  slug: "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu",
  title: "Asansör Güvenlik Aksamı, Aylık Bakım ve Yıllık Periyodik Kontrol: Sorumluluk Zinciri",
  description: "Asansör güvenlik aksamını, ayda en az bir yetkili servis bakımını, yılda en az bir A tipi muayene kontrolünü ve yeşil-mavi-sarı-kırmızı etiket sistemini birbirinden ayırır.",
  seoTitle: "Asansör Bakım ve Periyodik Kontrol | Aylık Bakım, Yıllık Muayene",
  seoDescription: "Asansörlerde ayda en az bir bakım, yılda en az bir periyodik kontrol, yeşil/mavi/sarı/kırmızı etiketler ile 60 ve 120 günlük düzeltme süreleri.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["asansor-makine-daireli-ve-dairesiz-sistemler", "asansor-deprem-sirasinda-otomatik-park-ozelligi", "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu"],
  sections: [
    section("uc-katman", "Bakım, periyodik kontrol ve onarım aynı işlem değildir", phase6Lines(
      "Asansör güvenliğinin işletme döneminde üç ayrı katmanı vardır: yetkili servisin **aylık bakımı**, Bakanlıkça yetkilendirilmiş A tipi muayene kuruluşunun **yıllık periyodik kontrolü** ve bulunan uygunsuzlukların giderildiği **onarım/takip kontrolü**. Bunlardan biri diğerinin yerine geçmez.",
      "Asansör İşletme ve Bakım Yönetmeliğinde bakım, asansör monte eden veya yetkili servisi tarafından **ayda en az bir defa** yürütülen işlemler olarak tanımlanır. Asansör Periyodik Kontrol Yönetmeliği ise sürekli kullanılan asansörün **yılda en az bir defa** A tipi muayene kuruluşuna kontrol ettirilmesini ister.",
      "'Servis her ay geliyor, yıllık kontrole gerek yok' veya 'yeşil etiket var, aylık bakım gereksiz' yaklaşımı yanlış ve mevzuat mantığına aykırıdır."
    )),
    section("guvenlik-aksami", "Güvenlik aksamını tek tek parça değil fonksiyon zinciri olarak okuyun", phase6Lines(
      "Asansör Yönetmeliği (2014/33/AB), asansör ve güvenlik aksamlarının temel sağlık ve güvenlik gereklerini düzenler. Uygulamada kapı kilitleme tertibatları, düşmeyi/aşırı hızı önleyen güvenlik düzenleri, tamponlar ve güvenlik devreleri gibi bileşenler birbirine bağlı bir koruma zinciri oluşturur.",
      "| Kontrol grubu | Mühendislik sorusu |\n|---|---|\n| Kapılar ve kilitleme | Kabin ancak güvenli kapı durumunda hareket ediyor mu? |\n| Aşırı hız / güvenlik tertibatı | Tehlikeli hızda bağımsız güvenli durdurma zinciri çalışıyor mu? |\n| Tampon / son sınır | Normal seyir sınırı aşılırsa enerji güvenli biçimde sınırlanıyor mu? |\n| Elektrik güvenlik devresi | Bir güvenlik kontağı açıldığında hareket engelleniyor mu? |\n| Alarm / haberleşme / kurtarma | Mahsur kalma durumunda yardım ve tahliye prosedürü çalışıyor mu? |",
      "Bu liste standardın tam kontrol tablosu değildir; periyodik muayene ve bakım için sistem mantığını gösterir. Kesin kriterler güncel kontrol listeleri ve teknik standartlarla yürütülür."
    )),
    section("etiketler", "Yıllık kontrolde dört sonuç sınıfı: yeşil, mavi, sarı, kırmızı", phase6Lines(
      "Periyodik kontrol sonucu **kusursuz, hafif kusurlu, kusurlu, güvensiz** olarak dört grupta değerlendirilir. Bunlara sırasıyla **yeşil, mavi, sarı ve kırmızı** bilgi etiketi karşılık gelir.",
      "| Etiket | Sonuç | Temel işlem |\n|---|---|---|\n| Yeşil | Kusursuz | Normal bakım ve yıllık kontrol döngüsü sürer |\n| Mavi | Hafif kusurlu | Uygunsuzluklar bir sonraki periyodik kontrole kadar giderilir |\n| Sarı | Kusurlu | Uygunsuzluklar en fazla **120 gün** içinde giderilir; takip kontrolü yapılır |\n| Kırmızı | Güvensiz | Kullanıma izin verilmez; uygunsuzluklar en fazla **60 gün** içinde giderilir; takip kontrolü yapılır |",
      "Kırmızı veya sarı durumun süresi sonunda giderilmemesi hizmetten men/mühürleme sürecine götürebilir. Etiket yalnız renk değil hukuki ve teknik eylem durumudur."
    )),
    section("sorumluluk", "Bina sorumlusu, yetkili servis, A tipi kuruluş ve idarenin rolleri ayrıdır", phase6Lines(
      "Bina sorumlusu güvenli kullanım, düzenli bakım ve periyodik kontrolün yaptırılmasından sorumludur. Yetkili servis bakım/onarım faaliyetini yürütür; A tipi muayene kuruluşu bağımsız periyodik kontrolü yapar; ilgili idare protokol ve gerektiğinde hizmetten men/mühürleme süreçlerinde görev alır.",
      "Bakım sözleşmesi ve servis fişleri, yıllık muayene raporu, takip kontrolü ve yapılan onarım kayıtları aynı asansör kimlik numarası altında dosyalanmalıdır. Sözlü 'bakıldı' beyanı izlenebilir teknik kayıt değildir.",
      "5 Ağustos 2025 tarihli **32977** değişikliği de güncel periyodik kontrol yönetmeliği zincirinin parçasıdır; kurumların eski form ve prosedürü otomatik kullanmaması gerekir."
    )),
    section("proje-isletme-koprusu", "Ruhsat projesindeki güvenlik kararlarını işletme kayıtlarına taşıyın", phase6Lines(
      "Asansör devreye alındığında tasarım kapasitesi, beyan hızı, duraklar, güvenlik aksamı, acil haberleşme, elektrik besleme ve yangın/deprem girişleri teknik dosyada tanımlıdır. İşletme sırasında yapılan parça değişimi veya modernizasyon bu ilk tasarım zinciriyle uyumlu olmalıdır.",
      "Örneğin kapı operatörü, hız regülatörü, güvenlik tertibatı veya kumanda panosu değişiminde yalnız fiziksel montaj yeterli değildir; uygunluk, ayar, test ve kayıtların güncellenmesi gerekir. Proje dışı modifikasyon periyodik kontrolde yeni uygunsuzluk doğurabilir.",
      "Mühendislik kontrolü, bakım fişindeki değişen parçayı teknik dosya ve son periyodik raporla karşılaştırmalıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** Aylık bakım ile yıllık muayeneyi aynı işlem saymak. **Sonuç:** bağımsız periyodik kontrol yükümlülüğü atlanır.\n2. **Yanlış:** Kırmızı etiketli asansörü 'servis çağırdık' diyerek kullanmaya devam etmek. **Sonuç:** güvensiz asansör kullanım yasağı ihlal edilir.\n3. **Yanlış:** Sarı ve kırmızı için aynı süreyi uygulamak. **Sonuç:** **120 gün / 60 gün** düzeltme takvimi karışır.\n4. **Yanlış:** Parça değişimini teknik dosya ve test kaydına işlememek. **Sonuç:** izlenebilirlik ve uygunluk zinciri bozulur.\n5. **Yanlış:** Yeşil etiketi gelecek yıl boyunca arıza olmayacağı garantisi saymak. **Sonuç:** aylık bakım ve arıza müdahalesi ihmal edilir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Yetkili servis bakım sözleşmesi ve **ayda en az bir** bakım kayıtları mevcut mu?",
      "- [ ] A tipi muayene kuruluşunca **yılda en az bir** periyodik kontrol yapıldı mı?",
      "- [ ] Etiket rengi rapordaki kusursuz/hafif kusurlu/kusurlu/güvensiz sonucu ile aynı mı?",
      "- [ ] Kırmızı etiketli asansör kullanım dışı tutuluyor ve **60 gün** süresi izleniyor mu?",
      "- [ ] Sarı etiket uygunsuzlukları **120 gün** içinde kapatılıyor mu?",
      "- [ ] Mavi etiket uygunsuzlukları bir sonraki periyodik kontrolden önce gideriliyor mu?",
      "- [ ] Onarım ve parça değişiklikleri teknik dosya/servis kaydına işlendi mi?",
      "- [ ] **5 Ağustos 2025 / 32977** dâhil güncel değişiklik zinciri kontrol edildi mi?"
    )),
  ],
  references: asansorPhase6References("güvenlik aksamı, aylık bakım, yıllık periyodik kontrol ve etiket sistemi"),
  keywords: ["asansör bakımı", "ayda en az bir", "yılda en az bir", "yeşil etiket", "mavi etiket", "sarı etiket", "kırmızı etiket", "60 gün", "120 gün"],
  tags: ["Asansör", "Bakım", "Periyodik Kontrol", "Güvenlik", "Etiket"],
};

const ASANSOR_SEISMIC: DepremPhase6Override = {
  slug: "asansor-deprem-sirasinda-otomatik-park-ozelligi",
  title: "Asansörün Deprem Sırasındaki Davranışı: Sismik Algılama, Güvenli Durum ve Yeniden Devreye Alma",
  description: "Deprem sensörü ve 'otomatik park' kavramını yangın geri çağırma senaryosundan ayırır; TS EN 81-77 kapsamındaki sismik tasarımın yalnız sensörden ibaret olmadığını ve proje özelinde doğrulanması gerektiğini açıklar.",
  seoTitle: "Asansör Deprem Sensörü ve Otomatik Park | TS EN 81-77",
  seoDescription: "Asansörlerde deprem sensörü, TS EN 81-77 sismik tasarım, kontrol panosu sinyali, güvenli duruş ve deprem sonrası yeniden devreye alma; yangın geri çağırmadan farkı.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu", "asansor-makine-daireli-ve-dairesiz-sistemler", "tbdy-afad-ss-s1-okuma"],
  sections: [
    section("baslik-duzeltmesi", "'Otomatik park' tek ve evrensel bir ulusal senaryo değildir", phase6Lines(
      "Asansörün depremde davranışı halk arasında çoğu kez 'sensör depremi algılar, asansör en yakın kata gider ve kapıyı açar' diye tek cümleye indirilir. Ancak bunu her bina ve her asansör için değişmez bir **Resmî Gazete kuralı** gibi sunmak doğru değildir.",
      "Sismik koşullara tabi asansörler için **TS EN 81-77**; asansörün sismik tasarımını ve ilgili güvenlik önlemlerini ele alan standarttır. Uygulanacak sismik kategori, algılama/işletme senaryosu ve ekipman önlemleri proje verisi, asansör tasarımı ve standardın güncel hükümleriyle belirlenmelidir.",
      "Bu makalenin amacı 'otomatik park' başlığını doğrulamak değil, yanlış genellemeyi mühendislik kontrol akışına çevirmektir."
    )),
    section("sensor-arayuzu", "Deprem sensörü bina ile asansör kumandası arasında tanımlı bir arayüz olmalıdır", phase6Lines(
      "2025 tarihli kamuya açık asansör periyodik kontrol raporlarında, asansör yaptırıcısı veya bina sorumlusu tarafından **yangın algılama sistemi / deprem sensörü tesisat uçlarının asansör kontrol panosu ucuna kadar getirilmesi** bir kontrol kriteri olarak yer alır. Bu, sensör sinyalinin mimari-elektrik-asansör disiplinleri arasında önceden koordine edilmesi gerektiğini gösterir.",
      "| Arayüz | Projede doğrulanacak bilgi |\n|---|---|\n| Sismik algılama | Sensör tipi, konumu, enerji ve test yöntemi |\n| Asansör panosu girişi | Normalde açık/kapalı mantık, arıza gözetimi, kablo güzergâhı |\n| Sismik işletme modu | Çağrı davranışı, duruş/kapı senaryosu, hizmet dışı kalma koşulu |\n| Yeniden devreye alma | Otomatik mi, yetkili kontrol/reset mi, hangi kontroller sonrası? |",
      "Arayüz tanımsızsa yalnız sensör satın almak güvenli sismik davranış üretmez."
    )),
    section("yanginla-karistirma", "Yangın geri çağırma ile deprem davranışını birbirine karıştırmayın", phase6Lines(
      "Aynı kontrol listelerinde yüksek binalar ve topluma açık yapılarda yangın uyarısı alan otomatik kapılı asansörün belirlenmiş durağa hareketi **TS EN 81-73** yangın davranışı bağlamında ayrıca kontrol edilir. Bu, sismik modun yangın geri çağırma senaryosuyla aynı olduğu anlamına gelmez.",
      "Yangında hedef, bina yangın senaryosunun belirlediği durağa geri çağırma ve normal kullanımın sonlandırılmasıdır. Depremde ise TS EN 81-77 kapsamındaki sismik tasarım, mekanik bileşenlerin deprem etkisine dayanımı ve proje özelindeki işletme modu birlikte ele alınır.",
      "Yanlış yaklaşım, yangın senaryosundaki 'belirlenmiş durak' davranışını kopyalayıp deprem sensörüne bağlamaktır."
    )),
    section("mekanik-sismik", "Sismik güvenlik yalnız kumanda yazılımı değildir", phase6Lines(
      "Deprem sırasında risk yalnız kabinde yolcu kalması değildir. Ray ve konsol bağlantıları, karşı ağırlık/kabin kılavuzlaması, askı elemanları, kasnaklar, kuyu içi kablolar, makine-pano sabitlemeleri ve diğer bileşenler yatay hareketten etkilenir. TS EN 81-77'nin varlık nedeni sismik koşulları bu bütünlükte ele almaktır.",
      "Bina taşıyıcı sistem projesi ile asansör projesi arasında; kuyu geometrisi, ray konsolu ankraj bölgeleri ve ekipman sabitlemeleri için veri alışverişi yapılmalıdır. Sadece deprem rölesi takıp mekanik sismik tasarımı değiştirmemek yanlış güvenlik algısı oluşturur.",
      "AFAD/TBDY bina deprem girdileri ile asansör standardındaki sismik tasarım girdileri, asansör tasarımcısı tarafından proje özelinde eşleştirilmelidir."
    )),
    section("deprem-sonrasi", "Deprem sonrası yeniden devreye alma, 'çalışıyor' gözleminden daha kapsamlıdır", phase6Lines(
      "Hissedilir veya proje sismik sistemini tetikleyen bir deprem sonrasında asansörün ekranda arıza göstermemesi tek başına güvenli olduğu anlamına gelmez. Ray/konsol, kabin ve karşı ağırlık kılavuzları, kapılar, askı sistemi, kuyu içi serbest elemanlar, makine-pano sabitlemeleri ve sensör kayıtları yetkili servis prosedürüyle kontrol edilmelidir.",
      "Sismik modun reset/yeniden hizmete alma mantığı seçilen sistemin teknik dosyasında açık olmalıdır. Eğer tasarım manuel yetkili kontrol gerektiriyorsa otomatik reset eklemek güvenlik fonksiyonunu bozabilir.",
      "Bakım formunda deprem tarihi, sensör durumu, görülen hasar/uygunsuzluk, yapılan test ve yeniden hizmete alma onayı ayrı kaydedilmelidir."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** Her deprem sensörlü asansörün mutlaka en yakın kata park edeceğini mevzuat hükmü gibi yazmak. **Sonuç:** proje/standart dışı genelleme yapılır.\n2. **Yanlış:** Yangın geri çağırma senaryosunu deprem senaryosu olarak kopyalamak. **Sonuç:** iki farklı tehlike modu karışır.\n3. **Yanlış:** Sensör kablosunu pano girişine getirmeyi tüm sismik tasarım saymak. **Sonuç:** mekanik sabitleme ve kılavuz sistem önlemleri atlanır.\n4. **Yanlış:** Deprem sonrası yalnız kabini çalıştırıp test etmek. **Sonuç:** kuyu/ray/karşı ağırlık hasarı gözden kaçabilir.\n5. **Yanlış:** Reset koşulunu yetkili servis teknik dosyasından bağımsız değiştirmek. **Sonuç:** güvenlik fonksiyonu öngörülmeyen biçimde devre dışı kalabilir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Projede **TS EN 81-77** sismik koşul gerekliliği asansör tasarımcısıyla doğrulandı mı?",
      "- [ ] Deprem sensörü tesisatı asansör kontrol panosuna kadar koordineli mi?",
      "- [ ] Sismik işletme modu teknik dosyada açıkça tanımlı mı?",
      "- [ ] Yangın **TS EN 81-73** geri çağırma mantığı sismik moddan ayrıldı mı?",
      "- [ ] Ray/konsol, karşı ağırlık, askı, makine ve pano sabitlemeleri sismik tasarımın parçası mı?",
      "- [ ] Sensör ve güvenlik fonksiyonu periyodik/servis testinde kayıt altına alınıyor mu?",
      "- [ ] Deprem sonrası kontrol ve yeniden devreye alma prosedürü bina yönetimine teslim edildi mi?",
      "- [ ] Proje özelinde doğrulanmayan 'en yakın kata park' gibi sabit bir davranış iddia edilmedi mi?"
    )),
  ],
  references: [
    ...asansorPhase6References("sismik güvenlik, kumanda arayüzü ve işletme sorumluluğu"),
    { label: "Şanlıurfa Büyükşehir Belediyesi — 2025 asansör periyodik/takip kontrol raporu", href: ASANSOR_KONTROL_2025, note: "Yangın algılama/deprem sensörü tesisatının kontrol panosu ucuna getirilmesi ve yangın davranışı kontrol kriterlerini gösteren kamu dokümanı." },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği", href: TBDY_PAGE, note: "Bina deprem tasarımının resmî çerçevesi; asansör sismik standardıyla proje koordinasyonunda birlikte değerlendirilir." },
  ],
  keywords: ["asansör deprem", "TS EN 81-77", "deprem sensörü", "otomatik park", "TS EN 81-73", "sismik mod", "kontrol panosu"],
  tags: ["Asansör", "Deprem", "TS EN 81-77", "Sismik Güvenlik", "Otomasyon"],
};

export const DEPREM_PHASE6_BATCH_4_ARTICLES = [
  ASANSOR_SHAFT,
  ASANSOR_MR_MRL,
  ASANSOR_SAFETY,
  ASANSOR_SEISMIC,
] as const;
