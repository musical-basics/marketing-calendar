import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { Campaign } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

type CampaignRowPatch = Partial<{
  name: string;
  business_ids: string[];
  start_date: string;
  end_date: string;
  goal: string;
  status: Campaign["status"];
  notes: string;
}>;

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  let patch: Partial<Campaign>;
  try {
    patch = await readJson<Partial<Campaign>>(req);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
  const row: CampaignRowPatch = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.businessIds !== undefined) row.business_ids = patch.businessIds;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.endDate !== undefined) row.end_date = patch.endDate;
  if (patch.goal !== undefined) row.goal = patch.goal;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  const { error } = await supabaseAdmin.from("campaigns").update(row).eq("id", id);
  if (error) return fail(error.message);
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", id);
  if (error) return fail(error.message);
  return ok({ ok: true });
}
