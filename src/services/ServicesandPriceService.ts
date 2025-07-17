import { db } from "../configs/db.ts";
import {
  services,
  merchant_services,
  pricing_rules,
  attributes,
  attribute_values,
} from "../db/schema.ts";
import { eq, and } from "drizzle-orm";

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
  price: string;
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
    const [newService] = await db
      .insert(services)
      .values({
        id: payload.id,
        name: payload.name,
        description: payload.description,
      })
      .returning();
    return newService;
  }
  public async updatePricingRule(payload: CreatePricingRuleInput) {
    const updatedRows = await db
      .update(pricing_rules)
      .set({
        ...(payload.price !== undefined && { price: payload.price }),
        ...(payload.attributes && { attributes: payload.attributes }),
      })
      .where(eq(pricing_rules.id, payload.id))
      .returning();

    if (updatedRows.length === 0) {
      throw new Error("Pricing rule not found or update failed");
    }

    return updatedRows[0];
  }
  public async getService(id: string) {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);
    return service || null;
  }

  public async getAllServices() {
    return await db.select().from(services);
  }

  public async createMerchantService(payload: CreateMerchantServiceInput) {
    const [newMerchantService] = await db
      .insert(merchant_services)
      .values({
        id: payload.id,
        merchantId: payload.merchantId,
        serviceId: payload.serviceId,
        isActive: payload.isActive ?? true,
      })
      .returning();
    return newMerchantService;
  }

  public async getMerchantService(merchantId: string, serviceId: string) {
    const [merchantService] = await db
      .select()
      .from(merchant_services)
      .where(
        and(
          eq(merchant_services.merchantId, merchantId),
          eq(merchant_services.serviceId, serviceId),
        ),
      )
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
    const sizes = ["A3", "A4", "A5"];

    const insertPromises = sizes.map((size, idx) =>
      db
        .insert(pricing_rules)
        .values({
          id: `pr_${payload.merchantServiceId}_${size}`,
          merchantServiceId: payload.merchantServiceId,
          price: `${idx}`,
          attributes: { ...payload.attributes, paper_size: size },
        })
        .returning(),
    );

    const results = await Promise.all(insertPromises);

    return results.map(([pricingRule]) => pricingRule);
  }

  public async getPricingRules(merchantServiceId: string) {
    return await db
      .select()
      .from(pricing_rules)
      .where(eq(pricing_rules.merchantServiceId, merchantServiceId));
  }

  public async createAttribute(payload: CreateAttributeInput) {
    const [newAttribute] = await db
      .insert(attributes)
      .values({
        id: payload.id,
        name: payload.name,
        description: payload.description,
      })
      .returning();
    return newAttribute;
  }

  public async getAttribute(id: string) {
    const [attribute] = await db
      .select()
      .from(attributes)
      .where(eq(attributes.id, id))
      .limit(1);
    return attribute || null;
  }

  public async createAttributeValue(payload: CreateAttributeValueInput) {
    const [newValue] = await db
      .insert(attribute_values)
      .values({
        id: payload.id,
        attributeId: payload.attributeId,
        value: payload.value,
      })
      .returning();
    return newValue;
  }

  public async getAttributeValues(attributeId: string) {
    return await db
      .select()
      .from(attribute_values)
      .where(eq(attribute_values.attributeId, attributeId));
  }
}
