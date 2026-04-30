"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
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
  const { businesses, addBusiness, updateBusiness, deleteBusiness, resetAll, ready } = useStore();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  if (!ready) return null;

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

  function reset() {
    if (!confirm("Delete all campaigns, tasks, and businesses? This cannot be undone.")) return;
    resetAll();
    toast.success("All data reset");
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage businesses and data.</p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Data is stored in your browser&apos;s localStorage. Clearing it removes everything.
          </p>
          <Button variant="destructive" onClick={reset}>
            Reset all data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
