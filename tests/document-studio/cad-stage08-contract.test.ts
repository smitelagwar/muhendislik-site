
import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { resolveReviewDxfInsunits, exportReviewToDxf } from "../../src/lib/dokumantasyon/cad-review/export-dxf";
import { pngToPdfBlob } from "../../src/lib/dokumantasyon/cad-review/export-image";
import { exportReviewToJson, importReviewFromJson } from "../../src/lib/dokumantasyon/cad-review/export-json";
import { loadLocalCadReview, localCadReviewStorageKey, saveLocalCadReview, type CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import { sourceContextFromInsunits } from "../../src/lib/dokumantasyon/cad-review/units";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";

const now = "2026-11-02T00:00:00.000Z";
const fileId = "11111111-1111-4111-8111-111111111111";
const makeDoc = (sourceVersionKey = "revision-1"): CadReviewDocument => ({
  schemaVersion: 1,
  fileId,
  sourceVersionKey,
  sourceSha256: "0".repeat(64),
  revision: 0,
  items: [],
  createdAt: now,
  updatedAt: now,
});
const marker = (id: string) => ({
  id,
  type: "comment_pin" as const,
  position: { x: 123, y: 456 },
  pinIndex: 1,
  title: "Kolon inceleme",
  author: "Mühendis",
  status: "open" as const,
  comment: "Şöför, Çiçek, Ağaç",
  style: { color: "#ef4444", strokeWidth: 2, opacity: 1 },
  createdAt: now,
  updatedAt: now,
});

test("DXF INSUNITS reflects real source world units; unknown/calibrated does not claim metre", () => ���q�^