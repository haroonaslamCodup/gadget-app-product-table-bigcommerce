import type { RouteContext } from "gadget-server";

/**
 * GET /api/page-builder-product-tables
 *
 * Public endpoint for BigCommerce Page Builder to fetch available product tables
 * Returns list in format compatible with Page Builder dropdown
 */
export default async function route({ request, reply, api }: RouteContext) {
  try {
    const params = request.query as Record<string, string>;
    const storeHash = params.storeHash;

    // Fetch all active product tables
    let productTables;

    if (storeHash) {
      // Filter by store hash if provided
      productTables = await api.productTable.findMany({
        filter: {
          isActive: { notEquals: false },
        },
        select: {
          id: true,
          productTableId: true,
          productTableName: true,
          placementLocation: true,
          displayFormat: true,
          store: {
            storeHash: true,
          }
        }
      });

      // Filter product tables for the specific store
      productTables = productTables.filter((pt: any) => pt.store?.storeHash === storeHash);
    } else {
      // Return all active product tables if no store specified
      productTables = await api.productTable.findMany({
        filter: {
          isActive: { notEquals: false },
        },
        select: {
          id: true,
          productTableId: true,
          productTableName: true,
          placementLocation: true,
          displayFormat: true,
        }
      });
    }

    // Format for BigCommerce Page Builder dropdown
    // Page Builder expects: { label, value } format
    const options = productTables.map((productTable: any) => {
      const displayInfo = [];
      if (productTable.displayFormat) displayInfo.push(productTable.displayFormat);
      if (productTable.placementLocation) displayInfo.push(productTable.placementLocation);

      return {
        label: productTable.productTableName || `Product Table ${productTable.productTableId}`,
        value: productTable.productTableId,
        caption: displayInfo.length > 0 ? displayInfo.join(' • ') : undefined,
      };
    });

    // Return in the format Page Builder expects
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .send(options);

  } catch (error: any) {
    return reply.code(500).send([
      {
        label: 'Error loading product tables',
        value: '',
        caption: 'Please check your configuration'
      }
    ]);
  }
}
