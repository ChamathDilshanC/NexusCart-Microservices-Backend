import { Router } from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getCategories } from '../controllers/product.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin-only routes
router.post('/', authenticate, authorizeRole(['Admin']), createProduct);
router.put('/:id', authenticate, authorizeRole(['Admin']), updateProduct);
router.delete('/:id', authenticate, authorizeRole(['Admin']), deleteProduct);

export default router;
