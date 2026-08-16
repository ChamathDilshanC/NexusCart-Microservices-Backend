import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import Business from '../models/Business';

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, stock, category, imageUrl } = req.body;
    
    // Find the vendor's business
    const business = await Business.findOne({ vendorId: req.user._id, status: 'Approved' });
    if (!business) {
      return res.status(403).json({ message: 'You must have an approved business to add products' });
    }

    const product = new Product({
      businessId: business._id,
      name,
      description,
      price,
      stock,
      category,
      imageUrl
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product' });
  }
};

export const getVendorProducts = async (req: AuthRequest, res: Response) => {
  try {
    const business = await Business.findOne({ vendorId: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const products = await Product.find({ businessId: business._id });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getAllProducts = async (req: any, res: Response) => {
  try {
    const products = await Product.find().populate('businessId', 'businessName slug');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req: any, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('businessId', 'businessName slug');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const getProductsByBusiness = async (req: any, res: Response) => {
  try {
    const { businessId } = req.params;
    const products = await Product.find({ businessId });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductsBySlug = async (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    const business = await Business.findOne({ slug, status: 'Approved' });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    const products = await Product.find({ businessId: business._id });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const business = await Business.findOne({ vendorId: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    const product = await Product.findOneAndDelete({ _id: req.params.id, businessId: business._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const business = await Business.findOne({ vendorId: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: business._id },
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
};
