import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { DokFile } from "../src/lib/dokumantasyon/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
process.env.DATABASE_URL = "";
process.env.POSTGRES_URL = "";
process.env.APS_CLIENT_ID = "adapter-test-client";
process.env.APS_CLIENT_SECRET = "adapter-test-secret";
process.env.APS_BUCKET_KEY = "adapter-test-bucket";

const { getLocalStorageDir, readLocalDb, writeLocalDb } = await import("../src/lib/dokumantasyon/local-store");
const { releaseCadDerivatives, resolveCadPreviewStatus, startCadPreview } = await import("../src/lib/dokumantasyon/cad-aps");

const originalFetch = globalThis.fetch;
let uploadCalls = 0;
let translationCalls = 0;
let manifestCalls = 0;
let remoteDeleteCalls = 0;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

  if (url.endsWith("/authentication/v2/token") && method === "POST") {
    return Response.json({ access_token: "test-access-token", expires_in: 3600 });
  }
  if (url.endsWith("/oss/v2/buckets") && method === "POST") {
    return new Response(null, { status: 409 });
  }
  if (url.includes("/signeds3upload?") && method === "GET") {
    return Response.json({ uploadKey: `upload-${uploadCalls + 1}`, urls: ["https://signed.test/upload"] });
  }
  if (url === "https://signed.test/upload" && method === "PUT") {
    uploadCalls += 1;
    return new Response(null, { status: 200 });
  }
  if (url.endsWith("/signeds3upload") && method === "POST") {
    return Response.json({ objectId: `urn:adsk.objects:os.object:adapter-test-bucket/dwg/object-${uploadCalls}.dwg` });
  }
  if (url.endsWith("/modelderivative/v2/designdata/job") && method === "POST") {
    translationCalls += 1;
    return Response.json({ result: "created" }, { status: 201 });
  }
  if (url.includes("/modelderivative/v2/designdata/") && url.endsWith("/manifest") && method === "GET") {
    manifestCalls += 1;
    return Response.json({ status: manifestCalls === 1 ? "inprogress" : "success", progress: manifestCalls === 1 ? "25%" : "complete" });
  }
  if (method === "DELETE") {
    remoteDeleteCalls += 1;
    return new Response(null, { status: 204 });
  }
  throw new Error(`Beklenmeyen APS mock isteği: ${method} ${url}`);
}) as typeof fetch;

const storageDir = getLocalStorageDir();
const runId = crypto.randomUUID();
const firstName = `cad-aps-adapter-${runId}-1.dwg`;
const secondName = `cad-aps-adapter-${runId}-2.dwg`;
const firstBytes = Buffer.from("AC1027\0adapter-test-one", "binary");
const secondBytes = Buffer.from("AC1027\0adapter-test-two", "binary");

function fixture(id: string, filename: string, size: number): DokFile {
  const now = new Date().toISOString();
  return {
    id,
    folder_id: null,
    display_name: filename,
    blob_pathname: `dok_storage/${filename}`,
    blob_url: `local:${filename}`,
    size_bytes: size,
    mime_type: "application/acad",
    extension: ".dwg",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    current_version_number: 1,
  };
}

const firstFile = fixture(crypto.randomUUID(), firstName, firstBytes.length);
const secondFile = fixture(crypto.randomUUID(), secondName, secondBytes.length);

try {
  await fs.writeFile(path.join(storageDir, firstName), firstBytes);
  await fs.writeFile(path.join(storageDir, secondName), secondBytes);

  const initial = await resolveCadPreviewStatus(firstFile);
  assert(initial.status === "pending", "İlk DWG durumu pending olmalıydı.");

  const started = await startCadPreview(firstFile, false);
  assert(started.status === "translating", "APS işi translating durumuna geçmeliydi.");
  const ready = await resolveCadPreviewStatus(firstFile);
  assert(ready.status === "ready" && ready.urn && ready.viewerToken, "APS derivative ready ve Viewer tokenlı olmalıydı.");

  const reused = await startCadPreview(firstFile, false);
  assert(reused.status === "ready", "Aynı kaynak hazır derivative'i tekrar kullanmalıydı.");
  assert(uploadCalls === 1 && translationCalls === 1, "Aynı DWG yeniden upload/translate edilmemeliydi.");

  const concurrent = await Promise.all([
    startCadPreview(secondFile, false),
    startCadPreview(secondFile, false),
  ]);
  assert(concurrent.some((result) => result.status === "ready" || result.status === "translating"), "Eşzamanlı APS isteği ilerlemeliydi.");
  assert(`${uploadCalls}:${translationCalls}` === "2:2", "Eşzamanlı istek tek upload/translation işi açmalıydı.");

  const persisted = readLocalDb().cad_derivatives || [];
  assert(persisted.every((item) => !("viewerToken" in item)), "Viewer token DB'ye yazılmamalıydı.");

  await releaseCadDerivatives(firstFile.id);
  await releaseCadDerivatives(secondFile.id);
  assert(remoteDeleteCalls >= 2, "Kullanılmayan APS derivative/object varlıkları temizlenmeliydi.");

  console.info("CAD APS adapter kontrolü geçti: durum, dedupe, concurrency, token ve lifecycle.");
} finally {
  globalThis.fetch = originalFetch;
  await fs.rm(path.join(storageDir, firstName), { force: true });
  await fs.rm(path.join(storageDir, secondName), { force: true });
  const db = readLocalDb();
  if (db.cad_derivatives) {
    db.cad_derivatives = db.cad_derivatives.filter(
      (item) => item.file_id !== firstFile.id && item.file_id !== secondFile.id
    );
    writeLocalDb(db);
  }
}
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "CAD APS adapter kontrolü başarısız oldu.");
  process.exitCode = 1;
});
