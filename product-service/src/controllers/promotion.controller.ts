import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Promotion from '../models/Promotion';

// Admin: Get all promotions (including inactive)
export const getAllPromotions = async (req: AuthRequest, res: Response) => {
  try {
    const promotions = await Promotion.find();
    res.status(200).json(promotions);
  } catch (error) {
    console.error('getAllPromotions error:', error);
    res.status(500).json({ message: 'Error fetching promotions', error: (error as Error).message });
  }
};

// Admin: Create promotion
export const createPromotion = async (req: AuthRequest, res: Response) => {
  try {
    const { name, discountType, discountValue, scope, category, productIds, isActive } = req.body;
    const promotion = new Promotion({
      name,
      discountType,
      discountValue,
      scope,
      category: category || undefined,
      productIds: Array.isArray(productIds) ? productIds : [],
      isActive: isActive ?? true
    });
    await promotion.save();
    res.status(201).json({ message: 'Promotion created', promotion });
  } catch (error) {
    console.error('createPromotion error:', error);
    res.status(500).json({ message: 'Error creating promotion', error: (error as Error).message });
  }
};

// Admin: Update promotion
export const updatePromotion = async (req: AuthRequest, res: Response) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.status(200).json({ message: 'Promotion updated', promotion });
  } catch (error) {
    console.error('updatePromotion error:', error);
    res.status(500).json({ message: 'Error updating promotion', error: (error as Error).message });
  }
};

// Admin: Delete promotion
export const deletePromotion = async (req: AuthRequest, res: Response) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.status(200).json({ message: 'Promotion deleted' });
  } catch (error) {
    console.error('deletePromotion error:', error);
    res.status(500).json({ message: 'Error deleting promotion', error: (error as Error).message });
  }
};
