import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Read once at module init so Vercel's file tracer picks it up.
const DOC = readFileSync(
  join(process.cwd(), "API_AGENTS_DOC.MD"),
  "utf8"
);

// Returns the agent manual. Markdown by default; pass `?format=json`
// to get it wrapped for clients that want structured access.
export function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("format") === "json") {
    return new Response(JSON.stringify({ doc: DOC }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  return new Response(DOC, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
