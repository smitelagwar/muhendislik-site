import { parseIde10, type IdeElement, type IdeProject } from "./ide-import";
import {
  getIdeCarrierFormat,
  sealIdeCarrierHeader,
  validateIdeCarrier,
  type IdeCarrierMetadata,
  type NativeIdeFormat,
} from "./ide-import/ide-binary-codec";
import { createIdeDataView, encodeIdeFloat64, hasIdeEncodedNumbers } from "./ide-import/numeric-codec";
import { readNativeBeamSection } from "./ide-import/native-plan-labels";

export type { NativeIdeFormat } from "./ide-import/ide-binary-codec";

/**
 * Fields whose complete record grammar has been authenticated against real
 * native carriers and can be rewritten in place without shifting any record.
 * Everything else stays an explicit rejection (T-F6.1 product rule).
 */
export type IdeNativePatchField = "beamSectionHeight";

export interface IdeNativeElementPatch {
  /** `IdeElement.id` (`floor:id` form) of the decoded record to patch. */
  id: string;
  /** The record's authenticated name-string offset (`IdeElement.sourceOffset`). */
  sourceOffset: number;
  field: IdeNativePatchField;
  /** New field value in native metres, range-checked like the reader. */
  value: number;
}

export interface NativeIdePatchResult {
  bytes: Uint8Array;
  format: NativeIdeFormat;
  metadata: IdeCarrierMetadata;
  /** Byte ranges rewritten in place; the rest of the file is byte-identical. */
  patchedRanges: Array<{ offset: number; length: number }>;
  /** Total differing bytes (patch ranges + the resealed CRC header). */
  changedByteCount: number;
}

const patchRejected = (message: string): string => `${message} Değişiklik dışı/çözülmemiş alan yaması reddedilir.`;

/** Typed v11 beam section height: raw-or-encoded f64 at `name + 266`
 * (tag u32=1 @+262, style family @+274, three unit scales @+298/+306/+314),
 * authenticated by `readNativeBeamSection` for every beam family measured. */
function applyBeamSectionHeightPatch(bytes: Uint8Array, view: DataView, element: IdeElement, patch: IdeNativeElementPatch, encoded: boolean): { offset: number; length: number } {
  const label = `${element.name ?? element.id} (beamSectionHeight)`;
  if (element.type !== "beam") throw new Error(patchRejected(`Yama reddedildi (${label}): bu alan yalnız tipli v11 kiriş kaydında bulunur; hedef kayıt türü '${element.type}'.`));
  if (typeof patch.value !== "number" || !Number.isFinite(patch.value) || patch.value <= 0.01 || patch.value > 100) throw new Error(patchRejected(`Yama reddedildi (${label}): yeni kesit yüksekliği aralık dışı (0.01–100 m): ${patch.value}.`));
  // Destructured locals keep the undefined-narrowing across the grammar calls.
  const { width, height } = element;
  if (width === undefined || height === undefined) throw new Error(patchRejected(`Yama reddedildi (${label}): kaynaktaki tipli kesit alanı çözülmemiş.`));
  const base = element.sourceOffset + element.name.length + 1;
  if (base + 322 > bytes.byteLength) throw new Error(patchRejected(`Yama reddedildi (${label}): alan konumu dosya sınırını aşıyor.`));
  // Full grammar re-authentication with the reader's own rules: tag, style
  // family, unit scales and the stored height must all line up before writing.
  const section = readNativeBeamSection(view, element.sourceOffset, element.name, bytes.byteLength, width);
  if (!section || section.height !== height) throw new Error(patchRejected(`Yama reddedildi (${label}): kiriş kesit kaydının grameri doğrulanamadı.`));
  const offset = base + 266;
  if (view.getFloat64(offset, true) !== height) throw new Error(patchRejected(`Yama reddedildi (${label}): depolanmış kesit yüksekliği okuyucu değeriyle uyuşmuyor.`));
  const field = encoded ? encodeIdeFloat64(patch.value) : (() => {
    const raw = new Uint8Array(8);
    new DataView(raw.buffer).setFloat64(0, patch.value, true);
    return raw;
  })();
  bytes.set(field, offset);
  return { offset, length: 8 };
}

/**
 * Patch editor: rewrite authenticated element fields in place, then reseal the
 * carrier CRC + length header. Unresolved bytes are preserved by construction:
 * the output is verified byte-for-byte against the source and any change
 * outside the declared patch ranges (plus the CRC seal at 83..86) is a hard
 * error. The source buffer is never modified. Compressed .cde bodies carry
 * inflated-relative offsets and cannot be patched in place.
 */
export function saveNativeIdeOutput(source: ArrayBuffer | Uint8Array, patches: IdeNativeElementPatch[]): NativeIdePatchResult {
  if (!Array.isArray(patches) || patches.length === 0) {
    throw new Error("Yama listesi boş; kaydedilecek kullanıcı düzenlemesi yok. Değişiklik dışı native kaydetme reddedilir.");
  }
  const original = source instanceof Uint8Array ? source : new Uint8Array(source);
  const bytes = Uint8Array.from(original);
  const buffer = bytes.buffer as ArrayBuffer;
  // Damaged carriers are rejected before any patching; never silently resealed.
  const metadata = validateIdeCarrier(bytes);
  const format = getIdeCarrierFormat(bytes, metadata);
  if (format === "cde") throw new Error("Sıkıştırılmış .cde gövdesinde yerinde yama desteklenmiyor; kayıt konumları açılmış gövdeye göredir.");
  const project = parseIde10(buffer, "kaynak");
  const view = createIdeDataView(buffer);
  const encoded = hasIdeEncodedNumbers(buffer);
  const byOffset = new Map<number, IdeElement>();
  for (const element of project.elements) byOffset.set(element.sourceOffset, element);

  const patchedRanges: Array<{ offset: number; length: number }> = [];
  const seen = new Set<string>();
  for (const patch of patches) {
    if (!patch || typeof patch.sourceOffset !== "number" || !Number.isInteger(patch.sourceOffset) || patch.sourceOffset < 0 || patch.sourceOffset >= bytes.byteLength) {
      throw new Error(patchRejected(`Yama hedefi doğrulanamadı: geçersiz kaynak konumu ${String(patch?.sourceOffset)}.`));
    }
    const element = byOffset.get(patch.sourceOffset);
    if (!element || element.id !== patch.id) {
      throw new Error(patchRejected(`Yama hedefi doğrulanamadı: ${String(patch?.id)} @${patch.sourceOffset} konumunda bu kimlikle çözümlenmiş eleman yok.`));
    }
    const key = `${patch.id}@${patch.sourceOffset}:${patch.field}`;
    if (seen.has(key)) throw new Error(patchRejected(`Muğlak yama: ${key} iki kez verildi; tek alan yaması bekleniyor.`));
    seen.add(key);
    if (patch.field === "beamSectionHeight") patchedRanges.push(applyBeamSectionHeightPatch(bytes, view, element, patch, encoded));
    else throw new Error(patchRejected(`Bilinmeyen yama alanı: ${String(patch.field)}.`));
  }

  // Reseal length @79 (unchanged by in-place patches) and payload CRC @83.
  sealIdeCarrierHeader(bytes, { formatVersion: metadata.formatVersion, encodedFlag: metadata.encodedFlag });
  const sealed = validateIdeCarrier(bytes);

  // Byte-identity guarantee: every differing byte must belong to a declared
  // patch range or the resealed CRC header; anything else is a hard failure.
  let changedByteCount = 0;
  for (let i = 0; i < bytes.byteLength; i++) {
    if (original[i] === bytes[i]) continue;
    const inPatchRange = patchedRanges.some(range => i >= range.offset && i < range.offset + range.length);
    if (!inPatchRange && !(i >= 83 && i < 87)) {
      throw new Error(`Beklenmedik bayt değişti @${i}; yama kapsamı dışı kayıt yazımı tespit edildi, kaydetme reddedilir.`);
    }
    changedByteCount++;
  }
  return { bytes, format, metadata: sealed, patchedRanges, changedByteCount };
}

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
