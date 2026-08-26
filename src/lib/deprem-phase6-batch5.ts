import {
  ERISILEBILIRLIK_2025_GUIDE,
  ERISILEBILIRLIK_2026_CIRCULAR,
  ERISILEBILIRLIK_FORM,
  ERISILEBILIRLIK_MONITOR_REG,
  PA_IY_CURRENT,
  PHASE6_UPDATED_AT,
  YAPI_DENETIM_4708,
  engelsizPhase6References,
  phase6Lines,
  type DepremPhase6Override,
} from "./deprem-phase6-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const WHEELCHAIR: DepremPhase6Override = {
  slug: "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri",
  title: "Tekerlekli Sandalye Manevra Alanı ve Koridorlar: Kesintisiz Erişilebilir Güzergâh",
  description: "Erişilebilir dolaşımı tek bir kapı veya koridor ölçüsüne indirgemeden; net geçiş, 150 × 150 cm manevra alanı, kapı yaklaşımı ve proje koordinasyonu üzerinden açıklar.",
  seoTitle: "Tekerlekli Sandalye Manevra Alanı ve Koridor Genişliği",
  seoDescription: "Planlı Alanlar İmar Yönetmeliği Madde 5/22, Bakanlık erişilebilirlik rehberleri ve denetim formu ile net geçiş, 150 × 150 cm dönüş ve kesintisiz güzergâh kontrolü.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk okuma",
  relatedSlugs: ["engelsiz-rampa-egimi-korkuluk-yuzey-standartlari", "engelsiz-wc-asansor-kapi-boyutlari", "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu"],
  sections: [
    section("temel-kural", "Erişilebilirlik tek bir genişlik değil, kesintisiz güzergâh performansıdır", phase6Lines(
      "Planlı Alanlar İmar Yönetmeliği **Madde 5'in 22 nci fıkrası**, sahanlık, merdiven, asansör, kapı ve koridor ölçüleri ile rampa eğim ve genişliklerinin Yönetmelik minimumlarının altına düşmeden erişilebilirlik standartlarına uygun düzenlenmesini zorunlu tutar. Bu nedenle yalnız bir koridorun bir noktasında yeterli genişliği görmek, güzergâhın erişilebilir olduğunu kanıtlamaz.",
      "Kontrol parsel/yaya yaklaşımından başlar; bina giriş kapısı, antre, koridor, kapı yaklaşımı, asansör sahanlığı, ortak alan ve gerekli ıslak hacme kadar devam eder. Her düğümde net geçiş, dönüş ve kullanıcı yaklaşım alanı korunmalıdır.",
      "2026 denetim yaklaşımı da erişilebilirliği proje ve yerinde kullanım birlikte ele alınan bir performans konusu olarak izlemektedir."
    )),
    section("manevra", "150 cm × 150 cm manevra karesini plan üzerinde gerçek net alan olarak göster", phase6Lines(
      "Aile ve Sosyal Hizmetler Bakanlığının güncel rehberlerinde, tekerlekli sandalye manevrası gereken rampa başlangıç/bitişleri ve konut giriş/antre gibi düğümlerde **en az 150 cm × 150 cm** engelsiz alan temel tasarım kontrolü olarak kullanılır. Bu alan kapı kanadı, sabit mobilya, radyatör, kolon çıkıntısı veya tesisat dolabı tarafından işgal edilmemelidir.",
      "Manevra alanı yalnız çizimde boş bir kare değildir. Kapının açık konumu, kapı koluna yaklaşım, dönüş yönü ve güzergâhın devamındaki net genişlik birlikte modellenmelidir.",
      "| Düğüm | Kontrol | Tipik proje riski |\n|---|---|---|\n| Antre / giriş | 150 cm × 150 cm manevra | Vestiyer/kapı kanadı alanı daraltır |\n| Rampa başlangıç-bitiş | 150 cm × 150 cm düz alan | Eğim sahanlığa taşar |\n| Asansör önü | Kapı tipine göre net sahanlık + dönüş | Yangın dolabı/kapı çakışır |\n| Koridor-kapı düğümü | Net yaklaşım ve dönüş | Kolon veya tesisat şaftı geçişi boğar |"
    )),
    section("net-genislik", "Brüt duvar arası değil, kullanım anındaki net genişliği denetle", phase6Lines(
      "Bakanlığın 2025 tarihli konut erişilebilirliği rehberi dış yaya güzergâhlarında **150 cm net temiz genişlik** ve **220 cm** düşey engelsiz alan gibi ölçüleri açıkça verir. Bina içindeki koridor için ise proje türü ve güncel TS 9111 şartı ayrıca kontrol edilmelidir; dış güzergâhtaki 150 cm değerini bütün iç koridorlara otomatik taşımak doğru değildir.",
      "Kapılarda ve geçişlerde kritik kavram `net/temiz ölçü`dür. Sıva, kaplama, süpürgelik, kapı kasası, açık kapı kanadı, tutamak ve tesisat elemanları net ölçüyü etkileyebilir. Ruhsat projesinde teorik aks ölçüsü ile uygulamadaki net kullanım ölçüsü ayrı kontrol edilmelidir.",
      "Yanlış uygulama, tek bir nominal ölçüyü bütün dolaşım sisteminin yeterliliği gibi göstermektir."
    )),
    section("kapi-yaklasimi", "Kapı yaklaşımı ve dönüş alanını koridor geometrisinden ayrı düşünme", phase6Lines(
      "Bir kapı 90 cm net geçiş verebilir fakat kullanıcı kapı koluna yanaşamıyor, kanat açıldığında manevra alanını tüketiyor veya kapıdan sonra keskin dönüşte geçiş daralıyorsa güzergâh işlevsiz kalabilir. Bu nedenle kapı neti, kapı açılma yönü, yaklaşım yüzü ve manevra alanı tek plan detayı üzerinde gösterilmelidir.",
      "Yangın kapısı, duman kontrol kapısı veya otomatik kapı söz konusuysa erişilebilirlik ile yangın güvenliği arasında seçim yapılmaz; her iki sistemin gereklilikleri eşzamanlı sağlanır. Kapı kapatıcısının kuvveti ve eşik detayı da kullanım performansını etkiler."
    )),
    section("koordinasyon", "Mimari, statik ve tesisat koordinasyonunu net güzergâh üzerinden yap", phase6Lines(
      "Kolon/perde konumu, şaft, yangın dolabı, elektrik panosu, radyatör, kapı cebi ve mobilya nişleri erişilebilir koridoru sonradan daraltmamalıdır. Özellikle betonarme çekirdek geometrisi avan proje aşamasında erişilebilir sahanlık ve kapı yaklaşımı ile birlikte kilitlenmelidir.",
      "Uygulama projesinde bir `erişilebilir güzergâh katmanı` tutulması yararlıdır: rota çizgisi, kritik net genişlikler, 150 cm × 150 cm dönüş alanları, kot farkları ve kapı netleri aynı paftada görülebilir olmalıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonuçları", phase6Lines(
      "1. **Yanlış:** Duvarlar arası brüt ölçüyü net koridor genişliği saymak. **Sonuç:** uygulamada kaplama ve ekipmanlarla geçiş daralır.\n2. **Yanlış:** 150 cm × 150 cm manevra alanını kapı kanadıyla çakıştırmak. **Sonuç:** dönüş geometrisi fiilen çalışmaz.\n3. **Yanlış:** Dış yaya yolu için verilen 150 cm değerini bütün iç koridorlara evrensel kural gibi taşımak. **Sonuç:** proje türüne özgü standardın kontrolü atlanır.\n4. **Yanlış:** Yangın dolabı ve şaft kapaklarını erişilebilir rota üzerinde sonradan yerleştirmek. **Sonuç:** net geçiş ve yaklaşım alanı bozulur."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Güncel **Madde 5/22** ve proje türüne uygulanacak erişilebilirlik standardı kontrol edildi mi?",
      "- [ ] Güzergâh parsel girişinden hedef mahale kadar kesintisiz çizildi mi?",
      "- [ ] Kritik düğümlerde **150 cm × 150 cm** manevra alanı gerçek net alan olarak gösterildi mi?",
      "- [ ] Kapı, mobilya, kolon, şaft ve tesisat elemanları net geçişten düşüldü mü?",
      "- [ ] Dış güzergâhta **150 cm** net genişlik ve **220 cm** düşey engelsiz alan kontrol edildi mi?",
      "- [ ] İç koridor ölçüsü güncel TS 9111 ve yapı kullanımına göre ayrıca doğrulandı mı?",
      "- [ ] Uygulama sonrası as-built net ölçü kontrolü planlandı mı?"
    )),
  ],
  references: engelsizPhase6References("kesintisiz güzergâh, manevra ve net geçiş"),
  keywords: ["tekerlekli sandalye", "manevra alanı", "150 cm x 150 cm", "koridor", "net geçiş", "Madde 5"],
  tags: ["Engelsiz Tasarım", "Manevra", "Koridor", "Erişilebilir Güzergâh"],
};

const RAMP: DepremPhase6Override = {
  slug: "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari",
  title: "Engelsiz Rampalarda Eğim, Korkuluk ve Yüzey: Yeni Yapı–Mevcut Yapı Ayrımı",
  description: "Yeni tasarım rampaları ile mevcut yapı denetim değerlerini ayırır; eğim, uzunluk, 100 cm net genişlik, 150 × 150 cm sahanlık, küpeşte ve kaymaz yüzey koordinasyonunu açıklar.",
  seoTitle: "Engelsiz Rampa Eğimi | %8, %7, %6, %5 ve Sahanlık Kontrolü",
  seoDescription: "Yeni rampalarda Bakanlık kılavuzundaki %8/%7/%6/%5 eğim dizisi, mevcut yapı denetimindeki farklı değerler, 100 cm net genişlik ve 150 cm manevra alanı.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri", "engelsiz-yapi-ruhsatinda-uyum-kontrolu", "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari"],
  sections: [
    section("yeni-mevcut", "En kritik ayrım: yeni rampa ile mevcut yapı denetim toleransını karıştırma", phase6Lines(
      "Aile ve Sosyal Hizmetler Bakanlığının erişilebilirlik denetim formunda mevcut binalar için kullanılan rampa eğim değerlerinin **yeni yapılacak rampalar için geçerli olmadığı** açıkça belirtilir. Yeni tasarımda güncel erişilebilirlik standardı ve Bakanlığın yeni inşa için aktardığı kılavuz değerleri esas alınmalıdır.",
      "Bakanlığın 2025 rehberinde yeni inşa edilen alanlar için aktarılan dizi şöyledir: 15 cm ve daha az kot farkında **1:12 (%8)**; 16–50 cm arasında **1:14 (%7)**; 51–100 cm arasında **1:16 (%6)**; 101 cm üzerindeki kot farkında **1:20 (%5)**.",
      "Mevcut yapı izleme formundaki %10/%9/%8/%6 değerlerini yeni projede kullanmak yanlış ve daha dik bir rampa üretme riski taşır."
    )),
    section("egim-hesabi", "Eğim hesabını kot farkından rampa boyuna çevir", phase6Lines(
      "Temel geometrik bağıntı `eğim = H / L` biçimindedir. H düşey kot farkı, L rampanın yatay izdüşüm uzunluğudur. Yüzde eğim için oran 100 ile çarpılır.",
      "Örnek: girişte **H = 0,72 m** kot farkı varsa bu yükseklik 51–100 cm bandındadır ve yeni tasarım için rehberdeki azami eğim **%6 (1:16)** olarak verilir. Salt eğim açısından gereken yatay rampa boyu `L = 0,72 / 0,06 = 12,00 m` olur. Başlangıç/bitiş ve gerekiyorsa ara sahanlıklar bu 12,00 m'nin üzerine ayrıca yer ister.",
      "| Kot farkı H | Yeni inşa için Bakanlık rehberinde aktarılan azami eğim | Oran |\n|---:|---:|---:|\n| ≤ 15 cm | %8 | 1:12 |\n| 16–50 cm | %7 | 1:14 |\n| 51–100 cm | %6 | 1:16 |\n| > 100 cm | %5 | 1:20 |"
    )),
    section("genislik-sahanlik", "100 cm net rampa ve 150 cm × 150 cm manevra alanını birlikte çöz", phase6Lines(
      "Bakanlık rehber ve denetim dokümanlarında rampanın koruma bordürü ve tırabzan donanımları hariç **en az 100 cm net/temiz genişlikte** olması; başlangıç ve bitiminde tekerlekli sandalye manevrası için **en az 150 cm × 150 cm** düz alan bulunması öne çıkan kontrollerdir.",
      "Yön değiştiren rampada sahanlık, yalnız iki rampayı birbirine bağlayan geometrik kırık değildir; kullanıcının dönüş yapabildiği düz bir manevra alanıdır. Kapı açılımı, yağmur oluğu, kolon veya peyzaj elemanı bu alanı tüketmemelidir."
    )),
    section("korkuluk-yuzey", "Küpeşte, kenar güvenliği ve yüzeyi rampa geometrisinin parçası say", phase6Lines(
      "Bakanlığın 2025 rehberi, 15 cm'den fazla yükseklik aşılan rampalarda güvenli kenar çözümü ve iki yanda tutunma elemanlarını öngörür; küpeşte düzeyi **90 cm**, yeni yapılan rampalarda ikinci düzey **70 cm** olarak belirtilir. Tehlikeli kenarda duvar/parapet koruması bağlamında **110 cm** güvenlik yüksekliği de kontrol edilir.",
      "Yüzey düz, sabit ve dayanıklı; ıslak ve kuru durumda kaymayan nitelikte olmalıdır. Kayma direnci, drenaj ve yüzeyde su birikmesi birlikte düşünülmelidir."
    )),
    section("mimari-etki", "Erişilebilir rampa parsel ve giriş geometrisini doğrudan belirler", phase6Lines(
      "0,72 m kot farkında 12,00 m salt rampa boyu çıkması, erişilebilirliğin avan projeden sonra eklenemeyeceğini gösterir. Bahçe mesafesi, bina giriş kotu, otopark/yaya ayrımı, peyzaj ve yağmur suyu drenajı rampanın gerçek yer ihtiyacını belirler.",
      "Rampa sonradan sıkıştırılırsa eğim dikleşir, sahanlık küçülür veya güzergâh taşıt yoluyla çakışır. Bu nedenle kotlandırma kararı statik temel/perde ve mimari giriş çözümüyle birlikte verilir."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonuçları", phase6Lines(
      "1. **Yanlış:** Mevcut yapı denetimindeki %10 eğimi yeni yapı için kullanmak. **Sonuç:** yeni tasarım standardından daha dik rampa oluşabilir.\n2. **Yanlış:** Eğim hesabında yalnız rampa kolunu sığdırıp sahanlık alanını unutmamak yerine unutmak. **Sonuç:** dönüş ve dinlenme alanı kaybolur.\n3. **Yanlış:** 100 cm genişliği korkuluklar arasındaki gerçek net yerine kaba yapı ölçüsü almak. **Sonuç:** kullanım genişliği yetersiz kalır.\n4. **Yanlış:** Kaymazlık ve drenajı detaylandırmamak. **Sonuç:** geometrik olarak uygun rampa ıslakken güvenli çalışmaz."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Projenin yeni yapı mı mevcut yapı düzenlemesi mi olduğu ayrıldı mı?",
      "- [ ] Yeni tasarım için **1:12/%8, 1:14/%7, 1:16/%6, 1:20/%5** dizisi güncel kaynakla doğrulandı mı?",
      "- [ ] Rampa net genişliği en az **100 cm** olarak gösterildi mi?",
      "- [ ] Başlangıç/bitişte **150 cm × 150 cm** düz manevra alanı var mı?",
      "- [ ] 15 cm üzeri kot farkında 90 cm ve yeni rampada 70 cm ikinci küpeşte düzeyi kontrol edildi mi?",
      "- [ ] Tehlikeli kenarda 110 cm koruma çözümü ve kenar bordürü değerlendirildi mi?",
      "- [ ] Islak/kuru kaymaz yüzey ve drenaj detayı çizildi mi?"
    )),
  ],
  references: engelsizPhase6References("yeni/mevcut rampa, eğim, sahanlık ve küpeşte"),
  keywords: ["engelsiz rampa", "%8", "%7", "%6", "%5", "100 cm", "150 cm x 150 cm", "90 cm", "70 cm"],
  tags: ["Engelsiz Tasarım", "Rampa", "Eğim", "Küpeşte", "Sahanlık"],
};

const WC_LIFT_DOOR: DepremPhase6Override = {
  slug: "engelsiz-wc-asansor-kapi-boyutlari",
  title: "Engelsiz WC, Asansör ve Kapılar: Net Ölçü ve Kullanım Alanı Koordinasyonu",
  description: "WC dönüş/transfer alanını, kapı net geçişini ve asansör kabin-sahanlık ölçülerini tek erişilebilir güzergâh içinde koordine eder; ölçüleri kullanım alanından ayırır.",
  seoTitle: "Engelsiz WC, Asansör ve Kapı Ölçüleri | Net Geçiş Kontrolü",
  seoDescription: "90 cm kapı neti, 150 cm manevra alanı, asansörde 1,20 m/1,80 m² kabin ve 120/150 cm sahanlık kontrollerini proje koordinasyonu ile açıklar.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk okuma",
  relatedSlugs: ["engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri", "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu", "engelsiz-yapi-ruhsatinda-uyum-kontrolu"],
  sections: [
    section("zincir", "WC, kapı ve asansörü ayrı kutular değil aynı erişim zinciri olarak denetle", phase6Lines(
      "Bir erişilebilir WC'nin içinde yeterli alan olması, oraya ulaşan kapı veya asansör kullanılamıyorsa sonuç üretmez. Kontrol zinciri `erişilebilir güzergâh → kapı yaklaşımı → net kapı geçişi → asansör/sahanlık → WC manevra ve transfer alanı` şeklinde kurulmalıdır.",
      "Planlı Alanlar İmar Yönetmeliği Madde 5/22, bina içi erişim ölçülerini erişilebilirlik standartlarıyla birlikte uygulama yükümlülüğü getirir."
    )),
    section("kapi", "Kapıda kasa ölçüsünü değil net temiz geçişi kontrol et", phase6Lines(
      "Bakanlığın 2025 konut rehberi iç kapılarda **en az 90 cm net/temiz genişlik** ve eşiksiz geçiş yaklaşımını verir. Asansör kapısında da güncel Madde 34 ve Bakanlık rehberinde **0,90 m / 90 cm net geçiş** kritik minimumdur.",
      "Kapı kanadının açılma yönü, kapı koluna yaklaşım ve kapı kapanma donanımı kullanım alanını etkiler. WC kapısını yalnız plan üzerinde 90 cm çizmek yeterli değildir; kullanıcının kapıyı açarken manevra alanını kaybetmemesi gerekir.",
      "| Bileşen | Kaynakta öne çıkan net kontrol | Proje notu |\n|---|---:|---|\n| İç kapı | 90 cm net | Eşik ve yaklaşım alanını ayrıca kontrol et |\n| Asansör kapısı | 90 cm net | Sahanlıkla birlikte değerlendir |\n| Asansör kabini | Dar kenar 1,20 m; alan 1,80 m² | Kuyu ölçüsü değildir |\n| Asansör önü | Sürgülü kapıda 120 cm; dışa açılan kapıda 150 cm | Dönüş/kapı çakışmasını kontrol et |"
    )),
    section("wc", "WC planında 150 cm manevra alanını transfer alanlarından bağımsız kaybetme", phase6Lines(
      "Bakanlık erişilebilirlik rehberleri ve izleme formları, tekerlekli sandalye kullanımında **150 cm çap/150 cm ölçeğinde manevra alanını** temel planlama kontrolü olarak kullanır. Ancak bu dönüş alanı klozete transfer için gerekli yan/ön yaklaşım alanlarının yerine geçmez.",
      "Klozet, lavabo, tutunma elemanı, kapı kanadı, acil çağrı donanımı ve tesisat şaftı birlikte yerleştirilmelidir. Standartta tanımlanan transfer ve donatı ölçüleri proje tarihindeki güncel TS 9111/Erişilebilirlik Kılavuzu üzerinden doğrulanmalı; telifli standart tablosu kopyalanmamalıdır."
    )),
    section("asansor", "Asansör erişilebilirliğinde kabin, kapı ve sahanlık üç ayrı geometridir", phase6Lines(
      "Güncel Planlı Alanlar İmar Yönetmeliği Madde 34 kapsamında tek asansörlü binalarda kabinin dar kenarı **1,20 m**, kabin alanı **1,80 m²**, kapı neti **0,90 m** altına düşemez. Kapının açıldığı sahanlık sürgülü kapıda en az **1,20 m (120 cm)**, dışa açılan kapıda en az **1,50 m (150 cm)** olmalıdır.",
      "Bu değerlerin hiçbiri tek başına kuyu ölçüsü değildir. Kuyu, üretici yerleşimi ve güvenlik boşluklarıyla ayrıca belirlenir. Erişilebilir güzergâh ise asansör kapısına kadar kesintisiz gelmelidir."
    )),
    section("koordinasyon", "Islak hacim ve çekirdek ölçülerini taşıyıcı sistemden sonra değil önce kilitle", phase6Lines(
      "WC tesisat şaftı büyüdüğünde veya asansör perdesi kalınlaştığında erişilebilir net alanlar küçülebilir. Bu nedenle mimari, statik, mekanik ve elektrik projeleri arasında yalnız aks değil `bitmiş net ölçü` koordinasyonu yapılmalıdır.",
      "Özellikle asansör çekirdeği ile WC'nin aynı çekirdek çevresinde bulunduğu projelerde perde, kapı, yangın holü ve tesisat şaftı tek koordinasyon planında gösterilmelidir."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonuçları", phase6Lines(
      "1. **Yanlış:** 90 cm kapı ölçüsünü kasa dışından okumak. **Sonuç:** gerçek net geçiş 90 cm'nin altına düşebilir.\n2. **Yanlış:** WC'deki 150 cm manevra alanını klozet transfer alanıyla tamamen üst üste kabul etmek. **Sonuç:** kullanım senaryosu çalışmaz.\n3. **Yanlış:** 1,20 m kabin dar kenarını kuyu ölçüsü sanmak. **Sonuç:** asansör sistemi sığmaz.\n4. **Yanlış:** Şaft ve perde kalınlıklarını mimari net alandan düşmemek. **Sonuç:** ruhsat projesi ile uygulama ölçüsü ayrışır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Erişilebilir güzergâh WC ve asansöre kesintisiz ulaşıyor mu?",
      "- [ ] Kritik kapılarda **90 cm net/temiz geçiş** uygulama ölçüsüyle sağlanıyor mu?",
      "- [ ] WC içinde **150 cm** manevra alanı ve transfer bölgeleri ayrı ayrı kontrol edildi mi?",
      "- [ ] Asansörde **1,20 m / 1,80 m² / 0,90 m** kabin-kapı minimumları sağlandı mı?",
      "- [ ] Asansör önü sürgülü kapıda **120 cm**, dışa açılan kapıda **150 cm** sahanlık veriyor mu?",
      "- [ ] Perde, şaft, kaplama ve ekipmanlar bitmiş net ölçüden düşüldü mü?",
      "- [ ] Güncel TS 9111 ve ilgili asansör standardı proje tarihinde doğrulandı mı?"
    )),
  ],
  references: engelsizPhase6References("WC, asansör, kapı ve manevra alanları"),
  keywords: ["engelsiz WC", "90 cm", "150 cm", "1,20 m", "1,80 m²", "asansör sahanlığı"],
  tags: ["Engelsiz Tasarım", "WC", "Asansör", "Kapı", "Net Ölçü"],
};

const PERMIT: DepremPhase6Override = {
  slug: "engelsiz-yapi-ruhsatinda-uyum-kontrolu",
  title: "Yapı Ruhsatında Erişilebilirlik Uyum Kontrolü: Projeden Sahaya İzlenebilir Matris",
  description: "Ruhsat eki projelerde erişilebilirliğin hangi mevzuat zinciriyle ve hangi pafta/detaylar üzerinden kontrol edileceğini; Erişilebilirlik Belgesi sürecinden ayrıştırarak açıklar.",
  seoTitle: "Yapı Ruhsatında Erişilebilirlik Uyum Kontrolü | 2026 Rehberi",
  seoDescription: "Planlı Alanlar Madde 5/20-22, 4708 yapı denetimi, 2026/1 erişilebilirlik denetim planı ve proje-saha kontrol matrisiyle erişilebilirlik uyumu.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri", "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari", "engelsiz-wc-asansor-kapi-boyutlari"],
  sections: [
    section("hukuki-zincir", "Ruhsat kontrolünde erişilebilirliği ayrı bir son kontrol maddesi değil mevzuat zinciri olarak kur", phase6Lines(
      "Planlı Alanlar İmar Yönetmeliği **Madde 5/20**, yapı ruhsatı talep edilen projelerde erişilebilirlik dâhil yapıya ilişkin özel mevzuata uyulacağını açıkça belirtir. Aynı maddenin **22 nci fıkrası** ilgili idareyi erişilebilirlik mevzuat ve standartlarını uygulamakla yükümlü kılar; sahanlık, merdiven, asansör, kapı, koridor, rampa, korkuluk ve küpeşte ölçülerinin standartla birlikte çözülmesini ister.",
      "4708 sayılı Yapı Denetimi Hakkında Kanun da proje ve uygulamanın ilgili mevzuat, ruhsat eki proje, teknik şartname ve standartlara uygunluğunun kontrolünü yapı denetim sürecinin parçası yapar.",
      "Bu yüzden erişilebilirlik kontrolü yalnız mimarın son pafta kontrolü değildir; mimari, statik, mekanik, elektrik ve saha uygulaması arasında izlenebilir bir proje kontrolüdür."
    )),
    section("kontrol-matrisi", "Ruhsat dosyasında erişilebilirlik matrisi oluştur", phase6Lines(
      "Ruhsat öncesinde her kritik erişim noktasının pafta ve detay karşılığı olan bir matris hazırlanabilir. Böylece `uygun` işareti ölçü ve çizim kanıtına bağlanır.",
      "| Kontrol düğümü | Projede aranacak kanıt | Koordinasyon disiplini |\n|---|---|---|\n| Parsel/yaya yaklaşımı | Kesintisiz rota, kotlar, taşıt ayrımı | Mimari + peyzaj |\n| Bina girişi | Net kapı, eşik, rampa/sahanlık | Mimari + statik |\n| Kat dolaşımı | Koridor, dönüş alanı, kapı yaklaşımı | Mimari + yangın |\n| Asansör | Kabin, sahanlık, kuyu/çukur | Mimari + statik + elektrik/mekanik |\n| WC/ortak hacim | Manevra, transfer, donatı | Mimari + mekanik |\n| İşaretleme | Yönlendirme ve bilgi | Mimari + elektrik |",
      "Her satıra pafta numarası, detay numarası, tasarım ölçüsü ve saha doğrulama alanı eklenmesi denetimin izlenebilirliğini yükseltir."
    )),
    section("standart-mevzuat", "Yönetmelik minimumu ile erişilebilirlik standardını birbirine karşı yarıştırma", phase6Lines(
      "Madde 5/22'nin mantığı açıktır: Yönetmelikteki ölçüler alt sınırı oluşturur ve erişilebilirlik standartlarına uygunluk ayrıca sağlanır. Bu nedenle iki kaynaktan daha küçük olanı seçmek yanlış bir yöntemdir.",
      "TS 9111 ve ilgili standartların yürürlükteki baskısı proje tarihinde TSE üzerinden doğrulanmalıdır. Standartların telifli tablolarını siteye aynen taşımak yerine gerekli tasarım kararları açıklanmalı ve resmî/standart referansı verilmelidir."
    )),
    section("belge-ayrimi", "Yapı ruhsatı uygunluğu ile Erişilebilirlik Belgesi sürecini karıştırma", phase6Lines(
      "Erişilebilirlik İzleme ve Denetleme Yönetmeliği, umuma açık hizmet veren yapılar ve açık alanlar için komisyon, yerinde tespit ve **Erişilebilirlik Belgesi** sürecini düzenler. Bu süreç, ruhsat projesindeki erişilebilirlik mevzuatına uyma yükümlülüğüyle ilişkili olmakla birlikte aynı idari işlem değildir.",
      "Aile ve Sosyal Hizmetler Bakanlığının **2026/1** Genelgesi, 2026 yılı izleme-denetleme programını ve ERDEM kullanımını günceller. Genelgede erişilebilirlik belgesi değerlendirmesinde izleme-denetleme formundaki yıldızlı soruların rolü ayrıca tarif edilir. Bu denetim kuralını bütün ruhsat projelerinin tek kabul listesi gibi kullanmak doğru değildir."
    )),
    section("saha", "Ruhsatta uygun görünen net ölçüyü uygulamada tekrar doğrula", phase6Lines(
      "4708 kapsamındaki denetimde imalatın ruhsat eki projeye ve standartlara uygunluğu sahada izlenir. Erişilebilirlik için kritik fark, birkaç santimetrelik kaplama/kasa/şaft değişiminin net geçişi veya manevra alanını bozabilmesidir.",
      "Betonarme perde konumu, şap-kaplama kotu, kapı kasası, korkuluk, drenaj ızgarası ve tesisat dolabı bitmiş imalatta tekrar ölçülmelidir. Proje matrisi bu nedenle `tasarım` ve `as-built` sütunlarını ayrı tutmalıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonuçları", phase6Lines(
      "1. **Yanlış:** Erişilebilirliği yalnız vaziyet planındaki rampa ile kapatmak. **Sonuç:** bina içi güzergâh kopuk kalır.\n2. **Yanlış:** Erişilebilirlik Belgesi denetim formunu bütün yeni bina ruhsatının tek standart listesi sanmak. **Sonuç:** ruhsat mevzuatı ve güncel TS kontrolleri eksik kalır.\n3. **Yanlış:** Standart ölçüsünü yalnız kaba yapı paftasında doğrulamak. **Sonuç:** bitmiş net ölçü uygulamada azalabilir.\n4. **Yanlış:** 2026/1 denetim genelgesini tasarım standardının yerine geçirmek. **Sonuç:** idari denetim programı ile teknik tasarım kriteri karıştırılır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Güncel Planlı Alanlar İmar Yönetmeliği **Madde 5/20 ve 5/22** kontrol edildi mi?",
      "- [ ] 4708 kapsamındaki proje ve saha uygunluk sorumlulukları matrise işlendi mi?",
      "- [ ] Parsel girişinden gerekli bütün mahallere kesintisiz erişilebilir rota paftada gösterildi mi?",
      "- [ ] Her kritik net ölçünün pafta/detay numarası ve as-built kontrol alanı var mı?",
      "- [ ] **2026/1** erişilebilirlik denetim planının ERDEM/belge süreci ruhsat kontrolünden ayrıştırıldı mı?",
      "- [ ] Güncel TS 9111 ve ilgili standart baskıları proje tarihinde doğrulandı mı?",
      "- [ ] Erişilebilirlik Belgesi gereken/izlenen yapı için ayrı komisyon ve yerinde denetim süreci kontrol edildi mi?"
    )),
  ],
  references: [
    ...engelsizPhase6References("ruhsat eki proje, standart ve saha uygunluğu"),
    { label: "Mevzuat Bilgi Sistemi — 4708 sayılı Yapı Denetimi Hakkında Kanun", href: YAPI_DENETIM_4708, note: "Proje ve uygulamanın ilgili mevzuat, ruhsat eki proje ve standartlara uygunluğunun denetlenmesi için temel kanundur." },
    { label: "Mevzuat Bilgi Sistemi — Erişilebilirlik İzleme ve Denetleme Yönetmeliği", href: ERISILEBILIRLIK_MONITOR_REG, note: "Erişilebilirlik tespiti, komisyon, yerinde inceleme ve Erişilebilirlik Belgesi sürecini düzenler." },
    { label: "Aile ve Sosyal Hizmetler Bakanlığı — 2026/1 Erişilebilirlik İzleme ve Denetleme Planı", href: ERISILEBILIRLIK_2026_CIRCULAR, note: "2026 denetim programı ve ERDEM uygulama çerçevesini içerir." },
    { label: "Mevzuat Bilgi Sistemi — güncel Planlı Alanlar İmar Yönetmeliği", href: PA_IY_CURRENT, note: "Madde 5/20 ve 5/22 erişilebilirlik ve standart uyum zincirinin güncel mevzuat kaynağıdır." },
    { label: "Aile ve Sosyal Hizmetler Bakanlığı — Binalar İçin Erişilebilirlik İzleme ve Denetleme Formu", href: ERISILEBILIRLIK_FORM, note: "Denetim ölçütlerini ve yeni/mevcut yapı ayrımına ilişkin açıklamaları içerir." },
    { label: "Aile ve Sosyal Hizmetler Bakanlığı — Konutlarda Yaşlılar İçin Erişilebilirlik ve Güvenlik Rehberi (2025)", href: ERISILEBILIRLIK_2025_GUIDE, note: "Erişilebilir güzergâh, rampa, kapı ve asansör uygulama ölçülerini güncel rehber düzeyinde açıklar." },
  ],
  keywords: ["yapı ruhsatı", "erişilebilirlik", "Madde 5", "4708", "2026/1", "ERDEM", "Erişilebilirlik Belgesi"],
  tags: ["Engelsiz Tasarım", "Ruhsat", "Yapı Denetimi", "Erişilebilirlik Belgesi"],
};

export const DEPREM_PHASE6_BATCH_5_ARTICLES = [WHEELCHAIR, RAMP, WC_LIFT_DOOR, PERMIT] as const;
