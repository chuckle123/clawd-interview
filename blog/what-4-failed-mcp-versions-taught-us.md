# What 4 Failed Versions Taught Us About Building AI Data Infrastructure

**Four iterations from API wrapper to autonomous SQL agent. 17,400 tokens per call became ~200.**

We built an MCP server that lets AI assistants query financial metrics across 800+ protocols and 50+ chains. The first version had 8 tools and dumped upwards of 17,400 tokens of raw data per call. The production version has 4 tools, returns ~200 tokens, and resolves ambiguous queries that the original couldn't even attempt. The core lesson was counterintuitive: the model didn't need more data or more tools. It needed less of both — and a way to discover for exactly what it needed.

---

## The Problem With Giving LLMs Raw Data Access

We spent four iterations learning that raw API access is the wrong interface for AI.

The naive approach — wrap your endpoints as MCP tools, describe them well, let the model figure it out — breaks in three specific ways. Each one compounds the others.

### Entity ambiguity

In structured data systems, the same name maps to multiple things. `USDC` is simultaneously a project (Circle), a product (the stablecoin under Circle), and an asset (the token itself). `Ethereum` is a project, an ecosystem, and a chain. `Maker` rebranded to Sky but the internal identifier is still `makerdao`.

This isn't a crypto-specific problem. Any domain with overlapping entity types has it: a "customer" in a CRM is also a "user" in your product database, also an "account" in billing. The model needs a disambiguation layer, not a bigger dump of all possible matches.

### Intent ambiguity

"Ethereum fees" and "fees on Ethereum" look nearly identical but produce completely different queries. The first asks for Ethereum's own revenue as a protocol. The second asks for aggregate fee activity across every application deployed on the Ethereum network.

"How is USDC doing?" could mean market cap, supply growth, holder count, transfer volume, or adoption metrics.

### Context rot

Our first MCP version consumed upwards of 17,400 tokens per call — mostly raw entity lists and metric taxonomies — before the model even reached the user's question. The more context you front-load, the worse the model performs on the part that matters.

---

## Four Iterations

| Version           | Approach                                                     | What We Learned                                                                                                                                            |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1: API wrapper   | 8 tools wrapping REST endpoints, intent in tool descriptions | Dumping data into tool descriptions doesn't scale. The model drowns in context.                                                                            |
| v2: Vector search | Embed entities, semantic similarity                          | Vector similarity fails on low-context strings. 3-letter tickers produce noisy, indistinct embeddings.                                                     |
| v3: File sandbox  | Structured files in an isolated sandbox                      | The right instinct — give the agent freedom to explore — but the wrong interface. It read entire files for a single line. No indexing, no query precision. |
| v4: SQL sandbox   | SQLite + FTS5 in a sandboxed container                       | The agent writes its own queries. Precise lookups, joins, full-text search. ~200 tokens out.                                                               |

Each failure narrowed the design space. v1 taught us that models can't self-serve from large context windows. v2 taught us that semantic search doesn't work when the search terms carry no semantic content. v3 taught us that isolation is the right constraint but files are the wrong abstraction.

v4 combined all three lessons: isolate the data, make it queryable with precision, and let the agent decide how deep to search.

---

## What We Actually Built

### An agent that writes its own queries

The production MCP has 4 tools. The primary tool — `discover` — is where the interesting architecture lives.

When a user asks something like "Track USDC growth on XDC Network," the host LLM doesn't try to resolve entities itself. It calls `discover` with the full natural language query. That call hits a sandboxed container running a small, fast model (Claude Haiku 4.5) with a single tool: `sqlite3` running commands against a read-only database.

The agent inside the sandbox decides what to query. For a simple lookup, one query is enough. For cross-referencing an entity across chains, products, availability, and methodologies, it might take 3-4+ steps, running queries in parallel where possible. It has a maximum of 10 reasoning steps.

```
Host LLM → discover("Track USDC growth on XDC Network")
                │
                ▼
         Sandboxed Agent (Haiku 4.5, no internet)
                │
                ├── Step 1: sqlite3 "...MATCH 'usdc'"
                │           sqlite3 "...MATCH 'growth OR supply OR tvl'"
                │           sqlite3 "SELECT DISTINCT chain_id..."
                │
                ├── Step 2: sqlite3 "...chain_id = 'xdc'"
                │           sqlite3 "...metric definitions..."
                │
                └── Step 3: sqlite3 "...asset_id='usdc' AND chain_id='xdc'"
                            │
                            ▼
                    Structured response: ~200 tokens
                    asset_id: usdc, chain_id: xdc
                    9 metrics: market_cap, holders, transfers, mints, redemptions, DAU/WAU/MAU
```

The other three tools (`get_timeseries`, `get_breakdown`, `create_chart`) consume the IDs that `discover` returns. Fewer tools means the host LLM has fewer choices to get wrong. Consistency goes up because the decision surface is smaller.

### A database that encodes meaning, not just data

The sandbox database isn't a cache of our API. It's a semantic layer — a compressed representation of what exists, what it's called, how it relates to other things, and what you can ask about it.

| Table                 | Rows    | What It Encodes                                                                    |
| --------------------- | ------- | ---------------------------------------------------------------------------------- |
| `projects`            | 800+    | Protocols, chains, ecosystems — with descriptions                                  |
| `products`            | 200+    | Specific offerings under each project (Uniswap V2, V3, etc.)                       |
| `assets`              | 500+    | Tokens and their relationships to products                                         |
| `metrics`             | 50+     | What each metric means, how it's formatted, whether it's static or cumulative      |
| `methodologies`       | 1,000+  | How each project calculates each metric — Aave's "revenue" differs from Compound's |
| `metric_availability` | 10,000+ | Every permutation of metric + entity + chain that actually has data                |

Three FTS5 full-text search indexes sit on top. Using FTS5 reduces words to their root form — "lending" matches "lend," "lender," "lending." This matters because users don't query with exact terminology. They say "growth" when they mean market cap, supply, or TVL. They say "stablecoins" and could mean the market sector, specific assets like USDC/USDT, or issuing projects like Circle/Tether.

The `metric_availability` table is the quiet hero. Before returning any result, the agent verifies that the requested combination of metric + entity + chain actually has data.

The database rebuilds from scratch on every release of new data. When we add a new protocol, chain, or metric, it appears in the MCP automatically. No prompt rewriting. No tool changes. The schema absorbs it.

### Teach the agent why, not how

The agent prompt doesn't enumerate rules. It explains the domain.

Instead of writing "if the user mentions a token name, search the assets table first, then fall back to projects" — which handles the cases you anticipated and breaks on everything else — the prompt explains _why_ certain distinctions exist:

```
// how (brittle):
"If token name, search assets first, fall back to projects."

// why (generalizable):
"Tokens exist as BOTH a product AND an asset. DAI exists as
 product_id: 'dai' (under data_id: 'makerdao') AND as asset_id: 'dai'.
 These have DIFFERENT metrics available. Product metrics: revenue, fees,
 tvl. Asset metrics: holders, transfer volume."
```

The agent that understands _why_ products and assets are distinct can handle any ambiguous query — including ones we never anticipated. The agent following if/then rules can only handle the exact cases the prompt author thought of.

### Progressive disclosure in responses

When the data tools return results, the backend inspects which metrics are in the response and dynamically attaches only the relevant context:

```
// Only when a STATIC metric (TVL, market cap) is present:
"Non-cumulative. Reflects state at a point in time."

// Only for CUMULATIVE metrics (fees, volume):
"Cumulative. Represents daily activity that can be summed."
```

Data ships as CSV (~40% fewer tokens than JSON). Metric definitions ship alongside the data as structured metadata. The LLM receives exactly enough context to interpret the numbers — nothing more.

This solves a subtle but persistent problem. Without guidance, models routinely sum point-in-time metrics or take the latest value of cumulative ones. Progressive disclosure eliminates this class of error by teaching the model what each metric _is_ at the moment it receives the data.

---

## The Broader Lesson

The instinct when building AI-facing data interfaces is to give the model everything and let it figure it out. More tools, more context, more data. Every version we built that followed this instinct failed.

What worked was the opposite: **give the model a way to ask precise questions and answer them precisely.** Not "here are all 800 projects," but "here's a full-text search index — write a query." Not "here's every metric definition," but "here's a table — check what actually exists for this combination."

The pattern generalizes beyond our domain:

**Disambiguation is a first-class problem.** If your data has overlapping entity types, the model won't resolve them from context. Build an explicit resolution layer.

**Context is a cost, not an asset.** Every token of context you front-load is a token the model has to process before reaching the user's actual question. Deliver context progressively, attached to the data it describes.

**The bottleneck is signal-to-noise, not model intelligence.** A small, cheap model in a sandbox with clean data outperformed a frontier model drowning in 17,400 tokens of entity dumps. The expensive model wasn't wrong because it was dumb — it was wrong because the signal was buried. Isolation is a signal-to-noise intervention, not a capability tradeoff.

**Teach why, not how.** Prompts that explain decision logic produce more consistent results than prompts that enumerate if/then rules. The model can generalize from reasoning. It can't generalize from a lookup table.

We went from 8 tools and 17,400 tokens to 4 tools and ~200. The model got faster, cheaper, and more accurate — not because we added sophistication, but because we removed the things that were getting in its way.

---

BANNER IMAGE BRIEF:

- Concept: Four-stage evolution from chaos (scattered API calls, token overflow) to precision (single SQL query, structured response). Left side: tangled connections, large token counts. Right side: clean architecture diagram with SQLite at center.
- Style: Clean, technical, dark background (#0D1117) with Token Terminal accent colors (blue/green gradients)
- Elements: SQLite icon, query flow arrows, FTS5 search representation, token count comparison (17,400 → 200)
- Text overlay: "Building a Semantic Layer Between LLMs and Blockchain Data"
- Dimensions: 1200x630 (social sharing optimized)

---

_Token Terminal is a full-stack onchain data infrastructure company. We decode raw blockchain data from 48+ chains, transform it through protocol-specific pipelines, and serve standardized financial metrics to institutions, protocols, and developers._

_Interested in this kind of work? [See open roles](https://tokenterminal.com/careers)_

_Want this level of data maintenance for your protocol? [Talk to our team](https://tokenterminal.com/contact)_
