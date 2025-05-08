import { Router } from 'express';
import { createReview, getReviewsByMerchant } from '../controller/reviewController.ts';

const router = Router();

// Create a new review
router.post('/', (req, res, next) => {
  console.log('POST /api/review hit:', req.body, 'Raw:', req.rawBody);
  createReview(req, res, next);
});

// Get reviews for a specific merchant
router.get('/merchant/:merchantId', getReviewsByMerchant);

export default router;