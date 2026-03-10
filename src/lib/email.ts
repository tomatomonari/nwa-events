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

export async function sendWelcomeEmail(
  email: string,
  cadence: "daily" | "weekly",
  manageToken: string
) {
  const manageUrl = `${BASE_URL}/subscribe/manage?token=${manageToken}`;

  // Calculate next delivery date
  const now = new Date();
  const ct = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));

  let nextDate: string;
  if (cadence === "daily") {
    const tomorrow = new Date(ct);
    tomorrow.setDate(tomorrow.getDate() + 1);
    nextDate = tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  } else {
    // Find next Sunday
    const daysUntilSunday = (7 - ct.getDay()) % 7 || 7;
    const nextSunday = new Date(ct);
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextDate = nextSunday.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  const cadenceNote = cadence === "daily"
    ? `You'll get an email every morning when there are events happening that day.`
    : `You'll get a weekly roundup every Sunday morning with the full week ahead.`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to NWA.events!",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 20px; font-weight: 600; color: #1a1a1a;">
            NWA<span style="color: #e8572a;">.events</span>
          </span>
        </div>
        <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">
          You're in!
        </h2>
        <p style="color: #6b6560; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Thanks for subscribing. No fluff, no spam — just the events worth knowing about in Northwest Arkansas.
        </p>
        <p style="color: #6b6560; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          ${cadenceNote} Your first digest arrives <strong style="color: #1a1a1a;">${nextDate}</strong>.
        </p>
        <p style="color: #6b6560; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          In the meantime, check out what's coming up:
        </p>
        <a href="${BASE_URL}" style="display: inline-block; background: #e8572a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Browse Events
        </a>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e4df; font-size: 13px; color: #6b6560;">
          <a href="${manageUrl}" style="color: #e8572a; text-decoration: none;">Manage your preferences</a> anytime.
        </div>
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
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;">` +
      `<div style="margin-bottom:24px;"><span style="font-size:20px;font-weight:600;color:#1a1a1a;">NWA<span style="color:#e8572a;">.events</span></span></div>` +
      htmlContent +
      `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e8e4df;font-size:13px;color:#6b6560;">` +
      `<a href="${BASE_URL}" style="color:#e8572a;text-decoration:none;">View all events</a>` +
      ` &middot; ` +
      `<a href="${manageUrl}" style="color:#e8572a;text-decoration:none;">Manage preferences</a>` +
      ` &middot; ` +
      `<a href="${unsubscribeUrl}" style="color:#6b6560;text-decoration:none;">Unsubscribe</a>` +
      `</div></div>`,
  });
}
