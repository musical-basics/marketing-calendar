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
    .select()
    .single();
  if (error) return fail(error.message);
  return ok(data);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("businesses").delete().eq("id", id);
  if (error) return fail(error.message);
  return ok({ ok: true });
}
