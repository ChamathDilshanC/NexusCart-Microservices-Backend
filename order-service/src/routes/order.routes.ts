import { Router } from 'express';
import { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus } from '../controllers/order.controller';
import { authenticate, authorizeRole, authenticateInternal } from '../middleware/auth';

const router = Router();

// Authenticated user routes
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getUserOrders);

// Admin-only routes
router.get('/', authenticate, authorizeRole(['Admin']), getAllOrders);
router.patch('/:id/status', authenticate, authorizeRole(['Admin']), updateOrderStatus);

// Internal service-to-service — payment-service marks an order paid once
// PayHere's notify webhook confirms payment (no customer JWT in that context).
router.patch('/:id/payment-status', authenticateInternal, updateOrderStatus);

// Authenticated user (own order) or Admin — must stay after /my-orders and / above
router.get('/:id', authenticate, getOrderById);

export default router;
