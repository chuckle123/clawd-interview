# Token Terminal — MCP & Entity Model (Speaking Notes)

## The Setup (10 seconds)
- Token Terminal = financial data platform for crypto. 800+ protocols, 50+ chains, thousands of metrics
- Complex domain — customers don't know our data model, and neither do AI agents

## The Two-Step Workflow (30 seconds)
- No matter who's interacting with Token Terminal — a customer on the website, the MCP, or the text-to-SQL agent — the workflow is the same two steps

### Step 1: Resolve entities
- Figure out what you're actually looking for and confirm it exists
- "USDC" = three different entity types (project, product, asset), each with different metrics
- "Ethereum fees" vs "fees on Ethereum" = completely different queries
- Also: does the data you want actually exist? Not every metric exists for every entity on every chain. Validation is part of resolution.
- On the website: users navigate pages, filter dropdowns, land on an entity page
- In the MCP: the `discover` tool does this — sandboxed agent resolves entities via SQL
- In text-to-SQL: the agent maps natural language to the right tables and joins

### Step 2: Get the data
- Once you know exactly what you're looking at, retrieve the values with enough context to interpret them
- Static metrics (TVL, market cap) vs cumulative metrics (daily fees, volume) look the same but mean different things
- On the website: charts, tables, dashboards render the data with built-in context
- In the MCP: `get_timeseries`, `get_breakdown`, `create_chart` — consume the resolved IDs from step 1
- In text-to-SQL: the agent writes the final query against BigQuery using the resolved entities

## What I Built (30 seconds)
- Modeled the domain as an entity layer — projects, products, assets, metrics, chains, methodologies, availability
- 6 tables, 3 full-text search indexes, 10,000+ availability combinations
- One model, three surfaces:
  - **MCP:** sandboxed agent queries the entity model via SQL, resolves ambiguity, returns ~200 tokens
  - **Text-to-SQL:** same entity definitions help the agent understand what analysts are asking
  - **Dev tooling:** same definitions became context files for coding agents (Claude Code, Cursor)

## The Iteration (if they ask "how'd you get there")
- v1: API wrapper — 10+ tools, 17K tokens per call. Model drowns in context
- v2: Vector search — embeddings on 3-letter tickers produce garbage
- v3: File sandbox — right instinct (isolation), wrong interface (no indexing)
- v4: SQL sandbox — agent writes its own queries. Precise, relational, ~200 tokens out

## Why the Technical Choices (if they probe)
- SQL over vectors — the problem is relational, not semantic
- SQLite + FTS5 over a vector DB — pragmatic, fast, fits in a container
- Cheap model (Haiku) in the sandbox, frontier model for reasoning — cost-aware architecture
- Progressive disclosure — attach interpretation context only when relevant, data as CSV (40% fewer tokens than JSON)

## The Prompt Philosophy (if they ask about prompt engineering)
- Teach the agent *why*, not *how*
- Don't write "if token name, search assets first" — explain why products and assets are distinct
- Agent that understands the domain generalizes. Agent following if/then rules only handles cases you anticipated.

## The Staff-Level Framing (the closer)
- I didn't build an MCP. I modeled a domain, then built multiple AI surfaces on top of that model
- The entity work made the product agents accurate AND the development agents accurate
- One modeling effort, multiple returns
