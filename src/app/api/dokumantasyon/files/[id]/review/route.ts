// ============================================================================
// GET / PATCH / PUT /api/dokumantasyon/files/[id]/review — CAD REVIEW PERSISTENCE
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { getFile } from "@/lib/dokumantasyon/files";
import { cadReviewPayloadSchema } from "@/lib/dokumantasyon/cad-review/schema";
import {
  cadReviewServerPatchSchema,
  resolveCadReviewSourceIdentity,
} from "@/lib/dokumantasyon/cad-review/server-contract";
import {
  CadReviewRepository,
  CadReviewConflictError,
  CadReviewSourceMismatchError,
} from "@/lib/dokumantasyon/cad-review/repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function conflict(error: unknown) {
  if (error instanceof CadReviewConflictError || error instanceof CadReviewSourceMismatchError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  return null;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: fileId } = await params;
    const file = await getFile(fileId);
    if (!file || file.deleted_at) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }

    const identity = resolveCadReviewSourceIdentity(file);
    const document = await CadReviewRepository.getReviewDocument(
      fileId,
      identity.sourceVersionKey,
      identity.sourceSha256
    );

    return NextResponse.json({
      success: true,
      schemaVersion: 1,
      serverRevisionId: identity.serverRevisionId,
      revision: document.revision,
      items: document.items,
      document: {
        ...document,
        serverRevisionId: identity.serverRevisionId,
      },
    });
  } catch (error: unknown) {
    const response = conflict(error);
    if (response) return response;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review verisi alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id: fileId } = await params;
    const file = await getFile(fileId);
    if (!file || file.deleted_at) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = cadReviewServerPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Geçersiz review verisi." },
        { status: 400 }
      );
    }

    const identity = resolveCadReviewSourceIdentity(file);
    if (parsed.data.serverRevisionId !== identity.serverRevisionId) {
      return NextResponse.json(
        {
          error: "Kaynak CAD revizyonu değişti. Eski review katmanı yeni revizyona sessizce yazılamaz.",
          expectedServerRevisionId: identity.serverRevisionId,
        },
        { status: 409 }
      );
    }

    const document = await CadReviewRepository.saveReviewDocument(
      fileId,
      identity.sourceVersionKey,
      identity.sourceSha256,
      parsed.data.expectedRevision,
      parsed.data.items
    );

    return NextResponse.json({
      success: true,
      schemaVersion: 1,
      serverRevisionId: identity.serverRevisionId,
      revision: document.revision,
      savedAt: document.updatedAt,
      document: {
        ...document,
        serverRevisionId: identity.serverRevisionId,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const response = conflict(error);
    if (response) return response;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

/**
 * Backwards compatibility for pre-Stage-5 clients. New CAD Studio uses PATCH.
 */
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
    const parsed = cadReviewPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Geçersiz review verisi." },
        { status: 400 }
      );
    }

    const identity = resolveCadReviewSourceIdentity(file);
    if (
      parsed.data.sourceVersionKey !== identity.sourceVersionKey ||
      parsed.data.sourceSha256 !== identity.sourceSha256
    ) {
      return NextResponse.json(
        { error: "Kaynak CAD revizyonu değişti (409 Conflict)." },
        { status: 409 }
      );
    }

    const document = await CadReviewRepository.saveReviewDocument(
      fileId,
      identity.sourceVersionKey,
      identity.sourceSha256,
      parsed.data.expectedRevision,
      parsed.data.items
    );
    return NextResponse.json({ success: true, document });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const response = conflict(error);
    if (response) return response;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
