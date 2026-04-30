import { supabaseAdmin } from "@/lib/supabaseServer";
import { fail, ok } from "@/lib/api";
import { LIONEL_TEMPLATES } from "@/lib/templates";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function isoDateOffset(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Idempotent: skips templates whose name already exists.
export async function POST() {
  const { data: existing, error: readErr } = await supabaseAdmin
    .from("campaigns")
    .select("name");
  if (readErr) return fail(readErr.message);
  const existingNames = new Set((existing ?? []).map((c: { name: string }) => c.name));

  const created: { campaigns: string[]; tasks: number; skipped: string[] } = {
    campaigns: [],
    tasks: 0,
    skipped: [],
  };

  for (const tpl of LIONEL_TEMPLATES) {
    if (existingNames.has(tpl.name)) {
      created.skipped.push(tpl.name);
      continue;
    }
    const campaignId = uid();
    const now = new Date().toISOString();
    const { error: campErr } = await supabaseAdmin.from("campaigns").insert({
      id: campaignId,
      name: tpl.name,
      business_ids: tpl.businessIds,
      start_date: isoDateOffset(tpl.startOffsetDays),
      end_date: isoDateOffset(tpl.endOffsetDays),
      goal: tpl.goal,
      status: tpl.status,
      notes: "",
      created_at: now,
      priority: tpl.priority,
      audience: tpl.audience,
      offer: tpl.offer,
      primary_cta_url: "",
      success_metric: tpl.successMetric,
      metric_target: tpl.metricTarget,
      metric_current: 0,
      next_action: tpl.nextAction,
      blocked_reason: "",
    });
    if (campErr) return fail(`Insert campaign "${tpl.name}": ${campErr.message}`);

    if (tpl.tasks.length > 0) {
      const taskRows = tpl.tasks.map((t) => ({
        id: uid(),
        campaign_id: campaignId,
        title: t.title,
        due_date: isoDateOffset(t.dueOffsetDays),
        channel: t.channel,
        status: "todo" as const,
        assignee: t.assignee,
        notes: t.notes,
        created_at: now,
        priority: t.priority,
        asset_status: "na" as const,
        copy_status: "na" as const,
        link_url: "",
        publish_url: "",
        needs_approval: false,
      }));
      const { error: taskErr } = await supabaseAdmin.from("tasks").insert(taskRows);
      if (taskErr) return fail(`Insert tasks for "${tpl.name}": ${taskErr.message}`);
      created.tasks += taskRows.length;
    }
    created.campaigns.push(tpl.name);
  }

  return ok(created, 201);
}
