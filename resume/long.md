# Cameron Spencer — Experience Archive

This is not a resume. It's a detailed record of everything I've done at each role — the full context behind each accomplishment so I don't lose it over time. Pull from this when tailoring resumes, writing cover letters, prepping for interviews, or telling stories.

---

## Skills & Tools

**AI & LLM:** Claude Code (skills, sub-agents), MCP, Claude API, Gemini API, Vercel AI SDK, Langfuse, Langchain, Langgraph, Cursor
**Languages & Frameworks:** TypeScript, JavaScript, Python, SQL, React, Next.js, Node.js
**Infrastructure & Data:** Docker, Postgres, dbt, Redis, Azure Event Hub, tRPC, GraphQL, REST, Jest

---

## Token Terminal — Philadelphia, PA
**Staff AI Software Engineer (AI Lead)** — Mar. 2025 – Feb. 2026

First AI hire. This was a 0-to-1 role — building AI products at a blockchain data company, finding product-market fit, and iterating. Much of the work was experimental by nature: figuring out what to build, shipping fast, measuring what analysts actually used, and pivoting when something didn't stick. The story for interviews isn't about optimizing an existing system — it's about navigating ambiguity, making pragmatic technical choices under uncertainty (SQLite over a vector DB, progressive disclosure over context dumping), and shipping agents that real users with real stakes depended on.

**How to frame this role for applied AI:** I took ambiguous problems ("analysts struggle with our data") and figured out the right AI approach. I shipped multiple approaches, learned what worked, iterated, and killed things that didn't. Not everything stuck — that's the job at 0-to-1. The numbers that matter here aren't revenue lifts — they're problem complexity (2PB warehouse, thousands of undocumented tables), who depended on it (top crypto VCs managing $15B+ AUM), and the efficiency of the solutions (10+ tools to 4, 20K tokens to 200).

**Missing numbers to try to recover:** How many analysts used the tools daily/weekly? Time saved per query vs manual exploration? Did query volume increase after agent launch? Any accuracy numbers on text-to-SQL output? Even rough estimates ("cut analyst research time from hours to minutes") would help.

### Text-to-SQL Agent
Engineered a text-to-SQL chat-based agent over a 2PB BigQuery data warehouse, replacing manual exploration of thousands of undocumented tables. Lead with this for applied AI roles — real user pain point, shipped an agent that solved it.

### MCP Server for Blockchain Analytics
Built an MCP server consolidating 10+ analyst tools down to 4, reducing context per call from ~20K to ~200 tokens through progressive disclosure. Relied on by top crypto VCs managing $15B+ AUM. The VC detail proves this wasn't a toy — it was production AI with real stakes.

### Data Warehouse Metadata Automation
Automated table and column description generation across the data warehouse, providing the agent with contextual metadata to improve query accuracy. This is the unsexy work that makes AI reliable in production — applied AI interviewers love this.

### Semantic Discovery Layer
Designed a semantic discovery layer using SQLite and FTS5 full-text search, enabling agents to resolve ambiguous queries across thousands of entities. Shows pragmatic tool choices (SQLite, not a vector DB) to solve a retrieval problem.

### AI Developer Tooling
Created custom AI skills for backlog management and standup generation, and authored reusable context files to accelerate AI-assisted development. Shows hands-on experience developing with AI tools, not just building them.

---

## The Rounds — Philadelphia, PA

### Staff Software Engineer (Tech Lead) — Sep. 2024 - Mar. 2025

#### AI-Assisted Customer Service Platform
Utilized Langchain and tool calling as a reasoning agent to build an AI-assisted customer service platform, servicing common customer requests.

#### Batch Packing & Warehouse Packing Overhaul
Halved warehouse packing times by rolling out a new version of the packing app to support batch sessions. Defined the scope and implemented batch packing functionality within our custom packing application.

#### Headless CMS & Discovery Page
Architected a headless CMS with interchangeable designs and AI-powered content for the Discovery page.

#### Flexible Delivery Days
Proposed and implemented flexible delivery days, increasing average order value by 31%.

#### Warehouse Consolidation
Led the technical implementation for warehouse consolidation, reducing operational costs by 10% weekly.

### Senior Software Engineer II (Tech Lead) — Jun. 2022 – Sep. 2024

#### Custom Packing App
Cut order pack errors by 65% after developing a custom packing app, enabling the delivery of 5MM+ products.

#### Product Catalog Geofencing
Implemented product catalog geofencing, unlocking temperature-controlled and regulated products.

#### TypeScript Migration
Increased TypeScript coverage from 0% to 80% and added test cases across the frontend and backend.

#### AI Champion & Company-Wide Enablement
Served as the company's go-to AI resource. This wasn't just one presentation — it was an ongoing effort across multiple fronts:

- **Company-wide presentation:** Gave a formal presentation to the entire company on prompt engineering strategies and how to leverage LLMs in day-to-day work.
- **Ops team enablement:** Worked directly with the ops team to help them discover and optimize packing workflows using AI tools, drawing on our existing operational data and experience.
- **Weekly AI roundtable:** Led a recurring weekly roundtable with engineers to share discoveries in the AI space — new tools, techniques, use cases, and how they could apply to our work.
- **Tooling advocacy:** Pushed for adoption of AI-powered developer tools like Cursor, making the case for how they'd accelerate engineering output.
- **Cross-team consulting:** Was the person people came to when they had questions about how AI could help their specific problem.

---

## Gopuff — Philadelphia, PA
**Senior Software Engineer (Tech Lead)** — Apr. 2021 - Jun. 2022

### Platform-Agnostic Ordering System
Developed a platform-agnostic ordering system using a workflow engine, launching an Uber Eats integration that increased total revenue by 10M (New revenue stream).

### Driver Forecasting Model
Partnered with Data Science to build a driver forecasting model, optimizing delivery driver utilization and reducing operational costs by 10%.

### Scheduled Delivery
Delivered Gopuff's scheduled delivery feature, allowing orders during warehouse closure.

---

## Vitris LLC — Philadelphia, PA
**Co-Owner, CTO** — Jan. 2018 - Present

A startup I co-founded. The technical work here (CMS, SSR, performance optimization) isn't what I'd lead with — the real value of this experience was learning entrepreneurship firsthand: working directly with customers, learning when and how to pivot, managing client relationships, and wearing every hat. Useful context if a role values founder mentality or customer-facing experience.

### What matters from this role
- **Entrepreneurship & customer management:** Worked directly with customers throughout — sales, onboarding, support, feedback loops. Learned how to pivot when something wasn't working.
- **CMS experience:** Built a content management platform using SSR, Code Splitting, Lazy Loading, and CDNs. Relevant if CMS/content platform experience comes up.
- **Scale reference:** Maintained 99.99% uptime across 100+ websites with 65K+ monthly page views for 2+ years. Cut server costs 50% and load times by 40% using Preact and server-level caching.

---

## Freelance Work

### Event Ticket Pricing Aggregation Application
Scrapes 400K listings daily using automated scripts and browser tools.

### Captain (South Indian Movie)
Acted as the "Referee" alongside Jayasurya in the acclaimed South Indian movie.

---

## Education

B.S. Computer Science at Drexel University, Philadelphia, PA — Graduated Jun. 2017
