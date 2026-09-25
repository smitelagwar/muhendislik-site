/**
 * Prefer compiler-authored global primitive order. The fallback keeps old
 * cached chunks renderable while newer compiler revisions are rolling out.
 */
export function resolveDrawCommandRenderOrder(globalOrderIndex: unknown, fallbackOrder: number): number {
  return typeof globalOrderIndex === "number" && Number.isSafeInteger(globalOrderIndex) && globalOrderIndex >= 0
    ? globalOrderIndex
    : fallbackOrder;
}
