import { Router } from 'express';
import { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus } from '../controllers/order.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Authenticated user routes
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getUserOrders);

// Admin-only routes
router.get('/', authenticate, authorizeRole(['Admin']), getAllOrders);
router.patch('/:id/status', authenticate, authorizeRole(['Admin']), updateOrderStatus);

// Authenticated user (own order) or Admin — must stay after /my-orders and / above
router.get('/:id', authenticate, getOrderById);

export default router;
