import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Business from '../models/Business';
import User from '../models/User';
import Order from '../models/Order';
import axios from 'axios';

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

    const business = await Business.findByIdAndUpdate(id, { status }, { new: true }).populate('vendorId', 'name email');
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (status === 'Approved' && business.vendorId) {
      const vendor: any = business.vendorId;
      try {
        const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5007';
        await axios.post(`${notificationServiceUrl}/notifications/send`, {
          userId: vendor._id,
          type: 'EMAIL',
          payload: {
            to: vendor.email,
            subject: 'NexusCart - Your Business Account is Approved!',
            html: `
              <h2>Congratulations, ${vendor.name}!</h2>
              <p>Your business <b>${business.businessName}</b> has been successfully approved by the admin.</p>
              <p>You can now log in to the Vendor Dashboard and start adding your products.</p>
              <br/>
              <p>Best Regards,</p>
              <p>NexusCart Team</p>
            `
          }
        });
      } catch (notifyErr) {
        console.error('Failed to send approval email notification:', notifyErr);
      }
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
