import { Request, Response, NextFunction } from 'express';
import { OrderPriceService } from '../services/OrderPriceService.ts';

const orderPriceService = new OrderPriceService();

interface DocumentSettings {
  documentId: string;
  copies: number;
  colorType: 'black_and_white' | 'color';
  paperSize: string;
}

interface PriceCalculationRequestBody {
  merchantId: string;
  documents: DocumentSettings[];
}

export const calculateOrderPrice = async (
  req: Request<{}, {}, PriceCalculationRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { merchantId, documents } = req.body;

    if (!merchantId || !documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'merchantId and documents array are required',
      });
    }

    for (const doc of documents) {
      if (!doc.documentId || !doc.copies || !doc.colorType || !doc.paperSize) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Each document must have documentId, copies, colorType, and paperSize',
        });
      }
      if (!['black_and_white', 'color'].includes(doc.colorType)) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'colorType must be "black_and_white" or "color"',
        });
      }
      if (doc.copies < 1) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'copies must be at least 1',
        });
      }
    }

    const priceResult = await orderPriceService.calculatePrice({ merchantId, documents });

    return res.status(200).json({
      status: 'success',
      data: priceResult,
    });
  } catch (error) {
    next(error);
  }
};