import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DOGRUSAL_OLMAYAN: DepremPhase3Override = {
  slug: "tbdy-2018-dogrusal-olmayan-tasarim",
  description: "TBDY 2018 Bölüm 5'e göre Şekildeğiştirmeye Göre Değerlendirme ve Tasarım yaklaşımını; doğrusal olmayan model, plastik mafsal/fiber idealizasyonu, itme analizi ve zaman tanım alanında çözümün uygulanma koşullarıyla açıklar.",
  seoTitle: "TBDY 2018 Doğrusal Olmayan Analiz | ŞGDT ve Bölüm 5 Rehberi",
  seoDescription: "TBDY Bölüm 5 ŞGDT, plastik mafsal, tek modlu ve çok modlu itme, zaman tanım alanında doğrusal olmayan analiz ve yöntem seçim koşulları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "sgdt-kapsami",
      title: "ŞGDT yalnız mevcut bina pushover analizi değildir; TBDY Bölüm 5 farklı bina ve performans hedeflerini kapsar",
      content: phase3Lines(
        "TBDY 5.1.3, Şekildeğiştirmeye Göre Değerlendirme ve Tasarım (ŞGDT) yaklaşımını yalnız mevcut binalara veya tek bir itme analizine indirgemez. Bölüm 5 hükümleri; Bölüm 13 kapsamındaki yüksek binalar, Bölüm 15 kapsamındaki mevcut binalar ve Bölüm 14 kapsamındaki deprem yalıtımlı binalar dahil olmak üzere ilgili performans hedeflerinde kullanılabilir veya zorunlu hale gelir.",
        "",
        "| Karar başlığı | Yönetmelik çerçevesi | Proje sorusu |",
        "|---|---|---|",
        "| Performans hedefi | 5.1.3 + Tablo 3.4 / 3.5 | Hangi deprem yer hareketi düzeyinde hangi performans hedefi aranıyor? |",
        "| Doğrusal olmayan model | 5.3 | Plastik davranış yığılı mı, yayılı mı temsil edilecek? |",
        "| İtme analizi | 5.5–5.6 | Tek modlu yöntemin koşulları sağlanıyor mu, çok modlu yöntem gerekli mi? |",
        "| Zaman tanım alanı | 5.7 | Kayıt seçimi, eşzamanlı bileşenler ve analiz seti doğru mu? |",
        "",
        "> [!warning] Kapsamı daraltmayın",
        "> Eski içerikteki “mevcut bina = pushover = doğrusal olmayan analiz” eşitliği doğru değildir. Pushover, ŞGDT araçlarından biridir; yöntem seçimi bina yüksekliği, dinamik özellikler ve ilgili bölüm hükümlerine göre yapılır."
      ),
      subsections: [],
    },
    {
      id: "baslangic-yukleme-adimi",
      title: "5.2.2.2: Deprem hesabından önce düşey yükler doğrusal olmayan statik başlangıç adımında uygulanır",
      content: phase3Lines(
        "ŞGDT hesabı doğrudan sıfır iç kuvvet ve sıfır şekil değiştirme durumundan başlatılmaz. 5.2.2.2, deprem dışı düşey yüklerin doğrusal olmayan statik hesapla artımsal biçimde uygulanmasını; bu adım sonunda oluşan iç kuvvet ve şekil değiştirmelerin deprem hesabının başlangıç durumu olarak alınmasını ister.",
        "",
        "Yeni veya güçlendirilen binalarda bu başlangıç yükleme adımında doğrusal olmayan şekil değiştirmeye izin verilmemesi, modelin düşey yükler altında daha deprem başlamadan plastikleşmesini önleyen önemli bir kontrol kapısıdır.",
        "",
        "> [!engineering] Yazılım kontrolü",
        "> Analiz dosyasında gravity/nonlinear-static başlangıç durumunun gerçekten deprem çözümüne başlangıç koşulu olarak aktarıldığını kontrol edin; yalnız yük kombinasyonunun tanımlı olması yeterli değildir."
      ),
      subsections: [],
    },
    {
      id: "plastik-davranis-modeli",
      title: "5.3: Plastik davranış yığılı plastik mafsal veya yayılı plastik/fiber modelle temsil edilebilir",
      content: phase3Lines(
        "5.3.1 hükümleri, çerçeve sonlu elemanlarında ve 4.5.3.8 koşullarını sağlayan betonarme perdelerde yığılı plastik davranış modelinin kullanılmasına izin verir. Plastik şekil değiştirmelerin toplandığı plastik mafsal boyu için pratik idealizasyon **Lp ≈ 0.5h** olarak tanımlanır; mafsalın teorik konumu plastikleşme bölgesinin orta noktasıdır ve uygulamada uygun yaklaşık konumlandırma yapılabilir.",
        "",
        "Yayılı plastik modellerde doğrusal olmayan davranış eleman boyunca dağıtılır. Özellikle perdelerde fiber kesit yaklaşımı, eksenel kuvvet–eğilme etkileşimini ve kesit boyunca malzeme davranışını daha doğrudan temsil edebilir.",
        "",
        "> [!check] Mafsal tanımı sonuç değil girdidir",
        "> Otomatik mafsal ataması kullanılsa bile moment-dönme veya moment-eğrilik parametrelerinin eleman geometrisi, malzeme ve donatı bilgisiyle uyumunu bağımsız olarak doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "yontem-secimi",
      title: "5.5: Tek modlu, çok modlu ve zaman tanım alanında doğrusal olmayan yöntemlerin uygulanma alanları aynı değildir",
      content: phase3Lines(
        "TBDY 5.5.2.1 uyarınca tek modlu itme yöntemleri yalnız **BYS ≥ 5** olan ve 5.6.2.2'deki ek dinamik koşulları sağlayan binalarda uygulanabilir. Çok modlu itme yöntemleri **BYS ≥ 2** olan binalarda kullanılabilir. Zaman tanım alanında doğrusal olmayan hesap ise bütün binalarda uygulanabilir ve BYS = 1 yüksek binalarda Bölüm 13 bağlantısıyla zorunlu hale gelir.",
        "",
        "Bu nedenle yöntem seçimi “en kolay çözümü” tercih etme adımı değildir. Yapının birinci mod hâkimiyeti, burulma davranışı, bina yükseklik sınıfı ve hedef performans düzeyi birlikte okunmalıdır.",
        "",
        "> [!warning] BYS tek başına yeterli değildir",
        "> Tek modlu itme için BYS koşulunun yanında 5.6.2.2'nin burulma ve modal kütle koşulları da birlikte sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "tek-modlu-itme-kosullari",
      title: "5.6.2.2: Tek modlu itmede burulma düzensizliği ve birinci mod etkin kütle payı ayrıca sınanır",
      content: phase3Lines(
        "Tek modlu itme analizinin kullanılabilmesi için ilgili deprem doğrultusunda, ek dışmerkezlik dikkate alınmaksızın burulma düzensizliği katsayısının **ηbi < 1.4** olması gerekir. Ayrıca hâkim birinci moda ait taban kesme kuvveti modal etkin kütlesinin toplam bina kütlesine oranı en az **0.70** olmalıdır.",
        "",
        "Bu iki koşul, tek bir yatay yük deseniyle temsil edilen birinci mod davranışının binanın gerçek dinamik cevabını yeterince temsil edip etmediğini sınar. Koşullardan biri sağlanmıyorsa “pushover yaptım” demek yönetmelik yöntem şartını sağlamaz.",
        "",
        "> [!check] Ön analiz",
        "> Doğrusal modal analizden ηbi ve modal etkin kütle oranlarını raporlayın; doğrusal olmayan analize geçmeden önce yöntem uygunluğunu bu verilerle belgeleyin."
      ),
      subsections: [],
    },
    {
      id: "zaman-tanim-alani",
      title: "5.7.2.1: Zaman tanım alanında doğrusal olmayan hesapta kayıt seti ve iki yatay bileşenin birlikte uygulanması kontrol edilir",
      content: phase3Lines(
        "Zaman tanım alanında doğrusal olmayan analizde deprem kayıtları Bölüm 2.5'e göre seçilir ve ölçeklenir. 5.7.2.1 kapsamında **en az onbir** deprem yer hareketi takımı kullanılır; iki yatay bileşen yapının birbirine dik ana eksenlerinde eşzamanlı uygulanır ve eksenler 90° döndürülerek analiz tekrarlanır.",
        "",
        "Tek bir kayıtla elde edilen en büyük deplasman veya plastik dönme değeri tasarım cevabı olarak kullanılamaz. Kayıt setinin spektral uyumu, ölçekleme yöntemi ve her iki yatay bileşenin eşzamanlı etkisi analiz raporunun ayrılmaz parçasıdır.",
        "",
        "> [!engineering] Tekrarlanabilirlik",
        "> Kullanılan kayıt kimliği, ölçek katsayısı, yönlendirme, zaman adımı ve sönüm kabullerini dosyada saklayın; aynı modelin başka bir mühendis tarafından yeniden çözülebilmesi hedeflenmelidir."
      ),
      subsections: [],
    },
    {
      id: "performans-sonuclari",
      title: "Sonuç okuma: sünek davranış şekil değiştirmelerle, gevrek davranış ise iç kuvvetlerle değerlendirilir",
      content: phase3Lines(
        "ŞGDT'nin temel farkı, bütün eleman kontrollerini yalnız elastik iç kuvvet büyüklüğü üzerinden yapmamasıdır. Sünek davranış modlarında plastik şekil değiştirme talepleri ilgili sınırlarla karşılaştırılır; gevrek davranış modlarında ise dayanım esaslı iç kuvvet kontrolleri korunur.",
        "",
        "Bu nedenle yalnız tepe deplasmanına veya tek bir mafsal renk haritasına bakarak performans kararı verilmez. Kat ötelenmeleri, plastik dönmeler/eğrilikler, kesme gibi gevrek talepler, P-Delta etkileri ve düşey taşıyıcı sürekliliği birlikte okunmalıdır.",
        "",
        "> [!warning] Renk skalası performans kararı değildir",
        "> Programın mafsal renkleri ancak kullanılan sınır değerleri ve mafsal tanımları doğrulanmışsa anlamlıdır. Yönetmelik performans kontrolünü eleman bazlı ve bina ölçeğinde birlikte yürütün."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Performans hedefi ve deprem yer hareketi düzeyi Tablo 3.4 / 3.5 ile eşleştirildi mi?",
        "- ŞGDT kullanımının ilgili bina türü ve TBDY bölümü için zorunlu/izinli olma durumu doğrulandı mı?",
        "- 5.2.2.2 düşey yük başlangıç adımı deprem çözümünden önce doğrusal olmayan statik olarak çalıştırıldı mı?",
        "- Yığılı plastik model kullanılıyorsa mafsal özellikleri ve **Lp ≈ 0.5h** kabulü eleman bazında kontrol edildi mi?",
        "- Tek modlu itme için **BYS ≥ 5**, **ηbi < 1.4** ve modal etkin kütle oranı **≥ 0.70** birlikte sağlanıyor mu?",
        "- Çok modlu itme için **BYS ≥ 2** koşulu ve yöntemin diğer hükümleri kontrol edildi mi?",
        "- Zaman tanım alanı çözümünde en az onbir kayıt takımı, eşzamanlı iki yatay bileşen ve 90° yön değiştirme uygulanıyor mu?",
        "- Sünek şekil değiştirme talepleri ile gevrek iç kuvvet talepleri ayrı kontrol mantıklarıyla değerlendirildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 5; özellikle 5.1.3, 5.2.2, 5.3, 5.5, 5.6 ve 5.7"),
  keywords: ["TBDY 2018", "ŞGDT", "doğrusal olmayan analiz", "pushover", "plastik mafsal", "zaman tanım alanı", "performans"],
  tags: ["TBDY 2018", "Bölüm 5", "ŞGDT", "Doğrusal Olmayan Analiz"],
};
