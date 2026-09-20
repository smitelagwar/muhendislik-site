// ============================================================================
// GET /api/dokumantasyon/cad-v2/jobs/[jobId] — İŞ DURUMU SORGULAMA (G11)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
// Gereksinimler: R18, R20

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json(
        { error: "Geçersiz iş kimliği.", code: "INVALID_JOB_ID" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const service = CadV2DurableService.getInstance();
    const job = service.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "İş bulunamadı.", code: "JOB_NOT_FOUND" },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(
      {
        jobId: job.jobId,
        status: job.status,
        phase: job.phase,
        progress: job.progress ?? null,
        sceneId: job.sceneId ?? null,
        error: job.error ?? null,
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
