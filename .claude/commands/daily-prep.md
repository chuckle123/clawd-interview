Generate a daily job search briefing.

**Skill reference:** Follow `.claude/skills/action-items/SKILL.md` conventions for action item display and filtering.

## Steps

1. **Load pipeline from database:**
   - Reference `data/schema.sql` for the database schema
   - Query `data/job-search.db` using `sqlite3` for pipeline data:
     - Active companies and their jobs with current stages
     - Upcoming and recent interviews
     - Recent job events

2. **Check today's calendar (if MCP available):**
   - List today's events from Google Calendar
   - Identify any interviews or job-search-related meetings
   - For each interview found, match it to a company in the database

3. **Generate interview prep briefs:**
   - For each interview today, query the company details and linked notes from the database
   - Read the company's folder and linked notes
   - Read relevant prep materials from `prep/`
   - Generate a focused prep brief: key talking points, questions to expect, questions to ask, company context refresh

4. **Check email (if MCP available):**
   - Search Gmail for recent recruiter emails (last 24 hours)
   - Summarize any new messages, responses, or action items
   - Flag anything that needs a reply

5. **Pipeline health check:**
   - From the pipeline data, identify stale items (no activity in 7+ days, not in rejected/ghosted/accepted)
   - Suggest follow-up actions for stale items

6. **Output a formatted daily briefing:**

   ```
   ## Daily Job Search Briefing — {today's date}

   ### Upcoming Interviews
   (today's interviews with times displayed in AM/PM ET, converted from 24h stored format)
   (prep briefs for each)

   ### Needs Debrief
   (query: SELECT i.*, c.name FROM interviews i JOIN jobs j ON i.job_id = j.id JOIN companies c ON j.company_id = c.id WHERE i.status = 'completed' AND i.debriefed = 0)
   (list company name, interview type, date — prompt Cameron to run /debrief)

   ### New Messages
   (email summaries)

   ### Pipeline Health
   (active count, stale items, suggested actions)

   ### Action Items
   (query active items using the skill's snooze-aware query — exclude snoozed, sort by priority then due date)
   ```

If calendar/email MCP tools are not available, skip those sections gracefully and note they'll be available after MCP setup.
