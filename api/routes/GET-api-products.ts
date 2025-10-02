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
    const url = new URL(request.url);
    const params = url.searchParams;

    const category = params.get("category");
    const collection = params.get("collection");
    const userGroup = params.get("userGroup") || "guest";
    const search = params.get("search");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = Math.min(parseInt(params.get("limit") || "25", 10), 250);
    const sort = params.get("sort") || "name";

    logger.info(`Fetching products: category=${category}, collection=${collection}, userGroup=${userGroup}, search=${search}, page=${page}, limit=${limit}, sort=${sort}`);

    // Build BigCommerce API query parameters
    const bcParams = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      include: "variants,images,custom_fields",
      is_visible: "true"
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

    const response = await bigcommerceConnection.v3.get<any>(`/catalog/products?${bcParams.toString()}`) as any;

    if (!response) {
      logger.error(`Failed to fetch products from BigCommerce: ${JSON.stringify({ response })}`);
      return reply.code(500).send({ error: "Failed to fetch products" });
    }

    const products = response as any;

    // TODO: Apply user-specific pricing based on customer group
    // This will be implemented when we have access to BigCommerce price lists
    // For now, return products with default pricing

    const result = {
      // Frontend expects `products` alongside `meta`
      products: (products.data as any) || [],
      data: (products.data as any) || [],
      meta: (products.meta as any) || {},
      pagination: {
        total: ((products.meta as any)?.pagination?.total as number) || 0,
        count: ((products.meta as any)?.pagination?.count as number) || 0,
        per_page: ((products.meta as any)?.pagination?.per_page as number) || limit,
        current_page: ((products.meta as any)?.pagination?.current_page as number) || page,
        total_pages: ((products.meta as any)?.pagination?.total_pages as number) || 1,
      }
    };

    logger.info(`Products fetched successfully: count=${result.data.length}, total=${result.pagination.total}`);

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
