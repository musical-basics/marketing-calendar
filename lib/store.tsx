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
import { Business, Campaign, Task } from "./types";
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

async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
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
    try {
      const [businesses, campaigns, tasks] = await Promise.all([
        api<Business[]>("/api/businesses"),
        api<Campaign[]>("/api/campaigns"),
        api<Task[]>("/api/tasks"),
      ]);
      setState({ businesses, campaigns, tasks });
    } catch (err) {
      reportError("Load data", err);
    }
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
      const optimistic: Campaign = {
        ...input,
        id: uid(),
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, campaigns: [optimistic, ...s.campaigns] }));
      try {
        const created = await api<Campaign>("/api/campaigns", {
          method: "POST",
          body: optimistic,
        });
        setState((s) => ({
          ...s,
          campaigns: s.campaigns.map((c) => (c.id === optimistic.id ? created : c)),
        }));
        return created;
      } catch (err) {
        setState((s) => ({
          ...s,
          campaigns: s.campaigns.filter((c) => c.id !== optimistic.id),
        }));
        reportError("Add campaign", err);
        throw err;
      }
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
    try {
      await api(`/api/campaigns/${id}`, { method: "PATCH", body: patch });
    } catch (err) {
      if (prev) {
        const original = prev;
        setState((s) => ({
          ...s,
          campaigns: s.campaigns.map((c) => (c.id === id ? original : c)),
        }));
      }
      reportError("Update campaign", err);
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
    try {
      await api(`/api/campaigns/${id}`, { method: "DELETE" });
    } catch (err) {
      if (snapshot) setState(snapshot);
      reportError("Delete campaign", err);
    }
  }, []);

  // ---- Tasks -------------------------------------------------------------

  const addTask = useCallback(async (input: Omit<Task, "id" | "createdAt">): Promise<Task> => {
    const optimistic: Task = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, tasks: [...s.tasks, optimistic] }));
    try {
      const created = await api<Task>("/api/tasks", {
        method: "POST",
        body: optimistic,
      });
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === optimistic.id ? created : t)),
      }));
      return created;
    } catch (err) {
      setState((s) => ({
        ...s,
        tasks: s.tasks.filter((t) => t.id !== optimistic.id),
      }));
      reportError("Add task", err);
      throw err;
    }
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
    try {
      await api(`/api/tasks/${id}`, { method: "PATCH", body: patch });
    } catch (err) {
      if (prev) {
        const original = prev;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? original : t)),
        }));
      }
      reportError("Update task", err);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    let prev: Task | undefined;
    setState((s) => {
      prev = s.tasks.find((t) => t.id === id);
      return { ...s, tasks: s.tasks.filter((t) => t.id !== id) };
    });
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
    } catch (err) {
      if (prev) {
        const original = prev;
        setState((s) => ({ ...s, tasks: [...s.tasks, original] }));
      }
      reportError("Delete task", err);
    }
  }, []);

  // ---- Businesses --------------------------------------------------------

  const addBusiness = useCallback(async (name: string, color: string): Promise<Business> => {
    const optimistic: Business = { id: uid(), name, color };
    setState((s) => ({ ...s, businesses: [...s.businesses, optimistic] }));
    try {
      const created = await api<Business>("/api/businesses", {
        method: "POST",
        body: optimistic,
      });
      setState((s) => ({
        ...s,
        businesses: s.businesses.map((b) => (b.id === optimistic.id ? created : b)),
      }));
      return created;
    } catch (err) {
      setState((s) => ({
        ...s,
        businesses: s.businesses.filter((b) => b.id !== optimistic.id),
      }));
      reportError("Add business", err);
      throw err;
    }
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
    try {
      await api(`/api/businesses/${id}`, { method: "PATCH", body: patch });
    } catch (err) {
      if (prev) {
        const original = prev;
        setState((s) => ({
          ...s,
          businesses: s.businesses.map((b) => (b.id === id ? original : b)),
        }));
      }
      reportError("Update business", err);
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
    try {
      await api(`/api/businesses/${id}`, { method: "DELETE" });
    } catch (err) {
      if (snapshot) setState(snapshot);
      reportError("Delete business", err);
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
