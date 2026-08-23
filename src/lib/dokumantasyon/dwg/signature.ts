import type { DwgConversionProfile } from "./types";

export const DWG_DXF_ENGINE_VERSION = "2.4.0";
export const DWG_DXF_PROFILE_ID = "dwg-dxf-v1";

export const DWG_DXF_PROFILE: DwgConversionProfile = Object.freeze({
  id: DWG_DXF_PROFILE_ID,
  engine: "@node-projects/acad-ts",
  engineVersion: DWG_DXF_ENGINE_VERSION,
  reader: Object.freeze({
    failsafe: true,
    keepUnknownEntities: false,
    keepUnknownNonGraphicalObjects: false,
    crcCheck: false,
    readSummaryInfo: true,
    ignoreProxyGraphics: true,
  }),
  writer: Object.freeze({
    binary: false as const,
    decimalPrecision: null,
    writeAllHeaderVariables: false,
    writeOptionalValues: true,
    closeStream: true,
    resetDxfClasses: false,
    updateDimensionsInBlocks: false,
    updateDimensionsInModel: false,
    writeXData: true,
    writeXRecords: true,
    writeShapes: true,
  }),
});

function flag(value: boolean): "1" | "0" {
  return value ? "1" : "0";
}

const r = DWG_DXF_PROFILE.reader;
const w = DWG_DXF_PROFILE.writer;

export const DWG_DXF_CONVERTER_SIGNATURE = [
  `acad-ts:${DWG_DXF_ENGINE_VERSION}`,
  DWG_DXF_PROFILE_ID,
  `r:f${flag(r.failsafe)}:ue${flag(r.keepUnknownEntities)}:uo${flag(r.keepUnknownNonGraphicalObjects)}:crc${flag(r.crcCheck)}:si${flag(r.readSummaryInfo)}:px${flag(r.ignoreProxyGraphics)}`,
  `w:ascii:prec=roundtrip:allhdr${flag(w.writeAllHeaderVariables)}:opt${flag(w.writeOptionalValues)}:reset${flag(w.resetDxfClasses)}:dib${flag(w.updateDimensionsInBlocks)}:dim${flag(w.updateDimensionsInModel)}:xd${flag(w.writeXData)}:xr${flag(w.writeXRecords)}:sh${flag(w.writeShapes)}`,
].join("|");
