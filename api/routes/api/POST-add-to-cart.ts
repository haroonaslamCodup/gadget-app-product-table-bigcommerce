import type { RouteContext } from "gadget-server";

/**
 * Route: POST /api/add-to-cart
 *
 * Adds a product to the BigCommerce cart
 * Returns a redirect URL that the frontend should navigate to
 *
 * Request body:
 * {
 *   productId: number,
 *   variantId?: number,
 *   quantity: number
 * }
 */

export default async function route({ request, reply, logger, connections, api }: RouteContext) {
  try {
    const body = request.body as any;
    logger.info(`Received request body: ${JSON.stringify(body)}`);

    const { productId, variantId, quantity } = body;

    if (!productId || !quantity) {
      logger.error(`Missing fields - productId: ${productId}, quantity: ${quantity}`);
      return reply.code(400).send({ error: "Missing required fields: productId and quantity" });
    }

    // Get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;
    try {
      const store = await api.internal.bigcommerce.store.findFirst();
      if (store) bigcommerceConnection = connections.bigcommerce.forStore(store);
    } catch (e) {
      logger.warn(`Store lookup failed: ${(e as Error).message}`);
    }

    if (!bigcommerceConnection) {
      return reply.code(500).send({ error: "BigCommerce connection not available" });
    }

    // Prepare the product for cart
    const parsedProductId = parseInt(productId, 10);
    const parsedQuantity = parseInt(quantity, 10);
    const parsedVariantId = variantId ? parseInt(variantId, 10) : undefined;

    logger.info(`Adding to cart - Product ID: ${parsedProductId}, Variant ID: ${parsedVariantId || 'none'}, Quantity: ${parsedQuantity}`);

    // Validate inputs
    if (!parsedProductId || parsedProductId <= 0) {
      logger.error(`Invalid product_id: ${parsedProductId}`);
      return reply.code(400).send({ error: "Invalid product ID" });
    }

    if (!parsedQuantity || parsedQuantity <= 0) {
      logger.error(`Invalid quantity: ${parsedQuantity}`);
      return reply.code(400).send({ error: "Invalid quantity" });
    }

    // Build the cart redirect URL
    // This uses BigCommerce's built-in add-to-cart URL format
    const cartUrl = parsedVariantId
      ? `/cart.php?action=add&product_id=${parsedProductId}&qty=${parsedQuantity}&variant_id=${parsedVariantId}`
      : `/cart.php?action=add&product_id=${parsedProductId}&qty=${parsedQuantity}`;

    logger.info(`Generated cart URL: ${cartUrl}`);

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .send({
        success: true,
        redirectUrl: cartUrl,
        productId: parsedProductId,
        variantId: parsedVariantId,
        quantity: parsedQuantity,
      });
  } catch (error: unknown) {
    const err = error as any;
    logger.error(`Add to cart error: ${err.message}`);
    logger.error(`Error details: ${JSON.stringify(err)}`);

    // Try to extract more details from the error
    if (err.response) {
      logger.error(`Response status: ${err.response.status}`);
      logger.error(`Response data: ${JSON.stringify(err.response.data)}`);
    }

    return reply.code(500).send({
      error: "Failed to add item to cart",
      message: err.message,
      details: err.response?.data || err.toString()
    });
  }
}
