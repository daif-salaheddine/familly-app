# TEST_PLAN.md — Extra Features Verification

> Go through each test one by one.
> Mark ✅ when confirmed working, ❌ when broken.
> For each ❌ note what happened so Claude Code can fix it.

---

## How to test

Use the live app at: familly-app-psi.vercel.app
Use multiple browsers or Chrome profiles to simulate different family members.
Test accounts: slaheddine@family.com, yasmine@family.com, etc. / password123

---

## 1. Week Freeze

**What it does:** Lets a user freeze one week so no penalty is charged even if they miss their goal. Max 2 per month.

**Test steps:**

- [ ] Login as any member who has an active goal
- [ ] Go to /profile
- [ ] Find the "Freeze Week" button
- [ ] Click it — confirm a success message appears
- [ ] Check the button shows "1 freeze remaining this month"
- [ ] Click it again — confirm it works a second time
- [ ] Try a third time — confirm it is blocked with a message
- [ ] Wait for Sunday cron (or ask Claude Code to run it manually)
- [ ] Confirm no penalty was charged for the frozen week

**Result:** **\*\***\_\_\_**\*\***

---

## 2. Google Login

**What it does:** Sign in with a Google account instead of email/password.

**Test steps:**

- [ ] Go to /login
- [ ] Click "Sign in with Google" button (confirm it exists)
- [ ] Complete Google OAuth flow
- [ ] Confirm you land on onboarding (if first time) or profile
- [ ] Confirm your name and email from Google appear correctly
- [ ] Sign out and sign back in with Google — confirm it works again

**Result:** **\*\***\_\_\_**\*\***

---

## 3. Email Verification

**What it does:** After registering, user gets a verification email. A banner appears until verified.

**Test steps:**

- [ ] Go to /register and create a new account with a real email
- [ ] Confirm you are redirected to onboarding or profile
- [ ] Confirm a yellow/orange banner appears saying "please verify your email"
- [ ] Check your email inbox for a verification link
- [ ] Click the link — confirm banner disappears
- [ ] Refresh — confirm banner is still gone

**Result:** **\*\***\_\_\_**\*\***

---

## 4. Forgot Password / Reset via Email

**What it does:** User can reset their password if they forget it.

**Test steps:**

- [ ] Go to /login
- [ ] Click "Forgot password?" link (confirm it exists)
- [ ] Enter a valid email address
- [ ] Check email inbox for reset link
- [ ] Click the link — confirm a "set new password" form appears
- [ ] Set a new password
- [ ] Login with the new password — confirm it works
- [ ] Try the old password — confirm it is rejected

**Result:** **\*\***\_\_\_**\*\***

---

## 5. Multiple Groups + Group Switcher

**What it does:** A user can be in multiple groups and switch between them.

**Test steps:**

- [ ] Login as Slaheddine
- [ ] Go to /groups/new
- [ ] Create a second group called "Test Group"
- [ ] Confirm you are now in 2 groups
- [ ] Find the group switcher in the header
- [ ] Switch to "Test Group" — confirm profile/feed updates to show this group
- [ ] Switch back to "Family" — confirm it returns to original data
- [ ] Confirm goals, nominations, pot are all group-specific

**Result:** **\*\***\_\_\_**\*\***

---

## 6. Group Invite Link

**What it does:** Admin generates a link. Anyone with the link can join the group.

**Test steps:**

- [ ] Login as Slaheddine (admin)
- [ ] Go to /groups/[id]/settings
- [ ] Find the invite link — confirm it shows an 8-character code
- [ ] Copy the invite link
- [ ] Open a new browser/incognito window
- [ ] Paste the invite link — confirm it shows group name + current members
- [ ] Login as Yasmine in that window
- [ ] Confirm Yasmine joins the group
- [ ] Back in Slaheddine's window — confirm Yasmine appears in member list
- [ ] Test "Regenerate" invite link — confirm old link no longer works

**Result:** **\*\***\_\_\_**\*\***

---

## 7. Group Admin Panel

**What it does:** Admin can rename group, manage members, transfer admin role, delete group.

**Test steps:**

### Rename group

- [ ] Go to /groups/[id]/settings as admin
- [ ] Change the group name
- [ ] Confirm new name appears in header

### Kick member

- [ ] In settings, find a non-admin member
- [ ] Click "Kick" — confirm confirmation prompt appears
- [ ] Confirm kick — confirm member disappears from list
- [ ] Login as that member — confirm they can no longer see the group

### Transfer admin

- [ ] In settings, transfer admin role to another member
- [ ] Confirm that member now has admin badge
- [ ] Confirm Slaheddine no longer has admin controls
- [ ] Transfer back

### Manual penalty run

- [ ] Find "Run penalties now" button in settings
- [ ] Click it — confirm it runs and shows a result summary

### Delete group

- [ ] Create a test group first (don't delete the real Family group)
- [ ] Delete the test group
- [ ] Confirm all members get an email notification
- [ ] Confirm the group no longer appears

**Result:** **\*\***\_\_\_**\*\***

---

## 8. User Account Deletion

**What it does:** A user can permanently delete their own account.

**Test steps:**

- [ ] Create a throwaway test account at /register
- [ ] Login as that account
- [ ] Find the account deletion option (settings or profile)
- [ ] Delete the account
- [ ] Confirm you are logged out
- [ ] Try to login with the deleted account — confirm it is rejected
- [ ] Login as Slaheddine — confirm the deleted user no longer appears in any group

**Result:** **\*\***\_\_\_**\*\***

---

## 9. Weekly Email Digest

**What it does:** Every Monday at 8am, each user gets an email summarizing their goals, nominations, challenges, and pot total.

**Test steps:**

- [ ] Ask Claude Code to trigger the weekly digest cron manually:
      POST /api/digest/weekly with the CRON_SECRET header
- [ ] Check the email inbox of one family member
- [ ] Confirm the email arrives and contains:
  - Active goals + weekly progress
  - Any pending nominations
  - Any active challenges
  - Current pot total
- [ ] Confirm the email is in the user's preferred language

**Result:** **\*\***\_\_\_**\*\***

---

## 10. Onboarding Flow End to End

**What it does:** First login triggers a 4-step flow: language → password → avatar → walkthrough.

**Test steps:**

- [ ] Reset has_onboarded = false for one test user via Supabase MCP
- [ ] Login as that user
- [ ] Confirm redirect to /onboarding automatically
- [ ] Step 1: Pick Arabic — confirm app switches to RTL Arabic
- [ ] Step 2: Set a new password — confirm success
- [ ] Step 3: Upload a profile photo — confirm crop/zoom works
- [ ] Step 3: Click "Skip for now" on avatar — confirm it advances
- [ ] Step 4: Go through all 4 walkthrough slides
- [ ] Click "Set my first goal" — confirm redirect to /profile/goals/new
- [ ] Login again — confirm onboarding does NOT appear again

**Result:** **\*\***\_\_\_**\*\***

---

## 11. Sound Effects

**What it does:** Web Audio API plays sounds on key actions.

**Test steps:**

- [ ] Login — confirm fanfare/level up sound plays
- [ ] Upload proof — confirm success chime plays
- [ ] React to a feed item with emoji — confirm click sound plays
- [ ] Accept a nomination — confirm level up sound plays
- [ ] Add a penalty manually (or wait for cron) — confirm coin drop sound plays

**Result:** **\*\***\_\_\_**\*\***

---

## Summary

| Feature             | Status | Notes |
| ------------------- | ------ | ----- |
| Week Freeze         |        |       |
| Google Login        |        |       |
| Email Verification  |        |       |
| Forgot Password     |        |       |
| Multiple Groups     |        |       |
| Group Invite Link   |        |       |
| Group Admin Panel   |        |       |
| Account Deletion    |        |       |
| Weekly Email Digest |        |       |
| Onboarding Flow     |        |       |
| Sound Effects       |        |       |

---

## Bugs found

List any bugs here with steps to reproduce:

1.
2.
3.
