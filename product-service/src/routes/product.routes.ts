import { Router } from 'express';
import { createProduct, getVendorProducts, getAllProducts, getProductById } from '../controllers/product.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Vendor protected routes
router.post('/', authenticate, authorizeRole(['Vendor']), createProduct);
router.get('/vendor/me', authenticate, authorizeRole(['Vendor']), getVendorProducts);

export default router;
