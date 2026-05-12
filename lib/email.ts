import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Family Quest <noreply@trythis.cfd>";
const BASE_URL = () => process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ─── Shared layout helpers ────────────────────────────────────────────────────

function emailWrap(bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#FFFBF0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border:3px solid #1a1a2e;border-radius:16px;
                 box-shadow:4px 4px 0 #1a1a2e;overflow:hidden;max-width:480px;width:100%;">
          <tr>
            <td style="background:#6c31e3;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;letter-spacing:3px;font-weight:900;
                        color:#ffffff;font-family:Impact,Arial Black,sans-serif;">
                FAMILY QUEST
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f8f8f8;border-top:2px solid #e5e5e5;padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">Family Quest · sent with ❤️</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function ctaButton(href: string, label: string): string {
  return `
  <table cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
    <tr>
      <td style="background:#6c31e3;border:2px solid #1a1a2e;border-radius:100px;box-shadow:2px 2px 0 #1a1a2e;">
        <a href="${href}"
           style="display:inline-block;padding:11px 26px;font-size:14px;
                  font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Sends a password-reset email. `token` is the RAW token — not stored in DB. */
export async function sendPasswordReset(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${BASE_URL()}/reset-password?token=${token}`;
  const html = emailWrap(`
    <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a2e;">Hey ${name} 👋</p>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Someone requested a password reset for your Family Quest account.
      If that was you, click below. The link expires in <strong>1 hour</strong>.
    </p>
    ${ctaButton(resetUrl, "Reset my password →")}
    <p style="margin:20px 0 6px;font-size:12px;color:#888;">Or copy this link:</p>
    <p style="margin:0 0 20px;font-size:11px;color:#6c31e3;word-break:break-all;">${resetUrl}</p>
    <p style="margin:0;font-size:12px;color:#aaa;line-height:1.5;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `);
  await resend.emails.send({ from: FROM, to, subject: "Reset your Family Quest password", html });
}

/** Sends an email-verification email. `token` is the RAW token — not stored in DB. */
export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${BASE_URL()}/api/auth/verify-email?token=${token}`;
  const html = emailWrap(`
    <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a2e;">Welcome, ${name}! 🎉</p>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Just one more step — verify your email address to activate your Family Quest account.
    </p>
    ${ctaButton(verifyUrl, "Verify my email →")}
    <p style="margin:20px 0 6px;font-size:12px;color:#888;">Or copy this link:</p>
    <p style="margin:0 0 20px;font-size:11px;color:#6c31e3;word-break:break-all;">${verifyUrl}</p>
    <p style="margin:0;font-size:12px;color:#aaa;line-height:1.5;">
      If you didn't create a Family Quest account, you can safely ignore this email.
    </p>
  `);
  await resend.emails.send({ from: FROM, to, subject: "Verify your Family Quest email", html });
}

/** Sent when someone nominates you for a goal. */
export async function sendNominationEmail(
  to: string,
  recipientName: string,
  nominatorName: string,
  goalTitle: string,
  penaltyAmount: number
): Promise<void> {
  const url = `${BASE_URL()}/nominations`;
  const html = emailWrap(`
    <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a2e;">
      📬 New nomination, ${recipientName}!
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
      <strong>${nominatorName}</strong> just nominated a goal for you:
    </p>
    <div style="background:#FFFBF0;border:2px solid #1a1a2e;border-radius:12px;padding:14px 18px;margin:0 0 16px;">
      <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a2e;">${goalTitle}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">€${penaltyAmount.toFixed(2)} / week penalty</p>
    </div>
    <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.5;">
      Head to the app to accept or decline. If you accept, it becomes your Slot 2 goal.
    </p>
    ${ctaButton(url, "Review nomination →")}
  `);
  await resend.emails.send({ from: FROM, to, subject: `${nominatorName} nominated a goal for you`, html });
}

/** Sent when a challenge is triggered after 2 consecutive missed weeks. */
export async function sendChallengeEmail(
  to: string,
  userName: string,
  goalTitle: string
): Promise<void> {
  const url = `${BASE_URL()}/challenges`;
  const html = emailWrap(`
    <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a2e;">
      ⚡ Challenge time, ${userName}!
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
      You've missed <strong>2 weeks in a row</strong> on:
    </p>
    <div style="background:#fff8e1;border:2px solid #f59e0b;border-radius:12px;padding:14px 18px;margin:0 0 16px;">
      <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a2e;">${goalTitle}</p>
    </div>
    <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.5;">
      Your family is now suggesting challenge actions. Pick one, complete it,
      and upload your proof to get back on track. You have <strong>7 days</strong>.
    </p>
    ${ctaButton(url, "See my challenge →")}
  `);
  await resend.emails.send({ from: FROM, to, subject: "⚡ You have a new challenge!", html });
}

/** Sent to all non-admin members when an admin deletes the group. */
export async function sendGroupDeletedEmail(
  to: string,
  memberName: string,
  groupName: string,
  adminName: string
): Promise<void> {
  const html = emailWrap(`
    <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a2e;">
      👋 Hey ${memberName}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
      The group <strong>${groupName}</strong> has been permanently deleted by
      <strong>${adminName}</strong>. All goals, check-ins, penalties, and pot
      data have been removed.
    </p>
    <p style="margin:0;font-size:14px;color:#888;line-height:1.5;">
      If you'd like to continue, you can create a new group or ask someone to
      send you a fresh invite link.
    </p>
  `);
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${groupName} has been deleted`,
    html,
  });
}

/** Weekly digest — sent Monday morning. */
export interface DigestData {
  userName: string;
  groupName: string;
  goals: Array<{ title: string; frequency: string; frequency_count: number }>;
  pendingNominations: number;
  activeChallenges: number;
  potTotal: number;
}

export async function sendDigestEmail(to: string, data: DigestData): Promise<void> {
  const { userName, groupName, goals, pendingNominations, activeChallenges, potTotal } = data;
  const url = BASE_URL();

  const goalRows = goals.length > 0
    ? goals.map((g) => {
        const freq =
          g.frequency === "daily" ? "Every day" :
          g.frequency === "weekly" ? "Once a week" :
          `${g.frequency_count}× per week`;
        return `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f1efe8;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">${g.title}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#888;">${freq}</p>
            </td>
          </tr>`;
      }).join("")
    : `<tr><td style="padding:8px 0;font-size:14px;color:#aaa;">No active goals yet.</td></tr>`;

  const alerts = [
    pendingNominations > 0
      ? `<p style="margin:0 0 8px;font-size:14px;color:#b36200;">📬 You have <strong>${pendingNominations}</strong> pending nomination${pendingNominations > 1 ? "s" : ""} to review.</p>`
      : "",
    activeChallenges > 0
      ? `<p style="margin:0 0 8px;font-size:14px;color:#c0392b;">⚡ You have an active challenge — don't let it expire!</p>`
      : "",
  ].filter(Boolean).join("");

  const html = emailWrap(`
    <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:#1a1a2e;">
      Good morning, ${userName}! ☀️
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#888;">Here's your week in <strong>${groupName}</strong>.</p>

    ${alerts ? `<div style="background:#fff8e1;border:2px solid #f59e0b;border-radius:10px;padding:12px 16px;margin:0 0 20px;">${alerts}</div>` : ""}

    <p style="margin:0 0 8px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#888;">
      ⚔️ Your goals this week
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${goalRows}
    </table>

    <div style="background:#f8f5ff;border:2px solid #6c31e3;border-radius:10px;padding:12px 16px;margin:0 0 20px;display:flex;align-items:center;gap:8px;">
      <p style="margin:0;font-size:13px;font-weight:800;color:#6c31e3;">
        💰 Group pot: <span style="font-size:18px;">€${potTotal.toFixed(2)}</span>
      </p>
    </div>

    ${ctaButton(url, "Open Family Quest →")}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `☀️ Your Family Quest week starts now — ${groupName}`,
    html,
  });
}
