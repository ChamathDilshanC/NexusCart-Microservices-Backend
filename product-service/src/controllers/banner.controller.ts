import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Banner from '../models/Banner';

// Public: Get all active banners (sorted by order)
export const getActiveBanners = async (req: Request, res: Response) => {
  try {
    const banners = await Banner.find({ isActive: true });
    // Sort in memory (Cosmos DB compatibility)
    banners.sort((a, b) => a.order - b.order);
    res.status(200).json(banners);
  } catch (error) {
    console.error('getActiveBanners error:', error);
    res.status(500).json({ message: 'Error fetching banners', error: (error as Error).message });
  }
};

// Admin: Get all banners (including inactive)
export const getAllBanners = async (req: AuthRequest, res: Response) => {
  try {
    const banners = await Banner.find();
    banners.sort((a, b) => a.order - b.order);
    res.status(200).json(banners);
  } catch (error) {
    console.error('getAllBanners error:', error);
    res.status(500).json({ message: 'Error fetching banners', error: (error as Error).message });
  }
};

// Admin: Create banner
export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, productId, order, isActive, templateIds } = req.body;
    const banner = new Banner({
      title,
      subtitle: subtitle || '',
      imageUrl,
      linkUrl: linkUrl || '',
      productId: productId || undefined,
      order: order ?? 0,
      isActive: isActive ?? true,
      templateIds: Array.isArray(templateIds) ? templateIds : []
    });
    await banner.save();
    res.status(201).json({ message: 'Banner created', banner });
  } catch (error) {
    console.error('createBanner error:', error);
    res.status(500).json({ message: 'Error creating banner', error: (error as Error).message });
  }
};

// Admin: Update banner
export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const update = { ...req.body };
    // An empty string means "untag the product" — Mongoose can't cast "" to an ObjectId.
    if (update.productId === '') update.productId = null;
    const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.status(200).json({ message: 'Banner updated', banner });
  } catch (error) {
    console.error('updateBanner error:', error);
    res.status(500).json({ message: 'Error updating banner', error: (error as Error).message });
  }
};

// Admin: Delete banner
export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.status(200).json({ message: 'Banner deleted' });
  } catch (error) {
    console.error('deleteBanner error:', error);
    res.status(500).json({ message: 'Error deleting banner', error: (error as Error).message });
  }
};
