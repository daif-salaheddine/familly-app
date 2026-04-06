# CLAUDE.md — Project Context

> Read this file fully at the start of every session before writing any code.
> Do not touch files outside the scope of the current task.
> Always confirm your plan in bullet points before coding.

---

## What this app is

A private family accountability app. Family members living separately hold each other accountable to long-term personal growth using real money stakes, weekly goals, and family-assigned challenges.

---

## Core rules — memorize these

### Goals

- Every person has **maximum 2 active goals** at a time
- **Slot 1** — always self-chosen. Mandatory.
- **Slot 2** — chosen from nominations sent by family members. Optional until a nomination is accepted.
- If no nomination has been received, the person may optionally fill slot 2 themselves.
- A paused goal frees up its slot.
- Goals are normally `active`, `paused`, or `completed`.
- **Goals can be deleted** by their owner. Deletion frees the slot immediately. Deleted goals do not appear anywhere in the UI. The goal detail page shows a delete button with a confirmation step before executing.

### Nominations (for slot 2)

- Any family member can nominate a goal for any other member.
- **One nomination per nominator per target** at a time.
- Multiple family members can nominate the same person simultaneously.
- The target person sees all pending nominations and **picks one freely**.
- When one nomination is accepted → all others are auto-declined.
- The person can optionally write a reason for their choice.
- The family can see which nomination was chosen and the reason.

### Weekly cycle

- Goals **reset every week** (Monday start, Sunday end).
- Each week is independent — missing last week has no effect on this week's counter except for the consecutive miss rule.
- At end of each week (Sunday night cron job):
  - Did the user meet their goal frequency? ✅ → no penalty, `consecutive_misses` resets to 0
  - Did not meet frequency? ❌ → penalty added to pot, `consecutive_misses` += 1

### Consecutive miss rule

- Miss **2 weeks in a row** → penalty added to pot **AND** a Challenge is triggered.
- One good week → `consecutive_misses` resets to 0 completely.

### Challenges (triggered by 2 consecutive misses)

- Same nomination logic as goals:
  - Family members each suggest a real-life action
  - The person picks one suggestion freely
  - Others are auto-declined
  - Person proves completion with photo/video upload
- After completing the challenge → `consecutive_misses` resets to 0.

### Group pot

- Accumulates from all penalties.
- Group votes on what to spend it on via proposals.
- Any member can propose a reward.
- Simple vote: thumbs up / thumbs down. Majority wins. Closes after 48 hours.

---

## Tech stack

| Layer        | Technology                |
| ------------ | ------------------------- |
| Framework    | Next.js 14 (App Router)   |
| Language     | TypeScript                |
| Styling      | Tailwind CSS              |
| Database ORM | Prisma                    |
| Database     | PostgreSQL (via Supabase) |
| Auth         | NextAuth.js               |
| File storage | Supabase Storage          |
| Validation   | Zod                       |
| Deployment   | Vercel                    |

---

## Database — 13 tables

### USER

Stores each family member.

- `id` uuid PK
- `name` string
- `email` string unique
- `password_hash` string
- `avatar_url` string nullable
- `created_at` timestamp

### GROUP

The family circle.

- `id` uuid PK
- `name` string
- `created_by` uuid FK → USER
- `created_at` timestamp

### GROUP_MEMBER

Bridge table — users to groups.

- `id` uuid PK
- `group_id` uuid FK → GROUP
- `user_id` uuid FK → USER
- `role` enum: `admin` | `member`
- `joined_at` timestamp

### GOAL

Every active commitment. Core table.

- `id` uuid PK
- `user_id` uuid FK → USER
- `group_id` uuid FK → GROUP
- `nominated_by` uuid FK → USER nullable (null = self-chosen)
- `title` string
- `category` enum: `body` | `mind` | `soul` | `work` | `relationships`
- `slot` enum: `self` | `nominated`
- `frequency` enum: `daily` | `times_per_week` | `weekly`
- `frequency_count` int (e.g. 3 for "3 times per week")
- `penalty_amount` decimal
- `status` enum: `active` | `paused` | `completed`
- `consecutive_misses` int default 0
- `created_at` timestamp
- `paused_at` timestamp nullable

**Constraints:**

- A user cannot have more than 2 active goals (`status = active`) per group.
- A user cannot have more than 1 goal with `slot = self` per group.
- A user cannot have more than 1 goal with `slot = nominated` per group.

### NOMINATION

A pending goal suggestion — not yet accepted.

- `id` uuid PK
- `from_user_id` uuid FK → USER
- `to_user_id` uuid FK → USER
- `group_id` uuid FK → GROUP
- `title` string
- `category` enum (same as GOAL)
- `frequency` enum (same as GOAL)
- `frequency_count` int
- `penalty_amount` decimal
- `message` string nullable (personal note from nominator)
- `status` enum: `pending` | `accepted` | `auto_declined` | `declined`
- `chosen_reason` string nullable (written by recipient when accepting)
- `created_at` timestamp
- `responded_at` timestamp nullable

**Constraints:**

- One nomination per `from_user_id` + `to_user_id` pair with `status = pending`.

### CHECKIN

One proof upload per goal per completion.

- `id` uuid PK
- `goal_id` uuid FK → GOAL
- `user_id` uuid FK → USER
- `media_url` string
- `caption` string nullable
- `checkin_date` date
- `week_number` int
- `year` int
- `created_at` timestamp

### REACTION

Emoji reactions to checkins.

- `id` uuid PK
- `checkin_id` uuid FK → CHECKIN
- `user_id` uuid FK → USER
- `emoji` string
- `created_at` timestamp

### CHALLENGE

Triggered when `consecutive_misses` = 2.

- `id` uuid PK
- `user_id` uuid FK → USER (person who must complete it)
- `goal_id` uuid FK → GOAL (the goal that was missed)
- `group_id` uuid FK → GROUP
- `chosen_suggestion_id` uuid FK → CHALLENGE_SUGGESTION nullable
- `proof_url` string nullable
- `proof_caption` string nullable
- `status` enum: `pending_suggestions` | `pending_choice` | `pending_proof` | `completed`
- `created_at` timestamp
- `completed_at` timestamp nullable

### CHALLENGE_SUGGESTION

Family members suggest actions for a challenge.

- `id` uuid PK
- `challenge_id` uuid FK → CHALLENGE
- `from_user_id` uuid FK → USER
- `description` string
- `status` enum: `pending` | `chosen` | `auto_declined`
- `created_at` timestamp

**Constraints:**

- One suggestion per `from_user_id` + `challenge_id` pair.

### PENALTY

Created automatically every Sunday by cron job.

- `id` uuid PK
- `user_id` uuid FK → USER
- `goal_id` uuid FK → GOAL
- `group_id` uuid FK → GROUP
- `amount` decimal
- `period_start` date
- `period_end` date
- `created_at` timestamp

### POT

One row per group. Running total.

- `id` uuid PK
- `group_id` uuid FK → GROUP unique
- `total_amount` decimal default 0
- `updated_at` timestamp

### POT_PROPOSAL

A reward suggestion for the pot.

- `id` uuid PK
- `pot_id` uuid FK → POT
- `proposed_by` uuid FK → USER
- `description` string
- `votes_for` int default 0
- `votes_against` int default 0
- `status` enum: `open` | `approved` | `rejected`
- `closes_at` timestamp
- `created_at` timestamp

### NOTIFICATION

All in-app notifications.

- `id` uuid PK
- `user_id` uuid FK → USER
- `type` enum: `goal_missed` | `nomination_received` | `challenge_triggered` | `challenge_suggestion` | `reaction_received` | `pot_updated` | `proposal_created`
- `reference_id` uuid (points to relevant row in relevant table)
- `is_read` boolean default false
- `created_at` timestamp

---

## Folder structure

```
app/
  (auth)/
    login/page.tsx
  (app)/
    layout.tsx               ← shared navbar
    feed/page.tsx
    profile/page.tsx
    profile/goals/new/page.tsx
    profile/goals/[id]/page.tsx
    profile/goals/[id]/checkin/page.tsx
    members/[userId]/page.tsx
    members/[userId]/nominate/page.tsx
    nominations/page.tsx
    challenges/page.tsx
    challenges/[userId]/suggest/page.tsx
    pot/page.tsx
    leaderboard/page.tsx
  api/
    auth/route.ts
    goals/route.ts
    goals/[id]/route.ts
    goals/[id]/checkin/route.ts
    nominations/route.ts
    nominations/[id]/respond/route.ts
    challenges/route.ts
    challenges/[id]/suggest/route.ts
    challenges/[id]/choose/route.ts
    challenges/[id]/complete/route.ts
    pot/route.ts
    pot/proposals/route.ts
    pot/proposals/[id]/vote/route.ts
    penalties/weekly/route.ts
    feed/route.ts
    upload/route.ts

components/
  ui/                        ← Button, Input, Card, Badge, Modal
  layout/                    ← Navbar, BottomNav, PageHeader
  goals/                     ← GoalCard, GoalSlots, FrequencyPicker
  feed/                      ← FeedItem, ProofCard, ReactionBar
  nominations/               ← NominationCard, NominationList
  challenges/                ← ChallengeCard, SuggestionList
  pot/                       ← PotTotal, ProposalCard, VoteBar

lib/
  db.ts                      ← Prisma client singleton
  auth.ts                    ← Session helpers, getUser()
  penalties.ts               ← Weekly penalty calculation
  goals.ts                   ← Slot validation, 2-goal rule enforcement
  challenges.ts              ← Consecutive miss detection
  storage.ts                 ← File upload to Supabase Storage
  notifications.ts           ← Create notification records

prisma/
  schema.prisma              ← All 13 tables

types/
  index.ts                   ← Shared TypeScript types

middleware.ts                ← Protect all routes, redirect to /login if no session
.env.local                   ← DATABASE_URL, NEXTAUTH_SECRET, SUPABASE_URL, SUPABASE_KEY
```

---

## Coding conventions

- Always use TypeScript. No `any` types.
- Always validate API inputs with Zod before touching the database.
- Always call `getUser()` from `lib/auth.ts` at the top of every API route to verify the session.
- Business logic lives in `lib/` — API routes only call lib functions and return responses.
- Use Prisma transactions when multiple tables must be updated together.
- Every API route returns `{ data, error }` shape consistently.
- Components are server components by default. Add `"use client"` only when needed.
- Use Tailwind for all styling. No inline styles.

---

## Build order (V1)

Work in this order. Do not skip ahead.
Each feature is vertical — finish the API + UI together before moving to the next.

### Foundation (no UI yet)

1. **Prisma schema** — all 13 tables, all constraints
2. **Auth** — login page, session, middleware protecting all routes
3. **Seed script** — 6 hardcoded family member accounts with realistic data

### Feature 1 — Goals

4. `lib/goals.ts` — slot validation, 2-goal rule enforcement
5. `api/goals/route.ts` — GET all goals, POST create goal
6. `api/goals/[id]/route.ts` — GET one, PATCH edit/pause, DELETE
7. `app/(app)/profile/page.tsx` — my goals, slot 1 + slot 2 display
8. `app/(app)/profile/goals/new/page.tsx` — create self-chosen goal form
9. `app/(app)/profile/goals/[id]/page.tsx` — goal detail page

### Feature 2 — Nominations

10. `api/nominations/route.ts` — GET pending nominations, POST create
11. `api/nominations/[id]/respond/route.ts` — POST accept or decline
12. `app/(app)/nominations/page.tsx` — inbox: all nominations I received
13. `app/(app)/members/[userId]/page.tsx` — member card with their goals
14. `app/(app)/members/[userId]/nominate/page.tsx` — nominate a goal form

### Feature 3 — Checkins (proof uploads)

15. `lib/storage.ts` — file upload to Supabase Storage
16. `api/upload/route.ts` — POST media file, return URL
17. `api/goals/[id]/checkin/route.ts` — POST checkin with media URL
18. `app/(app)/profile/goals/[id]/checkin/page.tsx` — upload proof page
19. Proof gallery inside `app/(app)/profile/goals/[id]/page.tsx`

### Feature 4 — Weekly penalties

20. `lib/penalties.ts` — calculate missed goals, update consecutive_misses
21. `api/penalties/weekly/route.ts` — cron job endpoint (called every Sunday)
22. Vercel cron job config in `vercel.json`

### Feature 5 — Challenges

23. `lib/challenges.ts` — detect consecutive_misses = 2, trigger challenge
24. `api/challenges/route.ts` — GET active challenges
25. `api/challenges/[id]/suggest/route.ts` — POST suggestion
26. `api/challenges/[id]/choose/route.ts` — POST pick a suggestion
27. `api/challenges/[id]/complete/route.ts` — POST proof of completion
28. `app/(app)/challenges/page.tsx` — active challenge: pick + prove
29. `app/(app)/challenges/[userId]/suggest/page.tsx` — suggest an action

### Feature 6 — Group feed

30. `api/feed/route.ts` — GET recent group activity (checkins, misses, nominations, challenges)
31. `app/(app)/feed/page.tsx` — home feed with all activity cards
32. Reactions: `api/goals/[id]/checkin/[checkinId]/react/route.ts`

### Feature 7 — Pot

33. `api/pot/route.ts` — GET pot total + penalty history
34. `api/pot/proposals/route.ts` — GET proposals, POST new proposal
35. `api/pot/proposals/[id]/vote/route.ts` — POST vote
36. `app/(app)/pot/page.tsx` — pot total, history, proposals, voting

### Feature 8 — Leaderboard & Notifications

37. `app/(app)/leaderboard/page.tsx` — streaks, completion rates, rankings
38. `lib/notifications.ts` — create notification records
39. Notification triggers wired into all relevant API routes
40. Notification bell in navbar showing unread count

---

## Current status

> Update this section at the end of every session.

### Foundation

- [x] Prisma schema — done 2026-04-04
- [x] Auth — done 2026-04-05, login fixed 2026-04-05
- [x] Seed script — done 2026-04-05

> Auth notes: DATABASE_URL must use Supabase connection pooler (port 6543), not direct connection (port 5432). Login redirects to /profile.

### Feature 1 — Goals

- [x] lib/goals.ts — done 2026-04-05, deleteGoal() added 2026-04-05
- [x] Goals API — done 2026-04-05, DELETE added 2026-04-05
- [x] Profile page (my goals) — done 2026-04-05
- [x] Create goal page — done 2026-04-05
- [x] Goal detail page — done 2026-04-05, delete button with confirmation added 2026-04-05

### Feature 2 — Nominations

- [x] Nominations API — done 2026-04-05
- [x] Nominations inbox page — done 2026-04-05
- [x] Member card page — done 2026-04-05
- [x] Nominate page — done 2026-04-05

### Feature 3 — Checkins

- [x] lib/storage.ts — done 2026-04-05
- [x] Upload API — done 2026-04-05
- [x] Checkin API — done 2026-04-05
- [x] Upload proof page — done 2026-04-05
- [x] Proof gallery — done 2026-04-05

### Feature 4 — Weekly penalties

- [x] lib/penalties.ts — done 2026-04-05
- [x] Penalties cron API — done 2026-04-05
- [x] Vercel cron config — done 2026-04-05

### Feature 5 — Challenges

- [x] lib/challenges.ts — done 2026-04-05
- [x] Challenges API — done 2026-04-05
- [x] Challenge page — done 2026-04-05
- [x] Suggest page — done 2026-04-05

### Feature 6 — Feed

- [x] Feed API — done 2026-04-05
- [x] Feed page — done 2026-04-05
- [x] Reactions — done 2026-04-05

### Feature 7 — Pot

- [x] Pot API — done 2026-04-05
- [x] Proposals API — done 2026-04-05
- [x] Pot page — done 2026-04-05

### Feature 8 — Leaderboard & Notifications

- [x] Leaderboard page — done 2026-04-06
- [x] lib/notifications.ts — done 2026-04-06
- [x] Notification triggers — done 2026-04-06
- [x] Notification bell — done 2026-04-06

### i18n — Multilingual support (EN / FR / AR)

- [x] next-intl setup (cookie-based, no URL routing) — done 2026-04-06
- [x] messages/en.json, messages/fr.json, messages/ar.json — done 2026-04-06
- [x] All pages translated (server components) — done 2026-04-06
- [x] All client components translated — done 2026-04-06
- [x] Arabic RTL: dir="rtl" on html, system-ui font fallback — done 2026-04-06
- [x] Language selector on profile page, persisted to DB + cookie — done 2026-04-06
- [x] Avatar upload with crop/zoom modal (react-easy-crop) — done 2026-04-06

## End of session routine

At the end of every session always:

1. Summarize what you built this session — file by file, one sentence each
2. Update the Current status section checkboxes
3. Run: git add . && git commit -m "descriptive message" && git push

Never auto-commit. Always explain first, wait for permission, then commit.
