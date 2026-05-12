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

// ─── Shared email translations ────────────────────────────────────────────────

const ET = {
  nomination: {
    EN: {
      title:    (n: string) => `📬 New nomination, ${n}!`,
      body:     (from: string) => `<strong>${from}</strong> just nominated a goal for you:`,
      penalty:  (amt: string) => `€${amt} / week penalty`,
      cta:      "Review nomination →",
      subject:  (from: string) => `${from} nominated a goal for you`,
      action:   "Head to the app to accept or decline. If you accept, it becomes your Slot 2 goal.",
    },
    FR: {
      title:    (n: string) => `📬 Nouvelle nomination, ${n} !`,
      body:     (from: string) => `<strong>${from}</strong> vient de te nommer un objectif :`,
      penalty:  (amt: string) => `€${amt} / semaine de pénalité`,
      cta:      "Voir la nomination →",
      subject:  (from: string) => `${from} t'a nominé un objectif`,
      action:   "Accède à l'appli pour accepter ou refuser. Si tu acceptes, ça devient ton objectif Slot 2.",
    },
    AR: {
      title:    (n: string) => `📬 ترشيح جديد، ${n}!`,
      body:     (from: string) => `قام <strong>${from}</strong> بترشيح هدف لك:`,
      penalty:  (amt: string) => `€${amt} غرامة / أسبوع`,
      cta:      "مراجعة الترشيح ←",
      subject:  (from: string) => `${from} رشّحك لهدف`,
      action:   "افتح التطبيق للقبول أو الرفض. إذا قبلت، يصبح هدفك في الخانة الثانية.",
    },
  },
  challenge: {
    EN: {
      title:    (n: string) => `⚡ Challenge time, ${n}!`,
      missed:   "You've missed <strong>2 weeks in a row</strong> on:",
      body:     "Your family is now suggesting challenge actions. Pick one, complete it, and upload your proof to get back on track. You have <strong>7 days</strong>.",
      cta:      "See my challenge →",
      subject:  "⚡ You have a new challenge!",
    },
    FR: {
      title:    (n: string) => `⚡ Défi en cours, ${n} !`,
      missed:   "Tu as raté <strong>2 semaines de suite</strong> sur :",
      body:     "Ta famille suggère des actions de défi. Choisis-en une, complète-la et télécharge ta preuve pour te remettre sur les rails. Tu as <strong>7 jours</strong>.",
      cta:      "Voir mon défi →",
      subject:  "⚡ Tu as un nouveau défi !",
    },
    AR: {
      title:    (n: string) => `⚡ وقت التحدي، ${n}!`,
      missed:   "لقد فاتك <strong>أسبوعان متتاليان</strong> على:",
      body:     "عائلتك الآن تقترح تحديات. اختر واحدة، أتمّها، وارفع دليلك للعودة إلى المسار. لديك <strong>7 أيام</strong>.",
      cta:      "رؤية تحديي ←",
      subject:  "⚡ لديك تحدٍّ جديد!",
    },
  },
} as const;

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
  penaltyAmount: number,
  language: "EN" | "FR" | "AR" = "EN"
): Promise<void> {
  const nt = ET.nomination[language] ?? ET.nomination.EN;
  const url = `${BASE_URL()}/nominations`;
  const html = emailWrap(`
    <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a2e;">
      ${nt.title(recipientName)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
      ${nt.body(nominatorName)}
    </p>
    <div style="background:#FFFBF0;border:2px solid #1a1a2e;border-radius:12px;padding:14px 18px;margin:0 0 16px;">
      <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a2e;">${goalTitle}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">${nt.penalty(penaltyAmount.toFixed(2))}</p>
    </div>
    <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.5;">
      ${nt.action}
    </p>
    ${ctaButton(url, nt.cta)}
  `);
  await resend.emails.send({ from: FROM, to, subject: nt.subject(nominatorName), html });
}

/** Sent when a challenge is triggered after 2 consecutive missed weeks. */
export async function sendChallengeEmail(
  to: string,
  userName: string,
  goalTitle: string,
  language: "EN" | "FR" | "AR" = "EN"
): Promise<void> {
  const ct = ET.challenge[language] ?? ET.challenge.EN;
  const url = `${BASE_URL()}/challenges`;
  const html = emailWrap(`
    <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1a1a2e;">
      ${ct.title(userName)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
      ${ct.missed}
    </p>
    <div style="background:#fff8e1;border:2px solid #f59e0b;border-radius:12px;padding:14px 18px;margin:0 0 16px;">
      <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a2e;">${goalTitle}</p>
    </div>
    <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.5;">
      ${ct.body}
    </p>
    ${ctaButton(url, ct.cta)}
  `);
  await resend.emails.send({ from: FROM, to, subject: ct.subject, html });
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
  language: "EN" | "FR" | "AR";
}

const DT = {
  EN: {
    greeting:         (n: string) => `Good morning, ${n}! ☀️`,
    weekIn:           (g: string) => `Here's your week in <strong>${g}</strong>.`,
    goalsHeader:      "⚔️ Your goals this week",
    noGoals:          "No active goals yet.",
    daily:            "Every day",
    weekly:           "Once a week",
    timesPerWeek:     (n: number) => `${n}× per week`,
    nominationsAlert: (n: number) => `📬 You have <strong>${n}</strong> pending nomination${n > 1 ? "s" : ""} to review.`,
    challengeAlert:   "⚡ You have an active challenge — don't let it expire!",
    potLabel:         "💰 Group pot:",
    cta:              "Open Family Quest →",
    subject:          (g: string) => `☀️ Your Family Quest week starts now — ${g}`,
  },
  FR: {
    greeting:         (n: string) => `Bonjour, ${n} ! ☀️`,
    weekIn:           (g: string) => `Voici ta semaine dans <strong>${g}</strong>.`,
    goalsHeader:      "⚔️ Tes objectifs cette semaine",
    noGoals:          "Aucun objectif actif pour l'instant.",
    daily:            "Tous les jours",
    weekly:           "Une fois par semaine",
    timesPerWeek:     (n: number) => `${n}× par semaine`,
    nominationsAlert: (n: number) => `📬 Tu as <strong>${n}</strong> nomination${n > 1 ? "s" : ""} en attente.`,
    challengeAlert:   "⚡ Tu as un défi actif — ne le laisse pas expirer !",
    potLabel:         "💰 Cagnotte du groupe :",
    cta:              "Ouvrir Family Quest →",
    subject:          (g: string) => `☀️ Ta semaine Family Quest commence — ${g}`,
  },
  AR: {
    greeting:         (n: string) => `صباح الخير، ${n}! ☀️`,
    weekIn:           (g: string) => `إليك ملخص أسبوعك في <strong>${g}</strong>.`,
    goalsHeader:      "⚔️ أهدافك هذا الأسبوع",
    noGoals:          "لا توجد أهداف نشطة حتى الآن.",
    daily:            "كل يوم",
    weekly:           "مرة في الأسبوع",
    timesPerWeek:     (n: number) => `${n}× في الأسبوع`,
    nominationsAlert: (n: number) => `📬 لديك <strong>${n}</strong> ترشيح معلق للمراجعة.`,
    challengeAlert:   "⚡ لديك تحدٍّ نشط — لا تدعه ينتهي!",
    potLabel:         "💰 صندوق المجموعة:",
    cta:              "افتح Family Quest ←",
    subject:          (g: string) => `☀️ أسبوعك في Family Quest يبدأ الآن — ${g}`,
  },
} as const;

export async function sendDigestEmail(to: string, data: DigestData): Promise<void> {
  const { userName, groupName, goals, pendingNominations, activeChallenges, potTotal, language } = data;
  const t = DT[language] ?? DT.EN;
  const url = BASE_URL();

  const goalRows = goals.length > 0
    ? goals.map((g) => {
        const freq =
          g.frequency === "daily" ? t.daily :
          g.frequency === "weekly" ? t.weekly :
          t.timesPerWeek(g.frequency_count);
        return `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f1efe8;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">${g.title}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#888;">${freq}</p>
            </td>
          </tr>`;
      }).join("")
    : `<tr><td style="padding:8px 0;font-size:14px;color:#aaa;">${t.noGoals}</td></tr>`;

  const alerts = [
    pendingNominations > 0
      ? `<p style="margin:0 0 8px;font-size:14px;color:#b36200;">${t.nominationsAlert(pendingNominations)}</p>`
      : "",
    activeChallenges > 0
      ? `<p style="margin:0 0 8px;font-size:14px;color:#c0392b;">${t.challengeAlert}</p>`
      : "",
  ].filter(Boolean).join("");

  const html = emailWrap(`
    <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:#1a1a2e;">
      ${t.greeting(userName)}
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#888;">${t.weekIn(groupName)}</p>

    ${alerts ? `<div style="background:#fff8e1;border:2px solid #f59e0b;border-radius:10px;padding:12px 16px;margin:0 0 20px;">${alerts}</div>` : ""}

    <p style="margin:0 0 8px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#888;">
      ${t.goalsHeader}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${goalRows}
    </table>

    <div style="background:#f8f5ff;border:2px solid #6c31e3;border-radius:10px;padding:12px 16px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;font-weight:800;color:#6c31e3;">
        ${t.potLabel} <span style="font-size:18px;">€${potTotal.toFixed(2)}</span>
      </p>
    </div>

    ${ctaButton(url, t.cta)}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: t.subject(groupName),
    html,
  });
}
