import { BrevoClient } from '@getbrevo/brevo';

// Built lazily (not at module load) so it always picks up BREVO_API_KEY
// after dotenv has loaded — server.ts calls dotenv.config() after importing
// this module's dependents, so a top-level client would capture an
// undefined key permanently.
let client: BrevoClient | null = null;

function getBrevoClient(): BrevoClient {
  if (!client) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not set — cannot send email via Brevo.');
    }
    client = new BrevoClient({ apiKey });
  }
  return client;
}

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@nexuscart.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'NexusCart';

// Dynamic templates built in the Brevo dashboard (Transactional > Templates):
// OTP-Verification-Template (registration) and Password-Reset-Template
// (reset) — both expect params.otp and params.year. See
// notification-service/src/templates/brevo/{otp,password-reset}.html for
// the underlying markup.
const OTP_TEMPLATE_ID = Number(process.env.BREVO_OTP_TEMPLATE_ID);
const RESET_TEMPLATE_ID = Number(process.env.BREVO_RESET_TEMPLATE_ID);

export const sendOTP = async (email: string, otp: string, context: 'verify' | 'reset' = 'verify') => {
  const templateId = context === 'reset' ? RESET_TEMPLATE_ID : OTP_TEMPLATE_ID;
  if (!templateId) {
    throw new Error(
      `${context === 'reset' ? 'BREVO_RESET_TEMPLATE_ID' : 'BREVO_OTP_TEMPLATE_ID'} is not set — cannot send OTP email.`
    );
  }

  await getBrevoClient().transactionalEmails.sendTransacEmail({
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email }],
    templateId,
    params: { otp, year: new Date().getFullYear() }
  });
};
