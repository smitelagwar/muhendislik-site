import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_BETONARME_PERDE_TASARIMI: DepremPhase3Override = {
  slug: "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari",
  description: "TBDY 2018 Bölüm 7.6'ya göre süneklik düzeyi yüksek betonarme perdelerde enkesit, kritik yükseklik, uç bölgeleri, gövde/uç donatısı ve moment-kesme tasarımını tek kontrol zincirinde açıklar.",
  seoTitle: "TBDY 2018 Betonarme Perde Tasarımı | Bölüm 7.6 Kontrol Akışı",
  seoDescription: "TBDY 7.6 betonarme perde tasarımı: ℓw/bw, eksenel yük, Hcr, uç bölgeleri, gövde donatısı, moment ve kesme zarfı ile proje kontrol listesi.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "perde-tasarim-zinciri",
      title: "Perde tasarımı yalnız ℓw/bw oranını sağlamak değildir",
      content: phase3Lines(
        "TBDY 7.6, süneklik düzeyi yüksek betonarme perdelerin tasarımını birbirine bağlı bir kontrol zinciri olarak kurar: önce elemanın perde geometrisi ve eksenel basınç sınırı, ardından kritik perde yüksekliği ve uç bölgeleri, gövde/uç donatısı, eğilme kapasitesi ve son olarak kapasite tasarımına bağlı kesme güvenliği kontrol edilir.",
        "",
        "Bir elemanı analiz programında 'perde' etiketiyle tanımlamak tek başına Bölüm 7.6'yı sağlamaz. Kesit boyutları, plandaki yanal tutulma, `Hw/ℓw` oranı, uç bölgesi gereksinimi ve tasarım kuvvetlerinin yönetmelik zarfına dönüştürülmesi birlikte doğrulanmalıdır.",
        "",
        "> [!warning] Ön boyut ile nihai tasarımı ayırın",
        "> Perde uzunluğunu yalnız taban kesmesinden pay alacak şekilde seçmek yeterli değildir. Kesit, eksenel yük, donatı yoğunluğu, uç bölgesi ve kesme talepleri birlikte sağlanmadıkça geometri nihai değildir."
      ),
      subsections: [],
    },
    {
      id: "enkesit-kosullari",
      title: "7.6.1: perde geometrisi ve eksenel basınç sınırı birlikte kontrol edilir",
      content: phase3Lines(
        "7.6.1.1'e göre boşluklar çıkarıldıktan sonra kalan net perde alanı `Ac ≥ Ndm / (0.35 fck)` koşulunu sağlamalıdır. `Ndm`, hareketli yük azaltma katsayıları da dikkate alınarak `G + Q + E` ortak etkisinden elde edilen en büyük eksenel basınç kuvvetidir. Bağ kirişli perdelerde Ac ve Ndm hesabında boşluklu perde kesitinin tümü gözönüne alınır.",
        "",
        "7.6.1.2'de perde geometrik olarak `ℓw/bw ≥ 6` olan düşey taşıyıcı eleman şeklinde tanımlanır. Özel 7.6.1.3 durumu dışında gövde kalınlığı kat yüksekliğinin `1/16`'sından ve **250 mm**'den küçük olamaz; yanal tutulmamış boy için ayrıca `1/30` sınırı vardır. Her iki uçtan yanal tutulu perde kolunda kat yüksekliğinin `1/20`'si ve 250 mm sınırı uygulanır.",
        "",
        "| Kontrol | Genel sınır | Not |",
        "|---|---|---|",
        "| Perde tanımı | `ℓw/bw ≥ 6` | Yazılım etiketi değil gerçek kesit geometrisi |",
        "| Net kesit alanı | `Ac ≥ Ndm/(0.35 fck)` | 7.6.1.1 eksenel basınç kontrolü |",
        "| Genel gövde kalınlığı | `≥ hk/16` ve `≥ 250 mm` | 7.6.1.2(a) |",
        "| Yanal tutulmamış boy | `bw ≥ L/30` | 7.6.1.2(b) |",
        "| İki uçtan tutulu perde kolu | `≥ hk/20` ve `≥ 250 mm` | 7.6.1.2(c) |",
        "| Denklem (7.14) özel sistemi | `≥ hk,max/20` ve `≥ 200 mm` | Yalnız 7.6.1.3'ün iki koşulu birlikte sağlanırsa |",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> `ℓw`, `bw`, kat yüksekliği, yanal tutulmamış boy, `Ndm`, `fck` ve taşıyıcı sistem sınıfı perde enkesit kararının SOURCE_VALUE girdileridir."
      ),
      subsections: [],
    },
    {
      id: "kritik-yukseklik-uc-bolgeleri",
      title: "7.6.2: Hw/ℓw > 2.0 ise uç bölgeleri ve kritik perde yüksekliği devreye girer",
      content: phase3Lines(
        "7.6.2.1, `Hw/ℓw > 2.0` olan perdelerin plandaki her iki ucunda perde uç bölgeleri oluşturulmasını ister. Kritik perde yüksekliği `Hcr`, temel üstünden veya perde uzunluğunun %20'den fazla küçüldüğü seviyeden itibaren 7.6.2.2 ve Denklem (7.15) ile belirlenir.",
        "",
        "```formula",
        "@label: TBDY Denklem (7.15) — kritik perde yüksekliği",
        "max(ℓw, Hw / 6) <= Hcr <= 2ℓw",
        "@symbol: Hcr | kritik perde yüksekliği | m",
        "@symbol: ℓw | perdenin plandaki toplam uzunluğu | m",
        "@symbol: Hw | temel üstünden veya tanımlanan kesit değişim seviyesinden ölçülen perde yüksekliği | m",
        "```",
        "",
        "Dikdörtgen perdelerde kritik yükseklik boyunca her uç bölgesinin plandaki uzunluğu en az `0.20ℓw` ve `2bw`; kritik yüksekliğin üstünde en az `0.10ℓw` ve `bw` olmalıdır. T, L veya U biçimli birleşik uçlarda uç bölgesi perde gövdesine doğru en az perde kalınlığı kadar ve **300 mm**'den az olmayacak şekilde uzatılır.",
        "",
        "Bodrum çevre perdeleri çok rijit ve bodrum döşemeleri rijit diyafram ise `Hw` ve `Hcr` referans seviyesi 7.6.2.2'deki özel tanıma göre zemin kat döşemesinden yukarı doğru ele alınır; kritik bölge aşağıya da en az ilk bodrum kat yüksekliği kadar uzatılır."
      ),
      subsections: [],
    },
    {
      id: "govde-ve-uc-donatisi",
      title: "7.6.3 ve 7.6.5: gövde donatısı ile uç bölgesi donatısı farklı görevler taşır",
      content: phase3Lines(
        "7.6.3.1'e göre perde gövdesinin iki yüzündeki toplam boyuna ve enine donatı oranlarının her biri en az **0.0025** olmalı; boyuna ve enine donatı aralığı **250 mm**'yi aşmamalıdır. Denklem (7.14)'ün özel koşullarının sağlandığı yapılarda oran 0.002'ye, aralık ise en fazla 300 mm'ye göre düzenlenebilir.",
        "",
        "Kritik perde yüksekliği dışında her metrekare perde yüzünde en az 4 özel deprem çirozu; kritik yükseklik boyunca uç bölgeleri dışında kalan gövdede en az 10 özel deprem çirozu öngörülür.",
        "",
        "| Bölge | Boyuna donatı için ana alt sınır | Detay notu |",
        "|---|---:|---|",
        "| Perde gövdesi | `ρ ≥ 0.0025` | Her iki yüz toplamı, yatay ve düşey ayrı |",
        "| Uç bölgesi — kritik yükseklik | Brüt perde kesitine göre `≥ 0.002` | Her uçta minimum **4ϕ14** |",
        "| Uç bölgesi — kritik yükseklik üstü | `≥ 0.001` | Uç bölgesi sürekliliği korunur |",
        "| Uç bölgesi maksimum boyuna oran | `0.03` | Bindirme bölgesinde `0.06` |",
        "",
        "Uç bölgesi donatısını yalnız toplam perde donatısına eklenen bir yüzde gibi düşünmeyin. Amaç basınç bölgesini sararak sünek eğilme davranışını desteklemektir; enine donatı, çiroz ve boyuna çubukların yerleşimi birlikte detaylandırılır."
      ),
      subsections: [],
    },
    {
      id: "moment-ve-kesme-zarfi",
      title: "7.6.6: analiz çıktısı doğrudan perde tasarım zarfı değildir",
      content: phase3Lines(
        "`Hw/ℓw > 2.0` olan perdelerde 7.6.6.1, tasarım eğilme momentinin kritik perde yüksekliği boyunca taban momentine eşit alınmasını ve bunun üstünde yönetmelikte tanımlanan doğrusal zarfın kullanılmasını ister. Bu nedenle programın ham kat momentleri doğrudan donatı hesabına taşınmamalıdır.",
        "",
        "7.6.6.2, perde tabanındaki eğilme kapasitesinin üst katlardaki mekanizma ile uyumunu kapasite tasarımı mantığında sınırlar; koşul sağlanmıyorsa perde boyutu ve/veya donatı artırılarak analiz tekrarlanır.",
        "",
        "Kesme tasarımında **Denklem (7.16)** ile depremden oluşan kesme kuvveti kapasite ve dinamik büyütme etkileriyle tasarım zarfına dönüştürülür. Perde tasarımının önemli noktası, eğilmede sünek mekanizma hedeflerken kesmede gevrek göçmenin önlenmesidir."
      ),
      subsections: [],
    },
    {
      id: "kesme-dayanimi-derzler",
      title: "7.6.7: kesme dayanımı ve yapım derzleri ayrı güvenlik kapılarıdır",
      content: phase3Lines(
        "Perde kesme dayanımı 7.6.7'deki bağıntılarla hesaplanır ve tasarım kesmesi `Ve`, yönetmeliğin **Denklem (7.18)** sınırlarını sağlamalıdır. Yalnız donatı miktarını artırmak, kesit üst sınırı veya beton basınç sınırı aşılmışsa çözüm değildir; perde geometrisinin revizyonu gerekebilir.",
        "",
        "Perde boyunca bırakılan yatay yapım derzlerinde kesme sürtünmesi ve aktarım güvenliği ayrıca kontrol edilir. Beton döküm etapları statik projedeki kesme aktarım varsayımını değiştirebileceği için derz yeri ve yüzey hazırlığı uygulama detayında açık olmalıdır.",
        "",
        "Bağ kirişli perdeler, boşluklar ve birleşik T/L/U kesitlerde de yalnız tek bir kabuk gerilmesine bakmak yerine perde parçalarının, bağ kirişlerinin ve bileşik kesitin taşıyıcı sistem içindeki yük yolu birlikte okunmalıdır."
      ),
      subsections: [],
    },
    {
      id: "ofis-kontrol-akisi",
      title: "Ofis kontrol akışı: geometriden uygulama paftasına",
      content: phase3Lines(
        "1. Perdenin net alanını, `ℓw/bw` oranını, kalınlığını ve yanal tutulmamış boyunu 7.6.1'e göre kontrol edin.",
        "2. `Ndm/(0.35 fck)` eksenel basınç alanı koşulunu en elverişsiz G+Q+E ortak etkisiyle doğrulayın.",
        "3. `Hw/ℓw` oranını belirleyin; >2.0 ise Denklem (7.15) ile `Hcr` ve uç bölgelerini oluşturun.",
        "4. Gövde ve uç bölgesi boyuna/enine donatılarını 7.6.3–7.6.5'e göre ayrı kontrol edin; çiroz yoğunluğunu paftaya aktarın.",
        "5. Ham analiz momentlerini 7.6.6 tasarım zarfına, kesme taleplerini Denklem (7.16) kapasite zarfına dönüştürün.",
        "6. Kesme dayanımı ve Denklem (7.18) üst sınırlarını; varsa yatay yapım derzlerini ayrıca doğrulayın.",
        "7. Hesapta kullanılan uç bölgesi boyları, kritik yükseklik, donatı yoğunluğu ve bindirme bölgelerini uygulama paftalarında ölçülendirerek gösterin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- 7.6.1.1 eksenel alan koşulu `Ac ≥ Ndm/(0.35 fck)` sağlanıyor mu?",
        "- Perde tanımı için `ℓw/bw ≥ 6` ve kalınlık sınırları sağlanıyor mu?",
        "- Denklem (7.14) özel inceltme koşulu kullanılacaksa iki koşul da gerçekten sağlanıyor mu?",
        "- `Hw/ℓw > 2.0` perdelerde uç bölgeleri oluşturuldu mu?",
        "- Denklem (7.15) ile kritik perde yüksekliği doğru referans seviyesinden belirlendi mi?",
        "- Kritik yükseklikte uç bölgesi boyu en az `0.20ℓw` ve `2bw` mı?",
        "- Gövde donatısı oranı 0.0025 ve aralık 250 mm sınırlarıyla kontrol edildi mi?",
        "- Uç bölgelerinde minimum 4ϕ14, boyuna oran `0.03` ve bindirme bölgesinde `0.06` sınırları sağlanıyor mu?",
        "- Perde momentleri 7.6.6 tasarım zarfına dönüştürüldü mü?",
        "- Denklem (7.16) ile tasarım kesmesi ve Denklem (7.18) kesme üst sınırı kontrol edildi mi?",
        "- Hesapta kullanılan kritik bölge ve donatı düzeni uygulama paftasında aynı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7.6; Denklem (7.14)–(7.19) ve Şekil 7.11–7.12"),
  keywords: ["betonarme perde", "TBDY 7.6", "kritik perde yüksekliği", "uç bölgesi", "perde donatısı", "kesme zarfı"],
  tags: ["TBDY 2018", "Betonarme Perde", "Bölüm 7.6", "Kapasite Tasarımı"],
};
