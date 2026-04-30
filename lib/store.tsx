"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  Business,
  Campaign,
  CampaignStatus,
  Channel,
  Task,
  TaskStatus,
} from "./types";
import { supabase } from "./supabaseClient";
import { uid } from "./utils";

type State = {
  businesses: Business[];
  campaigns: Campaign[];
  tasks: Task[];
};

const EMPTY: State = { businesses: [], campaigns: [], tasks: [] };

type StoreApi = State & {
  ready: boolean;
  addCampaign: (input: Omit<Campaign, "id" | "createdAt">) => Promise<Campaign>;
  updateCampaign: (id: string, patch: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addTask: (input: Omit<Task, "id" | "createdAt">) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addBusiness: (name: string, color: string) => Promise<Business>;
  updateBusiness: (id: string, patch: Partial<Business>) => Promise<void>;
  deleteBusiness: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<StoreApi | null>(null);

// Postgres uses snake_case, the app uses camelCase. Rows go through these
// adapters at the supabase boundary so the rest of the app never sees the
// difference.

type CampaignRow = {
  id: string;
  name: string;
  business_ids: string[];
  start_date: string;
  end_date: string;
  goal: string;
  status: CampaignStatus;
  notes: string;
  created_at: string;
};

type TaskRow = {
  id: string;
  campaign_id: string;
  title: string;
  due_date: string;
  channel: Channel;
  status: TaskStatus;
  assignee: string;
  notes: string;
  created_at: string;
};

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    name: r.name,
    businessIds: r.business_ids,
    startDate: r.start_date,
    endDate: r.end_date,
    goal: r.goal,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function campaignPatchToRow(p: Partial<Campaign>): Partial<CampaignRow> {
  const out: Partial<CampaignRow> = {};
  if (p.name !== undefined) out.name = p.name;
  if (p.businessIds !== undefined) out.business_ids = p.businessIds;
  if (p.startDate !== undefined) out.start_date = p.startDate;
  if (p.endDate !== undefined) out.end_date = p.endDate;
  if (p.goal !== undefined) out.goal = p.goal;
  if (p.status !== undefined) out.status = p.status;
  if (p.notes !== undefined) out.notes = p.notes;
  return out;
}

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    title: r.title,
    dueDate: r.due_date,
    channel: r.channel,
    status: r.status,
    assignee: r.assignee,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function taskPatchToRow(p: Partial<Task>): Partial<TaskRow> {
  const out: Partial<TaskRow> = {};
  if (p.campaignId !== undefined) out.campaign_id = p.campaignId;
  if (p.title !== undefined) out.title = p.title;
  if (p.dueDate !== undefined) out.due_date = p.dueDate;
  if (p.channel !== undefined) out.channel = p.channel;
  if (p.status !== undefined) out.status = p.status;
  if (p.assignee !== undefined) out.assignee = p.assignee;
  if (p.notes !== undefined) out.notes = p.notes;
  return out;
}

function reportError(label: string, err: unknown) {
  console.error(`[store] ${label}:`, err);
  const msg = err instanceof Error ? err.message : String(err);
  toast.error(`${label}: ${msg}`);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [b, c, t] = await Promise.all([
      supabase.from("businesses").select("*").order("name"),
      supabase.from("campaigns").select("*").order("start_date", { ascending: false }),
      supabase.from("tasks").select("*").order("due_date"),
    ]);
    if (b.error) return reportError("Load businesses", b.error);
    if (c.error) return reportError("Load campaigns", c.error);
    if (t.error) return reportError("Load tasks", t.error);
    setState({
      businesses: (b.data ?? []) as Business[],
      campaigns: ((c.data ?? []) as CampaignRow[]).map(rowToCampaign),
      tasks: ((t.data ?? []) as TaskRow[]).map(rowToTask),
    });
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  // ---- Campaigns ---------------------------------------------------------

  const addCampaign = useCallback(
    async (input: Omit<Campaign, "id" | "createdAt">): Promise<Campaign> => {
      const id = uid();
      const row: CampaignRow = {
        id,
        name: input.name,
        business_ids: input.businessIds,
        start_date: input.startDate,
        end_date: input.endDate,
        goal: input.goal,
        status: input.status,
        notes: input.notes,
        created_at: new Date().toISOString(),
      };
      const c = rowToCampaign(row);
      setState((s) => ({ ...s, campaigns: [c, ...s.campaigns] }));
      const { error } = await supabase.from("campaigns").insert(row);
      if (error) {
        setState((s) => ({ ...s, campaigns: s.campaigns.filter((x) => x.id !== id) }));
        reportError("Add campaign", error);
        throw error;
      }
      return c;
    },
    []
  );

  const updateCampaign = useCallback(async (id: string, patch: Partial<Campaign>) => {
    let prev: Campaign | undefined;
    setState((s) => {
      prev = s.campaigns.find((c) => c.id === id);
      return {
        ...s,
        campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      };
    });
    const { error } = await supabase
      .from("campaigns")
      .update(campaignPatchToRow(patch))
      .eq("id", id);
    if (error && prev) {
      const original = prev;
      setState((s) => ({
        ...s,
        campaigns: s.campaigns.map((c) => (c.id === id ? original : c)),
      }));
      reportError("Update campaign", error);
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string) => {
    let snapshot: State | null = null;
    setState((s) => {
      snapshot = s;
      return {
        ...s,
        campaigns: s.campaigns.filter((c) => c.id !== id),
        tasks: s.tasks.filter((t) => t.campaignId !== id),
      };
    });
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error && snapshot) {
      setState(snapshot);
      reportError("Delete campaign", error);
    }
  }, []);

  // ---- Tasks -------------------------------------------------------------

  const addTask = useCallback(async (input: Omit<Task, "id" | "createdAt">): Promise<Task> => {
    const id = uid();
    const row: TaskRow = {
      id,
      campaign_id: input.campaignId,
      title: input.title,
      due_date: input.dueDate,
      channel: input.channel,
      status: input.status,
      assignee: input.assignee,
      notes: input.notes,
      created_at: new Date().toISOString(),
    };
    const t = rowToTask(row);
    setState((s) => ({ ...s, tasks: [...s.tasks, t] }));
    const { error } = await supabase.from("tasks").insert(row);
    if (error) {
      setState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id) }));
      reportError("Add task", error);
      throw error;
    }
    return t;
  }, []);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    let prev: Task | undefined;
    setState((s) => {
      prev = s.tasks.find((t) => t.id === id);
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      };
    });
    const { error } = await supabase
      .from("tasks")
      .update(taskPatchToRow(patch))
      .eq("id", id);
    if (error && prev) {
      const original = prev;
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? original : t)),
      }));
      reportError("Update task", error);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    let prev: Task | undefined;
    setState((s) => {
      prev = s.tasks.find((t) => t.id === id);
      return { ...s, tasks: s.tasks.filter((t) => t.id !== id) };
    });
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error && prev) {
      const original = prev;
      setState((s) => ({ ...s, tasks: [...s.tasks, original] }));
      reportError("Delete task", error);
    }
  }, []);

  // ---- Businesses --------------------------------------------------------

  const addBusiness = useCallback(async (name: string, color: string): Promise<Business> => {
    const b: Business = { id: uid(), name, color };
    setState((s) => ({ ...s, businesses: [...s.businesses, b] }));
    const { error } = await supabase.from("businesses").insert(b);
    if (error) {
      setState((s) => ({ ...s, businesses: s.businesses.filter((x) => x.id !== b.id) }));
      reportError("Add business", error);
      throw error;
    }
    return b;
  }, []);

  const updateBusiness = useCallback(async (id: string, patch: Partial<Business>) => {
    let prev: Business | undefined;
    setState((s) => {
      prev = s.businesses.find((b) => b.id === id);
      return {
        ...s,
        businesses: s.businesses.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      };
    });
    const { error } = await supabase.from("businesses").update(patch).eq("id", id);
    if (error && prev) {
      const original = prev;
      setState((s) => ({
        ...s,
        businesses: s.businesses.map((b) => (b.id === id ? original : b)),
      }));
      reportError("Update business", error);
    }
  }, []);

  const deleteBusiness = useCallback(async (id: string) => {
    let snapshot: State | null = null;
    setState((s) => {
      snapshot = s;
      return {
        ...s,
        businesses: s.businesses.filter((b) => b.id !== id),
        campaigns: s.campaigns.map((c) => ({
          ...c,
          businessIds: c.businessIds.filter((bid) => bid !== id),
        })),
      };
    });
    const { error } = await supabase.from("businesses").delete().eq("id", id);
    if (error && snapshot) {
      setState(snapshot);
      reportError("Delete business", error);
    }
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      ...state,
      ready,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      addTask,
      updateTask,
      deleteTask,
      addBusiness,
      updateBusiness,
      deleteBusiness,
      refresh,
    }),
    [
      state,
      ready,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      addTask,
      updateTask,
      deleteTask,
      addBusiness,
      updateBusiness,
      deleteBusiness,
      refresh,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
