"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CampaignForm } from "@/components/campaign-form";
import { TaskForm } from "@/components/task-form";
import { Campaign, CHANNELS, PRIORITY_WEIGHT } from "@/lib/types";
import {
  differenceInCalendarDays,
  format,
  isBefore,
  parseISO,
  startOfToday,
} from "date-fns";
import { AlertTriangle, ArrowRight, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const HIGHLIGHT_BUSINESS_IDS = ["dreamplay-pianos", "belgium-concert"];

export default function DashboardPage() {
  const { campaigns, tasks, businesses, ready } = useStore();
  const [openCampaign, setOpenCampaign] = useState(false);
  const [openTask, setOpenTask] = useState(false);

  const businessById = useMemo(
    () => Object.fromEntries(businesses.map((b) => [b.id, b])),
    [businesses]
  );
  const campaignById = useMemo(
    () => Object.fromEntries(campaigns.map((c) => [c.id, c])),
    [campaigns]
  );

  const today = startOfToday();

  const activeCampaigns = useMemo(
    () =>
      campaigns
        .filter((c) => c.status === "active")
        .sort(byPriorityThenStart),
    [campaigns]
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done" && !isBefore(parseISO(t.dueDate), today))
        .sort((a, b) => {
          const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
          return pw !== 0 ? pw : a.dueDate.localeCompare(b.dueDate);
        })
        .slice(0, 10),
    [tasks, today]
  );

  const overdueTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done" && isBefore(parseISO(t.dueDate), today))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks, today]
  );

  const urgentItems = useMemo(() => {
    const c = campaigns.filter((c) => c.priority === "urgent" && c.status !== "done");
    const t = tasks.filter((t) => t.priority === "urgent" && t.status !== "done");
    return { campaigns: c, tasks: t };
  }, [campaigns, tasks]);

  const blockedCampaigns = useMemo(
    () => campaigns.filter((c) => c.blockedReason && c.status !== "done"),
    [campaigns]
  );

  const noNextActionCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) => c.status === "active" && !c.nextAction.trim() && !c.blockedReason.trim()
      ),
    [campaigns]
  );

  const highlightActions = useMemo(() => {
    return HIGHLIGHT_BUSINESS_IDS.map((bid) => {
      const matching = activeCampaigns
        .filter((c) => c.businessIds.includes(bid))
        .sort(byPriorityThenStart);
      return { businessId: bid, business: businessById[bid], campaigns: matching };
    }).filter((x) => x.business);
  }, [activeCampaigns, businessById]);

  if (!ready) return null;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            What we&apos;re promoting, when it&apos;s going out, who it&apos;s for.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openCampaign} onOpenChange={setOpenCampaign}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4" /> New campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New campaign</DialogTitle>
              </DialogHeader>
              <CampaignForm onDone={() => setOpenCampaign(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={openTask} onOpenChange={setOpenTask}>
            <DialogTrigger asChild>
              <Button disabled={campaigns.length === 0}>
                <Plus className="h-4 w-4" /> New task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New task</DialogTitle>
              </DialogHeader>
              <TaskForm onDone={() => setOpenTask(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active campaigns" value={activeCampaigns.length} />
        <StatCard label="Upcoming tasks" value={upcomingTasks.length} />
        <StatCard label="Overdue" value={overdueTasks.length} tone={overdueTasks.length > 0 ? "destructive" : "default"} />
        <StatCard label="Blocked" value={blockedCampaigns.length} tone={blockedCampaigns.length > 0 ? "warning" : "default"} />
      </div>

      {(highlightActions.some((h) => h.campaigns.length > 0)) && (
        <div className="grid gap-3 md:grid-cols-2">
          {highlightActions.map(({ business, campaigns: cs }) => {
            if (!business || cs.length === 0) return null;
            return (
              <Card key={business.id} style={{ borderColor: business.color }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm" style={{ color: business.color }}>
                      {business.name}
                    </CardTitle>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Next action
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cs.map((c) => (
                    <Link
                      key={c.id}
                      href={`/campaigns/${c.id}`}
                      className="block rounded-md border bg-background p-3 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{c.name}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <p className={cn("mt-1 text-sm", c.nextAction ? "" : "italic text-muted-foreground")}>
                        {c.nextAction || "No next action set"}
                      </p>
                      {c.blockedReason && (
                        <p className="mt-1 text-xs font-semibold uppercase text-destructive">
                          Blocked: {c.blockedReason}
                        </p>
                      )}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(urgentItems.campaigns.length > 0 || urgentItems.tasks.length > 0) && (
        <Card className="border-red-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Zap className="h-4 w-4" /> Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {urgentItems.campaigns.map((c) => (
                <li key={`c-${c.id}`} className="py-2 text-sm">
                  <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">campaign</span>
                </li>
              ))}
              {urgentItems.tasks.map((t) => {
                const c = campaignById[t.campaignId];
                return (
                  <li key={`t-${t.id}`} className="py-2 text-sm">
                    <span className="font-medium">{t.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      due {format(parseISO(t.dueDate), "MMM d")}
                      {c && (
                        <>
                          {" · "}
                          <Link href={`/campaigns/${c.id}`} className="hover:underline">
                            {c.name}
                          </Link>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Next marketing actions</CardTitle>
            <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground">
              Calendar →
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <Empty message="Nothing scheduled. Add a task to get started." />
            ) : (
              <ul className="divide-y">
                {upcomingTasks.map((t) => {
                  const c = campaignById[t.campaignId];
                  const channelLabel = CHANNELS.find((x) => x.value === t.channel)?.label;
                  const days = differenceInCalendarDays(parseISO(t.dueDate), today);
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{t.title}</span>
                          {t.priority === "urgent" && (
                            <Zap className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(parseISO(t.dueDate), "EEE MMM d")}</span>
                          <span>·</span>
                          <span>{channelLabel}</span>
                          {c && (
                            <>
                              <span>·</span>
                              <Link href={`/campaigns/${c.id}`} className="hover:underline">
                                {c.name}
                              </Link>
                              <BusinessDots ids={c.businessIds} businessById={businessById} />
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={days === 0 ? "default" : "secondary"}>
                        {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days}d`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {activeCampaigns.length === 0 ? (
              <Empty message="No active campaigns. Set a campaign to active when it goes live." />
            ) : (
              <ul className="divide-y">
                {activeCampaigns.map((c) => {
                  const taskCount = tasks.filter((t) => t.campaignId === c.id).length;
                  const open = tasks.filter((t) => t.campaignId === c.id && t.status !== "done").length;
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <div className="min-w-0">
                        <Link href={`/campaigns/${c.id}`} className="truncate font-medium hover:underline">
                          {c.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {format(parseISO(c.startDate), "MMM d")} – {format(parseISO(c.endDate), "MMM d")}
                          </span>
                          <BusinessDots ids={c.businessIds} businessById={businessById} />
                        </div>
                      </div>
                      <Badge variant="outline">
                        {open}/{taskCount} open
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {noNextActionCampaigns.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" /> Active campaigns missing a next action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {noNextActionCampaigns.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <BusinessDots ids={c.businessIds} businessById={businessById} className="ml-2 inline-flex align-middle" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {blockedCampaigns.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Blocked campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {blockedCampaigns.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.blockedReason}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {overdueTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {overdueTasks.map((t) => {
                const c = campaignById[t.campaignId];
                const days = differenceInCalendarDays(today, parseISO(t.dueDate));
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.title}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(parseISO(t.dueDate), "MMM d")}</span>
                        {c && (
                          <>
                            <span>·</span>
                            <Link href={`/campaigns/${c.id}`} className="hover:underline">
                              {c.name}
                            </Link>
                            <BusinessDots ids={c.businessIds} businessById={businessById} />
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="destructive">{days}d late</Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function byPriorityThenStart(a: Campaign, b: Campaign) {
  const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  return pw !== 0 ? pw : b.startDate.localeCompare(a.startDate);
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "destructive" | "warning";
}) {
  const toneClass =
    tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-amber-600" : "";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={cn("text-3xl font-semibold", toneClass)}>{value}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{message}</div>;
}

function BusinessDots({
  ids,
  businessById,
  className,
}: {
  ids: string[];
  businessById: Record<string, { name: string; color: string }>;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      {ids.map((id) => {
        const b = businessById[id];
        if (!b) return null;
        return (
          <span
            key={id}
            title={b.name}
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: b.color }}
          />
        );
      })}
    </span>
  );
}

