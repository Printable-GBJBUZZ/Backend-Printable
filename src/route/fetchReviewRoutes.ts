import express from 'express';
import { getReviewsByMerchant, getReviewsByUser } from '../controller/fetchReviewController.ts';

const router = express.Router();

router.get('/merchant', getReviewsByMerchant);
router.get('/user', getReviewsByUser);

export default router;