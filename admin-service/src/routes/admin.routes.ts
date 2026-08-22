import { Router } from 'express';
import {
  getAllUsers, createUser, updateUserRole, deleteUser, getSystemMetrics,
  getAllProducts, createProduct, updateProduct, adjustProductStock, deleteProduct,
  renameCategory, deleteCategory,
  getAllOrders, updateOrderStatus,
  getAllBanners, createBanner, updateBanner, deleteBanner,
  getAllBannerTemplates, createBannerTemplate, updateBannerTemplate, deleteBannerTemplate,
  getAllProductTemplates, createProductTemplate, updateProductTemplate, deleteProductTemplate,
  getAllPromotions, createPromotion, updatePromotion, deletePromotion,
  getCurrencySettings, updateCurrencySettings
} from '../controllers/admin.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Apply auth and admin check to all routes
router.use(authenticate);
router.use(authorizeRole(['Admin']));

// User management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// System metrics
router.get('/metrics', getSystemMetrics);

// Product management (proxied to product-service)
router.get('/products', getAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.patch('/products/:id/stock', adjustProductStock);
router.delete('/products/:id', deleteProduct);

// Category management (proxied to product-service)
router.put('/categories/:name', renameCategory);
router.delete('/categories/:name', deleteCategory);

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

// Product templates (proxied to product-service)
router.get('/product-templates', getAllProductTemplates);
router.post('/product-templates', createProductTemplate);
router.put('/product-templates/:id', updateProductTemplate);
router.delete('/product-templates/:id', deleteProductTemplate);

// Promotions (proxied to product-service)
router.get('/promotions', getAllPromotions);
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);

// Currency settings (proxied to product-service)
router.get('/settings/currency', getCurrencySettings);
router.put('/settings/currency', updateCurrencySettings);

export default router;
