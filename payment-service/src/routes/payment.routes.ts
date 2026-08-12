import { Router } from 'express';
import { processPayment, getTransactionHistory } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/process', authenticate, processPayment);
router.get('/history', authenticate, getTransactionHistory);

export default router;
