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
    const { categories, search, userGroup, sort = "name", productId, includeVariants } = params;
    const page = Math.max(1, parseInt(params.page || "1", 10));
    const limit = Math.min(parseInt(params.limit || "25", 10), 250);

    // Special handling for variant requests (PDP mode)
    if (productId && includeVariants === "true") {
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

      // Fetch product with all variants
      const productResponse = await bigcommerceConnection.v3.get<any>(
        `/catalog/products/${productId}?include=variants,images,custom_fields&include_fields=id,name,sku,price,calculated_price,sale_price,inventory_level,inventory_tracking,availability,images,variants,categories,brand,description,weight,custom_url`
      ) as any;

      if (!productResponse || (!Array.isArray(productResponse) && !productResponse.data)) {
        return reply.code(404).send({ error: "Product not found" });
      }

      const product = Array.isArray(productResponse) ? productResponse[0] : productResponse.data;

      // Transform variants into product-like objects for table display
      const variants = (product.variants || []).map((variant: any) => ({
        id: variant.id,
        product_id: product.id,
        name: `${product.name} - ${variant.option_values?.map((ov: any) => ov.label).join(', ') || 'Variant'}`,
        sku: variant.sku || product.sku,
        price: variant.price || product.price,
        calculated_price: variant.calculated_price || variant.price || product.price,
        sale_price: variant.sale_price || product.sale_price,
        inventory_level: variant.inventory_level,
        inventory_tracking: variant.inventory_tracking || product.inventory_tracking,
        availability: variant.purchasing_disabled ? 'disabled' : 'available',
        images: product.images || [],
        variant_id: variant.id,
        is_variant: true,
        option_values: variant.option_values || [],
        weight: variant.weight || product.weight,
        custom_url: product.custom_url,
      }));

      // Apply pricing for customer groups
      let processedVariants = variants;
      if (userGroup) {
        try {
          const priceListRecords = await getPriceListForGroup(userGroup, bigcommerceConnection, logger);
          processedVariants = variants.map((v: any) => applyPricing(v, priceListRecords));
        } catch (error) {
          logger.error(`Price list application failed: ${(error as Error).message}`);
          processedVariants = variants.map((v: any) => applyPricing(v, new Map()));
        }
      } else {
        processedVariants = variants.map((v: any) => applyPricing(v, new Map()));
      }

      return reply
        .code(200)
        .header("Content-Type", "application/json")
        .header("Cache-Control", "public, max-age=180")
        .send({
          products: processedVariants,
          pagination: {
            total: processedVariants.length,
            count: processedVariants.length,
            per_page: processedVariants.length,
            current_page: 1,
            total_pages: 1,
          },
        });
    }

    // Build API query for normal product listing
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
