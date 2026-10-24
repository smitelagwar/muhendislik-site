import { BETON_DOKUM_DEFAULT_DATA, INSAAT_RUHSATI_DEFAULT_DATA, ISTIFA_DILEKCESI_DEFAULT_DATA, SOZLESME_DEFAULT_DATA, TAAHHUTNAME_DEFAULT_DATA } from "../../../src/lib/pdf-engine";
import { getBlankDocumentData, getDocumentPdfProfiles, type BelgeDocumentId } from "../../../src/lib/belgeler-pdf-profiles";

export const stage12Documents: Array<{ id: BelgeDocumentId; name: string; sample: object; pages: number }> = [
  { id: "beton-dokum-tutanagi", name: "beton", sample: BETON_DOKUM_DEFAULT_DATA, pages: 1 },
  { id: "santiye-sefi-taahhutnamesi", name: "taahhutname", sample: TAAHHUTNAME_DEFAULT_DATA, pages: 1 },
  { id: "santiye-sefi-istifa-dilekcesi", name: "istifa", sample: ISTIFA_DILEKCESI_DEFAULT_DATA, pages: 1 },
  { id: "insaat-ruhsati-dilekcesi", name: "ruhsat", sample: INSAAT_RUHSATI_DEFAULT_DATA, pages: 1 },
  { id: "santiye-sefi-sozlesmesi", name: "sozlesme", sample: SOZLESME_DEFAULT_DATA, pages: 2 },
];
export function stage12Cases(document: typeof stage12Documents[number]) {
  const extended = Object.fromEntries(Object.entries(getDocumentPdfProfiles(document.id)).map(([key, profile]) => [key,
    profile.fixedValue ?? (key.includes("tarih") ? "29.02.2024" : key === "yibf" ? "0071234" :
      profile.multiline ? "Çağrı Işık ŞİMŞEK, Çankaya / İstanbul. Güçlendirme ve şantiye ölçümleri. ".repeat(3).trim() :
      "Çağrı Işık ŞİMŞEK Özgür Ünal Çığ Şantiyesi"),
  ]));
  return [{ name: "blank", values: getBlankDocumentData(document.id) }, { name: "sample", values: { ...document.sample } as Record<string, string> }, { name: "turkish-long", values: extended }];
}
