import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TEMPLATE_MAP: Record<string, string> = {
  "beton-dokum": "public/belgeler/beton-dokum-tutanagi.pdf",
  "beton-dokum-tutanagi": "public/belgeler/beton-dokum-tutanagi.pdf",
  "santiye-sefi-taahhutnamesi": "public/belgeler/santiye-sefi-taahhutnamesi.pdf",
  "taahhutname": "public/belgeler/santiye-sefi-taahhutnamesi.pdf",
  "santiye-sefi-istifa-dilekcesi": "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
  "santiye-sefi-istifa": "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
  "istifa": "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
  "insaat-ruhsati-dilekcesi": "public/belgeler/insaat-ruhsati-dilekcesi.pdf",
  "insaat-ruhsati": "public/belgeler/insaat-ruhsati-dilekcesi.pdf",
  "santiye-sefi-sozlesmesi": "public/belgeler/santiye-sefi-sozlesmesi.pdf",
  "sozlesme": "public/belgeler/santiye-sefi-sozlesmesi.pdf",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const relativePath = Object.hasOwn(TEMPLATE_MAP, id) ? TEMPLATE_MAP[id] : undefined;

    if (!relativePath) {
      return new NextResponse("Template not found", { status: 404 });
    }

    const filePath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(filePath)) {
      const publicPath = `/${relativePath.replace(/^public\//, "")}`;
      return NextResponse.redirect(new URL(publicPath, request.url), 307);
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Return as application/octet-stream so download managers (IDM etc.) do NOT intercept it as a browser PDF
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error serving document template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
