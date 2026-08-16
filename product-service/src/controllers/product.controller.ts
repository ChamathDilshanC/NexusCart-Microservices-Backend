import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';

// Public: Get all products with optional search, filter, and sort
export const getAllProducts = async (req: any, res: Response) => {
  try {
    const { search, category, sort, isFeatured } = req.query;
    const filter: any = {};

    if (search && typeof search === 'string') {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { category: regex }
      ];
    }

    if (category && typeof category === 'string') {
      filter.category = category;
    }

    if (isFeatured === 'true') {
      filter.isFeatured = true;
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name_asc') sortOption = { name: 1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const products = await Product.find(filter).sort(sortOption);
    res.status(200).json(products);
  } catch (error) {
    console.error('getAllProducts error:', error);
    res.status(500).json({ message: 'Error fetching products', error: (error as Error).message });
  }
};

// Public: Get all unique categories
export const getCategories = async (req: any, res: Response) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Public: Get single product by ID
export const getProductById = async (req: any, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

// Admin: Create product
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, stock, category, imageUrl, images, isFeatured } = req.body;

    const product = new Product({
      name,
      description,
      price,
      stock: stock || 0,
      category,
      imageUrl,
      images: images || [],
      isFeatured: isFeatured || false
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ message: 'Error creating product', error: (error as Error).message });
  }
};

// Admin: Update product
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Admin: Delete product
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};
