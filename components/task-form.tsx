"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHANNELS,
  Channel,
  PRIORITIES,
  Priority,
  Task,
  TASK_STATUSES,
  TaskStatus,
  ASSET_COPY_STATUSES,
  AssetStatus,
  CopyStatus,
} from "@/lib/types";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

type Props = {
  campaignId?: string;
  initial?: Task;
  onDone?: (task: Task) => void;
};

export function TaskForm({ campaignId, initial, onDone }: Props) {
  const { campaigns, addTask, updateTask } = useStore();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? today());
  const [channel, setChannel] = useState<Channel>(initial?.channel ?? "email");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "normal");
  const [assignee, setAssignee] = useState(initial?.assignee ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [chosenCampaign, setChosenCampaign] = useState(initial?.campaignId ?? campaignId ?? "");
  const [assetStatus, setAssetStatus] = useState<AssetStatus>(initial?.assetStatus ?? "na");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(initial?.copyStatus ?? "na");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [publishUrl, setPublishUrl] = useState(initial?.publishUrl ?? "");
  const [needsApproval, setNeedsApproval] = useState(initial?.needsApproval ?? false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!chosenCampaign) {
      toast.error("Pick a campaign");
      return;
    }
    const payload = {
      campaignId: chosenCampaign,
      title,
      dueDate,
      channel,
      status,
      assignee,
      notes,
      priority,
      assetStatus,
      copyStatus,
      linkUrl,
      publishUrl,
      needsApproval,
    };
    try {
      if (initial) {
        await updateTask(initial.id, payload);
        onDone?.({ ...initial, ...payload });
        toast.success("Task updated");
      } else {
        const t = await addTask(payload);
        onDone?.(t);
        toast.success("Task created");
      }
    } catch {
      // store already toasted
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {!campaignId && (
        <div className="grid gap-2">
          <Label>Campaign</Label>
          <Select value={chosenCampaign} onValueChange={setChosenCampaign}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="t-title">Title</Label>
        <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Send launch email" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="t-due">Due date</Label>
          <Input id="t-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Channel</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger>
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Asset</Label>
          <Select value={assetStatus} onValueChange={(v) => setAssetStatus(v as AssetStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_COPY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Copy</Label>
          <Select value={copyStatus} onValueChange={(v) => setCopyStatus(v as CopyStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_COPY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="t-assignee">Assigned to</Label>
        <Input id="t-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Person or tool" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="t-link">Link URL</Label>
          <Input id="t-link" type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="t-publish">Publish URL</Label>
          <Input id="t-publish" type="url" value={publishUrl} onChange={(e) => setPublishUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={needsApproval}
          onChange={(e) => setNeedsApproval(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Needs approval before publishing
      </label>

      <div className="grid gap-2">
        <Label htmlFor="t-notes">Notes</Label>
        <Textarea id="t-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button type="submit">{initial ? "Save changes" : "Add task"}</Button>
      </div>
    </form>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
