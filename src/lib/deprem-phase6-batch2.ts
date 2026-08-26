import {
  IMAR_KANUNU,
  IMAR_RUHSAT_SURECLERI,
  MEKANSAL_PLANLAMA_PAGE,
  MEKANSAL_PLANLAR_2026,
  PHASE6_UPDATED_AT,
  imarPhase6References,
  phase6Lines,
  type DepremPhase6Override,
} from "./deprem-phase6-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const DEPREM_PHASE6_IMAR_BASEMENT: DepremPhase6Override = {
  slug: "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani",
  description: "Bodrum katın emsal, kat adedi, iskân, teknik hacim ve ortak alan bakımından tek bir etiketle değil; kot, kullanım ve proje kararları birlikte okunarak değerlendirilmesini açıklar.",
  seoTitle: "Bodrum Kat Mevzuatı: Teknik Hacim, İskân, Emsal ve Kat Adedi",
  seoDescription: "Planlı Alanlar İmar Yönetmeliği ve 2026 değişiklikleri üzerinden bodrum katlarda teknik hacim, ortak alan, bağımsız bölüm, emsal ve asansör kat adedi kontrolleri.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk okuma",
  sections: [
    section("hizli-ozet", "Mühendis için hızlı özet", phase6Lines(
      "Bodrum kat için ‘toprağın altında, o hâlde emsal dışı’ veya ‘teknik hacim, o hâlde kat sayılmaz’ biçimindeki tek cümlelik kabuller güvenilir değildir. Aynı bodrum kat içinde teknik hacim, zorunlu otopark, ortak alan, bağımsız bölüm eklentisi ve iskân edilebilir mahal birlikte bulunabilir; her kullanımın alan hesabı ve proje sonucu farklıdır.",
      "Planlı Alanlar İmar Yönetmeliğinde alan hesabı için özellikle Madde 22, bodrum kullanım koşulları ve yapı projelerine ilişkin hükümler birlikte okunmalıdır. 1 Temmuz 2026 değişikliği ayrıca asansör zorunluluğunda kat adedi belirlenirken bodrum katın içeriğine özel bir ayrım getirmiştir: yalnız teknik hacimlerden oluşan bodrum ile bağımsız bölüm, eklenti veya ortak alan içeren bodrum aynı sonuç doğurmaz.",
      "Kontrol sırası: kot ve açığa çıkma durumu → mahal kullanım türü → bağımsız/ortak/eklenti niteliği → emsal istisnasının koşulları → yangın, havalandırma, su ve erişim koşulları → kat adedi/asansör etkisi → ruhsat eki projeler."
    )),
    section("kavram-ayrimi", "Bodrum kat ile teknik hacim aynı kavram değildir", phase6Lines(
      "‘Bodrum kat’ geometrik ve kotla ilişkili bir kat tarifidir; ‘teknik hacim’ ise kullanım tarifidir. Bir mahallin bodrumda bulunması onu kendiliğinden teknik hacim yapmaz. Aynı şekilde kazan dairesi, elektrik odası, su deposu, iklimlendirme merkezi veya jeneratör odası gibi teknik işlevlerin bodrumda bulunması, bodrumun geri kalanındaki farklı kullanımları teknik hacme dönüştürmez.",
      "Proje kontrolünde mahaller tek tek adlandırılmalı ve mimari plan, mekanik-elektrik proje, yangın senaryosu ile alan cetveli aynı isimleri kullanmalıdır. ‘Bodrum’ adı altında toplanmış ama gerçekte depo, sosyal alan, otopark veya bağımsız kullanıma ayrılmış hacimler alan hesabında ayrıca sınıflandırılmalıdır."
    )),
    section("emsal-kat-alani", "Madde 22: emsal dışılık kullanım ve koşul üzerinden okunur", phase6Lines(
      "Planlı Alanlar İmar Yönetmeliğinin Madde 22 sistemi, katlar alanına dâhil edilmeyen kullanımları koşullarıyla tarif eder. Kritik nokta, istisnanın yalnız mahallin adına bağlı olmamasıdır. Zorunlu otopark, sığınak, asansör boşluğu, tesisat alanı, ortak alan veya depo eklentisi gibi kullanımlarda konum, büyüklük, bağımsız bölüm oluşturup oluşturmama ve ortak alan niteliği gibi şartlar birlikte aranır.",
      "Bu nedenle metraj tablosu ‘bodrum toplam alanı = emsal dışı alan’ şeklinde kurulamaz. Her mahal için bir karar satırı oluşturulmalıdır.",
      "| Kontrol | Sorulacak soru | Proje sonucu |\n|---|---|---|\n| Kullanım | Teknik hacim mi, otopark mı, depo mu, ortak alan mı? | Doğru istisna hükmünü seç |\n| Mülkiyet/kullanım niteliği | Bağımsız bölüm, eklenti veya ortak alan mı? | Alan ve kat mülkiyeti sonucunu ayır |\n| Geometri | Tamamen gömülü mü, kısmen açığa mı çıkıyor? | Cephe, kullanım ve alan hesabını tekrar kontrol et |\n| Sınır | İstisna için alan/oran koşulu var mı? | Alan cetvelinde koşulu göster |\n| Proje değişikliği | Sonradan kullanıma dönüşecek mi? | Emsal hakkını dolaylı artıracak dönüşümü engelle |"
    )),
    section("iskan-kosullari", "İskân edilebilir bodrumda yalnız alan hesabı yetmez", phase6Lines(
      "Toprağa dayalı bodrumlarda iskân edilen mahaller; doğal aydınlatma-havalandırma, dış mekânla ilişki, sel ve su baskınına karşı tedbirler gibi ek koşullar doğurur. Konut veya sürekli kullanımlı bir mahalli sadece emsal hesabında uygun göstermek, o mahalli kullanılabilir hale getirmez.",
      "Mühendislik koordinasyonunda en az dört çizim aynı anda okunmalıdır: mimari bodrum planı ve kesiti, temel/perde çözümü, mekanik havalandırma-drenaj şeması ve yangın kaçış çözümü. Özellikle pencere/kuranglez, temel-perde su yalıtımı, drenaj kotu ve kaçış güzergâhı birbirinden bağımsız çözülemez."
    )),
    section("asansor-kat-adedi", "1 Temmuz 2026: bodrumun asansör kat adedine etkisini ayrı kontrol et", phase6Lines(
      "1 Temmuz 2026 tarihli ve 33297 sayılı değişiklik, asansör zorunluluğunda kat adedi hesabını bodrum kullanımına bağlayan önemli bir ayrım getirdi. Tek bağımsız bölümlü konutlar hariç olmak üzere; bağımsız bölüm, ortak alan veya eklenti bulunan bodrum kat kat adedi değerlendirmesine girerken, yalnız ısı merkezi, kazan dairesi, elektrik odası, su deposu, iklimlendirme merkezi, jeneratör odası ve benzeri teknik hacimlerden oluşan bodrum için aynı yaklaşım uygulanmaz.",
      "Bu hüküm bir emsal kuralı değildir. ‘Asansör hesabında kat sayılmıyor’ sonucu, ‘emsal hesabında da yoktur’ sonucuna dönüştürülemez. Alan hesabı, kat adedi, yangın ve erişilebilirlik kontrolleri ayrı kolonlarda tutulmalıdır."
    )),
    section("koordinasyon-hatalar", "Sık yapılan hatalar ve teknik sonuçları", phase6Lines(
      "1. **Yanlış:** Bodrum toplam alanını tek kalemde emsal dışı yazmak. **Sonuç:** Bağımsız bölüm/eklenti/ortak alan ayrımı kaybolur ve ruhsat alan cetveli hatalı hale gelebilir.",
      "2. **Yanlış:** Teknik hacim etiketini, fiilî kullanım ve tesisat projesiyle doğrulamamak. **Sonuç:** Proje değişikliğinde mevzuata aykırı kullanım ve emsal artışı riski doğar.",
      "3. **Yanlış:** Bodrumun açığa çıkan cephelerini kesitte kontrol etmemek. **Sonuç:** İskân, cephe ve kat algısı farklılaşabilir.",
      "4. **Yanlış:** Asansör kat adedi kuralını emsal kuralıyla karıştırmak. **Sonuç:** Yanlış asansör zorunluluğu veya yanlış alan hesabı yapılır.",
      "5. **Yanlış:** Su ve drenajı yalnız mimari problem saymak. **Sonuç:** Temel-perde detayında hidrostatik basınç, su yalıtımı ve pompa/drenaj koordinasyonu eksik kalır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Bodrum kotları tabii/tesviye edilmiş zemin ve yol kotuyla kesitte doğrulandı mı?",
      "- [ ] Her mahal bağımsız bölüm / eklenti / ortak alan / teknik hacim olarak sınıflandırıldı mı?",
      "- [ ] Madde 22 istisnasının koşulu alan cetvelinde ayrı satırla gösterildi mi?",
      "- [ ] Teknik hacim isimleri mekanik-elektrik projeleriyle birebir uyumlu mu?",
      "- [ ] İskân edilen mahal için gün ışığı, havalandırma, su baskını ve kaçış koşulları çözüldü mü?",
      "- [ ] 1 Temmuz 2026 asansör kat adedi değişikliği ayrıca kontrol edildi mi?",
      "- [ ] Yerel plan notu veya özel alan hükmü ulusal Yönetmelikle birlikte doğrulandı mı?",
      "- [ ] Proje değişikliği ile emsal dışı alanın emsale konu kullanıma dönüşmesi engellendi mi?"
    )),
  ],
  relatedSlugs: ["imar-taks-kaks-emsal-hesabi", "otopark-kapali-havalandirma-co-konsantrasyonu", "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu"],
  references: imarPhase6References("Madde 5, Madde 22, bodrum hükümleri ve 1 Temmuz 2026 asansör değişikliği"),
  keywords: ["bodrum kat", "teknik hacim", "emsal", "iskan", "Madde 22", "asansör kat adedi", "33297"],
  tags: ["İmar", "Bodrum", "Emsal", "Teknik Hacim", "Koordinasyon"],
};

const DEPREM_PHASE6_IMAR_BALCONY: DepremPhase6Override = {
  slug: "imar-balkon-cikma-sacak-emsal-disi-sartlari",
  description: "Balkon, açık/kapalı çıkma, saçak, pergola ve benzeri elemanların parsel sınırı, yapı yaklaşma mesafesi ve emsal hesabında neden ayrı ayrı sınıflandırılması gerektiğini açıklar.",
  seoTitle: "Balkon, Çıkma ve Saçak: Emsal Dışı Alan ve Geometri Kontrolü",
  seoDescription: "Balkonların 1,50 m ve %20 koşulları, çıkmaların parsel sınırı, saçak/pergola ayrımı ve 1 Temmuz 2026 emsal değişiklikleri için proje kontrol rehberi.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "12 dk okuma",
  sections: [
    section("hizli-ozet", "Mühendis için hızlı özet", phase6Lines(
      "Balkon, çıkma ve saçak aynı eleman değildir; aynı plan çizgisinde görünmeleri emsal, taban alanı ve yaklaşma mesafesi açısından aynı kurala tabi oldukları anlamına gelmez. Önce elemanın geometrik ve işlevsel türü belirlenmeli, sonra ilgili plan hükmü ve Planlı Alanlar İmar Yönetmeliği birlikte okunmalıdır.",
      "Madde 22 sisteminde balkonların belirli kısmının katlar alanı dışında değerlendirilmesi koşulludur. Güncel uygulamada 1,50 m genişlik ve bağımsız bölüm net alanının %20'si gibi sınırlar kritik kontrol işaretleridir; bunlar ‘her balkonun tamamı emsal dışıdır’ şeklinde yorumlanamaz.",
      "1 Temmuz 2026 değişikliği ayrıca bahçede peyzaj düzenlemesi niteliğindeki pergola ve süs havuzları, giriş saçakları, bahçe-istinat duvarları ve bazı boşlukların emsal hesabındaki yerini güncelledi. Bu nedenle eski proje şablonundaki otomatik ‘emsal dışı’ etiketleri güncel mevzuat zinciriyle doğrulanmalıdır."
    )),
    section("eleman-turu", "Önce elemanı doğru sınıflandır: balkon, çıkma, saçak, pergola", phase6Lines(
      "Balkon bağımsız bölümle kullanım ilişkisi kuran açık alan; çıkma bina cephesinin dışına taşan yapı bölümü; saçak cephe/çatıdan uzayan örtü elemanı; pergola ise bahçe veya teras kullanımında farklı şartlara tabi hafif bir düzenleme olarak ele alınır. Proje kontrolünde adlandırma, fiilî geometriyle uyuşmalıdır.",
      "Bir balkonun sonradan camla kapatılması, bir pergolanın kapalı hacme dönüşmesi veya giriş saçağının taşıyıcı sistemle bütünleşerek yeni kullanım alanı oluşturması mevzuat niteliğini değiştirebilir. Ruhsat eki proje ile sahadaki imalat arasında bu yüzden şekil kadar kullanım da denetlenir."
    )),
    section("emsal-hesabi", "Madde 22: 1,50 m ve %20 kontrolünü otomatik hak gibi kullanma", phase6Lines(
      "Balkonların emsal hesabında dışarıda bırakılabilen kısmı için Yönetmelikteki koşullar birlikte sağlanmalıdır. 1,50 m genişlik ve toplamın ait olduğu bağımsız bölüm net alanının %20'sini geçmemesi, kontrol tablosunda ayrı satırlar olarak tutulmalıdır. Açık çıkma koşullarını taşıyan kısımlar ayrıca değerlendirilir.",
      "| Adım | Kontrol | Karar |\n|---|---|---|\n| 1 | Eleman gerçekten balkon/açık çıkma mı? | Yanlış sınıflandırmayı ele |\n| 2 | 1,50 m genişlik koşulu hangi kısım için sağlanıyor? | Geometrik alanı ayır |\n| 3 | Balkon toplamı bağımsız bölüm net alanının %20 sınırını aşıyor mu? | Emsal dışı kısmı sınırla |\n| 4 | Açık çıkma koşulları sağlanıyor mu? | Çıkma hükmünü ayrıca uygula |\n| 5 | Plan notunda daha özel bir hüküm var mı? | Yerel kararı belgeye bağla |"
    )),
    section("parsel-yaklasma", "Parsel sınırı ve yapı yaklaşma mesafesi alan hesabından ayrı kontroldür", phase6Lines(
      "Bir alanın emsal dışında kalabilmesi, o elemanın parsel sınırını veya yapı yaklaşma mesafesini ihlal edebileceği anlamına gelmez. Çıkma geometrisi plan paftası, plan notu ve Yönetmelikteki çıkma hükümleriyle kontrol edilmelidir; parsel dışına taşma hiçbir şekilde ‘emsal dışı’ gerekçesiyle meşrulaştırılamaz.",
      "Statik proje açısından da çıkma boyu yalnız mimari bir sayı değildir. Konsol döşeme/kiriş davranışı, cephe yükleri, ısıl köprü, su tahliyesi ve deprem etkisinde düzensiz kütle dağılımı aynı geometriye bağlıdır. Mimari revizyon sonrası statik hesap ve detayların güncellenmesi gerekir."
    )),
    section("2026-degisikligi", "1 Temmuz 2026 değişikliği: bahçe düzenlemeleri ve emsal hesabını güncelle", phase6Lines(
      "1 Temmuz 2026 tarihli değişiklik, bahçede peyzaj düzenlemesi niteliğinde yapılan, bağımsız bölüm veya eklenti niteliği taşımayan ve ana taşıyıcı sistemle bütünleşik olmayan pergola ve süs havuzlarının belirli koşullarda emsal hesabı dışında değerlendirilmesine ilişkin çerçeveyi güncelledi. Aynı değişiklik giriş saçakları, bahçe ve istinat duvarları, asma kat döşemesi hizasındaki bazı boşluklar ve baza üzerindeki kullanılmayan alanlarla ilgili hükümleri de etkiledi.",
      "Bu hüküm ‘bahçedeki her örtü emsal dışıdır’ biçiminde okunmamalıdır. Kapalı hacim oluşturma, taşıyıcı sistemle bütünleşme, bağımsız/eklenti kullanımı ve bahçe alanı oranı gibi koşullar projede görünür olmalıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve proje etkisi", phase6Lines(
      "1. **Yanlış:** Balkon alanının tamamını tek satırda emsal dışı yazmak. **Sonuç:** 1,50 m ve %20 koşulları kaybolur.",
      "2. **Yanlış:** Emsal dışı olmayı yapı yaklaşma mesafesi muafiyeti sanmak. **Sonuç:** parsel/çekme ihlali oluşur.",
      "3. **Yanlış:** Camla kapatılmış veya fiilen kapalı hacme dönüşmüş elemanı eski açık balkon etiketiyle sürdürmek. **Sonuç:** ruhsat ve alan hesabı uyuşmaz.",
      "4. **Yanlış:** Mimari konsol boyunu değiştirip statik modeli güncellememek. **Sonuç:** iç kuvvet ve sehim hesabı eski geometriye göre kalır.",
      "5. **Yanlış:** 1 Temmuz 2026 pergola/saçak değişikliğini eski ofis şablonuna yansıtmamak. **Sonuç:** güncelliğini yitirmiş alan cetveli kullanılır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Eleman türü plan, kesit ve görünüşte aynı adla gösterildi mi?",
      "- [ ] Balkon için 1,50 m genişlik koşulu geometrik olarak işaretlendi mi?",
      "- [ ] Balkon toplamı bağımsız bölüm net alanının %20'si ile karşılaştırıldı mı?",
      "- [ ] Açık çıkma şartları ve parsel sınırı ayrıca kontrol edildi mi?",
      "- [ ] Saçak/pergola kapalı hacim veya eklenti üretmiyor mu?",
      "- [ ] 1 Temmuz 2026 değişikliği proje tarihine göre uygulanıyor mu?",
      "- [ ] Mimari konsol değişikliği statik modele ve donatı detayına işlendi mi?",
      "- [ ] Plan notu ile genel Yönetmelik birlikte dosyalandı mı?"
    )),
  ],
  relatedSlugs: ["imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari", "imar-cekme-kat-asma-kat-kosullari", "imar-plan-notu-celiskisi-uygulama-onceligi"],
  references: imarPhase6References("Madde 5, Madde 22 ve çıkma/saçak hükümleri"),
  keywords: ["balkon", "çıkma", "saçak", "emsal dışı", "1,50 m", "%20", "pergola", "33297"],
  tags: ["İmar", "Balkon", "Çıkma", "Emsal", "Mimari-Statik Koordinasyon"],
};

const DEPREM_PHASE6_IMAR_PERMIT: DepremPhase6Override = {
  slug: "imar-ruhsat-sureci-basvurudan-iskan-kadar",
  description: "Yapı ruhsatı sürecini imar durumundan aplikasyon, zemin etüdü, mimari-statik-tesisat proje koordinasyonu ve yapı kullanma izin belgesine kadar teknik kontrol zinciri olarak ele alır.",
  seoTitle: "Yapı Ruhsatı Süreci: Başvurudan İskâna Teknik Kontrol Zinciri",
  seoDescription: "Planlı Alanlar İmar Yönetmeliği Madde 54-65 ve 1 Temmuz 2026 değişiklikleriyle ruhsat, proje kontrolü, yeniden ruhsat ve yapı kullanma izin belgesi süreci.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  sections: [
    section("hizli-ozet", "Mühendis için hızlı özet", phase6Lines(
      "Yapı ruhsatı, mimari projenin belediyeye teslim edilmesiyle başlayan tek adımlı bir onay değildir. Parsel verisi, imar durumu, yol/kanal kotu, aplikasyon, zemin-temel etüdü, mimari, statik, mekanik ve elektrik projeleri aynı yapı kararını tarif etmelidir. Ruhsat, bu koordinasyonun idari belgesidir; iskân ise yapının ruhsat ve eklerine uygun tamamlandığının kapanış kontrolüdür.",
      "Planlı Alanlar İmar Yönetmeliğinde yapı ruhsatına ilişkin genel hükümler Madde 54, işlemler Madde 55, yapı projeleri Madde 57, yapı kullanma izni Madde 64 ve başvuruda istenecek bilgi-belge esasları Madde 65 çevresinde okunur.",
      "1 Temmuz 2026 değişikliği yeniden ruhsatlandırmada kritik bir tarih kuralı getirdi: ruhsat tarihinden itibaren 2 yıl içinde inşaata başlanıp başlanmaması, yeniden ruhsatta hangi mevzuat setinin uygulanacağını etkileyebilir."
    )),
    section("on-hazirlik", "1. Parsel ve imar verisini kilitlemeden projeye başlama", phase6Lines(
      "Ruhsat dosyasının ilk teknik girdileri parselin güncel tapu/kadastro durumu, imar durum belgesi, yol kotu, kanal kotu, aplikasyon krokisi ve uygulama imar planına esas jeolojik-jeoteknik veridir. Bu girdiler değişirse bina oturumu, bodrum kotu, kat yüksekliği, bahçe mesafesi ve temel kararı zincirleme etkilenir.",
      "Ön tasarımda TAKS/KAKS hesabı kadar parselin tevhid-ifraz geçmişi, terkler, yapı yaklaşma sınırı ve plan notları da kayıt altına alınmalıdır. Ruhsat çizimlerine geçildikten sonra ‘sonradan’ fark edilen parsel kararı en pahalı revizyon kaynaklarından biridir."
    )),
    section("proje-koordinasyonu", "2. Ruhsat eki projeler birbirini doğrulamalıdır", phase6Lines(
      "Madde 57 kapsamındaki yapı projeleri, disiplinlerin ayrı klasörlerde ürettiği bağımsız paftalar olarak görülmemelidir. Mimari aks ve kotlar statik modelle, ıslak hacimler tesisat şaftlarıyla, yangın kaçışı kapı-merdiven geometrisiyle, asansör kuyusu temel ve döşeme boşluklarıyla aynı koordinatta olmalıdır.",
      "| Disiplin çakışması | Erken kontrol | Ruhsatta beklenen sonuç |\n|---|---|---|\n| Mimari–statik | Aks, kolon/perde, konsol, döşeme boşluğu | Aynı geometri |\n| Mimari–mekanik | Şaft, kazan/tesisat odası, drenaj | Hacim ve erişim uyumu |\n| Mimari–elektrik | Sayaç/trafo/jeneratör, kablo şaftı | Güvenli erişim ve yerleşim |\n| Mimari–yangın | Kaçış, merdiven, kapı, duman bölgesi | Yangın senaryosuyla uyum |\n| Harita–mimari | Aplikasyon koordinatı ve ortometrik kot | Parselde doğru konum |"
    )),
    section("ruhsat-ve-sure", "3. Ruhsat tarihi, başlama ve yenileme kararını ayrı izle", phase6Lines(
      "Ruhsatın düzenlenmesi, inşaata başlama ve ruhsatın geçerlilik süresi aynı tarih değildir. Proje yönetiminde ruhsat tarihi ile fiilî başlangıç kayıtları ayrı tutulmalı; süre dolmadan yenileme veya yeniden ruhsat gerekip gerekmediği kontrol edilmelidir.",
      "1 Temmuz 2026 tarihli 33297 sayılı değişiklikte, yeniden ruhsat düzenlenmesi gereken ve ruhsat tarihinden itibaren 2 yıl içinde inşasına başlanmış yapılarda yangın, deprem, ısı ve su yalıtımı, çevre ve enerji verimliliği gibi alanlarda yürürlükteki ilgili mevzuatın; diğer hususlarda ruhsat tarihindeki mevzuatın uygulanacağı düzenlenmiştir. İki yıl içinde başlanmamış yapılarda ise yürürlükteki plan ve mevzuata göre yeniden ruhsat düzenlenmesi esastır.",
      "Bu nedenle ‘eski ruhsatım var, bütün eski kurallar devam eder’ genellemesi güvenli değildir. Hangi teknik alanın güncel mevzuata geçtiği dosya bazında ayrılmalıdır."
    )),
    section("saha-degisiklikleri", "4. Sahadaki değişikliği projeye işlemeden imalata devam etme", phase6Lines(
      "Kolon/perde konumu, merdiven, asansör kuyusu, cephe, bağımsız bölüm düzeni, kullanım amacı veya tesisat şaftı gibi ruhsat eki projeyi etkileyen değişiklikler ‘şantiye çözümü’ olarak bırakılmamalıdır. Değişikliğin esaslı tadilat veya ruhsat/proje revizyonu gerektirip gerektirmediği imalattan önce belirlenmelidir.",
      "Kontrol mühendisinin amacı yalnız uygunsuzluğu tespit etmek değil, revizyonun tüm disiplinlere yayıldığını doğrulamaktır. Mimari revizyon numarası artarken statik ve mekanik proje eski revizyonda kalıyorsa ruhsat dosyasının teknik bütünlüğü bozulur."
    )),
    section("iskan", "5. Yapı kullanma izin belgesi: kapanış, uygunluk ve 30 gün", phase6Lines(
      "Madde 64 çerçevesinde mal sahibinin başvurusu üzerine ruhsat vermeye yetkili idare, yapının ruhsat ve eklerine, fen ve sağlık kurallarına uygun tamamlanıp tamamlanmadığını belirler. Yapı uygun bulunursa yapı kullanma izin belgesinin 30 gün içinde düzenlenmesi öngörülür; eksiklik varsa önce bunların giderilmesi gerekir.",
      "İskân aşamasını son gün toplanacak evrak listesi olarak yönetmek hatalıdır. Betonarme, cephe, yangın, asansör, tesisat, otopark, erişilebilirlik ve enerji performansı gibi kapanış kontrolleri şantiye boyunca revizyon kayıtlarıyla beslenmelidir."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Güncel imar durumu, plan paftası ve plan notları dosyada mı?",
      "- [ ] Aplikasyon krokisi/projesi ve ortometrik kotlar mimari vaziyet planıyla uyuşuyor mu?",
      "- [ ] Zemin-temel etüdü ile temel/statik proje aynı parsel ve bina verisini kullanıyor mu?",
      "- [ ] Mimari, statik, mekanik, elektrik ve yangın projelerinin revizyon numaraları eşleşiyor mu?",
      "- [ ] Ruhsat tarihi, fiilî başlangıç ve 2 yıllık başlangıç kuralı kayıt altına alındı mı?",
      "- [ ] Sahadaki esaslı değişiklikler onaylı proje revizyonuna işlendi mi?",
      "- [ ] İskân öncesi eksik listesi disiplin bazında kapatıldı mı?",
      "- [ ] Yapı kullanma izin belgesi için Madde 64-65 süreci ve 30 gün hükmü kontrol edildi mi?"
    )),
  ],
  relatedSlugs: ["imar-plan-notu-celiskisi-uygulama-onceligi", "imar-parsel-tevhid-ifraz-prosedurleri", "engelsiz-yapi-ruhsatinda-uyum-kontrolu"],
  references: [
    ...imarPhase6References("Madde 54, 55, 57, 64 ve 65"),
    { label: "ÇŞİDB — Yapı Ruhsatı / Yapı Kullanma İzin Belgesi süreçleri teknik sunumu", href: IMAR_RUHSAT_SURECLERI, note: "Madde 54-65 süreçlerinin resmî teknik eğitim/uygulama özetidir." },
  ],
  keywords: ["yapı ruhsatı", "iskan", "yapı kullanma izin belgesi", "Madde 54", "Madde 55", "Madde 64", "30 gün", "2 yıl"],
  tags: ["İmar", "Ruhsat", "İskân", "Proje Koordinasyonu", "Teknik Ofis"],
};

const DEPREM_PHASE6_IMAR_PARCEL: DepremPhase6Override = {
  slug: "imar-parsel-tevhid-ifraz-prosedurleri",
  description: "Tevhit ve ifrazı yalnız tapu geometrisi değişikliği olarak değil; yapılaşma hakkı, cephe-derinlik, yol erişimi, plan kararı ve ruhsat ön koşullarını değiştiren imar işlemi olarak ele alır.",
  seoTitle: "Parsel Tevhit ve İfraz: İmar Hakkı ve Ruhsat Öncesi Kontrol",
  seoDescription: "3194 sayılı İmar Kanunu Madde 15-16 ve Planlı Alanlar İmar Yönetmeliği Madde 7 üzerinden tevhit, ifraz, parsel ölçüsü, yol cephesi ve yapılaşma hakkı kontrolü.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk okuma",
  sections: [
    section("hizli-ozet", "Mühendis için hızlı özet", phase6Lines(
      "Tevhit iki veya daha fazla parselin birleştirilmesi, ifraz ise bir parselin bölünmesidir; ancak mühendislik sonucu yalnız yeni tapu sınırı değildir. Yeni parselin cephe ve derinliği, yapı yaklaşma mesafeleri, yol bağlantısı, yapı nizamı, TAKS/KAKS hesabı, blok ölçüsü ve ruhsat verilebilirliği yeniden kontrol edilir.",
      "3194 sayılı İmar Kanununun Madde 15-16 çerçevesi ile Planlı Alanlar İmar Yönetmeliğinin Madde 7 hükümleri birlikte okunmalıdır. İşlem, imar planına aykırı yeni bir yapılaşma hakkı üretme aracı değildir.",
      "Ön kontrol kuralı: ‘İşlem tapuda yapılabiliyor mu?’ sorusundan önce ‘işlem sonrası parsel plan ve Yönetmeliğe göre yapılaşmaya elverişli kalıyor mu?’ sorusu cevaplanmalıdır."
    )),
    section("ifraz", "İfraz: yeni parsellerin her biri tek başına yaşamak zorundadır", phase6Lines(
      "İfrazda yalnız toplam alanın matematiksel bölünmesi yeterli değildir. Her yeni parsel için yol cephesi, asgari parsel genişliği/derinliği, yapı nizamı, bahçe mesafeleri, afet-jeolojik kısıtlar ve planla getirilen ifraz hattı gibi kararlar ayrı kontrol edilir.",
      "Yola cephesi bulunmayan veya imar planı nedeniyle erişimi kapanan bir parselin yeni ifrazla daha da kullanılamaz hale getirilmesi kabul edilemez. Planlı Alanlar İmar Yönetmeliği Madde 7, ifraz ve tevhit işleminde ada/parsel bütünlüğü ve yapılaşma elverişliliğini koruyan sınırlamalar içerir."
    )),
    section("tevhit", "Tevhit: alanlar birleşir, yapılaşma hakkı otomatik büyümez", phase6Lines(
      "Aynı yapı nizamı ve kullanım kararına sahip parsellerin tevhidinde dahi, işlem öncesi yapılaşma haklarının nasıl taşınacağı Yönetmelik koşullarıyla belirlenir. Farklı kullanım kararı, farklı yapı nizamı, farklı yoldan cephe veya plandaki ifraz hattı tevhidi sınırlayabilir.",
      "Özellikle blok nizam veya plan üzerinde ölçüsü belirlenmiş yapı kütlesinde ‘parseller birleşti, artık tek büyük blok çizebiliriz’ sonucu çıkarılmamalıdır. Tevhit öncesi ve sonrası taban alanı/katlar alanı hakları ayrı hesaplanmalı ve plan kararıyla karşılaştırılmalıdır."
    )),
    section("kontrol-tablosu", "Parsel işlemi öncesi karar tablosu", phase6Lines(
      "| Kontrol | İfrazda | Tevhitde |\n|---|---|---|\n| Kullanım kararı | Her yeni parselde korunmalı | Birleştirilecek parseller uyumlu olmalı |\n| Yapı nizamı | Yeni parsel yapılaşmaya elverişli olmalı | Farklı nizam tevhidi sınırlayabilir |\n| Yol cephesi | Mahreç ve cephe kaybı olmamalı | Farklı yol cepheleri ayrıca incelenmeli |\n| TAKS/KAKS | Her yeni parsel için yeniden hesaplanır | Hakların toplamı otomatik aşılmaz |\n| Bahçe mesafesi | Cephe/derinlikle birlikte çözülür | Yeni dış sınır ve komşulukla tekrar çözülür |\n| Blok/ifraz hattı | Plan çizgisine uyulur | Plan üzerindeki ayrım çizgisi ihlal edilemez |"
    )),
    section("idari-akis", "Madde 16: onay ve tescil akışını proje takvimine bağla", phase6Lines(
      "3194 sayılı İmar Kanununun Madde 16 sistemi, belediye ve mücavir alan içindeki tevhit/ifraz işlemlerinin mevzuata uygunluğunun yetkili idari karar ile onaylanmasını ve tapu tescil sürecine aktarılmasını öngörür. Bakanlık kaynaklarında başvurunun idareye intikalinden itibaren 30 gün içinde sonuçlandırılması ve onay sonrası 15 gün içinde tescil/terkin için tapuya bildirim akışı yer alır.",
      "Bu süreler proje programında ‘kesin ruhsat tarihi’ gibi kullanılmamalıdır. Eksik belge, plan değişikliği, terk/kamu alanı, kurum görüşü veya hukuki uyuşmazlık işlem süresini etkileyebilir. Tasarım ofisi, parsel işlemi kesinleşmeden yeni ada/parsel numarası üzerinden nihai ruhsat paftasını kilitlememelidir."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** Tevhit sonrası emsal ve taban alanını sınırsızca yeniden kurgulamak. **Sonuç:** planla verilmemiş yapılaşma hakkı üretilir.",
      "2. **Yanlış:** İfrazda yalnız alanı kontrol edip cephe/derinliği atlamak. **Sonuç:** yapı yaklaşma mesafeleri sağlanamayan parsel oluşabilir.",
      "3. **Yanlış:** Yol cephesini ve imar istikametini tapu sınırıyla aynı kabul etmek. **Sonuç:** ruhsat öncesi terk veya mahreç problemi çıkar.",
      "4. **Yanlış:** Farklı kullanım veya yapı nizamındaki parselleri tek işlem gibi görmek. **Sonuç:** Madde 7 koşullarıyla çelişir.",
      "5. **Yanlış:** Tapu tescili tamamlanmadan mimari/statik projede yeni sınırı kesin kabul etmek. **Sonuç:** proje, hukuken kesinleşmemiş geometriye bağlanır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Güncel kadastro/tapu sınırları ve imar adası birlikte çizildi mi?",
      "- [ ] Plan paftasındaki ifraz hattı, yapı nizamı ve kullanım kararı kontrol edildi mi?",
      "- [ ] Her yeni parselin yol cephesi, genişliği ve derinliği yeterli mi?",
      "- [ ] Tevhit öncesi/sonrası TAKS ve KAKS hakları karşılaştırıldı mı?",
      "- [ ] Kamu eline geçmesi gereken alan/terk işlemi var mı?",
      "- [ ] 3194 Madde 15-16 ile Planlı Alanlar Madde 7 birlikte okundu mu?",
      "- [ ] 30 gün + 15 gün idari akışı proje programında risk payıyla ele alındı mı?",
      "- [ ] Tescil sonrası yeni parsel bilgisi tüm ruhsat projelerine işlendi mi?"
    )),
  ],
  relatedSlugs: ["imar-taks-kaks-emsal-hesabi", "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari", "imar-plan-notu-celiskisi-uygulama-onceligi"],
  references: [
    ...imarPhase6References("Madde 7 — ifraz ve tevhit"),
    { label: "ÇŞİDB — 3194 sayılı İmar Kanunu temel metni, Madde 15-16", href: IMAR_KANUNU, note: "İfraz/tevhit için Kanun düzeyindeki temel onay ve tescil çerçevesi; proje tarihinde güncel değişiklikler ayrıca doğrulanmalıdır." },
  ],
  keywords: ["tevhit", "ifraz", "parsel", "3194", "Madde 15", "Madde 16", "Madde 7", "30 gün", "15 gün"],
  tags: ["İmar", "Parsel", "Tevhit", "İfraz", "Ruhsat Öncesi"],
};

const DEPREM_PHASE6_IMAR_PLAN_NOTE: DepremPhase6Override = {
  slug: "imar-plan-notu-celiskisi-uygulama-onceligi",
  description: "Plan paftası, plan notları, plan açıklama raporu, üst-alt ölçek ilişkisi ve genel imar mevzuatı arasında görünen çelişkilerin nasıl belgeli bir karar sürecine dönüştürüleceğini açıklar.",
  seoTitle: "Plan Notu Çelişkisi: Uygulama Önceliği ve Belge Hiyerarşisi",
  seoDescription: "Mekânsal Planlar Yapım Yönetmeliği, uygulama imar planı ve Planlı Alanlar İmar Yönetmeliği kapsamında plan notu çelişkilerinde teknik karar ve kayıt yöntemi.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "12 dk okuma",
  sections: [
    section("hizli-ozet", "Mühendis için hızlı özet", phase6Lines(
      "Plan notu çelişkisinde güvenilir yöntem, hafızadan ‘özel hüküm genel hükmü ezer’ demek değildir. Önce hangi belgenin yürürlükte olduğu, hangi ölçeğe ait bulunduğu, onay tarihi, plan değişikliği geçmişi ve hükmün hangi parsele/kullanıma uygulandığı belirlenir.",
      "Mekânsal Planlar Yapım Yönetmeliği yaklaşımında plan; plan paftası, gösterimler, plan notları ve plan raporu ile bir bütündür. Üst kademe plan alt kademeyi yönlendirir; yapı ruhsatına doğrudan ölçü alınan ayrıntılı karar ise uygulama imar planı ve ilgili uygulama mevzuatıyla kurulmalıdır.",
      "Çelişki çözülemiyorsa tasarım varsayımı üretmek yerine ilgili idareden yazılı görüş/imar durumu teyidi alınmalı; karar proje dosyasında kaynak, tarih ve revizyon numarasıyla saklanmalıdır."
    )),
    section("belge-seti", "1. Tek bir PDF değil, yürürlükteki belge setini çıkar", phase6Lines(
      "Bir parsel için minimum kontrol seti; üst ölçek kararlar, nazım plan, 1/1000 uygulama imar planı, plan paftası, lejant/gösterim, plan notları, plan açıklama raporu, varsa plan değişiklikleri ve ilgili idarenin imar durum belgesidir. Bunların bir kısmını görmeden yalnız belediyenin özet imar durumu ekranına dayanmak risklidir.",
      "Plan değişikliklerinde eski ve yeni notlar aynı dosya klasöründe bulunabilir. Yürürlük tarihi ve onay merciini kaydetmeyen ekip, iptal edilmiş veya değiştirilmiş bir hükmü yanlışlıkla tasarıma taşıyabilir."
    )),
    section("kademelenme", "2. Plan kademelenmesi ile uygulama ayrıntısını karıştırma", phase6Lines(
      "Mekânsal planlama kademelenmesi; mekânsal strateji/üst ölçek kararlarından çevre düzeni, nazım imar ve uygulama imar planına doğru ayrıntılanır. Üst ölçek planlar alt ölçeğe hedef ve yön verir; nazım/çevre düzeni gibi planlardan parsel uygulaması için doğrudan ölçü alınması doğru yöntem değildir.",
      "Uygulama imar planı; yapı adaları, kullanım, yapı nizamı, bina yüksekliği, TAKS/KAKS/emsal, yapı yaklaşma mesafesi, ifraz hattı ve ulaşım gibi ruhsat kararına doğrudan etki eden ayrıntıları taşır. Bu nedenle ‘üst planda böyle yazıyor’ gerekçesi, alt ölçek planın yürürlükteki ayrıntısını yok saymak için tek başına yeterli değildir."
    )),
    section("celiski-matrisi", "3. Çelişkiyi dört soruluk matrisle çöz", phase6Lines(
      "| Soru | Kontrol | Tasarım aksiyonu |\n|---|---|---|\n| Hangi belge? | Pafta, plan notu, rapor, Yönetmelik | Kaynağı sınıflandır |\n| Hangi ölçek? | Üst ölçek / nazım / 1/1000 uygulama | Uygulama ayrıntı düzeyini belirle |\n| Hangi tarih? | İlk onay + değişiklik + kesinleşme | Yürürlükteki metni seç |\n| Hangi konu? | Kullanım, emsal, yükseklik, çekme, özel koşul | Aynı konuya ait hükümleri karşılaştır |\n| Hâlâ belirsiz mi? | İdari yorum gerekiyor mu? | Yazılı görüş/teyit al |",
      "Bu matris özellikle ‘plan notunda Hmax başka, imar durumunda başka’, ‘emsal hesabı notu genel Yönetmelikten farklı’ veya ‘özel proje alanı için ek hüküm var’ gibi dosyalarda sözlü kabulleri azaltır."
    )),
    section("yonetmelik-iliskisi", "4. Plan notu, Yönetmeliğin değiştirilemez alanlarını aşamaz", phase6Lines(
      "Plan notu güçlü bir uygulama belgesidir; ancak her yönetmelik hükmünü sınırsız biçimde değiştiren bir serbestlik alanı değildir. Planlı Alanlar İmar Yönetmeliğinde planlarla veya yerel yönetmeliklerle değiştirilemeyecek tanım/ilke alanları ve özel mevzuat hükümleri bulunur. Ayrıca yangın, deprem, erişilebilirlik, otopark ve diğer özel teknik mevzuat kendi bağlayıcı koşullarını sürdürebilir.",
      "Bu yüzden bir plan notunda ‘serbest’ veya ‘uygulanmaz’ ifadesi görülmesi, hangi mevzuat hükmüne ilişkin olduğuna bakılmadan genelleştirilmemelidir. Mühendislik sorumluluğu, çelişkiyi kaynak göstererek çözmek ve gerekiyorsa idari görüşü dosyaya eklemektir."
    )),
    section("2026-guncellik", "5. 2026 değişiklik zincirini plan notundan ayrı izle", phase6Lines(
      "Plan notu yıllardır değişmemiş olsa bile ulusal uygulama mevzuatı değişebilir. 14 Ocak 2026 ve 1 Temmuz 2026 Planlı Alanlar İmar Yönetmeliği değişiklikleri; asma kat, aplikasyon, emsal, TAKS, asansör ve yeniden ruhsat gibi başlıklarda proje kararlarını etkiledi. 22 Ocak 2026 tarihli ve 33145 sayılı Mekânsal Planlar Yapım Yönetmeliği değişikliği de plan gösterim eklerini güncelledi.",
      "Dolayısıyla kontrol tarihi her teknik dosyada görünür olmalıdır. ‘Plan notu 2020 tarihli’ bilgisi, 2026'da ruhsat alacak projenin bütün ulusal mevzuatının 2020'de donduğu anlamına gelmez."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Plan paftası, plan notları ve plan açıklama raporu aynı onay/revizyon setinden mi?",
      "- [ ] Üst ölçek, nazım ve uygulama imar planı kademeleri ayrıldı mı?",
      "- [ ] Parsel için yürürlükteki son plan değişikliği ve kesinleşme tarihi kontrol edildi mi?",
      "- [ ] Çelişen hükümler aynı konu başlığı altında karşılaştırıldı mı?",
      "- [ ] Plan notunun değiştiremeyeceği ulusal/özel mevzuat hükümleri kontrol edildi mi?",
      "- [ ] 14 Ocak, 22 Ocak ve 1 Temmuz 2026 güncellemeleri proje tarihine göre tarandı mı?",
      "- [ ] Belirsizlik varsa ilgili idareden yazılı görüş veya imar durumu teyidi alındı mı?",
      "- [ ] Verilen kararın kaynak URL'si, tarih ve revizyonu proje kontrol föyüne işlendi mi?"
    )),
  ],
  relatedSlugs: ["imar-taks-kaks-emsal-hesabi", "imar-parsel-tevhid-ifraz-prosedurleri", "imar-ruhsat-sureci-basvurudan-iskan-kadar"],
  references: [
    ...imarPhase6References("genel ilkeler, planla değiştirilebilen/değiştirilemeyen hükümler ve uygulama ilişkisi"),
    { label: "ÇŞİDB Mekânsal Planlama Genel Müdürlüğü — plan kademelenmesi ve güncel mevzuat", href: MEKANSAL_PLANLAMA_PAGE, note: "Planların pafta, gösterim, plan notları ve raporla bütünlüğü ile plan kademelenmesi için resmî kaynak." },
    { label: "Resmî Gazete — 22 Ocak 2026 / 33145 Mekânsal Planlar Yapım Yönetmeliği değişikliği", href: MEKANSAL_PLANLAR_2026, note: "2026 plan gösterim ekleri ve güncel değişiklik zinciri." },
  ],
  keywords: ["plan notu", "uygulama imar planı", "plan paftası", "plan raporu", "plan kademelenmesi", "1/1000", "33145"],
  tags: ["İmar", "Plan Notu", "Plan Kademelenmesi", "Ruhsat", "Teknik Kontrol"],
};

export const DEPREM_PHASE6_BATCH_2_ARTICLES = [
  DEPREM_PHASE6_IMAR_BASEMENT,
  DEPREM_PHASE6_IMAR_BALCONY,
  DEPREM_PHASE6_IMAR_PERMIT,
  DEPREM_PHASE6_IMAR_PARCEL,
  DEPREM_PHASE6_IMAR_PLAN_NOTE,
] as const;
