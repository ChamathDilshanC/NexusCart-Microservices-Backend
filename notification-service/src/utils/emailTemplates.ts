interface OrderItemPayload {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface OrderConfirmationPayload {
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  status?: string;
  items: OrderItemPayload[];
  totalAmount: number;
  currency?: string;
  exchangeRate?: number;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt?: string;
}

interface OrderStatusPayload {
  orderId: string;
  customerName?: string;
  status: string;
  totalAmount?: number;
  currency?: string;
  exchangeRate?: number;
}

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// totalAmount/item.price arrive in the store's base currency (USD) — currency
// and exchangeRate are what the customer had selected at checkout, captured
// there since this service has no other way to know a per-viewer display
// preference. Both default to a 1:1 USD passthrough for orders placed before
// that was tracked.
function formatCurrency(amount: number, currency = 'USD', exchangeRate = 1) {
  const converted = amount * exchangeRate;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(converted);
  } catch {
    return `${currency} ${converted.toFixed(2)}`;
  }
}

function shortOrderId(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatAddress(addr?: OrderConfirmationPayload['shippingAddress']) {
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ');
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ca8a04',
  PAID: '#2563eb',
  SHIPPED: '#7c3aed',
  DELIVERED: '#16a34a',
  CANCELLED: '#dc2626'
};

// White, rounded "document" card floating on a black canvas — matches the
// look of the /orders/[id]/invoice page so the emailed copy and the printable
// invoice read as the same document.
function emailShell(bodyHtml: string) {
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

// Header row shared by both emails: wordmark + document type on the left,
// order number / date / status pill on the right — mirrors the invoice
// page's header exactly.
function documentHeader(kind: string, orderId: string, status?: string, createdAt?: string) {
  const date = formatDate(createdAt);
  return `
    <table role="presentation" width="100%" style="border-collapse: collapse;">
      <tr>
        <td style="vertical-align: top;">
          <div style="font-size: 20px; font-weight: 600; color: #18181b; letter-spacing: -0.3px;">NexusCart</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 2px;">${kind}</div>
        </td>
        <td style="vertical-align: top; text-align: right;">
          <div style="font-size: 14px; font-weight: 600; color: #18181b;">#${shortOrderId(orderId)}</div>
          ${date ? `<div style="font-size: 12px; color: #71717a; margin-top: 2px;">${date}</div>` : ''}
          ${
            status
              ? `<span style="display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 100px; background-color: #f4f4f5; color: #3f3f46;">${status}</span>`
              : ''
          }
        </td>
      </tr>
    </table>
    <div style="border-bottom: 1px solid #e4e4e7; margin: 20px 0 24px 0;"></div>
  `;
}

function billToShipTo(customerName: string | undefined, customerEmail: string | undefined, address: string) {
  return `
    <table role="presentation" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="vertical-align: top; width: 50%; padding-right: 12px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #a1a1aa; margin-bottom: 6px;">Bill to</div>
          <div style="font-size: 14px; font-weight: 500; color: #18181b;">${customerName || '—'}</div>
          ${customerEmail ? `<div style="font-size: 13px; color: #71717a;">${customerEmail}</div>` : ''}
        </td>
        ${
          address
            ? `<td style="vertical-align: top; width: 50%; padding-left: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #a1a1aa; margin-bottom: 6px;">Ship to</div>
                <div style="font-size: 13px; color: #71717a; line-height: 18px;">${address}</div>
              </td>`
            : '<td style="width: 50%;"></td>'
        }
      </tr>
    </table>
  `;
}

// Data: URIs (base64-embedded uploads) work in a browser but are stripped by
// Gmail and most other mail clients for security reasons, so they'd render
// as nothing — only pass through image URLs an email client can actually
// fetch over the network.
function isEmailSafeImageUrl(url?: string): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

function itemsTable(items: OrderItemPayload[], currency?: string, exchangeRate?: number) {
  const rows = items
    .map((item) => {
      const imageCell = isEmailSafeImageUrl(item.imageUrl)
        ? `<img src="${item.imageUrl}" alt="${item.name}" width="36" height="36" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover; display: block;" />`
        : `<div style="width: 36px; height: 36px; border-radius: 8px; background-color: #f4f4f5; display: block;"></div>`;
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; color: #18181b;">
            <table role="presentation" style="border-collapse: collapse;"><tr>
              <td style="padding-right: 10px; vertical-align: middle;">${imageCell}</td>
              <td style="vertical-align: middle;">${item.name}</td>
            </tr></table>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; color: #71717a; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; color: #71717a; text-align: right;">${formatCurrency(item.price, currency, exchangeRate)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; color: #18181b; font-weight: 500; text-align: right;">${formatCurrency(item.price * item.quantity, currency, exchangeRate)}</td>
        </tr>`;
    })
    .join('');

  return `
    <table role="presentation" width="100%" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 500;">Item</th>
          <th style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 500;">Qty</th>
          <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 500;">Price</th>
          <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 500;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function invoiceButton(invoiceUrl: string) {
  return `
    <div style="text-align: center; margin-top: 32px;">
      <a href="${invoiceUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 100px; padding: 14px 32px; font-size: 14px; font-weight: 600;">
        View invoice
      </a>
    </div>
  `;
}

export function renderOrderConfirmationEmail(payload: OrderConfirmationPayload) {
  const greeting = payload.customerName ? `Thanks, ${payload.customerName}.` : 'Thanks for your order.';
  const address = formatAddress(payload.shippingAddress);
  const invoiceUrl = `${frontendUrl()}/orders/${payload.orderId}/invoice`;

  const html = emailShell(`
    ${documentHeader('Invoice', payload.orderId, payload.status || 'PENDING', payload.createdAt)}

    <p style="font-size: 14px; line-height: 22px; color: #52525b; margin: 0 0 24px 0;">
      ${greeting} Your order has been received and is being processed.
    </p>

    ${billToShipTo(payload.customerName, payload.customerEmail, address)}
    ${itemsTable(payload.items, payload.currency, payload.exchangeRate)}

    <div style="display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 2px solid #18181b;">
      <table role="presentation" style="border-collapse: collapse;"><tr>
        <td style="font-size: 13px; color: #71717a; padding-right: 16px;">Total</td>
        <td style="font-size: 18px; font-weight: 700; color: #18181b; text-align: right;">${formatCurrency(payload.totalAmount, payload.currency, payload.exchangeRate)}</td>
      </tr></table>
    </div>

    ${invoiceButton(invoiceUrl)}

    <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin: 24px 0 0 0;">Thank you for shopping with NexusCart.</p>
  `);

  const text = `Order #${shortOrderId(payload.orderId)} confirmed. Total: ${formatCurrency(payload.totalAmount, payload.currency, payload.exchangeRate)}. View your invoice at ${invoiceUrl}`;

  return {
    subject: `Order Confirmed — #${shortOrderId(payload.orderId)}`,
    html,
    text
  };
}

export function renderOrderStatusEmail(payload: OrderStatusPayload) {
  const color = STATUS_COLORS[payload.status] || '#18181b';
  const invoiceUrl = `${frontendUrl()}/orders/${payload.orderId}/invoice`;
  const greeting = payload.customerName ? `Hi ${payload.customerName},` : 'Hi,';

  const html = emailShell(`
    ${documentHeader('Order update', payload.orderId)}

    <p style="font-size: 14px; line-height: 22px; color: #52525b; text-align: center; margin: 0 0 24px 0;">
      ${greeting} your order status has changed to:
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: ${color}1a; color: ${color}; border: 1px solid ${color}55; border-radius: 100px; padding: 8px 24px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
        ${payload.status}
      </span>
    </div>

    ${
      payload.totalAmount !== undefined
        ? `<p style="font-size: 14px; line-height: 22px; color: #71717a; text-align: center; margin: 0;">Order total: <strong style="color:#18181b;">${formatCurrency(payload.totalAmount, payload.currency, payload.exchangeRate)}</strong></p>`
        : ''
    }

    ${invoiceButton(invoiceUrl)}
  `);

  const text = `Order #${shortOrderId(payload.orderId)} is now ${payload.status}. View your invoice at ${invoiceUrl}`;

  return {
    subject: `Your NexusCart order is now ${payload.status}`,
    html,
    text
  };
}
