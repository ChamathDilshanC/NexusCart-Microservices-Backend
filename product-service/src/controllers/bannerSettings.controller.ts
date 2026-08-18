import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import BannerSettings from '../models/BannerSettings';

const DEFAULT_BANNER_SETTINGS = {
  layout: 'carousel',
  position: 'top',
  options: {
    carousel: { autoAdvance: true, intervalMs: 5000, showArrows: true, showDots: true, height: 'standard' },
    grid: { columns: 3, aspectRatio: 'landscape', showSubtitle: true },
    spotlight: { maxListItems: 4, showListSubtitle: false }
  }
};

// Public: Get banner display settings (falls back to defaults if none saved yet)
export const getBannerSettings = async (req: Request, res: Response) => {
  try {
    const settings = await BannerSettings.findOne();
    res.status(200).json(settings || DEFAULT_BANNER_SETTINGS);
  } catch (error) {
    console.error('getBannerSettings error:', error);
    res.status(500).json({ message: 'Error fetching banner settings', error: (error as Error).message });
  }
};

// Admin: Update banner display settings (singleton upsert)
export const updateBannerSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { layout, position, options } = req.body;
    const settings = await BannerSettings.findOneAndUpdate(
      {},
      { layout, position, options },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ message: 'Banner settings updated', settings });
  } catch (error) {
    console.error('updateBannerSettings error:', error);
    res.status(500).json({ message: 'Error updating banner settings', error: (error as Error).message });
  }
};
