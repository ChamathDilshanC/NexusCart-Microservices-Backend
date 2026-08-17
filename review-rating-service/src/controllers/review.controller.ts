import { Request, Response } from 'express';
import Review from '../models/Review';
import axios from 'axios';

export const addReview = async (req: any, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // Validate product exists via product-service HTTP call
    const productUrl = process.env.PRODUCT_SERVICE_URL || 'http://127.0.0.1:5003';
    const productRes = await axios.get(`${productUrl}/products/${productId}`);
    if (!productRes.data) return res.status(404).json({ message: 'Product not found' });
    
    const businessId = productRes.data.businessId; // We assume the product object returns the vendor's business ID

    const review = new Review({
      userId: req.user.id || req.user._id,
      productId,
      businessId: businessId?._id || businessId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error: any) {
    if (error.response?.status === 404) return res.status(404).json({ message: 'Product not found in Product Catalog' });
    res.status(500).json({ message: 'Error adding review' });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const getBusinessReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ businessId: req.params.businessId });
    reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching business reviews' });
  }
};
