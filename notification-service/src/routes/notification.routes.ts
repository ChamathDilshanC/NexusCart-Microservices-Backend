import { Router } from 'express';
import { dispatchNotification, getNotificationLogs } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Internal route called by other microservices to send a notification (in a real app, this should be secured via internal API key)
router.post('/send', dispatchNotification);

// Route for users to see their own notifications
router.get('/logs', authenticate, getNotificationLogs);

export default router;
