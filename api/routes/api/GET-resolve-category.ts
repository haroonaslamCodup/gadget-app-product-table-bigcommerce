import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/resolve-category
 *
 * Resolves a category URL path or slug to a category ID
 * This is needed because many BigCommerce themes don't inject category_id into window.BCData
 *
 * Query params:
 * - url: Full URL or path (e.g., "/garden/" or "https://store.com/garden/")
 * - slug: Category URL slug (e.g., "garden")
 *
 * Returns: { categoryId: "23", categoryName: "Garden", success: true }
 */

// In-memory cache to reduce API calls (5 minute TTL)
const categoryCache = new Map<string, { categoryId: string; categoryName: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function route({ request, reply, logger, connections, api }: RouteContext) {
  try {
    const params = request.query as Record<string, string>;
    const { url, slug } = params;

    if (!url && !slug) {
      return reply.code(400).send({
        success: false,
        error: "Either 'url' or 'slug' parameter is required"
      });
    }

    // Extract slug from URL if full URL is provided
    let categorySlug = slug;
    if (url && !slug) {
      // Parse URL to extract path
      const urlPath = url.startsWith('http') ? new URL(url).pathname : url;
      // Extract slug from path (e.g., "/garden/" -> "garden")
      const pathMatch = urlPath.match(/\/([^\/]+)\/?$/);
      if (pathMatch && pathMatch[1]) {
        categorySlug = pathMatch[1];
      }
    }

    if (!categorySlug) {
      return reply.code(400).send({
        success: false,
        error: "Could not extract category slug from URL"
      });
    }

    // Check cache first
    const cacheKey = categorySlug.toLowerCase();
    const cached = categoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info(`Category cache hit for slug: ${categorySlug}`);
      return reply.code(200).send({
        success: true,
        categoryId: cached.categoryId,
        categoryName: cached.categoryName,
        cached: true
      });
    }

    // Get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;
    try {
      const store = await api.internal.bigcommerce.store.findFirst();
      if (store) bigcommerceConnection = connections.bigcommerce.forStore(store);
    } catch (e) {
      logger.warn(`Store lookup failed: ${(e as Error).message}`);
    }

    if (!bigcommerceConnection) {
      return reply.code(500).send({
        success: false,
        error: "BigCommerce connection not available"
      });
    }

    logger.info(`Resolving category slug: ${categorySlug}`);

    // Fetch all categories and find matching slug
    let categories: any[] = [];

    try {
      // BigCommerce API returns a direct array (not wrapped in data property)
      const response = await bigcommerceConnection.v3.get<any>(
        '/catalog/categories'
      ) as any;

      logger.info(`BigCommerce API response type: ${typeof response}, isArray: ${Array.isArray(response)}`);

      if (!response) {
        logger.error('BigCommerce API returned null/undefined');
        return reply.code(500).send({
          success: false,
          error: "BigCommerce API returned empty response"
        });
      }

      // Handle response format
      if (Array.isArray(response)) {
        categories = response;
        logger.info(`✓ Fetched ${categories.length} categories (direct array format)`);
      } else if (response.data && Array.isArray(response.data)) {
        categories = response.data;
        logger.info(`✓ Fetched ${categories.length} categories (wrapped data format)`);
      } else {
        logger.error(`Unexpected response format: ${JSON.stringify(response).substring(0, 200)}`);
        return reply.code(500).send({
          success: false,
          error: "Unexpected response format from BigCommerce"
        });
      }

      if (categories.length === 0) {
        logger.warn('No categories found in store');
        return reply.code(404).send({
          success: false,
          error: "No categories found in store"
        });
      }

    } catch (apiError: any) {
      logger.error(`BigCommerce API error: ${apiError.message}`);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch categories from BigCommerce",
        details: apiError.message
      });
    }

    // Find category by matching URL slug
    const matchingCategory = categories.find((cat: any) => {
      if (!cat.custom_url) return false;

      // Extract slug from custom_url (e.g., "/garden/" -> "garden")
      const urlSlugMatch = cat.custom_url.url?.match(/\/([^\/]+)\/?$/);
      const catSlug = urlSlugMatch ? urlSlugMatch[1] : null;

      return catSlug?.toLowerCase() === categorySlug.toLowerCase();
    });

    if (!matchingCategory) {
      logger.warn(`No category found for slug: ${categorySlug}`);
      return reply.code(404).send({
        success: false,
        error: `Category not found for slug: ${categorySlug}`,
        availableCategories: categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          url: c.custom_url?.url
        }))
      });
    }

    // Cache the result
    categoryCache.set(cacheKey, {
      categoryId: String(matchingCategory.id),
      categoryName: matchingCategory.name,
      timestamp: Date.now()
    });

    logger.info(`Resolved category: ${matchingCategory.name} (ID: ${matchingCategory.id})`);

    return reply.code(200).send({
      success: true,
      categoryId: String(matchingCategory.id),
      categoryName: matchingCategory.name,
      categoryUrl: matchingCategory.custom_url?.url
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Category resolution error: ${err.message}`);
    return reply.code(500).send({
      success: false,
      error: "Internal server error",
      message: err.message
    });
  }
}
