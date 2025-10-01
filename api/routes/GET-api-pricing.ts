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

export default async function route({ request, reply, api, logger, connections }: RouteContext) {
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

    logger.info("Fetching pricing", {
      productId,
      variantId,
      userGroup,
      customerTags,
      quantity
    });

    // Fetch base product pricing
    const productResponse = await connections.bigcommerce.get(`/v3/catalog/products/${productId}`);

    if (!productResponse || !productResponse.data) {
      return reply.code(404).send({ error: "Product not found" });
    }

    const product = productResponse.data;
    let basePrice = product.price;
    let salePrice = product.sale_price;
    let calculatedPrice = product.calculated_price;

    // If variant is specified, get variant pricing
    if (variantId) {
      const variantResponse = await connections.bigcommerce.get(
        `/v3/catalog/products/${productId}/variants/${variantId}`
      );

      if (variantResponse && variantResponse.data) {
        const variant = variantResponse.data;
        basePrice = variant.price || basePrice;
        salePrice = variant.sale_price || salePrice;
        calculatedPrice = variant.calculated_price || calculatedPrice;
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
      currency: product.currency || "USD",
      taxIncluded: false,
      quantityBreaks: [], // TODO: Fetch quantity breaks
      minQuantity: product.order_quantity_minimum || 1,
      maxQuantity: product.order_quantity_maximum || null,
    };

    logger.info("Pricing fetched successfully", { productId, pricing });

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "private, max-age=120") // Cache for 2 minutes (pricing changes more frequently)
      .send(pricing);

  } catch (error) {
    logger.error("Error fetching pricing", { error: error.message, stack: error.stack });
    return reply.code(500).send({ error: "Internal server error" });
  }
}
