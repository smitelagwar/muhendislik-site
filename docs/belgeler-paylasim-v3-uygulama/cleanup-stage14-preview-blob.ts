import assert from "node:assert/strict";
import { del, list } from "@vercel/blob";

const ISOLATED_PREVIEW_BLOB_STORE_ID = "store_fnCz97b5poIneDPq";
const timeout = setTimeout(() => {
  console.error("ASAMA_14 Preview Blob cleanup exceeded the 30-second safety limit.");
  process.exit(124);
}, 30_000);

async function listTestObjects(oidcToken: string) {
  let cursor: string | undefined;
  const blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  do {
    const page = await list({
      prefix: "belge_paylasim/",
      cursor,
      limit: 1000,
      oidcToken,
      storeId: ISOLATED_PREVIEW_BLOB_STORE_ID,
    });
    blobs.push(...page.blobs);
    assert.ok(blobs.length <= 10, "Unexpected object count in isolated Preview store; refusing deletion.");
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function main() {
  assert.equal(process.env.BELGE_STAGE14_PREVIEW_BLOB_CLEANUP, "1", "Explicit Preview Blob cleanup flag is required.");
  assert.equal(process.env.BELGE_STAGE14_PREVIEW_BLOB_STORE_ID, ISOLATED_PREVIEW_BLOB_STORE_ID, "Unexpected Blob store; refusing cleanup.");
  assert.equal(process.env.VERCEL_ENV, "preview", "Cleanup requires Preview-scoped Vercel OIDC credentials.");
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  assert.ok(oidcToken, "Preview-scoped Vercel OIDC token is required.");

  const before = await listTestObjects(oidcToken);
  assert.ok(before.every((blob) => blob.pathname.startsWith("belge_paylasim/")), "Unexpected Blob pathname; refusing deletion.");
  if (before.length) {
    await del(before.map((blob) => blob.url), {
      oidcToken,
      storeId: ISOLATED_PREVIEW_BLOB_STORE_ID,
    });
  }
  const after = await listTestObjects(oidcToken);
  assert.equal(after.length, 0, "Preview test Blob prefix remains after cleanup.");
  console.log(JSON.stringify({
    scope: "preview-only-private-store/belge_paylasim/",
    storeId: ISOLATED_PREVIEW_BLOB_STORE_ID,
    deleted: before.length,
    remaining: after.length,
  }));
}

void main().then(() => process.exit(0)).catch((error: unknown) => {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN ?? "";
  const message = (error instanceof Error ? error.message : "").replaceAll(oidcToken, "[REDACTED]");
  console.error(JSON.stringify({
    errorType: error instanceof Error ? error.name : "Error",
    errorCode: error && typeof error === "object" && "code" in error ? String(error.code) : null,
    statusCode: error && typeof error === "object" && "statusCode" in error ? Number(error.statusCode) : null,
    detail: message.slice(0, 240),
    message: "ASAMA_14 isolated Preview Blob cleanup failed.",
  }));
  process.exit(1);
}).finally(() => clearTimeout(timeout));
