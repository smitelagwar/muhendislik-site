// ============================================================================
// DWG/DXF MOTOR V2 — SÜRÜM, ŞEMA VE BİLEŞEN KİMLİĞİ SABİTLERİ (P03)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, Fidelity v3 Planı P03

export const CAD_V2_SCHEMA_VERSION = 1;
export const CAD_V2_COMPILER_REVISION = "cad-v2-compiler-2026.09-v30";
export const CAD_V2_PIPELINE_REVISION = "fidelity-v3-p08";
export const CAD_V2_RENDER_ABI = "three172-cad2d-v2";
export const CAD_V2_QUALITY_PROFILE = "cad-v2-2d-v1" as const;
export const CAD_V2_FONT_DIGEST = "system-bundled-v1";

export const CAD_V2_DECODER_VERSIONS: Readonly<Record<string, string>> = Object.freeze({
  libredwg: "0.7.10",
  dataModel: "1.14.2",
  shxParser: "1.4.5",
  mtextParser: "1.5.0",
  opentype: "1.3.4",
  three: "0.172.0",
});
