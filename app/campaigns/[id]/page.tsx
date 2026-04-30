"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CampaignForm } from "@/components/campaign-form";
import { TaskForm } from "@/components/task-form";
import { InlineText } from "@/components/inline-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAMPAIGN_STATUSES,
  CHANNELS,
  PRIORITIES,
  Priority,
  PRIORITY_WEIGHT,
  Task,
  TASK_STATUSES,
  TaskStatus,
} from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRIORITY_TONE: Record<Priority, string> = {
  urgent: "bg-red-500/15 text-red-600 border-red-500/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  normal: "bg-muted text-muted-foreground border-border",
  low: "bg-muted text-muted-foreground border-border",
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { campaigns, tasks, businesses, ready, deleteCampaign, updateCampaign, updateTask, deleteTask } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const campaign = campaigns.find((c) => c.id === id);
  const campaignTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.campaignId === id)
        .sort((a, b) => {
          const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
          return pw !== 0 ? pw : a.dueDate.localeCompare(b.dueDate);
        }),
    [tasks, id]
  );
  const businessById = useMemo(
    () => Object.fromEntries(businesses.map((b) => [b.id, b])),
    [businesses]
  );

  if (!ready) return null;
  if (!campaign) {
    return (
      <div className="grid gap-4">
        <Link href="/campaigns" className="text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="inline h-3 w-3" /> Campaigns
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Campaign not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = CAMPAIGN_STATUSES.find((s) => s.value === campaign.status)?.label;
  const priorityLabel = PRIORITIES.find((p) => p.value === campaign.priority)?.label;

  function onDeleteCampaign() {
    if (!confirm(`Delete "${campaign!.name}" and all its tasks?`)) return;
    deleteCampaign(campaign!.id);
    toast.success("Campaign deleted");
    router.push("/campaigns");
  }

  function onDeleteTask(t: Task) {
    if (!confirm(`Delete "${t.title}"?`)) return;
    deleteTask(t.id);
    toast.success("Task deleted");
  }

  const metricPct =
    campaign.metricTarget && campaign.metricTarget > 0 && campaign.metricCurrent != null
      ? Math.min(100, Math.round((campaign.metricCurrent / campaign.metricTarget) * 100))
      : null;

  return (
    <div className="grid gap-6">
      <Link href="/campaigns" className="text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="inline h-3 w-3" /> Campaigns
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
            <Badge>{statusLabel}</Badge>
            {campaign.priority !== "normal" && (
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", PRIORITY_TONE[campaign.priority])}>
                {priorityLabel}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {format(parseISO(campaign.startDate), "MMM d, yyyy")} –{" "}
              {format(parseISO(campaign.endDate), "MMM d, yyyy")}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {campaign.businessIds.map((bid) => {
              const b = businessById[bid];
              if (!b) return null;
              return (
                <span
                  key={bid}
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ background: `${b.color}22`, color: b.color }}
                >
                  {b.name}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit campaign</DialogTitle>
              </DialogHeader>
              <CampaignForm initial={campaign} onDone={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={onDeleteCampaign}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Next action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InlineText
              value={campaign.nextAction}
              onCommit={(v) => updateCampaign(campaign.id, { nextAction: v })}
              placeholder="What's the very next thing to do?"
              multiline
            />
            {campaign.blockedReason && (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive">
                  Blocked
                </div>
                <InlineText
                  value={campaign.blockedReason}
                  onCommit={(v) => updateCampaign(campaign.id, { blockedReason: v })}
                  placeholder="Blocker reason"
                  multiline
                />
              </div>
            )}
            {!campaign.blockedReason && (
              <button
                onClick={() => updateCampaign(campaign.id, { blockedReason: "Blocked because…" })}
                className="mt-3 text-xs text-muted-foreground hover:text-destructive"
              >
                + Mark blocked
              </button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              {campaign.successMetric || "Success metric"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!campaign.successMetric && !campaign.metricTarget ? (
              <p className="text-sm text-muted-foreground italic">
                Set a metric and target via Edit to track progress.
              </p>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <InlineText
                    value={campaign.metricCurrent != null ? String(campaign.metricCurrent) : ""}
                    onCommit={(v) => {
                      const n = v.trim() === "" ? null : Number(v);
                      if (v.trim() !== "" && Number.isNaN(n!)) {
                        toast.error("Must be a number");
                        return;
                      }
                      updateCampaign(campaign.id, { metricCurrent: n });
                    }}
                    placeholder="0"
                    className="!text-3xl !font-semibold"
                  />
                  {campaign.metricTarget != null && (
                    <span className="text-lg text-muted-foreground">/ {campaign.metricTarget}</span>
                  )}
                </div>
                {metricPct != null && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${metricPct}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(campaign.goal || campaign.audience || campaign.offer || campaign.primaryCtaUrl || campaign.notes) && (
        <Card>
          <CardContent className="grid gap-4 pt-6 text-sm md:grid-cols-2">
            {campaign.goal && <Field label="Goal" value={campaign.goal} />}
            {campaign.audience && <Field label="Audience" value={campaign.audience} />}
            {campaign.offer && <Field label="Offer" value={campaign.offer} />}
            {campaign.primaryCtaUrl && (
              <div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Primary CTA
                </div>
                <a
                  href={campaign.primaryCtaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {campaign.primaryCtaUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {campaign.notes && (
              <div className="md:col-span-2">
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Notes
                </div>
                <p className="whitespace-pre-wrap">{campaign.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Tasks ({campaignTasks.length})</CardTitle>
          <Dialog open={taskOpen} onOpenChange={(v) => { setTaskOpen(v); if (!v) setEditingTask(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingTask(null)}>
                <Plus className="h-4 w-4" /> Add task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit task" : "New task"}</DialogTitle>
              </DialogHeader>
              <TaskForm
                campaignId={campaign.id}
                initial={editingTask ?? undefined}
                onDone={() => { setTaskOpen(false); setEditingTask(null); }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campaignTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tasks yet. Add the first one.
            </div>
          ) : (
            <ul className="divide-y">
              {campaignTasks.map((t) => {
                const channel = CHANNELS.find((c) => c.value === t.channel)?.label;
                return (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{t.title}</span>
                        {t.priority !== "normal" && (
                          <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase", PRIORITY_TONE[t.priority])}>
                            {t.priority}
                          </span>
                        )}
                        {t.needsApproval && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-600">
                            Needs approval
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(parseISO(t.dueDate), "EEE MMM d, yyyy")}</span>
                        <span>·</span>
                        <span>{channel}</span>
                        {t.assignee && (
                          <>
                            <span>·</span>
                            <span>{t.assignee}</span>
                          </>
                        )}
                        {t.publishUrl && (
                          <>
                            <span>·</span>
                            <a href={t.publishUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                              published <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                      {t.notes && <p className="mt-1 text-sm text-muted-foreground">{t.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={t.status}
                        onValueChange={(v) => updateTask(t.id, { status: v as TaskStatus })}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingTask(t); setTaskOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDeleteTask(t)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p>{value}</p>
    </div>
  );
}
