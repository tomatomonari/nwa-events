import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = "NWA.events <hello@nwa.events>";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nwa-events-mu.vercel.app";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${BASE_URL}/subscribe/verify?token=${token}`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your NWA.events subscription",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">
          Confirm your subscription
        </h2>
        <p style="color: #6b6560; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to verify your email and start receiving event digests from NWA.events.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #e8572a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Confirm Subscription
        </a>
        <p style="color: #6b6560; font-size: 13px; margin-top: 24px;">
          If you didn't sign up, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendDigestEmail(
  email: string,
  subject: string,
  htmlContent: string,
  manageToken: string
) {
  const manageUrl = `${BASE_URL}/subscribe/manage?token=${manageToken}`;
  const unsubscribeUrl = `${BASE_URL}/subscribe/manage?token=${manageToken}&action=unsubscribe`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 20px; font-weight: 600; color: #1a1a1a;">
            NWA<span style="color: #e8572a;">.events</span>
          </span>
        </div>
        ${htmlContent}
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e4df; font-size: 13px; color: #6b6560;">
          <a href="${BASE_URL}" style="color: #e8572a; text-decoration: none;">View all events</a>
          &nbsp;&middot;&nbsp;
          <a href="${manageUrl}" style="color: #e8572a; text-decoration: none;">Manage preferences</a>
          &nbsp;&middot;&nbsp;
          <a href="${unsubscribeUrl}" style="color: #6b6560; text-decoration: none;">Unsubscribe</a>
        </div>
      </div>
    `,
  });
}
