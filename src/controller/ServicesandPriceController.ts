import { Request, Response, NextFunction } from 'express';
import { ServicesandPriceService, CreateServiceInput, CreateMerchantServiceInput, CreatePricingRuleInput, CreateAttributeInput, CreateAttributeValueInput } from '../services/ServicesandPriceService.ts';

const servicesandPriceService = new ServicesandPriceService();

export const createService = async (
  req: Request<{}, {}, CreateServiceInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    if (!payload.id || !payload.name) {
      return res.status(400).json({ status: 'error', statusCode: 400, message: 'Service id and name are required' });
    }
    const service = await servicesandPriceService.createService(payload);
    return res.status(201).json({ status: 'success', data: service });
  } catch (error) {
    next(error);
  }
};

export const getService = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const service = await servicesandPriceService.getService(id);
    if (!service) {
      return res.status(404).json({ status: 'error', statusCode: 404, message: 'Service not found' });
    }
    return res.status(200).json({ status: 'success', data: service });
  } catch (error) {
    next(error);
  }
};

export const getAllServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await servicesandPriceService.getAllServices();
    return res.status(200).json({ status: 'success', data: services });
  } catch (error) {
    next(error);
  }
};

export const createMerchantService = async (
  req: Request<{}, {}, CreateMerchantServiceInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    if (!payload.id || !payload.merchantId || !payload.serviceId) {
      return res.status(400).json({ status: 'error', statusCode: 400, message: 'id, merchantId, and serviceId are required' });
    }
    const merchantService = await servicesandPriceService.createMerchantService(payload);
    return res.status(201).json({ status: 'success', data: merchantService });
  } catch (error) {
    next(error);
  }
};

export const getMerchantServices = async (
  req: Request<{}, {}, {}, { merchantId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { merchantId } = req.query;
    if (!merchantId) {
      return res.status(400).json({ status: 'error', statusCode: 400, message: 'merchantId is required' });
    }
    const merchantServices = await servicesandPriceService.getMerchantServices(merchantId);
    return res.status(200).json({ status: 'success', data: merchantServices });
  } catch (error) {
    next(error);
  }
};

export const createPricingRule = async (
  req: Request<{}, {}, CreatePricingRuleInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    if (!payload.id || !payload.merchantServiceId || !payload.price || !payload.attributes) {
      return res.status(400).json({ status: 'error', statusCode: 400, message: 'id, merchantServiceId, price, and attributes are required' });
    }
    const pricingRule = await servicesandPriceService.createPricingRule(payload);
    return res.status(201).json({ status: 'success', data: pricingRule });
  } catch (error) {
    next(error);
  }
};

export const getPricingRules = async (
  req: Request<{}, {}, {}, { merchantServiceId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { merchantServiceId } = req.query;
    if (!merchantServiceId) {
      return res.status(400).json({ status: 'error', statusCode: 400, message: 'merchantServiceId is required' });
    }
    const pricingRules = await servicesandPriceService.getPricingRules(merchantServiceId);
    return res.status(200).json({ status: 'success', data: pricingRules });
  } catch (error) {
    next(error);
  }
};

export const createAttribute = async (
  req: Request<{}, {}, CreateAttributeInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    if (!payload.id || !payload.name) {
      return res.status(400).json({ status: 'error', statusCode: 400, message: 'Attribute id and name are required' });
    }
    const attribute = await servicesandPriceService.createAttribute(payload);
    return res.status(201).json({ status: 'success', data: attribute });
  } catch (error) {
    next(error);
  }
};

export const createAttributeValue = async (
  req: Request<{}, {}, CreateAttributeValueInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    if (!payload.id || !payload.attributeId || !payload.value) {
      return res.status(400).json({ status: 'error', statusCode: 400, message: 'id, attributeId, and value are required' });
    }
    const attributeValue = await servicesandPriceService.createAttributeValue(payload);
    return res.status(201).json({ status: 'success', data: attributeValue });
  } catch (error) {
    next(error);
  }
};