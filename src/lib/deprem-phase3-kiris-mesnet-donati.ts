import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KIRIS_MESNET_DONATI: DepremPhase3Override = {
  slug: "tbdy-betonarme-kiris-mesnet-donati-surekliligi",
  description: "TBDY 2018 Madde 7.4.2–7.4.3'e göre kiriş mesnet boyuna donatısının minimum/maksimum oranlarını, alt-üst donatı ilişkisini, sürekliliği ve kolon/perde içinde kenetlenmesini açıklar.",
  seoTitle: "TBDY Kiriş Mesnet Donatısı ve Süreklilik | 7.4.2–7.4.3",
  seoDescription: "ρ≥0.8fctd/fyd, ϕ12, en az iki sürekli çubuk, %50/%30 alt-üst oranı, %2 üst sınırı, 1/4 süreklilik ve 50ϕ kenetlenme kuralları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "minimum-mesnet-donatisi",
      title: "Denklem (7.8): mesnet çekme donatısı minimum oranı",
      content: phase3Lines(
        "7.4.2.1, kiriş mesnetlerindeki çekme donatısının minimum oranını beton çekme tasarım dayanımı ve donatı çeliği tasarım dayanımı üzerinden sınırlar.",
        "",
        "```formula",
        "@label: TBDY Denklem (7.8) — kiriş mesnet minimum çekme donatısı",
        "ρ ≥ 0.8 f_ctd / f_yd",
        "@symbol: ρ | Kiriş üst veya alt boyuna çekme donatısı oranı | -",
        "@symbol: f_ctd | Betonun tasarım çekme dayanımı | MPa",
        "@symbol: f_yd | Boyuna donatının tasarım akma dayanımı | MPa",
        "```",
        "",
        "> [!warning] Minimum oran, analiz donatısının yerine geçmez",
        "> Eğilme hesabından daha fazla donatı gerekiyorsa belirleyici olan hesap donatısıdır; Denklem (7.8) yalnız alt sınırdır."
      ),
      subsections: [],
    },
    {
      id: "surekli-cubuklar",
      title: "Kiriş boyunca alt ve üstte en az ikişer çubuk sürekli bulunur",
      content: phase3Lines(
        "7.4.2.2'ye göre boyuna donatı çapı **12 mm'den küçük olamaz**. Kirişin alt ve üstünde en az **iki donatı çubuğu**, açıklık boyunca sürekli olarak bulunacaktır.",
        "",
        "Bu hüküm deprem sırasında moment işaretinin değişebilmesi ve donatı kuvvet yolunun kesintisiz kalması açısından temel bir detay koşuludur.",
        "",
        "> [!check] Pafta okuması",
        "> Kiriş açılımında yalnız mesnet üst donatısı değil, alt ve üstte süreklilik sağlayan minimum iki çubuğun kolon çekirdeği/komşu açıklık boyunca nasıl devam ettiği açıkça okunmalıdır."
      ),
      subsections: [],
    },
    {
      id: "alt-ust-orani",
      title: "Mesnet alt donatısı üst donatıya göre %50 veya %30 alt sınırına tabidir",
      content: phase3Lines(
        "7.4.2.3, deprem tasarım sınıfına bağlı olarak mesnet alt donatısını aynı mesnetteki üst donatıya bağlar.",
        "",
        "| Deprem Tasarım Sınıfı | Alt donatı / üst donatı minimumu |",
        "|---|---:|",
        "| DTS 1, 1a, 2, 2a | `≥ %50` |",
        "| Diğer DTS'ler | `≥ %30` |",
        "",
        "Bu oran, aynı mesnetteki boyuna donatı alanları üzerinden değerlendirilir. Amaç, tersinir deprem momentinde pozitif moment kapasitesinin aşırı zayıf kalmasını önlemektir.",
        "",
        "> [!warning] %30'u her binaya uygulamayın",
        "> DTS 1/1a/2/2a için alt sınır %50'dir. Tasarım sınıfı belirlenmeden tek bir oran kullanmak yanlış sonuç verir."
      ),
      subsections: [],
    },
    {
      id: "maksimum-ve-bir-dort-sureklilik",
      title: "Çekme donatısı üst sınırı ve mesnet üst donatısının 1/4 sürekliliği birlikte kontrol edilir",
      content: phase3Lines(
        "7.4.2.4'e göre açıklık ve mesnet çekme donatısı oranı hem TS 500'de verilen maksimum değeri hem de **%2** sınırını aşamaz.",
        "",
        "7.4.3.1(a) ise kirişin iki ucundaki mesnet üst donatılarının büyük olanının en az **1/4'ünün tüm kiriş boyunca sürekli** devam ettirilmesini ister. Geri kalan mesnet üst donatısı, karşılanmamış moment bırakılmayacak biçimde TS 500'e göre düzenlenir.",
        "",
        "> [!engineering] 1/4 bir kesme kuralı değildir",
        "> Bu oran, büyük mesnet üst donatısının tüm açıklık boyunca sürdürülmesi gereken minimum kısmını tanımlar; kalan çubukların nerede kesileceği ayrıca moment ve kenetlenme koşullarına bağlıdır."
      ),
      subsections: [],
    },
    {
      id: "kolon-perde-kenetlenmesi",
      title: "Kiriş donatısı kolon/perde içinde gerçek kenetlenme boyunu sağlamalıdır",
      content: phase3Lines(
        "Kiriş kolonun diğer yüzünde devam etmiyorsa alt ve üst donatı kolonun etriyelerle sarılmış çekirdeğinin karşı yüzüne kadar uzatılır ve etriyelerin içinden 90° bükülür. Yatay + düşey kanca toplamı en az `ℓb`; yatay kısım en az `0.4ℓb`, düşey kısım en az `12ϕ` olmalıdır.",
        "",
        "Perdelerde ve düz kenetlenme için mevcut `a` ölçüsünün hem `ℓb`'den hem `50ϕ`'den büyük olduğu kolonlarda 90° kanca olmadan düz kenetlenmeye izin verilebilir. Kiriş kolonun iki tarafında devam ediyorsa alt donatı, komşu kolon yüzünden itibaren en az `ℓb` ve **50ϕ** kadar uzatılır.",
        "",
        "7.4.3.2 ayrıca sarılma bölgeleri, birleşimler ve açıklık ortasında alt donatının akma ihtimali olan kritik bölgelerde bindirmeli eki yasaklar.",
        "",
        "> [!warning] Kolon yüzünde biten donatı süreklilik değildir",
        "> Çubuk çizgisinin kolon içine girmesi tek başına yeterli değildir; çekirdek içindeki gerçek yatay/düşey uzunlukların `ℓb`, `0.4ℓb`, `12ϕ` ve gerektiğinde `50ϕ` koşullarını sağlaması gerekir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Mesnet çekme donatısı Denklem (7.8) minimum oranını sağlıyor mu?",
        "- Boyuna çubuk çapları en az ϕ12 mi?",
        "- Kiriş alt ve üstünde en az ikişer çubuk tüm açıklık boyunca sürekli mi?",
        "- DTS 1/1a/2/2a için mesnet alt donatısı üst donatının en az %50'si mi?",
        "- Diğer DTS'lerde alt/üst oranı en az %30 mu?",
        "- Açıklık ve mesnet çekme donatısı oranı %2 ve TS 500 maksimumunu aşmıyor mu?",
        "- Büyük mesnet üst donatısının en az 1/4'ü tüm kiriş boyunca sürdürülmüş mü?",
        "- Kiriş kolonun öbür yüzünde bitiyorsa `ℓb`, `0.4ℓb` ve `12ϕ` kanca koşulları sağlanıyor mu?",
        "- İki taraftan devam eden kirişlerde alt donatı en az `ℓb` ve `50ϕ` uzatılmış mı?",
        "- Kritik plastikleşme bölgelerinde bindirmeli ek bırakılmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.4.2–7.4.3, Denklem (7.8) ve Şekil 7.7"),
  keywords: ["TBDY 2018", "kiriş mesnet donatısı", "Denklem 7.8", "ϕ12", "%50", "%30", "%2", "1/4", "50ϕ", "kenetlenme"],
  tags: ["TBDY 2018", "Betonarme", "Kiriş", "Boyuna Donatı", "Kenetlenme"],
};
