import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KUSATILMAMIS_BIRLESIM: DepremPhase3Override = {
  slug: "tbdy-betonarme-kusatilmamis-birlesim",
  description: "TBDY 2018 Madde 7.5.1'e göre yüksek sünek kolon-kiriş birleşimlerinin kuşatılmış veya kuşatılmamış olarak sınıflandırılmasını ve bu sınıfın kesme/etriye tasarımına etkisini açıklar.",
  seoTitle: "TBDY Kuşatılmış ve Kuşatılmamış Birleşim | 7.5.1",
  seoDescription: "Dört taraftan kiriş, 3/4 kiriş genişliği koşulu ve kuşatılmamış birleşimde daha sıkı kesme/enine donatı kurallarının doğru uygulanması.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "siniflandirma",
      title: "7.5.1: Kuşatılmış birleşim için iki koşul birlikte sağlanmalıdır",
      content: phase3Lines(
        "TBDY 7.5.1, süneklik düzeyi yüksek kolon ve kirişlerin oluşturduğu çerçeve sistemlerde kolon-kiriş birleşimlerini **kuşatılmış** ve **kuşatılmamış** olarak iki sınıfa ayırır.",
        "",
        "| Kuşatılmış birleşim koşulu | Gereklilik |",
        "|---|---|",
        "| Kirişlerin birleşime gelişi | Kolona dört taraftan birleşme |",
        "| Her bir kirişin genişliği | Birleştiği kolon genişliğinin en az 3/4'ü |",
        "",
        "Bu iki koşuldan herhangi biri sağlanmıyorsa birleşim **kuşatılmamış birleşim** olarak sınıflandırılır.",
        "",
        "> [!warning] Kiriş derinliği diye ayrı bir 7.5.1 kuşatma eşiği yoktur",
        "> 7.5.1 sınıflandırmasını kiriş yüksekliği/derinliği için uydurma bir oranla genişletmeyin. Bağlayıcı sınıflandırma dört taraf ve kiriş genişliği koşuluna dayanır."
      ),
      subsections: [],
    },
    {
      id: "dort-taraf-mantigi",
      title: "“Dört taraftan kiriş” plan geometrisi üzerinden okunmalıdır",
      content: phase3Lines(
        "Kuşatılmış birleşim tanımı, kolon çekirdeğinin iki asal doğrultuda kirişlerle çevrelenmesini hedefler. Kenar ve köşe kolonlarda geometrik olarak dört taraftan kiriş bulunmaması, birleşimi doğrudan kuşatılmamış sınıfa götürebilir.",
        "",
        "İç kolonda dört kiriş bulunması ise tek başına yeterli değildir; **her bir kirişin genişliği** kendi birleştiği kolon genişliğinin `3/4` sınırını ayrıca sağlamalıdır.",
        "",
        "> [!check] Tek tek kiriş kontrolü",
        "> Dört kirişten üçünün yeterli genişlikte olması birleşimi kuşatılmış yapmaz. Koşul her bir kiriş için sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kusatilmamis-sonuc",
      title: "Kuşatılmamış sınıf bir etiket değil, daha düşük birleşim kesme sınırıdır",
      content: phase3Lines(
        "7.5.2.2'de birleşim kesme dayanımı sınıfa bağlıdır. Kuşatılmış birleşimde üst sınır `Ve ≤ 1.7 bj h √fck` iken, kuşatılmamış birleşimde aynı sınır `Ve ≤ 1.0 bj h √fck` olur.",
        "",
        "Dolayısıyla yanlışlıkla kuşatılmış sınıf seçmek, birleşim çekirdeğinin izin verilen kesme talebini **%70 daha yüksek katsayıyla** kontrol etmek anlamına gelebilir.",
        "",
        "> [!engineering] Sınıfı analizden sonra değiştirmeyin",
        "> Birleşim sınıfı geometriye bağlı bir girdidir; kesme sonucu elverişsiz çıktığı için kuşatılmış kabulüne geçilemez."
      ),
      subsections: [],
    },
    {
      id: "enine-donati-sonucu",
      title: "Birleşim içindeki minimum enine donatı da sınıfa göre değişir",
      content: phase3Lines(
        "TBDY 7.5.2.3, birleşim çekirdeği boyunca kullanılacak minimum enine donatıyı da kuşatılma sınıfına bağlar:",
        "",
        "| Birleşim sınıfı | Alttaki kolon sarılma donatısına göre minimum | Çap | En büyük aralık |",
        "|---|---:|---:|---:|",
        "| Kuşatılmış | %40 | ϕ8 | 150 mm |",
        "| Kuşatılmamış | %60 | ϕ8 | 100 mm |",
        "",
        "Kuşatılmamış birleşim yalnız kesme dayanımı bakımından değil, birleşim çekirdeği enine donatısı bakımından da daha sıkı koşula tabidir."
      ),
      subsections: [],
    },
    {
      id: "model-ve-pafta",
      title: "Model sınıflandırması ile uygulama paftası aynı birleşimi tarif etmelidir",
      content: phase3Lines(
        "Analiz yazılımında birleşim kesme kontrolü otomatik yapılıyorsa programın kuşatılmış/kuşatılmamış sınıfı hangi geometri verisinden ürettiği kontrol edilmelidir. Özellikle kiriş genişliği kolon genişliğinin sınırında ise yuvarlama veya aks tanımı sonucu değiştirebilir.",
        "",
        "Uygulama paftasında da birleşim çekirdeğindeki etriye/çiroz düzeni, sınıflandırmanın gerektirdiği minimum donatıyı açıkça karşılamalıdır.",
        "",
        "> [!warning] “İç kolon = kuşatılmış” genellemesi güvenli değildir",
        "> İç kolon olmak yalnızca dört taraftan kiriş bulunma olasılığını artırır. Kiriş genişliği 3/4 koşulu sağlanmadan kuşatılmış sınıf verilemez."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Birleşim süneklik düzeyi yüksek çerçeve kapsamındaki 7.5 hükümlerine tabi mi?",
        "- Kolona gerçekten dört taraftan kiriş birleşiyor mu?",
        "- Dört kirişin her birinin genişliği ilgili kolon genişliğinin en az 3/4'ü mü?",
        "- Koşullardan biri sağlanmıyorsa birleşim kuşatılmamış olarak işaretlenmiş mi?",
        "- Sınıflandırmada yönetmelikte olmayan bir kiriş derinliği oranı kullanılmamış mı?",
        "- Birleşim kesme üst sınırında kuşatılmış için 1.7, kuşatılmamış için 1.0 katsayısı doğru seçilmiş mi?",
        "- Birleşim içi minimum enine donatı %40/%60 ayrımıyla doğru uygulanmış mı?",
        "- Minimum ϕ8 ve 150/100 mm aralık sınırları paftada sağlanıyor mu?",
        "- Yazılım sınıflandırması ile gerçek geometri ve uygulama detayı birbirini doğruluyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.5.1 ve 7.5.2"),
  keywords: ["TBDY 2018", "kolon kiriş birleşimi", "kuşatılmış birleşim", "kuşatılmamış birleşim", "3/4", "7.5.1"],
  tags: ["TBDY 2018", "Betonarme", "Birleşim", "Kolon-Kiriş", "Detaylandırma"],
};