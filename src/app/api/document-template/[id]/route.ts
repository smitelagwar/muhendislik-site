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
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const relativePath = TEMPLATE_MAP[id];

    if (!relativePath) {
      return new NextResponse("Template not found", { status: 404 });
    }

    const filePath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found on disk", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Return as application/octet-stream so download managers (IDM etc.) do NOT intercept it as a browser PDF
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving document template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
