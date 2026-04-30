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
import { CHANNELS } from "@/lib/types";
import { differenceInCalendarDays, format, isAfter, isBefore, parseISO, startOfToday } from "date-fns";
import { Plus } from "lucide-react";

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
    () => campaigns.filter((c) => c.status === "active"),
    [campaigns]
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done" && !isBefore(parseISO(t.dueDate), today))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
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

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active campaigns" value={activeCampaigns.length} />
        <StatCard label="Upcoming tasks" value={upcomingTasks.length} />
        <StatCard label="Overdue tasks" value={overdueTasks.length} tone={overdueTasks.length > 0 ? "destructive" : "default"} />
      </div>

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
                        <div className="truncate font-medium">{t.title}</div>
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

function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "destructive" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`text-3xl font-semibold ${tone === "destructive" ? "text-destructive" : ""}`}>
          {value}
        </div>
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
}: {
  ids: string[];
  businessById: Record<string, { name: string; color: string }>;
}) {
  return (
    <span className="flex items-center gap-1">
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
