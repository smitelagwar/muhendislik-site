/** TBDY 2018 hızlı erişim dizini. Madde etiketleri navigasyon içindir; teknik hüküm kaynağı resmi metindir. */
export const TBDY_OFFICIAL_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
export const TBDY_OFFICIAL_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";

export const TBDY_TOPICS = [
  {
    "id": "tehlike",
    "label": "Deprem tehlikesi",
    "description": "DD, Ss, S1, zemin, spektrum"
  },
  {
    "id": "siniflandirma",
    "label": "Bina ve sistem seçimi",
    "description": "BKS, DTS, BYS, R, D"
  },
  {
    "id": "duzensizlik",
    "label": "Düzensizlik ve diyafram",
    "description": "A1–A3, B1–B3, ek dışmerkezlik"
  },
  {
    "id": "analiz",
    "label": "Modelleme ve analiz",
    "description": "Kütle, rijitlik, modal, öteleme"
  },
  {
    "id": "betonarme",
    "label": "Betonarme detayları",
    "description": "Kolon, kiriş, perde, birleşim"
  },
  {
    "id": "mevcut",
    "label": "Mevcut bina",
    "description": "Bölüm 15 ve güçlendirme"
  },
  {
    "id": "ozel",
    "label": "Zemin ve özel sistemler",
    "description": "Bölüm 14, 16, 17"
  }
] as const;
export type TBDYTopicId = (typeof TBDY_TOPICS)[number]["id"] | "baglam";

export const TBDY_CHAPTERS = [
  {
    "number": 1,
    "title": "Genel hükümler",
    "detail": "Kapsam, esaslar ve tasarım gözetimi"
  },
  {
    "number": 2,
    "title": "Deprem yer hareketi",
    "detail": "DD düzeyleri, harita parametreleri, spektrum"
  },
  {
    "number": 3,
    "title": "Genel tasarım esasları",
    "detail": "BKS, DTS, BYS, performans, düzensizlik"
  },
  {
    "number": 4,
    "title": "Dayanıma göre tasarım",
    "detail": "Modelleme, yöntem seçimi, hesap kontrolleri"
  },
  {
    "number": 5,
    "title": "Şekil değiştirmeye göre tasarım",
    "detail": "Doğrusal olmayan analiz ve performans"
  },
  {
    "number": 6,
    "title": "Yapısal olmayan elemanlar",
    "detail": "Yapısal olmayan elemanların deprem hesabı"
  },
  {
    "number": 7,
    "title": "Yerinde dökme betonarme",
    "detail": "Kiriş, kolon, perde, birleşim detayları"
  },
  {
    "number": 8,
    "title": "Önüretimli betonarme",
    "detail": "Prefabrike taşıyıcı sistem kuralları"
  },
  {
    "number": 9,
    "title": "Çelik binalar",
    "detail": "Çelik sistemlere özgü deprem kuralları"
  },
  {
    "number": 10,
    "title": "Hafif çelik binalar",
    "detail": "Hafif çelik yapı sistemi kuralları"
  },
  {
    "number": 11,
    "title": "Yığma binalar",
    "detail": "Yığma taşıyıcı sistem kuralları"
  },
  {
    "number": 12,
    "title": "Ahşap binalar",
    "detail": "Ahşap taşıyıcı sistem kuralları"
  },
  {
    "number": 13,
    "title": "Yüksek binalar",
    "detail": "Yüksek yapıların özel tasarımı"
  },
  {
    "number": 14,
    "title": "Yalıtımlı binalar",
    "detail": "Deprem yalıtımlı taşıyıcı sistemler"
  },
  {
    "number": 15,
    "title": "Mevcut bina ve güçlendirme",
    "detail": "Performans değerlendirmesi ve güçlendirme"
  },
  {
    "number": 16,
    "title": "Temel zemini ve temeller",
    "detail": "Zemin–temel ve sahaya özel analiz"
  },
  {
    "number": 17,
    "title": "Basitleştirilmiş betonarme",
    "detail": "Düzenli betonarme için özel kapsam"
  }
] as const;

export interface TBDYArticleIndex { topic: TBDYTopicId; chapters: number[]; clauses: string[]; order: number; }
export const TBDY_ARTICLE_INDEX: Record<string, TBDYArticleIndex> = {
  "tbdy-2018-betonarme-analiz": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.5"
    ],
    "order": 10
  },
  "tbdy-2018-dogrusal-olmayan-tasarim": {
    "topic": "analiz",
    "chapters": [
      5
    ],
    "clauses": [
      "5"
    ],
    "order": 22
  },
  "tbdy-2018-duzensizlikler-rehberi": {
    "topic": "duzensizlik",
    "chapters": [
      3,
      4
    ],
    "clauses": [
      "3.6",
      "Tablo 3.6"
    ],
    "order": 1
  },
  "tbdy-2018-sismik-izolasyon": {
    "topic": "ozel",
    "chapters": [
      14
    ],
    "clauses": [
      "14"
    ],
    "order": 10
  },
  "tbdy-deprem-yer-hareketi-duzeyleri": {
    "topic": "tehlike",
    "chapters": [
      2
    ],
    "clauses": [
      "2.2"
    ],
    "order": 1
  },
  "tbdy-afad-ss-s1-okuma": {
    "topic": "tehlike",
    "chapters": [
      2
    ],
    "clauses": [
      "2.3"
    ],
    "order": 2
  },
  "tbdy-yerel-zemin-sinifi-spektrum": {
    "topic": "tehlike",
    "chapters": [
      2,
      16
    ],
    "clauses": [
      "2.3"
    ],
    "order": 3
  },
  "tbdy-tasarim-spektrumu-cizimi": {
    "topic": "tehlike",
    "chapters": [
      2
    ],
    "clauses": [
      "2.3",
      "Denklem 2.2"
    ],
    "order": 4
  },
  "tbdy-r-d-dayanim-fazlaligi": {
    "topic": "siniflandirma",
    "chapters": [
      3
    ],
    "clauses": [
      "3.3"
    ],
    "order": 4
  },
  "tbdy-bina-onem-katsayisi": {
    "topic": "siniflandirma",
    "chapters": [
      3
    ],
    "clauses": [
      "3.2"
    ],
    "order": 2
  },
  "tbdy-suneklik-duzeyi-sistem-farki": {
    "topic": "siniflandirma",
    "chapters": [
      3
    ],
    "clauses": [
      "3.3"
    ],
    "order": 5
  },
  "tbdy-mod-birlesim-srss-cqc": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.8"
    ],
    "order": 13
  },
  "tbdy-goreli-kat-otelenmesi": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.9"
    ],
    "order": 20
  },
  "tbdy-dismerkezlik-kurali": {
    "topic": "duzensizlik",
    "chapters": [
      4
    ],
    "clauses": [
      "4.5.10"
    ],
    "order": 3
  },
  "tbdy-bodrum-katli-binalar": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4"
    ],
    "order": 23
  },
  "tbdy-cati-agirligi-yuk-azaltma": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.5.9"
    ],
    "order": 8
  },
  "tbdy-p-delta-ikinci-mertebe": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.9"
    ],
    "order": 21
  },
  "turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi": {
    "topic": "baglam",
    "chapters": [],
    "clauses": [],
    "order": 98
  },
  "1999-marmara-depreminden-cikarilan-muhendislik-dersleri": {
    "topic": "baglam",
    "chapters": [],
    "clauses": [],
    "order": 99
  },
  "duzensiz-binalarda-dinamik-analiz-zorunlulugu": {
    "topic": "duzensizlik",
    "chapters": [
      3,
      4
    ],
    "clauses": [
      "3.6",
      "Tablo 4.4"
    ],
    "order": 2
  },
  "deprem-yuku-ile-ruzgar-yuku-kombinasyonu": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4"
    ],
    "order": 24
  },
  "deprem-sigortasi-dask-ve-muhendislik-baglantisi": {
    "topic": "baglam",
    "chapters": [],
    "clauses": [],
    "order": 101
  },
  "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek": {
    "topic": "siniflandirma",
    "chapters": [
      3
    ],
    "clauses": [
      "3"
    ],
    "order": 8
  },
  "tbdy-bks-dts-bys-belirleme": {
    "topic": "siniflandirma",
    "chapters": [
      3
    ],
    "clauses": [
      "3.2",
      "3.3"
    ],
    "order": 1
  },
  "tbdy-performans-hedefleri-dd-sh-kh-go": {
    "topic": "siniflandirma",
    "chapters": [
      3,
      5
    ],
    "clauses": [
      "3.4"
    ],
    "order": 6
  },
  "tbdy-etkin-kesit-rijitlikleri": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.5.8",
      "Tablo 4.2"
    ],
    "order": 5
  },
  "tbdy-kutle-kaynagi-hareketli-yuk-katilimi": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.5.9"
    ],
    "order": 7
  },
  "tbdy-rijit-yari-rijit-diyafram": {
    "topic": "duzensizlik",
    "chapters": [
      4
    ],
    "clauses": [
      "4.5.6"
    ],
    "order": 4
  },
  "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.6",
      "Tablo 4.4"
    ],
    "order": 11
  },
  "tbdy-yeterli-mod-modal-kutle-katilimi": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.8"
    ],
    "order": 14
  },
  "tbdy-modal-taban-kesme-olceklendirme": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.8"
    ],
    "order": 15
  },
  "tbdy-yuzde-100-yuzde-30-birlesimi": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.4"
    ],
    "order": 17
  },
  "tbdy-dusey-deprem-etkisi": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.4"
    ],
    "order": 18
  },
  "tbdy-deprem-derzi-hesabi": {
    "topic": "analiz",
    "chapters": [
      4
    ],
    "clauses": [
      "4.9"
    ],
    "order": 25
  },
  "tbdy-bolum-17-basitlestirilmis-tasarim": {
    "topic": "ozel",
    "chapters": [
      17
    ],
    "clauses": [
      "17"
    ],
    "order": 13
  },
  "tbdy-uygulama-esaslari-taslak-statusu": {
    "topic": "baglam",
    "chapters": [],
    "clauses": [],
    "order": 100
  },
  "kisa-kolon-etkisi-tbdy-2018": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 100
  },
  "tbdy-2018-guclu-kolon-kontrolu": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 101
  },
  "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 102
  },
  "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 103
  },
  "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 104
  },
  "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi": {
    "topic": "mevcut",
    "chapters": [],
    "clauses": [],
    "order": 105
  },
  "tbdy-bolum-16-zemin-yapi-etkilesimi": {
    "topic": "ozel",
    "chapters": [
      16
    ],
    "clauses": [],
    "order": 106
  },
  "tbdy-betonarme-ozel-deprem-etriyesi-ciroz": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 107
  },
  "tbdy-betonarme-kenetlenme-bindirme-manson-bolgeleri": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 108
  },
  "tbdy-betonarme-kolon-kesit-eksenel-yuk-siniri": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 109
  },
  "tbdy-betonarme-kolon-boyuna-donati-duzeni": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 110
  },
  "tbdy-betonarme-kolon-sarilma-bolgeleri": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 111
  },
  "tbdy-betonarme-kolon-kapasite-kesme": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 112
  },
  "tbdy-betonarme-kiris-boyut-eksen-kacikligi": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 113
  },
  "tbdy-betonarme-kiris-mesnet-donati-surekliligi": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 114
  },
  "tbdy-betonarme-kiris-sarilma-bolgeleri": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 115
  },
  "tbdy-betonarme-kiris-kapasite-kesme": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 116
  },
  "tbdy-betonarme-kusatilmamis-birlesim": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 117
  },
  "tbdy-betonarme-birlesim-kesme-guvenligi": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 118
  },
  "tbdy-betonarme-perde-kolon-geometri-ayrimi": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 119
  },
  "tbdy-betonarme-perde-kritik-yukseklik-uc-bolge": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 120
  },
  "tbdy-betonarme-perde-govde-uc-donati": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 121
  },
  "tbdy-betonarme-perde-moment-kesme-zarfi": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 122
  },
  "tbdy-betonarme-bag-kirisli-perde": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 123
  },
  "tbdy-betonarme-perde-bosluklari-modelleme": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 124
  },
  "tbdy-betonarme-diyafram-toplayici-baslik": {
    "topic": "betonarme",
    "chapters": [
      7
    ],
    "clauses": [],
    "order": 125
  },
  "mevcut-bina-riskli-yapi-ve-bolum-15-farki": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 126
  },
  "mevcut-bina-bilgi-duzeyleri": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 127
  },
  "mevcut-bina-tasiyici-rolove-hasar-belgeleme": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 128
  },
  "mevcut-bina-karot-beton-dayanimi": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 129
  },
  "mevcut-bina-donati-tespiti-korozyon": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 130
  },
  "mevcut-bina-beklenen-dayanim-bilgi-katsayisi": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 131
  },
  "mevcut-bina-sunek-gevrek-hasar-siniflamasi": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 132
  },
  "mevcut-bina-dogrusal-degerlendirme-sinirlari": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 133
  },
  "guclendirme-betonarme-perde-eklenmesi": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 134
  },
  "guclendirme-temel-sistemi-yuk-aktarimi": {
    "topic": "mevcut",
    "chapters": [
      15
    ],
    "clauses": [],
    "order": 135
  }
};
export function getTBDYArticleMeta(slug: string): TBDYArticleIndex | undefined { return TBDY_ARTICLE_INDEX[slug]; }
export function isTBDYChapter(chapter: number): boolean { return Number.isInteger(chapter) && chapter >= 1 && chapter <= 17; }
