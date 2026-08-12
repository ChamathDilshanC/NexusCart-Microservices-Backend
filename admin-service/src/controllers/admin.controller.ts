import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Business from '../models/Business';
import User from '../models/User';
import Order from '../models/Order';

export const getPendingBusinesses = async (req: AuthRequest, res: Response) => {
  try {
    const businesses = await Business.find({ status: 'Pending' }).populate('vendorId', 'name email');
    res.status(200).json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending businesses' });
  }
};

export const reviewBusiness = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' | 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const business = await Business.findByIdAndUpdate(id, { status }, { new: true });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.status(200).json({ message: `Business ${status.toLowerCase()} successfully`, business });
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing business' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const getSystemMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await Business.countDocuments({ status: 'Approved' });
    const totalOrders = await Order.countDocuments();
    
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.status(200).json({
      totalUsers,
      totalVendors,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system metrics' });
  }
};
