interface OrderItemPayload {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationPayload {
  orderId: string;
  customerName?: string;
  items: OrderItemPayload[];
  totalAmount: number;
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
}

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function shortOrderId(orderId: string) {
  return orderId.slice(-8).toUpperCase();
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

function emailShell(headerTitle: string, bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
      <div style="padding: 32px 20px; text-align: center;">
        <span style="font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">NexusCart</span>
      </div>

      <div style="background-color: #ffffff; color: #000000; padding: 48px 40px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 500; margin: 0 0 32px 0; letter-spacing: -1px; text-align: center;">
          ${headerTitle}
        </h1>
        ${bodyHtml}
      </div>

      <div style="background-color: #f4f4f5; color: #71717a; padding: 32px 20px; text-align: center; font-size: 12px; line-height: 20px;">
        <p style="margin: 0;">
          NexusCart Inc.<br>
          &copy; ${new Date().getFullYear()} NexusCart
        </p>
      </div>
    </div>
  `;
}

function itemsTable(items: OrderItemPayload[]) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eaeaea; font-size: 14px; color: #18181b;">${item.name}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eaeaea; font-size: 14px; color: #71717a; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eaeaea; font-size: 14px; color: #18181b; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      <thead>
        <tr>
          <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Item</th>
          <th style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Qty</th>
          <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #18181b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function renderOrderConfirmationEmail(payload: OrderConfirmationPayload) {
  const greeting = payload.customerName ? `Thanks, ${payload.customerName}.` : 'Thanks for your order.';
  const address = formatAddress(payload.shippingAddress);
  const invoiceUrl = `${frontendUrl()}/orders/${payload.orderId}/invoice`;

  const html = emailShell(
    'Order Confirmed',
    `
      <p style="font-size: 15px; line-height: 24px; color: #444444; text-align: center; margin: 0 0 8px 0;">
        ${greeting} Your order <strong>#${shortOrderId(payload.orderId)}</strong> has been received and is being processed.
      </p>

      ${itemsTable(payload.items)}

      <div style="display: flex; justify-content: space-between; padding-top: 16px; border-top: 2px solid #18181b;">
        <table style="width: 100%;"><tr>
          <td style="font-size: 16px; font-weight: 600; color: #18181b;">Total</td>
          <td style="font-size: 16px; font-weight: 600; color: #18181b; text-align: right;">${formatCurrency(payload.totalAmount)}</td>
        </tr></table>
      </div>

      ${
        address
          ? `<p style="font-size: 13px; line-height: 20px; color: #71717a; margin: 24px 0 0 0;"><strong>Shipping to:</strong><br>${address}</p>`
          : ''
      }

      <div style="text-align: center; margin-top: 32px;">
        <a href="${invoiceUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 100px; padding: 14px 32px; font-size: 14px; font-weight: 600;">
          View invoice
        </a>
      </div>
    `
  );

  const text = `Order #${shortOrderId(payload.orderId)} confirmed. Total: ${formatCurrency(payload.totalAmount)}. View your invoice at ${invoiceUrl}`;

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

  const html = emailShell(
    'Order Update',
    `
      <p style="font-size: 15px; line-height: 24px; color: #444444; text-align: center; margin: 0 0 24px 0;">
        ${greeting} your order <strong>#${shortOrderId(payload.orderId)}</strong> status has changed to:
      </p>

      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: ${color}1a; color: ${color}; border: 1px solid ${color}55; border-radius: 100px; padding: 8px 24px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
          ${payload.status}
        </span>
      </div>

      ${
        payload.totalAmount !== undefined
          ? `<p style="font-size: 14px; line-height: 22px; color: #71717a; text-align: center; margin: 0;">Order total: <strong style="color:#18181b;">${formatCurrency(payload.totalAmount)}</strong></p>`
          : ''
      }

      <div style="text-align: center; margin-top: 32px;">
        <a href="${invoiceUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 100px; padding: 14px 32px; font-size: 14px; font-weight: 600;">
          View invoice
        </a>
      </div>
    `
  );

  const text = `Order #${shortOrderId(payload.orderId)} is now ${payload.status}. View your invoice at ${invoiceUrl}`;

  return {
    subject: `Your NexusCart order is now ${payload.status}`,
    html,
    text
  };
}
