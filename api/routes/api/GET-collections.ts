import type { RouteContext } from "gadget-server";

/**
 * Route handler for GET /api/collections
 * Fetches category tree from BigCommerce
 */
export default async function route({ reply, api, logger, connections }: RouteContext) {
  try {
    // Get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;
    try {
      const store = await api.internal.bigcommerce.store.findFirst();
      if (store) {
        bigcommerceConnection = connections.bigcommerce.forStore(store);
      }
    } catch (e) {
      logger.warn(`Store lookup failed: ${(e as Error).message}`);
    }

    if (!bigcommerceConnection) {
      return reply.code(500).send({
        success: false,
        error: "BigCommerce connection not available"
      });
    }

    logger.info("Fetching categories from BigCommerce");

    // Fetch categories from BigCommerce API
    const response = await bigcommerceConnection.v3.get<any>("/catalog/categories?limit=250") as any;

    if (!response) {
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch categories"
      });
    }

    // Extract categories from response
    let categories: any[] = [];
    if (Array.isArray(response)) {
      categories = response;
    } else if (response.data && Array.isArray(response.data)) {
      categories = response.data;
    }

    logger.info(`Categories fetched successfully: ${categories.length} categories`);

    return reply.code(200).send({
      success: true,
      collections: categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id,
        sort_order: cat.sort_order,
        is_visible: cat.is_visible
      }))
    });

  } catch (error: any) {
    logger.error(`Error fetching categories: ${error.message}`);

    return reply.code(500).send({
      success: false,
      error: error.message || "Failed to fetch categories"
    });
  }
}
