import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok, readJson } from "@/lib/api";
import { Task } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

type TaskRowPatch = Partial<{
  campaign_id: string;
  title: string;
  due_date: string;
  channel: Task["channel"];
  status: Task["status"];
  assignee: string;
  notes: string;
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
  const { error } = await supabaseAdmin.from("tasks").update(row).eq("id", id);
  if (error) return fail(error.message);
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) return fail(error.message);
  return ok({ ok: true });
}
