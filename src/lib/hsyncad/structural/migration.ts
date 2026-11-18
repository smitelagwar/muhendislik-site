import { validateModel, type CadModel } from "../model";
import { createStructuralProject } from "./project-schema";

/** Explicit migration: preserve the exact legacy JSON payload as archival evidence. */
export function migrateStructuralModel(input: unknown, projectId: string): CadModel {
  const model = validateModel(input);
  if (model.structural) return model;
  const structural = createStructuralProject(model, projectId);
  structural.legacyArchive = JSON.parse(JSON.stringify(input, (_key, value) => {
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Eski proje sonlu olmayan sayı içeriyor.");
    return value;
  }));
  return { ...model, structural };
}
