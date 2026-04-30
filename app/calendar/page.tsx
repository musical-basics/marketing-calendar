"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterBar, EMPTY_FILTERS, Filters, taskMatchesFilters } from "@/components/filter-bar";
import { Channel, TaskStatus } from "@/lib/types";

type View = "month" | "week";

export default function CalendarPage() {
  const { tasks, campaigns, businesses, ready } = useStore();
  const [cursor, setCursor] = useState(() => startOfToday());
  const [view, setView] = useState<View>("month");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const campaignById = useMemo(
    () => Object.fromEntries(campaigns.map((c) => [c.id, c])),
    [campaigns]
  );
  const businessById = useMemo(
    () => Object.fromEntries(businesses.map((b) => [b.id, b])),
    [businesses]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const c = campaignById[t.campaignId];
      const ids = c?.businessIds ?? [];
      return taskMatchesFilters(
        t as { channel: Channel; status: TaskStatus; campaignId: string },
        ids,
        filters
      );
    });
  }, [tasks, campaignById, filters]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const t of filteredTasks) {
      const arr = map.get(t.dueDate) ?? [];
      arr.push(t);
      map.set(t.dueDate, arr);
    }
    return map;
  }, [filteredTasks]);

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const out: Date[] = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [cursor, view]);

  const today = startOfToday();

  if (!ready) return null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(view === "month" ? subMonths(cursor, 1) : subWeeks(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(view === "month" ? addMonths(cursor, 1) : addWeeks(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(today)}>
            Today
          </Button>
          <h2 className="ml-2 text-xl font-semibold">
            {view === "week"
              ? `Week of ${format(startOfWeek(cursor, { weekStartsOn: 1 }), "MMM d, yyyy")}`
              : format(cursor, "MMMM yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            <button
              onClick={() => setView("month")}
              className={cn(
                "rounded px-3 py-1 text-sm",
                view === "month" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "rounded px-3 py-1 text-sm",
                view === "week" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              )}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className={cn("grid grid-cols-7", view === "month" ? "auto-rows-[7rem]" : "auto-rows-[14rem]")}>
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const dayTasks = tasksByDay.get(key) ?? [];
            const inMonth = view === "week" || isSameMonth(d, cursor);
            const isToday = isSameDay(d, today);
            return (
              <div
                key={key}
                className={cn(
                  "border-b border-r p-1.5 text-xs",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                  isToday && "bg-accent/40"
                )}
              >
                <div className={cn("mb-1 flex justify-end font-medium", isToday && "text-primary")}>
                  {format(d, "d")}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, view === "week" ? 20 : 4).map((t) => {
                    const c = campaignById[t.campaignId];
                    const color = c?.businessIds[0] ? businessById[c.businessIds[0]]?.color : "#6b7280";
                    return (
                      <Link
                        key={t.id}
                        href={c ? `/campaigns/${c.id}` : "#"}
                        className="block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight"
                        style={{ background: `${color}22`, color, borderLeft: `3px solid ${color}` }}
                        title={`${t.title}${c ? ` — ${c.name}` : ""}`}
                      >
                        {t.title}
                      </Link>
                    );
                  })}
                  {view === "month" && dayTasks.length > 4 && (
                    <div className="px-1.5 text-[11px] text-muted-foreground">
                      +{dayTasks.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
