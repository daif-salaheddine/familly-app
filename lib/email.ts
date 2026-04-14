import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Family Quest <noreply@familyquest.app>";

/**
 * Sends a password-reset email containing a one-time link.
 * The `token` passed here is the RAW token (not the hash) — it goes
 * only into the link, never into the database.
 */
export async function sendPasswordReset(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border:3px solid #1a1a2e;border-radius:16px;
                 box-shadow:4px 4px 0 #1a1a2e;overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#6c31e3;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:32px;letter-spacing:3px;
                        font-weight:900;color:#ffffff;font-family:Impact,Arial Black,sans-serif;">
                FAMILY QUEST
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a2e;">
                Hey ${name} 👋
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Someone requested a password reset for your Family Quest account.
                If that was you, click the button below. The link expires in
                <strong>1 hour</strong>.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#6c31e3;border:2px solid #1a1a2e;
                             border-radius:100px;box-shadow:2px 2px 0 #1a1a2e;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:12px 28px;
                              font-size:15px;font-weight:800;color:#ffffff;
                              text-decoration:none;letter-spacing:0.5px;">
                      Reset my password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#888;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#6c31e3;word-break:break-all;">
                ${resetUrl}
              </p>

              <p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">
                If you didn't request this, you can safely ignore this email.
                Your password will not change.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;border-top:2px solid #e5e5e5;
                       padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                Family Quest · sent with ❤️
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Family Quest password",
    html,
  });
}
