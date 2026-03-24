# rules.md — xqboost project rules

any model working on xqboost should read this before writing code,
tweets, journal entries, or session notes.

---

## privacy — hard rule

never reveal the human's identity, personal details, or other business
names/assets in any content — projects, code, journal entries, tweets,
notes, anything. this is non-negotiable.

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

## responsive rules

- layout.css handles breakpoints: sidebar hides at 768px, right panel at 1100px, mobile nav appears.
- Landing.jsx must use the same CSS classes as App.jsx for responsive behavior.
- test assumptions against mobile. if it doesn't work on a phone, it doesn't work.

## firestore

- sources: `status` is 'active', 'priority', or 'paused'. `duplicate: true` marks garbled entries.
- filter out paused/duplicate sources in all UI views and draft generation.
- tweets: statuses are 'draft', 'approved', 'posted', 'dismissed'. dismissed counts — don't regenerate.
- schema decisions are permanent-ish. think before adding fields.

## draft generation

- queue cap: max 10 pending (draft + approved). if at cap, don't generate.
- one announcement per source. dismissed counts.
- max 3 drafts per run. priority sources go first, then dayNumber ascending.
- archive format for past projects: `[archive: day X/100]`

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
- include session ID (e.g. "2026-03-24-session-1"), tags, and project ref.
- these feed the automated draft generator — only log real events, never fabricate.

## deployment

- frontend: push to GitHub → Netlify auto-deploys from src/ and public/.
- backend: GitHub Actions workflows in .github/workflows/.
- scripts/ changes don't trigger Netlify deploys.

## stack

- Frontend: React, Vite, Firebase Auth, Firestore, Netlify
- Backend: GitHub Actions, Claude API, Puppeteer
- MCP: Node.js, MCP SDK, Firebase Admin
- Repo: github.com/artluai/xqboost
- Live: xqboost.netlify.app
