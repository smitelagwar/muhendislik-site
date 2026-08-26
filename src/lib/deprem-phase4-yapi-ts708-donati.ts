import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const LAB_HIZMETLERI = "https://canakkale.csb.gov.tr/laboratuvar-hizmetleri-i-5391";
const BETONARME_SARTNAME = "https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf";
const TBDY = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";

export const DEPREM_PHASE4_YAPI_TS708_DONATI: DepremPhase4Override = {
  slug: "yapi-denetimi-ts708-donati-celigi-kabul",
  description: "Betonarme donatı çeliği kabulünü yalnız sevk irsaliyesi veya fabrika sertifikası kontrolü olarak değil; TS 708 kapsamı, proje çelik sınıfı, üretici/lot/çap izlenebilirliği, görsel-kütle kontrolleri ve yetkili laboratuvar deneyleriyle sahaya bağlanan bir kalite zinciri olarak ele alır.",
  seoTitle: "TS 708 Donatı Çeliği Kabulü | Şantiye ve Laboratuvar Kontrolü",
  seoDescription: "TS 708 donatı çeliği kabulü: proje sınıfı, üretici-lot-çap izlenebilirliği, çekme, bükme/ters bükme, kütle ve kimyasal analiz kontrol zinciri.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "donati-kabulunun-amaci",
      title: "Donatı kabulü demirin çapına bakıp depoya almak değildir",
      content: phase4Lines(
        "Betonarme donatı çeliği yapıya girdikten sonra taşıyıcı sistemin dayanım, süneklik, aderans ve detaylandırma performansının parçası olur. Bu nedenle kabul; proje çelik sınıfı ile sahaya gelen ürünün **TS 708** kapsamındaki kimlik ve özelliklerinin aynı olduğunu doğrulayan teknik süreçtir.",
        "",
        "TBDY 2018'in betonarme bölümünde TS 708'e atıf bulunur. Ancak proje tarihinde kullanılacak standardın güncel sürümü ve varsa geçiş koşulları TSE/resmî kaynak üzerinden ayrıca doğrulanmalıdır.",
        "",
        "Fabrika sertifikası önemli bir kayıttır fakat tek başına sahadaki her çubuğun doğru ürün olduğunu kanıtlamaz; sevkiyat, üretici, lot/ısı numarası, çap ve numune zinciri korunmalıdır."
      ),
      subsections: [],
    },
    {
      id: "proje-sinifi-ve-sevkiyat",
      title: "Önce proje çelik sınıfını sabitleyin, sonra sevkiyat belgesini karşılaştırın",
      content: phase4Lines(
        "Statik proje ve genel notlarda istenen donatı çeliği sınıfı açıkça belirlenmelidir. Şantiyeye gelen ürünün irsaliyesi, üretici belgesi ve etiket/bağ bilgisi bu proje tanımıyla eşleştirilir.",
        "",
        "Farklı üretici veya **lot**/ısı numaralarının aynı depoda karışması, deney sonucu ile imalatta kullanılan çelik arasındaki bağı zayıflatır. Numune alınmadan önce malzemenin hangi parti ve **çap** grubunu temsil ettiği kayıt altına alınmalıdır.",
        "",
        "Proje sınıfından farklı bir ürün 'daha yüksek dayanımlı' olduğu için otomatik kabul edilmez; süneklik, kaynaklanabilirlik, aderans ve tasarım kabulleri birlikte değerlendirilir."
      ),
      subsections: [],
    },
    {
      id: "saha-gorsel-ve-kutle-kontrolu",
      title: "Laboratuvar deneyinden önce sahada kimlik, yüzey ve geometrik uygunluğu kontrol edin",
      content: phase4Lines(
        "Donatı çubuklarında üretici/ürün işaretleri, nominal çap, nervür geometrisinin genel görünümü, aşırı korozyon/kir/yağ, mekanik hasar ve uygunsuz doğrultma-bükme izleri incelenmelidir.",
        "",
        "Yüzey pası her durumda aynı anlama gelmez; aderansı veya kesit alanını etkileyen kabuklanma/kayıp ile hafif yüzey oksidasyonu aynı değerlendirilmemelidir. Şüpheli durumda temizlik ve ölçüm sonrası teknik karar verilmelidir.",
        "",
        "Bakanlık laboratuvar uygulamalarında **gözle muayene ve kütle tayini** TS 708 kapsamındaki kontrol kalemleri arasındadır. Saha kabulü laboratuvar verisiyle aynı partiye bağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "mekanik-deneyler",
      title: "Çekme ve bükme deneylerini aynı kalite sorusunun farklı parçaları olarak okuyun",
      content: phase4Lines(
        "Donatı çeliğinin mekanik uygunluğu yalnız maksimum çekme dayanımı değildir. Yetkili laboratuvarlarda **TS EN ISO 6892-1** çerçevesindeki çekme deneyi ile akma/çekme davranışı ve uzama; **TS EN ISO 15630-1** kapsamında bükme veya ters bükme gibi deneyler ürünün ilgili gereklere uygunluğunu kontrol etmekte kullanılır.",
        "",
        "Deney raporundaki değerler proje veya internetten ezberlenen tek bir eşik üzerinden değil, numunenin temsil ettiği çelik sınıfı ve güncel TS 708 kriterleriyle değerlendirilmelidir.",
        "",
        "Bir çap grubunun geçerli sonucu başka üretici/lot veya farklı çap için otomatik temsil kabul edilmemelidir; numune alma planı güncel standart ve laboratuvar prosedürüne göre yapılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kimyasal-ve-kaynaklanabilirlik",
      title: "Kimyasal bileşim ve kaynaklanabilirlik gereğini imalat yönteminden bağımsız görmeyin",
      content: phase4Lines(
        "TS 708 kapsamında ürün uygunluğunda kimyasal bileşim de değerlendirme alanıdır. Özellikle sahada kaynaklı birleşim veya özel imalat öngörülüyorsa çeliğin kaynaklanabilirliği proje ve standardın izin verdiği koşullarla birlikte ele alınmalıdır.",
        "",
        "Donatı çubuğuna şantiyede gelişigüzel kaynak yapmak, çubuğu ısıtıp bükmek veya doğrultmak malzemenin mekanik özelliklerini değiştirebilir. Projede ve standardında tanımlanmayan işlem kalite problemi oluşturur.",
        "",
        "Kaynak gerekiyorsa yöntem, kaynakçı yeterliliği, ilgili prosedür ve malzeme sınıfı bir arada değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kabul-matrisi",
      title: "Donatı kabulünü parti ve deney izlenebilirliğiyle kapatın",
      content: phase4Lines(
        "| Kontrol | Kanıt | Temsil ettiği özellik | Hard fail örneği |",
        "|---|---|---|---|",
        "| Proje sınıfı | Statik proje / genel not | Tasarım girdisi | Gelen ürün farklı sınıf |",
        "| Ürün kimliği | İrsaliye + üretici + lot/ısı + çap | İzlenebilirlik | Numunenin hangi partiye ait olduğu belirsiz |",
        "| Görsel/kütle | Saha ve laboratuvar kaydı | Geometri/yüzey/kütle | Ciddi kesit kaybı veya kimlik uyuşmazlığı |",
        "| Çekme deneyi | TS EN ISO 6892-1 raporu | Akma/çekme/uzama davranışı | Standart kriteri sağlanmıyor |",
        "| Bükme/ters bükme | TS EN ISO 15630-1 raporu | Şekil değiştirme performansı | Uygunsuz deney sonucu |",
        "| Kimyasal analiz | Yetkili laboratuvar raporu | Bileşim/kaynaklanabilirlik | İlgili kriter dışı sonuç |",
        "",
        "Kabul sonucu hangi sevkiyatın serbest bırakıldığını açıkça göstermelidir. Sonucu gelmeyen veya kimliği karışmış malzemeyi imalata dağıtmak izlenebilirliği kaybettirir."
      ),
      subsections: [],
    },
    {
      id: "depolama-ve-imalata-aktarim",
      title: "Kabul edilmiş donatının sahada kimliğini ve yüzey durumunu koruyun",
      content: phase4Lines(
        "Uygun donatı çeliği yanlış depolama ile kirlenebilir, çamura gömülebilir veya farklı çap/partilerle karışabilir. Çubuklar zeminden ayrılmış, sınıf/çap/parti ayrımı okunabilir ve aşırı korozyon riskini azaltacak biçimde depolanmalıdır.",
        "",
        "Kesim-büküm listeleri ile depodan çıkan çeliğin eleman koduna bağlanması, özellikle büyük projelerde yanlış çap/sınıf kullanımını azaltır.",
        "",
        "İmalat sırasında projede olmayan kaynak, kesme, yeniden bükme veya mekanik hasar görülürse malzeme kabulü yapılmış olması bu uygunsuzluğu meşrulaştırmaz."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Projede istenen donatı çeliği sınıfını ve güncel **TS 708** sürümünü doğruladım.",
        "- [ ] Üretici, **lot/ısı numarası** ve **çap** izlenebilirliğini sevkiyat bazında kaydettim.",
        "- [ ] Ürün işaretleri, yüzey, korozyon/hasar ve **kütle tayini** kontrollerini yaptım.",
        "- [ ] Çekme deneyini **TS EN ISO 6892-1**, bükme/ters bükme deneyini **TS EN ISO 15630-1** raporlarıyla takip ettim.",
        "- [ ] Gerektiğinde kimyasal analiz ve kaynaklanabilirlik koşullarını değerlendirdim.",
        "- [ ] Deney sonucunu gerçekten temsil ettiği parti/çapla eşleştirdim.",
        "- [ ] Sonucu gelmeyen veya kimliği belirsiz malzemeyi imalata serbest bırakmadım.",
        "- [ ] Depolama ve kesim-büküm sırasında kabul edilmiş ürün kimliğinin korunmasını sağladım."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "Yapı malzemesi ve laboratuvar denetimindeki güncel mevzuat/genelgeler için resmî erişim merkezi.",
    },
    {
      label: "ÇŞİDB Çanakkale — Yapı Laboratuvarı hizmetleri",
      href: LAB_HIZMETLERI,
      note: "TS 708, TS EN ISO 15630-1 ve TS EN ISO 6892-1 kapsamında donatı çeliği laboratuvar deneylerini gösteren resmî Bakanlık kaynağı.",
    },
    {
      label: "ÇŞİDB/Yüksek Fen Kurulu — Betonarme İşleri Genel Teknik Şartnamesi",
      href: BETONARME_SARTNAME,
      note: "Betonarme işlerinde TS 708 ve ilgili uygulama standartlarına atıf yapan resmî teknik şartname.",
    },
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği",
      href: TBDY,
      note: "Betonarme tasarım ve yapımında TS 708'e yapılan yönetmelik atfının resmî erişim noktası.",
    },
  ],
  keywords: ["TS 708", "donatı çeliği", "TS EN ISO 6892-1", "TS EN ISO 15630-1", "çekme deneyi", "donatı kabulü"],
  tags: ["yapı denetimi", "TS 708", "donatı çeliği", "malzeme kabulü"],
};
