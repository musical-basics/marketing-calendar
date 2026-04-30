import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { AssetStatus, CopyStatus, Priority, Task } from "@/lib/types";

type TaskRow = {
  id: string;
  campaign_id: string;
  title: string;
  due_date: string;
  channel: Task["channel"];
  status: Task["status"];
  assignee: string;
  notes: string;
  created_at: string;
  priority: Priority;
  asset_status: AssetStatus;
  copy_status: CopyStatus;
  link_url: string;
  publish_url: string;
  needs_approval: boolean;
};

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    title: r.title,
    dueDate: r.due_date,
    channel: r.channel,
    status: r.status,
    assignee: r.assignee,
    notes: r.notes,
    createdAt: r.created_at,
    priority: r.priority,
    assetStatus: r.asset_status,
    copyStatus: r.copy_status,
    linkUrl: r.link_url,
    publishUrl: r.publish_url,
    needsApproval: r.needs_approval,
  };
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .order("due_date");
  if (error) return fail(error.message);
  return ok((data ?? []).map((r) => rowToTask(r as TaskRow)));
}

export async function POST(req: Request) {
  let body: Task;
  try {
    body = await readJson<Task>(req);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
  if (!body.id || !body.campaignId || !body.title || !body.dueDate) {
    return fail("id, campaignId, title, and dueDate are required", 400);
  }
  const row: TaskRow = {
    id: body.id,
    campaign_id: body.campaignId,
    title: body.title,
    due_date: body.dueDate,
    channel: body.channel,
    status: body.status,
    assignee: body.assignee ?? "",
    notes: body.notes ?? "",
    created_at: body.createdAt ?? new Date().toISOString(),
    priority: body.priority ?? "normal",
    asset_status: body.assetStatus ?? "na",
    copy_status: body.copyStatus ?? "na",
    link_url: body.linkUrl ?? "",
    publish_url: body.publishUrl ?? "",
    needs_approval: body.needsApproval ?? false,
  };
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert(row)
    .select()
    .single();
  if (error) return fail(error.message);
  return ok(rowToTask(data as TaskRow), 201);
}
