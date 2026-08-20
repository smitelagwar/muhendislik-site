// ============================================================================
// GET & POST /api/dokumantasyon/shares — PAYLAŞIM LİNKİ LİSTELEME VE OLUŞTURMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { createShareSchema } from "@/lib/dokumantasyon/validation";
import { createShareLink, getAdminShareLinks } from "@/lib/dokumantasyon/shares";
import { buildPublicShareUrl, PublicSiteOriginError } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDokumantasyonAdmin();

    const links = (await getAdminShareLinks()).map((link) => ({
      ...link,
      shareUrl: link.decrypted_token ? buildPublicShareUrl(link.decrypted_token) : null,
    }));

    return NextResponse.json(
      { links },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    if (err instanceof PublicSiteOriginError) {
      return NextResponse.json(
        { error: "Paylaşım bağlantısı yapılandırması hazır değil." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    console.error("Paylaşım linkleri listeleme hatası:", err);
    return NextResponse.json(
      { error: "Paylaşım linkleri listelenirken bir hata oluştu." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const parseResult = createShareSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz paylaşım parametreleri." },
        { status: 400 }
      );
    }

    const result = await createShareLink(parseResult.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    if (err instanceof PublicSiteOriginError) {
      console.error("Paylaşım origin yapılandırması hatası:", err.message);
      return NextResponse.json(
        { error: "Paylaşım bağlantısı yapılandırması hazır değil." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    const message = err instanceof Error ? err.message : "Paylaşım linki oluşturulamadı.";
    console.error("Link oluşturma hatası:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
