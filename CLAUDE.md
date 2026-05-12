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
    layout.tsx
    login/page.tsx
    register/page.tsx
    onboarding/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    verify-email/page.tsx
  (app)/
    layout.tsx               ← shared header + bottom nav + email-verification banner
    feed/page.tsx
    profile/page.tsx
    profile/goals/new/page.tsx
    profile/goals/[id]/page.tsx
    profile/goals/[id]/checkin/page.tsx
    members/page.tsx
    members/[userId]/page.tsx
    members/[userId]/nominate/page.tsx
    nominations/page.tsx
    challenges/page.tsx
    challenges/[userId]/suggest/page.tsx
    pot/page.tsx
    leaderboard/page.tsx
    notifications/page.tsx
    settings/page.tsx        ← stub ("coming soon")
    stats/page.tsx           ← stub ("coming soon")
    groups/new/page.tsx
    groups/[id]/settings/page.tsx
  join/
    [code]/page.tsx          ← public group invite landing page
  api/
    auth/[...nextauth]/route.ts
    auth/register/route.ts
    auth/forgot-password/route.ts
    auth/reset-password/route.ts
    auth/verify-email/route.ts
    goals/route.ts
    goals/[id]/route.ts
    goals/[id]/checkin/route.ts
    checkins/[id]/react/route.ts
    nominations/route.ts
    nominations/[id]/respond/route.ts
    challenges/route.ts
    challenges/[id]/suggest/route.ts
    challenges/[id]/choose/route.ts
    challenges/[id]/complete/route.ts
    pot/route.ts
    pot/proposals/route.ts
    pot/proposals/[id]/vote/route.ts
    pot/proposals/expire/route.ts
    penalties/weekly/route.ts
    feed/route.ts
    upload/route.ts
    upload/avatar/route.ts
    groups/route.ts
    groups/[id]/route.ts
    groups/[id]/invite/route.ts
    groups/[id]/members/[userId]/route.ts
    groups/[id]/run-penalties/route.ts
    groups/[id]/transfer-admin/route.ts
    groups/join/route.ts
    notifications/route.ts
    notifications/[id]/read/route.ts
    notifications/read-all/route.ts
    digest/route.ts
    user/active-group/route.ts
    user/delete/route.ts
    user/freeze-week/route.ts
    user/onboard/route.ts

components/
  auth/                      ← LoginForm, RegisterForm
  ui/                        ← Avatar, AvatarUpload, Button, ClickSound, LanguageSelector
  layout/                    ← BottomNav, GroupSwitcher, ProfileDropdown
  goals/                     ← CheckinForm, CreateGoalForm, EditGoalPanel, GoalActions, QuickCheckinButton
  feed/                      ← FeedItem, ReactionBar
  nominations/               ← NominateForm, NominationCard
  challenges/                ← MyChallengeCard, OtherChallengeCard, SuggestForm
  pot/                       ← ProposalCard, ProposeForm
  groups/                    ← CreateGroupForm, GroupSettingsPanel, JoinGroupCard
  profile/                   ← FreezeWeekButton
  notifications/             ← NotificationList
  onboarding/                ← OnboardingFlow

lib/
  auth.ts                    ← Session helpers, getUser()
  challenges.ts              ← Challenge lifecycle
  checkins.ts                ← Week number helpers
  db.ts                      ← Prisma client singleton
  email.ts                   ← Resend email templates (6 email types)
  feed.ts                    ← Group feed aggregation
  goals.ts                   ← Slot validation, 2-goal rule enforcement
  group.ts                   ← Active group cookie helper
  nominations.ts             ← Nomination queries
  notifications.ts           ← Create/read/mark notifications
  penalties.ts               ← Weekly penalty calculation
  pot.ts                     ← Pot + proposal queries
  sounds.ts                  ← Web Audio API sound effects
  storage.ts                 ← File upload to Supabase Storage

prisma/
  schema.prisma              ← All 14 tables (includes WeekFreeze)
  seed.ts                    ← 6 hardcoded family member accounts

actions/
  setLanguage.ts             ← Server action for locale cookie

auth.ts                      ← NextAuth full config (JWT + session callbacks)
auth.config.ts               ← NextAuth Edge-compatible config
middleware.ts                ← Route protection + x-pathname header injection
vercel.json                  ← 3 cron jobs (penalties Sun 23:00, digest Mon 08:00, proposal expiry hourly)
.env.local                   ← DATABASE_URL, NEXTAUTH_SECRET, SUPABASE_URL, SUPABASE_KEY, RESEND_API_KEY, CRON_SECRET
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

---

## Extra features built

These features were added after the original V1 plan and are not described elsewhere in this file.

---

### 1. Week Freeze

A user can freeze up to **2 weeks per calendar month** per group. A frozen week is skipped entirely during the Sunday penalty cron — no penalty is charged and `consecutive_misses` is not incremented. The freeze is created for the current ISO week and is idempotent (can't freeze the same week twice).

| File | Role |
|---|---|
| `app/api/user/freeze-week/route.ts` | POST to create a freeze; GET to read current freeze status |
| `components/profile/FreezeWeekButton.tsx` | Button on profile page; shows remaining freezes this month |
| `lib/penalties.ts` | Checks `WeekFreeze` table before penalizing each goal |
| `prisma/schema.prisma` | `WeekFreeze` model (user_id + group_id + week_number + year unique) |

---

### 2. Google Login (OAuth)

Users can sign in with Google via NextAuth. The `Account` table stores the OAuth provider link. Email/password login remains available alongside OAuth.

| File | Role |
|---|---|
| `auth.ts` | NextAuth config — Google provider, JWT + session callbacks |
| `auth.config.ts` | Edge-compatible NextAuth config (used by middleware) |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth catch-all handler |
| `prisma/schema.prisma` | `Account` model linking users to OAuth providers |

---

### 3. Email Verification

After registration, a verification link is emailed to the user. Until verified, a yellow banner appears at the top of every app page. Verified status is stored as `email_verified` on the User model.

| File | Role |
|---|---|
| `app/api/auth/verify-email/route.ts` | GET — validates token, sets `email_verified = true`, redirects to login |
| `app/(auth)/verify-email/page.tsx` | Shown when verification token is invalid or expired |
| `lib/email.ts` | `sendVerificationEmail()` — sends the verification link via Resend |
| `app/(app)/layout.tsx` | Renders the yellow banner when `email_verified = false` |
| `prisma/schema.prisma` | `email_verified`, `verification_token` fields on `User` |

---

### 4. Forgot Password / Reset

Users can request a password reset via email. The link contains a short-lived token (1 hour). The token is hashed before storage. On success the user is redirected to login.

| File | Role |
|---|---|
| `app/(auth)/forgot-password/page.tsx` | Form to enter email and request a reset link |
| `app/(auth)/reset-password/page.tsx` | Form to enter new password (reads token from query string) |
| `app/(auth)/reset-password/ResetPasswordForm.tsx` | Client component for the reset form |
| `app/api/auth/forgot-password/route.ts` | POST — generates token, stores hash + expiry, sends email |
| `app/api/auth/reset-password/route.ts` | POST — validates token, bcrypt-hashes new password, clears token |
| `lib/email.ts` | `sendPasswordReset()` — sends the reset link via Resend |
| `prisma/schema.prisma` | `reset_token`, `reset_expires_at` fields on `User` |

---

### 5. Registration Page

Self-service account creation. New users register with name, email, and password. After registration an email verification link is sent and the user is redirected to the onboarding flow.

| File | Role |
|---|---|
| `app/(auth)/register/page.tsx` | Page wrapper |
| `components/auth/RegisterForm.tsx` | Client form component |
| `app/api/auth/register/route.ts` | POST — validates input, bcrypt-hashes password, creates user, sends verification email |

---

### 6. Multiple Groups + Group Switcher

A user can belong to more than one group. The currently active group is stored in the `active_group_id` cookie. The header shows a dropdown switcher when the user is in more than one group. All data queries (goals, feed, pot, etc.) scope themselves to the active group.

| File | Role |
|---|---|
| `lib/group.ts` | `getActiveGroupId()` — reads cookie, falls back to earliest membership |
| `components/layout/GroupSwitcher.tsx` | Header dropdown showing all groups; switches active group |
| `app/api/user/active-group/route.ts` | POST — sets `active_group_id` cookie |
| `app/(app)/layout.tsx` | Loads all memberships, determines active group, passes to switcher |

---

### 7. Group Invite Link

Each group has a unique 8-character invite code. Sharing `/join/[code]` lets anyone join — authenticated users join immediately; unauthenticated users see a login/register prompt first. The code can be regenerated by an admin at any time, instantly invalidating old links.

| File | Role |
|---|---|
| `app/join/[code]/page.tsx` | Public landing page showing group name + current members |
| `components/groups/JoinGroupCard.tsx` | Card with "Join" or "Already a member" state |
| `app/api/groups/join/route.ts` | POST — validates code, adds user as member |
| `app/api/groups/[id]/invite/route.ts` | POST — regenerates invite code (admin only) |
| `prisma/schema.prisma` | `invite_code` unique field on `Group` |

---

### 8. Group Admin Panel

Admins get a full settings panel for managing their group. Non-admins see the panel in read-only mode (invite link + member list only).

Admin capabilities:
- Rename the group
- Copy or regenerate the invite link
- Kick a member (non-admins only)
- Transfer the admin role to another member
- Run the weekly penalty calculation manually (without waiting for Sunday's cron)
- Delete the group entirely — all data is wiped in a transaction and a notification email is sent to every non-admin member

| File | Role |
|---|---|
| `app/(app)/groups/[id]/settings/page.tsx` | Page — loads group + members, passes to panel |
| `components/groups/GroupSettingsPanel.tsx` | Client component — all admin actions |
| `app/api/groups/[id]/route.ts` | PATCH (rename), DELETE (delete group + cascade) |
| `app/api/groups/[id]/invite/route.ts` | POST — regenerate invite code |
| `app/api/groups/[id]/members/[userId]/route.ts` | DELETE — kick member |
| `app/api/groups/[id]/transfer-admin/route.ts` | POST — promote another member to admin |
| `app/api/groups/[id]/run-penalties/route.ts` | POST — manual penalty run (admin only) |
| `lib/email.ts` | `sendGroupDeletedEmail()` — notifies non-admin members on deletion |

---

### 9. Account Deletion

A user can permanently delete their own account from the profile dropdown. The operation:
- Transfers admin role to the next earliest-joined member in any group where the user is admin
- Deletes sole-member groups entirely (including their pot and proposals)
- Cascades through all user-owned data in dependency order inside a single transaction with a 30-second timeout

| File | Role |
|---|---|
| `app/api/user/delete/route.ts` | DELETE — full cascade in transaction |
| `components/layout/ProfileDropdown.tsx` | "Delete account" option with confirmation |

---

### 10. Weekly Email Digest

Every Monday at 08:00 UTC a cron job sends each user a summary email for each group they belong to. The email includes: their active goals with frequencies, count of pending nominations, count of active challenges, and the current pot total.

| File | Role |
|---|---|
| `app/api/digest/route.ts` | POST cron endpoint — iterates all groups and members |
| `lib/email.ts` | `sendDigestEmail()` — HTML template via Resend |
| `vercel.json` | Cron schedule: `0 8 * * 1` (Monday 08:00 UTC) |

---

### 11. Sound Effects

Key interactions play short synthesized sounds using the Web Audio API. No audio files are downloaded — all sounds are generated programmatically via `AudioContext`. A `<ClickSound>` component wraps interactive elements for consistent tap feedback.

Sounds play on: login success, accepting a nomination, quick check-in upload, emoji reaction click, challenge triggered, penalty added, proposal voted.

| File | Role |
|---|---|
| `lib/sounds.ts` | All sound generators (`playLoginSuccess`, `playAcceptNomination`, `playClick`, etc.) |
| `components/ui/ClickSound.tsx` | Wrapper component that plays a click on any child interaction |

---

### 12. Onboarding Flow

Every new user sees a 4-step flow on first login. Once completed, `has_onboarded` is set to `true` in the DB and the JWT, and the flow is never shown again. The app layout double-checks `has_onboarded` and redirects to `/onboarding` if it is still `false`.

Steps:
1. **Language picker** — choose EN / FR / AR; sets LOCALE cookie immediately (UI re-renders in the chosen language before the rest of the app does)
2. **Password step** — OAuth users can optionally set a backup email/password; email-registered users skip this step entirely
3. **Avatar upload** — crop/zoom modal backed by `react-easy-crop`; "Skip for now" available
4. **Walkthrough** — 4 slides (goals, pot, challenges, nominations) with navigation dots; final slide prompts "Set my first goal" or "Skip"

After completing the walkthrough, if the user has no group yet they are redirected to `/groups/new` before reaching the app.

| File | Role |
|---|---|
| `app/(auth)/onboarding/page.tsx` | Server page — checks `has_onboarded`, passes props to flow |
| `components/onboarding/OnboardingFlow.tsx` | Full 4-step client component with inline translations |
| `app/api/user/onboard/route.ts` | PATCH — saves language + optional password hash, sets `has_onboarded = true` |
| `ONBOARDING.md` | Full spec for this feature |

---

## End of session routine

At the end of every session always:

1. Summarize what you built this session — file by file, one sentence each
2. Update the Current status section checkboxes
3. Run: git add . && git commit -m "descriptive message" && git push

Never auto-commit. Always explain first, wait for permission, then commit.
