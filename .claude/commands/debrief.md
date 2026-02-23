---
description: Run an interactive post-interview debrief. Walks through what happened, records the interview, updates the pipeline, and creates follow-up action items.
argument-hint: <company-name>
---

Run an interactive post-interview debrief for a company.

**Skill reference:** Follow `.claude/skills/action-items/SKILL.md` conventions when creating action items.

Arguments: $ARGUMENTS
The first argument is the company name (required, kebab-case).

## Steps

1. **Load context:**
   - Reference `data/schema.sql` for the database schema
   - Query `data/job-search.db` using `sqlite3` for company info, contacts, interviews, notes, and events
   - Read `companies/<company-name>/README.md` for full narrative context

2. **Conduct the debrief interactively — ask one question at a time:**
   - What type of interview was this? (phone screen, technical, behavioral, system design, hiring manager)
   - Who did you interview with? (name and title if known)
   - How long did it last?
   - What questions did they ask? (collect these one by one, ask "any more?" after each)
   - How do you think your responses went? Any you'd answer differently?
   - What went well?
   - What could have gone better?
   - What signals did you pick up — positive or negative?
   - What's the expected next step or timeline they mentioned?
   - Any follow-up actions needed? (thank you email, additional materials, etc.)

3. **After collecting responses:**
   - Insert the interview record into `data/job-search.db`:
     ```sql
     INSERT INTO interviews (job_id, interview_date, type, round_number, status)
     VALUES (<job_id>, '<date>', '<type>', <round>, 'completed');
     ```
   - Write the debrief to `companies/<company-name>/interview-notes.md` (append if entries exist)
   - Update the job stage if appropriate:
     ```sql
     UPDATE jobs SET stage = '<new-stage>', updated_at = datetime('now') WHERE id = <job_id>;
     INSERT INTO job_events (job_id, event_type, from_value, to_value) VALUES (<job_id>, 'stage_change', '<old>', '<new>');
     ```
   - Update the company README status section
   - **Mark the interview as debriefed:**
     ```sql
     UPDATE interviews SET debriefed = 1 WHERE id = <interview_id>;
     ```

4. **Add contacts if new people were mentioned:**
   - For any new interviewer not already in the database:
     ```sql
     INSERT INTO contacts (company_id, name, title, type) VALUES (<company_id>, '<name>', '<title>', 'interviewer');
     ```
   - Link them to the interview via `interview_participants`

5. **Create follow-up action items (skill-aware):**
   - Only create items that pass the "IS an action item" test from the action-items skill
   - Valid follow-ups: thank-you emails, requested materials, scheduling responses
   - Do NOT create: interview prep items, "waiting for X" status entries, vague "keep on radar" items
   - Set `priority` per the skill conventions (e.g. thank-you email = priority 2)
   - Flag any concerns or red flags worth discussing
