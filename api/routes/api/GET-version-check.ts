import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/version-check
 *
 * Compares product table version with latest available version
 * Returns update availability and changelog information
 *
 * Query params:
 * - productTableId: Product table ID
 * - currentVersion: Current version of the product table
 */

export default async function route({ request, reply, api, logger }: RouteContext) {
  try {
    // Use request.query instead of parsing URL (Fastify provides parsed query params)
    const params = request.query as Record<string, string>;

    const productTableId = params.productTableId;
    const currentVersion = params.currentVersion || "0.0.0";

    logger.info(`Checking product table version: productTableId=${productTableId}, currentVersion=${currentVersion}`);

    // Define version metadata (this would typically come from a config or database)
    const VERSION_METADATA: Record<string, {
      version: string;
      releaseDate: string;
      changelog: string[];
      breakingChanges: boolean;
      requiredUpdate: boolean;
    }> = {
      "1.0.39": {
        version: "1.0.39",
        releaseDate: "2025-01-15",
        changelog: [
          "Added product table dropdown selector in Page Builder",
          "Enhanced admin UI with embed code generator",
          "Improved product table configuration flow",
          "BigCommerce theme integration with CSS variables",
          "Dynamic product table loading from database"
        ],
        breakingChanges: false,
        requiredUpdate: false,
      },
      "1.0.0": {
        version: "1.0.0",
        releaseDate: "2024-12-01",
        changelog: [
          "Initial release",
          "Product table with customer group pricing",
          "Multi-location placement support",
          "Customizable columns and display formats"
        ],
        breakingChanges: false,
        requiredUpdate: false,
      }
    };

    // Get latest version metadata
    const LATEST_VERSION = "1.0.39";
    const latestMetadata = VERSION_METADATA[LATEST_VERSION];

    // Compare versions
    const updateAvailable = compareVersions(currentVersion, LATEST_VERSION) < 0;

    const versionInfo = {
      productTableId,
      currentVersion,
      latestVersion: LATEST_VERSION,
      updateAvailable,
      changelog: latestMetadata.changelog,
      releaseDate: latestMetadata.releaseDate,
      breakingChanges: latestMetadata.breakingChanges,
      requiredUpdate: latestMetadata.requiredUpdate,
    };

    // If product table ID is provided, update lastChecked timestamp
    if (productTableId) {
      try {
        const productTable = await api.productTable.findFirst({
          filter: { productTableId: { equals: productTableId } }
        });

        if (productTable) {
          await api.productTable.update(productTable.id, {
            lastChecked: new Date(),
          });
        }
      } catch (updateError: unknown) {
        const err = updateError as Error;
        logger.warn(`Failed to update lastChecked timestamp: productTableId=${productTableId}, error=${err.message}`);
      }
    }

    logger.info(`Version check completed: ${JSON.stringify(versionInfo)}`);

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "public, max-age=3600") // Cache for 1 hour
      .send(versionInfo);

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error checking version: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({ error: "Internal server error" });
  }
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}
