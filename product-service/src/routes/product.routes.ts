import { Router } from 'express';
import { createProduct, getVendorProducts, getAllProducts, getProductById, getProductsByBusiness, getProductsBySlug, deleteProduct, updateProduct } from '../controllers/product.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/by-business/:businessId', getProductsByBusiness);
router.get('/by-slug/:slug', getProductsBySlug);
router.get('/:id', getProductById);

// Vendor protected routes
router.post('/', authenticate, authorizeRole(['Vendor']), createProduct);
router.get('/vendor/me', authenticate, authorizeRole(['Vendor']), getVendorProducts);
router.put('/:id', authenticate, authorizeRole(['Vendor']), updateProduct);
router.delete('/:id', authenticate, authorizeRole(['Vendor']), deleteProduct);

export default router;
