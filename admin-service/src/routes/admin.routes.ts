import { Router } from 'express';
import {
  getAllUsers, createUser, updateUserRole, updateUserPermissions, deleteUser, getSystemMetrics,
  getAllProducts, createProduct, updateProduct, adjustProductStock, deleteProduct,
  renameCategory, deleteCategory,
  getAllOrders, updateOrderStatus,
  getAllBanners, createBanner, updateBanner, deleteBanner,
  getAllBannerTemplates, createBannerTemplate, updateBannerTemplate, deleteBannerTemplate,
  getAllProductTemplates, createProductTemplate, updateProductTemplate, deleteProductTemplate,
  getAllPromotions, createPromotion, updatePromotion, deletePromotion,
  getCurrencySettings, updateCurrencySettings
} from '../controllers/admin.controller';
import { authenticate, authorizeRole, requirePermission } from '../middleware/auth';

const router = Router();

// Every route below requires an authenticated Admin at minimum. Which
// specific sections that Admin can act on beyond that is enforced
// per-route-group via requirePermission (see models/User.ts's
// ADMIN_PERMISSIONS) — the super admin always passes every check
// regardless of their stored permissions list.
router.use(authenticate);

// User management — available to any Admin, not gated behind a specific
// permission (creating/promoting Admins and touching the super admin are
// still separately restricted inside the controllers themselves).
router.get('/users', authorizeRole(['Admin']), getAllUsers);
router.post('/users', authorizeRole(['Admin']), createUser);
router.patch('/users/:id/role', authorizeRole(['Admin']), updateUserRole);
router.patch('/users/:id/permissions', authorizeRole(['Admin']), updateUserPermissions);
router.delete('/users/:id', authorizeRole(['Admin']), deleteUser);

// System metrics — read-only overview, any Admin.
router.get('/metrics', authorizeRole(['Admin']), getSystemMetrics);

// Product management (proxied to product-service)
router.get('/products', requirePermission('products'), getAllProducts);
router.post('/products', requirePermission('products'), createProduct);
router.put('/products/:id', requirePermission('products'), updateProduct);
router.patch('/products/:id/stock', requirePermission('products'), adjustProductStock);
router.delete('/products/:id', requirePermission('products'), deleteProduct);

// Category management (proxied to product-service)
router.put('/categories/:name', requirePermission('products'), renameCategory);
router.delete('/categories/:name', requirePermission('products'), deleteCategory);

// Order management (proxied to order-service)
router.get('/orders', requirePermission('orders'), getAllOrders);
router.patch('/orders/:id/status', requirePermission('orders'), updateOrderStatus);

// Banner management (proxied to product-service)
router.get('/banners', requirePermission('banners'), getAllBanners);
router.post('/banners', requirePermission('banners'), createBanner);
router.put('/banners/:id', requirePermission('banners'), updateBanner);
router.delete('/banners/:id', requirePermission('banners'), deleteBanner);

// Banner templates (proxied to product-service)
router.get('/banner-templates', requirePermission('banners'), getAllBannerTemplates);
router.post('/banner-templates', requirePermission('banners'), createBannerTemplate);
router.put('/banner-templates/:id', requirePermission('banners'), updateBannerTemplate);
router.delete('/banner-templates/:id', requirePermission('banners'), deleteBannerTemplate);

// Product templates (proxied to product-service) — same bucket as products.
router.get('/product-templates', requirePermission('products'), getAllProductTemplates);
router.post('/product-templates', requirePermission('products'), createProductTemplate);
router.put('/product-templates/:id', requirePermission('products'), updateProductTemplate);
router.delete('/product-templates/:id', requirePermission('products'), deleteProductTemplate);

// Promotions (proxied to product-service)
router.get('/promotions', requirePermission('promotions'), getAllPromotions);
router.post('/promotions', requirePermission('promotions'), createPromotion);
router.put('/promotions/:id', requirePermission('promotions'), updatePromotion);
router.delete('/promotions/:id', requirePermission('promotions'), deletePromotion);

// Currency settings (proxied to product-service)
router.get('/settings/currency', requirePermission('settings'), getCurrencySettings);
router.put('/settings/currency', requirePermission('settings'), updateCurrencySettings);

export default router;
