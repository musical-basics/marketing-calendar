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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAMPAIGN_STATUSES, CHANNELS, Task, TASK_STATUSES, TaskStatus } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { campaigns, tasks, businesses, ready, deleteCampaign, updateTask, deleteTask } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const campaign = campaigns.find((c) => c.id === id);
  const campaignTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.campaignId === id)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
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

      {(campaign.goal || campaign.notes) && (
        <Card>
          <CardContent className="grid gap-3 pt-6 text-sm">
            {campaign.goal && (
              <div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Goal
                </div>
                <p>{campaign.goal}</p>
              </div>
            )}
            {campaign.notes && (
              <div>
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
                      <div className="font-medium">{t.title}</div>
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
