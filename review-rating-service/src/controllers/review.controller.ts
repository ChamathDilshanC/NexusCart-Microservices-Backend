import { Request, Response } from 'express';
import Review from '../models/Review';

export const addReview = async (req: any, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;

    const review = new Review({
      userId: req.user.id || req.user._id,
      productId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error: any) {
    console.error('addReview error:', error.message);
    res.status(500).json({ message: 'Error adding review', error: error.message });
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
