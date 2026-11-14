import { jsPDF } from "jspdf";
import { PDF_SERIF_REGULAR_BASE64, PDF_SERIF_BOLD_BASE64 } from "@/lib/calculations/pdf-fonts.generated";
import type { IdeElement, IdeFloor, IdePoint, IdeProject } from "@/lib/hsyncad/ide-import";
import { isSolidElement, type CadElement, type CadModel, type Floor } from "@/lib/hsyncad/model";
import { resolveJunctions } from "@/lib/hsyncad/junctions";
import { calculateFullTakeoff, calculateQuantities } from "@/lib/hsyncad/quantities";
import { polygonArea, polygonPerimeter } from "@/lib/hsyncad/geometry";

export type IdeReportSectionGroup = {
  id: string;
  label: string;
  defaultEnabled: boolean;
};

export const IDE_REPORT_SECTION_GROUPS: readonly IdeReportSectionGroup[] = [
  { id: "aciklama", label: "Açıklama Bilgileri", defaultEnabled: true },
  { id: "kat_yuk", label: "Yapı Kat ve Yük Bilgileri", defaultEnabled: true },
  { id: "dinamik", label: "Dinamik Analiz", defaultEnabled: true },
  { id: "duzensizlik", label: "Yapı Düzensizlikleri", defaultEnabled: true },
  { id: "doseme", label: "Döşemeler", defaultEnabled: true },
  { id: "kiris", label: "Kirişler", defaultEnabled: true },
  { id: "kolon", label: "Kolonlar", defaultEnabled: true },
  { id: "perde", label: "Perdeler", defaultEnabled: true },
  { id: "perde_grubu", label: "Perde Grubu", defaultEnabled: true },
  { id: "birlesim", label: "Birleşim Bölgesi Güvenliği", defaultEnabled: true },
  { id: "surekli_temel", label: "Sürekli Temel", defaultEnabled: true },
  { id: "tekil_temel", label: "Tekil Temeller", defaultEnabled: true },
  { id: "radye", label: "Radye Döşemeler", defaultEnabled: true },
  { id: "merdiven", label: "Merdivenler", defaultEnabled: true },
  { id: "bag_kiris", label: "Temel Bağ Kirişleri", defaultEnabled: false },
  { id: "kazik", label: "Kazıklar", defaultEnabled: false },
  { id: "izolator", label: "Deprem İzolatörleri", defaultEnabled: false },
  { id: "istinat", label: "İstinat Duvarı", defaultEnabled: false },
  { id: "kuyu_temel", label: "Kuyu Temel", defaultEnabled: false },
  { id: "iskele", label: "Kalıp İskelesi", defaultEnabled: false },
  { id: "guclendirme", label: "Güçlendirme Raporları", defaultEnabled: false },
] as const;

export const DEFAULT_IDE_REPORT_SECTIONS = IDE_REPORT_SECTION_GROUPS
  .filter(g => g.defaultEnabled)
  .map(g => g.id);

export type IdeReportTreeLeaf = {
  id: string;
  label: string;
  treeIdx: number | null;
  defaultChecked: boolean;
};

export type IdeReportTreeGroup = {
  id: string;
  label: string;
  defaultEnabled: boolean;
  parentTreeIdx: number | null;
  rptSupported: boolean;
  elementCategory?: string;
  children: readonly IdeReportTreeLeaf[];
};

const RPT_HEADER_ASCII = "IDE BUILDING DESIGNER REPORT SETTINGS FILE";
const RPT_VERSION = 211280;
const RPT_PAYLOAD_LEN = 146;
const RPT_TOTAL_LEN = 193;

const INITIAL_FALSE_INDICES = new Set<number>([
  13, 28, 79, 80, 81, 82, 86, 87, 88, 89, 108, 113, 114, 115, 116, 117, 118,
  132, 133, 134, 135, 136, 137, 138, 139, 140, 143, 145,
]);

export const INITIAL_RPT_FLAGS: readonly boolean[] = Object.freeze(
  Array.from({ length: RPT_PAYLOAD_LEN }, (_, idx) => !INITIAL_FALSE_INDICES.has(idx))
);

export const IDE_REPORT_TREE_GROUPS: readonly IdeReportTreeGroup[] = [
  {
    id: "aciklama",
    label: "Açıklama Bilgileri",
    defaultEnabled: true,
    parentTreeIdx: 8,
    rptSupported: true,
    children: [
      { id: "ide_kapak", label: "İde Kapak (Açıklama)", treeIdx: 1, defaultChecked: true },
      { id: "yapi_yerlesim", label: "Yapı Genel Yerleşim Şekilleri", treeIdx: 2, defaultChecked: true },
      { id: "rapor_indeksi", label: "Rapor İndeksi", treeIdx: 3, defaultChecked: true },
      { id: "yapi_genel", label: "Yapı Genel Bilgileri", treeIdx: 4, defaultChecked: true },
      { id: "yapi_ozet", label: "Yapı Özet Bilgileri", treeIdx: 5, defaultChecked: true },
      { id: "analiz_ayarlari", label: "Analiz Ayarları Özet Bilgileri", treeIdx: 6, defaultChecked: true },
      { id: "tbdy_deprem", label: "TBDY 2018 Deprem Parametreleri Raporu", treeIdx: 7, defaultChecked: true },
    ],
  },
  {
    id: "kat_yuk",
    label: "Yapı Kat ve Yük Bilgileri",
    defaultEnabled: true,
    parentTreeIdx: 125,
    rptSupported: true,
    children: [
      { id: "kat_kesme", label: "Kat kesme kuvvetleri", treeIdx: 122, defaultChecked: true },
      { id: "deprem_devrilme", label: "Deprem Devrilme Kontrolü", treeIdx: 123, defaultChecked: true },
      { id: "kat_genel", label: "Kat Genel Bilgileri", treeIdx: 124, defaultChecked: true },
      { id: "noktasal_yukler", label: "Kullanıcı Tanımlı Noktasal Yükler", treeIdx: 141, defaultChecked: true },
      { id: "eleman_yukleri", label: "Kullanıcı Tanımlı Eleman Yükleri", treeIdx: 142, defaultChecked: true },
    ],
  },
  {
    id: "dinamik",
    label: "Dinamik Analiz",
    defaultEnabled: true,
    parentTreeIdx: 129,
    rptSupported: true,
    children: [
      { id: "dinamik_on_bilgi", label: "Dinamik Analiz Ön Bilgileri Raporu", treeIdx: 126, defaultChecked: true },
      { id: "modal_analiz", label: "Modal Analiz Raporu", treeIdx: 127, defaultChecked: true },
      { id: "detayli_dinamik", label: "Detaylı Dinamik Analiz Raporu", treeIdx: 128, defaultChecked: true },
    ],
  },
  {
    id: "duzensizlik",
    label: "Yapı Düzensizlikleri",
    defaultEnabled: true,
    parentTreeIdx: 23,
    rptSupported: true,
    children: [
      { id: "genel_duzensizlik", label: "Genel Düzensizlik Raporları", treeIdx: 9, defaultChecked: true },
      { id: "r_katsayisi", label: "R Katsayısının Seçim Nedeni", treeIdx: 10, defaultChecked: true },
      { id: "goreli_kat", label: "Göreli Kat Ötelemelerinin Sınırlandırılması", treeIdx: 11, defaultChecked: true },
      { id: "ikinci_mertebe", label: "İkinci Mertebe Etkileri", treeIdx: 12, defaultChecked: true },
      { id: "perde_orani", label: "Perde Oranı Kontrolü", treeIdx: 13, defaultChecked: false },
      { id: "a1_burulma", label: "A1 - Burulma Düzensizliği", treeIdx: 14, defaultChecked: true },
      { id: "b1_zayif_kat", label: "B1 - Komşu Katlar Arası Dayanım Düzensizliği (Zayıf Kat)", treeIdx: 15, defaultChecked: true },
      { id: "b2_yumusak_kat", label: "B2 - Komşu Katlar Arası Rijitlik Düzensizliği (Yumuşak Kat)", treeIdx: 16, defaultChecked: true },
      { id: "b3_sureksizlik", label: "B3 - Taşıyıcı Sistemin Düşey Elemanlarının Süreksizliği", treeIdx: 17, defaultChecked: true },
      { id: "bag_kirisi_baglilik", label: "Bağ Kirişi Bağlılık Derecesi", treeIdx: 18, defaultChecked: true },
      { id: "perde_devrilme", label: "Perde Devrilme Momenti Kontrolü", treeIdx: 19, defaultChecked: true },
      { id: "modal_taban_kesme", label: "Modal Taban Kesme Kuvvetleri ve Devrilme Momentleri", treeIdx: 21, defaultChecked: true },
      { id: "deprem_derzi", label: "Deprem Derzi Hesabı", treeIdx: 22, defaultChecked: true },
      { id: "yapisal_olmayan", label: "Yapısal Olmayan Elemanlara Etkiyen Yatay Yükler", treeIdx: 85, defaultChecked: true },
    ],
  },
  {
    id: "doseme",
    label: "Döşemeler",
    defaultEnabled: true,
    parentTreeIdx: 33,
    rptSupported: true,
    elementCategory: "doseme",
    children: [
      { id: "doseme_on_bilgi", label: "Döşeme Ön Bilgisi", treeIdx: 24, defaultChecked: true },
      { id: "doseme_yuk_analizi", label: "Döşeme Yük Analizi", treeIdx: 25, defaultChecked: true },
      { id: "doseme_noktasal_cizgisel", label: "Döşeme Noktasal ve Çizgisel Yükleri", treeIdx: 26, defaultChecked: true },
      { id: "doseme_kalinlik", label: "Döşeme Kalınlığı Kontrolü", treeIdx: 27, defaultChecked: true },
      { id: "doseme_statik", label: "Döşeme Statik Sonuçları", treeIdx: 28, defaultChecked: false },
      { id: "doseme_betonarme", label: "Döşeme Betonarmesi ve Donatı Hesabı", treeIdx: 29, defaultChecked: true },
      { id: "doseme_hasir", label: "Döşeme Hasır Donatıları", treeIdx: 30, defaultChecked: true },
      { id: "doseme_sehim", label: "Döşeme Sehim Kontrolü", treeIdx: 31, defaultChecked: true },
      { id: "doseme_zimbalama", label: "Döşeme Zımbalama Kontrolü", treeIdx: 32, defaultChecked: true },
      { id: "doseme_gerilme_7113", label: "Döşeme Gerilme Kontrolü (7.11.3)", treeIdx: 90, defaultChecked: true },
      { id: "doseme_deprem_7115", label: "Döşemelerden Perdelere Aktarılan Deprem Yüklerinin Kontrolü (7.11.5)", treeIdx: 91, defaultChecked: true },
      { id: "nervur_on_bilgi", label: "Nervür Döşeme Ön Bilgileri", treeIdx: 79, defaultChecked: false },
      { id: "nervur_aciklama", label: "Nervür Döşeme Açıklama", treeIdx: 80, defaultChecked: false },
      { id: "nervur_betonarme", label: "Nervür Döşeme Betonarme Hesabı", treeIdx: 81, defaultChecked: false },
      { id: "nervur_sehim", label: "Nervür Döşeme Sehim Kontrolü", treeIdx: 82, defaultChecked: false },
      { id: "kaset_on_bilgi", label: "Kaset Döşeme Ön Bilgileri", treeIdx: 86, defaultChecked: false },
      { id: "kaset_aciklama", label: "Kaset Döşeme Açıklama", treeIdx: 87, defaultChecked: false },
      { id: "kaset_betonarme", label: "Kaset Döşeme Betonarme Hesabı", treeIdx: 88, defaultChecked: false },
      { id: "kaset_sehim", label: "Kaset Döşeme Sehim Kontrolü", treeIdx: 89, defaultChecked: false },
    ],
  },
  {
    id: "kiris",
    label: "Kirişler",
    defaultEnabled: true,
    parentTreeIdx: 46,
    rptSupported: true,
    elementCategory: "kiris",
    children: [
      { id: "kiris_on_bilgi", label: "Kiriş Ön Bilgisi", treeIdx: 34, defaultChecked: true },
      { id: "kiris_yuk_analizi", label: "Kiriş Yük Analizi", treeIdx: 35, defaultChecked: true },
      { id: "kiris_yukleri", label: "Kiriş Yükleri", treeIdx: 36, defaultChecked: true },
      { id: "kiris_tbdy_tasarim", label: "TBDY 2018 Tasarım Kuvvetleri", treeIdx: 37, defaultChecked: true },
      { id: "kiris_bilgi_statik", label: "Kiriş Bilgisi ve Statik Sonuçları", treeIdx: 38, defaultChecked: true },
      { id: "kiris_eksenel", label: "Kiriş Eksenel Kuvvet Kontrolü", treeIdx: 139, defaultChecked: false },
      { id: "kiris_betonarme", label: "Kiriş Betonarme Donatı Hesabı", treeIdx: 39, defaultChecked: true },
      { id: "kiris_dengeli_donati", label: "Dengeli donatı oranı kontrolü (TS500 Denklem 7.4)", treeIdx: 40, defaultChecked: true },
      { id: "kiris_kesme_guvenligi", label: "Kiriş Kesme Güvenliği Kontrolü", treeIdx: 41, defaultChecked: true },
      { id: "kiris_kesme_donatisi", label: "Kiriş Kesme Donatısı Hesabı", treeIdx: 42, defaultChecked: true },
      { id: "kiris_burulma", label: "Kiriş Burulma Hesabı ve Kontrolü", treeIdx: 43, defaultChecked: true },
      { id: "kiris_sehim_catlak", label: "Kiriş Sehim ve Çatlak Kontrolü", treeIdx: 44, defaultChecked: true },
      { id: "kiris_aski", label: "Kiriş Askı Donatısı Hesabı", treeIdx: 45, defaultChecked: true },
    ],
  },
  {
    id: "kolon",
    label: "Kolonlar",
    defaultEnabled: true,
    parentTreeIdx: 60,
    rptSupported: true,
    elementCategory: "kolon",
    children: [
      { id: "kolon_on_bilgi", label: "Kolon Ön Bilgisi", treeIdx: 47, defaultChecked: true },
      { id: "kolon_tbdy_tasarim", label: "TBDY 2018 Tasarım Kuvvetleri", treeIdx: 48, defaultChecked: true },
      { id: "kolon_bilgi_statik", label: "Kolon Bilgisi Ve Statik Sonuçları", treeIdx: 49, defaultChecked: true },
      { id: "kolon_betonarme", label: "Kolon Betonarme Donatı Sonuçları", treeIdx: 50, defaultChecked: true },
      { id: "kolon_kesme_donatisi", label: "Kolon Kesme Donatısı Hesabı", treeIdx: 51, defaultChecked: true },
      { id: "kolon_burkulma_yanal", label: "Kolon Burkulama Hesabı Yanal Ötelemeler", treeIdx: 52, defaultChecked: true },
      { id: "kolon_burkulma_moment", label: "Kolon Burkulma Hesabı Moment Arttımı", treeIdx: 53, defaultChecked: true },
      { id: "kolon_kesme_guvenligi", label: "Kolon Kesme Güvenliği", treeIdx: 54, defaultChecked: true },
      { id: "kolon_guclu", label: "Güçlü Kolon Kontrolleri", treeIdx: 55, defaultChecked: true },
      { id: "kolon_poligon", label: "Poligon Kolon Detayları", treeIdx: 56, defaultChecked: true },
      { id: "kolon_eksenel", label: "Kolon Eksenel Kuvvet Kontrolü", treeIdx: 57, defaultChecked: true },
      { id: "kolon_surtunme", label: "Sürtünme Kesmesi", treeIdx: 58, defaultChecked: true },
    ],
  },
  {
    id: "perde",
    label: "Perdeler",
    defaultEnabled: true,
    parentTreeIdx: 70,
    rptSupported: true,
    elementCategory: "perde",
    children: [
      { id: "perde_on_bilgi", label: "Perde Ön Bilgisi", treeIdx: 61, defaultChecked: true },
      { id: "perde_dusey_yuk", label: "Perde Kullanıcı Tanımlı Düşey Yükleri", treeIdx: 62, defaultChecked: true },
      { id: "perde_yatay_yuk", label: "Perde Kullanıcı Tanımlı Yatay Yükleri", treeIdx: 63, defaultChecked: true },
      { id: "perde_tbdy_tasarim", label: "TBDY 2018 Tasarım Kuvvetleri", treeIdx: 64, defaultChecked: true },
      { id: "perde_bilgi_statik", label: "Perde Bilgileri ve Statik Sonuçları", treeIdx: 65, defaultChecked: true },
      { id: "perde_tasarim_moment", label: "Perdelerin Tasarım Eğilme Momentleri", treeIdx: 66, defaultChecked: true },
      { id: "perde_betonarme", label: "Perde Betonarme Donatıları", treeIdx: 67, defaultChecked: true },
      { id: "perde_kesme_guvenligi", label: "Perde Kesme Güvenliği", treeIdx: 68, defaultChecked: true },
      { id: "perde_guclu", label: "Güçlü Perde Kontrolleri", treeIdx: 69, defaultChecked: true },
      { id: "perde_eksenel", label: "Perde Eksenel Kuvvet Kontrolü", treeIdx: 83, defaultChecked: true },
      { id: "perde_surtunme", label: "Sürtünme Kesmesi", treeIdx: 84, defaultChecked: true },
    ],
  },
  {
    id: "perde_grubu",
    label: "Perde Grubu",
    defaultEnabled: true,
    parentTreeIdx: 78,
    rptSupported: true,
    elementCategory: "perde_grubu",
    children: [
      { id: "pg_on_bilgi", label: "Perde Grubu Ön Bilgisi", treeIdx: 71, defaultChecked: true },
      { id: "pg_tbdy_tasarim", label: "TBDY 2018 Tasarım Kuvvetleri", treeIdx: 72, defaultChecked: true },
      { id: "pg_bilgi_statik", label: "Perde Grubu Bilgileri ve Statik Sonuçları", treeIdx: 73, defaultChecked: true },
      { id: "pg_tasarim_moment", label: "Perde Grubu Tasarım Eğilme Momentleri", treeIdx: 74, defaultChecked: true },
      { id: "pg_betonarme", label: "Perde Grubu Betonarmesi", treeIdx: 75, defaultChecked: true },
      { id: "pg_kesme_guvenligi", label: "Perde Grubu Kesme Güvenliği", treeIdx: 76, defaultChecked: true },
      { id: "pg_eksenel", label: "Perde Grubu Eksenel Kuvvet Kontrolü", treeIdx: 77, defaultChecked: true },
    ],
  },
  {
    id: "birlesim",
    label: "Birleşim Bölgesi Güvenliği",
    defaultEnabled: true,
    parentTreeIdx: 120,
    rptSupported: true,
    elementCategory: "birlesim",
    children: [
      { id: "kolon_kiris_birlesim", label: "Kolon Kiriş Birleşim Bölgesi Kesme Güvenliği", treeIdx: 119, defaultChecked: true },
    ],
  },
  {
    id: "surekli_temel",
    label: "Sürekli Temel",
    defaultEnabled: true,
    parentTreeIdx: 98,
    rptSupported: true,
    elementCategory: "surekli_temel",
    children: [
      { id: "st_on_bilgi", label: "Sürekli Temel Ön Bilgileri", treeIdx: 92, defaultChecked: true },
      { id: "st_etkiyen_yuk", label: "Temele Etkiyen Yükler (TBDY 2018 4.10.3)", treeIdx: 93, defaultChecked: true },
      { id: "st_bilgi_statik", label: "Sürekli Temel Bilgileri Ve Statik Sonuçları", treeIdx: 94, defaultChecked: true },
      { id: "st_betonarme", label: "Sürekli Temel Betonarme Hesapları", treeIdx: 95, defaultChecked: true },
      { id: "st_kesme", label: "Sürekli Temel Kesme Donatısı Hesabı", treeIdx: 96, defaultChecked: true },
      { id: "st_ampatman", label: "Sürekli Temel Ampatman Hesabı", treeIdx: 97, defaultChecked: true },
    ],
  },
  {
    id: "tekil_temel",
    label: "Tekil Temeller",
    defaultEnabled: true,
    parentTreeIdx: 103,
    rptSupported: true,
    elementCategory: "tekil_temel",
    children: [
      { id: "tt_on_bilgi", label: "Tekil Temel Ön Bilgisi", treeIdx: 99, defaultChecked: true },
      { id: "tt_kolon_yuk", label: "Tekil Temel Kolon Yükleri", treeIdx: 100, defaultChecked: true },
      { id: "tt_statik_betonarme", label: "Tekil Temel Statik ve Betonarme Hesabı", treeIdx: 101, defaultChecked: true },
      { id: "tt_zimbalama", label: "Tekil Temel Zımbalama Kontrolleri", treeIdx: 102, defaultChecked: true },
    ],
  },
  {
    id: "radye",
    label: "Radye Döşemeler",
    defaultEnabled: true,
    parentTreeIdx: 112,
    rptSupported: true,
    elementCategory: "radye",
    children: [
      { id: "radye_on_bilgi", label: "Radye Temel Ön Bilgisi", treeIdx: 104, defaultChecked: true },
      { id: "radye_sonlu_eleman", label: "Radye Temel Sonlu Eleman Bilgileri", treeIdx: 105, defaultChecked: true },
      { id: "radye_noktasal_cizgisel", label: "Radye Döşeme Noktasal ve Çizgisel Yükleri", treeIdx: 106, defaultChecked: true },
      { id: "radye_etkiyen_yuk", label: "Radye Temele Etkiyen Yükler (TBDY 2018 4.10.3)", treeIdx: 107, defaultChecked: true },
      { id: "radye_statik", label: "Radye Temel Statik Sonuçları", treeIdx: 108, defaultChecked: false },
      { id: "radye_zemin_gerilme", label: "Radye Temel Sonlu Eleman Zemin Gerilmeleri", treeIdx: 109, defaultChecked: true },
      { id: "radye_betonarme", label: "Radye Temel Statik ve Betonarme Donatı Hesabı", treeIdx: 110, defaultChecked: true },
      { id: "radye_zimbalama", label: "Radye Temel Zımbalama Kontrolleri", treeIdx: 111, defaultChecked: true },
    ],
  },
  {
    id: "bag_kiris",
    label: "Temel Bağ Kirişleri",
    defaultEnabled: false,
    parentTreeIdx: 136,
    rptSupported: true,
    elementCategory: "bag_kiris",
    children: [
      { id: "bag_kiris_donati", label: "Temel Bağ Kirişi Donatıları", treeIdx: 135, defaultChecked: false },
    ],
  },
  {
    id: "kazik",
    label: "Kazıklar",
    defaultEnabled: false,
    parentTreeIdx: 118,
    rptSupported: true,
    elementCategory: "kazik",
    children: [
      { id: "kazik_radye_genel", label: "Kazıklı Radye Temel Genel Bilgileri", treeIdx: 113, defaultChecked: false },
      { id: "kazik_bilgileri", label: "Kazık Bilgileri", treeIdx: 114, defaultChecked: false },
      { id: "kazik_modelleme", label: "Kazık Modelleme Esasları", treeIdx: 115, defaultChecked: false },
      { id: "kazik_uc_tesir", label: "Kazık Uç Tesirleri", treeIdx: 116, defaultChecked: false },
      { id: "kazik_tasima_gucu", label: "Kazık Taşıma Gücü Tahkikleri", treeIdx: 117, defaultChecked: false },
    ],
  },
  {
    id: "izolator",
    label: "Deprem İzolatörleri",
    defaultEnabled: false,
    parentTreeIdx: 145,
    rptSupported: true,
    elementCategory: "izolator",
    children: [
      { id: "deprem_izolatorleri", label: "Deprem İzolatörleri", treeIdx: 143, defaultChecked: false },
    ],
  },
  {
    id: "merdiven",
    label: "Merdivenler",
    defaultEnabled: true,
    parentTreeIdx: 131,
    rptSupported: true,
    elementCategory: "merdiven",
    children: [
      { id: "merdiven_genel", label: "Merdiven Genel Raporu", treeIdx: 130, defaultChecked: true },
    ],
  },
  {
    id: "istinat",
    label: "İstinat Duvarı",
    defaultEnabled: false,
    parentTreeIdx: 132,
    rptSupported: true,
    elementCategory: "istinat",
    children: [],
  },
  {
    id: "kuyu_temel",
    label: "Kuyu Temel",
    defaultEnabled: false,
    parentTreeIdx: 133,
    rptSupported: true,
    elementCategory: "kuyu_temel",
    children: [],
  },
  {
    id: "iskele",
    label: "Kalıp İskelesi",
    defaultEnabled: false,
    parentTreeIdx: 134,
    rptSupported: true,
    elementCategory: "iskele",
    children: [],
  },
  {
    id: "guclendirme",
    label: "Güçlendirme Raporları",
    defaultEnabled: false,
    parentTreeIdx: 140,
    rptSupported: true,
    elementCategory: "guclendirme",
    children: [
      { id: "guclendirme_kolon_etki", label: "Kolon Etkileri", treeIdx: 137, defaultChecked: false },
      { id: "guclendirme_kolon_kontrol", label: "Kolon Kontrolü", treeIdx: 138, defaultChecked: false },
    ],
  },
  {
    id: "celik",
    label: "Çelik Raporları",
    defaultEnabled: false,
    parentTreeIdx: null,
    rptSupported: false,
    elementCategory: "celik",
    children: [
      { id: "ts_en_1991_ruzgar", label: "TS EN 1991-1-4 Rüzgar Yükleri", treeIdx: null, defaultChecked: false },
      { id: "celik_makas", label: "Çelik Makas", treeIdx: null, defaultChecked: false },
      { id: "uzay_kafes", label: "Uzay Kafes", treeIdx: null, defaultChecked: true },
      { id: "r_asik", label: "R Aşık", treeIdx: null, defaultChecked: true },
      { id: "uzay_asik", label: "Uzay Aşık", treeIdx: null, defaultChecked: true },
      { id: "celik_asik", label: "Çelik Aşık", treeIdx: null, defaultChecked: false },
      { id: "tali_celik_kiris", label: "Tali Çelik Kiriş", treeIdx: null, defaultChecked: false },
      { id: "celik_kiris", label: "Çelik Kiriş", treeIdx: null, defaultChecked: false },
      { id: "celik_kolon", label: "Çelik Kolon", treeIdx: null, defaultChecked: false },
      { id: "merkezi_capraz", label: "Merkezi Çelik Çapraz", treeIdx: null, defaultChecked: false },
      { id: "dismerkez_capraz", label: "Dışmerkez Çelik Çapraz", treeIdx: null, defaultChecked: false },
      { id: "kren", label: "Kren", treeIdx: null, defaultChecked: false },
      { id: "kompozit_olmayan_petek", label: "Kompozit Olmayan Petek Kirişler", treeIdx: null, defaultChecked: false },
      { id: "kompozit_petek", label: "Kompozit Petek Kirişleri", treeIdx: null, defaultChecked: true },
      { id: "kompozit_kiris", label: "Kompozit Kirişler", treeIdx: null, defaultChecked: false },
      { id: "celik_birlesim", label: "Birleşim", treeIdx: null, defaultChecked: false },
    ],
  },
] as const;

function hasAnyActiveRptGroup(flags: readonly boolean[]): boolean {
  return IDE_REPORT_TREE_GROUPS.some(
    g =>
      g.rptSupported &&
      ((g.parentTreeIdx !== null && Boolean(flags[g.parentTreeIdx])) ||
        g.children.some(c => c.treeIdx !== null && Boolean(flags[c.treeIdx])))
  );
}

/** Build a 193-byte ideCAD 11.28 .rpt profile from 146 boolean flags. */
export function buildRptProfileBytes(flags: readonly boolean[]): Uint8Array {
  if (!Array.isArray(flags) || flags.length !== RPT_PAYLOAD_LEN) {
    throw new Error(`RPT profili için tam ${RPT_PAYLOAD_LEN} bayrak gereklidir.`);
  }
  const out = new Uint8Array(RPT_TOTAL_LEN);
  for (let i = 0; i < RPT_HEADER_ASCII.length; i++) {
    out[i] = RPT_HEADER_ASCII.charCodeAt(i);
  }
  out[RPT_HEADER_ASCII.length] = 0;
  const view = new DataView(out.buffer);
  view.setUint32(43, RPT_VERSION, true);
  for (let i = 0; i < RPT_PAYLOAD_LEN; i++) {
    out[47 + i] = flags[i] ? 1 : 0;
  }
  return out;
}

/** Validate a 193-byte ideCAD 11.28 .rpt profile and return its 146 boolean flags. */
export function parseRptProfileBytes(bytes: ArrayBuffer | Uint8Array): boolean[] {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (arr.length !== RPT_TOTAL_LEN) {
    throw new Error(`Geçersiz .rpt dosya boyutu: ${arr.length} bayt (${RPT_TOTAL_LEN} bayt bekleniyor).`);
  }
  for (let i = 0; i < RPT_HEADER_ASCII.length; i++) {
    if (arr[i] !== RPT_HEADER_ASCII.charCodeAt(i)) {
      throw new Error("Geçersiz .rpt dosya başlığı.");
    }
  }
  if (arr[RPT_HEADER_ASCII.length] !== 0) {
    throw new Error("Geçersiz .rpt dosya başlık sonlandırıcısı.");
  }
  const view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  const version = view.getUint32(43, true);
  if (version !== RPT_VERSION) {
    throw new Error(`Desteklenmeyen .rpt sürümü: ${version} (${RPT_VERSION} bekleniyor).`);
  }
  const flags: boolean[] = [];
  for (let i = 0; i < RPT_PAYLOAD_LEN; i++) {
    const byteVal = arr[47 + i];
    if (byteVal !== 0 && byteVal !== 1) {
      throw new Error(`Geçersiz .rpt bayrak değeri (indeks ${i}): ${byteVal}`);
    }
    flags.push(byteVal === 1);
  }
  return flags;
}

/** Toggle all leaf flags and parentTreeIdx of a group, maintaining root flag 0. */
export function syncRptFlagsWithGroup(flags: readonly boolean[], groupId: string, checked: boolean): boolean[] {
  if (!Array.isArray(flags) || flags.length !== RPT_PAYLOAD_LEN) {
    throw new Error(`RPT bayrak dizisi ${RPT_PAYLOAD_LEN} elemanlı olmalıdır.`);
  }
  const next = flags.map(Boolean);
  const group = IDE_REPORT_TREE_GROUPS.find(g => g.id === groupId);
  if (!group || !group.rptSupported) {
    return next;
  }
  for (const child of group.children) {
    if (child.treeIdx !== null && child.treeIdx >= 0 && child.treeIdx < RPT_PAYLOAD_LEN) {
      next[child.treeIdx] = checked;
    }
  }
  if (group.parentTreeIdx !== null && group.parentTreeIdx >= 0 && group.parentTreeIdx < RPT_PAYLOAD_LEN) {
    next[group.parentTreeIdx] = checked;
  }
  next[0] = hasAnyActiveRptGroup(next);
  return next;
}

/** Update a single leaf flag and sync the group's parentTreeIdx + root flag 0. */
export function syncRptFlagsWithLeaf(
  flags: readonly boolean[],
  groupId: string,
  treeIdx: number,
  checked: boolean
): boolean[] {
  if (!Array.isArray(flags) || flags.length !== RPT_PAYLOAD_LEN) {
    throw new Error(`RPT bayrak dizisi ${RPT_PAYLOAD_LEN} elemanlı olmalıdır.`);
  }
  const next = flags.map(Boolean);
  if (treeIdx >= 0 && treeIdx < RPT_PAYLOAD_LEN) {
    next[treeIdx] = checked;
  }
  const group = IDE_REPORT_TREE_GROUPS.find(g => g.id === groupId);
  if (group && group.rptSupported && group.parentTreeIdx !== null) {
    if (group.children.length > 0) {
      next[group.parentTreeIdx] = group.children.some(
        c => c.treeIdx !== null && Boolean(next[c.treeIdx])
      );
    }
  }
  next[0] = hasAnyActiveRptGroup(next);
  return next;
}

/** Derive active 21 .rpt group IDs from a 146-flag vector. */
export function deriveSectionsFromRptFlags(flags: readonly boolean[]): string[] {
  if (!Array.isArray(flags) || flags.length !== RPT_PAYLOAD_LEN) {
    throw new Error(`RPT bayrak dizisi ${RPT_PAYLOAD_LEN} elemanlı olmalıdır.`);
  }
  return IDE_REPORT_TREE_GROUPS
    .filter(
      g =>
        g.rptSupported &&
        ((g.parentTreeIdx !== null && Boolean(flags[g.parentTreeIdx])) ||
          g.children.some(c => c.treeIdx !== null && Boolean(flags[c.treeIdx])))
    )
    .map(g => g.id);
}

export type IdeMetrajOptions = {
  enabled?: boolean;
  kalip?: boolean;
  beton?: boolean;
  donati?: boolean;
  detay?: boolean;
};

export type IdeSourcePdfMetadata = {
  title?: string;
  designer?: string;
  revisionNote?: string;
  dateNote?: string;
  writeProjectFilename?: boolean;
  logoDataUrl?: string;
  city?: string;
  district?: string;
  usagePurpose?: string;
  pafta?: string;
  ada?: string;
  parsel?: string;
};

export type IdeSourcePdfOptions = {
  project?: boolean;
  slabLoads?: boolean;
  elements?: boolean;
  scope?: "all" | "active_floor" | "selected";
  activeFloorName?: string;
  selectedElementIds?: string[];
  sections?: string[];
  rptFlags?: boolean[];
  ideKapak?: boolean;
  metraj?: IdeMetrajOptions;
  cadModel?: CadModel;
  metadata?: IdeSourcePdfMetadata;
  receiptWarnings?: string[] | null;
  warningsStatus?: string;
  profileSha256?: string;
  optionsSha256?: string;
};

export type IdeGroupPresence = {
  applicable: boolean;
  present: boolean;
  count: number;
  label: string;
};

const GENERAL_GROUP_IDS = new Set(["aciklama", "kat_yuk", "dinamik", "duzensizlik"]);

const TYPE_LABELS: Record<string, string> = {
  column: "Kolon",
  beam: "Kiriş",
  wall: "Perde/Duvar",
  slab: "Döşeme",
  stair: "Merdiven",
  axis: "Aks",
  slabEdge: "Döşeme Kenarı",
  band: "Bant",
  section: "Kesit",
  line: "Çizgi",
  unknown: "Bilinmeyen",
};

const STRUCTURAL_SECTION_IDS = [
  "doseme",
  "kiris",
  "kolon",
  "perde",
  "perde_grubu",
  "birlesim",
  "surekli_temel",
  "tekil_temel",
  "radye",
  "bag_kiris",
  "kazik",
  "izolator",
  "merdiven",
  "istinat",
  "kuyu_temel",
  "iskele",
  "guclendirme",
  "celik",
] as const;

function normalizeTr(value: string): string {
  return value
    .replace(/[İIı]/g, "i")
    .replace(/[Şş]/g, "s")
    .replace(/[Ğğ]/g, "g")
    .replace(/[Üü]/g, "u")
    .replace(/[Öö]/g, "o")
    .replace(/[Çç]/g, "c")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function floorMatchesName(floorName: string, targetName: string): boolean {
  const a = normalizeTr(floorName);
  const b = normalizeTr(targetName);
  if (!a || !b) return false;
  return a === b || `${a} tavani` === b || a === `${b} tavani`;
}

type UnifiedElement = {
  id: string;
  name: string;
  type: string;
  floorId: string;
  floorName: string;
  foundation?: boolean;
  structural?: boolean;
  group?: string;
  layer?: string;
  category?: string;
  structuralRole?: string;
  ide?: IdeElement;
  cad?: CadElement;
};

function isRadyeSlab(el: UnifiedElement): boolean {
  if (el.type !== "slab") return false;
  if (el.foundation !== undefined) return Boolean(el.foundation);
  if (el.structuralRole === "raft") return true;
  const g = normalizeTr(el.group ?? "");
  const l = normalizeTr(el.layer ?? "");
  const f = normalizeTr(el.floorName ?? "");
  return g.includes("radye") || l.includes("radye") || f.includes("radye");
}

function classifyUnifiedElementCategory(el: UnifiedElement): string | null {
  const t = normalizeTr(el.type);
  const c = normalizeTr(el.category ?? "");
  if (c && STRUCTURAL_SECTION_IDS.includes(c as (typeof STRUCTURAL_SECTION_IDS)[number])) return c;
  if (t === "surekli_temel" || t === "continuous_footing") return "surekli_temel";
  if (t === "tekil_temel" || t === "pad_footing" || t === "isolated_footing" || el.structuralRole === "footing") return "tekil_temel";
  if (t === "bag_kiris" || t === "tie_beam") return "bag_kiris";
  if (t === "kazik" || t === "pile") return "kazik";
  if (t === "izolator" || t === "isolator") return "izolator";
  if (t === "istinat" || t === "retaining_wall") return "istinat";
  if (t === "kuyu_temel" || t === "caisson") return "kuyu_temel";
  if (t === "iskele" || t === "scaffolding") return "iskele";
  if (t === "guclendirme" || t === "retrofit") return "guclendirme";
  if (t === "celik" || t === "steel") return "celik";
  if (el.type === "slab") return isRadyeSlab(el) ? "radye" : "doseme";
  if (el.type === "column") return "kolon";
  if (el.type === "beam") return "kiris";
  if (el.type === "wall") return el.structural !== false ? "perde" : null;
  if (el.type === "stair") return "merdiven";
  return null;
}

type CadModelWithOptionalStructural = CadModel & {
  structural?: {
    objects?: readonly { elementId: string; role?: string }[];
    settings?: {
      sds?: { value?: number | string | null };
      sd1?: { value?: number | string | null };
      r?: { value?: number | string | null };
      importance?: { value?: number | string | null };
    };
  };
};

function collectUnifiedElements(
  source: IdeProject | null | undefined,
  model: CadModel | null | undefined,
  scope: "all" | "active_floor" | "selected",
  activeFloorName?: string,
  selectedElementIds?: readonly string[]
): UnifiedElement[] {
  const sourceFloors = new Map((source?.floors ?? []).map(f => [f.id, f.name]));
  const modelFloors = new Map((model?.floors ?? []).map(f => [f.id, f.name]));
  const structuralRoleMap = new Map(
    ((model as CadModelWithOptionalStructural | null | undefined)?.structural?.objects ?? []).map(obj => [obj.elementId, obj.role])
  );

  let allowedSourceFloorIds: Set<string> | null = null;
  let allowedModelFloorIds: Set<string> | null = null;
  if (scope === "active_floor") {
    const target = activeFloorName?.trim() ?? "";
    allowedSourceFloorIds = new Set(
      (source?.floors ?? []).filter(f => floorMatchesName(f.name, target)).map(f => f.id)
    );
    allowedModelFloorIds = new Set(
      (model?.floors ?? []).filter(f => floorMatchesName(f.name, target)).map(f => f.id)
    );
  }
  const selectedSet = scope === "selected" ? new Set(selectedElementIds ?? []) : null;

  const byId = new Map<string, UnifiedElement>();

  for (const e of source?.elements ?? []) {
    if (allowedSourceFloorIds && !allowedSourceFloorIds.has(e.floorId)) continue;
    if (selectedSet && !selectedSet.has(e.id)) continue;
    const raw = e as IdeElement & { group?: string; category?: string };
    byId.set(e.id, {
      id: e.id,
      name: e.name,
      type: e.type,
      floorId: e.floorId,
      floorName: sourceFloors.get(e.floorId) ?? "Bilinmeyen kat",
      foundation: e.foundation,
      structural: e.structural,
      group: raw.group,
      category: raw.category,
      structuralRole: structuralRoleMap.get(e.id),
      ide: e,
    });
  }

  for (const e of model?.elements ?? []) {
    if (allowedModelFloorIds && !allowedModelFloorIds.has(e.floorId)) continue;
    if (selectedSet && !selectedSet.has(e.id)) continue;
    const raw = e as CadElement & { foundation?: boolean; structural?: boolean; category?: string };
    const existing = byId.get(e.id);
    if (existing) {
      existing.group = existing.group ?? e.group;
      existing.layer = e.layer;
      existing.cad = e;
      if (existing.floorName === "Bilinmeyen kat") {
        existing.floorName = modelFloors.get(e.floorId) ?? existing.floorName;
      }
      if (existing.foundation === undefined && raw.foundation !== undefined) {
        existing.foundation = raw.foundation;
      }
      if (existing.structural === undefined && raw.structural !== undefined) {
        existing.structural = raw.structural;
      }
      if (existing.category === undefined && raw.category !== undefined) {
        existing.category = raw.category;
      }
    } else {
      byId.set(e.id, {
        id: e.id,
        name: e.name,
        type: e.type,
        floorId: e.floorId,
        floorName: modelFloors.get(e.floorId) ?? "Bilinmeyen kat",
        foundation: raw.foundation,
        structural: raw.structural,
        group: e.group,
        layer: e.layer,
        category: raw.category,
        structuralRole: structuralRoleMap.get(e.id),
        cad: e,
      });
    }
  }

  return Array.from(byId.values());
}

/** Detect which report groups actually have elements in the project/scope so empty groups are skipped in the PDF. */
export function getIdeReportGroupPresence(
  source: IdeProject | null | undefined,
  model: CadModel | null | undefined,
  scope: "all" | "active_floor" | "selected" = "all",
  activeFloorName?: string,
  selectedElementIds?: readonly string[]
): Record<string, IdeGroupPresence> {
  const elements = collectUnifiedElements(source, model, scope, activeFloorName, selectedElementIds);
  const counts: Record<string, number> = {};
  const floorCols = new Map<string, number>();
  const floorBeams = new Map<string, number>();

  for (const el of elements) {
    const cat = classifyUnifiedElementCategory(el);
    if (!cat) continue;
    counts[cat] = (counts[cat] ?? 0) + 1;
    if (cat === "perde" && el.group?.trim()) {
      counts.perde_grubu = (counts.perde_grubu ?? 0) + 1;
    }
    if (cat === "kolon") {
      floorCols.set(el.floorId, (floorCols.get(el.floorId) ?? 0) + 1);
    }
    if (cat === "kiris") {
      floorBeams.set(el.floorId, (floorBeams.get(el.floorId) ?? 0) + 1);
    }
  }

  let birlesimCount = 0;
  for (const [floorId, colCount] of floorCols.entries()) {
    const beamCount = floorBeams.get(floorId) ?? 0;
    if (colCount > 0 && beamCount > 0) {
      birlesimCount += Math.min(colCount, beamCount);
    }
  }
  counts.birlesim = birlesimCount;

  const result: Record<string, IdeGroupPresence> = {};
  for (const group of IDE_REPORT_TREE_GROUPS) {
    if (GENERAL_GROUP_IDS.has(group.id)) {
      result[group.id] = {
        applicable: false,
        present: true,
        count: 1,
        label: group.label,
      };
    } else {
      const count = counts[group.id] ?? 0;
      result[group.id] = {
        applicable: true,
        present: count > 0,
        count,
        label: group.label,
      };
    }
  }
  return result;
}

function formatIdeElementSummary(e: IdeElement, number: (v: number) => string): string {
  const parts: string[] = [TYPE_LABELS[e.type] ?? e.type, e.name];
  if (e.foundation) parts.push("[Radye]");
  if (e.type === "wall" && e.structural === false) parts.push("[Mimari]");
  const sec = e.sectionLabel ?? e.planAnnotation?.section;
  if (sec) parts.push(`Kesit: ${sec}`);
  else if (e.circleSection) parts.push(`D=${number(2 * e.circleSection.radius)} m`);
  else if (e.width !== undefined && e.height !== undefined) parts.push(`${number(e.width)}×${number(e.height)} m`);
  else if (e.thickness !== undefined) parts.push(`h=${number(e.thickness)} m`);
  if (e.top !== undefined && e.bottom !== undefined) parts.push(`H=${number(e.top - e.bottom)} m`);
  if (e.planOnly) parts.push("(Yalnız plan)");
  return parts.join(" | ");
}

function formatCadElementSummary(e: CadElement, number: (v: number) => string): string {
  const parts: string[] = [TYPE_LABELS[e.type] ?? e.type, e.name];
  if (e.type === "column") {
    parts.push(`${number(e.width)}×${number(e.depth)} m | H=${number(e.height)} m`);
  } else if (e.type === "beam") {
    const len = Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y);
    parts.push(`${number(e.width)}×${number(e.height)} m | L=${number(len)} m`);
  } else if (e.type === "wall") {
    const len = Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y);
    parts.push(`t=${number(e.thickness)} m | L=${number(len)} m | H=${number(e.height)} m`);
  } else if (e.type === "slab") {
    parts.push(`h=${number(e.thickness)} m | A=${number(polygonArea(e.points))} m²`);
  }
  return parts.join(" | ");
}

function polylineLength(pts: readonly IdePoint[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

type SourceTakeoffRow = {
  id: string;
  name: string;
  type: string;
  floorName: string;
  dimensionText: string;
  concreteM3: number | null;
  formworkM2: number | null;
  rebarKg: number | null;
};

type ComputedMetraj = {
  sourceLabel: string;
  byType: { typeLabel: string; count: number; grossM3: number; netM3: number | null; formworkM2: number }[];
  byFloor: { floorName: string; grossM3: number; netM3: number | null; formworkM2: number; rebarKg: number | null }[];
  elements: SourceTakeoffRow[];
  totalGrossM3: number;
  totalNetM3: number | null;
  totalFormworkM2: number;
  totalRebarKg: number | null;
  knownRebarSubtotalKg: number;
  missingRebarCount: number;
  warnings: string[];
};

function computeSourceOnlyMetraj(
  elements: readonly UnifiedElement[],
  floors: readonly (IdeFloor | Floor)[]
): ComputedMetraj {
  const floorHeightMap = new Map(floors.map(f => [f.id, f.height]));
  const byTypeMap = new Map<string, { typeLabel: string; count: number; grossM3: number; formworkM2: number }>();
  const byFloorMap = new Map<string, { floorName: string; grossM3: number; formworkM2: number }>();
  const rows: SourceTakeoffRow[] = [];
  let totalGrossM3 = 0;
  let totalFormworkM2 = 0;

  for (const el of elements) {
    const ide = el.ide;
    if (!ide) continue;
    const cat = classifyUnifiedElementCategory(el);
    if (!cat || !["doseme", "radye", "kiris", "kolon", "perde"].includes(cat)) continue;

    const fh = floorHeightMap.get(ide.floorId) ?? 3;
    const h = ide.top !== undefined && ide.bottom !== undefined && ide.top > ide.bottom ? ide.top - ide.bottom : (ide.height ?? fh);
    let concrete: number | null = null;
    let formwork: number | null = null;
    let dim = "";

    if (ide.type === "column") {
      let area = 0;
      let perim = 0;
      if (ide.circleSection) {
        area = Math.PI * ide.circleSection.radius * ide.circleSection.radius;
        perim = 2 * Math.PI * ide.circleSection.radius;
        dim = `D=${(2 * ide.circleSection.radius).toFixed(2)} m, H=${h.toFixed(2)} m`;
      } else if (ide.footprint && ide.footprint.length >= 3) {
        area = polygonArea(ide.footprint);
        perim = polygonPerimeter(ide.footprint);
        dim = `A=${area.toFixed(3)} m², H=${h.toFixed(2)} m`;
      } else if (ide.width !== undefined && ide.height !== undefined) {
        area = ide.width * ide.height;
        perim = 2 * (ide.width + ide.height);
        dim = `${ide.width.toFixed(2)}×${ide.height.toFixed(2)} m, H=${h.toFixed(2)} m`;
      }
      if (area > 0) {
        concrete = area * h;
        formwork = perim * h;
      }
    } else if (ide.type === "beam") {
      const len = ide.points.length >= 2 ? polylineLength(ide.points) : 0;
      const w = ide.width ?? 0;
      const bh = ide.height ?? 0;
      if (len > 0 && w > 0 && bh > 0) {
        concrete = w * bh * len;
        formwork = (w + 2 * bh) * len + 2 * w * bh;
        dim = `${w.toFixed(2)}×${bh.toFixed(2)} m, L=${len.toFixed(2)} m`;
      }
    } else if (ide.type === "wall") {
      if (ide.footprint && ide.footprint.length >= 3) {
        const area = polygonArea(ide.footprint);
        const perim = polygonPerimeter(ide.footprint);
        concrete = area * h;
        formwork = perim * h;
        dim = `t=${(ide.thickness ?? ide.width ?? 0).toFixed(2)} m, H=${h.toFixed(2)} m`;
      } else if (ide.points.length >= 2 && (ide.thickness ?? ide.width)) {
        const len = polylineLength(ide.points);
        const t = ide.thickness ?? ide.width ?? 0;
        concrete = len * t * h;
        formwork = 2 * (len + t) * h;
        dim = `t=${t.toFixed(2)} m, L=${len.toFixed(2)} m, H=${h.toFixed(2)} m`;
      }
    } else if (ide.type === "slab") {
      const poly = ide.footprint && ide.footprint.length >= 3 ? ide.footprint : ide.points;
      if (poly.length >= 3 && ide.thickness !== undefined) {
        let area = polygonArea(poly);
        let perim = polygonPerimeter(poly);
        if (ide.holes?.length) {
          for (const hole of ide.holes) {
            if (hole.length >= 3) {
              area = Math.max(0, area - polygonArea(hole));
              perim += polygonPerimeter(hole);
            }
          }
        }
        concrete = area * ide.thickness;
        formwork = area + perim * ide.thickness;
        dim = `h=${ide.thickness.toFixed(2)} m, A=${area.toFixed(2)} m²`;
      }
    }

    const typeLabel = ide.foundation ? "Radye Döşeme" : (TYPE_LABELS[ide.type] ?? ide.type);
    const tEntry = byTypeMap.get(typeLabel) ?? { typeLabel, count: 0, grossM3: 0, formworkM2: 0 };
    tEntry.count += 1;
    tEntry.grossM3 += concrete ?? 0;
    tEntry.formworkM2 += formwork ?? 0;
    byTypeMap.set(typeLabel, tEntry);

    const fEntry = byFloorMap.get(el.floorName) ?? { floorName: el.floorName, grossM3: 0, formworkM2: 0 };
    fEntry.grossM3 += concrete ?? 0;
    fEntry.formworkM2 += formwork ?? 0;
    byFloorMap.set(el.floorName, fEntry);

    totalGrossM3 += concrete ?? 0;
    totalFormworkM2 += formwork ?? 0;

    rows.push({
      id: el.id,
      name: el.name,
      type: typeLabel,
      floorName: el.floorName,
      dimensionText: dim || "-",
      concreteM3: concrete,
      formworkM2: formwork,
      rebarKg: null,
    });
  }

  return {
    sourceLabel: "Kaynak IDE geometrisinden brüt ön metraj hesabı (ideCAD 11.28 Deneme doğrudan metraj PDF exportu: blocked; gerçek donatı kesim listesi: unknown).",
    byType: Array.from(byTypeMap.values()).map(r => ({ ...r, netM3: null })),
    byFloor: Array.from(byFloorMap.values()).map(f => ({ ...f, netM3: null, rebarKg: null })),
    elements: rows,
    totalGrossM3,
    totalNetM3: null,
    totalFormworkM2,
    totalRebarKg: null,
    knownRebarSubtotalKg: 0,
    missingRebarCount: rows.length,
    warnings: [
      "Brüt geometrik hacim ve kalıp hesabıdır; birleşim kesişim düşümleri uygulanmadı.",
      "Kaynak IDE dosyasında donatı kesim listesi çözümlenmedi; tahmini donatı tonajı üretilmedi.",
    ],
  };
}

function computeCadModelMetraj(
  cadModel: CadModel,
  scope: "all" | "active_floor" | "selected",
  activeFloorName?: string,
  selectedElementIds?: readonly string[]
): ComputedMetraj {
  let scopedElements = cadModel.elements;
  if (scope === "active_floor" && activeFloorName) {
    const matchedIds = new Set(
      cadModel.floors.filter(f => floorMatchesName(f.name, activeFloorName)).map(f => f.id)
    );
    scopedElements = scopedElements.filter(e => matchedIds.has(e.floorId));
  } else if (scope === "selected") {
    const selectedSet = new Set(selectedElementIds ?? []);
    scopedElements = scopedElements.filter(e => selectedSet.has(e.id));
  }

  const scopedModel: CadModel = {
    ...cadModel,
    elements: scopedElements,
  };
  const junctions = resolveJunctions(scopedModel);
  const quantities = calculateQuantities(scopedModel, junctions);
  const takeoff = calculateFullTakeoff(scopedModel, undefined, junctions);

  const floorIdsWithElements = new Set(scopedElements.filter(isSolidElement).map(e => e.floorId));
  const floorNamesWithElements = new Set(
    cadModel.floors.filter(f => floorIdsWithElements.has(f.id)).map(f => f.name)
  );
  const grossByFloor = new Map<string, number>();
  const floorMap = new Map(cadModel.floors.map(f => [f.id, f.name]));
  for (const el of scopedElements) {
    if (!isSolidElement(el)) continue;
    const fname = floorMap.get(el.floorId) ?? "Bilinmeyen kat";
    const q = calculateQuantities({ ...scopedModel, elements: [el] });
    grossByFloor.set(fname, (grossByFloor.get(fname) ?? 0) + q.grossVolume);
  }

  const byType = quantities.rows
    .filter(r => r.count > 0)
    .map(r => ({
      typeLabel: TYPE_LABELS[r.type] ?? r.type,
      count: r.count,
      grossM3: r.grossVolume,
      netM3: r.netVolume,
      formworkM2: r.formwork,
    }));

  const byFloor = Object.entries(takeoff.rebarTonnage.byFloor)
    .filter(([floorName]) => scope === "all" || floorNamesWithElements.has(floorName))
    .map(([floorName, summary]) => ({
      floorName,
      grossM3: grossByFloor.get(floorName) ?? 0,
      netM3: summary.concreteM3,
      formworkM2: summary.formworkM2 ?? 0,
      rebarKg: summary.rebarKg,
    }));

  const cadElementMap = new Map(scopedElements.map(e => [e.id, e]));
  const elements: SourceTakeoffRow[] = takeoff.elementBreakdown.map(item => {
    const cad = cadElementMap.get(item.id);
    let dim = "";
    if (cad?.type === "column") dim = `${cad.width.toFixed(2)}×${cad.depth.toFixed(2)} m, H=${cad.height.toFixed(2)} m`;
    else if (cad?.type === "beam") dim = `${cad.width.toFixed(2)}×${cad.height.toFixed(2)} m, L=${Math.hypot(cad.end.x - cad.start.x, cad.end.y - cad.start.y).toFixed(2)} m`;
    else if (cad?.type === "wall") dim = `t=${cad.thickness.toFixed(2)} m, L=${Math.hypot(cad.end.x - cad.start.x, cad.end.y - cad.start.y).toFixed(2)} m, H=${cad.height.toFixed(2)} m`;
    else if (cad?.type === "slab") dim = `h=${cad.thickness.toFixed(2)} m, A=${polygonArea(cad.points).toFixed(2)} m²`;
    return {
      id: item.id,
      name: item.name,
      type: TYPE_LABELS[item.type] ?? item.type,
      floorName: item.floorName,
      dimensionText: dim || "-",
      concreteM3: item.concreteM3,
      formworkM2: item.formworkM2,
      rebarKg: item.rebarKg,
    };
  });

  const rebarTonnage = takeoff.rebarTonnage as typeof takeoff.rebarTonnage & {
    knownSubtotalKg?: number;
    missingElementIds?: readonly string[];
  };

  return {
    sourceLabel: "Hsyncad CAD model geometrik/net metraj hesabı (calculateQuantities & calculateFullTakeoff; ideCAD 11.28 Deneme doğrudan metraj PDF exportu: blocked).",
    byType,
    byFloor,
    elements,
    totalGrossM3: quantities.grossVolume,
    totalNetM3: takeoff.concreteVolumeM3.total,
    totalFormworkM2: quantities.formwork,
    totalRebarKg: rebarTonnage.totalKg,
    knownRebarSubtotalKg: rebarTonnage.knownSubtotalKg ?? 0,
    missingRebarCount: rebarTonnage.missingElementIds?.length ?? 0,
    warnings: takeoff.warnings,
  };
}

/** Generate a combined selective static + quantity takeoff PDF from verified IDE source and/or CAD model. */
export function createIdeSourcePdf(
  source: IdeProject | null,
  sha256: string,
  revision: string,
  options: IdeSourcePdfOptions = {}
): Uint8Array {
  const cadModel = options.cadModel;
  if (!source && !cadModel) {
    throw new Error("Rapor üretmek için kaynak IDE projesi veya CAD modeli gerekli.");
  }

  const scope = options.scope ?? "all";
  const targetFloorName = options.activeFloorName?.trim();

  const baseSourceFloors: readonly (IdeFloor | Floor)[] = source?.floors ?? cadModel?.floors ?? [];
  let scopedSourceFloors = source?.floors ?? [];
  let scopedModelFloors = cadModel?.floors ?? [];

  if (scope === "active_floor") {
    if (!targetFloorName) {
      throw new Error("Aktif kat kapsamı için hedef kat adı gerekli.");
    }
    if (source) {
      const matched = source.floors.filter(f => floorMatchesName(f.name, targetFloorName));
      if (!matched.length) {
        throw new Error(`Seçilen aktif kat kaynak modelde bulunamadı: ${targetFloorName}`);
      }
      scopedSourceFloors = matched;
    }
    if (cadModel) {
      const matchedModel = cadModel.floors.filter(f => floorMatchesName(f.name, targetFloorName));
      if (!source && !matchedModel.length) {
        throw new Error(`Seçilen aktif kat modelde bulunamadı: ${targetFloorName}`);
      }
      scopedModelFloors = matchedModel;
    }
  }

  const activeFloorsForDisplay: readonly (IdeFloor | Floor)[] = source ? scopedSourceFloors : scopedModelFloors;
  const scopedFloorIds = new Set(activeFloorsForDisplay.map(f => f.id));
  const floorMap = new Map(baseSourceFloors.map(f => [f.id, f.name]));

  const hasExplicitRptFlags = Array.isArray(options.rptFlags) && options.rptFlags.length === RPT_PAYLOAD_LEN;
  const effectiveSections = options.sections ?? (hasExplicitRptFlags ? deriveSectionsFromRptFlags(options.rptFlags!) : undefined);
  const sectionSet = effectiveSections ? new Set(effectiveSections) : null;

  const isLeafEnabled = (treeIdx: number | null): boolean => {
    if (!hasExplicitRptFlags || treeIdx === null) return true;
    return Boolean(options.rptFlags![treeIdx]);
  };

  const presence = getIdeReportGroupPresence(
    source,
    cadModel,
    scope,
    targetFloorName,
    options.selectedElementIds
  );

  const unifiedScoped = collectUnifiedElements(
    source,
    cadModel,
    scope,
    targetFloorName,
    options.selectedElementIds
  );

  const metrajCfg = options.metraj;
  const metrajKalip = metrajCfg?.kalip ?? true;
  const metrajBeton = metrajCfg?.beton ?? true;
  const metrajDonati = metrajCfg?.donati ?? true;
  const metrajDetay = metrajCfg?.detay ?? true;
  const includeMetraj =
    metrajCfg?.enabled !== false && (metrajKalip || metrajBeton || metrajDonati || metrajDetay);

  const hasAciklama = !sectionSet || sectionSet.has("aciklama");
  const effectiveIdeKapak = hasAciklama && options.ideKapak !== false && isLeafEnabled(1);
  const includeRaporIndeksi = hasAciklama && isLeafEnabled(3);

  const includeKatYuk =
    options.project !== false && (!sectionSet || sectionSet.has("kat_yuk") || sectionSet.has("aciklama"));
  const includeSlabLoads =
    options.slabLoads !== false && (!sectionSet || sectionSet.has("kat_yuk") || sectionSet.has("doseme"));
  const includeDinamik = Boolean(sectionSet?.has("dinamik"));
  const includeDuzensizlik = Boolean(sectionSet?.has("duzensizlik"));

  // Determine which element groups will actually be printed (selected AND present count > 0)
  const elementGroupIdsToPrint = IDE_REPORT_TREE_GROUPS.filter(g => {
    if (GENERAL_GROUP_IDS.has(g.id)) return false;
    const selected = sectionSet ? sectionSet.has(g.id) : options.elements !== false;
    const gp = presence[g.id];
    return selected && gp.applicable && gp.present && gp.count > 0;
  }).map(g => g.id);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pdf.addFileToVFS("IBM-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFileToVFS("IBM-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBM-Regular.ttf", "IBM", "normal");
  pdf.addFont("IBM-Bold.ttf", "IBM", "bold");
  pdf.setFont("IBM", "normal");
  pdf.setFontSize(9.5);

  let y = 18;
  const number = (value: number, maxDigits = 4) =>
    value.toLocaleString("tr-TR", { maximumFractionDigits: maxDigits });

  function ensureSpace(mm: number) {
    if (y + mm > 280) {
      pdf.addPage();
      y = 18;
    }
  }

  function line(text: string, bold = false, fontSize = 9.5) {
    pdf.setFont("IBM", bold ? "bold" : "normal");
    pdf.setFontSize(fontSize);
    const rows = pdf.splitTextToSize(text, 180) as string[];
    for (const row of rows) {
      ensureSpace(5);
      pdf.text(row, 15, y);
      y += 4.8;
    }
  }

  function heading(text: string) {
    y += 2;
    ensureSpace(10);
    pdf.setFont("IBM", "bold");
    pdf.setFontSize(11);
    pdf.text(text, 15, y);
    y += 2;
    pdf.setDrawColor(180);
    pdf.line(15, y, 195, y);
    y += 4.5;
    pdf.setFont("IBM", "normal");
    pdf.setFontSize(9.5);
  }

  // Optional company logo at top-right
  const logoUrl = options.metadata?.logoDataUrl?.trim();
  if (logoUrl && logoUrl.startsWith("data:image/")) {
    try {
      const upper = logoUrl.slice(0, 32).toUpperCase();
      const format = upper.includes("JPEG") || upper.includes("JPG") ? "JPEG" : upper.includes("WEBP") ? "WEBP" : "PNG";
      pdf.addImage(logoUrl, format, 160, 12, 34, 17);
    } catch {
      // Ignore unsupported or malformed logo image bytes
    }
  }

  // Cover & Metadata Block
  const meta = options.metadata;
  const projectDisplayName = source?.name || source?.filename || cadModel?.name || "Hsyncad Yapı Projesi";
  const scopeText =
    scope === "active_floor"
      ? `Aktif kat (${targetFloorName})`
      : scope === "selected"
        ? `Seçili elemanlar (${options.selectedElementIds?.length ?? 0} adet)`
        : "Tüm proje";

  line("Hsyncad — Statik ve Metraj Birleşik Rapor (IDE Kaynak Veri)", true, 12);
  y += 1;

  if (effectiveIdeKapak || !sectionSet) {
    if (meta?.title?.trim()) line(`Proje başlığı: ${meta.title.trim()}`, true);
    else line(`Proje: ${projectDisplayName}`, true);
    if (meta?.designer?.trim()) line(`Dizayn eden: ${meta.designer.trim()}`);
    if (meta?.revisionNote?.trim()) line(`Revizyon: ${meta.revisionNote.trim()}`);
    if (meta?.dateNote?.trim()) line(`Tarih: ${meta.dateNote.trim()}`);
    if (meta?.writeProjectFilename !== false && source) {
      line(`Kaynak dosya: ${source.filename} (${source.format})`);
    } else if (meta?.writeProjectFilename !== false && cadModel) {
      line(`Model adı: ${cadModel.name}`);
    }
    if (meta?.city?.trim() || meta?.district?.trim()) {
      line(`İl / İlçe: ${meta?.city?.trim() || "-"} / ${meta?.district?.trim() || "-"}`);
    }
    if (meta?.usagePurpose?.trim()) line(`Kullanım amacı: ${meta.usagePurpose.trim()}`);
    if (meta?.pafta?.trim() || meta?.ada?.trim() || meta?.parsel?.trim()) {
      line(`Pafta / Ada / Parsel: ${meta?.pafta?.trim() || "-"} / ${meta?.ada?.trim() || "-"} / ${meta?.parsel?.trim() || "-"}`);
    }
  }

  line(`Kaynak SHA-256: ${sha256}`);
  line(`Model revizyonu: ${revision}`);
  if (options.profileSha256) line(`Rapor profili SHA-256: ${options.profileSha256}`);
  if (options.optionsSha256) line(`Seçenek özeti SHA-256: ${options.optionsSha256}`);
  line(`Rapor kapsamı: ${scopeText}`);

  if (effectiveSections?.length) {
    const labelMap = new Map(IDE_REPORT_TREE_GROUPS.map(g => [g.id, g.label]));
    const selectedLabels = effectiveSections.map(id => labelMap.get(id) ?? id).join(", ");
    line(`Seçili ideCAD rapor grupları (${effectiveSections.length}): ${selectedLabels}`);
    const kapakText = !hasAciklama
      ? "Kapalı (Açıklama Bilgileri seçili değil)"
      : effectiveIdeKapak
        ? "Açık"
        : "Kapalı";
    line(`İde Kapak (offset 48): ${kapakText}`);
  }

  line("Bu belge yalnız doğrulanmış kaynak/CAD model alanlarını, geometrik metrajı ve iş makbuzu durumunu içerir.");
  line("ideRAPOR doğrudan PDF kaydı: blocked (ideCAD Statik 11.28 Deneme sürümü kısıtı).");
  line("ideCAD iç analiz sonuçları ve gerçek donatı kesim listesi: unknown (bu belgede uydurma analiz sonucu veya sahte donatı tonajı üretilmez).");
  y += 2;

  // Rapor İndeksi (only sections actually printed in this PDF)
  const indexLabels: string[] = [];
  if (includeKatYuk) indexLabels.push("Yapı Kat ve Yük Bilgileri");
  if (includeDinamik) indexLabels.push("Dinamik Analiz");
  if (includeDuzensizlik) indexLabels.push("Yapı Düzensizlikleri");
  const groupLabelMap = new Map(IDE_REPORT_TREE_GROUPS.map(g => [g.id, g.label]));
  for (const gid of elementGroupIdsToPrint) {
    indexLabels.push(`${groupLabelMap.get(gid) ?? gid} (${presence[gid].count} adet)`);
  }
  if (includeMetraj) indexLabels.push("Metraj Raporu (Kalıp · Beton · Donatı / Özet)");

  if (includeRaporIndeksi) {
    heading("Rapor İndeksi (Aktif ve Projede Mevcut Bölümler)");
    if (indexLabels.length) {
      indexLabels.forEach((lbl, idx) => line(`${idx + 1}. ${lbl}`));
    } else {
      line("Seçili ve projede mevcut rapor bölümü bulunamadı.");
    }
    line("Not: Seçili olduğu halde projede/kapsamda 0 adet bulunan eleman grupları rapora dahil edilmemiştir.");
  }

  // Yapı Kat ve Yük Bilgileri
  if (includeKatYuk) {
    heading("Yapı Kat ve Yük Bilgileri");
    for (const floor of activeFloorsForDisplay) {
      line(`${floor.name} | Kot: ${number(floor.elevation)} m | Kat yüksekliği: ${number(floor.height)} m`);
    }
  }

  // Normal döşeme yükleri (only if normal slabs exist in scope and slabLoads + doseme/kat_yuk enabled)
  if (includeSlabLoads && source && presence.doseme.present) {
    heading("Normal Döşeme Yükleri (Q ve G)");
    line("Kaynak IDE modeli; Q ve G birimi: tf/m². Radye ve diğer eleman yükleri bu kapsamda değildir.");
    const selectedSet = scope === "selected" ? new Set(options.selectedElementIds ?? []) : null;
    const slabs = source.elements.filter(
      e =>
        e.type === "slab" &&
        !e.foundation &&
        e.planAnnotation?.loads &&
        scopedFloorIds.has(e.floorId) &&
        (!selectedSet || selectedSet.has(e.id))
    );
    if (!slabs.length) line("Doğrulanmış yük kaydı bulunamadı.");
    for (const e of slabs) {
      const load = e.planAnnotation!.loads!;
      line(`${floorMap.get(e.floorId) ?? "Bilinmeyen kat"} | ${e.name} | Q: ${number(load.live)} | G: ${number(load.dead)}`);
    }
  }

  // Dinamik Analiz
  if (includeDinamik) {
    heading("Dinamik Analiz");
    const st = (cadModel as CadModelWithOptionalStructural | null | undefined)?.structural?.settings;
    if (st) {
      line(`SDS: ${st.sds?.value ?? "unknown"} | SD1: ${st.sd1?.value ?? "unknown"} | R: ${st.r?.value ?? "unknown"} | I: ${st.importance?.value ?? "unknown"}`);
    }
    line("Modal analiz ve kütle katılım sonuçları: unknown (yerel ideCAD 11.28 Deneme önizlemesinde incelenir).");
  }

  // Yapı Düzensizlikleri
  if (includeDuzensizlik) {
    heading("Yapı Düzensizlikleri");
    const totalHeight = activeFloorsForDisplay.reduce((sum, f) => sum + f.height, 0);
    line(`Kapsamdaki kat sayısı: ${activeFloorsForDisplay.length} | Toplam yükseklik: ${number(totalHeight)} m`);
    line("A1/B1/B2/B3 düzensizlik ve devrilme tahkikleri: unknown (yerel ideCAD 11.28 Deneme önizlemesinde incelenir).");
  }

  // Element Groups — STRICTLY skip any group with count === 0!
  if (elementGroupIdsToPrint.length > 0 && options.elements !== false) {
    heading("Doğrulanmış Eleman ve Kesit Envanteri");
    const summaryParts = elementGroupIdsToPrint.map(gid => `${groupLabelMap.get(gid) ?? gid}: ${presence[gid].count}`);
    line(summaryParts.join(" · "), true);

    for (const gid of elementGroupIdsToPrint) {
      const groupTitle = `${groupLabelMap.get(gid) ?? gid} (${presence[gid].count} adet)`;
      y += 1.5;
      line(groupTitle, true, 10);

      if (gid === "birlesim") {
        line("Kolon ve kiriş bulunan katlarda birleşim bölgesi adedi hesaplanmıştır; kesme tahkiki ideCAD analiz önizlemesindedir (unknown).");
        continue;
      }

      const matchedElements = unifiedScoped.filter(el => {
        const cat = classifyUnifiedElementCategory(el);
        if (gid === "perde_grubu") return cat === "perde" && Boolean(el.group?.trim());
        return cat === gid;
      });

      for (const el of matchedElements) {
        if (el.ide) {
          let row = `${el.floorName} | ${formatIdeElementSummary(el.ide, number)}`;
          if (gid === "doseme" && el.ide.planAnnotation?.loads) {
            const ld = el.ide.planAnnotation.loads;
            row += ` | Q: ${number(ld.live)} | G: ${number(ld.dead)} tf/m²`;
          }
          line(row);
        } else if (el.cad) {
          line(`${el.floorName} | ${formatCadElementSummary(el.cad, number)}`);
        }
      }
    }
  }

  // Unified Metraj Report Section
  if (includeMetraj) {
    heading("METRAJ RAPORU (KALIP · BETON · DONATI / ÖZET)");
    const metraj = cadModel
      ? computeCadModelMetraj(cadModel, scope, targetFloorName, options.selectedElementIds)
      : computeSourceOnlyMetraj(unifiedScoped, activeFloorsForDisplay);

    line(metraj.sourceLabel);

    if (metrajKalip) {
      y += 1;
      line("1. Kalıp Metrajı (m²)", true, 10);
      if (metraj.byType.length) {
        for (const row of metraj.byType) {
          line(`• ${row.typeLabel} (${row.count} adet): ${number(row.formworkM2, 3)} m²`);
        }
        line(`Toplam Brüt Kalıp Alanı: ${number(metraj.totalFormworkM2, 3)} m²`, true);
        if (metraj.byFloor.length) {
          line("Katlara göre kalıp dağılımı:", true);
          for (const fl of metraj.byFloor) {
            line(`  - ${fl.floorName}: ${number(fl.formworkM2, 3)} m²`);
          }
        }
      } else {
        line("Seçili kapsamda kalıp metrajı hesaplanacak katı eleman bulunamadı.");
      }
    }

    if (metrajBeton) {
      y += 1;
      line("2. Beton Metrajı (m³)", true, 10);
      if (metraj.byType.length) {
        for (const row of metraj.byType) {
          const netPart = row.netM3 !== null ? ` | Net: ${number(row.netM3, 3)} m³` : "";
          line(`• ${row.typeLabel} (${row.count} adet): Brüt ${number(row.grossM3, 3)} m³${netPart}`);
        }
        const totalNetText = metraj.totalNetM3 !== null ? ` | Toplam Net: ${number(metraj.totalNetM3, 3)} m³` : "";
        line(`Toplam Brüt Beton Hacmi: ${number(metraj.totalGrossM3, 3)} m³${totalNetText}`, true);
        if (metraj.byFloor.length) {
          line("Katlara göre beton dağılımı:", true);
          for (const fl of metraj.byFloor) {
            const netPart = fl.netM3 !== null ? ` | Net: ${number(fl.netM3, 3)} m³` : "";
            line(`  - ${fl.floorName}: Brüt ${number(fl.grossM3, 3)} m³${netPart}`);
          }
        }
      } else {
        line("Seçili kapsamda beton metrajı hesaplanacak katı eleman bulunamadı.");
      }
    }

    if (metrajDonati) {
      y += 1;
      line("3. Donatı / Özet Metraj", true, 10);
      if (metraj.totalRebarKg !== null) {
        line(`Beyan Edilen Toplam Donatı Kütlesi: ${number(metraj.totalRebarKg, 2)} kg (${number(metraj.totalRebarKg / 1000, 3)} t) — kesim listesi doğrulanmadı.`);
      } else {
        line("Donatı Metrajı: VERİ EKSİK / unknown — gerçek donatı kesim listesi doğrulanmadı; tahmini donatı tonajı üretilmez.");
        if (metraj.knownRebarSubtotalKg > 0) {
          line(`Kısmi beyan edilen donatı alt toplamı: ${number(metraj.knownRebarSubtotalKg, 2)} kg (${metraj.missingRebarCount} elemanda eksik).`);
        }
      }
      const ratioBasis = metraj.totalNetM3 && metraj.totalNetM3 > 0 ? metraj.totalNetM3 : metraj.totalGrossM3;
      const ratio = ratioBasis > 0 ? metraj.totalFormworkM2 / ratioBasis : null;
      line(
        `Genel Özet: ${metraj.elements.length} eleman | Brüt Beton: ${number(metraj.totalGrossM3, 3)} m³ | Brüt Kalıp: ${number(metraj.totalFormworkM2, 3)} m²` +
          (ratio !== null ? ` | Kalıp/Beton Oranı: ${number(ratio, 3)} m²/m³` : "")
      );
      for (const w of metraj.warnings) {
        line(`• ${w}`);
      }
    }

    if (metrajDetay) {
      y += 1;
      line("4. Kata ve Elemana Göre Detaylı Metraj", true, 10);
      if (metraj.elements.length) {
        for (const item of metraj.elements) {
          const cText = item.concreteM3 !== null ? `${number(item.concreteM3, 4)} m³` : "VERİ EKSİK";
          const fText = item.formworkM2 !== null ? `${number(item.formworkM2, 3)} m²` : "VERİ EKSİK";
          const rText = item.rebarKg !== null ? `${number(item.rebarKg, 2)} kg` : "unknown";
          line(`${item.floorName} | ${item.type} ${item.name} | ${item.dimensionText} | Beton: ${cText} | Kalıp: ${fText} | Donatı: ${rText}`);
        }
      } else {
        line("Detaylı metraj listelenecek eleman bulunamadı.");
      }
    }
  }

  // Analysis status and source warnings
  if (options.receiptWarnings !== undefined || options.warningsStatus || (source?.warnings.length ?? 0) > 0) {
    heading("ideCAD Analiz Durumu ve Kaynak Uyarıları");
    const statusText = options.warningsStatus ?? "unknown";
    line(`Analiz uyarı durumu: ${statusText}`);
    if (options.receiptWarnings?.length) {
      for (const w of options.receiptWarnings) line(`• ${w}`);
    } else if (statusText === "unknown" || options.receiptWarnings == null) {
      line("• Analiz uyarı durumu: unknown (bu işte F9 çalıştırılmadı / kayıtlı sonuç kullanıldı; proje uyarıları ideCAD önizlemesindedir).");
    } else {
      line("• F9 analiz günlüğünde ek uyarı/tavsiye satırı raporlanmadı.");
    }
    if (source) {
      if (scope === "active_floor") {
        line(`Proje geneli çözümlenen kayıt: ${source.coverage.decodedRecords} (${source.coverage.unsupportedRecords} desteklenmeyen) | Seçili aktif kattaki eleman sayısı: ${unifiedScoped.length}.`);
      } else {
        line(`Kaynak okuma kapsamı: ${source.coverage.decodedRecords} çözümlenen, ${source.coverage.unsupportedRecords} desteklenmeyen kayıt.`);
      }
      for (const w of source.warnings) line(`• ${w}`);
    }
  }

  return new Uint8Array(pdf.output("arraybuffer"));
}
