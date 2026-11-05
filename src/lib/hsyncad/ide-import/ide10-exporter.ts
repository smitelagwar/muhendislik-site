import type { IdeProject } from "./index";
import { saveNativeIdeSource } from "../ide-native-save";

export interface Ide10ExportInput {
  sourceBuffer: ArrayBuffer | Uint8Array;
  project?: IdeProject;
  donorIde10Buffer?: ArrayBuffer | Uint8Array;
}

export interface Ide10ExportResult {
  bytes: Uint8Array;
  mode: "native-ide10-passthrough";
  patchedElementCount: 0;
}

/** Copy the original IDE10 archive. Unsupported edits never write partial records. */
export function exportToIde10Binary(input: Ide10ExportInput): Ide10ExportResult {
  if (input.donorIde10Buffer) throw new Error("Başka bir proje kaynak dosyanın yerine kullanılamaz.");
  const { bytes } = saveNativeIdeSource(input.sourceBuffer, input.project, "ide10");
  return { bytes, mode: "native-ide10-passthrough", patchedElementCount: 0 };
}

/** Compatibility entry for older scripts. Only an unchanged source can be copied. */
export function patchIde10DonorBuffer(source: ArrayBuffer | Uint8Array, project: IdeProject): Ide10ExportResult {
  return exportToIde10Binary({ sourceBuffer: source, project });
}
