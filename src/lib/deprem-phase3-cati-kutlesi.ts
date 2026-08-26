import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_CATI_KUTLESI: DepremPhase3Override = {
  slug: "tbdy-cati-agirligi-yuk-azaltma",
  description: "TBDY 2018 Madde 4.5.9.2'ye göre deprem kütlesinde sabit ve hareketli yük katılımını; Tablo 4.3 n katsayılarını ve çatı ağırlığında kar yükünün %30'unun dikkate alınması özel hükmünü açıklar.",
  seoTitle: "TBDY 2018 Çatı Kütlesi | Kar Yükünün %30'u ve n Katsayısı",
  seoDescription: "TBDY 4.5.9.2, Denklem 4.16, Tablo 4.3, hareketli yük kütle katılımı ve çatıda kar yükünün %30'u için proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "cati-kutlesi-kavrami",
      title: "Çatı için genel bir 'deprem yükü azaltma katsayısı' yoktur",
      content: phase3Lines(
        "Bu konudaki en yaygın kavram hatası, çatıdaki tüm hareketli yüklerin tek bir özel katsayıyla azaltıldığı varsayımıdır. TBDY 4.5.9.2'nin kurduğu sistem farklıdır: deprem hesabına esas kütle, sabit yük ile kullanım türüne bağlı hareketli yük kütle katılımının toplamından oluşturulur; çatı için ayrıca kar yüküne ilişkin özel `%30` hükmü vardır.",
        "",
        "Dolayısıyla bu yazıdaki 'azaltma', taşıyıcı sistem R katsayısıyla deprem kuvvetini azaltmak değildir. Konu yalnızca deprem kütlesine hangi düşey yük paylarının katılacağını belirlemektir.",
        "",
        "> [!warning] Başlığı doğru yorumlayın",
        "> `%30` değeri genel bir çatı hareketli yük indirimi değildir. TBDY'nin açık özel hükmü, **çatı katı ağırlığının hesabında kar yüklerinin %30'unun** göz önüne alınmasıdır."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-16",
      title: "4.5.9.2 ve Denklem 4.16: deprem kütlesi G + nQ mantığıyla kurulur",
      content: phase3Lines(
        "TBDY Denklem (4.16), düğüm noktalarına dağıtılan deprem ağırlığı için `w_j^(S) = w_G,j^(S) + n w_Q,j^(S)` ve buna karşı gelen kütle için `m_j^(S) = w_j^(S) / g` ilişkisini tanımlar.",
        "",
        "Burada `n`, hareketli yükün deprem kütlesine katılım katsayısıdır ve keyfî seçilmez; Tablo 4.3'te bina kullanım türüne göre verilir. Aynı kattaki sabit kaplama, bölme duvarı ve kalıcı ekipman gibi yüklerin doğru yük durumlarına atanması da kütle kaynağının parçasıdır.",
        "",
        "Bu Denklem (4.16) için sitenin mevcut `tbdy-kutle-kaynagi-hareketli-yuk-katilimi` makalesi ayrıntılı source-of-truth'tur; burada aynı formülü ikinci bir bağımsız formül bloğu olarak çoğaltmak yerine çatıya özgü kararları öne çıkarıyoruz.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> G, Q, kullanım sınıfından gelen n değeri ve çatı kar yükü tanımı SOURCE_VALUE girdileridir. Yazılımın varsayılan mass source tanımı proje kullanımını bilmez."
      ),
      subsections: [],
    },
    {
      id: "tablo-4-3",
      title: "Tablo 4.3: n katsayısı çatı katı adına değil bina kullanımına bağlıdır",
      content: phase3Lines(
        "TBDY Tablo 4.3 hareketli yük kütle katılım katsayısını kullanım türlerine göre gruplar:",
        "",
        "| Bina kullanım örnekleri | n |",
        "|---|---:|",
        "| Depo, antrepo vb. | 0.80 |",
        "| Okul, öğrenci yurdu, spor tesisi, sinema, tiyatro, konser salonu, ibadethane, lokanta, mağaza vb. | 0.60 |",
        "| Konut, işyeri, otel, hastane, otopark vb. | 0.30 |",
        "",
        "Bu katsayılar 'çatıda hangi n kullanılır?' sorusuna çatı geometrisine bakarak cevap vermez. Önce binanın ve ilgili kullanımın Tablo 4.3 sınıfı belirlenir.",
        "",
        "> [!check] Karma kullanım",
        "> Farklı kullanım bölgeleri bulunan yapılarda tek bir n değerini tüm kütle kaynağına körlemesine uygulamayın; yükün ait olduğu kullanım bölgesi ve modeldeki dağılımı ayrıca izlenmelidir."
      ),
      subsections: [],
    },
    {
      id: "cati-kar-yuku",
      title: "Çatıya özgü açık hüküm: kar yüklerinin %30'u ağırlığa katılır",
      content: phase3Lines(
        "TBDY 4.5.9.2, Tablo 4.3'ten ayrı olarak şu özel çatı kuralını verir: **Çatı katı ağırlığının hesabında kar yüklerinin %30'u göz önüne alınacaktır.** Bu ifade deprem kütle kaynağında kar yükünün ele alınmasına ilişkindir.",
        "",
        "Dolayısıyla çatı katında kar yükünü tamamen sıfırlamak da, kar yükünün tamamını otomatik olarak deprem kütlesine katmak da bu hükmün yerine geçmez. Modelde kar yükü için ayrı yük durumu tanımlanmalı ve deprem kütlesine `%30` oranında katıldığı doğrulanmalıdır.",
        "",
        "Çatıda ayrıca kullanım kaynaklı başka hareketli yükler varsa bunların sınıflandırması kendi niteliğine göre değerlendirilir; kar yükü `%30` kuralını başka yük türlerine genellemek doğru değildir.",
        "",
        "> [!warning] %30 iki farklı yerde görülebilir",
        "> Tablo 4.3'te bazı bina kullanımları için `n = 0.30` bulunması ile çatı kar yükünün `%30` alınması sayısal olarak aynı görünür, fakat mevzuat gerekçeleri farklıdır. Bunları aynı kural gibi birleştirmeyin."
      ),
      subsections: [],
    },
    {
      id: "ozel-yuklar",
      title: "Sabit endüstriyel ekipman ve vinç yükleri için ayrıca açık hükümler vardır",
      content: phase3Lines(
        "4.5.9.2'ye göre endüstriyel binalarda sabit ekipman ağırlıkları için `n = 1` alınır. Buna karşılık vinç kaldırma yükleri kat ağırlıklarının hesabında göz önüne alınmaz.",
        "",
        "Bu ayrım, 'hareketli görünen her şeyi n ile çarp' yaklaşımının neden yetersiz olduğunu gösterir. Yükün fiziksel niteliği ve yönetmelikteki özel tanımı belirleyicidir.",
        "",
        "Çatı katında mekanik cihaz, su deposu, güneş paneli taşıyıcıları veya sabit teknik ekipman varsa bunların kalıcı/sabit yük niteliği doğru kurulmalı; kar ve kullanım hareketli yüklerinden ayrı izlenmelidir.",
        "",
        "> [!check] Kütle kaynağı tablosu",
        "> Her yük durumunu 'tam katılır / n ile katılır / özel oranla katılır / katılmaz' biçiminde sınıflandıran kısa bir kütle kaynağı tablosu oluşturmak, yazılım modelini denetlemenin en güvenli yoludur."
      ),
      subsections: [],
    },
    {
      id: "ofis-kontrol-akisi",
      title: "Ofis kontrol akışı: çatı yük listesinden modal kütleye",
      content: phase3Lines(
        "1. Çatıdaki tüm kalıcı yükleri, sabit ekipmanları, kullanım hareketli yüklerini ve kar yükünü ayrı yük durumları olarak listeleyin.",
        "2. Kalıcı yüklerin deprem kütlesine tam katıldığını; kullanım hareketli yüklerinin Tablo 4.3 n katsayısıyla işlendiğini kontrol edin.",
        "3. Çatı kar yükü için 4.5.9.2 özel `%30` katılımını tanımlayın.",
        "4. Endüstriyel sabit ekipmanda `n = 1`; vinç kaldırma yüklerinde kat ağırlığına katılmama hükmünü gerekiyorsa uygulayın.",
        "5. Yazılımın toplam kat kütlesini elle hazırlanmış `G + nQ + 0.30 kar` kontrolüyle karşılaştırın.",
        "6. Kütle merkezinin ve modal kütle katılımının beklenmedik şekilde değişmediğini kontrol edin.",
        "",
        "Çatı kütlesindeki hata, yalnız çatı katı iç kuvvetlerini değil binanın periyotlarını, modal şekillerini, taban kesmesini ve kat kuvveti dağılımını etkileyebilir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- 4.5.9.2 ve Denklem (4.16) kapsamındaki `G + nQ` kütle kaynağı mantığı doğru mu?",
        "- Tablo 4.3 kullanım sınıfına göre `0.80`, `0.60` veya `0.30` n katsayısı doğru seçildi mi?",
        "- Çatı kar yüklerinin `%30'u` deprem ağırlığına katıldı mı?",
        "- `%30` kar hükmünün genel bir çatı hareketli yük indirimi değildir ifadesi proje notlarında doğru yorumlandı mı?",
        "- Endüstriyel sabit ekipman gerekiyorsa `n = 1` ile mi ele alındı?",
        "- Vinç kaldırma yükleri kat ağırlığından hariç tutuldu mu?",
        "- Çatıdaki sabit teknik ekipmanlar kar ve kullanım hareketli yüklerinden ayrı mı tanımlandı?",
        "- Yazılım kütle kaynağı ile elle hazırlanmış kat ağırlığı kontrolü uyuşuyor mu?",
        "- Çatı kütlesi değişiminin modal kütle, periyot ve taban kesmesine etkisi gözden geçirildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.5.9.2; Denklem (4.16) ve Tablo 4.3"),
  keywords: ["çatı kütlesi", "kar yükü %30", "hareketli yük katılımı", "Tablo 4.3", "Denklem 4.16", "TBDY 2018"],
  tags: ["TBDY 2018", "Çatı Kütlesi", "Kar Yükü", "Kütle Kaynağı"],
};
