import type { BelgeDraftEnvelope } from "@/lib/belge-draft-storage";
import {
  DOCUMENT_EDITABLE_FIELDS,
  type BelgeDocumentId,
  type BelgeDraftScope,
} from "@/lib/belge-ux-config";

/** Full legacy guest drafts stay untouched. Account drafts overlay only manual fields. */
export function mergeStoredDraftWithBase(
  documentId: BelgeDocumentId,
  baseValues: Record<string, string>,
  draft: BelgeDraftEnvelope,
  scope: BelgeDraftScope,
): Record<string, string> {
  if (scope.kind === "guest") return draft.values;
  const fields = draft.manualFields ?? [...DOCUMENT_EDITABLE_FIELDS[documentId]];
  const result = { ...baseValues };
  for (const key of fields) result[key] = draft.values[key] ?? "";
  return result;
}
