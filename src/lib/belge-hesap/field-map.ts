import type { BelgeDocumentId } from "../belge-ux-config";
import type { BelgeProfile } from "./profile-schema";
import { cityDistrict, formattedPhone, nameForDocument, personAddress, signedProfessionName, uppercaseName, uppercaseProfession } from "./formatters";
type Resolve = (p: BelgeProfile) => string | undefined;
/** Explicit per-document mapping: project fields must never be filled from person data. */
export const BELGE_PROFILE_FIELD_MAP: Record<BelgeDocumentId, Partial<Record<string, Resolve>>> = {
  "beton-dokum-tutanagi": { santiye_sefi: signedProfessionName },
  "insaat-ruhsati-dilekcesi": {
    ad_soyad: nameForDocument,
    adres: (p) => { const v = personAddress(p); return v ? "Adres: " + v : undefined; },
    tel: (p) => { const v = formattedPhone(p.telefon); return v ? "Tel: " + v : undefined; },
  },
  "santiye-sefi-istifa-dilekcesi": {
    ad_soyad: uppercaseName, unvan: uppercaseProfession,
    tc_deger: (p) => p.tcKimlikNo?.trim() || undefined,
    iletisim_deger: (p) => formattedPhone(p.telefon),
    adres_deger: personAddress,
  },
  "santiye-sefi-sozlesmesi": {
    santiye_sefi_ad: uppercaseName, santiye_sefi_imza_adi: uppercaseName,
  },
  "santiye-sefi-taahhutnamesi": {
    santiye_sefi_ad_soyad: nameForDocument,
    unvan: uppercaseProfession, unvan_imza: uppercaseProfession,
    oda_sicil_no: (p) => p.odaSicilNo?.trim() || undefined,
    tc_kimlik_no: (p) => p.tcKimlikNo?.trim() || undefined,
    telefon: (p) => formattedPhone(p.telefon),
    adres: personAddress, il_ilce: cityDistrict,
  },
};
