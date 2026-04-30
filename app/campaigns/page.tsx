"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CampaignForm } from "@/components/campaign-form";
import { FilterBar, EMPTY_FILTERS, Filters } from "@/components/filter-bar";
import { CAMPAIGN_STATUSES, CampaignStatus } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";

const STATUS_TONE: Record<CampaignStatus, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  planned: "secondary",
  paused: "outline",
  done: "outline",
};

export default function CampaignsPage() {
  const { campaigns, tasks, businesses, ready } = useStore();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const businessById = useMemo(
    () => Object.fromEntries(businesses.map((b) => [b.id, b])),
    [businesses]
  );

  const visible = useMemo(() => {
    return campaigns
      .filter((c) => {
        if (filters.businessId !== "all" && !c.businessIds.includes(filters.businessId)) return false;
        return true;
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [campaigns, filters]);

  if (!ready) return null;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">{campaigns.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        showChannel={false}
        showStatus={false}
      />

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No campaigns yet. Create your first one to start planning.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((c) => {
            const taskCount = tasks.filter((t) => t.campaignId === c.id).length;
            const open = tasks.filter((t) => t.campaignId === c.id && t.status !== "done").length;
            const statusLabel = CAMPAIGN_STATUSES.find((s) => s.value === c.status)?.label;
            return (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        <Badge variant={STATUS_TONE[c.status]}>{statusLabel}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {format(parseISO(c.startDate), "MMM d, yyyy")} – {format(parseISO(c.endDate), "MMM d, yyyy")}
                        </span>
                        <span>·</span>
                        <span>{open}/{taskCount} tasks open</span>
                      </div>
                      {c.goal && <p className="mt-1 text-sm text-muted-foreground">{c.goal}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.businessIds.map((bid) => {
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
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
