import type { CadModel } from "../model";

/** Coverage and observations only. Unproved native semantics never become solver loads. */
export function nativeImportCoverage(model: CadModel, sourceIdentity: { sha256: string; bytes: number }) {
  const imported = model.ideImport;
  if (!imported) throw new Error("Native kaynak kaydı yok.");
  const source = imported.source;
  if (!/^[a-f0-9]{64}$/.test(sourceIdentity.sha256) || sourceIdentity.bytes !== source.byteLength) throw new Error("Native kaynak kimliği geçersiz.");
  const ids = new Set(source.elements.map(e => e.id));
  const mapped = new Set(imported.mappedIds), references = new Map(imported.references.map(r => [r.id, r.reason]));
  if (ids.size !== source.elements.length || mapped.size !== imported.mappedIds.length || references.size !== imported.references.length
    || mapped.size + references.size !== ids.size || [...ids].some(id => mapped.has(id) === references.has(id))) throw new Error("Native nesne kapsamı eksik/yinelenmiş.");
  const requiredUnknown = ["material-properties-and-binding", "load-self-weight-and-unit-semantics", "spectrum-soil-and-analysis-settings", "physical-connectivity-and-diaphragm", "reinforcement-layout", "saved-result-revision"];
  const records = source.elements.map(e => {
    if (!Number.isSafeInteger(e.sourceOffset) || e.sourceOffset < 0) throw new Error("Native kayıt konumu geçersiz.");
    const excluded = e.type === "axis" || e.type === "line" || e.type === "slabEdge" || e.type === "wall" && e.structural === false;
    const load = e.planAnnotation?.loads;
    if (load && (load.unit !== "tf/m²" || !Number.isFinite(load.dead) || !Number.isFinite(load.live) || !Number.isSafeInteger(load.sourceOffset) || load.sourceOffset < 0)) throw new Error("Native yük gözlemi birim/sayı/konum sözleşmesine uymuyor.");
    return {
      elementId: e.id, nativeId: e.nativeId, floorId: e.floorId, parserType: e.type,
      physicalRole: excluded ? "excluded" : "unknown",
      geometry: mapped.has(e.id) ? "editable" : "reference",
      referenceReason: references.get(e.id) ?? null,
      calculationStatus: excluded ? "excluded" : "missing_data",
      requiredUnknown: excluded ? [] : [...requiredUnknown],
      geometryPreserved: { holes: e.holes?.length ?? 0, nativeMesh: e.mesh?.source === "native-analysis-mesh", foundationFlag: e.foundation ?? null },
      // Explicit future solver boundary, including reference-only geometry. It is
      // deliberately not passed to the legacy frame solver as a supported object.
      analysisGeometryCandidate: excluded ? null : structuredClone({
        status: "requires_physical_validation", elementId: e.id, floorId: e.floorId,
        planOnly: e.planOnly ?? false, pointsM: e.points, footprintM: e.footprint ?? null,
        openingsM: e.holes ?? null, mesh: e.mesh ?? null, stairParameters: e.stairParameters ?? null,
        bottomM: e.bottom ?? null, topM: e.top ?? null, thicknessM: e.thickness ?? null,
        nativeFoundationFlag: e.foundation ?? null, physicalRole: "unknown",
      }),
      source: { sha256: sourceIdentity.sha256, format: source.format, recordNameOffset: e.sourceOffset,
        offsetSpace: "parser-decoded-stream", rawFileOffsetVerified: false },
      observedLoads: load ? { source: "native_decoded", dead: load.dead, live: load.live, parserDeclaredUnit: load.unit,
        sourceOffset: load.sourceOffset, selfWeightIncluded: "unknown", unitSemanticsAccepted: false,
        numericalEncodingAcceptedForAnalysis: false, solverInput: false } : null,
    };
  });
  const count = (condition: (r: typeof records[number]) => boolean) => records.filter(condition).length;
  return {
    schemaVersion: 1, kind: "IMPORT_COVERAGE", source: { ...sourceIdentity, filename: source.filename, format: source.format },
    authority: "derived-from-current-parser", engineeringAcceptance: false, calculationComplete: false,
    nativeObjectUniverse: "unknown", rawParserCoverage: structuredClone(source.coverage),
    counts: { recognized: records.length, editable: mapped.size, references: references.size,
      excluded: count(r => r.physicalRole === "excluded"), calculationCandidates: count(r => r.physicalRole !== "excluded"),
      calculationReady: 0, loadObservations: count(r => !!r.observedLoads), parserUnsupported: source.coverage.unsupportedRecords },
    familyCapability: { family: source.format, geometry: "existing-parser", engineering: "not_accepted", loadSemantics: "unknown" },
    requiredUnknown, records,
    limitations: ["Kayıt sayısı ve unsupportedRecords=0 tam mühendislik kapsamı değildir.",
      "Ofsetler parserın açılmış/çözümlenmiş akışına aittir; her ailede ham dosya ofseti değildir.",
      "G/Q gözlemi, öz ağırlık/birim/bağlantı kabulü olmadan solver yükü yapılmaz.",
      "Kaynak geometri/boşluk/merdiven ağı korunur; hesap adaptörü ve normatif kabul henüz tamamlanmadı."],
  };
}
