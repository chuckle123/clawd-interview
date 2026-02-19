# BLOG PLAN: One Prompt to Rule Them All

**Target length:** ~1,500 words
**Tone:** Builder retrospective. Short, punchy, single lesson. Sequel to the MCP article.
**Angle:** I tried to make the agent smarter by giving it specialized prompts per query type. It got worse. I gave it one prompt and more room to think. It got better. The model is better at self-regulating than you are at pre-categorizing.

---

## Working Title Options

1. "I Tried Giving My AI Agent Multiple Personalities. One Was Better."
2. "One Prompt, 20 Steps: Why I Stopped Pre-Routing My AI Agent"
3. "Stop Categorizing Your Agent's Work — Let It Decide"

---

## Structure

### Opening (~150 words)

Quick context: sequel to the MCP article. The `discover` tool — a sandboxed agent that writes its own SQL queries against a semantic database. In the original article, it had a single system prompt and up to 10 reasoning steps. It worked. But I thought I could make it better.

The instinct: different query types need different approaches. An entity lookup ("what is USDC?") is fundamentally different from a cross-referencing exploration ("compare DeFi lending metrics across Ethereum and Arbitrum"). Why force them through the same prompt?

So I built multiple system prompts — specialized paths for different query shapes. It was the obvious optimization. It made everything worse.

---

### The Specialization Attempt (~400 words)

**What I built:** Multiple system prompts for the discovery agent, each tuned for a different query pattern.

Describe the categories (don't need to be exact, but something like):
- **Entity resolution** — "What is X?" / "Find the project for Y token." Simple lookups. Prompt optimized for fast, precise matching. Few steps needed.
- **Metric exploration** — "What metrics are available for X?" Prompt focused on navigating the metric taxonomy, checking availability, explaining methodologies.
- **Cross-reference queries** — "Compare X across chains" / "Show me all lending protocols." Prompt designed for multi-step joins, broader search patterns, aggregation.

**The routing problem:** The MCP client (the host LLM — Claude, GPT, whatever is calling the tool) had to decide which prompt to request before the discovery agent even started working. This is a classification problem *before* the actual problem.

And it failed in the predictable way: real user queries don't sort cleanly into categories.

"Track USDC growth on XDC Network" — is that entity resolution (find USDC + XDC), metric exploration (what growth metrics exist), or cross-referencing (USDC across chains)? It's all three. The query bleeds into every category.

The host LLM would pick one. Sometimes it picked wrong. When it picked the entity resolution prompt for a query that needed exploration, the agent resolved the entities fast but didn't check metric availability. When it picked the exploration prompt for a simple lookup, the agent overthought a one-step problem.

**The irony:** I built specialization to reduce ambiguity. It created a new ambiguity — *which specialization?* — and pushed that ambiguity to the least-informed participant in the system: the host LLM that hadn't even started investigating the query yet.

I was pre-routing before discovery. That's backwards. You can't categorize a query correctly until you've started exploring it. By the time you know which prompt is right, you don't need the prompt anymore.

---

### The Fix: One Prompt, More Room (~400 words)

**What I did instead:** Removed the specialized prompts. One system prompt. Increased the max reasoning steps from 10 to 20.

**My fear:** Simple queries would get slower. If the agent has 20 steps available, wouldn't it use all 20 even for a straightforward entity lookup? Wouldn't giving it more room encourage overthinking?

**What actually happened:** The agent self-regulated.

Simple entity lookups still resolved in 1-3 steps. The agent didn't use more steps because more were available — it used the number of steps the query required. "What is USDC?" → one FTS5 query, one availability check, done. Two steps. The ceiling being 20 didn't change the floor.

Complex cross-referencing queries that previously hit the 10-step wall now had room to breathe. "Compare fee structures across top DeFi lending protocols on Ethereum" might take 8-12 steps — disambiguating "top," finding the protocols, checking which fee metrics exist for each, verifying chain availability, structuring the comparison. Previously this query either timed out or returned incomplete results. Now it worked.

**The key insight:** The model is better at determining how much exploration a query needs than you are at pre-determining it. Your categorization is static — decided before execution, based on surface-level query parsing. The model's self-regulation is dynamic — adjusted step-by-step as it learns what the data actually contains.

This is the "prompt the why, not the how" principle in action. The specialized prompts were "how" — they prescribed the investigation pattern. The single prompt with room to think was "why" — it explained what good discovery looks like and let the agent decide the approach.

---

### The Broader Lesson (~300 words)

This pattern generalizes beyond MCP servers:

**Pre-routing is almost always wrong.** Any time you're classifying a task *before* investigating it, you're making a decision with minimal information. The classification might be right 70% of the time, but the 30% where it's wrong produces worse results than having no classification at all — because the wrong specialization actively constrains the agent away from the correct approach.

**Ceilings don't determine floors.** Giving an agent more room to work doesn't mean it uses more room on every task. This is the fear that keeps people building tight pipelines — "if I give it freedom, it'll waste it." In practice, well-prompted models are efficient. They stop when the job is done. The risk of under-constraining is much lower than the risk of over-constraining.

**The model knows things you don't.** When you pre-categorize, you're using your understanding of the query. The model, once it starts executing, has your understanding *plus* what it's learning from the data. It discovers that the entity it's looking for exists in a weird edge case you didn't anticipate. It finds that the metric the user asked about doesn't exist but a related one does. It adjusts. Your pre-routing can't.

---

### Closing (~150 words)

Connect back to the original MCP article: the journey was 8 tools → 4 tools → multiple prompts → one prompt. Each step was removing a decision that didn't need to be made at the level it was being made.

The first article's lesson was "less tools, more precision." This sequel's lesson is "less routing, more autonomy." Both point the same direction: stop doing the model's job for it. Give it the context to understand *why*, give it the tools to investigate *how*, and get out of the way.

The next time you're tempted to build specialized paths for different input types, ask yourself: am I categorizing because the agent needs me to, or because *I* need to feel in control?

---

## BANNER IMAGE BRIEF

- Concept: Left side: a routing diagram with multiple diverging paths, each labeled, with a query stuck at the fork unable to choose. Right side: a single path that widens and narrows dynamically as a query flows through it — narrow for simple lookups, wide for complex exploration. Same query enters both — the router is paralyzed, the single path adapts.
- Style: Dark background, clean technical illustration. Consistent with MCP article aesthetic.
- Elements: Decision tree / router on the left (rigid, branching). Adaptive pipeline on the right (fluid, self-sizing). Query flowing through each.
- Text overlay: Working title
- Dimensions: 1200x630

---

## Notes

- This is a direct sequel to the MCP article. Link to it explicitly. Readers of the first piece will want this one.
- Keep it short. The lesson is clean and doesn't need 2,500 words. ~1,500 is right.
- The "ceilings don't determine floors" line is the soundbite. Build toward it.
- The fear about increased step count slowing simple queries is relatable to anyone who's built agents. Name it explicitly and then show the data.
- Connects to the "Prompt the Why" article as another concrete proof point. The specialized prompts were "how." The single prompt was "why."
- If possible, include actual step counts from real queries showing the self-regulation — e.g., "simple lookup: 2 steps. Medium complexity: 5 steps. Cross-reference: 11 steps. All from the same prompt."
