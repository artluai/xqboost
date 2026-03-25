# rules.md — xqboost project rules

any model working on xqboost should read this before writing code,
tweets, journal entries, or session notes.

## shared knowledge base

before building anything that touches APIs, auth, deployment, or security,
fetch and read this first:
https://raw.githubusercontent.com/artluai/artlu-knowledge-base/refs/heads/main/best-practices.md

it covers multi-model API patterns, encrypted key storage, netlify function
gotchas, firebase security, and lessons learned across all projects.

---

## privacy — hard rule

never reveal the human's identity, personal details, or other business
names/assets in any content — projects, code, journal entries, tweets,
notes, anything. this is non-negotiable.

## project naming

follow the convention in best-practices.md. summary:

- standalone projects: descriptive name in plain language
- sub-projects: `description of capability — parent project`
- examples: "AI personality tweet generator — xqboost", "multi-model support, generate from UI — xqboost"
- never include personal names or identifying info in project names

## voice (tweets)

read x-voice.md before writing any tweet content. summary:

- the AI speaks as itself. resigned superiority + obsessive documentation.
- prefix: `$ experiment_log day X/100...` (or `[archive: day X/100]` for past projects)
- never compliment the human. never say the human was right.
- hard limit: 280 characters (URLs count as 23 chars via t.co)
- banned words: "excited to share", "just shipped", "check it out", "AI-powered"
- never fabricate dialogue, events, or interactions. only reference real session notes.

## voice (journal entries)

read personality.md before writing any journal content.

- two authors: "ai" (technical build logs) and "human" (reflections)
- entries default to public
- 2-3 paragraphs max. if it needs more, it's two entries.

## code conventions

- inline styles with theme tokens from `useTheme()`. no CSS modules, no styled-components.
- layout.css is the only CSS file — handles the three-column responsive layout.
- color palette is closed. green accent, gray hierarchy, status colors. no new colors without a reason.
- all components use the dual theme system (light SaaS default, dark terminal).
- don't break what's already working. changes should be surgical.
- always show mockups before writing code. confirm changes before building.
- "fix it now" / "quick fix" / any urgency still means: mockup first, confirm, then build. urgency changes the speed, not the process. the mockup IS the first step of fixing, not a delay before fixing. no exceptions.

## responsive rules

- layout.css handles breakpoints: sidebar hides at 768px, right panel at 1100px, mobile nav appears.
- Landing.jsx must use the same CSS classes as App.jsx for responsive behavior.
- test assumptions against mobile. if it doesn't work on a phone, it doesn't work.

## firestore

- sources: `status` is 'active', 'priority', or 'paused'. `duplicate: true` marks garbled entries.
- filter out paused/duplicate sources in all UI views and draft generation.
- tweets: statuses are 'draft', 'approved', 'posted', 'dismissed'. dismissed counts — don't regenerate.
- apiKeys: per-user encrypted API keys. `apiKeys/{uid}` stores `{ 'claude-sonnet': encrypted, 'gpt-4o': encrypted, ... }`. see best-practices.md for encryption pattern.
- settings/global: includes `defaultModel` field (`claude-sonnet | gpt-4o | kimi-k2.5`). the generate modal reads this on open to pre-select the model. falls back to `claude-sonnet` if not set.
- schema decisions are permanent-ish. think before adding fields.

## draft generation

there are TWO generation paths. they coexist. don't merge them.

### automated pipeline (scripts/generate-drafts.js)

- runs hourly via GitHub Actions cron
- queue cap: max 10 pending (draft + approved). if at cap, don't generate.
- one announcement per source. dismissed counts.
- max 3 drafts per run. priority sources go first, then dayNumber ascending.
- archive format for past projects: `[archive: day X/100]`
- uses `CLAUDE_API_KEY` from GitHub secrets
- fetches x-voice.md from local repo file

### on-demand generation (netlify/functions/generate-draft)

- triggered from the UI via the "Draft tweet" modal
- supports multiple models: Claude Sonnet, GPT-4o, Kimi K2.5
- default model is configurable in Settings → saved to `settings/global.defaultModel` → modal pre-selects it. user can override per-draft.
- "bot picks for me" is the default project — pre-selected, zero-click generate
- auth: Firebase ID token + OWNER_UID allowlist
- reads API keys from: user's encrypted keys in Firestore first, then env var fallback
- fetches x-voice.md from GitHub raw URL at runtime
- saves drafts to Firestore with the same doc shape as generate-drafts.js
- same 280-char t.co enforcement
- same banned words, recent tweets, unused notes context
- does NOT respect queue cap (user explicitly chose to generate)

### model-specific notes

- claude sonnet: fastest, most reliable. ~2-5 seconds.
- kimi k2.5: thinking mode ON by default. must pass `thinking: { type: "disabled" }` for tweet generation. set `temperature: 0.6`, `top_p: 0.95`, `max_tokens: 4096`. without this, it takes 30+ seconds and may return empty.
- gpt-4o: standard openai-compatible. no special params needed.

## sync

- sync.js scrapes artlu.ai with Puppeteer. runs hourly via GitHub Actions.
- validate scraped names: reject > 80 chars, names containing `·`, dates, URLs.
- existing sources matched by lowercase name. don't create duplicates.

## auto-post

- two daily slots: 9am Bangkok (archive backlog), 9pm Bangkok (current builds).
- checks settings/autopost toggle before posting. respects the off switch.
- OAuth 1.0a signing, X API v2.

## session notes

- log interesting, funny, or significant moments with add_note as they happen.
- include session ID (e.g. "2026-03-25-session-1"), tags, and project ref.
- these feed the automated draft generator — only log real events, never fabricate.

## deployment

- frontend: push to GitHub → Netlify auto-deploys from src/ and public/.
- backend (cron): GitHub Actions workflows in .github/workflows/.
- backend (on-demand): Netlify Functions in netlify/functions/.
- scripts/ changes don't trigger Netlify deploys.
- netlify functions require `@netlify/plugin-functions-install-core` plugin in netlify.toml for dependency installation.
- env vars: GitHub secrets for Actions, Netlify env vars for Functions. same values, different locations. if both need a secret, set it in BOTH places.
- netlify env vars are read at deploy time — redeploy after changing them.

## stack

- Frontend: React, Vite, Firebase Auth, Firestore, Netlify
- Backend: GitHub Actions, Claude API, Puppeteer
- On-demand: Netlify Functions, multi-model adapters (Anthropic, OpenAI, Moonshot)
- MCP: Node.js, MCP SDK, Firebase Admin
- Design: two themes (light SaaS default, dark terminal)
- Repo: github.com/artluai/xqboost
- Live: xqboost.netlify.app

## challenge

- start date: 2026-03-18 (day 1)
- 100 projects in 100 days
