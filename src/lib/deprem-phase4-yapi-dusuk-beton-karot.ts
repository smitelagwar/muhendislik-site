import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const KAROT_2021_7 = "https://yapiisleri.csb.gov.tr/haberler/yapilardan-alinacak-karot-sayilarina-iliskin-yeni-duzenlemeler-gerceklestirildi-260557";
const KAROT_DEGERLENDIRME = "https://osmaniye.csb.gov.tr/karot-degerlendirmesi-85599";
const LAB_GENELGE = "https://yapiisleri.csb.gov.tr/haberler/laboratuvar-uygulamalarina-iliskin-yeni-duzenlemeleri-iceren-genelge-yayimlandi-267175";

export const DEPREM_PHASE4_YAPI_DUSUK_BETON_KAROT: DepremPhase4Override = {
  slug: "yapi-denetimi-dusuk-beton-dayanimi-karot",
  description: "Taze beton numunesinde düşük dayanım veya geçersiz/eksik sonuç görülmesi halinde karot sürecini; kayıt doğrulama, etki alanını belirleme, TS EN 13791 ve TS EN 12504-1'e göre yetkili laboratuvar planı, yapısal değerlendirme ve onarım/güçlendirme karar zinciri üzerinden açıklar.",
  seoTitle: "Düşük Beton Dayanımında Karot Süreci | TS EN 13791 ve TS EN 12504-1",
  seoDescription: "Düşük beton sonucu sonrası karot: döküm etki alanı, TS EN 13791, TS EN 12504-1, laboratuvar, karot konumu, değerlendirme ve mühendislik kararı.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "dusuk-sonuc-karot-esitligi-degildir",
      title: "Düşük numune sonucu doğrudan rastgele karot alma talimatı değildir",
      content: phase4Lines(
        "Taze betondan alınan numunelerde beklenen basınç dayanımının sağlanmaması ciddi bir uygunsuzluktur; ancak ilk mühendislik adımı 'kaç karot alalım?' sorusu değildir. Önce deney sonucunun geçerliliği ve hangi **döküm bölgesini** temsil ettiği doğrulanmalıdır.",
        "",
        "Bakanlığın **2021/7 Genelgesi**, taze beton basınç dayanımı uygun olmadığında, numune alınamadığında veya deney sonucu elde edilemediğinde yapıda beton basınç sınıfının **TS EN 13791** yaklaşımı çerçevesinde değerlendirilmesini düzenlemek üzere yayımlanmıştır.",
        "",
        "Karot, tek bir düşük küpü 'iptal eden' karşı deney değildir; yapıdaki betonun yerinde dayanımına ilişkin yeni bir veri setidir ve doğru örnekleme/yorum prosedürü gerektirir."
      ),
      subsections: [],
    },
    {
      id: "ilk-kayit-denetimi",
      title: "Önce numune, irsaliye, EBİS ve deney kayıtlarını çapraz kontrol edin",
      content: phase4Lines(
        "Karot planından önce numune kimliği, beton etiketi, mikser ve irsaliye, EBİS kaydı, döküm tarihi/saati, numune alma tutanağı, kür koşulu ve laboratuvar deney raporu bir araya getirilmelidir.",
        "",
        "Amaç sonucu görmezden gelmek değil; verinin gerçekten hangi beton yükünü ve hangi elemanları temsil ettiğini belirlemektir. Kimlik veya deney geçerliliği problemi ile gerçek düşük yerinde dayanım aynı teknik problem değildir.",
        "",
        "Aynı üretim/döküm dilimine ait diğer 7 ve 28 günlük sonuçlar da trend açısından incelenmeli, ancak geçerli bir düşük sonuç yalnız 'diğerleri yüksek çıktı' gerekçesiyle silinmemelidir."
      ),
      subsections: [],
    },
    {
      id: "etki-alanini-sinirla",
      title: "Karot programından önce şüpheli betonun etki alanını eleman bazında sınırlandırın",
      content: phase4Lines(
        "Döküm kaydı güçlü ise hangi mikserlerin hangi blok/kat/eleman grubuna boşaltıldığı yaklaşık değil, izlenebilir biçimde belirlenebilir. Bu bilgi karot bölgelerinin seçimini ve olası yapısal değerlendirmenin kapsamını doğrudan etkiler.",
        "",
        "Aynı gün farklı beton sınıfları veya farklı döküm bölgeleri varsa bütün katı tek homojen beton gibi kabul etmek temsil hatası yaratabilir. Tersine, kayıt yok diye her elemanı gereksiz yere delmek de yapıya zarar veren kötü kalite yönetimidir.",
        "",
        "Karot konumları, donatı ve kritik kesitler dikkate alınarak yetkili laboratuvar ve ilgili mühendislik süreciyle planlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "ts-en-13791-12504",
      title: "TS EN 13791 değerlendirme çerçevesi ile TS EN 12504-1 numune alma/deney işlemini ayırın",
      content: phase4Lines(
        "**TS EN 12504-1**, sertleşmiş betondan karot numunesinin alınması, incelenmesi ve basınç dayanımı deneyine ilişkin yöntem standardıdır. **TS EN 13791** ise yapılarda ve öndökümlü bileşenlerde beton basınç dayanımının yerinde tayini/değerlendirilmesi için daha geniş çerçeveyi verir.",
        "",
        "Karotun çapı, boy/çap oranı, nem durumu, uç hazırlığı, donatı içerip içermemesi ve karot alma hasarı ölçülen dayanımı etkileyebilir. Bu nedenle pres cihazından çıkan ham sayı doğrudan proje küp/silindir dayanımına eşitlenmemelidir.",
        "",
        "Standarttaki numune sayısı ve istatistiksel değerlendirme kuralları telifli metinden proje tarihindeki güncel sürümle uygulanmalıdır; eski ofis tablosu veya internet özetiyle karar verilmemelidir."
      ),
      subsections: [],
    },
    {
      id: "karot-konumu-ve-yapisal-hasar",
      title: "Karot konumunu yalnız kolay erişime göre seçmeyin",
      content: phase4Lines(
        "Karot alma işlemi taşıyıcı elemanda kesit kaybı ve donatıya zarar verme riski taşır. Konum seçimi betonun temsil edilebilirliği kadar elemanın iç kuvvet durumu, donatı yerleşimi ve sonradan yapılacak tamir açısından da değerlendirilmelidir.",
        "",
        "Donatı taraması yapılmadan karot almak boyuna donatı veya etriyeye zarar verebilir. Kritik birleşim, plastikleşme beklenen bölge veya yüksek gerilme taşıyan kesitten yalnız erişimi kolay diye numune seçilmemelidir.",
        "",
        "Karot boşluğu deney sonrası uygun tamir malzemesi ve prosedürle kapatılmalı; gerekiyorsa proje müellifi tarafından yerel kesit etkisi değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "karar-zinciri",
      title: "Sonucu laboratuvar raporundan yapısal karara taşıyan zinciri kurun",
      content: phase4Lines(
        "| Aşama | Teknik soru | Kanıt | Sonraki karar |",
        "|---|---|---|---|",
        "| Taze beton sonucu | Sonuç geçerli ve hangi dökümü temsil ediyor? | EBİS + irsaliye + deney raporu | Etki alanını belirle |",
        "| Karot planı | Nereler beton popülasyonunu temsil eder? | Döküm haritası + donatı taraması | Yetkili laboratuvar planı |",
        "| Karot deneyi | Numune/deney standarda uygun mu? | TS EN 12504-1 raporu | Yerinde dayanım değerlendirmesi |",
        "| Yerinde değerlendirme | Beton sınıfı/yerinde dayanım nasıl sınıflanıyor? | TS EN 13791 + Genelge | Yapısal model girdisini belirle |",
        "| Yapısal kontrol | Mevcut dayanımla taşıma gücü/deprem güvenliği yeterli mi? | Proje hesabı / yeniden analiz | Kabul, onarım veya güçlendirme |",
        "| Kapanış | Karot yerleri ve karar kayıtlı mı? | Tamir + onay + arşiv | Uygunsuzluğu kapat |",
        "",
        "Karot raporu tek başına 'yapı güvenlidir/güvensizdir' belgesi değildir; sonuç yapısal hesap ve ilgili sorumluların teknik kararıyla ilişkilendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "laboratuvar-yetki-ve-katilim",
      title: "Karot alma ve deneyi yetkili laboratuvar zinciri içinde yürütün",
      content: phase4Lines(
        "Bakanlığın 2022 laboratuvar düzenlemeleri, sertleşmiş beton numunelerinin il içinde Bakanlıktan izin belgeli laboratuvarlar tarafından alınarak deney süreçlerinin yürütülmesine ilişkin uygulamaları düzenlemiştir.",
        "",
        "Şantiye ekibinin kendi karot makinesiyle numune çıkarıp bağımsız bir pres sonucunu resmi kabul verisi gibi kullanması doğru süreç değildir. Numune kimliği, alma yeri, boyut/koşul ve deney raporu yetkili zincirde kayıtlı olmalıdır.",
        "",
        "İtiraz veya ihtilaf halinde tarafların sürece katılımı kayıt altına alınabilir; ancak deney prosedürü ve değerlendirme standardı taraf beklentisine göre değişmez."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Düşük/eksik beton sonucunu **EBİS + irsaliye + numune + laboratuvar** kayıtlarıyla doğruladım.",
        "- [ ] Şüpheli betonun **döküm bölgesini** ve etkilenen elemanlarını sınırlandırdım.",
        "- [ ] Karot sürecini **2021/7 Genelgesi** ve güncel standartlarla başlattım.",
        "- [ ] **TS EN 12504-1** numune alma/deney işlemi ile **TS EN 13791** yerinde değerlendirme işlevini karıştırmadım.",
        "- [ ] Karot konumlarını donatı taraması ve yapısal kritik bölgeleri dikkate alarak seçtim.",
        "- [ ] Ham karot dayanımını doğrudan proje küp/silindir dayanımına eşitlemedim.",
        "- [ ] Yerinde dayanım sonucunu gerektiğinde yapısal yeniden analizle değerlendirdim.",
        "- [ ] Karot boşluklarının tamirini ve uygunsuzluk kapanış kaydını tamamladım."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "Karot, laboratuvar ve beton uygunluk süreçlerinin güncel mevzuat/genelge sürümleri için resmî merkez.",
    },
    {
      label: "ÇŞİDB Yapı İşleri — 2021/7 karot düzenlemesi duyurusu",
      href: KAROT_2021_7,
      note: "Düşük/eksik taze beton sonuçlarında TS EN 13791 temelli yerinde beton değerlendirmesi için resmî uygulama kaynağı.",
    },
    {
      label: "ÇŞİDB Osmaniye — Karot Değerlendirmesi",
      href: KAROT_DEGERLENDIRME,
      note: "TS EN 13791 ve karot numunesi özelliklerinin dayanım yorumuna etkisine ilişkin Bakanlık teknik bilgilendirmesi.",
    },
    {
      label: "ÇŞİDB Yapı İşleri — 2022 laboratuvar uygulamaları Genelgesi duyurusu",
      href: LAB_GENELGE,
      note: "Karot numunesi alma/deney süreçlerinde izin belgeli laboratuvar uygulamalarına ilişkin resmî açıklama.",
    },
  ],
  keywords: ["düşük beton dayanımı", "karot", "TS EN 13791", "TS EN 12504-1", "2021/7 Genelgesi", "yerinde beton dayanımı"],
  tags: ["yapı denetimi", "karot", "beton dayanımı", "laboratuvar"],
};
