"use client";

import { Channel, CHANNELS, TaskStatus, TASK_STATUSES } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export type Filters = {
  businessId: string;
  channel: string;
  status: string;
};

export const EMPTY_FILTERS: Filters = { businessId: "all", channel: "all", status: "all" };

export function FilterBar({
  filters,
  onChange,
  showStatus = true,
  showChannel = true,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  showStatus?: boolean;
  showChannel?: boolean;
}) {
  const { businesses } = useStore();
  const dirty =
    filters.businessId !== "all" || filters.channel !== "all" || filters.status !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.businessId}
        onValueChange={(v) => onChange({ ...filters, businessId: v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Business" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All businesses</SelectItem>
          {businesses.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showChannel && (
        <Select
          value={filters.channel}
          onValueChange={(v) => onChange({ ...filters, channel: v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {CHANNELS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showStatus && (
        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {dirty && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  );
}

export function taskMatchesFilters(
  task: { channel: Channel; status: TaskStatus; campaignId: string },
  campaignBusinessIds: string[],
  filters: Filters
) {
  if (filters.channel !== "all" && task.channel !== filters.channel) return false;
  if (filters.status !== "all" && task.status !== filters.status) return false;
  if (filters.businessId !== "all" && !campaignBusinessIds.includes(filters.businessId)) return false;
  return true;
}
