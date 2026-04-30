"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#10b981",
  "#06b6d4",
  "#eab308",
  "#ef4444",
  "#6b7280",
];

export default function SettingsPage() {
  const { businesses, addBusiness, updateBusiness, deleteBusiness, ready, refresh } = useStore();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [seeding, setSeeding] = useState(false);

  if (!ready) return null;

  async function loadTemplates() {
    if (!confirm("Load the four Lionel campaign templates? Skips any campaign whose name already exists.")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/seed-templates", { method: "POST" });
      const json = (await res.json()) as { campaigns?: string[]; tasks?: number; skipped?: string[]; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to load templates");
        return;
      }
      const created = json.campaigns?.length ?? 0;
      const tasks = json.tasks ?? 0;
      const skipped = json.skipped?.length ?? 0;
      if (created === 0 && skipped > 0) {
        toast.success(`All ${skipped} templates already exist — nothing to do.`);
      } else {
        toast.success(`Created ${created} campaign(s), ${tasks} task(s)${skipped ? `; skipped ${skipped} existing` : ""}`);
      }
      await refresh();
    } finally {
      setSeeding(false);
    }
  }

  function add() {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    addBusiness(newName.trim(), newColor);
    setNewName("");
    toast.success("Business added");
  }

  function remove(id: string, name: string) {
    if (!confirm(`Remove "${name}"? It will be unlinked from any campaigns.`)) return;
    deleteBusiness(id);
    toast.success("Business removed");
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage businesses and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Load the four ready-to-go campaigns Lionel actually runs:
            DreamPlay pre-order trust, Belgium concert ticket sales,
            Musical Basics × Steinbuhler educational series, and Ultimate
            Pianist funnel launch. Idempotent — skips any campaign name
            that already exists.
          </p>
          <div>
            <Button onClick={loadTemplates} disabled={seeding}>
              <Sparkles className="h-4 w-4" /> {seeding ? "Loading…" : "Load Lionel campaign templates"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Businesses / projects</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ul className="divide-y">
            {businesses.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2">
                <input
                  type="color"
                  value={b.color}
                  onChange={(e) => updateBusiness(b.id, { color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border"
                />
                <Input
                  value={b.name}
                  onChange={(e) => updateBusiness(b.id, { name: e.target.value })}
                  className="flex-1"
                />
                <Button size="icon" variant="ghost" onClick={() => remove(b.id, b.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 border-t pt-3">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border"
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New business name"
              onKeyDown={(e) => e.key === "Enter" && add()}
              className="flex-1"
            />
            <Button onClick={add}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
