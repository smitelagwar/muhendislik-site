import {
  ALL_BELGE_DOCUMENT_IDS,
  getKeyForMode,
  getScopedRecoveryKey,
  type BelgeDraftScope,
} from "@/lib/belge-ux-config";

type LimitedStorage = Pick<Storage, "removeItem">;

/** Destroy only the old account's local drafts; never delete a guest draft. */
export function clearLocalAccountDrafts(
  accountId: string,
  storage?: { device: LimitedStorage | null; session: LimitedStorage | null },
): void {
  const scope: BelgeDraftScope = { kind: "account", accountId };
  let stores = storage;
  if (!stores) {
    let device: LimitedStorage | null = null;
    let session: LimitedStorage | null = null;
    try { if (typeof window !== "undefined") device = window.localStorage; } catch { /* blocked */ }
    try { if (typeof window !== "undefined") session = window.sessionStorage; } catch { /* blocked */ }
    stores = { device, session };
  }
  for (const documentId of ALL_BELGE_DOCUMENT_IDS) {
    try { stores.device?.removeItem(getKeyForMode("device", documentId, scope)); }
    catch { /* Storage can be blocked in private mode. */ }
    try {
      stores.session?.removeItem(getKeyForMode("session", documentId, scope));
      stores.session?.removeItem(getScopedRecoveryKey(documentId, scope));
    } catch { /* Never affect document availability if storage is blocked. */ }
  }
}
