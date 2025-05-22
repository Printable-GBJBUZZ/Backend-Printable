import express from 'express';
import {
  createService,
  getService,
  getAllServices,
  createMerchantService,
  getMerchantServices,
  createPricingRule,
  getPricingRules,
  createAttribute,
  createAttributeValue,
} from '../controller/ServicesandPriceController.ts';

const router = express.Router();

router.post('/', createService);
router.get('/:id', getService);
router.get('/', getAllServices);

router.post('/merchant', createMerchantService);
router.get('/merchant/services', getMerchantServices);

router.post('/pricing', createPricingRule);
router.get('/pricing', getPricingRules);

router.post('/attribute', createAttribute);
router.post('/attribute/value', createAttributeValue);

export default router;