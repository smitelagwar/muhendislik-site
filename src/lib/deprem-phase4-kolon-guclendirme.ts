import { phase4Lines, tbdyPhase4References, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

export const DEPREM_PHASE4_KOLON_GUCLENDIRME: DepremPhase4Override = {
  slug: "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu",
  description: "TBDY 15.10.1–15.10.2 ve EK 15B kapsamında kolon güçlendirmesinde betonarme sargı, kesit büyütme ve lifli polimer sargının hangi yetersizliği giderdiğini ve modelleme/uygulama sonuçlarını ayırır.",
  seoTitle: "Kolon Güçlendirme: LP/FRP, Betonarme Sargı ve Kesit Büyütme | TBDY",
  seoDescription: "TBDY 15.10.1, 15.10.2 ve EK 15B'ye göre betonarme kolon güçlendirmesinde LP/FRP sargı, betonarme sargı, kesit büyütme, 100 mm ve 0.9 kuralları.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "15 dk",
  sections: [
    {
      id: "yetersizlik-hedefi",
      title: "Güçlendirme yöntemi malzemeye göre değil, hedeflenen yetersizliğe göre seçilir",
      content: phase4Lines(
        "Kolon güçlendirmesinde ilk soru 'CFRP mi beton manto mu?' değildir. Önce baskın yetersizlik ayrılmalıdır: **kesme dayanımı**, **eksenel basınç kapasitesi**, **süneklik/bindirme eki**, **eğilme kapasitesi** veya bunların birlikte oluşturduğu sistem problemi.",
        "",
        "TBDY 15.10.1 kolonların sarılmasını; kesme ve basınç dayanımlarını artırmak, sünekliği geliştirmek ve bindirmeli ek zayıflıklarını gidermek amacıyla tanımlar. Aynı maddede kritik bir sınır vardır: bu sarma yöntemleriyle kolonların **eğilme kapasitesi arttırılamaz**.",
        "",
        "Eğilme kapasitesinin artırılması hedefleniyorsa 15.10.2 kapsamındaki **kolon kesitinin büyütülmesi** ayrı bir müdahaledir. Dolayısıyla projede 'beton mantolama' ifadesi tek başına bırakılmamalı; yapılan uygulamanın sargı mı yoksa boyuna donatı sürekliliği sağlayan kesit büyütme mi olduğu açıkça tanımlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "yontem-matrisi",
      title: "Betonarme sargı, kesit büyütme ve LP sargı aynı kapasiteyi üretmez",
      content: phase4Lines(
        "| Yöntem | Yönetmelikte ana amaç | Eğilme kapasitesi | Modelde beklenen değişim |",
        "|---|---|---|---|",
        "| Betonarme sargı — 15.10.1.1 | Kesme/basınç dayanımı ve süneklik | 15.10.1 kapsamı olarak artırılamaz | Kesme, basınç ve sargı davranışı; brüt sarılmış boyutlarla hesap |",
        "| Kesit büyütme — 15.10.2 | Eğilme kapasitesini artırmak; kesme ve basınç da artar | Artırılabilir | Kesit rijitliği ve dayanımları yeni brüt kesitle güncellenir |",
        "| Lifli Polimer (LP/FRP) sargı — 15.10.1.3 ve EK 15B | Süneklik, kesme/basınç ve yetersiz bindirme eki | Sargı yöntemi olarak artırılamaz | EK 15B'deki ilgili kapasite/süneklik katkıları tanımlanır |",
        "",
        "Bu ayrım analiz modelinde de korunmalıdır. Örneğin yalnız LP sargı yapılan bir kolonda kesit boyutunu büyütüp eğilme rijitliğini artırmak, yapılan fiziksel müdahaleyi yanlış temsil eder."
      ),
      subsections: [],
    },
    {
      id: "betonarme-sargi",
      title: "15.10.1.1 betonarme sargıyı yüzey hazırlığı ve kesintisiz kat detayıyla tanımlar",
      content: phase4Lines(
        "TBDY 15.10.1.1'e göre betonarme sargı, mevcut kolonun beton örtüsü sıyrılarak veya yüzeyi pürüzlendirilerek uygulanır; yatay ve düşey donatının yerleştirilebilmesi, beton dökümü ve minimum örtü için yeterli kalınlık sağlanır. **En az sargı kalınlığı 100 mm'dir.**",
        "",
        "Betonarme sargı kat döşemesinin üstünde başlar ve üst kat döşemesinin altında sona erer. Eksenel basınç dayanımını artırma amacıyla yapılan sargıda enine donatı, kolonun tüm yüksekliği boyunca yönetmeliğin özel deprem etriyesi/çiroz düzenine ilişkin kuralıyla uyumlu olmalıdır.",
        "",
        "Sarılmış kolonun kesme ve basınç dayanımları hesaplanırken sarılmış brüt kesit boyutları ve manto betonunun tasarım dayanımı kullanılır; yönetmelik elde edilen dayanımların **0.9 ile çarpılarak azaltılmasını** ister.",
        "",
        "Bu detay, sargıyı 'kolon etrafına kalın beton dökmek' işleminden ayırır. Yüzey hazırlığı, donatı yerleşimi, kat birleşimindeki sonlanma ve betonun sıkıştırılabilirliği saha kabulünün parçasıdır."
      ),
      subsections: [],
    },
    {
      id: "kesit-buyutme",
      title: "15.10.2 eğilme kapasitesi için boyuna donatının katlar arası sürekliliğini şart koşar",
      content: phase4Lines(
        "TBDY 15.10.2, kolonların eğilme kapasitesini artırmak için kesit büyütülmesine izin verir. Bu müdahale aynı zamanda kesme ve basınç kapasitelerini de artırır; ancak bunun için büyütülen kolona eklenen **boyuna donatıların katlar arasında sürekliliği** sağlanmalıdır.",
        "",
        "Yönetmelik, boyuna donatıların kat döşemelerinde açılan deliklerden geçirilmesini; her iki ucunda gerekli kenetlenme koşullarının sağlanmasını; büyütülen kesitte enine donatının bütün boyuna donatıları saracak biçimde düzenlenmesini ve mevcut kolon yüzeylerinin pürüzlendirilmesini ister.",
        "",
        "Büyütülmüş kesitin eğilme, kesme, basınç dayanımı ve eğilme rijitliği hesabında yeni brüt kesit ve eklenen betonun tasarım özellikleri esas alınır; elde edilen **rijitlik ve dayanımlar 0.9 ile çarpılarak** azaltılır.",
        "",
        "Bu nedenle kesit büyütme, yalnız kolonun alt katında yapılan lokal bir kaplama gibi modellenemez. Boyuna donatı sürekliliği ve düğüm/döşeme geçişleri çözülmeden eğilme kapasitesi artışı güvenilir kabul edilemez."
      ),
      subsections: [],
    },
    {
      id: "lp-sargi",
      title: "LP/FRP sargıda EK 15B malzeme kopma değerini doğrudan kapasiteye taşımayı sınırlar",
      content: phase4Lines(
        "TBDY 15.10.1.3, Lifli Polimer (LP) tabakasının kolon çevresine lifler enine donatıya paralel olacak şekilde sarılıp yapıştırılmasıyla sargı oluşturulmasını tanımlar. LP ile artırılan kesme, eksenel basınç, yetersiz bindirme eki dayanımı ve süneklik hesabı **EK 15B** üzerinden yapılır.",
        "",
        "EK 15B.1'de kesme dayanımına LP katkısı için kullanılan etkin birim uzama, iki sınırın küçüğü olarak alınır: **εf ≤ 0.004** ve **εf ≤ 0.50 εfu**. Bu, üreticinin kopma uzamasını doğrudan tasarım etkin uzaması kabul etmeyi engelleyen temel sınırlamalardan biridir.",
        "",
        "EK 15B.2'ye göre LP sargıyla eksenel basınç dayanımı artırılacak dikdörtgen kolonlarda uzun boyut/kısa boyut oranı **2.5'i geçmemelidir**. Aynı geometrik sınır süneklik artışı için EK 15B.3'te de kullanılır; elips kesitler için yönetmelik ayrıca farklı oran tanımlar.",
        "",
        "LP sargının performansı köşe geometrisi, yüzey hazırlığı, lif yönü ve sürekliliğe duyarlıdır. Tasarım hesabı ile uygulama prosedürü birbirinden koparılamaz."
      ),
      subsections: [],
    },
    {
      id: "modelleme",
      title: "Modelde hangi kapasitenin değiştiği, fiziksel güçlendirme detayıyla birebir eşleşmelidir",
      content: phase4Lines(
        "Güçlendirme modeli, yöntemin gerçekten değiştirdiği davranış bileşenlerini güncellemelidir. Betonarme sargı veya LP sargıda kesme/basınç/süneklik kazanımı tanımlanırken, 15.10.1'in eğilme kapasitesini artırmama sınırı korunur. Kesit büyütmede ise 15.10.2 uyarınca yeni brüt kesit, süreklilik sağlayan boyuna donatı ve 0.9 azaltılmış rijitlik/dayanım birlikte hesaba katılır.",
        "",
        "Eleman kapasitesi artırıldığında hasar mekanizması komşu elemanlara taşınabilir. Kolon kesmesini güçlendirmek, birleşim kesmesini veya temel talebini otomatik olarak çözmez. Bu nedenle güçlendirme sonrası kolon-kiriş birleşimi, güçlü kolon davranışı, kat ötelenmesi ve temel reaksiyonları yeniden değerlendirilmelidir.",
        "",
        "Model notlarında her güçlendirilmiş kolon için 'mevcut özellik → müdahale → modelde değiştirilen özellik → dayanak' zinciri tutulması, yazılım modelinin uygulama paftasıyla denetlenmesini kolaylaştırır."
      ),
      subsections: [],
    },
    {
      id: "uygulama-kontrol",
      title: "Saha kabulünde görünmeyecek arayüz ve donatı işleri beton dökümünden önce kayıt altına alınmalıdır",
      content: phase4Lines(
        "Betonarme sargı veya kesit büyütmede yüzey pürüzlendirmesi, mevcut betonun sağlam bölgesine ulaşılması, yeni donatının konumu, döşeme geçişleri ve kenetlenme bölgeleri beton dökülmeden önce kontrol edilmelidir. LP uygulamasında ise yüzey hazırlığı, köşe düzeni, lif yönü, katman sürekliliği ve üretici sistem prosedürü uygulama kaydına bağlanmalıdır.",
        "",
        "Kontrol yalnız 'projedeki çap ve adet sahada var mı?' seviyesinde kalmamalıdır. Güçlendirme yöntemi eski ve yeni malzemenin birlikte çalışmasına dayanıyorsa, arayüz hazırlığı ve kuvvet aktarımının gerçekleşebileceği uygulama kalitesi de kabul kriteridir.",
        "",
        "Yangın, darbe, nem ve dış ortam etkileri projenin kullanım koşullarına göre LP veya diğer güçlendirme malzemelerinin koruma ve detay kararlarında ayrıca koordine edilmelidir; bu çevresel tasarım, deprem kapasite hesabından ayrı bir 'sonradan eklenen kaplama' işi gibi bırakılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "hatalar",
      title: "Sık yapılan hatalar ve teknik sonuçları",
      content: phase4Lines(
        "| Hata | Neden yanlış | Teknik sonuç |",
        "|---|---|---|",
        "| LP/FRP sargıyla eğilme kapasitesini artırılmış saymak | 15.10.1 sargı yöntemleri için bunu açıkça sınırlar | Model gerçekte olmayan moment kapasitesi üretir |",
        "| Betonarme sargıyı 15.10.2 kesit büyütmeyle aynı kabul etmek | Amaç ve donatı sürekliliği farklıdır | Yanlış rijitlik ve eğilme kapasitesi kullanılır |",
        "| 100 mm minimum sargı kalınlığını tek tasarım ölçütü saymak | Dayanım ve detay hesabı ayrıca gerekir | Kesme/basınç veya uygulama yeterliliği kanıtlanmaz |",
        "| 0.9 azaltmasını modelde atlamak | 15.10.1.1 ve 15.10.2 hesabıyla çelişir | Kapasite/rijitlik iyimser hesaplanır |",
        "| LP için εfu değerini doğrudan etkin uzama almak | EK 15B etkin uzamayı 0.004 ve 0.50 εfu ile sınırlar | LP katkısı aşırı tahmin edilebilir |"
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- Kolondaki baskın yetersizlik kesme, basınç, süneklik/bindirme veya eğilme olarak ayrıldı mı?",
        "- 15.10.1 sargı yöntemlerinde eğilme kapasitesi arttırılmadığı modelde korunuyor mu?",
        "- Betonarme sargıda yüzey hazırlığı, minimum 100 mm kalınlık ve kat seviyelerindeki başlangıç/bitiriş detayı sağlanıyor mu?",
        "- 15.10.1.1 betonarme sargı dayanımlarında 0.9 azaltması uygulandı mı?",
        "- Eğilme kapasitesi artırılıyorsa 15.10.2'ye göre boyuna donatının katlar arası sürekliliği ve kenetlenmesi çözüldü mü?",
        "- Kesit büyütmede rijitlik ve dayanımlar 0.9 ile azaltıldı mı?",
        "- LP/FRP hesabı EK 15B'ye göre ve mevcut malzeme dayanımlarıyla yapıldı mı?",
        "- LP kesme katkısında εf ≤ 0.004 ve εf ≤ 0.50 εfu sınırları uygulandı mı?",
        "- LP ile basınç/süneklik artışı için kesit oranı 2.5 sınırı ilgili kesit tipinde kontrol edildi mi?",
        "- Güçlendirme sonrası birleşim, komşu eleman, kat ötelenmesi ve temel tepkileri yeniden değerlendirildi mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase4References("Bölüm 15.9–15.10 ve EK 15B — kolon sarılması, kesit büyütme ve Lifli Polimer güçlendirme"),
  keywords: ["kolon güçlendirme", "15.10.1", "15.10.2", "100 mm", "0.9", "eğilme kapasitesi", "EK 15B", "0.004", "0.50", "2.5", "LP sargı"],
  tags: ["Mevcut Bina", "Kolon Güçlendirme", "LP/FRP", "Betonarme Sargı", "TBDY Bölüm 15"],
};
