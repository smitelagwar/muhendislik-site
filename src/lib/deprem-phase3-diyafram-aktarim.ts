import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DIYAFRAM_AKTARIM: DepremPhase3Override = {
  slug: "tbdy-betonarme-diyafram-toplayici-baslik",
  description: "TBDY 2018 Madde 4.5.6 ve 4.5.7'ye göre döşeme diyaframlarının kat eylemsizlik kuvvetlerini düşey taşıyıcılara aktarmasını, iki boyutlu model gereğini ve aktarma elemanı/ek bağlantı donatısı kontrollerini açıklar.",
  seoTitle: "TBDY Döşeme Diyaframı ve Aktarma Elemanları | 4.5.6–4.5.7",
  seoDescription: "Rijit diyafram, 2B sonlu eleman modeli, A2/A3 düzensizlikleri, geçiş döşemeleri, ek bağlantı donatıları ve aktarma elemanlarının proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "diyafram-yuk-yolu",
      title: "4.5.6.1: Döşeme yalnız düşey yük taşımaz; deprem eylemsizlik kuvvetlerinin yatay aktarım sistemidir",
      content: phase3Lines(
        "TBDY 4.5.6.1, kat döşemelerini deprem ivmelerinden doğan eylemsizlik kuvvetlerini düşey taşıyıcı sistem elemanlarına aktaran ve deprem yüklerini bu elemanların rijitliklerine göre dağıtan **yatay taşıyıcı sistem elemanları** olarak tanımlar. Döşemede boşluklar bulunabilir; önemli olan düzlem içi yük aktarımının doğru modellenmesidir.",
        "",
        "| Kontrol başlığı | SOURCE_VALUE | Proje karşılığı |",
        "|---|---|---|",
        "| Diyaframın temel görevi | 4.5.6.1 | Kat eylemsizlik kuvvetini kolon/perdelere taşımak ve dağıtmak |",
        "| A2/A3 veya esnek diyafram beklentisi | 4.5.6.2 | İki boyutlu sonlu eleman modeli |",
        "| Düzenli ve düzlem içi şekil değiştirmesi küçük plan | 4.5.6.3 | Rijit diyafram kullanılabilir |",
        "| Güvenli kuvvet aktarımı | 4.5.6.5 | Hesapla göster; gerekirse ek bağlantı donatısı ve aktarma elemanı kullan |",
        "",
        "> [!engineering] Diyafram varsayımı bir model kolaylığı değil yük yolu kararıdır",
        "> `Rigid diaphragm` seçeneğini yalnız çözüm süresini kısaltmak için kullanmayın. Döşemenin boşlukları, plan geometrisi ve düzlem içi şekil değiştirme potansiyeli bu varsayımı fiziksel olarak desteklemelidir."
      ),
      subsections: [],
    },
    {
      id: "rijit-ve-iki-boyutlu-model",
      title: "4.5.6.2–4.5.6.3: Rijit diyafram ile iki boyutlu döşeme modeli aynı koşullarda kullanılmaz",
      content: phase3Lines(
        "4.5.6.2'ye göre **A2/A3** türü düzensizliklerin bulunduğu, döşemenin rijit diyafram çalışmasının öngörülmediği veya betonarme kirişsiz döşeme sisteminin bulunduğu binalarda döşemeler **iki boyutlu sonlu eleman**larla modellenir.",
        "",
        "4.5.6.3 ise A2 ve A3 düzensizliklerinin bulunmadığı, düzlem içi önemli şekil değiştirmelerin beklenmediği planda düzenli binalarda betonarme döşemelerin rijit diyafram olarak modellenebilmesine izin verir. Rijit diyafram modeli, 4.5.10'daki ek dışmerkezlik hesabında da kullanılır.",
        "",
        "> [!warning] Kirişsiz döşemede otomatik rijit diyafram kabulü",
        "> Plan düzenli görünse bile 4.5.6.2 betonarme kirişsiz döşemeli sistemleri iki boyutlu sonlu eleman modeline dahil eder."
      ),
      subsections: [],
    },
    {
      id: "dusey-eleman-aktarilan-kuvvet",
      title: "4.5.6.4: Rijit diyaframda döşemeden kolon/perdeye aktarılan kuvvet kat kesmelerinin farkından okunur",
      content: phase3Lines(
        "Rijit diyafram modeli kullanıldığında 4.5.6.4, herhangi bir doğrultuda döşemeden bir kolon veya perdeye aktarılan kuvveti, o elemanda döşemenin altındaki ve üstündeki katlarda elde edilen kesme kuvvetlerinin **farkı** olarak tanımlar.",
        "",
        "`Faktarim = Valt - Vüst`",
        "",
        "Bu ifade bir TBDY numaralı denklem değil, 4.5.6.4 hükmünün kontrol föyündeki pratik yazımıdır. İşaret düzeni kullanılan yazılımın kat kesmesi konvansiyonuna göre tutarlı kurulmalıdır.",
        "",
        "> [!check] Birleşim bölgesi",
        "> Döşeme-perde veya döşeme-kolon arayüzünde tasarlanacak bağlantı donatısı için önce aktarılan düzlem içi kuvveti doğru çıkarın; yalnız toplam kat kesmesini doğrudan tek perdeye yüklemeyin."
      ),
      subsections: [],
    },
    {
      id: "aktarma-elemani-ve-baglanti-donatisi",
      title: "4.5.6.5: Güvenli aktarım hesapla gösterilir; gerekiyorsa ek bağlantı donatıları ve aktarma elemanları düzenlenir",
      content: phase3Lines(
        "TBDY 4.5.6.5, 4.5.6.2 veya 4.5.6.4'e göre elde edilen düzlem içi kuvvetlerin döşemeden düşey taşıyıcı sistem elemanlarına **güvenli biçimde aktarıldığının hesapla gösterilmesini** ister. Gerekli durumlarda betonarme döşemelerde **ek bağlantı donatıları** ve **aktarma elemanları** kullanılır.",
        "",
        "Projelerde bu kuvvet yoluna bazen `toplayıcı/collector` veya `başlık/chord` gibi ofis terimleri verilir. Ancak TBDY 4.5.6.5'in bağlayıcı terminolojisi `aktarma elemanları` ve `ek bağlantı donatıları`dır; proje notunda yönetmelik hükmünü bu adlarla izlemek daha nettir.",
        "",
        "> [!regulation] Terminoloji ile hükmü karıştırmayın",
        "> `Toplayıcı` veya `başlık` adını kullanmak kendi başına yeterlilik kanıtı değildir. Hesapta hangi düzlem içi kuvvetin nereden nereye taşındığı, gerekli donatı alanı ve kenetlenme yolu gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "gecis-kati-diyaframi",
      title: "4.5.7: Rijit bodruma geçiş döşemeleri için iki boyutlu model ve aktarım dayanımı ayrıca zorunludur",
      content: phase3Lines(
        "Normal katlardan çok rijit bodrum katlarına geçişte üst yapı eylemsizlik kuvvetlerinin önemli bölümü çevre bodrum perdelerine ani olarak aktarılır. 4.5.7.1 bu döşemelerde yeterli düzlem içi rijitlik ve dayanımı zorunlu tutar.",
        "",
        "4.5.7.2'ye göre geçiş katı döşemeleri, A2/A3 düzensizliği bulunup bulunmadığına bakılmaksızın 4.5.6.2'deki **iki boyutlu sonlu eleman** yaklaşımıyla modellenir. 4.5.7.3, rijit çevre perdelerine aktarılan kuvvetlerin hesaplanmasını ve döşemenin bu aktarım için yeterli dayanımının gösterilmesini ister; gerekirse yine aktarma elemanları ve ek bağlantı donatıları düzenlenir.",
        "",
        "> [!warning] Normal kat rijit diyafram kabulünü geçiş katına otomatik taşımayın",
        "> Üst katlar rijit diyafram modellenmiş olsa bile bodrum geçiş döşemesi 4.5.7.2'nin özel modelleme hükmüne tabidir."
      ),
      subsections: [],
    },
    {
      id: "bosluklar-ve-yuk-yolu",
      title: "Büyük boşluklar ve dar döşeme şeritleri diyafram kuvvet yolunu görünür biçimde değiştirebilir",
      content: phase3Lines(
        "4.5.6.1 döşemelerin çeşitli boyutta boşluklar içerebileceğini açıkça kabul eder; buna rağmen düzlem içi yük aktarımının doğru belirlenmesi gerekir. Merdiven, atrium, şaft veya geniş tesisat boşluğu perdeler arasındaki doğrudan kuvvet yolunu kesiyorsa iki boyutlu modelde membran kuvvetleri ve bağlantı bölgeleri izlenmelidir.",
        "",
        "Dar bir döşeme boynunda veya perdeye yaklaşan bölgede yüksek membran kuvveti görülmesi, yalnız yerel mesh pikini değil toplam kuvvet akışını da kontrol etmeyi gerektirir. Ağ yakınsaması, kesit boyunca bileşke kuvvet ve uygulanabilir donatı düzeni birlikte değerlendirilmelidir.",
        "",
        "> [!engineering] Yük yolu paftada okunabilmeli",
        "> Analiz modelinde bulunan aktarma şeridi veya ek bağlantı donatısı, uygulama paftasında başlangıç-bitiş noktası ve kenetlenmesiyle tanımlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Döşemenin deprem eylemsizlik kuvvetlerini hangi kolon/perdelere taşıdığı açık bir yük yolu olarak tanımlanmış mı?",
        "- A2/A3 düzensizliği, kirişsiz döşeme veya önemli düzlem içi şekil değiştirme varsa 4.5.6.2'ye göre iki boyutlu model kullanılmış mı?",
        "- Rijit diyafram kullanılıyorsa 4.5.6.3 koşulları gerçekten sağlanıyor mu?",
        "- Döşemeden her kolon/perdeye aktarılan kuvvet 4.5.6.4'e uygun kat kesmesi farkı ile kontrol edilmiş mi?",
        "- 4.5.6.5'e göre güvenli aktarım hesapla gösterilmiş mi?",
        "- Gereken yerlerde **ek bağlantı donatıları** ve **aktarma elemanları** paftada açıkça gösterilmiş mi?",
        "- Geçiş döşemesi varsa 4.5.7.2 gereği A2/A3 durumundan bağımsız iki boyutlu model kurulmuş mu?",
        "- Bodrum çevre perdelerine aktarılan kuvvetler 4.5.7.3'e göre ayrıca çıkarılmış mı?",
        "- Büyük boşluklar ve dar döşeme şeritleri gerçek diyafram geometrisine işlenmiş mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 4; Madde 4.5.6.1–4.5.6.5 ve 4.5.7.1–4.5.7.3"),
  keywords: ["TBDY 2018", "diyafram", "rijit diyafram", "aktarma elemanı", "ek bağlantı donatısı", "geçiş döşemesi", "4.5.6"],
  tags: ["TBDY 2018", "Betonarme", "Döşeme", "Diyafram", "Yük Aktarımı"],
};