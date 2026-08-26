import { phase5Lines, PHASE5_UPDATED_AT, type DepremPhase5Override } from "./deprem-phase5-shared";

const CED_BASE = "https://www.resmigazete.gov.tr/eskiler/2022/07/20220729-2.htm";
const CED_2026_AMENDMENT = "https://www.resmigazete.gov.tr/eskiler/2026/03/20260305-3.htm";
const CED_2026_CIRCULAR = "https://ced.csb.gov.tr/haberler/ced-yonetmeligi-uygulamalarina-dair-genelge-304302";
const CED_HOUSING_EXAMPLE = "https://webdosya.csb.gov.tr/db/kentseldirenclilik/icerikler/moeucc-esmf-turkeyurbanres-l-ence-p173025----2023-03-15-tr-20230320053549.pdf";
const ENV_REGULATIONS = "https://cygm.csb.gov.tr/yonetmelikler-440";
const WASTE_GUIDANCE = "https://yalova.csb.gov.tr/haberler/insaat-ve-yikinti-atiklari-ile-ilgili-mevzuat-ve-uygulamalar-169143";
const WASTE_DRAFTS = "https://cygm.csb.gov.tr/taslaklar-443";
const NOISE_REGULATION = "https://www.resmigazete.gov.tr/eskiler/2022/11/20221130-1.htm";
const NOISE_FAQ = "https://cygm.csb.gov.tr/?initialSessionID=257-6571836-6361948&ld=SDFRSOADirect";
const DEMOLITION_REGULATION = "https://www.resmigazete.gov.tr/eskiler/2021/10/20211013-1.htm";
const WATER_REGULATION = "https://webdosya.csb.gov.tr/db/cygm/icerikler/su-k-rl-l-g--kontrolu-yonetmel-g--20190104091110.pdf";
const MOGAN_ENFORCEMENT = "https://ced.csb.gov.tr/haberler/mogan-golundeki-kirlilige-ceza-305246";

export const DEPREM_PHASE5_CEVRE_CED: DepremPhase5Override = {
  slug: "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri",
  title: "ÇED Gerekliliği ve Proje Büyüklüğü Eşikleri: 2026 Güncel Karar Akışı",
  description: "ÇED Yönetmeliğinin 5 Mart 2026 değişikliği ve 2026/4 Genelgesi sonrasında Ek-1/Ek-2 sınıflamasını, proje kapasitesi ve revizyon etkisini, güncel karar terminolojisini ve mühendislik kontrol zincirini açıklar.",
  seoTitle: "ÇED Gerekliliği ve Proje Eşikleri | 2026 Güncel Rehber",
  seoDescription: "2026 ÇED değişikliği, Ek-1/Ek-2 sınıflaması, 200 konut örneği, proje kapasitesi ve güncel ÇED karar terminolojisi için mühendislik kontrol rehberi.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "16 dk",
  relatedSlugs: ["cevre-insaat-atigi-yonetimi-yonetmeligi", "cevre-gurultu-ve-toz-santiye-yukumlulukleri", "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu"],
  sections: [
    {
      id: "ced-2026-cerceve",
      title: "ÇED kapsamını 2022 metninden değil, 5 Mart 2026 değişikliği ve 2026/4 Genelgesiyle birlikte okuyun",
      content: phase5Lines(
        "Çevresel Etki Değerlendirmesi süreci için temel metin 29 Temmuz 2022 tarihli ve 31907 sayılı ÇED Yönetmeliğidir. Ancak proje kontrolü yapılırken bu metin tek başına yeterli değildir: **5 Mart 2026** tarihli ve **33187** sayılı Resmî Gazete değişikliği yürürlüğe girmiş, ardından Bakanlık 18 Mart 2026 tarihli **2026/4** sayılı Genelge ile yürürlükteki genelge, usul-esas ve talimatları tek uygulama çerçevesinde toplamıştır.",
        "",
        "Bu nedenle ofiste kullanılan eski bir 'ÇED gerekli / gerekli değil' kontrol tablosunu doğrudan projeye uygulamak yanlış olabilir. İlk kontrol, proje başvuru tarihinde yürürlükteki konsolide Yönetmelik, **Ek-1**, **Ek-2** ve 2026/4 Genelgesinin birlikte okunmasıdır.",
        "",
        "Teknik sorumluluk yalnız çevre danışmanına bırakılmaz. Proje mühendisi kapasiteyi, alanı, etapları ve yardımcı tesisleri doğru tarif etmezse yanlış sınıflama daha ilk girdide oluşur."
      ),
      subsections: [],
    },
    {
      id: "ek1-ek2-siniflama",
      title: "Ek-1 ve Ek-2 kararını proje adıyla değil faaliyet, kapasite ve bütünleşik proje üzerinden kurun",
      content: phase5Lines(
        "ÇED sınıflamasında aynı yapının yalnız mimari adı değil; faaliyetin türü, kapasitesi, alanı, yardımcı tesisleri, aynı sahadaki bağlantılı üniteler ve etaplama biçimi birlikte değerlendirilmelidir. **Ek-1** ile **Ek-2** listeleri bu nedenle bir 'isim eşleştirme' tablosu değildir.",
        "",
        "| Kontrol | Mühendislik sorusu | Çıktı |",
        "|---|---|---|",
        "| Faaliyet türü | Proje hangi Ek-1/Ek-2 faaliyet tanımına gerçekten giriyor? | Liste maddesi |",
        "| Kapasite | Tasarım kapasitesi, alanı, yatak/konut/adet/debi vb. nedir? | Eşik karşılaştırması |",
        "| Bütünlük | Yardımcı tesis ve aynı sahadaki bağlantılı üniteler birlikte mi değerlendirilmelidir? | Kümülatif kapsam |",
        "| Etaplama | Etaplar tek yatırımın parçaları mı, bağımsız projeler mi? | Revizyon/kapsam kararı |",
        "| Proje tarihi | Güncel Ek-1/Ek-2 sürümü hangisidir? | Geçerli mevzuat seti |",
        "",
        "Bakanlığın resmî proje dokümanlarında toplu konut için **200 konut ve üzeri** Ek-2 örneği yer almaktadır. Bu sayı pratik bir kontrol işaretidir; ancak 2026 değişiklikleri nedeniyle kesin karar, mutlaka **proje tarihinde** yürürlükteki güncel Ek-1/Ek-2 listesi üzerinden verilmelidir."
      ),
      subsections: [],
    },
    {
      id: "karar-terminolojisi",
      title: "2026 değişikliği sonrası karar terminolojisini eski ifadelerle karıştırmayın",
      content: phase5Lines(
        "2026 düzenlemesi sonrasında süreç terminolojisi değişmiştir. Güncel uygulamada eski dosyalarda görülen ifadeleri otomatik olarak yeni başvuruya taşımak yerine Bakanlığın 2026 çerçevesi kullanılmalıdır. Özellikle Ek-2 değerlendirmesinde olumsuz kararın **ÇED Raporu Hazırlanmalıdır** şeklinde, Ek-1 sürecindeki olumlu kararın ise **ÇED Olumlu** terminolojisiyle okunması gerekir.",
        "",
        "Eski 'ÇED Gerekli Değildir' belgeleri tarihsel dosyanın parçası olabilir; fakat yeni proje veya revizyon kontrolünde güncel terminolojiye göre işlem akışı kurulmalıdır. Yanlış terminoloji, yanlış form ve yanlış başvuru kanalına kadar ilerleyen idari hatalar üretir.",
        "",
        "Proje notlarında kararın adı kadar karar tarihi, karar numarası, kapsadığı kapasite ve koordinat/saha bilgisi birlikte tutulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "revizyon-kapasite",
      title: "Kapasite artışı, saha değişikliği ve proje revizyonu ÇED kararını yeniden kontrol ettirir",
      content: phase5Lines(
        "ÇED kararı alındıktan sonra mimari veya mühendislik tasarımı değişebilir. Kapasite artışı, ilave blok/ünite, alan büyümesi, proses değişikliği veya etapların yeniden düzenlenmesi halinde eski kararın yeni projeyi otomatik kapsadığı varsayılmamalıdır.",
        "",
        "Revizyon kontrolünde önce onaylı ÇED kapsamı ile yeni tasarım yan yana konur; kapasite, alan, proses, yardımcı ünite ve saha sınırı farkları işaretlenir. Sonra güncel Yönetmelik ve 2026/4 Genelgesi kapsamında Bakanlık/İl Müdürlüğü değerlendirmesi gerekip gerekmediği belirlenir.",
        "",
        "Yanlış uygulama, yapı ruhsatı veya ihale revizyonunu çevresel karar revizyonundan bağımsız yönetmektir. Böyle bir kopukluk sahada durdurma, yeniden başvuru ve sözleşme/program uyuşmazlığı riski doğurur."
      ),
      subsections: [],
    },
    {
      id: "proje-etkisi",
      title: "ÇED kararı proje programına, yerleşime ve ihale kapsamına erken bağlanmalıdır",
      content: phase5Lines(
        "ÇED süreci yalnız izin takvimidir; proje kararlarını da etkiler. Hafriyat, şantiye yolları, kırma-eleme, beton tesisi, deşarj, geçici depolama, gürültü kontrolü ve çevresel izleme yükümlülükleri ihale kapsamına ve saha yerleşimine erken taşınmalıdır.",
        "",
        "Mühendislik ekibi için kritik çıktı bir 'ÇED var/yok' etiketi değil, proje şartlarına dönüşmüş yükümlülük matrisidir. Her yükümlülüğün pafta, teknik şartname, metraj, iş programı veya saha prosedüründeki karşılığı gösterilmelidir.",
        "",
        "Bu bağlantı kurulmadığında yüklenici, karar metninde zorunlu olan tedbiri fiyatlamamış veya şantiye yerleşiminde fiziksel alan bırakmamış olabilir."
      ),
      subsections: [],
    },
    {
      id: "sorumluluk-yanlis",
      title: "Teknik sorumluluk: kapasiteyi düşük göstermek veya projeyi yapay etaplara bölmek kabul edilebilir bir çözüm değildir",
      content: phase5Lines(
        "ÇED kapsamı proje verisinin doğru beyanına dayanır. Faaliyet kapasitesini eksik göstermek, birbiriyle bütünleşik üniteleri bağımsızmış gibi ele almak veya tek yatırımın etaplarını sırf eşik altına inmek amacıyla parçalamak teknik ve idari risk yaratır.",
        "",
        "Proje sorumluluğu; güncel liste maddesini göstermek, kapasite hesabını izlenebilir yapmak, revizyonları kayıt altına almak ve çevresel karar ile ruhsat/uygulama projesinin aynı kapsamı tarif ettiğini doğrulamaktır.",
        "",
        "Şüpheli durumda 'eşik altında görünüyor' yorumu yerine güncel mevzuat ve yetkili idare görüşüyle kayıtlı karar alınmalıdır."
      ),
      subsections: [],
    },
    {
      id: "ced-checklist",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Proje tarihinde yürürlükteki 2022 ÇED Yönetmeliği, **5 Mart 2026 / 33187** değişikliği ve **2026/4** Genelgesini kontrol ettim.",
        "- [ ] Faaliyeti güncel **Ek-1** ve **Ek-2** listelerinde doğru maddeyle eşleştirdim.",
        "- [ ] Kapasite, alan, adet ve yardımcı tesisleri kümülatif olarak kontrol ettim.",
        "- [ ] **200 konut** örneğini yalnız güncel liste kontrolüne başlangıç işareti olarak kullandım.",
        "- [ ] Revizyonların mevcut ÇED karar kapsamını değiştirip değiştirmediğini karşılaştırdım.",
        "- [ ] Güncel karar terminolojisini (**ÇED Raporu Hazırlanmalıdır / ÇED Olumlu**) kullandım.",
        "- [ ] ÇED yükümlülüklerini pafta, teknik şartname, metraj ve iş programına aktardım.",
        "- [ ] Proje kapasitesi ve etaplamasına ilişkin teknik sorumluluk kaydını dosyada tuttum."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "Resmî Gazete — ÇED Yönetmeliği, 29.07.2022 / 31907", href: CED_BASE },
    { label: "Resmî Gazete — ÇED Yönetmeliği Değişikliği, 05.03.2026 / 33187", href: CED_2026_AMENDMENT },
    { label: "ÇŞİDB — 18.03.2026 tarih ve 2026/4 sayılı ÇED Yönetmeliği Uygulamalarına Dair Genelge", href: CED_2026_CIRCULAR },
    { label: "ÇŞİDB — resmî proje dokümanı, toplu konut 200 konut ve üzeri Ek-2 örneği", href: CED_HOUSING_EXAMPLE, note: "Eşik örneği tarihsel/güncel liste kontrolünün yerine geçmez; proje tarihinde konsolide Ek-1/Ek-2 doğrulanmalıdır." },
  ],
  keywords: ["ÇED", "2026/4", "Ek-1", "Ek-2", "200 konut", "ÇED Olumlu", "proje kapasitesi"],
  tags: ["Çevre", "ÇED", "mevzuat", "proje kontrolü"],
};

export const DEPREM_PHASE5_CEVRE_WASTE: DepremPhase5Override = {
  slug: "cevre-insaat-atigi-yonetimi-yonetmeligi",
  title: "İnşaat ve Yıkıntı Atığı Yönetimi: Hafriyattan Yetkili Tesise İzlenebilir Zincir",
  description: "18.03.2004 tarihli yürürlükteki hafriyat ve inşaat/yıkıntı atığı mevzuatını, 2 tondan fazla atık için belge zincirini, kaynağında ayırma ve yetkili tesis kontrolünü; 2026 taslak metniyle karıştırmadan açıklar.",
  seoTitle: "İnşaat Atığı Yönetimi | Hafriyat, Belge ve Yetkili Tesis Kontrolü",
  seoDescription: "2004/25406 yürürlükteki yönetmelik, Madde 9 ve Madde 23, 2 tondan fazla atık, Atık taşıma ve kabul belgesi, ayrı toplama ve yetkili tesis kontrolü.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "14 dk",
  relatedSlugs: ["cevre-ced-zorunlulugu-proje-buyuklugu-esikleri", "cevre-gurultu-ve-toz-santiye-yukumlulukleri", "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu"],
  sections: [
    {
      id: "yururluk-taslak",
      title: "Yürürlükteki metin 18.03.2004 / 25406 Yönetmeliktir; 2026'daki yeni metin hâlâ taslaktır",
      content: phase5Lines(
        "ÇŞİDB'nin güncel yönetmelikler listesinde **Hafriyat Toprağı, İnşaat ve Yıkıntı Atıklarının Kontrolü Yönetmeliği** için yayımlanma bilgisi **18.03.2004 / 25406** olarak yer almaktadır. Aynı Bakanlığın Taslaklar sayfasında ise 'Hafriyat Toprağı ile İnşaat ve Yıkıntı Atıklarının Yönetimine İlişkin Yönetmelik' ayrı biçimde **taslak** olarak listelenmektedir.",
        "",
        "Bu ayrım proje dosyasında açık olmalıdır. Taslak metindeki yeni hükümleri yürürlükteymiş gibi zorunlu tutmak da, yürürlükteki 2004 Yönetmeliğini güncelliğini yitirmiş sanıp göz ardı etmek de yanlıştır.",
        "",
        "Teknik şartname ve atık yönetim planında mevzuat adı, tarih ve sayı birlikte yazılmalı; taslak çalışma varsa yalnız 'gelecekteki olası değişiklik' notu olarak ayrıştırılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "madde9-zincir",
      title: "Madde 9 mantığı: azalt, ayrı topla, izinli taşı ve geri kazanım/bertaraf zincirini kanıtla",
      content: phase5Lines(
        "Yürürlükteki Yönetmeliğin **Madde 9** yaklaşımı, atığın yalnız sahadan uzaklaştırılmasına değil bütün yönetim zincirine odaklanır. Oluşumu ve çevresel etkileri azaltmak, atıkları bileşenlerine göre **ayrı toplamak**, taşıma/depolama/geri kazanım işlemlerini **izinli** kişi ve tesislerle yürütmek ve geri kazanımı önceliklendirmek temel kontrol başlıklarıdır.",
        "",
        "| Aşama | Kontrol | Kayıt |",
        "|---|---|---|",
        "| Oluşum | Hafriyat, beton, tuğla, metal, ahşap, ambalaj vb. ayrımı | Atık tahmini / saha planı |",
        "| Kaynağında ayırma | Karışmayı önleyen ayrı konteyner/alan | Günlük saha kontrolü |",
        "| Taşıma | Yetkili taşıyıcı ve uygun araç | Sevk/taşıma kaydı |",
        "| Kabul | Yetkili geri kazanım/depolama tesisi | Kabul belgesi / fiş |",
        "| Kapanış | Tahmini-gerçek miktar mutabakatı | Atık kapanış raporu |",
        "",
        "Karışık atık, geri kazanılabilir fraksiyonların değerini düşürür ve kaçak dökümün izlenmesini zorlaştırır. Saha yerleşiminde ayırma alanı bırakmak bu nedenle yalnız çevre görevlisinin değil şantiye planlamasının konusudur."
      ),
      subsections: [],
    },
    {
      id: "madde23-belge",
      title: "Madde 23: 2 tondan fazla inşaat/yıkıntı atığında Atık taşıma ve kabul belgesi kontrolü",
      content: phase5Lines(
        "Bakanlığın resmî uygulama açıklamasına göre Yönetmeliğin **Madde 23** hükmü, faaliyetleri sonucu **2 tondan fazla** inşaat/yıkıntı atığı oluşmasına neden olan üreticilere **Atık taşıma ve kabul** belgesini alma ve doldurma yükümlülüğü getirir.",
        "",
        "Belgede üretici irtibatı, atık türü ve miktarı, taşıyıcı ve kabul/geri kazanım tesisi bilgileri kayıt altına alınır. Bu belge tek başına iyi bir atık yönetim planının yerine geçmez; fakat atığın kaynaktan yetkili tesise izlenebilirliğinde temel kanıt zinciridir.",
        "",
        "Yanlış uygulama, kamyon sahadan çıktıktan sonra işin tamamlandığını varsaymaktır. Tesise kabul kaydı ile sevk miktarı eşleştirilmedikçe atığın nihai akıbeti kanıtlanmış değildir."
      ),
      subsections: [],
    },
    {
      id: "saha-lojistik",
      title: "Atık planı saha lojistiği, trafik ve geçici depolama düzeniyle birlikte tasarlanmalıdır",
      content: phase5Lines(
        "Atık konteynerleri, hafriyat geçici bekletme alanı, araç giriş-çıkışı ve tekerlek temizliği şantiye yerleşim planının parçasıdır. Atık alanı drenaj hattını, yangın yolunu veya yaya güzergâhını kapatmamalıdır.",
        "",
        "Toprak/hafriyat ile tehlikeli içerik şüphesi bulunan malzemeler aynı yönetim zincirine otomatik sokulmamalıdır. Asbest, kirlenmiş toprak veya tehlikeli atık şüphesinde ilgili özel mevzuat ve uzman değerlendirmesi ayrıca devreye alınır.",
        "",
        "Taşıma saatleri ve rota planı gürültü, toz ve komşuluk riskleriyle birlikte koordine edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "metraj-sozlesme",
      title: "Atık yönetimini metraj ve sözleşmeye bağlayın: tonaj farkı maliyet ve belge farkıdır",
      content: phase5Lines(
        "Kazı ve yıkım öncesi yaklaşık atık miktarı hesaplanmalı; sözleşmede ayırma, yükleme, taşıma, kabul ve gerektiğinde geri kazanım bedelleri ayrı tanımlanmalıdır. Gerçek tonaj/araç adedi sahada izlenmeli ve kabul belgeleriyle karşılaştırılmalıdır.",
        "",
        "Mühendislik sorumluluğu, yalnız 'atıklar mevzuata uygun bertaraf edilecektir' cümlesi yazmak değildir. Hangi atık nereye, hangi taşıyıcıyla, hangi belgeyle ve hangi tesise gidecek sorularının proje/şantiye prosedüründe cevabı olmalıdır.",
        "",
        "Yanlış metraj, taşıma maliyetini ve geçici depolama alanını küçültür; sonradan düzensiz bir saha akışına neden olur."
      ),
      subsections: [],
    },
    {
      id: "yanlis-sorumluluk",
      title: "Sık yanlış: yetkisiz sahaya döküm veya karışık atığı tek kalemde 'moloz' kabul etmek",
      content: phase5Lines(
        "İnşaat atığını tek bir 'moloz' kalemi gibi görmek, malzeme geri kazanımını ve izlenebilirliği bozar. Metal, temiz beton/tuğla, ahşap ve diğer akışlar imkan dahilinde kaynağında ayrılmalıdır.",
        "",
        "Yetkisiz alana bırakma, geçici olarak boş arsada stoklama veya taşıyıcının sözlü beyanına güvenme kabul edilebilir kontrol yöntemi değildir. Sorumluluk zinciri üretim noktasından yetkili kabul tesisine kadar belgeyle izlenir.",
        "",
        "Atık planı revizyonları günlük saha gerçekliğiyle uyuşmuyorsa kayıtlar düzeltilmeli; miktar farkları açıklanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "waste-checklist",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] Esas mevzuatı **18.03.2004 / 25406** yürürlükteki Yönetmelik olarak tanımladım.",
        "- [ ] Bakanlık Taslaklar sayfasındaki yeni metni yürürlükte mevzuat gibi kullanmadım; **taslak** olduğunu belirttim.",
        "- [ ] **Madde 9** kapsamında azaltma, **ayrı toplamak**, izinli taşıma ve geri kazanım zincirini planladım.",
        "- [ ] **Madde 23** kapsamında **2 tondan fazla** atık için **Atık taşıma ve kabul** belgesi gereğini kontrol ettim.",
        "- [ ] Atık türleri ve tahmini miktarları metraj/lojistik planına işledim.",
        "- [ ] Taşıyıcı ve kabul tesisinin **izinli** olduğunu doğruladım.",
        "- [ ] Sevk miktarı ile tesis kabul kaydını mutabakat yaptım.",
        "- [ ] Özel/tehlikeli atık şüphesini genel inşaat atığı akışından ayırdım."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "ÇŞİDB Çevre Yönetimi GM — Yönetmelikler; 18.03.2004 / 25406 Hafriyat Toprağı, İnşaat ve Yıkıntı Atıkları Yönetmeliği", href: ENV_REGULATIONS },
    { label: "ÇŞİDB Yalova İl Müdürlüğü — İnşaat ve Yıkıntı Atıkları ile İlgili Mevzuat ve Uygulamalar; Madde 23 ve 2 ton belge açıklaması", href: WASTE_GUIDANCE },
    { label: "ÇŞİDB Çevre Yönetimi GM — Taslaklar; yeni hafriyat/inşaat-yıkıntı atığı yönetmeliği taslağı", href: WASTE_DRAFTS, note: "Taslak kaynak yürürlükte mevzuat değildir; yalnız güncellik ayrımını göstermek için verilmiştir." },
  ],
  keywords: ["hafriyat", "inşaat atığı", "Madde 23", "2 tondan fazla", "Atık taşıma ve kabul", "25406"],
  tags: ["Çevre", "atık", "hafriyat", "şantiye"],
};

export const DEPREM_PHASE5_CEVRE_NOISE_DUST: DepremPhase5Override = {
  slug: "cevre-gurultu-ve-toz-santiye-yukumlulukleri",
  title: "Şantiyede Gürültü ve Toz: Çalışma Saatleri, Ölçüm ve Kaynakta Kontrol",
  description: "30 Kasım 2022 Çevresel Gürültü Kontrol Yönetmeliği kapsamında şantiye gürültüsünü, Bakanlığın 100 dBC ve 10:00-22:00 uygulama açıklamasını, ölçüm standardını ve toz kontrolünü; yıkıma özgü TS 13633/TS 13883 hükümlerini genelleştirmeden açıklar.",
  seoTitle: "Şantiye Gürültü ve Toz Kontrolü | 100 dBC, Saat ve Ölçüm",
  seoDescription: "Şantiye için 2022 gürültü yönetmeliği, 100 dBC, 10:00-22:00, TS ISO 1996-1/2 ölçümü ve yıkımda TS 13633/TS 13883 toz kontrolü.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "15 dk",
  relatedSlugs: ["cevre-insaat-atigi-yonetimi-yonetmeligi", "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu", "isg-yuksekte-calisma-ve-iskele-guvenligi"],
  sections: [
    {
      id: "gurultu-2022-kapsam",
      title: "30 Kasım 2022 / 32029 Yönetmeliği inşaat kaynaklı çevresel gürültüyü kapsar",
      content: phase5Lines(
        "**30 Kasım 2022** tarihli ve **32029** sayılı Resmî Gazete'de yayımlanan Çevresel Gürültü Kontrol Yönetmeliği, inşaat faaliyetlerinden kaynaklanan çevresel gürültü ve titreşimi kapsamına alır. Bu kontrol, çalışan maruziyetine ilişkin İSG gürültü hükümlerinden farklıdır; burada komşu çevre ve yerleşim alanındaki çevresel etki yönetilir.",
        "",
        "Şantiye planında gürültülü ekipman, çalışma saati, komşu hassas kullanımlar, ekipman yerleşimi ve geçici bariyer/kapama tedbirleri birlikte değerlendirilmelidir.",
        "",
        "Yanlış uygulama, yalnız ekipman katalog ses gücüne bakıp gerçek saha konumu, eşzamanlı makineler ve yansıma/mesafe etkilerini göz ardı etmektir."
      ),
      subsections: [],
    },
    {
      id: "100dbc-saat",
      title: "Bakanlık uygulama açıklaması: 100 dBC kontrolü ve yerleşim alanında 10:00-22:00 çalışma aralığı",
      content: phase5Lines(
        "Bakanlığın güncel soru-cevap açıklamasında Yönetmelik Ek-2 Tablo 1 kapsamında tüm kaynaklar için **100 dBC** kontrolü belirtilmekte; yerleşim alanlarında dönemsel şantiye faaliyetleri için genel çalışma aralığı **10:00-22:00** olarak açıklanmaktadır.",
        "",
        "| Konu | Kontrol | Mühendislik notu |",
        "|---|---|---|",
        "| Ani/tepe gürültü | 100 dBC Bakanlık uygulama açıklaması | Ölçüm/uygulama koşulunu güncel Ek-2 ile birlikte doğrula |",
        "| Yerleşim alanı şantiye saati | 10:00-22:00 genel açıklama | İl Mahalli Çevre Kurulu / yerel kararları ayrıca kontrol et |",
        "| Çevresel ölçüm | TS ISO 1996-1 / TS ISO 1996-2 yaklaşımı | Yetkin ölçüm ve doğru nokta/zaman seçimi |",
        "| Şantiye planı | Kaynakta azaltım + bariyer + zamanlama | Şikâyet sonrası değil iş başlamadan planla |",
        "",
        "Bu değerler yerel/idari kararların yerine geçmez. Hassas alan, gece çalışması, özel izin veya yerel kurul kararı varsa proje özelindeki daha kısıtlayıcı koşul ayrıca uygulanır."
      ),
      subsections: [],
    },
    {
      id: "olcum-izleme",
      title: "Ölçümü yalnız şikâyet sonrasında değil, riskli iş paketi öncesinde planlayın",
      content: phase5Lines(
        "Çevresel gürültü ölçümünde **TS ISO 1996-1** ve **TS ISO 1996-2** esaslarına uygun ölçüm noktası, süre, meteorolojik koşul ve kaynak çalışma senaryosu önemlidir. Tek bir rastgele telefon ölçümü teknik kabul için yeterli değildir.",
        "",
        "Kazık, kırıcı, kesme, yükleme veya yoğun kamyon trafiği gibi iş paketleri başlamadan yakın hassas alıcılar belirlenmeli; gerekiyorsa başlangıç ölçümü ve izleme planı yapılmalıdır.",
        "",
        "Sorumluluk, ölçüm sonucunu dosyalamakla bitmez. Aşım veya rahatsızlık riski varsa ekipman, çalışma sırası, bariyer, mesafe ve süre tedbirleri revize edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "toz-genel-kontrol",
      title: "Toz kontrolü kaynakta başlar: kuru yüzey, stok, kamyon ve kesme/kırma işlemlerini ayrı yönetin",
      content: phase5Lines(
        "Genel şantiye tozu için temel mühendislik yaklaşımı kaynağı azaltmak ve yayılım yolunu kesmektir. Uygun sulama/nemlendirme, stokların ve kamyon yüklerinin örtülmesi, saha yollarının temiz tutulması, tekerlek temizliği, düşük araç hızı ve kesme/kırmada lokal toz bastırma birlikte düşünülmelidir.",
        "",
        "Toz kontrolünün amacı zemini sürekli çamura çevirmek değildir. Aşırı sulama, sedimentli akış ve yağmur suyu kirliliği yaratabilir. Bu nedenle toz ve yüzey suyu planları birbiriyle koordine edilir.",
        "",
        "Yanlış uygulama, yalnız komşu şikâyeti geldiğinde tanker çağırmak; kuru ve rüzgârlı günler için önleyici çalışma kriteri tanımlamamaktır."
      ),
      subsections: [],
    },
    {
      id: "yikim-standartlari",
      title: "TS 13633 ve TS 13883 hükümlerini bütün şantiyeye genellemeyin: bunlar yıkım faaliyetinde özel önem taşır",
      content: phase5Lines(
        "Binaların Yıkılması Hakkında Yönetmelik, **yıkım** faaliyetlerinde toz ve çevresel etkilerin kontrolüne özel hükümler getirir. Yıkım planı ve uygulamasında **TS 13633** ile toz bastırmaya ilişkin **TS 13883** standartları dikkate alınır.",
        "",
        "Bu standartları herhangi bir yeni yapım şantiyesinin her toz faaliyetinde doğrudan zorunluymuş gibi yazmak doğru değildir. Genel inşaat tozunda ilgili çevre mevzuatı, proje koşulları ve iyi mühendislik tedbirleri; yıkımda ise Yıkım Yönetmeliğinin özel hükümleri birlikte uygulanır.",
        "",
        "Bu ayrım teknik şartnamede açık yazılırsa yıkım ve yeni yapım kapsamları birbirine karışmaz."
      ),
      subsections: [],
    },
    {
      id: "program-sorumluluk",
      title: "Gürültü ve toz tedbirlerini iş programı, komşuluk planı ve şantiye lojistiğine bağlayın",
      content: phase5Lines(
        "En gürültülü ve tozlu işler aynı gün/aynı cephede yığılırsa çevresel etki büyür. İş programında yüksek etkili faaliyetlerin süresi, saat aralığı, bariyer/kapama ihtiyacı ve kamyon trafiği koordine edilmelidir.",
        "",
        "Mühendislik sorumluluğu; yalnız ölçüm yaptırmak değil, hangi ekipmanın nerede ve hangi saatte çalışacağını, hangi kontrol tedbirinin devrede olacağını ve şikâyet/aşım halinde hangi işi kimin durduracağını tanımlamaktır.",
        "",
        "Yerel idare/İl Mahalli Çevre Kurulu kararları proje öncesinde kontrol edilmeli; 10:00-22:00 genel açıklaması daha özel bir yerel düzenlemeyi bertaraf etmez."
      ),
      subsections: [],
    },
    {
      id: "noise-dust-checklist",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] **30 Kasım 2022 / 32029** Çevresel Gürültü Kontrol Yönetmeliğini proje için doğruladım.",
        "- [ ] Bakanlığın **100 dBC** ve yerleşim alanında genel **10:00-22:00** açıklamasını güncel/yerel koşullarla birlikte değerlendirdim.",
        "- [ ] Gerektiğinde ölçümü **TS ISO 1996-1** ve **TS ISO 1996-2** yaklaşımıyla planladım.",
        "- [ ] Gürültülü ekipman için kaynakta azaltım, yerleşim, bariyer ve zamanlama tedbirlerini belirledim.",
        "- [ ] **Toz** için sulama, örtme, yol/tekerlek temizliği ve hız kontrolünü iş programına bağladım.",
        "- [ ] Aşırı sulamanın sedimentli yüzey akışı üretmesini engelledim.",
        "- [ ] **Yıkım** işinde **TS 13633** ve **TS 13883** özel hükümlerini ayrıca kontrol ettim.",
        "- [ ] Şikâyet/aşım halinde iş durdurma ve teknik sorumluluk zincirini tanımladım."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "Resmî Gazete — Çevresel Gürültü Kontrol Yönetmeliği, 30.11.2022 / 32029", href: NOISE_REGULATION },
    { label: "ÇŞİDB Çevre Yönetimi GM — şantiye gürültüsü 100 dBC ve 10:00-22:00 uygulama açıklaması", href: NOISE_FAQ },
    { label: "Resmî Gazete — Binaların Yıkılması Hakkında Yönetmelik; yıkım/toz hükümleri", href: DEMOLITION_REGULATION },
  ],
  keywords: ["şantiye gürültüsü", "100 dBC", "10:00-22:00", "TS ISO 1996-1", "TS 13633", "TS 13883", "toz"],
  tags: ["Çevre", "gürültü", "toz", "şantiye"],
};

export const DEPREM_PHASE5_CEVRE_STORMWATER: DepremPhase5Override = {
  slug: "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu",
  title: "Şantiye Yağmur Suyu Kirliliği: Sediment, Beton Yıkama ve Filtrasyon Kontrolü",
  description: "Şantiyede temiz yağmur suyu, sedimentli yüzey akışı ve proses/atık suyu birbirinden ayırır; 31.12.2004 Su Kirliliği Kontrolü Yönetmeliği ile 19 Mayıs 2026 Mogan yaptırım örneği üzerinden drenaj, çöktürme ve saha kontrolünü açıklar.",
  seoTitle: "Şantiye Yağmur Suyu ve Sediment Kontrolü | Drenaj ve Filtrasyon",
  seoDescription: "Şantiye yağmur suyu hattı, sedimentli yüzey akışı, çöktürme, beton yıkama suyu ve Su Kirliliği Kontrolü Yönetmeliğine göre mühendislik kontrol rehberi.",
  updatedAt: PHASE5_UPDATED_AT,
  readTime: "14 dk",
  relatedSlugs: ["cevre-gurultu-ve-toz-santiye-yukumlulukleri", "cevre-insaat-atigi-yonetimi-yonetmeligi", "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri"],
  sections: [
    {
      id: "uc-su-akisi",
      title: "İlk ayrım: temiz yağış, sedimentli yüzey akışı ve proses/atıksu aynı şey değildir",
      content: phase5Lines(
        "Şantiye drenajında bütün suyu tek hatta toplamak en yaygın hatalardan biridir. Temiz çatı/bozulmamış alan yağışı, kazı ve stok sahasından gelen **sediment** yüklü yüzey akışı ve beton yıkama/pompa temizliği gibi proses **atıksu** akımları farklı risk profiline sahiptir.",
        "",
        "**Su Kirliliği Kontrolü Yönetmeliği**, 31.12.2004 tarihli ve **25687** sayılı Resmî Gazete ile su kaynaklarının kirlenmesini önlemeye, atıksu boşaltım ilkeleri ve izleme/denetim esaslarına çerçeve getirir. Şantiye planı bu genel yükümlülüğü gerçek drenaj detaylarına çevirmelidir.",
        "",
        "Yanlış uygulama, saha eğimini yalnız suyu en hızlı şekilde parsel dışına atacak biçimde tasarlamaktır. Amaç debiyi uzaklaştırmak kadar kirletici taşınmasını kontrol etmektir."
      ),
      subsections: [],
    },
    {
      id: "drenaj-ayrim-tablosu",
      title: "Drenaj planında su kalitesini kaynağa göre sınıflandırın",
      content: phase5Lines(
        "| Akış türü | Tipik kaynak | Temel kontrol |",
        "|---|---|---|",
        "| Temiz yağmur suyu | Temiz çatı / bozulmamış alan | Kirli alanla temas ettirmeden güvenli güzergâha yönlendir |",
        "| Sedimentli akış | Kazı yüzeyi, stok, toprak yol | Sediment bariyeri + **çöktürme** / tutma |",
        "| Beton yıkama suyu | Mikser, pompa, ekipman temizliği | Kapalı/ayrılmış toplama; yağmur hattına verme |",
        "| Yağ/kimyasal riski | Yakıt, bakım, depolama alanı | İkincil sızdırmazlık + olay müdahalesi |",
        "",
        "Temiz suyu kirli sahaya sokmamak, arıtılması/tutulması gereken debiyi azaltır. Üst kotlardan gelen temiz akış çevre hendeği veya güvenli yönlendirme ile çalışma alanından ayrılabilir.",
        "",
        "Sorumluluk, bu şemayı yalnız paftada göstermek değil yağış sonrası çalışıp çalışmadığını sahada doğrulamaktır."
      ),
      subsections: [],
    },
    {
      id: "sediment-filtrasyon",
      title: "Sediment kontrolü: kaynağı stabilize et, akışı yavaşlat, çöktür ve çıkışı koru",
      content: phase5Lines(
        "Sediment yönetiminde tek bir geotekstil bariyer yeterli değildir. Açıkta kalan toprağı azaltmak, stokları korumak, yüzey hızını düşürmek, uygun noktalarda **çöktürme** hacmi veya sediment tutucu kullanmak ve yağmur ızgaralarını korumak birlikte çalışır.",
        "",
        "Tutma/çöktürme yapısının kapasitesi yağışa, drenaj alanına ve bakım sıklığına göre projelendirilir. Biriken çamur hacmi arttıkça etkin hacim azalır; dolayısıyla bakım eşiği ve sorumlusu tanımlanmalıdır.",
        "",
        "Her kuvvetli yağıştan sonra hendek, bariyer, giriş ve çıkışlar kontrol edilerek taşma, yırtılma veya bypass kaydı tutulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "beton-yikama",
      title: "Beton yıkama ve pompa temizleme suyu yağmur suyu hattına bağlanmamalıdır",
      content: phase5Lines(
        "**Beton yıkama** suyu yüksek askıda katı madde ve alkalinite nedeniyle sıradan yağmur suyu değildir. Mikser/pompa yıkama alanı ayrı, sızdırmaz ve kontrollü toplama mantığıyla planlanmalı; çökelen katı ve kalan su uygun prosedürle yönetilmelidir.",
        "",
        "Yağmur suyu ızgarasının yanında mikser yıkamak, suyu seyreltmek veya yoğun yağışta hattı 'temizlenir' varsayımıyla kullanmak kabul edilebilir değildir.",
        "",
        "Şantiye yerleşiminde beton yıkama alanı döküm başlamadan gösterilmeli; pompa güzergâhı ve temizlik noktası alt yükleniciyle sözleşme/işbaşı eğitiminde netleştirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "mogan-2026",
      title: "19 Mayıs 2026 Mogan olayı: atıksuyu yağmur suyu hattına bağlamak gerçek bir yaptırım riskidir",
      content: phase5Lines(
        "ÇŞİDB'nin **19 Mayıs 2026** tarihli resmî duyurusunda, bir köprü şantiyesinde oluşan atıksuyun arıtılmadan **yağmur suyu hattı** üzerinden Mogan Gölü'ne verilmesi çevre ihlali olarak tespit edilmiş; idari yaptırım ve suç duyurusu süreci açıklanmıştır.",
        "",
        "Bu örnek, yağmur suyu borusunun 'deşarj için hazır altyapı' olmadığını açıkça gösterir. Hat, yalnız uygun nitelikteki yağmur suyunu taşımak için kullanılır; proses/atıksu için ayrı toplama ve mevzuata uygun yönetim gerekir.",
        "",
        "Proje ekibi için çıkarım: geçici şantiye bağlantıları da kalıcı altyapı kadar pafta, onay ve saha kontrolü gerektirir."
      ),
      subsections: [],
    },
    {
      id: "program-bakim",
      title: "Yağmur suyu kontrolü bakım programı olmadan tamamlanmış sayılmaz",
      content: phase5Lines(
        "Sediment bariyeri, çöktürme alanı veya ızgara koruması ilk gün doğru kurulsa bile bakım yapılmazsa kısa sürede işlevini kaybeder. Haftalık saha turu ve yoğun yağış sonrası kontrol, çevre yönetim planının ölçülebilir parçası olmalıdır.",
        "",
        "Mühendislik sorumluluğu; drenaj güzergâhını, kirli-temiz su ayrımını, bakım eşiğini, numune/ölçüm gereğini ve uygunsuzluk halinde müdahale sahibini tanımlamaktır.",
        "",
        "Toz bastırma için yapılan sulama da bu sisteme dahildir: aşırı su, şantiye yolundan sediment taşıyan yapay yüzey akışına dönüşmemelidir."
      ),
      subsections: [],
    },
    {
      id: "stormwater-checklist",
      title: "Mühendislik kontrol listesi",
      content: phase5Lines(
        "- [ ] **Su Kirliliği Kontrolü Yönetmeliği** için **31.12.2004 / 25687** yürürlük bilgisini doğruladım.",
        "- [ ] Temiz yağış, **sediment** yüklü yüzey akışı ve proses **atıksu** akımlarını ayrı sınıflandırdım.",
        "- [ ] Kirli alanlara temiz su girişini çevre drenajıyla azalttım.",
        "- [ ] Sediment bariyeri ve **çöktürme** yapılarının bakım/temizlik eşiğini belirledim.",
        "- [ ] **Beton yıkama** alanını yağmur suyu ızgarası ve drenajından fiziksel olarak ayırdım.",
        "- [ ] Geçici bağlantıların hiçbirinde atıksuyu **yağmur suyu hattı**na vermedim.",
        "- [ ] **19 Mayıs 2026** tarihli **Mogan** yaptırım örneğini saha prosedüründe çevre riski olarak dikkate aldım.",
        "- [ ] Kuvvetli yağış sonrası drenaj/sediment kontrolünü kayıtlı saha turuna bağladım."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "ÇŞİDB Çevre Yönetimi GM — Su Kirliliği Kontrolü Yönetmeliği, 31.12.2004 / 25687", href: WATER_REGULATION },
    { label: "ÇŞİDB Çevre Yönetimi GM — güncel Yönetmelikler listesi; Su Kirliliği Kontrolü Yönetmeliği", href: ENV_REGULATIONS },
    { label: "ÇŞİDB ÇED İzin ve Denetim GM — Mogan Gölündeki kirliliğe ceza, 19.05.2026", href: MOGAN_ENFORCEMENT },
  ],
  keywords: ["yağmur suyu", "sediment", "çöktürme", "beton yıkama", "atıksu", "Mogan", "Su Kirliliği Kontrolü Yönetmeliği"],
  tags: ["Çevre", "yağmur suyu", "sediment", "şantiye"],
};

export const DEPREM_PHASE5_BATCH_5_ARTICLES = [
  DEPREM_PHASE5_CEVRE_CED,
  DEPREM_PHASE5_CEVRE_WASTE,
  DEPREM_PHASE5_CEVRE_NOISE_DUST,
  DEPREM_PHASE5_CEVRE_STORMWATER,
] as const;
