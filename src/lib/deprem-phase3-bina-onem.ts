import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_BINA_ONEM: DepremPhase3Override = {
  slug: "tbdy-bina-onem-katsayisi",
  description: "TBDY 2018 Tablo 3.1'e göre Bina Kullanım Sınıfı BKS ile Bina Önem Katsayısı I'nin nasıl seçildiğini, DTS bağlantısını ve özel I=1 hükümlerini proje kontrolü açısından açıklar.",
  seoTitle: "TBDY 2018 Bina Önem Katsayısı I | BKS ve Tablo 3.1",
  seoDescription: "BKS 1-2-3, I=1.5/1.2/1.0, DTS bağlantısı ve TBDY 2018 Tablo 3.1'e göre bina önem katsayısı kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "bks-i-resmi-tanim",
      title: "BKS kullanım amacını, I ise bu sınıfa bağlı bina önem katsayısını tanımlar",
      content: phase3Lines(
        "TBDY 3.1.1'de **Bina Kullanım Sınıfı (BKS)**, binanın kullanım amacına göre Tablo 3.1'de tanımlanır. 3.1.2'de ise **Bina Önem Katsayısı I** doğrudan bu BKS sınıfına bağlanır.",
        "",
        "Bu seçim yalnız 'hastane daha önemli, konut daha az önemli' biçiminde serbest mühendislik yorumu değildir. Kullanım amacı Tablo 3.1'deki gruba yerleştirilir ve I değeri o satırdan alınır.",
        "",
        "> [!warning] I bir kullanıcı tercihi değildir",
        "> Projede kullanım amacı değişirse BKS, I ve bunlara bağlı DTS/BYS karar zinciri yeniden kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "tablo-3-1",
      title: "Tablo 3.1: BKS 1, BKS 2 ve BKS 3 için I değerleri",
      content: phase3Lines(
        "| BKS | Yönetmelik kapsamındaki tipik kullanım amacı | Bina Önem Katsayısı I |",
        "|---|---|---:|",
        "| BKS = 1 | Deprem sonrası kullanımı gereken binalar; uzun süreli ve yoğun kullanım; değerli eşya; tehlikeli madde içeren yapılar — hastaneler, sağlık ocakları, itfaiye, haberleşme/ulaşım/enerji tesisleri, yönetim ve afet planlama binaları; okullar, yurtlar, kışlalar, cezaevleri; müzeler; toksik/patlayıcı/parlayıcı madde yapıları | 1.5 |",
        "| BKS = 2 | İnsanların kısa süreli ve yoğun bulunduğu binalar — alışveriş merkezleri, spor tesisleri, sinema, tiyatro, konser salonu, ibadethane vb. | 1.2 |",
        "| BKS = 3 | BKS 1 ve BKS 2 tanımlarına girmeyen diğer binalar — konut, işyeri, otel, bina türü endüstri yapıları vb. | 1.0 |",
        "",
        "> [!engineering] Kullanım adını değil işlevi kontrol edin",
        "> Bir yapının ticari adı veya proje paftasındaki kısa mahal adı tek başına sınıf belirlemez. Gerçek kullanım amacı ve deprem sonrası fonksiyonu Tablo 3.1 tanımıyla karşılaştırılmalıdır."
      ),
      subsections: [],
    },
    {
      id: "bks-dts-baglantisi",
      title: "BKS, DD-2 kısa periyot spektral katsayısı SDS ile birlikte DTS'yi belirler",
      content: phase3Lines(
        "TBDY 3.2'de Deprem Tasarım Sınıfı (DTS), DD-2 deprem yer hareketi için kısa periyot tasarım spektral ivme katsayısı `SDS` ve BKS kullanılarak Tablo 3.2'den belirlenir. BKS = 1 olan yapılarda sınıfın `a` ekiyle ayrılması bu nedenle önemlidir.",
        "",
        "| DD-2 için SDS aralığı | BKS = 1 | BKS = 2 veya 3 |",
        "|---|---|---|",
        "| SDS < 0.33 | DTS = 4a | DTS = 4 |",
        "| 0.33 ≤ SDS < 0.50 | DTS = 3a | DTS = 3 |",
        "| 0.50 ≤ SDS < 0.75 | DTS = 2a | DTS = 2 |",
        "| SDS ≥ 0.75 | DTS = 1a | DTS = 1 |",
        "",
        "Bu bağlantı, BKS seçiminin daha sonra taşıyıcı sistemin süneklik düzeyi ve BYS sınırlarına kadar uzanan bir etkisi olduğunu gösterir.",
        "",
        "> [!check] Hesap zinciri",
        "> `kullanım amacı → BKS → I` ve `BKS + DD-2 SDS → DTS` iki ayrı ama birbirine bağlı çıktıdır."
      ),
      subsections: [],
    },
    {
      id: "i-hesap-icindeki-yeri",
      title: "I, deprem hesabında R ile birlikte R/I ilişkisinin parçasıdır",
      content: phase3Lines(
        "Bina Önem Katsayısı yalnız rapor kapağında kalan bir sınıflandırma değildir. Bölüm 4'te Deprem Yükü Azaltma Katsayısı tanımında `R/I` oranı kullanılır; dolayısıyla yanlış I seçimi doğrudan azaltılmış tasarım deprem etkilerine taşınabilir.",
        "",
        "Ayrıca bazı performans hedeflerinde yönetmelik özel I değerleri tanımlar. Bu nedenle standart Tablo 3.1 değerini her özel bölümde otomatik kullanmak yerine ilgili bölümün açık hükmü kontrol edilmelidir.",
        "",
        "> [!warning] 'Konut olduğu için I=1' ezberi",
        "> Konut için BKS=3 ve I=1.0 tipik olarak doğrudur; ancak proje kullanımının gerçekten Tablo 3.1 BKS=3 tanımında kaldığı doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "ozel-i-bir-hukumleri",
      title: "Özel bölümlerde I = 1 alınan durumları genel BKS kuralıyla karıştırmayın",
      content: phase3Lines(
        "TBDY'nin bazı özel değerlendirme/tasarım bölümleri Tablo 3.1'deki standart I değerinden farklı açık hükümler içerir. Örneğin Bölüm 14'te deprem yalıtımlı binaların tasarımında Bina Önem Katsayısı `I = 1`; Bölüm 15'te mevcut binaların deprem performansının değerlendirilmesinde de `I = 1.0` alınır.",
        "",
        "Bu özel hükümler, yeni bir normal binanın BKS sınıfını ortadan kaldırmaz. Yalnız ilgili bölümün kendi hesap çerçevesindeki uygulamadır.",
        "",
        "> [!engineering] Kural önceliği",
        "> Hesap adımında önce hangi TBDY bölümünün uygulandığını belirleyin; sonra o bölümün özel I hükmü olup olmadığını kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık hatalar: BKS ile DTS'yi, BKS ile I'yi birbirinden koparmak",
      content: phase3Lines(
        "BKS yalnız kategori etiketi, I ise ayrı bir kullanıcı girdisi gibi ele alındığında tutarsızlık oluşur. Aynı şekilde BKS=1 seçilip DTS'nin `a` sınıfı kontrol edilmezse taşıyıcı sistem seçimindeki sonraki kısıtlar da kaçabilir.",
        "",
        "Proje raporunda kullanım amacı, BKS, I, DD-2 SDS ve DTS değerlerini aynı karar tablosunda izlemek bu tür kopmaları görünür kılar.",
        "",
        "> [!warning] SOURCE_VALUE",
        "> BKS ve I, kullanım amacı üzerinden doğrulanan SOURCE_VALUE proje girdileridir; eski projeden kopyalanmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Binanın gerçek kullanım amacı Tablo 3.1 ile karşılaştırıldı mı?",
        "- BKS = 1 için I = 1.5, BKS = 2 için I = 1.2, BKS = 3 için I = 1.0 doğru mu?",
        "- BKS = 1 kapsamındaki deprem sonrası kritik, eğitim/yurt, müze veya tehlikeli madde kullanımları atlanmadı mı?",
        "- DD-2 SDS değeriyle Tablo 3.2 üzerinden DTS belirlendi mi?",
        "- BKS = 1 ise DTS'nin 1a/2a/3a/4a sınıfı doğru mu?",
        "- I değeri Bölüm 4'teki `R/I` hesabına doğru taşındı mı?",
        "- Deprem yalıtımlı veya mevcut bina değerlendirmesi gibi özel bölüm varsa `I = 1` hükmü ayrıca kontrol edildi mi?",
        "- Kullanım değişikliği varsa BKS–I–DTS zinciri yeniden değerlendirildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 3; Madde 3.1–3.2, Tablo 3.1 ve Tablo 3.2; ayrıca özel I hükümleri için Bölüm 14 ve 15"),
  keywords: ["Bina Önem Katsayısı", "BKS", "I katsayısı", "Tablo 3.1", "DTS", "TBDY 2018"],
  tags: ["TBDY 2018", "BKS", "Bina Önem Katsayısı", "DTS"],
};
