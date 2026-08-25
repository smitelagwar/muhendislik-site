import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KISA_KOLON: DepremPhase3Override = {
  slug: "kisa-kolon-etkisi-tbdy-2018",
  description: "TBDY 2018 Madde 7.3.8'e göre kısa kolonun oluşum nedenlerini, Denklem 7.5 kapasite kesmesini, Denklem 7.7 dayanım sınırlarını ve tüm boy boyunca özel enine donatı koşullarını açıklar.",
  seoTitle: "TBDY Kısa Kolon Etkisi | 7.3.8 Kapasite Kesmesi ve Sarılma",
  seoDescription: "Kısa kolon serbest boyu, Ve=(Ma+Mü)/ℓn, 1.4Mra/1.4Mrü momentleri, Ve≤Vr, 0.85Aw√fck ve koşullu Vc=0 kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "10 dk",
  sections: [
    {
      id: "kisa-kolon-tanimi",
      title: "7.3.8: Kısa kolon taşıyıcı sistem geometrisinden veya dolgu duvarı boşluklarından oluşabilir",
      content: phase3Lines(
        "TBDY 7.3.8, kısa kolonların taşıyıcı sistem nedeni ile veya dolgu duvarlarında kolonlar arasında bırakılan boşluklar nedeni ile oluşabileceğini açıkça belirtir. Sorun yalnız kolonun fiziksel boyunun küçük olması değildir; etkili **serbest boyun ℓn azalması**, aynı uç momentlerinden doğan kesme talebini büyütür.",
        "",
        "| Kontrol | SOURCE_VALUE |",
        "|---|---:|",
        "| Kısa kolon tasarım kesmesi | Denklem (7.5) |",
        "| Alt uç momenti için yaklaşık kapasite | Ma ≈ 1.4Mra |",
        "| Üst uç momenti için yaklaşık kapasite | Mü ≈ 1.4Mrü |",
        "| Kullanılacak boy | Kısa kolonun serbest boyu ℓn |",
        "| Kesme güvenliği | Denklem (7.7) |",
        "| Enine donatı bölgesi | Kısa kolonun tüm serbest yüksekliği / tüm boyu |",
        "",
        "> [!engineering] Mimari dolgu model kararını değiştirebilir",
        "> Bant pencere veya kısmi dolgu, kolonun gerçek deformasyon serbestliğini sınırlandırıyorsa yalnız çerçeve elemanının kat yüksekliğini modele girmek kısa kolon etkisini görünmez kılabilir. Dolgu-kolon etkileşimi proje özelinde değerlendirilmelidir."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-5-kapasite-kesmesi",
      title: "Denklem 7.5: Serbest boy küçüldükçe aynı uç momentleri daha büyük kesme üretir",
      content: phase3Lines(
        "7.3.8, enine donatı hesabına esas `Ve` kesme kuvvetinin kolon kesme güvenliğindeki Denklem (7.5) ile hesaplanmasını ister. Kısa kolon için uç momentleri yaklaşık kapasite momentlerinden alınır ve `ℓn` doğrudan kısa kolonun serbest boyudur.",
        "",
        "```formula",
        "@label: TBDY Denklem (7.5) — kısa kolon kapasite kesmesi",
        "V_e = (M_a + M_ü) / ℓ_n",
        "@symbol: V_e | Enine donatı hesabına esas kesme kuvveti | kN",
        "@symbol: M_a | Kısa kolon alt ucundaki eğilme momenti | kN·m",
        "@symbol: M_ü | Kısa kolon üst ucundaki eğilme momenti | kN·m",
        "@symbol: ℓ_n | Kısa kolonun serbest boyu | m",
        "```",
        "",
        "Kısa kolon hükmünde `Ma ≈ 1.4Mra` ve `Mü ≈ 1.4Mrü` alınır. Bu nedenle serbest boyun yarıya düşmesi, diğer büyüklükler değişmiyorsa kapasite kaynaklı kesme bileşeninin yaklaşık iki katına çıkması anlamına gelir.",
        "",
        "> [!warning] Kat yüksekliğini otomatik kullanmayın",
        "> ℓn, nominal kat yüksekliği değil kısa kolonun gerçekten serbest deformasyon yapabildiği boydur. Dolgu, ara kiriş veya kısmi mesnet bu boyu değiştiriyorsa hesap geometrisi de değişir."
      ),
      subsections: [],
    },
    {
      id: "denklem-7-7-kesme-guvenligi",
      title: "Denklem 7.7: Kapasite kesmesi iki ayrı dayanım sınırını sağlamalıdır",
      content: phase3Lines(
        "7.3.8 ile bulunan `Ve`, 7.3.7.5'teki **Denklem (7.7)** koşullarını sağlamalıdır:",
        "",
        "`Ve ≤ Vr`",
        "",
        "`Ve ≤ 0.85 Aw √fck`",
        "",
        "İkinci sınır sağlanmıyorsa yönetmelik kesit boyutlarının gerektiği kadar büyütülerek deprem hesabının tekrarlanmasını ister. Yalnız etriye miktarını artırmak bu üst sınırı aşmanın çözümü değildir.",
        "",
        "> [!check] Gevrek göçme kapısı",
        "> Kısa kolonun yüksek kesme talebi nedeniyle Denklem (7.7) kontrolü, boyuna donatı veya eğilme kapasitesinden bağımsız bir son kontrol değil; kesit seçimini geri besleyen tasarım kapısıdır."
      ),
      subsections: [],
    },
    {
      id: "tum-boy-sarilma",
      title: "Kısa kolonun tüm boyunca sarılma bölgesi minimum enine donatı koşulları uygulanır",
      content: phase3Lines(
        "TBDY 7.3.8, kısa kolonun **tüm boyunca** 7.3.4.1'de kolon sarılma bölgeleri için tanımlanan minimum enine donatı ve yerleştirme koşullarının uygulanmasını ister. Başka bir ifadeyle sıklaştırma yalnız alt ve üst uçlarda bırakılmaz.",
        "",
        "Dolgu duvarlarının kolona tamamen bitişik olması nedeniyle kısa kolona dönüşen kolonlarda enine donatılar **tüm kat yüksekliğince** devam ettirilir. Paftada bu durum standart kolon uç sarılma detayıyla karıştırılmamalıdır.",
        "",
        "> [!field] Uygulama paftası",
        "> Kısa kolon bölgesi projede yalnız notla işaretlenmemeli; sık enine donatının başlangıç-bitiş kotu ve tüm kat yüksekliğine devam edip etmediği açıkça gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "vc-sifir-kosulu",
      title: "Vc = 0 kısa kolon için otomatik kural değildir; 7.3.7.6'daki iki koşul birlikte sağlanmalıdır",
      content: phase3Lines(
        "Eski uygulama notlarında kısa kolon için betonun kesme katkısının her durumda sıfır alınması gibi bir genelleme görülebilir. TBDY 7.3.7.6'nın hükmü daha özeldir: kolon sarılma bölgelerindeki enine donatı hesabında `Vc = 0` alınması için **yalnız deprem yüklerinden oluşan kesme kuvvetinin depremli durumdaki toplam kesme kuvvetinin yarısından büyük olması** ve aynı zamanda `Nd/(Ac fck) ≤ 0.05` koşulunun sağlanması gerekir.",
        "",
        "Bu iki koşul birlikte sağlanmıyorsa betonun kesme dayanımına katkısı TS 500'e göre belirlenir. Kısa kolonun tüm boyunda sarılma bölgesi detaylarının uygulanması, `Vc=0` koşulunu kendiliğinden sağlamaz.",
        "",
        "> [!warning] Önceki içerik hatasının düzeltilmesi",
        "> `Kısa kolon → Vc=0` şeklindeki koşulsuz eşleştirme kullanılmamalıdır. Kesme bileşimi ve eksenel yük oranı her ilgili kesitte ayrı doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kisa-kolon-olusumunu-onleme",
      title: "İlk tasarım hedefi kısa kolonu güçlendirmekten önce oluşum mekanizmasını ortadan kaldırmaktır",
      content: phase3Lines(
        "7.3.8'in ifadesi `kısa kolon oluşumunun engellenemediği durumlarda` özel kesme ve enine donatı hükümlerine geçer. Bu, taşıyıcı sistem ve mimari detay koordinasyonunda önceliğin kısa kolon mekanizmasını mümkünse oluşturmamak olduğunu gösterir.",
        "",
        "Dolgu duvarı, pencere bandı, merdiven ara sahanlığı, kademeli temel veya ara kiriş gibi geometrik nedenler kolon serbest boyunu değiştiriyorsa mimari ve statik proje birlikte incelenmelidir. Yönetmelikte verilmemiş keyfî bir derz genişliği `zorunlu minimum` gibi yazılmamalıdır; seçilen ayırma detayının kısa kolon etkileşimini gerçekten önlediği proje özelinde gösterilmelidir.",
        "",
        "> [!engineering] Detay kararı sayı ezberi değildir",
        "> Kısa kolon riskini önlemek için kullanılan mimari ayırma detayları malzeme, deformasyon ve yangın/akustik gereksinimleriyle birlikte çözülmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Kolon serbest boyunu azaltan dolgu, bant pencere, ara kiriş veya sahanlık etkileri belirlenmiş mi?",
        "- Kısa kolon için `ℓn` gerçek serbest boy olarak alınmış mı?",
        "- Denklem (7.5) `Ve = (Ma + Mü)/ℓn` ile kurulmuş mu?",
        "- Uç momentlerinde `Ma ≈ 1.4Mra` ve `Mü ≈ 1.4Mrü` yaklaşımı doğru kullanılmış mı?",
        "- Denklem (7.7) için **Ve ≤ Vr** ve **Ve ≤ 0.85 Aw √fck** koşulları birlikte sağlanıyor mu?",
        "- Kısa kolonun tüm serbest yüksekliği boyunca 7.3.4.1 minimum sarılma bölgesi enine donatısı uygulanmış mı?",
        "- Dolgu tamamen bitişikse enine donatı tüm kat yüksekliğince devam ediyor mu?",
        "- `Vc = 0` yalnız deprem kesmesi toplamın yarısından büyük **ve** `Nd/(Ac fck) ≤ 0.05` ise uygulanmış mı?",
        "- Kısa kolon oluşumunu mimari/taşıyıcı sistem düzenlemesiyle ortadan kaldırma seçeneği değerlendirilmiş mi?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.3.4.1, 7.3.7.1–7.3.7.6 ve 7.3.8, Denklem (7.5) ve (7.7)"),
  keywords: ["TBDY 2018", "kısa kolon", "7.3.8", "Denklem 7.5", "kesme", "sarılma", "Vc=0"],
  tags: ["TBDY 2018", "Betonarme", "Kolon", "Kesme", "Detaylandırma"],
};