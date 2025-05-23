import { db } from '../configs/db.ts';
import { services, merchant_services, pricing_rules, attributes, attribute_values } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export interface CreateServiceInput {
  id: string;
  name: string;
  description?: string;
}

export interface CreateMerchantServiceInput {
  id: string;
  merchantId: string;
  serviceId: string;
  isActive?: boolean;
}

export interface CreatePricingRuleInput {
  id: string;
  merchantServiceId: string;
  price: number;
  attributes: Record<string, string>;
}

export interface CreateAttributeInput {
  id: string;
  name: string;
  description?: string;
}

export interface CreateAttributeValueInput {
  id: string;
  attributeId: string;
  value: string;
}

export class ServicesandPriceService {
  public async createService(payload: CreateServiceInput) {
    const [newService] = await db.insert(services).values({
      id: payload.id,
      name: payload.name,
      description: payload.description,
    }).returning();
    return newService;
  }

  public async getService(id: string) {
    const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return service || null;
  }

  public async getAllServices() {
    return await db.select().from(services);
  }

  public async createMerchantService(payload: CreateMerchantServiceInput) {
    const [newMerchantService] = await db.insert(merchant_services).values({
      id: payload.id,
      merchantId: payload.merchantId,
      serviceId: payload.serviceId,
      isActive: payload.isActive ?? true,
    }).returning();
    return newMerchantService;
  }

  public async getMerchantService(merchantId: string, serviceId: string) {
    const [merchantService] = await db
      .select()
      .from(merchant_services)
      .where(and(
        eq(merchant_services.merchantId, merchantId),
        eq(merchant_services.serviceId, serviceId)
      ))
      .limit(1);
    return merchantService || null;
  }

  public async getMerchantServices(merchantId: string) {
    return await db
      .select({
        id: merchant_services.id,
        merchantId: merchant_services.merchantId,
        serviceId: merchant_services.serviceId,
        serviceName: services.name,
        isActive: merchant_services.isActive,
        createdAt: merchant_services.createdAt,
        updatedAt: merchant_services.updatedAt,
      })
      .from(merchant_services)
      .innerJoin(services, eq(services.id, merchant_services.serviceId))
      .where(eq(merchant_services.merchantId, merchantId));
  }

  public async createPricingRule(payload: CreatePricingRuleInput) {
    const [newPricingRule] = await db.insert(pricing_rules).values({
      id: payload.id,
      merchantServiceId: payload.merchantServiceId,
      price: payload.price,
      attributes: payload.attributes,
    }).returning();
    return newPricingRule;
  }

  public async getPricingRules(merchantServiceId: string) {
    return await db
      .select()
      .from(pricing_rules)
      .where(eq(pricing_rules.merchantServiceId, merchantServiceId));
  }

  public async createAttribute(payload: CreateAttributeInput) {
    const [newAttribute] = await db.insert(attributes).values({
      id: payload.id,
      name: payload.name,
      description: payload.description,
    }).returning();
    return newAttribute;
  }

  public async getAttribute(id: string) {
    const [attribute] = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1);
    return attribute || null;
  }

  public async createAttributeValue(payload: CreateAttributeValueInput) {
    const [newValue] = await db.insert(attribute_values).values({
      id: payload.id,
      attributeId: payload.attributeId,
      value: payload.value,
    }).returning();
    return newValue;
  }

  public async getAttributeValues(attributeId: string) {
    return await db
      .select()
      .from(attribute_values)
      .where(eq(attribute_values.attributeId, attributeId));
  }
}