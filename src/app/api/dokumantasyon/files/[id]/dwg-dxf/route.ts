import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getFile } from "@/lib/dokumantasyon/files";
import {
  findReadyDwgDxfDerivativeForFile,
  readReadyDwgDxfDerivativeBytes,
} from "@/lib/dokumantasyon/dwg/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function convertedName(displayName: string): string {
  return displayName.replace(/\.dwg$/iu, "") + ".dxf";
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    const { id } = await params;
    const file = await getFile(id);

    if (!file || file.deleted_at) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }
    if (file.extension.toLowerCase() !== ".dwg") {
      return NextResponse.json({ error: "Bu endpoint yalnızca DWG dosyaları içindir." }, { status: 400 });
    }

    const derivative = await findReadyDwgDxfDerivativeForFile(file);
    if (!derivative) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Cache-Control": "private, no-store",
          "X-DWG-DXF-Cache": "MISS",
        },
      });
    }

    const bytes = await readReadyDwgDxfDerivativeBytes(derivative);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/dxf",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename="${encodeURIComponent(convertedName(file.display_name))}"`,
        "Cache-Control": "private, no-store",
        "X-DWG-DXF-Cache": "HIT",
        "X-DWG-DXF-Decision": derivative.validation_decision || "PASS",
        "X-DWG-DXF-Sha256": derivative.dxf_sha256 || "",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("DWG→DXF derivative erişim hatası:", error);
    return NextResponse.json(
      { error: "Doğrulanmış DXF türevi okunamadı." },
      { status: 500 }
    );
  }
}
