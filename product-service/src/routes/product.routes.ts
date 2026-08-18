import { Router } from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getCategories } from '../controllers/product.controller';
import { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller';
import {
  getActiveBannerTemplates,
  getAllBannerTemplates,
  createBannerTemplate,
  updateBannerTemplate,
  deleteBannerTemplate
} from '../controllers/bannerTemplate.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/banners', getActiveBanners);
router.get('/banner-templates', getActiveBannerTemplates);
router.get('/:id', getProductById);

// Admin-only routes
router.post('/', authenticate, authorizeRole(['Admin']), createProduct);
router.put('/:id', authenticate, authorizeRole(['Admin']), updateProduct);
router.delete('/:id', authenticate, authorizeRole(['Admin']), deleteProduct);

// Banner admin routes
router.get('/banners-admin/all', authenticate, authorizeRole(['Admin']), getAllBanners);
router.post('/banners', authenticate, authorizeRole(['Admin']), createBanner);
router.put('/banners/:id', authenticate, authorizeRole(['Admin']), updateBanner);
router.delete('/banners/:id', authenticate, authorizeRole(['Admin']), deleteBanner);

// Banner template admin routes
router.get('/banner-templates-admin/all', authenticate, authorizeRole(['Admin']), getAllBannerTemplates);
router.post('/banner-templates', authenticate, authorizeRole(['Admin']), createBannerTemplate);
router.put('/banner-templates/:id', authenticate, authorizeRole(['Admin']), updateBannerTemplate);
router.delete('/banner-templates/:id', authenticate, authorizeRole(['Admin']), deleteBannerTemplate);

export default router;
