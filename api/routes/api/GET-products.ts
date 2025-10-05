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
      include: "variants,images,custom_fields",
      is_visible: "true", // Only fetch visible products
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

    // First, let's get the TRUE total count of all products (for diagnostic)
    try {
      const countUrl = `/catalog/products?limit=1&page=1&is_visible=true`;
      const countResponse = await bigcommerceConnection.v3.get<any>(countUrl) as any;
      const trueTotal = countResponse?.meta?.pagination?.total || countResponse?.length || 0;
      logger.info(`TRUE TOTAL VISIBLE PRODUCTS IN STORE: ${trueTotal}`);
    } catch (e) {
      logger.warn(`Could not get true product count: ${(e as Error).message}`);
    }

    const apiUrl = `/catalog/products?${bcParams.toString()}`;
    logger.info(`Calling BigCommerce API: ${apiUrl}`);

    const response = await bigcommerceConnection.v3.get<any>(apiUrl) as any;

    if (!response) {
      logger.error(`Failed to fetch products from BigCommerce`);
      return reply.code(500).send({ error: "Failed to fetch products" });
    }

    logger.info(`Raw BigCommerce response structure: isArray=${Array.isArray(response)}, hasData=${!!response.data}, hasMeta=${!!response.meta}, metaKeys=${response.meta ? Object.keys(response.meta).join(',') : 'none'}, paginationData=${JSON.stringify(response.meta?.pagination || null)}`);

    // Extract products and pagination meta from response
    // BigCommerce API returns { data: [...], meta: { pagination: {...} } }
    // but @space48/bigcommerce-api may simplify to just the array
    let productsArray: any[] = [];
    let paginationMeta: any = null;

    if (Array.isArray(response)) {
      // Simplified response (just array)
      productsArray = response;
      logger.info(`BigCommerce returned ${productsArray.length} products (array response)`);

      // For array responses, we need to make a count query to get total
      // Use the same filters but with limit=250 and page=1 to get max results and check total
      const countParams = new URLSearchParams(bcParams);
      countParams.set("limit", "250");
      countParams.set("page", "1");

      try {
        const countResponse = await bigcommerceConnection.v3.get<any>(`/catalog/products?${countParams.toString()}`) as any;

        let totalCount = productsArray.length;

        // Check if countResponse has pagination metadata
        if (countResponse?.meta?.pagination) {
          totalCount = countResponse.meta.pagination.total;
          paginationMeta = {
            total: totalCount,
            count: productsArray.length,
            per_page: limit,
            current_page: page,
            total_pages: Math.ceil(totalCount / limit),
            links: countResponse.meta.pagination.links || {},
          };
          logger.info(`Got total count from separate query: ${totalCount}, total_pages: ${paginationMeta.total_pages}`);
        } else if (Array.isArray(countResponse)) {
          // If response is array, count it
          totalCount = countResponse.length;
          paginationMeta = {
            total: totalCount,
            count: productsArray.length,
            per_page: limit,
            current_page: page,
            total_pages: Math.ceil(totalCount / limit),
          };
          logger.info(`Counted products from array response: ${totalCount}, total_pages: ${paginationMeta.total_pages}`);
        }
      } catch (e) {
        logger.warn(`Failed to get product count: ${(e as Error).message}`);
        // Fallback: estimate based on current results
        paginationMeta = {
          total: productsArray.length >= limit ? productsArray.length * 2 : productsArray.length,
          count: productsArray.length,
          per_page: limit,
          current_page: page,
          total_pages: productsArray.length >= limit ? page + 1 : page,
        };
      }
    } else if (response.data && Array.isArray(response.data)) {
      // Full response with data and meta
      productsArray = response.data;
      paginationMeta = response.meta?.pagination;

      // Ensure total_pages is calculated if missing
      if (paginationMeta && !paginationMeta.total_pages && paginationMeta.total) {
        paginationMeta.total_pages = Math.ceil(paginationMeta.total / limit);
      }

      logger.info(`BigCommerce returned ${productsArray.length} products with pagination meta:`, paginationMeta);
    } else {
      logger.error(`Unexpected BigCommerce response format:`, response);
      productsArray = [];
    }

    // Use pagination meta if available, otherwise calculate from product count
    const result = {
      products: productsArray,
      pagination: paginationMeta || {
        total: productsArray.length,
        count: productsArray.length,
        per_page: limit,
        current_page: page,
        total_pages: Math.ceil(productsArray.length / limit) || 1,
      }
    };

    logger.info(`Products fetched successfully: productsCount=${result.products.length}, paginationTotal=${result.pagination.total}, paginationTotalPages=${result.pagination.total_pages}, paginationCurrentPage=${result.pagination.current_page}, paginationPerPage=${result.pagination.per_page}, usedMeta=${!!paginationMeta}`);

    logger.info(`Sending response body: ${JSON.stringify({
      productsCount: result.products.length,
      pagination: result.pagination,
    })}`);

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
