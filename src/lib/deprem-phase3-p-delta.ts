import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_P_DELTA: DepremPhase3Override = {
  slug: "tbdy-p-delta-ikinci-mertebe",
  description: "TBDY 2018 Madde 4.9.2'deki ikinci mertebe gösterge değeri θII, Denklem (4.35)–(4.37), Ch katsayısı ve iç kuvvet büyütme kararını proje kontrol akışı halinde açıklar.",
  seoTitle: "TBDY 2018 P-Delta ve İkinci Mertebe Etkileri | Denklem 4.35–4.37",
  seoDescription: "TBDY 4.9.2 kapsamında θII, Ch, βII, ikinci mertebe sınırı, iç kuvvet büyütmesi ve rijit bodrumlu binalarda üst bölüm kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "p-delta-kapsami",
      title: "P-Δ kontrolü yalnız yüksek binaların sorunu değildir",
      content: phase3Lines(
        "İkinci mertebe etkisi, düşey yüklerin yapının ötelenmiş geometrisi üzerinde ek moment ve iç kuvvet üretmesidir. TBDY 4.9.2 bu etkiyi yalnız belirli bir bina yüksekliğine bağlamaz; Dayanıma Göre Tasarım kapsamında her deprem doğrultusunda kat bazında bir stabilite göstergesi üzerinden kontrol eder.",
        "",
        "Bu nedenle 'bina yüksek değil, P-Delta gerekmez' yaklaşımı doğru değildir. Önce Denklem (4.35) ile ikinci mertebe gösterge değeri hesaplanır; ardından Denklem (4.36) sınırı sağlanıyorsa global ikinci mertebe etkilerinin tasarıma esas iç kuvvetlerde ayrıca hesaba katılması gerekmez. Sınır sağlanmıyorsa Denklem (4.37) büyütmesi veya sistem revizyonu gündeme gelir.",
        "",
        "> [!warning] Global ve yerel ikinci mertebeyi ayırın",
        "> TBDY 4.9.2.2 global bina davranışı için bir deprem kontrolüdür. Denklem (4.36) sağlansa bile kolon gibi elemanların yerel ikinci mertebe etkileri yürürlükteki malzeme tasarım kuralları kapsamında ayrıca gerekebilir."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-35",
      title: "Denklem 4.35: kat stabilite göstergesi nasıl kurulur?",
      content: phase3Lines(
        "4.9.2.1'e göre gözönüne alınan deprem doğrultusunda her i'inci kat için ikinci mertebe gösterge değeri hesaplanır. Denklem yalnız kat ötelenmesini değil, o katın üzerindeki toplam ağırlığı, kat kesme kuvvetini ve kat yüksekliğini aynı oran içinde birleştirir.",
        "",
        "```formula",
        "@label: TBDY Denklem (4.35)–(4.37) — ikinci mertebe karar zinciri",
        "θII,i = (Δi,ort × Σwk) / (Vi × hi)",
        "θII,max <= 0.12 D / (Ch R)",
        "βII = 0.88 + (Ch R / D) θII,max >= 1",
        "@symbol: θII,i | i'inci kat ikinci mertebe gösterge değeri | -",
        "@symbol: Δi,ort | i'inci kattaki azaltılmış göreli kat ötelenmelerinin ortalaması | m",
        "@symbol: Σwk | i'inci kattan çatıya kadar bina ağırlıkları toplamı | kN",
        "@symbol: Vi | i'inci kattaki kat kesme kuvveti | kN",
        "@symbol: hi | i'inci kat yüksekliği | m",
        "@symbol: Ch | taşıyıcı sistemin histeretik davranış katsayısı | -",
        "@symbol: R | taşıyıcı sistem davranış katsayısı | -",
        "@symbol: D | dayanım fazlalığı katsayısı | -",
        "```",
        "",
        "Buradaki `Δi,ort`, 4.9.1'e göre kolon ve perdelerde hesaplanan **azaltılmış** göreli kat ötelemelerinin kat içindeki ortalama değeridir. Maksimum drift değeri ile kat ortalamasını birbirine karıştırmak Denklem (4.35)'in anlamını değiştirir."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-36",
      title: "Denklem 4.36: global ikinci mertebe etkisini ne zaman ayrıca büyütmeyiz?",
      content: phase3Lines(
        "Tüm katlardaki `θII,i` değerlerinin maksimumu `θII,max` olarak alınır. Denklem (4.36) koşulu `θII,max ≤ 0.12 D / (Ch R)` biçimindedir. Koşul sağlanıyorsa ikinci mertebe etkilerinin tasarıma esas **global iç kuvvetlerin** hesabında ayrıca gözönüne alınması gerekli değildir.",
        "",
        "| Taşıyıcı sistem malzemesi | Ch | Proje notu |",
        "|---|---:|---|",
        "| Betonarme bina | `Ch = 0.5` | 4.9.2.2'de doğrudan tanımlanır |",
        "| Çelik veya kompozit kolonlu bina | `Ch = 1` | Aynı eşikte daha farklı izin verilen θII,max üretir |",
        "",
        "`R` ve `D`, seçilen taşıyıcı sistem için Tablo 4.1'den gelen değerlerdir. Bu nedenle P-Δ kontrolünü taşıyıcı sistem sınıfından bağımsız sabit bir θ sınırı gibi kullanmak doğru değildir.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> Kat ağırlıkları, `Vi`, `hi`, `Δi,ort`, seçilen `R`, `D` ve `Ch` değerleri bu kontrolün SOURCE_VALUE girdileridir; hesap raporunda izlenebilir olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-37",
      title: "Denklem 4.37: sınır aşılırsa iki çözüm yolu vardır",
      content: phase3Lines(
        "Denklem (4.36) sağlanmıyorsa 4.9.2.3'e göre gözönüne alınan deprem doğrultusundaki tüm iç kuvvetler `βII` ile büyütülür. Denklem (4.37), `βII = 0.88 + (Ch R / D) θII,max ≥ 1` bağıntısını verir.",
        "",
        "Bu bir 'yalnız kolon momentlerini büyüt' kuralı değildir; madde, ilgili deprem doğrultusu için **tüm iç kuvvetlerin** büyütülmesini söyler. Alternatif çözüm ise taşıyıcı sistem rijitliğini ve/veya dayanımını uygun biçimde artırıp deprem hesabını yeniden yapmaktır.",
        "",
        "Sınır aşımını sonradan tablo üzerinde tek katsayıyla gizlemek yerine, aşımın nedeni yüksek göreli ötelenme, düşük kat kesmesi, yetersiz rijitlik veya taşıyıcı sistem seçimi bakımından incelenmelidir."
      ),
      subsections: [],
    },
    {
      id: "drift-ve-bodrum",
      title: "Göreli ötelenme, iki doğrultu ve rijit bodrum ilişkisi",
      content: phase3Lines(
        "P-Δ göstergesi doğrudan göreli kat ötelenmesi girdisini kullandığı için 4.9.1 drift kontrolünden kopuk değerlendirilemez. Drift sınırını sağlamak P-Δ kontrolünü otomatik olarak geçmiş saydırmaz; iki kontrol farklı oranları ve farklı fiziksel sonuçları sınırlar.",
        "",
        "4.9.2.4 işlemlerin birbirine dik iki yatay deprem doğrultusunda da yapılmasını ister. Bir doğrultudaki uygunluk diğer doğrultunun yerine geçmez.",
        "",
        "3.3.1'de tanımlanan rijit bodrum perdeli binalarda ikinci mertebe etkileri bodrum katlarının üstündeki **üst bölüm** için gözönüne alınır. Bu özel hüküm, bodrumlu binayı iki bağımsız model gibi çözmek anlamına gelmez; önceki bodrumlu bina kontrolünde olduğu gibi ortak model mantığı korunur."
      ),
      subsections: [],
    },
    {
      id: "ofis-kontrol-akisi",
      title: "Ofis kontrol akışı: θII tablosundan tasarım kararına",
      content: phase3Lines(
        "1. Her deprem doğrultusu için kat bazında `Δi,ort`, üst katlar dahil `Σwk`, `Vi` ve `hi` değerlerini çıkarın.",
        "2. Denklem (4.35) ile her kat için `θII,i` hesaplayın ve en büyük değeri `θII,max` olarak belirleyin.",
        "3. Taşıyıcı sistemden `R` ve `D`, malzemeden `Ch` değerini alın; betonarmede `Ch = 0.5`, çelik/kompozitte `Ch = 1` kullanıldığını doğrulayın.",
        "4. Denklem (4.36) sınırını her yatay doğrultuda ayrı kontrol edin.",
        "5. Sınır sağlanmıyorsa Denklem (4.37) ile `βII` büyütmesini tüm ilgili iç kuvvetlere uygulayın veya sistemi revize ederek analizi yineleyin.",
        "6. Rijit bodrum varsa kontrolün üst bölüm için doğru kurulduğunu; yerel eleman ikinci mertebe kontrollerinin de malzeme yönetmeliğine göre ayrıca yürütüldüğünü raporlayın.",
        "",
        "> [!check] Rapor formatı",
        "> Kat no, Δi,ort, Σwk, Vi, hi, θII,i, θII,max, izin verilen sınır ve gerekiyorsa βII değerlerini aynı tabloda göstermek denetimi belirgin biçimde kolaylaştırır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Denklem (4.35) hesabında maksimum drift yerine kat içi ortalama azaltılmış göreli ötelenme mi kullanıldı?",
        "- `Σwk` i'inci kattan çatıya kadar doğru ağırlıkları içeriyor mu?",
        "- `Vi` ve `hi` aynı kat ve deprem doğrultusuna mı ait?",
        "- Her iki yatay deprem doğrultusunda `θII,max` ayrı bulundu mu?",
        "- Denklem (4.36) için doğru `R`, `D` ve `Ch` kullanıldı mı?",
        "- Betonarmede `Ch = 0.5`, çelik/kompozitte `Ch = 1` seçimi doğrulandı mı?",
        "- Sınır aşılırsa Denklem (4.37) ile `βII ≥ 1` tüm ilgili iç kuvvetlere uygulandı mı veya sistem yeniden analiz edildi mi?",
        "- Rijit bodrumlu binada kontrol üst bölüm için doğru tanımlandı mı?",
        "- Global 4.9.2 kontrolü ile yerel eleman ikinci mertebe kontrolleri birbirine karıştırılmadı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.9.2; Denklem (4.35), (4.36) ve (4.37)"),
  keywords: ["P-Delta", "ikinci mertebe", "θII", "βII", "stabilite", "TBDY 2018"],
  tags: ["TBDY 2018", "P-Delta", "İkinci Mertebe", "Stabilite"],
};
