import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { Campaign } from "@/lib/types";

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
  };
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .insert(row)
    .select()
    .single();
  if (error) return fail(error.message);
  return ok(rowToCampaign(data as CampaignRow), 201);
}
