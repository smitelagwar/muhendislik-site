/**
 * Belge Stüdyosu — Akıllı Bölüm (Akordeon) Şeması ve Alan Haritası (ASAMA_05 & ASAMA_06)
 *
 * Kurallar:
 * 1. 5 belgenin 56 düzenlenebilir alanının her biri tam olarak TEK bir bölüme aittir.
 * 2. İstifa dilekçesindeki PDF-only sabit etiketler (`adres_etiket`, `tc_etiket`, `iletisim_etiket`)
 *    form alanı olmadığı için bölümlere dahil edilmez.
 * 3. Bölüm başlıkları mevcut JSX formundaki görünür isimlerle birebir aynıdır.
 */

import type { BelgeDocumentId } from "./belge-ux-config";

export interface BelgeStudioSectionDefinition {
  id: string;
  title: string;
  fields: readonly string[];
}

export const BELGE_STUDIO_SECTIONS: Record<
  BelgeDocumentId,
  readonly BelgeStudioSectionDefinition[]
> = {
  "beton-dokum-tutanagi": [
    {
      id: "belge-kayit",
      title: "1. Belge & Kayıt",
      fields: ["tutanak_alt_baslik", "tarih", "yibf"],
    },
    {
      id: "santiye-yeri",
      title: "2. Şantiye Yeri",
      fields: ["yer"],
    },
    {
      id: "olay-gozlem",
      title: "3. Olay Açıklaması & Gözlem",
      fields: ["olay_aciklamasi", "gozlem_notlar"],
    },
    {
      id: "imzaci-taraflar",
      title: "4. İmzacı Taraflar",
      fields: ["laboratuvar", "muteahhit", "santiye_sefi", "yapi_denetim"],
    },
  ],

  "insaat-ruhsati-dilekcesi": [
    {
      id: "idare-ve-tarih",
      title: "1. İdare ve Tarih Bilgisi",
      fields: ["tarih", "belediye_adi", "mudurluk_adi"],
    },
    {
      id: "talep-metni",
      title: "2. Talep ve Parsel Bilgileri Metni",
      fields: ["ana_metin"],
    },
    {
      id: "dilekce-sahibi",
      title: "2. Dilekçe Sahibi",
      fields: ["ad_soyad", "unvan"],
    },
    {
      id: "iletisim-adres",
      title: "3. İletişim ve Tebligat Adresi",
      fields: ["adres", "tel"],
    },
  ],

  "santiye-sefi-istifa-dilekcesi": [
    {
      id: "idare-hitap",
      title: "1. İdare ve Kurum Hitabı",
      fields: ["hitap_1", "hitap_2"],
    },
    {
      id: "dilekce-metni",
      title: "2. Dilekçe ve Ayrılma Metni",
      fields: ["ana_paragraf", "sonuc_cumlesi"],
    },
    {
      id: "sefi-iletisim",
      title: "3. Şantiye Şefi ve İletişim Bilgileri",
      fields: [
        "tarih",
        "unvan",
        "ad_soyad",
        "tc_deger",
        "iletisim_deger",
        "adres_deger",
      ],
    },
  ],

  "santiye-sefi-sozlesmesi": [
    {
      id: "taraflar",
      title: "1. Taraflar",
      fields: ["muteahhit_unvan", "santiye_sefi_ad"],
    },
    {
      id: "isyeri-bilgileri",
      title: "2. İşyeri Bilgileri (Madde 2)",
      fields: ["il", "ilce", "adres", "mahalle", "ada", "parsel", "yibf", "pafta"],
    },
    {
      id: "ucret-ve-tarih",
      title: "3. Ücret ve Sözleşme Tarihi",
      fields: ["ucret", "sozlesme_tarihi"],
    },
    {
      id: "imza-alanlari",
      title: "4. İmza Alanları",
      fields: ["santiye_sefi_imza_adi", "muteahhit_imza_unvan"],
    },
  ],

  "santiye-sefi-taahhutnamesi": [
    {
      id: "sefi-bilgileri",
      title: "1. Şantiye Şefi Bilgileri",
      fields: [
        "santiye_sefi_ad_soyad",
        "unvan",
        "oda_sicil_no",
        "tc_kimlik_no",
        "telefon",
        "adres",
      ],
    },
    {
      id: "yapi-ve-idare",
      title: "2. Yapı ve İdare Bilgileri",
      fields: [
        "ilgili_idare",
        "il_ilce",
        "pafta_ada_parsel",
        "yapi_adresi",
        "yapi_sahibi",
        "yapi_sahibi_adresi",
      ],
    },
    {
      id: "tarih-ve-imza",
      title: "3. Tarih ve İmza",
      fields: ["tarih", "unvan_imza"],
    },
  ],
} as const;

/**
 * Belirtilen belgenin bölüm tanımlarını döner.
 */
export function getSectionsForDocument(
  documentId: BelgeDocumentId
): readonly BelgeStudioSectionDefinition[] {
  return BELGE_STUDIO_SECTIONS[documentId] ?? [];
}

/**
 * Belirli bir alanın hangi bölüme ait olduğunu bulur.
 */
export function findSectionForField(
  documentId: BelgeDocumentId,
  fieldKey: string
): BelgeStudioSectionDefinition | null {
  const sections = getSectionsForDocument(documentId);
  for (const sec of sections) {
    if (sec.fields.includes(fieldKey)) {
      return sec;
    }
  }
  return null;
}

/**
 * Bölümdeki dolu alan sayısını hesaplar (validasyon değil, bilgilendirme amaçlıdır).
 * Boş olmayan, salt boşluk içermeyen alanlar 'dolu' sayılır.
 */
export function calculateSectionFilledCount(
  section: BelgeStudioSectionDefinition,
  formData: Record<string, unknown>
): { filled: number; total: number } {
  let filled = 0;
  for (const field of section.fields) {
    const val = formData[field];
    if (typeof val === "string" && val.trim().length > 0) {
      filled += 1;
    } else if (val !== null && val !== undefined && String(val).trim().length > 0) {
      filled += 1;
    }
  }
  return {
    filled,
    total: section.fields.length,
  };
}
