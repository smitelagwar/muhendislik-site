import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const YAPI_DENETIM_UYGULAMA = "https://webdosya.csb.gov.tr/db/edirne/icerikler/2-yapi-denetim-uygulama-yonetmeligi-20200508122944.pdf";
const PLANLI_ALANLAR = "https://www.resmigazete.gov.tr/eskiler/2018/11/20181101-7.htm";

export const DEPREM_PHASE4_YAPI_UYGULAMA_CIZIMLERI: DepremPhase4Override = {
  slug: "yapi-denetimi-betonarme-uygulama-cizimleri",
  description: "Betonarme uygulama çizimlerini hesap raporunun görsel eki olarak değil; aks, kot, kesit, donatı, birleşim ve revizyon bilgisini sahaya eksiksiz aktaran, mimari ve diğer disiplinlerle koordineli imalat dokümanı olarak ele alır.",
  seoTitle: "Betonarme Uygulama Çizimlerinde Bulunması Gereken Detaylar | Kontrol Rehberi",
  seoDescription: "Kalıp ve donatı paftalarında aks-kot-kesit, çap-adet-aralık, bindirme-sarılma, temel filizi, boşluk ve revizyon kontrolleri.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "uygulama-ciziminin-islevi",
      title: "Uygulama çizimi hesap sonucunu sahada tek anlamlı bir imalat tarifine dönüştürmelidir",
      content: phase4Lines(
        "Betonarme tasarımda doğru hesap sonucu, **uygulama paftaları** üzerinde uygulanabilir ve denetlenebilir biçimde gösterilmediğinde kalite zinciri tamamlanmış sayılmaz. Paftanın görevi, şantiye ekibinin kritik taşıyıcı sistem kararlarını yorumlayarak tahmin etmesini önlemektir.",
        "",
        "Planlı Alanlar İmar Yönetmeliği, statik projeyi taşıyıcı sistemin plan, kesit, detay ve hesaplarıyla birlikte tanımlar; 4708 kapsamındaki yapılarda denetçi mühendislerin projelere uygun görüş vermesi gerekir. Bu nedenle **ruhsat eki** statik paftalar, hesap/model ve mimari ile aynı source-of-truth'u taşımalıdır.",
        "",
        "İyi pafta yalnız çok bilgi içeren pafta değildir. Bilginin eleman koduna, kata ve geometrik konuma bağlanması; tekrar eden notların birbiriyle çelişmemesi ve güncel **revizyon** durumunun açık olması esastır."
      ),
      subsections: [],
    },
    {
      id: "kalip-plani-geometrisi",
      title: "Kalıp planında aks, kot, eleman kimliği ve boşluk geometrisini eksiksiz gösterin",
      content: phase4Lines(
        "Kalıp planı taşıyıcı sistemin geometrik sözleşmesidir. Her katta **aks** sistemi, referans **kot**, kolon/perde/kiriş/döşeme kimlikleri, kesit ölçüleri, döşeme kot farkları, konsollar, merdiven/asansör ve diğer yapısal boşluklar okunabilir olmalıdır.",
        "",
        "Mimariyle koordinasyonda özellikle kolon-perde konumları, şaft/tesisat boşlukları, cephe çıkmaları ve dilatasyon sınırları kontrol edilmelidir. Bir boşluk mimaride var fakat kalıp planında yoksa, sahada sonradan kırma/delme riski doğar.",
        "",
        "Kesit ve detay çağrıları gerçek çizime bağlanmalı; aynı eleman farklı paftalarda farklı kesitle gösterilmemelidir."
      ),
      subsections: [],
    },
    {
      id: "donati-tarifinin-tamligi",
      title: "Donatıyı yalnız çap bilgisiyle değil, adet, aralık, konum ve süreklilik ile tarif edin",
      content: phase4Lines(
        "Bir donatı notunun sahada doğrulanabilmesi için gereken bilgi eleman türüne göre değişir; ancak **çap**, **adet** veya **aralık** bilgisinin tek başına verilmesi çoğu durumda yeterli değildir. Çubuğun hangi yüzde/katmanda olduğu, nereden başlayıp nerede bittiği ve hangi kesit/detail ile ilişkili olduğu okunabilmelidir.",
        "",
        "Kolon ve perdede boyuna/enine donatı; kirişte mesnet-açıklık ve üst-alt donatı; döşemede doğrultu, üst-alt katman ve ilave donatı birbirinden ayrılmalıdır. Donatı açılımı ile plan üzerindeki eleman kodu birebir eşleşmelidir.",
        "",
        "Paftada hesapta olmayan 'alışılmış' donatı eklemek veya hesapta gereken donatıyı çizim sade olsun diye gizlemek iki ayrı kalite hatasıdır."
      ),
      subsections: [],
    },
    {
      id: "bindirme-kenetlenme-sarilma",
      title: "Bindirme, kenetlenme ve sarılma bölgelerini çizimde konuma bağlayın",
      content: phase4Lines(
        "Deprem etkisi altındaki betonarme elemanlarda **bindirme**, kenetlenme ve **sarılma** bölgeleri yalnız genel proje notuna bırakılmamalıdır. Kritik bölgeler eleman üzerinde gösterilmeli, enine donatı sıklaştırması ile boyuna donatı sürekliliği aynı detayda okunabilmelidir.",
        "",
        "Özellikle kolon-kiriş birleşimleri, kolon/perde uç bölgeleri, kiriş uçları, temel filizleri ve kat geçişleri çizim sırasında birbirinden bağımsız ele alınmamalıdır. Bir elemanın donatısı diğer elemanın çekirdeğine veya temele nasıl devam ediyor sorusunun çizimde cevabı bulunmalıdır.",
        "",
        "Sayısal boy ve aralıklar güncel proje hesabı ve yürürlükteki tasarım kurallarından gelmelidir; şablon veya eski proje kopyasından taşınmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "temel-ustyapi-surekliligi",
      title: "Temel filizleri ile üstyapı elemanlarını ayrı paftalar arasında koparmayın",
      content: phase4Lines(
        "Temel planı, kolon/perde aplikasyonu ve üst kat donatı detayları farklı paftalarda olsa bile taşıyıcı süreklilik tek sistemdir. Temel içindeki filiz konumu, eleman aksı, kesit dönüşü ve üstyapıdaki boyuna donatı düzeni birbiriyle uyumlu olmalıdır.",
        "",
        "| Pafta / detay | Görülmesi gereken ilişki | Tipik hata | Kontrol aksiyonu |",
        "|---|---|---|---|",
        "| Kalıp planı | Aks + kot + eleman kesiti + boşluk | Mimariyle aks/boşluk çakışması | Mimari-statik overlay kontrolü |",
        "| Kolon/perde aplikasyonu | Eleman kodu + kesit + yön | Katlar arasında kod/yön değişimi | Katlar arası süreklilik kontrolü |",
        "| Kiriş/döşeme donatısı | Çap/adet/aralık + üst-alt/mesnet-açıklık | Donatı konumu belirsiz | Kesit ve detay çağrısı ekle |",
        "| Temel donatısı | Filiz + temel donatısı + kolon/perde ilişkisi | Filiz konumu üstyapıyla uyuşmuyor | Aplikasyon ve temel planını eşleştir |",
        "| Birleşim detayı | Kenetlenme + bindirme + sarılma | Genel notla geçiştirilmiş kritik bölge | Eleman bazlı detail üret |",
        "",
        "Temel ve üstyapı arasındaki uyuşmazlıklar beton döküldükten sonra düzeltilmesi en maliyetli proje hataları arasındadır."
      ),
      subsections: [],
    },
    {
      id: "disiplin-koordinasyonu",
      title: "Tesisat geçişi ve gömülü elemanları taşıyıcı detayla onaylı koordinasyona bağlayın",
      content: phase4Lines(
        "Mekanik-elektrik şaftları, boru/kanal geçişleri, ankraj plakaları, cephe bağlantıları ve benzeri gömülü elemanlar taşıyıcı kesit veya donatı düzenini etkileyebilir. Bu noktalar şantiyede 'yer açılarak' çözülmemelidir.",
        "",
        "Kiriş/perde/kolonda yeni bir delik veya boşluk gerekiyorsa statik proje müellifi tarafından değerlendirilmiş koordinasyon detayı üretilmelidir. Onaylı çizimde gösterilmeyen bir geçiş için donatı kesilmesi kabul edilebilir rutin çözüm değildir.",
        "",
        "Koordinasyon detayı hangi disiplinin geometrisini değiştirdiğini ve statik projede hangi revizyonun yapıldığını izlenebilir kılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "revizyon-yonetimi",
      title: "Revizyon numarası, bulutu ve saha dağıtımı aynı değişikliği göstermelidir",
      content: phase4Lines(
        "Pafta kalitesi yalnız çizim içeriğiyle ölçülmez; sahada doğru sürümün kullanılmasını da kapsar. Her **revizyon** için değişen bölge, revizyon açıklaması/tarihi ve onay zinciri izlenebilmelidir.",
        "",
        "Eski paftanın saha panosunda veya ekip telefonlarında dolaşımda kalması, yeni paftanın teknik doğruluğunu pratikte etkisiz hale getirir. Kullanım dışı sürümler açık biçimde iptal edilmeli ve kontrollü dağıtım yapılmalıdır.",
        "",
        "Taşıyıcı sistemi etkileyen mimari veya tesisat değişikliğinde yalnız ilgili detay değil; hesap modeli, kalıp planı ve ilişkili donatı paftalarının da revizyon ihtiyacı değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] **Ruhsat eki** proje setindeki güncel revizyonları sabitledim.",
        "- [ ] Her katta **aks**, **kot**, kesit, eleman kodu ve yapısal boşlukları mimariyle karşılaştırdım.",
        "- [ ] Donatı tariflerinde gerekli **çap**, **adet**, **aralık** ve konum bilgisinin okunabildiğini kontrol ettim.",
        "- [ ] **Bindirme**, kenetlenme ve **sarılma** bölgelerinin kritik elemanlarda konuma bağlı gösterildiğini doğruladım.",
        "- [ ] Temel filizleri ile kolon/perde üstyapı sürekliliğini paftalar arasında eşleştirdim.",
        "- [ ] Tesisat geçişi ve gömülü elemanların onaylı koordinasyon detayına sahip olduğunu kontrol ettim.",
        "- [ ] Aynı elemanın plan, kesit ve açılımındaki bilgilerin çelişmediğini doğruladım.",
        "- [ ] Son **revizyon** paftalarının sahadaki dağıtımını ve eski sürümlerin iptalini kontrol ettim."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "4708 kapsamındaki proje denetimi ve güncel ikincil mevzuat için resmî erişim noktası.",
    },
    {
      label: "ÇŞİDB — Yapı Denetimi Uygulama Yönetmeliği (resmî Bakanlık arşiv PDF'si)",
      href: YAPI_DENETIM_UYGULAMA,
      note: "Proje/application denetimi ve kontrol kayıtları için; son değişiklikler Bakanlığın güncel mevzuat sayfasından doğrulanmalıdır.",
    },
    {
      label: "Resmî Gazete — Planlı Alanlar İmar Yönetmeliği değişikliği, 01.11.2018",
      href: PLANLI_ALANLAR,
      note: "Statik proje kapsamı, ruhsat eki proje koordinasyonu ve proje çizim/tanzim ilkeleri için resmî kaynak.",
    },
  ],
  keywords: ["betonarme uygulama çizimi", "kalıp planı", "donatı paftası", "bindirme", "sarılma", "revizyon"],
  tags: ["yapı denetimi", "uygulama paftası", "donatı detayı", "kalıp planı"],
};
