import { Request, Response } from 'express';
import { createReviewService, getReviewsByMerchantService } from '../services/reviewService.ts';

interface ReviewBody {
  userId: string;
  merchantId: string;
  rating: number;
  comment?: string;
}

export async function createReview(req: Request<{}, {}, ReviewBody>, res: Response) {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  try {
    const { userId, merchantId, rating, comment } = req.body;
    console.log('Destructured Values:', { userId, merchantId, rating, comment }); // Debug destructured values

    if (!userId || !merchantId || !rating) {
      return res.status(400).json({ error: 'userId, merchantId, and rating are required' });
    }

    const review = await createReviewService({
      userId,
      merchantId,
      rating: Number(rating),
      comment,
    });

    return res.status(201).json({ message: 'Review created', review });
  } catch (error: any) {
    console.log('Error in createReview:', error); // Debug error
    return res.status(400).json({ error: error.message });
  }
}

export async function getReviewsByMerchant(req: Request, res: Response) {
  try {
    const { merchantId } = req.params;
    const reviews = await getReviewsByMerchantService(merchantId);
    return res.status(200).json({ reviews });
  } catch (error: any) {
    console.log('Error in getReviewsByMerchant:', error); // Debug error
    return res.status(400).json({ error: error.message });
  }
}