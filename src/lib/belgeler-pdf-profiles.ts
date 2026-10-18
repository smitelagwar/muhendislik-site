import { DOCUMENT_EDITABLE_FIELDS, DOCUMENT_PDF_ONLY_FIELDS } from "./document-field-contracts";

export type BelgeDocumentId = keyof typeof DOCUMENT_EDITABLE_FIELDS;
export interface PdfFieldProfile {
  size: number; bold: boolean; q: 0 | 1 | 2; page: number;
  rect: { x: number; y: number; width: number; height: number };
  baseline: number; multiline: boolean; renderer: "inline" | "default"; fixedValue?: string; anchorFirstLine?: boolean;
}
type FieldKey<D extends BelgeDocumentId> = (typeof DOCUMENT_EDITABLE_FIELDS)[D][number] | (typeof DOCUMENT_PDF_ONLY_FIELDS)[D][number];
type DocumentProfiles = { [D in BelgeDocumentId]: Record<FieldKey<D>, PdfFieldProfile> };

// Mevcut onaylı yerleşimden ölçülmüştür; koordinatlar PDF'nin sol alt köşesine göredir.
// İstifa iletişim bloğu dışındaki nominal tabanlar ve kutular korunur.
export const DOCUMENT_PDF_PROFILES = {
  "beton-dokum-tutanagi": {
    tutanak_alt_baslik: {"size":11,"bold":true,"q":1,"page":1,"rect":{"x":131,"y":751,"width":333.2756,"height":20},"baseline":757.24246875,"multiline":false,"renderer":"default"},
    tarih: {"size":9.5,"bold":false,"q":0,"page":1,"rect":{"x":179,"y":704,"width":352.2756,"height":20},"baseline":710.75485938,"multiline":false,"renderer":"default"},
    yer: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":179,"y":658,"width":352.2756,"height":36},"baseline":680.934375,"multiline":true,"renderer":"default"},
    yibf: {"size":9.5,"bold":false,"q":0,"page":1,"rect":{"x":179,"y":628,"width":352.2756,"height":20},"baseline":634.75485938,"multiline":false,"renderer":"default"},
    olay_aciklamasi: {"size":10,"bold":false,"q":0,"page":1,"rect":{"x":56,"y":530,"width":483.2756,"height":66},"baseline":581.59375,"multiline":true,"renderer":"default"},
    gozlem_notlar: {"size":9.5,"bold":false,"q":0,"page":1,"rect":{"x":63,"y":403,"width":469.2756,"height":50},"baseline":439.2640625,"multiline":true,"renderer":"default"},
    laboratuvar: {"size":8.6,"bold":false,"q":0,"page":1,"rect":{"x":67,"y":290,"width":219.6378,"height":34},"baseline":311.470625,"multiline":true,"renderer":"default"},
    muteahhit: {"size":8.6,"bold":false,"q":0,"page":1,"rect":{"x":308.6378,"y":290,"width":219.6378,"height":34},"baseline":311.470625,"multiline":true,"renderer":"default"},
    santiye_sefi: {"size":8.6,"bold":false,"q":0,"page":1,"rect":{"x":67,"y":158,"width":219.6378,"height":34},"baseline":179.470625,"multiline":true,"renderer":"default"},
    yapi_denetim: {"size":8.6,"bold":false,"q":0,"page":1,"rect":{"x":308.6378,"y":158,"width":219.6378,"height":34},"baseline":179.470625,"multiline":true,"renderer":"default"},
  },
  "santiye-sefi-istifa-dilekcesi": {
    hitap_1: {"size":11.8,"bold":true,"q":1,"page":1,"rect":{"x":188,"y":700,"width":219,"height":26},"baseline":708.96919375,"multiline":false,"renderer":"default"},
    hitap_2: {"size":11.8,"bold":true,"q":1,"page":1,"rect":{"x":218,"y":670,"width":159,"height":24},"baseline":677.96919375,"multiline":false,"renderer":"default"},
    ana_paragraf: {"size":9.15,"bold":false,"q":1,"page":1,"rect":{"x":68,"y":538,"width":459,"height":68},"baseline":592.73328125,"multiline":true,"renderer":"default"},
    sonuc_cumlesi: {"size":9.15,"bold":false,"q":0,"page":1,"rect":{"x":103,"y":500,"width":345,"height":25},"baseline":509.37441719,"multiline":false,"renderer":"default"},
    tarih: {"size":9.1,"bold":true,"q":2,"page":1,"rect":{"x":420,"y":770,"width":105,"height":20},"baseline":776.89149688,"multiline":false,"renderer":"default"},
    ad_soyad: {"size":10.3,"bold":true,"q":1,"page":1,"rect":{"x":370,"y":428,"width":160,"height":22},"baseline":435.48158438,"multiline":false,"renderer":"default"},
    adres_etiket: {"size":9,"bold":true,"q":0,"page":1,"rect":{"x":68,"y":347,"width":75,"height":18},"baseline":352.92565625,"multiline":false,"renderer":"default","fixedValue":"ADRES :"},
    adres_deger: {"size":8,"bold":false,"q":0,"page":1,"rect":{"x":143,"y":328.65065625,"width":225,"height":36},"baseline":352.92565625,"multiline":true,"renderer":"default","anchorFirstLine":true},
    tc_etiket: {"size":9,"bold":true,"q":0,"page":1,"rect":{"x":68,"y":310,"width":75,"height":18},"baseline":315.92565625,"multiline":false,"renderer":"default","fixedValue":"T.C. :"},
    tc_deger: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":143,"y":310,"width":133,"height":18},"baseline":315.92565625,"multiline":false,"renderer":"default"},
    iletisim_etiket: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":68,"y":293,"width":75,"height":18},"baseline":298.92565625,"multiline":false,"renderer":"default","fixedValue":"İletişim :"},
    iletisim_deger: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":143,"y":293,"width":139,"height":18},"baseline":298.92565625,"multiline":false,"renderer":"default"},
    unvan: {"size":9,"bold":false,"q":1,"page":1,"rect":{"x":370,"y":452,"width":160,"height":18},"baseline":457.92565625,"multiline":false,"renderer":"default"},
  },
  "insaat-ruhsati-dilekcesi": {
    tarih: {"size":11,"bold":true,"q":2,"page":1,"rect":{"x":350,"y":705,"width":175,"height":20},"baseline":711.24246875,"multiline":false,"renderer":"default"},
    belediye_adi: {"size":12,"bold":true,"q":1,"page":1,"rect":{"x":72,"y":635,"width":451,"height":22},"baseline":641.900875,"multiline":false,"renderer":"default"},
    mudurluk_adi: {"size":11,"bold":true,"q":1,"page":1,"rect":{"x":72,"y":615,"width":451,"height":20},"baseline":621.24246875,"multiline":false,"renderer":"default"},
    ana_metin: {"size":11,"bold":false,"q":0,"page":1,"rect":{"x":72,"y":520,"width":451,"height":65},"baseline":569.253125,"multiline":true,"renderer":"default"},
    ad_soyad: {"size":11,"bold":false,"q":1,"page":1,"rect":{"x":310,"y":445,"width":215,"height":22},"baseline":452.24246875,"multiline":false,"renderer":"default"},
    adres: {"size":10.5,"bold":false,"q":0,"page":1,"rect":{"x":72,"y":335,"width":451,"height":44},"baseline":363.9234375,"multiline":true,"renderer":"default"},
    tel: {"size":10.5,"bold":false,"q":0,"page":1,"rect":{"x":72,"y":305,"width":451,"height":20},"baseline":311.41326563,"multiline":false,"renderer":"default"},
    unvan: {"size":10,"bold":false,"q":1,"page":1,"rect":{"x":310,"y":425,"width":215,"height":18},"baseline":430.5840625,"multiline":false,"renderer":"default"},
  },
  "santiye-sefi-sozlesmesi": {
    muteahhit_unvan: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":105.03344727,"y":736.5,"width":160,"height":13},"baseline":739,"multiline":false,"renderer":"inline"},
    santiye_sefi_ad: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":138.84936523,"y":722.5,"width":145,"height":13},"baseline":725,"multiline":false,"renderer":"inline"},
    il: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":194.26757813,"y":664.5,"width":55,"height":14},"baseline":667,"multiline":false,"renderer":"inline"},
    ilce: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":263.51757813,"y":664.5,"width":89,"height":14},"baseline":667,"multiline":false,"renderer":"inline"},
    adres: {"size":9.5,"bold":false,"q":1,"page":1,"rect":{"x":57,"y":650.5,"width":170,"height":12},"baseline":653,"multiline":false,"renderer":"inline"},
    yibf: {"size":9.5,"bold":false,"q":1,"page":1,"rect":{"x":283.50366211,"y":650.5,"width":62,"height":14},"baseline":653,"multiline":false,"renderer":"inline"},
    pafta: {"size":9.5,"bold":false,"q":1,"page":1,"rect":{"x":432.11694336,"y":650.5,"width":35,"height":14},"baseline":653,"multiline":false,"renderer":"inline"},
    mahalle: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":57,"y":636.5,"width":170,"height":12.3},"baseline":639,"multiline":false,"renderer":"inline"},
    ada: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":232.27880859,"y":636.5,"width":38,"height":14},"baseline":639,"multiline":false,"renderer":"inline"},
    parsel: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":294.04736328,"y":636.5,"width":38,"height":14},"baseline":639,"multiline":false,"renderer":"inline"},
    ucret: {"size":9.5,"bold":true,"q":1,"page":1,"rect":{"x":231.75732422,"y":299.5,"width":84,"height":14},"baseline":302,"multiline":false,"renderer":"inline"},
    sozlesme_tarihi: {"size":9.5,"bold":true,"q":1,"page":2,"rect":{"x":99.76391602,"y":593.5,"width":72,"height":14},"baseline":596,"multiline":false,"renderer":"inline"},
    santiye_sefi_imza_adi: {"size":9.5,"bold":false,"q":1,"page":2,"rect":{"x":88,"y":487.5,"width":176,"height":12.7},"baseline":490,"multiline":false,"renderer":"inline"},
    muteahhit_imza_unvan: {"size":9.5,"bold":false,"q":1,"page":2,"rect":{"x":331,"y":487.5,"width":176,"height":12.7},"baseline":490,"multiline":false,"renderer":"inline"},
  },
  "santiye-sefi-taahhutnamesi": {
    oda_sicil_no: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":205.5,"y":729.8898,"width":134.5,"height":10.2},"baseline":731.9898,"multiline":false,"renderer":"inline"},
    tc_kimlik_no: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":205.5,"y":719.6898,"width":134.5,"height":10.2},"baseline":721.7898,"multiline":false,"renderer":"inline"},
    unvan: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":205.5,"y":709.4898,"width":325.5,"height":10.2},"baseline":711.5898,"multiline":false,"renderer":"inline"},
    adres: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":205.5,"y":699.28978,"width":325.5,"height":10.2},"baseline":701.38978,"multiline":false,"renderer":"inline"},
    telefon: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":205.5,"y":689.08977,"width":174.5,"height":10.2},"baseline":691.18977,"multiline":false,"renderer":"inline"},
    il_ilce: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":221,"y":646.1898,"width":310,"height":10.2},"baseline":648.2898,"multiline":false,"renderer":"inline"},
    ilgili_idare: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":221,"y":635.9898,"width":310,"height":10.2},"baseline":638.0898,"multiline":false,"renderer":"inline"},
    pafta_ada_parsel: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":221,"y":625.78978,"width":310,"height":10.2},"baseline":627.88978,"multiline":false,"renderer":"inline"},
    yapi_adresi: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":221,"y":615.58977,"width":310,"height":10.2},"baseline":617.68977,"multiline":false,"renderer":"inline"},
    yapi_sahibi: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":221,"y":605.3898,"width":310,"height":10.2},"baseline":607.4898,"multiline":false,"renderer":"inline"},
    yapi_sahibi_adresi: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":221,"y":595.1898,"width":310,"height":10.2},"baseline":597.2898,"multiline":false,"renderer":"inline"},
    tarih: {"size":9,"bold":false,"q":0,"page":1,"rect":{"x":232,"y":368.48978,"width":83,"height":10.2},"baseline":370.58978,"multiline":false,"renderer":"inline"},
    santiye_sefi_ad_soyad: {"size":9,"bold":true,"q":2,"page":1,"rect":{"x":350,"y":338.28977,"width":153,"height":10.2},"baseline":340.38977,"multiline":false,"renderer":"inline"},
    unvan_imza: {"size":9,"bold":false,"q":2,"page":1,"rect":{"x":350,"y":327.08979,"width":153,"height":10.2},"baseline":329.18979,"multiline":false,"renderer":"inline"},
  },
} satisfies DocumentProfiles;

export function getDocumentPdfProfiles(id: BelgeDocumentId): Record<string, PdfFieldProfile> {
  return DOCUMENT_PDF_PROFILES[id];
}

export function getBlankDocumentData(id: BelgeDocumentId): Record<string, string> {
  return Object.fromEntries(Object.entries(getDocumentPdfProfiles(id)).map(([key, profile]) => [key, profile.fixedValue ?? ""]));
}

export function normalizePdfFieldValue(value: unknown, multiline: boolean): string {
  const normalized = typeof value === "string"
    ? value.replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "") : "";
  return multiline ? normalized : normalized.replace(/\n+/g, " ");
}
