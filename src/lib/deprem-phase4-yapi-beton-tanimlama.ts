import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const HAZIR_BETON = "https://webdosya.csb.gov.tr/db/kastamonu/editordosya/HAZIR%20BETON.pdf";
const LAB_GENELGE = "https://yapiisleri.csb.gov.tr/haberler/laboratuvar-uygulamalarina-iliskin-yeni-duzenlemeleri-iceren-genelge-yayimlandi-267175";

export const DEPREM_PHASE4_YAPI_BETON_TANIMLAMA: DepremPhase4Override = {
  slug: "yapi-denetimi-beton-tanimlama-en206-ts13515",
  description: "Hazır beton siparişini yalnız C sınıfı seçimi olarak değil; TS EN 206+A2 ve TS 13515 birlikte değerlendirilerek dayanım, çevresel etki, kıvam, agrega, klorür ve diğer proje gereklerinin irsaliye ve döküm bölgesiyle eşleştirildiği bir teknik tanımlama süreci olarak ele alır.",
  seoTitle: "TS EN 206+A2 ve TS 13515 ile Beton Tanımlama | Yapı Denetimi",
  seoDescription: "Beton siparişinde dayanım, çevresel etki, kıvam, Dmax, klorür ve irsaliye kontrolü; TS EN 206+A2 ile TS 13515 ilişkisi.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "beton-tanimi-sadece-dayanim-degildir",
      title: "Beton tanımı yalnız basınç dayanım sınıfından oluşmaz",
      content: phase4Lines(
        "Şantiyede 'C30/37 beton gelsin' demek teknik siparişin tamamı değildir. **TS EN 206+A2** betonun özellik, performans, imalat ve uygunluk çerçevesini; **TS 13515** ise Türkiye'deki yapı uygulamaları bakımından tamamlayıcı gerekleri birlikte ele alır.",
        "",
        "Beton tanımı proje koşuluna göre **basınç dayanım sınıfı**, **çevresel etki sınıfı**, kıvam, agreganın en büyük tane büyüklüğü (**Dmax**), klorür içeriği sınıfı, yoğunluk ve gerekiyorsa diğer performans özelliklerini kapsayan bir veri setidir.",
        "",
        "Yapı denetimi açısından hedef, proje notu → beton siparişi → karekodlu/normal irsaliye → döküm elemanı zincirinde aynı beton tanımının korunmasıdır."
      ),
      subsections: [],
    },
    {
      id: "standart-surumu-ve-gecis",
      title: "Standart numarasını yazıp geçmeyin; proje tarihindeki yürürlük ve geçiş durumunu doğrulayın",
      content: phase4Lines(
        "Beton standartları zaman içinde tadil ve revizyona uğrar. Bakanlığın 2022 laboratuvar duyuruları, TS 13515 ve ilgili deney standartlarındaki değişikliklerin saha numune süreçlerini doğrudan etkileyebildiğini göstermektedir.",
        "",
        "Bu nedenle teknik şartname veya sipariş formunda yalnız 'TS 13515'e uygun' ifadesi bırakmak yerine, proje/döküm tarihinde TSE'nin yürürlük ve geçiş durumunu doğrulamak gerekir. Eski bir proje şablonundaki standart tarihi yeni projeye otomatik taşınmamalıdır.",
        "",
        "Standart metinleri teliflidir; bu makale sınır değer tablolarını çoğaltmak yerine hangi verilerin proje ve sipariş zincirinde kontrol edilmesi gerektiğini açıklar."
      ),
      subsections: [],
    },
    {
      id: "cevre-etki-ve-dayaniklilik",
      title: "Dayanım sınıfını çevresel etki sınıfından bağımsız seçmeyin",
      content: phase4Lines(
        "Aynı basınç dayanım sınıfındaki iki beton, maruz kaldıkları çevreye göre aynı durabilite çözümü olmayabilir. Karbonatlaşma, klorür, donma-çözülme, kimyasal etki veya aşınma gibi maruziyetler **çevresel etki sınıfı** üzerinden beton bileşimi ve performans gereklerini etkiler.",
        "",
        "Temel/bodrum, otopark, dış ortam veya özel endüstriyel koşullarda proje müellifinin maruziyet varsayımı ile beton siparişindeki sınıf eşleştirilmelidir. Sırf daha yüksek dayanım sınıfı seçmek, yanlış çevresel etki tanımını otomatik düzeltmez.",
        "",
        "Su yalıtımı, pas payı ve çatlak kontrolü gibi yapısal/detaylandırma kararları da betonun durabilite performansıyla koordineli değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kivam-agrega-klorur",
      title: "Kıvam, Dmax ve klorür sınıfını pompa kolaylığı veya alışkanlığa göre değil projeye göre seçin",
      content: phase4Lines(
        "**Kıvam sınıfı** yerleştirme yöntemi, donatı yoğunluğu, kesit geometrisi ve betonun ayrışmadan sıkıştırılabilmesiyle ilişkilidir. Şantiyede işlenebilirliği artırmak için kontrolsüz su eklemek tasarlanmış betonun su/bağlayıcı oranını ve performansını değiştirir.",
        "",
        "**Dmax**, sık donatılı birleşimlerde ve dar kesitlerde yerleştirilebilirlikle; **klorür içeriği sınıfı** ise özellikle donatılı/öngerilmeli betonun korozyon riskiyle ilişkilidir. Bu parametreler irsaliyede izlenebilen teknik sipariş özellikleri olarak görülmelidir.",
        "",
        "Şantiye kabulünde amaç bütün beton özelliklerini sahada yeniden tasarlamak değil; sipariş edilen ve belgelenen betonun proje tanımıyla aynı olduğunu doğrulamaktır."
      ),
      subsections: [],
    },
    {
      id: "siparis-irsaliye-eleman-eslestirme",
      title: "Beton siparişini döküm elemanına ve irsaliyeye bağlayan kontrol matrisi kurun",
      content: phase4Lines(
        "| Kontrol alanı | Proje/sipariş kaynağı | Şantiyede doğrulanacak kayıt | Uyuşmazlıkta aksiyon |",
        "|---|---|---|---|",
        "| Basınç dayanım sınıfı | Statik proje / şartname | İrsaliye | Dökümü durdur, siparişi doğrula |",
        "| Çevresel etki sınıfı | Durabilite/proje notu | Sipariş + ürün belgesi | Proje müellifi ve üreticiyle doğrula |",
        "| Kıvam sınıfı | Yerleştirme gereği / şartname | İrsaliye + taze beton kontrolü | Uygunluk prosedürünü uygula |",
        "| Dmax | Kesit/donatı ve şartname | İrsaliye | Yanlış ürünse kabul etme |",
        "| Klorür/yoğunluk/özel özellik | Proje/standart gereği | İrsaliye + uygunluk belgesi | Teknik değerlendirme yap |",
        "| Döküm bölgesi | Döküm planı | Mikser + EBİS/şantiye kaydı | Yanlış elemana sevki önle |",
        "",
        "Aynı gün farklı beton tanımları kullanılıyorsa pompa ve mikser trafiği eleman bazında izlenmelidir. 'Aynı sınıf gibi görünüyor' yaklaşımı yeterli değildir."
      ),
      subsections: [],
    },
    {
      id: "santiyede-su-katki-mudahalesi",
      title: "Şantiyede reçeteyi kontrolsüz değiştirmeyin",
      content: phase4Lines(
        "Betonun kıvamı beklenenden düşük geldiğinde mikser tamburuna gelişi güzel su eklemek, üreticinin tasarladığı beton bileşimini değiştirir. Sahadaki herhangi bir su/katkı müdahalesi üretici prosedürü, irsaliye kaydı ve ilgili standart/şartname çerçevesi dışında yapılamaz.",
        "",
        "Uzamış bekleme, sıcak/soğuk hava, pompa gecikmesi veya yeniden kıvamlandırma ihtiyacı 'biraz su verelim' kararı değildir. Betonun kabul edilebilirliğini üretici, yapı denetimi ve laboratuvar kayıtlarıyla birlikte değerlendirin.",
        "",
        "Şüpheli veya yanlış tanımlı beton döküldükten sonra yalnız 28 günlük numune sonucunu beklemek yerine uygunsuzluğu döküm anında kayıt altına almak daha güçlü kalite yönetimidir."
      ),
      subsections: [],
    },
    {
      id: "belge-ve-izlenebilirlik",
      title: "Ürün belgesi, irsaliye ve numune kaydını aynı döküm diliminde ilişkilendirin",
      content: phase4Lines(
        "Beton üreticisinin uygunluk/ürün belgeleri, projede istenen beton tanımını kapsamalıdır. Belgenin var olması yeterli değildir; kapsamda ilgili beton türü ve yürürlük durumu kontrol edilmelidir.",
        "",
        "İrsaliye seri numarası, mikser, döküm zamanı, döküm bölgesi ve numune/EBİS kimliği arasında izlenebilirlik kurulursa düşük dayanım veya başka bir uygunsuzluk ortaya çıktığında hangi elemanların etkilendiği doğru sınırlandırılabilir.",
        "",
        "Bu zincir aynı zamanda yanlış mikserin farklı bir temel, perde veya döşeme bölgesine boşaltılması riskini azaltır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Proje tarihindeki **TS EN 206+A2** ve **TS 13515** yürürlük/geçiş durumunu doğruladım.",
        "- [ ] **Basınç dayanım sınıfı** ile **çevresel etki sınıfını** birlikte tanımladım.",
        "- [ ] Gerekli **kıvam sınıfı**, **Dmax** ve **klorür içeriği sınıfını** siparişe aktardım.",
        "- [ ] Beton üreticisinin ürün/uygunluk belgesi kapsamını kontrol ettim.",
        "- [ ] İrsaliyedeki beton tanımını onaylı proje ve döküm bölgesiyle eşleştirdim.",
        "- [ ] Şantiyede kontrolsüz su/katkı müdahalesine izin vermedim.",
        "- [ ] Mikser, irsaliye, döküm bölgesi ve numune/EBİS kayıt zincirini kurdum.",
        "- [ ] Uyuşmazlıkları beton dökülmeden önce teknik karara bağladım."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "Beton ve laboratuvar uygulamalarına ilişkin güncel mevzuat/genelgeler proje tarihinde bu resmî merkezden doğrulanmalıdır.",
    },
    {
      label: "ÇŞİDB — Hazır Beton teknik sunumu",
      href: HAZIR_BETON,
      note: "TS EN 206 ile TS 13515'in birlikte kullanımı ve beton tanımlama parametrelerinin teknik çerçevesi için Bakanlık kaynağı.",
    },
    {
      label: "ÇŞİDB Yapı İşleri — 2022/02 laboratuvar Genelgesi duyurusu",
      href: LAB_GENELGE,
      note: "TS 13515 ve deney standardı revizyonlarının laboratuvar uygulamalarına etkisini gösteren resmî duyuru.",
    },
  ],
  keywords: ["TS EN 206+A2", "TS 13515", "beton tanımlama", "çevresel etki sınıfı", "kıvam sınıfı", "Dmax"],
  tags: ["yapı denetimi", "hazır beton", "TS EN 206", "TS 13515"],
};
