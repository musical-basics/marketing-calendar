import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { Campaign, Priority } from "@/lib/types";

type CampaignRow = {
  id: string;
  name: string;
  business_ids: string[];
  start_date: string;
  end_date: string;
  goal: string;
  status: Campaign["status"];
  notes: string;
  created_at: string;
  priority: Priority;
  audience: string;
  offer: string;
  primary_cta_url: string;
  success_metric: string;
  metric_target: number | null;
  metric_current: number | null;
  next_action: string;
  blocked_reason: string;
};

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    name: r.name,
    businessIds: r.business_ids,
    startDate: r.start_date,
    endDate: r.end_date,
    goal: r.goal,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    priority: r.priority,
    audience: r.audience,
    offer: r.offer,
    primaryCtaUrl: r.primary_cta_url,
    successMetric: r.success_metric,
    metricTarget: r.metric_target,
    metricCurrent: r.metric_current,
    nextAction: r.next_action,
    blockedReason: r.blocked_reason,
  };
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) return fail(error.message);
  return ok((data ?? []).map((r) => rowToCampaign(r as CampaignRow)));
}

export async function POST(req: Request) {
  let body: Campaign;
  try {
    body = await readJson<Campaign>(req);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
  if (!body.id || !body.name || !body.startDate || !body.endDate) {
    return fail("id, name, startDate, and endDate are required", 400);
  }
  const row: CampaignRow = {
    id: body.id,
    name: body.name,
    business_ids: body.businessIds ?? [],
    start_date: body.startDate,
    end_date: body.endDate,
    goal: body.goal ?? "",
    status: body.status ?? "planned",
    notes: body.notes ?? "",
    created_at: body.createdAt ?? new Date().toISOString(),
    priority: body.priority ?? "normal",
    audience: body.audience ?? "",
    offer: body.offer ?? "",
    primary_cta_url: body.primaryCtaUrl ?? "",
    success_metric: body.successMetric ?? "",
    metric_target: body.metricTarget ?? null,
    metric_current: body.metricCurrent ?? null,
    next_action: body.nextAction ?? "",
    blocked_reason: body.blockedReason ?? "",
  };
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .insert(row)
    .select()
    .single();
  if (error) return fail(error.message);
  return ok(rowToCampaign(data as CampaignRow), 201);
}
