import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/collections
 *
 * Fetches available product collections/categories from BigCommerce
 * Used by admin panel for collection selection
 *
 * Query params:
 * - search: Search collections by name
 * - limit: Items per page (default: 100)
 */

export default async function route({ request, reply, api, logger, connections }: RouteContext) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const search = params.get("search");
    const limit = Math.min(parseInt(params.get("limit") || "100", 10), 250);

    logger.info("Fetching collections", { search, limit });

    // Build BigCommerce API query
    const bcParams = new URLSearchParams({
      limit: limit.toString(),
      is_visible: "true"
    });

    if (search) {
      bcParams.append("name:like", search);
    }

    // Fetch categories from BigCommerce (categories are like collections)
    const response = await connections.bigcommerce.get(`/v3/catalog/categories?${bcParams.toString()}`);

    if (!response || !response.data) {
      logger.error("Failed to fetch categories from BigCommerce", { response });
      return reply.code(500).send({ error: "Failed to fetch collections" });
    }

    // Transform categories to collections format
    const collections = (response.data.data || []).map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      productCount: category.product_count || 0,
      imageUrl: category.image_url,
      parentId: category.parent_id,
    }));

    logger.info("Collections fetched successfully", { count: collections.length });

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "public, max-age=600") // Cache for 10 minutes
      .send({
        data: collections,
        meta: {
          total: response.data.meta?.pagination?.total || collections.length
        }
      });

  } catch (error) {
    logger.error("Error fetching collections", { error: error.message, stack: error.stack });
    return reply.code(500).send({ error: "Internal server error" });
  }
}
