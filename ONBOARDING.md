# ONBOARDING.md — First Login Flow

> Read CLAUDE.md and DESIGN.md before starting this feature.
> This is a full feature — it touches the database, API, middleware, and UI.
> Follow the steps in order. Give a plan before writing any code.
> Wait for approval before committing.

---

## What this feature does

Every user sees a 4-step onboarding flow the very first time they log in.
After completing it they never see it again.

The flow has 4 steps:

1. Pick your language
2. Set your personal password
2b. Upload avatar (optional — "Skip for now" available)
3. Interactive app walkthrough + first goal prompt

---

## Database change

Add one field to the User model in `prisma/schema.prisma`:

```prisma
has_onboarded Boolean @default(false)
```

Apply via Supabase MCP:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN NOT NULL DEFAULT false;
```

---

## How first login is detected

In `middleware.ts` / `proxy.ts`:

- If user is logged in AND `has_onboarded = false` → redirect to `/onboarding`
- If user is logged in AND `has_onboarded = true` → continue normally
- If user is not logged in → redirect to `/login`

To check `has_onboarded` in middleware:

- Add it to the JWT token in `auth.ts` (same pattern as `id`, `email`, `name`)
- Read it from the token in middleware — no DB query needed

---

## Route structure

```
app/
  (onboarding)/
    layout.tsx           ← minimal layout, no navbar, no bottom nav
    onboarding/
      page.tsx           ← Step 1: language picker
      password/
        page.tsx         ← Step 2: set personal password
      tour/
        page.tsx         ← Step 3: walkthrough + first goal prompt
```

---

## API routes

```
app/api/onboarding/
  set-language/route.ts  ← POST: save language choice to DB + cookie
  set-password/route.ts  ← POST: update user password (bcrypt hash)
  complete/route.ts      ← POST: set has_onboarded = true in DB
```

---

## Step 1 — Language picker

**Route:** `/onboarding`

**Layout:**

- Full screen warm cream background (`#FFFBF0`)
- App name "Family Quest" in Bangers font, centered, top area
- A welcome line shown in all 3 languages at once:
  - "Choose your language"
  - "Choisissez votre langue"
  - "اختر لغتك"
- Three big comic-style buttons stacked vertically with gap:
  - 🇬🇧 English
  - 🇫🇷 Français
  - 🇩🇿 العربية
- Progress dots at bottom: ● ○ ○ ○

**On button click:**

1. POST to `/api/onboarding/set-language` with `{ language: "EN" | "FR" | "AR" }`
2. API saves language to DB + sets LOCALE cookie
3. Redirect to `/onboarding/password`

**Button style:**

```css
background: white;
border: 3px solid #1a1a2e;
border-radius: 16px;
box-shadow: 3px 3px 0 #1a1a2e;
font-family: Nunito;
font-weight: 800;
font-size: 16px;
padding: 16px 32px;
width: 100%;
max-width: 320px;
```

---

## Step 2 — Set your password

**Route:** `/onboarding/password`

**Layout:**

- Same warm cream background
- Comic card centered on screen (max-width 400px)
- Title in Bangers: translated "Make it yours"
- Subtitle in Nunito: translated "Create a personal password for your account"
- Two fields:
  - New password (type="password", min 8 characters)
  - Confirm password (type="password")
- Error shown inline if passwords don't match or too short
- Green comic pill submit button: translated "Set my password"
- Progress dots at bottom: ● ● ○ ○

**On submit:**

1. Validate: min 8 chars, passwords match
2. POST to `/api/onboarding/set-password` with `{ password: "..." }`
3. API bcrypt hashes and updates user.password_hash in DB
4. Redirect to `/onboarding/tour`

**Translations needed:**

```json
{
  "en": {
    "title": "Make it yours",
    "subtitle": "Create a personal password",
    "label": "New password",
    "confirm": "Confirm password",
    "submit": "Set my password",
    "error_match": "Passwords don't match",
    "error_short": "At least 8 characters"
  },
  "fr": {
    "title": "Personnalisez-le",
    "subtitle": "Créez votre mot de passe personnel",
    "label": "Nouveau mot de passe",
    "confirm": "Confirmer le mot de passe",
    "submit": "Définir mon mot de passe",
    "error_match": "Les mots de passe ne correspondent pas",
    "error_short": "Au moins 8 caractères"
  },
  "ar": {
    "title": "اجعله خاصاً بك",
    "subtitle": "أنشئ كلمة مرور شخصية",
    "label": "كلمة المرور الجديدة",
    "confirm": "تأكيد كلمة المرور",
    "submit": "تعيين كلمة المرور",
    "error_match": "كلمتا المرور غير متطابقتين",
    "error_short": "8 أحرف على الأقل"
  }
}
```

---

## Step 2b — Avatar upload

**Route:** `/onboarding` (inline step — no separate route)

**Layout:**

- Same warm cream background and comic card
- Title in Bangers: "Show your face!" (translated per language)
- Subtitle in Nunito: "Add a profile photo so your family recognizes you."
- Centered `AvatarUpload` component (tap circle → crop/zoom modal → upload)
- "Skip for now" text link below — avatar is optional
- Progress dots: ● ● ● ○

**On upload success OR skip:**

→ Advance to Step 3 (walkthrough)

Avatar is saved immediately via `/api/upload/avatar` when the crop is confirmed.
`PATCH /api/user/onboard` optionally accepts `avatar_url` as well.

---

## Step 3 — Interactive walkthrough

**Route:** `/onboarding/tour`

**Layout:**

- Show the real profile page content underneath (blurred or dimmed slightly)
- Overlay 4 tooltip bubbles one at a time
- Each tooltip is a comic card pointing at a real UI element
- Progress dots at bottom: ● ● ● ●

**Tooltip sequence:**

Tooltip 1 — Goal slots:

- Points to: the goal slots area on the profile
- Text (EN): "Your quests live here. You get 2 slots — one you choose, one your family picks for you."
- Button: "Next →"

Tooltip 2 — Feed:

- Points to: feed icon in bottom nav
- Text (EN): "See your family's activity here. Cheer them on, or judge them silently."
- Button: "Next →"

Tooltip 3 — Pot:

- Points to: pot icon in bottom nav
- Text (EN): "Every missed goal adds money here. The family decides how to spend it."
- Button: "Next →"

Tooltip 4 — Avatar:

- Points to: profile avatar circle
- Text (EN): "Tap your photo to upload a picture. Let the family see your face."
- Button: "Got it!"

**After last tooltip — First goal prompt:**
Show a comic card overlay (centered, full-width):

```
Title (Bangers): "Ready for your first quest?"
Subtitle (Nunito): "Set a goal you want to work on this week."
Big green button: "Set my first goal →" → links to /profile/goals/new
Small link below: "Skip for now"
```

**On "Set my first goal" OR "Skip for now":**

1. POST to `/api/onboarding/complete`
2. API sets `has_onboarded = true` in DB
3. Also update JWT token so middleware knows
4. Redirect to `/profile`

**Tooltip style:**

```css
background: white;
border: 3px solid #1a1a2e;
border-radius: 16px;
box-shadow: 4px 4px 0 #1a1a2e;
padding: 16px;
max-width: 280px;
font-family: Nunito;
```

**Translations for tooltips:**

```json
{
  "en": {
    "t1": "Your quests live here. You get 2 slots — one you choose, one your family picks for you.",
    "t2": "See your family's activity here. Cheer them on, or judge them silently.",
    "t3": "Every missed goal adds money here. The family decides how to spend it.",
    "t4": "Tap your photo to upload a picture. Let the family see your face.",
    "cta_title": "Ready for your first quest?",
    "cta_sub": "Set a goal you want to work on this week.",
    "cta_btn": "Set my first goal →",
    "cta_skip": "Skip for now"
  },
  "fr": {
    "t1": "Vos quêtes sont ici. Vous avez 2 emplacements — un que vous choisissez, un que votre famille choisit.",
    "t2": "Voyez l'activité de votre famille ici. Encouragez-les, ou jugez-les en silence.",
    "t3": "Chaque objectif raté ajoute de l'argent ici. La famille décide comment le dépenser.",
    "t4": "Appuyez sur votre photo pour en télécharger une. Laissez la famille voir votre visage.",
    "cta_title": "Prêt pour votre première quête?",
    "cta_sub": "Définissez un objectif sur lequel travailler cette semaine.",
    "cta_btn": "Définir mon premier objectif →",
    "cta_skip": "Passer pour l'instant"
  },
  "ar": {
    "t1": "مهامك هنا. لديك فتحتان — واحدة تختارها، والأخرى تختارها عائلتك.",
    "t2": "شاهد نشاط عائلتك هنا. شجعهم، أو احكم عليهم في صمت.",
    "t3": "كل هدف فائت يضيف المال هنا. العائلة تقرر كيفية إنفاقه.",
    "t4": "اضغط على صورتك لرفع صورة. دع العائلة ترى وجهك.",
    "cta_title": "هل أنت مستعد لمهمتك الأولى؟",
    "cta_sub": "حدد هدفاً تريد العمل عليه هذا الأسبوع.",
    "cta_btn": "تعيين هدفي الأول ←",
    "cta_skip": "تخطي الآن"
  }
}
```

---

## Auth.ts changes

Add `has_onboarded` to the JWT token and session:

```typescript
// In jwt callback:
if (user) {
  token.has_onboarded = user.has_onboarded;
}

// In session callback:
session.user.has_onboarded = token.has_onboarded as boolean;
```

Also extend the TypeScript types in `types/index.ts`:

```typescript
interface SessionUser {
  id: string;
  email: string;
  name: string;
  has_onboarded: boolean; // add this
}
```

---

## Middleware changes

In `middleware.ts` / `proxy.ts`, add this logic:

```typescript
// After checking if user is logged in:
const hasOnboarded = token?.has_onboarded as boolean;

// If logged in but not onboarded → redirect to onboarding
if (
  !hasOnboarded &&
  !pathname.startsWith("/onboarding") &&
  !pathname.startsWith("/api")
) {
  return NextResponse.redirect(new URL("/onboarding", req.url));
}

// If logged in and onboarded but on onboarding page → redirect to profile
if (hasOnboarded && pathname.startsWith("/onboarding")) {
  return NextResponse.redirect(new URL("/profile", req.url));
}
```

---

## Design rules for onboarding screens

- All screens: warm cream background `#FFFBF0`
- All cards: comic style (3px solid #1a1a2e, border-radius 16px, box-shadow 3px 3px 0 #1a1a2e)
- All buttons: comic pill style from DESIGN.md
- All titles: Bangers font
- All body text: Nunito font
- Progress dots: simple ● ○ ○ indicator, centered, bottom of screen
- Arabic screens: `dir="rtl"` on the container

---

## Build order

1. Database — add `has_onboarded` column via Supabase MCP
2. Auth — add `has_onboarded` to JWT + session + types
3. API routes — set-language, set-password, complete
4. Middleware — add redirect logic
5. Onboarding layout — no navbar
6. Step 1 — language picker page
7. Step 2 — password page
8. Step 3 — tour page with tooltips + CTA
9. Test full flow end to end
10. Commit

---

## Current status

- [x] Database — has_onboarded column
- [x] Auth — JWT + session update
- [x] API routes
- [x] Middleware redirect logic
- [x] Onboarding layout
- [x] Step 1 — language picker
- [x] Step 2 — password reset
- [x] Step 2b — avatar upload (added 2026-04-12)
- [x] Step 3 — walkthrough + CTA
- [ ] End to end test
