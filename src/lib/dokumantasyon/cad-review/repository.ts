import { getDb } from "../db";
import { readLocalDb, writeLocalDb } from "../local-store";
import { hasDatabaseUrl } from "../runtime-mode";
import type { DokCadReview } from "../types";
import {
  cadReviewDocumentSchema,
  type CadReviewDocument,
  type CadReviewItem,
} from "./schema";

export class CadReviewConflictError extends Error {
  constructor(message = "Review belgesi başka bir oturum tarafından güncellenmiş (409 Conflict).") {
    super(message);
    this.name = "CadReviewConflictError";
  }
}

export class CadReviewSourceMismatchError extends Error {
  constructor(message = "Review belgesi kaynak CAD dosyasının farklı bir revizyonuna ait.") {
    super(message);
    this.name = "CadReviewSourceMismatchError";
  }
}

export class CadReviewRepository {
  /**
   * Retrieves the review document for the given file and source revision.
   * If not found, returns a blank document template for that file and revision.
   */
  static async getReviewDocument(
    fileId: string,
    sourceVersionKey: string,
    sourceSha256: string
  ): Promise<CadReviewDocument> {
    if (!hasDatabaseUrl()) {
      const db = readLocalDb();
      const existing = (db.cad_reviews || []).find(
        (r) => r.file_id === fileId && r.source_version_key === sourceVersionKey
      );

      if (existing) {
        if (existing.source_sha256 !== sourceSha256) {
          throw new CadReviewSourceMismatchError();
        }
        try {
          const parsed = JSON.parse(existing.data_json);
          return cadReviewDocumentSchema.parse({
            schemaVersion: 1,
            fileId: existing.file_id,
            sourceVersionKey: existing.source_version_key,
            sourceSha256: existing.source_sha256,
            revision: existing.revision,
            items: parsed.items || [],
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
          });
        } catch {
          // Fallback to blank if corrupt
        }
      }

      return {
        schemaVersion: 1,
        fileId,
        sourceVersionKey,
        sourceSha256,
        revision: 0,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const sql = getDb();
    const rows = await sql`
      SELECT * FROM dok_cad_reviews
      WHERE file_id = ${fileId} AND source_version_key = ${sourceVersionKey}
      LIMIT 1;
    `;

    const row = rows[0] as DokCadReview | undefined;
    if (row) {
      if (row.source_sha256 !== sourceSha256) {
        throw new CadReviewSourceMismatchError();
      }
      const dataObj = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
      return cadReviewDocumentSchema.parse({
        schemaVersion: 1,
        fileId: row.file_id,
        sourceVersionKey: row.source_version_key,
        sourceSha256: row.source_sha256,
        revision: row.revision,
        items: (dataObj as { items?: CadReviewItem[] })?.items || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return {
      schemaVersion: 1,
      fileId,
      sourceVersionKey,
      sourceSha256,
      revision: 0,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Saves the review document with optimistic concurrency check.
   */
  static async saveReviewDocument(
    fileId: string,
    sourceVersionKey: string,
    sourceSha256: string,
    expectedRevision: number,
    items: CadReviewItem[]
  ): Promise<CadReviewDocument> {
    const now = new Date().toISOString();
    const nextRevision = expectedRevision + 1;
    const dataJson = JSON.stringify({ items });

    if (!hasDatabaseUrl()) {
      const db = readLocalDb();
      if (!db.cad_reviews) {
        db.cad_reviews = [];
      }

      const existingIndex = db.cad_reviews.findIndex(
        (r) => r.file_id === fileId && r.source_version_key === sourceVersionKey
      );

      if (existingIndex !== -1) {
        const existing = db.cad_reviews[existingIndex]!;
        if (existing.source_sha256 !== sourceSha256) {
          throw new CadReviewSourceMismatchError();
        }
        if (existing.revision !== expectedRevision) {
          throw new CadReviewConflictError();
        }

        existing.revision = nextRevision;
        existing.data_json = dataJson;
        existing.updated_at = now;
        writeLocalDb(db);

        return {
          schemaVersion: 1,
          fileId,
          sourceVersionKey,
          sourceSha256,
          revision: nextRevision,
          items,
          createdAt: existing.created_at,
          updatedAt: now,
        };
      }

      if (expectedRevision !== 0) {
        throw new CadReviewConflictError();
      }

      const newRecord: DokCadReview = {
        id: crypto.randomUUID(),
        file_id: fileId,
        source_version_key: sourceVersionKey,
        source_sha256: sourceSha256,
        revision: nextRevision,
        data_json: dataJson,
        created_at: now,
        updated_at: now,
      };

      db.cad_reviews.push(newRecord);
      writeLocalDb(db);

      return {
        schemaVersion: 1,
        fileId,
        sourceVersionKey,
        sourceSha256,
        revision: nextRevision,
        items,
        createdAt: now,
        updatedAt: now,
      };
    }

    const sql = getDb();

    // Check existing
    const rows = await sql`
      SELECT * FROM dok_cad_reviews
      WHERE file_id = ${fileId} AND source_version_key = ${sourceVersionKey}
      LIMIT 1;
    `;

    const row = rows[0] as DokCadReview | undefined;
    if (row) {
      if (row.source_sha256 !== sourceSha256) {
        throw new CadReviewSourceMismatchError();
      }
      if (row.revision !== expectedRevision) {
        throw new CadReviewConflictError();
      }

      const updateResult = await sql`
        UPDATE dok_cad_reviews
        SET revision = ${nextRevision},
            data_json = ${dataJson}::jsonb,
            updated_at = ${now}
        WHERE file_id = ${fileId} AND source_version_key = ${sourceVersionKey} AND revision = ${expectedRevision}
        RETURNING *;
      `;

      if (updateResult.length === 0) {
        throw new CadReviewConflictError();
      }

      return {
        schemaVersion: 1,
        fileId,
        sourceVersionKey,
        sourceSha256,
        revision: nextRevision,
        items,
        createdAt: row.created_at,
        updatedAt: now,
      };
    }

    if (expectedRevision !== 0) {
      throw new CadReviewConflictError();
    }

    await sql`
      INSERT INTO dok_cad_reviews (
        file_id, source_version_key, source_sha256, revision, data_json, created_at, updated_at
      ) VALUES (
        ${fileId}, ${sourceVersionKey}, ${sourceSha256}, ${nextRevision}, ${dataJson}::jsonb, ${now}, ${now}
      );
    `;

    return {
      schemaVersion: 1,
      fileId,
      sourceVersionKey,
      sourceSha256,
      revision: nextRevision,
      items,
      createdAt: now,
      updatedAt: now,
    };
  }
}