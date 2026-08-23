export type AcadTsEngine = typeof import("@node-projects/acad-ts");

let enginePromise: Promise<AcadTsEngine> | null = null;

export function loadAcadTsEngine(): Promise<AcadTsEngine> {
  if (!enginePromise) {
    enginePromise = import("@node-projects/acad-ts");
  }
  return enginePromise;
}
