import { Router } from 'express';
import { createOrder, getUserOrders, getVendorOrders, updateOrderStatus } from '../controllers/order.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, authorizeRole(['Customer']), getUserOrders);
router.get('/vendor-orders', authenticate, authorizeRole(['Vendor']), getVendorOrders);
router.patch('/:id/status', authenticate, authorizeRole(['Vendor', 'Admin']), updateOrderStatus);

export default router;
