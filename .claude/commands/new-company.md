---
description: Add a new company to the job search pipeline. Creates the company folder, registers it in the database, researches the company, and generates a fit assessment.
argument-hint: <company-name> [job-posting-url]
---

Add a new company to the job search pipeline.

Arguments: $ARGUMENTS
The first argument is the company name (required, kebab-case). The second argument is an optional job posting URL.

## Steps

1. **Create the company folder:**
   - Copy the contents of `companies/_template/` to `companies/<company-name>/`
   - Replace all `{Company Name}` placeholders with the actual company name

2. **Register in the database:**
   - Reference `data/schema.sql` for the database schema
   - Insert the company into `data/job-search.db` using `sqlite3`:
     ```sql
     INSERT INTO companies (slug, name) VALUES ('<company-name>', '<Company Display Name>');
     ```
   - Insert the initial job record with stage='researching'

3. **If a job posting URL was provided:**
   - Fetch the job posting using web fetch
   - Extract: job title, level, location, salary range, requirements, responsibilities
   - Fill in the Position table in the company README
   - Identify key skills and requirements for the fit assessment

4. **Research the company:**
   - Web search for the company: what they do, tech stack, recent news, funding, size
   - Fill in the Company Research section of the README

5. **Generate fit assessment:**
   - Read `resume/cameron_spencer_resume.pdf`
   - Compare Cameron's experience against the role requirements
   - Fill in the Fit Assessment section (Strengths I Bring, Gaps/Concerns, Questions to Answer)
   - Be honest about gaps — this is for internal prep, not for the employer

6. **Check Gmail (if MCP available):**
   - Search Gmail for any existing correspondence with this company or its recruiters
   - Note any relevant context in the README

7. **Link notes in database:**
   - Insert note records into the `notes` table linking the company to its files:
     ```sql
     INSERT INTO notes (company_id, file_path, note_type) VALUES (<company_id>, 'companies/<company-name>/README.md', 'readme');
     INSERT INTO notes (company_id, file_path, note_type) VALUES (<company_id>, 'companies/<company-name>/interview-notes.md', 'interview-notes');
     ```

8. **Output a summary** of what was created and key findings.
