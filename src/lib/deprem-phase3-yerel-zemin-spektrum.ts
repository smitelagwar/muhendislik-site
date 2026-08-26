import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_YEREL_ZEMIN_SPEKTRUM: DepremPhase3Override = {
  slug: "tbdy-yerel-zemin-sinifi-spektrum",
  description: "TBDY 2018 Tablo 2.1 ve 2.2'ye göre ZA–ZE yerel zemin sınıfları için FS/F1 katsayılarının seçimini, doğrusal enterpolasyonu ve ZF sınıfında sahaya özel analiz gereğini açıklar.",
  seoTitle: "TBDY 2018 Yerel Zemin Etki Katsayıları FS ve F1 | Tablo 2.1–2.2",
  seoDescription: "ZA–ZF zemin sınıflarında FS ve F1 seçimi, doğrusal enterpolasyon, SDS/SD1 dönüşümü ve ZF için Bölüm 16.5 sahaya özel zemin davranış analizinin proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "yerel-zemin-etkisi",
      title: "2.3.3: Aynı Ss/S1 harita tehlikesi, yerel zemin sınıfına göre farklı SDS/SD1 üretir",
      content: phase3Lines(
        "TBDY 2.3.3, haritadan alınan `Ss` ve `S1` değerlerini yerel zemin etkisiyle tasarım spektral ivme katsayılarına dönüştürür. ZA–ZE sınıflarında kısa periyot için `FS`, 1.0 saniye periyot bölgesi için `F1` kullanılır.",
        "",
        "Temel bağıntılar `SDS = Ss FS` ve `SD1 = S1 F1`'dir. Bu nedenle yerel zemin sınıfı yalnız bir rapor etiketi değil, yatay elastik tasarım spektrumunun hem ordinatını hem de `TA/TB` köşe periyotlarını değiştiren doğrudan hesap girdisidir.",
        "",
        "> [!warning] Zemin sınıfını varsayımla seçmeyin",
        "> ZA–ZF sınıfı zemin ve temel etüdü verisinden gelmelidir. Spektrum hesabını kolaylaştırmak için zemin sınıfını gerçeğinden farklı seçmek yönetmelik akışını bozar."
      ),
      subsections: [],
    },
    {
      id: "tablo-2-1-fs",
      title: "Tablo 2.1: Kısa periyot bölgesi için FS, zemin sınıfı ve Ss birlikte okunur",
      content: phase3Lines(
        "TBDY **Tablo 2.1** SOURCE_VALUE değerleri:",
        "",
        "| Zemin sınıfı | Ss ≤ 0.25 | Ss = 0.50 | Ss = 0.75 | Ss = 1.00 | Ss = 1.25 | Ss ≥ 1.50 |",
        "|---|---:|---:|---:|---:|---:|---:|",
        "| ZA | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 |",
        "| ZB | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 |",
        "| ZC | 1.3 | 1.3 | 1.2 | 1.2 | 1.2 | 1.2 |",
        "| ZD | 1.6 | 1.4 | 1.2 | 1.1 | 1.0 | 1.0 |",
        "| ZE | 2.4 | 1.7 | 1.3 | 1.1 | 0.9 | 0.8 |",
        "| ZF | Sahaya özel zemin davranış analizi | Sahaya özel | Sahaya özel | Sahaya özel | Sahaya özel | Sahaya özel |",
        "",
        "Tablodaki başlık değerlerinin arasında kalan `Ss` için komşu sütunlar arasında **doğrusal enterpolasyon** yapılabilir. Sınırın dışındaki değerlerde tablonun `≤` ve `≥` tanımları uygulanır.",
        "",
        "> [!check] Tablo satırı ve sütunu",
        "> FS seçerken önce zemin sınıfı satırını, sonra aynı projeye ve DD düzeyine ait Ss sütununu doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "tablo-2-2-f1",
      title: "Tablo 2.2: 1.0 saniye periyot bölgesi için F1, zemin sınıfı ve S1 birlikte okunur",
      content: phase3Lines(
        "TBDY **Tablo 2.2** SOURCE_VALUE değerleri:",
        "",
        "| Zemin sınıfı | S1 ≤ 0.10 | S1 = 0.20 | S1 = 0.30 | S1 = 0.40 | S1 = 0.50 | S1 ≥ 0.60 |",
        "|---|---:|---:|---:|---:|---:|---:|",
        "| ZA | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 |",
        "| ZB | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 |",
        "| ZC | 1.5 | 1.5 | 1.5 | 1.5 | 1.5 | 1.4 |",
        "| ZD | 2.4 | 2.2 | 2.0 | 1.9 | 1.8 | 1.7 |",
        "| ZE | 4.2 | 3.3 | 2.8 | 2.4 | 2.2 | 2.0 |",
        "| ZF | Sahaya özel zemin davranış analizi | Sahaya özel | Sahaya özel | Sahaya özel | Sahaya özel | Sahaya özel |",
        "",
        "Ara `S1` değerlerinde de **doğrusal enterpolasyon** uygulanabilir. `F1` seçiminde yanlışlık yapılması özellikle `SD1`, `TA` ve `TB` üzerinden orta/uzun periyot spektrumunu doğrudan etkiler.",
        "",
        "> [!engineering] Ss ile S1 sütunlarını karıştırmayın",
        "> Tablo 2.1'in yatay girdisi Ss, Tablo 2.2'nin yatay girdisi S1'dir. İki tablo aynı zemin sınıfını kullansa da farklı harita katsayısıyla okunur."
      ),
      subsections: [],
    },
    {
      id: "zf-sahaya-ozel",
      title: "ZF yerel zemin sınıfında FS/F1 tablosu kullanılmaz; Bölüm 16.5 devreye girer",
      content: phase3Lines(
        "TBDY 2.3.3.2'ye göre yerel zemin sınıfı **ZF** ise Tablo 2.1 ve Tablo 2.2'den sayısal `FS/F1` seçilmez. Tasarım spektrumu, **Bölüm 16.5'e göre sahaya özel zemin davranış analizi** ile belirlenir.",
        "",
        "Bu, ZF satırında 'en büyük katsayıyı seç' veya 'ZE değerini kullan' şeklinde bir kestirim yapılabileceği anlamına gelmez. ZF sınıfı standart tablo yolundan bilinçli olarak ayrılmıştır.",
        "",
        "> [!warning] ZF için tablo değeri uydurmayın",
        "> ZF sınıfında proje spektrumunu standart FS/F1 tablosuna zorlamak yerine jeoteknik analiz kapsamını Bölüm 16.5 ile koordine edin."
      ),
      subsections: [],
    },
    {
      id: "sayisal-ornek",
      title: "Sayısal kontrol örneği: ZD, Ss = 1.00 ve S1 = 0.40",
      content: phase3Lines(
        "Örnek yalnız tablo okuma ve aritmetik kontrolü göstermek içindir. Proje için haritadan `Ss = 1.00`, `S1 = 0.40` alındığını ve zemin etüdünün ZD verdiğini varsayalım.",
        "",
        "- Tablo 2.1, ZD ve `Ss = 1.00` için `FS = 1.1` verir.",
        "- Tablo 2.2, ZD ve `S1 = 0.40` için `F1 = 1.9` verir.",
        "- `SDS = 1.00 × 1.1 = 1.10`.",
        "- `SD1 = 0.40 × 1.9 = 0.76`.",
        "",
        "Burada `1.1` ve `1.9` tablodan gelen SOURCE_VALUE katsayıları; `SDS = 1.10` ve `SD1 = 0.76` ise hesaplanan tasarım spektral ivme katsayılarıdır.",
        "",
        "> [!check] Örneği projeye kopyalamayın",
        "> Bu sayılar örnek girdidir. Gerçek projede Ss/S1, DD düzeyi ve zemin sınıfı proje verilerinden yeniden alınmalıdır."
      ),
      subsections: [],
    },
    {
      id: "enterpolasyon-ve-izlenebilirlik",
      title: "Ara Ss/S1 değerlerinde enterpolasyon açıkça gösterilmeli, tablo seçimi denetlenebilir kalmalıdır",
      content: phase3Lines(
        "Harita değeri tablo başlıklarından birinin tam üzerine düşmüyorsa komşu iki SOURCE_VALUE arasında doğrusal enterpolasyon uygulanır. Hesap raporunda yalnız sonuç katsayısını yazmak yerine kullanılan iki tablo sınırı ve enterpolasyon oranını göstermek denetimi kolaylaştırır.",
        "",
        "Örneğin ZD için `Ss` değeri 0.75 ile 1.00 arasındaysa `FS`, 1.2 ile 1.1 arasında enterpole edilir. Aynı prensip `F1` için Tablo 2.2'de uygulanır.",
        "",
        "> [!engineering] Yazılım çıktısını çapraz kontrol edin",
        "> Analiz programının otomatik zemin katsayısı hesabını en az bir kez Tablo 2.1/2.2 ve manuel enterpolasyonla karşılaştırın; özellikle zemin sınıfı ve DD düzeyi değişikliklerinden sonra eski parametre kalmadığını doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Yerel zemin sınıfı güncel zemin ve temel etüdünden mi alındı?",
        "- FS için Tablo 2.1 doğru zemin satırı ve doğru Ss sütunuyla mı okundu?",
        "- F1 için Tablo 2.2 doğru zemin satırı ve doğru S1 sütunuyla mı okundu?",
        "- Ara Ss/S1 değerlerinde doğrusal enterpolasyon açıkça gösterildi mi?",
        "- `SDS = Ss FS` ve `SD1 = S1 F1` hesabı aynı DD düzeyine ait harita değerleriyle mi yapıldı?",
        "- ZF sınıfında tablo katsayısı kullanılmayıp Bölüm 16.5 sahaya özel zemin davranış analizi başlatıldı mı?",
        "- FS/F1 ile SDS/SD1 değerleri hesap raporu ve analiz modelinde aynı mı?",
        "- Zemin sınıfı veya DD düzeyi değiştiğinde spektrum parametreleri yeniden üretildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 2; Madde 2.3.3.1–2.3.3.2, Tablo 2.1, Tablo 2.2 ve Bölüm 16.5 bağlantısı"),
  keywords: ["TBDY 2018", "yerel zemin sınıfı", "FS", "F1", "SDS", "SD1", "Tablo 2.1", "Tablo 2.2", "ZF", "zemin spektrumu"],
  tags: ["TBDY 2018", "Yerel Zemin", "FS", "F1", "Spektrum"],
};
