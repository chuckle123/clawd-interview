# BLOG PLAN: Prompt the Why, Not the How

**Target length:** ~2,000 words
**Tone:** First-person builder perspective. Concrete examples over theory. Connects to existing MCP article's "teach why, not how" principle and extends it into a broader philosophy.
**Angle:** Not a prompting guide. A design philosophy for how to build AI systems that survive contact with reality — and get better as models improve.

---

## Working Title Options

1. "Prompt the Why, Not the How"
2. "Why Your AI Pipeline Will Break — and What to Build Instead"
3. "Stop Building Pipelines for Claude. Start Building Context."

---

## Structure

### Opening (~250 words)

Start with Claude's constitution. Most people haven't read it, but the design choice is revealing: it teaches Claude *why* to make certain decisions, not *how* to execute them. It doesn't say "when a user asks X, respond with Y." It says "here's what matters and why — now figure out the appropriate response."

This isn't just a training trick. It's a design philosophy that applies to everything we build on top of these models. And most people are building the opposite way.

Connect to the MCP article: in that project, prompts that explained *why* products and assets are distinct outperformed prompts that enumerated if/then rules. That was the first clue. This article is the generalization.

---

### The Pipeline Trap (~400 words)

**The instinct:** When you build an AI agent, the natural approach is to define a pipeline. Step 1: do X. Step 2: take the output of X and do Y. Step 3: evaluate Y and do Z. It feels rigorous. It feels engineered. It's how we build software.

**Why it breaks:** Pipelines encode the 90% case. They handle the problems you anticipated. The moment the agent encounters something outside the pipeline — and it will — it either fails silently or halts.

**The bug triaging example:**

A well-built bug triaging agent with a pipeline approach:
1. Receive bug report
2. Open the browser, attempt to reproduce
3. Review recent commits for potential regressions
4. Create a plan for the fix
5. Submit a PR

This handles standard bugs well. Maybe 70-80% of incoming tickets. But real engineering is messier than this:

- **The "bug" that isn't a bug.** A founder reports that feature X doesn't do Y. But six months ago, the team explicitly decided X shouldn't do Y — there's a design doc explaining why. The pipeline agent doesn't know about that decision. It sees a discrepancy between expected and actual behavior, treats it as a bug, and writes a "fix" that reverses an intentional design choice. A human engineer with context would say "that's working as designed, here's why." A why-informed agent with access to design decision context could make that same judgment call.

- **The bug that's a symptom.** A memory leak on the frontend. The pipeline says "reproduce, find the commit, fix it." But this isn't a regression from a recent commit — it's a slow accumulation from an architectural pattern that was fine at small scale and breaks at current load. The pipeline doesn't have a step for "question whether the architecture is the problem." A why-informed agent that understands the system's design principles could trace the symptom to the root cause.

- **The performance issue that requires investigation, not a fix.** Users report slowness. The pipeline tries to find what's slow and optimize it. But the right response might be "this is expected behavior under these conditions and we need to set user expectations" or "this requires a fundamentally different approach, not a patch." The pipeline doesn't have a branch for "maybe the right answer isn't code."

The pattern: pipelines assume the shape of the solution before encountering the problem. The more rigid the pipeline, the more cases it mishandles.

---

### The Tool Analogy (~300 words)

Claude Code ships with a terminal. Not a curated set of 15 task-specific tools. A terminal.

This is the same philosophy. Give the model the broadest capable tool and let it decide how to use it. You could build a file-editing tool, a git tool, a test-running tool, a linting tool, a deployment tool — each one narrow and well-defined. Or you could give it bash and let it compose whatever workflow the situation demands.

The narrow-tool approach works great for narrow problems. But every tool you build encodes assumptions about what the model will need to do. Miss a case and the model is stuck — it has 15 tools and none of them fit.

The terminal approach works because it doesn't presume the workflow. The model encounters a situation you never anticipated — a permissions issue, a corrupted file, a dependency conflict — and it can handle it because it has the primitive tools to handle *anything*.

Same principle as prompting. A prompt that says "do X, then Y, then Z" is a narrow tool. A prompt that says "here's the problem domain, here's what matters, here's what good looks like — now figure out the approach" is a terminal.

This isn't about being lazy with prompts. It's about being deliberate in what you constrain. Constrain the *what* and the *why*. Leave the *how* open.

---

### Building for Tomorrow's Model (~400 words)

**The compounding mistake:** Every prescriptive pipeline you build today is built for today's model. Today's model might need 10 steps of hand-holding to handle a complex bug triage. Tomorrow's model might handle it in 3 — but only if you haven't hardcoded the 10-step pipeline.

When you encode "how" in your prompts and tooling, you're locking in the current model's limitations as permanent architecture. You're building scaffolding and then pouring concrete around it.

When you encode "why," you're giving future models the context they need to do more with less instruction. A prompt that explains *why* certain design decisions were made, *why* certain tradeoffs exist, *why* certain patterns are preferred — that prompt gets more valuable as models get smarter, because smarter models extract more from the reasoning.

**The practical implication:** Think about how your AI tooling degrades — or improves — as models get better.

- **Pipeline approach:** Model gets smarter → still follows the same rigid steps → you manually update the pipeline to take advantage of new capabilities → repeat every model generation. Your tooling is a ceiling.
- **Why approach:** Model gets smarter → better interprets the reasoning context → handles more edge cases without instruction changes → you add more "why" context as you discover new dimensions → your tooling is a floor.

**The design decision context example:**

Instead of building a bug triage pipeline, build a design decision log. Every major architectural choice, every intentional tradeoff, every "we chose X over Y because Z." Feed that to the agent as context. Don't tell it how to triage. Tell it why the system is the way it is.

Now when the founder reports that "bug," the agent doesn't just look at code and behavior. It looks at decisions and intent. It can distinguish between "this is broken" and "this is working as designed and here's the document explaining why."

That design decision log doesn't expire. It doesn't need updating when models improve. It gets *more useful* as models get better at reasoning over context. It's an investment that compounds.

---

### The Flow State Argument (~300 words)

There's a practical cost to rigid AI pipelines that nobody talks about: they break your flow.

You're deep in feature work. Shipping fast, Claude handling the boilerplate, tests passing, momentum building. Then a bug report comes in. Your triage agent tries its pipeline, hits an edge case it can't handle — a memory leak, a race condition, something that doesn't fit the template — and escalates to you.

Now you're context-switching from creative building to debugging. Not because the bug required your expertise, but because the agent's pipeline was too narrow to handle it.

A why-informed agent doesn't eliminate this completely. But it handles more of the long tail. It understands *why* the system works the way it does, so when it encounters something unexpected, it has the reasoning context to adapt rather than bail out.

The 80% agent forces you to handle the other 20% manually. The why-informed agent pushes that boundary — maybe to 90%, maybe 95% — because each new piece of "why" context extends its range without changing its instructions.

The difference between an agent that handles 80% and one that handles 95% isn't 15 percentage points. It's the difference between "I can mostly stay in flow" and "I almost never get pulled out." That's a step function in productivity, not a linear improvement.

---

### Closing (~250 words)

Come full circle to Claude's constitution. Anthropic didn't write Claude a rulebook. They wrote it a set of values and the reasoning behind them. The rules emerge from the reasoning. That's why Claude handles novel situations — it's not following a decision tree, it's applying principles.

The same philosophy applies to everything we build on top of these models:

- **Prompts:** Explain the problem and the constraints. Don't script the solution.
- **Tools:** Give broad capabilities. Don't build narrow pipelines.
- **Context:** Provide the "why" behind decisions. Don't enumerate if/then rules.
- **Architecture:** Build for the model that's coming, not the model that's here. Encode reasoning, not procedures.

Connect back to the MCP article as the concrete proof: "teach why, not how" took us from 17,400 tokens to 200. The same principle, applied to prompting and tooling, will do the same for the way we work with AI.

The engineers who get this right won't be the ones who build the most sophisticated pipelines. They'll be the ones who give the model the clearest understanding of *why* — and trust it to figure out the how.

---

## BANNER IMAGE BRIEF

- Concept: Two contrasting architectures. Left side: rigid pipeline with fixed steps, labeled and orderly but with clear breaking points at unexpected inputs. Right side: a flexible graph/network with "why" nodes at the center, adapting around obstacles. Same input enters both — the pipeline breaks, the graph flows around.
- Style: Dark background, clean technical illustration. Pipeline in rigid geometric shapes (boxes, arrows). Why-network in organic, adaptive shapes.
- Elements: Pipeline with "STEP 1 → STEP 2 → STEP 3 → ?" at a dead end. Graph with "WHY: design decisions," "WHY: system constraints," "WHY: user intent" flowing toward resolution.
- Text overlay: Working title
- Dimensions: 1200x630

---

## Notes

- This is a spiritual sequel to the MCP article. The MCP piece proved the principle in one domain (data infrastructure). This piece generalizes it to all AI-assisted engineering.
- Reference Claude's constitutional AI approach as the north star example. The model's own training embodies this philosophy.
- Reference the MCP article directly — "teach why, not how" was one of its key lessons. This article asks "what if we applied that lesson to everything?"
- Keep the builder perspective. Every claim backed by a concrete example. No hand-waving about "the future of AI."
- The bug triage example should feel real and specific — readers who've built agents will recognize the failure modes immediately.
