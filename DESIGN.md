# DESIGN.md — Comic Style Redesign Guide

> Read this file fully before touching any design-related file.
> Follow the goals in order. Do not skip ahead.
> After each goal explain what you changed and wait for approval before committing.

---

## The vision

The app should feel like a **comic book adventure game**.
Think bold outlines, warm colors, chunky fonts, expressive cards.
Every interaction should feel fun and alive — not corporate, not generic.

Reference: think Duolingo meets a comic book.

---

## Design system

### Fonts

Load both from Google Fonts in `app/layout.tsx`:

- **Bangers** — all titles, headings, section labels, nav labels, amounts
- **Nunito** — all body text, subtitles, form labels, buttons, badges

```html
<link
  href="https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;600;700;800&display=swap"
  rel="stylesheet"
/>
```

---

### Colors

```css
--color-bg: #fffbf0; /* warm cream — page background */
--color-primary: #6c31e3; /* bold purple — primary actions, profile card */
--color-success: #2ecc71; /* bright green — on track, success */
--color-danger: #e74c3c; /* bold red — penalty, behind, danger */
--color-warning: #f1c40f; /* sunny yellow — pot card, streak badge */
--color-dark: #1a1a2e; /* near black — ALL borders and text */
--color-surface: #ffffff; /* white — card backgrounds */
--color-muted: #f1efe8; /* light cream — empty states, progress bg */
```

---

### Comic card (apply to ALL cards everywhere)

```css
background: white;
border: 3px solid #1a1a2e;
border-radius: 16px;
box-shadow: 3px 3px 0 #1a1a2e;
padding: 14px;
```

### Elevated card (profile card, important sections)

```css
border: 3px solid #1a1a2e;
border-radius: 20px;
box-shadow: 4px 4px 0 #1a1a2e;
padding: 16px;
```

---

### Buttons

```css
/* Primary */
background: #6c31e3;
border: 2px solid #1a1a2e;
border-radius: 100px;
box-shadow: 2px 2px 0 #1a1a2e;
color: white;
font-family: Nunito;
font-weight: 800;
padding: 8px 20px;

/* Success */
background: #2ecc71;
color: #1a1a2e;
/* same border + shadow */

/* Danger */
background: #e74c3c;
color: white;
/* same border + shadow */

/* Ghost */
background: white;
color: #1a1a2e;
/* same border + shadow */
```

---

### Badges / pills

```css
border: 2px solid #1a1a2e;
border-radius: 100px;
font-family: Nunito;
font-weight: 800;
font-size: 11px;
text-transform: uppercase;
letter-spacing: 0.5px;
padding: 3px 10px;
```

Category colors:

- Body: background `#FFE0E0`, color `#C0392B`
- Mind: background `#E0E8FF`, color `#2C3E8C`
- Soul: background `#E8FFE8`, color `#1A7A1A`
- Work: background `#FFF3E0`, color `#B36200`
- Relationships: background `#FFE8F5`, color `#8C1A5C`

---

### Progress bars

```css
background: #f1efe8;
border: 2px solid #1a1a2e;
border-radius: 100px;
height: 14px;
overflow: hidden;
```

Fill color:

- On track (>= 50%): `#2ECC71`
- Behind (< 50%): `#E74C3C`

---

### Profile card

```css
background: #6c31e3;
border: 3px solid #1a1a2e;
border-radius: 20px;
box-shadow: 4px 4px 0 #1a1a2e;
```

- Name: Bangers font, white, 22px
- Streak badge: background `#F1C40F`, border `2px solid #1a1a2e`, Nunito 800

---

### Pot card

```css
background: #f1c40f;
border: 3px solid #1a1a2e;
border-radius: 16px;
box-shadow: 3px 3px 0 #1a1a2e;
```

- Amount: Bangers font, `#1a1a2e`, 32px

---

### Penalty feed items

```css
background: #ffe0e0;
border: 3px solid #e74c3c;
border-radius: 16px;
box-shadow: 3px 3px 0 #e74c3c;
```

### Challenge feed items

```css
background: #fff3e0;
border: 3px solid #f39c12;
border-radius: 16px;
box-shadow: 3px 3px 0 #f39c12;
```

---

### Bottom navigation

```css
background: white;
border: 3px solid #1a1a2e;
border-radius: 20px;
box-shadow: 3px 3px 0 #1a1a2e;
```

- Labels: Bangers font, uppercase, letter-spacing 1px
- Active item: color `#6C31E3`
- Inactive item: color `#888`

---

### Page background

Every page: `background: #FFFBF0`
Set in `globals.css`:

```css
body {
  background: #fffbf0;
}
```

---

### Empty states

- Background: `#F1EFE8`
- Border: `3px dashed #B4B2A9`
- Border-radius: 16px
- Text: Nunito 700, color `#888`, centered
- Example: "No goals yet — start your quest!"

---

### Section titles

```css
font-family: Bangers;
font-size: 18px;
letter-spacing: 1px;
color: #1a1a2e;
```

Always add a relevant emoji before the title:

- Goals: ⚔️ Active quests
- Feed: 📰 Latest activity
- Family: 👥 Family
- Nominations: 📬 Nominations
- Challenges: ⚡ Challenges
- Pot: 💰 Family pot
- Leaderboard: 🏆 Rankings
- Notifications: 🔔 Notifications

---

## Build goals — follow in order

---

### Goal 1 — Foundation

Files to change:

- `app/globals.css` — set body background, import fonts, base reset
- `app/layout.tsx` — add Google Fonts link tags
- `app/(app)/layout.tsx` — full navbar + bottom nav redesign
- `components/ui/Button.tsx` — if exists, update to comic style
- `components/ui/Avatar.tsx` — add thick border comic style

What it should look like after:

- Warm cream background on all pages
- Bangers + Nunito loaded
- Bottom nav has comic card style with thick border
- Header shows app name in Bangers + avatar + notification bell

---

### Goal 2 — Profile + Goals

Files to change:

- `app/(app)/profile/page.tsx`
- `app/(app)/profile/goals/new/page.tsx`
- `components/goals/CreateGoalForm.tsx`
- `app/(app)/profile/goals/[id]/page.tsx`
- `components/goals/GoalActions.tsx`
- `app/(app)/profile/goals/[id]/checkin/page.tsx`
- `components/goals/CheckinForm.tsx`
- `app/(auth)/login/page.tsx`

What it should look like after:

- Profile has purple hero card with avatar + streak
- Two goal slots clearly visible with comic cards
- Goal cards show progress bar + category badge
- "Upload proof" button is green
- Login page has warm background + comic card form

---

### Goal 3 — Social

Files to change:

- `app/(app)/members/page.tsx`
- `app/(app)/members/[userId]/page.tsx`
- `app/(app)/members/[userId]/nominate/page.tsx`
- `components/nominations/NominateForm.tsx`
- `app/(app)/nominations/page.tsx`
- `components/nominations/NominationCard.tsx`
- `app/(app)/challenges/page.tsx`
- `app/(app)/challenges/[userId]/suggest/page.tsx`
- `components/challenges/MyChallengeCard.tsx`
- `components/challenges/OtherChallengeCard.tsx`
- `components/challenges/SuggestForm.tsx`

What it should look like after:

- Family members shown as comic avatar cards
- Member card has their goals + nominate button
- Nomination cards are expressive with accept/decline buttons
- Challenge cards use orange warning style

---

### Goal 4 — Feed + Pot

Files to change:

- `app/(app)/feed/page.tsx`
- `components/feed/FeedItem.tsx`
- `components/feed/ReactionBar.tsx`
- `app/(app)/pot/page.tsx`
- `components/pot/ProposalCard.tsx`
- `components/pot/ProposeForm.tsx`

What it should look like after:

- Feed has different card styles per activity type
- Penalty items: red border + red background
- Checkin items: white card with proof photo + reactions
- Reaction buttons have thick border pill style
- Pot page has big yellow treasure card with amount
- Proposals have vote buttons with comic style

---

### Goal 5 — Stats + Polish + Sound

Files to change:

- `app/(app)/leaderboard/page.tsx`
- `app/(app)/notifications/page.tsx`
- `components/notifications/NotificationList.tsx`
- `components/ui/LanguageSelector.tsx`
- New file: `lib/sounds.ts` — sound effects system

Sound effects to add:

```
Login success     → fanfare / level up sound
Upload proof      → success chime / ding
Miss goal         → sad trombone / oof
Penalty added     → coin drop sound
Nomination received → notification pop
Challenge triggered → dramatic horn
React with emoji  → satisfying click pop
Accept nomination → level up chime
```

Use the Web Audio API for sounds — no external files needed.
Generate sounds programmatically using AudioContext.
This means zero file downloads, works everywhere.

What it should look like after:

- Leaderboard has gold/silver/bronze medal cards
- Top 3 players have colored cards
- Notifications have icons per type
- Every key action plays a sound
- Full app feels consistent and polished

---

## Rules for Claude Code during redesign

1. Never change any business logic — only CSS and layout
2. Never remove existing functionality while restyling
3. Keep all Tailwind classes that handle responsive behavior
4. After each goal: explain what you changed, wait for approval
5. Test locally with `npm run dev` after each goal
6. Never commit until explicitly told to

---

## Current status

- [x] Goal 1 — Foundation
- [x] Goal 2 — Profile + Goals
- [x] Goal 3 — Social
- [x] Goal 4 — Feed + Pot
- [x] Goal 5 — Stats + Polish + Sound
