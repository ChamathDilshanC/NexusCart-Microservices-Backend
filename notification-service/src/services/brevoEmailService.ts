import { BrevoClient } from '@getbrevo/brevo';

type SendTransacEmailRequest = NonNullable<Parameters<BrevoClient['transactionalEmails']['sendTransacEmail']>[0]>;

// --- Client setup -----------------------------------------------------
//
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

// Optional: IDs of templates built in the Brevo dashboard (Transactional >
// Templates). When set, the matching function sends via that dynamic
// template instead of the inline HTML below — see
// src/templates/brevo/*.html for the markup to paste into the Brevo editor.
function templateIdFromEnv(name: string): number | undefined {
  const value = process.env[name];
  return value ? Number(value) : undefined;
}

const OTP_TEMPLATE_ID = templateIdFromEnv('BREVO_OTP_TEMPLATE_ID');
const RESET_TEMPLATE_ID = templateIdFromEnv('BREVO_RESET_TEMPLATE_ID');
const INVOICE_TEMPLATE_ID = templateIdFromEnv('BREVO_INVOICE_TEMPLATE_ID');

// --- Shared dispatch ----------------------------------------------------
//
// Every public function below builds a SendTransacEmailRequest and hands it
// here. Centralizing the try/catch means adding a new email type never
// means re-writing error handling — just build the payload and call this.

async function dispatch(request: SendTransacEmailRequest, context: string): Promise<boolean> {
  const recipient = request.to?.[0]?.email;
  try {
    await getBrevoClient().transactionalEmails.sendTransacEmail(request);
    console.log(`[BREVO] ${context} sent to ${recipient}`);
    return true;
  } catch (error: any) {
    console.error(`[BREVO] ${context} failed for ${recipient}:`, error?.body || error?.message || error);
    return false;
  }
}

// --- Shared brand shell ---------------------------------------------------
//
// Matches the black header / white card look used across the app's other
// transactional emails (see utils/emailTemplates.ts and auth-service's OTP
// mail) so every email reads as the same product regardless of which
// function sent it.

function brandShell(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; padding: 32px 16px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding-bottom: 24px;">
          <span style="color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">NexusCart</span>
        </div>
        <div style="background-color: #ffffff; color: #18181b; border-radius: 16px; padding: 40px;">
          ${bodyHtml}
        </div>
        <div style="text-align: center; padding-top: 24px; color: #71717a; font-size: 12px; line-height: 20px;">
          NexusCart Inc.<br>&copy; ${new Date().getFullYear()} NexusCart
        </div>
      </div>
    </div>
  `;
}

function brandButton(url: string, label: string): string {
  return `
    <div style="text-align: center; margin-top: 32px;">
      <a href="${url}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 100px; padding: 14px 32px; font-size: 14px; font-weight: 600;">
        ${label}
      </a>
    </div>
  `;
}

// --- sendRawEmail -----------------------------------------------------
//
// Escape hatch for callers that already have fully-rendered subject/html
// (e.g. notification.controller.ts's order confirmation/status emails,
// built from utils/emailTemplates.ts) and just need it sent through Brevo
// rather than nodemailer.

export async function sendRawEmail(
  recipientEmail: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  const email: SendTransacEmailRequest = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {})
  };

  return dispatch(email, 'Email');
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatCurrency(amount: number): string {
  return `$${formatAmount(amount)}`;
}

// --- sendInvoiceEmail -----------------------------------------------------

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  customerName?: string;
  items: InvoiceItem[];
  totalAmount: number;
  invoiceUrl?: string;
  /** If set, sends via a Brevo dynamic template instead of the inline HTML below. */
  templateId?: number;
  /** Merge variables passed to the dynamic template (only used with templateId). */
  templateParams?: Record<string, unknown>;
}

function buildInvoiceHtml(data: InvoiceData): string {
  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px;">${item.name}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; text-align: center; color: #71717a;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; text-align: right; color: #71717a;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('');

  return brandShell(`
    <h2 style="font-size: 20px; margin: 0 0 8px 0;">Invoice #${data.invoiceNumber}</h2>
    <p style="font-size: 14px; color: #52525b; margin: 0 0 24px 0;">
      ${data.customerName ? `Hi ${data.customerName}, here` : 'Here'}'s your invoice from NexusCart.
    </p>
    <table role="presentation" width="100%" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; color: #71717a;">Item</th>
          <th style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; color: #71717a;">Qty</th>
          <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; color: #71717a;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #18181b; font-size: 16px; font-weight: 700;">
      Total: ${formatCurrency(data.totalAmount)}
    </div>
    ${data.invoiceUrl ? brandButton(data.invoiceUrl, 'View invoice') : ''}
  `);
}

// Shape sent as `params` to the Brevo dynamic template — matches the merge
// tags used in src/templates/brevo/invoice.html (params.items loops with
// {{#each}}, so amounts must already be pre-formatted strings; Brevo's
// template language can't do arithmetic).
function buildInvoiceParams(data: InvoiceData): Record<string, unknown> {
  return {
    invoiceNumber: data.invoiceNumber,
    customerName: data.customerName || 'there',
    items: data.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineTotal: formatAmount(item.price * item.quantity)
    })),
    totalAmount: formatAmount(data.totalAmount),
    invoiceUrl: data.invoiceUrl || '',
    year: new Date().getFullYear()
  };
}

/**
 * Sends an invoice email. Uses the Brevo dynamic template configured via
 * BREVO_INVOICE_TEMPLATE_ID (or `invoiceData.templateId` to override
 * per-call) when set; otherwise falls back to the built-in inline HTML.
 */
export async function sendInvoiceEmail(recipientEmail: string, invoiceData: InvoiceData): Promise<boolean> {
  const templateId = invoiceData.templateId ?? INVOICE_TEMPLATE_ID;

  const email: SendTransacEmailRequest = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    ...(templateId
      ? {
          templateId,
          params: invoiceData.templateParams ?? buildInvoiceParams(invoiceData)
        }
      : {
          subject: `Your NexusCart Invoice #${invoiceData.invoiceNumber}`,
          htmlContent: buildInvoiceHtml(invoiceData),
          textContent: `Invoice #${invoiceData.invoiceNumber} — total ${formatCurrency(invoiceData.totalAmount)}.${
            invoiceData.invoiceUrl ? ` View it at ${invoiceData.invoiceUrl}` : ''
          }`
        })
  };

  return dispatch(email, 'Invoice email');
}

// --- sendOTPEmail -----------------------------------------------------

/**
 * Sends an OTP/verification code email. Uses the Brevo dynamic template
 * configured via BREVO_OTP_TEMPLATE_ID (see
 * src/templates/brevo/otp.html — expects params.otp and params.year) when
 * set; otherwise falls back to the built-in inline HTML.
 */
export async function sendOTPEmail(recipientEmail: string, otpCode: string): Promise<boolean> {
  const email: SendTransacEmailRequest = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    ...(OTP_TEMPLATE_ID
      ? {
          templateId: OTP_TEMPLATE_ID,
          params: { otp: otpCode, year: new Date().getFullYear() }
        }
      : {
          subject: 'Your NexusCart Verification Code',
          htmlContent: brandShell(`
            <h2 style="font-size: 20px; margin: 0 0 16px 0; text-align: center;">Your verification code</h2>
            <p style="font-size: 14px; color: #52525b; text-align: center; margin: 0 0 24px 0;">
              Enter this code to continue. It expires in 10 minutes.
            </p>
            <div style="text-align: center;">
              <span style="background-color: #18181b; color: #ffffff; border-radius: 100px; padding: 16px 40px; display: inline-block; font-family: ui-monospace, monospace; font-size: 26px; font-weight: 600; letter-spacing: 6px;">
                ${otpCode}
              </span>
            </div>
          `),
          textContent: `Your NexusCart verification code is ${otpCode}. It expires in 10 minutes.`
        })
  };

  return dispatch(email, 'OTP email');
}

// --- sendPasswordResetEmail -----------------------------------------------------

/**
 * Sends a password reset code email. Uses the Brevo dynamic template
 * configured via BREVO_RESET_TEMPLATE_ID (see
 * src/templates/brevo/password-reset.html — expects params.otp and
 * params.year) when set; otherwise falls back to the built-in inline HTML.
 *
 * Code-based, not link-based — matches auth-service's actual reset flow
 * (a 6-digit code the user enters in the app), not a clickable reset link.
 */
export async function sendPasswordResetEmail(recipientEmail: string, otpCode: string): Promise<boolean> {
  const email: SendTransacEmailRequest = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    ...(RESET_TEMPLATE_ID
      ? {
          templateId: RESET_TEMPLATE_ID,
          params: { otp: otpCode, year: new Date().getFullYear() }
        }
      : {
          subject: 'Your NexusCart Password Reset Code',
          htmlContent: brandShell(`
            <h2 style="font-size: 20px; margin: 0 0 16px 0; text-align: center;">Reset your password</h2>
            <p style="font-size: 14px; color: #52525b; text-align: center; margin: 0 0 24px 0;">
              We received a request to reset your password. Enter this code in the app to continue. It expires in 10 minutes. If you didn't request this, you can safely ignore this email.
            </p>
            <div style="text-align: center;">
              <span style="background-color: #18181b; color: #ffffff; border-radius: 100px; padding: 16px 40px; display: inline-block; font-family: ui-monospace, monospace; font-size: 26px; font-weight: 600; letter-spacing: 6px;">
                ${otpCode}
              </span>
            </div>
          `),
          textContent: `Your NexusCart password reset code is ${otpCode}. It expires in 10 minutes.`
        })
  };

  return dispatch(email, 'Password reset email');
}
