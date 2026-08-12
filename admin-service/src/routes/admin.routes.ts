import { Router } from 'express';
import { getPendingBusinesses, reviewBusiness, getAllUsers, getSystemMetrics } from '../controllers/admin.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Apply auth and admin check to all routes in this file
router.use(authenticate);
router.use(authorizeRole(['Admin']));

router.get('/businesses/pending', getPendingBusinesses);
router.patch('/businesses/:id/review', reviewBusiness);
router.get('/users', getAllUsers);
router.get('/metrics', getSystemMetrics);

export default router;
