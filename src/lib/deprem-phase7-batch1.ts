import {
  PHASE7_UPDATED_AT,
  bepPhase7References,
  phase7Lines,
  type DepremPhase7Override,
} from "./deprem-phase7-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const U_VALUE_CONDENSATION: DepremPhase7Override = {
  slug: "bep-isi-yalitim-u-degeri-yogusma-kontrolu",
  title: "TS 825 U Değeri ve Yoğuşma Kontrolü: Katmandan Uygulama Detayına",
  description: "Katmanlı yapı elemanında ısıl direnç ve U değerinin kurulmasını, yoğuşma riskinden ayrılmasını ve 1 Nisan 2025 sonrası TS 825 yaklaşımıyla proje kontrolünü açıklar.",
  seoTitle: "TS 825 U Değeri ve Yoğuşma | Isı Yalıtımı Hesap Rehberi",
  seoDescription: "R=d/λ ve U=1/RT ile U değeri hesabı, 2025 TS 825 iklim yaklaşımı, yoğuşma riski, ısı köprüleri ve saha uygulama kontrolü.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "15 dk okuma",
  relatedSlugs: ["bep-isil-kopru-detaylari-ve-cozum-yontemleri", "bep-ts-825-yontemi-isi-kaybi-hesabi", "bep-enerji-kimlik-belgesi-a-g-siniflandirma"],
  sections: [
    section("u-degeri", "U değeri yalnız yalıtım kalınlığı değil, bütün kesitin ısı geçiş sonucudur", phase7Lines(
      "Bir yapı elemanının ısı geçiş katsayısı **U [W/(m²K)]**, iç ve dış ortam arasındaki sıcaklık farkında birim alan başına ısı geçişini temsil eder. Hesap yalnız yalıtım levhasına değil; tüm katmanlara ve iç/dış yüzey dirençlerine dayanır.",
      "Düz ve homojen bir katmanda temel ilişki `R_i = d_i / λ_i`; toplam direnç `R_T = R_si + ΣR_i + R_se`; sonuç `U = 1 / R_T` biçimindedir. Projede kullanılacak λ tasarım değeri, yüzey dirençleri ve özel katman kabulleri güncel TS 825 ve ürün teknik verileriyle doğrulanmalıdır.",
      "Yanlış yaklaşım, katalogdaki tek λ değerini bütün duvarın performansı sanmak veya betonarme kuşak, bağlantı ve birleşim kesintilerini görünmez saymaktır."
    )),
    section("ornek", "Bağımsız örnek: hesabı birimlerle kurun", phase7Lines(
      "Yalnız yöntem örneği olarak 20 cm bir katman için `λ=0,70 W/(mK)`, 8 cm yalıtım için `λ=0,035 W/(mK)` varsayılsın. Katman dirençleri sırasıyla `0,20/0,70 = 0,286 m²K/W` ve `0,08/0,035 = 2,286 m²K/W` olur.",
      "Bu iki dirençten doğrudan nihai U değeri üretilemez; yüzey dirençleri ve diğer katmanlar da aynı birim sistemiyle toplam dirence eklenir. Son adımda `U = 1 / R_T` uygulanır.",
      "| Adım | İfade | Birim |\n|---|---|---:|\n| Katman direnci | d / λ | m²K/W |\n| Toplam direnç | Rsi + ΣR + Rse | m²K/W |\n| Isı geçiş katsayısı | 1 / RT | W/(m²K) |"
    )),
    section("ts825-2025", "1 Nisan 2025 sonrası TS 825 sürümünü ve iklim sınıfını doğrulayın", phase7Lines(
      "20 Şubat 2025 tarihli Tebliğ, 3 Aralık 2024 tarihli TS 825 revizyonunun **1 Nisan 2025** itibarıyla zorunlu uygulanmasını düzenledi. Bakanlık açıklamasında iklim bölgesi sayısının **4'ten 6'ya** çıkarıldığı ve soğutma ihtiyacının hesap yaklaşımında güçlendirildiği belirtilir.",
      "Bu nedenle eski dört bölgeli ofis tablolarını yeni ruhsat projesinde otomatik kullanmak doğru değildir. Proje yeri, ruhsat tarihi ve güncel standart sürümü doğrulanmadan U sınırı sabit sayı olarak yazılıma veya paftaya gömülmemelidir.",
      "Telifli TS 825 tabloları burada çoğaltılmaz; proje hesabı güncel ve lisanslı standart üzerinden kapatılır."
    )),
    section("yogusma", "U değeri ile yoğuşma kontrolü aynı fiziksel problem değildir", phase7Lines(
      "Düşük U değeri ısı geçişini azaltır; fakat yüzey veya katman içi **yoğuşma** riski sıcaklık dağılımı ile su buharı basıncı davranışına bağlı ayrı bir kontroldür. Buhar direnci yüksek katmanların yanlış sırada kurulması, iyi U değerine rağmen nem problemi doğurabilir.",
      "Malzeme seçimi λ değerinin yanında su buharı davranışı, yangın performansı, mekanik dayanım ve uygulama sürekliliğiyle birlikte değerlendirilmelidir.",
      "Enerji hesabı ile detay çizimi birbirinden kopuk yürütülürse teorik kesit sahada aynı performansı vermeyebilir."
    )),
    section("isi-koprusu", "Düz alan U hesabı ısı köprülerini tek başına çözmez", phase7Lines(
      "Kolon-kiriş, döşeme alnı, balkon, parapet ve pencere çevresi iki veya üç boyutlu ısı akısı oluşturabilir. İyi bir düz alan U değeri, birleşimlerin de aynı performansta olduğu anlamına gelmez.",
      "İletim kaybı değerlendirmesinde alan bileşeni `Σ(U_i A_i)` ile lineer ısı köprüleri `Σ(ψ_k l_k)` ayrı izlenmelidir. Detay sürekliliği çoğu durumda yalnız yalıtım kalınlığını artırmaktan daha belirleyicidir.",
      "Lineer ısı köprüleri ayrı makaledeki ψ yaklaşımıyla kontrol edilmelidir."
    )),
    section("saha", "Hesaplanan kesitin sahadaki karşılığını doğrulayın", phase7Lines(
      "Yalıtım kalınlığı, levha derzleri, pencere-kasa dönüşleri, balkon/döşeme alnı ve tesisat geçişleri uygulama kontrolüne taşınmalıdır. Özellikle betonarme yüzeylerde yalıtımın kesilmesi hesap modelini bozar.",
      "Malzeme sevkinde ürün etiketi ve beyan edilen teknik özellikler projeyle karşılaştırılmalı; farklı λ sınıfında ürün kullanılırsa hesap yeniden değerlendirilmelidir.",
      "Kalite kontrol yalnız 'kaç santimetre yalıtım var?' sorusuna indirgenmemelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Proje tarihinde yürürlükteki TS 825 sürümü doğrulandı mı?",
      "- [ ] Yer için güncel 6 iklim bölgesinden doğru sınıf seçildi mi?",
      "- [ ] d ve λ aynı birim sistemiyle kullanıldı mı?",
      "- [ ] Rsi, Rse ve bütün katmanlar hesaba katıldı mı?",
      "- [ ] U sınırı lisanslı güncel standarda göre kontrol edildi mi?",
      "- [ ] Yoğuşma kontrolü U hesabından ayrı yürütüldü mü?",
      "- [ ] Isı köprüleri ayrıca değerlendirildi mi?",
      "- [ ] Sahadaki ürün ve detaylar hesap kesitiyle eşleşiyor mu?"
    )),
  ],
  references: bepPhase7References("U değeri, yoğuşma ve TS 825 proje kontrolü"),
  keywords: ["TS 825", "U değeri", "R=d/λ", "U=1/RT", "yoğuşma", "ısı yalıtımı"],
  tags: ["BEP", "TS 825", "U Değeri", "Yoğuşma", "Bina Kabuğu"],
};

const TS825_HEAT_LOSS: DepremPhase7Override = {
  slug: "bep-ts-825-yontemi-isi-kaybi-hesabi",
  title: "TS 825 Yöntemiyle Isı Kaybı: Kabuktan Bina Enerji Dengesine",
  description: "Isı kaybını U×A toplamından başlayıp lineer köprüler, havalandırma, iklim verisi ve güncel BEP-TR koordinasyonuna taşıyan mühendislik iş akışını açıklar.",
  seoTitle: "TS 825 Isı Kaybı Hesabı | U×A, Isı Köprüsü ve İklim Verisi",
  seoDescription: "TS 825 ısı kaybı yaklaşımı, ΣUA, ψL, havalandırma, 2025 iklim bölgeleri ve BEP-TR metodolojisiyle proje kontrolü.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "16 dk okuma",
  relatedSlugs: ["bep-isi-yalitim-u-degeri-yogusma-kontrolu", "bep-isil-kopru-detaylari-ve-cozum-yontemleri", "bep-yazilimi-hesaplama-akisi"],
  sections: [
    section("denge", "Isı kaybı tek bir duvar U değerinin sonucu değildir", phase7Lines(
      "Bina kabuğundaki iletim kaybı dış duvar, pencere, çatı, döşeme ve diğer sınır elemanlarının alanlarıyla birlikte değerlendirilir. Basit mühendislik kontrolünde alan bileşeni `Σ(U_i A_i)` olarak izlenir; lineer köprüler ve hava değişimi ayrı katkılardır.",
      "Sembolik toplam iletim katsayısı `H_T = Σ(U_i A_i) + Σ(ψ_k l_k) + Σχ_j` biçiminde yazılabilir. Nihai TS 825/BEP hesabı ise güncel hesap yönteminin iklim, kullanım ve dönemsel enerji dengesi kabullerini içerir.",
      "Yanlış yaklaşım, yalnız dış duvar U değerini küçültüp binanın tüm enerji performansının çözüldüğünü varsaymaktır."
    )),
    section("kabuk-envanteri", "Önce ısıtılan hacmin sınırını ve kabuk envanterini kapatın", phase7Lines(
      "Hesapta hangi yüzeyin dış havaya, toprağa, ısıtılmayan hacme veya başka bir koşula baktığı doğru sınıflandırılmalıdır. Aynı eleman tipi farklı sınır koşullarında farklı hesap girdisi gerektirebilir.",
      "Her yüzey için `eleman tipi — alan A — U — sınır koşulu — yönelim — kaynak` tablosu oluşturmak model denetimini kolaylaştırır. Pencere/kapı boşluklarının brüt ve net alan yöntemleri karıştırılmamalıdır.",
      "| Eleman | Temel girdi | Kontrol |\n|---|---|---|\n| Duvar/çatı/döşeme | U, A | katman ve alan |\n| Açıklık | U, A | ürün ve geometri |\n| Lineer birleşim | ψ, l | detay sürekliliği |"
    )),
    section("iklim", "İklim girdisini eski dört bölgeli ezberden değil güncel kaynaktan alın", phase7Lines(
      "1 Nisan 2025 sonrası TS 825 yaklaşımında iklim bölgeleri **6 sınıfa** çıkarılmıştır. Proje konumu ve güncel iklim verisi, hesap modelinin temel girdisidir.",
      "Bakanlığın 2025 BEP-TR metodoloji güncellemesinde kullanılan meteorolojik veri altyapısının yaklaşık **84 istasyondan 730 civarına** genişletildiği açıklanmıştır. Bu değişiklik konuma duyarlı enerji hesabının önemini artırır.",
      "Eski Excel şablonundaki il bazlı sabit iklim kabulleri, yeni proje için güncel yöntemin yerine kullanılamaz."
    )),
    section("beptr", "TS 825 kabuk hesabını BEP-TR enerji performansı hesabıyla karıştırmayın", phase7Lines(
      "TS 825 bina kabuğu ve ısıl performans için kritik bir standarttır; BEP-TR ise bina enerji performansını daha geniş bir sistem içinde değerlendirir. Isıtma, soğutma, havalandırma, sıcak su, aydınlatma ve ilgili üretim sistemleri enerji performansı hesabında birlikte rol oynayabilir.",
      "25 Nisan 2025 tarihli Ulusal Hesaplama Yöntemi değişikliği **30 Haziran 2025** itibarıyla yeni ruhsat alacak binalar için güncellenen BEP-TR metodolojisini devreye aldı.",
      "Bu nedenle `TS 825 uygun = EKB sonucu otomatik uygun` şeklinde bir kestirme kurulamaz."
    )),
    section("duyarlilik", "Ön tasarımda hangi girdinin sonucu sürüklediğini görün", phase7Lines(
      "Ön fizibilitede U değerleri, pencere oranı, lineer köprüler ve hava sızdırmazlığı gibi parametreler ayrı senaryolarla değiştirilebilir. Amaç resmi BEP-TR hesabının yerine geçmek değil, hangi tasarım kararının enerji talebini sürüklediğini erken aşamada görmektir.",
      "Örneğin 100 m² dış duvar alanında U değerinin varsayımsal olarak 0,50'den 0,35 W/(m²K)'ye düşmesi, yalnız `UA` bileşeninde 50'den 35 W/K'ye değişim üretir. Bu 15 W/K fark, toplam bina sonucunun yalnız bir parçasıdır.",
      "Sayısal senaryolar resmi sınır veya sınıf değeri olarak yorumlanmamalıdır."
    )),
    section("model-kontrol", "Hesap dosyası ile mimari revizyonu aynı sürümde tutun", phase7Lines(
      "Cephe alanı, pencere tipi, kullanım zonu veya mekanik sistem değiştiğinde enerji modeli de revize edilmelidir. Mimari pafta Rev.05 iken enerji modelinin Rev.02 geometrisiyle kalması en sık izlenebilirlik sorunlarından biridir.",
      "Kaynak dosyada ruhsat tarihi, konum, kabuk eleman listesi, ürün verileri, hesap yazılımı sürümü ve sonuç belgesi birbirine bağlanmalıdır.",
      "Model değişiklik kaydı, özellikle EKB üretiminden önce son koordinasyon kapısı olarak kullanılmalıdır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Isıtılan/koşullandırılan hacim sınırı doğru tanımlandı mı?",
      "- [ ] Tüm kabuk elemanlarının A ve U değerleri doğrulandı mı?",
      "- [ ] `Σ(U_i A_i)` ve lineer `Σ(ψ_k l_k)` katkıları ayrı izlendi mi?",
      "- [ ] Proje konumu güncel 6 iklim bölgesi yaklaşımıyla eşleştirildi mi?",
      "- [ ] 30 Haziran 2025 sonrası ruhsat için güncel BEP-TR metodolojisi kullanıldı mı?",
      "- [ ] Eski meteoroloji/Excel kabulleri otomatik taşınmadı mı?",
      "- [ ] Mimari ve enerji modeli aynı revizyonda mı?",
      "- [ ] Sonuçlar resmi yöntem ve yazılım üzerinden doğrulandı mı?"
    )),
  ],
  references: bepPhase7References("TS 825 ısı kaybı, iklim verisi ve BEP-TR koordinasyonu"),
  keywords: ["TS 825", "ısı kaybı", "H_T", "ΣUA", "BEP-TR", "730 meteoroloji istasyonu"],
  tags: ["BEP", "TS 825", "Isı Kaybı", "Enerji Dengesi", "BEP-TR"],
};

const EKB: DepremPhase7Override = {
  slug: "bep-enerji-kimlik-belgesi-a-g-siniflandirma",
  title: "Enerji Kimlik Belgesi A–G Sınıflandırması: Sonucu Doğru Okuma",
  description: "EKB'nin A–G sınıflandırmasını, referans bina yaklaşımını, BEP-TR girdilerini ve 2026 düşük karbon düzenlemelerini birbirinden ayırarak açıklar.",
  seoTitle: "Enerji Kimlik Belgesi A–G | BEP-TR Sınıflandırma Rehberi",
  seoDescription: "EKB A–G sınıfları, BEP-TR referans bina yaklaşımı, enerji ve sera gazı performansı, 2025 metodoloji güncellemesi ve 2026 düşük karbon düzenlemesi.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "15 dk okuma",
  relatedSlugs: ["bep-yazilimi-hesaplama-akisi", "bep-ts-825-yontemi-isi-kaybi-hesabi", "bep-yenilenebilir-enerji-zorunlulugu-1000m2"],
  sections: [
    section("belge", "EKB, tek cihaz veriminden değil bütün bina enerji modelinden üretilir", phase7Lines(
      "Enerji Kimlik Belgesi, binanın enerji performansı ve sera gazı emisyon performansı gibi sonuçları standartlaştırılmış hesap yaklaşımıyla sınıflandırır. Sonuç yalnız kazan verimi veya duvar U değeri değildir.",
      "BEP-TR modelinde bina geometrisi, kabuk, kullanım, mekanik-elektrik sistemler ve ilgili üretim girdileri birlikte değerlendirilir. Bu nedenle aynı U değerine sahip iki bina farklı sistemler nedeniyle farklı sonuç verebilir.",
      "Yanlış yaklaşım, bir ürün kataloğundaki enerji etiketini bina EKB sınıfıyla eş anlamlı kabul etmektir."
    )),
    section("a-g", "A–G sınıfını bir sonuç etiketi olarak, girdileri ise ayrı denetim katmanı olarak okuyun", phase7Lines(
      "EKB'de **A–G** ölçeği performans sonucunu görünür kılar; ancak mühendislik denetimi sınıf harfinden geriye doğru model girdilerini de incelemelidir. Sınıfın doğruluğu, girilen alanların, zonların ve sistem verilerinin doğruluğuna bağlıdır.",
      "Proje kontrolünde `geometri — kabuk — sistem — yenilenebilir üretim — sonuç sınıfı` zinciri izlenebilir tutulmalıdır.",
      "| Katman | Örnek kontrol |\n|---|---|\n| Geometri | alan, hacim, yönelim |\n| Kabuk | U, açıklık, köprü |\n| Sistem | ısıtma/soğutma/SSS/aydınlatma |\n| Sonuç | enerji ve emisyon sınıfı |"
    )),
    section("2025-metodoloji", "30 Haziran 2025 sonrası yeni ruhsatlarda güncel BEP-TR yöntemini esas alın", phase7Lines(
      "Bakanlık, 25 Nisan 2025 tarihli Tebliğ değişikliğinin **30 Haziran 2025** itibarıyla yeni ruhsat alacak binalar için uygulanacağını açıkladı. Referans bina kriterleri de yeni TS 825 gereklilikleriyle uyumlu hale getirildi.",
      "Bu nedenle eski bir EKB hesap dosyasını yalnız bina adını değiştirerek yeni projeye taşımak teknik olarak güvenilir değildir.",
      "Ruhsat tarihi, kullanılan BEP-TR metodoloji sürümüyle birlikte dosyada kayıt altına alınmalıdır."
    )),
    section("dusuk-karbon", "2026 düzenlemesindeki Düşük Karbonlu Bina Belgesini EKB'den ayrı ama bağlantılı okuyun", phase7Lines(
      "ÇŞİDB'nin **16 Mayıs 2026** açıklamasına göre Düşük Karbonlu Bina Belgesi için EKB'de sera gazı emisyon sınıfının **en az B**, enerji performans sınıfının ise **en az C** olması öngörülmüştür.",
      "Bu kriter EKB'nin A–G mantığını ortadan kaldırmaz; belirli bir yeni belge için EKB sonuçlarını eşik olarak kullanır.",
      "Proje tarihindeki yürürlük ve geçiş hükümleri ayrıca kontrol edilmelidir; haber metni tek başına bütün proje mevzuat dosyasının yerine geçmez."
    )),
    section("hatalar", "EKB sınıfını etkileyebilecek model hatalarını sonuçtan önce yakalayın", phase7Lines(
      "Yanlış zon alanı, eski pencere verisi, projede olmayan PV kapasitesi, farklı mekanik cihaz veya eksik lineer köprü tanımı sonucu yapay biçimde değiştirebilir. Bu hatalar sınıf harfi çıktıktan sonra değil girdi kontrolünde yakalanmalıdır.",
      "Enerji modelindeki her kritik girdinin mimari/mekanik/elektrik proje kaynağı bulunmalı ve sürümü kaydedilmelidir.",
      "Belge üretildikten sonra yapılan esaslı proje değişiklikleri de yeniden değerlendirme gerektirebilir."
    )),
    section("teslim", "Belgeyi proje kapanışının izlenebilir bir çıktısı haline getirin", phase7Lines(
      "EKB dosyasında kullanılan proje revizyonları, ürün/sistem kabulleri ve sonuç çıktısı tek teslim paketi halinde tutulmalıdır. Böylece yapı kullanma izin aşamasında hesap ile gerçekleşen imalat arasındaki farklar daha kolay görülebilir.",
      "Yetkili uzman ve resmi sistem süreçleri mevzuatın öngördüğü şekilde yürütülmelidir; bu makale belge düzenleme yetkisinin yerine geçmez.",
      "Kontrol hedefi yalnız 'belge var mı?' değil, belgenin doğru proje verisiyle üretilmiş olmasıdır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Ruhsat tarihine uygun BEP-TR metodolojisi seçildi mi?",
      "- [ ] Geometri, kabuk ve sistem girdileri güncel proje revizyonundan mı?",
      "- [ ] A–G sonucu ile model girdileri arasında izlenebilirlik var mı?",
      "- [ ] Referans bina yaklaşımı güncel yönteme göre mi?",
      "- [ ] Enerji ve sera gazı performansı birbirinden doğru ayrıldı mı?",
      "- [ ] 2026 düşük karbon kriterleri proje tarihindeki yürürlük hükümleriyle kontrol edildi mi?",
      "- [ ] EKB sonucu yetkili süreçte üretildi mi?",
      "- [ ] Son imalat değişiklikleri belgeye yansıtıldı mı?"
    )),
  ],
  references: bepPhase7References("EKB A–G sınıflandırması, BEP-TR ve düşük karbon bağlantısı"),
  keywords: ["Enerji Kimlik Belgesi", "A–G", "BEP-TR", "referans bina", "Düşük Karbonlu Bina Belgesi"],
  tags: ["BEP", "EKB", "A–G", "BEP-TR", "Düşük Karbon"],
};

const RENEWABLE: DepremPhase7Override = {
  slug: "bep-yenilenebilir-enerji-zorunlulugu-1000m2",
  title: "BEP'te Yenilenebilir Enerji Gerekliliği: Eşiği Proje Tarihiyle Doğrulama",
  description: "Yenilenebilir enerji gerekliliğini bina alanı, ruhsat tarihi, güncel BEP-TR yöntemi ve sistem katkısının gerçekten hesap modeline işlenmesi üzerinden açıklar.",
  seoTitle: "BEP Yenilenebilir Enerji Gerekliliği | Alan, Ruhsat Tarihi ve BEP-TR",
  seoDescription: "Binalarda yenilenebilir enerji gerekliliğini eski sabit eşik ezberinden ayıran; ruhsat tarihi, BEP-TR ve proje doğrulamasına dayalı mühendislik rehberi.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["bep-yazilimi-hesaplama-akisi", "bep-enerji-kimlik-belgesi-a-g-siniflandirma", "bep-ts-825-yontemi-isi-kaybi-hesabi"],
  sections: [
    section("karar", "Route adındaki eski eşik, güncel mevzuatın kendisi değildir", phase7Lines(
      "Bu makalenin kalıcı URL'sinde `1000m2` ifadesi bulunması, her proje için güncel zorunluluğun otomatik olarak 1000 m² olduğu anlamına gelmez. Yenilenebilir enerji gerekliliği **ruhsat tarihi**, bina kullanım/alan koşulları ve yürürlükteki Binalarda Enerji Performansı düzenlemeleri üzerinden doğrulanmalıdır.",
      "Mevzuat zaman içinde eşik, oran ve yöntem değiştirebildiği için eski ofis notundaki tek sayıyı kalıcı kural gibi kullanmak doğru değildir.",
      "Yanlış yaklaşım, SEO/route metnini source-of-truth mevzuat kabul etmektir."
    )),
    section("is-akisi", "Kararı dört adımda kurun: kapsam → tarih → gereklilik → hesap modeli", phase7Lines(
      "Önce binanın BEP kapsamındaki durumu ve kullanım türü belirlenir. İkinci adımda ruhsat tarihiyle geçiş hükümleri eşleştirilir. Üçüncü adımda güncel yenilenebilir enerji gerekliliği kontrol edilir. Son adımda seçilen sistem BEP-TR hesabında gerçek teknik verileriyle modellenir.",
      "| Adım | Sorulacak soru |\n|---|---|\n| 1 | Bina hangi kapsamda? |\n| 2 | Ruhsat tarihi hangi düzenlemeye tabi? |\n| 3 | Güncel eşik/oran ne? |\n| 4 | Sistem BEP-TR modeline doğru işlendi mi? |",
      "Bu zincir, mevzuat değiştiğinde yalnız sayı değil karar mantığının da korunmasını sağlar."
    )),
    section("sistem", "PV, güneş ısıl, rüzgâr veya başka sistemleri aynı performans göstergesi sanmayın", phase7Lines(
      "Yenilenebilir sistemin türü, ürettiği enerji biçimi, yıllık üretim profili ve hangi bina tüketimine mahsup edildiği hesap sonucunu etkiler. Kurulu güç tek başına yıllık katkıyı açıklamaz.",
      "Örneğin yalnız fizik ilişkisini göstermek için `40 kWp` bir PV sisteminde özgül üretim varsayımı `1.350 kWh/kWp-yıl` alınırsa yıllık teorik üretim `54.000 kWh/yıl` olur. Bu değer mevzuat eşiği değildir; gölgelenme, yönelim, sistem kayıpları ve konumla değişen bağımsız bir örnektir.",
      "Proje hesabında gerçek sistem verisi ve BEP-TR'nin kabul ettiği modelleme yöntemi kullanılmalıdır."
    )),
    section("2025", "2025 BEP-TR metodoloji değişikliğini eski hesap şablonlarından ayırın", phase7Lines(
      "30 Haziran 2025 sonrası yeni ruhsatlarda güncellenen BEP-TR metodolojisi kullanılmaktadır. Bakanlık açıklaması bina bazlı rüzgâr enerji sistemlerinin de enerji performansı hesabında yer alabileceğini belirtir.",
      "Bu değişiklik, eski bir BEP-TR çıktı formatındaki yenilenebilir enerji alanlarının bugünkü hesapla birebir aynı olduğunu varsaymayı riskli hale getirir.",
      "Yazılım sürümü ve hesap yöntemi proje kaynak kayıtlarında belirtilmelidir."
    )),
    section("entegrasyon", "Yenilenebilir enerji kararı mimari, statik ve elektrik projeden bağımsız değildir", phase7Lines(
      "Çatı PV yerleşimi taşıyıcı kapasite, rüzgâr etkisi, yangın erişimi, parapet/gölgeleme, kablo güzergâhı ve inverter yerleşimiyle koordine edilmelidir. Sadece enerji modelinde sistem tanımlamak uygulanabilir proje üretmez.",
      "Çatı kullanımı revize edilirse panel alanı veya üretim tahmini de değişebilir. Aynı değişiklik enerji modeline ve EKB sonucuna yansıtılmalıdır.",
      "Mühendislik kontrolü enerji performansı ile fiziksel uygulanabilirliği birlikte kapatmalıdır."
    )),
    section("kaynak", "Sabit eşikleri koddan değil sürümlü mevzuat/veri katmanından yönetin", phase7Lines(
      "Bir hesap aracı geliştiriliyorsa alan eşiği, oran veya geçiş tarihi formül koduna gömülmemelidir. `effectiveFrom`, `effectiveTo`, kapsam, kaynak URL'si ve doğrulama tarihi gibi meta verilerle sürümlenmelidir.",
      "Böylece yeni bir Resmî Gazete değişikliği geldiğinde hesap motoru değil kural veri katmanı güncellenebilir.",
      "Bu yaklaşım yanlış mevzuat sürümüyle sessiz hesap üretme riskini azaltır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Bina BEP kapsamı ve kullanım türü doğrulandı mı?",
      "- [ ] Ruhsat tarihi geçiş hükümleriyle eşleştirildi mi?",
      "- [ ] Güncel yenilenebilir enerji eşiği/oranı resmi kaynaktan kontrol edildi mi?",
      "- [ ] Route adındaki `1000m2` güncel kural varsayılmadı mı?",
      "- [ ] Sistem türü ve gerçek üretim verileri BEP-TR modeline işlendi mi?",
      "- [ ] Enerji modeli çatı/elektrik/statik projeyle koordine edildi mi?",
      "- [ ] Yazılımda mevzuat kuralları sürümlü veri katmanında mı?",
      "- [ ] EKB sonucu son sistem tasarımına göre yeniden doğrulandı mı?"
    )),
  ],
  references: bepPhase7References("yenilenebilir enerji gerekliliği, geçiş tarihi ve BEP-TR modellemesi"),
  keywords: ["yenilenebilir enerji", "BEP-TR", "ruhsat tarihi", "PV", "1000 m²", "enerji performansı"],
  tags: ["BEP", "Yenilenebilir Enerji", "BEP-TR", "PV", "Mevzuat Sürümü"],
};

const BEPTR_FLOW: DepremPhase7Override = {
  slug: "bep-yazilimi-hesaplama-akisi",
  title: "BEP-TR Yazılımında Hesaplama Akışı: Girdiden EKB Sonucuna",
  description: "BEP-TR hesabını proje geometrisi, kabuk, zon, sistem, iklim ve sonuç doğrulaması aşamalarına ayırır; 2025 metodoloji değişikliği ve 2026 yaşam döngüsü bağlantısını açıklar.",
  seoTitle: "BEP-TR Hesaplama Akışı | Girdi, Referans Bina ve EKB Kontrolü",
  seoDescription: "BEP-TR yazılımında geometri, kabuk, zon, mekanik sistem, yenilenebilir enerji, referans bina ve EKB sonucunun doğrulanması için mühendislik akışı.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "17 dk okuma",
  relatedSlugs: ["bep-enerji-kimlik-belgesi-a-g-siniflandirma", "bep-ts-825-yontemi-isi-kaybi-hesabi", "bep-yenilenebilir-enerji-zorunlulugu-1000m2"],
  sections: [
    section("model", "BEP-TR'yi form doldurma ekranı değil, sürümlü bir bina enerji modeli olarak görün", phase7Lines(
      "BEP-TR sonucu, birbirine bağlı çok sayıda girdinin ürünüdür. Geometri, kullanım zonları, kabuk, açıklıklar, mekanik-elektrik sistemler ve yenilenebilir üretim yanlışsa yazılımın matematiksel olarak tamamlanması doğru mühendislik sonucu üretmez.",
      "Bu nedenle hesap akışı `kaynak proje → model girdisi → hesap → sonuç → belge` şeklinde izlenebilir kurulmalıdır.",
      "Yanlış yaklaşım, önceki projedeki modeli kopyalayıp yalnız bina adı ve alanını değiştirerek hesap almaktır."
    )),
    section("girdi", "Girdi paketini hesap başlamadan dondurun", phase7Lines(
      "Minimum girdi paketi; güncel mimari plan/kesit, kabuk katmanları, açıklık özellikleri, kullanım zonları, mekanik sistem şeması/verimleri, sıcak su ve aydınlatma verileri ile varsa yenilenebilir enerji sistemlerini içermelidir.",
      "Her girdide kaynak proje revizyonu belirtilirse sonradan değişen bir pencere veya cihazın hesaba yansıyıp yansımadığı denetlenebilir.",
      "| Girdi grubu | Örnek | Kaynak |\n|---|---|---|\n| Geometri | alan, hacim, yönelim | mimari |\n| Kabuk | U, açıklık, köprü | mimari/yalıtım |\n| Sistem | verim, kapasite, kontrol | mekanik/elektrik |\n| Üretim | PV/rüzgâr vb. | elektrik/enerji |"
    )),
    section("iklim-referans", "İklim ve referans bina katmanını yazılım varsayılanına bırakmayın", phase7Lines(
      "2025 metodoloji güncellemesinde meteorolojik veri altyapısının yaklaşık **84'ten 730 civarındaki istasyona** genişletildiği ve referans bina kriterlerinin güncel TS 825 gereklilikleriyle uyumlu hale getirildiği Bakanlıkça açıklandı.",
      "Proje konumunun ve **referans bina** yönteminin doğru seçilmesi, gerçek bina ile referans karşılaştırmasının anlamlı olması için zorunludur.",
      "Eski yazılım sürümünden taşınan iklim verisi güncel sürümde sessizce doğru kabul edilmemelidir."
    )),
    section("hesap", "30 Haziran 2025 metodoloji sınırını proje tarihine bağlayın", phase7Lines(
      "25 Nisan 2025 tarihli Tebliğ değişikliğiyle güncellenen yöntem **30 Haziran 2025** itibarıyla yeni ruhsat alacak binalarda uygulanmaya başladı. Bu tarih model kaynak dosyasında açıkça tutulmalıdır.",
      "Hesap sırasında yazılım uyarıları, eksik veri varsayımları ve otomatik atanan değerler kaydedilmelidir. Varsayılan değerin mevcut olması onun projeye uygun olduğu anlamına gelmez.",
      "Sonuç üretilmeden önce kritik girdiler için ikinci göz kontrolü uygulanması hata riskini azaltır."
    )),
    section("sonuc", "Sonuç ekranını proje girdilerine geri bağlayarak doğrulayın", phase7Lines(
      "Enerji performans sınıfı, emisyon sınıfı ve diğer çıktıların makul olup olmadığı önce fiziksel beklentiyle karşılaştırılmalıdır. Örneğin kabuk iyileştirilirken talebin ters yönde büyük değişmesi modelde başka bir girdinin değiştiğine işaret edebilir.",
      "Duyarlılık kontrolü resmi hesabın yerine geçmez; sonuç anomalilerini yakalamak için kalite güvence aracıdır.",
      "EKB üretiminden önce model ile son mimari/mekanik/elektrik revizyonu eşleştirilmelidir."
    )),
    section("2027", "BEP-TR ekosisteminin 2027 yaşam döngüsü belgesi bağlantısını ayrı süreç olarak izleyin", phase7Lines(
      "ÇŞİDB'nin 16 Mayıs 2026 açıklamasına göre **1 Ocak 2027** tarihinden itibaren yapı ruhsatı alacak ve yapı inşaat alanı **10.000 m²** ve üzeri olan binalarda, yapı kullanma izin aşamasında EKB ile birlikte **Bina Yaşam Döngüsü Analizi Belgesi** sunulması öngörülmektedir.",
      "Bakanlık açıklaması analizlerin BEP-TR sistemi üzerinden gerçekleştirileceğini belirtir. Bu süreç operasyonel enerji hesabıyla yaşam döngüsü emisyon hesabını aynı kavram yapmaz; ikisi bağlantılı fakat farklı çıktı katmanlarıdır.",
      "Proje zaman çizelgesinde ruhsat ve yapı kullanma izin tarihleri bu yeni belge süreci açısından ayrıca izlenmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Kaynak proje revizyonları hesap başlamadan kaydedildi mı?",
      "- [ ] Geometri, zon, kabuk ve sistem girdileri birbirleriyle tutarlı mı?",
      "- [ ] Proje konumu ve güncel iklim verisi doğrulandı mı?",
      "- [ ] Referans bina yaklaşımı güncel metoda göre mi?",
      "- [ ] 30 Haziran 2025 geçişi ruhsat tarihiyle kontrol edildi mi?",
      "- [ ] Yazılım varsayılanları tek tek doğrulandı mı?",
      "- [ ] Sonuçlar fiziksel duyarlılık ve son proje revizyonuyla kontrol edildi mi?",
      "- [ ] 2027'de 10.000 m² ve üzeri projelerde yaşam döngüsü belgesi süreci ayrıca planlandı mı?"
    )),
  ],
  references: bepPhase7References("BEP-TR hesaplama akışı, referans bina ve 2027 belge bağlantısı"),
  keywords: ["BEP-TR", "referans bina", "EKB", "730 meteoroloji istasyonu", "Bina Yaşam Döngüsü Analizi", "10.000 m²"],
  tags: ["BEP", "BEP-TR", "Hesap Modeli", "EKB", "Yaşam Döngüsü"],
};

const THERMAL_BRIDGE: DepremPhase7Override = {
  slug: "bep-isil-kopru-detaylari-ve-cozum-yontemleri",
  title: "Isıl Köprü Detayları: ψ Değerinden Uygulama Sürekliliğine",
  description: "Kolon-kiriş, balkon, döşeme alnı ve açıklık çevresindeki lineer ısıl köprüleri ψ değeri, kayıp hesabı ve şantiye detayı üzerinden açıklar.",
  seoTitle: "Isıl Köprü ψ Değeri | Balkon, Döşeme Alnı ve Detay Çözümleri",
  seoDescription: "ΣUA + ΣψL yaklaşımı, lineer ısıl köprüler, balkon-döşeme alnı, kolon-kiriş ve pencere çevresi detaylarının enerji hesabı ve uygulama kontrolü.",
  updatedAt: PHASE7_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["bep-isi-yalitim-u-degeri-yogusma-kontrolu", "bep-ts-825-yontemi-isi-kaybi-hesabi", "bep-yazilimi-hesaplama-akisi"],
  sections: [
    section("tanim", "Isıl köprü, düz alan U hesabının bozulduğu birleşim bölgesidir", phase7Lines(
      "Geometrinin veya malzeme sürekliliğinin değiştiği birleşimlerde ısı akısı tek boyutlu kabulden sapar. Betonarme döşeme alnı, balkon plağı, kolon-kiriş çevresi, parapet, köşe ve pencere-kasa birleşimleri tipik **lineer ısıl köprü** bölgeleridir.",
      "Lineer ısı geçirgenliği **ψ [W/(mK)]**, birleşimin düz alan U hesabına ek getirdiği ısı kaybını birim uzunluk başına ifade eder. Noktasal bağlantılarda `χ [W/K]` terimi gerekebilir.",
      "Yanlış yaklaşım, bütün cepheyi tek ortalama U değeriyle temsil edip birleşim etkilerini görünmez saymaktır."
    )),
    section("denklem", "Alan, lineer ve noktasal katkıları ayrı izleyin", phase7Lines(
      "Bina kabuğunun iletim bileşeni kontrol amacıyla `H_T = Σ(U_i A_i) + Σ(ψ_k l_k) + Σχ_j` biçiminde ayrıştırılabilir. Burada U alan elemanını, ψ birleşim uzunluğunu ve χ noktasal geçişi temsil eder.",
      "Yalnız yöntem örneği: `ψ=0,08 W/(mK)` ve `l=12 m` kabul edilirse lineer katkı `ψ·l = 0,96 W/K` olur. Bu değer resmi hesap yöntemindeki ilgili toplamın bir girdisidir; evrensel bir sınır değildir.",
      "| Bileşen | İfade | Birim |\n|---|---|---:|\n| Düz alan | U × A | W/K |\n| Lineer köprü | ψ × l | W/K |\n| Noktasal köprü | χ | W/K |"
    )),
    section("model", "ψ değerini birleşim geometrisinden bağımsız katalog sabiti sanmayın", phase7Lines(
      "ψ değeri referans düzlemi, geometri, malzeme iletkenlikleri ve sınır şartlarına bağlıdır. Aynı 'balkon detayı' farklı kesit ve yalıtım sürekliliğinde farklı sonuç verebilir.",
      "Gerekli durumda iki boyutlu/üç boyutlu ısı akısı hesabı, güncel TS 825/BEP-TR yaklaşımı ve atıf yapılan standartlarla yürütülmelidir. Telifli standardın tabloları kaynaksız çoğaltılmamalıdır.",
      "Hesap modeliyle uygulama detayı aynı değilse sayısal ψ değerinin proje anlamı kalmaz."
    )),
    section("kritik", "Önce uzun ve iletken birleşimleri tarayın", phase7Lines(
      "Döşeme alnı ve balkon hatları uzunlukları; kolon-kiriş yüzleri yüksek iletkenlikleri; pencere çevreleri ise hem uzunluk hem montaj boşlukları nedeniyle kritik olabilir.",
      "Detay envanteri `birleşim tipi — uzunluk — yalıtım sürekliliği — ψ kaynağı — çözüm detayı` şeklinde tutulabilir.",
      "Birleşim uzunluğu yanlış ölçülürse doğru ψ değeri kullanılsa bile toplam kayıp yanlış çıkar."
    )),
    section("cozum", "Çözüm prensibi ısı akış yolunu kesintisiz dirençle kontrol etmektir", phase7Lines(
      "Dıştan sürekli yalıtım, döşeme alnı dönüşü, pencere kasası çevresinde yalıtım sürekliliği ve balkon için uygun termal kırıcı/detail çözümleri ısı akış yolunu iyileştirebilir. Her çözüm statik, yangın, su yalıtımı ve cephe montajıyla koordine edilmelidir.",
      "Yalıtımı yalnız çizimde inceltmek veya birleşimde tamamen kesmek, ana duvar U değerini korusa bile lineer kaybı artırabilir.",
      "Detay çözümü yalnız enerji modelinde değil uygulama paftasında ölçülendirilebilir olmalıdır."
    )),
    section("saha", "Isıl köprüler kapatıldıktan sonra görünmez; kontrolü imalat sırasına yerleştirin", phase7Lines(
      "Cephe kapanmadan önce döşeme alnı, parapet, pencere çevresi ve ankraj bölgeleri fotoğraf/ölçü kontrolüyle doğrulanmalıdır. Sonradan kaplama sökmeden sürekliliği görmek zorlaşır.",
      "Şantiye kontrol formunda proje detay numarası ile gerçek imalat noktası eşleştirilirse hesap-model-saha zinciri izlenebilir olur.",
      "Revize detayın ψ hesabını etkileyip etkilemediği tasarım ekibine geri bildirilmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase7Lines(
      "- [ ] Düz alan U hesabı ile lineer köprü katkıları ayrıldı mı?",
      "- [ ] Her kritik birleşim için ψ ve uzunluk kaynağı tanımlı mı?",
      "- [ ] `Σ(ψ_k l_k)` toplamı enerji modeline doğru aktarıldı mı?",
      "- [ ] Balkon, döşeme alnı, kolon-kiriş ve pencere çevreleri tarandı mı?",
      "- [ ] Hesap geometrisiyle uygulama detayı aynı mı?",
      "- [ ] Çözüm statik/yangın/su yalıtımıyla koordine edildi mi?",
      "- [ ] Cephe kapanmadan saha sürekliliği kontrol edildi mi?",
      "- [ ] Revizyon sonrası enerji modeli güncellendi mi?"
    )),
  ],
  references: bepPhase7References("ısıl köprü, ψ değeri ve uygulama sürekliliği"),
  keywords: ["ısıl köprü", "ψ", "ΣψL", "0,96 W/K", "balkon", "döşeme alnı"],
  tags: ["BEP", "Isıl Köprü", "ψ Değeri", "Detay", "Bina Kabuğu"],
};

export const DEPREM_PHASE7_BATCH_1_ARTICLES = [
  U_VALUE_CONDENSATION,
  TS825_HEAT_LOSS,
  EKB,
  RENEWABLE,
  BEPTR_FLOW,
  THERMAL_BRIDGE,
] as const;
