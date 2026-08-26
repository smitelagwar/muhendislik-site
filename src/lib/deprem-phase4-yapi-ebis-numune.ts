import { phase4Lines, PHASE4_UPDATED_AT, type DepremPhase4Override } from "./deprem-phase4-shared";

const YAPI_DENETIM_MEVZUATI = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const TAZE_BETON_TEBLIG = "https://webdosya.csb.gov.tr/db/yapiisleri/icerikler/4708-sayili-yapi-denet-m--hakkinda-kanun-kapsaminda-denet-m--yurutulen-yapilara-a-t-taze-betondan-numune-alinmasi-deneyler-n-n-yapilmasi-raporlanmasi-surecler-n-n-izl-20210505163351.pdf";
const GENELGE_2022_07 = "https://isparta.csb.gov.tr/haberler/bakanligimizca-taze-beton-okumune-ve-numune-alimina-iliskin-2022-02-nolu-genelge-revize-edilerek-2022-07-nolu-genelge-yayinlanmistir.-267988";

export const DEPREM_PHASE4_YAPI_EBIS_NUMUNE: DepremPhase4Override = {
  slug: "yapi-denetimi-ebis-beton-numunesi-kabul",
  description: "4708 kapsamındaki taze beton numunesi ve EBİS sürecini; döküm bildirimi, RFID beton etiketi, mikser/karekodlu irsaliye eşleştirmesi, şantiye konumu, 7 ve 28 günlük deneyler ile uygunsuzluk halinde izlenebilirlik zinciri üzerinden açıklar.",
  seoTitle: "Beton Numunesi, EBİS ve Kabul Süreci | 2022/07 Genelgesi",
  seoDescription: "EBİS beton numunesi: beton etiketi, mikser ve karekodlu irsaliye kaydı, 7/28 günlük deneyler, numune sıklığı ve yapı denetimi izlenebilirliği.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "ebis-neden-var",
      title: "EBİS'in amacı numuneyi yapıya, miksere ve döküm zamanına geri izlenebilir kılmaktır",
      content: phase4Lines(
        "Taze beton numunesi yalnız laboratuvara giden bir küp değildir. 4708 kapsamındaki sistemde **EBİS**, numunenin hangi yapıda, hangi dökümde, hangi mikser ve irsaliye ile ilişkili olduğunu elektronik kayıtlarla izlenebilir hale getirir.",
        "",
        "Tebliğde **beton etiketi** RFID teknolojisiyle numune kimliğine; **beton mikser etiketi** üretici ve araç plakasına; **karekodlu beton irsaliyesi** ise sevkiyat ve beton özelliklerine bağlanır. EBİS mobil yazılımı şantiye ve beton bilgilerini bu kimliklerle eşleştirir.",
        "",
        "Bu zincir düşük dayanım veya kayıt uyuşmazlığında 'hangi beton hangi elemana döküldü?' sorusuna kanıt üretmek için kritik önemdedir."
      ),
      subsections: [],
    },
    {
      id: "dokum-bildirimi-ve-hazirlik",
      title: "Numune süreci beton gelmeden önce döküm bildirimiyle başlar",
      content: phase4Lines(
        "Tebliğ çerçevesinde yapı denetim kuruluşu beton dökümünü ilgili laboratuvara önceden bildirir. Bu adım numune personeli, ekipman ve EBİS kaydının döküm anında hazır olmasını sağlar.",
        "",
        "Döküm programında beton sınıfı, yaklaşık miktar, eleman/blok/kat bilgisi ve farklı beton tanımlarının aynı gün kullanılıp kullanılmayacağı netleştirilmelidir. Laboratuvar organizasyonu beton pompası sahaya geldikten sonra kurulmaya çalışılmamalıdır.",
        "",
        "İlgili denetim elemanının şantiyede bulunması ve numunenin laboratuvar personelince ilgili standartlara göre alınması, kayıt zincirinin fiziksel denetim ayağıdır."
      ),
      subsections: [],
    },
    {
      id: "mikser-irsaliye-numune-eslestirme",
      title: "Her numuneyi mikser, irsaliye, konum ve döküm elemanıyla eşleştirin",
      content: phase4Lines(
        "Numune alınırken şantiyeye gelen mikser etiketi ile **karekodlu beton irsaliyesi** okunur; beton etiketli numuneler EBİS üzerinden kaydedilir ve yapının konumu doğrulanır. Elektronik kayıt, saha gözlemiyle aynı dökümü temsil etmelidir.",
        "",
        "İrsaliyede dayanım sınıfı, kıvam, beton miktarı ve diğer teknik tanımlama bilgileri bulunduğundan numune kimliği aynı zamanda hangi ürünün denendiğini de sınırlar. Yanlış mikser/irsaliye eşleştirmesi deney sonucunun temsil gücünü bozar.",
        "",
        "Döküm büyükse yalnız 'kat betonu' demek yerine blok + kat + eleman/döküm bölgesi mantığıyla kayıt tutmak, olası uygunsuzluğun etki alanını daha doğru belirlemeyi sağlar."
      ),
      subsections: [],
    },
    {
      id: "2022-07-numune-sikligi",
      title: "Numune sayısını alışkanlıktan değil, güncel 2022/07 düzenlemesinden belirleyin",
      content: phase4Lines(
        "Bakanlığın **2022/07 Genelgesi**, taze beton numune sıklığı ve 7/28 günlük deney dağılımı için güncel uygulama açıklamalarını içerir. Şantiyeye aynı gün yalnız bir beton yükü teslim edilmesi halinde **8 adet numune** alınır; bunların **2 adedi 7. günde**, **6 adedi 28. günde** deneye tabi tutulur.",
        "",
        "Aynı gün birden fazla beton yükü tesliminde Genelgedeki tabloya göre en yüksek numune alma sıklığını sağlayan kriter esas alınır. **C55/67 ve üzeri** betonlarda tabloda verilen numune sayılarının iki katına çıkarılması gerektiği de resmî duyuruda belirtilmiştir.",
        "",
        "Bu sayılar proje hafızasından veya eski şantiye pratiğinden taşınmamalı; Genelge ve atıf yaptığı güncel standart sürümleri döküm tarihinde doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "7-ve-28-gun-okumasi",
      title: "7 günlük sonucu erken uyarı, 28 günlük sonucu uygunluk sürecinin ana verisi olarak okuyun",
      content: phase4Lines(
        "**7 günlük deney** betonun dayanım gelişimini erken izlemek ve sıra dışı bir trendi fark etmek için değerlidir; tek başına nihai kabul kararı gibi kullanılmamalıdır. **28 günlük deney** sonuçları ilgili beton standardı ve kabul prosedürü çerçevesinde değerlendirilir.",
        "",
        "Erken sonuç beklenenden düşükse irsaliye, numune alma, kür, laboratuvar ve aynı üretimi temsil eden diğer kayıtlar hemen gözden geçirilebilir. Bu, 28. güne kadar hiçbir şey yapmadan beklemekten daha iyi risk yönetimidir.",
        "",
        "Deney sonucu yalnız tek küp değeri üzerinden yorumlanmamalı; ilgili numune takımı, standarttaki değerlendirme kuralı ve temsil ettiği döküm birlikte ele alınmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kabul-izlenebilirlik-matrisi",
      title: "Numune ve kabul zincirini kayıt tablosuyla kapatın",
      content: phase4Lines(
        "| Aşama | Zorunlu/temel kayıt | Kontrol sorusu | Uyuşmazlık riski |",
        "|---|---|---|---|",
        "| Döküm bildirimi | Yapı + tarih + beton/döküm bilgisi | Laboratuvar zamanında bilgilendirildi mi? | Numune alınamaması |",
        "| Mikser gelişi | Mikser etiketi + irsaliye | Gelen beton siparişle aynı mı? | Yanlış ürün/döküm |",
        "| Numune alma | Beton etiketi + EBİS + konum | Numune doğru dökümü temsil ediyor mu? | Kimlik karışması |",
        "| 7 günlük deney | Numune kimliği + sonuç | Erken dayanım trendi olağan mı? | Geç fark edilen problem |",
        "| 28 günlük deney | Numune takımı + sonuç | Uygunluk kriteri sağlanıyor mu? | Düşük dayanım süreci |",
        "| Arşiv | Eleman/döküm bölgesi eşleştirmesi | Sonuç hangi elemanları kapsıyor? | Etki alanı belirsizliği |",
        "",
        "EBİS kaydı ile şantiye beton döküm tutanağı birbirini tamamlamalı; biri diğerinin yerine geçmemelidir."
      ),
      subsections: [],
    },
    {
      id: "uygunsuzluk-ve-eksik-sonuc",
      title: "Numune yoksa veya sonuç uygun değilse doğrudan karot sayısı uydurmayın",
      content: phase4Lines(
        "Taze betondan numune alınamaması, deney sonucu elde edilememesi veya basınç dayanımının uygun bulunmaması ayrı olaylardır; her biri Bakanlık genelgeleri ve ilgili **TS EN 13791 / TS EN 12504-1** süreciyle değerlendirilmelidir.",
        "",
        "Uygunsuzlukta önce numune kimliği, temsil ettiği döküm, laboratuvar kayıtları ve deney geçerliliği doğrulanır. Ardından gerekirse sertleşmiş betonda değerlendirme planı yetkili laboratuvar ve proje/denetim süreciyle oluşturulur.",
        "",
        "Şantiyede yalnız düşük bir sayı görüp rastgele yerlerden karot almak, temsil ve yapısal güvenlik açısından doğru takip yöntemi değildir."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "- [ ] Beton dökümünü laboratuvara zamanında bildirdim.",
        "- [ ] **Beton etiketi**, mikser etiketi ve **karekodlu beton irsaliyesi** eşleştirmesini doğruladım.",
        "- [ ] Numune alma işleminin denetim elemanı huzurunda ve EBİS konum kaydıyla yapıldığını kontrol ettim.",
        "- [ ] Numune sayısını **2022/07 Genelgesi** ve döküm miktarı/yük sayısına göre belirledim.",
        "- [ ] Tek yük durumunda **8 adet numune / 2 adet 7 günlük / 6 adet 28 günlük** kuralını güncel kaynaktan doğruladım.",
        "- [ ] **7 günlük** sonucu erken izleme, **28 günlük** sonucu uygunluk değerlendirmesi bağlamında yorumladım.",
        "- [ ] Numune kimliği ile blok + kat + döküm bölgesi ilişkisini arşivledim.",
        "- [ ] Eksik/uygunsuz sonuçta karot sürecini yetkili prosedür üzerinden başlattım."
      ),
      subsections: [],
    },
  ],
  references: [
    {
      label: "ÇŞİDB — Yapı Denetimi Daire Başkanlığı mevzuat sayfası",
      href: YAPI_DENETIM_MEVZUATI,
      note: "Taze beton, EBİS ve laboratuvar uygulamalarındaki güncel mevzuat ve genelgeler için resmî merkez.",
    },
    {
      label: "ÇŞİDB — 4708 kapsamında taze betondan numune alınması ve EBİS Tebliği",
      href: TAZE_BETON_TEBLIG,
      note: "Beton etiketi, mikser/karekodlu irsaliye, EBİS kaydı ve numune alma-deney sürecinin resmî çerçevesi.",
    },
    {
      label: "ÇŞİDB — 2022/07 taze beton numune Genelgesi duyurusu",
      href: GENELGE_2022_07,
      note: "Numune sayısı, 7/28 günlük dağılım ve C55/67 üzeri betonlara ilişkin güncel uygulama açıklamaları.",
    },
  ],
  keywords: ["EBİS", "beton numunesi", "2022/07 Genelgesi", "7 günlük beton", "28 günlük beton", "beton etiketi"],
  tags: ["yapı denetimi", "EBİS", "beton numunesi", "laboratuvar"],
};
