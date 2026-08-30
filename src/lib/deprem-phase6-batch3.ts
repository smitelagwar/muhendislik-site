import {
  BYKHY_2009,
  BYKHY_2026_GUIDE,
  PHASE6_UPDATED_AT,
  SARJ_2022,
  SARJ_2026,
  TBDY_PAGE,
  TBDY_PDF,
  otoparkPhase6References,
  phase6Lines,
  type DepremPhase6Override,
} from "./deprem-phase6-shared";

const section = (id: string, title: string, content: string) => ({ id, title, subsections: [], content });

const OTOPARK_MINIMUM_AREA: DepremPhase6Override = {
  slug: "otopark-kullanim-turune-gore-minimum-alan-hesabi",
  title: "Otopark İhtiyacı ve Minimum Alan Hesabı: Ek-1'i Projeye Doğru Taşımak",
  description: "Otopark ihtiyacını kullanım türü, bağımsız bölüm büyüklüğü ve güncel Ek-1 üzerinden hesaplar; gerekli araç adedi ile gerçek yerleşim alanını birbirinden ayırır.",
  seoTitle: "Otopark İhtiyacı Hesabı | Ek-1, Konut ve Minimum Alan",
  seoDescription: "Konutlarda 80, 120 ve 180 m² eşikleri, 20 m² birim park alanı, 2025 hastane 85 m² değişikliği ve karma kullanımlı projeler için otopark hesap rehberi.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk okuma",
  relatedSlugs: ["otopark-rampa-egimi-genislik-donus-yaricapi", "imar-taks-kaks-emsal-hesabi", "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri"],
  sections: [
    section("hizli-ozet", "Mühendis için hızlı özet", phase6Lines(
      "Otopark hesabında iki ayrı büyüklük vardır: **kaç araçlık otopark gerektiği** ve bu kapasitenin planda **kaç metrekareye gerçekten sığdığı**. Ek-1 kullanım türüne göre gerekli araç adedini verir; 20 m² ise binek otomobiller için manevra alanı dâhil birim park alanının yönetmelikte kullanılan asgari hesap karşılığıdır. Bu iki değeri tek kavram gibi kullanmak proje kontrolünde hataya yol açar.",
      "Konutlarda bağımsız bölüm büyüklüğü kritik eşiktir: 80 m² altı, 80–120 m², 120–180 m² ve 180 m² üzeri dilimler farklı araç ihtiyacı üretir. Ayrıca imar planı veya plan notu daha fazla otopark isteyebilir; ulusal Yönetmelik taban gereklilik olarak okunmalıdır.",
      "27 Aralık 2025 tarihli ve 33120 sayılı değişiklik Ek-1'de hastaneler için hesabı 75 m² yerine **85 m²** üzerinden güncelledi. Eski Excel veya ofis şablonundaki katsayıları proje tarihine bakmadan kullanmak doğru değildir."
    )),
    section("konut-ek1", "Ek-1 konut hesabı: bağımsız bölüm büyüklüğünü önce sınıflandır", phase6Lines(
      "Konut projesinde her bağımsız bölüm önce net alan dilimine yerleştirilir; sonra aynı dilimdeki bağımsız bölüm sayısı için Ek-1 oranı uygulanır. Güncel uygulamada kullanılan temel sınıflandırma şöyledir:",
      "| Konut bağımsız bölüm büyüklüğü | Asgari otopark ihtiyacı |\n|---|---:|\n| 80 m² altı | Her 3 daire için 1 adet |\n| 80 m²–120 m² arası, 120 m² hariç | Her 2 daire için 1 adet |\n| 120 m²–180 m² arası, 180 m² hariç | Her daire için 1 adet |\n| 180 m² ve üzeri | Her daire için 2 adet |",
      "Alan dilimleri yalnız ilk hesap katmanıdır. Uygulama imar planında veya plan notunda örneğin her bağımsız bölüm için daha yüksek bir asgari araç sayısı isteniyorsa proje o yerel hükümle birlikte değerlendirilmelidir. Bu nedenle hesap tablosunda `Yönetmelik sonucu` ile `plan/plan notu sonucu` ayrı sütunlarda tutulmalıdır."
    )),
    section("alan-adet-ayrimi", "20 m² birim alan, park cebinin 20 m² çizileceği anlamına gelmez", phase6Lines(
      "Otopark Yönetmeliğinde bedel hesabı bağlamında binek otomobiller için manevra alanı dâhil en az birim park alanı **20 m²** olarak tanımlanır. Buna karşılık tek bir park cebinin geometrisi manevra alanı hariç en az 2,40 × 4,90 m'dir. Kolon, perde, rampa, dönüş cebi, yaya yolu, yangın holü ve tesisat şaftları nedeniyle gerçek brüt otopark kat alanı çoğu projede `araç sayısı × 20 m²` değerinden daha büyük olur.",
      "Bu nedenle 20 m² katsayısını doğrudan mimari yerleşim alanı gibi kullanmak yanlış olur. Ön fizibilitede kapasite karşılığı olarak kullanılabilir; ruhsat projesinde ise her araç yeri ve manevra geometrisi çizilerek doğrulanmalıdır."
    )),
    section("sayisal-ornek", "Sayısal örnek: karma büyüklükte 13 konut", phase6Lines(
      "Örnek projede 6 adet 75 m², 4 adet 100 m², 2 adet 150 m² ve 1 adet 190 m² daire olsun. Ek-1 sınıflarına göre ön hesap: 6 / 3 = 2 araç; 4 / 2 = 2 araç; 2 × 1 = 2 araç; 1 × 2 = 2 araç. Böylece Yönetmelik tabanında **8 araçlık** ihtiyaç oluşur.",
      "Birim park alanı göstergesiyle 8 × 20 = **160 m²** yalnız ön alan karşılığıdır. Bu değer sekiz aracın güvenli ve mevzuata uygun biçimde 160 m²'lik herhangi bir dikdörtgene sığacağını kanıtlamaz. Mimari planda rampa, 90° manevra koridoru, kolon/perde konumu, engelli park yeri, giriş kapısı ve yaya dolaşımı ayrıca çözülmelidir.",
      "Mühendislik yorumu: ilk hesap kapasiteyi, ikinci aşama geometriyi doğrular. İki aşamayı tek Excel hücresine indirgemek ileride kolon akslarının veya rampanın otopark sayısını düşürmesine neden olabilir."
    )),
    section("diger-kullanimlar", "Konut dışı ve karma kullanımlarda her kullanım ayrı hesaplanır", phase6Lines(
      "Ticaret, ofis, sağlık, eğitim ve diğer kullanımlarda Ek-1 farklı alan veya kullanım esasları içerir. Karma kullanımlı binada tüm yapı için tek bir ortalama katsayı üretmek yerine her kullanımın otopark ihtiyacı ayrı hesaplanmalı, ardından ortak otopark düzeninin birlikte çalışıp çalışmadığı kontrol edilmelidir.",
      "27 Aralık 2025 değişikliği bunun neden güncel tutulması gerektiğine iyi bir örnektir: hastaneler için Ek-1'deki alan esası **85 m²** olarak değiştirilmiştir. Proje arşivindeki eski 75 m² değeri bugün yeni ruhsat hesabına otomatik taşınmamalıdır.",
      "Yerel idarenin plan notu, ulaşım kararı veya özel alan hükmü daha sıkı bir koşul getiriyorsa ayrıca kayıt altına alınmalıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** 20 m²'yi park cebinin geometrik ölçüsü saymak. **Sonuç:** manevra, kolon ve rampa alanı eksik kalır.\n2. **Yanlış:** Tüm konutları aynı m² diliminde kabul etmek. **Sonuç:** gerekli araç adedi eksik veya fazla çıkar.\n3. **Yanlış:** Karma kullanımda tek katsayı kullanmak. **Sonuç:** kullanım bazındaki Ek-1 yükümlülükleri kaybolur.\n4. **Yanlış:** Plan notunu kontrol etmeden yalnız ulusal tabloyu uygulamak. **Sonuç:** ruhsat incelemesinde yerel daha sıkı hüküm atlanabilir.\n5. **Yanlış:** 2025 değişikliğinden önceki hastane 75 m² değerini kullanmak. **Sonuç:** güncel Ek-1 ile çelişen kapasite hesabı oluşur."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Proje tarihindeki Otopark Yönetmeliği ve değişiklik zinciri doğrulandı mı?",
      "- [ ] Her bağımsız bölüm doğru 80 / 120 / 180 m² dilimine ayrıldı mı?",
      "- [ ] Karma kullanımlarda her kullanım ayrı hesaplandı mı?",
      "- [ ] Plan ve plan notunda daha sıkı otopark hükmü var mı?",
      "- [ ] 20 m² yalnız birim park alanı hesabı olarak mı kullanıldı?",
      "- [ ] Gerçek yerleşimde 2,40 × 4,90 m park cebi, manevra ve rampa geometrisi ayrıca doğrulandı mı?",
      "- [ ] Hastane projesinde 27 Aralık 2025 sonrası **85 m²** değeri kullanıldı mı?",
      "- [ ] Hesap sonucu mimari paftadaki gerçek araç sayısıyla birebir eşleşiyor mu?"
    )),
  ],
  references: otoparkPhase6References("Ek-1, Madde 4 ve birim otopark alanı hesabı"),
  keywords: ["otopark hesabı", "Ek-1", "20 m²", "80 m²", "120 m²", "180 m²", "85 m²"],
  tags: ["Otopark", "Ek-1", "Alan Hesabı", "Ruhsat Kontrolü"],
};

const OTOPARK_RAMP: DepremPhase6Override = {
  slug: "otopark-rampa-egimi-genislik-donus-yaricapi",
  title: "Otopark Rampası: Eğim, Genişlik, Dönüş Yarıçapı ve Manevra Kontrolü",
  description: "Otopark rampasının eğim, net genişlik, iç yarıçap, kapı ve manevra koridoru şartlarını tek geometri zincirinde ele alır; kesit ile plan koordinasyonunu açıklar.",
  seoTitle: "Otopark Rampa Eğimi ve Genişliği | %15, %20, 2,75 m",
  seoDescription: "Otopark rampalarında %15/%20 eğim sınırları, 2,75 m minimum genişlik ve iç yarıçap, 4,90/6,00/6,50 m manevra koridorları için proje kontrolü.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "12 dk okuma",
  relatedSlugs: ["otopark-kullanim-turune-gore-minimum-alan-hesabi", "otopark-kapali-havalandirma-co-konsantrasyonu", "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari"],
  sections: [
    section("hizli-ozet", "Rampa tek bir eğim yüzdesinden ibaret değildir", phase6Lines(
      "Otopark rampası tasarımında eğim, genişlik, dönüş yarıçapı, kapı açıklığı, kiriş altı yüksekliği ve ilk manevra koridoru birlikte çözülmelidir. Yönetmelik sınırına uyan bir rampa, araç süpürme alanı veya kat geçişi nedeniyle yine kullanılamaz olabilir.",
      "Umumi otoparklar ile ağır vasıta otoparklarında rampa eğimi **%15**'i; umumi otopark dışındaki, otopark ihtiyacını kendi bünyesinde karşılayan binalarda **%20**'yi aşamaz. Rampa genişliği en az **2,75 m**, dönüşte iç yarıçap en az **2,75 m** olmalıdır.",
      "Bu değerler tasarım hedefi değil üst/alt mevzuat sınırıdır. Özellikle kısa rampada eğimi tam %20'ye kilitlemek; geçiş kırığı, araç altı sürtmesi, su tahliyesi veya kapı önündeki bekleme nedeniyle sahada sorun çıkarabilir."
    )),
    section("geometri-tablosu", "Madde 4 geometrisini aynı tabloda kontrol et", phase6Lines(
      "| Kontrol | Asgari / azami değer |\n|---|---:|\n| Otopark giriş kapısı net genişliği | ≥ 2,75 m |\n| Otopark giriş kapısı net yüksekliği | ≥ 2,00 m |\n| Kiriş altı dâhil otopark iç net yüksekliği | ≥ 2,10 m |\n| Umumi / ağır vasıta rampası eğimi | ≤ %15 |\n| Bina bünyesindeki özel otopark rampası eğimi | ≤ %20 |\n| Rampa net genişliği | ≥ 2,75 m |\n| Dönüş kısmı iç yarıçapı | ≥ 2,75 m |\n| Umumi otopark 90° yol toplam genişliği | ≥ 6,50 m |\n| Umumi olmayan otopark 90° yol genişliği | ≥ 6,00 m |\n| 15'ten az otoparklı binada uygun tek yönlü çözüm | ≥ 4,90 m |",
      "Tablodaki ölçüler birbirinden bağımsız kontrol edilmemelidir. Örneğin 2,75 m rampa genişliği, dönüşte kolon/perde veya korkuluk nedeniyle net ölçüye düşüyorsa şart sağlanmış sayılmaz."
    )),
    section("egim-uzunluk", "Eğim ile kot farkını kesitte birlikte çöz", phase6Lines(
      "Rampa eğiminin temel geometrik bağıntısı `eğim = düşey kot farkı / yatay izdüşüm`dür. Örneğin 3,00 m kot farkı için %20 sabit eğimde teorik yatay uzunluk 3,00 / 0,20 = **15,00 m**; %15 eğimde 3,00 / 0,15 = **20,00 m** olur.",
      "Bu değerler geçiş eğrileri veya başlangıç-bitiş yumuşatmalarını içermez. Tasarımda yol kotu, bina giriş kotu, bodrum döşeme kotu, su toplama kanalı ve kapı eşiği birlikte çözülmelidir. Rampayı sadece planda 15 m çizmek, kesitte uygulanabilir olduğunu kanıtlamaz.",
      "Mühendislik kontrolünde araç alt açıklığı ve tekerlek aks mesafesi için gerektiğinde swept-path/araç şablonu kullanmak, yönetmelik yüzdesini sağlamanın ötesinde gerçek kullanılabilirliği doğrular."
    )),
    section("donus-manevra", "Dönüşte iç yarıçap ile sürüş koridorunu karıştırma", phase6Lines(
      "Dönüş kısmındaki **2,75 m iç yarıçap**, rampa veya viraj geometrisinin iç kenarını tanımlar; 90° park sıraları önündeki **6,00 m / 6,50 m** koridor ise manevra alanı gerekliliğidir. Bunlar aynı ölçü değildir.",
      "15 adetten az otoparkı olan binalarda tek yönlü 4,90 m çözüm ancak dönüşlerde yeterli genişlik sağlanıyorsa kullanılabilir. Kolonun dönüş köşesine taşması, duvar kalınlığının net ölçüden düşülmemesi veya park cebinin koridora taşması bu istisnayı geçersiz hale getirebilir.",
      "Plan kontrolünde yalnız aks ölçüsü değil bitmiş yüzeyler arası net ölçü esas alınmalıdır."
    )),
    section("parsel-ve-su", "Parsel sınırı, yaya sürekliliği ve drenaj rampa tasarımının parçasıdır", phase6Lines(
      "Otopark rampası parsel sınırı dışından başlatılamaz. Giriş-çıkış çözümü ön bahçe, yaya kaldırımı, bina girişi ve komşu parsellerle birlikte değerlendirilmelidir. Rampanın araç kuyruğunu yol alanına taşıması veya yaya güzergâhını kesmesi yalnız mimari konfor sorunu değildir; ruhsat ve trafik koordinasyonu problemidir.",
      "Açık rampadan bodruma yağmur suyu taşınması da tasarım girdisidir. Üst kotta yüzey suyu kesme, alt kotta kanal/ızgara ve pompa-drenaj kapasitesi mekanik proje ile koordine edilmelidir. Eğim sınırını sağlamak su yönetimini otomatik çözmez."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** %20'yi her otopark için genel rampa sınırı sanmak. **Sonuç:** umumi veya ağır vasıta otoparkında %15 sınırı aşılabilir.\n2. **Yanlış:** 2,75 m'yi akslar arası ölçmek. **Sonuç:** perde, kaplama ve korkuluk sonrası net genişlik yetersiz kalır.\n3. **Yanlış:** Dönüş yarıçapını manevra koridoru yerine kullanmak. **Sonuç:** araç 90° dönüşü tamamlayamaz.\n4. **Yanlış:** Kiriş altı yüksekliğini yalnız düz rampada kontrol etmek. **Sonuç:** eğimli kesitte araç üst kotu kirişe yaklaşabilir.\n5. **Yanlış:** Rampayı parsel dışından başlatmak veya yaya sürekliliğini kesmek. **Sonuç:** ruhsat ve saha uygulaması uyuşmaz."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Otoparkın umumi/özel ve araç türü sınıfı belirlendi mi?",
      "- [ ] Rampa eğimi doğru **%15 / %20** sınırıyla kontrol edildi mi?",
      "- [ ] Net rampa genişliği ve dönüş iç yarıçapı en az **2,75 m** mi?",
      "- [ ] Giriş kapısı 2,75 m genişlik ve 2,00 m yüksekliği sağlıyor mu?",
      "- [ ] Kiriş altı dâhil 2,10 m net iç yükseklik kesitte kontrol edildi mi?",
      "- [ ] 90° manevrada 6,00 / 6,50 m veya uygulanabilir 4,90 m tek yön koşulu sağlandı mı?",
      "- [ ] Rampa parsel içinde başlıyor ve yaya güzergâhını güvenli biçimde çözüyor mu?",
      "- [ ] Yağmur suyu, kanal ve drenaj mekanik projeyle koordine edildi mi?"
    )),
  ],
  references: otoparkPhase6References("Madde 4 rampa, giriş, net yükseklik ve sirkülasyon hükümleri"),
  keywords: ["otopark rampası", "%15", "%20", "2,75 m", "6,00 m", "6,50 m", "dönüş yarıçapı"],
  tags: ["Otopark", "Rampa", "Manevra", "Geometri"],
};

const OTOPARK_VENTILATION: DepremPhase6Override = {
  slug: "otopark-kapali-havalandirma-co-konsantrasyonu",
  title: "Kapalı Otopark Havalandırması: CO Kontrolü ile Yangın Duman Tahliyesini Ayırmak",
  description: "Kapalı otoparkta normal kullanım havalandırması ve CO algılama yaklaşımını, BYKHY Madde 60 yangın duman tahliye şartlarından ayırarak mekanik-mimari koordinasyon akışı kurar.",
  seoTitle: "Kapalı Otopark Havalandırması | CO, Madde 60 ve 10 Hava Değişimi",
  seoDescription: "Açık otopark %5 açıklık kriteri, 600 m² yangın sistemleri, 2.000 m² mekanik duman tahliyesi ve saatte 10 hava değişimi şartı; CO sensörlü normal havalandırmadan farkı.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["otopark-rampa-egimi-genislik-donus-yaricapi", "bodrum-otopark-mutfak-yangin-uygulamalari", "otopark-elektrikli-arac-sarj-mevzuati"],
  sections: [
    section("iki-senaryo", "Önce iki işletme senaryosunu ayır: normal hava kalitesi ve yangın", phase6Lines(
      "Kapalı otopark havalandırmasında en kritik mühendislik ayrımı, **normal kullanım hava kalitesi** ile **yangın anındaki duman kontrolünü** tek sistem hesabı gibi görmemektir. CO sensörleri araç egzozuna bağlı normal işletme ihtiyacını yönetebilir; BYKHY Madde 60'taki mekanik duman tahliye şartı ise yangın güvenliği senaryosudur.",
      "Otopark Yönetmeliği kendi başına tek bir evrensel CO ppm alarm değeri vermez. Bu nedenle projede seçilen CO eşiklerinin hangi mekanik standart, idare şartnamesi veya tasarım kriterinden geldiği açıkça yazılmalıdır. Doğrulanmamış bir ppm sayısını 'yönetmelik sınırı' diye sunmak yanlış olur.",
      "Yangın modu; yangın algılama, fan kumandası, damperler, enerji sürekliliği ve itfaiye senaryosu ile ayrıca doğrulanmalıdır."
    )),
    section("madde60", "BYKHY Madde 60: açık/kapalı sınıfı ve alan eşikleri", phase6Lines(
      "Binaların Yangından Korunması Hakkında Yönetmelik Madde 60'a göre dışarıya olan toplam açık alanın döşeme alanının **%5'inden fazla** olması açık otopark sınıflandırmasının temel koşuludur; aksi durumda otopark kapalı kabul edilir. Açıklıkların yerleşimi için ayrıca cephe/kuranglez koşulları vardır.",
      "| Yangın kontrolü | Eşik / koşul |\n|---|---:|\n| Açık otopark sayılabilme | Dışarı açık toplam alan > döşeme alanının %5'i |\n| Kapalı otoparkta sprinkler + yangın dolabı + itfaiye su alma ağzı | Toplam alan > 600 m² |\n| Bağımsız mekanik duman tahliye sistemi | Toplam alan > 2.000 m² |\n| Duman tahliye kapasitesi | Saatte en az 10 hava değişimi |",
      "Bu eşikler 2026 tarihli Bakanlık BYKHY Kılavuzunda da Madde 60 açıklamasıyla gösterilmektedir."
    )),
    section("co-normal-mod", "CO sensörü normal işletme kontrol elemanıdır", phase6Lines(
      "Normal işletmede fanların sürekli tam debide çalıştırılması yerine CO sensörleri, araç yoğunluğu ve hava kalitesi geri bildirimiyle kademeli/VFD kontrollü işletme kurulabilir. Ancak sensör yerleşimi kolon-perde arkasındaki ölü bölgeleri, jet fan akışını, giriş rampasını ve egzoz noktalarını dikkate almalıdır.",
      "Proje paftasında sensör adedi kadar **hangi eşik ve gecikmeyle hangi fan grubunun çalışacağı** da tanımlanmalıdır. Eşik değeri kullanılan standart veya işveren/idare kriterine bağlanmalı; BYKHY'nin 10 hava değişimi şartıyla karıştırılmamalıdır.",
      "Mekanik tasarım, mimari otopark bölmeleri ve yangın zonlarıyla uyumlu değilse sensör okuması doğru olsa bile kirli hava kısa devre akışla tahliye edilemeyebilir."
    )),
    section("debi-ornek", "Sayısal örnek: 2.400 m² kapalı otoparkta yangın modu", phase6Lines(
      "2.400 m² döşeme alanına ve ortalama 2,40 m net hacim yüksekliğine sahip kapalı bir otopark için yaklaşık hacim 2.400 × 2,40 = **5.760 m³** olur. Madde 60 kapsamındaki saatte en az 10 hava değişimi kriteri yalnız hacimsel ön boyutlandırma olarak ele alınırsa 5.760 × 10 = **57.600 m³/h** hava hareketi karşılığı elde edilir.",
      "Bu sayı fan seçimini tek başına bitirmez. Kanal/şaft basınç kaybı, duman sıcaklığı, besleme havası, zonlama, fan dayanımı, kaçış yollarında basınç etkisi ve sistemin binanın diğer havalandırmasından bağımsızlığı ayrıca tasarlanmalıdır.",
      "Normal CO kontrollü modun debisi ise yangın hesabından otomatik türetilmemelidir; iki senaryo ayrı hesaplanıp kontrol otomasyonunda açık biçimde önceliklendirilmelidir."
    )),
    section("mimari-mekanik-koordinasyon", "Şaft, jet fan, kiriş ve kaçış güzergâhını aynı modelde çöz", phase6Lines(
      "Kapalı otoparkın düşük kat yüksekliği nedeniyle duman kanalı, jet fan, sprinkler, aydınlatma ve kirişler aynı sınırlı düşey hacmi paylaşır. Mimari yalnız net 2,10 m yüksekliği gösterip mekanik ekipman kotlarını sonradan eklerse geçiş yüksekliği kaybolabilir.",
      "Hava atış noktaları giriş rampasına veya yaya çıkışına kısa devre yapmamalı; taze hava girişleri egzoz çıkışından etkilenmemelidir. Yangın kaçış kapıları, asansör holleri ve şaft penetrasyonları yangın bölmesi sürekliliğiyle birlikte ele alınmalıdır.",
      "Bu nedenle proje kontrolü plan + kesit + mekanik şema + yangın senaryosu üzerinden yapılmalıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** CO için internette görülen tek bir ppm değerini mevzuat sınırı kabul etmek. **Sonuç:** kaynağı olmayan tasarım kriteri oluşur.\n2. **Yanlış:** Normal havalandırma fanını 10 hava değişimi sağlıyor diye yangın duman fanı saymak. **Sonuç:** bağımsızlık ve yangın dayanımı şartları atlanır.\n3. **Yanlış:** %5 açıklığı yalnız toplam sayı olarak kontrol edip açıklık dağılımını incelememek. **Sonuç:** açık otopark sınıfı yanlış yorumlanabilir.\n4. **Yanlış:** 600 m² ile 2.000 m² eşiklerini karıştırmak. **Sonuç:** sprinkler veya mekanik duman tahliye yükümlülüğü eksik kalır.\n5. **Yanlış:** fan/kanal kotunu kiriş altı geçiş yüksekliğinden bağımsız çözmek. **Sonuç:** saha çakışması ve düşük net yükseklik oluşur."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Otoparkın açık/kapalı sınıfı **%5** açıklık kriteriyle doğrulandı mı?",
      "- [ ] Toplam alan **600 m²** ve **2.000 m²** eşiklerine göre ayrı kontrol edildi mi?",
      "- [ ] >2.000 m² kapalı otoparkta bağımsız sistem ve **saatte en az 10 hava değişimi** sağlanıyor mu?",
      "- [ ] CO eşikleri kullanılan standart/şartname kaynağıyla belgeli mi?",
      "- [ ] Normal mod ile yangın modu otomasyonda ayrı tanımlı mı?",
      "- [ ] Şaft/fan/kanal yerleşimi kiriş, sprinkler ve 2,10 m net yükseklikle koordine edildi mi?",
      "- [ ] Hava giriş-çıkışlarında kısa devre akış ve yaya etkisi kontrol edildi mi?",
      "- [ ] Yangın senaryosu ilgili disiplinlerce birlikte onaylandı mı?"
    )),
  ],
  references: [
    ...otoparkPhase6References("kapalı otopark ve mekanik koordinasyon"),
    { label: "Resmî Gazete — BYKHY Madde 60 otopark hükümleri", href: BYKHY_2009, note: "Kapalı otopark yangın sistemleri ve mekanik duman tahliye esasları." },
    { label: "ÇŞİDB — Binaların Yangından Korunması Hakkında Yönetmelik Kılavuzu, Madde 60", href: BYKHY_2026_GUIDE, note: "2026 yayımlı Bakanlık kılavuzunda otopark eşikleri ve örnekleri." },
  ],
  keywords: ["kapalı otopark", "CO", "Madde 60", "%5", "600 m²", "2.000 m²", "10 hava değişimi"],
  tags: ["Otopark", "Havalandırma", "CO", "Yangın", "Mekanik Koordinasyon"],
};

const OTOPARK_STRUCTURAL: DepremPhase6Override = {
  slug: "otopark-yapisal-yuk-kombinasyonlari-arac-deprem",
  title: "Otopark Taşıyıcı Sistemi: Araç Yükleri, Yük Yolu ve Deprem Tasarımı",
  description: "Otopark döşemesi, rampa, transfer elemanı ve taşıyıcı sistemde araç kullanımını TS 498 yük tanımları ile TBDY 2018 deprem tasarımından ayırır; yanlış ad-hoc yük toplamlarını engeller.",
  seoTitle: "Otopark Yapısal Yükleri ve Deprem | TS 498 + TBDY 2018",
  seoDescription: "Otoparkta araç hareketli yükü, yerel teker etkileri, rampa/transfer elemanları, deprem kütlesi ve TBDY yük kombinasyonu mantığı için yapısal kontrol rehberi.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["tbdy-kutle-kaynagi-hareketli-yuk-katilimi", "otopark-rampa-egimi-genislik-donus-yaricapi", "otopark-elektrikli-arac-sarj-mevzuati"],
  sections: [
    section("kapsam", "Otopark Yönetmeliği geometriyi; yapısal standartlar yükü tanımlar", phase6Lines(
      "Otopark Yönetmeliği araç sayısı, park geometrisi, rampa ve sirkülasyon koşullarını düzenler; döşeme tasarımındaki hareketli yük değerini veya deprem yük birleşimini bu yönetmelikten türetmek doğru değildir. Yapısal yükler için proje tarihinde yürürlükteki **TS 498**, deprem etkileri ve kütle katılımı için **TBDY 2018** ile ilgili taşıyıcı sistem standardı birlikte kullanılır.",
      "Bu ayrım özellikle 'araç yükü + deprem yükü' gibi doğrudan iki sayıyı toplama hatasını önler. Yük durumları tanımlanır, kütle ve hareketli yük katılımı ilgili standarda göre belirlenir, sonra tasarım birleşimleri uygulanır.",
      "Mühendislik sorumluluğu yalnız global modelde alan yükü girmek değil; yerel döşeme, rampa, bariyer ve transfer bölgelerinin ayrı yük yolunu da kontrol etmektir."
    )),
    section("yuk-haritasi", "Yükleri kaynağına ve davranışına göre ayır", phase6Lines(
      "| Yük / etki | Birincil kontrol kaynağı | Yapısal odak |\n|---|---|---|\n| Otopark kullanımından doğan hareketli yük | Güncel TS 498 | Döşeme, kiriş, kolon, temel yük yolu |\n| Yerel teker/yoğun yük etkisi | Güncel yük standardı + proje araç sınıfı | Yerel eğilme, zımbalama, kaplama |\n| Sabit yükler | Gerçek katman ve ekipman ağırlıkları | Tüm taşıyıcı sistem |\n| Deprem etkisi | TBDY 2018 | Kütle, rijitlik, yatay/düşey deprem etkileri |\n| Rampa ve bariyer etkileri | Proje kullanım senaryosu + ilgili standart | Eğimli plak/kiriş, kenar elemanı |\n| Mekanik otopark / şarj ekipmanı | Üretici reaksiyonları + proje standardı | Noktasal/çizgisel yük ve ankraj |",
      "Telifli standardın sayısal tablosunu kopyalamak yerine projede kullanılan güncel TS 498 nüshasındaki araç sınıfı ve kullanım kategorisi doğrulanmalıdır. Bu makale sabit bir kN/m² değeri uydurmaz."
    )),
    section("global-yerel", "Global alan yükü yerel teker ve kolon çevresi kontrolünün yerine geçmez", phase6Lines(
      "Modelde tanımlanan yayılı hareketli yük, katın global davranışını temsil etmek için gerekli olabilir; ancak ince döşeme, mantar/radye benzeri döşeme-kolon birleşimi, konsol kenarı veya rampa başında yerel teker etkisi kritik olabilir. Özellikle kolon çevresi zımbalama, kısa açıklıklı plak eğilmesi ve kenar kiriş torsiyonu ayrı değerlendirilmelidir.",
      "Araç sınıfı değişen otoparklarda — örneğin binek araç alanının servis/teslimat aracına açılması — yük sınıfı da değişebilir. Mimari kullanım notu ile statik proje yük kabulleri eşleşmelidir.",
      "Saha değişikliğiyle kolon arası park düzeni değişirken taşıyıcı sistem yük kabulünün değişmediğini varsaymak hatalıdır."
    )),
    section("deprem-kutlesi", "Deprem kütlesi: hareketli yükün tamamını otomatik kütleye katma", phase6Lines(
      "TBDY 2018'de deprem hesabına esas kütle, sabit yükler ve hareketli yüklerin yönetmelikte tanımlanan katılım yaklaşımıyla oluşturulur. Otopark hareketli yükünün tamamını doğrudan kat kütlesine eklemek de hiç eklememek de genel bir kural değildir; bina kullanım sınıfı ve yük türü üzerinden ilgili TBDY hükmü uygulanmalıdır.",
      "Model kontrolünde yük tanımı ile mass-source/kütle kaynağı ayrı denetlenmelidir. Aynı hareketli yükün hem doğrudan kütleye hem başka bir otomatik mass-source tanımına iki kez girmesi deprem kuvvetini yapay artırabilir.",
      "Bodrum otoparklarda çevre perdeleri, rijitlik geçişi ve üst yapı-bodrum etkileşimi de yalnız araç yükünden bağımsız bir TBDY modelleme problemidir."
    )),
    section("koordinasyon", "Rampa, mekanik sistem ve EV altyapısı yapısal modele geri beslenir", phase6Lines(
      "Rampa plağı eğimli geometri nedeniyle yatay döşemeden farklı mesnetlenebilir; rampanın perdeye, kirişe veya ara sahanlığa bağlandığı bölgelerde yük yolu paftada açık olmalıdır. Mekanik otopark sistemleri, taşıt asansörü, fan grupları, yangın suyu hatları ve elektrikli araç şarj panoları da gerçek ekipman reaksiyonlarıyla modele eklenmelidir.",
      "Elektrikli araç altyapısı nedeniyle sonradan eklenen trafo/pano veya mekanik park ünitesi, başlangıç statik projesinde öngörülmediyse tadilat öncesi taşıyıcı kapasite kontrolü gerekir. 'Otopark zaten araç yüküne göre tasarlandı' cümlesi ağır ekipman için yeterli gerekçe değildir.",
      "Proje koordinasyon tablosunda ekipman adı, ağırlık/reaksiyon kaynağı, ankraj, taşıyıcı eleman ve model yük durumu ayrı tutulmalıdır."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** Araç yükü ile deprem etkisini elle doğrudan toplamak. **Sonuç:** standart yük birleşimi mantığı bozulur.\n2. **Yanlış:** TS 498 hareketli yükünü internetteki eski bir tablo değerinden almak. **Sonuç:** proje standardı ve araç sınıfı doğrulanmamış olur.\n3. **Yanlış:** Yalnız yayılı alan yüküyle yetinmek. **Sonuç:** yerel teker, zımbalama veya konsol etkisi kaçabilir.\n4. **Yanlış:** Mass-source içinde hareketli yükü iki kez tanımlamak. **Sonuç:** deprem kütlesi yapay büyür.\n5. **Yanlış:** Mekanik park/şarj ekipmanını mimari ekipman sayıp statik modele taşımamak. **Sonuç:** noktasal yük ve ankraj kapasitesi eksik kalır."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Otopark kullanım/araç sınıfı mimari ve statik projede aynı mı?",
      "- [ ] Hareketli yükler proje tarihindeki **TS 498** üzerinden doğrulandı mı?",
      "- [ ] Deprem kütlesi ve hareketli yük katılımı **TBDY 2018** hükümleriyle kontrol edildi mi?",
      "- [ ] Global alan yüküne ek olarak gerekli yerel teker/zımbalama kontrolleri yapıldı mı?",
      "- [ ] Rampa ve transfer bölgelerinin yük yolu açık mı?",
      "- [ ] Mekanik otopark, taşıt asansörü ve EV ekipmanı reaksiyonları modele aktarıldı mı?",
      "- [ ] Kütle kaynağında çift sayım olmadığı doğrulandı mı?",
      "- [ ] Statik hesap raporu ile ruhsat eki mimari kullanım senaryosu uyumlu mu?"
    )),
  ],
  references: [
    ...otoparkPhase6References("otopark kullanımı ve geometrik yük kaynağı"),
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018", href: TBDY_PDF, note: "Deprem kütlesi, analiz ve taşıyıcı sistem tasarım hükümleri için birincil kaynak." },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği sayfası", href: TBDY_PAGE, note: "Yönetmeliğin resmî erişim ve yürürlük sayfası." },
  ],
  keywords: ["otopark yapısal yük", "TS 498", "TBDY 2018", "hareketli yük", "deprem kütlesi", "yük yolu"],
  tags: ["Otopark", "Taşıyıcı Sistem", "TS 498", "TBDY 2018", "Yükler"],
};

const OTOPARK_EV: DepremPhase6Override = {
  slug: "otopark-elektrikli-arac-sarj-mevzuati",
  title: "Otoparklarda Elektrikli Araç Şarjı: Mekânsal Zorunluluk, Elektrik Altyapısı ve EPDK Ayrımı",
  description: "Otopark Yönetmeliğindeki EV-ready/şarj ünitesi oranlarını, EPDK Şarj Hizmeti Yönetmeliğinin işletme-lisans hükümlerinden ayırır; mimari, elektrik, yangın ve taşıyıcı koordinasyonunu kurar.",
  seoTitle: "Otopark Elektrikli Araç Şarj Mevzuatı | %5, %10 ve EPDK 2026",
  seoDescription: "20+ otoparkta %5, umumi/AVM otoparklarında %10 EV şartı, 30.000/70.000 m² hızlı şarj eşikleri ve 23 Mart 2026 Şarj Hizmeti Yönetmeliği değişikliği.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk okuma",
  relatedSlugs: ["otopark-yapisal-yuk-kombinasyonlari-arac-deprem", "otopark-kapali-havalandirma-co-konsantrasyonu", "engelsiz-wc-asansor-kapi-boyutlari"],
  sections: [
    section("iki-mevzuat-katmani", "Önce iki mevzuat katmanını ayır", phase6Lines(
      "Elektrikli araç şarjında iki farklı soru vardır: binanın otoparkında **kaç park yerinin şarj ünitesi dâhil elektrikli araca uygun düzenleneceği** ve halka açık/ ticari şarj hizmetinin **hangi işletme-lisans kurallarıyla yürütüleceği**. Birincisi Otopark Yönetmeliği, ikincisi EPDK Şarj Hizmeti Yönetmeliği eksenindedir.",
      "Bu ayrım yapılmazsa bir apartman ruhsatındaki mekânsal yükümlülük ile ticari şarj ağı işletmecisinin lisans yükümlülükleri birbirine karıştırılır. Proje kontrolünde 'EV-ready park yeri' kararı ile 'şarj hizmeti işletme modeli' ayrı satırlarda tutulmalıdır.",
      "23 Mart 2026 tarihli ve 33202 sayılı değişiklik Şarj Hizmeti Yönetmeliğini mobil şarj istasyonları, akıllı şarj, roaming, ödeme ve bilgi güvenliği gibi başlıklarda güncellemiştir."
    )),
    section("otopark-oranlari", "Otopark Yönetmeliği: %5 ve %10 mekânsal oranları", phase6Lines(
      "25 Mart 2021 değişikliğiyle yeni yapılacak yapılarda zorunlu otopark adedi **20 ve üzeriyse**, zorunlu otopark alanlarının 1 adetten az olmamak üzere en az **%5**'inin ilgili standartlara göre şarj ünitesi dâhil elektrikli araçlara uygun düzenlenmesi şartı getirildi.",
      "Yeni yapılacak bölge ve genel otoparklar ile alışveriş merkezi otoparklarında ise en az **%10** oranında elektrikli araç şarjına uygun yer ayrılması esası bulunur. Büyük AVM'lerde hızlı şarj kapasitesi için ayrıca alan eşikleri vardır.",
      "| Proje türü | EV şarj altyapısı temel kontrolü |\n|---|---:|\n| Yeni bina, zorunlu otopark ≥ 20 | En az 1 adet ve en az %5 |\n| Yeni bölge/genel otopark ve AVM otoparkı | En az %10 |\n| AVM yapı inşaat alanı > 30.000 m² | En az 1 hızlı şarj ünitesi |\n| AVM yapı inşaat alanı > 70.000 m² | En az 2 hızlı şarj ünitesi |"
    )),
    section("epdk-2026", "EPDK Şarj Hizmeti Yönetmeliği: mekân değil hizmet işletmesini düzenler", phase6Lines(
      "2 Nisan 2022 tarihli Şarj Hizmeti Yönetmeliği şarj ünitesi ve istasyonlarının kurulması/işletilmesi, şarj ağlarının oluşturulması, lisanslandırma ve kullanıcı haklarını düzenler. 23 Mart 2026 değişikliği kapsamı mobil şarj istasyonları, akıllı şarj sistemleri ve ortak dolaşım gibi yeni işletme katmanlarıyla genişletti.",
      "Bu nedenle yapı ruhsatında %5 şartını sağlamış olmak, halka açık ticari şarj hizmetinin tüm EPDK yükümlülüklerini otomatik karşılamaz. Tersine, bir EPDK işletme modeli bulunması da mimari otopark yerleşimindeki %5/%10 zorunluluğunu ortadan kaldırmaz.",
      "Ruhsat projesinde fiziksel altyapı; işletmeye alma aşamasında ise elektrik piyasası/şarj hizmeti mevzuatı ayrıca doğrulanmalıdır."
    )),
    section("elektrik-altyapi", "Trafo, ana pano, kablo rotası ve yük yönetimini baştan planla", phase6Lines(
      "Şarj ünitesini yalnız duvara asılan cihaz olarak görmek yanlış olur. Güç talebi; bina bağlantı gücü, trafo/pano rezervi, kablo kesiti ve güzergâhı, sayaçlama, koruma düzeni, eşzamanlılık ve dinamik yük yönetimiyle birlikte tasarlanır.",
      "Özellikle çok sayıda park yerinin gelecekte şarja dönüşmesi bekleniyorsa ilk ruhsatta kablo tavası/boru geçişleri, pano yeri ve şaft kapasitesi bırakmak sonradan betonarme eleman delinmesini önler. Kablo rotası yangın bölmelerini geçiyorsa penetrasyon detayları yangın projesiyle koordine edilmelidir.",
      "Elektrik projesindeki güç senaryosu, mekanik havalandırma ve acil durum güç tüketimiyle aynı ana dağıtım sistemi üzerinde kontrol edilmelidir."
    )),
    section("yerlesim-guvenlik", "Park yeri geometrisi, erişilebilirlik ve ekipman korunması", phase6Lines(
      "Şarj ünitesi park cebinin net 2,40 × 4,90 m alanını daraltmamalı; kablo yaya güzergâhına düşmemeli ve araç çarpmasına karşı ekipman konumu fiziksel olarak korunmalıdır. Engelli park yerinin aynı zamanda EV şarj noktası olarak seçilmesi halinde erişilebilir transfer alanı ve cihaz erişim yüksekliği ayrıca çözülmelidir.",
      "Kapalı otoparkta şarj ekipmanı yerleşimi yangın algılama, sprinkler, duman tahliye ve kaçış senaryosundan bağımsız ele alınmamalıdır. Ancak mevcut mevzuatta doğrulanmamış bir 'EV için özel tek yangın mesafesi' üretmek yerine proje özelindeki yangın mühendisliği ve güncel standartlar esas alınmalıdır.",
      "Taşıyıcı sisteme ankrajlanan pano/şarj kaidesi veya sonradan eklenen trafo gibi ekipmanlar statik reaksiyon ve ankraj kontrolüne de girer."
    )),
    section("hatalar", "Sık yapılan hatalar ve teknik sonucu", phase6Lines(
      "1. **Yanlış:** %5 mekânsal şartı EPDK lisansı sanmak. **Sonuç:** yapı mevzuatı ile işletme mevzuatı karışır.\n2. **Yanlış:** %5'i yalnız boş park yeri ayırarak, şarj ünitesi ve altyapı olmadan sağlanmış saymak. **Sonuç:** Yönetmelikteki 'şarj ünitesi dâhil' yaklaşımı eksik kalır.\n3. **Yanlış:** Kablo rotasını betonarme ve yangın bölmelerinden bağımsız çizmek. **Sonuç:** saha delikleri ve yangın durdurucu detay sorunları doğar.\n4. **Yanlış:** 2026 Şarj Hizmeti değişikliğini kontrol etmeden eski işletme şablonunu kullanmak. **Sonuç:** güncel EPDK yükümlülükleri atlanabilir.\n5. **Yanlış:** EV cihazını park cebinin net alanına veya erişilebilir transfer alanına taşırmak. **Sonuç:** otopark/erişilebilirlik geometrisi bozulur."
    )),
    section("kontrol-listesi", "Mühendislik kontrol listesi", phase6Lines(
      "- [ ] Zorunlu otopark adedi 20 ve üzeriyse en az 1 ve **%5** EV şartı kontrol edildi mi?",
      "- [ ] Bölge/genel otopark veya AVM'de **%10** şartı değerlendirildi mi?",
      "- [ ] 30.000 m² / 70.000 m² AVM hızlı şarj eşikleri proje kapsamında mı?",
      "- [ ] Mekânsal Otopark Yönetmeliği yükümlülüğü ile EPDK işletme yükümlülüğü ayrıldı mı?",
      "- [ ] **23 Mart 2026 / 33202** Şarj Hizmeti değişikliği kontrol edildi mi?",
      "- [ ] Trafo, pano, kablo rotası ve gelecekteki kapasite artışı projede çözüldü mü?",
      "- [ ] Cihazlar park cebi, yaya dolaşımı ve erişilebilir alanları daraltmıyor mu?",
      "- [ ] Yangın, mekanik ve taşıyıcı sistem koordinasyonu tamamlandı mı?"
    )),
  ],
  references: [
    ...otoparkPhase6References("elektrikli araç şarj altyapısı ve 25 Mart 2021 değişikliği"),
    { label: "Resmî Gazete — 2 Nisan 2022 / 31797 Şarj Hizmeti Yönetmeliği", href: SARJ_2022, note: "Şarj istasyonu, ağ işletmeciliği ve lisans çerçevesinin temel metni." },
    { label: "Resmî Gazete — 23 Mart 2026 / 33202 Şarj Hizmeti Yönetmeliği değişikliği", href: SARJ_2026, note: "Mobil/akıllı şarj, roaming ve güncel işletme hükümlerini içeren değişiklik." },
  ],
  keywords: ["elektrikli araç", "şarj ünitesi", "%5", "%10", "20 otopark", "30.000 m²", "70.000 m²", "EPDK", "33202"],
  tags: ["Otopark", "Elektrikli Araç", "Şarj", "EPDK", "Elektrik Projesi"],
};

export const DEPREM_PHASE6_BATCH_3_ARTICLES = [
  OTOPARK_MINIMUM_AREA,
  OTOPARK_RAMP,
  OTOPARK_VENTILATION,
  OTOPARK_STRUCTURAL,
  OTOPARK_EV,
] as const;
