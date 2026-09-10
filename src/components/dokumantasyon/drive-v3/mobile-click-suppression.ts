// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE SYNTHETIC CLICK DEDUPE
// ============================================================================

const DEFAULT_TTL_MS = 1_000;

type SuppressionEntry = {
  count: number;
  expiresAt: number;
};

const suppressions = new Map<string, SuppressionEntry>();

function pruneExpired(now: number) {
  for (const [id, entry] of suppressions) {
    if (entry.expiresAt < now) suppressions.delete(id);
  }
}

/**
 * Pointer/touch gesture path has already handled this item. Browsers may emit a
 * compatibility click afterwards; arm exactly one consumable suppression token
 * so the click path cannot select/open the same item a second time.
 */
export function armSyntheticClickSuppression(
  id: string,
  now = Date.now(),
  ttlMs = DEFAULT_TTL_MS
): void {
  pruneExpired(now);
  const current = suppressions.get(id);
  suppressions.set(id, {
    count: (current?.count ?? 0) + 1,
    expiresAt: now + ttlMs,
  });
}

/**
 * Returns true only when a live suppression token exists for this exact item.
 * Consumption happens in the click event handler, not inside the reducer, so
 * reducer purity and React Strict Mode semantics remain intact.
 */
export function consumeSyntheticClickSuppression(
  id: string,
  now = Date.now()
): boolean {
  pruneExpired(now);
  const current = suppressions.get(id);
  if (!current) return false;

  if (current.count <= 1) {
    suppressions.delete(id);
  } else {
    suppressions.set(id, { ...current, count: current.count - 1 });
  }
  return true;
}

export function clearSyntheticClickSuppressions(): void {
  suppressions.clear();
}
