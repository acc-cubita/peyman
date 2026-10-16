import { suggestProducts } from "@/lib/catalog";
import { normalizeText } from "@/lib/format";

/** GET /api/search?q=… — live suggestions for the search box. */
export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (normalizeText(query).length < 2) return Response.json({ items: [], total: 0 });
  // Answers change only when the catalog does; a short browser cache saves repeat keystrokes.
  return Response.json(await suggestProducts(query), { headers: { "Cache-Control": "public, max-age=60" } });
}
