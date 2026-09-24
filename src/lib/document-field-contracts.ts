export const DOCUMENT_EDITABLE_FIELDS = {
  "beton-dokum-tutanagi": [
    "tutanak_alt_baslik",
    "tarih",
    "yer",
    "yibf",
    "olay_aciklamasi",
    "gozlem_notlar",
    "laboratuvar",
    "muteahhit",
    "santiye_sefi",
    "yapi_denetim",
  ],
  "insaat-ruhsati-dilekcesi": [
    "tarih",
    "belediye_adi",
    "mudurluk_adi",
    "ana_metin",
    "ad_soyad",
    "unvan",
    "adres",
    "tel",
  ],
  "santiye-sefi-istifa-dilekcesi": [
    "hitap_1",
    "hitap_2",
    "ana_paragraf",
    "sonuc_cumlesi",
    "tarih",
    "unvan",
    "ad_soyad",
    "tc_deger",
    "iletisim_deger",
    "adres_deger",
  ],
  "santiye-sefi-sozlesmesi": [
    "muteahhit_unvan",
    "santiye_sefi_ad",
    "il",
    "ilce",
    "adres",
    "yibf",
    "pafta",
    "mahalle",
    "ada",
    "parsel",
    "ucret",
    "sozlesme_tarihi",
    "santiye_sefi_imza_adi",
    "muteahhit_imza_unvan",
  ],
  "santiye-sefi-taahhutnamesi": [
    "santiye_sefi_ad_soyad",
    "unvan",
    "oda_sicil_no",
    "tc_kimlik_no",
    "telefon",
    "adres",
    "il_ilce",
    "ilgili_idare",
    "pafta_ada_parsel",
    "yapi_adresi",
    "yapi_sahibi",
    "yapi_sahibi_adresi",
    "tarih",
    "unvan_imza",
  ],
} as const;

export const DOCUMENT_PDF_ONLY_FIELDS = {
  "beton-dokum-tutanagi": [],
  "insaat-ruhsati-dilekcesi": [],
  "santiye-sefi-istifa-dilekcesi": [
    "adres_etiket",
    "tc_etiket",
    "iletisim_etiket",
  ],
  "santiye-sefi-sozlesmesi": [],
  "santiye-sefi-taahhutnamesi": [],
} as const satisfies Record<keyof typeof DOCUMENT_EDITABLE_FIELDS, readonly string[]>;

export function countFilledEditableFields<T extends object>(
  data: T,
  fields: readonly (keyof T & string)[],
  ignoredValues: readonly string[] = []
): number {
  const ignored = new Set(ignoredValues);

  return fields.reduce((count, field) => {
    const rawValue = (data as Record<string, unknown>)[field];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (!value || ignored.has(value)) {
      return count;
    }

    return count + 1;
  }, 0);
}
