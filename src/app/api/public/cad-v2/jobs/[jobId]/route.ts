// ============================================================================
// GET /api/public/cad-v2/jobs/[jobId] — PUBLIC İŞ DURUMU SORGULAMA (G14)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 19_GEMINI_ADIM_ADIM_UYGULAMA.md (G14)

import { NextResponse } from "next/server";
import { verifyPublicShareAccess } from "@/lib/cad-v2/service/public-auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { jobId } = await params;
    const url = new URL(request.url);
    const shareToken = request.headers.get("x-share-token") || url.searchParams.get("shareToken") || "";

    const auth = await verifyPublicShareAccess(shareToken);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error || "Erişim reddedildi.", code: "ACCESS_DENIED" },
        { status: auth.statusCode || 403, headers: { "Cache-Control": "private, no-store" } }
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

    // İşin ait olduğu dosyanın bu paylaşıma dahil olduğunu doğrula
    if (auth.fileIds && !auth.fileIds.includes(job.fileId)) {
      return NextResponse.json(
        { error: "Bu işe ait dosya paylaşıma dahil değil.", code: "ACCESS_DENIED" },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
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
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
