import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Business from '../models/Business';

export const submitRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const { businessName, address, registrationNumber, contactNumber } = req.body;
    
    if (req.user.role !== 'Vendor') {
      return res.status(403).json({ message: 'Only vendors can register a business' });
    }

    const existingBusiness = await Business.findOne({ vendorId: req.user._id });
    if (existingBusiness) {
      return res.status(400).json({ message: 'Business registration already submitted' });
    }

    const business = new Business({
      vendorId: req.user._id,
      businessName,
      address,
      registrationNumber,
      contactNumber,
      status: 'Pending'
    });

    await business.save();
    res.status(201).json({ message: 'Business registration submitted for review', business });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting business registration' });
  }
};

export const getMyBusiness = async (req: AuthRequest, res: Response) => {
  try {
    const business = await Business.findOne({ vendorId: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.status(200).json(business);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching business details' });
  }
};

export const getStorefrontBySlug = async (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    const business = await Business.findOne({ slug, status: 'Approved' }).select('-vendorId');
    if (!business) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json(business);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching storefront' });
  }
};

export const searchBusinesses = async (req: any, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 1) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const regex = new RegExp(q, 'i');
    const businesses = await Business.find({
      status: 'Approved',
      $or: [
        { businessName: regex },
        { description: regex },
        { categories: regex }
      ]
    }).select('businessName slug logoUrl description categories themeColor').limit(20);
    res.status(200).json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Error searching businesses' });
  }
};

export const updateStorefront = async (req: AuthRequest, res: Response) => {
  try {
    const business = await Business.findOne({ vendorId: req.user._id, status: 'Approved' });
    if (!business) {
      return res.status(404).json({ message: 'Approved business not found' });
    }

    const allowedFields = [
      'description', 'logoUrl', 'coverImageUrl', 'themeColor',
      'bannerTitle', 'bannerSubtitle', 'bannerImageUrl',
      'categories', 'socialLinks', 'contactNumber', 'address'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        (business as any)[field] = req.body[field];
      }
    });

    await business.save();
    res.status(200).json({ message: 'Storefront updated', business });
  } catch (error) {
    res.status(500).json({ message: 'Error updating storefront' });
  }
};

export const getAllApprovedBusinesses = async (req: any, res: Response) => {
  try {
    const businesses = await Business.find({ status: 'Approved' })
      .select('businessName slug logoUrl description categories themeColor')
      .sort({ createdAt: -1 });
    res.status(200).json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching businesses' });
  }
};
