import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const YAPI_DENETIM_UYGULAMA = "https://webdosya.csb.gov.tr/db/edirne/icerikler/2-yapi-denetim-uygulama-yonetmeligi-20200508122944.pdf";
const PLANLI_ALANLAR = "https://www.resmigazete.gov.tr/eskiler/2018/11/20181101-7.htm";

export const DEPREM_PHASE4_YAPI_STATIK_PROJE: DepremPhase4Override = {
  slug: "yapi-denetimi-statik-proje-kontrolu",
  description: "4708 kapsamındaki betonarme statik proje kontrolünü yalnız hesap raporu incelemesi olarak değil; mimari proje, zemin ve temel etüdü, taşıyıcı sistem modeli, uygulama paftaları ve revizyonların aynı proje kararını taşıdığı izlenebilir bir teknik denetim süreci olarak ele alır.",
  seoTitle: "4708 Kapsamında Betonarme Statik Proje Kontrolü | Teknik Denetim",
  seoDescription: "Yapı denetiminde statik proje kontrolü: mimari-zemin-statik koordinasyonu, Ek-3 Form-1, hesap-pafta tutarlılığı, revizyon ve saha izlenebilirliği.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "statik-proje-denetiminin-amaci",
      title: "Statik proje denetimi hesap çıktısını onaylamak değil, taşıyıcı sistem kararını doğrulamaktır",
      content: phase4Lines(
        "**4708** kapsamındaki proje denetiminde temel soru, analiz programının hata vermeden çözüm üretmesi değildir. Denetim; ruhsat eki belgelerde, **mimari proje**, **zemin etüdü**, hesap modeli ve **uygulama paftaları** arasında aynı geometri, malzeme, yük yolu ve temel kararının izlenmesini gerektirir.",
        "",
        "Yapı Denetimi Uygulama Yönetmeliği'nin **Madde 5** ve proje/application denetçisine ilişkin **Madde 6** çerçevesinde proje ve hesapların mevzuat, standartlar ve mühendislik kurallarına uygunluğu denetlenir. Yönetmelikteki **Ek-3** kontrol formları içinde **Form-1**, proje incelemesinin kayıt altına alınması için temel araçlardan biridir.",
        "",
        "Bu nedenle kontrol listesi yalnız 'kolonlar uygun mu?' biçiminde değil; **girdi → model → hesap sonucu → pafta → revizyon** zinciri biçiminde kurulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "proje-paketi-ve-versiyon",
      title: "Kontrole başlamadan proje paketini ve geçerli revizyonu sabitleyin",
      content: phase4Lines(
        "Aynı yapıya ait farklı tarihli mimari, statik ve zemin dosyalarının birlikte kullanılması sessiz fakat kritik bir source-of-truth hatasıdır. Kontrol başlamadan önce her belgenin tarih/revizyon bilgisi, proje müellifi ve onay durumu belirlenmelidir.",
        "",
        "Minimum teknik paket; ruhsat ve parsel bilgileri, onaylı mimari proje, aplikasyon/kot bilgileri, zemin ve temel etüdü, statik hesap raporu, kalıp planları, donatı/eleman detayları ve projeyi etkileyen disiplin koordinasyon kararlarını kapsamalıdır.",
        "",
        "Planlı Alanlar İmar Yönetmeliği'nin proje hükümleri statik projeyi, mimari projeye ve zemin-temel etüdüne uygun hazırlanmış taşıyıcı sistem plan, kesit, detay ve **hesap** bütünü olarak tarif eder. Kontrolün giriş dokümanları bu bütünlüğü korumalıdır."
      ),
      subsections: [],
    },
    {
      id: "mimari-statik-geometri",
      title: "Mimari ile statik arasında aks, kot ve taşıyıcı geometriyi eleman bazında eşleştirin",
      content: phase4Lines(
        "İlk teknik katman geometri kontrolüdür. Aks sistemi, kat kotları ve yükseklikleri, bodrum sınırı, dilatasyonlar, merdiven/asansör boşlukları, konsollar, döşeme boşlukları ve taşıyıcı eleman konumları mimari ile statik arasında karşılaştırılmalıdır.",
        "",
        "Kolon/perdeyi mimari duvarın içine 'yaklaştırmak', kiriş aksını tesisat için kaydırmak veya döşeme boşluğunu hesap modelinde bırakmamak küçük çizim farkı değildir; rijitlik, yük aktarımı ve detaylandırma sonucunu değiştirebilir.",
        "",
        "Kontrol kaydında uyuşmazlık yalnız ekran görüntüsüyle değil **kat + aks + eleman kodu + revizyon talebi** biçiminde tanımlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "zemin-temel-model-aktarimi",
      title: "Zemin etüdündeki tasarım parametrelerinin modele ve temel kararına gerçekten geçtiğini doğrulayın",
      content: phase4Lines(
        "Zemin raporunun projede bulunması tek başına yeterli değildir. Yerel zemin sınıfı, spektrum girdileri, temel sistemi için öneriler, taşıma gücü/oturma değerlendirmeleri, yeraltı suyu ve gerekiyorsa zemin-yapı etkileşimi kabulleri hesap modelindeki değerlerle karşılaştırılmalıdır.",
        "",
        "Özellikle rapordaki karakteristik/tasarım parametreleri birbirine karıştırılmamalı; temel tipi veya temel kotu proje geliştirme sırasında değiştiyse geoteknik raporun hâlâ bu çözümü temsil edip etmediği kontrol edilmelidir.",
        "",
        "Bir parametrenin hesap raporunda görünmesi, onun doğru kaynaktan geldiği anlamına gelmez. Denetçi için izlenebilirlik, değerin **zemin etüdü → model girdisi → temel kontrolü** zincirinde aynı anlamı taşımasıdır."
      ),
      subsections: [],
    },
    {
      id: "hesap-model-pafta-tutarliligi",
      title: "Hesap modelindeki eleman ve donatı kararlarını uygulama paftalarında kapatın",
      content: phase4Lines(
        "Analiz modeli ile uygulama paftası arasındaki kontrol iki yönlü yapılmalıdır: modelde bulunan her ana taşıyıcı elemanın paftada karşılığı olmalı; paftada imal edilecek elemanın da hesap/model dayanağı bulunmalıdır.",
        "",
        "| Kontrol katmanı | Denetim sorusu | Kanıt | Uygunsuzluk aksiyonu |",
        "|---|---|---|---|",
        "| Geometri | Aks, kot, kesit ve boşluklar aynı mı? | Mimari + kalıp planı + model | Geometri revizyonu |",
        "| Malzeme | Beton ve donatı sınıfları tek kaynakta tutarlı mı? | Proje notu + hesap + pafta | Proje notlarını eşitle |",
        "| Taşıyıcı sistem | Kolon/perde/kiriş/döşeme ve temel sistemi aynı mı? | Model ekranı + hesap özeti + pafta | Model veya paftayı revize et |",
        "| Tasarım sonucu | Hesapla gereken donatı/detail paftada uygulanabilir mi? | Tasarım özeti + donatı detayı | Detayı düzelt, hesabı yeniden doğrula |",
        "| Revizyon | Son değişiklik bütün disiplinlere işlendi mi? | Revizyon bulutu/listesi + onay | Eski paftayı kullanım dışı bırak |",
        "",
        "Amaç paftayı hesap raporunun görsel kopyası yapmak değil; hesap kararını sahada yanlış yoruma kapalı hale getirmektir."
      ),
      subsections: [],
    },
    {
      id: "kritik-modelleme-kontrolleri",
      title: "Model kabulü ile yönetmelik kontrolünü birbirinden ayırın",
      content: phase4Lines(
        "Analiz yazılımının varsayılan ayarları proje kabulü değildir. Diyafram modeli, rijitlik kabulleri, kütle kaynağı, mesnetler, bodrum rijitliği, ikinci mertebe etkileri ve eleman uç koşulları gibi model kararları proje mühendisinin açık kabulüdür ve hesap raporunda izlenebilir olmalıdır.",
        "",
        "Denetimde yalnız sonuç oranlarına bakmak yerine önce modelin fiziksel yapıyı temsil edip etmediği sorgulanmalıdır. Yanlış model doğru denklemleri kullanarak da yanlış mühendislik sonucu üretebilir.",
        "",
        "Kontrol bulguları 'programda uygun' şeklinde kapatılmamalı; ilgili yönetmelik kontrolü, kullanılan kabul ve paftadaki karşılığı birlikte gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "revizyon-ve-saha-izlenebilirligi",
      title: "Onaydan sonra taşıyıcı sistemi etkileyen her değişikliği kontrollü revizyona bağlayın",
      content: phase4Lines(
        "Şantiyede açılan yeni tesisat boşluğu, kaydırılan perde/kolon, değişen temel kotu veya kesit değişikliği 'uygulamada çözüldü' notuyla kapatılamaz. Taşıyıcı sistemi etkileyen değişiklik ilgili proje müellifi ve denetim süreci üzerinden değerlendirilip onaylı revizyona dönüşmelidir.",
        "",
        "Eski revizyonların sahada dolaşımda kalması özellikle kalıp ve donatı imalatında ciddi hata kaynağıdır. Güncel paftanın revizyon numarası, dağıtım kaydı ve saha kopyası birbiriyle eşleşmelidir.",
        "",
        "Denetim kaydı, projenin hangi sürümünün hangi tarihte uygun bulunduğunu ve sonraki değişikliklerin hangi kontrolleri yeniden açtığını gösterebilmelidir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Kontrole esas proje paketinin tarih ve revizyonlarını sabitledim.",
        "- [ ] **4708**, Yapı Denetimi Uygulama Yönetmeliği **Madde 5 / Madde 6** ve ilgili **Ek-3 Form-1** kontrol çerçevesini doğruladım.",
        "- [ ] **Mimari proje** ile statik aks, kot, boşluk ve taşıyıcı eleman geometrisini karşılaştırdım.",
        "- [ ] **Zemin etüdü** parametrelerinin hesap modeline ve temel kararına doğru aktarıldığını doğruladım.",
        "- [ ] Model kabul ve yük kaynaklarını yalnız program varsayılanına bırakmadım.",
        "- [ ] Hesap sonuçları ile **uygulama paftaları** arasında eleman/donatı izlenebilirliği kurdum.",
        "- [ ] Taşıyıcı sistemi etkileyen değişiklikleri onaylı revizyona bağladım.",
        "- [ ] Uygunsuzlukları kat + aks + eleman + yapılacak aksiyon biçiminde kayıt altına aldım."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "4708 ve ikincil yapı denetimi mevzuatının güncel sürümleri proje tarihinde bu resmî erişim noktasından doğrulanmalıdır.",
    },
    {
      label: "ÇŞİDB — Yapı Denetimi Uygulama Yönetmeliği (resmî Bakanlık arşiv PDF'si)",
      href: YAPI_DENETIM_UYGULAMA,
      note: "Madde 5, Madde 6 ve Ek-3 proje kontrol çerçevesi için; son değişiklikler Bakanlığın güncel mevzuat sayfasından ayrıca kontrol edilmelidir.",
    },
    {
      label: "Resmî Gazete — Planlı Alanlar İmar Yönetmeliği değişikliği, 01.11.2018",
      href: PLANLI_ALANLAR,
      note: "Statik projenin mimari ve zemin-temel etüdü ile ilişkisi, proje içeriği ve 4708 kapsamındaki denetçi uygun görüşü için resmî kaynak.",
    },
  ],
  keywords: ["4708", "statik proje kontrolü", "Form-1", "yapı denetimi", "mimari statik koordinasyon", "zemin etüdü"],
  tags: ["yapı denetimi", "statik proje", "proje kontrolü", "4708"],
};
