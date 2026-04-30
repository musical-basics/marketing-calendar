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
import { CAMPAIGN_STATUSES, Campaign, CampaignStatus } from "@/lib/types";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

type Props = {
  initial?: Campaign;
  onDone?: (campaign: Campaign) => void;
};

export function CampaignForm({ initial, onDone }: Props) {
  const { businesses, addCampaign, updateCampaign } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [businessIds, setBusinessIds] = useState<string[]>(initial?.businessIds ?? []);
  const [startDate, setStartDate] = useState(initial?.startDate ?? today());
  const [endDate, setEndDate] = useState(initial?.endDate ?? today());
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [status, setStatus] = useState<CampaignStatus>(initial?.status ?? "planned");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function toggleBusiness(id: string) {
    setBusinessIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (businessIds.length === 0) {
      toast.error("Pick at least one business");
      return;
    }
    try {
      if (initial) {
        await updateCampaign(initial.id, { name, businessIds, startDate, endDate, goal, status, notes });
        onDone?.({ ...initial, name, businessIds, startDate, endDate, goal, status, notes });
        toast.success("Campaign updated");
      } else {
        const c = await addCampaign({ name, businessIds, startDate, endDate, goal, status, notes });
        onDone?.(c);
        toast.success("Campaign created");
      }
    } catch {
      // store already toasted the error
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="c-name">Name</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring launch" />
      </div>

      <div className="grid gap-2">
        <Label>Businesses</Label>
        <div className="flex flex-wrap gap-2">
          {businesses.map((b) => {
            const active = businessIds.includes(b.id);
            return (
              <button
                type="button"
                key={b.id}
                onClick={() => toggleBusiness(b.id)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors"
                style={{
                  borderColor: active ? b.color : "hsl(var(--border))",
                  backgroundColor: active ? `${b.color}22` : "transparent",
                  color: active ? b.color : undefined,
                }}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: b.color }} />
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="c-start">Start date</Label>
          <Input id="c-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="c-end">End date</Label>
          <Input id="c-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="c-goal">Goal</Label>
        <Input id="c-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What does success look like?" />
      </div>

      <div className="grid gap-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAMPAIGN_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="c-notes">Notes</Label>
        <Textarea id="c-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button type="submit">{initial ? "Save changes" : "Create campaign"}</Button>
      </div>
    </form>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
