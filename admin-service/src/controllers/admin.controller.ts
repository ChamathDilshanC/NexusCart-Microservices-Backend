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
