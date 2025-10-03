import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/product-tables-list
 * Returns a list of active product tables for Page Builder dropdown
 */
export default async function route({ reply, api, logger, connections }: RouteContext) {
  try {
    // Get store from session
    const storeId = connections.bigcommerce?.currentStoreId;

    if (!storeId) {
      return reply.code(401).send({
        success: false,
        error: "Store not identified",
      });
    }

    // Fetch all active product tables for this store
    const productTables = await api.productTable.findMany({
      filter: {
        store: { id: { equals: storeId } },
        isActive: { equals: true },
      },
      select: {
        id: true,
        productTableId: true,
        productTableName: true,
        placementLocation: true,
        displayFormat: true,
      },
    });

    // Format for Page Builder dropdown
    const productTableOptions = productTables.map((productTable: any) => ({
      label: productTable.productTableName || `Product Table ${productTable.productTableId}`,
      value: productTable.productTableId,
      caption: `${productTable.displayFormat || 'standard'} - ${productTable.placementLocation || 'any'}`,
    }));

    return reply.code(200).send({
      success: true,
      productTables: productTableOptions,
    });
  } catch (error: unknown) {
    logger.error({ error }, "Error fetching product tables list");
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch product tables",
    });
  }
}
