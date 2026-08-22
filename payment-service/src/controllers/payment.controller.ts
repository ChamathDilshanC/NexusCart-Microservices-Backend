import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/Payment';

const orderServiceUrl = () => process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:5005';
const notifUrl = () => process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5007';
// The publicly reachable API gateway — PayHere's notify webhook is a server-to-server
// call from PayHere's own infrastructure, so it must hit a public URL directly (not
// the frontend's Next.js proxy, which only forwards JSON bodies and would silently
// drop PayHere's application/x-www-form-urlencoded notify payload).
const apiGatewayPublicUrl = () => process.env.API_GATEWAY_PUBLIC_URL || 'http://127.0.0.1:5000';
const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// PayHere's own currency support in Sri Lanka is LKR-first; Order.totalAmount is
// always the store's base-currency amount (see Order.ts), which for this store is LKR.
const PAYHERE_CURRENCY = 'LKR';

function hashedSecret(secret: string): string {
  return crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
}

// Authenticated: called right after the order is created, to get the PayHere
// checkout payload (including the security hash) that the browser then POSTs
// itself to PayHere's hosted payment page.
export const initiatePayment = async (req: any, res: Response) => {
  try {
    const { orderId, amount, customer } = req.body;
    if (!orderId || !amount || !customer) {
      return res.status(400).json({ message: 'orderId, amount and customer are required' });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantId || !merchantSecret) {
      return res.status(500).json({ message: 'PayHere is not configured on this server' });
    }

    const formattedAmount = Number(amount).toFixed(2);
    const hash = crypto
      .createHash('md5')
      .update(merchantId + orderId + formattedAmount + PAYHERE_CURRENCY + hashedSecret(merchantSecret))
      .digest('hex')
      .toUpperCase();

    await new Payment({
      orderId,
      userId: req.user.id || req.user._id,
      amount: Number(amount),
      currency: PAYHERE_CURRENCY,
      status: 'PENDING',
      transactionId: uuidv4(),
      paymentMethod: 'PayHere'
    }).save();

    res.status(200).json({
      sandbox: process.env.PAYHERE_SANDBOX !== 'false',
      merchant_id: merchantId,
      return_url: `${frontendUrl()}/payment/success?order_id=${orderId}`,
      cancel_url: `${frontendUrl()}/payment/cancel?order_id=${orderId}`,
      notify_url: `${apiGatewayPublicUrl()}/api/payments/notify`,
      order_id: orderId,
      items: `NexusCart Order #${orderId}`,
      amount: formattedAmount,
      currency: PAYHERE_CURRENCY,
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: 'Sri Lanka',
      hash
    });
  } catch (error) {
    console.error('initiatePayment error:', error);
    res.status(500).json({ message: 'Error initiating payment' });
  }
};

// Public — no JWT: PayHere's server posts here directly once a payment on
// their hosted page completes, fails, or is cancelled. Authenticity comes
// from the md5 signature, not from a bearer token.
export const payhereNotify = async (req: Request, res: Response) => {
  try {
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = req.body;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || '';

    const expectedSig = crypto
      .createHash('md5')
      .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret(merchantSecret))
      .digest('hex')
      .toUpperCase();

    if (expectedSig !== md5sig) {
      console.error('PayHere notify: signature mismatch for order', order_id);
      return res.status(400).send('Invalid signature');
    }

    const payment = await Payment.findOne({ orderId: order_id }).sort({ createdAt: -1 });
    if (!payment) {
      console.error('PayHere notify: no matching payment for order', order_id);
      return res.status(404).send('Payment not found');
    }

    payment.gatewayStatusCode = String(status_code);

    if (String(status_code) === '2') {
      payment.status = 'COMPLETED';
      if (payment_id) payment.transactionId = String(payment_id);
      await payment.save();

      await axios
        .patch(
          `${orderServiceUrl()}/orders/${order_id}/payment-status`,
          { status: 'PAID' },
          { headers: { 'x-internal-key': process.env.INTERNAL_SERVICE_KEY } }
        )
        .catch((err) => console.error('Failed to mark order paid:', err.message));

      axios
        .post(`${notifUrl()}/notifications/send`, {
          userId: payment.userId,
          type: 'PAYMENT_SUCCESS',
          payload: { transactionId: payment.transactionId, amount: payment.amount, orderId: order_id }
        })
        .catch(() => {});
    } else {
      payment.status = 'FAILED';
      await payment.save();
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('payhereNotify error:', error);
    res.status(500).send('Error processing notification');
  }
};

export const getTransactionHistory = async (req: any, res: Response) => {
  try {
    const payments = await Payment.find({ userId: req.user.id || req.user._id });
    payments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};
