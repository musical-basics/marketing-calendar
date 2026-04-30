# marketing-calendar HTTP API

Base URL (production): `https://marketing-calendar-ochre.vercel.app`
Base URL (local dev):  `http://localhost:3000`

All endpoints accept and return `application/json; charset=utf-8`.

> **Auth:** none right now. Anyone who can reach the URL can read and
> write. See "Locking it down" at the bottom — recommended before
> wiring production agents.

---

## Resources

| Resource    | Identifier shape              | Notes                                              |
| ----------- | ----------------------------- | -------------------------------------------------- |
| businesses  | string id (e.g. `dreamplay-pianos`) | Logical owner of one or more campaigns.       |
| campaigns   | random string id              | A campaign belongs to one or more businesses.     |
| tasks       | random string id              | Each task belongs to exactly one campaign.        |

### Business

```json
{
  "id": "dreamplay-pianos",
  "name": "DreamPlay Pianos",
  "color": "#8b5cf6"
}
```

### Campaign

```json
{
  "id": "abc12345xyz",
  "name": "DreamPlay Pre-Order Trust Builder",
  "businessIds": ["dreamplay-pianos"],
  "startDate": "2026-04-30",
  "endDate":   "2026-06-29",
  "goal": "Convert warm leads into preorders",
  "status": "active",                    // planned | active | paused | done
  "priority": "high",                    // urgent | high | normal | low
  "notes": "",
  "audience": "Visitors from last 60 days",
  "offer": "$1000 off + accessory pack",
  "primaryCtaUrl": "https://…",
  "successMetric": "Preorders confirmed",
  "metricTarget": 25,
  "metricCurrent": 7,
  "nextAction": "Send week 1 testimonial email",
  "blockedReason": "",
  "createdAt": "2026-04-30T05:00:00.000Z"
}
```

### Task

```json
{
  "id": "def67890uvw",
  "campaignId": "abc12345xyz",
  "title": "Send launch email",
  "dueDate": "2026-05-03",
  "channel": "email",                    // email | youtube | website | social | ads | discord | outreach | other
  "status": "todo",                      // todo | in_progress | done
  "priority": "high",                    // urgent | high | normal | low
  "assignee": "Lionel",
  "notes": "",
  "assetStatus": "not_started",          // na | not_started | in_progress | done
  "copyStatus":  "in_progress",          // na | not_started | in_progress | done
  "linkUrl": "",
  "publishUrl": "",
  "needsApproval": false,
  "createdAt": "2026-04-30T05:00:00.000Z"
}
```

---

## Endpoints

### Businesses

| Method | Path                    | Body            | Returns                  |
| ------ | ----------------------- | --------------- | ------------------------ |
| GET    | `/api/businesses`       | —               | `Business[]` (200)       |
| POST   | `/api/businesses`       | `Business`      | `Business` (201)         |
| PATCH  | `/api/businesses/:id`   | `Partial<Business>` | `Business` (200)     |
| DELETE | `/api/businesses/:id`   | —               | `{ ok: true }` (200)     |

POST requires `id`, `name`, `color`. PATCH only updates fields provided.

### Campaigns

| Method | Path                    | Body            | Returns                  |
| ------ | ----------------------- | --------------- | ------------------------ |
| GET    | `/api/campaigns`        | —               | `Campaign[]` (200, sorted by `startDate` desc) |
| POST   | `/api/campaigns`        | `Campaign`      | `Campaign` (201)         |
| PATCH  | `/api/campaigns/:id`    | `Partial<Campaign>` | `{ ok: true }` (200) |
| DELETE | `/api/campaigns/:id`    | —               | `{ ok: true }` (200) — also cascades tasks |

POST requires `id`, `name`, `startDate`, `endDate`. All other fields default
sensibly (`status: "planned"`, `priority: "normal"`, empty strings, etc).

### Tasks

| Method | Path                | Body            | Returns                  |
| ------ | ------------------- | --------------- | ------------------------ |
| GET    | `/api/tasks`        | —               | `Task[]` (200, sorted by `dueDate` asc) |
| POST   | `/api/tasks`        | `Task`          | `Task` (201)             |
| PATCH  | `/api/tasks/:id`    | `Partial<Task>` | `{ ok: true }` (200)     |
| DELETE | `/api/tasks/:id`    | —               | `{ ok: true }` (200)     |

POST requires `id`, `campaignId`, `title`, `dueDate`.

### Seed templates

| Method | Path                   | Body | Returns |
| ------ | ---------------------- | ---- | ------- |
| POST   | `/api/seed-templates`  | —    | `{ campaigns: string[], tasks: number, skipped: string[] }` |

Inserts the four "Lionel templates" if they don't already exist (matched by
`name`). Idempotent — safe to call repeatedly.

---

## Errors

All errors return:

```json
{ "error": "human-readable message" }
```

with a 4xx status (validation/not found) or 5xx (database error).

---

## curl recipes

```bash
BASE=https://marketing-calendar-ochre.vercel.app

# What's on my plate?
curl -s "$BASE/api/tasks" \
  | jq '[.[] | select(.status != "done")] | sort_by(.dueDate) | .[0:5]'

# What campaigns are blocked?
curl -s "$BASE/api/campaigns" \
  | jq '.[] | select(.blockedReason != "")'

# Add a task
curl -s -X POST "$BASE/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "smoke-1",
    "campaignId": "<existing campaign id>",
    "title": "Test from script",
    "dueDate": "2026-05-15",
    "channel": "email",
    "status": "todo",
    "priority": "normal",
    "assignee": "agent",
    "notes": "",
    "assetStatus": "na",
    "copyStatus": "na",
    "linkUrl": "",
    "publishUrl": "",
    "needsApproval": false
  }'

# Update next action on a campaign
curl -s -X PATCH "$BASE/api/campaigns/<id>" \
  -H "Content-Type: application/json" \
  -d '{ "nextAction": "Send the email today" }'

# Mark a task done
curl -s -X PATCH "$BASE/api/tasks/<id>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "done" }'

# Bump metric_current toward target
curl -s -X PATCH "$BASE/api/campaigns/<id>" \
  -H "Content-Type: application/json" \
  -d '{ "metricCurrent": 12 }'
```

---

## Locking it down (recommended before wiring agents to production)

Right now anyone who finds the URL can read/write. Cheapest fix:

1. Add an env var `MARKETING_CALENDAR_API_KEY` (long random string).
2. Make all `/api/*` route handlers reject requests whose
   `Authorization: Bearer <key>` header doesn't match.
3. The browser app would also need to send the key. Two ways:
   - **Server-rendered token**: have the App Router inject the key into
     the page via a server component, then store.tsx reads it from a
     `<script>` tag or `window.__MC_KEY`. Token is in the page HTML —
     anyone with the URL still has it, but bots won't randomly stumble
     into the API.
   - **Cookie-based**: visiting the URL once sets a signed cookie; the
     route handler checks either `Authorization` (for agents) or the
     cookie (for browser).

For a *real* lock, add Supabase Auth (magic link) and per-user RLS.
The data model already has the right shape — you'd add a `user_id`
column on each table and tighten the RLS policies.

Until then, an honest assessment: this API is suitable for personal
agents you trust, not for shipping to clients or partners.
