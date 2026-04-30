export type Business = {
  id: string;
  name: string;
  color: string;
};

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

