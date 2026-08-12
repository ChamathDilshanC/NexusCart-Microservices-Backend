import { Request, Response } from 'express';
import NotificationLog from '../models/NotificationLog';

export const dispatchNotification = async (req: Request, res: Response) => {
  try {
    const { userId, type, payload } = req.body;
    
    // Simulate sending email/sms
    console.log(`[NOTIFICATION] Dispatching ${type} to user ${userId}`);
    console.log(`[NOTIFICATION] Payload:`, payload);

    const log = new NotificationLog({
      userId,
      type,
      payload,
      status: 'SENT'
    });

    await log.save();

    res.status(200).json({ message: 'Notification dispatched', log });
  } catch (error) {
    res.status(500).json({ message: 'Error dispatching notification' });
  }
};

export const getNotificationLogs = async (req: any, res: Response) => {
  try {
    const logs = await NotificationLog.find({ userId: req.user.id || req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification logs' });
  }
};
