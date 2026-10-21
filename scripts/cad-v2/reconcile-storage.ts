import { getDatabaseUrl, hasBlobAccessConfiguration, isVercelDeployment } from "@/lib/dokumantasyon/runtime-mode";
import { CadV2DurableRepository } from "@/lib/cad-v2/db/repository";
import {
  createVercelCadV2ReconcileBlobStore,
  reconcileCadV2ExpiredPublishGenerations,
} from "@/lib/cad-v2/db/reconcile";

const GRACE_MS = 24 * 60 * 60 * 1000;

async function main() {
  if (isVercelDeployment()) throw new Error("CAD_V2_RECONCILE_CLI_ONLY: bu komut serverless request içinde çalıştırılamaz.");
  if (!getDatabaseUrl()) throw new Error("CAD_V2_DATABASE_NOT_CONFIGURED: reconcile hedefi yok.");
  if (!hasBlobAccessConfiguration()) throw new Error("CAD_V2_BLOB_NOT_CONFIGURED: reconcile hedefi yok.");

  const apply = process.argv.includes("--apply");
  if (apply && process.env.CAD_V2_RECONCILE_CONFIRM !== "DELETE_EXPIRED_CAD_V2_GENERATIONS") {
    throw new Error("CAD_V2_RECONCILE_CONFIRM_REQUIRED: --apply için açık ortam teyidi gerekli.");
  }
  const repository = CadV2DurableRepository.fromNeon();
  const results = await reconcileCadV2ExpiredPublishGenerations({
    repository,
    blobStore: createVercelCadV2ReconcileBlobStore(),
    mode: apply ? "apply" : "report",
    graceMs: GRACE_MS,
  });
  process.stdout.write(`${JSON.stringify({ mode: apply ? "apply" : "report", graceMs: GRACE_MS, results }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
