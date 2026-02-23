# Spec: v1 — Job Search Tracking via Markdown + Claude Code Automation

## Overview

Build a personal job search operating system that runs entirely through Claude Code. The system uses markdown files as the data layer, Claude Code slash commands as the automation API, and custom skills to enforce values and conventions. No database, no UI — just a well-structured file system and Claude as the orchestration layer.

The user (Cameron Spencer) is running a multi-company job search and needs to:
- Track companies through a pipeline (researching → applied → interviewing → offer/rejected)
- Prepare for interviews with company-specific context
- Debrief after interviews while details are fresh
- Get a daily briefing of what needs attention
- Maintain consistent values across all communication

## Project Structure

Create the following directory structure at the root of the project:

```
job-search/
├── .claude/
│   ├── commands/           # Slash commands (the automation API)
│   │   ├── new-company.md
│   │   ├── prep.md
│   │   ├── daily-prep.md
│   │   ├── debrief.md
│   │   └── track.md
│   ├── skills/             # Skills (system-prompt-level context for Claude)
│   │   ├── action-items/
│   │   │   └── SKILL.md
│   │   └── values/
│   │   │   └── SKILL.md
│   ├── settings.json       # Global permissions (read-only MCP tools)
│   └── settings.local.json # Extended local permissions (bash, web fetch, etc.)
├── companies/
│   ├── _template/          # Blueprint for new company folders
│   │   ├── README.md
│   │   └── interview-notes.md
│   └── <company-slug>/    # One folder per company, created by /new-company
│       ├── README.md
│       └── interview-notes.md
├── prep/                   # Reusable interview prep materials
│   ├── behavioral.md       # STAR stories mapped to themes
│   ├── system-design.md    # Design patterns, framework, practice problems
│   ├── coding.md           # Algorithm prep, language preferences, practice plan
│   ├── questions-to-ask.md # Questions by stage and interviewer role
│   └── mcp-talking-points.md # Talking points for AI/MCP-related companies
├── resume/
│   └── long.md             # Full resume in markdown
├── tracker.md              # Pipeline overview (auto-maintained by /track)
├── .mcp.json               # Google Workspace MCP configuration
└── .gitignore
```

## File Specifications

### `.gitignore`

```
.DS_Store
.env*
companies/
!companies/_template/
tracker.md
scripts/logs/
.mcp.json
```

Key decisions:
- Company folders are gitignored because they contain personal/sensitive data (contact info, interview notes, recruiter names)
- The `_template/` folder is explicitly un-ignored so the blueprint is version-controlled
- `tracker.md` is auto-generated and contains personal pipeline data
- `.mcp.json` contains OAuth credentials and must never be committed

### Company Template: `companies/_template/README.md`

```markdown
# {Company Name}

## Position

| Field | Details |
|-------|---------|
| **Title** | |
| **Level** | |
| **Location** | |
| **Salary Range** | |
| **Job Posting** | |

## Status

| Field | Details |
|-------|---------|
| **Stage** | researching |
| **Applied** | |
| **Screen** | |
| **Interview** | |
| **Next Step** | |

## Key Contacts

| Name | Title | Notes |
|------|-------|-------|
| | | |

## Company Research

### What They Do


### Tech Stack


### Recent News


## Why This Role

*What specifically attracts me to this opportunity.*

## Fit Assessment

### Strengths I Bring


### Gaps / Concerns


### Questions to Answer Before Applying

```

### Company Template: `companies/_template/interview-notes.md`

```markdown
# Interview Notes — {Company Name}

## Interview Details

| Field | Details |
|-------|---------|
| **Date** | |
| **Type** | |
| **Interviewer(s)** | |
| **Duration** | |

## Questions Asked

1.

## My Responses (Key Points)

1.

## What Went Well


## What Could Improve


## Signals

*How did it feel? Positive/negative indicators from the interviewer.*

## Follow-Up Actions

- [ ]
```

---

## Slash Commands

Each slash command is a markdown file in `.claude/commands/` that Claude Code executes as an automated workflow. Commands accept arguments via the `$ARGUMENTS` placeholder.

### `/new-company` — Add a company to the pipeline

**File:** `.claude/commands/new-company.md`

**Arguments:** `<company-name> [job-posting-url]` — company name is required (kebab-case), URL is optional.

**Behavior:**

1. **Create the company folder:**
   - Copy `companies/_template/` to `companies/<company-name>/`
   - Replace all `{Company Name}` placeholders with the display name (derived from the slug: `elise-ai` → `EliseAI`, `solace` → `Solace`)

2. **If a job posting URL was provided:**
   - Fetch the job posting page using WebFetch
   - Extract: job title, level, location, salary range, requirements, responsibilities
   - Fill in the Position table in the company README
   - Identify key skills and requirements for the fit assessment

3. **Research the company:**
   - Web search for the company: what they do, tech stack, recent news, funding, company size
   - Fill in the Company Research section of the README

4. **Generate fit assessment:**
   - Read `resume/long.md` (Cameron's full resume)
   - Compare Cameron's experience against the role requirements
   - Fill in the Fit Assessment section: Strengths I Bring, Gaps/Concerns, Questions to Answer
   - Be honest about gaps — this is internal prep, not employer-facing

5. **Check Gmail (if Google Workspace MCP is available):**
   - Search Gmail for existing correspondence with this company or its recruiters
   - Note any relevant context in the README

6. **Output a summary** of what was created and key findings

### `/prep` — Generate interview preparation

**File:** `.claude/commands/prep.md`

**Arguments:** `<company-name> [interview-type]` — type is one of: `phone-screen`, `technical`, `system-design`, `behavioral`, `hiring-manager`. Defaults to general prep if omitted.

**Behavior:**

1. **Load context:**
   - Read `companies/<company-name>/README.md` for company details, fit assessment, contacts
   - Read `resume/long.md` for experience reference
   - Read the relevant prep file(s) from `prep/` based on interview type:
     - Phone screen → `questions-to-ask.md`
     - Technical → `coding.md`
     - System design → `system-design.md`
     - Behavioral → `behavioral.md`
     - Hiring manager → `questions-to-ask.md`

2. **Web research:**
   - Search for common interview questions at this company (Glassdoor, Blind, etc.)
   - Search for recent company news or product launches to reference in conversation

3. **Generate type-specific prep:**

   **Phone Screen:**
   - "Tell me about yourself" script tailored to this role (not generic)
   - Salary expectations framing (based on research + what's in the README)
   - Key questions to ask the recruiter (genuine, values-aligned per the values skill)
   - Red/green flags to watch for

   **Technical:**
   - Relevant coding patterns for the company's tech stack
   - Take-home vs. live coding tips specific to their known format
   - System design questions likely for their domain

   **System Design:**
   - 2-3 design problems relevant to what this company actually builds
   - Walk through each using the framework from `prep/system-design.md`
   - Highlight relevant experience from the resume

   **Behavioral:**
   - Map STAR stories from `prep/behavioral.md` to the questions most likely for this role
   - Prepare stories that address any gaps identified in the fit assessment
   - Practice framing for "why are you leaving" and "why this company"

   **Hiring Manager:**
   - Questions that show strategic thinking about their team/product
   - How to frame leadership experience for their context
   - Discussion points around team building, process, and technical vision

4. **Output the prep brief** in a clear, scannable format with sections for quick pre-interview review

### `/daily-prep` — Morning briefing

**File:** `.claude/commands/daily-prep.md`

**Behavior:**

1. **Check today's calendar (if Google Workspace MCP is available):**
   - List today's events from Google Calendar
   - Identify interviews or job-search-related meetings
   - For each interview, match it to a company folder

2. **Generate interview prep briefs:**
   - For each interview today, read the company folder and linked prep materials
   - Generate a focused prep brief: key talking points, expected questions, questions to ask, company context refresh

3. **Check email (if MCP available):**
   - Search Gmail for recruiter emails from the last 24 hours
   - Summarize new messages and flag anything needing a reply

4. **Pipeline health check:**
   - Scan all `companies/*/README.md` files
   - Flag stale items: companies with no activity in 7+ days that aren't in a terminal stage (rejected/ghosted/accepted)
   - Suggest follow-up actions for stale items

5. **Output formatted daily briefing:**

   ```
   ## Daily Job Search Briefing — {today's date}

   ### Upcoming Interviews
   (today's interviews with prep briefs)

   ### New Messages
   (email summaries, if MCP available)

   ### Pipeline Health
   (active count, stale items, suggested actions)

   ### Action Items
   (follow-ups needed, ordered by urgency)
   ```

### `/debrief` — Post-interview capture

**File:** `.claude/commands/debrief.md`

**Arguments:** `<company-name>` (required, kebab-case)

**Behavior — interactive Q&A, one question at a time:**

1. **Load context:** Read `companies/<company-name>/README.md`

2. **Ask the following questions sequentially:**
   - What type of interview was this? (phone screen, technical, behavioral, system design, hiring manager)
   - Who did you interview with? (name and title if known)
   - How long did it last?
   - What questions did they ask? (collect one by one, ask "any more?" after each)
   - How do you think your responses went? Any you'd answer differently?
   - What went well?
   - What could have gone better?
   - What signals did you pick up — positive or negative?
   - What's the expected next step or timeline?
   - Any follow-up actions needed? (thank you email, additional materials, etc.)

3. **After collecting responses:**
   - Write the debrief to `companies/<company-name>/interview-notes.md` (append if existing entries)
   - Update the company README status section (stage, next step)

4. **Create follow-up action items** (skill-aware):
   - Only create items that pass the action-items skill's validity test
   - Valid: thank-you emails, requested materials, scheduling responses
   - Never: "waiting for X", interview prep, vague items

5. **Flag concerns:** Surface any red flags worth discussing before the next round

### `/track` — Pipeline visibility

**File:** `.claude/commands/track.md`

**Arguments (optional):** `<company-name> <stage> [notes]`

**Update mode (with arguments):**
1. Update the company README status section with the new stage
2. Log the change and confirm

**Overview mode (no arguments):**
1. Scan all `companies/*/README.md` files (skip `_template`)
2. Parse the Status table from each README to extract stage, dates, next step
3. Display formatted pipeline:

   ```
   ## Job Search Pipeline — {today's date}

   ### Active ({count})
   | Company | Role | Stage | Last Activity | Next Step |
   ...

   ### Completed ({count})
   | Company | Role | Outcome | Date |
   ...

   ### Stats
   - Applications sent: X
   - In active interviews: X
   - Offers: X
   - Response rate: X%
   ```

4. **Flag action items:** stale applications, upcoming interviews, follow-ups needed

---

## Skills

Skills are markdown files that act as system-prompt-level context for Claude. They're not executable — they shape Claude's behavior when referenced by slash commands or triggered by matching user intent.

### Action Items Skill

**File:** `.claude/skills/action-items/SKILL.md`

```markdown
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

## Display sort order

1. Priority ASC (1 first, NULL last)
2. Due date ASC (earliest first, NULL last)
3. Created date ASC
```

### Values Skill

**File:** `.claude/skills/values/SKILL.md`

Defines Cameron's work preferences for fit assessment. Core values:
- **Impact over headcount:** Small teams, individual contributions matter. Big-company bureaucracy is a dealbreaker.
- **Product voice:** Wants a seat at the table for product direction, not just executing tickets.
- **AI-forward:** Strongly prefers companies leaning into AI tooling.
- **High trust and autonomy:** Goal + freedom to figure it out. Micromanagement is a non-starter.
- **Work ethic with boundaries:** Happy to crunch, but weekends and vacation are protected.

Applied when evaluating companies, writing cover letters, crafting interview questions, and assessing red flags.

---

## Claude Code Settings

### `.claude/settings.json` (Global — committed)

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "mcp__google-workspace__calendar_get_events",
      "mcp__google-workspace__calendar_get_event_details",
      "mcp__google-workspace__query_gmail_emails",
      "mcp__google-workspace__gmail_get_message_details"
    ]
  }
}
```

Read-only access to Gmail and Calendar. No write operations — Claude can read your schedule and emails but can't send anything on your behalf.

### `.claude/settings.local.json` (Local — gitignored)

Extended permissions for local operations: bash commands (git, npm, sqlite3, npx tsx), WebFetch on specific job board domains (greenhouse.io, LinkedIn, etc.). This file is not committed because it contains domain-specific fetch permissions that are personal.

---

## Google Workspace MCP Integration

### `.mcp.json` (gitignored)

```json
{
  "mcpServers": {
    "google-workspace": {
      "type": "stdio",
      "command": "uvx",
      "args": ["--from", "google-workspace-mcp==2.0.1", "google-workspace-worker"],
      "env": {
        "GOOGLE_WORKSPACE_CLIENT_ID": "<your-client-id>",
        "GOOGLE_WORKSPACE_CLIENT_SECRET": "<your-client-secret>",
        "GOOGLE_WORKSPACE_REFRESH_TOKEN": "<your-refresh-token>",
        "GOOGLE_WORKSPACE_ENABLED_CAPABILITIES": "[\"gmail\", \"calendar\"]"
      }
    }
  }
}
```

- Version-pinned to `2.0.1` for reproducibility
- Gmail and Calendar only (no Drive, Docs, Sheets, or Slides)
- OAuth credentials stored as env vars in the JSON (file is gitignored)
- All slash commands gracefully degrade if MCP is unavailable — they skip email/calendar steps and note it in output

---

## Prep Materials

These are personal reference documents that Claude reads during `/prep` and `/daily-prep`. They should be populated with the user's actual experience.

### `prep/behavioral.md`
STAR stories organized by theme: Leadership & Influence, Technical Problem Solving, Delivery Under Pressure, Innovation & Initiative, Entrepreneurship. Each story has Situation, Task, Action, Result — written in first person.

### `prep/system-design.md`
Design patterns the user knows well (event-driven architecture, data platforms, AI/LLM systems, etc.), practice topics, the answering framework (clarify → high-level → API → data → deep dive → scale), and key performance numbers to remember.

### `prep/coding.md`
Preferred languages, topic areas (arrays, hash maps, trees, DP, etc.), practice plan (LeetCode 75, NeetCode 150), SQL patterns (window functions, CTEs, self-joins).

### `prep/questions-to-ask.md`
Questions organized by interview stage (phone screen, technical, hiring manager) and by what they reveal (culture, technical decisions, growth, etc.).

---

## Design Principles

1. **Markdown is the database.** Company folders with structured READMEs are the source of truth. No external dependencies required.

2. **Slash commands are the API.** All automation goes through five well-defined commands. Each is a self-contained markdown prompt that Claude executes.

3. **Skills shape behavior, not flow.** Voice, values, and action-item conventions are system-level context — Claude references them when relevant but they don't control execution order.

4. **Graceful degradation.** Every command works without MCP. Calendar and email features enhance the experience but aren't required.

5. **Privacy by default.** Company-specific data (names, contacts, notes) is gitignored. Only the template and automation are version-controlled.

6. **Honest fit assessment.** The system is for Cameron's internal use. Fit assessments flag real gaps, not just strengths. This makes prep more targeted and interviews more authentic.
