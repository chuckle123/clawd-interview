# Behavioral Interview Prep

STAR stories mapped to common behavioral themes.

---

## Leadership & Influence

### Led warehouse consolidation at The Rounds
- **Situation:** The Rounds operated multiple warehouses with overlapping coverage, driving up costs.
- **Task:** Lead the technical implementation to consolidate warehouse operations.
- **Action:** Designed and executed the migration plan, coordinating across engineering and ops. Handled geofencing changes, product catalog reassignment, and delivery route updates.
- **Result:** Reduced operational costs by 10% weekly while maintaining delivery quality.

### Drove TypeScript adoption at The Rounds
- **Situation:** The codebase had 0% TypeScript coverage, causing frequent runtime bugs.
- **Task:** Modernize the codebase without disrupting active feature development.
- **Action:** Incrementally migrated files, set up strict configs, added test cases across frontend and backend, presented the case company-wide.
- **Result:** Reached 80% TypeScript coverage, significantly reducing production bugs.

---

## Technical Problem Solving

### Built text-to-SQL agent at Token Terminal
- **Situation:** Analysts needed to explore a 2PB BigQuery data warehouse with thousands of undocumented tables.
- **Task:** Make the data warehouse accessible without requiring deep SQL/schema knowledge.
- **Action:** Engineered a chat-based text-to-SQL agent, automated table/column description generation to provide contextual metadata.
- **Result:** Replaced manual exploration entirely — analysts could query in natural language with accurate results.

### Designed MCP server at Token Terminal
- **Situation:** Agents needed to access blockchain metrics, but 10+ tools created decision complexity and ~20K tokens of context per call.
- **Task:** Simplify the tool surface for AI agents.
- **Action:** Consolidated down to 4 tools using progressive disclosure, built a semantic discovery layer with SQLite + FTS5 full-text search.
- **Result:** Reduced context per call from ~20K to ~200 tokens while improving agent accuracy.

---

## Delivery Under Pressure

### Launched Gopuff scheduled delivery
- **Situation:** Gopuff needed to accept orders even when warehouses were closed to capture demand.
- **Task:** Deliver a scheduled delivery feature on a tight timeline.
- **Action:** Designed the scheduling system, coordinated with driver forecasting (Data Science partnership) to optimize utilization.
- **Result:** Unlocked off-hours revenue and helped streamline 2MM rides yearly.

### Cut packing errors 65% at The Rounds
- **Situation:** Order packing errors were high, impacting customer satisfaction across 5MM+ products.
- **Task:** Build a custom packing application to replace the error-prone process.
- **Action:** Developed a custom packing app from scratch, then later rolled out batch packing sessions that halved packing times.
- **Result:** 65% reduction in pack errors, enabling reliable delivery of 5MM+ products.

---

## Innovation & Initiative

### Built AI customer service platform at The Rounds
- **Situation:** Customer service was handling repetitive, common requests manually.
- **Task:** Automate common customer service workflows.
- **Action:** Used Langchain and tool calling to build a reasoning agent that could handle common customer requests autonomously.
- **Result:** Automated servicing of routine customer requests, freeing up the CS team for complex issues.

### Platform-agnostic ordering system at Gopuff
- **Situation:** Gopuff wanted to expand to third-party marketplaces but had a tightly coupled ordering system.
- **Task:** Build a flexible ordering system that could support multiple platforms.
- **Action:** Designed a platform-agnostic system using a workflow engine, then launched the Uber Eats integration.
- **Result:** 8% increase in total revenue from the new channel.

---

## Entrepreneurship

### Co-founded Vitris LLC
- **Situation:** Identified a market opportunity and decided to build a company around it.
- **Task:** Serve as CTO, building the product from zero.
- **Action:** Built the full tech stack, pitched investors, iterated on the product.
- **Result:** Amassed $100K in grants and reached $15K MRR.

---

## Common Questions Mapped to Stories

| Question | Best Story |
|----------|------------|
| Tell me about a time you led a difficult project | Warehouse consolidation |
| Describe a technical challenge you solved | Text-to-SQL agent or MCP server |
| How do you handle tight deadlines? | Gopuff scheduled delivery |
| Tell me about a time you improved a process | Packing app (65% error reduction) |
| How do you drive adoption of new practices? | TypeScript migration |
| Describe an innovative solution you built | AI customer service platform |
| Tell me about your entrepreneurial experience | Vitris LLC |
