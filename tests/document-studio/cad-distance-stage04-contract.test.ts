import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CadPressHoldDistanceMachine,
  CadPressHoldDistanceController,
  isValidCadDistance,
  type CadDistanceMeasurementResult,
} from "../../src/lib/dokumantasyon/cad-upstream/distance-measurement";
import type { CadSnapMode } from "../../src/lib/dokumantasyon/cad-upstream/snap-engine";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { exportReviewToDxf } from "../../src/lib/dokumantasyon/cad-review/export-dxf";
import {
  cadReviewDocumentSchema,
  type CadReviewDocument,
  type CadReviewItem,
} from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  sourceContextFromInsunits,
  captureMeasurementContext,
  formatCapturedDistance,
  formatDistance,
} from "../../src/lib/dokumantasyon/cad-review/units";

const now = "2026-11-02T00:00:00.000Z";
const id = "11111111-1111-4111-8111-111111111111";
const fileId = "22222222-2222-4222-8222-222222222222";
const p0 = { x: 0, y: 0 };
const p1 = { x: 3000, y: 4000 };
const ctx = captureMeasurementContext(sourceContextFromInsunits(4), { displayUnit: "m" });

function doc(items: CadReviewItem[] = []): CadReviewDocument {
  return {
    schemaVersion: 1,
    fileId,
    sourceVersionKey: "fixture.dxf",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items,
    createdAt: now,
    updatedAt: now,
  };
}

function item(override?: Partial<Extract<CadReviewItem, { type: "distance" }>>):
  Extract<CadReviewItem¶»§q«^