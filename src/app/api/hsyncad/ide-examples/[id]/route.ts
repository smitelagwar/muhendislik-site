import { IDE_EXAMPLES, ideExampleUrl } from "@/lib/hsyncad/ide-examples";

/** Compatibility URL: public static copies also work on production deployments. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = IDE_EXAMPLES.find(item => item.id === id);
  if (!sample) return new Response(null, { status: 404 });
  return Response.redirect(new URL(ideExampleUrl(sample.id), request.url), 307);
}
