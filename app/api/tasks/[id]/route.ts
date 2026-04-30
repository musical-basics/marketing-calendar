import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { AssetStatus, CopyStatus, Priority, Task } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

type TaskRowPatch = Partial<{
  campaign_id: string;
  title: string;
  due_date: string;
  channel: Task["channel"];
  status: Task["status"];
  assignee: string;
  notes: string;
  priority: Priority;
  asset_status: AssetStatus;
  copy_status: CopyStatus;
  link_url: string;
  publish_url: string;
  needs_approval: boolean;
}>;

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  let patch: Partial<Task>;
  try {
    patch = await readJson<Partial<Task>>(req);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
  const row: TaskRowPatch = {};
  if (patch.campaignId !== undefined) row.campaign_id = patch.campaignId;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.channel !== undefined) row.channel = patch.channel;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.assignee !== undefined) row.assignee = patch.assignee;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.assetStatus !== undefined) row.asset_status = patch.assetStatus;
  if (patch.copyStatus !== undefined) row.copy_status = patch.copyStatus;
  if (patch.linkUrl !== undefined) row.link_url = patch.linkUrl;
  if (patch.publishUrl !== undefined) row.publish_url = patch.publishUrl;
  if (patch.needsApproval !== undefined) row.needs_approval = patch.needsApproval;
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .update(row)
    .eq("id", id)
    .select("id");
  if (error) return fail(error.message);
  if (!data || data.length === 0) return fail(`No task with id ${id}`, 404);
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return fail(error.message);
  if (!data || data.length === 0) return fail(`No task with id ${id}`, 404);
  return ok({ ok: true });
}
