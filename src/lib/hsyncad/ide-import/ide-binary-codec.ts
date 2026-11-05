export const IDE_HEADER_SIGNATURE = "IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n\0";
export const IDE10_VERSION = 201094;
export const IDE11_040_VERSION = 211040;
export const IDE11_VERSION = 211220;
export const IDE11_CURRENT_TRIAL_VERSION = 211280;
export const IDE_HEADER_CRC_START_OFFSET = 88;
export type NativeIdeFormat = "ide10" | "ide11" | "ide11trial" | "cde";

export interface IdeCarrierMetadata {
  formatVersion: 201091 | 201094 | 211040 | 211220 | 211280;
  encodedFlag: 0 | 1;
  byteLength: number;
  projectName: string;
  /** Stored CP1254 byte length, including its terminal NUL. */
  projectNameByteLength: number;
  storedChecksum: number;
}

export type IdeCarrierValidationCode = "signature" | "version" | "encoding" | "length" | "name" | "checksum";

export class IdeCarrierValidationError extends Error {
  constructor(public readonly code: IdeCarrierValidationCode, message: string) {
    super(message);
    this.name = "IdeCarrierValidationError";
  }
}

/**
 * Validate the observed carrier envelope before interpreting any model records.
 * This authenticates neither the complete native serialization nor ideCAD acceptance.
 * 201091 is also used by the installed ideCAD structural template; it has the
 * same exact stored-length and raw-CRC contract as the observed 201094 files.
 * Validation is read-only: damaged checksums are never silently resealed.
 */
export function validateIdeCarrier(bytes: Uint8Array): IdeCarrierMetadata {
  if (bytes.byteLength < 100 || [...IDE_HEADER_SIGNATURE].some((char, i) => bytes[i] !== char.charCodeAt(0))) {
    throw new IdeCarrierValidationError("signature", "Bu dosya desteklenen IDE Building Designer Ver 4/SubVer 00 biçiminde değil; başlık eksik veya bozuk.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const formatVersion = view.getUint32(74, true);
  const encodedFlag = bytes[78];
  if (formatVersion !== 201091 && formatVersion !== IDE10_VERSION && formatVersion !== IDE11_040_VERSION && formatVersion !== IDE11_VERSION && formatVersion !== IDE11_CURRENT_TRIAL_VERSION) {
    throw new IdeCarrierValidationError("version", `IDE dosyasının biçim/sayısal kodlama sürümü henüz desteklenmiyor: ${formatVersion}.`);
  }
  if ((encodedFlag !== 0 && encodedFlag !== 1) ||
      (encodedFlag === 1 && formatVersion < IDE11_VERSION) ||
      (encodedFlag === 0 && formatVersion === IDE11_CURRENT_TRIAL_VERSION)) {
    throw new IdeCarrierValidationError("encoding", `IDE dosyasının sayısal kodlama bayrağı bu sürüm için desteklenmiyor: ${encodedFlag}.`);
  }
  if (view.getUint32(79, true) !== bytes.byteLength) {
    throw new IdeCarrierValidationError("length", "IDE dosyasının kayıtlı boyutu uyuşmuyor. Dosya eksik veya bozulmuş olabilir.");
  }
  const nameLength = view.getUint32(96, true);
  const nameEnd = 100 + nameLength;
  if (nameLength < 1 || nameEnd > bytes.byteLength || bytes[nameEnd - 1] !== 0 || bytes.subarray(100, nameEnd - 1).includes(0)) {
    throw new IdeCarrierValidationError("name", "IDE dosyasının proje adı uzunluğu veya NUL sonlandırıcısı bozuk.");
  }
  const checksum = verifyIdeHeaderChecksum(bytes);
  if (!checksum.valid) {
    throw new IdeCarrierValidationError("checksum", "IDE dosyasının bütünlük sağlama toplamı (CRC32) uyuşmuyor. Bozuk dosya model olarak okunmadı.");
  }
  return {
    formatVersion,
    encodedFlag,
    byteLength: bytes.byteLength,
    projectName: new TextDecoder("windows-1254").decode(bytes.subarray(100, nameEnd - 1)),
    projectNameByteLength: nameLength,
    storedChecksum: checksum.stored,
  };
}

function getIdePreviewEnd(bytes: Uint8Array, metadata: IdeCarrierMetadata): number | undefined {
  const previewLengthOffset = 112 + metadata.projectNameByteLength;
  if (previewLengthOffset + 4 > bytes.length) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const previewEnd = previewLengthOffset + 4 + view.getUint32(previewLengthOffset, true);
  if (previewEnd <= bytes.length) return previewEnd;
}

/** Locate the observed 11.04 compressed body with three empty prefix tables. */
export function getIde11CompressedBlock(bytes: Uint8Array, metadata: IdeCarrierMetadata) {
  if (metadata.formatVersion !== IDE11_040_VERSION) return;
  const unsupported = "Bu IDE 11.04 proje öneki henüz desteklenmiyor.";
  const end = getIdePreviewEnd(bytes, metadata);
  if (end === undefined || end + 60 > bytes.length) throw new Error(unsupported);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(end + 30, true) !== 0x5ce ||
      view.getUint32(end + 34, true) !== 0 || view.getUint32(end + 38, true) !== 0 ||
      bytes[end + 42] !== 0 || view.getUint32(end + 43, true) !== 0) throw new Error(unsupported);
  const timestamps = view.getUint32(end + 47, true);
  const flag = end + 51 + timestamps * 28;
  if (flag + 1 >= bytes.length || bytes[flag] !== 1) throw new Error(unsupported);
  const offset = flag + 9;
  if (offset + 6 > bytes.length) throw new Error("IDE sıkıştırılmış proje gövdesi eksik.");
  const rawLength = view.getUint32(flag + 1, true);
  const compressedLength = view.getUint32(flag + 5, true);
  if (rawLength === 0 || offset + compressedLength !== bytes.length || bytes[offset] !== 0x78) {
    throw new Error("IDE sıkıştırılmış proje gövdesinin uzunluğu veya zlib başlığı geçersiz.");
  }
  return { offset, rawLength };
}

/** Keep the source format and the observed trial marker. */
export function getIdeCarrierFormat(bytes: Uint8Array, metadata: IdeCarrierMetadata): NativeIdeFormat {
  if (metadata.formatVersion < IDE11_040_VERSION) return "ide10";
  if (getIde11CompressedBlock(bytes, metadata)) return "cde";
  if (metadata.encodedFlag === 1) return "ide11trial";
  const previewEnd = getIdePreviewEnd(bytes, metadata);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const demo = previewEnd !== undefined && previewEnd + 34 <= bytes.length && view.getUint32(previewEnd + 30, true) === 0x5ce && bytes[previewEnd + 29] !== 0;
  return demo ? "ide11trial" : "ide11";
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

/**
 * Computes the exact ideCAD header checksum stored at offset 83..86 (RVA 0x706c70 / 0x706ff0).
 * Equal to (~crc32_ieee(bytes.subarray(88))) >>> 0.
 */
export function computeIdePayloadChecksum(bytes: Uint8Array, startOffset = IDE_HEADER_CRC_START_OFFSET): number {
  let crc = 0xffffffff;
  for (let i = startOffset; i < bytes.byteLength; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc >>> 0;
}

export function verifyIdeHeaderChecksum(bytes: Uint8Array): { stored: number; computed: number; valid: boolean } {
  if (bytes.byteLength < IDE_HEADER_CRC_START_OFFSET) return { stored: 0, computed: 0, valid: false };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const stored = view.getUint32(83, true);
  const computed = computeIdePayloadChecksum(bytes, IDE_HEADER_CRC_START_OFFSET);
  return { stored, computed, valid: stored === computed };
}

/** Updates version (74..77), encodedFlag (78), byteLength (79..82) and payload checksum (83..86) in place. */
export function sealIdeCarrierHeader(
  bytes: Uint8Array,
  options: { formatVersion: number; encodedFlag: 0 | 1 },
): Uint8Array {
  if (bytes.byteLength < IDE_HEADER_CRC_START_OFFSET) {
    throw new Error("IDE taşıyıcı başlığı mühürlenemedi: dosya 88 byte'tan küçük.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(74, options.formatVersion, true);
  bytes[78] = options.encodedFlag;
  view.setUint32(79, bytes.byteLength, true);
  view.setUint32(83, computeIdePayloadChecksum(bytes, IDE_HEADER_CRC_START_OFFSET), true);
  return bytes;
}

const CP1254_SPECIAL_ENCODE: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94,
  "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c,
  "Ÿ": 0x9f, "Ğ": 0xd0, "İ": 0xdd, "Ş": 0xde, "ğ": 0xf0, "ı": 0xfd, "ş": 0xfe,
};

/** Encodes a JavaScript string into Windows-1254 (Turkish) bytes with a 4-byte LE length prefix (including NUL). */
export function encodeCp1254NulString(text: string): Uint8Array {
  const byteLen = text.length + 1;
  const out = new Uint8Array(4 + byteLen);
  new DataView(out.buffer).setUint32(0, byteLen, true);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const mapped = CP1254_SPECIAL_ENCODE[ch];
    out[4 + i] = mapped !== undefined ? mapped : (text.charCodeAt(i) <= 0xff ? text.charCodeAt(i) : 0x3f);
  }
  out[4 + text.length] = 0;
  return out;
}
