import { Router } from 'express';
import { submitRegistration, getMyBusiness } from '../controllers/business.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.post('/register', authenticate, authorizeRole(['Vendor']), submitRegistration);
router.get('/my-business', authenticate, authorizeRole(['Vendor']), getMyBusiness);

export default router;
