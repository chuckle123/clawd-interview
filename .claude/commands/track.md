View or update the job search pipeline.

Arguments: $ARGUMENTS
Optional arguments: `<company-name> <stage> [notes]` to update a specific company's stage.

## Behavior

### If arguments are provided (update mode):
1. Reference `data/schema.sql` for the database schema. Update the job stage in `data/job-search.db`:
   ```sql
   UPDATE jobs SET stage = '<stage>', updated_at = datetime('now') WHERE id = (
     SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE c.slug = '<company-name>' LIMIT 1
   );
   INSERT INTO job_events (job_id, event_type, from_value, to_value, notes)
   VALUES (<job_id>, 'stage_change', '<old-stage>', '<stage>', '<notes>');
   ```
2. Update `companies/<company-name>/README.md` status section
3. Confirm the update

### If no arguments (overview mode):
1. **Get pipeline from database:**
   - Reference `data/schema.sql` for the database schema
   - Query `data/job-search.db` using `sqlite3` for all companies with their jobs, stages, recent events, and stats

2. **Cross-reference with company folders:**
   - Read all `companies/*/README.md` files (skip `_template`)
   - Flag any discrepancies between DB and markdown (folder is source of truth)
   - If a company folder exists but isn't in DB, flag it for manual addition

3. **Display formatted pipeline:**

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

4. **Flag action items:**
   - Stale applications (no response in 7+ days)
   - Upcoming interviews
   - Follow-ups needed
