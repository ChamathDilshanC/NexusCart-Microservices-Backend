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
