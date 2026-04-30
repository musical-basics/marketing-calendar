import { Campaign, Channel, Priority, Task } from "./types";

// "Lionel templates" — the four real campaigns that get loaded by the
// "Load Lionel campaign templates" button. They use the new fields
// (priority, audience, offer, success_metric, next_action) so the
// dashboard immediately shows useful data on a fresh DB.

type TemplateTask = Pick<
  Task,
  | "title"
  | "channel"
  | "priority"
  | "assignee"
  | "notes"
> & { dueOffsetDays: number };

type TemplateCampaign = Pick<
  Campaign,
  | "name"
  | "businessIds"
  | "goal"
  | "status"
  | "priority"
  | "audience"
  | "offer"
  | "successMetric"
  | "nextAction"
> & {
  startOffsetDays: number;
  endOffsetDays: number;
  metricTarget: number | null;
  tasks: TemplateTask[];
};

const ch = (c: Channel) => c;
const p = (x: Priority) => x;

export const LIONEL_TEMPLATES: TemplateCampaign[] = [
  {
    name: "DreamPlay Pre-Order Trust Builder",
    businessIds: ["dreamplay-pianos"],
    startOffsetDays: 0,
    endOffsetDays: 60,
    goal: "Convert warm DreamPlay leads into preorders by removing trust friction.",
    status: "active",
    priority: p("high"),
    audience: "Visitors who saw DreamPlay marketing in the last 60 days but haven't ordered.",
    offer: "$1,000 off + bonus accessory pack for early preorders.",
    successMetric: "Preorders confirmed",
    metricTarget: 25,
    nextAction: "Send week 1 testimonial email to warm list.",
    tasks: [
      { title: "Write testimonial email (week 1)", channel: ch("email"), priority: p("high"), assignee: "Lionel", notes: "Lead with strongest customer story.", dueOffsetDays: 3 },
      { title: "Record customer video testimonial", channel: ch("youtube"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 14 },
      { title: "Update FAQ page with refund + shipping policy", channel: ch("website"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 10 },
      { title: "Discord AMA with engineer", channel: ch("discord"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 21 },
    ],
  },
  {
    name: "Belgium Concert Ticket Sales Push",
    businessIds: ["belgium-concert"],
    startOffsetDays: 0,
    endOffsetDays: 60,
    goal: "Sell out the Belgium concert before doors open.",
    status: "active",
    priority: p("urgent"),
    audience: "Belgian piano enthusiasts and the existing mailing list.",
    offer: "Limited early-bird pricing + VIP meet-and-greet for first 50 buyers.",
    successMetric: "Tickets sold",
    metricTarget: 200,
    nextAction: "Confirm venue capacity and finalize pricing tiers.",
    tasks: [
      { title: "Confirm venue capacity + finalize pricing", channel: ch("outreach"), priority: p("urgent"), assignee: "Lionel", notes: "", dueOffsetDays: 2 },
      { title: "Event announcement email", channel: ch("email"), priority: p("high"), assignee: "", notes: "", dueOffsetDays: 5 },
      { title: "Instagram countdown posts (T-30, T-14, T-7, T-1)", channel: ch("social"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 30 },
      { title: "Local partner cross-promo outreach", channel: ch("outreach"), priority: p("high"), assignee: "Lionel", notes: "Belgian conservatories, piano stores.", dueOffsetDays: 7 },
      { title: "Post-show wrap-up email + photo recap", channel: ch("email"), priority: p("low"), assignee: "", notes: "", dueOffsetDays: 65 },
    ],
  },
  {
    name: "Musical Basics × Steinbuhler Educational Series",
    businessIds: ["musical-basics", "ds-standard"],
    startOffsetDays: 0,
    endOffsetDays: 90,
    goal: "Educate pianists on alternative-sized keyboards via long-form content.",
    status: "active",
    priority: p("normal"),
    audience: "Piano teachers and adult students with hand-size concerns.",
    offer: "Free Steinbuhler keyboard sizing consultation.",
    successMetric: "Consultation bookings",
    metricTarget: 50,
    nextAction: "Outline first 3 video scripts with David.",
    tasks: [
      { title: "Outline first 3 video scripts with David", channel: ch("outreach"), priority: p("high"), assignee: "Lionel + David", notes: "", dueOffsetDays: 7 },
      { title: "Record + upload first explainer video", channel: ch("youtube"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 21 },
      { title: "Write blog companion to video 1", channel: ch("website"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 24 },
      { title: "Newsletter send featuring video 1", channel: ch("email"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 28 },
    ],
  },
  {
    name: "Ultimate Pianist Funnel Launch",
    businessIds: ["ultimate-pianist"],
    startOffsetDays: 0,
    endOffsetDays: 60,
    goal: "Build a working sales funnel from free lesson → paid course.",
    status: "active",
    priority: p("high"),
    audience: "Adult beginners searching online for piano lessons.",
    offer: "Free 7-day mini-course with downloadable practice plan.",
    successMetric: "Funnel-to-paid conversions",
    metricTarget: 30,
    nextAction: "Set up email automation in funnel tool.",
    tasks: [
      { title: "Write landing page copy", channel: ch("website"), priority: p("high"), assignee: "Lionel", notes: "", dueOffsetDays: 5 },
      { title: "Build 7-email mini-course sequence", channel: ch("email"), priority: p("high"), assignee: "Lionel", notes: "", dueOffsetDays: 12 },
      { title: "Outline paid course modules", channel: ch("website"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 20 },
      { title: "Create ad creatives (3 variants)", channel: ch("ads"), priority: p("normal"), assignee: "", notes: "", dueOffsetDays: 25 },
    ],
  },
];
