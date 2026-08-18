import { Request, Response } from 'express';
import NotificationLog from '../models/NotificationLog';
import nodemailer from 'nodemailer';
import { renderOrderConfirmationEmail, renderOrderStatusEmail } from '../utils/emailTemplates';

// Created lazily (not at module load) so it always picks up EMAIL_USER/EMAIL_PASS
// after dotenv has loaded them — server.ts calls dotenv.config() after importing
// this controller's module graph, so a top-level transporter would capture
// undefined credentials permanently.
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export const dispatchNotification = async (req: Request, res: Response) => {
  try {
    const { userId, type, payload } = req.body;

    console.log(`[NOTIFICATION] Dispatching ${type} to user ${userId}`);

    let status: 'SENT' | 'SKIPPED' | 'FAILED' = 'SKIPPED';

    try {
      if (type === 'EMAIL') {
        const { to, subject, text, html } = payload;
        await getTransporter().sendMail({ from: process.env.EMAIL_USER, to, subject, text, html });
        status = 'SENT';
      } else if (type === 'ORDER_CREATED' && payload?.to) {
        const { subject, html, text } = renderOrderConfirmationEmail(payload);
        await getTransporter().sendMail({ from: `"NexusCart" <${process.env.EMAIL_USER}>`, to: payload.to, subject, text, html });
        status = 'SENT';
      } else if (type === 'ORDER_UPDATED' && payload?.to) {
        const { subject, html, text } = renderOrderStatusEmail(payload);
        await getTransporter().sendMail({ from: `"NexusCart" <${process.env.EMAIL_USER}>`, to: payload.to, subject, text, html });
        status = 'SENT';
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
