import { Router } from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getCategories } from '../controllers/product.controller';
import { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller';
import { getBannerSettings, updateBannerSettings } from '../controllers/bannerSettings.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/banners', getActiveBanners);
router.get('/banner-settings', getBannerSettings);
router.get('/:id', getProductById);

// Admin-only routes
router.post('/', authenticate, authorizeRole(['Admin']), createProduct);
router.put('/banner-settings', authenticate, authorizeRole(['Admin']), updateBannerSettings);
router.put('/:id', authenticate, authorizeRole(['Admin']), updateProduct);
router.delete('/:id', authenticate, authorizeRole(['Admin']), deleteProduct);

// Banner admin routes
router.get('/banners-admin/all', authenticate, authorizeRole(['Admin']), getAllBanners);
router.post('/banners', authenticate, authorizeRole(['Admin']), createBanner);
router.put('/banners/:id', authenticate, authorizeRole(['Admin']), updateBanner);
router.delete('/banners/:id', authenticate, authorizeRole(['Admin']), deleteBanner);

export default router;
