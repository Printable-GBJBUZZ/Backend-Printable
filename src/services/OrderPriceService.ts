import { db } from '../configs/db.ts';
import { services, merchant_services, pricing_rules } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

interface DocumentSettings {
  documentId: string;
  copies: number;
  colorType: 'black_and_white' | 'color';
  paperSize: string;
}

interface PriceCalculationInput {
  merchantId: string;
  documents: DocumentSettings[];
}

interface DocumentPriceResult {
  documentId: string;
  serviceName: string;
  copies: number;
  unitPrice: number;
  totalPrice: number;
  attributes: Record<string, string>;
}

interface PriceCalculationResult {
  documents: DocumentPriceResult[];
  totalOrderPrice: number;
}

export class OrderPriceService {
  public async calculatePrice(payload: PriceCalculationInput): Promise<PriceCalculationResult> {
    const { merchantId, documents } = payload;
    const result: DocumentPriceResult[] = [];
    let totalOrderPrice = 0;

    for (const doc of documents) {
      const { documentId, copies, colorType, paperSize } = doc;

      // Map colorType to service name
      const serviceName = colorType === 'black_and_white' ? 'Black and White Print' : 'Color Print';

      // Find the service
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.name, serviceName))
        .limit(1);

      if (!service) {
        throw new Error(`Service not found for colorType: ${colorType}`);
      }

      // Find the merchant's service
      const [merchantService] = await db
        .select()
        .from(merchant_services)
        .where(and(
          eq(merchant_services.merchantId, merchantId),
          eq(merchant_services.serviceId, service.id)
        ))
        .limit(1);

      if (!merchantService) {
        throw new Error(`Merchant ${merchantId} does not offer ${serviceName}`);
      }

      // Find the pricing rule matching the attributes
      const pricingRules = await db
        .select()
        .from(pricing_rules)
        .where(eq(pricing_rules.merchantServiceId, merchantService.id));

      let matchedRule = null;
      for (const rule of pricingRules) {
        const attributes = rule.attributes as Record<string, string>;
        if (attributes.paper_size === paperSize) {
          matchedRule = rule;
          break;
        }
      }

      if (!matchedRule) {
        throw new Error(`No pricing rule found for ${serviceName} with paperSize: ${paperSize}`);
      }

      const unitPrice = parseFloat(matchedRule.price.toString());
      const docTotalPrice = unitPrice * copies;

      result.push({
        documentId,
        serviceName,
        copies,
        unitPrice,
        totalPrice: docTotalPrice,
        attributes: matchedRule.attributes as Record<string, string>,
      });

      totalOrderPrice += docTotalPrice;
    }

    return {
      documents: result,
      totalOrderPrice,
    };
  }
}