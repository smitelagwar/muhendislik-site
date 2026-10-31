export const IDE_HEADER_SIGNATURE = "IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n\0";
export const IDE10_VERSION = 201094;
export const IDE11_VERSION = 211220;
export const IDE_HEADER_CRC_START_OFFSET = 88;

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
