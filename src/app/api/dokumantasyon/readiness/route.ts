// ============================================================================
// GET /api/dokumantasyon/readiness — SİSTEM VE KALICILIK SAĞLIK RAPORU (READINESS)
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { isVercelDeployment, isExplicitLocalDokMode } from "@/lib/dokumantasyon/runtime-mode";
import { getDb } from "@/lib/dokumantasyon/db";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDokumantasyonAdmin();

    const isVercel = isVercelDeployment();
    const isLocalAllowed = isExplicitLocalDokMode();
    const envName = isVercel ? "production" : (process.env.NODE_ENV || "development");

    // 1. Veritabanı Kontrolleri
    const dbStatus = {
      configured: Boolean(process.env.DATABASE_URL),
      reachable: false,
      schemaReady: false,
    };

    if (dbStatus.configured) {
      try {
        const sql = getDb();
        await sql`SELECT 1 as test;`;
        dbStatus.reachable = true;

        const tableCheck = await sql`
          SELECT COUNT(*) as count FROM dok_files;
        `;
        if (tableCheck && tableCheck.length > 0) {
          dbStatus.schemaReady = true;
        }
      } catch (err) {
        dbStatus.reachable = false;
        dbStatus.schemaReady = false;
      }
    }

    // 2. Vercel Blob Kontrolleri
    const blobStatus = {
      configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      reachable: false,
      private: true,
    };

    if (blobStatus.configured) {
      try {
        await list({ prefix: "dok_storage/", limit: 1 });
        blobStatus.reachable = true;
      } catch (err) {
        blobStatus.reachable = false;
      }
    }

    // 3. Mod ve Sağlık Durumu Belirleme
    let storageMode: "durable" | "local_dev" | "blocked" = "blocked";
    if (dbStatus.configured && dbStatus.reachable && dbStatus.schemaReady && blobStatus.configured && blobStatus.reachable) {
      storageMode = "durable";
    } else if (isLocalAllowed) {
      storageMode = "local_dev";
    } else {
      storageMode = "blocked";
    }

    const isOk = storageMode === "durable" || storageMode === "local_dev";

    return NextResponse.json(
      {
        ok: isOk,
        environment: envName,
        storageMode,
        database: dbStatus,
        blob: blobStatus,
        localFallbackAllowed: isLocalAllowed,
        timestamp: new Date().toISOString(),
      },
      {
        status: isOk ? 200 : 503,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Sistem durumu denetlenirken bir hata oluştu.",
        storageMode: "blocked",
      },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
