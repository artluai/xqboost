# rules.md — xqboost pipeline reference

stable reference doc. update when pipeline logic changes.

---

## draft generation pipeline (generate-drafts.js)

runs hourly via GitHub Actions cron (`xqboost-brain.yml`).

### decision tree

```
sync.js runs (scrapes artlu.ai, creates/updates source docs in Firestore)
  ↓
gate check: pending (draft + approved) < 10?
  → no  → exit: queue full
  → yes ↓
any sources without an announcement?
  → yes → generate announcement drafts (max 3 per run, priority sources first, then by day ascending)
  → no  ↓
pick next topic (round-robin by last used)
  ↓
generate topic tweet (personality / punch / milestone)
  ↓
save draft to Firestore → appears in Queue view
```

### source selection rules

- a source gets ONE auto-generated announcement. that's it.
- "has an announcement" = any tweet (draft / approved / posted / dismissed) with `sourceRef.id` matching the source AND `type === 'announcement'`.
- dismissed counts as "has announcement" — if you dismissed it, you don't want another.
- priority sources can get additional non-announcement tweets (personality, milestone, journal) after their first announcement exists.
- paused sources are always skipped.

### topic fallback (when all sources are announced)

- fetches all topics from Firestore
- picks the next topic in round-robin order (tracks last used via `topicRef` on tweet docs)
- generates a personality / punch / milestone tweet grounded in session notes
- topic tweets use `topicRef: { id, name }` instead of `sourceRef`

### content rules

- reads `x-voice.md` from repo for voice
- checks banned words from `settings/global`
- fetches unused session notes for grounding — never fabricates
- auto-calculates day number from project date vs challenge start (2026-03-18)
- auto-applies archive format (`[archive: day X/100]`) for past projects
- URLs count as 23 chars (X t.co wrapping)
- hard cap at 280 chars after t.co adjustment
- if over 280, asks Claude to shorten; if still over, hard truncates at last period

### limits

- `MAX_PENDING`: 10 (draft + approved in queue). if met, exit without generating.
- `MAX_PER_RUN`: 3 drafts per cron run.
- 1500ms delay between API calls (rate limiting).

---

## tweet lifecycle

```
draft → approve → posted
  ↓                  
  ├─ dismiss → source blocked (no new announcement generated for this source)
  └─ delete  → source unblocked (pipeline will generate a new announcement)
```

### statuses

- **draft**: AI-generated or manual. sits in queue for review.
- **approved**: human reviewed and approved. eligible for auto-posting.
- **posted**: published to X. has `xPostId` and `xPostUrl`.
- **dismissed**: human decided this project doesn't need a tweet. blocks future auto-announcements for this source.

### user actions

- **approve**: draft → approved. enters the posting queue.
- **dismiss**: draft → dismissed. "I don't want tweets about this project." source is blocked from future auto-announcements.
- **delete**: removes the tweet doc entirely. "this draft was bad, try again." source becomes eligible for a new announcement on the next cron run.
- **mark posted**: manually mark a tweet as posted (for tweets posted outside the pipeline).
- **edit**: modify draft content before approving.

---

## auto-post pipeline (post-tweet.js)

runs twice daily via GitHub Actions cron (`auto-post.yml`), Bangkok time.

### schedule

- **9am**: morning slot — posts oldest archive tweet first, falls back to current, then random.
- **9pm**: evening slot — posts oldest current tweet first, falls back to random, then archive.

### posting order

1. manual `postOrder` override (lowest number first)
2. `dayNumber` ascending (post day 1 before day 5)
3. `createdAt` ascending (oldest first within same day)

### controls

- autopost toggle in `settings/autopost` — if `enabled: false`, skip entirely.
- requires X API OAuth 1.0a credentials (API key, secret, access token, access token secret).

---

## sync pipeline (sync.js)

runs hourly as step 1 of `xqboost-brain.yml`.

- scrapes artlu.ai via Puppeteer
- creates new source docs in Firestore for new projects
- updates `lastSynced` on existing sources
- deduplicates by normalized project name
- new sources default to `status: 'active'`

---

## media pipeline (media-pipeline.js)

runs after draft generation in `xqboost-brain.yml`.

- auto-screenshots deployed projects (requires a live URL)
- generates branded cards (day X/100, project name, stack)
- flags low-confidence media: no link, loading state screenshot, backend-only project
- video/manual media always overrides auto-generated

---

## Firestore collections

### tweets
```
content: string
threadParts: string[]
type: announcement | milestone | journal | thread | personality | punch
status: draft | approved | posted | dismissed | failed
source: manual | claude-api | grok
sourceRef: { id, name } | null       ← project tweets
topicRef: { id, name } | null        ← topic tweets
dayNumber: number | null
media: string[]
xPostId: string | null
xPostUrl: string | null
postOrder: number | null              ← manual override for posting order
createdAt, postedAt, updatedAt: timestamp
```

### sources
```
name: string
url: string
siteUrl: string
date: string (YYYY-MM-DD)
dayNumber: number
status: active | priority | paused
angles: string[]
tweetCount: number
duplicate: boolean
lastSynced, createdAt, updatedAt: timestamp
```

### topics
```
name: string
description: string
tweetCount: number
createdAt: timestamp
```

### notes
```
content: string
session: string (e.g. "2026-03-25-session-1")
projectRef: { name } | null
tags: string[]
usedInTweet: string (tweet doc ID) | null
usedInJournal: string | null
createdAt: timestamp
```

### settings/global
```
phase: challenge | post-challenge
bannedWords: string[]
schedule: { morning: string, evening: string }
```

### settings/autopost
```
enabled: boolean
```

---

## challenge rules

- start date: 2026-03-18 (day 1)
- 100 projects in 100 days
- day number = floor((project_date - start_date) / 86400000) + 1
- archive prefix for past projects: `[archive: day X/100]` or `[from the archives]`
- current projects: `day X/100`

### post-challenge phase (implement ~day 95)

when `settings/global.phase === 'post-challenge'`:
- no day count in tweets
- no archive prefix
- no one-announcement-per-source limit
- projects and topics treated equally
- queue cap still applies
- x-voice.md needs a post-challenge voice section

---

## privacy — hard rule

never reveal the human's identity, personal details, or other business names/assets in any content — projects, code, journal entries, tweets, notes, anything.
