import assert from "node:assert/strict";
import { classifyRawRow, localCensusStatus, reconcileRawRows } from "../../scripts/cad-v2/l07-raw-census";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";

assert.equal(classifyRawRow({ role: "model", type: "LINE", sourceVisible: true, canonicalLocations: ["model:Model"], diagnosticCodes: [], blockReachable: false }), "converted");
assert.equal(classifyRawRow({ role: "model", type: "INSERT", sourceVisible: true, canonicalLocations: ["model:Model"], diagnosticCodes: ["UNSUPPORTED_MINSERT_ARRAY"], blockReachable: false }), "converted_with_diagnostic");
assert.equal(classifyRawRow({ role: "paper", type: "SOLID", sourceVisible: true, canonicalLocations: [], diagnosticCodes: ["UNSUPPORTED_ENTITY_TYPE"], blockReachable: false }), "unsupported_diagnostic");
assert.equal(classifyRawRow({ role: "model", type: "POINT", sourceVisible: true, canonicalLocations: [], diagnosticCodes: [], blockReachable: false }), "UNACCOUNTED");
assert.equal(classifyRawRow({ role: "block", type: "3DFACE", sourceVisible: true, canonicalLocations: [], diagnosticCodes: [], blockReachable: false }), "unreferenced_block_content");
assert.equal(classifyRawRow({ role: "block", type: "3DFACE", sourceVisible: true, canonicalLocations: [], diagnosticCodes: ["UNSUPPORTED_ENTITY_TYPE"], blockReachable: true }), "unsupported_diagnostic");
assert.equal(classifyRawRow({ role: "paper", type: "VIEWPORT", sourceVisible: true, canonicalLocations: [], diagnosticCodes: [], blockReachable: false }), "viewport_control");
assert.equal(classifyRawRow({ role: "model", type: "SPLINE", sourceVisible: true, canonicalLocations: [], diagnosticCodes: ["CURVE_GEOMETRY_INVALID"], blockReachable: false }), "invalid_diagnostic");
assert.equal(classifyRawRow({ role: "model", type: "TEXT", sourceVisible: false, canonicalLocations: [], diagnosticCodes: [], blockReachable: false }), "source_invisible_no_canonical");
assert.equal(classifyRawRow({ role: "model", type: "DIMENSION", sourceVisible: true, canonicalLocations: [], diagnosticCodes: ["UNRESOLVED_DIMENSION_SOURCE_GEOMETRY"], blockReachable: false }), "degraded_diagnostic");
assert.equal(localCensusStatus({ unaccountedRows: 0, ownerMismatchCount: 0, duplicateRawHandleCount: 0, canonicalOnlyHandleCount: 0, expansionTruncated: false }), "LOCAL_CENSUS_PASS");
assert.equal(localCensusStatus({ unaccountedRows: 0, ownerMismatchCount: 0, duplicateRawHandleCount: 0, canonicalOnlyHandleCount: 1, expansionTruncated: false }), "LOCAL_CENSUS_DEGRADED",
  "canonical-only source identity must prevent a false census PASS");

const row = (handle: string, type = "LINE", lookupHandle = handle, ownerEntityOrdinal = 0) => ({ sourceIndex: 0, handle, canonicalLookupHandle: lookupHandle, ownerEntityOrdinal, type, ownerRef: null, ownerRecordRefs: ["B0"], ownerRecordName: "*Model_Space", role: "model" as const, layoutId: "Model", flattenedListMember: true, sourceVisible: true, clipBoundaryPresent: false, classification: "pending", canonicalLocations: [], canonicalEntityHandles: [], diagnosticCodes: [], potentialExpandedOccurrences: 0, occurrencesUnderClipScope: 0 });
const minimalDoc = { modelSpaceEntities: [], paperSpaceEntities: {}, blocks: {}, diagnostics: [] } as unknown as CadCanonicalDocument;
const accounting = reconcileRawRows([row("A1"), row("A1")], minimalDoc);
assert.equal(accounting.unaccountedRows, 2, "a missing top-level mapping must stay visibly unaccounted");
assert.equal(accounting.duplicateRawHandleCount, 1, "duplicate source handles must be counted, not crash summary generation");
const fallbackDoc = { modelSpaceEntities: [{ handle: "H_1", type: "LINE", layer: "0", order: 1n, start: [0, 0], end: [1, 1] }], paperSpaceEntities: {}, blocks: {}, diagnostics: [] } as unknown as CadCanonicalDocument;
const fallbackAccounting = reconcileRawRows([row("32E94", "LINE", "H_1")], fallbackDoc);
assert.equal(fallbackAccounting.unaccountedRows, 0, "raw DXF objectId must map to decoder H_<record ordinal>");
assert.equal(fallbackAccounting.canonicalOnlyHandleCount, 0, "a matched decoder fallback handle must not be reported as lost");
const unsupportedDoc = { modelSpaceEntities: [], paperSpaceEntities: {}, blocks: {}, diagnostics: [{ id: "diag_dxf_unsupported_entity_3", code: "UNSUPPORTED_ENTITY_TYPE", severity: "warning", message: "unhandled DXF row" }] } as unknown as CadCanonicalDocument;
const unsupportedAccounting = reconcileRawRows([row("32E96", "OLE2FRAME", "H_3", 2)], unsupportedDoc);
assert.equal(unsupportedAccounting.unsupportedRows, 1, "source-order diagnostic must attach to raw rows without a canonical entity handle");
const blockDoc = { modelSpaceEntities: [], paperSpaceEntities: {}, blocks: { "*D100": { name: "*D100", basePoint: [0, 0], entities: [{ handle: "H_101", type: "LINE", layer: "0", order: 101n, start: [0, 0], end: [1, 1] }] } }, diagnostics: [] } as unknown as CadCanonicalDocument;
const blockRow = { ...row("32E97", "LINE", "H_101"), role: "block" as const, ownerRecordName: "*D100", layoutId: null };
const blockAccounting = reconcileRawRows([blockRow], blockDoc);
assert.equal(blockAccounting.unaccountedRows, 0, "block fallback must preserve the adapter-wide source-order offset");
assert.equal(blockAccounting.canonicalOnlyHandleCount, 0, "block canonical entity must reconcile by its owning record and source order");
const dimensionDoc = { modelSpaceEntities: [], paperSpaceEntities: {}, blocks: { GJHJGFH: { name: "GJHJGFH", basePoint: [0, 0], entities: [{ handle: "9CE9A", type: "DIMENSION", layer: "0", order: 1n, dimensionType: "linear", start: [0, 0], end: [1, 0], textPosition: [0, 1] }] } }, diagnostics: [] } as unknown as CadCanonicalDocument;
const dimensionRow = { ...row("9CE9A", "DIMENSION", "H_147556"), role: "block" as const, ownerRecordName: "GJHJGFH", layoutId: null };
const dimensionAccounting = reconcileRawRows([dimensionRow], dimensionDoc);
assert.equal(dimensionAccounting.unaccountedRows, 0, "explicit DXF source handle must take precedence over order fallback");
assert.equal(dimensionAccounting.canonicalOnlyHandleCount, 0, "dimension with source-handle canonical identity must not look decoder-only");

process.stdout.write("L07 raw census classification/accounting: 22 assertions passed\n");
