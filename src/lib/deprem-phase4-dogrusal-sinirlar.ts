import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_DOGRUSAL_SINIRLAR: DepremPhase4Override = {
  slug: "mevcut-bina-dogrusal-degerlendirme-sinirlari",
  description: "TBDY 15.5'e göre mevcut binalarda doğrusal hesap yöntemlerini, Ra=1 kabullerini, EKO tanımını ve yöntemin uygulanamayacağı BYS, B3 ve EKO tabanlı sınırları açıklar.",
  seoTitle: "Mevcut Binada Doğrusal Değerlendirme Sınırları | TBDY 15.5",
  seoDescription: "TBDY 15.5'e göre eşdeğer deprem yükü ve mod birleştirme yöntemleri, EKO hesabı, BYS<5, B3 düzensizliği ve doğrusal yöntemden çıkış koşulları.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "yontemler",
      title: "Bölüm 15'te doğrusal değerlendirme iki hesap yöntemiyle yapılır",
      content: phase4Lines(
        "TBDY 15.5.1, mevcut binaların deprem performansının doğrusal hesapla belirlenmesinde iki yöntemi tanımlar: Bölüm 4.7'deki **Eşdeğer Deprem Yükü Yöntemi** ve 4.8.2'deki **Mod Birleştirme Yöntemi**. Ancak Bölüm 15 bu yöntemlere ek kurallar getirir.",
        "",
        "Doğrusal yöntemi seçmek, taşıyıcı sistemin elastik kaldığını varsaymak değildir. Elemanların doğrusal analizden elde edilen iç kuvvetleri, kapasite ve hasar sınırı değerlendirmelerinde Bölüm 15'in EKO ve şekildeğiştirme kurallarıyla işlenir."
      ),
      subsections: [],
    },
    {
      id: "ra-kabulleri",
      title: "15.5.1'de azaltılmış tasarım depremi değil Ra = 1 kullanılır",
      content: phase4Lines(
        "Eşdeğer Deprem Yükü Yönteminde yöntemin uygulanabileceği binalar önce **Tablo 4.4** ile kontrol edilir. TBDY 15.5.1.1 ayrıca mevcut bina performans hesabında ek dışmerkezlik uygulanmayacağını ve taban kesme kuvvetinin hesabında **Ra = 1** alınacağını belirtir.",
        "",
        "Mod Birleştirme Yönteminde de 15.5.1.2 uyarınca **Ra = 1** kullanılır. Uygulanan deprem doğrultusu/yönüyle uyumlu eleman iç kuvvetlerinin ve kapasitelerinin hesabında, o doğrultuda hakim moddan elde edilen iç kuvvet yönleri esas alınır."
      ),
      subsections: [],
    },
    {
      id: "eko",
      title: "EKO doğrusal yöntemin temel eleman göstergesidir",
      content: phase4Lines(
        "TBDY 15.5.2.1, doğrusal yöntemlerin betonarme sistemler için uygulama sınırlarının belirlenmesinde kiriş, kolon ve perde kesitlerinin **eğilme etki/kapasite oranı (EKO)** değerlerini kullanır.",
        "",
        "15.5.2.3'e göre sünek kiriş, kolon ve perde kesitlerinde EKO; düşey yükler ve deprem etkisi altında **Ra = 1** alınarak hesaplanan toplam kesit momentinin kesit moment kapasitesine oranıdır. Deprem kuvvetinin yönü hesaba katılır. Kolon ve perde moment kapasitelerine karşılık gelen eksenel kuvvetler ise düşey yükler ile **Ra = 4** alınarak hesaplanan deprem yüklerinin ortak etkisi altında belirlenir."
      ),
      subsections: [],
    },
    {
      id: "ilk-iki-yasak",
      title: "15.5.3.1'in ilk iki mutlak çıkış koşulu: BYS < 5 ve B3 düzensizliği",
      content: phase4Lines(
        "Doğrusal hesap yöntemleri aşağıdaki durumlardan **herhangi biri** oluşursa uygulanamaz:",
        "",
        "| Koşul | Sonuç |",
        "|---|---|",
        "| **BYS < 5** | Doğrusal yöntem kullanılamaz |",
        "| Binada 3.6.2.4'te tanımlanan **B3 düzensizliği** bulunması | Doğrusal yöntem kullanılamaz |",
        "",
        "Bu iki kontrol analize başlamadan önce yapılabilir. Yani yalnız 'EKO'lar düşük çıktı' gerekçesiyle BYS veya B3 kısıtı aşılmaz."
      ),
      subsections: [],
    },
    {
      id: "eko-sinirlari",
      title: "Üst kat dışındaki katlarda üç ayrı EKO tabanlı çıkış koşulu vardır",
      content: phase4Lines(
        "TBDY 15.5.3.1(c)–(e), binanın **üst katı haricindeki herhangi bir katında** ve her deprem doğrultusunda aşağıdaki koşullardan biri oluşursa doğrusal yöntemi yasaklar:",
        "",
        "1. Düşey sünek elemanların (kolon, perde, güçlendirilmiş bölme duvarı) kesme kuvvetiyle ölçeklendirilmiş ortalama EKO'su, deprem yönündeki kirişlerin ortalama EKO'sundan büyükse.",
        "2. Sünek perde, sünek kolon ve güçlendirilmiş bölme duvarlarının kesme kuvvetiyle ölçeklendirilmiş ortalama EKO'su **3'ten büyükse**.",
        "3. İlgili deprem doğrultusundaki sünek kirişlerin ortalama EKO'su **5'ten büyükse**.",
        "",
        "Bu sınırlar yalnız tek bir kritik elemanın EKO değerine bakılarak değil, yönetmeliğin tarif ettiği kat ve eleman grubu ortalamalarıyla değerlendirilir."
      ),
      subsections: [],
    },
    {
      id: "agirlikli-eko",
      title: "Kesme kuvvetiyle ölçeklendirilmiş EKO aritmetik ortalama değildir",
      content: phase4Lines(
        "TBDY 15.5.3.2, (c) ve (d) maddelerinde kullanılacak ölçeklendirilmiş EKO'yu Denk.(15.1) ile tanımlar. Mantık, ilgili kattaki eleman EKO değerlerini o elemanların kesme kuvvetleriyle ağırlıklandırmaktır:",
        "",
        "**Ölçeklendirilmiş EKO = Σ(Vi × EKOi) / ΣVi**",
        "",
        "Burada `Vi` ilgili elemanda hesaplanan kesme kuvvetidir. Basit aritmetik ortalama kullanmak, yüksek kesme taşıyan elemanların etkisini azaltarak 15.5.3 sınır kararını değiştirebilir."
      ),
      subsections: [],
    },
    {
      id: "yontemden-cikis",
      title: "Herhangi bir sınır aşılırsa 15.6'daki doğrusal olmayan yönteme geçilir",
      content: phase4Lines(
        "TBDY 15.5.3.3 nettir: 15.5.3.1(a)–(e) koşullarından herhangi biri oluşuyorsa bina **15.6'da verilen doğrusal olmayan hesap yöntemlerinden biriyle** değerlendirilir.",
        "",
        "15.6.2 mevcut veya güçlendirilmiş binalar için Tek Modlu İtme, Çok Modlu İtme ve Zaman Tanım Alanında Doğrusal Olmayan Hesap yöntemlerini tanımlar. Bu nedenle doğrusal yöntem sınırı aşıldığında çözüm, EKO limitini yapay biçimde değiştirmek veya elemanları analiz dışında bırakmak değil yöntem sınıfını değiştirmektir."
      ),
      subsections: [],
    },
    {
      id: "uygulama-akisi",
      title: "Doğrusal değerlendirme için doğru kontrol sırası",
      content: phase4Lines(
        "1. Bilgi düzeyi, mevcut malzeme dayanımları ve taşıyıcı sistem modeli hazırlanır.",
        "2. Eşdeğer deprem yükü kullanılacaksa Tablo 4.4 uygulanabilirlik şartları kontrol edilir.",
        "3. BYS ve B3 düzensizliği kontrol edilerek 15.5.3.1(a)–(b) kapısı geçilir.",
        "4. Analiz `Ra = 1` özel kabulleriyle yürütülür; sünek/gevrek eleman ayrımı yapılır.",
        "5. Eleman EKO'ları ve gerekli kesme kuvvetleri hesaplanır.",
        "6. Üst kat hariç her katta ve her deprem doğrultusunda (c)–(e) ortalama EKO sınırları denetlenir.",
        "7. Tek bir sınır dahi sağlanmıyorsa doğrusal sonuçlarla performans kararı verilmez; 15.6 yöntemlerinden biri seçilir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Doğrusal yöntem seçimi yalnız yazılım kolaylığına göre değil TBDY 15.5 şartlarına göre yapıldı mı?",
        "- Eşdeğer Deprem Yükü Yöntemi için Tablo 4.4 ayrıca kontrol edildi mi?",
        "- Mevcut bina performans hesabında ilgili yerlerde Ra = 1 kullanıldı mı?",
        "- BYS < 5 veya B3 düzensizliği varsa doğrusal yöntem terk edildi mi?",
        "- EKO hesabında moment talebi/kapasitesi ve deprem yönü doğru kullanıldı mı?",
        "- Düşey sünek elemanların ölçeklendirilmiş EKO'su Denk.(15.1) mantığıyla kesme kuvveti ağırlıklı hesaplandı mı?",
        "- 3 ve 5 sınırları üst kat hariç tüm katlarda, her deprem doğrultusunda kontrol edildi mi?",
        "- 15.5.3.1(a)–(e)'den herhangi biri oluştuğunda 15.6 doğrusal olmayan değerlendirmeye geçildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.5.1–15.5.3 ve 15.6 — doğrusal hesap yöntemleri, EKO ve uygulama sınırları"),
  keywords: ["doğrusal değerlendirme", "EKO", "BYS < 5", "B3 düzensizliği", "Ra=1", "Denklem 15.1", "TBDY 15.5.3"],
  tags: ["Mevcut Bina", "TBDY Bölüm 15", "Doğrusal Analiz", "EKO", "Performans Analizi"],
};
