import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import BannerTemplate from '../models/BannerTemplate';
import Banner from '../models/Banner';

// Public: Get active banner templates (sorted by position, then order)
export const getActiveBannerTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await BannerTemplate.find({ isActive: true });
    templates.sort((a: any, b: any) => a.order - b.order);
    res.status(200).json(templates);
  } catch (error) {
    console.error('getActiveBannerTemplates error:', error);
    res.status(500).json({ message: 'Error fetching banner templates', error: (error as Error).message });
  }
};

// Admin: Get all banner templates (including inactive)
export const getAllBannerTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await BannerTemplate.find();
    templates.sort((a: any, b: any) => a.order - b.order);
    res.status(200).json(templates);
  } catch (error) {
    console.error('getAllBannerTemplates error:', error);
    res.status(500).json({ message: 'Error fetching banner templates', error: (error as Error).message });
  }
};

// Admin: Create banner template
export const createBannerTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, layout, position, isActive, order, options } = req.body;
    const template = new BannerTemplate({
      name,
      layout,
      position,
      isActive: isActive ?? true,
      order: order ?? 0,
      options
    });
    await template.save();
    res.status(201).json({ message: 'Banner template created', template });
  } catch (error) {
    console.error('createBannerTemplate error:', error);
    res.status(500).json({ message: 'Error creating banner template', error: (error as Error).message });
  }
};

// Admin: Update banner template
export const updateBannerTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await BannerTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!template) return res.status(404).json({ message: 'Banner template not found' });
    res.status(200).json({ message: 'Banner template updated', template });
  } catch (error) {
    console.error('updateBannerTemplate error:', error);
    res.status(500).json({ message: 'Error updating banner template', error: (error as Error).message });
  }
};

// Admin: Delete banner template (also unlinks it from any banners tagged to it)
export const deleteBannerTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await BannerTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Banner template not found' });
    await Banner.updateMany({}, { $pull: { templateIds: req.params.id } });
    res.status(200).json({ message: 'Banner template deleted' });
  } catch (error) {
    console.error('deleteBannerTemplate error:', error);
    res.status(500).json({ message: 'Error deleting banner template', error: (error as Error).message });
  }
};
