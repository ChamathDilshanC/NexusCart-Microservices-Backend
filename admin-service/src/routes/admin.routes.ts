import { Router } from 'express';
import {
  getAllUsers, getSystemMetrics,
  getAllProducts, createProduct, updateProduct, deleteProduct,
  getAllOrders, updateOrderStatus,
  getAllBanners, createBanner, updateBanner, deleteBanner,
  getAllBannerTemplates, createBannerTemplate, updateBannerTemplate, deleteBannerTemplate
} from '../controllers/admin.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Apply auth and admin check to all routes
router.use(authenticate);
router.use(authorizeRole(['Admin']));

// User management
router.get('/users', getAllUsers);

// System metrics
router.get('/metrics', getSystemMetrics);

// Product management (proxied to product-service)
router.get('/products', getAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Order management (proxied to order-service)
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

// Banner management (proxied to product-service)
router.get('/banners', getAllBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

// Banner templates (proxied to product-service)
router.get('/banner-templates', getAllBannerTemplates);
router.post('/banner-templates', createBannerTemplate);
router.put('/banner-templates/:id', updateBannerTemplate);
router.delete('/banner-templates/:id', deleteBannerTemplate);

export default router;
