import { DwgConversionError, type DwgInspection, type DwgVersionInfo } from "./types";

const VERIFIED_VERSIONS: Record<string, DwgVersionInfo> = {
  AC1014: { magic: "AC1014", label: "AutoCAD R14", year: 1997, verifiedByStage1: true },
  AC1015: { magic: "AC1015", label: "AutoCAD 2000/2000i/2002", year: 2000, verifiedByStage1: true },
  AC1018: { magic: "AC1018", label: "AutoCAD 2004/2005/2006", year: 2004, verifiedByStage1: true },
  AC1021: { magic: "AC1021", label: "AutoCAD 2007/2008/2009", year: 2007, verifiedByStage1: true },
  AC1024: { magic: "AC1024", label: "AutoCAD 2010/2011/2012", year: 2010, verifiedByStage1: true },
  AC1027: { magic: "AC1027", label: "AutoCAD 2013–2017", year: 2013, verifiedByStage1: true },
  AC1032: { magic: "AC1032", label: "AutoCAD 2018+", year: 2018, verifiedByStage1: true },
};

const KNOWN_UNVERIFIED_VERSIONS: Record<string, DwgVersionInfo> = {
  AC1009: { magic: "AC1009", label: "AutoCAD R11/R12", year: 1990, verifiedByStage1: false },
  AC1012: { magic: "AC1012", label: "AutoCAD R13", year: 1994, verifiedByStage1: false },
};

function readMagic(source: Uint8Array): string {
  return String.fromCharCode(...source.subarray(0, 6));
}

export function inspectDwgBytes(source: Uint8Array): DwgInspection {
  const sourceBytes = source.byteLength;

  if (sourceBytes === 0) {
    return {
      status: "invalid",
      sourceBytes,
      magic: null,
      version: null,
      reasonCode: "EMPTY_INPUT",
      reason: "DWG input is empty.",
    };
  }

  if (sourceBytes < 6) {
    return {
      status: "invalid",
      sourceBytes,
      magic: null,
      version: null,
      reasonCode: "TRUNCATED_HEADER",
      reason: "DWG input is shorter than the six-byte ACxxxx version signature.",
    };
  }

  const magic = readMagic(source);
  if (!/^AC\d{4}$/.test(magic)) {
    return {
      status: "invalid",
      sourceBytes,
      magic,
      version: null,
      reasonCode: "INVALID_SIGNATURE",
      reason: `Input does not begin with a DWG ACxxxx signature: ${JSON.stringify(magic)}.`,
    };
  }

  const verified = VERIFIED_VERSIONS[magic];
  if (verified) {
    return {
      status: "supported",
      sourceBytes,
      magic,
      version: verified,
      reasonCode: null,
      reason: null,
    };
  }

  const known = KNOWN_UNVERIFIED_VERSIONS[magic] ?? {
    magic,
    label: "Unverified DWG version",
    year: null,
    verifiedByStage1: false,
  };

  return {
    status: "unsupported",
    sourceBytes,
    magic,
    version: known,
    reasonCode: "UNSUPPORTED_VERSION",
    reason: `${magic} is not part of the Stage 1 verified DWG conversion matrix.`,
  };
}

export function assertConvertibleDwg(inspection: DwgInspection): asserts inspection is DwgInspection {
  if (inspection.status === "supported") return;

  throw new DwgConversionError(
    inspection.reasonCode ?? "INVALID_SIGNATURE",
    inspection.reason ?? "DWG input is not convertible by the current profile.",
    { inspection }
  );
}

export function supportedDwgMagics(): string[] {
  return Object.keys(VERIFIED_VERSIONS).sort();
}
