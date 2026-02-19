# BLOG PLAN: The Three Hard Problems With Voice AI Agents

**Target length:** ~2,000 words
**Tone:** Same as MCP article — first-person builder perspective, concrete tradeoffs, no hype
**Angle:** Not a tutorial. A post about the unsolved (or poorly solved) problems you hit when building a voice AI agent for real phone calls.

---

## Working Title Options

1. "The Three Hard Problems Nobody Warns You About When Building Voice AI"
2. "Latency, Emotion, and Amnesia: What Actually Breaks When AI Answers the Phone"
3. "I Built a Voice AI Agent That Answers Phone Calls. Here's What's Actually Hard."

---

## Structure

### Opening (~200 words)

Quick setup: built a voice AI agent that answers real phone calls for a home services business. Twilio + OpenAI Realtime API + custom tooling. It works. But "works" hides three hard problems that don't have clean answers yet. This post is about those problems.

Drop the stack briefly (Twilio → Express → OpenAI Realtime → Postgres) but don't dwell on it. Link to the repo.

---

### Problem 1: Latency Is the Uncanny Valley of Conversation (~500 words)

**The core tension:** Humans expect <300ms response time in conversation. Anything over 800ms feels broken. You're building on top of API calls, transcription, inference, and synthesis — each adding latency.

**The two architectures:**

| Approach | Pipeline | Latency | Tradeoff |
|---|---|---|---|
| Speech-to-Text → LLM → Text-to-Speech | Audio → Whisper → GPT-4o → TTS | Higher (~1-2s+) | Better knowledge, worse feel |
| Speech-to-Speech (Realtime API) | Audio → GPT-4o Realtime → Audio | Lower (~500ms) | Better feel, smaller training set |

**STT → LLM → TTS:** You get the full weight of a frontier text model. Better at complex reasoning, tool use, following instructions. But three serial network hops minimum. Each one adds 200-400ms. By the time the agent speaks, the silence is already uncomfortable.

**Speech-to-Speech:** OpenAI's Realtime API collapses the pipeline into one hop. Latency drops dramatically. But the model is newer, likely trained on less data, and you lose some of the reasoning depth of the text models.

**What I chose and why:** Speech-to-speech (Realtime API). For a phone agent, conversational feel matters more than perfect answers. A 2-second pause before a correct answer is worse than a 500ms pause before a good-enough one. People hang up on silence. They don't hang up on slightly imperfect phrasing.

---

### Problem 2: Emotional Mismatch — The Chirpy Agent Problem (~500 words)

**The problem nobody talks about:** Speech-to-speech handles emotion better than the pipeline approach, but neither is good at it.

**STT → LLM → TTS is particularly bad at this.** The text transcription step strips all emotional signal. "I've been waiting three weeks" transcribed as text loses the frustration in the caller's voice. The LLM reasons over flat text. The TTS engine produces its default upbeat tone. Result: an angry customer gets a cheerful response. This is worse than a bad answer — it's a bad *experience*. It makes the caller feel unheard.

**Speech-to-speech is better but not solved.** Because the model processes audio directly, it can detect tone, pace, frustration. It can (sometimes) match energy — lower its voice, slow down, acknowledge tension. But it's inconsistent. The model wasn't primarily trained for emotional mirroring. It defaults to helpful-and-pleasant, which is the right baseline for most calls but the wrong one for someone who's upset.

**What actually helps:** Prompt engineering helps more than you'd expect. Explicit instructions like "match the caller's emotional energy" and "if the caller sounds frustrated, acknowledge it before solving the problem" push the model in the right direction. But it's a band-aid. The real fix is training data that includes emotionally varied conversations with appropriate agent responses. That doesn't exist at scale yet.

**The business risk:** In customer service, emotional mismatch is the fastest way to lose a customer. A human agent instinctively modulates tone. An AI agent that sounds happy when you're upset feels like talking to a wall.

---

### Problem 3: Context Window Amnesia — Keeping the Agent on Task (~600 words)

**The real scaling problem:** Voice conversations generate context fast. A 10-minute call can easily produce 4,000-5,000 tokens of transcript. A returning caller who's had 3 previous calls? You're looking at 15,000+ tokens of relevant history before the current conversation even starts.

**Why this matters for voice specifically:** In a chat interface, context window overflow is annoying — the agent forgets something from earlier. In a voice call, it's catastrophic. The caller says "like I told you last time" and the agent has no idea what they're talking about. Or worse, the agent contradicts something it said 8 minutes ago in the same call.

**The obvious answer is compaction. The obvious answer is wrong.**

Compaction (summarizing old context to free up tokens) sounds straightforward. It's not. What do you keep? What do you cut? A detail that seems irrelevant in minute 3 becomes critical in minute 12 when the caller references it. Compaction is lossy compression on data where you don't know what's signal yet.

And even if you compact well — how does the agent retrieve that context when it needs it? The caller says something that relates to a compacted summary from 6 calls ago. The agent needs to find that context, expand it, and vocalize a response. All within the <800ms window before the silence gets awkward.

**Vector search helps but raises hard questions:**

- What do you vectorize? Full transcript chunks? Summaries? Individual topics?
- How do you chunk? By time? By topic? By speaker turn?
- What happens when a topic spans multiple chunks, gets mentioned again 3 calls later, and needs to be re-contextualized?
- When do you re-vectorize? After every call? Mid-call?

**Where I think this needs to go: a multi-agent approach**

What I built uses a simpler model — recent call history injected into the system prompt plus a semantic search tool the agent can call when it needs older context. That works for short conversations and low call volume. It won't scale.

The architecture I'd build next isn't one agent trying to do everything. It's a primary conversational agent backed by specialized support agents handling context:

- **Primary agent:** Handles the live conversation. Minimal context in its window — just current call + compact customer summary.
- **Context retrieval agent:** Triggered when the primary agent needs history. Searches vector store, re-ranks results, returns only what's relevant to the current question.
- **Context storage agent:** Runs post-call. Decides what to store, how to chunk it, what topics to tag, what to merge with existing context.

Each agent would have a different strategy because the problems are different. Storage needs thoroughness. Retrieval needs speed. The primary agent needs to stay focused and fast.

This isn't a proven architecture — it's the least-bad design I can see. The retrieval agent would add latency. The storage agent could miscategorize. The primary agent might need context it doesn't know to ask for. But it's a more sustainable path than stuffing everything into one window and hoping.

---

### Closing (~200 words)

Voice AI is at the stage where it's impressive in demos and fragile in production. The gap between "this works on a scripted test call" and "this handles a frustrated customer calling back for the third time about a late estimate" is enormous.

The three problems — latency, emotion, and context — compound each other. Retrieving context adds latency. Latency kills emotional continuity. Poor emotional response makes the caller repeat themselves, generating more context.

These aren't engineering problems with clean solutions. They're tradeoff spaces. Speech-to-speech vs. pipeline. Compaction vs. full context. Speed vs. completeness. The right answers depend on your use case, and they'll keep shifting as the models improve.

Link to the repo. Invite discussion.

---

## BANNER IMAGE BRIEF

- Concept: Audio waveform transforming into/colliding with a chat-style context window. Visual tension between the real-time nature of voice and the bounded nature of LLM context.
- Style: Dark background, clean technical illustration. Blue/purple gradient on waveform, warm amber on context window to show the tension.
- Elements: Audio waveform, clock/latency indicator, shrinking context window visualization
- Text overlay: Working title
- Dimensions: 1200x630

---

## Notes

- Reference the voice-agent-v1 repo throughout as concrete backing
- Include actual latency numbers from testing if possible
- Keep the MCP article's pattern: problem → what we tried → what actually worked → why
- No "AI will change everything" energy. Builder perspective. Here's what's hard, here's what I tried, here's what I'd do differently.
