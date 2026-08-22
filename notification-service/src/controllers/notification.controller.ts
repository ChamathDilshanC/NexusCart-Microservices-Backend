import { Request, Response } from 'express';
import NotificationLog from '../models/NotificationLog';
import { sendRawEmail } from '../services/brevoEmailService';
import { renderOrderConfirmationEmail, renderOrderStatusEmail } from '../utils/emailTemplates';

export const dispatchNotification = async (req: Request, res: Response) => {
  try {
    const { userId, type, payload } = req.body;

    console.log(`[NOTIFICATION] Dispatching ${type} to user ${userId}`);

    let status: 'SENT' | 'SKIPPED' | 'FAILED' = 'SKIPPED';

    try {
      let attempted = false;
      let sent = false;
      if (type === 'EMAIL') {
        attempted = true;
        const { to, subject, text, html } = payload;
        sent = await sendRawEmail(to, subject, html, text);
      } else if (type === 'ORDER_CREATED' && payload?.to) {
        attempted = true;
        const { subject, html, text } = renderOrderConfirmationEmail(payload);
        sent = await sendRawEmail(payload.to, subject, html, text);
      } else if (type === 'ORDER_UPDATED' && payload?.to) {
        attempted = true;
        const { subject, html, text } = renderOrderStatusEmail(payload);
        sent = await sendRawEmail(payload.to, subject, html, text);
      }
      if (attempted) {
        status = sent ? 'SENT' : 'FAILED';
      }
      if (status === 'SENT') console.log(`[NOTIFICATION] Email sent to ${payload?.to || payload?.email}`);
    } catch (sendError: any) {
      console.error('[NOTIFICATION] Email send failed:', sendError.message);
      status = 'FAILED';
    }

    const log = new NotificationLog({ userId, type, payload, status });
    await log.save();

    res.status(200).json({ message: 'Notification dispatched', log });
  } catch (error) {
    console.error('Notification dispatch error:', error);
    res.status(500).json({ message: 'Error dispatching notification' });
  }
};

export const getNotificationLogs = async (req: any, res: Response) => {
  try {
    const logs = await NotificationLog.find({ userId: req.user.id || req.user._id });
    logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification logs' });
  }
};
