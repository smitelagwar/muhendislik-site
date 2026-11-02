import { expect, test } from "@playwright/test";
import {
  exportReviewToJson,
  importReviewFromJson,
} from "../../src/lib/dokumantasyon/cad-review/export-json";
import { exportReviewToDxf } from "../../src/lib/dokumantasyon/cad-review/export-dxf";
import type { CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

function createFullReviewTestDocument(): CadReviewDocument {
  const now = "2026-08-31T00:00:00.000Z";
  return {
    schemaVersion: 1,
    fileId: "33333333-3333-4333-8333-333333333333",
    sourceVersionKey: "v1-export-source-key",
    sourceSha256: "b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
        type: "distance",
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        measuredLength: 100,
        label: "Aks 1-2 AralÄ±ÄŸÄ±: 100m",
        author: "Mimar",
        status: "open",
        createdAt: now,
        updatedAt: now,
        comment: "",
        style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
      },
      {
        id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        type: "chain_distance",
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 50 },
          { x: 100, y: 50 },
        ],
        totalDistance: 120.71,
        se¶»§q«^