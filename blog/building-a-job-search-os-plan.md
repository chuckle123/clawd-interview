# BLOG PLAN: Building a Job Search OS With Claude

**Target length:** ~3,000 words
**Tone:** Builder log. Honest about what works and what doesn't. Show the iterations, not just the final product.
**Angle:** Not "I automated my job search." It's "I built a system that handles the parts of job searching that don't require me, so I can focus on the parts that do." Emphasize the iterative, unstructured-first approach — starting loose, discovering what matters, then structuring around it.

---

## Working Title Options

1. "I Built a Job Search OS That Knows My Calendar and What I'm Looking For"
2. "The Job Search Has a Tooling Problem"
3. "Building an AI-Powered Job Search OS — From Slash Commands to Scheduled Briefings"

---

## Structure

### Opening (~300 words)

The job search is one of the most high-stakes, low-tooling workflows in a professional's life. You're managing 5-15 parallel processes (companies), each with different stages, different contacts, different prep requirements, different timelines. You're doing research, writing cover letters, scheduling interviews, sending follow-ups, debriefing after calls, tracking who said what — and doing it all while trying to actually *perform well* in the interviews themselves.

Most people manage this with a spreadsheet and their inbox. Maybe a Notion board. It works until you're juggling 8 companies at different stages and you can't remember whether you already sent the thank-you email to the hiring manager at Company C or what the VP of Engineering at Company D said about their tech stack migration.

I'm a staff engineer who builds tools for a living. So I built one for myself.

This isn't a polished product post. It's a build log — what I've built so far, what's working, what I want to build next, and the design decisions (and mistakes) along the way. I'll walk through the iterations because the iterative process itself is the point. I didn't sit down with a grand vision and execute it. I started loose, captured everything, and let what I captured tell me what to build next.

**A note on the process itself:** I keep a `specs/` folder in the repo — markdown files that capture each version of the plan as I pivot. Not because I need formal specs, but because looking back at how the project evolved tells you as much as looking at where it ended up. You can trace the thinking: what I assumed I'd need, what I actually needed, and where those two things diverged.

---

### Iteration 1: Give Claude Context About Me (~500 words)

**What I built:** A layer of persistent context and repeatable workflows using two Claude Code features: **skills** and **commands**.

These are worth explaining because they're the architectural foundation everything else builds on.

**Skills** are markdown files that live in `.claude/skills/`. They define persistent context — things Claude should always know or always reference when doing certain kinds of work. They're not prompts you invoke. They're background knowledge that Claude pulls in when relevant. I have two:

- **Values** (`values/SKILL.md`): What I care about in a role — impact over headcount, product voice, AI-forward environment, high trust and autonomy. When Claude evaluates a company or generates a fit assessment, it references these to flag alignment or red flags. A role at a 10,000-person company with rigid process gets flagged as a poor fit even if the tech stack matches.
- **Action Items** (`action-items/SKILL.md`): Conventions for what counts as an action item (and what doesn't), priority levels, snooze behavior, sort order. This keeps the system from generating noise — "waiting for recruiter to respond" is pipeline status, not an action item.

**Commands** are markdown files in `.claude/commands/`. They define workflows — multi-step processes that Claude executes when I invoke them with a slash command. Each command is essentially a runbook: here's what to do, in what order, using what tools. The commands reference the skills where relevant. For example, `/debrief` references the action-items skill to decide what follow-ups to create, and `/new-company` references the values skill when generating fit assessments.

**The commands that exist today:**
- `/new-company <name>` — Research a company, fetch the job posting, generate a fit assessment against my values, create a structured folder, check Gmail for existing correspondence, register everything in the database
- `/prep <company> [type]` — Generate interview prep tailored to the company and interview type (phone screen, technical, system design, behavioral, hiring manager). Pulls from the company folder, my resume, and prep materials
- `/debrief <company>` — Interactive post-interview debrief. Asks me what happened question by question, writes the notes, updates the database, creates follow-up action items
- `/daily-prep` — Morning briefing: today's calendar, unread recruiter emails, pipeline health, overdue action items, interviews needing debrief
- `/track [company] [stage]` — Pipeline overview or update a company's stage

**What this actually does for me:** The boring-but-important work happens automatically. When I add a new company, the research is done, the fit assessment is written, the folder is structured. When I finish an interview, the debrief captures everything while it's fresh. The commands give me repeatable, high-quality execution. The skills give Claude the context to make that execution actually good — tuned to my values and my conventions.

**The insight:** The separation between skills and commands turned out to matter more than I expected. Skills are the *who* — my identity, my preferences, my standards. Commands are the *what* — the workflows that use that identity. When I add a new skill (like the action-items conventions), every command that touches action items immediately gets better without being rewritten. The context compounds.

---

### Iteration 2: Connecting to Real Tools — Read-Only by Design (~500 words)

**What I added:** MCP (Model Context Protocol) integrations for Google Calendar and Gmail.

This is where it stops being a fancy prompt and starts being an operating system. Claude can now:
- Check my calendar for upcoming interviews
- Scan my inbox for recruiter emails and scheduling threads
- Cross-reference calendar events with company data to know *which* interview is coming up and *who* I'm meeting with

**Why these tools specifically:** Calendar and email are the two systems where job search activity actually lives. The spreadsheet is a mirror — the real data is in the calendar invite that says "Technical Interview — Acme Corp" and the email thread where the recruiter shared the interview panel.

By connecting Claude to these, the `/daily-prep` command goes from "here's what's in your tracker" to "here's what's actually on your calendar today, here are the emails you haven't responded to, and here's what you need to prep for." It's working from reality, not from a markdown file I might have forgotten to update.

**Read-only was a deliberate architectural decision.** The MCP server I use only exposes read-only tools. Claude can read my calendar and scan my inbox, but it cannot send an email, create a calendar event, or take any outward-facing action on my behalf. This isn't a temporary limitation I plan to remove — it's a design principle.

I don't want AI reaching out on my behalf. Ever. Not to recruiters, not to hiring managers, not to schedule interviews. A stray automated email could end a process. More importantly, the personal, human touch in communication is exactly the thing I *don't* want to automate. That's where my personality comes through. That's what builds the relationship. The system's job is to surface what I need to know and draft things I can review — the send button is always mine.

This extends to future integrations too. LinkedIn is the obvious next connection for the pipeline — pulling in contact backgrounds, mutual connections, company context. But even there, the integration will be read-only. I want richer data for prep, not an AI that sends connection requests.

**The unstructured-first approach:** At this stage, the project was intentionally loose. I started with data capture before I knew exactly what I wanted to build. Markdown files, slash command outputs, debrief notes — all free-form. I didn't impose structure because I didn't yet know what structure would be useful. The idea was: capture everything, use it for a while, and then build around what actually proved helpful. Let the data tell me what to formalize.

This turned out to be the right call. If I'd started with a rigid schema on day one, I would have modeled what I *thought* mattered. By starting unstructured, I discovered what *actually* mattered — and some of it surprised me.

---

### Iteration 3: Structuring the Data (~600 words)

**The problem:** After a few weeks of slash commands and markdown files, I had a pile of useful but unqueryable content. "Show me all companies where I've had a phone screen but haven't scheduled a next round" required reading through every company folder manually.

**What I built:** A local SQLite database with Drizzle ORM — companies, jobs, contacts, interviews, job events, action items, notes, and the relationships between them. A CLI for database operations. The beginning of a Next.js app.

I don't plan to productionalize any of this. It's a local workflow — something I run on my machine, for my job search. No auth, no deployment, no multi-tenancy concerns. That simplicity is a feature, not a limitation. It means I can move fast and make opinionated decisions without worrying about generalizing.

**The hybrid architecture and why it matters:**

The database stores what needs to be queryable: stages, dates, contact info, interview types, company metadata. But the *interesting* data — the fit assessments, the debrief narratives, the nuanced notes about company culture — lives in markdown files linked from the database rows.

This was a deliberate choice. Interview debriefs are loose-form and narrative. "The hiring manager seemed really excited about the AI tooling work but got vague when I asked about team autonomy" — that's the kind of signal that matters most and resists structuring. Forcing it into database columns would either lose the nuance or require a schema so complex it defeats the purpose.

Every company row in the database links to a markdown README. Every interview links to debrief notes. The database tells me *what happened and when*. The markdown tells me *what it meant*. This hybrid approach also shapes how I work with AI — the structured data gives Claude precise context for queries, while the linked markdown gives it the nuance to actually reason about what a company is like or how an interview went.

**The loose-form text driving development:**

Here's the part I didn't expect: the unstructured markdown content is actually driving the structured development. During debriefs, Claude captures things I mention offhandedly — "their stack is migrating from X to Y," "the team lead mentioned they're hiring 3 more engineers this quarter," "the office is hybrid 2 days a week." These details don't fit cleanly into predefined columns, but they accumulate into a rich picture.

Reading back through these notes reveals *patterns* that suggest new features. "I keep noting team size in debriefs — maybe that should be a queryable field." "I keep referencing what interviewers said about engineering culture — maybe there should be a culture signals table." The unstructured data is a backlog generator. The specs folder captures these pivots — you can see the schema evolve as the unstructured data reveals what needs to be formalized.

**Validating the capture:** The structured data also serves as a sanity check. When everything lives in markdown, it's easy for things to slip through the cracks — a debrief you forgot to do, a follow-up email that fell off. The database gives me a concrete view: this interview happened, it hasn't been debriefed, here are the action items that are overdue. Structure makes the gaps visible.

---

### Iteration 4: The UI (and the Real Reason for It) (~400 words)

**What I'm building:** A Next.js dashboard — calendar view with upcoming interviews, action item lists, pipeline overview.

**The honest motivation:** I'm comfortable in the terminal. The slash commands and CLI work fine for me. But I'm building the UI for two reasons, and neither of them is "I need a pretty dashboard."

**Reason 1: Cron.** The Next.js server gives me an easy, accessible place to run scheduled tasks. The `/daily-prep` command works great, but I have to remember to run it. A cron job on the Next.js server can check my calendar, detect upcoming interviews, and proactively generate prep — push-based instead of pull-based. The UI is almost secondary to having a persistent server process. This is the difference between a tool I use and a system that works for me.

**Reason 2: Accessibility for others.** I don't mind reading pipeline data from a terminal, but I don't think most people prefer that. If this project is going to show off the workflow — or if I want to share the approach — a visual interface makes it legible. A calendar view with your interviews, a list of action items sorted by priority, a company detail page with the full narrative — that's immediately understandable in a way that `sqlite3 data/job-search.db "SELECT ..."` is not.

I'm still not entirely sure the UI is the right investment of time versus just improving the CLI. But the structured data needs validation — I need to see that everything is being captured properly, that the pipeline stages make sense, that the action items are surfacing at the right time. A visual interface makes that validation faster than scrolling through terminal output.

**The stack:** Next.js 15, React 19, Tailwind, better-sqlite3 via Drizzle ORM. Server components reading directly from the local SQLite database. No API layer, no client-side fetching — the simplest architecture that works for a local-only tool.

---

### What I Want to Build Next (~400 words)

**Scheduled briefings (cron-driven prep):**

The vision: 30 minutes before any interview on my calendar, the system detects it, pulls the company context, generates a focused prep brief, and surfaces it — either as a notification or in a chat interface where I can ask follow-up questions. No manual `/prep` invocation. The system knows what's coming and prepares me proactively.

This is the immediate next step. The Next.js server is set up, the database has the interview data, the calendar MCP is connected. The cron is the piece that ties it all together.

**LinkedIn integration (read-only):**

The missing connection in the pipeline. Being able to pull in a contact's LinkedIn profile when prepping for an interview — seeing their background, what they've written about, mutual connections — would make prep significantly richer. Same read-only principle as Gmail and Calendar. I want richer data going in, not AI acting on my behalf going out.

**Transcript ingestion for faster debriefs:**

Today, `/debrief` is an interactive conversation where Claude asks me what happened. It works, but it depends on my memory and willingness to be thorough right after an interview (when I'm usually tired and want a break).

If I could paste or upload an interview transcript — from Zoom, Otter.ai, whatever — Claude could extract the key moments, flag things I should follow up on, and draft the debrief notes for me to review and edit. The debrief goes from a 15-minute Q&A to a 3-minute review. The quality goes up because it's working from the actual conversation, not my post-hoc summary.

---

### The Philosophy: Automate the Process, Keep the Person (~400 words)

The point of this system isn't to automate the job search. The point is to automate the parts of the job search that don't showcase who I am — so I can focus entirely on the parts that do.

The goal is to broaden my search. Take on more interviews than I'd normally be able to handle, at a higher quality. Not because the AI is doing the interviews for me, but because it's handling everything that gets in the way of performing well in them. Research, scheduling logistics, follow-up tracking, prep generation — that's overhead. Necessary overhead, but overhead. Every hour I spend on it is an hour I'm not spending on actual interview preparation, studying system design, or sharpening the knowledge that actually gets evaluated.

The stuff I'm automating: company research aggregation, calendar monitoring, email tracking, follow-up reminders, prep document generation, pipeline tracking. These are important — miss a follow-up and you lose an opportunity — but they're not what gets you the job. They're *table stakes*.

The stuff I'm NOT automating: the actual interviews, the relationship building, the judgment calls about which companies to pursue, the negotiation, the career decision. These are the human parts. They're where my experience and personality actually matter. They're what the company is evaluating.

This is also a project that demonstrates a skill I think matters: identifying which parts of a process can be automated and which shouldn't be. It's easy to automate everything. It's harder — and more valuable — to draw the line in the right place. The read-only MCP decision, the human-in-the-loop for all outbound communication, the unstructured-first data approach — these are all judgment calls about where automation helps and where it hurts.

The system's job is to make sure the table stakes are always handled so I can focus entirely on performing well in the moments that matter. If I'm spending 30 minutes the morning of an interview researching the company because I forgot to prep, that's 30 minutes of cognitive load that should have been zero. If I'm stressing about whether I sent the thank-you email, that's attention that should be on preparing for tomorrow's interview.

---

### Closing (~200 words)

I'll open-source this when it's further along. Right now it's tailored to my specific workflow — my resume, my values, my Google account. But the architecture generalizes: skills for persistent context, MCP for tool integration, hybrid database for structured + unstructured data, scheduled automation for proactive briefings.

The iterative approach is the thing I'd encourage anyone to steal from this. Don't design the schema first. Don't plan the UI first. Start capturing. Use it. See what you actually reach for, what falls through the cracks, what you wish you could query. Then build the structure around that. The specs folder in this repo tells that story — each version of the plan is a snapshot of what I'd learned so far.

If you're a software engineer looking for work, you're already building software every day. The job search is a workflow problem. Build a system for it.

Link to the repo when ready. Invite feedback on the architecture.

---

## BANNER IMAGE BRIEF

- Concept: An "operating system" interface for job searching. A clean dashboard showing multiple company pipelines at different stages, a calendar with interview events highlighted, an inbox with recruiter threads, and a chat interface where Claude is surfacing a prep brief. Not a screenshot — an illustrated, idealized version.
- Style: Dark background, clean UI wireframe aesthetic. Blue/purple accent colors.
- Elements: Kanban-style pipeline, calendar widget, email indicators, chat/prep panel, company cards
- Text overlay: Working title
- Dimensions: 1200x630

---

## Notes

- This is the most personal of the blog posts. It's about a real system solving a real problem right now. Lean into that.
- Show real command output or slash command examples if possible (sanitize company names).
- The "structured vs. unstructured" tension is genuinely interesting and relatable to anyone who's built data systems. Don't rush past it.
- Avoid making it sound like the system is doing the job search *for* you. The framing is augmentation, not automation. You're still the one interviewing, deciding, and negotiating.
- The NoSQL question from the earlier draft has been removed — the hybrid architecture is working and the tone should reflect confidence in the approach, not second-guessing.
- Reference the other blog posts where relevant — the MCP article (real project proving the architecture), the Socratic series (Claude as thinking partner, not just executor).
- The iterative journey is a key narrative thread. The specs folder, the unstructured-first approach, the pivot from capture to structure to UI — this is the story of how the project evolved, not a feature list.
- The read-only MCP decision should land as a principled choice, not a technical limitation. It's about trust and boundaries, not missing features.
- The cron-as-motivation-for-UI is an honest and relatable detail. Include it — engineers will recognize the "I built a whole UI to get a cron job" pattern.
