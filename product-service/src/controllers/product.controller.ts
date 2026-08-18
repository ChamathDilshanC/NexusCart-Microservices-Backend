import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import Promotion, { IPromotion } from '../models/Promotion';

// Finds every active promotion that applies to a product and keeps whichever
// gives the lowest final price (no stacking).
function applyBestPromotion(product: any, activePromotions: IPromotion[]) {
  const matching = activePromotions.filter((promo) => {
    if (promo.scope === 'all') return true;
    if (promo.scope === 'category') return promo.category === product.category;
    if (promo.scope === 'products') {
      return promo.productIds.some((id) => id.toString() === product._id.toString());
    }
    return false;
  });

  let bestPrice = product.price;
  let bestPromo: IPromotion | null = null;
  for (const promo of matching) {
    const price =
      promo.discountType === 'percentage'
        ? product.price * (1 - promo.discountValue / 100)
        : product.price - promo.discountValue;
    const clamped = Math.max(0, price);
    if (clamped < bestPrice) {
      bestPrice = clamped;
      bestPromo = promo;
    }
  }

  if (!bestPromo) {
    return { ...product, effectivePrice: product.price, discountPercent: 0, promotionName: null };
  }

  const effectivePrice = Math.round(bestPrice * 100) / 100;
  const discountPercent = Math.round((1 - effectivePrice / product.price) * 100);
  return { ...product, effectivePrice, discountPercent, promotionName: bestPromo.name };
}

async function enrichWithPromotions(products: any[]) {
  const activePromotions = await Promotion.find({ isActive: true });
  return products.map((p) => applyBestPromotion(p.toObject(), activePromotions));
}

// Public: Get all products with optional search, filter, and sort.
// When `page` is supplied, responds with a { items, total, page, pageSize, totalPages }
// envelope instead of a bare array — callers that don't paginate (admin dashboard,
// product-detail related products, metrics) are unaffected.
export const getAllProducts = async (req: any, res: Response) => {
  try {
    const { search, category, sort, isFeatured, page, limit } = req.query;
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
      const cats = category.split(',').map((c) => c.trim()).filter(Boolean);
      filter.category = cats.length > 1 ? { $in: cats } : cats[0];
    }

    if (isFeatured === 'true') {
      filter.isFeatured = true;
    }

    const products = await Product.find(filter);

    // Sort in memory (Cosmos DB doesn't support order-by on non-indexed fields)
    const sortFns: Record<string, (a: any, b: any) => number> = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      name_asc: (a, b) => a.name.localeCompare(b.name),
      newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    };
    const sortFn = sortFns[sort as string] || sortFns.newest;
    products.sort(sortFn);

    if (!page) {
      return res.status(200).json(await enrichWithPromotions(products));
    }

    const pageNum = Math.max(1, Number.parseInt(page as string, 10) || 1);
    const pageSize = Math.max(1, Number.parseInt(limit as string, 10) || 12);
    const total = products.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageProducts = products.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    res.status(200).json({
      items: await enrichWithPromotions(pageProducts),
      total,
      page: pageNum,
      pageSize,
      totalPages
    });
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
    const [enriched] = await enrichWithPromotions([product]);
    res.status(200).json(enriched);
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
