# LAUNCH.md — Family Quest Pre-Launch Fix Plan

> This file tracks every issue that must be resolved before (and shortly after) public launch.
> Do not start any item without reading the relevant files listed under "Files to touch."
> Work items in priority order. Do not skip ahead.

---

## P0 — Must fix before public launch

---

### ✅ P0-1 · Onboarding re-asks for a password the user just set — done 14 Apr 2026

**What needs to change**
A user who just registered with email + password is immediately asked to "set a
password" again in the onboarding flow. This looks like a bug and causes instant
abandonment. Additionally, registration enforces min 8 chars while the onboarding
API only enforces min 6 — a silent security downgrade.

The password step should only appear for OAuth users (Google sign-in) who have
no password at all. For email-registered users it must be skipped entirely.

The fix: at registration time, store a short-lived flag (e.g. a `registered_with_password`
boolean, or simply detect `password_hash !== null`) so the onboarding flow knows
to skip Step 2. The `isOAuthUser` prop already exists in `OnboardingFlow` —
the logic just needs to be applied to credentials users who self-registered too.

**Files to touch**
- `app/(auth)/onboarding/page.tsx` — pass correct `isOAuthUser` value; a user
  with a `password_hash` AND who is not an OAuth user should also skip the step
- `components/onboarding/OnboardingFlow.tsx` — rename prop to `skipPasswordStep`
  or adjust logic so newly registered credentials users skip Step 2
- `app/api/user/onboard/route.ts` — enforce consistent min 8 chars on `newPassword`
  (match the registration schema)

**Effort:** Small

---

### ✅ P0-2 · No forgot password / account recovery — done 14 Apr 2026

**What needs to change**
There is no way for a user to recover their account if they forget their password.
They are permanently locked out. A "Forgot password?" link must be added to the
login page. Clicking it sends a one-time reset link by email. The link opens a
page where the user sets a new password.

Requires:
1. An email provider (Resend — free tier covers this)
2. Two new DB fields on User: `reset_token String?` and `reset_expires_at DateTime?`
3. A DB migration
4. Two new API routes: POST request-reset and POST confirm-reset
5. Two new pages: the request form and the new-password form

**Files to touch**
- `prisma/schema.prisma` — add `reset_token String?`, `reset_expires_at DateTime?` to User
- `app/(auth)/login/page.tsx` — add "Forgot password?" link
- `app/(auth)/forgot-password/page.tsx` — new page: email input form
- `app/(auth)/reset-password/page.tsx` — new page: new password form (reads token from URL)
- `app/api/auth/forgot-password/route.ts` — new: POST email → generate token → send email
- `app/api/auth/reset-password/route.ts` — new: POST token + newPassword → update hash
- `lib/email.ts` — new: Resend client wrapper with `sendPasswordReset(email, token)` helper
- `.env` / Vercel env vars — add `RESEND_API_KEY`
- `messages/en.json`, `fr.json`, `ar.json` — add `forgotPassword.*` keys

**Effort:** Medium

---

### ✅ P0-3 · The pot money is fictional — no payment mechanism — done 14 Apr 2026

**What needs to change**
The core value proposition ("real money stakes") is undeliverable as-is. The pot
accumulates fictional numbers. Nothing enforces payment. Users discover this after
their first Sunday penalty and stop caring.

Short-term fix (launch now): add a clear disclaimer wherever penalty amounts
appear — on the goal creation form, the pot page, and the penalty feed items —
stating that penalties are tracked here and that the group settles payment outside
the app (Lydia, PayPal, bank transfer, cash).

Long-term fix (post-launch): integrate Stripe to charge penalty amounts to a
saved card and hold in escrow until a proposal vote succeeds.

**Files to touch (disclaimer only — do this now)**
- `components/goals/CreateGoalForm.tsx` — add disclaimer under penalty amount field
- `app/(app)/pot/page.tsx` — add disclaimer banner at the top of the pot page
- `components/feed/FeedItem.tsx` — add small note on penalty feed items
- `messages/en.json`, `fr.json`, `ar.json` — add `pot.disclaimer` key

**Effort:** Small (disclaimer) / Large (Stripe integration)

---

### ✅ P0-4 · No active nav item highlighting — done 14 Apr 2026

**What needs to change**
The bottom navigation has 7 items. None is highlighted when active. Users cannot
tell where they are in the app. The `NavLink` component in the app layout is a
server component and cannot use `usePathname()` directly — it needs to be
converted to a client component or wrapped in one.

**Files to touch**
- `app/(app)/layout.tsx` — extract `NavLink` into a separate client component
  (or add `"use client"` wrapper) that uses `usePathname()` to detect active route
  and applies `color: #6C31E3` + `fontWeight: 800` to the active item

**Effort:** Small

---

### ✅ P0-5 · Goal progress is invisible during the week — done 14 Apr 2026

**What needs to change**
Goal cards show the target frequency ("3× per week") but not current week progress
("1 of 3 done"). Users must manually count check-ins. There is no mid-week feedback.

Fix: on the profile page and goal detail page, count checkins for the current
ISO week (Monday 00:00 UTC → Sunday 23:59 UTC) and display "X / Y this week"
with a progress bar. Color it green if on track (checked_in / days_elapsed ≥
required / 7), red if behind.

**Files to touch**
- `app/(app)/profile/page.tsx` — pass weekly checkin count to goal card display
- `app/(app)/profile/goals/[id]/page.tsx` — show week progress prominently
- `lib/goals.ts` — add `getWeeklyProgress(goalId, userId)` helper that queries
  checkins WHERE week_number = current_week AND year = current_year
- `components/goals/GoalCard.tsx` (if it exists) or the inline goal card in
  profile page — add progress bar and "X / Y" label

**Effort:** Small

---

### P0-6 · No email or push notifications — app invisible when closed

**What needs to change**
Every notification is in-app only. When the app is closed, users receive no signal
that anything happened. This is the single biggest retention killer.

Minimum viable: send a weekly digest email every Monday morning with:
- Goals active this week
- Pending nominations (if any)
- Active challenges (if any)
- Pot total

Critical event emails (send immediately when event occurs):
- Nomination received
- Challenge triggered
- Penalty applied (Sunday night, bundled with penalty cron)

**Files to touch**
- `lib/email.ts` — new: Resend client, reusable `sendEmail(to, subject, html)` helper
- `lib/notifications.ts` — extend `createNotification()` to also trigger email
  for critical events (nomination received, challenge triggered)
- `app/api/penalties/weekly/route.ts` — after writing penalties, send penalty
  summary email to each affected user
- `app/api/digest/route.ts` — new: Monday digest cron endpoint
- `vercel.json` — add Monday 08:00 UTC cron for digest
- `.env` / Vercel env vars — add `RESEND_API_KEY`
- `messages/en.json`, `fr.json`, `ar.json` — add `email.*` keys for subject lines

**Effort:** Medium

---

### ✅ P0-7 · Cron job has no fallback and no monitoring — done 14 Apr 2026

**What needs to change**
If the Sunday cron fails silently, no penalties fire and the whole week is lost.
There is no way for an admin to detect this or recover.

Fix:
1. Add `last_penalty_run_at DateTime?` to the Group model
2. Update the penalty cron to stamp this field after each run
3. In the group settings page, show a warning banner if `last_penalty_run_at`
   is more than 8 days ago
4. Add a "Run penalties manually" button in group settings (admin only) that
   calls the penalty endpoint for the previous week

**Files to touch**
- `prisma/schema.prisma` — add `last_penalty_run_at DateTime?` to Group
- `app/api/penalties/weekly/route.ts` — stamp `last_penalty_run_at` on each group processed
- `app/(app)/groups/[id]/settings/page.tsx` — show stale-cron warning and manual trigger button
- `app/api/groups/[id]/run-penalties/route.ts` — new: admin-only POST that triggers
  penalty calculation for that group's previous week
- `components/groups/GroupSettingsPanel.tsx` — add the warning banner + button UI

**Effort:** Small

---

## P1 — Important, fix soon after launch

---

### ✅ P1-1 · No email verification on registration — done 14 Apr 2026

**What needs to change**
Users can register with any email address including one they don't own. For a
family app built on trust and real money, this is a meaningful risk.

Fix: after registration, send a verification email. Show a banner on every
page ("Please verify your email") until verified. Block goal creation and
group joining until email is verified.

Note: the `email_verified` field already exists on the User model — it just
needs to be wired into the registration + email send flow.

**Files to touch**
- `app/api/auth/register/route.ts` — after creating user, send verification email
  via `lib/email.ts`; add `verification_token` to User (new DB field)
- `prisma/schema.prisma` — add `verification_token String?` to User
- `app/(app)/layout.tsx` — show "verify your email" banner if `!currentUser.email_verified`
- `app/api/auth/verify-email/route.ts` — new: GET with token → set `email_verified = true`
- `app/(auth)/verify-email/page.tsx` — new: "email sent" confirmation page
- `lib/email.ts` — add `sendVerificationEmail(email, token)` function
- `messages/en.json`, `fr.json`, `ar.json` — add `emailVerification.*` keys

**Effort:** Medium

---

### ✅ P1-2 · Challenges have no deadline — done 14 Apr 2026

**What needs to change**
Challenges can be ignored forever. There is no time pressure, no escalation,
no consequence for non-completion.

Fix: add a `deadline DateTime` field to Challenge (set to triggered_at + 7 days).
Show a countdown in the challenge card. If the deadline passes, the Sunday cron
applies an extra penalty and marks the challenge as `expired`.

**Files to touch**
- `prisma/schema.prisma` — add `deadline DateTime?` and `expired` to Challenge status enum
- `lib/challenges.ts` — set `deadline = now + 7 days` when creating a challenge
- `app/api/penalties/weekly/route.ts` — check for expired challenges and apply extra penalty
- `components/challenges/MyChallengeCard.tsx` — show countdown to deadline
- `components/challenges/OtherChallengeCard.tsx` — show deadline
- `messages/en.json`, `fr.json`, `ar.json` — add `challenges.deadline` and `challenges.expired` keys

**Effort:** Medium

---

### ✅ P1-3 · Current week and reset time not shown anywhere — done 14 Apr 2026

**What needs to change**
The app tracks everything Monday–Sunday but never tells the user what week it is
or when it resets. Users miss deadlines because they don't know when Sunday is.

Fix: add a small "Week 17 · resets Sunday" label to the feed page header and
profile page. The week number is derivable from the current date with no DB query.

**Files to touch**
- `app/(app)/feed/page.tsx` — add week label to page header
- `app/(app)/profile/page.tsx` — add week label near goal section header
- `lib/dates.ts` — new (or inline): `getCurrentWeekLabel()` helper returning
  e.g. "Week 17 · resets Sunday"
- `messages/en.json`, `fr.json`, `ar.json` — add `common.weekLabel` key

**Effort:** Small

---

### ✅ P1-4 · Member email addresses exposed to the whole group — done 14 Apr 2026

**What needs to change**
`app/(app)/members/[userId]/page.tsx` displays the full email address of every
group member. Email is PII and should not be visible to the whole group.

Fix: remove email from the member card. Show it only on the user's own profile
page (`app/(app)/profile/page.tsx`).

**Files to touch**
- `app/(app)/members/[userId]/page.tsx` — remove email from the hero card display
- `app/api/` (any route returning other users' emails) — audit and remove email
  from member-facing responses

**Effort:** Small

---

### ✅ P1-5 · No vacation / freeze week — done 14 Apr 2026

**What needs to change**
There is no way to pause participation for a week. Illness, travel, or personal
hardship still results in a Sunday penalty.

Fix: add a "Freeze this week" button on the profile page. A frozen week is stored
as a `WeekFreeze` record. The Sunday cron skips penalty calculation for frozen
members. Limit: 2 freezes per month per user.

**Files to touch**
- `prisma/schema.prisma` — new `WeekFreeze` model (user_id, group_id, week_number, year, reason, created_at)
- `app/api/user/freeze-week/route.ts` — new: POST to freeze current week (validates limit)
- `app/api/penalties/weekly/route.ts` — skip users with a freeze record for the current week
- `app/(app)/profile/page.tsx` — add "Freeze this week" button with confirmation + reason input
- `messages/en.json`, `fr.json`, `ar.json` — add `profile.freeze.*` keys

**Effort:** Medium

---

### ✅ P1-6 · Proposal closing date not shown — already implemented via timeUntil() in ProposalCard

**What needs to change**
Proposals close after 48 hours but no closing time is displayed. Members
don't know if they have 2 minutes or 2 days to vote.

Fix: show `closes_at` as a live countdown in each proposal card using a client
component (`"closes in 4h 12m"` or `"closed"`).

**Files to touch**
- `components/pot/ProposalCard.tsx` — add countdown display using `closes_at`
- `components/ui/Countdown.tsx` — new small client component that formats
  a future timestamp as a human-readable countdown

**Effort:** Small

---

### P1-7 · Onboarding is static slides, not the intended interactive tour

**What needs to change**
ONBOARDING.md specifies tooltip bubbles overlaid on the real app UI, pointing at
actual elements (goal slots, bottom nav, pot icon). What was built is a generic
slide deck. Users exit onboarding having never seen the real interface.

Fix: implement the tooltip overlay — render the real profile page underneath,
dimmed, with comic-style pointer bubbles that highlight elements in sequence.
Four tooltips: goal slots → feed tab → pot tab → avatar. Final CTA: "Set my
first goal" or "Skip for now."

**Files to touch**
- `components/onboarding/OnboardingFlow.tsx` — replace WalkthroughStep slides
  with a tooltip overlay component
- `components/onboarding/TooltipOverlay.tsx` — new: renders dimmed backdrop +
  comic pointer bubble positioned over target elements
- `app/(auth)/onboarding/page.tsx` — may need to render layout elements for
  the tour to point at real UI

**Effort:** Large

---

### ✅ P1-8 · Goals cannot be edited after creation — done 14 Apr 2026

**What needs to change**
Once a goal is created, title, category, frequency, and penalty amount are
permanently locked. The only escape is deletion, which destroys all check-in
history.

Fix: add an "Edit goal" button on the goal detail page (owner only). On submit,
PATCH the goal and create a feed item logging the change.

**Files to touch**
- `app/(app)/profile/goals/[id]/page.tsx` — add Edit button (owner only)
- `components/goals/EditGoalForm.tsx` — new: pre-filled form for title/category/
  frequency/penalty (same fields as CreateGoalForm)
- `app/api/goals/[id]/route.ts` — extend PATCH to handle title, category,
  frequency_count, penalty_amount updates
- `lib/goals.ts` — add validation for edit (frequency must match existing checkins
  logic, etc.)
- `messages/en.json`, `fr.json`, `ar.json` — add `goals.edit.*` keys

**Effort:** Medium

---

### ✅ P1-9 · No PWA — app not installable on mobile — done 14 Apr 2026

**What needs to change**
There is no `manifest.json` and no install prompt. On mobile (the primary use
case for daily habit tracking and proof photo uploads), users must re-navigate
to the URL every time. Daily habit apps not on the home screen are forgotten.

Fix: add a Web App Manifest with the app name, icons, and `display: standalone`.
Add a simple "Add to home screen" banner for first-time mobile visitors.

**Files to touch**
- `public/manifest.json` — new: name, short_name, icons (at least 192×192 and
  512×512 PNG), theme_color `#6C31E3`, background_color `#FFFBF0`,
  display `standalone`, start_url `/`
- `public/icons/` — new: app icon files at 192px and 512px
- `app/layout.tsx` — add `<link rel="manifest" href="/manifest.json" />` and
  `<meta name="theme-color" content="#6C31E3" />`
- `components/ui/InstallBanner.tsx` — new: client component that listens for
  `beforeinstallprompt` and shows a comic-style "Install app" banner on mobile

**Effort:** Small (manifest + icons) / Medium (full install banner + offline)

---

## P2 — Nice to have, future improvements

| # | Issue | What to change | Files | Effort |
|---|-------|---------------|-------|--------|
| P2-1 | Leaderboard no time filter | Add "This month / All time" toggle | `app/(app)/leaderboard/page.tsx`, `app/api/leaderboard/route.ts` | Small |
| P2-2 | Feed doesn't auto-refresh | Add `router.refresh()` on visibility change or poll every 60s | `app/(app)/feed/page.tsx` | Small |
| P2-3 | No emoji reaction variety | Expand reaction options beyond current set | `components/feed/ReactionBar.tsx`, `app/api/checkins/[id]/react/route.ts` | Small |
| P2-4 | Nominations never expire | Add `expires_at` field + cron to auto-decline old ones | `prisma/schema.prisma`, `lib/nominations.ts`, `app/api/penalties/weekly/route.ts` | Small |
| P2-5 | Check-ins can't be deleted | Add delete button on own check-ins (within 1h of posting) | `app/(app)/profile/goals/[id]/page.tsx`, `app/api/goals/[id]/checkin/route.ts` | Small |
| P2-6 | No per-week goal history | Add weekly breakdown view on goal detail page | `app/(app)/profile/goals/[id]/page.tsx`, `lib/goals.ts` | Medium |
| P2-7 | No group description | Add `description` field to Group creation and settings | `prisma/schema.prisma`, `app/(app)/groups/new/page.tsx`, `components/groups/GroupSettingsPanel.tsx` | Small |
| P2-8 | No dark mode | Add CSS variables + media query for dark theme | `app/globals.css`, all components | Medium |
| P2-9 | Member cards show no history | Add "X goals completed" stat to member card | `app/(app)/members/[userId]/page.tsx` | Small |
| P2-10 | Invite code brute-forceable | Add rate limiting on `/join/[code]` page and API | `app/api/groups/join/route.ts`, `middleware.ts` | Small |
| P2-11 | Challenge suggestion no "seen" indicator | Add `seen_at` to ChallengeSuggestion | `prisma/schema.prisma`, `components/challenges/` | Small |
| P2-12 | No admin engagement dashboard | New `/groups/[id]/stats` page with weekly engagement | `app/(app)/groups/[id]/stats/page.tsx`, new API route | Large |

---

## Build order recommendation

Fix P0 items first, in this sequence (all small/medium effort, high impact):

1. **P0-4** Active nav highlight — 30 minutes, pure UI
2. **P0-1** Onboarding password fix — 1 hour, prevents day-1 abandonment
3. **P0-3** Pot disclaimer — 1 hour, sets correct expectations
4. **P0-5** Goal weekly progress — 2 hours, core engagement loop
5. **P0-7** Cron fallback + monitoring — 2 hours, protects the game engine
6. **P0-6** Email notifications (weekly digest) — 1 day, biggest retention lever
7. **P0-2** Forgot password — 1 day, required for production auth

Then P1 items in order of effort (small first):

8. **P1-3** Week label — 30 minutes
9. **P1-4** Hide member emails — 30 minutes
10. **P1-6** Proposal countdown — 1 hour
11. **P1-9** PWA manifest — 2 hours
12. **P1-1** Email verification — 1 day
13. **P1-2** Challenge deadline — 1 day
14. **P1-5** Freeze week — 1 day
15. **P1-8** Edit goals — 1 day
16. **P1-7** Interactive onboarding tour — 2–3 days
