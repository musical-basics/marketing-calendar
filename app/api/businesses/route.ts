import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { Business } from "@/lib/types";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .order("name");
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function POST(req: Request) {
  let body: Business;
  try {
    body = await readJson<Business>(req);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
  if (!body.id || !body.name || !body.color) {
    return fail("id, name, and color are required", 400);
  }
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .insert({ id: body.id, name: body.name, color: body.color })
    .select()
    .single();
  if (error) return fail(error.message);
  return ok(data, 201);
}
