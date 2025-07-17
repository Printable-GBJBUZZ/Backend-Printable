import express from 'express';
import { calculateOrderPrice } from '../controller/OrderPriceController.ts';

const router = express.Router();

router.post('/calculate-price', calculateOrderPrice);

export default router;