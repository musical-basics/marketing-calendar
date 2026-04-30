export type Business = {
  id: string;
  name: string;
  color: string;
};

export type Priority = "urgent" | "high" | "normal" | "low";

export type CampaignStatus = "planned" | "active" | "paused" | "done";

export type Campaign = {
  id: string;
  name: string;
  businessIds: string[];
  startDate: string;
  endDate: string;
  goal: string;
  status: CampaignStatus;
  notes: string;
  createdAt: string;
  // Extended fields
  priority: Priority;
  audience: string;
  offer: string;
  primaryCtaUrl: string;
  successMetric: string;
  metricTarget: number | null;
  metricCurrent: number | null;
  nextAction: string;
  blockedReason: string;
};

export type Channel =
  | "email"
  | "youtube"
  | "website"
  | "social"
  | "ads"
  | "discord"
  | "outreach"
  | "other";

export type TaskStatus = "todo" | "in_progress" | "done";

export type AssetStatus = "na" | "not_started" | "in_progress" | "done";
export type CopyStatus = "na" | "not_started" | "in_progress" | "done";

export type Task = {
  id: string;
  campaignId: string;
  title: string;
  dueDate: string;
  channel: Channel;
  status: TaskStatus;
  assignee: string;
  notes: string;
  createdAt: string;
  // Extended fields
  priority: Priority;
  assetStatus: AssetStatus;
  copyStatus: CopyStatus;
  linkUrl: string;
  publishUrl: string;
  needsApproval: boolean;
};

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "social", label: "Social media" },
  { value: "ads", label: "Ads" },
  { value: "discord", label: "Discord" },
  { value: "outreach", label: "Direct outreach" },
  { value: "other", label: "Other" },
];

export const CAMPAIGN_STATUSES: { value: CampaignStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "done", label: "Done" },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const PRIORITIES: { value: Priority; label: string; weight: number }[] = [
  { value: "urgent", label: "Urgent", weight: 3 },
  { value: "high", label: "High", weight: 2 },
  { value: "normal", label: "Normal", weight: 1 },
  { value: "low", label: "Low", weight: 0 },
];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 3,
  high: 2,
  normal: 1,
  low: 0,
};

export const ASSET_COPY_STATUSES: { value: AssetStatus; label: string }[] = [
  { value: "na", label: "N/A" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];
