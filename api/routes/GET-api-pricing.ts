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
    const url = new URL(request.url);
    const params = url.searchParams;

    const productId = params.get("productId");
    const variantId = params.get("variantId");
    const userGroup = params.get("userGroup") || "guest";
    const customerTags = params.get("customerTags")?.split(",") || [];
    const quantity = parseInt(params.get("quantity") || "1", 10);

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

    // TODO: Fetch price list pricing for B2B customers
    // This requires BigCommerce B2B/Enterprise plan
    // For now, return base pricing

    // TODO: Apply quantity break pricing
    // Check for bulk pricing rules based on quantity

    const pricing = {
      productId,
      variantId,
      userGroup,
      prices: {
        base: basePrice,
        sale: salePrice,
        calculated: calculatedPrice,
        retail: calculatedPrice,
        wholesale: calculatedPrice, // TODO: Apply wholesale pricing
      },
      currency: (product.currency as string) || "USD",
      taxIncluded: false,
      quantityBreaks: [], // TODO: Fetch quantity breaks
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
