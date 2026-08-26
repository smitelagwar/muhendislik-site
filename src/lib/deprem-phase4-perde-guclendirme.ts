import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_PERDE_GUCLENDIRME: DepremPhase4Override = {
  slug: "guclendirme-betonarme-perde-eklenmesi",
  description: "TBDY 15.9 ve 15.10.5 kapsamında mevcut betonarme binaya perde eklenmesini; sistem güçlendirmesi, eski-yeni beton arayüzü, ankraj, uç bölgesi, döşeme yük aktarımı ve temel sürekliliği üzerinden ele alır.",
  seoTitle: "Mevcut Binaya Betonarme Perde Eklenmesi | TBDY 15.10.5",
  seoDescription: "TBDY 15.10.5'e göre betonarme perde ekleme, ankraj sınırları, uç bölgesi, mevcut çerçeveyle birlikte çalışma, temel ve yük aktarımı için mühendislik kontrol rehberi.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "sistem-guclendirmesi",
      title: "Perde eklemek eleman onarımı değil, taşıyıcı sistem müdahalesidir",
      content: phase4Lines(
        "TBDY 15.9.3, güçlendirmeyi **eleman güçlendirmesi** ve **sistem güçlendirmesi** olarak ayırır. Mevcut binaya yeni betonarme perde eklenmesi, yatay rijitlik ve dayanımı artırırken iç kuvvet dağılımını da değiştirdiği için sistem düzeyinde ele alınmalıdır.",
        "",
        "Bu nedenle tasarım kararı yalnız 'hangi aksa perde sığar?' sorusuyla verilemez. Perdenin plandaki konumu, iki ana doğrultudaki rijitlik dağılımı, burulma davranışı, diyafram kuvvetleri, mevcut kolon-kiriş talepleri ve temel reaksiyonları güçlendirme öncesi/sonrası karşılaştırılmalıdır.",
        "",
        "TBDY 15.9.1'e göre güçlendirilmiş bina ve elemanların deprem güvenliği mevcut binalar için Bölüm 15'te verilen değerlendirme esaslarıyla belirlenir; yeni eklenecek elemanların tasarımında ise 15.9.2 uyarınca ilgili özel kurallarla birlikte Bölüm 7 ve yürürlükteki diğer standartlar dikkate alınır."
      ),
      subsections: [],
    },
    {
      id: "perde-yerlesimi-sureklilik",
      title: "15.10.5 iki yerleşim tanımlar; her ikisinde de süreklilik esastır",
      content: phase4Lines(
        "TBDY 15.10.5, yanal rijitliği ve dayanımı yetersiz betonarme sistemlerin yerinde dökme betonarme perdelerle güçlendirilebileceğini; perdenin **mevcut çerçeve düzlemi içinde** veya **çerçeve düzlemine bitişik** düzenlenebileceğini belirtir.",
        "",
        "| Yerleşim | Yönetmelik mantığı | Proje açısından kritik sonuç |",
        "|---|---|---|",
        "| Çerçeve düzlemi içinde — 15.10.5.1 | Perde çerçeve ekseni içinde ve temelden üst seviyesine kadar sürekli | Mevcut kolon-kirişlerle arayüz kayması, uç bölgesi ve temel birlikte çözülür |",
        "| Çerçeve düzlemine bitişik — 15.10.5.2 | Perde dış çerçeve ekseni dışında, çerçeveye bitişik ve yine temelden üst seviyesine kadar sürekli | Dışmerkezli arayüz kuvvetleri ve ankrajların birlikte çalışma koşulu daha belirgin hale gelir |",
        "",
        "Katlar arasında kesilen, temele bağlanmayan veya yalnız birkaç katta uygulanan bir 'perde parçası', 15.10.5'in tarif ettiği sürekli sistem müdahalesinin yerine geçmez. Mimari açıklıklar, tesisat boşlukları ve uygulama etapları bu sürekliliği bozmayacak biçimde koordine edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "arayuz-ankraj",
      title: "Eski-yeni beton arayüzü ankraj adedinden önce kayma aktarımı problemidir",
      content: phase4Lines(
        "15.10.5.1'e göre eklenen perde, içinde bulunduğu çerçeveye ankraj çubuklarıyla bağlanarak birlikte çalıştırılır. Arayüzde deprem etkisiyle oluşan kayma gerilmelerinin dağılımı mekanik prensiplere göre hesaplanır ve ankraj tasarımında **TS 500'deki sürtünme kesmesi esasları** kullanılır.",
        "",
        "Yönetmeliğin aynı maddede verdiği alt/üst geometrik sınırlar şunlardır:",
        "",
        "- en küçük ankraj çubuğu çapı **16 mm**;",
        "- en az ankraj derinliği çubuk çapının **10 katı**;",
        "- en geniş ankraj çubuğu aralığı **400 mm**.",
        "",
        "Bu üç sayı otomatik bir ankraj reçetesi değildir. Tasarım, hesaplanan arayüz kaymasını güvenle aktaracak dayanımı sağlamalı; mevcut betonun gerçek dayanımı, donatıya denk gelme riski, kenar mesafesi, delme/temizleme yöntemi ve uygulama toleransı ayrıca kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "uc-bolgesi",
      title: "Perde uç bölgesi mevcut kolona bırakılacaksa kolonun yeterliliği ayrıca kanıtlanmalıdır",
      content: phase4Lines(
        "TBDY 15.10.5.1 ve 15.10.5.3, perde ucunda mevcut kolon yoksa **7.6.5'e göre perde uç bölgesi** oluşturulmasını ister. Mevcut kolon varsa bu kolondan uç bölgesi olarak yararlanılabilir; gerekli durumda kolon 15.10.2'ye göre büyütülebilir veya mevcut kolona bitişik perde içinde yeni bir kolon düzenlenebilir.",
        "",
        "Her iki durumda da uç bölgesine eklenecek düşey donatıların katlar arasında sürekliliği sağlanır. Bu hüküm, yalnız kesitte yeterli donatı alanı çizmenin yetmediğini gösterir: donatının döşeme-kiriş bölgelerinden geçişi, temel ankrajı ve üst kat devamı uygulama paftasında çözümlenmelidir.",
        "",
        "Mevcut kolonun uç bölgesi olarak kullanılması, kolonun otomatik olarak yeterli olduğu anlamına gelmez. Güçlendirilmiş sistemden gelen yeni eksenel kuvvet, moment ve kesme talepleriyle kesit yeniden değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "diyafram-yuk-yolu",
      title: "Yeni perdeye ulaşmayan kat kuvveti, modelde var görünen kapasiteyi sahada kullanamaz",
      content: phase4Lines(
        "Perde eklendiğinde kat deprem kuvvetlerinin önemli bir bölümü daha rijit olan yeni elemana yönelir. Bu kuvvetin döşemeden perdeye nasıl aktarıldığı açık bir **yük yolu** olarak kurulmalıdır.",
        "",
        "Mühendislik modelinde şu zincir izlenmelidir: diyafram içi kesme ve eksenel kuvvetler → toplayıcı/başlık bölgeleri → mevcut çerçeve ile yeni perde arayüzü → perde gövdesi/uç bölgeleri → perde temeli → zemin. Büyük döşeme boşluğu, zayıf şap bandı, kısa bağlantı boyu veya kesintili kiriş bu zincirin herhangi bir halkasını sınırlayabilir.",
        "",
        "Rijit diyafram kabulü kullanılıyorsa kuvvetin yazılımda otomatik dağıtılması, gerçek döşeme ve bağlantı detayının yeterliliğini kanıtlamaz. Gerekli diyafram kuvvetleri ve yerel aktarım bölgeleri ayrıca tasarlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "temel-aktarimi",
      title: "15.10.5 perde temelini 16.7 ve 16.8 ile doğrudan bağlar",
      content: phase4Lines(
        "TBDY 15.10.5.1 ve 15.10.5.3, eklenen perdenin altına **16.7 ve 16.8 esaslarına göre temel** yapılmasını ve perde tabanındaki iç kuvvetlerin temel zeminine güvenle aktarılmasını zorunlu kılar.",
        "",
        "Perde temelinde dışmerkezliği azaltmak amacıyla temel komşu kolonları içine alacak şekilde genişletilebilir; bu durumda mevcut kolonların eksenel basınç kuvvetlerinden yararlanılabilir. Ancak yeni temel parçası ile mevcut temel sisteminin **birlikte çalışması için gerekli önlemler** ayrıca tasarlanmalıdır.",
        "",
        "Bu nedenle perde yerleşimi kararı ile temel çözümü ayrı disiplinler gibi ilerletilemez. Üstyapı modelinde rijitliği artıran her perde, tabanda yeni moment-kesme-eksenel kuvvet bileşkesi üretir; temel geometrisi, zemin taşıma gücü, kayma ve oturma kontrolleri bu yeni reaksiyonlarla yeniden yapılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "modelleme-karsilastirma",
      title: "Güçlendirme öncesi ve sonrası model aynı kontrol setiyle karşılaştırılmalıdır",
      content: phase4Lines(
        "Perde ekleme alternatiflerini karşılaştırırken tek ölçüt taban kesme kuvvetinin yeni perdeye ne kadar geçtiği değildir. Aşağıdaki sonuçlar en az iki model arasında aynı deprem tanımıyla karşılaştırılmalıdır:",
        "",
        "- doğal titreşim periyotları ve mod şekilleri;",
        "- kat ötelenmeleri ve burulma eğilimi;",
        "- mevcut kolon/kirişlerin kesme ve moment talepleri;",
        "- yeni perde taban kuvvetleri;",
        "- diyafram ve toplayıcı kuvvetleri;",
        "- temel düşey/yatay reaksiyonları ve dışmerkezlik.",
        "",
        "Bir bölgede talebin azalması başka bir bölgede talep artışı yaratabilir. Özellikle planda tek tarafa yoğun perde eklemek rijitlik merkezini kaydırarak burulmayı büyütebilir; bu nedenle 'daha fazla perde = her yerde daha güvenli' kabulü yapılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "hatalar",
      title: "Sık yapılan hatalar ve teknik sonuçları",
      content: phase4Lines(
        "| Hata | Neden yanlış | Teknik sonuç | Kontrol |",
        "|---|---|---|---|",
        "| Perdeyi yalnız üstyapıda modellemek | Temel ve zemin yeni kuvvet yolunun parçasıdır | Taban momenti/kesmesi güvenli aktarılamaz | 15.10.5 + 16.7/16.8 temel çözümünü birlikte incele |",
        "| 16 mm–10φ–400 mm sınırlarını doğrudan 'yeterli ankraj' saymak | Bunlar arayüz hesabının yerine geçmez | Kayma aktarımı yetersiz kalabilir | Arayüz kuvvetinden sürtünme kesmesi/ankraj dayanımını hesapla |",
        "| Perdeyi planda tek tarafa eklemek | Rijitlik merkezi değişir | Burulma ve bazı mevcut eleman talepleri artabilir | Önce/sonra modal ve kat bazlı sonuçları karşılaştır |",
        "| Uç bölgesi donatısını katlarda kesmek | 15.10.5 düşey süreklilik ister | Uç bölgesinde kuvvet aktarımı kesilir | Temelden üst seviyeye donatı güzergâhını paftada izle |"
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Müdahalenin 15.9.3 kapsamında sistem güçlendirmesi olduğu hesap ve paftalarda açık mı?",
        "- Perde konumu iki ana doğrultudaki rijitlik ve burulma davranışı birlikte değerlendirilerek mi seçildi?",
        "- Perde temelden üst seviyesine kadar sürekli mi?",
        "- 15.10.5.1 arayüz kayması hesaplandı ve TS 500 sürtünme kesmesi esaslarıyla ankraj tasarlandı mı?",
        "- Ankrajlarda minimum 16 mm çap, minimum 10 katı gömme ve maksimum 400 mm aralık sınırları sağlanırken gerçek talep ayrıca kontrol edildi mi?",
        "- 7.6.5 uç bölgesi koşulu ve mevcut kolonun yeterliliği doğrulandı mı?",
        "- Uç bölgesi düşey donatılarının katlar arası sürekliliği detaylandırıldı mı?",
        "- Diyafram/toplayıcı yük yolu ile arayüz aktarımı açıkça çözüldü mü?",
        "- Perde temeli 16.7 ve 16.8'e göre yeni taban iç kuvvetleriyle tasarlandı mı?",
        "- Yeni perde temeli ile mevcut temel sisteminin birlikte çalışması detay ve hesapla gösterildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.9, 15.10.5 ve 16.7–16.8 — sistem güçlendirmesi, betonarme perde ekleme ve temel aktarımı"),
  keywords: ["betonarme perde ekleme", "15.10.5.1", "16 mm", "10 katı", "400 mm", "sürtünme kesmesi", "perde uç bölgesi", "16.7", "16.8"],
  tags: ["Mevcut Bina", "Güçlendirme", "TBDY Bölüm 15", "Betonarme Perde", "Yük Aktarımı"],
};
