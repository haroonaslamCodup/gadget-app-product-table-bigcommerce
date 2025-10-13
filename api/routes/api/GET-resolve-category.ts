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
    // Note: BigCommerce v3 API doesn't support filtering by custom_url directly,
    // so we need to fetch and filter
    const response = await bigcommerceConnection.v3.get<any>(
      '/catalog/categories?include_fields=id,name,custom_url'
    ) as any;

    if (!response || !response.data) {
      return reply.code(404).send({
        success: false,
        error: "Could not fetch categories from BigCommerce"
      });
    }

    const categories = Array.isArray(response.data) ? response.data : [];

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
