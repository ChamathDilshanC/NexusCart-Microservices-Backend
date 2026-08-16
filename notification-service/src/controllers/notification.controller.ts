import { Request, Response } from 'express';
import NotificationLog from '../models/NotificationLog';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const dispatchNotification = async (req: Request, res: Response) => {
  try {
    const { userId, type, payload } = req.body;
    
    console.log(`[NOTIFICATION] Dispatching ${type} to user ${userId}`);
    
    if (type === 'EMAIL') {
      const { to, subject, text, html } = payload;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
      });
      console.log(`[NOTIFICATION] Email sent to ${to}`);
    }

    const log = new NotificationLog({
      userId,
      type,
      payload,
      status: 'SENT'
    });

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
