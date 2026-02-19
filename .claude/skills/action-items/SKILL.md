Action item conventions for Cameron's job search pipeline.

## What IS an action item (by priority category)

1. **Unanswered emails** — might view and forget to respond; highest urgency
2. **Follow-up/thank-you emails** — post-interview courtesy, time-sensitive
3. **Debriefing completed interviews** — capture while fresh
4. **Take-home assignments with deadlines** — concrete due dates that self-sort
5. **Applying to companies, blog/brand tasks, snoozed items resurfacing** — lower urgency, batch-able

## What is NEVER an action item

- LinkedIn actions (connections, profile updates)
- "Waiting for X" — that's pipeline status, not an action Cameron can take
- Interview prep — visible from calendar, tied to the job record
- Prep material review — connected to the job, not a standalone action
- Vague "keep on radar" — either snooze with a date or drop it
- Anything already done

## Priority field

- `priority 1` — do today (unanswered emails, hard deadlines)
- `priority 2` — do this week (follow-ups, thank-yous)
- `priority 3` — do when able (debriefs, applications, snoozed items resurfacing)
- NULL — unranked, treat as lowest

## Snooze

Set `snooze_until` (ISO date) to hide an item until that date. When querying active items:

```sql
SELECT id, description, priority, due_date, snooze_until
FROM action_items
WHERE completed = 0
  AND (snooze_until IS NULL OR snooze_until <= date('now'))
ORDER BY priority ASC NULLS LAST, due_date ASC NULLS LAST;
```

## Display sort order

1. Priority ASC (1 first, NULL last)
2. Due date ASC (earliest first, NULL last)
3. Created date ASC

## Data conventions

- **Interview times** are always stored as 24-hour ET in the database (e.g. `14:00`, `16:30`). AM/PM conversion happens on the frontend/display layer only.
- **Debriefed flag** on interviews tracks whether a post-interview debrief has been captured (`debriefed = 1`).
