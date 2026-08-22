import { Router } from 'express';
import { initiatePayment, payhereNotify, getTransactionHistory } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initiate', authenticate, initiatePayment);
// PayHere's IPN callback — no JWT available (server-to-server), verified via
// its own md5 signature inside the controller instead.
router.post('/notify', payhereNotify);
router.get('/history', authenticate, getTransactionHistory);

export default router;
