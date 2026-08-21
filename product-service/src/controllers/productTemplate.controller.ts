import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProductTemplate from '../models/ProductTemplate';
import Product from '../models/Product';

// Public: Get active product templates (sorted by order)
export const getActiveProductTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await ProductTemplate.find({ isActive: true });
    templates.sort((a: any, b: any) => a.order - b.order);
    res.status(200).json(templates);
  } catch (error) {
    console.error('getActiveProductTemplates error:', error);
    res.status(500).json({ message: 'Error fetching product templates', error: (error as Error).message });
  }
};

// Admin: Get all product templates (including inactive)
export const getAllProductTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await ProductTemplate.find();
    templates.sort((a: any, b: any) => a.order - b.order);
    res.status(200).json(templates);
  } catch (error) {
    console.error('getAllProductTemplates error:', error);
    res.status(500).json({ message: 'Error fetching product templates', error: (error as Error).message });
  }
};

// Admin: Create product template
export const createProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, position, autoAdvance, intervalMs, isActive, order } = req.body;
    const template = new ProductTemplate({
      name,
      position,
      autoAdvance: autoAdvance ?? true,
      intervalMs: intervalMs ?? 5000,
      isActive: isActive ?? true,
      order: order ?? 0
    });
    await template.save();
    res.status(201).json({ message: 'Product template created', template });
  } catch (error) {
    console.error('createProductTemplate error:', error);
    res.status(500).json({ message: 'Error creating product template', error: (error as Error).message });
  }
};

// Admin: Update product template
export const updateProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await ProductTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!template) return res.status(404).json({ message: 'Product template not found' });
    res.status(200).json({ message: 'Product template updated', template });
  } catch (error) {
    console.error('updateProductTemplate error:', error);
    res.status(500).json({ message: 'Error updating product template', error: (error as Error).message });
  }
};

// Admin: Delete product template (also unlinks it from any products tagged to it)
export const deleteProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await ProductTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Product template not found' });
    await Product.updateMany({}, { $pull: { templateIds: req.params.id } });
    res.status(200).json({ message: 'Product template deleted' });
  } catch (error) {
    console.error('deleteProductTemplate error:', error);
    res.status(500).json({ message: 'Error deleting product template', error: (error as Error).message });
  }
};
