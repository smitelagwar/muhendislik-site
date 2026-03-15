import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isVercelProduction } from "@/lib/site-config";

export const runtime = "nodejs";

const dataFilePath = path.join(process.cwd(), "src/lib/data.json");

function readArticlesFile() {
  const fileContent = fs.readFileSync(dataFilePath, "utf8");
  return JSON.parse(fileContent) as Record<string, unknown>;
}

function writeArticlesFile(articles: Record<string, unknown>) {
  fs.writeFileSync(dataFilePath, JSON.stringify(articles, null, 2), "utf8");
}

function mutationDisabledResponse() {
  return NextResponse.json(
    {
      error: "Content mutations are disabled in Vercel production. Update src/lib/data.json and redeploy.",
    },
    { status: 403 },
  );
}

export async function GET() {
  try {
    return NextResponse.json(readArticlesFile());
  } catch (error) {
    console.error("GET Error reading articles data:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (isVercelProduction()) {
    return mutationDisabledResponse();
  }

  try {
    const newArticle = await request.json();

    if (!newArticle.slug || !newArticle.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const articles = readArticlesFile();
    articles[newArticle.slug] = newArticle;
    writeArticlesFile(articles);

    return NextResponse.json({ success: true, article: newArticle });
  } catch (error) {
    console.error("POST Error writing articles data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (isVercelProduction()) {
    return mutationDisabledResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const articles = readArticlesFile();

    if (articles[slug]) {
      delete articles[slug];
      writeArticlesFile(articles);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error writing articles data:", error);
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
