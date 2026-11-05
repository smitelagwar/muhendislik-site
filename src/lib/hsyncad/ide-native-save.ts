import { parseIde10, type IdeProject } from "./ide-import";
import { getIdeCarrierFormat, validateIdeCarrier, type NativeIdeFormat } from "./ide-import/ide-binary-codec";

export type { NativeIdeFormat } from "./ide-import/ide-binary-codec";

/** Preserve every original record, including fields the viewer cannot decode. */
export function saveNativeIdeSource(source: ArrayBuffer | Uint8Array, project?: IdeProject, requestedFormat?: NativeIdeFormat) {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
  const metadata = validateIdeCarrier(bytes);
  const format = getIdeCarrierFormat(bytes, metadata);
  if (requestedFormat && requestedFormat !== format) {
    throw new Error(`Kaynak ${format} biçiminde. ${requestedFormat} dönüşümü henüz ideCAD'de doğrulanmadı; dosyanın sürümü ve deneme işaretleri korunmalıdır.`);
  }
  if (project) {
    const buffer = bytes.buffer instanceof ArrayBuffer && bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer : bytes.slice().buffer;
    const original = parseIde10(buffer, project.filename);
    // Compare all decoded fields, not only counts/IDs. Unknown records stay in bytes.
    if (JSON.stringify({ name: original.name, floors: original.floors, elements: original.elements }) !==
        JSON.stringify({ name: project.name, floors: project.floors, elements: project.elements })) {
      throw new Error("Modelde değişiklik var. Bu değişiklikleri native IDE dosyasına kayıpsız yazma henüz doğrulanmadı. Çalışmayı .hsyncad olarak kaydedin.");
    }
  }
  return { bytes: new Uint8Array(bytes), format, metadata };
}
