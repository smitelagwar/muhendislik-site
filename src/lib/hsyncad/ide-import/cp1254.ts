/** Pure-JS Windows-1254 (Turkish) codec safe for all browsers and Edge runtimes. */

const CP1254_HIGH_OVERRIDES: Record<number, number> = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9f: 0x0178,
  0xd0: 0x011e, // Ğ
  0xdd: 0x0130, // İ
  0xde: 0x015e, // Ş
  0xf0: 0x011f, // ğ
  0xfd: 0x0131, // ı
  0xfe: 0x015f, // ş
};

const CP1254_DECODE_TABLE: string[] = Array.from({ length: 256 }, (_, byte) =>
  String.fromCharCode(CP1254_HIGH_OVERRIDES[byte] ?? byte),
);

const CP1254_ENCODE_MAP = new Map<number, number>(
  CP1254_DECODE_TABLE.map((ch, byte) => [ch.charCodeAt(0), byte]),
);

/** Decode a Windows-1254 byte slice into a Unicode string without relying on host ICU tables. */
export function decodeCp1254(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += CP1254_DECODE_TABLE[bytes[i]];
  }
  return out;
}

/** Encode a Unicode string into Windows-1254 bytes (unmapped characters become '?'). */
export function encodeCp1254(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    out[i] = CP1254_ENCODE_MAP.get(text.charCodeAt(i)) ?? 0x3f;
  }
  return out;
}
