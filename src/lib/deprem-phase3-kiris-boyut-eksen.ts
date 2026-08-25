import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KIRIS_BOYUT_EKSEN: DepremPhase3Override = {
  slug: "tbdy-betonarme-kiris-boyut-eksen-kacikligi",
  description: "TBDY 2018 Madde 7.4.1'e göre yüksek sünek kirişlerin minimum genişlik/yükseklik koşullarını, derin kiriş gövde donatısını ve kolon-kiriş eksen kaçıklığının model/birleşim kontrollerine etkisini açıklar.",
  seoTitle: "TBDY Kiriş Boyutları ve Eksen Kaçıklığı | 7.4.1",
  seoDescription: "bw≥250 mm, h≥3t ve 300 mm, h≤3.5bw, h>ℓn/4 gövde donatısı, Nd≤0.10Acfck ve eksantrik kiriş-kolon birleşimi kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "enkesit-kosullari",
      title: "7.4.1.1: yüksek sünek çerçeve kirişinin temel boyut kapıları",
      content: phase3Lines(
        "Kolonlarla çerçeve oluşturan veya perdelere kendi düzlemleri içinde bağlanan yüksek sünek kirişlerde 7.4.1.1(a)–(c) enkesit koşulları birlikte sağlanır.",
        "",
        "| Kontrol | SOURCE_VALUE |",
        "|---|---:|",
        "| Kiriş gövde genişliği `bw` | `≥ 250 mm` |",
        "| Kiriş yüksekliği `h` | `≥ 3 × döşeme kalınlığı` |",
        "| Kiriş yüksekliği `h` | `≥ 300 mm` |",
        "| Narinlik/geometri | `h ≤ 3.5 bw` |",
        "| Genişlik üst sınırı | `bw ≤ h + birleşilen kolon/perdenin kirişe dik genişliği` |",
        "",
        "> [!warning] 25/50 kiriş otomatik kabul değildir",
        "> Örneğin 150 mm döşemede `h ≥ 450 mm` koşulu 300 mm mutlak minimumdan daha belirleyicidir. Kiriş boyutu yalnız alışılmış kalıp ölçülerine göre seçilmemelidir."
      ),
      subsections: [],
    },
    {
      id: "derin-kiris-govde-donatisi",
      title: "h > ℓn/4 olduğunda iki yüzde özel boyuna gövde donatısı gerekir",
      content: phase3Lines(
        "Kiriş yüksekliği serbest açıklığın `1/4`'ünden büyükse, kiriş gövdesinin iki yüzüne boyuna gövde donatısı konulur.",
        "",
        "| Gövde donatısı koşulu | SOURCE_VALUE |",
        "|---|---:|",
        "| Toplam gövde donatı alanı | mesnetlerdeki en büyük üst+alt boyuna donatı toplamının `≥ %30`'u |",
        "| Gövde donatısı çapı | `≥ 12 mm` |",
        "| Düşey aralık | `≤ 300 mm` |",
        "| Yatay gövde çirozu — yükseklik boyunca | `≤ 600 mm` |",
        "| Yatay gövde çirozu — kiriş ekseni boyunca | `≤ 400 mm` |",
        "",
        "Gövde donatılarının kenetlenmesinde de 7.4.3.1(b) ve (c) hükümleri uygulanır.",
        "",
        "> [!engineering] Bu bir 'derin kiriş analizi' etiketi değildir",
        "> Buradaki `h > ℓn/4` hükmü, Bölüm 7 içindeki gövde donatısı detay koşuludur; farklı teori veya eleman sınıflarıyla karıştırılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "eksen-kacikligi",
      title: "TBDY 7.4.1 genel bir sayısal 'kiriş-kolon eksen kaçıklığı' limiti vermez",
      content: phase3Lines(
        "Uygulamada kirişin kolon merkezinden kaçık bağlanması sık görülür; ancak 7.4.1 içinde `e ≤ ...` biçiminde bütün betonarme kirişler için geçerli tek bir sayısal eksen kaçıklığı sınırı tanımlanmaz. Bu nedenle böyle bir sınır **uydurulmamalıdır**.",
        "",
        "Gerçek eksantrisite; eleman geometrisine, rijitliğe, kuvvet aktarımına ve kolon-kiriş birleşim bölgesi davranışına yansıtılmalıdır. Modelde kiriş eksenini kolona merkezlenmiş gösterip uygulamada kaçık imal etmek, hesap geometrisi ile gerçek yük yolunu birbirinden koparır.",
        "",
        "> [!warning] 'Yazılım offset'i çözümün kendisi değildir",
        "> Rijit uç/offset tanımı kullanılıyorsa bunun gerçek geometriyi ve birleşim bölgesindeki kuvvet aktarımını temsil edip etmediği kontrol edilmeli; birleşim kesme ve enine donatı koşulları ayrıca değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "birlesim-etkisi",
      title: "Kaçık veya dar kiriş, birleşim sınıfını ve kesme kontrolünü etkileyebilir",
      content: phase3Lines(
        "7.5.1'e göre bir kolon-kiriş birleşiminin **kuşatılmış** sayılabilmesi için kirişlerin kolona dört taraftan birleşmesi ve her kiriş genişliğinin birleştiği kolon genişliğinin `3/4`'ünden az olmaması gerekir. Bu koşulları sağlamayan birleşimler kuşatılmamış kabul edilir.",
        "",
        "7.5.2'de birleşim kesme kuvveti ve dayanım sınırları ayrıca kontrol edilir. Dolayısıyla eksen kaçıklığı veya dar kiriş geometrisi, yalnız plan görünüşündeki estetik bir ofset değildir; birleşimin etkin geometrisi ve sargı koşullarıyla birlikte ele alınmalıdır.",
        "",
        "> [!check] Model-pafta eşleşmesi",
        "> Kiriş aksı, gerçek `bw`, kolon boyutları ve birleşim yönleri analiz modelinde ve betonarme detay paftasında aynı geometriyi tarif etmelidir."
      ),
      subsections: [],
    },
    {
      id: "eksenel-basincli-kiris-ve-istisnalar",
      title: "Kiriş sınıfının eksenel basınç sınırı ve 7.4.1 istisnaları",
      content: phase3Lines(
        "7.4.1.2'ye göre kiriş olarak boyutlandırılıp donatılacak elemanda `Nd/(Ac fck) ≤ 0.10` koşulu zorunludur. Bu sınır aşılırsa eleman 7.3'e göre **kolon** olarak boyutlandırılıp donatılır.",
        "",
        "7.4.1.1(d), (a)–(c) enkesit sınırlamalarının; kolonlara mafsallı bağlanan betonarme kirişler, bağ kirişli perdelerin bağ kirişleri ve kolon-kiriş düğüm noktaları dışında çerçeve kirişine saplanan ikincil kirişler için zorunlu olmadığını belirtir.",
        "",
        "> [!warning] İstisnayı genelleştirmeyin",
        "> Bir kirişin ikincil olması veya farklı detaylanması, taşıyıcı sistemdeki rolü doğrulanmadan 7.4.1 koşullarını otomatik olarak devre dışı bırakmaz."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Yüksek sünek çerçeve kirişinde `bw ≥250 mm` sağlanıyor mu?",
        "- `h ≥3t_döşeme` ve `h ≥300 mm` koşullarının ikisi de sağlanıyor mu?",
        "- `h ≤3.5bw` kontrol edildi mi?",
        "- Kiriş genişliği 7.4.1.1(a)'daki üst sınırı aşıyor mu?",
        "- `h > ℓn/4` ise iki yüzde gerekli %30 gövde donatısı ve çirozlar gösterilmiş mi?",
        "- Kirişte `Nd/(Ac fck) ≤0.10` sağlanıyor mu?",
        "- Gerçek kiriş-kolon eksen kaçıklığı analiz modeline doğru aktarılmış mı?",
        "- Sayısal bir eksen kaçıklığı limiti yönetmelikte yoksa proje notunda uydurma limit kullanılmıyor mu?",
        "- Kuşatılmış/kuşatılmamış birleşim için `3/4` kiriş genişliği koşulu ayrıca kontrol edilmiş mi?",
        "- 7.4.1.1(d) istisnası gerçekten ilgili eleman türüne uygulanabilir mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.4.1 ve 7.5.1–7.5.2"),
  keywords: ["TBDY 2018", "kiriş boyutu", "250 mm", "3.5 bw", "eksen kaçıklığı", "kolon kiriş birleşimi", "kuşatılmış birleşim", "7.4.1"],
  tags: ["TBDY 2018", "Betonarme", "Kiriş", "Geometri", "Kolon-Kiriş Birleşimi"],
};
