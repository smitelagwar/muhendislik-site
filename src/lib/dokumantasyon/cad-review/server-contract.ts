import { createHash } from "node:crypto";
import { z } from "zod";
import { cadReviewItemSchema } from "./schema";

export const cadReviewServerPatchSchema = z.object({
  schemaVersion: z.literal(1),
  serverRevisionId: z.string().min(1).max(1200),
  expectedRevision: z.number().int().min(0),
  items: z.array(cadReviewItemSchema).max(2000),
});

export type CadReviewServerPatch = z.infer<typeof cadReviewServerPatchSchema>;

export interface CadReviewSourceIdentity {
  serverRevisionId: string;
  sourceVersionKey: string;
  sourceSha256: string;
}

/**
 * dok_files currently has no separate revision_id column. blob_pathname is the
 * immutable source-object revision key in this repository, so Stage 5 exposes
 * it as serverRevisionId. A new uploaded file revision necessarily receives a
 * different blob pathname and therefore cannot silently accept old markup.
 */
export function resolveCadReviewSourceIdentity(file: {
  id: string;
  blob_pathname: string;
}): CadReviewSourceIdentity {
  const serverRevisionId = file.blob_pathname;
  return {
    serverRevisionId,
    sourceVersionKey: serverRevisionId,
    sourceSha256: createHash("sha256")
      .update(`${file.id}:${serverRevisionId}`, "utf8")
      .digest("hex"),
  };
}

export function isCadReviewServerRevisionCompatible(
  requestedRevisionId: string,
  currentRevisionId: string
): boolean {
  return requestedRevisionId === currentRevisionId;
}
