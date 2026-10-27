/**
 * Yönetmeliklerin kaynak / yayın durumu.
 * Markdown dönüşümü ve doğrulama sonuçları Aşama 2'de gerçek manifestlerden beslenecek.
 * Buradaki durumlar kaynak metninin web'de yayımlandığı anlamına gelmez.
 */
export type ArchiveAvailability = "source-received" | "source-pending";

export interface RegulationArchiveEntry {
  id: string;
  title: string;
  longTitle: string;
  description: string;
  href: string;
  availability: ArchiveAvailability;
  statusLabel: string;
  statusDetail: string;
  relatedArticlesHref: string;
  chapterCount?: number;
  pdfPageCount?: number;
}

export const TBDY_ARCHIVE: RegulationArchiveEntry = {
  id: "tbdy-2018",
  title: "TBDY 2018",
  longTitle: "Türkiye Bina Deprem Yönetmeliği 2018",
  description: "Deprem etkisi altında binaların tasarımı için esaslar",
  href: "/mevzuat/arsiv/tbdy-2018",
  availability: "source-received",
  statusLabel: "PDF teslim alındı",
  statusDetail: "Kaynak dosya sağlandı. Markdown dönüşümü, doğrulama ve yayın henüz yapılmadı.",
  relatedArticlesHref: "/kategori/deprem-yonetmelik?dal=tbdy#icerikler",
  chapterCount: 17,
  pdfPageCount: 416,
};

export const TS500_ARCHIVE: RegulationArchiveEntry = {
  id: "ts-500",
  title: "TS 500",
  longTitle: "TS 500 — Betonarme Yapıların Tasarım ve Yapım Kuralları",
  description: "Betonarme yapıların tasarım ve yapımına ilişkin standart",
  href: "/mevzuat/arsiv#ts-500",
  availability: "source-pending",
  statusLabel: "Tam metin bekleniyor",
  statusDetail: "Tam metin ve yeniden yayımlama izni doğrulanmadan Markdown arşivi sunulmayacak.",
  relatedArticlesHref: "/kategori/deprem-yonetmelik?dal=ts500#icerikler",
};

export const REGULATION_ARCHIVE: readonly RegulationArchiveEntry[] = [TBDY_ARCHIVE, TS500_ARCHIVE];

/**
 * TBDY PDF'sinin içindekilerinden oluşturulmuş kısa gezinme başlıklarıdır.
 * Yönetmelik hükümleri değildir; bölümlerin tam metni Aşama 2'de eklenecektir.
 */
export const TBDY_CHAPTERS: ReadonlyArray<{ number: number; title: string }> = [
  { number: 1, title: "Genel hükümler" },
  { number: 2, title: "Deprem yer hareketi" },
  { number: 3, title: "Değerlendirme ve tasarım için genel esaslar" },
  { number: 4, title: "Dayanıma göre tasarım — hesap esasları" },
  { number: 5, title: "Şekildeğiştirmeye göre hesap esasları" },
  { number: 6, title: "Yapısal olmayan bina elemanları" },
  { number: 7, title: "Yerinde dökme betonarme taşıyıcı sistemler" },
  { number: 8, title: "Önüretimli betonarme taşıyıcı sistemler" },
  { number: 9, title: "Çelik bina taşıyıcı sistemleri" },
  { number: 10, title: "Hafif çelik bina taşıyıcı sistemleri" },
  { number: 11, title: "Yığma bina taşıyıcı sistemleri" },
  { number: 12, title: "Ahşap bina taşıyıcı sistemleri" },
  { number: 13, title: "Yüksek bina taşıyıcı sistemleri" },
  { number: 14, title: "Yalıtımlı bina taşıyıcı sistemleri" },
  { number: 15, title: "Mevcut bina sistemlerinin değerlendirilmesi" },
  { number: 16, title: "Temel zemini ve temellerin tasarımı" },
  { number: 17, title: "Düzenli betonarme binalar için basitleştirilmiş tasarım" },
];
