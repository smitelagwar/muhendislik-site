import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const BETONARME_SARTNAME = "https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf";
const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";

export const DEPREM_PHASE4_YAPI_EN13670_UYGULAMA: DepremPhase4Override = {
  slug: "yapi-denetimi-en13670-yerlestirme-kur-tolerans",
  description: "Betonarme imalatında TS EN 13670 uygulama yaklaşımını; uygulama şartnamesi, döküm öncesi hazır olma, beton yerleştirme ve sıkıştırma, kür ve koruma, geometrik toleranslar, uygunsuzluk kaydı ve as-built kapanışı üzerinden ele alır.",
  seoTitle: "TS EN 13670 Beton Yerleştirme, Kür ve Tolerans Kontrolü | Yapı Denetimi",
  seoDescription: "TS EN 13670 kapsamında uygulama şartnamesi, beton yerleştirme-sıkıştırma, kür, aks-kot-geometri toleransları ve uygunsuzluk yönetimi.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "en13670-uygulama-koprusu",
      title: "TS EN 13670 tasarım kararını sahada ölçülebilir uygulama gereklerine dönüştüren köprüdür",
      content: phase4Lines(
        "Betonarme projede hesap ve detayların doğru olması, imalatın kendiliğinden doğru gerçekleşeceği anlamına gelmez. **TS EN 13670**, betonarme yapıların uygulanması için proje gereklerini saha organizasyonu, kontrol, tolerans ve kayıt mantığına bağlayan temel standartlardan biridir.",
        "",
        "ÇŞİDB Yüksek Fen Kurulu'nun Betonarme İşleri Genel Teknik Şartnamesi de betonarme işlerinde **TS EN 13670**'e atıf yapar ve betonun taşınması, **yerleştirme**, **sıkıştırma** ve bakım/kür işlemlerini uygulama kalitesinin parçası olarak ele alır.",
        "",
        "Standart telifli olduğundan sayısal tolerans tabloları burada kopyalanmaz. Projede uygulanacak kesin tolerans ve kontrol sınıfları güncel standardın yürürlükteki sürümü ile proje özel şartlarından doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "uygulama-sartnamesi",
      title: "Uygulama başlamadan hangi kabul ve kontrol kurallarının geçerli olduğunu uygulama şartnamesinde sabitleyin",
      content: phase4Lines(
        "Şantiyede kontrol kriterleri beton dökümü sırasında icat edilmemelidir. Proje notları, özel teknik şartname, yürürlükteki standartlar ve gerekli imalat prosedürleri tek bir **uygulama şartnamesi** mantığında birbirini tamamlamalıdır.",
        "",
        "Beton sınıfı, çevresel koşullar, kalıp ve iskele gerekleri, donatı/ankraj/gömülü elemanlar, betonlama sırası, derzler, yüzey sınıfı, **kür** yöntemi ve geometrik kabul kriterleri proje başlamadan tanımlanmalıdır.",
        "",
        "Bir belgede farklı, sahadaki metodolojide farklı kriter bulunuyorsa hangi kaynağın geçerli olduğu netleştirilmeden imalata devam edilmemelidir."
      ),
      subsections: [],
    },
    {
      id: "dokum-oncesi-hazirlik",
      title: "Yerleştirmeden önce kalıp, donatı, gömülü eleman ve revizyonların kapandığını doğrulayın",
      content: phase4Lines(
        "Betonun **yerleştirme** aşamasına geçmeden kalıp geometrisi, donatı, pas payı, birleşimler, gömülü parçalar, rezervasyonlar ve döküm derzi hazırlığı onaylı proje ile eşleştirilmelidir.",
        "",
        "Özellikle son dakika tesisat geçişi veya rezervasyon değişikliği için taşıyıcı donatıyı kesmek uygulama çözümü değildir. Değişiklik taşıyıcı sistemi etkiliyorsa proje müellifi değerlendirmesi ve onaylı revizyon gerekir.",
        "",
        "Döküm öncesi kontrol aynı zamanda pompa erişimi, beton döküm sırası, çalışan sayısı, vibratör ve yedek ekipman, numune organizasyonu ve kür malzemesinin hazır olduğunu da doğrulamalıdır."
      ),
      subsections: [],
    },
    {
      id: "yerlestirme-ve-sikistirma",
      title: "Betonu segregasyona yol açmadan yerleştirin; vibratörü taşıma aracı olarak kullanmayın",
      content: phase4Lines(
        "Betonun kalıba boşaltılması, yatay/düşey taşıma ve tabakalar hâlinde **yerleştirme** biçimi ayrışmayı ve soğuk derz riskini azaltacak şekilde planlanmalıdır. Döküm hızı kalıp kapasitesi, eleman geometrisi ve ekibin sıkıştırma kapasitesiyle uyumlu olmalıdır.",
        "",
        "**Sıkıştırma** işlemi boşlukları azaltarak betonun donatı ve kalıp yüzeyini doldurmasını sağlamalıdır. Yetersiz vibrasyon petekleşme ve aderans kaybına; aşırı veya yanlış vibrasyon ayrışmaya neden olabilir.",
        "",
        "İç vibratör betonu uzun mesafede yatay sürüklemek için kullanılmamalı; tabaka ve vibrasyon noktaları eleman geometrisine göre düzenlenmelidir. Donatı yoğun bölgeler ve birleşimler özel dikkat gerektirir."
      ),
      subsections: [],
    },
    {
      id: "kur-ve-erken-yas-koruma",
      title: "Kürü döküm bittikten sonra düşünülecek yardımcı işlem değil, beton performansının parçası olarak planlayın",
      content: phase4Lines(
        "Betonun erken yaşta su kaybetmesi veya aşırı sıcaklık etkisine maruz kalması hidratasyon, yüzey çatlakları ve dayanıklılık üzerinde olumsuz etki yaratabilir. **Kür** ve koruma yöntemi betonlama programıyla birlikte hazırlanmalıdır.",
        "",
        "Güneş, rüzgâr, sıcak/soğuk hava ve don riski gibi çevresel koşullar yüzeyin korunma süresini ve yöntemini etkiler. Kürün başlangıcı, kalıp sökme zamanı ve yüzey koruması birbirinden kopuk kararlar değildir.",
        "",
        "Kesin süre ve sıcaklık sınırları proje şartları ve güncel standartlardan doğrulanmalıdır; tek bir evrensel 'şu kadar gün' kuralı bütün betonlar için kullanılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "geometrik-toleranslar",
      title: "Aks, kot, düşeylik ve kesit ölçülerini tek bir evrensel toleransla değerlendirmeyin",
      content: phase4Lines(
        "Betonarme elemanın projeye uygunluğu yalnız dayanım sonucu değildir. **Aks**, **kot**, düşeylik, eleman kesiti, açıklık, boşluk, ankraj/gömülü eleman konumu ve gerekli pas payı geometrisi de kabulün parçasıdır.",
        "",
        "**Tolerans** değeri eleman türüne, uygulama sınıfına, proje özel şartına ve ilgili standardın güncel hükmüne göre değişebilir. İnternetten veya eski bir projeden alınmış tek bir milimetre değerini bütün elemanlara uygulamak doğru değildir.",
        "",
        "Ölçüm yöntemi ve referans noktası önceden belirlenmeli; örneğin kolon düşeyliği, döşeme kotu veya ankraj konumu farklı ölçüm araçları ve kayıt biçimleri gerektirebilir."
      ),
      subsections: [],
    },
    {
      id: "uygunsuzluk-ve-asbuilt",
      title: "Tolerans dışı veya kusurlu imalatı görünmez tamirle değil, uygunsuzluk ve as-built kaydıyla yönetin",
      content: phase4Lines(
        "Petekleşme, segregasyon, çatlak, eksik kesit, yanlış **aks/kot**, beklenmeyen boşluk veya gömülü eleman kayması görüldüğünde ilk adım kusuru sıva/harçla kapatmak değildir. **Uygunsuzluk** kayıt altına alınmalı, kapsamı ölçülmeli ve teknik değerlendirme yapılmalıdır.",
        "",
        "| Kontrol alanı | Saha kanıtı | Uygunsuzluk örneği | Kapanış |",
        "|---|---|---|---|",
        "| Yerleştirme | Döküm planı + saha gözlemi | Segregasyon / plansız soğuk derz | Teknik değerlendirme + onarım prosedürü |",
        "| Sıkıştırma | İmalat kaydı + yüzey inceleme | Petekleşme / boşluk | Kusur haritası + onarım kararı |",
        "| Kür | Kür yöntemi + hava kaydı | Erken yüzey kuruması | Yüzey/çatlak değerlendirmesi |",
        "| Geometri | Aks-kot-düşeylik ölçümü | Tolerans dışı eleman | Proje müellifi değerlendirmesi |",
        "| Gömülü parça | Ölçüm / as-built | Ankraj veya sleeve kayması | Koordinasyon revizyonu |",
        "| Kapanış | Foto + rapor + onay | Belgesiz tamir | As-built ve uygunsuzluk kapanışı |",
        "",
        "Taşıyıcı davranışı veya sonraki disiplinleri etkileyen sapmalar as-built kayda işlenmeli; gerekli durumda statik hesap veya detay revizyonu açılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Projeye uygulanacak güncel **TS EN 13670** ve **uygulama şartnamesi** hükümlerini sabitledim.",
        "- [ ] Beton **yerleştirme** öncesi kalıp, donatı, gömülü eleman ve revizyonları kapattım.",
        "- [ ] Döküm sırası ve ekipmanın segregasyon/soğuk derz riskini azaltacak biçimde hazır olduğunu kontrol ettim.",
        "- [ ] **Sıkıştırma** için yeterli ve çalışır vibratör/ekipman bulunduğunu doğruladım.",
        "- [ ] **Kür** ve erken yaş koruma yöntemini hava ve proje koşullarına göre planladım.",
        "- [ ] **Aks**, **kot**, düşeylik, kesit ve gömülü eleman geometrisini ölçerek kaydettim.",
        "- [ ] Kesin **tolerans** değerlerini güncel standart ve proje özel şartından doğruladım; evrensel değer uydurmadım.",
        "- [ ] Her **uygunsuzluk** için teknik değerlendirme, onarım/revizyon ve as-built kapanışı oluşturdum."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "Yapı denetimi ve saha uygulamalarındaki güncel mevzuat/genelgeler için resmî erişim merkezi.",
    },
    {
      label: "ÇŞİDB/Yüksek Fen Kurulu — Betonarme İşleri Genel Teknik Şartnamesi",
      href: BETONARME_SARTNAME,
      note: "TS EN 13670 atfı ile betonun taşınması, yerleştirilmesi, sıkıştırılması ve bakımı/kürü için resmî teknik uygulama çerçevesi.",
    },
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası",
      href: TBDY_PAGE,
      note: "Betonarme yapım standartlarıyla ilişkili yürürlükteki deprem yönetmeliğinin resmî erişim noktası.",
    },
  ],
  keywords: ["TS EN 13670", "beton yerleştirme", "beton sıkıştırma", "kür", "betonarme tolerans", "uygulama şartnamesi"],
  tags: ["yapı denetimi", "TS EN 13670", "betonarme uygulama", "kür", "tolerans"],
};
