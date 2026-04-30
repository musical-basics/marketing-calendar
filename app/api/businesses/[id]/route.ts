import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { Business } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  let patch: Partial<Business>;
  try {
    patch = await readJson<Partial<Business>>(req);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
  const allowed: Partial<Business> = {};
  if (patch.name !== undefined) allowed.name = patch.name;
  if (patch.color !== undefined) allowed.color = patch.color;
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .update(allowed)
    .eq("id", id)
    .select();
  if (error) return fail(error.message);
  if (!data || data.length === 0) return fail(`No business with id ${id}`, 404);
  return ok(data[0]);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return fail(error.message);
  if (!data || data.length === 0) return fail(`No business with id ${id}`, 404);
  return ok({ ok: true });
}
