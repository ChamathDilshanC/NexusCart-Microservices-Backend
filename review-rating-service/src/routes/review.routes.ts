import { Router } from 'express';
import { addReview, getProductReviews, getBusinessReviews } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, addReview);
router.get('/product/:productId', getProductReviews);
router.get('/business/:businessId', getBusinessReviews);

export default router;
