import { Request, Response } from 'express';
import Payment from '../models/Payment';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const processPayment = async (req: any, res: Response) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    
    // MOCK PAYMENT GATEWAY LOGIC
    const isSuccess = Math.random() > 0.1; // 90% success rate mock
    const transactionId = uuidv4();

    const payment = new Payment({
      orderId,
      userId: req.user.id || req.user._id,
      amount,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      transactionId,
      paymentMethod
    });

    await payment.save();

    if (isSuccess) {
      // Update order status synchronously to avoid inconsistent state for the user
      const orderUrl = process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:5005';
      await axios.patch(`${orderUrl}/api/orders/${orderId}/status`, {
        status: 'PAID'
      }, {
        headers: { Authorization: req.header('Authorization') }
      }).catch(err => console.error('Failed to update order status via payment success'));

      // Send payment success notification
      const notifUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5007';
      axios.post(`${notifUrl}/api/notifications/send`, {
        userId: req.user.id || req.user._id,
        type: 'PAYMENT_SUCCESS',
        payload: { transactionId, amount, orderId }
      }).catch(err => console.error('Notification failed'));
      
      return res.status(200).json({ message: 'Payment processed successfully', payment });
    } else {
      return res.status(400).json({ message: 'Payment failed due to gateway decline', payment });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment' });
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
