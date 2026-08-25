import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_PERDE_GEOMETRI: DepremPhase3Override = {
  slug: "tbdy-betonarme-perde-kolon-geometri-ayrimi",
  description: "TBDY 2018 Madde 7.6.1'e göre betonarme düşey elemanın perde geometrisini sağlaması için uzun kenar/kalınlık oranını, kesit alanı ve perde kalınlığı sınırlarını birlikte açıklar.",
  seoTitle: "TBDY Perde-Kolon Geometri Ayrımı | 7.6.1 Enkesit Koşulları",
  seoDescription: "ℓw/bw ≥ 6 perde tanımı, Ac ≥ Ndm/(0.35fck), 1/16 ve 250 mm gövde kalınlığı ile 7.6.1.3 özel koşullarının proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "perde-geometri-tanimi",
      title: "7.6.1.2: Perde sınıflandırması plandaki ℓw/bw ≥ 6 geometrisiyle başlar",
      content: phase3Lines(
        "TBDY 7.6.1.2, perdeyi planda **uzun kenarının kalınlığına oranı en az altı olan** düşey taşıyıcı sistem elemanı olarak tanımlar. Bu nedenle analiz yazılımında bir düşey elemanı `wall/perde` nesnesi olarak adlandırmak, tek başına yönetmelik sınıflandırması oluşturmaz.",
        "",
        "| Kontrol | SOURCE_VALUE | Proje kararı |",
        "|---|---:|---|",
        "| Geometrik perde tanımı | ℓw/bw ≥ 6 | Kesit oranını gerçek plan boyutlarıyla doğrula |",
        "| Normal gövde kalınlığı | ≥ kat yüksekliği/16 ve ≥ 250 mm | İki sınırın da sağlandığını kontrol et |",
        "| Yanal doğrultuda tutulmamış perde/perde kolu | ≥ tutulmamış boy/30 | Serbest kenar geometrisini ayrıca kontrol et |",
        "| İki uçtan yanal tutulu perde kolu | ≥ kat yüksekliği/20 ve ≥ 250 mm | Uçlardaki yanal tutulu olma koşulunu doğrula |",
        "",
        "> [!warning] Yazılım etiketi yönetmelik geometrisinin yerine geçmez",
        "> `Perde` nesnesi, kabuk eleman veya pier etiketi bir modelleme tercihidir. TBDY'deki perde/kolon ayrımı için gerçek kesit geometrisi ve ilgili taşıyıcı sistem hükümleri ayrıca sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "net-enkesit-alani",
      title: "7.6.1.1: Perdenin net enkesit alanı eksenel basınç için ayrıca sınanır",
      content: phase3Lines(
        "Bodrum perdeleri dışındaki perdelerde, boşluklar çıkarıldıktan sonra kalan net enkesit alanı için TBDY 7.6.1.1 aşağıdaki koşulu verir:",
        "",
        "`Ac ≥ Ndm / (0.35 fck)`",
        "",
        "`Ac` boşluklar çıkarıldıktan sonraki net perde alanı, `Ndm` yönetmelikte tarif edilen `G + Q + E` ortak etkisi altında elde edilen en büyük eksenel basınç kuvveti, `fck` ise betonun karakteristik basınç dayanımıdır. Bağ kirişli (boşluklu) perdelerde `Ac` ve `Ndm` hesabında boşluklu perde kesitinin tümü, yani perde parçalarının toplamı dikkate alınır.",
        "",
        "> [!engineering] Geometri kontrolü ile eksenel yük kontrolünü ayırın",
        "> `ℓw/bw ≥ 6` koşulunu sağlamak elemanın 7.6.1.1 enkesit alanı kontrolünden geçtiği anlamına gelmez. İki kontrol aynı pafta/model elemanı için ayrı ayrı tamamlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "normal-kalinlik-kosullari",
      title: "Normal durumda 1/16 ve 250 mm birlikte sağlanmalıdır",
      content: phase3Lines(
        "7.6.1.2(a)'ya göre 7.6.1.3'teki özel durum dışında dikdörtgen, U, L ve T gibi perdelerin gövde bölgesindeki perde kalınlığı **kat yüksekliğinin 1/16'sından ve 250 mm'den küçük olamaz**. Buradaki ifade iki ayrı alt sınırdır; yalnız 250 mm seçmek yeterli olmayabilir.",
        "",
        "Dikdörtgen perde veya perde kolu plandaki yanal doğrultuda tutulmuyorsa kalınlık, tutulmamış boyunun `1/30`'undan küçük olamaz. Perde kolu iki ucundan yanal doğrultuda bir perde ile tutuluyorsa kalınlık kat yüksekliğinin `1/20`'sinden ve `250 mm`'den küçük olamaz.",
        "",
        "> [!check] Pafta kontrolü",
        "> U, L ve T kesitlerde her kolun gerçek tutulma durumunu plan üzerinden okuyun; tek bir global perde kalınlığı notu, her kolun 1/30 veya 1/20 kontrolünü kanıtlamaz."
      ),
      subsections: [],
    },
    {
      id: "ozel-kalinlik-istisnasi",
      title: "7.6.1.3'teki 200 mm sınırı koşulsuz bir perde kalınlığı alternatifi değildir",
      content: phase3Lines(
        "Taşıyıcı sistemi perdelerden oluşan binalarda, **Denklem (7.14)** ile verilen iki koşulun da sağlanması halinde 7.6.1.3 özel hükmü kullanılabilir. Bu durumda perde kalınlığı, binadaki en yüksek kat yüksekliğinin `1/20`'sinden ve `200 mm`'den az olamaz; ayrıca 7.6.1.1'deki enkesit koşulu uygulanmaya devam eder.",
        "",
        "| Özel hüküm için birlikte sağlanacak 7.14 kontrolleri | Sınır |",
        "|---|---:|",
        "| İlgili doğrultudaki toplam perde alanı / kat brüt alanı | ΣAg/ΣAp ≥ 0.002 |",
        "| Taban kesmesi / toplam perde alanı ve fctd ilişkisi | Vt/(ΣAg fctd) ≤ 0.5 |",
        "",
        "Denklem (7.14), bodrum çevresinde çok rijit betonarme perdeler bulunan binalarda zemin kat düzeyinde, diğer binalarda temel üst kotu düzeyinde uygulanır.",
        "",
        "> [!warning] 200 mm değerini genelleştirmeyin",
        "> Taşıyıcı sistemin 'perdeli' görünmesi 7.6.1.3 için yeterli değildir. İki 7.14 koşulu birlikte doğrulanmadan 200 mm özel alt sınırına geçilemez."
      ),
      subsections: [],
    },
    {
      id: "modelleme-karari",
      title: "Modelleme kararı: geometri, süreklilik ve sistem sınıfı aynı elemanı tarif etmelidir",
      content: phase3Lines(
        "Perde geometrisi katlar arasında değişiyorsa `ℓw`, `bw`, boşluklar ve perde kolları her katta gerçek geometriyle izlenmelidir. Bir katta 6 oranını sağlayan bir elemanın başka bir katta otomatik olarak perde kabul edilmesi doğru değildir.",
        "",
        "Kabuk/çubuk idealizasyonu, pier isimleri veya rijitlik tanımları yönetmelik geometrisini değiştirmez. Modelde perde olarak kuvvet topladığınız elemanın paftadaki kesiti, katlar arası devamlılığı ve taşıyıcı sistem sınıfındaki rolü birbiriyle tutarlı olmalıdır.",
        "",
        "> [!engineering] Kontrol raporunda iki dili ayırın",
        "> 'Yazılımda perde olarak modellenmiştir' ifadesini, 'TBDY 7.6.1 enkesit koşullarını sağlamaktadır' sonucunun yerine kullanmayın. İkincisi ölçü ve hesapla doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "uygulama-koordinasyonu",
      title: "Mimari boşluk ve tesisat müdahaleleri perde geometrisini sonradan bozabilir",
      content: phase3Lines(
        "Kapı, şaft veya tesisat geçişi için açılan boşluklar 7.6.1.1'deki net alanı ve perde parçalarının etkin geometrisini değiştirir. Proje sonrası açılan boşluk, yalnız detay problemi değil taşıyıcı sistem modelini etkileyen bir geometri değişikliğidir.",
        "",
        "Statik paftadaki `ℓw` ve `bw` ile mimari/mekanik uygulama paftasındaki gerçek boşlukların uyumu kontrol edilmelidir. Özellikle boşluklu perdelerde tek parça brüt dikdörtgen üzerinden alan veya oran kontrolü yapılmamalıdır.",
        "",
        "> [!warning] Şantiye değişikliği",
        "> Taşıyıcı perde üzerinde projede olmayan boşluk açılması, hesap/model kontrolü yapılmadan saha kararıyla uygulanmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Elemanın plandaki gerçek uzun kenar/kalınlık oranı `ℓw/bw ≥ 6` koşulunu her katta sağlıyor mu?",
        "- Boşluklar düşüldükten sonraki net `Ac` alanı 7.6.1.1 eksenel basınç sınırını sağlıyor mu?",
        "- Normal perde gövdesinde kat yüksekliği/16 ve 250 mm alt sınırları birlikte kontrol edildi mi?",
        "- Yanal doğrultuda tutulmamış perde/perde kolunda 1/30 koşulu kontrol edildi mi?",
        "- İki uçtan yanal tutulu perde kolunda kat yüksekliği/20 ve 250 mm koşulları sağlanıyor mu?",
        "- 200 mm özel sınırı kullanılıyorsa 7.6.1.3 ve Denklem (7.14)'ün iki koşulu birlikte belgelenmiş mi?",
        "- U, L ve T perdelerde her kolun tutulma ve kalınlık koşulu ayrı okunabiliyor mu?",
        "- Yazılım eleman türü ile TBDY geometrik sınıflandırması birbirine karıştırılmamış mı?",
        "- Mimari/MEP boşlukları net perde geometrisine ve analiz modeline işlenmiş mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.6.1.1–7.6.1.3 ve Denklem (7.14)"),
  keywords: ["TBDY 2018", "perde", "kolon", "ℓw/bw", "7.6.1", "perde kalınlığı", "Ac", "Ndm"],
  tags: ["TBDY 2018", "Betonarme", "Perde", "Geometri", "Detaylandırma"],
};
