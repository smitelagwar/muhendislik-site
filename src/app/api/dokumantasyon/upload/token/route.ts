// ============================================================================
// POST /api/dokumantasyon/upload/token — OIDC PRESIGNED UPLOAD KONTROL DÜZLEMİ
// ============================================================================

import { NextResponse } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { DOKUMANTASYON_CONFIG } from "@/lib/dokumantasyon/config";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { getBlobCommandOptions, hasBlobAccessConfiguration } from "@/lib/dokumantasyon/runtime-mode";
import { verifyUploadIntentToken } from "@/lib/dokumantasyon/upload-intent";
import { finalizePresignedUpload } from "@/lib/dokumantasyon/upload-completion";

interface ClientPayload {
  intentToken?: string;
}

function parseClientPayload(value: string | null): ClientPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ClientPayload;
    return typeof parsed.intentToken === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadPresignedBody;
    const isCallback = body?.type === "blob.upload-completed";

    // Callback'lar oturumla değil SDK'nın BLOB_WEBHOOK_PUBLIC_KEY doğrulamasıyla korunur.
    // Presigned URL üretimi ise hâlâ admin oturumu + same-origin gerektirir.
    if (!isCallback) {
      await requireDokumantasyonAdmin();
      assertSameOriginForMutation(request);
    }

    if (!hasBlobAccessConfiguration()) {
      return NextResponse.json({ error: "Dökümantasyon kalıcı dosya depolama yapılandırılmamış.", code: "BLOB_NOT_CONFIGURED" }, { status: 503 });
    }
    if (!process.env.BLOB_WEBHOOK_PUBLIC_KEY) {
      return NextResponse.json({ error: "Blob upload callback doğrulaması yapılandırılmamış.", code: "BLOB_WEBHOOK_KEY_MISSING" }, { status: 503 });
    }

    const result = await handleUploadPresigned({
      request,
      body,
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY,
      getSignedToken: async (pathname, clientPayload) => {
        const parsed = parseClientPayload(clientPayload);
        const intent = parsed?.intentToken ? await verifyUploadIntentToken(parsed.intentToken) : null;
        if (!intent || intent.pathname !== pathname) {
          throw new Error("Geçersiz veya uyuşmayan upload intent.");
        }

        const extension = pathname.split(".").pop()?.toLowerCase() || "";
        const expectedMime = DOKUMANTASYON_CONFIG.MIME_TYPE_MAP[extension] || "application/octet-stream";
        const signedToken = await issueSignedToken({
          // Vercel Production OIDC'inde bu seçenek BLOB_STORE_ID taşır; token kullanılmaz.
          ...getBlobCommandOptions(),
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 30 * 60 * 1000,
          maximumSizeInBytes: intent.sizeBytes,
          allowedContentTypes: [expectedMime],
        });

        return {
          token: signedToken,
          urlOptions: {
            validUntil: signedToken.validUntil,
            maximumSizeInBytes: intent.sizeBytes,
            allowedContentTypes: [expectedMime],
            tokenPayload: JSON.stringify({ intentToken: parsed!.intentToken }),
          },
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const parsed = parseClientPayload(tokenPayload || null);
        const intent = parsed?.intentToken ? await verifyUploadIntentToken(parsed.intentToken) : null;
        if (!intent || blob.pathname !== intent.pathname) {
          throw new Error("Blob callback upload intent ile uyuşmuyor.");
        }
        await finalizePresignedUpload({ blob, intentToken: parsed!.intentToken! });
      },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Presigned upload kontrol düzlemi hatası:", err instanceof Error ? err.message : "bilinmeyen hata");
    return NextResponse.json({ error: "Yükleme yetkilendirilemedi veya doğrulanamadı." }, { status: 500 });
  }
}
