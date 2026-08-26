import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_SUNEKLIK_SISTEM: DepremPhase3Override = {
  slug: "tbdy-suneklik-duzeyi-sistem-farki",
  description: "TBDY 2018'e göre süneklik düzeyi yüksek, sınırlı ve karma taşıyıcı sistemlerin tanımını; DTS/BYS sınırlamalarını, iki doğrultu koşulunu ve devrilme momenti payı kontrollerini açıklar.",
  seoTitle: "TBDY 2018 Süneklik Düzeyi | Yüksek, Sınırlı ve Karma Sistem",
  seoDescription: "TBDY 4.3.3-4.3.4'e göre yüksek, sınırlı ve karma süneklik; DTS, BYS, R-D ve devrilme momenti koşulları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "uc-sistem-sinifi",
      title: "4.3.3: Taşıyıcı sistemler süneklik bakımından yüksek, sınırlı ve karma olarak üçe ayrılır",
      content: phase3Lines(
        "TBDY 4.3.3.1, betonarme ve çelik taşıyıcı sistemleri süneklik bakımından üç gruba ayırır: **süneklik düzeyi yüksek**, **süneklik düzeyi sınırlı** ve **süneklik düzeyi karma**. Bu sınıflandırma yalnız davranış etiketi değildir; Tablo 4.1'de R, D ve izin verilen BYS ile birlikte tanımlanan taşıyıcı sistem seçimidir.",
        "",
        "4.3.3.3'e göre karma sistem, süneklik düzeyi sınırlı çerçeve taşıyıcı sisteminin süneklik düzeyi yüksek betonarme perdeler veya çelik çaprazlı çerçevelerle birlikte kullanılmasıyla oluşturulur.",
        "",
        "> [!warning] Karma = rastgele iki sistemin birleşimi değildir",
        "> Karma sınıfın yönetmelik tanımı ve Tablo 4.1 satırı sağlanmadan yalnız perde eklemek sistemi otomatik olarak 'karma' yapmaz."
      ),
      subsections: [],
    },
    {
      id: "dts-bys-yasaklari",
      title: "4.3.4.1: DTS ve BYS bazı sınırlı/karma sistemleri doğrudan yasaklar",
      content: phase3Lines(
        "Süneklik düzeyi seçimi binadan bağımsız yapılamaz. TBDY 4.3.4.1'de iki açık kapı vardır:",
        "",
        "| Koşul | Sonuç |",
        "|---|---|",
        "| DTS = 1a, 2a, 3a veya 4a | Süneklik düzeyi sınırlı taşıyıcı sistem **kullanılamaz** |",
        "| BYS ≤ 6 ve DTS = 1a veya 2a | Süneklik düzeyi karma taşıyıcı sistem **kullanılamaz** |",
        "",
        "Buna ek olarak 4.3.4.3, deprem etkilerinin tamamını moment aktaran süneklik düzeyi sınırlı çerçevelerin karşıladığı A31/B31/C31 sistemlerini yalnız DTS = 3 ve DTS = 4 binalarla sınırlar.",
        "",
        "> [!check] Önce DTS/BYS",
        "> Taşıyıcı sistemi yazılımda modelledikten sonra süneklik sınıfı seçmek yerine önce BKS → DTS → BYS zincirini kurup izin verilen sistem ailesini daraltın."
      ),
      subsections: [],
    },
    {
      id: "iki-dogrultu",
      title: "4.3.4.2: Birbirine dik doğrultularda süneklik düzeyi aynı olmak zorundadır",
      content: phase3Lines(
        "TBDY 4.3.4.2'ye göre birbirine dik yatay doğrultulardaki taşıyıcı sistemlerin **süneklik düzeyleri aynı olmak zorundadır**. Ancak iki doğrultuda farklı R değerleri ve bunlara karşılık gelen farklı D değerleri kullanılabilir.",
        "",
        "Tablo 4.1'e göre izin verilen en üst Bina Yükseklik Sınıfı da iki doğrultu için elde edilen değerlerin **elverişsizi** alınarak belirlenir.",
        "",
        "> [!engineering] X/Y model kontrolü",
        "> X doğrultusunda perde ağırlıklı, Y doğrultusunda çerçeve ağırlıklı bir davranış varsa R ve D farklı olabilir; fakat süneklik düzeyi sınıfı X ve Y için farklı tanımlanamaz."
      ),
      subsections: [],
    },
    {
      id: "tablo-4-1-karsilastirma",
      title: "Tablo 4.1: Aynı malzemede süneklik sınıfı R, D ve BYS sınırını değiştirir",
      content: phase3Lines(
        "Yerinde dökme betonarme örnekleri sınıflar arasındaki farkı sayısal olarak gösterir:",
        "",
        "| Örnek sistem | Süneklik | R | D | İzin verilen BYS |",
        "|---|---|---:|---:|---|",
        "| A11 — moment aktaran çerçeve | Yüksek | 8 | 3 | BYS ≥ 3 |",
        "| A13 — boşluksuz perde | Yüksek | 6 | 2.5 | BYS ≥ 2 |",
        "| A21 — sınırlı çerçeve + yüksek sünek bağ kirişli perde | Karma | 6 | 2.5 | BYS ≥ 4 |",
        "| A22 — sınırlı çerçeve + yüksek sünek boşluksuz perde | Karma | 5 | 2.5 | BYS ≥ 4 |",
        "| A31 — moment aktaran çerçeve | Sınırlı | 4 | 2.5 | BYS ≥ 7 |",
        "| A32 — boşluksuz perde | Sınırlı | 4 | 2 | BYS ≥ 6 |",
        "",
        "Bu değerler, 'yüksek süneklik her zaman R=8' veya 'perdeli sistem her zaman aynı R' gibi ezberlerin doğru olmadığını gösterir. Sistem geometrisi ve yük taşıma mekanizması Tablo 4.1 satırını belirler.",
        "",
        "> [!warning] SOURCE_VALUE",
        "> Süneklik sınıfı, R, D ve BYS satırı birlikte doğrulanan SOURCE_VALUE proje kararlarıdır."
      ),
      subsections: [],
    },
    {
      id: "devrilme-momenti-paylari",
      title: "4.3.4.5–4.3.4.7: Perde/çapraz katkısı süneklik sınıfının gerçekliğini kontrol eder",
      content: phase3Lines(
        "Yüksek sünek perdelerin/çaprazlı çerçevelerin yüksek sünek moment çerçeveleriyle birlikte kullanıldığı sistemlerde 4.3.4.5, bu elemanların taban devrilme momenti toplamını bina toplamına göre sınırlar: **%40'tan az, %75'ten fazla olamaz** (`0.40Mo < ΣMDEV < 0.75Mo`).",
        "",
        "Karma sistemlerde 4.3.4.6 daha güçlü bir katkı ister: yüksek sünek perde veya çaprazlı çerçevelerin taban devrilme momenti toplamı **en az %75** olmalıdır (`ΣMDEV ≥ 0.75Mo`). 4.3.4.7, sınırlı perde/çapraz + sınırlı çerçeve birleşiminde de bu %75 koşulunu uygular.",
        "",
        "| Sistem mantığı | Devrilme momenti kontrolü |",
        "|---|---|",
        "| Yüksek sünek çerçeve + yüksek sünek perde/çapraz | 0.40Mo < ΣMDEV < 0.75Mo |",
        "| Karma sistem | ΣMDEV ≥ 0.75Mo |",
        "| Sınırlı perde/çapraz + sınırlı çerçeve | ΣMDEV ≥ 0.75Mo |",
        "",
        "> [!engineering] Model sonucu sınıflandırmayı geri besler",
        "> Seçilen sistemin gerçek deprem yükü paylaşımı bu sınırları sağlamıyorsa yalnız etiketi koruyamazsınız; yönetmeliğin ilgili R/D ve BYS sonuçlarına dönmek gerekir."
      ),
      subsections: [],
    },
    {
      id: "kritisiz-doseme-ve-sik-hatalar",
      title: "Kirişsiz ve tek doğrultulu dişli döşemelerde sistem seçimini ayrıca kontrol edin",
      content: phase3Lines(
        "4.3.4.3, dolgulu (asmolen) veya dolgusuz tek doğrultulu dişli döşemeli betonarme çerçeveler perde içermiyorsa bunları süneklik düzeyi sınırlı sistem olarak sınıflandırır ve yalnız DTS = 3 veya 4 için kullanılmasına izin verir. 4.3.4.4 ise yalnız kirişsiz döşemeli sistemlerde deprem etkilerinin tamamının uygun perde/çapraz sistemleriyle karşılanmasını ister.",
        "",
        "Sık hata, döşeme sistemini mimari/kalıp kararı olarak görüp taşıyıcı sistem süneklik sınıfından bağımsız değerlendirmektir.",
        "",
        "> [!warning] Süneklik bir yazılım menüsü değildir",
        "> Seçilen süneklik düzeyi; taşıyıcı sistem, döşeme düzeni, DTS, BYS, detaylandırma ve analizdeki gerçek yük paylaşımıyla birlikte doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Sistem yüksek, sınırlı veya karma olarak 4.3.3 tanımına uyuyor mu?",
        "- DTS = 1a/2a/3a/4a ise sınırlı sistem yasağı kontrol edildi mi?",
        "- BYS ≤ 6 ve DTS = 1a/2a ise karma sistem yasağı kontrol edildi mi?",
        "- A31/B31/C31 tipi sınırlı çerçeve varsa yalnız DTS = 3/4 şartı sağlanıyor mu?",
        "- X ve Y doğrultularında süneklik düzeyi aynı mı?",
        "- Farklı R/D kullanılıyorsa her doğrultunun Tablo 4.1 satırı ayrı doğrulandı mı?",
        "- İzin verilen BYS iki doğrultunun elverişsizine göre mi belirlendi?",
        "- Yüksek sünek çerçeve-perde sisteminde %40–%75 devrilme momenti koşulu kontrol edildi mi?",
        "- Karma veya ilgili sınırlı birleşik sistemde `ΣMDEV ≥ 0.75Mo` sağlanıyor mu?",
        "- Kirişsiz veya tek doğrultulu dişli döşeme özel hükümleri değerlendirildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 4; Madde 4.3.3–4.3.4 ve Tablo 4.1"),
  keywords: ["süneklik düzeyi", "yüksek süneklik", "sınırlı süneklik", "karma sistem", "DTS", "BYS", "TBDY 2018"],
  tags: ["TBDY 2018", "Süneklik", "Taşıyıcı Sistem", "DTS", "BYS"],
};
