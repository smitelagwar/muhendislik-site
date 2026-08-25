import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DUZENSIZLIKLER: DepremPhase3Override = {
  slug: "tbdy-2018-duzensizlikler-rehberi",
  description: "TBDY 2018 Tablo 3.6'daki A1, A2, A3, B1, B2 ve B3 düzensizliklerini sayısal eşikleriyle; her düzensizliğin analiz, modelleme veya taşıyıcı sistem kararına farklı etkisini açıklayan kontrol rehberi.",
  seoTitle: "TBDY 2018 Düzensizlikler | A1 A2 A3 B1 B2 B3 Kontrol Rehberi",
  seoDescription: "Tablo 3.6 A1-A3 ve B1-B3 düzensizlikleri, ηbi, ηci, ηki sınırları, A2/A3 döşeme modeli, B1 R azaltımı ve analiz yöntemi etkileri.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "tablo-3-6-siniflandirma",
      title: "Tablo 3.6: Düzensizlikler aynı sonucu doğuran tek bir grup değil, altı farklı davranış ve kontrol problemidir",
      content: phase3Lines(
        "TBDY 2018 **Tablo 3.6**, plandaki düzensizlikleri A1–A3; düşey doğrultudaki düzensizlikleri B1–B3 olarak sınıflandırır. Her başlığın sayısal veya geometrik tanımı ve yönetmelikte farklı bir sonucu vardır.",
        "",
        "| Tür | Yönetmelik tanımı / eşik | Temel sonuç |",
        "|---|---|---|",
        "| A1 — Burulma | **ηbi > 1.2**, göreli ötelenmeler ± %5 ek dışmerkezlik etkileriyle | Analiz yöntemi seçimini etkiler |",
        "| A2 — Döşeme süreksizliği | Boşluk alanı toplamı > **1/3** brüt kat alanı veya yük aktarımını/rijitliği bozucu süreksizlik | Döşeme içi aktarım açık modellenir |",
        "| A3 — Planda çıkıntı | Çıkıntının iki dik doğrultudaki boyutları ilgili toplam plan boyutlarının **%20**'sinden büyük | Döşeme/diyafram davranışı ayrıntılı incelenir |",
        "| B1 — Zayıf kat | **ηci < 0.80** | Taşıyıcı sistem davranış katsayısı üzerinde sonuç doğurur |",
        "| B2 — Yumuşak kat | **ηki > 2.0** | Analiz yöntemi seçimini etkiler |",
        "| B3 — Düşey eleman süreksizliği | Kolon/perde süreksizlikleri ve yönetmelikte tanımlı aktarma durumları | Geometrik yasak/koşullar uygulanır |",
        "",
        "> [!warning] “Düzensizlik var = dinamik analiz zorunlu” genellemesi yanlıştır",
        "> Yönetmelik her düzensizliğe aynı yaptırımı bağlamaz. Önce türü ve eşiği belirleyin, sonra 3.6.2 ve bağlantılı Bölüm 4 hükümlerindeki özel sonucu uygulayın."
      ),
      subsections: [],
    },
    {
      id: "a1-b2-analiz-yontemi",
      title: "3.6.2.1: A1 burulma ve B2 yumuşak kat düzensizlikleri deprem hesabı yönteminin seçimine doğrudan girer",
      content: phase3Lines(
        "3.6.2.1, A1 Burulma Düzensizliği ile B2 Komşu Katlar Arası Rijitlik Düzensizliğinin deprem hesabı yönteminin seçiminde 4.6 hükümleriyle birlikte dikkate alınmasını ister. A1 için **ηbi > 1.2**, B2 için **ηki > 2.0** eşikleri Tablo 3.6'da tanımlıdır.",
        "",
        "Burulma düzensizliği hesabında göreli kat ötelenmeleri **± %5** ek dışmerkezlik etkilerini içeren sonuçlardan elde edilir. B2 kontrolünde bodrum katların yönetmelikteki ayrımı ve komşu kat ötelenme/rijitlik ilişkisi doğru kurulmalıdır.",
        "",
        "> [!check] Yöntem seçimini sonuçtan sonra yapmayın",
        "> A1 ve B2 göstergelerini ön analizde hesaplayın; eşdeğer deprem yükü veya modal yaklaşım seçimini bu göstergelerden bağımsız bir yazılım varsayımı olarak bırakmayın."
      ),
      subsections: [],
    },
    {
      id: "a2-a3-doseme-modeli",
      title: "3.6.2.2: A2 veya A3 varsa döşemenin deprem kuvvetlerini düşey taşıyıcılara güvenle aktardığı iki boyutlu modelle gösterilir",
      content: phase3Lines(
        "A2 ve A3 düzensizliklerinin temel problemi yalnız plan görüntüsü değildir; kat düzlemindeki kuvvet aktarım yolunun sürekliliğidir. **3.6.2.2**, bu düzensizliklerin bulunduğu katlarda döşemelerin iki boyutlu membran veya kabuk sonlu elemanlarla modellenerek deprem kuvvetlerinin düşey taşıyıcı elemanlara güvenle aktarıldığının hesapla gösterilmesini ister.",
        "",
        "A2'de toplam boşluk alanının brüt kat alanının **1/3**'ünü aşması açık bir tanım koşuludur; ancak boşluk daha küçük olsa bile deprem yük aktarımını kesintiye uğratması veya düzlem içi rijitlik/dayanımda ani azalma yaratması da A2 kapsamına girebilir. A3'te çıkıntının her iki dik doğrultudaki boyutunun toplam plan boyutunun **%20**'sini aşması kontrol edilir.",
        "",
        "> [!engineering] Rijit diyafram etiketi yeterli kanıt değildir",
        "> Büyük boşluk veya çıkıntı bulunan katta kuvvet akışını toplayıcı/başlık bölgeleriyle birlikte okuyun. Döşeme içi çekme-basınç ve kesme aktarımı model sonucunda görünür olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "b1-zayif-kat",
      title: "3.6.2.3: B1 zayıf katta ηci yalnız bir uyarı katsayısı değil, R seçimini ve kabul edilebilir alt sınırı etkiler",
      content: phase3Lines(
        "B1 Komşu Katlar Arası Dayanım Düzensizliği, Tablo 3.6'da **ηci < 0.80** ile tanımlanır. Eğer bina boyunca en küçük dayanım düzensizliği katsayısı **0.60 ≤ ηci,min < 0.80** aralığındaysa, 3.6.2.3 uyarınca Tablo 4.1'den seçilen R katsayısı bütün bina için her iki doğrultuda **1.25 ηci,min** çarpanı ile azaltılarak uygulanır.",
        "",
        "**ηci,min < 0.60** değerine izin verilmez. Bu durumda zayıf katın dayanımı ve rijitliği artırılarak taşıyıcı sistem yeniden düzenlenmeli ve analiz tekrarlanmalıdır.",
        "",
        "> [!warning] Sadece kolon alanını büyütmek otomatik çözüm değildir",
        "> B1 tanımında etkin kesme alanları ve kat dayanımı ilişkisi yönetmelikteki tanıma göre kurulmalıdır. Revizyon sonrası ηci ile birlikte kat rijitliği ve diğer düzensizlikler de yeniden hesaplanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "b3-dussey-sureksizlik",
      title: "B3 düşey taşıyıcı eleman süreksizliği yalnız analiz cezası değildir; bazı geometrik aktarma biçimleri doğrudan yasak veya koşulludur",
      content: phase3Lines(
        "B3, kolon veya perdelerin düşey sürekliliğinin bozulduğu taşıyıcı sistem düzenlerini kapsar. TBDY 3.6.2.4, bu durumları yalnız bir “düzensizlik katsayısı” ile geçiştirmez; kolon ve perdelerin başka elemanlar üzerine oturtulması veya eksenlerinin değiştirilmesi gibi düzenler için özel yasak ve koşullar getirir.",
        "",
        "Bu nedenle B3 tespitinde ilk soru analiz yönteminden önce yük yoludur: düşey taşıyıcı elemandan gelen eksenel kuvvet, moment ve kesme hangi eleman üzerinden temele taşınıyor ve bu aktarım yönetmeliğin izin verdiği geometri içinde mi?",
        "",
        "> [!engineering] Mimari koordinasyon erken yapılmalı",
        "> Transfer katı, kolon kaçıklığı veya perdenin sonlandığı bir mimari karar statik model kurulduktan sonra çözülmesi gereken küçük bir detay değildir. B3 kontrolünü avan proje aşamasına taşıyın."
      ),
      subsections: [],
    },
    {
      id: "karar-akisi",
      title: "Düzensizlik kontrolü için doğru sıra: tanımla → eşiği hesapla → özel yönetmelik sonucunu uygula → modeli yeniden doğrula",
      content: phase3Lines(
        "Düzensizliklerin tamamını tek bir “var/yok” sütununda toplamak proje kontrolünde bilgi kaybettirir. A1 ve B2 analiz yöntemi seçimini; A2/A3 döşeme modelini ve yük aktarımını; B1 R katsayısını ve minimum kat dayanımını; B3 ise düşey yük yolu geometrisini farklı biçimlerde etkiler.",
        "",
        "En güvenli iş akışı her katta ve her deprem doğrultusunda düzensizlik matrisini üretmek, yönetmelik sonucunu aynı satırda göstermek ve model revizyonundan sonra göstergeleri yeniden hesaplamaktır.",
        "",
        "> [!check] Sonuç tablosunda yalnız katsayı değil karar da olsun",
        "> Örneğin `A2 = var` satırının karşısında “kat döşemesi 2B sonlu eleman modeliyle çözüldü ve aktarım kontrol edildi” gibi uygulanmış karar yer almalıdır."
      ),
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık yapılan yorum hataları: eşikleri yaklaşık okumak ve bir düzensizliğin yaptırımını diğerine taşımak",
      content: phase3Lines(
        "- A1 için yalnız kütle merkezi–rijitlik merkezi mesafesine bakıp **ηbi > 1.2** hesabını yapmamak.",
        "- A2'yi yalnız `boşluk > 1/3` koşuluna indirgemek ve yük aktarımını bozan daha küçük boşlukları görmezden gelmek.",
        "- A3'te yalnız tek doğrultudaki çıkıntıyı kontrol etmek; tanımın iki dik doğrultudaki **%20** koşulunu atlamak.",
        "- B1'de **0.60** alt sınırını “daha büyük R azaltımıyla çözülebilir” sanmak.",
        "- B2 bulunduğunda otomatik olarak her analiz yönteminin yasak olduğunu varsaymak yerine 4.6 seçim koşullarını okumamak.",
        "- B3'ü yazılımın düzensizlik raporuna bırakıp gerçek düşey yük yolunu pafta üzerinden denetlememek.",
        "",
        "> [!warning] Düzensizlik raporu model doğruluğunu kanıtlamaz",
        "> Yazılım yalnız tanımlanan geometriden ve rijitliklerden sonuç üretir. Döşeme boşluğu, kot, perde/kolon sürekliliği veya diyafram tanımı yanlışsa “düzensizlik yok” sonucu güvenilir değildir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- **Tablo 3.6** kapsamındaki A1, A2, A3, B1, B2 ve B3 her kat/doğrultu için ayrı tarandı mı?",
        "- A1 için **ηbi > 1.2** ve **± %5** ek dışmerkezlikli ötelenmeler doğru hesaplandı mı?",
        "- A2 için boşluk alanı **1/3** sınırı yanında yük aktarımı ve düzlem içi rijitlik süreksizliği de kontrol edildi mi?",
        "- A3 çıkıntıları iki dik doğrultuda **%20** sınırıyla denetlendi mi?",
        "- A2/A3 bulunan katlar **3.6.2.2** uyarınca iki boyutlu membran/kabuk elemanlarla modellendi mi?",
        "- B1 için **ηci < 0.80**, **0.60** alt sınırı ve gerekiyorsa **1.25 ηci,min** R düzeltmesi uygulandı mı?",
        "- B2 için **ηki > 2.0** göstergesi ve 4.6 analiz yöntemi koşulları birlikte değerlendirildi mi?",
        "- B3 bulunan bölgelerde 3.6.2.4'ün düşey eleman sürekliliği ve aktarma koşulları pafta/model üzerinden doğrulandı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 3; Tablo 3.6, Madde 3.6.2 ve bağlantılı 4.5.6 / 4.6"),
  keywords: ["TBDY 2018", "düzensizlik", "A1", "A2", "A3", "B1", "B2", "B3", "burulma", "zayıf kat", "yumuşak kat"],
  tags: ["TBDY 2018", "Düzensizlikler", "Tablo 3.6", "Analiz Kontrolü"],
};
