import { Router } from 'express';
import { submitRegistration, getMyBusiness, getStorefrontBySlug, searchBusinesses, updateStorefront, getAllApprovedBusinesses } from '../controllers/business.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/storefront/:slug', getStorefrontBySlug);
router.get('/search', searchBusinesses);
router.get('/all', getAllApprovedBusinesses);

// Vendor protected routes
router.post('/register', authenticate, authorizeRole(['Vendor']), submitRegistration);
router.get('/my-business', authenticate, authorizeRole(['Vendor']), getMyBusiness);
router.put('/storefront', authenticate, authorizeRole(['Vendor']), updateStorefront);

export default router;
