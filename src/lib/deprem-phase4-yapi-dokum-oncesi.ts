import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const YAPI_DENETIM_UYGULAMA = "https://webdosya.csb.gov.tr/db/edirne/icerikler/2-yapi-denetim-uygulama-yonetmeligi-20200508122944.pdf";
const YAPI_DENETIM_2025 = "https://isparta.csb.gov.tr/haberler/yapi-denetim-uygulama-yonetmeliginde-degisiklik-295123";
const BETONARME_SARTNAME = "https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf";

export const DEPREM_PHASE4_YAPI_DOKUM_ONCESI: DepremPhase4Override = {
  slug: "yapi-denetimi-dokum-oncesi-kalip-donati",
  description: "Beton dökümü öncesi kalıp ve donatı kontrolünü bir saha hold-point'i olarak ele alır; aks-kot-kesit, kalıp stabilitesi, pas payı, donatı sürekliliği, gömülü elemanlar, beton hazırlığı ve fotoğraflı izlenebilirlik kapanmadan dökümün serbest bırakılmaması gerektiğini açıklar.",
  seoTitle: "Beton Dökümü Öncesi Kalıp ve Donatı Kontrolü | Saha Hold-Point",
  seoDescription: "Döküm öncesi aks-kot-kesit, kalıp, pas payı, bindirme-ankraj, gömülü eleman, vibratör, beton ve kayıt kontrolleri için teknik rehber.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "dokum-oncesi-hold-point",
      title: "Döküm öncesi kontrol, betondan sonra erişilemeyecek imalatlar için geri dönüş kapısıdır",
      content: phase4Lines(
        "Beton dökümü öncesi kontrolün mühendislik değeri, beton sertleştikten sonra doğrudan görülemeyecek kalıp geometrisi, donatı yerleşimi, birleşimler ve gömülü elemanları son kez doğrulamasıdır. Bu nedenle kontrol bir formalite değil, açık bir **hold-point / döküm serbest bırakma** kararıdır.",
        "",
        "2025 tarihli resmî Bakanlık duyurusunda yapı denetim kuruluşlarının **'kalıp ve donatı imalatını teslim alma'** ve **'betona nezaret'** gibi mevzuatla verilen denetim görevlerini yerine getirmemesinin sözleşme feshi süreçleri bakımından önem taşıdığı açıkça vurgulanmıştır.",
        "",
        "Kontrol listesi tamamlanmadan beton siparişi veya pompa programı baskısıyla döküme geçmek, daha sonra karot/kırma/güçlendirme gibi maliyetli düzeltmelere dönüşebilecek uygunsuzlukları betonun içine kapatır."
      ),
      subsections: [],
    },
    {
      id: "kalip-geometri-stabilite",
      title: "Kalıpta önce aks, kot ve kesiti; sonra stabilite, sızdırmazlık ve yüzey hazırlığını kontrol edin",
      content: phase4Lines(
        "Kalıp kontrolü **aks**, **kot**, eleman kesiti ve döşeme/temel geometrisinin onaylı projeye uygunluğuyla başlar. Kolon-perde düşeyliği, kiriş/döşeme kotları, boşluklar, pahlar ve gerekli derz geometrisi ölçülmeden yalnız gözle 'uygun' kararı verilmemelidir.",
        "",
        "Kalıp ve iskele taşıma/stabilite düzeni döküm yükleri ve iş sırasına uygun olmalıdır. Açılma, şişme veya kaçak riski yaratacak birleşimler giderilmeli; kalıp içi talaş, bağ teli, çamur ve serbest yabancı maddeler temizlenmelidir.",
        "",
        "Genel teknik şartname yaklaşımında kalıp ayırıcı malzemesinin donatıya bulaşmaması ve beton yüzeyini/aderansı olumsuz etkilememesi de saha kontrolünün parçasıdır."
      ),
      subsections: [],
    },
    {
      id: "donati-projeye-uygunluk",
      title: "Donatı kontrolünü çap-adet-aralık sayımından süreklilik ve birleşim kontrolüne genişletin",
      content: phase4Lines(
        "Donatı için minimum saha kontrolü eleman bazında **çap**, adet, aralık ve konumun onaylı paftayla eşleştirilmesidir. Ancak deprem davranışı açısından bu kontrol tek başına yeterli değildir.",
        "",
        "Boyuna donatı sürekliliği, etriye/çiroz düzeni, sarılma bölgeleri, **bindirme** konumu ve boyu, **ankraj**/kenetlenme, kolon-kiriş birleşimi, perde uç bölgesi, kiriş mesnetleri ve temel filizleri birlikte incelenmelidir.",
        "",
        "Donatı sahada paftaya göre değiştirildiyse 'eşdeğer alan' gerekçesi otomatik kabul değildir. Çap/adet değişimi aralık, aderans, sığma, birleşim ve detaylandırma koşullarını etkileyebilir; proje müellifi değerlendirmesi ve onaylı revizyon gerekir."
      ),
      subsections: [],
    },
    {
      id: "pas-payi-ve-mesnetleme",
      title: "Pas payını yalnız kalıp yüzeyine mesafe olarak değil, betonlama sırasında korunacak geometri olarak görün",
      content: phase4Lines(
        "**Pas payı**, donatının kalıp içindeki ilk konumundan ibaret değildir. Paspayı elemanları, sehpa/mesnetleme ve bağ telleri betonlama sırasında donatının deplase olmasını önleyecek düzen oluşturmalıdır.",
        "",
        "Yetersiz mesnetleme; üst döşeme donatısının aşağı inmesine, perde/kolon donatısının kalıba yaklaşmasına veya temel donatısının zemine/yalıtıma basmasına neden olabilir. Bu durum dayanım kadar durabilite ve yangın performansını da etkiler.",
        "",
        "Taş, ahşap parçası veya projede/şartnamede uygunluğu olmayan rastgele takozlar kontrol aracı değildir. Kullanılan mesnet/paspayı elemanı beton ve çevresel koşulla uyumlu olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "gomulu-eleman-ve-bosluklar",
      title: "Gömülü elemanları, rezervasyonları ve tesisat geçişlerini dökümden önce koordinasyon paftasıyla kapatın",
      content: phase4Lines(
        "Beton içinde kalacak **gömülü** parçalar, ankraj plakaları, sleeve/rezervasyonlar, tesisat geçişleri, su tutucu bantlar ve benzeri elemanlar döküm öncesi son konumunda sabitlenmelidir.",
        "",
        "Taşıyıcı elemanda onaylı projede bulunmayan bir delik veya geçiş için sahada donatı kesmek ya da kiriş/perde kesitini zayıflatmak kabul edilebilir koordinasyon yöntemi değildir. Gerekiyorsa statik proje revizyonu dökümden önce tamamlanmalıdır.",
        "",
        "Temel ve bodrum imalatında su yalıtımı, waterstop ve gömülü tesisat parçaları gibi disiplinler arası detaylar sonradan erişilemeyeceği için kontrol kaydında ayrıca işaretlenmelidir."
      ),
      subsections: [],
    },
    {
      id: "betonlama-hazirligi",
      title: "Döküm iznini beton sınıfı, lojistik, sıkıştırma, numune ve kür hazırlığıyla birlikte verin",
      content: phase4Lines(
        "Kalıp ve donatı uygun olsa bile betonlama organizasyonu hazır değilse teknik risk kapanmış değildir. Sipariş edilen beton tanımı proje ve çevresel koşullarla uyumlu olmalı; irsaliye ve döküm bölgesi eşleştirme süreci önceden planlanmalıdır.",
        "",
        "Pompa erişimi, döküm sırası, yeterli çalışan, yedek/çalışır **vibratör**, numune alma-laboratuvar organizasyonu, hava koşulu tedbirleri ve erken yaş kür planı sahada hazır olmalıdır. Betonun gelişigüzel yüksekten boşaltılması, yetersiz sıkıştırılması veya plansız soğuk derz oluşturulması doğru malzemeyi yanlış imalata dönüştürebilir.",
        "",
        "| Hold-point | Kabul kanıtı | Hard fail örneği | Döküm kararı |",
        "|---|---|---|---|",
        "| Geometri | Aks/kot/kesit ölçümü | Eleman yeri veya kesiti projeyle uyuşmuyor | DURDUR |",
        "| Donatı | Pafta ile eleman bazlı kontrol | Eksik donatı, yanlış bindirme/ankraj | DURDUR |",
        "| Pas payı | Mesnet ve ölçüm | Donatı kalıba dayanıyor / sabit değil | DURDUR |",
        "| Gömülü eleman | Onaylı koordinasyon detayı | Projesiz delik/geçiş veya donatı kesisi | DURDUR |",
        "| Betonlama hazırlığı | Sipariş + ekipman + numune/kür planı | Beton tanımı belirsiz veya sıkıştırma ekipmanı yok | DURDUR |",
        "| Kayıt | Fotoğraf + kontrol/tutanak | Kritik imalat belgelenmemiş | KAYDI TAMAMLA |"
      ),
      subsections: [],
    },
    {
      id: "foto-ve-uygunsuzluk-kaydi",
      title: "Fotoğrafı kanıt zincirine bağlayın; rastgele galeri oluşturmayın",
      content: phase4Lines(
        "Döküm öncesi fotoğraf kaydı, elemanın nerede olduğunu belli etmiyorsa denetim kanıtı zayıftır. Kayıtlar mümkün olduğunda tarih, blok, kat, **aks** ve eleman koduyla ilişkilendirilmelidir.",
        "",
        "Uygunsuzluk tespitinde önce problem açıkça tanımlanmalı, düzeltme sonrası aynı bölge yeniden kontrol edilip kapanış kanıtı oluşturulmalıdır. 'Usta düzeltti' ifadesi yerine önce/sonra kayıt ve gerekiyorsa proje müellifi onayı bulunmalıdır.",
        "",
        "Döküm saati, ilgili beton sevkiyatları, numune kimliği ve kontrol kaydı aynı imalat diliminde izlenebilir olduğunda saha QA zinciri güçlenir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] **Kalıp ve donatı imalatını teslim alma** kontrolünü dökümden önce tamamladım.",
        "- [ ] Kalıp **aks**, **kot**, kesit, boşluk ve stabilitesini onaylı projeyle doğruladım.",
        "- [ ] Donatı çap/adet/aralık yanında sarılma, **bindirme** ve **ankraj** sürekliliğini kontrol ettim.",
        "- [ ] **Pas payı** ve donatı mesnetlerinin betonlama sırasında konumu koruyacağını doğruladım.",
        "- [ ] **Gömülü** eleman, tesisat geçişi, rezervasyon ve gerekli waterstop detaylarını onaylı koordinasyonla kapattım.",
        "- [ ] Beton tanımı, pompa/döküm sırası, çalışan ve çalışır **vibratör** hazırlığını kontrol ettim.",
        "- [ ] Numune/laboratuvar ve kür organizasyonunu döküm başlamadan teyit ettim.",
        "- [ ] **Betona nezaret** ve kritik imalat fotoğraflarını blok + kat + aks + eleman bilgisiyle izlenebilir kayda bağladım."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "4708 kapsamındaki saha denetimi ve güncel ikincil mevzuat proje/döküm tarihinde bu resmî erişim noktasından doğrulanmalıdır.",
    },
    {
      label: "ÇŞİDB — Yapı Denetimi Uygulama Yönetmeliği (resmî Bakanlık arşiv PDF'si)",
      href: YAPI_DENETIM_UYGULAMA,
      note: "Yapı denetimi görev ve kayıt çerçevesi için; son değişiklikler Bakanlığın güncel mevzuat sayfasından ayrıca kontrol edilmelidir.",
    },
    {
      label: "ÇŞİDB — Yapı Denetim Uygulama Yönetmeliğinde Değişiklik duyurusu",
      href: YAPI_DENETIM_2025,
      note: "Kalıp ve donatı imalatını teslim alma ile betona nezaret görevlerinin güncel düzenleme bağlamındaki önemini açıklayan resmî Bakanlık duyurusu.",
    },
    {
      label: "ÇŞİDB/Yüksek Fen Kurulu — Betonarme İşleri Genel Teknik Şartnamesi",
      href: BETONARME_SARTNAME,
      note: "Kalıp, donatı, betonun yerleştirilmesi ve sıkıştırılması için teknik uygulama çerçevesi; proje şartları ve yürürlükteki standartlarla birlikte kullanılmalıdır.",
    },
  ],
  keywords: ["döküm öncesi kontrol", "kalıp kontrolü", "donatı kontrolü", "pas payı", "betona nezaret", "vibratör"],
  tags: ["yapı denetimi", "beton dökümü", "kalıp", "donatı", "saha kontrolü"],
};
