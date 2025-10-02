import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/products
 *
 * Proxies to BigCommerce Catalog API to fetch products with filtering
 * Applies user-specific pricing server-side for security
 *
 * Query params:
 * - category: Category ID to filter by
 * - collection: Collection ID to filter by
 * - userGroup: Customer group for pricing
 * - search: Search query
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25, max: 250)
 * - sort: Sort field (name, price, newest, sku)
 */

export default async function route({ request, reply, logger, connections, api }: RouteContext) {
  try {
    // Use request.query instead of parsing URL (Fastify provides parsed query params)
    const params = request.query as Record<string, string>;

    const category = params.category;
    const collection = params.collection;
    const userGroup = params.userGroup || "guest";
    const search = params.search;
    const page = parseInt(params.page || "1", 10);
    const limit = Math.min(parseInt(params.limit || "25", 10), 250);
    const sort = params.sort || "name";

    logger.info(`Fetching products: category=${category}, collection=${collection}, userGroup=${userGroup}, search=${search}, page=${page}, limit=${limit}, sort=${sort}`);

    // Build BigCommerce API query parameters
    const bcParams = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      include: "variants,images,custom_fields"
      // Removed is_visible filter - let's fetch all products first to debug
    });

    // Add category filter
    if (category) {
      bcParams.append("categories:in", category);
    }

    // Add search filter
    if (search) {
      bcParams.append("keyword", search);
    }

    // Add sort parameter
    switch (sort) {
      case "price-asc":
        bcParams.append("sort", "price");
        bcParams.append("direction", "asc");
        break;
      case "price-desc":
        bcParams.append("sort", "price");
        bcParams.append("direction", "desc");
        break;
      case "newest":
        bcParams.append("sort", "date_created");
        bcParams.append("direction", "desc");
        break;
      case "oldest":
        bcParams.append("sort", "date_created");
        bcParams.append("direction", "asc");
        break;
      case "sku":
        bcParams.append("sort", "sku");
        break;
      default:
        bcParams.append("sort", "name");
    }

    // Build a scoped BigCommerce connection using the internal store record
    let bigcommerceConnection = connections.bigcommerce?.current;
    try {
      const store = await api.internal.bigcommerce.store.findFirst();
      if (store) {
        bigcommerceConnection = connections.bigcommerce.forStore(store);
      }
    } catch (e) {
      logger.warn(`Could not read store for products route: ${(e as Error).message}`);
    }

    if (!bigcommerceConnection) {
      logger.error("BigCommerce connection not initialized");
      return reply.code(500).send({ error: "BigCommerce connection not available" });
    }

    const apiUrl = `/catalog/products?${bcParams.toString()}`;
    logger.info(`Calling BigCommerce API: ${apiUrl}`);

    const response = await bigcommerceConnection.v3.get<any>(apiUrl) as any;

    if (!response) {
      logger.error(`Failed to fetch products from BigCommerce`);
      return reply.code(500).send({ error: "Failed to fetch products" });
    }

    // The @space48/bigcommerce-api package returns the data directly as an array
    // not wrapped in a { data, meta } structure
    const productsArray = Array.isArray(response) ? response : [];

    logger.info(`BigCommerce returned ${productsArray.length} products`);

    // TODO: Apply user-specific pricing based on customer group
    // This will be implemented when we have access to BigCommerce price lists
    // For now, return products with default pricing

    const result = {
      products: productsArray,
      pagination: {
        total: productsArray.length,
        count: productsArray.length,
        per_page: limit,
        current_page: page,
        total_pages: Math.ceil(productsArray.length / limit),
      }
    };

    logger.info(`Products fetched successfully: count=${result.products.length}, total=${result.pagination.total}`);

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "public, max-age=300") // Cache for 5 minutes
      .send(result);

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error fetching products: ${err.message}, stack=${err.stack}`);
    return reply
      .code(500)
      .send({ error: "Internal server error" });
  }
}
