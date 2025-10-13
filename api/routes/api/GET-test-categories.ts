import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/test-categories
 *
 * Test endpoint to verify BigCommerce API access for categories
 */
export default async function route({ reply, logger, connections, api }: RouteContext) {
  try {
    logger.info('[TEST] Starting category test');

    // Get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;
    try {
      const store = await api.internal.bigcommerce.store.findFirst();
      logger.info(`[TEST] Store found: ${!!store}`);
      if (store) {
        bigcommerceConnection = connections.bigcommerce.forStore(store);
        logger.info(`[TEST] Connection created for store: ${store.storeHash}`);
      }
    } catch (e) {
      logger.error(`[TEST] Store lookup failed: ${(e as Error).message}`);
    }

    if (!bigcommerceConnection) {
      logger.error('[TEST] No BigCommerce connection available');
      return reply.code(500).send({
        success: false,
        error: "BigCommerce connection not available"
      });
    }

    logger.info('[TEST] Fetching categories...');

    // Try fetching categories
    const response = await bigcommerceConnection.v3.get<any>('/catalog/categories') as any;

    logger.info(`[TEST] Response received. Type: ${typeof response}, isArray: ${Array.isArray(response)}`);
    logger.info(`[TEST] Response keys: ${response ? Object.keys(response).join(', ') : 'null'}`);

    if (Array.isArray(response)) {
      logger.info(`[TEST] Direct array with ${response.length} items`);
      return reply.code(200).send({
        success: true,
        format: 'direct-array',
        count: response.length,
        sample: response.slice(0, 2)
      });
    }

    if (response && response.data) {
      logger.info(`[TEST] response.data array with ${response.data.length} items`);
      return reply.code(200).send({
        success: true,
        format: 'wrapped-data',
        count: response.data.length,
        sample: response.data.slice(0, 2),
        meta: response.meta
      });
    }

    logger.warn(`[TEST] Unexpected format: ${JSON.stringify(response).substring(0, 500)}`);

    return reply.code(200).send({
      success: false,
      format: 'unknown',
      response: response
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`[TEST] Error: ${err.message}, stack: ${err.stack}`);
    return reply.code(500).send({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
}
