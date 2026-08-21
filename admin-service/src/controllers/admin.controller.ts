import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Order from '../models/Order';
import axios from 'axios';

const productServiceUrl = () => process.env.PRODUCT_SERVICE_URL || 'http://127.0.0.1:5003';
const orderServiceUrl = () => process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:5005';

// Admin: Get all users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.status(200).json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Error fetching users', error: (error as Error).message });
  }
};

// Admin: System metrics
export const getSystemMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Get total products from product-service
    let totalProducts = 0;
    try {
      const productsRes = await axios.get(`${productServiceUrl()}/products`);
      totalProducts = Array.isArray(productsRes.data) ? productsRes.data.length : 0;
    } catch (e) {
      console.error('Failed to fetch products count:', e);
    }

    res.status(200).json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    console.error('getSystemMetrics error:', error);
    res.status(500).json({ message: 'Error fetching system metrics', error: (error as Error).message });
  }
};

// Admin: Get all products (proxy to product-service)
export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.get(`${productServiceUrl()}/products`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('getAllProducts proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: 'Error fetching products', detail: error.response?.data || error.message });
  }
};

// Admin: Create product (proxy to product-service)
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.post(`${productServiceUrl()}/products`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('createProduct proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error creating product', detail: error.response?.data || error.message });
  }
};

// Admin: Update product (proxy to product-service)
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.put(`${productServiceUrl()}/products/${req.params.id}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('updateProduct proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error updating product', detail: error.response?.data || error.message });
  }
};

// Admin: Delete product (proxy to product-service)
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.delete(`${productServiceUrl()}/products/${req.params.id}`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('deleteProduct proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error deleting product', detail: error.response?.data || error.message });
  }
};

// Category management (proxy to product-service)
export const renameCategory = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.put(
      `${productServiceUrl()}/products/categories/${encodeURIComponent(req.params.name)}`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        }
      }
    );
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('renameCategory proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error renaming category', detail: error.response?.data || error.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.delete(
      `${productServiceUrl()}/products/categories/${encodeURIComponent(req.params.name)}`,
      { headers: authHeader ? { Authorization: authHeader } : {} }
    );
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('deleteCategory proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error deleting category', detail: error.response?.data || error.message });
  }
};

// Admin: Get all orders (proxy to order-service)
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.get(`${orderServiceUrl()}/orders`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('getAllOrders proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: 'Error fetching orders', detail: error.response?.data || error.message });
  }
};

// Admin: Update order status (proxy to order-service)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.patch(`${orderServiceUrl()}/orders/${req.params.id}/status`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('updateOrderStatus proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error updating order status', detail: error.response?.data || error.message });
  }
};

// Banner management (proxy to product-service)
export const getAllBanners = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.get(`${productServiceUrl()}/products/banners-admin/all`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('getAllBanners proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: 'Error fetching banners', detail: error.response?.data || error.message });
  }
};

export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.post(`${productServiceUrl()}/products/banners`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('createBanner proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error creating banner', detail: error.response?.data || error.message });
  }
};

export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.put(`${productServiceUrl()}/products/banners/${req.params.id}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('updateBanner proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error updating banner', detail: error.response?.data || error.message });
  }
};

export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.delete(`${productServiceUrl()}/products/banners/${req.params.id}`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('deleteBanner proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error deleting banner', detail: error.response?.data || error.message });
  }
};

// Banner templates (proxy to product-service)
export const getAllBannerTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.get(`${productServiceUrl()}/products/banner-templates-admin/all`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('getAllBannerTemplates proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: 'Error fetching banner templates', detail: error.response?.data || error.message });
  }
};

export const createBannerTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.post(`${productServiceUrl()}/products/banner-templates`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('createBannerTemplate proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error creating banner template', detail: error.response?.data || error.message });
  }
};

export const updateBannerTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.put(`${productServiceUrl()}/products/banner-templates/${req.params.id}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('updateBannerTemplate proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error updating banner template', detail: error.response?.data || error.message });
  }
};

export const deleteBannerTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.delete(`${productServiceUrl()}/products/banner-templates/${req.params.id}`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('deleteBannerTemplate proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error deleting banner template', detail: error.response?.data || error.message });
  }
};

// Promotions (proxy to product-service)
export const getAllPromotions = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.get(`${productServiceUrl()}/products/promotions-admin/all`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('getAllPromotions proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: 'Error fetching promotions', detail: error.response?.data || error.message });
  }
};

export const createPromotion = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.post(`${productServiceUrl()}/products/promotions`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('createPromotion proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error creating promotion', detail: error.response?.data || error.message });
  }
};

export const updatePromotion = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.put(`${productServiceUrl()}/products/promotions/${req.params.id}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('updatePromotion proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error updating promotion', detail: error.response?.data || error.message });
  }
};

export const deletePromotion = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.delete(`${productServiceUrl()}/products/promotions/${req.params.id}`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('deletePromotion proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error deleting promotion', detail: error.response?.data || error.message });
  }
};

// Currency settings (proxy to product-service)
export const getCurrencySettings = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.get(`${productServiceUrl()}/products/settings/currency`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('getCurrencySettings proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: 'Error fetching currency settings', detail: error.response?.data || error.message });
  }
};

export const updateCurrencySettings = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.put(`${productServiceUrl()}/products/settings/currency`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('updateCurrencySettings proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error updating currency settings', detail: error.response?.data || error.message });
  }
};
