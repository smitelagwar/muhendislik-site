import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KENETLENME_EKLER: DepremPhase3Override = {
  slug: "tbdy-betonarme-kenetlenme-bindirme-manson-bolgeleri",
  description: "TBDY 2018 Bölüm 7'ye göre kenetlenme, bindirmeli ek, kaynaklı ek ve mekanik manşon kararlarını; kolon orta üçte bir kuralı, kiriş kritik bölgeleri, 600 mm şaşırtma ve performans belgelendirmesiyle birlikte açıklar.",
  seoTitle: "TBDY Kenetlenme, Bindirme ve Manşon Bölgeleri | Bölüm 7",
  seoDescription: "Kolon ve kirişlerde bindirme ek yerleri, kritik bölgeler, özel deprem etriyesi, 600 mm şaşırtma, manşon ve kaynak performans şartları.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "genel-kenetlenme-kurali",
      title: "Kenetlenmede başlangıç kuralı TS 500; TBDY kritik bölgelerde ek deprem koşulları getirir",
      content: phase3Lines(
        "TBDY 7.2.6, Bölüm 7'de aksi belirtilmedikçe betonarme donatısının gerekli kenetlenme boyunun **TS 500 kurallarına göre** hesaplanacağını söyler. Bu nedenle tek bir sabit `40ϕ` veya `50ϕ` değeri bütün kenetlenmeler için genel TBDY kuralı değildir; ilgili eleman maddesindeki özel alt sınır varsa ayrıca uygulanır.",
        "",
        "> [!warning] İki katmanlı kontrol",
        "> Önce TS 500'e göre gerekli temel kenetlenme/bindirme boyunu belirleyin. Sonra TBDY'nin kolon, kiriş, perde veya Bölüm 17 gibi özel hükmünün daha elverişsiz bir alt sınır getirip getirmediğini kontrol edin."
      ),
      subsections: [],
    },
    {
      id: "kolon-bindirme",
      title: "Kolon bindirmeli eki serbest yüksekliğin orta üçte birinde yapılır",
      content: phase3Lines(
        "Süneklik düzeyi yüksek kolonlarda 7.3.3.1, boyuna donatı bindirmeli eklerini kolon serbest yüksekliğinin **orta üçte birlik bölgesine** taşır. Bindirme boyu `ℓb`'den kısa olamaz; ek boyunca enine donatı aralığı kolonun en küçük boyutunun `1/3`'ünü ve **150 mm**'yi aşamaz.",
        "",
        "| Kolon bindirme kontrolü | Sınır |",
        "|---|---|",
        "| Ek bölgesi | serbest yüksekliğin orta 1/3'ü |",
        "| Bindirme boyu | ≥ ℓb |",
        "| Ek boyunca enine donatı aralığı | ≤ min(bmin/3, 150 mm) |",
        "| Ek kesitindeki toplam boyuna donatı oranı | ≤ %6 |",
        "",
        "7.7.2–7.7.3, bu boyuna donatı ve düzenleme hükümlerini süneklik düzeyi sınırlı kolonlar için de geçerli kılar."
      ),
      subsections: [],
    },
    {
      id: "kiris-kritik-bolgeler",
      title: "Kirişte bindirmeli ek, akma olasılığı bulunan kritik bölgelerde yasaktır",
      content: phase3Lines(
        "7.4.3.2(a), kiriş sarılma bölgeleri, kolon-kiriş birleşim bölgeleri ve açıklık ortasında **alt donatının akma durumuna ulaşma olasılığı bulunan bölgeler** gibi kritik kesimlerde bindirmeli ek yapılmasına izin vermez.",
        "",
        "Kritik bölgeler dışında bindirmeli ek yapılacaksa ek boyunca 7.2.8'e uygun özel deprem etriyeleri kullanılmalı; bu etriyelerin aralığı **kiriş yüksekliğinin 1/4'ünü ve 100 mm'yi aşmamalıdır**. Üst montaj donatısının açıklıkta sarılma bölgeleri dışında kalan eklerinde özel deprem etriyesi zorunluluğu aranmaz.",
        "",
        "> [!engineering] “Kolon ve kiriş ucunda her tür ek yasaktır” demeyin",
        "> TBDY'nin açık yasak cümlesi burada **bindirmeli ek** içindir. Manşonlu/kaynaklı eklerin yeri için ayrıca 7.2.7'deki performans belgesi ve 7.3.3.3 / 7.4.3.2(b)'deki şaşırtma kuralları uygulanır."
      ),
      subsections: [],
    },
    {
      id: "manson-kaynak",
      title: "Manşon ve kaynak yalnız “aynı dayanımda metal parça” değildir; tekrarlı yük performansı belgelenir",
      content: phase3Lines(
        "7.2.7.2, kaynaklı ve manşonlu boyuna donatı eklerinin **monotonik ve tekrarlı yükler altında yeterli performansının** Bölüm 8 Ek 8A ve geçerli teknik düzenlemeler esas alınarak belgelendirilmesini ister. Deneyle bulunan karakteristik kopma dayanımı, eklenen çubukların TS 500'deki karakteristik kopma dayanımından düşük olamaz; manşonda net kesit alanı dikkate alınır.",
        "",
        "Kaynaklı bindirme ekleri sertifikalı kaynakçılarca yapılmalıdır; **küt kaynak eklerine izin verilmez** ve kaynak yapılacak çeliğin karbon eşdeğeri TS 500'deki `%0.50` sınırını aşamaz. Enine donatının boyuna donatıya kaynakla bağlanması da yasaktır.",
        "",
        "> [!check] Şantiye kabul dosyası",
        "> Manşon tipi/çapı, üretici teknik dokümanı, tekrarlı yük performans belgesi ve gerekiyorsa saha uygulama prosedürü; paftadaki “mekanik ek” notunu doğrulayacak izlenebilir belgeler olarak tutulmalıdır."
      ),
      subsections: [],
    },
    {
      id: "eklerin-sasirtmasi",
      title: "Komşu manşonlu veya kaynaklı ekleri aynı kesitte yığmayın",
      content: phase3Lines(
        "Kolonlarda 7.3.3.3, yanyana boyuna donatılarda yapılan manşonlu veya kaynaklı eklerin arasındaki boyuna mesafeyi **en az 600 mm** yapar. Kirişlerde 7.4.3.2(b) daha açık bir sıra kuralı getirir: manşonlu veya bindirmeli kaynak ekleri bir kesitte ancak **birer donatı atlayarak** uygulanır ve komşu iki ekin merkezleri arasındaki boyuna mesafe yine 600 mm'den az olamaz.",
        "",
        "| Eleman | Şaşırtma koşulu |",
        "|---|---|",
        "| Kolon | yanyana ek merkezleri boyuna mesafe ≥ 600 mm |",
        "| Kiriş | birer donatı atlayarak + komşu ek merkezleri ≥ 600 mm |",
        "",
        "> [!warning] 600 mm tek başına yeterli değil",
        "> Ek türünün 7.2.7 performans koşulları, bindirme ekinin yasaklı bölgeleri ve elemanın kenetlenme hükümleri ayrıca sağlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Genel kenetlenme boyu TS 500'e göre hesaplanıp TBDY özel alt sınırlarıyla karşılaştırılmış mı?",
        "- Kolon bindirmeleri serbest yüksekliğin orta üçte birinde mi?",
        "- Kolon bindirme boyu ≥ℓb ve ek boyunca etriye aralığı ≤min(bmin/3,150 mm) mi?",
        "- Bindirme kesitinde toplam boyuna donatı oranı %6'yı aşmıyor mu?",
        "- Kiriş sarılma, birleşim ve kritik açıklık alt donatı bölgelerinde bindirmeli ek engellenmiş mi?",
        "- Kirişte izin verilen bindirme bölgesinde özel deprem etriyesi aralığı ≤min(h/4,100 mm) mi?",
        "- Manşon/kaynak eklerinin monotonik ve tekrarlı yük performansı belgeli mi?",
        "- Kaynakçı sertifikası, karbon eşdeğeri ≤%0.50 ve küt kaynak yasağı kontrol edilmiş mi?",
        "- Kolon komşu manşon/kaynak ekleri arasında en az 600 mm var mı?",
        "- Kiriş manşon/kaynak ekleri birer donatı atlanarak ve merkezleri ≥600 mm olacak şekilde şaşırtılmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.2.6–7.2.7, 7.3.2–7.3.3 ve 7.4.3"),
  keywords: ["TBDY 2018", "kenetlenme", "bindirme", "manşon", "kaynaklı ek", "orta üçte bir", "600 mm", "100 mm", "7.2.7", "7.4.3.2"],
  tags: ["TBDY 2018", "Betonarme", "Kenetlenme", "Bindirme", "Mekanik Ek"],
};
