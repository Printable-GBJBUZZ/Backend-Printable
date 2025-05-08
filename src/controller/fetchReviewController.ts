import { Request, Response, NextFunction } from 'express';
import { FetchReviewService } from '../services/fetchReviewService.ts';

const fetchReviewService = new FetchReviewService();

export const getReviewsByMerchant = async (
  req: Request<{}, {}, {}, { merchantId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { merchantId } = req.query;
    if (!merchantId) {
      res.status(400).json({ error: 'Merchant ID is required' });
      return;
    }

    const reviews = await fetchReviewService.getReviewsByMerchantId(merchantId);
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

export const getReviewsByUser = async (
  req: Request<{}, {}, {}, { userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const reviews = await fetchReviewService.getReviewsByUserId(userId);
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};