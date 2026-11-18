import type { IdeElement, IdeFloor, IdePoint, IdeProject } from "@/lib/hsyncad/ide-import";
import { isSolidElement, type CadElement, type CadModel, type Floor } from "@/lib/hsyncad/model";
import { resolveJunctions } from "@/lib/hsyncad/junctions";
import { calculateFullTakeoff, calculateQuantities } from "@/lib/hsyncad/quantities";
import { polygonArea, polygonPerimeter } from "@/lib/hsyncad/geometry";
import type { AnalysisResult, StructuralAnalysisResult } from "@/lib/hsyncad/analysis";
import type { ConcreteDesignResult } from "@/lib/hsyncad/design-engine";
import { executeStructuralBridge } from "@/lib/hsyncad/structural/cad-model-bridge";
import type { ReinforcementScheduleResult } from "@/lib/hsyncad/structural/reinforcement-schedule";
import { buildIdeReportDocument } from "@/lib/hsyncad/reporting/ide-report-builder";
import { renderReportDocumentToPdf } from "@/lib/hsyncad/reporting/pdf-renderer";

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
  licenseTitle?: string;
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
  concreteGrade?: string;
  rebarGrade?: string;
  regulation?: string;
  soilClass?: string;
  dts?: string | number;
  bys?: string | number;
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
  analysis?: StructuralAnalysisResult | AnalysisResult | null;
  design?: ConcreteDesignResult | null;
  rebarSchedule?: ReinforcementScheduleResult | null;
  deductFormworkOverlaps?: boolean;
  planDiagrams?: Array<{
    title?: string;
    dataUrl: string;
    widthMm: number;
    heightMm: number;
    caption?: string;
  }>;
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
  formworkBasis: "gross_geometry" | "net_deducted";
  cutListVerified: boolean;
  byType: { typeLabel: string; count: number; grossM3: number; netM3: number | null; grossFormworkM2?: number; formworkM2: number }[];
  byFloor: {
    floorName: string;
    grossM3: number;
    netM3: number | null;
    formworkM2: number;
    rebarKg: number | null;
    thinKg?: number | null;
    thickKg?: number | null;
    byDiameter?: Record<number, number>;
  }[];
  elements: SourceTakeoffRow[];
  totalGrossM3: number;
  totalNetM3: number | null;
  totalGrossFormworkM2: number;
  totalFormworkM2: number;
  totalRebarKg: number | null;
  thinRebarKg: number | null;
  thickRebarKg: number | null;
  byDiameter: Record<number, number>;
  knownRebarSubtotalKg: number;
  missingRebarCount: number;
  warnings: string[];
};

function computeSingleIdeElementMetraj(
  ide: IdeElement,
  floorHeight: number
): { typeLabel: string; concrete: number | null; formwork: number | null; dimensionText: string } {
  const h =
    ide.top !== undefined && ide.bottom !== undefined && ide.top > ide.bottom
      ? ide.top - ide.bottom
      : (ide.height ?? floorHeight);
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
      formwork = (ide.foundation ? 0 : area) + perim * ide.thickness;
      dim = `h=${ide.thickness.toFixed(2)} m, A=${area.toFixed(2)} m²`;
    }
  }

  return {
    typeLabel: ide.foundation ? "Radye Döşeme" : (TYPE_LABELS[ide.type] ?? ide.type),
    concrete,
    formwork,
    dimensionText: dim || "-",
  };
}

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
    const { typeLabel, concrete, formwork, dimensionText } = computeSingleIdeElementMetraj(ide, fh);
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
      dimensionText,
      concreteM3: concrete,
      formworkM2: formwork,
      rebarKg: null,
    });
  }

  return {
    sourceLabel: "Kaynak IDE geometrisinden brüt ön metraj hesabı (ideCAD 11.28 Deneme doğrudan metraj PDF exportu: blocked; gerçek donatı kesim listesi: unknown).",
    formworkBasis: "gross_geometry",
    cutListVerified: false,
    byType: Array.from(byTypeMap.values()).map(r => ({ ...r, netM3: null, grossFormworkM2: r.formworkM2 })),
    byFloor: Array.from(byFloorMap.values()).map(f => ({ ...f, netM3: null, rebarKg: null })),
    elements: rows,
    totalGrossM3,
    totalNetM3: null,
    totalGrossFormworkM2: totalFormworkM2,
    totalFormworkM2,
    totalRebarKg: null,
    thinRebarKg: null,
    thickRebarKg: null,
    byDiameter: {},
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
  selectedElementIds?: readonly string[],
  options?: {
    deductFormworkOverlaps?: boolean;
    rebarSchedule?: ReinforcementScheduleResult | null;
    unmappedIdeElements?: readonly UnifiedElement[];
  }
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
  const deductFw = options?.deductFormworkOverlaps ?? true;
  const junctions = resolveJunctions(scopedModel);
  const grossQuantities = calculateQuantities(scopedModel, junctions, { deductFormworkOverlaps: false });
  const netQuantities = deductFw ? calculateQuantities(scopedModel, junctions, { deductFormworkOverlaps: true }) : grossQuantities;
  const takeoff = calculateFullTakeoff(scopedModel, undefined, junctions, {
    deductFormworkOverlaps: deductFw,
    rebarSchedule: options?.rebarSchedule ?? null,
  });

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

  const grossFwByType = new Map(grossQuantities.rows.map(r => [r.type, r.formwork]));
  const byType = netQuantities.rows
    .filter(r => r.count > 0)
    .map(r => ({
      typeLabel: TYPE_LABELS[r.type] ?? r.type,
      count: r.count,
      grossM3: r.grossVolume,
      netM3: r.netVolume,
      grossFormworkM2: grossFwByType.get(r.type) ?? r.formwork,
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
      thinKg: summary.thinKg,
      thickKg: summary.thickKg,
      byDiameter: summary.byDiameter,
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

  const rebarTonnage = takeoff.rebarTonnage;
  let totalGrossM3 = netQuantities.grossVolume;
  let totalNetM3 = takeoff.concreteVolumeM3.total;
  let totalGrossFormworkM2 = grossQuantities.formwork;
  let totalFormworkM2 = netQuantities.formwork;

  const floorHeightMap = new Map(cadModel.floors.map(f => [f.id, f.height]));
  for (const el of options?.unmappedIdeElements ?? []) {
    const ide = el.ide;
    if (!ide || cadElementMap.has(el.id)) continue;
    const cat = classifyUnifiedElementCategory(el);
    if (!cat || !["doseme", "radye", "kiris", "kolon", "perde"].includes(cat)) continue;

    const fh = floorHeightMap.get(ide.floorId) ?? 3;
    const { typeLabel, concrete, formwork, dimensionText } = computeSingleIdeElementMetraj(ide, fh);
    const cVal = concrete ?? 0;
    const fVal = formwork ?? 0;

    totalGrossM3 += cVal;
    if (totalNetM3 !== null) totalNetM3 += cVal;
    totalGrossFormworkM2 += fVal;
    totalFormworkM2 += fVal;

    const existingType = byType.find(t => t.typeLabel === typeLabel);
    if (existingType) {
      existingType.count += 1;
      existingType.grossM3 += cVal;
      existingType.netM3 = (existingType.netM3 ?? 0) + cVal;
      existingType.grossFormworkM2 += fVal;
      existingType.formworkM2 += fVal;
    } else {
      byType.push({
        typeLabel,
        count: 1,
        grossM3: cVal,
        netM3: cVal,
        grossFormworkM2: fVal,
        formworkM2: fVal,
      });
    }

    const existingFloor = byFloor.find(f => f.floorName === el.floorName);
    if (existingFloor) {
      existingFloor.grossM3 += cVal;
      existingFloor.netM3 = (existingFloor.netM3 ?? 0) + cVal;
      existingFloor.formworkM2 += fVal;
    } else {
      byFloor.push({
        floorName: el.floorName,
        grossM3: cVal,
        netM3: cVal,
        formworkM2: fVal,
        rebarKg: null,
        thinKg: null,
        thickKg: null,
        byDiameter: {},
      });
    }

    elements.push({
      id: el.id,
      name: el.name,
      type: typeLabel,
      floorName: el.floorName,
      dimensionText,
      concreteM3: concrete,
      formworkM2: formwork,
      rebarKg: null,
    });
  }

  return {
    sourceLabel: deductFw
      ? "Hsyncad net metraj hesabı (birleşim kesişim ve kalıp temas düşümleri uygulanmış; doğrulanmış kesim listesi ile)."
      : "Hsyncad CAD model geometrik/net metraj hesabı (calculateQuantities & calculateFullTakeoff).",
    formworkBasis: takeoff.formworkAreaM2.basis,
    cutListVerified: rebarTonnage.cutListVerified,
    byType,
    byFloor,
    elements,
    totalGrossM3,
    totalNetM3,
    totalGrossFormworkM2,
    totalFormworkM2,
    totalRebarKg: rebarTonnage.totalKg,
    thinRebarKg: rebarTonnage.thinKg,
    thickRebarKg: rebarTonnage.thickKg,
    byDiameter: rebarTonnage.byDiameter,
    knownRebarSubtotalKg: rebarTonnage.knownSubtotalKg,
    missingRebarCount: rebarTonnage.missingElementIds.length,
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
  const includeDinamik = !sectionSet || sectionSet.has("dinamik");
  const includeDuzensizlik = !sectionSet || sectionSet.has("duzensizlik");

  // Determine which element groups will actually be printed (selected AND present count > 0)
  const elementGroupIdsToPrint = IDE_REPORT_TREE_GROUPS.filter(g => {
    if (GENERAL_GROUP_IDS.has(g.id)) return false;
    const selected = sectionSet ? sectionSet.has(g.id) : options.elements !== false;
    const gp = presence[g.id];
    return selected && gp.applicable && gp.present && gp.count > 0;
  }).map(g => g.id);

  const number = (value: number, maxDigits = 4) =>
    value.toLocaleString("tr-TR", { maximumFractionDigits: maxDigits });

  const groupLabelMap = new Map(IDE_REPORT_TREE_GROUPS.map(g => [g.id, g.label]));
  const selectedGroupLabels = (effectiveSections ?? []).map(id => groupLabelMap.get(id) ?? id);
  const coverModeLabel = effectiveSections?.length
    ? !hasAciklama
      ? "Kapalı (Açıklama Bilgileri seçili değil)"
      : effectiveIdeKapak
        ? "Açık"
        : "Kapalı"
    : undefined;

  const projectDisplayName = source?.name || source?.filename || cadModel?.name || "Hsyncad Yapı Projesi";
  const scopeText =
    scope === "active_floor"
      ? `Aktif kat (${targetFloorName})`
      : scope === "selected"
        ? `Seçili elemanlar (${options.selectedElementIds?.length ?? 0} adet)`
        : "Tüm proje";

  const selectedSet = scope === "selected" ? new Set(options.selectedElementIds ?? []) : null;
  const slabLoads =
    includeSlabLoads && source && presence.doseme.present
      ? source.elements
          .filter(
            e =>
              e.type === "slab" &&
              !e.foundation &&
              (e.planAnnotation?.loads || e.slabLoads) &&
              scopedFloorIds.has(e.floorId) &&
              (!selectedSet || selectedSet.has(e.id))
          )
          .map(e => ({
            floorName: floorMap.get(e.floorId) ?? "Bilinmeyen kat",
            elementName: e.name,
            live: e.planAnnotation?.loads?.live ?? e.slabLoads?.liveTfM2 ?? 0,
            dead:
              e.planAnnotation?.loads?.dead ??
              ((e.slabLoads?.deadTfM2 ?? 0) + (e.slabLoads?.finishTfM2 ?? 0)),
          }))
      : [];

  const elementGroups =
    elementGroupIdsToPrint.length > 0 && options.elements !== false
      ? elementGroupIdsToPrint.map(gid => {
          const label = groupLabelMap.get(gid) ?? gid;
          if (gid === "birlesim") {
            return {
              id: gid,
              label,
              count: presence[gid].count,
              summaryNote:
                "Kolon ve kiriş bulunan katlarda birleşim bölgesi adedi hesaplanmıştır; kesme tahkiki analiz önizlemesindedir.",
              elements: [],
            };
          }
          const matchedElements = unifiedScoped.filter(el => {
            const cat = classifyUnifiedElementCategory(el);
            if (gid === "perde_grubu") return cat === "perde" && Boolean(el.group?.trim());
            return cat === gid;
          });
          return {
            id: gid,
            label,
            count: presence[gid].count,
            elements: matchedElements.map(el => {
              if (el.ide) {
                const sec = el.ide.sectionLabel ?? el.ide.planAnnotation?.section ?? formatIdeElementSummary(el.ide, number);
                const dosemeLoads =
                  el.ide.planAnnotation?.loads ??
                  (el.ide.slabLoads
                    ? {
                        live: el.ide.slabLoads.liveTfM2,
                        dead: el.ide.slabLoads.deadTfM2 + el.ide.slabLoads.finishTfM2,
                      }
                    : null);
                const detail =
                  gid === "doseme" && dosemeLoads
                    ? `Q: ${number(dosemeLoads.live)} | G: ${number(dosemeLoads.dead)} tf/m²`
                    : el.ide.planOnly
                      ? "Yalnız plan"
                      : "";
                return {
                  id: el.id,
                  name: el.name,
                  floorName: el.floorName,
                  groupLabel: label,
                  sectionSummary: sec,
                  detailNote: detail,
                };
              }
              return {
                id: el.id,
                name: el.name,
                floorName: el.floorName,
                groupLabel: label,
                sectionSummary: el.cad ? formatCadElementSummary(el.cad, number) : "-",
                detailNote: "",
              };
            }),
          };
        })
      : [];

  let analyticalBridge = options.analysis?.analyticalBridge ?? null;
  if (!analyticalBridge && cadModel && cadModel.elements.length > 0 && cadModel.floors.length > 0) {
    try {
      analyticalBridge = executeStructuralBridge(cadModel, { revisionId: revision });
    } catch {
      analyticalBridge = null;
    }
  }

  const effectiveRebarSchedule =
    options.rebarSchedule ??
    (analyticalBridge?.reinforcementSchedule?.isComplete ? analyticalBridge.reinforcementSchedule : null);

  const metraj = cadModel
    ? computeCadModelMetraj(cadModel, scope, targetFloorName, options.selectedElementIds, {
        deductFormworkOverlaps: options.deductFormworkOverlaps ?? true,
        rebarSchedule: effectiveRebarSchedule,
        unmappedIdeElements: unifiedScoped,
      })
    : computeSourceOnlyMetraj(unifiedScoped, activeFloorsForDisplay);

  const st = (cadModel as CadModelWithOptionalStructural | null | undefined)?.structural?.settings;
  const firstConcrete = source?.materials?.find(m => m.kind === "concrete");
  const firstSteel = source?.materials?.find(m => m.kind === "steel");
  const hydratedMetadata = {
    ...options.metadata,
    concreteGrade: options.metadata?.concreteGrade ?? firstConcrete?.name ?? analyticalBridge?.material.concreteGrade,
    rebarGrade: options.metadata?.rebarGrade ?? firstSteel?.name ?? analyticalBridge?.material.rebarGrade,
    soilClass: options.metadata?.soilClass ?? source?.seismicSoil?.exposureClass,
  };
  const hydratedSettings =
    st || source?.seismicSoil || analyticalBridge
      ? {
          ss: source?.seismicSoil?.ss ?? null,
          s1: source?.seismicSoil?.s1 ?? null,
          sds: st?.sds?.value ?? source?.seismicSoil?.sds ?? analyticalBridge?.spectrum.sds ?? null,
          sd1: st?.sd1?.value ?? source?.seismicSoil?.sd1 ?? analyticalBridge?.spectrum.sd1 ?? null,
          r: st?.r?.value ?? source?.seismicSoil?.rEntered ?? null,
          importance: st?.importance?.value ?? source?.seismicSoil?.importanceI ?? null,
          exposureClass: source?.seismicSoil?.exposureClass ?? null,
          ko: source?.seismicSoil?.subgradeKoTfM3 ?? null,
          qt: source?.seismicSoil?.bearingCapacityQtTfM2 ?? null,
        }
      : undefined;

  const warningsSection =
    options.receiptWarnings !== undefined || options.warningsStatus || (source?.warnings.length ?? 0) > 0
      ? {
          statusText: options.warningsStatus ?? "unknown",
          receiptWarnings: options.receiptWarnings,
          sourceWarnings: source?.warnings ?? [],
          coverageNote: source
            ? scope === "active_floor"
              ? `Proje geneli çözümlenen kayıt: ${source.coverage.decodedRecords} (${source.coverage.unsupportedRecords} desteklenmeyen) | Seçili aktif kattaki eleman sayısı: ${unifiedScoped.length}.`
              : `Kaynak okuma kapsamı: ${source.coverage.decodedRecords} çözümlenen, ${source.coverage.unsupportedRecords} desteklenmeyen kayıt.`
            : undefined,
        }
      : undefined;

  const reportDoc = buildIdeReportDocument({
    projectName: projectDisplayName,
    sourceFilename: source?.filename,
    sourceFormat: source?.format,
    modelName: cadModel?.name,
    sha256,
    revisionId: revision,
    profileSha256: options.profileSha256,
    optionsSha256: options.optionsSha256,
    scopeText,
    includeCover: effectiveIdeKapak || !sectionSet,
    coverModeLabel,
    hasAciklama,
    includeRaporIndeksi,
    includeKatYuk,
    includeSlabLoads,
    includeDinamik,
    includeDuzensizlik,
    selectedGroupLabels,
    metadata: hydratedMetadata,
    floors: activeFloorsForDisplay.map(f => ({
      id: f.id,
      name: f.name,
      elevation: f.elevation,
      height: f.height,
    })),
    slabLoads,
    structuralSettings: hydratedSettings,
    seismicSoil: source?.seismicSoil ?? null,
    f9Results: source?.f9Results ?? null,
    analyticalBridge,
    analysis: options.analysis ?? null,
    design: options.design ?? null,
    elementGroups,
    metraj: {
      enabled: includeMetraj,
      kalip: metrajKalip,
      beton: metrajBeton,
      donati: metrajDonati,
      detay: metrajDetay,
      ...metraj,
    },
    planDiagrams: options.planDiagrams,
    warningsSection,
  });

  return renderReportDocumentToPdf(reportDoc, { layoutMode: "idecad_compact" }).pdfBytes;
}
