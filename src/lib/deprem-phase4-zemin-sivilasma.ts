import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_ZEMIN_SIVILASMA: DepremPhase4Override = {
  slug: "zemin-sivlasma-riski-degerlendirmesi",
  description: "TBDY 2018 Bölüm 16.6 ve EK 16B'ye göre sıvılaşma değerlendirmesinin hangi zemin ve deprem sınıflarında gerektiğini, SPT/CPT araştırma kapsamını, N1,60 eşiklerini, güvenlik koşulunu ve sıvılaşma sonrası deformasyonların yapı tasarımına etkisini açıklar.",
  seoTitle: "Zemin Sıvılaşma Riski Değerlendirmesi | TBDY 16.6 ve EK 16B",
  seoDescription: "TBDY sıvılaşma hesabı: DTS, ZD-ZF, 20 m derinlik, PI<12, N1,60<30, SPT/CPT, Rτ/τdeprem≥1.10 ve sıvılaşma sonrası oturma/yanal yayılma.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "16-6-kapsam",
      title: "Sıvılaşma değerlendirmesine zemin sınıfı, DTS ve tabaka niteliğini birlikte kontrol ederek başlayın",
      content: phase4Lines(
        "TBDY **16.6.1**, Deprem Tasarım Sınıfı **DTS=1, DTS=1a, DTS=2 ve DTS=2a** olan binalarda; yerel zemin sınıfı ZD, ZE veya ZF grubuna giren ve sürekli tabaka ya da kalın mercek halinde potansiyel sıvılaşabilir kumlu zemin içeren sahalarda sıvılaşma potansiyelinin arazi ve laboratuvar verilerine dayalı uygun yöntemlerle incelenmesini zorunlu tutar.",
        "",
        "Bu nedenle yalnız 'yeraltı suyu var' veya yalnız 'zemin ZD' bilgisi sıvılaşma sonucu üretmez. Deprem talebi, dane yapısı, plastisite, sıkılık ve yeraltı suyu birlikte değerlendirilir.",
        "",
        "Sıvılaşma kontrolünü zemin raporunun sonunda tek satırlık 'risk yoktur' ifadesi olarak değil, hangi tabakaların tarandığını ve hangi yöntemle elendiğini gösteren izlenebilir bir karar zinciri olarak kurun."
      ),
      subsections: [],
    },
    {
      id: "potansiyel-zemin-tanimi",
      title: "16.6.2–16.6.4 potansiyel zeminleri su seviyesi, derinlik ve dane/plastisite özellikleriyle tanımlar",
      content: phase4Lines(
        "TBDY **16.6.2**, sıvılaşmayı yeraltı su seviyesinin altında ve yüzeyden **20 m derinliğe kadar** bulunan kohezyonsuz veya düşük kohezyonlu (**PI < %12**) zeminlerde deprem sarsıntısıyla boşluk suyu basıncının artmasına bağlı kayma mukavemeti ve rijitlik kaybı olarak tanımlar.",
        "",
        "16.6.4'te potansiyel olarak sıvılaşabilir zeminler; yeraltı su tablası altında yer alan **kum, çakıllı kum, siltli killi kum, plastik olmayan silt ve silt-kum karışımları** olarak tarif edilir.",
        "",
        "Bu tanım, her ince daneli zeminin güvenli veya her kumlu zeminin sıvılaşabilir olduğu anlamına gelmez. Plastisite, ince dane oranı, sıkılık ve deprem talebi sonraki adımlarda ayrıca sınanır."
      ),
      subsections: [],
    },
    {
      id: "arastirma-programi",
      title: "Sıvılaşma kararı yalnız SPT sayısına dayanmaz; laboratuvar verisi zorunlu karar girdisidir",
      content: phase4Lines(
        "TBDY **16.6.3**, sıvılaşma değerlendirmesi için yapılacak zemin araştırmasının en az **SPT ve/veya CPT** yanında ilgili tabakalarda dane çapı dağılımı, su muhtevası ve Atterberg limitlerinin belirlenmesini içermesini ister.",
        "",
        "| Girdi | Sıvılaşma kararındaki rolü |",
        "|---|---|",
        "| SPT / CPT | Sıkılık ve çevrimsel direnç değerlendirmesinin saha girdisi |",
        "| Dane çapı dağılımı | Kum–silt ve ince dane yapısının belirlenmesi |",
        "| Su muhtevası / yeraltı suyu | Doygunluk ve efektif gerilme koşullarının değerlendirilmesi |",
        "| Atterberg limitleri | İnce daneli zeminin plastisite davranışının ayrılması |",
        "",
        "Sondaj logu ile laboratuvar numunesini aynı derinlik ve tabaka kodu üzerinden eşleştirin; aksi halde SPT sonucu başka, plastisite sonucu başka tabakayı temsil edebilir."
      ),
      subsections: [],
    },
    {
      id: "n160-esikleri",
      title: "N1,60 < 30 eşiği tetiklenme analizini başlatır; DTS=4 istisnaları ayrıca okunur",
      content: phase4Lines(
        "TBDY **16.6.5**, temel altı zeminleri potansiyel sıvılaşabilir tabakalardan oluşuyorsa ve bu tabakalarda düzeltilmiş SPT vuruş sayısı **N1,60 < 30 darbe/30 cm** ise sıvılaşma tetiklenme değerlendirmesi yapılmasını ister.",
        "",
        "16.6.6, yalnız **DTS=4** için iki özel eleme koşulu tanımlar: kil içeriği %20'den fazla ve plastisite indisi %10'dan yüksek kumlu zeminler; veya ince dane yüzdesi %35'ten fazla ve N1,60 değeri 20 vuruş/30 cm'den yüksek kumlu zeminler. Bu koşullardan en az biri sağlanırsa tetiklenme analizi yapılmayabilir.",
        "",
        "Bu eşikleri bağlamından koparıp bütün DTS sınıflarında genel muafiyet olarak kullanmayın."
      ),
      subsections: [],
    },
    {
      id: "ek16b-guvenlik",
      title: "SPT tabanlı yöntemde EK 16B düzeltmeleri ve 1.10 güvenlik koşulu birlikte uygulanır",
      content: phase4Lines(
        "TBDY **16.6.8**, SPT sonuçlarıyla sıvılaşma değerlendirmesi için yöntemi **EK 16B**'de verir. Ham SPT darbe sayısı; derinlik/efektif gerilme, tij boyu, numune alıcı, sondaj çapı ve enerji oranı gibi düzeltmelerle **N1,60** değerine dönüştürülür; ince dane etkisi ayrıca değerlendirilir.",
        "",
        "16.6.9'daki güvenlik koşulu **Rτ / τdeprem ≥ 1.10** biçimindedir. Burada Rτ sıvılaşma direncini, τdeprem ise depremden oluşan ortalama tekrarlı kayma gerilmesini temsil eder.",
        "",
        "CPT veya kayma dalgası hızına dayalı değerlendirmede yönetmelik, uygulamada genel kabul gören yöntemlerin kullanılmasına izin verir; kullanılan yöntem, sürüm ve tüm düzeltme kabulleri raporda açıkça belirtilmelidir."
      ),
      subsections: [],
    },
    {
      id: "sonrasi-davranis",
      title: "Tetiklenme sonucu tek başına yeterli değildir; sıvılaşma sonrası dayanım, oturma ve yanal yayılma tasarıma taşınmalıdır",
      content: phase4Lines(
        "TBDY **16.6.7**, sıvılaşma tetiklenmesi yanında sıvılaşma sonrası zemin mukavemeti ve rijitlik kaybı ile temel zeminindeki yerdeğiştirmelerin de dikkate alınmasını ister.",
        "",
        "16.6.9'daki güvenlik koşulu sağlanmıyorsa olası **taşıma gücü kaybı, duraylılık bozukluğu, oturma ve yanal yayılma** türü zemin hareketleri değerlendirilmelidir. 16.6.10 ise belirlenen yerdeğiştirmelerin üstyapı ve altyapı davranışına etkisinin incelenmesini ve gerekiyorsa üstyapı/zemin iyileştirmesi yapılmasını ister.",
        "",
        "Bu nedenle sonuç 'FS<1.10' etiketi değildir; temel sistemi ve yapı performansını etkileyen deformasyon senaryosuna dönüştürülmelidir."
      ),
      subsections: [],
    },
    {
      id: "16-5-2-6-modelleme",
      title: "Sıvılaşma potansiyeli varsa 16.5.2.6 sahaya özel zemin analiz yöntemini de sınırlar",
      content: phase4Lines(
        "TBDY **16.5.2.6**, 16.6'ya göre sıvılaşma potansiyeli bulunan zeminlerde eşdeğer doğrusal modelle frekans tanım alanında analiz yapılmasına izin vermez. Bu durumda **zaman tanım alanında doğrusal olmayan analiz** kullanılmalıdır.",
        "",
        "Bu hüküm, sıvılaşma değerlendirmesinin yalnız temel taşıma gücü raporunu değil sahaya özel deprem hareketi üretme yöntemini de etkileyebileceğini gösterir.",
        "",
        "Geoteknik raporda sıvılaşma potansiyeli tanımlanmışsa yapısal modelde kullanılan sahaya özel spektrum/yer hareketi çalışmasının hangi zemin davranış modeliyle üretildiğini de kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] **DTS=1, 1a, 2, 2a** ile ZD/ZE/ZF ve potansiyel tabaka koşullarını birlikte kontrol ettim.",
        "- [ ] Yeraltı suyu altında ve yüzeyden **20 m** içindeki kritik tabakaları ayrı taradım.",
        "- [ ] SPT/CPT sonuçlarını dane dağılımı, su muhtevası ve Atterberg limitleriyle aynı tabaka üzerinde eşleştirdim.",
        "- [ ] Potansiyel tabakalarda **N1,60 < 30** tetikleyici koşulunu kontrol ettim.",
        "- [ ] DTS=4 için 16.6.6 istisnalarını diğer DTS sınıflarına taşımadım.",
        "- [ ] SPT yönteminde EK 16B düzeltmelerini izlenebilir biçimde uyguladım.",
        "- [ ] **Rτ / τdeprem ≥ 1.10** koşulunu ve başarısızlık halinde sıvılaşma sonrası deformasyonları değerlendirdim.",
        "- [ ] Sıvılaşma potansiyeli varsa 16.5.2.6 gereği eşdeğer doğrusal frekans alanı modelini kullanmadım."
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 16.5, 16.6 ve EK 16B"),
  keywords: ["sıvılaşma", "N1,60", "SPT", "CPT", "EK 16B", "Rτ", "yanal yayılma", "TBDY 16.6"],
  tags: ["sıvılaşma", "geoteknik", "SPT", "TBDY Bölüm 16"],
};
