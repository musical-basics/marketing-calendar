import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { Campaign, Priority } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

type CampaignRowPatch = Partial<{
  name: string;
  business_ids: string[];
  start_date: string;
  end_date: string;
  goal: string;
  status: Campaign["status"];
  notes: string;
  priority: Priority;
  audience: string;
  offer: string;
  primary_cta_url: string;
  success_metric: string;
  metric_target: number | null;
  metric_current: number | null;
  next_action: string;
  blocked_reason: string;
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
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.audience !== undefined) row.audience = patch.audience;
  if (patch.offer !== undefined) row.offer = patch.offer;
  if (patch.primaryCtaUrl !== undefined) row.primary_cta_url = patch.primaryCtaUrl;
  if (patch.successMetric !== undefined) row.success_metric = patch.successMetric;
  if (patch.metricTarget !== undefined) row.metric_target = patch.metricTarget;
  if (patch.metricCurrent !== undefined) row.metric_current = patch.metricCurrent;
  if (patch.nextAction !== undefined) row.next_action = patch.nextAction;
  if (patch.blockedReason !== undefined) row.blocked_reason = patch.blockedReason;
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .update(row)
    .eq("id", id)
    .select("id");
  if (error) return fail(error.message);
  if (!data || data.length === 0) return fail(`No campaign with id ${id}`, 404);
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return fail(error.message);
  if (!data || data.length === 0) return fail(`No campaign with id ${id}`, 404);
  return ok({ ok: true });
}
