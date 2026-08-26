import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DEPREM_RUZGAR: DepremPhase3Override = {
  slug: "deprem-yuku-ile-ruzgar-yuku-kombinasyonu",
  description: "TBDY 2018 Madde 4.4.4'teki deprem etkili yük birleşimlerini açıklar; H yatay zemin itkisi ile rüzgâr etkisinin karıştırılmasını ve mevzuatta olmayan bir deprem+rüzgâr eşzamanlı birleşiminin üretilmesini önler.",
  seoTitle: "TBDY 2018 Deprem ve Rüzgâr Yükü Birleşimi | Denklem 4.11–4.12",
  seoDescription: "TBDY 4.4.4 deprem yük birleşimleri, H yatay zemin itkisi, rüzgâr etkisinin ayrı değerlendirilmesi ve tasarım zarfı yaklaşımı.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "11 dk",
  sections: [
    {
      id: "tbdy-4-4-4-kapsami",
      title: "TBDY 4.4.4 neyi birleştirir?",
      content: phase3Lines(
        "TBDY 2018 Madde 4.4.4, deprem etkisinin düşey sabit/hareketli etkiler ve ilgili diğer etkilerle nasıl birleştirileceğini tanımlar. Denklem (4.11) ve Denklem (4.12) deprem etkili tasarım durumlarının temelidir.",
        "",
        "Yönetmelikteki gösterim proje raporunda aynen korunmalıdır. Özellikle `H` simgesini 'wind' veya rüzgâr olarak okumak yanlıştır; TBDY simgelerinde `H` **yatay zemin itkisi**dir.",
        "",
        "> [!warning] Temel düzeltme",
        "> TBDY 4.4.4'teki `H`, rüzgâr yükü değildir. Bu nedenle Denklem (4.12)'de `H` görülmesi, deprem ve rüzgârın eşzamanlı toplandığı anlamına gelmez."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-11-4-12",
      title: "Denklem 4.11 ve 4.12: deprem etkili tasarım durumları",
      content: phase3Lines(
        "TBDY'deki iki temel birleşim aşağıdaki biçimde okunur:",
        "",
        "`G + Q + 0.2S + E_d^(H) + 0.3E_d^(Z)` — **Denklem (4.11)**",
        "",
        "`0.9G + H + E_d^(H) - 0.3E_d^(Z)` — **Denklem (4.12)**",
        "",
        "Burada `G` sabit yük etkisini, `Q` hareketli yük etkisini, `S` kar yükünü, `H` yatay zemin itkisini, `E_d^(H)` yatay deprem etkisini ve `E_d^(Z)` düşey deprem etkisini temsil eder. Yatay deprem etkisinin kendi içinde iki doğrultulu birleşimi Madde 4.4.2'deki %100–%30 kuralıyla ayrıca oluşturulur.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> Birleşim isimlerinden çok, her terimin fiziksel anlamını ve işaretini raporlayın. `H` ile rüzgâr için kullanılan `W` benzeri proje gösterimleri hiçbir aşamada birbirine dönüştürülmemelidir."
      ),
      subsections: [],
    },
    {
      id: "ruzgar-nerede",
      title: "Rüzgâr etkisi neden bu denklemlerde görünmez?",
      content: phase3Lines(
        "TBDY'nin Denklem (4.11)–(4.12) ifadelerinde bağımsız bir rüzgâr etkisi `W` yer almaz. Bu nedenle yalnız TBDY metnine dayanarak `E + W` biçiminde yeni bir eşzamanlı deprem+rüzgâr birleşimi üretmek doğru değildir.",
        "",
        "Rüzgâr etkisi, projede uygulanabilir rüzgâr/yük standardı ve proje esasları çerçevesinde ayrıca hesaplanır. Deprem ve rüzgâr tasarım durumları tamamlandıktan sonra eleman ve temel talepleri bakımından **zarf** alınarak hangi durumun yönettiği belirlenir.",
        "",
        "TBDY Bölüm 13 kapsamındaki yüksek binalarda Madde 13.4.3.1 ayrıca rüzgâr hesabının yapılmasını ister. Bu hüküm de rüzgârı Denklem (4.11)–(4.12) içine eklenmiş bir `E + W` terimine dönüştürmez; rüzgâr hesabının ayrı yapılması gerektiğini gösterir. Başka bir bağlayıcı standart, idare şartı veya projeye özgü tasarım esası eşzamanlı bir birleşim istiyorsa bu ayrıca belgelenir; böyle bir şart TBDY 4.4.4'e atfedilmez."
      ),
      subsections: [],
    },
    {
      id: "etki-kaynagi-tablosu",
      title: "Deprem, rüzgâr ve yatay zemin itkisini ayırın",
      content: phase3Lines(
        "| Etki | TBDY 4.4.4'teki yeri | Proje kararı |",
        "|---|---|---|",
        "| Yatay deprem `E_d^(H)` | Denklem (4.11) ve (4.12) | TBDY'ye göre deprem birleşiminde kullanılır |",
        "| Düşey deprem `E_d^(Z)` | `+0.3` / `-0.3` katsayılı terim | 4.4.3 ve 4.4.4 birlikte kontrol edilir |",
        "| Yatay zemin itkisi `H` | Denklem (4.12) | Zemin/temel etkisi olarak tanımlanır; rüzgâr değildir |",
        "| Rüzgâr etkisi | Denklem (4.11)–(4.12)'de bağımsız terim yok | Uygulanabilir rüzgâr/yük standardına göre ayrı tasarım durumu |",
        "",
        "Bu ayrım özellikle bodrumlu yapılarda kritiktir. `H` yatay zemin etkisini yanlışlıkla rüzgâr olarak etiketlemek, gerçek zemin itkisinin birleşimden düşmesine veya hayali bir rüzgâr teriminin eklenmesine yol açabilir."
      ),
      subsections: [],
    },
    {
      id: "zarf-yaklasimi",
      title: "Doğru karşılaştırma: eşzamanlı toplama değil tasarım zarfı",
      content: phase3Lines(
        "Aynı eleman için deprem ve rüzgâr ayrı tasarım durumlarında farklı yön ve işaretlerde kritik olabilir. Mühendislik kontrolü, her bağlayıcı yük durumunu kendi kurallarına göre üretip moment, kesme, eksenel kuvvet, ötelenme, temel reaksiyonu ve benzeri taleplerin zarfını almaktır.",
        "",
        "Örneğin bir kolonun rüzgâr altında büyük servis ötelenmesi alması, deprem dayanım tasarım birleşimini ortadan kaldırmaz; deprem altında daha büyük kesme oluşması da rüzgâr durumunun servis kontrollerini geçersiz kılmaz. Her limit durum kendi kaynağıyla değerlendirilir."
      ),
      subsections: [],
    },
    {
      id: "yazilim-kontrolu",
      title: "Yazılımda kombinasyon üretirken yapılacak kontrol",
      content: phase3Lines(
        "1. Yük desenlerinde `G`, `Q`, `S`, yatay zemin itkisi ve rüzgârı ayrı fiziksel etkiler olarak tanımlayın.",
        "2. TBDY deprem kombinasyonlarını Denklem (4.11)–(4.12) ve yatay deprem için 4.4.2 işaretleriyle üretin.",
        "3. `H` etiketinin yazılımda gerçekten yatay zemin itkisine karşılık geldiğini doğrulayın.",
        "4. Rüzgâr kombinasyonlarını uygulanabilir rüzgâr/yük standardından ayrı üretin.",
        "5. Son tasarımda deprem ve rüzgâr durumlarının taleplerini zarf olarak karşılaştırın.",
        "6. Otomatik kombinasyon üreticisinin mevzuatta olmayan bir eşzamanlı `E + W` durumu ekleyip eklemediğini kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Denklem (4.11) ve Denklem (4.12) proje kombinasyonlarında izlenebilir mi?",
        "- `H` yatay zemin itkisi olarak mı tanımlandı?",
        "- Rüzgâr etkisi `H` ile karıştırılmadı mı?",
        "- Yatay deprem etkisinde 4.4.2'nin iki doğrultulu birleşimi ayrıca uygulandı mı?",
        "- Mevzuatta dayanağı olmayan eşzamanlı deprem+rüzgâr birleşimi otomatik olarak eklenmedi mi?",
        "- Rüzgâr yükleri kendi uygulanabilir standardına göre çözüldü mü?",
        "- Deprem ve rüzgâr sonuçları eleman bazında zarf alınarak karşılaştırıldı mı?",
        "- Rapor, kullanılan her yük birleşiminin normatif kaynağını açıkça gösteriyor mu?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.4.2–4.4.4; Denklem (4.9)–(4.12)"),
  keywords: ["deprem yükü", "rüzgâr yükü", "yük birleşimi", "Denklem 4.11", "Denklem 4.12", "yatay zemin itkisi", "zarf"],
  tags: ["TBDY 2018", "Yük Birleşimleri", "Deprem", "Rüzgâr"],
};
