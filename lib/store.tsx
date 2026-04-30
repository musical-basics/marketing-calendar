"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Business,
  Campaign,
  DEFAULT_BUSINESSES,
  Task,
} from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "marketing-calendar:v1";

type State = {
  businesses: Business[];
  campaigns: Campaign[];
  tasks: Task[];
};

const EMPTY: State = {
  businesses: DEFAULT_BUSINESSES,
  campaigns: [],
  tasks: [],
};

type StoreApi = State & {
  ready: boolean;
  addCampaign: (input: Omit<Campaign, "id" | "createdAt">) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  addTask: (input: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addBusiness: (name: string, color: string) => Business;
  updateBusiness: (id: string, patch: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;
  resetAll: () => void;
};

const StoreContext = createContext<StoreApi | null>(null);

function loadState(): State {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      businesses: parsed.businesses?.length ? parsed.businesses : DEFAULT_BUSINESSES,
      campaigns: parsed.campaigns ?? [],
      tasks: parsed.tasks ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function saveState(state: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const addCampaign = useCallback(
    (input: Omit<Campaign, "id" | "createdAt">) => {
      const c: Campaign = {
        ...input,
        id: uid(),
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, campaigns: [...s.campaigns, c] }));
      return c;
    },
    []
  );

  const updateCampaign = useCallback((id: string, patch: Partial<Campaign>) => {
    setState((s) => ({
      ...s,
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      campaigns: s.campaigns.filter((c) => c.id !== id),
      tasks: s.tasks.filter((t) => t.campaignId !== id),
    }));
  }, []);

  const addTask = useCallback((input: Omit<Task, "id" | "createdAt">) => {
    const t: Task = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, tasks: [...s.tasks, t] }));
    return t;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }, []);

  const addBusiness = useCallback((name: string, color: string) => {
    const b: Business = { id: uid(), name, color };
    setState((s) => ({ ...s, businesses: [...s.businesses, b] }));
    return b;
  }, []);

  const updateBusiness = useCallback((id: string, patch: Partial<Business>) => {
    setState((s) => ({
      ...s,
      businesses: s.businesses.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const deleteBusiness = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      businesses: s.businesses.filter((b) => b.id !== id),
      campaigns: s.campaigns.map((c) => ({
        ...c,
        businessIds: c.businessIds.filter((bid) => bid !== id),
      })),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(EMPTY);
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
      resetAll,
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
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
