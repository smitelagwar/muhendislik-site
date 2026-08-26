import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

const AFAD_MARMARA = "https://istanbul.afad.gov.tr/17-agustos-1999-marmara-depremini-unutmadik-unutmayacagiz";
const IPKB_STRUCTURAL_RISK = "https://www.ipkb.gov.tr/e-kutuphane/depreme-karsi-yapisal-risklerin-azaltilmasi_10/";
const IPKB_SCHOOL_PLAN = "https://www.ipkb.gov.tr/wp-content/uploads/2023/03/EGITIM-KURUMLARI-ICIN-AFET-ACIL-DURUM-YONETIMI-PLAN-ORNEGI.pdf";

export const DEPREM_PHASE3_MARMARA_1999: DepremPhase3Override = {
  slug: "1999-marmara-depreminden-cikarilan-muhendislik-dersleri",
  description: "17 Ağustos 1999 Marmara Depremi sonrasında öne çıkan zemin, düzensizlik, yumuşak kat, kısa kolon, beton kalitesi ve detaylandırma risklerini bugünkü mühendislik kontrolleriyle ilişkilendirir.",
  seoTitle: "17 Ağustos 1999 Marmara Depremi | Mühendislik Dersleri",
  seoDescription: "1999 Marmara Depremi üzerinden zemin etkisi, yumuşak kat, kısa kolon, beton kalitesi, sargı donatısı ve güncel TBDY kontrol yaklaşımı.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "olay-ve-muhendislik-okumasi",
      title: "17 Ağustos 1999'u yalnız büyüklük ve can kaybı sayılarıyla okumak yetmez",
      content: phase3Lines(
        "İstanbul AFAD'ın resmî kaydına göre 17 Ağustos 1999 Marmara Depremi saat **03:02**'de, merkez üssü Kocaeli'nin Gölcük ilçesi olacak şekilde meydana geldi ve çok geniş bir bölgede ağır can ve yapı kayıplarına yol açtı. Afet yönetimi açısından da Türkiye için bir dönüm noktası oldu.",
        "",
        "İnşaat mühendisliği açısından asıl kalıcı ders, tek bir 'deprem şiddeti' açıklaması üretmek değil; aynı sarsıntı altında neden bazı yapıların ağır hasar gördüğünü, bazılarının ise daha iyi performans verdiğini taşıyıcı sistem, malzeme, detay, zemin ve uygulama kalitesi üzerinden sorgulamaktır.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> Yapım yılı, proje/ruhsat tarihi, taşıyıcı sistem, beton ve donatı bilgisi, zemin profili, sonradan yapılan müdahaleler ve gözlenen hasar bir bina değerlendirmesinin SOURCE_VALUE girdileridir. '1999 öncesi/sonrası' etiketi bunların yerine geçmez."
      ),
      subsections: [],
    },
    {
      id: "zemin-ve-yerel-etkiler",
      title: "Zemin koşulları ve yerel etkiler yapı talebini büyütebilir",
      content: phase3Lines(
        "Deprem hasarı yalnız üstyapının kolon-kiriş hesabından oluşmaz. Zayıf veya suya doygun zemin, sıvılaşma, oturma ve zemin büyütmesi gibi etkiler temel ve üstyapının maruz kaldığı talebi değiştirebilir. Aynı nedenle güncel projede AFAD tehlike verisi ile yerel zemin sınıfının birlikte kullanılması gerekir.",
        "",
        "1999 sonrasında Marmara'daki hasar tartışmalarının önemli başlıklarından biri zemin-yapı ilişkisidir. Bir binanın ağır hasarını yalnız 'zemin kötüydü' diye açıklamak da yalnız 'kolon küçüktü' diye açıklamak da yetersiz olabilir; hasar mekanizması bütün yük yolu üzerinden incelenmelidir.",
        "",
        "Bugünkü ofis kontrolünde zemin etüdü verisi, temel sistemi, yerel zemin sınıfı, sıvılaşma değerlendirmesi ve üstyapı modelinin aynı proje konumuna ait olduğu doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "duzensizlikler-ve-yuk-yolu",
      title: "Yumuşak kat, kısa kolon ve düzensiz yük yolu gevrek hasar riskini büyütür",
      content: phase3Lines(
        "İPKB'nin yapısal risk eğitim materyalleri düşük deprem güvenliğinin tipik nedenleri arasında **yumuşak kat**, yetersiz kolon kesiti, düşük beton dayanımı ve kolon-kiriş bölgelerinde yetersiz sargı donatısını sayar. Kısa kolon ise kısıtlanmış serbest yükseklik nedeniyle yüksek kesme talebi üreten, deprem davranışında özellikle dikkat edilmesi gereken başka bir mekanizmadır.",
        "",
        "| Gözlenen / tasarlanan durum | Mühendislik mekanizması | Güncel proje kontrolü |",
        "|---|---|---|",
        "| Giriş katında dolgu duvarların ani azalması | Kat rijitliği ve dayanımında süreksizlik; yumuşak kat riski | TBDY B2 ve taşıyıcı sistem düzeni |",
        "| Bant pencere, kısmi dolgu veya kot farkı | Kolon serbest boyunun kısalması; kısa kolon kesmesi | Gerçek serbest yükseklikle kapasite kesmesi |",
        "| Planda/düşeyde kuvvet yolunun kesilmesi | Burulma, yerel talep yığılması, aktarım problemi | A1–A3/B1–B3 düzensizlik kontrolleri ve diyafram yük yolu |",
        "| Yetersiz perde/çerçeve düzeni | Yüksek ötelenme ve talep yoğunlaşması | R–D sistemi, drift, P-Δ ve kapasite tasarımı |",
        "",
        "Ders, her düzensizliğin otomatik olarak aynı analiz yöntemini zorunlu kıldığı değildir; her düzensizliğin kendi TBDY sonucu ve tasarım tedbiri ayrı uygulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "malzeme-ve-detay",
      title: "Beton kalitesi ve sargı donatısı, yalnız pafta notu değil gerçek taşıma kapasitesidir",
      content: phase3Lines(
        "Düşük beton dayanımı kesitin basınç, kesme ve aderans davranışını; yetersiz enine donatı ise kolon uçlarında ve birleşim bölgelerinde süneklik ile beton çekirdeğinin sarılmasını doğrudan etkiler. İPKB eğitim dokümanlarında düşük beton dayanımı ve kolon-kiriş bölgelerinde yetersiz **sargı donatısı** deprem güvenliğini düşüren başlıca nedenler arasında sayılır.",
        "",
        "Deprem performansında toplam boyuna donatı alanı kadar etriye/çiroz geometrisi, sıklaştırma bölgeleri, bindirme yerleri, kenetlenme ve kolon-kiriş birleşim bölgesi kesme güvenliği de önemlidir. Bu nedenle 'donatı metrajı yeterli' cümlesi tek başına sünek detaylandırma kanıtı değildir.",
        "",
        "Şantiye tarafındaki ders de aynıdır: tasarımda doğru görünen detay, pas payı, etriye aralığı, bindirme konumu, beton yerleştirme ve kür uygulaması sahada doğrulanmadıkça beklenen davranışa dönüşmez."
      ),
      subsections: [],
    },
    {
      id: "bugunku-tbdy-karsiligi",
      title: "Bugünkü TBDY kontrolleri bu dersleri sayısal karar kapılarına dönüştürür",
      content: phase3Lines(
        "TBDY 2018; düzenlilik, taşıyıcı sistem seçimi, etkin kesit rijitliği, göreli kat ötelenmesi, ikinci mertebe etkileri, kapasite tasarımı ve betonarme sünek detaylandırmayı birbirinden kopuk notlar olarak değil aynı deprem tasarım zincirinin parçaları olarak ele alır.",
        "",
        "1999'dan çıkarılan doğru mühendislik dersi, 'daha çok beton ve daha çok demir kullanmak' değildir. Doğru yük yolu, yeterli dayanım ve rijitlik, süneklik, doğru zemin girdisi, gevrek mekanizmaların kapasite tasarımıyla önlenmesi ve uygulamanın projeye uygun yapılması birlikte gerekir.",
        "",
        "Bu nedenle güncel bir projede yalnız analiz programının 'OK' sonucuna değil; düzensizlikler, drift, P-Δ, güçlü kolon-zayıf kiriş, eleman kesme güvenliği, birleşim bölgeleri, perde uç bölgeleri ve diyafram kuvvet aktarımı gibi kontrollerin raporda izlenebilir olmasına bakılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "mevcut-bina-karari",
      title: "1999 öncesi veya sonrası etiketi, mevcut bina performans raporu değildir",
      content: phase3Lines(
        "Bir binanın 1999'dan önce yapılmış olması araştırma önceliğini artırabilir; ancak tek başına risk sınıfı üretmez. Aynı şekilde daha yeni bir yapının ruhsat yılı da malzeme, uygulama veya sonradan müdahale sorunlarını ortadan kaldırmaz.",
        "",
        "Mevcut bir bina için güvenlik sorusu varsa doğru yol; taşıyıcı sistem rölövesi, malzeme tespiti, donatı ve korozyon incelemesi, zemin verisi, proje arşivi ve gerekli TBDY Bölüm 15 değerlendirmesini bir araya getirmektir.",
        "",
        "Hasar gözleniyorsa bunun yalnız fotoğraftaki çatlak biçimine bakılarak yorumlanması da yeterli değildir. Elemanın sistem içindeki rolü, hasar konumu, kesme/eğilme mekanizması ve yapı genelindeki dağılımı birlikte değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- 17 Ağustos 1999 olay bilgisi resmî AFAD kaynağıyla doğrulandı mı?",
        "- Zemin sınıfı, sıvılaşma ve temel kararları üstyapı modelinden kopuk ele alınmadı mı?",
        "- Yumuşak kat ve diğer düşey düzensizlikler yönetmelik tanımlarıyla kontrol edildi mi?",
        "- Kısa kolon oluşabilecek kısmi dolgu, bant pencere, merdiven/kot farkı gibi detaylar gerçek geometriyle modellendi mi?",
        "- Beton dayanımı, kolon kesitleri ve sargı donatısı yalnız projede değil saha/deney verileriyle de doğrulanıyor mu?",
        "- Kolon-kiriş birleşimleri, kapasite kesmesi ve bindirme/kenetlenme bölgeleri sünek tasarım mantığıyla çözüldü mü?",
        "- Göreli ötelenme ve P-Δ kontrolleri sistem rijitliğiyle birlikte değerlendirildi mi?",
        "- '1999 öncesi = güvensiz' veya '1999 sonrası = güvenli' gibi mühendislik dışı kesin hükümlerden kaçınıldı mı?",
        "- Mevcut bina için gerekiyorsa güncel mühendislik performans değerlendirmesine geçildi mi?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase3References("1999 sonrası mühendislik derslerinin güncel tasarım karşılıkları; Bölüm 3, 4, 7 ve 15"),
    {
      label: "İstanbul AFAD — 17 Ağustos 1999 Marmara Depremi",
      href: AFAD_MARMARA,
      note: "Depremin tarih, saat, merkez üssü ve afet yönetimindeki dönüm noktası niteliği için kullanılmıştır.",
    },
    {
      label: "İstanbul Proje Koordinasyon Birimi — Depreme Karşı Yapısal Risklerin Azaltılması",
      href: IPKB_STRUCTURAL_RISK,
      note: "Yapısal zayıflıkların mühendislik tasarımı, yapım ve kullanım sürecinde nasıl oluşabildiğine ilişkin eğitim kaynağıdır.",
    },
    {
      label: "İPKB — Eğitim Kurumları İçin Afet Acil Durum Yönetimi Plan Örneği",
      href: IPKB_SCHOOL_PLAN,
      note: "Yetersiz sargı donatısı, düşük beton dayanımı, küçük kolon kesiti ve yumuşak kat gibi tipik yapısal risklerin listelendiği eğitim dokümanıdır.",
    },
  ],
  keywords: ["17 Ağustos 1999", "Marmara Depremi", "yumuşak kat", "kısa kolon", "beton", "sargı donatısı", "sıvılaşma", "TBDY"],
  tags: ["1999 Marmara", "Deprem Hasarı", "Yapısal Risk", "TBDY 2018"],
};
