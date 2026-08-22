import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User, { ADMIN_PERMISSIONS } from '../models/User';
import Order from '../models/Order';
import axios from 'axios';
import bcrypt from 'bcrypt';

const productServiceUrl = () => process.env.PRODUCT_SERVICE_URL || 'http://127.0.0.1:5003';
const orderServiceUrl = () => process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:5005';

// The only account allowed to grant or revoke the Admin role. Same env var
// as auth-service's SUPER_ADMIN_EMAIL, so both stay in sync.
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'chamathdilshan.dev@gmail.com';

// admin-service's `authenticate` trusts the JWT's role claim directly rather
// than re-querying the DB (see middleware/auth.ts) — fine for the existing
// authorizeRole(['Admin']) gate, but granting/revoking Admin needs the
// *current* email, which isn't in the JWT at all. This fetches the acting
// admin's live record to check it.
async function isActingAsSuperAdmin(req: AuthRequest): Promise<boolean> {
  const actingAdmin = await User.findById(req.user._id).select('email');
  return !!actingAdmin && actingAdmin.email === SUPER_ADMIN_EMAIL;
}

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

// Admin: Create a user directly — an internal admin tool, so no OTP step;
// the account is created already verified.
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const requestedRole = role === 'Admin' ? 'Admin' : 'Customer';
    if (requestedRole === 'Admin' && !(await isActingAsSuperAdmin(req))) {
      return res.status(403).json({ message: 'Only the super admin can create Admin accounts' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A user with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash, role: requestedRole, isVerified: true });
    await user.save();

    const { passwordHash: _omit, ...safeUser } = user.toObject();
    res.status(201).json({ message: 'User created', user: safeUser });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ message: 'Error creating user', error: (error as Error).message });
  }
};

// Admin: Change a user's role. Granting/revoking Admin is restricted to the
// super admin; a regular admin can still move accounts between the other
// roles freely.
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (role !== 'Admin' && role !== 'Customer') {
      return res.status(400).json({ message: 'Role must be Admin or Customer' });
    }
    if (req.params.id === req.user._id) {
      return res.status(400).json({ message: "You can't change your own role" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ message: "The super admin's role can't be changed" });
    }

    if ((role === 'Admin' || targetUser.role === 'Admin') && !(await isActingAsSuperAdmin(req))) {
      return res.status(403).json({ message: 'Only the super admin can grant or revoke Admin access' });
    }

    targetUser.role = role;
    await targetUser.save();

    const { passwordHash: _omit, ...safeUser } = targetUser.toObject();
    res.status(200).json({ message: 'Role updated', user: safeUser });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ message: 'Error updating role', error: (error as Error).message });
  }
};

// Admin: Set which admin console sections a fellow Admin can access. Unlike
// updateUserRole, this is NOT restricted to the super admin — any admin can
// shape another admin's access, since it can only ever narrow what they can
// do, never grant the Admin role itself (that's still super-admin-only,
// checked above in updateUserRole/createUser). The super admin's own access
// is always full regardless of this list, so it can't be edited.
export const updateUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions) || permissions.some((p) => !ADMIN_PERMISSIONS.includes(p))) {
      return res.status(400).json({ message: `permissions must be an array of: ${ADMIN_PERMISSIONS.join(', ')}` });
    }
    if (req.params.id === req.user._id) {
      return res.status(400).json({ message: "You can't change your own permissions" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ message: "The super admin already has full access — nothing to set" });
    }
    if (targetUser.role !== 'Admin') {
      return res.status(400).json({ message: 'Only Admin accounts have section permissions' });
    }

    targetUser.permissions = permissions;
    await targetUser.save();

    const { passwordHash: _omit, ...safeUser } = targetUser.toObject();
    res.status(200).json({ message: 'Permissions updated', user: safeUser });
  } catch (error) {
    console.error('updateUserPermissions error:', error);
    res.status(500).json({ message: 'Error updating permissions', error: (error as Error).message });
  }
};

// Admin: Delete a user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.id === req.user._id) {
      return res.status(400).json({ message: "You can't delete your own account" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ message: 'The super admin account cannot be deleted' });
    }
    if (targetUser.role === 'Admin' && !(await isActingAsSuperAdmin(req))) {
      return res.status(403).json({ message: 'Only the super admin can delete an Admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Error deleting user', error: (error as Error).message });
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

// Admin: Adjust stock (proxy to product-service)
export const adjustProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.patch(`${productServiceUrl()}/products/${req.params.id}/stock`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('adjustProductStock proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error adjusting stock', detail: error.response?.data || error.message });
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

// Product templates (proxy to product-service)
export const getAllProductTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.get(`${productServiceUrl()}/products/product-templates-admin/all`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('getAllProductTemplates proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: 'Error fetching product templates', detail: error.response?.data || error.message });
  }
};

export const createProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.post(`${productServiceUrl()}/products/product-templates`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('createProductTemplate proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error creating product template', detail: error.response?.data || error.message });
  }
};

export const updateProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.put(`${productServiceUrl()}/products/product-templates/${req.params.id}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('updateProductTemplate proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error updating product template', detail: error.response?.data || error.message });
  }
};

export const deleteProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const response = await axios.delete(`${productServiceUrl()}/products/product-templates/${req.params.id}`, {
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('deleteProductTemplate proxy error:', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Error deleting product template', detail: error.response?.data || error.message });
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
