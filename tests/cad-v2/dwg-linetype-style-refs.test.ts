import assert from "node:assert/strict";
import {
  attachDwgLinetypeStyleRefs,
  readDwgLinetypeStyleRefs,
  type DwgLinetypeStyleRefApi,
} from "../../src/lib/cad-v2/decode/dwg-linetype-style-refs";
import { mapLinetypeRecords } from "../../src/lib/cad-v2/decode/linetype-record";
import { mapTextStyleRecords } from "../../src/lib/cad-v2/decode/text-style-record";

const objectData = new Map<number, Record<string, unknown>>([
  [110, { name: "WATER_GLYPH", numdashes: 3, dashes: 500 }],
]);
const objectTypes = new Map<number, number>([[100, 7], [200, 99]]);
const dashArrays = new Map<number, Array<{ style?: number }>>([
  [500, [{ style: 0 }, { style: 701 }, { style: 702 }]],
]);
const referenceIds = new Map<number, string | undefined>([
  [701, "a1"],
  [702, "b2"],
]);
const visitedRefs: number[] = [];

const api: DwgLinetypeStyleRefApi = {
  dwg_get_num_objects: () => 2,
  dwg_get_object: (_data, index) => [100, 200][index],
  dwg_object_get_fixedtype: (object) => objectTypes.get(object) ?? -1,
  dwg_object_to_object_tio: (object) => object === 100 ? 110 : 210,
  dwg_dynapi_entity_data: <T>(object: number, field: string) => objectData.get(object)?.[field] as T,
  dwg_ptr_to_ltype_dash_array: (pointer, size) => (dashArrays.get(pointer) ?? []).slice(0, size),
  dwg_ref_get_id: (reference) => {
    visitedRefs.push(reference);
    return referenceIds.get(reference);
  },
};

const refs = readDwgLinetypeStyleRefs(api, 1, 7, new Set(["A1"]));
assert.deepEqual([...(refs.get("WATER_GLYPH")?.entries() ?? [])], [[1, "A1"]],
  "only known STYLE handles should be recovered by dash index");
assert.deepEqual(visitedRefs, [701, 702], "empty raw style refs should not be dereferenced");

const attached = attachDwgLinetypeStyleRefs([
  {
    name: "WATER_GLYPH",
    pattern: [
      { elementLength: 5, elementTypeFlag: 0 },
      { elementLength: -2, elementTypeFlag: 4, shapeNumber: 7 },
      { elementLength: -1, elementTypeFlag: 2, text: "W", styleObjectId: "EXPLICIT" },
    ],
  },
  { name: "OTHER", pattern: [{ elementLength: 1 }] },
], refs);
const canonicalLinetype = mapLinetypeRecords(attached).linetypes.WATER_GLYPH;
const canonicalStyle = mapTextStyleRecords([{ name: "WATER_SHAPE", handle: "A1", font: "water.shx" }]).WATER_SHAPE;
assert.equal(canonicalLinetype.complexElements?.[0]?.styleObjectId, canonicalStyle?.objectHandle,
  "recovered DWG handle should join to the canonical STYLE object's source handle");
assert.equal(canonicalLinetype.complexElements?.[1]?.styleObjectId, "EXPLICIT",
  "a direct style object id from a future converter must not be overwritten");
assert.deepEqual((attached[1] as { pattern: unknown[] }).pattern, [{ elementLength: 1 }],
  "records without resolved native refs should retain their original pattern");

console.log("PASS DWG linetype dash STYLE reference recovery and canonical handle join");
