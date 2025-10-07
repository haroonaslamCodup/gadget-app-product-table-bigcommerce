import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/pricing
 *
 * Fetches customer-group-specific pricing for products
 * Handles quantity breaks and price list rules (B2B/Enterprise feature)
 *
 * Query params:
 * - productId: Product ID (required)
 * - variantId: Variant ID (optional)
 * - userGroup: Customer group (guest, retail, wholesale, etc.)
 * - customerTags: Comma-separated customer tags
 * - quantity: Quantity for bulk pricing
 */

export default async function route({ request, reply, logger, connections }: RouteContext) {
  try {
    // Use request.query instead of parsing URL (Fastify provides parsed query params)
    const params = request.query as Record<string, string>;

    const productId = params.productId;
    const variantId = params.variantId;
    const userGroup = params.userGroup || "guest";
    const customerTags = params.customerTags?.split(",") || [];
    const quantity = parseInt(params.quantity || "1", 10);

    if (!productId) {
      return reply.code(400).send({ error: "productId is required" });
    }

    logger.info(`Fetching pricing: productId=${productId}, variantId=${variantId}, userGroup=${userGroup}, customerTags=${JSON.stringify(customerTags)}, quantity=${quantity}`);

    // Fetch base product pricing
    if (!connections.bigcommerce.current) {
      logger.error("BigCommerce connection not initialized");
      return reply.code(500).send({ error: "BigCommerce connection not available" });
    }

    const productResponse = await connections.bigcommerce.current.v3.get<any>(`/catalog/products/${productId}`) as any;

    if (!productResponse) {
      return reply.code(404).send({ error: "Product not found" });
    }

    const product = productResponse as any;
    let basePrice = (product.price as number);
    let salePrice = (product.sale_price as number);
    let calculatedPrice = (product.calculated_price as number);

    // If variant is specified, get variant pricing
    if (variantId && connections.bigcommerce.current) {
      const variantResponse = await connections.bigcommerce.current.v3.get<any>(`/catalog/products/${productId}/variants/${variantId}`) as any;

      if (variantResponse) {
        const variant = variantResponse as any;
        basePrice = (variant.price as number) || basePrice;
        salePrice = (variant.sale_price as number) || salePrice;
        calculatedPrice = (variant.calculated_price as number) || calculatedPrice;
      }
    }

    // Fetch price list pricing for B2B customers (requires BigCommerce B2B/Enterprise plan)
    let priceListPrice = null;
    let wholesalePrice = calculatedPrice;

    // Attempt to fetch price list pricing if user group is provided and not guest
    if (userGroup && userGroup !== "guest" && connections.bigcommerce.current) {
      try {
        // Try to fetch price lists (this will fail gracefully if not on B2B/Enterprise plan)
        const priceListsResponse = await connections.bigcommerce.current.v3.get<any>('/pricelists') as any;

        if (priceListsResponse && Array.isArray(priceListsResponse.data)) {
          // Find price list that matches the customer group
          for (const priceList of priceListsResponse.data) {
            // Check if this price list has records for this product
            try {
              const priceListRecordsResponse = await connections.bigcommerce.current.v3.get<any>(
                `/pricelists/${priceList.id}/records?product_id:in=${productId}`
              ) as any;

              if (priceListRecordsResponse && Array.isArray(priceListRecordsResponse.data) && priceListRecordsResponse.data.length > 0) {
                const record = priceListRecordsResponse.data[0];

                // If variant is specified, look for variant-specific pricing
                if (variantId) {
                  const variantRecord = priceListRecordsResponse.data.find((r: any) => r.variant_id?.toString() === variantId);
                  if (variantRecord) {
                    priceListPrice = variantRecord.price;
                  }
                } else {
                  priceListPrice = record.price;
                }

                // If price list name suggests wholesale, use this as wholesale price
                if (priceList.name.toLowerCase().includes('wholesale') || priceList.name.toLowerCase().includes('b2b')) {
                  wholesalePrice = priceListPrice || calculatedPrice;
                }
              }
            } catch (recordError) {
              // Continue to next price list if this one fails
              logger.debug(`Could not fetch price list records for priceListId=${priceList.id}`);
            }
          }
        }
      } catch (priceListError) {
        // Price lists API not available (likely not on B2B/Enterprise plan)
        logger.debug(`Price lists not available - likely not on B2B/Enterprise plan`);
      }
    }

    // Fetch bulk pricing rules (quantity breaks)
    const quantityBreaks: Array<{ min: number; max: number | null; price: number }> = [];

    if (connections.bigcommerce.current) {
      try {
        const bulkPricingResponse = await connections.bigcommerce.current.v3.get<any>(
          `/catalog/products/${productId}/bulk-pricing-rules`
        ) as any;

        if (bulkPricingResponse && Array.isArray(bulkPricingResponse.data)) {
          for (const rule of bulkPricingResponse.data) {
            // Calculate price based on discount type
            let breakPrice = calculatedPrice;

            if (rule.type === 'price') {
              breakPrice = rule.amount;
            } else if (rule.type === 'percent') {
              breakPrice = calculatedPrice * (1 - rule.amount / 100);
            } else if (rule.type === 'fixed') {
              breakPrice = calculatedPrice - rule.amount;
            }

            quantityBreaks.push({
              min: rule.quantity_min,
              max: rule.quantity_max || null,
              price: breakPrice,
            });
          }
        }
      } catch (bulkPricingError) {
        logger.debug(`Could not fetch bulk pricing rules for productId=${productId}`);
      }
    }

    // Apply quantity break pricing if applicable
    let finalPrice = priceListPrice || calculatedPrice;

    if (quantity > 1 && quantityBreaks.length > 0) {
      // Find applicable quantity break
      const applicableBreak = quantityBreaks.find(
        (qb) => quantity >= qb.min && (qb.max === null || quantity <= qb.max)
      );

      if (applicableBreak) {
        finalPrice = applicableBreak.price;
      }
    }

    const pricing = {
      productId,
      variantId,
      userGroup,
      prices: {
        base: basePrice,
        sale: salePrice,
        calculated: calculatedPrice,
        retail: priceListPrice || calculatedPrice,
        wholesale: wholesalePrice,
        final: finalPrice, // Price after applying price lists and quantity breaks
      },
      currency: (product.currency as string) || "USD",
      taxIncluded: false,
      quantityBreaks,
      minQuantity: (product.order_quantity_minimum as number) || 1,
      maxQuantity: (product.order_quantity_maximum as number) || null,
    };

    logger.info(`Pricing fetched successfully: productId=${productId}, pricing=${JSON.stringify(pricing)}`);

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "private, max-age=120") // Cache for 2 minutes (pricing changes more frequently)
      .send(pricing);

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error fetching pricing: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({ error: "Internal server error" });
  }
}
