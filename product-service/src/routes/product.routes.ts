import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  renameCategory,
  deleteCategory
} from '../controllers/product.controller';
import { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller';
import {
  getActiveBannerTemplates,
  getAllBannerTemplates,
  createBannerTemplate,
  updateBannerTemplate,
  deleteBannerTemplate
} from '../controllers/bannerTemplate.controller';
import {
  getActiveProductTemplates,
  getAllProductTemplates,
  createProductTemplate,
  updateProductTemplate,
  deleteProductTemplate
} from '../controllers/productTemplate.controller';
import { getAllPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotion.controller';
import { getCurrencySettings, updateCurrencySettings, getExchangeRates } from '../controllers/settings.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/banners', getActiveBanners);
router.get('/banner-templates', getActiveBannerTemplates);
router.get('/product-templates', getActiveProductTemplates);
router.get('/settings/currency', getCurrencySettings);
router.get('/exchange-rates', getExchangeRates);
router.get('/:id', getProductById);

// Admin-only routes
router.post('/', authenticate, authorizeRole(['Admin']), createProduct);
router.put('/categories/:name', authenticate, authorizeRole(['Admin']), renameCategory);
router.delete('/categories/:name', authenticate, authorizeRole(['Admin']), deleteCategory);
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

// Product template admin routes
router.get('/product-templates-admin/all', authenticate, authorizeRole(['Admin']), getAllProductTemplates);
router.post('/product-templates', authenticate, authorizeRole(['Admin']), createProductTemplate);
router.put('/product-templates/:id', authenticate, authorizeRole(['Admin']), updateProductTemplate);
router.delete('/product-templates/:id', authenticate, authorizeRole(['Admin']), deleteProductTemplate);

// Promotion admin routes
router.get('/promotions-admin/all', authenticate, authorizeRole(['Admin']), getAllPromotions);
router.post('/promotions', authenticate, authorizeRole(['Admin']), createPromotion);
router.put('/promotions/:id', authenticate, authorizeRole(['Admin']), updatePromotion);
router.delete('/promotions/:id', authenticate, authorizeRole(['Admin']), deletePromotion);

// Currency settings admin route
router.put('/settings/currency', authenticate, authorizeRole(['Admin']), updateCurrencySettings);

export default router;
