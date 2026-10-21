import assert from "node:assert/strict";
import { hasCadV2DurableBlobConfiguration } from "../../src/lib/cad-v2/service/cad-v2-durable-service";

const originalBlobEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => /BLOB|VERCEL/i.test(key))
);

function clearBlobEnvironment(): void {
  for (const key of Object.keys(process.env)) {
    if (/BLOB|VERCEL/i.test(key)) delete process.env[key];
  }
}

try {
  clearBlobEnvironment();
  process.env.VERCEL = "1";
  process.env.BLOB_STORE_ID = "isolated-capability-test-store";
  assert.equal(
    hasCadV2DurableBlobConfiguration(),
    true,
    "Vercel OIDC store configuration must enable Blob without a long-lived token"
  );

  delete process.env.BLOB_STORE_ID;
  process.env.BLOB_READ_WRITE_TOKEN = "test-only-token";
  assert.equal(
    hasCadV2DurableBlobConfiguration(),
    false,
    "a Vercel deployment must fail closed when its OIDC store binding is absent"
  );

  clearBlobEnvironment();
  process.env.BLOB_READ_WRITE_TOKEN = "test-only-token";
  assert.equal(
    hasCadV2DurableBlobConfiguration(),
    true,
    "a local/CLI runtime may continue to use its configured Blob token"
  );

  console.log("PASS: CAD V2 recognizes Vercel OIDC, rejects unbound Vercel token fallback, and preserves local token mode.");
} finally {
  clearBlobEnvironment();
  Object.assign(process.env, originalBlobEnvironment);
}
