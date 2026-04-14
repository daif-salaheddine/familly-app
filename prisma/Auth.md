# Family Quest — Auth & Group System Plan

> Last updated to reflect approved implementation plan.

---

## Auth Methods (3 ways to sign in)

1. **Email + Password** — classic credentials
2. **Sign in with Google** — OAuth via Google Console
3. **Sign in with Apple** — skip for now, add later (requires Apple Developer account $99/year)

---

## Session Strategy

**JWT-based sessions** — no Session table in the database.
Lightweight and correct for this app's needs.

---

## Group / Invite Flow (Tricount-inspired)

- Anyone can sign up and **create a group** → becomes ADMIN automatically
- Creating a group generates a **unique permanent invite link**
  - Example: `familyquest.app/join/xK92mP`
- Admin shares link with family/friends via WhatsApp, SMS, etc.
- Someone clicks the link → lands on an **invite landing page** showing:
  - Group name
  - Current members + avatars
  - "Join this group" button
- **If they already have an account** → auto-join the group immediately
- **If they don't have an account** → register or login first, then auto-join
- One user can belong to **multiple groups**
- Invite links **never expire**

---

## Multi-Group UI: Active Group Switcher

Since users can belong to multiple groups, the app needs to know
which group to show on every page (feed, goals, pot, leaderboard).

**Decision: Active Group Switcher in the navbar**

- User picks their "active group" from a dropdown/switcher in the navbar
- All pages scope their data to the active group
- Works like switching workspaces in Slack
- The last active group is saved so it persists on reload

---

## Admin Powers (group creator)

| Action                 | Description                         |
| ---------------------- | ----------------------------------- |
| Kick member            | Remove a member from the group      |
| Rename group           | Change the group display name       |
| Regenerate invite link | Invalidate old link, create new one |
| Transfer admin         | Give admin role to another member   |

---

## Database Changes Needed

### Modified tables

**USER**

- Add `password_hash` (nullable — OAuth users won't have one)

**GROUP**

- Add `invite_code` — unique short code for the invite link

**GROUP_MEMBER**

- `role` field already exists (`ADMIN` | `MEMBER`) — no change needed

### New tables

**Account** (lightweight — OAuth provider tokens only)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  access_token      String?
  refresh_token     String?
  expires_at        Int?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

> No Session table — using JWT.
> No VerificationToken table — not using magic links or email verification.

---

## Environment Variables

```env
# NextAuth
AUTH_SECRET=your_random_secret
NEXTAUTH_URL=https://yourapp.vercel.app

# Google OAuth (NextAuth v5 reads these automatically by convention)
AUTH_GOOGLE_ID=from Google Cloud Console
AUTH_GOOGLE_SECRET=from Google Cloud Console

# Apple OAuth (add later)
# AUTH_APPLE_ID=
# AUTH_APPLE_SECRET=
# AUTH_APPLE_TEAM_ID=
# AUTH_APPLE_KEY_ID=
```

### Where to get Google credentials

1. Go to console.cloud.google.com
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add redirect URI: `https://yourapp.vercel.app/api/auth/callback/google`
5. Copy Client ID → `AUTH_GOOGLE_ID`
6. Copy Client Secret → `AUTH_GOOGLE_SECRET`

---

## New Files to Create

```
/app/auth/login/page.tsx           — Login page (email or OAuth buttons)
/app/auth/register/page.tsx        — Register page
/app/join/[code]/page.tsx          — Invite landing page
/app/group/new/page.tsx            — Create new group after first signup
/components/GroupSwitcher.tsx      — Navbar active group switcher dropdown
/api/auth/[...nextauth]/route.ts   — NextAuth config (full replacement)
/api/groups/route.ts               — POST: create group
/api/groups/[id]/members/route.ts  — DELETE: kick member, PATCH: transfer admin
/api/join/[code]/route.ts          — GET: fetch group info, POST: join group
```

---

## Files to Modify

```
/auth.ts                   — full replacement with Google + Credentials
/prisma/schema.prisma      — add Account table + new fields
/middleware.ts             — protect routes, redirect if not logged in
/components/Navbar.tsx     — add GroupSwitcher component
/lib/getActiveGroup.ts     — replace getUserGroup() with active group logic
```

---

## Step by Step Implementation Order

| Step | Task                                                        | Complexity |
| ---- | ----------------------------------------------------------- | ---------- |
| 1    | Update Prisma schema (Account table + new fields)           | Easy       |
| 2    | Run migration on Supabase                                   | Easy       |
| 3    | Set up Google OAuth in Google Cloud Console                 | Easy       |
| 4    | Configure NextAuth with Google + Credentials (JWT)          | Medium     |
| 5    | Build login + register pages (comic style)                  | Medium     |
| 6    | Build invite landing page `/join/[code]`                    | Medium     |
| 7    | Build "create group" page shown after first signup          | Medium     |
| 8    | Build GroupSwitcher component in navbar                     | Medium     |
| 9    | Replace `getUserGroup()` with active group logic everywhere | Medium     |
| 10   | Build admin panel (kick, rename, regenerate link, transfer) | Medium     |
| 11   | Test OAuth account linking edge case explicitly             | Easy       |
| 12   | Full end-to-end flow test                                   | Medium     |

---

## Risks & Breaking Changes

- **All existing sessions will be invalidated** — users will need to log in again after migration
- **getUserGroup() is used in many places** — replacing with active group logic touches many files, do carefully one file at a time
- **OAuth account linking edge case** — if a user signs up with email then tries Google with the same email, the `signIn` callback must do find-or-create by email. This must be tested explicitly (Step 11)
- **Supabase migration** — adding new tables and columns must be done without dropping existing data
