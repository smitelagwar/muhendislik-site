export type DxfEncodingSource = "acad-version" | "dwg-codepage" | "utf8-probe" | "legacy-fallback";

export interface DxfEncodingResolution {
  encoding: string;
  source: DxfEncodingSource;
  acadVersion: string | null;
  codePage: string | null;
  isBinary: boolean;
  warnings: string[];
}

const HEADER_SNIFF_LIMIT = 256 * 1024;
const UTF8_DXF_VERSION = 1021; // AutoCAD 2007 / AC1021 and newer use UTF-8.

const CODEPAGE_ALIASES: Record<string, string> = {
  ANSI_874: "windows-874",
  ANSI_932: "shift_jis",
  ANSI_936: "gbk",
  ANSI_949: "euc-kr",
  ANSI_950: "big5",
  DOS932: "shift_jis",
  GB2312: "gbk",
  BIG5: "big5",
  UTF8: "utf-8",
  "UTF-8": "utf-8",
};

function asciiSniff(bytes: Uint8Array): string {
  const limit = Math.min(bytes.length, HEADER_SNIFF_LIMIT);
  let result = "";
  const chunkSize = 8192;

  for (let offset = 0; offset < limit; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, limit);
    const chars = new Array<string>(end - offset);
    for (let index = offset; index < end; index += 1) {
      chars[index - offset] = String.fromCharCode(bytes[index]);
    }
    result += chars.join("");
  }

  return result;
}

function parseAsciiPairs(text: string): Array<{ code: number; value: string }> {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Array<{ code: number; value: string }> = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (Number.isFinite(code)) pairs.push({ code, value: lines[index + 1].trim() });
  }
  return pairs;
}

function readHeaderVariable(pairs: Array<{ code: number; value: string }>, variableName: string): string | null {
  for (let index = 0; index < pairs.length - 1; index += 1) {
    if (pairs[index].code === 9 && pairs[index].value === variableName) {
      return pairs[index + 1]?.value || null;
    }
  }
  return null;
}

function parseAcadVersion(acadVersion: string | null): number | null {
  if (!acadVersion) return null;
  const match = /^AC(\d+)$/i.exec(acadVersion.trim());
  if (!match) return null;
  const version = Number.parseInt(match[1], 10);
  return Number.isFinite(version) ? version : null;
}

function mapDwgCodePage(codePage: string | null): string | null {
  if (!codePage) return null;
  const normalized = codePage.trim().toUpperCase().replace(/[ -]+/g, "_");
  if (CODEPAGE_ALIASES[normalized]) return CODEPAGE_ALIASES[normalized];

  const windowsMatch = /^(?:ANSI_|WINDOWS_?)(125[0-8])$/.exec(normalized);
  if (windowsMatch) return `windows-${windowsMatch[1]}`;

  const ansiNumber = /^ANSI_(\d+)$/.exec(normalized);
  if (ansiNumber) {
    const aliases: Record<string, string> = {
      "874": "windows-874",
      "932": "shift_jis",
      "936": "gbk",
      "949": "euc-kr",
      "950": "big5",
    };
    return aliases[ansiNumber[1]] ?? null;
  }

  return null;
}

function decoderSupported(encoding: string): boolean {
  try {
    new TextDecoder(encoding);
    return true;
  } catch {
    return false;
  }
}

function isValidUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function hasBinarySignature(bytes: Uint8Array): boolean {
  const signature = "AutoCAD Binary DXF";
  if (bytes.length < signature.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature.charCodeAt(index)) return false;
  }
  return true;
}

export function detectDxfEncoding(bytes: Uint8Array): DxfEncodingResolution {
  const sniff = asciiSniff(bytes);
  const pairs = parseAsciiPairs(sniff);
  const acadVersion = readHeaderVariable(pairs, "$ACADVER");
  const codePage = readHeaderVariable(pairs, "$DWGCODEPAGE");
  const warnings: string[] = [];
  const isBinary = hasBinarySignature(bytes);

  if (isBinary) {
    return {
      encoding: "utf-8",
      source: "legacy-fallback",
      acadVersion,
      codePage,
      isBinary: true,
      warnings: ["Binary DXF algılandı; mevcut web parser yalnızca ASCII DXF hattı için doğrulanmıştır."],
    };
  }

  const versionNumber = parseAcadVersion(acadVersion);
  if (versionNumber !== null && versionNumber >= UTF8_DXF_VERSION) {
    return { encoding: "utf-8", source: "acad-version", acadVersion, codePage, isBinary: false, warnings };
  }

  const mappedCodePage = mapDwgCodePage(codePage);
  if (mappedCodePage) {
    if (decoderSupported(mappedCodePage)) {
      return {
        encoding: mappedCodePage,
        source: "dwg-codepage",
        acadVersion,
        codePage,
        isBinary: false,
        warnings,
      };
    }
    warnings.push(`$DWGCODEPAGE ${codePage} için tarayıcı decoder desteği yok; güvenli fallback uygulanıyor.`);
  } else if (codePage) {
    warnings.push(`$DWGCODEPAGE ${codePage} tanınmadı; encoding otomatik tahmin ediliyor.`);
  }

  if (isValidUtf8(bytes)) {
    if (versionNumber !== null && versionNumber < UTF8_DXF_VERSION && !codePage) {
      warnings.push("Eski DXF sürümünde $DWGCODEPAGE yok; içerik geçerli UTF-8 olduğu için UTF-8 seçildi.");
    }
    return { encoding: "utf-8", source: "utf8-probe", acadVersion, codePage, isBinary: false, warnings };
  }

  warnings.push("Encoding kesin belirlenemedi; legacy Western fallback olarak windows-1252 kullanılıyor.");
  return {
    encoding: "windows-1252",
    source: "legacy-fallback",
    acadVersion,
    codePage,
    isBinary: false,
    warnings,
  };
}

export function decodeDxfBytes(bytes: Uint8Array, encoding: string): string {
  return new TextDecoder(encoding, { fatal: false }).decode(bytes);
}
