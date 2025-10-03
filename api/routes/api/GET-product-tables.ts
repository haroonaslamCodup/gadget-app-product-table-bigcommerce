import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/product-tables
 * Returns product table configuration for storefront rendering using query parameter
 * This route is public and does NOT require authentication (used on storefront)
 */
export default async function route({ reply, api, logger, request }: RouteContext) {
  try {
    // Extract productTableId from query parameters
    const queryParams = request.query as Record<string, string>;
    const productTableId = queryParams.productTableId;

    if (!productTableId) {
      return reply.code(400).send({
        success: false,
        error: "Product Table ID is required as query parameter",
      });
    }

    // Fetch product table by productTableId (not database ID)
    const productTables = await api.productTable.findMany({
      filter: {
        productTableId: { equals: productTableId as string },
        isActive: { equals: true },
      },
      first: 1,
    });

    const productTable = productTables[0] as any;

    if (!productTable) {
      return reply.code(404).send({
        success: false,
        error: "Product Table not found or inactive",
      });
    }

    // Return only the configuration needed for rendering
    const config = {
      productTableId: productTable.productTableId,
      productTableName: productTable.productTableName,
      displayFormat: productTable.displayFormat,
      columns: productTable.columns,
      columnsOrder: productTable.columnsOrder,
      productSource: productTable.productSource,
      selectedCollections: productTable.selectedCollections,
      selectedCategories: productTable.selectedCategories,
      targetAllCustomers: productTable.targetAllCustomers,
      targetRetailOnly: productTable.targetRetailOnly,
      targetWholesaleOnly: productTable.targetWholesaleOnly,
      targetLoggedInOnly: productTable.targetLoggedInOnly,
      targetCustomerTags: productTable.targetCustomerTags,
      allowViewSwitching: productTable.allowViewSwitching,
      defaultToTableView: productTable.defaultToTableView,
      enableCustomerSorting: productTable.enableCustomerSorting,
      defaultSort: productTable.defaultSort,
      itemsPerPage: productTable.itemsPerPage,
      placementLocation: productTable.placementLocation,
    };

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "public, max-age=300")
      .send({
        success: true,
        productTable: config,
      });
  } catch (error: unknown) {
    logger.error({ error }, "Error fetching product table configuration");

    return reply
      .code(500)
      .send({
        success: false,
        error: "Failed to fetch product table configuration",
      });
  }
}