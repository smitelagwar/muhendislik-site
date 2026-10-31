import { DOCUMENT_EDITABLE_FIELDS, type BelgeDocumentId } from "../belge-ux-config";
import {
  BETON_DOKUM_DEFAULT_DATA, ISTIFA_DILEKCESI_DEFAULT_DATA,
  SOZLESME_DEFAULT_DATA, INSAAT_RUHSATI_DEFAULT_DATA, TAAHHUTNAME_DEFAULT_DATA,
} from "../pdf-engine";
import type { BelgeProfile } from "./profile-schema";
import { BELGE_PROFILE_FIELD_MAP } from "./field-map";

const defaults: Record<BelgeDocumentId, object> = {
  "beton-dokum-tutanagi": BETON_DOKUM_DEFAULT_DATA,
  "insaat-ruhsati-dilekcesi": INSAAT_RUHSATI_DEFAULT_DATA,
  "santiye-sefi-istifa-dilekcesi": ISTIFA_DILEKCESI_DEFAULT_DATA,
  "santiye-sefi-sozlesmesi": SOZLESME_DEFAULT_DATA,
  "santiye-sefi-taahhutnamesi": TAAHHUTNAME_DEFAULT_DATA,
};
/** Copies original PDF defaults, then overlays only whitelisted nonempty person fields. */
export function resolveBelgeBaseData(documentId: BelgeDocumentId, profile: BelgeProfile | null) {
  const data: Record<string, string> = Object.fromEntries(
    Object.entries(defaults[documentId]).map(([key, val]) => [key, String(val ?? "")]),
  );
  const profileKeys: string[] = [];
  if (profile) {
    const allowed = new Set<string>(DOCUMENT_EDITABLE_FIELDS[documentId]);
    for (const [key, fn] of Object.entries(BELGE_PROFILE_FIELD_MAP[documentId])) {
      if (!fn || !allowed.has(key)) continue;
      const resolved = fn(profile);
      if (!resolved) continue;
      data[key] = resolved;
      profileKeys.push(key);
    }
  }
  return { data, profileKeys };
}
