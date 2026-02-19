# Job Search Toolkit

A set of [Claude Code](https://docs.anthropic.com/en/docs/claude-code) slash commands to help manage the grunt work of a job search — company research, interview prep, pipeline tracking, and post-interview notes — so you can focus on the conversations that actually matter.

You still do the networking, the interviews, and the decision-making. This just handles the busywork around it.

## What's in here

Five slash commands, each backed by your resume and prep materials so the output is specific to you:

| Command | What it does |
|---------|-------------|
| `/new-company` | Researches a company, reads the job posting, and writes a structured brief with a fit assessment against your resume |
| `/prep` | Generates a tailored interview prep brief (phone screen, technical, behavioral, system design, or hiring manager) |
| `/daily-prep` | Morning briefing — today's interviews, recruiter emails, pipeline status, and what needs attention |
| `/debrief` | Interactive post-interview capture while details are fresh, then updates your pipeline |
| `/track` | View or update your pipeline in one place |

There are also [skills](https://docs.anthropic.com/en/docs/claude-code/skills) — background context that Claude loads automatically when relevant:

- **values** — Your work preferences and what you're looking for in a role. Loaded when evaluating companies, writing cover letters, or assessing fit.
- **action-items** — Conventions for how action items are prioritized, snoozed, and displayed in the pipeline.

Optionally connects to Google Calendar and Gmail (read-only) so the daily briefing can pull in interviews and recruiter messages automatically.

## Setup

Requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (CLI or IDE extension).

1. Clone the repo
2. Initialize the database:
   ```bash
   mkdir -p data && sqlite3 data/job-search.db < data/schema.sql
   ```
3. Add your resume to `resume/` and your prep materials to `prep/` (behavioral stories, system design notes, coding notes, questions for interviewers)
4. Edit `CLAUDE.md` with your background, skills, and preferences — this is the context that makes everything personal instead of generic
5. Run `claude` and start with `/new-company`
6. `npm install && npm run dev` for the local pipeline dashboard

### Google Workspace Integration (Optional)

The daily briefing can check your calendar and email via the [Google Workspace MCP server](https://github.com/taylorwilsdon/google_workspace_mcp) configured for read-only access. If it's not configured, those sections are skipped. See [Google Workspace Setup](#google-workspace-setup) below for details.

## Project Structure

```
CLAUDE.md                  # Your background and preferences (system prompt)
tracker.md                 # Pipeline overview (maintained by /track)
resume/                    # Your resume
prep/                      # Behavioral stories, system design, coding, interviewer questions
companies/                 # One folder per company (research, fit assessment, interview notes)
data/schema.sql            # Database schema
.claude/commands/          # Slash command definitions (editable markdown)
.claude/skills/            # Background context loaded automatically when relevant
```

## Making it yours

The two files that shape everything are `CLAUDE.md` (who you are) and `prep/` (your interview materials). The better the context, the better the output. The slash commands themselves are just markdown files in `.claude/commands/` — read them, edit them, add your own.

---

## Google Workspace Setup

The MCP server authenticates via Google OAuth. You need a GCP project with an OAuth 2.0 Desktop client.

1. **Create a GCP project** at [console.cloud.google.com](https://console.cloud.google.com/)
2. **Enable APIs:**
   ```bash
   gcloud services enable gmail.googleapis.com calendar-json.googleapis.com
   ```
3. **Create an OAuth 2.0 client** — APIs & Services → Credentials → Create Credentials → OAuth Client ID → Desktop Application
4. **Get a refresh token** via the OAuth consent flow with `gmail.readonly` and `calendar.readonly` scopes
5. **Copy the example config and replace the placeholder values with your credentials:**
   ```bash
   cp .mcp.example.json .mcp.json
   ```
   Then edit `.mcp.json` and replace `${GOOGLE_WORKSPACE_CLIENT_ID}`, `${GOOGLE_WORKSPACE_CLIENT_SECRET}`, and `${GOOGLE_WORKSPACE_REFRESH_TOKEN}` with your actual values. `.mcp.json` is gitignored, so your credentials stay local.

### Security

The integration is locked down at three levels:

- **Server-side** — `.mcp.json` restricts the server to Gmail and Calendar tools only. The OAuth scopes are read-only, so Google's API rejects any write operation. The package version is pinned.
- **Client-side** — `.claude/settings.json` auto-approves only four read-only tools. Any write operation (drafts, sends, deletes) requires manual confirmation.
- **Credentials** — `.mcp.json` is gitignored. Your OAuth tokens never touch version control.
