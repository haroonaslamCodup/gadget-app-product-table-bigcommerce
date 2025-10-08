import type { RouteContext } from "gadget-server";

/**
 * Route: POST /api/add-to-cart
 *
 * Adds a product to the BigCommerce cart using the Storefront API
 * This route acts as a proxy to the BigCommerce Storefront Cart API
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
    const { productId, variantId, quantity } = body;

    if (!productId || !quantity) {
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

    // Prepare cart line item
    const lineItem: any = {
      quantity: parseInt(quantity, 10),
      product_id: parseInt(productId, 10),
    };

    if (variantId) {
      lineItem.variant_id = parseInt(variantId, 10);
    }

    logger.info(`Adding to cart: ${JSON.stringify(lineItem)}`);

    // Use BigCommerce V3 Cart API
    // Always create a new cart or add to existing cart
    const cartResponse = await bigcommerceConnection.v3.post("/carts", {
      line_items: [lineItem],
    });

    logger.info(`Cart response: ${JSON.stringify(cartResponse)}`);

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .send({
        success: true,
        cart: cartResponse,
      });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Add to cart error: ${err.message}`);
    return reply.code(500).send({
      error: "Failed to add item to cart",
      message: err.message
    });
  }
}
