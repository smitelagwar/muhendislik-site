// ============================================================================
// GET & PUT /api/dokumantasyon/files/[id]/review — CAD REVIEW PERSISTENCE API
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { getFile } from "@/lib/dokumantasyon/files";
import {
  cadReviewPayloadSchema,
} from "@/lib/dokumantasyon/cad-review/schema";
import {
  CadReviewRepository,
  CadReviewConflictError,
  CadReviewSourceMismatchError,
} from "@/lib/dokumantasyon/cad-review/repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: fileId } = await params;
    const file = await getFile(fileId);
    if (!file || file.deleted_at) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sourceVersionKey = searchParams.get("sourceVersionKey") || file.blob_pathname;
    const sourceSha256 = searchParams.get("sourceSha256") || "";

    if (!sourceSha256) {
      return NextResponse.json(
        { error: "sourceSha256 parametresi zorunludur." },
        { status: 400 }
      );
    }

    const doc = await CadReviewRepository.getReviewDocument(
      fileId,
      sourceVersionKey,
      sourceSha256
    );

    return NextResponse.json({ success: true, document: doc });
  } catch (err: unknown) {
    if (err instanceof CadReviewSourceMismatchError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Review verisi alınırken bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id: fileId } = await params;
    const file = await getFile(fileId);
    if (!file || file.deleted_at) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = cadReviewPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz review verisi." },
        { status: 400 }
      );
    }

    const { sourceVersionKey, sourceSha256, expectedRevision, items } = parseResult.data;

    const savedDoc = await CadReviewRepository.saveReviewDocument(
      fileId,
      sourceVersionKey,
      sourceSha256,
      expectedRevision,
      items
    );

    return NextResponse.json({ success: true, document: savedDoc });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    if (err instanceof CadReviewConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof CadReviewSourceMismatchError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Review kaydedilirken bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}