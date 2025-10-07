import type { RouteContext } from "gadget-server";
import { getPriceListForGroup, applyPricing } from "../../lib/priceListHelper";

/**
 * Route: GET /api/products (OPTIMIZED)
 *
 * Fetches products from BigCommerce with price list support
 * - Uses caching for price list data (5 min TTL)
 * - Reduces redundant API calls
 * - Optimized data processing
 *
 * Query params:
 * - category: Category ID
 * - userGroup: Customer group for pricing
 * - search: Search query
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25, max: 250)
 * - sort: Sort field (name, price-asc, price-desc, newest, oldest, sku)
 */

export default async function route({ request, reply, logger, connections, api }: RouteContext) {
  try {
    const params = request.query as Record<string, string>;
    const { categories, search, userGroup, sort = "name" } = params;
    const page = Math.max(1, parseInt(params.page || "1", 10));
    const limit = Math.min(parseInt(params.limit || "25", 10), 250);

    // Build API query
    const bcParams = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      include: "variants,images,custom_fields",
      include_fields: "id,name,sku,price,calculated_price,sale_price,inventory_level,inventory_tracking,availability,images,variants,categories,brand,description,weight,custom_url",
      is_visible: "true",
    });

    if (categories) bcParams.append("categories:in", categories);
    if (search) bcParams.append("keyword", search);

    // Add sort
    const sortMap: Record<string, [string, string]> = {
      "price-asc": ["price", "asc"],
      "price-desc": ["price", "desc"],
      "newest": ["date_created", "desc"],
      "oldest": ["date_created", "asc"],
      "sku": ["sku", "asc"],
    };

    const [sortField, sortDir] = sortMap[sort] || ["name", "asc"];
    bcParams.append("sort", sortField);
    if (sortDir) bcParams.append("direction", sortDir);

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

    // Fetch products
    const response = await bigcommerceConnection.v3.get<any>(`/catalog/products?${bcParams.toString()}`) as any;

    if (!response) {
      return reply.code(500).send({ error: "Failed to fetch products" });
    }

    // Extract products and pagination
    let products: any[] = [];
    let paginationMeta: any = null;

    if (Array.isArray(response)) {
      products = response;
      // Estimate pagination (array response doesn't include meta)
      paginationMeta = {
        total: products.length >= limit ? products.length * 2 : products.length,
        count: products.length,
        per_page: limit,
        current_page: page,
        total_pages: products.length >= limit ? page + 1 : page,
      };
    } else if (response.data && Array.isArray(response.data)) {
      products = response.data;
      paginationMeta = response.meta?.pagination;

      if (paginationMeta && !paginationMeta.total_pages && paginationMeta.total) {
        paginationMeta.total_pages = Math.ceil(paginationMeta.total / limit);
      }
    }

    // Apply price list pricing for customer groups
    if (products.length > 0) {
      try {
        // Apply price list if userGroup (customer group ID) is provided
        // This includes both logged-in customers and guests with a default customer group
        if (userGroup) {
          // Fetch price list for customer group
          const priceListRecords = await getPriceListForGroup(userGroup, bigcommerceConnection, logger);
          products = products.map(product => applyPricing(product, priceListRecords));
        } else {
          // No customer group: set calculated prices from base prices
          products = products.map(product => applyPricing(product, new Map()));
        }
      } catch (error) {
        logger.error(`Price list application failed: ${(error as Error).message}`);
        // Continue with base pricing
        products = products.map(product => applyPricing(product, new Map()));
      }
    }

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "public, max-age=300")
      .send({
        products,
        pagination: paginationMeta || {
          total: products.length,
          count: products.length,
          per_page: limit,
          current_page: page,
          total_pages: Math.ceil(products.length / limit) || 1,
        },
      });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Products API error: ${err.message}`);
    return reply.code(500).send({ error: "Internal server error" });
  }
}
