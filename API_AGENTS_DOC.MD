# Marketing Calendar — Agent Manual

You are an automated agent connecting to Lionel Yu's marketing calendar.

**Production base URL:** `https://marketing-calendar-ochre.vercel.app`

This document is also served live at `GET /api` so you can re-read it
any time for the current contract.

---

## What this app is

Lionel runs marketing for several businesses (Musical Basics, DreamPlay
Pianos, Ultimate Pianist, Belgium Concert, DS Standard / Steinbuhler,
Other). This app tracks campaigns and tasks across all of them.

Your job, when you're given one, is usually one of:
- Report what's coming up, what's blocked, or what's overdue.
- Update the *next action* on a campaign.
- Add or update a task.
- Mark a task done.
- Move a campaign's metric forward (e.g., increment `metricCurrent`).

---

## Auth

**None right now.** Send no headers. If/when an `Authorization: Bearer
<key>` becomes required, this doc and every endpoint will tell you.

---

## Data model (the only shapes you need)

### `Business`
```json
{ "id": "dreamplay-pianos", "name": "DreamPlay Pianos", "color": "#8b5cf6" }
```
Stable, hand-curated set. Don't create new businesses unless explicitly asked.

### `Campaign`
```json
{
  "id": "abc12345xyz",
  "name": "DreamPlay Pre-Order Trust Builder",
  "businessIds": ["dreamplay-pianos"],
  "startDate": "2026-04-30",
  "endDate":   "2026-06-29",
  "goal": "Convert warm leads into preorders",
  "status":   "active",   // planned | active | paused | done
  "priority": "high",     // urgent  | high   | normal | low
  "notes": "",
  "audience": "Visitors from last 60 days",
  "offer":    "$1000 off + accessory pack",
  "primaryCtaUrl":  "https://…",
  "successMetric":  "Preorders confirmed",
  "metricTarget":   25,
  "metricCurrent":  7,
  "nextAction":     "Send week 1 testimonial email",
  "blockedReason":  "",
  "createdAt": "2026-04-30T05:00:00.000Z"
}
```

### `Task`
```json
{
  "id": "def67890uvw",
  "campaignId": "abc12345xyz",
  "title": "Send launch email",
  "dueDate": "2026-05-03",
  "channel":  "email",       // email | youtube | website | social | ads | discord | outreach | other
  "status":   "todo",        // todo  | in_progress | done
  "priority": "high",        // urgent | high | normal | low
  "assignee": "Lionel",
  "notes": "",
  "assetStatus": "not_started",  // na | not_started | in_progress | done
  "copyStatus":  "in_progress",  // na | not_started | in_progress | done
  "linkUrl": "",
  "publishUrl": "",
  "needsApproval": false,
  "createdAt": "2026-04-30T05:00:00.000Z"
}
```

All dates are `YYYY-MM-DD`. All timestamps are ISO 8601 UTC. All field
names are camelCase.

---

## Endpoints

| Method | Path                         | Purpose                                      |
| ------ | ---------------------------- | -------------------------------------------- |
| GET    | `/api`                       | This manual                                  |
| GET    | `/api/businesses`            | List all businesses                          |
| POST   | `/api/businesses`            | Create a business                            |
| PATCH  | `/api/businesses/{id}`       | Update a business (404 if id unknown)        |
| DELETE | `/api/businesses/{id}`       | Delete (404 if id unknown). Unlinks campaigns |
| GET    | `/api/campaigns`             | List all campaigns (newest start_date first) |
| POST   | `/api/campaigns`             | Create a campaign                            |
| PATCH  | `/api/campaigns/{id}`        | Update a campaign (404 if id unknown)        |
| DELETE | `/api/campaigns/{id}`        | Delete (404 if id unknown). Cascades tasks  |
| GET    | `/api/tasks`                 | List all tasks (earliest due_date first)     |
| POST   | `/api/tasks`                 | Create a task                                |
| PATCH  | `/api/tasks/{id}`            | Update a task (404 if id unknown)            |
| DELETE | `/api/tasks/{id}`            | Delete (404 if id unknown)                   |
| POST   | `/api/seed-templates`        | Idempotent: load Lionel's 4 standard campaigns |

**Required POST fields:**
- Business: `id`, `name`, `color`
- Campaign: `id`, `name`, `startDate`, `endDate` — everything else defaults sensibly
- Task: `id`, `campaignId`, `title`, `dueDate`

**ID generation:** when creating, you must supply your own `id`. Use any
short URL-safe random string (8–14 characters of base36 is what the UI
uses). The server doesn't generate IDs for you.

---

## Errors

```json
{ "error": "human-readable message" }
```
- `400` — bad request (missing required field, malformed JSON)
- `404` — id not found (PATCH/DELETE only)
- `5xx` — database error; the message contains the underlying problem

---

## Recipes — the things you'll actually do

### "What should Lionel work on next?"
```bash
curl -s https://marketing-calendar-ochre.vercel.app/api/tasks \
| jq '[.[] | select(.status != "done")]
      | sort_by(
          ({"urgent":0,"high":1,"normal":2,"low":3})[.priority],
          .dueDate
        )
      | .[0:5]'
```

### "What's blocked or has no next action?"
```bash
curl -s https://marketing-calendar-ochre.vercel.app/api/campaigns \
| jq '.[] | select(.status == "active" and (.blockedReason != "" or .nextAction == ""))
       | { name, status, blockedReason, nextAction }'
```

### "Add a task to the Belgium concert campaign"
```bash
# 1. Find the campaign id
ID=$(curl -s https://marketing-calendar-ochre.vercel.app/api/campaigns \
     | jq -r '.[] | select(.name | contains("Belgium")) | .id')

# 2. Generate a task id (any short random string)
TID=$(node -e 'process.stdout.write(Math.random().toString(36).slice(2,10))')

# 3. POST it
curl -s -X POST https://marketing-calendar-ochre.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$TID\",
    \"campaignId\": \"$ID\",
    \"title\": \"Email VIP list about meet-and-greet\",
    \"dueDate\": \"2026-05-15\",
    \"channel\": \"email\",
    \"status\": \"todo\",
    \"priority\": \"high\",
    \"assignee\": \"agent\",
    \"notes\": \"\",
    \"assetStatus\": \"na\",
    \"copyStatus\": \"not_started\",
    \"linkUrl\": \"\",
    \"publishUrl\": \"\",
    \"needsApproval\": false
  }"
```

### "Update the next action on a campaign"
```bash
curl -s -X PATCH https://marketing-calendar-ochre.vercel.app/api/campaigns/<id> \
  -H "Content-Type: application/json" \
  -d '{ "nextAction": "Send the week 2 testimonial email" }'
```

### "Mark a task done"
```bash
curl -s -X PATCH https://marketing-calendar-ochre.vercel.app/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{ "status": "done", "publishUrl": "https://example.com/the-thing" }'
```

### "Bump the success metric"
```bash
# Read current
CURRENT=$(curl -s https://marketing-calendar-ochre.vercel.app/api/campaigns \
          | jq '.[] | select(.id=="<id>") | .metricCurrent // 0')
NEXT=$((CURRENT + 1))

curl -s -X PATCH https://marketing-calendar-ochre.vercel.app/api/campaigns/<id> \
  -H "Content-Type: application/json" \
  -d "{ \"metricCurrent\": $NEXT }"
```

---

## Behavior expectations

- **Patches are partial.** Only send the fields you want to change.
- **Be idempotent when you can.** If you're going to add a task, first
  `GET /api/tasks` and check whether one with the same `title` and
  `campaignId` already exists.
- **Don't change `id`, `createdAt`, or `businessIds` casually.** Those are
  load-bearing for the UI.
- **Don't delete things unless explicitly told to.** Prefer setting
  `status: "done"` on tasks, or `status: "paused"` / `status: "done"` on
  campaigns.
- **When uncertain, read first.** A `GET` is free; a wrong `PATCH` requires
  Lionel to undo it.

---

## When something is wrong

If you get an error you don't understand, return the response body
verbatim to whoever asked you to do the work — don't try to "fix" it by
guessing different field shapes. The contract above is exhaustive; if a
field isn't here, the API doesn't accept it.

If the API is unreachable (5xx, timeout), report that and stop. Don't
retry mutations more than once — the server doesn't currently
deduplicate by client request id.
