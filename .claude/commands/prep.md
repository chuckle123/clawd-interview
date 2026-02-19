Generate comprehensive interview preparation for a specific company.

Arguments: $ARGUMENTS
The first argument is the company name (required, kebab-case). The second argument is the optional interview type: `phone-screen`, `technical`, `system-design`, `behavioral`, `hiring-manager`. Defaults to general prep if not specified.

## Steps

1. **Load context:**
   - Reference `data/schema.sql` for the database schema
   - Query `data/job-search.db` using `sqlite3` for company info, tech stack, contacts, interviews, notes, and events
   - Read `companies/<company-name>/README.md` for full narrative context
   - Read `resume/cameron_spencer_resume.pdf` for experience reference
   - Query the `notes` table for linked notes and read the referenced files
   - Read relevant files from `prep/` based on interview type

2. **Web research:**
   - Search for common interview questions at this company (Glassdoor, Blind, etc.)
   - Search for recent company news or product launches to reference in conversation

3. **Generate prep based on interview type:**

   **Phone Screen:**
   - "Tell me about yourself" script tailored to this role
   - Salary expectations framing
   - Key questions to ask the recruiter
   - Red/green flags to watch for

   **Technical:**
   - Relevant coding patterns for this company's stack (use tech stack from DB)
   - Take-home or live coding tips specific to their tech
   - System design questions likely for their domain

   **System Design:**
   - 2-3 design problems relevant to what this company builds
   - Walk through my approach for each using the framework in `prep/system-design.md`
   - Highlight relevant experience from my resume

   **Behavioral:**
   - Map STAR stories from `prep/behavioral.md` to likely questions for this role
   - Prepare stories that address any gaps in the fit assessment
   - Practice framing for "why are you leaving" and "why this company"

   **Hiring Manager:**
   - Questions that show strategic thinking about their team/product
   - How to frame my leadership experience for their context
   - Discussion points around team building, process, technical vision

4. **Output the prep brief** in a clear, scannable format with sections the candidate can quickly review before the interview.
